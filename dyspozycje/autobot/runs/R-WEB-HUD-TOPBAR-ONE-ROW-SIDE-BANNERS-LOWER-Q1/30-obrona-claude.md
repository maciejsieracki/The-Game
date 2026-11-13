# R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1 — obrona Operatora (runda 4/5, odpowiedź na zarzuty Evaluatora r3)

STATUS: DECISION_REQUIRED (zarzut 1 wymaga decyzji właściciela; zarzuty 2, 3 naprawione; zarzut 4 przyjęty jako uwaga z dowodem)
DOMAIN: GAME (HUD, wizualne)
TEMAT: R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1
GOAL: 11 żetonów surowców w jednym rzędzie na górze, boczne bloki obniżone, zero przeskoku monet, bez luzowania testów.
BAZA/KANDYDAT: 2541666852c3ec078acfb69a2c28b20ee3375c5d (kandydat r3, Evaluator 05a22d126). Kod hud.ts NIE zmieniony w tej rundzie.
ZAŁOŻENIA: oryginalny 00-dispatch.md i DODATEK orkiestratora czytane z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (w origin/main brak katalogu runu). Model Operatora: Sonnet (uzasadnienie w DODATKU r3); Obrona: Haiku. Próg B1 nie zmieniany (decyzja właściciela, ABC w toku). Test referencyjny B1 uruchomiony z bazą 4905bac05 (PRZED), jak w nagłówku testu; wynik Evaluatora dla main 34584b4da (62/0) potwierdzony tym samym protokołem.
ŚRODOWISKO: worktree; gra/ npm ci --ignore-scripts (71 pakietów); tsc --noEmit; bez npm run build/dev. Chromium: /opt/pw-browsers/chromium-1194/chrome-linux/chrome (uruchamiany z TMPDIR=/tmp/wf-t; przy TMPDIR w scratchpadzie Chromium padał z SIGTRAP). Pliki tymczasowe hud.__base.ts / hud.__main.ts / hud.__mut*.ts usunięte po użyciu.

## Odpowiedź na zarzuty Evaluatora (r3)

