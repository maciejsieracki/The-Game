# Część XIII — Cywilizacje

> **Poradnik gracza (Pełny)** · wybór nacji i bonusy  
> Powiązane: Część I §2.3 (kreator) · Część XIV (AI) · encyklopedia `docs/encyklopedia/cywilizacje/`  
> Źródła: `gra/data/civs.json` · `gra/data/civ-matrix.json`

W wersji 1.0 grasz **jednym państwem** wybranego **typu cywilizacji**. Typ decyduje o bonusach, jednostce unikalnej, religii domyślnej i tym, jak zachowuje się sztuczna inteligencja tego same typu na mapie. Ten rozdział tłumaczy różnicę między typem a miastem-państwem, epoki startowe i wszystkie dziewięć aktywnych nacji.

---

## 82. Roster v1.0

### 82.1. Dziewięć typów aktywnych

W kreatorze nowej gry wybierasz spośród:

| Typ | Charakter | Jednostka unikalna |
|-----|-----------|-------------------|
| **Grecy** | Defensywna piechota | Falanga (Hoplita) |
| **Rzymianie** | Ofensywna piechota + inżynieria | Legion (Legionista) |
| **Chińczycy** | Dystans + kawaleria | Kusznik [NIEAKTUALNE — brak w units.json, 2026-07-23; realnie budowany Łucznik z bonusem] |
| **Inkowie** | Nauka/kultura + piechota górska | Chaska / Królewska Gwardia |
| **Zulusi** | Szybka agresywna piechota | Impi |
| **Egipt** | Rydwany + łucznicy | Medżaj (Gwardia Faraona) |
| **Sumerowie** | Ciężka piechota + rydwany | Gwardia Królewska Sumeru |
| **Celtowie** | Szarża mieczników | Miecznik galijski |
| **Germanie** | Las, zasadzki, furia | Wojownik germański (framea) |

Każdy typ ma własny wpis Wiki: `docs/encyklopedia/cywilizacje/{id}.md` (np. `grecy.md`).

**Wskazówka:** Medalion w kreatorze pokazuje skrót bonusów — pełna lista jest poniżej w §84.

### 82.2. Rezerwa Tier 2 i plan rozszerzeń

W plikach danych są już m.in. **Babilonia, Asyria, Fenicjanie, Harappa, Hetyci, Słowianie**, ale **nie są** pełnym rosterem v1.0 — pojawią się w patchach. Gracz v1.0 skupia się na dziewięciu typach powyżej.

### 82.3. Cywilizacja vs miasto-państwo

To ważne rozróżnienie:

| Pojęcie | Co to jest | Przykład |
|---------|------------|----------|
| **Typ cywilizacji** | Zestaw bonusów, jednostka unikalna, religia | „Grecy" |
| **Miasto-państwo** | Konkretny rywal na mapie | Sparta, Kapua, Ateny |
| **Klaster** | ~10 miast **tego samego typu** w regionie (ty + ~9 AI) | Klaster Greków |

**Ty** grasz jednym państwem wybranego typu. **Rywale w klastrze** mają ten sam typ i te same bonusy, ale **inne nazwy** miast. Wczesnym celem jest dominacja w **własnym klastrze**, zanim spotkasz inne typy cywilizacji (Część I §4).

### 82.4. Wygląd na mapie

Modele miast i jednostek zależą od typu i epoki (poziomy murów 1–10). Unikalne jednostki mają osobne modele tam, gdzie są zdefiniowane w danych — szczegóły w katalogu `57-katalog-jednostek.md`.


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 83. Epoki startowe per cywilizacja

### 83.1. Trzy możliwe starty

W kreatorze wybierasz epokę **Kamień**, **Brąz** lub **Żelazo** (jeśli typ na to pozwala). Start w Brązie oznacza, że technologie epoki Kamienia są już zbadane (kaskada — Część I §6.1). Jednostki i budynki nadal wymagają odpowiednich badań — nie dostajesz „pakietu armii" za darmo.

### 83.2. Wyjątki epok

| Typ | Dozwolone epoki startu | Uwaga |
|-----|------------------------|-------|
| Grecy, Rzym, Chiny, Zulusi, Egipt, Sumer | Kamień, Brąz, Żelazo | Standard |
| **Inkowie** | Kamień, **Żelazo** (bez Brązu w rosterze) | Osobna ścieżka epok |
| **Celtowie, Germanie** | Brąz, Żelazo | **Bez** startu w Kamieniu |
| (plan) Harappa | tylko Kamień | Tier 1 rezerwa |

