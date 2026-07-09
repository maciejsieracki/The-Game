# Część VIII — Ekonomia imperium

> **Poradnik gracza (Pełny)** · skarbiec · żywność wojska · nauka · siła państwa · surowce v1  
> Powiązane: Część III (pasek zasobów) · Część VI (suwaki, Spichlerz) · decyzje [`B5-spichlerz-wzrost-ludnosci.md`](../decyzje/B5-spichlerz-wzrost-ludnosci.md) · [`E3-surowce.md`](../decyzje/E3-surowce.md) · spis §49–53

Ekonomia imperium to wspólna kasa państwa: złoto, żywność na wojsko, tempo badań, prestiż **siły państwa** i uproszczony model **surowców** w wersji 1.0. Miasta produkują zasoby lokalnie; suwaki decydują, ile trafia do wspólnej puli. Ten rozdział łączy liczby z górnego paska z decyzjami, które podejmujesz w panelu miasta.

---

## 49. Skarbiec państwa (Złoto)

### 49.1. Przychody co turę

| Źródło | Skąd |
|--------|------|
| **Podatki** | Suwak **handlu** w każdym mieście — część na złoto (Część VI §38.1) |
| **Pola** | Profile **Podatki** / zrównoważone w okolicy (Część VII §43.3) |
| **Handel dyplomatyczny** | Umowy z innymi państwami (Część XII) |
| **Jednorazowo** | Prezenty, trybut, łup (jeśli mechanika aktywna w buildzie) |

Przyrost **netto** widzisz na pasku jako **+X na turę** przy ikonie ¤ (Część III §14.2).

### 49.2. Wydatki co turę

| Koszt | Opis |
|-------|------|
| **Utrzymanie budynków** | Stała opłata ¤ za każdy wzniesiony budynek we **wszystkich** miastach |
| **Utrzymanie jednostek** | Wojsko w polu i w garnizonach |
| **Utrzymanie cudów** | Po wzniesieniu cuda świata (Część XV) |

**Przyspieszenie** budowy lub rekrutacji za złoto to wydatek **jednorazowy** — nie powtarza się co turę (Część VII §46).

### 49.3. Bilans netto

```
Skarbiec (tura N+1) ≈ skarbiec (tura N) + przychody − utrzymanie
```

| Sygnał na pasku | Co robić |
|-----------------|----------|
| **Ujemny +X** | Armia lub budynki zjadają więcej niż podatki — obniż utrzymanie lub podnieś % złota w suwaku |
| **Bliski zero** | Brak rezerwy na rush przed wojnou |
| Tooltip (jeśli jest) | Rozbicie dochodów i kosztów per kategoria |

**Złoto ≠ bogactwo.** **Bogactwo** (luksus) to osobny wiersz — wpływa na szczęście i zamożność, ale **nie** zastępuje skarbca (Część VI §37, Część III §14.5).

### 49.4. Strategie gracza

| Faza gry | Priorytet |
|----------|-----------|
| **Wczesna** | Niskie utrzymanie; unikaj pustego skarbca przed pierwszą wojnou |
| **Środek** | Balans suwaka: więcej złota vs więcej nauki |
| **Wojna** | Rezerwa na rekrutację i przyspieszenia w kluczowym mieście |
| **Po absolut cudów** | Utrzymanie cudów spada, ale nadal kosztuje (Część XV §95) |

**Wskazówka:** Jedna Akademia w stolicy może pochłonąć cały dodatni przyrost złota — sprawdź utrzymanie przed rush’em budowy.


### Przykład liczbowy

Przychód **+18** ¤/t (3 miasta × ~6 ¤), utrzymanie **12** budynków × **1** ¤ + **6** jednostek × **1** ¤ = **−18** ¤.
Bilans **0** — każdy rush za **20** ¤ obniża skarbiec o **20** natychmiast.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 50. Żywność imperium i wojsko

### 50.1. Dwa poziomy — miasto vs państwo

| Poziom | Co to jest |
|--------|------------|
| **Miasto** | Produkuje żywność z pól; suwak **Rozwój miast** dzieli ją na bufor wzrostu i udział wojska |
| **Państwo (Spichlerz)** | Wspólny magazyn na pasku — format **bieżące / maksimum** (Część III §21) |
| **Bez Spichlerza** | Każde miasto trzyma własny bufor wzrostu; suma na pasku ≠ prosta suma buforów |

