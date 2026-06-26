# Analiza modułu game/ — logika gry

**Data:** 2026-06-26  
**Zakres:** gra/src/game/ (23 pliki .ts)

## Podsumowanie

Przeanalizowano **23 pliki `.ts`** w `C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ\gra\src\game\` (pominięto ~36 plików `.bak-*`, `.tmp`, `.dehydrated-bak`). Wszystkie moduły deklarują się jako **pure / deterministic / DOM-free / THREE-free** i potwierdzają to w kodzie — brak efektów ubocznych, immutabilne transformacje, bezpieczne fallbacki.

**Pokrycie domen:**
- **Ekonomia** — pełne (`economy`, `turn-economy`, `economy-upkeep`, `wealth`, `converters`, `production`, `okolica`) ~85%
- **AI** — `ai.ts` (komendy tury + reakcje + posiłki + dyplomacja AI) ~80%; `barbarians.ts` ~85%
- **Dyplomacja** — `diplomacy.ts` (Zaufanie+Respekt, eventy, stance, potęga nacji) ~85%
- **Combat** — `combat.ts` (SS5l) ~90%; `siege.ts` ~85%
- **Research** — `research.ts` (A4) ~90%; `playerState.ts` (banking + auto-research) ~75% (błąd typu)
- **Culture + Religion** — `culture-religion.ts` ~80% (NIE wpięte w turn-loop)
- **Cities** — `cities.ts` ~75% (rzadki runtime City)
- **Order/Porządek** — `order.ts` ~80% (NIE wpięte w turn-loop)
- **Inne** — `victory`, `visibility`, `save`, `tech-tempo`, `auto-manage` — gotowe

**Najważniejsze luki / zagrożenia:**
1. **Błąd typu w `playerState.ts`**: pole `playerResearchTargetId` jest odczytywane/zapisywane (linie 234–339) oraz inicjowane w `createPlayerState()` (94), ale **nie jest zadeklarowane w interfejsie `PlayerState`** (linie 60–85). To TypeScript error — kod się nie skompiluje przy `strict`. Luka: krytyczna.
2. **Duplikat**: `ai_research_tmp.ts` to wczesna wersja `ai.ts` (krótsza, bez dyplomacji/reakcji/posiłków, bez `unitActed`/idle-fallback, bez `pkt3` cluster bias, bez `pkt5` budget gate). Prawdopodobnie artefakt migracji — do usunięcia.
3. **Wpięcie w turn-loop**: `order.ts`, `culture-religion.ts`, `siege.ts` są celowo **nie integrowane** (komentarze w plikach) — czekają na master/SILNIK. `turn-economy.ts` woła `economy`+`wealth`+`converters`+`upkeep`, ale NIE order/culture/religion.
4. **Runtime City jest rzadki** (`cities.ts`: id, ownerId, q, r, name, population, +opcjonalne maMur/oblegane/garnizon) — ekonomia używa własnego `EconomyCity`, siege `SiegeCity`, culture `CultureCity`, religion `ReligionState`. Mapowanie leży po stronie SILNIK-a.
5. **Surowce / magazyny**: `economy-upkeep` ma pełną logikę magazynów, ale `turn-economy` wywołuje `runConverters` z **pustym** `citySurowce` (pole nie istnieje w runtime City) — konwertery są no-opem.
6. **Korupcja**: `corruptionRate` istnieje w `economy.ts`, ale `turn-economy` zawsze przekazuje `strataFraction: 0` (brak dystansu od stolicy w runtime).
7. **Spichlerz/Akwedukt/Mlyn/Cegielnia...** flags w `turn-economy` są czytane z `builtByCity`, ale `maSpichlerz`/`maAkwedukt` w `toEconomyCity` są **hardcoded false** (komentarz: "no spichlerz tracking yet") — wzrost populacji działa bez Spichlerza.
8. **`research.ts` vs `playerState.ts`**: dwa równoległe modele badań — `research.ts` (A4, per-player `ResearchState`) oraz `playerState.ts` (`PlayerState.zbadane`/`badana`/`nauka` banking). API `research.ts` jest czystsze; `playerState` jest faktycznie używane przez main.ts.

---

## Analiza per-plik

### `ai.ts` (~1582 linie) — **80%**
- **Cel**: Decyzje AI na turę (komendy), reakcje bojowe (fight/flee), posiłki, dyplomacja AI.
- **Eksporty**: `AICommand` (union move/foundCity/attack/build/endTurn), `AITurnOpts`, `DifficultyParams`, `loadDifficultyParams`, `chooseAIResearch`, `decideAITurn`, `ReakcjaAI`/`decideAIReaction`, `PosilekKandydat`/`decideAIReinforcements`, `AIDiplomacyCommand`/`DiplomacjaInputs`/`decideAIDiplomacy`, progi `PROG_*`.
- **Zależności**: `../types/map`, `../types/hex` (Nakladka), `../data/loader`, `../units/setup` (hexDistance, computePath, keyOf), `./cities` (canFoundCity, City), `./diplomacy` (aiDiplomacyStance, relationScore, DIPLOMACY_PARAMS, Relation, AIDiplomacyContext).
- **Logika**: archetype mods (grecy/rzym/chiny/zulusi/inkowie/egipt/sumer/celtowie/germanie) z `ai-params.json`; poziom trudności 1/2/3 (bonusy + spryt: agresjaMnoznik, dyplomacjaAktywnosc, celObranie); produkcja (§4 early/mid + underThreat + pkt5 budget gate canAfford/itemCost score/cost ratio); ruch (4b attack adjacent, 4c march na enemy city z celObranie weak-target bias, 4d village exploration, 4e patrol, 4f idle-fallback); reakcja fight/flee (PROG_BITWA, terytoriumMnoznik, precious unit, peace override); posiłki (TARGET=1.2×silaGracza, cheapest-first); dyplomacja (7 priorytetów: trybut_za_pokoj, pokoj, trybut, wojna, sojusz, handel, brak).
- **Luki**: brak wieloturowych sojuszy/handlu v0.2 (TODO w komentarzach); `unitActed` zbierane ale `void unitActed` (nieużywane); `stubAIPlayer`/`stubOtherPlayer` w `decideAIDiplomacy` hardcoded 'grecy'/'rzym' (silnik v0.2 ma podać pełny Player); brak obsługi super-jednostek poza sortowaniem; brak naval logic.

### `economy.ts` (~673 linie) — **90%**
- **Cel**: Czysta ekonomia miasta — plony terenu, budynki, wzrost populacji, postęp produkcji, korupcja.
- **Eksporty**: `EconParams`, `loadEconParams`, `TileYield`/`WorkedTile`, `EconomyCity`, `CityYieldResult`/`PopulationGrowthResult`/`ProductionProgressResult`, `tileYield`, `buildingValue`, `cityYieldPerTurn`, `populationGrowth`, `productionProgress`, `corruptionRate`, `BuildingRecord`, `BuildingYieldKey`.
- **Zależności**: `../types/hex` (TerenBazowy, Nakladka), `./production` (buildingEffectAtLevel, BUILDING_LEVEL_FACTOR).
- **Logika**: pełny pipeline 10 kroków (teren→Mlyn/Cegielnia→Targowisko→budynki base→mnoznik%→korupcja→Waluta x2→suwak Handel Nauka/Pieniadz/Luksus→Mennica/Biblioteka→Poborca + Efekt 2 Praca→Pieniadz→net food); wzrost (Spichlerz threshold=10+pop×coeff, Akwedukt cap, zdrowie modifier); compound scaling `baza×1.10^(level-1)`.
- **Luki**: `loadEconParams` czyta ASCII `próg_wzrostu_wspolczynnik` ale JSON ma diakrytyk — `turn-economy` omija to własnym `buildEconParams`; `korupcjaCap` czytane jako `/100` (asumuje procent w JSON); brak specialist 'uczony'/'artysta' (tylko poborca +2 Pieniadz).

### `diplomacy.ts` (~968 linie) — **85%**
- **Cel**: Model dyplomacji — Relacja = Zaufanie (0-100) + Respekt (0-100), eventy, AI stance, potęga nacji.
- **Eksporty**: `Relation`, `DIPLOMACY_PARAMS`, `DiplomacyParams`, `loadDiplomacyParams`, `relationScore`, `DiplomaticEvent`, `applyDiplomaticEvent`, `AIDiplomacyContext`/`AIDiplomacyStance`, `ARCHETYPE_AGGRESSION`, `aiDiplomacyStance`, `initialRelation`, `toRelation`, `TIER_NAMES`/`relationTier`, `PotegaKomponenty`/`PotegaWagi`/`DEFAULT_POTEGA_WAGI`/`computePotegaNacji`, `computeRespekt`, `TickCtx`/`tickDiplomacy`.
- **Zależności**: `../types/diplomacy` (RelacjaDyplomatyczna, StanWojny), `../types/player` (TypCywilizacji, Player).
- **Logika**: ~20 eventów (wojna/pokoj/handel/zdrada/dar/wygrana_bitwa/trybut/ultimatum/casus_belli/zerwanie_handlu...); stance (willingnessWar/Peace/Trade/Ally) z archetype aggression/trade + loyalty bonus (Chinczycy/Inkowie/Grecy/Zulusi); minor civ (§5.2); Respekt = ratio-share `100×self/(self+partner)` (V1 z SPEC-Respekt.md); tick per-tura (handel+1, pakt+1, religia±0.5, ekspansja-2, urazy co 20 tur zanik, wygasanie traktatów).
- **Luki**: TODO akumulatory per-religia cap +15/-10; `otherPlayer` w `aiDiplomacyStance` `void` (nieużywane); brak wasalizacji/wchłonięcia engine-side (progi zdefiniowane, ale brak funkcji wykonującej).

### `combat.ts` (~726 linie) — **90%**
- **Cel**: Kanoniczny resolver walki SS5l (auto-resolve), 2 jednostki.
- **Eksporty**: `CounterEntry`/`TerrainEntry`, `CombatUnit`, `ResolveCombatOpts`, `CombatResult`, `hitChance`, `baseDamage`, `rangeDamage`, `counterMultiplier`, `flankRearDefensePenalty`, `normTerrain`, `terrainDefenseMultiplier`, `terrainRiverAttackMultiplier`, `resolveCombat`.
- **Zależności**: brak (self-contained, ASCII-only).
- **Logika**: faza dystansowa (ammo, rangeDamage=max(1,AtakDyst-Pancerz)), faza zwarcia R1 szarza (+Uderzenie, negowane przez spear/phalanx bracing), R2+ symultaniczne; hitChance=clamp(50+(Atak-Obrona)×5,10,90); counterMultiplier ×1.5 (status 'potwierdzone'); flank/rear penalty; teren (Las +50% vs Dystans/Flanka, Wzgorza ×1.5, Gory ×1.75, rzeka ×0.75 Atak); structureDefBonusPct (mur +200%, fort +100%, posterunek +50%); rout (Prog dezercji % Health, unbreakable).
- **Luki**: brak stack combat (1v1 tylko); brak retret/withdraw poza rout; `negatesCharge` hardcoded substring ('wlocznik'/'falanga'/'impi') — should be data-driven; brak morale globalnego.

### `siege.ts` (~758 linie) — **85%**
- **Cel**: Oblężenie miasta — bonus obrony (mury+teren+fortify), milicja (SS9c), atak na garnizon, capture.
- **Eksporty**: stałe (WALL_BASE_OBRONA, HILL_DEFENSE_MULT, MILITIA_POP_FRACTION...), `SiegeUnit`, `SiegeCity`, `SiegeParams`, `wallParamsFromBuildings`, `hitChance`/`baseDamage` (lokalne duplikaty combat.ts), `CityDefenseBonus`/`cityDefenseBonus`, `terrainDefenseMult`, `applyCityBonus`, `makeMilitia`/`effectiveGarrison`, `resolveSiegeAttack`, `canCaptureCity`/`captureCity`/`canEnemyCapture`, `hexDistanceAxial`.
- **Zależności**: `./production` (buildingEffectAtLevel) — **NIE** importuje combat.ts (celowo, "concurrent session").
- **Logika**: mury compound `wallBase×1.10^(level-1)` + 50% do Pancerz; fortify +2; teren (wzgorza ×1.5, gory ×1.75); milicja = 20% pop, siła ½ Wojownika Kamienia, unbreakable; resolveSiegeAttack (ATK vs top defender z bonusami, symetryczna wymiana, maxRounds=30); capture gdy garnizon pusty (milicja nie liczy się jako standing garrison).
- **Luki**: duplikacja SS5l formuł względem combat.ts (ryzyko rozjechania); brak wpięcia w turn-loop; brak multi-attacker; brak surrender/blockade mechanic poza `city.oblegane` we `turn-economy`.

### `research.ts` (~400 linii) — **90%**
- **Cel**: Badania A4 — wybór tech, akumulacja Nauki, ukończenie → unlocki.
- **Eksporty**: `ResearchTechDef`/`ResearchBuildingDef`/`ResearchUnitDef`, `ResearchState`, `AdvanceResult`, `TechUnlocks`, `parsePrerequisites`/`prerequisitesOf`, `findTech`, `techCost`/`techCostById`, `availableTechs`/`canResearch`, `createResearchState`, `startResearch`, `advanceResearch`, `researchProgressFraction`, `turnsToComplete`, `unlocksFor`/`allUnlocked`.
- **Zależności**: brak (self-contained, minimalne typy lokalne).
- **Logika**: prereq parser ("A + B", em-dash); cost fallback (10 + (Poziom-1)×4 + era×8); pure state transitions (start resetuje postep przy zmianie, advance dodaje Nauka, overflow discarded); unlocki po nazwie tech (buildings.techUnlock, units.Tech).
- **Luki**: overflow Nauki odrzucany (gracz musi wybrać następny tech explicit); brak równoległego researchu; brak kosztu w Pieniądzu (tylko Nauka); API konkuruje z `playerState.ts`.

### `culture-religion.ts` (~996 linii) — **80%**
- **Cel**: Kultura (rozszerzenie granic + zadowolenie + konwersja podbitych) + Religia (dominacja, szerzenie, konwersja świątynią, mnożnik handlu).
- **Eksporty**: `CultureParams`/`FALLBACK_CULTURE_PARAMS`/`loadCultureParams`/`cultureThresholds`, `CultureCity`, `cityBorderRadius`/`accumulateCulture`/`cultureHappiness`, `CultureBuildings`/`convertCulture`, `ReligionParams`/`FALLBACK_RELIGION_PARAMS`/`loadReligionParams`, `civReligion`/`isKnownCiv`, `ReligionState`/`DominantReligionResult`/`dominantReligion`, `religionHappiness`, `makeRng` (mulberry32), `ReligionNeighbor`/`spreadReligion`, `convertViaTemple`, `cityTradeMultiplier`/`FALLBACK_TRADE_MULT`/`TradeMultResult`.
- **Zależności**: brak (ZERO importów, własne interfejsy `CultureCity`/`ReligionState`/`CivsDataLike`/`SocietyParamsLike`).
- **Logika**: kultura threshold 100/250/500 → 3 ringi; happiness 5-band (100%/75%/50%/<50%/<25%); konwersja baza+świątynia+amfiteatr+biblioteka, cap; religia dominacja >50%, szerzenie base+świątynia slots, deterministic LCG jitter; konwersja świątynią (donor largest-first); mnożnik handlu civs.json `mnoznikHandelPieniadz` gated (Waluta+Mennica + dominująca religia właściciela).
- **Luki**: **NIE wpięte w turn-loop** (komentarz explicit); brak akumulatorów cap per-religia; `SocietyParamsLike` ręcznie mirroruje JSON; `CivsDataLike` wymaga `Religia` + `mnoznikHandelPieniadz` w civs.json (may be missing).

### `production.ts` (~677 linii) — **85%**
- **Cel**: Kolejka produkcji miasta (budynki za Pracę, jednostki za Pieniądz), split outputu.
- **Eksporty**: `ProductionKind`/`ProductionItem`/`CityProduction`/`ProductionData`, `EPOCH_BY_NAME`/`epochNumber`, `BUILDING_LEVEL_FACTOR`/`buildingLevelForEpoch`/`buildingEffectAtLevel`, `DEFAULT_UNIT_COST`/`itemCost`, `buildingProductionItem`/`unitProductionItem`, `availableProduction`/`buildableProduction`/`purchasableUnits`, `frontItem`/`enqueue`/`dequeue`, `advanceProduction`, `UNIT_POPULATION_COST`/`populationCostOf`, `setPaused`/`rushCost`/`rushProduction`, `splitPraca`, `unitCostMode`/`unitPurchaseCost`, `OutputShares`/`OutputSplit`/`DEFAULT_OUTPUT_SHARES`/`splitOutput`/`cityScienceOutput`/`cityMoneyOutput`.
- **Zależności**: `../data/loader` (typy), `./cities` (City), `../../data/miasto-params.json`.
- **Logika**: compound `kosztBudowy×1.10^(level-1)`; jednostki zawsze Pieniądz (decyzja 2026-06-25, wyjątek Kamień usunięty); Koszary gate dla epoki Brązu; queue immutable (enqueue/dequeue/advance, 1 ukończenie/ture, carry remainder); Wstrzymaj; Wykup (rushCost=ceil(koszt-postep)); splitPraca (doBudynkow/doPuli); splitOutput 4 strumienie (produkcja/pieniadz/nauka/rozwoj, ostatni bierze resztę).
- **Luki**: `unitCostMode` zawsze 'pieniadz' (`_def` ignored); brak coastal-only gating (param `city` `void`); brak wonder construction; brak pop-cost dla budynków (0) — jednostki kosztują 1 citizena.

### `turn-economy.ts` (~761 linii) — **80%**
- **Cel**: Adapter per-tura — runtime City → EconomyCity, uruchom ekonomię, wzrost, Wealth, splitPraca, obleżenie, upkeep balance.
- **Eksporty**: `Difficulty`, `buildEconParams`, `workedTilesForCity` (deprecated), `cityWorkedTilesForEconomy`, `toEconomyCity`, `getCityFood`, `CityEconomyTick`/`EconomyTickResult`/`EconUnit`, `advanceCityEconomy`.
- **Zależności**: `../types/map`, `../types/hex`, `../data/loader`, `./cities`, `./economy`, `./economy-upkeep`, `./converters`, `./production`, `./wealth`, `./okolica`.
- **Logika**: WIRE 1 zdrowie (rzeka/akwedukt/studnia/targowisko/ceramika + maleMiastoBonus, karaZagoszczenie, karaBrakWody) z society-params; model przypisanych pól (centrum + N najlepszych, N=pop, radius=cityRangeForPopulation); Wealth tick per miasto (luksus→pula→poziom→mnożnik na pieniądz); splitPraca; WIRE 4 obleżenie (brak dochodu z pól, magazyn -(pop+garnizon), brak wzrostu); upkeep balance per owner.
- **Luki**: `maSpichlerz`/`maAkwedukt` hardcoded false w `toEconomyCity` (komentarz "no tracking yet"); `strataFraction: 0` (brak korupcji); `mennicaMnoznik: 1` hardcoded (nie czyta z params); `(city as any).wealthState` — dynamiczne pole; `builtByCity` opcjonalne (puste → brak bonusów budynków); `econUnits` puste domyślnie (brak military food); NIE woła order/culture/religion.

### `economy-upkeep.ts` (~545 linii) — **90%**
- **Cel**: Magazyny (s.7) + utrzymanie (s.6): pojemność, overflow, building/unit upkeep, military food, saldo.
- **Eksporty**: `StorageParams`/`DEFAULT_STORAGE_PARAMS`/`loadStorageParams`, `foodStorageCapacity`/`resourceStorageCapacityPerType`, `ClampResult`/`clampStore`, `CityStores`/`emptyCityStores`/`applyFood`/`applyResourceIntake`, `globalResourceCapacityPerType`, `onCityLost`/`onCityConquered`, `UpkeepParams`/`DEFAULT_UPKEEP_PARAMS`/`loadUpkeepParams`, `buildingUpkeep`/`totalBuildingUpkeep`, `DEFAULT_UNIT_UPKEEP_BY_CATEGORY`/`UnitUpkeepTable`/`buildUnitUpkeepTable`/`unitUpkeep`/`totalUnitUpkeep`, `militaryFoodConsumption`, `UpkeepBalance`/`upkeepBalance`.
- **Zależności**: `./economy` (typ BuildingRecord), `./production` (buildingEffectAtLevel).
- **Logika**: Spichlerz ×5 (baza 20), Magazyn ×5 (baza 10/type); clampStore (overflow lost); onCityConquered (merge + clamp); building upkeep compound `utrzymanie×1.10^(level-1)` lub flat override; unit upkeep (table typeId → category fallback → standard); military food (1 marsz/garnizon, 0.5 oboz); saldo = income - upkeep, deficyt flag.
- **Luki**: komentarz "player-economy.ts duplicates upkeep — orphan, imported nowhere" (do konsolidacji); `budynekUtrzymanieFlat` z JSON nadpisuje per-building (v0.1 "niezróżnicowany"); brak bankruptcy penalty (tylko flaga).

### `wealth.ts` (~214 linii) — **85%**
- **Cel**: System Wealth — luksus → pula → poziom → mnożnik podatku + zadowolenie.
- **Eksporty**: `WealthParams`/`FALLBACK_WEALTH_PARAMS`/`loadWealthParams`, `wealthCap`/`wealthMnoznik`/`wealthZadowolenie`/`wealthRownowaga`/`wealthProg`, `WealthState`/`WealthTickResult`/`advanceWealth`/`freshWealthState`.
- **Zależności**: brak (ZERO importów).
- **Logika**: cap=epoka×10; mnożnik=1+(W-1)×0.15 (min ×1); równowaga utrzymania 20%→40% (baza→cap); prog awansu=4.5×(L+1)×epoka; decay=rownowaga×miastoMoney; awans dopóki pula≥prog, po awansie pula×0.5; spadek -1 gdy pula<0; zadowolenie floor(W/10)×1, kara -2 przy W=0.
- **Luki**: `WealthState` persystowane na `(city as any).wealthState` (brak w interfejsie City); brak UI do ustawienia udziału spoleczenstwa; cap akumulatorów religii TODO.

### `cities.ts` (~203 linie) — **75%**
- **Cel**: Zakładanie miast — walidacja, tworzenie, nazwy, konwersja wioski.
- **Eksporty**: `City`, `MIN_CITY_DISTANCE`, `canFoundCity`/`foundCity`/`foundCityAt`, `cityName`, `FoundFromVillageOpts`/`FoundFromVillageResult`/`foundCityFromVillage`.
- **Zależności**: `../types/map`, `../types/hex` (TerenBazowy), `../units/setup` (hexDistance), `../../data/miasto-params.json`.
- **Logika**: canFoundCity (poza mapą/morze/wybrzeże/góry/za blisko <MIN_CITY_DISTANCE/poza terytorium); foundCity/foundCityAt (id='city'+length, pop=1); 12 nazw miast (Akropol, Memfis, Ur...); foundCityFromVillage (ready-to-wire, ADDYTYWNE, ownerId=0 placeholder).
- **Luki**: runtime City bardzo rzadki (id, ownerId, q, r, name, population + opcjonalne maMur/oblegane/garnizon) — ekonomia/siege/culture mają własne interfejsy; brak razing/razing; brak capital flag w runtime; `foundCityFromVillage` NIE usuwa wioski (MAPA musi).

### `order.ts` (~441 linii) — **80%**
- **Cel**: Porządek = Szczęście + Prawo, progi T1/T2, efekty multipliers + revolt risk.
- **Eksporty**: `OrderTier`/`OrderInputs`/`OrderParams`/`OrderEffects`/`FALLBACK_ORDER_PARAMS`/`loadOrderParams`/`computeOrder`/`orderTier`/`orderEffects`/`evaluateOrder`/`OrderResult`, `HappinessBreakdown`/`happinessBreakdown`.
- **Zależności**: brak (self-contained, ASCII).
- **Logika**: Order=round(0.5×szczescie+0.5×prawo); tier unrest(<T1)/neutral(T1..T2)/order(≥T2); efekty (productionMult, growthMult, tradeMult, revoltRisk); happinessBreakdown (3 grupy, skala 20, suma==pop).
- **Luki**: **NIE wpięte w turn-loop** (komentarz); `prawo` input = 0 dopóki Law subsystem nie istnieje; `growthMult` przekazywany do `turn-economy` przez `growthMultByCity` (jedyne wire); brak realnego revolt resolvera (tylko risk probability).

### `playerState.ts` (~357 linii) — **75%** (BŁĄD KOMPILACJI)
- **Cel**: Globalny stan gracza + auto-research + UI hooks (setPlayerResearchTarget/getResearchState).
- **Eksporty**: `PIENIADZ_MNOZNIK`, `PlayerState`, `createPlayerState`, `techCost`/`parsePrereqs`/`prereqsMet`/`availableTechs`/`cheapestAvailable`/`isEraAdvanceTech`/`isMoneyTech`, `ResearchCompletion`/`ResearchStepResult`/`researchStep`, `ResearchStateInfo`/`setPlayerResearchTarget`/`getResearchState`.
- **Zależności**: `../data/loader` (TechDef, CivBonus), `./tech-tempo` (applyTempoKoszt, TempoGry).
- **Logika**: banking (skarbiec += totalPieniadz, nauka += totalNauka); researchStep (priority: playerResearchTargetId → badana → first available; while nauka≥cost: complete, era bump, pieniadz x10, pick next); isEraAdvanceTech (regex /epok/i), isMoneyTech ('waluta' lub /pieniądz/i).
- **Luki**: **KRYTYCZNE**: `playerResearchTargetId` używane (linie 234-339) i inicjowane w `createPlayerState` (94), ale **BRAK w interfejsie `PlayerState`** (60-85) — TypeScript strict error. Konkuruje z `research.ts` API. `tempoGry` w interfejsie ale domyślnie 'standardowa'. `civBonusy` attachowane ale "realizacja po stronie właściwych systemów" (brak).

### `tech-tempo.ts` (~40 linii) — **100%**
- **Cel**: Mnożnik tempa gry (szybka 0.2× / standardowa 1.0× / dluga 5.0×).
- **Eksporty**: `TEMPO_GRY`, `TempoGry`, `applyTempoKoszt`.
- **Zależności**: brak.
- **Logika**: `Math.max(1, Math.round(bazowyKoszt × mnoznik))`.
- **Luki**: brak — kompletny, minimalny.

### `auto-manage.ts` (~181 linii) — **80%**
- **Cel**: Zarządca automatyczny — auto-pol, auto-produkcja, auto-split Pracy.
- **Eksporty**: `AutoManageInput`/`AutoManageDecision`/`autoManageCity`.
- **Zależności**: `./cities`, `../types/map`, `./okolica`, `./production`.
- **Logika**: assignWorkedTiles (N najlepszych); auto-produkcja gdy kolejka pusta (priorytet kategoria: Zywnosc>Produkcja>Nauka>Pieniadz>Wojsko>Obrona>Kultura>Zdrowie, tie-break cost asc); splitPraca (domysł 70/30).
- **Luki**: flaga włączenia zewnętrzna (NIE w module); brak unit purchasing w auto; `priorityForItem` hardcoded kategorie; brak reakcji na threat.

### `okolica.ts` (~100 linii) — **90%**
- **Cel**: Wybór obrabianych pól (Civ VII styl) — N najlepszych w promieniu.
- **Eksporty**: `OKOLICA_RADIUS`, `cityRangeForPopulation`, `TileYield`/`OkolicaTile`, `okolicaTiles`, `tileScore`, `AssignOptions`/`assignWorkedTiles`.
- **Zależności**: `../types/map`, `../units/setup` (hexDistance), `../../data/miasto-params.json`.
- **Logika**: radius=min(pop, cap=15); sort score desc → dist asc → key alfabetycznie; clamp do dostępnych.
- **Luki**: `OKOLICA_RADIUS` (5) exportowane ale nieużywane (cityRangeForPopulation używa `zasieg_okolicy_max`=15); legacy schodkowy usunięty.

### `save.ts` (~365 linii) — **90%**
- **Cel**: Save/Load — JSON snapshot + localStorage slots.
- **Eksporty**: `SAVE_VERSION`/`SAVE_PREFIX`, `SaveGame`, `serializeGame`/`deserializeGame`, `saveToLocal`/`loadFromLocal`/`listSaves`/`deleteLocal`.
- **Zależności**: `../units/setup` (RuntimeUnit), `./cities` (City).
- **Logika**: wersja 1; set-aware replacer (Set→array); walidacja wersji (odrzuca nowsze); browser-safe (localStorage guard); pola: tura, seed, units, cities, explored[], gracz?, cityProd/cityBuilt/aiResearchDone/diploRelations (P6), meta.
- **Luki**: `gracz: any` (loose typing); brak migracji starych wersji; mapa regenerowana z seed (nie persistowana); brak checksum/integrity.

### `converters.ts` (~214 linii) — **85%**
- **Cel**: Budynki przetwórcze (Tartak/Mielerz/Cegielnia/Huta/Garncarnia) — surowce 1:1 do przepustowości.
- **Eksporty**: `Difficulty`/`RawConverterParamsJson`/`loadThroughput`, `ConverterRecipe`/`DEFAULT_CONVERTER_RECIPES`, `ConverterReason`/`ConvertResult`/`runConverter`, `RunConvertersResult`/`runConverters`.
- **Zależności**: brak (ZERO importów runtime).
- **Logika**: cykle=min(przepustowosc, limitWejscia, wolneMiejsceWyjscia); reason (ok/brak-wejscia/pelny-magazyn/zero-przepustowosci); łańcuch (Mielerz przed Huta — paliwo).
- **Luki**: klucze ASCII (drewno/deski/paliwo/glina/cegla/ruda/braz/ceramika) — integrator mapuje na resources.json (diakrytyki "Cegla"/"Braz"); w `turn-economy` uruchamiane z pustym `citySurowce` (no-op); brak partial fractional (floor).

### `barbarians.ts` (~562 linie) — **85%**
- **Cel**: Neutralna wroga frakcja — obozy, spawn, agresja, retret.
- **Eksporty**: `BARBARIAN_OWNER_ID`/`isBarbarian`, `BarbCamp`/`BarbUnit`/`BarbSpawn`, `BarbCommand`/`BarbCmdMove`/`BarbCmdAttack`, `BarbParams`/`FALLBACK_BARB_PARAMS`/`loadBarbParams`/`barbariansActive`, `CityLike`, `spawnCamps`/`tickCamps`/`decideBarbarianMoves`.
- **Zależności**: `../types/map`, `../data/loader`, `../types/hex` (TerenBazowy), `../units/setup` (hexDistance, computePath, keyOf).
- **Logika**: ownerId=-1; camp (maxCamps=6, minDistFromCity=5, campSpacing=6, spawnInterval=6, unitsPerCamp=2, aggroRadius=6, retreatHpFrac=0.3); spawn (Fisher-Yates LCG seeded); tick (cooldown, cap, freeAdjacentHex ring1/ring2); moves (retret gdy low HP, attack adjacent, chase w aggroRadius, idle drift do camp).
- **Luki**: brak naval barbarians; `BarbUnit.healthFrac` opcjonalne (runtime nie trackuje HP — always advances); brak camp raid reward; param keys `barbarzyncy_*` muszą być dodane do AI-parametry.xlsx (fallback obowiązuje).

### `victory.ts` (~224 linie) — **90%**
- **Cel**: Warunki zwycięstwa/porażki (par. 8d).
- **Eksporty**: `VictoryPlayer`/`VictoryInput`/`VictoryResult`, `playersOfType`/`citiesOf`/`isEliminated`/`checkVictory`.
- **Zależności**: `./cities` (City).
- **Logika**: dominacja (wszyscy rywale własnego typu wyeliminowani = 0 miast); przegrana (0 miast + 0 osadników); nauka (epokaKoncowa + naukaUkonczona). Kolejność: dominacja > przegrana > nauka.
- **Luki**: brak kulturowego/religijnego/dyplomatycznego zwycięstwa; `epokaKoncowa`/`naukaUkonczona` pre-computed booleans (caller); brak turn-limit/alpha.

### `visibility.ts` (~106 linii) — **90%**
- **Cel**: Fog-of-war — zbiór widocznych heksów.
- **Eksporty**: `DEFAULT_SIGHT`/`computeVisible`/`addExplored`/`allHexKeys`.
- **Zależności**: `../units/setup` (hexDistance, keyOf, RuntimeUnit), `../types/map`.
- **Logika**: dla każdej jednostki ownerId=0, hexDistance ≤ sight → add klucz; explored akumuluje.
- **Luki**: tylko human player (ownerId=0 hardcoded w doc); brak terrain-based sight blocking (hills/mountains); brak reveal-all mode poza `allHexKeys`.

### `ai_research_tmp.ts` (~860 linii) — **DUPLIKAT** (do usunięcia)
- **Cel**: Wczesna wersja `ai.ts` — **duplikat**.
- **Eksporty**: subset `ai.ts` (brak `decideAIReaction`/`decideAIReinforcements`/`decideAIDiplomacy`/`PROG_*`/`DifficultyParams` agresjaMnoznik/dyplomacjaAktywnosc/celObranie; brak `canAfford`/`itemCost`/`clusterCenter` w `AITurnOpts`).
- **Luki**: jest artefaktem migracji — krótszy `decideAITurn` (bez idle-fallback 4f, bez `unitActed`, bez ranged-hold-back fallthrough, bez celObranie weak-target). **Rekomendacja: usunąć**, używać `ai.ts`.

---

## Mapa zależności (skrócona)

```
ai.ts → cities, diplomacy, units/setup, types/{map,hex}, data/loader
economy.ts → production (buildingEffectAtLevel)
turn-economy.ts → economy, economy-upkeep, converters, production, wealth, okolica, cities
economy-upkeep.ts → economy (typ), production
production.ts → cities, data/loader, miasto-params.json
diplomacy.ts → types/{diplomacy,player}
combat.ts → (brak)
siege.ts → production
research.ts → (brak)
culture-religion.ts → (brak, ZERO importów)
order.ts → (brak)
wealth.ts → (brak)
converters.ts → (brak)
playerState.ts → data/loader, tech-tempo
auto-manage.ts → cities, okolica, production
okolica.ts → units/setup, miasto-params.json
cities.ts → units/setup, types/{map,hex}, miasto-params.json
barbarians.ts → units/setup, types/{map,hex}, data/loader
victory.ts → cities
visibility.ts → units/setup, types/map
save.ts → units/setup, cities
tech-tempo.ts → (brak)
```

## Rekomendacje (kolejność priorytetowa)

1. **Napraw `playerState.ts`** — dodaj `playerResearchTargetId: string | null;` do interfejsu `PlayerState` (krytyczne, TS strict).
2. **Usuń `ai_research_tmp.ts`** — duplikat `ai.ts`, ryzyko pomyłkowego importu.
3. **Wpiąć `order.ts` w `turn-economy`** — `evaluateOrder` → `effects.growthMult`/`productionMult` już częściowo wspierane przez `growthMultByCity`; dodać `productionMult` i `revoltRisk` roll.
4. **Wpiąć `culture-religion.ts`** — `accumulateCulture` + `cultureHappiness` + `religionHappiness` karmione do `order.szczescie`; `spreadReligion`/`convertViaTemple` w turn-loop.
5. **Wpiąć `siege.ts`** — `resolveSiegeAttack`/`captureCity` w battle resolver; zsynchronizować z `city.oblegane` we `turn-economy`.
6. **Runtime City rozszerzyć** — dodać `builtBuildings: string[]`, `wealthState`, `surowce`, `kulturaSkumulowana`, `religionState`, `maSpichlerz`/`maAkwedukt` (lub ustandaryzować mapowanie na EconomyCity/SiegeCity/CultureCity).
7. **Korupcja** — przekazać `corruptionRate(dystansOdStolicy, liczbaMiast, params)` do `strataFraction` (wymaga capital flag + dystansu).
8. **Surowce** — wpiąć `applyResourceIntake` + `runConverters` z realnym `citySurowce` (terrain yield `drewno`/`kamien` z `tileYield`).
9. **Konsolidacja `research.ts` vs `playerState.ts`** — wybiorć jedno API (playerState jest używane przez main.ts; research.ts czystsze ale orphan).
10. **Konsolidacja `economy-upkeep` vs `player-economy.ts`** (orphan, importowany nigdzie).

**Ogólne ukończenie modułu game/: ~80%.** Logika domenowa dojrzała i dobrze przetestowana (pure functions); główne opóźnienie to integracja z turn-loop i runtime City.
