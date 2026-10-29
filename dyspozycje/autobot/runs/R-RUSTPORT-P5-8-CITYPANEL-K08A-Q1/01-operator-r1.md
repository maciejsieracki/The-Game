STATUS: PASS-WITH-NOTES (etap Operator r1; oczekuje Evaluatora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1
GOAL: Przenieść nie-DOM jednostki bloku K08 (pin edb8fb56, gra/src/ui/cityPanel.ts) do src-tauri/frontend-v2/src/ui/cityPanel/k08a-fundament.ts; podział wyznaczony skryptem; bramki kopii, zachowania, check i typecheck zielone.
ZMIANY/COMMIT: 52d2b385 (kod, dossier, PORTING-QUEUE, r1-logi). Allowlista: src-tauri/frontend-v2/src/ui/cityPanel/k08a-fundament.ts; src-tauri/frontend-v2/tools/dom-harness/{select-k08a,k08a-subs,gen-k08a-port,verify-k08a-copies,run-k08a-units}.mjs; src-tauri/frontend-v2/PORTING-QUEUE.md (dopisek); dyspozycje/rust-port/p5/P5-8-K08A.md; dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1/**. Zero zmian w gra/**, package.json, WERSJE.md. Brak push.
TESTY:
- select-k08a.mjs --r3: blok 8 = 39 jednostek (1 430 LOC); 24 DOM odłożone (K08B); 15 nie-DOM wybranych (81 LOC).
- verify-k08a-copies.mjs: OK, 15 bloków, 13 LINE_SUBS, ORPHAN=0, COVER OK.
- run-k08a-units.mjs: 25 wektorów z semantyką pinu, 0 różnic.
- Mutacje (ręczne, 2): M1 (getOpenCityPanelCityId) zabita przez gate i wektor; M2 (setK07aUxSectionRefresh) zabita przez gate i wektor.
- npm run check: 0 (self-test, 189 plików, 0 trafień, pin-copies 435/0).
- npm run typecheck: 0 (po npm ci --ignore-scripts).
BLOKADY: brak techniczna. Luki (NIE_ZMIERZONO): pełny zestaw 67 mutacji (wzorem K07A); zachowanie w przeglądarce; wiązanie setK08aDeps i lustra activeCity (K06A+K07A) w kontrolerze/K09.
ZAŁOŻENIA (rozstrzygnięte w dokumencie, bez pytań): K08A-Z1 zakres = 10 r2 + 5 klasy P przez adaptery; Z2 DOM i rerender przez setK08aDeps (brak = wyjątek); Z3 stan przez akcesory K06A/K07A, activeCity jako dwa lustra; Z4 tylko rename resolveActiveCity -> resolveK07aActiveCity; Z5 brandIconSvg importowany, Vite glob/?raw obchodzone tylko w harnessie.
ROZBIEŻNOŚĆ DO POTWIERDZENIA: allowlista dispatchu wymienia P5-8-K05A.md i runs/...K05A-Q1/ (prawdopodobna literówka); użyto P5-8-K08A.md i runs/...K08A-Q1/ zgodnie z KRYTERIAMI dispatchu.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (weryfikacja bramek i LINE_SUBS, ocena luk NIE_ZMIERZONO); potem Final Control; K08B (24 jednostki DOM) jako osobny temat.
DEPLOY/PUSH: NIE WYKONANO
