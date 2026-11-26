# R-RUSTPORT-P4-412-FQ-SPEED-MIDCHANGE-VEC-Q1 — wektory pinu dla zmiany prędkości bitwy W TRAKCIE walki (zadanie #412)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (3D/grafika Rust). Podstawa: wpis „FQ-SPEED-BRIDGE (#407) … ZINTEGROWANE" w `REJESTR-RUST.md` (dług FQ-SPEED-MIDCHANGE-VEC) i raport Obrony #407 (`dyspozycje/autobot/runs/R-RUSTPORT-P4-407-FQ-SPEED-BRIDGE-Q1/02a-obrona.md` oraz skrypt `02a-obrona-u1-kandydaci.py` na gałęzi `origin/rust-port-wip/407-fq-speed-bridge-q1-obrona`, `git show`).
BAZA: `origin/rust-port/parity-v2` = `3f98dd284229f975e373b9c3be7a0d28232089d3` w dniu dispatchu (wpisz faktyczny SHA: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`).

## GOAL
NAJPIERW web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`): `_setSpeedIdx` (`:9518-9527`) jest bezpieczne w każdej fazie bitwy (`:9535`), a `_scaledWallDelta` (`:9512-9515`) skaluje deltę ścienną zegara; zmiana w trakcie walki przesuwa siatkę klatki od następnej klatki `_raf`. Obrona #407 zmierzyła 32/32 zgodności zmiany prędkości w trakcie bitwy między pinem a Rustem (kandydaci c1, pary 1→4, 1→64, 64→1, 4→512, 1→2, 8→32, tury 2–13; kontrola czułości: mutant „pomiń zmianę" 27/32 rozbieżnych), ale pomiar NIE jest zamrożony w repo: `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/speed_vectors.json` (288 wektorów = 32 × 9, NIE 351) ustawia prędkość przed `play()`.
Zadanie: zamroź ten pomiar jako wektory pinu w repo — rozszerz generator (`rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`, który wykonuje tekst pinu) o tryb „zmiana prędkości w klatce N" (np. nowy plik `speed_change_vectors.json`), dodaj test silnika (`p6_k5loop_wiring_a_pin.rs` albo nowy plik) porównujący strumień akcji i końcowy wynik bajt w bajt z pinem, oraz test mutacyjny/czułości (mutant „pomiń zmianę w trakcie" musi dawać FAIL). Wpisz do raportu faktyczne liczby (ile bitew, ile par prędkości, które tury zmiany) i popraw w rejestrze liczbę `speed_vectors.json` = 288.

## DECYZJE TECHNICZNE (orkiestrator, wiążące; wpisane do REJESTR-RUST.md)
- D-412-1: wektory generowane wykonaniem tekstu pinu (jak istniejące), nie ręcznie; pliki JSON deterministyczne (stałe ziarna), rozmiar rozsądny (≤ ok. 2 MB), żeby nie obciążać repo i testów.
- D-412-2: bez zmian kodu produkcyjnego silnika/mostu/klienta, jeśli pomiar zgodny; rozbieżność = osobny temat z raportem (nie poprawiaj parytetu „po cichu").
- D-412-3: bramki dla zmiany tylko testów/generatora: engine fmt/clippy/pełny test; client i renderer nie są wymagane (nie zmieniasz ich).

## ALLOWLISTA
`rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (rozszerzenie), `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` lub nowy plik testów silnika (np. `p4_412_speed_midchange.rs`), `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/` (nowy plik wektorów; `speed_vectors.json` bez zmian treści), raporty w katalogu runu. Zmiana innego pliku: uzasadnij w raporcie.

## KRYTERIA KOŃCA
1. Nowy plik wektorów zmiany prędkości w trakcie bitwy (≥ 24 przypadki: różne pary prędkości, różne tury zmiany, w tym zmiana w trakcie ruchu w locie i tuż przed trafieniem), generowany wykonaniem pinu; test porównuje z Rustem bajt w bajt.
2. Kontrola czułości: mutant „zmiana prędkości pominięta w trakcie" daje FAIL (zmierz i wpisz liczbę rozbieżnych); co najmniej 6 mutantów (zła klatka zmiany, zła siatka po zmianie, brak przeliczenia `frame_ms`, zła kolejność względem kroku, itp.) zabitych lub jawnie równoważnych.
3. Istniejące wektory (45/50 vectors, 288 speed, c1 128/128 @1/@16) bez regresji.
4. Raport z liczbami i z poprawką liczby 288 vs 351 w rejestrze (wpis robi orkiestrator na podstawie raportu).

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`. Wymagane ≥ 8 GB wolnego, jeden build na raz. Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Nie zostawiaj procesów cargo w tle po zakończeniu rundy. Równolegle może trwać temat bez cargo (#411) — nie ruszaj `src-tauri/frontend-v2`.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak zmian w `gra/`, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md` w katalogu runu; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).