**Inkowie** — unikalna kombinacja: mogą pominąć epokę Brązu na ścieżce startowej. Sprawdź opis w kreatorze przed wyborem.

### 83.3. Epoka a jednostki

- **Kamień** — prosta armia, wolniejsza nauka, więcej czasu na ekspansję pól.
- **Brąz** — miedź, lepsze budynki, wcześniejszy dostęp do unikalnych jednostek brązowych.
- **Żelazo** — agresywny start, wyższe utrzymanie, szybsza rywalizacja w klastrze.

Tempo gry (w kreatorze) mnoży koszty badań niezależnie od epoki.

### 83.4. Rekomendacja

| Doświadczenie | Epoka | Trudność |
|---------------|-------|----------|
| Pierwsza gra | Kamień | Normalny |
| Znasz Civ-like | Brąz | Normalny / Trudny |
| Wyzwanie | Żelazo | Trudny, mała mapa |


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 84. Bonusy cywilizacji (9×3)

### 84.1. Trzy kategorie

Każdy typ ma **trzy linie bonusów** w macierzy balansu:

1. **Walka** — atak, obrona, morale, bonus w terenie, oblężenie.
2. **Miasto / produkcja** — koszt budynków, szybkość budowy, wzrost ludności.
3. **Ekonomia / mapa** — handel, nauka, pobór, złoto z portów.

Bonusy **mnożą** lub **dodają** do wartości bazowych — nie zastępują Spichlerza, suwaków ani technologii (decyzja B5).

### 84.2. Przegląd dziewięciu typów

#### Grecy — tarcza i handel morski

- **+20% obrony piechoty** (formacja frontalna — Falanga).
- **+15% złota** z handlu morskiego i portów.
- **−15% odnowy poboru** — wolniejsze uzupełnianie rekrutów.
- **Profil:** defensywny, dobry na wybrzeżu; słabsza mobilizacja.

#### Rzymianie — legion i inżynieria

- **+15% ataku i pancerza** piechoty szturmowej.
- **−20% kosztu produkcji budynków** (inżynieria rzymska).
- **+35% odnowy poboru** — szybkie uzupełnianie legionów.
- **Profil:** ekspansja infrastruktury + ofensywa piechotą; AI agresywne (8/9).

#### Chińczycy — kusza i konnica

- **+20% ataku dystansowego** łuczników/kuszników.
- **+15% uderzenia kawalerii** przy szarży.
- **Lekka kara obrony piechoty** (−5%) — słabsza linia wręcz.
- **Profil:** wojna z dystansu; AI nastawione na naukę i ekonomię.

#### Inkowie — kalendarz i góry

- **+15% nauki** (kalendarz słoneczny).
- **+20% ataku piechoty w lesie** (znajomość terenu).
- **Brak przewagi kawalerii/rydwanów** — siła w piechocie i dystansie.
- **Profil:** nauka + obrona w trudnym terenie; start Kamień/Żelazo.

#### Zulusi — impi i tempo

- **+20% ruchu w bitwie** piechoty, wysokie morale.
- **Tansza rekrutacja** piechoty (−10% kosztu).
- **Słabszy dystans** (−10% łuczników).
- **Profil:** wczesny rush; AI bardzo agresywne (9/9).

#### Egipt — rydwan i łucznik

- **+20% ataku dystansowego** (łucznicy, rydwany z zapasem strzał).
- **+15% ruchu w bitwie** rydwanów.
- **Medżaj** — elitarna piechota ochrony centrum.
- **Profil:** mobilność i ostrzał; słabsza ciężka piechota frontalna.

#### Sumerowie — ciężka piechota i rydwany

- **+20% obrony i HP** ciężkiej piechoty.
- **+15% HP rydwanów** bojowych.
- **Gwardia Królewska** — szczyt piechoty obronnej.
- **Profil:** linia frontu + ciężkie rydwany; wolniejsza lekka kawaleria.

#### Celtowie — furia szarży

- **+40% uderzenia piechoty** (długi miecz, pierwsze uderzenie).
- **Brąz/Żelazo** — bez startu w Kamieniu.
- **Miecznik galijski** — silny w szarży, słabszy w długiej obronie.
- **Profil:** uderzenie z zaskoczenia; AI wojskowe (6/9 agresji).

