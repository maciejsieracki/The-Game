STATUS: BLOCK
DOMAIN: GAME (recon, bez zmian kodu)
TEMAT: R-WEB-MAP-RIVER-TIERS-RECON-Q1
GOAL: dokument faktów pod zmianę generatora rzek (trzeci poziom + 2x źródeł), zero zmian w gra/**
ZMIANY/COMMIT: dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md (sekcje 3, 4, binarne kryterium) + ten raport; baza f341dd5f3 (kod gry bez zmian)
TESTY:
- Pomiar 15 z 15 map (ZMIERZONO, bundle esbuild `generateMap`, domyślna faza main+medium): 240×168 seed 99 = main 203/2684 hex, medium 103/1466, tributary 118/1879, czas 207 031 ms; 240×168 seed 2026 = main 234/2917, medium 96/1338, tributary 103/1554, czas 211 042 ms. Pozostałe 13 map jak w dokumencie (sekcja 3). Short = 0 na wszystkich 15.
- Odczyt bde050bcf (ZMIERZONO w diffie git): commit nie jest przodkiem f341dd5; diff pokazuje 11 plików, +214/−463 (cofa wdrożone FALE), właściwa zmiana generatora to gen-helpers.ts +101 (nd<1 l.6386, allowForkMouth, tryForkMouthAtGap ~9721) + test river-mouth-gap-enforce-test.cjs.
- NIE ZMIERZONO: liczba rzek i czas po podwojeniu źródeł (N/√2 lub 2 starty na komórkę); wpływ bde050bcf na liczbę rzek (wymaga checkoutu gałęzi); uruchomienie lekkich testów rzek i piny/progi (pkt 7).
- Zmierzono: `git status` w allowliście; gra/** nietknięte.
BLOKADY:
1. Pkt 3 (2x źródeł, symulacja po zmianie): NIE ZMIERZONO — brak wariantu w skrypcie pomiarowym.
2. Pkt 4: wpływ RIVMOUTH (bde050bcf) na liczbę rzek i wydajność NIE ZMIERZONO.
3. Pkt 7: piny/progi testów rzek nie zweryfikowane (testy `gra/tools/*river*` nie uruchomione).
4. Pkt 1: docs/archiwum/** i docs/decyzje/** nadal nie przeczytane w całości; trzeci poziom wprost NIE ZNALEZIONO.
Kryterium dispatchu (pkt 1–7 spełnione) niespełnione — stąd BLOCK.
RUNDY: 2/5 (ta runda: domknięto pomiar 15 map i odczyt bde050bcf; baza f341dd5 już zawierała wynik rundy 2 Operatora i obrony).
NASTĘPNY KROK: (a) Evaluator/FC: zaakceptować pomiar 15 map i ustalenie o bde050bcf; (b) kolejna runda Operatora: podwojenie źródeł w skrypcie (N/√2, 2 starty na komórkę) na 15 mapach + lekkie testy rzek z listą pinów; (c) decyzje ABC właściciela: „trzeci poziom” = short (A) czy nowy typ (B); czy tributary widoczne domyślnie.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Gałąź RIVMOUTH-wip/fc3 (bde050bcf) jest oparta na starszym main: NIE scalać całościowo (cofnęłaby FALE 904–911 i testy). Integracja tylko cherry-pick gen-helpers.ts (+101) i river-mouth-gap-enforce-test.cjs (+106) na aktualny main.
- Zmierzono skutek: domyślnie widać tylko main+medium (scene.ts:1539-1546 stage 2); tributary (59–146 na mapę) generowane, ale ukryte — to główna przyczyna wrażenia „za mało rzek”.
- Rozbieżność N=15 (MAPA-RZEKI-SPEC §2) vs mainCell=5 (newGameMapDefaults.ts:281) nadal NIE ROZSTRZYGNIĘTA.
- Czas pomiaru dwóch map 240×168 ~207–211 s każda (pojedyncze przebiegi, maszyna współdzielona).
- Nie tworzono sesji, zadań, triggerów ani nie użyto run_in_background. node_modules w gra/ usuwane po pomiarze.
