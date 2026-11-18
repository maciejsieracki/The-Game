# R-RUSTPORT-P6-K5DOC-T8-Q1 — Operator r1: krok doktryny grupy w ciele ProdBody (#264)

```text
STATUS: BLOCK (kod i wektory gotowe; jedna asercja testu POZA allowlistą jest sprzeczna z GOAL — patrz BLOKADY B1)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T8-Q1
GOAL: port _executeGroupDoctrineStep (+ skirmish, defensive, aggressive, bramki siegeDefender/siegeMachineNeverDoctrine,
      wejście z _activateUnit :6091) z tekstu pinu 07d2fbd72 do ProdBody; ProdOps::doctrine_step != stałe false;
      tag `doktryna` znika z `unported` dla domyślnej doktryny steady / doctrine_auto = true.
ZMIANY/COMMIT: gałąź rust-port-wip/k5doc-t8-q1-r1 (baza 47af8dac30e5997eed70d6ba4a58f4ce6d8d4f79);
      kod: b0231c89e, c6ac55c5d, bced08837; raport: commit z tym plikiem (SHA w wyniku Workflow)
TESTY: fmt OK; clippy -D warnings OK; p6_k5doc_t8 6/6; pełny engine EXIT 101: 533 celów ok, 1 FAIL = B1 (§4)
BLOKADY: B1 (asercja `unported == [doktryna]` w tests/p6_siege_tactics_loop_body.rs:311, poza allowlistą)
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator — decyzja o B1 (rozszerzenie allowlisty o 1 asercję), potem Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

Baza: `origin/rust-port/parity-v2` = `47af8dac30e5997eed70d6ba4a58f4ce6d8d4f79` (sprawdzone `git rev-parse`), gałąź
`rust-port-wip/k5doc-t8-q1-r1` utworzona `git checkout -B ... 47af8dac3`. Pin web: `07d2fbd72`
(`gra/src/battle/battleScene.ts`), czytany wyłącznie przez `git show`.

## 1. Co zrobiono (web najpierw)

Przeczytany tekst pinu: `_activateUnit` `:6048-6299` (bramki `:6087-6099`), `_getEffectiveDoctrine` `:17612-17619`,
`_isUnitDoctrineAuto` `:17621-17630`, `_effectiveMetaForUnit` `:17633-17656`, `_ensureGroupMeta` `:17586-17593`,
`_doctrineMoveDest` `:17931-17963`, `_executeGroupDoctrineStep` `:17966-18084`, `_executeSkirmishDoctrineStep`
`:18087-18124`, `_advanceStep` `:8198-8285` (cios `:8241-8245`), `_performPlayerOrder` `:18280-18352`,
`_generalSettings` `:2335-2339`, `_moveTargetForUnit` `:11442-11448`.

### 1a. Nowy moduł `rust-port/engine/src/domain/siege_tactics_doctrine_step.rs` (+ `pub mod` w `domain/mod.rs`)

Czysta DECYZJA kroku doktryny (która metoda pinu wykonuje turę), bez stanu sceny:
- `effective_doctrine` = `_getEffectiveDoctrine`; `is_unit_doctrine_auto` = `_isUnitDoctrineAuto`.
- `execute_group_doctrine_step(doctrine, unit, me, enemies, priorities, blockade) -> DoctrineStep { returns, action,
  set_ranged_kite }`, gałęzie w kolejności pinu: `defensive` (`:17967-17985`), `skirmish` (`:17986-17988` ->
  `_executeSkirmishDoctrineStep`), `steady` + jazda (`:17992-17995`), `steady` + strzał/`_rangedAction`
  (`:18001-18017`), `steady` -> `_advanceStep` (`:18022-18025`), `aggressive` (`:18027-18050`) i ogon `:18051-18083`
  (z `_activateUnit` nieosiągalny — każda doktryna poza `manual` kończy wyżej, a `manual` odcina `:6096`; portowany 1:1
  dla `manual`, bo funkcja pinu jest totalna).
- `DoctrineAction`: `Done`, `Attack(i)`, `CavalryAction`, `RangedAction`, `AdvanceStep`, `MoveOrder{col,row}`.
- `_doctrineMoveDest` tylko w gałęziach osiągalnych z tych dwóch metod (`skirmish`, `manual`); gałęzie
  `_attackFormationRallyPoint`/`_chargeMoveDest` są nieosiągalne (zgodnie z K5DOC-T3) i NIE są wklejone do generatora
  (wywołanie = TypeError generatora, nie wystąpiło).
- Wybór celu: klocki K5DOC-T2 (`pick_ranged_target_by_priority`, `pick_adjacent_target_by_priority`,
  `pick_target_by_priority`); blokada linii: `dest_allowed_by_blockade` (K5EXEC-T2); `_moveTargetForUnit`: T3.

### 1b. `rust-port/engine/src/domain/siege_tactics_loop.rs` (`ProdBody`)

- Usunięty strażnik `doctrine_auto -> "doktryna"` w `start` i ramię `DoctrineStep => "doktryna"` w `prod_tag`. Tag
  `doktryna` nie istnieje już w kodzie (`grep '"doktryna"' src/` = 0).
- `ProdOps::doctrine_step` zwraca `DoctrineStep::returns` (pin: każda ścieżka `return true`), liczone przed maszyną z
  tego samego stanu (`plan_doctrine_step`); maszyna K5H (`activate_unit`, bez zmian) sama stosuje bramki
  `siegeDefenderNeverDoctrine`/`siegeMachineNeverDoctrine` i `doctrine_manual`.
- `au.doctrine_manual` nadpisywane z `_getEffectiveDoctrine` stanu ciała (`:6096` czyta `meta.doctrine`).
  `activate.doctrine_auto` zostaje wejściem adaptera (`_isUnitDoctrineAuto`; port w module jak wyżej) — powód: testy
  r1–r4 i inne (bajt w bajt) mają domyślny stan doktryny z `doctrine_auto = false`.
- Po maszynie (`DoctrineStep` + gałąź `U7.0-doctrine`): `_ensureGroupMeta` (`ensure_group_meta_of`), `ru.rangedKite =
  true` dla `skirmish` (`:18092`), zapis decyzji w nowym polu `pub doctrine_steps`, a treść tymi samymi klockami co
  gałęzie `_activateUnit` (D-T8-1: bez `_updateFacing`/okrążenia, jak w pinie — maszyna kończy po kroku doktryny):
  `CavalryAction` -> `cavalry_action`, `RangedAction` -> `ranged_action`, `AdvanceStep` -> `advance_step`, `Attack` ->
  wspólna ścieżka `_doAttack` (strzał `begin_shot` gdy `canShoot`, inaczej `Facing` + `Melee`), `Done` -> brak akcji.
- `MoveOrder` (`_performPlayerOrder`, K5EXEC-T3 #268, nieportowane): jawny tag `doktryna-rozkaz-ruchu`, brak ruchu.
- `_advanceStep` (`advance_step(.., from_doctrine)`): cios `:8241-8245` przy pierwszym wejściu z kroku doktryny jest
  WYKONYWANY (cel `_pickAdjacentTargetByPriority`); poza krokiem doktryny albo po ruchu zostaje tag `krok-naprzod-atak`
  jak w r1 (w pinie nieosiągalne; test r1 `atak_z_advance_step_jest_oznaczony` bez zmian i zielony).
- Przy murze (`siege_wall_col >= 0`) ciało nadal oznacza wszystko tagiem `oblezenie` (T1/T2) — także atakującego
  nie-machinę, który w pinie przeszedłby przez krok doktryny. Bramki są pokryte wektorami na maszynie K5H (§3).
- Mutacje stanu ciała tylko w `doctrine[..]`, `group_meta`, `doctrine_steps`; brak nowych wariantów akcji
  (`siege_tactics_actions.rs` bez zmian), `p4_1i3_actions.rs` bez zmian.

## 2. Decyzje techniczne (do REJESTR-RUST.md przez orkiestratora)

- D-T8-r1-1: decyzja kroku doktryny jako czysta funkcja (moduł `siege_tactics_doctrine_step`), treść kroku przez
  istniejące klocki ciała — zero duplikacji `_cavalryAction`/`_rangedAction`/`_advanceStep`.
- D-T8-r1-2: `_isUnitDoctrineAuto` pozostaje wejściem adaptera (`activate.doctrine_auto`); `doctrine_manual` liczy
  ciało. Uzasadnienie: zgodność z istniejącymi testami bajt w bajt (D-T8-2) i z kontraktem K5H.
- D-T8-r1-3: `ru.formationOffset` = `null` (spawn `:4575`), `_generalSettings.blockadeActive = false` (`:2337`) —
  ciało nie niesie UI szyku ani panelu blokady; obie wartości są wejściami funkcji (gotowe do podpięcia w #369).
- D-T8-r1-4: GroupMeta ciała nie ma pól `rallyCol/rallyRow` (ustawia je wyłącznie UI `_setGroupDoctrine`), więc
  `skirmish` w grupie celuje w `_pickTargetByPriority` — tak samo jak pin dla `_groupMeta` z `{doctrine, autoPlay}`.
- D-T8-r1-5: `aggressive` + `_advanceStep` + cios jest nieosiągalne (cios w sąsiada `:18039-18043` poprzedza
  `:18048`) — kwota usunięta z generatora po pomiarze, nie osłabienie asercji.

## 3. Wektory (generator wykonuje TEKST pinu)

`rust-port/engine/tests/p6_k5doc_t8_gen.mjs` (harness r4 + wycinki T8, strażnik SHA-256 wycinków
`c8e6b605b20c855812a7ce372ba3681c896e88144aa86426787e4cc62bc56004`, ziarno 5408, deterministyczny — dwa przebiegi =
te same MD5). Pliki `rust-port/engine/tests/p6_k5doc_t8_vectors/`:

| Plik | Wektory | Zawartość |
|---|---|---|
| `vectors.json` | 1540 | 9 rodzin (poniżej) |
| `vectors_nan.json` | 880 | `ru.moveLeft = NaN` dla `aggressive`, `steady-inf`, `steady-cav`, `skirmish` (376 z ruchem, 86 `aggressive` -> `_advanceStep`) |
| `vectors_gate.json` | 240 | bramki przy murze na maszynie K5H (82 obrońca zablokowany, 47 machina zablokowana, 34 atakujący przy murze z doktryną, 45 bez muru z doktryną, 18 machina bez muru z doktryną) |

Liczniki pokrycia (`rodzina/gałąź` = metoda pinu wykonana przez krok doktryny, z wektora; Rust liczy je z tych samych
wektorów i sprawdza progi):

| Rodzina (doktryna) | Gałęzie (liczba wektorów) |
|---|---|
| `steady-cav` (jazda, `steady`) | cav 160 |
| `steady-shoot-in` (strzelec w zasięgu) | shot 150, ranged-move 9, ranged-shot 1 |
| `steady-shoot-out` (strzelec poza zasięgiem) | ranged-move 80, ranged-shot 50, shot 30 |
| `steady-inf` (piechota) | advance-attack 85, advance-move 134, advance-none 21 |
| `steady-nobow` (`shootingEnabled = false`) | advance-attack 37, advance-move 44, advance-none 39 |
| `defensive` | shot 56, melee 62, none 82 |
| `aggressive` | cav 42, shot 72, melee 40, advance-move 64, advance-none 5, none 17 |
| `skirmish` | ranged-shot 63, ranged-move 30, melee 74, order 49, none 20, shot 4 |
| `skirmish-edge` (krawędź planszy) | none 20 |

`steady` domyślna: 40% bez grupy i bez `unitDoctrine`, 20% grupa bez wpisu `_groupMeta` (`_ensureGroupMeta` — 194
wektorów `group-ensure` łącznie), 20% grupa `steady`/auto, 20% `unitDoctrine = steady`.

Porównanie na każdym wektorze (`tests/p6_k5doc_t8.rs`): `_isUnitDoctrineAuto` (port = pin), `meta.doctrine`, ślad
(zdarzenia maszyny + metoda kroku doktryny), czas, pozycja, `moveLeft` bitowo, `facing`, zmiany facing z czasem, `Move`
na każdy krok, strzał (`Facing` + `Shot`, cel, łuk, pudło), cios (`Melee` cel i czas), cel rozkazu ruchu,
`rangedKite`, `lastAutoMoveFrom`, `_groupMeta` po aktywacji, `dryCol`/`heldAfterFallback`, amunicja, `occByKey`,
brak innych akcji, liczba rzutów = liczba `_singleBlow` pinu, `unported` puste (rozkaz ruchu: dokładnie
`doktryna-rozkaz-ruchu`), nigdy tag `doktryna`. Strażnik czasu 90 s (`with_timeout`) w testach wektorów.

Testy (6): `krok_doktryny_zgodny_z_pinem`, `nan_move_left_zgodne_z_pinem`, `bramki_doktryny_przy_murze_zgodne_z_pinem`,
`cialo_przy_murze_zostaje_tagiem_oblezenie`, `bez_terenu_jawne_tagi_galezi_bez_tagu_doktryna`,
`doktryna_manual_ze_stanu_ciala_odcina_krok`.

## 4. Bramki

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w
scratchpadzie (`k5t8/target`, poza repo).

1. `cargo fmt --check` — EXIT 0.
2. `cargo clippy --all-targets -- -D warnings` — EXIT 0.
3. Nowe testy `--test p6_k5doc_t8` — 6 passed, 0 failed.
4. Regresje (`p4_1i3_actions`, `p6_k5loop_close`, `_r2`, `_r3`, `_r4`, `p6_k5loop_outcome_pin`, `p6_k5loop_auto_*`,
   `p6_k5doc_t4e`, `p6_k5doc_state`, wszystkie `p6_siege*`): wszystkie zielone POZA
   `p6_siege_tactics_loop_body::doktryna_i_mur_sa_poza_zakresem_i_zapisane` (B1). Wektory/testy r1–r4 bez zmian
   (`git diff 47af8dac3 -- rust-port/engine/tests/p6_k5loop_close*` puste).
5. Pełny `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu, kod `bced08837`): EXIT 101 —
   533 celów `test result: ok`, 1 cel `FAILED`: `--test p6_siege_tactics_loop_body` (7 passed, 1 failed:
   `doktryna_i_mur_sa_poza_zakresem_i_zapisane`, `left: []`, `right: [(Attacker 0, "doktryna")]`) = wyłącznie B1.
   Dysk przed startem: 8,4 GB wolnego.

