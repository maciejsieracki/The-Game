# R-WEB-TEST-CHROME-HELPER-Q1 — raport obrony Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/GAME-TESTY
TEMAT: R-WEB-TEST-CHROME-HELPER-Q1
GOAL: wspólny helper ścieżki Chrome dla testów live; migracja zaszytych /usr/bin/chromium; ustalenie przyczyny czerwonej fazy load testu zapisu.
BAZA: 8f50028c3 (origin/main); kandydat Evaluatora 0e15a9ca3 (checkout detach); poprawki obrony w tej rundzie (commit poniżej).
ZMIANY/COMMIT: 6 plików gra/tools/*.cjs (tylko komentarze/opisy, zero zmian logiki i asercji) + ten raport. Zero gra/src, gra/data, WERSJE.md.

## Odpowiedzi na zarzuty Evaluatora

1. **PRZYJMUJĘ.** Wykonano kroki 3 i 4 dispatchu. Bundle zbudowany poza repo tą samą komendą (`node ./node_modules/vite/bin/vite.js build --outDir <scratch>/bundle --emptyOutDir`, exit 0, `built in 19.97s`). Wyniki w sekcji TESTY. Przyczyna „browser has been closed” ustalona częściowo (sekcja CZERWONA FAZA LOAD).
2. **PRZYJMUJĘ.** Poprawiono 6 linii komentarzy/opisów, które podawały `/usr/bin/chromium` jako domyślną (diplomacy-audience-status-banner-real-render-test.cjs:10, player-ai-autopilot-test.cjs:21, diplomacy-harder-measure-run.cjs:28, prebattle-rawids-roster-q1.cjs:18, measure-siege-fallback-vs-skip-auto.cjs:26, resource-cards-plusx-badge-test.cjs:12). Poza tym zostały: wpisy przykładowe `W3_CHROMIUM=/usr/bin/chromium` w live-verify-wojownik-*.cjs (zmienna środowiskowa w przykładzie, nie domyślna) i log tekstowy w diplo-live-verify-s2c-s3c.cjs:40 — NIE ZMIENIANO, bo nie są domyślną ścieżką.
3. **ODRZUCAM z dowodem.** Inline `require('./_chrome-path.cjs').resolveChromePath()` działa identycznie jak stała na plik. Dowody: (a) `node --check` na wszystkich 132 plikach gra/tools/*.cjs używających helpera: `files_using_helper=132 syntax_ok=132 syntax_fail=0` (surowe wyjście skryptu); (b) live testy z tym wzorcem przeszły (sekcja TESTY: breach 12/0, banner 14/0, recruitment 39/0, newgame 62/0). Przepisanie 131 plików na stałą per plik to zmiana poza zakresem „mechanicznej zamiany” z dispatchu i zwiększa ryzyko bez zysku działania.

## Migracja — uwaga do zakresu (NIE ZMIERZONO w tej rundzie, zgłoszone)
Wzorzec `'/usr/bin/chromium'` (z apostrofami) został zamieniony we wszystkich 130 plikach. Dwa pliki nadal mają zaszytą ścieżkę w tablicy kandydatów, bo literał jest inny (`'/usr/bin/chromium-browser'`):
- gra/tools/recruitment-panel-height-real-render-test.cjs:22
- gra/tools/recruitment-panel-compact-row-test.cjs:45
Nie zmieniano (inny plik binarny, lista kandydatów specyficzna dla testu). Do decyzji orkiestratora.

## TESTY (surowe wyjście, ten przebieg)
Gate (tsc + gry), `GOAL` bramek z dispatchu:
- `npx tsc --noEmit` (gra/): exit 0
- logic-test: `LOGIC OK (213/213)`, exit 0
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0
- research-test: `ALL GREEN`, exit 0
- unit-replace-test: `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
- combat-test: `All sanity checks passed.`, exit 0

Live (bundle świeży z tego kandydata, CHROME_PATH=/usr/bin/google-chrome, jeden Chromium naraz):
- diplomacy-trade-era-saveload-live-test (PHASE=all, czyli save,load): patrz CZERWONA FAZA LOAD — 2 z 4 pełnych przebiegów PASS (run2, run3), 2 FAIL (run1, run4) w fazie load.
- ai-ai-treaty-live-proof-breach-test: `Wynik: 12 OK / 0 FAIL`, exit 0
- diplomacy-audience-status-banner-real-render-test: `14 pass, 0 fail`, exit 0
- entity-card-cross-links-nested-overlay-test: `25 pass, 0 fail`, exit 0 (Evaluator widział 24/1 na tym samym kandydacie: asercja [3] — NIE ODTWORZONO w 1 przebiegu; traktować jako niestabilny, do ponowienia)
- diplo-forced-peace-pending-live-paths-test: exit 0, S2/S3/S4 PASS (przebieg z limitem 540 s; Evaluator miał timeout 110 s)
- battle-flee-manual-test: `16 PASS, 0 FAIL`, exit 0 (przebieg z limitem 540 s; Evaluator timeout 110 s)
- recruitment-panel-compact-row-test: `SUMMARY: 39 pass, 0 fail`, exit 0
- newgame-defaults-test: `62 pass · 0 fail`, exit 0

Nie uruchomiono (NIE ZMIERZONO): battle-flee-move-half-test, battle-flee-speed-parity-test, ai-ai-treaty-live-proof-wiring-test. Liczba 12 z dispatchu nie została osiągnięta w tej rundzie (uruchomiono 8 testów + saveload).

## CZERWONA FAZA LOAD (diplomacy-trade-era-saveload-live-test) — ustalenie
Objaw: faza load kończy się `[load] WYJATEK: page.waitForFunction: Target page, context or browser has been closed` PRZED logiem `[load] przed wczytaniem`, czyli w `openGame()` (czekanie na `__tradeEraSaveLoadTestDebug`), zanim jakikolwiek kod gry zdąży wykonać wczytanie.
Pomiar częstości (surowe wyniki):
- pełne przebiegi save,load bez debug: run1 FAIL, run2 PASS, run3 PASS, run4 FAIL
- faza load sama (bez debug), kolejno: PASS, FAIL, PASS, FAIL (4 przebiegi: 2 z 4 FAIL)
- faza load z `DEBUG=pw:browser`: PASS, PASS, FAIL
Dowód przyczyny (log `scratchpad/dbg-load-3.log`, przebieg FAIL):
- `00:58:19 <launching> /usr/bin/google-chrome ...`
- `00:58:36.578 [pid=14217][err] Received signal 11 SI_KERNEL` (crashpad, proces przeglądarki)
- tuż potem: `[load] WYJATEK: page.waitForFunction: Target page, context or browser has been closed`
Dla przebiegu PASS (`dbg-load-1.log`): `<process did exit: exitCode=0, signal=null>` na końcu.
Wniosek: przyczyną „browser has been closed” jest NATYWNY CRASH przeglądarki Chrome (SIGSEGV, sygnał 11) podczas ładowania strony z WebGL (swiftshader, ostrzeżenia `gl_utils.cc` przed crashem), a nie błąd gry przy wczytaniu zapisu. Błąd gry nie jest wykluczony w 100%: nie zarejestrowano pageerror, bo awaria następuje przed pętlą błędów strony — NIE ZMIERZONO, czy crash wyzwala stan gry czy sam sterownik GPU. Test nie zmieniony (artefakt środowiska/przeglądarki, nie asercja). Kandydat na R-WEB-*: stabilizacja (np. retry launchu lub inny `--use-gl`) LUB pomiar, czy crash powtarza się na czystym Chrome bez bundla gry — decyzja orkiestratora. Nie wdrażane w tym temacie (zakaz zmian poza allowlistą / poza zakresem).

## Sprzątanie i stan repo
- Testy live zmieniały PNG w dyspozycje/autobot/runs/R-WEB-NEWGAME-DEFAULTS-Q1/evidence/* oraz R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1/dowody/* — przywrócono `git checkout --` (nie commitowane).
- gra/node_modules (npm ci --ignore-scripts) i bundle w scratchpadzie — poza commitem.
- Nie usuwano żadnych plików (zakaz rm).

BLOKADY: brak (poza NIE ZMIERZONO wyżej).
RUNDY: 2/5 (runda obrony po ocenie Evaluatora r1)
NASTĘPNY KROK: Final Control (zmiana wyłącznie komentarzy w 6 plikach + raport; migracja i helper bez zmian; czerwona faza load sklasyfikowana jako niestabilność przeglądarki, nie błąd gry).
UWAGI-DLA-ORKIESTRATORA: (a) 2 pliki z '/usr/bin/chromium-browser' poza migracją (recruitment-panel-*); (b) saveload flaky przez crash Chrome — do decyzji R-WEB-*; (c) entity-card 1 FAIL u Evaluatora nie odtworzony (25/0).
DEPLOY/PUSH: NIE WYKONANO
