# 02a — Obrona Operatora r1 — R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1
GOAL: plany marszu w `PlayableState` (`plannedMarches` z `attackUnitId`, `marchAttackTargets`, `marchStopNotified`,
`marchStopDetail`), zapis i odczyt przez `SavedPlannedMarch`, golden bez zmian.
ZMIANY/COMMIT: gałąź `R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1-wip/obrona-r1`, rodzic `23e3f056d` (Evaluator r1),
commit — patrz §5 (SHA podany w odpowiedzi do orkiestratora).
TESTY: §4.
BLOKADY: brak.
RUNDY: 1/5 (Obrona po Evaluatorze r1 PASS-WITH-NOTES).
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## 0. Baza

- Dispatch: `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1/00-dispatch.md`,
  nadal runda 1 — **DODATKU r2 w pliku nie ma** (sprawdzone ponownie przy tej Obronie, po `git fetch`).
- `origin/rust-port/parity-v2` = `a01363d5f`; `git merge-base --is-ancestor 7817ef0c a01363d5f` = EXIT 0
  (parity-v2 zawiera `7817ef0c`, zgodnie z poleceniem). Rodzic tej rundy: `23e3f056d` → `25da353f8` → … → `a01363d5f`.

## 1. Odpowiedzi na zarzuty

### Z1 — powtórzony `unitId` w formie listowej: deduplikacja po filtrze — **PRZYJMUJĘ**

Zarzut prawdziwy. Web (`gra/src/game/planned-march.ts@07d2fbd72:451-482`) filtruje wpisy obiektu
`plannedMarches` po `JSON.parse`, który dla powtórzonego klucza trzyma pierwszą pozycję i OSTATNIĄ wartość —
filtr widzi więc wyłącznie ostatnią wartość. Port przekazywał do `planned_marches_from_save` wszystkie wpisy
listy, a scalał je dopiero w pętli wstawiania; odrzucona (lub niewyrażalna) ostatnia wartość zostawiała plan
z wcześniejszego wpisu.

Poprawka (`rust-port/engine/src/domain/save_load.rs`, `restore_playable_planned_marches`): lista `entries`
jest budowana ze scalaniem powtórzeń PRZED wywołaniem `planned_marches_from_save` — pierwsza pozycja,
ostatnia wartość (ta sama reguła co `visit_map` dla obiektu weba). Doc-komentarz poprawiony: opisuje teraz
scalanie przed filtrem i to, że odrzucona/niewyrażalna ostatnia wartość nie zostawia planu.
Zachowanie dla zapisów weba (obiekt, scalany już w `visit_map`) i dla zapisów Rust (bez duplikatów) — bez zmian.
Kolejność `autoMarch` (legacy dodawany tylko gdy `!out.has(leaderId)`) — bez zmian, bo niewyrażalne wpisy
nadal są w wyniku `planned_marches_from_save` (jak w webie trzymają klucz w `Map`).

Test (`rust-port/engine/tests/p4_1j_planned_march_state.rs`, nowy `restore_merges_duplicates_before_filter`):
- (A) `[(1→5,0 atak 9), (1→0,0 = pozycja jednostki)]` → brak planu, brak celu ataku, pusty raport (web
  `planned-march.ts:466` odrzuca ostatnią wartość);
- (B) `[(1→5,0 atak 9), (1→2.5,0)]` → brak planu, brak celu ataku, `unrepresentable == ["1"]` (raport zgodny ze stanem);
- kontrola: `[(1→0,0), (1→5,0 atak 9)]` → plan `(5,0)` z atakiem 9 i `march_attack_targets[1] = 9`.

Dowód czułości: ten test uruchomiony na NIEPOPRAWIONYM `save_load.rs` (blob z `23e3f056d`, podmieniony
tymczasowo w drzewie roboczym, nie commitowany) — `FAILED` w asercji (A) „A: brak planu jak w webie”
(`tests/p4_1j_planned_march_state.rs:389`), 8 pozostałych testów pliku ok. Po przywróceniu poprawki: 9/9 ok.
Istniejący test `restore_keeps_one_entry_per_unit_and_uses_owner_parameter` (duplikat z poprawną ostatnią
wartością) przechodzi bez zmian.

