STATUS: PASS-WITH-NOTES
DOMAIN: GAME (recon, bez zmian kodu gry)
TEMAT: R-WEB-MAP-RIVER-TIERS-RECON-Q1
GOAL: dokument faktów pod zmianę generatora rzek (trzeci poziom + 2x źródeł), zero zmian w gra/**
ZMIERZONO-BAZA: bcee4f3a5ee1d607abd2591e753c209cb092c86f (kod gry = e70abe718)
ZMIANY/COMMIT: dyspozycje/analizy/MAPA-RZEKI-POZIOMY-I-LICZBA-2026-11-26.md (przepisany, runda 3); skrypty pomiarowe dyspozycje/analizy/river-count-measure-2x.cjs, river-count-run.cjs, river-count-show.cjs, river-tests-run.cjs; ten raport. gra/** nietknięte (symulacje w scratchpadzie).
TESTY / POMIARY (surowe wyniki w dokumencie, sekcje 3–6; liczby z wyjść skryptów):
- 74 przebiegi generateMap (15 map x warianty V0/V1/V2/V3, mapy ziemia/pangea/wyspy, faza all, RIVMOUTH), nonAdjacentPaths=0 na wszystkich 74.
- ODKRYCIE: bok siatki 3,5 (N/sqrt2) NIE podwaja rzek głównych (suma 15 map 1910 vs baza 1911; na 240x168 czas 2x). Decyduje MAIN_RIVER_MIN_PATH_SEP=3 (gen-helpers.ts:5705): odstęp 2 -> 2364 (1,24x), odstęp 1 -> 3940 (2,06x), kosztem medium −17% i tributary −67%; na Ziemia/Pangea tylko 1,25x/1,11x.
- Trzeci poziom: NIE ZNALEZIONO reguły (przeszukane docs/obieg, decyzje, archiwum, rejestr, pytania otwarte; frazy w dokumencie sek. 1). tributary istnieje, jest generowany, ukryty w renderze (scene.ts stage 2); medium i tributary mają dziś tę samą szerokość (scene.ts:1323–1329).
- N=15 vs mainCell=5 ROZSTRZYGNIĘTE: 15 = siatka wody/miedzi fair play (MAPA-FAIR-PLAY-SIATKA.md:9–10,20,29), siatka rzek w kodzie 10/5/5 (newGameMapDefaults.ts:280–285).
- RIVMOUTH (bde050bcf, cherry-pick samego gen-helpers na kopii): main +2,7…+7,7%, medium −21…−39%; wydajność 11 243 ms vs 11 265 ms (6 przebiegów) = BRAK +12%; river-mouth-gap-enforce-test 1/3 -> 2/2 (nadal czerwony).
- Faza all: short 7–11/mapa 84x60, 55 na 168x120 s42; czas ≈ 2x (123 s -> 240 s nieobciążony).
- Testy uruchomione na bazie: medium-river-test 38/0, river-density-test 2/0, river-yield-both-sides-test 7/0, river-confluence-edge-test 2/0, river-loop-test 7/0, river-sea-buffer-test 6 pass/3 fail (czerwony już w bazie), river-mouth-gap-enforce-test 1 pass/3 fail (baza). Z V3: density 2/0, medium 38/0, yield 7/0, sea-buffer 6/3 (bez nowych padów). Z RIVMOUTH: medium 38/0, density 2/0, sea-buffer 6/3, mouth-gap 2/2.
- git diff --name-only: tylko allowlista.
BLOKADY / NIE ZMIERZONO (jawnie):
1. Nieuruchomione z powodu czasu (limit 590 s/wywołanie, maszyna 4 rdzenie): river-path-adjacency-test w całości (zastąpiony tą samą asercją w pomiarze), river-map-scale-test, map-continents-rivers-test, river-grid-coverage-test (336x238), map-gen-regression-test, world-density-test, river-turn-window-test, river-fog-visibility-test.
2. V3 + RIVMOUTH łącznie; tiery low/high; wygląd odstępu 1 w przeglądarce (równoległe rzeki w sąsiednich heksach) — NIE OGLĄDANY.
3. Wpływ zmiany generatora na piny map-zależne gry (wspólny rand) — hipoteza z kodu, NIE ZMIERZONO.
4. Wariant C (dopływ dopływu) — liczby to ZAŁOŻENIE (brak implementacji).
5. V0 dla 168x120/240x168 w jednej wiązce równoległej z V1–V3 nie został zmierzony (porównanie czasu tylko wewnątrz V1–V3 i pojedynczo 168x120 s42).
RUNDY: 3/5 (Operator SONNET po 2 nieudanych rundach Haiku, zgodnie z dispatchem)
NASTĘPNY KROK: Evaluator -> Final Control; potem pytanie ABC do właściciela (język gry): (1) czy „trzeci poziom” = pokazać istniejące dopływy z węższą kreską (B), krótkie odnogi (A) czy nowy rodzaj (C); (2) czy 2x źródeł ma oznaczać rzeki biegnące w sąsiednich heksach (odstęp 1) — łamie regułę z 2026-08-01; (3) osobny plan dla Ziemi/Pangei.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Rekomendacja techniczna do RIVERS3: nie zmieniać mainCell; skuteczna jest tylko stała MAIN_RIVER_MIN_PATH_SEP (3->1 = 2,06x main), z kosztem medium/dopływów; razem z cherry-pickiem RIVMOUTH przez patch `git diff e80d07efb bde050bcf -- gra/src/map/gen-helpers.ts` (czysty).
- river-sea-buffer-test jest już czerwony w bazie (3 pady) i river-mouth-gap-enforce-test czerwony po cherry-picku (2 pady) — nie wynik tej rundy, ale musi być uwzględnione przed „jednym przepięciem pinów”.
- Nie tworzono sesji, zadań, triggerów; nie użyto run_in_background; node_modules nie w repo (scratchpad).
