# DISPATCH R-RUSTPORT-P4-1C-FOG-ROZP-Q1 — ROZPOZNANIE, TYLKO ODCZYT (P4-1C / #212)

DOMENA: GAME, DTO renderera (mgła). MODEL: OPUS we wszystkich rolach. ZERO zmian kodu.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` w chwili startu (zapisz SHA). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
Przygotowanie producenta `FogViewDto` (#212, `compute_player_visibility`): co web przekazuje do `setFog` (w tym `ALL_KEYS`, `landReveal`, `riverRevealKeys`, opcje `useFogRender`, `fogOn`), co Rust ma (`compute_player_visibility`, typy w `rust-port/view-model`), różnice i luki.

## PIN (tylko odczyt)
`grep -rn "setFog\|useFogRender\|landReveal\|riverRevealKeys\|ALL_KEYS\|fogOn" gra/src` (main.ts ok. :13484-13506, scene.ts). Zapisz plik:linia.
## RUST (tylko odczyt, `git grep` na bazie)
`compute_player_visibility`, `FogViewDto`, `view-model/src/`, `renderer/`.

## KRYTERIA KOŃCA
1. Tabela: wejście pinu (plik:linia) → znaczenie → odpowiednik Rust (plik:linia) | BRAK | ROZBIEŻNE.
2. Lista pól `FogViewDto` potrzebnych rendererowi, z wejściami z modelu.
3. Propozycja podziału na wdrożenia (nazwa, allowlista, wektory). NIE wdrażaj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p4/P4-1C-FOG-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1C-FOG-ROZP-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
