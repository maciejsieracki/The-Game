# DISPATCH R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1 — ROZPOZNANIE, TYLKO ODCZYT (P4-1G / #216)

DOMENA: GAME/renderer, DTO renderera (adapter widoku). MODEL: OPUS. ZERO zmian kodu.
BAZA: `origin/rust-port/parity-v2` w chwili startu (zapisz SHA). Worktree detached. Pin: `07d2fbd72` (tylko odczyt).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
Przygotowanie `renderer/src/view.rs` (#216): adapter DTO → wejścia renderera. Które DTO z `view-model` (MapViewDto, HexDynDto, FogViewDto, UnitViewDto/StackViewDto, CityViewDto, OverlaysViewDto, BattleEventsDto) trafiają do jakich wejść renderera (`renderer/src/**`), gdzie w pinie web robi to samo (`render/`, `main.ts`, plik:linia), co jest lukami i które luki blokują adapter.

## PIN / RUST (tylko odczyt)
Pin: `grep -rn "setFog\|setOverlay\|renderMap\|applyView" gra/src/render gra/src/main.ts`. Rust: `renderer/src/`, `view-model/src/`.

## KRYTERIA KOŃCA
1. Tabela: DTO → wejście renderera (plik:linia) → odpowiednik pinu (plik:linia) | BRAK | ROZBIEŻNE.
2. Lista blokad (które producenty muszą być gotowe najpierw).
3. Propozycja podziału na wdrożenia z allowlistą. NIE wdrażaj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-ADAPTER-ROZP-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
