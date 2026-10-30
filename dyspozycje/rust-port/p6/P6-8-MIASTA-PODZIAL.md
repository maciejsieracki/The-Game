# P6.8 — Miasta: ekonomia, produkcja, budynki, okolica — rekonesans i podział (wersja 2)

**Temat:** `R-RUSTPORT-P6-8-MIASTA-REKONESANS-Q1` · **Runda:** 2/5 (poprawka po zarzutach) · **Rola:** Operator (obrona) · **Status:** dokument, ZERO zmian kodu (`rust-port/**`, `gra/**`, `src-tauri/**` nietknięte).

**Baza R1:** `84e19cbc` (rodzic `4c005237`). **Baza R2:** `84e19cbc` + commit poprawki (SHA w `dyspozycje/autobot/runs/R-RUSTPORT-P6-8-MIASTA-REKONESANS-Q1/02-operator-r2.md`).
**Pin webu (cel):** `91dc998a5f1b51ad29e0f4785edfd45655445c53`. **Pin dotychczasowy:** `edb8fb56`. Pinu nie przesuwano.

**Źródła kontekstu (docs-branch `claude/sprawdzenie-funkcjonalnosci-ek4ra0`):** `p6/P6-0-GAP-ANALYSIS.md` (§3, §6b), `REPIN-DELTA-20261029.md` (§3, §5), dispatche `R-RUSTPORT-REPIN-EKONOMIA-{B2,B3,C,D}-Q1` (`00-dispatch.md`), run `R-RUSTPORT-REPIN-EKONOMIA-B2-Q1` (generator wektorów).

**Lista 18 pozycji:** z `P6-0-GAP-ANALYSIS.md` tabela 1a (P6.8 = 1 CZ.nazwa + 11 CZ.domena + 6 BRAK = 18). `PLAN-PORT-RUST-TAURI-20261020.md` §P6.8 podaje ją ogólnie (ZAŁOŻENIE Z-1).

## Zmiany względem R1 (co poprawiono i dlaczego)

1. **Lista symboli** — dodana: §11, 515 symboli top-level (304 funkcji) z plik:linia (91dc998a), rodzajem, LOC, tematem i partią. Każdy symbol ma właściciela (asercja w generatorze, §0).
2. **Gotowe treści dispatchów** — §9: dla każdego z 10 tematów GOAL, ALLOWLISTA, kryteria końca, zależności, plan wektorów, bramki.
3. **Limit rozmiaru** — 10 tematów zachowane; tematy >600 LOC rozbite na partie (`P1…Pn`) na granicy funkcji; wyjątek jednej funkcji (633 LOC) jawnie w Z-9; alternatywa (Opcja B) opisana w §3.
4. **Cytowania Rust** — ponowiony `grep` po `rust-port/engine/{src,tests}` (§1, kolumna „cytowania”); poprawione: poz. 9, 15, 16, 18; allowlisty 8G/8H/8D uzupełnione.
5. **Statusy** — ponownie wyznaczone pomiarem: (a) trafienia nazw funkcji web w Rust dla wszystkich 304 funkcji (`snake_case`/camelCase, §0), (b) cytowania. Wynik: **PORTOWANE: 0**; CZĘŚC. 8; BRAK 10. Różnice względem GAP opisane w §1.
6. **`wealth.ts`** — zmiana **behawioralna** (dwie nowe funkcje `wealthParamsWithCapModifier`, `wealthParamsWithMultiplierModifier` z modyfikatorem `mul_proc`), klasyfikacja poprawiona; w Rust brak odpowiednika (§1, poz. 16; §10).
7. **Hunki** — `economy.ts` (41) i `production.ts` (44) zmapowane każdy hunk → symbol → temat → partia (§10). Klasyfikacja heurystyczna (komentarz / nie-komentarz); B2-portowane hunki wg dispatchu B3: 3, 7, 8–14 (zgodne z cytowaniami w `building_costs.rs`, `production_units.rs`).
8. **Kolizje** — Z-4 zweryfikowane: dispatch B3 w ALLOWLISCIE ma `domain/{city_growth,recruitment}.rs` (§4). Dodana zależność od modułów NOWYCH tematu D (`economy_yield.rs`, `work_tax.rs`) dla 8F.
9. **Plan wektorów** — NIE_ZMIERZONO rozstrzygnięte: generator B2 (`gen-repin-b2-vectors.mjs`, Node 22, bez builda) **odtworzył bajt-w-bajt 4 committed pliki wektorów B2** z archiwum `91dc998a` (§5).
10. **Spójność oznaczeń** — jednolite etykiety tematów `8A…8J` (R1 mieszało `T1…T10`); granice linii `production.ts` jako przedziały półotwarte po początku symbolu: `[1,682)`→8A, `[682,1253)`→8B, `[1253,1977)`→8C, `[1977,2542)`→8B. Funkcja `unitStockShortfallLabel` (start 682) ma jednego właściciela (8B).
11. **Raport** — SHA bazy i poprawki w `02-operator-r2.md`.

---

## 0. Metoda i komendy weryfikacyjne

| Co | Komenda / metoda | Wynik |
|---|---|---|
| Wersje weba 91dc998a do odczytu poza repo | `git archive 91dc998a5f1b51ad29e0f4785edfd45655445c53 gra/src gra/data` → rozpakowane do katalogu tymczasowego poza repo | OK |
| LOC (`wc -l`) 18 plików @91dc998a | `wc -l gra/src/game/<18 plików>.ts` | suma **10150** (asercja w `build.py`: suma symboli per plik = `wc -l`) |
| Symbole top-level (kolumna 0) | skrypt `symbols.py`: `function`, `const`/`let`/`var`, `type`, `interface`, `class`, `enum` | **515** symboli: fn **304**, const **99**, type **111** (w tym interface), class **1** (`pending-improvements`), enum 0 |
| Przypisanie każdego symbolu do tematu i partii | skrypt `build.py` (asercja: 515 wierszy, każdy z `temat` i `partia`) | **515 / 515**, zero bez właściciela |
| Zakres zmian edb8fb56→91dc998a | `git diff --shortstat edb8fb56 91dc998a -- <18 plików>` | 6 z 18 plików zmienionych, +393/−275 |
| Hunki `economy.ts` / `production.ts` / `wealth.ts` | `git diff -U0 edb8fb56 91dc998a -- <plik>` → `skrypt hunks.py`/`build.py` | economy **41**, production **44**, wealth **1** (razem 86) |
| Nazwy funkcji web w Rust (pomiar) | skrypt `namehits.py`: dla każdej z 304 funkcji szukaj `snake_case` i oryginalnej nazwy (`\b…\b`) w `rust-port/engine/src/**` (`.rs`, `.json`) | trafienia **33 / 304** (wynik górny: zawiera fałszywe trafienia, np. `pick`, `round4`, `enqueue`, `clampPct`) |
| Cytowania Rust | wyszukiwanie `<nazwa>.ts` w `rust-port/engine/{src,tests}` | §1, kolumna „cytowania” |
| Kolizja z mapgen (landsea) | wyszukiwanie `landsea` w `rust-port/engine/src` | 0 wspólnych ścieżek z allowlistami P6.8 (`data/derived.rs` — tabele mapgen, poza allowlistami) |
| Generator wektorów B2 bez builda | `node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs ./gen-repin-b2-vectors.mjs <web-root> <out>` (Node v22.22.0) | exit 0; 4 pliki **identyczne bajt-w-bajt** z `tests/p6_repin_b2_vectors/*.json` (`cmp`) |
| Dyspozycje B2/B3 (zakres, allowlisty) | `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/<run>/00-dispatch.md` | §4 |

**Rozmiary tematów (LOC, fn):** podane w §3 i wygenerowane z tych samych danych co §11.

---

## 1. Tabela 18 pozycji (stan po pomiarze R2)

**Legenda statusu.** PORTOWANE = pełne pokrycie funkcji (nie stwierdzono ani jednej pozycji). CZĘŚC. = ≥1 zgodne cytowanie `web:` w `src`/`tests` albo ≥1 trafienie nazwy funkcji o niezerowej wiarygodności. BRAK = 0 zgodnych cytowań i 0 wiarygodnych trafień nazw (*) — **BRAK\* to wynik pomiaru nazw, NIE_ZMIERZONO funkcjonalnie** (Rust mógł zaimplementować logikę pod inną nazwą; wymaga weryfikacji w temacie).

| # | Plik web (91dc998a) | LOC / fn | Status R2 (pomiar) | Status GAP (R1) | Trafienia nazw (z fn) | Cytowania Rust (`src`/`tests`, plik:linia) | Zmiany edb8fb56→91dc998a | Temat |
|---|---|---|---|---|---|---|---|---|
| 1 | `auto-improvements.ts` | 1051 / 4 | BRAK\* | CZĘŚC. | 0/4 | brak | 1 hunk (kolejność `AI_IMPROVEMENT_PRIORITY`, behawioralna wg R1, nie ponownie zmierzona) | 8I |
| 2 | `building-upgrades.ts` | 248 / 14 | BRAK\* | CZĘŚC. | 0/14 | brak | — | 8A |
| 3 | `citizen-resource-upkeep.ts` | 353 / 4 | CZĘŚC. (tylko dane) | CZĘŚC. | 0/4 | `data/economy_society.rs:868` (loader `citizen-resource-upkeep.json`, nie logika) | — | 8D |
| 4 | `cyna-access.ts` | 89 / 5 | BRAK\* | BRAK | 0/5 (`improvementKeysOnPlaced` = nazwa wspólna, nie liczona) | brak (`hasCynaAccess` nieobecne) | — | 8H |
| 5 | `economy-upkeep.ts` | 1174 / 42 | CZĘŚC. | CZĘŚC. | 3/42 (`magazynEraMultiplier`, `readCityFoodBuffer`, `stripDiacriticsLower`) | `city_growth.rs:844`, `state.rs:2450`, `derived.rs:132`, `derived.rs:4303` | — | 8E |
| 6 | `economy.ts` | 1243 / 23 | CZĘŚC. | CZĘŚC. | 3/23 (`cityPopulationCap`, `resolvePopulationCapMatrixDelta`, `populationGrowth`) | `improvements.rs:655`, `terrain.rs:535`, `city_growth.rs:392,526,533,892,917,1684–1764,2123`, `derived.rs:4275` | M, **41 hunków** (25 nie-komentarz, 16 komentarz; §10) — zakres REPIN-D | 8F |
| 7 | `gold-deficit.ts` | 250 / 13 | BRAK\* | CZĘŚC. | 0/13 realnych (`pick`, `round4` = fałszywe) | brak (`gold_deficit` w `recruitment.rs:793,839` — bez cytowania, inne znaczenie NIE_ZMIERZONO) | — | 8D |
| 8 | `mennica-zloto-grace.ts` | 108 / 7 | BRAK\* | BRAK | 0/7 | brak (`mennica_zloto` w `building_costs.rs:933–940` bez cytowania, NIE_ZMIERZONO) | — | 8D |
| 9 | `okolica.ts` | 815 / 31 | CZĘŚC. | CZĘŚC. | 5/31 (`cityRangeForPopulation`, `citySightRadius`, `hexKeysWithinRadius`, `rebalanceWorkersAfterPopulationChange`, `computeLostToNearerSiblingByCity`) | `terrain.rs:138,249,391`, `territory.rs:13,183`, `start_position.rs:587`, `improvement_build.rs:14,812,815`, `city_growth.rs:534,1449` (+ `rebalance…` w `city_growth.rs:1450`); testy `p6_1c_llama_seed.rs:196`, `p6_23_fort.rs:2`, `p6_7a_post_central.rs:7–8` | — | 8G |
| 10 | `pending-improvements.ts` | 74 / 2 | BRAK\* | BRAK | 0/2 | brak | — | 8A |
| 11 | `production.ts` | 2541 / 74 | CZĘŚC. | CZĘŚC. | 11/74 | `building_costs.rs:209,994,1578,1585,1601,1618,1628,1641,1672,1715,1776,1784`, `production_units.rs:1,23,34`, `recruitment.rs:1378,1385`, `derived.rs:218`; testy `p6_repin_b2_production.rs` | M, **44 hunki** (42 nie-komentarz, 2 komentarz); B2 zintegrowało hunki **3, 7, 8–14** (wg dispatchu B3; cytowania zgodne) | 8A / 8B / 8C |
| 12 | `relief-preserving-improvements.ts` | 43 / 2 | BRAK\* | BRAK | 0/2 | brak | M, 2 hunki (zbiór kluczy +`tartak`, wg R1) | 8I |
| 13 | `resource-access.ts` | 362 / 16 | BRAK\* | CZĘŚC. | 0/16 | brak (`has_trade_route_resource_access` w `trade.rs:1676` to inna logika) | — | 8H |
| 14 | `society-breakdown.ts` | 1172 / 36 | BRAK\* | BRAK | 0/36 realnych (`clampPct` fałszywe) | `ids.rs:44` (stała `-99`, nie logika); test `p6_1_owner_seats.rs:34` | M, +33 (nowa fn `applyCivMatrixHappinessModifier`, `:1077–1118`, behawioralna) | 8J |
| 15 | `society-inputs.ts` | 122 / 7 | CZĘŚC. | CZĘŚC. | 1/7 (`clearCityCultureMix`) | `state.rs:544–545` (cytowanie), `state.rs:546,581` (`culture_mix`) | — | 8H |
| 16 | `wealth.ts` | 271 / 10 | CZĘŚC. (stan) / **BRAK (2 fn behawioralne)** | CZĘŚC. (nazwa) | 2/10 (`wealthZadowolenie`, `freshWealthState`) | `state.rs:1661`, `state.rs:1759` (`wealth.ts:249`); `wealthParamsWith*` — 0 trafień | M, +20: **2 nowe funkcje behawioralne** (`wealthParamsWithCapModifier`, `wealthParamsWithMultiplierModifier`, mnożnik `mul_proc`) | 8D |
| 17 | `zelazo-access.ts` | 89 / 5 | BRAK\* | BRAK | 0/5 realnych | brak (`hasZelazoAccess` nieobecne) | — | 8H |
| 18 | `zloto-access.ts` | 145 / 9 | CZĘŚC. | CZĘŚC. | 3/9 (`empireZlotoStock`, `ownerCanFeedMennica`, `improvementKeysOnPlaced`) | `building_costs.rs:910,913,925,926,930`, `derived.rs:4008`; test `p6_7b_gate.rs:2` | — | 8H |

