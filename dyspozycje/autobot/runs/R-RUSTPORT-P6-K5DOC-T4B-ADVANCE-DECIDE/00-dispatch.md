# DISPATCH R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE (runda 1) — decyzja _advanceStep (#313, podział T4b z #258)

DOMENA: logika bitwy oblężniczej, port pieszy (engine). MODEL: Operator HAIKU 5.5; Evaluator i FC SONNET 5.5.
BAZA (jedyna obowiązująca): `68b2a6633` (T4a zintegrowane, FC PASS-WITH-NOTES; zawiera `siege_tactics_pathstep.rs`). Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`. Lokalizacje: `git grep -n "_advanceStep\|_compactAttackAllowsStep\|_firstStepAlongPathToAttack" 07d2fbd72 -- gra/src/battle` (`_advanceStep` 8198–8290). Nie zgaduj ścieżek.
ROZPOZNANIE: `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p6/K5DOC-T4-RUCH-PIESZY-ROZPOZNANIE.md` — §3.1 (kolejność decyzji kroki 1–10), wiersz T4b (ok. linia 123), korekty ewaluatora T4a w dispatchu `R-RUSTPORT-P6-K5DOC-T4A-HELPERY-SCIEZKI`.

## ZAKRES
1. Czysta funkcja `advance_step_decide` w NOWYM module `rust-port/engine/src/domain/siege_tactics_advance.rs` zwracająca `Done` / `Attack` / `Move{col,row,then}` — 1:1 z kolejnością decyzji pinu `_advanceStep` (8198–8290), analogicznie do `walk_decide`. Bez C-FLANK. Korzysta z `first_step_along_path_to_attack` (T4a) i `compact_attack_allows_step` (T2, #267).
2. Brak efektów ubocznych: `_doMove`, `_schedule`, `lastAutoMoveFrom` NIE są portowane tutaj (to T4c/T4e). Callback `_doMove` modelowany jako wejście/wynik funkcji.

## NIE ROBIĆ
- NIE zmieniaj `rust-port/engine/src/domain/siege_tactics_loop.rs` ani `ProdBody` (wpięcie to T4e, #315; konflikt z ruchem #123).
- NIE zmieniaj `siege_tactics_pathstep.rs` (T4a zamknięte) ani `siege_tactics_walk.rs`, `siege_tactics_tower.rs`.
- NIE porting `_doMove`, `_moveCostForUnit`, `occByKey` (T4c, #314).
- NIE zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_advance.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_advance;`
- `rust-port/engine/tests/p6_k5doc_t4b*.rs` (NOWE), `rust-port/engine/tests/p6_k5doc_t4b_gen.mjs` (NOWY), `rust-port/engine/tests/p6_k5doc_t4b_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE/**`

## WEKTORY / TESTY
- Generator `p6_k5doc_t4b_gen.mjs` wykonuje tekst pinu `_advanceStep` z podstawionym `_doMove`/`_schedule` (przechwycenie wywołań) i zapisuje wektory JSON; testy Rust czytają wektory.
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Wektory: brak celu i brak ścieżki → Done; cel w zasięgu → Attack; krok z `moveLeft > 0` → Move z `then`; krok zachłanny (bramka 8270); zapis `lastAutoMoveFrom` jako wynik.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) kolejność kroków 1–10 zamieniona; (b) bramka 8270 pominięta; (c) `Attack` zwracane zamiast `Move` gdy cel poza zasięgiem.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB, nie pomijaj bramki.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE/`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.

## DODATEK r2 (po FAIL rundy 1; BAZA NADPISANA)

- Runda 1 (Operator BLOCK, Ewaluator FAIL, FC FAIL) zakończyła się bez commitu i bez raportu. Logika portu była zielona: fmt, clippy, `p6_k5doc_t4b` 8/8 (520 wektorów), pełny `cargo test --all-targets` EXIT 0, mutacje (a)(b)(c) FAIL.
- NOWA BAZA (jedyna obowiązująca): WIP rundy 1 = `57907d39e` (na `68b2a6633`; gałąź `rust-port-wip/R-RUSTPORT-P6-K5DOC-T4B-ADVANCE-DECIDE-r1`). Worktree detached na `57907d39e`. Kod portu (`siege_tactics_advance.rs`, `mod.rs`, testy) ZOSTAJE — nie przepisuj logiki.
- Zadanie rundy 2 — WYŁĄCZNIE to, co wskazał FC:
  1. Numery linii pinu w komentarzach `siege_tactics_advance.rs`, `p6_k5doc_t4b.rs` i polach `pin` generatora `p6_k5doc_t4b_gen.mjs` przepisz na faktyczne z `git show 07d2fbd72:gra/src/battle/battleScene.ts`. Błędne były m.in.: `:8201-8227`, `:8229-8236`, `:8238-8239`, `:8241-8247`, `:8245-8247`, `:8248-8250`, `:8251`, `:8252-8253`. Poprawne zakresy: prelude 8199-8202; C-FLANK 8204-8235; atak z pozycji 8241-8246; nearestEnemy 8248-8249; avoidAutoBacktrack i BFS+stepToward 8256-8260; brak kroku 8261-8265; bramka 8270; previousPosition 8272; callback 8273-8284; cała funkcja 8198-8285. Zweryfikuj każdą liczbę sam.
  2. Przegeneruj `vectors.json` generatorem; ma być identyczny z obecnym poza polem `pin`.
  3. Zaktualizuj kotwice w `mutacje.py` (`// Web :8229-8236`, `// Web :8238-8239`, `// Web :8252-8253` itd.) i uruchom mutacje ponownie: (a) (b) (c) muszą dać FAIL.
  4. Bramki na tym samym drzewie: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` — wszystkie EXIT 0, pełny test, nie tylko `p6_k5doc_t4b`.
  5. Zapisz `raport.txt` w run dir (STATUS, DOMAIN, TEMAT, GOAL, ZMIANY/COMMIT, TESTY, BLOKADY, RUNDY, NASTĘPNY KROK, DEPLOY/PUSH).
  6. Commit jawnym `git add` tylko zmienionych plików (bez `Cargo.lock`, bez `-A`), BEZ nazwy modelu w treści i trailerach.
- Zakres allowlisty bez zmian. Nie zmieniaj `siege_tactics_loop.rs`, `ProdBody`, `gra/`.
- Dysk: przed bramkami `df -h /`; < 8 GB = BLOCK z liczbą GB.
