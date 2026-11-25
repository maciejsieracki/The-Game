# R-RUSTPORT-P4-FQ-SPEED-Q1 — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-FQ-SPEED-Q1 (prędkość bitwy speedMul ≠ 1: zgodność z pinem i klatka renderera z PlaybackOpts)
GOAL: orzeczenie po Operatorze r1 (342d5ad86), Evaluatorze r1 (7d6754ae1, FAIL Z1–Z3) i obronie r1 (ca30599a3 kod, ca786ff92 raport)
ZMIANY/COMMIT: oceniany kod ca786ff92 (nad BAZĄ ee1ceda3ebed21f90ec207f9e541e792738f7abc = origin/rust-port/parity-v2 w chwili FC,
               ancestry potwierdzone `merge-base --is-ancestor`); FC zapisuje wyłącznie ten raport (gałąź lokalna fq-speed-q1-fc)
TESTY: §2 (odtworzone samodzielnie, EXIT 0); pełny `cargo test --all-targets` engine i pełna bramka renderera NIE ODTWORZONO (dysk, §2)
BLOKADY: brak merytorycznych; infrastrukturalne: wolne 4,3–8,9 GB (< 12 GB) przy dwóch równoległych buildach innych tematów
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge ca786ff92 na parity-v2) z pełną bramką trzech crate'ów przy ≥ 12 GB; wpisy do REJESTR-RUST (§5)
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Zakres i allowlista (sprawdzone samodzielnie)

`git diff --name-only ee1ceda3e ca786ff92` — 17 plików, wszystkie w allowliście dispatchu: engine `siege_battle_session.rs`,
`siege_tactics_clock.rs`, `siege_tactics_loop.rs`, `tests/p4_fq_speed.rs` (nowy), `tests/p6_k5loop_wiring_a_gen.mjs`,
`tests/p6_k5loop_wiring_a_pin.rs`, `tests/p6_k5loop_wiring_a_pin_vectors/speed_vectors.json` (nowy); renderer
`src/battle/playback.rs`, `tests/battle_playback.rs`, `tests/battle_playback_move_shot.rs`, `tests/battle_playback_siege.rs`;
client `src/lib.rs`, `tests/siege_battle_client.rs`; `dyspozycje/.../R-RUSTPORT-P4-FQ-SPEED-Q1/` (raporty + skrypt mutantów).
Nietknięte: `gra/`, `src-tauri`, `view-model`, wszystkie `Cargo.lock`, `bridge.rs`, `bridge_contract.rs`.
`git diff --check` czysty; brak dodanych `#[ignore]` (trafienia grep tylko w tekstach raportów); brak nazw modeli w
komunikatach commitów zakresu. `vectors.json` MD5 `dae3e46efdffe94061347f93e7fc1038` = baza (45 wektorów bajt w bajt),
`pin_data.json` `432eed76…`, `speed_vectors.json` `d764f078f08aa5df274e3f74d09df14b` = raport Operatora.

Pin `07d2fbd72` (`gra/src/battle/battleScene.ts`) przeczytany: `SPEED_STEPS` `:2551`, `speedIdx`/`speedMul` `:2554-2555`,
`_advanceVClock` `:9500-9510`, `_scaledWallDelta` `:9512-9515` (clamp delty ŚCIENNEJ przed mnożeniem — brak sufitu
klatki), `_setSpeedIdx` `:9518-9527` (clamp vs `((idx % n) + n) % n`), `_adjustSpeedIdx` `:9531-9533`, `_cycleSpeed`
`:9536`. `speed_step_index`, `set_speed_idx`, `cycle_speed`, `adjust_speed_idx`, `SPEED_STEPS` w Rust zgodne z tekstem.

## 2. Bramki (FC, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własne `CARGO_TARGET_DIR`
w scratchpadzie `fqspeed-fc-tgt-*`, usunięte; `renderer/Cargo.lock` przywrócony, `git status` czysty)

