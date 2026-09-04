# Katalog ulepszeń terenu (v1.0)

> **Poradnik gracza (Pełny)** · Część V §28 · dane: `gra/data/terrain-improvements.json`
> Pełne karty Wiki: `docs/encyklopedia/ulepszenia/`

Ulepszenia stawiasz z lewego panelu mapy (**Budowa**) na heksach w **swoim** terytorium. Płacisz **pracą** — nie złotem. Bonusy trafiają do miasta, które **pracuje** na danym polu (zakładka **Okolica**).

## Tabela wszystkich ulepszeń (17)

| Ulepszenie | Epoka | Koszt pracy | Bonus | Teren | Tech | Wiki |
|------------|-------|-------------|-------|-------|------|------|
| Bydło | Kamień | 20 | +2 żywność, +3 praca | Łąka, Równina | Oswojenie zwierząt | [Bydło](../encyklopedia/ulepszenia/bydlo.md) |
| Droga | Kamień | 15 | +1 Danina | każdy przejezdny heks | Koło | [Droga](../encyklopedia/ulepszenia/droga.md) |
| Farma | Kamień | 20 | +3 żywność | Łąka, Równina | Rolnictwo | [Farma](../encyklopedia/ulepszenia/farma.md) |
| Kamieniołom | Kamień | 22 | +1 praca, +1 kamień | Wzgórza, Góry (kamień) | Murarstwo | [Kamieniołom](../encyklopedia/ulepszenia/kamieniolom.md) |
| Kopalnia | Kamień | 25 | +2 praca | Wzgórza, Góry, złoże Rudy | Murarstwo | [Kopalnia](../encyklopedia/ulepszenia/kopalnia.md) |
| Lama | Kamień | 20 | +1 żywność, +3 praca | Łąka, Równina, Wzgórza | Oswojenie zwierząt | [Lama](../encyklopedia/ulepszenia/lama.md) |
| Obóz łowiecki | Kamień | 18 | +1 żywność, +1 złoto | Las / dzika zwierzyna | Łowiectwo | [Obóz łowiecki](../encyklopedia/ulepszenia/oboz_lowiecki.md) |
| Owce | Kamień | 20 | +1 żywność, +2 praca | Wzgórza | Oswojenie zwierząt | [Owce](../encyklopedia/ulepszenia/owce.md) |
| Tartak | Kamień | 25 | +3 praca | Ląd w terytorium (łąka, lasy, wzgórza…) | Obróbka drewna | [Tartak](../encyklopedia/ulepszenia/tartak.md) |
| Wyrąb | Kamień | 0 (wycinka) | — | Las | — | [Wyrąb](../encyklopedia/ulepszenia/wyrab.md) |
| Łodzie rybackie | Kamień | 20 | +2 żywność, +3 praca | Wybrzeże, Morze (ryby) | Żegluga | [Łodzie rybackie](../encyklopedia/ulepszenia/lodzie_rybackie.md) |
| Glinianka | Brąz | 20 | +1 praca | złoże Gliny | Garncarstwo | [Glinianka](../encyklopedia/ulepszenia/glinianka.md) |
| Irygacja | Brąz | 30 | +5 żywność | Łąka, Równina, Pustynia | Irygacja | [Irygacja](../encyklopedia/ulepszenia/irygacja.md) |
| Posterunek (Strażnica) | Brąz | 30 | —; +50% obrona (obóz) | ląd w/na krawędzi własnego zasięgu | — | [Posterunek (Strażnica)](../encyklopedia/ulepszenia/posterunek.md) |
| Tarasy uprawne | Brąz | 25 | +3 żywność | Wzgórza | — | [Tarasy uprawne](../encyklopedia/ulepszenia/tarasy.md) |
| Warzelnia soli | Brąz | 20 | +1 złoto, +1 żywność | złoże soli (Pustynia/Równina — hex.zloze=sol) | Garncarstwo | [Warzelnia soli](../encyklopedia/ulepszenia/warzelnia_soli.md) |
| Fort / umocnienia | Żelazo | 25 | —; +100% obrona (obóz) | dowolny ląd w terytorium | Wojskowosc | [Fort / umocnienia](../encyklopedia/ulepszenia/fort.md) |

---

## Żywność i hodowla

### Bydło

**Bydło** (epoka **Kamień**) kosztuje **20** pracy i wymaga technologii **Oswojenie zwierząt**. Daje: **+2 żywność, +3 praca**.
Dozwolony teren: Łąka, Równina.
**Warunek:** plaski ląd; pierwsze: złoże bydła; potem po odblokowaniu — bez złoża; + farma lub solo; NIE na Pustyni
**Odblokowuje:** Bydło (Rydwan po odblokowaniu)
**Surowiec:** odblokowuje dostęp do **bydlo** (model v1.0: tak/nie).


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+2 żywność, +3 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/bydlo.md`](../encyklopedia/ulepszenia/bydlo.md)

### Farma

**Farma** (epoka **Kamień**) kosztuje **20** pracy i wymaga technologii **Rolnictwo**. Daje: **+3 żywność**.
Dozwolony teren: Łąka, Równina.
**Warunek:** ziemia uprawna; DZIAŁA BEZ rzeki (podstawowy)


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+3 żywność** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/farma.md`](../encyklopedia/ulepszenia/farma.md)

