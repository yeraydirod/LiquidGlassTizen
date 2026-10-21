"""The hardening added on top of AeroTizen: each test pins one of the fixes in place."""

import base64
import datetime
import hashlib
import json
import os
import socket
import ssl
import stat
import threading
import urllib.parse
import urllib.request

import pytest
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID

from lgtizen import certs, cli, remote
from lgtizen.sdb import Sdb, SdbError

# -- ids that reach the TV's shell ------------------------------------------------


@pytest.mark.parametrize("bad", ["abc; reboot", "LqGlass001.Home x", "../../etc", "", "a" * 200])
def test_sdb_refuses_odd_ids_before_talking_to_the_tv(bad):
    client = Sdb("127.0.0.1")  # never connected: the check must happen first
    for call in (client.uninstall, client.launch, lambda v: client.install(v, b"", "/tmp")):
        with pytest.raises(SdbError, match="refusing"):
            call(bad)


def test_install_accepts_the_launcher_id(fake_tv):
    tv = fake_tv({"0 vd_appinstall LqGlass001.Home /tmp/LqGlass001.wgt": "installed\n"})
    with Sdb("127.0.0.1", port=tv.port, timeout=5) as client:
        assert "installed" in client.install("LqGlass001.Home", b"wgt", "/tmp")


def test_app_id_of_rejects_a_crafted_config(tmp_path):
    (tmp_path / "config.xml").write_text('<tizen:application id="abcdefghij.App;reboot" package="x"/>')
    with pytest.raises(SystemExit, match="unusual app id"):
        cli.app_id_of(str(tmp_path))


def test_app_id_of_reads_the_real_launcher():
    here = os.path.dirname(__file__)
    assert cli.app_id_of(os.path.join(here, "..", "launcher")) == "LqGlass001.Home"


# -- files with secrets -----------------------------------------------------------


def test_private_files_are_owner_only(tmp_path):
    path = tmp_path / "password.txt"
    certs._write_private(str(path), b"secret")
    assert path.read_bytes() == b"secret"
    if os.name == "posix":
        assert stat.S_IMODE(path.stat().st_mode) == 0o600


def test_legacy_config_is_copied_once(tmp_path):
    old, new = tmp_path / "aerotizen", tmp_path / "lgtizen"
    (old / "certs" / "DUID").mkdir(parents=True)
    (old / "certs" / "DUID" / "distributor.p12").write_bytes(b"p12")
    assert remote.migrate_legacy_config(str(new), str(old)) is True
    assert (new / "certs" / "DUID" / "distributor.p12").read_bytes() == b"p12"
    assert (old / "certs" / "DUID" / "distributor.p12").exists()  # never moved
    assert remote.migrate_legacy_config(str(new), str(old)) is False


# -- Samsung sign-in state ---------------------------------------------------------


def _sign_in(monkeypatch, tamper):
    def fake_browser(url):
        state = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)["state"][0]
        assert state != certs.LEGACY_STATE and len(state) == 32
        body = urllib.parse.urlencode(
            {
                "state": "attacker" if tamper else state,
                "code": json.dumps({"access_token": "T", "userId": "U"}),
            }
        ).encode()

        def post():
            try:
                urllib.request.urlopen(
                    f"http://localhost:{certs.CALLBACK_PORT}{certs.CALLBACK_PATH}", data=body, timeout=5
                )
            except urllib.error.HTTPError:
                pass

        threading.Thread(target=post, daemon=True).start()

    monkeypatch.setattr(certs.webbrowser, "open", fake_browser)
    monkeypatch.setattr("builtins.print", lambda *a, **k: None)
    return certs.samsung_login(timeout=10)


def test_sign_in_accepts_its_own_state(monkeypatch):
    assert _sign_in(monkeypatch, tamper=False)["access_token"] == "T"


def test_sign_in_rejects_a_foreign_state(monkeypatch):
    with pytest.raises(SystemExit, match="did not complete"):
        _sign_in(monkeypatch, tamper=True)


# -- remote control: certificate pinning -----------------------------------------


def _self_signed(tmp_path, name):
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, name)])
    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(minutes=1))
        .not_valid_after(now + datetime.timedelta(days=1))
        .sign(key, hashes.SHA256())
    )
    cert_path, key_path = tmp_path / f"{name}.crt", tmp_path / f"{name}.key"
    cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    key_path.write_bytes(
        key.private_bytes(
            serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
        )
    )
    return str(cert_path), str(key_path)


class FakeRemoteTV:
    """Just enough of the TV's wss://:8002 remote channel to hand out a token."""

    def __init__(self, cert, key):
        self.ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        self.ctx.load_cert_chain(cert, key)
        self.sock = socket.socket()
        self.sock.bind(("127.0.0.1", 0))
        self.sock.listen(1)
        self.port = self.sock.getsockname()[1]
        self.requests = []
        threading.Thread(target=self._serve, daemon=True).start()

    def _serve(self):
        conn, _ = self.sock.accept()
        self.sock.close()
        try:
            with self.ctx.wrap_socket(conn, server_side=True) as tls:
                self._answer(tls)
        except (ssl.SSLError, OSError):
            pass
        finally:
            conn.close()

    def _answer(self, tls):
        request = tls.recv(4096).decode(errors="replace")
        if not request:
            return
        self.requests.append(request)
        key = next(
            ln.split(":", 1)[1].strip()
            for ln in request.split("\r\n")
            if ln.lower().startswith("sec-websocket-key")
        )
        accept = base64.b64encode(
            hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()
        )
        tls.sendall(
            b"HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
            b"Sec-WebSocket-Accept: " + accept + b"\r\n\r\n"
        )
        payload = json.dumps({"event": "ms.channel.connect", "data": {"token": "TOKEN1"}}).encode()
        tls.sendall(bytes([0x81, len(payload)]) + payload)
        tls.recv(1024)  # wait for the client to hang up


def test_remote_pins_the_tv_and_refuses_an_impostor(tmp_path, monkeypatch):
    monkeypatch.setattr(remote, "CONFIG_DIR", str(tmp_path / "cfg"))
    real = FakeRemoteTV(*_self_signed(tmp_path, "tv"))
    r = remote.Remote("127.0.0.1", timeout=5, port=real.port).connect()
    r.ws.close()
    assert (tmp_path / "cfg" / "127.0.0.1.token").read_text() == "TOKEN1"
    assert (tmp_path / "cfg" / "127.0.0.1.pin").exists()

    impostor = FakeRemoteTV(*_self_signed(tmp_path, "impostor"))
    with pytest.raises(remote.CertificateChanged):
        remote.Remote("127.0.0.1", timeout=5, port=impostor.port).connect()
    assert impostor.requests == []  # the token was never sent
