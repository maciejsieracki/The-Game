# 02a OBRONA OPERATORA — R-RUSTPORT-P6-DOC-TAKTYKA-WIERSZE-Q1 (runda 1/5, obrona Haiku 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-DOC-TAKTYKA-WIERSZE-Q1
GOAL: odpowiedź na 8 zarzutów Evaluatora (zapisane w `02-evaluator.md`, przekazane w dispatchu rundy obrony); poprawki tam, gdzie zarzut zasadny.
BAZA: 216afaeb1 (Operator r1, gałąź rust-port-wip/R-RUSTPORT-P6-DOC-TAKTYKA-WIERSZE-Q1). Zmieniono: `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` (§7 i §8), `dyspozycje/autobot/runs/R-RUSTPORT-P6-DOC-TAKTYKA-WIERSZE-Q1/01-operator-r1.md` (blokada 5), ten plik.
SHA POPRAWKI: commit zawierający ten plik (podany w odpowiedzi orkiestratora). Push nie wykonano.
Brak zmian w kodzie, `gra/`, `rust-port/engine/data/`, `WERSJE.md`, `Cargo.toml`, `Cargo.lock`. Bramki cargo: nie dotyczą (temat dokumentacyjny).

## Wynik zbiorczy

| # | Zarzut | Werdykt | Zmiana |
|---|---|---|---|
| 1 | Rozmiar vectors.json K5-LOOP (10,8 MB zamiast po obronie) | PRZYJMUJĘ | §8 p. 9; 01-operator blokada 5 |
| 2 | Stale „panika” BeginAutoBatchPhase (§8 p. 5) | PRZYJMUJĘ | §8 p. 5 |
| 3 | NFD-CCC: moduł „z raportu FC”; liczby z raportu operatora pominięte; „11/11” niejednoznaczne | PRZYJMUJĘ | §7, wiersz NFD-CCC |
| 4 | KLASY-WIRE: „podmienione flagi” przeszacowane | PRZYJMUJĘ | §7, wiersz KLASY-WIRE; §8 p. 13 |
| 5 | CRED: PORTED bez zastrzeżeń z FC | PRZYJMUJĘ | §7, wiersz CRED; §8 p. 14 |
| 6 | Luki z FC pominięte (K5I2b zarzut 6, typNazwa; K5I2b2 dług) | PRZYJMUJĘ | §8 p. 11–13; §7 wiersze K5I2b, K5I2b2 |
| 7 | §8 p. 7: brak osobnego testu i API wznowienia (dowód niejawny) | PRZYJMUJĘ | §8 p. 7 |
| 8 | Drobne: SHA obrony K5I2a3; „scalony” bez SHA merge'a | PRZYJMUJĘ | §7 wiersze K5I2a2–a4, K5I2b, CRED; uwagi do tabeli |

Żaden zarzut nie został odrzucony.

## 1. Rozmiar vectors.json K5-LOOP — PRZYJMUJĘ, NAPRAWIONE

Zmierzone na commicie `ec7a0ff78` (obrona r1): `git cat-file -s ec7a0ff78:rust-port/engine/tests/p6_siege_tactics_loop_vectors/vectors.json` = **7 144 050 B (7,1 MB)**. Przed regeneracją (`73ad43f25`): **10 824 361 B (10,8 MB)**. Obie wartości podano w §8 p. 9 P6-SIEGE-TAKTYKA.md. W 01-operator-r1.md blokada 5 zastąpiona wartością zmierzoną (ZMIERZONO, nie „nie mierzono”).

## 2. Stale „panika” BeginAutoBatchPhase — PRZYJMUJĘ, NAPRAWIONE

Zarzut zasadny: obrona r1 (`ec7a0ff78`) zamieniła `panic!` na `halt_unsupported`. Sprawdzone grepem w `ec7a0ff78:rust-port/engine/src/domain/siege_tactics_loop.rs`: `halt_unsupported` (linia ~210) jest wołane z `SeqEvent::BeginAutoBatchPhase` (linia ~232) i z `FfEvent::EnterAuto` (linia ~333); pole `pub unsupported: Option<&'static str>` (linia ~181). Brak `panic!` w kodzie (jedyne wystąpienie słowa „panika” to komentarz w nagłówku modułu). Ścieżka `halt_unsupported` nie ma testu: grep po `unsupported` w testach K5-LOOP nie zwraca nic. Zapisano jako dług w §8 p. 5.

## 3. NFD-CCC — PRZYJMUJĘ, NAPRAWIONE

a) Moduł: zarzut zasadny. FC (`e6a815d53`) nie podaje modułu. Moduł podaje raport operatora r1 (`08957bab1`): `normTerrain` w `rust-port/engine/src/domain/siege_tactics_inputs_terrain.rs`. Plik istnieje na bazie `82bb87fb1` (sprawdzone `git cat-file`). Wiersz §7 wskazuje moduł z raportu operatora i zaznacza, że FC go nie podaje.

b) Liczby z raportu operatora (zamiast NIE_ZMIERZONO): 2200 sekwencji znaków łączących (`norm_terrain_sekwencje_znakow_laczacych`) i 929 296 par niestartowych (`cccPairFnv`, hash FNV zgodny z Node). Liczba punktów kodowych nie jest w raportach: pozostaje NIE_ZMIERZONO.

