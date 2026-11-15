# 02a — Obrona Operatora, R-RUSTPORT-P4-1B-Q1-ROADMASK (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-Q1-ROADMASK
GOAL: `compute_road_mask` + `ROAD_DIRS` w silniku, port 1:1 `road-network.ts:32-34`, `:75-86` (pin `07d2fbd72`), z wektorami pinu.
ZMIANY/COMMIT: gałąź `rust-port-wip/R-RUSTPORT-P4-1B-Q1-ROADMASK-obr-r1` na `fc26b270c` (Operator r1, baza `1b8b67173`); SHA w commicie tego pliku (patrz `git log`). Pliki: `rust-port/engine/tests/p4_1b_road_mask.rs`, `rust-port/engine/tests/p4_1b_road_mask_vectors/gen.mjs`, ten raport. `road_network.rs`, `mod.rs` i `vectors.json` bez zmian. Wszystko w allowliście, `Cargo.lock` nie został zacommitowany.
TESTY (`rust-port/engine`, CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach), każda komenda EXIT 0:
- `cargo fmt --check`
- `cargo clippy --all-targets -- -D warnings`
- `cargo test --test p4_1b_road_mask`: 8 przeszło, 0 nie przeszło, 0 pominiętych (wcześniej 7, doszedł test brzegu)
- `cargo test --lib`: 119 przeszło, 0 pominiętych
- `node .../gen.mjs --check` na Node v22.23.4: „vectors.json zgodny z pinem”, strażniki SHA bez zmian
- Mutacja danych (sprawdzenie nowego testu): w `maps[0].masks[0][0]` ustawiony bit 3 (sąsiad (-1,0) leży poza mapą). Wynik: 3 FAIL, w tym `map_edge_masks_have_out_of_map_bits_cleared`. Plik przywrócony, potem `--check` i test znowu zielone.
BLOKADY: brak.
RUNDY: 1/5 (obrona po Evaluatorze r1).
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO (brak push i integracji).

## Odpowiedzi na zarzuty

### Zarzut 0 (podsumowanie Evaluatora: wszystkie bramki EXIT 0, port 1:1, mutacja dała 3 FAIL)
Nie jest to zarzut, tylko stwierdzenie. Przyjmuję je bez zmian. Bramki powtórzone po poprawkach (wyniki wyżej).

### Zarzut 1: komentarz o „obciętych bitach” nie pasuje do asercji. PRZYJMUJĘ
- Poprawka: komentarz w `compute_road_mask_matches_pin_vectors` opisuje teraz to, co asercja faktycznie sprawdza (pełna gwiazda 0x3F w kombinacjach bez granic).
- Obcięcie na brzegu sprawdza nowy, osobny test `map_edge_masks_have_out_of_map_bits_cleared`. Dla każdego heksa map z pinu i każdego kierunku, w którym sąsiad leży poza mapą, test sprawdza, że bit maski z pinu jest wyzerowany. Sprawdza też, że takie kierunki występują w wektorach (`out_of_map_bits > 0`) i że istnieją heksy brzegowe z niezerową maską. Bez tego drugiego warunku obcięcie byłoby niewidoczne.
- Dowód: test przechodzi na wektorach pinu, a po ręcznym ustawieniu bitu kierunku poza mapą daje FAIL (patrz TESTY).

### Zarzut 2: reguła „sąsiad poza mapą = brak drogi” jest tylko w teście i gen.mjs, a nie w silniku. ODRZUCAM jako wadę Q1, przekazuję do Q3
- Dowód 1:1: w pinie `computeRoadMask` (`road-network.ts:75-86`) również NIE zna granic mapy. Pyta wyłącznie `hasRoadAt(q+dq, r+dr)`. Regułę ma predykat wołającego `hexHasRoadAt` w `main.ts:3144-3147` (brak heksa daje `false`). Port zachowuje ten podział: doc-komentarz `compute_road_mask` w `road_network.rs` mówi wprost, że sąsiada spoza mapy rozstrzyga predykat wołającego. Gdyby reguła siedziała w silnikowej funkcji, Q1 odszedłby od pinu i od zakresu dispatchu (kryterium 1: port 1:1 `:75-86`).
- Notatka przekazania do P4-1B-Q3: producent `HexDynDto` musi przekazać predykat „brak heksa w modelu mapy = `false`” i pokryć go testem brzegu na prawdziwym modelu mapy. Do tego czasu stan pozostaje NIE_ZMIERZONO, zgodnie ze zgłoszeniem Evaluatora.

### Zarzut 3: `mutation_swapped_directions_is_detected` sprawdza mutanta z testu, a nie kod produkcyjny. PRZYJMUJĘ (zmiana opisu, bez zmiany zakresu)
- Poprawka: nazwa zmieniona na `vectors_detect_swapped_direction_order_mutant`, a komentarz w teście i w nagłówku pliku mówi teraz wprost, że test dowodzi czułości WEKTORÓW, nie implementacji.
- Czułość implementacji potwierdzają ręczne mutacje `road_network.rs`: Operator r1 zrobił dwie (zamianę kierunków 0 i 1 → 4 FAIL, odwrócone bity → 3 FAIL), Evaluator r1 jedną (pominięcie kierunku 5 → 3 FAIL). Automatycznego mutowania kodu produkcyjnego z poziomu testu integracyjnego nie da się zrobić bez narzędzia mutacyjnego spoza allowlisty, więc zostaje to udokumentowane jako ograniczenie.

### Zarzut 4: brak minimalnej wersji Node w gen.mjs. PRZYJMUJĘ
- Poprawka: nagłówek podaje teraz wymaganie Node >= 22.18.0 (linia 22) albo >= 23.6.0. Od tych wersji import `.ts` działa bez flagi. Doszło też sprawdzenie w czasie uruchomienia: na starszym Node generator kończy się EXIT 2 z czytelnym komunikatem zamiast mylącego błędu importu.
- Dowód: na v22.23.4 `--check` zwraca EXIT 0 (wyżej). Gałęzi „za stary Node” nie uruchomiono, bo w środowisku nie ma starszego Node (NIE_ZMIERZONO).

### Zarzut 5: `road_hexes_to_refresh` nie jest przeniesione, a `compute_road_mask` nie ma wołającego produkcyjnego. ODRZUCAM jako wadę
- Dispatch (ZAKRES) mówi, że port `road_hexes_to_refresh` jest opcjonalny („jeśli potrzebne i bez rozszerzania zakresu”). Kryterium 4 wprost każe zapisać brak wołającego jako NIE_ZMIERZONO, „nie jako błąd”. Rozpoznanie §1.1 wskazuje, że producent DTO potrzebuje tylko maski. `roadHexesToRefresh` w pinie służy do odświeżania meshy renderera po zmianie drogi.
- Kontrakt pozostaje sprawdzany: test `refresh_vectors_agree_with_mask_bit_order` porównuje listę refresh z pinu z listą wyliczoną z maski Rust. Jeśli Q3 albo renderer będą potrzebować tej funkcji, port to kilka linii nad tymi samymi wektorami. Stan: NIE_ZMIERZONO, wołający pojawi się w P4-1B-Q3.
