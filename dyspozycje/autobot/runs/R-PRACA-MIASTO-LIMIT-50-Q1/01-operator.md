# 01-operator — R-PRACA-MIASTO-LIMIT-50-Q1 — next round after BLOCK Final Control

STATUS: PASS-WITH-NOTES
TEMAT: R-PRACA-MIASTO-LIMIT-50-Q1
GOAL: Lokalny podział Pracy miasta respektuje kontrakt: budynki 50–100%, ulepszenia maksymalnie 50%, suma pozostaje 100%; gracz i AI mają ten sam resolver, override per miasto i migrację starego zapisu.

## Izolacja i routing

- Pracowano wyłącznie w `Civ-clean-main-2026-08-20`; artefaktów `R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1` nie używano jako substytutu.
- Bazowy checkout: branch `work/clean-main-2026-08-20`, HEAD `47cdca15757efb89d5e634e9e9ddff370925708d8`.
- Worktree zawiera zastane, równoległe zmiany. Nie wykonywano resetu, clean, checkoutu ani rozdzielania przez destrukcyjne operacje.
- Poprzedni BLOCK Final Control wynikał z niespójności kontraktu w bieżących plikach: kod nadal dopuszczał 0–49% budynków, a testy utrwalały stare zachowanie. Zostało to naprawione w zakresie tematu.

## Reconciled allowlista

Zakres tematyczny po reconie:

- `gra/src/game/cities.ts` — wspólny clamp 50–100% i normalizacja po load.
- `gra/src/game/empire-city-defaults.ts` — clamp resolvera, globalnego defaultu, override i migracji.
- `gra/src/game/ai.ts` — istniejący finalny clamp AI potwierdzony; bez zmian w tej rundzie.
- `gra/src/ui/cityPanel.ts` — lokalny suwak 50–100% i ten sam clamp w odczycie/event.
- `gra/tools/praca-miasto-limit-50-test.cjs` — test capu 0/50/100, override i migracji.
- `gra/tools/empire-city-defaults-test.cjs` — oczekiwania override/fallback po migracji do capu.
- `gra/tools/praca-split-ui-test.cjs` — zakres lokalnego suwaka 50–100%.
- ten artefakt runu.

`gra/src/ui/buildModeHud.ts` i `gra/src/game/turn-economy.ts` pozostają w allowliście kontrolnej, lecz nie były zmieniane: pierwszy zawiera odrębny historyczny automat, a drugi już korzysta z `resolveCityPodzialPracy`.

## Implementacja i parytet

- Lokalny `procentBudynki` jest clampowany do `[50, 100]`; tym samym `procentUlepszenia = 100 - procentBudynki` nigdy nie przekracza 50%.
- `ensureCityPodzialDefaults` normalizuje także istniejące stare wartości, nie tylko brakujące pola.
- Resolver normalizuje źródło wybrane przez kolejność: override → owner default → city value → fallback.
- Migracja clampuje zapisane defaulty i stare per-city override, zachowując flagę override oraz niezależność od późniejszej zmiany globalnego defaultu.
- UI miasta pokazuje i zapisuje ten sam kontrakt; AI ma ten sam końcowy clamp i zachowuje parytet z torem gracza.
- Remainder budynków/ulepszeń zachowuje całą pulę także dla małych wartości; nie zmieniano nadrzędnego automatu w `buildModeHud.ts`.

## Testy

- `node gra/tools/praca-miasto-limit-50-test.cjs` — **4/4 PASS**.
- `node gra/tools/empire-city-defaults-test.cjs` — **49/49 PASS**.
- `node gra/tools/ai-slider-test.cjs` — **38/38 PASS**.
- `node gra/tools/production-overflow-test.cjs` — **51/51 PASS**.
- `node gra/tools/praca-split-ui-test.cjs` — **13/13 PASS**.
- `git diff --check` — **PASS**.
- TypeScript: **BLOCKED/NOT RUN** — checkout nie ma lokalnego kompilatora TypeScript; `npx tsc --noEmit` trafiło w placeholder `tsc`, a instalacji zależności nie wykonywano.

## Status i następny krok

- Implementacyjny BLOCK został usunięty w tej rundzie; nie wystawiam `READY_FOR_DEPLOY`.
- Routing: **Evaluator → Final Control dla tego samego ID**, z kontrolą wyłącznie powyższej allowlisty i ponowną uwagą o zanieczyszczonym współdzielonym worktree.
- Integracja, commit, deploy i push: **NIE WYKONANO**.