c) „11/11” rozbite: integracyjny `p6_siege_tactics_inputs_terrain` = 9 z operatora r1 + 2 dodane w obronie (`generator_straznik_sha256`, `sha256_wektor_wzorcowy`) = 11/11; osobno 3 testy jednostkowe w module (tabela_ccc, kanoniczne_przestawianie_tybetanskie, kanoniczne_przestawianie_przez_granice_wejscia) w `--lib` 88/88.

## 4. KLASY-WIRE — PRZYJMUJĘ, NAPRAWIONE

Zarzut zasadny. Sprawdzone na bazie `82bb87fb1`: `git grep` po `siege_tactics_class_adapters` w `rust-port/engine/src` zwraca tylko `domain/mod.rs:107` (rejestracja) i sam plik. Brak wołającego z K1/K3/K5H. FC (`3d7ed90f7`) potwierdza: „brak wołającego” zostało oddalone jako zarzut FC tylko zgodnie z dispatchem; `is_catapult` to jawne wejście wołającego, bez klasyfikatora w wektorach KLASY.

Status zmieniony z „PORTED: flagi klas w K1/K3/K5H podmienione” na „PORTED w warstwie funkcji; BRAK wołającego w produkcji”. Podmiany flag w K1/K3/K5H nie wykonano; odnotowano w §8 p. 13 jako dług. Liczby: adaptery bez liczby przypadków (NIE_ZMIERZONO); klasyfikator pod spodem z tematu KLASY-Q1 (922 przypadki) podano jako osobną pozycję.

## 5. CRED — PRZYJMUJĘ, NAPRAWIONE

Zarzut zasadny. FC (`9d4a2c17b`) to PASS-WITH-NOTES, nie czysty PASS, a jego zależności (a)–(c) nie były w wierszu. Status zmieniony na „PORTED w warstwie funkcji z zależnościami”: (a) `note_war_entered` niewołany (hak wojny P4, poza allowlistą); (b) domyślne `difficulty=Normal` i puste `credibility_excluded_owners` (dług producenta); (c) alias `umowa_handlowa` pokryty wektorami funkcji, brak testu 3 tur warunkowego S3. Odnotowano w §8 p. 14. Liczby wektorów z raportu operatora r4: 250 przypadków czystych + 48 sekwencji / 616 kroków.

## 6. Luki z FC pominięte — PRZYJMUJĘ, NAPRAWIONE

- K5I2b, FC zarzut 6 (`f42dddfcd`): `unit_power::ranged_shot_accuracy` używa `f64::max`, a pin `Math.max`; plik poza allowlistą K5I2b; temat R-* do założenia. Dopisano §8 p. 11.
- K5I2b, `typNazwa` = `Undef`: wg FC nie występuje w danych pinu. Dopisano §8 p. 12.
- K5I2b2, FC zarzut 3 (`0c90e2bf1`): `combatTerrainName`, procarz, NaN/Inf — dług NIE_ZMIERZONO, nieblokujący. Dopisano §8 p. 13 i uwagę w wierszu §7.

## 7. §8 p. 7 (niezależność od podziału na kroki) — PRZYJMUJĘ, NAPRAWIONE

Zarzut zasadny. Obrona r1 pkt 6 mówi wprost: osobnego testu nie dodano, a obecne `run` nie ma API wznowienia, więc taki test wymagałby zmiany API. Dopisano w §8 p. 7: dowód niejawny 360/360, brak osobnego testu, brak API wznowienia, dług.

## 8. Drobne SHA i „scalony” — PRZYJMUJĘ, NAPRAWIONE

- K5I2a3: dopisano SHA obrony `996a996f9` (potwierdzone: commit „P6 K5i-2a3 (r1): obrona Operatora na zarzuty Evaluatora (02a-obrona.md)”).
- Statusy „scalony w B14B/B14C” sprawdzono przez `git merge-base --is-ancestor <SHA> 82bb87fb1`. Wszystkie wymienione SHA kodu i FC są przodkami bazy (K5I2a1–a4, K5I2b, K5I2b2, CRED). SHA merge'a potwierdzono tylko dla K5I2a1 (`e98b2e6c1`). Dla pozostałych wpisano „obecny na bazie `82bb87fb1`; SHA merge'a B14C NIE_ZMIERZONO”.

## Zweryfikowane OK (bez zmian)

- `git diff --check` = EXIT 0 po zmianach.
- Allowlista: tylko `P6-SIEGE-TAKTYKA.md` i katalog run dir (`01-operator-r1.md`, `02a-obrona.md`).
- Brak zmian w kodzie i w `gra/`.

## Dług i NIE_ZMIERZONO

- K5-LOOP: FC nie wykonany (`ec7a0ff78` bez `03-final-control.md`); status CZĘŚCIOWE.
- Pełny `cargo test` dla CRED: NIE_ZMIERZONO w tej rundzie (raport operatora podaje 410 binarek ok).
- Liczba punktów kodowych w NFD-CCC: NIE_ZMIERZONO.
- Liczby wektorów dla adapterów KLASY-WIRE: NIE_ZMIERZONO.

RUNDY: 1/5 (Operator obrona, Haiku 5.5)
NASTĘPNY KROK: Evaluator (Sonnet) sprawdza zmiany §7 i §8 względem tego pliku i względem raportów FC wymienionych w tabeli.
DEPLOY/PUSH: NIE WYKONANO
