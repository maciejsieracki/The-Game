# DISPATCH R-RUSTPORT-P6-K5DOC-T5B-MARSZ (runda 1) — STRZELEC-MARSZ: podejście strzelca (APPROACH) i _rangedForwardStep (#260, K5DOC-T5b)

DOMENA: engine Rust (silnik bitwy oblężniczej, czyste funkcje). MODEL: HAIKU (Operator), SONNET (Evaluator, FC), HAIKU (Obrona) — zgodnie ze skryptem w6s.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `625624d97` (zawiera T4a, T4b, T5a). Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`.
PUNKTY WEJŚCIA W PINIE (orientacyjne — ZWERYFIKUJ przed każdym wektorem przez `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'A,Bp'`):
- `_rangedForwardStep` ~6776, `_bestForwardStep` ~6822, `_rangedAction` gałąź APPROACH (D2/D3/D4), `_siegeMachineRange` ~7530 (NIEPRZECZYTANE — przeczytaj w całości przed decyzją o zakresie).
WZÓR: moduł T5a — `rust-port/engine/src/domain/siege_tactics_kite.rs` oraz generator `rust-port/engine/tests/p6_k5doc_t5a_gen.mjs` (wykonuje tekst pina przez TypeScript i zapisuje wektory JSON). Helpery `manhattan`, `enemies_of`, `advance_dir`, `cell_key`, `BF_COLS`, `BF_ROWS` już istnieją w `siege_tactics_doctrine_target.rs`, `siege_tactics_doctrine_state.rs`, `siege_tactics_autobatch.rs`.

## DECYZJA (podjęta przez orkiestratora)
- Zakres T5b to WYŁĄCZNIE czyste funkcje (`_rangedForwardStep`, `_bestForwardStep` i predykat/krok APPROACH, jeśli jest czysty), BEZ wpięcia w `_rangedAction`, `ActivateOps` i `siege_tactics_activate.rs`. Wpięcie to T8 / #113.
- `_rangedBackStep` i `_bestBackStep` są POZA zakresem (należą do KITE, już w T5a).
- Jeśli `_siegeMachineRange` (7530) okaże się zależnością czystą i potrzebną do APPROACH — włącz ją do zakresu i opisz. Jeśli zależy od stanu gry niedostępnego w module — NIE PORTUJ, zapisz w raporcie jako NIE_ZMIERZONO z powodem.

## ZAKRES
1. `rust-port/engine/src/domain/siege_tactics_ranged_forward.rs` (NOWY): 1:1 z pinem `_rangedForwardStep` i `_bestForwardStep` (zwrot `Option<CellKey>`, kolejność DIRS4 z pina, odrzuty: plansza, zajętość, przejezdność, brak celu w zasięgu, warunek postępu; remis jak w pinie — zapisz który).
2. `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_ranged_forward;`.
3. Wektory: `rust-port/engine/tests/p6_k5doc_t5b_gen.mjs` (NOWY) wykonuje tekst pina i zapisuje `p6_k5doc_t5b_vectors/vectors.json`. Testy Rust `rust-port/engine/tests/p6_k5doc_t5b.rs` (NOWY) czytają wektory i porównują z wynikiem Rust bajt-w-bajt.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_ranged_forward.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_ranged_forward;`
- `rust-port/engine/tests/p6_k5doc_t5b*.rs` (NOWE), `rust-port/engine/tests/p6_k5doc_t5b_gen.mjs` (NOWY), `rust-port/engine/tests/p6_k5doc_t5b_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5B-MARSZ/**`

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_activate.rs`, `siege_tactics_loop.rs`, `siege_tactics_pathstep.rs`, `siege_tactics_kite.rs`, `siege_tactics_doctrine_*`, `ActivateOps`, `ProdBody`.
- Nie portuj `_rangedBackStep`, `_bestBackStep` (KITE, T5a) ani `_advanceStep`/`_doMove` (T4c).
- Nie zmieniaj `gra/`, `rust-port/view-model/**`, `rust-port/renderer/**`.

## WEKTORY / TESTY
- `best_forward_step`: brak wroga → `None`; granica planszy (`nc<0`, `nc>=BF_COLS`, `nr>=BF_ROWS`, `nr<0`) z przypadkiem, w którym jedyny kandydat wypada poza planszą; zajęty kafelek; brak postępu odrzuca; remis wg kolejności DIRS4.
- `rangedForwardStep`: każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) warunek postępu ostro → nieostro (tylko jeśli nierównoważny — udowodnij), (b) granica `nc>=BF_COLS` → `nc>BF_COLS`, (c) kolejność DIRS4 odwrócona.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB (nie uruchamiaj bramki na pół).
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5B-MARSZ/01-operator-r1.md`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
6. Każdy wektor ma wartość z pina policzoną przez generator (TypeScript), nie wpisaną ręcznie.

## DODATEK r2 (po BLOCK INFRA Operatora i FAIL Ewaluatora/FC rundy 1; BAZA NADPISANA)

- Runda 1: Operator `2701a2065` (kod + wektory), obrona `6a2ded8bb` (komentarze, blok MOC TESTU), Ewaluator `83e67bad6`, FC `412eefb81`. Zachowane refy: `refs/keep/R-RUSTPORT-P6-K5DOC-T5B-{OP_R1,OB_R1,EV_R1,FC_R1}`, gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-MARSZ` = `412eefb81`.
- Przyczyny FAIL r1: (1) BLOCK INFRA — dysk poniżej 8 GB, cargo nie uruchomione; (2) mutacje (a), (b), (d) wykonane tylko na transkrypcji JS, nie na module Rust; (3) lektura APPROACH i `_siegeMachineRange` zrobiona dopiero w obronie (wynik w `02a-obrona.md`: gałąź APPROACH = wołanie `_rangedForwardStep` w `_rangedAction` (pin 6738); `_rangedApproachStep` (7257) martwa dla strzelca; `_siegeMachineRange` (7530) czyta stan gry, wołana tylko z 6200 — NIE portowana).
- **NOWA BAZA (jedyna obowiązująca):** `6a2ded8bb`. Worktree detached. Nie resetuj do `625624d97` — kod r1 i komentarze obrony są w bazie.

### Zadanie rundy 2
1. **Bramki Rust EXIT 0** w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test p6_k5doc_t5b`, `cargo test --all-targets --no-fail-fast`. Zapisz kody wyjścia. **Przed KAŻDĄ bramką `df -h /`; przy < 8 GB nie uruchamiaj bramki — zgłoś BLOCK z liczbą GB** (nie czyść cudzych targetów; nie ruszaj `wf_6d014d2a-144-*`).
2. **Mutacje na module Rust** (nie na JS), każda `cargo test --test p6_k5doc_t5b` musi dać FAIL, potem przywrócenie i zielony wynik:
   - (a) warunek postępu `forwardGain` ostro → nieostro (`>` na `>=`, lub odpowiednik zgodny z pinem),
   - (b) `nc >= BF_COLS` → `nc > BF_COLS`,
   - (d) kolejność BFS odwrócona.
   - Mutanta (c) (odwrócone DIRS4) zostaw z dowodem równoważności z r1 — nie mierz go, opisz.
3. Lektura `_siegeMachineRange` (7530) i gałęzi APPROACH już jest w `02a-obrona.md` r1; przepisz zwięźle do raportu r2 (bez ponownej dyskusji).
4. Raport `01-operator-r2.md` w run dir, commit jawnym `git add` (bez `Cargo.lock`, bez `-A`, bez nazwy modelu w trailerach). **Bez push.**

### KRYTERIA KOŃCA (r2)
- Wszystkie 4 bramki EXIT 0 z kodami w raporcie, albo BLOCK z podaniem GB.
- Mutacje (a), (b), (d) FAIL na Rust z wynikami; (c) z dowodem.
- Zero zmian poza allowlistą z r1; brak `#[ignore]`.

## DODATEK r3 — RUNDA INTEGRACYJNA (po FC PASS-WITH-NOTES rundy 2; BAZA NADPISANA)

- Runda 2: Operator `85f0c997f` (PASS-WITH-NOTES), obrona `4f8c5cb8d`, Ewaluator PASS-WITH-NOTES, FC **`366e6ff8d`** PASS-WITH-NOTES (zabezpieczony: `refs/keep/R-RUSTPORT-P6-K5DOC-T5B-FC-r2`, gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-MARSZ-r2`).
- Parity `rust-port/parity-v2` przesunięte przez T6 na **`83777efa9`** (T6 zintegrowany, FF). **NOWA BAZA (jedyna obowiązująca): `83777efa9`.**
- Zadanie integracyjne (Operator, Haiku):
  1. `git merge-tree --write-tree 83777efa9 366e6ff8d` — musi być czysty (sprawdzone przez orkiestratora: exit 0).
  2. Merge w worktree: `git merge --no-ff 366e6ff8d` na bazie `83777efa9`. Konflikt tylko w `rust-port/engine/src/domain/mod.rs` (obie gałęzie dodają `pub mod`) — rozwiąż przez zachowanie obu linii w porządku alfabetycznym, zgodnie z `cargo fmt`.
  3. Diff merge względem `83777efa9`: tylko pliki T5b (allowlista) i raporty.
  4. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test p6_k5doc_t5b`, `cargo test --all-targets --no-fail-fast`. **Przed każdą bramką `df -h /`; przy < 8 GB BLOCK z liczbą GB.**
  5. Raport `03-integracja-r3.md`, commit merge jawnym `git add` (bez `-A`, `Cargo.lock`, nazwy modelu w trailerach). **Bez push, bez FF** — FF wykona orkiestrator po werdykcie FC.
- Ewaluator i FC: odtworzyć bramki sam, sprawdzić diff merge względem `83777efa9` (allowlista T5b, mod.rs bez utraconych linii T6).

## DODATEK r4 — BRAMKI RUNDY INTEGRACYJNEJ (po BLOCK INFRA Operatora r3, FAIL Ewaluatora/FC r3 — dysk 6,9 GB; BAZA NADPISANA)

- Runda r3: merge `c97cd4542` (`--no-ff` 366e6ff8d na 83777efa9, merge-tree czysty) i raport `7778e66af` są już zrobione. Zabezpieczone: `refs/keep/R-RUSTPORT-P6-K5DOC-T5B-INT-r3-merge`, `…-INT-r3-report`, gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-INT-r3` = `7778e66af`.
- Dysk ma teraz ok. 18 GB (zwolnione worktree zakończonych rund).
- **NOWA BAZA (jedyna obowiązująca): `7778e66af`.** Worktree detached. **Nie rób nowego merge, nie zmieniaj kodu.**
- Zadanie r4 (Operator, Haiku): (1) ancestry `83777efa9` i `366e6ff8d` w `7778e66af`; (2) diff `83777efa9..7778e66af` tylko allowlista T5b (mod.rs +1 linia) i raporty; (3) bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test p6_k5doc_t5b`, `cargo test --all-targets --no-fail-fast`. **Przed każdą bramką `df -h /`; przy < 8 GB BLOCK z liczbą GB.** (4) Raport `04-integracja-r4.md`, commit jawnym `git add`. Bez push, bez FF.
- Ewaluator i FC: odtworzyć bramki sam (EXIT 0), sprawdzić diff względem `83777efa9`. Mutacje a/b/d były w r2 na tym samym kodzie (`366e6ff8d` = kod T5b) — nie powtarzać.
