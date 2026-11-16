# 02a — Obrona Operatora r1: R-RUSTPORT-P4-1I1B-BATTLE-INSTANT

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I1B-BATTLE-INSTANT
GOAL: ścieżka „Pomiń” (E4): port `computeInstantResult` (`battleScene.ts:20389-20593`), reguła `wallBreached` przy
machinie (`:3720-3722`), `result.log` i wejście E4 do `BattleOutcomeDto`.
ZMIANY/COMMIT: gałąź robocza `wip/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT-obrona-r1` od `c773dec50` (HEAD Operatora r1);
commit obrony: patrz §4 (SHA w raporcie końcowym Workflow).
TESTY: §3.
BLOKADY: bez zmian względem r1 (resolver pary wstrzyknięty do czasu portu `resolveCombat`; brak wołającego w produkcji,
#113/#246/#248; prefiks `this.log` NIE_ZMIERZONY do #247).
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Final Control r1.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji; `gra/`, `origin/main`, `rust-port/parity-v2` nietknięte;
`Cargo.lock` nie commitowany).

Baza obrony: gałąź Operatora `wip/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT-op-r1` = `c773dec50` (kod `991556084`) na
`origin/rust-port/parity-v2` = `05e4df502` (zgodnie z dispatchem). Raport Evaluatora: `fc3bb2f09`
(`eval/1I1B-r1`, `02-evaluator.md`).

