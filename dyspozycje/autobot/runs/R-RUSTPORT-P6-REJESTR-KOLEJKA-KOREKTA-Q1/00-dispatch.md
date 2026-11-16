# DISPATCH R-RUSTPORT-P6-REJESTR-KOLEJKA-KOREKTA-Q1 (runda 1) — korekta rejestru po audycie + migawka KOLEJKA-RUST (#309, #301, #303)

MODEL: HAIKU (Operator), SONNET (Evaluator). Dokument, bez kodu, bez cargo.
BAZA: `origin/rust-port/parity-v2` = `55e00a164`. Źródło prawdy: `dyspozycje/autobot/runs/*` i audyt `dyspozycje/rust-port/p6/AUDYT-PARYTET-9a71caf8a.md`.

## ZADANIA
1. #309: w `dyspozycje/rust-port/REJESTR-RUST.md` dopisz sekcję KOREKTA: wpisy oznaczone "ZINTEGROWANE"/"wpięte", które wg audytu są wołane tylko z testów (np. apply_dipl_deltas_to_state, eliminate_owner, run_economy_tick_for_game, declare_war_by_player, SiegeLoop, combat::resolve). Nie zmieniaj historii, tylko dopisz korektę z odnośnikiem do audytu.
2. #303: przepisz `dyspozycje/rust-port/KOLEJKA-RUST.md`: usuń zamknięte pozycje (1F3, I4, nakładki 1F4/1F5, T2/T3, AUTO V1/V5/V6 po integracji), dopisz otwarte (V2/V7–V14, #311, #310, #304–#308, #106 po #282).
3. #301: dopisz do rejestru zamknięcie wpisu po integracjach 1F3 i I4 (SHA: 9a71caf8a, 55e00a164).

## WYJŚCIE
- Zmiany w dwóch plikach dyspozycje/rust-port/. Commit jawnym git add, bez push do parity.
- Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P6-REJESTR-KOLEJKA-KOREKTA-Q1/`.

## ALLOWLISTA
- `dyspozycje/rust-port/REJESTR-RUST.md`, `dyspozycje/rust-port/KOLEJKA-RUST.md`
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-REJESTR-KOLEJKA-KOREKTA-Q1/**`
