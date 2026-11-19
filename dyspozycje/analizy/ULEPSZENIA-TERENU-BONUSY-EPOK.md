# Ulepszenia terenu: bonusy w każdej epoce (stan 2026-11-19, origin/main)

Źródło: `gra/data/terrain-improvements.json`, `gra/src/game/terrain-improvements.ts` (`improvementYieldForEra`, `resourceProductionAmountForEra`), flaga `eraRebalansAktywny` + `przychodyUlepszenStałeEpoka1` w `gra/data/econ-era-rebalance-params.json`.

**Reguła dziś (rebalans ON, decyzja właściciela):** przychody ulepszeń (Żywność/Praca/Handel/Pieniądz) i produkcja surowców są STAŁE jak w epoce Kamienia — w Brązie i Żelazie takie same. **Reguła dawna (flaga OFF):** Żyw/Pra/Han/Pień +1 w Brązie, +2 w Żelazie (tylko pola o wartości > 0); produkcja surowca ×1,5 na epokę (np. 50 → 75 → 113). Kolumny „flaga OFF” pokazują dawne wartości dla porównania. „Odbl.” = epoka, w której ulepszenie staje się dostępne.

| Ulepszenie | Odbl. | Bonus na pole DZIŚ (stały w każdej epoce) | Flaga OFF: Brąz | Flaga OFF: Żelazo | Surowiec/t DZIŚ (K/B/Ż) | Flaga OFF K/B/Ż | Koszt bazowy Pracy |
|---|---|---|---|---|---|---|---|
| Farma | Kamień | Żyw 3, Pra 3, Han 3 | Żyw 4, Pra 4, Han 4 | Żyw 5, Pra 5, Han 5 | — | — | 20 |
| Irygacja | Brąz | Żyw 5, Pra 2, Han 2 | Żyw 6, Pra 3, Han 3 | Żyw 7, Pra 4, Han 4 | — | — | 30 |
| Trzoda | Kamień | Żyw 2, Pra 4, Han 3 | Żyw 3, Pra 5, Han 4 | Żyw 4, Pra 6, Han 5 | — | — | 20 |
| Owce | Kamień | Żyw 1, Pra 2, Han 2 | Żyw 2, Pra 3, Han 3 | Żyw 3, Pra 4, Han 4 | — | — | 20 |
| Lama | Kamień | Żyw 1, Pra 3, Han 3 | Żyw 2, Pra 4, Han 4 | Żyw 3, Pra 5, Han 5 | — | — | 20 |
| Stadnina | Brąz | Pra 2, Han 2 | Pra 3, Han 3 | Pra 4, Han 4 | 25/25/25 (kon) | 25/38/56 | 28 |
| Glinianka | Brąz | Pra 1, Han 2 | Pra 2, Han 3 | Pra 3, Han 4 | 50/50/50 (glina) | 50/75/112 | 20 |
| Kamieniołom | Kamień | Pra 1, Han 2 | Pra 2, Han 3 | Pra 3, Han 4 | 50/50/50 (kamien) | 50/75/112 | 22 |
| Obóz łowiecki | Kamień | Żyw 1, Pra 1, Han 2, Pień 1 | Żyw 2, Pra 2, Han 3, Pień 2 | Żyw 3, Pra 3, Han 4, Pień 3 | — | — | 18 |
| Wycinka | Kamień | Han 1 | Han 2 | Han 3 | — | — | 2.5 |
| Tartak | Kamień | Pra 3, Han 3 | Pra 4, Han 4 | Pra 5, Han 5 | 50/50/50 (drewno) | 50/75/112 | 25 |
| Tarasy uprawne | Brąz | Żyw 3, Pra 2, Han 2 | Żyw 4, Pra 3, Han 3 | Żyw 5, Pra 4, Han 4 | — | — | 25 |
| Łodzie rybackie | Kamień | Żyw 6, Pra 6, Han 6 | Żyw 7, Pra 7, Han 7 | Żyw 8, Pra 8, Han 8 | — | — | 20 |
| Warzelnia soli | Brąz | Żyw 1, Pra 1, Han 3, Pień 1 | Żyw 2, Pra 2, Han 4, Pień 2 | Żyw 3, Pra 3, Han 5, Pień 3 | 50/50/50 (sol) | 50/75/112 | 20 |
| Fort | Żelazo | — | — | — | — | — | 25 |
| Droga | Kamień | Han 2 | Han 3 | Han 4 | — | — | 15 |
| Droga brukowana | Żelazo | Han 3 | Han 4 | Han 5 | — | — | 25 |
| Kopalnia miedzi | Brąz | Pra 2, Han 5 | Pra 3, Han 6 | Pra 4, Han 7 | 20/20/20 (ruda) | 20/30/45 | 22 |
| Kopalnia żelaza | Żelazo | Pra 2, Han 5 | Pra 3, Han 6 | Pra 4, Han 7 | 20/20/20 (ruda_zelaza) | 20/30/45 | 22 |
| Kopalnia cyny | Brąz | Pra 2, Han 5 | Pra 3, Han 6 | Pra 4, Han 7 | 20/20/20 (ruda_cyny) | 20/30/45 | 22 |
| Kopalnia złota | Brąz | Pra 2, Han 10 | Pra 3, Han 11 | Pra 4, Han 12 | 1/1/1 (zloto) | 1/2/2 | 22 |
| Posterunek (Strażnica) | Brąz | — | — | — | — | — | 30 |

**Uwagi:** (1) Fort i Posterunek nie mają plonu (tylko zasięg terytorium). (2) Kamieniołom i Glinianka mają dodatkowo bonus surowca na pole (Kamień 5, Glina 10) niezależnie od produkcji/t. (3) Koszt Pracy z tabeli jest bazowy; faktyczny koszt budowy = baza × 2 (FALA 2) × mnożnik epoki ulepszenia (Kamień ×0,5 / Brąz ×1 / Żelazo ×2, potem ×2); zmiana „koszt wg epoki właściciela” i kopalnie rudy ×2 są w toku (temat IMPCOST). (4) Utrzymanie ulepszeń (Praca/t) rośnie ×1/×2/×4 wg epoki.
