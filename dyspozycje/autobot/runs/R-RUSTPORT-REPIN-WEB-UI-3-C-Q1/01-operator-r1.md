STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-C-Q1
GOAL: REPIN UI-3-C — przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany weba `86d510c66 → 9b019a7d8` dla `empireDetailPanel`, `hexContextTooltip`, `buildModeHud` (w tym przełącznik automatyzacji budowy).

ZMIANY/COMMIT (branch roboczy od `rust-port/parity-v2` `dde5e9034`):
- `4306ccbc9` — kod + narzędzia + dokument; ten raport osobnym commitem (SHA w `git log`).
- Porty DOM (klasa PD; `diff3` port/web86/web9b, konflikty tylko w blokach przeniesionych do DTO): `empireDetailPanel` (suwaki do środka uchwytu, „Brutto → netto”, `formatManpowerCompact`, mnożnik epoki), `hexContextTooltip` (pasek „Zaznacz do rozwiązania”, kolejność generałów, filtr odblokowań i deduplikacja surowców na DTO), `buildModeHud` (hak `isAutoBuildEnabled` + podpowiedź, usunięte przełączniki). Zbiór odchyłek port↔web zmienia się tylko o opisane adaptacje (zmierzone).
- Narzędzia (addytywnie): `repin-ui3-manifest.json` sekcja `portDomUI3C` (+ własne `overlayDeps`, 7 plików 9b — kaskada zmierzona bundlem pinu); `repin-ui2-overlay.mjs` i `verify-repin-ui3-copies.mjs` czytają `portDom*`; wpisy usunięte: `repin-ui2-manifest` `overlayPortsUI2D` −2, `ui2c.json` −1; `run-repin-ui3c.mjs`, `mutate-repin-ui3c.mjs`, fixtura `repin_ui3c-web-vectors.json`; `run-cycles.mjs` (`riverMap.hexes`), `run-repin-ui2d.mjs` (znacznik „Wyłącz filtr” NIE_DOTYCZY); `package.json` +2 skrypty.
- `P5-REPIN-UI-2.md` §11.6 (założenia U3C-Z1…Z6). 12 PNG weba w `runs/…/png/`.
- Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `gra-robocza/**`.

TESTY (`src-tauri/frontend-v2`, `npm ci`, Chromium 141 headless `/opt/pw-browsers/chromium-1194`):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (`check-no-logic-imports` 0 trafień; UI-3: kopii 12/12, adapter 1/1, portDom 3/3, deps 8, niezgodnych 0). Sztuczne naruszenie (bajt w porcie) → niezgodnych=1.
- `run-repin-ui3c --web-dir WEB86U3`: 696 przypadków (hex 282 × 2 warianty „Rust”, unit 16, bm 72, emp 43), 12 PNG 1280×720/360×640 web = port, MARKERS 19/19, GONE 0, asercji 14/14, pageerror+console.error 0, różnic 0. Niezależny weryfikator: drugi `git archive` → nowa nakładka → fixtura bajtowo identyczna (`02fb1180…`).
- Pełny `git archive 9b019a7d8`: różnic 4 (wyłącznie `emp`, tekst „Spichlerz Królewski” z `empireDetailTypes.ts` = partia UI-3-B; z `empireDetailTypes` 86d → 0).
- `mutate-repin-ui3c`: 39/39 wykrytych (#15 `ł→l` i #18 „brak haka” przeżyły w 1. przebiegu → listy syntetyczne + wartownik `__none__`; #9–#22 zmierzone ponownie).
- Regresja NA KOŃCOWYM KODZIE (pin+UI-2+UI-3 / WEB86U3): L0 3861/0, L1A 3618/0, C4 1649/0 (75 jsdom canvas), hud 909/0, cityux 164/0, `run-cycles` 6442/1623 (te same moduły dyplomacji E-Z3; `hexContextTooltip` 931/0), UI-2-A 2292/0, B 1356/0, C 752/0, D 797/0, E 183/0, E-cycles 9335/0, F 35/0, G 9216/0, UI-3-A 33×2/0 (WEB3). L2: 1778 przypadków (było 1784: −6 kliknięć usuniętych przycisków `buildModeHud`, 132/0), 1 różnica w `mainMenu.ts` — toast z `setTimeout` 2,6 s, niestabilne (3 przebiegi: 1/1/0), `mainMenu` nie importuje plików partii.
- Komentarz w `buildModeHud.ts` (`:49`→`:48`) poprawiony po regresji — bez zmiany logiki; ponownie: tsc, check, `run-repin-ui3c --kinds bm` 0.
- NIE_ZMIERZONO: `run-newgame` (2× >585 s pod obciążeniem 4 worktree), GPU/okno Tauri.

BLOKADY: brak. NOTY:
1. Reguły po stronie Rust (możliwe ulepszenia: `hexHasHorseDeposit`, `isHexNearRiver`; „żywność tylko przy obywatelach”; dedup surowców docelowo) — poza allowlistą, U3C-Z2/Z5.
2. `surowceBrutto/Netto` typowane lokalnie do czasu UI-3-D (`hud.ts`), U3C-Z3; hak `isAutoBuildEnabled` niepodpięty (P6).
3. Wspólne pliki (`repin-ui3-manifest.json`, nakładka, weryfikator, `package.json`, `ui2c.json`, P5 doc) edytowane addytywnie — konflikty z B/D/E rozwiąże orkiestrator.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-WEB-UI-3-C-Q1 r1.
DEPLOY/PUSH: NIE WYKONANO