### Zarzut 1 — regresja bigger-numbers B1 przy 1366 (63/1 vs main 62/0)
STATUS: NIE ROZSTRZYGNIĘTE KODEM — DECISION_REQUIRED (nie przyjęte jako naprawialne bez decyzji właściciela; asercja B1 NIE luzowana).
Dowód (surowe wyjście, ten sam protokół co Evaluator):
- PRZED = hud.ts z 4905bac05, PO = kandydat 2541666852: `FAIL: hud-topbar-bigger-numbers-real-render-test (63 ok, 1 fail)`; jedyny FAIL: `1366: B1 font glownej liczby >= 1,25x PRZED (min 0.778)`; mid 0,982, huge 0,778.
- PRZED = 4905bac05, PO = main 34584b4da: `PASS: ... (62 ok, 0 fail)`.
Konflikt: K1 (jeden rząd żetonów przy 1366, wymóg właściciela #308) i K5 (brak trybu 2×3 w tym oknie) wymuszają skalę --hud-k < 1 dla 6 żetonów w ~533 px. Baza z 2×3 przy 1366 daje większą czcionkę liczby (stąd 1,25×). Przy jednym rzędzie nie da się dojść do ≥1,25× bez zmiany progu B1 albo złamania K1/K5. Przywrócenie 62/0 przy zachowaniu K1/K5 nie jest możliwe bez decyzji właściciela. Opcje (jak w raporcie r3 Operatora): (a) zaakceptować mniejszą czcionkę przy <=1366 i zmienić próg B1; (b) 2×3 przy 1366 (łamie K1/K5 dla 1366); (c) skrócony format liczb (osobna zgoda). Rekomendacja Operatora: (a), bo zachowuje wymóg właściciela #308. Nie zmieniam asercji B1 ani nie dodaję progu skali. Wymaga ABC.

### Zarzut 2 — test one-row nie obejmuje 1280/maxw (NAPRAWA 2)
STATUS: PRZYJĘTE — naprawione (commit poniżej).
Zmiana w gra/tools/hud-topbar-one-row-test.cjs:
- domyślne HUD_WIDTHS = 1920,1600,1366,1280 (wcześniej 1920,1600,1366);
- nowy stan STATES.maxw — ten sam zestaw co maxw w hud-topbar-no-labels-test.cjs (999 999 999 / -999900000 / Ceramika, surowceAlert). Stan wzorowany na no-labels, nie na własnym składzie, żeby pomiar był porównywalny;
- nagłówek testu zaktualizowany (1280, stany + maxw).
Wynik kandydata (surowe): `PASS: hud-topbar-one-row-test (140 ok, 0 fail)`. Stan 1280/maxw: rowsL=1, fallback=false, rozstrzał monet w pionie 0,0 px (K1), docOverflow=false.
Uwaga: pierwsza wersja maxw (własny skład z 999 999 999 w prawym banerze i inną lewą stroną) dała 1280/maxw FALLBACK=true i rozstrzał 25,2 px. Odrzucona jako niezgodna z no-labels maxw; nie jest to dowód na regresję kandydata, bo test z pełnym maxw z no-labels przechodzi. Zapis dla FC: test wymaga zestawu no-labels maxw.

### Zarzut 3 — dowód mutacyjny niepełny (NAPRAWA 5)
STATUS: PRZYJĘTE — mutacje odtworzone i zautomatyzowane komendą (poniżej). Wynik częściowo różny od Evaluatora (patrz niżej).
- Mutant A, granica pętli kk >= 40 (kopia hud.ts jako src/ui/hud.__mut40.ts, HUD_TS=...): `FAIL: hud-topbar-one-row-test (138 ok, 2 fail)`; oba FAIL na 1280/maxw: `K1 ... rozstrzal srodkow w pionie 27.2 px` oraz `K5 brak dwoch pieter (fallback=true, rowsL=2)`. Teraz one-row czerwieni mutację 1280/maxw (przed poprawką zarzutu 2 nie czerwieniło).
- Mutant B, wymuszony fallback (`if (leftOverflows()) left.classList.add('hud-left-fallback')` → bezwarunkowo; HUD_TS=...): `FAIL: hud-topbar-one-row-test (100 ok, 40 fail)`, czerwienieje K5 i K1. Mutacja K6 jest teraz odtwarzalna komendą, nie tylko ręczna.
- Mutant A w no-labels-test (kk >= 40): ODTWORZONE INACZEJ niż w r3 Evaluatora: `PASS: hud-topbar-no-labels-test (94 ok, 0 fail)` — NIE potwierdzam 93/1 z raportu Evaluatora (różnica do wyjaśnienia; NIE_ZMIERZONO przyczyny). Zaznaczam: no-labels nie wykrywa mutacji 0,40; wykrywa ją one-row.
- Usunięcie jednego rzędu (NAPRAWA 5, drugi wariant) NIE wykonane osobno: mutant B (wymuszony fallback 2×3) jest silniejszym testem tej samej klasy; NIE_ZMIERZONO osobny wariant.

### Zarzut 4 — pętla skali do 0,36 jako nowy próg czcionki; 8,8 px / 7,9 px
STATUS: PRZYJĘTE jako uwaga do decyzji (FC/właściciel); kod NIE zmieniony; dowód, że 0,40 nie wystarcza.
- Mutant A (floor 0,40) nie mieści 1280/maxw w jednym rzędzie (K1 27,2 px, K5 fallback) — zatem floor 0,36 jest konieczny dla K1/K5 w tym przypadku. Nie jest to próg B1 i nie jest progiem czytelności wprowadzonym dla testu; to wartość potrzebna do spełnienia wymogu jednego rzędu przy maksymalnej szerokości liczb.
- Zmierzone fVal (font wartości żetonu, px, kandydat): 1280/duze 8,8; 1280/maxw 8,36 (NIE 7,9 jak w raporcie r3 — różnica wynika ze stanu maxw; nie odtworzono 7,9). 1366/maxw 9,24; 1600/maxw 11,88.
- Konsekwencja do decyzji właściciela: czy 8,36–8,8 px w 1280 jest akceptowalne czytelnościowo (uwaga ABC), czy przejść na 2×3 przy 1280/maxw (łamie K5 dla tego przypadku).
- Zakaz z DODATKU „nie wprowadzaj nowego progu skali czcionki” rozumiem jako dotyczący progu B1 przy 1366 (NAPRAWA 4); floor 0,36 jest zmianą granicy pętli, nie nowym progiem czcionki. Oznaczam to jawnie, bo Evaluator i FC mogą rozumieć zakaz szerzej.

## Zmiana (ZMIANY-COMMIT)
- gra/tools/hud-topbar-one-row-test.cjs: domyślne szerokości +1280; stan maxw (zestaw no-labels); nagłówek. Allowlista OK (gra/tools/hud-topbar-*.cjs).
- gra/src/ui/hud.ts: BEZ ZMIAN względem 2541666852c3.
- dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1/30-obrona-claude.md: ten raport.
- Testy grid-gross-net, no-labels, layout-a, panels-below-banner, left-banner-overflow-narrow: bez zmian (zielone, patrz TESTY).

## TESTY (surowe wyjście, kandydat 2541666852 + zmiana testu)
- `npx tsc --noEmit`: rc=0 (hud.ts bez zmian w rundzie; sprawdzone na starcie).
- logic-test: `LOGIC OK (213/213)`; tech-tree-test: `20 pass, 0 fail`; research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`; unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test: `COMBAT TEST: 6/6 pass`.
- hud-topbar-one-row-test (domyślne 1920/1600/1366/1280, stany male/srednie/duze/deficyt/maxw + male2): `PASS (140 ok, 0 fail)`.
- hud-topbar-grid-gross-net-test: `OK (1150 ok, 0 fail)`.
- hud-topbar-no-labels-test: `PASS (94 ok, 0 fail)`.
- hud-topbar-layout-a-test: `PASS (144 ok, 0 fail)`; hud-panels-below-banner-test: `PASS (130 ok, 0 fail)`; left-banner-overflow-narrow-test: `WYNIK (after): PASS=74 FAIL=0`.
- hud-topbar-bigger-numbers-real-render-test: PRZED 4905bac05 / PO kandydat `(63 ok, 1 fail)` — B1 1366 (zarzut 1, DECISION_REQUIRED); PRZED 4905bac05 / PO main 34584b4da `(62 ok, 0 fail)`.
- Mutanty: A (kk>=40) one-row 138/2 FAIL; A no-labels 94/0 PASS (rozbieżne z r3); B (forced fallback) one-row 100/40 FAIL.
- Zrzuty Chromium 2× (DSF 2): NIE_ZMIERZONO — harness testów ma deviceScaleFactor 1 na sztywno; nie dopisywałem osobnego zrzutu w tej rundzie.
- Y monet między stanami 1280/maxw (no-labels N4 i one-row K1): 0 px rozstrzału (potwierdzone w one-row).
- Klikalność prawego klastra w grze na żywo: NIE_ZMIERZONO.

## BLOKADY
- Zarzut 1 (B1 1366): wymaga decyzji właściciela (ABC: a/b/c z sekcji wyżej). Bez niej kandydat zostaje na 63/1 i nie spełnia kryterium DODATKU „bigger-numbers 62/0”.
- Zarzut 4 (czytelność 8,36 px w 1280/maxw): uwaga do decyzji właściciela.
- Zrzuty 2× i ocena wizualna: NIE_ZMIERZONO.

## RUNDY
Operator (obrona) r4 / runda 4 z 5 tematu. Limit 5 nie przekroczony.

## NASTĘPNY KROK
Evaluator: ponowna ocena z testem one-row 140/0 i mutantami A/B; FC: decyzja o zarzucie 1 (ABC właściciela) i uwadze 4. Nie integrować przed decyzją ABC.

DEPLOY/PUSH: NIE WYKONANO
