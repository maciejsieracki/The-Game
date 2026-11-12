# 02a — obrona Operatora, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-SOURCES-INTEG-Q1
GOAL: rozwiązanie konfliktu merge ab9cc23e2 (POWER-SOURCES) z b9800e0a7 (POWER-NAN-STRICT) zachowujące oba zamiary; odpowiedź na zarzuty Evaluatora.
ZMIANY/COMMIT: brak zmian kodu w tej rundzie obrony. Kod integracji: f7bb7b286 (merge; parents b9800e0a7 + ab9cc23e2; raport operatora 604fca082 na rust-port-wip/P6-POWER-SOURCES-INTEG-Q1, nie wypchnięty). Ten plik: commit obrony na lokalnej gałęzi rust-port-wip/P6-POWER-SOURCES-INTEG-Q1-obrona-r1 (SHA podany w raporcie odpowiedzi). Brak push.
TESTY: patrz sekcja "Dowody" poniżej.
BLOKADY: brak.
RUNDY: 1/5 (obrona).
NASTĘPNY KROK: Evaluator r2 albo decyzja orkiestratora po przyjęciu obrony (bez integracji przez Operatora).
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

### Zarzut 1 — pliki poza wąską allowlistą (uwaga)

Werdykt: ODRZUCAM jako defekt; fakt potwierdzam.

Dowód:
- `git diff ab9cc23e2 f7bb7b286 -- rust-port/engine/src/domain/brake_power_army.rs rust-port/engine/src/domain/brake_power_producers.rs rust-port/engine/tests/p6_power_producers.rs rust-port/engine/tests/p6_power_sources.rs` daje PUSTY wynik. Te pliki w merge są bajt w bajt tym, co wniósł ab9cc23e2.
- Jedyna ręczna zmiana Operatora względem drugiego rodzica to rozwiązanie konfliktu w `rust-port/engine/tests/p6_power_nozeros.rs` (plik na allowlistie).
- Dyspozycja nakazuje `merge ab9cc23e2`, więc wniesienie pełnej zawartości FC (w tym `02a-obrona.md`, `03-final-control.md` z katalogu R-RUSTPORT-P6-POWER-SOURCES-Q1) jest zgodne z intencją integracji. Allowlista dotyczyła edycji Operatora, nie zawartości merge.

### Zarzut 2 — ręczna lista `auto_applied` (uwaga)

Werdykt: ODRZUCAM jako defekt; fakt potwierdzam. Ryzyko dryfu jest pokryte asercją dwustronną.

Dowód:
- `apply_produced` (`rust-port/engine/src/domain/brake_power_producers.rs:153-158`) zapisuje dokładnie 4 pola: `suma_ludkow`, `rekrut_ekw`, `miasta`, `kultura_imperium`, czyli klucze `ludki`, `rekruci`, `miasta`, `kultura`. Lista `auto_applied` w `p6_power_nozeros.rs` jest tym samym zbiorem.
- Test `open_components_without_producer_list_is_table_minus_apply_produced_keys` porównuje błąd `Missing` z `COMPONENT_SOURCES` minus `auto_applied`. Rozjazd w obu kierunkach zostaje wykryty:
  - klucz dodany do `apply_produced` bez aktualizacji listy: klucz jest w `expected`, a nie ma go w `Missing`, więc asercja pada;
  - klucz usunięty z `apply_produced`: klucz jest w `Missing`, a nie ma go w `expected`, więc asercja pada.
- Dodatkowo ten sam test ma twardą listę 8 kluczy (`armia, bitwy, terytorium, infra, tech, ulepszenia, religia, zdobycze`), więc zmiana samej tabeli `COMPONENT_SOURCES` też jest widoczna.
- NIE_ZMIERZONO: nie wykonano testu mutacyjnego (celowego psucia `apply_produced` i obserwacji czerwieni). Werdykt opiera się na czytaniu kodu.

### Zarzut 3 — brak odtworzenia pełnego `cargo test --no-fail-fast` przez Evaluatora (uwaga)

Werdykt: PRZYJMUJĘ. Pełny test został odtworzony w tej rundzie.

Dowód (rust-port/engine, HEAD = f7bb7b286, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo):
- `cargo test --no-fail-fast`: EXIT 0 (`CARGO_EXIT=0` w logu).
- Suma po wszystkich binariach: passed 2840, failed 0, ignored 1.
- Jedyny ignorowany test: `e2e::dump_tick1_econ_for_web_generator` (generator, poza `p6_power_*` i `brake_power*`). Grep `#[ignore` w `p6_power_*.rs` i `brake_power*.rs` daje zero trafień.
- Log: `/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/obrona-test.log`.
- Raport operatora podawał "2840 passed, 0 failed" bez wzmianki o 1 ignorowanym; uzupełniam to tutaj.

Nie powtarzałem w tej rundzie `cargo fmt --check` ani `cargo clippy -D warnings`; wyniki EXIT 0 z Evaluatora pozostają w mocy (NIE_ZMIERZONO w tej rundzie).

## Sprzątanie

- Katalog CARGO_TARGET_DIR w scratchpadzie usunięty po bramkach.
- `rust-port/engine/Cargo.lock` (untracked, wygenerowany lokalnie) nie jest commitowany.
