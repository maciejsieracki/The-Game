STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) -- wydajnosc: render/HUD w koncu tury
TEMAT: R-WEB-PERF-ENDTURN-RENDER-HUD-Q1
GOAL: -40% lacznego czasu syncUnitsRender + renderLoop + syncStatChips w koncu tury duzej gry (137 miast / 321 jednostek), obraz identyczny, bez zmiany logiki gry.

## ZMIANY / COMMIT
BAZA: origin/main 6a673c838b306dbad47dd33d58f5f5a72882a71c (detached, bez rebase).
Commit: patrz `git log` galezi (SHA wpisany w odpowiedzi koncowej orkiestratorowi; commit zawiera ten raport).
Pliki (allowlista): `gra/src/main.ts`, `gra/tools/perf-endturn-render-hud-live-test.cjs` (nowy), `dyspozycje/autobot/runs/R-WEB-PERF-ENDTURN-RENDER-HUD-Q1/**`.
Zero zmian: `gra/data/**`, `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `battle/**`, `vite.config.ts`, `render/*.ts`, `ui/hud.ts`.
Uwaga: w worktree zastano niezacommitowane zmiany z poprzedniej, przerwanej proby tego samego tematu (czesc `main.ts` i szkielet harnessu) -- zweryfikowane profilem i przejete; dalsze zmiany dopisane.

### Diagnoza (profil CPU CDP, 1. koniec tury, baza)
syncUnitsRender 771 ms (37 wywolan, ~20 ms), z czego syncStatChips 499 ms (zagniezdzone), z czego _buildBadgeInput -> getCityGrowth -> cityGrowthLive -> computeView ~370 ms (liczone dla ~40 miast gracza przy KAZDYM wywolaniu); syncForestForUnits 96 ms; UnitRenderer.sync 90 ms. renderLoop 521 ms = 446 ms WebGLRenderer.render (updateMatrixWorld 200, projectObject 120, renderObjects 79) -- koszt SwiftShader/sceny, bez dominanty do bezpiecznego zdjecia w tym temacie.
Trzy funkcje sie nakladaja (syncStatChips wewnatrz syncUnitsRender), wiec "suma trzech" liczy to samo dwa razy; podaje obie miary (SUMA i UNIA).

### Poprawki (wszystkie w `gra/src/main.ts`, bez zmiany logiki gry)
1. Faza AI: ruch AI z bonusem odwiedzin miasta wolal pelne `syncUnitsRender()` po kazdym takim ruchu (37x). Teraz `syncAllRuntimeUnitHpState()` (stan) leci od razu, a przebudowa warstwy renderu jest odroczona przez `createDirtyRenderSync` (`aiUnitRenderBatch`, ten sam wzorzec co istniejacy `aiCityRenderBatch`) do granic: przekazanie bitwie gracza, koniec fazy AI (flush bezwarunkowy, takze po bledzie).
2. Klatka postepu miedzy wlascicielami AI flushuje tylko modele miast (`flushAiCityRenderBatch(false)`); zetony jednostek czekaja do granicy bitwy/konca fazy (1 flush zamiast ~4).
3. `refreshFog()` wolane przez zbieranie wioski przez AI (`checkVillageRewardAt`) -- w fazie AI przy `fogOn` tylko oznacza warstwe zetonow jako brudna (`deferRefreshFogUnitSync`, zerowany po flushu konca fazy); poza faza AI hak = null = zachowanie bez zmian. Pozostala logika refreshFog (odkrywanie, mgla, dyplomacja) wykonuje sie natychmiast jak dotad.
4. `currentVisible()` liczone raz na wywolanie `syncUnitsRender` i wspoldzielone z `_cityRenderOpts(visOverride)`.
Nie zmieniano: render/units.ts, render/cities.ts, scene.ts, hud.ts (profil nie wskazal bezpiecznej dominanty; memo wzrostu miasta po "wersji stanu" odrzucone -- markCityStateDirty nie jest pelna lista zmian, ryzyko nieswiezej plakietki).

## TESTY / POMIARY
Harness: `gra/tools/perf-endturn-render-hud-live-test.cjs` (kopia perf-endturn-ai-phase-live-test + liczniki + sekcja `pixel`), Chromium /opt/pw-browsers/chromium headless SwiftShader, seed 1412026, 137 miast, 321 jednostek. Build do katalogu poza repo (programowy vite.build jak istniejace harnessy, nie `npm run build`).

### A/B (czas inkluzywny z profilu CPU, ms; baza = 6a673c838, kandydat = ta zmiana; EOT1 = pierwszy koniec tury, EOT2 = drugi)
Baza: 5 przebiegow naprzemiennie parami z kandydatem v2; kandydat v3 (final) -- 5 przebiegow osobno po bazie (NIE w pelni naprzemiennie z baza: baza mierzona w parach 1-5 z v2, v3 w serii pozniejszej; dryf maszyny mozliwy). Dane: evidence/ab-aggregate.txt, ab-summary.json.
| EOT1 (duza gra, mediana, min/max) | baza | kandydat | zmiana |
| syncUnitsRender | 717 (688/857) | 170 (146/208) | -76% |
| syncStatChips | 444 (435/543) | 102 (92/132) | -77% |
| renderLoop | 502 (496/597) | 529 (499/617) | +5% (szum; bez zmian w kodzie) |
| SUMA trzech (podwojne liczenie) | 1658 | 802 | -51,6% |
| UNIA (sample w ktorejkolwiek z trzech) | 1214 (1187/1455) | 701 (656/811) | -42,3% |
| EOT2 | baza | kandydat | zmiana |
| UNIA | 816 | 708 | -13,2% (baza ma tu tylko ~9 wywolan, wiec mniej do odzyskania) |
Cel -40% spelniony dla 1. konca tury duzej gry (obie miary); dla 2. konca tury NIE (-13% UNIA, -19% SUMA) -- uczciwie. renderLoop (WebGL/SwiftShader) bez zmiany: NIE zredukowany, bo bez bezpiecznego zdjecia w allowliscie.
Wall konca tury (mediana z 10 EOT): baza 14912 ms, kandydat v3 15226 ms -- w granicach szumu SwiftShader (zakres 13,4-16,7 s); skrocenie JS ~-0,5..1 s nie jest widoczne w wall przez obciazenie GL/idle. JS: 3531 -> 3396 ms (mediana).

### Parytet obrazu
Sekcja `pixel` harnessu: po koncu tury (stan z odroczeniem) vs po wymuszonej pelnej synchronizacji (`syncUnitsRender` + `cityRenderer.sync`):
- digest grafu sceny (38033 obiektow: widocznosc, transformacje, kolor/opacity materialu, wymiar tekstury sprite'ow, id miast/jednostek): 0 niezgodnych dzieci korzenia -- wynik identyczny.
- pelna klatka 1600x1000: 92 px roznicy, max delta kanalu 1, bbox x1584-1586 y841-878 (pasek HUD 3x38 px po prawej, animacja UI); TEN SAM pasek i szum (137 px, delta 1; w drugim pomiarze 83 px nawet miedzy dwiema wymuszonymi synchronizacjami) wystepuje na kodzie BAZY (evidence/pixel-parity-base.txt). Poza paskiem: 0 px. Czyli 0 px w obszarze sceny, nie 0 px bezwzgledne w klatce -- NIE_ZMIERZONO 0 px bezwzglednego z powodu animacji HUD.
- Pelne porownanie dwoch buildow (baza vs kandydat) pikselowo: NIE_ZMIERZONO (gra niedeterministyczna miedzy przebiegami).
Brak wlasnego testu `perf-endturn-render-*.cjs` poza harnessem (sekcja pixel jest w harnessie).

### Bramki (evidence/gate-*.txt, kazdy z linia EXIT=; uruchomione na finalnym kodzie)
- tsc --noEmit: EXIT=0 (0 bledow)
- logic-test: 213/213
- unit-renderer-overlay-sync-test: 17/0
- capture-render-sync-test: 23/0 (pierwsza proba FAIL: komentarz w refreshFog zawieral literal `syncUnitsRender(` -- test liczy wystapienia; przeformulowano)
- city-badge-zoom-lod-test: 67/0
- memory-static-geometry-pool-test: 18 OK / 0 FAIL
- memory-static-material-pool-pixel-test: 7 OK / 0 FAIL
- memory-growth-visual-parity-test: nie uruchamiany (wymaga dwoch dist; nie dotyczy zmienionego kodu) -- NIE_ZMIERZONO.

## BLOKADY
Brak. Ryzyka do oceny Evaluatora: (a) odroczone zetony w trakcie fazy AI sa nieaktualne do flushu (przykrywa je ekran przejscia; stan gry kanoniczny); (b) wyjatki w `runAiPhase` -- flush i zerowanie haka sa po catch, bezwarunkowo; (c) pozostala nieredukowana czesc: renderLoop oraz syncUnitsRender wolane z refreshFog poza faza AI.

## RUNDY
1/5

## NASTEPNY KROK
Evaluator (Sonnet 5.5, ten sam ID) -> Obrona (Haiku 5.5) -> Final Control. Rekomendacja Evaluatora: sprawdzic parytet gracza/AI/MP (hotseat: `fogOn` + `deferRefreshFogUnitSync`), ewentualnie osobny temat na renderLoop (updateMatrixWorld statycznych podgrup) i memo wzrostu miasta.

DEPLOY/PUSH: NIE WYKONANO