## 5. Mutanty (skrypt `k5t8/mutants.py` w scratchpadzie; każdy = build + `--test p6_k5doc_t8`)

| ID | Mutant | Wynik |
|---|---|---|
| M01 | `defensive`: cios przed strzałem | zabity |
| M02 | `shoots` bez `shootingEnabled` | zabity |
| M03 | `steady`: jazda nie idzie `_cavalryAction` | zabity |
| M04 | `steady`: strzelec zawsze `_rangedAction` | zabity |
| M05 | `steady`: piechota `done` zamiast `_advanceStep` | zabity |
| M06 | `aggressive`: `moveLeft < 0` | zabity |
| M07 | `aggressive`: bez ciosu w sąsiada | zabity |
| M08 | `aggressive`: `moveLeft <= 0 \|\| NaN` | zabity (NaN) |
| M09 | `skirmish`: `isRanged` bez `rangedBase` | zabity |
| M10 | `skirmish`: bez `rangedKite = true` | zabity |
| M11 | `skirmish`: punkt zbiórki 1 kolumna | zabity |
| M12 | `skirmish`: punkt zbiórki także z grupą | zabity |
| M13 | `skirmish`: bez warunku cel == pozycja | zabity po dodaniu rodziny `skirmish-edge` (pierwszy przebieg: przeżył) |
| M14 | `skirmish`: cios w sąsiada tylko z amunicją | zabity |
| M15 | `_isUnitDoctrineAuto`: grupa bez wpisu = false | zabity |
| M16 | `_getEffectiveDoctrine`: grupa przed jednostką | zabity |
| M17 | bez `_ensureGroupMeta` | zabity |
| M18 | `ProdOps::doctrine_step = false` | zabity |
| M19 | cios z `_advanceStep` w `_pickTargetByPriority` zamiast sąsiada | zabity |
| M20 | cios z `_advanceStep` = tag (stan sprzed T8) | zabity |
| M21 | `shootingEnabled` zawsze `true` w kroku doktryny | zabity |
| M22 | rozkaz ruchu bez tagu | zabity |
| M23 | krok doktryny zużywa dodatkowy rzut RNG przy ciosie (kolejność/liczba rzutów) | zabity |
| M24 | `doctrine_manual` bez nadpisania ze stanu ciała | zabity po dodaniu testu `doktryna_manual_ze_stanu_ciala_odcina_krok` (dla spójnego wejścia adaptera równoważny: `_isUnitDoctrineAuto` daje `false` dla `manual`) |
| M25 | `_advanceStep` z kroku doktryny bez ciosu | zabity |