### Lama

**Lama** (epoka **Kamień**) kosztuje **20** pracy i wymaga technologii **Oswojenie zwierząt**. Daje: **+1 żywność, +3 praca**.
Dozwolony teren: Łąka, Równina, Wzgórza.
**Warunek:** solo; tylko cyw. Inkowie; pierwsze: złoże lamy; NIE na Pustyni
**Odblokowuje:** Lama (transport / żywność)
**Surowiec:** odblokowuje dostęp do **lama** (model v1.0: tak/nie).


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+1 żywność, +3 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/lama.md`](../encyklopedia/ulepszenia/lama.md)

### Obóz łowiecki

**Obóz łowiecki** (epoka **Kamień**) kosztuje **18** pracy i wymaga technologii **Łowiectwo**. Daje: **+1 żywność, +1 złoto**.
Dozwolony teren: Las / dzika zwierzyna.
**Warunek:** dzika zwierzyna


### Przykład liczbowy

Koszt **18** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+1 żywność, +1 złoto** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/oboz_lowiecki.md`](../encyklopedia/ulepszenia/oboz_lowiecki.md)

### Owce

**Owce** (epoka **Kamień**) kosztuje **20** pracy i wymaga technologii **Oswojenie zwierząt**. Daje: **+1 żywność, +2 praca**.
Dozwolony teren: Wzgórza.
**Warunek:** solo wzgórze; pierwsze: złoże owiec; potem wzgórze bez złoża po odblokowaniu
**Odblokowuje:** Owce (wełna / jedzenie)
**Surowiec:** odblokowuje dostęp do **owce** (model v1.0: tak/nie).


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+1 żywność, +2 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/owce.md`](../encyklopedia/ulepszenia/owce.md)

### Łodzie rybackie

**Łodzie rybackie** (epoka **Kamień**) kosztuje **20** pracy i wymaga technologii **Żegluga**. Daje: **+2 żywność, +3 praca**.
Dozwolony teren: Wybrzeże, Morze (ryby).
**Warunek:** ławica ryb


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+2 żywność, +3 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/lodzie_rybackie.md`](../encyklopedia/ulepszenia/lodzie_rybackie.md)

### Irygacja

**Irygacja** (epoka **Brąz**) kosztuje **30** pracy i wymaga technologii **Irygacja**. Daje: **+5 żywność**.
Dozwolony teren: Łąka, Równina, Pustynia.
**Warunek:** TYLKO pole sąsiadujące z rzeką (1 pole) lub na rzece — BRAK łańcuchów; kluczowa nad Nilem


### Przykład liczbowy

Koszt **30** pracy przy **7** pracy/t na budynki (70%) → **~4** tury budowy.
Bonus **+5 żywność** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/irygacja.md`](../encyklopedia/ulepszenia/irygacja.md)

### Tarasy uprawne

**Tarasy uprawne** (epoka **Brąz**) kosztuje **25** pracy. Daje: **+3 żywność**.
Dozwolony teren: Wzgórza.
**Warunek:** UNIKALNE kulturowe (Chińczycy + Inkowie); solo wzgórze; +żywność; nie na złożu


### Przykład liczbowy

Koszt **25** pracy przy **7** pracy/t na budynki (70%) → **~3** tury budowy.
Bonus **+3 żywność** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/tarasy.md`](../encyklopedia/ulepszenia/tarasy.md)

## Produkcja i surowce

### Kamieniołom

**Kamieniołom** (epoka **Kamień**) kosztuje **22** pracy i wymaga technologii **Murarstwo**. Daje: **+1 praca, +1 kamień**.
Dozwolony teren: Wzgórza, Góry (kamień).
**Warunek:** budulec — mury, budynki
**Odblokowuje:** Kamień (mury / budynki)
**Surowiec:** odblokowuje dostęp do **kamien** (model v1.0: tak/nie).


### Przykład liczbowy

Koszt **22** pracy przy **7** pracy/t na budynki (70%) → **~3** tury budowy.
Bonus **+1 praca, +1 kamień** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/kamieniolom.md`](../encyklopedia/ulepszenia/kamieniolom.md)

### Kopalnia

**Kopalnia** (epoka **Kamień**) kosztuje **25** pracy i wymaga technologii **Murarstwo**. Daje: **+2 praca**.
Dozwolony teren: Wzgórza, Góry, złoże Rudy.
**Warunek:** wydobycie rudy do magazynu
**Odblokowuje:** Metal/Brąz (jednostki brązowe, mury)
**Surowiec:** odblokowuje dostęp do **ruda** (model v1.0: tak/nie).


### Przykład liczbowy

Koszt **25** pracy przy **7** pracy/t na budynki (70%) → **~3** tury budowy.
Bonus **+2 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/kopalnia.md`](../encyklopedia/ulepszenia/kopalnia.md)

