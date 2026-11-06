STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
ROLA: Operator (obrona), odpowiedz na zarzuty Evaluatora do 52d92bd71

Z1 (GOAL >=5x): ODRZUCAM jako brak dowodu poprawki w tej rundzie, PRZYJMUJE stan faktyczny. updateHud 5,4x osiagniete; refreshFog 3,9x i endTurn 1,1x NIE osiagniete. Brak nowych pomiarow Chromium w tej rundzie (patrz Z6), wiec liczby sie nie zmieniaja. Dalsze skracanie (assignWorkedTiles/previewCityEconomy, buildEmpireResourceRows, refreshMinimap, renderBar) wymaga profilu CDP -> NIE_ZMIERZONO, runda 2 pomiarowa.
Z2 (koalescencja rAF): ODRZUCAM z dowodem strukturalnym. refreshFog ma 67 wywolan, refreshD1bHud 146; pomiedzy refreshFog() a nastepnym updateHud() w wywolujacych kodzie zwykle zachodzi mutacja stanu (flagi, panel, zaznaczenie), wiec bezpieczne zbicie "drugiego" wywolania wymaga dowodu braku mutacji na kazdym z ~200 miejsc; rAF zmienia semantyke synchroniczna (testy Playwright czytaja DOM zaraz po akcji). Bez pomiaru zysku to ryzyko bez uzasadnienia. Nie wprowadzono. Alternatywa na runde pomiarowa: licznik wywolan/klik, potem selektywne zbicie.
Z3 (ruch/wejscie do miasta/panel, zaleznosc od tury): PRZYJMUJE — NIE_ZMIERZONO pozostaje. Nie odtworzono w tej rundzie (Chromium + vite build + load average ~13 na 4 rdzeniach; nie ma sensu bez najpierw wyjasnienia renderInfo.calls 28 881 po wczytaniu zapisu). Wymaga osobnej rundy.
Z4 (luka testowa): PRZYJMUJE. Wydzielono logike z closure main.ts do czystych modulow: src/map/territory-border-cache.ts (territoryBorderInputsEqual) i src/game/owner-scope.ts (createOwnerScope: withScope/scoped). main.ts uzywa ich zamiast wbudowanych wersji (zachowanie identyczne). perf-hud-q2-test.cjs: 8 -> 23 testow (7 przypadkow rownowaznosci pomijania granic: null/identyczne/dodany heks/podmieniony heks przy tym samym rozmiarze/zmiana koloru/usuniety i zastapiony owner; 7 dla ownerScoped: poza zakresem zawsze liczy, raz na (tag,owner), zagniezdzony zakres, zamkniecie po wyjsciu i po wyjatku, kontrakt kopii przed mutacja jak dla empireLivestockUnlocks). Numeracja naglowka naprawiona (pkt 5 dodany). Pozostaje NIE_ZMIERZONO: E2E dla productionAvailabilityCtxForCity i cityResourceAccessForCityId(activeOnly) w closure main.ts (active-only pokryte testem getResourceAccessForCity == ...active).
Z5 (memo rzek): PRZYJMUJE. Klucz rozszerzony o skrot wspolrzednych punktow (O(punkty), bez alokacji) — podmiana punktu w miejscu bez zmiany liczby uniewaznia wpis (test dodany). Typ zwrotny zawezony do ReadonlySet<string>; tsc 0 bledow (zaden wolajacy nie mutuje).
Z6 (szum pomiarow): PRZYJMUJE. Rozrzut best-of-N nie byl raportowany; w tej rundzie nie dodano nowych pomiarow wydajnosci. Wartosci endTurn 1,1x traktowac jako nieroznialne od szumu.

ZMIANY: gra/src/map/territory-border-cache.ts (nowy), gra/src/game/owner-scope.ts (nowy), gra/src/main.ts, gra/src/map/improvement-build.ts, gra/tools/perf-hud-q2-test.cjs, ten raport + evidence/gate-r2-*.txt.
TESTY (evidence/gate-r2-*.txt, EXIT=0): tsc --noEmit; perf-hud-q2 23/0; territory-border 9/0; territory-border-dense-settlement 15/0; okolica 72/72; okolica-multi-city-overlap 55/55; hud-skarbiec 34/0; irrigation-river-definition-unify 30/0; auto-improvements 46/0. Brak zmian gry; bez Chromium w tej rundzie.
BLOKADY: Z1/Z3 NIE_ZMIERZONO/niedomkniete (Chromium); Z2 odrzucone.
RUNDY: 2/5
NASTEPNY KROK: Evaluator; runda pomiarowa CDP (licznik refreshFog/updateHud na klik, renderInfo.calls po wczytaniu zapisu, previewCityEconomy).
DEPLOY-PUSH: NIE WYKONANO
