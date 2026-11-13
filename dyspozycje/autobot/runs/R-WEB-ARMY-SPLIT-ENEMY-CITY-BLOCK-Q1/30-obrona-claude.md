STATUS: PASS-WITH-NOTES (obrona r1; zarzut 1 PRZYJĘTY i domknięty; zarzut 2 NIE_ZMIERZONO, DECISION_REQUIRED)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-SPLIT-ENEMY-CITY-BLOCK-Q1
GOAL: rozdzielenie armii / ruch pod-stosu nie może wejść na obce miasto ani heks z obcą jednostką; własne miasto i jednostki bez zmian.
BAZA: 8e19fc70ac20c8dc90844b67663b709401dc57e2 (kandydat Operatora, rodzic aeb52465e)
ZMIANY/COMMIT: 7c40040ddf88347c0f14afcb94443d67355b6063 — tylko gra/tools/army-split-enemy-city-block-test.cjs (dopisana sekcja G: test źródłowy wpięcia w main.ts). Kod gry (armyMerge.ts, main.ts) bez zmian względem kandydata. Allowlista zachowana. Brak zmian w gra/data, WERSJE.md, armySplitPanel.ts.

## Odpowiedzi na zarzuty Evaluatora
1. ZARZUT 1 (wpięcie w main.ts nie chronione testem) — PRZYJMUJĘ. Dodano scenariusz G: odczyt src/main.ts i asercje: 3 wywołania findSplitDestHexes, każde z predykatem splitTargetPassable; splitTargetPassable(isHexPassableForUnit, active|u.ownerId, cities) wystąpi 3 razy; guard onSplit (canUnitOccupyCityHex + komunikat „Nie można rozdzielić armii na obce miasto."); etykieta „Miasto przeciwnika" w splitNeighbors.
   Dowód mutacji B (cofnięcie wpięcia w jednym z wywołań main.ts, linia 26120 na isHexPassableForUnit, po czym przywrócono plik z kopii; git status czysty):
   surowe wyjście: `FAIL: main.ts ma 3 wywołania findSplitDestHexes (znaleziono 2)`, `FAIL: splitTargetPassable(isHexPassableForUnit, <owner>, cities) wystąpi 3 razy (znaleziono 2)`, `Wynik: 12 PASS, 2 FAIL`, EXIT=1.
   Po przywróceniu: `Wynik: 14 PASS, 0 FAIL`, EXIT=0.
2. ZARZUT 2 (brak dowodu w Chromium) — NIE_ZMIERZONO, nie zamykam. Powód: dispatch zakazuje `npm run build`/`dev` w gra/ (kanon C-001) i w worktree nie ma żadnego zbudowanego bundle'a kandydata; uruchomienie gry w Chromium wymaga takiego buildu. Chromium jest dostępny (/usr/bin/chromium), wolne miejsce na / to 6,8 GB (83% użycia). Nie zbudowano też wersji poza gra/ (nie ma na to zgody w dispatchu). Do decyzji orkiestratora/FC: (a) zgoda na build poza gra/ tylko do dowodu E2E, albo (b) dowód E2E jako osobny temat po zgodzie, albo (c) przyjęcie braku dowodu E2E z adnotacją w rejestrze. Bez tego kryterium 5 pozostaje otwarte.

## Uwaga (nie zarzut): plik dispatchu
Dispatch z gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch.md) istnieje; plik 00-dispatch-DODATEK-claude.md NIE istnieje (potwierdzone `git show` → „does not exist”). Zadanie oparto na 00-dispatch.md i zgłoszeniu z dispatchu. Obie ścieżki 00-dispatch.md i 00-dispatch-DODATEK-claude.md nie są w origin/main (`git show origin/main:...` → „does not exist”).

## TESTY (surowe wyjście, worktree na 7c40040dd, gra/ z `npm ci --ignore-scripts`)
- `node ./node_modules/typescript/bin/tsc --noEmit`: TSC_EXIT=0 (bez wyjścia).
- `node tools/army-split-enemy-city-block-test.cjs`: `Wynik: 14 PASS, 0 FAIL`, EXIT=0 (scenariusze A–G).
- Mutacja A (splitTargetPassable = sam isPassable) — wynik z raportu kandydata: 6 PASS / 3 FAIL (nie powtarzano; kod helpera bez zmian).
- Mutacja B — patrz zarzut 1: 12 PASS / 2 FAIL, EXIT=1.
- logic-test: `LOGIC OK (213/213)`, EXIT=0.
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`.
- research-test: `ALL GREEN` (ostatnia linia; pełny wynik 33/0 z raportu kandydata, nie powtórzony w całości).
- unit-replace-test: `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`.
- combat-test: `All sanity checks passed.` (ostatnia linia; raport kandydata podawał 6/6).
- army-split-panel-scroll-grid-test: NIE_ZMIERZONO w tej rundzie (plik nie zmieniany; dług bazowy 2 × RED-PRE według raportu Evaluatora, do potwierdzenia przez FC).
- Dowód w Chromium / realnej grze: NIE_ZMIERZONO (patrz zarzut 2).

## BLOKADY
- Brak dowodu E2E w Chromium (kryterium 5) — wymaga decyzji o buildzie poza gra/ albo przyjęcia braku.

## RUNDY
1/5 (obrona). Wynik r1: zarzut 1 zamknięty; zarzut 2 wymaga decyzji.

## NASTĘPNY KROK
Evaluator: ponowna weryfikacja commitu 7c40040dd (sekcja G + mutacja B). Final Control: decyzja w sprawie dowodu Chromium (zarzut 2) — opcje a/b/c powyżej. Potem integracja orkiestratora (kod kandydata 8e19fc70a + test 7c40040dd, merge-base do sprawdzenia).

## DEPLOY/PUSH: NIE WYKONANO
