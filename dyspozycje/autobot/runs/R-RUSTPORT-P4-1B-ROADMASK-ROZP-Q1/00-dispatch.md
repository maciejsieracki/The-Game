# DISPATCH R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1 — ROZPOZNANIE, TYLKO ODCZYT (P4-1B / #211)

TEMAT: producent `MapViewDto` (P4-1B) — co trzeba przenieść z webu do Rust przed napisaniem producenta: `computeRoadMask`, `trimMediumRenderPathAtMain`/`trimMediumTailAlongMain`, `river_render_paths`. Decyzja D-DTO-4 = A (silnik liczy roadMask i trasy rzek).
DOMENA: GAME, DTO renderera (Opus). Model: OPUS we wszystkich rolach.
BAZA (jedyna obowiązująca): `f7baa3848`. Worktree detached. ZERO zmian kodu.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## PIN (tylko odczyt, `git show 07d2fbd72:...`)
`grep -rn "computeRoadMask\|trimMediumRenderPathAtMain\|trimMediumTailAlongMain\|roadMask\|river" gra/src` (render/, map/, main.ts). Zapisz plik:linia każdej funkcji i jej wejścia/wyjścia.

## RUST (tylko odczyt, `git grep` na f7baa3848)
`rust-port/view-model/src/map.rs` (typy MapViewDto/HexDynDto), `rust-port/engine/src/domain/` (czy są road/river/terrace), `rust-port/renderer/`.

## KRYTERIA KOŃCA
1. Tabela: funkcja pinu → wejścia → wyjście → odpowiednik Rust (plik:linia) | BRAK.
2. Lista wejść, których producent MapViewDto potrzebuje z modelu mapy (typy, pola).
3. Propozycja podziału na wdrożenia (nazwa, allowlista, wektory). Nie wdrażaj.
4. Niepewne: NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p4/P4-1B-ROADMASK-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
