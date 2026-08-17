# P-PODBOJ-MIAST-PANSTW-TRIUMF-POPUP-Q1 — ceremonialny popup triumfu

**Data ECHO:** 2026-08-17  
**Status:** 🔵 W TRAKCIE — implementacja zapisana w commicie `ae5ef14b`

## Cytat Macieja

> „Zachować obecny warunek: popup po zajęciu ostatniego aktywnego miasta-państwa tego samego klucza kultury co gracz. Treść ceremonialna, np. „TRIUMF! Zjednoczyłeś całą kulturę [Kultura]. Ostatnie miasto-państwo — [Miasto] — znalazło się pod Twoją władzą.” Nie łączyć z przejściem do epoki Brązu.”

## Decyzja

**A** — zachować dokładny warunek ostatniego aktywnego miasta-państwa tej samej kultury co gracz i dopracować jego ceremonialny popup. Nie rozszerzać warunku na inne kultury ani nie zmieniać mechaniki epoki Brązu, podboju innych obiektów lub ogólnej dyplomacji.

## Zakres dowodu

- `gra/src/game/triumph-city-state.ts`
- `gra/src/ui/triumphCityStateNotice.ts`
- testy triumfu miast-państw: `triumph-city-state-test.cjs` 13/13, `triumph-city-state-notice-test.cjs` 16/16
- `npx tsc --noEmit`: PASS

