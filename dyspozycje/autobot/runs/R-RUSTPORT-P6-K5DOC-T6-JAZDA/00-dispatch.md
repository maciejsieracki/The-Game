# DISPATCH R-RUSTPORT-P6-K5DOC-T6-JAZDA (runda 1) — JAZDA: czyste funkcje i wektory (#259, K5DOC-T6)

DOMENA: engine Rust (czyste funkcje). MODEL: HAIKU (Operator), SONNET (Evaluator, FC) — skrypt w6s.
BAZA: `origin/rust-port/parity-v2` = `2edc808d7`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`.
ROZPOZNANIE (wejście): `git show daf56eddd:dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T6-JAZDA-ROZPOZNANIE/01-rozpoznanie.md` — przeczytaj w całości (mapa linii, inwentarz Rust, wektory a–e). Linie zweryfikuj przez `git show 07d2fbd72:gra/src/battle/battleScene.ts` przed każdym wektorem; koniec `_cavalryAction` i `_cavDirectedManeuverStep` są oznaczone jako szacunek — dopnij je.
WZÓR: moduł T4a/T5a — `rust-port/engine/src/domain/siege_tactics_pathstep.rs`, `siege_tactics_kite.rs` i generator `p6_k5doc_t4a_gen.mjs`.

## DECYZJA (podjęta przez orkiestratora)
- Zakres T6 to WYŁĄCZNIE czyste funkcje i wektory, BEZ wpięcia. `siege_tactics_activate.rs` (galąź `U7.7-cavalry`) NIE jest zmieniana — wpięcie do T8 / #113 (ta sama decyzja co dla T5a).
- Falanga (`_phalanxLineFront`, T7), `_firstStepTowardMelee` i T5b są POZA zakresem.
- Zależności: T2 (#256) zakończone, wymagane. T4b (#313) i T5a (#257) NIE blokują wg rozpoznania; nie czekaj na nie.

## ZAKRES
1. `rust-port/engine/src/domain/siege_tactics_cavalry.rs` (NOWY): funkcje 1:1 z pinu, bez sceny:
   - `cav_adjacent_non_spear` (pin 6351), `cav_priority` wariant jazdowy (pin 6313), `cavalry_target` (pin 6326),
   - `cavalry_action_decide` — decyzja kolejności z `_cavalryAction` (pin 6372–~6425): (1) cios w sąsiada nie-wlocznika, (2) manewr kierunkowy, (3) `_cavManeuverStep`, (4) forsowany atak na wlocznika, (5) `best_charge_step_key` (pin 17736), (6) done,
   - `cav_directed_maneuver_step` (pin 6426), `cav_maneuver_step` (pin 6457) z karą `spearAdj` (+0 zamiast +5) i `fordPenalty`,
   - `best_charge_step_key` (pin 17736, `spearAdj` ~17753–17759).
   - Wejścia jawne przez trait (jak `AdvanceWorld`/`AutoBatchEnv`): sąsiedztwo, wrogowie, przejezdność, zajętość, BFS dla kierunku (`first_step_toward_directed_attack`, pin 8509 — może korzystać z `first_step_along_path_to_attack` z T4a).
   - Użyj istniejących `desired_hit_for_direction` (`siege_tactics_doctrine_target.rs:40`), `is_mounted`/`is_anti_cav_spear` (pin 1502, 1522 — jeśli brak w Rust, dopisz jako funkcje predykatu w tym module).
2. `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_cavalry;`.
3. Wektory: `rust-port/engine/tests/p6_k5doc_cavalry_gen.mjs` (NOWY) wykonuje tekst pina przez TS i zapisuje `p6_k5doc_cavalry_vectors/vectors.json`. Testy `rust-port/engine/tests/p6_k5doc_cavalry.rs` (NOWY) porównują wyniki bajt-w-bajt.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_cavalry.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_cavalry;`
- `rust-port/engine/tests/p6_k5doc_cavalry*.rs` (NOWE), `rust-port/engine/tests/p6_k5doc_cavalry_gen.mjs` (NOWY), `rust-port/engine/tests/p6_k5doc_cavalry_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T6-JAZDA/**`

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_activate.rs`, `siege_tactics_loop.rs`, `siege_tactics_pathstep.rs`, `siege_tactics_doctrine_*`, `ActivateOps`, `ProdBody`.
- Nie portuj falangi (T7 #261), T5b (#260), `_firstStepTowardMelee`.
- Nie zmieniaj `gra/`, `rust-port/view-model/**`, `rust-port/renderer/**`.

## WEKTORY / TESTY
- (a) sąsiad nie-wlocznik → cios natychmiastowy (pin 6372 krok 1);
- (b) brak sąsiada, cel z priorytetem, manewr omijający włócznie: scoring `spearAdj` 0 vs +5 (pin 6457);
- (c) manewr `bok`/`tyl` (C-FLANK) z `desired_hit_for_direction` (pin 1956, 6426);
- (d) forsowany atak na wlocznika gdy brak kroku;
- (e) szarża `best_charge_step_key` jako ostatnia szansa (pin 17736).
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) cios w sąsiada nie-wlocznika pominięty; (b) kara `spearAdj` +5 zamieniona na +0 (odwrotnie); (c) `desired_hit_for_direction` flank↔rear zamienione. Mutant MUSI być nierównoważny (sprawdź dowodem, np. siatką przypadków, jak w obronie T5a) — mutant równoważny nie jest dopuszczalny.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (PEŁNE). Kody wyjścia w raporcie. `df -h /` przed bramką; < 8 GB = BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport `01-operator-r1.md` w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T6-JAZDA/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.

## DODATEK r2 — RUNDA INTEGRACYJNA (po BLOCK dysku rundy 1 i obronie; BAZA NADPISANA)

- Runda 1: Operator BLOCK (dysk), Evaluator FAIL (luka kary spearAdj w szarży i brak pełnego testu), Obrona naprawiła zarzuty 1, 3, 4 (commit `30c1e1392`, `87829df94`). FC: PASS-WITH-NOTES na `87829df94`.
- BAZA (jedyna obowiązująca): `87829df94`. Worktree detached. Kodu NIE zmieniaj.
- Zadanie: WYŁĄCZNIE bramka integracyjna na tym drzewie, przy dysku ≥ 8 GB (`df -h /` przed każdą komendą):
  1. `cargo fmt --check` w `rust-port/engine` — EXIT 0.
  2. `cargo clippy --all-targets -- -D warnings` — EXIT 0.
  3. `cargo test --all-targets --no-fail-fast` — PEŁNY test, EXIT 0, z liczbami (suites, passed, failed, ignored). Limit czasu 2 h; jeśli zawiesi się na `p6_8i_pick`, zapisz dokładny przebieg i czas, nie omijaj.
  4. `cargo test --test p6_k5doc_cavalry` — 10/10.
- Raport `02-operator-r2.md` w run dir z kodami wyjścia. Commit tylko raportu (jawny `git add`, bez `Cargo.lock`, bez nazwy modelu). Nic nie pushuj do parity; nie dotykaj kodu.

## DODATEK r3 — TYLKO PEŁNA BRAMKA (po restarcie kontenera; BAZA NADPISANA)

- Poprzednia runda integracyjna została przerwana restartem. Zrobiono fmt, clippy i `p6_k5doc_cavalry` 10/10 na `87829df94`; pełny test nie zakończył się.
- BAZA (jedyna obowiązująca): `87829df94`. Worktree detached. Kodu NIE zmieniaj.
- Zadanie: `cargo test --all-targets --no-fail-fast` w `rust-port/engine` — pełny, EXIT 0 z liczbami (suites, passed, failed, ignored). `df -h /` ≥ 8 GB przed bramką. Limit czasu 2 h.
- Raport `02-operator-r3.md`, commit tylko raportu (jawny `git add`, bez `Cargo.lock`, bez nazwy modelu). NIE pushuj do parity.

## DODATEK r5 — RUNDA INTEGRACYJNA NA AKTUALNYM PARITY (BAZA NADPISANA)

- Kod T6 `87829df94` (FC PASS-WITH-NOTES, rodzic `2edc808d7`). Parity przesunięte: `origin/rust-port/parity-v2` = `625624d97` (zawiera T4b i T5a). Pełny test z rundy r3 nie został dokończony — trzeba go zrobić na merge.
- BAZA (jedyna obowiązująca): `625624d97`. Worktree detached.
- Zadanie:
  1. `git merge --no-ff --no-edit 87829df94` (merge-tree czysty, exit 0). Commit merge zostaw lokalnie.
  2. `git diff --stat 625624d97 <merge>` musi pokazać tylko pliki T6 (siege_tactics_cavalry.rs, mod.rs +1 linia, p6_k5doc_cavalry*, vectors.json, raport). Inaczej BLOCK.
  3. Bramka na drzewie merge, `df -h /` ≥ 8 GB: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` w `rust-port/engine` — EXIT 0 z liczbami. Dla `p6_k5doc_cavalry` 10/10.
  4. Raport `03-integracja-r5.md` w run dir, commit tylko raportu (jawny `git add`, bez `Cargo.lock`, bez nazwy modelu). NIE pushuj do parity.
