# P2.2 — Propozycja kanonicznego kontraktu `GameState` (Rust) — PROPOZYCJA, nie decyzja

**Temat:** `R-RUSTPORT-P2-2-GAMESTATE-CONTRACT-Q1` · **Runda:** 1/5 (tura obrony 2) · **Rola:** Operator (Haiku 5.5 medium)
**Status:** propozycja do weryfikacji (P2.12) i do Final Control. Każdy punkt z sekcji 5 wymaga decyzji właściciela lub jawnej akceptacji; nic nie jest wybrane po cichu.

**Piny:**
- web `main` = `edb8fb56` (odczyt `git show edb8fb56:…`).
- Rust `rust-port/parity-v2` = `9e33fc77` (odczyt `git show rust-port/parity-v2:…`). `rust-port/engine` = biblioteka referencyjna, nie baza kontynuacji (GOAL §0 poz. 1).

**Źródła:** P2.1 (15 modułów M1–M15), P2.7 (22 top-level klucze + 94 klucze `meta`), P2.9 (dane JSON, przeczytany w całości 1–1807 w turze obrony), P2.8 (granica Tauri). Zero zmian w `gra/**`, zero nowego kodu Rust.

---

## 1. Zasady kontraktu (propozycja)

1. `GameState` = wyłącznie stan rozgrywki, potrzebny do deterministycznego odtworzenia tury i do zapisu. Nie zawiera stanu renderu ani UI.
2. Stan wyprowadzalny (np. maksymalna pula manpower) **nie jest przechowywany**, tylko liczony z pól bazowych (patrz INV-3).
3. Każde pole ma źródło: `[web: plik:linia]` i/lub `[Rust: plik:linia]` (w §2 podane przy każdym polu). Pole bez źródła nie jest w kontrakcie. Pole, którego lokalizacja jest nierozstrzygnięta, jest oznaczone numerem `D-` z §5 i nie jest traktowane jako zatwierdzone.
4. Właściciele (`owner_id`) są liczbami; `-1` = byt neutralny/barbarzyńcy (`barbarians.rs`, `BARBARIAN_OWNER_ID`). Fotele ludzkie są jawnym zbiorem (hot-seat, patrz D2).
5. Wersja formatu zapisu jest częścią kontraktu (P2.11). Numeracja web (3) i Rust (2) jest niezgodna — patrz D7.

## 2. Kanoniczny szkielet `GameState` (propozycja)

Źródła: `web` = pole/klucz w `edb8fb56`, `Rust` = typ/plik w `parity-v2`. „BRAK stanu” = w Rust nie ma pola stanu między turami dla tej domeny.

```
GameState {
  turn:         TurnState,         // M6  | web: tura (P2.7 §2) | Rust: TurnDto (state.rs), canonical_phase_order (events.rs)
  owners:       Vec<OwnerState>,   // M2  | web: gracze (save.ts, GraczSaveV3[]) | Rust: PlayablePlayer (playable.rs:284-289)
  map:          MapState,          // M1  | web: mapSnapshot (P2.7 §2) | Rust: MapDto (domain/types.rs:172)
  cities:       Vec<CityState>,    // M3  | web: cities (P2.7 §2) | Rust: CityDto (types.rs:327-335)
  units:        Vec<UnitState>,    // M4  | web: units (P2.7 §2) | Rust: UnitDto (types.rs:404-420)
  economy:      EconomyState,      // M5  | web: cityProd, cityBuilt, ulepszeniaEmpireByOwner, playerPracaPool… (P2.7 §3) | Rust: turn_economy.rs (skarbiec; stok culture — D12)
  diplomacy:    DiplomacyState,    // M9  | web: diploRelations (top), diplomacy* (meta §4) | Rust: DiplomacyState (diplomacy.rs:1611)
  trade_routes: Vec<TradeRoute>,   // M11 | web: tradeRoutes (top) | Rust: TradeRoute (trade.rs:392)
  ai:           AiState,           // M7  | web: aiSkarbiecByOwner…, forcedWarWavesByPairKey (meta §4) | Rust: BRAK stanu (ai_turn.rs:996,1039 — planer bez stanu)
  combat:       CombatState,       // M8  | web: siegeTurnByCity, siegeBesiegerByCity, siegeAiStateByKey (meta §4) | Rust: BRAK stanu oblężeń (combat.rs)
  culture:      CultureState,      // M10 | web: cityRelig (meta §4), culture-religion.ts | Rust: BRAK modelu (D8; stok u64 w turn_economy.rs — D12)
  wonders_tech: WondersTechState,  // M12 | web: completedWorldWonders, placedWorldWonders, wonderBuildSites (meta §4), aiResearchDone (top) | Rust: researched_by_owner (diplomacy.rs:2203-2204)
  city_states:  CityStatesState,   // M13 | web: pola wg P2.1 M13 (klucze do potwierdzenia P2.3) | Rust: flagi diplomacy.rs:2904-2905, playable.rs:167 (NOT_IMPLEMENTED)
  barbarians:   BarbarianState,    // M14 | web: barbCamps, clearedBarbCampHexes, lootedVillageHexKeys (meta §4) | Rust: BarbCamp (barbarians.rs:153)
  settings:     GameSettings,      // konfig. | web: seed (top), newGameParams (meta §4) | Rust: BRAK jawnego pola (D13)
  // rng: RngState — CELOWO POZA SZKIELETEM: lokalizacja (state vs envelope) nierozstrzygnięta, patrz D11
}

OwnerState {
  id, name, civ, is_human, era, eliminated,
  policy: OwnerPolicy,               // ownerDefault*, autoManageCities (meta §4) | Rust: BRAK — D14 (czy policy należy do owners)
}
```

