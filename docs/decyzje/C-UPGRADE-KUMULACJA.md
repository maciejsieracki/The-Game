# C-UPGRADE-KUMULACJA — skąd jednostka bierze bonusy budynków wojskowych

**Status:** 🟢 **WDROŻONA**  
**Mapowanie:** pytanie numerowane **1A** (Maciej 2026-07-25)

## Decyzja

**A — Najlepsze odwiedzone miasto** (nie kumulacja ze wszystkich miast, nie tylko miasto produkcji).

Jednostka „pamięta" najwyższy bonus z dowolnego **własnego** miasta, w którym stanęła (koniec tury, parytet AI).

## Dowód wdrożenia

- `gra/src/game/unit-building-bonuses.ts` — `bestBuildingProgressAfterCityVisit`
- `gra/src/main.ts` (~5976) — wołanie po wizycie w mieście

## Uwaga rejestru

REJESTR §MNOŻNIKI 2026-07-25 linia „OTWARTE: C-UPGRADE-KUMULACJA" była **sprzeczna** z odpowiedzią **1A** w tym samym pliku — zsynchronizowano 2026-07-27.
