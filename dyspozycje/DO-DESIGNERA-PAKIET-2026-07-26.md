# PAKIET DO DESIGNERA — 2026-07-26

Ten plik jest gotowy do wysłania w całości, bez dopisywania czegokolwiek. Zebrano w nim:
(1) trzy wcześniejsze zlecenia z 2026-07-25, które są nadal aktualne i czekają na dostawę,
(2) cztery nowe pozycje z playtestu/audytu 2026-07-26, i wyłączono z pakietu wszystko, co w
międzyczasie zostało już zrealizowane (sekcja 2).

---

## 0. Streszczenie dla designera

**Gra:** „The Game" — strategia 4X (heksy, cywilizacje, epoki **Kamień → Brąz → Żelazo**),
**wersja 0.9 alfa**. Działa w przeglądarce (WebGL/Three.js do mapy 3D + nakładka HTML/CSS
do interfejsu), często we trybie pełnoekranowym. Punkt odniesienia rozdzielczości: 1920×1080,
ale panele i modale muszą się skalować (patrz ograniczenia w sekcji 2).

**Styl obowiązujący:** system „**1E — Painted Imperial**" — złoto (`#e8d88a`) jako jedyny akcent
podstawowy, tła grafitowo-granatowe z przezroczystością/blurem, tytuły Georgia/serif, treść
Segoe UI/Tahoma, zero emoji (wyłącznie ikony SVG z brand-setu gry). Pełny kanon wizualny —
lista wszystkich zatwierdzonych makiet — jest tutaj:
`docs/ux/claude-design/01-propozycje-z-design/brand-book/KANON/CANON.md`
(tokeny kolorów/typografii: `docs/ux/claude-design/01-propozycje-z-design/brand-book/eksport/tokens.css`).

**Czego oczekujemy:** siedem makiet ekranów/elementów UI (sekcja 3), każda ze wszystkimi
stanami wymienionymi przy danej pozycji, w formacie zgodnym z dotychczasową konwencją dostawy
(plik `.dc.html` + `MANIFEST.txt` + krótka nota wdrożeniowa dla integratora — jak w poprzednich
paczkach w `docs/ux/claude-design/_dist/`). Trzy z siedmiu pozycji to kontynuacja zleceń
sprzed dnia; cztery to nowe potrzeby z bieżącego playtestu.

---

## 1. Co wchodzi do pakietu (przegląd)

| # | Pozycja | Status | Priorytet |
|---|---|---|---|
| 3.1 | Modal „Co wybierasz?" (miasto + wojsko na heksie) | kontynuacja zlecenia 07-25, wciąż nie dostarczone | Średni |
| 3.2 | Panel „Armie" (lista na mapie świata) | kontynuacja zlecenia 07-25, wciąż nie dostarczone | Średni |
| 3.3 | Panel „Miasta" (lista na mapie świata) | **nowe** — brak jakiejkolwiek makiety | Średni |
| 3.4 | Pigułka miasta na mapie świata | kontynuacja zlecenia 07-25, bez zmian w kodzie | Niski/Średni |
| 3.5 | Ekran „Miasto zdobyte" | **nowe** — z playtestu 2026-07-26 | Średni |
| 3.6 | Stół negocjacyjny dyplomacji | **nowe** — mechanika w budowie | Wysoki |
| 3.7 | Ostrzeżenie o głodzie wojska (odliczanie) | **nowe** — silnik gotowy, brak warstwy wizualnej | Wysoki |

---

## 2. Odrzucone jako nieaktualne / już zrealizowane

