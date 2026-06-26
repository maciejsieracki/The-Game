# Szablon miasta i mapy

> Dokument projektowy — wersja 1.0 (2026-06-20)
> Cel: wzorzec implementacji widoku miasta (City Screen) i generatora mapy terenów dla gry 4X w przeglądarce (HTML + JS).
> Terminologia własna: Żywność, Praca, Handel → Nauka/Pieniądz; populacja = Ludzie; zasoby epokowe; mnożniki Pracy ×10/×100/×1000.

---

## A. WIDOK MIASTA

### Cel i układ ogólny

Widok miasta to osobny ekran (modal lub overlay pełnoekranowy), który otwiera się po kliknięciu na miasto na mapie. Pełni rolę centrum zarządzania: gracz widzi tu bilans zasobów, kolejkę produkcji, budynki i obrabiane pola. Wzorzec: Civ3 City Screen (lewy panel = zasoby/obywatele; środek = mapa terytorium z polami; prawy panel = produkcja + budynki) oraz OpenCiv3 (modernizacja layoutu, czytelniejsze paski).

---

### Panel 1: Nagłówek miasta

Wyświetla podstawowe dane identyfikacyjne:

| Element | Zawartość |
|---|---|
| Nazwa miasta | tekst edytowalny (domyślnie: auto) |
| Wielkość (Ludzie) | liczba obywateli, np. `Ludzie: 4` |
| Epoka | obecna epoka cywilizacji, np. `Epoka Brązu` |
| Typ | `[Stolica]` lub puste (zwykłe miasto) |
| Rok założenia | pomocniczo, np. `Zał. 3000 p.n.e.` |
| Poziom: Osada / Miasto / Metropolia | próg 1–6 / 7–12 / 13+ Ludzi (zgodnie z Civ3) |

Stolica oznaczona ikoną pałacu lub złotą ramką. Poziom miasta wpływa na bonus obronny: Osada +0%, Miasto +50%, Metropolia +100%.

---

### Panel 2: Plony na turę

Bilans zasobów generowanych przez miasto w bieżącej turze. Dane sumują: (a) plony z obrabianych pól, (b) efekty budynków w mieście, (c) modyfikatory epoki i technologii.

#### 2a. Żywność

- Żywność brutto (suma z pól): np. `+8`
- Zużycie przez Ludzi: `-2 × Ludzie`, np. `-8` dla 4 obywateli
- Netto (wpływ na spichlerz): `+0 / +N / -N` (niedobór → strata obywatela)
- Próg wzrostu: ile żywności brakuje do +1 Ludzi (pasek graficzny), np. `14 / 20` (Town), `28 / 40` (City), `42 / 60` (Metropolis)
- Modyfikator Spichlerza: po wybudowaniu Spichlerza, po osiągnięciu progu spichlerz nie opróżnia się całkowicie — zostaje połowa; skraca to czas wzrostu przy następnym cyklu
- Modyfikator Zdrowia: niskie Zdrowie spowalnia wzrost (lub blokuje powyżej limitu); wyświetlić przy pasku informację `Zdrowie: OK / OSTRZEŻENIE / KRYTYCZNE`

#### 2b. Praca (produkcja)

- Praca brutto z pól + bonus budynków (Warsztatu, Kuźni itp.)
- Praca netto / turę: ile idzie do kolejki produkcji
- Przelicznik na Pieniądz (gdy dostępna Waluta): suwak Praca ↔ Pieniądz (analog suwaka Nauka/Skarbiec w Civ3)

#### 2c. Handel → Nauka i Pieniądz

- Handel brutto z pól (łąka, wybrzeże, rzeka): np. `+5`
- Suwak podziału (0–100%) Handel → Nauka / Skarbiec
  - Nauka: zasila globalny postęp badań (dodawana do puli cywilizacji)
  - Pieniądz (Skarbiec): wpływa do globalnego skarbca (po wynalezieniu Waluty; przed Walutą — Handel nie daje Pieniądza bezpośrednio)
- Bonus z Biblioteki: +3 Nauki/turę
- Bonus z Targowiska: +% Pieniądza (od Handlu)

