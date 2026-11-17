# Obrona Operatora — runda 1 (odpowiedzi na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-CITY-FOUNDING-LIMIT-GREYED-OUT-Q1
GOAL: „Załóż miasto” w panelu budowy wyszarzone, nieklikalne i z komunikatem „Osiągnięto limit miast (X/Y w tej epoce)” gdy limit miast epoki jest osiągnięty; stan „brak zasobów” bez zmian gdy limit nie jest osiągnięty.
BAZA: ea503b56733a30dc63720bb0ee6c35c331dace54 (kandydat Operatora, potomek ac35200a1)
ZMIANY-COMMIT: patrz sekcja „Commit” na końcu (SHA raportu i kodu zapisany w odpowiedzi orkiestratora).

## Zarzut 1 — wiring main.ts bez testu behawioralnego: PRZYJMUJĘ
- Poprawka: logika priorytetu wyniesiona do czystej funkcji `resolveFoundCityLockHint(limit, affordanceReason)` w `gra/src/game/cities.ts`. `gra/src/main.ts` nie ma już własnej gałęzi `if (lim.exhausted)`; woła `resolveFoundCityLockHint(isAwaitingFirstPlayerCity() ? null : cityFoundingLimitState(...), () => <zasoby>)`.
- Dowód behawioralny: `gra/tools/city-founding-limit-greyed-test.cjs`, sekcja B2 (6 asercji na prawdziwym module): limit + brak zasobów → komunikat o limicie, zasoby NIE są wtedy liczone; poniżej limitu → stary komunikat o Pracy; limit=null (pierwsze miasto) → wynik zasobów bez zmian.
- Mutacja A (warunek limitu wyłączony w helperze, `if (false && limit !== null && limit.exhausted)`, kopia src poza repo): test **czerwony**, 17 OK / 2 FAIL (dwie asercje B2 o priorytecie limitu).
- Mutacja B (main.ts: limit zastąpiony `null,` zamiast `cityFoundingLimitState(...)` przy pierwszym mieście): test **czerwony**, 18 OK / 1 FAIL („getFoundCityLockHint: limit = …”).
- Wynik zielony na kodzie bez mutacji: 19 OK / 0 FAIL.

## Zarzut 2 — brak dowodu live w pełnej grze: PRZYJMUJĘ (dowód zrobiony)
- Nowy test: `gra/tools/city-founding-limit-greyed-fullgame-live-test.cjs`. Używa PRAWDZIWEGO bundla gry (`test-hook-setcitylimit-live-bundle.cjs`, zbudowany poza repo z aktualnych źródeł, ?civTest=1), nie zrekonstruowanego HUD.
- Wynik: **PASS=10 FAIL=0**, exit 0, brak błędów JS na stronie. Ślad JSON: `$SCR/evid/live-city-limit-greyed-fullgame.json` (SCR = katalog scratchpad sesji Operatora).
- Odczyty z DOM w prawdziwej grze:
  - limit 1/1 (1 miasto gracza): `class="civ-build-item locked limit"`, `aria-disabled="true"`, meta „limit 1/1”, napis „osiągnięto limit” przy nagłówku Miasto, opacity 0.36.
  - klik przy limicie: pozycja nie dostaje klasy `sel` (tryb zakładania nie wszedł).
  - limit podniesiony do 5 + ponowne otwarcie panelu: brak klasy `limit`, brak `aria-disabled`, brak napisu.
- Zastrzeżenie dotyczące środowiska: menu startowe `.civ-menu` (ROZPOCZNIJ GRĘ) pozostaje nad grą po `?skipMenuRedirect=1` i przechwytuje kliki w pasek narzędzi. Test ukrywa je stylem `display:none` (wyłącznie w harnessie, bez zmian w kodzie gry). Logika i panel budowy działają bez modyfikacji.
- Zrzutu ekranu nie dołączono do dowodu (test ma opcjonalny `page.screenshot`, który zapisuje do EVID; odczyt DOM jest dowodem rozstrzygającym). NIE ZMIERZONO wizualnie na zrzucie — opacity 0.36 i klasy zmierzone w DOM, wygląd oceniony tylko po CSS.

