# R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1 — Operator r1

```text
STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1 (T2b)
GOAL: atakujący przy murze w ProdBody: katapulta (_attackWallTile, _advanceToward), taran (_attackGate), wyłom muru
      i bramy z MORALE_*, odwrót obrońców z muru, wieża w wyłomie, pozostałe gałęzie atakującego przy murze z bramką
      _siegeMoveRefused + _siegeShooterThreats; nowe BattleAction bez DTO; synchronizacja SiegeLoop <-> ProdBody (dług T2a)
ZMIANY/COMMIT: gałąź rust-port-wip/siege-atk-b-q1-op; kod 478836ba2 + 13977ab86 + 31e6bced5 (HEAD kodu; baza 25ce36748);
              raport: osobny commit tego pliku na tej samej gałęzi
TESTY: fmt EXIT 0; clippy -D warnings EXIT 0; 10 celów bramki EXIT 0; pełny cargo test --all-targets EXIT 0
       (4064 ok, 0 FAIL, 1 ignored istniejący); 24 mutanty: 22 zabite, 2 równoważne z uzasadnieniem (§7)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza i źródła

- BAZA: `origin/rust-port/parity-v2` = `25ce36748` (integracja T2a, zawiera T1, T3, T5a, #371).
- Pin web `07d2fbd72`, `gra/src/battle/battleScene.ts` (czytane przez `git show`, `gra/` nietknięte). Linie pinu:
  `_activateUnit` 6048-6299; `_destroyTowerAtRow` 4194-4200; `_attackGate` 7310-7336; `_siegeStructureDamage`
  7505-7513; `_attackWallTile` 7540-7568 (`_schedule(700)` :7555); `_breachWallTile` 7638-7752 (odwrót 7697-7741,
  morale 7745-7750); `_breachGate` 7757-7811 (pętla morale 7805-7810); `_siegeShooterThreats` 7924;
  `_siegeApproachRestricted` 7951; `_siegeMoveRefused` 7963; `_doMove` 8685 (bramka 8689-8692); `_meleeBlockedByWall`
  8361 (w `_canAttackFrom` 8436, `_makeCanAttackFromTest` 8454, `_canStrikeTargetFrom` 8487-8493); `_startFade`
  9927-9938; `MORALE_GATE_BREACH = 5`, `MORALE_WALL_BREACH = 0` (1147-1148); `WALL_TILE_HP = 640`; brama 400 w
  `_carveWallTiles` (4061-4063).

## 2. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `src/domain/siege_tactics_atk_b.rs` (nowy) | stałe `MORALE_GATE_BREACH`, `MORALE_WALL_BREACH`, `WALL_HIT_FLY_MS=700`, `RAM_ANIM_MS`, `GATE_MAX_HP=400`, `WALL_TILE_HP=640`; `SiegeStructStats`; `siege_structure_damage` (:7505-7513); `wall_tile_damage` (:7542-7545); `wall_retreat_cell` (:7704-7738, z semantyką ponownego przeniesienia pinu, §4 D-B5); `tile_index_in_bounds` (:7642-7645/:7768-7769); `tower_destroyed_log` (:4199); 3 testy jednostkowe |
| `src/domain/mod.rs` | `pub mod siege_tactics_atk_b;` |
| `src/domain/siege_tactics_actions.rs` | WYŁĄCZNIE nowe `BattleAction`: `Boulder`, `WallDamage`, `Ram`, `GateDamage`, `WallBreach`, `GateBreach`, `TowerDestroyed`, `LeaveField` + `ActionError::{Boulder,WallDamage,Ram,GateDamage,WallBreach,GateBreach,TowerDestroyed,LeaveField}WithoutDto` i ramiona w `actions_to_dto` |
| `src/domain/siege_tactics_loop.rs` | `ProdBody`: `siege_atk_wall_tile` (+ `boulder_hit` z odroczonego wywołania), `siege_atk_gate`, `breach_gate_scene`, `gate_breach_morale`, `breach_wall_tile` (kafel, wieża, `LeaveField`, katapulta `start_fade`, morale), bramka `_siegeMoveRefused`/`_siegeShooterThreats` w `move_step_core` (`siege_move_refused_now`), czas kroku przy odmowie `step_ms` (0 ms), `_meleeBlockedByWall` w `_canAttackFrom`/`_canStrikeTargetFrom`/flance jazdy (`melee_blocked_for`, `melee_blocked_list`), nakładka terenu po wyłomie `PlainsCell`; usunięty blok tagu `oblezenie` i `oblezenie-odmowa-ruchu`; `prod_tag(AttackWallTile)` = `atak-muru-poza-oblezeniem`. `LoopBody`: `take_timers`, `fire_timer`, `wall_ever_breached`, `on_tower_destroyed` (domyślne bez efektu); `LoopTimer::BodyTimer(u64)`; `SiegeLoop::drain_body` synchronizuje wyłom; `schedule_body_timers` po `start` (przed `BodyDone`), po `complete` i po `BodyTimer`; `mark_towers_without_tile` przekazuje wieżę ciału |
| `tests/p6_k5loop_siege_atk_b.rs`, `_gen.mjs`, `_vectors/{vectors,vectors_nan,vectors_edge}.json` (nowe) | 7 testów, §5 |
| testy z sekcji D-INT-2 dispatchu | §3 |

## 3. Zmiany istniejących asercji (D-INT-2/D-INT-5)

Każda zmiana wynika z tego, że gałąź, którą test oczekiwał jako tag, jest od T2b wykonywana przez ciało tak jak w pinie.
Żadna asercja nie została usunięta ani poluzowana bez zastąpienia porównaniem z pinem lub z bliźniaczym scenariuszem.

1. `tests/p6_k5doc_t8.rs`, `cialo_przy_murze_zostaje_tagiem_oblezenie` → `cialo_przy_murze_bez_tagu_oblezenie`.
   STARE: `start == 0`, `unported == [(acting, "oblezenie")]`, `doctrine_steps` puste. NOWE: brak tagu `oblezenie*` i
   `doktryna`; `doctrine_steps` niepuste dokładnie wtedy, gdy ślad pinu zawiera `doctrine`; `complete` tylko bez ataku.
   Dowód z pinu: `_activateUnit` 6048-6299 przy murze dla atakującego wchodzi w `_executeGroupDoctrineStep` i dalsze
   gałęzie (cios/strzał/krok), a nie kończy się `done()`; ślad pinu z wektora decyduje o kroku doktryny.
2. `tests/p6_k5loop_siege_def.rs`, `atakujacy_przy_murze_zostaje_tagiem_oblezenie` → `atakujacy_przy_murze_bez_tagu_oblezenie`.
   STARE: `start == 0`, `unported == [(atk0, "oblezenie")]`. NOWE: `unported` niepuste, wszystkie wpisy dla `atk0`,
   żaden `oblezenie*`, każdy kończy się `-brak-terenu` albo `-bez-szablonu` (wektor bez terenu i bez szablonu ciosu =
   jawne wejście adaptera). Asercje morale bez zmian.
3. `tests/p6_siege_tactics_loop_body.rs`, `doktryna_i_mur_sa_poza_zakresem_i_zapisane` (część o murze). STARE: HP obrońcy
   50, tag `oblezenie`, czas 0. NOWE: porównanie z bliźniaczym scenariuszem bez muru: czas `800` (= bliźniak),
   `unported` puste, stan `CombatUnit` obu stron i lista ciosów równe bliźniakowi, dokładnie jeden cios. Dowód z pinu:
   `_meleeBlockedByWall` (:8361-8371) blokuje cios tylko dla piechoty z ziemi na obrońcę na murze bez wyłomu; w tym
   scenariuszu nie blokuje, więc cios jest jak bez muru.
4. `tests/p6_k5loop_siege_atk_a.rs`: `expected_tag` dla `attackWallTile`/`attackGate` STARE `atak-muru`/`atak-bramy`,
   NOWE `atak-muru-bez-szablonu`/`atak-bramy-bez-szablonu` (wektor T2a nie podaje statystyk machiny, `ProdBody::siege_stats
   = None`, :7314/:7542 czytają statystyki jednostki); dla znaczników `doctrine|attack|rangedAction|cavalryAction|
   phalanxAction|advanceStep|fallBackStep` STARE `oblezenie`, NOWE: ślad maszyny bez zmian + wyłącznie tagi wejścia
   adaptera (`*-bez-szablonu` albo `doktryna-rozkaz-ruchu`), porównanie czasu pominięte tylko dla tych znaczników
   (`marker_executed`), bo generator T2a zatrzymuje pin na atrapie `done()` i nie zna skutków; skutki tych gałęzi
   sprawdzają wektory T2b. `brak_tagow_t2a`: lista dozwolonych tagów `["oblezenie","atak-muru","atak-bramy"]` →
   `*-bez-szablonu`/`doktryna-rozkaz-ruchu`. `bez_terenu`, `tag-attackGate`: `["atak-bramy"]` → `["atak-bramy-bez-szablonu"]`.
   Wektory r1–r4 i T2a nie zmienione (pliki JSON bez zmian).
5. `tests/p4_1i3_actions.rs`: wyłącznie mechaniczne ramiona `match` w `enc` dla 8 nowych wariantów (wyczerpujące
   dopasowanie); dane i asercje bez zmian.
6. `src/domain/siege_tactics_loop.rs`, `prod_tag_tests::advance_toward_outside_siege_atk_has_explicit_tag`: STARE
   `prod_tag(AttackWallTile) == "atak-muru"`, NOWE `"atak-muru-poza-oblezeniem"`. Przy murze `_attackWallTile` wykonuje
   ciało (`siege_atk_wall_tile`), `prod_tag` zostaje tylko dla zdarzenia spoza atakującego przy murze; nazwa jak
   istniejący `marsz-poza-oblezeniem`. Kryterium zamknięcia dispatchu (`atak-muru` nie może zostać tagiem) wymusza
   zmianę nazwy. Wykryte przez pełny `cargo test` (pierwszy przebieg EXIT 101, 1 test), poprawione w 13977ab86.

## 4. Decyzje techniczne (do wpisania przez orkiestratora w REJESTR-RUST.md)

- D-B1 Odroczone wywołania ciała: `_schedule(700, …)` z wnętrza `_attackWallTile` to `LoopTimer::BodyTimer(id)`;
  ciało zgłasza je przez `LoopBody::take_timers`, sterownik planuje je w zegarze PRZED `BodyDone` (kolejność `id` jak
  `vTimerSeq` w pinie, `done()` po `_schedule`), odpala `fire_timer`. Test `sterownik_synchronizuje_wylom_z_cialem`.
- D-B2 Pętla morale `_breachGate` (:7805-7810) zmienia `TurnSeqState`, a `start` ma `&st`; wykonuje ją `complete` tej
  samej aktywacji (`pending_gate_breach`). `done()` w `_attackGate` jest synchroniczne, więc między wyłomem a pętlą morale
  w pinie nie ma innego kodu; wektory porównują stan po `complete`.
- D-B3 Teren po wyłomie: `PlainsCell` (przejezdny, koszt 1, nie bród, jazda delegowana) nakładana na teren ciała; kafle
  bramy nadpisywane bezwarunkowo, bo `_carveWallTiles` zawsze stawia tam `Gate`. Brak terenu ciała → wyłom muru = jawny
  tag `wylom-brak-terenu` (pin `if (!tiles) return;` :7640).
- D-B4 Odmowa ruchu: `MoveStepResult` nie dostaje nowego pola (konstruuje go `p6_k5doc_t4e.rs`); odmowa wykrywana przez
  `outcome.done` (ciało nie planuje AUTO-batch), czas kroku `0` (`step_ms`).
- D-B5 Odwrót z muru: wewnętrzna pętla `rr` pinu (:7721) nie sprawdza `placed`, więc druga wolna para przenosi
  jednostkę ponownie (może wrócić na pole startowe = zostaje). Port odwzorowuje to dosłownie (`wall_retreat_cell`).
- D-B6 Statystyki machiny (`wall`, `rng`, `imp`, `weaponDamage` z `unitRowStat`) = wejście adaptera
  `ProdBody::siege_stats: Option<SiegeStructStats>`; brak → `atak-muru-bez-szablonu`/`atak-bramy-bez-szablonu`.
- D-B7 `_applyTerrainRange` po zejściu z muru = tożsamość (zasięg z wejścia adaptera `activate.range`, jak w całym ciele).
- D-B8 Synchronizacja (dług T2a): `drain_body` przenosi `WallBreach{row}` do `SiegeLoop::breach_wall_row` (usuwa wiersz
  z `wall_tile_rows`, `wall_ever_breached`, wieża „pierwsza niezburzona w wierszu”), `body.wall_ever_breached()` →
  `env.wall_ever_breached` (wyłom bramy, wejście z wieży); `mark_towers_without_tile` → `body.on_tower_destroyed(row)`
  (zagrożenia `_siegeShooterThreats` nie liczą zburzonej wieży).
- D-B9 `LeaveField{unit,from,to}` = obrońca schodzi z wyburzonego kafla; `to == from`, gdy nie ma wolnego pola (pin: „pozostań”).
- D-B10 `ucieczka-oblezenie` (ucieczka przy murze) zostaje tagiem: nie należy do zakresu T2b i nie ma prefiksu `oblezenie`
  (dług T4).

## 5. Wektory pinu i pokrycie

Generator `tests/p6_k5loop_siege_atk_b_gen.mjs` wykonuje tekst pinu (`_activateUnit` i wymienione metody), strażnik
SHA-256 `489ddf8ec4d902b13ccd8e83109506ef34d3659b0657aef924f821661d441699`, ziarno 7311 (+1 NaN, +2 krawędzie),
deterministyczny. Pliki: `vectors.json` 1530 przypadków, `vectors_nan.json` 430, `vectors_edge.json` 280 (mur w
kolumnach 1, 2, 66, 67, wiersze 0/155: `min(BF_COLS-1,…)`, `clamp` wiersza, indeks kafla, sąsiedzi `nc<0`, `nr<0`,
`nc>=BF_COLS`, `nr>=BF_ROWS`). Każdy przypadek porównuje ślad, kroki, odmowy, facing, atak, ciosy, jednostki, HP
kafli, HP i stan bramy, `wallEverBreached`, `lastAttackedWallRow`, zburzone wieże, dziennik, taran, kamienie, etykiety,
routy, zabicia, `LeaveField`, kolejność.

Liczniki gałęzi (`byBranch`, podstawowe/NaN/krawędzie): wall-breach 120/39/54, wall-hit 66/12/35, cata-toward
134/49/31, gate-breach 103/51/8, gate-hit 50/43/6, gate-guard 13/4/0, ram-move 28/12/38, doc-advance-refused 59/11/4,
advance-refused 13/7/6, doc-cav-refused 8/3/1, cav-refused 4/1/0, ranged-refused 4/0/0, doc-ranged-refused 6/0/0,
phalanx-refused 6/0/0, attack 19/3/4, doc-attack 26/5/6, fallback 3/0/0. Skutki: retreatMoved 27/6/20,
retreatStuck 0/0/6, cataKilled 3/1/1, towerDestroyed 9/7/7, routsAfterBreach 179/85/47, refusedMoves 100/22/11.
Test `pokrycie_skutkow_wylomu` wymaga sum ≥ (40, 3, 3, 15, 100, 150, 100) dla tych nazw.

Testy `p6_k5loop_siege_atk_b.rs` (7): `zgodnosc_z_pinem_atakujacy_przy_murze_czesc_b`, `zgodnosc_z_pinem_nan`,
`zgodnosc_z_pinem_krawedzie_planszy` (strażnik 90 s, wątek 64 MB), `pokrycie_skutkow_wylomu`,
`brak_tagow_oblezniczych_dla_atakujacego` (kryterium zamknięcia: żaden z `wieza-wejscie`, `piechota-do-wiezy`,
`taran-wieza`, `atak-muru`, `atak-bramy`, `marsz`, `oblezenie*`; z terenem wyłącznie tagi wejścia adaptera),
`akcje_muru_i_bramy_bez_dto_jawny_blad` (8 × `ActionError::*WithoutDto`); w porównaniu przypadku każda akcja
`LeaveField` musi mieć `to` = pole jednostki po odwrocie z pinu, `onWall = false`, obrońcę i wyburzony wiersz `from`;
`sterownik_synchronizuje_wylom_z_cialem`
(D-B1/D-B8: odpalenie w pierwszej klatce z `vNow >= start + 700`, `wall_tile_rows [4,5,6] → [4,6]`,
`wall_ever_breached`, wieża bez kafla (wiersz 9) przekazana ciału, wieża indeks 0 w wierszu 5 zburzona).

## 6. Bramki (rust-port/engine, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, target w scratchpadzie `siegeatkb/target`)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p6_k5loop_siege_atk_b` | 7/7 ok |
| `--test p6_k5loop_siege_atk_a` | 7/7 |
| `--test p6_k5loop_siege_def` | 10/10 |
| `--test p6_siege_tactics_loop_body` | 8/8 |
| `--test p6_siege_tactics_loop_body_pin` | 2/2 |
| `--test p6_k5loop_outcome_pin` | 8/8 |
| `--test p6_k5loop_close_r4` | 7/7 |
| `--test p6_k5doc_t8` | 6/6 |
| `--test p4_1i3_actions` | 9/9 |
| `--test bridge_contract` | 9/9 (łącznie EXIT 0) |
| `cargo test --lib` (po poprawce 13977ab86) | 139/139, EXIT 0 |
| pełny `cargo test --all-targets --no-fail-fast` (tło, `setsid nohup`), przebieg 1 na 478836ba2 | EXIT 101: 4062 ok, 1 FAIL (`prod_tag_tests::advance_toward_outside_siege_atk_has_explicit_tag`, §3 pkt 6), 1 ignored (istniejący) |
| pełny `cargo test --all-targets --no-fail-fast`, przebieg 2 na 31e6bced5 (HEAD kodu) | EXIT 0: 539 celów, 4064 ok, 0 FAIL, 1 ignored (istniejący, ten temat nie dodał `#[ignore]`) |
| `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings` na 31e6bced5 | EXIT 0, EXIT 0 |