**DO-DESIGN-EKRAN-BADAN-2026-07-25.md — ZREALIZOWANE, nie wchodzi do pakietu.**
Design dostarczył odpowiedź tego samego dnia sesji: paczka „PANEL-BADANIA-v1"
(`docs/ux/claude-design/_dist/PANEL-BADANIA-v1-2026-07-26/`, commit `61b1f13`), wpisana już
do kanonu (`CANON.md` + `WYMIANA-UI-DESIGN.md` zaktualizowane, wpis z 2026-07-26: „PANEL BOCZNY
«BADANIA» v1 ✅ KANON"). Nowa makieta panelu bocznego „Badania" (4 klatki: kontekst, plan badań,
wiersz listy w 6 stanach, numerek kolejki na węźle siatki) czeka wyłącznie na wdrożenie przez
integratora w `scienceHubHud.ts` — to już nie jest zadanie dla Designu.

**Karta budynku „Mennica" (zgłoszenie z ZNALEZISKO 87, playtest 2026-07-26) — ZREALIZOWANE,
nie wchodzi do pakietu.** Design dostarczył „Karta budynku Mennica v2"
(`docs/ux/claude-design/_dist/KARTA-MENNICY-v2-2026-07-26/`) tego samego dnia — wzorzec ma
obowiązywać wszystkie karty budynków. Nic więcej do wysłania.

**„Niebieskie kwadratowe tło pod ikoną cywilizacji w panelu dyplomacji" (ZNALEZISKO 87) —
NAPRAWIONE BEZPOŚREDNIO W KODZIE, nie wymagało Designu.** To była usterka stylu (`.dip-pennant`
miał wypełnienie zamiast tylko obwódki), poprawiona przez integratora commitem `f4f6dd9`
(`gra/src/ui/diploUiSkin.ts`) 2026-07-26. Wyłączone z pakietu.

**Trzy pozostałe zlecenia z 07-25 (modal wyboru heksa, panel Armie, pigułka miasta) —
POTWIERDZONE JAKO NADAL AKTUALNE.** Sprawdzone w kodzie: dwa z nich (modal wyboru heksa, panel
Armie) doczekały się w międzyczasie DROBNYCH poprawek danych (populacja miasta i % HP doszły do
modalu; HP doszło do panelu Armie; zduplikowany wiersz „Ruch: X/Y" usunięty) — ale to poprawki
DANYCH, nie stylu. Sam wygląd (emoji, brak `:focus-visible`, ikony generyczne zamiast per typ)
pozostał identyczny jak w oryginalnych zleceniach — patrz szczegóły przy każdej pozycji niżej.
Pigułka miasta na mapie w ogóle nie była dotykana w kodzie od dnia zlecenia — bez zmian.

---

## 3. Pozycje pakietu

### 3.1 Modal „Co wybierasz?" (wybór: miasto czy wojsko na tym samym heksie)

**Gdzie w grze:** gracz klika heks na mapie świata, na którym stoi jednocześnie **jego własne
miasto** i **jego własne wojsko** (spoza garnizonu). Pojawia się modal na środku ekranu z pytaniem,
co zaznaczyć.

**Stan dziś:** modal pokazuje nagłówek „CO WYBIERASZ?" i dwa kafle — „Miasto" (ikona: emoji 🏛)
i „Jednostka" (ikona: emoji ⚔, etykieta w kolorze niebieskim `#a8d4ff`, niespójnym z resztą
gry, gdzie akcent jest wyłącznie złoty). Brak jakiegokolwiek stanu `:focus-visible` mimo że modal
obsługuje klawiaturę (1/2/Esc). To jest dokładnie ten sam problem, który Design miał naprawić
zleceniem `A21-CITY-UNIT-PICK-2026-07-05` sprzed trzech tygodni — nigdy nie dostarczonym.
Sąsiedni modal tego samego typu (`cityAttackChoice.ts`, wybór „Oblegaj/Szturm" po ataku na
miasto z murem) już przeszedł restyling w lipcu (kicker nad tytułem, blur panelu 8px, złota
obwódka z górnym highlightem, chipy z tagami, wiersz skrótów klawiszowych) i może służyć za
gotowy wzorzec — nie trzeba projektować nowego języka wizualnego.

**Czego oczekujemy:**
- Ten sam układ dwóch kafli (Miasto / Jednostka), ale w aktualnym stylu 1E, wzorowany
  bezpośrednio na `cityAttackChoice.ts` (kicker + tytuł + blur + jeden akcent złoty).
- Zero emoji — obie ikony jako SVG z istniejącego brand-setu.
- Jeden akcent kolorystyczny (złoto) na oba kafle — bez drugiego koloru dla kafla „Jednostka".
- Zaprojektowany stan `:focus-visible` (obwódka/ring przy nawigacji Tab) — dziś nie istnieje
  wcale.
- Stan hover dla obu kafli, identyczny kierunek koloru.

**Dane, które ekran musi pokazać (realne, z kodu — nic do wymyślenia):**
- Nazwa miasta (dowolny tekst, np. „Ateny").
- **Populacja miasta** — liczba całkowita, np. „Ludność 12" (pole już dochodzi do modalu).
- Typ jednostki-reprezentanta stosu (np. „Zwiadowca", „Hoplita").
- Jeśli na heksie stoi więcej niż 1 jednostka: tekst „Armia — N jednostek" (odmiana liczby
  1 / 2–4 / 5+); w przeciwnym razie „Zaznacz i rozkazuj".
- **% HP reprezentanta/stosu** — liczba całkowita 0–100, np. „HP 82%" (suma HP / suma maxHP
  stosu; pole już dochodzi do modalu).
