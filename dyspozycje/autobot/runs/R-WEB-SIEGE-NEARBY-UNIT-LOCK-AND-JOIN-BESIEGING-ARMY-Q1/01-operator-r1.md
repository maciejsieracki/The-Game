STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-NEARBY-UNIT-LOCK-AND-JOIN-BESIEGING-ARMY-Q1
GOAL: (1) sąsiedni stos nieoblegający nie jest zablokowany przez oblężenie; (2) własną jednostkę można dołączyć do armii oblegającej poza miastem, z przejęciem stanu oblężenia; do armii w mieście nadal nie.
BAZA: origin/main bb92c8c90 (po FALI 601).

ZMIANY/COMMIT:
- Diagnoza (1): gra/src/main.ts `commitBesiege` ustawiał oblegaCityId + ruchLeft=0 WSZYSTKIM jednostkom właściciela oblegającego stojącym przy murze (hexDistance===1), także stosom spoza armii oblężniczej.
- Naprawa (1): `commitBesiege` oznacza wyłącznie stos atakującego. Grupa stosu (stackGroupId) zapisywana na City w `startMapSiege` jako `city.siegeArmyGroupId`, czyszczona w `endMapSiege`. Dotyczy oblężeń gracza; ścieżka AI bez zmian.
- Diagnoza (2): `coLocatedForMergePrompt` świadomie pomija oblegające, więc scalenie na heksie armii oblegającej nie tworzyło monitu i jednostka po cichu nie dołączała.
- Naprawa (2): gra/src/game/armyMerge.ts: nowe `besiegingUnitsOnHex` (oblegający poza garnizonem) i `inheritSiegeOnJoin` (dołączająca jednostka przejmuje oblegaCityId; liczniki City nietknięte). gra/src/main.ts `promptMergeIfCoLocated` dokłada armię oblegającą do zbioru scalania i przy zatwierdzeniu wywołuje przejęcie stanu. Garnizon miasta nie wchodzi do zbioru (zakaz dołączania do armii w mieście zachowany).
- Test: gra/tools/siege-nearby-lock-join-test.cjs (A: jednostkowe na realnym armyMerge.ts; B: strukturalne main.ts; C: NIE_ZMIERZONO).
- ZAŁOŻENIE (poza literalną allowlistą): pole `siegeArmyGroupId?: string` w typie City w gra/src/game/cities.ts. Konieczne; trzymane na City, bo testy harnessu wycinającego funkcje z main.ts nie widzą nowych zmiennych domknięcia (pierwsza wersja z Mapą łamała 3 testy, po przeniesieniu zielone).
- ZAŁOŻENIE: zakres blokady zmieniony tylko dla oblężeń gracza; AI bez zmian (brak decyzji właściciela dla AI).

TESTY:
- node gra/tools/siege-nearby-lock-join-test.cjs -> 12 OK, 0 FAIL; punkt C NIE_ZMIERZONO.
- tsc --noEmit -p gra -> exit 0.
- Regresja (--no-live): army-merge-colocated-test rc0; army-stack-limit-test rc0; siege-blockade-no-recruit-reinforce-test 48 OK/0 FAIL; siege-last-stand-sortie-test 71/0; siege-surrender-enter-city-test 32/0; oblezenie-siege-lifted-po-bitwie-test 16/0; oblezenie-remis-endsiege-test 271/0; ai-siege-requires-war-test rc0; city-siege-wall-rules-test 50/0; siege-tower-breach-everywhere-test rc0; siege-defenders-test rc0; law-garrison-test rc0; siege-starvation-test rc0; siege-ai-test rc0; army-concentration-test 56/0.
- general-quick-follow-action-test: rc1 z powodu braku /usr/bin/chromium (środowisko, nie regresja kodu).

BLOKADY: brak przeglądarki (Chromium) w kontenerze; żywa weryfikacja (sąsiad rusza się, dołączenie w polu, brak dołączenia w mieście) NIE_ZMIERZONO.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) przegląd diffu; żywa weryfikacja w Chromium przed READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
