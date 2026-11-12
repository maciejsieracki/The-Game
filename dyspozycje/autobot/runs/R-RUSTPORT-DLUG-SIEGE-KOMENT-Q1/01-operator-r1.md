STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-DLUG-SIEGE-KOMENT-Q1
GOAL: Skorygowac komentarze nieaktualne wzgledem stanu na bazie e763d4a9a w modulach siege_surrender, siege_capital_plunder, siege_transfer (tylko komentarze //, //!, ///; zero zmian kodu, stalych, tabel statusow, testow).
ZMIANY/COMMIT: allowlista: rust-port/engine/src/domain/siege_surrender.rs, siege_capital_plunder.rs, siege_transfer.rs (siege_transfer_effects.rs i siege_capture_events.rs bez zmian - nie wymagaly korekty). SHA: patrz sekcja DEPLOY/PUSH i commit na gałęzi roboczej. brake_power_army.rs: BEZ ZMIAN (komentarz o niepodlaczeniu do COMPONENT_SOURCES jest prawdziwy na tej bazie: brake_power_producers::COMPONENT_SOURCES (12 pozycji) nie zawiera brake_power_army; jedyne odwolanie to mod.rs:20).

Zmiany komentarzy (dowod w kodzie na bazie e763d4a9a):
1. siege_surrender.rs, tabela w naglowku:
   - applyCapturePopulationLoss: bylo "brak nazwy w src / BRAK"; jest siege_transfer_effects.rs:63 `apply_capture_population_loss` (wolany w siege_transfer.rs apply_transfer_with_effects gdy pop_loss = Some) -> ISTNIEJE.
   - applyLiveSafeRationForCity: bylo "brak nazwy w src / BRAK"; jest siege_transfer_q5.rs:137 `apply_live_safe_ration_for_city` -> ISTNIEJE (Q5).
   - applyPostCaptureLawOnCapture: wskazanie poprawione na siege_transfer_effects.rs:163 `apply_post_capture_law_on_capture` (wolany przez apply_transfer_with_effects); order_effects_lane::apply_post_capture_law_override nie jest sciezka tej galezi.
   - triggerRebelProtectionWarConsequence: wskazanie poprawione z order_effects_lane::tick_rebel_protection_end_of_turn ("do weryfikacji") na siege_transfer_effects.rs:211 `rebel_protection_war_request`; znak "?" usuniety.
   - maybeResolveRegularWarOnCityCapture: war_turn_declare.rs:385 `register_regular_war_city_loss` istnieje -> ISTNIEJE (wymaga WarTurnState); usuniety "do weryfikacji" i "?".
   - seedCityOwnerDefaults: turn_economy_inputs_podzial.rs:81 `seed_city_owner_defaults_podzial` istnieje -> ISTNIEJE (wariant); usuniety "?".
   - foundedByOwner: bylo "brak logiki w src tego tematu / BRAK"; pole TransferCity::found_by_owner (siege_transfer.rs) i stamp w siege_transfer_effects::apply_capture_population_loss -> ISTNIEJE (czesciowo).
   - applyCapturePopulationLoss / applyLiveSafeRationForCity: dopisane odwolania do wolajacych.
   - capturePopLossReportRow: pozostaje BRAK (grep: brak definicji; wpis UI w siege_transfer.rs TRANSFER_EFFECTS jako Ui).
   - Akapit "Wniosek": doprecyzowany - BRAK po weryfikacji = wrapper beginWonderTransferWatch/settleWonderTransfer (EffectStatus::Missing w siege_transfer.rs) i capturePopLossReportRow (UI). Wczesniejsze "Zaleznosci BRAK" zawyzaly liste.
   - noteCityCapture, runCapitalCapturePlunder, recordCityCaptureEvent: wiersze byly zgodne z kodem (siege_transfer_q5.rs:92, siege_capital_plunder.rs:509, siege_capture_events.rs:182) - bez zmiany.
2. siege_capital_plunder.rs, naglowek (linie 19-21): zdanie "Store po stronie wolajacego..." zastapione doprecyzowaniem: logika zapisu jest w siege_capture_events::CaptureEventStore (Q7); modul NIE wola store sam, tylko zapisuje wpis w ui_calls (potwierdza grep: wywolan CaptureEventStore brak w siege_capital_plunder.rs; komentarze "Efekt UI (Q7)" przy wpisach recordCityCaptureEvent/recordCivElimEvent pozostaja zgodne).
3. siege_transfer.rs:
   - linia ~58 (wpis applyCapturePopulationLoss): "Generator pinu nadal stubuje to wolanie - wektory NIE zostaly przegenerowane" -> "NIE stubuje tego wolania". Dowod: tests/p6_siege_transfer_gen.mjs:19 ("Nie ma stubow dla applyCapturePopulationLoss") oraz :87/:342 (realna funkcja z pinu, extractFn). Zdanie o przegenerowaniu wektorow usunieto jako niezweryfikowane.
   - linia ~373 komentarz w apply_transfer_with_effects: "BRAK (tabela): ... noteCityCapture" -> "Missing (tabela): beginWonderTransferWatch/settleWonderTransfer; noteCityCapture (Ported, wolany przez wolajacego PO apply_transfer)". Dowod: wpis noteCityCapture ma EffectStatus::Ported w TRANSFER_EFFECTS.
   - linia ~383: "BRAK / ExistsNotWired (tabela): ..." -> "ExistsNotWired (tabela): ...". Dowod: maybeResolveRegularWarOnCityCapture, recordWarCityLossForPair, seedCityOwnerDefaults maja EffectStatus::ExistsNotWired.
   - naglowek (linie 4-6): lista statusow w TRANSFER_EFFECTS uzupelniona o Ported i Ui (wystepuja w tabeli).

DIFF: `git diff -U0` - wszystkie zmienione linie zaczynaja sie od `//` (po bialych znakach); `git diff --check` czysty. Brak zmian w allowliscie poza 3 plikami.

TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo, usuniety po bramkach):
- cargo fmt --check (rust-port/engine): EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0 (Finished dev)
- cargo test --lib: 48 passed, 0 failed, EXIT 0
- cargo test --test p6_siege_transfer --test p6_siege_transfer_effects --test p6_siege_transfer_effects_q4 --test p6_siege_transfer_q5 --test p6_siege_transfer_prod --test p6_siege_surrender --test p6_siege_capital_plunder --test p6_siege_capture_events:
  p6_siege_capital_plunder 3/3; p6_siege_capture_events 3/3; p6_siege_surrender 10/10; p6_siege_transfer 2/2; p6_siege_transfer_effects 4/4; p6_siege_transfer_effects_q4 12/12; p6_siege_transfer_prod 5/5; p6_siege_transfer_q5 6/6. EXIT 0.
- Wszystkie bramki zielone (komentarze nie zmieniaja zachowania; wynik zgodny z oczekiwaniem).

BLOKADY: brak. Nieweryfikowane poza zakresem: czy wskazane funkcje sa poprawnie podpiete w produkcji (to opisuja same komentarze jako ZALEZNOSC/wolajacy niepodpiety; nie zmieniano statusow).
Cargo.lock (untracked, wygenerowany przez cargo) NIE zostal dodany do commita.

RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) - weryfikacja kryteriow 1-3 z dispatchu (dowody z tabeli wyzej; skrypt "usun linie komentarzy z diffu" = pusty wynik); potem Final Control.
DEPLOY/PUSH: NIE WYKONANO (brak push i integracji zgodnie z dispatchem; commit tylko na lokalnej galezi roboczej).
