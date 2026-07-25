# Część VII — Miasto: budowa, plony i rekrutacja

> **Poradnik gracza (Pełny)** · zakładki **Plony · Produkcja · Okolica**  
> Powiązane: Część VI (ludność, suwaki) · [`45-katalog-budynkow.md`](45-katalog-budynkow.md) · [`57-katalog-jednostek.md`](57-katalog-jednostek.md) · spis §42–48

Panel miasta ma cztery zakładki u góry; trzy z nich to **praca na co dzień**: skąd biorą się plony, co budujesz i które pola pracują dla miasta. Zakładka **Miasto** (ludność, szczęście, suwaki) jest w Części VI — tu skupiamy się na **produkcji materialnej i wojsku**.

---

## 42. Trzy zakładki robocze

### 42.1. Zakładka Plony

Podsumowanie **netto co turę** z pól i budynków przypisanych do tego miasta:

- **Żywność** — czy miasto karmi wzrost i udział wojska.
- **Praca** — ile trafia do kolejki budowy i na mapę (przez suwaki).
- **Złoto** — podatki z pól i handel lokalny (reszta przez suwak handlu w zakładce Miasto).

**Wskazówka:** Otwieraj **Plony** po podboju — nowe miasto często ma zerowe przypisanie pól i stoi w miejscu mimo dużej populacji.

### 42.2. Zakładka Produkcja

- Lista **budynków** do wzniesienia (szare = brak tech lub wymagań).
- **Kolejka** — jeden aktywny projekt w v1.0; pasek postępu w pracy.
- **Rekrutacja** jednostek — ta sama kolejka lub sekcja obok listy budynków (zależnie od buildu UI).

Katalog wszystkich 26 budynków: [`45-katalog-budynkow.md`](45-katalog-budynkow.md).

### 42.3. Zakładka Okolica

Siatka heksów w promieniu miasta — które pola **pracują** dla tego centrum. Profile: Żywność, Produkcja, Podatki, Zrównoważone; ręczna korekta ikoną ręki.

### 42.4. Alerty Wykonaj

Pusta produkcja w ważnym mieście może wywołać chip **blocking** — dolny pasek **Wykonaj** przenosi cię do zakładki **Produkcja** tego miasta.


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

## 43. Zakładka Plony — skąd biorą się liczby

### 43.1. Żywność

| Źródło | Przykład |
|--------|----------|
| Pola | Farma (+3), irygacja (+5), bydło, łodzie rybackie |
| Budynki | Spichlerz (+2 na poziom), łaźnia publiczna |
| Suwak | Część netto żywności miasta idzie w bufor wzrostu lub na wojsko państwa (Część VI §38.3) |

Bez pól żywnościowych bufor wzrostu **nie rośnie**, nawet przy wysokim suwaku „Rozwój miast".

### 43.2. Praca

Ulepszenia: tartak, kamieniołom, kopalnia, glinianka; budynki: stolarnia, kuźnia, warsztat kamieniarski. Suwak **pracy** (30% domyślnie na teren) decyduje, ile z plonów pól wraca na rozwój okolicy vs na budynki w kolejce.

### 43.3. Złoto z pól

Profile **Podatki** i **Zrównoważone** kierują heksy na wyższy dochód złota z terenu. Handel międzymiastowy i karawanseraj to już budynki + dyplomacja — nie pojedynczy heks.

### 43.4. Typ terenu

Łąka i równina — żywność; las — tartak lub wyrąb; wzgórze — owce, kamieniołom; wybrzeże — port i łodzie. Tabela terenu — apendyks B.7 spisu treści.

### 43.5. Cuda

Cud z bonusem ×3 mnoży wybrane plony **per miasto** w zasięgu. Po zbudowaniu cudu absolut w epoce — bonus wygasa, zostaje turystyka (+handel).


### Przykład liczbowy

Kolejka: Spichlerz **20** pracy, miasto daje **7**/t na budynki (70% z **10** pracy) → **3** tury budowy.
Rekrutacja włócznika **20** pracy w koszarach — ta sama pula co budynki (kolejka jedna).

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 44. Okolica — przypisanie pól

### 44.1. Promień

Domyślnie **3 heksy** od centrum miasta — tylko we **własnym** terytorium. Centrum miasta nie przyjmuje farmy; ulepszenia stawiasz na sąsiadach.

Zasięg rośnie z **posterunek** (+5) i **fort** (+10) na mapie (Część V §28).

### 44.2. Profile automatyczne

| Profil | Kiedy wybrać |
|--------|----------------|
| **Żywność** | Nowe miasto, granica głodu, bufor stoi |
| **Produkcja** | Kolejka murów, kuźni, cudów — potrzebujesz pracy |
| **Podatki** | Stolica bogata, mała armia, spłacasz utrzymanie |
| **Zrównoważone** | Tło miasta bez specjalizacji |

