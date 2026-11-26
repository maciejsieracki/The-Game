# MODEL 2 — silnik gry (bundle), propozycja właściciela 2026-11-26 (korekta)

## 0. Granice linii (D = miasto w całości obce, G = w całości własne), skala epok

| poziom | epoka | mnożnik | D na linię | G na linię | 2 linie: min (obca+obca) | 2 linie: max (własna+własna) |
|---|---|---|---|---|---|---|
| easy | 1 | ×1 | -10 | 10 | -20 | 20 |
| easy | 2 | ×1.6 | -16 | 16 | -32 | 32 |
| easy | 3 | ×2.3 | -23 | 23 | -46 | 46 |
| normal | 1 | ×1 | -15 | 5 | -30 | 10 |
| normal | 2 | ×1.6 | -24 | 8 | -48 | 16 |
| normal | 3 | ×2.3 | -34.5 | 11.5 | -69 | 23 |
| hard | 1 | ×1 | -20 | 0 | -40 | 0 |
| hard | 2 | ×1.6 | -32 | 0 | -64 | 0 |
| hard | 3 | ×2.3 | -46 | 0 | -92 | 0 |

Mnożniki z society-params.json (szczescie_skala_kultura_religia normal = 10/16/23): 1 / 1.6 / 2.3

## 1. Pełna tabela (PROP, obcięcie Szczęścia od 0% jak dziś): min jednostek garnizonu
kolumny: neutral = Porządek ≥ 30 (tier neutralny); wyjście = Porządek ≥ próg buntu skrajnego (per poziom: easy 6, normal 12, hard 14)

