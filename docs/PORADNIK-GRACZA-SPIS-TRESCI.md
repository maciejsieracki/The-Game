# Poradnik gracza + Encyklopedia (Wiki) — spis treści (propozycja v1.0)

> **Status:** 🟢 **TREŚĆ rev. D** (2026-07-03) — spis rev. C + **22 rozdziały** + **121 haseł Wiki** w [`PORADNIK-GRACZA/`](PORADNIK-GRACZA/) · handoff: [`HANDOFF-rev-D-2026-07-03.md`](PORADNIK-GRACZA/HANDOFF-rev-D-2026-07-03.md)  
> **Cel podwójny:**  
> 1. **Poradnik** — narracyjny, od A do Z (jak podręcznik gracza).  
> 2. **Encyklopedia (Wiki)** — hasła, opisy, tooltipy — **ten sam materiał źródłowy**, inny format.  
> **Po akceptacji:** każdy temat = wersja **Wiki** (krótka) + wersja **Poradnik** (pełna) + wzory w apendyksie.  
> **Zasada:** wiążące są **ostatnie** ustalenia (`docs/decyzje/`, `REJESTR-DECYZJI.md`, `_meta` w JSON).  
> **Oznaczenia:** ✅ v1 wdrożone · 🟡 w trakcie · 📋 kanon/częściowy kod · 🔮 v2.0

### Zasady języka (obowiązkowe)

- **Tekst dla gracza** — pełne nazwy: *szczęście*, *porządek*, *bogactwo*, *pasek zasobów*, *przycisk Wykonaj*. Bez skrótów typu SzPct, PorPct, PN, HUD w tytułach i opisach Wiki.
- **Skróty techniczne** — tylko w apendyksach (wzory, mapowanie na JSON/Excel), z tłumaczeniem na język gracza.
- **Bez sloganów informatycznych** — zamiast „overlay”, „flow”, „bramka UX”: *co widzisz na ekranie*, *co musisz zrobić*, *dlaczego przycisk jest zablokowany*.
- **Miasto = dwa filary** w poradniku: (A) ludność i stabilność · (B) budowa, plony, rekrutacja. Osobno: **pasek zasobów i ekran mapy**.

### Mapa trzech filarów (rev. C)

| Filar | Część poradnika | O czym |
|-------|-----------------|--------|
| **Pasek zasobów i ekran** | **III** | Co widzisz u góry i u dołu mapy, Wykonaj, minimapa, siła państwa, zapasy Spichlerza |
| **Miasto — społeczeństwo** | **VI** | Ludność, zdrowie, szczęście, porządek, bunt, bogactwo, suwaki podatku, kultura, auto-zarządca |
| **Miasto — budowa i wojsko** | **VII** | Plony, okolica, budynki, kolejka produkcji, rekrutacja, garnizon |

---

## Warstwa Wiki — jak to będzie działać

Jeden **kanon treści** → trzy **długości** (kopiowalne do gry, strony, help):

| Warstwa | Długość | Gdzie trafi | Przykład |
|---------|---------|-------------|----------|
| **Wiki‑S** | 1–3 zdania | tooltip w grze, ikona `(?)`, lista w panelu | „Spichlerz: kumuluje zapasy państwa X/Y; bez niego bufor wzrostu zeruje się po awansie." |
| **Wiki‑M** | 1 ekran (~150–300 słów) | panel pomocy, karta w encyklopedii in‑game | Hasło **Spichlerz** — co robi, kiedy budować, trade‑off |
| **Poradnik‑L** | pełny rozdział | poradnik, know‑how zespołu | Część VI §35 — szczęście, przykłady, decyzje |

**Struktura plików (docelowa):**

```
docs/PORADNIK-GRACZA/          ← rozdziały narracyjne (Części 0–XVII)
docs/encyklopedia/             ← hasła Wiki (jeden plik = jedno hasło)
  _SZABLON-HASLO.md            ← Wiki-S + Wiki-M + link do rozdziału
  indeks.md                    ← spis haseł A–Z + kategorie
```

Każde **hasło** w encyklopedii ma pola: `id`, `tytuł`, `kategoria`, `wiki_s`, `wiki_m`, `poradnik_ref`, `decyzja_ref`, `status_v1`.

---

## Indeks haseł encyklopedii (propozycja — ~120+ wpisów)

Hasła powstają **z rozdziałów poradnika** — poniżej mapa kategorii (pełna lista A–Z dopisana przy pisaniu).

### Kategoria: Pasek zasobów i ekran mapy
Żywność · Złoto · Praca · Badania · Bogactwo · Ludność · Przyrost na turę · Epoka · Osiedla · Koniec tury · Wykonaj · Minimapa · Siła państwa · Zapasy państwa (Spichlerz) · Cuda · Budowa na mapie

### Kategoria: Zasoby imperium (ekonomia ogólna)
Skarbiec · Utrzymanie · Żywność wojska · Nauka imperium · Surowiec · Handel · Punty wartości handlowej

### Kategoria: Miasto — ludność i stabilność
Populacja · Wzrost ludności · Zdrowie · Szczęście · Porządek · Prawo · Bunt · Bogactwo · Suwak handlu · Suwak pracy · Suwak żywności · Trzy grupy mieszkańców · Kultura w mieście · Religia w mieście · Auto-zarządca · Spichlerz (wpływ na miasto)

### Kategoria: Miasto — budowa, plony i wojsko
Zakładka Plony · Zakładka Okolica · Zakładka Produkcja · Budynek · Kolejka budowy · Przyspieszenie za złoto · Rekrutacja · Garnizon · Osiedle

### Kategoria: Mapa i teren
Heks · Terytorium · Mgła wojny · Typ terenu · Złoże · Ulepszenie terenu · Farma · Irygacja · Tartak · Posterunek (Strażnica) · Fort · Droga · Łódź rybacka · Wyrąb · Gęstość świata

### Kategoria: Jednostki i walka
Jednostka · Moc jednostki (M) · Ruch · Garnizon · Posiłki · Armia · Counter · Auto‑walka · Bitwa ręczna · preBattle · Teren bojowy · Katapulta · Oblężenie · Milicja · Machina oblężnicza · Fan‑out (pierścień)

### Kategoria: Dyplomacja
Relacja · Zaufanie · Respekt · Audiencja · Handel · Pakt o nieagresji · Sojusz · Prezent · Trybut · Ultimatum · Wojna · Przemarsz · Miasto‑państwo

### Kategoria: Cywilizacje i meta
Cywilizacja (typ) · Bonus cywilizacji · Klaster · Epoka · Technologia · Drzewko nauki · Barbarzyńca · AI · Trudność · Tempo gry

### Kategoria: Kultura, religia, cuda
Kultura · Religia · Zasięg kultury · Cud świata · Cud wyłączny (E) · Cud wyścigowy (R) · Absolut · Ruina cudu · Turystyka (+10 handlu)

### Kategoria: Zwycięstwo
Dominacja · Zwycięstwo naukowe · Porażka · Moc imperium (Power)

### Kategoria: Menu i pomoc
Panel miasta · Warstwa kultury na mapie · Kreator nowej gry · Zapis gry · Skróty klawiaturowe

*(Pełny alfabet haseł — plik `docs/encyklopedia/indeks.md` przy pierwszej paczce pisania.)*

---

## Część 0 — Jak czytać ten poradnik

**0.1.** Co to za gra (filozofia 4X, pętla tury)
- Czym jest gra turowa na mapie heksów
- Jedna tura gracza: ruchy → decyzje → Koniec tury → tura przeciwników
- Cel: rozwijać cywilizację, wygrywać dominacją lub nauką

**0.2.** Symbole w grze (¤ złoto, ikony zasobów)
- ¤ = złoto / skarbiec państwa
- Ikony żywności, pracy, badań, bogactwa, ludności, kultury
- Kolory alertów: informacja vs „musisz coś zrobić"

**0.3.** Co jest w wersji 1.0, a co dopiero planowane
- Lista mechanik działających dziś (miasto, walka, dyplomacja, cuda…)
- Co oznaczają znaczniki 🔮 w spisie (przyszłe wersje)
- Kampania i multiplayer — „Wkrótce"

**0.4.** Skąd biorą się liczby (dla ciekawych)
- Tabele balansu w Excelu → pliki danych gry
- Gdzie w poradniku są wzory (apendyks C)
- Że liczby mogą się zmienić po balansie — wiążą decyzje w `docs/decyzje/`

**0.5.** Poradnik vs Wiki — trzy długości tekstu
- Wiki‑S: tooltip, 1–3 zdania
- Wiki‑M: jeden ekran pomocy
- Poradnik‑L: pełny rozdział z przykładami
- Jeden kanon — te same fakty, inna długość

**0.6.** Słownik gracza vs apendyks techniczny
- Rozdziały 0–XVII: język zrozumiały dla gracza
- Apendyks A: słownik pojęć
- Apendyks C: wzory z tłumaczeniem skrótów technicznych

---

## Część I — Pierwsze kroki

### 1. Menu i nawigacja

**1.1.** Ekran główny (Rozpocznij, Kontynuuj, Wczytaj, Ustawienia)
- Przycisk **Rozpocznij** — nowa gra przez kreator (5 kroków)
- **Kontynuuj** — ostatni zapis automatyczny (jeśli istnieje)
- **Wczytaj** — lista zapisów ręcznych z datą i nazwą państwa
- **Ustawienia** — dźwięk, muzyka, język (jeśli dostępny), rozdzielczość

**1.2.** Co jest „Wkrótce" (Kampania, Multiplayer)
- **Kampania** — scenariusze fabularne; w wersji 1.0 niedostępna
- **Multiplayer** — gra wieloosobowa; w wersji 1.0 niedostępna
- Przyciski wyszarzone lub z etykietą „Wkrótce" — nie klikalne
- Tryb standardowy: wolna gra na mapie (sandbox 4X)

**1.3.** Zapisywanie i wczytywanie gry
- Zapis ręczny z menu w trakcie gry (jeśli w dolnej belce)
- Szybki zapis przed bitwą ręczną (preBattle) — opcjonalny
- Wczytanie nadpisuje bieżącą sesję — potwierdzenie przed akcją
- Stare zapisy mogą wymagać migracji po aktualizacji gry

---

### 2. Kreator nowej gry (5 kroków)

**2.1.** Intro / wideo
- Krótkie wprowadzenie fabularne lub animacja startowa
- Możliwość pominięcia (klik / Escape — jeśli w grze)
- Przejście do wyboru epoki i cywilizacji

**2.2.** **Epoka startowa** (Kamień, Brąz; Żelazo — status)
- **Kamień** — najwcześniejsze technologie i jednostki
- **Brąz** — start z częścią badań już ukończonych (kaskada — §6.1)
- **Żelazo** — status wdrożenia w v1.0 (sprawdź w grze)
- Epoka wpływa na jednostki, budynki i koszty badań na starcie

**2.3.** **Wybór cywilizacji** (9 typów v1, medaliony, epoki per cyw.)
- Dziewięć aktywnych typów: Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie
- Medalion z herbem i krótkim opisem bonusów
- Nie każda cywilizacja startuje w tej samej epoce (np. Inkowie — Część XIII §83)
- Bonusy: walka, miasto, ekonomia, mapa — szczegóły w Części XIII

**2.4.** **Ustawienia świata:** trudność · rozmiar mapy · typ świata · tempo gry · gęstość świata · miasta-państwa w klastrze · liczba typów rywali
- **Trudność** — Łatwy / Normalny / Trudny (§5)
- **Rozmiar mapy** — Mała / Standardowa / Duża (liczba heksów)
- **Typ świata** — Kontynenty, Pangea, Wyspy, Ziemia (Część II §7.2)
- **Tempo gry** — Szybka / Standard / Długa (mnożnik kosztów badań — §6.3)
- **Gęstość świata** — Mało / Średnio / Dużo zasobów i dekoracji
- **Miasta-państwa w klastrze** — ile kopii tego samego typu obok ciebie (§4.2)
- **Liczba typów rywali** — ile różnych cywilizacji AI na mapie

**2.5.** Podgląd startu i przycisk Start
- Podsumowanie: cywilizacja, epoka, ustawienia świata
- Ostatnia szansa na cofnięcie do poprzedniego kroku
- **Start** — generacja mapy i wejście w pierwszą turę

**2.6.** Defaulty szybkiej gry (Rzym, Kamień, Normal, Standard…)
- Profil „szybki start" dla nowych graczy
- Rzym · epoka Kamienia · trudność Normalna · mapa Standard · tempo Standard
- Można zmienić każdy parametr przed Start

---

### 3. Start na mapie — pierwsze minuty

**3.1.** Auto-założenie pierwszego miasta (bez osadnika)
- Nie musisz budować osadnika ani szukać miejsca na pierwsze miasto
- Stolica pojawia się automatycznie na wylosowanym heksie startowym
- Od razu masz panel miasta i terytorium wokół

**3.2.** Hex pod miastem (brak ulepszeń startowych na centrum)
- Centrum miasta zajmuje heks — nie stawiasz tam farmy ani tartaku
- Pola do pracy zaczynają się w **okolicy** (promień 3 heksów — Część VII §44)
- Planuj ulepszenia na sąsiednich polach, nie pod samym miastem

**3.3.** Bonus **Osiedle** dla małego miasta (pop 1–4)
- Małe miasto (1–4 mieszkańców) dostaje bonus startowy
- Wpływ na szczęście i plony — zależnie od trudności (§5.2, Część VI §33.4)
- Bonus znika, gdy miasto urośnie powyżej progu osiedla

**3.4.** Mgła wojny na starcie (rzeki ukryte)
- Widzisz tylko heksy w zasięgu wzroku startowych jednostek
- Rzeki i wybrzeża mogą być ukryte — odkrywasz je ruchem wojska
- Minimapa pokazuje mgłę — ciemne = niewidziane (Część II §8)

---

### 4. Świat polityczny — klastry i miasta-państwa

**4.1.** Model: typ cywilizacji → klaster kopii (Sparta, Kapua…)
- Wybierasz np. **Grecy** — na mapie są też inne miasta greckie (Sparta, Teby…)
- To kopie tego samego **typu** cywilizacji, nie losowe nacje
- Każdy klaster ma własne nazwy miast z danych gry

**4.2.** **Miasta-państwa** = liczba rywali w klastrze (ustawienie kreatora)
- Suwak w kreatorze: ile sąsiadów tego samego typu obok ciebie
- Zero = tylko ty reprezentujesz ten typ na mapie (rzadkie)
- Więcej = więcej celów do dyplomacji i podboju w regionie startowym

**4.3.** Rywale tego samego typu: defensywni, bez ekspansji — do zdobycia
- Miasta-państwa **nie budują** nowych miast poza swoim terytorium
- Bronią się, handlują, walczą — ale nie ekspandują jak główna AI
- Zdobycie: wojna, ultimatum, dyplomacja — Część XII

**4.4.** Nazwy miast w klastrze (co widzi gracz na liście dyplomatów)
- W panelu dyplomacji każdy wpis to **jedno miasto** z własną nazwą
- Np. „Sparta" i „Kapua" — osobne relacje, osobne wojny
- Spotkanie = odkrycie w mgle lub granica terytoriów

---

### 5. Trudność gry

**5.1.** Trzy poziomy: Łatwy / Normalny / Trudny
- **Łatwy** — wolniejsza AI, łagodniejsze kary ekonomiczne, bonusy dla gracza
- **Normalny** — profil referencyjny balansu v1.0
- **Trudny** — silniejsza AI, ostrzejsze progi buntu, mniej tolerancji na błędy

**5.2.** Co zmienia trudność (wzrost ludności, Spichlerz, żywność wojska, osiedle, progi buntu, immunitet bogactwa, bonusy AI)
- Próg **wzrostu ludności** — wyższy na Trudnym
- **Spichlerz** — pojemność i efekty magazynu (Część VI §39)
- **Żywność wojska** — zużycie i kary głodu
- Bonus **Osiedle** — siła na Łatwym vs słabszy na Trudnym
- **Progi buntu** — kiedy zaczyna się niepokój (Część VI §36)
- **Bogactwo** — immunitet / modyfikatory na wyższej trudności
- **Bonusy AI** — produkcja, nauka, jednostki startowe (Część XIV §82)

**5.3.** Pakiet balansu start × trudność (D18)
- Startowa paczka zasobów i jednostek zależy od **obu**: epoki i trudności
- Pełna tabela w apendyksie B.3
- Wybór trudności w kreatorze — nie da się zmienić w trakcie gry (v1.0)

---

### 6. Epoka startowa a technologie

**6.1.** Reguła kaskady (start Brąz → tech Kamienia zbadane)
- Start w **Brązie** = wszystkie technologie epoki Kamienia już **zbadane**
- Nie musisz ich ponownie odkrywać — od razu budujesz i rekrutujesz z Brązu
- Analogicznie: start w Żelazie (gdy dostępny) — Kamień + Brąz zbadane

**6.2.** Jednostki tylko przez odblokowane tech (nie starter-pack)
- Na starcie **nie** dostajesz pełnego zestawu wojska „na zapas"
- Każda jednostka wymaga odpowiedniej technologii w drzewku (Część IX)
- Wyjątki: jednostki startowe z pakietu balansu epoki (ograniczona lista)

**6.3.** Tempo gry a koszty badań (Szybka ×0,2 · Standard ×1 · Długa ×5)
- **Szybka** — badania tańsze (×0,2 kosztu), gra kończy się szybciej
- **Standard** — bazowy mnożnik ×1
- **Długa** — badania droższe (×5), więcej tur na epokę
- Tempo ustawiasz w kreatorze — wpływa na całą partię

---

## Część II — Mapa świata

### 7. Układ mapy i generator

**7.1.** Heksagon, kamera, orientacja
- Świat zbudowany z **heksów** (sześciokątów) — standardowa mapa 4X
- Kamera: przesuwanie (przeciągnięcie / krawędzie), zoom (kółko myszy)
- Północ zwykle u góry ekranu — jednostki i miasta stoją **na** heksie, nie między

**7.2.** Typy świata: Kontynenty, Pangea, Wyspy, Ziemia
- **Kontynenty** — kilka dużych lądów, morze między nimi
- **Pangea** — jeden superkontynent, mniej izolacji
- **Wyspy** — archipelag, dużo morza i wybrzeży
- **Ziemia** — układ inspirowany kontynentami Ziemi (proporcje uproszczone)

**7.3.** Gęstość świata (Mało / Średnio / Dużo) — wpływ na złoża i dekor
- **Mało** — rzadsze złoża i dekoracje krajobrazu, więcej pustych pól
- **Średnio** — profil domyślny
- **Dużo** — więcej złóż i wizualnych detali; mapa „bogatsza" wizualnie
- Ustawienie w kreatorze — nie zmienia się w trakcie gry

**7.4.** Typy terenu i plony bazowe (pola, lasy, góry, pustynie, morze…)
- Każdy heks ma **typ terenu** — decyduje o plonach i koszcie ruchu
- Łąka, las, wzgórze, góra, pustynia, rzeka, morze — różne role
- Tabela plonów bazowych — apendyks B.7; szczegóły okolicy w Części VII §43

---

### 8. Mgła wojny i widoczność

**8.1.** Zasięg wzroku jednostki (domyślnie 3; Zwiadowca min. 5)
- Większość jednostek widzi **3 heksy** wokół siebie
- **Zwiadowca** — minimum **5 heksów** (dłuższy zasięg odkrywania)
- Wzrok liczy się od pozycji jednostki na koniec ruchu

**8.2.** Zasięg mgły = Ruch jednostki
- Heksy **poza** zasięgiem wzroku są w mgle — ciemne lub ukryte
- Ruch jednostki **odkrywa** nowe heksy na swojej drodze
- Raz odkryte heksy zwykle zostają widoczne (bez jednostki wroga — szczegóły v1)

**8.3.** Terytorium miasta a widoczność
- Heksy w **twoim terytorium** mogą być widoczne nawet bez jednostki (zasięg miasta)
- Terytorium wroga odkrywasz przez zbliżenie wojska lub dyplomację
- Granica terytoriów — ważna dla ruchu i budowy (§9)