Auto-zarządca (Część VI §41) może przełączać profile — możesz zostawić ręczną korektę na złożu miedzi.

### 44.3. Ręczna korekta

Ikona **ręki** → klik heksu → przypisanie na stałe do tego miasta, nadpisuje auto na tym polu. Używaj przy rzadkich surowcach: jedno miasto na żelazo, drugie na żywność.

### 44.4. Utrata heksu

Wojna przejmuje terytorium → pole przestaje pracować dla ciebie. Po pokoju sprawdź **Okolicę** — profile mogą wskazywać na puste heksy.

### 44.5. Konflikt praca vs budynki

Duża kolejka budynków + profil Produkcja = wolniejszy wzrost pól. Planuj: najpierw farma pod Spichlerz, potem mury.


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

## 45. Budynki w mieście (skrót)

Pełny katalog z tabelą i kartami Wiki: [`45-katalog-budynkow.md`](45-katalog-budynkow.md).

### 45.1. Kategorie

| Kategoria | Po co |
|-----------|-------|
| Produkcja | Praca, czasem złoto (stolarnia, kuźnia, wielka kuźnia) |
| Pieniądz | Targowisko, port, karawanseraj |
| Żywność | Spichlerz |
| Nauka | Biblioteka, Akademia |
| Kultura | Świątynia, teatr, pałac, stela |
| Wojsko | Koszary, warsztat oblężniczy, akademia wojskowa |
| Obrona | Mury, fort (w mieście) |
| Zdrowie | Studnia, łaźnia |
| Administracja | Sąd, pretorium |

### 45.2. Koszt i poziomy

- Budowa w **pracy** — pierwszy poziom od 15 (studnia) do 90 (wielka kuźnia).
- Poziomy **1–10** — każdy + przyrost statystyk i + koszt kolejnego poziomu.
- W v1.0 zwykle **jeden** budynek na raz w kolejce podstawowej.

### 45.3. Utrzymanie

Koszt w **¤ na turę** per budynek — sumuje się w skarbcu państwa. Stela nie wymaga utrzymania; akademia wojskowa i fort są drogie — licz przed spamem poziomów.

### 45.4. Technologie

Szare na liście = brak tech. Przykłady: Murarstwo → kamieniarski; Brązownictwo → kuźnia i koszary; Oblężnictwo → warsztat oblężniczy (odblokowuje katapultę w mieście).

### 45.5. Surowce — dostęp i koszt materiałowy (zaktualizowane 2026-07-23)

Dwa osobne mechanizmy działają razem:

- **Dostęp** do surowca na mapie (miedź, żelazo, koń, drewno…) — nadal **tak/nie** po złożu + ulepszeniu na heksie (Część VIII §53.1), nie magazyn sztuk.
- **Koszt materiałowy** — **10 budynków** epoki Brązu/Żelazo (Karawanseraj, Świątynia, Biblioteka, Spichlerz II, Akwedukt, Pretorium, Łaźnia publiczna, Akademia, Mury, Cytadela) pobierają **cegłę** lub **ceramikę** z magazynu miasta przy wejściu do kolejki — realne odejmowanie sztuk, nie flaga. Pełna tabela kosztów i strategia — Część VIII §53.2.

**To dlatego Cegielnia i Garncarnia wreszcie mają sens** — bez zapasu cegły/ceramiki karta budynku pokazuje brakujący chip surowca i nie wejdzie do kolejki, nawet przy pełnej puli Pracy.

### 45.6. Przyrost i mnożniki

Budynki dają stały przyrost (żywność, nauka…) lub **mnożnik %** (kuźnia → silniejsze jednostki z miasta, karawanseraj → handel lądowy). Kumulują się z suwakami z Części VI.

**Wskazówka:** Pałac — jeden na miasto, fundament kultury; Spichlerz — pierwszy w imperium przed masową rekrutacją.


### Przykład liczbowy

Autosave co **1** turę — przy **30** min/turze partia **100** tur = **~50** h bez ręcznego zapisu.
Skrót **Spacja** = Wykonaj — oszczędza **~2** kliknięcia × **200** tur = **400** akcji mniej.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 46. Produkcja — kolejka budowy

### 46.1. Wybór z listy

Podgląd kosztu pracy i utrzymania przed zatwierdzeniem. Wymagania terenu (port przy rzece) i łańcuchowe (łaźnia wymaga studni) — gra pokazuje komunikat przy szarej pozycji.

### 46.2. Postęp

Pasek w **pracy** — zasila go to miasto + jego okolica + udział globalnej puli. Szacunek tur: pozostała praca ÷ przyrost pracy na turę (przybliżenie).

### 46.3. Przyspieszenie za złoto

**Rush** — dopłacasz ¤ za brakującą pracę. Opłaca się przy murach przed oblężeniem lub ostatnim poziomem Biblioteki przed tech-race.

