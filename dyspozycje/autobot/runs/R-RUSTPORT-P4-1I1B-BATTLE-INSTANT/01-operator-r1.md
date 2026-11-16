# 01 — Operator r1: R-RUSTPORT-P4-1I1B-BATTLE-INSTANT

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I1B-BATTLE-INSTANT
GOAL: ścieżka „Pomiń” (E4): port `computeInstantResult` (`battleScene.ts:20389-20593`), reguła `wallBreached` przy
machinie (`:3720-3722`), `result.log` i wejście E4 do `BattleOutcomeDto` z I1.
ZMIANY/COMMIT: kod + dowody `991556084bd154ba00a128294528a9b15cf847bd` (gałąź robocza `wip/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT-op-r1`,
worktree `wf_aafc5812-7e5-1`); ten raport w następnym commicie na tej samej gałęzi.
TESTY: §4 — bramki EXIT 0 w obu crate'ach; 8 wektorów pinu zielone; 6/6 mutacji FAIL.
BLOKADY: (1) rozstrzygnięcie pary = pełne `resolveCombat` NIE jest portowane w silniku — wstrzyknięte przez trait (§3, D1);
(2) brak wołającego w produkcji (§5).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji, `gra/` i `origin/main` nietknięte).

Baza: `origin/rust-port/parity-v2` = `05e4df502500c591afae67b4017b6e3e907a0f86` (zgodne z dispatchem `05e4df502`),
gałąź robocza założona od tej bazy. Pin `07d2fbd72` tylko do odczytu (`git show`). Źródło: dispatch `00-dispatch.md`
(gałąź `origin/claude/rust-sivvrn`), rozpoznanie `P4-1I-BATTLE-ROZPOZNANIE.md` §2a.1 (wiersz E4), §4 (wiersz I1B), L9.

