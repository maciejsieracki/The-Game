STATUS: PASS-WITH-NOTES (partia UI-3-A: 13/24 plików; GOAL tematu NIE zakończony — 11 plików PD/K zaplanowanych na r2+)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-Q1
GOAL: REPIN UI-3 — przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany `gra/src/ui` web `86d510c66 → 9b019a7d8` (FALA 509–532).

ZMIANY/COMMIT (branch `rustport-repin-web-ui-3-q1` od `rust-port/parity-v2` `b520768b0`):
- `e2879257f` — kod + dokument. Kopie bajtowe z `9b019a7d8` (12): `armyMergePanel`, `armyMergePickPanel`, `armySplitPanel`,
  `gamePauseMenu`, `hudChip6c`, `sidePanelEventTabs` (NOWY), `sidePanelEventFilter`, `sidePanelHud`, `empireRecruitPanel` (NOWY),
  `worldOverlayLayer` (NOWY), `icons/brand/building-icon-map.json`, `bld-emporion.svg` (NOWY). Adapter: `armyStackLabel` (NOWY;
  import `game/stack-leader` → lokalne kopie 2 czystych funkcji + stałej, bloki z markerami źródła).
- Narzędzia (addytywnie): `tools/repin-ui3-manifest.json`, `tools/verify-repin-ui3-copies.mjs` (dopięty do `npm run check`),
  `repin-ui2-overlay.mjs --web3-dir`, `dom-harness/run-repin-ui3a.mjs`, `mutate-repin-ui3a.mjs`, fixtura `repin_ui3a-web-vectors.json`,
  `package.json` (+2 skrypty, `check`). Wpisy przeniesione: `pin-manifest.json` −5, `repin-ui2-manifest.json` `files` −3 (ZAŁOŻENIE U3-Z1).
  `run-cycles`/`run-repin-ui2e-cycles`: blok filtra porównuje nowe API zakładek; `mutate-cycles` S2 → nowy filtr.
- `P5-REPIN-UI-2.md` §11 (pomiar 24 plików, klasy, plan B–E, założenia U3-Z1…Z4, komendy). 24 PNG webu w `runs/…/png/`.
- Ten raport: osobny commit (SHA w `git log`).
- Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `gra/src/render/**`.

TESTY (`src-tauri/frontend-v2`, `npm ci`):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (UI-2 4/0; UI-3 kopii 12/12, adapter 1/1, bloków 3, deps 1, niezgodnych 0).
- `run-repin-ui3a` (Chromium 141 headless, 1280×720 + 360×640): 33 sceny, 360 kroków, 24 PNG web = port bajtowo, różnic=0,
  pageerror+console.error=0, pokrycie 56/56. Niezależny weryfikator: 2. osobny `git archive origin/main` → fixtura sha256
  `cb73b7a7…` identyczna; `webVectorsSha256=902c9063…`.
- `mutate-repin-ui3a`: 52/52 wykrytych (T4, T6 przeżyły w 1. przebiegu → dodane wektory, ponownie zmierzone #27–#37, #50–#51).
  `verify-repin-ui3-copies`: 8/8 sztucznych naruszeń wykrytych (SHA, GIT, ADAPTER blok/poza blokiem/marker).
  `mutate-cycles --only S1,S2`: 2/2.
- Regresja baza vs temat (nakładka pin+UI-2 / pin+UI-2+UI-3): L0 3861/0, L1A 3618/0, L2 1784/0 (354/150), C4 1649/0 (75),
  hud 899/0→909/0, cityux 164/0, `run-cycles` 1623=1623 (te same moduły dyplomacji, E-Z3), UI-2-A 2292/0, B 1356/0,
  C 752/0 (na WEB86U3, ZAŁOŻENIE U3-Z3), D 797/0, E 183/0, E-cycles 9335/0, G 9216/0. `git diff --check` czysty.
- NIE_ZMIERZONO: `run-newgame`/UI-2-F (bez zależności od zmienionych modułów), GPU/okno Tauri.

BLOKADY: brak. NOTY:
1. Zakres r1 = wszystkie pliki klasy KB/AD. Pozostało 11 PD/K: B (`armyStackHud`, `siegeMapPanel`, `unitRecruitCard`,
   `newGameFlow`, `empireDetailTypes`), C (`empireDetailPanel`, `hexContextTooltip`, `buildModeHud`), D (`minimapHud`, `hud`),
   E (`cityPanel` bloki K) — wycena ~28 h (ZAŁOŻENIE U3-Z4), §11.1.
2. Hooki nowych paneli (automatyzacja budowy, rekrutacja cywilizacji, zakładki) gotowe w UI; kontroler v2 ich nie podpina (P6).
3. Zmierzone zachowanie weba (identyczne w porcie): „Rekrutuj” kliknięte zaraz po edycji pola nie składa zamówienia
   (blur → `change` → render podmienia przycisk). Kandydat na zgłoszenie webowe — decyzja orkiestratora.
4. Regresję starszych harnessów uruchomiono przed dodaniem `worldOverlayLayer.ts` (nieimportowany w v2).
5. `rust-port/parity-v2` przesunął się w trakcie (RENDER-3); wspólne pliki (manifesty, nakładka, `package.json`, P5 doc) zmienione
   addytywnie — integracja orkiestratora.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-WEB-UI-3-Q1 r1; decyzja orkiestratora o partiach UI-3-B…E (kolejne rundy/tematy).
DEPLOY/PUSH: NIE WYKONANO
