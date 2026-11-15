# DISPATCH R-RUSTPORT-P4-1J-GENERALTARGET-ROZP-Q1 — ROZPOZNANIE, TYLKO ODCZYT (#233 / #221)

TEMAT: `generalTargetId` (web, pin 07d2fbd72) pominięte w Rust (P4-1J, planowane marsze). Rozpoznanie: co web robi z tym polem, co Rust ma i co trzeba wdrożyć.
DOMENA: GAME (read-only). Model: Operator HAIKU, Evaluator SONNET, Obrona HAIKU, FC SONNET.
BAZA (jedyna obowiązująca): `f7baa3848`. Worktree detached. ZERO zmian kodu.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## PIN (tylko odczyt)
`git show 07d2fbd72:gra/src/...` — `grep -rn "generalTargetId" gra/src` (zapisy, odczyty, zapis do save, wpływ na marsz/cel).

## RUST (tylko odczyt)
`git grep -n "general_target\|generalTarget\|PlannedMarch\|planned_march" f7baa3848 -- rust-port` (domain/playable.rs, save_load.rs, pliki P4-1J).

## KRYTERIA KOŃCA
1. Tabela: miejsce użycia `generalTargetId` w pinie (plik:linia) → znaczenie → odpowiednik w Rust (plik:linia) | BRAK | ROZBIEŻNE.
2. Wpływ na zapis (save/load) i na DTO widoku (P4-1H preview_path/cancel_planned_march) — wskaż.
3. Propozycja tematu wdrożeniowego: nazwa, allowlista, wektory, zależności. Nie wdrażaj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p4/P4-1J-GENERALTARGET-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-GENERALTARGET-ROZP-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
