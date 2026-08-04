# Katalog budynków miasta (v1.0)

> **Poradnik gracza (Pełny)** · Część VII §45 · dane: `gra/data/buildings.json`
> Pełne karty Wiki: `docs/encyklopedia/budynki/` · spis: `docs/PORADNIK-GRACZA-SPIS-TRESCI.md`

> **WERYFIKACJA 2026-08-04 (rev. G2):** Obrona miasta = **wyłącznie % Obrony** (Mury +200%, Cytadela/Baszta +100% każda obok). Kuźnie = **ścieżka A Pancerz** po wizycie; Koszary/Akademia wojskowa/Warsztat = **ścieżka B** miękkie staty. Targowisko = **Pieniądz/t**, nie mnożnik handlu. **Cytadela** (`id: fort`) to **osobny budynek obok Murów**, nie upgrade slotu. **Wielka Kuźnia** — parkowana (epoka 4, poza 3 epokami v1). Pełne karty: `docs/encyklopedia/budynki/`.

Budynki wznosisz w zakładce **Produkcja** panelu miasta. Koszt budowy to **praca** z puli imperium; utrzymanie — **złoto** co turę. **Maks. poziomów** zależy od budynku (np. Targowisko **3**, Mury **2**, kuźnie wojskowe często **1**) — patrz karta w Civpedii, nie zakładaj „zawsze 10". Część budynków dodatkowo kosztuje **surowce z magazynu** przy wejściu do kolejki (Część VIII §53.2).

## Koszt materiałowy — 9 budynków (2026-07-23)

| Budynek | Koszt materiałowy | Skąd brać |
|---------|---------------------|-----------|
| Świątynia | 6 ceramiki | Garncarnia |
| Biblioteka | 5 ceramiki | Garncarnia |
| Spichlerz II *(brak w tabeli głównej — §82.1c)* | 10 cegły | Cegielnia |
| Akwedukt *(brak w tabeli głównej)* | 12 cegły | Cegielnia |
| Pretorium | 9 cegły | Cegielnia |
| Łaźnia publiczna | 10 cegły | Cegielnia |
| Akademia | 14 cegły | Cegielnia |
| Mury | 8 drewna, 16 kamienia | mapa / kamieniarski |
| Cytadela (dawny Fort) | 10 drewna, 20 kamienia | mapa / kamieniarski |

Brak materiału w magazynie blokuje wejście do kolejki — karta budynku pokazuje brakujący chip surowca. Pełny mechanizm (magazyn per miasto, dostęp do złóż) — Część VIII §53.

## Tabela wszystkich budynków (26 z 37 — patrz weryfikacja wyżej)

