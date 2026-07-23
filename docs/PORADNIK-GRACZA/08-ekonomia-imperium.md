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
| Szybka | ×1 |
| Standard | ×2 |
| Długa | ×4 |

Wyboru **nie zmienisz** w trakcie partii. **Koszt finalny na karcie tech to nie tylko to** — dochodzi jeszcze **×2 korekta globalna** (2026-07-22) i **mnożnik trudności** (asymetria gracz↔AI: Normalny ×1/×1, Łatwy gracz×1/AI×2, Trudny gracz×2/AI×1). Pełny wzór i przykład liczbowy — Część IX §54.6.

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

## 53. Surowce — stan po urealnieniu (2026-07-22/23)

### 53.1. Dostęp aktywny = złoże **I** ulepszenie na tym samym heksie

Model zmienił się z prostego „masz tech = masz surowiec" na **dwuwarunkowy**: potrzebujesz **złoża widocznego na heksie** ORAZ **postawionego na nim właściwego ulepszenia**. Panel miasta pokazuje obie warstwy osobno — **potencjał** (złoża w zasięgu, nawet bez ulepszenia) vs **dostęp aktywny** (faktycznie produkujący).

| Surowiec | Wymaga na heksie |
|----------|-------------------|
| Glina, miedź/ruda, żelazo, węgiel, koń | Złoże **+** ulepszenie (glinianka, kopalnia…) |
| **Wyjątki bez złoża:** tartak (drewno), kamieniołom (kamień) | Samo ulepszenie na właściwym terenie wystarcza |
| Warzelnia soli | Wyjątek — działa na **wybrzeżu**, bez złoża soli |
| Hodowla (Model B: bydło/owce/lama) | Bez złoża — wystarczy pastwisko/teren |

**Złoże rezerwuje heks** — nie postawisz farmy na miedzi. **Ukryte złoża** — miedź/ruda od Brązu, żelazo od Żelaza, tylko w **Górach**.

### 53.2. Magazyn per miasto i koszty materiałowe budynków (2026-07-23)

Surowce **logistyczne** (drewno, kamień, glina, ruda, **cegła**, **ceramika**) kumulują się teraz w **magazynie miasta** (`city.surowce`) — nie tylko flaga dostępu. Konwertery zamieniają surowiec bazowy na przetworzony: **Garncarnia** (glina→ceramika), **Cegielnia** (glina→cegła), **Odlewnia żelaza**, **Wielka kuźnia** itd. Brąz, żelazo i hodowla (bydło/owce/lama) **zostają na razie civ-wide** (dostęp tak/nie dla całego imperium, nie per-miasto magazyn) — to świadomie odłożone (patrz §10 poniżej).

Od 2026-07-23 **10 budynków epoki Brązu/Żelaza** mają realny **koszt materiałowy** pobierany z tego magazynu przy zapisaniu do kolejki (placeholdery cenowe, do strojenia w panelu):

| Budynek | Koszt surowca |
|---------|----------------|
| Karawanseraj | 4 ceramiki |
| Świątynia | 6 ceramiki |
| Biblioteka | 5 ceramiki |
| Spichlerz II | 10 cegły |
| Akwedukt | 12 cegły |
| Pretorium | 9 cegły |
| Łaźnia publiczna | 10 cegły |
| Akademia | 14 cegły |
| Mury | 15 cegły |
| Cytadela | 18 cegły |

Brak materiału w magazynie **blokuje** wejście do kolejki (karta budynku pokazuje brakujący chip surowca), AI omija budynek, jeśli mu brakuje. **To dlatego Cegielnia i Garncarnia w końcu mają sens** — bez nich nie zbudujesz nic z tabeli powyżej, niezależnie od zapasu Pracy.

### 53.3. Szlaki handlowe — dochód, dostęp, powiadomienia

**Wymóg — traktat Umowa Handlowa.** Trasa **gracz↔obca cywilizacja** istnieje tylko między miastami połączonymi (ląd: dystans ≤12 heksów + przechodniość; morze: przez Port w obu miastach, ≤20 heksów po wodzie) **i** tylko gdy strony mają **zawarty i aktywny traktat Umowa Handlowa** — od 2026-07-23 sam stan pokoju **już nie wystarcza** (Część XII §78.6). AI **proponuje** tę umowę proaktywnie (skrzynka propozycji, próg relacji ≈40) i zawiera ją też AI↔AI (maks. 1 nowa/turę) — nie tylko Ty musisz o nią zabiegać.

**Dochód** ma dwa niezależne składniki, oba do skarbca **czysto** (pomijają suwak Wealth):

1. **Wzór dystansowy** — baza + dystans × mnożnik, z podłogą (placeholdery `econ-params.json`: baza 8 ¤/turę, +0,4 ¤/heks, podłoga 1 ¤/turę). Obie strony trasy zarabiają pełną kwotę.
2. **+5% do Handlu za każdą aktywną trasę** — osobny, kumulatywny mnożnik miasta (nie łączony z bonusem Targowiska/Waluty, żeby uniknąć podwójnego liczenia).