#### 2d. Surowce z pól (wydobywcze)

Lista surowców produkowanych przez obrabiane pola i budynki w mieście, wyświetlana ikon + liczba/turę:

- Drewno (z Lasów)
- Kamień (z Wzgórz/Kopalni)
- Glina (złoże na łące/rzece)
- Ruda (Wzgórza/Góry z Kopalnią)
- Produkty przetwórcze: Deski (Tartak), Paliwo/Węgiel drzewny (Mielerz), Cegła (Cegielnia), Brąz/Żelazo (Huta)

Surowce bez złoża w zasięgu lub bez wymaganego budynku: wyszarzone / nieaktywne.

---

### Panel 3: Pasek wzrostu populacji

Graficzny pasek (progress bar) z etykietami:

```
Spichlerz żywności: [=======>       ] 14 / 20  (+0 netto → brak wzrostu)
```

- Jeśli netto > 0: czas do wzrostu w turach = `ceil((próg – zapas) / netto)`
- Jeśli netto = 0 lub < 0: „Brak wzrostu" lub „GŁÓD – strata Ludzi"
- Jeśli Zdrowie < minimum: „Wzrost zablokowany przez Zdrowie"
- Efekt Spichlerza (budynek): zachowuje 50% zapasu żywności po każdym wzroście

---

### Panel 4: Zdrowie i Zadowolenie

Dwa oddzielne wskaźniki, każdy z listą czynników.

#### 4a. Zdrowie (Health)

Określa limit populacji i tempo wzrostu. Poniżej minimum Zdrowie blokuje wzrost powyżej ustalonego pułapu (analogia Civ4 Health, ale uproszczona).

**Czynniki +Zdrowie:**
- Spichlerz: +2
- Akwedukt: +4 (odblokowany: Budownictwo)
- Dostęp do rzeki / wybrzeża: +1
- Farmy/Pastwiska w zasięgu: +1 za każde 2 pola
- Budynki sanitarne (późniejsze epoki)

**Czynniki −Zdrowie:**
- Każdy obywatel powyżej 6 (bez Akweduktu): −1 za każdego
- Zanieczyszczenie (późniejsze epoki)
- Brak żywności w zasięgu

#### 4b. Zadowolenie (Happiness)

Określa, czy w mieście dochodzi do zamieszek (Civil Disorder). Jeśli niezadowoleni > zadowoleni → nieporządek → miasto nie produkuje.

