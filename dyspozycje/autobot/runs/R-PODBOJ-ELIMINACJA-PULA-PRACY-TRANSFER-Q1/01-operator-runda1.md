STATUS: PASS
DOMAIN: GAME
TEMAT: R-PODBOJ-ELIMINACJA-PULA-PRACY-TRANSFER-Q1
GOAL: Przy ELIMINACJI cywilizacji (ostatnie miasto/stolica) pula pracy CAŁEJ ofiary
(`ownerPracaPool`) ma trafić (dodać się) do puli zdobywcy, zamiast być zerowana. Przy
zdobyciu stolicy BEZ eliminacji (obrońca przeżywa z innymi miastami) — bez zmian
(nadal zerowana). ECHO właściciela 2026-09-07, ODWRACA CZĘŚĆ kanonu 2026-08-09
(036173f7) WYŁĄCZNIE dla podprzypadku eliminacji.

ZMIANY/COMMIT:
Baza rebase'owana z c469c7b5 na aktualny origin/main (3f7c68e3) przed pracą — brak
konfliktu z dwoma nowymi commitami main (panel punktów, cityPanel.ts/orderPanel.ts —
poza allowlistą tego tematu).

1. `gra/src/game/capital-capture.ts` (`applyCapitalCapturePlunder`):
   - Nowe pole `pracaPoolPrzejeta: number` w `CapitalCaptureOutcome` — kwota FAKTYCZNIE
     przejęta od ofiary (0 poza Zdarzeniem 2, tak jak `naukaPrzejeta`).
   - Przy `eliminacja===true`: `pracaPoolPrzejeta = access.getPracaPool(oldOwner)`;
     jeśli >0, `access.setPracaPool(newOwner, access.getPracaPool(newOwner) +
     pracaPoolPrzejeta)` PRZED wyzerowaniem ofiary — dokładnie ten sam wzorzec co
     transfer skarbca ("100% do zwycięzcy") w tej samej funkcji, powielony.
   - Przy `eliminacja===false` (stolica, cywilizacja przeżywa): kod niezmieniony —
     `access.setPracaPool(oldOwner, 0)` bez transferu, dokładnie jak przed tą zmianą.
   - `barbarianCaptorResourceAccess` (guard barbarzyński) rozszerzony o no-op
     `setPracaPool` DO `newOwner` — dopóki pula pracy ZAWSZE przepadała, nie było czego
     no-opować; teraz, gdy Zdarzenie 2 dopisuje pulę ofiary do `newOwner`, ten sam
     "barbarzyńcy nie dziedziczą łupu" musi objąć i pulę pracy (symetrycznie ze
     skarbcem/nauką/technologiami). Bez tego barbarzyński zdobywca dostałby na konto
     pulę pracy, której realnie nigdy nie używa.

2. `gra/src/main.ts` (WYŁĄCZNIE `buildCityCaptureReportRows()` i cztery najbliższe
   wywołania, jak w allowliście):
   - `CityCaptureReportInput` dostał pole `pracaPoolPrzejeta: number`.
   - Wiersz „Pula pracy" w `buildCityCaptureReportRows()` rozdzielony na trzy gałęzie:
     `kind==='stolica'` → BEZ ZMIAN, „przepadła — nie przechodzi na zdobywcę";
     `kind==='eliminacja'` + `barbarzyncaZdobywca` → „przepadła — barbarzyńcy nie
     dziedziczą zdobyczy" (ofiara nadal traci normalnie, ale barbarzyńcy nic nie
     dostają — spójne z gałęzią złota/nauki/tech powyżej);
     `kind==='eliminacja'` + NIE-barbarzyńca + `pracaPoolPrzejeta>0` → „+N — przejęta od
     wyeliminowanej cywilizacji" (`group:'strata'`, żeby krótka karta panelu WYDARZENIA
     nadal niosła wyłącznie łup jak dotąd — kontrakt bramki, sekcja 9-0b — pełna liczba
     trafia do PEŁNEGO modalu, nie do skrótu).
     Wartość zerowa (`pracaPoolPrzejeta===0`) NIE tworzy wiersza (reguła 1: pozycja
     zerowa nie powstaje).
   - Cztery wywołania `buildCityCaptureReportRows({...})` (kapitulacja głodowa `zwykle`,
     ~13563; stolica ~26687; eliminacja ~26744; podbój bojowy `zwykle` ~27155) dostały
     pole `pracaPoolPrzejeta` — `0` dla `zwykle`/`stolica`, `Math.floor(outcome.
     pracaPoolPrzejeta)` dla `eliminacja`.

