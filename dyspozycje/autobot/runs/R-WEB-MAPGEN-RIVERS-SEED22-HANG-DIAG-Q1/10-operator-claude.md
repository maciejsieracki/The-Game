# R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1 — raport Operatora, runda 3/5 (aktualizacja: runda 4/5, dokumentacja)

## ERRATA (runda 4) — korekty 1–6 z 30-obrona-claude.md, obowiązują zamiast treści poniżej
1. Współczynnik „×1,5 przy load 7–8” WYCOFANY. Czysta para na tym samym hoście (Mały seed 22): plain 96,16 s vs instr 99,15 s, czyli narzut instrumentacji ≈3%. Wpływ obciążenia na czas NIE_ZMIERZONO jako współczynnik. Dowód: `evidence/r4/plain22.log.txt`, `evidence/r4/instr22.log.txt`.
2. „Seed 11/33 = 3–4 s” WYCOFANE: to był czas znikania nakładki, nie czas generacji. W Node: seed 11 Standardowy 292–295 s, seed 33 216–225 s. Dowód: `evidence/r4/std11.log.txt`, `evidence/r4/std33.log.txt`.
3. Liczniki dla 11 i 33 (Standardowy) DOMKNIĘTE pomiarem: seed 11 → growRiverInlandBeforeDrainage 6993, estimateLandCentroidFromSeed 6993, aStarRiverToSea 6993, aStarRiverToTarget 6336, CHECKSUM b329b72a, DONE 295,13 s; seed 33 → 7850 / 7850 / 7850 / 5379, CHECKSUM 36b49da9, DONE 215,79 s. Oba zakończone, bez zapętlenia.
4. Zdanie „Node odtwarza ten sam kod Workera” WYCOFANE: NIE_ZMIERZONO (nie porównano CHECKSUM z przeglądarką). Zdanie „w Chromium >640 s = zgodne z tym zakresem” również NIE_ZMIERZONO.
5. Wniosek „seed 22 najwięcej wywołań” pozostaje, opiera się na licznikach: seed 22 = 18 590 wobec 5 974–12 136 (ziarna 1–10), 6 993 (11), 7 850 (33). Ocena „najgorszy” wynika z liczników, nie z czasu.
6. Pliki `.ts`/`.sh` (`wrap.ts`, `sweep.sh`) poza literalnym wzorcem allowlisty `*.cjs`: ZAAKCEPTOWANE przez orkiestratora (`wrap.ts` jest wejściem esbuild dla `build.cjs`, `sweep.sh` to pętla przeglądu). Dotyczy wyłącznie narzędzi diagnostycznych w `gra/tools`.

Przekreślenia `~~…~~` w treści oznaczają tezy wycofane (patrz ERRATA).

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (diagnoza generatora map; bez zmian gra/src i gra/data)
TEMAT: R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1
GOAL: ustalić, czy generacja seed 22 („Rzeki — uzupełnianie”) wisi na stałe, czy jest tylko bardzo wolna; wskazać kod i minimalną poprawkę.

## Werdykt (jedno zdanie)
Seed 22 NIE zapętla się: generacja Standardowego świata kończy się deterministycznie po ~8–12 min (zależnie od obciążenia hosta), bo etap „Rzeki — uzupełnianie” wykonuje 18 590 przebiegów BFS `estimateLandCentroidFromSeed` (bez cache, po ~6000 heksów każdy) — to defekt WYDAJNOŚCI (praktyczny „zwis” dla gracza), nie nieskończona pętla.

## Metoda (nowa, poza przeglądarką)
- `gra/tools/mapgen-rivers-seed22-diag-build.cjs` — esbuild (`/tmp/claude-0/nm/node_modules/esbuild`) bundluje `generujSwiat` do Node (cjs) z wrapperem `mapgen-rivers-seed22-diag-wrap.ts` (BEZ DOM; opcje jak kreator: kontynenty, landFraction 0,3, 15 typów cywilizacji, 2 miasta-państwa, worldDensity domyślne). Opcja `--instr`: plugin esbuild `onLoad` wstrzykuje LICZNIKI wejść do funkcji w pamięci bundla (src/ nietknięty na dysku), log co 10 s na stderr.
- `mapgen-rivers-seed22-diag-prof.cjs` — profil CPU przez CDP (`--inspect`; działa mimo synchronicznej pętli), opcja `PROF_DELAY`; `mapgen-rivers-seed22-diag-callers.cjs` — agregacja po łańcuchu wywołań; `mapgen-rivers-seed22-diag-sweep.sh` — przegląd ziaren.
- Dowody: `evidence/r3/` (TSV, logi, timeline liczników, profil).
- Host: 4 rdzenie, load 2–10 (inne pomiary równolegle) — czasy [s] są ZANIECZYSZCZONE obciążeniem (patrz hipoteza c), dlatego głównym dowodem są LICZNIKI (deterministyczne). `uptime` przed: load 2,33 (07:53), po: 2,18 (08:44); w trakcie 5–10.

