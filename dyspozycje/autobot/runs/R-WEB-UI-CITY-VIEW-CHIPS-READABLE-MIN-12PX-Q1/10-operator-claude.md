# R-WEB-UI-CITY-VIEW-CHIPS-READABLE-MIN-12PX-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-CITY-VIEW-CHIPS-READABLE-MIN-12PX-Q1
GOAL: żetony górnego paska widoku miasta mają mieć co najmniej 12 px; przy wąskim oknie (1280–1366 px) zawijają się do max 2 linii zamiast kurczyć się do ~11 px; przy 1920 px bez regresji (jedna linia jak dziś).

ZMIANY/COMMIT:
- gra/src/ui/cityUxFrame.ts — `fitCityTopChipScale()`: etap 1 = jedna linia, tylko w skali, w której żeton ma co najmniej 12 px (`TOP_CHIP_MIN_PX`); etap 2 = klasa `civ-ux-top-wrap` włącza zawijanie do max 2 linii (`TOP_CHIP_MAX_ROWS`) w największej czytelnej skali; dopiero potem zoom plakietki miasta. CSS: `.civ-ux-top.civ-ux-top-wrap .civ-v-w3-chips-flank{flex-wrap:wrap}`.
- gra/tools/city-view-layout-test.cjs — dodany rozmiar 1600x900; nowe kryterium: żetony ≥ 12 px; ≤ 2 linie na każdym rozmiarze, jedna linia wymagana od 1600 px wzwyż; limit wysokości bocznych paneli 92 px, gdy baner ma 2 linie; mutant = wyłączone zawijanie do 2 linii.
- Nie zmieniano: WERSJE.md, manifest, rust-port, reszta gra/. Plik cityPanel.ts był zmieniany przejściowo i cofnięty (brak diffa).

TESTY:
- BAZA (origin/main b97287c88, ten sam test na plikach bazy): żeton 25.0 px (1920 normal), 25.0 (2000 normal), 23.5 (1600 normal), 16.2 (1366 normal), 15.0 (1280 normal), 19.0 (1920 big), 19.0 (2000 big), 13.7 (1600 big), 11.5 (1366 big, plakietka zoom 0,8), 11.0 (1280 big, plakietka zoom 0,7). Test bazy: PASS=164 FAIL=2 (dwa FAIL = żetony poniżej 12 px w 1366/1280 big).
- PO ZMIANIE: żeton 25.0 px (1920 normal), 25.0 (2000 normal), 23.5 (1600 normal), 16.2 (1366 normal, jedna linia), 15.0 (1280 normal, jedna linia), 19.0 (1920 big), 19.0 (2000 big), 13.7 (1600 big), 16.2 (1366 big, 2 linie, boczne panele zejście do top 84 px), 13.7 (1280 big, 2 linie, top 76 px).
- `node tools/city-view-layout-test.cjs`: PASS=166 FAIL=0.
- `node tools/city-view-layout-test.cjs --mutant` (zawijanie wyłączone): FAIL=2 (żetony wychodzą poza baner w 1366/1280 big) — mutant wykrywa regresję.
- `tools/city-side-panels-below-topbanners-test.cjs`: PASS=61 FAIL=0.
- `tools/left-banner-overflow-narrow-test.cjs`: PASS=74 FAIL=0.
- `tools/kolor-surowce-spojnosc-test.cjs`: 34/34 PASS.
- `tools/hud-miasto-stock-tempo-test.cjs`: 71 passed, 0 failed.
- `tsc --noEmit` (gra/): exit 0.
- `git diff --check`: czysto.
- Zrzuty (obejrzane wizualnie): 1280x720 i 1366x768 przy wartościach „big" — żetony w 2 liniach, czytelne, bez nachodzenia na plakietkę miasta i boczne panele. Zrzuty poza repo: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/city-chips/
- NIE ZMIERZONO: realna gra w pełnej turze (test używa fixture'u, jak poprzednie testy widoku miasta); długa Produkcja/kolejka przy 2 liniach; zmiana rozmiaru okna w locie (test mierzy świeże otwarcie widoku).

BLOKADY: brak.
RUNDY: 1/5

NASTĘPNY KROK: bramki orkiestratora (FC). Do decyzji właściciela (nieblokujące): przy 1280/1366 z normalnymi wartościami żetony zostają w jednej linii w 13,7–16,2 px (drugi wiersz pojawia się dopiero, gdy jedna linia zeszłaby poniżej 12 px). Jeśli właściciel chce zawijania zawsze w tych rozmiarach, to osobna decyzja.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Baza: dispatch podaje kandydata 8df0bc275 (w nagłówku b97287c88). Gałąź 8df0bc275 NIE zawiera kodu FALI 728 (TOP_STACK_MAX_PX=1880, skala żetonów `--civ-top-chip-scale`) — ten kod jest tylko w origin/main (b97287c88). Operator pracował od origin/main b97287c88, bo tam leży kod, który ten temat poprawia. Orkiestrator: sprawdzić przy integracji (`git merge-base --is-ancestor 8df0bc275 origin/main` zwraca brak przodka).
2. W worktree leży gra/node_modules (npm ci --ignore-scripts) — do sprzątnięcia po integracji.
