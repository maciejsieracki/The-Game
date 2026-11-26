# R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1 — Final Control, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1
GOAL: komenda mostu `SetSiegeBattleSpeed { idx, clamp }` (= `_setSpeedIdx` pinu `07d2fbd72`, `battleScene.ts:9518-9527`) z odpowiedzią `speedIdx`/`speedMul` w `siegeBattle`, bez `StateChanged`; klient przelicza `frame_ms` playbacku (`16 × speedMul`) bez `GetRenderFrame`.
ZMIANY/COMMIT: oceniany stan = `9d0d91e15` (gałąź `rust-port-wip/P4-407-FQ-SPEED-BRIDGE-Q1-obrona`; kod Operatora `44bba295c` + `6259677fb`, raport `bd8aaa7d8`, Evaluator `2496a014d`, Obrona `ffab9af71` + `9d0d91e15`). Baza `43512a2c32587dfd8d9cf38e5db614581d0014ca` = `origin/rust-port/parity-v2` w chwili FC (`git rev-parse`; `merge-base --is-ancestor` OK). FC nie zmienia kodu; jedyny nowy plik to ten raport (commit na gałęzi `rust-port-wip/P4-407-FQ-SPEED-BRIDGE-Q1-fc`, bez push).
TESTY: odtworzone samodzielnie przez FC na `9d0d91e15`, niżej; wszystkie EXIT 0.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge na `rust-port/parity-v2` po sprawdzeniu ancestry i `git diff --stat`), wpisy w REJESTR-RUST (niżej §5), potem #409 CLIENT-API-GAPS (kolizja `client/src/lib.rs`).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Bramki (FC, env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, osobny `CARGO_TARGET_DIR` w scratchpadzie per crate, usunięty po bramce)

| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets |
|---|---|---|---|
| engine | EXIT 0 | EXIT 0 | EXIT 0 — **4352 passed / 0 failed / 1 ignored** (`--no-fail-fast`, w tle `setsid nohup`, `TEST_EXIT=0` w logu; ignorowany test istniał na bazie) |
| renderer (gpu OFF) | EXIT 0 | EXIT 0 | EXIT 0 — **758 passed / 0 failed** (757 + nowy test obrony U4) |
| client | EXIT 0 | EXIT 0 | EXIT 0 — **51 passed** (24 + 27) |

- Kolejność: engine → renderer → client, bez równoległych buildów (`ps` czysty). Wolne przed bramką renderera: 14 GB.
- Zielone w silniku m.in.: `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (wektory pinu `speed_vectors.json`), 8 testów `p4_407_fq_speed_bridge.rs`, `bridge_contract.rs`, `p4_fq_speed.rs`.
- `renderer/Cargo.lock` przepisany przez build (dług T1-LOCK) — cofnięty `git checkout`; drzewo czyste; brak procesów cargo po rundzie.
- `speed_vectors.json` policzony przez FC: **288** wektorów (lista), nie 351 — patrz U2.

## 2. Allowlista, zakazy (sprawdzone `git diff --stat 43512a2c3 9d0d91e15`)

Zmienione: `engine/src/bridge.rs`, `engine/src/domain/siege_battle_apply.rs`, `engine/src/domain/playable.rs` (15 linii, wrapper analogiczny do `step/skip_siege_battle`; pole `siege_battle` prywatne — konieczne, przyjęte), `client/src/lib.rs`, `renderer/src/battle/playback.rs` (tylko `opts()` + `set_frame_ms`, logika trafień nietknięta), testy `engine/tests/bridge_contract.rs`, `engine/tests/p4_407_fq_speed_bridge.rs` (nowy, wzorzec `p4_*`), `client/tests/siege_battle_client.rs`, `renderer/tests/battle_playback_move_shot.rs`, pliki runu (raporty + skrypt kandydatów `02a-obrona-u1-kandydaci.py`). Wszystko w allowliście.
- `siege_battle_session.rs`, `siege_tactics_loop.rs`, `siege_tactics_clock.rs`, `gra/`: bez zmian (D-407-4).
- `CONTRACT_VERSION` = 1 (asercja w `bridge_contract.rs`). Brak `#[ignore]` w diffie, brak usuniętych asercji (`grep '^-.*assert'` pusty). Commity bez nazwy modelu.

## 3. Zgodność z pinem i dispatchem (czytane `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