**8.4.** Minimapa a mgła
- Minimapa pokazuje mgłę — niewidziane obszary przyciemnione
- Odkryty teren — uproszczony kolor (ląd / morze / terytorium)
- Klik na minimapę — skok kamery (Część III §18)

---

### 9. Terytorium

**9.1.** Zasięg miasta (10 heksów) · posterunek (5) · fort (10)
- **Miasto** — rośczenie do ok. **10 heksów** wokół centrum (model v1)
- **Posterunek (Strażnica)** — mniejszy zasięg, ok. **5 heksów**
- **Fort** — większy zasięg, ok. **10 heksów** jak miasto
- Tylko **twój** terytorium — budowa i plony z twoich pól

**9.2.** Zakładanie kolejnego miasta (Strażnica LUB zasięg istniejącego miasta)
- Nowe miasto: heks w zasięgu **istniejącego miasta** albo po wybudowaniu **Strażnicy**
- Nie możesz założyć miasta na obcym terytorium ani w mgle (bez odkrycia)
- Drugie miasto — nowy panel, nowa okolica, wspólny skarbiec imperium

**9.3.** Kto „posiada" hex i skąd idą plony
- Właściciel heksu = państwo, którego terytorium go obejmuje
- **Plony** z pola trafiają do miasta, które **pracuje** na tym heksie (okolica — Część VII §44)
- Zmiana właściciela po wojnie — pola mogą przejść pod nowe miasto

---

### 10. Warstwy i nakładka informacji na mapie

**10.1.** Przełącznik zasięgu **kultury** i **religii** (ikony przy minimapie)
- Ikona **kultury** (🎭) — włącza / wyłącza warstwę zasięgu kultury
- Ikona **religii** — osobny przełącznik dla zasięgu religii
- Oba niezależne — możesz widzieć jedno, drugie lub oba

**10.2.** Co pokazuje nakładka (lista miast, progi, presja)
- Lista miast z procentem **własnej** vs **obcej** kultury / religii
- Progi presji — które miasta są zagrożone obcą dominacją
- Skrót do panelu miasta — klik na wpis (jeśli w UI)

**10.3.** Czego **nie ma** w v1.0 (kolor zasięgu na mapie 3D)
- **Brak** kolorowego „dywanu" kultury na heksach mapy 3D
- Informacja w **panelu nakładki** i w panelu miasta — nie na terenie 3D
- 🔮 Przyszłe wersje mogą dodać wizualizację na mapie

---

### 11. Złoża surowców

**11.1.** Złoże rezerwuje hex — brak ulepszenia gracza na złożu
- Heks ze **złożem** (miedź, żelazo…) nie przyjmuje farmy ani tartaku
- Złoże widoczne na mapie jako osobny obiekt / ikona
- Dostęp do surowca — przez technologię lub specjalne ulepszenie (§11.3)

**11.2.** Ukrywanie złóż do epoki (miedź→Brąz, żelazo→Żelazo; tylko Góry)
- **Miedź** — widoczna od epoki **Brązu** (na górach)
- **Żelazo** — od epoki **Żelaza**
- Złoża tylko na terenie **górskim** — nie na równinach

**11.3.** Model dostępu v0.1 (tech LUB ulepszenie — bez magazynów)
- W v1.0: odblokowanie **technologią** lub **ulepszeniem** = dostęp tak/nie
- **Brak** magazynów surowców i zużycia w produkcji (pełny model — 🔮 v2.0)
- Gracz widzi w UI, co jest dostępne — szczegóły Część VIII §53

**11.4.** 🔮 v2.0: pełna produkcja i magazynowanie surowców
- Przyszłość: zbieranie, magazyn, koszty w budowie i rekrutacji
- v1.0 — katalog i flaga dostępu; nie blokuj się na surowcach w poradniku v1

---

### 12. Wygląd miast na mapie

**12.1.** 10 poziomów miasta × cywilizacja × wariant z murem/bez
- Wielkość wizualna rośnie z **poziomem / populacją** miasta (do 10 stopni)
- Model zależy od **cywilizacji** — Rzym inaczej niż Egipt
- Wariant **z murem** i **bez muru** — osobne modele 3D

**12.2.** Cywilizacje BRAZU v1 (sign-off: Sumer, Egipt, Inkowie, Zulusi…)
- Pełne modele miast epoki Brązu dla wybranych cywilizacji
- Lista sign-off w dokumentacji zespołu — reszta może mieć placeholder
- Sprawdź w grze: czy twoja cywilizacja ma dedykowany model

**12.3.** Mury (styl Roblox ~70% HEX)
- Mur otacza miasto na mapie — sygnał dla oblężenia (Część XI)
- Styl wizualny uproszczony (wysokość ~70% heksa)
- Miasto bez muru — łatwiejsze do zdobycia szturmem

**12.4.** Obóz oblężniczy 3D (status wdrożenia)
- Podczas oblężenia może pojawić się obóz wokół murów
- Status wdrożenia w v1.0 — sprawdź w buildzie roboczym
- Nie mylić z **obozem łowieckim** (ulepszenie pola — Część V)

---

### 13. Ruch po mapie

**13.1.** Koszty terenu (ląd, las, wzgórze, rzeka, morze)
- Każdy typ terenu zużywa inną liczbę **punktów ruchu** jednostki
- Las i wzgórze — drożej; droga — taniej (po wybudowaniu — Część V §31)
- Rzeka — przeprawa lub most (status mostów v1)

**13.2.** Łodzie rybackie — tylko w terytorium miasta (wybrzeże + morze)
- **Łódź rybacka** jako ulepszenie — tylko na wybrzeżu w **twoim** terytorium
- Jednostki morskie / transport — zasięg morza przy wybrzeżu miasta
- Poza terytorium — morze niedostępne dla budowy łodzi (v1)

**13.3.** Zaokrętowanie / transport morski (status v1)
- Mechanika **zaokrętowania** wojska na morze — status wdrożenia v1.0
- Jeśli brak: wojsko lądowe nie pływa; planuj mosty i wybrzeża
- 🔮 v2.0 — pełny transport morski (apendyks E.4)

**13.4.** Priorytet kliknięcia: jednostka vs miasto vs ulepszenie
- Klik na heks z **jednostką** — zaznaczenie wojska (karta jednostki — Część IV §22)
- Klik na **miasto** — panel miasta
- Klik na **ulepszenie terenu** — informacja / tryb budowy (Część V)
- Gdy kilka obiektów — gra wybiera według priorytetu (jednostka często pierwsza)

---

## Część III — Pasek zasobów i ekran mapy

*Cała część w języku gracza — bez skrótów i żargonu programistycznego.*

### 14. Pasek zasobów u góry ekranu — lewa strona

**14.1.** **Żywność**
- Co oznacza **liczba główna** (zapasy państwa lub suma — zależnie od Spichlerza)
- Przyrost **+X na turę** — skąd się bierze (miasta, pola, suwaki)
- Co się dzieje przy **braku** żywności (głód wojska, wolniejszy wzrost)
- Kliknięcie — czy coś otwiera (v1: zwykle brak — szczegóły w panelu miasta)

**14.2.** **Złoto**
- Skarbiec państwa — aktualna kwota
- Przyrost co turę: podatki, handel, kary, utrzymanie (netto)
- Tooltip: rozbicie dochodów i kosztów (jeśli w UI)
- Różnica: złoto vs **bogactwo** (luksus — osobny wiersz)

**14.3.** **Praca**
- Pula pracy imperium — na budynki i ulepszenia
- Przyrost z miast i pól
- Na co idzie: kolejki produkcji w miastach, budowa na mapie
- Tooltip: które miasto ile zużywa (jeśli dostępne)

**14.4.** **Badania**
- Tempo badań **+X na turę** (punkty nauki)
- Nazwa **aktualnie badanej** technologii
- Pasek postępu **%** do ukończenia
- **Klik** → otwiera drzewko technologii (Część IX)

**14.5.** **Bogactwo**
- Luksus państwa — **nie** to samo co złoto
- Wartość + przyrost na turę
- Skąd wpływa: suwak handlu w miastach (luksus %)
- Tooltip → szczegóły w panelu miasta (§37)

**14.6.** **Ludność**
- Suma mieszkańców **wszystkich** miast
- Przyrost **+X na turę** (awansy po buforze)
- Nie mylić z limitem jednego miasta
- Tooltip: rozkład po miastach (jeśli w UI)

**14.7.** **Kultura** (w tej samej kolumnie zasobów)
- Suma kultury imperium + przyrost na turę
- Brak osobnego zasobu „Idei"
- Tooltip → warstwa kultury na mapie (§18 overlay) lub panel miasta

**14.8.** Przyrost **„+X na turę"** — zasady ogólne
- Netto po kosztach utrzymania (złoto, wojsko)
- Co aktualizuje się **po** końcu tury vs w trakcie
- Kolory: dodatni / ujemny / zero

---

### 15. Pasek zasobów — prawa strona

**15.1.** **Epoka**
- Nazwa epoki (Kamień, Brąz, Żelazo…)
- Pasek postępu do następnej epoki (jeśli widoczny)
- Co odblokowuje nowa epoka — skrót

**15.2.** **Nazwa państwa**
- Twoja cywilizacja / nacja
- Ewentualny herb lub kolor

**15.3.** **Osiedla**
- Liczba **małych** miast (bonus Osiedle, pop 1–4)
- Różnica: osiedle vs duże miasto

**15.4.** **Numer tury**
- Która tura trwa
- Różnica: twoja tura vs tura globalna (jeśli w multiplayer kiedyś)

**15.5.** **Dyplomacja**
- Ikony skrótu: pokój, wojna, sojusz, handel…
- Klik → panel dyplomacji (Część XII)
- Tylko nacje **spotkane** (mgła)

**15.6.** Czego **nie ma** po prawej (świadomie)
- Osobny blok „Epoka i badania" — scalone w lewą kolumnę (decyzja A1-revA)
- Przycisk „Zasoby" — usunięty; wszystko w lewej kolumnie

---

### 16. Dolny pasek — Miasta, Wykonaj, Koniec tury

**16.1.** Przycisk **Miasta**
- Lista wszystkich miast
- Szybki skok do panelu wybranego miasta
- Oznaczenia alertów przy mieście (bunt, pusta produkcja)

**16.2.** Przycisk **Wykonaj**
- Aktywny gdy coś **musi** być rozstrzygnięte w tej turze
- Skok do **pierwszego** oczekującego zadania (kolejność FIFO)
- Ten sam efekt co klik czerwonego chipu w panelu wydarzeń
- Katalog sytuacji blocking — apendyks / A1-Q9 (atak, nauka, bunt, produkcja, dyplomacja…)

**16.3.** **Koniec tury**
- Aktywny gdy **brak** blocking
- Wyszarzony dopóki jest Wykonaj / chip blocking
- Skrót klawiaturowy (Enter / N — jeśli w grze)
- Co się dzieje po kliknięciu: ekonomia, AI, następna tura

**16.4.** Komunikaty i **chipy wydarzeń**
- Panel wydarzeń z bieżącej tury
- Chip **blocking** (czerwony) — blokuje koniec tury
- Chip **informacyjny** (z ✕) — można zamknąć, nie blokuje
- Przykłady: „Wybierz technologię", „Miasto X — bunt", „Ukończono Metalurgię"

**16.5.** Menu / ustawienia (jeśli na dolnym pasku)
- Zapis, wczytanie, wyjście do menu głównego

---

### 17. Lewy panel — Cuda i Budowa

**17.1.** **Cuda świata**
- Ikona otwiera listę cudów do wzniesienia
- Warunki: terytorium, technologia, koszt pracy, max 1 na świat (typ E/R)
- Szczegóły — Część XV §87

**17.2.** **Budowa** (ulepszenia terenu)
- Ikona wchodzi w tryb budowy na mapie
- Wybór ulepszenia → klik heks w **twoim** terytorium
- Koszt w pracy
- Szczegóły — Część V

**17.3.** Czego **nie ma** na lewym panelu (v1.0)
- Osobna ikona „Zasoby" — liczby tylko na górnym pasku

---

### 18. Minimapa

**18.1.** Mała mapa heksów
- Uproszczony widok świata (nie kopia 3D)
- Pozycja kamery — prostokąt / zaznaczenie
- Rozmiar i pozycja na ekranie (decyzja layoutu D1B)

**18.2.** Mgła wojny na minimapie
- Niewidoczne heksy — ciemne / ukryte
- Odkryte — kolor terenu lub frakcji

**18.3.** Przeskok kamery
- Klik na minimapę — skok widoku
- Szybka nawigacja między miastami i frontem

**18.4.** Ikony przy minimapie
- Włącz **warstwę kultury** (🎭)
- Włącz **warstwę religii**
- Szczegóły overlay — Część II §10

---

### 19. Banery wojny i dyplomacji

**19.1.** Wojny widoczne na mapie
- Tylko wojny, w których **uczestniczysz ty**
- Baner: z kim walczysz, ile tur (jeśli pokazane)
- Klik → dyplomacja / szczegóły wojny

**19.2.** Wojny innych państw
- **Nie** na banerach mapy — brak „wiadomości świata"
- Gdzie sprawdzić: panel **Dyplomacji** → lista relacji

**19.3.** Inne komunikaty dyplomatyczne
- Sojusz, pakt, handel — czy na banerze czy tylko w panelu (stan UI)

---

### 20. Siła państwa (liczba mocy)

**20.1.** Duża liczba na mapie
- Gdzie na ekranie (centrum / przy minimapie — decyzja A1)
- Pełna wartość siły państwa imperium
- Aktualizacja co turę / po bitwie

**20.2.** **Siła państwa** vs **szacunek** u sąsiadów
- Siła państwa — twój „ciężar" na mapie (wojsko, miasta, tech…)
- Szacunek (Respekt) — jak dyplomaci cię oceniają (Część XII)
- Cuda **nie** dodają siły państwa — ważne dla gracza

**20.3.** Składniki siły państwa
- Armia — suma mocy jednostek w polu
- Wygrane bitwy — suma mocy pokonanych wroga (przed walką)
- Ludność, liczba miast, heksy terytorium
- Budynki, technologie, ulepszenia pól

**20.4.** Czego **nie** wlicza się
- Mnożnik epoki (osobna mechanika)
- Cuda świata (bonusy tak, do Mocy nie)
- Tymczasowe buffy bitewne

**20.5.** Tooltip / rozwinięcie
- Czy gracz widzi rozbicie składników (stan UI)
- Powiązanie ze zwycięstwem dominacją (Część XVI §90)

---

### 21. Zapasy żywności państwa (Spichlerz)

**21.1.** Format **bieżące / maksimum**
- Wyświetlanie na pasku zasobów (np. 45 / 100)
- Maksimum = pojemność × liczba Spichlerzy w imperium
- Bez Spichlerza — inny model żywności (§14.1, Część VI §39)

**21.2.** Co się dzieje, gdy magazyn jest **pełny**
- Nadwyżka przepada / nie rośnie bufor (decyzja B5)
- Strategia: więcej Spichlerzy lub większe zużycie wojska

**21.3.** Co się dzieje, gdy magazyn jest **pusty**
- Wojsko: głód −8% max HP na turę (Część VIII §50)
- Wzrost miast — z bufora lokalnego, nie z magazynu państwa

**21.4.** Związek z miastami
- Suwak żywności **30% na wojsko** — karmi magazyn
- Kiedy warto zbudować pierwszy Spichlerz
- Wiele miast — jeden wspólny magazyn państwa

**21.5.** Wiki — hasła
- Spichlerz · Zapasy państwa · Żywność wojska (osobne Wiki‑S/M)

---

## Część IV — Jednostki na mapie

### 22. Karta jednostki

**22.1.** Ruch · atak · widok · utrzymanie · morale
- **Ruch** — ile heksów przejdziesz w tej turze (punkty ruchu)
- **Atak** — siła uderzenia w walce (skrót na karcie)
- **Widok** — zasięg odkrywania mgły (domyślnie 3; zwiadowca więcej)
- **Utrzymanie** — koszt w **złocie** co turę ze skarbca państwa
- **Morale** — wpływ na walkę (jeśli widoczne na karcie v1)

**22.2.** Typ jednostki i rola bojowa
- Kategoria: piechota, kawaleria, dystans, oblężnicza… (Część X §54)
- **Rola** decyduje o bonusach terenu i contrach w bitwie
- Jednostki unikalne cywilizacji — osobne wpisy (Część XIII §85)
- Karta po zaznaczeniu jednostki na mapie (skrót **H** — jeśli w grze)

---

### 23. Ruch, wyznaczanie trasy, teren bojowy

**23.1.** Koszty ruchu strategicznego
- Klik docelowy heks — gra pokazuje **trasę** i koszt
- Las, wzgórze, rzeka — więcej punktów ruchu niż łąka
- **Droga** — tańszy ruch (ulepszenie — Część V §31)
- Nie możesz wejść na obcy terytorium bez zgody / wojny (Część XII §80)

**23.2.** Bonusy/obrona terenu (przed walką)
- Wysokość i las na heksie **obrońcy** — bonus w auto-walce i preBattle
- Rzeka na polu bitwy — kara atakującemu (Część X §56)
- Planuj pozycję **przed** wejściem w walkę — nie da się cofnąć bez Wycofaj (preBattle)

---

### 24. Armia — łączenie i dzielenie

**24.1.** v1.0: proste okno połącz/nie połącz
- Dwie jednostki na sąsiednich heksach — opcja **połącz** w jedną grupę
- Okno: tak / nie — bez przeciągania żetonów
- Połączona grupa porusza się razem; atak jako całość

**24.2.** 🔮 Panel armii z przeciąganiem (post-v1)
- Przyszłość: pełny panel z listą jednostek i drag-and-drop
- v1.0 — tylko proste łączenie; nie oczekuj zaawansowanego układu armii
- Apendyks E.4 — roadmap

---

### 25. Garnizon i stacjonowanie

**25.1.** Jednostka na heksie miasta = obrońca
- Wojsko **stojące na polu miasta** wchodzi do obrony przy ataku
- Licznik garnizonu w panelu miasta (jeśli widoczny — Część VII §48)
- Jednostka w polu nie zbiera plonów — tylko stoi

**25.2.** Kto broni murów
- Garnizon + ewentualna **milicja** z ludności przy oblężeniu (Część XI §62)
- Miasto **z murem** — oblężenie lub szturm; bez muru — bitwa polowa
- Silny garnizon podnosi **prawo** w mieście → mniejsze ryzyko buntu (Część VI §36)

---

### 26. Posiłki

**26.1.** Promień 1 heks od starcia walki
- Jednostki w **odległości 1 heksa** od miejsca starcia mogą dołączyć
- Tylko **twoje** jednostki w zasięgu — nie wojsko z drugiego końca mapy
- Decyzja przed walką (preBattle) — podgląd, kto wchodzi

**26.2.** Kto wchodzi do bitwy automatycznie
- Jednostki w promieniu 1 — domyślnie **wchodzą** do walki (auto-walka / ręczna)
- Oblężnicze mogą mieć osobne reguły (nie zawsze w polu — Część X §55.2)
- Po bitwie ocalałe wracają na mapę — fan-out w pierścieniu (Część X §58.2)

---

## Część V — Budowa na mapie (ulepszenia terenu)

### 27. Tryb budowy

**27.1.** Ikona Budowa → wybór ulepszenia → klik heks w terytorium
- Lewy panel mapy — ikona **Budowa** (skrót **C** — jeśli w grze)
- Wybierasz typ ulepszenia z listy (farma, tartak, droga…)
- Klikasz **wolny** heks w **swoim** terytorium — rozpoczyna się budowa
- Nie możesz budować na złożu, obcym terytorium ani w mgle

**27.2.** Koszt w **pracy** (skarbiec / pula miasta)
- Płacisz **pracą** z puli imperium — nie złotem (chyba że przyspieszenie gdzie indziej)
- Praca bieżąco z miast i pól — pasek zasobów u góry (Część III §14.3)
- Brak pracy — budowa stoi do następnej tury

