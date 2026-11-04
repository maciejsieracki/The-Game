STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-F-Q1
GOAL: REPIN UI partia UI-2-F — kreator nowej gry `src-tauri/frontend-v2/src/ui/newGameFlow.ts` (port DOM) przepięty z pinu `edb8fb56` na web `86d510c66` (`origin/main`), dowód web↔port w Chromium 141.

ZMIANY/COMMIT: `886fd50b0` (gałąź `op/R-RUSTPORT-REPIN-UI-2-F-Q1`, baza `rust-port/parity-v2` `2198eaf7e`), jawne `git add`:
- `src/ui/newGameFlow.ts` (+285/−144): `diff3` port×pin×web → 1 konflikt (`appendCivMatrixCell`) rozstrzygnięty ręcznie; vs web zostało 10 hunków = wyłącznie adaptacje P5.7 r2 + komentarz repinu. Powiązane pliki (`viewmodel/types.ts`, kontroler): bez zmian (pola już istniały).
- NOWE: `tools/dom-harness/run-repin-ui2f.mjs`, `mutate-repin-ui2f.mjs`, `fixtures/repin_ui2f-web-vectors.json`, `tools/repin-ui2f-ported.json`.
- Addytywnie: `tools/repin-ui2-overlay.mjs` (+ porty DOM z `repin-ui2*-ported.json`), `run-newgame.mjs` (start w `.nav`, gdy brak `.sett-actions .start`), `package.json` (2 skrypty na końcu), `P5-REPIN-UI-2.md` (wiersz #23 + nowa §6).
- `repin-ui2-manifest.json`, `pin-manifest.json`: bez zmian (plik nie jest kopią bajtową; brak wpisu do usunięcia).

TESTY:
- `tsc --noEmit` EXIT 0; `npm run check` EXIT 0 (433/0, repin 4/0); `git diff --check` czysty.
- `run-repin-ui2f` (web vs port, Chromium 141): 35 scenariuszy, DOM 1280×720 + 360×640, 24 PNG×2 bajtowo równe, `pageerror`+`console.error`=0, zapytania 11/11, **różnic=0**; fiksatura sha256 `f976fa89…beae` identyczna z 2 osobnych `git archive` (niezależny weryfikator).
- `mutate-repin-ui2f`: 34/34 + M00 (port sprzed repinu: 225 różnic) wykryte, uruchomione zakresami (limit czasu wywołania).
- Regresja na nakładce: run-newgame 9 grup (1993 przypadków kombinacji) 0; L0 3861/0; L1A 3618/0; C4 1649/0; L2 1784/0; cycles 6401/0; hud 927/0; cityux 164/0. jsdomErrors/consoleErrors = baza.

BLOKADY: brak. Notatki:
(a) L2: 1 z 3 przebiegów = 1 różnica, której nie dało się powtórzyć (2 kolejne = 0); L2 nie importuje `newGameFlow.ts`; podejrzenie: obciążenie CPU przez równoległe worktree.
(b) Mutacje równoważne r1 (M07, M29) zastąpione; dla M33 dopisano scenariusz `k3-pusty-profil`. Scenariusze dopisywano addytywnie w trakcie, więc wcześniejsze wyniki wykrycia pozostają ważne.
(c) Dane nowych ustawień (`deals_end_turn_gate`, `player_epoch_war`) i statusy macierzy z `civ-matrix-semantic.ts` weba muszą dostarczyć `StaticCatalogDto`/zapytania Rust (P6). MOCK nie pokazuje tych opcji.
(d) GPU/natywne okno Tauri: NIE_ZMIERZONO.
(e) ZAŁOŻENIE: pełnego `run-newgame` nie da się zmieścić w jednym wywołaniu (>580 s), dlatego podzielono go `--only-label` na 9 grup.

RUNDY: 1/5. Wycena 3 rundy / 21 h; zużyta 1 runda (rekalibracja w §6).
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-UI-2-F-Q1.
DEPLOY/PUSH: NIE WYKONANO
