# R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1 — Operator r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1
GOAL: komenda mostu zmiany prędkości bitwy oblężniczej (`_setSpeedIdx` pinu) z odpowiedzią `speedIdx`/`speedMul`, bez `StateChanged`; klient przelicza `frame_ms` playbacku (`16 × speedMul`) bez `GetRenderFrame`.
ZMIANY/COMMIT: gałąź `rust-port-wip/P4-407-FQ-SPEED-BRIDGE-Q1`, baza `43512a2c32587dfd8d9cf38e5db614581d0014ca` (= `origin/rust-port/parity-v2` w chwili startu). Kod: `44bba295c` (WIP, cała implementacja + testy) + `6259677fb` (clippy w teście klienta). Raport: commit z tym plikiem (SHA w odpowiedzi Operatora do orkiestratora).
TESTY: niżej (wszystkie bramki EXIT 0).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (02-evaluator.md).
DEPLOY/PUSH: NIE WYKONANO (brak pushu, brak integracji).

## Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`)

- `SPEED_STEPS = [1,2,4,...,512]` (`:2551`), `speedIdx`/`speedMul` (`:2554-2555`).
- `_setSpeedIdx(idx, {clamp})` (`:9518-9527`): `clamp` → `max(0, min(9, idx))`, bez `clamp` → `((idx % n) + n) % n`; `speedMul = SPEED_STEPS[speedIdx]`.
- `_adjustSpeedIdx(delta)` = `_setSpeedIdx(speedIdx + delta, {clamp: true})` (`:9531-9533`); `_cycleSpeed()` = `_setSpeedIdx(speedIdx + 1)` (`:9536`, „Safe to call mid-battle”).
- Numery linii z dispatchu zweryfikowane (zgodne).

## Implementacja

| Plik | Zmiana |
|---|---|
| `engine/src/bridge.rs` | `EngineCommand::SetSiegeBattleSpeed { idx: i64, #[serde(default)] clamp: bool }` (wire `set_siege_battle_speed`); `is_siege_battle()` rozszerzone (D-407-3); obsługa w `siege_battle_on_game` i w `match` obu adapterów (prawdziwy i mock). Odpowiedź: `State` (stan bez zmian) + `siegeBattle`, bez zdarzeń (StateChanged tylko dla `Finish`, bez zmian). `CONTRACT_VERSION` = 1. |
| `engine/src/domain/siege_battle_apply.rs` | `SiegeBattlePayload` + addytywne `speed_idx: Option<u64>` / `speed_mul: Option<f64>` (`speedIdx`/`speedMul`, `skip_serializing_if`, więc JSON pozostałych odpowiedzi bez zmian); `DriverOp::Speed(usize)` (rozstrzygnięty indeks) odtwarzany w `rebuild` (D-407-2, D-WIRB-1); `pub fn set_speed(battle, idx, clamp)` → `SiegeBattleSession::set_speed_idx` (istniejąca metoda FQ-SPEED-Q1), odpowiedź bez akcji i ramki, faza z sesji. Kolejka `pending` i zegar nietknięte. |
| `engine/src/domain/playable.rs` | `PlayableGame::set_siege_battle_speed` (bez bitwy → `NoActiveBattle`). Konieczne: pole `siege_battle` jest prywatne, a `siege_battle()` daje tylko `&` (wzorzec `step_siege_battle`/`skip_siege_battle`). |
| `engine/src/domain/siege_battle_session.rs` | bez zmian (metody `set_speed_idx`/`speed_idx`/`speed_mul` już były). |
| `renderer/src/battle/playback.rs` | `BattlePlayback::opts()` (odczyt) i `set_frame_ms(f64)` (tylko dostęp do klatki; logika trafień `is_pin_event_time` bez zmian). |
| `client/src/lib.rs` | `SiegeBattleCommand::SetSpeed { idx, clamp }`; `SiegeBattleView::{speed_idx, speed_mul, frame_ms}` (start 0 / 1x); `RenderClient::set_siege_battle_speed(idx, clamp)` + aliasy `cycle_siege_battle_speed()` (idx+1, bez clamp) i `adjust_siege_battle_speed(delta)` (idx+delta, clamp) — D-407-1 „jedna komenda + aliasy w kliencie”; nowy błąd `SiegeClientError::SpeedAnswer` (odpowiedź bez prędkości albo `speedMul != SPEED_STEPS[speedIdx]`). Kolejność: bez bitwy → `NoBattle` bez wołania silnika; widok i `frame_ms` playbacku zmieniane DOPIERO po przyjętej odpowiedzi i z JEJ `speedMul`; brak `GetRenderFrame`, brak rekompozycji mapy. Komentarz przy `SIEGE_BATTLE_START_SPEED_MUL` zaktualizowany (dług FQ-SPEED-BRIDGE zamknięty). |

