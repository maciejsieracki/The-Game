STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1 (W6, obrona r1 wobec Evaluatora)
GOAL: jak w dispatchu (faza dyplomacji tury, galaz hamulca + blokady/brama/cooldown/oferta)
BAZA: 421ad92c3 (kod operatora r1), pin web 07d2fbd72f758705f8e1d59cc4968027ffbafe75
SHA obrony: podany w raporcie orkiestratora (commit na gałęzi wip/R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1-op-r1)

## Odpowiedzi na zarzuty

1. GOAL niezrealizowany (blokady, brama oblezenia, cooldown, oferta miasta za pokoj).
   PRZYJMUJĘ. Potwierdzone grepem: ai_diplomacy_turn.rs nie odwoluje sie do diplomacy_locks,
   siege, rejection, ai_peace_city_offer, tick_pair. Nie naprawiono w tej rundzie: wymaga
   wektorow z 11115, 19371, 19749, 40413, ktorych generator nie produkuje, oraz decyzji zakresu.
   Rekomendacja orkiestratora: rozbicie na osobne tematy (blokady+cooldown+oferta; brama
   oblezenia) albo jawne przeniesienie do W8. Kryterium 1 pozostaje NIESPELNIONE.

2. Galaz OFF nie jest modelowana. ODRZUCAM (dowod).
   gra/src/game/diplomacy-tick-war-brake.ts (pin): DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true (l.7).
   Wartosc zmienia tylko setDiploTickWarBrakeOverride (l.13), ktorego w pinie main.ts nie wywoluje
   (grep: brak). Galaz OFF jest nieosiagalna w produkcji. Opis w P6-WIRE-WAR-DIPLO-TURN.md, pkt 2.

3. Wektory phase.json to transkrypcja, nie realne wykonanie runDiplomacyTurnTick. PRZYJMUJĘ
   (czesciowo naprawione). Generator sam to deklaruje (naglowek p6_wire_war_diplo_gen.mjs).
   Test nazwany phase_matches_web_transcription_over_turns. Opis granicy w dokumencie tematu, pkt 3.
   Realne wykonanie wymaga harnessu stanu gry z main.ts: poza zakresem tej rundy.
   Wektory dla 11115/19371/19749/40413 nie istnieja (patrz zarzut 1).

4. tick_pair nie jest wywolywany (relation_after_tick to wejscie). PRZYJMUJĘ jako otwarte.
   Wymaga adaptera Relation -> relationScore; nie zrobione w tej rundzie. Patrz dokument, sekcja Otwarte.

5. Brak testu kontraktu pol declarations. PRZYJMUJĘ — NAPRAWIONE.
   p6_wire_war_diplo.rs: dla kazdej deklaracji: declarer != victim, obie strony sa wlascicielami
   fazy, para w at_war, brak licznika; scenariusz ai_ai_five_turns_declare ma >= 1 deklaracje.
   Test zielony (12 passed).

6. Brak pliku dokumentacyjnego P6-WIRE-WAR-DIPLO-TURN*.md. PRZYJMUJĘ — NAPRAWIONE.
   dyspozycje/rust-port/p6/P6-WIRE-WAR-DIPLO-TURN.md (zakres, granice, otwarte, bramki).
   Zaleznosc do W8 jest jawna (pkt 1 dokumentu).

7. NIE_ZMIERZONO: odtworzenie wektorow z pinu bajt-w-bajt. PRZYJMUJĘ — ZMIERZONO.
   esbuild 0.24.2 (npm, poza repo) + Node v22.23.4. Generator uruchomiony na gra/src/game/diplomacy-tick-war-brake.ts
   z pinu (git show, poza repo). Wynik: cmp primitives.json = IDENTYCZNE; cmp phase.json = IDENTYCZNE.

## Bramki (po poprawkach r1)

- cargo fmt --check: OK (plik testu sformatowany rustfmt).
- cargo clippy --all-targets -- -D warnings: OK.
- cargo test --lib: 28 passed.
- cargo test --test p6_wire_war_diplo: 12 passed.
- Sasiednie p6_wire_war_*: wszystkie zielone (declare 15, declare_peace 7, forced_step 24,
  march_adapter 5, march_core 12, march_vectors 1, state 14, state_snapshot 8, view 6).
- Brak #[ignore], brak osłabionych asercji.

## Zmiany w tej rundzie (allowlista)

- rust-port/engine/tests/p6_wire_war_diplo.rs (kontrakt declarations, zarzut 5)
- dyspozycje/rust-port/p6/P6-WIRE-WAR-DIPLO-TURN.md (nowy, zarzut 6)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1/02a-obrona.md (ten plik)
- Cargo.lock NIE commitowany (wygenerowany lokalnie).

## Rozmiar

- ai_diplomacy_turn.rs: 234 LOC; p6_wire_war_diplo.rs: 457 LOC (wc -l).

RUNDY: 2/5 (obrona r1 wykonana; decyzja zakresu dla zarzutow 1 i 4 wymagana od orkiestratora)
BLOKADY: zarzut 1 (GOAL: blokady, brama, cooldown, oferta) i zarzut 4 (tick_pair) pozostaja otwarte.
NASTEPNY KROK: orkiestrator decyduje o rozbiciu zakresu (nowe tematy lub W8) albo wysyla r2 Operatora.
DEPLOY/PUSH: NIE WYKONANO (push tylko na gałąź wip/* tematu, nie na rust-port/parity-v2).
