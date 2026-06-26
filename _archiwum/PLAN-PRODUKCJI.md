# PLAN PRODUKCJI — „The Game" (4X / Civ-like, HTML+JS)
> Dokument roboczy — stan na 2026-06-20. Jedyne źródło prawdy o tym, **co trzeba zbudować i w jakiej kolejności**, żeby od prototypu v0.1 dojść do grywalnej, kompletnej gry.

---

## 1. WARSTWA DANYCH / ZASADY

### Co istnieje
- [GOTOWE] `PROJEKT-GRY-master.md` — główny dokument zasad (ekonomia, ludność, zdrowie, walka, magazyny, drzewko technologii, hodowla, przejścia walut)
- [GOTOWE] `Budynki.xlsx` — katalog budynków z Zużyciem/turę i Produkcją/turę, koszty materiałowe per epoka
- [GOTOWE] `Jednostki.xlsx` — statystyki jednostek: Atak, Obrona, Uderzenie, Health, Morale, Ruch; epoki Kamień i Brąz
- [GOTOWE] `Surowce.xlsx` — katalog surowców (surowe i przetworzone), łańcuchy produkcji
- [GOTOWE] `Plony-terenow.xlsx` — plony wszystkich typów terenu (Żywność, Praca, Handel, Drewno)
- [GOTOWE] `Technologie-drzewko.xlsx` — struktura drzewka, prereqs, koszty Nauki per epoka

### Co brakuje — luki danych
- [DO ZROBIENIA] **Cywilizacje** — brak jakiejkolwiek definicji; lista, bonusy, liderzy, unikalne jednostki/budynki — patrz sekcja 5
- [DO ZROBIENIA] **Balans ekonomiczny** — mnożniki i koszty nie były nigdy weryfikowane w grze; potrzebna iteracja po zaimplementowaniu v0.2
- [DO ZROBIENIA] **Epoki późniejsze (Żelazo, Starożytność, Średniowiecze…)** — arkusze zawierają tylko Kamień i Brąz; wpisy dla kolejnych epok brakują
- [DO ZROBIENIA] **Warunki zwycięstwa** — nie są zdefiniowane jako dane (tylko wzmianki w masterze)
- [DO ZROBIENIA] **Parametry AI** — brak jakichkolwiek reguł/wag dla zachowania komputera
- [BRAK] **Definicje dyplomacji** — relacje, umowy, sojusze, wypowiedzenie wojny; brak w masterze i arkuszach
- [BRAK] **Parametry „specjalne" cywilizacji** w arkuszach (kolumna z civ-specific override wartości)
- [DO ZROBIENIA] Stat **Uderzenie** — jego rola (szarża 1. runda) jest opisana w masterze, ale nie jest przetestowana ani sfinalizowana liczbowo

---

## 2. BACK-END / SILNIK

### Generator mapy
- [GOTOWE] Podstawowy generator heksów (16×12, typy terenu, losowe złoża, punkt startowy gracza)
- [DO ZROBIENIA] Skalowalne rozmiary mapy (małe / średnie / duże / własne)
- [DO ZROBIENIA] Lepsza generacja proceduralna — kontynenty, oceany, rzeki jako obiekty, pasma górskie, biomy
- [DO ZROBIENIA] Modyfikator Rzeki (+Handel, irygacja, przeprawa w walce) jako osobny element mapy
- [DO ZROBIENIA] Rozmieszczenie startowe wielu graczy (równoodległe, na lądzie)
- [DO ZROBIENIA] Generacja złóż per teren (ruda tylko na wzgórzach/górach, glina przy rzekach itp.)
- [BRAK] Mgła wojny (fog of war) — nieodkryte kafle niewidoczne

### Pętla tury
- [GOTOWE] Podstawowa pętla tury (endTurn: nauka, wzrost miast, produkcja, ruch jednostek gracza)
- [DO ZROBIENIA] Faza AI (ruch jednostek AI, decyzje budowy, badania, dyplomacja)
- [DO ZROBIENIA] Tryb wieloosobowy (kolejność graczy) — póki co tylko 1 gracz + barbarzyńcy
- [DO ZROBIENIA] Zdarzenia turowe (klęski żywiołowe, epidemie, odkrycia) — opcjonalne