## 1. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/siege_tactics_instant.rs` (NOWY) | `compute_instant_result` (= `computeInstantResult`), `skip_instant_fallback` (= `_skipInstantFallback` bez UI), `instant_wall_ever_breached`, `attacker_has_live_siege_unit`, `instant_verdict_line`; typy `InstantUnit`, `InstantScene`, `InstantConsts` (`from_data`), `InstantPairOpts`, `InstantPairResolver`, `PairCombatResult`, `InstantResult`, `InstantDefBonus`, `InstantSkipOutcome` |
| `rust-port/engine/src/domain/mod.rs` | tylko `pub mod siege_tactics_instant;` |
| `rust-port/engine/src/domain/siege_tactics_outcome.rs` | tylko wejście E4: `InstantSkipData::from_skip`, `build_battle_outcome_instant`, import i doc-y. E1–E3 i `build_battle_outcome` bez zmian semantyki (stare testy I1 18/18 zielone w pełnym `cargo test`) |
| `rust-port/engine/tests/p4_1i1b_battle_instant.rs` (NOWY) | 8 testów: wektory pinu (wszystkie pola + każde wejście resolvera), 3 wektory z dispatchu, remis HP/puste strony, linia końca, wejście E4 do DTO (klucze JSON, walidacja, `wallBreached`) |
| `rust-port/view-model/src/battle.rs` | tylko doc pola `log` (E4 niesie `result.log`); bez zmian typów |
| `rust-port/view-model/tests/battle_outcome_e4.rs` (NOWY) | 4 testy E4: parse+walidacja+round-trip literału E4 (ten sam co silnik dla `mur_machina_wylom`), klucze JSON, ocalały `hp=0` odrzucony, `log` tylko napisy |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT/dowody/` | generator `gen-p4-1i1b-vectors.mjs`, wejścia `p4-1i1b-inputs.json`, wynik `p4-1i1b-vectors.json`, mutacje `mut-p4-1i1b.{py,sh}` |
| `…/01-operator-r1.md` | ten raport |

Poza allowlistą: zero zmian. `rust-port/engine/Cargo.lock` (powstał lokalnie) NIE commitowany. `view-model/src/lib.rs` nie ruszany.

## 2. Odwzorowanie pinu (1:1)

| Pin `battleScene.ts` | Rust (`siege_tactics_instant.rs`) |
|---|---|
| `:3720-3722` `siegeWallCol >= 0 && atk.some(u => !u.dead && isSiegeUnit(u.bu))` → `wallEverBreached = true` | `instant_wall_ever_breached` / `attacker_has_live_siege_unit` (cały roster, także martwi pomijani filtrem `!dead`; `isSiegeUnit` = istniejące `siege_tactics_classify::is_siege_unit`, wejście z `stats.Typ`, `stats.Jednostka`, `nazwa`) |
| `:3724-3725` filtr `!u.dead` | `skip_instant_fallback` |
| `:20423-20424` stan `{ru, hp: u.bu.hp}` | `SlotState` (`bu.hp` `undefined` → `NaN`, odpada w `hp > 0`) |
| `:20426` `maxWaves = (A + D) * 6 + 10` | identycznie (`usize`) |
| `:20431-20441` `lA/lD` z `hp > 0` na początku fali, `pairs = max`, `lA[i % lA.length]`, `lD[i % lD.length]` | indeksy stanów, ta sama kolejność |
| `:20442` pominięcie `hp <= 0` (żywy stan) | identycznie (`!a`/`!d` nieosiągalne przy modulo) |
| `:20444-20447` `toCombatUnit(bu, hunger, true, gold, true)`, `cu.health = hp` | prawdziwe `to_combat_unit` z `skip_hunger/skip_gold = true` |
| `:20452-20454` `relativeHit(d.facing, a.q, a.r, d.q, d.r)` | `siege_tactics_inputs_pos::relative_hit` |
| `:20466-20469` `defOnWall` → `'Plaskie (rownina/laka)'`, inaczej `terrainMap.combatTerrainName` albo `terrain` | `WALKWAY_TERRAIN` / `TileMap::name` / `scene.terrain` (`terrain_map: Option`) |
| `:20489-20494` `hasMur`, `cityElevationTerrain` (na murze teren bazowy miasta), `cityGatedTerrainMultiplier` tylko przy `isCityDefense` | identycznie |
| `:20495-20501` `fortificationDefenseBonusForUnit({side, onWallWalkway: defOnWall, q, siegeWallCol})`, wpis `defBonus`, `structBonusPctForPair` | identycznie; `def_bonus` zwracany (web `lastInstantDefBonus`) |
| `:20505-20509` `fieldFortifyDefenseBonus` (+50%) | identycznie, `InstantConsts::fortify_obrona_proc` |
| `:20516-20526` bród (bez bramki `onWallWalkway`, inaczej niż `_singleBlow`) / brzeg | identycznie (`is_ford_tile`, `is_shore_adjacent_to_ford`), tylko gdy jest mapa |
| `:20534-20567` opcje `resolveCombat` | `InstantPairOpts` (pole po polu; `battleUnitCivBonusy`/`battleUnitDifficultyCombatMult` = `Option::unwrap_or` strony; `?? 0` budynków; `=== true` flag) |
| `:20568-20572` `res.log` do `log`, HP po parze | identycznie |
| `:20574-20589` ocalali `hp > 0`, werdykt: jednostronny albo `hpA >= hpD` (bez remisu), suma `reduce` w kolejności rosteru | identycznie |
| `:20591` linia końca | `instant_verdict_line` |

`result.log`: jedyny tekst tworzony przez samo `computeInstantResult` to linia `:20591` — bez liczb, więc `toFixed`
z dispatchu nie występuje w tej funkcji (`toFixed(1)` żyje w tekstach `resolveCombat`, `combat.ts:1043-1208`, które
dostarcza resolver).

## 3. Decyzje techniczne

- **D1 — rozstrzygnięcie pary wstrzyknięte (`InstantPairResolver`), nie `combat::resolve`.** Dispatch mówi „na istniejące
  `combat::resolve`”, ale `combat::resolve` (`combat.rs:381` → `resolve_combat`) NIE jest portem web `resolveCombat`:
  to inny model (zbiorcza siła stron `attack * hp * …`, HP `u32`, deterministyczny, bez opcji `ResolveCombatOpts`, bez
  logu). Web `resolveCombat` (`combat.ts:842-1251`) ma w Rust tylko pętle faz (`combat::ranged_phase`, `combat::melee_phase`,
  bez tekstów logu); wejścia przed fazami to otwarte #135/#167. Podpięcie `combat::resolve` dałoby wynik niezgodny
  z pinem (zasada 9/11 CLAUDE.md), więc resolver jest wejściem: trait dostaje DOKŁADNIE argumenty pinu (`cu_a`, `cu_d`
  po korektach Obrony, obiekt opcji bez `terrainData`/`counters`, które są stałymi bitwy resolvera) i zwraca
  `attackerHpLeft`, `defenderHpLeft`, `log`. RNG pinu (`Math.random`, brak `opts.rng`) też należy do resolvera.
  Proponowany temat wpięcia: port całego `resolveCombat` (wejścia #135/#167 + teksty logu faz) jako implementacja traitu.
- **D2 — typ wyniku E4:** `InstantResult { winner: BattleSide, survivors: Vec<(u64, f64)>, log, def_bonus }`;
  `BattleSide` (bez remisu) wymusza typem „E4 nigdy nie daje `'remis'`”. `survivors` = `(bu.id, hp)` — mapa czyta tylko
  te pola (§2a.1 rozpoznania, jak `BattleSurvivorDto`).
- **D3 — przekazanie `log` do DTO:** `InstantSkipData` (I1) NIE dostał pola (literał w teście I1 by się nie skompilował,
  a plik testu I1 jest poza allowlistą). Zamiast tego `build_battle_outcome_instant(atk, def, siege_wall_col,
  wall_ever_breached_przed, &InstantSkipOutcome)` buduje DTO przez niezmienione `build_battle_outcome` (ścieżka
  `EndPath::InstantSkip(InstantSkipData::from_skip(..))`) i wpisuje `log = result.log`. Prefiks `this.log` sprzed
  „Pomiń” pozostaje NIE_ZMIERZONY do P4-1I3 (#247), jak w E1–E3. Reguła machiny działa dwa razy spójnie: w
  `skip_instant_fallback` (stan `wall_ever_breached` dla pętli) i w producencie DTO (z `attacker_has_live_siege_unit`).
- **D4 — `siege_wall_col`:** scena E4 trzyma `f64` (jak `BlowSceneCtx`, porównania z `q` w `fortificationDefenseBonusForUnit`),
  producent DTO z I1 bierze `i64`; wołający musi podać tę samą kolumnę obu (adapter #113).
- **D5 — stałe:** `InstantConsts::from_data()` z `data/combat-params.json` silnika; test sprawdza równość z pinem
  (0.25 / 0.15 / 50, `battleScene.ts:984-993`).
- **D6 — weteran/głód/deficyt w `toCombatUnit`:** wywołanie prawdziwego `to_combat_unit` z `skip_hunger = skip_gold =
  true` jak pin; weteran (`veteranBonusFrac`) przechodzi przez `apply_veteran_frac_to_combat_unit` jak w pinie — wektory
  używają `veteranBonusFrac` nieustawionego (patrz §4, zakres generatora).

## 4. Wektory, testy, bramki, mutacje

**Generator** (`dowody/gen-p4-1i1b-vectors.mjs`, node v22.23.4 `--experimental-transform-types`) WYKONUJE tekst pinu bez
zmian (usunięte tylko `export`): `computeInstantResult` `:20389-20593` (CAŁY), `_skipInstantFallback` `:3715-3748`,
`isSiegeUnit` `:1552-1559` + `normName` `:1648-1650`, `Dir`/`DIR_DELTA`/`facingToward`/`oppositeDir`/`relativeHit`
(`:315-400`), `isFordTile`/`isShoreAdjacentToFord` (`:1897-1914`), `BTerrain`/`COMBAT_NAME` (`battle-terrain.ts:37-46`,
`:150-159`), `normTerrain`/`parseDefenseBonusPct`/`terrainDefenseMultiplier` (`combat.ts:620-671`),
`defenderInsideFortification`/`fortificationDefenseBonusForUnit`/`cityGatedTerrainMultiplier`/`fieldFortifyDefenseBonus`
(`city-defense.ts:113-130`, `:180-190`, `:237-245`), `battle-unit-context.ts:1-14`, dane `combat-params.json` i
`terrain-combat.json` pinu. Podstawione jawnie: `resolveCombat` → resolver-rejestrator (ta sama formuła w teście Rust:
`StubResolver`; rejestruje KAŻDY argument pary), `toCombatUnit` → minimum pól (w Rust działa prawdziwe `to_combat_unit`;
wiersze stats tylko z `Jednostka`/`Typ`/`meleeAttack`/`meleeDefence`, bez weterana). Liczby wyniku jako `String(x)` JS.
Polecenie (z katalogu repo): `git show 07d2fbd72:<plik> > $D/<nazwa>` dla 7 plików wymienionych w nagłówku generatora,
potem `node …/dowody/gen-p4-1i1b-vectors.mjs $D` → `OK 8 wektorów`.

Wektory (8): `atk_przewaga_pole_brod_brzeg_fortyfikacja` (przewaga atakującego; bród/brzeg 10·1.5·1.15 = 17.25, łuk
tyłu, nadpisania civ/trudności/budynków/głodu per jednostka, martwy taran poza wejściem), `def_przewaga_miasto_mur_wzgorze`
(przewaga obrońcy; mur 200% + wzgórze 50% = 250 na koronie i za murem, 0 przed murem, `override = 1`),
`mur_machina_wylom` (mur 300% + żywy taran → `wallEverBreached = true`), `mur_machina_martwa_bez_wylomu` (→ false),
`bez_muru_machina_po_nazwie` (katapulta po `nazwa`, `siegeWallCol = -1` → bez zmian; mapa górska `Gory`, `shallowSea`),
`remis_hp_atakujacy_wygrywa` (50 = 50 → atakujący; 28 fal × 2 pary = 56 wywołań), `brak_mapy_obie_strony_puste`
(obie strony puste → atakujący, `survivors = []`, log = tylko linia końca), `brak_mapy_obronca_flanka_las` (bez mapy:
`defTerrain = terrain`, łuk flanki, fortyfikacja).

Wyniki (`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie,
usunięte po bramkach):

