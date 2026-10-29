STATUS: BLOCK (częściowo; bez zmian względem r1 — breakdown wymaga K01; część CSS zweryfikowana)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K02-Q1
GOAL: Port K02 (CSS i wspólne bloki) `gra/src/ui/cityPanel.ts` @ edb8fb56 do `src-tauri/frontend-v2/src/ui/cityPanel/`.
ZMIANY/COMMIT: baza cb220319 (detach). Dodane: `src-tauri/frontend-v2/tools/dom-harness/run-k02-styles.mjs`, `tools/dom-harness/mutate-k02-styles.mjs`, `dyspozycje/rust-port/p5/P5-8-K02.md`, ten raport. Kod `k02-styles.ts` bez zmian. Zero zmian w `gra/**`, rust-port, `WERSJE.md`, `package.json`. SHA commitu pomiarowego: podany w odpowiedzi operatora.
TESTY:
- `npx tsc --noEmit` (frontend-v2): EXIT 0 (log: /home/user/pin-PMsA/tsc.log).
- `npm run check`: EXIT 0. Log: self-test 33 poz./15 neg., błędów 0; check-no-logic-imports 147 plików, 0 trafień; verify-pin-copies pin=edb8fb56 435 plików, 0 niezgodnych.
- `npm ci` (frontend-v2): EXIT 0, 51 pakietów (wymagane do harnessu).
- Harness `run-k02-styles.mjs --pin-dir /home/user/pin-PMsA`: EXIT 0; `asercji=14 różnic=0 długośćCSS pin=103530 v2=103530 jsdomErrors=0`. Pokrycie: 2 scenariusze (dokument z istniejącym STYLE_ID; świeży dokument) × 2 wywołania × head/liczba stylów/pełny CSS; stare `civ-city-screen-css(-v2)` usuwane.
- Mutacje `mutate-k02-styles.mjs --pin-dir /home/user/pin-PMsA`: EXIT 0; 8/8 WYKRYTE (M1 LIST_SCROLL_VISIBLE 3→4; M2 QUEUE_ROW_EM 2.75→2.7; M3 CITY_PANEL_ICON_GLYPH_EM 4.5→4.6; M4 STYLE_ID; M5 brak usunięcia civ-city-screen-css; M6 z-index 400→401; M7 createElement style→span; M8 overflow-y auto→hidden). Przywrócenie bajtowe: OK.
- Pierwsza wersja harnessu nie wykrywała M7 (scenariusz z istniejącym STYLE_ID nie wywołuje createElement) — dodano scenariusz świeżego dokumentu; po poprawce 8/8.
- Bramki Rust fmt/clippy/test: NIE DOTYCZY (0 plików `.rs` w diffie).
- `npm run build|dev` w `gra/`: NIE WYKONANO (zakaz).
- `git diff --cached --check` (4 pliki pomiarowe): EXIT 0.
BLOKADY: (1) `appendBreakdownLines`, `appendPctBreakdownBlock`, `appendSignedBreakdownSections`, `appendW4SignedBreakdownSections` (pin:4378–4516) wymagają `el` i `BreakdownLine` z K01 — nieportowane. ZAŁOŻENIE: pozostają w K02 jako kolejna runda po K01 (nie przenoszone zastępczo). (2) Zakres K02 z P5-8 §4 (23 jednostki) wykonany jako 1 jednostka (H).
RUNDY: 1/5 (wywołanie pomiarowe tej samej rundy co impl r1)
NASTĘPNY KROK: Operator-impl r2 po K01 — port 4 funkcji breakdown do `cityPanel/k02-breakdown.ts`, harness DOM dla nich, mutacje; następnie Evaluator (Sonnet 5.5) i Final Control. Kolejność K01/K02 decyduje orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
