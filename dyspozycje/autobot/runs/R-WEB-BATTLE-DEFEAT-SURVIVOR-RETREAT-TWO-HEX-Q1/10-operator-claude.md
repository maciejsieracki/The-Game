STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1
GOAL: ocalali przegranej strony w bitwie W POLU cofaja sie o 2 heksy (nie gina, HP/general/doswiadczenie zachowane); W MIESCIE/oblezeniu gina jak w bazie 261e736de (decyzja wlasciciela 2026-11-11, DODATEK 3).
ZMIANY/COMMIT: baza kandydat c5dd4a21f (r1) + zmiany r2 (SHA w polu sha wyniku workflow).
  - gra/src/game/post-battle-map.ts: bramka `cityBattle = !!cityOnBattleHex`; w miescie (a) odwrot 2 heksow wylaczony (twoHex opcjonalny -> undefined), (b) z manualSurvivors odfiltrowani ocalali PRZEGRANEJ strony (zachowanie bazy: nie wracaja na mape), `wipeDefenderOnCityCenter` bez zmian. Remis bez zmian.
  - gra/src/battle/battleScene.ts: `_mapExportRoster(winner)`: pole = obie strony, miasto (`isCityDefenseBattle`, w tym `opts.siege`) = tylko zwyciezca; uzyte w _endBattle, _ffRoundCapResult i computeInstantResult (parametr isCityDefense). `_finishDraw` bez zmian.
  - gra/src/main.ts: po applyPostBattleMap odkrycie mgly gracza wzdluz odwrotu (revealAlongPathForStack dla retreatedTwoHexIds) -- domkniecie blokady FC nr 1.
  - gra/tools/mgla-sciezka-inwariant-test.cjs: 2 wpisy KLASYFIKACJA (`u.q = q2;`/`u.r = r2;`, WIELOHEKS-HAK-ZEWNETRZNY) z uzasadnieniem (odkrycie w main.ts); inwariant nieoslabiony.
  - gra/tools/battle-defeat-survivor-retreat-two-hex-test.cjs: testy 12/13 przepisane (miasto: przegrani gina, brak odwrotu), nowe 13b (AUTO w miescie), 13c (kontrola pola), BS: _mapExportRoster.
  - gra/tools/battle-undeployed-units-test.cjs: asercja pola (rezerwa cofa sie ze stosem) zostaje TYLKO dla pola; nowy 3b: miasto -> rezerwa zostaje na hexie startowym (10,10), oryginalna asercja.
  - gra/tools/battle-defeat-survivor-retreat-browser-{entry.ts,test.cjs}: ziarno PRNG (?seed, domyslnie 12345), obsluga remisu (nie jest przegrana), siege = bitwa w miescie z cityOnBattleHex -> przegrani NIE wracaja na mape.
TESTY (surowe wyjscie):
  tsc --noEmit: czysto. battle-defeat-survivor-retreat-two-hex 44/0; mutacje: cityBattle=false -> 39/5 FAIL (12,13,13b) + undeployed 35/2 FAIL; _mapExportRoster bez bramki miasta -> 42/2 FAIL (czerwone->zielone).
  Chromium (CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome, Vite HTTP) 3 kolejne przebiegi: BROWSER PASS x3, identyczne wyniki (field/skip obronca, przegrani HP>0 stoja 2 heksy; siege/skip atakujacy: defOnMap 0, loserOnMap 0; instant; cap).
  undeployed 37/0, post-battle-map 32/0, siege-defenders 12/0, oblezenie-siege-lifted 16/0, oblezenie-remis-endsiege 271/0, dead-units-removed PASS, dead-unit-disappearance PASS, logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, map-field-battle 24/0.
  mgla-sciezka-inwariant: 41/1; jedyny FAIL = pre-istniejacy main.ts:28778 (city.q w generatorze miast) -- identycznie jak baza (41/1, 1 trafienie); nowe zapisy sklasyfikowane, 0 dodatkowych trafien.
  merge-tree z origin/main: patrz nizej (sprawdzone po commicie).
ZALOZENIA: (1) bramka w miescie = cityOnBattleHex (heks bitwy = miasto: szturm, obrona, oblezenie) po stronie mapy oraz isCityDefenseBattle po stronie sceny; obie niezaleznie przywracaja zachowanie bazy. (2) Oblegajacy (oblegaCityId) w bitwie W POLU nadal zostaja na pozycji blokady (noRoute) -- zachowanie ograniczen blokady; w miescie nieistotne. (3) Odkrycie mgly po odwrocie: dwupunktowa sciezka (heks bitwy, cel). (4) Test Chromium siege konczy sie wygrana atakujacego, wiec dowod "przegrani w miescie nie wracaja" dla defOnMap=0 jest dodatkowo pokryty testem jednostkowym 13 (przegrany atakujacy w miescie).
BLOKADY: brak.
RUNDY: 2/5
NASTEPNY KROK: Evaluator -> Obrona -> Final Control.
DEPLOY/PUSH: NIE WYKONANO
