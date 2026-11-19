# R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT — Evaluator r1 (adwersarialny)

STATUS: FAIL (3 nierównoważne mutanty przeżyły na nowych gałęziach konsumenta; bramki zielone, kod poprawny co do zachowania)
DOMAIN: GAME (port Rust: DTO akcji bitwy, silnik, renderer)
TEMAT: R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT (#370 I5a)
GOAL: `Move`/`Shot` w `BattleActionKindDto` z walidacją, `actions_to_dto` bez `MoveWithoutDto`/`ShotWithoutDto`,
konsument w `renderer/src/battle/playback.rs` (wyczerpujący `match`), zgodnie z pinem `07d2fbd72` i wektorami silnika.
OCENIANY COMMIT: `a477c005f` (kod `841a54974`), gałąź `rust-port-wip/p4-1i5a-move-shot`, baza `32006733b`
(= `origin/rust-port/parity-v2` w chwili oceny; zgodna z dispatchem).
ZMIANY/COMMIT: Evaluator nie zmienia kodu; tylko ten raport.
RUNDY: 1/5.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Bramki odtworzone (Evaluator, własny `CARGO_TARGET_DIR` w scratchpadzie `i5a-ev/`, usunięty po bramkach)

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.

| Crate | Bramka | EXIT / wynik |
|---|---|---|
| view-model | `cargo fmt --check` | 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | 0 |
| view-model | `cargo test --all-targets` | 0 (14 binarek `ok`) |
| engine | `cargo fmt --check` | 0 |
| engine | `cargo clippy --all-targets -- -D warnings` | 0 |
| engine | `cargo test --all-targets --no-fail-fast` (pełny, w tle, `setsid nohup`) | `EXIT=0`: 543 `test result`, 4119 passed, 0 failed, 1 ignored (istniejący przed tematem) |
| engine | w tym `p4_1i5a_move_shot`, `p4_1i3_actions`, `bridge_contract`, `p6_k5loop_close_r2/r3/r4` | wszystkie `ok` (r4: 10/10, w tym `move_i_shot_dto_1do1_w_wektorach_r4`) |
| renderer (bez `gpu`) | `cargo fmt --check` | 0 |
| renderer | `cargo clippy --all-targets -- -D warnings` | 0 |
| renderer | `cargo test --all-targets --no-fail-fast` | `EXIT=0`: 82 binarki, 726 passed, 0 failed, 0 ignored; `battle_playback_move_shot` 6/6 |

Bramka renderera startowała przy 13 GB wolnego, bez innego buildu renderera (inny proces: tylko test engine innego
tematu, zakończony przed startem). DŁUG-T1-LOCK: build dopisał `renderer/Cargo.lock`, przywrócony `git checkout`.
`git diff --check 32006733b a477c005f`: czysty. Trailery: tylko `Claude-Session:` (8 commitów), brak Co-Authored-By.

## 2. Zgodność z pinem (tekst `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

- `_doMove` `:8714-8776`: `fromTopY/toTopY` przed `ru.q = col; ru.r = row`, potem `_updateFacing(ru)`, `const t0 = this._now()`,
  `p = min(1, (now - t0)/MOVE_STEP_MS)`. Konsument: `MoveAnim::start` (`dynamics.rs:342`) czyta oba szczyty przed zmianą
  `u.col/u.row`, `t0` z akcji, krok w `play_until`. `Facing` przed `Move` z tym samym `t0` sprawdza sweep r2 (581 zwrotów)
  i r3. Zgodne.
- `_doRangedAttack` `:9179-9235`: zwrot strzelca, `projectileKind(attacker.bu)`, końce z tułowia na `tileTopY + 0.5`,
  `projectiles.push({t0: this._now(), dur: RANGED_FLY_MS})`, `_schedule(RANGED_FLY_MS, …)`. Konsument:
  `projectile_kind(spawn.category, spawn.model_name)` + `ranged_shot_endpoints` + `launch_projectile`. Zgodne.
- `projectileKind` `:1661-1671`: sprawdzono argument Operatora (brak pola `kind` w DTO, D-WIR-7): wejścia
  `bu.kategoria` i `stats.Jednostka ?? bu.nazwa` = `spawn.category`/`spawn.model_name`; wariant `"undefined"` nie trafia
  w żaden wzorzec. Akceptuję brak D-I5A-n.
- `_updateAmmoBar` (`:9191-9194`) nie jest w konsumencie `Shot`: pasek amunicji idzie ramką `apply_frame`
  (`playback.rs:736-750`), tak jak w I4. Zgodne z dotychczasowym podziałem akcja/ramka.

## 3. Allowlista

Pliki w diffie: `view-model/src/battle.rs`, `view-model/tests/battle_actions_move_shot.rs` (nowy),
`engine/src/domain/siege_tactics_actions.rs`, `engine/tests/p4_1i5a_move_shot.rs` (nowy), `renderer/src/battle/playback.rs`,
`renderer/tests/battle_playback_move_shot.rs` (nowy), raport — w allowliście. `dynamics.rs`, fikstury, `Cargo.toml`,
`Cargo.lock`, `siege_tactics_loop.rs`, `bridge.rs`, `client/`, `src-tauri/`, `gra/`, `REJESTR-RUST.md` — nietknięte.

Poza allowlistą (zgłoszone przez Operatora w §5):
- `engine/tests/p6_k5loop_close_r2.rs`, `p6_k5loop_close_r3.rs`: **wymuszone przez GOAL** — oba pliki asertowały
  `Err(MoveWithoutDto)`/`Err(ShotWithoutDto)`; bez ich zmiany bramka engine jest czerwona przy każdej implementacji.
  Zmiana ogranicza się do zastąpienia tych dwóch testów sweepami po wszystkich wektorach (silniejsze niż usunięte).
  Usunięte linie `assert` dotyczą wyłącznie usuniętych testów (brak osłabień gdzie indziej). Akceptuję.
- `engine/tests/p6_k5loop_close_r4.rs`: dodatek (nowy test, bez zmian istniejących), nie wymuszony. Uzasadnienie
  (builder wektorów r4 nieeksportowany) wiarygodne; dispatch wymaga zgodności r3/r4. Akceptuję jako notę dla FC.
- Brak `#[ignore]`.

## 4. Mutanty Evaluatora (adwersarialne, na `playback.rs`, testy `battle_playback_move_shot` + `battle_playback`)

Skrypt: zamiana jednej kotwicy → `cargo test` → przywrócenie (log `scratchpad/i5a-ev/mut/ren.log`).

| ID | Mutant | Wynik |
|---|---|---|
| EV-R1 | kontrola `from` tylko po kolumnie: `if u.col != from.0` | **PRZEŻYŁ** |
| EV-R2 | kontrola `from` tylko po wierszu: `if u.row != from.1` | zabity |
| EV-R3 | `arriveAt != t0 + MOVE_STEP_MS` → `<` (akceptuje spóźnione `arriveAt`) | **PRZEŻYŁ** |
| EV-R4 | `arriveAt != …` → `>` (akceptuje wczesne) | zabity |
| EV-R5 | `landAt != t0 + RANGED_FLY_MS` → `<` (akceptuje spóźnione `landAt`) | **PRZEŻYŁ** |
| EV-R6 | `projectile_kind(model_name, category)` (argumenty zamienione) | przeżył — **RÓWNOWAŻNY**: gałęzie `cat == "procarz"`/`"oszczepnik"` są pokryte przez `hay.contains("procar")`/`("oszczep")`, a wzorce bez spacji nie zależą od kolejności w `hay` |
| EV-R7 | koniec lotu = pole strzelca | zabity |
| EV-R8 | rodzaj pocisku z celu zamiast strzelca | zabity |
| EV-R9 | pocisk nie trafia do `projectiles` | zabity |
| EV-R10 | marsz usuwany po pierwszej klatce | zabity |
| EV-R11 | `MoveAnim::start` do pola `from` | zabity |

Przyczyna przeżyć (test `move_and_shot_errors_are_reported`, `renderer/tests/battle_playback_move_shot.rs:519-662`):
- `ArriveAt` testowany tylko dla `arriveAt = t0 + 239` (`:543`), `ShotLandAt` tylko dla `landAt = t0 + 150` (`:589`):
  brak przypadku wartości **większej** niż stała pinu, więc warunek dokładnej równości (`!=`, D-WIR-6/7) jest
  przypięty tylko z jednej strony.
- `MoveFrom` testowany dla `from = (c+1, r)` vs `(c, r)` i `(c, r)` vs `(c+1, r+1)` — w obu kolumna różna; brak przypadku,
  w którym różni się **tylko wiersz**.

Dispatch wprost wymaga: „konsument błąd, gdy bieżąca komórka jednostki ≠ `from` lub `arrive_at != t0 + MOVE_STEP_MS`”
oraz „mutanty … każdy zabity lub jawnie równoważny”. EV-R1/R3/R5 nie są równoważne (zmieniają zachowanie dla
poprawnych wejść DTO) → FAIL.

Mutanty Operatora (25) przyjmuję jako opisane; ich zestaw nie obejmuje kierunku nierówności ani kontroli „tylko wiersz”.
Mutanty engine/view-model nie były ponawiane (target usunięty po pełnym teście ze względu na dysk; zestaw EM/VM
Operatora pokrywa zamiany pól, czasy, `i32` i walidację).

## 5. Do poprawy w r2 (Operator; tylko testy, `renderer/tests/battle_playback_move_shot.rs`)

1. `ArriveAt`: dodać przypadek `arriveAt = t0 + MOVE_STEP_MS + 1` (oczekiwany `Err(ArriveAt)`); zabija EV-R3.
2. `ShotLandAt`: dodać przypadek `landAt = t0 + RANGED_FLY_MS + 1` (oczekiwany `Err(ShotLandAt)`); zabija EV-R5.
3. `MoveFrom`: dodać przypadek z różnym tylko wierszem, np. `from = (c, r + 1)` przy jednostce na `(c, r)`; zabija EV-R1.
4. Po zmianie: ponownie EV-R1/R3/R5 (muszą być zabite), pełne bramki renderera (fmt, clippy `-D warnings`,
   `cargo test --all-targets`), `Cargo.lock` przywrócony. Kod `playback.rs` nie wymaga zmian.

## 6. Noty (nie blokują)

- N1: odstępstwo allowlisty r2/r3 (wymuszone) i r4 (dodatek) — do akceptacji FC (§3).
- N2: FC-U3-MISS (brak wektora strzału chybionego) — dług zgłoszony przez Operatora, potwierdzam (r3: 0 przypadków pudła).
- N3: PLAYBACK-OVERLAP (nowy `Move` zastępuje marsz w locie) — zachowanie poza pinem, zabezpieczone testem; dług słuszny.
- N4: wpis D-WIR-7 (brak pola `kind`) do `REJESTR-RUST.md` — orkiestrator.

## 7. Następny krok

Operator r2 (ten sam ID): punkty §5.1–5.4, baza `a477c005f`.
