# Turniej: Pałac (`palac`)

Kategoria: Kultura/Administracja · Epoka wejścia: Kamień · maksPoziom: 1 · technologia: - · definicja: `gra/data/buildings.json:1249` · dzisiejszy top3: `:1289`

Cena korzyści (nie jest kandydatem): budowa 40 Pracy, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +35 pkt Prawa w stolicy | Główne źródło Prawa stolicy (+45 łatwy, +28 trudny). | 4 | 3 | 3 | 2 | 3 | 4 | 41 | gra/data/society-params.json:816-822; gra/src/game/society-breakdown.ts:858-867 |
| b | own | −30% korupcji w stolicy | Zmniejsza straty z korupcji w mieście z Pałacem. | 3 | 3 | 3 | 2 | 3 | 5 | 39 | gra/src/game/economy.ts:1225-1250 |
| c | own | +5 Kultury i +3 Szczęścia w stolicy | Stały dodatek kultury i nastrojów. | 3 | 1 | 2 | 2 | 3 | 5 | 31 | gra/data/buildings.json:1249; gra/src/game/economy.ts:509-535 |
| d | own | Asymilacja kultury +2% na turę | Szybsza konwersja kultury w mieście z Pałacem. | 2 | 3 | 3 | 1 | 3 | 4 | 33 | gra/data/society-params.json:439-445; gra/src/game/culture-religion.ts:456; gra/src/game/conquest-stability.ts:63-72 |
| e | next (R-B1) | Rozbudowa do Pałacu II: Prawo 45, Kultura 8 | W epoce Brązu Pałac rośnie do drugiego stopnia. | 3 | 0 | 3 | 2 | 1 | 4 | 25 | gra/data/buildings.json:1298; gra/data/society-params.json:823-829 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (4 vs 3), suma ważona 41:39.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 41:31.
- a vs d → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 41:33.
- a vs e → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 41:25.
- b vs c → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 39:31.
- b vs d → **b** — przewaga w kryterium SKALA (3 vs 2), suma ważona 39:33.
- b vs e → **b** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 39:25.
- c vs d → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 1), suma ważona 33:31.
- c vs e → **c** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 31:25.
- d vs e → **d** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 33:25.

## 4. Ranking

1. **a** — +35 pkt Prawa w stolicy — wygrane: 4, suma: 41
2. **b** — −30% korupcji w stolicy — wygrane: 3, suma: 39
3. **d** — Asymilacja kultury +2% na turę — wygrane: 2, suma: 33
4. **c** — +5 Kultury i +3 Szczęścia w stolicy — wygrane: 1, suma: 31
5. **e** — Rozbudowa do Pałacu II: Prawo 45, Kultura 8 — wygrane: 0, suma: 25

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+35 pkt Prawa w stolicy** — Główne źródło Prawa stolicy (+45 łatwy, +28 trudny).
- Top2: **−30% korupcji w stolicy** — Zmniejsza straty z korupcji w mieście z Pałacem.
- Top3: **Asymilacja kultury +2% na turę** — Szybsza konwersja kultury w mieście z Pałacem.
- Top4: **+5 Kultury i +3 Szczęścia w stolicy** — Stały dodatek kultury i nastrojów.
- Top5: **Rozbudowa do Pałacu II: Prawo 45, Kultura 8** — W epoce Brązu Pałac rośnie do drugiego stopnia.

## 6. Porównanie z dzisiejszym top3

- 1. „Kultura i zadowolenie” → ZACHOWANE (w nowym TOP 5)
- 2. „Wyłącznie w stolicy” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera rozbudowę do Pałacu II” → ZACHOWANE (w nowym TOP 5)
- DODANE: +35 pkt Prawa w stolicy
- DODANE: −30% korupcji w stolicy
- DODANE: Asymilacja kultury +2% na turę

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Pałac w stolicy, aby zapewnić stolicy 35 pkt Prawa.
- Rozbuduj go do Pałacu II (epoka Brązu), aby podnieść Prawo stolicy do 45 i Kulturę do 8.

## 8. Uwagi

Pozycja 2 dzisiejszego top3 to warunek lokalizacji. Dzisiejszy top3 pomija Prawo i korupcję.
