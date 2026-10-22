#!/usr/bin/env python3
"""Mutacje kodu/tabel P6.5A: kazda mutacja musi zostac WYKRYTA przez testy (exit != 0).

Uzycie: mutate-p65a.py <ENGINE_DIR> <CARGO_TARGET_DIR> <ID,ID,...|all>
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
RS = "src/domain/recruitment.rs"
TEMPO = "data/derived/unit-cost-tempo.json"
ARMY = "data/derived/army-merge-params.json"
RUCH = "data/derived/ruch-jednostek-params.json"

MUTATIONS = [
    ("M01-widoczny-bez-garnizonu", RS, "                    && !u.in_garnizon()\n                    && group_id.is_none_or(|g| stack_group_id_of(u) == g)\n            })\n            .collect()\n    }\n\n    /// Web `coLocatedForMergePrompt`", "                    && group_id.is_none_or(|g| stack_group_id_of(u) == g)\n            })\n            .collect()\n    }\n\n    /// Web `coLocatedForMergePrompt`", "p6_5a_stack"),
    ("M02-colocated-bez-oblezen", RS, "                    && !u.oblega()\n                    && group_id.is_none_or", "                    && group_id.is_none_or", "p6_5a_stack"),
    ("M03-garnizon-odwrocony", RS, "                    && u.in_garnizon()\n                    && group_id.is_none_or", "                    && !u.in_garnizon()\n                    && group_id.is_none_or", "p6_5a_stack"),
    ("M04-exit-garnizon-sentry", RS, "        u.in_garnizon = Some(false);\n        u.sentry = Some(false);\n", "        u.in_garnizon = Some(false);\n", "p6_5a_stack"),
    ("M05-fortify-auto-explore", RS, "        u.auto_explore = Some(false);\n", "", "p6_5a_stack"),
    ("M06-remis-id-utf8", RS, "} else if js_str_lt(&u.id, &best.id) {", "} else if u.id < best.id {", "p6_5a_display"),
    ("M07-remis-id-kierunek", RS, "} else if js_str_lt(&u.id, &best.id) {", "} else if js_str_lt(&best.id, &u.id) {", "p6_5a_display"),
    ("M08-klucz-renderu-garnizon", RS, "        if u.in_garnizon() {\n            key.push_str(&stos.przyrostek_garnizon);\n        }\n", "", "p6_5a_stack"),
    ("M09-hp-bez-dolnej-klamry", RS, "Some(current) if current.is_finite() => js_max(0.0, js_min(m, current)),", "Some(current) if current.is_finite() => js_min(m, current),", "p6_5a_display"),
    # M10: mutacja ROWNOWAZNA (m == 0 wnosi 0 do obu sum niezaleznie od progu) - oczekiwany wynik NIEWYKRYTA.
    ("M10-hp-prog-maksimum", RS, "if !m.is_finite() || m <= 0.0 {", "if !m.is_finite() || m < 0.0 {", "p6_5a_display"),
    ("M11-zwrot-bez-klamry-ruch", RS, "js_min(u.ruch, u.ruch_left + safe_deducted),", "u.ruch_left + safe_deducted,", "p6_5a_ruch"),
    ("M12-zwrot-ujemny-odjety", RS, "let safe_deducted = js_max(0.0, deducted_ruch);", "let safe_deducted = deducted_ruch;", "p6_5a_ruch"),
    ("M13-powrot-wrog", RS, "u.owner_id != owner_id && !u.in_garnizon()", "u.owner_id == owner_id && !u.in_garnizon()", "p6_5a_ruch"),
    ("M14-bounce-wirtualna-zajetosc", RS, "            virtual_occ.insert(spot);\n", "", "p6_5a_ruch"),
    ("M15-bounce-wlasne-id", RS, "                    && !unit_ids.contains(&u.id.as_str())\n", "", "p6_5a_ruch"),
    ("M16-sasiedzi-kolejnosc", RUCH, '"sasiedzi": [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]', '"sasiedzi": [[-1, 0], [1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]]', "p6_5a_ruch"),
    ("M17-planowanie-bez-fortyfikacji-pola", RS, "Some(snapshot) if u.in_garnizon() || is_true(u.ufortyfikowany_w_polu) => snapshot,", "Some(snapshot) if u.in_garnizon() => snapshot,", "p6_5a_ruch"),
    ("M18-min-znak-zera", RS, "        } else if a.is_sign_negative() {\n            a\n        } else {\n            b\n        }\n    }\n\n    /// Web `Math.max(a, b)`", "        } else if a.is_sign_positive() {\n            a\n        } else {\n            b\n        }\n    }\n\n    /// Web `Math.max(a, b)`", "p6_5a_ruch"),
    ("M19-round-polowka", RS, "let rounded = if x - floor >= 0.5 { floor + 1.0 } else { floor };", "let rounded = if x - floor > 0.5 { floor + 1.0 } else { floor };", "p6_5a_cost"),
    ("M20-koszt-dolna-granica", RS, "js_max(table.min_koszt, js_round(bazowy_koszt * mnoznik))", "js_round(bazowy_koszt * mnoznik)", "p6_5a_cost"),
    ("M21-tempo-normalny", TEMPO, '"mnoznik": 2.0', '"mnoznik": 2.5', "p6_5a_cost"),
    ("M22-min-koszt-tabela", TEMPO, '"min_koszt": 1,', '"min_koszt": 0,', "p6_5a_cost"),
    ("M23-etykieta-ten-heks", ARMY, '"etykieta_ten_heks": "W mieście (ten heks)"', '"etykieta_ten_heks": "W miescie"', "p6_5a_ruch"),
    ("M24-hud-prog-rozdzielenia", RS, "if stack_length >= params.min_stos_rozdzielenia {", "if stack_length > params.min_stos_rozdzielenia {", "p6_5a_ruch"),
    ("M25-hud-rozdziel-wylaczony", RS, "disabled: split_destination_count == 0,", "disabled: split_destination_count != 0,", "p6_5a_ruch"),
    ("M26-id-stosu-podstawa", RS, "to_radix(self.seq, params.podstawa),", "self.seq.to_string(),", "p6_5a_stack"),
    ("M27-sync-domyslne-minimum", RS, "let v = ruch_left.unwrap_or_else(|| min_by(stack, |u| u.ruch_left));", "let v = ruch_left.unwrap_or(0.0);", "p6_5a_ruch"),
    ("M28-odejmij-bez-klamry", RS, "Some(js_max(0.0, pooled - cost))", "Some(pooled - cost)", "p6_5a_ruch"),
    ("M29-ruch-stosu-pojedynczy", RS, "        if stack.len() <= 1 {\n            return unit.clone();", "        if stack.is_empty() {\n            return unit.clone();", "p6_5a_ruch"),
    ("M30-plakietka-prog", RS, "            if stack.len() > 1 {\n                ordered_set(&mut badge_by_rep_id", "            if stack.len() >= 1 {\n                ordered_set(&mut badge_by_rep_id", "p6_5a_display"),
    ("M31-map-nadpisanie", RS, "            entry.1 = value;\n", "", "p6_5a_display"),
    ("M32-moc-pustego-stosu", RS, "        if stack.is_empty() {\n            return 0.0;\n        }\n        let roster", "        let roster", "p6_5a_display"),
    ("M33-weteran-start", ARMY, '"poziom_weterana_poczatkowy": 1', '"poziom_weterana_poczatkowy": 0', "p6_5a_display"),
    ("M34-wake-sentry", RS, "            if is_true(su.sentry) {\n                su.sentry = Some(false);\n            }\n", "", "p6_5a_stack"),
    ("M35-obroncy-pusty-roster", RS, "!defenders.is_empty() && defenders", "defenders", "p6_5a_stack"),
    ("M36-aktywny-stos-garnizon", RS, "        if active.in_garnizon() {\n            garrison_units_on_hex", "        if !active.in_garnizon() {\n            garrison_units_on_hex", "p6_5a_stack"),
    ("M37-reprezentant-pojedynczy", RS, "            1 => Some(stack[0]),", "            1 => None,", "p6_5a_display"),
    ("M38-etykieta-split-brak", RS, "label: Some(army_merge_params().podzial.etykieta_ten_heks.clone()),", "label: None,", "p6_5a_ruch"),
    ("M39-puste-heksy-garnizon", RS, "                .any(|u| u.q == nq && u.r == nr && !u.in_garnizon());", "                .any(|u| u.q == nq && u.r == nr);", "p6_5a_ruch"),
    ("M41-hp-skonczonosc", RS, "if !m.is_finite() || m <= 0.0 {", "if m <= 0.0 {", "p6_5a_display"),
    ("M40-odznaka-start", ARMY, '"poziom_odznaki_poczatkowy": 0', '"poziom_odznaki_poczatkowy": 1', "p6_5a_display"),
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
        print(f"MUTACJA {mid} ({rel}, test {test}): {verdict} (exit={proc.returncode}); {' | '.join(tail[:3])[:300].rstrip()}", flush=True)
    finally:
        path.write_text(original, encoding="utf-8")
sys.exit(1 if failed else 0)