| Budynek | Kategoria | Epoka | Tech | Koszt (poz. 1) | Utrzymanie | Bonus poz. 1 | Wiki |
|---------|-----------|-------|------|----------------|------------|--------------|------|
| Stolarnia | Produkcja | Kamień | Obróbka drewna | 20 pracy | 1 ¤/t | +5 praca | [Stolarnia](../encyklopedia/budynki/stolarnia.md) |
| Warsztat kamieniarski | Produkcja | Kamień | Murarstwo | 20 pracy | 1 ¤/t | +4 praca | [Warsztat kamieniarski](../encyklopedia/budynki/kamieniarski.md) |
| Kuźnia brązu | Produkcja+Wojsko | Brąz | Brązownictwo | 30 pracy | 2 ¤/t | +6 praca, +1 ¤; +15% Pancerz (wizyta) | [Kuźnia brązu](../encyklopedia/budynki/kuznia.md) |
| Targowisko (Rynek) | Pieniadz | Kamień | Wymiana | 25 pracy | 1 ¤/t | +5 ¤/t (max 3 poz.) | [Targowisko (Rynek)](../encyklopedia/budynki/targowisko.md) |
| Port handlowy | Pieniadz | Brąz | Żegluga | 30 pracy | 2 ¤/t | +1 praca, +5 złoto | [Port handlowy](../encyklopedia/budynki/port.md) |
| Spichlerz | Zywnosc | Kamień | Garncarstwo | 20 pracy | 1 ¤/t | +2 żywność | [Spichlerz](../encyklopedia/budynki/spichlerz.md) |
| Swiatynia | Kultura | Kamień | Mistycyzm | 25 pracy | 1 ¤/t | +2 kultura, +2 szczęście | [Swiatynia](../encyklopedia/budynki/swiatynia.md) |
| Biblioteka | Nauka | Brąz | Pismo | 25 pracy | 1 ¤/t | +3 nauka, +1 kultura | [Biblioteka](../encyklopedia/budynki/biblioteka.md) |
| Studnia | Zdrowie | Kamień | Gospodarka wodna | 15 pracy | 1 ¤/t | +1 szczęście | [Studnia](../encyklopedia/budynki/studnia.md) |
| Mury | Obrona | Brąz | Budownictwo | 35 pracy | 2 ¤/t | +200% Obrony (max 2 poz.) | [Mury](../encyklopedia/budynki/mury.md) |
| Koszary | Wojsko | Brąz | Wojskowosc | 25 pracy | 2 ¤/t | +2 praca; +20% miękkie (wizyta) | [Koszary](../encyklopedia/budynki/koszary.md) |
| Magazyn | Produkcja+Pieniadz | Brąz | Handel | 20 pracy | 1 ¤/t | +1 praca, +1 złoto | [Magazyn](../encyklopedia/budynki/magazyn.md) |
| Stela / Pomnik | Kultura | Kamień | Murarstwo | 15 pracy | 0 ¤/t | +1 kultura | [Stela / Pomnik](../encyklopedia/budynki/stela.md) |
| Palac | Kultura/Administracja | Kamień | — | 40 pracy | 2 ¤/t | +3 kultura, +1 szczęście (+5% mnożnik) | [Palac](../encyklopedia/budynki/palac.md) |
| Kuźnia żelaza | Produkcja+Wojsko | Żelazo | Hutnictwo żelaza | 60 pracy | 3 ¤/t | +8 praca, +2 ¤; +15% Pancerz (wizyta) | [Kuźnia żelaza](../encyklopedia/budynki/kuznia_zelaza.md) |
| Wielka Kuźnia | Produkcja | ⏸️ epoka 4 | Obróbka żelaza | 90 pracy | 4 ¤/t | **niedostępna** w 3 epokach v1 | [Wielka Kuźnia](../encyklopedia/budynki/wielka_kuznia.md) |
| Cytadela (dawny Fort) | Obrona | Żelazo | Inżynieria | 70 pracy + kamień | 3 ¤/t | +100% Obrony obok Murów | [Fort](../encyklopedia/budynki/fort.md) |
| Warsztat oblężniczy | Wojsko | Żelazo | Oblężnictwo | 65 pracy | 3 ¤/t | Katapulta; +10% miękkie | [Warsztat oblężniczy](../encyklopedia/budynki/warsztat_oblezniczy.md) |
| Akademia | Nauka | Żelazo | Filozofia | 70 pracy | 3 ¤/t | +6 nauka, +5 kultura (obok Biblioteki) | [Akademia](../encyklopedia/budynki/akademia.md) |
| Teatr | Kultura | Żelazo | Filozofia | 55 pracy | 2 ¤/t | +4 kultura, +3 szczęście | [Teatr](../encyklopedia/budynki/teatr.md) |
| Sąd | Administracja | Żelazo | Kodeks prawa | 55 pracy | 2 ¤/t | +2 złoto, +1 kultura, +2 szczęście | [Sąd](../encyklopedia/budynki/sad.md) |
| Pretorium | Administracja | Żelazo | Prawo | 75 pracy | 3 ¤/t | +2 praca, +3 ¤, +5 kultura; Prawo regionalne | [Pretorium](../encyklopedia/budynki/pretorium.md) |
| Łaźnia publiczna | Zdrowie | Żelazo | Medycyna | 50 pracy | 2 ¤/t | +1 żywność, +1 kultura, +3 szczęście | [Łaźnia publiczna](../encyklopedia/budynki/laznia_publiczna.md) |
| Akademia wojskowa | Wojsko | Żelazo | Sztuka wojenna | 80 pracy | 4 ¤/t | +3 praca, +2 ¤; +20% miękkie (wizyta) | [Akademia wojskowa](../encyklopedia/budynki/akademia_wojskowa.md) |