## 1. Odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź | Poprawka i dowód |
|---|---|---|---|
| 1 | Brak wektora z obrońcą STOJĄCYM w brodzie (`:20517-20519`); mutacja E1 przeżywa | **PRZYJMUJĘ** | Nowy wektor pinu `obronca_w_brodzie_kara` (2×2 pary, obaj obrońcy na kaflu Ford = 4, jeden z fortyfikacją w polu). Z wykonania tekstu pinu: `dDef` = `"9"` (12 × 0.75) i `"12.375"` (11 × 1.5 × 0.75), `defenderTerrain` = `"Rzeka"` (`COMBAT_NAME[Ford]`, `battle-terrain.ts:155`). Test `wektor_obronca_w_brodzie` + pełne porównanie w `wektory_pinu_compute_instant_result`. Mutacja E1 dopisana jako **M7** (`cu_d.melee_defence *= 1.0 - brod_kara_obrona` usunięte) → **FAIL** (`wektory_pinu_compute_instant_result`). |
| 2 | Brak wektora obrony miasta bez muru (`hasMur = false`, `:20480`); mutacja E2 przeżywa | **PRZYJMUJĘ** | Nowy wektor pinu `miasto_bez_muru_wzgorze`: `isCityDefense = true`, `wallDefenseTotalProc = 0`, obrońca na Wzgórzach i drugi w Lesie. Z pinu: `structureDefBonusPct = "0"` we wszystkich parach (bo `cityGatedTerrainMultiplier(false, …) = 1`, `city-defense.ts:185`), `override = "1"` (`:20556`), `defBonus` same `"0"`. Przy `hasMur = true` wzgórze dałoby `"50"`. Test `wektor_miasto_bez_muru`. Mutacja E2 dopisana jako **M8** (`has_mur = true || …`) → **FAIL** (`wektory_pinu_compute_instant_result`). |
| 3 | D1 (trait `InstantPairResolver` zamiast `combat::resolve`) wymaga jawnego przyjęcia przez FC/orkiestratora; zależność od portu `resolveCombat` trzeba wpisać do rejestru/kolejki | **PRZYJMUJĘ** (zapis), wpis do rejestru należy do orkiestratora | Rejestr (`dyspozycje/rust-port/REJESTR-RUST.md`) i kolejka są POZA allowlistą tego tematu (allowlista: tylko `runs/R-RUSTPORT-P4-1I1B-BATTLE-INSTANT/**` po stronie dokumentów), więc Operator ich nie edytuje. Gotowy wpis do naniesienia przez orkiestratora po FC — §2. Decyzja D1 pozostaje jawna w `01-operator-r1.md` §3 i w doc-u modułu. |
| 4 | `result.log`: bajt w bajt z pinem tylko linia końca `:20591`; linie par ze stubu → zgodność logu E4 NIE_ZMIERZONA | **PRZYJMUJĘ** (jako zapis NIE_ZMIERZONO, bez zmiany kodu) | Zgadzam się w całości: port przenosi linie `res.log` resolvera 1:1 w kolejności (`:20570`, sprawdzone wektorami: każda linia stubu na swoim miejscu), ale treść linii par zależy od tekstów logu `resolveCombat` (`combat.ts:842-1251`), które nie są portowane. Status: **zgodność treści linii par logu E4 z webem = NIE_ZMIERZONO do portu `resolveCombat` (wpis §2)**; zmierzone: kolejność/przeniesienie linii i linia końca. |
| 5 | Stub `toCombatUnit` w generatorze bez weterana; wektor z `veteranBonusFrac ≠ 0` nie byłby porównaniem z pinem | **PRZYJMUJĘ** (zabezpieczenie) | Dla obecnych wejść stub = pin (brak weterana, głód/deficyt pomijane przez `skipHunger/skipGold = true`, `:20444-20445`). Generator dostał twardą bramkę: `mk()` rzuca błąd dla każdego pola jednostki spoza `UNIT_KEYS` i każdego pola `stats` spoza `STAT_KEYS` (`Jednostka`, `Typ`, `meleeAttack`, `meleeDefence`) — wejście z `veteranBonusFrac` (lub innym polem, którego stub nie odwzorowuje) nie wygeneruje wektora po cichu. Regeneracja z bramką: 8 starych wektorów identycznych z r1 (porównanie JSON `old == new[:8]` → `True`). Pełny `combatUnitFromDef` + `applyVeteranFracToCombatUnit` w generatorze = poza zakresem (strona Rust i tak używa prawdziwego `to_combat_unit`). |
| 6 | Dwa źródła `siege_wall_col` (f64 w `InstantScene`, i64 w `build_battle_outcome_instant`); rozbieżne wartości bez błędu; `wall_ever_breached` z `InstantSkipOutcome` nieużywane przez producenta DTO | **PRZYJMUJĘ** | `InstantSkipOutcome` niesie teraz `siege_wall_col` sceny (`siege_tactics_instant.rs`). `build_battle_outcome_instant` zwraca nowy `OutcomeError::InstantWallMismatch`, gdy (a) `siege_wall_col >= 0` producenta ≠ `skip.siege_wall_col >= 0.0` albo (b) `dto.wall_breached = Some(w)` i `w ≠ skip.wall_ever_breached` (ta sama reguła `:3720-3722` liczona dwiema ścieżkami musi dać to samo). Semantyka E1–E3 i `build_battle_outcome` bez zmian. Test `e4_rozbiezne_zrodla_muru_to_blad` (3 przypadki rozbieżności → `Err`, zgodne wejście → `Ok`). Mutacja **M9** (wyłączenie kontroli (b)) → **FAIL**. |

## 2. Wpis do rejestru/kolejki (do naniesienia przez orkiestratora; poza allowlistą Operatora)

`dyspozycje/rust-port/REJESTR-RUST.md` — decyzja techniczna:

