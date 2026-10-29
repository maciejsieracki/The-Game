STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-LOGIKA-CIV-Q1
GOAL: Port logiki civ z web 91dc998a do Rust; 12 czerwonych (p6_1d/p6_1e) zielonych oraz 6 czerwonych p6_4 zielonych; bramka 1227 passed / 0 failed.
ZMIANY-COMMIT: baza 9b4e9f04 (detached, zgodnie z RUNDA 3). Zmienione wylacznie wektory: `rust-port/engine/tests/p6_4_vectors/{core,embark,march}.json` (regeneracja z web 91dc998a). Rally/scout/maps bez zmian (bajt w bajt). Zero zmian w `src/`, testach, `gra/**`, `Cargo.toml`, `WERSJE.md`. Commit wektorow: `620d4282`. Dokument i logi: commit raportu (kolejny SHA w odpowiedzi Operatora). PUSH NIE.
  Metoda: `git archive 91dc998a gra/src gra/data` do katalogu w scratchpadzie (poza repo); generator `gen-p64-vectors.mjs` z runu R-RUSTPORT-P6-4-JEDNOSTKI-RUCH-Q1 uruchomiony bez zmian (`node --experimental-transform-types --import ./p64-loader-register.mjs`), wyjscie porownane z wersjami w repo; zmienione tylko 3 pliki (core/embark/march).
  Uwaga: pole `meta.pin` w JSON-ach pozostaje `edb8fb56` (stala w generatorze); dane pochodza z 91dc998a. Zmiana etykiety wymagalaby edycji generatora poza allowlista.
TESTY:
- `cargo test --all-targets --no-fail-fast` (rust-port/engine, bez --locked): 1227 passed / 0 failed (log: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-LOGIKA-CIV-Q1/gate-test-r3.log`, 163 wynikow `test result`; linia EXIT nie trafila do logu, kod wyjscia 0 z wywolania).
- `cargo fmt --all -- --check`: EXIT=0 (`gate-fmt-r3.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r3.log`).
- `git diff --check`: czysty.
- Niezalezny weryfikator `verify-p64-vectors.py` (kopia w scratchpadzie z poprawka modelu filtra 91dc998a): NIE ZAKONCZONO DOWODU. Wersja z repo daje 47 rozbieznosci (`dowody/verify-p64-r3-stale-python-model.log`). Przyczyna: weryfikator modeluje logike edb8fb56 i nie zna `isKnownMatrixCombatEntry` (web civ-bonuses.ts:277-282, tabela MATRIX_COMBAT_ENTRY_SPECS :233-274), ktory odrzuca wpisy o zlym typie/celu (np. walka_ruch_bitwa_proc z celem `wszystko`). Probe poprawki (filtr specyfikacji dodany w kopii) zostala przerwana (proces zabity po ~10 min, bez wyniku). Stad: 0 rozbieznosci NIE_ZMIERZONO.
- Mutacje (>=20): NIE WYKONANO w tej rundzie. Runda nie dodaje galezi logiki w `src/`; wektory regenerowane z weba (dowod zrodla: Node uruchamia realny kod TS 91dc998a).

ZALOZENIA (luki rozstrzygniete zalozeniem):
1. Zakres allowlisty p6_4 (decyzja orkiestratora): regeneracja tylko trzech plikow wektorow, bez zmian asercji.
2. Wektory z Node sa wzorcem prawdy dla 91dc998a; rozbieznosc weryfikatora Python przypisana jego nieaktualnemu modelowi (zob. wyzej). Jesli Evaluator uzna to za luke, wymagana jest aktualizacja weryfikatora (poza tym runem).
3. `meta.pin` = etykieta generatora, nie wplywa na testy.

BLOKADY: brak twardych. Otwarte: dowod niezaleznego weryfikatora dla 91dc998a (zob. TESTY).

RUNDY: 3/5 (r1 BLOCK, r2 FAIL, r3 PASS-WITH-NOTES).

NASTEPNY KROK: Evaluator (Sonnet) + Final Control: sprawdzic 3 pliki wektorow vs web 91dc998a (generator w runie P6-4), ocenic brak dowodu weryfikatora; po PASS-ach orkiestrator integruje repin-wip.

DEPLOY/PUSH: NIE WYKONANO