Bramki testów 10 celów (tabela wyżej) uruchomione na 478836ba2; na 31e6bced5 te same cele przechodzą w przebiegu 2
pełnego testu (`p6_k5loop_siege_atk_b` 7/7 po dodaniu asercji `LeaveField`, `--lib` 140/140).

## 7. Mutanty (skrypt `scratchpad/siegeatkb/mut.py`, każdy: zmiana → `cargo test --test p6_k5loop_siege_atk_b` → przywrócenie; po serii `git diff` czysty)

24 mutanty: 22 zabite, 2 uzasadnione jako równoważne na osiągalnych stanach. Pierwsza seria (na 13977ab86): 20 zabitych,
4 przeżyły (M08, M13, M19, M24). Po wzmocnieniu testów (31e6bced5: asercja `LeaveField` względem pola po odwrocie z
pinu, test `indeks_kafla_w_zakresie_jak_pin`) M08 i M13 zabite w powtórce. Log: `scratchpad/siegeatkb/mut_r1.log`,
`mut.log`.

| ID | Mutacja | Wynik |
|---|---|---|
| M01 | `MORALE_GATE_BREACH` 5 → 4 | ZABITY (wektory podst./NaN/krawędzie) |
| M02 | `MORALE_WALL_BREACH` 0 → 1 | ZABITY (3 testy wektorów) |
| M03 | `WALL_HIT_FLY_MS` 700 → 600 | ZABITY (3) |
| M04 | podłoga obrażeń bramy 12 → 1 | ZABITY (podst., NaN) |
| M05 | obrażenia kafla `rng*2` → `rng` | ZABITY (3) |
| M06 | kolumna odwrotu `+1` → `+2` | ZABITY (3) |
| M07 | odwrót „pierwsze wolne wygrywa” (bez ponownego przeniesienia pinu) | ZABITY (3) |
| M08 | `tile_index_in_bounds` bez górnej granicy | ZABITY po wzmocnieniu (`indeks_kafla_w_zakresie_jak_pin`) |
| M09 | brama `gateHp <= 0` → `< 0` | ZABITY (3) |
| M10 | wyłom bramy bez kafla `gr - 1` | ZABITY (3) |
| M11 | morale wyłomu bez `_checkRout` | ZABITY (3) |
| M12 | katapulta obrońcy na kaflu bez `_startFade` | ZABITY (3) |
| M13 | `LeaveField.to = from` | ZABITY po wzmocnieniu (3) |
| M14 | kafel `newHp <= 0` → `< 0` | ZABITY (3) |
| M15 | wieża w wyłomie nie burzona | ZABITY (3) |
| M16 | flanka jazdy bez `_meleeBlockedByWall` w `_canStrikeTargetFrom` | ZABITY (krawędzie) |
| M17 | `_doMove` bez `_siegeMoveRefused` | ZABITY (4, w tym `brak_tagow_oblezniczych_dla_atakujacego`) |
| M18 | odmowa ruchu z czasem `MOVE_STEP_MS` | ZABITY (3) |
| M19 | `routed` ignorowany w `_siegeApproachRestricted` | RÓWNOWAŻNY w zakresie T2b: jednostka rozbita (`routed`) nie wchodzi w gałęzie ruchu ciała przy murze (ucieczka przy murze = tag `ucieczka-oblezenie`, dług T4), a rout w trakcie aktywacji nie wykonuje już kroku; wymaga zabicia po porcie ucieczki (T4) |
| M20 | sterownik bez synchronizacji `WallBreach` | ZABITY (`sterownik_synchronizuje_wylom_z_cialem`) |
| M21 | sterownik nie przekazuje wieży ciału | ZABITY (`sterownik_…`) |
| M22 | `_meleeBlockedByWall` z `wall_breached = false` | ZABITY (3) |
| M23 | pominięta pętla morale wyłomu bramy | ZABITY (3) |
| M24 | nowy klucz `wallTileHp` na początku mapy zamiast na końcu | RÓWNOWAŻNY na osiągalnych stanach: cel katapulty pochodzi z kluczy `wallTileHp` (pin :6202), więc nowy klucz powstaje tylko, gdy wiersz wyburzono w trakcie lotu kamienia (`curHp = 0` → `newHp = 0` → `_breachWallTile` natychmiast go usuwa, :7646); bez terenu (`if (!tiles) return`) klucze nigdy nie są usuwane, więc nowy klucz nie powstaje |

