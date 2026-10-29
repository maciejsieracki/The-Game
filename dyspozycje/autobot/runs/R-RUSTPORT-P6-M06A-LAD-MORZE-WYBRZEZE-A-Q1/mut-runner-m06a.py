#!/usr/bin/env python3
"""Mutacje P6.M06A (landsea A). Kazda mutacja zmienia JEDEN fragment kodu (landsea.rs) albo
JEDNA liczbe/kolejnosc w tabeli (mapgen-landsea.json), uruchamia binarke testu p6_m06a_landsea
i oczekuje CZERWONYCH testow. Po KAZDEJ mutacji plik jest przywracany z bajtow w pamieci, a SHA-256
plikow z dysku jest porownywane z poczatkowym.

Uzycie (cwd = rust-port/engine; env CARGO_* jak w dispatchu):
  python3 <run>/mut-runner-m06a.py <LOG> [--dry] [--only id1,id2]
--dry : tylko sprawdza, czy kotwica wystepuje dokladnie tyle razy, ile zadeklarowano (bez kompilacji).
Wynik: KILLED (testy czerwone), SURVIVED (testy zielone -> luka lub rownowaznosc do uzasadnienia),
BLAD-KOTWICY, BLAD-KOMPILACJI.
"""
import hashlib
import os
import subprocess
import sys
import time

LIB = "src/domain/mapgen/landsea.rs"
TBL = "data/derived/mapgen-landsea.json"
BINS = ["p6_m06a_landsea"]

