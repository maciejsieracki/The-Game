# DISPATCH R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1 (runda 1) — ROZPOZNANIE, TYLKO ODCZYT

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: #175 ZDOBYCIE-MIASTA: apply_transfer_with_effects i run_capital_capture_plunder — czy i gdzie są wpięte w produkcję, akumulatory zdobyczy (#115)
MODEL: Operator HAIKU 5.5; Obrona HAIKU 5.5; Evaluator SONNET 5.5; Final Control SONNET 5.5.

ZASADA: NAJPIERW WEB. Pin `07d2fbd72` (gra/src/**). Brak rozstrzygnięcia w webie = NIE_ZMIERZONO, nie pytaj właściciela.

BAZA: `origin/rust-port/parity-v2` = `d5a52a980`. Czytaj przez `git show`/`git grep` (worktree opcjonalny, bez zmian kodu).

CEL: Dla pinu: przejęcie miasta (runCapitalCapturePlunder, applyCaptureTransfer i skutki) — które funkcje są w produkcji w Rust (wołający poza testami), a których brak. Źródła: gra/src/**, grep 'runCapitalCapturePlunder' i 'applyCapturePopulationLoss'.

RAPORT (`01-rozpoznanie.md`): tabela krok → odpowiednik Rust (plik:linia) | BRAK | ROZBIEŻNE | ZINTEGROWANE; lista NIE_ZMIERZONO; wskazanie, które luki są zależnościami do innych tematów.

ALLOWLISTA: wyłącznie `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZDOBYCIE-MIASTA-ROZPOZNANIE-Q1/**`. Zero zmian w gra/, rust-port/.

PROCES: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control. Commit tylko katalogu runu (jawne git add). Bez push na parity. Commit z `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` i `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
