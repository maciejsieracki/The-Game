# R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1 — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-HITAT-FQ-REGRESJA-Q1
GOAL: przywrócić zgodność kontraktu silnik ↔ renderer po FRAME-QUANT (`PlaybackError::HitAt` w E2E klienta) przy niezmienionych 42 wektorach pinu.
OCENIANY KOD: `6d3b88858` (gałąź `rust-port-wip/hitat-fq-q1`; kod `5e6614e00` + `a9d96a33f`), baza `3e5db0673b26c0838d23f621e8727ffd051a9c88` (zgodna z linią BAZA dispatchu). Ewaluacja na gałęzi `rust-port-wip/hitat-fq-q1-eval` (= `6d3b88858` + ten raport).
ZMIANY/COMMIT: tylko ten raport (bez zmian kodu).
RUNDY: 1/5
NASTĘPNY KROK: Obrona (02a-obrona.md), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone (CARGO_INCREMENTAL=0, debug off, własny CARGO_TARGET_DIR w scratchpadzie `hitat-ev-target*`, usunięty po bramkach)

| Bramka | EXIT | Wynik |
|---|---|---|
| engine `cargo fmt --check` | 0 | — |
| engine `cargo clippy --all-targets -- -D warnings` | 0 | — |
| engine `cargo test --all-targets --no-fail-fast` (tło, setsid nohup) | 0 | 4225 passed, 0 failed, 1 ignored (istniejący `dump_tick1_econ_for_web_generator`); `wektory_pinu_pelnej_bitwy_bajt_w_bajt` ok, `kontrakt_czasu_akcji_z_rendererem_klatka_16ms` ok |
| client `cargo fmt --check` | 0 | — |
| client `cargo clippy --all-targets -- -D warnings` | 0 | — |
| client `cargo test` (`engine_bridge_renderer` 18 + `siege_battle_client` 18) | 0 | 36 passed, 0 failed |
| renderer `cargo fmt --check` (gpu OFF, `default = []`) | 0 | — |
| renderer `cargo clippy --all-targets -- -D warnings` (gpu OFF) | 0 | — |
| renderer `cargo test` (gpu OFF) | 0 | 745 passed, 0 failed, 0 ignored; 3 nowe `hitat_fq_*` ok |

Dysk przed bramką renderera: 10,5 GB wolnego (próg dispatchu 12 GB). Odstępstwo jawne: w chwili startu
nie budował żaden inny proces cargo (sprawdzone `ps`), budowa klienta i renderera szła jednym wspólnym targetem,
z watchdogiem przerywającym przy < 3 GB. Minimum w trakcie: 10 588 MB (log `hitat-ev-df.log`). Równolegle
pojawiła się budowa silnika MARCH-INCREMENTAL (release, nie renderer). Po bramkach target usunięty: 12 GB wolnego.
Orkiestrator może uznać to za niespełniony warunek 12 GB; wynik bramek jest jednak pełny i zielony.

## 2. Allowlista i zakazy

- `git diff --stat 3e5db0673 6d3b88858`: `renderer/src/battle/playback.rs`, `renderer/tests/battle_playback.rs`,
  `renderer/tests/battle_playback_move_shot.rs`, `engine/tests/p6_k5loop_wiring_a_pin.rs` (tylko dopisek, 0 usuniętych
  linii), `dyspozycje/.../01-operator-r1{.md,-mutanty.py}`. Wszystko w allowliście. Brak sekcji „Pliki spoza allowlisty”
  w raporcie, i słusznie, bo takich plików nie ma. `renderer/Cargo.lock` przepisywany przez cargo nie jest commitowany
  (u mnie też przywrócony `git checkout`).
- Silnik `src/**` bez zmian; `p6_k5loop_wiring_a_pin_vectors/` bez zmian (diff pusty) → 42 wektory i lista wyjątków nietknięte.
- `#[ignore]`/`should_panic` w diffie: 0. Usunięte asercje: 0. `client/tests/siege_battle_client.rs` nietknięty.
- Trailer commitów bez nazwy modelu: OK.

## 3. Pin `07d2fbd72` (tekst, `git show`), sprawdzone niezależnie

- `_doMeleeAttack` `:9115-9122`: `const t0 = this._now()`; w `stepAnim` `localT = this._now() - t0`, cios przy
  `!hitDone && localT >= BLOW_HIT_T`. `_now()` = `vNow` (`:9403`), przesuwane klatkami `FF_STEP_MS =
  _scaledWallDelta(BATTLE_FRAME_WALL_MS)` (`:9419`). Przy klatce 16 ms cios pada w `t0+160`. D-HFQ-1 (wariant A) jest
  zgodny z tekstem pinu.
- `_doRangedAttack` `:9221-9224`: pocisk `dur: RANGED_FLY_MS` (380), obrażenia w `_schedule(RANGED_FLY_MS)`.
  `_drainTimers` (`:9616-9634`) odpala timer z `due <= target` (target = vNow klatki), czyli w `t0+384`. Renderer:
  lot 380 (bez zmian), akceptuje `land_at = t0+384`, zgodnie z pinem.
- Wektory: 0 wystąpień `hitAt|hit_at|landAt|land_at` w `p6_k5loop_wiring_a_pin_vectors/`, więc odrzucenie wariantu B
  ma sensowne uzasadnienie.