## Decyzje techniczne (w ramach D-407-1..4)

- D-407-1: jedna komenda `SetSiegeBattleSpeed { idx, clamp }` (pokrywa `_setSpeedIdx`), aliasy cycle/± w kliencie liczone od `speedIdx` widoku (jak pin liczy od `this.speedIdx`); most nie dodaje reguł (zawijanie/przycięcie robi `speed_step_index` sesji). `clamp` pominięte w JSON = `false` (jak `_setSpeedIdx(idx)` bez opcji).
- Faza: komenda działa w każdej fazie TRWAJĄCEJ bitwy, także `Finished` przed `FinishSiegeBattle` (przycisk paska sceny; wynik bez zmian — test `predkosc_w_fazie_finished_nie_zmienia_wyniku`). Po `Finish` i po `Abort` bitwy nie ma (`siege_battle = None`), więc jawny błąd `noActiveBattle` — pin: scena (z przyciskami prędkości) jest `dispose()`-owana po wyniku/wycofaniu.
- Powtórka sesji: zapisywany ROZSTRZYGNIĘTY indeks (`DriverOp::Speed(usize)`), odtwarzany z `clamp = true` (indeks w zakresie, więc niezmieniony) — powtórka nie zależy od reguły zawijania.
- Obserwacja (bez zmiany kodu): akcje wyemitowane przy starej prędkości i dostarczone po zmianie nie zostały odrzucone przez playback w żadnym teście (zmiana w trakcie bitwy, `cycle`/± wielokrotnie, cała bitwa do `Finish`); playback waliduje akcję w chwili zastosowania, a wszystkie akcje z `t0 <= vNow` są stosowane przed odpowiedzią na zmianę prędkości.

## TESTY (EXIT 0; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramce)

