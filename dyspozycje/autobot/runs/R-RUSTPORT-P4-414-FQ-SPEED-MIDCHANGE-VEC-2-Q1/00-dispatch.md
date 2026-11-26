# R-RUSTPORT-P4-414-FQ-SPEED-MIDCHANGE-VEC-2-Q1 — wektory pinu dla zmiany prędkości w trakcie bitwy: wypad wręcz z przesunięciem ciosu, krok falangi, `_advanceToward` (zadanie #414)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (3D/silnik bitwy). Kolejka właściciela (decyzja 2026-11-26): realizacja po jednym, po integracji #404.
BAZA: `origin/rust-port/parity-v2` = `bb92c80fa` (po #404; wpisz faktyczny SHA: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`).

## STAN ZWERYFIKOWANY NA BAZIE (orkiestrator, 2026-11-26; zasada „najpierw sprawdź, czy dług istnieje")
Dług z Obrony #413 (`02a-obrona.md` §3 U1 i §1 Z1) ISTNIEJE na `bb92c80fa`: `SiegeLoop::respeed` (`siege_tactics_loop.rs`, 12 trafień) jest zintegrowany, a `speed_change_vectors.json` (40 bitew, MD5 `a374deae…`) NIE wykonuje po 1. turze kroku falangi (`ProdBody::phalanx_action`, pin `_phalanxAction` :6641) ani `_advanceToward` (pin :7892-7916) — sonda Evaluatora #413: 74 przypadki, 0 zastosowanych zmian. Mutanty E3, E7, E8 giną dziś wyłącznie od testów jednostkowych (`respeed_tests::*`, `p413_*`), nie od wektorów pinu. Kod produkcyjny nie jest tu podejrzany o błąd (40/40 zgodnych); celem jest dowód wektorowy (pin wykonany) dla tych trzech klas, a jeśli wektor ujawni rozbieżność — raport i naprawa wg pinu w tym samym temacie.

## GOAL
NAJPIERW web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`): `_doMeleeAttack` (:9096-9174; cios `BLOW_HIT_T`, koniec wypadu `BLOW_LUNGE_MS`, potem `BLOW_SETTLE_MS`), `_phalanxAction` (:6641, :6589 `moveLeft`), `_advanceToward` (:7892-7916, :7915 `_doMove`; wołany z :6215, :8035, :8049). Dołóż do wektorów pinu scenariusze zmiany prędkości (`speedChanges`) TUŻ PRZED/PO ciosie wypadu (przesunięcie ciosu o klatkę), w trakcie kroku falangi i w trakcie `_advanceToward`; porównaj z Rustem (`siege_battle_session` + `SiegeLoop::respeed`) bajt w bajt (strumień zdarzeń z czasem + wynik).

## DECYZJE TECHNICZNE (orkiestrator, wiążące; D-414-1..3)
- D-414-1: nowe wektory trafiają do NOWEGO pliku `speed_change_vectors_2.json` (istniejące pliki wektorów, w tym `speed_change_vectors.json`, bez zmian treści; generator `p6_k5loop_wiring_a_gen.mjs` — tylko dopiski, strażnik SHA-256 bez zmian).
- D-414-2: **budżet czasu (wiążący, lekcja #406: 5 h 45 min przy zerowej zmianie zachowania):** zestaw ≤ 16 scenariuszy (4 shardy `…_SHARD=k/4`), dobranych SONDĄ: najpierw (≤ 30 min) znajdź w pinie scenariusze, w których zmiana prędkości faktycznie trafia w krok falangi / `_advanceToward` / okno ciosu (licznik „zastosowanych zmian" w danej klasie > 0); scenariusze bez trafienia odrzuć. Cały temat (4 role) ma się zmieścić w ≈ 3 h; przekroczenie = raport z tym, co jest, nie rozszerzanie zakresu.
- D-414-3: rozbieżność Rust vs pin ujawniona wektorem = naprawa wg pinu (kod `siege_tactics_loop.rs`) z testem, zgłoszona jawnie; brak rozbieżności = zero zmian kodu produkcyjnego (jak #406).
- Bramki: engine fmt/clippy/pełny test; client/renderer tylko jeśli zmieniasz ich pliki (nie powinieneś).

## ALLOWLISTA
nowy `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/speed_change_vectors_2.json`; `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (dopiski: tryb wektorów 2, `speedChanges` pod klasy wypad/falanga/advanceToward); `rust-port/engine/tests/p6_k5loop_wiring_a_pin.rs` (dopisek: test bajt w bajt + kontrola czułości); w razie rozbieżności (D-414-3) `rust-port/engine/src/domain/siege_tactics_loop.rs` i `siege_battle_session.rs`; raporty w katalogu runu. Inny plik: uzasadnij.

## KRYTERIA KOŃCA
1. `speed_change_vectors_2.json` generowany wykonaniem tekstu pinu; ≥ 8 bitew z licznikiem zastosowanych zmian > 0 w każdej z trzech klas (wypad z przesunięciem ciosu o klatkę, krok falangi, `_advanceToward`) — albo jawny dowód (sonda), że klasa jest w pinie nieosiągalna dla zmiany prędkości, z numerami linii.
2. Zgodność Rust vs pin bajt w bajt na wszystkich nowych wektorach (strumień zdarzeń z czasem + wynik bitwy) albo lista jawnych rozbieżności z przyczyną.
3. Mutanty E3, E7, E8 (z `02-evaluator.md` #413) oraz mutant planu kroku falangi i `_advanceToward` giną OD WEKTORÓW (nie tylko od testów jednostkowych) — wynik per mutant.
4. Istniejące wektory (45/45 `vectors.json`, 288 `speed_vectors`, 40 `speed_change`, 74 `tower_due_order`, 24+ `move_order`) i pełny `cargo test` engine bez regresji.
5. Raport z liczbami i jawną listą NIE_ZMIERZONO.

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`. Wymagane ≥ 8 GB wolnego, jeden build na raz. Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Nie zostawiaj procesów cargo/node w tle po zakończeniu rundy.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak zmian w `gra/`, kontrakcie mostu, kliencie i rendererze, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).
