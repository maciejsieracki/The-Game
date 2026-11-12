# OBRONA Operatora — R-RUSTPORT-P6-SIEGE-TAKTYKA-K5A-Q1 (runda 1, obrona)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5A-Q1
GOAL: model jednostki boju i predykaty alive/broken (K5a), odpowiedź na zarzuty Evaluatora 1–5.
ZMIANY/COMMIT: branch rust-port-wip/SIEGE-TAKTYKA-K5A-Q1-obrona-r1 (baza: da0ede257 = raport r1 na kodzie 3bd021db6; baza kodu 46c42deab). Commit obrony: ostatni commit na tym branchu (nie wypchnięty). Allowlista: siege_tactics_unit.rs (doc), p6_siege_tactics_siege_tactics_unit.rs (+1 test), p6_siege_tactics_siege_tactics_unit_gen.mjs (kodowanie -0), p6_siege_tactics_siege_tactics_unit_vectors/vectors.json (regeneracja). Cargo.lock nie commitowany.

## Odpowiedzi na zarzuty

1. -0 w wektorach — PRZYJMUJĘ (poprawka + dowód).
   Zarzut trafny: `JSON.stringify(-0)` daje `"0"`, więc r1 nie miał -0 w pliku, a raport twierdził inaczej.
   Poprawka: w generatorze `jsonReplacer` koduje `-0` jako napis `"-0"`. Wynik: `vectors.json` zawiera 22 wystąpienia `"-0"`.
   Rust `num()` parsuje napis przez `parse::<f64>()` do `-0.0`. Nowy test `wektory_zawieraja_minus_zero` sprawdza, że przypadek `morale = -0` jest w wektorach `rout` i że `is_sign_negative()`.
   Liczniki przypadków bez zmian: alive 600, out 400, sides 400, rout 900 (generator, SHA fragmentów efd9637c...).
   Predykaty wynikają z porównań `>`, więc -0 i +0 dają ten sam wynik; teraz jest to również udokumentowane i testowane.

2. `is_broken` = alias `routed` — ODRZUCAM usunięcie, PRZYJMUJĘ opis.
   GOAL dispatchu wprost wymaga predykatów „alive/broken”, więc funkcja zostaje. Doc modułu (siege_tactics_unit.rs) mówi już, że to alias bez odpowiednika w pinie i że zależności mają używać `is_out` / `alive_end`. Dowód: `grep -n isBroken` w pinie 07d2fbd72 = 0 trafień.

3. `hp`, `move_left`, `acted` nieczytane przez predykaty — PRZYJMUJĘ jako notę (doc), ODRZUCAM wymóg weryfikacji wektorem.
   Dowód: w pinie 07d2fbd72 czterech predykatów z zakresu nie czyta tych pól: `alive` (:5617), `aliveA/aliveD` (:10159-10160), `out` (:10263), `_checkRout` (:9783-9797). Nie ma więc czego weryfikować wektorem. Pola zostały w modelu, bo GOAL je wymienia. Dodano akapit w doc modułu. Ich semantyka trafi do klocków, które je czytają (K5c/K5e).

4. Wiersze K5.10 w P6-SIEGE-TAKTYKA.md — ODRZUCAM w tej rundzie (odroczone do integracji).
   Dowód: dokument istnieje tylko na `b2336c005` (K5.10 w linii 443), nie na bazie `46c42deab`. Dispatch podaje ten plik jako źródło i wskazuje odczyt przez `git show b2336c005:...`. Edycja na bazie utworzyłaby nowy plik, a nie wiersze klocka. Kryteria binarne dispatchu (1)–(3) nie obejmują dokumentu. Aktualizacja K5.10 należy do integracji K5a.

5. `terrain_defence_mult` z zewnątrz — ODRZUCAM (zakres).
   Dispatch nie zleca portu terenu. Pin wywołuje `terrainDefenseMultiplier(terr, cu.rola, this.terrainData)` w `_checkRout`, a `effective_flee_threshold` przyjmuje ten mnożnik jako parametr, zgodnie z zakresem. To jawny kontrakt. Dostarczenie mnożnika przez K5c jest wymogiem integracji, a nie defektem K5a. Wpis jest w doc modułu.

## Testy (po poprawkach, na da0ede257 + commit obrony)
- cargo fmt --check: PASS (exit 0)
- cargo clippy --all-targets -- -D warnings: PASS (exit 0)
- cargo test --lib: 53 passed
- p6_siege_tactics_siege_tactics_unit: 7 passed (6 z r1 + wektory_zawieraja_minus_zero)
- p6_siege_tactics_end 8, endcheck 9, breach 15, walk 7 passed (bez zmian)
- generator node: alive 600, out 400, sides 400, rout 900; fragment SHA-256 zgodny

## Uwagi
- Miejsce podstawienia (sekcja w doc modułu) nie zmienia się; K5a nie wpina do `_checkEnd`.
- Dysk: przed startem 7,4 GB wolnego (poniżej bramki 8 GB z dispatchu). Target cargo poza repo w scratchpad.

BLOKADY: pkt 4 (K5.10) odroczony do integracji. Bez push, bez integracji.
RUNDY: 1/5 (obrona r1); ostatni werdykt: PASS-WITH-NOTES
NASTĘPNY KROK: Evaluator r2 na branchu rust-port-wip/SIEGE-TAKTYKA-K5A-Q1-obrona-r1; FC po PASS.
DEPLOY/PUSH: NIE WYKONANO