### Ekonomia ilościowa (Praca / Handel / Pieniądz)
- [GOTOWE] Plony terenu przypisane do miast (zasięg R=2), podstawowy model Pracy i Handlu
- [GOTOWE] Suwak Handel→Nauka/Skarbiec (logika w masterze, zaznaczona w prototypie)
- [DO ZROBIENIA] **Pełna implementacja ilościowa** — magazyny lokalne z pojemnością, przepełnienie przepada, przenoszenie między miastami
- [DO ZROBIENIA] Centralny skarbiec w stolicy (Pieniądz), utrata stolicy = skarbiec do 0
- [DO ZROBIENIA] Utrzymanie jednostek w Pieniądzu/turę
- [DO ZROBIENIA] Podatki jako źródło Pieniądza (per miasto, per epoka)
- [DO ZROBIENIA] Mnożniki budynków (Młyn +Praca, Mennica Handel→Pieniądz, Targowisko)
- [BRAK] **Przejście walutowe Pieniądz→Pieniądz fiducjarny×100→Energia×1000** — logika, warunki odblokowania, wpływ na UI
- [BRAK] Popyt i podaż na rynku globalnym (ceny surowców zmienne)

### Produkcja i przetwarzanie
- [GOTOWE] Budynki produkujące przetworzone surowce (Tartak: drewno→deski, Huta: ruda+paliwo→brąz) — model dostępu
- [DO ZROBIENIA] **Pełny model ilościowy produkcji** — wejście/wyjście 1:1 z przepustowością/turę, automatyczny tryb z przełącznikiem, pauza przy braku wejścia lub pełnym magazynie
- [DO ZROBIENIA] Pastwisko jako modyfikacja terenu — hodowla bydła (→+Praca) i owiec (→+Żywność), wymóg zarodka
- [DO ZROBIENIA] Łańcuchy produkcji wielo-etapowe (ruda→brąz→broń brązowa)

### Badania / drzewko technologii
- [GOTOWE] Podstawowe drzewko (Kamień+Brąz, prereqs, odkrywanie), auto-wybór następnego tech
- [DO ZROBIENIA] UI wyboru technologii przez gracza (nie auto)
- [DO ZROBIENIA] Epoki późniejsze (Żelazo i dalej) z pełnym drzewkiem
- [DO ZROBIENIA] Technologie wymagające budynku (np. Żegluga → Tartak)
- [DO ZROBIENIA] Bonusy technologiczne widoczne w UI i aplikowane natychmiast

### Ludność / zdrowie
- [GOTOWE] Model ludności: 1 ludność = 1 jedzenie/turę; wzrost przez nadwyżkę; jednostka = −1 ludność
- [DO ZROBIENIA] **Model zdrowia miast** — czynniki pozytywne (akwedukt, szpital, czysta woda) i negatywne (zagęszczenie, zanieczyszczenie), wpływ na tempo wzrostu
- [DO ZROBIENIA] Zadowolenie / niezadowolenie (wpływ na produktywność i rebelie)

### Silnik walki — Wariant 1: Heks turowy
- [GOTOWE] Prototypowa walka (trafienie = Atak/(Atak+Obrona), jednostka ginie w jednej walce — uproszczenie v0.1)
- [DO ZROBIENIA] **Pełny model TW**: trafienie = 35% + (Atak−Obrona), klamrowane [10–90%]; Health jako punkty wytrzymałości; Morale → po spadku poniżej progu ucieczka
- [DO ZROBIENIA] **Uderzenie (szarża)** — bonus w 1. rundzie do Ataku i obrażeń; negowany przez Braced (włócznik, falanga)
- [DO ZROBIENIA] **Flanka −50 do Obrony** (falanga i włócznik wrażliwe, miecznik/legionista nie)
- [DO ZROBIENIA] Wielorundowa walka (iteracja rund aż do ucieczki lub śmierci)
- [DO ZROBIENIA] Walka miejska (bonusy obronne muru, bonusy atakującego przy oblężeniu)
- [DO ZROBIENIA] Galera i walki morskie (osobne zasady ruchu i walki na wodzie)

