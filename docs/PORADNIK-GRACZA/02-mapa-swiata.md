# Część II — Mapa świata

> **Poradnik gracza (Pełny)** · mapa strategiczna 3D · heksy · terytorium · mgła  
> Powiązane: Część I (kreator) · Część III (minimapa, warstwy) · Część V (ulepszenia) · decyzja [`E3-surowce.md`](../decyzje/E3-surowce.md) · spis §9–13

Mapa świata to twoje pole rozgrywki: heksagonowa siatka, generator terenu, mgła wojny, granice państw i złoża surowców. Ten rozdział tłumaczy, co widzisz na ekranie 3D, jak poruszać kamerą, gdzie możesz budować i skąd biorą się plony z pól.

---

## 7. Układ mapy i generator

### 7.1. Heksagon, kamera, orientacja

Świat zbudowany jest z **heksów** (sześciokątów) — standardowa mapa 4X. Jednostki i miasta stoją **na** heksie, nie między polami.

| Sterowanie | Efekt |
|------------|-------|
| Przeciągnięcie / krawędzie ekranu | Przesuwanie kamery |
| Kółko myszy | Zoom |
| Klik heksu | Zaznaczenie / ruch / panel |

Północ zwykle u góry ekranu. Wysokość terenu (wzgórza, góry) wpływa na koszt ruchu i bonusy w walce (Część IV §23, Część X).

**Wskazówka:** Przy dużej mapie używaj **minimapy** (Część III §18) — szybszy skok niż długie przesuwanie kamery.

### 7.2. Typy świata

Ustawiasz w kreatorze (Część I §2.4):

| Typ | Charakter |
|-----|-----------|
| **Kontynenty** | Kilka dużych lądów, morze między nimi — default |
| **Pangea** | Jeden superkontynent, mniej izolacji, więcej wczesnych wojen |
| **Wyspy** | Archipelag, dużo morza i wybrzeży — łodzie rybackie ważniejsze |
| **Ziemia** | Układ inspirowany kontynentami Ziemi (preset, nie losowy szum) |

Typ świata **nie zmienia się** w trakcie gry. Seed mapy jest losowy przy każdym **Start** — ta sama konfiguracja kreatora da inną mapę, chyba że gra udostępni seed ręcznie w przyszłości.

### 7.3. Gęstość świata

| Ustawienie | Efekt |
|------------|-------|
| **Mało** | Rzadsze złoża i dekoracje, więcej „pustych" pól |
| **Średnio** | Profil domyślny |
| **Dużo** | Więcej złóż i detali wizualnych — mapa wygląda bogatszej |

Gęstość wpływa na **szanse złoża** i ozdobniki krajobrazu, nie na rozmiar siatki.

### 7.4. Typy terenu i plony bazowe

Każdy heks ma **typ terenu** — decyduje o plonach bazowych i koszcie ruchu:

| Teren | Typowa rola |
|-------|-------------|
| Łąka, równina | Żywność — farma, bydło |
| Las | Tartak, wyrąb, obóz łowiecki |
| Wzgórze | Owce, kamieniołom |
| Góry | Kopalnia, złoża metali (po epokach) |
| Pustynia | Tarasy, warzelnia soli (przy złożu) |
| Rzeka | Bariera ruchu; sąsiad dla irygacji |
| Morze, wybrzeże | Łodzie rybackie (w terytorium miasta) |

Pełna tabela plonów — apendyks B.7 spisu; przypisanie pól do miasta — Część VII §43–44.


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 8. Mgła wojny i widoczność

### 8.1. Zasięg wzroku jednostki

Większość jednostek widzi **3 heksy** wokół pozycji. **Zwiadowca** — minimum **5 heksów** (dłuższe odkrywanie). Wzrok liczy się od miejsca, gdzie jednostka **skończyła** ruch w tej turze.

### 8.2. Odkrywanie terenu

Heksy **poza** zasięgiem wzroku są w **mgle** — ciemne lub ukryte. Ruch jednostki **odkrywa** heksy na trasie. Raz odkryte obszary zwykle pozostają widoczne na mapie (bez wroga na polu — szczegóły zależą od buildu v1.0).

