# Turniej: Mury (`mury`)

Kategoria: Obrona · Epoka wejścia: Brąz · maksPoziom: 2 · technologia: Budownictwo · definicja: `gra/data/buildings.json:998` · dzisiejszy top3: `:1034`

Cena korzyści (nie jest kandydatem): budowa 35 Pracy, 40 drewno + 80 kamien, utrzymanie 2 złota/turę.

## 1. Kandydaci (realne efekty z dowodem)

| ID | Rodzaj | Tytuł (z liczbą) | Zdanie | S | N | B | Z | O | C | Suma | Dowód |
|---|---|---|---|---|---|---|---|---|---|---|---|
| a | own | +200% Obrony obrońców miasta | Trzykrotna obrona jednostek broniących miasta; zastępuje +100% Palisady. | 5 | 3 | 4 | 2 | 3 | 5 | 47 | gra/data/miasto-params.json:79; gra/src/game/city-defense.ts:60-75 |
| b | own | Miasto trzeba oblegać — wróg nie wejdzie z marszu | Mury włączają tryb oblężenia (także gdy w mieście nie ma wojska). | 3 | 2 | 3 | 2 | 4 | 3 | 36 | gra/data/buildings.json:1040; gra/src/game/production.ts:854-861; gra/src/game/mapSiegeDetect.ts:50-62; gra/src/game/city-hex-movement.ts:55-62 |
| c | next (R-B1) | Warunek Cytadeli i Baszty (razem +400%) | Bez Murów w mieście nie zbudujesz Cytadeli ani Baszty. | 4 | 0 | 5 | 2 | 1 | 4 | 32 | gra/src/game/building-resource-gate.ts:110-121; gra/src/game/city-defense.ts:60-75 |

S=SKALA(3), N=NOWA MECHANIKA(3), B=BRAK ZASTĘPNIKA(2), Z=ZASIĘG(2), O=ODCZUWALNOŚĆ(2), C=CZYTELNOŚĆ(1); maks. 65. R-B1: kandydat „next” (warunek/rozbudowa) → N=0, O≤1.

Liczba realnych efektów: 3 (< 5) — zgodnie z decyzją właściciela (pkt 2) bez dopełniania. Dowód kompletności: przejrzane pola buildings.json (baza, przyrost×maksPoziom, odblokowuje, lokalizacja, upgradeFrom, wymagania), bramki CITY_BUILDING_PREREQ (building-resource-gate.ts:110-121), „wymagany budynek” badań (tech.json), konsumenci id budynku w gra/src/game (grep).

## 2. Efekty martwe / niedostępne (NIE w TOP 5 — „ukryć do czasu naprawy”)

- brak

## 3. Pojedynki (każdy z każdym)

- a vs b → **a** — przewaga w kryterium SKALA (5 vs 3), suma ważona 47:36.
- a vs c → **a** — przewaga w kryterium NOWA MECHANIKA (3 vs 0), suma ważona 47:32.
- b vs c → **b** — przewaga w kryterium ODCZUWALNOŚĆ (4 vs 1), suma ważona 36:32.

## 4. Ranking

1. **a** — +200% Obrony obrońców miasta — wygrane: 2, suma: 47
2. **b** — Miasto trzeba oblegać — wróg nie wejdzie z marszu — wygrane: 1, suma: 36
3. **c** — Warunek Cytadeli i Baszty (razem +400%) — wygrane: 0, suma: 32

## 5. TOP 5 (propozycja Operatora r1)

- Top1 (GŁÓWNA KORZYŚĆ): **+200% Obrony obrońców miasta** — Trzykrotna obrona jednostek broniących miasta; zastępuje +100% Palisady.
- Top2: **Miasto trzeba oblegać — wróg nie wejdzie z marszu** — Mury włączają tryb oblężenia (także gdy w mieście nie ma wojska).
- Top3: **Warunek Cytadeli i Baszty (razem +400%)** — Bez Murów w mieście nie zbudujesz Cytadeli ani Baszty.

## 6. Porównanie z dzisiejszym top3

- 1. „Bonus obrony miasta” → ZACHOWANE (w nowym TOP 5)
- 2. „Współpracuje z Basztą” → ZACHOWANE (w nowym TOP 5)
- 3. „Otwiera Budownictwo” → USUNIĘTE — warunek/wymaganie/ogólnik (masło maślane)
- DODANE: Miasto trzeba oblegać — wróg nie wejdzie z marszu

## 7. „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dziś: sekcji brak na karcie budynku. Propozycja:

- Zbuduj Mury, aby potroić obronę miasta (+200% Obrony).
- Zbuduj Cytadelę i Basztę (Inżynieria), aby podnieść obronę miasta do +400%.

## 8. Uwagi

Tryb oblężenia daje już Palisada — dla Murów to kontynuacja (N=2). Pozycja 3 dzisiejszego top3 to wymaganie technologii.