`PersistenceEnvelope { version, state: GameState }` jest w M15 i nie należy do `GameState` (P2.7 §5: `SaveSnapshot` zawiera `version, state, event_queue, rng`; `event_queue` do rozstrzygnięcia w P2.11; Rust `save_load.rs:6-8` potwierdza, że `rng` jest obok `state` w wersji 2).

## 3. Mapowanie 15 modułów domeny (P2.1) na pola kontraktu

| Moduł | Pole w `GameState` | Obecne w Rust | Uwaga / decyzja |
|---|---|---|---|
| M1 world/teren/rzeki/granice | `map: MapState` | `MapDto` (`domain/types.rs:172`), `TileDto`; rzeki CZĘŚCIOWO (`map_generator.rs:140-147`) | Granice jako geometria: BRAK. Proponowane: granica = pochodna własności kafli (`trade.rs:563` już liczy wspólną granicę lądową). Patrz D9. |
| M2 cywilizacje/fotele | `owners: Vec<OwnerState>` | `PlayablePlayer` (`playable.rs:284-289`), `Player` (`player.rs:6`), `CivilizationDto` (`types.rs:257-265`) | Trzy niezależne typy właściciela. Jeden kanon — D4. Web: `gracze` (`save.ts`, `GraczSaveV3[]`) z `humanOwnerIds`. |
| M3 miasta | `cities: Vec<CityState>` | `CityDto` (`types.rs:327-335`: id, owner_id, name, position, population); `PlayableCity` | Web `City` ma znacznie więcej pól (P2.7 §2 wiersz 5, niesprawdzone polem po polu — P2.3). Patrz D10. |
| M4 jednostki | `units: Vec<UnitState>` | `UnitDto` (`types.rs:404-420`: id, owner_id, kind, position — 4 pola) | Zakres pól do uzupełnienia z `RuntimeUnit` web (P2.3). Manpower/HP: BRAK w Rust (P2.1 M4). |
| M5 ekonomia | `economy: EconomyState` | `turn_economy.rs` (skarbiec credit→spend→reset), `resource_production.rs`, `building_costs.rs` (poza DTO) | Web: `cityProd`, `cityBuilt`, `empireFoodStates`, `goldDeficitStates`, `ulepszeniaEmpireByOwner`, `playerPracaPool` (P2.7 §3). `ResourceKey` ma 9 z 15 surowców (P2.9 §2a). Stok `culture` — D12. |
| M6 tury | `turn: TurnState` | `TurnDto` (`state.rs`), `TurnPhase`, `canonical_phase_order` (`events.rs`) | Zgodne z zasadą: faza jest częścią stanu, nie UI. |
| M7 AI | `ai: AiState` | `ai_turn.rs` — planer bez stanu między turami (`plan_ai_turn` `:996`, `decide_ai_turn` `:1039`); NIE zadeklarowany w `domain/mod.rs` | Web: wszystkie `ai*ByOwner`, `forcedWarWavesByPairKey` i rodzina `*ForceWar*` — BRAK w Rust. Patrz D1, D5. |
| M8 walka | `combat: CombatState` | `combat.rs` (480 linii, bez stanu oblężeń; NIE zadeklarowany w `mod.rs`) | Web: `siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey`, `battlePowerPtsByOwner`. Stan oblężeń: BRAK w Rust. |
| M9 dyplomacja | `diplomacy: DiplomacyState` | `DiplomacyState` (`diplomacy.rs:1611`), `Relation` (`:104`), `ActiveDeal` (`:1441`), `DiploPairMeta` (`:1190`) — derive serde, POZA `GameStateDto` | Najlepsze istniejące dopasowanie; wymaga wpięcia do stanu. Web: `diploRelations`, `diplomacyDeals`, `negotiationTable`, `rejectedOfferCooldowns`, `wiarygodnosc*` (patrz §4). |
| M10 kultura/religia | `culture: CultureState` | BRAK modelu; stok `culture: u64` jako pole skarbca w `turn_economy.rs:11,32,44,81,108,127,140,338-343`; trafienia religii w `diplomacy.rs:240-241,345-346,552-553` | Web: `cityRelig` (meta) i `culture-religion.ts` (1479 linii). Patrz D8, D12. |
| M11 handel | `trade_routes: Vec<TradeRoute>` | `TradeRoute` (`trade.rs:392`, serde), `TradeMap` (`:172`) | Web: `tradeRoutes` (top-level). Istniejące pole, poza DTO. |
| M12 cuda/technologie | `wonders_tech: WondersTechState` | BRAK modułu; `researched_by_owner` (`diplomacy.rs:2203-2204`) jako jedyny ślad | Web: `completedWorldWonders`, `placedWorldWonders`, `wonderBuildSites`, `aiResearchDone`, `placedImprovements`. Patrz D8. |
| M13 państwa-miasta | `city_states: CityStatesState` | CZĘŚCIOWO: flagi `diplomacy.rs:2904-2905,2934-2935`; `playable.rs:111,144,167` (`cityStatesCount:NOT_IMPLEMENTED`) | Jawny brak implementacji po stronie Rust. Patrz D8. |
| M14 barbarzyńcy | `barbarians: BarbarianState` | `BarbCamp` (`barbarians.rs:153`, serde), `BARBARIAN_OWNER_ID = -1` | Web: `barbCamps`, `clearedBarbCampHexes`, `lootedVillageHexKeys`. Nagrody z wiosek (`villageRewards.ts`): BRAK. |
| M15 persystencja | poza `GameState` — `PersistenceEnvelope` | `SaveSnapshot` (`domain/save_load.rs:79`, `CURRENT_SNAPSHOT_VERSION = 2`, `:34`), NIE zadeklarowany w `mod.rs` | Web: `SAVE_VERSION = 3` (`save.ts:116`). Patrz D7. |