**Sumy (pomiar R2):** PORTOWANE **0**; CZĘŚC. **8** (poz. 3, 5, 6, 9, 11, 15, 16, 18); BRAK\* **10** (poz. 1, 2, 4, 7, 8, 10, 12, 13, 14, 17).
**Różnice względem GAP (R1 / P6-0):** GAP przypisywał CZĘŚC. 12 pozycjom; pomiar R2 potwierdza 8. Pozycje 1, 2, 7, 8, 10, 12, 13 mają 0 cytowań i 0 zgodnych nazw → BRAK\*. Pozycja 9 (okolica) pozostaje CZĘŚC.; R1 miało niepełne cytowania (brak `terrain.rs`, `territory.rs`, `start_position.rs`, `improvement_build.rs`). Pozycja 15 (society-inputs) pozostaje CZĘŚC.; R1 podawało „brak” — błąd, cytowanie `state.rs:544`. Poz. 16 (wealth): stan CZĘŚC., ale **obie** nowe funkcje behawioralne są BRAK.

**Uwaga o heurystyce:** trafienia nazw są górną granicą (fałszywe trafienia w 4 przypadkach wymienionych w tabeli). Status „PORTOWANE” wymagałby mapy funkcja→kod dla każdej z 304 funkcji; ta mapa jest zadaniem pierwszego kroku każdego tematu (NIE_ZMIERZONO na poziomie funkcji).

---

## 2. Graf zależności

- `production.ts` → `building-upgrades.ts` (poz. 2), `building-stock-cost`, `building-cost-tempo`, `building-resource-gate`, `civ-matrix`, `difficulty-cost`, `manpower` (P6.5, zamknięte), `r-stawki-strojenie`, `unit-cost-tempo`, `cities`.
- `economy.ts` → `production.ts`, `civ-matrix`, `tech-tree`, `terrain-improvements` (P6.3, zamknięte).
- `economy-upkeep.ts` → `economy.ts`, `production.ts`, `building-stock-cost`, `r-stawki-strojenie`.
- `okolica.ts` → `economy.ts`, `culture-religion`, `terrain-improvements`, `cities`.
- `auto-improvements.ts` → `okolica.ts`, `improvement-tech`, `terrain-improvements`, `cities`.
- `resource-access.ts` → `okolica.ts`, `zloto-access.ts`, `braz-access`, `livestock-unlock`, `terrain-improvements`.
- `pending-improvements.ts` → `improvement-tech`. `building-upgrades.ts` → `unit-building-bonuses`. `gold-deficit.ts` → `combat` (P6.13, poza tematem).
- Bez importów wewnętrznych P6.8: `citizen-resource-upkeep`, `mennica-zloto-grace`, `relief-preserving-improvements`, `wealth`.
- `society-breakdown.ts` → `cities`, `order`. `society-inputs.ts` → `capital-capture`, `cities`, `culture-religion`, `order`. `cyna-access`, `zelazo-access`, `zloto-access` → `terrain-improvements`.
- **Nowe (z dispatchu D):** `economy.ts` (8F) zależy od modułów NOWYCH tematu REPIN-D: `domain/economy_yield.rs`, `domain/work_tax.rs` (poza 18 pozycjami). 8F ich **nie duplikuje** — są zależnością wejściową (wymóg: D zamknięte przed startem 8F).

**Konsekwencja dla kolejności:** łańcuch `production` (8A → 8B → 8C) jest podstawą dla `economy` (8F, po D) → `economy-upkeep` (8E) i `okolica` (8G) → `auto-improvements` (8I) i `resource-access` (8H, część). Bez importów (8D, 8J) mogą startować od razu.

---

## 3. Podział na 10 tematów wykonawczych

**Kryterium dispatchu:** „≤10 tematów, każdy ≤ ~8 funkcji lub ≤ ~600 LOC”. Przy 304 fn i 10150 LOC: 10 × 8 = 80 < 304 oraz 10 × 600 = 6000 < 10150 — kryterium jest sprzeczne (ZAŁOŻENIE Z-2).

**Przyjęta reguła (R2):** (a) 10 tematów (`8A…8J`) — twarde ograniczenie liczby; (b) każdy temat wykonywany w **partiach `P1…Pn` ≤ 600 LOC**, cięcie wyłącznie na granicy symbolu (funkcji/typu) — zgodne z dispatchem „podział na granicy funkcji”; (c) kryterium „≤ 8 fn” nie jest spełnialne i nie jest stosowane; (d) commit po każdej partii (≤4 zmiany behawioralne na commit).

**Opcja B (alternatywa, NIE przyjęta domyślnie):** ≥17 tematów po ≤600 LOC (10150 / 600 ≈ 16,9, więc minimum 17). Zmiana wymaga decyzji orkiestratora; R2 jej nie zakłada.

**Wyjątek Z-9:** `pickAutoImprovements` (`auto-improvements.ts`, jedna funkcja, 633 LOC) nie da się rozbić na granicy funkcji; partia 8I-P2 zawiera tylko ją.

### 3a. Tabela tematów (wygenerowana z tego samego zbioru danych co §11)

| Temat | Pliki web (zakres) | LOC (wc -l) | symbole / fn | partie (LOC ≤600; jedyny wyjątek 8I-P2 = Z-9) |
|---|---|---|---|---|
| 8A | production.ts 1–681, building-upgrades.ts, pending-improvements.ts | 1003 | 57 / 36 | P1: 35 sym., 590 LOC (STRUCTURAL_DEFENSE_PARAM_KEY…buildingLevelForEpoch); P2: 22 sym., 413 LOC (buildingEffectAtLevel…UNIT_STOCK_GATE_LABEL) |
| 8B | production.ts 682–1252 i 1977–2541 | 1136 | 51 / 39 | P1: 23 sym., 598 LOC (unitStockShortfallLabel…setPaused); P2: 28 sym., 538 LOC (enqueueRecruitment…cityMoneyOutput) |
| 8C | production.ts 1253–1976 | 724 | 18 / 15 | P1: 15 sym., 573 LOC (frontItem…promoteToFront); P2: 3 sym., 151 LOC (insertAtFront…advanceProduction) |
| 8D | citizen-resource-upkeep, gold-deficit, mennica-zloto-grace, wealth | 982 | 66 / 34 | P1: 37 sym., 573 LOC (CitizenUpkeepEraRow…GoldDeficitStarvationResult); P2: 29 sym., 409 LOC (applyGoldDeficitHpLoss…freshWealthState) |
| 8E | economy-upkeep | 1174 | 71 / 42 | P1: 34 sym., 597 LOC (Difficulty…DEFAULT_UPKEEP_PARAMS); P2: 37 sym., 577 LOC (loadUpkeepParams…buildingUpkeepForBuiltIds) |
| 8F | economy | 1243 | 52 / 23 | P1: 32 sym., 588 LOC (BuildingYieldKey…CityBuildingEntry); P2: 14 sym., 562 LOC (cityBuildingEntriesFromBuiltIds…populationGrowth); P3: 6 sym., 93 LOC (productionProgress…corruptionBuildingReduction) |
| 8G | okolica | 815 | 36 / 31 | P1: 30 sym., 548 LOC (OKOLICA_RADIUS…rebalanceWorkersAfterPopulationChange); P2: 6 sym., 267 LOC (adjustTileWorker…computeLostToNearerSiblingByCity) |
| 8H | cyna-access, resource-access, society-inputs, zelazo-access, zloto-access | 807 | 72 / 42 | P1: 51 sym., 599 LOC (KOPALNIA_CYNY_KEY…ZLOZE_ZELAZO_KEY); P2: 21 sym., 208 LOC (improvementKeysOnPlaced…placedImprovementsWithZlotoTradeGrant) |
| 8I | auto-improvements, relief-preserving-improvements | 1094 | 23 / 6 | P1: 17 sym., 418 LOC (AutoImprovementCity…PickAutoImprovementsOpts); P2: 1 sym., 633 LOC (pickAutoImprovements…pickAutoImprovements); P3: 5 sym., 43 LOC (PRESERVES_HILL_RELIEF_EXPLICIT_KEYS…preservesHillRelief) |
| 8J | society-breakdown | 1172 | 69 / 36 | P1: 44 sym., 584 LOC (SocietyLine…proporcjonalneSzczescie); P2: 25 sym., 588 LOC (ownShareFromSignal…revoltWarningMessage) |
| **SUMA** | 18 plików | **10150** | **515 / 304** | |

Suma LOC tematów = **10150** (= suma `wc -l`), symbole **515**, fn **304**. Każda pozycja z §1 ma temat; każdy symbol ma temat i partię (§11).

### 3b. Kolejność (fale)

- **Fala 1 (start od razu):** 8A, 8D, 8J (8D: wealth wymaga potwierdzenia Z-5 — już zweryfikowane, §6).
- **Fala 2:** 8B po 8A (wspólny `production_units.rs`); 8B wymaga, by B3 nie miało otwartego `recruitment.rs` (warunek sprawdzany przy starcie, §4).
- **Fala 3:** 8C po 8B (sekwencyjnie, `production_units.rs`); 8F po 8B **i po zamknięciu REPIN-D** (`economy_yield.rs`, `work_tax.rs`, `economy.ts`).
- **Fala 4:** 8E po 8F i 8D (oraz 8A/8B).
- **Fala 5:** 8G po 8F i po zamknięciu REPIN-B3 (hook w `city_growth.rs`).
- **Fala 6:** 8H (`resource-access`, `zloto`) po 8G; część `cyna`/`zelazo`/`society-inputs` może wcześniej pod warunkiem rozłącznych allowlist (kolizja w `state.rs`, `building_costs.rs` — sekwencyjnie z 8A/8D). 8I po 8G i przed P6-17 (`improvements.rs`).
- **Równolegle bez kolizji:** 8A ‖ 8D ‖ 8J (rozłączne allowlisty; 8D i 8J wspólnie dotykają `data/economy_society.rs` — sekwencyjnie).

---

## 4. Kolizje z trwającymi REPIN-EKONOMIA i mapgen (zweryfikowane)

| Kolizja | Ścieżka Rust | Strona A | Strona B | Ustalenie (źródło) |
|---|---|---|---|---|
| B3 | `domain/city_growth.rs` i `domain/recruitment.rs` | REPIN-B3 | 8G (hook rebalansu), 8B (rekrutacja 1977–2210) | **Zweryfikowane:** `R-RUSTPORT-REPIN-EKONOMIA-B3-Q1/00-dispatch.md`, linia `ALLOWLISTA: rust-port/engine/src/domain/{city_growth,recruitment}.rs`. Treść GOAL B3 wymienia tylko `city_growth.rs`, ale allowlista obejmuje też `recruitment.rs`. Stąd warunek startu 8B i 8G (§3b). |
| B2 (zamknięte, `4c005237`) | `domain/building_costs.rs`, `domain/production_units.rs` | część hunków `production.ts` (3, 7, 8–14) | 8A, 8B, 8C | Wg GOAL B3: „B2 ZINTEGROWANE `4c005237`: hunki production.ts 3,7,8–14”. Zgodne z cytowaniami `building_costs.rs:209,1578–1784` i `production_units.rs:23,34`. B2 nie jest powtarzane. |
| C5 (nieotwarte) | `gra/src/game/relief-preserving-improvements.ts` | REPIN-C5 | 8I | **8I absorbuje C5** (C5 zamknąć jako „w 8I”; wymaga wpisu w LEDGER — poza zakresem R2). |
| D (w toku/nieotwarte) | `economy.ts`, `work-tax.ts` (nowy, 77 linii) | REPIN-D: NOWE `domain/{economy_yield,work_tax}.rs` | 8F | Zweryfikowane: `R-RUSTPORT-REPIN-EKONOMIA-D-Q1/00-dispatch.md`, ALLOWLISTA. 8F zależy od nich (§2). `work-tax.ts` nie należy do 18 pozycji. |
| B-residual | `wealth.ts` (+20), `society-breakdown.ts` (+33) | brak właściciela w LEDGER (nie zweryfikowano) | 8D, 8J | Z-5: przypisane do 8D/8J; zmiana `wealth.ts` = 2 funkcje behawioralne (§1, poz. 16). |
| C6 (nieotwarte) | `data/population-growth-v85.ts` | REPIN-C6 (P6.7, poza 18) | `city_growth.rs` | Poza P6.8; sekwencyjnie z B3 i 8G w `city_growth.rs`. |
| mapgen landsea | `domain/mapgen/landsea.rs` | M-series | — | **0 kolizji** (`grep -i landsea` w `rust-port/engine/src`: brak importu z żadnej pozycji P6.8). |
| mapgen tabele | `data/derived.rs` (komentarze `mapgen-landsea-*`, linie 4685–4757) | M-series | — | Poza allowlistami P6.8. Temat dotykający `derived.rs` (np. 8F przez `:4275`, 8E przez `:132,4303`) — sprawdzić M-series przed zmianą. |

Pozostały zakres ekonomii (bez dublowania): B3 (`turn-economy.ts`, 12 z 51 hunków w tym przebiegu), B4+ (reszta 51 hunków `turn-economy.ts`), C5 → 8I, C6 → poza P6.8, D → `economy.ts` + `work-tax.ts`, B2 → zamknięte. `turn-economy.ts` nie należy do 18 pozycji P6.8 (jest w P6.7 / REPIN-B3).

---

## 5. Plan wektorów