# (id, plik, stary fragment, nowy fragment, liczba wystapien oczekiwana)
MUTATIONS = [
    # --- predykaty terenu (isLandTerrain / isLandOrCoast / isDryLandTerrain) ---
    ("land-no-grass", LIB, "Terrain::Grassland | Terrain::Plains", "Terrain::Plains", 1),
    ("land-add-mountains", LIB, "Terrain::Hills | Terrain::Desert", "Terrain::Hills | Terrain::Desert | Terrain::Mountains", 1),
    ("land-or-coast-inv", LIB, "pub fn is_land_or_coast(t: Terrain) -> bool {\n    !is_water_terrain_local(t)",
     "pub fn is_land_or_coast(t: Terrain) -> bool {\n    is_water_terrain_local(t)", 1),
    ("land-or-coast-shallow", LIB, "pub fn is_land_or_coast(t: Terrain) -> bool {\n    !is_water_terrain_local(t)",
     "pub fn is_land_or_coast(t: Terrain) -> bool {\n    t != Terrain::Sea", 1),
    ("dry-land-shallow", LIB, "pub fn is_dry_land_terrain(t: Terrain) -> bool {\n    !is_water_terrain_local(t)",
     "pub fn is_dry_land_terrain(t: Terrain) -> bool {\n    t != Terrain::Sea", 1),
    # --- udzialy i kolejnosc erozji (dane JSON) ---
    ("json-pangea-0.61", TBL, '"pangea": 0.60,', '"pangea": 0.61,', 1),
    ("json-kontynenty-0.31", TBL, '"kontynenty": 0.30,', '"kontynenty": 0.31,', 1),
    ("json-erode-laka-pustynia", TBL, '"Laka",\n    "Pustynia",', '"Pustynia",\n    "Laka",', 1),
    ("map-islands-kontynenty", LIB, "WorldType::Islands => t.wyspy,", "WorldType::Islands => t.kontynenty,", 1),
    ("erode-rank-default-0", LIB, "unwrap_or(order.len())", "unwrap_or(0)", 1),
    ("erode-rank-rposition-EQUIV", LIB, "order.iter().position(|&x| x == t)", "order.iter().rposition(|&x| x == t)", 1),
    # --- liczenie lad/morze ---
    ("count-swap", LIB, "            sea += 1;\n        } else {\n            land += 1;",
     "            land += 1;\n        } else {\n            sea += 1;", 1),
    ("count-total-no-sea", LIB, "        total: land + sea,", "        total: land,", 1),
    # --- sasiedztwo (countMorse / countLand / coastal predicates) ---
    ("morse-n-sea-only", LIB, "is_some_and(|nh| is_water_terrain_local(nh.terrain))", "is_some_and(|nh| nh.terrain == Terrain::Sea)", 1),
    ("land-n-not-sea", LIB, "is_some_and(|nh| !is_water_terrain_local(nh.terrain))", "is_some_and(|nh| nh.terrain != Terrain::Sea)", 1),
    ("neighbor-negate-both-EQUIV", LIB, "    hexes.get(&hex_key(q + i64::from(dq), r + i64::from(dr)))",
     "    hexes.get(&hex_key(q - i64::from(dq), r - i64::from(dr)))", 1),
    ("neighbor-negate-dq-only", LIB, "    hexes.get(&hex_key(q + i64::from(dq), r + i64::from(dr)))",
     "    hexes.get(&hex_key(q - i64::from(dq), r + i64::from(dr)))", 1),
    ("coastal-land-gt1", LIB, "=> count_morse_neighbors(hexes, q, r) > 0,", "=> count_morse_neighbors(hexes, q, r) > 1,", 1),
    ("coastal-land-no-water-guard", LIB, "Some(h) if !is_water_terrain_local(h.terrain) => count_morse_neighbors(hexes, q, r) > 0,",
     "Some(h) if true => count_morse_neighbors(hexes, q, r) > 0,", 1),
    ("coastal-morse-sea-only", LIB, "Some(h) if is_water_terrain_local(h.terrain) => count_land_neighbors(hexes, q, r) > 0,",
     "Some(h) if h.terrain == Terrain::Sea => count_land_neighbors(hexes, q, r) > 0,", 1),
    ("coastal-morse-gt1", LIB, "=> count_land_neighbors(hexes, q, r) > 0,", "=> count_land_neighbors(hexes, q, r) > 1,", 1),
    # --- pierscien wybrzeza (applyCoastRing / applyDoubleCoastRing) ---
    ("ring-src-shallow", LIB, "        if hex.terrain != Terrain::Sea {\n            continue;\n        }\n        let Some((q, r)) = key_qr(key) else { continue };\n        let touches_land",
     "        if hex.terrain != Terrain::ShallowSea {\n            continue;\n        }\n        let Some((q, r)) = key_qr(key) else { continue };\n        let touches_land", 1),
    ("ring-touch-grass-only", LIB, "neighbor(hexes, q, r, dq, dr).is_some_and(|nb| is_dry_land_terrain(nb.terrain))\n        });\n        if touches_land {\n            to_coast.push",
     "neighbor(hexes, q, r, dq, dr).is_some_and(|nb| nb.terrain == Terrain::Grassland)\n        });\n        if touches_land {\n            to_coast.push", 1),
    ("ring-no-deposit-clear", LIB, "            h.has_deposit = false;\n        }\n    }\n    to_coast.len()",
     "        }\n    }\n    to_coast.len()", 1),
    ("ring-no-overlay-clear", LIB, "            h.overlay = crate::domain::mapgen::terrain_class::Nakladka::Brak;\n            h.has_deposit = false;\n        }\n    }\n    to_coast.len()",
     "            h.has_deposit = false;\n        }\n    }\n    to_coast.len()", 1),
    ("ring-return-zero", LIB, "    to_coast.len()\n}\n\n/// Web `applyDoubleCoastRing`", "    0\n}\n\n/// Web `applyDoubleCoastRing`", 1),
    ("double-ret-no-second", LIB, "    n + to_coast.len()", "    n", 1),
    ("double-touch-sea-only", LIB, "neighbor(hexes, q, r, dq, dr).is_some_and(|nb| nb.terrain == Terrain::ShallowSea)",
     "neighbor(hexes, q, r, dq, dr).is_some_and(|nb| nb.terrain == Terrain::Sea)", 1),
    ("double-touch-grass", LIB, "neighbor(hexes, q, r, dq, dr).is_some_and(|nb| nb.terrain == Terrain::ShallowSea)",
     "neighbor(hexes, q, r, dq, dr).is_some_and(|nb| nb.terrain == Terrain::Grassland)", 1),
    # --- findDryLandTouchingSea ---
    ("touch-sea-incl-shallow", LIB, "is_some_and(|nb| nb.terrain == Terrain::Sea)\n        });\n        if touches_sea",
     "is_some_and(|nb| is_water_terrain_local(nb.terrain))\n        });\n        if touches_sea", 1),
    ("touch-dry-skip-check", LIB, "        if !is_dry_land_terrain(hex.terrain) {\n            continue;\n        }",
     "        if false {\n            continue;\n        }", 1),
    # --- sanitizeCoastHexes (sieroty, BFS, naprawa) ---
    ("sanitize-no-seeds", LIB, "        if touches_land {\n            valid.insert(key.clone());", "        if false {\n            valid.insert(key.clone());", 1),
    ("sanitize-seed-sea-too", LIB, "        if hex.terrain != Terrain::ShallowSea {\n            continue;\n        }\n        let Some((q, r)) = key_qr(key) else { continue };\n        let touches_land",
     "        if !is_water_terrain_local(hex.terrain) {\n            continue;\n        }\n        let Some((q, r)) = key_qr(key) else { continue };\n        let touches_land", 1),
    ("sanitize-no-bfs", LIB, "    while let Some(key) = queue.pop() {\n        let Some((q, r)) = key_qr(&key) else { continue };\n        for &(dq, dr) in HEX_DIRECTIONS.iter() {\n            let nk = hex_key(q + i64::from(dq), r + i64::from(dr));\n            if valid.contains(&nk) {",
     "    while let Some(key) = queue.pop().filter(|_| false) {\n        let Some((q, r)) = key_qr(&key) else { continue };\n        for &(dq, dr) in HEX_DIRECTIONS.iter() {\n            let nk = hex_key(q + i64::from(dq), r + i64::from(dr));\n            if valid.contains(&nk) {", 1),
    ("sanitize-bfs-sea-too", LIB, ".is_some_and(|nh| nh.terrain == Terrain::ShallowSea)", ".is_some_and(|nh| is_water_terrain_local(nh.terrain))", 1),
    ("sanitize-orphan-sea-no-clear", LIB, "            set_hex_to_morze(h);", "            h.terrain = Terrain::Sea;", 1),
    ("sanitize-orphan-count-minus1", LIB, "    orphans.len()\n}", "    orphans.len().saturating_sub(1)\n}", 1),
    # --- oceanConnected (krawedz mapy, BFS) ---
    ("ocean-edge-no-bottom", LIB, "            if q != 0 && r != 0 && q != width - 1 && r != height - 1 {",
     "            if q != 0 && r != 0 && q != width - 1 {", 1),
    ("ocean-edge-right-off", LIB, "            if q != 0 && r != 0 && q != width - 1 && r != height - 1 {",
     "            if q != 0 && r != 0 && q != width && r != height - 1 {", 1),
    ("ocean-seed-no-pred", LIB, "            if !pred(hex.terrain) {\n                continue;", "            if false {\n                continue;", 1),
    ("ocean-bfs-no-pred", LIB, "if !pred(nh.terrain) || connected.contains(&nk) {", "if connected.contains(&nk) {", 1),
    ("ocean-morse-as-water", LIB, "ocean_connected_by(hexes, width, height, |t| t == Terrain::Sea)",
     "ocean_connected_by(hexes, width, height, is_water_terrain_local)", 1),
    ("ocean-bfs-no-visited", LIB, "|| connected.contains(&nk) {\n                continue;\n            }\n            connected.insert(nk.clone());\n            queue.push(nk);\n        }\n    }\n    connected",
     "{\n                continue;\n            }\n            connected.insert(nk.clone());\n            queue.push(nk);\n        }\n    }\n    connected", 1),
    # --- findInlandWaterHexes / findInlandSeaHexes ---
    ("inland-water-invert", LIB, "is_water_terrain_local(h.terrain) && !ocean.contains(k.as_str())",
     "is_water_terrain_local(h.terrain) && ocean.contains(k.as_str())", 1),
    ("inland-water-sea-only", LIB, "is_water_terrain_local(h.terrain) && !ocean.contains(k.as_str())",
     "h.terrain == Terrain::Sea && !ocean.contains(k.as_str())", 1),
    ("inland-sea-drop-ocean", LIB, "h.terrain == Terrain::Sea && !ocean.contains(k.as_str())", "h.terrain == Terrain::Sea", 1),
    ("inland-sea-shallow-too", LIB, "h.terrain == Terrain::Sea && !ocean.contains(k.as_str())",
     "is_water_terrain_local(h.terrain) && !ocean.contains(k.as_str())", 1),
    # --- parsowanie klucza ---
    ("key-qr-sep", LIB, "let (a, b) = key.split_once(',')?;", "let (a, b) = key.split_once(';')?;", 1),
    # --- runda 2 (odpowiedz na zarzut r1): galezie czyszczenia nakladki/zloza, seedy krawedzi, JSON, sieroty ---
    ("double-no-overlay-clear", LIB, "            h.overlay = crate::domain::mapgen::terrain_class::Nakladka::Brak;\n            h.has_deposit = false;\n        }\n    }\n    n + to_coast.len()",
     "            h.has_deposit = false;\n        }\n    }\n    n + to_coast.len()", 1),
    ("double-no-deposit-clear", LIB, "            h.has_deposit = false;\n        }\n    }\n    n + to_coast.len()",
     "        }\n    }\n    n + to_coast.len()", 1),
    ("sanitize-orphan-no-overlay-clear", LIB, "            set_hex_to_morze(h);",
     "            h.terrain = Terrain::Sea;\n            h.has_deposit = false;\n            h.river_present = false;\n            h.river_edges.clear();", 1),
    ("sanitize-orphan-no-deposit-clear", LIB, "            set_hex_to_morze(h);",
     "            h.terrain = Terrain::Sea;\n            h.overlay = crate::domain::mapgen::terrain_class::Nakladka::Brak;\n            h.river_present = false;\n            h.river_edges.clear();", 1),
    ("ocean-edge-no-top", LIB, "if q != 0 && r != 0 && q != width - 1 && r != height - 1 {",
     "if q != 0 && q != width - 1 && r != height - 1 {", 1),
    ("ocean-edge-no-left", LIB, "if q != 0 && r != 0 && q != width - 1 && r != height - 1 {",
     "if r != 0 && q != width - 1 && r != height - 1 {", 1),
    ("double-src-shallow", LIB, "        if hex.terrain != Terrain::Sea {\n            continue;\n        }\n        let Some((q, r)) = key_qr(key) else { continue };\n        let touches_coast",
     "        if hex.terrain != Terrain::ShallowSea {\n            continue;\n        }\n        let Some((q, r)) = key_qr(key) else { continue };\n        let touches_coast", 1),
    ("json-wyspy-0.51", TBL, '"wyspy": 0.50,', '"wyspy": 0.51,', 1),
    ("json-ziemia-0.22", TBL, '"ziemia": 0.21', '"ziemia": 0.22', 1),
    ("json-erode-gory-wzgorza", TBL, '"Wzgorza",\n    "Gory"', '"Gory",\n    "Wzgorza"', 1),
]


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


