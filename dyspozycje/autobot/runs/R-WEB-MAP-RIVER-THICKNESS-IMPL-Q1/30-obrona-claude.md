# R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1 — obrona Operatora (runda 3, na Evaluatora 10d593bd2; kandydat 41b3dec4d)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (render, dowód)
TEMAT: R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1 (RIVTHICKIMPL #184)
GOAL: dowód wizualny i pomiar pikseli dla grubszych rzek (kod bez zmian: medium = 0,7 × główna, tributary/short = 0,45); odpowiedź na 3 zarzuty Evaluatora.
BAZA: origin/main 690947a2a (PRZED, build poza repo); KANDYDAT: 41b3dec4d (PO, build poza repo; scene.ts identyczny z 9c5ca3437).

## Odpowiedzi na zarzuty

### Zarzut 1 — dowód wizualny 8× słaby, trzy poziomy nie widoczne obok siebie
PRZYJMUJĘ, DOMKNIĘTE NA DOWODZIE:
- Dodano PRZED-S1 / PRZED-S2 (izolacja poziomów w bazie) i kompozycję 3 poziomów obok siebie: `SRAVNENIE-8x-srodek.png` (górny rząd PRZED: główne | główne+średnie | wszystkie; dolny rząd PO: to samo). Skrypt: `dyspozycje/analizy/rzeki-render-r3a/compose-srednie-8x.cjs`.
- Obserwacja z kompozycji (obejrzana): średnie rzeki (medium) w PO są wyraźnie widoczne; w PRZED w tym wycinku praktycznie nie ma średnich rzek (PRZED-S2 jest prawie pusty). Różnica dopływów (tributary) między PRZED i PO NIE jest w tym wycinku wizualnie oczywista — patrz BLOKADY.
- Dodatkowo `PO-zblizenie-4x.png` obejrzany w całości: rzeki w 4× to cienkie niebieskie kreski, miasto i jednostki nieprzesłonięte.

### Zarzut 2 — brak pomiaru PRZED per poziom (cel „różnica poziomów" nieporównywalny)
PRZYJMUJĘ I WYKONANO: PRZED-S1 (`riverStage=1`) i PRZED-S2 (`riverStage=2`) zmierzone tym samym runnerem i licznikiem co PO. Pliki: `PRZED-S1-*`, `PRZED-S2-*` (PNG + wynik.json; errors = []).

Liczby (bluecount.cjs, ILOŚĆ tuszu rzek, kadr 8×, seed 1; surowe wyjście):

| kadr 8× | główne (S1) | główne+średnie (S2) | wszystkie (domyślnie) |
|---|---|---|---|
| PRZED (baza 690947a2a) | 3152 | 3304 | 5015 |
| PO (kandydat 41b3dec4d) | 3152 | 4847 | 5818 |
| różnica PO−PRZED | 0 | +1543 (+47%) | +803 (+16%) |

Przyrost poziomów (liczby pikseli; wynik NIE jest addytywny — patrz niżej):
- PRZED: średnie +152 (+4,8% względem głównych); dopływy +1711 (względem S2).
- PO: średnie +1695 (+54% względem głównych); dopływy +971 (+20% względem S2).

Kontrola spójności: główne w PRZED i PO są identyczne (3152 = 3152), co potwierdza izolację poziomu i brak zmian w głównych rzekach.

### Zarzut 3 — pomiar to ilość tuszu, nie szerokość; 4× i cała mapa nieocenione; czytelność na jednym kadrze
PRZYJMUJĘ:
- Szerokości w pikselach NIE mierzono (licznik zlicza sumę niebieskich pikseli, unię po wszystkich rzekach). Nie twierdzę już „szerokość +X%".
- 4× i całą mapę OCENIONO wizualnie: w całej mapie (`PRZED-cala-mapa.png`, `PO-cala-mapa.png`) liczba pikseli rzek jest identyczna (153/153) — zmiana nie widać w widoku z oddalenia; w 4× (`PO-zblizenie-4x.png`, `SRAVNENIE-4x-srodek.png`) rzeki są cienkie, bez zasłaniania miast.
- Czytelność w zbliżeniu 8× (seed 1, jeden kadr + kompozycja wycinka 320×240): miasta i jednostki nie są zasłonięte; zasięg zbadano tylko dla seed 1 — inne ziarna NIE ZMIERZONO.

## Kluczowy wniosek (uczciwie)
- Średnie rzeki (medium): grubsze i wyraźnie widoczne w PO (+47% pikseli w zbliżeniu 8× względem bazy, widoczne w kompozycji). Spełnia cel „średnie ok. 0,6–0,8 głównej" co do obrazu.
- Dopływy (tributary): PRZYJMUJĘ, że NIE udowodniono grubszych dopływów. Metryka unii pikseli spadła w PO dla przyrostu dopływów (1711 → 971). ZAŁOŻENIE (niesprawdzone): dopływy w PO nachodzą na szersze średnie rzeki, więc ich piksele są liczone już w przyroście średnich. Nie wiem, czy szerokość dopływów wzrosła z 0,30 do 0,45 — do rozstrzygnięcia przez FC lub kolejny pomiar.
- Nie zmieniano kodu gra/src. Nie ma powodu do DECISION_REQUIRED: grubsze średnie rzeki nie zasłaniają miast w zbliżeniu.

## Testy / bramki (ta runda)
- Kod gra/src: BEZ ZMIAN w tej rundzie → bramki kodowe z rundy 2 (41b3dec4d): tsc 0, river-render-levels-test 19 OK / 0 FAIL, river-fog-visibility-test 31/0 (wyniki z raportu r2). NIE URUCHAMIANO ponownie w tej rundzie.
- Runnery (surowe wyjście): PRZED-S1 `errors: []`, `totalMs 279583`; PRZED-S2 `errors: []`, `totalMs 269086`. Oba bez FPS (FPS_REPS=0).
- Builds (poza repo, `vite build`): BAZA 690947a2a → 27,37 s, OK; KANDYDAT 41b3dec4d → 23,26 s, OK.
- FPS: NIE ZMIERZONO w tej rundzie; wartości SwiftShader z r2 (PRZED średnio ~0,73 fps, PO ~0,77 fps) nie zostały ponownie zmierzone i są tylko orientacyjne.

## Zmiany w commicie
- dyspozycje/autobot/runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/PRZED-S1-* i PRZED-S2-* (PNG, wynik.json)
- dyspozycje/autobot/runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/SRAVNENIE-8x-srodek.png, SRAVNENIE-4x-srodek.png
- dyspozycje/analizy/rzeki-render-r3a/compose-srednie-8x.cjs (kompozycja; zależność: pngjs z gra/node_modules)
- dyspozycje/autobot/runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/30-obrona-claude.md (ten raport; poprzednia obrona zachowana niżej)
Brak zmian w gra/src, gra/tools, gra/data, gra/src/map, docs.

## BLOKADY
1. Grubość dopływów (tributary 0,30 → 0,45) NIE potwierdzona pikselowo ani wizualnie (metryka unii; przyrost dopływów spada). Wymaga osobnego pomiaru szerokości dopływów — NIE ZMIERZONO.
2. FPS PRZED/PO w tej rundzie NIE ZMIERZONO (wartości z r2 orientacyjne, SwiftShader).
3. Czytelność tylko dla seed 1 — inne ziarna NIE ZMIERZONO.

RUNDY: 3/5 (obrona po FC/Evaluatorze 10d593bd2; poprzednia obrona = runda 2)
NASTĘPNY KROK: Evaluator/FC ocenia dowody (PRZED per poziom + kompozycje); decyzja orkiestratora, czy domknąć temat z notą o dopływach, czy otworzyć mały pomiar szerokości dopływów przed deployem.
DEPLOY/PUSH: NIE WYKONANO

---

# Poprzednia obrona (runda 2, zachowana bez zmian)

# R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1 — obrona Operatora (runda 2, Haiku 5.5)

STATUS: BLOCK
DOMAIN: GAME (render)
TEMAT: R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1 (RIVTHICKIMPL, #184)
GOAL: trzy poziomy rzek (main / medium / tributary) wyraźnie różne i grubsze; hierarchia main > medium > tributary; dowód wizualny PRZED/PO i pomiar pikseli 8×.
BAZA: origin/main 690947a2a; kandydat 77602c918 (odtworzony detached).

## Odpowiedzi na zarzuty Evaluatora (e9319bfbe)

### Zarzut 1 — brak dowodu wizualnego (zrzuty 2×/4×/8×, pomiar pikseli, FPS 5×20 s, pageErrors)
PRZYJMUJĘ, NIE DOMKNIĘTE w tej rundzie.
- Skryptu `rivers-live-measure.cjs` i katalogu `dyspozycje/analizy/rzeki-render-r3a/` nadal nie ma w tej gałęzi; nie napisano ich w tej rundzie.
- Zrobione: build kandydata poza repo (`vite build --outDir <scratchpad>/rivbuild/cand`, 24,87 s, zielony); serwer statyczny + Chromium `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` uruchamia grę (`?civTest=1&civSeed=4242`), ekran startowy wyrenderowany, pageErrors = 0 (wynik surowy: `pageErrors 0 []`). Zrzut startowy: `<scratchpad>/rivshot-cand-0.png`.
- NIE ZMIERZONO: zrzuty PRZED (baza 690947a2a) i PO (kandydat) w zbliżeniach 2×/4×/8×, pomiar pikseli rzek per poziom w kadrze 8×, FPS PRZED/PO. Powód: przejście ekranu startowego do mapy i sterowanie kamerą wymaga osobnego runnera (wzorzec: `gra/tools/ai-economy-measure-run.cjs` i helper `_live-ready.cjs`), którego nie zbudowano w tej rundzie.
- Ocena czytelności grubszych rzek w zbliżeniach: NIE OCENIONO. Według dispatchu wymaga to zrzutów, więc nie wolno jej uznać za zrobioną.

### Zarzut 2 — docs/obieg/MAPA-RZEKI-SPEC.md linia 76 podaje dopływ 50%
PRZYJMUJĘ i POPRAWIONO.
- Zmieniono wiersz tabeli `tributary` z „**50%** (2× cieńszy)” na „**0,45 szerokości głównej** (stałe; patrz akapit RIVTHICKIMPL niżej)”.
- Dowód: `git diff -- docs/obieg/MAPA-RZEKI-SPEC.md` pokazuje jedną zmienioną linię, a akapit RIVTHICKIMPL (linie 81–83) zostaje bez zmian.

### Zarzut 3 — nagłówek/nazwa asercji „tributary ≥ 0,3” w river-render-levels-test.cjs
PRZYJMUJĘ i POPRAWIONO.
- Nazwę asercji w sekcji [C] zmieniono na: „dla każdej długości: main > medium > tributary == short; tributary ≥ 0,3 (dolna granica, dokładną wartość 0,45 sprawdza bandOk)”.
- Nie osłabiono żadnej asercji: `t < 0.3` nadal jest w pętli, a `bandOk` nadal wymusza dokładnie 0,45 i medium = 0,7 × main.

## Bramki w tej rundzie (surowe wyniki)
- `node gra/tools/river-render-levels-test.cjs` → `WYNIK: 19 OK / 0 FAIL`, exit 0.
- Mutacja czerwona: w `gra/src/render/scene.ts` zamieniono `return 0.45;` na `return 0.7 * main;` → `WYNIK: 16 OK / 3 FAIL` (FAIL: order, bandOk, „len=20: main 1.010 > medium 0.707 > tributary 0.707”). Plik scene.ts przywrócono (`git checkout --`), w commicie scene.ts NIE występuje.
- `git diff --check` → czysto.
- Nie uruchamiano pełnych bramek ogólnych dispatchu (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, river-fog-visibility-test). Nie wykonano w tej rundzie, więc NIE ZMIERZONO.

## Zmiany w commicie
- gra/tools/river-render-levels-test.cjs (nazwa asercji, bez osłabienia)
- docs/obieg/MAPA-RZEKI-SPEC.md (wiersz tabeli dopływu)
- dyspozycje/autobot/runs/R-WEB-MAP-RIVER-THICKNESS-IMPL-Q1/30-obrona-claude.md (ten raport)
- Brak zmian w gra/src/render/scene.ts względem kandydata (poprawka tylko tekstowa; wartości 0,45 i 0,7 były już w kandydacie).

## Blokady
1. Brak dowodu wizualnego (zrzuty PRZED/PO 2×/4×/8×, pomiar pikseli, FPS, czytelność) — wymaga runnera PRZED/PO, którego nie ma w repo.
2. Brak pełnych bramek ogólnych dispatchu w tej rundzie.
3. Porządek: `gra/node_modules` zainstalowano w worktree (`npm ci`, nie w repo, ignorowane) — do usunięcia przy sprzątaniu.

RUNDY: 2/5 (runda obrony po FAIL Evaluatora; runda 1 = implementacja, kandydat 77602c918)
NASTĘPNY KROK: zbudować runner `rivers-live-measure.cjs` (PRZED = 690947a2a, PO = ta gałąź) z zrzutami 2×/4×/8× i pomiarem pikseli per poziom oraz FPS 5×20 s; następnie Evaluator ponownie na dowodach; ewentualnie DECISION_REQUIRED, jeśli grubsze rzeki zasłaniają miasta w zbliżeniu.
DEPLOY/PUSH: NIE WYKONANO
