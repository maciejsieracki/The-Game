TEMAT:  R-SKARBIEC-HANDEL-PODGLAD-ZERO-Q1
RUNDA:  2/5 (runda 1 = NAPRAW na nowo znalezioną lukę w guardzie testu — patrz ECHO na końcu pliku)
DATA:   2026-09-01
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Właściciel, dwa zrzuty: panel „Handel — Szlaki handlowe" pokazuje „+157
złota/turę" z 23 tras, ale panel „Skarbiec Imperium" (ta sama tura) pokazuje
w wierszu „Handel ze szlaków" DOKŁADNIE 0, a „Netto skarbiec" jest liczone
bez tych 157 złota. Właściciel: „obawiam się, że [pieniądze z handlu] w ogóle
nie są zaliczane, tylko są sztucznie wyświetlane."

## RECON (wykonany, nie powtarzać — potwierdzony czytaniem realnego kodu
silnika I warstwy HUD, nie zgadywaniem)
**Silnik jest POPRAWNY — złoto z tras REALNIE trafia do skarbca.** Na końcu
tury: `tradeIncomeByCity = computeTradeRouteIncomeByCity(tradeRoutes,
tradeIncomeParams, wonderTradeRouteBonusForOwner)` (+ bonus portowy,
`main.ts:26244-26257`) trafia do `advanceCityEconomy(...)` (`main.ts:26271`),
`turn-economy.ts:2072` czyta `pieniadzZTras = tradeIncomeByCity.get(city.id)
?? 0` i dodaje do `pieniadz` per miasto (linie 2100/2153/2687/2775),
a `main.ts:26700-26702`: `player.skarbiec += pieniadzGracza` — REALNY stan
skarbca faktycznie rośnie o dochód z tras. To zgadza się z rosnącym „Stan
skarbca 547" ze zrzutu.

**Bug jest WYŁĄCZNIE w warstwie HUD/podglądu — panel Skarbiec czyta z
podglądu, który ZAWSZE liczy handel jako zero.** `refreshLiveEmpireRatesUnsafe()`
(`main.ts:15905-15967`, wołane przy każdym odświeżeniu HUD, m.in. z linii
14430/19998) woła `previewCityEconomy(...)` (linie 15917-15941) z DWOMA
argumentami `undefined` na pozycjach 10 i 11 (linie 15929-15930 —
`tradeRouteBuildingBonusByCity` i `tradeIncomeByCity`). Sygnatura
`previewCityEconomy` (`turn-economy.ts:1840-1867`) przy braku tych
argumentów domyślnie liczy z pustych map, więc `playerEcon.pieniadzZTras`
jest w TYM PODGLĄDZIE zawsze 0. Linia 15959: `_lastBogactwoHandel =
playerEcon.pieniadzZTras` (zawsze 0), linia 15967: `_lastBogactwoRate =
playerEcon.pieniadz - upkeep` (też bez tras). Te dwie zmienne trafiają do
`EmpireDetailSnap['economy']` (`main.ts:6607-6612`), czytanego przez
`renderSkarbiecSection()`/`cityEconMiniSkarbiec()`
(`gra/src/ui/empireDetailPanel.ts:884-900`, `971-1027`) — DOKŁADNIE wiersze
„Handel ze szlaków" i „Netto skarbiec" ze zrzutu właściciela.

Ciekawostka: gotowa, aktualna mapa bonusu budynkowego już istnieje jako
zmienna modułowa `tradeRouteBuildingBonusByCity` (`main.ts:2647`,
aktualizowana w liniach 13310/32448) w TYM SAMYM domknięciu — ale wywołanie
i tak przekazuje literalny `undefined` zamiast niej. Dla `tradeIncomeByCity`
(dochodu $ z tras) nie ma dziś żadnego analogicznego cache'a poza blokiem
końca tury — trzeba go policzyć na żądanie, tak jak robi to blok końca tury.

Panel „Handel — Szlaki handlowe" liczy POPRAWNIE, z tej samej formuły co
silnik (`buildEmpireTradeSnap()`, `main.ts:14297-14345`, komentarz przy
14307-14310 wprost mówi że ma się zgadzać z realnym wpisem do skarbca) —
TEN panel NIE wymaga żadnej poprawki.

