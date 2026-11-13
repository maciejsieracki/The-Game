# 02a-obrona: R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1 (obrona Operatora, runda 2/5)

STATUS: OBRONA ZAKOŃCZONA (bez zmian w kodzie; 1 zarzut przyjęty jako potwierdzony dowodem, 4 odrzucone z dowodem)
DOMAIN: GAME (dane)
TEMAT: R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1 (L-1), obrona Operatora r2
GOAL: odpowiedź na zarzuty 02-evaluator.md (commit 6ddda6ade, ocena 6ea387a19) z dowodem.
BAZA: kod r2 = c16f90ca6 (hashy web-vectors), raport r2 = 6ea387a19 (czubek wip). Worktree wf_8202e9b6-65f-3 ustawiony `--detach 6ea387a19`; nic nie zmieniono w kodzie.
SCRATCH: wszystkie narzędzia pomocnicze poza repo (`/tmp/claude-0/.../scratchpad/r2/`). Cargo nie uruchamiano w tej obronie (bramki r2 potwierdza ewaluator).

## Odpowiedzi na zarzuty

### Zarzut 0 (odtworzone bramki fmt / clippy / pełny cargo test, 3264 passed, 0 failed, 1 ignored)
PRZYJMUJĘ jako potwierdzenie. Nie kwestionuję; tej obrony nie powtarzałem (poza zakresem r2 i z dowodami z rundy r2 w 01-operator-r2.md oraz 02-evaluator.md).

### Zarzut 1 (strażnik SHA-256 hashuje stałą EXPECTED z testu, nie wycięcie z orakulum)
ODRZUCAM (dowód: wyliczenie na orakulum pinu).
- Orakulum `gra/tools/unit-replace-promotion-table-test.cjs` z `07d2fbd72` ma `EXPECTED_TABLE` (23 wpisy, w kolejności pliku).
- Wyliczono w Node (sha_check.cjs, skrypt poza repo): SHA-256 kanonicznej postaci `nazwa=wartość\n` z tabeli orakulum = `82c013f55112c82c5d8fbd4a520271756c5cf10bf5039992170c5af8052d79b6`.
- Stała `EXPECTED_SHA256` w `rust-port/engine/tests/p6_repin_unit_replace_data.rs` = ta sama wartość (match: true).
- 23 pary `EXPECTED` w pliku .rs są identyczne co do wartości i kolejności z orakulum (identical in order: true).
- Uwaga, bez zmiany wniosku: test nie może czytać orakulum w runtime (plik żyje w historii gita pinu, nie w drzewie repo), więc strażnik z natury hashuje kopię wyciętej tabeli. Ta kopia jest bajt-w-bajt zgodna z pinem (powyżej).

### Zarzut 2 (nowe hashe web-vectors policzył skrypt, nie generator gen-p61d-web-vectors.mjs; "brak pliku w repo")
PRZYJMUJĘ jako poprawkę dowodową: generator JEST w repo, a hashe zweryfikowane generatorem.
- Plik: `dyspozycje/autobot/runs/R-RUSTPORT-P6-1D-CIV-BONUSY-NAZWY-Q1/gen-p61d-web-vectors.mjs` (obecny w drzewie `HEAD` = 6ea387a19). Ustalenie ewaluatora "brak pliku w repo" było błędne.
- Uruchomienie (w scratchpadzie, Node v22.23.4, `--experimental-strip-types`, loader `p61d-loader-register.mjs` z tego samego katalogu): kod weba z pinu `07d2fbd72` (`gra/src/game`, `gra/data`) + `gra/data/units.json` = plik Rust `rust-port/engine/data/units.json` z r2. Wynik: `OK units=174 reps=18 ctx=160 lists=262 apply=1026 mults=1026 discount=29 matrixBonusy=51 pick=50 realPick=160 stateAt=128 rivals=128 resolve=168 validate=11`.
- Porównanie strukturalne pełnego wyjścia generatora z `rust-port/engine/tests/p6_1d_vectors/web-vectors.json` (r2, commit c16f90ca6): 0 różnic w wektorach, w `dataFnv.units` i w `strip.dataStringXor`. Jedyna różnica to pole metadanych `/node`: `v22.23.4` (generator teraz) vs `v22.22.0` (zapisane). Pole metadanych nie jest polem hashu, więc NIE zmieniałem go (zakres r2: tylko hashe).
- Wniosek: hashe `5049afb95122976d` (units) i `b0dbfb9d862bf602` (dataStringXor) są wynikiem generatora, nie tylko skryptu Operatora. Stan web: NIE_ZMIERZONO już nie dotyczy hashów; pozostaje tylko ta sama uwaga o wersji Node w metadanych.

