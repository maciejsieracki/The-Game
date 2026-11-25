# R-RUSTPORT-P4-FQ-SPEED-Q1 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-FQ-SPEED-Q1 (prędkość bitwy speedMul ≠ 1: zgodność z pinem i klatka renderera z PlaybackOpts)
GOAL: zmierzona zgodność sesji z pinem przy klatkach 1..1024 ms (speedMul 1..64; dodatkowo 128/256/512), @1 i @16
      bez regresji (128/128, 45/45), naprawy wg pinu, renderer z siatką PlaybackOpts.frame_ms, klient przekazuje klatkę,
      mutanty >= 12, tabela zamknięte / dług
BAZA: origin/rust-port/parity-v2 = ee1ceda3ebed21f90ec207f9e541e792738f7abc (linia BAZA dispatchu)
GAŁĄŹ: rust-port-wip/R-RUSTPORT-P4-FQ-SPEED-Q1 (lokalna, worktree wf_295288fd-306-1)
ZMIANY/COMMIT: §7, §11
TESTY: §8
BLOKADY: brak; komenda mostu prędkości = dług FQ-SPEED-BRIDGE (§6, poza allowlistą)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`)

| Miejsce pinu | Treść | Wniosek |
|---|---|---|
| `:2551-2555` | `SPEED_STEPS = [1,2,4,8,16,32,64,128,256,512]`, `BATTLE_FRAME_WALL_MS = 16`, `BATTLE_FRAME_MAX_WALL_DELTA_MS = 100`, `speedIdx = 0`, `speedMul = 1` | start bitwy zawsze 1x |
| `:3370` | `this._setSpeedIdx(this.speedIdx)` przy budowie sceny | prędkość nie przechodzi między bitwami |
| `:9512-9515` `_scaledWallDelta` | `clamp(wallDelta, 0, 100) * speedMul` | clamp dotyczy delty ŚCIENNEJ przed mnożeniem — **brak sufitu efektywnej klatki**: przewijanie `FF_STEP_MS = 16 * speedMul` (`:9419`) rośnie do 8192 ms przy 512x; czas rzeczywisty `vNow += 16 * speedMul` na klatkę 16 ms |
| `:9518-9527` `_setSpeedIdx(idx, {clamp})` | `clamp` → `0..9`, inaczej `((idx % n) + n) % n` | |
| `:9536` `_cycleSpeed` / `:10875` (klawisz) | `idx + 1` z zawinięciem | **każdy z 10 kroków osiągalny** (cykl zawija 512 → 1) |
| `:9531-9533` `_adjustSpeedIdx` + panel ± `:11808-11809` | `idx ± 1` z `clamp` | dochodzi do 512, bez zawijania |
| `:9595-9634` `_schedule` / `_drainTimers` | `due = vNow + ms`, odpalanie `due <= vNow` klatki, kolejność `due`, potem `id` | komentarz `:2545-2550` o „kursorze” jest nieaktualny: `_now()` w drenowaniu = `vNow` klatki |
| `:9227` `_doRangedAttack` | trafienie strzału = `_schedule(RANGED_FLY_MS)` z chwili wystrzału | ZWYKŁY zegar fazy `_drainTimers` (nie `_raf`) — podstawa D-FQS-1 |
| `:11047-11136` | dźwięki przy `speedMul >= 16` (`Math.random`) | bez wpływu na wynik (atrapa, `otherRandom`) |

Zmiana prędkości w trakcie bitwy jest dozwolona (`:9535` „Safe to call mid-battle”).

## 2. Pomiar — metoda

- Generator (`engine/tests/p6_k5loop_wiring_a_gen.mjs`, dopiski bez zmiany wektorów): pole scenariusza `speedMul` =
  wywołanie METODY PINU `bs._setSpeedIdx(idx)` przed `play()` (model przycisku), `speedAt = {round, speedMul}` = zmiana
  w trakcie bitwy czasu rzeczywistego między klatkami rAF; env `WIRING_A_SWEEP_FRAME=<ms>` (kandydaci `WIRING_A_EXTRA`
  albo wbudowane `SCENARIOS`, wynik tylko do `WIRING_A_OUT`): `ms >= 16` → `speedMul = ms/16`, `ms < 16` → krok
  przewijania `ffStepMs` (granica klatki; czas rzeczywisty pominięty, bo `speedMul < 1` nie istnieje).
  `WIRING_A_SPEED_VECTORS=32,...,8192` → `speed_vectors.json` (zwięzłe: nazwa, tryb, `speedMul`, `expect`).
- Rust: `kandydaci_z_pliku_na_zadanie` czyta `speedMul`/`speedAt` (`drive_speed` → `SiegeBattleSession::set_speed_idx`);
  ślad `slad_diagnostyczny_na_zadanie` + nowy tryb `WIRING_A_TRACE_MODE=skip`.
- Kandydaci c1 = `01-operator-r1-kandydaci-c1.py` (PIN2-PROBE, 128 scenariuszy, ziarno 101..228), wektory = 45
  scenariuszy `vectors.json` (przy sweepie bliźniaki `_klatkaN` liczone przy klatce sweepu).

## 3. Tabela zgodności (binarka `p6_k5loop_wiring_a_pin` release)

| Klatka (ms) | speedMul | c1 przed (baza ee1ceda3e) | c1 po | wektory przed | wektory po | Rozbieżne po (dług) |
|---|---|---|---|---|---|---|
| 1 | — (krok FF) | 128/128 (PIN3/MI) | **128/128** | 43/43* | **43/43*** | — |
| 2 | — | NIE_ZMIERZONO | **128/128** | — | **43/43*** | — |
| 4 | — | 128/128 (FQ) | **128/128** | — | **43/43*** | — |
| 8 | — | NIE_ZMIERZONO | **128/128** | — | **43/43*** | — |
| 16 | 1 | 128/128 | **128/128** | 45/45 | **45/45** | — |
| 32 | 2 | 127/128 | 127/128 | 44/45 | 44/45 | `155` — #402 (kawaleria) |
| 64 | 4 | **117/128** | **128/128** | 44/45 | **45/45** | — |
| 128 | 8 | 120/128 | **128/128** | 45/45 | **45/45** | — |
| 256 | 16 | 122/128 | **128/128** | 44/45 | **45/45** | — |
| 512 | 32 | 70/128 | **126/128** | 24/45 | **44/45** | `124`, `156` — #402 (ucieczka, tag `ucieczka-konflikt-zegara`) |
| 1024 | 64 | NIE_ZMIERZONO | 126/128 | NIE_ZMIERZONO | **45/45** | `144`, `147` — #402 (kawaleria, ślady §4) |
| 2048 | 128 | — | 124/128 | — | (speed_vectors) | `143`, `147`, `176`, `211` — wszystkie „jazda”; klasa #402 przez analogię, ślad tylko `147`@1024 |
| 4096 / 8192 | 256 / 512 | — | NIE_ZMIERZONO (c1) | — | speed_vectors: `111` rozbieżny | `111` — #402 (kawaleria, ślad §4) |

\* przy `ms < 16` 2 wektory czasu rzeczywistego pominięte (`speedMul < 1` nie istnieje w pinie).

Zmiana prędkości W TRAKCIE bitwy (`speedAt`, czas rzeczywisty, 8 kandydatów c1 co 16., zmiany ×2..×64 w turach 2–10):
**8/8 zgodnych** (Rust `set_speed_idx` między klatkami, w tej samej klatce co pin — asercja `speedAtApplied`).

`speed_vectors.json` (zamrożone w teście): 39 scenariuszy × 9 prędkości (×2..×512) = 351 bitew; 347 bajt w bajt,
4 na jawnej liście `ROZBIEZNE_FQ_SPEED_402` (§4).

## 4. Rozbieżności — klasyfikacja (ślady pierwszego rozjazdu pin ↔ Rust)

| Przypadek | Pierwsze rozjechane zdarzenie | Przyczyna | Dług |
|---|---|---|---|
| `155` @32 (c1 i `fq_wzg_mix_d5_mury_155`) | r56 t 283936: pin krok kawalerii a3 41,88→41,89, Rust 41,88→41,87; a2 rozbity wieżą w t 283872 (w trakcie marszu a3) | `_cavalryAction` liczony atomowo w `start` (CAVT co klatkę pinu) | #402 MARCH-INCREMENTAL-RESZTA |
| `144` @1024 | t 1254400: rozbicie a2 w trakcie marszu kawalerii a0 → pin 39,72→39,71, Rust 39,72→39,73 | jw. | #402 |
| `147` @1024 (także @2048) | t 1232896: rozbicie a4 (39,77) w trakcie marszu kawalerii a1 → pin wchodzi na 39,77, Rust 39,79 | jw. | #402 |
| `111` ×256/×512 (`speed_vectors`) | t 4911104: rozbicie a3 w t 4907008 w trakcie marszu kawalerii a0 → pin 39,72→39,73, Rust 39,71 | jw. | #402 |
| `124`, `156` @512 | tag `ucieczka-konflikt-zegara` (sesja zgłasza jawnie) | `_fleeStep` liczony w `start`, zegar wieży zmienia jednostki w oknie ucieczki | #402 |
| `143`, `176`, `211` @2048 | NIE_ZMIERZONO śladem | scenariusze „jazda” (jak 147) — przypisanie do #402 przez analogię | #402 (do potwierdzenia przy #402) |
| dawne @64/@128/@256 (11 + 8 + 6 c1, 215, 104, 132_klatka4, …) | t 233216 (215@64): strzał d2 i trafienie wieży z tym samym `due` — pin strzał pierwszy (mniejsze `id`), Rust skutek strzału w fazie `_raf` | **D-PIN3-3-SHOT-ID** | **ZAMKNIĘTE (D-FQS-1)** |

Wszystkie pozostałe rozbieżności to ruch wielokrokowy nadal atomowy (#402) — przy dużej klatce w jednej klatce pinu
mieści się więcej zdarzeń zegara, więc okno „rozbicie w trakcie marszu” trafia częściej. Przy ×1 (produkcja) 0.

## 5. Rozwiązanie

- **D-FQS-1 (silnik, zamyka D-PIN3-3-SHOT-ID)** — trafienie STRZAŁU jednostki to w pinie zwykły zegar
  `_schedule(RANGED_FLY_MS)` z chwili wystrzału (`:9227`), odpalany w `_drainTimers` w kolejności `due`/`id`. Dotąd sesja
  odkładała każdy `BodyDone` do fazy `_raf` (D-PIN3-3) i planowała go z czasem skwantyzowanym. Teraz:
  `LoopBody::done_is_timer(unit)` (domyślnie `false`), `ProdBody::shot_done_timer` ustawiane, gdy strzał pada w chwili
  wywołania ciała (start aktywacji bez kroków: `attack_tail` z `attack_pre == 0`, gałąź `ranged` z `at == 0`, wejście
  marszu `MarchNext::Shot`), z czasem do trafienia **nominalnym** `RANGED_FLY_MS` (klatkę odpalenia wyznacza zegar);
  `SiegeLoop::defer_to_raf` nie odkłada takiego `BodyDone`. Cios wręcz i koniec kroku (pętle `_raf`) bez zmian; strzał
  po krokach atomowych (`attack_pre > 0`) bez zmian (dawny model, #402). Czyszczenie flagi w `start`/`complete`.
  Wynik: @64/@128/@256 128/128, @512 126/128; @1/@4/@16 bez zmian (128/128, 45/45).
- **Sesja (produkcyjne API prędkości)** — `SiegeBattleSession::set_speed_idx(idx, clamp)` (= `_setSpeedIdx`),
  `cycle_speed()` (= `_cycleSpeed`), `adjust_speed_idx(delta)` (= `_adjustSpeedIdx`), `speed_idx()`, `speed_mul()`,
  `frame_ms()` (= `FF_STEP_MS = 16 * speedMul`); przelicza klatkę ciała (D-FQ-1) jak `diag_set_speed_mul`.
  `siege_tactics_clock::SPEED_STEPS` + `speed_step_index`.
- **Renderer** — `PlaybackOpts::frame_ms` (domyślnie `PIN_FRAME_MS = 16`; `Eq`/derive `Default` zastąpione ręcznym
  `Default`), `is_pin_event_time(frame, t0, nominal, at)`; `Melee`/`Shot`/`TowerShot`/`Boulder` sprawdzane siatką
  `PlaybackOpts::frame_ms`; **`Move.arriveAt` też na siatce klatki** (pin `_doMove` kończy w pierwszej klatce `p >= 1`:
  przy ×2..×16 `t0 + 256`, nie 240 — bez tego renderer odrzucał każdy krok przy prędkości > 1; przy 16 ms 240 leży na
  siatce, więc zachowanie ×1 bez zmian). `Ram.until` zostaje nominalny (`_animateRam` to wizualny `requestAnimationFrame`,
  silnik emituje 320).
- **Klient** — `SIEGE_BATTLE_START_SPEED_MUL = SPEED_STEPS[0]`, `siege_battle_frame_ms(speed_mul)` (zegar silnika
  `VirtualClock::scaled_wall_delta(BATTLE_FRAME_WALL_MS)`), `playback_opts_of(start, speed_mul)`; `scene_of` buduje
  playback z klatką sesji (start = 1x, pin `:3370`).

## 6. Komenda mostu prędkości — dług FQ-SPEED-BRIDGE (z uzasadnieniem)

Pin ma gracza-sterowaną prędkość (`_setSpeedIdx`), więc komenda jest potrzebna, ale **nie da się jej dodać w
allowliście**: bitwa żyje w `PlayableGame.siege_battle` (`playable.rs`, tylko odczyt `siege_battle()`), a sesja jest
odtwarzana z listy operacji `ActiveSiegeBattle.ops: Vec<DriverOp>` (`siege_battle_apply.rs`: klon/zapis = powtórka ops).
Komenda `SetSiegeBattleSpeed { speed_idx }` wymaga: wariantu `DriverOp::Speed` (powtórka), metody `PlayableGame`,
pola `frameMs` (albo `speedMul`) w `SiegeBattlePayload` dla klienta oraz `BattlePlayback::set_frame_ms` dla zmiany w
trakcie (renderer: akcje sprzed zmiany mają starą siatkę). Pliki `playable.rs`, `siege_battle_apply.rs`, `view-model`
są poza allowlistą — **nie rozszerzałem zakresu**. Gotowe w tym temacie: API sesji (§5), zgodność zmiany w trakcie
bitwy z pinem (`speedAt` 8/8), klatka renderera z opcji. `bridge.rs` i `CONTRACT_VERSION` bez zmian.

## 7. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_tactics_clock.rs` | `SPEED_STEPS`, `speed_step_index` |
| `engine/src/domain/siege_battle_session.rs` | pole `speed_idx`; `set_speed_idx`, `cycle_speed`, `adjust_speed_idx`, `speed_idx`, `speed_mul`, `frame_ms` |
| `engine/src/domain/siege_tactics_loop.rs` | D-FQS-1: `LoopBody::done_is_timer`, `defer_to_raf`, `ProdBody::shot_done_timer` (3 miejsca strzału, czyszczenie) |
| `engine/tests/p6_k5loop_wiring_a_gen.mjs` | `speedMul` (`_setSpeedIdx`), `speedAt`, `WIRING_A_SWEEP_FRAME`, `WIRING_A_SPEED_VECTORS` (tekst pinu i strażnik SHA bez zmian) |
| `engine/tests/p6_k5loop_wiring_a_pin_vectors/speed_vectors.json` | NOWY (MD5 `d764f078f08aa5df274e3f74d09df14b`); `vectors.json` / `pin_data.json` bez zmian |
| `engine/tests/p6_k5loop_wiring_a_pin.rs` | `drive_speed`, `speed_idx_of`; testy `predkosc_sesji_jak_set_speed_idx_pinu`, `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (+ kontrakt czasu akcji przy prędkości), `ROZBIEZNE_FQ_SPEED_402`; ślad `WIRING_A_TRACE_MODE=skip` |
| `engine/tests/p4_fq_speed.rs` | NOWY: `SPEED_STEPS`, zawinięcie/przycięcie, klatka bez sufitu, czas rzeczywisty = siatka przewijania |
| `renderer/src/battle/playback.rs` | `PlaybackOpts::frame_ms`, `is_pin_event_time(frame, …)`, `Move` na siatce klatki, dokumentacja |
| `renderer/tests/battle_playback.rs` | nowa sygnatura; testy `fq_speed_event_time_follows_the_session_frame`, `fq_speed_melee_scene_at_speed_1_4_16`, `fq_speed_tower_shot_at_speed_16` |
| `client/src/lib.rs` | `SIEGE_BATTLE_START_SPEED_MUL`, `siege_battle_frame_ms`, `playback_opts_of`, `scene_of` |
| `client/tests/siege_battle_client.rs` | `fq_speed_klatka_playbacku_z_predkosci_sesji` (sesja ×1/×4/×16 → playback z opcjami klienta; z 16 ms przy ×4/×16 odrzucone) |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-FQ-SPEED-Q1/` | raport, `01-operator-r1-mutanty.py` |

