# EKONOMIA — plan pól wejściowych ekonomii w `PlayableState` (dokument, bez kodu)

**Temat:** R-RUSTPORT-P6-EKONOMIA-STAN-PLAN-Q1 (#310)
**Baza:** `origin/rust-port/parity-v2` = `55e00a164`
**Pin odniesienia (web):** `07d2fbd72` (`gra/src/**`, tylko odczyt)
**Wejście:** `dyspozycje/rust-port/p6/EKONOMIA-TURA-FAZY-ROZPOZNANIE.md` §4. Plik nie istnieje w `55e00a164`. Odczytano go z `origin/claude/rust-sivvrn` (commit `d177e4a3a`, dokument rozpoznania). Treść §4 jest zgodna z tym źródłem.

Zakres: tylko plan. Bez kodu, bez cargo, bez zmian w `rust-port/**` i `gra/**`.

---

## 0. Wnioski (streszczenie)

1. Tabela §4 jest w większości trafna dla **przechowywanego** stanu `PlayableState`. Trzy pozycje w §4 są nieścisłe i zostały poprawione niżej:
   - **Technologie per owner** nie są „brak”. Istnieje `stores.researched_techs_by_owner` (`playable.rs:740`, `PlayableStores`). Różnica między `zbadane` (pin) a `unlockedTechSetForOwner` (pin `main.ts:4091`, wywołuje `ownerResearchedTechs`) wymaga sprawdzenia (NIE_ZMIERZONO).
   - **Era per owner** nie jest zapisywana, ale istnieje funkcja wyprowadzająca: `turn_war_epoch.rs:96` (`empire_epoch_for_owner`) i `:118` (`owner_era_facts(&PlayableState)`). Dla człowieka daje epokę startu (`DerivedFromStartEra`), dla AI fallback. Brak badań w stanie oznacza, że nie ma awansu epoki.
   - **Budynki per miasto** są w `stores.buildings_by_city` (`playable.rs:737`). Brakuje tylko katalogu statycznego.
2. Wiele pozycji „Brak” nie wymaga **nowego pola**. Są to wartości pochodne z istniejącego stanu: kultura per owner (suma `PlayableCity.culture`), dostęp do zasobów i etykiety (funkcje czyste w `turn_economy_inputs_native.rs:162,253`), dochód tras (z tras), `manpowerHeal` (z jednostek). Pochodne nie zmieniają zapisu.
3. Pola, które trzeba **przechować**, to: nauka per owner, odroczony podatek z Pracy per owner, stan łaski Mennicy, żywność i podziały/poziomy per miasto, przypisanie jednostek do garnizonu, ewentualnie trasy handlowe (decyzja: wyprowadzać czy trzymać, §3). Każde dodaje się jako `#[serde(default, skip_serializing_if = ...)]`, wzorem `PlayableReplaceEconomy` (`playable.rs:525-545`).
4. Najpierw pochodne i pola per owner (najmniejszy zakres), potem stan per miasto, na końcu trasy, rozkazy i dane statyczne (§4).

---

## 1. Mapa: stan w `PlayableState` a domena Rust

Stan obecny (`rust-port/engine/src/domain/playable.rs`):

| Struktura | Pola istotne dla ekonomii | Linie |
|---|---|---|
| `PlayableState` | `cities`, `units`, `economy`, `stores`, `war`, `forts`, `oblegane`, `siege_machines_ready`, `placed_world_wonders`, `planned_marches` | `:588-670` |
| `PlayableCity` | `id, owner_id, name, position, is_capital, population: u32, culture: u32` | `:359-374` |
| `PlayableUnit` | `id, owner_id, kind (tylko Warrior), position, movement, movement_max, selected` | `:390-399` |
| `PlayableReplaceUnit` | `type_id, category, hp, hp_max, replace_used_this_turn, battles_survived, parametry_bonus_proc` | `:494-520` |
| `PlayableReplaceEconomy` | `treasury, city_stock, units, ai_treasury_by_owner, praca_pool_by_owner` | `:525-545` |
| `PlayableStores` | `buildings_by_city, researched_techs_by_owner, religion_by_city` | `:734-744` |
| `StartGameParams` | `epoch_id, difficulty: String` | `:111-141` (`difficulty` `:116`) |
| `PlayableGame` | `state`, `phase_queue` (bez danych gry) | `:987-989` |

Stan domeny (pełne typy, których `PlayableState` nie trzyma):

| Typ | Plik:linia | Uwagi |
|---|---|---|
| `City` (pełne pola miasta) | `rust-port/engine/src/domain/state.rs:1761` | `magazyn_zywnosci: Option<FoodBuffer>` (`:1768`), `surowce` (`:1769`), `podzial_handlu(_override)` (`:1770-1771`), `podzial_pracy(_override)` (`:1772-1773`), `poziom_racji(_override)` (`:1774-1775`) |
| `GameEconomyContext` | `rust-port/engine/src/domain/turn_economy_wire.rs:180-215` | wejścia `advance_city_economy`: `trade_routes` (`:199`), `pending_manual_work_tax_by_owner` (`:201`), `econ_units` (`:204`), resolvery `owner_era`, `owner_tech`, `native_zloto_access`, `empire_active_labels` (zamknięcia) |
| `advance_city_economy` | `rust-port/engine/src/domain/turn_economy_tick.rs:270` | rdzeń ekonomii miast (ten sam kształt co pin `advanceCityEconomy`) |
| Producenci wejść | `turn_economy_inputs_native.rs` (`:162` owner_has_native_resource_access, `:228` owner_native_or_trade_zloto_access, `:253` empire_active_resource_labels_for_owner, `:343` order_mult_map); `turn_economy_inputs_state.rs` (`:14` MennicaZlotoGraceState, `:46/:63` prepare/finalize, `:136` build_manual_work_tax_by_city); `turn_economy_inputs_trade.rs` (`:40` TradeTickInputs, `:49` build_trade_tick_inputs); `turn_economy_inputs_podzial.rs` (`:18-81` domyślne podziały właściciela); `turn_economy_inputs_civ.rs` (`:15`); `turn_economy_inputs_wonders.rs` (`PlacedWonderRef` `:41`) | to są funkcje/typy domeny, zasilane **z jakiego stanu** — NIE_ZMIERZONO w całości, ale wiadomo, że czytają to, co już jest w `PlayableState` oraz pełne `City` |
| `TradeRoute` | `rust-port/engine/src/domain/trade.rs:427` | |
| `EconUnit`, `ManpowerHealUnit` | `turn_economy_tick.rs:57`, `:64` | |
| `OrderYieldMults` | `turn_economy_loop.rs:107` | |

Wniosek architektoniczny (zgodny z §4 rozpoznania): `advance_city_economy` potrzebuje pełnego modelu miasta (`City`), a `PlayableState` trzyma `PlayableCity` z 7 polami. Jest to ta sama luka, którą opisuje §4. Rozwiązania (decyzja, §5): (a) rozszerzyć `PlayableState` o przechowywane mapy per miasto i per owner, albo (b) zbudować `Vec<City>` z `PlayableState` tuż przed wywołaniem ekonomii (bez przechowywania). Wariant (b) dla pól pochodnych nie zmienia zapisu.

Fazy: `playable.rs:1683` mapuje `TurnPhase::Economy` na `TurnEvent::EconomyTick`. Treść gałęzi w `advance_turn` (`:1400`) NIE_ZMIERZONO w tym dokumencie. Zadanie #304 (`EKONOMIA-TURA: wpiąć run_economy_tick w advance_turn`) jest w rejestrze oczekujące, więc ekonomia nie jest wpięta.

---

## 2. Tabela pól: pin ↔ Rust ↔ propozycja

Legenda kolumny „Zapis”: **nie** = pochodne, zero wpływu na JSON; **tak** = nowe pole serde, pomijane gdy domyślne (pattern P6-UNIT-REPLACE-L3). Pin: pliki w `gra/src/**` przy `07d2fbd72`.

### 2A. Już w Rust pod inną nazwą (nie duplikować)

| Wejście | Pin (gdzie czyta) | Rust (gdzie już jest) | Status |
|---|---|---|---|
| Skarbiec gracza | `playerState.ts:91` (`skarbiec`) | `economy.treasury` (`playable.rs:528`) | JEST |
| Skarbce AI | `aiSkarbiecByOwner` | `economy.ai_treasury_by_owner` (`:539`) | JEST |
| Pula Pracy per owner | `ownerPracaPool` | `economy.praca_pool_by_owner` (`:543`) | JEST |
| Surowce miast | `City.surowce?` (`cities.ts:819`) | `economy.city_stock` (`:531`, `StockRecord`) | CZĘŚCIOWO (typ `StockRecord` vs `Record<string,number>`, NIE_ZMIERZONO zgodność kluczy) |
| Zbadane technologie | `PlayerState.zbadane` (`playerState.ts:95`), `unlockedTechSetForOwner` → `ownerResearchedTechs` (`main.ts:4091-4093`) | `stores.researched_techs_by_owner` (`playable.rs:740`) | CZĘŚCIOWO (zbiór jest; różnica `unlocked` vs `researched` NIE_ZMIERZONO) |
| Budynki miasta (`blt`) | `City.budowa…`/`cityBuilt` | `stores.buildings_by_city` (`:737`) | JEST (katalog statyczny brak, §4) |
| Religia miast | `cityRelig` | `stores.religion_by_city` (`:744`) | JEST |
| Cuda na mapie | `placedWorldWonders` (`main.ts:4025`) | `placed_world_wonders` (`:670`) | JEST |
| Oblężenie | `City.oblegane` (`cities.ts:858`) | `oblegane` (`:659`) | JEST |
| Maszyny oblężnicze gotowe | `City.siegeMachines.ready` (`cities.ts:~883`) | `siege_machines_ready` (`:665`) | JEST |
| Populacja miasta | `City.population` (`cities.ts:808`) | `PlayableCity.population: u32` (`:369`) | JEST, ALE typ: pin `number` (ułamkowy `wzrostUlamkowy`, `cities.ts:~918`), Rust `u32` — DECYZJA (§5) |
| Kultura miasta | `City.kulturaSkumulowana` (`cities.ts:1008`) | `PlayableCity.culture: u32` (`:373`) | JEST, ALE typ: pin `number`, Rust `u32` — DECYZJA (§5) |
| Poziom trudności | `difficulty` (`main.ts`, `econParams`) | `params.difficulty: String` (`:116`) | CZĘŚCIOWO (per owner: NIE_ZMIERZONO) |
| Stan zamiany jednostek (HP, typ) | `unit.hp`, `unit.type` | `economy.units` / `PlayableReplaceUnit` (`:494-520`) | JEST (dla zamian) |
| Domyślne podziały właściciela | `ownerDefaultPodzial…` | `turn_economy_inputs_podzial.rs:18-81` (domena) | JEST w domenie, nie w stanie |

### 2B. Pochodne — NIE dodawać pola (zapis bez zmian)

| Wejście | Pin | Wyprowadzenie w Rust | Uwaga |
|---|---|---|---|
| Kultura per owner | `power-objective.ts:45` (suma `kulturaSkumulowana` imperium) | suma `PlayableCity.culture` po `owner_id` | ALE typ u32 (§5) |
| Era per owner | `empireEpochForOwner`, `main.ts:2419-2422` (`playerStateByHuman.era` / `ownerEraByOwner` / `gameStartEra`) | `turn_war_epoch.rs:96` + `owner_era_facts` `:118` | Człowiek = epoka startu; AI = fallback. Brak trwałego badania, więc awansu nie ma. Prawdziwa era wymaga `zbadane` (2A) |
| Dostęp do złota / zasobów | `ownerHasNativeResourceAccess`, `main.ts:5753` | `turn_economy_inputs_native.rs:162`, `:228` (czyste funkcje) | Potrzebuje `buildings_by_city` + miast (już są) |
| Etykiety aktywnych zasobów | `empireActiveResourceLabelsForOwner`, `main.ts:3507-3510` | `turn_economy_inputs_native.rs:253`, `StateSources::empire_active_labels` `:330` | Jak wyżej |
| Mnożniki rozkazów | `orderMultByCity` (`turn-economy.ts:1918, 2118`) | `turn_economy_inputs_native.rs:343` `order_mult_map` | Źródło rozkazów NIE_ZMIERZONO (patrz 4.5) |
| Dochód tras, premie, handel morski | `tradeIncomeByCity` (`turn-economy.ts:2371`), `maritimeTradeIncomeByCity` (`:2391`, `main.ts:38316`), `tradeRouteBuildingBonusByCity` (`:2369`, `main.ts:18684`) | z tras: `turn_economy_inputs_trade.rs:49` `build_trade_tick_inputs` | Zależne od decyzji o trasach (§3, §4.4) |
| Leczenie jednostek (`manpowerHeal`) | `turn-economy.ts:2383`, `manpower.ts:160` | `turn_economy_tick.rs:64` `ManpowerHealUnit` z jednostek | Brak pola; wejście z `units` i `economy.units` (`hp`, `hp_max`) |

### 2C. Do przechowania (nowe pola) — propozycja

Wzorzec: nowa struktura `PlayableEconomyCities` (per miasto) i rozszerzenie `PlayableReplaceEconomy` (per owner), każde pole `#[serde(default, skip_serializing_if = ...)]`. Nazwy są propozycją. Typy `f64` z walidacją NaN/Inf w `set_*` (wzorem `PlayableReplaceEconomy`, `playable.rs:552-560`).

| # | Wejście | Pin (plik:linia) | Typ w Rust (domena) | Proponowane pole w `PlayableState` | Domyślna (serde) | Zapis | Uwaga |
|---|---|---|---|---|---|---|---|
| N1 | Nauka per owner (zgromadzona, niewydana) | `playerState.ts:93` (`nauka`), `save.ts:324` | `f64` | `economy.nauka_by_owner: BTreeMap<u64, f64>` | pusta (pomijana) | tak | Pin zapisuje `nauka` w `save.ts`. Dla AI: NIE_ZMIERZONO, czy pin trzyma nauka AI |
| N2 | Odroczony podatek z Pracy per owner | `main.ts:14206` (`pendingManualWorkTaxByOwner`), zapis `main.ts:37285`, odczyt `main.ts:46992-46994` | `BTreeMap<i64,f64>` (`turn_economy_wire.rs:201`) | `economy.pending_manual_work_tax_by_owner: BTreeMap<u64,f64>` | pusta | tak | Pin zapisuje to pole w zapisie (`serializePendingWorkTax`) |
| N3 | Łaska Mennicy (zloto) | `main.ts:5626` (`mennicaZlotoGraceState`) | `MennicaZlotoGraceState` (`turn_economy_inputs_state.rs:14`), `prepare`/`finalize` (`:46`, `:63`) | `economy.mennica_zloto_grace: <struktura>` | puste | NIE_ZMIERZONO (czy pin zapisuje; grep w `save.ts` nie znalazł nazwy) | Domena ma gotowe `clear`/`prepare`/`finalize` |
| N4 | Żywność w magazynie miasta | `cities.ts:809` (`magazynZywnosci?`) | `Option<FoodBuffer>` (`state.rs:1768`) | `economy.city_food: BTreeMap<u64, FoodBuffer>` (lub `f64`) | pusta | tak | Reuse typu `FoodBuffer` |
| N5 | Podział Handlu i Pracy per miasto + override | `cities.ts:891-901` (`podzialHandlu`, `podzialPracy`, `…Override`) | `Option<CityPodzialHandlu>` (`state.rs:1771`), `…Pracy` (`:1773`) | `economy.city_podzial: BTreeMap<u64, PlayableCityPodzial>` | `None` / override `false` | tak | Domyślne per owner już w domenie (`turn_economy_inputs_podzial.rs`) |
| N6 | Poziom racji per miasto + override | `cities.ts:905, 913` (`poziomRacji`, `poziomRacjiOverride`) | `Option<f64>` (`state.rs:1774`) | pole w `PlayableCityPodzial` albo osobna mapa | `None` | tak | |
| N7 | Fokusy okolicy / budowy / ulepszeń + tryby | `cities.ts:928-962` (`okolicaFocus`, `budowaFocus`, `ulepszeniaFocus` i tryby/override) | enumy domeny | `economy.city_focus: BTreeMap<u64, PlayableCityFocus>` | `None` | tak | Ustawiane komendami gracza (zakres komend NIE_ZMIERZONO) |
| N8 | Przypisanie jednostki do garnizonu miasta | `main.ts:38233` (`econUnits`: `inGarnizon`, `garrisonCityId`) | `EconUnit` (`turn_economy_tick.rs:57`) | `economy.unit_garrison: BTreeMap<u64, u64>` (jednostka → miasto) | pusta | tak | Pozostałe pola `EconUnit` (typ, HP) z `units` i `economy.units` |
| N9 | Ekonomiczne „hp” jednostek | `main.ts:38233` | `EconUnit` | brak nowego pola: `economy.units[id].hp` / `hp_max` (`:503-506`) | `None` = `oldMaxHp` | tak (już) | Pokrycie istniejące |
| N10 | Dane statyczne (katalogi, `econParams`) | `loader.ts:24, 378, 416` (`econParams`, katalogi budynków) | `econ_params: &Value` (`turn_economy_wire.rs:184`) | NIE w stanie — parametr `PlayableGame` | n/d | nie | Patrz 4.6 |

Kolumna „Zapis = tak” oznacza też konieczność **golden** (sekcja 5, V9).

---

## 3. Decyzje do podjęcia przed implementacją

Każda decyzja ma wariant A/B/C w osobnym pytaniu ABC (zasada 10 `CLAUDE.md`), tu tylko lista.

- **D1 — trasy handlowe: wyprowadzać czy przechowywać.** Pin przelicza `tradeRoutes` przez `recomputeTradeRoutesNow` (`main.ts:18649`), czyli są pochodne od stanu. Rekomendacja (do potwierdzenia): wyprowadzać; zapis bez zmian.
- **D2 — typ `population` i `culture` w `PlayableCity`.** Pin: `number` (ułamkowe). Rust: `u32`. Zmiana na `f64` zmienia zapis (`golden`). Rekomendacja: `f64` przed wpięciem ekonomii, żeby nie łamać wzrostu ułamkowego.
- **D3 — skąd `Vec<City>` dla `advance_city_economy`.** Wariant (a): przechowywać mapy per miasto (N4–N7). Wariant (b): budować `City` z `PlayableState` tuż przed tyk. Rekomendacja: (a) dla danych, które gracz ustawia i które muszą przetrwać zapis; (b) dla pochodnych.
- **D4 — dane statyczne w `PlayableGame`.** Dane (`econParams`, katalogi) nie są w stanie. Trzeba wybrać: wstrzykiwać przy konstrukcji `PlayableGame` (bez zapisu), czy czytać z pliku przy starcie. Rekomendacja: wstrzykiwać (bez zapisu, zgodnie z zasadą „dane nie w zapisie”).
- **D5 — era per owner.** Brak `zbadane` per owner w stanie, więc era człowieka = epoka startu. Wymaga decyzji, czy `PlayerState.era` ma być przechowywane po awansie (wtedy N-pole), czy pozostać przy wyprowadzeniu.
- **D6 — trudność utrzymania per owner.** Pin: `resolveOwnerUpkeepDifficulty` (`turn-economy.ts:2400`, `main.ts:38391`). Rust: `upkeep_difficulty` (`turn_economy_upkeep.rs:149,161`). NIE_ZMIERZONO, czy trudność różni się per owner.

---

## 4. Kolejność dodawania (najmniejszy zakres najpierw)

1. **Etap 0 — pochodne, zero zapisu.** Kultura per owner (suma), dostęp do zasobów i etykiety (funkcje czyste `turn_economy_inputs_native.rs`), era z `owner_era_facts`. Testy: wektory z pinu (V3, V6).
2. **Etap 1 — skalary per owner.** N1 (nauka), N2 (podatek z Pracy), N3 (łaska Mennicy). Każde pole `#[serde(default, skip_serializing_if)]`.
3. **Etap 2 — per miasto.** N4 (żywność), N5–N6 (podziały i racje), N7 (fokusy). Wymaga D2 (typ populacji) przed startem, bo zmienia się kształt `PlayableCity`.
4. **Etap 3 — jednostki.** N8 (garnizon) i użycie `economy.units` jako `EconUnit`. Test: `manpowerHeal` (V7).
5. **Etap 4 — trasy i rozkazy.** Trasy wyprowadzane (D1), premie tras z tras. Mnożniki rozkazów po ustaleniu źródła rozkazów w stanie (4.5). Wpięcie `advance_city_economy` (#304) dopiero po etapach 0–3.
6. **Etap 5 — dane statyczne i trudność per owner.** D4, D6.

Każdy etap: osobny dispatch Operatora, osobne wektory, osobny FC (zgodnie z procesem).

### 4.4 Trasy
Pochodne od `TradeRoute` (`trade.rs:427`). Wejście do wyprowadzenia: `build_trade_tick_inputs` (`turn_economy_inputs_trade.rs:49`). Pin: `recomputeTradeRoutesNow` (`main.ts:18649`) i `computeTradeRouteBuildingBonusByCity(tradeRoutes)` (`main.ts:18684`).

### 4.5 Rozkazy
`orderMultByCity` zasilane przez `order.ts` (B2-Q6, `turn-economy.ts:1329`). Rust: `order_effects_lane.rs` (`:880`, `grace_turns_left`) i `order_mult_map` (`turn_economy_inputs_native.rs:343`). Źródło rozkazów w `PlayableState` — NIE_ZMIERZONO.

### 4.6 Dane statyczne
Pin ładuje `econParams` (`loader.ts:378, 416`) i katalogi. Rust: `GameEconomyContext::econ_params: &Value` (`turn_economy_wire.rs:184`). Brak miejsca w `PlayableGame` (`playable.rs:987-989`). Decyzja D4.

---

## 5. Testy wektorowe (propozycja)

Istniejące testy Rust, które można rozszerzyć (zgodnie z wzorcem): `p6_adv_city_econ_pipeline.rs`, `p6_adv_q6_wire.rs`, `p6_trade_pin.rs`, `p6_repin_b3_route.rs`, `p6_8h_access.rs` (dostęp), `p6_7a_growth.rs` (`poziom_racji`), `p6_7b_gate.rs`.

| ID | Co sprawdza | Źródło wektora (pin) | Etap |
|---|---|---|---|
| V1 | Nauka po tyku = nauka przed + wkład (`economy.ts:1035`) | fixture z pina | 1 |
| V2 | Podatek z Pracy: zapis i wczytanie zachowują kwotę per owner | `main.ts:37285`, `:46992-46994` | 1 |
| V3 | Kultura per owner = suma `kulturaSkumulowana` (`power-objective.ts:45`) | fixture z pina | 0 |
| V4 | Łaska Mennicy: `prepare` przed tykiem, `finalize` po (`main.ts:5626`) | `turn_economy_inputs_state.rs:46,63` vs pin | 1 |
| V5 | Żywność miasta: wzrost i spadek (`cities.ts:809`) | `p6_7a_growth.rs` | 2 |
| V6 | Dostęp do złota i etykiety per owner (`main.ts:5753`, `:3507`) | `p6_8h_access.rs` | 0 |
| V7 | `manpowerHeal`: cap i wzór (`manpower.ts:160`) | fixture z pina | 3 |
| V8 | Trasy: przeliczenie = pin (`main.ts:18649`) | `p6_trade_pin.rs`, `p6_repin_b3_route.rs` | 4 |
| V9 | **Golden zapisu**: stary JSON bez nowych pól wczytuje się i zapisuje bajt w bajt | wzorzec `PlayableReplaceEconomy` | każdy etap |
| V10 | NaN/Inf odrzucane w `set_*` dla nowych `f64` | wzorzec `economy` | każdy etap |
| V11 | Mutacja: usunięcie `#[serde(default)]` musi dać FAIL na V9 | test czułości | każdy etap |

---

## 6. NIE_ZMIERZONO / ograniczenia

- Treść gałęzi `EconomyTick` w `advance_turn` (`playable.rs:1400`) — nie przeczytano w całości (zadanie #304 oczekuje).
- Czy `unlockedTechSetForOwner` (pin) i `zbadane` (pin) dają ten sam zbiór — nie porównano.
- Pełne mapowanie `GameEconomyContext` (`turn_economy_wire.rs:180-215`) na pola pinu `advanceCityEconomy` (`turn-economy.ts:2353-2401`).
- Czy pin zapisuje `mennicaZlotoGraceState` i nauka AI (N1, N3).
- Źródło `ownerEmpireStock` po stronie pinu: w `turn-economy.ts:2379` jest parametr `resolveOwnerEmpireStock`, ale producenta w `main.ts` nie znaleziono.
- Źródło `orderMultByCity` w stanie Rust (4.5).
- Czy `resolveOwnerUpkeepDifficulty` różni się per owner (D6).
- Które `turn_economy_inputs_*.rs` są wołane produkcyjnie (nie wołane = tylko testy). Istnienie producenta nie oznacza podłączenia.
- Wealth/administrator/bunt miasta (`City.wealthState`, `rebelState`, `revoltGraceRemaining`; pin `cities.ts:1006` i niżej) — poza listą §4, ale mogą być potrzebne ekonomii. Do rozpoznania osobno.
- Wszystkie numery linii pinu odczytane przez `git grep`/`git show` przy `07d2fbd72`. Numery linii w `playable.rs` odczytane z drzewa `55e00a164`.

---

## 7. Wynik dla dispatchu wdrożeniowego (bez implementacji)

1. Najpierw Etap 0 (pochodne, V3 i V6). Nie zmienia zapisu, można go zrobić bez decyzji D1–D6 poza D2 (kultura u32).
2. Przed Etapem 2: decyzja D2 (typ populacji i kultury) i D3 (dwa warianty przechowywania).
3. Przed Etapem 5: D4 i D6.
4. Test wiążący zapisu: V9 dla każdego etapu.

Brak zmian w kodzie. Dokument jest jedynym nowym plikiem tematu (plus raport operatora w `dyspozycje/autobot/runs/R-RUSTPORT-P6-EKONOMIA-STAN-PLAN-Q1/`).
