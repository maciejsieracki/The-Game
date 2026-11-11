# REPIN-DELTA-6 — dryf logiki weba względem portu Rust (FALA 556–606)

TEMAT: R-RUSTPORT-REPIN-DELTA-6-Q1 · RUNDA 2/5 (obrona po FAIL rundy 1; odpowiedzi na zarzuty w `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-6-Q1/02-operator-r2.md`) · DOMAIN: PROCESS (pomiar, bez zmian kodu)
BAZA WEB: `origin/main` = `638e90bea` · BAZA RUST: `origin/rust-port/parity-v2` = `43f4064b0`
ZAKRES: commity `FALA 556`…`FALA 606` (`2339b3dab` FALA 556 AIPEACE … `d0ccc260e` FALA 606 SIEGE-NEARBY). Dispatch mówi 556–606; plan §5 mówi 563–606. Przyjęto 556–606 (szerszy, nic nie pominięte; wiersze 556–562 oznaczone).
Diff (runda 1, nie powtarzany): `git diff 2339b3dab^ origin/main -- gra/src/game gra/data` = 69 plików, +5812/−324; `gra/src/game` = 206 hunków.

## Legenda

- Klasy: LOGIKA (zmienia wynik gry), DANE (wartości w `gra/data/*.json`), UI (prezentacja), PERF (bez wpływu na wynik).
- ZMIERZONO = wynik komendy `git grep` / `git show` / `git log` podany w wierszu (commit origin/main lub parity-v2).
- NIE_ZMIERZONO = brak potwierdzonej semantyki lub wartości; nie traktować jako zgodność.
- Linie: `plik:linia` = nagłówek funkcji/stała zmierzona w tej rundzie; zakres `:a–b` tylko tam, gdzie zmierzono oba końce, inaczej zakres z rundy 1 oznaczony NIE_ZMIERZONO.

## 1. Mechanizmy — stan portu Rust (ZMIERZONO w rundzie 2)

