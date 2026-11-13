STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-Q1 (#110, runda 1)
GOAL: Zastapic prywatne kopie js_max/js_min/js_max0/js_max_sign jedna funkcja ze znakiem zera i NaN jak w siege_tactics_inputs_pos.rs:27,42.
ZMIANY/COMMIT: brak zmian w kodzie (BLOCK wg kryterium 5 dispatchu). Commit zawiera wylacznie ten raport. Baza: a0b302eb8 (galaz wip/R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-Q1 utworzona z tego SHA; worktree startowal na bff897c9b, przelaczony wg dispatchu).

KROK 0 (git grep, baza a0b302eb8): kopie NIE sa usuniete, wiec temat nie jest zamkniety jako PASS.
  - Definicje js_max/js_min/js_max0/js_max_sign/js_min_sign w rust-port/engine/src: 38 (w tym 2 referencyjne w siege_tactics_inputs_pos.rs:27,42).
  - W allowliscie dispatchu: 19 definicji w 14 plikach (auto_improvements.rs:229,240; civ_matrix.rs:36,45; diplomacy_multiwar.rs:27,42; diplomacy_tick_war_brake.rs:111,126; mapgen/masks.rs:61,76; turn_economy.rs:385,400; siege_capital_plunder.rs:128; siege_tactics_activate.rs:186; siege_tactics_breach.rs:77; siege_tactics_end.rs:26; siege_tactics_endcheck.rs:59; siege_tactics_inputs_wall.rs:118; siege_tactics_unit.rs:38; turn_economy_post.rs:421).
  - POZA allowlista: 16 prywatnych kopii w 12 plikach: economy_city_fns.rs:30 (js_min); mapgen/cluster_layout.rs:78 (js_max); mapgen/relief.rs:56,71; mapgen/terrain_class.rs:53,68; okolica.rs:161; order_effects_culture.rs:64; order_effects_lane.rs:100; pathfinding.rs:716; recruitment.rs:321,336 (pub, army_merge); roads.rs:36; society_breakdown.rs:145,160 (pub); territory.rs:149.
  - Sumarycznie 19 + 16 + 2 = 37, czyli liczba z tytulu tematu obejmuje kopie spoza allowlisty.

BLOKADY:
  1. Zakres poza allowlista (kryterium 5): 16 kopii w 12 plikach nie jest na allowliscie. Zastapienie 37 kopii wymaga zmian w plikach spoza listy, wiec zgodnie z dispatchem BLOCK bez zmian w kodzie.
  2. Semantyka zera NIE jest jednorodna w kopiach allowlisty, a dispatch wymaga "semantyka NaN i -0 bez zmian" (civ_matrix):
     - auto_improvements.rs:229 js_max: a>b ? a : b, bez galezi dla zer -> js_max(+0,-0) = -0 (JS daje +0).
     - civ_matrix.rs:45,36: a.max(b)/a.min(b) -> zachowanie dla +-0 zalezne od Rust f64::max/min, nie jest JS-owe ani zdefiniowane.
     - siege_capital_plunder.rs:128 js_max0: x.max(0.0) -> ten sam problem dla x=-0.
     - turn_economy.rs:385, masks.rs:61, diplomacy_multiwar.rs:27, diplomacy_tick_war_brake.rs:111: rozne galezie dla +-0 (zgodne z JS, ale innymi regulami).
     - siege_tactics_{activate,breach,end,endcheck,unit}.rs js_max0 = js_max(0.0, x) -> zachowanie zalezy od tego, ktory js_max jest importowany; testy js_max0_zero_sign_jak_math_max sa w tych plikach i nie moga zostac oslabione.
     Jedna funkcja ze znakiem zera (js_max_sign z siege_tactics_inputs_pos.rs) zmieni wynik dla callerow, ktore dzis dostaja -0 lub NaN inaczej. To wymaga decyzji, ktory caller ma miec ktore zachowanie, a nie tylko podmiany wywolan.
  3. Zaleznosci miedzy modulami: js_max jest wywolywany przez inne sciezki spoza kopii (np. auto_improvements/pick.rs, single_pass.rs, fort_claim.rs; city_growth.rs importuje recruitment::army_merge::{js_max,js_min}; building_costs.rs importuje civ_matrix::js_compat::{js_max,js_min}; turn_economy_post.rs woła recruitment::army_merge::js_max). Konsolidacja musi najpierw ustalic jedno zrodlo prawdy; to przekracza allowliste.
  4. Wektory pinu: nie zweryfikowano w tej rundzie. Brak dedykowanego generatora js_max/js_min z guardem SHA-256 w tym temacie; istniejacy test p6_8j_guards.rs:12 (js_max_min_signed_zero_like_math) i wektory siege_tactics_inputs_pos_vectors nie zostaly uruchomione, bo nie bylo zmian do testowania.
  5. Kolizja JS0 (621e7338f): NIE koliduje. Commit 621e7338f jest dokumentacyjny (R-RUSTPORT-P6-JS-MAX0-REST-Q1/03-final-control.md, +15 linii) i jest juz przodkiem a0b302eb8. Brak konfliktu z kodem.
  6. Istnieja wczesniejsze runy JS-MAX-SIGN-Q1, JS-MAX-SIGN-R2-Q1, JS-MAX0-HARDENING-Q1, JS-MAX0-REST-Q1 oraz P4-18-JSMATH-CONSOLIDATE-Q1 (ten ostatni dotyczy renderer/jsmath, nie engine). Ich wynik nie usunal kopii z engine w bazie a0b302eb8; przed r2 nalezy sprawdzic, ktory z nich ma byc zrodlem decyzji o semantyce.

TESTY: NIE_ZMIERZONO. Brak zmian w kodzie, wiec cargo fmt/clippy/test nie byly uruchamiane (kryterium 4 nieosiagalne bez zmian). Zapis git grep wykonany na a0b302eb8 (patrz KROK 0).
RUNDY: 1/5. Ostatni werdykt: BLOCK (Operator r1). Decyzja wymagana od orkiestratora: (a) zawezic zakres do 19 kopii allowlisty z jawnym wyborem semantyki zera dla kazdego callera, albo (b) rozszerzyc allowliste o 12 plikow spoza listy i ustalic jedno zrodlo prawdy dla js_max0 (JS +0 vs NaN), albo (c) wykonac zakres w osobnych tematach.
NASTEPNY KROK: orkiestrator decyduje o zakresie (a/b/c) i wydaje dispatch r2 z nowa allowlista i jawna tabela semantyki zera. Bez tego nie startowac zmian w kodzie.
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje; brak push do rust-port/parity-v2, brak integracji, brak dotkniecia gra/ i origin/main, Cargo.lock nie commitowany).