Decyzja **B5:** termin UI to **Spichlerz** (nie „magazyn żywności"). Ze Spichlerzem nadwyżka z suwaka **kumuluje się** w zapasach państwa; bez niego po awansie ludności bufor często **→ 0**.

### 50.2. Kto zużywa żywność

| Konsument | Mechanizm |
|-----------|-----------|
| **Populacja** | Bufor wzrostu w miastach (suwak Rozwój miast) |
| **Wojsko w polu** | Koszt za jednostkę co turę z zapasów państwa |
| **Garnizon** | Jak wojsko w polu — stoi na mieście, nadal je |
| **Marsz** | Dodatkowe zużycie przy długich trasach — status v1.0 w balansie |

### 50.3. Głód wojska (decyzja B5)

Gdy zapasy państwa spadną **poniżej zera**:

- Wojsko traci **−8% maksymalnego zdrowia** na turę.
- Jednostka może **paść z głodu** bez walki.
- Głód **nie blokuje rekrutacji** — możesz werbować, ale karmić musisz od razu.

**Remedium:** Spichlerz w imperium, suwak żywności na wojsko, mniej armii w polu, więcej farm.

### 50.4. Priorytety gracza

| Sytuacja | Suwak / budowa |
|----------|----------------|
| Wczesny wzrost | ~70% na **Rozwój miast** — szybki bufor przed wojnou |
| Przed kampanią | 50%+ na wojsko + **Spichlerz** |
| Wiele miast | Jeden wspólny magazyn karmi całą armię |
| Pełny magazyn | **Nadwyżka przepada** co turę (B5) — nie „bankuj" w nieskończoność |

### 50.5. Hasła Wiki

Żywność · Spichlerz · Zapasy państwa · Suwak żywności — karty Wiki‑M w `docs/encyklopedia/pojecia/`.


### Przykład liczbowy

Zapas państwa **45/100**, koszt armii **12** 🍞/t → netto **+33**/turę przy nadwyżce **+45**.
Gdy zapas spadnie **<0**, każda jednostka **−8%** max HP/t (normal) — z **100** HP zostaje **92** po 1 turze głodu.

### Strategia gracza

Postaw **pierwszy Spichlerz** przed masową rekrutacją — jeden budynek w imperium włącza **50%** bufora i magazyn **100** 🍞.

### Typowe błędy

- Rekrutacja **10** jednostek **bez** Spichlerza i bez zapasu — głód **−8%** HP/t.
- Myślenie, że Spichlerz musi być **w tym samym** mieście co armia (efekt **globalny**).

---

## 51. Nauka (badania)

### 51.1. Wspólna pula imperium

Wszystkie miasta **składają** punkty badań do **jednej puli** państwa:

| Źródło nauki | Gdzie ustawiasz |
|--------------|-----------------|
| Suwak handlu (% na naukę) | Zakładka **Miasto** w każdym centrum |
| Budynki | Biblioteka, Akademia… |
| Cuda / bonusy | Rzadkie mnożniki |

Na pasku: **+X badań**, nazwa **aktualnej tech**, pasek **%** (Część III §14.4). **Klik** → drzewko technologii (Część IX).

### 51.2. Tempo gry a koszty (kreator — Część I §6.3)

| Tempo | Mnożnik kosztu tech |
|-------|---------------------|
| Szybka | ×0,2 |
| Standard | ×1 |
| Długa | ×5 |

Wyboru **nie zmienisz** w trakcie partii.

### 51.3. Wybór technologii

- **Jedno** aktywne badanie naraz.
- Ukończenie → kolejne z kolejki lub wybór gracza.
- Brak celu → chip **Wykonaj** „Wybierz technologię" (Część III §16.4).

### 51.4. Nauka a epoki

Część tech jest **wyszarzona**, dopóki nie awansujesz epoki. Awans epoki odblokowuje gałąź drzewka (Część IX §55). Zwycięstwo naukowe — wszystkie tech + rakieta (Część XVI §98).

**Wskazówka:** Po starcie w **Brązu** (kaskada E1) nie badasz od zera Rolnictwa — od razu celuj w tech Brązu, które otwierają mury i metal.


### Przykład liczbowy

2 miasta: **+6** i **+4** badań/t + suwak **20%** z handlu **30** = **+6** → łącznie **+16**/turę.
Tech koszt **80** → ukończenie za **5** tur przy stałym tempie.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 52. Siła państwa — pełny model

### 52.1. Armia w polu

Każda jednostka ma **moc bojową (M)** — widać na karcie (Część IV §22). **Siła państwa** liczy **sumę M** wszystkich twoich jednostek w imperium.

| Wyjątek | Reguła |
|---------|--------|
| **Oblężnicze w polu** | Liczą **0** w tej sumie (tylko w oblężeniu) |
| **Po bitwie** | Siła spada ze stratami |

### 52.2. Wygrane bitwy — bonus historyczny

Za każdą **pokonaną** armię wroga dodajesz sumę mocy wroga **sprzed walki**:

- Nie liczy się twoja strata — tylko siła pokonanego.
- Kumuluje się przez całą grę — historia zwycięstw buduje prestiż.
- **Przegrana** nie odejmuje punktów siły państwa — tracisz tylko jednostki z sumy armii.

### 52.3. Inne składniki

Do siły państwa wliczają się m.in.:

- **Ludność** — suma mieszkańców wszystkich miast.
- **Miasta** — liczba i wielkość osiedli.
- **Terytorium** — heksy pod kontrolą.
- **Rozwój** — budynki, technologie, ulepszenia pól.

### 52.4. Czego NIE wlicza się

| Element | Dlaczego osobno |
|---------|-----------------|
| **Mnożnik epoki** | Osobna mechanika w walce |
| **Cuda świata** | Dają bonusy, ale **nie** dodają do siły państwa |
| Buffy tymczasowe | Tylko na czas bitwy |
| **Respekt** u dyplomatów | Powiązany, ale osobna liczba (Część XII §74) |

### 52.5. Siła państwa a zwycięstwo dominacją

Warunek v1.0 (E2): twoja siła **> 50%** sumy siły wszystkich graczy w **ostatniej epoce** (epoka Żelaza = próg końcowy — Część XVI §97).

Na mapie **siła państwa** daje szybki podgląd przy minimapie (Część III §20). Tooltip — czy widać rozbicie składników — zależy od buildu UI.

**Wskazówka:** Duża armia bez wygranych bitew daje wysoką sumę **M**, ale mniejszy bonus historyczny — wygrywaj starcia, nie tylko stój na granicy.


### Przykład liczbowy

Armia: **3×** piechota M=**8**, **1×** rydwan M=**12** → suma **36** mocy w polu.
Próg dominacji **>50%** świata w epoce Żelaza — przy światowej sile **200** potrzebujesz **>100**.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 53. Surowce — stan v1.0

### 53.1. Katalog i dostęp boolean

W danych gry istnieją m.in.: drewno, kamień, miedź, żelazo, sól, glina, bydło, lama…

| Reguła v1.0 | Znaczenie dla gracza |
|-------------|----------------------|
| **Dostęp = tech LUB ulepszenie** | Flaga **masz / nie masz** — bez magazynu sztuk |
| **Złoże rezerwuje heks** | Nie postawisz farmy na miedzi |
| **Ukryte złoża** | Miedź od Brązu, żelazo od Żelaza — tylko **Góry** (E3) |

### 53.2. Co UI pokazuje vs co silnik egzekwuje

| W UI v1.0 | W produkcji v1.0 |
|-----------|------------------|
| Ikona dostępności surowca | Koszt budowy/rekrutacji: **złoto + ludność + tech** |
| Wymagania surowcowe w JSON | **Referencja** na v2.0 — nie odejmują się sztuki z magazynu |

**Nie planuj** gospodarki wokół magazynów drewna — ich jeszcze nie ma. Priorytet: **technologia** odblokowująca złoże → **ulepszenie** (kopalnia, tartak) na właściwym heksie.

### 53.3. Dostęp a dyplomacja

Możesz **negocjować dostęp** do złoża u sąsiada (Część XII §78). Bez dostępu nie produkujesz z obcego heksu nawet po podboju terytorium — do momentu spełnienia tech/epoki.

### 53.4. Strategia w v1.0

1. Odkryj **góry** zwiadowcą przed Brązem.  
2. Po wejściu w epokę — szukaj ikony miedzi; postaw **kopalnię** po Murarstwie.  
3. Planuj **posterunki** i miasta tak, by złoże było w **okolicy** (Część VII §44).  
4. Pełna produkcja i handel surowcami — 🔮 v2.0 (apendyks E.1).


### Przykład liczbowy

Tartak **+3** drewno/pole × **2** pola = **+6** drewna/t do miasta (model v1 uproszczony).
Kamieniołom **+1** kamień — mur poz.1 koszt **35** pracy ≈ **4 tury** przy **9** pracy/t na budynki.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Ekonomia w jednej tabeli

| Zasób | Gdzie widzisz | Główna dźwignia gracza |
|-------|---------------|-------------------------|
| **Złoto** | Pasek ¤ | Suwak handlu, mniejsze utrzymanie |
| **Żywność** | Pasek + Spichlerz | Farmy, suwak wojska/wzrost, Spichlerz (B5) |
| **Praca** | Pasek | Tartaki, profil Produkcja w okolicy |
| **Nauka** | Pasek Badania | Biblioteki, % nauki w suwaku |
| **Siła państwa** | Minimapa / panel | Armia + wygrane bitwy + ludność |
| **Surowce** | Ikony dostępu | Tech + ulepszenie na złożu (E3) |


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 70% złoto · 20% nauka · 10% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik‑L · Część VIII · rev. E · 2026-07-03 · decyzje: B5, E2, E3 · dane: `econ-params.json`, `buildings.json` · spis §49–53*
