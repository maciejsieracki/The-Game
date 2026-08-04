# Część I — Pierwsze kroki

> **Poradnik gracza (Pełny)** · menu główne · kreator nowej gry · start na mapie  
> Powiązane: Część II (mapa) · Część III (pasek zasobów) · decyzja [`E1-nowa-gra.md`](../grupa-e/decyzje/E1-nowa-gra.md) · spis §1–8

Ten rozdział prowadzi cię od ekranu tytułowego do pierwszych tur na mapie: co kliknąć w menu, jak przejść przez kreator w pięciu krokach, co oznaczają klastry cywilizacji i trudność oraz jak epoka startowa wpływa na technologie. Piszemy językiem gracza — bez skrótów technicznych z dokumentacji zespołu.

---

## 1. Menu i nawigacja

### 1.1. Ekran główny

Po uruchomieniu gry widzisz **menu główne** z tłem wideo (wyciszone w pętli). Główne przyciski:

| Przycisk | Co robi |
|----------|---------|
| **Rozpocznij grę** | Otwiera kreator nowej gry (5 kroków) |
| **Kampania** | W wersji 1.0 — wyszarzone, etykieta „Wkrótce" |
| **Multiplayer** | W wersji 1.0 — wyszarzone, etykieta „Wkrótce" |
| **Ustawienia** | Dźwięk, muzyka, rozdzielczość |

W podmenu **Więcej** znajdziesz: **Kontynuuj** (ostatni zapis automatyczny), **Wczytaj grę**, **O grze**, **Wyjdź**.

**Rozpocznij grę** zawsze startuje **czystą** sesją — skarbiec, nauka i lista zbadanych technologii resetują się (decyzja E1 nr 1). Poprzednią partię odzyskasz tylko przez **Kontynuuj** lub **Wczytaj**.

**Wskazówka:** Przed pierwszą grą zajrzyj w **Ustawienia** — wyłącz muzykę, jeśli wolisz ciszę podczas nauki interfejsu.

### 1.2. Co jest „Wkrótce"

**Kampania** i **Multiplayer** są widoczne w menu, ale nieklikalne — to świadomy wybór wersji 1.0 (decyzja E1 nr 6). Standardowy tryb to **wolna gra na mapie** (sandbox 4X): wybierasz cywilizację, ustawienia świata i grasz do zwycięstwa dominacją lub nauką.

### 1.3. Zapisywanie i wczytywanie

- **Kontynuuj** — wraca do ostatniego **autosave** (jeśli istnieje).
- **Wczytaj grę** — lista zapisów ręcznych z datą i nazwą państwa.
- W trakcie gry zapis możesz wywołać z dolnej belki mapy (jeśli dostępny w buildzie).
- Wczytanie **nadpisuje** bieżącą sesję — gra powinna poprosić o potwierdzenie.

**Wskazówka:** Przed aktualizacją buildu zrób ręczny zapis — stare pliki czasem wymagają migracji po dużej zmianie wersji.


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 2. Kreator nowej gry (5 kroków)

Pasek u góry kreatora: **Intro → Cywilizacja → Epoka → Ustawienia → Start**. Możesz cofać się strzałką **Wstecz** między krokami.

### 2.1. Intro

Krótkie wprowadzenie z tytułem gry i opisem wersji. Jedyny przycisk: **Rozpocznij konfigurację →**. Brak pól do wyboru — to ekran powitalny.

### 2.2. Epoka startowa

| Epoka | Status w v1.0 | Efekt |
|-------|---------------|-------|
| **Epoka Kamienia** | domyślna, aktywna | Badania od zera; najwcześniejsze jednostki i budynki |
| **Epoka Brązu** | wybieralna | Wszystkie tech **Kamienia** już zbadane; Brąz badasz od zera (reguła kaskady — §6) |
| **Epoka Żelaza** | „Wkrótce" (wyszarzona) | Niedostępna w kreatorze v1.0 |

Epoka wpływa na to, co możesz budować i rekrutować **od pierwszej tury** — nie dostajesz „paczki startowej" wojska poza tym, co odblokowują technologie (§6.2).

### 2.3. Wybór cywilizacji

Dziewięć aktywnych typów: **Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie**. Klik w kartę pokazuje panel szczegółów: typ główny, religia, styl, bonusy, jednostka specjalna.

**Default szybkiej gry (E1):** **Rzymianie** zaznaczeni od otwarcia kroku 2. Szczegóły bonusów każdej nacji — Część XIII (Cywilizacje). Nie każda nacja startuje w tej samej epoce wizualnej na mapie (np. Inkowie mają własne modele miast Brązu).

