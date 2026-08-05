# R-ARMIA-PASKI — niebieski pasek ruchu + etykiety w liście armii

**Status:** 🟢 ZDEPLOYOWANE FALA 247 (`540d2490`) · verify AutoBot 2026-08-05  
**Ekran:** lista armii na mapie (przycisk ⚔ w toolbarze)

## ECHO (cytat)
> Trzeba jakoś inaczej pokazać pozostałą ilość ruchów oraz energię, czy tam AP, bo jest to trochę mylące, nie wiadomo o co chodzi. Myślę, trzeba było zmienić kolor ruchu na niebieski.

## Problem
Lista armii (`armyListHud.ts`) pokazywała dwa paski jeden pod drugim — zdrowie (czerwień→zieleń) i ruch (gradient zielony). Przy pełnych wartościach oba wyglądały podobnie; dodatkowo liczby ruchu duplikowały się w `detailLine`.

## Wdrożenie (commit `50ff001`)
1. **Pasek ruchu** (`.al-mvbar i`) — gradient niebieski `#1d4e8f → #6fb0f0`.
2. **Etykiety nad paskami** (`.al-bar-lbl`) — „Zdrowie X/Y" i „Ruch X/Y" z wartościami po prawej.
3. **`detailLine`** (`main.ts`) — bez duplikatu „Ruch: X/Y"; zostaje tylko znacznik stosu (`armia`) i ostrzeżenie „Ruch wykorzystany w tej turze" przy `ruchLeft === 0`.

## Pliki
- `gra/src/ui/armyListHud.ts` — CSS `.al-mvbar`, render etykiet `.al-bar-lbl`
- `gra/src/main.ts` — budowa `ArmyListEntry` bez ruchu w `detailLine`

## AC (verify AutoBot PASS)
- [x] Gradient ruchu: `linear-gradient(90deg,#1d4e8f,#6fb0f0)` w źródle i bundlu ROBOCZA
- [x] Etykieta „Zdrowie" + wartość `hp/hpMax`
- [x] Etykieta „Ruch" + wartość `ruchLeft/ruchMax`
- [x] Brak „Ruch: X/Y" w `detailLine` (komentarz + logika `detailParts`)
- [x] `tsc --noEmit` 0
- [x] W bundlu ROBOCZA od FALA 247 `540d2490` (fix od `50ff001`)

## Tip playtestu
Mapa → ⚔ **Armie** → wiersz jednostki: nad paskami widać **ZDROWIE** (zielony/czerwony) i **RUCH** (niebieski); w opisie pod paskami nie ma już „Ruch: 3/3".

## AutoBot
VERIFY/CLOSE — Operator audyt statyczny + Evaluator PASS · **bez nowego deployu** (już w ROBOCZA).
