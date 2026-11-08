# Turniej: Akademia (`akademia`)

Kategoria: Nauka · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: Filozofia · definicja: `gra/data/buildings.json:1645` · dzisiejszy top3: `:1686`

Cena korzyści (nie jest kandydatem): budowa 70 Pracy, 40 drewno + 70 cegla, utrzymanie 3 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +20% Nauki miasta (z Biblioteką razem +50%) | Druga premia procentowa do nauki, sumuje się z Biblioteką (+25% łatwy, +15% trudny). | 4 | 2 | 4 | 2 | 3 | 5 | 41 | gra/data/econ-params.json:327-333; gra/src/game/economy.ts:979-981 |
| b | own | +6 Nauki, +5 Kultury i +4 Szczęścia | Płaski dodatek ponad wkład Biblioteki. | 3 | 1 | 3 | 2 | 3 | 5 | 33 | gra/data/buildings.json:1645; gra/src/game/economy.ts:509-535 |
| c | own | Asymilacja kultury +1% na turę | Akademia działa jak dawny Amfiteatr/Teatr dla konwersji kultury. | 1 | 2 | 3 | 1 | 3 | 4 | 27 | gra/data/society-params.json:425-431; gra/src/game/culture-religion.ts:454; gra/src/game/conquest-stability.ts:63-66 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- baza.mnoznik 10 (+3 na poziom) — Akademia nie należy do żadnej ścieżki mnożnika (unit-building-bonuses.ts) ani do premii nauki (ta idzie z econ-params.json:327) — pole martwe. [gra/data/buildings.json:1645; gra/src/game/unit-building-bonuses.ts:9-33]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 41:33.
- a vs c → **a** — przewaga w kryterium SKALA (4 vs 1), suma ważona 41:27.
- b vs c → **b** — przewaga w kryterium SKALA (3 vs 1), suma ważona 33:27.

## 4. Ranking

1. **a** — +20% Nauki miasta (z Biblioteką razem +50%) — wygrane: 2, suma: 41
2. **b** — +6 Nauki, +5 Kultury i +4 Szczęścia — wygrane: 1, suma: 33
3. **c** — Asymilacja kultury +1% na turę — wygrane: 0, suma: 27

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+20% Nauki miasta (z Biblioteką razem +50%)** — Druga premia procentowa do nauki, sumuje się z Biblioteką (+25% łatwy, +15% trudny).
- Top2: **+6 Nauki, +5 Kultury i +4 Szczęścia** — Płaski dodatek ponad wkład Biblioteki.
- Top3: **Asymilacja kultury +1% na turę** — Akademia działa jak dawny Amfiteatr/Teatr dla konwersji kultury.

## 6. Porównanie z dzisiejszym top3

- 1. „Nauka i kultura miasta” → ZACHOWANE (w nowym TOP 5)
- 2. „Zadowolenie mieszkańców” → ZACHOWANE (w nowym TOP 5)
- 3. „Wymaga Biblioteki” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: +20% Nauki miasta (z Biblioteką razem +50%)
- DODANE: Asymilacja kultury +1% na turę

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Akademię, aby zwiększyć Naukę miasta o kolejne 20%.

## 8. Uwagi

Dzisiejszy top3 nie podaje liczb. Pozycja 3 to warunek.
