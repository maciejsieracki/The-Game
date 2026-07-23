# Część XV — Kultura, religia, cuda

> **Poradnik gracza (Pełny)** · presja kulturowa · religia · overlay · cuda Antyku  
> Powiązane: Część VI §35–40 (szczęście, religia w mieście) · [`91-katalog-cudow-antyk.md`](91-katalog-cudow-antyk.md) · spis §91–96

Kultura i religia to **dwa osobne systemy** presji na mapie — wpływają na szczęście miast i dyplomację. **Cuda świata** to wielkie projekty na heksach terytorium z bonusem × każde miasto. Ten rozdział łączy overlay mapy, religię państwa i reguły cudów E/R z absolutem na końcu Średniowiecza.

---

## 91. Kultura — system imperium

### 91.1. Zasięg kultury per miasto

Każde miasto **emituje kulturę** na sąsiednie heksy w pierścieniach. Więcej kultury z budynków (teatr, świątynia), cudów i suwaków — szybsze „zalanie" obcymi heksami terytorium.

### 91.2. Presja i konwersja

Heks w zasięgu **dwóch** kultur — wygrywa silniejsza presja. Konwersja **stopniowa**. Obca kultura dominująca w mieście obniża szczęście (Część VI §35.3).

### 91.3. Bonus i kara szczęścia wg % własnej kultury

| Udział własnej kultury | Szczęście |
|------------------------|-----------|
| **100%** | Maksymalny bonus |
| **≥75%** | Dobry bonus |
| **50%** | Neutralnie / lekka kara |
| **<25%** obca | Silna kara |

### 91.4. Kultura imperium vs miasta

**Pasek zasobów** — suma kultury imperium (Część III §14.7). **Panel miasta** — kultura **tego** centrum (§40). Brak osobnego zasobu „Idei".

**Wskazówka:** Teatr i cuda kulturowe w miastach **granicznych** — przed wojna z sąsiadem.


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 92. Religia — system imperium

### 92.1. Religia państwa i dominacja

Każdy typ cywilizacji ma **domyślną religię** (Część XIII §86). W mieście liczysz **% wyznawców** własnej vs obcej — osobno od kultury.

### 92.2. Świątynie

Budynek w produkcji miasta ([`45-katalog-budynkow.md`](45-katalog-budynkow.md)). Zwiększa presję religii; bonus szczęścia gdy **nasza** religia dominuje. Utrzymanie w ¤/turę.

### 92.3. Religia a szczęście i dyplomacja

Progi % podobne do kultury (§91.3). Ta sama religia u sąsiada — bonus zaufania (status balansu). Obca religia w stolicy — ryzyko buntu (Część VI §36).

### 92.4. Szerzenie

Świątynie w miastach granicznych; podbój **nie** zmienia religii natychmiast. Overlay §93.


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 93. Overlay kultura / religia

### 93.1. Włączenie warstw

Przy minimapie: **Kultura** (🎭) i **Religia** — osobne przełączniki (Część II §10). v1.0 — lista i progi, nie pełny kolor 3D na każdym heksie.

### 93.2. Co pokazuje overlay

Lista miast z % własnej kultury/religii; heksy w zasięgu presji; gdzie grozi konwersja. Klik miasta — skok do panelu.

### 93.3. Decyzje gracza

- Gdzie budować **teatr / świątynię**.
- Które miasto graniczne wyłączyć z auto-zarządcy (Część VI).
- Cuda kulturowe — §94–96.


### Przykład liczbowy

Podbite miasto: **30%** twojej kultury, obca religia dominuje **−2** szczęścia, obca kultura **−1**.
Świątynia **+2** kultury/t + bonus własnej religii **+2** szczęścia po przekroczeniu **50%** wyznawców.
Po **8 turach** konwersji **+1%/t** (baza) → **38%** kultury — kara spada, ale wciąż **−1**.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 94. Cuda świata — podstawy

### 94.0. Ekran Cudów świata — galeria pełnoekranowa (2026-07-23)

Nowy ekran **Cuda świata** — wejście przez **medalion na toolbarze mapy** (kolumna okrągłych ikon po lewej krawędzi ekranu, pod paskiem zasobów — ten sam pasek co Nauka/Handel/inne tryby, świątynia/kolumny jako emblemat). Otwiera **galerię wszystkich 19 cudów Antyku** wg makiety CUDA-v1, każdy jako karta z bieżącym stanem gry:

| Stan karty | Znaczenie |
|------------|-----------|
| **Dostępny** | Możesz zacząć budowę (masz tech + teren + cywilizację uprawnioną, jeśli typ E) |
| **Zablokowany** | Brakuje tech, terenu lub epoki wejścia — karta mówi czego |
| **W budowie** | Ty lub inne państwo już wznosi ten cud |
| **Nasz ✓** | Masz go zbudowanego — bonusy aktywne |
| **Ekskluzywny / cudzy** | Cud typu **E** zarezerwowany dla innej cywilizacji — nie zobaczysz go jako budowalnego |
| **Przepadł** | Przegrałeś wyścig (typ R) — ktoś inny ukończył pierwszy |

