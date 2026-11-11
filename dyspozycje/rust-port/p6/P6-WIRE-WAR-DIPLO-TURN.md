# P6-WIRE-WAR-DIPLO-TURN (W6) — dokumentacja tematu

Temat: `R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1`. Plan: `P6-WIRE-WAR-TURN-PLAN.md` (wiersz W6).
Pin web: `07d2fbd72f758705f8e1d59cc4968027ffbafe75`.

## Zakres zrealizowany (obrona r1)

- `rust-port/engine/src/domain/ai_diplomacy_turn.rs` — `run_brake_phase` składa w jeden krok
  galaz hamulca tury: dobra wola gracz<->kontakt, krok kryzysu AI<->AI i gracz<->AI,
  kolejka wojen z progu (sortowanie, pominięcie: wojna, blokada pokoju, gracz jako silniejsza
  strona, bramka R1/R2). Funkcje składowe pozostają w `diplomacy_tick_war_brake.rs`.
- `rust-port/engine/tests/p6_wire_war_diplo.rs` — 12 testów: prymitywy na wektorach
  `primitives.json` oraz sześć scenariuszy fazy na `phase.json`. Test fazy nosi nazwę
  `phase_matches_web_transcription_over_turns`: porównuje wynik z TRANSKRYPCJĄ pętli tury,
  a nie z uruchomieniem `runDiplomacyTurnTick` (patrz „Granice").
- Kontrakt pól `declarations` (obrona r1, zarzut 5): każda deklaracja to para różnych
  wlascicieli będących w fazie; po deklaracji para jest w `at_war` i nie ma licznika kryzysu;
  scenariusz `ai_ai_five_turns_declare` musi zawierać co najmniej jedną deklarację.
- Generator `rust-port/engine/tests/p6_wire_war_diplo_gen.mjs` (esbuild 0.24.2, Node 22) jest
  deterministyczny: ponowne wygenerowanie z pinu daje pliki identyczne bajt w bajt
  (`cmp` = OK dla `primitives.json` i `phase.json`, sprawdzone w obronie r1).

## Granice (jawnie)

1. **Podpięcie do pętli tury = W8.** `run_brake_phase` nie jest wywoływane z żadnej pętli
   tury Rust. Zależność jest jawna, nie ukryta.
2. **Brak modelu galęzi OFF.** Web: `isDiploTickWarBrakeEnabled()` zwraca
   `DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true` (`gra/src/game/diplomacy-tick-war-brake.ts`,
   pin, l.7). Wartość zmienia wyłącznie `setDiploTickWarBrakeOverride`, który w pinie nie jest
   wywoływany z `main.ts`. Galaz OFF jest więc nieosiągalna w produkcji; Rust modeluje ON.
3. **Wektory fazy są transkrypcją.** `phase.json` powstaje z ręcznej transkrypcji
   `runDiplomacyTurnTick` (l.24229) zbudowanej na funkcjach `brake.ts`. Uruchomienie realnej
   funkcji wymaga harnessu stanu gry z `main.ts`, którego nie ma. Błędy odwzorowania pętli
   nie są wykrywalne testem fazy; wykrywalne są błędy samych funkcji.
4. **Tick relacji pary nie jest wywoływany.** `relation_after_tick` jest wejściem scenariusza.
   `diplomacy.rs::tick_pair` nie jest podpięty (otwarte, zob. niżej).
5. **Efekty deklaracji wojny** (traktaty, sojusze, zdarzenia, UI) stosuje caller (W4/W8).

## Otwarte (nie zrealizowane w tej rundzie)

- Blokady akcji (`resolve_diplomacy_action_lock`, `diplomacy_locks.rs`), brama oblężenia
  (`diplomacy_siege_war_gate.rs`), cooldown odrzuceń `miasto_za_pokoj`
  (`diplomacy_rejection_cooldown.rs`) i oferta miasta za pokój (`ai_peace_city_offer.rs`)
  NIE są podpięte w `ai_diplomacy_turn.rs`. Wektory dla `11115`, `19371`, `19749`, `40413`
  nie istnieją. Wymagają osobnego zakresu/tematu.
- `diplomacy::tick_pair` nie jest wywoływany (wymaga adaptera reprezentacji relacji
  `Relation` -> `relationScore`).

## Bramki (obrona r1)

- `cargo fmt --check`: OK.
- `cargo clippy --all-targets -- -D warnings`: OK.
- `cargo test --lib`: 28 passed.
- `cargo test --test p6_wire_war_diplo`: 12 passed.
- Sąsiednie `p6_wire_war_*`: declare 15, declare_peace 7, forced_step 24, march_adapter 5,
  march_core 12, march_vectors 1, state 14, state_snapshot 8, view 6 — wszystkie zielone.
- Brak `#[ignore]`, brak osłabionych asercji.
