# R-WEB-TEST-DEBT-Q14-E2-Q1 — raport Operatora (runda 1/5)

STATUS: FAIL (kryterium z dispatchu: pomiar i klasyfikacja 24 testów wykonane; NIE spełniono kryterium „naprawione zielone solo z mutacją czerwoną” — żadnego testu nie zmieniono; kandydaci STARY-PIN opisani niżej do rundy 2)
DOMAIN: GAME (testy) — bez zmian w gra/src, gra/data, gra/tools
TEMAT: R-WEB-TEST-DEBT-Q14-E2-Q1
GOAL: zmierzyć czas i wynik 24 testów kategorii E (generator/rzeki) na bazie dd33ad57b (origin/main, FALA 898) i sklasyfikować je z dowodem
BAZA: dd33ad57b786678815be8a755d48c260be604c49 (detached, worktree wf_3b970a8b-74c-1)
ZMIANY-COMMIT: tylko ten raport (dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-E2-Q1/10-operator-claude.md). Brak zmian w gra/tools/*-test.cjs (decyzja: STARY-PIN wymaga dłuższego biegu weryfikacyjnego niż pozostały limit; patrz NASTĘPNY KROK).
DEPLOY/PUSH: NIE WYKONANO

## Środowisko i uczciwość pomiaru

- Testy uruchamiane sekwencyjnie, po jednym procesie, przez driver w tle (setsid nohup, timeout 1200 s na test). Logi i czasy w `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/q14e2/` (scratchpad zamiast /tmp/<unik>, zgodnie z regułą sesji).
- Obciążenie maszyny NIE było stałe: `uptime` przed każdym testem wynosił 3,4–31,9 (1 min). W trakcie biegów działały procesy innych sesji (Chromium renderer/GPU, `vite build`). Czasy są więc zawyżone względem bezczynnej maszyny i NIE są porównywalne między sobą. `uptime` po teście NIE zmierzono (w driverze zapisywany był tylko przed testem) — NIE-ZMIERZONO.
- Dwa testy zakończyły się SIGTERM (exit 143) spoza procesu: map-gen-regression po 1102 s i horse-resource-terrain po 505 s (nie timeout 124). Źródła sygnału nie ustalono. horse-resource-terrain powtórzono solo (patrz niżej); map-gen-regression NIE powtórzono (limit czasu i tak niespełnialny, patrz tabela).
- Bramki (wykonane na bazie dd33ad57b przed startem pomiarów, bez zmian kodu): tsc --noEmit exit 0; logic 213/213; tech-tree 20 pass/0; research 33/33; combat 6/6; unit-replace 21/21; ai-test 297 passed/0 failed; climate-band-test PASS.

## Tabela 24 testów

Klasyfikacja: OK (zielony w limicie), ZA-CIĘŻKI (>20 min na bazie w tych warunkach), STARY-PIN, BŁĄD-GRY (kandydat R-WEB-*), HARNESS, NIE-ZMIERZONO.

| # | Test | Exit | Czas [s] | Wynik (z surowego logu) | Klasyfikacja i dowód |
|---|---|---|---|---|---|
| 1 | autoimprove-irrigation-after-farms | 1 | 180 | 40 OK / 2 FAIL: „koszt irygacji = 60 (3 x farma 20) [jest 30]”, „pula 92 (>= 91): irygacja powstaje” | STARY-PIN (kandydat). Test pinuje koszt 60, a dane mówią 30: `gra/data/terrain-improvements.json` (irygacja `koszt_praca: 30`) oraz skalowanie wg epoki właściciela (`scaleTerrainImprovementWorkCostForOwner`, commity d3f6fcf78 / 1c1bb853b). Test czyta `getImprovementMeta('irygacja').kosztPraca` bez epoki właściciela, więc asercja „pula” też jest oparta na starej stawce. NIE naprawiono (wymaga reguły flagi `isImprovementCostOwnerEraEnabled` + ponownego biegu ~3–4 min). |
| 2 | battle-pace-equal-line-live | 0 | 296 | 23 pass / 0 fail | OK |
| 3 | capital-sep-pangea | 0 | 168 | 3 passed / 0 failed | OK |
| 4 | cluster-start | 0 | 462 | 486 passed / 0 failed | OK |
| 5 | deposit-coast | 124 | 1200 (limit) | brak podsumowania; w logu 14 z 20 map (4 typy × 5 ziaren) | ZA-CIĘŻKI na bazie (timeout 20 min, pętla 20 map, ~30–150 s/mapa pod obciążeniem) |
| 6 | earth-template | 1 | 429 | 8 pass / 2 fail: „ziemia ląd: 0 heksów lądu poza szablonem (found 1668)”; „Antarktyda w szablonie nad buforem południowym (found 0 przy r=85)” | Patrz sekcja „Dowody — earth-template” niżej. Część HARNESS/STARY-PIN (plytkie_morze liczone jako ląd): 1596 z 1668. Pozostałe 72 heksy `laka` poza szablonem = kandydat BŁĄD-GRY. Antarktyda: przyczyna NIE-ZMIERZONO. |
| 7 | fair-play-grid | 0 | 163 | 8 pass / 0 fail | OK |
| 8 | horse-resource-terrain | 124 (powtórka) | 1200 (limit); 1. bieg 505 (SIGTERM) | sekcja (A) 4/4 OK; sekcja (B) prawdziwy generator — niedokończona | ZA-CIĘŻKI w sekcji (B): ~40–195 s na mapę pod obciążeniem. Wynik pełny NIE-ZMIERZONO. |
| 9 | land-sea-ratio | 124 | 1201 | brak podsumowania | ZA-CIĘŻKI na bazie (potwierdza dispatch: >1800 s w r1, >1200 s tu) |
| 10 | map-coast-buffer | 124 | 1200 | 23 × FAIL przed limitem; m.in. „kontynenty seed=1: ląd w buforze brzegu (11,0, 12,0, 13,0)”; „generujSwiat standardowy: ląd w buforze (26)” | HARNESS/STARY-PIN (dowód niżej: 53/53 naruszeń to `plytkie_morze`) + ZA-CIĘŻKI (>20 min). NIE naprawiono — po poprawce test musiałby przejść całość w limicie, a na tej maszynie nie przechodzi. |
| 11 | map-continents-rivers | 124 | 1200 | brak podsumowania | ZA-CIĘŻKI |
| 12 | map-gen-regression | 143 (SIGTERM) | 1102 | nie zakończony; w logu `mapGen total` 9 242–85 584 ms/mapę | ZA-CIĘŻKI / NIE-ZMIERZONO (przerwany z zewnątrz). Limit 7 s/mapę niespełnialny pod obciążeniem 12–30 (log: 9–85 s). |
| 13 | miasta-zbyt-blisko | 0 | 189 | PASS (23137/23137 i 23961/23961 par w normie) | OK (uruchomiony przy load 24–32) |
| 14 | relief-grid-coverage | 124 | 1200 | częściowo PASS (Standard kontynenty i Standard Ziemia: żelazo/miedź 15×15); przerwany na „Ogromny Ziemia” 336×238 | ZA-CIĘŻKI (ostatni przypadek 336×238) |
| 15 | river-density | 0 | 108 | 2 passed / 0 failed | OK |
| 16 | river-grid-coverage | 124 | 1200 | częściowo PASS (Standard Ziemia siatka hex ≥50%, 2/2) | ZA-CIĘŻKI |
| 17 | river-loop | 0 | 316 | 7 pass / 0 fail | OK |
| 18 | river-map-scale | 124 | 1200 | częściowo PASS (Standard: główne > 0) | ZA-CIĘŻKI |
| 19 | river-path-adjacency | 0 | 1090 | 7536 pass / 0 fail | OK (blisko limitu 1200 s) |
| 20 | river-sea-buffer | 1 | 174 | 6 pass / 3 fail: „kontynenty seed 42: główne nurty respektują bufor 2 hex (10 złych)”; „kontynenty seed 42: ujścia main co ≤7 hex (złe masy 8, worst 18)”; „pangea seed 7: ujścia main co ≤7 hex (złe masy 1, worst 15)” | Kandydat BŁĄD-GRY (nie STARY-PIN: reguła stała nadal w src). `MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7` (`gra/src/map/gen-helpers.ts:5727`, wprowadzona FALA 170, commit 853c0e320); worst 18 > 7 i 15 > 7. Minimalne odtworzenie: `generateMap(54,37,42,'kontynenty')`, wynik `worstMainRiverCoastMouthGapOnMass`. Nie zbadano, czy bufor 2 hex (10 złych) ma osobną przyczynę. |
| 21 | river-yield-both-sides | 0 | 126 | 7 pass / 0 fail | OK |
| 22 | stranded-land | 1 | 417 | 15 pass / 3 fail: „Standard Ziemia seed=7: brak lądu w otwartym oceanie (specks=5)”; „Standard Ziemia seed=42: … (specks=5)”; „Mały wyspy seed=42: … (specks=1)” | BŁĄD-GRY (kandydat, zgodnie z kontekstem dispatchu dla Ziemi 7/42). Ostrzeżenie: dispatch zakładał 16/2; zmierzono 15/3. Trzeci FAIL („Mały wyspy seed=42”) NIE został wyjaśniony. |
| 23 | terrain-height-audit | 0 | 134 | 8 pass / 0 fail | OK |
| 24 | world-density | 1 | 295 | 29 pass / 2 fail: „rzeki sum low=602 med=571 high=584”; „pustynia sum low=504 med=503 high=503” | Kandydat BŁĄD-GRY lub STARY-PIN — NIE-ZMIERZONO przyczyny. Asercja monotonii `low ≤ med ≤ high` (test, linie 141–142) jest łamana: 602 > 571. Nie sprawdzono, czy zmiana gęstości jest celowa. |

Podsumowanie: OK 10 (fair-play-grid, capital-sep-pangea, cluster-start, river-density, river-loop, river-path-adjacency, river-yield-both-sides, terrain-height-audit, miasta-zbyt-blisko, battle-pace-equal-line-live). ZA-CIĘŻKI (limit czasu lub przerwanie) 9 (deposit-coast, relief-grid-coverage, river-grid-coverage, river-map-scale, map-continents-rivers, land-sea-ratio, map-coast-buffer, horse-resource-terrain w sekcji B, map-gen-regression). Z czerwonymi asercjami 5 (earth-template, river-sea-buffer, stranded-land, world-density, autoimprove-irrigation-after-farms; map-coast-buffer czerwony z dowodem poniżej).

## Dowody — earth-template i map-coast-buffer

Zrobiono diagnostykę tylko do odczytu (skrypt w scratchpad, bez zmian w repo), na bundlach testów.

- earth-template, ziemia seed 777 Standard: heksy ≠ `morze` poza szablonem = 1668; typy: `plytkie_morze` 1596, `laka` 72. Test pomija tylko `morze` (linia `if (hex.terenBazowy === 'morze') continue;`), więc płytkie morze jest liczone jako ląd. Przyczyna: commit 6be6be373 (P-MAPGEN-PANGEA-OBRYS-P4, Wybrzeze → PlytkieMorze, isWaterTerrain) zmienił tę regułę w `earth-template-test.cjs` tylko częściowo. Decyzja P4 mówi, że PlytkieMorze to teren wodny. Klasyfikacja: HARNESS/STARY-PIN dla 1596. Pozostałe 72 `laka` poza maską ziemi to kandydat BŁĄD-GRY (reguła z nagłówka testu: „ląd tylko w masce mockupu”, decyzja A). Przyczyny nie zbadano w generatorze.
- Antarktyda (r=85, found 0): test oczekuje lądu nad buforem południowym. Historia: c94a78eaa „bez Antarktydy”, e9c4c965d „przywroc Antarktyde”. Obecny stan nie jest zgodny z asercją. Nie ustalono, czy to regresja, czy stary pin. NIE-ZMIERZONO przyczyny.
- map-coast-buffer, kontynenty seed 1: `findLandInMapBorder` zwraca 53 heksy, wszystkie `plytkie_morze`. Funkcja (`gra/src/map/gen-helpers.ts:1380`) sprawdza `!== Morze`, więc wodę płytką liczy jako ląd. Test (asercja „ląd w buforze brzegu”) korzysta z tej samej funkcji. Klasyfikacja: HARNESS/STARY-PIN po P4. Uwaga: `enforceMapBorderOcean` zamienia niebędące `Morze` heksy brzegu na `Morze`, więc `plytkie_morze` w buforze pojawia się po ostatnim wywołaniu tej funkcji. To możliwy BŁĄD-GRY w generatorze (kolejność etapów). Nie zbadano źródła tego etapu.

## Kandydaci BŁĄD-GRY (dla R-WEB-*; testy zostają czerwone)

1. Ziemia (`typ='ziemia'`): 72 heksy `laka` poza szablonem maski, seed 777 Standard (earth-template). Odtworzenie: `generujSwiat(777,'standardowy','ziemia', {worldDensity: medium…})`.
2. Ziemia: brak lądu w południowym buforze (Antarktyda r=85, earth-template). Do ustalenia: regresja czy pin.
3. Mapa kontynenty seed 42: ujście głównej rzeki 18 hex od brzegu (limit 7, `MAIN_RIVER_COAST_MOUTH_MAX_GAP`); pangea seed 7: 15 hex. river-sea-buffer.
4. Ziemia seed 7 i 42 oraz wyspy seed 42: pojedyncze lądy na otwartym oceanie (specks 5/5/1). stranded-land.
5. Monotonia gęstości (world-density): rzeki low 602 > med 571; pustynia low 504 > med 503. Do potwierdzenia, czy to zmiana celowa.

## Kandydaci STARY-PIN (poprawki w rundzie 2, z mutacją)

- autoimprove-irrigation-after-farms: oczekiwany koszt irygacji 60 → aktualna reguła (koszt_praca 30 + skalowanie wg epoki właściciela); pula 92/91 powiązana z tym samym kosztem.
- earth-template i map-coast-buffer: w licznikach „lądu” pominąć `plytkie_morze` (woda wg P4), zachowując asercję dla realnego lądu. Dla earth-template i tak pozostanie czerwony przez 72 `laka` (BŁĄD-GRY). Dla map-coast-buffer poprawka wymaga pełnego biegu, który na tej maszynie nie mieści się w 20 min — trzeba go podzielić lub uruchomić na wolnej maszynie.

## Propozycja trybu skróconego (ZA-CIĘŻKI, bez zmiany testów)

Zmienna środowiskowa ograniczająca listę map (np. tylko seed 42 i typ `kontynenty`/`ziemia`) dla: deposit-coast (4 × 5 map), relief-grid-coverage (przypadek 336×238), river-grid-coverage, river-map-scale, map-continents-rivers, land-sea-ratio, horse-resource-terrain (sekcja B). Konkretnej nazwy zmiennej nie zaprojektowano w tej rundzie. Zakres dla R-WEB-*.

## Blokady

Brak blokad technicznych. Czas rundy nie wymusił zwrotu częściowego, bo wszystkie 24 testy zostały uruchomione. Ograniczenia: obciążenie maszyny (patrz wyżej), dwa SIGTERM spoza procesu, brak `uptime` po teście.

## Uwagi dla orkiestratora

- Podczas biegów inny proces na tym samym hoście wykonywał sekwencję git (merge + `git push origin HEAD:main` z nazwą LIVEWELCOME). Ta sesja nie wykonała żadnego pusha na main. Warto to sprawdzić w logu tamtej sesji.
- Zmierzony wynik stranded-land (15/3) różni się od wartości z dispatchu (16/2). Przyczyny nie ustalono.
- Nie wykonano żadnej zmiany w `gra/tools`. Allowlista została zachowana.

NASTĘPNY KROK: runda 2 — (a) poprawki STARY-PIN z mutacją czerwoną: autoimprove-irrigation (koszt wg obowiązującej reguły), earth-template i map-coast-buffer w zakresie `plytkie_morze` (wymaga biegu poza limitem); (b) zgłoszenie R-WEB-* dla kandydatów BŁĄD-GRY 1–5; (c) pomiar `uptime` po teście i ponowny bieg map-gen-regression na maszynie bez obciążenia.
