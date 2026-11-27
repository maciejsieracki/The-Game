STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1
GOAL: tryb reczny gracza w ciele bitwy (czesc A): stan, wykonanie rozkazow, kolejka; dowod = wektory kroku z wykonania tekstu pinu 07d2fbd72
ZMIANY/COMMIT: oceniony kod 5583106a3 (kod produkcyjny = 72aa1f21d + testy obrony r1; baza 617185ba8 jest przodkiem). Allowlista OK: siege_prod_manual.rs, mod.rs, siege_tactics_loop.rs, tests/p4_417a_manual_mode_state.rs, raporty. Brak zmian w gra/, generatorze .mjs i istniejacych wektorach (git diff pusty). Brak nowych #[ignore]. git diff --check czysty.
TESTY: odtworzone samodzielnie przez FC: cargo fmt --check EXIT 0; test p4_417a_manual_mode_state 41/41. Clippy i pelny cargo test NIE ponawiane przez FC (kod produkcyjny identyczny z ocenionym przez Evaluatora: clippy 0, pelny 4420 passed/0 failed; obrona zmienila tylko plik testowy) - NIE_ZMIERZONO przez FC.
BLOKADY: kryteria 2, 3, 4 dispatchu niespelnione (brak wektorow kroku z wykonania pinu dla ciala)
RUNDY: FC po rundzie 1/5
NASTEPNY KROK: runda 2 Operatora (DODATEK r2, baza 5583106a3)
DEPLOY/PUSH: NIE WYKONANO

## Zarzuty i rozstrzygniecia
1. Brak wektorow KROKU z wykonania pinu dla ciala (kryteria 2, 3, 4; D-417A-3; zarzut Evaluatora 1, przyjety przez Obrone bez poprawki): NAPRAW. To rdzen dowodu; 41 testow recznych z oczekiwaniami z tekstu pinu nie zastepuje wykonania pinu. Brak porownania fx _siegeSafeApproach z pinem, brak kolejki execute_units_immediate na wektorach, brak podprzyczyn removed i wektorowych progow pokrycia.
2. Mutanty (kryterium 5): ODDAL. 22 Operatora + 12 Evaluatora (4 przezyly) -> M4/M8/M11/M12 zabite przez Obrone, +M13-M16 zabite; kryterium spelnione.
3. Luki ram_tower_step/tower_climb/infantry_to_tower na poziomie ciala: NAPRAW (wejdzie do r2 razem z wektorami oblezenia; Obrona zadeklarowala NIE_ZMIERZONO).
4. Blokada generala (D-417A-7) bez testu: ODDAL (nieosiagalne z ciala, decyzja techniczna w dispatchu; czesc B).
5. SiegeLoop E2E z trybem recznym: ODDAL (czesc B #422 pkt 7).
6. Marsz krokowy i strona obroncy: ODDAL (pokryte testami obrony).

## Decyzje czlowieka
Brak - wszystko techniczne, rozstrzyga orkiestrator.

## Zakres rundy 2 (zgodnie z propozycja Obrony)
Nowy tryb generatora za flaga srodowiska (straznik SHA-256 3eeeb760... bez zmian) wykonujacy _activateUnit/_performPlayerOrder i _executeUnitsImmediate pinu; konsument Rust budujacy ProdBody z migawki; rodzaje hold/none/move/attack/attackMove/oblezenie reczne (sceny z murem, fx _siegeSafeApproach); podprzyczyny dead/fadingOut/routed/removed/cel=pozycja; ciala dla ram_tower/climb/infantry_to_tower. Mozliwy podzial r2/r3 (hold/none/move/attack/attackMove vs oblezenie+kolejka).
