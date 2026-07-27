# C-UPGRADE-KUMULACJA — skąd jednostka bierze bonusy budynków wojskowych

**Status:** 🟢 **WDROŻONA**  
**Mapowanie:** pytanie numerowane **1A** (Maciej 2026-07-25)

## Decyzja

**A — Najlepsze odwiedzone miasto** (nie kumulacja ze wszystkich miast, nie tylko miasto produkcji).

Jednostka „pamięta" najwyższy bonus z dowolnego **własnego** miasta, w którym **weszła lub przeszła** (każdy heks miasta na ścieżce ruchu; parytet AI). **Nie** na koniec tury — patrz `C-UPGRADE-TRIGGER.md`.

## Dowód wdrożenia

- `gra/src/game/unit-building-bonuses.ts` — `bestBuildingProgressAfterCityVisit`, `applyCityVisitBonusGain`
- `gra/src/main.ts` — `applyCityVisitBonusesAlongPath` / `applyCityVisitBonusesAtHex`

## Uwaga rejestru

REJESTR §MNOŻNIKI 2026-07-25 linia „OTWARTE: C-UPGRADE-KUMULACJA" była **sprzeczna** z odpowiedzią **1A** w tym samym pliku — zsynchronizowano 2026-07-27.