| Crate | `cargo fmt --check` | `cargo clippy --all-targets -- -D warnings` | `cargo test --all-targets --no-fail-fast` |
|---|---|---|---|
| `rust-port/engine` | EXIT 0 | EXIT 0 | EXIT 0 — 3565 passed, 0 failed, 1 ignored (istniejący `p6_order_lane.rs:1530`, nie z tego tematu); `p4_1i1b_battle_instant` 8/8, `p4_1i1_battle_outcome` 18/18 |
| `rust-port/view-model` | EXIT 0 | EXIT 0 | EXIT 0 — wszystkie binarki ok; `battle_outcome_e4` 4/4 |

Mutacje (`dowody/mut-p4-1i1b.sh <engine> <katalog roboczy>`; każda na czystym źródle, przywrócenie na końcu):

| ID | Mutacja | Wynik |
|---|---|---|
| M1 | `hp_a >= hp_d` → `>` (dispatch) | FAIL (`wektory_pinu_compute_instant_result`) |
| M2 | `def_on_wall` zawsze `false` (dispatch) | FAIL (2 testy) |
| M3 | usunięty `wallBreached` przy machinie (dispatch) | FAIL (`wektor_mur_machina_wylom`, wektory pinu) |
| M4 | parowanie `l_d[i % len]` → `l_d[0]` | FAIL (3 testy) |
| M5 | E4 DTO bez `result.log` | FAIL (`e4_do_battle_outcome_dto`) |
| M6 | reguła machiny w producencie DTO wyłączona | FAIL (`e4_do_battle_outcome_dto`) |
| — | RESTORED | 8/8 ok |

Brak `#[ignore]` w nowych plikach, brak osłabionych asercji, `git diff --check` czysty.

## 5. Wołający produkcyjny

`skip_instant_fallback`, `compute_instant_result` i `build_battle_outcome_instant` NIE mają wołającego w produkcji
(tylko testy). To nie błąd tematu: wpięcie należy do #113 (`K5LOOP-WIRING`, miejsce web `_skipInstantFallback`, gdy
przewinięcie niemożliwe) i konsumentów #246/#248; dodatkowo produkcyjny `InstantPairResolver` wymaga portu całego
`resolveCombat` (D1).

## 6. Commit

Kod i dowody: `991556084bd154ba00a128294528a9b15cf847bd` na `wip/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT-op-r1` (rodzic `05e4df502`).
Raport: następny commit na tej gałęzi. Jawne `git add` (bez `-A`), bez `Cargo.lock`, bez push.