| Mechanizm | Web `origin/main` | Rust `parity-v2` | Wynik |
|---|---|---|---|
| `CONVERTER_ERA_SCALING_PCT` | `gra/src/game/converters.ts:137` = 0.10; `:212` `baseThroughput * (1 + PCT*(e-1))` | `rust-port/engine/src/domain/turn_economy_resources.rs:142` = 0.10; `:197` ta sama formuła; `:351` `converter_throughputs_for_era` | ISTNIEJE, stała ZGODNA (ZMIERZONO) |
| przepustowość cegielni / wyjście | `converters.ts` recepta `cegielnia`: `throughputFallback: 50`, `outputAmount: 2` | `turn_economy_resources.rs:54–62` `throughput_fallback: 50.0`, `output_amount: 2.0`; `:160–170` wyjście ×0,50 tylko dla `cegielnia` | ZGODNE (ZMIERZONO) |
| odlewnie × epoka | `converters.ts`: `converterThroughputForEra` → `citizenConsumptionEraMultiplier(era)` dla `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` | `turn_economy_resources.rs:182–187` `citizen_consumption_era_multiplier`; `CONVERTER_FOUNDRY_ERA_RECIPE_IDS` (po `:142`, 6 id) | LOGIKA ZGODNA (ZMIERZONO); pełna zgodność zbioru 6 id i `throughputFallback` odlewni NIE_ZMIERZONO |
| `plannedMarchesToSave` | `gra/src/game/planned-march.ts:485` | `rust-port/engine/src/domain/pathfinding.rs:2250` `planned_marches_to_save`; użycie `general_quick_follow.rs:191` | ISTNIEJE (ZMIERZONO); semantyka zapisu NIE_ZMIERZONO → temat #9 |
| `pokojAiAi.minBilansPW` | `gra/data/diplomacy-war-peace-params.json` (sekcja `pokojAiAi`); czytane `diplomacy-ai-forced-peace.ts:30–35` | 0 trafień `pokojAiAi|pokoj_ai_ai|minBilans|min_bilans` w `rust-port` | LUKA (ZMIERZONO) |
| `przewagaMilitarna.prog` = 0,20 | `diplomacy-war-peace-params.json` sekcja `przewagaMilitarna` (`prog: 0.20`, `epsilon: 1e-9`); `diplomacy-peace-lock.ts:173,180` | 0 trafień sekcji w `engine/data/derived/diplomacy-war-peace-params.json`. Trafienia `przewaga_militarna`/`military_advantage` dotyczą INNEGO parametru: `przewagaMilitarna_respekt` = +15 (`engine/data/diplomacy.json:14`, `engine/src/data/civilizations.rs:292–293`, `engine/src/domain/diplomacy.rs:236,341,557,601`) | LUKA progu (ZMIERZONO); `_respekt` ZGODNE wartością 15 (`diplomacy.ts:132` vs `diplomacy.json:14`) |
| `sojusz_pelny.prog_relacja` | `gra/data/diplomacy-acceptance-points.json:6` = **130** | `rust-port/engine/data/diplomacy-acceptance-points.json:5` = **151** | DRYF DANYCH (ZMIERZONO) |
| `eraForcedWarStartTurnsFromEra` | `gra/data/war-rules-params.json:5` = `{stone:40, bronze:40, iron:40}`; `forced-war-bronze.ts:89`, `forced-war-iron.ts:132` | `rust-port/engine/src/domain/diplomacy_multiwar_gate.rs:58` `ERA_FORCED_WAR_START_TURNS_BRONZE = 20.0`; `:60` `…_IRON = 20.0`; `war_era_pool.rs:7` komentarz „bronze/iron = 20” | DRYF DANYCH (ZMIERZONO): 40 vs 20 |
| `AI_REJECTED_OFFER_COOLDOWN_TURNS` | `gra/src/game/diplomacy-rejection-cooldown.ts:12` = 3 | `rust-port/engine/src/domain/diplomacy_rejection_cooldown.rs:17` = 3.0 | ZGODNE (ZMIERZONO) |
| utrzymanie surowcowe budynków — model | `gra/src/game/economy-upkeep.ts:688` `DEFAULT_BUILDING_RESOURCE_UPKEEP_RATIO = 1`; `:716–748` `buildingResourceUpkeep`: `floor(surowe utrzymanie Pieniądza × ratio)` na KAŻDY typ z `koszt_surowce` + jawne `utrzymanie_surowce` (stała ilość). Stała „5 na typ” NIE występuje w web (0 trafień `UNITS_PER_TYPE` w `gra/src`) | `rust-port/engine/src/domain/turn_economy.rs:1674–1675` `BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE = 5.0`; `:1687–1700` 5 jedn. na każdy typ | DRYF LOGIKI (ZMIERZONO): Rust = model sprzed commitów `956c9a6b7`/`c8ee037fb` (proporcjonalny do Pieniądza) i `b1a5c1e80` (ceramika `utrzymanie_surowce` 2/t). Wiersz „ZGODNE” z rundy 1 był BŁĘDNY |
| `bez_wylomu_max_tur` / sufit 150 | `gra/data/combat-params.json:54` = 150; `gra/src/battle/battleScene.ts:1127–1128` `SIEGE_NO_BREACH_MAX_ROUNDS` | 0 trafień `no_breach|bez_wylom|NO_BREACH` w `rust-port/engine` | LUKA (ZMIERZONO) |
| `unitsPerSiegeEngine` | `gra/data/siege-engine-params.json` | 0 trafień parametru (`units_per_siege|unitsPerSiegeEngine|siege_engine`; jedyne trafienie `end_map_siege_engine` `turn_economy_attrition.rs:149`, nie parametr) | LUKA (ZMIERZONO) |
| budowa machin / `queueSiegeMachine` | `gra/src/game/siegeMachines.ts:29`; `siege-engine-build.ts` (nowy, 109 linii) | Rust: tylko `has_siege_machines` (`turn_economy_attrition.rs:126–127`, kasowany `:159`); brak kolejkowania i budowy (0 trafień `siege_machine` poza `turn_economy_attrition.rs`) | LUKA budowy (ZMIERZONO) |
| `rangeDamageTw` / `ranged_damage_mult` | `combat.ts:468` (def), `:491` (mnożnik klasy i kontra), `:514–516` (alias deprecated); `unit-power.ts:14` | 0 trafień (potwierdzone w zarzutach rundy 1, `LUKI #6`) | LUKA (ZMIERZONO w rundzie 1) |
| `isTruceBreach` | `gra/src/game/diplomacy-peace-lock.ts:106` (zmierzone), `:213` | `domain/diplomacy_truce.rs` (istnieje wg rundy 1) | Moduł ISTNIEJE; zgodność logiki NIE_ZMIERZONO |

