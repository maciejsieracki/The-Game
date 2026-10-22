#!/usr/bin/env python3
"""Mutacje P6.M17: kazda zmienia JEDEN fragment kodu Rust, uruchamia testy p6_m17_*, przywraca plik.
Oczekiwanie: test CZERWONY (mutant wykryty). Uzycie (z rust-port/engine, z ustawionym CARGO_TARGET_DIR):
  python3 -I mutate-m17.py [fragment nazwy ...]
"""
import subprocess
import sys

SRC = "src/domain/map_snapshot.rs"
MUTANTS = [
    ("intern: teren po nakladce", "        teren_idx.push(dict.intern(&hex.teren_bazowy));\n        nakladka_idx.push(dict.intern(&hex.nakladka));",
     "        nakladka_idx.push(dict.intern(&hex.nakladka));\n        teren_idx.push(dict.intern(&hex.teren_bazowy));"),
    ("brak wlasciciela -> 0", "None => NO_OWNER_IDX,", "None => 0,"),
    ("zloze: pusty string trafia do kolumny", "hex.zloze.as_deref().filter(|s| !s.is_empty())", "hex.zloze.as_deref()"),
    ("zlozeMinEra: tylko > 0", "if let Some(era) = hex.zloze_min_era {", "if let Some(era) = hex.zloze_min_era.filter(|e| *e > 0.0) {"),
    ("ulepszenia: pusta tablica pomijana", "if let Some(list) = &hex.ulepszenia {", "if let Some(list) = hex.ulepszenia.as_ref().filter(|l| !l.is_empty()) {"),
    ("improvementKey: pusty string trafia do kolumny", "hex.improvement_key.as_deref().filter(|s| !s.is_empty())", "hex.improvement_key.as_deref()"),
    ("krawedzie: zawsze do kolumny", "if !hex.rzeka.krawedzie.is_empty() {", "if true {"),
    ("krawedzie: tylko gdy obecna", "if !hex.rzeka.krawedzie.is_empty() {", "if hex.rzeka.obecna && !hex.rzeka.krawedzie.is_empty() {"),
    ("widocznosc: wartosc internowana przed graczem", "            let p = dict.intern(player_id);\n            widocznosc.player_idx.push(p);\n            let v = dict.intern(vis);\n            widocznosc.val_idx.push(v);",
     "            let v = dict.intern(vis);\n            widocznosc.val_idx.push(v);\n            let p = dict.intern(player_id);\n            widocznosc.player_idx.push(p);"),
    ("JsKeyedMap: bez porzadku indeksow", "        match is_array_index_key(key) {\n            Some(idx) => {", "        match None::<u64>.or(is_array_index_key(key).filter(|_| false)) {\n            Some(idx) => {"),
    ("JsKeyedMap: nadpisanie dopisuje nowy wpis", "        if let Some(e) = self.entries.iter_mut().find(|(k, _)| k == key) {\n            e.1 = value.to_string();\n            return;\n        }",
     ""),
    ("indeks tablicy: bez reguly zer wiodacych", "    if k.len() > 1 && k.starts_with('0') {\n        return None;\n    }\n", ""),
    ("indeks tablicy: granica 2^32-1", "const MAX_ARRAY_INDEX: u64 = 4_294_967_294;", "const MAX_ARRAY_INDEX: u64 = 4_294_967_295;"),
    ("rebuild: powtorzony klucz - wygrywa pierwszy", "            Some(&p) => hexes[p].1 = hex,", "            Some(&_p) => {}"),
    ("rebuild: wioska.istnieje != 0", "istnieje: col(&snap.wioska_istnieje, \"wioskaIstnieje\", i)?.0 == 1.0,", "istnieje: col(&snap.wioska_istnieje, \"wioskaIstnieje\", i)?.0 != 0.0,"),
    ("rebuild: rzeka.obecna != 0", "obecna: col(&snap.rzeka_obecna, \"rzekaObecna\", i)?.0 == 1.0,", "obecna: col(&snap.rzeka_obecna, \"rzekaObecna\", i)?.0 != 0.0,"),
    ("rebuild: ujemny indeks heksa -> 0", "usize::try_from(index)\n        .ok()\n        .and_then(|i| hex_list.get_mut(i))", "usize::try_from(index.max(0))\n        .ok()\n        .and_then(|i| hex_list.get_mut(i))"),
    ("rebuild: indeks dict poza zakresem -> pierwszy", ".and_then(|i| dict.get(i))\n        .ok_or(MapSnapshotError::DictIndex { field, index })", ".and_then(|i| dict.get(i).or(dict.first()))\n        .ok_or(MapSnapshotError::DictIndex { field, index })"),
    ("rebuild: widocznosc pomijana", "        hex_slot(&mut hex_list, \"widocznosc\", idx)?\n            .widocznosc\n            .set(&player, &vis);", "        let _ = (idx, &player, &vis);"),
    ("rebuild: ulepszenia pomijane", "hex_slot(&mut hex_list, \"ulepszenia\", idx)?.ulepszenia = Some(items);", "let _ = (idx, items);"),
    ("rebuild: wlasciciel -1 nie daje None", "            wlasciciel: if owner_idx == NO_OWNER_IDX {\n                None\n            } else {", "            wlasciciel: if owner_idx == -2 {\n                None\n            } else {"),
    ("serialize: riverPaths pominiete", "river_paths: map.river_paths.clone(),", "river_paths: Vec::new(),"),
    ("serialize: riverPathKinds pominiete", "river_path_kinds: map.river_path_kinds.clone(),", "river_path_kinds: None,"),
    ("JsNum: calkowite jako float", "if v.is_finite() && v.fract() == 0.0 && v.abs() < 1e15 {", "if false {"),
    ("valid: fmt nie sprawdzany", "    if js_number(field(snap, \"fmt\")) != Some(SNAPSHOT_FMT as f64) {\n        return false;\n    }\n", ""),
    ("valid: szerokosc >= 0", "        Some(w) if w > 0.0 => {}", "        Some(w) if w >= 0.0 => {}"),
    ("valid: wysokosc >= 0", "        Some(h) if h > 0.0 => {}", "        Some(h) if h >= 0.0 => {}"),
    ("valid: n >= 0", "        Some(n) if n > 0.0 => n,", "        Some(n) if n >= 0.0 => n,"),
    ("valid: seed nie sprawdzany", "    if js_number(field(snap, \"seed\")).is_none() {\n        return false;\n    }\n", ""),
    ("valid: dlugosc gestych nie sprawdzana", "            Some(len) if len as f64 == n => {}", "            Some(_len) => {}"),
    ("valid: pary rzadkie nie porownywane", "            (Some(a), Some(b)) if a == b => {}\n            _ => return false,\n        }\n    }\n\n    let Some(wid)", "            (Some(_a), Some(_b)) => {}\n            _ => return false,\n        }\n    }\n\n    let Some(wid)"),
    ("valid: widocznosc valIdx nie porownywane", "        (Some(a), Some(b), Some(c)) if a == b && a == c => {}", "        (Some(a), Some(b), Some(_c)) if a == b => {}"),
    ("valid: riverPaths nie sprawdzane", "    if array_len(field(snap, \"riverPaths\")).is_none() {\n        return false;\n    }\n", ""),
    ("valid: dict nie sprawdzany", "    if array_len(field(snap, \"dict\")).is_none() {\n        return false;\n    }\n", ""),
]