### Silnik walki — Wariant 2: RTS (Real-Time Strategy)
- [BRAK] Osobny widok bitwy — wejście w tryb RTS po zderzeniu jednostek na mapie strategicznej
- [BRAK] Mała mapa bitewna (heks lub dowolny teren), ruch w czasie rzeczywistym
- [BRAK] Sterowanie jednostkami w RTS (klik-to-move, attack-move)
- [BRAK] Fizyka walki wręcz i dystansowej w czasie rzeczywistym
- [BRAK] Przełącznik „wybierz wariant bitwy" przed rozpoczęciem starcia

### AI przeciwnika
- [GOTOWE] Barbarzyńcy (statyczni, brak ruchów — placeholder)
- [DO ZROBIENIA] Podstawowa AI: ruch ku najbliższemu celowi, atak przy zasięgu
- [DO ZROBIENIA] AI ekonomiczna: wybór co budować, jaką technologię badać
- [DO ZROBIENIA] AI strategiczna: ekspansja, obrona terytorium, dyplomacja
- [BRAK] Poziomy trudności

### Zapis / wczytywanie
- [BRAK] Serializacja stanu gry do JSON (localStorage lub plik)
- [BRAK] Wczytywanie zapisanego stanu
- [BRAK] Autozapis co N tur

---

## 3. FRONT-END / UI

### Render planszy (mapa heksowa)
- [GOTOWE] Canvas, heksy offset, typy terenu z kolorami, złoża jako ikony, miasta i jednostki, klik zaznaczenia
- [DO ZROBIENIA] Mgła wojny — hexe nieodkryte jako czarne, odkryte ale niewidoczne jako ciemne
- [DO ZROBIENIA] Animacje ruchu jednostek (płynne przesuwanie po mapie)
- [DO ZROBIENIA] Ikony terenu graficzne (zamiast kolorów blokowych) — opcjonalnie sprites
- [DO ZROBIENIA] Podświetlanie zasięgu ruchu (hexe osiągalne highlight)
- [DO ZROBIENIA] Podświetlanie terytorium każdego gracza (granice miast)
- [DO ZROBIENIA] Zoom i pan mapy (scroll + drag)
- [DO ZROBIENIA] Mini-mapa (overlay w rogu)
- [BRAK] Warstwa rzek jako osobna grafika na hexach

### Widok / „rzut" miasta
- [GOTOWE] Panel boczny z listą budynków, opcjami produkcji, statystykami plonów
- [DO ZROBIENIA] **Dedykowany ekran/modal „Widok Miasta"** — pełniejszy rzut z dzielnicami, budynkami, populacją, zdrowiem, bilansem
- [DO ZROBIENIA] Wizualizacja zasięgu/terytorium miasta na mapie
- [DO ZROBIENIA] Zarządzanie przydzielaniem ludności do pól (jak w Civ — klik kafla)

### Panele i HUD
- [GOTOWE] Panel jednostki (statystyki, akcje: załóż miasto, zakończ turę)
- [GOTOWE] Panel miasta (produkcja, budynki, plony)
- [GOTOWE] Log zdarzeń (tekstowy, ostatnie wpisy)
- [DO ZROBIENIA] **Panel „Bilans/turę"** — osobne okno z dochodem/wydatkami per zasób (Żywność, Praca, Handel, Nauka, Pieniądz) per miasto i globalnie
- [DO ZROBIENIA] **Panel drzewka technologii** — graficzne drzewo, klik wyboru, postęp badań
- [DO ZROBIENIA] **Panel rynku** — ceny surowców, kupno/sprzedaż (gdy odblokowany przez tech)
- [DO ZROBIENIA] Pasek zasobów globalnych u góry ekranu (persistent HUD)
- [DO ZROBIENIA] Powiadomienia turowe (popup lub ticker: „Miasto X urosło", „Odkryto Y")
- [DO ZROBIENIA] Panel dyplomacji (relacje z innymi cywilizacjami, oferty)

### Ekran bitwy
- [BRAK] **Ekran bitwy heks-turowy** — osobny widok, siatka heksów bitewnych, kolejka jednostek, akcje (ruch, atak, obrona, ucieczka)
- [BRAK] **Ekran bitwy RTS** — osobny widok czasu rzeczywistego, kontrola myszką
- [BRAK] Przełącznik wyboru wariantu przed bitwą
- [BRAK] Podsumowanie bitwy (straty, wynik, zdobyte zasoby)

