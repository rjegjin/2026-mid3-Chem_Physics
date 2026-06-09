#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shutil
import socket
import subprocess
import sys
import time
from contextlib import closing
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from urllib.parse import quote


ROOT = Path(__file__).resolve().parent
TMP_DIR = ROOT / "tmp_checks"
TOOLS_DIR = ROOT / "tools"
CHROMIUM = shutil.which("chromium-browser") or shutil.which("chromium")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return


def find_free_port() -> int:
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def start_server(root: Path, port: int) -> tuple[ThreadingHTTPServer, Thread]:
    os.chdir(root)
    server = ThreadingHTTPServer(("127.0.0.1", port), QuietHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, thread


def run_chromium(args: list[str], timeout: int = 30) -> subprocess.CompletedProcess[str]:
    if not CHROMIUM:
        raise RuntimeError("chromium-browser not found")
    cmd = [CHROMIUM, "--headless", "--disable-gpu", "--no-sandbox"] + args
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, check=False)


def screenshot(url: str, outfile: Path, width: int, height: int) -> None:
    result = run_chromium(
        [f"--window-size={width},{height}", f"--screenshot={outfile}", url],
        timeout=40,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "screenshot failed")


def dump_dom(url: str, virtual_time_budget: int = 5000) -> str:
    result = run_chromium([f"--virtual-time-budget={virtual_time_budget}", "--dump-dom", url], timeout=40)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "dump-dom failed")
    return result.stdout


def extract_json(dom: str) -> dict:
    marker = '<pre id="result">'
    start = dom.find(marker)
    if start == -1:
        raise RuntimeError("render audit output not found in DOM")
    start += len(marker)
    end = dom.find("</pre>", start)
    if end == -1:
        raise RuntimeError("render audit closing tag not found")
    content = dom[start:end]
    content = (
        content.replace("&quot;", '"')
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )
    return json.loads(content)


def main() -> int:
    parser = argparse.ArgumentParser(description="Render and audit one HTML file with Chromium.")
    parser.add_argument("target", help="Target HTML path relative to repo root, e.g. 8_uniform_motion.html")
    parser.add_argument("--delay-ms", type=int, default=1800, help="Wait time after load before auditing")
    parser.add_argument("--out-dir", default="tmp_checks", help="Output directory relative to repo root")
    args = parser.parse_args()

    target = Path(args.target)
    if target.is_absolute():
        target = target.relative_to(ROOT)
    target_path = ROOT / target
    if not target_path.exists():
        print(f"Target not found: {target}", file=sys.stderr)
        return 2

    out_dir = ROOT / args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = target.stem

    port = find_free_port()
    server, thread = start_server(ROOT, port)
    time.sleep(0.2)

    try:
        target_url = f"http://127.0.0.1:{port}/{quote(target.as_posix())}"
        target_value = "/" + target.as_posix()
        target_all_value = target_value + "?view=all"
        audit_url = (
            f"http://127.0.0.1:{port}/tools/render_audit.html"
            f"?target={quote(target_value, safe='/')}&delay_ms={args.delay_ms}"
        )
        audit_mobile_url = (
            f"http://127.0.0.1:{port}/tools/render_audit.html"
            f"?target={quote(target_all_value, safe='/')}&delay_ms={args.delay_ms}"
        )

        desktop_png = out_dir / f"{stem}_desktop.png"
        mobile_png = out_dir / f"{stem}_mobile.png"
        all_desktop_png = out_dir / f"{stem}_all_desktop.png"
        all_mobile_png = out_dir / f"{stem}_all_mobile.png"
        desktop_json = out_dir / f"{stem}_desktop_audit.json"
        mobile_json = out_dir / f"{stem}_mobile_audit.json"

        screenshot(target_url, desktop_png, 1440, 2200)
        screenshot(target_url, mobile_png, 430, 2400)
        screenshot(f"{target_url}?view=all", all_desktop_png, 1440, 12000)
        screenshot(f"{target_url}?view=all", all_mobile_png, 430, 14000)

        desktop_report = extract_json(dump_dom(audit_url))
        mobile_report = extract_json(dump_dom(audit_mobile_url))
        desktop_json.write_text(json.dumps(desktop_report, ensure_ascii=False, indent=2), encoding="utf-8")
        mobile_json.write_text(json.dumps(mobile_report, ensure_ascii=False, indent=2), encoding="utf-8")

        summary = {
            "target": target.as_posix(),
            "desktop_ok": desktop_report.get("ok", False),
            "mobile_ok": mobile_report.get("ok", False),
            "desktop_json": str(desktop_json.relative_to(ROOT)),
            "mobile_json": str(mobile_json.relative_to(ROOT)),
            "screenshots": [
                str(desktop_png.relative_to(ROOT)),
                str(mobile_png.relative_to(ROOT)),
                str(all_desktop_png.relative_to(ROOT)),
                str(all_mobile_png.relative_to(ROOT)),
            ],
        }
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return 0 if summary["desktop_ok"] and summary["mobile_ok"] else 1
    finally:
        server.shutdown()
        thread.join(timeout=2)
        server.server_close()


if __name__ == "__main__":
    raise SystemExit(main())
