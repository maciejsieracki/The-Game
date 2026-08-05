# CLOSES-STALE — weryfikacja 2026-08-06 (AutoBot OPERATOR)

Branch: `cursor/closes-stale-open-63a1` · **bez deploy** · aktualna ROBOCZA: `772bab7c` (FALA 248).

| ID | Werdykt | Dowód (kod / bundle) | FALA / md5 | Akcja |
|----|---------|----------------------|------------|-------|
| **R-AI-SUWAKI** | ✅ ZDEPLOYOWANE | `main.ts` import + wywołanie `decideAIEconomySliders` (~L21177); `ai.ts` + `econ-params.json` `ai_suwaki_*`; ROBOCZA: `decideAIEconomySliders`, `ai_suwaki_min_odstep_tur` | FALA 36 `a74c3797` (łańcuch → `772bab7c`) | REJESTR → ZDEPLOYOWANE |
| **BUG-ARMIA-BRAK-POLACZ** | ✅ ZDEPLOYOWANE | `armyStackHud.ts` przycisk „Połącz"; ROBOCZA: „Połącz z sąsiednią armią" | FALA 207 `47a2e73b` | PYTANIA → ZAMKNIĘTE (rejestr już OK) |
| **HANDEL-SPLIT-Q1** | ✅ ZDEPLOYOWANE | `umowa_szlakow` + `umowa_wymiany` w `diplomacy.ts` / `diplomacy-proposals.ts`; ROBOCZA: oba typy traktatów | FALA 80 `7d266143` | PYTANIA → ZAMKNIĘTE B |
| **R-PALAC-KOSZT** | ✅ ZDEPLOYOWANE | `buildings.json` `palac`: brak `koszt_surowce`, `kosztBudowy: 40`; ROBOCZA: ten sam wpis + uwagi „bez kosztu surowcowego" | FALA 248 `772bab7c` (PALAC-KOSZT w zakresie) | REJESTR → ZDEPLOYOWANE |
| **R-RZEKI-UJSCIE-FALA138** | ✅ ZDEPLOYOWANE | `generator.ts` + `gen-helpers.ts` `ensureRiverOutlets` (po topUp + po wybrzeżu); fix `9c4320b` | FALA 140 `935d1642` | REJESTR + PYTANIA → ZDEPLOYOWANE |
| **R-TEREN-DOPIAC** | ✅ ZDEPLOYOWANE | `battleScene.ts` etapy C-TEREN 1–3; `teren-walki-etapy-test.cjs` **33/33** PASS | FALA 36 `a74c3797` | REJESTR → ZDEPLOYOWANE |
| **R-SPAWN-CLUSTER-KULTURA** | ✅ ZDEPLOYOWANE | `clusters.ts` `assignTypesToClusterCenters` + `allocateTypyToMasses`; ROBOCZA: `allocateTypyToMasses` | FALA 142 `2b1e072c` | REJESTR — usunięto „STATUS NIEPEWNY" |
| **R-SUR-DESIGN** (węgiel) | ✅ ZDEPLOYOWANE | `map-gen-params.json` `wegiel.rarity: 0`; `deposit-era.ts` SUR-WEGIEL=B; ROBOCZA: `SUR-WEGIEL=B: ukryty` | FALA 232 `fca41b9a` (SUR-WEGIEL=B) | REJESTR → węgiel ZDEPLOYOWANE |

**GAP:** brak — żaden ID nie wymaga otwartej pracy kodowej.

**Metoda:** grep `gra/src` + inspekcja `gra-robocza/Gra-ROBOCZA.html` (stringi kanoniczne) + `WERSJE.md` łańcuch FALA.
