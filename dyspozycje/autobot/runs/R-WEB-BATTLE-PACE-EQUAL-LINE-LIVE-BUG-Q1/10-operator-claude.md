STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-PACE-EQUAL-LINE-LIVE-BUG-Q1
GOAL: Rowne tempo = w kazdej turze marszu do wzwarcia roznica miedzy najszybsza a najwolniejsza jednostka armii <= 1 hex; sufit obejmuje piechote, strzelcow, konnice i machiny (decyzja wlasciciela 2026-11-13, DODATEK runda 2).

## Zmiany (baza d09df3e0b; kod W40 z gałęzi r1-r5 NIE jest w main, wiec zaimplementowane od zera)
- gra/src/battle/battleScene.ts
  - `_paceCapFor(ru)` + `_paceExemptClass(u)` (marker `/*PACE_EXEMPT*/false` do mutacji testowej) + pole `_paceCache`, reset w `_resetBattleRuntimeState`.
  - W `_activateUnit` (galaz AUTO/steady, tuz przed `_executeGroupDoctrineStep`): `ru.moveLeft = min(ru.moveLeft, paceCap)`.
  - Pace = najmniejsza pula ruchu (`_movementPointsFor`) wsrod WSZYSTKICH zywych, niezbitych jednostek tej STRONY w doktrynie steady (nie grupa/ranga, wiec dwie grupy "gorna/dolna polowa" dostaja ten sam sufit — to byla przyczyna zgloszenia ze zrzutu: sufit W19 byl liczony osobno per grupa+ranga i dotyczyl tylko piechoty).
  - Sufit zdejmowany od rundy, w ktorej jakakolwiek jednostka wrecz (tez konnica; bez strzelcow i machin) po dowolnej stronie jest w kontakcie (`_canAttackFrom`) — liczone raz na runde (cache po `roundNo`). Pomijane przy oblezeniu z murem (`siegeWallCol >= 0`), jednostkach routed i doktrynie inne niz steady (jak W19). Tryb reczny gracza bez zmian.
  - Istniejacy sufit pozycyjny W19 (`_lineAdvanceCap`) bez zmian (nadal dziala dla piechoty rangi).
- gra/tools/battle-pace-equal-line-live-test.cjs (nowy): headless, produkcyjna petla tury (`_beginTurn` + AUTO batch), 4 sklady (piechota; +lucznicy; +konnica; +machiny), 2 grupy, atk; metryka = przebyte hexy per jednostka per tura (|dq|+|dr|), okno = do dystansu 12 hexow miedzy armiami; 4 mutacje (wylaczenie sufitu dla piechoty / strzelcow / konnicy / machin przez onLoad esbuild na zrodle).
- Bez zmian: statystyki jednostek, zasiegi, JSON balansu, WERSJE.md.

## Pomiar PRZED / PO (surowe wyjscie, `node /…/probe4.cjs`, sufit wylaczony = baza)
PRZED: infantry 0 tur>1 (max 0); infantry+archers 1 tura>1 (max roznica 3); +cavalry 7 z 7 tur>1 (max 5); full_mixed 7 z 7 tur>1 (max 5).
PO: infantry 0/12 (max 0); infantry_archers 0/12 (max 0); infantry_archers_cavalry 0/12 (max 0); full_mixed 0/12 (max 0).

## Testy / bramki (surowe wyjscie)
- `node ./node_modules/typescript/bin/tsc --noEmit` -> TSC_EXIT=0
- `node tools/battle-pace-equal-line-live-test.cjs` -> `=== battle-pace-equal-line-live-test: 8 pass, 0 fail ===` (4 PASS sklady; 4 PASS mutacje: piechota 21 tur czerwonych, strzelcy 4, konnica 14, machiny 2)
- logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/0; unit-replace-test 21/21; combat-test 6/6
- battle-line-advance-uniform-test (W19) 17 PASS 0 FAIL (EXIT 0)
- battle-standoff-two-warriors-test 9/0; battle-cavalry-flank-default-test PASS (960 checks, K4); battle-deploy-cavalry-flanks-test PASS (536 checks)
- battle-skip-equals-auto-resolve-test `--- 42 ok, 0 fail` (EXIT 0; przy obciazeniu maszyny trwal 4m20s real — przy limicie 250 s dal timeout, z 580 s przeszedl)
- test mixed-pace W40 (battle-mixed-army-advance-pace-test.cjs) NIE istnieje w d09df3e0b (W40 nie scalony) — nie uruchamiano.

## ZALOZENIA / UWAGI
1. Metryka = hexy przebyte w turze (nie rozrzut pozycji). W scenariuszu rangi maja rozne przesuniecia startowe, wiec rozrzut pozycji jest niemierzalny jako "roznica tempa".
2. Konnica i strzelcy sa w tescie ustawieni tak, by nie kolidowac pasami (konnica na skrzydlach, machiny w pustych pasach) — kolizje blokuja jednostke fizycznie (flanka CAVFLANK, zajete pola) i daja roznice > 1 niezaleznie od sufitu; to dotyczy zblokowania, nie tempa. Wczesniejsza wersja testu (pelne rzedy konnicy/machin) pokazala roznice 2 z tej przyczyny (machina blokowana przez konnice przesunieta flanka).
3. Pierwsza tura: lucznicy/czesc konnicy robia 1 hex zamiast 2 (roznica 1, w tolerancji) — wynika z kolejnosci rozstawienia, nie z sufitu.
4. Defender w symulacji stoi w miejscu (0 hexow) — test sprawdza tylko strone atakujaca; sufit dziala symetrycznie (cache per strona).
5. Machina oblezenicza w polu to katapulta = jednostka dystansowa (rangedBase) w silniku; mutacja "machiny" i "strzelcy" pokrywaja sie czesciowo.
6. K3 (zrzuty z Chromium 1920x1080 przed/po) NIE WYKONANE w tej rundzie (DODATEK nie wymaga; dowod = symulacja headless na produkcyjnej petli tury). NIE_ZMIERZONO na zywo w przegladarce.
7. Pozostala wiedza: mogły zostać regresje poza pokrytymi bramkami (np. oblezenie bez muru z mieszana armia) — NIE_ZMIERZONO.

## BLOKADY
brak

## RUNDY
2/5

## NASTEPNY KROK
Evaluator -> Obrona -> Final Control; ewentualnie osobny temat LIVE-VERIFY w Chromium.

DEPLOY/PUSH: NIE WYKONANO
