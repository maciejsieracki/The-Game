STATUS: PASS
DOMAIN: GAME
TEMAT: R-HANDEL-WYMIANA-DAR-DEADLOCK-Q1
GOAL: Technologia "Wymiana" (`TRADE_TECH`) ma dać się podarować/przehandlować partnerowi
bez zbadanych jej prereqów (Garncarstwo + Rolnictwo + Oswojenie zwierząt) —
WYŁĄCZNIE dla tej jednej technologii; reguła "dar wymaga zbadanych prereq u odbiorcy"
zostaje bez zmian dla wszystkich pozostałych technologii.

ZMIANY/COMMIT:
- `gra/src/game/diplomacy-tech-trade.ts` — `techIdsWithPrereqsMetForRecipient()`:
  dodany import `TRADE_TECH` z `trade-routes.ts` (brak cyklu importów — sprawdzone,
  trade-routes.ts nie importuje z tego pliku) oraz wyjątek `id === TRADE_TECH ||
  prerequisitesOf(def).every(...)`. `epochGateMet`/`epochTierGateMet` nietknięte —
  nadal obowiązują dla TRADE_TECH.
- `gra/src/game/diplomacy-basket-transfer.ts` — `grantTechToOwner()`: analogiczny
  import `TRADE_TECH` i analogiczny wyjątek `id === TRADE_TECH || prerequisitesOf(def)
  .every(...)`, epoch/tier gate bez zmian.
- `gra/tools/diplomacy-tech-trade-test.cjs` — dodany blok testowy „wyjątek TRADE_TECH"
  (scenariusze g/h): katalog z realnymi prereqami Wymiany (Garncarstwo+Rolnictwo+
  Oswojenie zwierzat, separator `+` zgodny z `parsePrerequisites`) + niezależna
  technologia kontrolna Kolo (prereq: Rolnictwo).
- `gra/tools/diplomacy-basket-transfer-test.cjs` — dodany blok testowy „wyjątek
  TRADE_TECH" (scenariusze 9/10): `grantTechToOwner(TRADE_TECH, …)` bez prereqów
  odbiorcy → przyznane, kontrola `researchedByOwner.get(id).has(TRADE_TECH)` (odpowiednik
  `ownerHasTradeTech`, który w main.ts czyta dokładnie ten stan przez
  `unlockedTechSetForOwner`); kontrola regresu — Kolo w tych samych warunkach nadal
  odrzucone. Katalog celowo BEZ pól Epoka/Poziom (izolacja osi prereq od epoch/tier-gate,
  te pokryte już istniejącymi scenariuszami 3/4/7/8).
- Brak zmian w `ownerHasTradeTech` (main.ts) — zgodnie z zakazem.
- Commit: patrz `git log` na branchu `autobot/R-HANDEL-WYMIANA-DAR-DEADLOCK-Q1`
  (commit tej rundy tworzony zaraz po zapisaniu tego raportu).

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` — czysto, 0 błędów.
- `node gra/tools/diplomacy-tech-trade-test.cjs` — 30 passed, 0 failed (w tym nowe
  scenariusze g/h: Wymiana BEZ prereqów NA liście odbiorcy; Kolo BEZ prereq Rolnictwo
  NADAL odrzucone — kontrola regresu; Kolo po zbadaniu Rolnictwo wraca — reguła ogólna
  działa niezmieniona).
- `node gra/tools/diplomacy-basket-transfer-test.cjs` — 24 passed, 0 failed (nowe
  scenariusze 9/10: `grantTechToOwner(TRADE_TECH, 11, …)` bez prereqów → `granted:
  true`, `researchedByOwner.get(11).has(TRADE_TECH) === true` (odpowiednik
  `ownerHasTradeTech` po transferze); `grantTechToOwner('Kolo', 11, …)` w tych samych
  warunkach → `granted: false` — dowód, że wyjątek jest PUNKTOWY).
- `node gra/tools/diplomacy-tech-trade-e2e-test.cjs` — 28 passed, 0 failed (bez regresji,
  test nie dotyka bezpośrednio zmienionego kodu, ale przechodzi cały łańcuch
  formularz→wykonanie dla handlu tech-za-tech/gotówka).
- `node gra/tools/diplomacy-tech-trade-execute-test.cjs` — 52 passed, 0 failed (bez
  regresji — silnik wykonania transakcji, w tym scenariusze BLOKER 1/2 i dowody
  mutacyjne, nadal zielone).
- `git diff --check` — czysto, brak whitespace errors.
- Kryterium binarne z dispatchu spełnione: scenariusz (i) — Wymiana bez prereqów
  odbiorcy pojawia się na liście I transfer się powodzi; scenariusz (ii) — inna
  losowa technologia (Kolo) z brakującym prereq NADAL zablokowana na liście i przy
  transferze; scenariusz (iii) — po transferze `researchedByOwner` odbiorcy zawiera
  TRADE_TECH (dokładny odpowiednik odczytu `ownerHasTradeTech` w main.ts, który czyta
  ten sam stan przez `unlockedTechSetForOwner`).

BLOKADY: brak.

RUNDY: 1/5.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
