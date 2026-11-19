# Koszt budowy ulepszeń terenu w Pracy — w każdej epoce (stan 2026-11-19, po FALI 878)

Źródło: `gra/data/terrain-improvements.json` (`koszt_praca`), `gra/src/game/terrain-improvements.ts` (`scaleTerrainImprovementWorkCostForOwner`), `gra/src/game/r-stawki-strojenie.ts` (FALA 2 ×2), `gra/data/improvement-cost-params.json`.

**Wzór dziś (FALA 878, decyzja właściciela):** koszt = zaokrąglenie(koszt bazowy × 2) × mnożnik epoki WŁAŚCICIELA (Kamień 0,5 / Brąz 1 / Żelazo 2). Czyli Kamień = baza, Brąz = 2× baza, Żelazo = 4× baza — niezależnie od epoki, w której ulepszenie odblokowano. Kolumna „dawniej” to wzór sprzed FALI 878: mnożnik wg epoki ODBLOKOWANIA ulepszenia (jedna wartość, bez wzrostu z epoką właściciela). Ulepszenie można budować dopiero po odblokowaniu (kolumna „Odbl.”); w kolumnach epok wcześniejszych niż odblokowanie koszt jest tylko teoretyczny („—”).

| Ulepszenie | Odbl. | Baza (JSON) | Kamień | Brąz | Żelazo | Dawniej (wg epoki odblokowania) |
|---|---|---|---|---|---|---|
| Farma | Kamień | 20 | 20 | 40 | 80 | 20 |
| Irygacja | Brąz | 30 | — | 60 | 120 | 60 |
| Trzoda | Kamień | 20 | 20 | 40 | 80 | 20 |
| Owce | Kamień | 20 | 20 | 40 | 80 | 20 |
| Lama | Kamień | 20 | 20 | 40 | 80 | 20 |
| Stadnina | Brąz | 28 | — | 56 | 112 | 56 |
| Glinianka | Brąz | 20 | — | 40 | 80 | 40 |
| Kamieniołom | Kamień | 22 | 22 | 44 | 88 | 22 |
| Obóz łowiecki | Kamień | 18 | 18 | 36 | 72 | 18 |
| Wycinka | Kamień | 2.5 | 2.5 | 5 | 10 | 2.5 |
| Tartak | Kamień | 25 | 25 | 50 | 100 | 25 |
| Tarasy uprawne | Brąz | 25 | — | 50 | 100 | 50 |
| Łodzie rybackie | Kamień | 20 | 20 | 40 | 80 | 20 |
| Warzelnia soli | Brąz | 20 | — | 40 | 80 | 40 |
| Fort | Żelazo | 25 | — | — | 100 | 100 |
| Droga | Kamień | 15 | 15 | 30 | 60 | 15 |
| Droga brukowana | Żelazo | 25 | — | — | 100 | 100 |
| Kopalnia miedzi | Brąz | 44 | — | 88 | 176 | 44 |
| Kopalnia żelaza | Żelazo | 44 | — | — | 176 | 88 |
| Kopalnia cyny | Brąz | 44 | — | 88 | 176 | 44 |
| Kopalnia złota | Brąz | 22 | — | 44 | 88 | 44 |
| Posterunek (Strażnica) | Brąz | 30 | — | 60 | 120 | 60 |

**Uwagi:** (1) Kopalnie rudy (miedź, cyna, żelazo) mają od FALI 878 bazę 44 zamiast 22 (decyzja „kopalnie rudy ×2”); Kopalnia złota bez zmian (22). (2) Zaokrąglenie dotyczy kroku „baza × 2” (np. Wycinka 2,5 → 5 → 2,5 / 5 / 10). (3) Utrzymanie ulepszeń (Praca/t) to osobna reguła ×1/×2/×4 wg epoki i nie jest tu liczone. (4) Droga i Droga brukowana oraz Fort mają własne warunki budowy, ale ten sam wzór kosztu.