---

### Stolarnia

**Stolarnia** (Produkcja) odblokowuje się w epoce **Kamień** po technologii **Obróbka drewna**. Pierwsze wzniesienie kosztuje **20** pracy; każdy kolejny poziom +**10**. Utrzymanie: **1** ¤ na turę (rosnie o **0** per poziom).

Na poziomie 1 daje: **+5 praca**. Każdy kolejny poziom dodaje: **+3 praca**.
**Wymagania:** las w zasiegu.


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+5 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/stolarnia.md`](../encyklopedia/budynki/stolarnia.md)

### Warsztat kamieniarski

**Warsztat kamieniarski** (Produkcja) odblokowuje się w epoce **Kamień** po technologii **Murarstwo**. Pierwsze wzniesienie kosztuje **20** pracy; każdy kolejny poziom +**10**. Utrzymanie: **1** ¤ na turę (rosnie o **0** per poziom).

Na poziomie 1 daje: **+4 praca**. Każdy kolejny poziom dodaje: **+2 praca**.
**Wymagania:** kamien w zasiegu.


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+4 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/kamieniarski.md`](../encyklopedia/budynki/kamieniarski.md)

### Kuźnia brązu

**Kuźnia brązu** (Produkcja+Wojsko) odblokowuje się w epoce **Brąz** po technologii **Brązownictwo**. Koszt **30** pracy ( **maks. 1 poziom** — wyższy tier = awans na Kuźnię żelaza). Utrzymanie: **2** ¤/t.

Daje: **+6 Pracy/t**, **+1 Pieniądza/t** oraz **+15% Pancerza** (ścieżka A) jednostkom, które **odwiedziły** miasto po zbudowaniu kuźni.
**Wymagania:** dostęp do **Rudy (miedź)** w imperium.


### Przykład liczbowy

Koszt **30** pracy przy **7** pracy/t na budynki (70%) → **~4** tury budowy.
Bonus **+6 praca, +1 złoto** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **2** ¤/t × **10** tur = **20** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/kuznia.md`](../encyklopedia/budynki/kuznia.md)

### Targowisko (Rynek)

**Targowisko (Rynek)** (Pieniądz) odblokowuje się w epoce **Kamień** po technologii **Wymiana**. Koszt od **25** pracy; **maks. 3 poziomy** (Targowisko → Rynek → Giełda). Utrzymanie: **1** ¤/t.

Daje **Pieniądz na turę:** **+5 / +8 / +11 ¤/t** (poz. 1–3). **Bez mnożnika %** handlu ani Daniny.


### Przykład liczbowy

Koszt **25** pracy przy **7** pracy/t na budynki (70%) → **~3** tury budowy.
Bonus **+3 złoto** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/targowisko.md`](../encyklopedia/budynki/targowisko.md)

### Port handlowy

**Port handlowy** (Pieniadz) odblokowuje się w epoce **Brąz** po technologii **Żegluga**. Pierwsze wzniesienie kosztuje **30** pracy; każdy kolejny poziom +**10**. Utrzymanie: **2** ¤ na turę (rosnie o **1** per poziom).

Na poziomie 1 daje: **+1 praca, +5 złoto**. Każdy kolejny poziom dodaje: **+3 złoto**.
**Wymagania:** wybrzeze morskie lub rzeka.


### Przykład liczbowy

