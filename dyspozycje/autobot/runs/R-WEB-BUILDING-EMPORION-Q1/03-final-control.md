STATUS: FAIL
DOMAIN: GAME (WEB)
TEMAT: R-WEB-BUILDING-EMPORION-Q1
GOAL: Budynek Emporion (epoka 2, Handel, wymaga Targowiska, +1 slot tras, kwalifikacja do 5% per trasa, koszt 50).
ZMIANY/COMMIT: oceniony 69344b7a2 (R2 Operatora; baza c80f39cf0 = R1; baza gałęzi b9d8fa546 = origin/main). Pliki = allowlista + wiki/encyklopedia/ikona znalezione w pomiarze; zero gra-robocza, WERSJE.md, rust-port, src-tauri. `git diff --check` czysty.
TESTY (własne, na 69344b7a2, gra/): npm ci --ignore-scripts EXIT=0; tsc --noEmit EXIT=0; emporion-building 47/0; trade-routes-contact-only 36/0; trade-treaty-free-break-after-10 35/0; grupy-budynkow 84/0; civpedia-budynki-historia 146/0; trade-routes-limit 76/0. Reszta regresji z raportu Operatora (trade-*, production-*, building-resource-*, city-panel*) nie odtwarzana przeze mnie w R2 - przyjeta z raportu.
WERDYKTY ZARZUTOW:
1. Dowod Chromium (lista budowy + chip "Wymagane badania: Handel / W miescie: Targowisko") - NAPRAW. Kryterium binarne dispatchu i R-PROC sekcja 9; Operator sam zapisal NIE_ZMIERZONO. Wzorzec: tools/empire-trade-route-split-real-render-test.cjs (bundel esbuild + Chromium, zero dev servera). Chip generowany w cityPanel.ts ~6966 ("W miescie: ...") - wymaga pomiaru dla emporion.
2. Tekst o kumulacji - ODDAL (top3[1] i uwagi zgodne z implementacja, per trasa). Drobna nescislosc - NAPRAW (mala): top3[0] mowi "rosnie o 4 monety z kazdym kolejnym poziomem", a maksPoziom=1; poprawic zdanie (i ewentualnie wikiBundle/emporion.md, jesli je cytuja).
3. Test odstepstwa +5% - ODDAL: sekcja G (refreshTradeRoutes: Targowisko+Emporion = 3 trasy, 2 z budynekOdblokowany) pokrywa kryterium. Wariant A (per trasa, bez drugiego niezaleznego 5%) - DO DECYZJI CZLOWIEKA (ABC przez orkiestratora; niezalezne od FAIL).
4. Test przez availableProduction - ODDAL: sekcja H pokrywa bramke (5 przypadkow). Chip w cityPanel objety zarzutem 1.
5. AI - ODDAL: Emporion wchodzi do kandydatow z calego katalogu ta sama bramka co gracz; scoreTech uwzglednia go. Czestosc budowy w symulacji NIE_ZMIERZONO (nie jest kryterium binarnym).
6. wikiBundle - ODDAL: przebudowany, Emporion obecny, civpedia 146/0, dodano docs/encyklopedia/budynki/emporion.md.
7. Brakujace testy - ODDAL: contact-only i free-break uruchomione i potwierdzone przeze mnie (36/0, 35/0).
8. Ikona - ODDAL: bld-emporion.svg z odznaka, mapa wskazuje, ladowana globem w brandAssets.ts.
BLOKADY: NAPRAW 1 (dowod Chromium) i 2 (zdanie o poziomach). Jeden NAPRAW wystarcza do FAIL. Preegzystujace czerwone (trade-ilosc 35/5, budynki-koszt-pracy-50, trade-routes-hud-filter) nie z tego tematu.
RUNDY: 2/5 uzyte; nastepna R3.
NASTEPNY KROK: R3 Operatora (to samo ID): zrzut Chromium (Emporion na liscie budowy po Handel+Targowisko; chip przy braku warunkow; ikona z odznaka) jako test/log z EXIT=, poprawka zdania top3[0]; ponownie Evaluator -> FC. Rownolegle orkiestrator: ABC o wariancie A.
INTEGRACJA: SHA do integracji NIE WYDANY (FAIL). Po PASS R3: kandydat = commit R3 na 69344b7a2, scalic na swiezym origin/main (b9d8fa546). Kolejnosc wzgledem origin/rust-port/parity-v2 (b520768b0): temat webowy go nie dotyka; main/web najpierw, parity-v2 niezalezny (REPIN po koncu weba).
DEPLOY/PUSH: NIE WYKONANO