- **Generator (rozstrzygnięte):** wzorzec B2. Skrypt `gen-repin-b2-vectors.mjs` i loader `repin-b-loader-register.mjs` w `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-B2-Q1/` (obecne w bazie `4c005237`). Uruchomienie na `git archive 91dc998a gra/src gra/data`, Node v22.22.0, `--experimental-transform-types`, **bez `npm run build/dev`**. Zmierzone: generator zakończył się wypisem liczników (`building=14580 unitMoney=21464 civMarkers=51 newest=88 epoch=10`), zapisał cztery pliki, a te **bajt-w-bajt identyczne** z committed `tests/p6_repin_b2_vectors/*.json` (`cmp`: SAME×4). Rozmiary: 2,1 MB / 3,7 MB / 15 KB / 12 KB (limit 10 MB na plik).
- **Nowe generatory per temat:** `gen-p6-8<x>-vectors.mjs` w katalogu runu tematu, ten sam wzorzec (import TS przez loader, bez builda). Nie wolno przepisywać asercji (`NIE osłabiaj asercji`).
- **Pliki wektorów per temat** (`rust-port/engine/tests/p6_8<x>_vectors/*.json`, NOWE katalogi):
  - 8A: `itemcost.json`, `building_upgrades.json`, `pending.json` (+ przeliczenie `p6_repin_b2_vectors/building_work_cost.json`, jeśli zmiana go dotyka).
  - 8B: `availability.json`, `recruitment.json`, `rush.json`, `praca_split.json` (+ przeliczenie `p6_7b_vectors/cost.json`, `pool.json`, jeśli dotknięte).
  - 8C: `queue.json` (sanitize/enqueue/dequeue/promote/advance).
  - 8D: `citizen_upkeep.json`, `gold_deficit.json`, `mennica.json`, `wealth.json` (w tym modyfikatory `mul_proc`).
  - 8E: `economy_upkeep.json` (+ `p6_7a_vectors/params.json` jeśli zmiana wpływa na parametry).
  - 8F: `economy.json` (fn-po-fn, po REPIN-D; wektory D jako punkt wyjścia).
  - 8G: `okolica.json` (tile scoring, rebalans; brzegi N-1/N/N+1 promienia).
  - 8H: `access.json` (cyna/zelazo/zloto/resource/society-inputs).
  - 8I: `auto_improvements.json` (+ `p6_23_vectors/improvements.json`, jeśli dotknięte), `relief.json`.
  - 8J: `society_breakdown.json` (w tym `applyCivMatrixHappinessModifier`; wektor z `p6_1_vectors/web-vectors.json` jako punkt wyjścia).
- **Limity:** każdy plik ≤ 10 MB; plik > 100 MB blokuje push. Przy przekroczeniu 10 MB partia dzieli wektory na pliki `*_partN.json`.

---

## 6. Założenia (luki rozstrzygnięte zamiast pytań)

- **Z-1 (ZAŁOŻENIE):** Lista 18 pozycji = `P6-0-GAP-ANALYSIS.md` §1a/§3; `PLAN §P6.8` jest ogólne.
- **Z-2 (ZAŁOŻENIE):** Kryterium „≤8 fn / ≤600 LOC na temat” sprzeczne z „10 tematów” (§3). Przyjęte: 10 tematów, partie ≤600 LOC na granicy symbolu. Opcja B (≥18 tematów) opisana, nie przyjęta.
- **Z-3 (ZWERYFIKOWANE częściowo):** Status = pomiar R2 (§1): nazwy funkcji (304) + cytowania. Brak PORTOWANE; BRAK\* = bez dowodu funkcjonalnego.
- **Z-4 (ZWERYFIKOWANE):** Kolizja z B3 obejmuje `city_growth.rs` **i** `recruitment.rs` (allowlista B3). Kolejność 8B/8G oparta na tym.
- **Z-5 (ZWERYFIKOWANE):** `wealth.ts` (+20) = 2 funkcje behawioralne (`wealthParamsWithCapModifier`, `wealthParamsWithMultiplierModifier`), brak odpowiednika w Rust (§1, poz. 16). `society-breakdown.ts` (+33) = 1 nowa funkcja behawioralna (`applyCivMatrixHappinessModifier`), BRAK (§1, poz. 14). Przypisanie 8D/8J bez zmian.
- **Z-6 (ZAŁOŻENIE):** C5 (`relief-preserving-improvements.ts`) absorbowane przez 8I; C5 do zamknięcia w LEDGER (poza zakresem R2).
- **Z-7 (ZAŁOŻENIE):** Pomiar nazw (`namehits.py`) jest górną granicą; fałszywe trafienia nie zmieniają wniosku „PORTOWANE: 0”.
- **Z-8 (ZAŁOŻENIE):** Heurystyka klasyfikacji hunków (komentarz vs nie-komentarz) nie rozróżnia zmian typów/parametrów od zmian logiki; „nie-komentarz” = „do przeglądu przez temat”, nie „behawioralna” w sensie wykonania.
- **Z-9 (ZAŁOŻENIE):** `pickAutoImprovements` (633 LOC, 1 fn) — partia 8I-P2 jest jedną funkcją i przekracza 600 LOC; wykonanie wewnątrz tematu w krokach ≤4 zmian/commit.

---

## 7. NIE_ZMIERZONO (jawna lista)

- Funkcjonalna zgodność którejkolwiek z 18 pozycji z Rust (pomiar obejmuje nazwy i cytowania, nie zachowanie). Uruchomiono tylko generator wektorów B2 (§5).
- Przypisanie każdego z 68 hunków nie-komentarzowych (42 `production.ts`, 25 `economy.ts`, 1 `wealth.ts`) do konkretnej partii B2/B3/D; klasy są heurystyczne (§10), nie przeczytano każdego hunka semantycznie. Do zrobienia przez temat.
- Które hunki `economy.ts` (41) są już w B1/B2/B3/D (poza wskazaniem zakresu REPIN-D w dispatchu).
- Zawartość `P6-REPIN-EKONOMIA-B3.md` i `P6-REPIN-EKONOMIA-D.md` (dossiery nieobecne w docs-branch; dispatche przeczytane).
- Wpisy LEDGER dla B-residual i C5 (nie odczytano LEDGER w tej rundzie).
- Liczba testów baseline: dispatch D podaje 1272/0, a R1/LEDGER podawały 1388/0 — rozbieżność NIE_ZMIERZONO; każdy temat mierzy baseline sam (§9).
- Dokładna wartość `+393/−275` (shortstat) — z R1, odtworzona w §0 komendą.

---

## 8. Komendy kontrolne tego dokumentu

```
git archive 91dc998a5f1b51ad29e0f4785edfd45655445c53 gra/src gra/data   # do katalogu tymczasowego poza repo
wc -l gra/src/game/<18 plików>.ts                                        # suma 10150
git diff --shortstat edb8fb56 91dc998a -- <18 plików>                    # 6 plików, +393/-275
git diff -U0 edb8fb56 91dc998a -- gra/src/game/economy.ts | grep -c '^@@'     # 41
git diff -U0 edb8fb56 91dc998a -- gra/src/game/production.ts | grep -c '^@@'  # 44
git diff -U0 edb8fb56 91dc998a -- gra/src/game/wealth.ts | grep -c '^@@'      # 1
git grep -nE '<basename>\.ts' HEAD -- rust-port/engine/src rust-port/engine/tests   # cytowania §1
git grep -n -i landsea HEAD -- rust-port/engine/src                              # 0 kolizji
node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs ./gen-repin-b2-vectors.mjs <web-root> <out>   # §5
```

Skrypty pomocnicze (`symbols.py`, `build.py`, `hunks.py`, `namehits.py`) leżą poza repo (katalog roboczy Operatora); ich wyniki są wklejone do §3, §10, §11.

---

## 9. Gotowe treści dispatchów (do skopiowania)