> **P4-1I1B D1 (2026-11-16):** „Pomiń” (E4, `computeInstantResult`) rozstrzyga parę przez wstrzyknięty trait
> `InstantPairResolver` (`siege_tactics_instant.rs`), NIE przez `combat::resolve` (`combat.rs:381`): `combat::resolve`
> to model zbiorczy (HP `u32`, bez obiektu opcji `:20534-20567` i bez `res.log`), więc dałby wynik niezgodny z pinem.
> Produkcyjnego resolvera dla E4 NIE MA do czasu portu web `resolveCombat` (`combat.ts:842-1251`) z wejściami przed
> fazami (#135/#167) i tekstami logu. Do tego czasu: zgodność treści linii par `result.log` E4 = NIE_ZMIERZONO.

Kolejka — nowy temat (proponowane ID): **R-RUSTPORT-COMBAT-RESOLVE-PAIR** — port web `resolveCombat` jako
`InstantPairResolver` (opcje pary, `res.log`, `attackerHpLeft/defenderHpLeft`) z wektorami pinu; zależny od #135/#167;
odblokowuje produkcyjne E4 (#113 wpięcie, #246/#248 konsumenci) i pomiar treści `result.log`.

## 3. Testy (obrona)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
poza repo (usunięty po bramkach).

- Generator (`node --experimental-transform-types`, tekst pinu `07d2fbd72` z `git show`): `OK 10 wektorów`;
  8 pierwszych identyczne z r1, 2 nowe (zarzuty 1–2). Wektory w teście = minifikacja JSON generatora (sprawdzone
  linia po linii dla starych 8 przed dopisaniem nowych).
- `rust-port/engine`: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0;
  `cargo test --all-targets --no-fail-fast` EXIT 0 (486 binarek, 3568 passed, 0 failed, 1 ignored — istniejący `e2e::dump_tick1_econ_for_web_generator`, spoza diffu; r1 miało 3565, +3 nowe testy).
- `p4_1i1b_battle_instant`: 11/11 (było 8; +`wektor_obronca_w_brodzie`, `wektor_miasto_bez_muru`,
  `e4_rozbiezne_zrodla_muru_to_blad`); `p4_1i1_battle_outcome`: 19/19.
- `rust-port/view-model`: `cargo fmt --check` EXIT 0, `cargo clippy --all-targets -- -D warnings` EXIT 0, `cargo test --all-targets --no-fail-fast` EXIT 0 (11 binarek, 100 passed, 0 failed; `battle_outcome_e4` bez zmian).
- Mutacje (`dowody/mut-p4-1i1b.sh`, 9 sztuk): M1–M9 wszystkie **FAIL** (rc=101); po przywróceniu 11/11 ok.

| Mutacja | Wynik | Test, który łapie |
|---|---|---|
| M1 `>=` → `>` | FAIL | `wektory_pinu_compute_instant_result` |
| M2 bez `defOnWall` | FAIL | wektory + `e4_do_battle_outcome_dto` |
| M3 bez wyłomu przy machinie | FAIL | wektory, `wektor_mur_machina_wylom`, `e4_do_battle_outcome_dto` |
| M4 parowanie `lD[0]` | FAIL | wektory, `compute_instant_result_bez_filtra_dead`, E4 DTO |
| M5 E4 bez `result.log` | FAIL | `e4_do_battle_outcome_dto` |
| M6 reguła machiny w DTO | FAIL | `e4_do_battle_outcome_dto` |
| M7 bez kary brodu obrońcy (E1 Evaluatora) | FAIL | `wektory_pinu_compute_instant_result` |
| M8 `has_mur = true` (E2 Evaluatora) | FAIL | `wektory_pinu_compute_instant_result` |
| M9 bez kontroli zgodności muru E4 | FAIL | `e4_rozbiezne_zrodla_muru_to_blad` |

## 4. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/siege_tactics_instant.rs` | pole `InstantSkipOutcome::siege_wall_col` (zarzut 6) |
| `rust-port/engine/src/domain/siege_tactics_outcome.rs` | tylko wejście E4: `OutcomeError::InstantWallMismatch` + kontrola w `build_battle_outcome_instant` (zarzut 6) |
| `rust-port/engine/tests/p4_1i1b_battle_instant.rs` | 10 wektorów, 3 nowe testy |
| `dowody/p4-1i1b-inputs.json`, `dowody/p4-1i1b-vectors.json` | +2 wektory (zarzuty 1–2) |
| `dowody/gen-p4-1i1b-vectors.mjs` | bramka pól stubu `toCombatUnit` (zarzut 5) |
| `dowody/mut-p4-1i1b.{py,sh}` | +M7, M8, M9 |
| `02a-obrona.md` | ten raport |

Poza allowlistą: zero zmian. `view-model` bez zmian w tej rundzie. Brak `#[ignore]`, brak osłabionych asercji.
