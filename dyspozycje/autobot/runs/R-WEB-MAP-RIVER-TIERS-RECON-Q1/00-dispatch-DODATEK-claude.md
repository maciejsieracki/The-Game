# R-WEB-MAP-RIVER-TIERS-RECON-Q1 — DODATEK (runda 1/5, Operator HAIKU 5.5)

## Zadanie (tylko odczyt kodu, dokumentów i pomiar na zimno; wynik = dokument)
1. REGUŁY HISTORYCZNE: znajdź i zacytuj (plik+linia/ID) wszystkie wcześniejsze reguły/decyzje właściciela o poziomach rzek: główne / boczne (dopływy) / trzeciego poziomu — przeszukaj docs/obieg/MAPA-RZEKI-SPEC.md, MAPA-KANON-GENERATOR.md, MAPA-FAIR-PLAY-SIATKA.md, docs/archiwum/**, docs/decyzje/**, dyspozycje/REJESTR-PROSB-I-ZADAN.md (słowa: rzeka/rzeki, dopływ, tributary, medium, short, boczn, poziom, AC-7, FALA 170, monotonia), gra/data/*river* i parametry generatora. Odpowiedz: co DOKŁADNIE ustalono o trzech poziomach (nazwy, liczność, szerokość renderu, kto się do kogo wpada, kiedy generowane). Jeśli nie znajdziesz trzeciego poziomu w żadnej decyzji — napisz wprost „NIE ZNALEZIONO” i wskaż najbliższą regułę (np. kind 'medium'/'short' w kodzie).
2. STAN KODU: opisz RiverPathKind ('main'|'medium'|'short'|'tributary', gra/src/map/gen-helpers.ts ~8608) i wszystkie miejsca, gdzie powstaje każdy rodzaj (funkcje, warunki, limity ilości, szerokości w renderze rzek w gra/src). Który z nich jest dziś „bocznym”, a który mógłby być „trzeciego poziomu”?
3. POMIAR (bez zmian kodu): dla 15 map standardowych (lista map z gra/tools/river-path-adjacency-test.cjs lub map-gen-regression) policz liczbę rzek każdego rodzaju i ich łączną długość heksów; liczba źródeł głównych na mapę. Użyj istniejących narzędzi/odtworzeń z dyspozycje/analizy/GENERATOR-MAP-BLEDY-REPRO-2026-11-25.md i dyspozycje/analizy/ (skrypty tmp w scratchpadzie, NIE commituj skryptów poza dyspozycje/analizy/). Czas generowania jednej mapy (ms) dla 3 map.
4. PARAMETRY LICZBY ŹRÓDEŁ: wskaż, które stałe/dane decydują o liczbie źródeł głównych (siatka N×N wg tieru „Rzeki” Mało/Normalnie/Dużo, min. odstęp źródeł 0,8·N, quota, kreatory) i jak dokładnie podwoić ich liczbę na WSZYSTKICH mapach (kreator + mapy stałe/Ziemia). Policz przewidywaną liczbę rzek po zmianie (np. N→N/√2) dla 15 map; wskaż ryzyka (reguła sąsiedztwa rzek, bufor od morza, odstęp między ujściami, wydajność +12% z RIVMOUTH).
5. PROJEKT TRZECIEGO POZIOMU: zaproponuj 1–2 warianty implementacji zgodne z regułami z pkt 1 (np. dopływ dopływu o 25% szerokości; krótkie dopływy do dopływów) z liczbami dla 15 map, kosztem generowania i listą ryzyk. Warianty różnią się SKUTKIEM dla wyglądu mapy (dla właściciela po polsku), nie sposobem wykonania.
6. LISTA TESTÓW/PINÓW generatora, które się zmienią po (a) trzecim poziomie, (b) 2× źródeł, (c) domknięciu RIVMOUTH-wip/fc3 (bde050bcf: `if (nd < 1) continue;`, tryForkMouthAtGap): nazwy plików gra/tools/*-test.cjs, hashe/pin-pliki, bramki ciężkie vs lekkie.

## Wynik
Dokument dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md + raport runs/R-WEB-MAP-RIVER-TIERS-RECON-Q1/10-operator-claude.md. Wszystkie liczby oznaczone ZMIERZONO/NIE ZMIERZONO.
## Allowlista
dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md, dyspozycje/autobot/runs/R-WEB-MAP-RIVER-TIERS-RECON-Q1/**.
## Zakazy
Jakakolwiek zmiana gra/**, gra-robocza/, gra-kanon/, rust-port/, dyspozycje/WERSJE.md, manifest; npm run build/dev w gra/; git add -A; push; spawn_task/create_session/create_trigger/send_later; run_in_background w Bash. Dysk >= 4 GB; usuń node_modules po pomiarach.
## Bramki
Brak bramek kodu (recon). git diff --name-only musi wskazywać wyłącznie allowlistę. Zacommituj i zwróć SHA.
## Binarne kryterium
Dokument zawiera pkt 1–6 z cytatami i liczbami; zero zmian w gra/**.