survived = []
ONLY = sys.argv[1:]
for name, old, new in MUTANTS:
    if ONLY and not any(o in name for o in ONLY):
        continue
    src = open(SRC, encoding="utf-8").read()
    if src.count(old) != 1:
        print(f"BLAD: fragment nie wystepuje dokladnie raz: {name} ({src.count(old)})")
        sys.exit(2)
    open(SRC, "w", encoding="utf-8").write(src.replace(old, new))
    try:
        r = subprocess.run(
            ["cargo", "test", "--test", "p6_m17_serialize", "--test", "p6_m17_rebuild", "--test", "p6_m17_validate", "--no-fail-fast"],
            capture_output=True, text=True,
        )
        out = r.stdout + r.stderr
        failed = [l for l in out.splitlines() if l.startswith("test ") and l.endswith("FAILED")]
        if r.returncode == 0:
            survived.append(name)
            print(f"PRZEZYL   : {name}")
        elif "error[" in out and not failed:
            print(f"KOMPILACJA: {name} (mutant nie kompiluje sie)")
            survived.append(name + " [nie kompiluje]")
        else:
            print(f"WYKRYTY   : {name} -> {len(failed)} testow czerwonych: {', '.join(l.split()[1] for l in failed[:4])}")
    finally:
        open(SRC, "w", encoding="utf-8").write(src)
print(f"mutantow={len(MUTANTS)} przezylo/niekompilujace={len(survived)}")
for s in survived:
    print("  ", s)
sys.exit(0 if not survived else 1)
