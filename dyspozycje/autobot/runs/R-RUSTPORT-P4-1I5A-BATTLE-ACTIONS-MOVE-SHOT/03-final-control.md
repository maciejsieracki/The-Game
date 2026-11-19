# R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (port Rust: DTO akcji bitwy, silnik, renderer)
TEMAT: R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT (#370 I5a)
GOAL: `Move`/`Shot` w `BattleActionKindDto` z walidacją, `actions_to_dto` bez `MoveWithoutDto`/`ShotWithoutDto`,
konsument w `renderer/src/battle/playback.rs` (wyczerpujący `match`), zgodnie z pinem `07d2fbd72` i wektorami silnika.
OCENIANY COMMIT: `be9452f4c` (gałąź `obrona-i5a-r1`; kod: `c9365837d` = `841a54974` Operatora + testy obrony),
baza `32006733ba65bb22ff7776b104d1afb329841491` = `origin/rust-port/parity-v2` w chwili FC (zgodna z dispatchem).
ZMIANY/COMMIT: FC nie zmienia kodu; tylko ten raport (gałąź lokalna `fc-i5a-r1`, commit następny po `be9452f4c`).
RUNDY: 1/5 (Operator r1 → Evaluator r1 FAIL → Obrona → FC).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Bramki odtworzone przez FC

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w
scratchpadzie (`i5a-fc/t-vm`, `i5a-fc/t-eng`), oba usunięte po bramkach.

| Crate | Bramka | Wynik FC |
|---|---|---|
| view-model | `cargo fmt --check` | EXIT 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| view-model | `cargo test --all-targets` | EXIT 0 (wszystkie binarki `ok`, 0 failed) |
| engine | `cargo fmt --check` | EXIT 0 |
| engine | `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| engine | `cargo test --test p4_1i5a_move_shot --test p4_1i3_actions --test bridge_contract --test p6_k5loop_close_r2 --test p6_k5loop_close_r3 --test p6_k5loop_close_r4` | EXIT 0: 6/6, 9/9, 9/9, 6/6, 6/6, 10/10 |
| renderer | `cargo fmt --check` | EXIT 0 |
| renderer | clippy / `cargo test --all-targets` | **NIE_ZMIERZONO przez FC** (§1a) |

`git diff --check 32006733b be9452f4c`: czysty. Trailery 10 commitów tematu: wyłącznie `Claude-Session:`, brak
`Co-Authored-By`. Brak `#[ignore]` w diffie. `git status` po bramkach czysty (`Cargo.lock` nietknięty).

### 1a. Bramka cargo renderera

Dispatch: build renderera tylko przy ≥ 12 GB wolnego na starcie. Przez ~55 min (05:20–06:15 UTC) wolne miejsce stało
na 9,8–10 GB (równolegle trwał test engine innego tematu w `wf_06892f8f-ee4-3`; cudzych worktree/targetów nie ruszano).
FC nie uruchomił builda renderera, żeby nie łamać progu dispatchu. Dowód zastępczy (niezależne przebiegi na tym samym
kodzie produkcyjnym): Evaluator na `a477c005f` — fmt/clippy EXIT 0, `cargo test --all-targets` EXIT 0 (726 passed);
Obrona na `c9365837d` (kod końcowy; zmiana po Evaluatorze = +31 linii wyłącznie w
`renderer/tests/battle_playback_move_shot.rs`) — fmt/clippy EXIT 0, test EXIT 0 (726 passed). `playback.rs` identyczny
w obu. Orkiestrator: przed FF na `parity-v2` puścić bramkę renderera (fmt, clippy `-D warnings`, `cargo test
--all-targets`) przy ≥ 12 GB.

## 2. Przegląd kodu vs pin (`git show 07d2fbd72:gra/src/battle/battleScene.ts`)

- Stałe: `MOVE_STEP_MS = 240`, `RANGED_FLY_MS = 380` (`:1009`, `:1011`) = `dynamics.rs:53/57`.
- `_doMove` (`:8725-8776`): szczyty kafli przed `ru.q = col; ru.r = row`, potem `_updateFacing(ru)`, `const t0 =
  this._now()`, `p = min(1,(now−t0)/MOVE_STEP_MS)`. Konsument: kontrola `arriveAt == t0 + MOVE_STEP_MS`, kontrola
  `from == (u.col,u.row)`, `MoveAnim::start` (`dynamics.rs:342`: oba szczyty przed zmianą pola, potem `u.col/u.row =
  to`), krok w `step_animations`. Zgodne.
- `_doRangedAttack` (`:9179-9230`): końce z tułowia (`tileTopY + 0.5`), `projectileKind(attacker.bu)`,
  `projectiles.push({t0: now, dur: RANGED_FLY_MS})`, `_schedule(RANGED_FLY_MS, …)`. Konsument: `projectile_kind(
  spawn.category, spawn.model_name)` + `ranged_shot_endpoints` + `launch_projectile`. Zgodne. Zwrot strzelca i
  obrażenia to osobne akcje `Facing`/`Damage` (jak I3/I4); amunicja przez ramkę (`apply_frame`) — podział jak w I4.
- D-WIR-7: brak pola `kind` w DTO uzasadniony (wejścia `projectileKind` = `category`/`model_name`); akceptuję brak D-I5A-n.
- `actions_to_dto`: `Move`/`Shot` 1:1, `Cell(i64)` zamiast obcinania; `MoveWithoutDto`/`ShotWithoutDto` usunięte —
  `git grep` w `rust-port`: 0 użyć. Jedyny `match` po `BattleActionKindDto` poza silnikiem/view-modelem to
  `playback.rs`: bez `_ =>`, enum bez `#[non_exhaustive]` (D-WIR-8 spełnione).
- Walidacja DTO (`battle.rs`): `arriveAt`/`landAt` skończone i `>= t0`, `from != to`, strzelec != cel.

## 3. Rozstrzygnięcie zarzutów

| # | Zarzut / nota | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|---|
| Z1 | EV-R1 (kontrola `from` tylko po kolumnie) przeżył | Evaluator §4 | **ODDAL** (usunięte) | Obrona dodała przypadek `from=(c,r+1)` przy jednostce na `(c,r)` → `MoveFrom` (diff `a477c005f..c9365837d`, test `:562-572`). Mutant zabity wg obrony; asercja w teście bezpośrednio wyklucza `u.col != from.0`. |
| Z2 | EV-R3 (`arriveAt` `!=` → `<`) przeżył | Evaluator §4 | **ODDAL** (usunięte) | Dodany przypadek `arriveAt = t0 + 240 + 1` → `Err(ArriveAt)`; wraz z istniejącym `t0 + 239` oba kierunki przypięte. |
| Z3 | EV-R5 (`landAt` `!=` → `<` w `Shot`) przeżył | Evaluator §4 | **ODDAL** (usunięte) | Dodany przypadek `landAt = t0 + 380 + 1` → `Err(ShotLandAt)`; z istniejącym `t0 + 150` oba kierunki przypięte. |
| Z4 | EV-R6 (zamiana argumentów `projectile_kind`) przeżył | Evaluator §4 | **ODDAL** (równoważny) | Sprawdzone w pinie `:1661-1671`: `cat === 'procarz'`/`'oszczepnik'` pokryte przez `includes('procar')`/`('oszczep')`, gałąź `lucznik/rydwan` daje ten sam domyślny `arrow`, wzorce bez spacji nie przecinają separatora `' '`, więc kolejność `cat`/`name` w `hay` nie zmienia wyniku. |
| Z5 | `p6_k5loop_close_r2.rs`/`r3.rs` poza allowlistą | Operator §5, Evaluator N1 | **ODDAL** | Wymuszone GOAL: usunięte linie to wyłącznie dwa testy asertujące `Err(MoveWithoutDto/ShotWithoutDto)` (sprawdzone `git diff … \| grep '^-'`); zastąpione sweepami po wszystkich wektorach r2/r3 (silniejsze). Żadnej osłabionej asercji gdzie indziej. Decyzja techniczna — do wpisu orkiestratora w `REJESTR-RUST.md`. |
| Z6 | `p6_k5loop_close_r4.rs` (dodatek) poza allowlistą | Operator §5, Evaluator N1 | **ODDAL** | Kryterium końca dispatchu wymaga zgodności `Move`/`Shot` z wektorami r3/r4; builder wektorów r4 jest lokalny dla pliku testu. Zmiana czysto addytywna (0 usuniętych linii w r4). Decyzja techniczna orkiestratora — jak Z5. |
| Z7 | FC-U3-MISS: brak wektora strzału chybionego | Operator §6, Evaluator N2 | **ODDAL** (dług) | Generator r3 nie produkuje pudła (0 przypadków); `Damage` strzału sprawdzony dla wszystkich 328 trafień. Dług zapisany, nie blokuje I5a. |
| Z8 | PLAYBACK-OVERLAP: nowy `Move` zastępuje marsz w locie | Operator §7, Evaluator N3 | **ODDAL** (dług) | W pinie kroki łańcuchowane przez `done()` — brak nakładania; zachowanie poza pinem jest zdefiniowane i przypięte testem. |
| Z9 | Raport Operatora: liczby testów `p4_1i5a_move_shot` 9/9 i `p4_1i3_actions` 6/6 | FC | **ODDAL** (kosmetyka) | Faktycznie 6 i 9 (`grep -c '#[test]'` i przebieg FC) — liczby zamienione w raporcie; bramki zielone, brak wpływu na wynik. |
| Z10 | Bramka cargo renderera nie odtworzona przez FC | FC §1a | **ODDAL** (nota dla integracji) | Ograniczenie dyskowe dispatchu; dwa niezależne przebiegi (Evaluator, Obrona) EXIT 0 na tym samym `playback.rs`; FC powtórzył fmt. Bramka obowiązkowa przy integracji. |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0 (odstępstwa allowlisty Z5/Z6 to decyzje techniczne orkiestratora wg zasady 9 CLAUDE.md).

## 4. Kryteria końca dispatchu

- serde round-trip i walidacja nowych wariantów: `view-model/tests/battle_actions_move_shot.rs` — zielone (FC).
- `actions_to_dto` z `Move`/`Shot` zgodny z wektorami r2/r3/r4: sweepy w `p6_k5loop_close_r2/r3/r4` — zielone (FC).
- Scena po odtworzeniu = scena po wywołaniach pinu (fikstura `dynamics.json`): `renderer/tests/battle_playback_move_shot.rs`
  — zielone u Evaluatora i Obrony (FC: NIE_ZMIERZONO, §1a).
- Mutanty ≥ 10: Operator 25 zabitych; Evaluator 11 (EV-R1/R3/R5 zabite po obronie, EV-R6 równoważny). Spełnione.

## 5. Długi (przeniesione)

- I5b (#370): `Boulder`, `WallDamage`, `Ram`, `GateDamage`, `WallBreach`, `GateBreach`, `TowerDestroyed`, `ClimbWall`,
  `LeaveField`, a także `Leave`/`Shaken` (r4) — nadal jawne `*WithoutDto`.
- FC-U3-MISS, PLAYBACK-OVERLAP (§3 Z7/Z8).
- Produkcyjny wołający playbacku dla `Move`/`Shot` (pętla czasu rzeczywistego) — poza I5a.
- Orkiestrator: wpis D-WIR-7 (brak pola `kind`) oraz akceptacja odstępstw allowlisty Z5/Z6 w `REJESTR-RUST.md`.
- Integracja: bramka renderera (fmt, clippy `-D warnings`, `cargo test --all-targets`) przy ≥ 12 GB przed FF.

## 6. Następny krok

Integracja orkiestratora: merge `be9452f4c` (+ ten raport) na `rust-port/parity-v2` po bramce renderera; refs/keep.
