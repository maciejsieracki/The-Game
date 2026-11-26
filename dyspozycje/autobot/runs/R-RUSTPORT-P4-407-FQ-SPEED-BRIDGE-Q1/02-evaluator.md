# R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1 — Evaluator (adwersarialny), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1
GOAL: komenda mostu `SetSiegeBattleSpeed { idx, clamp }` (= `_setSpeedIdx` pinu) z odpowiedzią `speedIdx`/`speedMul`, bez `StateChanged`; klient przelicza `frame_ms` playbacku (`16 × speedMul`) bez `GetRenderFrame`.
ZMIANY/COMMIT: oceniany kod Operatora `bd8aaa7d8` (kod `44bba295c` + `6259677fb`), gałąź `rust-port-wip/P4-407-FQ-SPEED-BRIDGE-Q1`; baza `43512a2c32587dfd8d9cf38e5db614581d0014ca` = `origin/rust-port/parity-v2` (sprawdzone `git rev-parse`; `merge-base --is-ancestor` OK). Evaluator nie zmienia kodu; jedyny nowy plik to ten raport (gałąź `rust-port-wip/P4-407-FQ-SPEED-BRIDGE-Q1-eval`).
TESTY: niżej, odtworzone samodzielnie, wszystkie EXIT 0.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (02a-obrona.md) wobec uwag U1–U6, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## 1. Bramki odtworzone (env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` w scratchpadzie, usuwany po każdej bramce)

| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets |
|---|---|---|---|
| engine | EXIT 0 | EXIT 0 | EXIT 0, **4352 passed / 0 failed / 1 ignored** (ignorowany `e2e::dump_tick1_econ_for_web_generator` — istniejący na bazie) |
| client | EXIT 0 | EXIT 0 | EXIT 0, **51 passed** (24 + 27) |
| renderer (gpu OFF) | EXIT 0 | EXIT 0 | EXIT 0, **757 passed / 0 failed** |

- Pełny test silnika w tle (`setsid nohup`, `EXIT=0` w logu), bez limitu czasu.
- Renderer: wolne 14 GB przed bramką, brak równoległych buildów cargo (`ps`). `renderer/Cargo.lock` przepisany przez build (dług T1-LOCK) — cofnięty `git checkout`, drzewo czyste.
- W silniku zielone: `predkosc_bitwy_wektory_pinu_bajt_w_bajt` (`speed_vectors.json`, `pinSha256` sprawdzany w teście), wszystkie testy `p4_407_fq_speed_bridge.rs` (8), `bridge_contract.rs`.

## 2. Allowlista, zakazy

- Zmienione pliki: `engine/src/bridge.rs`, `engine/src/domain/siege_battle_apply.rs`, `engine/src/domain/playable.rs`, `client/src/lib.rs`, `renderer/src/battle/playback.rs`, `engine/tests/bridge_contract.rs`, `engine/tests/p4_407_fq_speed_bridge.rs` (nowy, wzorzec `p4_*` dopuszczony w dispatchu), `client/tests/siege_battle_client.rs`, raporty runu. Wszystko w allowliście.
- `playable.rs` („tylko jeśli konieczne”): uzasadnienie przyjęte — pole `siege_battle` prywatne, `siege_battle()` daje `&`, wzorzec identyczny jak `step_siege_battle`/`skip_siege_battle` (15 linii).
- „Pliki spoza allowlisty” w raporcie Operatora: nowy test `p4_*` i kopia dispatchu w katalogu runu — przyjęte.
- `siege_battle_session.rs`, `siege_tactics_loop.rs`, `siege_tactics_clock.rs`, `gra/`: bez zmian (D-407-4 spełnione). `CONTRACT_VERSION` = 1 (asercja w `bridge_contract.rs`).
- Brak `#[ignore]` w diffie, brak usuniętych/osłabionych asercji (grep `^-.*assert` pusty). Commity bez nazwy modelu (tylko `Claude-Session:`).

## 3. Zgodność z pinem `07d2fbd72` (czytane `git show 07d2fbd72:gra/src/battle/battleScene.ts`)

