STATUS: PASS
DOMAIN: GAME
TEMAT: R-PODBOJ-ELIMINACJA-PULA-PRACY-TRANSFER-Q1
GOAL: Przy ELIMINACJI cywilizacji pula pracy CAŁEJ ofiary (`ownerPracaPool`) trafia
(dodaje się) do puli zdobywcy zamiast być zerowana; przy zdobyciu stolicy BEZ eliminacji
— bez zmian.

WERYFIKACJA WYKONANA (niezależnie, w /home/user/wt-podboj-eliminacja-pula-pracy):

1. Git/allowlista: `git diff --stat 3f7c68e3..8ada06e7` — WYŁĄCZNIE pliki z allowlisty
   (`gra/src/game/capital-capture.ts`, `gra/src/main.ts`, 4× `gra/tools/*.cjs`, raporty
   własne w `dyspozycje/.../R-PODBOJ-...`). Zero plików spoza. `git diff --check` czysto
   (brak konfliktów/whitespace). Baza rebase potwierdzona: HEAD~1 = `3f7c68e3` = aktualny
   `origin/main` w repo głównym.
2. Kod `capital-capture.ts` przeczytany w całości (diff): `eliminacja===true` →
   `pracaPoolPrzejeta = getPracaPool(oldOwner)`, jeśli >0 dodaje do
   `getPracaPool(newOwner)` PRZED wyzerowaniem ofiary — DODANIE, nie zastąpienie.
   `eliminacja===false` — kod nietknięty, `setPracaPool(oldOwner, 0)` bez transferu,
   dokładnie jak przed zmianą. `barbarianCaptorResourceAccess` rozszerzony o
   no-op `setPracaPool` do `newOwner` — spójne ze skarbcem/nauką/technologiami.
3. Kod `main.ts` (`buildCityCaptureReportRows` + 4 wywołania) przeczytany w całości —
   zmiana ograniczona wyłącznie do tej funkcji i czterech najbliższych call-site'ów, jak
   zadeklarowano. Rozgałęzienie `kind==='stolica'` (tekst niezmieniony) vs
   `kind==='eliminacja'` (barbarzyńca → "przepadła"; nie-barbarzyńca+>0 → "+N przejęta")
   zgodne z dispatchem.
4. Uruchomione SAMODZIELNIE:
   - `tsc --noEmit` (z `gra/`) — 0 błędów, exit 0.
   - `capital-capture-test.cjs` — 107/107 (zgadza się).
   - `miasto-zdobycie-raport-test.cjs` — 95/95 (zgadza się).
   - `eliminacja-lup-kwoty-test.cjs` — 38/38 (zgadza się), żywy dowód: PRZED
     ownerPracaPool(0)=0, ownerPracaPool(3)=90 → PO (0)=90, (3)=0; tekst "+90 — przejęta
     od wyeliminowanej cywilizacji" — potwierdzony w moim uruchomieniu.
   - `podboj-kolejka-budynek-niemozliwy-test.cjs` — 79/79 (zgadza się).
   - Regresja sąsiednia: `post-capture-law-test.cjs` 25/0, `ai-city-capture-integration-test.cjs`
     OK (14), `barb-city-capture-cluster-test.cjs` 96/0, `capital-sep-pangea-test.cjs` 3/0,
     `capital-sep-unit-test.cjs` 36/0, `ai-zdobycie-miasta-adiacencja-test.cjs` OK (96/96)
     — wszystkie liczby identyczne z raportem Operatora.
5. Weryfikacja liczb PRZED/PO z sekcji 16 (`makeSymmetricAccess`) skonfrontowana z
   ziarnem w źródle testu: `{ praca: { 3: 120, 7: 30 } }` (Scenariusz A, eliminacja) i
   `{ praca: { 4: 90, 8: 15 } }` (Scenariusz B, stolica bez eliminacji) — dokładnie
   zgodne z liczbami podanymi w raporcie Operatora (30+120=150 zdobywca; 15 nietknięty).
6. Część (b) (budynek w budowie, zwykłe miasto): potwierdzone bez zmiany kodu —
   `post-battle-map.ts` istotnie nie dotyka `cityProd`; rozszerzona asercja w sekcji D
   (`postep===5` przed i po) obecna i zielona w moim uruchomieniu.

ZARZUTY: brak.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator PASS → orkiestrator dispatchuje Final Control (Ścieżka A, Workflow) → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