#### Germanie — las i zasadzka

- **+25% ataku w lesie**, **+40% w pierwszej rundzie szarży**.
- **Framea** — rzut + walka wręcz, specjalista od zasadzki.
- **Słabsza organizacja** — wolniejsza nauka wczesna (balans).
- **Profil:** partyzancka piechota; słabe oblężenie.

### 84.3. Bonusy a strategia

| Styl gry | Typy do rozważenia |
|----------|-------------------|
| Handel i złoto | Grecy, Rzym (umiarkowany), Sumer |
| Nauka / rakieta | Inkowie, Chińczycy, Sumer |
| Wczesna wojna | Zulusi, Celtowie, Germanie |
| Oblężenie i linia | Sumer, Grecy, Rzym |
| Mobilność | Egipt, Chińczycy |

### 84.4. Czego bonusy nie robią

- Nie dają darmowych budynków ani tech.
- Nie wyłączają counterów (np. kawaleria vs łucznik — Część X §61).
- Trudność gry i cuda mają **osobne** mnożniki (Część XIV §89).


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 85. Jednostki unikalne

### 85.1. Po jednej linii elitarnej na typ

Każdy typ ma **jedną** (czasem dwie powiązane) jednostkę specjalną — np. Falanga, Impi, Kusznik [NIEAKTUALNE — Kusznik brak w units.json, 2026-07-23]. Pełne statystyki: katalog `57-katalog-jednostek.md` i karty Wiki w `docs/encyklopedia/jednostki/`.

### 85.2. Wymagania tech

Odblokowanie jak u zwykłej jednostki — szara pozycja w koszarach = brak technologii. Unikalne często wymagają epoki Brąz lub Żelazo.

### 85.3. Koszty

Rekrutacja: **złoto + ludność** jak standard (Część VII §47). Unikalne bywają droższe w utrzymaniu — sprawdź kartę **[H]** na mapie.

### 85.4. Taktyka

- Buduj unikalne, gdy wykorzystasz **bonus typu** (np. Falanga vs szarża kawalerii).
- Nie spamuj — utrzymanie armii obniża netto złota.
- Łącz z zwykłymi jednostkami: łucznicy za linią, zwiadowca do mgły.


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 86. Religie cywilizacji

### 86.1. Religia państwa per typ

| Typ | Religia domyślna |
|-----|------------------|
| Grecy | Politeizm olimpijski |
| Rzymianie | Religia rzymska / kult państwa |
| Chińczycy | Konfucjanizm / Taoizm |
| Inkowie | Kult Słońca Inti |
| Zulusi | Kult przodków / animizm |
| Egipt | Religia egipska — faraon-bóg |
| Sumerowie | Religia sumeryjska (Enlil/Anu) |
| Celtowie | Druidyzm |
| Germanie | Religia germańska (Wotan) |

### 86.2. Wpływ na szczęście

Gdy **obca religia dominuje** w mieście (>50% wyznawców obcych) — kara szczęścia. **Świątynie** własnej religii przyspieszają dominację (Część VI §40, XV §92).

### 86.3. Religia a dyplomacja

Ta sama religia u sąsiada może ułatwiać handel (bonus zaufania — status balansu). Religia ≠ kultura — to osobne overlay na mapie.

### 86.4. Co robi gracz

- Buduj świątynie w miastach granicznych.
- Po podboju licz się z okresem niestabilności — obca religia obniża porządek.
- Barbarzyńcy **nie** mają religii państwowej.


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Szybki wybór — tabela decyzyjna

| Chcesz… | Rozważ… |
|---------|---------|
| Nauczyć się gry spokojnie | Grecy lub Sumer (obrona) |
| Szybko bić sąsiadów | Zulusi, Celtowie |
| Wygrać nauką | Inkowie, Chińczycy |
| Budować szybciej | Rzymianie |
| Grać z lasu | Germanie, Inkowie |


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 70% złoto · 20% nauka · 10% zamożność.

### Strategia gracza

Porównuj **koszt pracy ÷ bonus** — tańsze ulepszenie z lepszym 🍞/praca wygrywa wczesną grę.

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik gracza rev. E · 2026-07-03 · źródło: `gra/data/civs.json`, `gra/data/civ-matrix.json`*
