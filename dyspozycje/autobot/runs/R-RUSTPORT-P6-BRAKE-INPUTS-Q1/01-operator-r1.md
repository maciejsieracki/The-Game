STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-BRAKE-INPUTS-Q1
GOAL: Czyste funkcje budujace BrakePhaseInput z danych stanu (W8 podzial 2/3): objective_power_for_owner, peace_locked, gate_blocked, contacts/owners; testy behawioralne; zrodlo prawdy: klucze rust* z WarTurnState.
ZMIANY/COMMIT: allowlista. Nowe: rust-port/engine/src/domain/brake_inputs.rs, rust-port/engine/tests/p6_brake_inputs.rs. Zmieniony: rust-port/engine/src/domain/mod.rs (tylko `pub mod brake_inputs;`). Raport: dyspozycje/autobot/runs/R-RUSTPORT-P6-BRAKE-INPUTS-Q1/01-operator-r1.md. Baza: 82c57a412 (detach). Cargo.lock nie zmieniany i nie commitowany. SHA commitu: w komunikacie orkiestratora po commicie.
TESTY:
- cargo fmt --check: EXIT 0 (po cargo fmt; zmiany tylko w allowliscie)
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: EXIT 0, 48 passed, 0 failed
- cargo test --test p6_brake_inputs: EXIT 0, 9 passed, 0 failed
- Wektory z pinu (p6_brake_inputs_gen.mjs, p6_brake_inputs_vectors/): NIE WYKONANO (generator nie napisany w tej rundzie; brak wycinania funkcji z pinu).
- Realna weryfikacja w przegladarce: nie dotyczy (brak zmian wizualnych).
BLOKADY:
1. objective_power_for_owner: web `objectivePowerForOwner` (gra/src/main.ts, pin 07d2fbd72:2874) opiera sie na `computeObjectivePower` (l.2759) z 11 skladnikami (pobor/manpower, kultura, religia, terytorium, budynki, tech, ulepszenia, zdobycze, bitwy, jednostki). W Rust NIE MA odpowiednika computeObjectivePower (grep: brak). Zaimplementowany jest tylko adapter `power_map(owner_ids, power_fn)`. Wymagana runda 2: port computeObjectivePower i wektory z pinu.
2. Baza: dispatch wskazuje 82c57a412 (branch rust-port-wip/BATCH3-tip), ktory NIE jest przodkiem origin/rust-port/parity-v2 (fe52d6ba3). Tresc zadania podaje parity-v2 (f207ea6b1 lub nowszy). Zastosowano baze z dispatchu, bo tam sa WarTurnState i pliki WAR-STATE-OWNER. Decyzja orkiestratora przy integracji; roznica: git diff --stat origin/rust-port/parity-v2 82c57a412 -- rust-port/engine (18 plikow).
3. Wolajacy w Rust (run_war_turn) nadal nie wola producentow: zaleznosc jawna do W8 r3.
WYBOR ZRODLA PRAWDY: producenty sa czyste i przyjmuja fakty jako argumenty; wolajacy W8 r3 czyta magazyny z WarTurnState (RUST_DIPLOMACY_KEY, RUST_BRAKE_PHASE_KEY, RUST_AI_PEACE_KEY, RUST_WAR_WEARINESS_KEY; forced[], opaque). Nie dodano kluczy poza WarTurnState.
ZAKRES PORTU (zaimplementowane, pin 07d2fbd72):
- is_peace_locked_between / peace_locked_set: isPeaceLockedBetween (l.11817) = blokada wojny epoki (isForcedEraPeaceLocked) LUB isPeaceTreatyLocked.
- crisis_war_gate_blocked / gate_blocked_set: diploCrisisWarGateBlocked (l.11632) przez evaluate_inter_civ_war_gate; obie kolejnosci (declarer, victim).
- contacts_for: getDiplomaticContacts bez gracza, posortowane.
- phase_owners: allPowerOwnerIds + diploOwnerEligibleForBrake (l.11590); wlasciciel bez faktow pomijany.
- power_map: adapter na objectivePowerForOwner.
RUNDY: 1/5; ostatni werdykt: brak (Operator); decyzja wymagana: nie (wystarczy runda 2 z portem computeObjectivePower).
NASTEPNY KROK: Evaluator (r1) po commicie; przy BLOCK wraca Operator r2 z zadaniem portu computeObjectivePower.
DEPLOY/PUSH: NIE WYKONANO (brak integracji, brak push do rust-port/parity-v2, brak zmian gra/).
