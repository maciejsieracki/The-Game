# R-WEB-TEST-CHROME-HELPER-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK (część weryfikacji live zablokowana; migracja zrobiona i zacommitowana)
DOMAIN: PROCESS/GAME-TESTY
TEMAT: R-WEB-TEST-CHROME-HELPER-Q1
GOAL: wspólny helper ścieżki Chrome dla testów live (CHROME_PATH → /usr/bin/google-chrome → /usr/bin/chromium) i migracja testów zaszywających /usr/bin/chromium; sprawdzenie czerwonej fazy load testu zapisu.
BAZA: 8f50028c3 (origin/main), checkout detach.

## 1. Helper (krok 1)
`gra/tools/_chrome-path.cjs` (dodany w R-WEB-TEST-DEBT-Q12) eksportuje `resolveChromePath()`.
Kolejność: `CHROME_PATH` → `CHROMIUM_PATH` → `/usr/bin/google-chrome` → `/usr/bin/chromium` (każdy kandydat tylko gdy istnieje na dysku), inaczej `undefined` (domyślna przeglądarka Playwright). Helper nie wymagał zmian.

## 2. Migracja (krok 2)
Skrypt jednorazowy (poza repo, w scratchpadzie) zamienił w `gra/tools/*.cjs` każde dosłowne wystąpienie `'/usr/bin/chromium'` (w kodzie, nie w komentarzach) na:
`(require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')`
Wynik: **129 plików zmienionych, 141 wystąpień**. Fallback `'/usr/bin/chromium'` zostawiony, więc gdy helper nic nie znajdzie, zachowanie jest jak dotąd. Wszystkie 130 plików z tym literałem to `.cjs` (brak `.js`), więc `require` działa.
- `git diff -U0`: 0 zmienionych linii bez `usr/bin/chromium`; każda dodana linia zawiera `resolveChromePath() || '/usr/bin/chromium')`.
- `node --check` na 129 zmienionych plikach: exit 0 (NA dysku, bez uruchomienia).
- Nie zmieniano asercji ani logiki testów; `gra/src`, `gra/data` nietknięte.

Zmienione pliki: lista = `git diff --name-only` w tej gałęzi (129 pozycji).

## 3. Bramki (liczby z surowego wyjścia)
- `tsc --noEmit` (gra/): exit 0, 0 linii wyjścia.
- logic-test.cjs: exit 0, `LOGIC OK (213/213)`.
- tech-tree-test.cjs: exit 0, `tech-tree-test: 20 pass, 0 fail`.
- research-test.cjs: exit 0, `ALL GREEN`.
- combat-test.cjs: exit 0, `All sanity checks passed.`
- unit-replace-test.cjs: exit 0, `WSZYSTKIE TESTY ZIELONE (21/21)`; pozostałe unit-replace-*-test.cjs: archer-slinger 51 OK/0 FAIL, full-cost 40/0, multitype-walk 25 OK/0 FAIL, promotion-table PASS (32 wpisów, 63 krawędzi); army-multi-select: exit 0, część Chromium NIE ZMIERZONO (brak playwright/jsdom w piaskownicy wg wyjścia testu).

## 4. Testy live (krok 3) — NIE ZMIERZONO
Nie uruchomiono żadnego z 12 reprezentatywnych testów live. Powód: testy live wymagają bundla Vite zbudowanego poza repo; komenda `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir` została odrzucona przez mechanizm uprawnień (auto mode classifier) i nie została obejściem zastąpiona. Zgodnie z zasadami nie szukano alternatywnych ścieżek. Bez bundla nie wykonano też fazy `load` testu saveload.

Do wykonania przez orkiestratora / w kolejnej rundzie (po przywróceniu uprawnienia do buildu):
`cd gra && node ./node_modules/vite/bin/vite.js build --outDir <SCRATCH>/b --emptyOutDir`, potem `CHROME_PATH=/usr/bin/google-chrome node tools/<test>.cjs <SCRATCH>`.

## 5. Czerwona faza load (krok 4) — NIE ZMIERZONO
Przyczyna „browser has been closed” w `diplomacy-trade-era-saveload-live-test.cjs` nie została ustalona: brak bundla, brak logu konsoli/pageerror. Nie zgadujemy przyczyny. Kandydat na temat R-WEB-* tylko po pomiarze.

## 6. Stan repo i commit
- Zmiany: 129 plików `gra/tools/*.cjs` (allowlista OK), plus ten raport.
- Nie wykonano: `git add -A`, push, merge, deploy, zmian w `gra/src`/`gra/data`, zmian w `WERSJE.md`.
- Pliki tymczasowe (npm ci, log vite) leżą poza repo w scratchpadzie; `gra/node_modules` jest nieśledzony i nie został dodany do commita.

## NASTĘPNY KROK
1. Zgoda orkiestratora na build bundla poza repo (uprawnienie), potem 12 testów live z `CHROME_PATH=/usr/bin/google-chrome`, jeden Chromium naraz.
2. Faza load `diplomacy-trade-era-saveload-live-test.cjs`: pomiar z logiem pageerror/console; ewentualny błąd gry → kandydat R-WEB-*.

RUNDY: 1/5 (BLOCK bez zakończenia weryfikacji live)
UWAGI-DLA-ORKIESTRATORA: wpis dla zadania #57 (CHROMEHELPER) — migracja zrobiona; reszta czeka na build bundla. Testy `*-live*` w 130 plikach nie były uruchamiane.
DEPLOY/PUSH: NIE WYKONANO
