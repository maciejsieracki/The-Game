#!/usr/bin/env python3
"""Mutanty P4-1J (pomiary, runda 1): kazdy mutant = jedna zamiana tekstu (dokladnie 1 wystapienie),
uruchomienie dwoch zestawow testow P4-1J, przywrocenie pliku z git. Uzycie: mutate.py <engine_dir> <log_dir> [ids]"""
import subprocess, sys, os, pathlib

ENGINE = pathlib.Path(sys.argv[1])
LOGS = pathlib.Path(sys.argv[2]); LOGS.mkdir(parents=True, exist_ok=True)
ONLY = set(sys.argv[3].split(",")) if len(sys.argv) > 3 else None
P = "src/domain/playable.rs"; S = "src/domain/save_load.rs"

MUTANTS = [
  ("N1", P, "enum: snake_case -> camelCase (napisy powodow != web)",
   '#[serde(rename_all = "snake_case")]\npub enum PlayableMarchStopReason',
   '#[serde(rename_all = "camelCase")]\npub enum PlayableMarchStopReason'),
  ("N2", P, "plannedMarches bez skip_serializing_if (pusty [] w JSON)",
   '#[serde(default, skip_serializing_if = "Vec::is_empty")]\n    pub planned_marches',
   '#[serde(default)]\n    pub planned_marches'),
  ("N3", P, "marchStopDetail bez serde(default) (stary stan nie laduje sie)",
   '#[serde(default, skip_serializing_if = "BTreeMap::is_empty")]\n    pub march_stop_detail',
   '#[serde(skip_serializing_if = "BTreeMap::is_empty")]\n    pub march_stop_detail'),
  ("N4", P, "PlayablePlannedMarch bez rename_all camelCase (unit_id zamiast unitId)",
   '#[serde(rename_all = "camelCase")]\npub struct PlayablePlannedMarch',
   'pub struct PlayablePlannedMarch'),
  ("N5", S, "odczyt nie czysci marchStopNotified",
   'state.march_stop_notified.clear();', ''),
  ("N6", S, "odczyt nie czysci marchAttackTargets",
   'state.march_attack_targets.clear();', ''),
  ("N7", S, "js_i32: i32::MAX wykluczone (< zamiast <=)",
   'value <= f64::from(i32::MAX)', 'value < f64::from(i32::MAX)'),
  ("N8", S, "js_i32: i32::MIN wykluczone (> zamiast >=)",
   'value >= f64::from(i32::MIN)', 'value > f64::from(i32::MIN)'),
  ("N9", S, "canonical_unit_id przyjmuje niekanoniczne ('07', '+7')",
   '(value.to_string() == text).then_some(UnitId::new(value))', 'Some(UnitId::new(value))'),
  ("N10", S, "zapis: klucze nie-indeksy przed indeksami (odwrocona regula kolejnosci)",
   'array_index_key(&march.unit_id).map_or((1, 0), |index| (0, index))',
   'array_index_key(&march.unit_id).map_or((0, 0), |index| (1, index))'),
  ("N10b", S, "zapis: brak sortowania po kluczu-indeksie (kolejnosc Map zamiast kolejnosci kluczy obiektu)",
   'planned.sort_by_key(', 'let _ = planned.iter().map('),
  ("N11", S, "with_playable_planned_marches gubi autoMarch",
   '.with_auto_march(auto_march)', '.with_auto_march({ let _ = auto_march; None })'),
  ("N12", S, "zapis gubi attackUnitId",
   'attack_unit_id: march.attack_unit_id.map(|id| id.to_string()),', 'attack_unit_id: None,'),
  ("N13", S, "odczyt: zamienione x/y pozycji jednostki w filtrze 'na celu'",
   'i32::from(unit.position.x()),\n                i32::from(unit.position.y()),',
   'i32::from(unit.position.y()),\n                i32::from(unit.position.x()),'),
  ("N14", S, "raport nie zbiera general_target_dropped",
   'report.general_target_dropped.push(unit_id.clone());', 'let _ = &unit_id;'),
  ("N15", S, "Map.set bez generalTargetId/attack: brak usuniecia celu ataku przy nadpisaniu",
   'None => {\n                state.march_attack_targets.remove(&id);\n            }', 'None => {}'),
  ("N16", S, "zapis wspolrzednych jako float JSON (3.0 zamiast 3)",
   'js_i32(value).map(Number::from)', 'Number::from_f64(value)'),
  ("N17", S, "odczyt: powtorzony unitId dopisywany zamiast nadpisany",
   'Some(slot) => *slot = entry,', 'Some(_) => state.planned_marches.push(entry),'),
  ("N18", S, "odczyt ignoruje legacy autoMarch",
   'planned_marches_from_save(legacy.as_ref(),', 'planned_marches_from_save(None,'),
  ("N19", S, "odczyt nie czysci plannedMarches przed wczytaniem",
   'state.planned_marches.clear();', ''),
]

env = dict(os.environ)
results = []
for mid, rel, desc, old, new in MUTANTS:
    if ONLY and mid not in ONLY:
        continue
    path = ENGINE / rel
    text = path.read_text()
    n = text.count(old)
    if n != 1:
        results.append((mid, "BLAD-WZORCA(%d)" % n, desc, "")); continue
    path.write_text(text.replace(old, new))
    try:
        p = subprocess.run(["cargo", "test", "--test", "p4_1j_planned_march_state",
                            "--test", "p4_1j_planned_march_pin_vectors", "--test", "p4_1j_planned_march_bounds", "--no-fail-fast"],
                           cwd=ENGINE, env=env, capture_output=True, text=True)
        out = p.stdout + p.stderr
        (LOGS / f"{mid}.log").write_text(out)
        if "error[E" in out or "could not compile" in out:
            verdict = "NIE-KOMPILUJE"
        elif p.returncode != 0:
            verdict = "ZABITY"
        else:
            verdict = "PRZEZYL"
        failed = sorted({l.split()[1] for l in out.splitlines()
                         if l.startswith("test ") and l.rstrip().endswith("FAILED")})
        results.append((mid, verdict, desc, ", ".join(failed)))
    finally:
        subprocess.run(["git", "checkout", "--", rel], cwd=ENGINE, check=True)
    print(mid, results[-1][1], results[-1][3], flush=True)

print("\n| Mutant | Opis | Wynik | Zabijajace testy |\n|---|---|---|---|")
for mid, verdict, desc, failed in results:
    print(f"| {mid} | {desc} | {verdict} | {failed or '-'} |")
