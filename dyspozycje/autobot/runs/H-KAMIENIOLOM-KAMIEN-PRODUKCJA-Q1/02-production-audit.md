# Audyt produkcji surowców terytorialnych

Temat: `H-KAMIENIOLOM-KAMIEN-PRODUKCJA-Q1`  
Stan: po implementacji Operatora, 2026-09-08

## Reguła naliczania

Rzeczywista ścieżka to:

`main.ts::empireEpochForOwner` → `advanceCityEconomy` →
`computeTerritoryResourceYieldByCity` →
`territoryResourceYieldForImprovement`.

Produkcja jest naliczana za każde zbudowane ulepszenie w terytorium właściciela,
niezależnie od obsadzenia pola. Dla Tartaku i Kamieniołomu obowiązuje:

`wartość = baza × 1,5^(epoka−1)` dla epok 1–3.

Epoka 0 i wartości niepoprawne są bezpiecznie normalizowane do epoki 1.
Pozostałe ulepszenia zachowują dotychczasowe, płaskie stawki.

## Pełna lista ulepszeń produkujących surowiec

| Ulepszenie | klucz | Surowiec | Baza/turę | Epoka 1 | Epoka 2 | Epoka 3 |
|---|---|---|---:|---:|---:|---:|
| Tartak | `tartak` | Drewno | 200 | 200 | 300 | 450 |
| Kamieniołom | `kamieniolom` | Kamień | 200 | 200 | 300 | 450 |
| Glinianka | `glinianka` | Glina | 50 | 50 | 50 | 50 |
| Kopalnia miedzi | `kopalnia_miedzi` | Ruda miedzi | 20 | 20 | 20 | 20 |
| Kopalnia żelaza | `kopalnia_zelaza` | Ruda żelaza | 20 | 20 | 20 | 20 |
| Kopalnia cyny | `kopalnia_cyny` | Ruda cyny | 20 | 20 | 20 | 20 |
| Warzelnia soli | `warzelnia_soli` | Sól | 50 | 50 | 50 | 50 |
| Stadnina | `stadnina` | Koń | 25 | 25 | 25 | 25 |
| Kopalnia złota | `kopalnia_zlota` | Złoto | 1 | 1 | 1 | 1 |

„Baza” oznacza wartość `surowiec_ilosc_tura` w
`gra/data/terrain-improvements.json`; dla każdej pozycji resolver zwraca
wskazany surowiec, a naliczanie sumuje wpisy per miasto/właściciel.

## Kamieniołomy — sumowanie

| Liczba Kamieniołomów | Epoka 1 | Epoka 2 | Epoka 3 |
|---:|---:|---:|---:|
| 0 | 0 | 0 | 0 |
| 1 | 200 | 300 | 450 |
| 2 | 400 | 600 | 900 |

Weryfikację wykonuje `gra/tools/kamieniolom-kamien-epoka-test.cjs` na realnym
resolverze i realnym `computeTerritoryResourceYieldByCity`.
