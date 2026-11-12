STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-ARMIA-TERYTORIUM-Q1
GOAL: obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora 02-evaluator.md, commit 0272ca8f1): armyFieldPower + producenci armia/terytorium computeObjectivePower, wektory z pinu 07d2fbd72
ZMIANY/COMMIT: poprawka na bazie kodu 388610589 (raport 01-operator-r1.md w ffda91ed3); SHA obrony: patrz sekcja "SHA" niżej; allowlista zachowana (tests/p6_power_army.rs, tests/p6_power_army_gen.mjs, tests/p6_power_army_vectors/vectors.json); brak zmian w gra/, Cargo.toml, Cargo.lock (nieśledzony, niecommitowany), WERSJE.md, origin/main
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib EXIT 0 (48 passed, 0 ignored); cargo test --test p6_power_army EXIT 0 (7 passed, 0 ignored; poprzednio 6: dodany real_unit_records_match_web_pin)
BLOKADY: zarzut 1 (baza) wymaga decyzji orkiestratora; zarzut 3 (COMPONENT_SOURCES) poza allowlistą, zgodnie z dispatchem
RUNDY: 1/5 (obrona w tej samej rundzie, bez zmiany werdyktu bazowego)
NASTĘPNY KROK: ponowny Evaluator (zarzuty 2 i 4 przyjęte z dowodem), decyzja orkiestratora o bazie (zarzut 1), W8 r3 dla zarzutu 3
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. Baza 8a98f31fd nie jest przodkiem origin/rust-port/parity-v2 -- PRZYJMUJĘ (fakt), bez zmiany kodu
Dowód (wykonany w worktree):
- `git merge-base --is-ancestor 8a98f31fd origin/rust-port/parity-v2` -> brak (NIE jest przodkiem).
- `git merge-base --is-ancestor a91b3b766 origin/rust-port/parity-v2` -> TAK.
- `git cat-file -e origin/rust-port/parity-v2:rust-port/engine/src/domain/brake_power_producers.rs` -> fatal: nie istnieje na parity-v2 (istnieje tylko na gałęzi POWER-PRODUCERS).
Nie zmieniam bazy: dispatch wskazuje 8a98f31fd, a wybór bazy integracji należy do orkiestratora. Kod 388610589 nie zawiera rebase'u na parity-v2. Do decyzji: (a) integracja POWER-PRODUCERS na parity-v2, potem rebase 388610589 (konflikt w domain/mod.rs, 1 linia pub mod), albo (b) integracja na 8a98f31fd. Operator nie rozstrzyga tego sam.

### 2. ArmyUnitDef::from_unit_record nie jest pokryta testem -- PRZYJMUJĘ, poprawka + dowód
Poprawka (commit obrony):
- tests/p6_power_army_gen.mjs: nowa sekcja `armyFieldReal`: 75 realnych rekordów z `gra/data/units.json` PINU 07d2fbd72 (surowy JSON jak w pliku), `expect = web.armyFieldPower(rekord)` wykonane przez generator (nie ręcznie). Losowanie `randomDef` bez zmian dla pozostałych sekcji.
- tests/p6_power_army_vectors/vectors.json: regenerowany tym generatorem (`node gen <WEB_ROOT> 07d2fbd72...`, WEB_ROOT = git archive pina gra/src gra/data poza repo). Liczności: armyField 80, armyFieldReal 75, armia 60, terytorium 50.
- tests/p6_power_army.rs: nowy test `real_unit_records_match_web_pin`: dla każdego rekordu `serde_json::from_value::<UnitRecord>` -> `ArmyUnitDef::from_unit_record` musi być równe `def_from(rekord JSON)` (mapowanie użyte w wektorach) oraz `army_field_power` równe `expect` z pina (bit-dokładnie, NaN obsłużony).
Uwaga (NIE_ZMIERZONO poza tym testem): test porównuje z rekordami PINU. Plik `rust-port/engine/data/units.json` różni się od pina (`git cmp` różnica od bajtu 2044; 50 rozbieżności pól to decyzja GAMEPLAY #27). Ten temat tego nie rozstrzyga i nie twierdzi, że Rust units.json = pin.

### 3. Producenci nie są podłączeni do COMPONENT_SOURCES (NoProducer) i nie są wołani w Rust -- ODRZUCAM jako wadę (zgodne ze zleceniem), potwierdzam dług
Dispatch wprost wyklucza `domain/brake_power_producers.rs` z allowlisty; zmiana COMPONENT_SOURCES jest poza zakresem tego tematu. Wołający (W8 r3) jest jawnie zależnością i jest udokumentowany w nagłówku `brake_power_army.rs` (wymaga `count_settlers`, jednostek z `unitDefFor`, miast i fortów stanu). Nie zmieniam kodu. Dług zostaje na liście do W8 r3.

### 4. Brak wektora przypadku cache NaN/Infinity -- PRZYJMUJĘ, poprawka + dowód
Poprawka:
- Generator: wartości cache `fieldPower` losowane z `[4, 17.5, 0, 99.25, NaN, Infinity, -Infinity]` (poprzednio bez niefinitycznych). Wektory: 10 przypadków armyField z niefinitycznym cache (napisy "NaN"/"Infinity"/"-Infinity" zgodnie z kodowaniem generatora).
- Rust: `def_from` mapuje cache przez `f()` (napisy -> NaN/Infinity), więc niefinityczny cache trafia do gałęzi `cache.is_finite()` zamiast być po cichu odrzucony przez parser. Dodana asercja pokrycia: każdy z trzech literałów musi wystąpić w `armyField`.
- Pin (unit-power.ts, armyFieldPower): cache używany tylko gdy `typeof number && Number.isFinite && rangedDamageMultFor === 1`, inaczej live `fieldPower`. Wektory z pinu potwierdzają to dla NaN/Infinity: test `army_field_power_matches_web_pin` przechodzi bit-dokładnie.

## Dowody gałęzi i zakresu
- Zmienione pliki (git status): tests/p6_power_army.rs, tests/p6_power_army_gen.mjs, tests/p6_power_army_vectors/vectors.json. Cargo.lock nieśledzony, nie commitowany. `git diff --check` czysto.
- Kod produkcyjny (brake_power_army.rs, mod.rs, unit_power.rs) NIE zmieniony w tej obronie.
- Brak #[ignore], #[allow], osłabionych asercji. `cargo fmt` uruchomiony na całym crate; zmieniony tylko plik testu (fmt --check EXIT 0).

## SHA
- Kod operatora: 388610589 (bez zmian)
- Poprawka testów (zarzuty 2 i 4): b7a77f745 (commit na detached HEAD nad ffda91ed3, bez push).
- Raport obrony (02a-obrona.md): commit nad b7a77f745, SHA w odpowiedzi.
