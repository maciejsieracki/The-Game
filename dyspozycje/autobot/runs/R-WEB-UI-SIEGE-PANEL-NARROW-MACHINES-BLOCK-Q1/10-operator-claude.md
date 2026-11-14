STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-SIEGE-PANEL-NARROW-MACHINES-BLOCK-Q1
GOAL: w oknie 1280x800 i 1366x768 blok „Zbuduj machinę w oblężeniu” (siegeMapPanel.ts, [data-siege-engine-build]) ma być w calosci widoczny bez przewijania wewnątrz bloku dla 1, 2 i 4 odblokowanych typów machin; przyciski akcji zostają widoczne i klikalne, dolny pasek i dock nie są zasłonięte; logika budowy machin bez zmian.
BAZA: fab9a9b75 (origin/main), detached. Dispatch główny (00-dispatch.md) NIE istnieje w origin/main; użyto DODATKU z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch-DODATEK-claude.md).

ZMIANY/COMMIT:
- gra/src/ui/siegeMapPanel.ts: CSS zwartego bloku machin (scope [data-siege-engine-build]: siatka 2 kolumny, mniejsze paddingi/odstępy, font 10px). Każda opcja machiny to komórka `.civ-smp-mach-opt` (przycisk + ewentualny powód), dzięki czemu 2 kolumny nie rozjeżdżają się przy powodach. Tekst przycisku bez zmian (format „Jednostka · koszt ¤ + surowce”; testy recruit-reset, storm i live-verify czytają go). Powód w spanie bez prefiksu nazwy jednostki (nazwa jest na przycisku); tooltip (title) zawiera powód i pełny koszt.
- gra/tools/siege-panel-machines-block-fit-test.cjs (nowy): 3 konfiguracje techów (1 typ: Obróbka drewna; 2 typy: Brązownictwo; 4 typy: trzy techy), 2 okna. Po przewinięciu treści do dołu sprawdza: blok w całości widoczny, bez własnego overflow, nad docem; przyciski akcji w oknie, nad banerem, klikalne (elementFromPoint).
- dyspozycje/autobot/runs/R-WEB-UI-SIEGE-PANEL-NARROW-MACHINES-BLOCK-Q1/10-operator-claude.md (ten raport)
- dyspozycje/autobot/runs/R-WEB-UI-SIEGE-PANEL-NARROW-MACHINES-BLOCK-Q1/evidence/ (4 PNG: before/after 1280x800 i after 1366x768, 4 typy)
COMMIT: SHA w polu sha odpowiedzi (commit na detached HEAD worktree; nie wypchnięto).

POMIAR (surowe wyjście test-skryptu; wysokość bloku machin w px; wysokość widocznej treści panelu = .civ-smp-body):
| okno | typy | PRZED (fab9a9b75) | PO | widoczna treść |
|---|---|---|---|---|
| 1280x800 | 1 | 112 | 106 | 284 |
| 1280x800 | 2 | 166 | 119 | 284 |
| 1280x800 | 4 | 274 | 186 | 284 |
| 1366x768 | 1 | 112 | 106 | 252 |
| 1366x768 | 2 | 166 | 119 | 252 |
| 1366x768 | 4 | 274 | 186 | 252 |

Przed poprawką (baza) test: FAIL dla 4 typów w obu oknach (2 niezaliczone sprawdzenia na okno: „blok w całości widoczny po przewinięciu” i „blok mieści się w oknie z zapasem 16 px”). Po poprawce: PASS we wszystkich 6 konfiguracjach (0 niezaliczonych sprawdzeń). Dowód mutacyjny: wynik zmienił się z FAIL na PASS wyłącznie przez zmianę src/ui/siegeMapPanel.ts (ten sam skrypt testowy, ten sam build tooling).

TESTY (uruchomione na tym commicie, liczby z surowego wyjścia):
- npx tsc --noEmit: exit 0.
- logic-test.cjs: "LOGIC OK (213/213)", exit 0.
- tech-tree-test.cjs: "tech-tree-test: 20 pass, 0 fail", exit 0.
- research-test.cjs: "ALL GREEN", exit 0.
- unit-replace-test.cjs: "WSZYSTKIE TESTY ZIELONE (21/21)", exit 0.
- combat-test.cjs: "All sanity checks passed.", exit 0.
- siege-panel-machines-block-fit-test.cjs: baza FAIL (4 typy, obie okna); po poprawce PASS (6/6 konfiguracji).
- siege-map-panel-bottom-clip-1280x800-test.cjs (istniejący, regresja panelu): po poprawce PASS (1280x800 i 1024x768); przyciski nad banerem, machiny osiągalne przewijaniem.
- git diff --check: czysty.
- Build wykonany przez `npx vite build --outDir <scratchpad>` (bez npm run build/dev). npm ci w gra/ (node_modules, gitignored).

NIE_ZMIERZONO: siege-storm-needs-machines-test i recruit-reset-close-and-siege-visibility-test (czytają ten sam blok) nie były uruchomione w tej rundzie; live-verify-w18-w24 nie uruchomiono (wymaga pełnej gry na żywo).

BLOKADY: brak blokad technicznych. Ograniczenie wymogu opisane w ZAL-1.

ZAŁOŻENIA (luki w dispatchu rozstrzygnięte w raporcie):
- ZAL-1: „bez wewnętrznego przewijania” zinterpretowano jako: blok machin ma być w całości widoczny naraz po przewinięciu treści panelu do dołu, bez własnego przewijania bloku. Przy oknie 800 px widoczna treść panelu ma 284 px, a treść nad blokiem machin (stan, kolejka, statystyki, atakujący) zajmuje ok. 289 px, więc przy scrollTop=0 blok nie mieści się w oknie niezależnie od wysokości samego bloku. Pełne wyeliminowanie przewijania całej treści panelu wymagałoby przebudowy górnej części (statystyki, kolejka) — poza allowlistą tematu; do osobnego tematu ABC.
- ZAL-2: istniejący test siege-map-panel-bottom-clip-1280x800 zakłada, że treść jest przewijalna i machiny są osiągalne przewijaniem; po poprawce nadal tak jest (PASS), więc nie zmieniano go.
- ZAL-3: skrócenie powodów (note) polega na usunięciu prefiksu nazwy jednostki; pełny tekst powodu jest w tooltipie.

RUNDY: 1/5 (Operator, runda 1).
NASTĘPNY KROK: Evaluator (SONNET): weryfikacja mutacyjna testu i decyzja o ZAL-1; po PASS Final Control.
UWAGI-DLA-ORKIESTRATORA: (1) dispatch główny 00-dispatch.md nie istnieje w origin/main, jest tylko DODATEK na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0; (2) build dist wykonano tylko do pomiaru poza repo; (3) tematów poza zakresem nie zgłaszano, nie zakładano sesji.
DEPLOY/PUSH: NIE WYKONANO
