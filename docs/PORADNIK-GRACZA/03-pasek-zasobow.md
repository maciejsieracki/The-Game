# Część III — Pasek zasobów i ekran mapy

> **Poradnik gracza (Pełny)** · ekran mapy strategicznej  
> Powiązane: Część VI (miasto — ludność) · Część VII (budowa i plony) · spis: `docs/PORADNIK-GRACZA-SPIS-TRESCI.md` §14–21

Górny i dolny pasek ekranu mapy to **pulpit dowodzenia** — tu widzisz, czy imperium rośnie, czy bankrutuje i czy możesz zakończyć turę. Ten rozdział tłumaczy każdą liczbę w języku gracza: co oznacza, skąd się bierze i na co uważać.

---

## 14. Pasek zasobów — lewa strona

### 14.1. Żywność

**Żywność** na pasku to zapasy państwa — wspólna pula karmienia wojska i (pośrednio) rozwoju miast. Liczba główna pokazuje, ile masz teraz; obok **+X na turę** — netto po zużyciu przez armię i mieszkańców.

| Sytuacja | Co widzisz | Co to znaczy |
|----------|------------|--------------|
| Bez Spichlerza | Suma buforów wzrostu miast + udział suwaka „na wojsko" | Każde miasto trzyma własny bufor; po awansie ludności bufor często spada do zera |
| Ze Spichlerzem | Format **bieżące / maksimum** (np. 45 / 100) | Wspólny magazyn państwa; nadwyżka z suwaka żywności kumuluje się tutaj |
| Przyrost ujemny | Czerwony lub minus przy +X | Wojsko lub miasta zużywają więcej niż produkujesz — planuj farmy i Spichlerz |

**Skąd wpływa żywność:** pola okolicy miast (farma, irygacja, pastwiska), budynki w mieście (Spichlerz, łaźnia), suwak **Rozwój miast** w panelu Miasto (Część VI §38). Kliknięcie w żywność na pasku zwykle **nie** otwiera panelu — szczegóły są w zakładce **Plony** i **Miasto**.

**Wskazówka:** Gdy przyrost spada do zera, zanim dokupisz wojsko sprawdź zakładkę **Plony** w stolicy — często jedno miasto nie ma przypisanych pól żywnościowych.

### 14.2. Złoto

**Złoto** (symbol ¤) to skarbiec państwa — na rekrutację, utrzymanie budynków, utrzymanie wojska i przyspieszenie produkcji. Przyrost co turę to **netto**: podatki i handel minus utrzymanie.

- **Podatki** — wynik suwaka Daniny w każdym mieście (złoto vs nauka vs luksus).
- **Handel** — umowy dyplomatyczne i trasy między miastami (Część XII).
- **Utrzymanie** — suma budynków i jednostek; przy dużej armii netto bywa ujemne mimo bogatych miast.

**Złoto ≠ bogactwo.** Bogactwo (luksus) to osobny wiersz (§14.5) — wpływa na szczęście i warstwę zamożności, ale nie zastępuje skarbca.

**Wskazówka:** Przed rush’em budowy policz utrzymanie w tooltipie (jeśli gra je pokazuje) — jeden poziom Akademii może zjeść cały przyrost złota.

### 14.3. Praca

**Praca** to pula imperium na **budowę**: budynki w miastach i ulepszenia na mapie. Nie myl z plonem „pracy" z pól — to ten sam zasób, ale wyświetlany globalnie u góry.

| Na co idzie praca | Gdzie ustawiasz |
|-------------------|-----------------|
| Budynek w kolejce miasta | Zakładka **Produkcja** (Część VII §46) |
| Ulepszenie na mapie | Lewy panel **Budowa** (Część V §27) |
| Cuda świata | Lista cudów (Część XV §87) |

Przyrost pracy bierze się z pól (tartak, kamieniołom, kopalnia…) i z budynków produkcyjnych w miastach. Suwak **pracy** w panelu Miasto decyduje, jaki udział miasta idzie na rozwój pól vs budynki (§38.2 w Części VI).