Koszt **30** pracy przy **7** pracy/t na budynki (70%) → **~4** tury budowy.
Bonus **+1 praca, +5 złoto** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **2** ¤/t × **10** tur = **20** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/port.md`](../encyklopedia/budynki/port.md)

### Spichlerz

**Spichlerz** (Zywnosc) odblokowuje się w epoce **Kamień** po technologii **Garncarstwo**. Pierwsze wzniesienie kosztuje **20** pracy; każdy kolejny poziom +**8**. Utrzymanie: **1** ¤ na turę (rosnie o **0** per poziom).

Na poziomie 1 daje: **+2 żywność**. Każdy kolejny poziom dodaje: **+1 żywność**.
**Wymagania:** brak.


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+2 żywność** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/spichlerz.md`](../encyklopedia/budynki/spichlerz.md)

### Swiatynia

**Swiatynia** (Kultura) odblokowuje się w epoce **Kamień** po technologii **Mistycyzm**. Pierwsze wzniesienie kosztuje **25** pracy; każdy kolejny poziom +**10**. Utrzymanie: **1** ¤ na turę (rosnie o **1** per poziom).

Na poziomie 1 daje: **+2 kultura, +2 szczęście**. Każdy kolejny poziom dodaje: **+1 kultura, +1 szczęście**.
**Wymagania:** brak.


### Przykład liczbowy

Koszt **25** pracy przy **7** pracy/t na budynki (70%) → **~3** tury budowy.
Bonus **+2 kultura, +2 szczęście** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/swiatynia.md`](../encyklopedia/budynki/swiatynia.md)

### Biblioteka

**Biblioteka** (Nauka) odblokowuje się w epoce **Brąz** po technologii **Pismo**. Pierwsze wzniesienie kosztuje **25** pracy; każdy kolejny poziom +**10**. Utrzymanie: **1** ¤ na turę (rosnie o **1** per poziom).

Na poziomie 1 daje: **+3 nauka, +1 kultura**. Każdy kolejny poziom dodaje: **+2 nauka, +1 kultura**.
**Wymagania:** brak.


### Przykład liczbowy

Koszt **25** pracy przy **7** pracy/t na budynki (70%) → **~3** tury budowy.
Bonus **+3 nauka, +1 kultura** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/biblioteka.md`](../encyklopedia/budynki/biblioteka.md)

### Studnia

**Studnia** (Zdrowie) odblokowuje się w epoce **Kamień** po technologii **Gospodarka wodna**. Pierwsze wzniesienie kosztuje **15** pracy; każdy kolejny poziom +**5**. Utrzymanie: **1** ¤ na turę (rosnie o **0** per poziom).

Na poziomie 1 daje: **+1 szczęście**. Każdy kolejny poziom dodaje: **+1 szczęście**.
**Wymagania:** brak.
**Uwaga:** Studnia miejska — dostęp do czystej wody (+Zdrowie proxy). Osobno: Łaźnia publiczna (termy rzymskie, epoka Żelaza).


### Przykład liczbowy

Koszt **15** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+1 szczęście** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/studnia.md`](../encyklopedia/budynki/studnia.md)

### Mury

**Mury** (Obrona) odblokowuje się w epoce **Brąz** po technologii **Budownictwo**. Koszt od **35** pracy + **8× drewno, 16× kamień**; **maks. 2 poziomy**. Utrzymanie: **2** ¤/t.

Daje **+200% Obrony** broniącym się jednostkom — bonus **procentowy**, nie płaski „+5 obrony". Zastępują bonus **Palisady** (+100%). **Cytadela** i **Baszta** to osobne budynki dokładane obok (każda +100% dodatkowo).


### Przykład liczbowy

Koszt **35** pracy przy **7** pracy/t na budynki (70%) → **~5** tury budowy.
Bonus **+200% Obrony** — jednostka z 50 pkt Obrony na murze ≈ **150** efektywnie.
Utrzymanie **2** ¤/t × **10** tur = **20** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/mury.md`](../encyklopedia/budynki/mury.md)

### Koszary

**Koszary** (Wojsko) odblokowuje się w epoce **Brąz** po technologii **Wojskowosc**. Koszt od **25** pracy; **maks. 2 poziomy**. Utrzymanie: **2** ¤/t.

Daje **+2/+3 Pracy/t** oraz **+20% parametrów miękkich** (ścieżka B, po wizycie w mieście). **Akademia wojskowa** stoi obok (nie zastępuje Koszar).


