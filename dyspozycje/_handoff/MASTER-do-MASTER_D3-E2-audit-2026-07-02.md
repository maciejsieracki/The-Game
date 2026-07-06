# Audit D3 v1.1 + E2-PARAMS — 2026-07-02

**Audytor:** subagent (Master sprint) · **Źródła:** `docs/decyzje/D3-v1.1-MACIEJ-2026-06-30.md`, `docs/obieg/E-start.md` §E2

---

## D3 v1.1 — podsumowanie

| Obszar | Status modułu (lane D) | Status SILNIK (`main.ts`) |
|--------|------------------------|---------------------------|
| **T1A trybut ze skarbca** | ✅ `diplomacy-economy.ts` tick + test 6/6 | ✅ `buildDiploTreasury()` → `player.skarbiec` / `aiSkarbiecByOwner` · ⚠️ brak **casus belli** po bankrupt |
| **T2 dwa sojusze** | ✅ `sojusz_defensywny` / `sojusz_pelny` + `allianceObligations` + test 9/9 | ⚠️ tylko `declared_war` — brak `attacked` (sojusznik **ofiary** nie wchodzi) · ⚠️ `treatiesBrokenByRefusal` niepodpięty |
| **T3A handel jednorazowy** | ✅ `oneShotTrade` w proposals + koszyk PN | ✅ `executePnDealTransfer` / `applyOneShotGoldTransfer` |
| **activeDeals save/load** | ✅ typ `ActiveDeal` + `hydrateActiveDeals()` (nowe) | ✅ `meta.diplomacyDeals` zapis/odczyt · ⚠️ load bez normalizacji legacy |
| **Legacy `sojusz_wojskowy`** | ✅ `normalizeTreatyKind` → `sojusz_pelny` | ✅ używane w UI/relacjach · load bez hydrate |

**Testy lane D (PASS):** `diplomacy-treaties-test.cjs` 9/9 · `diplomacy-economy-test.cjs` 6/6 · `diplomacy-proposal-test.cjs` (wcześniej zielony)

### Szczegóły T1A

- Co turę: `runDiplomacyTurnTick` → `activeDealsToPaymentDeals` → `tickDiplomacyPayments` odejmuje ze skarbca płatnika.
- Decyzja mówi `player.pieniadz` — w silniku odpowiednik to **`player.skarbiec`** (nazewnictwo, nie luka funkcjonalna).
- **Luka:** przy `broken` tylko `removeTreatiesById` + hint — brak `trybut_odmowa` / casus belli na parze płatnik↔odbiorca.
- **Nowe (lane D):** `tributeBreakPairsFromDeals()` — helper pod F.

### Szczegóły T2

- Moduł: defensywny reaguje na `attacked`, pełny na `declared_war`; odmowa → `treatiesBrokenByRefusal`.
- UI: `diplomacyNegotiationModal` mapuje `allianceKind` → `sojusz_defensywny` / `sojusz_pelny`.
- **Luka SILNIK:** `applyAllianceObligationsOnWar` woła tylko `allianceObligations(..., declared_war)`. Przy gracz atakuje B — sojusznik **defensywny B** nie dostaje zobowiązania wojny z A.
- **Luka SILNIK:** brak ścieżki AI-sojusznik odmawia wojny → zryw traktatu (`treatiesBrokenByRefusal`).
- **Nowe (lane D):** `allianceObligationsForWarDeclaration()` — łączy oba eventy; F podmienia wywołanie w `main.ts`.

### Szczegóły T3A

- `evaluateProposal('handel')` → `oneShotTrade: true`, bez trwałego `ActiveDeal`.
- Dar / PN / legacy gold — wszystkie jednorazowe; brak umowy co turę w v1.1 ✅.

### activeDeals save/load

- Zapis: `meta.diplomacyDeals: activeDeals.slice()` (~L6538).
- Load: `saved.meta?.diplomacyDeals` (~L8760) — **bez** `hydrateActiveDeals`.
- **Nowe (lane D):** `hydrateActiveDeals()` — F: `activeDeals = hydrateActiveDeals(savedDeals)`.

### D3 % complete