---

### 28. Katalog ulepszeń v1.0

**28.1.** **Żywność:** Farma, Irygacja, Obóz łowiecki, Tarasy
- **Farma** — podstawowy plon żywności na polu uprawnym
- **Irygacja** — wyższy plon; wymaga sąsiada z wodą (rzeka)
- **Obóz łowiecki** — żywność z lasu / łąki
- **Tarasy** — żywność na wzgórzu (specjalne wymagania terenu)

**28.2.** **Produkcja:** Tartak, Kamieniołom, Kopalnia, Stolarnia…
- **Tartak** — praca z lasu (drewno logiczne v1)
- **Kamieniołom** — praca ze wzgórza / góry
- **Kopalnia** — przy złożu po odblokowaniu epoki
- **Stolarnia** i inne — łańcuch tech w Części IX §49

**28.3.** **Hodowla:** Bydło, Owce, Lama, Koń
- Pastwiska — żywność lub bonusy pod jednostki (koń → kawaleria)
- Wymagania terenu: łąka, czasem bez lasu
- Hodowla kumuluje się z innymi ulepszeniami — status wielowarstwowości §30.2

**28.4.** **Infrastruktura:** Droga, Posterunek (Strażnica), Fort, Łodzie
- **Droga** — tańszy ruch wojska i handel (§31.2)
- **Posterunek** — małe terytorium (+5 heksów — Część II §9.1)
- **Fort** — większe terytorium, obrona
- **Łódź rybacka** — wybrzeże w terytorium miasta (§13.2)

**28.5.** **Specjalne:** Warzelnia soli, Glinianka, Wyrąb (FREE, usuwa las)
- **Warzelnia soli** — luksus / handel (rzadki teren)
- **Glinianka** — produkcja (glina logiczna v1)
- **Wyrąb** — usuwa las z heksu; często **darmowy** lub tani — otwiera pole pod farmę

---

### 29. Technologie a ulepszenia

**29.1.** Drzewko liniowe w epoce · bramki AND
- W jednej epoce wiele tech w **linii** — kolejne odblokowują ulepszenia
- Niektóre wymagają **dwóch** tech naraz (bramka AND)
- Szare na liście budowy = brak technologii

**29.2.** Co odblokowuje tech (ulepszenie, surowiec, budynek, jednostka)
- Jedna technologia może otworzyć: ulepszenie mapy **i** budynek w mieście **i** jednostkę
- Przykłady łańcuchów — Część IX §49.2 (Murarstwo → mury…)
- Po zbadaniu — od razu widoczne w trybie budowy i w panelu miasta

---

### 30. Zasady stawiania ulepszeń

**30.1.** Wymagania terenu (np. farma bez złoża, rzeka-sąsiad…)
- **Farma** — łąka, **bez** złoża na heksie
- **Irygacja** — sąsiedni heks z **rzeką**
- **Tartak** — las; **wyrąb** go usuwa
- Pełna tabela — apendyks B.7

**30.2.** 📋 Wielowarstwowość heksów (farma+irygacja) — kanon zapisany, kod 🔮
- Docelowo: kilka ulepszeń na jednym heksie (np. farma + irygacja)
- v1.0 — sprawdź w grze, co faktycznie działa; kanon w dokumentacji
- 🔮 Pełna wielowarstwowość — apendyks E.2

---

### 31. Utrzymanie i efekty ulepszeń

**31.1.** Plony → miasto właściciela pola
- Żywność, praca, złoto z heksu trafiają do miasta, które **przypisało** pole (okolica)
- Auto-zarządca i profile okolicy — Część VII §44
- Utrata heksu w wojnie = utrata plonów z tego pola

**31.2.** Drogi a ruch · posterunki a terytorium
- **Droga** — obniża koszt ruchu dla wojska na tym heksie
- **Posterunek / fort** — rozszerza **terytorium** państwa (plony i budowa w zasięgu)
- Infrastruktura wymaga utrzymania — jeśli w danych balansu (sprawdź tooltip ulepszenia)

---

## Część VI — Miasto: ludność i stabilność

*Zakładka **Miasto** w panelu miasta — szczęście, podatki, bunt, bogactwo, suwaki, kultura, religia, auto-zarządca.*

### 32. Panel miasta — zakładka Miasto

**32.1.** Co widzisz po otwarciu miasta
- Nagłówek: nazwa miasta, liczba mieszkańców, poziom / wielkość miasta
- Przełącznik zakładek u góry: **Plony · Produkcja · Miasto · Okolica** (tu jesteś w **Miasto**)
- Układ dwóch kolumn: **lewa** — ludność, zdrowie, szczęście, porządek · **prawa** — suwaki, bogactwo, kultura i religia
- Przycisk zamknięcia panelu i powrót na mapę

**32.2.** Trzy grupy mieszkańców (zadowoleni · kontentni · niezadowoleni)
- Trzy ikony z liczbami — **wizualizacja** procentu szczęścia, nie ręczny podział ludzi
- Zadowoleni — wysokie szczęście (ikona uśmiechu)
- Kontentni — średnie szczęście
- Niezadowoleni — niskie szczęście (ikona smutna / zła)
- Skąd biorą się liczby: przeliczenie z procentu szczęścia miasta

**32.3.** Gdzie szukać alertów
- Chip **buntu** w panelu wydarzeń (dolny pasek mapy)
- Ikona **ognia** na heksie miasta na mapie (do końca tury)
- Czerwone / pomarańczowe komunikaty w sekcji porządku
- Alert krytyczny buntu na mapie strategicznej (po dłuższym niepokoju)

**32.4.** Czego **nie ma** w zakładce Miasto (v1.0)
- Sekcja specjalistów — usunięta w wersji 1.0
- Globalne szczęście imperium na mapie — tylko **per miasto** w panelu

---

### 33. Ludność i wzrost

**33.1.** Aktualna populacja i limit
- Ile masz mieszkańców teraz
- Maksimum bez Akweduktu (normalnie **6**)
- Akwedukt — podnosi limit (szczegóły w rozdziale budynków, Część VII)
- Wpływ trudności gry na próg wzrostu

**33.2.** Bufor wzrostu — kiedy przybywa kolejny mieszkaniec
- Pasek postępu bufora w panelu
- Skąd wpływa żywność na bufor (suwak **Rozwój miast** — Część §38.3)
- Próg wzrostu rośnie z każdym mieszkańcem (wyjaśnienie słowne; wzór w apendyksie C.1)
- Co się dzieje, gdy bufor się zapełni — awans o 1 mieszkańca

**33.3.** Po awansie ludności — bufor i Spichlerz
- **Bez Spichlerza:** bufor zeruje się po awansie
- **Ze Spichlerzem:** część bufora zostaje (50% — szczegóły §39)
- Wpływ na tempo kolejnego wzrostu

**33.4.** Bonus **Osiedle** (małe miasto)
- Dla miast z populacją 1–4
- Co daje bonus (szczęście, plony — według balansu trudności)
- Kiedy bonus znika (większe miasto)

**33.5.** Migracja przy buncie
- Część ludzi może odejść do innego miasta (~5% tury przy buncie)
- Inne miasto może **przyjąć** migrantów (+1)
- Nie tracisz miasta — ale populacja i ekonomia cierpią

---

### 34. Zdrowie

**34.1.** Co to jest zdrowie miasta
- Osobna sekcja w lewej kolumnie panelu
- Liczba punktów zdrowia i rozpiska **+ / −** ze źródeł
- Budynki podnoszące zdrowie (według danych gry)
- Kary: zanieczyszczenie, przepełnienie, wojna (jeśli wpięte)

**34.2.** Wpływ zdrowia na miasto
- Słabe zdrowie — wolniejszy wzrost ludności
- Wpływ na szczęście (jeśli w danych balansu)
- Co zrobić graczowi: budynki, mniejsze zagęszczenie, stabilność

---

### 35. Szczęście (zadowolenie)

**35.1.** Procent szczęścia — jak czytać liczbę
- Główna liczba **%** u góry sekcji
- **Nie** liczymy „głów" ludzi — tylko procent z czynników
- Maksimum możliwe w danej epoce miasta vs suma plusów i minusów
- Cap super-zadowolenia (powyżej 100% — jeśli możliwe w balansie)

**35.2.** Rozpiska czynników — co podnosi szczęście (+)
- Świątynia, amfiteatr / rozrywka
- Luksus / bogactwo — pula na mieszkańca
- Niskie podatki (duży udział luksusu w suwaku handlu)
- Nasza religia dominuje w mieście
- Nasza kultura dominuje w mieście
- Bonus małego miasta (niskie zagęszczenie)
- Inne budynki z bonusem do zadowolenia (pełna lista w apendyksie B.8)

**35.3.** Rozpiska czynników — co obniża szczęście (−)
- Zagęszczenie — za dużo ludzi w mieście
- Wojna — zmęczenie wojenne państwa
- Obca kultura dominuje
- Obca religia dominuje
- Wysokie podatki (suwak handlu — mało luksusu)

**35.4.** Gdzie widać szczęście
- **Tylko** w panelu miasta (zakładka Miasto)
- **Nie** na górnym pasku zasobów mapy (decyzja: per miasto)
- Tooltip Wiki‑S przy sekcji szczęścia

**35.5.** Progi szczęścia a efekty
- Co się dzieje przy niskim / średnim / wysokim procencie
- Powiązanie z porządkiem (§36) — nie mylić z buntem od razu

---

### 36. Porządek, prawo i bunt

**36.1.** Porządek — osobna liczba obok szczęścia
- Procent porządku w sekcji zawsze widocznej (lewa kolumna)
- Składniki: **szczęście** + **prawo** (wagi z balansu)
- Rozpiska plusów i minusów prawa (jak przy zdrowiu)
- Budynki i wojsko w mieście podnoszą prawo

**36.2.** Progi niepokoju (niski porządek)
- Pierwszy próg — lekkie kary ekonomiczne
- Drugi próg — silniejsze kary, ryzyko buntu
- Pełna tabela efektów w apendyksie B (progi T1/T2)

**36.3.** Bunt — czego **nie** robisz
- **Nie tracisz miasta** przez bunt (decyzja v1.0)
- Miasto zostaje twoje — ale cierpi ekonomia i ludność

**36.4.** Bunt — kary ekonomiczne
- Mniej pracy, złota, nauki, kultury z tego miasta (mnożnik kary)
- Migracja ludzi (§33.5)
- Jak długo trwają kary — do poprawy porządku

**36.5.** Ostrzeżenia dla gracza
- Chip w panelu wydarzeń dolnego paska
- Ikona ognia na heksie miasta
- Alert krytyczny — rebelia AI po **2 turach** grace (ciągły niski porządek)

**36.6.** Rebelia AI (skrajny bunt)
- Kiedy wrogie jednostki / AI reaguje na długi bunt
- Dźwignie gracza: **obniż podatki** → wyższe szczęście · **wojsko w mieście** → wyższe prawo
- Narzędzia stabilizacji — pełna lista (§38 + budynki)

**36.7.** Porządek a przycisk **Wykonaj**
- Aktywny bunt może blokować Koniec tury
- Skok przez Wykonaj do panelu miasta

---

### 37. Bogactwo (luksus państwa)

**37.1.** Bogactwo ≠ złoto
- **Złoto** — skarbiec na pasku zasobów mapy
- **Bogactwo** — luksus i zamożność warstwy społecznej (głównie panel miasta)
- Dlaczego oba widzisz na ekranie — różne role

**37.2.** Panel bogactwa w mieście
- Poziom bogactwa (W)
- Pula luksusu — skąd wpływa (suwak handlu → udział luksusu)
- Próg następnego poziomu
- Mnożnik dochodu z luksusu
- Wpływ poziomu na szczęście (§35.2)

**37.3.** Suwak społeczeństwa / luksus (powiązanie z §38.1)
- Więcej luksusu w handlu → wyższe bogactwo, często wyższe szczęście
- Mniej luksusu → więcej złota i nauki, ryzyko niezadowolenia

**37.4.** Trudność a bogactwo
- Immunitet / modyfikatory bogactwa na wyższej trudności (D18)

**37.5.** Bogactwo na pasku zasobów mapy
- Skrót imperium: wartość + przyrost na turę
- Szczegóły — w panelu miasta (tu)

---

### 38. Suwaki podziału — handel, praca, żywność

**38.1.** Suwak **Handel** (podatki / handel netto)
- Trzy kierunki: **złoto · nauka · luksus (bogactwo)**
- Domyślnie: **70% złoto · 20% nauka · 10% luksus**
- Wpływ na szczęście: duży udział luksusu = bonus; mały = kara wysokich podatków
- Wpływ na skarbiec imperium i tempo badań
- Ustawienie **osobno dla każdego miasta**

**38.2.** Suwak **Praca** (podział pracy miasta)
- **Budynki w mieście** vs **ulepszenia pól w okolicy**
- Domyślnie: **70% budynki · 30% teren**
- Kiedy przesunąć więcej na teren (szybkie ulepszenia pól)
- Kiedy więcej na budynki (świątynia, koszary, Spichlerz…)

**38.3.** Suwak **Żywność** (podział żywności imperium z miasta)
- **Rozwój miast** (bufor wzrostu) vs **zapas wojska** (państwowy)
- Domyślnie: **70% rozwój · 30% wojsko**
- Bez Spichlerza — nadwyżka na wojsko **przepada** po awansie ludności
- Ze Spichlerzem — zapasy państwa na pasku (§39, Część III §21)

**38.4.** Auto-zarządca (ikona koła zębatego)
- Włączenie / wyłączenie per miasto
- Co robi: ustawia suwaki i profile okolicy według logiki gry
- Kiedy warto **wyłączyć** (§41)
- Domyślne wartości nowego miasta

**38.5.** Strategie gracza — przykłady
- Miasto graniczne: więcej prawa, wojsko, umiarkowane podatki
- Miasto naukowe: więcej nauki w handlu, budynki kulturalne
- Miasto rolnicze: żywność na rozwój, okolica na plony

---

### 39. Spichlerz — wpływ na miasto

