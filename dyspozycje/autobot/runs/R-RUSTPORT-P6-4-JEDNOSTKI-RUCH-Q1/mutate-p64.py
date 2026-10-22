#!/usr/bin/env python3
"""Mutacje kodu/tabel P6.4: kazda mutacja musi zostac WYKRYTA przez testy (exit != 0).

Uzycie: mutate-p64.py <ENGINE_DIR> <CARGO_TARGET_DIR> <ID,ID,...|all>
Dla kazdej mutacji: zapisuje kopie pliku, podmienia DOKLADNIE jedno wystapienie, uruchamia wskazany
test, zapisuje wynik i PRZYWRACA plik (takze przy bledzie). Wynik: linie `MUTACJA id: WYKRYTA|NIEWYKRYTA`.
"""
import os
import subprocess
import sys
from pathlib import Path

ENGINE = Path(sys.argv[1])
TARGET = sys.argv[2]
WANT = sys.argv[3].split(",") if len(sys.argv) > 3 else ["all"]
PF = "src/domain/pathfinding.rs"
JS = "data/derived/ruch-jednostek-params.json"

MUTATIONS = [
    ("M01-heap-pop-remis", PF, "if l < heap.len() && heap[l].0 < heap[smallest].0 {", "if l < heap.len() && heap[l].0 <= heap[smallest].0 {", "p6_4_core"),
    ("M02-sasiedzi-kolejnosc", JS, '"sasiedzi": [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]', '"sasiedzi": [[-1, 0], [1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]', "p6_4_core"),
    ("M03-podloga-bruku", PF, "return js_max(\n                road_movement_value(\"ROAD_BRUK_MIN_MOVE_COST\"),\n                cost / road_movement_value(\"ROAD_BRUK_MOVE_SPEED_MULT\"),\n            );", "return cost / road_movement_value(\"ROAD_BRUK_MOVE_SPEED_MULT\");", "p6_4_core"),
    ("M04-min-move-truncate", PF, "if out.is_empty() && budget >= ruch_jednostek_params().marsz.min_budzet_kroku {", "if out.is_empty() && budget > ruch_jednostek_params().marsz.min_budzet_kroku {", "p6_4_march"),
    ("M05-should-stop-arrived", PF, "if arrived {\n            return go();\n        }\n        let truncated", "let truncated", "p6_4_march"),
    # M19: mutacja ROWNOWAZNA (oba odgalezienia koncza sie `go()`, bo powod `obstacle` jest nieosiagalny w webie
    # - zob. dokument sekcja 1.2); oczekiwany wynik NIEWYKRYTA i jest to dowod, ze galaz jest redundantna.
    ("M19-rownowazna-granica", PF, "if truncated.len() < path.len() && seg_cost >= movement_budget {", "if truncated.len() < path.len() && seg_cost > movement_budget {", "p6_4_march"),
    ("M06-galera-embark", PF, "if category == ruch_jednostek_params().embarkacja.kategoria_okretu {\n            return false;\n        }", "", "p6_4_embark"),
    ("M07-tolerancja-remisu", PF, "} else if (score - best_gain).abs() <= zwiad.tolerancja_remisu {", "} else if (score - best_gain).abs() < zwiad.tolerancja_remisu {", "p6_4_scout"),
    ("M08-limit-krokow", PF, "if steps > zwiad.limit_krokow {", "if steps >= zwiad.limit_krokow {", "p6_4_scout"),
    ("M09-garnizon-stosu", PF, "format!(\"{base}{}\", stos.przyrostek_garnizon)", "base", "p6_4_core"),
    ("M10-trunc-na-round", PF, "                q: point.q.trunc(),\n                r: point.r.trunc(),\n            },\n        );\n    }\n\n    /// Web `clearRallyPoint`", "                q: point.q.round(),\n                r: point.r.round(),\n            },\n        );\n    }\n\n    /// Web `clearRallyPoint`", "p6_4_rally"),
    ("M11-mnoznik-morza-bez-max", PF, "base / js_max(ruch_jednostek_params().embarkacja.min_mnoznik_ruchu, mult)", "base / mult", "p6_4_embark"),
    ("M12-koszt-wody-tabela", JS, '"koszt_wody": 1,', '"koszt_wody": 2,', "p6_4_embark"),
    ("M13-widocznosc-ostra", PF, "if hex_distance_f(qf, rf, qf + dq, rf + dr) <= sight {", "if hex_distance_f(qf, rf, qf + dq, rf + dr) < sight {", "p6_4_core"),
    ("M14-from-save-calkowitosc", PF, "let owner_id = js_number_from_str(raw_owner_id);\n            if !js_is_integer(owner_id) {\n                continue;\n            }", "let owner_id = js_number_from_str(raw_owner_id);", "p6_4_rally"),
    ("M15-promien-wyszukiwania", JS, '"bufor_promienia": 12,', '"bufor_promienia": 0,', "p6_4_core"),
    ("M16-prog-nieprzejezdny", JS, '"prog_nieprzejezdny": 90,', '"prog_nieprzejezdny": 1,', "p6_4_core"),
    ("M17-obstacle-no-movement", PF, "return halt(MarchStopReason::NoMovement, &texts.brak_ruchu);\n        }\n        let path = compute_path(unit, map, dest.dest_q, dest.dest_r, occupied, cost_fn);", "return halt(MarchStopReason::NoPath, &texts.brak_ruchu);\n        }\n        let path = compute_path(unit, map, dest.dest_q, dest.dest_r, occupied, cost_fn);", "p6_4_march"),
    ("M18-village-priorytet", PF, "if (path.len() as f64) < best_path_len {", "if (path.len() as f64) <= best_path_len {", "p6_4_scout"),
]

env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_TARGET_DIR=TARGET, CARGO_PROFILE_DEV_DEBUG="0", RUST_BACKTRACE="0")
failed = False
for mid, rel, old, new, test in MUTATIONS:
    if WANT != ["all"] and mid.split("-")[0] not in WANT and mid not in WANT:
        continue
    path = ENGINE / rel
    original = path.read_text(encoding="utf-8")
    count = original.count(old)
    if count != 1:
        print(f"MUTACJA {mid}: BLAD (wzorzec wystepuje {count}x)")
        failed = True
        continue
    try:
        path.write_text(original.replace(old, new), encoding="utf-8")
        proc = subprocess.run(["cargo", "test", "--test", test], cwd=ENGINE, env=env, capture_output=True, text=True)
        tail = [l for l in (proc.stdout + proc.stderr).splitlines() if l.startswith("test result") or "FAILED" in l or "panicked" in l]
        verdict = "WYKRYTA" if proc.returncode != 0 else "NIEWYKRYTA"
        if proc.returncode == 0:
            failed = True
        print(f"MUTACJA {mid} ({rel}, test {test}): {verdict} (exit={proc.returncode}); {' | '.join(tail[:3])[:300]}")
    finally:
        path.write_text(original, encoding="utf-8")
sys.exit(1 if failed else 0)
