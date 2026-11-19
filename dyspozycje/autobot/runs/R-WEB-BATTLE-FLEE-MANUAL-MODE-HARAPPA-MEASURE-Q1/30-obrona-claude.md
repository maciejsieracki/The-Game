# R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q1 — obrona Operatora (runda 1, odpowiedź na raport Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (bitwa 3D, tryb ręczny, ucieczka)
TEMAT: R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q1
GOAL: zamknąć zarzuty Evaluatora (kandydat 5c3c3d5a2f36): dowieść limitu ucieczki dla jednostki Harappy w trybie ręcznym, dodać asercję trybu ręcznego i zabezpieczyć łańcuch rozkazu ręcznego przed ucieczką poza limitem.
BAZA: origin/main 2ab6e3a05 (kandydat 5c3c3d5a2f36, detached).

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ (poprawione). Dodano przypadek „Strażnik bram Harappy (gracz, civ Harappa)”, jednostka w grze nazywa się „Harappan Gate Guard” (nazwa z units.json, nie „Strażnik bram Harappy”; pierwsze uruchomienie z błędną nazwą nie znalazło jednostki i timeoutowało, zostało poprawione). Wynik pomiaru: normalny zasięg 3, limit ucieczki 1, kroki 1/1/1/1/1 w 5 turach (surowe: perRound {1:1,2:1,3:1,4:1,5:1}, maxPerRound 1).
2. PRZYJMUJĘ częściowo. Dodano asercję `manualMode === true` dla każdej zroutowanej jednostki (przypadki Wojownik, Rydwan, Harappa: wszystkie PASS). Wymuszone rozbicie (ru.routed = true w turze 1) pozostaje: test nie produkuje rozbicia organicznie (wymagałoby wyniku walki); nie dowodzi to więc, że bitwa wywołała ucieczkę sama. Do zrobienia w kolejnym temacie.
3. PRZYJMUJĘ i poprawiono w kodzie (battleScene.ts, `_manualOrderAfterStep`): jednostka zlamana w trakcie łańcucha rozkazu ręcznego przechodzi teraz na `_fleeStep` z zapasem tury = limit ucieczki minus to, co już przeszła w tej turze (ten sam wzór co `normalPlan` w zamrożonej fali). Wcześniej łańcuch szedł dalej przez `_doMove` z pełnym zapasem. UWAGA: ta poprawka NIE została zweryfikowana w przeglądarce (nie udało się wywołać rozbicia po pierwszym kroku łańcucha); potwierdzona jest tylko kompilacja i testy regresji (pkt TESTY). Odwrót na mapie i animacja (STEP_GAP_MS) nadal NIE ZMIERZONO.
4. PRZYJMUJĘ. Mutacja `mnoznik_ruchu = 1` daje w tym temacie 5 FAIL (Evaluator), a w ponownym pomiarze tylko przypadku Harappy: 3 PASS / 3 FAIL (kroki 3/3/3/3/1 przy limicie 1). Bramka unit-replace-test (21/21) podana poniżej.

## ZMIANY/COMMIT
- gra/src/battle/battleScene.ts: `_manualOrderAfterStep` — gałąź dla `ru.routed` (zapas tury ucieczki + `_fleeStep`). Jedyna zmiana logiki gry; wpływa tylko na jednostki zroutowane w trakcie rozkazu ręcznego.
- gra/tools/battle-flee-manual-test.cjs: przypadek Harappy (civA Harappa, route „Harappan Gate Guard”), asercja manualMode, zmienna FLEE_CASE (jeden przypadek na wywołanie), diagnostyka timeoutu.
- dyspozycje/autobot/runs/R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q1/30-obrona-claude.md (ten raport).
- Dane (combat-params.json) nietknięte; mutacja cofnięta `git checkout`.

## TESTY (surowe wyniki w tej rundzie)
- tsc --noEmit: exit 0
- battle-flee-manual-test, FLEE_CASE=0 (Wojownik): 6 PASS / 0 FAIL, maxPerRound 2 przy limicie 2
- battle-flee-manual-test, FLEE_CASE=1 (Rydwan konny): 6 PASS / 0 FAIL, maxPerRound 3 przy limicie 3
- battle-flee-manual-test, FLEE_CASE=2 (Harappa): 6 PASS / 0 FAIL, maxPerRound 1 przy limicie 1
- mutacja (mnoznik_ruchu 0.5 -> 1, FLEE_CASE=2): 3 PASS / 3 FAIL (czerwono), data/combat-params.json przywrócony
- battle-flee-speed-parity-test (auto): 53 PASS / 0 FAIL
- logic-test: LOGIC OK (213/213), exit 0
- research-test: 33/0, exit 0
- tech-tree-test: 20 pass / 0 fail, exit 0
- combat-test: 6/6, exit 0
- ai-unit-replace-same-rules-test: 45 passed / 0 failed, exit 0
- unit-replace-test: 21/21, exit 0

## BLOKADY
brak. Uwaga: tymczasowy plik /tmp/none (pusta kopia combat-params, przypadkowo utworzona) pozostał w /tmp — nie usunięto (brak zgody na rm).

## NIE ZMIERZONO
1. Rozbicie organiczne (bez wymuszenia) i rozbicie w trakcie łańcucha rozkazu w przeglądarce — poprawka pkt 3 bez dowodu E2E.
2. Odwrót po bitwie na mapie (tryb dwóch heksów).
3. Animacja i tempo kroku (STEP_GAP_MS, _doMove).
Propozycja tematu: R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q2 (E2E na rozbicie w łańcuchu + pomiar animacji i odwrotu na mapie).

RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control ponownie po kandydacie (sha w polu sha raportu), z uwagą na pkt 3 (brak E2E).
DEPLOY/PUSH: NIE WYKONANO
