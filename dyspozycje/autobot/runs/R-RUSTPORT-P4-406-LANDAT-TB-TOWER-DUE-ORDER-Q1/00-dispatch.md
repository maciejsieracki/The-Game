# R-RUSTPORT-P4-406-LANDAT-TB-TOWER-DUE-ORDER-Q1 — kolejność trafienia wieży wobec innych zegarów tej samej klatki (zadanie #406)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (3D/grafika Rust). Podstawa: wpis „LANDAT-TOWER-BOULDER (#400)" w `REJESTR-RUST.md` i raporty `dyspozycje/autobot/runs/R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1/02-evaluator.md` (E-2, E-3), `02a-obrona.md`, `03-final-control.md` (`git show origin/rust-port-wip/landat-tower-boulder-q1-merge:<ścieżka>`).
BAZA: `origin/rust-port/parity-v2` po integracji #413 (oczekiwany SHA `81bf861d24f543b6718f043f34a8ce29a3294a80`; wpisz faktyczny: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`).

## GOAL
NAJPIERW web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`): `_drainTimers` (`:9603-9640`) odpala w jednej klatce zegary `_schedule` rosnąco po NOMINALNYM `due` (`due = _now() + ms` w chwili planowania, `:9595-9601`), a lądowanie pocisku wieży (`_fireOneTower`, `_schedule(RANGED_FLY_MS=380…)` `:4219`/`:4262`) wypada w pierwszej klatce z `vNow >= due`. Przy klatce 16 ms lądowanie wieży ma więc nominalny `due = t0 + 380` i fizycznie pada w klatce `t0 + 384` (D-LTB-1). Inny zegar z `due ∈ (t0+380, t0+384]` pada w TEJ SAMEJ klatce, ale PO trafieniu wieży (kolejność wg `due`). Rust (`rust-port/engine/src/domain/siege_tactics_loop.rs`) trzyma w `tower_in_flight` nominalny `due`, co jest poprawne (D-FQ-2), ale żaden test ani wektor tego nie sprawdza: mutant EV6 (`due` w `tower_in_flight` z siatki zamiast nominału) przeżywa lib i wektory (Evaluator #400, E-2).
Zadanie: (1) zbuduj scenariusz/ślad z PINU (wykonanie tekstu pinu, jak istniejące wektory), w którym trafienie wieży (`due = t0+380`) i inny zegar z `due ∈ (t0+380, t0+384]` padają w tej samej klatce 16 ms, i zamroź go w wektorach (rozszerzenie generatora `p6_k5loop_wiring_a_gen.mjs`, nowy plik wektorów albo nowe wpisy — wybór techniczny Twój); (2) dodaj test silnika porównujący kolejność zdarzeń tej klatki z pinem bajt w bajt oraz test jednostkowy lib na `tower_in_flight` (nominał vs siatka); (3) zamroź w wektorze czasy trafień wieży/kamienia przy klatce 16 ms (`t0+384` / `t0+704`, D-LTB-1; E-3) jako pilnowany kontrakt; (4) kontrola czułości: mutant EV6 musi dawać FAIL (zmierz i wpisz), pozostałe mutanty kolejności (np. odwrócona kolejność wieża/inny zegar, `due` z siatki dla innych zegarów) zabite albo jawnie równoważne.

## DECYZJE TECHNICZNE (orkiestrator, wiążące; D-406-1..3)
- D-406-1: wektory generowane wykonaniem tekstu pinu (nie ręcznie), deterministyczne, rozmiar ≤ ok. 1 MB; istniejące pliki wektorów (`vectors.json`, `speed_vectors.json`, `speed_change_vectors.json`) bez zmian treści.
- D-406-2: bez zmian kodu produkcyjnego silnika, jeśli scenariusz wychodzi zgodny z pinem; rozbieżność = jawny raport i osobny temat (nie poprawiaj „po cichu"); jeśli scenariusza nie da się zbudować z istniejących scenariuszy bazowych, użyj sondy pinu (jak `01-operator-r1-sonda.mjs` z #400) i opisz w raporcie, ile par (wieża, inny zegar) pin faktycznie produkuje.
- D-406-3: bramki: engine fmt/clippy/pełny test; client i renderer nie są wymagane, jeśli ich nie zmieniasz.

## ALLOWLISTA
`rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs`, `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` lub nowy plik testów silnika (np. `p4_406_tower_due_order.rs`), `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/` (nowy plik wektorów), testy lib w `siege_tactics_loop.rs` (`#[cfg(test)]` — kod produkcyjny bez zmian), raporty w katalogu runu. Zmiana innego pliku: uzasadnij w raporcie.

## KRYTERIA KOŃCA
1. Nowy wektor/ślad z pinu z trafieniem wieży i innym zegarem z `due ∈ (t0+380, t0+384]` w jednej klatce 16 ms + test zgodności bajt w bajt (kolejność zdarzeń klatki); czasy `t0+384`/`t0+704` zamrożone.
2. Mutant EV6 daje FAIL (liczba rozbieżnych przypadków zmierzona); co najmniej 4 mutanty kolejności zabite lub jawnie równoważne (z uzasadnieniem).
3. Istniejące wektory i pełny `cargo test` engine bez regresji.
4. Raport z liczbami (ile par wieża/inny zegar w pinie, ile w wektorze) i jawną listą NIE_ZMIERZONO.

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`. Wymagane ≥ 8 GB wolnego, jeden build na raz. Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Nie zostawiaj procesów cargo w tle po zakończeniu rundy.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak zmian w `gra/`, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md` w katalogu runu; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).
