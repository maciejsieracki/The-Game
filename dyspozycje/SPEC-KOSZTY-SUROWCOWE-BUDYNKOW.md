# SPEC: koszty surowcowe budynków — ZATWIERDZONE przez Macieja 2026-07-25

## ZASADA
- **Epoka Kamienia** — wyłącznie **drewno**.
- **Epoka Brązu** — **drewno + kamień** (w nieco większych ilościach niż dotąd).
- **Epoka Żelaza** — **drewno + cegła**, a przy budowlach obronnych i porcie **drewno + kamień**.
- **Brąz i żelazo jako surowiec budowlany — ZAKAZANE we wszystkich epokach.**
- Wszystkie liczby to sztuki surowca (`koszt_surowce` w `gra/data/buildings.json`). Koszt Pracy (`kosztBudowy`) bez zmian.

## POWÓD (ustalony w tej samej rozmowie)
Cegła powstaje wyłącznie w Cegielni (2 glina + 1 drewno → 1 cegła), a glina występuje TYLKO na lądzie z rzeką.
Sześć budynków Brązu kosztowało samą cegłę, więc na starcie epoki były niebudowalne, a miasto bez złoża gliny
nie zbudowałoby ich nigdy (cegła nie przechodzi przez szlaki handlowe — tam idą tylko brąz, żelazo i konie).

## EPOKA KAMIENIA — samo drewno
| Budynek | Było | Ma być |
|---|---|---|
| Stolarnia | drewno 5 | drewno 5 |
| Targowisko (Rynek) | drewno 6 | drewno 6 |
| Pałac | drewno 8 | drewno 8 |
| **Dom Starszyzny** (nowy) | — | drewno 6 |
| Garncarnia | drewno 4 + kamień 2 | **drewno 6** |
| Warsztat kamieniarski | drewno 3 + kamień 3 | **drewno 6** |
| Spichlerz | drewno 5 + kamień 3 | **drewno 8** |
| Studnia | kamień 5 | **drewno 5** |
| Stela / Pomnik | kamień 6 | **kamień 6 — WYJĄTEK, patrz niżej** |
| Kamienne kręgi | kamień 8 | **kamień 8 — WYJĄTEK, patrz niżej** |

**WYJĄTEK (rekomendacja Claude, do potwierdzenia):** Kamienne kręgi i Stela/Pomnik zostają na kamieniu.
Zasada „epoka Kamienia = samo drewno" dałaby Stonehenge z bali, co łamie warunek zgodności historycznej.
Jeśli Maciej powie inaczej — zmiana dwóch linii na `drewno 8` i `drewno 6`.

## EPOKA BRĄZU — drewno + kamień
| Budynek | Było | Ma być |
|---|---|---|
| Kuźnia | drewno 4 + kamień 4 | **drewno 6 + kamień 6** |
| Cegielnia | drewno 4 + kamień 4 | **drewno 6 + kamień 6** |
| Biblioteka | cegła 5 | **drewno 6 + kamień 6** |
| **Dwór Zarządcy** (nowy) | — | **drewno 6 + kamień 6** |
| Świątynia | cegła 6 | **drewno 6 + kamień 8** |
| Trybunał | cegła 8 | **drewno 6 + kamień 8** |
| Mennica | kamień 6 + brąz 3 | **drewno 6 + kamień 8** |
| Piec hutniczy | kamień 6 + cegła 4 | **drewno 6 + kamień 8** |
| Koszary | drewno 6 + kamień 6 + brąz 4 | **drewno 8 + kamień 8** |
| Spichlerz II | cegła 10 | **drewno 8 + kamień 10** |
| Magazyn | drewno 8 + kamień 4 | **drewno 10 + kamień 6** |
| Pałac II | drewno 8 + kamień 8 | **drewno 10 + kamień 10** |
| Port handlowy | drewno 10 | **drewno 12 + kamień 6** |
| Akwedukt | cegła 12 | **drewno 6 + kamień 12** |
| Mury | cegła 15 | **drewno 8 + kamień 16** |

## EPOKA ŻELAZA — drewno + cegła; obrona i port na drewno + kamień
| Budynek | Było | Ma być |
|---|---|---|
| Sąd | cegła 8 | **drewno 6 + cegła 10** |
| Pretorium | cegła 9 | **drewno 8 + cegła 10** |
| Teatr | cegła 10 | **drewno 8 + cegła 10** |
| Łaźnia publiczna | cegła 10 | **drewno 8 + cegła 12** |
| Akademia | cegła 14 | **drewno 8 + cegła 14** |
| Kuźnia żelaza | cegła 6 + brąz 4 | **drewno 8 + cegła 10** |
| Odlewnia żelaza | cegła 8 + brąz 4 | **drewno 8 + cegła 10** |
| Akademia wojskowa | cegła 12 + żelazo 6 | **drewno 10 + cegła 14** |
| Pałac III | drewno 8 + kamień 8 + cegła 6 | **drewno 10 + cegła 14** |
| Cytadela | cegła 18 + żelazo 6 | **drewno 10 + kamień 20** |
| Warsztat oblężniczy | cegła 8 + żelazo 6 | **drewno 10 + kamień 10** |
| Port wielki | cegła 10 + brąz 4 | **drewno 12 + kamień 10** |

Cytadela, Warsztat oblężniczy i Port wielki idą na kamień zamiast cegły: mury i nabrzeża stawiano z kamienia,
a przy okazji miasto bez złoża gliny nie zostaje w epoce Żelaza bez obrony i bez portu.

