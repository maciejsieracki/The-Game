# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Evaluator r1 (adwersarialny)

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A)
GOAL: SiegeBattleSession (start/step/skip/finish) nad SiegeLoop+ProdBody z adaptera T6 i pola T5, bez mostu
BAZA: origin/rust-port/parity-v2 = 32006733ba65bb22ff7776b104d1afb329841491 (bez zmian od startu Operatora)
OCENIANY KOD: rust-port-wip/k5loop-wiring-a-q1 = 9cb5c8b310daccc5bb196c4c511e6daf54b0ef03 (Operator r1)
ZMIANY/COMMIT: tylko ten raport (bez zmian kodu)
TESTY: fmt EXIT 0; clippy -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT=0 (543 x ok, 4124 passed,
       0 failed, 1 ignored = istniejący e2e::dump_tick1_econ_for_web_generator, spoza diffu); p6_k5loop_wiring_a 12/12
BLOKADY: Z1 (kryterium końca niespełnione), Z2 (cicha rozbieżność trafienia wieży z pinem)
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora, potem runda r2 Operatora z tym samym ID (lub decyzja orkiestratora o wydzieleniu B1)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Bramki odtworzone (worktree Evaluatora, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` (`rust-port/engine`) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (w tle, `setsid nohup`, EXIT w logu) | `EXIT=0`; 543 × `test result: ok`; suma 4124 passed / 0 failed / 1 ignored (istniejący, spoza diffu) |
| `cargo test --test p6_k5loop_wiring_a` | 12 passed |
| wektory generatora pinu (MD5) | **BRAK** — generator `p6_k5loop_wiring_a_gen.mjs` nie istnieje |
| `git diff --check 32006733b..9cb5c8b31` | czysto |
| `#[ignore]` w diffie | brak |
| trailery `Co-Authored-By` w commitach rundy | brak (0) |

Allowlista: zmienione `siege_battle_session.rs` (nowy), `domain/mod.rs` (1 linia `pub mod`), `siege_tactics_loop.rs`
(+182/−10), `tests/p6_k5loop_wiring_a.rs` (nowy), raport i skrypt mutantów w katalogu runu. Nic spoza allowlisty
(`bridge.rs`, `bridge_contract.rs`, `renderer/`, `gra/**`, `Cargo.*`, `REJESTR-RUST.md` nietknięte). Asercje istniejących
testów nie zmienione. Baza zgodna z dispatchem (`parity-v2` nadal `32006733b`).

## 2. Zarzuty

### Z1 (BLOKUJĄCY) — główne kryterium końca niespełnione: brak wektorów pinu pełnej bitwy

Dispatch, KRYTERIA KOŃCA: „Wektory pinu (generator TS wykonujący tekst pinu z guardem SHA …) dla pełnej bitwy AUTO z
murem od `start` do `finish`: wynik bajt w bajt … dla ≥ 6 scenariuszy”. Generator nie powstał (raport Operatora §6 B1,
§8 „NIE DOTYCZY”). `zlote_wyniki_sesji` to skrót FNV wyników Rusta (zamrożenie regresji, sam Operator pisze „NIE wektor
pinu”) — nie dowodzi parytetu, a w świetle Z2 zamraża wartości ROZBIEŻNE z pinem. Operator sam ustawił STATUS: BLOCK.
Bez wektorów nie ma dowodu, że scenariusze „mur/palisada/mury_kamienne = remis po 150 turach” czy „mur_machiny = obrońca,
tura 19” są wynikami pinu. Kryterium twarde → FAIL (albo decyzja orkiestratora o wydzieleniu B1 jako osobnego tematu
i zmianie kryterium tej części — to decyzja orkiestratora, nie Operatora).

### Z2 (BLOKUJĄCY, nowy, zmierzony) — trafienie wieży w sesji produkcyjnej liczone na neutralnym szablonie: obrońca Obrona 0, Pancerz 0, `max_hp` 10

Sesja ustawia `tower_outcome_effects = true` (`siege_battle_session.rs:752`), więc każde trafienie wieży idzie przez
`ProdBody::tower_blow_full` (`siege_tactics_loop.rs:4502`) z szablonem `SiegeEnv::tower_shot` = `tower_shot_from_row`
(`siege_tactics_loop.rs:351`, `siege_battle_adapter_body.rs:397`). `tower_shot_from_row` nadpisuje WYŁĄCZNIE `attacker`;
reszta to `neutral_tower_shot_template()` (`siege_tactics_loop.rs:226-291`): `defender.melee_defence = 0`,
`defender.armor = 0`, `defender_state.max_hp = 10`, `hit_arc = Front`, `counter_mult = 1`, `atk_diff_mult = 1`,
`atk_mods = 1`, `env.is_city_defense_battle = false`. `tower_blow_full` nadpisuje tylko `defender_state.hp/morale/flagi`,
a `max_hp` bierze z szablonu (`let max_hp = input.defender_state.max_hp;`) i podaje go do `apply_morale_damage`
(utrata morale = `MORALE_HIT_LOSS_SCALE * dmg / max(1, max_hp)`, `siege_tactics_loop.rs:4773`) i do `emit_blow_log`.

Sonda Evaluatora (tymczasowy test, usunięty; scenariusze `scenarios()` Operatora, ścieżka `skip`):

| Scenariusz | wiersze wież | szablon wieży: Obrona/Pancerz/max_hp/łuk/kontry/env.city | akcje wieży | wynik |
|---|---|---|---|---|
| mur | 39 | 0 / 0 / 10 / Front / 1 / false | 0 | remis, t150 |
| mur_machiny | 39 | 0 / 0 / 10 / Front / 1 / false | 18 | obrońca, t19 |
| palisada_liczni | 39 | jw. | 0 | remis, t150 |
| mury_kamienne_jazda | 39 | jw. | 0 | remis, t150 |
| fort_slaby_atak | 39 | jw. | 0 | obrońca, t10 |
| mur_taran_katapulta | 39 | jw. | 42 | atakujący, t43 |

Pin (`battleScene.ts:4222-4269` `_fireOneTower` → `_singleBlow(shooter, target, true)` `:8811-8960`) liczy trafienie wieży
pełnym `_singleBlow`: `cuD = toCombatUnit(target.bu)` (realna Obrona i Pancerz celu), `defender.bu.maxHp` w
`_resolveBlowOutcome`, `relativeHit(target.facing, wallCol, row, …)` (strzelec stoi na `(wallCol, t.row)`, cel może być
trafiony z flanki), `terrDefMult` miejski (`isCityDefenseBattle`, `cityGatedTerrainMultiplier` kafla celu `:8848-8855`),
`atkBonusy = battleUnitCivBonusy(shooter.bu, defenderCivBonusy)` (shooter.side = 'def'), `defOwnerDiffMult`/`atkOwnerDiffMult`
trudności, `counterMultiplier(shooter.counterTyp, cuD.counterTyp)`. W sesji: trafienie prawie zawsze (Obrona 0), pełne
obrażenia (Pancerz 0) i utrata morale ~10× za duża dla jednostek o maxHp 100. W dwóch z sześciu scenariuszy (18 i 42
trafień wieży) to bezpośrednio steruje wynikiem bitwy.

To jest CICHA rozbieżność: przed T7 to trafienie dawało jawny tag `wieza-resolveBlowOutcome-efekty`; po T7 tag zniknął,
`unported` jest puste, a wynik jest liczony z niepoprawnymi wejściami. Raport Operatora wymienia tylko „D-WIRA-T: szablon
strzału wieży statyczny … pin liczy z terenem kafla celu” jako dług — zaniża skalę (brak informacji o Obronie/Pancerzu 0
i `max_hp` 10) i nie spełnia wymogu dispatchu „unported PUSTE … jeśli niepuste — zamknij albo blokada z numerami linii
pinu”: tu gap jest ukryty, nie otagowany. Naprawa w zakresie allowlisty: złożyć trafienie wieży przez ten sam
`BlowComposer` (strzelec syntetyczny na `(wallCol, row)`, `ranged = true`, strona obrońcy, cel = realny `ComposeUnit`),
`max_hp` z celu, `hit_arc` z `relativeHit`; albo do czasu naprawy przywrócić jawny tag zamiast cichego wyniku.

### Z3 (UWAGA) — mutanty nowej gałęzi `tower_blow_full` przeżywają

Odtworzone przez Evaluatora na `p6_k5loop_wiring_a` (plik przywrócony po każdym, `git status` czysty):

| Mutant | Wynik |
|---|---|
| E1 `tower_blow_full`: `dmg > 0.0` → `dmg >= 0.0` przy `Damage` (`siege_tactics_loop.rs:4563`) | ZABITY (`zlote_wyniki_sesji`) |
| E2 `tower_blow_full`: usunięte `self.kill_ripples.push(tref)` (`:4556`) | **PRZEŻYŁ** (12/12 zielone) |
| E3 `tower_blow_full`: gałąź `_ if st.unit(tref).c.routed => ClashTag::Rout` → `if false` (`:4532`) | **PRZEŻYŁ** (12/12 zielone) |

Nowa gałąź efektów wieży (ripple zabicia, tag `Rout` po rout z morale) nie ma testu; dispatch wymaga mutantu na każdą
gałąź. Dodatkowo M16 i M23 Operatora są „równoważne NA DANYCH” (brak civ-bonusu muru i lasu w scenariuszach), a nie
równoważne semantycznie — wystarczy scenariusz z `civ_bonusy` dającym `civWallDefenseMultiplier ≠ 1` (M16) i obrońcą na
dziedzińcu w lesie z bonusem leśnym (M23), by je zabić. Wymaga testu albo ścisłego uzasadnienia.

### Z4 (UWAGA) — pozostałe ciche przybliżenia zapisane jako długi

- D-WIRA-10: `terrain_defence_mult` z kafla startowego zamiast bieżącego (`_checkRout` `:9790-9792`) — cichy wynik, bez
  tagu. Dopuszczalne jako dług tylko z jawnym tagiem lub wektorem dowodzącym nieosiągalności w oblężeniu.
- `attack_pre` E8/E22/E30: NIE_ZMIERZONO — dispatch wymagał rozwiązania długów „o ile w zakresie sesji”; pomiar sondą
  był w zakresie (pętla i sesja są w allowliście).
- `step()` w fazie `Prepared` z niepoprawnym `wall_delta_ms` (NaN/ujemny) najpierw wykonuje `play()` (start bitwy,
  pierwsza tura), dopiero potem zwraca błąd (`siege_battle_session.rs:872-883`) — walidacja powinna poprzedzać zmianę stanu.
- Czas rzeczywisty ignoruje `speedMul` i clamp `BATTLE_FRAME_MAX_WALL_DELTA_MS` z `_advanceVClock`/`_scaledWallDelta`
  (`battleScene.ts:9500-9515`); przy klatkach 16 ms clamp jest bez znaczenia, `speedMul` = 1 nie jest zapisany jako
  decyzja D-WIRA (uzupełnić).

## 3. Co jest poprawne (zweryfikowane z tekstem pinu)

- RNG: jedyny rzut rozgrywki w `battleScene.ts` to `:8960` (`Math.random() * 100` w `_singleBlow`); pozostałe
  `Math.random` (`:11030-11242`) to audio. `SessionRolls` (jeden `next_f64` na rzut, ziarno `state.params.seed` +
  `battle_index`, `siege_battle_session.rs:693`) zgodny z D-WIR-5.
- R5: `_updateStallWatch` `:5568-5582` w oblężeniu wraca od razu (`siegeWallCol >= 0`) — brak sufitu PAT w czasie
  rzeczywistym; sufit tur przez `_checkEnd` — ustalenie Operatora potwierdzone.
- R7: `skip()` przed `started` → `_skipInstantFallback` (`:3692`) — jawny `SkipBeforeStartNotPorted` zgodny z dispatchem.
- Kompozytor ciosu: `defTerrain` (`:8831-8833`), `isCharge` tylko wręcz z `engaged` i `bracesAgainstCharge`
  (`:8893-8899`), `terrain: defTerrain` dla obu stron w `civCombatStatMultipliers` (`:8902-8922`), `wallCivMult` tylko
  na koronie — zgodne. `hit_arc` z `relativeHit` w `ProdBody::strike` zachowany po `compose`.
- Pełny test silnika zielony; asercje istniejących testów nietknięte; `tower_outcome_effects = false` domyślnie, więc
  wektory `p4_1i3`/`p4_1i2` bez zmian.

## 4. Wymagane w r2 (ten sam ID)

1. Z2: trafienie wieży przez kompozytor (realny cel: Obrona, Pancerz, `max_hp`, łuk z `relativeHit` od `(wallCol,row)`,
   bonusy cywilizacji obrońcy, trudność obrońcy, kontry, teren miejski kafla celu) albo jawny tag do czasu naprawy;
   regeneracja `zlote_wyniki_sesji` z uzasadnieniem.
2. Z1: generator pinu pełnej bitwy (≥ 6 scenariuszy, guard SHA, MD5) — albo pisemna decyzja orkiestratora o wydzieleniu
   B1 do osobnego tematu i formalna zmiana kryterium tej części.
3. Z3: testy zabijające E2, E3 (oraz M16/M23 albo ścisła równoważność).
4. Z4: walidacja `wall_delta_ms` przed `play()`; sonda `attack_pre`; decyzja `speedMul`.

## 5. Długi

Bez zmian względem §7 raportu Operatora, z korektą: „D-WIRA-T” zastąpione przez Z2 (zakres: cały `_singleBlow` wieży,
nie tylko teren kafla celu).


## RUNDA 2 (Evaluator r2, 2026-11-19)

Werdykt r2: **FAIL**. Pełny raport: [`02-evaluator-r2.md`](02-evaluator-r2.md). Główny zarzut (E2-1): pomiar falsyfikuje diagnozę B-WIRA-PIN-1. Pin z klatką 2 ms (krok 310 ms jak w Rust) daje ten sam wynik co z klatką 16 ms (`palisada_liczni_taran` bit w bit, `mur_wieza_obl_las` ten sam zwycięzca i tura). Pierwsza rozbieżność `mur_wieza_obl_las` (tura 12, krok łucznika `a3` 37,78→38,78) jest logiczna, nie czasowa. Kryterium r2 niespełnione: zgodność 3/8 i mutanty 3/14.
