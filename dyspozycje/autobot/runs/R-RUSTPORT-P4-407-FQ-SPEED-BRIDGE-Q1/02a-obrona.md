# R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1 — Obrona Operatora, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1
GOAL: komenda mostu `SetSiegeBattleSpeed { idx, clamp }` (= `_setSpeedIdx` pinu) z odpowiedzią `speedIdx`/`speedMul`, bez `StateChanged`; klient przelicza `frame_ms` playbacku (`16 × speedMul`) bez `GetRenderFrame`.
ZMIANY/COMMIT: gałąź `rust-port-wip/P4-407-FQ-SPEED-BRIDGE-Q1-obrona` od raportu Evaluatora `2496a014d` (kod Operatora `bd8aaa7d8`, baza `43512a2c32587dfd8d9cf38e5db614581d0014ca` = `origin/rust-port/parity-v2`). Zmiany obrony: `rust-port/client/tests/siege_battle_client.rs` (U3), `rust-port/renderer/tests/battle_playback_move_shot.rs` (U4), ten raport, skrypt kandydatów pomiaru U1 `02a-obrona-u1-kandydaci.py`. Kod produkcyjny (engine/client/renderer `src/`) BEZ ZMIAN (`git diff bd8aaa7d8 HEAD -- rust-port/engine` pusty, podobnie `client/src`, `renderer/src`).
TESTY: niżej; wszystkie EXIT 0.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (03-final-control.md); orkiestrator: wpisy w REJESTR-RUST (U1, U2, U5, U6 — niżej).
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

### U1 — parytet zmiany prędkości W TRAKCIE bitwy (NIE_ZMIERZONO) — PRZYJMUJĘ (pomiar wykonany; zalecenie osobnego tematu podtrzymane tylko dla wektorów zamrożonych)

Zamiast pozostawiać NIE_ZMIERZONO, zmierzyłem logikę bitwy przy zmianie prędkości w trakcie walki, tą samą drogą co FQ-SPEED-Q1 (`speedAt`), na bieżącym kodzie (HEAD = kod Operatora, silnik nietknięty przez obronę):