**Wskazówka:** Na pierwszą grę wybierz cywilizację z bonusem ekonomicznym lub obronnym — łatwiej przetrwać wczesne tury niż z czysto ofensywnym bonusem walki.

### 2.4. Ustawienia świata

Wszystkie parametry ustawiasz na jednym ekranie (krok 4):

| Parametr | Opcje | Default (E1) |
|----------|-------|--------------|
| **Trudność** | Łatwy · Normalny · Trudny | Normalny |
| **Rozmiar mapy** | Malenki · Mały · **Standardowy** · Duży · Ogromny | Standardowy (84×60 heksów) |
| **Typ świata** | Kontynenty · Pangea · Wyspy · Ziemia | Kontynenty |
| **Tempo gry** | Szybka · Standard · Długa | Standard |
| **Gęstość świata** | Mało · Średnio · Dużo | Średnio |
| **Miasta-państwa w klastrze** | 0–N | patrz §4 |
| **Liczba typów rywali** | skalowana do mapy (±1) | Standard → ok. **6 rywali AI** |

**Typ świata — skrót:**
- **Kontynenty** — kilka lądów, morze między nimi (domyślny).
- **Pangea** — jeden superkontynent, więcej kontaktu z sąsiadami.
- **Wyspy** — archipelag, dużo wybrzeży i morza.
- **Ziemia** — układ inspirowany kontynentami Ziemi (preset, decyzja E1 nr 3).

**Tempo gry** mnoży koszty badań: Szybka ×0,2 · Standard ×1 · Długa ×5 (§6.3).

### 2.5. Podgląd i Start

Ostatni krok to **podsumowanie**: cywilizacja, epoka, trudność, mapa, tempo, rywale. Przycisk **Start** uruchamia **generowanie mapy** — po chwili lądujesz na mapie strategicznej w **turze 1**.

### 2.6. Defaulty szybkiej gry

Profil zalecany dla nowych graczy (E1): **Rzymianie · Epoka Kamienia · Normalny · Standardowy · Kontynenty · tempo Standard**. Każdy parametr możesz zmienić przed Start — defaulty tylko wypełniają wybory.


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 3. Start na mapie — pierwsze minuty

### 3.1. Auto-założenie stolicy

W tej grze **nie ma jednostki osadnika**. **Stolica pojawia się automatycznie** na wylosowanym heksie startowym — od razu masz panel miasta i terytorium wokół. Kolejne miasta zakładasz z panelu **Budowa → Załóż miasto** (koszt: **20 Pracy + 1 ludność** z miasta-źródła; min. **4 heksy** od innego miasta) — szczegóły w Części V §27.3 i Części II §9.2.

### 3.2. Heks pod miastem

Centrum miasta **zajmuje heks** — nie stawiasz tam farmy ani tartaku. Pola do pracy zaczynają się w **okolicy** (promień 3 heksów — Część VII §44). Planuj ulepszenia na sąsiednich polach.

### 3.3. Bonus Osiedle

Małe miasto (**1–4 mieszkańców**) dostaje bonus startowy **Osiedle** — wpływa na szczęście i plony; siła zależy od trudności (§5.2, Część VI §33.4). Bonus znika, gdy miasto urośnie powyżej progu.

### 3.4. Mgła wojny na starcie

Widzisz tylko heksy w zasięgu wzroku startowych jednostek. Rzeki i wybrzeża mogą być ukryte — odkrywasz je ruchem wojska. Minimapa pokazuje mgłę: ciemne = niewidziane (Część II §8, Część III §18).

**Wskazówka:** Pierwszą turę wyślij zwiadowcę (jeśli masz) w stronę nieodkrytego terenu — zanim postawisz farmy, warto wiedzieć, gdzie jest woda i złoża.


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

## 4. Świat polityczny — klastry i miasta-państwa

### 4.1. Model klastra

Wybierasz np. **Grecy** — na mapie są też inne miasta tego samego **typu** (Sparta, Teby…) z własnymi nazwami z danych gry. To **kopie typu cywilizacji**, nie losowe miksowanie nacji. Każdy klaster ma listę nazw miast przypisanych do typu.

### 4.2. Miasta-państwa w kreatorze

Suwak **Miasta-państwa w klastrze** = ile **rywali tego samego typu** siedzi obok ciebie w regionie startowym.

| Ustawienie | Efekt |
|------------|-------|
| **0** | Tylko ty reprezentujesz ten typ na mapie (rzadkie) |
| **1–2** | Kilku sąsiadów do dyplomacji i podboju |
| **Więcej** | Gęstszy region startowy, więcej celów wojskowych |

