STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JS-MAX-SIGN-R2-Q1 (obrona Operatora r1 wobec zarzutow Evaluatora r1, 02-evaluator.md)
GOAL: jedna funkcja js_max/js_min ze znakiem zera + test -0 dla ranged
BAZA: 23e33793e -> Operator 4e365f4b6 (zmiana kodu) -> obrona: commit z poprawka testu (SHA w raporcie orkiestratora)
ZMIANY/COMMIT: allowlista. Poprawka tylko w rust-port/engine/tests/p6_ranged_damage_nan.rs (test p6_ranged_damage_nan_pancerz_minus_zero_rowny_plus_zero zastepuje p6_ranged_damage_nan_pancerz_minus_zero_jak_js). Kod produkcyjny bez zmian wzgledem 4e365f4b6.

ODPOWIEDZI NA ZARZUTY:

1. (istotny) Test reczny, nie wektor pinu; brak generatora/straznika SHA/licznika -> ODRZUCAM w czesci dotyczacej kryterium 2, PRZYJMUJE fakt.
   Fakt: test p6_ranged_damage_nan_pancerz_minus_zero_* jest recznym przypadkiem; NIE jest testem wektorowym pinu i komentarz w tescie mowi to wprost.
   Kryterium 2 spelniaja istniejace wektory pinu: p6_js_max_sign_vectors (bit-w-bit, w tym "-0") oraz p6_js_max0 / p6_js_max0_rest, z generatorami .mjs i licznikami niepustosci (nie zmienione).
   Dodanie wektora ranged z -0 wymagaloby zmiany p6_ranged_damage_nan_gen.mjs i vectors/ranged.json, czyli poza allowlista; wg kryterium 5 bylby to BLOCK. Nie dodaje.

2. (istotny) Test nie rozroznia znaku zera -> PRZYJMUJE w pelni.
   Dowod: wynik ranged_shot_damage_f64 = js_max(1, js_round_js(raw)) (unit_power.rs). Wynik to NaN, Infinity albo liczba >= 1, NIGDY zero. Znak zera w wyniku jest nieobserwowalny (Operator zapisal to w 01-operator-r1.md). Stary test sprawdzal wyniki 10 i 1 i przechodzilby tez z f64::max.
   Poprawka: test przepisany na asercje prawdziwe, bez udawania dowodu: armor -0 daje 10.0 i rowno wynik dla armor +0; floor 1.0 dla kontr -0. Komentarz mowi, ze znak zera w ranged jest niewidoczny, a znak zera js_max/js_min dowodzi p6_js_max_sign.rs (bit-w-bit, przypadki -0).
   Dowod unifikacji (struktura): git grep w rust-port/engine/src pokazuje w modulach siege_tactics_* i unit_power jedna definicje: siege_tactics_inputs_pos.rs:27 (js_max_sign), :42 (js_min_sign); siege_tactics_blow.rs:182 i :186 to reeksporty `pub use ... as js_max/js_min`; siege_tactics_blow_full.rs i unit_power.rs importuja js_max_sign. Kopia z blow.rs (dawne linie 181-210) usunieta.

3. (drobny) Dowod numerami linii pinu dla Math.max(-0,0) -> PRZYJMUJE, uzupelniam.
   Pin 07d2fbd72:gra/src/game/combat.ts, uzycia Math.max odwzorowane przez port: :460 (Math.max(0, weaponDamage - armor)), :469 (Math.max(1, missileAttack - armor) = rangeDamageTw), :477 (Math.max(meleeAttack, missileAttack)), :495 (Math.max(1, Math.round(raw)) = rangedShotDamage). Semantyka znaku zera pochodzi ze specyfikacji ECMAScript Math.max/min, nie z pinu. Sprawdzone lokalnie (node): Object.is(Math.max(-0,0),0), Object.is(Math.max(0,-0),0), Object.is(Math.min(0,-0),-0), Object.is(Math.max(1,-0),1) -> true true true true.

4. (drobny) Lokalne wrappery js_max0 i kopie poza zakresem -> PRZYJMUJE jako notatke, BEZ zmian.
   git grep potwierdza, ze poza allowlista pozostaja m.in.: auto_improvements.rs:229, civ_matrix.rs:36/45, diplomacy_multiwar.rs:27/42, diplomacy_tick_war_brake.rs:111/126, mapgen/*, roads.rs:36, turn_economy.rs:385/400, siege_capital_plunder.rs:128 (js_max0), siege_tactics_{activate,breach,end,endcheck,inputs_wall,unit}.rs (js_max0), turn_economy_post.rs:421 (js_max0). To swiadoma decyzja z dispatchu (allowlista) i wymaga osobnego tematu.

TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo, usuniety po bramkach):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 99 passed, 0 failed, 0 ignored
- cargo test --test p6_ranged_damage_nan: 8 passed (w tym przepisany test)
- p6_js_max_sign 2/2, p6_js_max0 2/2, p6_js_max0_rest 3/3, p6_unit_power_maxnan 2/2, p6_siege_tactics_blow 3/3: wszystkie ok
- Brak #[ignore], brak oslabionych asercji w istniejacych testach, Cargo.lock nie dodany.

BLOKADY: brak. Pozostale kopie js_max/js_min/js_max0 poza allowlista: notatka (pkt 4).
RUNDY: 2/5 (runda obrony po zarzutach Evaluatora r1)
NASTEPNY KROK: Evaluator r2 (weryfikacja przepisanego testu i pkt 1-4) -> Final Control.
DEPLOY/PUSH: NIE WYKONANO