| Bramka | Wynik FC |
|---|---|
| engine / client / renderer `cargo fmt --all -- --check` | EXIT 0 / 0 / 0 |
| engine `cargo clippy --all-targets -- -D warnings` | **EXIT 0** |
| engine `cargo test --release --lib --test p4_fq_speed --test p6_k5loop_wiring_a_pin --test bridge_contract` (w tle) | **EXIT 0**: lib 174/174, `bridge_contract` 10/10, `p4_fq_speed` 4/4, `p6_k5loop_wiring_a_pin` 13/13 (45 wektorów + 351 bitew prędkości) |
| renderer `cargo test --test battle_playback --test battle_playback_move_shot --test battle_playback_siege` | **EXIT 0**: 15 + 9 + 18 passed (w tym nowe `fq_speed_shot_lands_on_the_session_frame_grid`, `fq_speed_boulder_lands_on_the_session_frame_grid`) |
| renderer `cargo clippy --lib --test battle_playback* -- -D warnings` | **EXIT 0** |
| engine pełny `cargo test --all-targets` (556 binarek) | **NIE ODTWORZONO** (dysk < 12 GB, dwa równoległe buildy engine innych tematów). Ostatni pełny przebieg: Evaluator r1 na 342d5ad86 — 4279 passed / 0 failed. Różnica 342d5ad86..ca786ff92 w engine = tylko `siege_tactics_loop.rs` (usunięcie gałęzi osiągalnej wyłącznie przy `pin_blow_timing && !march_incremental` + 2 testy w `lib`) — pokryte lib + pin + clippy wyżej |
| renderer pełna bramka (clippy `--all-targets`, test `--all-targets`) | **NIE ODTWORZONO** (reguła dispatchu ≥ 12 GB). `renderer/src` bez zmian od Evaluatora r1 (751 passed); obrona dodała tylko 2 funkcje testowe w 2 plikach — skompilowane, zielone, clippy czyste wyżej |
| client fmt / clippy / test | fmt EXIT 0; clippy/test NIE ODTWORZONO — client bez zmian od Evaluatora r1 (41 passed, clippy 0) |

## 3. Mutanty (FC, podmiana → test → przywrócenie; `git status` czysty po przebiegu)

| ID | Mutant | Testy | Wynik |
|---|---|---|---|
| R4 | `playback.rs:948` gałąź `Shot`: `PIN_FRAME_MS` zamiast `self.opts.frame_ms` | renderer `battle_playback*` | **ZABITY** (`fq_speed_shot_lands_on_the_session_frame_grid`) |
| R5 | `playback.rs:996` gałąź `Boulder`: `PIN_FRAME_MS` zamiast `self.opts.frame_ms` | renderer `battle_playback*` | **ZABITY** (`fq_speed_boulder_lands_on_the_session_frame_grid`) |
| S3 | `siege_tactics_loop.rs:3533` `MarchNext::Shot`: `shot_done_timer = false` | engine lib `march_incremental_tests` (release) | **ZABITY** (`strzal_z_wejscia_marszu_jest_zegarem_z_nominalnym_due`) |
| E7 | `siege_tactics_loop.rs:3534` `MarchNext::Shot`: `fly` zamiast `RANGED_FLY_MS` | jw. | **ZABITY** (jw.) |

Razem z mutantami Operatora (12 zabitych) i Evaluatora (E1, E6, R6, R7 zabite) próg ≥ 12 spełniony.

## 4. Orzeczenia