## 4. Klasyfikacja 94 kluczy `meta` (P2.7 §3) — grupowanie architektoniczne

Legenda: **S** = stan gry (wchodzi do `GameState`); **U** = UI/klient (nie replikować do Rust); **D** = wyprowadzalne/cache (nie serializować, jeśli da się odtworzyć z S — do potwierdzenia per klucz w P2.3/P2.12).

Uwaga metodologiczna: to jest grupowanie, nie weryfikacja per klucz. Źródłem przypisania grupy jest nazwa klucza i P2.7 §3; pole kontraktu wskazane w ostatniej kolumnie jest propozycją (patrz D-punkty z §5 dla pozycji wieloznacznych).

| Grupa | Klucze `meta` (web) | Klasa | Pole w kontrakcie |
|---|---|---|---|
| Metadane zapisu | `label`, `savedAt`, `saveOrigin`, `loadMapSize`, `loadTypSwiata`, `loadCivId`, `loadLandFraction` | U | poza `GameState` (envelope UI) |
| Konfiguracja startu | `newGameParams` | S | `settings` |
| Gospodarka właściciela | `ownerDefaultPodzialHandlu`, `ownerDefaultPodzialPracy`, `ownerDefaultOkolicaFocus`, `ownerDefaultBudowaProfil`, `ownerDefaultPoziomRacji`, `autoManageCities` | S | `owners[].policy` (propozycja; D14) |
| Ekonomia imperium | `ulepszeniaEmpireByOwner`, `mennicaZlotoGrace`, `playerPracaPool`, `goldDeficitStates`, `empireFoodStates`, `pendingImprovementsTurn`, `budowaListaBiblioteka`* | S (`budowaListaBiblioteka` — U? do potwierdzenia) | `economy` |
| Ekonomia AI | `aiSkarbiecByOwner`, `aiPracaPoolByOwner`, `aiNaukaPoolByOwner`, `aiBadanaByOwner`, `aiSurplusRedirectedOwners`, `aiSliderStateByOwner`, `battlePowerPtsByOwner`, `zdobyczePowerByOwner` | S | `ai` lub `economy` (wieloznaczne — D13) |
| Miasta i ulepszenia | `placedImprovements`, `fortNodes`, `hexClearingStates`, `cityRelig`, `clusterCapitalOwnerIds`, `clusterPlacement` | S (`clusterPlacement` — D? do potwierdzenia, może być generowany z seeda) | `cities`, `map`, `culture` |
| Cuda | `completedWorldWonders`, `placedWorldWonders`, `wonderBuildSites` | S | `wonders_tech` |
| Właściciele / era | `ownerEraByOwner`, `ownerStartEraByOwner`, `eliminatedOwners`, `capitalCityIdByOwner`, `aiOwnerCivMap`, `foreignTypeOwners`, `typCityCopyOwners` | S | `owners` |
| Nazwy wyświetlane | `ownerDisplayName` | U | — |
| Dyplomacja (stan) | `diploRelations`(top), `diplomacyPairMeta`, `diplomacyDeals`, `negotiationTable`, `negotiationSeq`, `rejectedOfferCooldowns`, `diplomacyFactorLog`, `simplifiedDiplomacyOwners`, `zlozeGrants`, `surowiecBooleanGrants`, `pendingDiplomacyInbox`, `interHumanDiplomacyInbox` | S | `diplomacy` |
| Dyplomacja (kontakt/odkrycie) | `diplomaticContactEstablished`, `diplomaticallyDiscoveredOwners`, `diplomaticDiscoveryPopupShown` | S (kontakt, odkrycie) / U (popup) | `diplomacy` / U |
| Wiarygodność | `wiarygodnoscZdarzeniaByOwner`, `wiarygodnoscStrumienByOwner`, `wiarygodnoscOstatniaWojnaTuraByOwner`, `wiarygodnoscP4MilestonesByOwner`, `wiarygodnoscN7ActivePairs` | S | `diplomacy`. Rust: BRAK zweryfikowanego odpowiednika. Trafienia `credib` (25) w Rust są NIEROZSTRZYGNIĘTE wg P2.7 §8 — nie są dowodem ani obecności, ani braku. |
| Limity czasowe AI | `aiOneShotGiftLastTurn`, `aiTradeAgreementLastProposalTurn`, `aiAiTradeAgreementLastTurn`, `aiResourceTradeLastProposalTurn`, `aiAudienceLastRequestTurn`, `aiTargetMemoryByOwner` | S | `ai` |
| Wojna wymuszona (fale) | `forcedWarWavesByPairKey`, `bronzeForceWarPendingOwners`, `bronzeForceWarCycleOwners`, `bronzeForceWarRestUntilByOwner`, `bronzeForceWarActiveByPairKey`, `bronzeEraEnterTurnByOwner`, `stoneForceWarPendingOwners`, `stoneForceWarCycleOwners`, `stoneForceWarRestUntilByOwner`, `stoneForceWarActiveByPairKey`, `ironForceWarPendingOwners`, `ironEraEnterTurnByOwner`, `ironForceWarCycleOwners`, `ironForceWarRestUntilByOwner`, `ironForceWarActiveByPairKey`, `regularWarCapturedByPairKey` | S | `ai.forced_war` (D1) |
| Oblężenia | `siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey` | S | `combat` |
| Barbarzyńcy | `barbCamps`, `clearedBarbCampHexes`, `lootedVillageHexKeys` | S | `barbarians` |
| Weterani / edukacja | `veteranEnemyEducationShown` | U (flaga popupu) | — |
| Zniszczenie / zdarzenia | `eliminatedOwners` (już wyżej) | S | `owners` |
| Pozostałe widoki | `aiResearchDone`(top) | S | `wonders_tech` |

