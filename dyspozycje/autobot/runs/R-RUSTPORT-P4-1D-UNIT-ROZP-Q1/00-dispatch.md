# DISPATCH R-RUSTPORT-P4-1D-UNIT-ROZP-Q1 — ROZPOZNANIE, TYLKO ODCZYT (P4-1D / #213)

DOMENA: GAME, DTO renderera (jednostki i stosy). MODEL: OPUS we wszystkich rolach. ZERO zmian kodu.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` w chwili startu (zapisz SHA). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
Przygotowanie producentów `UnitViewDto` i `StackViewDto` (#213, `compute_stack_display`): jak web wylicza wyświetlanie stosu (`compute_stack_display` lub odpowiednik w pinie), które pola jednostki (typ, właściciel, HP, facing, stan oblężenia, ulepszenia) są potrzebne rendererowi, co Rust ma i co brakuje.

## PIN (tylko odczyt)
`grep -rn "stackDisplay\|computeStackDisplay\|stack" gra/src/render gra/src/main.ts` (wyszukaj po treści). Zapisz plik:linia.
## RUST (tylko odczyt, `git grep` na bazie)
`compute_stack_display`, `UnitViewDto`, `StackViewDto`, `view-model/src/`, `renderer/`.

## KRYTERIA KOŃCA
1. Tabela: funkcja pinu (plik:linia) → wejścia → wyjście → odpowiednik Rust (plik:linia) | BRAK | ROZBIEŻNE.
2. Lista pól `UnitViewDto`/`StackViewDto` z wejściami z modelu i wskazaniem, które są już w Rust.
3. Propozycja podziału na wdrożenia (nazwa, allowlista, wektory). NIE wdrażaj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p4/P4-1D-UNIT-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1D-UNIT-ROZP-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