To **nie** jest liczba wszystkich AI na mapie — osobno ustawiasz **liczbę typów rywali** (skalowaną do rozmiaru mapy).

### 4.3. Zachowanie miast-państw

Miasta-państwa są **defensywne** — nie zakładają nowych miast poza swoim terytorium jak główna AI. Bronią się, handlują, walczą — ale nie ekspandują agresywnie. Możesz je **zdobyć** wojną, ultimatum lub dyplomacją (Część XII).

### 4.4. Nazwy na liście dyplomatów

W panelu dyplomacji każdy wpis to **jedno miasto** z własną nazwą (np. „Sparta", „Kapua") — osobne relacje, osobne wojny. Spotkasz sąsiada po odkryciu w mgle lub na granicy terytoriów.


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

## 5. Trudność gry

### 5.1. Trzy poziomy

| Poziom | Charakter |
|--------|-----------|
| **Łatwy** | Wolniejsza AI, łagodniejsze kary ekonomiczne, bonusy dla gracza |
| **Normalny** | Profil referencyjny balansu v1.0 |
| **Trudny** | Silniejsza AI, ostrzejsze progi buntu, mniej tolerancji na błędy |

Trudności **nie zmienisz** w trakcie gry (v1.0).

### 5.2. Co dokładnie zmienia trudność

- **Próg wzrostu ludności** — wyższy na Trudnym (więcej żywności na kolejnego mieszkańca).
- **Spichlerz** — pojemność i efekty magazynu (Część VI §39).
- **Żywność wojska** — zużycie i kary głodu (Część VIII §50).
- **Bonus Osiedle** — silniejszy na Łatwym, słabszy na Trudnym.
- **Progi buntu** — kiedy zaczyna się niepokój (Część VI §36).
- **Bogactwo** — immunitet / modyfikatory na wyższej trudności.
- **Bonusy AI** — produkcja, nauka (Część XIV).

### 5.3. Pakiet startowy × trudność

Startowa paczka zasobów i jednostek zależy od **epoki i trudności** razem (decyzja D18). Pełna tabela — apendyks B.3 spisu treści.

**Wskazówka:** Na **Normalnym** pierwsze 10 tur skup się na żywności i jednej linii badań — AI na Trudnym szybciej cię dogoni militarnie, jeśli zaniedbasz ekonomię.


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

## 6. Epoka startowa a technologie

### 6.1. Reguła kaskady (decyzja E1 nr 2)

| Start w | Co masz zbadane |
|---------|-----------------|
| **Kamień** | Nic — wszystkie tech Kamienia od zera |
| **Brąz** | **Wszystkie** tech Kamienia zbadane; Brąz badasz od zera |
| **Żelazo** *(przyszłość)* | Kamień + Brąz zbadane; Żelazo od zera |

Nie musisz ponownie odkrywać Rolnictwa, gdy startujesz w Brązu — od razu budujesz i rekrutujesz z puli Brązu (o ile tech to pozwalają).

### 6.2. Jednostki przez tech, nie starter-pack

Na starcie **nie** dostajesz pełnego zestawu wojska „na zapas". Każda jednostka wymaga odpowiedniej technologii w drzewku (Część IX). Wyjątki: ograniczona lista jednostek z pakietu balansu epoki.

### 6.3. Tempo gry a koszty badań

| Tempo | Mnożnik kosztu tech |
|-------|---------------------|
| Szybka | ×0,2 |
| Standard | ×1 |
| Długa | ×5 |

Ustawiasz w kreatorze (krok 4) — wpływa na **całą** partię. Połączenie **Brąz + Szybka** skraca wczesną grę; **Kamień + Długa** to maraton.


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Pierwsze pięć tur — checklist

1. Otwórz **stolicę** → zakładka **Plony** (Część VII) — czy rośnie żywność?
2. Ustaw **badanie** — klik **Badania** na pasku (Część III §14.4).
3. **Okolica** → profil Żywność lub ręcznie farma na łąkach.
4. Wyślij jednostkę w mgłę — odkryj rzekę i sąsiadów.
5. Sprawdź **Wykonaj** na dolnym pasku — rozwiąż blocking przed końcem tury.


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

*Poradnik‑L · Część I · rev. G · 2026-08-04 (brak osadnika; założenie miasta z panelu Budowa) · pierwotnie rev. E 2026-07-03 · decyzje: E1, D13, D18 · spis: `PORADNIK-GRACZA-SPIS-TRESCI.md` §1–8*
