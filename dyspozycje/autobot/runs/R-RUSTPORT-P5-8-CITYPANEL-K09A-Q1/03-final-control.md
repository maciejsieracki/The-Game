STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K09A-Q1
GOAL: Final Control r2 dla K09A (9 jednostek orkiestracji panelu miasta + k09aWiring), weryfikacja obrony Z1-Z5.
ZMIANY/COMMIT: oceniany 2ae032d9 (bf17fa70 kod/harnessy, 2ae032d9 raport) na fc9ffb3f/7bc809a2; baza = origin/rust-port/parity-v2 f18a18c3 (merge-base = f18a18c3, czyste nałożenie). Diff fc9ffb3f..2ae032d9 wyłącznie w allowliście (tools/dom-harness, P5-8-K09A.md, PORTING-QUEUE.md, runs/**); src/ bez zmian od 7bc809a2; zero gra/**, rust-port, WERSJE.md, .rs.
TESTY (powtórzone samodzielnie, pin edb8fb56 zweryfikowany sha1 cityPanel.ts):
- npm ci EXIT 0; tsc --noEmit EXIT 0; npm run check EXIT 0 (33/15/1, 220 plików, 0 trafień, verify-pin-copies 435/0)
- run-k09a-pin.mjs --pin-dir: 69/69; run-k09a-wiring.mjs 10/10; run-k09a-deps.mjs 5/5
- verify-k09a-copies: 9 bloków, 42 hunki, 0 problemów
- mutate-k09a-units.mjs: 42/42 zabitych, 1 wykluczona NIE_ZMIERZONO (tabs.okolica.noMap); working tree czyste po mutacjach
- git diff --check fc9ffb3f 2ae032d9: czysto
- fmt/clippy/test: NIE_DOTYCZY (brak .rs)
ZARZUTY: Z1 ODDAL (run-k09a-pin.mjs 69/69). Z2 ODDAL (mutacje behawioralne w tym paint.* kolejność/stan, zabite). Z3 ODDAL (wiring 10/10, mutacje wiringu zabite). Z4 ODDAL (zakres dowieziony w r2). Z5 ODDAL (uwaga; dowód zachowania = pin-exec). Brak NAPRAW. Brak DO DECYZJI CZŁOWIEKA.
NIE_ZMIERZONO: delegaty bez efektu w jsdom (setHoverDetailDocks, setMapHudChromeSuppressed, refreshCityUxFrame, disposeHoverDetailDock); tabs.okolica.noMap; pin-exec używa neutralnych wejść dla K06B/K05A (założenie w dossier).
BLOKADY: brak
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora: cherry-pick/merge łańcucha 5142a305, 7bc809a2, fc9ffb3f, bf17fa70, 2ae032d9 (+ ten raport) na origin/rust-port/parity-v2 (f18a18c3); K07B równoległe (k07b-*, dopiski viewmodel/types.ts) - przy konflikcie w PORTING-QUEUE.md/types.ts zachować oba dopiski. Potem K09B.
DEPLOY/PUSH: NIE WYKONANO