Równoważne (bez mutanta): gałęzie ogona `manual` (`:18051-18083`) i blokady linii (`blockadeActive = false` w ciele)
— nieosiągalne z `_activateUnit`/ciała; opisane w D-T8-r1-3 i nagłówku modułu.

## 6. BLOKADY

**B1 (allowlista).** `rust-port/engine/tests/p6_siege_tactics_loop_body.rs:300-311`
(`doktryna_i_mur_sa_poza_zakresem_i_zapisane`) ustawia `doctrine_auto = true` i asertuje
`body.unported == vec![(atk0(), "doktryna")]`. GOAL wymaga, by tag `doktryna` zniknął z `unported`; teraz jednostka
wykonuje krok doktryny `steady` -> `_advanceStep` z `moveLeft = 0` -> `done()` (pin `:8202`), więc `unported == []`
(pozostałe asercje testu, HP 50 i gałąź muru `oblezenie`, przechodzą). Plik jest poza allowlistą dispatchu, więc NIE
zmieniony i NIE osłabiony (D-T8-2). Proponowana zmiana (do decyzji orkiestratora): w tej jednej asercji
`vec![(atk0(), "doktryna")]` -> `Vec::<(UnitRef, &str)>::new()` plus `assert_eq!(body.doctrine_steps,
vec![(atk0(), DoctrineAction::AdvanceStep)])`. Do tego czasu pełna bramka ma dokładnie 1 oczekiwany FAIL.

## 7. NIE_ZMIERZONO / poza zakresem

- Czas rzeczywisty i kwantyzacja rAF (D-T8-3); RNG tylko wstrzyknięty.
- Ciało przy murze (T1/T2): krok doktryny atakującego nie-machiny przy murze nie jest wykonywany (tag `oblezenie`).
- `_performPlayerOrder` (rozkaz ruchu `skirmish`): tag `doktryna-rozkaz-ruchu` (K5EXEC-T3 #268).
- Cios wręcz z kroku doktryny jest porównany do `_doMeleeAttack` (cel i chwila), bez `complete` — sam cios
  `_singleBlow` pokrywają wektory r1–r4 (jak w r4).