**Wskazówka:** Brak pracy nie blokuje końca tury, ale kolejka stoi — sprawdź profil **Produkcja** w okolicy miasta budującego mury.

### 14.4. Badania

**Badania** pokazują tempo nauki **+X na turę**, nazwę **aktualnie badanej** technologii i pasek **%** do ukończenia. **Klik** w ten wiersz otwiera **drzewko technologii** (Część IX).

- Nauka płynie z budynków (Biblioteka, Akademia) i z części suwaka Daniny (nauka %).
- Po zbadaniu tech odblokowuje budynki, jednostki i ulepszenia — szare pozycje na listach znikają.
- Gdy gra wymaga wyboru nowej technologii, pojawia się chip **blocking** w dolnym pasku (§16.4).

### 14.5. Bogactwo

**Bogactwo** (luksus) to osobny licznik — nie wydajesz go jak złota. Rośnie z części suwaka Daniny przełączonej na **luksus** w miastach. Wpływa na warstwę **zamożności** w panelu Miasto (Część VI §37) i na szczęście w bogatszych miastach.

### 14.6. Ludność

**Ludność** na pasku to **suma mieszkańców wszystkich miast** imperium, z przyrostem **+X na turę** (awansy po zapełnieniu bufora wzrostu). To nie limit jednego miasta — limit 6 (bez Akweduktu) widzisz w panelu konkretnego miasta (Część VI §33).

Więcej ludzi = więcej podatków i rekrutów, ale też wyższe koszty żywności i kary za zagęszczenie (§35.3 Części VI).

### 14.7. Kultura

**Kultura** — suma imperium + przyrost. Buduje się ze świątyń, teatrów, pałacu i suwaków. Nie ma osobnego zasobu „Idei". Kultura miasta (w panelu) i kultura imperium (na pasku) to różne skale — porównuj trend, nie liczby 1:1.

Przy minimapie możesz włączyć **warstwę kultury** (§18.4) — kolorowe obrysy terytorium.

### 14.8. Przyrost „+X na turę" — zasady

- Liczby są **netto** tam, gdzie gra odejmuje utrzymanie (złoto, czasem żywność wojska).
- Większość wartości przelicza się **po końcu tury** — w trakcie tury widzisz stan z poprzedniego rozliczenia.
- Kolor: zielony dodatni, czerwony ujemny, szary zero.


### Przykład liczbowy

Pasek: **+12** ¤ · **+8** 🍞 (wojsko) · **+5** badań — suma z 4 miast po suwakach.
Czerwony ¤ (**−3**/t) = utrzymanie **15**, przychód **12** → za **5** tur skarbiec **−15** ¤.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 15. Pasek zasobów — prawa strona

### 15.1. Epoka

Nazwa bieżącej epoki (Kamień → Brąz → Żelazo…) i czasem pasek postępu do następnej. Nowa epoka odblokowuje budynki, jednostki i ulepszenia — sprawdź drzewko nauki po awansie.

### 15.2. Nazwa państwa

Twoja cywilizacja z herbem lub kolorem frakcji — pomaga odróżnić własne jednostki na mapie.

### 15.3. Osiedla

Liczba **małych** osiedli (bonus Osiedle, populacja 1–4). Duże miasta liczą się osobno — nie dodawaj ich do tej liczby.

### 15.4. Numer tury

Która tura trwa. W grze jednoosobowej to po prostu licznik czasu — im wyżej, tym bardziej AI i barbarzyńcy są rozbudowani.

### 15.5. Dyplomacja

Ikony skrótu: pokój, wojna, sojusz, handel. **Klik** otwiera panel dyplomacji. Widzisz tylko nacje **odkryte** — reszta za mgłą.

### 15.6. Czego nie ma po prawej

Osobny blok „Epoka i badania" został scalony z lewą kolumną (decyzja layoutu A1). Przycisk „Zasoby" nie istnieje — wszystkie liczby są po lewej.


### Przykład liczbowy

