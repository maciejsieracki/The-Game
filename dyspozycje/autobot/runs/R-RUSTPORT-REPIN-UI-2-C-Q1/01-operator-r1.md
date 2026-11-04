STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-C-Q1
GOAL: REPIN UI partia UI-2-C (`P5-REPIN-UI-2.md` §1 #10–#14): port DOM `hud.ts`, `empireDetailPanel.ts`, `empireDetailTypes.ts`, `armyStackHud.ts`, `unitRecruitCard.ts` z `origin/main` `86d510c66` do `src-tauri/frontend-v2`, z harnessem web↔port w Chromium, mutacjami i regresją.

ZMIANY/COMMIT (branch `op/R-RUSTPORT-REPIN-UI-2-C-Q1` od `parity-v2` `2198eaf7e`):
- `aaf1d4966` — kod + dokument: 5 plików `src/ui/*` (łatka pin `edb8fb56`→main nałożona `patch`, 5 hunków ręcznie); NOWE `tools/dom-harness/{run,mutate}-repin-ui2c.mjs`, `fixtures/repin_ui2c-web-vectors.json` (171 KB), `tools/repin-ui2-overlay-ports/ui2c.json`; addytywnie `repin-ui2-overlay.mjs` (czyta `repin-ui2-overlay-ports/*.json`), `verify-repin-ui2-copies.mjs` (sprawdza te wpisy z gitem), `package.json` (2 skrypty na końcu); `P5-REPIN-UI-2.md` (wiersze #10–#14 + nowa §2c + wycena); 8 zrzutów webu w `runs/…/png/`.
- `repin-ui2-manifest.json`, `pin-manifest.json` bez zmian: wszystkie 5 plików = port DOM (żaden nie był w `pin-manifest`).
- Ten raport: osobny commit (SHA w `git log`).

TESTY (`src-tauri/frontend-v2`, `npm ci`, potem `node_modules` usunięty):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (433/0; UI-2 4/0, `porty_nakładki=6`).
- `run-repin-ui2c`: Chromium 141 headless, 10 grup / 752 wektory, 8 PNG (HUD+roster dowódcy, wiersze rekrutacji, panel Praca z „Zamianą Pracy na podatek”, panel Armia; 1280×720 i 360×640) — różnic=0, PNG bajtowo równe, pageerror+console.error=0.
- Niezależny weryfikator: 2 osobne `git archive` → `webVectorsSha256=d69070ce…a93df0`, fixtura sha256 `adcacfbb…de9d0f` identyczne.
- `mutate-repin-ui2c`: 45/45 wykrytych (hud 12, panel 16, typy 1 przez tsc, roster 6, karta 10). #1–#35 zmierzone przed dodaniem 12. wariantu karty (dodane tylko wektory `recruit*`).
- Regresja na nakładce pin+A+C: L0 3861/0, L1A 3618/0, L2 1784/0 (354/150 jak A), C4 1649/0 (75), cycles 6401/0, hud 899/0, newgame 1194/0, cityux 164/0.
- `git diff --check` czysty.

BLOKADY: brak. NOTY:
1. ZAŁOŻENIA C-Z1…C-Z4 (§2c): kopia `taxForWorkAmount` tylko do podglądu; nowe hooki (zamiana Pracy, montaż rekrutacji, `commanderTitle`, `citizenRatePerCitizen`) gotowe w UI, ale kontroler v2 ich nie podpina — producent P6 (`src/controller/**` poza allowlistą).
2. `hud` 927→899 przypadków: mniej klikalnych elementów po usunięciu formularza masowej rekrutacji w main; przyczyna = ZAŁOŻENIE.
3. Zrzuty wymagają `--num-raster-threads=1`: przy wielu wątkach rastra scena Armia różniła się o ±1 w kanale (pas 2 px) przy identycznym DOM.
4. Dispatch przypisał #14 „kolejkę ↑↓✕ / kolejność wg epoki” — w main to `cityPanel.ts` (UI-2-G); `unitRecruitCard` main = układ jednej linii, `unitLabel`, `disabledReason`, „brak N”.
5. GPU/okno Tauri: NIE_ZMIERZONO.
6. Wycena: C = 30,5 h / 4 rundy wg wzoru; zużyto 1 rundę ≈ 2,2 h. Proponowany wzór PD z łatką: `0,5 + 0,05·H + L/200` (pozostałe PD ≈ 21 h + K 20 h; do potwierdzenia na B/D).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-UI-2-C-Q1 r1 (Opus 5.5); integracja z UI-2-B (wspólne `repin-ui2-overlay.mjs`, `verify-repin-ui2-copies.mjs`, `package.json`, `P5-REPIN-UI-2.md`).
DEPLOY/PUSH: NIE WYKONANO
