# Żywność i Spichlerz Centralny w Brązie — analiza i propozycja optymalizacji

Temat: R-WEB-ECONOMY-FOOD-GRANARY-BRONZE-OPTIMIZATION-PROPOSAL-Q1, runda 1/5 (Operator, HAIKU 5.5).
Baza kodu: origin/main = ea8f70197. Zero zmian w `gra/src` i `gra/data`.
Model: `gra/tools/food-granary-model.cjs` (uruchomienie: `node gra/tools/food-granary-model.cjs`).

Oznaczenia: **ZMIERZONO** = wynik z kodu/danych lub z uruchomienia modelu; **NIE_ZMIERZONO** = brak dowodu, podano założenie.

## A. Model żywności w kodzie

| Element | Gdzie | Co liczy |
|---|---|---|
| Cap centralny | `gra/src/game/empire-food.ts` `computeCentralFoodCap` (~l.171-193) | `centralCapBaza` 1000 (`econ-params` `magazyn_centralny_baza_zywnosc`) + Σ Spichlerz I 1000 / II 1500 × `magazynEraMultiplier(e)` (= 2^(e−1)) |
| Stałe Spichlerza | `gra/src/game/building-resource-gate.ts` l.551-552 | `SPICHLERZ_EMPIRE_CAP_I = 1000`, `SPICHLERZ_EMPIRE_CAP_II_FULL = 1500` |
| Magazyn → żywność | `econ-params` `magazyn_centralny_bonus_zywnosc_na_budynek` = 0 | Magazyn nie zwiększa capu żywności |
| Zapas po turze | `empire-food.ts` ~l.280-290 | `central −= armia`; `if (central > maxCap) central = maxCap` — **nadwyżka ponad cap przepada bez rozliczenia** |
| Wyżywienie ludności | `population-growth-v85.ts` `computeCityRationCost` (~l.229), `rationFoodCostPerPop` (l.208) | pop × poziom racji × 2 (R_STAWKI) × m(e) |
| Mnożnik racji | `citizen-consumption-era.ts`, `econ-era-rebalance.ts` `rebalancedCitizenConsumptionMult` | flaga ON: 2^(e−1) (Brąz ×2); OFF: 1+0,5(e−1) (Brąz ×1,5) |
| Żywność wojska | `econ-era-rebalance.ts` `rebalancedUnitFoodBase` (~l.55-64), `economy-upkeep.ts` `unitFoodPerTurn` (~l.1154) | `units.json` „żywność/turę” (=1) × 3^(e−1) × 4 (R_STAWKI). Kamień 4, Brąz 12, Żelazo 36 na jednostkę |
| Produkcja (Uprawa i hodowla) | `econ-era-rebalance.ts` `przychodyUlepszenStałeEpoka1` = true | ulepszenia żywnościowe stałe jak w Epoce 1 (bez wzrostu co epokę) |
| Flaga rebalansu | `gra/data/econ-era-rebalance-params.json` `eraRebalansAktywny` = **true** (od FALI 871, 2026-11-19) | |

Status ZMIERZONO: formuły wyżej odczytane z kodu. NIE_ZMIERZONO: wartości poszczególnych ulepszeń żywnościowych (farma/irygacja/bydło/tarasy/łodzie) — nie odczytano tabeli `terrain-yields.json`/`buildings.json` w tym przebiegu.

## B. Odtworzenie liczb ze zrzutu (Brąz, zapas 29 086 / 54 000)

