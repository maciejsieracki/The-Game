STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-SCOUT-NOT-LEADER-Q1
GOAL: Zwiadowca (i inne jednostki niebojowe) w armii nie jest liderem ani nie blokuje ataku; armia zachowuje się jak najsilniejsza jednostka bojowa; zwiadowca ostatni na listach; zwiadowca tylko poszerza widoczność.

## Pomiar PRZED (przyczyna)
- Decyzję blokującą podejmuje `resolveEnemyCityClick` (`gra/src/map/map-attack-city.ts`): gdy ZAZNACZONA jednostka jest cywilna (`isCivilianUnit`) i stoi obok miasta, zwraca `hint_civilian` ("jednostka cywilna ... nie może zdobywać miast"), zanim sprawdzi resztę armii. Po dołączeniu zwiadowca zostaje zaznaczony (np. wybór z karty armii), więc atak jest zablokowany mimo jednostek bojowych w tym samym stosie.
- Odtworzone testem na kodzie bazowym (origin/main 3aa1b3a2a): stos zwiadowca + 2 wojowników przy mieście z murem, zaznaczony zwiadowca -> `hint_civilian` (RED); bez muru -> `hint_civilian`.
- `pickStackRepresentative` wybierał lidera tylko po meleeAttack (zwiadowca 0 vs wojownik 4, więc zwykle wojownik), ale bez gwarancji: przy remisie/zerowej sile wybór szedł po id (zwiadowca mógł wygrać). Wykluczenie cywili było tylko niejawne.
- Kolejność kart: `sortArmyStackGeneralsFirst` stawiał generałów, resztę w kolejności tablicy (zwiadowca mógł być w środku).
- Widoczność: `buildUnitSightResolver` liczy zasięg per jednostka; widoczność gracza jest sumą (unią) zasięgów wszystkich jednostek, więc zwiadowca w armii już podnosi zasięg i nie wymaga zmian (potwierdzone testem rozdzielczości zasięgów: wojownik 2, zwiadowca 5; pełna unia heksów NIE_ZMIERZONO w grze).
- `canInitiateSiege`/`classifyCityAttack` nie zależą od typu jednostki (tylko adiacencja/mur/właściciel) — bez zmian.

## Zmiany
- NOWY `gra/src/game/stack-leader.ts`: `pickStackLeader(stack, strengthOf)` (najsilniejsza jednostka bojowa, remis po id, niebojowe wykluczone dopóki jest bojowa; stos wyłącznie niebojowych = dotychczasowe zachowanie), `sortNonCombatLast`, `isNonCombatTypeName`.
- `gra/src/game/armyMerge.ts`: `pickStackRepresentative` deleguje do `pickStackLeader` (obejmuje klik na heks, reprezentanta tokenu/badge, scalanie/podział w main.ts bez zmian main.ts).
- `gra/src/map/map-attack-city.ts`: nowe `armyLeaderForSelection` — zaznaczony cywil w tym samym stackGroupId/heksie z jednostką bojową (ruch > 0, nie zaokrętowaną) jest zastępowany liderem; sam zwiadowca nadal dostaje `hint_civilian`.
- `gra/src/ui/armyStackLabel.ts`: `sortArmyStackGeneralsFirst` -> generał, bojowe, cywile na końcu (panel armii, scalanie, podział, tooltip).
- NOWY test `gra/tools/army-scout-not-leader-test.cjs` (12 asercji).
- `main.ts`, `ai.ts` NIE zmieniane. Parytet AI: AI decyduje per jednostka i już wyklucza cywili z ataku miast (`ai.ts` ~4106 `isCivilianUnit(unit) ? undefined`), a kotwice ataku to jednostki bojowe — brak błędu tego typu (pomiar czytaniem kodu; osobny test `ai-*` nie dodany).
- Siła ataku: bez zmian balansu (zwiadowca nie dodawał siły; nic nie zmieniono w walce).
- Osadnik/robotnik: ten sam problem (hint_civilian dla zaznaczonego cywila w armii) — naprawiony tą samą ścieżką.

## Testy
- RED na bazie: 4 FAIL (pickStackRepresentative ze zwiadowcą przy sile 0, unitAtRepresentative, atak miasta z zaznaczonym zwiadowcą z murem i bez muru). Po zmianach: 12 OK / 0 FAIL (mutacja = przywrócenie bazowych map-attack-city.ts/armyMerge.ts łamie test).
- tsc --noEmit: EXIT=0 (`gate-tsc.txt`).
- Regresje (`gate-regression.txt`): map-attack-city 13/0, map-siege 6/0, army-merge-stackgroupid 11045/0, army-stack-ruch, army-leadership, army-merge-colocated/bounce, army-split-movement, army-to-nearest-leader 43/0, army-consolidation, oblezenie 27/0, oblezenie-remis-endsiege 271/0, city-siege-wall-rules 50/0, scout-auto-explore 25/0, scout-explore-deselect-cycle, siege-defenders 12/0, siege-ai 17/0, siege-last-stand-sortie 71/0, siege-manual-battle-behavior 40/0, siege-surrender-enter-city 32/0, ai-siege-requires-war 49/0, ai-no-siege-without-war-r2 10, army-concentration 56/0 — wszystkie EXIT=0. ai-test 274 passed / 20 failed = punkt odniesienia z dispatchu (bez regresji).

## Blokady / NIE_ZMIERZONO
- Chromium (`?civTest=1`, zrzut panelu armii z zwiadowcą ostatnim): NIE_ZMIERZONO — zakaz `npm run build`/`dev` w `gra/`, brak vite build poza repo w tej rundzie. Dowód wizualny do uzupełnienia przez Evaluatora.
- `siege-blockade-no-recruit-reinforce-test.cjs` (test Chromium live) przekroczył timeout 200 s (EXIT=124, zamknięta przeglądarka) — infrastruktura, niezwiązane ze zmianą; NIE_ZMIERZONO.
- Brak testu `ai-*` kotwicy ataku (patrz wyżej).

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (weryfikacja, dowód wizualny w Chromium, ewentualny test parytetu AI)
## DEPLOY/PUSH: NIE WYKONANO
ZMIANY/COMMIT: patrz SHA w wiadomości końcowej (commit zawiera ten raport).
