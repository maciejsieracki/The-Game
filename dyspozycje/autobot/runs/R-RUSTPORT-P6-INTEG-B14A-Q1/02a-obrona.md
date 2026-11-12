# 02a-obrona — R-RUSTPORT-P6-INTEG-B14A-Q1 (obrona Operatora, runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-INTEG-B14A-Q1
GOAL: odpowiedź na zarzuty Evaluatora/FC do scalenia batch 14a (d337d9238).
ZMIANY/COMMIT: patrz sekcja „SHA” poniżej.
TESTY: patrz sekcja „Bramki po obronie”.
BLOKADY: brak (punkt 2 — dług rejestrowany poniżej, bez zmiany zachowania).
RUNDY: 1/5 (obrona w tej samej rundzie integracyjnej)
NASTĘPNY KROK: ponowna ocena Evaluatora/FC na SHA obrony.
DEPLOY/PUSH: NIE WYKONANO (brak push; gałąź lokalna)

## Odpowiedzi na zarzuty

### Z1. Kosmetyka: doc-komentarz `check_terytorium` — PRZYJMUJĘ
Zarzut prawdziwy. W commicie ULEPSZENIA (ce3417de5, `p6_power_sources.rs`) doc-komentarz
„Producent `terytorium` na wektorach `terytorium` (p6_power_army_vectors).” został zastąpiony
komentarzem producenta `ulepszenia`, który przy `check_ulepszenia` (linia ~140) już istnieje.
Efekt: `check_terytorium` nie miało opisu.
Poprawka: przywrócono oryginalny doc-komentarz nad `fn check_terytorium`. Komentarz `ulepszenia`
zostaje tylko przy `check_ulepszenia`. Zmiana wyłącznie komentarza.
Dowód: `rust-port/engine/tests/p6_power_sources.rs` (+1 linia); `cargo test --test p6_power_sources`
4 passed, 0 failed, EXIT 0.

### Z2. Dług: `power_raw_for_owner` ustawia `ulepszenia_terenu = ExplicitZero` — PRZYJMUJĘ (wpis w rejestrze poniżej, bez zmiany kodu)
Stan faktyczny: `turn_war_inputs.rs:342` ustawia `ExplicitZero`; klucz `ulepszenia` nie jest w
`EXPLICIT_ZERO_REASONS` (lista ma 2 pozycje: bitwy, zdobycze); producent `brake_power_improvements`
istnieje w `COMPONENT_SOURCES`, ale NIE jest podpięty do `power_raw_for_owner` (zakaz w dispatchu:
podłączenie to osobny temat). Pilnujące asercje: `p6_wire_war_inputs.rs:268`
(`assert_eq!(raw.ulepszenia_terenu, Component::ExplicitZero)`) oraz komentarz w `turn_war_inputs.rs:336-339`.
Zmiana kodu nie była wymagana przez dispatch i nie zmienia zachowania; nie dodaję nowego testu
(poza allowlistą adaptacji oczekiwań ulepszeń).

**Rejestr długu (wpis):**
- ID: DLUG-POWER-ULEPSZENIA-WIRING
- Opis: `ulepszenia_terenu` w `power_raw_for_owner` = `ExplicitZero` mimo istniejącego producenta `brake_power_improvements` (POWER-ULEPSZENIA-Q1).
- Źródło parytetu: web `countImprovementsForOwner` (main.ts:2643).
- Strażnicy aktualnie: `p6_wire_war_inputs.rs:268` (wartość ExplicitZero), `p6_power_sources.rs` (`no_producer_entries_are_exactly_the_two_open_components`), komentarz `turn_war_inputs.rs:336-339`.
- Warunek zamknięcia: podłączenie producenta w `power_raw_for_owner` (wymaga stanu ulepszeń w PlayableState lub ścieżki z hexów) — wtedy zmienić asercję w `p6_wire_war_inputs.rs:268` na `Provided` i usunąć ExplicitZero w `turn_war_inputs.rs:342`. Jako osobny temat, z jego własnym dispatchem.
- Status: OTWARTY, zarejestrowany w tym pliku; do podjęcia w temacie wiring ULEPSZENIA (zadanie w planie: „wiring ULEPSZENIA po INTEG-B13”).

