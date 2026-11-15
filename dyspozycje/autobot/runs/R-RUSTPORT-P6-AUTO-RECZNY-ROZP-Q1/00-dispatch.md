# DISPATCH R-RUSTPORT-P6-AUTO-RECZNY-ROZP-Q1 — ROZPOZNANIE TRYBU RĘCZNEGO, TYLKO ODCZYT (luka po #234)

TEMAT: tryb ręczny sterownika pętli oblężenia nie ma portu w Rust ani zadania. Zakres rozpoznania: co pin robi w trybie ręcznym i jakie wejścia/wyjścia wymaga port.
DOMENA: GAME (read-only). Model: Operator HAIKU, Evaluator SONNET, Obrona HAIKU, FC SONNET.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `f7baa3848` (aktualizowana przy starcie; zapisz SHA w raporcie). Worktree detached. ZERO zmian kodu.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## PIN (tylko odczyt, `git show 07d2fbd72:gra/src/battle/battleScene.ts`)
Punkty startowe: `_toggleManualMode` (~17348), `_performPlayerOrder` (~18280), wywołania tych funkcji i flagi trybu (`grep -n "Manual\|manual\|PlayerOrder"`).

## RUST (tylko odczyt)
`rust-port/engine/src/domain/siege_tactics_loop.rs` (stuby: `doctrine`, `perform_player_order` zwracają false wg rozpoznania #234), `siege_tactics_autobatch.rs`.

## KRYTERIA KOŃCA
1. Tabela: funkcja pinu trybu ręcznego (plik:linia) → zachowanie → odpowiednik Rust (plik:linia) | BRAK | ROZBIEŻNE.
2. Lista wejść/wyjść portu (typy, stan, zdarzenia) i zależności od #97/#112/#113/#109.
3. Propozycja tematu wykonawczego: nazwa, allowlista, wektory, szacunek rund. Nie wykonuj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUTO-RECZNY-ROZP-Q1/**` (wyłącznie `01-rozpoznanie.md` i pliki kolejnych ról)

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