| Pozycja | Zrzut | Odtworzenie | Status |
|---|---|---|---|
| Cap 54 000 | 54 000 | 1000 + 2×(1000·I + 1500·II); np. 10 I + 11 II = 54 000 | ZMIERZONO (formuła); liczba budynków NIE_ZMIERZONO |
| Uprawa i hodowla | +3363 | suma ulepszeń; ~168/miasto przy 20 miastach | NIE_ZMIERZONO (brak listy budynków) |
| Wyżywienie | −1046 | flaga ON: pop × poziom × 4; OFF: pop × poziom × 3 | NIE_ZMIERZONO (brak populacji i poziomów) |
| Wojsko | −312 | 312/12 = 26 jedn. Brąz (ON) lub 312/4 = 78 jedn. Kamień (OFF) | ZMIERZONO (arytmetyka); skład NIE_ZMIERZONO |
| Nadwyżka | +2317 | 3363 − 1046 | ZMIERZONO |
| Przyrost zapasów | +2005 | 2317 − 312 | ZMIERZONO (spójne z kodem) |
| „Spichlerz stolicy” | +29 399 | ≈ zapas przed armią (29 086 + 312 = 29 398) | ZMIERZONO (zgodność); nazwa pola w panelu NIE_ZMIERZONO |
| Tury do capu | ~12 | (54 000 − 29 086)/2005 = 12,4 | ZMIERZONO |
| Pasek „+2267 → +1954” | +2267 | 3363 − 784,5 (flaga OFF, ×0,75) − 312 = 2266,5 | ZMIERZONO (model); **niespójność**: pasek wygląda na flagę OFF, podsumowanie na ON (1046) |

**Wniosek ZMIERZONO:** nadwyżka żywności jest ~3,2× zużycia ludności, a produkcja nie rośnie z epoką, więc przy capie cała nadwyżka przepada. Pasek i podsumowanie prawdopodobnie liczą z dwóch różnych stanów flagi (różnica 50 jednostek w wyżywieniu). Do potwierdzenia przez właściciela, która wartość jest bieżąca.

## C. Propozycje (warianty, bez edycji kodu)

Parametry są propozycjami do wyboru — nie wybrano wartości za właściciela.

| Wariant | Zmiana | Skutek (model, 60 tur, ON) |
|---|---|---|
| V0 obecnie | — | cap po 13 turach; przepadek ~95 000 żywności w 60 turach |
| V1 ostrożny | produkcja ulepszeń żywnościowych −10% (Brąz) | netto 1669/t; cap po 15 turach; przepadek ~75 000 |
| V2 średni | produkcja −20% + psucie 2%/t zapasu powyżej 50% capu | netto 1332/t; cap po 25 turach; przepadek ~28 000 |
| V3 mocny | produkcja −30% + konwersja 0,2 ¤ za żywność nad 70% capu | netto 996/t; zapas 38 796 po 60 t; ~10 000 ¤ z konwersji |

Ograniczenie: samo psucie nie zatrzymuje wzrostu przy capie (stacjonarny zapas > cap; kontrast w modelu: cap po 15 turach). Skuteczna jest zmiana produkcji lub ujście z dochodem.

Dodatkowe ujścia (propozycja, NIE_ZMIERZONO w kodzie): „Pomoc miastom”/eksport do państw-miast i sojuszników (pole `Pomoc miastom` = 0 w zrzucie), konwersja nadwyżki w Pieniądz (V3) lub w wzrost populacji.

## D. Fazowanie Brąz → Żelazo

- Żelazo: żywność wojska ×3 (36/jedn.) już rośnie z rebalansem — nie dublować mnożnika w produkcji.
- Produkcja stała z epoką 1 (flaga ON): nadwyżka w Żelazie będzie większa przy stałym wyżywieniu ×4. Trzeba ocenić po pomiarze, nie z góry.

## E. Pytania ABC dla właściciela

1. **Która flaga rebalansu obowiązuje w zrzucie?** A) ON (podsumowanie 2317/2005) — rekomendacja; B) OFF (pasek 2267); C) nie wiem — mierzymy oba.
2. **Czy nadwyżka ponad cap ma przepadać?** A) tak, bez zmian; B) psucie 2%/t nad 50% capu (V2 bez zmiany produkcji ~kontrast); C) konwersja w Pieniądz nad 70% capu (V3) — **rekomendacja: C w połączeniu z A na Brązie**, bo nie zmienia produkcji ulepszeń.
3. **Czy redukować produkcję ulepszeń w Brązie?** A) nie; B) −10% (V1); C) −20% (V2) — rekomendacja: B, po pomiarze 60 tur.
4. **Pomoc miastom/eksport jako ujście?** A) nie; B) tak, przy nadwyżce ponad 70% capu.

## Ograniczenia

- Brak pomiaru w grze w tej rundzie (NIE_ZMIERZONO). Brak uruchomienia bundle'a i przeglądarki (dysk ~3 GB wolnego; `npm ci` nie uruchamiano).
- Model statyczny: bez sprzężenia z populacją, bez wzrostu miast i bez reakcji AI.
