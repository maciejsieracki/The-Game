# Evidence — R-KREATOR-DOLNA-NAWIGACJA-Q1 — Evaluator

Run: `5` (Kanban current run)
Evaluator task: `t_619d212a`
Evaluator round/attempt: `1/1`
Evaluator HEAD: `da5b901d2de2dec6c5900343f65ff097ea91210b`
Evaluator BASE_HEAD: `6af03c01939834b0876507a4e001275453528a06`
Operator source HEAD: `6af03c01939834b0876507a4e001275453528a06`
Operator base HEAD: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
Branch/worktree: `hermes/R-KREATOR-DOLNA-NAWIGACJA-Q1` / `/home/ubuntu/projects/The-Game-worktrees/R-KREATOR-DOLNA-NAWIGACJA-Q1-bugs`

1. Readback zadania i zakresu

Odczytano bieżącą kartę `t_619d212a`, dispatch `02-dispatch.md`, kartę rodzica `t_05185782`, raport/evidence/progress/journal/receipt Operatora, rzeczywisty Git oraz źródło `newGameFlow.ts` i kanoniczny test regresji. Dispatch zabrania zmian produktu, testu Operatora, pushu, PR, merge i deployu; artefakty Evaluatora są ograniczone do pięciu plików w katalogu runu.

`git status --short --untracked-files=all` przed zapisaniem artefaktów Evaluatora wykazał wyłącznie:

```text
?? dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/01-operator-evidence.md
?? dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/01-operator.md
?? dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/journal.md
?? dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/progress.json
?? dyspozycje/autobot/runs/R-KREATOR-DOLNA-NAWIGACJA-Q1/transition-receipt.json
?? gra/tools/newgame-bottom-navigation-test.cjs
```

`git diff --name-status 6af03c01939834b0876507a4e001275453528a06 HEAD --` zawiera tylko oczekiwany, procesowy `02-dispatch.md`. `git diff` dla `gra/src` oraz `gra/src/ui/newGameFlow.ts` jest pusty; `git merge-base --is-ancestor` potwierdził oba BASE_HEAD (Operatora i Evaluatora) w historii HEAD. Nie znaleziono sekretów ani podejrzanych wzorców w nowym teście.

2. Odpowiedzialny DOM/CSS i ścieżka zdarzeń

Cold read `gra/src/ui/newGameFlow.ts`:

```text
842       .civ-newgame{position:fixed;inset:0;...overflow:auto;...}
966       .sett-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));...align-items:stretch;}
975       .sett-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,300px);...align-items:start;}
1009      .nav{...display:flex;justify-content:space-between;align-items:center;...max-width:1000px;width:100%;margin-left:auto;margin-right:auto;}
1042-1047 .ai-civ-panel{...display:flex;...overflow:hidden}; .ai-civ-scroll{flex:1;...overflow-y:auto}; .ai-civ-grid{...grid-template-columns:repeat(2,1fr);}
1630-1681 renderAiCivPicker(): panel AI jest bezpośrednim drugim dzieckiem .sett-layout; lista jest w .ai-civ-scroll.
1698-1703 renderSettStep(): .sett-grid i panel AI są montowane obok siebie w .sett-layout.
1741-1747 renderSettStep(): przycisk Start; przy wyłączonym hot-seat ustawia curStep=5 i renderuje.
2050-2084 render(): .nav tylko dla curStep 2–4; Dalej tylko dla curStep 2–3; Wstecz dla 2–4.
2101-2107 syncSettLayoutHeight(): po montażu mierzy .sett-grid i ustawia panelowi AI max-height.
```

To jest dokładny aktualny kontrakt: nadmiar kart AI przewija się w kolumnie panelu, nie wypycha `Start` ani `.nav` poza root.

3. Niezależny real-browser runtime

Komenda:

```text
PLAYWRIGHT_BROWSERS_PATH=/home/ubuntu/.cache/ms-playwright node tools/newgame-bottom-navigation-test.cjs
```

Uruchomiono kanoniczny test na świeżo zbudowanym bundlu, z prawdziwym Chromium. Nie ma systemowego `chromium`/`google-chrome`; użyty fallback został sprawdzony osobno:

```text
/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
Google Chrome for Testing 151.0.7922.34
```

Wynik procesu: `exit=0`; log miał 99 linii, sekcje `2K DCI (2048x1080, deviceScaleFactor=1)` i `4K UHD (3840x2160, deviceScaleFactor=1)`, końcówka `70 pass · 0 fail`, jedna linia fallbacku, zero linii błędów konsoli.

2K DCI, deviceScaleFactor=1:

```text
window.devicePixelRatio = 1
Wstecz/Dalej krok 2: top=561.765625, bottom=597.765625, disabled=false, fullyInViewport=true, hitByCenter=true
Wstecz/Dalej krok 3: top=927.03125, bottom=963.03125, disabled=false, fullyInViewport=true, hitByCenter=true
.civ-newgame .nav: left=524, top=857.328125, right=1524, bottom=910.328125, width=1000, height=53
Start: top=754.953125, bottom=800.953125, width=332.59375, height=46, disabled=false, fullyInViewport=true, hitByCenter=true
root: scrollTop=0, scrollHeight=1080, clientHeight=1080
selected AI: 5/5
```

4K UHD, deviceScaleFactor=1:

```text
window.devicePixelRatio = 1
Wstecz/Dalej krok 2: top=561.765625, bottom=597.765625, disabled=false, fullyInViewport=true, hitByCenter=true
Wstecz/Dalej krok 3: top=927.03125, bottom=963.03125, disabled=false, fullyInViewport=true, hitByCenter=true
.civ-newgame .nav: left=1420, top=857.328125, right=2420, bottom=910.328125, width=1000, height=53
Start: top=754.953125, bottom=800.953125, width=332.59375, height=46, disabled=false, fullyInViewport=true, hitByCenter=true
root: scrollTop=0, scrollHeight=2160, clientHeight=2160
selected AI: 5/5
```

