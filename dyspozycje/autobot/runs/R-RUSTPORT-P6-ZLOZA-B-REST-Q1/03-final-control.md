STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZA-B-REST-Q1
GOAL: port pozostałych gałęzi transferBasketItems (pin 07d2fbd72), wektory z pina dla każdej zrealizowanej gałęzi
ZMIANY/COMMIT: oceniany 5a6adf3fb (r2 Operator), potomek bazy 0ca58770e = TAK (merge-base --is-ancestor). Diff vs baza: diplomacy_basket.rs, tests/p6_zloza_basket.rs, runs/<ID>/02a-obrona.md. Allowlista: OK (gra/, Cargo.* nietknięte).
TESTY (samodzielnie): cargo fmt --check EXIT=0; cargo test --test p6_zloza_basket 12 passed/0 failed/0 ignored. Clippy i pełny test: NIE ZWERYFIKOWANE przez FC (werdykt FAIL z innej przyczyny); deklaracja Operatora 3308/0/1 niepotwierdzona.
BLOKADY: patrz niżej.
RUNDY: 2/5
NASTĘPNY KROK: r3 Operator (to samo ID), baza 5a6adf3fb.
DEPLOY/PUSH: NIE WYKONANO

## Rozstrzygnięcia
- NAPRAW (1): Kryterium końca 1 niespełnione. Dla zrealizowanych gałęzi tech, surowiec_boolean, surowiec_ilosc, praca brak wektorów z pina (generator p6_zloza_basket_gen.mjs i p6_zloza_basket_vectors/** są na allowliście, nie rozszerzone). Nowe testy to testy wrappera względem helperów Rust, nie parytet z pinem; Operator sam to przyznał (Z6 OTWARTE). Brak parytetu = brak dowodu zgodności z pinem. Zakres r3: rozszerzyć generator (wykonanie fragmentu pina z rejestrującym harnessem stanu, SHA fragmentu), wygenerować wektory i porównać w teście dla czterech gałęzi.
- NAPRAW (2): Niezmierzona równoważność normalizacji klucza (trim/lowercase vs normalized_key) w surowiec_ilosc i test na kroku 10 — wektor z pina dla surowiec_ilosc musi to pokryć.
- ODDAL: zloto, miasto (brak odpowiednika w Rust, NIE_ZMIERZONO uzasadnione, jawnie raportowane i testowane), jednostka (no-op jak na pinie), zywnosc (stan prywatny w city_growth.rs poza allowlistą; NIE_ZMIERZONO z powodem, w skipped_kinds).
- ODDAL: tech dla gracza 0 — efekty poza portem raportowane w unported_side_effects.
- Uwaga (bez wpływu na werdykt): praca — pin używa setOwnerPracaPool; clamp max(0) założony, wektor z pina w r3 to potwierdzi.
