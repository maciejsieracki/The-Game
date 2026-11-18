# R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 — obrona po zarzutach Evaluatora (kandydat a68476c70)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1
GOAL: zamknąć zarzut 1 (okablowanie main.ts niepokryte testem) i odpowiedzieć na uwagę o F2.
ZMIANY-COMMIT: SHA końcowy w polu sha zwrotki. Pliki: gra/src/game/peace-tail-payment.ts (nowa funkcja czysta peaceTailPricingForPayer + typ PeaceTailWiringDeps), gra/src/main.ts (peaceTailPricingFor, payerStock, playerStock przekazują getter do tej funkcji; poza tymi hunkami i importem brak zmian), gra/tools/diplo-peace-tail-integration-test.cjs (sekcja W1–W3, mutant M8), ten raport.

## Zarzut 1 — PRZYJĘTY (częściowo)
Dowód problemu: mutacja playerStock → 0 w main.ts nie była wykrywana, bo main.ts nie jest ładowany przez testy.
Poprawka: składanie zapasów i epoki płatnika wydzielone do funkcji czystej `peaceTailPricingForPayer(payerId, partnerId, deps)`; zapasy i epoka czytane WYŁĄCZNIE dla płatnika. main.ts tylko przekazuje getry (`treasuryOf: ownerTreasury`, `stockOf: ownerResourceStock`, `eraOf: dealTradeEraForOwners`).
Dowód: `node tools/diplo-peace-tail-integration-test.cjs` → 42 pass / 0 fail. W1 (tylko płatnik w logu wywołań getterów), W2 (epoka z eraOf(płatnik, partner)), W3 (ujemny/NaN → 0). Mutant M8 (zapasy płatnika czytane z partnera) wykryty.
NIE ZMIERZONO / POZOSTAJE: wybór argumentu w main.ts (ME() vs proposerId w playerStock/payerStock/ogonPokoju) oraz treść closure ownerTreasury/ownerResourceStock nie są wykonywane przez żaden test (main.ts nie jest bundlowany). Mutacja Evaluatora (playerStock → 0 w main.ts) NADAL nie zostaje wykryta. Domknięcie wymaga haka civTest lub testu żywego (Chromium) — poza zakresem tej rundy.

## Uwaga o F2 — CZĘŚCIOWO ODRZUCONA
F2 nie używa kopii logiki z testu: `M.ownerResourceStock` i `M.transferSurowiecIlosc` to funkcje z bundla src/game/building-stock-cost.ts. Zarzut jest trafny w jednym punkcie: main.ts ma własny closure `ownerResourceStock(ownerId,key)` (main.ts ~25565, sumuje `cities`), którego F2 nie wykonuje. Ten closure pozostaje NIE ZMIERZONO.

## Bramki (liczby z surowego wyjścia)
- tsc --noEmit: exit 0 (0 błędów)
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: ALL GREEN; ai-unit-replace-same-rules: 45/0; unit-replace-test: 21/21; combat-test: All sanity checks passed (army-hunger-combat-test: 13/0)
- last-stage-payment: OK; tail-proposal: 9 pass / 0 fail; tail-integration: 42 pass / 0 fail
- regresja pokoju: pw-power-ratio 48 PASS/0; price-wiring 14/0; price-decay 13/0; balance-accept 32/0; winner-proposal-table SUMA 77/0; sensible-deals (non-live) 63/0; war-peace-sim 25/0; weariness-city-only 26/0; wiki-weariness 18 asercji/0
- NIE ZMIERZONO / ZNANE: diplomacy-sensible-deals-live-test 4 pass / 3 fail (test live w przeglądarce; nie porównano z bazą; zmiana nie dotyka logiki bramki); unit-replace-full-cost-test 39 pass / 1 fail (asercja „performUnitReplace pobiera PELNY Pieniadz" — słice main.ts ~8724 i unitReplaceExecuteDeps, których hunki tej rundy nie dotykają; nie porównano z bazą)

## Środowisko
gra/node_modules w worktree to SYMLINK do wf_9d3ddf6b-5fd-1/gra/node_modules (3,4 GB wolne, brak miejsca na npm ci). Symlinku NIE usunięto (zakaz unlink); do usunięcia przez orkiestratora. Nie zbudowano vite, nie uruchomiono Chromium.

## Zakres
Nie ruszono: showForcedPeaceModal, kolejki okien, bramki „Zakończ turę", gra-robocza, WERSJE.md, manifest, rust-port. Uwaga: diplomacy-ai-forced-peace.ts (zmieniony w a68476c70) nie figuruje w allowliście dispatchu — do ratyfikacji przez orkiestratora; ten temat go nie zmienia.

BLOKADY: brak (zarzut 1 domknięty tylko częściowo, patrz wyżej)
RUNDY: 3/5 (obrona po zarzutach Evaluatora r3)
NASTĘPNY KROK: Evaluator ponownie na tym SHA; Final Control; ewentualnie hak civTest dla wiązania main.ts.
DEPLOY/PUSH: NIE WYKONANO
