# DISPATCH R-RUSTPORT-P6-K5DOC-T5A-KITE (runda 1) — STRZELEC-KITE: czyste funkcje + wektory (#257, K5DOC-T5a)

DOMENA: engine Rust (silnik bitwy oblężniczej, czyste funkcje). MODEL: HAIKU (Operator), SONNET (Evaluator, FC) — zgodnie ze skryptem w6s.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `2edc808d7`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`.
ROZPOZNANIE (wejście): `git show ee4989e61:dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5A-KITE-ROZPOZNANIE/01-rozpoznanie.md` — przeczytaj w całości. Mapa linii pinu i inwentarz Rust są tam. Nie zgaduj linii — zweryfikuj `git show 07d2fbd72:gra/src/battle/battleScene.ts` przed każdym wektorem.
WZÓR: moduł T4a — `rust-port/engine/src/domain/siege_tactics_pathstep.rs` i generator `rust-port/engine/tests/p6_k5doc_t4a_gen.mjs` (wykonuje tekst pina przez TS i zapisuje wektory JSON).

## DECYZJA (podjęta przez orkiestratora)
- Zakres T5a to WYŁĄCZNIE czyste funkcje i predykat, BEZ wpięcia w pętlę. `ActivateOps` i `siege_tactics_activate.rs` NIE są zmieniane (zmiana kontraktu odłożona do T8 / #113). Wpięcie gałęzi KITE w `U7.5-ranged` to T8.
- `_rangedBackStep`, `_bestBackStep` i `_rangedForwardStep` (T5b) są POZA zakresem.

## ZAKRES
1. `rust-port/engine/src/domain/siege_tactics_kite.rs` (NOWY):
   - `MELEE_SAFE_GAP: i32 = 2` (pin `battleScene.ts:968`).
   - `best_kite_shot_step(...)` — 1:1 z `_bestKiteShotStep` (pin 6959-7002): kierunek `advance_dir(side)`, wrogowie, zwrot `Option<CellKey>`, kolejność DIRS4 (pin `:337`), odrzuty (plansza, zajętość, przejezdność, `dMinAny <= 1`, brak celu w zasięgu, `gap <= dNow`), wynik `gapScore = gap*100 + (movedBackAxis ? 50 : 0)`, remis po `lateral` (ostro `<`, pierwszy z DIRS4 wygrywa).
   - `nearest_enemy_melee(...)` — 1:1 z `_nearestEnemyMelee` (pin 8315-8324): pomija `primary_ranged`.
   - `kite_branch_applies(...)` — predykat warunku gałęzi 1 (pin 6689-6691): `primary_ranged && ranged_kite` oraz `melee_threat && manhattan <= MELEE_SAFE_GAP`. Tylko predykat, bez wykonania ruchu.
   - Wejścia jawne (trait lub argumenty): pozycja, wrogowie, zasięg, strona, predykaty zajętości i przejezdności, `cell_key`. Użyj istniejących `manhattan`, `enemies_of`, `ranged_target_in_range`, `advance_dir` z `siege_tactics_doctrine_target.rs` / `siege_tactics_doctrine_state.rs` (patrz rozpoznanie, sekcja 2).
2. `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_kite;`.
3. Wektory: `rust-port/engine/tests/p6_k5doc_t5a_gen.mjs` (NOWY) wykonuje tekst pina `_bestKiteShotStep`, `_nearestEnemyMelee` i warunek 6689-6691 i zapisuje `p6_k5doc_t5a_vectors/vectors.json`. Testy Rust `rust-port/engine/tests/p6_k5doc_t5a.rs` (NOWY) czytają wektory i porównują bajt-w-bajt z wynikiem Rust.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_kite.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_kite;`
- `rust-port/engine/tests/p6_k5doc_t5a*.rs` (NOWE), `rust-port/engine/tests/p6_k5doc_t5a_gen.mjs` (NOWY), `rust-port/engine/tests/p6_k5doc_t5a_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5A-KITE/**`

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_activate.rs`, `siege_tactics_loop.rs`, `siege_tactics_pathstep.rs`, `siege_tactics_doctrine_*`, `ActivateOps`, `ProdBody`.
- Nie portuj `_rangedBackStep`, `_bestBackStep`, `_rangedForwardStep` (T5b #260).
- Nie zmieniaj `gra/`, `rust-port/view-model/**`, `rust-port/renderer/**`.

## WEKTORY / TESTY
- `best_kite_shot_step`: brak wroga → `None` (pin 6962); granica planszy (`nc<0`, `nc>=BF_COLS`, `nr>=BF_ROWS`, pin 6971 + 661-662); zajęty kafelek (`occByKey`, pin 2423); `dMinAny <= 1` odrzuca; brak celu w `[1..range]` odrzuca; `gap <= dNow` odrzuca; `movedBackAxis` daje +50; remis po `lateral`, pierwszy z DIRS4 wygrywa.
- `nearest_enemy_melee`: pomija `primary_ranged`; zwraca najbliższego melee.
- `kite_branch_applies`: `ranged_kite = false` wyłącza gałąź; próg `MELEE_SAFE_GAP` (dokładnie 2 — wektor graniczny).
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) `gap <= dNow` zamienione na `gap < dNow`; (b) bonus `movedBackAxis` usunięty; (c) `dMinAny <= 1` zamienione na `dMinAny < 1`.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5A-KITE/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.

## DODATEK r2 (po BLOCK INFRA i zarzutach Ewaluatora rundy 1; BAZA NADPISANA)

- Runda 1: Operator wykonał kod, Ewaluator i Obrona zgłosili zarzuty (raport obrony zachowany w `wf-d3b365ce`, commit `8884ee5a8` na `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5A-KITE-reports-r1`). FC nie ruszył z powodu braku dysku.
- NOWA BAZA (jedyna obowiązująca): `7de3417e8` (kod Operatora rundy 1, baza `2edc808d7`). Worktree detached. Kod NIE jest przepisywany, tylko poprawiany wg poniższego.
- Zadanie rundy 2:
  1. **Typ zwrotu:** `best_kite_shot_step` zwraca `Option<CellKey>` (`CellKey = (u64, u64)`, `cell_key(col,row)` w `siege_tactics_autobatch.rs`), a NIE `Option<Tile>`, zgodnie z pisemną specyfikacją. W teście mapuj wynik `.map(|(c, r)| (f64::from_bits(c), f64::from_bits(r)))`.
  2. **Mutant (a) — DECYZJA ORKIESTRATORA:** mutant `gap <= dNow` → `gap < dNow` jest równoważny (dowód w obronie: 25920 przypadków, `gap - dNow ∈ {+1,-1}`). ZAMIEŃ go na NIERÓWNOWAŻNY: `gap <= dNow` → `gap < dNow - 1`. Test `best_gap_nie_wiekszy_od_dnow_odrzuca` (me (2,5), zagrożenie (5,5), kandydat (3,5): gap=2, dNow=3) musi wtedy dać FAIL.
  3. **Test `p6_8i_pick`:** zawieszał się w pełnym runie rundy 1 (NIE_ZMIERZONO na bazie). Uruchom go NA BAZIE `7de3417e8` z limitem czasu i zapisz wynik. Jeśli zawiesza się także na bazie — to dług istniejący, zapisz w raporcie, nie naprawiaj.
  4. **Pełne bramki** w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`, każda EXIT 0 (zapisz kody). Sprawdź `df -h /` przed bramkami (≥ 8 GB).
  5. **Mutacje** (a) nierównoważny, (b), (c): wszystkie FAIL, z wynikami.
  6. Raport `01-operator-r2.md` w run dir. Commit jawnym `git add` (bez `Cargo.lock`, bez `-A`, bez nazwy modelu w trailerach). Bez push do parity.
