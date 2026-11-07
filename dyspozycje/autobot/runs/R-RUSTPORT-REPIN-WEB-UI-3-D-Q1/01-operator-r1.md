STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-D-Q1
GOAL: przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany weba `86d510c66 → 9b019a7d8` (FALA 509–532) w `minimapHud.ts` (ramka widoku podąża za kamerą, `updateViewport`) i `hud.ts` (baner 3+3 brutto/netto, niedobory, „Rekrutacja”, rekruci k/M, jedna migawka stanu).

ZMIANY/COMMIT (branch `rp-ui3d-op-r1` od `rust-port/parity-v2` `dde5e9034`):
- `fe7c77348` — kod: `src/ui/minimapHud.ts`, `src/ui/hud.ts` (klasa PORT-D = web 9b0 + jawne edycje: minimapa 2 linie katalogu „Rust”; hud most P5.7 + adapter `game/frame-memo` 37–67);
  `tools/repin-ui3-manifest.json` (nowa sekcja `ui3d`), `tools/verify-repin-ui3-copies.mjs` (blok PORT-D), `tools/repin-ui2-overlay.mjs` (blok UI-3-D),
  `tools/repin-ui2-overlay-ports/ui2c.json` (−wpis `hud.ts`, U3D-Z1), `dom-harness/run-repin-ui3d.mjs`, `mutate-repin-ui3d.mjs`, fixtura `repin_ui3d-web-vectors.json`,
  `package.json` (+2 skrypty), 18 PNG weba w `runs/…/png/`.
- Commit dokumentacyjny (`P5-REPIN-UI-2.md` §11.6 + ten raport): SHA w `git log` gałęzi (następny po `fe7c77348`).
- Wspólne pliki edytowane addytywnie, w osobnych blokach. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `src/controller/**`.

TESTY (`src-tauri/frontend-v2`, `npm ci`, kod końcowy `fe7c77348`):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (UI-3: kopii 12/12, adapter 1/1; ui3d portów 2/2, bloków 1, deps 1; niezgodnych 0); verify `--web-dir` (osobny archive) 0.
- `run-repin-ui3d` (Chromium 141, 1280×720 + 360×640): 10 scen, 282 kroki, 18 PNG web = port bajtowo, różnic 0, pageerror+console.error 0, pokrycie 40/40.
  Niezależny weryfikator: dwa osobne `git archive 9b019a7d8` → fixtura sha256 `3ae0e991…` identyczna (webVectorsSha256 `38abd1ec…`).
- `mutate-repin-ui3d`: 32/32 wykrytych (na kodzie końcowym). Sztuczne naruszenia bramki PORT-D/DISJ/DEPS: 8/8.
- Regresja (nakładka pin+UI-2+UI-3+UI-3-D; WEB86U3): L0 3861/0, L1A 3618/0, C4 1649/0, hud 909/0, cityux 164/0, cycles 6442/1623
  (diplomacyTradeBasket 1592 + diplomacyAudience 31 = E-Z3; reszta 0), UI-2-A 2292/0, B 1356/0, C 752/0, D 797/0, E 183/0, E-cycles 9335/0,
  F 35 scen/0, G 9216/0, UI-3-A 360 kroków/0 (56/56).
- L2 1784: 0 lub 1–2 różnice niedeterministycznie w `mainMenu.ts` (toast `cm-toast show`, timer 2600 ms, obciążenie ~6 przy 4 worktree);
  izolowane `--only mainMenu.ts` 3×: 0/2/0. `mainMenu.ts` i jego zależności bajtowo niezmienione przez ten temat — nie regresja.
- newgame: `dane/brak` 625/0, `dane/v4` 506/0; pozostałe 7 kombinacji NIE_ZMIERZONO (pełny przebieg > 580 s przy obciążeniu; `newGameFlow` nie importuje `hud`/`minimapHud`).
- NIE_ZMIERZONO: GPU/okno Tauri; kontroler v2 nie woła `updateMinimapViewport` ani nie dostarcza nowych pól (P6).

BLOKADY: brak. NOTY:
1. U3D-Z1: wpis `hud.ts` usunięty z `ui2c.json` (DISJ); partie B/C mogą zmieniać sąsiednie linie tego pliku — konflikt do rozwiązania przez orkiestratora.
2. U3D-Z3: mutacje `mutate-repin-ui2c` H5/H6/H11 nieaktualne (kod usunięty przez web; wzorzec 0×), zastąpione nowymi.
3. Pierwszy pomiar harnessu dał 1 PIX różny (hover z poprzedniej sceny); naprawione (kursor na środek), potem 3 przebiegi × 0.
4. Scratch `scratchpad/web3` usunął równoległy agent (wspólny katalog) — przeniesione do `scratchpad/ui3d-op/`.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-WEB-UI-3-D-Q1 r1.
DEPLOY/PUSH: NIE WYKONANO
