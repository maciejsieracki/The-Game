STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
GOAL: refreshFog / updateHud / granice zredukowane >= 5x lub poza sciezka kliku; endTurn zmierzony; priorytet R3: ruch jednostki, wejscie do miasta, panel miasta.

## Diagnoza (a): renderInfo.calls 28 881 to REALNE waskie gardlo, nie artefakt
Zapis: seed 1412026, 137 miast, 321 jednostek (PERF_MODE=save/load). Rozbicie sceny (hak perfSceneBreakdown/perfSceneTopGroups, evidence/r3-scene-*.txt): przy max oddaleniu wszystko w kadrze, 26 337 meshy. Tokeny jednostek: 203 widoczne x 74-75 dzieci = 19 488 meshy (ok. 96 draw calli na jednostke); modele miast 88 x 65 = 5 704; nakladki tabliczek 1 648. Swieza gra: 707 calli, bo 1 miasto i 1-2 jednostki. Czyli draw calle rosna liniowo z liczba jednostek/miast. W SwiftShader klatka = 1,1-1,5 s (idle, pan), w tle blokuje glowny watek (long tasks).

## Naprawa (render, zero zmian stanu gry/AI)
- NOWY gra/src/render/smallPartLod.ts + hooki w units.ts (UnitRenderer.applySmallPartLod, licznik wersji tokenow), cities.ts (CityRenderer.applySmallPartLod), main.ts (wywolanie obok setZoomLod): mesze o srednicy rzutu < 3 px chowane (visible=false), przywracane przy zblizeniu; przeliczenie tylko przy zmianie kubelka odleglosci (~12%) lub zestawu modeli, nie co klatke. Pomijane: tabliczka (unitStatPlate), renderOrder != 0, InstancedMesh, ukryte korzenie. Picking (Raycaster) ignoruje visible.
- main.ts: shadow pass podczas animacji ruchu odswiezany nie czesciej niz co koszt klatki (cap 500 ms, tylko gdy klatka z cieniem > 30 ms; galeria bez zmian).

## Pomiar PRZED -> PO (ten sam zapis, long tasks = czas klatki glownego watku, ms; SwiftShader, load avg 4-8, n z jednego przebiegu)
| scenariusz | przed min/med/max | po min/med/max |
|---|---|---|
| draw calls (max oddalenie) | 28 881 | 5 255 (5,5x) |
| idle | 802/1278/1476 | 60/67/100 (19x) |
| pan kamery | 53/1278/1932 | 52/78/175 (16x) |
| ruch jednostki (animacja, dist 40) | 1387/2276/3487 | 52/1646/1918 (1,4x) |
| wybor jednostki | 51/1997/8748 | 67/1145/3716 (1,7x) |
| wejscie do miasta | NIE_ZMIERZONO (timeout) | 50/65/107 |
| panel miasta | NIE_ZMIERZONO (timeout) | 52/63/1147 (2 outliery = kompilacja shaderow) |
Wniosek: kamera/idle/wejscie/panel plynne; ruch i wybor jednostki NADAL ciezkie (SwiftShader: ok. 3,9-4,7 tys. calli w kadrze dist 40 po zaznaczeniu, ~4 s pierwszej klatki z cieniem = kompilacja programow). Czego nie rozstrzygniono: realny koszt na GPU (brak GPU w srodowisku).

## (b) Liczniki wywolan (evidence/r3-perf-after-callcounts.log.txt)
Wybor jednostki (7 klikow): updateHud 1, refreshFog 1, refreshTerritoryBorderOverlay 1, syncUnitsRender 2, buildHudState 16 (!). W refreshFog-x15: buildHudState 105 (7 na pipeline). Kandydat na duplikat: buildHudState wolany wielokrotnie na jedno odswiezenie. NIE zbito (brak dowodu braku mutacji miedzy wywolaniami). Dla ruchu/wejscia/panelu liczniki puste ({}) - ruch idzie sciezka bez tych funkcji lub licznik nie trafil; NIE_ZMIERZONO.

## NIE zrobione w R3 (uczciwie)
(c) koalescencja duplikatow; (d) refreshFog >= 5x (zostaje ok. 3,9-4,4x: 197 ms/call po vs 872 przed); (e) skalowanie z numerem tury / zasiew historii; (f) test rownowaznosci domkniec main.ts; profil JS/render per klik z >=7 powtorzen ma tylko pojedynczy przebieg (min/med/max z 22-93 klatek, nie z N przebiegow); endTurn nie mierzony ponownie.

## TESTY (evidence/gate-r3-*.txt, linia EXIT=)
tsc --noEmit EXIT=0; small-part-lod-test (nowy) 16/0; perf-hud-q2-test 23/0; unit-renderer-overlay-sync 17/0; okolica-test 72/72; territory-border 9/0; hud-skarbiec 34/0; ai-test 274/20 (te same FAIL). Chromium: tylko harness perf (bez testow *-real-render*).

## ZMIANY/COMMIT
gra/src/render/smallPartLod.ts (nowy), gra/src/render/units.ts, gra/src/render/cities.ts, gra/src/main.ts; gra/tools/small-part-lod-test.cjs (nowy), gra/tools/perf-late-game-interaction-live-test.cjs (haki diagnostyczne, liczniki); ten katalog. Baza: 9ea18d2ef + merge origin/main (756f1fc8e). SHA commitu: 4504dbd240581bd8abac236ace67bff42b98a1eb (galaz claude/perf2-r3, bez push).
Ryzyko wizualne do oceny Evaluatora: przy max oddaleniu drobne czesci figurek/miast < 3 px znikaja (bez screenshotu w tej rundzie - NIE_ZMIERZONO wizualnie).

BLOKADY: brak (DO DECYZJI: prog 3 px - czy akceptowalny).
RUNDY: 3/5
NASTEPNY KROK: Evaluator R3 (przeglad LOD + screenshot far/near), potem kolejna runda Operatora: buildHudState duplikaty, ruch/wybor (cien, ~4k calli w kadrze), refreshFog do 5x, skalowanie z tura.
DEPLOY/PUSH: NIE WYKONANO
