# DISPATCH R-RUSTPORT-P6-R7K7C-STATUS-ROZPOZNANIE-Q1 (runda 1) — ROZPOZNANIE, TYLKO ODCZYT

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: #176 R7K7C-STATUS: czy R7K7C-WIRING (apply_dipl_deltas_to_state w advance_turn, parytet brak wpisu = 0) jest zintegrowany na parity (#106)
MODEL: Operator HAIKU 5.5; Obrona HAIKU 5.5; Evaluator SONNET 5.5; Final Control SONNET 5.5.

ZASADA: NAJPIERW WEB. Pin `07d2fbd72` (gra/src/**). Brak rozstrzygnięcia w webie = NIE_ZMIERZONO, nie pytaj właściciela.

BAZA: `origin/rust-port/parity-v2` = `d5a52a980`. Czytaj przez `git show`/`git grep` (worktree opcjonalny, bez zmian kodu).

CEL: Sprawdź na parity: apply_dipl_deltas_to_state i jego wołający w advance_turn; parytet 'brak wpisu = 0'; czy wektory ≥150 istnieją. Pin: pytanie o wpięcie deltas dyplomacji w turze (gra/src/**).

RAPORT (`01-rozpoznanie.md`): tabela krok → odpowiednik Rust (plik:linia) | BRAK | ROZBIEŻNE | ZINTEGROWANE; lista NIE_ZMIERZONO; wskazanie, które luki są zależnościami do innych tematów.

ALLOWLISTA: wyłącznie `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-STATUS-ROZPOZNANIE-Q1/**`. Zero zmian w gra/, rust-port/.

PROCES: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control. Commit tylko katalogu runu (jawne git add). Bez push na parity. Commit z `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` i `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.

## KOREKTA BAZY (orkiestrator, 15.11 16:5x UTC) — OBOWIĄZUJE ZAMIAST „BAZA” Z GÓRY
- Aktualny `origin/rust-port/parity-v2` = `10a2fc4af` (M01-R2 MapHex na czubku). `d5a52a980` jest jego przodkiem.
- Rozpoznanie wykonać na `10a2fc4af` (worktree z tej bazy). Zwrócić SHA bazy w `01-rozpoznanie.md`.
- Bez zmian zakresu, allowlisty i trybu (tylko odczyt).
