STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-TOWER-BREACH-EVERYWHERE-Q1
GOAL: Wieza oblezmicza = wylom wszedzie (takze w bitwie taktycznej): atakujacy wchodzacy wieza na mur/palisade otwiera miasto do zdobycia bez taranu/katapulty; bez wiezy i machin nadal brak zdobycia (R1).

## Rozbieznosc (zadanie 1)
- Auto/„Pomin"/szturm: kazda machina (Rola "Oblężnicza", w tym wieza) = wylom: `gra/src/game/unit-power.ts:85` isSiegeUnit, `gra/src/main.ts:31621,33272,33533` autoStormBreach(...), `gra/src/battle/battleScene.ts` skip() (`this.atk.some(u => !u.dead && isSiegeUnit(u.bu))` => `wallEverBreached = true`).
- Bitwa taktyczna (stan zastany): `wallEverBreached` ustawiane TYLKO w `_breachWallTile` (kafel muru zburzony) i `_breachGate` (brama). Wspiecie piechoty po wiezy (`_activateUnit`, blok "CLIMB via SIEGE TOWER": `ru.onWallWalkway = true`) NIE ustawialo flagi => wynik `BattleResult.wallBreached=false` (onFinish) => main.ts:33535 `canCaptureCity(...)` blokowal zdobycie; melee dalej zablokowane przez R2.

## Zmiany (zadanie 2)
- `gra/src/game/city-fortification.ts`: nowa czysta `attackerWallEntryIsBreach(side, onWallWalkway)` (true tylko dla atakujacego na koronie) + opis R5.
- `gra/src/battle/battleScene.ts`: import + w bloku wspinaczki po `ru.onWallWalkway = true` ustawienie `wallEverBreached = true` (+ wpis w logu "WYLOM: atakujacy weszli na mur po wiezy..."). Dzieki istniejacemu okablowaniu wynik bitwy niesie `wallBreached`, wiec main.ts (szturm gracza/AI/barbarzyncy: `res.wallBreached ?? autoStormBreach`) i `post-battle-map` (hold) dzialaja bez zmian; po wylomie melee bije obroncow z muru (R2).
- Bez zmian: main.ts, post-battle-map.ts, wiezyczki strzeleckie (R4), bonusy obrony, Milicja, dane. Obronca na koronie nie jest wylomem.
- Nowy test: `gra/tools/siege-tower-breach-everywhere-test.cjs`.

## Testy (zadanie 3)
- Nowy test PRZED (baza origin/main 86d510c66, STB_SRC): `gate-red.txt` EXIT=1, 23 ok / 10 fail (API R5, pinezka C4, B4-B7 mur i palisada: brak wylomu po wspieciu, miasto nie do zdobycia, melee nadal zablokowane, brak wpisu logu).
- Nowy test PO: `gate-green.txt` EXIT=0, 47 ok / 0 fail: czesc A (prawdziwe funkcje, parytet Auto==taktyka, 3 mutacje funkcji => czerwono), czesc B (prawdziwa BattleScene w Chromium `/opt/pw-browsers/chromium`, ?playtest=oblezenie-duze, mur i palisada: realna aktywacja wiezy -> wspinaczka -> wallEverBreached -> canCaptureCity=true; kontrola bez wiezy: brak wspinaczki, brak wylomu, miasto nie do zdobycia, R2 blokuje melee; mutacja sceny => czerwono), czesc C (pinezki Auto/skip, mutacja pinezki). Zrzut: `zrzut-wspiecie.jpg`.
- Zalozenie (luka): playtest nie ma wiezy w skladzie, wiec w scenariuszu "tower" Taran jest przemianowany w danych jednostki na "Wieża oblężnicza", a doktryna auto/tryb reczny wylaczone (`_isUnitDoctrineAuto`, `_manualMode`) zeby aktywacja doszla do kodu wspinaczki; sam kod sceny (isSiegeTower, towerAtWallRows, climb) jest prawdziwy.
- Regresje PO (wszystkie EXIT=0): palisade-battle-wall-rules, city-siege-wall-rules, city-wall-towers, siege-ai, siege-defenders, map-siege, post-battle-map, militia-garrison-router-siege, oblezenie-remis-endsiege, oblezenie-siege-lifted-po-bitwie, wall-defenders-bonus-range (55 ok, bez mutacji), battle-roster, battle-summary, battle-formation-rules, battle-melee-attack-doctrine, auto-battle-power. Zadnego testu nie trzeba bylo zmieniac (zaden nie kodowal starej reguly). Pomiar PRZED dla regresji: NIE_ZMIERZONO (brak failow PO, wiec nie potrzebny).
- tsc `--noEmit`: `gate-tsc.txt` EXIT=0.

## BLOKADY: brak
## RUNDY: 1/5
## NASTEPNY KROK: Evaluator (weryfikacja niezalezna; ewentualnie dowod UI przegladarkowy w pelnym playtescie szturmu z wieza, NIE_ZMIERZONO tu: pelny przebieg tury AI/barbarzyncow nie byl uruchamiany, tylko sciezka wallBreached sceny + pinezki main.ts).
## DEPLOY/PUSH: NIE WYKONANO

COMMIT: dd408d1c185ef0426b5d7df5f1feabfd04f90139 (kod + test + logi + ten raport; baza origin/main 86d510c66, detached worktree)
