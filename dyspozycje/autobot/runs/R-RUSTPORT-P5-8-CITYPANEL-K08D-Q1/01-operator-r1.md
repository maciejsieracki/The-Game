# R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1 — Operator-impl, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1
GOAL: Port trzech jednostek DOM K08D (`renderHandelSlidersPanel`, `renderWealth`, `renderReligia`) z pinu `edb8fb56` do `src-tauri/frontend-v2`, z zależnościami; reguły gry jako delegaty (P5.13).
ZMIANY-COMMIT: kod `1a55f666` (K08D r1: partie handel + slider, wiring, harnessy); raport i dossier w commicie następującym po nim (SHA w odpowiedzi orkiestratora). Baza: `origin/rust-port/parity-v2` @ `f5d34b52`. Pliki: `src-tauri/frontend-v2/src/ui/cityPanel/{k08d-deps,k08d-handel,k08d-slider,k05b-host}.ts`, `src/controller/k08dWiring.ts`, `tools/dom-harness/{k08d-subs,gen-k08d-port,verify-k08d-copies,run-k08d-handel-pin,mutate-k08d-handel}`, `PORTING-QUEUE.md` (dopisek), `dyspozycje/rust-port/p5/P5-8-K08D.md` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1/**`. Zero zmian w `gra/**`, `.rs`, `WERSJE.md`.
TESTY:
- `verify-k08d-copies --batch handel`: EXIT 0 (TEXT 3, COVER 3, ORPHAN 0).
- `verify-k08d-copies --batch slider`: EXIT 0 (TEXT 1, COVER 1, ORPHAN 0).
- `run-k08d-handel-pin`: EXIT 0, 32/32 zgodnych (pin-exec 4 zakresów vs port, 6 scenariuszy DOM, kotwice pinu, delegat `daninaLabelAccusative` względem pliku pinu).
- `mutate-k08d-handel`: 6/6 ZABITE, pliki przywrócone bajt w bajt.
- `npm run check`: EXIT 0 (pin-copies 435, niezgodnych 0). `npm run typecheck`: EXIT 0. `npm ci`: EXIT 0.
- Logi: `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1/r1-logi/`.
BLOKADY:
- `renderWealth` i `renderReligia` NIE_ZROBIONE: zależności (`loadWealthParams`, `wealthCap`, `buildWealthDetailCard`, `computeOrderStateLocal` 146 linii, `religiaSzPunkty`, `appendCompositionBlock`, `buildTopBarReligiaDetailCard`) przesunięte do rundy 2.
- Produkcyjne podpięcie `installK08dWiring` = K09 (NIE_ZROBIONE).
- Zachowanie w przeglądarce, CSS, cargo: NIE_ZMIERZONO.
- Założenia (dossier §2): K08D-Z1 osobny rejestr delegatów (nie nadpisuje K08C); K08D-Z5 wiring bez atrap (brak delegatu = wyjątek); K08D-Z7 karta `buildHandelDetailCard` jako kopia pinu, a nie wariant DTO `buildHandelDetailCardK` (K03). Dług P5.13: bramki Mennicy/Waluty pozostają w UI kopii; decyzja dla K09.
- Rozbieżność z pinem: typ zwracany `computeTradeRouteBuildingBonusByCity` (pin: `Map<string,number>`, call site: `.get(city.id)`), port typuje `ReadonlyMap<number,number>`. Typecheck pinu NIE_ZMIERZONO.
RUNDY: 1/5
NASTĘPNY KROK: runda 2 — partia `wealth` (`renderWealth` + zależności, formuły zamożności jako delegaty), potem partia `religia` (`renderReligia` + `computeOrderStateLocal`); bramki jak w r1 plus mutacje tej partii.
DEPLOY/PUSH: NIE WYKONANO
