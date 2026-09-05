# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — zgłoszenie konfliktu (C-054)

RUNDA: 3/5 · DATA: 2026-09-04 · ROLA: Operator (Opus 5, effort high)

## Konflikt

**Co mówi dispatch (R3-1, warunek twardy):** „przy nowym budżecie plakietka **nie zachodzi
na sąsiednie heksy** — udowodnione zrzutem z żywego Chromium, w układzie gęstym".

**Co mówi kod:** plakietka to billboard o szerokości `0,52 × aspect` jednostek świata
(`cityMapStatChip.ts`, `makeCityMapBadgeSprite`), wyśrodkowany nad heksem miasta; sąsiedni
heks ma środek `√3 = 1,732` jednostki dalej (`hexutil.ts`, `HEX_R = 1`).

**Co mówi pomiar:** żadna z 30 zmierzonych plakietek 15 stolic (w obu konfiguracjach) nie
mieści się w 1,732 j. — ani po R3-1, ani przed nim, ani przed całym tematem. Granica
zachodzenia wypada przy szerokości plakietki 1,732 j. ≈ 160 px CSS, czyli przy nazwie ok.
56 px (4–5 wielkich liter). Z 15 pierwszych miast cywilizacji mieści się pod nią **jedna**
(`Tyr`, 46,4 px). Zulusi: 1,98 × odległości do sąsiada przed R3-1, 2,33 × po R3-1.

**Czego dotyczy sprzeczność:** kryterium 1 („0/15 przycięć") i kryterium 2 („brak zachodzenia
na sąsiednie heksy") nie dają się spełnić jednocześnie przy żadnej wartości budżetu — także
przy cofnięciu całego tematu. Dispatch przewidział ten wynik i kazał się zatrzymać
(„NIE wybieraj sam kompromisu"), zamiast wybierać odczyt warunku.

## Drugi, rozłączny pomiar tego samego pytania

Plakietka nie dotyka plakietki sąsiedniego miasta: minimalny odstęp miast w klastrze to
5 heksów = 8,66 j. (`clusters.ts`, `CLUSTER_CITY_STATE_MIN_HEX`), a najszersza zmierzona
plakietka ma 4,04 j. — 0/30 kolizji. Widać to na zrzucie z żywej gry (`dowody/
mapa-uklad-gesty-runda3-zblizenie.png`): stolica `XI'AN` i pięć miast-państw klastra,
cztery z nich w minimalnej odległości 5 heksów.

## Sprawa poboczna do tej samej decyzji

Baza 260 daje 0/15 przycięć w obu konfiguracjach z metody pomiarowej rundy 2 (stolica bez
glifu produkcji i z nim). WŁASNA stolica gracza ma jeszcze trzeci slot — WZROST% — i przy
niej `uMgungundlovu` nadal jest przycinane (1/15). Domknięcie także tej konfiguracji wymaga
bazy ≈ 305 px; sufit techniczny (`BADGE_MAX_TOTAL_SCALE` wobec gwarantowanego w WebGL2
`MAX_TEXTURE_SIZE = 2048`) przepuszcza bazę do ≈ 369, więc jest to wykonalne — ale poszerza
KAŻDĄ długą etykietę o kolejne 45 px.

## Stan pracy

Kod R3-1 i R3-2 jest napisany, bramki zielone, dowody w `dowody/`. Zgłoszenie dotyczy
wyłącznie odczytu warunku twardego i ewentualnego domknięcia sprawy pobocznej.
