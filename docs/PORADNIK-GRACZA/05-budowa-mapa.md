# Część V — Budowa na mapie (ulepszenia terenu)

> **Poradnik gracza (Pełny)** · lewy panel **Budowa** · ulepszenia pól  
> Powiązane: [`28-katalog-ulepszen.md`](28-katalog-ulepszen.md) · Część II (terytorium, złoża) · Część VII §44 (okolica) · Część IX (tech) · spis §27–31

Ulepszenia terenu to farmy, tartaki, drogi, posterunki i forty — stawiasz je **na mapie**, nie w panelu miasta. Płacisz **pracą** z puli imperium; plony trafiają do miasta, które **pracuje** na danym heksie. Pełna lista 17 ulepszeń v1.0 — w katalogu §28; ten rozdział tłumaczy **tryb budowy**, bramki technologiczne i zasady stawiania.

---

## 27. Tryb budowy

### 27.1. Wejście w tryb budowy

1. Na mapie strategicznej otwórz **lewy panel**.
2. Klik ikonę **Budowa** (skrót **C**, jeśli w grze przypisany).
3. Wybierz **typ ulepszenia** z listy (farma, tartak, droga…).
4. Klik **wolny heks** w **swoim** terytorium — rozpoczyna się budowa.

| Gdzie NIE możesz budować | Dlaczego |
|--------------------------|----------|
| Obcy heks | Nie twoje terytorium |
| Heks ze **złożem** | Złoże rezerwuje pole (Część II §11) |
| **Mgła** bez odkrycia | Nie widzisz terenu |
| **Centrum miasta** | Miasto zajmuje heks |

Szare pozycje na liście = brak **technologii** lub niespełniony warunek terenu (§29–30).

### 27.2. Koszt w pracy

Ulepszenia płacisz **pracą** z puli imperium — **nie złotem** (przyspieszenie za złoto dotyczy głównie kolejki w mieście — Część VII §46).

| Źródło pracy | Gdzie widać |
|--------------|-------------|
| Pola (tartak, kamieniołom…) | Przyrost **Praca** na pasku (Część III §14.3) |
| Budynki produkcyjne | Bonus w miastach |
| Suwak pracy w mieście | Ile z plonów idzie na rozwój pól (Część VI §38.2) |

**Brak pracy** — budowa **stoi** do następnej tury; nie blokuje końca tury, ale opóźnia rozwój. Sprawdź profil **Produkcja** w okolicy miasta, które ma budować infrastrukturę.

**Wskazówka:** Pierwsze tury: jedna **farma** obok stolicy często ważniejsza niż droga — żywność karmi wzrost i wojsko (Część VIII §50).

### 27.3. Załóż miasto (bez osadnika)

W panelu **Budowa** wybierz akcję **Załóż miasto** — kursor zmienia się w tryb zakładania. Kliknij **wolny, odkryty heks** w twoim terytorium (lub po Strażnicy w nowym regionie).

| Składnik kosztu | Wartość |
|-----------------|---------|
| **Praca** | **20** z puli imperium |
| **Ludność** | **−1** z miasta-źródła (największe z pop ≥ 2) |
| **Odległość** | Min. **4 heksy** od każdego innego miasta |

Pierwsze miasto gracza (stolica startowa) jest **darmowe** — pojawia się automatycznie przy starcie gry. Kolejne miasta płatne wg tabeli. Gra pokazuje etykietę kosztu przy przycisku (np. `20 P · 1 👤`).

**Wskazówka:** Planuj drugie miasto przy dobrym złożu lub rzece — min. 4 heksy od stolicy to ok. 2–3 tury marszu zwiadu w linii prostej.


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 60% skarbiec · 20% nauka · 20% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 28. Katalog ulepszeń v1.0

Pełna tabela **17 ulepszeń** z kosztami, bonusem, wymaganym terenem i technologią:

→ **[`28-katalog-ulepszen.md`](28-katalog-ulepszen.md)** · dane: `gra/data/terrain-improvements.json` · karty Wiki: `docs/encyklopedia/ulepszenia/`

Skrót kategorii (szczegóły w katalogu):

| Kategoria | Przykłady |
|-----------|-----------|
| **Żywność** | Farma, Irygacja, Obóz łowiecki, Tarasy uprawne |
| **Produkcja** | Tartak, Kamieniołom, Kopalnia, Glinianka |
| **Hodowla** | Bydło, Owce, Lama (Inkowie) |
| **Infrastruktura** | Droga, Posterunek, Fort, Łodzie rybackie |
| **Specjalne** | Warzelnia soli, Wycinka (wycinka lasu — często tania) |

**Posterunek** rozszerza terytorium o ok. **5 heksów**; **Fort** — o ok. **10** (Część II §9.1). **Droga** obniża koszt ruchu wojska (§31.2).


### Przykład liczbowy

Farma **20** pracy, **+2** 🍞 (bonus ulepszenia normal) + pole **3** 🍞 = **5** 🍞/t z heksu.
Droga **15** pracy → **+1** Daniny; przy Daninie **10** brutto daje **+1** dodatkowy.

### Strategia gracza

Porównuj **koszt pracy ÷ bonus** — tańsze ulepszenie z lepszym 🍞/praca wygrywa wczesną grę.

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 29. Technologie a ulepszenia

### 29.1. Drzewko liniowe i bramki

W jednej epoce technologie układają się często w **linię** — kolejne odblokowują ulepszenia. Niektóre wymagają **dwóch** tech naraz (**bramka AND**): oba muszą być zbadane, zanim pozycja na liście budowy się odblokuje.

| Stan na liście Budowa | Znaczenie |
|-----------------------|-----------|
| Kolor / aktywna | Możesz stawiać (teren + terytorium OK) |
| **Szara** | Brak tech, zła epoka lub niespełniony warunek |
| Brak na liście | Jeszcze nie w epoce gry lub wyłączone w v1.0 |