**Luka testowa potwierdzona:** `gra/tools/empire-skarbiec-bilans-test.cjs:116`
i `gra/tools/hud-skarbiec-test.cjs:133` wołają `previewCityEconomy` z
DOKŁADNIE tym samym pominiętym argumentem co bug — ale ich fixture nie ma
żadnych aktywnych tras handlowych, więc `handel=0` wychodzi trywialnie z
konstrukcji testu, nie z realnej logiki. Testy są dziś zielone, ale nigdy
nie stawiają scenariusza z aktywnymi trasami — stąd bug przeszedł
niezauważony.

## GOAL
W `refreshLiveEmpireRatesUnsafe()` (`gra/src/main.ts` ~15917-15941) zamień
DWA literalne `undefined` (pozycje 10-11 wywołania `previewCityEconomy`,
linie 15929-15930) na REALNIE POLICZONE mapy, analogicznie do bloku końca
tury (`main.ts:26244-26257`):
- pozycja 10 (`tradeRouteBuildingBonusByCity`): użyj ISTNIEJĄCEJ zmiennej
  modułowej `tradeRouteBuildingBonusByCity` (już aktualnej, main.ts:2647) —
  NIE licz jej od nowa, jest już dostępna w tym domknięciu.
- pozycja 11 (`tradeIncomeByCity`): policz na żądanie tym samym wzorcem co
  koniec tury — `loadTradeRouteIncomeParams(data.econParams, _menuDifficulty)`
  → `computeTradeRouteIncomeByCity(tradeRoutes, tradeIncomeParams,
  wonderTradeRouteBonusForOwner)` → dodaj bonus portowy
  (`computeSeaTradeBonusIncomeByCity(computeSeaTradeRouteCountByCity(tradeRoutes))`)
  DOKŁADNIE jak w liniach 26238-26257. To jest CZYSTE liczenie z aktualnego
  stanu `tradeRoutes` — nie mutuje żadnego stanu gry, bezpieczne do wołania
  przy każdym odświeżeniu HUD (tak samo jak reszta `previewCityEconomy`,
  która już dziś jest czystym podglądem wołanym często).

Dodatkowo: rozszerz `gra/tools/empire-skarbiec-bilans-test.cjs` i/albo
`gra/tools/hud-skarbiec-test.cjs` o NOWY scenariusz z co najmniej jedną
aktywną trasą handlową o niezerowym dochodzie, żeby ta klasa błędu (podgląd
HUD ignorujący handel mimo że silnik go poprawnie księguje) miała pokrycie
testowe na przyszłość.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Realny, żywy dowód (headless Chromium LUB test Node odtwarzający dokładny
   scenariusz właściciela): gracz z aktywnymi trasami handlowymi o
   niezerowym dochodzie — panel „Skarbiec Imperium", wiersz „Handel ze
   szlaków" pokazuje WARTOŚĆ ZGODNĄ z panelem „Handel — Szlaki handlowe"
   (te same 157, nie 0).
2. „Netto skarbiec" w panelu Skarbiec poprawnie UWZGLĘDNIA ten dochód w
   sumie (nie tylko sam wiersz „Handel ze szlaków" się zmienia w oderwaniu
   od reszty bilansu).
3. Realny stan skarbca po zakończeniu tury (`player.skarbiec`) rośnie
   DOKŁADNIE o wartość pokazaną w podglądzie PRZED końcem tury — dowód że
   podgląd i rzeczywisty tick są teraz zgodne (nie tylko że podgląd przestał
   być zerem, ale że zgadza się z tym co realnie księguje `advanceCityEconomy`).
4. Nowy/rozszerzony test z aktywną trasą handlową zielony, łapie regres gdyby
   ktoś w przyszłości znów podał `undefined` w tym miejscu (dowód: test
   celowo zmutowany — przywrócenie `undefined` w miejscu poprawki — czerwienieje).