### Menu i ekrany globalne
- [DO ZROBIENIA] **Ekran „Nowa gra"** — wybór cywilizacji, rozmiaru mapy, poziomu trudności, ziarna losowania
- [DO ZROBIENIA] **Ekran wyboru cywilizacji** — karty z opisami, bonusami, liderem
- [DO ZROBIENIA] Menu główne (Nowa gra, Wczytaj, Ustawienia, Wyjdź)
- [DO ZROBIENIA] Ekran zwycięstwa / przegranej z podsumowaniem
- [DO ZROBIENIA] Ekran ustawień (dźwięk — jeśli będzie, tryb pełnoekranowy, fps cap)

### Dyplomacja (UI)
- [BRAK] Panel dyplomacji — lista graczy, status relacji, przyciski akcji (propozycja pokoju, sojusz, handel, wypowiedzenie wojny)
- [BRAK] Okno negocjacji (wymiana surowców, terytoriów, technologii)

---

## 4. PLANSZA / MAPA

### Typy terenu i plony
- [GOTOWE] Typy terenu: Morze, Wybrzeże, Łąka, Równina, Las, Wzgórza, Góry, Pustynia
- [GOTOWE] Plony per teren w `Plony-terenow.xlsx`
- [DO ZROBIENIA] Modyfikator Rzeki — kafle sąsiadujące z rzeką: +1 Żywność lub +1 Handel, umożliwia irygację (Farma), penalty przy przeprawie w walce
- [DO ZROBIENIA] Złoża przypisane do właściwych typów terenu (reguły w generatorze: ruda→wzgórza/góry, glina→łąka/wybrzeże rzeki, konie→równiny/łąki, zboże→równiny)

### Generacja proceduralna
- [GOTOWE] Prosty generator pseudolosowy (mulberry32), podstawowe rozłożenie terenu
- [DO ZROBIENIA] Generator kontynentów (Voronoi lub perlin noise) — wyspy, kontynenty, przesmyki
- [DO ZROBIENIA] Generator rzek (od źródła na górach do morza)
- [DO ZROBIENIA] Balans startowy — każdy gracz zaczyna z porównywalnym dostępem do surowców
- [DO ZROBIENIA] Losowanie złóż z wagami per typ terenu

### Zasięg/terytorium miast
- [GOTOWE] Zasięg R=2 (radiusTiles), pracujące pola z sortowaniem po wartości
- [DO ZROBIENIA] Wizualne granice terytorium na mapie
- [DO ZROBIENIA] Rozszerzanie terytorium przez Kulturę lub zakup pola
- [DO ZROBIENIA] Konflikty graniczne (kafle sporne między bliskimi miastami)

### Mgła wojny
- [BRAK] Trzy stany kafla: nieodkryty / odkryty-niewidoczny / widoczny (w zasięgu jednostki lub miasta)
- [BRAK] Jednostki wroga widoczne tylko gdy w zasięgu widoczności
- [BRAK] Zasięg widoczności per typ jednostki (Zwiadowca > standard)

---

## 5. CYWILIZACJE — DO ZDEFINIOWANIA

> Stan: **całkowicie brak danych.** Poniżej propozycja struktury do wypełnienia.

### Struktura definicji cywilizacji (szablon)
Każda cywilizacja musi mieć:
- Nazwa + lider (imię, epoka, opis fabularny — 2–3 zdania)
- Bonus pasywny (np. +20% Handel na Wybrzeżu, +1 Nauka z Biblioteki)
- Unikalna jednostka (zastępuje standardową; inne statystyki lub zdolność specjalna)
- Unikalny budynek (zastępuje standardowy lub nowy; inne efekty)
- Warunki startowe (surowiec gwarantowany, typ terenu startowego, dodatkowa jednostka)
- Cecha specjalna (mechanika unikalna: np. Falanga Grecka — bonus Braced, Fenicja — +Handel na morzu)

### Proponowana lista cywilizacji (do zatwierdzenia)
- [BRAK] **Grecy** — falanga (braced bonus), bonus Nauki; lider np. Perykles
- [BRAK] **Egipcjanie** — bonus przy Rzece (irygacja bezpłatna), Piramidy jako cudów świata; Ramzes
- [BRAK] **Fenicjanie** — bonus Handlu morskiego, Galera tańsza; Dydona
- [BRAK] **Rzymianie** — bonus produkcji (drogi); Legionista (zamiast Wojownika z Brązu, nie wrażliwy na flankę)
- [BRAK] **Celtowie/Słowianie** — bonus Lasu (+Praca), tańszy Tartak; lider lokalny
- [BRAK] **Mongołowie/Koczownicy** — bonus koni (Konnica tańsza, szybsza), trudni do oblężenia
- [BRAK] **Chińczycy** — bonus Nauki, Wielki Mur jako cudów; Sun Tzu
- [BRAK] **Sumerowie** — bonus Nauki/Pisma, Matematyka tańsza; Hamurabi

