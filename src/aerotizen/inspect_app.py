"""Launch an app on the TV with its web inspector and expose it on localhost.

  aerotizen-inspect <tv-ip> DclHome001.Home [9222]

Then open http://localhost:9222/json for the DevTools target, or point a
Chrome DevTools Protocol client at it. Ctrl+C to stop.
"""

import sys
import time
import urllib.request

from aerotizen.sdb import Sdb


def main():
    host, app_id = sys.argv[1], sys.argv[2]
    local = int(sys.argv[3]) if len(sys.argv) > 3 else 9222
    try:  # debug launch only works when the app isn't already running
        urllib.request.urlopen(
            urllib.request.Request(f"http://{host}:8001/api/v2/applications/{app_id}", method="DELETE"),
            timeout=5,
        )
        time.sleep(2)
    except Exception:
        pass
    keep = Sdb(host, timeout=60).connect()
    port = keep.debug_launch(app_id)
    print(f"inspector: TV port {port} -> http://localhost:{local}/json", flush=True)
    keep.forward(local, port)


if __name__ == "__main__":
    main()
