# Turniej: Pałac II (`palac_ii`)

Kategoria: Kultura/Administracja · Epoka wejścia: Brąz · maksPoziom: 1 · technologia: - · definicja: `gra/data/buildings.json:1298` · dzisiejszy top3: `:1335`

Cena korzyści (nie jest kandydatem): budowa 60 Pracy, 50 drewno + 50 kamien, utrzymanie 3 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | Prawo stolicy 35 → 45 pkt | Wyższy stopień Pałacu daje więcej Prawa (+58 łatwy, +36 trudny). | 4 | 2 | 3 | 2 | 3 | 4 | 38 | gra/data/society-params.json:823-829; gra/src/game/society-breakdown.ts:858-867 |
| b | own | +8 Kultury i +4 Szczęścia w stolicy | Półtora raza więcej niż Pałac I. | 3 | 1 | 2 | 2 | 3 | 5 | 31 | gra/data/buildings.json:1298; gra/src/game/economy.ts:509-535 |
| c | own | Asymilacja kultury +2% na turę (zachowana) | Premia Pałacu do konwersji kultury działa dalej. | 2 | 1 | 3 | 1 | 5 | 4 | 31 | gra/src/game/conquest-stability.ts:63-72; gra/src/game/culture-religion.ts:456 |
| d | next (R-B1) | Rozbudowa do Pałacu III: Prawo 55, Kultura 11 | W epoce Żelaza ostatni stopień Pałacu. | 3 | 0 | 3 | 2 | 1 | 4 | 25 | gra/data/buildings.json:1348; gra/data/society-params.json:830-836 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 4 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- −30% korupcji Pałacu I znika po rozbudowie — KORUPCJA_REDUKCJA_BUDYNKI zawiera tylko id „palac”, a rozbudowa usuwa je z listy budynków — Pałac II/III traci redukcję korupcji (prawdopodobny błąd, osobny temat). [gra/src/game/economy.ts:1226; gra/src/game/production.ts:820-838]

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 1), suma ważona 38:31.
- a vs c → **a** — przewaga w kryterium SKALA (4 vs 2), suma ważona 38:31.
- a vs d → **a** — przewaga w kryterium NOWA MECHANIKA (2 vs 0), suma ważona 38:25.
- b vs c → **b** — remis 31:31, rozstrzyga SKALA (3 vs 2).
- b vs d → **b** — przewaga w kryterium ODCZUWALNOŚĆ (3 vs 1), suma ważona 31:25.
- c vs d → **c** — przewaga w kryterium ODCZUWALNOŚĆ (5 vs 1), suma ważona 31:25.

## 4. Ranking

1. **a** — Prawo stolicy 35 → 45 pkt — wygrane: 3, suma: 38
2. **b** — +8 Kultury i +4 Szczęścia w stolicy — wygrane: 2, suma: 31
3. **c** — Asymilacja kultury +2% na turę (zachowana) — wygrane: 1, suma: 31
4. **d** — Rozbudowa do Pałacu III: Prawo 55, Kultura 11 — wygrane: 0, suma: 25

## 5. TOP 5 (propozycja Operatora r1 po Obronie r1)

- Top1 (GŁÓWNA KORZYŚĆ): **Prawo stolicy 35 → 45 pkt** — Wyższy stopień Pałacu daje więcej Prawa (+58 łatwy, +36 trudny).
- Top2: **+8 Kultury i +4 Szczęścia w stolicy** — Półtora raza więcej niż Pałac I.
- Top3: **Asymilacja kultury +2% na turę (zachowana)** — Premia Pałacu do konwersji kultury działa dalej.
- Top4: **Rozbudowa do Pałacu III: Prawo 55, Kultura 11** — W epoce Żelaza ostatni stopień Pałacu.

## 6. Porównanie z dzisiejszym top3

- 1. „Kultura i zadowolenie” → ZACHOWANE (w nowym TOP 5)
- 2. „Wymaga awansu z Pałacu I” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- 3. „Otwiera rozbudowę do Pałacu III” → ZACHOWANE (w nowym TOP 5)
- DODANE: Prawo stolicy 35 → 45 pkt
- DODANE: Asymilacja kultury +2% na turę (zachowana)

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Rozbuduj Pałac do Pałacu II, aby podnieść Prawo stolicy do 45 pkt.
- Rozbuduj go do Pałacu III (epoka Żelaza), aby podnieść Prawo stolicy do 55 i Kulturę do 11.

## 8. Uwagi

Pozycja 2 dzisiejszego top3 to warunek. Utrata −30% korupcji po rozbudowie — zgłoszone jako błąd do osobnego tematu.
