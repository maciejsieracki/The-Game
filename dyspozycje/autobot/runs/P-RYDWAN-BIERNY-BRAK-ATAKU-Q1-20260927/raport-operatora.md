STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-RYDWAN-BIERNY-BRAK-ATAKU-Q1-20260927
GOAL: Jednostki rydwanów/flankujące aktywnie atakują lub zbliżają się do osiągalnego wroga zamiast pozostawać odroczone przez koncentrację armii.

PRZYCZYNA ŹRÓDŁOWA:
W `gra/src/game/ai.ts` planArmyConcentration mógł wybrać rydwan jako kotwicę zbiórki. Taki rydwan trafiał do `deferredUnitIds`, a pętla decyzji pomijała go przed blokiem ataku (`continue`), więc przy sąsiednim lub osiągalnym wrogu nie wykonywał żadnej akcji bojowej. Dodatkowo zwykła ścieżka AI nie miała gałęzi, która kierowała rydwan bezpośrednio do widocznej wrogiej jednostki, gdy nie było celu-miasta.

ZMIANY/COMMIT:
- `gra/src/game/ai.ts:3047-3056`: dodano rozpoznawanie jednostek flankujących na podstawie kategorii `rydwan`/`konnica` oraz roli `Flanka` z danych jednostki.
- `gra/src/game/ai.ts:3333-3353`: przy widocznym, angażowalnym wrogu jednostki flankujące są wyłączane z koncentracji/front-merge, aby priorytet zachowania bojowego nie był zastępowany oczekiwaniem na stos.
- `gra/src/game/ai.ts:3544-3561`: dodano ruch flankera do najbliższej widocznej jednostki wroga, jeżeli cel mieści się w bieżącym zasięgu ruchu; warunek używa autorytatywnego `unit.ruchLeft`, a atak sąsiedniego celu pozostaje wcześniejszym priorytetem.
- `gra/tools/rydwan-bierny-atak-test.cjs`: test regresyjny obejmuje 4 scenariusze / 6 asercji, w tym częściowy ruch `ruchLeft=1`, `ruch=4`, cel odległy o 4 heksy.
- Nie zmieniono `gra/data/units.json`, statystyk jednostek, `main.ts`, `WERSJE.md` ani plików deploy.
- Brak commita, merge, push i deploy — zgodnie z zakresem karty.

TESTY:
- `node --check tools/rydwan-bierny-atak-test.cjs` — PASS.
- `node tools/rydwan-bierny-atak-test.cjs` — PASS, 6 passed / 0 failed.
  - rydwan-kotwica atakuje sąsiedniego wroga zamiast być odroczony przez koncentrację;
  - rydwan bez celu-miasta zbliża się do wroga w zasięgu ruchu;
  - wróg poza zasięgiem ruchu nie wymusza ofensywnego pościgu;
  - częściowy pozostały ruch nie jest błędnie rozszerzany do maksymalnego ruchu jednostki.
- `node ./node_modules/typescript/bin/tsc --noEmit` — PASS.
- `node tools/army-concentration-test.cjs` — PASS, 55/55.
- `node tools/siege-ai-test.cjs` — PASS, 17/17.
- `node tools/combat-test.cjs` — PASS, 6/6.
- `node tools/ai-home-defense-vs-barbarians-test.cjs` — PASS, 42/42.
- `node tools/ai-zdobycie-miasta-adiacencja-test.cjs` — 94/96; 2 istniejące asercje tekstowe A5d/A6c dotyczące bramki obrońców są czerwone i nie dotyczą zmienionego `ai.ts`.
- `node tools/ai-test.cjs` — 290/295; 5 czerwonych asercji dotyczy fallbacku parametrów trudności i handlu/dyplomacji, poza ścieżką rydwanów zmienioną w tej karcie.
- `git diff --check` — PASS.

BLOKADY:
- Behavior-specific smoke Chromium nie został wykonany. Dostępna jest binarka Playwright Chromium (`/home/ubuntu/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`); próba uruchomienia tymczasowego fixture z realnym bundlem AI zakończyła się przed renderem błędem składni bundla (`Invalid or unexpected token`), więc nie ma dowodu wizualnego ruchu rydwanu w prawdziwej partii. Wcześniejszy bezpośredni smoke Vite/JSDOM zakończył się `SMOKE OK`; nie uruchamiano `npm run dev`/`npm run build`.
- Pełne istniejące `ai-test.cjs` i `ai-zdobycie-miasta-adiacencja-test.cjs` nie są całkowicie zielone z powodów niezwiązanych z poprawką; wymagają niezależnego porównania przez Evaluatora.
- W worktree istniał wcześniej nieśledzony `DYSPOZYCJA-RYDWAN-BIERNY.md`; nie był modyfikowany.

- RUNDY: 2/5
NASTĘPNY KROK: Evaluator ma niezależnie sprawdzić diff/allowlistę, powtórzyć test rydwanu, typecheck i bramki regresji oraz rozstrzygnąć dwa istniejące zestawy czerwonych asercji; po dostępności dozwolonego Chromium wykonać smoke runtime.
DEPLOY/PUSH: NIE WYKONANO
