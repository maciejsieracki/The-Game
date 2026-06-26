# Spec-generator-mapy.md — Specyfikacja generowania mapy startowej (gra 4X)

## 0. Dziennik zmian

- **2026-06-20** — Zmiana nazwy cywilizacji: **Majowie → Inkowie** we wszystkich sekcjach dokumentu (§1, §5 pseudokod, §6 parametry).

## 0.1 AKTUALIZACJA v0.1 — ROSTER 9 TYPÓW (NADPISUJE §1–§6 tam, gdzie mowa o „5 typach / 50 cyw / nacjach początkowych")

**Decyzja Maciej + master (2026-06-22).** Model rosteru zmieniony względem pierwotnej wersji tej specyfikacji:

- **Roster = 9 TYPÓW GŁÓWNYCH** (źródło prawdy: `gra/data/civs.json`): 7 dotychczasowych + **Celtowie** + **Germanie**, każdy z religią. „50/70/90" to NIE osobne nacje — to **miasta na mapie ze spawnu**.
- **Wszystkie miasta = klastry typów.** Każdy aktywny typ = **1 stolica (gracz lub AI) + do 9 rywali tego samego typu** = klaster do 10 miast. **Znika kategoria „cywilizacje początkowe"** (43 wymyślone nacje zostały cofnięte) — fragmenty §3.2/§3.3 oraz §5 Krok 4 dotyczące `cyw_poczatkowe` są **NIEAKTUALNE**.
- **Liczba aktywnych typów skaluje się z mapą** (zastępuje stałe „Główne typy = 5"):

  | Rozmiar | Aktywne typy | Łączne miasta (= typy × 10) |
  |---------|--------------|------------------------------|
  | Mała    | 3            | ~30                          |
  | Średnia | 5            | ~50                          |
  | Duża    | 7            | ~70                          |
  | Ogromna | 9            | ~90                          |

  Typy losowane z 9-elementowego rosteru (typ gracza zawsze aktywny; reszta bez powtórzeń).
- **Parametry (nadpisanie §6):** `typy_glowne` = wartość z tabeli wyżej (3/5/7/9), NIE stałe 5; `liczba_cywilizacji` = `typy_glowne × (rywale_tego_samego_typu + 1)`; `nazwy_typow` czytane z `civs.json` (9 typów), nie zaszyte na sztywno; usuń krok generujący `cyw_poczatkowe`. Reszta algorytmu (Voronoi → regiony, Poisson-disk z `min_dystans`, mgła, kolejność odkrywania = najpierw własny typ) **zostaje bez zmian**.
- **Założenie `min_dystans` = 9 heksów** (notatka DANE: „miasta ≥~9 pól od siebie") — nadpisuje §3.2/§3.4/§6 (było 5). Daje czytelniejsze klastry; łatwo cofnąć do 5.
- **Własność/wpięcie:** rozmieszczenie klastrów na mapie = **Civ-MAPA** (map-gen). Osadzanie w pętli tury + ekspansja osadnikami AI w obrębie typu = **Civ-SILNIK + Civ-AI** (konsument). Warunek zwycięstwa „dominacja typu" (§8d kanonu) opiera się o ten model.
- **Do potwierdzenia przez Maciej:** które 7 „dotychczasowych" typów wchodzi do puli losowania na mapach < Ogromna (proponuję: zawsze typ gracza + dobór równomierny geo); czy `min_dystans` faktycznie 9 czy zostaje 5.

---

## Spis sekcji

1. [Cel i założenia ogólne](#1-cel-i-założenia-ogólne)
2. [Tabela skalowania mapy](#2-tabela-skalowania-mapy)
3. [Rozmieszczenie cywilizacji i regionów](#3-rozmieszczenie-cywilizacji-i-regionów)
4. [Ludność w terenie i wioski](#4-ludność-w-terenie-i-wioski)
5. [Algorytm generowania — pseudokod](#5-algorytm-generowania--pseudokod)
6. [Parametry konfigurowalne](#6-parametry-konfigurowalne)
7. [Słownik pojęć](#7-słownik-pojęć)

---

## 1. Cel i założenia ogólne

Celem modułu jest wygenerowanie mapy startowej dla rozgrywki 4X, która spełnia następujące warunki:

- Na mapie startuje **50 cywilizacji (graczy)**.
- **5 to cywilizacje GŁÓWNE** (typy): Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi.
- **Pozostałe to drobne „cywilizacje początkowe"** — z nimi możliwa bardzo uproszczona dyplomacja (osobny, późniejszy wątek; **NIE rozwijać teraz**).
- **Gracz zaczyna z 1 OSADNIKIEM.** Wokół niego startuje **~10 innych graczy/osadników TEGO SAMEGO TYPU** (np. wszyscy Grecy), sterowanych przez **AI**.
- **Cel początkowej rozgrywki:** pokonać **rywali własnego typu** (te ~10 sąsiadów tego samego typu), zanim trafisz na inne typy.
- Typy rozmieszczone w różnych regionach mapy; gracz najpierw spotyka **swój typ**, potem pozostałe.
- Liczby (rywale, rozmiar klastra, łączna liczba cywilizacji) skalują się z wielkością mapy — patrz tabela.

---

## 2. Tabela skalowania mapy

| Rozmiar mapy | Siatka (heksy, szer. × wys.) | Łączna liczba cywilizacji | Rywale tego samego typu wokół gracza (AI) | Główne typy cywilizacji |
|--------------|------------------------------|---------------------------|-------------------------------------------|-------------------------|
| **Mała**     | 40 × 25 (1 000 hex)          | ~30                       | ~6                                        | 5                       |
| **Średnia**  | 60 × 40 (2 400 hex)          | 50                        | ~10                                       | 5                       |
| **Duża**     | 80 × 52 (4 160 hex)          | ~70                       | ~14                                       | 5                       |
| **Ogromna**  | 100 × 65 (6 500 hex)         | ~100                      | ~18                                       | 5                       |

> Gracz zawsze zaczyna z **1 osadnikiem**. Wartości domyślne w specyfikacji odnoszą się do rozmiaru **Średniego** (50 cyw., ~10 rywali tego samego typu).

---

## 3. Rozmieszczenie cywilizacji i regionów

### 3.1 Podział na regiony

- Mapa dzielona jest na **N równych stref** (N = liczba cywilizacji), metodą podziału Woronoja na środki regionów lub prostym podziałem kratowym.
- Każdy region jest przypisany **jednej cywilizacji** — bez nakładania się terytoriów startowych.
- Środki regionów są rozmieszczone tak, by każdy znajdował się w odległości **≥ 0,35 × szerokość mapy** od pozostałych.

### 3.2 Klaster startowy gracza i rywale tego samego typu

- Gracz startuje z **1 osadnikiem** w centrum przydzielonego regionu.
- Wokół niego, w tym samym regionie, rozmieszczonych jest **~10 osadników tego samego typu** (np. wszyscy Grecy), sterowanych przez **AI** — to bezpośredni rywale gracza.
- Klaster (gracz + rywale tego samego typu) ma zasięg ~**3–5 pól od punktu centralnego**.
- Wszyscy osadnicy w klastrze muszą spełniać warunek: **odległość między osadnikami ≥ 5 pól** (mierzona w heksach).
- **Cel gracza:** pokonać rywali własnego typu, zanim natrafi na inne typy cywilizacji.

### 3.3 Sąsiedztwo i kolejność odkrywania nacji

- Gracz na starcie widzi (bez mgły) obszar ~**4 pola** wokół swojego osadnika.
- Rywale tego samego typu (AI) zajmują pola w promieniu ~**10 pól od centrum klastra** — gracz spotyka ich jako pierwszych.
- Klastry innych typów cywilizacji głównych znajdują się **≥ 15 pól** od centrum klastra gracza.
- Cywilizacje początkowe (drobne) rozmieszczone są pomiędzy klastrami głównych typów.
- Kolejność odkrywania: najpierw rywale własnego typu → potem cywilizacje początkowe → potem inne typy główne (deterministyczna, wg odległości od granicy regionu gracza).
- **Dyplomacja z cywilizacjami początkowymi:** uproszczona, osobny, późniejszy wątek — **NIE rozwijać teraz**.

### 3.4 Minimalna odległość między miastami

- Każde dwa miasta (niezależnie od cywilizacji) muszą dzielić odległość **≥ 5 pól hex**.
- Miasta różnych cywilizacji dzieli dodatkowo **granica regionu**, co naturalnie zwiększa dystans.

---

## 4. Ludność w terenie i wioski

### 4.1 Reguła inicjalizacji ludności

- **Każdy zamieszkiwalny heks** (wartość żywności ≥ 1) startuje z:
  - 1 wioską (jednostka osadnicza)
  - 1 punktem ludności
- **Heksy niezamieszkiwalne** (góry, jałowe pustkowia, ocean pełny) mają ludność = 0 i brak wioski.

### 4.2 Typy terenu i zamieszkiwalność

| Typ terenu    | Żywność bazowa | Zamieszkiwalny | Wioska startowa |
|---------------|----------------|----------------|-----------------|
| Równina       | 2              | TAK            | TAK             |
| Las           | 1              | TAK            | TAK             |
| Wzgórze       | 1              | TAK            | TAK             |
| Dżungla       | 1              | TAK            | TAK             |
| Step          | 1              | TAK            | TAK             |
| Pustynia      | 0              | NIE            | NIE             |
| Góra          | 0              | NIE            | NIE             |
| Ocean/Morze   | 0              | NIE            | NIE             |
| Tundra        | 1              | TAK            | TAK             |

### 4.3 Przejmowanie wiosek przez gracza

- Gracz przejmuje wioskę poprzez **odkrycie** (eksploracja) lub **zajęcie** (osadnik/wojsko).
- Każda przejęta wioska dodaje 1 punkt **ludności (obywatela)** do miasta, które ją kontroluje.
- Wioski na heksach bez przypisanego miasta trafiają do **puli nieprzypisanej** i mogą być anektowane przez sąsiednie miasto przy jego rozbudowie.

---

## 5. Algorytm generowania — pseudokod

Poniższy pseudokod opisuje sekwencję kroków generatora mapy. Każdy krok jest idempotentny przy tym samym ziarnie (`seed`).

```
FUNKCJA generuj_mape(config):

  // --- Krok 1: Inicjalizacja ---
  ustaw_ziarno_losowości(config.seed)
  siatka <- nowa_siatka_heksagonalna(config.szerokosc, config.wysokosc)

  // --- Krok 2: Generowanie terenu ---
  DLA każdego hex w siatka:
    szum <- perlin_noise(hex.x, hex.y, seed=config.seed)
    hex.teren <- przypisz_teren(szum)          // góry, lasy, równiny, itp.
    hex.zywnosc <- wartosc_zywnosciowa(hex.teren)
    hex.zamieszkiwalny <- (hex.zywnosc >= 1)

  // --- Krok 3: Podział na regiony dla typów głównych ---
  // config.typy_glowne = 5 (Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi)
  srodki_typow <- []
  POWTARZAJ az len(srodki_typow) == config.typy_glowne:
    kandydat <- losowy_zamieszkiwalny_hex(siatka)
    JESLI wszystkie istniejace srodki sa w odleglosci > 0.35 * config.szerokosc:
      dodaj kandydat do srodki_typow

  regiony_typow <- voronoi(siatka, srodki_typow)
  DLA i, typ w enumerate(config.nazwy_typow):
    regiony_typow[i].typ <- typ

  // --- Krok 4: Rozmieszczenie 50 cywilizacji łącznie ---
  // Każdy typ główny dostaje klaster ~10 cywilizacji (osadników) w swoim regionie
  // Pozostałe cywilizacje (do łącznej liczby config.liczba_cywilizacji = 50) to cywilizacje początkowe,
  // rozmieszczone w przestrzeniach między klastrami typów głównych.

  WSZYSTKIE_OSADNIKI <- []

  DLA kazdy region_typu w regiony_typow:
    centrum <- srodki_typow[region_typu.id]
    osadniki_typu <- []

    // Klaster osadników tego samego typu (w tym 1 slot dla gracza, jeśli to jego typ)
    POWTARZAJ az len(osadniki_typu) == config.rywale_tego_samego_typu + 1:
      kandydat <- losowy_hex_w_zasiegu(centrum, promien=5, region_typu)
      JESLI kandydat.zamieszkiwalny
         ORAZ odleglosc(kandydat, kazdy istniejacy osadnik) >= config.min_dystans:
        nowy_osadnik <- OSADNIK(typ=region_typu.typ, hex=kandydat)
        dodaj do osadniki_typu
        dodaj do WSZYSTKIE_OSADNIKI

    regiony_typow[region_typu.id].osadniki <- osadniki_typu

  // Gracz = pierwszy osadnik w klastrze swojego wybranego typu
  osadnik_gracza <- regiony_typow[config.typ_gracza].osadniki[0]
  osadnik_gracza.jest_graczem <- PRAWDA

  // Cywilizacje początkowe — rozmieszczone między klastrami
  cyw_poczatkowe_docelowo <- config.liczba_cywilizacji - (config.typy_glowne * (config.rywale_tego_samego_typu + 1))
  POWTARZAJ az len(CYWILIZACJE_POCZATKOWE) == cyw_poczatkowe_docelowo:
    kandydat <- losowy_zamieszkiwalny_hex(siatka)
    JESLI odleglosc(kandydat, kazdy istniejacy osadnik) >= config.min_dystans:
      nowa_cyw <- OSADNIK(typ="poczatkowa", hex=kandydat)
      dodaj do CYWILIZACJE_POCZATKOWE
      dodaj do WSZYSTKIE_OSADNIKI
  // Dyplomacja z cywilizacjami początkowymi — osobny, późniejszy wątek; NIE rozwijać teraz.

  // --- Krok 5: Inicjalizacja ludności na heksach ---
  DLA kazdy hex w siatka:
    JESLI hex.zamieszkiwalny:
      hex.wioska <- PRAWDA
      hex.ludnosc <- 1
    W PRZECIWNYM RAZIE:
      hex.wioska <- FALSZ
      hex.ludnosc <- 0

  // --- Krok 6: Ustawienie mgły wojny ---
  DLA kazdy hex w siatka:
    hex.widoczny <- FALSZ
    hex.odkryty <- FALSZ

  // Gracz widzi pola wokół swojego jedynego osadnika startowego
  DLA hex w sasiedzi(osadnik_gracza.hex, promien=config.zasieg_widzenia):
    hex.widoczny <- PRAWDA
    hex.odkryty <- PRAWDA

  // --- Krok 7: Ustalenie kolejności odkrywania nacji ---
  // Gracz napotka kolejno: rywali własnego typu → cywilizacje początkowe → inne typy główne
  nacje_wg_odleglosci <- sortuj(
    WSZYSTKIE_OSADNIKI bez osadnik_gracza,
    klucz = odleglosc(osadnik.hex, osadnik_gracza.hex)
  )
  // Rywale tego samego typu będą pierwsi (klaster), następnie cywilizacje początkowe i inne typy

  // --- Krok 8: Walidacja ---
  JESLI len(WSZYSTKIE_OSADNIKI) != config.liczba_cywilizacji:
    ZGLOS_BLAD("Nieprawidłowa łączna liczba cywilizacji — sprawdź config")
  JESLI jakiekolwiek dwa osadniki blizej niz config.min_dystans:
    ZGLOS_BLAD("Naruszony minimalny dystans między osadnikami")

  ZWROC siatka
```

---

## 6. Parametry konfigurowalne

Wszystkie poniższe parametry przekazywane są jako obiekt `config` do funkcji `generuj_mape()`.

| Parametr                        | Typ     | Wartość domyślna (Średnia) | Opis                                                                 |
|---------------------------------|---------|----------------------------|----------------------------------------------------------------------|
| `seed`                          | integer | losowe                     | Ziarno generatora losowości; to samo ziarno = identyczna mapa        |
| `szerokosc`                     | integer | 60                         | Liczba heksów w poziomie                                             |
| `wysokosc`                      | integer | 40                         | Liczba heksów w pionie                                               |
| `liczba_cywilizacji`            | integer | 50                         | Łączna liczba cywilizacji na mapie (gracze + AI)                     |
| `typy_glowne`                   | integer | 5                          | Liczba głównych typów cywilizacji (Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi) |
| `nazwy_typow`                   | lista   | [Grecy, Rzymianie, ...]    | Lista nazw typów głównych; typ gracza = config.typ_gracza            |
| `typ_gracza`                    | string  | (wybór gracza)             | Wybrany przez gracza typ główny (np. "Grecy")                        |
| `rywale_tego_samego_typu`       | integer | 10                         | Liczba rywali tego samego typu wokół gracza (AI), sterowanych przez AI |
| `min_dystans`                   | integer | 5                          | Minimalna odległość (w heksach) między dowolnymi dwoma osadnikami    |
| `promien_klastra`               | integer | 5                          | Promień skupiska startowego (gracz + rywale tego samego typu)        |
| `zasieg_widzenia`               | integer | 4                          | Promień odkrytych pól wokół osadnika gracza na starcie               |
| `ludnosc_startowa_osadnika`     | integer | 1                          | Startowa liczba osadników gracza (zawsze 1)                          |

---

## 7. Słownik pojęć

| Pojęcie             | Definicja                                                                                    |
|---------------------|----------------------------------------------------------------------------------------------|
| **Heks**            | Pojedyncze pole mapy w siatce heksagonalnej.                                                 |
| **Wioska**          | Niezajęta jednostka osadnicza na zamieszkiwalnym heksie; 1 punkt ludności.                  |
| **Miasto**          | Zajęta jednostka osadnicza należąca do cywilizacji; startowo >= 3 punkty ludności.          |
| **Klaster**         | Skupisko miast jednej cywilizacji rozmieszczonych blisko siebie.                             |
| **Region**          | Strefa mapy przypisana jednej cywilizacji; wynik podziału Woronoja.                         |
| **Mgła wojny**      | Mechanika ukrywania nieodkrytych pól mapy; znoszona przez eksplorację.                      |
| **Osadnik**         | Jednostka gracza zdolna do zakładania nowych miast lub przejmowania wiosek.                 |
| **Poisson-disk**    | Algorytm losowania punktów z gwarantowaną minimalną odległością między nimi.                |
| **Voronoi**         | Podział przestrzeni na strefy, gdzie każdy punkt należy do najbliższego centrum regionu.    |
| **Seed (ziarno)**   | Liczba inicjalizująca generator pseudolosowy; gwarantuje powtarzalność mapy.               |
