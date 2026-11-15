# Handel surowcami (dyplomacja)

## Metadane

| id | `handel-surowcami-dyplomacja` |
| tytuł | Handel surowcami (dyplomacja) |
| kategoria | Dyplomacja |
| poradnik_ref | Część XII (Dyplomacja) |
| json_ref | `econ-params.json` (`handel_surowce`), `game/diplomacy-value-catalog.ts` |

---

## Wiki‑S

W koszyku negocjacji dyplomacji możesz wymieniać surowce **ilościowe** (drewno, kamień, glina, cegła, ceramika, ruda i pozostałe surowce przetworzone). Liczba Punktów Negocjacji (PN) za blok surowca **nie zmienia się** między epokami — rośnie **ilość surowca**, którą trzeba dać za ten sam PN: w **Kamieniu** 10 sztuk = 1 PN, w **Brązie** 50 sztuk = 1 PN, w **Żelazie** 100 sztuk = 1 PN. Złoto i węgiel są wyceniane za sztukę (w Brązie złoto 10 PN, w Żelazie 5 PN; węgiel odpowiednio 4 i 2 PN).

---

## Wiki‑M

### Jak działa koszyk

Panel negocjacji (`diplomacyTradeBasket.ts`) pozwala dodać pozycję „surowiec (ilość)" — wybierasz surowiec i liczbę **sztuk**; ilość zaokrągla się w dół do pełnego bloku epoki (Kamień 10, Brąz 50, Żelazo 100 szt.; wartości w `econ-params.json`, klucze `krok_blok_*`).

**Epoka umowy** = wyższa z epok dwóch stron (gracza i partnera AI). Oferta AI w Brązie ma więc ilości w wielokrotnościach 50 także wtedy, gdy gracz jest jeszcze w Kamieniu, a gracz w Kamieniu dostaje blok 50, jeśli partner jest w Brązie. Wczytanie zapisu i nowa gra ustawiają epokę handlu od razu. Ta sama epoka umowy obowiązuje wszędzie: w oknie „Umowa wymiany surowców" (krok ilości i przyciski +/−), w „Szybkiej umowie", w ofertach AI, w podglądzie bilansu PW, w bramce uczciwości partnera i przy zatwierdzeniu — podgląd i ocena AI nigdy się nie rozjeżdżają. Stare propozycje i oferty z zapisu sprzed bloków epoki są przy wczytaniu obcinane w dół do pełnego bloku (minimum 1 blok; oferta nie znika). AI oferuje najmniej jeden pełny blok epoki umowy; limit 3× potrzeby obowiązuje powyżej jednego bloku.

### Bloki i ceny za blok

| Surowiec | Cena za blok (PN) | Kamień (blok 10) | Brąz (blok 50) | Żelazo (blok 100) |
|----------|-------------------|------------------|----------------|-------------------|
| Drewno | 1 | 10 szt. | 50 szt. | 100 szt. |
| Glina, sól | 2 | 10 szt. | 50 szt. | 100 szt. |
| Kamień | 3 | 10 szt. | 50 szt. | 100 szt. |
| Ruda miedzi, cegła, koń, ceramika | 5 | 10 szt. | 50 szt. | 100 szt. |
| Ruda żelaza, ruda cyny | 10 | 10 szt. | 50 szt. | 100 szt. |
| Brąz | 15 | 10 szt. | 50 szt. | 100 szt. |
| Żelazo | 20 | 10 szt. | 50 szt. | 100 szt. |
| Stal | 25 | 10 szt. | 50 szt. | 100 szt. |

Złoto i węgiel (krok 1 szt.) mają cenę za sztukę: złoto 50 / 10 / 5 PN, węgiel 20 / 4 / 2 PN w Kamieniu / Brązie / Żelazie.

### Cennik jednostkowy (normal, placeholder do strojenia)

| Surowiec | Cena (¤/szt.) |
|----------|---------------|
| Drewno | 2 |
| Kamień | 3 |
| Glina | 2 |
| Cegła | 5 |
| Ceramika | 6 |
| Ruda | 4 |

Wartość PN pozycji = pakiety × **10** × cena jednostkowa. Np. **2 pakiety Cegły** = 20 szt. × 5 ¤/szt. = **100 PN** w koszyku.

### Warunek dostępności

Surowiec można wystawić do handlu dopiero gdy zapas (stock) w skarbcu ≥ **minimalny próg** (domyślnie **2 szt.** na wszystkich poziomach trudności) — 1 sztuka musi zawsze zostać jako „dostęp" (nie sprzedajesz się do zera).

### Handel z miastami-państwami (gracz↔MP i AI↔MP)

Miasta-państwa (Sparta, Kapua, Teby…) **nie mają** osobnego, uproszczonego handlu — korzystają z **dokładnie tego samego** silnika co pełnoprawne cywilizacje, w obu formach:

| Forma | Mechanizm | Różnica przy MP |
|-------|-----------|-------------------|
| **Jednorazowo** | Koszyk negocjacji (ten artykuł, §Wiki-M) w audiencji | Ten sam koszyk, ta sama cena PN — ale próg relacji do otwarcia handlu jest **o 20 pkt trudniejszy** niż z pełną cywilizacją (Część XII §76.5) |
| **Cyklicznie** | Szlak handlowy (Część VIII §53.3) — dochód/turę + dostęp do surowca (brąz/żelazo/koń) | Wymaga tej samej **Umowy Handlowej** i tych samych warunków odległości/portu co z każdą inną nacją — miasto-państwo nie jest wyłączone z żadnego z tych mechanizmów |

**Obie strony inicjują:** dotyczy to zarówno **gracz↔MP** (Ty proponujesz lub akceptujesz ofertę miasta-państwa w audiencji), jak i **AI↔MP** (dowolna cywilizacja AI zawiera Umowę Handlową i wymienia surowce z sąsiednim miastem-państwem tak samo automatycznie, jak robi to AI↔AI — silnik nie ma osobnej gałęzi dla miast-państw jako partnera handlowego, patrz Część VIII §53.3 „AI proponuje… i zawiera ją też AI↔AI"). Praktyczny skutek: nie licz, że sąsiednie miasto-państwo zostanie bez szlaków handlowych tylko dlatego, że nie handlujesz z nim Ty — silniejsza AI obok może je już oplatać siecią tras, zanim zdążysz zaproponować traktat.

**Powiązane:** [[Szlaki handlowe]] · [[Wiarygodność]] · Dyplomacja · Bogactwo · Część XII §75.2, §76.5 (miasta-państwa w liście dyplomatów i progi relacji)

---

## Przykład liczbowy

Chcesz kupić **30 sztuk Rudy** od AI: 3 pakiety × 10 szt. × 4 ¤/szt. = **120 PN** wartości w koszyku — dokładasz ekwiwalent (złoto, inny surowiec, ustępstwo) po drugiej stronie, aż koszyk się zrówna wg progu relacji (`PROG_HANDEL_REL`).

---

## Poradnik‑L

→ `docs/PORADNIK-GRACZA/12-dyplomacja.md`

---

## Historia / decyzje

Decyzja **C-DYP-SUROWCE-Q1=B** (2026-07-23): ceny jednostkowe surowców w koszyku PN. Dopisano 2026-07-24: handel z miastami-państwami. **2026-08-04 rev. G:** cross-link Wiarygodność (limit +5 Zauf./turę flat, niezależny od W).
