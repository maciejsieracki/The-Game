STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JS-MAX-SIGN-R2-Q1 (JS-MAX-SIGN-R2: jedna funkcja js_max/js_min ze znakiem zera + test -0 dla ranged)
GOAL: Ujednolicic dwie kopie js_max/js_min ze znakiem zera w jedna funkcje uzywana przez wolajacych; dodac przypadek -0 dla ranged_shot_damage_f64 (armor=-0).
ZMIANY/COMMIT: allowlista. siege_tactics_blow.rs: js_max/js_min zastapione reeksportem js_max_sign/js_min_sign z siege_tactics_inputs_pos.rs (druga implementacja usunieta). siege_tactics_blow_full.rs: tylko komentarz. tests/p6_ranged_damage_nan.rs: nowy test p6_ranged_damage_nan_pancerz_minus_zero_jak_js. siege_tactics_inputs_pos.rs i unit_power.rs bez zmian (juz uzywaly js_max_sign). SHA: patrz wiadomosc Operatora.
KROK 0: git grep potwierdzil stan wyjsciowy: dwie kopie (siege_tactics_blow.rs:181-210 i siege_tactics_inputs_pos.rs:27,42). Zmiana nie byla jeszcze w kodzie. unit_power.rs i siege_tactics_blow_full.rs juz importowaly js_max_sign. Brak przypadku -0 w p6_ranged_damage_nan.rs przed zmiana.
PIN: 07d2fbd72:gra/src/game/combat.ts:485 (rangedShotDamage); gra/data/combat-params.json (opis RANGED-DAMAGE-MULT). Znak zera nie jest obserwowalny w obrazeniach: wynik = Math.max(1, Math.round(raw)) >= 1.
DOWOD SEMANTYKI: dla wartosci niezerowych a.max(b) i wersja `a > b ? a : b` daja ten sam wynik; przypadki zerowe (-0,+0) obsluguje ta sama galaz w obu wersjach. Zamiana jest zachowawcza.
TESTY:
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 99 passed, 0 failed, 0 ignored
- cargo test --test p6_ranged_damage_nan: 8 passed (w tym nowy test -0)
- p6_js_max_sign, p6_js_max0, p6_js_max0_rest, p6_unit_power_maxnan, p6_siege_tactics_blow: wszystkie ok
- Wektory pinu p6_ranged_damage_nan_vectors: bez zmian, asercje NaN/Infinity >= 20 ok
- Brak #[ignore], brak oslabionych asercji, brak martwego wrappera (blow::js_max jest reeksportem uzywanym przez wiele modulow).
BLOKADY: brak. Cargo.lock powstal po buildzie i NIE jest commitowany. Pozostale js_max/js_min w innych modulach (mapgen, diplomacy_*, roads, turn_economy, civ_matrix itd.) to osobne kopie poza allowlista i zakresem tematu, nie ruszane.
RUNDY: 1/5
NASTEPNY KROK: Evaluator r1 (weryfikacja zmiany wzgledem pinu i bramek).
DEPLOY/PUSH: NIE WYKONANO
