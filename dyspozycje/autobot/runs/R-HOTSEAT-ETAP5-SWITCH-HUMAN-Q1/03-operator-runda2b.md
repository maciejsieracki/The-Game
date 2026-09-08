# R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1 — Operator runda 2b

Kontynuacja przerwanej rundy 2 (kontener zrestartował się w połowie pracy; checkpoint
`2268cee7` odzyskany z filesystemu przez orkiestratora). Zadanie tej rundy: zdiagnozować i
naprawić PRZYCZYNĘ timeoutu `page.waitForSelector('.civ-build-panel
.civ-build-item[data-key]:not(.locked)')` (10000ms), na który padał Scenariusz A PO
restarcie (inny krok niż przed restartem), i doprowadzić oba scenariusze bramki
`hotseat-etap5-no-leak-test.cjs` do realnego PASS.

## Diagnoza i naprawy (4 kolejne, każda odkryta dopiero po naprawieniu poprzedniej —
scenariusz A po raz pierwszy w historii tego tematu uruchomił się na tyle daleko, żeby te
awarie w ogóle stały się widoczne)

**1. Timeout build-panelu — PRZYCZYNA: brak Pracy, NIE brak technologii.**
Pierwsza hipoteza (grantTestTech dla `Rolnictwo`/`Oswojenie zwierząt`) była BŁĘDNA —
obalona żywym zrzutem HTML panelu: ta gra startuje w epoce Brąz i nadaje z góry WSZYSTKIE
technologie Epoki Kamień (`[NewGame] Tech wcześniejszych epok: 12`), więc obie te
technologie są już zbadane na starcie (`grantTechToOwnerWithSideEffects` zwracał
"Technologia już zbadana"). Prawdziwa przyczyna: `playerPracaPool` startuje od zera, a
KAŻDE ulepszenie terenu (`terrain-improvements.json`) ma koszt Pracy > 0
(`scaleImprovementWorkCost` ×2) — na prawdziwym turze 1, zaraz po założeniu stolicy, ŻADNA
pozycja nie jest klikalna dla PRAWDZIWEGO gracza też (trzeba poczekać na akumulację Pracy z
miasta — poza zakresem tej bramki, dotyka `triggerPlayerEndTurn()`, zakazanego
allowlistą). **Naprawa:** nowy hak `__hotSeatTestDebug.grantTestPraca(amount)` (main.ts) —
dodaje Pracę do tej samej zmiennej `playerPracaPool`, którą odejmuje realny
`applyBuildRequest` przy budowie.

**2. `exploredKeysForActive` — DWA miasta zamiast jednego u ownera 1.**
`rivalCity` był wybierany jako "dowolne miasto ownera != 0" i PRZYPISYWANY
(`reassignCityId`) do ownera 1 (hijackowanego dla fotela B) — gdy trafiało miasto INNEGO
ownera niż 1, owner 1 kończył z DWOMA miastami: swoim oryginalnym z generacji świata PLUS
reassignowanym. **Naprawa:** użyj miasta, które owner 1 JUŻ POSIADA
(`cities.find(c => c.ownerId === 1)`) — zero reassignCityId.

**3. `openPanels.diplomacyAudience` — legalne pierwsze zetknięcie fotela B.**
KROK 7 `switchActiveHuman()` (`refreshFog()` dla nowego aktywnego) może LEGALNIE, PIERWSZY
RAZ z perspektywy fotela B, odkryć sąsiednią cywilizację przez jego WŁASNE miasto —
auto-otwiera kartę audiencji asynchronicznie (`requestAnimationFrame` →
`tryOpenNextFirstContactCard`). To nie jest wyciek fotela A, to prawdziwe pierwsze
zetknięcie fotela B (analogiczne do tego, co dostał fotel A w kroku 2c). **Naprawa:**
odczekaj + odpraw kartę tym samym wzorcem co dla fotela A, przed finalnym snapshotem.

**4. `openPanels.diploList` — `onBack` audiencji bez zaznaczonej jednostki nawiguje do
listy.** Po naprawie #3 ujawniła się KOLEJNA, wcześniej nieosiągalna awaria: `onBack`
audiencji (main.ts) dla gracza BEZ zaznaczonej jednostki (dokładnie stan fotela B — KROK 2
czyści `selectedId`) legalnie POKAZUJE listę dyplomacji zamiast całkiem zamykać (przycisk
ma wtedy etykietę "Wróć", nie "Wyjście") — realne zachowanie gry, nie wyciek. **Naprawa:**
odpraw też listę REALNYM przyciskiem zamknięcia (`.civ-diplo-list-hud .dip-close-btn`).

