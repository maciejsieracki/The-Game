STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-LOOP-RESUME-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora r1: każdy zarzut PRZYJĘTY (poprawka + dowód + commit) albo ODRZUCONY (dowód).
ZMIANY/COMMIT: kod i testy 6409ca6bf (branch wip/R-RUSTPORT-P6-K5-LOOP-RESUME-Q1, baza 59ff97106). Allowlista zachowana: rust-port/engine/src/domain/siege_tactics_loop.rs, rust-port/engine/tests/p6_siege_tactics_loop_resume.rs, dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-LOOP-RESUME-Q1/**.
TESTY: patrz sekcja poniżej (wszystkie EXIT 0 po poprawce).
BLOKADY: brak. Cargo.lock nie zmieniany i nie commitowany. Brak #[ignore], brak osłabionych asercji, brak zmian gra/**, WERSJE.md, origin/main.
RUNDY: 2/5 (obrona r1, Operator HAIKU).
NASTĘPNY KROK: Evaluator r2 na 6409ca6bf (weryfikacja testu czułości i gate'ów).
DEPLOY/PUSH: NIE WYKONANO (brak push; bez integracji).

## Zarzut 1 (sredni): test nieczuły na stan przewijania. PRZYJĘTY.

Dowód problemu: po zamianie `mem::take(&mut self.ff)` na `FfLoopState::new()` w `resume()` wszystkie 3 testy przechodziły, bo `Fingerprint` nie zawierał `ff_virtual_ms` ani stanu kolejki/pending_auto.

Poprawka (6409ca6bf):
- `siege_tactics_loop.rs`: `pub fn ff_state(&self) -> &FfLoopState<()>` (tylko odczyt, bez zmiany zachowania).
- `p6_siege_tactics_loop_resume.rs`: `Fingerprint` rozszerzony o `ff_virtual_ms: f64`, `ff_pending_auto: bool`, `ff_queue_len: usize`, wypełniane z `ff_state()`.

Dowód mutacyjny (wykonany po poprawce, na kopii pliku, potem przywrócony; `git grep` potwierdza oryginalne `std::mem::take(&mut self.ff)`):
- Mutacja: `let mut ff = FfLoopState::<()>::new();` w `resume()`.
- Wynik: `p6_siege_tactics_loop_resume_matches_single_run_for_any_step_split` FAILED (panic p6_siege_tactics_loop_resume.rs:255), `..._budget_one_on_tower_or_breach_sequence_matches_run` FAILED (:286), `..._after_finish_is_a_no_op` FAILED (:297). Test jest czuły na stan przewijania.

Dlaczego nie było to widać wcześniej: `ff_virtual_ms` rośnie monotonicznie w `run_fast_forward` (siege_tactics_fastforward.rs:155), więc jego reset między wywołaniami zmienia wynik; wcześniej nie był porównywany.

## Zarzut 2 (informacyjny): test porównuje run() z podzielonym resume(), nie z absolutnym pinem. ODRZUCONY (dowód).

Zgodnie z dispatchem test ma porównywać jedno run() z wieloma resume(). Zgodność z absolutnym pinem nie jest celem tego testu i jest pokryta przez istniejące testy:
- `rust-port/engine/tests/p6_siege_tactics_loop.rs:195` wywołuje `sl.run(&mut clock, 50_000_000)` na wektorach pinu i porównuje z pinem (4 testy zielone).
- `p6_siege_tactics_loop.rs:365` drugi przebieg `run(…, 50_000)` (budżet pośredni).
- Zegar ścienny: nie modelowany, zgodnie z dispatchem (opis w raporcie 01-operator-r1.md i nagłówku testu).

## Bramki po poprawce (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo)

- cargo fmt --check (w rust-port/engine): EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 99 passed, EXIT 0
- cargo test --test p6_siege_tactics_loop: 4 passed
- cargo test --test p6_siege_tactics_loop_body: 8 passed
- cargo test --test p6_siege_tactics_loop_resume: 3 passed

Katalog CARGO_TARGET_DIR (poza repo) do usunięcia po zapisie raportu.