- `_setSpeedIdx` (`:9518-9527`): clamp = `max(0,min(n-1,idx))`, inaczej `((idx%n)+n)%n` → Rust `speed_step_index` w istniejącym `SiegeBattleSession::set_speed_idx` (`:1327`), wołanym bez zmian przez `siege_battle_apply::set_speed`. Most nie dodaje reguł (D-407-1): `_cycleSpeed` (`:9536`) i `_adjustSpeedIdx` (`:9531-9533`) są aliasami w kliencie liczonymi od `speedIdx` widoku — jak pin od `this.speedIdx`.
- D-407-2: prędkość w sesji (`DriverOp::Speed(usize)` — rozstrzygnięty indeks — w powtórce sesji), nie w `EngineState`, nie w zapisie (`predkosc_nie_w_zapisie`).
- D-407-3: `is_siege_battle()` rozszerzone; `StateChanged` tylko dla `Finish`; klient nie woła `GetRenderFrame` po zmianie (licznik `frame_calls` w testach E2E); `frame_ms` playbacku ustawiany dopiero po przyjętej odpowiedzi.
- Kryterium 2: bez bitwy i po `Finish`/`Abort` ⇒ `noActiveBattle` (opisane: po końcu bitwy scena pinu jest zamknięta); faza `Finished` przed `Finish` dozwolona i nie zmienia wyniku (test). Siatka `16 × speedMul` sprawdzona @1/@4/@64/@512 w E2E.

## 4. Mutanty FC (własne, patch → test → `git checkout`, drzewo czyste po serii)

| # | Mutant | Wynik |
|---|---|---|
| F1 | silnik `set_speed`: `set_speed_idx(idx, !clamp)` (odwrócona reguła clamp/zawinięcia) | ZABITY (`predkosc_przez_most_jak_set_speed_idx_pinu`, `predkosc_przez_mock_adapter`) |
| F2 | klient `cycle_siege_battle_speed`: `speedIdx + 2` zamiast `+ 1` | ZABITY (`fq_speed_bridge_zmiana_w_trakcie_cycle_i_panel`) |

Łącznie z Operatorem (13), Evaluatorem (10 zabitych, 2 równoważne) i Obroną (2): kryterium 4 (≥ 8) spełnione z zapasem.

## 5. Orzeczenia wobec zarzutów

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| U1 parytet zmiany prędkości w trakcie bitwy | **ODDAL** | Kod mostu woła istniejącą, nietkniętą metodę sesji (FQ-SPEED-Q1, zintegrowaną); Obrona przedstawiła pomiar 32/32 zgodnych z pinem przy zmianie w trakcie (kontrola czułości: mutant 27/32 rozbieżnych) z MD5 plików. FC tego pomiaru NIE odtwarzał (pliki w scratchpadzie Obrony) — dla FC: NIE_ZMIERZONO-przez-FC, przyjęte na dowodzie Obrony. Brak zamrożonych wektorów zmiany w trakcie w `cargo test` → osobny temat `FQ-SPEED-MIDCHANGE-VEC` (poza D-407-4). |
| U2 liczba wektorów 351 vs 288; c1 128/128 | **ODDAL** (korekta dokumentacji dla orkiestratora) | FC policzył: `speed_vectors.json` = 288 (32 × 9). Test pinu zielony. „c1 128/128 @1/@16” to pomiar diagnostyczny Obrony spoza `cargo test` — FC nie odtwarzał (NIE_ZMIERZONO przez FC); regresji brak w pełnym `cargo test`. Orkiestrator: „351” → „288” w REJESTR-RUST i dispatchu. |
| U3 słaba asercja x4 | **ODDAL** | Poprawione w `ffab9af71` (`assert!(… > 0)`); test zielony u FC. |
| U4 brak testu renderera `set_frame_ms` | **ODDAL** | Dodany `fq_speed_bridge_set_frame_ms_switches_the_grid_of_later_actions`; zielony u FC (renderer 758). |
| U5 rozjazd prędkości po błędzie `SpeedAnswer` | **ODDAL** (dług do #410) | Możliwy tylko przy uszkodzonym transporcie (silnik zawsze wypełnia oba pola, test kontraktu); naprawa wymaga decyzji o kontrakcie odpowiedzi — dopisać do dispatchu #410 TAURI-GLUE. |
| U6 `idx: i64` odrzuca `3.0` | **ODDAL** (uwaga dla #411) | `JSON.stringify` nie produkuje `3.0`; ułamkowy indeks w pinie dałby `speedMul = undefined`, odrzucenie jest bezpieczniejsze. #411: `idx` całkowite (`Math.trunc`). |

Brak zarzutu NAPRAW, brak sprawy DO DECYZJI CZŁOWIEKA (wszystkie kwestie techniczne, decyzje D-407-1..4 przestrzegane, brak odstępstwa gameplay od pinu).

## 6. Werdykt

**PASS-WITH-NOTES.** Kryteria końca 1–5 spełnione i odtworzone przez FC (bramki trzech crate'ów EXIT 0, kontrakt mostu z `CONTRACT_VERSION` = 1, E2E silnik→most→klient→playback, `noActiveBattle`, brak `GetRenderFrame`, mutanty, wektory pinu bez regresji). Uwagi do rejestru: korekta 351 → 288; temat `FQ-SPEED-MIDCHANGE-VEC` (zamrożenie wektorów zmiany prędkości w trakcie bitwy); dług U5 → #410; U6 → #411.
