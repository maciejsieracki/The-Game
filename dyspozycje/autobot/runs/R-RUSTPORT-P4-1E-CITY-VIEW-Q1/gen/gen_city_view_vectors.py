#!/usr/bin/env python3
"""R-RUSTPORT-P4-1E-CITY-VIEW-Q1: generator wektorow widoku miast z webu na pinie 07d2fbd72.

Kroki:
 1. `git archive <pin> gra/src gra/data` do katalogu tymczasowego (repo nietkniete);
 2. `tsc` (CommonJS, bez zmian w zrodle pinu) dla plikow wymienionych w FILES;
 3. `node harness.cjs <out> scenarios.json` -> wartosci oczekiwane liczone kodem pinu;
 4. wpis blokiem miedzy znacznikami w `rust-port/engine/tests/view_city_pin_vectors.rs`.

Uzycie (z dowolnego miejsca w repo):
  python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/gen_city_view_vectors.py          # zapis
  python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/gen/gen_city_view_vectors.py --check  # exit 1 przy roznicy
"""
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import io

PIN = "07d2fbd72"
FILES = [
    "src/render/cities.ts",
    "src/game/display-names.ts",
    "src/game/production.ts",
    "src/game/building-stock-cost.ts",
    "src/game/city-fortification.ts",
    "src/game/civ-visual.ts",
    "src/render/bronzeCity.ts",
    "src/render/cityMapStatChip.ts",
    "src/game/capital-capture.ts",
    "src/game/diplomacy-treaties.ts",
    "src/game/barbarians.ts",
]
BEGIN = "// BEGIN GENERATED (gen_city_view_vectors.py) -- nie edytowac recznie\n"
END = "// END GENERATED\n"
TEST_REL = "rust-port/engine/tests/view_city_pin_vectors.rs"


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)


def main() -> int:
    check = "--check" in sys.argv[1:]
    here = os.path.dirname(os.path.abspath(__file__))
    repo = run(["git", "rev-parse", "--show-toplevel"], cwd=here).stdout.decode().strip()
    tsc = shutil.which("tsc") or "/opt/node22/bin/tsc"
    node = shutil.which("node") or "node"
    tmp = tempfile.mkdtemp(prefix="p4-1e-")
    try:
        tar_bytes = run(["git", "-C", repo, "archive", PIN, "gra/src", "gra/data"]).stdout
        with tarfile.open(fileobj=io.BytesIO(tar_bytes)) as tf:
            tf.extractall(tmp, filter="data")
        gra = os.path.join(tmp, "gra")
        tsconfig = {
            "compilerOptions": {
                "target": "ES2022",
                "module": "commonjs",
                "moduleResolution": "node10",
                "ignoreDeprecations": "6.0",
                "lib": ["ES2022", "DOM"],
                "strict": False,
                "resolveJsonModule": True,
                "esModuleInterop": True,
                "skipLibCheck": True,
                "noEmitOnError": False,
                "outDir": "out",
                "rootDir": ".",
                "types": [],
            },
            "files": FILES,
        }
        with open(os.path.join(gra, "tsconfig.gen.json"), "w", encoding="utf-8") as f:
            json.dump(tsconfig, f)
        # tsc zglasza bledy typow (brak typow `three` itp.), ale emituje JS (noEmitOnError=false).
        subprocess.run([tsc, "-p", "tsconfig.gen.json"], cwd=gra, capture_output=True)
        out = os.path.join(gra, "out")
        for rel in FILES:
            js = os.path.join(out, rel[:-3] + ".js")
            if not os.path.isfile(js):
                print(f"brak wyniku tsc: {js}", file=sys.stderr)
                return 2
        with open(os.path.join(out, "package.json"), "w", encoding="utf-8") as f:
            f.write('{ "type": "commonjs" }\n')
        scenarios_path = os.path.join(here, "scenarios.json")
        res = run([node, os.path.join(here, "harness.cjs"), out, scenarios_path])
        produced = json.loads(res.stdout.decode())
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    with open(scenarios_path, encoding="utf-8") as f:
        scenarios = json.load(f)
    merged = []
    for sc, exp in zip(scenarios, produced["scenarios"]):
        assert sc["name"] == exp["name"]
        merged.append({"input": sc, "expected": {"owners": exp["owners"], "cities": exp["cities"]}})
    doc = {"pin": PIN, "stubbedModules": produced["stubs"], "scenarios": merged}
    body = json.dumps(doc, ensure_ascii=False, indent=1)
    if '"##' in body:
        print("JSON zawiera sekwencje '\"##' (konflikt z r##\"…\"##)", file=sys.stderr)
        return 2
    block = BEGIN + 'const PIN_VECTORS: &str = r##"' + body + '"##;\n' + END

    test_path = os.path.join(repo, TEST_REL)
    with open(test_path, encoding="utf-8") as f:
        text = f.read()
    start = text.index(BEGIN)
    stop = text.index(END) + len(END)
    new_text = text[:start] + block + text[stop:]
    if check:
        if new_text != text:
            print("ROZNICA: blok wektorow nie odpowiada pinowi", file=sys.stderr)
            return 1
        print("OK: blok wektorow zgodny z pinem", PIN)
        return 0
    with open(test_path, "w", encoding="utf-8") as f:
        f.write(new_text)
    print("zapisano", TEST_REL)
    return 0


if __name__ == "__main__":
    sys.exit(main())