- engine: `cargo fmt --check` OK; `cargo clippy --all-targets -- -D warnings` OK; `cargo test --all-targets --no-fail-fast` — **4352 passed, 0 failed, 1 ignored** (baza 4344 + 8 nowych; ignorowany `e2e::dump_tick1_econ_for_web_generator` — istniejący). W tym `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (`speed_vectors.json`, lista rozbieżności pusta) i `predkosc_sesji_jak_set_speed_idx_pinu` zielone — kryterium 5 bez regresji (pliki pętli/zegara nietknięte, D-407-4).
- client: fmt OK; clippy `-D warnings` OK; `cargo test --all-targets` — **51 passed** (engine_bridge_renderer 24, siege_battle_client 27 = 23 + 4 nowe), 0 failed.
- renderer (gpu OFF): fmt OK; clippy `-D warnings` OK; `cargo test --all-targets` — **757 passed**, 0 failed (bez nowych testów renderera: `set_frame_ms` sprawdzany E2E w kliencie i mutantem M12). `renderer/Cargo.lock` przepisany przez build (dług T1-LOCK) — cofnięty przed commitem. Wolne miejsce przed bramką renderera: 14 GB, bez równoległych buildów.
- Brak procesów cargo w tle po rundzie (sprawdzone `ps`).

### Nowe testy

- `engine/tests/p4_407_fq_speed_bridge.rs` (8): `predkosc_przez_most_jak_set_speed_idx_pinu` (0→3 = 8x, zawinięcie 9→10 = 1x i -1 = 512x, przycięcie na obu krańcach, i64::MIN/MAX, JSON `speedIdx`/`speedMul`, brak StateChanged, stan bez zmian, inne odpowiedzi bez kluczy); `bez_bitwy_i_po_koncu_no_active_battle` (bez bitwy / po Abort / po Finish = `no_active_battle`, w `Finished` dozwolone); `predkosc_w_fazie_finished_nie_zmienia_wyniku`; `akcje_na_siatce_klatki_po_zmianie_predkosci_i_powtorka` (1x, 4x, 16x, 64x, 512x: każda akcja Melee/Shot/TowerShot/Move/Boulder w `t0 + frame_raf(16·k, nominał)` jak `speed_vectors.json`; 4x i 64x także z odtwarzaniem sesji z zapisu operacji — te same akcje i stan po Finish); `zmiana_w_trakcie_bitwy_od_nastepnego_kroku` (po 20 krokach 1x: następny krok `vNow += 64`, akcje po zmianie na siatce 64 ms, powtórka identyczna); `predkosc_przez_mock_adapter`; `predkosc_nie_w_zapisie` (SaveGame w bitwie nadal odrzucony).
- `engine/tests/bridge_contract.rs`: 19. wariant w `COMMAND_KINDS`/`command_index`/`every_command`, kształt wire (z `clamp` i bez), `is_siege_battle`, `CONTRACT_VERSION == 1`, brak bitwy = `no_active_battle`.
- `client/tests/siege_battle_client.rs` (4): `fq_speed_bridge_e2e_klatka_playbacku_po_zmianie` (silnik→most→klient→playback: @4, @64, @1, @512 — `frame_ms` = `16·k`, każda akcja przyjęta przez playback do Finish, akcje na siatce, licznik `GetRenderFrame` bez zmian po zmianie prędkości i w bitwie, +1 po Finish); `fq_speed_bridge_zmiana_w_trakcie_cycle_i_panel` (zmiana w trakcie, ± z przycięciem, cycle 512→1→2, zmiana na ekranie końca); `fq_speed_bridge_bez_bitwy`; `fq_speed_bridge_klatka_tylko_z_przyjetej_odpowiedzi` (odpowiedź bez prędkości / ze złym `speedMul` → `SpeedAnswer`, prędkość i klatka bez zmian; tryb bez sceny).

### Mutanty (13/13 zabite; skrypt `mut.py` w scratchpadzie, każdy: patch → test → przywrócenie; drzewo czyste po serii)

| # | Mutant | Wynik |
|---|---|---|
| M1 | pominięcie clamp (`set_speed_idx(idx, false)`) | ZABITY (`predkosc_przez_most...`) |
| M2 | brak zawinięcia (zawsze clamp) | ZABITY (2 testy) |
| M3 | powtórka sesji bez operacji Speed | ZABITY (`akcje_na_siatce..._powtorka`, `zmiana_w_trakcie...`) |
| M4 | zły `speedMul` w odpowiedzi (`×2`) | ZABITY (4 testy) |
| M5 | `StateChanged` po zmianie prędkości | ZABITY (3 testy) |
| M6 | komenda ignorowana (sesja bez zmiany prędkości) | ZABITY (4 testy) |
| M7 | klient nie przelicza `frame_ms` playbacku | ZABITY (3 testy, w tym E2E — playback odrzuca akcje) |
| M8 | klient ustawia `frame_ms` z żądanego idx PRZED odpowiedzią silnika (zła kolejność) | ZABITY (`klatka_tylko_z_przyjetej_odpowiedzi`) |
| M9 | klient woła `GetRenderFrame` po zmianie | ZABITY (2 testy) |
| M10 | cycle z clamp (bez zawinięcia 512→1) | ZABITY |
| M11 | panel ± bez clamp | ZABITY |
| M12 | `BattlePlayback::set_frame_ms` bez skutku | ZABITY (3 testy) |
| M13 | klient nie waliduje `speedMul == SPEED_STEPS[speedIdx]` | ZABITY |

„Ignorowanie komendy poza fazą” z dispatchu: komenda jest dozwolona w KAŻDEJ fazie trwającej bitwy (pin), więc mutant „ignoruj w fazie X” równoważy się z M6 dla tej fazy; odrzucenie poza bitwą (Abort/Finish/brak) pilnuje `bez_bitwy_i_po_koncu_no_active_battle`.

## Pliki poza allowlistą

- `engine/tests/p4_407_fq_speed_bridge.rs` — nowy plik testów sesji bitwy w silniku (dispatch: „testy sesji bitwy w silniku (`p4_*`/`p6_k5loop_*` — sprawdź nazwy)”), nazwa `p4_*`.
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1/00-dispatch.md` — kopia dispatchu z `origin/claude/rust-sivvrn` (c5b825226), żeby katalog runu na gałęzi roboczej był kompletny.
- Brak zmian w `gra/`, `siege_tactics_loop.rs`, `siege_tactics_clock.rs`, `siege_battle_session.rs`.

## Uwagi dla Evaluatora

- Wektory pinu 351 vs 288: plik `speed_vectors.json` na bazie ma 288 wektorów (32 scenariusze × 9 prędkości 2..512); dispatch podaje „351” — prawdopodobnie łącznie z innym zbiorem; test na bazie i po zmianie zielony bez listy rozbieżności. Wektory „c1 128/128 @1/@16” nie zostały zlokalizowane po nazwie; cały `cargo test` silnika jest zielony (0 failed), więc regresji brak niezależnie od nazwy.
- `#409 CLIENT-API-GAPS` może startować po integracji tego tematu (zmiana `client/src/lib.rs`).
