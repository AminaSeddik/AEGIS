import argparse, json, time, urllib.request
NODES = {
  "ICU-Vitals": {"host": "icu-ecg-01", "dept_id": "icu", "sensor": "DS18B20+AD8232"},
  "ER-Vitals":  {"host": "er-vit-01",  "dept_id": "er",  "sensor": "MAX30102+AD8232"},
}
def beat(node_id, url, packets=None):
    m = NODES.get(node_id, {})
    body = {"node_id": node_id, "host": m.get("host", node_id), "dept_id": m.get("dept_id"),
            "sensor": m.get("sensor"), "encrypting": True, "rssi": -55, "packets": packets}
    try:
        r = urllib.request.Request(url.rstrip("/") + "/api/dash/node/heartbeat",
            data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(r, timeout=4); return True
    except Exception as e:
        print("beat failed:", e); return False
if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:8055")
    ap.add_argument("--interval", type=float, default=5.0)
    ap.add_argument("--demo", action="store_true")
    a = ap.parse_args()
    print(f"heartbeating {list(NODES)} -> {a.url} every {a.interval}s (Ctrl+C to stop)")
    n = 0
    while True:
        for nid in NODES:
            if beat(nid, a.url, n): print("beat", nid, "->", NODES[nid]["host"])
        n += 1; time.sleep(a.interval)
