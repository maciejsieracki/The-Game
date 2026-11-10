# Turniej: Pałac III (`palac_iii`)

Kategoria: Kultura/Administracja · Epoka wejścia: Żelazo · maksPoziom: 1 · technologia: - · definicja: `gra/data/buildings.json:1348` · dzisiejszy top3: `:1385`

Cena korzyści (nie jest kandydatem): budowa 90 Pracy, 50 drewno + 70 cegla, utrzymanie 5 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Prawo stolicy 45 → 55 pkt | Najwyższy stopień Pałacu w obecnych epokach (+71 łatwy, +44 trudny). | 4 | 2 | 3 | 2 | 3 | 4 | 38 | gra/data/society-params.json:830-836; gra/src/game/society-breakdown.ts:858-867 |
| b | own | +11 Kultury i +6 Szczęścia w stolicy | Ponad dwa razy więcej niż Pałac I. | 3 | 1 | 2 | 2 | 3 | 5 | 31 | gra/data/buildings.json:1348; gra/src/game/economy.ts:509-535 |
| c | own | Asymilacja kultury +2% na turę (zachowana) | Premia Pałacu do konwersji kultury działa dalej. | 2 | 1 | 3 | 1 | 5 | 4 | 31 | gra/src/game/conquest-stability.ts:63-72; gra/src/game/culture-religion.ts:456 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- −30% korupcji Pałacu I znika po rozbudowie — jak Pałac II — redukcja liczy tylko id „palac”. [gra/src/game/economy.ts:1226; gra/src/game/production.ts:820-838]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 38:31.
- a vs c → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 38:31.
- b vs c → **b** — remis 31:31, rozstrzyga SKALA (3 vs 2).

## 4. Ranking

1. **a** — Prawo stolicy 45 → 55 pkt — wygrane: 2, suma: 38
2. **b** — +11 Kultury i +6 Szczęścia w stolicy — wygrane: 1, suma: 31
3. **c** — Asymilacja kultury +2% na turę (zachowana) — wygrane: 0, suma: 31

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Prawo stolicy 45 → 55 pkt** — Najwyższy stopień Pałacu w obecnych epokach (+71 łatwy, +44 trudny).
- Top2: **+11 Kultury i +6 Szczęścia w stolicy** — Ponad dwa razy więcej niż Pałac I.
- Top3: **Asymilacja kultury +2% na turę (zachowana)** — Premia Pałacu do konwersji kultury działa dalej.

## 6. Porównanie z dzisiejszym top3

- 1. „Kultura i zadowolenie” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga awansu z Pałacu II” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Koniec obecnego łańcucha” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Prawo stolicy 45 → 55 pkt
- DODANE: Asymilacja kultury +2% na turę (zachowana)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Rozbuduj Pałac II do Pałacu III, aby podnieść Prawo stolicy do 55 pkt.

## 8. Uwagi

Pozycje 2–3 dzisiejszego top3 to warunek i „koniec łańcucha” (masło).
