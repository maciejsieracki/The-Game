STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-E-Q1
GOAL: REPIN UI partia UI-2-E (#18–#22 dyplomacja) frontend-v2 → web `origin/main` `86d510c66` wg `P5-REPIN-UI-2.md` §1/§1a/§4.

ZMIANY/COMMIT: `9f552195ebef2cf7f374174c816689029ccb54a3` (baza `rust-port/parity-v2` `2198eaf7e`, worktree, jawny `git add`).
- Port DOM (klasa PD, `diff3 -m port pin main` + adapter DTO): `src/ui/diploListHud.ts`, `diplomacyPanel.ts`,
  `diplomacyNegotiationModal.ts`, `diplomacyAudience.ts`, `diplomacyTradeBasket.ts`. `git log 86d510c66..origin/main -- gra/src/ui` = 0.
- `viewmodel/types.ts` addytywnie: `BasketItemTyp |= 'miasto'`, `BasketItemDto.cityPn/cityWeight/cityLabel`,
  `BasketRulesCtxDto.basketActionId`, `constants.miastoAkcjeDozwolone?`.
- Narzędzia (nowe): `tools/dom-harness/run-repin-ui2e.mjs`, `repin-ui2e-scenes.mjs`, `repin-ui2e-rust.mjs`,
  `run-repin-ui2e-cycles.mjs`, `mutate-repin-ui2e.mjs`, fixtura `fixtures/repin_ui2e-web-vectors.json`.
- Wspólne (addytywnie na końcu): `repin-ui2-manifest.json` (klucz `overlayPd`, 4 pliki), `repin-ui2-overlay.mjs` (pętla PD),
  `package.json` (3 skrypty), `P5-REPIN-UI-2.md` (wiersze #18–22 + nowa §2E). `pin-manifest.json` bez zmian (żaden z 5 plików
  nie był kopią pinu).

TESTY (z `src-tauri/frontend-v2/`):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (check-no-logic-imports 0 trafień, verify-pin-copies 433/0, verify-repin-ui2-copies 4/0); `git diff --check` czysty.
- `run-repin-ui2e.mjs` (Chromium 141): 183 wektory / 6 funkcji, 26 scen (13 × 1280×720 i 360×640): DOM równy, PNG bajtowo równy, pageerror/console.error 0, różnic=0.
- Niezależny weryfikator: 2 osobne `git archive 86d510c66` → `webFixtureSha256=fc1cc8d7…6fef` w obu, plik JSON sha256 `0540e487…d038` w obu.
- `run-repin-ui2e-cycles.mjs` (jsdom, web main): 9335 przypadków (audiencja 224, negocjacje 171, koszyk 8940), różnic 0, jsdomErrors 0.
- `mutate-repin-ui2e.mjs`: 67/67 wykrytych (przebiegi częściami `--from/--to`; 4 mutacje wykryte dopiero po dodaniu scen — zarejestrowane ponownie: TB12 zmieniona z równoważnej `'pokoj'` na `'handel'`, web `diplomacy-war-gates.ts:11`).
- Regresja na nakładce (pin+UI-2-A+PD-E): L0 3861/0, L1A 3618/0, L2 1784/0 (354/150 jak baza), C4 1649/0, hud 927/0, newgame 1194/0, cityux 164/0, repin-ui2a 2292/0, run-cycles (hexTooltip, sidePanel×2, preBattle, negocjacje) 0.

BLOKADY / UWAGI:
- N1 (ZAŁOŻENIE E-Z3): `run-cycles` dla `diplomacyTradeBasket.ts` i 31 przypadków audiencji otwierających koszyk nadal porównuje z pinem (nakładka nie może podmienić TB bez kaskady `game/*` main) — odniesieniem jest `run-repin-ui2e-cycles` (0 różnic). Zweryfikowane 5/31 przykładów (CSS koszyka); pozostałe 26 NIE_ZMIERZONO indywidualnie.
- N2: mutacje uruchomione częściami, nie jednym przebiegiem po ostatniej zmianie scen (zmiany scen tylko dodawały przypadki).
- Producent DTO w Rust (`cityPn`, `miastoOptions`, nazwy partnerów, `miastoAkcjeDozwolone`) = P6. GPU/okno Tauri: NIE_ZMIERZONO.
- Wycena przeliczona w §2E: E zużyła 1 rundę z 4 wycenionych; pozostało 100,75 h.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus 5.5) — niezależna weryfikacja `run-repin-ui2e*.mjs` i mutacji na `9f552195e`.
DEPLOY/PUSH: NIE WYKONANO
