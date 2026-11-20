# Koszty jednostek i skarbiec — stan po FALACH 875–887 (2026-11-20)

Temat: R-WEB-ECONOMY-TREASURY-MODEL-REFRESH-Q1, runda 1/5 (Operator, HAIKU 5.5).
Baza kodu: origin/main = 13e869f519ddf2260baa636768ee7490106428e0. Zero zmian w `gra/src` i `gra/data`.
Modele: `gra/tools/treasury-unit-cost-model.cjs` i `gra/tools/food-granary-model.cjs`
(uruchomienie: `node gra/tools/treasury-unit-cost-model.cjs`, `node gra/tools/food-granary-model.cjs`).

Oznaczenia: **ZMIERZONO** = wynik wywołania prawdziwych funkcji kodu (esbuild, bundle w pamięci) albo odczyt pliku danych;
**NIE_ZMIERZONO** = brak dowodu w kodzie lub danych, podano założenie.

Konfiguracja: flaga rebalansu epok ON (wartość z `gra/data/econ-era-rebalance-params.json`, `eraRebalansAktywny: true`),
tempo „Koszty jednostek” w trzech wariantach: Niski ×1, Normalny ×2, Wysoki ×4 (`KOSZT_JEDNOSTEK_PACE`).

## 1. Aktualne wzory (ZMIERZONO w kodzie)

| Element | Wzór | Gdzie |
|---|---|---|
| Rekrutacja (Pieniądz) | `scaleCostByEpoch(koszt)` (Kamień ×1 / Brąz ×2 / Żelazo ×4), potem dodatkowy mnożnik epoki (Brąz ×2, Żelazo ×4), potem tempo | `production.ts` `unitRecruitBaseMoneyCost`, `unitMoneyCost` |
| Utrzymanie Pieniądz/turę | `round(stawka po skali epoki × 4 (R_STAWKI) × tempo)` | `economy-upkeep.ts` `buildUnitUpkeepTable`, `unitUpkeep` |
| Utrzymanie surowca/turę | `scaleCostByEpoch(ilość) × tempo` (bez ×4) | `economy-upkeep.ts` `unitResourceUpkeep` |
| Żywność jednostki (własne terytorium) | baza `×4^(epoka−1)` (flaga ON; Kamień 1 / Brąz 4 / Żelazo 16) × R_STAWKI ×4 × tempo | `econ-era-rebalance.ts` `rebalancedUnitFoodBase`, `economy-upkeep.ts` `unitFoodPerTurn` |
| Żywność — obóz | × `zywnoscJednostkaOboz / zywnoscJednostkaRuch` = ×0,5 | `unitFoodPerTurn` |
| Żywność — poza terytorium | × `zywnoscMnoznikPozaTerytorium` = ×2 | `unitFoodPerTurn` |
| Racje obywateli | `pop × poziom × 2 × m(e)`, m(e) = 2^(e−1) (1/2/4) przy fladze ON | `population-growth-v85.ts`, `citizen-consumption-era.ts` |
| Cap Spichlerza centralnego | `1000 + magazynEraMultiplier(e) × (1000·Spichlerz I + 1500·Spichlerz II)`, mnożnik 2^(e−1) | `economy-upkeep.ts`, `building-resource-gate.ts` |

Uwaga: poprzednie wzory w dokumentach FOODGRANARY/SKARBIEC (żywność ×3^(e−1), brak skali na utrzymaniu, brak tempa) są nieaktualne — patrz sekcja 5.

## 2. Jednostki pojedyncze (ZMIERZONO, wartości z `node gra/tools/treasury-unit-cost-model.cjs`)

Format: Niski / Normalny / Wysoki. Pieniądz = rekrutacja i utrzymanie Pieniądz/turę. Żywność: własne terytorium / obóz / poza terytorium (na turę).

| Jednostka | Epoka | Rekrutacja (Pieniądz) | Utrzymanie Pieniądz/t | Surowiec/t | Żywność własne | Żywność obóz | Żywność poza |
|---|---|---|---|---|---|---|---|
| Wojownik | Kamień | 5 / 10 / 20 | 4 / 8 / 16 | Drewno 3 / 6 / 12 | 4 / 8 / 16 | 2 / 4 / 8 | 8 / 16 / 32 |
| Łucznik | Kamień | 3 / 6 / 12 | 4 / 8 / 16 | Drewno 3 / 6 / 12 | 4 / 8 / 16 | 2 / 4 / 8 | 8 / 16 / 32 |
| Rydwan (woły) | Kamień | 15 / 30 / 60 | 12 / 24 / 48 | Drewno 5 / 10 / 20 | 4 / 8 / 16 | 2 / 4 / 8 | 8 / 16 / 32 |
| Zwiadowca | Kamień | 4 / 8 / 16 | 0 / 0 / 0 | — | 0 | 0 | 0 |
| Włócznik | Brąz | 32 / 64 / 128 | 16 / 32 / 64 | Brąz 10 / 20 / 40 | 16 / 32 / 64 | 8 / 16 / 32 | 32 / 64 / 128 |
| Procarz | Brąz | 16 / 32 / 64 | 8 / 16 / 32 | Drewno 10 / 20 / 40 | 16 / 32 / 64 | 8 / 16 / 32 | 32 / 64 / 128 |
| Rydwan konny | Brąz | 56 / 112 / 224 | 24 / 48 / 96 | Brąz 10 / 20 / 40 | 16 / 32 / 64 | 8 / 16 / 32 | 32 / 64 / 128 |
| Falanga | Żelazo | 144 / 288 / 576 | 32 / 64 / 128 | Żelazo 20 / 40 / 80 | 64 / 128 / 256 | 32 / 64 / 128 | 128 / 256 / 512 |
| Hastati | Żelazo | 144 / 288 / 576 | 32 / 64 / 128 | Żelazo 20 / 40 / 80 | 64 / 128 / 256 | 32 / 64 / 128 | 128 / 256 / 512 |
| Konnica | Żelazo | 176 / 352 / 704 | 48 / 96 / 192 | Brąz 20 / 40 / 80 | 64 / 128 / 256 | 32 / 64 / 128 | 128 / 256 / 512 |

