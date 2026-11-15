# 03 — Final Control, R-RUSTPORT-P4-1H-CANCEL-Q2 (runda 1)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-CANCEL-Q2
GOAL: PlayableGame::cancel_planned_march(unit_id, force) 1:1 z galezia unitId web clearPlannedMarch
      (gra/src/main.ts:31051-31056 @ 07d2fbd72) + EngineCommand::CancelPlannedMarch w obu adapterach bridge.rs
ZMIANY/COMMIT: oceniany kod = 95613f699 (Obrona r1; rodzic d8f85f7d9 = Operator r1; rodzic 2799cdd4b = baza z dispatchu).
               Ten raport: osobny commit na 95613f699 (tylko ten plik).
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0; pelny test wszystkich 482 celow EXIT 0 (szczegoly nizej)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na parity-v2 (merge, bo parity sie przesunelo) + pelny cargo test po merge'u
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i pochodzenie

- Dispatch: `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-CANCEL-Q2/00-dispatch.md`. Baza: `2799cdd4b`.
- `git merge-base --is-ancestor 2799cdd4b 95613f699` daje OK. Łańcuch: `2799cdd4b` → `d8f85f7d9` (Operator) → `95613f699` (Obrona).
- `origin/rust-port/parity-v2` jest teraz na `a0c81d59e`. Od bazy przybyło 15 commitów: P4-1B Q3, P4-1G Q1 i Q2.
  `git merge-tree --write-tree origin/rust-port/parity-v2 95613f699` przechodzi bez konfliktów (drzewo `c0bf940ce`).
  Integracja musi więc być merge'em, nie fast-forwardem, z pełnym testem po merge'u.

## Allowlista i higiena (zmierzone samodzielnie)

`git diff --stat 2799cdd4b 95613f699` pokazuje 5 plików. Wszystkie są na allowliście:

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/playable.rs` | +147 |
| `rust-port/engine/src/bridge.rs` | +16 |
| `rust-port/engine/tests/p4_1h_cancel_planned_march.rs` (nowy) | +305 |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-CANCEL-Q2/01-operator-r1.md` | +76 |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-CANCEL-Q2/02a-obrona.md` | +106 |

- `git diff --check 2799cdd4b 95613f699` jest czyste.
- W kodzie nie przybyło żadnego `#[ignore]`. Jedyne trafienia są w tekście raportów.
- `Cargo.lock` nie jest commitowany. Lokalnie wygenerowany plik usunąłem.
- Brak zmian w `gra/` i w `origin/main`.

## Zgodność z pinem (`git show 07d2fbd72:gra/src/main.ts`, :31051-31056)

```ts
if (!force && plannedMarches.get(unitId)?.attackUnitId) return;
plannedMarches.delete(unitId); marchAttackTargets.delete(unitId);
marchStopNotified.delete(unitId); marchStopDetail.delete(unitId);
```

`PlayableState::clear_planned_march_for_unit` odwzorowuje to 1:1:

- Warunek `!force && plan.attack_unit_id.is_some()` prowadzi do `return`.
- W pozostałych przypadkach `retain` na `planned_marches` (kolejność reszty zachowana, jak `Map.delete`) i `remove` z 3 map.
- Ruch walidacji przy nieznanej lub obcej jednostce (`UnitNotFound` / `UnitNotOwned`) zgadza się z decyzją techniczną w `REJESTR-RUST.md` (wiersz 1878 na `claude/rust-sivvrn`).
- Gałęzie globalne (`unitId === undefined`) są poza zakresem, zgodnie z dispatchem.
- Oba adaptery `bridge.rs` wołają tę samą funkcję i mapują błąd tak samo.

## Bramki (FC, `rust-port/engine`, worktree detached na 95613f699)

Ustawienia: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo), usunięty po bramkach.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (pierwsza próba) | EXIT 101, INFRA. `/` zapełnił się do 0 B przy linkowaniu (inne tematy plus osierocony target Obrony 3,1 GB). To nie jest błąd testu. |
| Pełny test po celach (każdy z 482 celów: `--lib`, `--benches`, 480× `--test <n>`) | **482/482 RC 0**; łącznie 3639 passed, 0 failed, 1 ignored (dług `#[ignore]` z bazy) |
| `--test p4_1h_cancel_planned_march` | 12 passed |
| moduł `cancel_planned_march_game_tests` | 3 passed |

