STATUS: PASS
DOMAIN: GAME
TEMAT: P-BRAMKA-EMPIRE-OBYWATELE-TRADE-SNAP-Q1
GOAL: Przekotwiczyc test empire-panel-miasto-obywatele-content-test.cjs na dzisiejszy ksztalt
kodu (side.myCityId / premiaBudynkuPerSide) po decyzji wlasciciela z rundy 1, bez oslabienia
dowodu (zero duplikatu formuly premii, cityId nadal ze zrodla trasy, nie halucynowany).
ZMIANY/COMMIT: gra/tools/empire-panel-miasto-obywatele-content-test.cjs (brak commita — praca
w toku, do integracji po Evaluator/Final Control). Asercja 1 (linia ~223): zamieniona kotwica
'cityId: r.fromCityId,' / 'cityName: myCity?.name ?? r.fromCityId,' na 'cityId: side.myCityId,'
/ 'cityName: myCity?.name ?? side.myCityId,' + DODANA nowa asercja potwierdzajaca, ze
side.myCityId pochodzi z realnego rozgalezienia (r.ownerId===0 ? r.fromCityId : r.toCityId),
nie z literalu. Asercja 2 (linia ~229): zamieniona kotwica na literalny dwuwiersz
'const premiaBudynkuPerSide = tradeRouteBuildingBonusForRoute(r, incomeParams);' +
'const premiaBudynku = bothPlayer ? premiaBudynkuPerSide * 2 : premiaBudynkuPerSide;' —
potwierdza realne wywolanie silnika (trade-routes.ts), zero duplikatu wzoru, ×2 tylko dla
trasy wewnetrznej (R2-2). Zero zmian w gra/src/**, gra/data/**, docs/**.
TESTY: node tools/empire-panel-miasto-obywatele-content-test.cjs -> 116/116 (bylo 113/2 przed
zmiana; +1 asercja netto, zero oslabienia). npx tsc --noEmit -> czysto. 5 bramek referencyjnych:
logic-test 213/213, tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13,
combat-test 6/6 — wszystkie zielone.
BLOKADY: brak.
RUNDY: 2/5.
NASTEPNY KROK: Evaluator sprawdza semantyke nowych kotwic i brak oslabienia dowodu, nastepnie
Final Control i integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
