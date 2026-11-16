# EKONOMIA — rozpoznanie kolejności faz tury (pin vs Rust)

STATUS: rozpoznanie zakończone, tylko odczyt, bez zmian kodu, bez cargo, bez push.
DOMAIN: GAME (parytet web-first).
TEMAT: `R-RUSTPORT-P6-EKONOMIA-TURA-FAZY-ROZP-Q1` (zadanie #304, audyt L1: „wpiąć run_economy_tick w advance_turn").
DISPATCH: gałąź `claude/rust-sivvrn`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-EKONOMIA-TURA-FAZY-ROZP-Q1/00-dispatch.md`.
BAZA: `origin/rust-port/parity-v2` = `9a71caf8a` (worktree detached na tym SHA).
PIN: `07d2fbd72` (`gra/src/**`, odczyt). Wszystkie linie `main.ts` poniżej dotyczą pinu `07d2fbd72`, o ile nie zaznaczono inaczej.
DATA: 2026-11-16.

Oznaczenia: `NIE_ZMIERZONO` = nie sprawdzono albo nie da się rozstrzygnąć z odczytu kodu.

---

## 0. Wnioski (streszczenie)

1. **Pin:** cała ekonomia tury to jeden blok `runWorldEndTurn(humanOwnerId)` (`main.ts:38130`). Jest wołany raz na rundę z `endActiveHumanTurn`/`advanceSeat` (`main.ts:43733`, komentarz `:43583`). Kolejność faz w bloku: WORLD_START (`:38132`) → Dyplomacja (`:38209`) → **ECONOMY** (`:38220`) → produkcja i ekonomia ciąg dalszy (w tym samym bloku, `:38808–40300`) → AI (`:40304`) → Barbarzyńcy (`:43067`) → Zwycięstwo (`:43438`) → tura gracza (`:43572`).
2. **Ekonomiczne wywołanie pinu:** `advanceCityEconomy(...)` w `main.ts:38356`, definicja `turn-economy.ts:2353–2401`. Bezpośrednio po nim: `finalizeMennicaZlotoGraceAfterTick` (`:38404`), `advanceEmpireFood` (`:38569`), bankowanie skarbca i nauki (`:38883–38995`).
3. **Rust, `PlayableGame::advance_turn`** (`rust-port/engine/src/domain/playable.rs:1400–1478`): realnie wykonuje tylko fazę **Diplomacy** (`run_war_turn`, `:1422`) i **Victory** (`evaluate_victory`, `:1432`). Fazy **Economy, Production, Ai, Barbarians, StartTurn, PlayerActions, EndTurn** są tylko przepuszczane do `phases` (`:1450`). Nie ma w ścieżce produkcyjnej żadnego wywołania ekonomii.
4. **Funkcje ekonomii w Rust istnieją**, ale są wołane wyłącznie z testów: `run_economy_tick_for_game` (`turn_economy_wire.rs:234`), `run_economy_tick_for_game_with_food` (`:246`), `advance_city_economy` (`turn_economy_tick.rs:270`).
5. **Miejsce wpięcia:** nowa gałąź `if entry.phase() == TurnPhase::Economy { ... }` w pętli `advance_turn`, **po** gałęzi Diplomacy (po `:1430`), **przed** `phases.push` (`:1450`). Zgodne z pinem (`:38209` < `:38220` < `:40304`) i z `CANONICAL_PHASE_ORDER` (`events.rs:25–35`).
6. **PlayableState nie ma danych wejściowych ekonomii.** Brakuje m.in.: pól produkcyjnych miast (żywność, surowce, racje, podziały, budowa, okolica, praca), ery i technologii per owner, nauki i kultury per owner, handlu (trasy, dochody), jednostek innych niż `Warrior` (typ, HP, garnizon), stanu łaski Mennicy, kontekstu danych (`econParams`, katalogi budynków i jednostek). Lista w §4.
7. **Dryf odniesień:** `turn_economy_wire.rs` (nagłówek, linie 1–4 i 15–16) cytuje stary pin `4bbef081d` (`main.ts:34417–34578`, `:35045–35131`). W pinie `07d2fbd72` ten sam blok leży w `:38356` i `:38883`. Wiązanie w Rust trzeba odnieść do pinu `07d2fbd72` przed implementacją (zadanie #177 w rejestrze już to odnotowuje: dryf econ `4bbef081d→07d2fbd72`).

---

## 1. Pin — kolejność faz tury (`runWorldEndTurn`, `main.ts:38130`)

| # | Blok pinu | Linie `main.ts` | Kluczowe wywołania (linia) | Odpowiednik Rust (`TurnPhase`) |
|---|---|---|---|---|
| 1 | WORLD_START: sprzątanie, wyjątki wojskowe, reset ruchu, wygaśnięcie zdarzeń, autozapis | 38130–38208 | `sweepFortCaptures` 38139; `healInconsistentUnits` 38142; `movedByPlayerThisTurn.clear` 38144; `sweepLegacyFarmsOnForest` 38171; `expireInformationalEventsBeforeTurn` 38191; `doRotatingAutosave` 38201; `pendingImprovementsTurn.commitTurn` 38207 | `StartTurn`: brak obsługi w `advance_turn`. Reset ruchu w Rust jest **po** wszystkich fazach (`playable.rs:1460–1473`) |
| 2 | Dyplomacja | 38209–38218 | `runDiplomacyTurnTick` 38214 | `Diplomacy` = `run_war_turn` (`playable.rs:1422`, `turn_war_pipeline.rs:251`). Treść inna niż pin (patrz §3, uwaga b) |
| 3 | **ECONOMY: tick miast** | 38219–38404 | `buildAllTerritoryNodes` 38231; `recomputeTradeRoutesNow` 38264; `computeTradeRouteResourceFlow` 38283; `deductBuildingStockCostAcrossCities` 38285; `creditOwnerResourceStock` 38301; `computeTradeRouteIncomeByCityBreakdown` 38312; `refreshCityAdministrators` 38355; **`advanceCityEconomy` 38356**; `finalizeMennicaZlotoGraceAfterTick` 38404 | `Economy`: brak |
| 4 | **ECONOMY: żywność i atrycja armii** | 38411–38660 | `advanceEmpireFood` 38569; `applyArmyStarvationHpLoss` 38603; HUD głodu 38654–38690 | `Economy`: brak (częściowo modelowane w `turn_economy_empirefood.rs`, patrz §3) |
| 5 | **ECONOMY: oblężenie, etap N3** | 38808–38882 | atrycja garnizonu; `resolveSiegeSurrender` 38867; `tickSiegeMachinesForCity` 38872; `maybeAiAssaultAfterMachines` 38873 | `Economy`: brak w produkcji (moduły `siege_turn.rs`, `siege_surrender.rs`, patrz §5) |
| 6 | **ECONOMY: skarbiec, utrzymanie, nauka, utrzymanie surowcowe** | 38883–38998 | `hState.skarbiec += hEcon.pieniadz` 38899; `skarbiec -= utrzymanieRazem` 38905 (komentarz 38902); odjęcie surowców 38914; `runAiResearchForOwner` 38990; administratorzy AI 38995 | `Economy`: brak (odpowiednik: `OwnerBank` w `turn_economy_wire.rs`, bankowanie zwraca składniki, nie zapisuje do stanu) |
| 7 | **ECONOMY: badania gracza i epoka** | 39005–39099 | `researchGateForOwner` 39013; `setEra` 39072 | `Economy`: brak |
| 8 | **ECONOMY: deficyt złota** | 39100–39181 | `buildGoldDeficitParams` 39106; `advanceGoldDeficit` 39118; `applyGoldDeficitHpLoss` 39131 | `Economy`: brak |
| 9 | **MIASTO: kultura, religia, presja sąsiadów** | 39208–39500 | `computeCitizenResourceDrain` 39238; `tickCityCultureReligion` 39276; `applyCultureReligionPressureToTarget` 39383 | `Economy`: brak |
| 10 | **MIASTO: bunty i ochrona po przejęciu** | 39506–39660 | `tickRebelProtectionEndOfTurn` 39515; `tickPostCaptureLawEndOfTurn` 39637 | `Economy`: brak |
| 11 | Zarządca miasta (`autoManageCity`) | 39644–39707 | `autoManageCity` 39658 | `Production` (proponowane, §3): brak |
| 12 | **PRODUKCJA i rekrutacja** | 39729–39870 | `advanceProduction` 39765; `applyProductionCompleted` 39792; `advanceRecruitmentGated` 39813 | `Production`: brak |
| 13 | Wzrost ludności i racje | 39879–39962 | `applyPostCentralPopulationGrowth` 39930; `applyLiveSafeRationForCity` 39960 | `Production` lub `Economy` (granica NIE_ZMIERZONO) |
| 14 | Utrzymanie ulepszeń (Praca), cuda | 39963–40030 | `advanceOwnerWonderMapBuilds` 39991 | `Production`: brak |
| 15 | Auto-ulepszenia terenu, po ekonomii, przed AI | 40050–40285 | `applyAiAllocationProfiles` 40050; `computeAiImprovementBudgetCapForOwner` 40061; `pickAutoImprovements` 40102; `setOwnerLastPraca` 40189; zapis puli Pracy 40277–40285 | `Production`: brak |
| 16 | AI_START i pętla AI | 40301–43050 | `AI_CIV_START` 40784; `AI_END` 43050 | `Ai`: przebieg pusty (w `advance_turn` brak gałęzi, jest tylko komentarz `playable.rs:1446`) |
| 17 | Barbarzyńcy | 43067–43437 | `setTurnTransition(94)` 43067 | `Barbarians`: przebieg pusty |
| 18 | Sprawdzenie zwycięstwa | 43438–43571 | `setTurnTransition(98)` 43438 (kryteria 43441–43483) | `Victory`: `evaluate_victory` zaimplementowane (`playable.rs:1432`) |
| 19 | PLAYER_TURN_BEGIN | 43572–43573 | `phaseMark('PLAYER_TURN_BEGIN')` 43572 | `EndTurn`/`PlayerActions`: tylko zdarzenie w kolejce |

Pin, wywołanie ekonomii: `runWorldEndTurn` jest wołany z `main.ts:43733` (po ruchach gracza). Wiele fotelów człowieka: bank przechodzi po `humanSeats.humanOwnerIds` (`main.ts:38896`, komentarz `:38884–38895`).

---

## 2. Rust — `PlayableGame::advance_turn` (`playable.rs:1400–1478`)

Struktura funkcji:

- `:1403–1405`: odrzucenie tury po końcu gry (`koniec_gry`).
- `:1412–1420`: migawki kolejki faz, stanu wojny, flag zwycięstwa (cofane przy błędzie).
- `:1421–1451`: pętla po kolejce faz bieżącej tury. Dla każdej pozycji:
  - `:1422–1430` — `TurnPhase::Diplomacy` → `run_diplomacy_war_phase()` (`:1480–1494`, wywołuje `run_war_turn`). Błąd cofa kolejkę i stan wojny.
  - `:1432–1443` — `TurnPhase::Victory` → `evaluate_victory()`; błąd logowany, tura trwa.
  - `:1446–1449` — komentarz o przyszłym punkcie podpięcia `TurnPhase::Ai` (`ai_replace_*`). **Brak gałęzi kodu**; komentarz mówi wprost, że gałąź „celowo nic nie wykonuje".
  - `:1450` — `phases.push(entry.phase())` dla **każdej** fazy, bez wykonania.
- `:1452–1459`: `phases.len() != PHASE_COUNT` (9) → błąd `TurnPhaseQueueIncomplete`, cofnięcie flag.
- `:1460–1472`: zwiększenie `turn`, `phase = PlayerActions`, `last_advanced_phases`, czyszczenie zaznaczenia, reset `moved_by_player_this_turn` i `movement = movement_max`, reset `replace_used_this_turn`.
- `:1473`: `enqueue_turn_phases(turn)` (`:1522–1527`, po jednym zdarzeniu na każdą fazę z `TurnPhase::all()`; zdarzenia z `event_for_phase`, `:1678–1689`).

Kolejność faz (źródło prawdy): `events.rs:25–35` (`CANONICAL_PHASE_ORDER`): `StartTurn`, `PlayerActions`, `Diplomacy`, `Economy`, `Production`, `Ai`, `Barbarians`, `Victory`, `EndTurn`. Opisy enumu (`events.rs:44–57`): `Economy` = „income, upkeep, growth, and other economy effects"; `Production` = „city production after economy has supplied its work budget".

Funkcje ekonomii w Rust (nie podłączone do `advance_turn`):

| Symbol | Plik:linia | Wołający produkcyjni |
|---|---|---|
| `run_economy_tick_for_game` | `turn_economy_wire.rs:234` | brak (tylko testy: `p6_adv_q6_wire.rs`, `p6_state_src.rs`, doc-komentarze) |
| `run_economy_tick_for_game_with_food` | `turn_economy_wire.rs:246` | brak (tylko `p6_empirefood_e2e.rs`) |
| `advance_city_economy` | `turn_economy_tick.rs:270` | używany przez wire (testowany) |
| `GameEconomyContext` | `turn_economy_wire.rs:180–215` | wejście wire |
| `OwnerBank` / `apply_treasury` / `apply_science` | `turn_economy_wire.rs` (struktura przed `GameEconomyTickOutcome`) | bankowanie zwraca składniki, nie zapisuje stanu |

Wniosek: w ścieżce produkcyjnej `advance_turn` **nie ma żadnego wywołania ekonomii**. Zadanie #304 wymaga nowej gałęzi `TurnPhase::Economy` i dostarczenia wejść ze stanu (§4).

---

## 3. Zestawienie faz: pin ↔ Rust, miejsce wpięcia

### 3.1. Mapowanie grup (propozycja granicy Economy / Production)

| Rust `TurnPhase` | Co powinno tam być (wg pinu) | Bloki pinu (§1) |
|---|---|---|
| `Economy` (`events.rs:52`) | tick miast, bankowanie, żywność, atrycja, deficyt, kultura/religia, bunty | 3–10 |
| `Production` (`events.rs:54`) | zarządca, produkcja, rekrutacja, wzrost, cuda, auto-ulepszenia | 11–15 |

Uzasadnienie: w pinie produkcja (`advanceProduction` 39765) leży po banku (`:38883`) i po deficycie złota (`:39118`) — zgodnie z opisem Rust („after economy has supplied its work budget"). Wzrost ludności (`:39930`) jest po produkcji w pinie, więc zostaje w tej samej fazie po niej. **Granica jest propozycją do decyzji w dispatchu wdrożeniowym**, nie ustaleniem.

### 3.2. Miejsce wpięcia (`advance_turn`)

- Nowa gałąź `if entry.phase() == TurnPhase::Economy { ... }` po gałęzi Diplomacy (`playable.rs` po `:1430`), przed `phases.push` (`:1450`).
- Kolejność zdarzeń z `CANONICAL_PHASE_ORDER` (`events.rs:25–35`) daje: Diplomacy (2) < Economy (3) < Production (4) < Ai (5). Pin: Dyplomacja `:38209` < Ekonomia `:38220` < Produkcja `:39729` < AI `:40304`. Zgodne.
- Błąd w gałęzi Economy musi cofać stan jak Diplomacy (migawka `queue_before`/`war_before`, `:1412–1416`), albo jawnie tego nie robić — decyzja wdrożeniowa.

### 3.3. Różnice, które trzeba uwzględnić

a) **Start tury.** Pin robi sprzątanie, reset ruchu i autozapis *przed* dyplomacją i ekonomią (`:38130–38208`). Rust resetuje ruch *po* wszystkich fazach (`:1460–1472`). Ekonomia nie czyta ruchu w sposób zbadany w tej rundzie (`NIE_ZMIERZONO`), więc różnica nie blokuje wpięcia, ale jest rozbieżnością kolejności.

b) **Dyplomacja.** Rust `Diplomacy` to pipeline wojny (`turn_war_pipeline.rs:1–30`), kolejność kroków jest Rust-owa („NIE z web, decyzja właściciela, wariant B"). Pin `runDiplomacyTurnTick` (`:38214`) to inna treść. Nie wpływa na miejsce wpięcia ekonomii, ale oznacza, że kolejność *wewnątrz* Diplomacy nie jest 1:1 z pinem.

c) **Częstotliwość.** Pin: ekonomia raz na rundę (`:43583`, komentarz architektury (a)). Rust: `advance_turn` raz na turę gry. Czy tura Rust odpowiada rundzie pinu w trybie hot-seat: `NIE_ZMIERZONO` (w Rust nie ma modelu foteli w `PlayableGame`).

d) **Wewnętrzna kolejność wire'a.** `run_economy_tick_for_game_with_food` (`turn_economy_wire.rs:246`) realizuje wg swojego nagłówka: tick → EmpireFood/auto-racje/atrycja → bankowanie. Pin `07d2fbd72` ma dodatkowo **etap N3 oblężenia** (`:38808–38882`: atrycja garnizonu, kapitulacja z głodu, maszyny oblężnicze) **między** EmpireFood (`:38569`) a bankiem (`:38883`). Wire nie zawiera tego kroku (`turn_economy_wire.rs`: 0 trafień na „siege/oblez/capitul"). Moduł `turn_economy_empirefood.rs` ma atrycję garnizonu (16 trafień), ale kapitulacja i maszyny są w `siege_turn.rs`/`siege_surrender.rs`, bez produkcyjnego wołającego (§5). Wpięcie wymaga ustalenia, czy N3 idzie wewnątrz wire'a, czy osobnym krokiem między wire a bankiem.

e) **Mennica.** Pin wywołuje `finalizeMennicaZlotoGraceAfterTick` (`:38404`) po ticku. Wire ma `grace: &mut MennicaZlotoGraceState` (`turn_economy_wire.rs:234–253`), ale `PlayableState` nie ma takiego pola (§4).

---

## 4. Zależności ekonomii a stan `PlayableState`

Wejścia `GameEconomyContext` (`turn_economy_wire.rs:180–215`) i pola `City` używane przez `advance_city_economy` (typ `City` z `terrain::city_founding::p6_6b::cities`, `turn_economy_wire.rs:34`, także `state.rs:1761`) kontra stan DTO:

| Wejście ekonomii | Co pin czyta | Odpowiednik w `PlayableState` (`playable.rs`) | Stan |
|---|---|---|---|
| Miasta (`City`) | id, właściciel, populacja (f64), żywność (`magazyn_zywnosci`), `surowce`, podziały Handlu/Pracy, racje, budowa/okolica/ulepszenia, pola pracujące | `PlayableCity` (`:359–374`): id, owner_id, name, position, is_capital, population (u32), culture (u32). Komentarz `:366`: stan nie symuluje Economy | **Brak** większości pól |
| Stan surowców miast | `surowce`, `magazyn` | `economy.city_stock: BTreeMap<u64, StockRecord>` (`:531`) | Częściowo |
| Skarbiec | `skarbiec` per owner (gracz + AI) | `economy.treasury` (gracz), `economy.ai_treasury_by_owner` (`:539`) | Jest |
| Pula Pracy | `ownerPracaPool` | `economy.praca_pool_by_owner` (`:543`) | Jest |
| Nauka | `nauka` per owner | brak pola | **Brak** |
| Kultura per owner | `kulturaSkumulowana`, `ownerKultura` | brak (tylko `culture` per miasto) | **Brak** |
| Era per owner | `empireEpochForOwner` (`owner_era`) | brak (`PlayablePlayer` ma id, name, civilization, is_human) | **Brak** |
| Technologie per owner | `unlockedTechSetForOwner` (`owner_tech`) | brak | **Brak** |
| Dostęp do złota | `ownerHasNativeResourceAccess` / `hasTradeRouteResourceAccess` | brak | **Brak** |
| Aktywne etykiety zasobów | `empireActiveResourceLabelsForOwner` | brak | **Brak** |
| Zapasy imperium per owner | `ownerEmpireStock` (`owner_empire_stock`) | brak | **Brak** |
| Trasy handlowe | `tradeRoutes` po `recomputeTradeRoutesNow` (`turn_economy_wire.rs:199`) | brak | **Brak** |
| Dochód tras, premie, handel morski | `tradeIncomeByCity`, `maritimeTradeIncomeByCity`, `tradeRouteBuildingBonusByCity` | brak | **Brak** |
| Ręczny podatek z Pracy | `manualWorkTaxByCity` / `pending_manual_work_tax_by_owner` (`turn_economy_wire.rs:201`) | brak | **Brak** |
| Jednostki ekonomii | `econUnits`: ownerId, typeId, garnizon, HP | `PlayableUnit` (`:390`): id, owner_id, kind (**tylko `Warrior`**), position, movement, selected | **Brak** typu, HP, garnizonu |
| Leczenie jednostek (`manpowerHeal`) | units + `getMaxHp` | brak | **Brak** |
| Budynki / katalog | `built_by_city`, `buildings`, `unit_rows` | brak w stanie; dane statyczne poza `PlayableGame` | Dane: NIE_ZMIERZONO, gdzie są ładowane |
| Parametry ekonomii | `econParams`, `difficulty` | `params.difficulty: String` (`StartGameParams`, `:116`); brak `econParams` | Częściowo |
| Trudność utrzymania per owner | `resolveOwnerUpkeepDifficulty` (pin `turn-economy.ts:2395–2400`, `main.ts:38391`) | brak; Rust ma `upkeep_difficulty` w `turn_economy_upkeep.rs:149,161` | **NIE_ZMIERZONO**, czy per owner |
| Łaska Mennicy | `mennicaZlotoGraceState` | brak w `PlayableState` | **Brak** |
| Mnożniki rozkazów | `orderMultByCity` | brak | **Brak** |
| Cuda | `wonderCityYieldsByOwner`, `placedWonders` | `placed_world_wonders` (`:670`, `PlayablePlacedWonder`) | Częściowo |
| Oblężenie | `siegeCities`, `besiegerByCity`, maszyny | `oblegane`, `siege_machines_ready` (`PlayableState`, pola z P4-1F3) | Częściowo (NIE_ZMIERZONO pełna zgodność) |
| Wejście `PlayableGame` | `data` (dane gry) | `PlayableGame` ma tylko `state` i `phase_queue` (`:987–989`) | **Brak** dostępu do danych |

Wniosek: sam `advance_city_economy` wymaga wielu wejść, których `PlayableState` nie przechowuje. Wpięcie w `advance_turn` bez rozszerzenia stanu (albo jawnego przekazania kontekstu) nie jest możliwe. Dodatkowo `PlayableGame` nie trzyma danych statycznych (`econParams`, katalogi), więc trzeba zdecydować, skąd je brać.

---

## 5. NIE_ZMIERZONO / ograniczenia rozpoznania

- Równoważność `runDiplomacyTurnTick` (pin `:38214`) z `run_war_turn` (Rust): nie porównywano treści.
- Produkcyjni wołający `siege_turn.rs` i `siege_surrender.rs`: grep po `rust-port` pokazał wołających tylko w testach (`p6_wire_war_siege_aiai.rs`, `p6_siege_surrender.rs`, `p6_oblezenie_glod.rs`, `p6_repin_oblezenie_obrona.rs`) i w sobie nawzajem. Grep nie widzi wywołań dynamicznych ani przez makra; pewność średnia.
- Pełna zgodność sygnatury pinu `advanceCityEconomy` (`turn-economy.ts:2353–2401`) z `GameEconomyContext`: pin ma późniejsze dodatki (`resolveOwnerUpkeepDifficulty`, `manpowerHeal`, `maritimeTradeIncomeByCity`, `manualWorkTaxByCity`, `resolveOwnerEmpireStock`), których pełne mapowanie na Rust nie zostało przejrzane punkt po punkcie.
- Czy `turn_economy_inputs_*.rs` i `turn_economy_resources.rs` mają własne producenty wejść zasilane z `PlayableState` (nie badane). Ich istnienie nie oznacza podłączenia.
- Czy `run_war_turn` w pinie odpowiada pinowi w kolejności oblężenia (`handleSiegeCapitulationPhase`, opis #63 w rejestrze zadań) — NIE_ZMIERZONO w tym rozpoznaniu.
- Granica Economy/Production (§3.1): propozycja, nie ustalenie.
- Czy kod poza `playable.rs` (np. bridge, `rust-port/**`) wywołuje `advance_turn` inaczej niż przez `PlayableGame` — nie badano.
- Stan mennicy i łaski — gdzie żyje w Rust: NIE_ZMIERZONO.

---

## 6. Wynik dla dispatchu wdrożeniowego (bez implementacji)

1. Wpięcie: gałąź `TurnPhase::Economy` w `advance_turn`, po Diplomacy, przed `phases.push` (§3.2).
2. Wymagany przed wpięciem: rozszerzenie stanu o pola z §4 (kolejność tematów: najpierw stan miast i właścicieli, potem trasy, potem jednostki), albo jawny kontekst przekazywany do `advance_turn`.
3. Decyzje do podjęcia przed implementacją: granica Economy/Production (§3.1); gdzie wpina się etap N3 oblężenia (§3.3 d); czy wire dostaje `grace` z `PlayableState`; skąd brane są dane statyczne.
4. Pin odniesienia: `07d2fbd72`, nie `4bbef081d` (nagłówek `turn_economy_wire.rs`).
5. Test wiążący (propozycja): e2e tury z wejściami z pinu, porównanie pól `EconomyTickResult` i kolejności faz z `runWorldEndTurn`. Nie wykonano.

Brak zmian w kodzie; dokument jest jedynym nowym plikiem tego tematu.