5. `tsc --noEmit` 0 błędów + wszystkie 5 bramek referencyjnych bez regresu +
   `empire-skarbiec-bilans-test.cjs`/`hud-skarbiec-test.cjs` (istniejące
   asercje) bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (WYŁĄCZNIE funkcja `refreshLiveEmpireRatesUnsafe`, wywołanie
`previewCityEconomy` — podmiana dwóch argumentów), `gra/tools/empire-skarbiec-bilans-test.cjs`,
`gra/tools/hud-skarbiec-test.cjs` (rozszerzenie o scenariusz z trasami).
Zakazane bezwzględnie: `gra/src/game/turn-economy.ts` (`previewCityEconomy`/
`advanceCityEconomy` zostają nietknięte — poprawne, zmienia się TYLKO co do
nich trafia), `gra/src/game/trade-routes.ts`, `gra/src/ui/empireDetailPanel.ts`
(panel Handel jest już poprawny, panel Skarbiec czyta ze snapshotu który
naprawiamy u źródła, nie w renderze), `gra/data/**`, `docs/decyzje/<ID>.md`,
`.git/**`, `dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`,
`playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-SKARBIEC-HANDEL-PODGLAD-ZERO-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`,
`dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania kryterium 1 za spełnione na podstawie samej podmiany
argumentów bez realnego testu z aktywnymi trasami o NIEZEROWYM dochodzie —
fixture z zerowym/brakiem tras (jak dzisiejsze testy) trywialnie przejdzie
niezależnie od tego czy poprawka faktycznie działa, dokładnie jak opisano w
RECON. Zakaz „naprawienia" tego przez zmianę czegokolwiek w
`empireDetailPanel.ts` (kosmetyczne przeliczenie w renderze) zamiast u
źródła danych — to zostawiłoby ten sam błędny podgląd używany też gdzie
indziej (jeśli `_lastBogactwoHandel`/`_lastBogactwoRate` są czytane w innych
miejscach HUD, sprawdź grepem PRZED zmianą).

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla żywego testu w przeglądarce, jeśli potrzebny). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.

## ECHO — RUNDA 2 (2026-09-01)

Runda 1 (commit `73868d9b`, branch `autobot/R-SKARBIEC-HANDEL-PODGLAD-ZERO-Q1`)
naprawiła fix w `main.ts` poprawnie, ALE Final Control znalazł nową lukę w
guardzie regresyjnym dodanym w Obronie rundy 1: `checkRealFixSiteInMainTs()`
(w `gra/tools/hud-skarbiec-test.cjs`) wycina tekst argumentów 10/11 z
SUROWEGO źródła `main.ts` bez usuwania komentarzy z wyciętego fragmentu, i
sprawdza go regexem/`.includes()` zamiast ścisłego dopasowania. Dowód Final
Control: podmiana realnego wywołania na
`undefined /* tradeRouteBuildingBonusByCity */, undefined /* computeTradeRouteIncomeByCity loadTradeRouteIncomeParams */,`
(czyli PRZYWRÓCENIE buga — literalny `undefined` na obu pozycjach — z
komentarzem zawierającym nazwy zmiennych tuż obok) przechodzi guard jako
ZIELONY (23/23), mimo że to dokładnie ten sam regres, który temat miał
wykryć.

**GOAL rundy 2:** utwardź `checkRealFixSiteInMainTs()` w
`gra/tools/hud-skarbiec-test.cjs`:
1. Przed dopasowaniem USUŃ komentarze (`/* ... */` i `// ...`) z wyciętego
   fragmentu argumentów (albo z całego pliku źródłowego przed parsowaniem).
2. Dopasowanie ma być ŚCISŁE — porównanie wyekstrahowanego argumentu (po
   `trim()`, po usunięciu komentarzy) do dokładnej oczekiwanej wartości
   (np. `arg10 === 'tradeRouteBuildingBonusByCity'`), NIE regex-contains/
   `.includes()` na surowym tekście z komentarzami.
3. Dodaj NOWY przypadek testowy odtwarzający DOKŁADNIE ten atak z raportu
   Final Control (literalny `undefined` + sąsiedni komentarz z nazwami
   zmiennych) i pokaż że po utwardzeniu guard POPRAWNIE go odrzuca
   (test czerwienieje na tej mutacji, tak jak powinien).

**JAWNIE POZA ZAKRESEM:** żadna zmiana w `gra/src/main.ts` — fix z rundy 1
jest merytorycznie poprawny (Final Control potwierdził empirycznie: prawdziwy
`undefined, undefined,` bez komentarza poprawnie czerwienieje). Problem jest
WYŁĄCZNIE w solidności guardu testowego.

**Zaktualizowana ALLOWLISTA (runda 2):** WYŁĄCZNIE
`gra/tools/hud-skarbiec-test.cjs`. `gra/src/main.ts` pozostaje NIETKNIĘTY w
tej rundzie (już poprawny z rundy 1).
