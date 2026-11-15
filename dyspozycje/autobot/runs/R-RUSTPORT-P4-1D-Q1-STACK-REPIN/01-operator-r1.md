# R-RUSTPORT-P4-1D-Q1-STACK-REPIN — Operator, runda 1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1D-Q1-STACK-REPIN
GOAL: reprezentant stosu (`pickStackLeader`) i `StackVitals.has_commander` w `army_merge` zgodne z pinem `07d2fbd72`, potwierdzone wektorami z uruchomionego webu.
ZMIANY/COMMIT: kod + wektory + logi bramek: `04b773b37784f604f7a7c7cd27f02d7482214194` (gałąź robocza `worktree-wf_515c8fe6-0a4-1`); ten raport w commicie następnym (rodzic `04b773b37`).
TESTY: wszystkie bramki EXIT 0 (szczegóły niżej); mutacje 4/4 FAIL (oczekiwane).
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO

## Baza

- `origin/rust-port/parity-v2` w chwili startu = `c3e3617b2aaaede5f708d2c425b0222c4af78549` (fetch 2026-11-15). Gałąź robocza odtworzona na tym SHA (`git checkout -B worktree-wf_515c8fe6-0a4-1 c3e3617b2`).
- Pin webu `07d2fbd72` tylko do odczytu: `git archive 07d2fbd72 gra/src gra/data` do katalogu tymczasowego poza repo (wykonywany graf importów, bez stubów).

## Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/recruitment.rs` (wyłącznie `pub mod army_merge`) | `StosJednostka` + `category: String`, `is_general: Option<bool>`; `pick_stack_representative` = `pickStackLeader` (`stack-leader.ts:28-41` @07): pula = jednostki z `!is_civilian_unit(category, type_id)`, gdy choć jedna jest w stosie, inaczej cały stos; ta sama pętla `reduce` (atak, remis → mniejsze id UTF-16); `StackVitals.has_commander` + `stack_vitals` = `any(is_general == Some(true))` (`armyMerge.ts:1153` @07); `use super::manpower::is_civilian_unit` (istniejąca funkcja z tabelą `manpower-params.json`, zgodność z pinem sprawdzona testem); odwołania linii części wyświetlania przepięte na `@07` (17 komentarzy: `pickStackRepresentative`, `stackRenderKey`, `StackVitals`, `StackVitalsDeps`, `StackDisplayInfo`, `computeStackDisplay`, `unitAtRepresentative`, `stackRuchLeft/Max`, `stackHpPool`, `stackFieldPowerM`, odznaki, weteran, `stackVitals`) + komentarz modułu, że pozostałe odwołania dotyczą `edb8fb56` (te funkcje — np. `exitGarnizon`, nowe `besiege*`/`healUnitStates` — zmieniły się między pinami i są poza zakresem; nie przepinam ich numerów, by nie deklarować parytetu bez wektorów). |
| `rust-port/engine/tests/p6_5a_display.rs` | testy przepisane na funkcje sprawdzające (`check_pick/display/at/vitals`) wołane dla starych wektorów (z pominięciem `repinChanged`) i dla `vectors.json` (`repin` + `cases`); `assert_vitals` sprawdza `hasCommander` (brak pola w wektorze edb8fb56 ⇒ oczekiwane `false`, potwierdzone w `repin`); 6 nowych testów (meta/strażniki, reprezentant, `computeStackDisplay`, `unitAtRepresentative`, `stackVitals.hasCommander`, tabela cywilna). |
| `rust-port/engine/tests/p6_5a_vectors/common.rs` | `unit()` czyta `category` (brak = pusty napis) i `isGeneral`; `assert_unit` porównuje oba pola. |
| `rust-port/engine/tests/p6_5a_vectors/gen.mjs` (NOWY) | generator @07; loader `.ts`/`.json` wbudowany (`register` z `data:`), strażnik SHA-256 12 fragmentów pinu (niezgodność = exit 3). |
| `rust-port/engine/tests/p6_5a_vectors/vectors.json` (NOWY) | wynik generatora (sha256 `875ef35f…0ec0b`, deterministyczny: drugi przebieg bajt w bajt identyczny, `gen-q1-r1.log`). |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1D-Q1-STACK-REPIN/**` | `mutate-q1.py`, logi bramek (`git add -f`, bo `*.log` jest w `.gitignore` — jak w P6.5A), ten raport. |

`display.json` (wektory `edb8fb56`): **diff = 0** (sha256 `d5c14715…1431b` bez zmian).

### Literały `StosJednostka {` (mechaniczne)

`git grep -n "StosJednostka {"` na bazie: `recruitment.rs:393` (definicja), `:414` (`impl`), `:1268`, `:1284` (typ zwracany funkcji, nie literał), `tests/p6_5a_vectors/common.rs:103` (sygnatura `fn unit(...) -> StosJednostka {`). **Jedyny literał struktury** to `Self { ... }` w `StosJednostka::new` — dopisane `category: String::new(), is_general: None`. Pozostali wołający (`p6_5a_stack.rs`, `p6_5a_ruch.rs`, `p6_5b_tables.rs`, `common.rs`) budują przez `new` — bez zmian. Literałów `StackVitals {` poza `stack_vitals` brak (`git grep`).

## Wektory @07 (`gen.mjs`)

Strażniki SHA-256 (linie @07): `stack-leader.ts` `isNonCombatStackMember` 15-17, `pickStackLeader` 28-41; `units/setup.ts` `CIVILIAN_CATEGORIES` 197, `CIVILIAN_TYPE_IDS` 200, `isCivilianUnit` 203-206; `armyMerge.ts` `stackGroupIdOf` 57-62, `pickStackRepresentative` 530-535, `stackRenderKey` 579-581, `computeStackDisplay` 584-646, `unitAtRepresentative` 649-661, `StackVitals` 1103-1126, `stackVitals` 1137-1155 (skróty w `vectors.json` → `meta.guards`).

1. `repin`: wszystkie wejścia starych wektorów przeliczone na @07 (pick 118, computeStackDisplay 148, unitAtRepresentative 110, stackVitals 110; `dep.armor/soft/vet/stars` przeliczone funkcjami pinu @07). `repinChanged` (wynik @07 ≠ zapisany edb8fb56, bez pola `hasCommander`): pick **34**, computeStackDisplay **19**, unitAtRepresentative **1**, stackVitals **0**. Sprawdzone skryptem: każda zmiana pick to dokładnie przypadek „stary reprezentant cywilny + w stosie jest bojowy” (0 rozbieżności), w computeStackDisplay znikające id są wyłącznie cywilne (8 przypadków zmienia też liczbę żetonów — dedykowane przypadki `dup` z powtórzonym id reprezentanta, gdzie inna wybrana jednostka zmienia scalanie `Set`/`Map`).
2. `cases` (nowe): pick 131, computeStackDisplay 134, unitAtRepresentative 127, stackVitals 134. Znaczniki: `civ-only` 90, `civ-higher-attack` 88, `civ-by-category` 179, `civ-by-type` 162, `tie-utf16` 3 (+ remisy losowe), `garrison-field` 5, `group-two-hexes` 5, `commander-true` 106, `commander-false` 116, `commander-undefined` 187, `nan` 1, `empty` 1.
3. `civilian.probes`: 121 par (kategoria × typ) z `isCivilianUnit` i `isNonCombatStackMember` pinu.

Przypadki z dispatchu: stos sam cywilny ✔; cywil z wyższym atakiem niż bojowy (cywil NIE jest reprezentantem) ✔; remis ataku z porównaniem id UTF-16 ✔; `hasCommander` true/false/undefined ✔; garnizon i pole na tym samym heksie ✔; jawny `stackGroupId` na dwóch heksach ✔; stare wektory dla przypadków niezmienionych ✔.

## Bramki (CARGO_TARGET_DIR poza repo, `CARGO_INCREMENTAL=0`, debug=0)

| Bramka | Wynik | Log |
|---|---|---|
| `cargo fmt --check` | EXIT=0 | `gate-fmt-r1.log` |
| `cargo clippy --all-targets -- -D warnings` | EXIT=0 | `gate-clippy-r1.log` |
| `cargo test --lib` | EXIT=0, 118 passed | `gate-test-lib-r1.log` |
| `cargo test --test p6_5a_display` (zawiera nowy test wektorów @07) | EXIT=0, 13 passed (7 dotychczasowych + 6 nowych), 0 ignored | `gate-test-display-r1.log` |
| dodatkowo: `p6_5a_stack`, `p6_5a_ruch`, `p6_5a_cost`, `p6_5a_tables`, `p6_5b_tables` (użytkownicy `StosJednostka`/`common.rs`) | EXIT=0 (10+8+4+2+6 passed) | `gate-test-p65-other-r1.log` |
| generator (drugi przebieg, determinizm) | GEN_EXIT=0, sha256 identyczny | `gen-q1-r1.log` |

Pełnego `cargo test` (wszystkie testy integracyjne) NIE uruchomiono — poza zakresem bramek dispatchu; NIE_ZMIERZONO wpływu na inne testy poza listą wyżej (zmiana publicznego API: dwa nowe pola `StosJednostka` i jedno `StackVitals`; `git grep` nie znajduje innych konstrukcji tych struktur w repo).

## Mutacje (kryterium 2) — `mutate-q1.py`, log `mutate-q1-r1.log`

| Mutacja | Wynik |
|---|---|
| cywil jako reprezentant (filtr puli usunięty) | FAIL: `representative_…07…`, `compute_stack_display_…07…`, `unit_at_representative_…07…` |
| `has_combat = false` (cywil zawsze w puli) | FAIL: te same 3 testy |
| `has_commander = false` | FAIL: `compute_stack_display_…07…`, `stack_vitals_has_commander_matches_web_07` |
| `has_commander = is_general.is_some()` | FAIL: te same 2 testy |

MUTANTY_PRZEZYLY 0; plik przywrócony bajt w bajt (`git status` czysty po skrypcie).

## Uwagi / NIE_ZMIERZONO

- Stare testy (`display.json`) pomijają przypadki z `repinChanged`; te przypadki są sprawdzane wyłącznie wynikiem @07 (`repin`). Test `vectors_07_meta_and_pin_guards` wymusza, że `repin` ma te same wejścia (`units`) co `display.json` dla każdego indeksu i że `repinChanged` dla pick/computeStackDisplay jest niepusty.
- `StosJednostka::new` ustawia `category = ""`; `isCivilianUnit` wtedy rozstrzyga po `type_id` (jak web dla kategorii spoza zbioru). Producent (P4-1D-Q4) musi podać prawdziwą kategorię.
- `Cargo.lock` wygenerowany lokalnie — nie commitowany. Katalog `CARGO_TARGET_DIR` i rozpakowany pin usunięte po bramkach.
