STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PALISADE-BATTLE-WALL-RULES-Q1
GOAL: Runda 2: R4 wiezyczki strzeleckie co 4 kafle obwodu przy PALISADZIE i MURZE (automatycznie, za darmo, moc = najmocniejsza jednostka dystansowa epoki wlasciciela, ostrzal w bitwie o miasto, gracz i AI, log) + model palisady w widoku bitwy + testy i zrzuty. Reguly R1-R3 bez zmian.
ZMIANY/COMMIT: 3469dc3a4 (baza e0b20f430; PUSH NIE). Pliki:
- NOWY gra/src/game/city-towers.ts (czyste funkcje: towerRows, towerMaterialFor, strongestRangedUnitForEra, towerRangeFor, pickTowerTarget, aliveTowerRows).
- gra/src/battle/battleScene.ts: `fortKind` (cityFortificationKind), `_placeSiegeTowers`, `_fireSiegeTowers` (wolane w `_beginTurn`, 1 strzal/ture/wiezyczke), `_fireOneTower` (strzal = `_singleBlow(shooter, target, true)` ze statystykami jednostki epoki obroncy, pocisk + log), `_destroyTowerAtRow` w `_breachWallTile`; `_placeSiegeWall` przekazuje `kind` (palisada/mur).
- gra/src/battle/siegeWall.ts: `kind` w SiegeWallOpts, `buildPalisade` (zaostrzone pale, 2 rzedy, wal, pomost, brama z bali; ten sam kontrakt wyłomu per-kafel), `buildWallTower('drewno'|'kamien')`.
- gra/data/miasto-params.json: nowe klucze `wieze_strzeleckie_odstep_kafli`=4, `wieze_strzeleckie_zasieg_min`=2.
- gra/src/main.ts: tylko playtest oblezenia `?fort=palisada` (domyslnie mury jak dotad).
- NOWE gra/tools/city-wall-towers-test.cjs, gra/tools/palisade-towers-live.cjs; zrzuty i gate-r2b-* w katalogu runu.
TESTY:
- tsc --noEmit EXIT=0 (gate-r2b-tsc.txt).
- RED przed: city-wall-towers-test na bazie e0b20f430 EXIT=1 (brak city-towers.ts; gate-r2-wieze-test-RED-przed.txt). GREEN po: 59 OK / 0 FAIL, EXIT=0 (gate-r2-wieze-test.txt): rozmieszczenie (39 wiezyczek/156 kafli, brama wycina), material (palisada=drewno, mur=kamien, mur zastepuje palisade, sama Baszta=0), moc (Kamien=Oszczepnik 4; Braz=Procarz; Egipt/Kamien=Lucznik egipski 6; Zelazo egipt=Lucznik nubijski), zasieg min 2, cel, wyłom usuwa wiezyczke, palisada==mur mechanicznie; 11 pinezek zrodlowych x mutacja; 8 mutacji logiki (re-bundle) wszystkie wykryte.
- Regresja R1 (r1-testy): palisade-battle-wall-rules 52 OK, city-siege-wall-rules 50 OK, oba EXIT=0.
- Regresja 52 testow battle/siege/wall/combat/city-defense PRE (e0b20f430) vs PO: identyczne rc/F/O poza endturn-battle-deadlock-exec-test (pre rc=1 przy rownoleglym obciazeniu, po rc=0; nie regresja). PO rc!=0: 7 testow = te same co PRE (srodowisko, jak w r1) (gate-r2b-regresja-pre-vs-po.txt).
- DOWOD ZYWY Chromium (gate-r2b-live-chromium.txt): PO palisada i PO mury: 39 wiezyczek, strzelec Oszczepnik (epoka 1), zasieg 2; atakujacy 2 kafle przed murem oberwal od wiezyczki ("Wieza (Oszczepnik) trafia Hastati za 1", HP 38->37), 0 bledow JS.
- ZRZUTY (zrzuty-r2/, <= 480 KB): przed-{palisada,mury}-{daleko,blisko}.png (PRZED: palisada rysowana jako kamienny mur, brak wiezyczek), po-palisada-* (drewniane pale + drewniane wiezyczki), po-mury-* (kamienny mur + kamienne wiezyczki).
BLOKADY: brak blokad technicznych. NIE ZROBIONE / NIE_ZMIERZONO:
1. Zrzut i modele na MAPIE swiata (`miasto-kamien.ts`): mapa juz ma model palisady (wallKind, r1); wiezyczki R4 istnieja tylko w scenie bitwy (tu jest obwod muru). Zrzut mapy PRZED/PO NIE WYKONANY.
2. Ostrzal wiezyczek NIE jest liczony w sciezkach rozstrzygania automatycznego ("Pomin"/computeInstantResult, executeSilentSiegeStorm/Auto w main.ts) -- tylko w bitwie taktycznej (gracz i AI). NIE_ZMIERZONO wplywu na balans Auto.
3. Wiezyczki mierzone w jednej epoce (era 1) w zywej scenie; dla epok 2-3 tylko funkcja czysta.
ZALOZENIA (do akceptacji): obwod = linia muru/palisady w scenie bitwy (wiersze 0..155, pierwsza wiezyczka na rzedzie 2, co 4; 39 szt.); "tura" = tura bitwy (wiezyczki obroncy strzelaja raz na ture, na poczatku rundy, do jednego najblizszego atakujacego w zasiegu, remis -> najmniej HP); strzelec = Rola (linia) "Dystans" (bez machin/jazdy), jednostki narodowe tylko dla swojej nacji, remis mocy -> dluzszy zasieg; gdy w epoce brak strzelca (Zelazo generyczne) -> najlepszy z epok wczesniejszych (Procarz); wiezyczka stoi na zewnatrz muru (strona atakujacego), wyłom kafla ja burzy; model proceduralny, bez plikow binarnych.
DECYZJA_WYMAGANA (bez zmian, domyslne zalozenie): wieza oblezna w bitwie taktycznej nie liczy sie jako wyłom, w Auto/"Pomin" tak (r1) -- pozostawione, nie ruszane.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2 (weryfikacja R4: _fireSiegeTowers/_fireOneTower, wyłom, zrzuty), potem decyzja o zakresie mapy swiata i Auto.
DEPLOY/PUSH: NIE WYKONANO
COMMIT: 3469dc3a4 (worktree branch worktree-wf_f1df033c-b59-1)