### 46.4. Pusta kolejka

Gra może wymagać ustawienia produkcji przed końcem tury — wtedy **Wykonaj** jest aktywne. Wyjątki zależą od ustawień scenariusza; bezpiecznie: zawsze coś w kolejce w stolicy.

### 46.5. Auto-zarządca

W v1.0 auto-zarządca reguluje suwaki i okolicę; **wybór budynku** zwykle zostaje u gracza. Sprawdź, czy w twoim buildzie nie przejął też kolejki — ikona koła w zakładce Miasto.


### Przykład liczbowy

Kolejka: Spichlerz **20** pracy, miasto daje **7**/t na budynki (70% z **10** pracy) → **3** tury budowy.
Rekrutacja włócznika **20** pracy w koszarach — ta sama pula co budynki (kolejka jedna).

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 47. Rekrutacja jednostek

Katalog 50 jednostek: [`57-katalog-jednostek.md`](57-katalog-jednostek.md).

### 47.1. Gdzie rekrutować

Sekcja wojska w **Produkcji** — lista jednostek dostępnych po technologii i budynkach (koszary, warsztat oblężniczy dla katapulty). Jednostki **unikalne** cywilizacji zamiast standardowego włócznika czy łucznika — Część XIII §85.

### 47.2. Koszt — złoto + pula Manpower (nie ludność)

| Składnik | Znaczenie |
|----------|-----------|
| **Złoto** | Płacisz ze skarbca imperium (np. wojownik 10 ¤, włócznik 16 ¤) |
| **Manpower** | Pula rekrutów **per miasto** — patrz §47.2b niżej. **Prawdziwy** koszt „ludzki" werbu |
| **Ludność miasta** | **0** — rekrutacja **nie** zabiera mieszkańców (zmiana 2026-07-21); populacja rośnie niezależnie od tego, ile werbujesz |
| **Technologia** | Brązownictwo, Łucznictwo (wymaga Łowiectwa — Część IX §56.2), Jeździectwo… |
| **Surowiec** (`units.json`: `Surowiec` / `Surowiec (ilość)`) | **Odejmowane naprawdę** z magazynu państwa przy rekrutacji — patrz §47.2a niżej (wdrożone 2026-07-24, JEDNOSTKI-SUROWIEC-01) |

**Super-jednostki** stolicy — **większość** kosztuje **0 ¤** (Hieros Lochos, Hu Ben Wei, uThulwana, Królewska Gwardia, Medżaj, Gwardia Królewska Sumeru, Evocati), ale **Triari** (18 ¤) i **Wojownik germański** (16 ¤) mają dziś realny koszt złota — sprawdź kartę **[H]**, nie zakładaj automatycznie „super = darmowe". Wszystkie: max 1 na raz, odradzają się po stracie stolicy.

### 47.2a. Koszt surowcowy jednostek — z magazynu państwa (2026-07-24)

Część jednostek epoki Brązu i Żelaza ma w `units.json` pole `Surowiec` (**Brąz** lub **Żelazo**) + `Surowiec (ilość)` (zwykle **2–3** sztuki). Przy **rekrutacji** ta ilość jest **naprawdę odejmowana** z tej samej **puli surowców całego imperium** co koszt materiałowy budynków (§45.5, cegła/ceramika) — nie z konkretnego miasta, tylko ze wspólnego magazynu państwa (Część III §21.5, limit **500 + 100/Magazyn**).

| Sytuacja | Co się dzieje |
|----------|---------------|
| Pula ma wystarczająco Brązu/Żelaza | Rekrutacja rusza normalnie, ilość znika z magazynu państwa |
| Pula **za mała** | Przycisk rekrutacji **blokuje się** — komunikat „Za mało surowca w magazynie państwa"; nie da się złożyć zamówienia nawet mając złoto i Manpower |
| Anulowanie rekrutacji w kolejce | Surowiec wraca do puli państwa (zwrot symetryczny do poboru) |
| AI (każda cywilizacja) | **Ta sama zasada** — AI pomija budynek/jednostkę, której nie stać w surowcu, zamiast się „zawieszać"; brak uprzywilejowania gracza |

Sprawdź kolumnę **Surowiec** w [`57-katalog-jednostek.md`](57-katalog-jednostek.md) (dane surowe w `units.json`), zanim rzucisz się w masową rekrutację włóczników czy falang — pusty magazyn Brązu/Żelaza zatrzyma kolejkę tak samo jak pusty skarbiec.

### 47.2b. Pula Manpower (per miasto)

Rekrutacja jednostek **bojowych** (nie zwiadowcy — patrz niżej) zużywa **Manpower**: osobna pula per miasto, obok złota.