**Zasięg mgły ≈ zasięg ruchu** — im dalej dojedziesz, tym więcej świata poznasz.

### 8.3. Terytorium miasta a widoczność

Heksy w **twoim terytorium** mogą być widoczne nawet bez jednostki (zasięg miasta). Terytorium wroga odkrywasz przez zbliżenie wojska lub dyplomację. Granica terytoriów decyduje o budowie i ruchu (§9).

### 8.4. Minimapa a mgła

Minimapa pokazuje mgłę — niewidziane obszary są przyciemnione. Odkryty ląd i morze mają uproszczone kolory; twoje terytorium wyróżnia kolor państwa. **Klik** na minimapę przenosi kamerę (Część III §18).

**Wskazówka:** Trzymaj zwiadowcę na granicy mgły — stały „czujnik" taniej niż cała armia na patrolu.


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 9. Terytorium

### 9.1. Zasięg rośczeń

| Obiekt | Zasięg terytorium (model v1) |
|--------|------------------------------|
| **Miasto** | ok. **10 heksów** wokół centrum |
| **Posterunek (Strażnica)** | ok. **5 heksów** |
| **Fort** | ok. **10 heksów** (jak miasto) |

Tylko **twoje** terytorium — tam stawiasz ulepszenia i zbierasz plony z przypisanych pól. Posterunek i fort rozszerzają zasięg **pól pracujących** dla miasta (Część VII §44.4).

### 9.2. Zakładanie kolejnego miasta

**Nie ma jednostki osadnika** — nowe miasto zakładasz z panelu **Budowa → Załóż miasto** (`foundCityAt` w silniku):

| Warunek | Wartość |
|---------|---------|
| **Koszt** | **20 Pracy** (skarbiec imperium) **+ 1 ludność** z miasta-źródła |
| **Miasto-źródło** | Największe miasto z populacją ≥ **2** (po founding zostaje min. 1 mieszkaniec) |
| **Min. odległość** | **4 heksy** od każdego innego miasta (było 5 — FALA 206) |
| **Teren** | Odkryty heks w **twoim** terytorium lub po **Strażnicy** w nowym regionie |

Nie możesz założyć miasta na **obcym** terytorium ani w **mgle** bez wcześniejszego odkrycia. Drugie miasto = nowy panel, nowa okolica, **wspólny** skarbiec imperium (Część VIII). Pełny opis — Część V §27.3 · encyklopedia [`zalozanie-miasta.md`](../encyklopedia/pojecia/zalozanie-miasta.md).

### 9.3. Właściciel heksu i plony

Właściciel heksu = państwo, którego terytorium go obejmuje. **Plony** trafiają do miasta, które **pracuje** na tym heksie (zakładka **Okolica** — Część VII §44). Po wojnie heks może zmienić właściciela — sprawdź przypisanie pól w podbitym mieście.


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 10. Warstwy — kultura i religia

### 10.1. Przełączniki przy minimapie

Przy minimapie znajdziesz ikony **kultury** i **religii** — włączasz je niezależnie. Każda otwiera **nakładkę informacji** (lista miast, progi presji), nie kolorowy dywan na mapie 3D.

### 10.2. Co pokazuje nakładka

- Lista miast z procentem **własnej** vs **obcej** kultury / religii.
- Progi presji — które miasta są zagrożone obcą dominacją.
- Skrót do panelu miasta — klik na wpis (jeśli UI to wspiera).

Szczegóły kultury w mieście — Część VI §40; pełna mechanika — Część XV.

### 10.3. Czego nie ma w v1.0

**Brak** kolorowego zasięgu kultury/religii na heksach mapy 3D. Informacja jest w **panelu nakładki** i w zakładce **Miasto** — nie szukaj kolorowych obrysów na terenie jak w niektórych grach 4X.


### Przykład liczbowy

