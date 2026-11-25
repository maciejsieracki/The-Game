STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-FOODRESERVE-Q1
GOAL: dokończyć migrację literału 0 → fotel wyświetlany w HUD (zapas i cap żywności, głód wojska, tick żywności) w buildHudStateRaw; strażnik testowy czerwony po przywróceniu 0.
ZMIANY/COMMIT: baza origin/main 6fc5e88b5898ffaae158a9b227dfeb7ef638609b; commit z kodem = SHA w polu sha orkiestratora (czubek gałęzi detached tego worktree). Allowlista: gra/src/main.ts (tylko wskazane miejsca), gra/tools/hud-me-literal-zero-test.cjs (dopisanie asercji), dyspozycje/autobot/runs/R-WEB-HUD-ME-FOODRESERVE-Q1/10-operator-claude.md.

## Podstawienia w gra/src/main.ts (przed → po)
1. L24045 buildHudStateRaw: `getEmpireFoodReserve(0)` → `getEmpireFoodReserve(ownerId)`. Uzasadnienie: zapas żywności HUD ma pokazywać fotel wyświetlany (parametr ownerId, jak już robi `ps` i `shortageRows`), nie właściciela 0.
2. L24046 buildHudStateRaw: `projectPlayerFoodMaxCap()` → `projectPlayerFoodMaxCap(ownerId)`.
3. L23149 helper `projectPlayerFoodMaxCap(ownerId: number = 0)`: `getEmpireFoodMaxCap(0)` → `getEmpireFoodMaxCap(ownerId)`. Domyślne 0 zachowuje dotychczasowe wywołanie z buildEmpireFoodSnap (L20667) bez zmiany zachowania.
4. L24052 buildHudStateRaw: `getArmyStarvationCountdown(0, …)` → `(ownerId, …)`. Uzasadnienie: ostrzeżenie karencji głodu wojska to stan żywności fotela.
5. L24190 buildHudStateRaw: `getLastEmpireFoodTick(0)` → `(ownerId)`. Uzasadnienie: licznik niedokarmionych miast z ostatniego ticka fotela.
6. L24200 buildHudStateRaw: `isArmyHungry(0)` → `isArmyHungry(ownerId)`. Uzasadnienie: flaga głodu wojska fotela.
Wszystkie helpery (getEmpireFoodReserve/getEmpireFoodMaxCap/getArmyStarvationCountdown/getLastEmpireFoodTick/isArmyHungry w gra/src/game/empire-food.ts) są indeksowane ownerId (Map.get(ownerId)). W single-player ownerId = ME() = 0, więc zachowanie jest bit-identyczne.

## Literały 0 ZOSTAWIONE (z uzasadnieniem)
- L18712 maybeHintArmyFoodOnFirstPlayerUnit: `if (ownerId !== 0 …)` już ogranicza do fotela 0 — 0 znaczy „gracz pierwszy/ludzki”, zostawić.
- L20666–20667 buildEmpireFoodSnap (panel żywności, NIE buildHudState): getLastEmpireFoodTick(0), getEmpireFoodReserve(0), getEmpireFoodMaxCap(0). Poza zakresem tematu (funkcja spoza HUD buildHudState); KANDYDAT NA NASTĘPNY TEMAT, ta sama klasa.
- L23434 projectPlayerFoodProjection (wewnątrz): getEmpireFoodReserve(0) i całe ciało projekcji liczone dla właściciela 0 (cities.filter ownerId===0 itd.). Zostawione — patrz RYZYKO poniżej.
- L24039 empirePoborTotals(cities, 0, …) i L24160 civManpowerMultsForOwner(0): pobór/mnożniki manpower, nie żywność. Zostawione (KANDYDAT do osobnego tematu).
- L24053 ownerReligionForOwnerId(0), L24067 buildEmpireResourceRows(0), L24268 civKolorHexFn(0), leaderNameForOwnerId(0), civDisplayNameForOwner(0), L24145 wonderTradeRouteBonusForOwner(0), L24139 r.toOwnerId===0: nie food; zostawione, kandydaci na osobny przegląd.
- Część „collectDiploChipCounts”, empire-food-helpery wywoływane z 0 wewnątrz empire-food.ts: nie ruszane (poza allowlistą).
- L24031 (`0,` w wywołaniu w buildHudStateRaw, arg. poziomu/ery) i L24057/24147 (`?? 0`, `=== 0` na wartościach bonusów): nie owner-literały, zostawione.