## Tabela hipotez
| Hip. | Wynik | Dowód |
|---|---|---|
| (a) seed 22 kończy się po dłuższym czasie? | PRZYCZYNA (tak, kończy się) | Standardowy: 478 s (load 2,3), 503 s (load ~5), 707 s i 718 s (load 7–8); faza „główne” 58–66 s, „uzupełnianie” 413–533 s. Mały: 107 s (load 5,5) / ~250 s (load 7,6). `evidence/r3/logs/s22-*.out`, `sweep-*.tsv`. W przeglądarce >640 s (r2) ~~= zgodne z tym zakresem przy load ~6~~ (NIE_ZMIERZONO, patrz ERRATA 4) — to NIE jest nieskończone (wniosek oparty na ukończeniu w Node). |
| (b) zapętlenie w kodzie rzek? | ODRZUCONE jako pętla; PRZYCZYNA kosztu wskazana | Liczniki rosną liniowo ~40 wywołań/s (t=126 s: 2421 → t=487 s: 17 932) i ZATRZYMUJĄ SIĘ na 18 590 (`seed22-std-counters-timeline.txt`). Profil CPU fazy fill (t=90–210 s, `profile-seed22-std-fill-callers.txt`): `estimateLandCentroidFromSeed` 54,1% self, `growRiverInlandBeforeDrainage` 11,8%, `parseHexKey` 8,8%, `collectRiverHexKeys` 4,8% (+`buildOceanReachableRiverHexKeys` 3,1%), `canRiverFlowThrough` 3,1%. Łańcuchy: `…<growRiverInlandBeforeDrainage<traceRiver<traceRiverForGridFill<{tryForceRiverThroughDryPatch, buildGridRouteCandidates<tryPlaceGridSource, tryDrainDryPatchFromRelief}<fillDryLowlandPatches` (wołane z `topUpRiverGridCoverage`, etap `riversFill`). |
| (c) zależność od obciążenia hosta? | PRZYCZYNA (liczniki bez zmian; ~~czas ×1,5 przy load 7–8~~ WYCOFANE, patrz ERRATA 1) | Seed 22 Standardowy: 478 s przy load 2,3 vs 707/718 s przy load ~7–8, IDENTYCZNE liczniki 18 590/37 735. Mały seed 22: 107 s vs ~250 s. Odniesienie seed 11 i 33 Standardowy (plain, load ~5): 292 s i 225 s. |
| (d) dotyczy innych ziaren/rozmiarów? | PRZYCZYNA (dotyczy wszystkich; seed 22 najgorszy) | Tabela niżej: Standardowy 225–508 s dla ziaren 1–11, 33; Mały 30–107 s. Ten sam wzorzec (`riversFill` dominuje, w 10 ziarnach 8 ma >50%). Seed 22 ma najwięcej wywołań (18 590 vs 5 974–12 136 u innych). Uwaga: wcześniejsza informacja z checkpointu overlay ~~„seed 11/33 w 3–4 s”~~ (WYCOFANE, patrz ERRATA 2) NIE potwierdza się w Node (225–292 s) — to były czasy znikania nakładki, nie ukończenia generacji (NIE_ZMIERZONO w przeglądarce; w Node zmierzone). |
| Powtarzalność ≥3 uruchomień seed 22 | PRZYCZYNA (deterministyczne) | Standardowy ×3 z licznikami (run `instr22`, `s22-1`, `s22-2`): identyczne końcowe liczniki we wszystkich 3: `growRiverInlandBeforeDrainage=18590, estimateLandCentroidFromSeed=18590, aStarRiverToSea=18590, aStarRiverToTarget=37735`; CHECKSUM wyniku 3248f5b4 w obu uruchomieniach z sumą (s22-1, s22-2). Mały ×3: identyczne liczniki 4745/7317 i CHECKSUM 9f0c2884. |

