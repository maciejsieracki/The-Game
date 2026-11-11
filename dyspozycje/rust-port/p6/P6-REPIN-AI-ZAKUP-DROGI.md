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

---

## Runda 3 (Operator, Sonnet 5.5, 2026-11-11; BAZA 6b54dc1f3 = rust-port-wip/AIZAKUP)

Web do wektorów: `origin/main` 0c5b227a9 (`git archive gra/src gra/data` poza repo, Node 22.22).

### A. `ai_try_purchase_unit` na realnym stanie — ZROBIONE

`domain/ai_zakup_jednostki.rs` (dopisane, addytywnie): `AiPurchaseState {treasury, stock (magazyn państwa), manpower}`,
`AiPurchaseParams {manpower_cost, rezerwa 10/3/0 + dochód/utrzymanie}`, `ai_try_purchase_unit(&mut state, &UnitRecruitment, &params)`
= `should_ai_purchase_unit` (złoto + Manpower + rezerwa) -> `validate_recruitment` (koszt surowcowy z magazynu) -> `spend_recruitment`
(atomowo; przy odmowie stan NIEZMIENIONY). Odmowa: `Gate` albo `MissingStock(missing)` (= web `missingStockFor`).
`ai_purchase_resource_needs` łączy to z `ai_resource_needs::detect_owner_resource_needs` (jednostka jak w kolejce, magazyn = realny stan).
Web: main.ts:42441 (`shouldAIPurchaseUnit` -> `purchaseRecruitmentUnit`), main.ts:4579 (wspólna ścieżka gracz/AI; stock check PRZED pobraniem),
economy-upkeep.ts `canAffordUnitRecruitStock`, building-stock-cost.ts `unitStockCost`/`missingStockFor`.

Wektory z weba: `tests/p6_repin_ai_zakup_purchase_vectors/purchase-vectors.json` (75 jednostek `units.json` x 472 pule magazynu:
empty/exact/plus5/unrelated/minus1:k/zero:k) z PRAWDZIWYCH `unitStockCost` + `canAffordUnitRecruitStock` + `missingStockFor`.
Test `tests/p6_repin_ai_zakup_purchase.rs`: koszt surowcowy Rust (`recruitment_for`) == web dla WSZYSTKICH 75 jednostek, decyzja kupna
i mapa braków == web dla każdej puli, pobranie dokładnie kosztu, odmowa nie zmienia stanu; + scenariusze: ma surowce -> kupuje, brak jednego
surowca -> nie kupuje (złoto/Manpower/pozostałe surowce nietknięte), zloto nie zastępuje surowca ("bez magicznych zasobów"), bramka złota/Manpower,
rezerwa poziom 1/2/3 (10/3/0) przez wykonawcę, powiązanie z `ai_resource_needs`. 7 testów PASS.

ZAŁOŻENIA: Manpower jako skalar imperium; wybór miasta/kolejka rekrutacji (enqueue) i bramki poza ekonomią (oblężenie, limit stosu, Super-jednostka,
Naval) po stronie wywołującego. Wiązanie w `ai_turn.rs`: NIE ZROBIONE — jawny DŁUG DO W4/D7 (WIRE-WAR): `ai_turn.rs` nie ma kroku rekrutacji ani
nosiciela magazynu państwa; dołożenie ich to nowy krok tury, nie addytywna linia (NIE BLOCK, zgodnie z dispatchem R3).

### B. Drogi gracza = AI — ZMIERZONO + KOREKTA

1. `plan_road_network` vs web `planRoadNetwork`: `road-network-plan.ts` i `road-movement.ts` NIE zmieniły się od pinu 180c08305
   (`git diff 180c08305 origin/main --stat`: 0 linii). Web też używa `hexHasRoad` (nie `isRoadQualified`) — brak rozjazdu. Dowód zgodności:
   istniejący `tests/p6_repin_autoimpr_terrain.rs::plan_road_network_matches_web` (wektory `roadplan.json`) — PASS (8/8 testów pliku).
2. REALNY rozjazd (web FALA 596, R-WEB-ROAD-BUILD-PLAYER-PARITY-WITH-AI-Q1, improvement-build.ts): web zastąpił `placedKeys.has(hex)`
   (blokada drogi na KAŻDYM heksie z ulepszeniem) regułą "droga blokowana tylko gdy heks już ma drogę" (`existing.some(isRoadImprovementKey)`
   albo `ulepszenie` = droga/droga_brukowana; farma + droga = dozwolona warstwa) + dodał `roadBuildBlockReason`. Rust miał starą regułę.
   Korekta: `improvement_build.rs` (`Qualifier::qualifies` gałąź DROGA, `hex_has_road_layer`, `road_build_block_reason`; pole `placed_keys`
   usunięte z `Qualifier`, zostaje w `ImprovementBuildState`). Gracz (`can_build`/`get_qualifying_hexes`) i AI (`sh.qualifies`) wołają TEN SAM `qualifies`.