### Mechanika cywilizacji (do zaimplementowania)
- [BRAK] System wyboru cywilizacji w „Nowa gra"
- [BRAK] Zastosowanie bonusów pasywnych w silniku (override na statystyki)
- [BRAK] Spawn unikalnych jednostek/budynków zamiast standardowych

---

## 6. MECHANIKI DO DOPIĘCIA

### Gospodarka ilościowa + popyt/podaż
- [DO ZROBIENIA] Magazyny lokalne (pojemność zależna od budynków, Spichlerz = żywność, Magazyn = surowce)
- [DO ZROBIENIA] Nadwyżka przepada jeśli brak miejsca w magazynie
- [DO ZROBIENIA] Przenoszenie surowców między miastami (drogi, karawany — koszt lub czas)
- [BRAK] Rynek globalny z cenami zmiennymi (popyt/podaż między graczami)
- [BRAK] Rynek AI (komputer kupuje/sprzedaje surowce)

### Magazynowanie
- [DO ZROBIENIA] Spichlerz: zwiększa pojemność żywności + przyspiesza wzrost (częściowo w v0.1)
- [DO ZROBIENIA] Magazyn: pojemność surowców przemysłowych (drewno, kamień, ruda, brąz)
- [DO ZROBIENIA] Skarbiec (centralny): Pieniądz w stolicy, transfery między miastami

### Walka — pełny model
- [DO ZROBIENIA] Health (punkty wytrzymałości), obrażenia per runda
- [DO ZROBIENIA] Morale — pasek, ucieczka poniżej progu, powrót po odpoczynku
- [DO ZROBIENIA] Uderzenie/szarża — działanie tylko w 1. rundzie, negacja przez Braced
- [DO ZROBIENIA] Flanka −50 do Obrony (geometria na siatce heksów — atak z boku/tyłu)
- [DO ZROBIENIA] Odpoczynek/regeneracja (jednostka nieaktywna = +X Health/Morale/turę)
- [BRAK] Oblężenia (czas trwania, machiny oblężnicze jako osobne jednostki/technologia)

### Hodowla (Pastwisko)
- [DO ZROBIENIA] Pastwisko jako usprawnienie terenu (Robotnik buduje, wymaga tech Pasterstwo)
- [DO ZROBIENIA] Zarodek: min. 1 sztuka bydła/owiec z terenu lub handlu
- [DO ZROBIENIA] Automatyczna produkcja co turę (bydło→+Praca, owce→+Żywność), ograniczona pojemnością
- [DO ZROBIENIA] Koń jako zasób strategiczny (wymóg dla Konnicy)

### Przejścia walut (fiat/energia w późnych epokach)
- [BRAK] Pieniądz fiducjarny ×100 — warunek odblokowania (tech Bankowość lub equiv.)
- [BRAK] Energia ×1000 — warunek odblokowania (tech Elektryczność lub equiv.)
- [BRAK] UI odzwierciedlający aktualną skalę (inne oznaczenie/kolor waluty per epoka)
- [BRAK] Wpływ przejść na balans (inflacja, stare budynki z przestarzałą ekonomią)