Pasek: **+12** ¤ · **+8** 🍞 (wojsko) · **+5** badań — suma z 4 miast po suwakach.
Czerwony ¤ (**−3**/t) = utrzymanie **15**, przychód **12** → za **5** tur skarbiec **−15** ¤.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 16. Dolny pasek — Miasta, Wykonaj, Koniec tury

### 16.1. Przycisk Miasta

Lista wszystkich miast z szybkim skokiem do panelu. Przy nazwie mogą być **alerty**: bunt, pusta produkcja, niski porządek. Używaj tego zamiast szukania miasta na mapie, gdy imperium ma 5+ centrów.

### 16.2. Przycisk Wykonaj

Aktywny, gdy coś **musi** być rozstrzygnięte w tej turze: wybór technologii, reakcja na bunt, decyzja przed bitwą, pusta kolejka produkcji (zależnie od ustawień). Skok idzie do **pierwszego** zadania w kolejności — ten sam efekt co klik czerwonego chipu w panelu wydarzeń.

### 16.3. Koniec tury

Aktywny tylko gdy **brak** blocking. Wyszarzony, dopóki świeci **Wykonaj** lub czerwony chip. Po kliknięciu: rozliczenie ekonomii, ruch AI, barbarzyńcy, następna tura. Skrót klawiaturowy (Enter / N — jeśli włączony w buildzie).

**Wskazówka:** Nie kończ tury z pustą produkcją w stolicy, jeśli gra tego wymaga — ustaw choćby ulepszenie drogi lub rekrut zwiadowcy.

### 16.4. Chipy wydarzeń

Panel pod paskiem zbiera komunikaty z bieżącej tury:

| Typ chipu | Zachowanie |
|-----------|------------|
| **Blocking** (czerwony) | Blokuje Koniec tury — musisz rozwiązać |
| **Informacyjny** (z ✕) | Można zamknąć — np. „Ukończono Murarstwo" |

Przykłady blocking: „Wybierz technologię", „Miasto X — niepokój", „Ustaw produkcję w Y".

### 16.5. Menu i ustawienia

Zapis, wczytanie, powrót do menu głównego — zwykle w rogu dolnego paska lub pod ikoną koła zębatego.


### Przykład liczbowy

Pasek: **+12** ¤ · **+8** 🍞 (wojsko) · **+5** badań — suma z 4 miast po suwakach.
Czerwony ¤ (**−3**/t) = utrzymanie **15**, przychód **12** → za **5** tur skarbiec **−15** ¤.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 17. Lewy panel (toolbar mapy) — Cuda i Budowa

### 17.1. Cuda świata — z listy budowy miasta (2026-07-24: usunięty osobny katalog)