W kanonicznym logu selektor to `.civ-newgame .nav`. Runtime sprawdził również brak `.nav` na Intro, powrót Wstecz z Epoki do Intro, powrót Wstecz z Cywilizacji do Epoki, brak `Dalej` na kroku 4, Wstecz po stanie 5/5, kliknięcie Start i ukrycie kreatora przez realną ścieżkę callbacku. `console.error`/`pageerror`: 0.

4. Czułość na mutację

Nie zmieniając pliku kanonicznego, utworzono tymczasową kopię testu w `gra/tools/.r-kreator-evaluator-mutant.cjs`, dodano CSS `display:none !important` dla `.civ-newgame .nav` przed asercją używalności i wykonano `node --check`.

```text
node --check tools/.r-kreator-evaluator-mutant.cjs -> exit 0
CIV_CHROME_PATH=<zweryfikowany fallback> node tools/.r-kreator-evaluator-mutant.cjs -> exit 1 (oczekiwane)
Wykryte FAIL: ukryty Wstecz, ukryta nawigacja, hit-test; następnie timeout kliknięcia ukrytego Wstecz.
```

Mutant został usunięty po próbie; kanoniczny test pozostał bez zmian. Ten wynik dowodzi, że oracla `fullyInViewport`/`hitByCenter` nie są tautologią.

5. Bramki statyczne i referencyjne

```text
node --check tools/newgame-bottom-navigation-test.cjs                         -> exit 0
node ./node_modules/typescript/bin/tsc --noEmit                              -> exit 0, 0 błędów
node ./node_modules/vite/bin/vite.js build --outDir /tmp/r-kreator-evaluator-build --emptyOutDir
                                                                                -> exit 0, 888 modułów, 28.49 s
node tools/tech-tree-test.cjs                                                 -> 19 pass, 0 fail, exit 0
node tools/research-test.cjs                                                  -> 33 pass, 0 fail, exit 0
git diff --check 6af03c01939834b0876507a4e001275453528a06 --                  -> czysto
```

6. Pre-existing baseline notes

Dla rozdzielenia czerwonych testów bazowych od tematu uruchomiono niezależnie:

```text
node tools/start-preview-test.cjs                                             -> exit 1, 1 passed, 5 failed
node tools/ruch-swiata-tempo-test.cjs                                         -> exit 1, 33 zaliczone, 2 niezaliczone
```

Oba testy dotyczą innych obszarów (`start-preview`/dane nazw oraz ruch świata/save), nie zmienionych w tej paczce. Dodatkowo istniejący `newgame-sett-grid-layout-test.cjs` uruchomiono przez tymczasową kopię wyłącznie z poprawioną ścieżką Chromium (oryginał nietknięty): `node --check` exit 0, runtime `66 pass · 4 fail`, wszystkie cztery czerwone asercje są tym samym nieaktualnym porównaniem `sett-layout -> start-preview = 16.00 px` do `start-preview -> kontener sett-actions = 59.59 px`. Mutacje B1/B2 tego testu wykonały się, a problem nie jest asercją widoczności `.nav`.

Po testach usunięto wszystkie tymczasowe kopie i wygenerowane helpery; nie ma ich w worktree.

7. Provenance artefaktów Operatora

Niezależnie przeliczone hashe:

```text
gra/src/ui/newGameFlow.ts                                                       7ba486932b017a8f271d339f289ebb957c6c0498d18b20747962d2b3c6464113
gra/tools/newgame-bottom-navigation-test.cjs                                    8620ece3115a71bfe117496b6ce3204ea53b551420f3a8a4a3214cd338a844c7
dyspozycje/.../01-operator.md                                                    b72ba7159f05578e81e2f75fd1201048d8328c614f9fdbc976df022693460d3d
dyspozycje/.../01-operator-evidence.md                                           0c68bbd35690e6cf54fb2889e1089dfe45069bc7269d062b61992578a986d58c
dyspozycje/.../runtime.log                                                      d7b7156d825b6ec02133b90f975de43d11944ff2549b03faf2ad3e9a3bb16fd8
dyspozycje/.../build.log                                                        6cdd7cf3e34a1cc1fa0b7d7e5f7a7db6fba7582c708c355a5f1a235156e6a438
```

Receipt Operatora zawiera te same report/evidence SHA-256; JSON receipt i progress są poprawne składniowo. Nie zmieniono żadnego artefaktu Operatora.

8. Run consistency i werdykt

Readback `kanban_show(t_05185782)`:

```text
run 2: status=review, outcome=review_requested; event review_requested run_id=2
run 3: status=done, outcome=completed; claim source_status=review; event completed run_id=3
```

`transition-receipt.json` Operatora ma `source_run_id=2`, `source_task_id=t_05185782`, `phase=operator`, `round=1`, `attempt=1`, `status=PASS-WITH-NOTES`, ten sam topic/HEAD/branch/worktree oraz zgodne hashe raportu i evidence. Receipt jest potwierdzeniem źródłowego handoffu run 2 do review; run 3 jest osobnym terminalnym odczytem/akceptacją tej samej paczki po przejęciu statusu `review`. Numery runów różnią się zgodnie z fazą, a nie przez zmianę tematu lub artefaktu. Lista zarzutów Evaluatora: `[]`.

Wniosek: aktualny problem dolnej nawigacji jest negatywnie zweryfikowany; produkcja pozostaje bez zmian. Etap może przejść do Final Control. Integracja, push, PR, merge i deploy nie zostały wykonane.