### Przykład liczbowy

Koszt **25** pracy przy **7** pracy/t na budynki (70%) → **~3** tury budowy.
Bonus **+2 praca** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **2** ¤/t × **10** tur = **20** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/koszary.md`](../encyklopedia/budynki/koszary.md)

### Magazyn

**Magazyn** (Produkcja+Pieniadz) odblokowuje się w epoce **Brąz** po technologii **Handel**. Pierwsze wzniesienie kosztuje **20** pracy; każdy kolejny poziom +**8**. Utrzymanie: **1** ¤ na turę (rosnie o **0** per poziom).

Na poziomie 1 daje: **+1 praca, +1 złoto**. Każdy kolejny poziom dodaje: **+1 praca, +1 złoto**.
**Wymagania:** brak.


### Przykład liczbowy

Koszt **20** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+1 praca, +1 złoto** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **1** ¤/t × **10** tur = **10** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/magazyn.md`](../encyklopedia/budynki/magazyn.md)

### Stela / Pomnik

**Stela / Pomnik** (Kultura) odblokowuje się w epoce **Kamień** po technologii **Murarstwo**. Pierwsze wzniesienie kosztuje **15** pracy; każdy kolejny poziom +**5**. Utrzymanie: **0** ¤ na turę (rosnie o **0** per poziom).

Na poziomie 1 daje: **+1 kultura**. Każdy kolejny poziom dodaje: **+1 kultura**.
**Wymagania:** brak.
**Uwaga:** Nie wymaga utrzymania


### Przykład liczbowy

Koszt **15** pracy przy **7** pracy/t na budynki (70%) → **~2** tury budowy.
Bonus **+1 kultura** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **0** ¤/t × **10** tur = **0** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/stela.md`](../encyklopedia/budynki/stela.md)

### Palac

**Palac** (Kultura/Administracja) odblokowuje się w epoce **Kamień**. Pierwsze wzniesienie kosztuje **40** pracy; każdy kolejny poziom +**12**. Utrzymanie: **2** ¤ na turę (rosnie o **1** per poziom).

Na poziomie 1 daje: **+3 kultura, +1 szczęście**. Każdy kolejny poziom dodaje: **+2 kultura, +1 szczęście**.
**Uwaga:** 1 na miasto (siedziba zarzadcy); glowne zrodlo kultury miasta. **Budynek startowy** — każde nowo założone miasto ma go już postawionego, poza kolejką produkcji; w praktyce nie płacisz zań surowca (kosztujesz tylko Pracę na kolejne poziomy) — dane formalnie mają wpisany koszt materiałowy (drewno/kamień), ale dotyczy tylko hipotetycznej odbudowy, nie normalnego zakładania miasta.


### Przykład liczbowy

Koszt **40** pracy przy **7** pracy/t na budynki (70%) → **~5** tury budowy.
Bonus **+3 kultura, +1 szczęście** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **2** ¤/t × **10** tur = **20** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/palac.md`](../encyklopedia/budynki/palac.md)

### Kuźnia żelaza

**Kuźnia żelaza** (Produkcja+Wojsko) — **upgrade Kuźni brązu** w epoce **Żelazo** (tech **Hutnictwo żelaza**). Koszt **60** pracy; **maks. 1 poziom**. Utrzymanie: **3** ¤/t.

Daje **+8 Pracy/t**, **+2 Pieniądza/t**, **+15% Pancerza** (ścieżka A, po wizycie).
**Wymagania:** Kuźnia brązu w mieście + **żelazo** w imperium.


### Przykład liczbowy

