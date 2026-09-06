STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-PRAWO-PRZEBUDOWA-SKALI-Q1
GOAL: main.ts (budowa LawBreakdownInput) ma `hasGarnizonBudynek: builtIds.includes('garnizon')`
analogicznie do cityPanel.ts:3150, z dowodem realnego uruchomienia parytetu panel<->silnik.
Ta runda: odpowiedz na zarzut Evaluatora #1 (metoda 3k = ekstrakcja regex + `new Function`,
nie bundlowanie/wykonanie CALEGO main.ts, i brak ujawnienia tego ograniczenia).

ODPOWIEDZ NA ZARZUT #1: PRZYJMUJE (poprawiono z dowodem).
Zarzut jest technicznie trafny: sekcja 3k liczyła wyizolowany fragment wyrażenia przez
`new Function`, nie main.ts jako zbudowany/wykonany moduł. Zweryfikowałem samodzielnie
(niezależnie od Evaluatora): `esbuild.buildSync` na `src/main.ts` bez konfiguracji rzeczywiście
kończy się błędem (brak loaderów .svg/.css/.png, `src/ui/icons/brandAssets.ts` itd.) —
potwierdza to, co Evaluator zgłosił. Poszedłem o krok dalej niż samo przyznanie: dodałem w
3k NOWY, oddzielny dowód — main.ts REALNIE bundluje się esbuildem (async API, bo plugin
wymaga async), z poprawnymi loaderami (`.css`→text, `.svg`→text, `.png`→dataurl) i pluginem
zaślepiającym `src/map/genWorker.ts?worker&inline` (jedyna pozostała przeszkoda po loaderach).
Build uruchamiany w osobnym procesie node (plik tymczasowy w `os.tmpdir()`, sprzątany po
teście), bo plugin esbuild wymaga async API a reszta pliku testowego jest synchroniczna.
Wynik: `BUILD_OK 16015382` (16 015 382 bajty wyjścia) — main.ts kompiluje się w całości.
JAWNIE UJAWNIAM pozostały kompromis (to jest sedno drugiej połowy zarzutu): to nadal NIE
jest wykonanie `boot()`/`evaluateOrderFromBreakdown` w pełnym kontekście gry (pętla ticku
po tysiącach miast, canvas, DOM, world state) — takie uruchomienie wymagałoby pełnego
harnessu symulacji, nieproporcjonalnego do zakresu tej rundy i allowlisty (main.ts: 1 linia,
plik testowy). Metoda regex+`new Function` z 3k zostaje jako praktyczny substytut dla
WARTOŚCI logicznej (co jest testowane i krzyżowo zweryfikowane przez computeLawBreakdown),
a nowa asercja dokłada dowód na poziomie MODUŁU (main.ts jako całość faktycznie się buduje,
nie tylko "trudno to zbudować" bez uzasadnienia dlaczego).
ZMIANY/COMMIT: gra/tools/prawo-przebudowa-skali-test.cjs — w sekcji 3k dodana nowa asercja
(ok. 40 linii): async esbuild.build(main.ts) w podprocesie z loaderami + pluginem stub-worker,
assert `BUILD_OK \d+`. main.ts BEZ ZMIAN w tej rundzie (diff main.ts pusty — 1 linia z rundy
poprzedniej już w HEAD e87d8814, potwierdzone `git diff --stat gra/src/main.ts` = brak wyjścia).
TESTY: `cd gra && node tools/prawo-przebudowa-skali-test.cjs` -> 152 OK, 0 FAIL (wzrost z 151).
Ręczna weryfikacja niezależna od testu: `esbuild.buildSync` bez loaderów/pluginu na main.ts
-> 8 błędów (potwierdza zarzut); z loaderami samymi -> 1 błąd (`?worker&inline` brak default
exportu); z loaderami + plugin stub-worker (async) -> sukces, 16015382 bajtów.
BLOKADY: brak.
RUNDY: 2/5.
NASTĘPNY KROK: commit (test.cjs + ten raport) po jawnych ścieżkach, następnie Evaluator.
DEPLOY/PUSH: NIE WYKONANO
