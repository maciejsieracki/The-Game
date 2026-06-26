# HANDOFF: MAPA → MASTER — obrona + zasięgi budynków obronnych (dane od Macieja)

**Data:** 25.06.2026 · **Od:** Civ-MAPA · **Status:** dane do rozdziału: liczby → MIASTO (terrain-improvements.json), bonusy walki → UNITS/walka. MAPA egzekwuje zasięgi na mapie.

## Wartości (od Macieja)
| Element | Zasięg terytorium (rozszerza budowę) | Epoka dostępności | Bonus OBRONY |
|---|---|---|---|
| **Miasto** | okolica robocza = promień **5** | od startu | jednostki w mieście z **MUREM**: **+200%** obrony |
| **Posterunek (Strażnica)** | rozszerza o promień **5** | **Brąz** (epoka 2) | jednostkom **obozującym** tam: **+50%** obrony |
| **Fort** | rozszerza o promień **10** | **Żelazo** (epoka 3) | jednostkom obozującym: **+100%** obrony |

(Uwaga: w wiadomości Macieja „Kor daje 100%" = literówka, chodzi o FORT. Bonusy dotyczą jednostek „w trybie OBOZOWANIA" przy strukturze.)

## Rozdział własności
- **MIASTO** (`gra/data/terrain-improvements.json`): zaktualizować — `posterunek`: zasieg_terytorium=5, epoka 1→2; `fort`: dodać zasieg_terytorium=10, epoka=3 (już 3). Plus „miasto: zasieg_okolicy=5" (już w spec MIASTO).
- **UNITS / walka**: bonusy obrony — mur miasta +200%, fort +100%, posterunek +50%; warunek: jednostka w trybie OBOZOWANIA przy strukturze. Wartość bonusu obrony fortu/posterunku do wpięcia w model walki.
- **MAPA (ja)**: terytorium budowy = suma promieni (miasto 5 + posterunek 5 + fort 10); budować TYLKO w zasięgu; ekspansja łańcuchowa (struktura na krawędzi → granica rośnie); dostępność narzędzi gated epoką (posterunek od brązu, fort od żelaza). Wbuduję te wartości jako stub w narzędzia Budowy; podmiana realnymi z JSON gdy MIASTO zaktualizuje.

## Do potwierdzenia przez Macieja (w oknie MAPA)
- FORT rozszerza buildowalne terytorium o promień **10** (to bardzo duży obszar) — czy na pewno o tyle ROZSZERZA zasięg budowy, czy „10" to raczej promień jego strefy obrony/kontroli? (Resztę przyjmuję jak wyżej.)
