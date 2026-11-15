# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1
GOAL: (1) zrzuty Chromium karty „Skąd zapasy” (sól, ceramika; 1280 i 1920 px) w trakcie gry; (2) dokumentacja (hasło encyklopedii, PORADNIK, regeneracja wikiBundle); (3) pomiar wydajności tury 100 tur (mediana ≥5, przed/po księdze); (4) diagnoza endTurn timeout przy turze 57; (5) pomiar zachowania `<details open>` przy przerysowaniu karty.

## Założenia (ZAŁOŻENIE Operatora, do potwierdzenia przez orkiestratora)

- Dispatch podaje bazę `1947a3a33` (origin/main), ale ta baza NIE zawiera części A: brak `gra/src/game/resource-ledger.ts` i `gra/src/ui/resourceSourceLedgerHtml.ts`. Część A (FC `2ebd3c189`) jest ancestorem `origin/main` (807ecebdd), więc dispatch („baza = origin/main po wdrożeniu części A”) wskazuje na bazę zawierającą część A.
- Przyjęto bazę **origin/main = 807ecebdd** (detached HEAD). Pracę wykonano na niej.
- Dispatch i DODATEK znajdują się na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` w `dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1/` (nie na origin/main).

## Wykonane (DOCS, GOAL 2)

- Nowe hasło: `docs/encyklopedia/pojecia/skad-zapasy.md` (metadane, Wiki-S, Wiki-M, sekcja „Jak czytać”, ograniczenia, historia).
- Wpis w `docs/encyklopedia/indeks.md` (sekcja Pojęcia).
- Nowa sekcja `## 53a. Skąd zapasy` w `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md` (przed „Ekonomia w jednej tabeli”).
- Regeneracja: `node gra/tools/bundle-wiki-for-game.cjs` → `wikiBundle.json: 22 rozdz. + 183 haseł (~1295 KB)`; diff `gra/src/data/wikiBundle.json` to 1 linia (JSON w jednej linii).
- Wartość `ksiega_zasobow_tury` = 10 (odczytana z `gra/data/econ-params.json`, poziomy easy/normal/hard).

## Bramki (liczby z surowego wyjścia)

- `npm ci` w `gra/`: `added 71 packages`.
- Build poza repo (`vite.js build --outDir <scratchpad>/civ-dist`): `✓ built in 19.97s`, rc=0.
- `tsc --noEmit -p gra/tsconfig.json`: rc=0 (bez wyjścia).
- `node gra/tools/resource-ledger-skad-ui-test.cjs`: `18 passed, 0 failed`.
- `node gra/tools/resource-ledger-test.cjs`: `1030 passed, 0 failed`.
- `git diff --check` i `git diff --cached --check`: rc=0.
- Pełny zestaw „5 bramek” z dispatchu: NIE_ZMIERZONO (uruchomiono tylko powyższe).

## NIE wykonane / NIE_ZMIERZONO

- GOAL 1 (zrzuty Chromium): NIE wykonano. Wymaga przejścia do karty surowca w realnej grze (sól, ceramika) i dwóch rozmiarów okna; bez tego nie ma dowodu w `evidence/`. Punkt wyjścia do następnej rundy: `gra/tools/resource-ledger-live-measure.cjs` (headless Chromium, `?civTest=1`), ale jego zakres to zgodność księgi, nie zrzuty karty.
- GOAL 3 (pomiar wydajności 100 tur, mediana ≥5 przed/po księdze): NIE wykonano. Narzędzie: `gra/tools/longrun-100-turns-leak-q1-measure.cjs` (`--prepare`, build, `--run`, zapis JSONL per tura). Jeden przebieg 100 tur nie mieści się w jednym wywołaniu Bash (limit 590 s, bez background). Brak też wariantu „przed księgą” (wymaga osobnego builda z bazy sprzed części A).
- GOAL 4 (diagnoza endTurn timeout, tura 57): NIE wykonano. Brak przebiegu 100 tur, więc nie ma dowodu, czy przyczyna to księga, harness czy baza.
- GOAL 5 (`<details open>` przy przerysowaniu): NIE_ZMIERZONO (wymaga przerysowania karty w realnym DOM).

## Zmiany (commit)

- `docs/encyklopedia/pojecia/skad-zapasy.md` (nowy)
- `docs/encyklopedia/indeks.md`
- `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md`
- `gra/src/data/wikiBundle.json`
- `dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1/10-operator-claude.md` (ten raport)

Allowlista: wszystkie pliki mieszczą się w allowliście dispatchu (`docs/encyklopedia/**`, `docs/PORADNIK-GRACZA/**`, `gra/src/data/wikiBundle.json`, `runs/<ID>/**`). Nie zmieniono `gra/src/game/resource-ledger.ts`, `resourceSourceLedgerHtml.ts`, `empireDetailPanel.ts`, `gra/tools/*`, WERSJE.md, manifestu ani rust-port.

## BLOKADY

- Zakres rundy 1 nie obejmuje GOAL 1, 3, 4, 5. Wykonano GOAL 2 (dokumentacja).
- Pomiary 100 tur wymagają ponad 10 min łącznego czasu przebiegu, który trzeba rozbić na kilka wywołań albo uruchomić poza Bash (zakaz run_in_background). Wymaga decyzji orkiestratora o trybie uruchomienia.
- Rozbieżność bazy (dispatch 1947a3a33 vs część A) wymaga potwierdzenia.

## RUNDY

1/5. Ostatni werdykt: brak (Operator). Decyzja wymagana: potwierdzić bazę (origin/main 807ecebdd) i sposób uruchomienia pomiarów 100 tur.

## NASTĘPNY KROK

Runda 2 (Operator, ten sam ID): (a) zrzuty Chromium soli i ceramiki w `runs/<ID>/evidence/` (1280 i 1920 px); (b) pomiar `longrun-100-turns-leak-q1-measure.cjs` w kawałkach lub poza Bash, mediana ≥5 ON vs OFF (`setRecording(false)`); (c) diagnoza endTurn tura 57 z porównaniem bazy sprzed księgi; (d) test `<details open>`. Ponowna regeneracja wikiBundle nie jest potrzebna, jeśli treść poradnika/encyklopedii się nie zmieni.

DEPLOY/PUSH: NIE WYKONANO
