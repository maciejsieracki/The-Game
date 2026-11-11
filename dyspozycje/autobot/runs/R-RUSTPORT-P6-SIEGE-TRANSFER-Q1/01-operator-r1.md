STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q1
GOAL: funkcja wykonujaca galaz Transfer `resolveSiegeSurrender` (pin 07d2fbd72, gra/src/main.ts:17646-17893) z istniejacymi klockami Rust; tabela web -> Rust albo jawny brak; wektory z pinu przez wykonanie wycinkow; testy behawioralne.
ZMIANY/COMMIT: baza 82c57a412 (czubek BATCH3-tip). Allowlista zachowana:
  - rust-port/engine/src/domain/siege_transfer.rs (nowy): `apply_transfer`, `TransferCity`, `TransferProduction`, `TransferOutcome`, `EffectStatus`, `TRANSFER_EFFECTS` (tabela web -> Rust).
  - rust-port/engine/src/domain/mod.rs: tylko `pub mod siege_transfer;`.
  - rust-port/engine/tests/p6_siege_transfer.rs (wektory + pokrycie tabeli).
  - rust-port/engine/tests/p6_siege_transfer_prod.rs (testy behawioralne kolejki/flag/populacji/jednostek).
  - rust-port/engine/tests/p6_siege_transfer_gen.mjs (generator: wykonuje pinowe resolveSiegeSurrender, besiegerOwnerForCity, hexDistance, clearCityStateFlagOnCapture).
  - rust-port/engine/tests/p6_siege_transfer_vectors/vectors.json (160 wektorow galezi transfer).
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TRANSFER-Q1/01-operator-r1.md (ten raport).
  Cargo.lock NIE commitowany (artefakt builda, untracked). Brak zmian w gra/, origin/main, WERSJE.md, Cargo.toml, istniejacych plikach domain/.
  SHA: patrz commit na gałęzi roboczej `rust-port-wip/P6-SIEGE-TRANSFER-Q1` (SHA podany w odpowiedzi orkiestratorowi).
TESTY:
  - cargo fmt --check: EXIT 0.
  - cargo clippy --all-targets -- -D warnings: EXIT 0 (po poprawce doc-comment, lazy continuation).
  - cargo test --lib: EXIT 0, 48 passed, 0 failed.
  - cargo test --test p6_siege_transfer --test p6_siege_transfer_prod --test p6_siege_surrender: EXIT 0.
    * p6_siege_transfer: 2 passed (transfer_vectors_match_pin_state_and_calls na 160 wektorach; coverage_table_has_no_silent_ported_gaps).
    * p6_siege_transfer_prod: 5 passed.
    * p6_siege_surrender (regresja r2): 10 passed.
  - Generator: `node tests/p6_siege_transfer_gen.mjs <main.ts> <setup.ts> <display-names.ts>` EXIT 0 na pinie 07d2fbd72 (wykonanie wycinkow, zakres do enterCityAfterSurrender przez Stop).
  - Srodowisko: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (usuniety po bramkach).
BLOKADY / NIE_ZMIERZONO (jawna tabela skutkow, zrodlo: TRANSFER_EFFECTS):
  Ported (wykonane w apply_transfer):
    - ownerId = newOwner; population = Math.max(1, pop) (surrender_population_after); splice obroncow starego wlasciciela na heksie miasta (transfer_removed_ids_in_place).
    - clearCityStateFlagOnCapture -> state::p6_6b::display_names::clear_city_state_flag_on_capture (wektory pinu sprawdzaja wynik).
    - foundedByOwner = false gdy !wasIndependentCityState; rebelState true -> false.
    - sanitizeBuildQueue (production_queue) + refundedPraca -> wynik `refunded_praca_to_old`; filterQueue (production_queue) z forfeitem frontu + zbankowany postep stolic -> `forfeited_praca_to_new`. Testy behawioralne; NIE_ZMIERZONO wzgledem wykonania pinu (generator nie stubuje kolejki).
  ExistsNotWired (klocek istnieje, NIE podpiety tutaj):
    - maybeResolveRegularWarOnCityCapture -> war_turn_declare::register_regular_war_city_loss (wymaga WarTurnState) - zaleznosc dla W8 r3.
    - recordWarCityLossForPair -> diplomacy_war_peace_profile::record_war_city_loss (wymaga meta pary) - zaleznosc dla W8 r3.
    - seedCityOwnerDefaults -> turn_economy_inputs_podzial::seed_city_owner_defaults_podzial (inne typy wejsc) - zaleznosc dla W8 r3.
  Missing (BRAK w rust-port/engine/src; jawna lista, pilnowana testem):
    beginWonderTransferWatch, settleWonderTransfer, noteCityCapture, applyCapturePopulationLoss, applyPostCaptureLawOnCapture, triggerRebelProtectionWarConsequence, sanitizeProductionQueue (newOwner), syncCityGarnizon, playerEverOwnedCityByOwner.add, runCapitalCapturePlunder, recordCityCaptureEvent, applyLiveSafeRationForCity.
    UWAGA: applyCapturePopulationLoss NIE jest wykonane - galaz Transfer zmienia populacje tylko przez max(1,pop); utrata obywatela z kapitulacji (-1) NIE jest odtworzona. To jest zachowanie niezgodne z webem i wymaga osobnego tematu przed uznaniem galezi za kompletna.
    UWAGA: sanitizeProductionQueue(newOwner, ...) jest pominiety; kolejka po przejeciu moze roznic sie od weba, gdy web filtruje cos w tym kroku.
  CallerSide (wejscie wolajacego lub kolejne kroki): wasIndependentCityStateBeforeCapture (parametr), capitalCityIdForOwner (parametr is_new_capital), setOwnerPracaPool/ownerPracaPool (kwoty zwracane), armyStackLimit + enterCityAfterSurrender (siege_enter_city, po apply_transfer), endMapSiege (siege_surrender::end_map_siege_fields), areEnemyOwners (resolve_surrender_path).
  Ui: markCityStateDirty, showHintMessage.
  Zalozenia do akceptacji (dispatch ich nie zawiera): Z-TR-1 was_independent jako parametr; Z-TR-2 is_new_capital i predykat stolicy jako parametry; Z-TR-3 pule Pracy nie modyfikowane wewnatrz.
  Galaz NIE jest kompletna: brak BRAK-owych skutkow wymienionych wyzej. Wolajacy (W8 r3) musi wykonac pozostale kroki i zaplanowac brakujace klocki; brak wolajacego w tej rundzie jest dopuszczalny wg dispatchu z jawna zaleznoscia do W8 r3.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) - weryfikacja tabeli TRANSFER_EFFECTS wzgledem gra/src/main.ts:17646-17893 oraz uruchomienie gate'ow na commicie; decyzja o zakresie BRAK (applyCapturePopulationLoss to najwazniejsza luka) - jesli wymagane w tym temacie, osobny temat lub rozszerzenie w rundzie 2.
DEPLOY/PUSH: NIE WYKONANO (push tylko na gałąź roboczą *-wip, bez integracji i bez rust-port/parity-v2).