| Zarzut | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|
| Z1 (Evaluator): `Shot`/`Boulder` w rendererze bez testu przy `frame_ms ≠ 16` | **ODDAL** (naprawione w obronie) | Nowe testy x16/x32 (Shot 512) i x8/x16 (Boulder 768) + odrzucenia 384/704 i 16 ms; FC: R4 i R5 ZABITE (§3). Arytmetyka zgodna z `pin_frame_time` (`ceil(nominal/frame)*frame`) i `t0 = 30720` na siatce 128/256/512 |
| Z2 (Evaluator): martwa gałąź `ranged` `at == 0`, S3/E7 nieodróżnialne | **ODDAL** (naprawione) | Gałąź usunięta (powrót do modelu sprzed tematu), uzasadnienie osiągalności sprawdzone w diffie (`march_incremental = true` w jedynym produkcyjnym konstruktorze); nowy test z szablonem strzału zabija S3 i E7 (FC odtworzył, §3); test sterownika `trafienie_strzalu_w_fazie_zegarow_wg_due` zielony |
| Z3 (Evaluator): teza „FQ-SPEED zamknięte x1..x16” vs świeże 1087@x4 | **ODDAL** (naprawione) | Obrona §3: ślady pierwszej rozbieżności 1087@x4, 1048/1075@x64 → kawaleria liczona atomowo w `start` = #402 (poza zakresem dispatchu); tabela skorygowana do „ZAMKNIĘTE poza #402”. FC nie odtwarzał śladów (generator na pinie) — przyjęte na podstawie zgodności mechanizmu z udokumentowanym `155`@x2 (r1 §4) |
| N1: kryterium dispatchu „@32 = 128/128” vs 127/128 (`155`, #402) | **ODDAL** | Dispatch sam w KONTEKŚCIE wskazuje `k_wzg_mix_d5_mury_155` jako pozostałość MARCH-INCREMENTAL, a #402 (MARCH-RESZTA) wyłącza z zakresu; rozbieżność ma ślad i klasę. Do potwierdzenia przez orkiestratora po integracji #402 |
| N2: klient przekazuje klatkę stałej `SIEGE_BATTLE_START_SPEED_MUL` (1x), nie z sesji; dług FQ-SPEED-BRIDGE bez numeru | **ODDAL** (dług jawny) | Dispatch pkt 3 dopuszcza dług zamiast komendy mostu; most nie ma komendy prędkości, więc w produkcji speedMul = 1 zawsze i klatka 16 ms jest prawdziwa. Numer zadania nadaje orkiestrator (§5) |
| N3 (czułość odkładania `BodyDone` ciosu), N4 (siatka przy nieregularnej delcie ściennej), N5 (zmiana prędkości w trakcie) | **ODDAL** (długi poza diffem / zależne od FQ-SPEED-BRIDGE) | Kod sprzed tematu (D-PIN3-3, D-HFQ-1); bez regresji w zakresie |
| S4 przeżywa (strzał po krokach atomowych `attack_pre > 0` w dawnym modelu) | **ODDAL** (dług jawny) | Ścieżka praktycznie nieosiągalna w sesji (strzelec z amunicją idzie `_rangedAction` krok po kroku); zachowanie sprzed tematu, opisane |
| Bramki pełne engine/renderer nieodtworzone przez obronę i FC | **ODDAL** (infrastruktura, nie wada pracy) | FC odtworzył wszystkie binarki dotknięte zmianą obrony + clippy; warunek dla integracji: pełna bramka trzech crate'ów przy ≥ 12 GB (§5) |

Brak orzeczeń NAPRAW; brak spraw DO DECYZJI CZŁOWIEKA (brak odstępstwa gameplay od webu — prędkość wg `_setSpeedIdx`).

## 5. Dla orkiestratora (integracja, rejestr)

1. Integracja ca786ff92 na `parity-v2` (FF możliwy: BAZA = obecny `origin/rust-port/parity-v2` ee1ceda3e); przed FF
   pełna bramka: engine `cargo test --release --all-targets --no-fail-fast`, renderer (gpu OFF) clippy/test `--all-targets`,
   client clippy/test — przy ≥ 12 GB wolnego.
2. Nadać numer długowi **FQ-SPEED-BRIDGE** (komenda mostu `SetSiegeBattleSpeed`, pole klatki w `SiegeBattlePayload`,
   `BattlePlayback::set_frame_ms`, zmiana prędkości w trakcie bitwy = N5).
3. #402 MARCH-RESZTA: dopisać przypadki `155`@x2, `156`@x32, `124`@x32 (c1 @512 ms), `111`@x256/x512, c1 `144`/`147`@x64,
   `143`/`147`/`176`/`211`@x128, świeże (seed 1000) `1087`@x4, `1048`/`1075`@x64.
4. Długi czułości: N3 (D-PIN3-3 cios), N4 (siatka renderera przy nieregularnej delcie ściennej, D-HFQ-1), S4.

## Długi

FQ-SPEED-BRIDGE (bez numeru), #402 (lista §5.3), N3, N4, N5, S4, PRE-SKIP-RAF #405 (oś tury 1 przewijania w śladach).