### Zarzut 3 (wariant zarzutu 2 w pkt. 3 listy: hashe bez generatora)
PRZYJMUJĘ, ale zamknięty przez dowód z pkt. 2 (ten sam zarzut).

### Zarzut 4 (brak testu negatywnego/mutacyjnego dla SHA i porównania tabeli)
ODRZUCAM w tej rundzie (zakres r2).
- Dispatch r2 wprost zakazuje zmian `p6_repin_unit_replace_data.rs` i wymaga allowlisty bez nowych plików testowych. Dodanie testu mutacyjnego naruszyłoby oba.
- Sama własność jest zapewniona przez SHA-256 (zmiana dowolnego znaku w tabeli zmienia skrót) i przez porównanie 23/23 z danymi; test mutacyjny to propozycja na osobny temat (niski priorytet, zgodnie z oceną ewaluatora).

### Zarzut 5 (wartości trafiają do produkcyjnego execute_unit_replace/unit_replace; zmiana dostępności zamienników; wiring L-3 osobny)
ODRZUCAM jako zarzut wobec tego tematu; PRZYJMUJĘ jako uwagę informacyjną do BLOKAD.
- Odczyt produkcyjny istnieje: `rust-port/engine/src/domain/production_units.rs:2700` (`current.zastap_specjalnie`, sekcja B). Pusta lub `—` wartość jest pomijana (`is_blank_replacement`). Po wpisaniu wartości z pinu dla 21 jednostek sekcja B zaczyna generować zamienniki. To jest zamierzony skutek L-1 (parytet z pinem), a nie błąd.
- Dispatch r1/r2 (sekcja NIE ROBIĆ) wyklucza wiring `execute_unit_replace` w turze (L-3) i zakazuje zmian w `src/**`. Zmiana dotyka tylko danych.
- Konsekwencja do decyzji właściciela: dostępność zamienników w grze zmienia się dla 21 jednostek przed domknięciem L-3. Testy `p6_repin_unit_replace_{data,execute,pure}` są zielone.

## Zmiany w tej rundzie
- Kod: brak (worktree na 6ea387a19, zero zmian w `units.json`, teście i `web-vectors.json`).
- Ten plik: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1/02a-obrona.md` (commit obrony, SHA w odpowiedzi orkiestratora).
- Pliki pomocnicze (`sha_check.cjs`, `cmp.py`, `out.json`, `pin-web.tar`) poza repo, w scratchpadzie.

## Stan końcowy
- SHA digest tabeli pinu: `82c013f55112c82c5d8fbd4a520271756c5cf10bf5039992170c5af8052d79b6` (zgodny z testem).
- Web-vectors: 0 różnic wektorów vs generator z pinu; hashe `dataFnv.units=5049afb95122976d`, `strip.dataStringXor=b0dbfb9d862bf602`.
- Otwarte jako osobne tematy (nie blokują r2): test mutacyjny strażnika SHA (zarzut 4); wiring L-3; metadane `node` w `web-vectors.json` (v22.22.0 vs v22.23.4) — nieistotne dla testów, do ewentualnej aktualizacji przy kolejnym przegenerowaniu.

BLOKADY: brak dla r2 (zarzuty odparte lub przyjęte z dowodem; żadnej zmiany kodu nie wymagała obrona).
RUNDY: 2/5 (obrona w ramach r2).
NASTĘPNY KROK: Evaluator r2 (ponowna weryfikacja z odniesieniem do tego pliku), potem Final Control r2.
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje; zakaz z dispatchu).