| Warstwa | % |
|---------|---|
| Moduły lane D (CYW/EKO/proposals/treaties/UI) | **95%** |
| End-to-end w grze (SILNIK wiring) | **78%** |
| **Łącznie D3 v1.1** | **~85%** |

---

## E2-PARAMS — podsumowanie

| Krok | Dowód | Status |
|------|-------|--------|
| Kreator: miasta-państwa zamiast jakości mapy | `newGameFlow.ts` SETT `city_states_count` · brak `map_quality` w kroku głównym | ✅ |
| Typy cywilizacji + gęstość w zaawansowanych | `civ_types_count` + `resources/rivers/desert/forest_density` w modal zaawansowany | ✅ |
| `buildParams()` → pełne `NewGameParams` | L811–867: `worldDensity`, `civTypesCount`, `cityStatesCount` | ✅ |
| `applyMenuParams` | L7806–7807 `_menuWorldDensity` | ✅ |
| `doStartGame` → generator | L7993–7996 `generujSwiat(..., { worldDensity, mapSizeMenuLabel })` | ✅ |
| Generator używa parametrów | `generator.ts` → `resolveWorldGenNumbers` → `placeDeposits(resourceMult)`, `generateRivers(maxRivers)`, `classifyTerrain(desert/forest thresholds)` | ✅ |
| Źródło liczb Panel-A | `map-gen-params.json` via `map-gen-params-loader.ts` | ✅ |
| `civTypesCount` / `cityStatesCount` w grze | `_menuCivTypesCount`, `applyClusterStartPlan(..., _menuCityStates)` | ✅ |

### E2 drobne uwagi (nie blokery)

- `buildParams()` ustawia `mapQuality` z `DEFAULT_RENDER_QUALITY` (E1 bundle osobno) — zgodne z decyzją przeniesienia jakości mapy poza E2.
- Ścieżki playtest (`generujSwiat` bez `genOpts`) — OK, nie dotyczą kreatora gracza.
- `rivals` w `NewGameParams` = alias `cityStatesCount` (legacy pole).

### E2 % complete

| Warstwa | % |
|---------|---|
| UI kreator + `buildParams` | **95%** |
| Przepływ do generatora + JSON thresholds | **100%** |
| **Łącznie E2-PARAMS** | **~97%** |

---

## Rekomendowane batche Grupy F

### Batch 1 — `SILNIK-D-V11-alliance` (🟡 cross, priorytet)

**Pliki:** `main.ts` only  
**AC:**
1. Zamienić `allianceObligations(..., declared_war)` → `allianceObligationsForWarDeclaration(deals, attacker, victim)` (import z `diplomacy-treaties.ts`).
2. Po wojnie AI-sojusznika: jeśli AI nie dołączy — `treatiesBrokenByRefusal` + `removeTreatiesById`.
3. Smoke: defensywny sojusznik ofiary wchodzi do wojny z agresorem.

### Batch 2 — `SILNIK-D-V11-tribute-casus` (🟡 cross)

**Pliki:** `main.ts`  
**AC:**
1. W `runDiplomacyTurnTick` przed usunięciem dealów: `tributeBreakPairsFromDeals` → `applyDiplomaticEvent(..., 'trybut_odmowa')` lub casus na parze.
2. Hint graczowi o casus belli gdy dotyczy gracza.

### Batch 3 — `SILNIK-D-V11-save-hydrate` (🟢)

**Pliki:** `main.ts` (~L8760)  
**AC:** `activeDeals = hydrateActiveDeals(savedDeals)` zamiast `.slice()`.

### Batch 4 — `E2-smoke` (🟢, opcjonalny)

**AC:** Nowa gra z suwakami gęstości „Mało/Dużo" → porównanie liczby rzek/złóż między presetami (Integrator bramka wizualna).

---

## Zmiany w tej sesji (lane D, bez `main.ts`)

- `diplomacy-treaties.ts`: `hydrateActiveDeals`, `allianceObligationsForWarDeclaration`
- `diplomacy-economy.ts`: `tributeBreakPairsFromDeals`
- Testy: +3 asercje treaties, +1 economy

**→ INTEGRATOR:** batche 1–3 w jednym wpinięciu `SILNIK-D-V11` zalecane.