Sprawdzenie pokrycia: 94 pozycje w tabeli §4 (grupy liczą klucze z P2.7 §3; `aiResearchDone`, `mapQuality`, `renderQuality`, `mapDetailQuality`, `exploredByHuman` pochodzą z top-level). Klucze oznaczone `?` wymagają potwierdzenia w P2.3/P2.12 — NIE są zadeklarowane jako pewne.

**Top-level (P2.7 §2) poza `meta`:** `wersja` → envelope (M15); `tura` → `turn`; `seed` → `settings` (propozycja; D13); `units` → `units`; `cities` → `cities`; `exploredByHuman` → `map` (S, do potwierdzenia — per-owner widoczność); `gracze` → `owners`; `humanOwnerIds` / `activeHumanOwnerId` → `owners` (D2); `autoMarch`, `plannedMarches`, `rallyPoints` → `units` lub `combat` (wieloznaczne — D13; BRAK w Rust); `cityProd`, `cityBuilt` → `economy` lub `cities` (wieloznaczne — D13); `aiResearchDone` → `wonders_tech` (S); `diploRelations` → `diplomacy` (S); `tradeRoutes` → `trade_routes` (S); `mapSnapshot` → `map` (S, format do weryfikacji); `mapQuality`, `renderQuality`, `mapDetailQuality` → **U (poza kontraktem)**.