Wniosek: utrzymanie Pieniądza i żywność rosną z epoką jednostki (×2 / ×4 przy Brąz / Żelazo), a tempo mnoży je dalej (×1 / ×2 / ×4). Przy Wysokim tempie żywność Falangi poza terytorium wynosi 512 na turę — to wartość w jednostkach żywności, nie w zasobach gracza, i wymaga porównania z produkcją (NIE_ZMIERZONO w tej rundzie).

## 3. Armia 10 jednostek na epokę (ZMIERZONO dla założonego składu; skład NIE_ZMIERZONO w grze)

Założenie modelu: Kamień = 5 Wojownik + 5 Łucznik; Brąz = 5 Włócznik + 5 Procarz; Żelazo = 5 Falanga + 5 Hastati.

| Epoka | Pace | Rekrutacja (Pieniądz) | Utrzymanie Pieniądz/t | Surowiec/t | Żywność własne/t | Żywność obóz/t | Żywność poza/t |
|---|---|---|---|---|---|---|---|
| Kamień | Niski | 40 | 40 | Drewno 30 | 40 | 20 | 80 |
| Kamień | Normalny | 80 | 80 | Drewno 60 | 80 | 40 | 160 |
| Kamień | Wysoki | 160 | 160 | Drewno 120 | 160 | 80 | 320 |
| Brąz | Niski | 240 | 120 | Brąz 50, Drewno 50 | 160 | 80 | 320 |
| Brąz | Normalny | 480 | 240 | Brąz 100, Drewno 100 | 320 | 160 | 640 |
| Brąz | Wysoki | 960 | 480 | Brąz 200, Drewno 200 | 640 | 320 | 1280 |
| Żelazo | Niski | 1440 | 320 | Żelazo 200 | 640 | 320 | 1280 |
| Żelazo | Normalny | 2880 | 640 | Żelazo 400 | 1280 | 640 | 2560 |
| Żelazo | Wysoki | 5760 | 1280 | Żelazo 800 | 2560 | 1280 | 5120 |

## 4. Przykład bilansu skarbca — Brąz, 20 miast, Normalny ×2

Dane zrzutu (od właściciela): wpływy brutto 1550, utrzymanie budynków 786, utrzymanie jednostek 376, netto panelu 345, skarbiec 7096.

- **ZMIERZONO:** 1550 − 786 − 376 = 388, nie 345. Różnica 43 — NIE_ZMIERZONO (Administrator, zaokrąglenia lub inna pozycja).
- **NIE_ZMIERZONO:** skład armii w zrzucie. Bez składu liczby 376 nie da się przeliczyć na nowe wzory. Zrzut mógł też powstać przed FALAMI 884–887.
- Przykład z armią 10 × Brąz (5 Włócznik + 5 Procarz) przy Normalnym: utrzymanie 240 → netto **+524 ¤/turę** (1550 − 786 − 240).
- Wrażliwość dla puli 376: współczynnik k = skala epoki × tempo (Normalny: Kamień ×2, Brąz ×4, Żelazo ×8). Jeśli cała pula 376 byłaby z jednej epoki, utrzymanie wyniesie 752 / 1504 / 3008, a netto odpowiednio **+12 / −740 / −2244**. To są skrajne przedziały, nie prognoza.

Wniosek z tej sekcji: wynik netto **zależy od składu armii, którego nie znamy**. Przykład +524 dotyczy armii 10 jednostek, a nie armii ze zrzutu; dla puli 376 zebranej w całości w Brązie netto wynosi −740. Dane nie rozstrzygają, czy skarbiec jest ciasny.

Zrzut sam w sobie: 1550 − 786 − 376 = 388, a panel podaje netto 345 (różnica 43 — NIE_ZMIERZONO).

