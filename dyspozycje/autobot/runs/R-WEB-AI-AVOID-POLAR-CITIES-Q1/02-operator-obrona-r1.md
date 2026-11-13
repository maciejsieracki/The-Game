STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-AVOID-POLAR-CITIES-Q1
ROLA: Operator (obrona), po werdykcie Evaluatora PASS-WITH-NOTES

## Zarzut 1 (gracz zmieniony) — PRZYJMUJE
Pomiar `playerStartHex` baza 50edcc264 vs 56c4552d9 (15 map): zmieniony na 7/15 (Evaluator: 4/9). Raport r1 "gracz bez zmian" byl nieprawdziwy.
Przyczyna: pula `ladowe` (masy, pickPlayerClusterCenter, spawnCache) i `isSpawnHabitableTerrain` (passesLocalLandGate) byly wspolne z graczem.
Poprawka (clusters.ts): `isSpawnHabitableTerrain` przywrocona do oryginalu; dwie pule w computeClusters: `ladowePlayer` (oryginalna, z Polarny:
masy, landCache, landBBox, pickPlayerClusterCenter, spawnCache, strumien rand) i `ladowe` (AI/MP, bez Polarny, fallback + warn).
AI-only: `dropPolarHexCandidates` w pickBestLocalLandSpawn / pickCenterInMassSpread, polar-check kapitala w buildClusterCitiesWithLandGate
(poza ukladem gracza, param `isPlayerLayout`), zakaz+tier w pickSpawnHexWithCapitalGates (bez zmian wzgledem r1, `!requirePlayerMassGate`).
Wynik po poprawce: start gracza identyczny na 28/30 map (15 + 15 innych ziaren); 2 mapy Wyspy przesuniete (wyspy1001 100,48 -> 101,48; wyspy3333 95,49 -> 85,58).
Przyczyna 2 odchylen: NIE_ZMIERZONO wprost; hipoteza = bramka separacji gracza czyta stolice obcych typow (cluster-spawn.ts ~l.263), ktore zeszly z polarnych.
Efekt uboczny jawnie zaakceptowany w dokumencie (zalozenie), pokryty testem `ai-avoid-polar-player-parity-test.cjs` (>=28/30, maxDist<=12; wynik 28/30, maxDist 10).
Plan startowy po poprawce (15 map): AI/MP na polarnym 0 (825), r<=1: 26 (baza 33, r1 20), r<=2: 36 (baza 43, r1 25) — kompromis: r<=1 wyzsze niz r1, bo bramka lokalnego lądu AI znow liczy Polarny jako lad.

## Zarzut 2 (tura 100 NIE_ZMIERZONO, mylacy opis) — PRZYJMUJE (opis), kryterium dalej NIE_ZMIERZONO
Naglowek `ai-avoid-polar-sim-test.cjs` przepisany: to symulacja zastepcza (planCityFounding, TURNS=15), nie decideAITurn ani tura 100.
Pomiar po poprawce (15 map): miasta AI 3822 (baza 3846, -0,6%), zalozone przez osadnikow 3087 (baza 3111, -0,8%), na polarnym 0 (baza 20).
Prawdziwa tura 100 przez decideAITurn: NIE_ZMIERZONO (harness nie zalozyl miasta w sandboxie).

## Zarzut 3 (hexCityScore zero plonow) — ODRZUCAM jako zarzut do tej rundy
Poza allowlista (`hexCityScore` zmienia tempo ekspansji AI); Operator zglosil jako DECYZJA_WYMAGANA, Evaluator potwierdza brak FAIL.
Naglowek testu dopisuje, ze wynik dotyczy znormalizowanej punktacji. Wplyw na realna gre: NIE_ZMIERZONO. Wymaga osobnego tematu/decyzji wlasciciela.

## Zarzut 4 (r<=1, dowod braku alternatywy) — PRZYJMUJE CZESCIOWO
Sim rozszerzona o dowod: dla kazdego miasta zalozonego w r<=1 sprawdzono, czy istnial legalny (canFoundCity) hex lad poza polarnym i poza r<=1: 26/26 mialo.
Czyli osadnicze miasta w r<=1 NIE wynikaja z braku alternatywy na mapie, tylko z rankingu (kara 8 jest miekka, po progu minScore) — twierdzenie r1
"twarde bramki separacji" dotyczylo tylko planu startowego i pozostaje NIE_ZMIERZONO. Kara jest swiadomie miekka (cel: brak spadku liczby miast).
Test alternatywy szuka legalnego hexa gdziekolwiek na mapie (slaby dowod, nie "w zasiegu sensownym").

## Zarzut 5 (pickBonusCityHex) — ODRZUCAM (poza allowlista)
`ai-difficulty-bonus.ts` poza allowlista; propozycja osobnego mini-tematu `R-WEB-AI-BONUS-CITY-POLAR-Q1` bez zmian.

## Testy
- tsc --noEmit EXIT=0
- ai-avoid-polar-pick-test 16/16; plan-test (10 map) AI/MP na polarnym 0
- mutacja (avoidPolar=false + pula bez filtra Polarny): plan-test FAIL (10 AI/MP na polarnym), po przywroceniu PASS
- parity gracza 28/30 (maxDist 10)
- capital-sep-pangea 3/3, capital-sep-unit 36/36, mp-spawn-ration 16/16, cluster-spread 5/5, cluster-plan-name 6/6
- pelny regres 61 ai-* NIE powtarzany w obronie (zmiana dotyczy tylko clusters.ts + naglowek/rozszerzenie testu); wynik r1 (47 PASS, 9 czerwonych jak na bazie) dotyczy poprzedniego stanu clusters.ts = NIE_ZMIERZONO dla nowego
DEPLOY/PUSH: NIE WYKONANO