## 5. Punkty wymagające decyzji (NIE rozstrzygnięte po cichu)

- **D1 — gdzie żyje `forcedWarWavesByPairKey`.** Opcje: (a) w `ai.forced_war` (stan AI, bo wiąże `originHex`, `rallyPoint`, `unitIds` z jednostkami i miastami); (b) w osobnej strukturze `diplomacy` (bo klucz to para właścicieli). Kształt: `Map<pairKey, {nextWaveId, waves[], history[]}>` (`forced-war-waves.ts:27-31`). Rust: BRAK (P2.7 §8: zero trafień dla `forced|force_war|wave`).
- **D2 — hot-seat: `activeHumanOwnerId`.** Czy to stan rozgrywki (zapis, replay) czy stan sesji UI? Web trzyma je w `humanOwnerIds` w zapisie (`save.ts:374`, deserializacja `save.ts:714`). Rust: `PlayablePlayer.is_human` (`playable.rs:288`), brak listy. Decyzja: zbiór w `GameState` vs. stan sesji.
- **D3 — który DTO jest kanoniczny.** Istnieją dwa: `GameStateDto` (`state.rs:6-9`: map, civilizations, cities, units, turn) i `PlayableState` (`playable.rs:321`, „state DTO sent to the Tauri frontend”). Propozycja: `GameState` jest kanoniczny, `PlayableState` to widok do frontendu wyprowadzony z `GameState`. Wymaga akceptacji (P2.8 pokazuje, że frontend dziś renderuje `PlayableState`).
- **D4 — tożsamość właściciela i cywilizacji.** Trzy typy (`PlayablePlayer`, `Player`, `CivilizationDto`) + enum `CivilizationKind` (`diplomacy.rs`) z 15 ID + `generic`, `drobna_cywilizacja`, `babilon` (duplikat semantyczny `babilonia`, P2.9 §2d; w `wonders.json` występuje `babilonia`, w Rust `diplomacy.rs:829`). Wybór jednego kanonu.
- **D5 — moduły domeny nie zadeklarowane w crate.** `save_load`, `ai_turn`, `combat`, `replay`, `unit_epoch` nie są w `domain/mod.rs` (P2.8 §6). Kontrakt `GameState` wymaga, by pola stanu były w crate, więc decyzja o wpięciu każdego modułu.
- **D6 — `meta` jako kontener vs. typowane pola.** Web trzyma 94 klucze w jednym obiekcie bez whitelisty (`save.ts:724`). Propozycja: typowane pola w modułach (§2–4), bez generycznej mapy; zgodność z zapisami web przez migrację (P2.11).
- **D7 — numeracja i migracja wersji zapisu.** Web: `SAVE_VERSION = 3`, brak migracji v2→v3, wersje < 3 odrzucane (`save.ts:111-116`). Rust: `CURRENT_SNAPSHOT_VERSION = 2`, wersja ≠ 2 odrzucana (`save_load.rs:34,138`). Decyzja: czy Rust przyjmuje format web v3 1:1, czy wprowadza własną numerację z mapowaniem.
- **D8 — trzy domeny bez modelu (M10, M12, M13).** Kultura/religia, cuda/technologie, państwa-miasta: czy powstają jako stan w `GameState` w P2.2, czy są odroczone do P6.16–P6.18. Stok `culture` w `turn_economy` to pole zasobu, nie model (P2.1 M10).
- **D9 — granice i rzeki.** Czy granica jest pochodną własności kafli (proponowane), czy osobną strukturą. Rzeki: pełna topologia BRAK (`map_generator.rs:140-141` sam to przyznaje).
- **D10 — pola `UnitState`/`CityState`.** Zakres pól poza obecnym DTO (4 pola jednostki, 5 miasta) nie jest porównany polem po polu — P2.3.
- **D11 — `event_queue` i `rng` w envelope vs. state.** `SaveSnapshot` trzyma je obok `state` (P2.7 §5; Rust `save_load.rs:6-8`). Pole `rng` jest w szkielecie §2 celowo poza `GameState`. Decyzja w P2.4/P2.11.
- **D12 — stok `culture` (u64): `economy` czy `CultureState`.** Rust trzyma stok kultury jako pole skarbca w `turn_economy.rs` (`:11,32,44,81,108,127,140,338-343`), a nie w modelu kultury (którego nie ma). Szkielet przypisuje stok do `economy` (zgodnie z Rust), a `CultureState` zostawia bez stoku. Alternatywa: stok w `CultureState`. Decyzja właściciela.
- **D13 — pola z kilkoma możliwymi miejscami.** (a) `cityProd`, `cityBuilt`: `economy` czy `cities[]`; (b) `autoMarch`, `plannedMarches`, `rallyPoints`: `units` czy `combat`; (c) `aiSkarbiecByOwner` i rodzina `aiPracaPool/aiNaukaPool/...`: `ai` czy `economy`; (d) `seed`: `settings` (propozycja) czy wyprowadzany z `GameSettings`/generatora (P2.4). Szkielet wpisuje po jednym miejscu jako propozycję; wybór wymaga decyzji.
- **D14 — polityka właściciela (`ownerDefault*`, `autoManageCities`).** Szkielet wpisuje `OwnerState.policy`, ale w Rust nie ma odpowiednika, a zapis web trzyma je w `meta`. Alternatywa: osobna struktura `OwnerPolicies` obok `owners`. Decyzja.

