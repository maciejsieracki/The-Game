STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-A-Q1
GOAL: Faza U3 — pomiar dryfu UI frontend-v2 względem `edb8fb56`/`dc8a3adc` i `origin/main` `86d510c66`, partia UI-2-A (pierwsze porty), odświeżony dryf bloków K01–K09.

ZMIANY/COMMIT (branch `operator/R-RUSTPORT-REPIN-UI-2-A-Q1` od `parity-v2` `612ad455e`):
- `ea5d9e7f7` kod partii UI-2-A: kopie bajtowe z `86d510c66` — `src-tauri/frontend-v2/src/ui/{formatCompactNumber,recruitHudLabel}.ts` (NOWE), `{hudChip6c,unitActionBarHtml}.ts` (przepięte); `tools/repin-ui2-manifest.json`, `tools/verify-repin-ui2-copies.mjs` (dopięty do `npm run check`), `tools/pin-manifest.json` (−2 wpisy, 435→433), `tools/repin-ui2-overlay.mjs`, `tools/dom-harness/{run,mutate}-repin-ui2a.mjs`, `tools/dom-harness/fixtures/repin_ui2a-web-vectors.json`, `package.json` (skrypty).
- `9d08ec941` dokument `dyspozycje/rust-port/p5/P5-REPIN-UI-2.md` (NOWY: tabela 26 plików → hunki → klasa → moduł → partia, kolejka UI-2-B…G z kryteriami) + `tools/dom-harness/measure-repin-ui2-kblocks-drift.mjs`.
- Ten raport: commit poniżej (SHA w `git log`).
Allowlista ustalona pomiarem: frontend jest w `src-tauri/frontend-v2/**` (nie ma `rust-port/frontend-v2`) — ZAŁOŻENIE Z1 w dokumencie §0. Nie ruszono `src-tauri/src/**`, `Cargo.*`, `gra/**`, `rust-port/**`, `WERSJE.md`.

TESTY (`src-tauri/frontend-v2`, `npm ci` → potem `node_modules` usunięty):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (`verify-pin-copies` 433/0, `verify-repin-ui2-copies` 4/0, źródło git sprawdzone 4).
- `run-repin-ui2a` (web w Chromium 141 headless vs port): 10 funkcji, 2292 wektory, DOM 54, PNG identyczny, różnic=0, EXIT=0. Dwa osobne `git archive` → ten sam `webVectorsSha256=81278334…a7495f` (JSON sha256 `0719192d…de380` w obu).
- `mutate-repin-ui2a`: 19/19 wykrytych, EXIT=0.
- Regresja: czysty pin → `run-cycles` 4 różnice (tylko ścieżki SVG ikony split, oczekiwany skutek repinu); nakładka `repin-ui2-overlay` → L0 3861/0, L1A 3618/0, L2 1784/0, C4 1649/0, cycles 6401/0, hud 927/0, newgame 1194/0, cityux 164/0. Liczniki jsdomErrors/consoleErrors L2/C4 takie same jak na bazie przed zmianą (354/150, 75/0).
- Dryf K: 309 bloków, 284 SAME, 25 DRIFT (K06B 8, K05B 5, K05A 3, …; K07A/K08A/K09A 0); `measure-k08d` 2/11 zmienionych, `measure-k08e` 0 rozjechanych kopii (1 DRIFT), `measure-k09a` 9/9 SAME.
- `git diff --check` czysty. Cargo: nie dotyczy (Rust nie ruszany).

BLOKADY: brak. NIE_ZMIERZONO: GPU/natywne okno Tauri; dryf K02–K04 (nie mają markerów `:A-B`).
UWAGI: `hud.ts` w v2 jeszcze nie woła `formatCompactNumber` (UI-2-C) — partia A nie zmienia działania istniejących paneli (ZAŁOŻENIE Z2). Starsze harnessy po repinie trzeba uruchamiać z `--pin-dir` nakładki.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-UI-2-A-Q1 r1; potem kolejka UI-2-B (merge/split 3×5, aiOwnerProgressFrame, unitReplacePicker, Milicja w siegeMapPanel).
DEPLOY/PUSH: NIE WYKONANO
