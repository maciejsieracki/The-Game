# Schemat działania miasta — specyfikacja

> Źródła: `PROJEKT-GRY-master.md`, `Budynki.xlsx`, `Widok-miasta.html`, `Surowce.xlsx`.
> Data: 2026-06-21. Status: do akceptacji.

---

## Spis sekcji

1. [Układ ekranu miasta](#1-układ-ekranu-miasta)
2. [Ekonomia miasta](#2-ekonomia-miasta)
3. [Budowa](#3-budowa)
4. [Ludność i wzrost](#4-ludność-i-wzrost)
5. [Zdrowie miasta](#5-zdrowie-miasta)
6. [Kultura i religia](#6-kultura-i-religia)
7. [Magazyny i okolica](#7-magazyny-i-okolica)
8. [Jednostki w mieście](#8-jednostki-w-mieście)
9. [Zależności — diagram słowny](#9-zależności--diagram-słowny)

---

## 1. Układ ekranu miasta

Ekran podzielony jest na trzy strefy pionowe plus pasek górny, pasek dolny i sekcję okolicy pod całością.

### 1.1 Nagłówek (pasek górny)

| Element | Co pokazuje / co robi |
|---|---|
| Strzałki ◀ ▶ + nazwa miasta | Nawigacja między miastami cywilizacji |
| ★ (gwiazdka) | Oznacza stolicę |
| Odznaka „Ludzie: N • Miasto" | Aktualna liczba mieszkańców i typ osady |
| Epoka (np. „Epoka Brązu") | Bieżąca epoka cywilizacji |
| Nastrój (emoji + opis) | Ogólny stan emocjonalny: Zadowolone / Kontent / Niezadowolone |
| Kultura: +N/t • łącznie M | Produkcja kultury na turę i łączny skumulowany zasób |
| Selektor czcionki (Mały/Średni/Duży/B.Duży) | Skaluje cały interfejs (zmienna CSS `--ui-scale`) |
| Przyciski: Zmień nazwę / Zarządca / Widok / ✕ | Akcje zarządzania miastem |

### 1.2 Lewa kolumna

**Panel Mieszkańcy** — wyświetla każdego mieszkańca jako kolorowy krążek:
- Żółty (😄) = zadowolony
- Szary (😐) = kontentny
- Czerwony (😠) = niezadowolony
- Niebieski (U/P/A) = specjalista (Uczony / Poborca / Artysta)

Pod ikonami: licznik Zad./Kont./Niezad. + informacja o premii szczęścia (np. `+1😄 ze Świątyni`).

**Panel Specjaliści** — lista aktualnie przypisanych specjalistów (typ, ikona, bonus/turę). Przycisk `+ Dodaj specjalistę` otwiera wybór.

**Panel Zdrowie miasta** — suma `♥ +N` (czynniki pozytywne) i `💀 −N` (czynniki negatywne) = wynik netto. Szczegóły wiersz po wierszu (np. Akwedukt +4, Bagno −1).

**Panel Budynki w mieście** — lista wybudowanych budynków, każdy z:
- ikoną i nazwą
- efektem (zielony, np. `+25% pracy`)
- kosztem utrzymania (czerwony, np. `−1💱`)

Na dole: łączne utrzymanie wszystkich budynków w turze.

### 1.3 Środkowa kolumna

**Panel Bilans plonów / turę** — trzy boksy obok siebie:

| Boks | Pokazuje |
|---|---|
| Żywność | Produkcja brutto, zużycie (ludność + jednostki), nadwyżka netto; źródła (pola, specjaliści, budynki) |
| Praca | Produkcja brutto, marnotrawstwo (korupcja), netto; źródła; co aktualnie produkuje |
| Handel | Produkcja brutto, korupcja, netto; źródła (pola, targowisko, specjaliści, sieć handlowa) |

**Panel Podział Handlu** — suwak `Nauka ↔ Pieniądz` z trzecim odcinkiem Luksus. Pod suwakiem trzy boksy:
- Nauka (% handlu → +N🔬/t)
- Pieniądz (% handlu → +N💰/t)
- Luksus (% handlu → +N😄/t)

Na dole: utrzymanie budynków i wynik netto Pieniądza (może być ujemny — ostrzeżenie ⚠).

**Panel Magazyn Żywności — wzrost populacji** — pasek postępu (aktualne zapasy / próg wzrostu), szacowany czas do następnego wzrostu, informacja o Spichlerzu (zachowuje 50% po wzroście).

**Panel Produkcja** — aktualnie budowany obiekt: ikona, nazwa, koszt całkowity w Pracy, zebrana Praca, pasek postępu, szacowane tury do ukończenia. Przyciski: `Zmień`, `Wykup` (natychmiastowe za Pieniądz), `Wstrzymaj`. Kolejka budowy poniżej (miniikony z szacowanym czasem, przyciski `+ Dodaj` i `⬆ Przesuń`).

### 1.4 Prawa kolumna

**Panel Garnizon** — lista jednostek w mieście: ikona, nazwa, staty (Atak/Obr/Ruch), pasek HP (zielony/czerwony), wartość HP. Odznaka premii obronnej budynku (np. `+25% obr. z Palisady`). Przyciski: `+ Rekrutuj`, `→ Wyślij poza miasto`, `Wylecz`.

**Panel Magazyny Surowców** — siatka 2×N z zasobami (ikona, nazwa, ilość/pojemność, +N/t, pasek). Pojemność bazowa miasta pod listą + przycisk `+ Powiększ`.

**Panel Kultura i Religia** — dwa pod-panele obok siebie:
- **Kultura:** pierścień z łączną kulturą, produkcja/t, aktualny zasięg granic (w polach), próg do następnego zasięgu (w punktach kultury), lista źródeł.
- **Religia:** nazwa religii dominującej, liczba wyznawców / ludność, efekt (+zadowolenie, +kultura/t).

### 1.5 Dolny pasek (footer)

Przyciski nawigacji globalnej: Mapa / Miasta / Raporty / Jednostki / Nauka / Dyplomacja / Ulepszenia terenu / Handel wewnętrzny.

Prawa strona paska: numer tury, rok, stan skarbca (globalny, w 💱), aktualnie badana technologia + szacowany czas.

### 1.6 Sekcja Okolica (pod ekranem)

Siatka heksagonalna 10×10 pokazująca zasięg miasta. Każdy heks: ikona terenu, plony (🍞/🔨/💱), liczba ludności wioski, oznaczenie obrabiania (zielona obwódka) i granicy zasięgu (złota przerywana).

**Kliknięcie na heks w siatce okolicy robi jedno z dwóch** (zależnie od kontekstu):

- **Przydziel / zabierz pracownika** — standardowa akcja; przypisuje lub odpisuje mieszkańca do pracy na tym terenie, co wpływa na plony (żywność, Praca, Handel).
- **Załóż nowe miasto** — dostępne TYLKO jeśli:
  1. Na heksie jest **wioska** (nasz teren, wcześniej zdobyty lub który się przyłączył), ORAZ
  2. Odległość od każdego innego naszego miasta wynosi **≥ 5 pól**.
  Gdy oba warunki są spełnione, kliknięcie otwiera popup z opcją „Przekształć w miasto" (budowa miasta następuje natychmiast, bez osadnika). Osadnik potrzebny jest wyłącznie do zakładania miast **poza zasięgiem** istniejących miast.

Po prawej legenda terenu i ikon.

---

## 2. Ekonomia miasta

### 2.1 Trzy waluty robocze

| Waluta | Źródła | Przeznaczenie |
|---|---|---|
| **Praca** | Pola w okolicy + budynki (Młyn ×2, Cegielnia +25%) | Budowa budynków i ulepszeń terenu |
| **Handel** | Pola z handlem + Targowisko (+50%) + Specjalista Poborca | Dzielony suwakiem na Naukę / Pieniądz / Luksus |
| **Pieniądz** | Część Handlu (po suwaku) + podatki | Kupno/utrzymanie jednostek, wykup budynków, handel między miastami |

Kurs bazowy: **1 Pieniądz = 1 Praca**.

W Epoce Kamienia (przed wynalezieniem Waluty) Handel pełni rolę substytutu Pieniądza — za niego można kupować jednostki. Po Walucie Mennica zamienia Handel na Pieniądz z mnożnikiem.

### 2.2 Suwak podziału Handlu

Gracz ustawia proporcje (przykład makiety: 60% Nauka / 30% Pieniądz / 10% Luksus). Luksus → +zadowolenie mieszkańców.

### 2.3 Co produkują pola okolicy

Plony bazowe wg terenu (za każde **obrabiane** pole, bez ulepszeń):

| Teren | Żywność | Praca | Handel | Drewno | Kamień |
|---|---|---|---|---|---|
| Łąka | 4 | 1 | 1 | 1 | 0 |
| Równina | 2 | 1 | 1 | 2 | 1 |
| Las (nakładka) | 1 | 1 | 1 | 4 | 0 |
| Wzgórza | 1 | 2 | 0 | 2 | 2 |
| Góry | 0 | 0 | 0 | 2 | 5 |
| Wybrzeże | 3 | 2 | 2 | 0 | 0 |
| Morze | 2 | 0 | 2 | 0 | 0 |
| Pustynia | 0 | 0 | 1 | 0 | 0 |

**Modyfikator Rzeka** (nakładka): +3 żywność / +2 Praca / +2 Handel — dodawany do pola z rzeką.

Las i złoża surowców to **nakładki** na terenie bazowym (model dwuwarstwowy). Wycinka lasu odsłania teren i daje drewno.

### 2.4 Bonusy budynków do ekonomii

| Budynek | Efekt ekonomiczny |
|---|---|
| Tartak | Przetwarza 1 drewno → 1 deskę (maks 2/t) |
| Mielerz | Przetwarza 1 drewno → 1 paliwo (maks 2/t) |
| Cegielnia | +25% Pracy lokalnie; przetwarza glinę+paliwo → cegłę |
| Garncarnia | glina+paliwo → ceramika (luksus: +zadowolenie, +Zdrowie) |
| Młyn | +2 Pracy (lokalnie), ×2 do Pracy bazowej |
| Targowisko | +50% Handlu lokalnie |
| Mennica | Handel → Pieniądz ×mnożnik (po tech Waluta) |
| Biblioteka | +50% Nauki lokalnie |
| Świątynia | +1 Kultura/t, +1 zadowolony mieszkaniec |
| Akwedukt | +2 Zdrowia, odblokowuje wzrost powyżej 6 ludności |

### 2.5 Korupcja i marnotrawstwo

- **Marnotrawstwo** (Praca) i **Korupcja** (Handel) — odejmowane od brutto, wyświetlane w panelu Bilans plonów. Wartość rośnie z odległością od stolicy i wielkością państwa. Szczegółowe współczynniki do ustalenia.

### 2.6 Pieniądz — skarbiec centralny

Pieniądz jest **globalny** — zbierany centralnie w stolicy. Utrata stolicy zeruje skarbiec; podbój stolicy wrogiem = przejęcie skarbca przez niego.

---

## 3. Budowa

### 3.1 Jak działa kolejka

1. Gracz otwiera panel Produkcji i wybiera obiekt (`+ Dodaj` do kolejki).
2. Miasto co turę „wpłaca" do budowy wartość swojej **Pracy netto** (po marnotrawstwie) — ale nie całą. Gracz ustala **suwakiem PROCENT Pracy** podział na dwa strumienie:
   - **Praca → BUDYNKI** (określony % Pracy netto trafia do kolejki produkcji miasta),
   - **Praca → PRACE W TERENIE** (pozostały % idzie na budowę ulepszeń heksów: kopalnie, farmy, irygacje, drogi, tartaki itp. na mapie świata).
   Domyślny podział i zakres suwaka do ustalenia w balancie; gracz może go zmieniać dowolnie co turę.
3. Gdy zebrana Praca (strumień Budynki) osiągnie koszt obiektu → obiekt gotowy, automatycznie uruchamia się kolejny z kolejki.
4. Gracz może zmieniać kolejność (`⬆ Przesuń`) lub usunąć element.

### 3.2 Opcja Wykup

Przycisk `💰 Wykup (N 💱)` — płaci Pieniądzem i kończy budowę natychmiast. Koszt wykupu = pozostała Praca przeliczona po kursie 1:1 (1 Praca = 1 Pieniądz).

### 3.3 Wstrzymanie budowy

Przycisk `⏸ Wstrzymaj` — miasto przestaje inwestować Pracę w bieżący obiekt; dotychczasowy postęp zostaje zachowany. Używane gdy gracz chce tymczasowo przypisać Pracę inaczej (np. do ulepszenia terenu).

### 3.4 Co odblokowuje budynki

| Warunek odblokowania | Przykłady |
|---|---|
| Epoka Kamień (od startu) | Tartak, Mielerz, Kopalnia, Cegielnia, Garncarnia, Pastwisko, Młyn, Spichlerz, Magazyn, Mury z kamienia |
| Tech **Garncarstwo** | Cegielnia, Garncarnia, Spichlerz |
| Tech **Murarstwo** | Kopalnia, Mury z kamienia |
| Tech **Oswojenie zwierząt** | Pastwisko |
| Epoka Brąz + tech **Brązownictwo** | Koszary, Huta |
| Tech **Religia** | Świątynia |
| Tech **Pismo** | Biblioteka |
| Tech **Waluta** | Targowisko, Mennica |
| Tech **Budownictwo** | Akwedukt |
| Tech **Murarstwo** (Brąz) | Mury z cegły |

Dodatkowa reguła: niektóre technologie wymagają **istniejącego budynku** (np. Żegluga wymaga Tartaku).

### 3.5 Koszty budynków (wybrane)

| Budynek | Praca | Pieniądz | Materiały (budowa) | Utrzymanie/t |
|---|---|---|---|---|
| Tartak | 15 | 15 | 10 drewna | 1 💱 |
| Mielerz | 12 | 12 | 8 drewna | 1 💱 |
| Kopalnia | 15 | 15 | 10 drewna | 1 💱 |
| Cegielnia | 20 | 20 | 8 drewna + 6 kamienia | 1 💱 |
| Garncarnia | 18 | 18 | 6 drewna + 4 kamienia | 1 💱 |
| Pastwisko | 18 | 18 | 6 drewna + 4 kamienia | 1 💱 |
| Młyn | 20 | 20 | 6 drewna + 6 kamienia + 4 deski | 1 💱 |
| Spichlerz | 25 | 25 | 6 kamienia + 10 cegły | 1 💱 |
| Magazyn | 20 | 20 | 6 drewna + 4 kamienia + 6 desek | 1 💱 |
| Mury z kamienia | 30 | 30 | 12 kamienia | 1 💱 |
| Koszary | 22 | 22 | 8 drewna + 8 kamienia | 1 💱 |
| Huta | 25 | 25 | 8 kamienia + 6 desek | 1 💱 |
| Świątynia | 30 | 30 | 6 kamienia + 4 deski + 12 cegły | 1 💱 |
| Biblioteka | 30 | 30 | 10 desek + 8 cegły | 1 💱 |
| Targowisko | 30 | 30 | 10 desek + 12 cegły | 1 💱 |
| Mennica | 30 | 30 | 8 kamienia + 8 cegły + 4 brązu | 1 💱 |
| Akwedukt | 30 | 30 | 10 kamienia + 10 cegły | 1 💱 |
| Mury z cegły | 30 | 30 | 5 drewna + 5 kamienia + 15 cegły | 1 💱 |

---

## 4. Ludność i wzrost

### 4.1 Magazyn żywności i próg wzrostu

- Żywność netto (produkcja − zużycie) trafia do **magazynu żywności** miasta, ale tylko jeśli zbudowano **Spichlerz** (bez niego nadwyżka przepada, brak wzrostu z zapasu).
- Gdy zgromadzona żywność osiągnie **próg wzrostu**, miasto zyskuje +1 ludności.
- Próg wzrostu rośnie wraz z liczbą mieszkańców (przykład z makiety: 7 ludzi → próg = 100 🍞).
- **Spichlerz** zachowuje 50% zapasów po wzroście (bez Spichlerza: zapas resetuje się do 0 po każdym wzroście).
- Spichlerz zwiększa też pojemność magazynu żywności ×5 względem wartości bazowej.

### 4.2 Zużycie żywności

- Każdy mieszkaniec zużywa **1 żywność/turę**.
- Każda jednostka wojskowa w mieście i w polu również zużywa **1 żywność/turę**.
- Armia obozująca zużywa **0,5 żywności/turę na jednostkę**.

### 4.3 Zdrowie i zadowolenie jako modyfikatory wzrostu

- **Wzrost = wartość bazowa (stała) + współczynnik** zależny od nadwyżki żywności i poziomu zdrowia.
- Wysokie zdrowie → szybszy wzrost; niskie zdrowie → stagnacja lub spadek.
- Zadowolenie wpływa na stabilność i lojalność (i pośrednio na wzrost przez premie specjalistów i budynków). Stosunek zadowolonych do niezadowolonych jest widoczny w nagłówku miasta.

### 4.4 Specjaliści

Mieszkaniec może być przypisany jako specjalista zamiast pracować na polu. Trzy typy:

| Specjalista | Ikona | Bonus / turę |
|---|---|---|
| Uczony | 📚 (niebieski U) | +3 🔬 Nauki |
| Poborca | 💰 (niebieski P) | +2 💱 Pieniądza |
| Artysta | 🎨 (niebieski A) | +2 Kultury |

Przypisanie specjalisty = jeden mieszkaniec **nie obrabia pola** (utrata jego plonów). Decyzja gracza: specjalista vs. dodatkowe pole.

---

## 5. Zdrowie miasta

### 5.1 Czynniki wpływające na zdrowie

| Czynnik | Efekt |
|---|---|
| Akwedukt | +4 Zdrowia |
| Rzeka w pobliżu | +2 Zdrowia |
| Targowisko (handel żywnością) | +2 Zdrowia |
| Ceramika (Garncarnia) | +Zdrowia (wartość do ustalenia) |
| Bagno w promieniu miasta | −1 Zdrowia |
| Zanieczyszczenie dymu | −1 Zdrowia |
| Zagęszczenie / wielkość miasta | stale obniża (rośnie z populacją) |

Wynik netto = suma plusów − suma minusów. Wyświetlany w panelu Zdrowie jako ♥ +N i 💀 −N.

### 5.2 Wpływ zdrowia na wzrost

- Zdrowie > 0 → normalny lub przyspieszony wzrost populacji.
- Zdrowie = 0 → wzrost zatrzymany (stagnacja).
- Zdrowie < 0 → możliwy spadek populacji (szczegółowy próg do ustalenia).
- **Akwedukt** dodatkowo odblokowuje wzrost powyżej 6 mieszkańców (bez niego miasto nie rośnie dalej).

---

## 6. Kultura i religia

### 6.1 Kultura

- Miasto generuje punkty kultury każdą turę (widoczne jako `+N/t` w nagłówku i panelu Kultura).
- Punkty kumulują się (łączna kultura).
- Przy osiągnięciu progu kultura **rozszerza granice** miasta o kolejne pole (zasięg granic = liczba pól poza centrum dostępnych bez osadnika).
- Kolejny próg zasięgu jest widoczny (np. `Następny zasięg: 500 pkt`).

**Źródła kultury (przykład makiety):**

| Źródło | Kultura/t |
|---|---|
| Pałac (stolica) | +4 |
| Świątynia | +2 |
| Specjalista Artysta | +2 |

- Kultura na poziomie państwa: suma kultury odblokowuje **ustroje/polityki**; tworzy **presję kulturową** na sąsiadów (asymilacja, ryzyko buntów w podbitych miastach innej kultury).

### 6.2 Religia

- Każde miasto ma **dominującą religię** (np. Animizm).
- Budynki religijne (Świątynia) dają zadowolenie i bonusy kultury.
- Religia **rozprzestrzenia się** na sąsiednie miasta.
- Wyznawcy vs. ludność (np. `5 / 7`) — im więcej wyznawców, tym silniejszy efekt.
- **Wspólna religia** z sąsiadem = bonus dyplomatyczny; różna religia = napięcia / ryzyko buntów.
- Konwersja podbitych miast możliwa przez budynki/polityki.

---

## 7. Magazyny i okolica

### 7.1 Spichlerz (żywność)

- Bez Spichlerza: miasto ma bazową małą pojemność — nadwyżka żywności przepada, wzrost z zapasów niemożliwy.
- Po wybudowaniu Spichlerza: pojemność ×5, zachowanie 50% zapasów po wzroście.
- Tech odblokowania: **Garncarstwo**.

### 7.2 Magazyn (surowce)

- Bez Magazynu: każde miasto ma bazową małą pojemność surowców — nadwyżka przepada.
- Po wybudowaniu Magazynu: pojemność ×5 lokalnie.
- Pojemność globalna państwa = suma pojemności wszystkich magazynów.
- Surowce można przenosić między magazynami (gdy jeden pełny).
- Utrata miasta: surowce w jego magazynie **przepadają**. Podbój: zwycięzca przejmuje magazyn i jego zawartość.

### 7.3 Zasięg okolicy (10×10)

- W Epoce 1 każde miasto kontroluje siatkę **~10×10 ≈ 100 pól** wokół centrum.
- Zasięg rośnie o +1 co epokę (do ~20×20 w późnych epokach).
- Tylko pola w zasięgu można obrabiać i pozyskiwać z nich surowce.

### 7.4 Wioski w okolicy

- Każdy zamieszkiwalny heks (≥1 żywności) startuje z 1 wioską/1 ludnością.
- Zdobycie pola = przejęcie wioski i jej ludności jako obywateli (nie niewolników).
- **Każdy zajęty przez nas teren ma wioskę** (wcześniej zdobytą lub przyłączoną). Wioska jest warunkiem koniecznym do założenia tam miasta.
- Wioskę można **przekształcić w nowe miasto** poprzez kliknięcie jej heksu w siatce okolicy — możliwe TYLKO gdy:
  1. Na heksie jest **wioska** (nasz teren), ORAZ
  2. Odległość od każdego innego naszego miasta wynosi **≥ 5 pól**.
  Budowa miasta jest możliwa praktycznie wszędzie, gdzie mamy wioskę i zachowany dystans ≥5 — bez potrzeby osadnika.
- **Poza zasięgiem** istniejących miast: miasto zakładane przez **osadnika** (koszt 1 ludności).

### 7.5 Ulepszenia terenu

Robotnik buduje ulepszenia na polach (nie są budynkami miejskimi):

| Ulepszenie | Warunek | Efekt |
|---|---|---|
| Farma / Irygacja | Odpowiednia tech | +żywność z pola |
| Droga | Odpowiednia tech | +szybkość ruchu jednostek |
| Kopalnia | Tech Murarstwo | +kamień/ruda z wzgórz/gór |
| Pastwisko | Tech Oswojenie zwierząt | Hodowla bydła/owiec (wymaga zarodka ze złoża lub handlu) |

Pastwisko: bydło → +produkcja ×200% gdy przypisane; owce → +2 żywności gdy przypisane; tylko na łąkach, równinach, wzgórzach.

---

## 8. Jednostki w mieście

### 8.1 Rekrutacja

- Jednostki kupuje się **wyłącznie za Pieniądz** (w Epoce 1 za Handel-substytut; po Walucie — Pieniądz właściwy).
- Koszt = Pieniądz + **−1 ludności** (każda nowo stworzona jednostka zabiera 1 mieszkańca z populacji).
- Jednostki produkowane są w mieście jako wyniki kolejki produkcji (analogicznie do budynków, ale liczą się Pieniądzem, nie Pracą).
- Koszary (odblokowane w Epoce Brązu) dają rekrutowanym jednostkom **bonus doświadczenia** (Weterani).
- Palisada i Mury zwiększają premię obronną dla jednostek w garnizonie.

### 8.2 Garnizon

- Jednostki w mieście tworzą garnizon widoczny w panelu Garnizon (ikona, nazwa, HP, staty).
- Garnizon broni miasta przed atakiem wroga; bonus obronny z murów/palisady wyświetlany w nagłówku panelu.
- Każda jednostka w garnizonie zużywa **1 żywność/turę** (jak każda inna jednostka) i **1 Pieniądz/turę** na utrzymanie.

### 8.3 Wysłanie jednostki poza miasto

- Przycisk `→ Wyślij poza miasto` przenosi jednostkę na mapę świata (staje na polu przy mieście).
- Na mapie jednostki łączą się w **armię** komendą „Połącz", tworzącą jeden żeton zarządzany przez generała.

### 8.4 Leczenie

- Przycisk `Wylecz` (symbol obozu) — jednostka przechodzi w stan odpoczynku przez 1 turę i uzupełnia HP do maksimum.
- Armia obozująca w polu przez 1 turę (bez ruchu i walki) też wraca do pełni HP.

### 8.5 Ogólny charakter jednostek (bez detali statystycznych)

Jednostki dzielą się na typ standardowy (wspólny dla wszystkich cywilizacji) i **nazwane zamienniki cywilizacyjne** (np. Falanga zamiast Włócznika u Greków). Każda cywilizacja ma jedną unikalną **super-jednostkę** (bezpłatna, max 1 szt., stacjonuje w stolicy, odradza się po jej utracie). Szczegółowe staty, zasięgi i countery zawiera `Jednostki.xlsx`.

---

## 9. Zależności — diagram słowny

```
POLA OKOLICY
  └─ plony żywności ──────────────────────────────────────┐
  └─ plony Pracy ──────────────────────────────────────┐  │
  └─ plony Handlu ───────────────────────────────────┐ │  │
                                                     │ │  │
BUDYNKI (mnożniki lokalne)                           │ │  │
  Targowisko  ──────── +50% Handlu ──────────────────┘ │  │
  Cegielnia   ──────── +25% Pracy  ──────────────────┘ │  │
  Młyn        ──────── ×2 Pracy                         │  │
                                                        │  │
HANDEL (netto po korupcji)                              │  │
  └─ suwak Nauka% → NAUKA (badania, nowe tech)         │  │
  └─ suwak Pieniądz% → PIENIĄDZ                        │  │
       └─ kupno / utrzymanie JEDNOSTEK                 │  │
       └─ wykup budynku (Praca → 💱)                   │  │
       └─ handel między miastami                       │  │
  └─ suwak Luksus% → +ZADOWOLENIE                     │  │
                                                       │  │
PRACA (netto po marnotrawstwie)                        │  │
  └─ SUWAK PROCENT PRACY (gracz)                         │  │
       ├─ % → budowa BUDYNKÓW (kolejka produkcji) ────────┘  │
       │      └─ każdy budynek: +utrzymanie/t (💱 ze skarbca)│
       └─ % → PRACE W TERENIE (ulepszenia heksów)            │
              (kopalnie, farmy, irygacje, drogi, tartaki)  │
                                                          │
ŻYWNOŚĆ (netto = produkcja − zużycie)                  ───┘
  └─ trafia do MAGAZYNU ŻYWNOŚCI (tylko przy Spichlerzu)
       └─ osiągnięcie PROGU WZROSTU → +1 LUDNOŚĆ
            └─ nowy mieszkaniec → +1 żywność/t zużycia (pętla)
            └─ może być przypisany jako SPECJALISTA
                 Uczony → +Nauka
                 Poborca → +Pieniądz
                 Artysta → +Kultura

ZDROWIE (suma czynników + i -)
  └─ wpływa na WSPÓŁCZYNNIK WZROSTU (Zdrowie > 0 → szybszy; < 0 → stagnacja)
  └─ czynniki +: Akwedukt (+4), Rzeka (+2), Targowisko (+2), Ceramika
  └─ czynniki −: Bagno (−1), Zanieczyszczenie (−1), zagęszczenie (rośnie z ludnością)
  └─ Akwedukt: dodatkowo odblokowuje wzrost powyżej 6 ludności

ZADOWOLENIE (Zad. vs Niezad.)
  └─ wpływa na stabilność i lojalność miast
  └─ źródła +: Świątynia (+1😄), Luksus (suwak Handlu), Religia dominująca, Ceramika
  └─ źródła −: nadmiar niezadowolonych (koszt utrzymania; zbyt szybki wzrost bez infrastruktury)

KULTURA (punkty/t)
  └─ kumuluje się → przy progu ROZSZERZA GRANICE MIASTA (więcej pól do obrabiania)
  └─ na poziomie państwa: odblokowanie ustrojów, presja kulturowa na sąsiadów
  └─ źródła: Pałac, Świątynia, Specjalista Artysta

RELIGIA
  └─ dominująca w mieście → +Zadowolenie / jedność
  └─ rozprzestrzenia się na sąsiednie miasta
  └─ wspólna religia z sąsiadem → +dyplomacja; różna → napięcia / bunty

MAGAZYN SUROWCÓW
  └─ pojemność bazowa mała; Magazyn ×5
  └─ nadwyżka ponad pojemność PRZEPADA
  └─ utrata miasta → surowce przepadają; podbój → przejęte przez wroga

TECHNOLOGIE (z Nauki)
  └─ odblokowują nowe budynki, ulepszenia terenu, jednostki
  └─ niektóre tech wymagają konkretnego budynku jako warunku
```

---

*Dokument do weryfikacji przez właściciela projektu. Po akceptacji staje się częścią bazy specyfikacji gry.*