Podbite miasto: **30%** twojej kultury, obca religia dominuje **−2** szczęścia, obca kultura **−1**.
Świątynia **+2** kultury/t + bonus własnej religii **+2** szczęścia po przekroczeniu **50%** wyznawców.
Po **8 turach** konwersji **+1%/t** (baza) → **38%** kultury — kara spada, ale wciąż **−1**.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 11. Złoża surowców

### 11.1. Złoże rezerwuje heks

Heks ze **złożem** (miedź, żelazo, glina, sól…) **nie przyjmuje** farmy ani tartaku. Złoże widać na mapie jako osobny obiekt / ikonę. Dostęp do surowca — przez **technologię** lub **ulepszenie** (kopalnia, glinianka…).

### 11.2. Ukrywanie złóż do epoki (decyzja E3)

| Surowiec | Widoczność od | Teren |
|----------|---------------|-------|
| **Miedź** | epoki **Brązu** | **Góry** |
| **Żelazo** | epoki **Żelaza** | **Góry** |

Złoża metali **tylko na górskim** terenie — nie na równinach. Przed epoką złoże może być niewidoczne; po wejściu w epokę „odkrywasz" je na mapie.

**Kamień to inny przypadek — bez złoża.** W odróżnieniu od miedzi/żelaza, **kamień nie wymaga złoża widocznego na mapie** — to zwykły zasób terenowy: stawiasz **Kamieniołom** wprost na **Wzgórzach** lub **Górach** i tyle (tak samo jak Tartak na lesie nie wymaga złoża drewna). Ruda miedzi i ruda żelaza za to **wymagają** złoża + Kopalni na tym złożu (§11.1–11.2 wyżej) — to one, nie kamień, ujawniają się dopiero z wejściem w odpowiednią epokę.

### 11.3. Model dostępu — i osobno: magazyn z realnym zużyciem (aktualizacja 2026-07-24)

Dwie osobne warstwy działają razem — nie myl ich:

- **Dostęp** (tak/nie) — odblokowanie **technologią** LUB **ulepszeniem/złożem** (kopalnia na miedzi, tartak na lesie…). To wciąż prosta flaga: masz dostęp albo nie.
- **Magazyn i zużycie** (realne ilości) — dla surowców logistycznych (drewno, kamień, glina, ruda, ruda żelaza, cegła, ceramika, brąz, żelazo, stal) gra **naprawdę liczy sztuki** i **odejmuje je** przy budowie budynków z kosztem materiałowym (Część VIII §53.2) i przy rekrutacji jednostek wymagających Brązu/Żelaza (Część VII §47.2a). To **już nie jest** plan na przyszłość — działa dziś, jako **wspólna pula całego imperium** (cap 500 na typ + 100 za każdy zbudowany Magazyn, Część III §21.5b).

**Wskazówka:** Ikona „masz miedź" w panelu wciąż oznacza tylko **dostęp** — ale jeśli budujesz coś z kosztem materiałowym (np. Mury = 15 cegły) albo rekrutujesz jednostkę wymagającą Brązu/Żelaza, sprawdź też **stan puli państwa** — pusty magazyn zablokuje kolejkę mimo posiadanego dostępu.

### 11.4. Czego nadal nie ma

Żywność **nie** jest objęta tym modelem puli państwa — działa osobno, per miasto + mnożnik Spichlerza (Część III §21). Nie ma też jeszcze „zbierania" surowców ręcznie przez jednostki cywilne — produkcja i konwersja są automatyczne z pól/budynków miasta.


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 12. Wygląd miast na mapie

### 12.1. Poziomy wizualne

Wielkość modelu 3D rośnie z **poziomem / populacją** miasta (do **10 stopni**). Model zależy od **cywilizacji** — Rzym wygląda inaczej niż Egipt. Wariant **z murem** i **bez muru** to osobne modele.

### 12.2. Cywilizacje Brązu v1

Pełne modele miast epoki Brązu mają m.in. **Sumer, Egipt, Inkowie, Zulusi** — reszta może mieć placeholder w danym buildzie. Sprawdź w grze, czy twoja nacja ma dedykowany model.

