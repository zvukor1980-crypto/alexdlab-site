#!/usr/bin/env python3
"""RepairLab Bridge for macOS. Local-only controller for Apple Configurator."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import json, os, plistlib, secrets, subprocess, threading, time, webbrowser

HOST, PORT = "127.0.0.1", 18473
SITE = "https://alexdlab.com"
ALLOWED_ORIGINS = {SITE, "http://127.0.0.1:4173", "http://localhost:4173"}
CFGUTIL = "/Applications/Apple Configurator.app/Contents/MacOS/cfgutil"
TOKEN = secrets.token_urlsafe(24)
jobs = {}
DETAIL_PROPERTIES = ["name","deviceType","serialNumber","IMEI","IMEI2","humanReadableProductVersion",
    "buildVersion","firmwareVersion","batteryCurrentCapacity","batteryIsCharging","totalDiskCapacity",
    "freeDiskSpace","activationState","bootedState","isPaired","isRestorable","isSupervised",
    "passcodeProtected","cloudBackupsAreEnabled","color","enclosureColor","language","locale","ECID","UDID"]

def run(args, timeout=12):
    return subprocess.run(args, capture_output=True, text=True, timeout=timeout, check=False)

def usb_mode():
    p = run(["/usr/sbin/system_profiler", "SPUSBDataType", "-xml"], 15)
    text = p.stdout.lower()
    if "dfu mode" in text or "apple mobile device (dfu" in text: return "dfu"
    if "recovery mode" in text or "apple mobile device (recovery" in text: return "recovery"
    if "iphone" in text: return "normal"
    return "disconnected"

def status():
    devices = []
    if os.path.exists(CFGUTIL):
        p = run([CFGUTIL, "--format", "JSON", "--timeout", "1", "list"], 5)
        try:
            payload = json.loads(p.stdout)
            ids, output = payload.get("Devices", []), payload.get("Output", {})
            devices = [dict(output.get(ecid, {}), ECID=ecid) for ecid in ids]
        except Exception: pass
    mode = usb_mode()
    if mode == "disconnected" and devices: mode = "normal"
    return {"ok": True, "bridge": "1.0", "mode": mode, "devices": devices,
            "configurator": os.path.exists(CFGUTIL), "busy": any(v["state"]=="running" for v in jobs.values())}

def device_details():
    current = status()["devices"]
    if len(current) != 1: raise ValueError("Подключите ровно один разблокированный iPhone")
    ecid = current[0]["ECID"]
    p = run([CFGUTIL,"--format","JSON","--timeout","5","--ecid",ecid,"get",*DETAIL_PROPERTIES],30)
    try: values = json.loads(p.stdout).get("Output",{}).get(ecid,{})
    except Exception: values = {}
    if not values: raise ValueError("Разблокируйте iPhone и подтвердите «Доверять этому компьютеру»")
    return {"ok":True,"mode":usb_mode() if usb_mode()!="disconnected" else "normal","device":values}

def start_job(action):
    connected = status()["devices"]
    if len(connected) != 1:
        raise ValueError("Подключите ровно один iPhone перед операцией")
    job_id = secrets.token_hex(6)
    jobs[job_id] = {"state":"running", "action":action, "started":time.time(), "output":""}
    def worker():
        ecid = connected[0].get("ECID") or connected[0].get("ecid")
        selector = ["--ecid", str(ecid)] if ecid else ["--foreach"]
        command = [CFGUTIL, "--format", "JSON", "--progress", *selector, action]
        try:
            p = run(command, 7200)
            jobs[job_id].update(state="done" if p.returncode == 0 else "error",
                                code=p.returncode, output=(p.stdout+p.stderr)[-12000:])
        except Exception as e: jobs[job_id].update(state="error", output=str(e))
    threading.Thread(target=worker, daemon=True).start()
    return job_id

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass
    def headers_json(self, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin") if self.headers.get("Origin") in ALLOWED_ORIGINS else SITE)
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-RepairLab-Token")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
    def allowed(self):
        return self.headers.get("Origin") in ALLOWED_ORIGINS and self.headers.get("X-RepairLab-Token") == TOKEN
    def send_json(self, value, code=200):
        self.headers_json(code); self.wfile.write(json.dumps(value, ensure_ascii=False).encode())
    def do_OPTIONS(self):
        if self.headers.get("Origin") not in ALLOWED_ORIGINS: return self.send_json({"error":"origin"},403)
        self.send_response(204); self.send_header("Access-Control-Allow-Origin",self.headers.get("Origin"))
        self.send_header("Access-Control-Allow-Headers","Content-Type, X-RepairLab-Token")
        self.send_header("Access-Control-Allow-Methods","GET, POST, OPTIONS"); self.end_headers()
    def do_GET(self):
        if not self.allowed(): return self.send_json({"error":"unauthorized"},403)
        path=urlparse(self.path).path
        if path=="/status": return self.send_json(status())
        if path=="/device/details":
            try: return self.send_json(device_details())
            except ValueError as e: return self.send_json({"error":str(e)},400)
        if path.startswith("/job/"): return self.send_json(jobs.get(path.rsplit('/',1)[-1],{"error":"not found"}),404 if path.rsplit('/',1)[-1] not in jobs else 200)
        return self.send_json({"error":"not found"},404)
    def do_POST(self):
        if not self.allowed(): return self.send_json({"error":"unauthorized"},403)
        length=min(int(self.headers.get("Content-Length","0")),4096)
        try: body=json.loads(self.rfile.read(length) or b"{}")
        except Exception: body={}
        path=urlparse(self.path).path
        if path=="/open/finder": subprocess.Popen(["/usr/bin/open","-a","Finder"]); return self.send_json({"ok":True})
        if path=="/open/configurator": subprocess.Popen(["/usr/bin/open","-a","Apple Configurator"]); return self.send_json({"ok":True})
        if path=="/action/update":
            try: return self.send_json({"ok":True,"job":start_job("update")},202)
            except ValueError as e: return self.send_json({"error":str(e)},400)
        if path=="/action/restore":
            if body.get("confirmation") != "СТЕРЕТЬ IPHONE": return self.send_json({"error":"confirmation required"},400)
            try: return self.send_json({"ok":True,"job":start_job("restore")},202)
            except ValueError as e: return self.send_json({"error":str(e)},400)
        return self.send_json({"error":"not found"},404)

if __name__ == "__main__":
    print("RepairLab Bridge запущен. Не закрывайте это окно во время операции.")
    url=f"https://alexdlab.com/service/#bridge={PORT}&token={TOKEN}"
    webbrowser.open(url)
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