### Tartak

**Tartak** (epoka **Kamień**) kosztuje **25** pracy i wymaga technologii **Obróbka drewna**. Daje: **+3 praca**.
Dozwolony teren: Ląd w terytorium (łąka, lasy, wzgórza…).
**Warunek:** stałe ulepszenie; MOŻE na lesie — las NIE znika; odblokowuje dostęp do drewna (v0.1 bez ilości)
**Odblokowuje:** Deski (z budynkiem miejskim Tartak)
**Surowiec:** odblokowuje dostęp do **drewno** (model v1.0: tak/nie).


### Przykład liczbowy

Koszt **25** pracy przy **7** pracy/t na budynki (70%) → **~3** tury budowy.
Bonus **+3 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/tartak.md`](../encyklopedia/ulepszenia/tartak.md)

### Wyrąb

**Wyrąb** (epoka **Kamień**) kosztuje **0** pracy. Daje: **—**.
Dozwolony teren: Las.
**Warunek:** darmowa wycinka; +20 Pracy/turę × 3 tury (=60); potem teren bazowy bez lasu


### Przykład liczbowy

Koszt **0** pracy przy **7** pracy/t na budynki (70%) → **~1** tury budowy.
Bonus **—** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/wyrab.md`](../encyklopedia/ulepszenia/wyrab.md)

### Glinianka

**Glinianka** (epoka **Brąz**) kosztuje **20** pracy i wymaga technologii **Garncarstwo**. Daje: **+1 praca**.
Dozwolony teren: złoże Gliny.
**Warunek:** glina → cegła (ważne w brązie)
**Odblokowuje:** Cegła (budynki brązu)
**Surowiec:** odblokowuje dostęp do **glina** (model v1.0: tak/nie).


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+1 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/glinianka.md`](../encyklopedia/ulepszenia/glinianka.md)

### Warzelnia soli

**Warzelnia soli** (epoka **Brąz**) kosztuje **20** pracy i wymaga technologii **Garncarstwo**. Daje: **+1 złoto, +1 żywność**.
Dozwolony teren: złoże soli (Pustynia/Równina — hex.zloze=sol).
**Warunek:** sól (konserwacja żywności + handel); bez wybrzeża bez złoża
**Odblokowuje:** Sól
**Surowiec:** odblokowuje dostęp do **sol** (model v1.0: tak/nie).


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+1 złoto, +1 żywność** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/warzelnia_soli.md`](../encyklopedia/ulepszenia/warzelnia_soli.md)

## Infrastruktura i obrona

### Droga

**Droga** (epoka **Kamień**) kosztuje **15** pracy i wymaga technologii **Koło**. Daje: **+1 Daniny**.
Dozwolony teren: każdy przejezdny heks.
**Warunek:** łączy TYLKO miasta i posterunki (MAPA pilnuje); +szybkość ruchu jednostek


### Przykład liczbowy

Koszt **15** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+1 Daniny** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/droga.md`](../encyklopedia/ulepszenia/droga.md)

### Posterunek (Strażnica)

**Posterunek (Strażnica)** (epoka **Brąz**) kosztuje **30** pracy. Daje: **—**.
Dozwolony teren: ląd w/na krawędzi własnego zasięgu.
**Warunek:** NIE miasto, BEZ plonów; ROZSZERZA zasięg terytorium o promień 5 pól; odkrywa mgłę; węzeł sieci dróg; +50% Obrony jednostkom obozującym na polu
**Zasięg terytorium:** +5 pól.


### Przykład liczbowy

Koszt **30** pracy przy **7** pracy/t na budynki (70%) → **~4** tury budowy.
Bonus **—** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/posterunek.md`](../encyklopedia/ulepszenia/posterunek.md)

### Fort / umocnienia

**Fort / umocnienia** (epoka **Żelazo**) kosztuje **25** pracy i wymaga technologii **Wojskowosc**. Daje: **—**.
Dozwolony teren: dowolny ląd w terytorium.
**Warunek:** +100% Obrony jednostkom obozującym na polu fortu (bez plonów); rozszerza zasięg terytorium o promień 10 pól
**Zasięg terytorium:** +10 pól.


### Przykład liczbowy

Koszt **25** pracy przy **7** pracy/t na budynki (70%) → **~3** tury budowy.
Bonus **—** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ [`docs/encyklopedia/ulepszenia/fort.md`](../encyklopedia/ulepszenia/fort.md)

---

*Wygenerowano z `terrain-improvements.json` · rev. E · 2026-07-03*