### 12.3. Mury

Mur otacza miasto na mapie — sygnał dla **oblężenia** (Część XI). Styl wizualny uproszczony (wysokość ok. 70% heksa). Miasto **bez muru** łatwiej zdobyć szturmem.

### 12.4. Obóz oblężniczy

Podczas oblężenia może pojawić się obóz wokół murów — status wdrożenia sprawdź w aktualnym buildzie. **Nie mylić** z **obozem łowieckim** (ulepszenie pola — [`28-katalog-ulepszen.md`](28-katalog-ulepszen.md)).

### 12.5. Pigułka miasta na mapie (FALA 208)

Nad każdym miastem widzisz **pigułkę informacyjną v1** (sprite nad modelem 3D):

| Element | Co pokazuje |
|---------|-------------|
| **Nazwa + populacja** | Skrót nazwy miasta i liczba mieszkańców |
| **Tarcza obrony** | 3 poziomy siły obrony (mury, fort, budynki) |
| **Medalion cywilizacji** | Litera/symbol typu państwa |
| **Glif produkcji** | Ikona budynku lub jednostki w kolejce (gdy miasto coś buduje) |

Pigułka jest zawsze widoczna przy zoomie mapy — nie musisz klikać miasta, żeby zobaczyć populację i produkcję.


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 13. Ruch po mapie

### 13.1. Koszty terenu

Każdy typ terenu zużywa inną liczbę **punktów ruchu**:

| Teren | Typowy koszt |
|-------|--------------|
| Łąka, równina | Niski |
| Las, wzgórze | Wyższy |
| Rzeka | Przeprawa — drogo lub blokada (mosty — status v1) |
| **Droga** (ulepszenie) | **Tańszy** ruch (Część V §31) |

Klik docelowy heks — gra pokazuje **trasę** i koszt. Nie wejdziesz na **obce terytorium** bez zgody dyplomatycznej lub wojny (Część XII §80).

### 13.2. Łodzie rybackie

**Łódź rybacka** jako ulepszenie — tylko na **wybrzeżu** w **twoim** terytorium (i morze przy wybrzeżu miasta). Poza terytorium morze jest niedostępne do budowy łodzi w v1.0.

### 13.3. Transport morski

Mechanika **zaokrętowania** wojska na morze — status wdrożenia v1.0. Jeśli brak: wojsko lądowe nie pływa; planuj wybrzeża i lądowe obejścia. v2.0 — pełny transport morski.

### 13.4. Priorytet kliknięcia

Gdy na heksie jest kilka obiektów, gra wybiera według priorytetu:

1. **Jednostka** — karta jednostki (Część IV §22)
2. **Miasto** — panel miasta
3. **Ulepszenie terenu** — informacja / tryb budowy (Część V)

**Wskazówka:** Chcesz otworzyć miasto, a stoi na nim wojsko — najpierw odznacz jednostkę (klik pustego heksu) albo użyj listy **Miasta** na dolnym pasku.


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Mapa a reszta poradnika

| Temat | Gdzie dalej |
|-------|-------------|
| Pasek zasobów, minimapa | Część III |
| Tryb budowy, ulepszenia | Część V · [`28-katalog-ulepszen.md`](28-katalog-ulepszen.md) |
| Jednostki, ruch bojowy | Część IV |
| Plony z pól | Część VII §43–44 |
| Surowce imperium | Część VIII §53 |


### Przykład liczbowy

Mapa standard **84×60** = **5040** heksów. Zasięg wzroku **2** → **19** heksów widocznych od jednostki.
Kultura próg **100** pkt → **+1** pierściień pól wokół miasta (~**6** nowych heksów terytorium).

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik‑L · Część II · rev. G · 2026-08-04 (§9.2: Załóż miasto bez osadnika, min. 4 hex; §12.5: pigułka miasta FALA 208) · rev. F 2026-07-24 · pierwotnie rev. E 2026-07-03 · decyzje: E1, E3, SUROW-CIV-01 · dane: generator mapy, `ui-params.json` · spis §9–13*