- Przycisk „Anuluj (Esc)" na dole.

**Ograniczenia techniczne:** patrz sekcja 2 (wspólne) + wzorzec layoutu 1:1 do naśladowania:
`gra/src/ui/cityAttackChoice.ts` (bez zmiany logiki, tylko styl/kompozycja). Ikony do
zapożyczenia, jeśli pasują: `tb-cities.svg` (miasto), `unit-scout.svg` i reszta rodziny
`unit-*.svg` wg kategorii jednostki (`gra/src/ui/icons/brand/unit-icon-map.json`).

**Priorytet: Średni.** Modal jest funkcjonalny (gra działa poprawnie), ale wizualnie z innej
epoki niż reszta interfejsu — dług kosmetyczny sprzed trzech tygodni, niezablokowany, ale
widoczny przy każdym kliknięciu heksu z miastem i wojskiem naraz (częsta sytuacja).

---

### 3.2 Panel „Armie" (lista wszystkich własnych armii na mapie świata)

**Gdzie w grze:** przycisk „Wojsko" (ikona skrzyżowanych mieczy) w dolnym pasku narzędzi mapy
świata — otwiera wysuwany panel z listą wszystkich jednostek/stosów gracza rozrzuconych po mapie.

**Stan dziś:** każdy wiersz ma tę samą, generyczną ikonę „skrzyżowane miecze" niezależnie od
typu jednostki (zwiadowca, łucznik i konnica wyglądają identycznie), mimo że gra ma gotowy
system ikon per kategoria jednostki używany w 7 innych panelach. Wiersz pokazuje surowe
współrzędne heksa silnika („Heks (91, 57)") i stały, dwuliniowy blok instrukcji obsługi
renderowany przy każdym otwarciu (bez flagi „widziane"). Brak stanu `:focus-visible` na
wierszach mimo obsługi klawiatury (Tab/Enter). **Od dnia zlecenia (07-25) dane wiersza się
poprawiły** — HP stosu doszło (pasek zdrowia niebiesko-czerwono-zielony wg procenta, etykieta
„Zdrowie X/Y"), a zduplikowana linia „Ruch: X/Y" (dublująca pasek ruchu tuż nad nią) została
usunięta. To jednak poprawki DANYCH — układ, ikony i brak hierarchii (lista = wybór, nie
analiza) pozostają dokładnie takim problemem, jaki opisywało oryginalne zlecenie.

**Czego oczekujemy:**
- Ikona per typ/kategoria jednostki (z istniejącego zestawu `unit-*.svg`), nie generyczne miecze.
- Uproszczony wiersz: ikona + nazwa/skład skrócony + sygnał gotowości do ruchu (pasek lub
  3-stanowy znacznik pełny/częściowy/wyczerpany) + sygnał zdrowia (już częściowo wdrożony w
  kodzie — pasek kolorowany wg %).
- Szczegóły (dokładne współrzędne, ruch liczbowo, rozbicie stosu na typy, dokładne HP/staty)
  przeniesione do tooltipa „karta szczegółów" — gra ma już gotowy, wielokrotnie użyty komponent
  tego typu (`.detail-card`, używany w panelu miasta) — Design projektuje jeden wzorzec karty
  szczegółów armii w tym istniejącym stylu, nie nowy system.
- Instrukcja obsługi zdjęta ze stałego bloku na dole panelu — np. ikonka „?" w nagłówku z
  tooltipem i/lub jednorazowy coachmark przy pierwszym otwarciu (do wyboru przez Designera,
  obie opcje jako warianty).
- Stan `:focus-visible` na wierszach.

**Dane, które ekran musi pokazać:**
- Nazwa/typ jednostki lub „Armia ×N" (ten sam typ) / „Armia — N jednostek" (mieszany skład).
- Pasek/znacznik ruchu: `ruchLeft/ruchMax` np. „3/3" — dziś w wierszu, docelowo można zostawić
  sam pasek/znacznik, liczby do tooltipa.
- **Zdrowie stosu** — suma HP / suma maxHP, np. „Zdrowie 34/50" — już wdrożone w danych.
- W tooltipie: dokładny heks (q, r), rozbicie stosu na typy przy mieszanej armii, staty bojowe
  (atak/obrona/zasięg) jeśli dostępne, status specjalny jednostki (np. „czuwa" — Sentry).

**Ograniczenia techniczne:** wzorzec tooltipa do rozszerzenia (nie projektować od nowa):
`gra/src/ui/hoverDetailDock.ts` (`.detail-card` — ciemne tło, złota lewa krawędź 3px, siatka
etykieta/wartość). Ikony jednostek: `gra/src/ui/icons/brand/units/unit-*.svg`.

**Priorytet: Średni.** Panel działa, dane potrzebne do gry (ruch, HP) już tam są — brakuje
hierarchii i spójności ikon, co utrudnia szybkie skanowanie listy przy wielu armiach na mapie.

---

### 3.3 Panel „Miasta" (lista wszystkich własnych miast na mapie świata) — NOWE

**Gdzie w grze:** przycisk „Miasto" (ikona budynku) w dolnym pasku narzędzi mapy świata —
otwiera wysuwany panel z listą wszystkich miast gracza. Bliźniaczy komponent panelu „Armie"
(3.2) — ten sam układ w kodzie, ta sama pozycja na ekranie.

**Zgłoszenie:** playtest Macieja 2026-07-26 (ZNALEZISKO 87, `dyspozycje/PYTANIA-OTWARTE.md`):
„Panel widoku miast na mapie głównej — przestarzały (lista «MIASTA» z jednym wierszem i tekstem
pomocy)". **Ten panel nigdy nie miał żadnej makiety Design** — w przeciwieństwie do panelu
„Armie" (3.2), który przynajmniej ma zlecenie z 07-25 czekające na dostawę, ten w ogóle nie był
dotąd zgłoszony jako osobna pozycja; sam kod panelu „Armie" (`armyListHud.ts`) wprost odnotowuje,
że w repo nie ma paczki Design dla `cityListHud.ts`.

**Stan dziś:** wiersz miasta ma emoji zamiast SVG (🏛️ dla ikony, 👥 dla populacji) — jedyny
panel z rodziny list-na-mapie, który nadal używa surowych emoji zamiast systemu ikon brand
(panel „Armie" już z niego korzysta, choć źle dobiera ikonę — patrz 3.2). Każdy wiersz pokazuje:
nazwę miasta, „👥 N mieszk.", opcjonalną linię produkcji (np. „Stolarnia • 8/20") i opcjonalną
linię garnizonu. Na dole stały, dwuliniowy blok instrukcji obsługi renderowany przy każdym
otwarciu. Brak stanu `:focus-visible` na wierszach mimo obsługi klawiatury.

**Czego oczekujemy:**
- Zero emoji — ikona miasta jako SVG z brand-setu (`tb-cities.svg` lub dedykowana).
- Ten sam kierunek uproszczenia co panel „Armie" (3.2): wiersz = wybór (ikona + nazwa +
  populacja + skrót stanu produkcji), szczegóły (pełna kolejka budowy, garnizon dokładnie) do
  tooltipa w stylu `.detail-card`.
- Instrukcja obsługi zdjęta ze stałego bloku — analogicznie do 3.2.
- Stan `:focus-visible` na wierszach.
- Spójność z panelem „Armie" — te dwa panele powinny wyglądać jak jedna rodzina komponentów
  (ten sam nagłówek, ten sam styl wiersza, ta sama pozycja/rozmiar).

**Dane, które ekran musi pokazać:**
- Nazwa miasta.
- Populacja — liczba całkowita, np. „12 mieszk.".
- Skrót stanu produkcji, jeśli w budowie (np. „Stolarnia • 8/20") lub „Kolejka pusta".
- Garnizon, jeśli obecny (np. „Garnizon: 2") — do tooltipa lub jako mały znacznik w wierszu.

**Ograniczenia techniczne:** patrz sekcja 2 (wspólne). Wzorować się bezpośrednio na finalnej
makiecie panelu „Armie" (3.2) — to jest ta sama rodzina komponentów, mają wyjść razem/spójnie.

**Priorytet: Średni.** Zgłoszone wprost przez właściciela w bieżącym playteście, ten sam ciężar
gatunkowy co panel „Armie" — oba warto zaprojektować w jednej turze, żeby nie rozjeżdżały się
stylistycznie.

---

### 3.4 Pigułka miasta na mapie świata (etykieta unosząca się nad każdym miastem)

**Gdzie w grze:** widoczna **zawsze**, nad każdym miastem na mapie świata (własnym, sojuszniczym,
wrogim, miastem-państwem) — nie wymaga klikania. To inny element niż panel „Miasta" (3.3) —
tam jest pełna lista, tu chodzi o miniaturkę widoczną bezpośrednio na mapie 3D.

**Stan dziś:** sprite 3D (canvas rysowany ręcznie, nie DOM) pokazujący wyłącznie nazwę miasta
(wersaliki) i populację w złotym kółku. Kolor obwódki heksu wokół miasta sygnalizuje
właściciela/stan wojny. To 1:1 realizuje mockup Design sprzed trzech tygodni (2026-07-04) — nie
ma rozjazdu między mockupem a grą. Problem jest inny: od tamtej pory doszły do gry mechaniki,
których ta miniaturka w ogóle nie pokazuje — **obrona miasta procentowa** (mur samodzielnie
+200%, mur+Cytadela +300% — najświeższy mechanizm bojowy w grze), stan produkcji, magazyn
surowców miasta, ostrzeżenie o niedoborze surowca.

**Czego oczekujemy:**
- Zachować nazwę + populację (działa, potwierdzone mockupem).
- Dodać wskaźnik obrony miasta — minimum 3 stany: brak muru / mur (+200%) / mur+Cytadela
  (+300%).
- Zamienić generyczną gwiazdkę na ikonę właściciela/cywilizacji (dziś każde miasto ma identyczną
  ikonę, jedyne odróżnienie to kolor obwódki heksu — łatwy do przeoczenia przy oddaleniu widoku).
- Opcjonalnie (do rozważenia jako wariant hover/zbliżenie, nie „always-on"): sygnał „w
  produkcji" (ikona kategorii: budynek/jednostka/cud) i pojedyncza ikonka ostrzegawcza przy
  niedoborze surowca blokującym produkcję.
- Dostarczyć **oba warianty** — zawsze widoczny „skrócony" i „rozszerzony" na hover/zbliżenie —
  decyzję między nimi podejmie właściciel na podglądzie.

**Dane, które ekran musi pokazać:**
- Nazwa miasta (WERSALIKI).
- Populacja — liczba całkowita w złotym kółku.
- **Obrona miasta** — 3 stany nazwane wprost: „Brak muru" / „Mur +200%" / „Mur + Cytadela +300%"
  (wartości procentowe z `gra/src/game/siege.ts`, kanon Maciej 2026-07-25).
- Właściciel/cywilizacja — dziś kodowany tylko kolorem obwódki heksu (własny/sojusznik/wróg).

**Ograniczenia techniczne:** to jest **sprite billboard w scenie 3D** (Three.js `Sprite` +
`CanvasTexture`), NIE element DOM/HTML jak reszta interfejsu — każdy nowy element musi dać się
wyrenderować jako bitmapa (Canvas 2D) albo osobna warstwa doklejona do tej samej pozycji w
świecie. Musi zostać czytelny przy dużym oddaleniu widoku (wiele miast na ekranie naraz) —
dokładanie kolejnych ikon bez wyraźnej hierarchii ważności grozi nieczytelnością.

**Priorytet: Niski/Średni.** Element działa i pokazuje to, co pokazywał od trzech tygodni bez
skarg — problem to zaległość względem NOWYCH mechanik (mur/obrona), nie zepsucie istniejącej
funkcji. Mniej pilne niż pozycje 3.1–3.3, 3.5–3.7, które mają realne skargi z bieżącego
playtestu.

---

### 3.5 Ekran „Miasto zdobyte" — NOWE

**Gdzie w grze:** pojawia się automatycznie, gdy wojsko gracza (lub AI) wejdzie na heks
przeciwnego miasta — w dwóch sytuacjach: (a) miasto bez obrońców (wejście bez walki), (b) miasto
zdobyte po wygranej bitwie/szturmie. Gracz musi kliknąć „Rozumiem" (lub Enter), zanim wróci do
gry.

**Zgłoszenie:** właściciel, playtest 2026-07-26: „kolejna przestarzała grafika, zdobyte miasto,
też do designera" (potwierdzone też w `dyspozycje/REJESTR-PROSB-I-ZADAN.md` jako
`R-ZDOBYCIE-MIASTA`, zgłoszone 2026-07-25, i w ZNALEZISKO 87 z 07-26).

**Stan dziś (`gra/src/ui/cityCaptureNotice.ts`):** modal na środku ekranu — ikona (SVG, budynek),
tytuł „MIASTO ZDOBYTE", nazwa miasta, jedna linia podtytułu zależna od sytuacji („Potyczka
wygrana — wojsko weszło na heks miasta." albo „Brak obrońców — wojsko weszło do miasta bez
walki i bez strat."), przycisk „Rozumiem · Enter". Komponent NIE używa emoji i ma złotą/gradientową
stylistykę — ale powstał 2026-07-09, **przed** restylingiem „KANON v1.1" z 2026-07-23, któremu
poddał się sąsiedni modal tego samego typu decyzyjnego (`cityAttackChoice.ts` — wybór
Oblegaj/Szturm). Porównanie: brak kickera nad tytułem, blur panelu tylko 3px (standard dziś to
8px), brak wiersza chipów z kontekstem (mur/garnizon/ludność), brak wiersza skrótów klawiszowych,
overlay blokujący całą interakcję z mapą (nowszy standard w grze: overlay `pointer-events:none`
z panelem pływającym u dołu, mapa zostaje klikalna/widoczna w tle).

**Czego oczekujemy:**
- Restyling do standardu KANON v1.1 — wzorzec 1:1: `cityAttackChoice.ts` (kicker + tytuł +
  blur 8px + highlight górnej krawędzi + wiersz kontekstowych chipów + wiersz skrótów).
- Zachować rozróżnienie dwóch podtytułów (potyczka wygrana / brak obrońców) — osobne klatki
  w makiecie.
- Zachować pojedynczy przycisk „Rozumiem · Enter" (to nie jest ekran decyzyjny, tylko
  potwierdzenie).

**Dane, które ekran musi pokazać:**
- Nazwa zdobytego miasta.
- Wariant zdarzenia — „Potyczka wygrana" lub „Brak obrońców" (dokładne teksty z kodu, nie
  zmieniać treści, tylko oprawę).
- **Populacja miasta** — pole `City.population` już istnieje w silniku, dziś nie pokazywane na
  tym ekranie — **do potwierdzenia u właściciela**, czy ma wejść w zakres tej makiety.
- **Nice-to-have, do potwierdzenia u właściciela** (dane realnie istnieją w silniku, ale dziś
  nigdzie nie trafiają na ten ekran): sygnał niestabilności podboju, gdy kultura I religia
  miasta są obce dominujące (`gra/src/game/conquest-stability.ts` — kara Zadowolenia, kara
  Prawa bez garnizonu, ryzyko buntu ×1,5) — mogłoby dać graczowi od razu ostrzeżenie „to miasto
  będzie niestabilne, zostaw garnizon". To rozszerzenie zakresu, nie potwierdzone zadanie.

**Ograniczenia techniczne:** wzorzec layoutu i interakcji do naśladowania 1:1:
`gra/src/ui/cityAttackChoice.ts`. Ikona dziś użyta: `cp-buildings` (do oceny, czy zostaje, czy
Design zaproponuje inną).

**Priorytet: Średni.** Ekran jest krótki i nieblokujący rozgrywki (jeden klik i dalej), ale
pojawia się przy każdym zdobyciu miasta — częsta sytuacja w rozgrywce wojennej — i właściciel
wskazał go wprost jako wizualnie przestarzały.

---

### 3.6 Stół negocjacyjny dyplomacji (nowa mechanika wielorundowa) — NOWE

**Gdzie w grze:** dyplomacja — dziś gracz negocjuje z liderem AI w jednym „posiedzeniu"
(audiencja → formularz propozycji → podgląd wstępnej zgody AI → akceptacja/zmiana, wszystko w
jednym modalu, bez opuszczania ekranu). Nowa mechanika ma to zastąpić/rozszerzyć o wymianę
**rozłożoną w czasie, między turami**: gracz składa propozycję, AI może odpowiedzieć nie od razu
tylko kontrofertą, gracz odpowiada na kolejną turę, z limitem liczby rund.

**Stan dziś:** **to jest nowa mechanika, dopiero powstająca — silnik jej jeszcze nie ma.**
Sprawdzone w kodzie: pole `aiCounterOffer` istnieje w kontrakcie modalu negocjacji
(`diplomacyNegotiationModal.ts`), ale **nigdzie w grze nie jest ustawiane** — to szkielet
przygotowany pod przyszłą funkcję, dziś martwy. Istniejący modal negocjacji działa
**synchronicznie w jednej turze**: formularz → `evaluateProposal` (czysta funkcja, bez zapisu
stanu) → wynik „AI wstępnie się zgadza / odrzuca" → gracz klika „Zmień" (wraca do formularza)
albo „Akceptuj" (dopiero to finalizuje umowę). Osobny, prostszy komponent
(`diplomacyPendingHud.ts`) obsługuje propozycje przychodzące OD AI do gracza — ale tylko z
dwoma reakcjami: „Akceptuj" / „Odrzuć", blokująco (gra czeka na decyzję), bez możliwości
kontroferty ani odłożenia na później. **Żaden z dwóch istniejących komponentów nie ma pojęcia
terminu ważności, licznika rund ani listy wielu oczekujących propozycji naraz** — dziś zawsze
jest najwyżej jedna propozycja na raz, obsługiwana natychmiast.

**Czego oczekujemy:** nowy ekran/panel „stołu negocjacyjnego" — lista propozycji, nie
pojedynczy modal:
- Lista propozycji **własnych** (złożonych przez gracza, czekających na odpowiedź AI) i
  **przychodzących** (złożonych przez AI, czekających na odpowiedź gracza) — jedna lista lub
  dwie sekcje, każda pozycja z partnerem (nazwą cywilizacji), typem umowy i skrótem warunków.
- **Termin ważności / licznik rund** przy każdej pozycji — np. „Wygasa za 2 tury" (dokładna
  nazwa etykiety do ustalenia razem z zakresem silnika — **do potwierdzenia u właściciela**,
  limit rund jest dopiero projektowany).
- **Trzy reakcje** na propozycję przychodzącą (dokładne nazwy przycisków do potwierdzenia u
  właściciela — silnik jeszcze ich nie definiuje w kodzie): najbardziej prawdopodobny zestaw to
  Akceptuj / Odrzuć / Złóż kontrofertę, analogicznie do istniejącego wzorca formularz→podgląd
  w `diplomacyNegotiationModal.ts`, ale rozłożonego na kolejną turę zamiast w tym samym
  posiedzeniu.
- Miejsce na wejście do „koszyka" słodzików (złoto/surowiec dokładany do umowy) — ten element
  już istnieje wizualnie w obecnym modalu negocjacji (sekcja „Dołóż do umowy") i powinien dać
  się przenieść/dostosować do nowego ekranu, nie projektować od zera.

**Dane, które ekran musi pokazać:**
- Partner (nazwa cywilizacji/lidera).
- Typ umowy/propozycji (np. „Pakt o nieagresji", „Sojusz pełny", „Umowa handlowa" — pełna lista
  typów w `gra/src/ui/diplomacyAudience.ts`, `AudienceAction`).
- Skrót warunków (np. czas trwania w turach, kwota złota/turę, surowiec i ilość).
- **Licznik rund / termin ważności** — do zaprojektowania jako liczba z jednostką „tur", ale
  dokładna reguła (ile rund, czy każda kontroferta zużywa rundę) **do potwierdzenia u
  właściciela** — mechanika w budowie.
- Status: „czeka na odpowiedź AI" / „czeka na Twoją odpowiedź" / „kontroferta".

**Ograniczenia techniczne:** styl dyplomacji ma własny podzestaw tokenów (`diploUiSkin.ts`,
`DIPLO_1E_SHARED_CSS`) — makieta powinna z niego korzystać, nie wprowadzać nowej palety.
Ikony: `gra/src/ui/icons/brand/` (np. `tb-diplomacy`, `ui-accepted`, `ui-denied` już istnieją i
są używane w istniejących modalach dyplomacji).

**Priorytet: Wysoki.** Mechanika jest aktywnie budowana teraz (silnik ma dopiero powstać) — bez
wcześniej gotowej makiety integrator zbuduje prowizoryczny UI „z ręki" (jak stało się z panelem
badań i wieloma innymi ekranami w tym pakiecie), co potem i tak trzeba będzie poprawiać. Lepiej
dostarczyć projekt, zanim kod powstanie.

---

### 3.7 Ostrzeżenie o głodzie wojska (odliczanie karencji) — NOWE

**Gdzie w grze:** chip „Armia" w górnym pasku zasobów (zawsze widoczny podczas gry, ikona kłosa,
wartość np. „230/500", trend np. „−12/turę"). Docelowo także możliwy sygnał przy jednostkach na
mapie świata.

**Zgłoszenie:** wchodzi karencja **3 tury** (jednakowa na wszystkich poziomach trudności) —
gracz ma widzieć odliczanie w stylu „Głód wojska za 2 tury", zanim ruszy realna kara.

**Stan dziś:** silnik jest już gotowy (parametr `glod_wojska_karencja_tur` w
`gra/data/econ-params.json` = **3 tury** na każdym poziomie trudności; po jej upłynięciu
atrycja zdejmuje **6% maxHP/turę (łatwy) / 8% (normalny) / 10% (trudny)** każdej jednostce
wojskowej właściciela, identycznie dla gracza i AI). Odliczanie jest już policzone w kodzie
(`getArmyStarvationCountdown()`) — **ale jedyne miejsce, gdzie trafia do gracza, to tekst
natywnego tooltipa przeglądarki** po najechaniu na chip „Armia" („Głód wojska za 2 tury —
zapasy państwa ujemne!"). Nie ma żadnego widocznego bez najeżdżania sygnału — ani ikony, ani
zmiany koloru, ani banera. Gdy karencja już minie i atrycja realnie trwa, na mapie pojawia się
osobny sygnał — czaszka nad jednostkami wojskowymi właściciela w stanie głodu — ale to inny,
późniejszy stan (nie odliczanie, tylko potwierdzenie, że kara już działa).

**Czego oczekujemy:**
- Widoczny **bez najeżdżania myszą** sygnał ostrzegawczy na chipie „Armia" w trakcie karencji —
  np. zmiana koloru wartości/ramki chipu na ostrzegawczy (bursztyn/czerwień) + tekst „za N tur"
  wprost przy chipie, nie tylko w tooltipie.
- Rozróżnienie wizualne dwóch stanów: „karencja w toku, odliczanie" (ostrzeżenie, jeszcze bez
  kary) vs. „atrycja aktywna" (kara już działa — dziś to jest chip czerwony/`rateWarn`, do
  utrzymania jako stan końcowy, ostrzejszy wizualnie niż odliczanie).