## Zarzut 3 — kiedy stan przycisku się odświeża (epoka / utrata miasta): CZĘŚCIOWO PRZYJMUJĘ (pomiar + opis, bez przebudowy)
- Mechanizm w kodzie: `buildModeHud.render()` jest wywoływany przez `buildModeApi.update()`; to wołają `refreshD1BModules()` w `hud.ts` (~2121) i `updateHud()`. Odświeżanie panelu w `main.ts` idzie przez `refreshD1bHud()` (183 miejsca wywołań w main.ts, m.in. po założeniu miasta, ruchach, zakończeniu tury). `render()` ustawia `el.innerHTML` przy każdym wywołaniu gdy tryb budowy jest otwarty.
- Pomiar w grze (test live, krok „staleAfterRaiseNoAction”): po `setCityLimit(5)` **bez żadnej akcji** DOM pokazuje jeszcze stan limitu (`civ-build-item locked limit`) — stan jest nieświeży do najbliższego renderu panelu. Po zamknięciu i ponownym otwarciu panelu stan jest poprawny (aktywny). Czyli: odświeżenie następuje przy najbliższym `render()` panelu, nie w momencie zmiany limitu.
- NIE ZMIERZONO: awans epoki w trakcie tury (`player.era = next`, main.ts ~2656) i utrata/zdobycie miasta nie zostały przetestowane w prawdziwej grze jako wyzwalacz; nie potwierdzam, że te ścieżki wołają `refreshD1bHud`. Test pokazuje jedynie, że ponowne otwarcie/render odświeża stan. Zmiana nie jest wymagana przez GOAL („przy najbliższym odświeżeniu panelu”), a ewentualne dodanie wyzwalacza przy zmianie epoki to osobny temat.

## Dowody bramek (surowe wyjścia z tego uruchomienia)
- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0 (po zmianie helpera).
- `node tools/city-founding-limit-greyed-test.cjs` → 19 OK / 0 FAIL (exit 0).
- `node tools/city-founding-limit-greyed-fullgame-live-test.cjs` (ROBOCZA_HTML = bundle poza repo) → PASS=10 FAIL=0 (exit 0).
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, 213 linii PASS, 0 FAIL.
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `node tools/combat-test.cjs` → `All sanity checks passed.` (exit 0).
- `git diff --check` → czysto.

## Zmienione pliki (allowlista)
- `gra/src/game/cities.ts` — dodane `resolveFoundCityLockHint` (obok `cityFoundingLimitState`); logika `canFoundCity` bez zmian.
- `gra/src/main.ts` — `getFoundCityLockHint` deleguje do `resolveFoundCityLockHint`; import dodany.
- `gra/tools/city-founding-limit-greyed-test.cjs` — sekcja B2 + sekcja E zmienione na wiring z `resolveFoundCityLockHint`.
- `gra/tools/city-founding-limit-greyed-fullgame-live-test.cjs` — NOWY, test live w pełnej grze.
- `dyspozycje/autobot/runs/R-WEB-UI-CITY-FOUNDING-LIMIT-GREYED-OUT-Q1/30-obrona-claude.md` — ten raport.
- Nie zmieniano: `buildModeHud.ts` (poprzednia runda bez zmian), reguł limitu, AI, `gra-robocza`, `gra-kanon`, `WERSJE.md`. `gra/node_modules` zainstalowane `npm ci --ignore-scripts` (katalog ignorowany przez git, nie w commicie).

## Uwagi dla orkiestratora (poza zakresem)
- Menu startowe `.civ-menu` zasłania grę po `?skipMenuRedirect=1` w bundlu harnessu `test-hook-setcitylimit-live-bundle.cjs` — inne testy live mogą natrafić na to samo (obecnie przechodzą, bo nie klikają w pasek narzędzi).
- Odświeżenie stanu limitu po awansie epoki nie jest sprawdzone w grze (patrz zarzut 3).

## RUNDY
Runda 1/5 (obrona). Zarzuty 1–3 odpowiedziane: 1 przyjęty (kod + testy), 2 przyjęty (dowód live), 3 częściowo (pomiar, bez wyzwalacza przy epoce).

NASTĘPNY KROK: Evaluator — weryfikacja rundy 2 (test live PASS=10, mutacje A/B czerwone, bramki zielone).
DEPLOY/PUSH: NIE WYKONANO