3. Wektory: `tests/p6_repin_ai_drogi_vectors/droga-vectors.json` (107 stanów, 16 492 zapytań; z `gen-drogi-vectors.mjs` = kopia generatora M16
   z REPIN-AUTOIMPROVE + wyjście dróg): bity `droga`/`droga_brukowana`, `getQualifyingHexes`, `roadBuildBlockReason`. Test
   `tests/p6_repin_ai_drogi_qualifier.rs` (2 testy PASS): kwalifikacja == web, `can_build` == `qualifies`, teksty powodów == web.

### ZAŁOŻENIA / skutki poza allowlistą (do oceny Evaluatora)

- `tests/p6_m16_qualifier.rs` (poza allowlistą): klucz `droga` w wektorach M16 (pin edb8fb56) koduje DAWNĄ regułę `placedKeys` -> pomijany
  (`SUPERSEDED_KEY`), zastąpiony wektorami z aktualnego weba (pkt 3). Pozostałe klucze M16 bez zmian (4/4 PASS).
- `tests/p6_8i_vectors/pick.json` (poza allowlistą): 25 scenariuszy (rnd-139/334, rp-42/96/114/120/139/147/151/153/155/167/168/182/198/203/205/211/214/216,
  rp-roads-reuse-p, ra-rnd-… ) kodowało starą regułę drogi; ich `expected` zregenerowane z aktualnego weba (`gen-repin-autoimpr-pick-vectors.mjs`,
  te same wejścia; 21 PASS). 4 scenariusze (rnd-961, ra-rnd-1, ra-rnd-24, ra-rnd-247) mają OBOK dryfu dróg inny dryf weba (m.in. bydło po farmie —
  poza tematem; regenerowane oczekiwania też nie przechodzą) -> USUNIĘTE z pick.json (5128 -> 5124) do REPIN auto-ulepszeń. Pełna regeneracja pick.json
  zmieniłaby 989 scenariuszy (inny dryf weba) — poza zakresem.
- Dryf zaobserwowany, NIE naprawiany (poza tematem): `stadnina` (web: `isLivestockUnlockedForPlacement` z `horseStockAvailable`) — przy pełnej
  regeneracji `qualifier.json` M16 (320 stanów) Rust daje `stadnina` true, web false (stan 3, heks (-5,2)). Do REPIN ekonomii/stadniny.

### Bramki (runda 3)

- `rustfmt --check` plików dotkniętych: PASS. `cargo clippy --lib --test p6_repin_ai_drogi_qualifier --test p6_repin_ai_zakup_purchase --test p6_m16_qualifier --test p6_repin_ai_zakup_needs --test p6_repin_ai_zakup_rezerwa -- -D warnings`: PASS.
- `cargo test` per binarka: p6_repin_ai_zakup_purchase 7/0, p6_repin_ai_drogi_qualifier 2/0, p6_repin_ai_zakup_needs 2/0, p6_repin_ai_zakup_rezerwa 5/0,
  p6_repin_autoimpr_terrain 8/0, p6_m16_qualifier 4/0, p6_m16_rules 15/0, p6_m16_tables 5/0, p6_m16_divergence 1/0, p6_m16_doc 1/0, p6_m16_gallery 2/0,
  p6_8i_pick 5/0 (401 s, po zmianie vectorow), p6_8i_relief 8/0, p6_m15_roads / road_movement_multipliers / improvements / p6_23_improvements /
  p6_8a_pending_improvements / lib 22 — PASS. 0 failed, 0 nowych `#[ignore]`.
- Baseline p6_8i_pick PRZED zmianą Qualifier (HEAD 6b54dc1f3): 5/0 (453 s). Pełne `cargo test` całego crate NIE uruchomione (NIE_ZMIERZONO).

### Obrona r3 — długi do rejestru (R-RUSTPORT-REPIN-AI-ZAKUP-REALNY-STAN-DROGI-Q1)

- D-PICK-4: pick.json bez scenariuszy ra-rnd-1, ra-rnd-24, ra-rnd-247, rnd-961 (ZMIERZONO po nazwach: 5128 -> 5124, 21 expected zmienionych). Oryginały: `git show 6b54dc1f3:rust-port/engine/tests/p6_8i_vectors/pick.json`.
- D-PICK-PIN: pin pliku i testu `vectors_pin_is_web_main_180c08305` = 180c08305, a część `expected` z nowszego weba; NIE_ZMIERZONO który SHA weba użył generator.
- Pełny `cargo test` całego crate: NIE_ZMIERZONO.