## 2. Tabela hunków behawioralnych — korekty rundy 2

Uwaga: pełna tabela 206 hunków (semantyka każdego) NIE została wykonana; poniżej wiersze z pomiarem rundy 2 i wiersze z rundy 1 z poprawionymi liniami. Każdy wiersz: plik:linia (web) · co · klasa · moduł Rust · temat · commit (ZMIERZONO z `git log 2339b3dab^..origin/main -- <plik>`; `—` = NIE_ZMIERZONO).

### Temat #5 — DYPLOMACJA-ROZEJM-5-10-15

| Miejsce web | Co | Klasa | Rust | Commit | Status |
|---|---|---|---|---|---|
| `diplomacy-peace-lock.ts:106` `isTruceBreach` | naruszenie rozejmu | LOGIKA | `diplomacy_truce.rs` | `5f3b48852`, `ea9fca67e`, `e7bf8acc8` (TRUCE r3–r6) | ZMIERZONO linia |
| `diplomacy-peace-lock.ts:163–180` (`prog` `:173`, `epsilon` `:180`) `przewagaMilitarna` | akceptacja pokoju wg siły | LOGIKA+DANE | `diplomacy_truce.rs` / `diplomacy.rs` | `e135f923f`, `5f3b48852` | LUKA progu (§1) |
| `diplomacy-peace-lock.ts:213` | blokada z `truceEndOffer` | LOGIKA | `diplomacy_truce.rs` | `e7bf8acc8` | linia ZMIERZONO |
| `diplomacy-peace-proposal-timing.ts:1–10` (nowy, 10 linii) | timing propozycji pokoju | LOGIKA | `diplomacy_truce.rs` | — | długość ZMIERZONO |
| `diplomacy-ai-forced-peace.ts:26`, `:261` `decideAiPeaceRequest`, `:324` `runAiAiPeaceTick` (zakres 249–364 z rundy 1: NIE_ZMIERZONO) | pokój AI–AI, `pokojAiAi` | LOGIKA+DANE | `ai_peace_city_offer.rs` / `diplomacy_truce.rs` | `4eb423fcc` | `pokojAiAi` LUKA (§1) |
| `diplomacy-war-peace-profile.ts:381` `evaluatePeaceAiGate` (mnożnik ceny `:311,352` NIE_ZMIERZONO) | bramka pokoju AI | LOGIKA | `diplomacy.rs` | `e135f923f` | linia ZMIERZONO |
| `diplomacy-rejection-cooldown.ts:12,51,90` | cooldown 3 tury | LOGIKA | `diplomacy_rejection_cooldown.rs:17` | `b8bd14e45` (własny klucz cooldownu miasta) | wartość ZGODNA (§1) |
| `diplomacy-proposals.ts:1071` `evaluateProposal` (gałęzie 1092–1327 z rundy 1: NIE_ZMIERZONO) | traktaty, propozycja pokoju | LOGIKA | `diplomacy.rs` | — | nagłówek ZMIERZONO |
| `diplomacy-acceptance-points.json:6` `sojusz_pelny` `prog_relacja` = 130 | próg sojuszu | DANE | `rust-port/engine/data/diplomacy-acceptance-points.json:5` = 151 | `34c7dfd72`, `258745652` (ALLIANCE 130/90) | **DRYF ZMIERZONO (130 vs 151)** |
| `war-rules-params.json:5` `eraForcedWarStartTurnsFromEra` 40 | opóźnienie wojny epoki | DANE | `diplomacy_multiwar_gate.rs:58,60` = 20 | `3f691a2f3` (wait 40 owner-era turns), `b3a5d6930`, `e0dbae712` | **DRYF ZMIERZONO (40 vs 20)** |
| `war-weariness.ts:218` `runWarWearinessTick` (zakres 231–292 z rundy 1: NIE_ZMIERZONO) | zmęczenie wojną | LOGIKA | moduł wg rundy 1 (`diplomacy_war_weariness_tick.rs`, NIE_ZMIERZONO ponownie) | — | poza #5, odnotowane |

