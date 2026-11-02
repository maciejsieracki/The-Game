STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-LIVE-HOOKS-Q1
GOAL: log diagnostyczny pickera (powod wycinki/braku) + hooki `window.__civTest` za `?civTest=1` + zywe scenariusze (a)(b)(c) fort / E2 / E3.

ZMIANY/COMMIT: baza `e1b0bae86`; SHA commitu: patrz ostatnia linia ("COMMIT-SHA") - uzupelniona po commicie.
- `gra/src/game/auto-improvements.ts`: `opts.onDecision?` + flaga `globalThis.__civAutoImproveDebug` (funkcja lub truthy -> console.debug). Blok `if (dbg)` przed FAZA 1 pickera: podsumowanie bramek miasta + decyzja per heks lasu (powody: `wycinka wylaczona`, `brak tech`, `kandydat E2/E5 odpada: ...`, `brak limitu puli %`, `prog lasu`, `minimum lesne`, uwaga o `foodReservedHex`) z etykieta przebiegu (`etap`) i `sonda`. Tylko czyste odczyty; domyslnie `dbg===undefined` = zero kosztu.
- NOWY `gra/src/game/civ-test-hooks.ts`: `installCivTestHooks` (bramka dokladnie `?civTest=1`), API: state/hex/around/forts/ownerAt/unlockAllTech/setPraca/setPolicy/foundCandidates/foundCity/addUnit/setWar/debugOn/debugOff/drainDecisions/endTurn.
- `gra/src/main.ts`: import + jedno wywolanie `installCivTestHooks(window, location.search, {...closures})` (przed blokiem R-WEB-SAVELOAD-PRACA-POOL-Q1). Zero logiki gry.
- NOWY `gra/tools/autoimprove-live-hooks-test.cjs` (sondy tekstowe main.ts: import + wywolanie + bramka; bramka URL; parytet wynikow pickera).
- Dowody: `gate-*.txt`, `evidence-scenario-A-log.txt` (ten katalog). ZAŁOŻENIE: plik spoza allowlisty nie ruszany. node_modules usuniete po pracy.

TESTY (wszystkie z jedna linia EXIT=):
- `autoimprove-stages-q1-test.cjs` 302/0, wyjscie BAJT-W-BAJT identyczne z baza (cmp bez `EXIT=`); `auto-improvements-test.cjs` 46/0 (identyczne); `auto-fort-claim-test.cjs` 63/0 (identyczne).
- `autoimprove-live-hooks-test.cjs` 32/0: bez `?civTest=1` (puste, `?civTest=0/true/`, `?xcivTest=1`, null) `__civTest === undefined`; wyniki pickera z `onDecision` / flaga == bez.
- `tsc --noEmit` EXIT=0.

KRYTERIUM (A) - przyczyna braku wycinki (odtworzenie w picker-ie, NIE w zywej grze Korynt): w scenariuszu z lasem poza rzeka log podaje dla kazdego heksu lasu `odrzucony: wycinka wylaczona` gdy przycisk "Wolno wycinac las" jest OFF (domyslnie OFF, `getSkipWyrab: c => !effectiveUlepszeniaForCity(c).wolnoWycinacLas`, main.ts auto-block); przy ON etap zywnosci E1-E4 ma jeszcze prace (farma na rzece), wiec wycinka E5 nie jest oceniana, dopoki rzeka niezagospodarowana; po zagospodarowaniu: `wybrany E5` (evidence-scenario-A-log.txt). Konkretna przyczyna w zywym Koryncie: NIE_ZMIERZONO (brak zywego biegu). Uwaga: log nie wskazuje `foodReservedHex` jako powodu odrzucenia wycinki, bo ta bramka dotyczy tylko tartaku/obozu (auto-improvements.ts keyBlockedOnHex) - zapisana jako `uwaga` w detail.

BLOKADY:
1. ZYWE SCENARIUSZE (a) fort, (b) E2 wycinka+farma, (c) E3 trzoda: NIE_ZMIERZONO. Wymagaja bundla z nowym kodem (hooki + log); zakaz `npm run build/dev` w `gra/`. Potrzebny build: orkiestrator buduje Gra-ROBOCZA.html (gra-robocza/) z tego commita; wtedy sterownik Chromium (`/opt/pw-browsers/chromium`, URL `...?skipMenuRedirect=1&civTest=1`) uzywa `__civTest.debugOn()`, `foundCandidates/foundCity`, `setPolicy(0,{focus:'zrownowazone',tryb:'auto',onlyWorked:true,pracaAutoPercent:33,wolnoWycinacLas:true})`, `unlockAllTech()`, `setPraca(300)`, `endTurn()`, `around(q,r,5,true)`, `forts()`, `ownerAt`, `drainDecisions()`. Wzorzec sterownika (kreator Nowa gra, Math.random seed) jest na `origin/web-wip/LIVEVERIFY2-fc` (`live-verify-robocza-2-common.cjs`), nie na main.
2. Hook `naRzece` = `hx.rzeka.obecna` (bez `riverPaths`/krawedzi) - przyblizenie do odczytu; do potwierdzenia na zywej mapie.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (kontrola diffu, bramek, bajt-w-bajt); orkiestrator buduje bundle i zleca zywe (a)(b)(c) (osobny run); ewentualne usterki gry = nowe wpisy R-WEB-*.
DEPLOY/PUSH: NIE WYKONANO
