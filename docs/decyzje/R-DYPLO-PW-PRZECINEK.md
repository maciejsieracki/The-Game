# R-DYPLO-PW-PRZECINEK — czyste % Relacji w panelu PW dyplomacji

**Data:** 2026-08-04  
**Status:** WDROŻONE (prezentacja)  
**Powiązane:** R-SKARBIEC-PRZECINEK (`formatLiczbaPl` / `signedPl` w `gra/src/ui/formatPl.ts`)

## Problem

W panelu **Punkty wymiany (PW)** przy traktacie handlowym UI pokazywał śmieci zmiennoprzecinkowe, np.:

- `−10.400000000000006%` w badge wpływu Relacji
- `(baza 80, Relacja −10.400000000000006% siła)` przy PW gracza

Ta sama klasa błędu co w skarbcu miasta — interpolacja `number` do stringa bez zaokrąglenia wyświetlania.

## Decyzja

**Tylko prezentacja** — stan gry (Relacja, PW w silniku) liczy na pełnej precyzji. Zaokrąglenie:

- `relationPnModPct` → `Number(x.toFixed(1))` (1 miejsce po przecinku dla mod %)
- UI PW/Relacja → `formatLiczbaPl` (polski przecinek, obcięte zera)
- Etykiety w `game/diplomacy-pn-engine.ts` → lokalny `formatPctPl1` (bez importu z `ui/`)

## Pliki

- `gra/src/game/diplomacy-pn-engine.ts` — `relationPnModPct`, `formatRelationModLabel`
- `gra/src/ui/diplomacyAcceptanceBalance.ts` — panel stołu negocjacji
- `gra/tools/diplomacy-acceptance-points-test.cjs` — asercje @ rel 89.6

## Oczekiwany UI

`−10,4%` i `(baza 80, Relacja −10,4% siła)` zamiast długich resztek IEEE.