Koszt **60** pracy przy **7** pracy/t na budynki (70%) → **~8** tury budowy.
Bonus **+8 praca, +2 złoto** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **3** ¤/t × **10** tur = **30** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/kuznia_zelaza.md`](../encyklopedia/budynki/kuznia_zelaza.md)

### Wielka Kuźnia

**⏸️ PARKOWANE — niedostępna** w aktualnych 3 epokach (Kamień/Brąz/Żelazo). W danych `epokaWejscia: 4`. Docelowo upgrade Kuźni żelaza (+15% Pancerza, ścieżka A). **Nie planuj** w normalnej rozgrywce v1.


### Przykład liczbowy

Koszt **90** pracy przy **7** pracy/t na budynki (70%) → **~12** tury budowy.
Bonus **+12 praca, +3 złoto** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **4** ¤/t × **10** tur = **40** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/wielka_kuznia.md`](../encyklopedia/budynki/wielka_kuznia.md)

### Cytadela (dawny Fort)

> **Cytadela** (`id: fort`) to **osobny budynek obronny obok Murów** — nie upgrade tego samego slotu. Osobno na mapie: **Fort terenowy** ([`28-katalog-ulepszen.md`](28-katalog-ulepszen.md)).

**Cytadela** (Obrona) w epoce **Żelazo** po tech **Inżynieria**. Koszt **70** pracy + **10× drewno, 20× kamień**. **Maks. 1 poziom**. Utrzymanie: **3** ¤/t.

Daje **+100% Obrony dodatkowo** (z murami **+300%** łącznie; z Basztą do **+400%**). Wymaga **Murów w tym mieście**.


### Przykład liczbowy

Koszt **70** pracy przy **7** pracy/t → **~10** tury budowy.
Z Murami: **+300% Obrony** łącznie (nie płaski bonus).
Utrzymanie **3** ¤/t × **10** tur = **30** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/fort.md`](../encyklopedia/budynki/fort.md)

### Warsztat oblężniczy

**Warsztat oblężniczy** (Wojsko) w epoce **Żelazo** po tech **Oblężnictwo**. Koszt **65** pracy + kamień; **maks. 1 poziom**. Utrzymanie: **3** ¤/t.

**+4 Pracy/t**, **+2 Pieniądza/t**, **+10% miękkich** (ścieżka B). **Odblokowuje Katapultę** w rekrutacji miasta.
**Wymagania:** Koszary w tym mieście.


### Przykład liczbowy

Koszt **65** pracy przy **7** pracy/t na budynki (70%) → **~9** tury budowy.
Bonus **+4 praca, +2 złoto** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **3** ¤/t × **10** tur = **30** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/warsztat_oblezniczy.md`](../encyklopedia/budynki/warsztat_oblezniczy.md)

### Akademia

**Akademia** (Nauka) w epoce **Żelazo** po tech **Filozofia**. Koszt **70** pracy + cegła; **maks. 1 poziom**. Utrzymanie: **3** ¤/t.

**Niezależna obok Biblioteki.** Daje **+6 Nauki/t**, **+5 Kultury/t**, **+3 Zadowolenia** — lokalna produkcja miasta, **nie** globalny mnożnik nauki.
**Wymagania:** Biblioteka w tym mieście.


### Przykład liczbowy

Koszt **70** pracy przy **7** pracy/t na budynki (70%) → **~10** tury budowy.
Bonus **+6 nauka, +2 kultura** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **3** ¤/t × **10** tur = **30** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/akademia.md`](../encyklopedia/budynki/akademia.md)

### Teatr

**Teatr** (Kultura) odblokowuje się w epoce **Żelazo** po technologii **Filozofia**. Pierwsze wzniesienie kosztuje **55** pracy; każdy kolejny poziom +**12**. Utrzymanie: **2** ¤ na turę (rosnie o **1** per poziom).

Na poziomie 1 daje: **+4 kultura, +3 szczęście**. Każdy kolejny poziom dodaje: **+2 kultura, +1 szczęście**.
**Wymagania:** brak.
**Uwaga:** Glowne zrodlo kultury i zadowolenia w epoce Zelaza


### Przykład liczbowy

Koszt **55** pracy przy **7** pracy/t na budynki (70%) → **~7** tury budowy.
Bonus **+4 kultura, +3 szczęście** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **2** ¤/t × **10** tur = **20** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/teatr.md`](../encyklopedia/budynki/teatr.md)

### Sąd