## 6. Niezmienniki i bramki (zweryfikowane w kodzie, z oznaczeniem klasy)

Dispatch wymaga 3–5 niezmienników stanu. Zweryfikowano tylko trzy niezmienniki stanu gry web (INV-1…INV-3). INV-4…INV-6 podano dla kompletności, ale **nie są niezmiennikami stanu `GameState`**: INV-4 to stała modelu Rust, INV-5 i INV-6 to bramki wczytania.

**Niezmienniki stanu (kandydaci na `GameState`, web):**

- **INV-1 — HP jednostki w zakresie `[0, maxHp]`.** Egzekwowane: `gra/src/game/manpower.ts:326` (`Math.max(0, Math.min(maxHp, u.hp))`) oraz `:363` (`u.hp = Math.min(maxHp, curHp + healHp)`). Zakres kontraktu: pole `hp` z walidacją przy odczycie i przy leczeniu. Rust: BRAK pola HP (P2.1 M4).
- **INV-2 — pula manpower nie przekracza maksimum.** Egzekwowane w funkcji przyrostu: `gra/src/game/manpower.ts:475` (`return Math.min(max, cur + gain)`). Dotyczy puli per miasto/owner (`manpower.ts:2`, „pula Manpower per miasto”). Rust: BRAK (P2.1 M4).
- **INV-3 — `manpowerMax` jest pochodną, nie polem zapisywanym.** Wzór: `manpowerMax = ludki × manpowerNaLudka[epoka]` (`manpower.ts:8`, definicja `:41`), gdzie `manpowerNaLudka` pochodzi z `epoka-ludnosc-manpower.json` (P2.9 §1 wiersz 16). Konsekwencja dla kontraktu: zapisujemy `ludki` i `epoka`, nie `manpowerMax`.

**Stała modelu Rust (poza kontraktem web, do weryfikacji):**

- **INV-4 — udział strat w bitwie w `[0.10, 0.25]`.** Egzekwowane w Rust: `rust-port/engine/src/domain/combat.rs:438,443` (`.clamp(0.10, 0.25)`, potwierdzone na `parity-v2`). **Ograniczenie:** to model Rust, nie web (P2.1 M8: web to TW v3, Rust to inny model). Nie jest to niezmiennik zachowania web — nie zweryfikowano wobec `combat.ts`. Nie wchodzi do kontraktu jako niezmiennik, dopóki nie zostanie zweryfikowany (P2.12).

**Bramki wczytania (walidacja formatu, nie czas gry):**

- **INV-5 — wpisy wojny wymuszonej bez poprawnych pól są odrzucane przy wczytaniu.** Egzekwowane: `gra/src/game/forced-war-waves.ts:247-262` (`restoreForcedWarWaves` filtruje po `id`, `targetCityId`, `unitIds`, `originHex`, `rallyPoint`, `approachSector`). Dotyczy wczytywania zapisu, nie czasu gry.
- **INV-6 — wersja zapisu jest bramką wczytania.** Web: `save.ts:111-116, 688` (odrzucenie wersji < 3). Rust: `save_load.rs:138` (odrzucenie wersji ≠ 2). Obie strony odrzucają nieznane wersje, numery się różnią (D7).

**Odrzucone kandydatury:** przykład z dispatchu „suma populacji miast właściciela == jego manpower pool” NIE został znaleziony w kodzie (sprawdzono `manpower.ts`: relacja jest per miasto i jest wzorem `ludki × manpowerNaLudka`, nie sumą). Nie wpisano go jako niezmiennika.

## 7. Ograniczenia i zmiany po zarzutach (tura obrony)