### Z3. Zmiana publicznego API `PlayableGame::replace_unit` — PRZYJMUJĘ (brak w raporcie r1, uzupełnione tutaj)
Zarzut prawdziwy, raport r1 tego nie wymienił. Stan przed scaleniem (db1e75378): `replace_unit(unit_id, new_type_id, defs, gate)` — 4 argumenty.
Stan po scaleniu (L3-KOSZT + L3-DEFS):
- `replace_unit(unit_id, new_type_id, gate)` — 3 argumenty; tabela `defs` pochodzi z `replace_defs()` (produkcyjna tabela `production_replace_defs_for_civ`, kategoria `categoryOf`, koszt/HP z trudności i tempa; nieznana etykieta trudności = błąd).
- `replace_unit_with_defs(unit_id, new_type_id, defs, gate)` — wariant z jawną tabelą (testy i scenariusze L3).
Udokumentowane w doc-komentarzach `playable.rs` (ok. linii 780–815). Wszystkie wywołania w `rust-port/engine/src` i `rust-port/engine/tests` zaktualizowane (`p6_unit_replace_defs.rs`, `p6_unit_replace_l3_state.rs`, testy w `playable.rs`); kompilacja testów OK.
Konsekwencja parytetowa (wyjaśnione w kodzie, teraz też w doc-komentarzu `PLAYABLE_UNIT_PROGRESS`, `playable.rs` ok. linii 400–403): stan nie ma pól `battlesSurvived` i `parametryBonusProc`, więc HP po zamianie zranionej lub doświadczonej jednostki NIE jest parytetowe z web. Dług do utrzymania: zamienić stałą `PLAYABLE_UNIT_PROGRESS` na odczyt z jednostki, gdy stan dostanie te pola. Rejestr: DLUG-UNIT-REPLACE-PROGRESS (otwarty; warunek: dodanie pól do PlayableState).

Zmiana w `playable.rs` ograniczona do doc-komentarza `PLAYABLE_UNIT_PROGRESS` (+2 linie).

### Z4. Wynik bramek — PRZYJMUJĘ (potwierdzenie, bez zmian)
Liczby z raportu r1 (fmt 0, clippy -D warnings 0, pełny cargo test passed=3022 failed=0 ignored=1, lib 64 passed) są zgodne z moim stanem przed poprawkami komentarzy. Jedyny `#[ignore]` istnieje od wcześniej (`p6_order_lane.rs:1530`). Allowlista zachowana, brak push. Zmiany asercji ograniczone do ulepszeń (`p6_wire_war_inputs.rs` keys `[bitwy, ulepszenia, zdobycze]` → `[bitwy, zdobycze]`, `EXPLICIT_ZERO_REASONS` 3 → 2) — bez zmian w tej obronie.

## Bramki po obronie

Zmiana po obronie to wyłącznie komentarze (`p6_power_sources.rs` +1 linia, `playable.rs` doc +2 linie):
- `git diff --check`: czysto.
- `cargo fmt --check`: EXIT 0.
- `cargo test --test p6_power_sources`: 4 passed, 0 failed, EXIT 0.
- `cargo test --lib`: 64 passed, 0 failed, EXIT 0.
- Pełnego `cargo test --no-fail-fast` nie powtarzano (zmiana wyłącznie komentarzy; wynik r1: passed=3022, failed=0, ignored=1 dla tego samego kodu wykonawczego).
- `cargo clippy` nie powtarzano (komentarze nie wpływają na lint); r1: EXIT 0.

## SHA

- Obrona (commit na gałęzi lokalnej `rust-port-wip/INTEG-B14A-Q1-obrona`, bez push): SHA w sekcji „Commit” poniżej.
- Baza obrony: d337d9238 (operator r1).

## Commit
(uzupełniane po commicie)
