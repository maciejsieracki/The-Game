STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-INTEG-B13-Q1
GOAL: batch 13 (W8 + L3 + Q9 + KLASY + KOMENT + K5-AUDYT) scalony na 46c42deab z adaptacja do PowerInputError
ZMIANY/COMMIT: oceniany SHA 91a117afc (gałąź rust-port-wip/INTEG-B13-Q1); Evaluator nie zmienia kodu
TESTY: patrz niżej (odtworzone samodzielnie)
BLOKADY: brak
RUNDY: 1/5 (ocena operatora r4 wg nazwy raportu)
NASTĘPNY KROK: Final Control; zarzuty 1-3 do rozstrzygnięcia przez FC/Operatora
DEPLOY/PUSH: NIE WYKONANO

## Odtworzone bramki (rust-port/engine, CARGO_TARGET_DIR poza repo)
- cargo fmt --check: EXIT=0
- cargo clippy --all-targets -- -D warnings: EXIT=0
- cargo test --no-fail-fast (pełny, obejmuje --lib): EXIT=0; suma ze wszystkich "test result": 2997 passed, 0 failed, 1 ignored
  (zmierzone, zgodne z liczbą wyprowadzoną przez Operatora; jedyny ignored = e2e::dump_tick1_econ_for_web_generator, przedtem istniejący)
- git merge-base --is-ancestor każdego z 6 wejść (9164ab7d7, 415a7d67f, d3b11f071, de6204fdc, 24ef0de70, b2336c005) oraz bazy 46c42deab względem 91a117afc: wszystkie TAK (exit 0)
- git diff 46c42deab..91a117afc: brak nowych #[ignore], brak dotknięcia gra/, WERSJE.md, Cargo.toml/lock; usunięta 1 linia assert w testach (13206 w diffie) - patrz zarzut 4.

## Zarzuty
1. Nowy wariant WarTurnError::PowerComponentNonFinite (turn_war_pipeline.rs:150,165,305) nie ma ŻADNEGO testu (grep w rust-port/engine: tylko definicja, Display i mapowanie). Dispatch wymaga jawnego błędu bez połykania; mapowanie NonFinite -> wariant nie jest dowiedzione testem na wektorze (np. Provided(NaN) w power_raw -> Err(PowerComponentNonFinite(id, [klucz]))). Test p6_power_nan.rs pokrywa tylko niższą warstwę (PowerInputError). Wymagany test zachowania w p6_wire_war_*.
2. Nieaktualny nagłówek modułu turn_war_inputs.rs (linie 6-7 i 25-30): twierdzi, że advance_turn z AI z miastami kończy się PowerComponentsMissing i że infra/tech/religia są Missing, podczas gdy UNPRODUCED_POWER_COMPONENTS jest puste (linia 96) a test 3 tur przechodzi. Dokumentacja sprzeczna z kodem w pliku z allowlisty.
3. EXPLICIT_ZERO_REASONS (turn_war_inputs.rs:78) deklaruje "kontrolowane testem", ale żaden test ani kod go nie odczytuje (grep w src/tests: tylko definicja i komentarze). Spójność zbioru ExplicitZero (bitwy, bitwy_pkt_sum, ulepszenia, zdobycze) z NoProducer w COMPONENT_SOURCES/REST_COMPONENT_SOURCES jest zgodna wg lektury, lecz nieegzekwowana mechanicznie; dryf (np. nowy producent POWER-ULEPSZENIA) nie wywoła czerwonego testu. Dodatkowo ExplicitZero dla bitew/zdobyczy oznacza zaniżenie mocy AI względem pinu po pierwszych walkach (świadomie jawna luka, Operator ją opisał - akceptowalne, ale do rejestru długu).
4. Fixture pre-etap2-state.json (p6_unit_replace_l3_state_vectors) zmodyfikowany poza allowlistą (dopisane population:1, culture:0). Zmiana minimalna i uzasadniona serializacją od W8 r6 klocek 2, asercje niezmienione, ale formalnie naruszenie allowlisty - FC powinien to jawnie zaakceptować. Usunięta linia assert (diff linia ~13206) pochodzi z wejść scalanych, nie z adaptacji; nie znaleziono osłabienia asercji w warstwie adaptacji (jedyna zmiana asercji typu błędu: p6_wire_war_inputs.rs:576 oczekuje PowerComponentsMissing(2, ["terytorium"]), zgodne z mapowaniem Missing).
5. Uwaga nazewnicza: raport nazwany 01-operator-r4.md wbrew dispatchowi (r1); cosmetic.

## Co sprawdzone bez zarzutu
- Mapowanie Missing -> PowerComponentsMissing(id, lista) i NonFinite -> osobny wariant, bez unwrap_or(0) na wyniku mocy.
- Testy p6_wire_war_*, p6_unit_replace_*, p6_power_*, p6_siege_* oraz test 3 tur advance_turn z AI przechodzą w pełnym przebiegu.
- Brak zależności do W8 w nowych testach behawioralnych (wektory pinu generowane skryptami *_gen.mjs, nie ręczne).