- Klasyfikacja `meta` jest grupowaniem architektonicznym (zgodnie z dispatchem), nie per-klucz; klucze oznaczone `?` wymagają potwierdzenia.
- Niezmienniki stanu INV-1…INV-3 sprawdzone grepem/odczytem wybranych linii; INV-4 wymaga weryfikacji wobec `combat.ts`. Nie uruchomiono testów ani kompilacji.
- P2.9 przeczytany w całości (1–1807) w turze obrony. Appendix per klucz użyty wyłącznie do sprawdzenia pokrycia pól `GameState`; nie klasyfikuje kluczy kontraktu.
- Pola `City`/`RuntimeUnit` web nie porównane polem po polu (P2.3).
- Brak weryfikacji zachowania web↔Rust dla żadnego pola (to zadanie P2.12).
- Zmiany po zarzutach 1–8 Evaluatora: §2 — źródło przy każdym polu, `rng` poza szkieletem (D11), `OwnerState.policy` (D14), `settings` (D13); §3 — stok `culture` (D12); §4 — `credib` oznaczone jako nierozstrzygnięte, grupy wieloznaczne (D13, D14); §5 — nowe D12–D14; §6 — przeklasyfikowane niezmienniki (stan vs stała Rust vs bramka wczytania); §7 — P2.9 w całości.

## 8. Rozstrzygnięcia (orkiestrator, 2026-10-21)

Final Control zwrócił DECISION_REQUIRED dla D1–D14 (§5) oraz dwóch dodatkowych punktów (9, 10)
znalezionych przy przeglądzie całości. Jedyny punkt wymagający właściciela to D7 (kompatybilność
zapisów) — reszta to wybory strukturalne (gdzie żyje pole), rozstrzygalne inżyniersko bez wpływu na
zachowanie gry dla gracza. Rozstrzygam:

**D7 (PYTANIE DO WŁAŚCICIELA — odpowiedź 2026-10-21):** Rust MUSI wczytywać dzisiejsze zapisy web
1:1 — gracze nie mogą stracić postępu przy przejściu na nową aplikację. Konsekwencja: wymagana
warstwa migracji „web `SAVE_VERSION=3` → kontrakt `GameState`" jako część P2.11, nie tylko akceptacja
jednego formatu. Własna numeracja wersji Rust (dziś 2) jest wewnętrznym szczegółem implementacji —
import jest jednokierunkowy (web → Rust), nie wymaga żeby Rust zapisywał w formacie czytelnym przez
web.

**Pozostałe punkty (rozstrzygnięcia inżynierskie orkiestratora, nie wymagają właściciela):**
- D1: `forcedWarWavesByPairKey` → `ai.forced_war` (wiąże jednostki/pozycje, naturalnie stan AI).
- D2: `activeHumanOwnerId`/`humanOwnerIds` → pole w `owners` (GameState, nie sesja UI) — web
  persystuje je w zapisie, a D7 wymaga zachowania tej informacji przy imporcie.
- D3: `GameState` kanoniczny, `PlayableState` to widok wyprowadzony dla frontendu (przyjęta
  propozycja Operatora bez zmian).
- D4: kanon tożsamości cywilizacji = `CivilizationKind` (`diplomacy.rs`, już serde, najbliżej web).
  Duplikat `babilon`/`babilonia` to BŁĄD DANYCH, nie wybór projektowy — osobny temat katalogowy ma
  ustalić, która pisownia jest używana szerzej w `gra/data/*.json` i ujednolicić enum Rust do niej.
- D5: `save_load`, `ai_turn`, `combat`, `replay`, `unit_epoch` MUSZĄ zostać zadeklarowane w
  `domain/mod.rs` — to nie jest wybór, to brakująca praca niezbędna żeby kontrakt w ogóle się
  skompilował.
- D6: typowane pola per moduł (przyjęta propozycja), NIE generyczna mapa `meta` — ułatwia
  niezmienniki i typowanie, kosztem warstwy migracji w D7/P2.11, która i tak jest wymagana.
- D8: M10 (kultura/religia), M12 (cuda/technologie), M13 (państwa-miasta) dostają w `GameState`
  WYŁĄCZNIE pola-placeholdery wystarczające do round-trip zapisu (zachować dane z importu, nawet
  bez logiki gry) — pełne modele systemowe budowane w dedykowanych tematach P6 (`P6.16`-`P6.18`),
  zgodnie z sekwencją faz z planu. Nie blokuje zamknięcia P2.2.
