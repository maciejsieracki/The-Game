STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTO-FORT-DIAG-Q1
GOAL: U-2 (0 fortów gracza „zrównoważone”) zdiagnozować danymi i ocenić wg decyzji; U-3 (FAZA 0: posterunek w całości w kole własnego fortu) naprawić z testem regresyjnym.
ZMIANY/COMMIT: kod+test+gate'y `09fe841cd` (baza `a02d6bd30`); raport w kolejnym commicie. Pliki: `gra/src/game/auto-improvements.ts` (log E-FORT; filtr FAZY 0), `gra/tools/auto-fort-diag-test.cjs` (nowy). `ai.ts`, `civ-test-hooks.ts` NIE ruszane (nie były potrzebne).

U-3 (naprawione): w FAZIE 0 kandydat fort/posterunek odpada, gdy jego koło mieści się w całości w kole WŁASNEGO fortu/posterunku (węzły terytorium właściciela + warstwy bez węzła + picki z tego wywołania): `dist(środków)+r_kandydata <= r_istniejącego`. Kandydat wystający poza koło (>=1 nowy heks) powstaje. Test B bez poprawki (src z HEAD): FAIL (`posterunek@16,22` przy forcie `17,22`); z poprawką: PASS.
ZAŁOŻENIE: rozłączność z `pickFortClaims` (pełna) NIE jest przeniesiona do FAZY 0 — wymóg dispatchu definiuje test „koło w całości wewnątrz”, a pełna rozłączność zablokowałaby kandydatów częściowo nakładających się, dających nowe heksy. Obce forty nie włączają filtra (reguła „tego samego właściciela”). Znana luka poza zakresem: posterunek postawiony PRZED fortem, który go potem połyka w tym samym wywołaniu, nie jest cofany.

U-2 (log + ocena):
- Dodano scope `fort` do `AutoImproveDecisionEvent` i logi (tylko przy sinku `onDecision`/`__civAutoImproveDebug`, wynik pickera bez zmian — test A: picki z logiem == bez logu): `e-fort bramka: <powód>` (limit nie wyczerpany / brak miast zrównoważonych / żywność E1-E6 w toku / ścieżka zapasowa w toku / niedobór postawiony teraz / deficit pending / wejście) oraz `e-fort: wybrany | brak kandydata | koszt > pula | rezerwa | sufit % budżetu` z licznikami (cenne, nakładanie okręgu, qualifies, zysk 0, kandydaci). Wszystkie powody zawierają „fort”, więc łapie je filtr `fortDec` w `live-verify-autoimprove-fort.cjs`.
- Przyczyna U-2 w żywej grze: NIE_ZMIERZONO (brak buildu; bundle ROBOCZA 8f59c5c2 nie ma logu). Dane z `evidence/fort-zrownowazone.json`: miasto gracza city0 (19,32) istniało do t31 (pop 10), w t33 należy do właściciela 21 — więc E-FORT miał miasto do ~t31; cenne heksy (14,34),(15,34) leżą dokładnie na d=5 od stolicy (granica zasięgu pop<=5).
- Fixtury Node (test A) pokazują: przy limicie wyczerpanym, odblokowanej technologii, braku żywności i niedoboru → fort powstaje (bramka „wejście”); każdą z hipotez blokad (żywność w toku, niedobór postawiony/oczekujący, sufit %) odtworzono jako wstrzymanie fortu — ZGODNE z kolejnością z FORT-CLAIM-Q1 (żywność → niedobór → forty → drogi) i z #24 (sztywny sufit % gracza; sekcja M `auto-fort-claim-test`). Uwaga: niedobór czekający na budżet objawia się w bramce jako „ścieżka zapasowa w toku”, nie „deficit pending”.
- Ocena wg DECYZJI: #15–#19 dotyczą twardości terytorium, zdobywania, sporu fortów, bitwy i przegranej — NIE nakładają obowiązku stawiania fortów przez automat; obowiązek wynika z #27 (kolejka). Brak dowodu błędu kodu E-FORT; kodu E-FORT nie zmieniano. Werdykt U-2: NIEROZSTRZYGNIĘTE do żywego biegu z logiem (nie „zgodne”, nie „błąd”).

TESTY (gate'y `gate-*.txt`, każdy z jedną linią EXIT=): auto-fort-claim 63/0 EXIT=0; autoimprove-stages-q1 302/0; auto-improvements 46/0; ai-improvements 56/0; autoimprove-live-hooks 37/0; auto-fort-diag (nowy) 15/0; `tsc --noEmit` EXIT=0. Wszystkie bez zmiany asercji.
BLOKADY: BUILD potrzebny od orkiestratora (zakaz `npm run build` dla Operatora) — dla żywej weryfikacji: zbudować bundle z `09fe841cd`.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator. Po buildzie orkiestratora: `live-verify-autoimprove-fort.cjs 38 zrownowazone`; w `drainDecisions` filtrować `reason` zaczynające się od `e-fort` (limit `slice(0,12)` w skrypcie może uciąć przy zdarzeniach AI — podnieść/filtrować po `cityId==='city0'`); odczytać bramkę z t~3-33 i ocenić względem tabeli powyżej.
DEPLOY/PUSH: NIE WYKONANO
