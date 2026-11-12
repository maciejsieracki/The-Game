STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-CRED-Q1
GOAL: Odpowiedz na 6 zarzutow Evaluatora (631b58105) dla kodu operatora 8cf5b49c5. Bez zmian w kodzie w tej obronie.
ZMIANY/COMMIT: tylko ten plik (02a-obrona.md). Kod: brak zmian (8cf5b49c5). Cargo.lock nie commitowany. Bez push.
TESTY: w tej obronie odtworzono (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, target poza repo, usuniety): p6_credibility 15 ok; p6_tickdiplo 1 ok; p6_wire_war_dipl_steps 8 ok; p6_wire_war_diplo 13 ok; p6_wire_war_inputs 16 ok; p6_wire_war_pipeline 7 ok; EXIT 0. NIE_ZMIERZONO: pelny cargo test --no-fail-fast, fmt, clippy i cargo test --lib w tej obronie (fmt/clippy/lib wg raportu operatora i Evaluatora).
BLOKADY: brak blokad dla tej rundy. Otwarte zaleznosci (nie naprawiane tutaj): patrz zarzut 1 i 2.
RUNDY: 1/5 obrony (Operator); ostatni werdykt Evaluatora: PASS-WITH-NOTES.
NASTEPNY KROK: Evaluator i Final Control na SHA tego commita (po zamknieciu obrony). Przed integracja: zarzut 1 jako zaleznosc od tematu deklaracji wojny.
DEPLOY/PUSH: NIE WYKONANO

---

## Odpowiedzi na zarzuty

### Zarzut 1: hak note_war_entered (P4) nie jest wolany w Rust
ODPOWIEDZ: PRZYJMUJE jako zaleznosc (bez poprawki w tym temacie).
- Dowod: `rust-port/engine/src/domain/credibility.rs:854` (metoda istnieje); `grep -rn note_war_entered rust-port/engine/src` zwraca tylko definicje i komentarz w `turn_war_dipl_steps.rs:23`. Wywolanie wymaga wpiecia w deklaracje wojny (`diplomacy*.rs` / `war_turn_declare.rs`), a te pliki sa poza allowlista tego tematu.
- Ryzyko: D4 jest juz wpiete (`turn_war_dipl_steps.rs` credibility_steps), wiec `tick_no_war_milestone` moze przyznac wieloletni_pokoj bez zerowania licznika przy wojnie zadeklarowanej w Rust. Zgadzam sie, ze to realne ryzyko produkcyjne, a nie tylko luka w papierze.
- Wymagany warunek: przed wlaczeniem nagrody P4 w produkcji wpiac `note_war_entered` przy deklaracji wojny (osobny temat, allowlista z deklaracja wojny). Do tego czasu: NIE odnotowywac nagrody P4 jako "pokryte".

### Zarzut 2: domyslne difficulty=Normal i pusty credibility_excluded_owners
ODPOWIEDZ: ODRZUCAM zarzut o cichym bledzie produkcyjnym jako niepoprawny w obecnym stanie; PRZYJMUJE ryzyko jako dlug.
- `credibility_excluded_owners` (barbarzyncy): dowod, ze w produkcji nie ma wlascicieli-barbarzyncow: `turn_war_pipeline.rs:223` - `is_barbarian: false` ("PlayableState nie ma barbarzyncow"). Pusty zbior odpowiada obecnemu zbiorowi wlascicieli. To dotyczy tylko przyszlych barbarzyncow.
- `difficulty` = Normal: swiadoma, udokumentowana decyzja. `turn_war_inputs.rs:107` mowi "trudnosc = Normal (difficulty:NOT_IMPLEMENTED w StartGameParams)"; `turn_war_dipl_steps.rs:91` to samo. Zwrot bledu zamiast Normal zatrzymalby kazda ture w produkcji, bo producent nie ma zrodla trudnosci.
- Dlug: wiring `StartGameParams.difficulty` i wykluczen w `dipl_steps_inputs` (`turn_war_inputs.rs:634`) - poza allowlista. Zapisane jako zaleznosc obok zarzutu 1.

### Zarzut 3: odstepstwo od dyspozycji (opaque meta zamiast #[serde(default)])
ODPOWIEDZ: PRZYJMUJE jako odstepstwo (swiadome, udokumentowane); bez zmiany kodu.
- Dowod: klucz `wiarygodnoscP4MilestonesByOwner` wystepuje w pinie (`git grep -c wiarygodnoscP4MilestonesByOwner 07d2fbd72 -- gra` = 9 trafien w `gra/src/main.ts`), wiec nie jest wymyslony. Brakujacy klucz w starym zapisie = pusty rejestr (brak migracji). Zgodnosc wsteczna pokryta fixture `tests/p6_credibility_vectors/save_before_cred.json` (`p6_credibility.rs:38`, test `web_format_registry_round_trips_unchanged_and_survives_a_turn`).

### Zarzut 4: legacy umowa_handlowa scalona aliasem serde z umowa_szlakow
ODPOWIEDZ: PRZYJMUJE jako dlug (nie naprawiane w tym temacie).
- Dowod: `rust-port/engine/src/domain/diplomacy.rs:1403` - `#[serde(rename = "umowa_szlakow", alias = "umowa_handlowa")] TradeRoute`; `stream_kind_of` (`credibility.rs:615-627`) nie ma wariantu TradeAgreement. Stad zapis `umowa_handlowa` w Rust trafia jako TradeRoute i dostaje bezwarunkowy S3, a pin wymaga warunkowego (P3).
- Pokrycie: `p6_credibility.rs:248` (`legacy_trade`) testuje warunkowy S3 tylko na poziomie funkcji, bez 3 tur.
- NIE_ZMIERZONO: czy jakakolwiek sciezka produkcyjna wczytuje zapisy z `umowa_handlowa` (nie sprawdzone w tej rundzie).
- Dlug: zmiana aliasu w `diplomacy.rs` (poza allowlista) + test 3 tur z legacy kind.

### Zarzut 5: D2 i N6 zapisywane lacznie po D3
ODPOWIEDZ: PRZYJMUJE jako ograniczenie testu; kod bez zmian.
- Dowod: `credibility_steps` iteruje `report.credibility_requests` w kolejności zapisu (`turn_war_dipl_steps.rs`, pierwsza petla credibility_steps), wiec kolejnosc D2 przed N6 jest zachowana. Test 3 tur (`p6_credibility.rs:631`) nie rozroznia kolejnosci wzgledem pinu. Ryzyko niskie (zgoda z zarzutem).

### Zarzut 6: NIE_ZMIERZONO - pelny cargo test
ODPOWIEDZ: PRZYJMUJE; czesc odtworzona (patrz TESTY). Pelny `cargo test --no-fail-fast` nie byl odtwarzany w tej obronie. Wynik operatora (410 binarek, 0 FAILED) pozostaje niepotwierdzony przeze mnie i wymaga odtworzenia przez Final Control przed integracja.

---

## Zaleznosci do sledzenia (poza tym tematem)
1. `note_war_entered` przy deklaracji wojny (zarzut 1) - blokuje nagrode P4 w produkcji.
2. `StartGameParams.difficulty` i wykluczenia wlascicieli w `turn_war_inputs.rs:634` (zarzut 2).
3. Alias `umowa_handlowa` w `diplomacy.rs:1403` + test 3 tur warunkowego S3 (zarzut 4).