Po każdej serii `git diff` czysty (tylko zamierzone zmiany).

## 8. Długi

- T4 (TAGS-REST): `ucieczka-oblezenie` (ucieczka atakującego przy murze, D-B10) i pozostałe tagi spoza strony
  atakującej przy murze; `atak-muru-poza-oblezeniem`, `marsz-poza-oblezeniem` (zdarzenia spoza oblężenia).
- T6 (ADAPTER): wejścia adaptera ustawiane dziś przez testy: `siege_stats` (statystyki machiny z `unitRowStat`),
  `range_base`, `siege_towers`, `tower_range`, `gate_hp` (400 z `_carveWallTiles`), `siege_gate_col/row`, teren ciała
  (bez terenu: `wylom-brak-terenu`), zasięg po zejściu z muru (`_applyTerrainRange`, D-B7).
- #369 (WIRING): kontrakt kolejności zegara (D-B1: `BodyTimer` przed `BodyDone`) i odroczona pętla morale bramy
  (D-B2) muszą zostać zachowane przy wpięciu; wpis dziennika wieży burzonej przez `mark_towers_without_tile` sterownika
  nie jest emitowany przez ciało (sterownik ma własny dziennik).
- I5b (DTO): 8 nowych `BattleAction` bez DTO (`ActionError::*WithoutDto`): `Boulder`, `WallDamage`, `Ram`,
  `GateDamage`, `WallBreach`, `GateBreach`, `TowerDestroyed`, `LeaveField`.
- Poza zakresem: `_resetSiegeForReplay` (:10520, powtórka), `lastAttackedWallRow` tylko HUD (śledzony w ciele, bez
  odbiorcy).
