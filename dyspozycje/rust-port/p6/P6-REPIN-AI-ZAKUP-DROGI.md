# P6 REPIN — AI-ZAKUP-REALNY-STAN-DROGI (tabela luk, runda 1)

TEMAT: R-RUSTPORT-REPIN-AI-ZAKUP-REALNY-STAN-DROGI-Q1
BAZA: rust-port/parity-v2 = 6d74770df; web = origin/main 638e90bea (FALA 563–606, pomiar DELTA-6 §Temat #10).
STATUS RUNDY 1: POMIAR WYKONANY, KOD NIEZMIENIONY (brak cargo, brak testów p6_repin_ai_zakup_* z wektorami stanu surowców).

## Część (a) — AI kupuje jednostki wg realnego stanu surowców

| Strona | Miejsce | Stan | Uwaga |
|---|---|---|---|
| web | `gra/src/game/ai-resource-needs.ts` `detectOwnerResourceNeeds` (origin/main) | ZMIERZONO: istnieje; deficyt magazynu + kolejka budowy + kolejka jednostek (`unitStockCost`) + utrzymanie (`upkeepDemand`) + żywność | wywołanie: `gra/src/main.ts:22820` |
| web | `gra/src/game/ai.ts:7332` `shouldAIPurchaseUnit` (rezerwa 10/3/0) | ZMIERZONO: bramka złoto + Manpower + rezerwa utrzymania | wywołania: `main.ts:42441`, `ai-unit-replace-plan.ts:83` |
| web | `purchaseRecruitmentUnit` (main.ts) | wspólna ścieżka gracz/AI; walidacja zasobów rekrutacyjnych atomowo | NIE_ZMIERZONO szczegóły wnętrza (nie czytano w rundzie 1) |
| Rust | `domain/ai_zakup_jednostki.rs` | ZMIERZONO: port `should_ai_purchase_unit` + `load_ai_purchase_reserve_params` (1:1 z ai.ts:7207–7262 pin 679ab078a) | brak wywołania poza testem `tests/p6_repin_ai_zakup_rezerwa.rs` |
| Rust | `domain/recruitment.rs` | ZMIERZONO: `validate_recruitment`, `spend_recruitment`, `try_spend`, `can_afford_recruitment` (koszt surowcowy, atomowy) | prymityw istnieje |
| Rust | `data/derived.rs` `UNIT_STOCK_COSTS_JSON` | ZMIERZONO: `data/derived/unit-stock-costs.json` wczytywany | — |
| Rust | `domain/ai_resource_needs*.rs` | ZMIERZONO: NIE ISTNIEJE (grep `ai_resource_needs`/`detect_owner_resource_needs`: 0 trafień) | LUKA: do utworzenia (NOWY plik, allowlista) |
| Rust | `domain/ai_turn.rs` | ZMIERZONO: 0 wywołań zakupu/rekrutacji AI (grep `recruit|purchase|zakup`: brak wiązania) | LUKA: podpięcie zakupu AI do tury — dług „podpięcie zakupu AI do tury" (#109) |

**Wniosek (a):** w Rust istnieją prymitywy (kosztowanie surowcem, bramka rezerwy), ale AI nie ma ścieżki zakupu w turze ani planera deficytów surowcowych per owner. Luki = ZAŁOŻENIE: zakup AI używa `validate_recruitment` na realnym magazynie państwa (jak gracz) i bramki `should_ai_purchase_unit`; bez magicznych zasobów.

## Część (b) — drogi gracza = drogi AI (ROAD-BUILD-PLAYER-PARITY, web FALA 596)

| Strona | Miejsce | Stan | Uwaga |
|---|---|---|---|
| web | `gra/src/game/road-network-plan.ts:109` `planRoadNetwork` | ZMIERZONO: istnieje | plan sieci MIĘDZY miastami właściciela |
| web | `gra/src/game/auto-improvements.ts:848–852` `roadPlanHexes` | ZMIERZONO | heksy dozwolone pod droga/droga_brukowana |
| web | `gra/src/map/improvement-build.ts:956–1053` (R-WEB-ROAD-BUILD-PLAYER-PARITY-WITH-AI-Q1) | ZMIERZONO: droga blokowana TYLKO gdy heks już ma drogę; powód odmowy `:978` | reguła wspólna gracz/AI |
| web | `gra/src/main.ts:15668` powód odmowy dla gracza | ZMIERZONO | ta sama reguła `qualifies('droga')` |
| Rust | `domain/auto_improvements/road_network_plan.rs:199` `plan_road_network` | ZMIERZONO: istnieje | odpowiednik planu sieci |
| Rust | `domain/improvement_build.rs:988` `hex_has_road`, `:1086` `is_road_qualified` | ZMIERZONO | odpowiednik reguły kwalifikacji |
| Rust | `domain/roads.rs` (`is_road_improvement_key`, `hex_has_road`, `collect_road_keys`) | ZMIERZONO | modyfikatory ruchu |
| Rust | ścieżka budowy GRACZA (osobna od AI) | NIE_ZMIERZONO w rundzie 1 | czy `is_road_qualified` jest wołane z ruchu gracza, nie tylko z auto-ulepszeń: do sprawdzenia w rundzie 2 |

**Wniosek (b):** odpowiedniki istnieją po obu stronach. Luka parity (czy gracz używa tej samej kwalifikacji co AI) = NIE_ZMIERZONO; w rundzie 2 zmierzyć przez grep wywołań `is_road_qualified` / `plan_road_network` z ścieżek gracza. Partia 2 (zgodnie z dispatchem: „(b) w partii 2").

## Wektory (do wykonania w rundzie 2)

- Źródło: `git archive origin/main gra/src gra/data` poza repo, Node 22 — NIE wykonano w rundzie 1.
- Testy docelowe: `rust-port/engine/tests/p6_repin_ai_zakup_*` (istniejący: `p6_repin_ai_zakup_rezerwa.rs`, katalog `p6_repin_ai_zakup_vectors/`).

## Bramki

- fmt / clippy / cargo test: NIE_ZMIERZONO w rundzie 1 (brak zmian kodu Rust; baseline nieuruchomiony).

## Ograniczenia

- Runda 1 = pomiar + tabela; bez implementacji. Pozostaje: (a) nowy `ai_resource_needs.rs` + wiązanie w `ai_turn.rs`; (b) pomiar wywołań ścieżki gracza.

---

## Runda 2 (Operator, 2026-11-11)

### (a) Port `detectOwnerResourceNeeds` — ZROBIONE (partia 1)

| Element | Web (origin/main f9c6300c6) | Rust | Status |
|---|---|---|---|
| deficyty magazynu (`detectPricedResourceDeficits`, sort po luce) | `diplomacy-resource-trade-pick.ts:34` | `domain/ai_resource_needs.rs::detect_priced_resource_deficits` | PORT 1:1 |
| koszt budynków w kolejce (FALA2 x2) | `ai-resource-needs.ts:45` + `building-stock-cost.ts` | `resource_keys_needed_for_building_queue` + `building_costs::p6_7b::scale_stock_cost_record` | PORT |
| koszt jednostek w kolejce | `ai-resource-needs.ts:70` | `resource_keys_needed_for_unit_queue` | PORT (wejście = rekord kosztu, źródło po stronie wywołującego) |
| utrzymanie surowcowe (`upkeepDemand`) | `ai-resource-needs.ts:136` | `detect_owner_resource_needs` (wejście `&[(String,f64)]`, kolejność wstawiania) | PORT |
| żywność < próg (domyślnie 8) | `ai-resource-needs.ts:141` | `detect_owner_resource_needs` | PORT |
| `urgentKeys` (< ¼ pakietu / żywność) | `ai-resource-needs.ts:151` | `detect_owner_resource_needs` | PORT |

ZAŁOŻENIA (partia 1):
- Kolejność kluczy WEWNĄTRZ jednego kosztu budynku/jednostki: web = kolejność wstawiania z JSON; Rust `BTreeMap` w danych gubi ją, więc wejście to `Vec<(String, _)>` w kolejności JSON podanej przez wywołującego. Wpływa tylko na kolejność remisów w `deficitKeys`, nie na przynależność.
- `Map(goods)` w kolejkach = ostatni wpis wygrywa; `find` (deficyty, utrzymanie) = pierwszy wpis. Odtworzone 1:1.
- Źródło danych kosztu jednostki po stronie Rust (`unit-stock-costs.json`) NIE podpięte w tej partii: funkcja przyjmuje lookup.

Wektory: `rust-port/engine/tests/p6_repin_ai_zakup_needs_vectors/needs-vectors.json` (248 przypadków: 8 ręcznych brzegów + 240 losowych deterministycznych), generator `gen-needs-vectors.mjs` (Node 22, `--experimental-transform-types`, `register.mjs`/`hooks.mjs` rozwiązują importy bez `.ts`/JSON) uruchamia PRAWDZIWY `detectOwnerResourceNeeds` z `git archive origin/main gra/src gra/data`. Test: `tests/p6_repin_ai_zakup_needs.rs` (2 testy, PASS).

### Wiązanie w `ai_turn.rs` — NIE ZROBIONE (partia 2)

Pomiar (grep): `ai_turn.rs` nie ma kroku zakupu/rekrutacji AI (0 trafień `recruit|purchase|zakup`), a `should_ai_purchase_unit` jest wołany tylko z testu rezerwy. Web wiąże zakup z `shouldAIPurchaseUnit` + `ownerSurowcePoolFor` (main.ts ~42441, ~22818). Brak istniejącego kroku w Rust oznacza, że wiązanie to nowy moduł wykonawczy (wybór kandydata, koszt magazynu państwa przez `validate_recruitment`/`spend_recruitment`, egzekucja). To przekracza partię ≤600 LOC; przenosi się do partii 2.

### (b) Drogi gracza = AI — POMIAR (ZMIERZONO grepem), bez zmian kodu

| Ścieżka | Miejsce w Rust | Reguła kwalifikacji |
|---|---|---|
| Gracz (`can_build`, `get_qualifying_hexes`) | `improvement_build.rs:1258` gałąź `k::DROGA` → `is_road_qualified` (`:1086`) | `teren_ladu` && `in_player_territory` && `is_road_qualified` |
| AI/auto (`sh.qualifies` z `single_pass.rs:132`) | ten sam `Qualifier` (`improvement_build.rs:1173`), więc DROGA też przez `is_road_qualified` | wspólna |
| AI plan sieci (`single_pass.rs:118` → `plan_road_network`) | `auto_improvements/road_network_plan.rs:199`; używa `hex_has_road` (`:111`), NIE `is_road_qualified` | RÓŻNA od kwalifikatora gracza |

Wniosek: w Rust AI buduje drogi DWIEMA ścieżkami (kwalifikator dla pojedynczych kroków, `plan_road_network` dla sieci). Czy `plan_road_network` odpowiada web `planRoadNetwork` (road-network-plan.ts) i czy web gracza używa tej samej reguły co AI (improvement-build.ts:956–1053) — to jest do zrobienia w partii 2 i NIE jest rozstrzygnięte w tej rundzie (NIE_ZMIERZONO co do zgodności z webem, ZMIERZONO co do ścieżek Rust).

## Bramki (runda 2)

- `cargo fmt` (nowe pliki): PASS (`rustfmt --check`).
- `cargo clippy --lib --test p6_repin_ai_zakup_needs --test p6_repin_ai_zakup_rezerwa -- -D warnings`: PASS.
- `cargo test --lib`: 22 passed, 0 failed.
- `cargo test --test p6_repin_ai_zakup_needs`: 2 passed, 0 failed (248 wektorów z webu).
- `cargo test --test p6_repin_ai_zakup_rezerwa`: 5 passed, 0 failed.
- Baseline PRZED zmianą (na 390265868) NIE uruchomiony osobno: NIE_ZMIERZONO. Zmiana jest addytywna (nowy moduł + jedna linia `pub mod` w `domain/mod.rs`).
- Pozostałe cele `cargo test` (pełny zestaw) NIE uruchomione w tej rundzie.
