# AUDYT-LUK-B18 — KNOWN_GAPS, EXPLICIT_ZERO, COMPONENT_SOURCES i moduły bez wołającego

Temat: `R-RUSTPORT-P6-AUDYT-LUK-B18-Q1` (runda 1/5, Operator HAIKU). Temat dokumentacyjny, bez zmian w kodzie i bez `cargo` w zakresie pomiaru.
Zadanie #105 (lista zadań sesji): AUDYT-LUK-B18.

- Baza odczytu: `cf281d785` (= `origin/rust-port/parity-v2` po INTEG-B21).
- Pin (tylko odczyt): `07d2fbd72`.
- Legenda: **NIE_ZMIERZONO** = brak danych lub pomiar niemożliwy grepem. Każda liczba ma źródło (plik:linia albo komenda).
- Nie powtarza `dyspozycje/rust-port/AUDYT-PARYTETU-RANO.md` ani `dyspozycje/rust-port/NIEPODPIETE-MODULY.md`. Uzupełnia je o różnice (§4).

## 0. Metoda

- Stałe: odczyt `rust-port/engine/src/domain/turn_war_inputs.rs`, `brake_power_producers.rs`, `brake_power_rest.rs`. Liczba wpisów z typu tablicy (`[T; N]`) i z tabeli w kodzie.
- Status KNOWN_GAPS: porównanie komentarza z kodem i z testami (§1). Nie ma osobnego rejestru luk w repo, więc status = stan kodu w bazie, nie deklaracja.
- Moduły bez wołającego: dla każdego pliku `rust-port/engine/src/domain/**/*.rs` (poza `mod.rs`) szukanie słowa-stemu (`grep -rnw`) w `rust-port/engine/src` i `rust-port/engine/benches`, poza własnym plikiem. Odrzucone: katalogi `tests/`, linie deklaracji `mod stem`, linie komentarza (`//`). Zero trafień = moduł bez produkcyjnego wołającego. Metoda różni się od AUDYT-PARYTETU-RANO §2 (tam komentarze liczone, plik obcinany po `#[cfg(test)]`). Wynik porównano w §4.
- Kolumna `temat #NN` to heurystyka po nazwie wg listy zadań sesji (#1–#141). Nie jest potwierdzona przez dispatch. Brak dopasowania = NIE_ZMIERZONO.
- Bramka fmt: `cargo fmt --check` (patrz §6). Clippy i testy nie uruchomione (patrz §6).

## 1. KNOWN_GAPS (`turn_war_inputs.rs:98`, `[&str; 5]`)

Liczba wpisów: 5 (linie 99–103). Zgodne z deklaracją `[&str; 5]`.

| Pozycja | plik:linia | status | temat #NN |
|---|---|---|---|
| KNOWN_GAPS[0] epoka wlasciciela (statyczna miedzy turami; brak badan w PlayableState) | `turn_war_inputs.rs:99`; potwierdzenie testem `tests/p6_wire_war_epoch.rs:216` (komentarz „ZNANA LUKA”) | OTWARTA. Producent `turn_war_epoch` jest, ale epoka nie awansuje z badan. | NIE_ZMIERZONO (brak zadania w liście #1–#141 dla awansu epoki z badań) |
| KNOWN_GAPS[1] wspolna granica (producent `shared_border_pairs`; pozycja x,y czytana jak (q,r)) | `turn_war_inputs.rs:100` | CZĘŚCIOWO. Producent wpięty (zadanie #7 „wiring karaWspolnaGranicaDelta” completed). OTWARTE: zgodność siatki x,y z mapą weba = NIE_ZMIERZONO. | #16 (REPIN-DRYFT 3b, pending) dla części „wspólna granica” |
| KNOWN_GAPS[2] populacja i kultura miast nie rosną miedzy turami (brak fazy Economy) | `turn_war_inputs.rs:101` | OTWARTA wg komentarza. Pola stanu `PlayableCity.population/culture` istnieją; brak przyrostu między turami nie zmierzono w pętli tury. | NIE_ZMIERZONO |
| KNOWN_GAPS[3] budynki, tech, religia: magazyny `PlayableStores` puste i niezmienne miedzy turami | `turn_war_inputs.rs:102`; magazyny zdefiniowane w `playable.rs:527` (`buildings_by_city`), `:530` (`researched_techs_by_owner`), `:534` (`religion_by_city`) | NIE_ZMIERZONO. Grep po przypisaniach (`buildings_by_city\s*[:=.]` itp., `rust-port/engine/src`) nie znalazł produkcyjnego zapisu poza definicją i odczytem w `turn_war_inputs.rs:320`. Komentarz w KNOWN_GAPS[3] i zadanie #53 (WIRE-WAR-STORES, completed) wymagają weryfikacji w kodzie produkcyjnym. | #53 (completed), luka otwarta wg komentarza: NIE_ZMIERZONO |
| KNOWN_GAPS[4] TickContext: handel, religia, dobra wola, wiarygodnosc = domyslne | `turn_war_inputs.rs:103` | OTWARTA wg komentarza (PlayableState nie niesie tych pól). | NIE_ZMIERZONO |

Dodatkowo, w `turn_war_inputs.rs:379` komentarz odsyła do KNOWN_GAPS dla trudności `Normal` (`loadReligionParams`). Ten wpis nie jest osobnym wpisem tablicy.

## 2. EXPLICIT_ZERO_REASONS i UNPRODUCED_POWER_COMPONENTS

| Pozycja | plik:linia | status | temat #NN |
|---|---|---|---|
| `EXPLICIT_ZERO_REASONS: [(&str, &str); 0]` | `turn_war_inputs.rs:90` | ZGODNE z komentarzem (linie 85–89): `bitwy` i `zdobycze` mają producentów z akumulatorów, `ulepszenia` ma producenta. Lista pusta. | #86 (POWER-BITWY-ZDOBYCZE, completed) |
| `UNPRODUCED_POWER_COMPONENTS: [&str; 0]` | `turn_war_inputs.rs:95` | ZGODNE z komentarzem (linie 92–94): od r6 klocek 3 lista pusta. | #53 (completed) |

Liczba wpisów: 0 w obu tablicach. Brak wpisu w EXPLICIT_ZERO_REASONS oznacza brak jawnych zer z uzasadnieniem.

## 3. COMPONENT_SOURCES (`brake_power_producers.rs:33`, `[_; 12]`) i REST_COMPONENT_SOURCES (`brake_power_rest.rs:32`, `[_; 6]`)

Stan: 12 wpisów w `COMPONENT_SOURCES`, wszystkie `ComponentSource::RustProducer`. Zero `NoProducer`. `no_producer_keys()` (`brake_power_producers.rs:77`) zwraca pustą listę. Test `tests/p6_power_sources.rs:474` (`no_producer_entries_are_empty_after_power_bitwy_zdobycze`) to egzekwuje, a `tests/p6_power_producers.rs:237` sprawdza `len() == 12`.

| Skladnik | plik:linia | Producent Rust (skrót) | status | temat #NN |
|---|---|---|---|---|
| armia | `brake_power_producers.rs:35` | `brake_power_army::armia_for_owner` | RustProducer | #32 (completed) |
| bitwy | `:39` | `war_turn_state::WarTurnState::battle_power_pts_for` | RustProducer | #86 (completed) |
| ludki | `:42` | `recruitment::manpower::empire_suma_ludkow` | RustProducer | #50 (completed) |
| rekruci | `:44` | `recruitment::manpower::empire_pobor_totals` + `rekrut_unit_equivalents` | RustProducer | NIE_ZMIERZONO |
| miasta | `:47` | liczba miast właściciela (`owner_city_ids`) | RustProducer | NIE_ZMIERZONO |
| terytorium | `:49` | `brake_power_army::terytorium_for_owner` | RustProducer | #32 (completed), #95 (TERYTORIUM-VEC czeka na B19) |
| infra | `:53` | `brake_power_rest::count_buildings_for_owner` | RustProducer | #53 (completed) |
| tech | `:57` | `brake_power_rest::count_tech_for_owner` | RustProducer | #53 (completed) |
| ulepszenia | `:61` | `brake_power_improvements::ulepszenia_for_owner` | RustProducer | #85 (completed) |
| kultura | `:64` | `order_effects_culture::empire_culture_total` | RustProducer | #50 (completed) |
| religia | `:66` | `brake_power_rest::count_cities_with_dominant_state_religion` | RustProducer | #53 (completed) |
| zdobycze | `:70` | `war_turn_state::WarTurnState::zdobycze_power_for` | RustProducer | #86 (completed) |

`REST_COMPONENT_SOURCES` (6 wpisów: bitwy, infra, tech, ulepszenia, religia, zdobycze, linie 34–54): wszystkie `RustProducer`. `rest_no_producer_keys()` (`brake_power_rest.rs:60`) zwraca pustą listę. Zgodność z COMPONENT_SOURCES egzekwuje `tests/p6_power_sources.rs:512–527`.

Uwaga: komentarz COMPONENT_SOURCES w `brake_power_producers.rs:6` mówi o „12 składnikach” i jest zgodny z liczbą wpisów.

Wniosek dla luk: komentarz `KNOWN_GAPS[1]` i `[2]` opisują wejścia producentów (populacja, pozycja), a nie brak producenta. Tabela COMPONENT_SOURCES nie ma luki „brak producenta”.

## 4. Moduły domain bez produkcyjnego wołającego (`src/**` i `benches/**`, bez `tests/`)

Wynik metody z §0: **46 modułów** (plików `rust-port/engine/src/domain/**/*.rs` z zerem trafień poza własnym plikiem). Liczba zgodna z `dyspozycje/rust-port/NIEPODPIETE-MODULY.md` §1 (46 wierszy `MOD`), ale lista nie jest identyczna co do składu; patrz różnice niżej.

Każdy wiersz ma `plik:1` jako linię modułu. Status = „brak wołającego w src/benches (poza tests/)”.

| # | Pozycja (moduł) | plik:linia | status | temat #NN |
|---|---|---|---|---|
| 1 | ai_era_unit_promotion | `src/domain/ai_era_unit_promotion.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 2 | ai_move_range | `src/domain/ai_move_range.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 3 | ai_peace_city_offer | `src/domain/ai_peace_city_offer.rs:1` | brak wołającego | #120 (CRED-HAK-WYPOWIEDZENIE, heurystyka po dyplomacji) |
| 4 | ai_war_march_plan | `src/domain/ai_war_march_plan.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 5 | army_consolidation | `src/domain/army_consolidation.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 6 | army_follow_auto_merge | `src/domain/army_follow_auto_merge.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 7 | auto_improvements/relief_preserving | `src/domain/auto_improvements/relief_preserving.rs:1` | brak wołającego (**nowy względem AUDYT-PARYTETU**) | NIE_ZMIERZONO |
| 8 | battle_mode | `src/domain/battle_mode.rs:1` | brak wołającego (**nowy**; trafienie w `save_load.rs:287` to komentarz doc) | NIE_ZMIERZONO |
| 9 | diplomacy_locks | `src/domain/diplomacy_locks.rs:1` | brak wołającego | #120 (heurystyka) |
| 10 | diplomacy_rejection_cooldown | `src/domain/diplomacy_rejection_cooldown.rs:1` | brak wołającego | #120 (heurystyka) |
| 11 | diplomacy_war_gates | `src/domain/diplomacy_war_gates.rs:1` | brak wołającego | #103 (CRED-WOJNA, heurystyka) |
| 12 | economy_city_terrain | `src/domain/economy_city_terrain.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 13 | formation_rules | `src/domain/formation_rules.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 14 | general_quick_follow | `src/domain/general_quick_follow.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 15 | map_snapshot | `src/domain/map_snapshot.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 16 | mapgen/cluster_compute | `src/domain/mapgen/cluster_compute.rs:1` | brak wołającego (**nowy**) | NIE_ZMIERZONO |
| 17 | mapgen/deposits | `src/domain/mapgen/deposits.rs:1` | brak wołającego (**nowy**) | #104 (ZLOZA-WIRING, heurystyka po nazwie „złoża”) |
| 18 | mapgen/rivers_b/quotas | `src/domain/mapgen/rivers_b/quotas.rs:1` | brak wołającego (**nowy**) | NIE_ZMIERZONO |
| 19 | mapgen/rivers_c | `src/domain/mapgen/rivers_c.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 20 | mapgen/rivers_d | `src/domain/mapgen/rivers_d.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 21 | mapgen/rivers_e1 | `src/domain/mapgen/rivers_e1.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 22 | mapgen/rivers_e2 | `src/domain/mapgen/rivers_e2.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 23 | mapgen/villages | `src/domain/mapgen/villages.rs:1` | brak wołającego (**nowy**) | NIE_ZMIERZONO |
| 24 | replay | `src/domain/replay.rs:1` | brak wołającego (**nowy**; zadanie #13 zamknęło tylko ścieżkę `load_json_with_migration_reports`) | NIE_ZMIERZONO (brak zadania REPLAY-WIRING na liście #1–#141) |
| 25 | roads | `src/domain/roads.rs:1` | brak wołającego (**nowy**) | NIE_ZMIERZONO |
| 26 | siege_city_fortification | `src/domain/siege_city_fortification.rs:1` | brak wołającego | #113 (K5LOOP-WIRING, heurystyka) |
| 27 | siege_engine_build | `src/domain/siege_engine_build.rs:1` | brak wołającego | #113 (heurystyka) |
| 28 | siege_nearby_lock | `src/domain/siege_nearby_lock.rs:1` | brak wołającego | #113 (heurystyka) |
| 29 | siege_sortie | `src/domain/siege_sortie.rs:1` | brak wołającego (**nowy**) | #113 (heurystyka) |
| 30 | siege_tactics_autobatch | `src/domain/siege_tactics_autobatch.rs:1` | brak wołającego | #113 (heurystyka) |
| 31 | siege_tactics_blow_env | `src/domain/siege_tactics_blow_env.rs:1` | brak wołającego | #110 / #113 (heurystyka) |
| 32 | siege_tactics_breach | `src/domain/siege_tactics_breach.rs:1` | brak wołającego | #98 (K5-LOOP-WYLOM) |
| 33 | siege_tactics_class_adapters | `src/domain/siege_tactics_class_adapters.rs:1` | brak wołającego | #92 (KLASY-WIRE, completed) — do weryfikacji |
| 34 | siege_tactics_loop | `src/domain/siege_tactics_loop.rs:1` | brak wołającego | #113 (K5LOOP-WIRING) |
| 35 | siege_transfer | `src/domain/siege_transfer.rs:1` | brak wołającego (**nowy**; skutki przejęcia miasta z #28–#33 nie są podpięte) | #115 (ZDOBYCIE-MIASTA-WIRING) |
| 36 | trade_flow_apply | `src/domain/trade_flow_apply.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 37 | turn_economy_inputs_civ | `src/domain/turn_economy_inputs_civ.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 38 | turn_economy_inputs_native | `src/domain/turn_economy_inputs_native.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 39 | turn_economy_post | `src/domain/turn_economy_post.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 40 | turn_economy_preview | `src/domain/turn_economy_preview.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 41 | turn_economy_wire | `src/domain/turn_economy_wire.rs:1` | brak wołającego (**nowy**) | NIE_ZMIERZONO |
| 42 | war_turn_ai_ai | `src/domain/war_turn_ai_ai.rs:1` | brak wołającego (**nowy**; AI-AI wpięte wg #8/#26 — do weryfikacji) | NIE_ZMIERZONO |
| 43 | war_turn_forced | `src/domain/war_turn_forced.rs:1` | brak wołającego | #120 (declare_forced_wars, heurystyka) |
| 44 | wonder_placement | `src/domain/wonder_placement.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 45 | work_tax | `src/domain/work_tax.rs:1` | brak wołającego | NIE_ZMIERZONO |
| 46 | zapis_loader | `src/domain/zapis_loader.rs:1` | brak wołającego (**nowy**) | NIE_ZMIERZONO |

### 4a. Różnice względem AUDYT-PARYTETU-RANO §2 (33 moduły)

- Wszystkie 33 moduły z AUDYT-PARYTETU-RANO §2 występują także tutaj (potwierdzone).
- Nowe (13), oznaczone „nowy” w tabeli: `auto_improvements/relief_preserving`, `battle_mode`, `mapgen/cluster_compute`, `mapgen/deposits`, `mapgen/rivers_b/quotas`, `mapgen/villages`, `replay`, `roads`, `siege_sortie`, `siege_transfer`, `turn_economy_wire`, `war_turn_ai_ai`, `zapis_loader`.
- Różnica wynika z metody (§0): poprzedni wariant liczył komentarze i obcinał pliki po `#[cfg(test)]`. Ten wariant nie ma tych ograniczeń, ale nie szuka wołań przez ścieżki bez słowa-stemu (jak `use ... as`).
- Zgodność z `NIEPODPIETE-MODULY.md` §2 (46): liczba zgodna. Skład nie sprawdzono pozycja po pozycji (NIE_ZMIERZONO).

### 4b. Uwagi do wyników

- `siege_transfer` i `replay` są zero-wołające mimo zamkniętych zadań #28–#33 i #13. Oznacza to, że logika istnieje w `domain`, a produkcja jej nie wywołuje. Potwierdzenie w ścieżce produkcyjnej: NIE_ZMIERZONO (nie śledzono łańcucha wywołań).
- `battle_mode`: pojedyncze trafienie w `save_load.rs:287` to komentarz doc, więc moduł traktowany jest jako bez wołającego.
- Funkcje `pub fn` bez wołającego nie są w tym audycie (poza zakresem; patrz `NIEPODPIETE-MODULY.md` §3, 886 funkcji).

## 5. Podsumowanie

- KNOWN_GAPS: 5 wpisów. 3 jednoznacznie otwarte wg kodu/testów (epoka, populacja, TickContext). Wspólna granica częściowa. Magazyny (`[3]`) do weryfikacji (NIE_ZMIERZONO).
- EXPLICIT_ZERO_REASONS: 0 wpisów, zgodne z komentarzem.
- COMPONENT_SOURCES: 12 wpisów, 0 `NoProducer`. REST_COMPONENT_SOURCES: 6, 0 `NoProducer`.
- Moduły domain bez produkcyjnego wołającego: 46 (33 z AUDYT-PARYTETU + 13 nowych).

## 6. Bramki

- `cargo fmt --check`: wynik w raporcie operatora (`01-operator-r1.md`).
- `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, testy dotkniętych modułów: NIE_ZMIERZONO w tej rundzie. Powód: zmiana obejmuje wyłącznie plik dokumentacyjny (`dyspozycje/`), bez plików `.rs` (`git diff --name-only`). Cel tematu wg dispatchu: „bez cargo”.

## 7. Pliki i dowody

- Ten dokument: `dyspozycje/rust-port/AUDYT-LUK-B18.md`.
- Raport operatora: `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUDYT-LUK-B18-Q1/01-operator-r1.md`.
- Surowe dowody (liczby §4): komendy z §0 można powtórzyć na bazie `cf281d785`.