**Czynniki +Zadowolenie:**
- Świątynia: +1 szczęśliwego obywatela
- Luksus w zasięgu/handlu: +1 za każdy (bydło/owce jako „luksus bonusowy": +1 Żywności i +1 Zadowolenia)
- Budynki rozrywkowe (Teatr, Arena — późniejsze epoki)
- Zbytki/luksusy importowane przez Handel

**Czynniki −Zadowolenie:**
- Każdy obywatel powyżej progu (bez budynków): −1 za każdego
- Zmęczenie wojenne (jeśli mechanika war weariness wdrożona)
- Podatki globalne zbyt wysokie

Wyświetlenie: rząd twarzy (uśmiechnięte/smutne ikony), np. `😊😊😊😁` — zadowoleni, `😞😞` — niezadowoleni.

---

### Panel 5: Kultura i Religia

#### 5a. Kultura

- Kultura/turę: suma z budynków (Biblioteka, Świątynia) + base 1/turę
- Łączna Kultura miasta: skumulowany licznik (określa zasięg granic)
- Progi zasięgu granic (ilość pól terytorium):
  - 0–9 pkt: zasięg 1 pole (miasto + bezpośrednie sąsiedztwo)
  - 10–99 pkt: zasięg 2 pola (standardowy krąg 21 pól)
  - 100–499 pkt: zasięg 3 pola (pełny krzyż)
  - 500+ pkt: wpływ na asymilację sąsiednich neutralnych pól
- Wizualizacja: obwódka terytorialna na mapie świata wokół miasta

#### 5b. Religia

- Dominująca religia: text + ikona (np. „Politeizm — Świątynia: +1 Zadowolenie")
- Budynki religijne w mieście (Świątynia, Katedra — późniejsze epoki)
- Efekt: każde budynek religijny daje +1 Zadowolenie i +1 Kultura/turę
- Misjonarze: jednostka wychodząca z miasta może przenosić religię do innych (mechanika v0.3+)

---

### Panel 6: Kolejka produkcji

Centralny element zarządzania. Wyświetla co miasto aktualnie buduje i ile zostało.

| Element | Wyświetlenie |
|---|---|
| Nazwa budynku/jednostki | np. `Spichlerz`, `Włócznik` |
| Koszt Pracy | np. `25 Praca` |
| Wymagane materiały | np. `10 Cegła + 8 Kamień` |
| Postęp | `[=========>   ] 18/25 Praca (3 tury)` |
| Wykup za Pieniądz | `Wykup: 25 Pieniądz` (dostępne po Walucie; dźwignia ×10 Pracy) |
| Kolejka (q) | lista kolejnych budynków/jednostek (Civ3: Shift+Q = zapis kolejki) |

Przycisk: `Zmień produkcję` → popup z listą dostępnych budynków i jednostek (odfiltrowane według wymogów technologicznych i surowcowych).

---

### Panel 7: Lista budynków w mieście

Przewijalna lista wybudowanych budynków z ikonami i skrótowymi efektami:

| Budynek | Efekt |
|---|---|
| Tartak | +Deski/turę (2 drewno → 1 deska) |
| Mielerz | +Paliwo/turę |
| Cegielnia | +Cegła/turę (wymaga gliny i paliwa) |
| Spichlerz | Zachowuje 50% żywności po wzroście; +2 Zdrowie |
| Mury | +Obrona (procentowy bonus dla garnizonowanych jednostek) |
| Koszary | Jednostki tworzone jako Weterani |
| Biblioteka | +3 Nauki/turę; +1 Kultura/turę |
| Świątynia | +1 Zadowolenie; +1 Kultura/turę |
| Targowisko | +% Pieniądza z Handlu; aktywuje mechanikę rush-buy |
| Kopalnia | Dostęp do Kamienia/Rudy z Wzgórz/Gór w zasięgu |
| Akwedukt | +4 Zdrowie; umożliwia wzrost ponad 6 Ludzi (City) |

Budynki niedostępne w tej epoce: wyszarzone (tooltip: wymagana technologia).

---

### Panel 8: Magazyny lokalne

Wyświetlenie aktualnych zapasów surowców w magazynie miasta (v0.2 — pełna gospodarka ilościowa; w v0.1 wyświetlamy tylko „dostęp: tak/nie").

| Surowiec | Zapas | Pojemność | Stan |
|---|---|---|---|
| Drewno | 12 | 20 | OK |
| Kamień | 4 | 20 | Niski |
| Glina | 0 | 20 | Brak — Cegielnia bezczynna |
| Cegła | 7 | 15 | OK |
| Ruda | 0 | 10 | Brak złoża |
| Brąz | 3 | 10 | OK |

Pojemność bazowa: 20 jednostek na surowiec. Magazyn (budynek, v0.2): +20 pojemności. Nadmiar powyżej pojemności: automatyczna sprzedaż na Rynku po bieżącej cenie.

---

### Panel 9: Obrabiane pola — miniatura mapy terytorium

Centralny element widoku (wzorzec Civ3: „Big Fat Cross"). Wyświetla pola w zasięgu 2 kafelek od miasta.

- Każde pole: ikona terenu + ikona surowca (jeśli jest) + ikona Ludzi/zwierząt przypisanych
- Pole nieobrabiane: wyszarzone; kliknięcie przypisuje Ludzi (lub zwierzę: Wół, Owce)
- Pole z ulepszeniem (Farma, Kopalnia, Pastwisko, Droga): dodatkowa ikona ulepszenia
- Obrabiane pole: podświetlenie + liczby plonów (Żywność, Praca, Handel)
- Limit obrabianych pól = liczba Ludzi (każdy Człowiek obsługuje 1 pole; Wół/Owce mogą obsługiwać pola Pastwisk)
- Specjaliści (v0.2): Człowiek nieprzypisany do pola → specjalista (Uczony, Kupiec, Kapłan) dający bonus zamiast plonów

---

### Panel 10: Garnizon i obrona

- Lista jednostek stacjonujących w mieście (ikona + siła bojowa + doświadczenie)
- Bonus obronny miasta (%, zależny od poziomu: Osada/Miasto/Metropolia)
- Mury: dodatkowy % obrony
- Wzgórze/terrain bonus: jeśli miasto na wzgórzach — +dodatkowy bonus
- Jednostki w garnizonie nie wykonują działań (poza obroną) do czasu ręcznego wyprowadzenia

---

### Panel 11: Przyciski akcji

Rząd przycisków na dole widoku:

| Przycisk | Działanie |
|---|---|
| `Zmień produkcję` | Otwiera listę budynków/jednostek do budowy |
| `Zarządzaj polami` | Przełącza do trybu edycji przydziału pól (ręczne vs. automatyczne) |
| `Suwak Handlu` | Przesuwa proporcję Handel → Nauka/Skarbiec (globalnie lub per miasto) |
| `Wykup (Pieniądz)` | Kończy bieżącą budowę za Pieniądz (aktywne po Walucie) |
| `Zatrudnij specjalistę` | Przenosi obywatela z pola na specjalizację (v0.2) |
| `Zamknij` | Powrót do mapy świata |

---

## B. SZABLON MAPY TERENÓW

### B1. Typy terenu i plony bazowe

Odwołanie do `Plony-terenow.xlsx` (projekt) i `Szablon-gry_projekt-mechanik.md`. Każde pole (kafelek) generuje poniższe wartości, gdy jest obrabiane przez miasto.

| Teren | Żywność | Praca | Handel | Drewno | Kamień | Uwagi |
|---|---|---|---|---|---|---|
| Łąka | 2 | 1 | 1 | 0 | 0 | Najlepsze pod farmy i wzrost |
| Równina | 1 | 1 | 1 | 0 | 0 | Uniwersalne; farmy lub kopalnie |
| Las | 1 | 1 | 0 | 2 | 0 | Źródło drewna; wycinanie = +10P jednorazowo |
| Wzgórza | 0 | 2 | 0 | 0 | 1* | Kamień i Ruda (z Kopalnią); +bonus obronny |
| Góry | 0 | 0 | 0 | 0 | 1* | Nieprzechodnie bez drogi; Ruda z Kopalnią |
| Pustynia | 0 | 1 | 0 | 0 | 0 | Sporadycznie ropa/saletra (późne epoki) |
| Tundra | 1 | 0 | 0 | 0 | 0 | Uboga; bywa ropa |
| Wybrzeże | 2 | 0 | 2 | 0 | 0 | Port + rybołówstwo |
| Morze | 1 | 0 | 2 | 0 | 0 | Głęboka woda; jednostki morskie |
| Nizina zalewowa / Deltowa | 3 | 0 | 1 | 0 | 0 | Rzeka przez pustynię/łąkę; podatna na choroby |

\* Kamień i Ruda z Wzgórz/Gór dopiero po wybudowaniu Kopalni. Bez Kopalni pole Wzgórza: Żywność 0, Praca 2, Handel 0 (tylko siła robocza).

**Uwaga dot. poziomów miejskich (Civ3):**
- Osada (1–6 Ludzi): rośnie bez specjalnych budynków
- Miasto (7–12): wymaga Spichlerza lub dostępu do rzeki/jeziora
- Metropolia (13+): wymaga Akweduktu

---

### B2. Modyfikator Rzeka

Rzeka jest nakładką na krawędź kafelka (nie osobnym typem terenu). Efekty:

- +1 Handel do pola sąsiadującego z rzeką (na krawędzi, nie rogu)
- +1 Żywność przy irygacji pola na rzece (Farma na polu z rzeką)
- Bonus obronny dla atakującego przez rzekę: −25% siły ataku (rzeka jako przeszkoda)
- Dostęp do wody słodkiej: umożliwia wzrost ponad 6 Ludzi bez Akweduktu (Osada → Miasto)
- Nizina zalewowa: pole Pustyni/Łąki bezpośrednio na rzece → typ specjalny (3 Żywności, 1 Handel bazowo)

---

### B3. Złoża i surowce na polach

Złoża to ikony nałożone na teren. Dzielą się na trzy kategorie (wzorzec Civ3).

#### Surowce bonusowe (zwiększają plony)

| Surowiec | Teren | Bonus plonów | Wymaganie |
|---|---|---|---|
| Zboże | Łąka / Równina | +2 Żywność | brak (dostępne od początku) |
| Bydło (Krowa/Wół) | Łąka / Równina | +2 Żywność, +1 Praca | Pastwisko |
| Owce | Wzgórza / Łąka | +2 Żywność, +1 Handel | Pastwisko |
| Ryby | Wybrzeże | +2 Żywność | Port / Przystań |
| Wieloryb | Morze | +1 Żywność, +2 Handel | Port (późna epoka) |
| Dzikie zwierzęta (Łowy) | Las / Łąka | +1 Żywność | brak (wczesne epoki) |

Wół i Owce pełnią podwójną rolę: bonusowy surowiec żywnościowy + „jednostka robocza" przypisywana do Pastwiska zamiast Człowieka.

#### Surowce strategiczne (odblokowują łańcuchy i jednostki)

| Surowiec | Teren | Wymagane ulepszenie | Odblokowuje |
|---|---|---|---|
| Glina | Łąka / rzeka | brak (zbierana bezpośrednio) | Cegielnia → Cegła |
| Ruda miedzi/brązu | Wzgórza / Góry | Kopalnia | Huta → Brąz |
| Ruda żelaza | Wzgórza / Góry | Kopalnia (Epoka Żelaza) | Huta → Żelazo |
| Węgiel kamienny | Wzgórza / Góry | Kopalnia (Epoka Żelaza) | Kopalnia → Paliwo przemysłowe |
| Konie | Równina / Łąka | Pastwisko | Jednostki konne (Rydwan, Kawaleria) |
| Ropa | Pustynia / Tundra / Morze | Wiertnia (późna epoka) | Paliwo nowoczesne |
| Uran | Góry / Tundra | Kopalnia (Epoka Atomu) | Reaktor, Bomba |
| Saletra | Pustynia | Kopalnia (Epoka Prochu) | Muszkieterowie, Armaty |

#### Surowce luksusowe (wpływ na Zadowolenie i Handel)

| Surowiec | Teren | Efekt |
|---|---|---|
| Winogrona / Wino | Łąka / Równina | +1 Zadowolenie w każdym podłączonym mieście |
| Jedwab / Bawełna | Las / Łąka (późne) | +1 Zadowolenie |
| Klejnoty / Złoto | Góry / Wzgórza | +4 Handel z pola + Zadowolenie |
| Przyprawy / Kadzidło | Tropiki (późna mapa) | +1 Zadowolenie + bonus Handlu |
| Skóry (Futra) | Tundra / Las | +1 Praca, +1 Zadowolenie |

Podłączenie luksusu do miasta wymaga drogi/portu lub bezpośredniego zasięgu. Targowisko (budynek) zwiększa bonus z luksusów: 3–4 luksusy = +1 dodatkowe szczęście, 5–6 = +2 itd.

---

### B4. Modyfikacje terenu — ulepszenia budowane Pracą

Robotnicy (jednostka) budują ulepszenia na polach. Każde ulepszenie trwa N tur (zależnie od terenu i epoki).

| Ulepszenie | Koszt budowy | Efekt na polu | Wymaga technologii |
|---|---|---|---|
| Farma | 4–6 tur Robotnika | +1 Żywność (na Łące/Równinie); +2 jeśli przy rzece lub Irygacji | Podstawy rolnictwa |
| Pastwisko | 4 tury | Odblokowuje Bydło/Owce; pole daje bonus surowca | Udomowienie zwierząt |
| Kopalnia | 5–8 tur | +Kamień lub +Ruda z Wzgórz/Gór | Górnictwo |
| Tartak (leśna) | 3 tury | Las → +1 Drewno (zamiast wycinania) | brak |
| Wycinka | 3 tury | Usuwa Las, jednorazowe +10 Praca do miasta; odsłania teren bazowy | brak |
| Droga | 2–3 tury | Ruch jednostek: ÷3 kosztu; łączy miasta w sieć handlową; +0 do plonów | brak |
| Irygacja | 6–8 tur | +1 Żywność (działa łańcuchowo od rzeki lub jeziora) | Nawadnianie |
| Umocnienia | 4 tury | +bonus obronny na polu | Fortyfikacje (Epoka Brązu) |

Irygacja musi ciągnąć się od źródła wody (rzeki, jeziora, wybrzeża) pole po polu — nie można postawić w środku lądu bez połączenia.

---

### B5. Zasięg / terytorium miasta i mgła wojny

#### Zasięg (Big Fat Cross)

- Miasto obrabia pola w odległości maks. 2 kafelków (kwadrat 5×5 = 21 pól, minus rogi = 21 w Civ3; w wersji heksagonalnej: 19 heksów w promieniu 2).
- Pole w zasięgu geograficznym staje się terytorium, gdy miasto zgromadzi odpowiednio dużo Kultury (patrz Panel 5a).
- Pola poza zasięgiem kulturowym: można obrabiać dopiero po ekspansji granic lub po zbudowaniu Fortu/Misji.
- Konflikt granic: jeśli dwa miasta mają zasięg na to samo pole — pole należy do tego z wyższą Kulturą.

#### Mgła wojny

- Pola nieodkryte: ciemne (fog of war = całkowita niewidoczność).
- Pola odkryte, ale niewidoczne (poza zasięgiem jednostek): szarość (widać teren, ale nie jednostki/zmiany).
- Pola widoczne (w zasięgu jednostki lub miasta): pełne kolory.
- Odkrycie: jednostka wchodzi na pole lub miasto rozszerza granice na pole.

---

### B6. Zasady kompozycji mapy (wytyczne dla generatora)

Poniższe reguły dotyczą algorytmicznego generowania mapy startowej. Celem jest zrównoważona, interesująca rozgrywka z różnorodnym terenem.

#### Zasada wody na brzegach

- Mapa zawsze otoczona Morzem (Ocean) na krawędziach.
- Wybrzeże (1–2 pasy kafelków od Morza): teren Wybrzeże / Niziny zalewowe.
- Wewnątrz kontynentu: brak izolowanych plam Morza (jeziora = osobny typ, max 3×3 kafelki).

#### Proporcje terenów (kontynent standardowy)

| Teren | Udział (%) | Uwaga |
|---|---|---|
| Łąka | 25–30 | Przewaga w strefach umiarkowanych |
| Równina | 20–25 | Mieszana z Łąką |
| Las | 10–15 | Skupiony w plamach, nie rozproszony |
| Wzgórza | 10–15 | Przy górach lub jako pasy |
| Góry | 5–8 | Łańcuchy, nie pojedyncze szczyty |
| Pustynia | 5–10 | Strefy suche (południe/klimat ciepły) |
| Tundra | 5–10 | Bieguny / północ |
| Wybrzeże | 10–15 | Linia brzegowa |
| Morze / Ocean | reszta | Obramowanie + obszary wodne |

#### Gęstość złóż

- Surowce bonusowe: średnio 1 złoże na każde 8–10 pól lądu.
- Surowce strategiczne: 1 złoże na każde 15–20 pól (rzadsze, wartościowsze).
- Surowce luksusowe: 1 złoże na każde 25–30 pól (najrzadsze, pobudzają handel).
- Złoża Gliny: skupione przy rzekach i Łąkach (1 na 6–8 pól nadrzecznych).
- Bydło/Owce: max 1–2 złoża w promieniu 5 pól od pozycji startowej każdej cywilizacji (cel: zapewnienie wczesnego wzrostu).
- Konie: 1 złoże na mapie na cywilizację (ważna decyzja strategiczna).
- Ruda miedzi: 2–3 złoża na kontynent (standard dla v0.1: Epoka Brązu).

#### Rozmieszczenie rzek

- Rzeki startują z Wzgórz/Gór i płyną do Wybrzeża/Jeziora.
- Minimalna długość rzeki: 4 pola.
- Rzeki tworzą Niziny zalewowe na polach Pustyni, które przecinają.
- Każda cywilizacja startowa powinna mieć rzekę w zasięgu 4 pól od pozycji startowej.

#### Pozycje startowe cywilizacji

- Minimum 4 pola Łąki lub Równiny w zasięgu 2 pól od pozycji startowej.
- Minimum 1 surowiec bonusowy (Zboże lub Bydło/Owce) w zasięgu 3 pól.
- Minimum 1 Las w zasięgu 2 pól (dostęp do Drewna).
- Brak innej cywilizacji w promieniu 8 pól (zapobiega natychmiastowemu konfliktowi).
- Preferowane: pozycja przy rzece (dostęp do wody słodkiej = wzrost bez Akweduktu).

#### Pasma górskie

- Góry zawsze sąsiadują z Wzgórzami (przynajmniej 50% sąsiadów Gór to Wzgórza).
- Łańcuch górski: min. 3 kafelki Gór w linii.
- Góry jako naturalna bariera między cywilizacjami: preferowane przy generowaniu z wieloma cywilizacjami.

---

## C. NOTA IMPLEMENTACYJNA

Dokument ten jest szablonem dla:
1. **Front-end widoku miasta (HTML/JS):** każdy panel A1–A11 odpowiada jednemu komponentowi UI. Dane wejściowe = obiekt `city` w stanie gry; renderowanie = DOM/Canvas. Kolejność paneli sugeruje układ: nagłówek góra, plony lewy panel, mapa środek, produkcja/budynki prawy panel, magazyn dolny panel.
2. **Generator mapy (JS):** sekcja B definiuje typy terenów, reguły rozmieszczenia i proporcje. Generator losuje mapę zgodnie z wagami z B6, następnie rozmieszcza złoża zgodnie z gęstością B3. Rzeki generowane osobnym przebiegiem (flood-fill od Wzgórz do Wybrzeża).

Terminologia w kodzie: używać polskich nazw zmiennych odpowiadających terminologii projektu (`zywnosc`, `praca`, `handel`, `nauka`, `pieniadz`, `ludzie`, `kultura`, `zdrowie`, `zadowolenie`).

---

## Źródła i inspiracje

- [City (Civ3) — Civilization Wiki](https://civilization.fandom.com/wiki/City_(Civ3)) — opis mechaniki miasta Civ3, poziomy Osada/Miasto/Metropolia, Big Fat Cross
- [Food (Civ3) — Civilization Wiki](https://civilization.fandom.com/wiki/Food_(Civ3)) — mechanika Żywności i Spichlerza (food box 20/40/60)
- [Chapter 7: All About Terrain and Resources — Sullla's Civ3 Strategy Guide](https://sullla.com/Civ3/strat7.html) — szczegółowe plony terenów Civ3, surowce bonusowe/strategiczne/luksusowe
- [OpenCiv3 — GitHub C7-Game/OpenCiv3](https://github.com/C7-Game/OpenCiv3) — modernizacja Civ3 (Godot + C#), inspiracja layoutem i mechanikami
- [OpenCiv3 — forums.civfanatics.com](https://forums.civfanatics.com/forums/openciv3.604/) — dyskusje projektowe OpenCiv3
- [Decyzje-projektowe-v0.1.md](../The%20Game/Decyzje-projektowe-v0.1.md) i [Szablon-gry_projekt-mechanik.md](../The%20Game/Szablon-gry_projekt-mechanik.md) — wewnętrzna specyfikacja projektu gry (terminologia, plony, ekonomia ×10)