**Dostęp do surowca** — aktywna trasa daje też dostęp do **brązu, żelaza lub konia**, których nie masz u siebie (Handel E3b) — czysta pochodna trasy: zerwanie traktatu lub wojna **automatycznie cofa** dostęp. Panel miasta pokazuje adnotację „szlak handlowy z **X**" przy takim surowcu.

**Limit tras na miasto** = liczba zbudowanych budynków handlowych (Targowisko/Karawanseraj/Port/Port wielki) — więcej budynków, więcej równoległych tras.

**Powiadomienia** — toast + wpis w Wydarzeniach przy powstaniu **nowej** trasy i przy jej **zerwaniu** (z podanym powodem: koniec traktatu, wojna, zerwane połączenie terenowe).

**UI:** sekcja „Szlaki handlowe" w panelu miasta (cel, medium ląd/morze, dystans, dochód/turę, bonus %) + **łuki na mapie** (złoto = szlak lądowy, błękit = morski).

### 53.4. Dostęp a dyplomacja (negocjacje punktowe)

Osobno od szlaków możesz **negocjować dostęp** do konkretnego złoża u sąsiada wprost w audiencji (Część XII §78.5) — jednorazowa transakcja punktowa, nie trwała trasa. Bez żadnej z dwóch ścieżek nie produkujesz z obcego heksu nawet po podboju terytorium — do momentu spełnienia tech/epoki.

### 53.5. Handel surowcami w koszyku dyplomacji (pakiety po 10)

Koszyk negocjacji (Część XII) handluje dziś **ilościowymi** surowcami miast, w **pakietach po 10 sztuk**, cenniki-placeholdery (do strojenia w panelu Excel):

| Surowiec | Cena/szt. w PN |
|----------|-----------------|
| Drewno | 2 |
| Glina | 2 |
| Kamień | 3 |
| Ruda | 4 |
| Cegła | 5 |
| Ceramika | 6 |

Transfer bierze surowiec **od największych zapasów dawcy** i dostarcza do **stolicy** biorcy. **SZYBKA UMOWA** (Część XII) dopełnia bilans oferty tymi pakietami przed sięgnięciem po złoto; AI wycenia oferty przez ten sam cennik.

### 53.6. Strategia

1. Odkryj **góry** zwiadowcą przed Brązem — tam są złoża miedzi/rudy/żelaza.
2. Po wejściu w epokę — postaw **kopalnię** na złożu (po Murarstwie), nie tylko odkryj tech.
3. Planuj **Cegielnię/Garncarnię** zanim zaczniesz kolejkować Mury, Akwedukt czy Cytadelę — bez cegły/ceramiki w magazynie kolejka stoi.
4. Zawrzyj **Umowę Handlową** z sąsiadem w pokoju, zanim zbudujesz drugi Karawanseraj — bez niej szlak i tak nie powstanie; brak brązu/żelaza u siebie to często tańsze rozwiązanie niż czekanie na własne złoże.
5. Nadwyżkę drewna/kamienia/gliny — sprzedawaj w koszyku dyplomacji zamiast trzymać martwy zapas.


### Przykład liczbowy

Tartak **+3** drewno/pole × **2** pola = **+6** drewna/t do miasta magazynu (bez wymogu złoża — wyjątek §53.1).
Mury koszt **15** cegły — Cegielnia produkująca **1** cegłę/turę potrzebuje **15** tur zapasu, zanim odblokuje budowę.
Pakiet **10** drewna w koszyku dyplomacji = **20** PN (cena 2/szt.) — tyle samo co ok. **20** żywności bazowej.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.
- Kolejkowanie Murów/Akweduktu/Cytadeli bez sprawdzenia zapasu cegły — kolejka **utknie** bez komunikatu tak głośnego jak przy braku Pracy.

---

## Ekonomia w jednej tabeli

| Zasób | Gdzie widzisz | Główna dźwignia gracza |
|-------|---------------|-------------------------|
| **Złoto** | Pasek ¤ | Suwak handlu, mniejsze utrzymanie |
| **Żywność** | Pasek + Spichlerz | Farmy, suwak wojska/wzrost, Spichlerz (B5) |
| **Praca** | Pasek | Tartaki, profil Produkcja w okolicy |
| **Nauka** | Pasek Badania | Biblioteki, % nauki w suwaku |
| **Siła państwa** | Minimapa / panel | Armia + wygrane bitwy + ludność |
| **Surowce** | Ikony dostępu + magazyn miasta | Złoże **+** ulepszenie na heksie; cegła/ceramika z Cegielni/Garncarni; brąz/żelazo/koń przez szlak handlowy (§53) |


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

*Poradnik‑L · Część VIII · rev. F · 2026-07-23 (§51.2 wzór kosztu tech poprawiony, §53 surowce przepisane: dostęp złoże+ulepszenie, magazyn miasta, koszty materiałowe budynków, dostęp przez szlak, handel pakietami) · pierwotnie rev. E 2026-07-03 · decyzje: B5, E2, E3, B-SUROW-BUD, C-DYP-SUROWCE · dane: `econ-params.json`, `buildings.json`, `resource-access.ts` · spis §49–53*
