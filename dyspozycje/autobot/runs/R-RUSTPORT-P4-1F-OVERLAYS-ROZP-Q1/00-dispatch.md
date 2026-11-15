# DISPATCH R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1 — ROZPOZNANIE, TYLKO ODCZYT (P4-1F / #215)

DOMENA: GAME, DTO renderera (nakładki). MODEL: OPUS we wszystkich rolach. ZERO zmian kodu.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` w chwili startu (zapisz SHA). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
Przygotowanie producenta `OverlaysViewDto` (#215): nakładki — terytorium, zasięgi ruchu, szlaki (planowane marsze), oblężenia, cuda. Dla każdej nakładki: źródło w pinie (funkcja, plik:linia), wejścia z modelu gry, odpowiednik w Rust (`planned_march`, `preview_path`, zasięgi, oblężenia, cuda) i luki.

## PIN (tylko odczyt)
`grep -rn "overlay\|setOverlay\|territoryOverlay\|reachOverlay\|siegeOverlay\|wonderOverlay" gra/src` (render/, main.ts). Zapisz plik:linia.
## RUST (tylko odczyt, `git grep` na bazie)
`view-model/src/` (typy nakładek), `engine/src/domain/` (planned_march, zasięgi, oblężenia), `renderer/`.

## KRYTERIA KOŃCA
1. Tabela: nakładka → funkcja pinu (plik:linia) → wejścia → odpowiednik Rust (plik:linia) | BRAK | ROZBIEŻNE.
2. Lista pól `OverlaysViewDto` z wejściami z modelu.
3. Propozycja podziału na wdrożenia (nazwa, allowlista, wektory). NIE wdrażaj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
