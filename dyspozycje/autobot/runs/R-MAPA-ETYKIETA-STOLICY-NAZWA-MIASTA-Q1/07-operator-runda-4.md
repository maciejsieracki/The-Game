# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — Operator, runda 4

STATUS: PASS
DOMAIN: GAME
TEMAT: R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1
MODEL+EFFORT: Opus 5, effort high (Operator)
GOAL: R4-1 — baza szerokości nazwy dobrana POMIAREM tak, by dać 0/15 przycięć we wszystkich
trzech konfiguracjach slotów (stolica obca bez glifu produkcji, z glifem, własna stolica
gracza z WZROST%). Praca rund 2–3 utrzymana.

## ZMIANY (baza `53b156c5`, allowlista)

- `gra/src/render/cityMapStatChip.ts` — `CITY_NAME_BUDGET_BASE` 260 → **305**; poza tym
  wyłącznie komentarze (diff bez komentarzy to jedna linia). Zaktualizowany opis sufitu
  `BADGE_MAX_TOTAL_SCALE` na liczby zmierzone przy nowej bazie.
- `gra/tools/mapa-etykieta-stolicy-test.cjs` — G6 z noty zmieniona w ASERCJĘ trzeciej
  konfiguracji; nowe G6a (minimum 297,9 px) i G7 (zapas na slot WZROST% do 52 px);
  G5 liczy najgorszy przypadek z układu pigułki (`W ≤ BASE + 158`) zamiast pojedynczego
  pomiaru 143 px.
- `dowody/pomiar-plakietki-runda-4.cjs`, `dowody/zrzut-mapy-runda-4.cjs`, 5 PNG.
Nietknięte: `display-names.ts`, `cluster-spawn.ts`, `city-names-pool.ts`, `civ-names.ts`,
`render/cities.ts`, dane JSON, `main.ts`.

## POMIAR — 305 POTWIERDZONE, ALE Z INNEGO POWODU NIŻ W DISPATCHU (zgłoszenie)

Kotwica rundy 3 (304,6 px) opierała się na szerokości literału `−100,0%` = 51,7 px, którego
`formatCityGrowthPercentLabel` **nie potrafi wydać** (dla −100 zwraca `−100%`; ułamek tylko
gdy istnieje). Najszerszy zapis dla realnej wartości to `−99,9%` = **45 px**, więc minimum
arytmetyczne to 213,9 + 19 + 20 + 45 = **297,9 → 298 px**, nie 304,6.
**Zostawiam 305** i to jest wybór z pomiaru, nie dopasowanie do dispatchu: przy 298 zapas nad
`uMgungundlovu` wynosi 0,1 px i znika przy pierwszym zapisie WZROST% szerszym niż `−99,9%`
(np. `−100,5%` ≈ 49 px). Baza 305 daje 7,1 px zapasu i przepuszcza slot WZROST% do 52 px.

Przycięcia (żywy Chromium, `700 22px Georgia`, baza 260 → 305):
obca bez glifu **0/15 → 0/15**; obca z glifem **0/15 → 0/15**; stolica gracza z WZROST%
**1/15 (zulusi) → 0/15**. Odczyt niezależny, z prawdziwego `makeCityMapBadgeSprite`
(szerokość wyświetlonej nazwy z geometrii sprite'a): **0/45 przyciętych** w trzech
konfiguracjach × 15 cywilizacji. Cała pula: nazw dłuższych niż budżet 25/1500 → 8/1500.

**Kolizje plakietka↔plakietka: 0/45** — minimalny odstęp miast w klastrze 5 heksów = 8,66 j.
świata wobec najszerszej plakietki 4,62 j. (najszersza **osiągalna**, z tarczą obrony i nazwą
wypełniającą budżet: **5,02 j.** — nadal bez kolizji; korekta z obrony rundy 4). (Kontekst, NIE kryterium: 45/45 plakietek jest
szerszych niż jeden heks — tak było też przed tematem.)

**Margines do sufitu tekstury (SKORYGOWANE w obronie rundy 4 — zarzut 1 Evaluatora trafny):**
najszersza **osiągalna** plakietka **463 px CSS** × `BADGE_MAX_TOTAL_SCALE` 4 = **1852 px**
wobec gwarantowanych w WebGL2 **2048 px** → **margines 196 px tekstury** (49 px CSS, czyli
49 px zapasu na bazie). **Sufit przepuszcza bazę do 354.** Nie przekroczony.
Najgorszy przypadek to pełny komplet slotów (**z tarczą obrony**) + nazwa z puli dłuższa
niż budżet, przycięta do budżetu — `Kartagena Hiszpańska`, 287,5 px; daje dokładnie
`BASE + 158`, tę samą stałą, której używa asercja G5. Pierwotnie podane 426 px / 344 px / 391
pochodziło z węższej próby (tylko `miasta_cywilizacji[0]`, `defenseTier: 0`, nazwa krótsza
od budżetu) i było zawyżeniem zapasu o 148 px tekstury; baza 391 dałaby `(391+158)×4 = 2196
> 2048`. Wartość bazy **305 bez zmian** — 1852 < 2048, więc nie było defektu runtime.

## DOWÓD Z ŻYWEGO CHROMIUM

`dowody/mapa-uklad-gesty-runda4-zblizenie.png` (+ 1600×1000): **stolica GRACZA z trzema
slotami** — korona, `UMGUNGUNDLOVU` w całości bez wielokropka, `3%` (WZROST%), glif produkcji,
populacja — otoczona sześcioma miastami-państwami, trzy z nich w minimalnej odległości
5 heksów; żadna plakietka nie dotyka drugiej. Partia założona **prawdziwym kreatorem nowej
gry** (Menu → Epoka Brązu → Zulusi → Rozpocznij grę), bo hak `startNewGame` ma na stałe
`civId: 'rzymianie'` (`main.ts` poza allowlistą), a „Rzym" zmieściłby się w każdym budżecie.
Produkcja włączona ścieżką gracza: klik w miasto → „Buduj" → „Wróć na mapę"
(`dowody/widok-miasta-runda4-produkcja.png`).

## TESTY

`tsc --noEmit` zielone. `mapa-etykieta-stolicy` **47/0**; `display-names` 27/0;
`city-names-pool` 12/0; `city-names-pools` 6/0; `civ-names` 6/0; `rozmiar-label` 13/0;
`city-map-badge` 62/0; `city-badge-growth-percent` 38/0; `danina-podatek-nazwa` 15/0;
`diplomacy-display` 35/0; `unit-recruit-nazwa` 17/0; `cluster-start-q2-smoke` 16/0.
Referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat **6/6**.
Parytet czerwonych z rundą 3: `flaga-mp-nie-gasnie` 31/1, `miasta-panstwa-wylaczone` 52/3 —
bez pogorszenia.
Nietautologiczność: cofnięcie bazy 305 → 260 daje `mapa-etykieta-stolicy` **45/2** (G6, G7);
mutacja cofnięta.

## BLOKADY

Brak. Kryterium „brak zachodzenia na sąsiednie heksy" nie obowiązuje (ratyfikacja rundy 4).

RUNDY: 4/5
NASTĘPNY KROK: Evaluator (Opus 5, effort high), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
