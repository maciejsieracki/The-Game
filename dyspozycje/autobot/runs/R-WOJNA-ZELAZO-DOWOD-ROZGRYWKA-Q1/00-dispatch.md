TEMAT:  R-WOJNA-ZELAZO-DOWOD-ROZGRYWKA-Q1
RUNDA:  1/5
DATA:   2026-08-31
DOMAIN: GAME
ŚCIEŻKA: A (Workflow), model sędziego (R-PROC-AUTOBOT.md §3c)
MODEL + EFFORT per rola: Operator Sonnet 5 effort=medium / Evaluator Sonnet 5 effort=high

## WYZWALACZ
Final Control `P-WOJNA-ZELAZO-BRAK-DOWODU-ROZGRYWKA-Q1` (2026-08-28, BRAK
DOWODU §13a): auto-pokój po 2 miastach, 20 tur odpoczynku i 20 tur cooldownu
Żelaza NIE zaobserwowany w realnej rozgrywce — istniejąca bramka
(`forced-war-iron-main-guard-test.cjs`) jest bramką TEKSTOWĄ (regex nad
main.ts), uczciwie zadeklarowaną jako słabszy dowód niż behawioralny.
Orkiestrator zweryfikował 2026-08-31: dla Brązu ISTNIEJE już precedens —
`__eraTestDebug.forceBronzeForcedWarOnPlayer()` (main.ts ~20061) +
`forced-war-player-target-live-test.cjs` (Playwright, 11/11) inscenizują
realne wypowiedzenie wojny wymuszonej w żywej przeglądarce bez rozgrywania
dziesiątek tur. Dla Żelaza równoważnego haka/testu NIE MA.

## GOAL
Skopiuj DOKŁADNIE wzorzec Brązu na Żelazo: nowa metoda w `__eraTestDebug`
(main.ts), np. `forceIronForcedWarOnPlayer()`, analogiczna do
`forceBronzeForcedWarOnPlayer()` — inscenizuje realny scenariusz „AI osiąga
próg Żelaza (2 miasta), gracz jest najbliższym kandydatem, zero wojen poza
barbarzyńcami" bez rozgrywania dziesiątek tur, wołając REALNĄ ścieżkę silnika
(`decideAIDiplomacy`, `pickIronForcedWarTargetId` lub odpowiednik, komenda
`wypowiedz_wojne`) przez `endTurn()` — NIE reimplementowaną. Nowy Playwright
test (`gra/tools/forced-war-iron-player-target-live-test.cjs` albo podobna
nazwa), lustro `forced-war-player-target-live-test.cjs`, potwierdzający
REALNE wypowiedzenie wojny AI→gracz w przeglądarce (toast, warEventLog,
relacja="wojna").

**Poza zakresem tego tematu** (świadomie, żeby nie rozmyć 5-rundowego
budżetu): dowód dla 20-turowego cooldownu/odpoczynku w PEŁNEJ, wieloturowej
rozgrywce oraz zbiorczy dowód zachowania AI-przy-rzece (Zasady 1-3) w długiej
partii (`P-AI-BRAK-DOWODU-ROZGRYWKA-ZBIORCZE-Q1`, `P-AI-R4-BRAK-DOWODU-
ROZGRYWKA-Q1`) — to wymaga osobnego, większego tematu budującego hak
"pełnej rozgrywki" (nie istnieje dziś żaden precedens do skopiowania), poza
budżetem tej rundy. Zostają w rejestrze jako otwarty dług.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
1. Nowa metoda `__eraTestDebug.forceIronForcedWarOnPlayer()` istnieje, wzoruje
   się 1:1 na `forceBronzeForcedWarOnPlayer()` (te same zasady: wyklucza
   miasta-państwa/kopie/barbarzyńców, resetuje ewentualną istniejącą wojnę
   attacker↔inni na 'neutralni', ustawia `diplomaticallyDiscoveredOwners`,
   umieszcza miasto gracza obok atakującego).
2. Nowy Playwright test uruchamia `endTurn()` po wywołaniu haka i potwierdza
   REALNY stan silnika: toast, `warEventLog` head, `getRelationStatus(attackerId, 0) === 'wojna'`
   — wklejony realny wynik uruchomienia w tej sesji.
3. Test dowodzi mutation-testingiem, że nie jest tautologiczny (analogicznie
   do `forced-war-player-target-live-test.cjs`) — wklejony dowód.
4. Zero zmian w logice mechanizmu Żelaza (`forced-war-iron.ts`) — hak
   wyłącznie steruje danymi wejściowymi/odczytuje stan, jak analogiczny hak
   Brązu.
5. 5 bramek referencyjnych zielone + `tsc --noEmit` 0 błędów + istniejące
   testy forced-war-iron-* bez regresu.

## ALLOWLISTA — nic poza tym
`gra/src/main.ts` (WYŁĄCZNIE nowa metoda w `__eraTestDebug`, wzorem
`forceBronzeForcedWarOnPlayer`), nowy plik `gra/tools/forced-war-iron-player-
target-live-test.cjs` (lub analogiczna nazwa). Zakazane bezwzględnie:
`gra/src/game/forced-war-iron.ts` i pozostałe pliki mechanizmu (logika wojny
nietknięta), `gra/data/**`, `docs/decyzje/<ID>.md`, `.git/**`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `playbook.json`.

## IZOLACJA
worktree własny, gałąź `autobot/R-WOJNA-ZELAZO-DOWOD-ROZGRYWKA-Q1`, baza
JAWNIE `origin/main`. Sparse-checkout bez `gra-robocza/`, `gra-kanon/`, `dist/`.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Zakaz uznania testu za dowód bez realnego uruchomienia w tej sesji z wklejonym
wynikiem. Zakaz reimplementowania logiki wyboru celu/wypowiedzenia wojny w
haku testowym — hak steruje WYŁĄCZNIE danymi wejściowymi (kto ma pending,
kto jest odkryty), sama decyzja i komenda idą normalną ścieżką `endTurn()`.

## PROCEDURA NAPRAWCZA PRZY FAIL
Runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

## GRANICE (naruszenie = FAIL)
`R-PROC-AUTOBOT.md` §9. Zakaz `npm run build`/`dev` w `gra/` (typecheck
wyłącznie `tsc --noEmit`; build produkcyjny wyłącznie
`node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist --emptyOutDir`
dla Playwright). Zakaz `git add -A`.

## OBIEG
Operator → Evaluator (zarzuty, lista może być pusta) → Operator (Obrona,
tylko gdy zarzuty niepuste) → Final Control (osobne wywołanie Workflow) →
orkiestrator integruje allowlist-only i cutuje kolejną FALĘ ROBOCZA.