| Element | Wartość |
|---------|---------|
| **Pula maksymalna** | Skaluje się z ludnością miasta i epoką (`epoka-ludnosc-manpower.json`) |
| **Koszt 1 jednostki** | Pełny „slot" Manpower epoki (tabela per epokę w danych) |
| **Regeneracja** | **2% puli maksymalnej na turę** (od pustej do pełnej ≈ 50 tur) |
| **Blokada regeneracji** | Miasto **oblężone** — Manpower **nie** odnawia się w tej turze |
| **Zwiadowca** | Koszt Manpower = **0** — rekrutuj bez ograniczenia puli |
| **Bonus cywilizacji** | Rzymianie: **×2** pula i **×2** regeneracja (przykład z danych; inne typy mają własne mnożniki w `civs.json`) |

Pusta pula Manpower **blokuje** rekrutację tej jednostki, nawet gdy masz złoto w skarbcu — poczekaj na regenerację lub werbuj w innym mieście z pełniejszą pulą.

### 47.2c. Zwiadowca — szczególne zasady

**Zwiadowca** to jedyna jednostka bez kosztu Manpower — rekrutuj go swobodnie do zwiadu. W zamian **zwiadowca (i inne jednostki cywilne: osadnik, robotnik) nie mogą zdobywać miast** — gra blokuje taką próbę komunikatem „jednostka cywilna nie może zdobywać miast, użyj jednostki bojowej". Trzymaj przy zwiadowcy osobną jednostkę bojową, jeśli planujesz szturm.

### 47.3. Kolejka

Rekrutacja dzieli kolejkę z budynkami — jeden projekt na raz. Czas w turach pracy; rush za złoto jak przy budowie.

### 47.4. Oblężnicze

**Taran** i **wieża** — budowane **podczas oblężenia** (in-siege). **Katapulta** — w warsztacie oblężniczym w mieście, przed marszem na wróg.

### 47.5. Spichlerz i żywność

Rekrutacja **nie jest blokowana** brakiem zapasów (decyzja B5). Wojsko i tak zużywa żywność co turę — pusty magazyn = głód w polu (Część VIII §50), nie blokada przycisku rekrutacji.

**Wskazówka:** Zwiadowca na starcie, łucznik po tech, włócznik na konnicę wroga — sprawdź kontry w katalogu jednostek.


### Przykład liczbowy

Kolejka: Spichlerz **20** pracy, miasto daje **7**/t na budynki (70% z **10** pracy) → **3** tury budowy.
Rekrutacja włócznika **20** pracy w koszarach — ta sama pula co budynki (kolejka jedna).

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 48. Garnizon miasta

### 48.1. Jednostka na heksie miasta

Wojsko **stojące na polu miasta** broni go przy ataku. Nie zbiera plonów — tylko stoi. Licznik garnizonu w panelu (jeśli widoczny) pomaga ocenić obronę.

### 48.2. Mury

Z **murem** (budynek + tech Budownictwo) wróg musi prowadzić **oblężenie** — szturm, taran, wieża, katapulta. Bez muru — bitwa polowa lub szybkie zdobycie.

### 48.3. Porządek i bunt

Wojsko w mieście podnosi **prawo** → porządek. Za mało wojska przy długim niepokoju — bunt (Część VI §36). Po podboju zostaw co najmniej jedną jednostkę na kilka tur.

### 48.4. Powiązania

Oblężenie — Część XI. Ruch jednostek — Część IV. Posiłki w promieniu 1 heksa — Część IV §26.

### 48.5. Garnizon a produkcja

Jednostka w mieście nie blokuje kolejki — ale **rekrut zużywa ludność**, którą potrzebujesz do wzrostu. Balans: garnizon 1–2, reszta armii w polu.


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

## Szybka ścieżka dla nowego miasta

1. **Okolica** → profil Żywność lub ręcznie farma na łąkach.  
2. **Produkcja** → studnia lub targowisko, potem Spichlerz w imperium jeśli brak.  
3. **Plony** → sprawdź, czy bufor wzrostu rośnie.  
4. **Produkcja** → koszary + pierwsza jednostka przed ekspansją terytorium.  
5. **Miasto** (Część VI) → suwaki i auto-zarządca dopiero gdy plony są stabilne.


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

*Poradnik‑L · Część VII · rev. G · 2026-07-24 (§47.2a: rekrutacja jednostek Brązu/Żelaza naprawdę odejmuje Surowiec z magazynu państwa, blokada przy niedoborze, parytet AI — JEDNOSTKI-SUROWIEC-01) · pierwotnie rev. F 2026-07-23 (rekrutacja: pula Manpower zamiast ludności, zwiadowca bez kosztu/bez zdobywania miast, koszty materiałowe budynków), rev. E 2026-07-03 · dane: `buildings.json`, `units.json`, `terrain-improvements.json`, `manpower.ts`, `main.ts`*