O drugim wierszu: test puściłem cel po celu, z usuwaniem binarki testu po każdym przebiegu, żeby zmieścić się na dysku. Ten sam zbiór celów co `--all-targets`, `--no-fail-fast` na każdym celu.

Liczba 3639 jest wyższa niż 3518 w raporcie Operatora, bo testy jednostkowe biblioteki uruchomiły się dwukrotnie (`--lib` i `--benches`). Failed = 0 w każdym przebiegu.

Mutacja FC M1 („pomiń warunek attack”, `if false && !force`) dała FAIL w dwóch miejscach:
- `a_no_force_keeps_attack_plan_byte_for_byte`, test integracyjny (11/12 passed);
- `cancel_planned_march_game_tests::attack_plan_survives_without_force_and_is_cleared_with_force`, test modułu.

Mutację cofnąłem (`git checkout`, `git status` czyste).

## Orzeczenia zarzutów Evaluatora

| # | Zarzut | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|---|
| 1 | Test `attack_branch_is_observable` jest tautologiczny | **ODDAL** (usunięty w Obronie) | W `95613f699` testu już nie ma. M1 nadal daje FAIL na teście (a) i w module, co zmierzyłem w FC. |
| 2 | `expected_after_delete` lustrzanie odbija implementację | **ODDAL** (usunięty w Obronie) | Teraz `expected_without_own()` = `build_state(None)`: fikstur bez wstawionych wpisów, bez żadnej operacji usuwania. Kolejność oczekiwana w (f) jest literałem. |
| 3 | Bridge nie testuje `UnitNotOwned` ani czyszczenia planu przez komendę | **ODDAL** | Publiczne API nie pozwala zbudować takiego stanu przez adapter: `state` jest prywatne, scenariusz ma jedną ludzką jednostkę, brak komendy tworzącej plan. Ścieżki pokrywa moduł w `playable.rs`. Oba adaptery wołają tę samą funkcję, co test bridge sprawdza na `Ok` i `UnitNotFound` (równość błędów civ i mock). |
| 4 | Osierocony plan dla nieistniejącej jednostki nie zostanie wyczyszczony komendą | **ODDAL** (zgodne z decyzją techniczną; wskazówka zapisana) | To świadoma decyzja z `REJESTR-RUST.md`. Wskazówkę dla przyszłych wołających w silniku (`main.ts:25920/25946/26013/26060/26085`) zapisano w doc-komentarzu `clear_planned_march_for_unit`. Wpis w rejestrze należy do orkiestratora (rejestr poza allowlistą). |
| 5 | Brak wołających (RMB/Esc force=false, Stop force=true) | **ODDAL** | To zadeklarowana zależność. Dispatch Q2 obejmuje tylko komendę, a wołający należą do osobnych tematów P4-1H. |

Żaden zarzut nie dostał NAPRAW ani DO DECYZJI CZŁOWIEKA.

## Uwagi dla orkiestratora (nie blokują)

1. Parity przesunęło się na `a0c81d59e`. Merge-tree jest czysty, ale po merge'u trzeba puścić pełny `cargo test`.
2. Do `REJESTR-RUST.md` trzeba przenieść dwie rzeczy:
   - wskazówkę z zarzutu 4 (wołający w silniku używają `PlayableState::clear_planned_march_for_unit` przed usunięciem jednostki);
   - zadanie z zarzutu 3: rozszerzyć test bridge, gdy powstanie komenda tworząca plan.
3. Dysk: pierwsza pełna próba padła na 0 B wolnego. Osierocony `tgt-cancel-q2-obrona` (3,1 GB, żaden proces go nie używał) usunąłem. Po sprzątaniu FC wolne jest 6,1 GB.
4. Brak wektorów z uruchomionego webu: NIE_ZMIERZONO. Dispatch to dopuszcza.

## SHA

- Oceniany kod: `95613f699`.
- Baza: `2799cdd4b`, przodek: tak.
- Commit z tym raportem: patrz `git log` gałęzi worktree FC (dziecko `95613f699`).
