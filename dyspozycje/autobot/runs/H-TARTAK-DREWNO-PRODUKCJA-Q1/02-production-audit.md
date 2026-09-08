# Audyt produkcji surowców — H-TARTAK-DREWNO-PRODUKCJA-Q1

Źródło po zmianie: `gra/data/terrain-improvements.json` oraz rzeczywisty resolver
`computeTerritoryResourceYieldByCity()` → `territoryResourceYieldForImprovement()`.
Surowce są przypisywane do najbliższego miasta właściciela z terytorium; produkcja
nie wymaga obsadzenia heksa. Epoka pochodzi z resolvera właściciela przekazanego do
silnika (`empireEpochForOwner` w `main.ts`).

## Wszystkie ulepszenia produkujące surowiec terytorialny

| Ulepszenie | Surowiec | Baza / epoka 1 | Epoka 2 | Epoka 3 |
|---|---:|---:|---:|---:|
| Tartak | Drewno (`drewno`) | 200 | 300 | 450 |
| Kamieniołom | Kamień (`kamien`) | 50 | 50 | 50 |
| Glinianka | Glina (`glina`) | 50 | 50 | 50 |
| Kopalnia miedzi | Ruda (`ruda`) | 20 | 20 | 20 |
| Kopalnia żelaza | Ruda żelaza (`ruda_zelaza`) | 20 | 20 | 20 |
| Kopalnia cyny | Ruda cyny (`ruda_cyny`) | 20 | 20 | 20 |
| Warzelnia soli | Sól (`sol`) | 50 | 50 | 50 |
| Stadnina | Koń (`kon`) | 25 | 25 | 25 |
| Kopalnia złota | Złoto (`zloto`) | 1 | 1 | 1 |

Tylko Tartak jest skalowany w tym temacie: `200 × 1.5^(epoka-1)`, czyli
200/300/450. Pozostałe stawki nie zostały zmienione ani pomnożone.

## Sumy dla wielu Tartaków

| Liczba Tartaków | Epoka 1 | Epoka 2 | Epoka 3 |
|---:|---:|---:|---:|
| 0 | 0 | 0 | 0 |
| 1 | 200 | 300 | 450 |
| 2 | 400 | 600 | 900 |

Sumy są addytywne per zbudowane ulepszenie i trafiają do puli surowca właściciela.
Test obejmuje również: jawny przypadek niepoprawnej epoki 0 (bezpieczny fallback do
epoki 1), wykonywalną mutację formuły `Math.pow(1.5, era - 1)` →
`Math.pow(1.0, era - 1)` (4 czerwone przypadki, bez zmian produkcyjnych po teście),
mutację mapy (dodanie drugiego Tartaku zmienia wynik E3 z 450 na 900) oraz regresję
Kamieniołomu (50 w każdej epoce).

## Zakres i ograniczenia

- `Wycinka` nie jest ulepszeniem produkcji ciągłej; jej jednorazowe +50 Drewna
  pozostaje poza tą tabelą.
- Bonusy `TileYield` (np. `bonus.praca`) nie są tym kanałem magazynowym.
- Brak zmian w innych ulepszeniach, surowcach, rejestrach i dokumentach procesu.