Wspólne dla wszystkich 10 tematów:
- **BAZA:** `git fetch origin rust-port/parity-v2 && git checkout --detach FETCH_HEAD` (≥ `4c005237`). Pin webu `91dc998a5f1b51ad29e0f4785edfd45655445c53` (`git archive` do katalogu tymczasowego poza repo). NIE przesuwaj pinu w manifestach.
- **BRAMKI (w `rust-port/engine`):** `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --no-fail-fast`. Baseline = wynik tej samej komendy na bazie PRZED zmianą (mierzony przez temat; NIE stała liczba). Surowe logi z `echo "EXIT=$?"`. `git diff --check` czysty.
- **BUILD:** `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`; po pracy usuń swój podkatalog. Nie commituj `Cargo.lock`/`target`.
- **ZAKAZY:** zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`; zakaz `npm run build/dev` w `gra/`; zakaz `git add -A`; PUSH NIE; `git worktree prune` NIE.
- **PROCEDURA:** (1) tabela zmiana → plik:linia weba → plik:linia Rust → test/wektor → status (PORTOWANE / NIE-DOTYCZY (uzasadnienie) / NASTĘPNA-PARTIA); (2) port partiami ≤4 zmiany, commit po każdej; (3) wektory z generatora uruchomionego na `91dc998a`, 0 rozbieżności, bez osłabiania asercji; (4) mutacje lub dowód równoważności.
- **ZAŁOŻENIA:** Z-2, Z-9 jak w §6.

### 8A — `R-RUSTPORT-P6-8A-PRODUKCJA-KOSZTY-Q1`
- **GOAL:** port pozostałej części `production.ts` 1–681 (epoka, `itemCost`, `buildingProductionItem`, `unitProductionItem`, `buildingLocationAllowed`, dostępność cywilizacji), `building-upgrades.ts`, `pending-improvements.ts`. Hunki B2 (3, 7, 8–14: `epochNumber`, `buildingWorkCost`, `unitMoneyCost`, `civ*Discount`) są już w Rust (`building_costs.rs`, `production_units.rs`): nie powtarzać, tylko weryfikować regresją.
- **ALLOWLISTA:** `rust-port/engine/src/domain/{building_costs,production_units,improvements}.rs`; `rust-port/engine/tests/p6_8a_*.rs` (NOWE); `rust-port/engine/tests/p6_8a_vectors/**` (NOWE); `dyspozycje/rust-port/p6/P6-8A-*.md` (NOWY); `dyspozycje/autobot/runs/R-RUSTPORT-P6-8A-*/**` (run tematu). Run rekonesansu nie jest allowlistą tematu.
- **SYMBOLE:** §11, wiersze z `8A-P1` i `8A-P2`.
- **KRYTERIA KOŃCA:** wszystkie symbole 8A z §11 mają status (PORTOWANE / NIE-DOTYCZY / NASTĘPNA-PARTIA); wektory 0 rozbieżności; bramki zielone; `git diff --check` czysty.
- **ZALEŻNOŚCI:** brak (start łańcucha).
- **WEKTORY:** §5 (8A).

### 8B — `R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1`
- **GOAL:** `production.ts` 682–1252 i 1977–2541: `unitStockShortfallLabel`, `availableProduction`, `availableReplacementsFor`, rekrutacja (`enqueueRecruitment`, `advanceRecruitmentGated`, `advanceRecruitment`), `rushCost`/`rushProduction`, praca/podział (`splitPraca`, `previewPracaPoolBrutto`), `eraBuildingCatalog`, `splitOutput`, `cityScienceOutput`, `cityMoneyOutput`.
- **ALLOWLISTA:** `rust-port/engine/src/domain/{production_units,recruitment,resource_production}.rs` (`recruitment.rs` dopiero po zamknięciu B3 — §4); `rust-port/engine/tests/p6_8b_*.rs` (NOWE); `rust-port/engine/tests/p6_8b_vectors/**` (NOWE).
- **SYMBOLE:** §11, wiersze z `8B-P1` i `8B-P2`.
- **KRYTERIA KOŃCA:** jak 8A; dodatkowo: wynik `recruitment` zgodny z wektorami po zamknięciu B3.
- **ZALEŻNOŚCI:** 8A (wspólny `production_units.rs`); B3 zamknięte dla `recruitment.rs`.
- **WEKTORY:** §5 (8B).

### 8C — `R-RUSTPORT-P6-8C-PRODUKCJA-KOLEJKA-Q1`
- **GOAL:** `production.ts` 1253–1976: `frontItem`, `etaTurns`, `buildingWorkPerTurn`, `unitRecruitmentCapacityPerTurn`, `enqueue`, `forfeitedProgressForIndex`, `bank*`, `sanitizeBuildQueue`, `dropFrontItem`, `dequeue`, `filterQueue`, `promoteToFront`, `insertAtFront`, `advanceProduction`.
- **ALLOWLISTA:** `rust-port/engine/src/domain/production_queue.rs` (NOWY), `rust-port/engine/src/domain/production_units.rs` (sekwencyjnie po 8B), `rust-port/engine/tests/p6_8c_*.rs` (NOWE), `rust-port/engine/tests/p6_8c_vectors/**` (NOWE).
- **SYMBOLE:** §11, `8C-P1`, `8C-P2`.
- **KRYTERIA KOŃCA:** jak 8A.
- **ZALEŻNOŚCI:** 8B (sekwencyjnie).
- **WEKTORY:** §5 (8C).

### 8D — `R-RUSTPORT-P6-8D-UTRZYMANIE-OBYWATELI-Q1`
- **GOAL:** `citizen-resource-upkeep.ts`, `gold-deficit.ts`, `mennica-zloto-grace.ts`, `wealth.ts` (w tym `wealthParamsWithCapModifier`, `wealthParamsWithMultiplierModifier` — BRAK w Rust, §1 poz. 16).
- **ALLOWLISTA:** `rust-port/engine/src/domain/{resource_production,turn_economy}.rs`; `rust-port/engine/src/domain/state.rs` (tylko fragmenty wealth: `:1661`, `:1759`); `rust-port/engine/src/data/economy_society.rs` (sekwencyjnie z 8J); `rust-port/engine/tests/p6_8d_*.rs` (NOWE); `rust-port/engine/tests/p6_8d_vectors/**` (NOWE).
- **SYMBOLE:** §11, `8D-P1`, `8D-P2`.
- **KRYTERIA KOŃCA:** jak 8A; modyfikatory `mul_proc` wg wektorów z weba (`cap` i `mnoznik`).
- **ZALEŻNOŚCI:** brak (Z-5 zweryfikowane).
- **WEKTORY:** §5 (8D).

### 8E — `R-RUSTPORT-P6-8E-UTRZYMANIE-EKONOMII-Q1`
- **GOAL:** `economy-upkeep.ts` (1174 LOC, 42 fn), partie `8E-P1` (34 sym.) i `8E-P2` (37 sym.).
- **ALLOWLISTA:** `rust-port/engine/src/domain/turn_economy.rs`; `rust-port/engine/src/domain/city_growth.rs` (tylko `:844`, po zamknięciu B3); `rust-port/engine/tests/p6_8e_*.rs` (NOWE); `rust-port/engine/tests/p6_8e_vectors/**` (NOWE).
- **SYMBOLE:** §11, `8E-P1`, `8E-P2`.
- **KRYTERIA KOŃCA:** jak 8A.
- **ZALEŻNOŚCI:** 8F, 8D, 8A/8B.
- **WEKTORY:** §5 (8E).

### 8F — `R-RUSTPORT-P6-8F-EKONOMIA-MIASTA-Q1`
- **GOAL:** `economy.ts` (1243 LOC, 23 fn) fn-po-fn, partie `8F-P1..P3`, po zamknięciu REPIN-D.
- **ALLOWLISTA:** `rust-port/engine/src/domain/{turn_economy,improvements}.rs`; `rust-port/engine/src/domain/city_growth.rs` (tylko po zamknięciu B3); `rust-port/engine/tests/p6_8f_*.rs` (NOWE); `rust-port/engine/tests/p6_8f_vectors/**` (NOWE). **Tylko do odczytu:** `domain/economy_yield.rs`, `domain/work_tax.rs` (NOWE z D) — NIE duplikować.
- **SYMBOLE:** §11, `8F-P1..P3`.
- **KRYTERIA KOŃCA:** jak 8A; 41 hunków (§10) każdy z wpisem w tabeli zmian.
- **ZALEŻNOŚCI:** 8B, REPIN-D zamknięte.
- **WEKTORY:** §5 (8F).

### 8G — `R-RUSTPORT-P6-8G-OKOLICA-Q1`
- **GOAL:** `okolica.ts` (815 LOC, 31 fn): `okolicaTiles`, `tileScore`, `assignWorkedTiles`, `resolveWorkedTiles`, `rebalanceWorkersAfterPopulationChange` (istnieje częściowo w `city_growth.rs:1450`), `toggleTileWorker`, `computeLostToNearerSiblingByCity`. Istniejące helpery (`city_range_for_population`, `city_sight_radius`, `hex_keys_within_radius`) — deduplikacja tylko przy identycznym zachowaniu.
- **ALLOWLISTA:** `rust-port/engine/src/domain/okolica.rs` (NOWY); `rust-port/engine/src/domain/{improvement_build,terrain,territory,start_position}.rs` (tylko odczyt/deduplikacja helperów); `rust-port/engine/src/domain/city_growth.rs` (hook rebalansu — po zamknięciu B3); `rust-port/engine/tests/p6_8g_*.rs` (NOWE); `rust-port/engine/tests/p6_8g_vectors/**` (NOWE).
- **SYMBOLE:** §11, `8G-P1`, `8G-P2`.
- **KRYTERIA KOŃCA:** jak 8A; `hex_keys_within_radius` (3 kopie: `terrain.rs:391`, `start_position.rs:589`, `improvement_build.rs:816`) — albo 0 rozbieżności, albo jawna NASTĘPNA-PARTIA.
- **ZALEŻNOŚCI:** 8F; B3 zamknięte dla `city_growth.rs`.
- **WEKTORY:** §5 (8G) — brzegi promienia N-1/N/N+1.

### 8H — `R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1`
- **GOAL:** `resource-access.ts` (362 LOC), `zloto-access.ts`, `cyna-access.ts`, `zelazo-access.ts`, `society-inputs.ts`; nowy moduł `domain/resource_access.rs`.
- **ALLOWLISTA:** `rust-port/engine/src/domain/resource_access.rs` (NOWY); `rust-port/engine/src/domain/resource_production.rs`; `rust-port/engine/src/domain/building_costs.rs` (zloto `:910–930`, po 8A); `rust-port/engine/src/domain/state.rs` (society-inputs `:544–581`, po 8D); `rust-port/engine/src/data/economy_society.rs` (sekwencyjnie); `rust-port/engine/tests/p6_8h_*.rs` (NOWE); `rust-port/engine/tests/p6_8h_vectors/**` (NOWE).
- **SYMBOLE:** §11, `8H-P1`, `8H-P2`.
- **KRYTERIA KOŃCA:** jak 8A.
- **ZALEŻNOŚCI:** 8G (`resource-access` importuje `okolica`); `cyna`/`zelazo`/`society-inputs` mogą startować wcześniej przy rozłącznych allowlistach.
- **WEKTORY:** §5 (8H).

### 8I — `R-RUSTPORT-P6-8I-AUTO-ULEPSZENIA-Q1`
- **GOAL:** `auto-improvements.ts` (1051 LOC, 4 fn; w tym reorder `AI_IMPROVEMENT_PRIORITY`) i `relief-preserving-improvements.ts` (zbiór `tartak`; zamyka C5).
- **ALLOWLISTA:** `rust-port/engine/src/domain/auto_improvements.rs` (NOWY); `rust-port/engine/src/domain/improvements.rs` (rejestracja/wspólne); `rust-port/engine/tests/p6_8i_*.rs` (NOWE); `rust-port/engine/tests/p6_8i_vectors/**` (NOWE).
- **SYMBOLE:** §11, `8I-P1`, `8I-P2` (jedna funkcja 633 LOC — Z-9), `8I-P3`.
- **KRYTERIA KOŃCA:** jak 8A; C5 zamknięte w LEDGER.
- **ZALEŻNOŚCI:** 8G; przed P6-17.
- **WEKTORY:** §5 (8I).

### 8J — `R-RUSTPORT-P6-8J-SPOLECZENSTWO-Q1`
- **GOAL:** `society-breakdown.ts` (1172 LOC, 36 fn; w tym nowy `applyCivMatrixHappinessModifier`, rebel owner `-99`).
- **ALLOWLISTA:** `rust-port/engine/src/domain/society_breakdown.rs` (NOWY); `rust-port/engine/src/domain/ids.rs`; `rust-port/engine/src/data/economy_society.rs` (sekwencyjnie z 8D/8H); `rust-port/engine/tests/p6_8j_*.rs` (NOWE); `rust-port/engine/tests/p6_8j_vectors/**` (NOWE).
- **SYMBOLE:** §11, `8J-P1`, `8J-P2`.
- **KRYTERIA KOŃCA:** jak 8A; wektor `p6_1_vectors/web-vectors.json` jako punkt wyjścia.
- **ZALEŻNOŚCI:** brak (fala 1).
- **WEKTORY:** §5 (8J).

---

## 10. Hunki zmian (wygenerowane: `git diff -U0 edb8fb56 91dc998a`)

Klasa heurystyczna: „komentarz” = wszystkie zmienione niepuste linie zaczynają się od `//`, `/*`, `*`; „nie-komentarz (heur.)” = do przeglądu przez temat (Z-8). Symbol = ostatni symbol top-level zaczynający się na lub przed pierwszą nową linią hunka (91dc998a).


**`production.ts` — 44 hunków**

| # | nowe linie (91dc998a) | symbol (start) | temat / partia | klasa (heur.) |
|---|---|---|---|---|
| 1 | 65–65 | (nagłówek pliku: importy/typy przed pierwszym symbolem) | 8A-P1 | nie-komentarz (heur.) |
| 2 | 129–130 | `ProductionItem` (123) | 8A-P1 | nie-komentarz (heur.) |
| 3 | 207–226 | `epochNumber` (201) | 8A-P1 | nie-komentarz (heur.) |
| 4 | 420–420 | `unitProductionItem` (400) | 8A-P2 | nie-komentarz (heur.) |
| 5 | 448–449 | `AvailabilityContext` (440) | 8A-P2 | nie-komentarz (heur.) |
| 6 | 488–503 | `AvailabilityContext` (440) | 8A-P2 | nie-komentarz (heur.) |
| 7 | 562–563 | `buildingWorkCost` (555) | 8A-P2 | nie-komentarz (heur.) |
| 8 | 583–583 | `unitMoneyCost` (577) | 8A-P2 | nie-komentarz (heur.) |
| 9 | 587–588 | `unitMoneyCost` (577) | 8A-P2 | nie-komentarz (heur.) |
| 10 | 608–625 | `CivBonusLite` (597) | 8A-P2 | nie-komentarz (heur.) |
| 11 | 628–628 | `civRecruitmentDiscount` (626) | 8A-P2 | nie-komentarz (heur.) |
| 12 | 630–631 | `civRecruitmentDiscount` (626) | 8A-P2 | nie-komentarz (heur.) |
| 13 | 633–637 | `civRecruitmentDiscount` (626) | 8A-P2 | nie-komentarz (heur.) |
| 14 | 640–656 | `civRecruitmentDiscount` (626) | 8A-P2 | nie-komentarz (heur.) |
| 15 | 671–692 | `UNIT_STOCK_GATE_LABEL` (671) | 8A-P2 | nie-komentarz (heur.) |
| 16 | 735–761 | `unitAllowedForCivNation` (727) | 8B-P1 | nie-komentarz (heur.) |
| 17 | 936–936 | `availableProduction` (923) | 8B-P1 | nie-komentarz (heur.) |
| 18 | 983–985 | `availableProduction` (923) | 8B-P1 | nie-komentarz (heur.) |
| 19 | 1027–1027 | `availableProduction` (923) | 8B-P1 | nie-komentarz (heur.) |
| 20 | 1031–1035 | `availableProduction` (923) | 8B-P1 | nie-komentarz (heur.) |
| 21 | 1044–1045 | `availableProduction` (923) | 8B-P1 | komentarz |
| 22 | 1049–1049 | `availableProduction` (923) | 8B-P1 | nie-komentarz (heur.) |
| 23 | 1063–1077 | `availableProduction` (923) | 8B-P1 | nie-komentarz (heur.) |
| 24 | 1089–1089 | `availableProduction` (923) | 8B-P1 | nie-komentarz (heur.) |
| 25 | 1150–1150 | `availableReplacementsFor` (1136) | 8B-P1 | nie-komentarz (heur.) |
| 26 | 1160–1160 | `availableReplacementsFor` (1136) | 8B-P1 | nie-komentarz (heur.) |
| 27 | 1164–1164 | `availableReplacementsFor` (1136) | 8B-P1 | komentarz |
| 28 | 1166–1166 | `availableReplacementsFor` (1136) | 8B-P1 | nie-komentarz (heur.) |
| 29 | 1176–1183 | `availableReplacementsFor` (1136) | 8B-P1 | nie-komentarz (heur.) |
| 30 | 1197–1197 | `availableReplacementsFor` (1136) | 8B-P1 | nie-komentarz (heur.) |
| 31 | 1215–1215 | `availableReplacementsFor` (1136) | 8B-P1 | nie-komentarz (heur.) |
| 32 | 1273–1288 | `etaTurns` (1268) | 8C-P1 | nie-komentarz (heur.) |
| 33 | 1902–1902 | `advanceProduction` (1899) | 8C-P2 | nie-komentarz (heur.) |
| 34 | 1911–1911 | `advanceProduction` (1899) | 8C-P2 | nie-komentarz (heur.) |
| 35 | 1923–1923 | `advanceProduction` (1899) | 8C-P2 | nie-komentarz (heur.) |
| 36 | 1926–1928 | `advanceProduction` (1899) | 8C-P2 | nie-komentarz (heur.) |
| 37 | 1985–1986 | `manpowerCostOf` (1985) | 8B-P1 | nie-komentarz (heur.) |
| 38 | 2056–2057 | `advanceRecruitmentGated` (2049) | 8B-P2 | nie-komentarz (heur.) |
| 39 | 2060–2060 | `advanceRecruitmentGated` (2049) | 8B-P2 | nie-komentarz (heur.) |
| 40 | 2075–2075 | `advanceRecruitmentGated` (2049) | 8B-P2 | nie-komentarz (heur.) |
| 41 | 2077–2077 | `advanceRecruitmentGated` (2049) | 8B-P2 | nie-komentarz (heur.) |
| 42 | 2137–2137 | `rushCost` (2137) | 8B-P2 | nie-komentarz (heur.) |
| 43 | 2140–2142 | `rushCost` (2137) | 8B-P2 | nie-komentarz (heur.) |
| 44 | 2302–2302 | `unitPurchaseCost` (2289) | 8B-P2 | nie-komentarz (heur.) |

**`economy.ts` — 41 hunków**

| # | nowe linie (91dc998a) | symbol (start) | temat / partia | klasa (heur.) |
|---|---|---|---|---|
| 1 | 45–45 | (nagłówek pliku: importy/typy przed pierwszym symbolem) | 8F-P1 | nie-komentarz (heur.) |
| 2 | 149–152 | `EconParams` (105) | 8F-P1 | komentarz |
| 3 | 162 (usunięcie) | `EconParams` (105) | 8F-P1 | nie-komentarz (heur.) |
| 4 | 237 (usunięcie) | `loadEconParams` (198) | 8F-P1 | nie-komentarz (heur.) |
| 5 | 326–326 | `CityYieldResult` (313) | 8F-P1 | nie-komentarz (heur.) |
| 6 | 332–333 | `CityYieldResult` (313) | 8F-P1 | komentarz |
| 7 | 335–335 | `CityYieldResult` (313) | 8F-P1 | komentarz |
| 8 | 644–646 | `CityYieldContext` (611) | 8F-P2 | komentarz |
| 9 | 650–653 | `CityYieldContext` (611) | 8F-P2 | komentarz |
| 10 | 656 (usunięcie) | `CityYieldContext` (611) | 8F-P2 | nie-komentarz (heur.) |
| 11 | 674–675 | `CityYieldContext` (611) | 8F-P2 | nie-komentarz (heur.) |
| 12 | 703–703 | `CivMnoznikRow` (696) | 8F-P2 | komentarz |
| 13 | 706–707 | `mnoznikHandelPieniadzForCiv` (704) | 8F-P2 | nie-komentarz (heur.) |
| 14 | 709–710 | `mnoznikHandelPieniadzForCiv` (704) | 8F-P2 | nie-komentarz (heur.) |
| 15 | 714–715 | `mnoznikHandelPieniadzForCiv` (704) | 8F-P2 | komentarz |
| 16 | 727–727 | `civMatrixMnoznikHandelPieniadzRaw` (717) | 8F-P2 | nie-komentarz (heur.) |
| 17 | 745–747 | `MNOZNIK_HANDEL_TRUDNOSC_DELTA` (738) | 8F-P2 | komentarz |
| 18 | 749–751 | `MNOZNIK_HANDEL_TRUDNOSC_DELTA` (738) | 8F-P2 | komentarz |
| 19 | 755–755 | `mnoznikHandelPieniadzForCivByDifficulty` (753) | 8F-P2 | nie-komentarz (heur.) |
| 20 | 759–759 | `mnoznikHandelPieniadzForCivByDifficulty` (753) | 8F-P2 | nie-komentarz (heur.) |
| 21 | 781–781 | `civBonusyForCivKey` (765) | 8F-P2 | komentarz |
| 22 | 783–783 | `civEconomyYieldMultipliers` (782) | 8F-P2 | nie-komentarz (heur.) |
| 23 | 785–785 | `civEconomyYieldMultipliers` (782) | 8F-P2 | nie-komentarz (heur.) |
| 24 | 794–795 | `civEconomyYieldMultipliers` (782) | 8F-P2 | komentarz |
| 25 | 797–798 | `civEconomyYieldMultipliers` (782) | 8F-P2 | komentarz |
| 26 | 800–800 | `civEconomyYieldMultipliers` (782) | 8F-P2 | komentarz |
| 27 | 803–803 | `civEconomyYieldMultipliers` (782) | 8F-P2 | komentarz |
| 28 | 862–864 | `cityYieldPerTurn` (819) | 8F-P2 | komentarz |
| 29 | 871–871 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 30 | 875–877 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 31 | 884–891 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 32 | 898–907 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 33 | 908 (usunięcie) | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 34 | 910–919 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 35 | 931–943 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 36 | 945–945 | `cityYieldPerTurn` (819) | 8F-P2 | komentarz |
| 37 | 947–947 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 38 | 963–966 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 39 | 977–988 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 40 | 1003–1006 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |
| 41 | 1017–1019 | `cityYieldPerTurn` (819) | 8F-P2 | nie-komentarz (heur.) |

**`wealth.ts` — 1 hunków**

| # | nowe linie (91dc998a) | symbol (start) | temat / partia | klasa (heur.) |
|---|---|---|---|---|
| 1 | 58–77 | `WealthParams` (33) | 8D-P2 | nie-komentarz (heur.) |

- production.ts: 44 hunków; klasy: {'nie-komentarz (heur.)': 42, 'komentarz': 2}
- economy.ts: 41 hunków; klasy: {'nie-komentarz (heur.)': 25, 'komentarz': 16}
- wealth.ts: 1 hunków; klasy: {'nie-komentarz (heur.)': 1}

---

## 11. Lista symboli (wygenerowana: 515 symboli top-level, 18 plików, @91dc998a)

Każdy symbol ma plik:linia, rodzaj (fn / const / type / class), LOC (od początku do przed następnym symbolem, z pustymi liniami), temat i partię. Suma LOC per plik = `wc -l`.

| plik:linia (91dc998a) | symbol | rodzaj | LOC | temat / partia |
|---|---|---|---|---|
| `auto-improvements.ts:26` | `AutoImprovementCity` | type | 35 | 8I-P1 |
| `auto-improvements.ts:36` | `AutoImprovementPick` | type | 20 | 8I-P1 |
| `auto-improvements.ts:56` | `AI_IMPROVEMENT_PRIORITY` | const | 17 | 8I-P1 |
| `auto-improvements.ts:73` | `ULEPSZENIA_FOCUS_ZYWNOSC` | const | 38 | 8I-P1 |
| `auto-improvements.ts:111` | `ULEPSZENIA_ZYWNOSCIOWE` | const | 3 | 8I-P1 |
| `auto-improvements.ts:114` | `ULEPSZENIA_FOCUS_SUROWCE` | const | 5 | 8I-P1 |
| `auto-improvements.ts:119` | `ULEPSZENIA_FOCUS_INFRASTRUKTURA` | const | 4 | 8I-P1 |
| `auto-improvements.ts:123` | `ULEPSZENIA_FOCUS_ZROWNOWAZONE` | const | 25 | 8I-P1 |
| `auto-improvements.ts:148` | `ZERO_YIELD_IMPROVEMENTS` | const | 18 | 8I-P1 |
| `auto-improvements.ts:166` | `JEDEN_NA_ILU_OBYWATELI` | const | 3 | 8I-P1 |
| `auto-improvements.ts:169` | `WYRAB_MIN_FOREST_IN_RADIUS` | const | 3 | 8I-P1 |
| `auto-improvements.ts:172` | `AUTO_ULEPSZENIA_PRACA_RESERVE` | const | 19 | 8I-P1 |
| `auto-improvements.ts:191` | `hasNonFoodResourceDeficit` | fn | 12 | 8I-P1 |
| `auto-improvements.ts:203` | `AutoImprovementSurplusReport` | type | 12 | 8I-P1 |
| `auto-improvements.ts:215` | `freshSurplusReport` | fn | 5 | 8I-P1 |
| `auto-improvements.ts:220` | `prioritiesForUlepszeniaFocus` | fn | 26 | 8I-P1 |
| `auto-improvements.ts:246` | `PickAutoImprovementsOpts` | type | 173 | 8I-P1 |
| `auto-improvements.ts:419` | `pickAutoImprovements` | fn | 633 | 8I-P2 |
| `building-upgrades.ts:8` | `STRUCTURAL_DEFENSE_PARAM_KEY` | const | 14 | 8A-P1 |
| `building-upgrades.ts:15` | `BuildingUpgradeLite` | type | 15 | 8A-P1 |
| `building-upgrades.ts:30` | `isBuildingSuppressedFromProduction` | fn | 8 | 8A-P1 |
| `building-upgrades.ts:38` | `upgradeChainSteps` | fn | 16 | 8A-P1 |
| `building-upgrades.ts:54` | `upgradeProductionDisplayName` | fn | 10 | 8A-P1 |
| `building-upgrades.ts:64` | `STAT_KEYS` | const | 4 | 8A-P1 |
| `building-upgrades.ts:68` | `statLine` | fn | 9 | 8A-P1 |
| `building-upgrades.ts:77` | `upgradeCompositionLines` | fn | 21 | 8A-P1 |
| `building-upgrades.ts:98` | `buildingStatSummaryLines` | fn | 31 | 8A-P1 |
| `building-upgrades.ts:129` | `cityHasBibliotekaLine` | fn | 5 | 8A-P1 |
| `building-upgrades.ts:134` | `cityHasAmfiteatrLine` | fn | 5 | 8A-P1 |
| `building-upgrades.ts:139` | `cityHasMurLine` | fn | 5 | 8A-P1 |
| `building-upgrades.ts:144` | `buildingStructuralDefenseBonusPercent` | fn | 9 | 8A-P1 |
| `building-upgrades.ts:153` | `buildingStructuralDefenseBonusLine` | fn | 19 | 8A-P1 |
| `building-upgrades.ts:172` | `cityHasPalacLine` | fn | 13 | 8A-P1 |
| `building-upgrades.ts:185` | `cityPalacTier` | fn | 17 | 8A-P1 |
| `building-upgrades.ts:202` | `BUILDING_GROUP_ORDER` | const | 11 | 8A-P1 |
| `building-upgrades.ts:213` | `BuildingGroupName` | type | 3 | 8A-P1 |
| `building-upgrades.ts:216` | `BUILDING_GROUP_FALLBACK` | const | 2 | 8A-P1 |
| `building-upgrades.ts:218` | `BuildingGroupLite` | type | 2 | 8A-P1 |
| `building-upgrades.ts:220` | `BuildingGroupBucket` | type | 14 | 8A-P1 |
| `building-upgrades.ts:234` | `groupBuiltBuildingIds` | fn | 15 | 8A-P1 |
| `citizen-resource-upkeep.ts:104` | `CitizenUpkeepEraRow` | type | 109 | 8D-P1 |
| `citizen-resource-upkeep.ts:110` | `CitizenUpkeepKaraShape` | type | 6 | 8D-P1 |
| `citizen-resource-upkeep.ts:116` | `CitizenUpkeepTableShape` | type | 5 | 8D-P1 |
| `citizen-resource-upkeep.ts:121` | `TABLE` | const | 1 | 8D-P1 |
| `citizen-resource-upkeep.ts:122` | `ROWS` | const | 3 | 8D-P1 |
| `citizen-resource-upkeep.ts:125` | `CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE` | const | 1 | 8D-P1 |
| `citizen-resource-upkeep.ts:126` | `CITIZEN_UPKEEP_HAPPINESS_PER_MISSING` | const | 1 | 8D-P1 |
| `citizen-resource-upkeep.ts:127` | `CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING` | const | 22 | 8D-P1 |
| `citizen-resource-upkeep.ts:149` | `CITIZEN_UPKEEP_RATE_PER_CITIZEN` | const | 7 | 8D-P1 |
| `citizen-resource-upkeep.ts:156` | `citizenRequiredResourcesForEra` | fn | 10 | 8D-P1 |
| `citizen-resource-upkeep.ts:166` | `CitizenUpkeepCoverage` | type | 26 | 8D-P1 |
| `citizen-resource-upkeep.ts:192` | `resolveCitizenResourceCoverage` | fn | 24 | 8D-P1 |
| `citizen-resource-upkeep.ts:216` | `CitizenResourceDrainResult` | type | 32 | 8D-P1 |
| `citizen-resource-upkeep.ts:248` | `computeCitizenResourceDrain` | fn | 36 | 8D-P1 |
| `citizen-resource-upkeep.ts:284` | `CitizenUpkeepDisplayLine` | type | 57 | 8D-P1 |
| `citizen-resource-upkeep.ts:341` | `citizenUpkeepDisplayLines` | fn | 13 | 8D-P1 |
| `cyna-access.ts:23` | `KOPALNIA_CYNY_KEY` | const | 25 | 8H-P1 |
| `cyna-access.ts:26` | `ZLOZE_CYNY_KEY` | const | 2 | 8H-P1 |
| `cyna-access.ts:28` | `improvementKeysOnPlaced` | fn | 11 | 8H-P1 |
| `cyna-access.ts:39` | `ZlozeHexMapLike` | type | 4 | 8H-P1 |
| `cyna-access.ts:43` | `isKopalniaCynyKey` | fn | 7 | 8H-P1 |
| `cyna-access.ts:50` | `empireHasKopalniaNaZlozuCyny` | fn | 20 | 8H-P1 |
| `cyna-access.ts:70` | `cityHasOdlewniaForCyna` | fn | 9 | 8H-P1 |
| `cyna-access.ts:79` | `hasCynaAccess` | fn | 11 | 8H-P1 |
| `economy-upkeep.ts:65` | `Difficulty` | type | 67 | 8E-P1 |
| `economy-upkeep.ts:68` | `RawEconRow` | type | 3 | 8E-P1 |
| `economy-upkeep.ts:71` | `RawEconParamsForUpkeep` | type | 6 | 8E-P1 |
| `economy-upkeep.ts:77` | `readNum` | fn | 24 | 8E-P1 |
| `economy-upkeep.ts:101` | `StorageParams` | type | 7 | 8E-P1 |
| `economy-upkeep.ts:108` | `DEFAULT_STORAGE_PARAMS` | const | 10 | 8E-P1 |
| `economy-upkeep.ts:118` | `loadStorageParams` | fn | 17 | 8E-P1 |
| `economy-upkeep.ts:135` | `foodStorageCapacity` | fn | 8 | 8E-P1 |
| `economy-upkeep.ts:143` | `readCityFoodBuffer` | fn | 16 | 8E-P1 |
| `economy-upkeep.ts:159` | `resourceStorageCapacityPerType` | fn | 5 | 8E-P1 |
| `economy-upkeep.ts:164` | `ClampResult` | type | 11 | 8E-P1 |
| `economy-upkeep.ts:175` | `clampStore` | fn | 19 | 8E-P1 |
| `economy-upkeep.ts:194` | `CityStores` | type | 6 | 8E-P1 |
| `economy-upkeep.ts:200` | `emptyCityStores` | fn | 12 | 8E-P1 |
| `economy-upkeep.ts:212` | `applyFood` | fn | 10 | 8E-P1 |
| `economy-upkeep.ts:222` | `ResourceOverflow` | type | 9 | 8E-P1 |
| `economy-upkeep.ts:231` | `applyResourceIntake` | fn | 30 | 8E-P1 |
| `economy-upkeep.ts:261` | `globalResourceCapacityPerType` | fn | 16 | 8E-P1 |
| `economy-upkeep.ts:277` | `onCityLost` | fn | 15 | 8E-P1 |
| `economy-upkeep.ts:292` | `onCityConquered` | fn | 53 | 8E-P1 |
| `economy-upkeep.ts:345` | `OwnerStorageParams` | type | 29 | 8E-P1 |
| `economy-upkeep.ts:374` | `DEFAULT_OWNER_STORAGE_PARAMS` | const | 18 | 8E-P1 |
| `economy-upkeep.ts:392` | `magazynEraMultiplier` | fn | 13 | 8E-P1 |
| `economy-upkeep.ts:405` | `OWNER_CAPPED_RESOURCE_KEYS` | const | 6 | 8E-P1 |
| `economy-upkeep.ts:411` | `OwnerCappedResourceKey` | type | 2 | 8E-P1 |
| `economy-upkeep.ts:413` | `OWNER_CAPPED_RESOURCE_KEY_SET` | const | 3 | 8E-P1 |
| `economy-upkeep.ts:416` | `isOwnerCappedResourceKey` | fn | 8 | 8E-P1 |
| `economy-upkeep.ts:424` | `loadOwnerStorageParams` | fn | 24 | 8E-P1 |
| `economy-upkeep.ts:448` | `ownerResourceCapacityPerType` | fn | 16 | 8E-P1 |
| `economy-upkeep.ts:464` | `ownerStorageParamsForEra` | fn | 12 | 8E-P1 |
| `economy-upkeep.ts:476` | `CityResourceHolder` | type | 24 | 8E-P1 |
| `economy-upkeep.ts:500` | `reconcileOwnerResourceCaps` | fn | 74 | 8E-P1 |
| `economy-upkeep.ts:574` | `UpkeepParams` | type | 10 | 8E-P1 |
| `economy-upkeep.ts:584` | `DEFAULT_UPKEEP_PARAMS` | const | 14 | 8E-P1 |
| `economy-upkeep.ts:598` | `loadUpkeepParams` | fn | 18 | 8E-P2 |
| `economy-upkeep.ts:616` | `BuildingInstanceLike` | type | 21 | 8E-P2 |
| `economy-upkeep.ts:637` | `buildingUpkeep` | fn | 22 | 8E-P2 |
| `economy-upkeep.ts:659` | `totalBuildingUpkeep` | fn | 20 | 8E-P2 |
| `economy-upkeep.ts:679` | `BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE` | const | 7 | 8E-P2 |
| `economy-upkeep.ts:686` | `buildingResourceUpkeep` | fn | 15 | 8E-P2 |
| `economy-upkeep.ts:701` | `addResourceCosts` | fn | 12 | 8E-P2 |
| `economy-upkeep.ts:713` | `totalBuildingResourceUpkeep` | fn | 13 | 8E-P2 |
| `economy-upkeep.ts:726` | `buildingResourceUpkeepForBuiltIds` | fn | 14 | 8E-P2 |
| `economy-upkeep.ts:740` | `previewOwnerBuildingResourceUpkeep` | fn | 22 | 8E-P2 |
| `economy-upkeep.ts:762` | `stripDiacriticsLower` | fn | 5 | 8E-P2 |
| `economy-upkeep.ts:767` | `UnitResourceUpkeepSource` | type | 7 | 8E-P2 |
| `economy-upkeep.ts:774` | `UnitResourceUpkeepLike` | type | 10 | 8E-P2 |
| `economy-upkeep.ts:784` | `unitResourceUpkeep` | fn | 33 | 8E-P2 |
| `economy-upkeep.ts:817` | `UNIT_RECRUIT_UPKEEP_RESERVE_TURNS` | const | 6 | 8E-P2 |
| `economy-upkeep.ts:823` | `UNIT_RECRUIT_STOCK_ONLY_HINT` | const | 8 | 8E-P2 |
| `economy-upkeep.ts:831` | `unitRecruitUpkeepReserve` | fn | 21 | 8E-P2 |
| `economy-upkeep.ts:852` | `canAffordUnitRecruitStock` | fn | 14 | 8E-P2 |
| `economy-upkeep.ts:866` | `canAffordUnitRecruitFull` | const | 7 | 8E-P2 |
| `economy-upkeep.ts:873` | `isUnitRecruitStockChipMissing` | fn | 14 | 8E-P2 |
| `economy-upkeep.ts:887` | `pickUnitRecruitHint` | fn | 8 | 8E-P2 |
| `economy-upkeep.ts:895` | `totalUnitResourceUpkeep` | fn | 12 | 8E-P2 |
| `economy-upkeep.ts:907` | `previewOwnerTotalResourceUpkeep` | fn | 20 | 8E-P2 |
| `economy-upkeep.ts:927` | `DEFAULT_UNIT_UPKEEP_BY_CATEGORY` | const | 21 | 8E-P2 |
| `economy-upkeep.ts:948` | `UnitUpkeepTable` | type | 3 | 8E-P2 |
| `economy-upkeep.ts:951` | `UnitUpkeepLike` | type | 11 | 8E-P2 |
| `economy-upkeep.ts:962` | `unitUpkeep` | fn | 18 | 8E-P2 |
| `economy-upkeep.ts:980` | `totalUnitUpkeep` | fn | 18 | 8E-P2 |
| `economy-upkeep.ts:998` | `buildUnitUpkeepTable` | fn | 32 | 8E-P2 |
| `economy-upkeep.ts:1030` | `UnitFoodTable` | type | 3 | 8E-P2 |
| `economy-upkeep.ts:1033` | `UnitFoodLike` | type | 19 | 8E-P2 |
| `economy-upkeep.ts:1052` | `unitFoodPerTurn` | fn | 25 | 8E-P2 |
| `economy-upkeep.ts:1077` | `buildUnitFoodTable` | fn | 23 | 8E-P2 |
| `economy-upkeep.ts:1100` | `militaryFoodConsumption` | fn | 17 | 8E-P2 |
| `economy-upkeep.ts:1117` | `UpkeepBalance` | type | 20 | 8E-P2 |
| `economy-upkeep.ts:1137` | `upkeepBalance` | fn | 24 | 8E-P2 |
| `economy-upkeep.ts:1161` | `buildingUpkeepForBuiltIds` | fn | 14 | 8E-P2 |
| `economy.ts:52` | `BuildingYieldKey` | type | 61 | 8F-P1 |
| `economy.ts:62` | `BuildingYields` | type | 12 | 8F-P1 |
| `economy.ts:74` | `BuildingRecord` | type | 31 | 8F-P1 |
| `economy.ts:105` | `EconParams` | type | 65 | 8F-P1 |
| `economy.ts:170` | `Difficulty` | type | 7 | 8F-P1 |
| `economy.ts:177` | `RawEconParam` | type | 2 | 8F-P1 |
| `economy.ts:179` | `RawEconParamsJson` | type | 7 | 8F-P1 |
| `economy.ts:186` | `KEY_PROG_WZROSTU` | const | 12 | 8F-P1 |
| `economy.ts:198` | `loadEconParams` | fn | 52 | 8F-P1 |
| `economy.ts:250` | `TileYield` | type | 15 | 8F-P1 |
| `economy.ts:265` | `WorkedTile` | type | 21 | 8F-P1 |
| `economy.ts:286` | `EconomyCity` | type | 27 | 8F-P1 |
| `economy.ts:313` | `CityYieldResult` | type | 40 | 8F-P1 |
| `economy.ts:353` | `PopulationGrowthResult` | type | 7 | 8F-P1 |
| `economy.ts:360` | `ProductionProgressResult` | type | 10 | 8F-P1 |
| `economy.ts:370` | `ZERO_YIELD` | const | 5 | 8F-P1 |
| `economy.ts:375` | `TERRAIN_NAME_TO_ENUM` | const | 11 | 8F-P1 |
| `economy.ts:386` | `terrainRowToTileYield` | fn | 13 | 8F-P1 |
| `economy.ts:399` | `buildTerrainYields` | fn | 9 | 8F-P1 |
| `economy.ts:408` | `terrainModifier` | fn | 5 | 8F-P1 |
| `economy.ts:413` | `TERRAIN_YIELDS` | const | 1 | 8F-P1 |
| `economy.ts:414` | `RIVER_MODIFIER` | const | 1 | 8F-P1 |
| `economy.ts:415` | `FOREST_MODIFIER` | const | 6 | 8F-P1 |
| `economy.ts:421` | `tileYield` | fn | 72 | 8F-P1 |
| `economy.ts:493` | `buildingValue` | fn | 14 | 8F-P1 |
| `economy.ts:507` | `BUILDING_HAPPINESS_BASE_PER_BUILDING` | const | 7 | 8F-P1 |
| `economy.ts:514` | `buildingGivesHappiness` | fn | 9 | 8F-P1 |
| `economy.ts:523` | `buildingHappinessAtLevel` | fn | 12 | 8F-P1 |
| `economy.ts:535` | `BuildingHappinessCatalogEntry` | type | 11 | 8F-P1 |
| `economy.ts:546` | `sumBuildingHappinessFromBuiltIds` | fn | 15 | 8F-P1 |
| `economy.ts:561` | `sumBuildingHappiness` | fn | 12 | 8F-P1 |
| `economy.ts:573` | `CityBuildingEntry` | type | 16 | 8F-P1 |
| `economy.ts:589` | `cityBuildingEntriesFromBuiltIds` | fn | 22 | 8F-P2 |
| `economy.ts:611` | `CityYieldContext` | type | 75 | 8F-P2 |
| `economy.ts:686` | `CivEconomyBonus` | type | 10 | 8F-P2 |
| `economy.ts:696` | `CivMnoznikRow` | type | 8 | 8F-P2 |
| `economy.ts:704` | `mnoznikHandelPieniadzForCiv` | fn | 13 | 8F-P2 |
| `economy.ts:717` | `civMatrixMnoznikHandelPieniadzRaw` | fn | 21 | 8F-P2 |
| `economy.ts:738` | `MNOZNIK_HANDEL_TRUDNOSC_DELTA` | const | 15 | 8F-P2 |
| `economy.ts:753` | `mnoznikHandelPieniadzForCivByDifficulty` | fn | 12 | 8F-P2 |
| `economy.ts:765` | `civBonusyForCivKey` | fn | 17 | 8F-P2 |
| `economy.ts:782` | `civEconomyYieldMultipliers` | fn | 37 | 8F-P2 |
| `economy.ts:819` | `cityYieldPerTurn` | fn | 229 | 8F-P2 |
| `economy.ts:1048` | `cityPopulationCap` | fn | 18 | 8F-P2 |
| `economy.ts:1066` | `resolvePopulationCapMatrixDelta` | fn | 18 | 8F-P2 |
| `economy.ts:1084` | `populationGrowth` | fn | 67 | 8F-P2 |
| `economy.ts:1151` | `productionProgress` | fn | 39 | 8F-P3 |
| `economy.ts:1190` | `corruptionRate` | fn | 12 | 8F-P3 |
| `economy.ts:1202` | `KORUPCJA_REDUKCJA_BUDYNKI` | const | 2 | 8F-P3 |
| `economy.ts:1204` | `KORUPCJA_REDUKCJA_NA_BUDYNEK` | const | 7 | 8F-P3 |
| `economy.ts:1211` | `KORUPCJA_REDUKCJA_SUFIT` | const | 12 | 8F-P3 |
| `economy.ts:1223` | `corruptionBuildingReduction` | fn | 21 | 8F-P3 |
| `gold-deficit.ts:31` | `GoldDeficitState` | type | 35 | 8D-P1 |
| `gold-deficit.ts:36` | `GoldDeficitParams` | type | 9 | 8D-P1 |
| `gold-deficit.ts:45` | `GoldDeficitTick` | type | 12 | 8D-P1 |
| `gold-deficit.ts:57` | `GoldDeficitTickResult` | type | 5 | 8D-P1 |
| `gold-deficit.ts:62` | `Difficulty` | type | 1 | 8D-P1 |
| `gold-deficit.ts:63` | `RawParamRow` | type | 2 | 8D-P1 |
| `gold-deficit.ts:65` | `pick` | fn | 6 | 8D-P1 |
| `gold-deficit.ts:71` | `buildGoldDeficitParams` | fn | 18 | 8D-P1 |
| `gold-deficit.ts:89` | `freshGoldDeficitState` | fn | 12 | 8D-P1 |
| `gold-deficit.ts:101` | `advanceGoldDeficit` | fn | 37 | 8D-P1 |
| `gold-deficit.ts:138` | `_lastTicks` | const | 2 | 8D-P1 |
| `gold-deficit.ts:140` | `_setLastGoldDeficitTicks` | fn | 4 | 8D-P1 |
| `gold-deficit.ts:144` | `clearLastGoldDeficitTicks` | fn | 5 | 8D-P1 |
| `gold-deficit.ts:149` | `isGoldDeficit` | fn | 5 | 8D-P1 |
| `gold-deficit.ts:154` | `isGoldDeficitStarving` | fn | 4 | 8D-P1 |
| `gold-deficit.ts:158` | `getGoldDeficitCountdown` | fn | 6 | 8D-P1 |
| `gold-deficit.ts:164` | `getLastGoldDeficitTick` | fn | 8 | 8D-P1 |
| `gold-deficit.ts:172` | `round4` | fn | 10 | 8D-P1 |
| `gold-deficit.ts:182` | `applyGoldDeficitStatMultToCombatUnit` | fn | 19 | 8D-P1 |
| `gold-deficit.ts:201` | `GoldDeficitStarvationUnit` | type | 9 | 8D-P1 |
| `gold-deficit.ts:210` | `GoldDeficitStarvationResult` | type | 11 | 8D-P1 |
| `gold-deficit.ts:221` | `applyGoldDeficitHpLoss` | fn | 30 | 8D-P2 |
| `mennica-zloto-grace.ts:14` | `MENNICA_ZLOTO_GRACE_TURNS` | const | 15 | 8D-P2 |
| `mennica-zloto-grace.ts:16` | `MennicaZlotoGraceState` | type | 7 | 8D-P2 |
| `mennica-zloto-grace.ts:23` | `createMennicaZlotoGraceState` | fn | 4 | 8D-P2 |
| `mennica-zloto-grace.ts:27` | `clearMennicaZlotoGraceState` | fn | 9 | 8D-P2 |
| `mennica-zloto-grace.ts:36` | `ownerZlotoAccessForMennica` | fn | 14 | 8D-P2 |
| `mennica-zloto-grace.ts:50` | `prepareMennicaZlotoGraceForTick` | fn | 19 | 8D-P2 |
| `mennica-zloto-grace.ts:69` | `finalizeMennicaZlotoGraceAfterTick` | fn | 15 | 8D-P2 |
| `mennica-zloto-grace.ts:84` | `MennicaZlotoGraceSave` | type | 5 | 8D-P2 |
| `mennica-zloto-grace.ts:89` | `serializeMennicaZlotoGrace` | fn | 7 | 8D-P2 |
| `mennica-zloto-grace.ts:96` | `restoreMennicaZlotoGrace` | fn | 13 | 8D-P2 |
| `okolica.ts:34` | `OKOLICA_RADIUS` | fn | 36 | 8G-P1 |
| `okolica.ts:37` | `CITY_RANGE_MIN` | fn | 3 | 8G-P1 |
| `okolica.ts:40` | `CITY_RANGE_CAP` | fn | 6 | 8G-P1 |
| `okolica.ts:46` | `cityRangeForPopulation` | fn | 10 | 8G-P1 |
| `okolica.ts:56` | `citySightRadius` | fn | 10 | 8G-P1 |
| `okolica.ts:66` | `hexKeysWithinRadius` | fn | 23 | 8G-P1 |
| `okolica.ts:89` | `isLandWorkableHex` | fn | 21 | 8G-P1 |
| `okolica.ts:110` | `cityCenterKeysFromTerritoryNodes` | fn | 18 | 8G-P1 |
| `okolica.ts:128` | `terrainAndTerritoryFilter` | fn | 20 | 8G-P1 |
| `okolica.ts:148` | `TileYield` | type | 1 | 8G-P1 |
| `okolica.ts:149` | `OkolicaTile` | type | 3 | 8G-P1 |
| `okolica.ts:152` | `okolicaTiles` | fn | 24 | 8G-P1 |
| `okolica.ts:176` | `tileScore` | fn | 8 | 8G-P1 |
| `okolica.ts:184` | `tileAssignScore` | fn | 8 | 8G-P1 |
| `okolica.ts:192` | `AssignOptions` | type | 19 | 8G-P1 |
| `okolica.ts:211` | `ScoredOkolicaTile` | type | 7 | 8G-P1 |
| `okolica.ts:218` | `compareScoredOkolicaTiles` | fn | 12 | 8G-P1 |
| `okolica.ts:230` | `scoreOkolicaTile` | fn | 20 | 8G-P1 |
| `okolica.ts:250` | `foodPotentialOfMapHex` | fn | 7 | 8G-P1 |
| `okolica.ts:257` | `assignOptionsForFocus` | fn | 13 | 8G-P1 |
| `okolica.ts:270` | `effectiveIsWorkable` | fn | 24 | 8G-P1 |
| `okolica.ts:294` | `assignWorkedTiles` | fn | 17 | 8G-P1 |
| `okolica.ts:311` | `wagiForFocus` | fn | 14 | 8G-P1 |
| `okolica.ts:325` | `ResolveWorkedTilesOpts` | type | 13 | 8G-P1 |
| `okolica.ts:338` | `resolveWorkedTiles` | fn | 44 | 8G-P1 |
| `okolica.ts:382` | `yieldOfMapHex` | fn | 16 | 8G-P1 |
| `okolica.ts:398` | `seedReczneFromAuto` | fn | 24 | 8G-P1 |
| `okolica.ts:422` | `countAssignedWorkers` | fn | 5 | 8G-P1 |
| `okolica.ts:427` | `pickDeterministicIndex` | fn | 10 | 8G-P1 |
| `okolica.ts:437` | `rebalanceWorkersAfterPopulationChange` | fn | 112 | 8G-P1 |
| `okolica.ts:549` | `adjustTileWorker` | fn | 67 | 8G-P2 |
| `okolica.ts:616` | `surroundingWorkerCap` | fn | 12 | 8G-P2 |
| `okolica.ts:628` | `toggleTileWorker` | fn | 66 | 8G-P2 |
| `okolica.ts:694` | `collectWorkedHexKeysForOwner` | fn | 27 | 8G-P2 |
| `okolica.ts:721` | `collectWorkedHexOwnerMap` | fn | 46 | 8G-P2 |
| `okolica.ts:767` | `computeLostToNearerSiblingByCity` | fn | 49 | 8G-P2 |
| `pending-improvements.ts:8` | `PendingImprovementEntry` | type | 15 | 8A-P1 |
| `pending-improvements.ts:16` | `pendingImprovementId` | fn | 4 | 8A-P1 |
| `pending-improvements.ts:20` | `parsePendingImprovementId` | fn | 7 | 8A-P1 |
| `pending-improvements.ts:27` | `PendingImprovementsTurn` | class | 48 | 8A-P1 |
| `production.ts:95` | `ProductionKind` | type | 122 | 8A-P1 |
| `production.ts:123` | `ProductionItem` | type | 27 | 8A-P1 |
| `production.ts:150` | `CityProduction` | type | 16 | 8A-P1 |
| `production.ts:166` | `RECRUIT_UNITS_PER_TURN` | const | 7 | 8A-P1 |
| `production.ts:173` | `ProductionData` | type | 15 | 8A-P1 |
| `production.ts:188` | `EPOCH_BY_NAME` | const | 13 | 8A-P1 |
| `production.ts:201` | `epochNumber` | fn | 8 | 8A-P1 |
| `production.ts:209` | `newestAvailableSameTypeUnit` | fn | 34 | 8A-P1 |
| `production.ts:243` | `buildingLevelForEpoch` | fn | 26 | 8A-P1 |
| `production.ts:269` | `buildingEffectAtLevel` | fn | 11 | 8A-P2 |
| `production.ts:280` | `DEFAULT_UNIT_COST` | fn | 7 | 8A-P2 |
| `production.ts:287` | `DEFAULT_COST_BY_ROLE` | const | 8 | 8A-P2 |
| `production.ts:295` | `unitCostFromDef` | fn | 22 | 8A-P2 |
| `production.ts:317` | `findBuilding` | fn | 5 | 8A-P2 |
| `production.ts:322` | `findUnit` | fn | 22 | 8A-P2 |
| `production.ts:344` | `itemCost` | fn | 27 | 8A-P2 |
| `production.ts:371` | `buildingProductionItem` | fn | 29 | 8A-P2 |
| `production.ts:400` | `unitProductionItem` | fn | 40 | 8A-P2 |
| `production.ts:440` | `AvailabilityContext` | type | 96 | 8A-P2 |
| `production.ts:536` | `buildingLocationAllowed` | fn | 16 | 8A-P2 |
| `production.ts:552` | `GLOBAL_BUILDING_PROD_MULT` | const | 3 | 8A-P2 |
| `production.ts:555` | `buildingWorkCost` | fn | 22 | 8A-P2 |
| `production.ts:577` | `unitMoneyCost` | fn | 20 | 8A-P2 |
| `production.ts:597` | `CivBonusLite` | type | 12 | 8A-P2 |
| `production.ts:609` | `civProductionCostBonusyForCivKey` | fn | 17 | 8A-P2 |
| `production.ts:626` | `civRecruitmentDiscount` | fn | 18 | 8A-P2 |
| `production.ts:644` | `civMatrixCostDiscount` | fn | 10 | 8A-P2 |
| `production.ts:654` | `applyCostDiscount` | fn | 6 | 8A-P2 |
| `production.ts:660` | `empireStockHas` | fn | 7 | 8A-P2 |
| `production.ts:667` | `stripDiacritics` | fn | 4 | 8A-P2 |
| `production.ts:671` | `UNIT_STOCK_GATE_LABEL` | const | 11 | 8A-P2 |
| `production.ts:682` | `unitStockShortfallLabel` | fn | 12 | 8B-P1 |
| `production.ts:694` | `CIV_KEY_TO_UNIT_NACJA` | const | 28 | 8B-P1 |
| `production.ts:722` | `unitNacjaForCivKey` | fn | 5 | 8B-P1 |
| `production.ts:727` | `unitAllowedForCivNation` | fn | 11 | 8B-P1 |
| `production.ts:738` | `availabilityCivNation` | fn | 4 | 8B-P1 |
| `production.ts:742` | `isCivSpecialReplacement` | fn | 9 | 8B-P1 |
| `production.ts:751` | `civHasReplacementFor` | fn | 12 | 8B-P1 |
| `production.ts:763` | `BUILDING_GOLD_PURCHASE_MULT` | const | 2 | 8B-P1 |
| `production.ts:765` | `buildingGoldPurchaseCost` | fn | 5 | 8B-P1 |
| `production.ts:770` | `buildingTypeCommitted` | fn | 13 | 8B-P1 |
| `production.ts:783` | `isBuildingSupersededByUpgrade` | fn | 15 | 8B-P1 |
| `production.ts:798` | `applyCompletedBuildingIds` | fn | 35 | 8B-P1 |
| `production.ts:833` | `buildingUnlockFlagFor` | fn | 10 | 8B-P1 |
| `production.ts:843` | `buildingTypeQueued` | fn | 10 | 8B-P1 |
| `production.ts:853` | `isBlankReplacement` | fn | 12 | 8B-P1 |
| `production.ts:865` | `civSpecialUnitNameTokens` | fn | 26 | 8B-P1 |
| `production.ts:891` | `unitMatchesSpecialName` | fn | 32 | 8B-P1 |
| `production.ts:923` | `availableProduction` | fn | 213 | 8B-P1 |
| `production.ts:1136` | `availableReplacementsFor` | fn | 117 | 8B-P1 |
| `production.ts:1253` | `frontItem` | fn | 15 | 8C-P1 |
| `production.ts:1268` | `etaTurns` | fn | 6 | 8C-P1 |
| `production.ts:1274` | `buildingWorkPerTurn` | fn | 8 | 8C-P1 |
| `production.ts:1282` | `unitRecruitmentCapacityPerTurn` | fn | 36 | 8C-P1 |
| `production.ts:1318` | `enqueue` | fn | 48 | 8C-P1 |
| `production.ts:1366` | `forfeitedProgressForIndex` | fn | 31 | 8C-P1 |
| `production.ts:1397` | `bankRemovedBuildingProgress` | fn | 23 | 8C-P1 |
| `production.ts:1420` | `withdrawBankedBuildingProgress` | fn | 8 | 8C-P1 |
| `production.ts:1428` | `BuildQueueSanitizeResult` | type | 12 | 8C-P1 |
| `production.ts:1440` | `sanitizeBuildQueue` | fn | 68 | 8C-P1 |
| `production.ts:1508` | `dropFrontItem` | fn | 56 | 8C-P1 |
| `production.ts:1564` | `dequeue` | fn | 29 | 8C-P1 |
| `production.ts:1593` | `FilterQueueResult` | type | 54 | 8C-P1 |
| `production.ts:1647` | `filterQueue` | fn | 98 | 8C-P1 |
| `production.ts:1745` | `promoteToFront` | fn | 81 | 8C-P1 |
| `production.ts:1826` | `insertAtFront` | fn | 44 | 8C-P2 |
| `production.ts:1870` | `AdvanceProductionResult` | type | 29 | 8C-P2 |
| `production.ts:1899` | `advanceProduction` | fn | 78 | 8C-P2 |
| `production.ts:1977` | `UNIT_POPULATION_COST` | fn | 3 | 8B-P1 |
| `production.ts:1980` | `populationCostOf` | fn | 5 | 8B-P1 |
| `production.ts:1985` | `manpowerCostOf` | fn | 5 | 8B-P1 |
| `production.ts:1990` | `setPaused` | fn | 14 | 8B-P1 |
| `production.ts:2004` | `enqueueRecruitment` | fn | 12 | 8B-P2 |
| `production.ts:2016` | `dequeueRecruitment` | fn | 19 | 8B-P2 |
| `production.ts:2035` | `AdvanceRecruitmentResult` | type | 6 | 8B-P2 |
| `production.ts:2041` | `AdvanceRecruitmentGatedResult` | type | 8 | 8B-P2 |
| `production.ts:2049` | `advanceRecruitmentGated` | fn | 53 | 8B-P2 |
| `production.ts:2102` | `advanceRecruitment` | fn | 35 | 8B-P2 |
| `production.ts:2137` | `rushCost` | fn | 20 | 8B-P2 |
| `production.ts:2157` | `rushProduction` | fn | 54 | 8B-P2 |
| `production.ts:2211` | `cityPracaInteger` | fn | 4 | 8B-P2 |
| `production.ts:2215` | `PodzialPracyMiasta` | type | 13 | 8B-P2 |
| `production.ts:2228` | `splitPraca` | fn | 17 | 8B-P2 |
| `production.ts:2245` | `pracaImperialPoolGain` | fn | 8 | 8B-P2 |
| `production.ts:2253` | `PracaSplitTick` | type | 9 | 8B-P2 |
| `production.ts:2262` | `previewPracaPoolBrutto` | fn | 22 | 8B-P2 |
| `production.ts:2284` | `unitCostMode` | fn | 5 | 8B-P2 |
| `production.ts:2289` | `unitPurchaseCost` | fn | 20 | 8B-P2 |
| `production.ts:2309` | `buildableProduction` | fn | 6 | 8B-P2 |
| `production.ts:2315` | `purchasableUnits` | fn | 5 | 8B-P2 |
| `production.ts:2320` | `EPOCH_NUMBER_TO_NAME` | const | 6 | 8B-P2 |
| `production.ts:2326` | `BuildingCatalogStatus` | type | 3 | 8B-P2 |
| `production.ts:2329` | `BuildingCatalogEntry` | type | 21 | 8B-P2 |
| `production.ts:2350` | `eraBuildingCatalog` | fn | 100 | 8B-P2 |
| `production.ts:2450` | `OutputShares` | type | 11 | 8B-P2 |
| `production.ts:2461` | `OutputSplit` | type | 11 | 8B-P2 |
| `production.ts:2472` | `DEFAULT_OUTPUT_SHARES` | const | 24 | 8B-P2 |
| `production.ts:2496` | `splitOutput` | fn | 35 | 8B-P2 |
| `production.ts:2531` | `cityScienceOutput` | fn | 8 | 8B-P2 |
| `production.ts:2539` | `cityMoneyOutput` | fn | 3 | 8B-P2 |
| `relief-preserving-improvements.ts:24` | `PRESERVES_HILL_RELIEF_EXPLICIT_KEYS` | const | 25 | 8I-P3 |
| `relief-preserving-improvements.ts:26` | `KOPALNIA_PREFIX` | const | 2 | 8I-P3 |
| `relief-preserving-improvements.ts:28` | `KOPALNIA_LEGACY_KEY` | const | 7 | 8I-P3 |
| `relief-preserving-improvements.ts:35` | `preservesHillReliefKey` | fn | 6 | 8I-P3 |
| `relief-preserving-improvements.ts:41` | `preservesHillRelief` | fn | 3 | 8I-P3 |
| `resource-access.ts:25` | `HexZloze` | type | 26 | 8H-P1 |
| `resource-access.ts:27` | `ImprovementRow` | type | 3 | 8H-P1 |
| `resource-access.ts:30` | `parseSurowiecOdblokowany` | fn | 13 | 8H-P1 |
| `resource-access.ts:43` | `IMPROVEMENTS` | const | 3 | 8H-P1 |
| `resource-access.ts:46` | `NAKLADKA_LABEL` | const | 7 | 8H-P1 |
| `resource-access.ts:53` | `ZLOZE_LABEL` | const | 11 | 8H-P1 |
| `resource-access.ts:64` | `SUROWIEC_KEY_LABEL` | const | 18 | 8H-P1 |
| `resource-access.ts:82` | `labelForHex` | fn | 15 | 8H-P1 |
| `resource-access.ts:97` | `hexDepositDisplayLabel` | fn | 4 | 8H-P1 |
| `resource-access.ts:101` | `ERA_UI_NAMES` | const | 7 | 8H-P1 |
| `resource-access.ts:108` | `hexHiddenDepositHint` | fn | 9 | 8H-P1 |
| `resource-access.ts:117` | `labelsForImprovementUnlock` | fn | 11 | 8H-P1 |
| `resource-access.ts:128` | `ResourceAccessCity` | type | 8 | 8H-P1 |
| `resource-access.ts:136` | `ResourceAccessOptions` | type | 11 | 8H-P1 |
| `resource-access.ts:147` | `CityResourceAccess` | type | 7 | 8H-P1 |
| `resource-access.ts:154` | `improvementKeysOnPlacedHex` | fn | 11 | 8H-P1 |
| `resource-access.ts:165` | `DEPOSIT_LINKED_IMPROVEMENTS` | const | 5 | 8H-P1 |
| `resource-access.ts:170` | `LIVESTOCK_NO_DEPOSIT` | const | 10 | 8H-P1 |
| `resource-access.ts:180` | `LIVESTOCK_NOT_RESOURCE` | const | 3 | 8H-P1 |
| `resource-access.ts:183` | `NO_DEPOSIT_IMPROVEMENTS` | const | 6 | 8H-P1 |
| `resource-access.ts:189` | `improvementUnlockActiveOnHex` | fn | 26 | 8H-P1 |
| `resource-access.ts:215` | `labelsForKopalniaMiedziOnHex` | fn | 7 | 8H-P1 |
| `resource-access.ts:222` | `activeLabelsForImprovementOnHex` | fn | 11 | 8H-P1 |
| `resource-access.ts:233` | `sortLabels` | fn | 10 | 8H-P1 |
| `resource-access.ts:243` | `CITY_PANEL_RANGE_DEPOSIT_LABELS` | const | 6 | 8H-P1 |
| `resource-access.ts:249` | `filterCityPanelRangeLabels` | fn | 4 | 8H-P1 |
| `resource-access.ts:253` | `hexesInCitySight` | fn | 16 | 8H-P1 |
| `resource-access.ts:269` | `collectDepositPotential` | fn | 13 | 8H-P1 |
| `resource-access.ts:282` | `collectActiveAccess` | fn | 48 | 8H-P1 |
| `resource-access.ts:330` | `getCityResourceAccessForCity` | fn | 22 | 8H-P1 |
| `resource-access.ts:352` | `getResourceAccessForCity` | fn | 11 | 8H-P1 |
| `society-breakdown.ts:23` | `SocietyLine` | type | 28 | 8J-P1 |
| `society-breakdown.ts:29` | `HappinessPctBreakdown` | type | 7 | 8J-P1 |
| `society-breakdown.ts:36` | `LawPctBreakdown` | type | 7 | 8J-P1 |
| `society-breakdown.ts:43` | `PorPctBand` | type | 8 | 8J-P1 |
| `society-breakdown.ts:51` | `OrderPctBreakdown` | type | 12 | 8J-P1 |
| `society-breakdown.ts:63` | `HappinessBreakdownInput` | type | 69 | 8J-P1 |
| `society-breakdown.ts:132` | `LawBreakdownInput` | type | 60 | 8J-P1 |
| `society-breakdown.ts:192` | `REVOLT_CRITICAL_POR_PCT` | const | 1 | 8J-P1 |
| `society-breakdown.ts:193` | `REVOLT_GRACE_TURNS` | const | 3 | 8J-P1 |
| `society-breakdown.ts:196` | `RevoltParams` | type | 5 | 8J-P1 |
| `society-breakdown.ts:201` | `FALLBACK_REVOLT_PARAMS` | const | 5 | 8J-P1 |
| `society-breakdown.ts:206` | `REBEL_FACTION_OWNER_ID` | const | 18 | 8J-P1 |
| `society-breakdown.ts:224` | `SZMAX_BY_ERA_DEFAULT` | const | 1 | 8J-P1 |
| `society-breakdown.ts:225` | `SZMAX_DEFAULTS` | const | 11 | 8J-P1 |
| `society-breakdown.ts:236` | `PRAWMAX_BY_ERA_DEFAULT` | const | 7 | 8J-P1 |
| `society-breakdown.ts:243` | `PRAWO_GARNIZON_BUDYNEK_BY_ERA_DEFAULT` | const | 6 | 8J-P1 |
| `society-breakdown.ts:249` | `KULT_RELIG_BY_ERA_DEFAULT` | const | 1 | 8J-P1 |
| `society-breakdown.ts:250` | `PRAWMAX_DEFAULTS` | const | 6 | 8J-P1 |
| `society-breakdown.ts:256` | `SZ_PCT_CAP` | const | 7 | 8J-P1 |
| `society-breakdown.ts:263` | `PRAW_PCT_CAP` | const | 27 | 8J-P1 |
| `society-breakdown.ts:290` | `SZ_MAX_POP_WSP_DEFAULT` | const | 7 | 8J-P1 |
| `society-breakdown.ts:297` | `PRAW_MAX_POP_WSP_DEFAULT` | const | 1 | 8J-P1 |
| `society-breakdown.ts:298` | `SZ_MAX_POP_ODNIESIENIA_DEFAULT` | const | 1 | 8J-P1 |
| `society-breakdown.ts:299` | `PRAW_MAX_POP_ODNIESIENIA_DEFAULT` | const | 6 | 8J-P1 |
| `society-breakdown.ts:305` | `RawParamRow` | type | 7 | 8J-P1 |
| `society-breakdown.ts:312` | `pickOsiedlePopBonus` | fn | 20 | 8J-P1 |
| `society-breakdown.ts:332` | `pickSociety` | fn | 17 | 8J-P1 |
| `society-breakdown.ts:349` | `pickSocietyArray` | fn | 21 | 8J-P1 |
| `society-breakdown.ts:370` | `SocietyScaleParams` | type | 29 | 8J-P1 |
| `society-breakdown.ts:399` | `FALLBACK_SOCIETY_SCALE` | const | 17 | 8J-P1 |
| `society-breakdown.ts:416` | `loadSocietyScaleParams` | fn | 29 | 8J-P1 |
| `society-breakdown.ts:445` | `osiedlePopLabel` | fn | 6 | 8J-P1 |
| `society-breakdown.ts:451` | `osiedlePopMax` | fn | 14 | 8J-P1 |
| `society-breakdown.ts:465` | `isOsiedleRevoltImmune` | fn | 10 | 8J-P1 |
| `society-breakdown.ts:475` | `loadRevoltParams` | fn | 16 | 8J-P1 |
| `society-breakdown.ts:491` | `resolvePalacTier` | fn | 7 | 8J-P1 |
| `society-breakdown.ts:498` | `clampPct` | fn | 5 | 8J-P1 |
| `society-breakdown.ts:503` | `pctFromNetto` | fn | 9 | 8J-P1 |
| `society-breakdown.ts:512` | `maxFromEraTable` | fn | 7 | 8J-P1 |
| `society-breakdown.ts:519` | `szMaxForEra` | fn | 7 | 8J-P1 |
| `society-breakdown.ts:526` | `prawMaxForEra` | fn | 12 | 8J-P1 |
| `society-breakdown.ts:538` | `prawGarnizonBudynekForEra` | fn | 12 | 8J-P1 |
| `society-breakdown.ts:550` | `kultReligScaleForEra` | fn | 23 | 8J-P1 |
| `society-breakdown.ts:573` | `proporcjonalneSzczescie` | fn | 12 | 8J-P1 |
| `society-breakdown.ts:585` | `ownShareFromSignal` | fn | 22 | 8J-P2 |
| `society-breakdown.ts:607` | `popScaleMultiplier` | fn | 9 | 8J-P2 |
| `society-breakdown.ts:616` | `szMaxForCity` | fn | 11 | 8J-P2 |
| `society-breakdown.ts:627` | `prawMaxForCity` | fn | 21 | 8J-P2 |
| `society-breakdown.ts:648` | `PODATKI_MIN_DEFAULT` | const | 1 | 8J-P2 |
| `society-breakdown.ts:649` | `PODATKI_MAX_DEFAULT` | const | 1 | 8J-P2 |
| `society-breakdown.ts:650` | `PODATKI_PROG_PCT_DEFAULT` | const | 2 | 8J-P2 |
| `society-breakdown.ts:652` | `luksusHappinessBonus` | fn | 15 | 8J-P2 |
| `society-breakdown.ts:667` | `podzialLuksus` | fn | 9 | 8J-P2 |
| `society-breakdown.ts:676` | `udzialLineLabel` | fn | 25 | 8J-P2 |
| `society-breakdown.ts:701` | `computeHappinessBreakdown` | fn | 115 | 8J-P2 |
| `society-breakdown.ts:816` | `computeLawBreakdown` | fn | 95 | 8J-P2 |
| `society-breakdown.ts:911` | `porPctBand` | fn | 11 | 8J-P2 |
| `society-breakdown.ts:922` | `POR_BAND_LABELS` | const | 9 | 8J-P2 |
| `society-breakdown.ts:931` | `tierFromPorPct` | fn | 7 | 8J-P2 |
| `society-breakdown.ts:938` | `orderEffectsFromPorPct` | fn | 52 | 8J-P2 |
| `society-breakdown.ts:990` | `computePorPct` | fn | 12 | 8J-P2 |
| `society-breakdown.ts:1002` | `OrderContributionPct` | type | 17 | 8J-P2 |
| `society-breakdown.ts:1019` | `orderContributionPct` | fn | 20 | 8J-P2 |
| `society-breakdown.ts:1039` | `computeOrderPctBreakdown` | fn | 24 | 8J-P2 |
| `society-breakdown.ts:1063` | `evaluateOrderFromBreakdown` | fn | 14 | 8J-P2 |
| `society-breakdown.ts:1077` | `applyCivMatrixHappinessModifier` | fn | 36 | 8J-P2 |
| `society-breakdown.ts:1113` | `RevoltGraceState` | type | 7 | 8J-P2 |
| `society-breakdown.ts:1120` | `updateRevoltGrace` | fn | 44 | 8J-P2 |
| `society-breakdown.ts:1164` | `revoltWarningMessage` | fn | 9 | 8J-P2 |
| `society-inputs.ts:11` | `isForeignReligionDominant` | fn | 22 | 8H-P1 |
| `society-inputs.ts:23` | `resolveOwnCultureShare` | fn | 12 | 8H-P1 |
| `society-inputs.ts:35` | `cityCultureMixActive` | fn | 5 | 8H-P1 |
| `society-inputs.ts:40` | `clearCityCultureMix` | fn | 5 | 8H-P1 |
| `society-inputs.ts:45` | `CultureMixLine` | type | 7 | 8H-P1 |
| `society-inputs.ts:52` | `cultureMixBreakdown` | fn | 37 | 8H-P1 |
| `society-inputs.ts:89` | `isPlayerCapitalCity` | fn | 22 | 8H-P1 |
| `society-inputs.ts:111` | `stolicaEasyBonusActive` | fn | 12 | 8H-P1 |
| `wealth.ts:31` | `Difficulty` | type | 32 | 8D-P2 |
| `wealth.ts:33` | `WealthParams` | type | 26 | 8D-P2 |
| `wealth.ts:59` | `wealthParamsWithCapModifier` | fn | 10 | 8D-P2 |
| `wealth.ts:69` | `wealthParamsWithMultiplierModifier` | fn | 10 | 8D-P2 |
| `wealth.ts:79` | `FALLBACK_WEALTH_PARAMS` | const | 12 | 8D-P2 |
| `wealth.ts:91` | `RawRow` | type | 1 | 8D-P2 |
| `wealth.ts:92` | `RawWealthParamsJson` | type | 8 | 8D-P2 |
| `wealth.ts:100` | `loadWealthParams` | fn | 28 | 8D-P2 |
| `wealth.ts:128` | `wealthCap` | fn | 5 | 8D-P2 |
| `wealth.ts:133` | `wealthMnoznik` | fn | 21 | 8D-P2 |
| `wealth.ts:154` | `wealthZadowolenie` | fn | 15 | 8D-P2 |
| `wealth.ts:169` | `wealthRownowaga` | fn | 8 | 8D-P2 |
| `wealth.ts:177` | `wealthProg` | fn | 8 | 8D-P2 |
| `wealth.ts:185` | `WealthState` | type | 5 | 8D-P2 |
| `wealth.ts:190` | `WealthTickResult` | type | 10 | 8D-P2 |
| `wealth.ts:200` | `WealthTickOptions` | type | 18 | 8D-P2 |
| `wealth.ts:218` | `advanceWealth` | fn | 51 | 8D-P2 |
| `wealth.ts:269` | `freshWealthState` | fn | 3 | 8D-P2 |
| `zelazo-access.ts:16` | `KOPALNIA_ZELAZA_KEY` | const | 18 | 8H-P1 |
| `zelazo-access.ts:19` | `KOPALNIA_KEY` | const | 3 | 8H-P1 |
| `zelazo-access.ts:22` | `ODLEWNIA_ZELAZA_BUILDING_ID` | const | 3 | 8H-P1 |
| `zelazo-access.ts:25` | `ZLOZE_ZELAZO_KEY` | const | 2 | 8H-P1 |
| `zelazo-access.ts:27` | `improvementKeysOnPlaced` | fn | 11 | 8H-P2 |
| `zelazo-access.ts:38` | `ZlozeHexMapLike` | type | 4 | 8H-P2 |
| `zelazo-access.ts:42` | `isKopalniaZelazaKey` | fn | 8 | 8H-P2 |
| `zelazo-access.ts:50` | `empireHasKopalniaNaZlozuZelaza` | fn | 21 | 8H-P2 |
| `zelazo-access.ts:71` | `cityHasOdlewniaZelaza` | fn | 8 | 8H-P2 |
| `zelazo-access.ts:79` | `hasZelazoAccess` | fn | 11 | 8H-P2 |
| `zloto-access.ts:19` | `KOPALNIA_ZLOTA_KEY` | const | 21 | 8H-P2 |
| `zloto-access.ts:22` | `ZLOTO_STOCK_KEY` | const | 3 | 8H-P2 |
| `zloto-access.ts:25` | `ZLOTO_LABEL` | const | 3 | 8H-P2 |
| `zloto-access.ts:28` | `KOPALNIA_ZLOTA_YIELD_PER_TURN` | const | 3 | 8H-P2 |
| `zloto-access.ts:31` | `MENNICA_ZLOTO_DRAIN_PER_TURN` | const | 2 | 8H-P2 |
| `zloto-access.ts:33` | `improvementKeysOnPlaced` | fn | 14 | 8H-P2 |
| `zloto-access.ts:47` | `countKopalnieZlota` | fn | 18 | 8H-P2 |
| `zloto-access.ts:65` | `empireHasKopalniaZlota` | fn | 7 | 8H-P2 |
| `zloto-access.ts:72` | `empireZlotoStock` | fn | 9 | 8H-P2 |
| `zloto-access.ts:81` | `ownerHasZlotoStock` | fn | 10 | 8H-P2 |
| `zloto-access.ts:91` | `ownerCanFeedMennica` | fn | 12 | 8H-P2 |
| `zloto-access.ts:103` | `resolveOwnerZlotoFromStock` | fn | 13 | 8H-P2 |
| `zloto-access.ts:116` | `deductMennicaZlotoDrain` | fn | 19 | 8H-P2 |
| `zloto-access.ts:135` | `TRADE_GRANT_ZLOTO_SYNTHETIC_KEY` | const | 5 | 8H-P2 |
| `zloto-access.ts:140` | `placedImprovementsWithZlotoTradeGrant` | fn | 6 | 8H-P2 |
