# R-WEB-HUD-ME-REMAINING-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-REMAINING-Q1
GOAL: w HUD (buildHudStateRaw) i podglądzie żywności (buildEmpireFoodSnap) literał właściciela 0 zamieniony na fotel wyświetlany (ownerId) / aktywnego gracza (ME()), tam gdzie 0 był podstawieniem gracza aktywnego. W grze jednoosobowej (ownerId = ME() = 0) zachowanie bit-w-bit jak dotąd.
BAZA: origin/main b610e71a62f68c5c3052d456facc0deebd86af72 (detached w worktree)

## ZMIANY (gra/src/main.ts, tylko HUD i podgląd żywności)

Wszystkie zmiany są 1:1 (jedna linia kodu = jedna linia kodu). Plik:linia podane po zmianie.

| # | Plik:linia (po) | Przed | Po | Uzasadnienie |
|---|---|---|---|---|
| 1 | main.ts:20664 buildEmpireFoodSnap | `getLastEmpireFoodTick(0)` | `getLastEmpireFoodTick(ME())` | podgląd żywności imperium = fotel aktywny (wywołanie z buildEmpireDetailSnap używa ME()) |
| 2 | main.ts:20665 | `getEmpireFoodReserve(0)` | `getEmpireFoodReserve(ME())` | jw., zapas |
| 3 | main.ts:20666 | `getEmpireFoodMaxCap(0) \|\| projectPlayerFoodMaxCap()` | `getEmpireFoodMaxCap(ME()) \|\| projectPlayerFoodMaxCap(ME())` | jw., cap |
| 4 | main.ts:24038 buildHudStateRaw | `empirePoborTotals(cities, 0, player.era, civManpowerMultsForOwner(0).maxMult)` | `empirePoborTotals(cities, ownerId, ps.era, civManpowerMultsForOwner(ownerId).maxMult)` | pobór ludzi fotela wyświetlanego; era z `ps` (= playerStateByHuman.get(ownerId) ?? player) |
| 5 | main.ts:24055 | `ownerReligionForOwnerId(0)` | `ownerReligionForOwnerId(ownerId)` | religia państwa fotela |
| 6 | main.ts:24069 | `buildEmpireResourceRows(0)` | `buildEmpireResourceRows(ownerId)` | zasoby (chip Surowce) fotela |
| 7 | main.ts:24141 | `const toPlayer = r.toOwnerId === 0;` | `const toPlayer = r.toOwnerId === ownerId;` | strona „gracz" w filtrze tras handlowych HUD |
| 8 | main.ts:24147 | `wonderTradeRouteBonusForOwner(0, r.medium)` | `wonderTradeRouteBonusForOwner(ownerId, r.medium)` | bonus cudów dla właściciela wyświetlanego |
| 9 | main.ts:24162 | `civManpowerMultsForOwner(0)` | `civManpowerMultsForOwner(ownerId)` | mnożniki poboru fotela |
| 10 | main.ts:24165 | `cityManpowerSnapshot(c, player.era, ...)` | `cityManpowerSnapshot(c, ps.era, ...)` | era poboru z fotela wyświetlanego |
| 11 | main.ts:24269 | `playerCivTypeByHuman.get(ownerId) ?? player.civType ?? ...` | `... ?? ps.civType ?? ...` | fallback ikony cywilizacji: fotel, nie singleton fotela 0 |
| 12 | main.ts:24270 | `civKolorHexFn(0)` | `civKolorHexFn(ownerId)` | kolor cywilizacji fotela |
| 13 | main.ts:24272 | `leaderNameForOwnerId(0)` | `leaderNameForOwnerId(ownerId)` | nazwa przywódcy fotela |
| 14 | main.ts:24273 | `civDisplayNameForOwner(0)` | `civDisplayNameForOwner(ownerId)` | nazwa narodu fotela |