- Do rozważenia: dodatkowy, bardziej widoczny komunikat przy przejściu w stan karencji
  (pierwsza tura z ujemnym zapasem) — żeby gracz nie musiał sam zauważyć zmiany koloru chipu.

**Dane, które ekran musi pokazać:**
- **Odliczanie karencji** — liczba całkowita w jednostce „tur", np. „Głód wojska za 2 tury"
  (odmiana: 1 tura / 2–4 tury / 5+ tur — helper `slowoTuraHud()` już to liczy poprawnie).
- Stan „atrycja aktywna" — inny komunikat, np. „Głód wojska: atrycja HP trwa!" (tekst już
  istnieje w kodzie, do przeniesienia z tooltipa na widoczny element).
- Wartość zapasów państwa i trend na turę (`230/500`, `−12/turę`) — już wyświetlane na chipie
  dziś, zostaje bez zmian.

**Ograniczenia techniczne:** chip „Armia" to komponent `chip6cHtml()` (`gra/src/ui/hud.ts`) —
istniejący system 6 elementów (medalion + etykieta PL + wartość + przyrost), z polem `rateWarn`
już obsługującym stan ostrzegawczy kolorystycznie. Nowy stan „karencja" powinien dać się
wyrazić w tym samym komponencie (dodatkowy wariant koloru/tekstu), nie nowy typ chipu.

**Priorytet: Wysoki.** Silnik tej mechaniki jest już zaimplementowany (parametr karencji,
atrycja z parytetem gracz/AI) i czeka wyłącznie na warstwę wizualną — bez niej gracz będzie
tracił jednostki „znienacka", mimo że gra od trzech tur wie i mogłaby ostrzec. To bezpośrednio
wpływa na odbiór uczciwości mechaniki przez gracza.

---

## 4. Format dostawy (przypomnienie konwencji repo — nie do zmiany przez Designera)

Zgodnie z dotychczasową praktyką w tym projekcie: paczka = `MANIFEST.txt` + krótka
`DYSPOZYCJA-WDROZENIE.md` (co się zmienia względem dziś, jakie pliki nadpisać) + makieta
`.dc.html` ze wszystkimi wymienionymi stanami w jednym pliku (wieloklatkowo) + aktualizacja
`CANON.md`/huba „START — KANON aktualny". Styl: wyłącznie tokeny z
`brand-book/eksport/tokens.css`. Ikony: reużywać istniejące pliki z `gra/src/ui/icons/brand/`
tam, gdzie pasują — nie rysować od zera bez sprawdzenia, czy coś już istnieje.