### 29.2. Co odblokowuje jedna technologia

Jedna tech może otworzyć **naraz**:
- ulepszenie na mapie (np. **Murarstwo** → kamieniołom),
- budynek w mieście (mury, warsztat),
- jednostkę wojskową.

Po zbadaniu pozycje pojawiają się **od razu** w trybie budowy i w zakładce **Produkcja** miasta. Przykładowe łańcuchy — Część IX §54 (Murarstwo → forty, mury miasta).

**Wskazówka:** Planuj badania pod **konkretne pole**: chcesz kopalnię na górze — najpierw tech Brązu na miedź (decyzja E3), potem Murarstwo / Kopalnia.


### Przykład liczbowy

Farma **20** pracy, **+2** 🍞 (bonus ulepszenia normal) + pole **3** 🍞 = **5** 🍞/t z heksu.
Droga **15** pracy → **+1** Daniny; przy Daninie **10** brutto daje **+1** dodatkowy.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 30. Zasady stawiania ulepszeń

### 30.1. Wymagania terenu — przykłady

| Ulepszenie | Warunek (skrót) |
|------------|-----------------|
| **Farma** | Łąka lub równina; **bez** złoża na heksie |
| **Irygacja** | Łąka/równina/pustynia + **sąsiad z rzeką** |
| **Tartak** | Las (po **wyrębie** zostaje puste pole pod farmę) |
| **Kopalnia** | Wzgórze/góra; przy złożu rudy po odblokowaniu epoki |
| **Glinianka** | Heks ze **złożem gliny** + tech Garncarstwo |
| **Łodzie rybackie** | Wybrzeże/morze w **twoim** terytorium |

Pełna tabela warunków — apendyks B.7 spisu treści i kolumna **Warunek** w [`28-katalog-ulepszen.md`](28-katalog-ulepszen.md).

### 30.2. Wielowarstwowość heksów

**Kanon** dokumentacji: docelowo kilka ulepszeń na jednym heksie (np. farma + irygacja). W **v1.0** sprawdź w grze, co faktycznie działa — pełna wielowarstwowość to 🔮 v2.0 (apendyks E.2). Jeśli gra pozwala tylko **jedno** ulepszenie na heks, priorytet: najpierw wycinka → farma → irygacja na tym samym polu w kolejnych turach.


### Przykład liczbowy

Farma **20** pracy, **+2** 🍞 (bonus ulepszenia normal) + pole **3** 🍞 = **5** 🍞/t z heksu.
Droga **15** pracy → **+1** Daniny; przy Daninie **10** brutto daje **+1** dodatkowy.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 31. Utrzymanie i efekty ulepszeń

### 31.1. Plony → miasto właściciela pola

Żywność, praca i złoto z heksu trafiają do miasta, które **przypisało** to pole w zakładce **Okolica** (Część VII §44):

- **Auto-zarządca** i profile (Żywność, Produkcja, Podatki) rozdzielają heksy automatycznie.
- **Ręczna korekta** (ikona ręki) — jedno miasto na złoże miedzi, drugie na żywność.

**Utrata heksu w wojnie** = utrata plonów z tego pola — po pokoju przejrzyj **Okolicę** w miastach granicznych.

### 31.2. Drogi, posterunki, forty

| Ulepszenie | Efekt poza plonami |
|------------|-------------------|
| **Droga** | Tańszy ruch wojska i handel na tym heksie |
| **Posterunek** | +50% obrona obozu; **+5 heksów** terytorium |
| **Fort** | +100% obrona obozu; **+10 heksów** terytorium |

Infrastruktura może mieć **utrzymanie** w danych balansu — sprawdź tooltip ulepszenia w grze. Posterunek na granicy = wczesny alarm i pole pod tartak poza zasięgiem stolicy.


### Przykład liczbowy

Farma **20** pracy, **+2** 🍞 (bonus ulepszenia normal) + pole **3** 🍞 = **5** 🍞/t z heksu.
Droga **15** pracy → **+1** Daniny; przy Daninie **10** brutto daje **+1** dodatkowy.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Checklist budowy wczesnej gry

1. **Okolica** stolicy → profil **Żywność** lub ręcznie 2–3 farmy na łąkach.  
2. **Badanie** Rolnictwo / Obróbka drewna — odblokuj farę i tartak.  
3. Tartak na lesie w promieniu miasta; wycinka tylko gdy potrzebujesz pola pod farmę.  
4. Przed ekspansją: **Posterunek** na kierunku wroga lub złoża.  
5. Po wejściu w **Brąz**: glinianka / kopalnia na górze — patrz E3 i katalog §28.


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 60% skarbiec · 20% nauka · 20% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Powiązane pliki

| Temat | Plik |
|-------|------|
| Katalog 17 ulepszeń | [`28-katalog-ulepszen.md`](28-katalog-ulepszen.md) |
| Terytorium, złoża | [`02-mapa-swiata.md`](02-mapa-swiata.md) §9–11 |
| Praca na pasku | [`03-pasek-zasobow.md`](03-pasek-zasobow.md) §14.3 |
| Przypisanie pól | [`07-miasto-budowa-rekrutacja.md`](07-miasto-budowa-rekrutacja.md) §44 |
| Surowce v1 | [`08-ekonomia-imperium.md`](08-ekonomia-imperium.md) §53 |


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 60% skarbiec · 20% nauka · 20% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik‑L · Część V · rev. G · 2026-08-04 (§27.3: Załóż miasto z panelu Budowa) · rev. E 2026-07-03 · dane: `terrain-improvements.json` · decyzje: E3 · spis §27–31 (§28 = katalog)*