**Nie ma** już osobnego ekranu/galerii Cudów otwieranego medalionem na toolbarze — Cuda buduje się **z listy budowy miasta** (sekcja „Cuda świata" w panelu Produkcja), a lista jest już **filtrowana per cywilizacja** (nie zobaczysz cudów zarezerwowanych dla innej cywilizacji ani niedostępnych w tym miejscu/epoce). Warunki budowy: technologia, teren, koszt pracy, często **jeden na świat** (typ E wyłączny lub R wyścigowy). Szczegóły — Część XV §94.

### 17.2. Budowa (ulepszenia terenu)

Tryb budowy na mapie: wybierz ulepszenie (farma, tartak, droga…) → kliknij heks w **swoim** terytorium. Koszt w **pracy**, nie w złocie. Pełna lista — [`28-katalog-ulepszen.md`](28-katalog-ulepszen.md).

### 17.3. Czego nie ma na lewym panelu

Osobna ikona „Zasoby" — usunięta; liczby tylko u góry ekranu.


### Przykład liczbowy

Cud **+5** kultury/t (normal) — pierwszy próg granic **100** pkt → **20** tur do +1 zasięgu terytorium.
Absolut po **10** turach: utrzymanie **3** ¤/t — bez skarbca opłacasz z **3** miast po **1** ¤.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 18. Minimapa

### 18.1. Mała mapa heksów

Uproszczony podgląd świata — nie kopia widoku 3D. Prostokąt pokazuje, gdzie patrzy kamera. Służy do skoków między frontem a tyłem imperium.

### 18.2. Mgła wojny

Niewidziane heksy są przyciemnione; odkryte — kolor terenu lub frakcji. Minimapa **nie** pokazuje jednostek wrogich w mgle.

### 18.3. Przeskok kamery

Klik na minimapę = natychmiastowy skok widoku. Podwójny klik na miasto na liście **Miasta** robi to samo z focusem na panel.

### 18.4. Warstwy przy minimapie

Ikony **kultury** (🎭) i **religii** nakładają kolor na terytorium — pomaga planować świątynie i misje religijne (Część XV §91–92).


### Przykład liczbowy

Mapa standard **84×60** = **5040** heksów. Zasięg wzroku **2** → **19** heksów widocznych od jednostki.
Kultura próg **100** pkt → **+1** pierściień pól wokół miasta (~**6** nowych heksów terytorium).

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 19. Banery wojny i dyplomacji

### 19.1. Twoje wojny

Na mapie widać banery tylko wojen, w których **uczestniczysz ty**. Baner: z kim walczysz, czasem liczba tur. Klik → dyplomacja lub szczegóły konfliktu.

### 19.2. Wojny innych

**Nie** pojawiają się na banerach mapy — nie dostajesz „wiadomości świata". Sprawdź panel **Dyplomacji** → lista relacji i statusów sąsiadów.

### 19.3. Sojusze i handel

Pakt i traktat handlowy mogą mieć własne ikony na pasku dyplomacji — zawsze możesz wejść w pełny panel dla warunków.


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Wysyłaj **prezenty** przed prośbą o pakt — relacja **+20** taniej niż wojna o jedno miasto.

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 20. Siła państwa

### 20.1. Duża liczba na mapie

Widoczna wartość **siły państwa** całego imperium — aktualizowana co turę i po większych bitwach. To szybki termometr: czy jesteś liderem regionu, czy doganiasz AI.

### 20.2. Siła państwa vs szacunek

| Pojęcie | Co mierzy |
|---------|-----------|
| **Siła państwa** | Wojsko, miasta, ludność, tech, wygrane bitwy — „ciężar" na mapie |
| **Szacunek** (Respekt) | Jak dyplomaci cię oceniają — Część XII |

**Cuda nie dodają siły państwa** — dają bonusy ekonomiczne lub dyplomatyczne, ale nie podbijają licznika M.

### 20.3. Składniki (skrót)

Armia w polu, ludność, liczba miast, heksy terytorium, budynki, technologie, ulepszenia pól, suma mocy pokonanych w bitwach.

### 20.4. Czego nie wlicza się

Mnożnik epoki (osobna mechanika), cuda (bez wpływu na M), tymczasowe buffy pojedynczej bitwy.

### 20.5. Tooltip

Jeśli gra pokazuje rozbicie składników — użyj go przed wypowiedzeniem wojny silniejszemu sąsiadowi. Zwycięstwo **dominacją** (Część XVI) opiera się właśnie na tej liczbie w ostatniej epoce.


### Przykład liczbowy

Armia: **3×** piechota M=**8**, **1×** rydwan M=**12** → suma **36** mocy w polu.
Próg dominacji **>50%** świata w epoce Żelaza — przy światowej sile **200** potrzebujesz **>100**.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 21. Zapasy żywności państwa (Spichlerz)

### 21.1. Format bieżące / maksimum

Ze Spichlerzem na pasku żywności widzisz np. **45 / 100**. Maksimum rośnie z liczbą i poziomem Spichlerzy w imperium. Bez Spichlerza — inny model (§14.1, Część VI §39).

### 21.2. Magazyn pełny

Nadwyżka żywności przeznaczona na wojsko **nie rośnie** ponad sufit — strategia: więcej Spichlerzy albo większa armia zużywająca zapasy.

### 21.3. Magazyn pusty

Wojsko w polu: **głód −8% maksymalnego zdrowia na turę** (Część VIII §50). Wzrost miast nadal idzie z **lokalnego bufora**, nie z magazynu państwa.

### 21.4. Związek z miastami

Suwak żywności **30% na wojsko** (domyślnie przy 70% rozwój) karmi magazyn państwa. Pierwszy Spichlerz warto postawić, gdy masz co najmniej dwa miasta lub dużą armię poza stolicą.

### 21.5. Wiki

Hasła encyklopedii: **Spichlerz** · **Zapasy państwa** · **Żywność wojska** — karty w `docs/encyklopedia/pojecia/`.

### 21.5a. Osobna sprawa: magazyn żywności vs magazyn surowców

To, co opisuje §21, dotyczy **wyłącznie żywności** (model per miasto + mnożnik Spichlerza). **Surowce** logistyczne (drewno, kamień, glina, ruda, ruda żelaza, cegła, ceramika, brąz, żelazo, stal) mają **osobny, prostszy model** — patrz §21.5b niżej. Nie myl obu magazynów: różne zasoby, różne wzory pojemności.

### 21.5b. Magazyn surowców = pula CAŁEGO PAŃSTWA (2026-07-24, SUROW-CIV-01)

Dla surowców logistycznych (drewno, kamień, glina, ruda, ruda żelaza, cegła, ceramika, brąz, żelazo, stal) obowiązuje **jeden wspólny magazyn imperium**, nie osobny per miasto:

| Element | Wartość |
|---------|---------|
| **Baza** (bez Magazynów) | **500** sztuk na typ surowca, dla całego imperium |
| **Bonus za budynek Magazyn** | **+100** na typ surowca za **każdy** zbudowany Magazyn — w dowolnym mieście imperium |
| **Model** | **Addytywny** — 2 Magazyny w 2 różnych miastach = +200, nie ×2; poziom Magazynu nie ma znaczenia, liczy się sama obecność budynku w mieście |
| **Zasięg** | Civ-wide — pula wspólna dla wszystkich miast jednego ownera (gracza **lub** dowolnej cywilizacji AI, ta sama zasada dla obu) |
| **Nadwyżka** | Ponad cap **przepada** po produkcji i konwersji w danej turze (klamrowanie raz na turę) |

Ten magazyn **zużywają realnie**: koszt materiałowy budynków (cegła/ceramika i inne — Część VIII §53.2) oraz koszt surowcowy jednostek wymagających Brązu/Żelaza przy rekrutacji (Część VII §47.2a) — w obu przypadkach niedobór **blokuje** kolejkę, dla gracza i dla AI jednakowo.


### Przykład liczbowy

**1** Spichlerz → limit zapasów państwa **100** 🍞 (normal). Wojsko **8** jednostek × **1** 🍞 = **8**/turę.
Nadwyżka suwaka **+6**/turę przez **10** tur → magazyn **60/100**.
Po awansie ludności bufor **68** 🍞 → ze Spichlerzem zostaje **50%** = **34** 🍞 (próg następny nadal **68** przy N=3).

### Strategia gracza

Postaw **pierwszy Spichlerz** przed masową rekrutacją — jeden budynek w imperium włącza **50%** bufora i magazyn **100** 🍞.

### Typowe błędy

- Rekrutacja **10** jednostek **bez** Spichlerza i bez zapasu — głód **−8%** HP/t.
- Myślenie, że Spichlerz musi być **w tym samym** mieście co armia (efekt **globalny**).

---

*Poradnik‑L · Część III · rev. G · 2026-07-24 (§14.2 magazyn surowców = pula 500 państwa + Magazyn; §17.1: Cuda świata = z listy budowy miasta, nie osobna galeria) · pierwotnie rev. F 2026-07-23, rev. E 2026-07-03 · źródła: `buildings.json`, `econ-params.json`, decyzja B5 (Spichlerz)*
