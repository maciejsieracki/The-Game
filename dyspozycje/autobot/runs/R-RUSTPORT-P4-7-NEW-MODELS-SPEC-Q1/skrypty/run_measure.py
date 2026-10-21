"""P4.7 — odtworzenie pomiarow (python3 -I <ta sciezka>, z katalogu repo).

Czyta WYLACZNIE `git show edb8fb56:<plik>` (pliki modeli i danych), kopiuje je do
katalogu tymczasowego poza repo (importy './x' -> './x.ts'), podstawia `three`
recznym mockiem (three-mock.js, reguly liczenia trojkatow r169 opisane w naglowku)
i uruchamia measure.ts przez `node --experimental-strip-types`. Bez npm, bez buildu,
bez uruchamiania weba. Jedyny zapis w repo: wyniki/measure.txt i wyniki/loc.txt.
"""
import os, re, shutil, subprocess, sys, tempfile

PIN = "edb8fb56"
HERE = os.path.dirname(os.path.abspath(__file__))
RUN = os.path.dirname(HERE)
REPO = subprocess.run(["git", "rev-parse", "--show-toplevel"], cwd=HERE, capture_output=True, text=True, check=True).stdout.strip()
FILES = ["miasto-kamien", "miasto-braz", "wonderModels", "hexutil", "bronzeCityRoblox", "bronzeCity", "stoneCity"]


def show(path: str) -> str:
    return subprocess.run(["git", "show", f"{PIN}:{path}"], cwd=REPO, capture_output=True, text=True, check=True).stdout


def loc_report() -> str:
    """Proxy kosztu zestawu miasta: liczba linii sekcji GRECJA / RZYM w miasto-braz.ts i calego miasto-kamien.ts."""
    braz = show("gra/src/render/miasto-braz.ts").splitlines()
    def idx(marker: str) -> int:
        for i, l in enumerate(braz):
            if marker in l:
                return i + 1
        raise SystemExit("brak markera " + marker)
    g0 = idx("// ========================= GRECJA")
    r0 = idx("// ========================= RZYM")
    a0 = idx("// ========================= API GLOWNE")
    kam = show("gra/src/render/miasto-kamien.ts").splitlines()
    lines = [
        f"miasto-braz.ts linii={len(braz)}",
        f"sekcja GRECJA: linie {g0}-{r0 - 1} => {r0 - g0} linii",
        f"sekcja RZYM:   linie {r0}-{a0 - 1} => {a0 - r0} linii",
        f"API+router+layout: linie {a0}-{len(braz)} => {len(braz) - a0 + 1} linii",
        f"miasto-kamien.ts linii={len(kam)}",
    ]
    return "\n".join(lines)


def main() -> None:
    tmp = tempfile.mkdtemp(prefix="p47-meas-")
    try:
        os.makedirs(os.path.join(tmp, "node_modules", "three"))
        shutil.copy(os.path.join(HERE, "three-mock.js"), os.path.join(tmp, "node_modules", "three", "index.js"))
        open(os.path.join(tmp, "node_modules", "three", "package.json"), "w").write('{"name":"three","type":"module","main":"index.js"}')
        open(os.path.join(tmp, "package.json"), "w").write('{"type":"module"}')
        os.makedirs(os.path.join(tmp, "src"))
        for f in FILES:
            s = show(f"gra/src/render/{f}.ts")
            s = re.sub(r"from '\./([A-Za-z0-9_-]+)'", r"from './\1.ts'", s)
            open(os.path.join(tmp, "src", f + ".ts"), "w", encoding="utf-8").write(s)
        shutil.copy(os.path.join(HERE, "measure.ts"), os.path.join(tmp, "measure.ts"))
        r = subprocess.run(["node", "--experimental-strip-types", "--no-warnings", "measure.ts"], cwd=tmp, capture_output=True, text=True)
        if r.returncode != 0:
            sys.stderr.write(r.stderr)
            raise SystemExit(r.returncode)
        os.makedirs(os.path.join(RUN, "wyniki"), exist_ok=True)
        open(os.path.join(RUN, "wyniki", "measure.txt"), "w", encoding="utf-8").write(r.stdout)
        loc = loc_report()
        open(os.path.join(RUN, "wyniki", "loc.txt"), "w", encoding="utf-8").write(loc + "\n")
        print(r.stdout)
        print(loc)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