Nie ruszano: `bridge.rs`, `bridge_contract.rs`, `siege_tactics_fastforward.rs`, `gra/`, `src-tauri`, `view-model`,
`Cargo.lock`, rejestru (wpisy §10 do przeniesienia przez orkiestratora). Brak `#[ignore]`.

## 8. Testy / bramki

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` = scratchpad
`fqspeed/tgt` (usuwany po bramkach).

| Bramka | Wynik |
|---|---|
| engine / client / renderer `cargo fmt --all -- --check` | EXIT 0 / 0 / 0 |
| engine `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| client `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| client `cargo test --all-targets --no-fail-fast` | EXIT 0 (41 = 18 + 23; było 40) |
| engine `p6_k5loop_wiring_a_pin` (release) | 13/13 ok (45 wektorów bajt w bajt, 351 bitew prędkości) |
| engine pełny `cargo test --release --all-targets --no-fail-fast` | §8a |
| renderer (gpu OFF) clippy + test | §8a |
| generator: pełna regeneracja `vectors.json` | §8a |

### 8a. Bramki długie

(uzupełnione niżej po zakończeniu)

## 9. Mutanty (`01-operator-r1-mutanty.py`)

(uzupełnione niżej po przebiegu)

## 10. Decyzje techniczne (do `REJESTR-RUST.md`, wpis orkiestratora)

- **D-FQS-1** — §5 (trafienie strzału w chwili wywołania = zwykły zegar `_drainTimers`, nominalny `due`; zamyka
  D-PIN3-3-SHOT-ID).
- **D-FQS-2** — `Move.arriveAt` w rendererze na siatce `PlaybackOpts::frame_ms` (pin `_doMove` `:8746-8775`); `Ram` nominalnie.
- **D-FQS-3** — prędkość z produkcyjnego API sesji (`set_speed_idx` = `_setSpeedIdx`), start zawsze 1x (`:3370`);
  klient buduje playback z `siege_battle_frame_ms(SIEGE_BATTLE_START_SPEED_MUL)`.
- **D-FQS-4** — komenda mostu = dług FQ-SPEED-BRIDGE (§6).

## 11. Zamknięte / zostaje długiem

| Pozycja | Stan |
|---|---|
| FQ-SPEED (zgodność przy speedMul ≠ 1) | **ZAMKNIĘTE dla ×1..×16** (c1 128/128, wektory 45/45 poza 155@×2), ×32/×64 126/128; reszta = #402 |
| D-PIN3-3-SHOT-ID | **ZAMKNIĘTE** (D-FQS-1) |
| N3 (HITAT: `PIN_FRAME_MS=16` stałe w rendererze) | **ZAMKNIĘTE** — siatka z `PlaybackOpts::frame_ms` (także `Move`) |
| E-4 (LANDAT-TOWER-BOULDER: siatka wieży/kamienia przy innej klatce) | **ZAMKNIĘTE** — `TowerShot`/`Boulder` na siatce `frame_ms`; kontrakt czasu akcji silnika przy ×2..×512 w `predkosc_bitwy_wektory_pinu_bajt_w_bajt` |
| Zmiana prędkości w trakcie bitwy | silnik zgodny z pinem 8/8 (`speedAt`); renderer/klient: dług FQ-SPEED-BRIDGE |
| FQ-SPEED-BRIDGE (komenda mostu, pole klatki w odpowiedzi, `set_frame_ms` playbacku) | **DŁUG** (§6, poza allowlistą) |
| MARCH-INCREMENTAL-RESZTA (#402) | **DŁUG** — wszystkie pozostałe rozbieżności (§4); nowe przypadki do testu: 155×2, 156×32, 111×256/×512, c1 144/147@1024, 143/147/176/211@2048 |
| PRE-SKIP-RAF (#405) | bez zmian: oś tury 1 w przewijaniu pinu przesunięta o porcję FF generatora (992 ms @32, 2240 ms @64), wynik bez wpływu |
| c1 przy 4096/8192 | NIE_ZMIERZONO (tylko wektory `speed_vectors`) |