- Generator pinu `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (wykonuje CAŁY tekst pinu `07d2fbd72`, strażnik SHA-256) z `WIRING_A_EXTRA`: w pętli rAF pinu `bs._setSpeedIdx(idx)` między klatkami w pierwszej klatce z `roundNo >= round` (model kliknięcia gracza, `battleScene.ts:9518-9527`, „Safe to call mid-battle” `:9535`).
- Rust: `kandydaci_z_pliku_na_zadanie` (`p6_k5loop_wiring_a_pin.rs`, release) → `drive_speed` → `SiegeBattleSession::set_speed_idx` między krokami 16 ms — dokładnie ta metoda, którą woła nowa komenda mostu (`siege_battle_apply.rs`, `set_speed`); test sprawdza też, że zmiana weszła w tej samej chwili co w pinie (`speedAtApplied`).
- Kandydaci: `02a-obrona-u1-kandydaci.py` na c1 (PIN2-PROBE, ziarno 101..228, co 4. scenariusz, wszystkie z murami — ten wymiar produktu c1 wypada przy kroku 4), tryb czasu rzeczywistego, 32 scenariusze, pary prędkości (start → zmiana): **1→4, 1→64 (przypadki z zarzutu), 64→1 (w dół), 4→512, 1→2, 8→32**, zmiana w turach 2..13. Pliki (scratchpad, nie w repo): `u1.json` MD5 `6e6c7a8f5f9bb93e398325ca1ed0dfba`, wynik pinu `u1_pin.json` MD5 `3027fea8c16c700c30042809b4445944` (32/32 `speedAtApplied = true`).

| Pomiar | Wynik |
|---|---|
| Rust (HEAD) vs pin, 32 bitwy ze zmianą prędkości w trakcie | **32/32 ZGODNY** (zwycięzca, tura, rzuty RNG, HP/śmierć/rozbicie każdej jednostki) |
| Kontrola czułości: mutant „zmiana w trakcie pominięta” (w `drive_speed` bez `set_speed_idx`, test przywrócony `git checkout`) | 5/32 zgodnych → **27 rozbieżnych**: pomiar rozróżnia brak zmiany |

Wniosek dla scenariusza z zarzutu (ruch w locie, `t0=320`, `arrive_at=560`, zmiana w `vNow=464`, następna klatka `1488`):
- Logika: koniec kroku w Rust to zegar `StepEnd` z opóźnieniem `frame_raf(frame, MOVE_STEP_MS)` liczonym od startu kroku, ale ODPALANY przez sterownik w pierwszej klatce z `vNow >= due` (`siege_tactics_loop.rs` `march_advance`, „klatkę wyznacza zegar sterownika”). Po zmianie siatki pierwsza taka klatka to `1488` — ta sama, w której pętla `_raf` pinu widzi `p >= 1`, więc łańcuch `_schedule(STEP_GAP_MS)` startuje z tej samej chwili. Pomiar 32/32 (w tym 8 przypadków 1→64 i 1→4) potwierdza to bajt w bajt na wyniku.
- DTO: `arrive_at=560` jednej akcji „w locie” jest podpowiedzią czasu animacji wystawioną przed zmianą. W każdej chwili klatki (464 i 1488) pozycja z playbacku i z pinu jest ta sama (w 464: `p = 0,6` po obu stronach; w 1488: cel osiągnięty po obu stronach). Playback akcję przyjmuje (sprawdzone przez Evaluatora). Różnica jest tylko w czasie niewidocznym (między klatkami).

Zalecenie dla orkiestratora (rejestr): wpis „zmiana prędkości w trakcie bitwy: logika ZMIERZONA 32/32 (obrona r1 #407; wcześniej FQ-SPEED-Q1 8/8)”; NIE_ZMIERZONO zostaje WYŁĄCZNIE dla zamrożonych wektorów w repo (brak testu w `cargo test`, który by to pilnował) — temat `FQ-SPEED-MIDCHANGE-VEC` (dopisać `speedAt` do `speed_vectors.json` / nowego pliku i do `predkosc_bitwy_wektory_pinu_bajt_w_bajt`) wymaga zmiany generatora i testu poza allowlistą tego tematu (D-407-4), więc go tu nie robię.

### U2 — liczba wektorów 351 vs 288 i brak nazwy testu c1 — PRZYJMUJĘ (korekta liczby + pomiar c1)

- `speed_vectors.json` ma **288** wektorów = 32 scenariusze × 9 prędkości (×2…×512); plik ma JEDEN commit (`4f59f74f5`, FQ-SPEED-Q1) i od początku miał 288. „351 = 39 × 9” w raporcie FQ-SPEED-Q1 (`01-operator-r1.md` §3) i dalej w rejestrze (wpisy FQ-SPEED i MARCH-RESZTA) to błąd arytmetyki/liczności scenariuszy. Dziś `vectors.json` ma 37 scenariuszy z klatką produkcyjną; 5 z nich (`mr_*`, `mr2_*`, dodane w MARCH-RESZTA) nie ma wersji prędkości — 32 × 9 = 288. Test `predkosc_bitwy_wektory_pinu_bajt_w_bajt` zielony w pełnym `cargo test` (Operator/Evaluator 4352/0/1). **Do orkiestratora: poprawić „351” → „288 (32 × 9)” w REJESTR-RUST i w dispatchu (D-407-4, kryterium 5).** Operator nie edytuje rejestru (poza allowlistą).
- c1 128/128 to pomiar diagnostyczny (nie test w `cargo test`): `kandydaci_z_pliku_na_zadanie` z `WIRING_A_VECTORS_FILE` = wynik generatora pinu na kandydatach `R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1/01-operator-r1-kandydaci-c1.py` (ziarno 101..228). Zmierzone na HEAD (binarka release):

| Zbiór | Pin | Rust | Wynik |
|---|---|---|---|
| c1 @16 | `c1_pin.json` MD5 `307d59423be5fd54379ec3bc06f87efe` | krok 16 ms | **128/128 ZGODNY** |
| c1 @1 | `WIRING_A_SWEEP_FRAME=1` (`ffStepMs=1`), `c1_pin1.json` MD5 `ed9a3c98f893643da23c694c3a282157` | `frameMs` z wektora | **128/128 ZGODNY** |

(Uwaga metodyczna: porównanie Rust @1 z pinem @16 daje 93/128 — to nie regresja, tylko inna siatka klatki po FRAME-QUANT; właściwe @1 = pin też @1.)

### U3 — słaba asercja (`on_grid` x4 bez sprawdzenia liczby) — PRZYJMUJĘ

`client/tests/siege_battle_client.rs`, `fq_speed_bridge_zmiana_w_trakcie_cycle_i_panel`: `assert!(on_grid(&…[from..], v_change, 64.0) > 0, "x4 actions on the 64 ms grid")`. Test zielony (client 51 passed), więc po zmianie na 4x faktycznie powstają i są sprawdzane akcje na siatce 64 ms. Commit `ffab9af71`.

### U4 — brak własnego testu renderera dla `set_frame_ms`/`opts()` — PRZYJMUJĘ

Nowy test `fq_speed_bridge_set_frame_ms_switches_the_grid_of_later_actions` w `renderer/tests/battle_playback_move_shot.rs` (allowlista: `renderer/tests/*`):
- `opts()` zwraca opcje, `set_frame_ms` zmienia TYLKO `frame_ms` (`tower_projectile` zachowane — porównanie całego `PlaybackOpts`);
- akcja wepchnięta PRZED zmianą, odegrana PO niej, jest sprawdzana na nowej siatce: 16→64 ms przyjmuje przyjazd x4 `t0 + 256` i gra go jak nominalny (te same wywołania sceny, ta sama scena); 64→16 ms odrzuca ten sam przyjazd (`ArriveAt`), nic nie dochodzi do sceny.

Mutanty renderera (patch `src/battle/playback.rs` → test → `git checkout`):

| # | Mutant | Wynik |
|---|---|---|
| R-O1 | `set_frame_ms` nic nie robi | ZABITY (nowy test) |
| R-O2 | `set_frame_ms` zeruje też `tower_projectile` | ZABITY (nowy test) |

Commit `ffab9af71`.

### U5 — rozjazd prędkości po błędzie `SpeedAnswer` — PRZYJMUJĘ jako dług do #410 (bez zmiany kodu w tym temacie)

Opis zgodny z kodem (`client/src/lib.rs` `set_siege_battle_speed`): błąd `SpeedAnswer` powstaje tylko, gdy odpowiedź silnika nie ma `speedIdx`/`speedMul` albo `speedMul ≠ SPEED_STEPS[speedIdx]` — silnik zawsze wypełnia oba pola (`siege_battle_apply.rs` `set_speed`; test kontraktu), więc to wyłącznie uszkodzony transport. Klient nie ma dziś drogi do ponownej synchronizacji: tylko odpowiedź prędkości niesie `speedIdx`/`speedMul` (inne odpowiedzi `siegeBattle` mają `None`). Naprawa wymaga decyzji o kontrakcie (np. `speedIdx`/`speedMul` w każdej odpowiedzi `siegeBattle`, klient synchronizuje się przy każdym `Step`) i należy do #410 TAURI-GLUE (sterownik zegara bitwy). Do orkiestratora: dopisać do dispatchu #410.

### U6 — `idx: i64` odrzuca `3.0` — ODRZUCAM jako wadę (przyjmuję jako uwagę dla #411)

- Frontend wysyła JSON z `JSON.stringify`: liczba całkowita JS nigdy nie jest serializowana jako `3.0` (`node -e 'JSON.stringify({idx:3.0})'` → `{"idx":3}`; `-0` → `0`). Ścieżka TS → most z całkowitym `idx` działa.
- Pin operuje na indeksie całkowitym (`SPEED_STEPS[this.speedIdx]`, `:9518-9527`); ułamkowy `idx` (np. `2.5`) dałby w pinie `speedMul = undefined` — odrzucenie takiej liczby przez most jest bezpieczniejsze niż cicha konwersja i nie zmienia żadnego zachowania osiągalnego z UI pinu (przyciski podają `speedIdx ± 1`).
- Uwaga dla #411 TS-TYPES (przyjęta): typ `idx: number` z komentarzem „całkowita” i `Math.trunc` przy składaniu żądania, jeśli wartość pochodzi z obliczeń.

## Bramki obrony (env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty po każdej bramce)

| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets |
|---|---|---|---|
| renderer (gpu OFF; wolne 12 GB, brak innych buildów) | EXIT 0 | EXIT 0 | EXIT 0, **758 passed / 0 failed** (757 + nowy test U4) |
| client | EXIT 0 | EXIT 0 | EXIT 0, **51 passed** (24 + 27) |
| engine | kod bez zmian względem `bd8aaa7d8` — pełny `cargo test` NIE powtarzany (Operator i Evaluator: 4352/0/1, EXIT 0); zbudowana i uruchomiona binarka release `p6_k5loop_wiring_a_pin` (pomiary U1/U2) |

- `renderer/Cargo.lock` przepisany przez build (dług T1-LOCK) — cofnięty `git checkout`.
- Mutant pomiarowy w `p6_k5loop_wiring_a_pin.rs` cofnięty `git checkout`; `git status` czysty przed commitem raportu.
- Brak `#[ignore]`, brak osłabionych asercji (jedyna zmiana asercji = wzmocnienie U3), brak zmian w `gra/`, brak procesów cargo/node w tle po rundzie.

## Zestawienie

| Zarzut | Odpowiedź | Dowód |
|---|---|---|
| U1 | PRZYJMUJĘ — zmierzone: 32/32 zgodnych z pinem przy zmianie w trakcie (czułość: mutant 27 rozbieżnych); osobny temat tylko na zamrożenie wektorów | §U1, MD5 plików |
| U2 | PRZYJMUJĘ — 288 = 32 × 9 (jeden commit pliku); c1 @16 128/128, c1 @1 128/128 na HEAD | §U2 |
| U3 | PRZYJMUJĘ — `assert!(… > 0)` | `ffab9af71`, client 51 |
| U4 | PRZYJMUJĘ — test renderera + 2 mutanty zabite | `ffab9af71`, renderer 758 |
| U5 | PRZYJMUJĘ jako dług #410 (kontrakt odpowiedzi) | §U5 |
| U6 | ODRZUCAM jako wadę; uwaga dla #411 przyjęta | §U6 |