def main():
    args = sys.argv[1:]
    log_path = args[0]
    dry = "--dry" in args
    only = None
    if "--only" in args:
        only = set(args[args.index("--only") + 1].split(","))
    initial = {p: sha(p) for p in (LIB, TBL)}
    originals = {p: open(p, "rb").read() for p in (LIB, TBL)}
    log = open(log_path, "a", encoding="utf-8")

    def emit(line):
        print(line, flush=True)
        log.write(line + "\n")
        log.flush()

    emit(f"SHA poczatkowe: {LIB}={initial[LIB]} {TBL}={initial[TBL]}")
    for mid, path, old, new, cnt in MUTATIONS:
        if only is not None and mid not in only:
            continue
        text = originals[path].decode("utf-8")
        found = text.count(old)
        if found != cnt:
            emit(f"BLAD-KOTWICY {mid}: wystapien={found}, oczekiwano {cnt}")
            continue
        if dry:
            emit(f"OK-KOTWICA {mid}")
            continue
        mutated = text.replace(old, new, 1).encode("utf-8")
        t0 = time.time()
        status = "SURVIVED"
        detail = ""
        try:
            with open(path, "wb") as f:
                f.write(mutated)
            cmd = ["cargo", "test", "--offline", "--no-fail-fast"]
            for b in BINS:
                cmd += ["--test", b]
            # Grupa procesow: po przekroczeniu czasu zabijamy cargo ORAZ binarke testu (petla nieskonczona).
            popen = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                                     env=dict(os.environ), start_new_session=True)
            try:
                so, se = popen.communicate(timeout=240)
            except subprocess.TimeoutExpired:
                os.killpg(popen.pid, 9)
                so, se = popen.communicate()
                raise
            proc = subprocess.CompletedProcess(cmd, popen.returncode, so, se)
            out = proc.stdout + proc.stderr
            failed = [l.strip() for l in out.splitlines() if l.strip().startswith("test ") and l.strip().endswith("FAILED")]
            if "error[E" in out or "could not compile" in out:
                status = "BLAD-KOMPILACJI"
                detail = "; ".join(l for l in out.splitlines() if l.startswith("error"))[:300]
            elif proc.returncode != 0 and failed:
                status = "KILLED"
                detail = f"{len(failed)} testow FAILED: " + ", ".join(x.split()[1] for x in failed[:4])
            elif proc.returncode != 0:
                status = "BLAD-INNY"
                detail = out[-300:]
            else:
                detail = "wszystkie testy zielone"
        except subprocess.TimeoutExpired:
            status = "TIMEOUT"
        finally:
            with open(path, "wb") as f:
                f.write(originals[path])
            restored = sha(path) == initial[path]
        dt = int(time.time() - t0)
        emit(f"{status:16s} {mid} ({dt} s) przywrocono={'OK' if restored else 'BLAD'} {detail}")
        if not restored:
            emit("KRYTYCZNE: przywracanie nieudane - przerwano")
            break
    final = {p: sha(p) for p in (LIB, TBL)}
    emit(f"SHA koncowe: {LIB}={final[LIB]} {TBL}={final[TBL]} zgodne={final == initial}")


if __name__ == "__main__":
    main()