### Temat #6 — WALKA-DYSTANS-MULT

| Miejsce web | Co | Klasa | Rust | Commit | Status |
|---|---|---|---|---|---|
| `combat.ts:465–491` `rangeDamageTw` + mnożnik `:491` (klasa strzelca, kontra przed zaokrągleniem) | nowy mnożnik pocisku | LOGIKA | `domain/combat.rs` (brak) | `17be3f180`, `a259012fa` | LUKA |
| `unit-power.ts:14,54,122,187` `rangedDamageMultFor`, `fieldPower` (`:122`), `armyFieldPower` (`:187`) | źródło mocy i liczb | DANE+LOGIKA | `combat.rs` / `ai_turn.rs` | `a259012fa` | LUKA |
| `combat-params.json` `ranged_damage_mult` (`slinger:3`, `lucznik_piesi:2`) | wartości | DANE | — | `17be3f180` | LUKA |
| `combat.ts` `resolveCombat` (1035–1059 z rundy 1: NIE_ZMIERZONO) | podpięcie mnożnika i celności `max(wręcz, dystans)` | LOGIKA | `domain/combat.rs` | `17be3f180` | nagłówek NIE_ZMIERZONO |
| `battle/battleScene.ts:8964` (poza listą dispatchu) | `rangeDamage × rangedDamageMultFor` w bitwie ręcznej | LOGIKA | `domain/battle_mode.rs` | — | linia z rundy 1, NIE_ZMIERZONO |
| `combat.ts:514–516` alias `@deprecated` (rundy 1 błędnie `:472/`) | porządek | PERF | — | — | ZMIERZONO |
| `unit-card-stats.ts:15–126` | karta jednostki | UI | renderer | — | temat web #205 |

### Temat #7 — OBLEZENIE-LIMIT-150-BLOKADA

| Miejsce web | Co | Klasa | Rust | Commit | Status |
|---|---|---|---|---|---|
| `combat-params.json:54` `bez_wylomu_max_tur` = 150 | sufit tur oblężenia | DANE | LUKA (§1) | `c8e3e4664` | LUKA |
| `battle/battleScene.ts:1127–1128` `SIEGE_NO_BREACH_MAX_ROUNDS` | sufit w bitwie (poza listą dispatchu) | LOGIKA | `domain/battle_mode.rs` | `c8e3e4664` | LUKA |
| `diplomacy-siege-war-gate.ts` `AreEnemyOwnersFn` (19–51 z rundy 1: NIE_ZMIERZONO) | bramka oblężenia w wojnie | LOGIKA | `domain/diplomacy_siege_war_gate.rs` | — | NIE_ZMIERZONO zakres |
| `siegeDefenders.ts:96` `defenderUnitsNearCity`, `:309` `collectCityDefRoster` | SIEGE-NEARBY | LOGIKA | `domain/siege_sortie.rs` / `siege_enter_city.rs` | `47d53fae0` | nagłówki ZMIERZONO |
| `siegeMachines.ts:29` `queueSiegeMachine` | kolejkowanie machin | LOGIKA | LUKA (brak) | `6218f2ab1` | NOWY TEMAT (machiny) |
| `siege-engine-build.ts` (nowy, 109 linii) | budowa 1 machiny / 10 jednostek | LOGIKA | LUKA | `6218f2ab1` | NOWY TEMAT |
| `siege-engine-params.json` `unitsPerSiegeEngine` = 10 | liczba jednostek na machinę | DANE | LUKA | `6218f2ab1` | NOWY TEMAT |
| `forced-war-common.ts` `assignForcedWarPairings` (227–513 z rundy 1: NIE_ZMIERZONO) | pary wojen | LOGIKA | `war_*` | — | wpływ na oblężenie NIE_ZMIERZONO |
| `army-follow-auto-merge.ts` (nowy, 43 linii) | auto-łączenie armii podążającej | LOGIKA | LUKA (0 trafień wg rundy 1, potwierdzone w zarzutach) | — | NOWY TEMAT (ARMIA-AUTOMERGE) |
| `planned-march.ts:485` `plannedMarchesToSave` | zapis tras marszu | LOGIKA | `pathfinding.rs:2250` ISTNIEJE | — | przeniesione do #9 |

