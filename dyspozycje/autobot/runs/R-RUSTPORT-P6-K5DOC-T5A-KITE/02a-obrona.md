STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T5A-KITE (runda 3, DODATEK r3)
GOAL: odpowiedź na zarzuty Ewaluatora rundy 3 (02-operator-r3.md, commit 048f7eede) bez przepisywania kodu.
BAZA: 048f7eede (detached; kod Operatora r3). Pin 07d2fbd72 (tylko odczyt).

ZARZUTY I ODPOWIEDZI

1. Trailing whitespace w 02-operator-r3.md linia 6 — PRZYJMUJĘ (poprawka).
   Dowód przed: `git diff --check 761768677..048f7eede` → "02-operator-r3.md:6: trailing whitespace", exit 2.
   Poprawka: usunięto końcowe spacje w pliku raportu (1 linia zmieniona, nic więcej).
   Dowód po: `git diff --check` (na zmianie) → OK, exit 0.

2. Duplikaty helperów (DIRS4, manhattan, advance_dir, in_bounds, enemies_of) — ODRZUCAM w tym temacie (poza allowlistą), notatka do osobnego tematu konsolidacji.
   Dowód: `grep` pokazuje te same nazwy w siege_tactics_pathstep.rs:32/35/40, siege_tactics_doctrine_state.rs:87,
   siege_tactics_doctrine_target.rs:165/171, siege_tactics_approach.rs:214, siege_tactics_tower.rs:40, siege_tactics_walk.rs:39.
   Sygnatury są różne: kite używa f64 i Tile, doctrine_state zwraca i64, doctrine_target operuje na &Combatant.
   Zmiana wymagałaby dotknięcia plików spoza allowlisty. Zalecenie: osobny temat konsolidacji helperów siege_tactics.

3. Brak ponownego pełnego `cargo test --all-targets` (3792 testy) — PRZYJMUJĘ jako lukę w dowodzie tej obrony.
   NIE_ZMIERZONO przeze mnie: `df -h /` pokazuje 2.2 GB wolne (dispatch wymaga ≥ 8 GB przed bramkami), więc nie
   kompiluję crate'a (BLOCK wg dispatchu). Zmierzone teraz: `cargo fmt --check` w rust-port/engine → EXIT 0.
   Wynik 3792 passed z raportu Operatora nie jest przeze mnie potwierdzony. Zalecenie: FC lub orkiestrator
   powtarza pełne bramki na 048f7eede po zwolnieniu dysku.

4. Mutanty G–Q i równoważność K2 / L2 — PRZYJMUJĘ wyjaśnienie, bez zmiany kodu, mutacji nie powtarzam (wymagałyby kompilacji).
   Dowód pośredni: nazwane testy granic istnieją w rust-port/engine/tests/p6_k5doc_t5a.rs
   (best_granica_planszy_odrzuca_nc_ujemne, best_granica_nc_ujemne_w_jedyny_odrzucony,
   best_granica_nc_ge_bf_cols_odrzuca_e, best_granica_nr_ge_bf_rows_odrzuca_s, best_granica_nr_ujemne_odrzuca_n).
   Równoważność K2 (`gap < dNow` zamiast `<=`): krok o jeden kafelek zmienia manhattan dokładnie o 1, a gap i dNow
   mierzą odległość do tego samego zagrożenia, więc gap ∈ {dNow−1, dNow+1} i równości nigdy nie ma. Rozumowanie
   jest poprawne, więc przyjmuję K2 jako równoważny. L2 (`dd >= 0`): dd = 0 implikuje dMinAny ≤ 1, co już odrzuca
   `dMinAny <= 1`. Przyjmuję.
   Mutant (a) z decyzji r2 (`gap < dNow − 1`) to nierównoważny mutant wg raportu Operatora. Tego nie weryfikuję.

5. Zgodność z pinem (wektory, 1:1 z battleScene.ts) — PRZYJMUJĘ jako zweryfikowane.
   Dowód: regeneracja `node rust-port/engine/tests/p6_k5doc_t5a_gen.mjs` na 048f7eede daje
   "OK: 722 przypadków (best_kite=413, nearest_melee=154, kite_gate=155)", a `git status`/`git diff --stat`
   po regeneracji są puste, czyli vectors.json jest bajt-w-bajt identyczny z commitem. Strażniki wycinków
   (head/tail) przechodzą. Wektory graniczne są wyznaczane przez wykonanie tekstu pina (TypeScript), nie ręcznie.
   Kod Rust: in_bounds = `(0.0..BF_COLS).contains(&col) && (0.0..BF_ROWS).contains(&row)` zgodnie z 6971 i 661–662;
   DIRS4 kolejność N,E,S,W; gapScore = gap*100 + (movedBackAxis ? 50 : 0); lateral ostro `<`; MELEE_SAFE_GAP = 2.0.
   Zakres i allowlista: w commicie 048f7eede są tylko pliki allowlisty (4 pliki) i raport; kod gra/ nietknięty.

ZMIANY W TEJ OBRONIE
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5A-KITE/02-operator-r3.md: usunięte trailing spaces (zarzut 1).
- dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5A-KITE/02a-obrona.md: ten raport (nowy).
- Kod, testy, wektory: bez zmian.

BRAMKI W TEJ OBRONIE
- `git diff --check` (po poprawce): EXIT 0.
- `cargo fmt --check` (rust-port/engine): EXIT 0.
- `cargo clippy`, `cargo test --all-targets`: NIE_ZMIERZONO przeze mnie (df 2.2 GB < 8 GB).
- Regeneracja wektorów: OK, 722 przypadki, bez dryfu.

NOTATKI DLA ORKIESTRATORA
- Trailer: dispatch wymaga braku nazwy modelu w trailerach; commit zrobiony bez Co-Authored-By z nazwą modelu.
  Systemowa wskazówka o atrybucji zalecała inną stopkę; wybrano zgodność z dispatchem i decyzją projektu (#289). Do potwierdzenia.
- Dług: duplikaty helperów (zarzut 2) i pełne bramki na 048f7eede (zarzut 3) do osobnych tematów.

COMMIT: podano w odpowiedzi orkiestratorowi (SHA z `git rev-parse --short HEAD` po commicie).
PUSH: NIE WYKONANO (zgodnie z dispatchem, bez push do parity).
NASTĘPNY KROK: FC r3 na nowym SHA; pełne bramki po zwolnieniu dysku ≥ 8 GB.
