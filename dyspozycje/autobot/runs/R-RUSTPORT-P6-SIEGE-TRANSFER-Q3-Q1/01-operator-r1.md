STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TRANSFER-Q3-Q1
GOAL: uzupelnic w Rust skutki przejecia miasta z galezi Transfer (applyCapturePopulationLoss i sanitizeProductionQueue(newOwner) jako priorytet), testy behawioralne, banked z wyniku sanityzacji.
ZMIANY/COMMIT: baza e4f5b3604 (SIEGE-TRANSFER kod, potomek rust-port/parity-v2 f207ea6b1). Allowlista: rust-port/engine/src/domain/siege_transfer.rs (apply_transfer_with_effects, TransferExtras, pola CapturePopLossOutcome w TransferOutcome, tabela TRANSFER_EFFECTS), rust-port/engine/src/domain/siege_transfer_effects.rs (NOWY: apply_capture_population_loss, sanitize_production_queue_for_owner, testy jednostkowe), rust-port/engine/src/domain/mod.rs (pub mod), rust-port/engine/tests/p6_siege_transfer.rs (lista BRAK: usunieto applyCapturePopulationLoss i sanitizeProductionQueue), rust-port/engine/tests/p6_siege_transfer_effects.rs (NOWY). Cargo.lock nie commitowany. SHA: patrz wpis commita na gałęzi roboczej.
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib EXIT 0 (55 passed); cargo test --lib siege_transfer (7 passed); cargo test --test p6_siege_transfer (10 passed), --test p6_siege_transfer_prod (2 passed), --test p6_siege_surrender (5 passed), --test p6_siege_transfer_effects (5 passed). Wszystkie EXIT 0. Komendy: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo.
BLOKADY:
- NIE_ZMIERZONO: wektory p6_siege_transfer_vectors NIE przegenerowane. Generator p6_siege_transfer_gen.mjs nadal stubuje applyCapturePopulationLoss (no-op); nie dodano wykonania realnych sanitizeBuildQueue/filterQueue z pinu. Wektory nie potwierdzaja nowej sciezki z pinu.
- NIE_ZMIERZONO: wonderGateOk(ownerId, wid) i parseWonderProdId nie maja odpowiednika w rust-port/engine/src; bramka cudow jest predykatem wejsciowym (TransferExtras::wonder_gate_ok), wiec po stronie wolajacego.
- BRAK (nadal, wpisane w TRANSFER_EFFECTS jako Missing): applyPostCaptureLawOnCapture, triggerRebelProtectionWarConsequence, beginWonderTransferWatch/settleWonderTransfer, noteCityCapture, syncCityGarnizon, playerEverOwnedCityByOwner.add, runCapitalCapturePlunder, recordCityCaptureEvent, applyLiveSafeRationForCity.
- Tryb legacy apply_transfer (bez TransferExtras) nie wykonuje pop-loss ani sanityzacji; brak wolajacego w produkcji, zakaz podpinania w doc-komentarzu pozostaje.
- Banked: w trybie z bramka liczony z wyniku sanityzacji (zgodnie z webem); test banked_liczony_z_wyniku_sanityzacji_nie_z_surowej_kolejki (3 zamiast 7).
- Dodatkowo: 'stampCityFounderOnCapture' (foundedBy) wykonany wewnatrz apply_capture_population_loss; pole city.foundedBy nie jest w TransferCity - zwracane w CapturePopLossOutcome.founded_by dla wolajacego.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (R1): zweryfikowac zgodnosc z pinem 07d2fbd72 (cities.ts:1235-1251, main.ts:5123-5140, 17700-17790); Operator r2: przegenerowac wektory generatorem bez stuba applyCapturePopulationLoss i z realnym sanitizeBuildQueue/filterQueue; pozostale BRAK jako osobne tematy.
DEPLOY/PUSH: NIE WYKONANO