- Silnik (`siege_tactics_loop.rs` `:4845`, `:4870-4876`): `Melee` emitowane z `t0 = saved + attack_pre`,
  `hit_at = saved + attack_pre + frame_raf(16, body_ms)`. Odstęp wynosi zawsze 160 (liczby całkowite, f64 dokładnie),
  także przy `attack_pre > 0`. Klatka produkcyjna jest stała (`siege_battle_session.rs:1049` = 16; zmienia ją tylko
  `#[doc(hidden)] diag_set_speed_mul`), więc stałe `PIN_FRAME_MS = 16` w rendererze nie łamie produkcji.

## 4. Regresja odtworzona na bazie (własny pomiar)

V0: `playback.rs` z bazy `3e5db0673` w obecnym drzewie, potem `cargo test --test siege_battle_client` → EXIT 101,
`step: Playback(HitAt { t0: 137600.0, hit_at: 137760.0 })` (m.in. `e2e_16ms_do_konca_zdobycie_miasta_i_mapa_zgodna_z_mostem`,
`e2e_kroki_nieregularne_rowne_16ms`). Po zmianie Operatora: 18/18. Objaw z dispatchu jest odtworzony i naprawiony.

## 5. Mutanty Evaluatora (własne, `hitat-ev-mut.py`; log `hitat-ev-mut.log`)

| ID | Mutacja | Wynik |
|---|---|---|
| V0 | cały `playback.rs` z bazy (test klienta E2E) | ZABITY (HitAt) |
| V1 | domknięte okno `[t0+nom, t0+siatka]` zamiast dwóch punktów | ZABITY (151/159 przyjęte → test) |
| V4 | `TowerShot` też przez `is_pin_event_time` (poluzowanie) | **PRZEŻYŁ** (uwaga N2) |
| V6 | dodatkowo akceptowana klatka `siatka + 16` (176 / 400) | ZABITY |
| V10 | lunge startuje w `hit_at - BLOW_HIT_T` zamiast `t0` | ZABITY (scena i `LungeStart.t0`) |
| V11 | siatka 8 ms zamiast 16 | ZABITY |

Razem z 18 mutantami Operatora (17 zabitych; przeżył E3, czyli gałąź silnika poza zakresem tematu) liczba mutantów
w walidacji i emisji czasu ciosu przekracza wymagane ≥ 10.

## 6. Uwagi (nie blokują PASS)

- **N1 (E3, pokrycie silnika):** test kontraktu `kontrakt_czasu_akcji_z_rendererem_klatka_16ms` nie obejmuje ciosu po
  krokach `_advanceStep` (`attack_pre > 0`). Mutant `hit_at = saved + hit` przeżywa, a w produkcji przy doktrynie
  `steady`/`aggressive` dałby `HitAt` w kliencie. Kod jest dziś poprawny (sprawdzone w §3). Proponuję osobny dopisek
  testu jednostkowego lub scenariusza z `attack_pre > 0`, bo ta gałąź nie należy do tego tematu.
- **N2 (semantyka TowerShot/Boulder, dług po FRAME-QUANT):** w pinie `_fireOneTower` (`:4261-4262`) i kamień (`:7555`)
  używają `_schedule(RANGED_FLY_MS)` / `_schedule(700)`, czyli przy klatce 16 ms trafiają w `t0+384` / `t0+704`.
  Silnik emituje dla nich nominalne `380` / `700`, a dla `Shot` z tego samego `_schedule(380)` już `384`. DTO ma więc
  niespójną semantykę pól `land_at`. Renderer i klient tego nie łamią (dziś równość z nominałem), więc zgodnie
  z dispatchem („napraw tylko to, co faktycznie łamie”) zostało bez zmian. Jednak test kontraktu silnika zamraża
  380/700, a renderer nie ma testu, który odrzuca `TowerShot` w `t0+384` (V4 przeżył). Jeśli przyszły temat ujednolici
  czasy do siatki, trzeba będzie razem zmienić `playback.rs` (TowerShot/Boulder przez `is_pin_event_time`) i test
  kontraktu. Do rejestru jako dług SHOT-LAND-AT-RENDER/TOWER.
- **N3:** `PIN_FRAME_MS` jest w rendererze stałą. Przy produkcyjnym `speedMul ≠ 1` trzeba przekazać klatkę w
  `PlaybackOpts` (`client/src/lib.rs`, poza allowlistą). Operator to opisał. Dla `speedMul = 2` (32 ms) siatka daje
  przypadkiem te same 160/384, ale już nie dla 4 (64 ms → 192).
- **N4:** reguła „zmiana strumienia akcji silnika ⇒ bramki `client` + `renderer`” jest tylko propozycją w §7 raportu
  Operatora (`REJESTR-RUST.md` jest poza allowlistą). Wpis należy do orkiestratora.
- **N5:** bramka renderera przy 10,5 GB, a nie ≥ 12 GB (§1).

## BLOKADY

Brak blokad merytorycznych. Do decyzji orkiestratora: N2 (dług czasu TowerShot/Boulder), N1 (test `attack_pre > 0`),
N4 (wpis reguły bramek), N5 (próg dysku).