**39.1.** Czym jest Spichlerz (z perspektywy miasta)
- Budynek do wzniesienia w kolejce produkcji (Część VII)
- Nazwa w grze zawsze: **Spichlerz** (nie „magazyn żywności")

**39.2.** Gra **bez** Spichlerza w imperium
- Bufor wzrostu **zeruje się** po każdym awansie ludności
- Nadwyżka żywności na wojsko z suwaka **przepada** po awansie
- Rekrutacja **nigdy** nie jest blokowana brakiem zapasów

**39.3.** Gra **ze** Spichlerzem (przynajmniej jeden w imperium)
- Po awansie zostaje **50%** bufora wzrostu
- Żywność trafia do **zapasów państwa** (format na pasku zasobów)
- Pojemność magazynu — zależna od liczby Spichlerzy (Część III §21)

**39.4.** Kiedy budować Spichlerz — decyzja gracza
- Wcześnie: stabilny wzrost i armia karmiona z zapasów
- Późno: szybszy start, ryzyko przepadania nadwyżek
- Interakcja z trudnością (D18, SP1–SP6 w apendyksie B.4)

**39.5.** Spichlerz a suwak żywności (§38.3)
- Ten sam suwak — inny skutek z/bez Spichlerza
- Przykład liczbowy w poradniku‑L (apendyks C po napisaniu)

---

### 40. Kultura i religia w mieście

**40.1.** Sekcja kultury w panelu
- Suma kultury miasta
- Przyrost kultury **+ na turę**
- Progi granic kultury (presja na sąsiednie heksy)
- Źródła: budynki, cuda, bonusy cywilizacji

**40.2.** Dominacja kultury w mieście
- Procent **własnej** kultury vs obcej
- Bonus szczęścia przy wysokim udziale własnej (≥80%)
- Kara przy niskim (<50% obca dominuje)

**40.3.** Religia w tym samym bloku
- Dominująca religia w mieście
- Liczba wyznawców / procent
- Nasza religia dominuje — bonus szczęścia
- Obca religia — kara szczęścia

**40.4.** Relacja z warstwą na mapie
- Ikony przy minimapie — zasięg kultury i religii imperium
- Overlay — lista miast, progi (Część II §10, Część XV §86)
- Panel miasta = **to konkretne miasto**; overlay = **całe państwo**

**40.5.** Kultura na pasku zasobów mapy
- Suma imperium + przyrost (osobna od sekcji w mieście)
- Brak osobnego zasobu „Idei" — tylko kultura

---

### 41. Auto-zarządca miasta

**41.1.** Co robi auto-zarządca
- Dostosowuje suwaki handlu, pracy, żywności
- Wybiera profile okolicy pól (§44 — Część VII)
- Działa **per miasto** — każde można ustawić osobno

**41.2.** Kiedy włączyć
- Wiele miast — oszczędność czasu
- Miasta w głębi państwa bez specjalnych celów
- Wczesna gra — nauka mechaniki

**41.3.** Kiedy wyłączyć i sterować ręcznie
- Miasto stołeczne / naukowe — precyzyjny podział
- Tuż przed buntem — obniż podatki ręcznie
- Okolica z rzadkimi zasobami — ręczne przypisanie pól
- Przed rekrutacją masową — przesuń żywność na wojsko

**41.4.** Auto-zarządca a bunt i szczęście
- Czy AI auto-zarządcy reaguje na niski porządek (stan v1.0)
- Limity — czego auto-zarządca **nie** zrobi (np. nie wzniesie cudu)

**41.5.** Wiki — hasła powiązane
- Auto-zarządca · Suwak handlu · Suwak pracy · Suwak żywności (osobne karty Wiki‑M)

---

## Część VII — Miasto: budowa, plony i rekrutacja

*Zakładki **Plony · Produkcja · Okolica** — budynki, kolejka, pola, wojsko.*

### 42. Panel miasta — trzy zakładki robocze

**42.1.** Zakładka **Plony**
- Podsumowanie: ile miasto produkuje żywności, pracy, złota **z pól** co turę
- Podział na źródła (okolica, bonusy budynków, cuda)
- Szybki test: czy miasto karmi wzrost i wojsko

**42.2.** Zakładka **Produkcja**
- Lista budynków do wzniesienia
- Kolejka — co budujesz teraz i co zaplanowałeś
- Postęp w **pracy** (nie w złocie — chyba że przyspieszenie)
- Rekrutacja jednostek wojskowych (jeśli w tym samym widoku)

**42.3.** Zakładka **Okolica**
- Siatka heksów wokół miasta — które pracują dla miasta
- Przypisanie pól: automatyczne profile lub ręcznie
- Podgląd plonu z każdego heksu

**42.4.** Przełączanie zakładek a alert **Wykonaj**
- Pusta produkcja — komunikat w zakładce Produkcja
- Skok z dolnego paska do właściwej zakładki

---

### 43. Zakładka Plony

**43.1.** Skąd bierze się żywność
- Pola uprawne, pastwiska, rybołówstwo, ulepszenia (farma, irygacja…)
- Bonusy budynków w mieście (młyn, rynek — według danych)
- Udział suwaka żywności (§38.3)

**43.2.** Skąd bierze się praca
- Ulepszenia produkcyjne (tartak, kamieniołom…)
- Podział suwaka pracy (§38.2)
- Praca idąca do budowy w kolejce

**43.3.** Skąd bierze się złoto z pól
- Profile okolicy „Podatki" / zrównoważone
- Ulepszenia i złoża (gdy dostępne)
- Handel — część idzie przez suwak handlu, nie bezpośrednio z heksu

**43.4.** Typ terenu a plon
- Łąka, las, wzgórze, pustynia, morze — różne bazowe plony
- Tabela referencyjna w apendyksie B.7

**43.5.** Cuda a plony
- Cud z bonusem ×3 per miasto — które plony mnoży
- Wygasłe cuda po absolut — tylko turystyka (+10 handlu)

---

### 44. Zakładka Okolica — przypisanie pól

**44.1.** Promień okolicy
- Domyślnie **3 heksy** od centrum miasta
- Które heksy wchodzą w skład (własne terytorium)
- Heksy zajęte przez miasto, złoże, wrogi teren — wykluczenia

**44.2.** Profile automatyczne
- **Żywność** — priorytet karmienia miasta i wzrostu
- **Produkcja** — priorytet pracy na budynki / ulepszenia
- **Podatki** — priorytet złota
- **Zrównoważone** — mix bez ekstremów
- Kiedy który profil wybrać — przykłady gracza

**44.3.** Ręczna korekta (ikona ręki)
- Klik heksu — przypisz pracę ręcznie
- Nadpisanie auto-zarządcy na tym polu
- Optymalizacja: jedno miasto na złoże miedzi, drugie na żywność

**44.4.** Okolica a zasięg miasta
- Tylko heksy w **twoim** terytorium
- Posterunek / fort rozszerzają zasięg — pola dalej (Część II §9)
- Co się dzieje po utracie heksu w wojnie

**44.5.** Okolica a suwak pracy (§38.2)
- 30% pracy na teren — jak rozłożyć na heksy
- Konflikt: dużo budynków w kolejce vs rozwój pól

---

### 45. Budynki w mieście

**45.1.** Rodzaje budynków (kategorie)
- Ekonomia: targ, młyn, spichlerz…
- Wojsko: koszary, kuźnia…
- Nauka i kultura: biblioteka, świątynia…
- Infrastruktura: akwedukt, mury…
- Pełna lista — apendyks B.8

**45.2.** Koszt w pracy i czas budowy
- Ile **pracy** kosztuje poziom 1, 2, 3…
- Poziomy budynków **1–10** — co daje każdy poziom
- Kolejność — tylko jeden budynek na raz w podstawowej kolejce (v1.0)

**45.3.** Utrzymanie co turę
- Koszt w **złocie** (¤) na turę per budynek / poziom
- Suma utrzymania miasta a skarbiec imperium
- Sprzedaż / zniszczenie budynku — jeśli dostępne (status v1)

**45.4.** Wymagania technologii
- Który budynek wymaga której technologii
- Odblokowanie w drzewku nauki (Część IX)
- Budynki epoki — co znika z listy po absolut cudów

**45.5.** Wymagania surowców (status v1.0)
- Co gracz widzi w UI vs co silnik egzekwuje
- 🔮 Przyszłe wersje: pełne zużycie surowców z magazynu

**45.6.** Przyrost z budynków
- `przyrost` — żywność, praca, nauka, zadowolenie, zdrowie…
- Kumulacja wielu budynków tego samego typu
- Synergia z suwakami (§38)

---

### 46. Zakładka Produkcja — kolejka budowy

**46.1.** Wybór budynku z listy
- Szare pozycje — brak technologii lub zasobów
- Podgląd kosztu pracy i utrzymania przed zatwierdzeniem
- Zmiana zdania — anulowanie (jeśli dostępne)

**46.2.** Postęp w pracy
- Pasek postępu bieżącej produkcji
- Skąd wpływa praca: miasto + suwaki + okolica
- Ile tur do ukończenia — szacunek

**46.3.** Przyspieszenie za złoto
- Przycisk rush / przyspiesz — koszt w **złocie**
- Wzór kosztu (proporcja pozostałej pracy)
- Kiedy opłaca się: ostatnie tury przed wojnou, Spichlerz pilny

**46.4.** Pusta kolejka a **Wykonaj**
- Gra przypomina: wybierz budynek lub jednostkę
- Blokada końca tury — do ustawienia produkcji (katalog A1-Q9)
- Wyjątki — czy można zakończyć turę bez produkcji (decyzja / stan kodu)

**46.5.** Produkcja a auto-zarządca
- Czy auto-zarządca wybiera budynki (v1.0 — zakres)
- Priorytety: obrona, wzrost, nauka

---

### 47. Rekrutacja jednostek

**47.1.** Gdzie rekrutować
- Zakładka Produkcja lub sekcja wojska w panelu miasta
- Lista jednostek dostępnych po technologii
- Jednostki unikalne cywilizacji (Część XIII §85)

**47.2.** Koszt rekrutacji (v1.0)
- **Złoto** ze skarbca imperium
- **Ludność** — ile mieszkańców kosztuje jednostka
- **Technologia** — wymagane odblokowanie
- Skala z **epoką** (taniej / drożej, silniejsze jednostki)

**47.3.** Kolejka rekrutacji
- Czy rekrutacja idzie przez tę samą kolejkę co budynki (stan UI)
- Czas rekrutacji w turach pracy
- Przyspieszenie za złoto — analogia do budynków

**47.4.** Surowce w danych gry
- JSON może pokazywać drewno, żelazo… — **referencja** w v1.0
- 🔮 Przyszłe wersje: bramka dostępu surowca + pełne odejmowanie

**47.5.** Rekrutacja a Spichlerz i żywność
- Rekrutacja **nie blokowana** brakiem zapasów (decyzja B5)
- Żywność wojska — osobny rozdział (Część VIII §50)

---

### 48. Garnizon miasta

**48.1.** Jednostki na heksie miasta
- Stacjonowanie — jednostka stoi na polu miasta
- Licznik garnizonu w panelu (jeśli widoczny)
- Kto liczy się jako obrońca

**48.2.** Garnizon a mury
- Miasto z murem — inne opcje ataku (oblężenie vs szturm)
- Miasto bez muru — zdobycie z marszu / bitwa polowa

**48.3.** Garnizon a prawo i bunt
- Wojsko w mieście podnosi **prawo** → porządek
- Za mało wojska przy buncie — rebelia (§36.6)

**48.4.** Powiązania z innymi rozdziałami
- Oblężenie — Część XI (garnizon, milicja, machiny)
- Jednostki na mapie — Część IV §25
- Posiłki w bitwie — Część IV §26

**48.5.** Garnizon a produkcja
- Jednostka w mieście nie produkuje pól — tylko stoi
- Rekrutacja uzupełnia straty po walce

---

## Część VIII — Ekonomia imperium

### 49. Skarbiec państwa (Złoto)

**49.1.** Przychody co turę — skąd bierze się złoto
- Podatki z miast — wynik suwaka handlu (złoto vs nauka vs luksus)
- Handel z innymi państwami — umowy dyplomatyczne
- Jednorazowe wpływy: prezenty, trybut, łup z bitew (jeśli w grze)
- Przyrost netto widzisz na pasku zasobów jako **+X na turę**

**49.2.** Wydatki co turę — na co idzie skarbiec
- **Utrzymanie** budynków we wszystkich miastach (stały koszt w ¤)
- **Utrzymanie** jednostek w polu i w garnizonach
- **Utrzymanie** cudów świata (po wzniesieniu)
- Przyspieszenie budowy lub rekrutacji za złoto — jednorazowe, nie co turę

**49.3.** Bilans netto — jak czytać liczby
- Skarbiec = stan na początku tury + przychody − wydatki
- Ujemny przyrost — ostrzeżenie: brak ¤ blokuje rush i czasem rekrutację
- Tooltip na pasku — rozbicie dochodów i kosztów (jeśli w UI)
- Złoto ≠ bogactwo — luksus to osobna mechanika (Część VI §37)

**49.4.** Strategie gracza — zarządzanie skarbcem
- Wczesna gra: utrzymanie niskie, unikaj pustego skarbca przed wojnou
- Środek gry: balans podatków — więcej złota vs więcej nauki
- Wojna: rezerwa na rekrutację i przyspieszenia produkcji
- Po absolut cudów: utrzymanie spada, ale nadal kosztuje (Część XV §95)

---

### 50. Żywność imperium i wojsko

**50.1.** Dwa poziomy żywności — miasto vs całe państwo
- **Miasto** produkuje żywność z pól — suwak dzieli ją na wzrost i wojsko
- **Państwo** (ze Spichlerzem) — wspólny magazyn na pasku zasobów
- Bez Spichlerza — każde miasto „trzyma" własny bufor wzrostu lokalnie
- Suma na pasku ≠ suma buforów — zależy od modelu Spichlerza (Część III §21)

**50.2.** Kto zużywa żywność — populacja, wojsko, obóz
- **Populacja** — bufor wzrostu w miastach (suwak Rozwój miast)
- **Wojsko w polu** — koszt za każdą jednostkę co turę (z zapasów państwa)
- **Obóz / stacjonowanie** — niższe zużycie niż marsz (jeśli w balansie)
- **Ruch** — dodatkowe zużycie przy długich marszach (status v1.0)

**50.3.** Głód wojska — co się dzieje przy pustym magazynie
- Gdy zapasy państwa **< 0** — wojsko traci **−8% maksymalnego zdrowia** na turę
- Jednostka może paść z głodu bez walki — sprawdź magazyn przed ofensywą
- Głód **nie blokuje** rekrutacji (decyzja B5)
- Remedium: Spichlerz, suwak żywności na wojsko, mniej armii w polu

**50.4.** Żywność a wzrost miast — priorytety gracza
- Wcześnie: suwak 70% rozwój — szybki wzrost przed wojnou
- Przed kampanią: 50% lub więcej na wojsko + Spichlerz
- Wiele miast — jeden wspólny magazyn karmi całą armię
- Pełny magazyn — nadwyżka przepada (decyzja B5)

**50.5.** Wiki — hasła powiązane
- Żywność · Spichlerz · Zapasy państwa · Suwak żywności (osobne karty Wiki‑M)

---

### 51. Nauka (badania)

**51.1.** Wspólna pula imperium — jak działa nauka
- Wszystkie miasta **składają** punkty badań do jednej puli państwa
- Suwak handlu w każdym mieście — część produkcji idzie na naukę (domyślnie 20%)
- Budynki (biblioteka, akademia…) — stały bonus + na turę
- Tempo widzisz na pasku: **+X badań** i pasek % do aktualnej technologii

**51.2.** Tempo gry a koszty technologii
- **Szybka** — koszty tech ×0,2 (szybsze badania, krótsza gra)
- **Standard** — ×1 (domyślne)
- **Długa** — ×5 (wolniejsze badania, dłuższa gra)
- Wybór w kreatorze nowej gry (Część I §2.4) — nie da się zmienić w trakcie

**51.3.** Wybór technologii — co musisz wiedzieć
- **Jedno** aktywne badanie naraz — klik w drzewku ustawia cel
- Ukończenie tech — automatyczne przejście do kolejnego (jeśli zaplanowane) lub wybór gracza
- Chip **Wykonaj** — „Wybierz technologię" gdy brak celu badania
- Szczegóły drzewka — Część IX §54

**51.4.** Nauka a epoki — powiązanie
- Niektóre tech wymagają **epoki** — wyszarzone dopóki nie awansujesz
- Awans epoki — odblokowuje gałąź drzewka (Część IX §55)
- Zwycięstwo naukowe — wszystkie tech + rakieta (Część XVI §98)

---

### 52. Siła państwa — pełny model

**52.1.** Armia w polu — suma mocy jednostek
- Każda jednostka ma **moc bojową** (M) — widoczna na karcie jednostki
- Siła państwa liczy **sumę M** wszystkich jednostek w twoim imperium
- Jednostki oblężnicze w polu — **0** w tej sumie (tylko w oblężeniu)
- Po bitwie — siła spada proporcjonalnie do strat

**52.2.** Wygrane bitwy — bonus do siły państwa
- Za każdą **pokonaną** armię wroga — dodajesz sumę mocy wroga **sprzed walki**
- Nie liczy się własna strata — tylko siła pokonanego
- Kumuluje się przez całą grę — historia zwycięstw buduje prestiż
- Przegrana — **nie odejmuje** punktów (tylko tracisz jednostki z armii)

**52.3.** Inne składniki siły państwa
- **Ludność** — suma mieszkańców wszystkich miast
- **Miasta** — liczba i wielkość osiedli
- **Terytorium** — heksy pod twoją kontrolą
- **Budynki, technologie, ulepszenia pól** — rozwój cywilizacyjny

**52.4.** Czego **nie** wlicza się do siły państwa
- **Mnożnik epoki** — osobna mechanika w walce, nie w tej liczbie
- **Cuda świata** — dają bonusy, ale **nie** dodają do siły państwa
- Tymczasowe buffy bitewne — tylko na czas walki
- Szacunek u dyplomatów (Respekt) — powiązany, ale osobna liczba (Część XII §74)

**52.5.** Siła państwa a zwycięstwo dominacją
- Warunek: twoja siła **> 50%** sumy siły wszystkich graczy w ostatniej epoce
- v1.0: epoka Żelaza = próg końcowy (Część XVI §97)
- Duża liczba na mapie — szybki podgląd (Część III §20)
- Tooltip — czy gracz widzi rozbicie składników (stan UI)

---

### 53. Surowce — stan v1.0

**53.1.** Katalog surowców — co istnieje w danych
- Drewno, kamień, miedź, żelazo, sól… — wpisy w plikach gry
- **Dostęp** = masz technologię LUB ulepszenie na złożu (model boolean)
- Złoże rezerwuje heks — nie budujesz farmy na złożu miedzi
- Ukryte złoża — odkrywane w kolejnych epokach (Część II §11)

**53.2.** Co gracz **widzi** vs co silnik **egzekwuje**
- UI v1.0: głównie **ikona dostępności** (masz / nie masz surowiec)
- Koszt rekrutacji i budowy — **złoto + ludność + tech**, nie odejmowanie drewna z magazynu
- JSON może pokazywać wymagania surowcowe — **referencja** na przyszłość
- 🔮 v2.0: pełne magazyny, zużycie per budowa, handel surowcami

**53.3.** Dostęp do złoża a dyplomacja
- Możesz **negocjować dostęp** do złoża u sąsiada (Część XII §78)
- Cennik w punktach handlowych — ważność rośnie w wojnie
- Bez dostępu — nie produkujesz z tego heksu, nawet w swoim terytorium (do epoki/tech)

**53.4.** Strategia gracza — surowce w v1.0
- Priorytet: **technologia** odblokowująca złoże, potem ulepszenie (kopalnia, tartak…)
- Nie planuj gospodarki wokół magazynów — ich jeszcze nie ma
- Złoża na mapie — planuj miasta i posterunki pod dostęp
- Pełna produkcja surowców — roadmap v2.0 (Apendyks E.1)

---

## Część IX — Nauka i epoki

### 54. Drzewko technologii

**54.1.** Jak otworzyć drzewko — ekran Nauka
- Klik na **Badania** na pasku zasobów lub ikonę nauki
- Pełnoekranowe **overlay** z gałęziami technologii
- Zamknięcie — powrót na mapę bez utraty postępu
- Skrót klawiaturowy (jeśli przypisany — Apendyks D.94)

**54.2.** Widoczność — tylko bieżąca epoka
- Widzisz tech z **aktualnej epoki** i wcześniejsze (już zbadane)
- Przyszłe epoki — ukryte lub wyszarzone do awansu
- Start w Brązie — tech Kamienia automatycznie zbadane (kaskada, Część I §6.1)
- Scroll / zoom — nawigacja po dużym drzewku (layout SVG)

**54.3.** Stany węzłów — co oznaczają kolory
- **Zbadane** — pełny kolor, ikona „gotowe"
- **Dostępne** — możesz kliknąć i ustawić jako cel badania
- **Wyszarzone** — brak wymagań (tech poprzednik lub epoka)
- **Ukryte** — jeszcze nie odkryte w tej epoce

**54.4.** Jedno kliknięcie = cel badania
- Klik na dostępną tech — staje się **aktywnym** badaniem
- Zmiana celu — kolejny klik (postęp do poprzedniej **nie** przepada w v1.0 — sprawdź stan)
- Brak celu — chip Wykonaj blokuje koniec tury
- Tooltip — koszt w punktach nauki, co odblokowuje

**54.5.** Layout gałęzi vs logika liniowa
- **Wizualnie** — gałęzie i połączenia (drzewo SVG)
- **W logice** — często liniowe wymagania AND (tech A **i** tech B)
- Przykład łańcucha: Murarstwo → Obrona → Mury miejskie
- Pełna mapa zależności — §56 i apendyks B (gdy powstanie)

---

### 55. Epoki i przejścia

**55.1.** Lista epok v1.0 — Kamień, Brąz, Żelazo…
- **Kamień** — start, podstawowe jednostki i budynki
- **Brąz** — miedź, lepsze bronie, wczesna dyplomacja
- **Żelazo** — katapulta, silniejsza armia, próg zwycięstwa dominacji
- **Średniowiecze i dalej** — cuda R, absolut Antyku (Część XV)

**55.2.** Co odblokowuje nowa epoka
- **Jednostki** — nowe typy w koszarach (tylko po tech, nie „starter-pack")
- **Budynki** — wyższe poziomy, specjalne (Spichlerz, mury…)
- **Ulepszenia terenu** — irygacja, kopalnie, drogi
- **Cuda wyścigowe (R)** — dostępne od określonej epoki

**55.3.** Jak awansować epokę — warunki
- Zbadanie **kluczowych** technologii epoki (progi w danych gry)
- Pasek postępu epoki na pasku zasobów (prawa strona, §15.1)
- Awans — jednorazowe odblokowanie gałęzi drzewka
- Cywilizacje z niestandardowym startem — wyjątki (Inkowie: Kamień+Żelazo, Część XIII §83)

**55.4.** Epoka startowa w kreatorze — skutki
- Start Brąz — wszystkie tech Kamienia już zbadane
- Start Żelazo — Kamień + Brąz w kaskadzie
- Jednostki **tylko** przez odblokowane tech — brak „pakietu startowego"
- Tempo gry nie zmienia epoki — tylko koszt badań (§51.2)

---

### 56. Tech odblokowuje — mapa zależności

**56.1.** Cztery kategorie odblokowań
- **Budynki** — np. Koszary wymaga Wojskowości
- **Ulepszenia terenu** — Farma, Tartak, Fort…
- **Surowce / złoża** — widoczność miedzi, żelaza na górach
- **Jednostki** — każdy typ ma wymaganą tech

**56.2.** Przykłady łańcuchów — od Murarstwa do murów
- Murarstwo → budowa murów miejskich → wyższa obrona w oblężeniu
- Metalurgia → broń żelazna → lepsze jednostki wręcz
- Pisanie → biblioteka → więcej nauki z miasta
- Pełna tabela — przy pisaniu poradnika z `buildings.json` + drzewko tech

**56.3.** Tech a handel dyplomatyczny
- **Punkty tech** — można wymieniać w handlu (koszt = koszt badania w PN, Część XII §78)
- Całej technologii **nie** oddajesz — tylko punkty postępu
- Wojna — dostęp do złoża wroga ważniejszy w cenniku

**56.4.** Planowanie badań — strategia gracza
- Wcześnie: żywność i rozwój miasta (rolnictwo, osadnictwo)
- Przed wojnou: jednostki i mury
- Środek gry: epoka Żelaza — oblężenie i katapulta
- Nauka: ścieżka do rakiety (zwycięstwo naukowe, §98)

---

## Część X — Walka

### 57. Wejście w walkę (preBattle)

**57.1.** Ekran przed bitwą — cztery opcje
- **Auto-walka** — szybka symulacja na mapie strategicznej
- **Bitwa ręczna** — przejście do pola 3D z pełną kontrolą
- **Wycofaj** — anuluj atak, jednostka zostaje, **ruch zachowany**
- **Zapisz grę** — quick save przed decyzją (Apendyks D.100)

**57.2.** Skróty klawiaturowe na preBattle
- **Enter** — potwierdź wybór (domyślnie Auto lub ostatni wybór)
- **Escape** — wycofaj się bez strat
- Inne skróty — lista w Apendyks D (§101)

**57.3.** Wycofanie bez strat — kiedy działa
- Klik **Wycohaj** przed rozpoczęciem walki — zero strat
- Jednostka atakująca **nie traci ruchu** — możesz cofnąć się lub czekać
- Po wyborze Auto lub Bitwa ręczna — decyzja nieodwracalna w tej turze
- Oblężenie miasta z murem — inny flow (§66, bez preBattle przy „Oblężaj")

**57.4.** Miasto z murem — szturm vs oblężenie
- **Bez wyboru szturmu** — nie wchodzisz w preBattle polową
- Menu: **Oblężaj** / **Szturm** / **Anuluj** (Część XI §66)
- Szturm — preBattle lub auto jak bitwa polowa
- Oblężaj — panel oblężenia, bez natychmiastowej walki 3D

**57.5.** Pozycje jednostek — start z mapy
- **Brak fazy rozstawiania** — armie stoją tam, gdzie na mapie strategicznej
- Posiłki w promieniu 1 heks — wchodzą automatycznie (Część IV §26)
- Teren heksu — przenosi bonusy na pole bitwy (§62)

---

### 58. Atak wrogiego miasta z mapy

**58.1.** Warunki wejścia w atak
- Twoja jednostka **zaznaczona** i **obok** miasta (odległość 1 heks)
- Miasto **wroga** — dyplomacja w stanie wojny lub neutralnym (casus)
- Garnison wroga — wchodzi do obrony automatycznie
- Klik miasta — menu kontekstowe z opcjami

**58.2.** Miasto **z murem** — trzy opcje
- **Oblężaj** — rozpocznij oblężenie (Część XI)
- **Szturm** — natychmiastowa próba zdobycia (preBattle / auto)
- **Anuluj** — powrót bez akcji

**58.3.** Miasto **bez muru** — zdobycie z marszu
- Słaba obrona — moasto może paść bez pełnej bitwy (reguły silnika)
- Silna obrona — preBattle lub auto-walka jak bitwa polowa
- Po zdobyciu — zmiana właściciela, populacja, budynki (status v1)

**58.4.** Co gracz powinien sprawdzić przed atakiem
- Siła garnisonu i muru (panel wroga — jeśli zwiad)
- Własna żywność wojska — głód osłabia przed walką
- Posiłki wroga w promieniu 1 — mogą dołączyć
- Machiny oblężnicze — potrzebne do murów (Część XI §69)

---

### 59. Auto-walka (mapa strategiczna)

**59.1.** Jak działa szybka symulacja
- Silnik liczy straty wg wzoru **coef v2b** (Apendyks C.5)
- Uwzględnia: moc jednostek, countery, teren, liczebność
- Wynik w sekundach — podsumowanie strat obu stron
- Ocalałe jednostki wracają na mapę (§65)

**59.2.** Kiedy warto wybrać Auto
- Przewaga liczebna i typowa (countery po twojej stronie)
- Drobne potyczki — oszczędność czasu
- AI słabsze — szybkie czyszczenie mapy
- Test siły przed większą bitwą ręczną

**59.3.** Kiedy Auto jest ryzykowne
- Równy lub słabszy skład — duża wariancja strat
- Wroga kawaleria vs twoja piechota — countery liczą się
- Oblężnicze w polu — moc armii zaniżona w auto (M=0 w polu)
- Ważna jednostka unikalna — lepiej bitwa ręczna

**59.4.** Auto a oblężenie i miasta
- Szturm na miasto — może użyć auto zamiast 3D
- Oblężanie **nie** — to osobny tryb (Część XI)
- Wynik auto — wpływa na siłę państwa (§52.2)

---

### 60. Bitwa ręczna 3D

**60.1.** Layout ekranu bitwy
- **Minimapa** — widok z góry, pozycja kamery
- **Panel rozkazów** — wybrane jednostki, rozkazy
- **Pasek** u dołu — jednostki, morale, amunicja (wg typu)
- Styl wizualny — spójny z mapą strategiczną (TW v1.0)

**60.2.** Sterowanie — mysz i klawiatura
- **Mysz** — zaznaczanie, ruch, atak
- **S / P / H / M** — skróty formacji / postawy (wg implementacji)
- **Ctrl+M** — menu lub mapa
- **Przeciąganie roster** — wybór wielu jednostek z listy

**60.3.** Efekty wizualne v1.0
- Łuk vs miecz — odróżnienie dystansu i wręcz
- **Linie rozkazów** — gdzie idzie jednostka
- Efekty trafień — bez pełnej fizyki (uproszczenie)
- 🔮 C2v2 UX — planowane ulepszenia po v1.0

**60.4.** Bitwa ręczna a wynik strategiczny
- Zwycięstwo — wróg znika lub ucieka z mapy
- Porażka — twoje jednostki giną lub są crippled
- Remis / wycofanie — reguły silnika (status v1)
- Po bitwie — ekran podsumowania (§65)

---

### 61. Macierz typów i countery

**61.1.** Role jednostek — pięć głównych typów
- **Wręcz** — piechota, falanga, gwardia
- **Dystans** — łucznicy, procarze
- **Kawaleria** — szybki uderzeniowy, charge
- **Oblężnicza** — katapulta, taran (tylko oblężenie / specjalne)
- Hybrydy — unikalne cywilizacje (Część XIII §85)

**61.2.** Counter ×1,5 i bonus vs typ
- Atak **skuteczny** vs słaby typ wroga — ok. **×1,5** obrażeń
- Dodatkowy **bonus procentowy** z definicji jednostki
- **hit_base** i **dmg_scale** — parametry w danych (Apendyks B.6)
- Gracz widzi: ikony counter / słabszy vs silniejszy (tooltip)

**61.3.** Balans Panel-C — status v1.0
- Macierz w Excelu → eksport do gry
- 🟡 **W toku** — kolejność: macierz → auto-walka → oblężenie
- Zmiany balansu — decyzje w `docs/decyzje/` (C-BAL-Q1)
- Nie polegaj na starych liczbach z wiki spoza rejestru

**61.4.** Jak czytać macierz jako gracz
- Piechota dobrze vs kawaleria (przykład — sprawdź aktualną tabelę)
- Łucznicy słabi w zwarciu — trzymaj dystans
- Oblężnicze bez eskorty — łatwy cel kawalerii
- Pełna tabela — Apendyks B.6 po sign-off Panel-C

---

### 62. Moc jednostki (M) i straty

**62.1.** Składniki mocy bojowej M
- **Zdrowie** — wytrzymałość na obrażenia
- **Charge** — uderzenie kawalerii
- **Missile** — siła ostrzału dystansowego
- M_pole — suma używana w auto-walka i sile państwa

**62.2.** Jednostki oblężnicze w armii polowej
- **M = 0** w sumie armii na mapie — nie liczą się do siły państwa w polu
- W oblężeniu — osobne reguły (machiny, taran, §69)
- Katapulta — epoka **Żelazo** (§63.1)
- Eskorta oblężniczych — obowiązkowa w praktyce gracza

**62.3.** Obrażenia z definicji jednostki
- Każdy typ ma bazowe **obrażenia** w danych gry
- Skalowanie poziomem / epoką / ulepszeniami tech
- Straty — proporcjonalne do M i counterów
- Karta jednostki [H] — podgląd statów (Część IV §22)

**62.4.** Morale i utrzymanie a skuteczność
- Niskie morale — gorsza walka (jeśli wpięte w v1)
- Utrzymanie w ¤ — nie wpływa w trakcie bitwy, ale przed nią (głód)
- Jednostki unikalne — często wyższe M za ten sam koszt

---

### 63. Teren na polu bitwy

**63.1.** Rzeka — kara atakującego
- Atak **przez** lub **z** rzeki — obrażenia ok. **×0,75**
- Obrona na brzegu — korzystna dla obrońcy
- Mapa strategiczna — heks z rzeką przenosi regułę
- Unikaj szturmu przez rzekę bez przewagi

**63.2.** Wzgórze i góra — bonus obrony
- **Wzgórze** — obrona ok. **×1,5**
- **Góra** — obrona ok. **×1,75**
- Atakujący z dołu — trudniejsze zdobycie pozycji
- Jednostki dystansu — często bonus na wzniesieniu (status per jednostka)

**63.3.** Las, równina, miasto — inne modyfikatory
- Las — cover dla dystansu (wg balansu Panel-C)
- Miasto / mur — wysoka obrona w szturmie
- Morze — tylko jednostki morskie (jeśli w walce morskiej v1)
- Tooltip preBattle — podsumowanie bonusów terenu

**63.4.** Teren strategiczny vs taktyczny
- **Strategia** — wybór heksu przed walką na mapie
- **Taktyka** — w 3D pozycjonowanie w granicach sceny
- Auto-walka — bierze teren heksu startowego
- Bitwa ręczna — część terenu wstępnie ustawiona z mapy

---

### 64. Jednostki specjalne i machiny

**64.1.** Katapulta — epoka Żelazo
- Odblokowanie tech — nie wcześniej
- Rola: niszczenie murów i garnizonu w **oblężeniu**
- W polu — słaba, M=0 w sumie armii
- Koszt rekrutacji — złoto + ludność + tech (§47.2)

**64.2.** Taran i wieża oblężnicza
- Budowane / rekrutowane **w kontekście oblężenia**
- Przyspieszają zniszczenie muru lub szturm
- Przepadają przy odwrocie z oblężenia (Część XI §72)
- AI używa wg siły armii (§71)

**64.3.** Koszt rekrutacji — styl Civ v1.0
- **Złoto** ze skarbca imperium
- **Ludność** — mieszkańcy miasta
- **Technologia** — wymagane odblokowanie
- Skala z **epoką** — droższe i silniejsze jednostki później

**64.4.** Jednostki unikalne cywilizacji w walce
- Falanga, Rydwan, Lama… — Część XIII §85
- Często lepsze countery w swojej niszy
- Ten sam system M i counterów co standardowe
- Tech i koszty — osobno w danych cywilizacji

---

### 65. Powrót z bitwy

**65.1.** Ocalałe jednostki na mapę
- Przetrwałe wracają na **heks bitwy**
- Rannne — obniżone HP do uzupełnienia (regeneracja w polu / mieście)
- Zniszczone — znikają z mapy i z siły państwa
- Posiłki — wracają do swoich heksów jeśli ocalały

**65.2.** Podsumowanie po bitwie
- Lista strat: twoje vs wroga
- Doświadczenie / bonusy cywilizacji (jeśli wpięte)
- Łup — status v1.0 (złoto, punkty siły)
- Przycisk **Kontynuuj** — powrót na mapę strategiczną

**65.3.** Fan-out — pierścień po bitwie
- Jednostki rozkładają się na **pierścień** wokół heksu bitwy
- Reguła **M×W+** — decyzja B (szczegóły w apendyksie po napisaniu)
- Unika nakładania wielu armii na jednym heksie
- Ważne przy łańcuchu bitew w tej samej turze

**65.4.** Po bitwie — co dalej na mapie
- Zdobyte miasto — przejście do właściciela lub oblężenia
- Wrogi ocalały — ucieczka lub kontraatak AI
- Koniec ruchu — jednostka mogła zużyć ruch wchodząc w walkę
- Zapis — quick save z preBattle nadal dostępny przed walką, nie po

---

## Część XI — Oblężenie miast

### 66. Start oblężenia

**66.1.** Menu przy murze — Oblężaj / Szturm / Anuluj
- Pojawia się gdy stoisz **obok** wrogiego miasta **z murem**
- **Oblężaj** — rozpoczynasz oblężenie bez natychmiastowej bitwy 3D
- **Szturm** — próba zdobycia od razu (preBattle / auto)
- **Anuluj** — cofnięcie bez konsekwencji

**66.2.** Oblężaj **nie** woła preBattle
- Inny tryb niż bitwa polowa — panel oblężenia na mapie
- Jednostki zostają w **obozie oblężniczym** wokół miasta
- Możesz kontynuować grę — oblężenie trwa tury
- Szturm później — osobna decyzja z panelu (§73)

**66.3.** Warunki rozpoczęcia oblężenia
- Wojna z właścicielem miasta (lub brak traktatu)
- Wystarczająca armia — AI ocenia siłę (§71)
- Miasto musi mieć **mur** — bez muru inne reguły (Część X §58)
- Terytorium — stoisz na wrogiem lub neutralnym heksie przy murze

**66.4.** Obóz oblężniczy 3D — co widzisz
- Wizualizacja armii wokół miasta na mapie strategicznej
- Status wdrożenia — sprawdź w buildzie roboczym
- Ikony machin, zapasów, postępu muru
- Klik obozu — panel §67

---

### 67. Panel oblężenia (gracz)

**67.1.** Informacje w panelu — stan oblężenia
- **Mur** — aktualne punkty wytrzymałości / maksimum
- **Garnizon** — liczba i siła obrońców
- **Machiny** — ile masz i postęp budowy/niszczenia
- **Zapasy** miasta — żywność obrońców (głód → kapitulacja)

**67.2.** Layout overlay na mapie
- Panel **na** mapie strategicznej — nie osobna scena 3D (v1.0)
- Przezroczyste tło — widać miasto i armie
- Przyciski akcji: szturm, dobudowa machin, odwrót
- Aktualizacja co turę po końcu tury

**67.3.** Akcje gracza w trakcie oblężenia
- **Czekaj** — atrycja muru i głód miasta (§68)
- **Szturm** — gdy mur osłabiony lub desperacja
- **Dobuduj machiny** — koszt w pracy / złocie / turach
- **Odwrót** — §72, bez kary ruchu, utrata machin

**67.4.** Oblężenie a koniec tury
- Oblężenie **nie blokuje** końca tury (zwykle)
- Wyjątki — chip dyplomacji lub inne blocking (katalog A1-Q9)
- AI obrońcy — reaguje w turze wroga

---

### 68. Głód i kapitulacja

**68.1.** Magazyn miasta = 0 — alert i transfer
- Gdy zapasy żywności **w mieście** się skończą — alert w panelu wydarzeń
- **Kapitulacja** — miasto przechodzi na ciebie (transfer właściciela)
- Populacja i budynki — wg reguł v1 (status przejęcia)
- Nie musisz szturmować — głód kończy oblężenie

**68.2.** Atrycja garnizonu — ok. 8% na turę
- Obrońcy tracą siłę co turę oblężenia (model atrycji)
- Milicja i garnizon — wchodzą w ten sam pool (§69)
- Machiny wroga — przyspieszają spadek muru, nie zastępują głodu
- Kombinacja: mur + głód — najszybsze zdobycie

**68.3.** **Brak** auto-upadku od HP samego miasta
- Miasto **nie pada** tylko dlatego, że „HP miasta" = 0
- Jedyny automatyczny koniec oblężenia po stronie obrońcy — **głód** (§68.1)
- Szturm — jedyna droga do zdobycia „siłą" przed głodem
- Ważne dla gracza: cierpliwość vs szturm kosztowny

**68.4.** Strategia oblężnika — głodzenie vs szturm
- Duża armia + machiny — szybszy mur, potem szturm
- Mała armia — głodzenie tygodniami, blokada handlu
- Sprawdź zapasy **wroga** — jeśli UI pokazuje (status)
- Własna żywność wojska — utrzymuj magazyn państwa (Część VIII §50)

---

### 69. Milicja i obrońcy

**69.1.** Milicja — 20% populacji miasta
- Automatycznie przy oblężeniu / szturmie
- Siła bojowa = **połowa** normalnej jednostki (50% M)
- Nie rekrutujesz ręcznie — liczy się populacja miasta
- Duże miasto — więcej milicji, trudniejszy szturm

**69.2.** Garnizon stacjonujący
- Jednostki wroga **na heksie miasta** — pełna siła M
- Wojsko w mieście podnosi też **prawo** obrońcy (jeśli twoje miasto — Część VI §36)
- Po stronie atakującego — zniszcz garnizon przed lub w szturmie
- Milicja + garnizon — suma w obronie

**69.3.** Kiedy milicja wystarczy obrońcy
- Mała armia oblężnika — długie oblężenie opłaca się obrońcy
- Szturm na pełnym murze + milicja — wysokie straty atakującego
- AI broniący — dokłada jednostki jeśli może (§71)

**69.4.** Po zdobyciu — co z milicją
- Milicja **znika** — nie przechodzi na twoją stronę
- Garnizon wroga — zniszczony lub ocalały w ucieczce
- Nowy garnizon — ty rekrutujesz po przejęciu

---

### 70. Machiny oblężnicze — tempo

**70.1.** Skala z wielkością armii — nie 1/turę flat
- Większa armia oblężnicza — **szybsze** niszczenie muru
- Mała grupa — wolny postęp, ryzyko kontrataku
- Formuła — Apendyks C.6 (po napisaniu)
- Gracz widzi: pasek postępu muru co turę

**70.2.** Typy machin — katapulta, taran, wieża
- **Katapulta** — epoka Żelazo, ostrzał z dystansu
- **Taran** — uderzenie w bramę / mur
- **Wieża** — szturm po osiągnięciu wysokości muru
- Koszt rekrutacji / budowy w oblężeniu — złoto + tury

**70.3.** Kiedy budować machiny
- Mur wysoki — szturm bez machin bardzo kosztowny
- AI silny obrońca — machiny obowiązkowe (§71.1)
- Czas — machiny vs głód: co szybciej zdobędzie miasto
- Utrata machin przy odwrocie — §72

**70.4.** Machiny a bitwa ręczna
- Szturm z machinami — bonus vs mur w preBattle / 3D (status)
- W polu poza oblężeniem — katapulta słaba (Część X §64)
- Pełna synergia — oblężenie → osłabiony mur → szturm

---

### 71. AI oblężenia

**71.1.** Bardzo silna armia AI → szturm od razu
- AI porównuje M armii vs obrona muru + garnizon
- Przewaga duża — wybiera **Szturm** z menu startu
- Gracz obrona — przygotuj garnizon i milicję
- Trudność — bonusy produkcji AI (Część XIV §89)

**71.2.** Średnia armia → oblężenie + machiny
- **Oblężaj** najpierw — budowa machin
- Cierpliwe niszczenie muru — kilka tur
- Potem szturm lub głodzenie
- Gracz może kontratakować obóz oblężniczy

**71.3.** Słaba armia → głodzenie
- Za mało siły na szturm — blokada i atrycja
- Czeka na głód miasta gracza
- Remedium gracza: sortie, posiłki, zapasy żywności w mieście
- Spichlerz w oblężonym mieście — przedłuża opór

**71.4.** AI a odwrót z oblężenia
- AI też może odwrócić się bez kary — machiny przepadają
- Słabszy AI — częściej rezygnuje przy kontrataku
- Agresja profilu nacji — Część XIV §87

---

### 72. Odwrót z oblężenia

**72.1.** Wolny odwrót bez kary ruchu
- Przycisk **Odwrót** w panelu oblężenia
- Armia wraca na mapę — może ruszyć w tej turze jeśli został ruch
- Miasto zostaje u wroga — oblężenie kończone
- Bez utraty jednostek piechoty (standardowo)

**72.2.** Machiny przepadają przy odwrocie
- Zbudowane / zrekrutowane machiny — **znika**ją
- Strategiczny koszt przedwczesnego odwrotu
- Planuj oblężenie — czy stać cię na utratę katapult
- Wyjątki — status v1 (czy część wraca)

**72.3.** Kiedy warto się wycofać
- Kontratak wroga z posiłkami
- Własny głód wojska — magazyn państwa pusty
- Lepszy cel — inne miasto pilniejsze
- Pokój dyplomatyczny — w trakcie negocjacji (Część XII)

---

### 73. Szturm i obrona — reguły szczegółowe

**73.1.** Playtest 3v3 — preset i szanse
- Scenariusz testowy: 3 jednostki vs 3 + mur
- **preBattle** — jeden pasek szans / podsumowanie przed 3D
- Balans szturmu — iteracja po Panel-C
- Gracz: nie oczekuj dokładnych % w UI v1 — ogólna ocena

**73.2.** Bonusy bojowe only — bez magii spoza walki
- Liczą się: M, countery, teren, mur, milicja, machiny
- **Nie** liczą się w szturmie: cuda (bezpośrednio), dyplomacja
- Epoka — mnożnik osobno od siły państwa
- Spójność z auto-walka (§59)

**73.3.** Pierścień fan-out po szturmie
- Zwycięzca rozkłada jednostki na heksy wokół miasta
- Unika zablokowania wejścia do miasta
- Ta sama reguła co po bitwie polowej (Część X §65.3)
- Oblężenie zdobyte głodem — jednostka wchodzi na heks miasta

**73.4.** Obrona gracza — checklist
- Mury + garnizon + wojsko w mieście (prawo vs bunt osobno)
- Zapasy żywności w mieście / państwie
- Posiłki w promieniu 1 heks
- Dyplomacja — sojusznik może zaatakować oblężnika

---

## Część XII — Dyplomacja

### 74. Model relacji

**74.1.** Dwie osie — Zaufanie i Szacunek (Respekt)
- **Zaufanie** — jak bardzo ci „wierzą" (historia, handel, łamanie traktatów)
- **Szacunek** — jak bardzo cię „boją/szanują" (siła państwa, nie cuda)
- **Relacja** — wynikowa liczba używana do progów akcji
- Widoczne w panelu dyplomacji przy każdej nacji

**74.2.** Wartości startowe — nowe spotkanie
- **Zaufanie 20** — neutralne, ostrożne
- **Szacunek 30** — umiarkowany respekt
- Różne dla barbarzyńców i miast-państw (status)
- Zmiana co turę — handel, wojna, prezenty, przemarsz

**74.3.** Szacunek z siły państwa — nie z cudów
- Twoja **siła państwa** (Część VIII §52) wpływa na szacunek
- **Cuda** dają bonusy ekonomiczne/dyplomatyczne, ale **nie** szacunek bezpośrednio
- Rozwój armii i zwycięstwa — najszybszy wzrost szacunku
- Słabe państwo — niski szacunek mimo bogactwa

**74.4.** Relacja a zachowanie AI
- Wysoka relacja — handel, pakt, sojusz możliwy
- Niska — ultimatum, wojna, odmowa audiencji
- Profil cywilizacji — modyfikuje progi (Część XIV §87)
- Pełna tabela progów — §77 i Apendyks B.1

---

### 75. Lista dyplomatów

**75.1.** Tylko **spotkane** nacje — mgła wojny
- Dopóki nie **odkryjesz** nacji na mapie — nie ma jej na liście
- Zwiadowca, granica terytorium, pierwszy kontakt handlowy
- Barbarzyńcy — osobna kategoria (§90)
- Po zniszczeniu nacji — znika z listy

**75.2.** Jeden wpis = jeden właściciel / miasto-państwo
- **Miasto-państwo** w klastrze — osobny wpis (Kapua, Sparta…)
- Nie mylić z typem cywilizacji (Grecy vs konkretne miasto)
- Wojna z jednym miastem-państwem ≠ wojna z całym klasterem (reguły v1)
- Nazwy z kreatora — Część I §4

**75.3.** Panel dyplomacji — nawigacja
- Otwarcie z paska zasobów (§15.5) lub ikony na mapie
- Lista + szczegóły wybranej nacji
- Flagi relacji: pokój, wojna, sojusz, handel trwający
- Sortowanie — wg relacji, odległości (status UI)

**75.4.** Kontakt pierwszy — co się dzieje
- Powiadomienie „Spotkano nową cywilizację"
- Opcjonalna audiencja — nie blocking (zwykle)
- Domyślne relacje startowe §74.2
- Wiki‑S: „Spotkanie w mgle — dopiero wtedy handlujesz"

---

### 76. Audiencja (król ↔ król)

**76.1.** Pełny panel audiencji v1.0
- Ekran rozmowy z władcą innej nacji
- Portret, nazwa, aktualna relacja, zaufanie, szacunek
- Lista **akcji** dostępnych wg progów relacji
- Zamknięcie — powrót do mapy

**76.2.** Władcy główni — 12 akcji
- Handel, pakt o nieagresji, sojusz, prezent, ultimatum…
- Pełna lista z progami — §77.3 i Apendyks B.1
- Niedostępne akcje — wyszarzone z tooltipem „wymaga relacji X"
- Historia ostatnich umów — status v1

**76.3.** Władcy poboczni — 5 akcji (progi −20 pkt)
- **Miasta-państwa**, mniejsze frakcje
- Te same typy akcji, ale **wyższe** progi (−20 punktów relacji)
- Mniej opcji łącznie — 5 zamiast 12
- Gracz: traktuj jako trudniejszy handel, łatwiejszy ultimatum wojskowy

**76.4.** Audiencja a chip Wykonaj
- Oczekująca propozycja dyplomatyczna — może blocking (katalog A1-Q9)
- Odpowiedz: akceptuj / odrzuć / kontrpropozycja (status v1)
- W trakcie wojny — część akcji niedostępna

---

### 77. Progi relacji — tabela akcji

**77.1.** Podstawowe progi — handel, pakt, sojusz
- **Handel** ≥ 100 relacji
- **Pakt o nieagresji (NAP)** ≥ 110
- **Sojusz** > 150
- **Prezent** ≥ 30 (jednorazowy boost zaufanie)

**77.2.** Granice, trybut, ultimatum
- **Ustalenie granic** ≥ 100
- **Trybut:** szacunek > 70 **oraz** min. **10 ¤/turę** z twojego skarbca
- **Ultimatum:** twoja siła ≥ **1,3×** siła wroga + reparacje ≥ **20 ¤**
- **Wchłonięcie / podporządkowanie:** szacunek ≥ 90 (status wdrożenia)

**77.3.** Wojna i zerwanie traktatów
- Deklaracja wojny — zawsze możliwa (kary relacji)
- Zerwanie paktu/sojuszu — spadek zaufania, casus belli u wroga
- Pokój — negocjacje po warunkach (status v1)
- Pełna tabela — Apendyks B.1

**77.4.** Jak podnieść relację — praktyka gracza
- **Handel** regularny — nadmiar PN → zaufanie (§78.3)
- **Prezent** — szybki boost, koszt złota
- **Unikaj** przemarszu bez zgody (−5 zaufanie/turę, §79)
- **Zwycięstwa** — szacunek rośnie, ultimatum łatwiejsze

---

### 78. Handel i punkty wartości (PN)

**78.1.** Co to jest punkt handlowy (PN)
- **1 PN = 1 żywność** w wymianie (ekwiwalent bazowy)
- **Tech** — koszt w PN = koszt badania w punktach nauki
- Złoto — przelicznik w umowie (status UI)
- Bilans umowy — musi się zgadzać (± tolerancja)

**78.2.** Czego **nie handlujemy** w v1.0
- **Ulepszenia terenu**, **budynki**, **hex terytorium**
- **Cała technologia** — tylko punkty postępu tech
- **Kultura**, **religia** — osobno 🔮 v2 (Apendyks E.3)
- Jednostki, cuda — nie w handlu v1

**78.3.** Nadmiar PN → wzrost zaufania
- Za każde **100 PN** nadwyżki w korzystnej umowie → **+1 zaufanie**
- **Maksimum +5 zaufania na turę** z handlu
- Strategia: długoterminowy partner handlowy
- Wzór — Apendyks C.7

**78.4.** Dostęp do złoża — cennik i wojna
- Możesz kupić **prawo dostępu** do złoża na terytorium sąsiada
- Cennik w PN — zależy od typu surowca
- **W wojnie** — wartość dostępu rośnie (strategiczne)
- Bez umowy — nie wydobywasz (model boolean v1, Część VIII §53)

---

### 79. Wojna i pokój

**79.1.** Deklaracja wojny — skutki
- Natychmiastowy stan **wojny** — banery na mapie (§19.1)
- Spadek zaufania u innych nacji (efekt domina — status)
- **Casus belli** — AI pamięta zerwanie traktatu (profil)
- Armia może atakować jednostki i miasta wroga

**79.2.** Kary za zerwanie traktatów
- Zerwanie **paktu** lub **sojuszu** przed terminem — duży minus zaufanie
- Trudniejsze negocjacje z resztą świata
- Gracz: nie podpisuj NAP jeśli planujesz atak za 2 tury
- Wyjątki — ultimatum wroga (§77.2)

**79.3.** Pokój — zakończenie wojny
- Negocjacje w audiencji — warunki (status wdrożenia v1)
- Reparacje, granice, trybut — powiązane z ultimatum
- Zawieszenie broni — 🔮 v2 / częściowo v1.1 (§80)
- Po pokoju — relacja powoli rośnie z handlu

**79.4.** Wojna a ekonomia gracza
- Utrzymanie armii + głód — magazyn żywności (Część VIII)
- Handel z wrogiem — wstrzymany
- Sojusznicy — mogą wejść po twojej stronie (§80.2)
- Zwycięstwo dominacji — liczy siłę po wojnach (§52)

---

### 80. Przemarsz i terytorium

**80.1.** Nieautoryzowany przemarsz — kara co turę
- Armia na **cudzym terytorium** bez zgody → **−5 zaufanie na turę**
- Dotyczy każdej nacji, której terytorium naruszasz
- Sojusznik — zwykle **zezwolenie** implicit (status traktatu)
- Planuj trasy — drogi wzdłuż granic

**80.2.** Prośba o przemarsz — audiencja
- Akcja dyplomatyczna — „Przemarsz" (próg relacji w B.1)
- Akceptacja — brak kary za tę trasę / okres
- Odmowa — omijaj terytorium lub ryzykuj wojna
- AI — często odmawia w niskiej relacji

**80.3.** Terytorium a posterunki i forty
- Twój posterunek — **twoje** terytorium (5 heksów)
- Fort — 10 heksów (Część II §9)
- Wrogie terytorium — tylko w wojnie lub z przemarszem
- Zakończenie tury na cudzym hexie — liczy się kara

**80.4.** Przemarsz a barbarzyńcy
- Obozy barbarzyńców — nie „nacje" z przemarszem
- Wejście na hex obozu — walka, nie dyplomacja
- Neutralne lądy — bez kary (poza cudzym terytorium)

---

### 81. Dyplomacja v1.1 (Tier 2–3) — roadmap

**81.1.** T1A — trybut ze skarbca co turę
- Automatyczny transfer **¤/turę** po umowie trybutu
- Rozszerzenie §77.2 — pełna implementacja
- Gracz v1.0 — sprawdź co działa w buildzie

**81.2.** T2 — dwa typy sojuszu
- **Sojusz defensywny** — wchodzi gdy **ciebie** atakują
- **Sojusz pełny** — wspólna wojna ofensywna
- v1.0 — jeden typ sojuszu (§77.1) — verify in game

**81.3.** T3A — handel jednorazowy
- Duża wymiana PN jednorazowo — event dyplomatyczny
- Inne progi niż handel ciągły
- 🔮 po v1.0 — Apendyks E

**81.4.** T4B — fazy wdrożenia
- Kolejność: trybut → sojusze → handel jednorazowy
- Decyzje w `docs/decyzje/` — D3-v1.1
- Poradnik v1 — opisuje **minimum** działające dziś + roadmap

---

## Część XIII — Cywilizacje

### 82. Roster v1.0

**82.1.** Dziewięć typów aktywnych w wersji 1.0
- **Grecy, Rzymianie, Chińczycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie**
- Wybór w kreatorze nowej gry (Część I §2.3)
- Medaliony i opisy — krótkie bonusy na ekranie wyboru
- Każdy typ — osobne dane w `gra/data/`

**82.2.** Rezerwa Tier 2 — planowane rozszerzenie
- **Babilonia, Asyria, Fenicjanie** — w danych, nie pełny sign-off v1
- 🔮 **Nowe Tier 1 (plan):** Harappa, Hetyci, Słowianie
- Gracz v1.0 — graj 9 aktywnymi; reszta w patchach
- Pełna macierz bonusów — Apendyks B.5

**82.3.** Cywilizacja vs miasto-państwo — różnica
- **Typ cywilizacji** — bonusy, jednostki unikalne, religia (np. Grecy)
- **Miasto-państwo** — konkretny rywal na mapie (Sparta, Kapua)
- Klaster — kopie tego samego typu (Część I §4)
- Ty grasz **jednym** państwem wybranego typu

**82.4.** Wygląd na mapie — epoka i mury
- Modele miast × cywilizacja × poziom 1–10 (Część II §12)
- Sign-off BRĄZ v1: Sumer, Egipt, Inkowie, Zulusi…
- Mury — styl spójny z heksami
- Jednostki — unikalne modele gdzie zdefiniowane

---

### 83. Epoki startowe per cywilizacja

**83.1.** Trzy możliwe starty — Kamień, Brąz, Żelazo
- Większość — **Kamień** lub **Brąz** w kreatorze
- **Żelazo** — rzadkie, trudniejszy start dla doświadczonych
- Kaskada tech — start Brąz = Kamień zbadany (Część I §6.1)
- Jednostki — tylko po tech, nie „pakiet startowy"

**83.2.** Wyjątki — np. Inkowie
- **Kamień + Żelazo bez Brązu** — specjalna ścieżka epok
- Inne cywilizacje mogą mieć unikalne reguły epok (sprawdź opis w kreatorze)
- Wpływ na drzewko nauki — widoczność gałęzi (Część IX §54)
- Balans — D18 pakiet start × trudność

**83.3.** Epoka startowa a jednostki i budynki
- Brąz — wcześniejszy dostęp do miedzi, lepszych budynków
- Kamień — wolniejsza nauka, prostsza armia
- Żelazo — agresywny start, wyższe utrzymanie
- Tempo gry — mnoży koszty tech niezależnie od epoki (§51.2)

**83.4.** Wybór epoki — rekomendacja gracza
- Pierwsza gra — **Kamień** + Normal + Standard
- Znajomy Civ — **Brąz** + więcej AI
- Wyzwanie — **Żelazo** + Trudny + mała mapa

---

### 84. Bonusy cywilizacji (9×3)

**84.1.** Trzy kategorie bonusów per nacja
- **Walka** — XP armii, morale, counter, oblężenie…
- **Miasto** — wzrost, szczęście, produkcja budynków…
- **Ekonomia / mapa** — handel %, nauka %, ruch, widoczność…
- Każda cywilizacja — **3 linie** bonusów (macierz 9×3)

**84.2.** Przykłady bonusów — jak czytać opis
- **Mnożnik handlu** — więcej złota z suwaka handlu
- **% nauki** — szybsze badania z miast
- **XP armii** — jednostki szybciej zyskują doświadczenie (jeśli wpięte)
- **Morale** — bonus w walce przy spełnionym warunku

**84.3.** Bonusy a wybór strategii
- Handlowa — cywilizacja z bonusem handlu i dyplomacji
- Naukowa — % nauki + spokojny start
- Wojskowa — walka + wczesna agresja na miasta-państwa
- Pełna macierz 27 pól — Apendyks B.5 (tabela)

**84.4.** Bonusy **nie** zastępują mechanik bazowych
- Nadal potrzebujesz Spichlerza, suwaków, tech
- Bonusy **mnożą** lub **dodają** do bazowych wartości
- Cuda i trudność — osobne mnożniki
- Decyzje balansu — `REJESTR-DECYZJI.md`

---

### 85. Jednostki unikalne per cywilizacja

**85.1.** Przykłady — Falanga, Rydwan, Lama…
- **Falanga** (Grecy) — piechota wręcz, silna vs kawaleria
- **Rydwan** — szybki uderzeniowy, epoka Brąz
- **Lama** / inne — unikalne dla Inków, Zulusi itd.
- Pełna lista — dane `units` + Apendyks B.6

**85.2.** Wymagania tech i epoki
- Odblokowanie w drzewku — jak zwykła jednostka
- Czasem **wcześniej** lub **później** niż odpowiednik standardowy
- Epoka — nie rekrutujesz rydwanu w Kamieniu
- Wyszarzona w koszarach — brak tech

**85.3.** Koszty rekrutacji unikalnych
- **Złoto + ludność** — jak standard (Część VII §47)
- Często **droższe** — kompensacja wyższego M
- Utrzymanie co turę — wyższe ¤ (sprawdź kartę [H])
- Skala z epoką — tak samo jak zwykłe jednostki

**85.4.** Taktyka — kiedy budować unikalne
- Wczesna wojna z sąsiadem — unikalna piechota/kawaleria
- Oblężenie — unikalne machiny jeśli są w rosterze
- Nie spamuj — utrzymanie zjada skarbiec
- Countery wroga — nadal obowiązują (Część X §61)

---

### 86. Religie cywilizacji

**86.1.** Religia państwa — przypisanie per typ
- Każda cywilizacja ma **domyślną religię** państwa
- Świątynie w miastach — szerzą religię (Część VI §40, XV §92)
- Miasto obcej religii — kara szczęścia (<50% obca dominuje)

**86.2.** Wpływ na szczęście w mieście
- **Własna religia dominuje** — bonus do szczęścia (§40.3)
- **Obca dominuje** — kara
- Progi % — jak przy kulturze (100% / ≥75% / 50% / <25%)
- Budowa świątyni — przyspiesza dominację własnej

**86.3.** Religia a dyplomacja
- Ta sama religia — łatwiejszy handel (bonus zaufanie — status)
- Różne religie — neutralnie lub lekka kara (balans)
- Nie mylić z **kulturą** — osobne overlay (Część XV §91–93)
- Barbarzyńcy — bez religii państwowej

**86.4.** Szerzenie religii — co robi gracz
- Świątynie w miastach granicznych
- Podbój miast — zmiana dominacji stopniowo
- Overlay religii na mapie — §93
- 🔮 turystyka i religia późnych epok — v2

---

## Część XIV — AI i zagrożenia

### 87. Profile AI per nacja

**87.1.** Cztery osie zachowania AI
- **Agresja** — jak szybko wypowiada wojny i atakuje
- **Ekspansja** — zakładanie miast, podbój miast-państw
- **Dyplomacja** — handel, pakt, sojusz vs izolacja
- **Obrona** — garnizony, mury, kontrataki

**87.2.** Profile per typ cywilizacji
- Rzymianie — ekspansja + obrona (przykład — sprawdź dane)
- Zulusi — wysoka agresja
- Chińczycy — nauka i mur (stereotyp balansu)
- Miasta-państwa w klastrze — **osobny** profil defensywny (§88)

**87.3.** AI a trudność gry
- Łatwy — wolniejsza nauka AI, mniej bonusów
- Trudny — pełny pakiet bonusów (§89)
- Normal — baseline dla v1.0
- AI **nie cheatuje** widocznie w mgle (docelowo — verify)

**87.4.** Co obserwować na mapie
- Stosy jednostek przy granicy — sygnał wojny
- Szybka ekspansja AI — konkuruj o złoża
- Sojusze AI vs ciebie — dyplomacja reaktywna
- Barbarzyńcy — zawsze osobne zagrożenie (§90)

---

### 88. AI miast-kopii (klaster)

**88.1.** Defensywne — bez ekspansji
- **Miasta-państwa** w klastrze **nie zakładają** nowych miast
- Bronią terytorium i miasta głównego typu
- Do **zdobycia** przez gracza lub AI ekspansyjne
- Model klastra — Część I §4

**88.2.** Rywale tego samego typu co ty
- Ten sam **bonus cywilizacji** co typ (np. dwie „Grecy" na mapie)
- Różne **nazwy miast** na liście dyplomatów
- Wojna z jednym — nie zawsze wojna ze wszystkimi w klastrze
- Łup — miasto-państwo mniejsze niż stolica AI

**88.3.** Kiedy AI atakuje miasto-państwo
- Profil ekspansyjny + silna armia
- Gracz może **wyprzedzić** — szybki podbój słabszego sąsiada
- Obserwuj mgłę — zwiadowca ujawnia ruchy
- Podbite miasto-państwo — normalne miasto wroga (produkcja, bunt)

**88.4.** Strategia gracza w klastrze
- Wczesny podbój **Kapua** zanim zrobi to Rzym AI
- Dyplomacja z jednym — wojna z drugim w klastrze
- Unikaj wojny na dwa fronty w tym samym klastrze
- Klaster jako **strefa treningowa** przed głównym rywalem

---

### 89. Trudność a bonusy AI

**89.1.** Normal — baseline v1.0
- **+10% produkcja** (praca w miastach AI)
- **+1 nauka** na turę (bonus imperium)
- **+1 jednostka startowa** (gdzie zdefiniowane)
- Referencja — Apendyks B.3 (D18)

**89.2.** Łatwy — mniejsze bonusy AI
- Wolniejszy wzrost ludności AI
- Mniejsze zapasy / brak Spichlerza u AI (SP1–SP6)
- Niższe progi buntu u AI — łatwiej destabilizować (status)
- Gracz ma więcej czasu na rozwój

**89.3.** Trudny — pełny pakiet
- Wyższe bonusy produkcji i nauki
- AI agresywniejsze w oblężeniu (§71)
- Immunitet bogactwa / wyższe progi u gracza (D18)
- Wymaga Spichlerza i optymalnych suwaków wcześnie

**89.4.** Trudność nie zmienia reguł gry
- Te same progi dyplomacji, te same countery
- Tylko **liczby** i **profile** AI
- Wybór w kreatorze — nieodwracalny w save
- Pakiet start × trudność — §5.3 Część I

---

### 90. Barbarzyńcy

**90.1.** Obozy — spawn i limit
- **Obozy** na mapie — generowane wg gęstości świata
- **Spawn** jednostek co X tur — limit jednostek per obóz
- Nie mają miast — tylko obóz i patrole
- Zniszczenie obozu — koniec spawnu z tego punktu

**90.2.** Agresja, regeneracja, odwrót
- **Agresja** — atakują gdy jesteś w zasięgu
- **Regeneracja** — po walce w obozie (status)
- **Retreat** — uciekają gdy bardzo osłabieni
- Nie handlują — tylko walka

**90.3.** Barbarzyńcy vs gracz — praktyka
- Wczesna gra — zagrożenie dla osadnika / zwiadu
- Nagroda — doświadczenie armii, czasem łup (status)
- Posterunek / fort — ochrona terytorium
- Nie ignoruj obozu przy granicy miasta

**90.4.** Fazy — barbarzyńcy → 🔮 buntownicy
- v1.0 — tylko **barbarzyńcy**
- Od **Średniowiecza** (plan) — **buntownicy** zamiast części obozów
- Inne reguły spawnu — roadmap v2 (Apendyks E.5)
- Poradnik v1 — opisuje barbarzyńców; buntownicy w Encyklopedii 🔮

---

## Część XV — Kultura, religia, cuda

### 91. Kultura — system imperium

**91.1.** Zasięg kultury per miasto
- Każde miasto **emituje** kulturę na sąsiednie heksy
- **Progi** — kolejne pierścienie terytorium kulturowego (presja)
- Więcej kultury z miasta — szybsze „zalanie" obcymi heksami
- Źródła: budynki, cuda, suwaki, bonusy cywilizacji

**91.2.** Presja i konwersja heksów
- Heks w zasięgu **dwóch** kultur — wygrywa silniejsza presja
- Konwersja **stopniowa** — nie natychmiast po wejściu wojska
- Wpływa na **szczęście** w mieście gdy obca kultura dominuje (§35.3)
- Warstwa na mapie — §93

**91.3.** Bonus i kara szczęścia wg % własnej kultury
- **100%** własna — maksymalny bonus
- **≥75%** — dobry bonus
- **50%** — neutralnie / lekka kara
- **<25%** obca — silna kara szczęścia

**91.4.** Kultura imperium vs kultura miasta
- **Pasek zasobów** — suma kultury + przyrost (Część III §14.7)
- **Panel miasta** — kultura **tego** miasta (Część VI §40)
- Brak zasobu „Idei" — tylko kultura
- Strategia: świątynie + amfiteatry w miastach granicznych

---

### 92. Religia — system imperium

**92.1.** Religia państwa i dominacja w mieście
- Wybierasz **religię państwa** przez rozwój (świątynie, tech)
- W kaśdym mieście — **% wyznawców** własnej vs obcej
- Dominacja — jak kultura, osobne liczniki
- Panel miasta §40.3 — szczegóły per miasto

**92.2.** Świątynie — budowa i efekt
- Budynek w kolejce produkcji (Część VII §45)
- Zwiększa presję religii w mieście i okolicy
- Bonus szczęścia gdy **nasza** religia dominuje
- Koszt utrzymania w ¤ co turę

**92.3.** Religia a szczęście i dyplomacja
- Te same progi % co kultura (§91.3) — sprawdź aktualny balans
- Dyplomacja — bonus zaufanie za wspólną religię (status)
- Obca religia w stolicy — ryzyko buntu (§36)
- Overlay — §93

**92.4.** Religie cywilizacji — skrót
- Każdy typ ma domyślną religię (Część XIII §86)
- Podbój — nie natychmiastowa zmiana religii miasta
- 🔮 późne epoki — turystyka i religia (Apendyks E)

---

### 93. Overlay kultura / religia (szczegóły ekranu mapy)

**93.1.** Włączenie warstw — ikony przy minimapie
- **Kultura** (🎭) — toggle overlay
- **Religia** — osobny toggle
- Część II §10 — czego **nie ma** (kolor 3D na heksach v1.0)
- Oba naraz — porównaj presję obu systemów

**93.2.** Co pokazuje overlay
- **Lista miast** z procentem własnej kultury/religii
- **Progi** zasięgu — które heksy „należą" kulturowo
- Presja na granicy — gdzie grozi konwersja
- Link do panelu miasta — klik miasta na liście

**93.3.** Pełne parametry w tooltipach
- Wiki‑M dla overlay — jeden ekran pomocy
- Progi liczbowe — w apendyksie po eksporcie balansu
- Gracz: używaj overlay przed wojna kulturową (szczęście)
- Spójność z §35 i §40 panelu miasta

**93.4.** Overlay a decyzje gracza
- Gdzie budować **amfiteatr / świątynię**
- Które miasto graniczne wymaga ręcznych suwaków (wyłącz auto-zarządcę)
- Kiedy ignorować — czysto wojskowa gra (ryzyko buntu)
- Cuda kulturowe — §94–96

---

### 94. Cuda świata — podstawy

**94.1.** Typ **E** (wyłączny) vs **R** (wyścigowy)
- **E** — **max 1 na cały świat**; pierwszy buduje, reszta nie może
- **R** — **wyścig**; kilka nacji może budować, wygrywa pierwszy ukończony
- Lista per epoka — dane `wonders.json`
- Ikona **Cuda** — lewy panel mapy (Część III §17.1)

**94.2.** Wyścigowe Antyk — przykłady
- **Wyrocznia**, **Ha'amonga**, **Brama wszystkich narodów**
- Dostępne od określonej epoki (Część IX §55)
- Widzisz postęp rywala w overlay / liście (status UI)
- Przegrany wyścig — strata pracy, bez cudu

**94.3.** Budowa cudu — warunki
- **Heks w twoim terytorium** — musisz posiadać pole
- **Koszt w pracy** — jak wielki budynek, długa kolejka
- **Technologia** wymagana — wyszarzone bez tech
- **Max 1** na świat (E) lub pierwszeństwo (R)

**94.4.** Cuda a siła państwa
- **Cuda NIE dodają** do siły państwa (decyzja gameplay)
- Dają **bonusy** ekonomiczne, wojskowe, dyplomatyczne (§95)
- Nadal warto budować — inne korzyści
- Tooltip cudu — pełna lista bonusów Wiki‑M

---

### 95. Bonusy cudów

**95.1.** Yield ×3 per miasto
- Wybrany typ plonu **×3 we wszystkich twoich miastach**
- Np. żywność, praca, złoto — zależy od cudu
- Kumuluje z budynkami i polami
- Najsilniejszy bonus ekonomiczny v1

**95.2.** Bonusy imperium — przykłady
- **Dyplomacja** — +zaufanie, łatwiejszy handel
- **Wojna** — XP armii, morale
- **Handel** — +% do transakcji
- **Wzrost** — ludność, kultura — per definicja cudu

**95.3.** Cuda **nie dają** siły państwa
- Siła państwa — armia, ludność, tech (Część VIII §52)
- Szacunek dyplomatyczny — z siły, **nie** z cudu bezpośrednio
- Gracz: nie oczekuj ultimatum od samego cudu
- Bonusy pośrednie — bogatsza armia = wyższa siła

**95.4.** Wybór cudu — strategia
- Wczesny **E** — zablokuj rywala (ekonomia)
- **R** — ryzykowny wyścig, przyspiesz produkcję złotem
- Epoka — cudu Antyku wygasną po absolut (§96)
- Utrzymanie cudu — ¤ co turę (§49.2)

---

### 96. Absolut i wygasanie

**96.1.** Koniec Średniowiecza (epoka 6) — bonusy Antyku wygasają
- **Absolut** — data w grze kończąca erę starożytną
- Wszystkie **bonusy aktywne** cudów Antyku — **off**
- Cud **zostaje** na mapie jako **ruina** — wizualnie
- Jedyny zostający efekt — turystyka (§96.3)

**96.2.** Utrzymanie po absolut — 50% (D-CUD2)
- 🟡 Decyzja **D-CUD2** — utrzymanie cudu spada do **50%** kosztu
- Ruina nadal kosztuje — ale mniej niż za życia
- Wzór — Apendyks C.8
- Gracz: budżet na cuda późnej gry

**96.3.** Turystyka — +10 handlu
- Po absolut jedyny **stały** bonus ruiny
- **+10** do handlu (punkty / % — definicja w danych)
- Nie przywraca ×3 yield
- Strategia: ruiny jako node dyplomatyczny

**96.4.** 🔮 Cuda epok 4+ (osobne pliki)
- Średniowiecze i dalej — **inne** cuda, inne reguły absolutu
- Osobne pliki danych — nie mieszaj z Antykiem
- Poradnik v1 — Antyk + absolut; reszta w roadmap
- Encyklopedia — osobne hasła per epoka

---

## Część XVI — Zwycięstwo i koniec gry

### 97. Warunki zwycięstwa v1.0

**97.1.** Zwycięstwo **dominacji** — siła > 50% świata
- Twoja **siła państwa** musi przekroczyć **50%** sumy siły **wszystkich** graczy/AI
- Liczy się w **ostatniej epoce** gry
- v1.0: próg epoki **Żelaza** (epoka 3) — verify in `victory.ts`
- Duża liczba na mapie — podgląd trendu (Część III §20)

**97.2.** Zwycięstwo **naukowe** — rakieta
- Zbadaj **wszystkie** technologie w drzewku
- Zbuduj **rakietę z robotami** (projekt końcowy — tech + produkcja)
- Nie wymaga dominacji militarnej
- Długa gra na ustawieniu „Długa" tempa

**97.3.** Czego **nie ma** w v1.0 — inne typy zwycięstwa
- **Kulturowe, religijne, dyplomatyczne** — 🔮 plan v2
- **Punktacja po turach** — brak
- **Kampania** — osobny tryb „Wkrótce"
- Pełna lista warunków — kod + ten rozdział

**97.4.** Świadomość gracza — jak śledzić postęp
- Tooltip siły państwa — % do dominacji (status UI)
- Drzewko nauki — % ukończenia globalnego
- Ekran **Zwycięstwo** po spełnieniu — §99
- AI też może wygrać — nie ignoruj ich nauki

---

### 98. Porażka

**98.1.** Warunek porażki v1.0
- **Brak miast** i **brak osadników** (jednostka zakładająca miasto)
- **Po tym**, jak gracz **kiedyś** miał miasto — nie porażka w pierwszej turze przed założeniem
- Wszystkie miasta zdobyte / zniszczone — koniec gry
- Brak „reguły stołecznej" — każde miasto liczy się

**98.2.** Czy można wrócić z porażki
- v1.0 — **nie** (brak mechaniki „wstań z kolan")
- Reload save — jedyna opcja (§100)
- Multiplayer kiedyś — inne reguły
- Barbarzyńcy nie „wygrywają" — tylko gracze i AI cywilizacji

**98.3.** Porażka a sojusznicy
- Sojusz **nie przedłuża** gry jeśli straciłeś wszystkie miasta
- Obserwator — status v1 (brak)
- Wojna totalna — szybka porażka jeśli zero rezerw miast
- Garnizon alone — miasto musi **należeć** do ciebie

**98.4.** Unikanie porażki — praktyka
- Zawsze trzymaj **drugie miasto** lub osadnika w bezpiecznym tyle
- Spichlerz + zapasy — utrzymaj armię przy kontrataku
- Pokój za trybut — lepszy niż eliminacja (§77)
- Zapis przed ryzykowną wojna — §100.1

---

### 99. Ekran zwycięstwa

**99.1.** Status wdrożenia (E-P0-06)
- Ekran końcowy — **🟡 w trakcie** / verify w buildzie
- Po dominacji lub nauce — animacja / statystyki (plan UX)
- Przyciski: **Menu główne**, **Kontynuuj** (sandbox — status)
- Powiązanie z `victory.ts` i UI-shell (Grupa E)

**99.2.** Co gracz powinien zobaczyć
- Typ zwycięstwa: **Dominacja** lub **Nauka**
- Numer tury zakończenia
- Podsumowanie: miasta, siła, zbadane tech (docelowo)
- 🔮 ranking vs AI — post-v1

**99.3.** Po zwycięstwie — co dalej
- v1.0 — powrót do menu lub kontynuacja bez celu (verify)
- Kampania — osobna ścieżka (Część I §1.2)
- Save — można wczytać turę wcześniej
- Wiki — hasło **Zwycięstwo** (Wiki‑S/M)

**99.4.** Zwycięstwo AI — komunikat dla gracza
- Alert „Przegrałeś" vs „AI X wygrało" (status)
- Replay ostatnich tur — 🔮
- Gracz uczy się — sprawdź REJESTR decyzji warunków
- Fairness — te same reguły co dla AI (§97)

---

## Część XVII — Zaawansowane

### 100. Save / Load

**100.1.** Quick save z preBattle
- Przycisk **Zapisz** na ekranie przed bitwą (Część X §57)
- Szybki zapis przed ryzykowną walką
- Slot quick — nadpisanie ostatniego quick (verify UI)
- Nie zapisuje **w środku** bitwy 3D (zwykle)

**100.2.** Zapisy ręczne i autosave
- Menu — **Zapisz grę** / **Wczytaj** (Część I §1.3)
- Autosave co X tur — status v1
- Wiele slotów — nazwy save
- OneDrive — gracz nie zarządza plikami; gra zapisuje lokalnie

**100.3.** Migracja starych zapisów
- Po patchu balansu — stare save mogą **nie wczytać** się
- Komunikat błędu — wersja formatu save
- Backup save przed dużą aktualizacją — dobra praktyka gracza
- Developer — wersjonowanie w kodzie save/load

**100.4.** Co jest w save
- Stan mapy, miast, jednostek, tech, dyplomacja
- Oblężenia trwające — muszą się wczytać poprawnie
- RNG seed — ta sama mapa po reload (verify)
- 🔮 multiplayer save — przyszłość

---

### 101. Skróty klawiaturowe i flow UX

**101.1.** Mapa strategiczna
- **Enter / N** — koniec tury (jeśli aktywny, §16.3)
- **[H]** — karta jednostki (Część IV §22)
- **[C]** — tryb budowy (Część V §26)
- Minimapa — klik skok kamery (§18.3)

**101.2.** preBattle i bitwa
- **Enter** — potwierdź auto / bitwa
- **Escape** — wycofaj atak
- **S/P/H/M** — formacje w 3D (§60.2)
- **Ctrl+M** — mapa taktyczna

**101.3.** Panel miasta
- Esc — zamknij panel
- Przełącznik zakładek — mysz (skróty — status)
- Wykonaj — skok z dolnego paska, nie skrót globalny
- Pełna lista — tabela w poradniku‑L przy pisaniu

**101.4.** Dostępność i mobile
- v1.0 — **PC** mysz + klawiatura
- 🔮 dotyk — post-v1
- Skalowanie UI — ustawienia (Grupa E)
- Wiki‑S przy skrócie — tooltip w grze

---

### 102. Dla twórców: panele balansu A–E

**102.1.** Excel → eksport → JSON
- Maciej edytuje **Panel-X.xlsx** w `panele-sterowania/`
- W czacie grupy: **`eksportuj panel`** — agent odpala skrypt
- Wynik — `gra/data/*.json` (np. `buildings.json`)
- **NIGDY** pełny export wszystkich arkuszy naraz — ryzyko nadpisania

**102.2.** Mapowanie panel → pliki gry
- **Panel A** — mapa, teren (Grupa A)
- **Panel B** — miasto, ekonomia (Grupa B)
- **Panel C** — jednostki, walka (Grupa C)
- **Panel D** — cywilizacje, AI (Grupa D)
- **Panel E** — UI, start (Grupa E)
- Tabela pełna — `PANEL-STEROWANIA-SPEC.md`

**102.3.** Gracz końcowy — co z tego wynika
- **Ty nie edytujesz** Excela — tylko grasz build z danymi
- Zmiana balansu — nowy build od zespołu
- Poradnik wiąże **decyzje** (`docs/decyzje/`) nie stary Excel
- Apendyks C — wzory pochodzą z tych samych danych

**102.4.** Spójność Wiki ↔ dane
- Każde hasło encyklopedii — pole `decyzja_ref` + JSON
- Po eksporcie panelu — aktualizacja Wiki‑S/M jeśli liczby się zmieniły
- Status 🔮 w spisie — kod jeszcze nie egzekwuje eksportu
- Integrator F — wpina po batchu lane'ów

---

## Apendyks A — Słownik pojęć (dla gracza)

### A.1. Zasoby — pełne nazwy i różnice

**A.1.1.** Złoto (¤) vs bogactwo
- **Złoto** — skarbiec państwa; płacisz rekrutację, utrzymanie, rush
- **Bogactwo** — luksus warstwy społecznej; wpływa na szczęście, nie na skarbiec
- Oba widoczne na ekranie — różne ikony i tooltips
- Suwak handlu — dzieli produkcję między złoto, naukę, luksus

**A.1.2.** Praca, badania, żywność, ludność
- **Praca** — budowa budynków i ulepszeń terenu
- **Badania** — punkty nauki do drzewka technologii
- **Żywność** — wzrost miast i zapasy wojska (Spichlerz)
- **Ludność** — suma mieszkańców; rekrutacja zużywa ludzi z miasta

**A.1.3.** Kultura — bez „Idei"
- Jeden zasób **kultura** — presja na mapie i szczęście w mieście
- Przyrost + suma na pasku zasobów
- Nie mylić z **kulturą** jako sztuką — to mechanika zasięgu

**A.1.4.** Zapasy państwa (Spichlerz)
- Format **bieżące / maksimum** na pasku
- Tylko ze Spichlerzem w imperium — inaczej model bufora lokalnego
- Żywność wojska — z magazynu państwa

---

### A.2. Relacja · zaufanie · szacunek · punkty handlowe

**A.2.1.** Zaufanie
- Jak bardzo nacja **ufna** twoim obietnicom i historii
- Rośnie: handel, prezenty, dotrzymane paki
- Spada: wojna, zerwanie traktatu, przemarsz bez zgody

**A.2.2.** Szacunek (Respekt)
- Jak bardzo **boją się / szanują** twojej siły
- Rośnie: siła państwa, zwycięstwa, rozwój
- **Nie** rośnie bezpośrednio z cudów świata

**A.2.3.** Relacja
- Liczba wynikowa używana do **progów akcji** dyplomatycznych
- Wyższa — handel, sojusz; niższa — ultimatum, wojna
- Pełna tabela — Apendyks B.1

**A.2.4.** Punkt handlowy (PN)
- Jednostka wymiany w umowie handlowej
- **1 PN ≈ 1 żywność** (bazowo); tech = koszt w PN jak koszt badania
- Nadmiar korzystnej umowy → zaufanie (max +5/turę)

---

### A.3. Siła jednostki · siła państwa — co oznaczają liczby

**A.3.1.** Moc jednostki (M)
- **Jedna liczba** na karcie jednostki — siła w walce i w sumie armii
- Składniki: zdrowie, charge, ostrzał — w apendyksie C (dla ciekawych)
- Oblężnicze w polu — M=0 w sumie armii strategicznej

**A.3.2.** Siła państwa
- **Duża liczba** na mapie — ciężar twojego imperium
- Armia + wygrane bitwy + ludność + miasta + terytorium + tech…
- **Cuda nie dodają** do tej liczby

**A.3.3.** Różnica M vs siła państwa
- M — **jedna jednostka** lub suma armii
- Siła państwa — **całe imperium** + historia zwycięstw
- Szacunek dyplomatyczny — bliżej siły państwa niż M pojedynczej jednostki

**A.3.4.** Counter i bonus vs typ
- **×1,5** — trafienie w słaby typ wroga
- Bonus **%** — z definicji jednostki w danych
- Macierz — Apendyks B.6

---

### A.4. Cuda wyłączne i wyścigowe · miasto-państwo · klaster

**A.4.1.** Cud wyłączny (E)
- **Jeden na cały świat** — kto pierwszy zbuduje, ten ma
- Inni gracze — szary, niedostępny
- Przykłady — lista w danych cudów Antyku

**A.4.2.** Cud wyścigowy (R)
- Kilku graczy może budować **równolegle**
- Wygrywa **pierwszy ukończony**
- Przegrany — strata pracy, bez efektu

**A.4.3.** Miasto-państwo
- Konkretny rywal na mapie (np. Kapua) w **klastrze** kopii typu cywilizacji
- Defensywny, bez ekspansji — cel podboju
- Osobny wpis na liście dyplomatów

**A.4.4.** Klaster
- Grupa miast **tego samego typu** (np. greckie) na start mapy
- Ustawienie kreatora: liczba miast-państw w klastrze
- Ty grasz **stolicą** wybranego typu — reszta to AI kopie

---

## Apendyks B — Tabele referencyjne

### B.1. Progi dyplomacji (pełna tabela akcji)

**B.1.1.** Akcje ekonomiczne i pokojowe
- Handel ≥ 100 · Prezent ≥ 30 · Granice ≥ 100
- NAP ≥ 110 · Sojusz > 150
- Władcy poboczni: **−20 pkt** do każdego progu

**B.1.2.** Akcje presji i wojny
- Trybut: szacunek > 70 + min. 10 ¤/turę
- Ultimatum: siła ≥ 1,3× + reparacje ≥ 20 ¤
- Wchłonięcie: szacunek ≥ 90 (status wdrożenia)

**B.1.3.** Kolumny tabeli (docelowo)
- Nazwa akcji · próg relacji · próg szacunku · koszt ¤ · cooldown
- Efekt jednorazowy vs co turę
- Link do rozdziału XII §77

**B.1.4.** Aktualizacja tabeli
- Źródło: Panel D + `diplomacy.ts` + decyzje D3-v1.1
- Przy zmianie balansu — nowy wiersz w rejestrze decyzji

---

### B.2. Cennik PN / dostęp do złoża

**B.2.1.** Ekwiwalenty bazowe PN
- 1 PN = 1 żywność · tech = koszt nauki w PN
- Złoto — przelicznik w umowie (tabela)

**B.2.2.** Dostęp do złoża — ceny startowe
- Miedź, żelazo, sól… — osobne wiersze
- Mnożnik **w wojnie** — kolumna ×1,5 lub wg decyzji

**B.2.3.** Czego nie wymieniasz w PN v1
- Hex, budynek, ulepszenie, cała tech, kultura
- Lista zamknięta — Część XII §78.2

**B.2.4.** Nadmiar PN → zaufanie
- +1 / 100 PN · max +5/turę — wzór C.7

---

### B.3. Parametry trudności (D18)

**B.3.1.** Trzy poziomy — Łatwy / Normalny / Trudny
- Wzrost ludności gracza vs AI
- Spichlerz i zapasy startowe (SP1–SP6 powiązane)

**B.3.2.** Bonusy AI per trudność
- Normal: +10% produkcja, +1 nauka, +1 jednostka start
- Trudny — rozszerzone bonusy (pełna tabela w D18)

**B.3.3.** Progi buntu i immunitet bogactwa
- Łatwy — wyższe progi buntu u gracza
- Trudny — immunitet / kary bogactwa (decyzja)

**B.3.4.** Pakiet start × trudność
- Krzyżówka epoki startowej i ustawień świata
- Część I §5 — skrót dla gracza

---

### B.4. Spichlerz SP1–SP6

**B.4.1.** SP1–SP3 — bufor wzrostu
- Bez Spichlerza: bufor → 0 po awansie
- Ze Spichlerzem: 50% bufora zostaje
- Kumulacja bufora — zawsze z suwaka Rozwój miast

**B.4.2.** SP4–SP5 — żywność wojska
- Bez Spichlerza: nadwyżka wojskowa przepada po awansie
- Ze Spichlerzem: trafia do magazynu państwa
- Głód wojska −8% max HP/turę przy zapasach < 0

**B.4.3.** SP6 — rekrutacja
- **Nigdy** nie blokowana brakiem zapasów
- Decyzja B5 — wiążąca w poradniku

**B.4.4.** Pojemność magazynu
- Maksimum = f(liczba Spichlerzy, poziom budynku)
- Format UI: bieżące / maksimum

---

### B.5. Macierz bonusów cywilizacji (27)

**B.5.1.** Układ 9×3
- 9 cywilizacji × 3 linie bonusów (walka / miasto / mapa-ekonomia)
- Wartości: mnożniki, +%, flat bonus

**B.5.2.** Przykładowe wiersze
- Rzym: … · Grecy: … · Inkowie: … (pełna tabela przy eksporcie)

**B.5.3.** Źródło danych
- Panel D · `civilizations.json`
- Zmiana — tylko przez eksport panelu + decyzję

**B.5.4.** Wiki
- Każda cywilizacja — osobne hasło encyklopedii z 3 bulletami bonusów

---

### B.6. Jednostki — staty bazowe i countery (Panel-C)

**B.6.1.** Kolumny tabeli jednostek
- Nazwa · epoka · M · obrażenia · ruch · utrzymanie ¤ · rola · counter vs

**B.6.2.** Macierz counter ×1,5
- Wiersze atakujący × kolumny obrońca
- 🟡 C-BAL-Q1 — sign-off przed drukiem poradnika

**B.6.3.** Jednostki unikalne
- Osobne wiersze per cywilizacja
- Tech wymagana · koszt złoto + pop

**B.6.4.** Oblężnicze i morskie
- Katapulta Żelazo · taran · łodzie — osobna sekcja tabeli

---

### B.7. Ulepszenia terenu — pełna lista v1

**B.7.1.** Kategorie
- Żywność · produkcja · hodowla · infrastruktura · specjalne
- Część V §27 — skrót narracyjny

**B.7.2.** Kolumny tabeli
- Nazwa · koszt pracy · wymagany teren · tech · plon + · utrzymanie

**B.7.3.** Placement rules
- Bez złoża na heksie · rzeka-sąsiad dla irygacji itd.

**B.7.4.** 🔮 wielowarstwowość
- Kanon zapisany · kod post-v1 — kolumna „warstwa" w tabeli planowanej

---

### B.8. Budynki — kategorie i utrzymanie

**B.8.1.** Kategorie budynków
- Ekonomia · wojsko · nauka/kultura · infrastruktura · Spichlerz
- Poziomy 1–10 · koszt pracy per poziom

**B.8.2.** Przyrost (`przyrost`) — kolumny
- Żywność · praca · nauka · szczęście · zdrowie · prawo · kultura…

**B.8.3.** Utrzymanie ¤/turę
- Suma per miasto · wpływ na skarbiec imperium

**B.8.4.** Tech wymagana
- Join z drzewkiem nauki — Część IX §56

---

## Apendyks C — Wzory i wyliczenia (krok po kroku)

*Tu dopuszczalne skróty techniczne — zawsze z tłumaczeniem na język gracza.*

### C.1. Wzrost ludności i próg N

**C.1.1.** Bufor wzrostu — co się kumuluje
- Co turę: udział żywności z suwaka **Rozwój miast**
- Tłumaczenie: „pasek do kolejnego mieszkańca"

**C.1.2.** Próg N — kiedy awans +1 pop
- Wzór: **10 + pop × wsp** (wsp z trudności D18)
- Po awansie: bufor 0 lub 50% ze Spichlerzem (B.4)

**C.1.3.** Przykład liczbowy krok po kroku
- Miasto pop 3, bufor 8/13, awans → pop 4, bufor 0 lub 6,5

**C.1.4.** Link do rozdziału
- Część VI §33 · decyzja B5

---

### C.2. Procent szczęścia i procent porządku

**C.2.1.** SzPct — składniki plus/minus
- Lista czynników §35.2–35.3 · cap super-zadowolenia

**C.2.2.** PorPct — wzór z prawem
- **Porządek** = f(szczęście, prawo) — wagi z balansu
- Prawo: budynki, wojsko w mieście

**C.2.3.** Progi T1/T2 buntu
- Tabela efektów ekonomicznych per próg porządku
- Część VI §36.2

**C.2.4.** Tłumaczenie dla gracza
- „Nie musisz znać wzoru — patrz % w panelu i rozpiskę"

---

### C.3. Bogactwo — poziom W i mnożnik

**C.3.1.** Pula luksusu → poziom W
- Skąd: suwak handlu, % luksusu
- Progi poziomów W — tabela

**C.3.2.** Mnożnik dochodu luksusu
- Wpływ na szczęście §37
- Immunitet na Trudnym (D18)

**C.3.3.** Różnica W vs złoto na pasku
- W — panel miasta · ¤ — skarbiec imperium

**C.3.4.** Przykład
- 70/20/10 suwak → W rośnie wolniej niż przy 50/20/30

---

### C.4. Siła państwa — suma składników

**C.4.1.** Składniki dodatnie
- Suma M armii · wygrane bitwy · pop · miasta · heksy · budynki · tech · ulepszenia

**C.4.2.** Wykluczenia
- Mnożnik epoki · cuda · buffy tymczasowe

**C.4.3.** Aktualizacja co turę
- Po bitwie · po zbudowaniu · po utracie miasta

**C.4.4.** Dominacja 50%
- Twoja siła / suma wszystkich > 0,5 w epoce końcowej v1

---

### C.5. Auto-walka — straty

**C.5.1.** Współczynnik coef v2b
- Wejście: M obu stron, countery, teren, liczebność
- Wyjście: straty per strona

**C.5.2.** Krok po kroku przykład 3v3
- Piechota vs kawaleria na wzgórzu

**C.5.3.** Oblężnicze M=0 w polu
- Nie wchodzą do sumy przed walką polową

**C.5.4.** Zgodność z bitwą ręczną
- Ten sam seed / te same reguły counter (cel)

---

### C.6. Oblężenie — atrycja i kapitulacja

**C.6.1.** Atrycja ~8%/turę garnizonu
- Milicja 20% pop × 0,5 M wchodzi w pool

**C.6.2.** Mur — tempo z armii i machin
- Nie flat 1/turę — skala z M oblężnika (§70)

**C.6.3.** Głód miasta — magazyn 0
- Kapitulacja · transfer właściciela

**C.6.4.** Brak upadku od HP miasta
- Tylko głód kończy oblężenie automatycznie

---

### C.7. Handel — punkty handlowe a zaufanie

**C.7.1.** Bilans umowy PN
- Suma oferty A = suma oferty B (± tolerancja)

**C.7.2.** Nadmiar korzyści
- floor(PN_nadmiar / 100) → +zaufanie, cap 5/turę

**C.7.3.** Tech w PN
- Koszt tech = koszt badania w punktach nauki

**C.7.4.** Przykład 3-turowy handel
- Rosnące zaufanie do progu NAP 110

---

### C.8. Utrzymanie cudu po absolut (50%)

**C.8.1.** Przed absolut
- Utrzymanie ¤/turę = pełne z danych cudu

**C.8.2.** Po absolut (D-CUD2)
- **50%** utrzymania · bonusy yield off
- Turystyka +10 handlu — stałe

**C.8.3.** Ruina na mapie
- Wizualnie zostaje · nie można „odbudować" bonusu Antyku

**C.8.4.** Wzór w jednej linii
- upkeep_po = upkeep_przed × 0,5 (po epoce absolut)

---

## Apendyks D — Historia decyzji (skrót know-how)

### D.1. Indeks ID decyzji

**D.1.1.** Decyzje produktowe D1–D15
- Skrót 1 akapit each — link `docs/decyzje/D*.md`
- Maciej = decydent gameplay

**D.1.2.** Decyzje balansu i mechanik
- **C-BAL-Q1** — macierz counter Panel-C
- **D-CUD2** — utrzymanie cudu 50% po absolut
- **B5-SP** — Spichlerz SP1–SP6
- **D3-v1.1** — dyplomacja Tier 2–3

**D.1.3.** Decyzje UI / obieg
- **A1-revA** — layout paska zasobów
- **D1B** — minimapa
- **D18** — trudność × start

**D.1.4.** Rejestr żywy
- `docs/obieg/REJESTR-DECYZJI.md` — status 🟡/🟢/✅
- Poradnik cytuje **ostatnią** zatwierdzoną wersję

---

### D.2. Co się zmieniło vs wcześniejsze pomysły

**D.2.1.** Spichlerz i bufor wzrostu (B5)
- Było: różne modele · Jest: 0 vs 50% + magazyn państwa

**D.2.2.** Cuda a siła państwa
- Było: cuda dodają Moc · Jest: **nie dodają** — tylko bonusy yield/imperium

**D.2.3.** Bunt v1.0
- Było: utrata miasta · Jest: **nie tracisz miasta** — kary ekonomiczne + migracja

**D.2.4.** Surowce v1 vs v2
- v1: dostęp boolean · v2 plan: magazyny i pełne koszty (Apendyks E)

---

### D.3. Otwarte / w trakcie

**D.3.1.** C-BAL-Q1 — macierz jednostek
- 🟡 Panel-C · kolejność: macierz → auto-walka → oblężenie

**D.3.2.** D-CUD2 — utrzymanie 50%
- 🟡 Zapisana · weryfikacja w kodzie i UI

**D.3.3.** v2 surowce, handel rozszerzony, wielowarstwowe heksy
- 🔮 Apendyks E — nie opisuj jako v1 w poradniku gracza

**D.3.4.** E-P0-06 — ekran zwycięstwa
- 🟡 UI-shell · Część XVI §99

---

## Apendyks E — 🔮 Roadmap v2.0 (poza poradnikiem v1)

### E.1. Koszty surowców (bramka + pełne)

**E.1.1.** Magazyn surowców imperium
- Drewno, żelazo… — stany na pasku lub w panelu

**E.1.2.** Bramka rekrutacji/budowy
- Odejmowanie surowców przy starcie produkcji

**E.1.3.** Handel surowcami PN
- Rozszerzenie §78.2

**E.1.4.** Migracja save v1 → v2
- Plan techniczny — poza poradnikiem gracza

---

### E.2. Wielowarstwowe ulepszenia heksów

**E.2.1.** Farma + irygacja na jednym heksie
- Kanon zapisany · kod 🔮

**E.2.2.** UI placement — wybór warstwy

**E.2.3.** Koszty kumulowane

**E.2.4.** Tabela B.7 kolumna warstwa

---

### E.3. Handel: tech punkty, kultura, miasta/hex

**E.3.1.** Pełna tech — nie tylko punkty postępu

**E.3.2.** Kultura i religia w umowach

**E.3.3.** Sprzedaż miasta / hex — odrzucone v1, revisiting v2

**E.3.4.** Dyplomacja v1.1 jako most (§81)

---

### E.4. Zaokrętowanie · panel armii drag&drop

**E.4.1.** Transport morski jednostek

**E.4.2.** Panel armii z przeciąganiem — zamiast okna łącz/nie łącz

**E.4.3.** Łodzie rybackie rozszerzone

**E.4.4.** Część IV §23 · Część II §13

---

### E.5. Kampania · Multi · cuda późnych epok · buntownicy

**E.5.1.** Kampania — scenariusze „Wkrótce" w menu

**E.5.2.** Multiplayer — osobne reguły zwycięstwa

**E.5.3.** Cuda epok 4+ — osobne pliki danych (§96.4)

**E.5.4.** Buntownicy zamiast części barbarzyńców od Średniowiecza (§90.4)

---

## Apendyks F — Indeks Wiki (alfabetyczny + mapowanie)

### F.1. Spis haseł A–Z

**F.1.1.** Plik docelowy
- `docs/encyklopedia/indeks.md` — generowany przy pierwszej paczce pisania

**F.1.2.** ~120–150 haseł z kategorii (indeks górny dokumentu)
- Każde hasło — osobny plik `docs/encyklopedia/<slug>.md`

**F.1.3.** Pola hasła
- `id`, `tytuł`, `kategoria`, `wiki_s`, `wiki_m`, `poradnik_ref`, `decyzja_ref`, `status_v1`

**F.1.4.** Alfabet PL
- Ą, Ć… sortowanie locale · cross-link „Zobacz też"

---

### F.2. Tabela: hasło → rozdział poradnika → plik decyzji → JSON

**F.2.1.** Kolumny mapowania
- Hasło · Część § · `docs/decyzje/*.md` · `gra/data/*.json`

**F.2.2.** Przykłady wierszy
- Spichlerz → VI §39, III §21 · B5 · buildings.json
- Szczęście → VI §35 · — · economy params
- Counter → X §61 · C-BAL-Q1 · units.json

**F.2.3.** Jedna prawda — trzy długości
- Wiki‑S → gra · Wiki‑M → panel pomocy · Poradnik‑L → rozdział

**F.2.4.** Aktualizacja po eksporcie panelu
- Skrypt diff JSON → lista haseł do odświeżenia Wiki‑S

---

### F.3. Hasła wielojęzyczne (PL gracz · EN techniczne ID)

**F.3.1.** Tytuł hasła — zawsze PL (język gracza)
- Spichlerz, Siła państwa, Punkt handlowy

**F.3.2.** ID techniczne — opcjonalnie w stopce hasła
- `granary`, `power`, `trade_point` — dla twórców modów

**F.3.3.** Zakaz skrótów w Wiki‑S/M
- SzPct tylko w Apendyks C z tłumaczeniem

**F.3.4.** Szablon
- `docs/encyklopedia/_SZABLON-HASLO.md`

---

## Statystyka spisu (propozycja rev. C)

| Element | Liczba |
|---------|--------|
| Części poradnika (0–XVII) | 18 |
| Rozdziały główne (§0.1–§102) | **~102** |
| Podpunkty rozwinięte (format **N.M.** + 3–5 bulletów) | **wszystkie części 0–XVII** |
| Apendyksy A–F (A.1–F.3 z podpunktami) | 6 |
| Hasła encyklopedii (szac.) | ~120–150 |
| Warstwy tekstu per hasło | 3 (Wiki‑S, Wiki‑M, Poradnik‑L) |

**Numeracja rozdziałów (rev. C):** Część VIII §49–53 · IX §54–56 · X §57–65 · XI §66–73 · XII §74–81 · XIII §82–86 · XIV §87–90 · XV §91–96 · XVI §97–99 · XVII §100–102.

**Trzy filary treści (rev. C):** Część III pasek zasobów · Część VI ludność/stabilność · Część VII budowa/rekrutacja.

**Rev. C:** każdy rozdział § i każdy punkt apendyksu ma rozwinięte podpunkty (3–6 bulletów); język gracza, bez skrótów w tytułach.

---

## Następny krok po Twojej akceptacji

1. Ty: **akceptujesz / korygujesz** spis z podpunktami. Wystarczy „spis OK" lub lista poprawek (np. brakujący temat w §35.2).  
2. Master: pierwsza paczka pisania — **Część VI** (Wiki‑S/M + Poradnik‑L): Spichlerz, Szczęście, Porządek, Bunt, Bogactwo, suwaki.  
3. Druga paczka — **Część III** + **Część VII**.  
4. Każdy temat: **Wiki‑S** → **Wiki‑M** → **Poradnik‑L** → wzór w apendyksie C.  
5. Foldery: `docs/PORADNIK-GRACZA/` · `docs/encyklopedia/` · `_SZABLON-HASLO.md`.
