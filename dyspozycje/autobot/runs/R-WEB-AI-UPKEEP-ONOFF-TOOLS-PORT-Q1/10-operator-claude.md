STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/INFRA (tylko gra/tools + raport)
TEMAT: R-WEB-AI-UPKEEP-ONOFF-TOOLS-PORT-Q1
GOAL: przenieść funkcje r3 narzędzia pomiarowego UPKEEP-ONOFF (metryka wojen per tura, licznik bramki utrzymania) na aktualną wersję narzędzia z origin/main (8bc385dee), bez utraty funkcji wersji z main (hak ledgerStats, tryb LEDGER-OFF, pole load1, RUN_START_TURN).
BAZA: origin/main = 8bc385dee3a41f11d79732abf3a043b6d9ec08f9 (FALA 784). Kandydat r3 = 6af3003f9 (runner r3 w ecab6d1f9).

ZMIANY/COMMIT:
- gra/tools/ai-economy-measure-run.cjs: na bazie wersji z main dodane funkcje warsInPage, collectWars (wojny per tura z __truceTestDebug.pairState; brak haka -> null), readGateStats i gateDelta (licznik __aiUpkeepGateStats; brak haka -> null). Wpięcie rec.wars i rec.upkeepGate w playOneTurn (zwykła tura i ścieżka z obejściem bramki). Eksport warsInPage i gateDelta.
- gra/tools/ai-economy-measure-hook-test.cjs: dodana asercja 0g (warsInPage na atrapie: 3 wojny, 1 z graczem, 2 AI-AI; brak haka -> null; gateDelta).
- NIE zmieniono gra/src, gra/data, WERSJE.md, manifestu ani innych plików narzędzi.
- Licznik bramki (window.__aiUpkeepGateStats) NIE został dodany do src: istnieje tylko w patchu evidence/r3/upkeep-gate-counter.patch w kopii kandydata r3. Zgodnie z dispatchem hak w src nie jest dodawany; runner zwraca upkeepGate = null (NIE ZMIERZONO).
- Commit: SHA w polu sha zwrotki orkiestratorowi (czubek tej pracy).

TESTY:
- node --check gra/tools/ai-economy-measure-run.cjs -> OK
- node --check gra/tools/ai-economy-measure-hook-test.cjs -> OK
- Test czysto-node helperów (require runnera, atrapa window): warsInPage z 3 wojnami -> {"active":3,"withPlayer":1,"aiAi":2,"pairs":[[0,3],[1,2],[2,3]]}; bez haka -> null; gateDelta({calls:10,blocked:3},{calls:14,blocked:5,flagOff:0,noTickData:1,allowed:8}) -> calls 4, blocked 2, noTickData 1, allowed 8; gateDelta(null,null) -> null. Zgodne z asercjami 0g.
- git diff --check -> czysto.
- NIE ZMIERZONO: smoke-test przebiegu 1 ziarno x 10 tur (oba tryby) oraz pełny hook-test z asercjami przeglądarkowymi: brak gra/node_modules i brak Chromium w tej sesji.
- NIE ZMIERZONO: tsc 0 (brak node_modules; zmiany dotyczą wyłącznie plików .cjs).
- NIE ZMIERZONO: czy narzędzie odtwarza liczby z raportu UPKEEP-ONOFF r3 (wymaga przebiegu w grze).

BLOKADY:
- Hak window.__aiUpkeepGateStats nie istnieje w main; metryka upkeepGate pozostaje NIE ZMIERZONO, dopóki nie powstanie osobny temat dodający licznik w src (zmiana src poza allowlistą tego tematu).
- Brak środowiska do pełnego smoke-testu w przeglądarce.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator: sprawdzić diff (2 pliki gra/tools), asercje 0g i brak zmian poza allowlistą; opcjonalnie smoke w środowisku z Chromium i node_modules. Orkiestrator: decyzja o temacie licznika __aiUpkeepGateStats w src (osobny dispatch, jeśli metryka bramki ma działać).

UWAGI-DLA-ORKIESTRATORA:
- Kandydat 6af3003f9 jest znacznie starszy niż main (diff gra/tools 8bc385dee..6af3003f9 pokazuje usunięcia nowszych testów); nie mergowano go w całości, funkcje przeniesiono ręcznie na main zgodnie z dispatchem.
- Dispatch nie istnieje w origin/main (00-dispatch.md jest tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0); odczytany z tej gałęzi.

DEPLOY/PUSH: NIE WYKONANO
