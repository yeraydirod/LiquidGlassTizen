"""Samsung Smart TV remote over the local network (port 8002, no Developer Mode needed).

The first connection shows an Allow/Deny prompt on the TV; the token it returns
is cached so later connections are silent.
"""

import base64
import hashlib
import json
import os
import shutil
import socket
import ssl
import time
import urllib.request

import websocket

CLIENT_NAME = base64.b64encode(b"LiquidGlassTizen").decode()
CONFIG_DIR = os.path.join(os.path.expanduser("~"), ".config", "lgtizen")
LEGACY_CONFIG_DIR = os.path.join(os.path.expanduser("~"), ".config", "aerotizen")


def migrate_legacy_config(new=None, old=None):
    """Bring certificates and remote tokens over from an AeroTizen install, once.

    Without this, people switching over would have to sign in to Samsung and recreate
    their certificates. The old folder is copied, never moved or deleted.
    """
    new, old = new or CONFIG_DIR, old or LEGACY_CONFIG_DIR
    if os.path.exists(new) or not os.path.isdir(old):
        return False
    shutil.copytree(old, new)
    os.chmod(new, 0o700)
    return True


def _write_private(path, text):
    os.makedirs(os.path.dirname(path), mode=0o700, exist_ok=True)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write(text)


class CertificateChanged(RuntimeError):
    pass


def check_pin(pin_file, der_cert):
    """Trust the TV's self-signed certificate on first use, then insist on the same one.

    The TV's remote port uses a certificate no CA can vouch for, so verification has to be
    off. Remembering its fingerprint means a different machine answering on the TV's
    address later (someone on the network impersonating it) is refused instead of being
    handed the remote token.
    """
    if not der_cert:
        return
    fingerprint = hashlib.sha256(der_cert).hexdigest()
    try:
        with open(pin_file) as f:
            known = f.read().strip()
    except FileNotFoundError:
        _write_private(pin_file, fingerprint)
        return
    if known != fingerprint:
        raise CertificateChanged(
            "The TV's certificate is not the one seen before. If the TV was reset or updated, "
            f"delete {pin_file} and try again; otherwise something else may be answering at this address."
        )


def info(host):
    try:
        return json.load(urllib.request.urlopen(f"http://{host}:8001/api/v2/", timeout=5))["device"]
    except OSError as e:
        raise SystemExit(
            f"Can't reach the TV at {host} ({getattr(e, 'reason', e)}). Is it on and finished booting?"
        ) from e


def app_status(host, app_id):
    try:
        return json.load(
            urllib.request.urlopen(f"http://{host}:8001/api/v2/applications/{app_id}", timeout=3)
        )
    except Exception:
        return None


class Remote:
    def __init__(self, host, timeout=30, port=8002):
        self.host, self.timeout, self.port = host, timeout, port
        self.token_file = os.path.join(CONFIG_DIR, f"{host}.token")
        self.pin_file = os.path.join(CONFIG_DIR, f"{host}.pin")
        self.ws = None

    def _token(self):
        try:
            with open(self.token_file) as f:
                return f.read().strip()
        except FileNotFoundError:
            return None

    def connect(self):
        url = f"wss://{self.host}:{self.port}/api/v2/channels/samsung.remote.control?name={CLIENT_NAME}"
        token = self._token()
        if token:
            url += f"&token={token}"
        # Open the TLS connection ourselves and check the TV's certificate before the
        # WebSocket request (which carries the token) is sent over it.
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        raw = socket.create_connection((self.host, self.port), timeout=self.timeout)
        tls = ctx.wrap_socket(raw, server_hostname=self.host)
        try:
            check_pin(self.pin_file, tls.getpeercert(binary_form=True))
        except CertificateChanged:
            tls.close()
            raise
        self.ws = websocket.create_connection(url, timeout=self.timeout, socket=tls)
        msg = json.loads(self.ws.recv())
        if msg.get("event") != "ms.channel.connect":
            raise RuntimeError(f"TV refused the remote connection: {msg.get('event')}")
        new_token = msg.get("data", {}).get("token")
        if new_token and new_token != token:
            _write_private(self.token_file, new_token)
        return self

    def close(self):
        if self.ws:
            time.sleep(0.3)
            self.ws.close()

    def __enter__(self):
        return self.connect()

    def __exit__(self, *exc):
        self.close()

    def key(self, key, times=1, delay=0.25):
        for _ in range(times):
            self.ws.send(
                json.dumps(
                    {
                        "method": "ms.remote.control",
                        "params": {
                            "Cmd": "Click",
                            "DataOfCmd": key,
                            "Option": "false",
                            "TypeOfRemote": "SendRemoteKey",
                        },
                    }
                )
            )
            time.sleep(delay)

    def hold(self, key, seconds=1.0):
        """Press and hold a remote button (e.g. a long-press on OK)."""

        def send(cmd):
            self.ws.send(
                json.dumps(
                    {
                        "method": "ms.remote.control",
                        "params": {
                            "Cmd": cmd,
                            "DataOfCmd": key,
                            "Option": "false",
                            "TypeOfRemote": "SendRemoteKey",
                        },
                    }
                )
            )

        send("Press")
        time.sleep(seconds)
        send("Release")

    def keys(self, sequence, delay=0.6):
        """Send a list like ["KEY_HOME", ("KEY_DOWN", 3), "KEY_ENTER"]."""
        for step in sequence:
            if isinstance(step, (int, float)):
                time.sleep(step)
                continue
            key, times = (step, 1) if isinstance(step, str) else step
            self.key(key, times, delay)

    def launch(self, app_id):
        self.ws.send(
            json.dumps(
                {
                    "method": "ms.channel.emit",
                    "params": {
                        "event": "ed.apps.launch",
                        "to": "host",
                        "data": {"appId": app_id, "action_type": "DEEP_LINK"},
                    },
                }
            )
        )