## RYZYKO dla FC (WAŻNE)
projectPlayerFoodProjection() nadal liczy netRate / wpływ do zapasów / koszt armii WYŁĄCZNIE dla fotela 0. Po zmianie HUD pokazuje dla fotela ownerId: zapas, cap, głód wojska i tick z fotela ownerId, ale foodNetRate, zywnoscWplywMiast, zywnoscKosztWojska i zywnoscMiastNiedokarmionych (fallback) z fotela 0. W hotseat przy ownerId ≠ 0 pola mogą być NIESPÓJNE (przed zmianą wszystkie były spójnie fotela 0, błędnie). Single-player: brak różnicy. Rekomendacja: FC albo osobny temat „projectPlayerFoodProjection(ownerId)”, albo ocena, czy zmiana 1–6 ma zostać w tej fali. NIE ROZSTRZYGAM tego sam — zgłaszam.

## TESTY (liczby z surowego wyjścia)
- Strażnik hud-me-literal-zero-test.cjs: 16 PASS / 0 FAIL (było 6 asercji; dopisano 10: wycinek buildHudStateRaw po dopasowaniu nawiasów klamrowych, bez stałego okna znaków; sprawdzanie na kodzie bez komentarzy).
- Mutacja (przywrócenie literału 0 w każdym zmienionym miejscu, kopia main.ts w scratchpad, HUD_ME_GUARD_MAIN):
  - reserve L24045 → `getEmpireFoodReserve(0)`: exit=1, 14 PASS / 2 FAIL
  - cap L24046 → `projectPlayerFoodMaxCap()`: exit=1, 15 PASS / 1 FAIL
  - capfn L23149 → `getEmpireFoodMaxCap(0)`: exit=1, 15 PASS / 1 FAIL
  - starve L24052 → `getArmyStarvationCountdown(0, …)`: exit=1, 14 PASS / 2 FAIL
  - tick L24190 → `getLastEmpireFoodTick(0)`: exit=1, 14 PASS / 2 FAIL
  - hungry L24200 → `isArmyHungry(0)`: exit=1, 14 PASS / 2 FAIL
  Wszystkie 6 mutacji czerwone.
- Bramki (exit i liczby z surowego wyjścia):
  - tsc --noEmit: EXIT=0
  - logic-test: LOGIC OK (213/213), EXIT=0
  - tech-tree-test: 20 pass, 0 fail, EXIT=0
  - research-test: PASSED 33 / FAILED 0, EXIT=0
  - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), EXIT=0
  - combat-test: COMBAT TEST 6/6 pass, EXIT=0
  - ai-test: 297 passed, 0 failed, EXIT=0
  - hud-moc-warstwa-test: WYNIK 28 PASS, 0 FAIL, EXIT=0
  - hud-me-literal-zero-test: 16 PASS / 0 FAIL, EXIT=0
  - moc-ranking-rozjazd-test: WYNIK 19 PASS, 0 FAIL, EXIT=0
  - era-war-pairing-alliance-test: 19 pass, 0 fail, EXIT=0
  - hotseat-etap6d-podetap-e-source-test: 77 PASS, 0 FAIL, EXIT=0
  - granice-relacja-dyplomatyczna-test: 52 passed, 0 failed, EXIT=0
- Asercje nie osłabiane. hud-moc-warstwa-test.cjs NIE zmieniany (allowlista: tylko dopisanie, nie było potrzeby).
- Przeglądarka / live: NIE ZMIERZONO (brak uruchomienia gry w przeglądarce w tej rundzie).

## BLOKADY
Brak twardych blokad. Zostaje ryzyko spójności projectPlayerFoodProjection (sekcja RYZYKO).

## RUNDY
1/5 (ostatni werdykt: brak — pierwsza runda Operatora).

## NASTĘPNY KROK
Evaluator: sprawdzić podstawienia 1–6 vs sekcja „zostawione” i RYZYKO; FC: decyzja o projectPlayerFoodProjection(ownerId) przed deployem.

## UWAGI-DLA-ORKIESTRATORA
- Kandydaci na osobne tematy (ta sama klasa błędu, poza allowlistą tej rundy): buildEmpireFoodSnap L20666–20667; projectPlayerFoodProjection (fotel 0 wewnątrz); empirePoborTotals/civManpowerMultsForOwner(0) w buildHudStateRaw; ownerReligionForOwnerId(0) i pozostałe *ForOwner(0) w buildHudStateRaw.
- Węzeł „sąsiedztwo” z tytułu tematu nie został zdefiniowany w dispatchu; nie zinterpretowany, nie wykonany.
- node_modules zainstalowany w gra/ (npm ci --ignore-scripts) na potrzeby tsc; zostanie usunięty po commicie.

DEPLOY/PUSH: NIE WYKONANO