**Sąd** (Administracja) odblokowuje się w epoce **Żelazo** po technologii **Kodeks prawa**. Pierwsze wzniesienie kosztuje **55** pracy; każdy kolejny poziom +**12**. Utrzymanie: **2** ¤ na turę (rosnie o **1** per poziom).

Na poziomie 1 daje: **+2 złoto, +1 kultura, +2 szczęście**. Każdy kolejny poziom dodaje: **+1 złoto, +1 kultura, +1 szczęście**.
**Wymagania:** brak.
**Uwaga:** Redukuje korupcje (anty-korupcja); zwiekszony porzadek publiczny; zadowolenie z praworz.


### Przykład liczbowy

Koszt **55** pracy przy **7** pracy/t na budynki (70%) → **~7** tury budowy.
Bonus **+2 złoto, +1 kultura, +2 szczęście** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **2** ¤/t × **10** tur = **20** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/sad.md`](../encyklopedia/budynki/sad.md)

### Pretorium

**Pretorium** (Administracja) — **tylko miasta regionalne** (upgrade Dworu Zarządcy). Epoka **Żelazo**, tech **Prawo**. Koszt **75** pracy; **maks. 1 poziom**. Utrzymanie: **3** ¤/t.

Daje **+2 Pracy/t**, **+3 Pieniądza/t**, **+5 Kultury/t** oraz **Prawo** miasta regionalnego. **Bez bonusu obrony** i bez mnożnika podatkowego.


### Przykład liczbowy

Koszt **75** pracy przy **7** pracy/t na budynki (70%) → **~10** tury budowy.
Bonus **+2 praca, +3 złoto, +5 kultura** — Prawo regionalne, nie obrona.
Utrzymanie **3** ¤/t × **10** tur = **30** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/pretorium.md`](../encyklopedia/budynki/pretorium.md)

### Łaźnia publiczna

**Łaźnia publiczna** (Zdrowie) odblokowuje się w epoce **Żelazo** po technologii **Medycyna**. Pierwsze wzniesienie kosztuje **50** pracy; każdy kolejny poziom +**12**. Utrzymanie: **2** ¤ na turę (rosnie o **1** per poziom).

Na poziomie 1 daje: **+1 żywność, +1 kultura, +3 szczęście**. Każdy kolejny poziom dodaje: **+1 żywność, +1 szczęście**.
**Wymagania:** wymaga Studnia.
**Uwaga:** Termy rzymskie — zadowolenie, kultura, zdrowie; wymaga Studni i tech Medycyna.


### Przykład liczbowy

Koszt **50** pracy przy **7** pracy/t na budynki (70%) → **~7** tury budowy.
Bonus **+1 żywność, +1 kultura, +3 szczęście** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **2** ¤/t × **10** tur = **20** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/laznia_publiczna.md`](../encyklopedia/budynki/laznia_publiczna.md)

### Akademia wojskowa

**Akademia wojskowa** (Wojsko) w epoce **Żelazo** po tech **Sztuka wojenna**. Koszt **80** pracy; **maks. 1 poziom**. Utrzymanie: **4** ¤/t.

**Obok Koszar** (niezależny budynek). **+3 Pracy/t**, **+2 Pieniądza/t**, **+20% miękkich** (ścieżka B, po wizycie). Z Koszarami = +40%; z Warsztatem do +50%.
**Wymagania:** Koszary w tym mieście.


### Przykład liczbowy

Koszt **80** pracy przy **7** pracy/t na budynki (70%) → **~11** tury budowy.
Bonus **+3 praca, +2 złoto** — przy **4** polach w okolicy suma skalowana liniowo z przypisaniem pól.
Utrzymanie **4** ¤/t × **10** tur = **40** ¤ — uwzględnij w bilansie skarbca.
→ Pełna karta: [`docs/encyklopedia/budynki/akademia_wojskowa.md`](../encyklopedia/budynki/akademia_wojskowa.md)

---

*Wygenerowano z `buildings.json` · rev. G2 2026-08-04 (obrona %, ścieżki A/B, Targowisko=¤) · pierwotnie rev. E 2026-07-03*