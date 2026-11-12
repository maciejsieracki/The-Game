STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1
GOAL: odpowiedz na 7 zarzutow Evaluatora r5 (02-evaluator.md, commit 3f29d10c1) dla SHA f868d009e; poprawki tam, gdzie zarzut jest zasadny
ZMIANY/COMMIT: baza f868d009e (r5 Operator); commit obrony = SHA z `git log -1` tej galezi (wpisany ponizej). Pliki: rust-port/engine/src/domain/turn_war_inputs.rs (naglowek modulu, usuniety parametr _is_human), rust-port/engine/tests/p6_wire_war_inputs.rs (zmiana nazwy helpera na complete_power_test_only_zeros, komentarz), ten plik. Cargo.lock NIE commitowany. Brak zmian w gra/, WERSJE.md, Cargo.toml.
RUNDY: r5/5 (obrona w tej samej rundzie; bez nowej rundy)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. PRZYJMUJE jako fakt, ODRZUCAM jako defekt kodu. Produkcyjny `advance_turn` z AI posiadajacym miasta zwraca `PlayableError::WarTurn` (brak producentow epok per wlasciciel i wspolnej granicy). To jest zachowanie, ktore dispatch r5 wprost przewiduje (NAPRAW 1 i zdanie "Jesli po tej rundzie pipeline nadal zwraca blad ... to OCZEKIWANE"). Regresja wzgledem 0b5fc5fb9 jest zamierzona i opisana w 01-operator-r5.md. NIE jest to decyzja Operatora o integracji. DECISION_REQUIRED (zasada 3, pytanie ABC do wlasciciela, nie do Operatora): (a) nie integrowac tej galezi na parity-v2, dopoki r6 nie dostarczy producentow epok i granicy; albo (b) zintegrowac z flaga/odlozonym wywolaniem run_war_turn w produkcji. Rekomendacja Operatora: (a), bo (b) oznacza, ze wywolanie jest martwe w produkcji, a to juz bylo punktem zarzutu r3.

2. PRZYJMUJE. Kryterium r4 pkt 1 (advance_turn z AI z miastami przechodzi, 2-3 tury) jest NIESPELNIONE i nie zostanie spelnione bez producentow z pkt 1. Produkcyjna sciezke pokrywa test `production_path_fails_with_explicit_blockers_for_ai_with_cities` (blad, nie cichy sukces) i `advance_turn_with_ai_city_fails_explicitly_on_missing_owner_epoch_and_restores_state` (playable.rs, rollback). Testy z wstrzyknietymi epokami i helperem zer nie dowodza zachowania pipeline'u na danych produkcyjnych. PORAWKA: helper `complete_power` przemianowany na `complete_power_test_only_zeros` z komentarzem TEST-ONLY ZERA i wskazaniem, ze kryterium r4 pkt 1 jest niespelnione (p6_wire_war_inputs.rs). Zachowanie testow bez zmian (7+14+13+10+9+9 ok).

3. PRZYJMUJE. Naglowek `turn_war_inputs.rs` (linie 1-6) byl nieaktualny i zostal przepisany: opisuje stan po r5 (jawny `WarTurnError` dla AI z miastami), a nie zamkniecie luk. Dowod: diff tej galezi, plik turn_war_inputs.rs linie 1-6.

4. PRZYJMUJE czesciowo. Rozszerzenie NAPRAW 4 o `rekrut_ekw` i `heksy_terytorium` zostaje: oba zaleza od populacji miast (`PlayableCity` jej nie ma), wiec sa tej samej klasy co `suma_ludkow`, ktore dispatch r5 juz wskazal. Dlug, ktory Evaluator slusznie wskazuje: `terytorium_for_owner` (producent POWER-ARMIA-TERYTORIUM) nie ma produkcyjnego wolajacego w pipeline. Wpisany jako jawny bloker r6 (pozycja 3 w 01-operator-r5.md obejmuje "terytorium"; ta obrona wpisuje to tez wprost jako dlug producenta). Brak zmiany kodu.

5. PRZYJMUJE. Parametr `_is_human` usuniety z `power_raw_for_owner` (turn_war_inputs.rs) i z jedynego wolania w `build_war_inputs_with_epochs`; wolanie w tescie (p6_wire_war_inputs.rs) zaktualizowane. Brak martwego parametru API. Kompilacja `clippy --all-targets -D warnings` EXIT 0.

6. NIE_ZMIERZONO (bez zmiany kodu). Evaluator sam ocenil jako akceptowalne. Bramka R2 w izolacji wymaga zywych wojen w `brake_phase.at_war` bez efektow deklaracji; zostaje dla r6. Opis w 01-operator-r5.md.

7. PRZYJMUJE jako fakt (zweryfikowane w pinie). Pin 07d2fbd72, `gra/src/main.ts:2419`: `function empireEpochForOwner(ownerId) { if (isHuman(ownerId)) return playerStateByHuman.get(ownerId)!.era; return ownerEraByOwner.get(ownerId) ?? gameStartEra(); }`. Czyli dla AI bez wpisu web podstawia epoke startu, a Rust tego nie robi (dispatch r5 NAPRAW 1). Odmowa Rusta zostaje. DECISION_REQUIRED (pytanie ABC do wlasciciela, decyzja produktowa): czy dla AI bez wpisu `ownerEraByOwner` epoka startu ma byc jawnym, udokumentowanym producentem (rekomendacja Operatora, zgodna z webem), czy ma byc dostarczona przez producenta epok per wlasciciel z PlayableState (wtedy fallback nie jest potrzebny). Decyzja nalezy do r6.

## Bramki (EXIT zapisany, po poprawkach)
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0 (kompiluje wszystkie cele testowe)
- cargo test --lib: 51 ok, EXIT 0
- cargo test --test p6_wire_war_inputs --test p6_wire_war_pipeline --test p6_wire_war_diplo --test p6_brake_inputs --test p6_power_nozeros --test p6_power_rest: 14, 7, 13, 10, 9, 9 ok, EXIT 0
- pelny cargo test --no-fail-fast: NIE_ZMIERZONO w tej rundzie obrony (zmiany to sygnatura, nazwa helpera i naglowek; wszystkie cele testowe kompiluja sie przez clippy). Wynik pelnego testu z r5 (2834 ok) jest dowodem tylko dla f868d009e, nie dla commita obrony.
- CARGO_TARGET_DIR poza repo, usuniety po bramkach.

## Blokery i decyzje dla r6 (bez zmian wzgledem 01-operator-r5.md, plus dopisek z pkt 4)
1. Producent epoki per wlasciciel (`ownerEraByOwner` / fallback z pkt 7).
2. Producent wspolnej granicy `ownersShareLandBorderLive` (main.ts:5690) dla par z > 2 miastami.
3. Populacja i kultura miast w `PlayableCity`: ludki, rekruci, terytorium (`terytorium_for_owner` bez wolajacego w pipeline), kultura.
4. Magazyny budynkow, tech, religii panstwowej.
5. `TickContext` poza granica (handel, religia, dobra wola, wiarygodnosc).
6. R2 w izolacji.
7. Decyzja ABC z pkt 1 (integracja/flaga) i z pkt 7 (fallback epoki startu dla AI).

NASTEPNY KROK: Evaluator r5 (zarzuty 1-7 z odpowiedziami, ponowna ocena tylko zmienionych miejsc); decyzje ABC z pkt 1 i 7 przed integracja.