**5. `hintToastVisible` — KROK 6 zawsze pokazuje hint.** `focusCameraOnOwnerCapital`
BEZWARUNKOWO woła `showHintMessage()` — "Stolica: X" gdy fotel ma stolicę, "Brak stolicy"
gdy nie ma. Toast widoczny po switchu jest więc ZAMIERZONY. **Naprawa:** nowe pole
`hintToastText` w `snapshotVisibleState()` — asercja sprawdza TREŚĆ (hint fotela A z kroku
4, "Nie można założyć: ...", nie może przetrwać), nie samą widoczność.

Dodatkowo `exploredKeysForActive` wzmocniony merytorycznie: zamiast ślepej równości z
seedowanym zestawem, sprawdza (a) wszystkie wstrzyknięte klucze przetrwały, (b) ŻADEN
klucz z eksploracji fotela A (zebranej PRZED switchem, gdy `ME()===0`) nie przecieka do
fotela B — dokładnie ten sam wyciek co Zarzut #2 Evaluatora rundy 1 (fallback
`playerStartHex`), teraz sprawdzany precyzyjniej niż ślepa równość zbiorów.

Wszystkie diagnozy potwierdzone ŻYWYM uruchomieniem w Chromium (tymczasowe skrypty
diagnostyczne poza allowlistą, usunięte przed każdym commitem), nie zgadywaniem — zgodnie z
REGUŁĄ PRZECIW SAMOOSZUKIWANIU dispatchu.

## Sprawdzone i NIEZMIENIONE (z checkpointu 2268cee7)

- Strażnik `ME() === HUMAN_OWNER_PRIMARY` w fallbacku `currentVisible()` (Zarzut #2
  Evaluatora rundy 1) — nadal na miejscu, nie dotknięty.
- `ui/hotSeatHandoff.ts`, 7 kroków `switchActiveHuman()`, hak `spawnTestUnitForPlayer` +
  `closeCityPanelForTest` + obsługa karty pierwszego kontaktu w kroku 2b/2c — bez zmian.

## STATUS: PASS
## DOMAIN: GAME
## TEMAT: R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1
## GOAL: `switchActiveHuman()` + `ui/hotSeatHandoff.ts` + dowód "no leak" (bramka
`hotseat-etap5-no-leak-test.cjs`, oba scenariusze A/B, wszystkie asercje zielone)
## ZMIANY/COMMIT:
  - `66b7c539` — diagnoza + pierwsza (błędna) próba naprawy timeoutu build-panelu (grantTestTech)
  - `8f69608a` — poprawka diagnozy: `grantTestTech` → `grantTestPraca` (prawdziwa przyczyna)
  - `d405a56d` — naprawa 3 nowo odkrytych awarii Scenariusza A (dwa miasta ownera 1,
    diploAudience, hintToastText)
  - `4ab85405` — odprawienie `diploListHud` otwartego przez `onBack` audiencji
  - Pliki: `gra/src/main.ts` (WYŁĄCZNIE `__hotSeatTestDebug`: `grantTestPraca`,
    `hintToastText` w `snapshotVisibleState`), `gra/tools/hotseat-etap5-no-leak-test.cjs`
  - Zero zmian w `switchActiveHuman()`/`ui/hotSeatHandoff.ts` samych — wszystkie naprawy
    tej rundy to hak testowy + logika bramki, zgodnie z tym, że odkryte awarie okazały się
    być bądź artefaktem konfiguracji testu (miasto ownera 1), bądź LEGALNYM, zamierzonym
    zachowaniem silnika (hint stolicy, nawigacja audiencja→lista), nie regresją
    `switchActiveHuman()`.
## TESTY:
  - `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`): PASS, zero błędów.
  - `node tools/hotseat-etap5-no-leak-test.cjs`: **2/2 niezależne uruchomienia = PASS**
    (Scenariusz A PASS, Scenariusz B PASS, exit 0 w obu).
  - 5 bramek referencyjnych (z `gra/`), wszystkie na wyniku referencyjnym:
    `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33,
    `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6.
## BLOKADY: brak.
## RUNDY: 2b/5 (kontynuacja rundy 2 po restarcie kontenera — liczona jako ta sama runda 2
  wg dyspozycji orkiestratora, nie nowa runda w liczniku 5).
## NASTĘPNY KROK: Evaluator, niezależna weryfikacja realnym uruchomieniem bramki (minimum
  2 przebiegi) + świeże czytanie `switchActiveHuman()`/`ui/hotSeatHandoff.ts`/zmian tej
  rundy. Po PASS Evaluatora → Final Control → integracja orkiestratora (allowlist-only).
## DEPLOY/PUSH: NIE WYKONANO