### Temat #8 — EKONOMIA-CERAMIKA-GARNCARSTWO

| Miejsce web | Co | Klasa | Rust | Commit | Status |
|---|---|---|---|---|---|
| `economy-upkeep.ts:688` `DEFAULT_BUILDING_RESOURCE_UPKEEP_RATIO = 1` (zastąpiło stałą 5/typ) | proporcja utrzymania | DANE | `turn_economy.rs:1675` = 5.0 | `956c9a6b7`, `c8ee037fb` | **DRYF LOGIKI (ZMIERZONO)** |
| `economy-upkeep.ts:716–748` `buildingResourceUpkeep` (`utrzymanie_surowce` stała ilość) | utrzymanie surowcowe | LOGIKA | `turn_economy.rs:1687–1700` | `b1a5c1e80` (ceramika 2/t, 4 budynki) | **DRYF LOGIKI (ZMIERZONO)** |
| `economy-upkeep.ts:662` `totalBuildingUpkeep` (674–808 z rundy 1: NIE_ZMIERZONO) | suma utrzymania | LOGIKA | `turn_economy_upkeep.rs` | `c8ee037fb` | nagłówek ZMIERZONO |
| `building-stock-cost.ts:421` `unitStockCost` | koszt zasobowy budowy | LOGIKA | `domain/building_costs.rs` | — | linia z rundy 1: NIE_ZMIERZONO |
| `economy.ts:1214` `corruptionRate` (rundy 1 `:1226–1243` błędne przesunięcie) · `KORUPCJA_REDUKCJA_NA_BUDYNEK=0.30`, `_SUFIT=0.60` | korupcja | LOGIKA+DANE | `domain/economy_city_fns.rs` | — | wartości 0,30/0,60 NIE_ZMIERZONO |
| `converters.ts:137` `CONVERTER_ERA_SCALING_PCT` 0.10 | przepustowość przetwórców | LOGIKA+DANE | `turn_economy_resources.rs:142` | — | ZGODNE (§1); NIE ma luki |
| `converters.ts:85` `DEFAULT_CONVERTER_RECIPES` (cegielnia `:86`, `throughputFallback: 50`, wyjście 2) | recepty | DANE | `turn_economy_resources.rs:54–62` | — | ZGODNE dla cegielni (§1); pozostałe recepty NIE_ZMIERZONO |
| `converters.ts` `converterThroughputForEra` (odlewnie × m(e)) | przepustowość odlewni | LOGIKA | `turn_economy_resources.rs:182–187` | `dc2292740` (odlewnia brązu wg epoki właściciela) | logika ZGODNA (§1) |
| `converters.ts:342` `converterProductionDisplayForBuilding` | wyświetlanie | UI | — | — | — |
| `production.ts:1036` `availableProduction` (1188, 2036 z rundy 1: NIE_ZMIERZONO) | produkcja | LOGIKA | `domain/improvement_build.rs` | — | NIE_ZMIERZONO |
| `ai-resource-needs.ts:93` `detectOwnerResourceNeeds` (rundy 1 `:104,136`: NIE_ZMIERZONO) | potrzeby surowcowe AI | LOGIKA | `domain/ai_zakup_jednostki.rs` | — | → #10 |
| `wonders.json`, `wonders-effects-text.ts` (Ha'amonga, FALA 597) | bonusy cudu | DANE+UI | `data/buildings_tech.rs` | — | NIE_ZMIERZONO |
| `tech.json` (42 linie diffu), `research.ts:21` (Garncarstwo) | koszt i podstawy | DANE+LOGIKA | `data/buildings_tech.rs` | — | rozmiar diffu, NIE lokalizacja |
| `building-cards-top5.json`, `tech-cards-top5.json` (≈2600 linii diffu) | karty | DANE/UI | brak (prezentacja) | — | rozmiar diffu |
| `buildings.json` (129 linii diffu) | koszty/utrzymanie | DANE | `data/buildings_tech.rs`, `building_costs.rs` | — | rozmiar diffu |
| `resources.json` (2 linie diffu, Ruda miedzi ×0) | surowiec | DANE/UI | `data/` | — | etykieta |
| `text-names.ts` (nowy, 99 linii) | etykiety surowców | UI | — | — | — |
| `terrain-improvements.json` (26), `terrain-yields.json` (2) | ulepszenia terenu | DANE | `domain/auto_improvements/` | — | poza #1–#10 |

### Temat #9 — ZAPIS-MIGRACJE-FALA509 (dodany w rundzie 2)

| Miejsce web | Co | Klasa | Rust | Commit | Status |
|---|---|---|---|---|---|
| `cities.ts:20` (`SiegeMachinesState` w `City`), `:866`, `:884` (pola miasta) | pola stanu oblężenia | DANE | `turn_economy_attrition.rs:126–127` `has_siege_machines` (tylko flaga; pełny stan NIE_ZMIERZONO) | `6218f2ab1` | zakres migracji = pola z `:866,884` |
| `planned-march.ts:485` `plannedMarchesToSave` (FALA 599 wg rundy 1, NIE_ZMIERZONO w git) | zapis tras marszu | LOGIKA/zapis | `pathfinding.rs:2250` `planned_marches_to_save`; `general_quick_follow.rs:191` | — | ISTNIEJE; zgodność formatu zapisu NIE_ZMIERZONO |
| `main.ts:1220` (import), `main.ts:36676` (użycie zapisu) | punkt zapisu | — | — | — | ZMIERZONO |

### Temat #10 — AI-ZAKUP-REALNY-STAN-DROGI

| Miejsce web | Co | Klasa | Rust | Commit | Status |
|---|---|---|---|---|---|
| `ai.ts:1928` `chooseCityProduction` (rundy 1 `:2410` BŁĘDNE) | wybór produkcji AI | LOGIKA | `domain/ai_turn.rs` | — | nagłówek ZMIERZONO |
| `ai.ts:2714–2820` `AI_IMPROVEMENT_FOR_DEFICIT` (zakres z rundy 1: NIE_ZMIERZONO) | ulepszenia AI | LOGIKA+DANE | `ai_turn.rs` / `auto_improvements/` | — | zakres NIE_ZMIERZONO |
| `ai.ts:3717–3723` `decideAITurnCore` | rdzeń tury AI | LOGIKA | `domain/ai_turn.rs` | — | rundy 1, NIE_ZMIERZONO |
| `ai-era-unit-promotion.ts:52` `promoteAiUnitForEra` (rundy 1 `:26–62` BŁĘDNE) | awans AI wg epoki | LOGIKA | `domain/ai_era_unit_promotion.rs` | `f4e1276fa`, `a70768498` | nagłówek ZMIERZONO |
| `ai-army-composition.ts` (nowy, 210 linii) | skład armii AI wg cywilizacji | LOGIKA | LUKA (0 trafień wg rundy 1) | `871762a74` | NOWY TEMAT (SKLAD-ARMII-AI) |
| `ai-unit-replace-plan.ts` (nowy, 92), `unit-replace-cost.ts` (94), `unit-replace-execute.ts` (85) | AI zamienia jednostki za pełny koszt | LOGIKA | LUKA (0 trafień wg rundy 1) | `a70768498`, `f4e1276fa`, `e5c81f15a`, `af2e1cefb`, `40db31f20` | NOWY TEMAT (ZASTAP-AI) |
| `empire-recruit-plan.ts:139` `executeEmpireRecruitment` (rundy 1 `:144–198` BŁĘDNE) | rekrutacja imperium | LOGIKA | `domain/ai_zakup_jednostki.rs` | — | nagłówek ZMIERZONO |
| `unit-power.ts:122,187` `fieldPower`, `armyFieldPower` | moc armii dla AI | LOGIKA | `combat.rs` / `ai_turn.rs` | `a259012fa` | → #6 |
| `farm-assign-hint.ts` (nowy, 289 linii wg rundy 1) | podpowiedź „Przydziel obywatela?” | UI+LOGIKA | nowy / UI | — | długość NIE_ZMIERZONO; temat UI |
| `armyMerge.ts:6,128` `coLocatedForMergePrompt` | prompt scalania | UI/LOGIKA | `domain/army_consolidation.rs` | — | NIE_ZMIERZONO |
| `livestock-unlock.ts:160–189` `STADNINA_HORSE_COST=50` | stadnina | DANE+LOGIKA | `domain/improvement_build.rs` | — | poza #1–#10 |
| `diplomacy-goods.ts:74–124` `tradableGoodsForOwner` | towary handlu | LOGIKA+UI | `domain/trade.rs` | — | poza #1–#10 |

### Pozostałe — poza kolejką #5–#10

| Miejsce web | Co | Klasa | Uwaga |
|---|---|---|---|
| `diplomacy.ts:161–237` `DIPLOMACY_PARAMS`, `:132` `przewagaMilitarna_respekt` 15, `SISTER_ALLIANCE_THRESHOLD_SCALE` | progi relacji, sojusz 130/90 | DANE+LOGIKA | ALLIANCE-THRESHOLD: NOWY temat lub część #5 (decyzja właściciela) |
| `diplomacy.ts:1195–1417` `aiDiplomacyStance`, `:1525–1539` `relationTier` | nastawienie AI | LOGIKA | NIE_ZMIERZONO zakres |
| `diplomacy.ts:1743–1799` `computeTickZaufanieDelta` | zaufanie | LOGIKA | NIE_ZMIERZONO zakres |
| `diplomacy-display.ts:330–717` | prezentacja | UI | FALA 588/592/593 |
| `diplomacy-locks.ts:13`, `diplomacy-treaties.ts:55`, `diplomacy-pn-engine.ts:96`, `diplomacy-factors.ts:111,188`, `diplomacy-cyclic-display.ts:1` | blokady, czynniki | LOGIKA/UI | NIE_ZMIERZONO linie |
| `diplomacy-proposals.ts:848` `treatyPnGate`, `:2471` `PendingNegotiation` | bramka PN | LOGIKA | NIE_ZMIERZONO linie |
| `forced-war-stone.ts:10,19` | wojna Kamienia | LOGIKA | `WOJNA_KAMIEN_WYMUSZONA_START_TURY` = `eraForcedWarStartTurnsFromEra.stone` (40, ZMIERZONO) |
| `turn-economy.ts:2325` `advanceCityEconomy` (rundy 1 `85–2988`: zakres obejmuje cały moduł, NIE lokalizacja) | pipeline ekonomii | LOGIKA | nagłówek ZMIERZONO |
| `fog-reveal-key-f.ts:1` (nowy), `ui-params.json` `fog_reveal_key_f` | klawisz F | UI | poza kolejką |
| `ai-params.json` (+230 linii diffu) | parametry AI (RES310 10/3/0) | DANE | dług REPIN ai-params |
| `civ-music.json` (16 linii) | muzyka | UI | — |
| `unit-card-stats.ts:36–66`, `:126` | karta | UI | — |

## 3. Wektory do regeneracji `meta.pin` (runda 2)

Pole `pin` występuje w plikach (ZMIERZONO: `git grep -l '"pin"' … rust-port/engine/tests rust-port/engine/data`). Przypisanie pliku do tematu to KANDYDAT (dopasowanie po nazwie pliku/testu); faktyczne `meta.pin` do regeneracji ustala się przy REPIN danego tematu i NIE_ZMIERZONO w tej rundzie.

- #8 (ekonomia, utrzymanie, przetwórcy): `rust-port/engine/tests/fixtures/economy_city_vectors_91dc998a.json`, `…_r3_91dc998a.json`, `…_r4_91dc998a.json`; `rust-port/engine/tests/p6_5b_vectors/buildings.json`, `…/manpower.json`.
- #9 (zapis, marsz): `rust-port/engine/tests/p6_4_vectors/march.json`, `…/rally.json`, `…/scout.json`.
- #5 (rozejm, pokój): `rust-port/engine/tests/p6_7b_vectors/gate.json` (kandydat do bramki dyplomacji; NIE_ZMIERZONO zawartość).
- #6 / #7 (walka, oblężenie): testy `.rs` z trafieniami na `rozejm|truce|ranged|bez_wylom|oblez` (ZMIERZONO): `rust-port/engine/tests/data_units_combat.rs`, `derived_values.rs`, `data_compliance.rs`, `ai_turn.rs`.
- #10 (AI): `rust-port/engine/tests/ai_turn.rs`.
- Dane źródłowe do porównania przy regeneracji: `rust-port/engine/data/derived/diplomacy-war-peace-params.json` (brak `przewagaMilitarna`/`pokojAiAi`, §1), `rust-port/engine/data/diplomacy-acceptance-points.json` (151 vs 130).

## 4. Nowe tematy wynikające z pomiaru (propozycje, bez decyzji właściciela)

1. R-RUSTPORT-REPIN-MASZYNY-OBLEZNICZE-Q1 — `siegeMachines.ts:29`, `siege-engine-build.ts`, `unitsPerSiegeEngine` (LUKA ZMIERZONO).
2. R-RUSTPORT-REPIN-SKLAD-ARMII-AI-Q1 — `ai-army-composition.ts` (LUKA ZMIERZONO).
3. R-RUSTPORT-REPIN-ZASTAP-AI-Q1 — `ai-unit-replace-plan.ts`, `unit-replace-cost.ts`, `unit-replace-execute.ts` (LUKA wg rundy 1).
4. R-RUSTPORT-REPIN-ARMIA-AUTOMERGE-Q1 — `army-follow-auto-merge.ts` (LUKA wg rundy 1).
5. R-RUSTPORT-REPIN-ERA-WAR-40-Q1 — DRYF ZMIERZONY: web 40, Rust 20 (`diplomacy_multiwar_gate.rs:58,60`). Propozycja: wchodzi w #5 albo osobny temat, decyzja właściciela.
6. R-RUSTPORT-REPIN-ALLIANCE-130-90-Q1 — DRYF ZMIERZONY 151 vs 130; decyzja: #5 czy osobno.

Usunięte z listy rundy 1: `R-RUSTPORT-REPIN-PRZETWORNIKI-EPOKA-Q1` (BŁĄD: port ISTNIEJE — `converter_throughputs_for_era`, `turn_economy_resources.rs:351`; zgodne stałe, §1) oraz temat planowanych marszy (port ISTNIEJE — `planned_marches_to_save`, `pathfinding.rs:2250`).

## 5. Ograniczenia pomiaru (runda 2)

- Nie uruchomiono cargo, testów ani buildu (zakaz dispatchu). Wartości z JSON/Rust porównano grepem i odczytem linii, nie wykonaniem.
- ZMIERZONE w rundzie 2: §1 (wszystkie wiersze), nagłówki funkcji z §2 oznaczone „nagłówek ZMIERZONO”, długości nowych plików (`siege-engine-build` 109, `ai-army-composition` 210, `army-follow-auto-merge` 43, `ai-unit-replace-plan` 92, `diplomacy-peace-proposal-timing` 10).
- NIE_ZMIERZONO: semantyka pozostałych hunków (206 w `gra/src/game`), zakresy funkcji oznaczone w §2, mapowanie hunk→commit poza wierszami z kolumną „Commit”, pełny zbiór 6 id odlewni w Rust, wartości korupcji 0,30/0,60 i recept poza cegielnią.
- Dług z rundy 1 do rozliczenia przez Evaluatora: wiersze z FALA 547, 504+, 505+/531, 585/587 zostały zachowane jako „NIE_ZMIERZONO” zamiast weryfikacji.