- `_setSpeedIdx` `:9518-9527`: `clamp` → `max(0, min(n-1, idx))`, inaczej `((idx % n) + n) % n`; `speedMul = SPEED_STEPS[speedIdx]`. Rust: `speed_step_index` (`idx.clamp(0, n-1)` / `idx.rem_euclid(n)`) — równoważne dla całych liczb, także `-1 → 9`, `10 → 0`, `i64::MIN/MAX` z clamp.
- `_adjustSpeedIdx` `:9531-9533` = `speedIdx + delta` z clamp; `_cycleSpeed` `:9536` = `speedIdx + 1` bez clamp — klient liczy od `speedIdx` widoku, jak pin od `this.speedIdx`. Most nie dodaje reguł (D-407-1).
- „Safe to call mid-battle” — komenda przyjmowana w każdej fazie trwającej bitwy, także `Finished` przed `FinishSiegeBattle`; po `Finish`/`Abort` bitwy nie ma → `noActiveBattle` (pin: scena z przyciskami jest zamykana). Decyzja opisana i przetestowana.
- `speedMul` skaluje deltę ścienną i `FF_STEP_MS` (`:9419`, `:9512-9515`): w Rust `set_speed_idx` sesji ustawia `clock.speed_mul` i `body.frame_ms` — istniejąca metoda FQ-SPEED-Q1, nietknięta. Test `zmiana_w_trakcie_bitwy_od_nastepnego_kroku`: krok 16 ms po zmianie na 4x daje `vNow += 64`.
- D-407-2: prędkość w sesji (`DriverOp::Speed(usize)` w powtórce), nie w `EngineState`; `SaveGame` w bitwie dalej odrzucony.
- D-407-3: `is_siege_battle()` rozszerzone; `StateChanged` tylko dla `Finish` (bez zmian); klient po zmianie nie woła `GetRenderFrame` (licznik `frame_calls` w teście E2E).

## 4. Mutanty

Mutanty Operatora M1–M13 (raport 01) — przyjęte do wiadomości, nie powtarzane w całości. Własne mutanty Evaluatora (skrypt: patch → `cargo test --test …` → przywrócenie; drzewo czyste po serii, sprawdzone `git status`):

| # | Mutant | Wynik |
|---|---|---|
| E1 | `set_speed`: faza odpowiedzi zawsze `Running` | ZABITY (`bez_bitwy_i_po_koncu_no_active_battle`) |
| E2 | powtórka sesji odtwarza `Speed(idx)` jako `idx - 1` | ZABITY (2 testy powtórki) |
| E3 | `is_siege_battle()` bez `SetSiegeBattleSpeed` | ZABITY (6 testów, w tym kontrakt) |
| E4 | `speedIdx` odpowiedzi z żądania (`idx.clamp(0,9)`) zamiast z sesji | ZABITY (zawijanie 10→0, -1→9) |
| E5 | operacja Speed nie zapisywana w fazie `Finished` | PRZEŻYŁ — **równoważny**: po `Finished` prędkość nie wpływa na nic obserwowalnego (wynik, `Finish`); kolejna komenda prędkości zwraca nową wartość niezależnie od zapisu |
| E6 | `speedMul` odpowiedzi zepsuty dla idx 9 | ZABITY |
| C1 | klient bez strażnika `NoBattle` (woła silnik bez bitwy) | ZABITY (`fq_speed_bridge_bez_bitwy`, licznik wywołań) |
| C2 | klatka playbacku liczona PRZED przypisaniem nowego `speedMul` (zła kolejność) | ZABITY (3 testy) |
| C3 | klient nie aktualizuje `phase` z odpowiedzi | PRZEŻYŁ — **równoważny**: zmiana prędkości nigdy nie zmienia fazy (silnik zwraca fazę bieżącą) |
| C4 | klient wysyła `clamp: !clamp` | ZABITY |
| C5 | `speedIdx` widoku z żądania zamiast z odpowiedzi | ZABITY |
| C6 | playback dostaje stałą klatkę 16 ms | ZABITY (3 testy, playback odrzuca akcje) |

Łącznie z Operatorem: 13 + 10 zabitych, 2 jawnie równoważne. Kryterium 4 (≥ 8) spełnione.

## 5. Uwagi (nie blokują PASS; do Obrony / FC / rejestru)