## Tabela ziarno → czas generacji [s] (limit 1200 s; wszystkie OK, brak TIMEOUT)
| ziarno | Mały [s] (load) | Standardowy [s] (load) | Standardowy: wywołań centroid/grow |
|---|---|---|---|
| 1 | 44,4 (2,3) | 392,6 (5,7) | 8522 |
| 2 | 63,7 (2,7) | 368,1 (8,4) | 7253 |
| 3 | 53,9 (3,7) | 301,8 (9,8) | 7524 |
| 4 | 55,7 (3,7) | 254,7 (9,9) | 5974 |
| 5 | 53,5 (3,2) | 311,4 (5,7) | 9130 |
| 6 | 30,3 (4,5) | 474,7 (9,1) | 12136 |
| 7 | 67,2 (4,7) | 402,6 (10,3) | 7669 |
| 8 | 59,8 (4,9) | 433,9 (5,7) | 8096 |
| 9 | 36,8 (4,1) | 508,5 (8,0) | 11491 |
| 10 | 53,7 (4,5) | 428,1 (6,2) | 8109 |
| 11 | 48,1 (5,2) | 292,4 (5,2) | 6993 (instr, ERRATA 3) |
| 33 | 40,7 (6,6) | 224,6 (4,8) | 7850 (instr, ERRATA 3) |
| **22** | **107,0 (5,5)** | **478,0 (2,3) / 503 / 707 / 718** | **18 590** |
Ziarna 1–10 Standardowy uruchamiane równolegle po 3 procesy (load 5–10), więc czasy są górnymi oszacowaniami; porównywalne są tylko liczniki.

## Przyczyna i minimalna poprawka (NIE wdrożona — osobny temat po FC)
- Plik: `gra/src/map/gen-helpers.ts`, `growRiverInlandBeforeDrainage` (≈l. 6053–6076): `const centroid = landCentroid ?? landCenterSquare?.centroid ?? estimateLandCentroidFromSeed(hexes, sq, sr, allowReliefTraversal);` — przy braku `landCentroid`/`landCenterSquare` każdy start rzeki robi pełny BFS (`estimateLandCentroidFromSeed`, ≈l. 6132; `visitCap=6000`, `parseHexKey`/`hexKey` na stringach, bez cache). `traceRiver` (≈l. 6858) przekazuje `traceOpts.landCentroid ?? null`, a ścieżki fill (`traceRiverForGridFill` ≈l. 6972 ← `tryForceRiverThroughDryPatch` ≈l. 10787, `tryDrainDryPatchFromRelief` ≈l. 10716, `buildGridRouteCandidates` ≈l. 9310) nie ustawiają centroidu → 18 590 BFS × do 6000 heksów ≈ 1,1·10^8 odwiedzin (~54–66% czasu fazy).
- Minimalna poprawka (1–3 zdania): przekazać `landCentroid: ctx.massCentroid` (i `landCenterSquare: ctx.massCenterSquare`) do `traceOpts` w wywołaniach `traceRiverForGridFill` z `fillDryLowlandPatches`/`tryForceRiverThroughDryPatch`/`tryDrainDryPatchFromRelief` (tak jak już robi `tryPlaceMainRiverAtMouth`), ewentualnie dodać cache centroidu per spójny komponent lądu (klucz: id komponentu + `allowReliefTraversal`) wewnątrz `estimateLandCentroidFromSeed`. ZASTRZEŻENIE: zmiana może zmienić wynik generacji (inny centroid → inne rzeki), więc dla ziaren zapisanych/testowych trzeba zaktualizować oczekiwane sumy kontrolne — decyzja produktowa/ABC właściciela.
- Drugorzędne (też bez zmian w tym temacie): `riverGrowStepPassesSep`/`nearestRiverHexDistance` przy braku `sepIndex` robi liniowy skan `riverKeys` (faza „główne”, seed 11 Standardowy profil: 55,6% self `nearestRiverHexDistance` w `tryPlaceMainRiverAtMouth` → `traceRiverFromCoast`, bo `tryPlaceMainRiverAtMouth` ≈l. 9824 nie przekazuje `riverSepIndex`); `collectRiverHexKeys`/`buildOceanReachableRiverHexKeys` przebudowywane w `buildMediumRouteTargetKeys` na każde wywołanie.
- Test regresji (osobny temat): w Node (esbuild, bez DOM) generacja Standardowy seed 22 mieści się w budżecie (np. <60 s CPU na cichym hoście) ORAZ licznik wejść do `estimateLandCentroidFromSeed` ≤ N (np. 500) — liczniki są deterministyczne, więc test nie zależy od obciążenia; plus asercja sumy kontrolnej terenu/rzek po poprawce.

## ZMIANY/COMMIT
Allowlista: `gra/tools/mapgen-rivers-seed22-diag-{build.cjs,prof.cjs,callers.cjs,wrap.ts,sweep.sh}` (+ runner CDP `mapgen-rivers-seed22-diag-run.cjs` z r1) i `runs/R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1/**`. ZAŁOŻENIE: pliki `.ts`/`.sh` obok `.cjs` uznano za mieszczące się w intencji allowlisty (narzędzia diag); `gra/src`, `gra/data`, `WERSJE.md` nietknięte.