Racje obywateli (ZMIERZONO, `computeCityRationCost`, 1000 obywateli, poziom 2): Kamień 4000, Brąz 8000, Żelazo 16000 na turę.

Cap Spichlerza centralnego (ZMIERZONO wzorem, e=2): dla zrzutu 10 Spichlerzy I i 11 II cap = 54 000. Dekompozycja NIE_ZMIERZONO.

## 5. Co się zmieniło względem dokumentów FOODGRANARY / SKARBIEC

| Stwierdzenie w starym dokumencie | Stan obecny |
|---|---|
| „Utrzymanie jednostek bez skali epoki” (`unitUpkeep` nie czyta epoki) | **Nieaktualne.** Skala epoki jest w `buildUnitUpkeepTable` (×1/×2/×4). |
| „Żywność jednostek ×3^(e−1)” (Kamień 4, Brąz 12, Żelazo 36) | **Nieaktualne.** Geometria ×4 na epokę: 4 / 16 / 64 przy fladze ON. |
| „Brak mnożnika tempa na utrzymaniu” | **Nieaktualne.** Tempo „Koszty jednostek” (×1/×2/×4) mnoży rekrutację i utrzymanie Pieniądz/surowce/żywność (FALA 887). |
| Racje obywateli m(e) = 1+0,5(e−1) | **Nieaktualne przy fladze ON.** m(e) = 2^(e−1) (1/2/4). |
| Skarbiec: netto 345, armia 376 bez składu | Nadal zgodne z zrzutem, ale **NIE_ZMIERZONO** w nowych wzorach. |
| Wojsko żywności 312 (zrzut) | **Porównanie nieporównywalne.** 312 to stare wzory: ok. 26 jednostek po 12/t. Nowe 320 to 10 jednostek Brąz po 32/t (założenie modelu). Ta sama armia 26 × Włócznik w nowych wzorach to ok. **832/t** (ZMIERZONO stawki, skład zrzutu NIE_ZMIERZONO). |
| Rekrutacja: tylko Pieniądz × epoka | **Nieaktualne.** Dodatkowy mnożnik epoki (Brąz ×2, Żelazo ×4, FALA 884). |
| Kurs żywność → Podatek | Wg dispatchu zmieniony na 0,2 (FALA 883). **ZMIERZONO:** odczyt z `gra/data/econ-params.json`, klucz `targowisko_zywnosc_na_podatek_kurs`, pole `normal` = 0,2. Poza zakresem modelu. |

Spichlerz centralny (`food-granary-model.cjs`, ZMIERZONO wzorami, skład NIE_ZMIERZONO): racje zrzutu 1046 przeskalowane ze starego m=1,5 do m(2)=2 dają **1395/t**. Cap 54 000 jest osiągany w **16 tur** przy armii 10 × Brąz (netto 1648/t) albo w **22 tury** przy armii zrzutu w nowych wzorach 832/t (netto 1136/t). Warianty V0–V3 w modelu to propozycje, nie prognoza. Wcześniejsza wersja (13 tur, racje 1046, armia 312) była zawyżona.

Stare dokumenty oznaczono nagłówkiem NIEAKTUALNE (edycja tylko nagłówka):
- `dyspozycje/analizy/SKARBIEC-BRAZ-KOSZTY-JEDNOSTEK-OPTYMALIZACJA.md`
- `dyspozycje/analizy/ZYWNOSC-SPICHLERZ-BRAZ-OPTYMALIZACJA.md`

## 6. Pytania ABC do właściciela

**A. Czy przy Normalnym ×2 skarbiec w Brązie jest za ciasny?**
- A) Nie zmieniać; najpierw zmierzyć skład armii w żywej grze (VERIFY-LIVE, #38).
- B) Obniżyć domyślne tempo kosztów jednostek do Niskiego dla Brązu.
- C) Obniżyć mnożnik utrzymania Pieniądz (np. ×2 zamiast ×4 R_STAWKI) tylko dla Brązu.
- **Rekomendacja: A.** Powód: dane nie pozwalają rozstrzygnąć, czy skarbiec jest ciasny. Dla armii 10 × Brąz netto wynosi +524 ¤/turę, ale dla puli utrzymania 376 w całości z Brązu netto wynosi −740 (sekcja 4). Skład armii w zrzucie NIE_ZMIERZONO, więc pomiar (VERIFY-LIVE, #38) jest konieczny przed jakąkolwiek zmianą. Nie twierdzimy, że skarbiec nie jest ciasny.

**B. Czy żywność Falangi poza terytorium (512 przy Wysokim) jest akceptowalna?**
- A) Tak; kara ×2 poza terytorium ma zniechęcać do marszu.
- B) Nie; obniżyć mnożnik poza terytorium do ×1,5.
- **Rekomendacja: A do czasu pomiaru** w grze. Liczby pochodzą z kodu, nie z pomiaru zużycia.

Wszystkie tabele powyżej są wynikiem wywołań funkcji kodu. Liczby miast i zrzutów z sekcji 4 są danymi właściciela, a nie pomiarem tej rundy.
