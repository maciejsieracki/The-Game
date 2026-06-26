# PACZKA: MIASTO -> MASTER (rozdziel do UX/UI) : DYNAMICZNY zasieg miasta wg populacji
Data: 2026-06-25. Maciej prosil "zlec dzialania dla UX". MAPA = Maciej przekazuje sam (terytorium/granica tez rosnie z pop).

## REGULA (decyzja Naster 2026-06-25)
Zasieg okolicy roboczej miasta (gdzie przydzielasz mieszkancow + zasieg budowy + granica panstwa wokol miasta)
ROSNIE z populacja miasta:
- populacja < 5   -> promien **5**
- populacja >= 5  -> promien **10**
- populacja >= 10 -> promien **15**
Kazde miasto startuje L1/pop1 (r5). Granica panstwa "pelznie" wraz ze wzrostem miast.

## DLA UX/UI (panel miasta -- Makieta-panel-miasta.html i docelowy cityPanel)
- Renderuj okolice robocza o promieniu = `cityRangeForPopulation(populacja_miasta)` (5/10/15). 
- Siatka okolicy ROSNIE gdy miasto rosnie (pop 1->r5, pop 5->r10, pop 10->r15) -- wiecej pol do przydzielenia mieszkancom.
- Przydzial mieszkancow: N mieszkancow obrabia N najlepszych pol okolicy (modul MIASTO: okolica.assignWorkedTiles,
  ktory sam bierze radius z populacji). Plony pola dostarcza EKONOMIA/MAPA (yieldOf).
- Granica budowy = obrys promienia; poza nia brak budowy/przydzialu.

## HELPER + DANE (lane MIASTO, gotowe/do wpiecia)
- `okolica.cityRangeForPopulation(pop)` -> 5|10|15. `okolica.assignWorkedTiles(...)` -> N najlepszych pol (radius z pop).
- Tunowalne: miasto-params `zasieg_okolicy_baza`=5, `zasieg_okolicy_pop5`=10, `zasieg_okolicy_pop10`=15 (+ progi pop 5/10).
- Podglad ilustracyjny: MIASTO/Zasieg-miasta-okolica.html (pierscienie r5/r10/r15).

## MAPA (Maciej przekazuje sam)
Terytorium/granica panstwa = suma zasiegow miast (dynamiczny r wg pop) + posterunki +5 + forty +10. Tylko w tym zasiegu
mozna budowac. Liczby = MIASTO (j.w.).
