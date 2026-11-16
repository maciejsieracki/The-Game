# DISPATCH R-RUSTPORT-P6-K5DOC-T4-ROZP-Q1 (runda 1) — rozpoznanie portu ruchu pieszego (#258 K5DOC-T4) — tylko odczyt

MODEL: HAIKU (Operator), SONNET (Evaluator). TYLKO ODCZYT, bez kodu, bez cargo.
BAZA: `origin/rust-port/parity-v2` = `0fccd8dbf`. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt, web-first).
POWÓD: #123 (facing po krokach ruchu) zablokowany — w `ProdBody::start` (siege_tactics_loop.rs ~1476) zdarzenia AdvanceStep, FallBackStep, CavalryAction są pomijane; brak odpowiednika `_doMove`. Ten temat ma ustalić, jak wpiąć ruch pieszego.

## PYTANIA
1. W pinie: `_advanceStep` (battleScene.ts ~8221, ~8273), `_compactAttackAllowsStep`, reguła anty-cofania, i `_doMove` (~8685): sygnatury, wejścia, efekty (pozycja q/r, facing, zajętość, log). Lokalizacje: `git grep -n "_advanceStep\|_compactAttackAllowsStep\|_doMove" 07d2fbd72 -- gra/src/battle`.
2. W Rust: co już istnieje dla kroku (np. `siege_tactics_move`, `_bfsFirstStep`, `move_left`, `skipped` w `siege_tactics_loop.rs`)? Czy jest moduł do przeniesienia `_doMove` do ProdBody?
3. Lista brakujących elementów i proponowany podział na mniejsze tematy (ruch pieszego, ruch jazdy, odwrót falangi), z zależnościami od #257/#259/#261.
4. Które wektory pinu są potrzebne do testu kroku (wejścia, oczekiwany stan).

## WYJŚCIE
- `dyspozycje/rust-port/p6/K5DOC-T4-RUCH-PIESZY-ROZPOZNANIE.md` (NOWY): tabela pin ↔ Rust, lista brakujących elementów, podział tematów, wejścia do wektorów.
- Niepewne miejsca: NIE_ZMIERZONO. Commit jawnym git add, bez zmian kodu, bez push do parity, bez nazw modeli w commicie.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/K5DOC-T4-RUCH-PIESZY-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4-ROZP-Q1/**`
