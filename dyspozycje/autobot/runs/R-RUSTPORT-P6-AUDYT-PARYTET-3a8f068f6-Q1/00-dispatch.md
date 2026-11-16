# DISPATCH R-RUSTPORT-P6-AUDYT-PARYTET-3a8f068f6-Q1 (runda 1) — audyt: co jest wpięte w produkcję, a co tylko wektory (#302)

MODEL: HAIKU (Operator), SONNET (Evaluator). Tylko odczyt i dokument, bez kodu, bez cargo.
BAZA: `origin/rust-port/parity-v2` = `9a71caf8a` (zawiera 1F3, 1F4, 1F5, F6, I2, I3, T2, T3). Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).

## PYTANIA
1. Dla każdego modułu `rust-port/engine/src/domain/*` (oraz `renderer/`, `view-model/`): czy ma produkcyjnego wołającego spoza testów? (`git grep -n "nazwa_funkcji" 9a71caf8a -- rust-port/engine/src ':!**/tests/**'`).
2. Lista tematów (pozycje tasków #96–#300 oznaczone "completed"), których kod leży w module bez produkcyjnego wołającego. To zestaw "wektory bez wpięcia".
3. Dla 5 największych luk: plik:linia w pinie i jednozdaniowy opis, co trzeba wpiąć.

## WYJŚCIE
- `dyspozycje/rust-port/p6/AUDYT-PARYTET-9a71caf8a.md` (NOWY): tabela modułów (wołający tak/nie), lista luk, rekomendacja kolejności wpięć.
- Raport w katalogu runu. Niepewne miejsca oznacz NIE_ZMIERZONO.

## ALLOWLISTA
- `dyspozycje/rust-port/p6/AUDYT-PARYTET-9a71caf8a.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUDYT-PARYTET-3a8f068f6-Q1/**`