- D9: granica = pochodna własności kafli (nie osobna struktura, zgodnie z zasadą „stan wyprowadzalny
  nie jest przechowywany" z §1 pkt 2). Rzeki: pełna topologia pozostaje poza zakresem do P3/P4
  (ustalone już w P2.4).
- D10: pełne porównanie pól `UnitState`/`CityState` pole po polu — to jest właśnie zakres
  następnego tematu P2.3, nie blokuje zamknięcia P2.2.
- D11: `rng` i `event_queue` zostają w `PersistenceEnvelope`/`SaveSnapshot`, POZA `GameState` —
  zgodne z dzisiejszą strukturą Rust (`save_load.rs:6-8`), nie zanieczyszcza deterministycznego
  stanu gry mechaniką kolejki/RNG.
- D12: stok `culture` zostaje w `economy` (zgodnie z dzisiejszym Rust, `turn_economy.rs`) — nie
  tworzymy `CultureState` przedwcześnie dla jednego pola; pełny model kultury (D8, P6) może to
  przenieść później, jeśli będzie taka potrzeba.
- D13: (a) `cityProd`/`cityBuilt` → `cities[]` (produkcja jest atrybutem konkretnego miasta);
  (b) `autoMarch`/`plannedMarches`/`rallyPoints` → `units` (rozkazy per jednostka/armia);
  (c) `aiSkarbiecByOwner` i rodzina → `ai` (wewnętrzna księgowość AI, odrębna od ekonomii gracza);
  (d) `seed` → `settings` (przyjęta propozycja).
- D14: `OwnerState.policy` jako pod-struktura (przyjęta propozycja) — polityka jest atrybutem
  właściciela, nie potrzebuje osobnej struktury najwyższego poziomu.
- Punkt 9 (Final Control): (a) `placedImprovements` → `cities` (ulepszenie jest przypisane do
  konkretnego miasta); (b) `battlePowerPtsByOwner` → `ai` (metryka oceny AI, nie ekonomia gracza);
  (c) `cityRelig`/`fortNodes`/`hexClearingStates` → `cities` (stan per-miasto),
  `clusterCapitalOwnerIds` → `map` (geografia klastra, nie miasto); (d) `capitalCityIdByOwner` →
  `owners` (indeksowane po właścicielu); (e) `wiarygodnosc*` → `diplomacy` (przyjęta propozycja);
  (f) cała rodzina 15 kluczy fal wojny wymuszonej → `ai.forced_war`, spójnie z D1.
- Punkt 10 (Final Control): (a) `exploredByHuman` → `map` (mgła wojny per właściciel to stan mapy);
  (b) flagi UI (`veteranEnemyEducationShown`, `diplomaticDiscoveryPopupShown`, `ownerDisplayName`)
  pozostają klasy U — przy imporcie z D7 są CZYTANE (żeby parser nie padł na nieznanym polu) ale
  ODRZUCANE, nie trafiają do `GameState`. **KOREKTA (orkiestrator, 2026-10-21, przy zamykaniu
  P2.13):** `budowaListaBiblioteka` USUNIĘTE z tej listy — klasyfikacja jako flaga UI była BŁĘDNA.
  P2.11 §10 (D-MIG-10) wykazała kodem (`onBudowaListaCreateTemplate`, `main.ts:7676-7683`), że to
  lista SZABLONÓW BUDOWY NAZYWANYCH PRZEZ GRACZA (dane wejściowe gracza, nie stan UI/popup), więc
  jej odrzucenie przy imporcie zgubiłoby pracę gracza — koliduje wprost z D7 ("gracze nie mogą
  stracić postępu"). `budowaListaBiblioteka` jest importowana JAKO DANE (kandydat na miejsce: grupa
  „Ekonomia imperium", patrz wiersz tabeli l.85), nie odrzucana. To nie jest nowa decyzja — to
  poprawka błędu klasyfikacji wykrytego przez P2.11, niewymagająca pytania właściciela (odwracalna,
  bez wpływu na zachowanie gry poza poprawnym zachowaniem danych gracza, zgodnym z już podjętym D7).
  (c) zasada „stan wyprowadzalny nie
  jest przechowywany" (oparta na INV-3) przyjęta jako zasada ogólna projektu, nie tylko dla
  manpower — standardowa dobra praktyka, nie wymaga decyzji właściciela; (d) `trade_routes` jako
  osobne pole najwyższego poziomu (przyjęta propozycja, zgodne z M11 jako odrębnym modułem).

**Status: temat zamknięty PASS.** Propozycja kontraktu jest kompletna z rozstrzygniętymi punktami
decyzyjnymi. Następny krok: P2.3 (schemat ID encji i pełne porównanie pól `UnitState`/`CityState`),
P2.11 (warstwa migracji zapisów web v3 → `GameState`, wynikająca wprost z D7).

