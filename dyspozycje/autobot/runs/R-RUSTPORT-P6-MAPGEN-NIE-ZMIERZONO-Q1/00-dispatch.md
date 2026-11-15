# DISPATCH R-RUSTPORT-MAPGEN-NIE-ZMIERZONO-Q1 — DOKUMENT, BEZ KODU (#230 / #183)

TEMAT: brakujące wpisy M08, M13, M18 w rejestrze P6 jako NIE_ZMIERZONO.
DOMENA: PROCESS (dokument). Model: Operator HAIKU, Evaluator SONNET, Obrona HAIKU, FC SONNET.
BAZA (jedyna obowiązująca): `f7baa3848`. Nie zmieniaj kodu, `gra/`, `rust-port/**`, rejestru.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## CEL
Utworzyć NOWY plik `dyspozycje/rust-port/p6/MAPGEN-M08-M13-M18-NIE_ZMIERZONO.md` z trzema wpisami (M08, M13, M18): co jest w pinie (`gra/src/**` przy `07d2fbd72`, szukaj po treści), jaki jest stan Rust na `f7baa3848` (`rust-port/engine/src/domain/mapgen*`, `git grep`), oraz status: POKRYTE / BRAK / NIE_ZMIERZONO. Wzorzec: `dyspozycje/rust-port/p6/` i wpis M00 (`R-RUSTPORT-P6-M00-MAPGEN-SZKIELET-Q1`).

## KRYTERIA KOŃCA
1. Trzy wpisy M08/M13/M18 z plik:linia pinu i Rust albo jawnym „brak”.
2. Pole status ograniczone do POKRYTE / BRAK / NIE_ZMIERZONO; zero domysłów.
3. `git diff --check` czysty; `git diff --name-only` = dokładnie allowlista.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/MAPGEN-M08-M13-M18-NIE_ZMIERZONO.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-MAPGEN-NIE-ZMIERZONO-Q1/**`

Commit jawnym `git add`. NIE `git add -A`. Bez push do parity.
