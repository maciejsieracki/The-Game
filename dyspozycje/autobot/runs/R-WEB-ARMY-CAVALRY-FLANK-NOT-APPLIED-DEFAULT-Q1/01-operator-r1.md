STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-CAVALRY-FLANK-NOT-APPLIED-DEFAULT-Q1
GOAL: konnica i rydwany domyślnie na skrzydłach linii (nie na przodzie), piechota w centrum, łucznicy za; dotyczy gracza i AI.

## Diagnoza (zmierzona testem na kodzie sprzed poprawki)
Poprzedni temat (CAVFLANK, FALA 554) naprawił tylko SLOTY idealne (`initialBattleSlots`), a jego test używał terenu bez przeszkód (samo Plains). W `BattleScene._placeUnits` (oraz `_placeUnitsOneSide` = Reset deploy) slot idealny jest potem korygowany przez `tileScore`:
1. Premia terenu (Plains +40, Forest -15) przewyższała karę 2/kolumnę, więc na terenie z lasem/wzgórzem/rzeką/skałami wing-horse odsuwał się nawet ~10 kolumn od slotu, a pętla szukała w obu kierunkach (`idealCol - extra*rankStep` = DO PRZODU) -> konnica lądowała przed linią (objaw właściciela). Zmierzone: nowy test na starym kodzie: "m3 at col 32 is ahead of the body front" (teren 'scattered').
2. Pasmo wierszy skrzydła (`wingRowLo/Hi`) sięgało od slotu do wiersza środkowego mapy, czyli WCHODZIŁO w wiersze korpusu -> koń mógł stanąć w środku linii zamiast na skrzydle.
3. Klasyfikacja roli: jednostki `Typ: Mount` o nietypowej nazwie/kategorii 'super' nie były gwarantowanie 'mounted' (tylko nazwa/kategoria).

Pozostałe punkty dispatchu: (a) auto/skip nie rozmieszcza (bez pozycji); rozmieszczenie = `_placeUnits` dla obu stron (gracz i AI jedną ścieżką); (b) Rydwany i Konnica to jedna rola 'mounted' - OK; (d) powyżej limitu linii skrzydła rozszerzają się w głąb (rank) - OK; (e) domyślne `_deployCavalryMode='flanks'` jest używane dopiero po kliknięciu F1/F2/F3; start używa `initialBattleSlots` (zawsze skrzydła). Plik gra/data/battle-params.json nie istnieje - NIE zmieniano.

## ZMIANY
- gra/src/battle/battleScene.ts: `_placeUnits.place()` - dla mounted: mała premia terenu (+6/+3/-4), kandydaci kolumn tylko ku tyłowi (nigdy przed slot), pasmo wierszy ograniczone do zewnątrz zakresu wierszy korpusu (zewn. do 6 wierszy); `_placeUnitsOneSide` - to samo pasmo wierszy; `isMounted` - dodatkowo `Typ === Mount`.
- gra/src/battle/formationRules.ts: `classifyInitialBattleRole` - `type === 'mount'` => mounted.
- gra/tools/battle-cavalry-flank-default-test.cjs (nowy): rosterzy z realnymi nazwami (Konnica, Rydwan konny, Rydwan egipski [super], Jeździec chiński, Konnica łucznicza asyryjska), teren plains / cały las / rozproszony (las, wzgórza, rzeka, skały), deploy on/off, obie strony; asercje: koń nigdy przed frontem korpusu, >=70% koni na skrzydle (poza zakresem wierszy korpusu), oba skrzydła używane.
Nie zmieniano: WERSJE.md, gra-robocza/; brak build/dev, brak git add -A.

## TESTY
- battle-cavalry-flank-default-test.cjs: FAIL na starym kodzie (teren scattered), PASS po poprawce (480 asercji).
- battle-deploy-cavalry-flanks-test PASS (536), battle-flank-close-formation-test PASS (994), battle-undeployed-units-test PASS 35/0, battle-formation-rules-test PASS, battle-initial-placement-runtime-test uruchomiony (koniec bez błędu), battle-cap-500-test PASS 59 asercji (rozstawienie 500v500: plains 518 ms, obstacles 477 ms).
- Chromium / weryfikacja wizualna w żywej grze: NIE_ZMIERZONO (brak przeglądarki; node_modules w worktree brak - testy uruchomione przez esbuild+three zainstalowane poza repo w scratchpadzie, symlink usunięty).
- tsc / vite build: NIE URUCHOMIONO (zakaz build/dev w gra/).

## BLOKADY
Brak. Uwaga: "skrzydło" w teście liczone względem zrealizowanych pozycji korpusu (korpus też bywa przesunięty przez teren), stąd próg 70%.

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator (zwłaszcza weryfikacja wizualna w Chromium na terenie z lasem); wpis LEDGER (REPIN Rust: wybór kolumn/wierszy skrzydeł mounted w rozstawieniu).

DEPLOY/PUSH: NIE WYKONANO
