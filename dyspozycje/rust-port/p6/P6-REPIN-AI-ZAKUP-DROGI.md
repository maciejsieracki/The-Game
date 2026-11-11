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
