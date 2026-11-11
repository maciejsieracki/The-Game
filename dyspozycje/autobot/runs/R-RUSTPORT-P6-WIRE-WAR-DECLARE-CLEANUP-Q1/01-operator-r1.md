STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-DECLARE-CLEANUP-Q1 (W4)
GOAL: W4 wg dispatchu: deklaracja wojny wymuszonej, sprzątanie przy pokoju, koniec wojny wg liczby miast (próg 2, D3=1:1), blokada pokoju epoki, wykonanie zakupu jednostki AI jako krok komend (D7=A, wynik = `ai_try_purchase_unit`).
BAZA: origin/rust-port/parity-v2 = d2d533a77 (worktree detach, sparse rust-port + dyspozycje).
ZMIANY/COMMIT: allowlista: `rust-port/engine/src/domain/war_turn_declare.rs` (NOWY, ~330 LOC), `rust-port/engine/src/domain/mod.rs` (+1 linia `pub mod`), `rust-port/engine/tests/p6_wire_war_declare.rs` (NOWY, 15 testów), `dyspozycje/rust-port/p6/P6-WIRE-WAR-DECLARE-CLEANUP.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-DECLARE-CLEANUP-Q1/01-operator-r1.md`. SHA: podany w wiadomości zwrotnej orkiestratora (commit lokalny, bez push).
  Akcesory W1/W2/W3 NIE zmieniane (moduł używa `pub` pól `WarTurnState`/`ForcedWarSaveState` i `opaque`, więc addytywne akcesory nie były potrzebne).
TESTY:
- `cargo fmt -- --check`: exit 0 (po rustfmt na nowych plikach).
- `cargo clippy --all-targets -- -D warnings`: czysto (brak diagnostyk).
- `cargo test --test p6_wire_war_declare`: 15 passed, 0 failed, 0 ignored.
- `cargo test --lib`: 22 passed, 0 failed.
- Regresja W1–W3: p6_wire_war_forced_step 24/24, p6_wire_war_state 14/14, p6_wire_war_state_snapshot 8/8, p6_wire_war_view 6/6.
- Wektory z uruchomionego weba: NIE_ZMIERZONO (logika inline w main.ts, nieeksportowana). Oczekiwania wyprowadzone z odczytanych reguł (ZAŁOŻENIE jak w W3).
BLOKADY: brak. Dług W3-7 (dedup po ownerId) NIE zamknięty (cykl przez `Vec::contains`), zgodnie z Z6. Blokada pokoju epoki nie jest zdejmowana (poza zakresem W4).
ZAŁOŻENIA: Z1 format map `meta` jako tablice par; Z2 wypowiedzenie = assignment + `declared`; Z3 bilans AI-AI podawany przez wołającego; Z4 kolejka i wybór miasta po stronie wołającego; Z5 start pary 0/0; Z6 dług W3-7.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja zgodności z web (numery linii z grepa), Final Control po PASS; integracja orkiestratora po FC.
DEPLOY/PUSH: NIE WYKONANO