poziom | epoka | pop | scen. | budynki | neutral | wyjście z buntu skrajnego
---|---|---|---|---|---|---
easy | 1 | 3 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
easy | 1 | 3 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
easy | 1 | 3 | b (obca kult., wlasna relig.) | bez | 1 | 0
easy | 1 | 3 | b (obca kult., wlasna relig.) | Garn | 0 | 0
easy | 1 | 3 | c (wlasna kult., obca relig.) | bez | 1 | 0
easy | 1 | 3 | c (wlasna kult., obca relig.) | Garn | 0 | 0
easy | 1 | 3 | d (obca kult. + obca relig.) | bez | 2 | 1
easy | 1 | 3 | d (obca kult. + obca relig.) | Garn | 1 | 0
easy | 1 | 5 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
easy | 1 | 5 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
easy | 1 | 5 | b (obca kult., wlasna relig.) | bez | 2 | 1
easy | 1 | 5 | b (obca kult., wlasna relig.) | Garn | 1 | 0
easy | 1 | 5 | c (wlasna kult., obca relig.) | bez | 2 | 1
easy | 1 | 5 | c (wlasna kult., obca relig.) | Garn | 1 | 0
easy | 1 | 5 | d (obca kult. + obca relig.) | bez | 2 | 2
easy | 1 | 5 | d (obca kult. + obca relig.) | Garn | 1 | 1
easy | 1 | 8 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
easy | 1 | 8 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
easy | 1 | 8 | b (obca kult., wlasna relig.) | bez | 2 | 1
easy | 1 | 8 | b (obca kult., wlasna relig.) | Garn | 1 | 0
easy | 1 | 8 | c (wlasna kult., obca relig.) | bez | 2 | 1
easy | 1 | 8 | c (wlasna kult., obca relig.) | Garn | 1 | 0
easy | 1 | 8 | d (obca kult. + obca relig.) | bez | 2 | 2
easy | 1 | 8 | d (obca kult. + obca relig.) | Garn | 1 | 1
easy | 2 | 3 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
easy | 2 | 3 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
easy | 2 | 3 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
easy | 2 | 3 | b (obca kult., wlasna relig.) | bez | 2 | 0
easy | 2 | 3 | b (obca kult., wlasna relig.) | Garn | 0 | 0
easy | 2 | 3 | b (obca kult., wlasna relig.) | Swi+Garn | 0 | 0
easy | 2 | 3 | c (wlasna kult., obca relig.) | bez | 2 | 0
easy | 2 | 3 | c (wlasna kult., obca relig.) | Garn | 0 | 0
easy | 2 | 3 | c (wlasna kult., obca relig.) | Swi+Garn | 0 | 0
easy | 2 | 3 | d (obca kult. + obca relig.) | bez | 3 | 2
easy | 2 | 3 | d (obca kult. + obca relig.) | Garn | 2 | 0
easy | 2 | 3 | d (obca kult. + obca relig.) | Swi+Garn | 2 | 0
easy | 2 | 5 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
easy | 2 | 5 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
easy | 2 | 5 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
easy | 2 | 5 | b (obca kult., wlasna relig.) | bez | 2 | 1
easy | 2 | 5 | b (obca kult., wlasna relig.) | Garn | 1 | 0
easy | 2 | 5 | b (obca kult., wlasna relig.) | Swi+Garn | 1 | 0
easy | 2 | 5 | c (wlasna kult., obca relig.) | bez | 2 | 1
easy | 2 | 5 | c (wlasna kult., obca relig.) | Garn | 1 | 0
easy | 2 | 5 | c (wlasna kult., obca relig.) | Swi+Garn | 1 | 0
easy | 2 | 5 | d (obca kult. + obca relig.) | bez | 3 | 2
easy | 2 | 5 | d (obca kult. + obca relig.) | Garn | 2 | 1
easy | 2 | 5 | d (obca kult. + obca relig.) | Swi+Garn | 2 | 1
easy | 2 | 8 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
easy | 2 | 8 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
easy | 2 | 8 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
easy | 2 | 8 | b (obca kult., wlasna relig.) | bez | 2 | 1
easy | 2 | 8 | b (obca kult., wlasna relig.) | Garn | 1 | 0
easy | 2 | 8 | b (obca kult., wlasna relig.) | Swi+Garn | 1 | 0
easy | 2 | 8 | c (wlasna kult., obca relig.) | bez | 2 | 1
easy | 2 | 8 | c (wlasna kult., obca relig.) | Garn | 1 | 0
easy | 2 | 8 | c (wlasna kult., obca relig.) | Swi+Garn | 1 | 0
easy | 2 | 8 | d (obca kult. + obca relig.) | bez | 4 | 2
easy | 2 | 8 | d (obca kult. + obca relig.) | Garn | 2 | 1
easy | 2 | 8 | d (obca kult. + obca relig.) | Swi+Garn | 2 | 1
easy | 3 | 3 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
easy | 3 | 3 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
easy | 3 | 3 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
easy | 3 | 3 | a (wlasna kult. + wlasna relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 3 | b (obca kult., wlasna relig.) | bez | 2 | 1
easy | 3 | 3 | b (obca kult., wlasna relig.) | Garn | 0 | 0
easy | 3 | 3 | b (obca kult., wlasna relig.) | Swi+Garn | 0 | 0
easy | 3 | 3 | b (obca kult., wlasna relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 3 | c (wlasna kult., obca relig.) | bez | 2 | 1
easy | 3 | 3 | c (wlasna kult., obca relig.) | Garn | 0 | 0
easy | 3 | 3 | c (wlasna kult., obca relig.) | Swi+Garn | 0 | 0
easy | 3 | 3 | c (wlasna kult., obca relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 3 | d (obca kult. + obca relig.) | bez | 4 | 3
easy | 3 | 3 | d (obca kult. + obca relig.) | Garn | 2 | 1
easy | 3 | 3 | d (obca kult. + obca relig.) | Swi+Garn | 2 | 1
easy | 3 | 3 | d (obca kult. + obca relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 5 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
easy | 3 | 5 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
easy | 3 | 5 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
easy | 3 | 5 | a (wlasna kult. + wlasna relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 5 | b (obca kult., wlasna relig.) | bez | 3 | 1
easy | 3 | 5 | b (obca kult., wlasna relig.) | Garn | 1 | 0
easy | 3 | 5 | b (obca kult., wlasna relig.) | Swi+Garn | 1 | 0
easy | 3 | 5 | b (obca kult., wlasna relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 5 | c (wlasna kult., obca relig.) | bez | 3 | 1
easy | 3 | 5 | c (wlasna kult., obca relig.) | Garn | 1 | 0
easy | 3 | 5 | c (wlasna kult., obca relig.) | Swi+Garn | 1 | 0
easy | 3 | 5 | c (wlasna kult., obca relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 5 | d (obca kult. + obca relig.) | bez | 5 | 3
easy | 3 | 5 | d (obca kult. + obca relig.) | Garn | 3 | 1
easy | 3 | 5 | d (obca kult. + obca relig.) | Swi+Garn | 3 | 1
easy | 3 | 5 | d (obca kult. + obca relig.) | Swi+Garn+Pret | 1 | 0
easy | 3 | 8 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
easy | 3 | 8 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
easy | 3 | 8 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
easy | 3 | 8 | a (wlasna kult. + wlasna relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 8 | b (obca kult., wlasna relig.) | bez | 3 | 1
easy | 3 | 8 | b (obca kult., wlasna relig.) | Garn | 1 | 0
easy | 3 | 8 | b (obca kult., wlasna relig.) | Swi+Garn | 1 | 0
easy | 3 | 8 | b (obca kult., wlasna relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 8 | c (wlasna kult., obca relig.) | bez | 3 | 1
easy | 3 | 8 | c (wlasna kult., obca relig.) | Garn | 1 | 0
easy | 3 | 8 | c (wlasna kult., obca relig.) | Swi+Garn | 1 | 0
easy | 3 | 8 | c (wlasna kult., obca relig.) | Swi+Garn+Pret | 0 | 0
easy | 3 | 8 | d (obca kult. + obca relig.) | bez | 5 | 3
easy | 3 | 8 | d (obca kult. + obca relig.) | Garn | 3 | 1
easy | 3 | 8 | d (obca kult. + obca relig.) | Swi+Garn | 3 | 1
easy | 3 | 8 | d (obca kult. + obca relig.) | Swi+Garn+Pret | 1 | 0
normal | 1 | 3 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
normal | 1 | 3 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
normal | 1 | 3 | b (obca kult., wlasna relig.) | bez | 2 | 1
normal | 1 | 3 | b (obca kult., wlasna relig.) | Garn | 1 | 0
normal | 1 | 3 | c (wlasna kult., obca relig.) | bez | 2 | 1
normal | 1 | 3 | c (wlasna kult., obca relig.) | Garn | 1 | 0
normal | 1 | 3 | d (obca kult. + obca relig.) | bez | 3 | 2
normal | 1 | 3 | d (obca kult. + obca relig.) | Garn | 2 | 1
normal | 1 | 5 | a (wlasna kult. + wlasna relig.) | bez | 1 | 0
normal | 1 | 5 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
normal | 1 | 5 | b (obca kult., wlasna relig.) | bez | 2 | 2
normal | 1 | 5 | b (obca kult., wlasna relig.) | Garn | 1 | 0
normal | 1 | 5 | c (wlasna kult., obca relig.) | bez | 2 | 2
normal | 1 | 5 | c (wlasna kult., obca relig.) | Garn | 1 | 0
normal | 1 | 5 | d (obca kult. + obca relig.) | bez | 3 | 3
normal | 1 | 5 | d (obca kult. + obca relig.) | Garn | 2 | 1
normal | 1 | 8 | a (wlasna kult. + wlasna relig.) | bez | 1 | 0
normal | 1 | 8 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
normal | 1 | 8 | b (obca kult., wlasna relig.) | bez | 3 | 2
normal | 1 | 8 | b (obca kult., wlasna relig.) | Garn | 1 | 0
normal | 1 | 8 | c (wlasna kult., obca relig.) | bez | 3 | 2
normal | 1 | 8 | c (wlasna kult., obca relig.) | Garn | 1 | 0
normal | 1 | 8 | d (obca kult. + obca relig.) | bez | 4 | 3
normal | 1 | 8 | d (obca kult. + obca relig.) | Garn | 2 | 1
normal | 2 | 3 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
normal | 2 | 3 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
normal | 2 | 3 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
normal | 2 | 3 | b (obca kult., wlasna relig.) | bez | 3 | 2
normal | 2 | 3 | b (obca kult., wlasna relig.) | Garn | 1 | 0
normal | 2 | 3 | b (obca kult., wlasna relig.) | Swi+Garn | 1 | 0
normal | 2 | 3 | c (wlasna kult., obca relig.) | bez | 3 | 2
normal | 2 | 3 | c (wlasna kult., obca relig.) | Garn | 1 | 0
normal | 2 | 3 | c (wlasna kult., obca relig.) | Swi+Garn | 1 | 0
normal | 2 | 3 | d (obca kult. + obca relig.) | bez | 5 | 4
normal | 2 | 3 | d (obca kult. + obca relig.) | Garn | 3 | 2
normal | 2 | 3 | d (obca kult. + obca relig.) | Swi+Garn | 3 | 2
normal | 2 | 5 | a (wlasna kult. + wlasna relig.) | bez | 1 | 0
normal | 2 | 5 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
normal | 2 | 5 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
normal | 2 | 5 | b (obca kult., wlasna relig.) | bez | 3 | 2
normal | 2 | 5 | b (obca kult., wlasna relig.) | Garn | 2 | 0
normal | 2 | 5 | b (obca kult., wlasna relig.) | Swi+Garn | 2 | 0
normal | 2 | 5 | c (wlasna kult., obca relig.) | bez | 3 | 2
normal | 2 | 5 | c (wlasna kult., obca relig.) | Garn | 2 | 0
normal | 2 | 5 | c (wlasna kult., obca relig.) | Swi+Garn | 2 | 0
normal | 2 | 5 | d (obca kult. + obca relig.) | bez | 5 | 4
normal | 2 | 5 | d (obca kult. + obca relig.) | Garn | 3 | 2
normal | 2 | 5 | d (obca kult. + obca relig.) | Swi+Garn | 3 | 2
normal | 2 | 8 | a (wlasna kult. + wlasna relig.) | bez | 1 | 0
normal | 2 | 8 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
normal | 2 | 8 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
normal | 2 | 8 | b (obca kult., wlasna relig.) | bez | 4 | 2
normal | 2 | 8 | b (obca kult., wlasna relig.) | Garn | 2 | 1
normal | 2 | 8 | b (obca kult., wlasna relig.) | Swi+Garn | 2 | 1
normal | 2 | 8 | c (wlasna kult., obca relig.) | bez | 4 | 2
normal | 2 | 8 | c (wlasna kult., obca relig.) | Garn | 2 | 1
normal | 2 | 8 | c (wlasna kult., obca relig.) | Swi+Garn | 2 | 1
normal | 2 | 8 | d (obca kult. + obca relig.) | bez | 5 | 4
normal | 2 | 8 | d (obca kult. + obca relig.) | Garn | 4 | 2
normal | 2 | 8 | d (obca kult. + obca relig.) | Swi+Garn | 4 | 2
normal | 3 | 3 | a (wlasna kult. + wlasna relig.) | bez | 0 | 0
normal | 3 | 3 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
normal | 3 | 3 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
normal | 3 | 3 | a (wlasna kult. + wlasna relig.) | Swi+Garn+Pret | 0 | 0
normal | 3 | 3 | b (obca kult., wlasna relig.) | bez | 4 | 3
normal | 3 | 3 | b (obca kult., wlasna relig.) | Garn | 2 | 0
normal | 3 | 3 | b (obca kult., wlasna relig.) | Swi+Garn | 2 | 0
normal | 3 | 3 | b (obca kult., wlasna relig.) | Swi+Garn+Pret | 0 | 0
normal | 3 | 3 | c (wlasna kult., obca relig.) | bez | 4 | 3
normal | 3 | 3 | c (wlasna kult., obca relig.) | Garn | 2 | 0
normal | 3 | 3 | c (wlasna kult., obca relig.) | Swi+Garn | 2 | 0
normal | 3 | 3 | c (wlasna kult., obca relig.) | Swi+Garn+Pret | 0 | 0
normal | 3 | 3 | d (obca kult. + obca relig.) | bez | brak | 5
normal | 3 | 3 | d (obca kult. + obca relig.) | Garn | 4 | 2
normal | 3 | 3 | d (obca kult. + obca relig.) | Swi+Garn | 4 | 2
normal | 3 | 3 | d (obca kult. + obca relig.) | Swi+Garn+Pret | 2 | 1
normal | 3 | 5 | a (wlasna kult. + wlasna relig.) | bez | 1 | 0
normal | 3 | 5 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
normal | 3 | 5 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
normal | 3 | 5 | a (wlasna kult. + wlasna relig.) | Swi+Garn+Pret | 0 | 0
normal | 3 | 5 | b (obca kult., wlasna relig.) | bez | 4 | 3
normal | 3 | 5 | b (obca kult., wlasna relig.) | Garn | 2 | 0
normal | 3 | 5 | b (obca kult., wlasna relig.) | Swi+Garn | 2 | 0
normal | 3 | 5 | b (obca kult., wlasna relig.) | Swi+Garn+Pret | 0 | 0
normal | 3 | 5 | c (wlasna kult., obca relig.) | bez | 4 | 3
normal | 3 | 5 | c (wlasna kult., obca relig.) | Garn | 2 | 0
normal | 3 | 5 | c (wlasna kult., obca relig.) | Swi+Garn | 2 | 0
normal | 3 | 5 | c (wlasna kult., obca relig.) | Swi+Garn+Pret | 0 | 0
normal | 3 | 5 | d (obca kult. + obca relig.) | bez | brak | 5
normal | 3 | 5 | d (obca kult. + obca relig.) | Garn | 4 | 3
normal | 3 | 5 | d (obca kult. + obca relig.) | Swi+Garn | 4 | 3
normal | 3 | 5 | d (obca kult. + obca relig.) | Swi+Garn+Pret | 3 | 1
normal | 3 | 8 | a (wlasna kult. + wlasna relig.) | bez | 2 | 0
normal | 3 | 8 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
normal | 3 | 8 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
normal | 3 | 8 | a (wlasna kult. + wlasna relig.) | Swi+Garn+Pret | 0 | 0
normal | 3 | 8 | b (obca kult., wlasna relig.) | bez | 5 | 3
normal | 3 | 8 | b (obca kult., wlasna relig.) | Garn | 3 | 1
normal | 3 | 8 | b (obca kult., wlasna relig.) | Swi+Garn | 3 | 1
normal | 3 | 8 | b (obca kult., wlasna relig.) | Swi+Garn+Pret | 1 | 0
normal | 3 | 8 | c (wlasna kult., obca relig.) | bez | 5 | 3
normal | 3 | 8 | c (wlasna kult., obca relig.) | Garn | 3 | 1
normal | 3 | 8 | c (wlasna kult., obca relig.) | Swi+Garn | 3 | 1
normal | 3 | 8 | c (wlasna kult., obca relig.) | Swi+Garn+Pret | 1 | 0
normal | 3 | 8 | d (obca kult. + obca relig.) | bez | brak | 5
normal | 3 | 8 | d (obca kult. + obca relig.) | Garn | 5 | 3
normal | 3 | 8 | d (obca kult. + obca relig.) | Swi+Garn | 5 | 3
normal | 3 | 8 | d (obca kult. + obca relig.) | Swi+Garn+Pret | 3 | 1
hard | 1 | 3 | a (wlasna kult. + wlasna relig.) | bez | 2 | 1
hard | 1 | 3 | a (wlasna kult. + wlasna relig.) | Garn | 0 | 0
hard | 1 | 3 | b (obca kult., wlasna relig.) | bez | 3 | 2
hard | 1 | 3 | b (obca kult., wlasna relig.) | Garn | 2 | 1
hard | 1 | 3 | c (wlasna kult., obca relig.) | bez | 3 | 2
hard | 1 | 3 | c (wlasna kult., obca relig.) | Garn | 2 | 1
hard | 1 | 3 | d (obca kult. + obca relig.) | bez | brak | 4
hard | 1 | 3 | d (obca kult. + obca relig.) | Garn | 3 | 2
hard | 1 | 5 | a (wlasna kult. + wlasna relig.) | bez | 2 | 1
hard | 1 | 5 | a (wlasna kult. + wlasna relig.) | Garn | 1 | 0
hard | 1 | 5 | b (obca kult., wlasna relig.) | bez | 4 | 3
hard | 1 | 5 | b (obca kult., wlasna relig.) | Garn | 2 | 1
hard | 1 | 5 | c (wlasna kult., obca relig.) | bez | 4 | 3
hard | 1 | 5 | c (wlasna kult., obca relig.) | Garn | 2 | 1
hard | 1 | 5 | d (obca kult. + obca relig.) | bez | brak | 4
hard | 1 | 5 | d (obca kult. + obca relig.) | Garn | 3 | 2
hard | 1 | 8 | a (wlasna kult. + wlasna relig.) | bez | 3 | 1
hard | 1 | 8 | a (wlasna kult. + wlasna relig.) | Garn | 1 | 0
hard | 1 | 8 | b (obca kult., wlasna relig.) | bez | 4 | 3
hard | 1 | 8 | b (obca kult., wlasna relig.) | Garn | 2 | 1
hard | 1 | 8 | c (wlasna kult., obca relig.) | bez | 4 | 3
hard | 1 | 8 | c (wlasna kult., obca relig.) | Garn | 2 | 1
hard | 1 | 8 | d (obca kult. + obca relig.) | bez | brak | 4
hard | 1 | 8 | d (obca kult. + obca relig.) | Garn | 4 | 2
hard | 2 | 3 | a (wlasna kult. + wlasna relig.) | bez | 3 | 1
hard | 2 | 3 | a (wlasna kult. + wlasna relig.) | Garn | 1 | 0
hard | 2 | 3 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 0 | 0
hard | 2 | 3 | b (obca kult., wlasna relig.) | bez | brak | 4
hard | 2 | 3 | b (obca kult., wlasna relig.) | Garn | 3 | 1
hard | 2 | 3 | b (obca kult., wlasna relig.) | Swi+Garn | 3 | 1
hard | 2 | 3 | c (wlasna kult., obca relig.) | bez | brak | 4
hard | 2 | 3 | c (wlasna kult., obca relig.) | Garn | 3 | 1
hard | 2 | 3 | c (wlasna kult., obca relig.) | Swi+Garn | 3 | 1
hard | 2 | 3 | d (obca kult. + obca relig.) | bez | brak | brak
hard | 2 | 3 | d (obca kult. + obca relig.) | Garn | brak | 4
hard | 2 | 3 | d (obca kult. + obca relig.) | Swi+Garn | brak | 4
hard | 2 | 5 | a (wlasna kult. + wlasna relig.) | bez | 4 | 2
hard | 2 | 5 | a (wlasna kult. + wlasna relig.) | Garn | 1 | 0
hard | 2 | 5 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 1 | 0
hard | 2 | 5 | b (obca kult., wlasna relig.) | bez | brak | 4
hard | 2 | 5 | b (obca kult., wlasna relig.) | Garn | 3 | 2
hard | 2 | 5 | b (obca kult., wlasna relig.) | Swi+Garn | 3 | 2
hard | 2 | 5 | c (wlasna kult., obca relig.) | bez | brak | 4
hard | 2 | 5 | c (wlasna kult., obca relig.) | Garn | 3 | 2
hard | 2 | 5 | c (wlasna kult., obca relig.) | Swi+Garn | 3 | 2
hard | 2 | 5 | d (obca kult. + obca relig.) | bez | brak | brak
hard | 2 | 5 | d (obca kult. + obca relig.) | Garn | brak | 4
hard | 2 | 5 | d (obca kult. + obca relig.) | Swi+Garn | brak | 4
hard | 2 | 8 | a (wlasna kult. + wlasna relig.) | bez | 4 | 2
hard | 2 | 8 | a (wlasna kult. + wlasna relig.) | Garn | 2 | 0
hard | 2 | 8 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 2 | 0
hard | 2 | 8 | b (obca kult., wlasna relig.) | bez | brak | 4
hard | 2 | 8 | b (obca kult., wlasna relig.) | Garn | 4 | 2
hard | 2 | 8 | b (obca kult., wlasna relig.) | Swi+Garn | 4 | 2
hard | 2 | 8 | c (wlasna kult., obca relig.) | bez | brak | 4
hard | 2 | 8 | c (wlasna kult., obca relig.) | Garn | 4 | 2
hard | 2 | 8 | c (wlasna kult., obca relig.) | Swi+Garn | 4 | 2
hard | 2 | 8 | d (obca kult. + obca relig.) | bez | brak | brak
hard | 2 | 8 | d (obca kult. + obca relig.) | Garn | brak | 4
hard | 2 | 8 | d (obca kult. + obca relig.) | Swi+Garn | brak | 4
hard | 3 | 3 | a (wlasna kult. + wlasna relig.) | bez | 4 | 2
hard | 3 | 3 | a (wlasna kult. + wlasna relig.) | Garn | 1 | 0
hard | 3 | 3 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 1 | 0
hard | 3 | 3 | a (wlasna kult. + wlasna relig.) | Swi+Garn+Pret | 0 | 0
hard | 3 | 3 | b (obca kult., wlasna relig.) | bez | brak | brak
hard | 3 | 3 | b (obca kult., wlasna relig.) | Garn | 4 | 2
hard | 3 | 3 | b (obca kult., wlasna relig.) | Swi+Garn | 4 | 2
hard | 3 | 3 | b (obca kult., wlasna relig.) | Swi+Garn+Pret | 2 | 0
hard | 3 | 3 | c (wlasna kult., obca relig.) | bez | brak | brak
hard | 3 | 3 | c (wlasna kult., obca relig.) | Garn | 4 | 2
hard | 3 | 3 | c (wlasna kult., obca relig.) | Swi+Garn | 4 | 2
hard | 3 | 3 | c (wlasna kult., obca relig.) | Swi+Garn+Pret | 2 | 0
hard | 3 | 3 | d (obca kult. + obca relig.) | bez | brak | brak
hard | 3 | 3 | d (obca kult. + obca relig.) | Garn | brak | brak
hard | 3 | 3 | d (obca kult. + obca relig.) | Swi+Garn | brak | brak
hard | 3 | 3 | d (obca kult. + obca relig.) | Swi+Garn+Pret | brak | 3
hard | 3 | 5 | a (wlasna kult. + wlasna relig.) | bez | brak | 2
hard | 3 | 5 | a (wlasna kult. + wlasna relig.) | Garn | 1 | 0
hard | 3 | 5 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 1 | 0
hard | 3 | 5 | a (wlasna kult. + wlasna relig.) | Swi+Garn+Pret | 0 | 0
hard | 3 | 5 | b (obca kult., wlasna relig.) | bez | brak | brak
hard | 3 | 5 | b (obca kult., wlasna relig.) | Garn | 4 | 2
hard | 3 | 5 | b (obca kult., wlasna relig.) | Swi+Garn | 4 | 2
hard | 3 | 5 | b (obca kult., wlasna relig.) | Swi+Garn+Pret | 2 | 0
hard | 3 | 5 | c (wlasna kult., obca relig.) | bez | brak | brak
hard | 3 | 5 | c (wlasna kult., obca relig.) | Garn | 4 | 2
hard | 3 | 5 | c (wlasna kult., obca relig.) | Swi+Garn | 4 | 2
hard | 3 | 5 | c (wlasna kult., obca relig.) | Swi+Garn+Pret | 2 | 0
hard | 3 | 5 | d (obca kult. + obca relig.) | bez | brak | brak
hard | 3 | 5 | d (obca kult. + obca relig.) | Garn | brak | brak
hard | 3 | 5 | d (obca kult. + obca relig.) | Swi+Garn | brak | brak
hard | 3 | 5 | d (obca kult. + obca relig.) | Swi+Garn+Pret | brak | 3
hard | 3 | 8 | a (wlasna kult. + wlasna relig.) | bez | brak | 3
hard | 3 | 8 | a (wlasna kult. + wlasna relig.) | Garn | 2 | 0
hard | 3 | 8 | a (wlasna kult. + wlasna relig.) | Swi+Garn | 2 | 0
hard | 3 | 8 | a (wlasna kult. + wlasna relig.) | Swi+Garn+Pret | 0 | 0
hard | 3 | 8 | b (obca kult., wlasna relig.) | bez | brak | brak
hard | 3 | 8 | b (obca kult., wlasna relig.) | Garn | brak | 3
hard | 3 | 8 | b (obca kult., wlasna relig.) | Swi+Garn | brak | 3
hard | 3 | 8 | b (obca kult., wlasna relig.) | Swi+Garn+Pret | 3 | 1
hard | 3 | 8 | c (wlasna kult., obca relig.) | bez | brak | brak
hard | 3 | 8 | c (wlasna kult., obca relig.) | Garn | brak | 3
hard | 3 | 8 | c (wlasna kult., obca relig.) | Swi+Garn | brak | 3
hard | 3 | 8 | c (wlasna kult., obca relig.) | Swi+Garn+Pret | 3 | 1
hard | 3 | 8 | d (obca kult. + obca relig.) | bez | brak | brak
hard | 3 | 8 | d (obca kult. + obca relig.) | Garn | brak | brak
hard | 3 | 8 | d (obca kult. + obca relig.) | Swi+Garn | brak | brak
hard | 3 | 8 | d (obca kult. + obca relig.) | Swi+Garn+Pret | brak | 4

## 2. Porównanie: dziś (OBECNE) vs propozycja (PROP), pop 5, neutral / wyjście, wiersz = poziom×epoka×budynki

| poziom | epoka | budynki | a dziś | a propozycja | b dziś | b propozycja | c dziś | c propozycja | d dziś | d propozycja |
|---|---|---|---|---|---|---|---|---|---|---|
| easy | 1 | bez | 0/0 | 0/0 | 2/1 | 2/1 | 2/1 | 2/1 | 2/1 | 2/2 |
| easy | 1 | Garn | 0/0 | 0/0 | 1/0 | 1/0 | 1/0 | 1/0 | 1/0 | 1/1 |
| easy | 2 | bez | 0/0 | 0/0 | 2/1 | 2/1 | 2/1 | 2/1 | 2/1 | 3/2 |
| easy | 2 | Garn | 0/0 | 0/0 | 1/0 | 1/0 | 1/0 | 1/0 | 1/0 | 2/1 |
| easy | 2 | Swi+Garn | 0/0 | 0/0 | 1/0 | 1/0 | 1/0 | 1/0 | 1/0 | 2/1 |
| easy | 3 | bez | 0/0 | 0/0 | 3/1 | 3/1 | 3/1 | 3/1 | 3/1 | 5/3 |
| easy | 3 | Garn | 0/0 | 0/0 | 1/0 | 1/0 | 1/0 | 1/0 | 1/0 | 3/1 |
| easy | 3 | Swi+Garn | 0/0 | 0/0 | 1/0 | 1/0 | 1/0 | 1/0 | 1/0 | 3/1 |
| easy | 3 | Swi+Garn+Pret | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 1/0 |
| normal | 1 | bez | 1/0 | 1/0 | 2/1 | 2/2 | 2/1 | 2/2 | 2/1 | 3/3 |
| normal | 1 | Garn | 0/0 | 0/0 | 1/0 | 1/0 | 1/0 | 1/0 | 1/0 | 2/1 |
| normal | 2 | bez | 1/0 | 1/0 | 3/1 | 3/2 | 3/1 | 3/2 | 3/1 | 5/4 |
| normal | 2 | Garn | 0/0 | 0/0 | 1/0 | 2/0 | 1/0 | 2/0 | 1/0 | 3/2 |
| normal | 2 | Swi+Garn | 0/0 | 0/0 | 1/0 | 2/0 | 1/0 | 2/0 | 1/0 | 3/2 |
| normal | 3 | bez | 1/0 | 1/0 | 3/2 | 4/3 | 3/2 | 4/3 | 3/2 | brak/5 |
| normal | 3 | Garn | 0/0 | 0/0 | 1/0 | 2/0 | 1/0 | 2/0 | 1/0 | 4/3 |
| normal | 3 | Swi+Garn | 0/0 | 0/0 | 1/0 | 2/0 | 1/0 | 2/0 | 1/0 | 4/3 |
| normal | 3 | Swi+Garn+Pret | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 0/0 | 3/1 |
| hard | 1 | bez | 1/0 | 2/1 | 2/1 | 4/3 | 2/1 | 4/3 | 2/1 | brak/4 |
| hard | 1 | Garn | 0/0 | 1/0 | 1/0 | 2/1 | 1/0 | 2/1 | 1/0 | 3/2 |
| hard | 2 | bez | 2/0 | 4/2 | 4/2 | brak/4 | 4/2 | brak/4 | 4/2 | brak/brak |
| hard | 2 | Garn | 0/0 | 1/0 | 1/0 | 3/2 | 1/0 | 3/2 | 1/0 | brak/4 |
| hard | 2 | Swi+Garn | 0/0 | 1/0 | 1/0 | 3/2 | 1/0 | 3/2 | 1/0 | brak/4 |
| hard | 3 | bez | 2/0 | brak/2 | brak/2 | brak/brak | brak/2 | brak/brak | brak/2 | brak/brak |
| hard | 3 | Garn | 0/0 | 1/0 | 1/0 | 4/2 | 1/0 | 4/2 | 1/0 | brak/brak |
| hard | 3 | Swi+Garn | 0/0 | 1/0 | 1/0 | 4/2 | 1/0 | 4/2 | 1/0 | brak/brak |
| hard | 3 | Swi+Garn+Pret | 0/0 | 0/0 | 0/0 | 2/0 | 0/0 | 2/0 | 0/0 | brak/3 |

## 3. Wariant bez dolnego obcięcia Szczęścia (PROP_BEZ_OBC), pop 5 — tylko do pytania o 0%

poziom | epoka | budynki | d neutral | d wyjście | b neutral | b wyjście
---|---|---|---|---|---|---
easy | 1 | bez | brak | 4 | 2 | 1
easy | 1 | Garn | brak | 3 | 1 | 0
easy | 2 | bez | brak | 5 | 3 | 1
easy | 2 | Garn | 5 | 3 | 1 | 0
easy | 2 | Swi+Garn | 4 | 3 | 1 | 0
easy | 3 | bez | brak | brak | 3 | 1
easy | 3 | Garn | brak | 4 | 1 | 0
easy | 3 | Swi+Garn | brak | 4 | 1 | 0
easy | 3 | Swi+Garn+Pret | 4 | 2 | 0 | 0
normal | 1 | bez | brak | 5 | 3 | 3
normal | 1 | Garn | 4 | 4 | 2 | 1
normal | 2 | bez | brak | brak | 5 | 4
normal | 2 | Garn | brak | 5 | 3 | 2
normal | 2 | Swi+Garn | brak | 5 | 3 | 2
normal | 3 | bez | brak | brak | brak | 5
normal | 3 | Garn | brak | brak | 4 | 2
normal | 3 | Swi+Garn | brak | brak | 4 | 2
normal | 3 | Swi+Garn+Pret | brak | 5 | 2 | 0
hard | 1 | bez | brak | brak | brak | 4
hard | 1 | Garn | brak | brak | 4 | 3
hard | 2 | bez | brak | brak | brak | brak
hard | 2 | Garn | brak | brak | brak | brak
hard | 2 | Swi+Garn | brak | brak | brak | 4
hard | 3 | bez | brak | brak | brak | brak
hard | 3 | Garn | brak | brak | brak | brak
hard | 3 | Swi+Garn | brak | brak | brak | brak
hard | 3 | Swi+Garn+Pret | brak | brak | brak | 4

## 4. Efekt na WŁASNE miasta (scenariusz a = własna kultura + własna religia), bez budynków

poziom | epoka | pop | garn | PROP: Sz% / Pr% / Por% / tier / tura buntu | OBECNE: Sz% / Pr% / Por% / tier / tura buntu
---|---|---|---|---|---
easy | 1 | 1 | 0 | 120 / 85.7 / 104.6 / order / - | 120 / 28.6 / 78.9 / neutral / -
easy | 1 | 1 | 1 | 120 / 157.1 / 120 / order / - | 120 / 100 / 111 / order / -
easy | 1 | 1 | 2 | 120 / 170 / 120 / order / - | 120 / 170 / 120 / order / -
easy | 1 | 2 | 0 | 120 / 77.1 / 100.7 / order / - | 120 / 20 / 75 / neutral / -
easy | 1 | 2 | 1 | 120 / 148.6 / 120 / order / - | 120 / 91.4 / 107.1 / order / -
easy | 1 | 2 | 2 | 120 / 170 / 120 / order / - | 120 / 162.9 / 120 / order / -
easy | 1 | 5 | 0 | 64.5 / 51 / 58.4 / neutral / - | 64.5 / 0 / 35.5 / neutral / -
easy | 1 | 5 | 1 | 64.5 / 114.8 / 87.1 / neutral / - | 64.5 / 63.8 / 64.2 / neutral / -
easy | 1 | 5 | 2 | 64.5 / 170 / 112 / order / - | 64.5 / 127.6 / 92.9 / order / -
easy | 2 | 1 | 0 | 103.6 / 76.4 / 91.4 / order / - | 103.6 / 18.2 / 65.2 / neutral / -
easy | 2 | 1 | 1 | 103.6 / 121.8 / 111.8 / order / - | 103.6 / 63.6 / 85.6 / neutral / -
easy | 2 | 1 | 2 | 103.6 / 167.3 / 120 / order / - | 103.6 / 109.1 / 106.1 / order / -
easy | 2 | 2 | 0 | 96.1 / 70.9 / 84.8 / neutral / - | 96.1 / 12.7 / 58.6 / neutral / -
easy | 2 | 2 | 1 | 96.1 / 116.4 / 105.2 / order / - | 96.1 / 58.2 / 79 / neutral / -
easy | 2 | 2 | 2 | 96.1 / 161.8 / 120 / order / - | 96.1 / 103.6 / 99.5 / order / -
easy | 2 | 5 | 0 | 59 / 51.9 / 55.8 / neutral / - | 59 / 0 / 32.5 / neutral / -
easy | 2 | 5 | 1 | 59 / 92.5 / 74.1 / neutral / - | 59 / 40.6 / 50.7 / neutral / -
easy | 2 | 5 | 2 | 59 / 133.1 / 92.3 / order / - | 59 / 81.2 / 69 / neutral / -
easy | 3 | 1 | 0 | 92.4 / 74.7 / 84.4 / neutral / - | 92.4 / 13.3 / 56.8 / neutral / -
easy | 3 | 1 | 1 | 92.4 / 108 / 99.4 / order / - | 92.4 / 46.7 / 71.8 / neutral / -
easy | 3 | 1 | 2 | 92.4 / 141.3 / 114.4 / order / - | 92.4 / 80 / 86.8 / neutral / -
easy | 3 | 2 | 0 | 87.4 / 70.7 / 79.9 / neutral / - | 87.4 / 9.3 / 52.3 / neutral / -
easy | 3 | 2 | 1 | 87.4 / 104 / 94.9 / order / - | 87.4 / 42.7 / 67.3 / neutral / -
easy | 3 | 2 | 2 | 87.4 / 137.3 / 109.9 / order / - | 87.4 / 76 / 82.3 / neutral / -
easy | 3 | 5 | 0 | 60.2 / 54.8 / 57.8 / neutral / - | 60.2 / 0 / 33.1 / neutral / -
easy | 3 | 5 | 1 | 60.2 / 84.5 / 71.1 / neutral / - | 60.2 / 29.8 / 46.5 / neutral / -
easy | 3 | 5 | 2 | 60.2 / 114.3 / 84.5 / neutral / - | 60.2 / 59.5 / 59.9 / neutral / -
normal | 1 | 1 | 0 | 64.8 / 45 / 54.9 / neutral / - | 98.1 / 20 / 59.1 / neutral / -
normal | 1 | 1 | 1 | 64.8 / 95 / 79.9 / neutral / - | 98.1 / 70 / 84.1 / neutral / -
normal | 1 | 1 | 2 | 64.8 / 145 / 104.9 / order / - | 98.1 / 120 / 109.1 / order / -
normal | 1 | 2 | 0 | 54.8 / 40 / 47.4 / neutral / - | 88.1 / 15 / 51.6 / neutral / -
normal | 1 | 2 | 1 | 54.8 / 90 / 72.4 / neutral / - | 88.1 / 65 / 76.6 / neutral / -
normal | 1 | 2 | 2 | 54.8 / 140 / 97.4 / order / - | 88.1 / 115 / 101.6 / order / -
normal | 1 | 5 | 0 | 13.2 / 22.3 / 17.8 / unrest / - | 43 / 0 / 21.5 / unrest / -
normal | 1 | 5 | 1 | 13.2 / 67 / 40.1 / neutral / - | 43 / 44.6 / 43.8 / neutral / -
normal | 1 | 5 | 2 | 13.2 / 111.6 / 62.4 / neutral / - | 43 / 89.3 / 66.2 / neutral / -
normal | 2 | 1 | 0 | 50.9 / 36.9 / 43.9 / neutral / - | 82.9 / 12.3 / 47.6 / neutral / -
normal | 2 | 1 | 1 | 50.9 / 67.7 / 59.3 / neutral / - | 82.9 / 43.1 / 63 / neutral / -
normal | 2 | 1 | 2 | 50.9 / 98.5 / 74.7 / neutral / - | 82.9 / 73.8 / 78.4 / neutral / -
normal | 2 | 2 | 0 | 44.9 / 33.8 / 39.3 / neutral / - | 76.9 / 9.2 / 43.1 / neutral / -
normal | 2 | 2 | 1 | 44.9 / 64.6 / 54.8 / neutral / - | 76.9 / 40 / 58.5 / neutral / -
normal | 2 | 2 | 2 | 44.9 / 95.4 / 70.2 / neutral / - | 76.9 / 70.8 / 73.9 / neutral / -
normal | 2 | 5 | 0 | 18.7 / 22 / 20.4 / unrest / - | 47.2 / 0 / 23.6 / unrest / -
normal | 2 | 5 | 1 | 18.7 / 49.5 / 34.1 / neutral / - | 47.2 / 27.5 / 37.4 / neutral / -
normal | 2 | 5 | 2 | 18.7 / 76.9 / 47.8 / neutral / - | 47.2 / 54.9 / 51.1 / neutral / -
normal | 3 | 1 | 0 | 46.3 / 36.5 / 41.4 / neutral / - | 79.2 / 9.4 / 44.3 / neutral / -
normal | 3 | 1 | 1 | 46.3 / 60 / 53.2 / neutral / - | 79.2 / 32.9 / 56.1 / neutral / -
normal | 3 | 1 | 2 | 46.3 / 83.5 / 64.9 / neutral / - | 79.2 / 56.5 / 67.9 / neutral / -
normal | 3 | 2 | 0 | 42.1 / 34.1 / 38.1 / neutral / - | 74.9 / 7.1 / 41 / neutral / -
normal | 3 | 2 | 1 | 42.1 / 57.6 / 49.9 / neutral / - | 74.9 / 30.6 / 52.8 / neutral / -
normal | 3 | 2 | 2 | 42.1 / 81.2 / 61.7 / neutral / - | 74.9 / 54.1 / 64.5 / neutral / -
normal | 3 | 5 | 0 | 22.3 / 24.2 / 23.3 / unrest / - | 51.6 / 0 / 25.8 / unrest / -
normal | 3 | 5 | 1 | 22.3 / 45.2 / 33.8 / neutral / - | 51.6 / 21 / 36.3 / neutral / -
normal | 3 | 5 | 2 | 22.3 / 66.2 / 44.3 / neutral / - | 51.6 / 42 / 46.8 / neutral / -
hard | 1 | 1 | 0 | 27 / 15.6 / 20.7 / unrest / - | 84.1 / 15.6 / 46.4 / neutral / -
hard | 1 | 1 | 1 | 27 / 48.9 / 39 / neutral / - | 84.1 / 48.9 / 64.7 / neutral / -
hard | 1 | 1 | 2 | 27 / 82.2 / 57.4 / neutral / - | 84.1 / 82.2 / 83.1 / neutral / -
hard | 1 | 2 | 0 | 18.4 / 11.1 / 14.4 / unrest / - | 75.6 / 11.1 / 40.1 / neutral / -
hard | 1 | 2 | 1 | 18.4 / 44.4 / 32.7 / neutral / - | 75.6 / 44.4 / 58.4 / neutral / -
hard | 1 | 2 | 2 | 18.4 / 77.8 / 51.1 / neutral / - | 75.6 / 77.8 / 76.8 / neutral / -
hard | 1 | 5 | 0 | 0 / 0 / 0 / unrest / 4 | 36.8 / 0 / 16.6 / unrest / -
hard | 1 | 5 | 1 | 0 / 29.8 / 16.4 / unrest / - | 36.8 / 29.8 / 33 / neutral / -
hard | 1 | 5 | 2 | 0 / 59.5 / 32.7 / neutral / - | 36.8 / 59.5 / 49.3 / neutral / -
hard | 2 | 1 | 0 | 17.2 / 9.3 / 12.9 / unrest / 4 | 75.4 / 9.3 / 39 / neutral / -
hard | 2 | 1 | 1 | 17.2 / 29.3 / 23.9 / unrest / - | 75.4 / 29.3 / 50 / neutral / -
hard | 2 | 1 | 2 | 17.2 / 49.3 / 34.9 / neutral / - | 75.4 / 49.3 / 61 / neutral / -
hard | 2 | 2 | 0 | 11.7 / 6.7 / 9 / unrest / 4 | 69.9 / 6.7 / 35.1 / neutral / -
hard | 2 | 2 | 1 | 11.7 / 26.7 / 20 / unrest / - | 69.9 / 26.7 / 46.1 / neutral / -
hard | 2 | 2 | 2 | 11.7 / 46.7 / 31 / neutral / - | 69.9 / 46.7 / 57.1 / neutral / -
hard | 2 | 5 | 0 | 0 / 0 / 0 / unrest / 4 | 42.9 / 0 / 19.3 / unrest / -
hard | 2 | 5 | 1 | 0 / 17.9 / 9.8 / unrest / 4 | 42.9 / 17.9 / 29.2 / unrest / -
hard | 2 | 5 | 2 | 0 / 35.7 / 19.6 / unrest / - | 42.9 / 35.7 / 38.9 / neutral / -
hard | 3 | 1 | 0 | 11.8 / 7 / 9.2 / unrest / 4 | 69.3 / 7 / 35 / neutral / -
hard | 3 | 1 | 1 | 11.8 / 22 / 17.4 / unrest / - | 69.3 / 22 / 43.3 / neutral / -
hard | 3 | 1 | 2 | 11.8 / 37 / 25.7 / unrest / - | 69.3 / 37 / 51.5 / neutral / -
hard | 3 | 2 | 0 | 8.1 / 5 / 6.4 / unrest / 4 | 65.6 / 5 / 32.3 / neutral / -
hard | 3 | 2 | 1 | 8.1 / 20 / 14.6 / unrest / - | 65.6 / 20 / 40.5 / neutral / -
hard | 3 | 2 | 2 | 8.1 / 35 / 22.9 / unrest / - | 65.6 / 35 / 48.8 / neutral / -
hard | 3 | 5 | 0 | 0 / 0 / 0 / unrest / 4 | 45.1 / 0 / 20.3 / unrest / -
hard | 3 | 5 | 1 | 0 / 13.4 / 7.4 / unrest / 4 | 45.1 / 13.4 / 27.7 / unrest / -
hard | 3 | 5 | 2 | 0 / 26.8 / 14.7 / unrest / - | 45.1 / 26.8 / 35 / neutral / -

## 5. Własne miasto bez garnizonu (a) — Szczęście/Prawo składowe, pop 5, epoka 1

easy: PROP netto Sz=14.4 (szMax 22.4), netto Pr=20 (prawMax 39.2), linie kult+relig=20 | PROP_BEZ_OBC Sz%=64.5 (netto 14.4)
normal: PROP netto Sz=4.4 (szMax 33.6), netto Pr=10 (prawMax 44.8), linie kult+relig=10 | PROP_BEZ_OBC Sz%=13.2 (netto 4.4)
hard: PROP netto Sz=-5.6 (szMax 39.2), netto Pr=0 (prawMax 50.4), linie kult+relig=0 | PROP_BEZ_OBC Sz%=-14.2 (netto -5.6)

## 6. Szukanie D lub G dających dokładnie 2 / 3 / 4 (scenariusz d, bez budynków, epoka 1, pop 5)

easy (aktualne D=-10, G=10): D przy G=10 → 2: -11..-1 (11 wart.), 3: -24..-12 (13 wart.), 4: -36..-25 (12 wart.) | G przy D=-10 → 2: -20..40 (61 wart.), 3: brak, 4: brak
normal (aktualne D=-15, G=5): D przy G=5 → 2: -6..-1 (6 wart.), 3: -16..-7 (10 wart.), 4: -26..-17 (10 wart.) | G przy D=-15 → 2: brak, 3: -20..40 (61 wart.), 4: brak
hard (aktualne D=-20, G=0): D przy G=0 → 2: -1..-1 (1 wart.), 3: -8..-2 (7 wart.), 4: -16..-9 (8 wart.) | G przy D=-20 → 2: brak, 3: brak, 4: brak

## 7. Kontrola skali pojedynczej linii (bez budynków, epoka 1, pop 5, neutral): obca kultura, własna religia (scen. b)
easy: n0:Por 0 (unrest) ; n1:Por 28.7 (unrest) ; n2:Por 57.4 (neutral) ; n3:Por 76.5 (neutral) ; n4:Por 76.5 (neutral)
normal: n0:Por 0 (unrest) ; n1:Por 11.2 (unrest) ; n2:Por 33.5 (neutral) ; n3:Por 55.8 (neutral) ; n4:Por 78.2 (neutral)
hard: n0:Por 0 (unrest) ; n1:Por 0 (unrest) ; n2:Por 10.9 (unrest) ; n3:Por 27.3 (unrest) ; n4:Por 43.7 (neutral)

## 8. Zamożność miasta (podatki, suwak handlu): domyślna 20% (dziś) vs maksymalna 100%, PROP, pop 5, bez budynków
Podatki: −10 przy 0%, +10 przy ≥90% (szczescie_podatki_*); domyślnie −5,6. Scenariusze a (własne) i d (obce).

poziom | epoka | scen. | garn | Sz% dom. / Por% dom. / tier dom. / tura buntu dom. | Sz% 100% / Por% 100% / tier 100% / tura buntu 100%
---|---|---|---|---|---
easy | 1 | a | 0 | 64.5 / 58.4 / neutral / - | 120 / 89 / neutral / -
easy | 1 | a | 1 | 64.5 / 87.1 / neutral / - | 120 / 117.7 / order / -
easy | 1 | d | 0 | 0 / 0 / unrest / 6 | 0 / 0 / unrest / 6
easy | 1 | d | 1 | 0 / 5.8 / unrest / 6 | 0 / 5.8 / unrest / 6
easy | 2 | a | 0 | 59 / 55.8 / neutral / - | 93.8 / 74.9 / neutral / -
easy | 2 | a | 1 | 59 / 74.1 / neutral / - | 93.8 / 93.2 / order / -
easy | 2 | d | 0 | 0 / 0 / unrest / 6 | 0 / 0 / unrest / 6
easy | 2 | d | 1 | 0 / 0 / unrest / 6 | 0 / 0 / unrest / 6
easy | 3 | a | 0 | 60.2 / 57.8 / neutral / - | 83.3 / 70.5 / neutral / -
easy | 3 | a | 1 | 60.2 / 71.1 / neutral / - | 83.3 / 83.8 / neutral / -
easy | 3 | d | 0 | 0 / 0 / unrest / 6 | 0 / 0 / unrest / 6
easy | 3 | d | 1 | 0 / 0 / unrest / 6 | 0 / 0 / unrest / 6
normal | 1 | a | 0 | 13.2 / 17.8 / unrest / - | 59.5 / 40.9 / neutral / -
normal | 1 | a | 1 | 13.2 / 40.1 / neutral / - | 59.5 / 63.3 / neutral / -
normal | 1 | d | 0 | 0 / 0 / unrest / 5 | 0 / 0 / unrest / 5
normal | 1 | d | 1 | 0 / 0 / unrest / 5 | 0 / 0 / unrest / 5
normal | 2 | a | 0 | 18.7 / 20.4 / unrest / - | 46.4 / 34.2 / neutral / -
normal | 2 | a | 1 | 18.7 / 34.1 / neutral / - | 46.4 / 48 / neutral / -
normal | 2 | d | 0 | 0 / 0 / unrest / 5 | 0 / 0 / unrest / 5
normal | 2 | d | 1 | 0 / 0 / unrest / 5 | 0 / 0 / unrest / 5
normal | 3 | a | 0 | 22.3 / 23.3 / unrest / - | 42.1 / 33.2 / neutral / -
normal | 3 | a | 1 | 22.3 / 33.8 / neutral / - | 42.1 / 43.7 / neutral / -
normal | 3 | d | 0 | 0 / 0 / unrest / 5 | 0 / 0 / unrest / 5
normal | 3 | d | 1 | 0 / 0 / unrest / 5 | 0 / 0 / unrest / 5
hard | 1 | a | 0 | 0 / 0 / unrest / 4 | 25.5 / 11.5 / unrest / 4
hard | 1 | a | 1 | 0 / 16.4 / unrest / - | 25.5 / 27.9 / unrest / -
hard | 1 | d | 0 | 0 / 0 / unrest / 4 | 0 / 0 / unrest / 4
hard | 1 | d | 1 | 0 / 0 / unrest / 4 | 0 / 0 / unrest / 4
hard | 2 | a | 0 | 0 / 0 / unrest / 4 | 16.2 / 7.3 / unrest / 4
hard | 2 | a | 1 | 0 / 9.8 / unrest / 4 | 16.2 / 17.1 / unrest / -
hard | 2 | d | 0 | 0 / 0 / unrest / 4 | 0 / 0 / unrest / 4
hard | 2 | d | 1 | 0 / 0 / unrest / 4 | 0 / 0 / unrest / 4
hard | 3 | a | 0 | 0 / 0 / unrest / 4 | 11.2 / 5 / unrest / 4
hard | 3 | a | 1 | 0 / 7.4 / unrest / 4 | 11.2 / 12.4 / unrest / 4
hard | 3 | d | 0 | 0 / 0 / unrest / 4 | 0 / 0 / unrest / 4
hard | 3 | d | 1 | 0 / 0 / unrest / 4 | 0 / 0 / unrest / 4
