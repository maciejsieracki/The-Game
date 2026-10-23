STATUS: PASS-WITH-NOTES (runda 3 wg podziału; temat NIEDOMKNIĘTY — `cityPanel.ts` = runda 4)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-7-PORT-HUD-CITYPANEL-Q1
ROLA: Operator (Opus 5.5 medium) · RUNDA 3/5
GOAL: Port paneli UI P5.7 do `src-tauri/frontend-v2/` (C3, C1, `newGameFlow.ts`, narzędzia D-UI-7) z pinu `edb8fb56`; r3 = cykl C1 część 1.
BAZA: `c55d130c` (obrona r2), detached, bez rebase.

ZMIANY/COMMIT: SHA w wiadomości commita r3 (ten plik jest jego częścią; SHA podaje raport końcowy Operatora). Pliki:
- `src-tauri/frontend-v2/src/ui/cityUxFrame.ts` — port (pin 296 → 294 LOC, +7/−9: `City` → `CityRefDto`, `GameMap` usunięty, `./cityPanel` → most; CSS/markup/klawisze/trafienia bajtowo jak pin).
- `src-tauri/frontend-v2/src/ui/cityPanelUxBridge.ts` (NOWY, most C1, ZAŁOŻENIE P5.7-Z7), `src/ui/portCityUx.ts` (NOWY), `src/main.ts` (import dynamiczny).
- `tools/dom-harness/run-cityux.mjs`, `mutate-cityux.mjs`, `city-panel-stub.mjs` (NOWE), `build.mjs` (opcja `alias`, domyślnie pusta), `run-newgame.mjs` (komunikat użycia — uwaga FC r2).
- `PORTING-QUEUE.md` (wiersz 82 PRZENIESIONY, akapit r3), `package.json` (skrypty `harness:cityux*`).
- `dyspozycje/rust-port/p5/P5-7-PORT-HUD-CITYPANEL.md` §11 (+ nagłówek, §1, §1.1); `runs/<ID>/r3-logi/**`, ten plik.

TESTY (`r3-logi/`, każdy log kończy się `EXIT=`):
- `npm ci` 0 · `tsc --noEmit` 0 · `npm run check` 0 (brama `plików=146 trafień=0`, `verify-pin-copies 435/0`) · `vite build` 0.
- Harness `run-cityux.mjs`: 164 przypadki / 0 różnic, asercje v2 5/5, jsdomErrors 0.
- Mutacje `mutate-cityux.mjs`: 25/25 wykrytych, jeden przebieg, EXIT=0.
- Regresja: P5.2 3861/0, P5.3 3618/0, P5.4 1649/0, P5.5 1784/0, P5.6 6401/0, P5.7 r1 927/0, P5.7 r2 1194/0 (EXIT=0 ×7).
- Brama: kalibracja pinu `cityUxFrame.ts` 2 trafienia (EXIT=1), v2 0 trafień (EXIT=0).
- Inwentarz `cityPanel.ts`: 56 modułów, 233 symbole (game 170/141 wartości) — `20-cityPanel-import-inventory.log`.

BLOKADY: brak technicznych. Temat niedomknięty: `cityPanel.ts` (11 986 LOC) przeniesiony do r4 — częściowego portu jednego pliku nie da się skompilować ani porównać harnessem (P5-7 §11.1, ZAŁOŻENIE P5.7-Z8). Ryzyko jawne: r4 = cały `cityPanel.ts`, r5 = jedyna rezerwa.
ZAŁOŻENIA: P5.7-Z7 (most C1, sygnatura bez `map`), P5.7-Z8 (granulacja r3).
NIE_ZMIERZONO: układ/CSS w realnej przeglądarce, treść panelu miasta (atrapa po obu stronach), okno Tauri.
RUNDY: 3/5
NASTĘPNY KROK: Evaluator r3; potem r4 = `cityPanel.ts` wg planu P5-7 §11.5.
DEPLOY/PUSH: NIE WYKONANO

---
OBRONA r3 (po FAIL Evaluatora r3; stan odtworzony z `04aca06c`; szczegóły i dowody: P5-7 §11.8)
- Z1 kryterium binarne (`cityPanel.ts`): PRZYJMUJĘ — port = r4 (§11.5 + uzupełnienie §11.8); bez listowania jako „pominięty”.
- Z2 `git diff --check`: ODRZUCAM fałsz — na checkoucie `04aca06c` EXIT=0 (atrybut `*.diff -whitespace` z `runs/<ID>/.gitattributes`, od r2); EXIT=2 odtworzone tylko z `--attr-source=51a62a89` (`r3-logi/21-obrona-diff-check.log`). Opis w §11.6 doprecyzowany. 35. plik = sam log `15-…`.
- Z3 cytat dispatchu r3: PRZYJMUJĘ — wycofany; P5.7-Z8 = ZAŁOŻENIE WŁASNE oparte na `00-dispatch.md`.
- Z4 ryzyko r4: PRZYJMUJĘ — commity cząstkowe per grupa; tabela pokrycia `GameMap` → DTO jako warunek r4 (inwentarz startowy w §11.8).
TESTY obrony: kod bez zmian względem `04aca06c` (zmienione wyłącznie dokumenty/logi tematu); `git diff --check` na commicie obrony — w raporcie końcowym.
