STATUS: PASS-WITH-NOTES (etap Operator-impl; pomiary behawioralne i drift to kolejny etap)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1
GOAL: Komplet jednostek orkiestracji panelu miasta (pin edb8fb56, cityPanel.ts): switchCity, rerender, renderCityIconRightRail (K09) oraz renderOkolicaPanel, renderLeftPanelTab, renderRightPanelTab, paintCityPanelSections, showCityPanel, hideCityPanel (K08B §3) w src-tauri/frontend-v2/src/ui/cityPanel/k09a-*.ts, wiring controller/k09aWiring.ts, bramka kopii, test delegatów.
ZMIANY/COMMIT:
- c8b413b0 partia rerender (k09a-deps.ts, k09a-rerender.ts)
- 25764d71 partia tabs (k09a-tabs.ts)
- d0a7f776 partia paint (k09a-paint.ts)
- fcc2c8f6 wiring k09aWiring.ts, verify-k09a-copies.mjs + k09a-subs.mjs, run-k09a-deps.mjs
- 5142a305 dossier dyspozycje/rust-port/p5/P5-8-K09A.md + wpis PORTING-QUEUE.md
Baza: origin/rust-port/parity-v2 @ f18a18c3. Allowlista zachowana; zero zmian w gra/**, rust-port, WERSJE.md, package.json. Push: NIE.
TESTY:
- npx tsc --noEmit: 0 błędów (baseline 0).
- npm run check: exit 0 (check-no-logic-imports 0 trafień; verify-pin-copies 435 plików, 0 niezgodnych).
- verify-k09a-copies.mjs: exit 0 — 9 bloków, 9 jednostek, 42 hunki względem pinu, ORPHAN/COVER/LOCAL 0.
- run-k09a-deps.mjs: 5/5 OK.
- Nie uruchomiono: pin-exec harness, mutacje behawioralne, test wykonania wiringu (wymaga jsdom), measure-k09a-drift (NIE_ZMIERZONO).
BLOKADY: brak. Luki rozstrzygnięte założeniami K09A-Z1..Z7 (P5-8-K09A.md §2).
RUNDY: 1/5
NASTĘPNY KROK: Operator-pomiary: pin-exec harness dla 9 jednostek (punkty wejścia z K09A), mutacje kolejności odświeżania paintCityPanelSections, stanu activeCity/activeMap/activeOnClose i rootEl, measure-k09a-drift.mjs; potem Evaluator/Final Control.
DEPLOY/PUSH: NIE WYKONANO
