STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1
GOAL: Port K07B (15 jednostek DOM + 8 bloków pomocniczych, pin edb8fb56) do frontend-v2 z harnessem z pinem, mutacjami i wiringiem kontrolera; zamknięcie zarzutów FC r2 1–6.
ROLA: Operator-impl, runda 3/5. Baza: 418ee133 (kod r2 + raport FC r2).

ZMIANY/COMMIT:
- fef47ba9 — activeMap jako wartość (`activeMapK07()`, K07B-Z4); bramka kopii `K07B_RENAMES`; usunięty nieużywany `activeMap` z p2. (Błąd r2: port przekazywał funkcję zamiast mapy w renderKultura.)
- afb029bc — `k07b-deps.ts` (K07B_FN_NAMES, K07B_VALUE_NAMES, k07bMissingDeps); `controller/k07bWiring.ts` (mapCityK07, chipDeltaStockHtmlK07, mapK07aDeps, installK07bWiring); `tools/dom-harness/run-k07b-units.mjs`; `tools/dom-harness/mutate-k07b-units.mjs`.
- Commit raportu i dossier/PORTING-QUEUE: SHA w odpowiedzi orkiestratorowi (nie da się wpisać SHA commita do jego własnej treści).
- Pliki: src-tauri/frontend-v2/{src/ui/cityPanel/k07b-*.ts, src/controller/k07bWiring.ts, tools/dom-harness/*k07b*, PORTING-QUEUE.md}, dyspozycje/rust-port/p5/P5-8-K07B.md, dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1/. Brak zmian w gra/, rust-port/, WERSJE.md, package.json.

TESTY:
- run-k07b-units.mjs (pin edb8fb56): EXIT 0; 15 jednostek + 8 bloków; przypadki pin vs port 0 różnic; 0 przypadków z błędem; 289 asercji łącznie (225 chip-siatka + wiring), 0 niezgodności.
- mutate-k07b-units.mjs: 29/29 zabitych (16 DTO/wiring, 13 progi/brzegi; w tym Z13 = regresja activeMap). 0 przeżyło, 0 niezastosowanych.
- verify-k07b-copies.mjs: blocks=23 niezgodnych=0 ORPHAN=0.
- npm run check: EXIT 0. npm run typecheck (tsc --noEmit): EXIT 0, 0 błędów.
- Dryf: worktree gra/src/ui/cityPanel.ts vs edb8fb56: 15/15 ciał jednostek bajtowo identycznych (przesunięte numery linii).
- Pomiary długie poza zakresem (przeglądarka, Rust): nie wykonywano. Harness i mutacje uruchomione jako wymagane kryteriami dispatchu.

BLOKADY: brak blokad procesowych. Rebase na origin/rust-port/parity-v2 NIE wykonano: 12 commitów różnicy, merge-tree daje konflikt wyłącznie w PORTING-QUEUE.md (do integracji).

RUNDY: 3/5. Następna: Evaluator (r3).

NASTĘPNY KROK: Evaluator r3 na commitach fef47ba9 i afb029bc.
Otwarte, NIE_ZMIERZONO:
- Produkcyjny wywołujący `installK07bWiring` (panel miasta, blok 9) — K09/integracja.
- CityRefDto nie ma pól oblegane/produkcja/budowa; reguły (cityPracaSplit, resolveCityHealth, resolveOrderState, …) w wiringu to atrapy MOCK_K07B_FNS lub usługi.
- Zachowanie w przeglądarce (Vite) — NIE_ZMIERZONO; harness jsdom.
- Bezpośrednia asercja literałów K07B-Z3 (pośrednio przez zachowanie).
- Placeholder mapy okolicy (P5-8 §6).

DEPLOY/PUSH: NIE WYKONANO
