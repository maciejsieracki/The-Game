"""Runner mutacji P6.M06A4 (partia 2, runda 2, poprawka Evaluatora).

Zmiany wzgledem r2:
- sciezki wzgledne do katalogu worktree (nie zakodowany inny worktree);
- M16 poprawione: `Terrain::Polarny` (nieistniejacy wariant) -> `Terrain::Polar` (serde "Polarny");
- wynik BUILD_ERROR (blad kompilacji) jest rozrozniany od ZABITA: mutant zabity wymaga
  niezerowego wyjscia testow BEZ bledu kompilacji;
- zapis do pliku podanego w argumencie (jeden wpis na ID, bez duplikatow).

Uzycie: python3 -I mut-runner-m06a4.py <ID_OD> <ID_DO_EXCL> <WYJSCIE.jsonl>
  (indeksy 0..17 -> M01..M18). Zmienne srodowiska: CARGO_TARGET_DIR jest ustawiany wg nazwy worktree.
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_WT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
ENGINE = os.path.join(REPO_WT, "rust-port", "engine")
LS = os.path.join(ENGINE, "src", "domain", "mapgen", "landsea.rs")
JS = os.path.join(ENGINE, "data", "derived", "mapgen-desert-purge.json")
ENV = dict(
    os.environ,
    CARGO_INCREMENTAL="0",
    CARGO_TARGET_DIR="/home/user/cargo-target-shared/" + os.path.basename(REPO_WT),
    CARGO_PROFILE_DEV_DEBUG="0",
)

MUTS = [
    ("M01 prog liczbowy >= -> > (pustN>=2 => pustN>2)", LS,
     "pust_n >= progi.prog_pustyni_min_liczba", "pust_n > progi.prog_pustyni_min_liczba"),
    ("M02 prog ulamek >= -> > (f64)", LS,
     "(pust_n as f64) >= (dry_n as f64) * progi.prog_pustyni_min_ulamek_suchych",
     "(pust_n as f64) > (dry_n as f64) * progi.prog_pustyni_min_ulamek_suchych"),
    ("M03 dry_n>0 -> dry_n>=0", LS,
     "|| (dry_n > 0\n", "|| (dry_n >= 0\n"),
    ("M04 usun warunek pasma (in_desert && -> true &&)", LS,
     "let nowy = if in_desert && progowo", "let nowy = if true && progowo"),
    ("M05 pasmo isEarth true", LS,
     "climate_band_at(r, height, false) == ClimateBand::Desert",
     "climate_band_at(r, height, true) == ClimateBand::Desert"),
    ("M06 usun has_deposit=false", LS,
     "            h.has_deposit = false;\n        }\n        converted += 1;",
     "        }\n        converted += 1;"),
    ("M07 usun river_edges.clear()", LS,
     "            h.river_edges.clear();\n            h.has_deposit", "            h.has_deposit"),
    ("M08 usun river_present=false", LS,
     "            h.river_present = false;\n            h.river_edges", "            h.river_edges"),
    ("M09 usun overlay=Brak", LS,
     "            h.overlay = Nakladka::Brak;\n            h.river_present", "            h.river_present"),
    ("M10 Laka -> Rownina w gałęzi else", LS,
     "        } else {\n            Terrain::Grassland\n        };",
     "        } else {\n            Terrain::Plains\n        };"),
    ("M11 pust_n liczy takze wode (usun continue dla wody)", LS,
     "            if is_water_terrain_local(nh.terrain) {\n                continue;\n            }\n            dry_n += 1;",
     "            dry_n += 1;"),
    ("M12 JSON prog_pustyni_min_liczba 2 -> 3", JS,
     '"prog_pustyni_min_liczba": 2', '"prog_pustyni_min_liczba": 3'),
    ("M13 JSON ulamek 0.4 -> 0.5", JS,
     '"prog_pustyni_min_ulamek_suchych": 0.4', '"prog_pustyni_min_ulamek_suchych": 0.5'),
    ("M14 JSON ulamek 0.4 -> 0.3", JS,
     '"prog_pustyni_min_ulamek_suchych": 0.4', '"prog_pustyni_min_ulamek_suchych": 0.3'),
    ("M15 brak continue dla klucza niekanonicznego (key_qr)", LS,
     "        let Some((q, r)) = key_qr(key) else {\n            continue;\n        };\n        let mut pust_n: u64 = 0;",
     "        let (q, r) = key_qr(key).unwrap_or((0, 0));\n        let mut pust_n: u64 = 0;"),
    ("M16 sprawdzanie sasiada Desert -> Polar (Terrain::Polar, serde Polarny)", LS,
     "if nh.terrain == Terrain::Desert {\n                pust_n += 1;",
     "if nh.terrain == Terrain::Polar {\n                pust_n += 1;"),
    ("M17 struktura: || -> && w warunku progowym", LS,
     "pust_n >= progi.prog_pustyni_min_liczba\n            || (dry_n > 0",
     "pust_n >= progi.prog_pustyni_min_liczba\n            && (dry_n > 0"),
    ("M18 struktura: odwrocona galaz if (Laka<->Pustynia)", LS,
     "let nowy = if in_desert && progowo {\n            Terrain::Desert\n        } else {\n            Terrain::Grassland",
     "let nowy = if in_desert && progowo {\n            Terrain::Grassland\n        } else {\n            Terrain::Desert"),
]


def run(i):
    name, path, old, new = MUTS[i]
    orig = open(path, encoding="utf-8").read()
    n = orig.count(old)
    if n != 1:
        return {"id": name, "status": "PATTERN_ERROR", "old_count": n}
    try:
        open(path, "w", encoding="utf-8").write(orig.replace(old, new))
        p = subprocess.run(
            ["cargo", "test", "--test", "p6_m06a4_landsea", "--no-fail-fast"],
            cwd=ENGINE, env=ENV, capture_output=True, text=True,
        )
        out = p.stdout + p.stderr
        build_error = ("error[E" in out) or ("could not compile" in out)
        fails = [l for l in out.splitlines() if "FAILED" in l or "panicked" in l][:4]
        if build_error:
            status = "BUILD_ERROR"
        elif p.returncode != 0:
            status = "ZABITA"
        else:
            status = "PRZEZYTA"
        return {"id": name, "status": status, "exit": p.returncode, "fails": fails}
    finally:
        open(path, "w", encoding="utf-8").write(orig)


if __name__ == "__main__":
    lo, hi, outpath = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    for i in range(lo, min(hi, len(MUTS))):
        r = run(i)
        with open(outpath, "a", encoding="utf-8") as f:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
        print(json.dumps(r, ensure_ascii=False))
