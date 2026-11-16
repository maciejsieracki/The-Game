# 02a Obrona Operatora — K5DOC-PROD-UNIT-STAN-T0 (runda 1, obrona)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0
GOAL: pola stanu doktryny jednostki, `_forwardCol` i `GroupDoctrine` bez zmiany zachowania (T0 z rozpoznania #112)
ZMIANY/COMMIT: operator `d6d23f038` (r1); obrona `3e041ecbe` (kod: usunięcie duplikatów, testy); ten raport w commicie dokumentacyjnym obrony (SHA w rejestrze orkiestratora)
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT 0 (passed=3633 failed=0 ignored=1; ignorowany był wcześniej; p6_k5doc_state 9/9)
BLOKADY: patrz sekcja „Otwarte” niżej (zapis dry_col nie jest wpięty; blokuje przyszły temat czytający to pole, nie T0)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r2 (weryfikacja zmian obrony) → Final Control
DEPLOY/PUSH: NIE WYKONANO

Baza: `origin/rust-port/parity-v2` = `1a4982574`. Pin: `07d2fbd72`. Worktree: detached na `3e041ecbe`. Nie pushowano, nie integrowano, `gra/` nietknięte, `Cargo.lock` nie commitowany.

## Odpowiedzi na zarzuty

### Zarzut 1 — duplikacja stanu (dry_col, held_after_fallback, mounted) — PRZYJMUJĘ
Potwierdzone w kodzie: `ActivateUnit` (`rust-port/engine/src/domain/siege_tactics_activate.rs:63, 67, 68`) już niesie `mounted`, `dry_col: f64`, `held_after_fallback`, a K5H mutuje je w `activate.rs:427-445`. Nowe pola w `ProdDoctrineState` były drugim źródłem prawdy.

Decyzja: jedno źródło prawdy to `ActivateUnit` (`ProdUnit::activate`). Usunięte z `ProdDoctrineState`: `dry_col`, `held_after_fallback`, `mounted` (wraz z wartościami domyślnymi i asercjami). Komentarze w `ProdDoctrineState` i `ProdBody.doctrine` wskazują, gdzie te pola są.

Otwarte (NIE_ZMIERZONO, nienaprawiane tutaj): `ProdBody::complete`/`start` klonuje `pu.activate` do `au` (`siege_tactics_loop.rs` ok. 1069) i po aktywacji zapisuje z powrotem tylko `morale` i `surround_applied`. Mutacje `dry_col` i `held_after_fallback` z K5H (U7.6) giną po aktywacji, więc `ActivateUnit.dry_col` nie przenosi się między aktywacjami. Naprawa zmienia zachowanie ścieżki U7.6 (dziś poza zakresem produkcji), dlatego nie wchodzi do T0 („zero zmiany zachowania”). Temat, który będzie czytał `dry_col` lub `held_after_fallback`, musi najpierw domknąć zapis z powrotem; proponuję wpisać to jako warunek wstępny do T1–T9 w rejestrze.

### Zarzut 2 — odstępstwo: pola w `ProdBody`, nie w `ProdUnit` — PRZYJMUJĘ jako fakt, zgłaszam do decyzji orkiestratora
Dispatch: „Pola w `ProdUnit` i/lub w `ActivateUnit`” oraz w allowliście „TYLKO struktura `ProdUnit`, konstruktory i ewentualny `use`”. Operator dodał `ProdBody.doctrine` (`siege_tactics_loop.rs`, konstruktor `ProdBody::new`, accessor `doctrine()`). Literał `ProdUnit` w `tests/p6_k5loop_outcome_pin.rs:173` jest poza allowlistą, więc dodanie pola do `ProdUnit` przerwie kompilację tego testu. Obrona nie zmienia lokalizacji. Decyzja, czy zaakceptować odstępstwo, czy rozszerzyć allowlistę o ten literal, należy do orkiestratora.

### Zarzut 3 — test domyślnych wartości tylko dla jednej jednostki — PRZYJMUJĘ
Dodany test `domyslne_pola_doktryny_dla_wielu_jednostek_i_pustej_strony` (`rust-port/engine/tests/p6_k5doc_state.rs`): strona atakującego z 3 jednostkami (każdy element = `ProdDoctrineState::default()`), strona obrońcy pusta (`doctrine[1].is_empty()`), długość `doctrine[0] == 3`.

Mutacje (wykonane po poprawkach, pliki przywrócone, `cmp` potwierdza):
- (a) `shooting_enabled` domyślnie `false` → FAIL (`domyslne_pola_doktryny_zgodne_z_pinem`, `p6_k5doc_state`: 8 passed, 1 failed).
- (b) `forward_col` z odwróconym znakiem kroku → FAIL (3 testy: `forward_col_dodatni_kierunek_atakujacego`, `forward_col_granice_planszy_clamp`, `forward_col_ujemny_kierunek_obroncy`).
- (c) dodatkowo: `ranged_kite` domyślnie `false` → FAIL (`domyslne_pola_doktryny_zgodne_z_pinem`). Mutacja spoza wymaganych, wykonana dla pokrycia.

### Zarzut 4 — informacyjne (forward_col, GroupDoctrine::parse, BattleUnitClass bez wołającego) — PRZYJMUJĘ jako informację, bez zmian kodu
Sprawdzone `git grep`: `forward_col`, `GroupDoctrine`, `BattleUnitClass` są wołane wyłącznie w `siege_tactics_doctrine_state.rs` i w testach `p6_k5doc_state.rs` (pliki `*.mjs` i `siege_tactics_activate.rs` pojawiają się tylko w komentarzach/generatorach). Zgodne z dispatchem: czytają je T1–T9. Brak jawnej zależności od W8 w zakresie T0 (potwierdzam ustalenia operatora); `mounted`, `antiCavSpear`, `attackDirection` poza zakresem T0.

### Zarzut 5 — uszkodzone znaczniki w wiadomości raportu operatora — PRZYJMUJĘ jako dotyczące wyłącznie wiadomości
Plik `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0/01-operator-r1.md` sprawdzony `grep`em: brak znaczników `<parameter name=...>` w treści; plik jest poprawny. Wiadomość zwrotna w formie JSON miała zepsute pola `testy`/`blokady`; nie wpływa na artefakt. Bez zmiany pliku.

## Wynik bramek po obronie (commit `3e041ecbe`)
- `cargo fmt --check` — EXIT 0
- `cargo clippy --all-targets -- -D warnings` — EXIT 0
- `cargo test --all-targets --no-fail-fast` — EXIT 0; passed=3633, failed=0, ignored=1 (ignorowany istniejący)
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w `/tmp/claude-0/`, usunięty po bramkach.
- Dysk `/`: 17 GB wolne po sprzątaniu.

## Dla orkiestratora
- Decyzja do zatwierdzenia: lokalizacja pól (ProdBody zamiast ProdUnit, zarzut 2).
- Warunek wstępny dla tematów doktryny: zapis `dry_col`/`held_after_fallback` z powrotem do `pu.activate` (zarzut 1, otwarte).
