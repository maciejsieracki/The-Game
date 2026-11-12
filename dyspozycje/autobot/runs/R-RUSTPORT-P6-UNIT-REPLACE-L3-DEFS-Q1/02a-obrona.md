STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L3-DEFS-Q1
GOAL: obrona Operatora r1 wobec zarzutow Evaluatora (02-evaluator.md); odpowiedz na kazdy zarzut: PRZYJMUJE albo ODRZUCAM z dowodem.
ZMIANY/COMMIT: baza kodu 121306fe2 (Operator r1, gałąź lokalna rust-port-wip/UNIT-REPLACE-L3-DEFS-Q1); commit obrony: SHA w sekcji DEPLOY/PUSH ponizej. Zmiana: rust-port/engine/src/domain/unit_replace_defs.rs (tylko komentarz naglowka, zarzut 5) oraz ten plik. Allowlista zachowana. Brak zmian w gra/**, rust-port/engine/data/**, Cargo.toml, Cargo.lock.
TESTY: (a) regeneracja wektorow: node gen-category-vectors.mjs na tekscie pinu 07d2fbd72 (gra/src/units/setup.ts, gra/data/units.json) i rust-port/engine/data/units.json -> 4 pliki (category-vectors-pin, -rust, -edge, category-discrepancies) BYTE-IDENTYCZNE z zacommitowanymi (cmp, 4/4). (b) cargo test --test p6_unit_replace_defs (7 passed), --test p6_unit_replace_l3 (8 passed), --test p6_unit_replace_l3_state (11 passed), EXIT 0, z CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 i CARGO_TARGET_DIR poza repo. Pozostale bramki nie powtarzane w tej rundzie obrony (dowod Operatora r1: fmt, clippy -D warnings, cargo test --lib 58, p6_repin_unit_replace_pure 7, p6_repin_unit_replace_execute 1, p6_wire_war_pipeline 7); po zmianie wylacznie komentarza naglowka ponowne uruchomienie fmt jest wymagane przez FC. Pelny cargo test: NIE_ZMIERZONO.
BLOKADY: (A) luka parytetu kosztu Pieniadz (web replaceUnitMoneyCost vs tabela produkcyjna) - osobny temat; (B) max_hp bez bonusow parametry/weteran - osobny temat; (C) decyzja gameplay o rozbieznosciach danych Epoka/pol units.json (ZAKAZ zmian danych w tym temacie).
RUNDY: 1/5 (obrona)
NASTEPNY KROK: Evaluator r2 albo Final Control na 121306fe2 + commit obrony; integracja i push wylacznie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji).

## Odpowiedzi na zarzuty

### Zarzut 1 (koszt Pieniadza w tabeli produkcyjnej bazowy) - ODRZUCAM jako zakres tego tematu, PRZYJMUJE jako blokade A
- Dowod: GOAL dispatchu (pkt 1-4) nie obejmuje kosztu zamiany z mnoznikami civ/tempo/trudnosc; kryteria binarne (1)-(5) tez tego nie zawieraja.
- Ograniczenie jest jawnie opisane w naglowku `unit_replace_defs.rs` (sekcja "Znane ograniczenie") i zapisane jako blokada A w raporcie. Nie zmieniam logiki kosztu w tym temacie, bo wymagaloby to nowego portu `unitProductionItem` poza allowlista.
- Konieczny osobny temat parytetu (ID do zalozenia przez orkiestratora).

### Zarzut 2 (max_hp = bazowe Health, bez bonusow parametry/weteran) - ODRZUCAM jako zakres, PRZYJMUJE jako blokade B i luke pokrycia
- Dowod: dispatch nie wymaga portu `newMaxHp`; kryteria (1)-(5) dotycza kategorii, tabeli defs i testu e2e na PlayableState.
- Test `tabela_produkcyjna_ma_kategorie_z_wektorow_rust` sprawdza `max_hp > 0`, nie wartosc HP. Luka pokrycia HP i kategorii po zamianie w testach e2e jest znana; nie wprowadzam jej do tego tematu.

### Zarzut 3 (rozbieznosc Epoka pin vs Rust wplywa na skale kosztu surowcowego) - PRZYJMUJE jako dopisek do raportu (bez zmiany danych)
- Dowod: `production_replace_defs` czyta `Epoka` i `Surowiec (ilosc)` z `rust-port/engine/data/units.json` (kod: `unit_replace_defs.rs`, sekcja naglowka). Rozbieznosci danych nie rozstrzygam (dispatch: ZAKAZ zmian `rust-port/engine/data/**`, decyzja gameplay, zadanie 27 w PYTANIA/TASKS).
- Wplyw na koszt surowcowy zamiany jest realny i zostaje jako decyzja wlasciciela. Liczby 51/75 jednostek i 71 pol: NIE_ZMIERZONO ponownie w tej rundzie (poza regeneracja wektorow kategorii, ktora jest identyczna).

### Zarzut 4 (test kategoria_dane_rust_zgodne_z_pinem tautologiczny) - ODRZUCAM (dowod)
- Oczekiwane wartosci w `category-vectors-rust.json` NIE pochodza z portu Rust, tylko z wykonania tekstu pinu `categoryOf` w node (stripTypeScriptTypes na `gra/src/units/setup.ts` z 07d2fbd72) na wejsciach z `rust-port/engine/data/units.json`. Test porownuje wynik portu Rust z wynikiem node na tych samych wejsciach, wiec nie jest tautologia Rust-Rust.
- Zgodnosc wejsc pin vs Rust (Jednostka, Rola, Super, Typ) jest sprawdzona generatorem (category-discrepancies.json: brak pozycji kategoria-rozna). Regeneracja potwierdza identycznosc plikow (patrz TESTY a).
- Evaluator sam uznal to za akceptowalne.

### Zarzut 5 (naglowek cytuje linie 239-311, categoryOf od ok. 246) - PRZYJMUJE (kosmetyka)
- Dowod: `git show 07d2fbd72:gra/src/units/setup.ts`: linia 239 = `function normalizeForMatch`, linia 246 = `export function categoryOf`, linia 311 = zamykajaca `}` categoryOf. Zakres 239-311 jest poprawny, bo obejmuje obie funkcje; naglowek nie byl bledny, ale byl niejasny.
- Poprawka: naglowek `unit_replace_defs.rs` rozdzielony na "normalizeForMatch od linii 239, categoryOf linie 246-311". Commit obrony zawiera te zmiane.