### Z2 — odwrócony `is-ancestor` w raportach Operatora — **PRZYJMUJĘ**

`git merge-base --is-ancestor 7817ef0c a01363d5f` = EXIT 0; `git merge-base --is-ancestor a01363d5f 7817ef0c`
= EXIT 1. Parity-v2 (`a01363d5f`) zawiera `7817ef0c`; raporty Operatora miały argumenty odwrócone.
Sprostowanie dopisane (bez usuwania historii) w `01-operator-impl.md` §0 i `01b-operator-pomiary.md` §0,
z odesłaniem tutaj. Kod bez wpływu. Brak DODATKU r2 w pliku dispatchu pozostaje faktem (§0).

## 2. Uwagi (nie zarzuty) — stanowisko

- **U1** (`forbid(unsafe_code)` nieobecny w civ-engine): **zgoda**, bez zmian. Kryterium 4 dispatchu w tej
  części jest puste — atrybutu nie ma ani na bazie, ani na gałęzi; nic nie usunięto, nowy kod (r1 i ta runda)
  nie używa `unsafe`. Dodanie atrybutu do `lib.rs` jest poza allowlistą — do decyzji orkiestratora.
- **U2** (brak produkcyjnego wołającego zapisu/odczytu planów): **zgoda**, poza zakresem P4-1J; wpięcie
  przy P4-1H albo przy ścieżce zapisu `PlayableState`.
- **U3** (`marchStopNotified`/`marchStopDetail`/`marchAttackTargets` w JSON DTO `PlayableState`): **zgoda**.
  Ścieżka `SaveSnapshot` (`with_playable_planned_marches` / `restore_planned_marches`) ich nie zapisuje
  i czyści przy odczycie (jak web `main.ts:46272-46279`). Ryzyko dotyczy wyłącznie użycia JSON
  `PlayableState` jako zapisu gry — do pilnowania przy wpinaniu zapisu (U2).
- **U4** (`generalTargetId` pominięty, raport `general_target_dropped`): **zgoda**; zachowanie marszu
  za generałem po wczytaniu — NIE_ZMIERZONO (zadanie #221).
- **U5** (decyzja techniczna r1: `UnitId`/`i32` + raport `unrepresentable`): do wpisu przez orkiestratora
  w `REJESTR-RUST.md` (poza allowlistą Obrony).

## 3. Allowlista

Zmienione w tej rundzie: `rust-port/engine/src/domain/save_load.rs` (wyłącznie `restore_playable_planned_marches`:
doc-komentarz i budowa `entries`), `rust-port/engine/tests/p4_1j_planned_march_state.rs` (nowy test, istniejące
bez zmian), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1/{01-operator-impl.md,
01b-operator-pomiary.md,02a-obrona.md}`. Zero zmian w `gra/**`, `rust-port/renderer/**`, `rust-port/view-model/**`,
`src-tauri/**`, fixturach, `Cargo.lock` (nie commitowany).

## 4. Bramki

Czysty `CARGO_TARGET_DIR` poza repo (scratchpad sesji), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
CARGO_PROFILE_TEST_DEBUG=0`, w `rust-port/engine`:

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_1j_planned_march_state` | 9 passed, 0 failed |
| `cargo test --all-targets --no-fail-fast` (pełny) | EXIT 0; 470 zestawów; 3395 passed (3394 u Evaluatora + 1 nowy); 0 failed; 1 ignored (istniejący `e2e::dump_tick1_econ_for_web_generator`) |
| `git diff --check` | czysto |

## 5. Commit

Jawne `git add` czterech plików + tego raportu; bez `-A`, bez push.