## EPOKA KLASYCZNA (poza zasięgiem dzisiejszej gry)
| Budynek | Było | Ma być |
|---|---|---|
| Wielka Kuźnia | brak kosztu surowcowego | **drewno 12 + cegła 16** |

---

# SPEC: łańcuch kuźni — ZATWIERDZONE przez Macieja 2026-07-25

**Zmiana nazwy:** „Kuznia" → **„Kuźnia brązu"**. Identyfikator `kuznia` w danych **zostaje bez zmian**
(zmiana id zepsułaby wczytywanie zapisanych gier) — zmienia się wyłącznie nazwa wyświetlana graczowi.

**Łańcuch (rozwój w górę, następca kasuje poprzednika — tak jak Pałac):**
`kuznia` (Kuźnia brązu, Brąz) → `kuznia_zelaza` (Kuźnia żelaza, Żelazo) → `wielka_kuznia` (Wielka Kuźnia, klasyczna)

**Do naprawy w danych:**
1. `kuznia_zelaza` dostaje `upgradeFrom: "kuznia"` — dziś brakuje tego ogniwa i oba budynki stoją obok siebie.
2. `kuznia` — `maksPoziom` na 1 i przyrost przestaje być stosowany (dziś rośnie z epoką do 9 pkt Pracy w Żelazie).
3. Nazwa „Kuznia" → „Kuźnia brązu" w danych, Civpedii, poradniku i wszędzie, gdzie występuje.

**Docelowe parametry:**
| Parametr | Kuźnia brązu | Kuźnia żelaza | Wielka Kuźnia |
|---|---|---|---|
| Epoka | Brąz | Żelazo | klasyczna |
| Praca | 6 pkt/turę | 8 pkt/turę | 20 pkt/turę |
| Pieniądz | 1 pkt/turę | 2 pkt/turę | 5 pkt/turę |
| Pancerz jednostek (suma po łańcuchu) | +15% | **+30%** | **+45%** |
| Koszt budowy | 30 pkt Pracy | 60 pkt Pracy | 90 pkt Pracy |
| Surowce | drewno 6 + kamień 6 | drewno 8 + cegła 10 | drewno 12 + cegła 16 |
| Utrzymanie | 2 pieniądze/turę | 3 pieniądze/turę | 4 pieniądze/turę |

W dzisiejszej grze o trzech epokach Pancerz dobija do **30%** — Wielka Kuźnia należy do epoki klasycznej.

---

# ANEKS 2026-11-09 — R-WEB-BUILDING-COSTS-ERA-RESOURCES-IMPL-Q1 (decyzja właściciela)

**Zastępuje** zasady epokowe z początku specyfikacji (Kamień = samo drewno; Brąz = drewno + kamień;
Żelazo = drewno + cegła, obrona/port = drewno + kamień). Obowiązuje od tej zmiany; pilnują jej
`gra/tools/koszty-surowcowe-test.cjs` (sekcje A–C) i `gra/tools/building-cost-resource-availability-test.cjs`.

1. **Garncarstwo** (Kamień) przeniesione z poziomu 2 na **poziom 1** (`gra/data/tech.json`). Prereq bez zmian
   („—”), więc brak cyklu; Wymiana i Brązownictwo zachowują prereq Garncarstwa. Tier-gating (`research.ts`,
   `epochTierGateMet`) bez zmian w kodzie — poziom 2 Kamienia to teraz Murarstwo, Mistycyzm, Wymiana, Gospodarka wodna.
2. **Kamień — budynki z technologii poziomu 2 i 3: drewno = kamień** (1:1, większa z dotychczasowych ilości):
   Warsztat kamieniarski 30/30, Stela 30/30, Kamienne kręgi 40/40, Targowisko 30/30, Studnia 25/25.
   Budynki poziomu 1 i bez techu zostają na samym drewnie.
3. **Brąz — drewno = kamień = cegła = dotychczasowa ilość kamienia** (10 budynków dostępnych dopiero po Cegielni:
   Biblioteka 30, Spichlerz II 50, Świątynia 40, Magazyn 30, Dwór Zarządcy 30, Trybunał 40, Mury 80, Akwedukt 60,
   Mennica 40, Emporion 60 — Emporion nie figurował w tabeli projektu, potraktowany wg reguły).
   **ZAŁOŻENIE (do potwierdzenia przez właściciela):** budynki, które mogą stanąć PRZED Cegielnią — Kuźnia brązu,
   Odlewnia brązu, Port handlowy, Koszary, Pałac II — oraz sama Cegielnia: drewno = kamień (= dzisiejszy kamień),
   **bez cegły** (reguła „surowiec nie wcześniej niż dostępny”, brak pętli Cegielni).
4. **Żelazo (epoka 3 i 4) — cegła = kamień = drewno = dotychczasowa ilość cegły.** **ZAŁOŻENIE:** budynki bez
   cegły dotąd (Baszta, Cytadela/fort, Port wielki, Warsztat oblężniczy): cegła = dotychczasowy kamień.
5. **Utrzymanie surowcowe budynków** — mechanizm ISTNIEJE (`buildingResourceUpkeep`, `economy-upkeep.ts`): stała
   `BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE` = 5 szt./turę za KAŻDY typ surowca obecny w `koszt_surowce`, niezależnie
   od ilości. Dodanie typu do kosztu budowy dokłada więc automatycznie 5/turę tego surowca — tyle samo, ile płacą
   dotychczasowe surowce budynku (reguła właściciela spełniona bez zmiany kodu). Skutek: +30 typów surowców
   w 32 zmienionych budynkach = maks. +150 szt./turę, jeśli wszystkie stoją naraz.