Komentarz w main.ts:24145 zaktualizowany („WŁAŚCICIELA wyświetlanego fotela (ownerId)") — bez wpływu na kod.

Każda linia kodu zmieniona w tej rundzie ma mutant czerwony (sekcja TESTY).

## ZOSTAWIONE 0 (z uzasadnieniem)

- main.ts:24030 `scaledResearchCost(..., 0, _menuDifficulty, ...)` — argument liczbowy (parametr kosztu), nie właściciel.
- main.ts:24077 `const shortageRows = ownerId === 0 ? storedResourceRows : buildEmpireResourceRows(ownerId)...` — celowa gałąź (z komentarzem Z5 hot-seat); dla ownerId=0 równoważna `buildEmpireResourceRows(0)`. Zostawiona.
- main.ts:24141 nie dotyczy `fromPlayer` (nadal `isMe(r.ownerId)` — szeroki filtr wszystkich fotela ludzkich, jak przed zmianą).
- main.ts:18711 `maybeHintArmyFoodOnFirstPlayerUnit`: `if (ownerId !== 0 ...)` — celowa bramka „pierwsza jednostka gracza 0" (hint jednorazowy), nie podstawienie HUD. Zostawiona.
- main.ts:21242 (panel Handel, `wonderTradeRouteBonusForOwner(0, r.medium)`), main.ts:21309–21310 (`wonderTradeRouteBonusForOwner(0, 'lad'|'morze')`) — NIE w buildHudStateRaw ani w buildEmpireFoodSnap; to panel handlu/cudów. Są to podstawienia gracza aktywnego, ale poza zakresem dispatchu („HUD i podglądy" wskazane jako buildHudStateRaw + food snap). NIE ZMIENIONE — kandydat na osobny temat (zamiana na ME()).
- main.ts:21091 `playerEra: player.era, playerZbadane: player.zbadane` w buildEmpireDetailSnap — podgląd szczegółów imperium; `player` = fotel 0 (singleton). NIE ZMIENIONE (poza buildHudStateRaw; wymaga decyzji o źródle stanu ME()). Kandydat na osobny temat.
- main.ts:20518, 20607 `oid === 0 ? civDisplayNameForKey(civKeyForOwner(0))` — etykiety tabeli dyplomacji/imperium, nie HUD. NIE ZMIENIONE — do przeglądu w osobnym temacie.
- Pozostałe `player.era`/`player.zbadane` w zakresie 23169–23800 i 25289 — silniki AI/dyplomacji poza HUD. NIE ZMIENIONE.

## TESTY

Typecheck i bramki (liczby z surowego wyjścia):
- `npx tsc --noEmit` (gra/): exit 0 (po poprawce; pierwsza iteracja dała błąd TS2304 w linii 21242 — naprawiony, wynik końcowy 0 błędów).
- logic-test: exit 0, ostatnia linia `PASS [213]` (213 asercji).
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`.
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- unit-replace-*: archer-slinger `51 OK, 0 FAIL`; full-cost `40 passed, 0 failed`; multitype-walk `25 OK, 0 FAIL`; promotion-table PASS (32 wpisy, 63 krawędzie); army-multi-select exit 0 (część Chromium/live: NIE_ZMIERZONO — brak playwright/jsdom w piaskownicy).
- combat-test: exit 0 (`All sanity checks passed.`).
- ai-test: `ai-test: 297 passed, 0 failed`.
- hud-moc-warstwa-test: `WYNIK: 28 PASS, 0 FAIL`.
- hud-me-literal-zero-test (rozszerzony): `Wynik: 51 PASS / 0 FAIL` (było 26; +25 nowych asercji dla 14 miejsc).
- moc-ranking-rozjazd-test: `WYNIK: 19 PASS, 0 FAIL`.
- war-rules-multiwar-main-guard-test: `21 PASS / 0 FAIL`.
- hotseat-etap6d-podetap-e-source-test: `77 PASS, 0 FAIL`.
- hotseat-etap6d-podetap-b-exec-test: `48 PASS, 0 FAIL` (B 48/0).
- hotseat-etap6d-podetap-d-exec-test: `46 PASS, 0 FAIL` (D 46/0).
- hotseat-etap6d-podetap-e-exec-test: `24 PASS, 0 FAIL` (E 24/0).
- granice-relacja-dyplomatyczna-test: `52 passed, 0 failed`.
- bramki-tmpdir-unikalnosc-test: `PASS=18 FAIL=0`.

Mutacje (guard hud-me-literal-zero-test.cjs, tryb HUD_ME_GUARD_MAIN): dla KAŻDEJ zmienionej linii kodu (14 linii; komentarz pominięty) wykonany mutant przywracający oryginalną linię. Wynik: 14/14 `exit=1` (CZERWONY). Lista: 20664, 20665, 20666, 24038, 24055, 24069, 24141, 24147, 24162, 24165, 24269, 24270, 24272, 24273 (numery po zmianie; linia 24269 sprawdzana wariantem z `ps.civType`).

Nowy test hotseat HUD: `gra/tools/hud-owner-hotseat-source-test.cjs` — `Wynik: 31 PASS / 0 FAIL`. Reprezentanci: zasoby, religia, nazwa przywódcy, kolor, nazwa narodu, pobór, mnożniki poboru + zapas żywności i stan `ps`. UWAGA: to test ŹRÓDŁOWY (nie behawioralny jak hotseat-etap6d-d) — nie uruchamia gry ani spyów; nie dowodzi runtime dla ownerId≠0. Dowód live hotseat: NIE ZMIERZONO.

## BLOKADY

- Brak. Runtime hotseat (ownerId≠0 w przeglądarce) NIE ZMIERZONO.
- Testy Chromium/live (unit-replace-army-multi-select, część live) NIE ZMIERZONO w tej piaskownicy.

## RUNDY

1/5 (ostatni werdykt: brak; to pierwsza runda Operatora).

## NASTĘPNY KROK

Final Control (Sonnet) na commicie z tym raportem: weryfikacja allowlisty, bramek i kandydatów poza zakresem (21242/21309/21310, 21091, 20518/20607) — decyzja orkiestratora czy osobny temat.

## UWAGI-DLA-ORKIESTRATORA

- Kandydaci poza zakresem (sekcja ZOSTAWIONE 0): main.ts:21242, 21309, 21310 (panel Handel/cuda), main.ts:21091 (`playerEra/playerZbadane` w buildEmpireDetailSnap), main.ts:20518/20607 (etykiety dyplomacji). Wszystkie to podstawienia gracza aktywnego; nie ruszane, bo dispatch ogranicza zmiany do HUD i podglądu żywności.
- `gra/node_modules` zainstalowano tylko na potrzeby tsc/testów (npm ci --ignore-scripts) i usunięto po bramkach.
- Worktree: detached HEAD na b610e71a6; nie pushowano, nie integrowano, nie deployowano.

DEPLOY/PUSH: NIE WYKONANO