- **U1 (parytet przejścia prędkości — NIE_ZMIERZONO).** Wektory pinu `speed_vectors.json` ustawiają prędkość PRZED `play()`; zmiana w TRAKCIE bitwy (teraz osiągalna produkcyjnie przez most) nie ma wektora pinu. Pomiar Evaluatora (test tymczasowy, usunięty): scenariusz `state(29)`, 30 kroków 1x, potem 64x — akcja `Move` wyemitowana przed zmianą (`t0=320`, `arrive_at=560`, siatka 16 ms) „przechodzi” przez chwilę zmiany `vNow=464`; pierwsza klatka po zmianie to `1488`. W pinie pętla `_raf` ruchu (`_doMove`) skończy się dopiero w klatce `1488`, więc DTO `arrive_at=560` i ewentualny dalszy łańcuch zegarów (`_schedule(STEP_GAP_MS)` od końca kroku) mogą różnić się od pinu o klatkę. To samo w 4x (zmiana w `384`). Akcje z `t0` po zmianie są na nowej siatce (415/415 przy 64x, 0 odchyleń), a playback nie odrzuca akcji przejściowych. Zmiana wymagałaby pliku pętli (`siege_tactics_loop.rs`) — poza zakresem (D-407-4). **Rekomendacja: osobny temat `FQ-SPEED-MIDCHANGE-VEC` — generator wektorów pinu z `_setSpeedIdx` w klatce N bitwy (kilka par prędkości), porównanie bajt w bajt z sesją przez `SetSiegeBattleSpeed`; wpis NIE_ZMIERZONO w REJESTR-RUST.**
- **U2 (liczby w dispatchu).** `speed_vectors.json` ma **288** wektorów (32 scenariusze × 9 prędkości 2..512), nie 351 jak w dispatchu i we wpisie rejestru FQ-SPEED; testy kandydatów „c1 128/128” nie zostały wskazane z nazwy ani przez Operatora, ani przez Evaluatora — pełny `cargo test` silnika zielony (0 failed), więc regresji brak niezależnie od nazwy. Orkiestrator: skorygować liczbę w rejestrze.
- **U3 (słaba asercja w nowym teście).** `client/tests/siege_battle_client.rs`, `fq_speed_bridge_zmiana_w_trakcie_cycle_i_panel`: drugie wywołanie `on_grid(&…[from..], v_change, 64.0);` ignoruje zwracaną liczbę sprawdzonych akcji (mogłoby być 0). Pierwsze (8x) ma `> 0`. Nie osłabia istniejących asercji; do poprawy przy okazji (`assert!(… > 0)`).
- **U4 (renderer bez własnego testu).** `BattlePlayback::set_frame_ms`/`opts()` nie mają testu w `renderer/tests/*` (dispatch to przewidywał); pokrycie wyłącznie przez E2E klienta (mutant M12 zabity tylko tam). Akceptowalne, bo crate klienta jest w bramce; zalecany test jednostkowy renderera w temacie #405/#409.
- **U5 (rozjazd po błędzie `SpeedAnswer`).** Gdy odpowiedź silnika jest przyjęta przez silnik, ale odrzucona przez klienta (brak/zły `speedMul`), silnik pracuje już w nowej prędkości, a klient zostaje przy starej klatce — kolejne akcje będą na innej siatce niż playback. To zachowanie „głośnej porażki” przy zepsutym transporcie, udokumentowane w doc-commencie; do uwzględnienia w #410 TAURI-GLUE (np. ponowna synchronizacja prędkości po błędzie).
- **U6 (kształt wire).** `idx: i64` odrzuca liczbę zmiennoprzecinkową JSON (`3.0`) — #411 TS-TYPES musi wysyłać liczby całkowite (`Math.trunc`). `clamp` pominięty = `false` (jak `_setSpeedIdx(idx)` bez opcji) — test kontraktu to pilnuje.
- Kryterium 2 „zgodnie z `speed_vectors.json`”: testy mostu sprawdzają regułę `frame_raf(16·k, nominał)` na scenariuszu mostu, nie scenariusze z pliku wektorów; reguła `frame_raf` jest walidowana bajt w bajt z pinem w `predkosc_bitwy_wektory_pinu_bajt_w_bajt`, więc łańcuch dowodowy jest zamknięty. Przyjęte.

## 6. Werdykt

PASS-WITH-NOTES: wszystkie kryteria końca 1–5 spełnione i odtworzone (bramki trzech crate'ów EXIT 0, kontrakt mostu, E2E silnik→most→klient→playback @1/@4/@64/@512, cycle 512→1, ± z przycięciem, `noActiveBattle` bez bitwy i po `Finish`/`Abort`, brak `GetRenderFrame`, mutanty). Uwaga U1 (parytet zmiany prędkości w trakcie bitwy) to NIE_ZMIERZONO poza zakresem tematu — wymaga osobnego tematu z wektorami pinu, nie blokuje integracji mostu.
