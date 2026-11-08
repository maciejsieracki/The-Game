# Runda 2 — Operator (obrona) — R-RUSTPORT-REPIN-AI-PRIORYTETY-CEL-Q1

STATUS: PASS-WITH-NOTES (GOAL (a) spełniony; (b) częściowo; (c) konsument nieportowany)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-AI-PRIORYTETY-CEL-Q1
GOAL: REPIN zmian weba AI: (a) FALA 551 AIDRA (planHomeWar), (b) FALA 553 NEARCITY (tie-break defenders),
(c) FALA 558 ERAPOOL (gracz w puli wojen epoki).
BAZA: c8d2be640 (runda 1). Web: `origin/main` (pin 14f2af1b0 dla sekcji wektorów; źródła z `git show origin/main:gra/src/game/*`).

## ZMIANY / COMMITY
- `8bd0d240d` (A): `rust-port/engine/src/domain/war_home_defense.rs` (4A: stałe, typy, pamięć, klastry, decideMode),
  `war_home_defense_plan.rs` (4B: planHomeWar, P2 S1/S3, P1 odbicie), `mod.rs` (+2 pub mod),
  `tests/p6_repin_ai_home.rs`, `tests/p6_repin_ai_home_gen.mjs`, `tests/p6_repin_ai_home_vectors.json`.
- `39b4d036d` (B): `war_target_select.rs` (split_city_targets), `war_all_in_capital_plan.rs`
  (plan_war_all_in_capital_with_defenders, nearest_target_def), `war_all_in_capital.rs` (re-export),
  `tests/p6_repin_ai_nearest_plan.rs`, `dyspozycje/rust-port/p6/P6-REPIN-AI-PRIORYTETY-CEL.md`.
- Nic w `gra/**`, `WERSJE.md`, `Cargo.toml`, renderer, `src-tauri`. Nie wykonano push.

## Odpowiedzi na zarzuty rundy 1
1. (a) planHomeWar — PRZYJMUJĘ. Zportowane (4A+4B), wektory z uruchomionego weba: 160 scenariuszy, 975 kroków tur,
   `tests/p6_repin_ai_home.rs` zielony. Odstępstwo: pamięć jawna (`HomeWarMemoryStore`), zob. doc Odstępstwo 6.
2. Martwy NEARCITY (planner nie wołał tie-breaku) — PRZYJMUJĘ częściowo. Planer ma teraz wejście z `defenders`
   (`plan_war_all_in_capital_with_defenders`), testy `p6_repin_ai_nearest_plan` (2) zielone. Produkcyjny wołający
   planera w `src` NIE ISTNIEJE (planner jest wołany tylko z testów) — podpięcie do tury to osobna partia.
3. ERAPOOL bez konsumenta — PRZYJMUJĘ jako OTWARTE (nie rozwiązane w tej rundzie): brak konsumenta w `src`
   potwierdzony grepem; port ścieżki `main.ts:39016/39091` jest poza zakresem tematu. Progi 20/20 i limit 1 nadal stałe (decyzja właściciela).
4. Allowlista `tests/p6_6b_vectors/common.rs` (+1 linia `founded_by`) — NIE USUNIĘTO. Literał `City` bez tego
   pola nie kompiluje testów p6_6b. Usunięcie wymagałoby innego miejsca dla pola (np. mapa w State) — również poza
   allowlistą. ZAŁOŻENIE do akceptacji orkiestratora.
5. Round-trip `foundedBy` — NIE_ZMIERZONO. `City` nie ma `serde`, w `src` nie ma czytnika zapisu miast czytającego
   `foundedBy`/`foundedByOwner`. Nie wprowadzono czytnika (poza zakresem).
6. Bramki nie odtworzone przez Evaluatora (dysk) — dysk w tej rundzie ~5 GB wolnego, bramki uruchomione (poniżej).
7. Statyczny przegląd `nearest_war_city_target` vs `tieBeforeTarget`: PRZYJMUJĘ — odczytano web
   (`warAllInCapital.ts:411-420`): gdy oba `defenders` zdefiniowane -> mniejsza liczba, potem `cityId`; inaczej `cmpTarget`.
   Rust (`tie_before_target`, `nearest_target_def`) ma tę samą logikę.

## TESTY (wyniki dokładne)
- `rustfmt --edition 2021 --check` na wszystkich zmienionych plikach `.rs`: rc=0.
- `cargo clippy --all-targets -- -D warnings`: rc=0 (po poprawkach 3 lintów w `war_home_defense_plan.rs`).
- `cargo test` podzbiór (11 binarek): `p6_6b_cities_ensure` 3/3, `p6_6b_cities_found` 5/5, `p6_repin_ai_founded_by` 3/3,
  `p6_repin_ai_home` 2/2, `p6_repin_ai_nearest_plan` 2/2, `p6_repin_ai_war_vectors` 4/4, `p6_repin_wojna_2_battle_mode` 3/3,
  `p6_repin_wojna_c_move_range` 12/12, `p6_repin_wojna_d_engage` 12/12, `p6_repin_wojna_d_nav` 23/23,
  `p6_repin_wojna_d_vectors` 1/1 — 0 failed.
- PEŁNY przebieg 309 binarek: NIE_ZMIERZONO (czas i dysk). Brak nowych `#[ignore]`.
- Pokrycie wektorów `planHomeWar`: 1144 klastry `attack`, 454 `hold`, 8 `released`, 124 odbicia `go`, 4 `wait`.
  `wait` i `released` są rzadkie — do wzmocnienia.

## BLOKADY
- (c) brak konsumenta puli wojen epoki w Rust (OTWARTE; nie zamknięte w tej rundzie).
- Podpięcie `plan_home_war` do tury AI — brak wołającego.
- Allowlista `common.rs` (+1 linia) — wymaga akceptacji.
- `foundedBy` round-trip — NIE_ZMIERZONO.
- Progi 20/20, limit 1 — decyzja właściciela (ABC), nie rozstrzygana przeze mnie.

## ZAŁOŻENIA (do akceptacji)
- Odległość = `hex_distance` (axial, max z 3 osi); web `distance` przyjęty jako ta sama definicja (nie zweryfikowano w `game/hex*.ts`).
- `cityFounderId`/`isCityLostOf` w generatorze to KOPIA z `cities.ts`, nie uruchomienie modułu.
- `HOME_WAR_DEFENSE_ENABLED = true` jako stała; przełącznik override testów weba nie portowany.

RUNDY: 2/5
NASTĘPNY KROK: (1) decyzja orkiestratora: akceptacja `common.rs` +1 linia (lub inny sposób trzymania `founded_by`);
(2) osobna partia: podpięcie `plan_home_war` do tury AI; (3) port konsumenta `isPlayerEligibleForEraWarPool` (main.ts:39016/39091) — albo zamknięcie (c) jako osobny temat;
(4) decyzja ABC progów puli 20/20 i limitu 1; (5) czytnik zapisu miasta dla `foundedBy`.
DEPLOY/PUSH: NIE WYKONANO