### Warunki zwycięstwa
- [BRAK] Dominacja militarna (podbij wszystkich graczy lub ich stolice)
- [BRAK] Zwycięstwo naukowe (osiągnij tech X jako pierwszy)
- [BRAK] Zwycięstwo kulturowe / dyplomatyczne (opcjonalne)
- [BRAK] Ekran zwycięstwa z podsumowaniem statystyk
- [BRAK] Wymagania startowe (wybór wariantu w „Nowa gra")

---

## 7. KLUCZOWE LUKI + SUGEROWANA KOLEJNOŚĆ PRAC (KAMIENIE MILOWE)

### Kluczowe luki (blokujące grywalność)
1. Brak silnika walki z Health/Morale — aktualna walka to jeden rzut kostką
2. Brak ekonomii ilościowej (magazyny, przepustowość) — Praca/Pieniądz/Handel są zsumowane, ale nie magazynowane
3. Brak mgły wojny — gra niebudująca napięcia eksploracji
4. Brak AI — gracz gra solo bez przeciwnika
5. Brak cywilizacji — nie ma żadnych wyróżników
6. Brak ekranu bitwy (oba warianty)
7. Brak zapisu/wczytywania — każda sesja od zera
8. Brak warunków zwycięstwa — gra nie ma końca

### KAMIENIE MILOWE — kolejność prac

#### Kamień Milowy 0 — Dane (tydzień 1)
- Uzupełnić `Technologie-drzewko.xlsx` o epoki Żelazo + dwie kolejne
- Zdefiniować 4–5 cywilizacji (szablon z sekcji 5, tylko Kamień+Brąz)
- Zatwierdzić balans kosztów jednostek (stat Uderzenie — wartości liczbowe)
- Zdefiniować warunki zwycięstwa (wybrać 2 z 3 opcji)

#### Kamień Milowy 1 — Ekonomia ilościowa v0.2 (tydzień 1–2)
- Magazyny lokalne z pojemnością; Spichlerz i Magazyn jako limity
- Przepustowość produkcji przetworzonych (wejście/wyjście 1:1, auto z pauzą)
- Pełne Praca/Handel/Pieniądz per turę z saldem wizualnym (panel Bilans/turę)
- Utrzymanie jednostek w Pieniądzu/turę
- Centralny skarbiec w stolicy

#### Kamień Milowy 2 — Mapa i eksploracja (tydzień 2–3)
- Mgła wojny (3 stany kafla)
- Rzeki jako obiekty mapy (reguła generatora + modyfikator plonów)
- Lepszy generator (kontynenty, złoża per typ terenu)
- Zasięg widoczności per jednostka

#### Kamień Milowy 3 — Pełna walka heks-turowa (tydzień 3–4)
- Health + Morale + wielorundowe walki
- Uderzenie/szarża w 1. rundzie + negacja Braced
- Flanka −50 (detekcja geometrii ataku)
- Morale → ucieczka
- Oblężenie miast (bonus obrony muru)

#### Kamień Milowy 4 — Cywilizacje + nowa gra (tydzień 4–5)
- Ekran wyboru cywilizacji z kartami
- Zastosowanie bonusów pasywnych i unikalnych jednostek/budynków
- Podstawowa AI (ruch, atak, budowa, badania)

#### Kamień Milowy 5 — Kompletny UI (tydzień 5–6)
- Panel drzewka technologii (graficzne drzewo, wybór gracza)
- Widok Miasta (pełny modal)
- Panel Bilans/turę ze szczegółami
- Pasek zasobów globalnych (persistent HUD)
- Powiadomienia turowe

#### Kamień Milowy 6 — Warunki zwycięstwa + zapis (tydzień 6–7)
- Warunki zwycięstwa (dominacja militarna + naukowe minimum)
- Zapis/wczytywanie przez localStorage
- Ekran zwycięstwa/przegranej

#### Kamień Milowy 7 — Wariant RTS (tydzień 7+, opcjonalny)
- Osobny widok bitwy RTS (mała mapa, czas rzeczywisty)
- Przełącznik „turowy / RTS" przed bitwą
- Fizyka walki RTS

#### Kamień Milowy 8 — Dopracowanie i kolejne epoki
- Epoki: Żelazo, Starożytność, Średniowiecze — drzewko, budynki, jednostki
- Przejście walutowe fiducjarne ×100 i Energia ×1000
- Dyplomacja (propozycje pokoju, sojusze, handel surowcami)
- Balansowanie na podstawie testów

---

> **Nota końcowa:** Niniejszy dokument ma pozwolić każdemu — w tym developerowi przystępującemu do projektu od zera — zrozumieć stan gry, zidentyfikować luki i zbudować produkt w profesjonalny, sekwencyjny sposób. Każdy Kamień Milowy jest niezależnie testowalny i dostarcza wartość grywalną. Zaczynamy od danych i ekonomii (fundament), przez mapę i walkę (core loop), aż do cywilizacji, AI i ekranów (pełna gra).