Karta ma CTA (przycisk akcji zależny od stanu) i **powiadomienia** — toast, gdy Ty lub rywal ukończy cud. **Znany błąd zamknięty tego samego dnia:** cud stojący w kolejce budowy raportował się błędnie jako „Dostępny" zamiast „W budowie" — poprawione.

**Obserwacja z 2026-07-23:** AI **dziś nie buduje cudów** samodzielnie — decyzja właściciela (**CUDA-AI=A**, „AI ma zacząć budować cuda") zapadła wieczorem tego samego dnia, ale **nie jest jeszcze wdrożona w kodzie** — traktuj to jako zapowiedź na kolejną sesję, nie stan bieżący.

### 94.1. Typ E vs R

| Typ | Zasada |
|-----|--------|
| **E (wyłączny)** | Max **1 na świat**; tylko wskazane cywilizacje widzą cud w panelu |
| **R (wyścig)** | Wszyscy gracze mogą budować; wygrywa pierwszy ukończony |

Ikona **Cuda** — 6. medalion na toolbarze mapy (§94.0), nie osobny panel boczny.

### 94.2. Wyścigowe Antyk

- **Wyrocznia** — epoka Kamienia (Mistycyzm).
- **Kamień Ha'amonga** — Brąz (Żegluga).
- **Brama wszystkich narodów** — Żelazo (Inżynieria + Wojskowość).

Przegrany wyścig — strata pracy, bez cudu.

### 94.3. Warunki budowy

- **Heks w twoim terytorium** (nie slot miasta).
- **Koszt w pracy** — długa kolejka jak wielki projekt.
- **Technologia** wymagana + często **typ terenu** (pustynia, wybrzeże…).
- Szczegóły — [`91-katalog-cudow-antyk.md`](91-katalog-cudow-antyk.md).

### 94.4. Cuda a siła państwa

**Cuda NIE dodają** do siły państwa (decyzja gameplay). Dają bonusy ekonomiczne, wojskowe, dyplomatyczne (§95). Bogatsza armia z yield — pośrednio wyższa siła.


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 95. Bonusy cudów

### 95.1. Yield × każde miasto

Wybrany typ plonu działa **we wszystkich twoich miastach** (kanon: mnożnik ×3 vs bazowy JSON w danych). Kumuluje z budynkami i polami.

Przykład: Piramidy — +3 złoto i +3 praca **× każde miasto**; bonus terenowy na pustyniach z rzeką.

### 95.2. Bonusy imperium (cywilizacja)

Nie sumowane w karcie miasta — działają na całe państwo:

- **Wpływ** dyplomatyczny (+PN w negocjacjach).
- **Zaufanie** bazowe u sąsiadów.
- **Wojna** — wsparcie, XP armii, % ataku piechoty/oblężenia.
- **Handel** — +% z tras morskich/lądowych.
- **Nauka / produkcja** — +% imperium.

Pełna lista per cud — katalog i `docs/encyklopedia/cuda/`.

### 95.3. Cuda nie dają Mocy (P-A)

**Moc** z odkryć tech — cuda **nie** dodają punktów Mocy (Maciej 2026-06-26).

### 95.4. Strategia wyboru

- Wczesny **E** — zablokuj rywala (np. Petra u Fenicjan).
- **R** — rywalizacja całego świata; przyspiesz pracę złotem.
- Planuj **heks i tech** 10–20 tur wcześniej.
- Utrzymanie cudu — ¤ co turę (Część VIII §49).


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 96. Absolut i wygasanie

### 96.1. Koniec epoki 6 (Średniowiecze)

**Absolut** Antyku — wszystkie **aktywne bonusy** cudów Antyku **wygasają**. Cud **zostaje** na mapie jako **ruina** (model widoczny).

### 96.2. Utrzymanie po absolut — 50% (D-CUD2)

Po absolut utrzymanie = **floor(utrzymanie/2)**, min. 0 (np. Piramidy 2→1 ¤/turę).

### 96.3. Turystyka — +10 handlu

Jedyny **stały** bonus ruiny: **+10 do handlu** (atrakcja turystyczna). Nie przywraca yield × miasto.

### 96.4. Cuda epok 4+

Średniowiecze i dalej — **inne** cuda w osobnych plikach danych. Poradnik v1 — Antyk + absolut; reszta w roadmap.


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik‑L · Część XV · rev. F · 2026-07-23 (nowy ekran Cudów świata — galeria 19 kart, stany, medalion toolbara; AI nie buduje cudów jeszcze mimo decyzji CUDA-AI=A) · pierwotnie rev. E 2026-07-03 · dane: `wonders.json`, `culture-religion.ts`, `wondersView.ts` · katalog: [`91-katalog-cudow-antyk.md`](91-katalog-cudow-antyk.md)*
