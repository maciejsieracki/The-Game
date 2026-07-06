#!/usr/bin/env python3
# test-panel-c-roundtrip.py — probe Excel -> export-c -> combat-params (temp dir)
import json
import os
import shutil
import subprocess
import sys
import tempfile

try:
    import openpyxl
except ImportError:
    print("SKIP: brak openpyxl")
    sys.exit(0)

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
PANEL = os.path.join(os.path.dirname(__file__), "Panel-C.xlsx")
EXPORT = os.path.join(os.path.dirname(__file__), "export-c.py")
DATA = os.path.join(ROOT, "gra", "data")


def fail(msg):
    print(f"FAIL: {msg}")
    sys.exit(1)


def main():
    if not os.path.isfile(PANEL):
        fail("brak Panel-C.xlsx — uruchom gen-panel-c.py")

    with tempfile.TemporaryDirectory() as tmp:
        data_dir = os.path.join(tmp, "data")
        shutil.copytree(DATA, data_dir)
        xlsx = os.path.join(tmp, "Panel-C.xlsx")
        shutil.copy(PANEL, xlsx)

        params_path = os.path.join(data_dir, "combat-params.json")
        before = json.load(open(params_path, encoding="utf-8"))["tw_v3"]["hit_base"]
        probe = before + 1

        wb = openpyxl.load_workbook(xlsx)
        ws = wb["Stale-walki"]
        for r in range(2, ws.max_row + 1):
            if ws.cell(r, 1).value == "C-TW-HIT-BASE":
                ws.cell(r, 4, probe)
                break
        else:
            fail("nie znaleziono C-TW-HIT-BASE")
        wb.save(xlsx)

        r = subprocess.run(
            [sys.executable, EXPORT, "--xlsx", xlsx, "--data-dir", data_dir],
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            fail(r.stderr or r.stdout)

        after = json.load(open(params_path, encoding="utf-8"))["tw_v3"]["hit_base"]
        if after != probe:
            fail(f"round-trip: oczekiwano {probe}, jest {after}")

    print("OK: panel-c round-trip")


if __name__ == "__main__":
    main()