3. Testy (allowlista `gra/tools/*.cjs`):
   - `capital-capture-test.cjs`: rozszerzone sekcje 2/3 (asercja `res.pracaPoolPrzejeta`
     dla obu zdarzeń) + NOWE sekcje 16 (liczby PRZED/PO obu stron, oba scenariusze,
     `makeSymmetricAccess`) i 17 (barbarzyński zdobywca + eliminacja — pula NIE trafia
     na konto barbarzyńców, plus test bezpośredni owijki). 107/107 PASS.
   - `miasto-zdobycie-raport-test.cjs`: `BAZA` dostała `pracaPoolPrzejeta: 0`; sekcja 7
     (gałąź barbarzyńska) i 9 (pełny bilans modalu) zaktualizowane pod nowe teksty.
     95/95 PASS (przed moją zmianą: 2 czerwone regresje na starym tekście, oczekiwane —
     dispatch WYMAGA innej treści dla `kind==='eliminacja'`).
   - `eliminacja-lup-kwoty-test.cjs`: sekcja 4 („żywy dowód") dostała seed puli pracy
     ofiary=90 i asercje PRZED/PO na realnym `applyCapitalCapturePlunder` + realnym
     wyciętym call-site z main.ts. 38/38 PASS.
   - `podboj-kolejka-budynek-niemozliwy-test.cjs`: sekcja D (budynek nie-stołeczny)
     rozszerzona o `eq(resultProd.postep, 5, ...)` — weryfikacja części (b), patrz niżej.
     79/79 PASS.

BLOKADY: brak.

TESTY (dokładne wyniki):
- `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`) — czysto, 0 błędów.
- `node tools/capital-capture-test.cjs` — CAPITAL-CAPTURE-TEST OK (107/107).
- `node tools/miasto-zdobycie-raport-test.cjs` — 95 passed, 0 failed.
- `node tools/eliminacja-lup-kwoty-test.cjs` — 38 passed, 0 failed.
- `node tools/podboj-kolejka-budynek-niemozliwy-test.cjs` — 79 passed, 0 failed.
- Regresja szersza (niezmienione pliki, kontrola że nic sąsiedniego się nie posypało):
  `post-capture-law-test.cjs` 25/0, `ai-city-capture-integration-test.cjs` OK (14),
  `barb-city-capture-cluster-test.cjs` 96/0, `capital-sep-pangea-test.cjs` 3/0,
  `capital-sep-unit-test.cjs` 36/0, `ai-zdobycie-miasta-adiacencja-test.cjs` OK (96/96).

REGUŁA PRZECIW SAMOOSZUKIWANIU — konkretne liczby PRZED/PO (z `capital-capture-test.cjs`
sekcja 16, `makeSymmetricAccess` — newOwner realnie obserwowalny, nie zamaskowany
mockiem jak w starszych sekcjach 2-3):

Scenariusz A — ELIMINACJA (oldOwner=3 traci jedyne miasto na rzecz newOwner=7):
  PRZED: ownerPracaPool(zdobywca=7) = 30   ownerPracaPool(ofiara=3) = 120
  PO:    ownerPracaPool(zdobywca=7) = 150  ownerPracaPool(ofiara=3) = 0
  (150 = 30 + 120 — DODANA do istniejącej puli zdobywcy, nie zastąpiona; `res.
  pracaPoolPrzejeta === 120`, dokładnie kwota ofiary sprzed zdarzenia.)

Scenariusz B — kontrola regresji, STOLICA BEZ ELIMINACJI (oldOwner=4 traci stolicę,
ale ma jeszcze `cityDrugie` — cywilizacja przeżywa; newOwner=8):
  PRZED: ownerPracaPool(zdobywca=8) = 15   ownerPracaPool(ofiara=4) = 90
  PO:    ownerPracaPool(zdobywca=8) = 15   ownerPracaPool(ofiara=4) = 0
  (zdobywca NIETKNIĘTY — nadal 15, nie 105; `res.pracaPoolPrzejeta === 0`. Kanon
  2026-08-09 dla TEGO podprzypadku pozostaje identyczny jak przed tą rundą.)

Żywy dowód z `eliminacja-lup-kwoty-test.cjs` (realny `applyCapitalCapturePlunder` +
realny, wycięty z main.ts call-site raportu, gracz=0 eliminuje AI=3): PRZED
ownerPracaPool(0)=0, ownerPracaPool(3)=90 → PO ownerPracaPool(0)=90, ownerPracaPool(3)=0;
wygenerowany tekst dla gracza: „Pula pracy: +90 — przejęta od wyeliminowanej cywilizacji".

Weryfikacja części (b) — budynek w budowie w zwykłym mieście: POTWIERDZONA, kod
NIEZMIENIONY (jak nakazywał dispatch). `applyCityCaptureAfterBattle`
(post-battle-map.ts:411-497) zmienia wyłącznie `city.ownerId` (+kultura/Prawo/garnizon),
nigdy nie dotyka `cityProd`/kolejki produkcji. `sanitizeBuildQueue`/
`sanitizeProductionQueue` (main.ts) forfeitują WYŁĄCZNIE: (1) legacy jednostki w
kolejce → pula PRZEGRANEGO, (2) budynki `lokalizacja:'stolica'` niebudowalne u nowego
właściciela → pula ZDOBYWCY, (3) cuda zablokowane bramką → pula zdobywcy. Zwykły
budynek (nie-stołeczny, nie cud) przechodzi przez oba filtry nietknięty. Dowód
wykonaniem: rozszerzona sekcja D `podboj-kolejka-budynek-niemozliwy-test.cjs` —
`CityProduction.postep` (zebrana Praca frontu) = 5 PRZED przejęciem miasta, = 5 PO
(realny, wycięty kod main.ts, nie reimplementacja) — `eq(resultProd.postep, 5, ...)`
zielone. Nic w tej części nie zostało zmienione w kodzie produkcyjnym.

RUNDY: 1/5
NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
