STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-POWER-MAXNAN-Q1
GOAL: unit_power: semantyka JS Math.max/min dla NaN (ranged_shot_accuracy, range_damage_tw, hit_chance_tw) + wektory NaN/Inf z pinu
ZMIANY/COMMIT: weryfikowany SHA 85bce3d9f4cd473570317ebd1f2d0fb27a5dff90; ancestor bazy da50d1753 (merge-base --is-ancestor = OK). Diff: tylko unit_power.rs, p6_unit_power_maxnan{.rs,_gen.mjs,_vectors/maxnan.json}, runs/<ID>/** — allowlista zachowana, git diff --check czysty.
TESTY (samodzielnie): fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; lib 88 passed; p6_unit_power_maxnan 2 passed; p6_repin_dystans_formulas 8 passed. NIE_ZMIERZONO: pelny p6_* (runda integracyjna).
Zarzuty:
1. ranged_shot_damage NaN/Inf (i64) — ODDAL: poza allowlista (zmiana typu + callerzy combat.rs); osobny temat.
2. hit_chance_tw(NaN) => pudlo — ODDAL: zgodne z pinem; wartosci skonczone bez zmian.
3. -0 vs +0 — ODDAL: bez wplywu na wyniki.
4. pelny p6_* / combat.rs max/min — ODDAL: poza zakresem/integracja.
Liczba NAPRAW: 0. DO DECYZJI CZLOWIEKA: brak blokujacych.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (pelny cargo test p6_*); osobny temat ranged_shot_damage NaN/Inf
DEPLOY/PUSH: NIE WYKONANO