## TESTY (z surowego wyjścia)
- esbuild → Node: bundle OK; Mały seed 11: `DONE seed=11 maly t=45.97s hexes=7992`.
- Standardowy seed 22: `DONE ... t=477.93s hexes=20160` (plain), `t=503.39s` (instr), `t=706.72s`/`718.14s` (instr, load 7–8); liczniki końcowe 18590/18590/18590/37735 (3 uruchomienia identyczne); CHECKSUM 3248f5b4 (2 uruchomienia z sumą).
- Mały seed 22 ×3: CHECKSUM 9f0c2884 ×3, liczniki 4745/7317 ×3.
- Przegląd: 13 ziaren Mały (1–11, 22, 33) i 12 Standardowy (1–11, 22, 33; 11/33 bez liczników) — 0 TIMEOUT. `git diff --check` czysty (patrz commit).

## BLOKADY
Brak. NIE_ZMIERZONO: ~~seed 11/33 liczniki (uruchamiane plain)~~ (zmierzone, ERRATA 3); wpływ poprawki na jakość map (poza zakresem diagnozy); powtórzenie w przeglądarce Chromium na cichym hoście (nie potrzebne — ~~Node odtwarza ten sam kod Workera~~ WYCOFANE, ERRATA 4).

## UWAGI-DLA-ORKIESTRATORA
1. Kryterium „defekt krytyczny: gracz utknie bez końca” — NIE: kończy się, ale Standardowy świat generuje się 4–12 min (225–508 s przy load 2–10 dla wszystkich ziaren; cichy host NIE_ZMIERZONO) — to defekt UX/wydajności; temat naprawczy: R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1 (poprawka wyżej + test regresji liczników).
2. Wcześniejsze „seed 11/33 = 3–4 s” w raporcie overlay-diag było pomiarem czasu nakładki, nie generacji — do skorygowania w ewentualnej dokumentacji.
3. Narzędzie esbuild wymaga `node_modules` (użyto `/tmp/claude-0/nm/node_modules/esbuild`); runner CDP r1 nadal wymaga dist przeglądarkowego.

RUNDY: 3/5
NASTĘPNY KROK: Evaluator (weryfikacja liczników/tabel), potem Final Control; po FC — osobny temat naprawczy.
DEPLOY/PUSH: NIE WYKONANO

---

## RUNDA 4/5 (dokumentacja i evidence; kod bez zmian)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS (dokumentacja i evidence; gra/src i gra/data nietknięte)
TEMAT: R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1
GOAL: naprawić dwa punkty z FAIL r3: NAPRAW A (logi evidence/r4 poza gitignore, pliki .err opisane) i NAPRAW B (ERRATA i wycofane tezy w treści raportu).
ZMIANY-COMMIT: BAZA cacc8b1d4; dodane `evidence/r4/{instr22,plain22,std11,std33}.log.txt` (kopie pełnych logów z katalogu scratchpad, nieobjęte gitignore: `git check-ignore` rc=1); adnotacje na końcu czterech plików `.err`; ERRATA na górze i przekreślenia w treści oraz tabela 11/33 w tym pliku; ten blok RUNDA 4.
TESTY (surowe liczby z logów):
- plain22: `DONE seed=22 maly t=96.16s`, `CHECKSUM 9f0c2884`
- instr22: `DONE seed=22 maly t=99.15s`, `CHECKSUM 9f0c2884`, `COUNTERS {"growRiverInlandBeforeDrainage":4745,"estimateLandCentroidFromSeed":4745,"aStarRiverToSea":4745,"aStarRiverToTarget":7317}`
- std11: `DONE seed=11 standardowy t=295.13s`, `CHECKSUM b329b72a`, `COUNTERS {...6993,...6993,...6993,"aStarRiverToTarget":6336}`
- std33: `DONE seed=33 standardowy t=215.79s`, `CHECKSUM 36b49da9`, `COUNTERS {...7850,...7850,...7850,"aStarRiverToTarget":5379}`
- Zgodność deklaracji z plikami: wszystkie liczby z korekt obrony (7 wierszy powyżej) są dosłownie w logach w scratchpadzie i w kopiach w evidence/r4.
- `git diff --check`: patrz wynik w poleceniu commitu.
BLOKADY: NIE_ZMIERZONO (bez zmian względem ERRATA): wpływ obciążenia na czas jako współczynnik; zgodność CHECKSUM Node vs Chromium; udział 4 prób `traceRiverForGridFill` w koszcie; wpływ worldDensity; `tsc --noEmit` (brak typescript).
RUNDY: 4/5 (runda dokumentacyjna, Operator HAIKU zgodnie z dodatkiem).
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje ERRATA względem evidence/r4, potem Final Control; po FC temat naprawczy R-WEB-MAPGEN-RIVERS-FILL-CENTROID-PERF-Q1 (po decyzji ABC o sumach kontrolnych).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: pliki .err w evidence/r4 zostają w commicie jako surowy strumień z adnotacją; pełne dane są w *.log.txt. Pliki .ts/.sh poza wzorcem *.cjs: ZAAKCEPTOWANE (ERRATA 6).
