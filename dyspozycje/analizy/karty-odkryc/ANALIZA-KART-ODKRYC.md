# Analiza kart odkryć — TOP 5 korzyści i „Co możesz teraz zrobić”

TEMAT: R-WEB-TECH-CARDS-TOP3-BENEFITS-ANALYSIS-Q1 · Rola: Operator · Runda 1/5 · Baza: `origin/main` 57b916eb7 · Data: 2026-11-08
Aktualizacja: Obrona r1 (zarzuty Evaluatora Z1–Z5) — reguły R-K1 i E1 (§1.3), ziarnistość (§4 pkt 9), nowy kandydat Koło e (wódz-Rydwan), poprawione zdania CMZ Wojskowości i Brązownictwa, CSV z końcami linii LF, Q7 zawężone. Odpowiedzi: `runs/R-WEB-TECH-CARDS-TOP3-BENEFITS-ANALYSIS-Q1/02-obrona-r1.md`.
Zakres: 32/32 odkrycia z `gra/data/tech.json` (pole `technologie`). Bez zmian w kodzie i danych gry — dokument + tabela do akceptacji właściciela.

Pliki wynikowe:

- ten dokument — metodologia, pomiar, problemy, reguły, wyniki, propozycja układu, pytania ABC, plan etapów;
- `odkrycia-top5.csv` (UTF-8 z BOM, separator `;`) — 32 wiersze, kolumny wg dispatchu + dodatków 1–2;
- `turnieje/<odkrycie>.md` (32 pliki) + `turnieje/README.md` — kandydaci, oceny, wszystkie pojedynki, ranking, wybór korzyści do „Co możesz teraz zrobić”.

ZAŁOŻENIE (nazwa pliku): dispatch (b) podaje `odkrycia-top3.csv`, a dodatek 2 pkt 1 każe wszędzie czytać „Top 5”, dlatego plik nazywa się `odkrycia-top5.csv`. Plik `.xlsx` nie powstał, bo w środowisku nie ma `openpyxl` (`ModuleNotFoundError`), a dispatch wymaga go tylko „jeśli dostępne”.

---

## 1. Metodologia

### 1.1 Źródła (kolejność zaufania)

1. Kod gry, który faktycznie zużywa wartość (`gra/src/game/*.ts`, `gra/src/map/*.ts`, `gra/src/main.ts`), czyli plik i linia z formułą albo bramką.
2. Dane, które ten kod czyta: `gra/data/*.json` (econ-params, miasto-params, society-params, buildings, units, terrain-improvements, wonders, tech).
3. Pola opisowe (`uwagi`, `opis`, `Odblokowuje surowiec.`) traktuję tylko jako wskazówkę. Liczba z samego opisu bez konsumenta w kodzie nie trafia do TOP 5.

Wszystkie liczby podaję dla poziomu trudności **normal**. Różnice dla poziomu easy i hard są wymienione tylko tam, gdzie dane je mają, np. Mennica: 1,62 / 1,50 / 1,38.

### 1.2 Kryteria turnieju (stałe dla 32 odkryć)

| Kryterium | Waga | 0–5: jak oceniam |
|---|---|---|
| SKALA | 3 | 0 = brak lub efekt martwy; 1 = +1 pkt lokalnie; 2 = +2–3 lokalnie; 3 = ~+5 lokalnie lub +10%; 4 = +20–50%, nowy tier jednostek, limit ludności; 5 = mnożnik dla całego państwa, +200% obrony, odblokowanie całej kategorii (handel, rekrutacja epoki) |
| NOWA MECHANIKA | 3 | 5 = zdolność, której wcześniej w ogóle nie było (trasy handlowe, zaokrętowanie, rekrutacja epoki); 3 = nowy typ obiektu; 1 = więcej tego samego |
| BRAK ZASTĘPNIKA | 2 | 5 = jedyne źródło; 3 = częściowe alternatywy; 1 = wiele alternatyw |
| ZASIĘG | 2 | 5 = całe państwo; 3 = wiele miast lub pól; 2 = jedno miasto; 1 = jedno pole lub jednostka, albo tylko 1–2 cywilizacje |
| ODCZUWALNOŚĆ | 2 | 5 = od razu (1–3 tury); 3 = po jednej budowie (~5–10 tur); 1 = po łańcuchu warunków (inna technologia, budynek, surowiec) |
| CZYTELNOŚĆ | 1 | 5 = jedna liczba; 3 = krótka fraza; 1 = mechanika trudna do streszczenia |

Maksymalnie 65 pkt. Wagi faworyzują realną konsekwencję w grze (SKALA, NOWA MECHANIKA) przed wygodą opisu (CZYTELNOŚĆ), zgodnie z poleceniem właściciela: „najważniejszy element (…) z ogromną korzyścią”.

### 1.3 Zasady turnieju

- **Faza kandydatów:** wszystkie realne efekty odkrycia: budynki (`buildings.json techUnlock`), jednostki (`units.json Tech`), ulepszenia (`terrain-improvements.json tech`, czyli źródło prawdy bramki, `improvement-tech.ts:3`), cuda (`wonders.json techUnlock`), bramki mechanik w kodzie, awans epoki i drogi badań (`Wymaga (prereq)`). Jeden budynek może dać kilku kandydatów (np. Mennica: mnożnik i osobno płaski +3).
- **Pojedynki:** każdy z każdym. Wygrywa wyższa suma ważona. Przy remisie decyduje kolejno SKALA, ZASIĘG, NOWA MECHANIKA, a na końcu kolejność na liście. Każdy pojedynek ma jednozdaniowe uzasadnienie z kryterium o największej ważonej przewadze.
- **Ranking:** liczba wygranych, potem suma ważona. Top1 to GŁÓWNA KORZYŚĆ, Top2–Top5 to kolejne miejsca. Gdy realnych efektów jest mniej niż 5, pozostałe miejsca mają jawne `NIE_USTALONO` z dowodem kompletności (sekcja 1 każdego pliku turnieju).
- **Liczby (po Obronie r1):** 157 kandydatów, 374 pojedynki, 19/32 odkryć ma ≥ 5 realnych efektów. Każdy przywołany `plik:linia` generator sprawdził pod kątem istnienia linii (`check_ev`).
- **Reguła R-K1 (Obrona r1, zarzut Z3) — ocena „drogi badań”.** Kandydat typu „Otwiera X” (`T:next`) sam niczego nie odblokowuje: mechanikę X ocenia karta odkrycia X (bez podwójnego liczenia), więc NOWA MECHANIKA = 0. Korzyść przychodzi dopiero po kolejnym pełnym badaniu, a skala z §1.2 mówi wprost „ODCZUWALNOŚĆ 1 = po łańcuchu warunków (inna technologia…)”, więc ODCZUWALNOŚĆ = min(O, 1). Reguła działa jednakowo dla wszystkich 32 odkryć (w Operatorze r1 drogi badań miały N = 2–3 i O = 1–3 wbrew własnej skali). Pliki turniejów oznaczają takich kandydatów dopiskiem „reguła R-K1”.
- **Reguła E1 (Obrona r1, zarzut Z3) — dopuszczenie do Top1.** GŁÓWNA KORZYŚĆ to to, co odkrycie daje **każdemu** graczowi bez kolejnego badania i bez wyścigu z innymi państwami. Do Top1 nie wchodzi: droga badań, cud (wszystkie cuda mają `maxNaSwiecie=1`, `wonders.json`: albo wyścig 15 cywilizacji — Wyrocznia, Kamień Ha'amonga, Brama wszystkich narodów — albo cud narodowy jednej cywilizacji), obiekt tylko dla części cywilizacji (jednostki narodowe, Tarasy, Lamy) i efekt martwy (SKALA 0). Top1 = najwyżej w rankingu turnieju spośród spełniających E1; Top2–Top5 zostają w kolejności turnieju. Tę samą kolejność stosuje sekcja „Co możesz teraz zrobić” (najpierw czynności spełniające E1). Gdy żaden kandydat nie spełnia E1 (Matematyka, Obróbka żelaza), Top1 zostaje wynikiem turnieju z zastrzeżeniem w Uwagach i w Q7.

### 1.4 Metoda „Co możesz teraz zrobić” (CZYNNOŚĆ → KORZYŚĆ)

Dla każdego obiektu, którym gracz może coś zrobić (budynek, ulepszenie, jednostka, cud, mechanika, następne badanie), robię mini-turniej. Kandydatami są korzyści tego obiektu z fazy kandydatów, a wygrywa najwyższa suma ważona. Wybrana korzyść wchodzi do zdania „[CZYNNOŚĆ], aby [KORZYŚĆ].”. Na kartę trafiają maksymalnie 4 zdania w kolejności siły korzyści. Kandydat, który jest warunkiem lub efektem martwym (np. „Targowisko jest warunkiem Mennicy”), nie może być celem „aby…”.

### 1.5 Pewność

- **WYSOKA:** wartość i jej konsument w kodzie są potwierdzone `plik:linia`.
- **SREDNIA:** wartość jest pewna, ale warunek dostępności nie został w pełni zweryfikowany w kodzie. Dotyczy to Fortu (ulepszenie ma `epoka=3`, bramki epoki dla ulepszeń nie znaleziono) i Cegielni (epokaWejscia=2 przy technologii z epoki Kamienia).
- **NIE_USTALONO:** brak realnego efektu albo efekt dziś nieosiągalny (Astronomia).

---

## 2. Pomiar obecnego stanu (plik:linia)

### 2.1 Skąd karta odkrycia bierze treść

- Okno odkrycia (`gra/src/ui/techDiscoveryNotice.ts:506` `showTechDiscoveryNotice`) korzysta ze ścieżki entityCards (`:522-525`). Treść buduje `gra/src/ui/entityCards/technologyAdapter.ts`, a renderuje ją `gra/src/ui/entityCards/renderer.ts::renderEntityCard`. Ten sam adapter obsługuje kartę w Cywilopedii (rejestr `registry.ts`).
- Stara ścieżka zapasowa `techDiscoveryNotice.ts:200-225` ma **identyczne** szablony „Co możesz teraz zrobić” (`:213, :216, :219, :222, :225`).
- Pola `tech.json` czytane przez adapter: `Technologia`, `Epoka`, `Poziom`, `Koszt nauki`, `Dostęp do surowca.` (Charakterystyka), `Wymaga (prereq)` (Wymagania i Kolejne technologie), `Odblokowuje surowiec.`, `Odblokowuje ulepszenie terenu`, `Historia`. Budynki i jednostki adapter bierze **nie** z `tech.json`, tylko z `buildings.json techUnlock` i `units.json Tech` (`technologyAdapter.ts:135-136`).
- **Dziś karta odkrycia nie ma żadnego bloku TOP / „kluczowe korzyści”.** Nie istnieje mechanizm wyboru „trzech kluczowych bonusów” dla odkryć: grep `top3|Top3` w `technologyAdapter.ts` nie daje trafień. Korzyści gracz musi sam wyczytać z list nazw i z sekcji „Zmiany ekonomiczne”.

### 2.2 Dzisiejsza kolejność sekcji karty odkrycia

`technologyAdapter.ts:377-378` (tablica `sections`) i `renderer.ts:461` (`HISTORIA_SECTION_INDEX = 2`) z `:484-493` (wstawienie Rysu przed sekcją o indeksie 2):

1. Wymagania (pigułki) → 2. Charakterystyka (koszt nauki, epoka, poziom, surowiec-wymóg) → **3. Rys historyczny** → 4. Co możesz teraz zrobić → 5. Budynki → 6. Jednostki → 7. Ulepszenia terenu → 8. Kolejne technologie → 9. Zmiany ekonomiczne → 10. Informacja (gdy brak odblokowań).

### 2.3 „Zmiany ekonomiczne” wprowadzają w błąd (`technologyAdapter.ts:80-93`, `:290-311`)

`buildingEffectText` pokazuje pole **`przyrost`** (przyrost na poziom), a do `baza` sięga tylko wtedy, gdy `przyrost` jest pusty. Klucze są surowe, bez polskich znaków. Skutki:

- Mennica: gracz widzi „pieniadz +2” (przyrost). Baza to +3, a **mnożnik ×1,5 nie pojawia się nigdzie**.
- Targowisko: „pieniadz +3” zamiast bazy +5. Koszary: „praca +1”, bez +20% parametrów i bez informacji, że bez Koszar nie ma rekrutacji wojska Brązu i Żelaza. Kuźnia brązu: „praca +3”, bez +15% Pancerza.
- Palisada, Mury, Cytadela, Baszta mają baza=przyrost=0, więc **wiersz efektu nie powstaje wcale**, a +100/+200/+100/+100% Obrony jest niewidoczne.

### 2.4 TOP3 w budynkach i jednostkach (wzór formatu, nie treści)

- Budynki: `buildingAdapter.ts:99-121` (`top3Of` czyta pole `top3` = `[{tytul, tekst}]`) oraz `:234-236` (sekcja `Top 3`, `layout: 'top3'`, wstawiana zaraz po Opisie, czyli po Rysie historycznym). Renderer: `renderer.ts:225-251` (`buildTop3RowEl`, numer liczony z indeksu, więc **działa dla dowolnej liczby pozycji, także 5**).
- Stan danych: **43/43 budynków ma `top3`** (komentarz `buildingAdapter.ts:234` „dziś: 0/42” jest nieaktualny), łącznie 129 pozycji. Z tego **47 (36%)** to powtórzenie wymagań lub łańcucha, czyli „masło maślane”. Pomiar: tytuły pasujące do `^(Otwiera|Wymaga|Brama|Krok|Rozbudowa|Pierwszy|Niski koszt|Dostępn|Powstaje|Upgrade)`, np. Mennica: „Wymaga złota i Targowiska”, „Otwiera Walutę”. **TOP3 Mennicy nie wspomina o mnożniku** („Wzrost dochodu: +3 pieniądza…”). Wniosek: format do powtórzenia, treść do przeanalizowania w etapie „budynki”.
- Jednostki: `unitAdapter.ts:83-101`, `:157-159`, pole `Top3` — 75/75. Ulepszenia terenu: 0/22 (brak pola i sekcji).

### 2.5 Szablony „Co możesz teraz zrobić” — pełna lista (5 szablonów, 95 wystąpień na 32 kartach)

| # | Szablon (dosłownie) | Źródło | Na ilu kartach | Ocena |
|---|---|---|---|---|
| T1 | „Sprawdź dostęp do surowca: {surowce}.” | `technologyAdapter.ts:147`; `techDiscoveryNotice.ts:213` | 7 | **Masło maślane i błąd**: pole `Odblokowuje surowiec.` jest tylko opisowe (żaden kod w `gra/src/game` go nie czyta; grep), a wartości są surowymi kluczami („cegła, glina, sol”, „kamien, ruda”, „krowa/byk, owce, bydlo, lama”). Nie mówi, po co. |
| T2 | „Zbuduj {budynki}, jeśli spełniasz ich wymagania.” | `:154`; `:216` | 23 | **Masło maślane**: powtarza warunek zamiast korzyści. Etykieta „Najpierw spełnij” sugeruje wymagania nawet tam, gdzie ich nie ma (Koszary: `buildings.json:1047` wymagania=""). Błędna odmiana („Zbuduj Mennica”, „Zbuduj Kuźnia brązu lub Odlewnia brązu”). |
| T3 | „Przygotuj {ulepszenia} na odpowiednim złożu.” | `:160`; `:219` | 12 | **Masło maślane i błąd merytoryczny**: Fort, Droga, Farma, Trzoda, Irygacja nie wymagają złoża. Nie mówi, co ulepszenie daje. |
| T4 | „Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.” | `:166`; `:222` | 24 | **Masło maślane**: ogólnik bez nazwy celu i korzyści. |
| T5 | „Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.” | `:173`; `:225` | 29 | Zastrzeżenie, nie czynność. Zajmuje miejsce na każdej karcie, nie daje wartości (propozycja: usunąć albo przenieść do podpowiedzi — pytanie ABC Q3). |

Wszystkie 5 szablonów nie podaje korzyści. 4 z 5 (T1–T4) to masło maślane według definicji właściciela, a T5 to zastrzeżenie bez wartości. Liczby wystąpień policzył generator, odtwarzając logikę adaptera 1:1 (`gen.py::current_card`).

---

## 3. Problemy znalezione (najważniejsze)

1. **Mennica (Waluta).** Realny współczynnik to **×1,5 (normal)**, ×1,62 (easy), ×1,38 (hard), `gra/data/econ-params.json:585-591`. Liczony jest w `gra/src/game/economy.ts:952-955` (`handelNetto = handelNettoRaw × mennicaMnoznikPoWalucie`) na podatku miejskim (handel netto) **przed** podziałem suwakami na Naukę, Pieniądz i Luksus (`economy.ts:962-967`). Mnoży więc dochód pieniężny i naukę z podatku w **każdym mieście państwa**: wystarczy jedna Mennica w stolicy (`economy.ts:644-653`). Warunki: Waluta + Mennica (tylko stolica, `buildings.json:901`) + Targowisko w stolicy (`building-resource-gate.ts:119`) + dostęp do Złota (`:75-76`). Mennica zużywa 1 Złota na turę (`zloto-access.ts:31`, `turn-economy.ts:1879-1894`). Mnożnik nie obejmuje dochodu z tras handlowych (`econ-params.json:590`, pole `opis`). Na karcie gracz widzi tylko „Mennica: pieniadz +2”. Uwaga dodatkowa: `civ-matrix.json meta_mnoznik_waluta` (`culture-religion.ts::cityTradeMultiplier`, `economy.ts::mnoznikHandelPieniadzForCivByDifficulty`) nie ma w runtime ani jednego wywołania (grep), więc jest martwy i nie może trafić do TOP.
2. **Wymiana** jest bramką **całego** handlu szlakowego (`trade-routes.ts:1086-1093` `TRADE_TECH = 'Wymiana'`). Karta o tym milczy.
3. **Żegluga** odblokowuje zaokrętowanie wojsk lądowych (`embarkation.ts:25`). Karta o tym milczy.
4. **Wojskowość / Koszary**: bez Koszar w mieście nie ma rekrutacji **żadnej** jednostki epoki Brązu i Żelaza (`production.ts:1071-1076`). W praktyce jednostki z Brązownictwa, Jeździectwa, Żeglugi i Hutnictwa żelaza czekają więc na Wojskowość. Karta mówi „Zbuduj Koszary, jeśli spełniasz ich wymagania” i „Koszary: praca +1”.
5. **Rozjazd źródeł ulepszeń:** karta czyta `tech.json Odblokowuje ulepszenie terenu`, a bramka gry czyta `terrain-improvements.json tech` (`improvement-tech.ts:3,106,139-149`). Na kartach brakuje Kopalni miedzi i Kopalni cyny (Brązownictwo), Kopalni żelaza (Hutnictwo żelaza) oraz Stadniny (Jeździectwo).
6. **Efekty martwe pokazywane jako odblokowania:** Astronomia (Biblioteka poz. 6, przy `maksPoziom` = 2 — `buildings.json:750,797`), Teatr (`suppressed: true`, `buildings.json:1728`), Lazaret (brak w `buildings.json`), Wielka odlewnia i Wielka Kuźnia (`epokaWejscia` = 4, a `production.ts:966` blokuje budynki z wyższej epoki).
7. **Awans epoki** (Brązownictwo, Hutnictwo żelaza: `tech.json:178,347`) nie jest pokazany, choć daje +1 wodza (`generals.ts:2-4`), nowe budynki (`production.ts:966`) i wyższe poziomy budynków (`production.ts:252-262`).
8. **Cuda** (`wonders.json techUnlock`) nie są pokazywane na kartach odkryć. Trzy z nich są dostępne dla wszystkich: Wyrocznia (Mistycyzm), Kamień Ha'amonga (Żegluga) i Brama wszystkich narodów (Inżynieria + Wojskowość).

---

## 4. Reguły redakcyjne (dla TOP 5 i „Co możesz teraz zrobić”)

1. Jedna pozycja to jedna korzyść, ≤ 70 znaków, liczba lub współczynnik zawsze, gdy istnieje w danych.
2. Format pozycji: „Obiekt: efekt liczbowo” (np. „Mennica: ×1,5 podatku (handlu) w każdym mieście”).
3. Zasięg ma być widoczny w tekście: „w mieście” albo „w całym państwie / w każdym mieście”.
4. Zakaz ogólników („poprawia gospodarkę”), zakaz samych warunków jako korzyści i zakaz powtarzania wymagań.
5. Nazwy dokładnie z danych (buildings.json `nazwa`, units.json `Jednostka`, terrain-improvements.json `nazwa`), w poprawnej odmianie.
6. Wartości dla poziomu normal. Gdy trudność zmienia wartość, karta może dodać dopisek (np. „×1,62 na łatwym”).
7. „Co możesz teraz zrobić”: „[CZYNNOŚĆ — tryb rozkazujący, poprawna odmiana], aby [KORZYŚĆ z liczbą]”. Warunki (stolica, Targowisko, złoże) idą w nawiasie przy czynności, a nie zamiast korzyści.
8. Efekt martwy lub nieosiągalny: piszemy to wprost („dziś niedostępne”), bez wymyślania efektu.
9. **Ziarnistość TOP 5 = efekt, nie obiekt** (Obrona r1, zarzut Z2). Jeden budynek może zająć kilka miejsc, jeśli daje różne mechaniki (np. Sąd: −30% korupcji oraz osobno +19 pkt Prawa), bo dispatch każe wypisać „pełną listę efektów”, a `NIE_USTALONO` dopuszcza tylko „przy < 5 realnych efektach z dowodem”. Płaskie przyrosty tego samego obiektu (pieniądz, Kultura, Praca, zadowolenie) łączymy w jedną pozycję — tak jest już we wszystkich 32 turniejach (np. „Sąd: +5 Kultury, +2 pieniądza, +2 zadowolenia”). Wpisanie `NIE_USTALONO`, gdy istnieje kolejny realny efekt z dowodem, byłoby sprzeczne z dispatchem. Format prezentacji (grupowanie po obiekcie na samej karcie) pozostaje wyborem właściciela w Q1.

---

## 5. Wyniki — TOP 5 (32/32)

Pełne drabinki znajdują się w `turnieje/<odkrycie>.md`, a dowody `plik:linia` per Top1–Top5 w kolumnie `Dowod_plik_linia` pliku CSV.

| Odkrycie | Top1 — GŁÓWNA KORZYŚĆ | Top2 | Top3 | Top4 | Top5 |
|---|---|---|---|---|---|
| Obróbka drewna | Tartak: +50 drewna na turę do magazynu państwa | Palisada: +100% Obrony obrońców miasta | Każda Stolarnia: +10% drewna w całym państwie | Taran: pierwsza machina oblężnicza (2800 HP) | Posterunek (z Murarstwem): +50% Obrony, strefa 3 pól |
| Garncarstwo | Spichlerz: limit ludności miasta 5 → 8 | Glinianka: +50 gliny na turę do magazynu państwa | Garncarnia: wytwarza ceramikę (glina + drewno) | Cegielnia: cegła (2 glina + 1 drewno → 2 cegły) | Warzelnia soli: +50 soli na turę |
| Murarstwo | Kamieniołom: +50 kamienia na turę do magazynu | Każdy Warsztat kamieniarski: +10% kamienia w państwie | Cuda narodowe: Piramidy (Egipt) i inne | Posterunek (z Obróbką drewna): strefa 3 pól, +50% Obrony | Warsztat kamieniarski: +4 Pracy (+2 na poziom) |
| Rolnictwo | Farma: +3 żywności, +3 Pracy, +3 handlu na polu | Tarasy (Chiny, Inkowie): +3 żywności na wzgórzu | Warunek Wymiany — klucza do tras handlowych | Otwiera Gospodarkę wodną (Irygacja +5 żywności) | NIE_USTALONO |
| Łowiectwo | Obóz łowiecki: +1 żywności, +1 pieniądza, +2 handlu | Otwiera Łucznictwo (Łucznik) | NIE_USTALONO | NIE_USTALONO | NIE_USTALONO |
| Łucznictwo | Łucznik: zasięg 3 pola, Obrona 6 (Oszczepnik: 2 i 4) | Łucznicy narodowi Egiptu i Sumeru: 40 HP zamiast 20 | Łucznicy Brązu (nubijski, akadyjski, asyryjski) — z Koszarami | NIE_USTALONO | NIE_USTALONO |
| Oswojenie zwierząt | Trzoda: +2 żywności, +4 Pracy, +3 handlu, bez złoża | Lama (Inkowie): +3 Pracy także w górach i lesie | Owce: +1 żywności, +2 Pracy, +2 handlu na wzgórzu | Warunek Wymiany — klucza do tras handlowych | Otwiera Koło (Drogi, Rydwan) |
| Mistycyzm | Kamienne kręgi: szerzą religię +2% na turę | Cud Wyrocznia: +3 Kultury, +3 Zaufania, +2 Wpływu | Kamienne kręgi: +1 Kultury i +1 zadowolenia (na poziom) | Otwiera Religię (Świątynia) | NIE_USTALONO |
| Wymiana | Otwiera handel: bez Wymiany żadnych tras handlowych | Targowisko: +50% dochodu z tras handlowych miasta | Targowisko: +1 trasa handlowa i premia 5% trasy | Cud narodowy: Pałac Weiyang (Chiny, z Murarstwem) | Targowisko: +5 pieniądza (+3 na poziom, maks. 3) |
| Gospodarka wodna | Irygacja: +5 żywności, +2 Pracy, +2 handlu przy rzece | Studnia: +2 zdrowia i koniec kary −2 za brak wody | Studnia w państwie jest warunkiem badania Medycyny | Studnia jest warunkiem Akweduktu (limit 20) i Łaźni | Studnia: +1 zadowolenia (+1 na poziom) |
| Koło | Droga: ruch po niej 3× szybszy | Rydwan (woły): Atak 12, 400 HP, bez Koszar | Wódz epoki Kamienia to Rydwan (woły): 400 HP zamiast 60 | Droga: +2 handlu na polu | Z Brązownictwem otwiera Jeździectwo (Konnica) |
| Brązownictwo | Awans do epoki Brązu: nowe budynki i wyższe ich poziomy | Odlewnia brązu: wytwarza brąz (ruda + drewno + cyna) | Limit wodzów rośnie z 1 do 2 | Kopalnia miedzi: +20 rudy na turę, +5 handlu | Kuźnia brązu: +15% Pancerza jednostek w mieście |
| Żegluga | Wojsko lądowe może wchodzić na wodę (zaokrętowanie) | Łodzie rybackie: +2 żywności, +3 Pracy, +3 handlu | Cud Kamień Ha'amonga: +15% dochodu z tras morskich | Port: +1 trasa handlowa miasta | Galera: okręt wojenny (miasto nad wodą + Koszary) |
| Pismo | Biblioteka: +30% Nauki miasta | Spichlerz Królewski: limit ludności 8 → 12 | Biblioteka: +3 Nauki i +2 Kultury (rośnie z poziomem) | Cuda narodowe: Wiszące ogrody, Wielka stela | Otwiera Matematykę, Kodeks, Handel, Filozofię |
| Religia | Świątynia: szerzy religię +4% na turę | Cud narodowy: Stupa w Sanchi (Harappa) | Otwiera Kodeks, Filozofię, Astronomię | Świątynia: +2 Kultury i +2 zadowolenia | NIE_USTALONO |
| Jeździectwo | Stadnina: +25 koni/turę — koszt 1 jednostki konnej | Konnica: Atak 12, 320 HP, ruch 4 (koszt: brąz i 25 koni) | Rydwan konny: 360 HP, ruch 4 | Rydwany i jeźdźcy narodowi (6 cywilizacji) | NIE_USTALONO |
| Wojskowość | Koszary: rekrutacja wojska epoki Brązu i Żelaza | Koszary: +20% parametrów bojowych jednostek | Fort: +100% Obrony obozujących i strefa 5 pól | Cuda: Terakotowa armia, Yerkapı, Brama narodów | Otwiera Oblężnictwo (Katapulta) |
| Matematyka | Cuda narodowe: Ziggurat (+15% Nauki), Mundo Perdido | Otwiera Budownictwo, Walutę, Astronomię, Oblężnictwo | NIE_USTALONO | NIE_USTALONO | NIE_USTALONO |
| Handel | Magazyn: +20% pojemności magazynu państwa | Emporion: +1 trasa handlowa i premia 5% trasy | Z Matematyką otwiera Walutę (Mennica) | Emporion: +8 pieniądza (+4 na poziom) | Magazyn: +1 Pracy i +1 pieniądza |
| Kodeks | Trybunał: +17 pkt Prawa w każdym mieście | Dwór Zarządcy: 33 pkt Prawa w mieście regionalnym | Z Filozofią otwiera Prawo (Sąd, Pretorium) | Dwór Zarządcy: +2 pieniądza, +3 Kultury, +1 Pracy | Trybunał: +1 pieniądza i +1 zadowolenia |
| Budownictwo | Akwedukt: limit ludności miasta do 20 | Mury: +200% Obrony obrońców miasta | Cud narodowy: Dur-Sharrukin (Asyria) | Mury są warunkiem Cytadeli i Baszty | Otwiera Inżynierię i Drogi brukowane |
| Waluta | Mennica: ×1,5 podatku (handlu) w każdym mieście | Kopalnia złota: +10 handlu i +1 złota na turę | Złoto jest warunkiem Mennicy (zużywa 1 złota/turę) | Złoto w dyplomacji: 50 PN za sztukę | Mennica: +3 pieniądza (+2 na poziom) |
| Astronomia | Obserwatorium (Biblioteka poz. 6) — dziś niedostępne | NIE_USTALONO | NIE_USTALONO | NIE_USTALONO | NIE_USTALONO |
| Hutnictwo żelaza | Awans do epoki Żelaza: nowe budynki i wyższe ich poziomy | Odlewnia żelaza: żelazo i brąz, +12 Pracy | Limit wodzów rośnie z 2 do 3 | Kopalnia żelaza: +20 rudy żelaza na turę | 19 narodowych jednostek z żelaza, np. Falanga (Obrona 10) |
| Inżynieria | Cytadela: +100% Obrony ponad Mury (razem +300%) | Cud Brama narodów: +15% dochodu z tras, +10 Wpływu | Baszta: kolejne +100% Obrony (komplet +400%) | Port wielki: +10 pieniądza i +1 trasa handlowa | Z Budownictwem otwiera Drogi brukowane |
| Oblężnictwo | Warsztat oblężniczy: +10% parametrów jednostek | Katapulta: ostrzał z 6 pól, 1000 HP | Z Obróbką żelaza otwiera Sztukę wojenną | Warsztat oblężniczy: +4 Pracy, +2 pieniądza | NIE_USTALONO |
| Filozofia | Akademia: +20% Nauki (z Biblioteką razem +50%) | Akademia: +6 Nauki, +5 Kultury, +3 zadowolenia | Otwiera Prawo i Medycynę | NIE_USTALONO | NIE_USTALONO |
| Prawo | Sąd: −30% korupcji w mieście | Pretorium: −30% korupcji i 38 pkt Prawa w regionie | Sąd: +19 pkt Prawa | Sąd: +5 Kultury, +2 pieniądza, +2 zadowolenia | Pretorium: +3 pieniądza, +5 Kultury, +2 Pracy |
| Drogi brukowane | Droga brukowana: ruch 5× szybszy (Droga: 3×) | Droga brukowana: +3 handlu na polu (Droga: +2) | Z Hutnictwem otwiera Obróbkę żelaza | NIE_USTALONO | NIE_USTALONO |
| Medycyna | Łaźnia publiczna: +5 zdrowia miasta | Łaźnia: +3 Kultury, +3 zadowolenia, +1 żywności | NIE_USTALONO | NIE_USTALONO | NIE_USTALONO |
| Obróbka żelaza | Cud narodowy: Posąg Peruna (Słowianie) | Z Oblężnictwem otwiera Sztukę wojenną | Jednostki Celtów i Germanów, np. Berserker Atak 10 | Wielka odlewnia (stal) — dziś niedostępna (epoka 4) | Wielka Kuźnia (Pancerz) — dziś niedostępna (epoka 4) |
| Sztuka wojenna | Akademia wojskowa: +20% parametrów (z Koszarami +40%) | Akademia wojskowa: +3 Pracy, +2 pieniądza | NIE_USTALONO | NIE_USTALONO | NIE_USTALONO |

## 6. „Co możesz teraz zrobić” — propozycja (32/32, CZYNNOŚĆ → KORZYŚĆ)

Dzisiejsze wiersze (cytaty) dla każdego odkrycia są w kolumnie `Co_mozesz_zrobic_OBECNIE` pliku CSV. Wybór korzyści „aby…” opisuje sekcja 5 każdego pliku turnieju.

| Odkrycie | „Co możesz teraz zrobić" — PROPOZYCJA (CZYNNOŚĆ → KORZYŚĆ) |
|---|---|
| Obróbka drewna | Postaw Tartak na polu lasu, aby zasilić magazyn państwa 50 drewna na turę (budowy i rekrutacja).<br>Zbuduj Palisadę drewnianą, aby podwoić obronę miasta (+100% Obrony obrońców).<br>Zbuduj Stolarnię, aby zwiększyć produkcję drewna całego państwa o 10%.<br>Zrekrutuj Taran, aby móc oblegać i burzyć umocnienia wroga. |
| Garncarstwo | Zbuduj Spichlerz (gdy masz ceramikę), aby podnieść limit ludności miasta z 5 do 8.<br>Postaw Gliniankę na złożu gliny, aby wydobywać 50 gliny na turę.<br>Zbuduj Garncarnię przy dostępie do gliny, aby wytwarzać ceramikę potrzebną Spichlerzowi.<br>Zaplanuj Cegielnię (dostępna od epoki Brązu), aby wytwarzać cegłę i otworzyć badanie Pisma. |
| Murarstwo | Postaw Kamieniołom na wzgórzu lub w górach, aby wydobywać 50 kamienia na turę (mury, świątynie).<br>Zbuduj Warsztat kamieniarski, aby zwiększyć wydobycie kamienia państwa o 10%.<br>Postaw Posterunek na skraju granic (wymaga też Murarstwa/Obróbki drewna), aby zabezpieczyć granicę strefą 3 pól.<br>Postaw Stelę / Pomnik, aby zyskać Kulturę bez kosztów utrzymania. |
| Rolnictwo | Postaw Farmę na łące lub równinie, aby zyskać +3 żywności, +3 Pracy i +3 handlu z pola.<br>Postaw Tarasy uprawne na wzgórzu (Chińczycy, Inkowie), aby uprawiać wzgórza (+3 żywności).<br>Wybierz kolejne badanie, aby dojść do Irygacji (+5 żywności przy rzece). |
| Łowiectwo | Postaw Obóz łowiecki w lesie z Tartakiem, aby zagospodarować las (+1 żywności, +1 pieniądza, +2 handlu).<br>Wybierz kolejne badanie, aby dojść do Łuczników. |
| Łucznictwo | Rekrutuj Łuczników, aby razić wroga z 3 pól (lepiej niż Oszczepnik). |
| Oswojenie zwierząt | Postaw Trzodę na łące lub równinie, aby zyskać +4 Pracy i +2 żywności z pola bez złoża.<br>Postaw Owce na wzgórzu, aby zagospodarować wzgórza (+2 Pracy).<br>Postaw Lamy w górach (Inkowie), aby zagospodarować góry (+3 Pracy).<br>Wybierz kolejne badanie, aby dojść do Dróg i Rydwanów. |
| Mistycyzm | Zbuduj Kamienne kręgi, aby szerzyć swoją religię o 2% na turę.<br>Wznieś cud Wyrocznia, aby zdobyć +3 Zaufania i +2 Wpływu u innych państw.<br>Wybierz kolejne badanie, aby dojść do Świątyni. |
| Wymiana | Wyznacz trasy handlowe między miastami, aby zyskać nowe źródło dochodu — bez Wymiany handel szlakowy jest zablokowany.<br>Zbuduj Targowisko, aby zwiększyć dochód z tras handlowych miasta o 50%.<br>Wybierz kolejne badanie, aby dojść do Pisma i Matematyki. |
| Gospodarka wodna | Postaw Irygację przy rzece, aby zyskać +5 żywności z pola przy rzece.<br>Zbuduj Studnię, aby dać miastu czystą wodę (+2 zdrowia, bez kary −2). |
| Koło | Połącz miasta Drogą, aby przyspieszyć ruch wojsk między miastami 3×.<br>Rekrutuj Rydwan (woły), aby wystawić silną jednostkę uderzeniową już w epoce Kamienia.<br>Rekrutuj Wodza w stolicy, aby mieć wodza na Rydwanie (woły) z 400 HP zamiast Wojownika z 60 HP.<br>Wybierz kolejne badanie, aby dojść do Konnicy. |
| Brązownictwo | Zbuduj Odlewnię brązu, aby wytwarzać brąz — bez niego i bez Koszar brak wojska epoki Brązu.<br>Postaw Kopalnię miedzi na złożu, aby wydobywać 20 rudy miedzi na turę (do brązu).<br>Zbuduj Kuźnię brązu, aby dać jednostkom +15% Pancerza.<br>Postaw Kopalnię cyny na złożu, aby wydobywać cynę do brązu. |
| Żegluga | Zaokrętuj wojsko lądowe, aby przerzucić armię przez morze lub rzekę bez budowy floty.<br>Postaw Łodzie rybackie na ławicy, aby wykorzystać morze (+2 żywności, +3 Pracy).<br>Zbuduj Port handlowy w mieście nad wodą, aby otworzyć miastu kolejną trasę handlową.<br>Zbuduj Galerę w mieście nad wodą, aby mieć własną flotę wojenną. |
| Pismo | Zbuduj Bibliotekę, aby zwiększyć Naukę miasta o 30%.<br>Rozbuduj Spichlerz do Spichlerza Królewskiego, aby podnieść limit ludności miasta z 8 do 12.<br>Wybierz kolejne badanie, aby dojść do Matematyki, Kodeksu i Filozofii. |
| Religia | Zbuduj Świątynię (obok Kamiennych kręgów), aby szerzyć swoją religię o 4% na turę.<br>Wybierz kolejne badanie, aby dojść do Kodeksu i Filozofii. |
| Jeździectwo | Postaw Stadninę na złożu koni, aby hodować 25 koni na turę — tyle kosztuje rekrutacja 1 jednostki konnej.<br>Rekrutuj Konnicę (w mieście z Koszarami), aby mieć najszybszą jednostkę uderzeniową (ruch 4). |
| Wojskowość | Zbuduj Koszary, aby rekrutować jednostki epoki Brązu i Żelaza (np. Włócznik; Konnica wraz z Jeździectwem).<br>Postaw Fort na granicy, aby lepiej bronić granic (+100% Obrony, strefa 5 pól).<br>Wybierz kolejne badanie, aby dojść do Katapult. |
| Matematyka | Wybierz kolejne badanie, aby dojść do Murów, Mennicy i Katapult. |
| Handel | Zbuduj Magazyn, aby zwiększyć pojemność magazynu państwa o 20%.<br>Zbuduj Emporion (obok Targowiska), aby otworzyć miastu kolejną trasę handlową.<br>Wybierz kolejne badanie, aby dojść do Mennicy. |
| Kodeks | Zbuduj Trybunał, aby dodać 17 pkt Prawa w dowolnym mieście.<br>Rozbuduj Dom Starszyzny do Dworu Zarządcy, aby utrzymać porządek w mieście regionalnym (33 pkt Prawa).<br>Wybierz kolejne badanie, aby dojść do Sądu (−30% korupcji). |
| Budownictwo | Zbuduj Akwedukt (obok Studni), aby podnieść limit ludności miasta do 20.<br>Zbuduj Mury, aby potroić obronę miasta (+200% Obrony).<br>Wybierz kolejne badanie, aby dojść do Cytadeli i Dróg brukowanych. |
| Waluta | Zbuduj Mennicę w stolicy (z Targowiskiem i dostępem do złota), aby pomnożyć podatek wszystkich miast ×1,5 (pieniądz i nauka).<br>Postaw Kopalnię złota na złożu, aby zdobyć złoto (+10 handlu) i uruchomić Mennicę. |
| Astronomia | NIE_USTALONO — odkrycie nie daje dziś żadnej czynności o realnej korzyści (patrz Uwagi) |
| Hutnictwo żelaza | Rozbuduj Odlewnię brązu do Odlewni żelaza, aby wytwarzać żelazo do najlepszego wojska.<br>Postaw Kopalnię żelaza na złożu, aby wydobywać 20 rudy żelaza na turę.<br>Rozbuduj Kuźnię brązu do Kuźni żelaza, aby podnieść Pancerz jednostek do +30%.<br>Rekrutuj jednostki z żelaza (w mieście z Koszarami), aby wystawić narodową piechotę epoki Żelaza (np. Falanga z Obroną 10). |
| Inżynieria | Zbuduj Cytadelę (obok Murów), aby podnieść obronę miasta do +300%.<br>Zbuduj Basztę (obok Murów), aby podnieść obronę miasta do +400%.<br>Rozbuduj Port handlowy do Portu wielkiego, aby podwoić dochód portu (+10 pieniądza).<br>Wznieś cud Brama wszystkich narodów (z Wojskowością), aby zwiększyć dochód z tras o 15% i zyskać 10 Wpływu. |
| Oblężnictwo | Zbuduj Warsztat oblężniczy (obok Koszar), aby wzmocnić jednostki o kolejne +10% (razem do +50%).<br>Rekrutuj Katapulty, aby burzyć mury z dystansu 6 pól.<br>Wybierz kolejne badanie, aby dojść do Akademii wojskowej. |
| Filozofia | Zbuduj Akademię (obok Biblioteki), aby zwiększyć Naukę miasta o kolejne 20%.<br>Wybierz kolejne badanie, aby dojść do Sądu i Łaźni. |
| Prawo | Zbuduj Sąd, aby obniżyć korupcję w mieście o 30%.<br>Rozbuduj Dwór Zarządcy do Pretorium, aby obniżyć korupcję miasta regionalnego o 30%. |
| Drogi brukowane | Przebuduj Drogi na Drogi brukowane, aby przyspieszyć ruch po drogach z 3× do 5×.<br>Wybierz kolejne badanie, aby dojść do Obróbki żelaza. |
| Medycyna | Zbuduj Łaźnię publiczną (obok Studni), aby podnieść zdrowie miasta o 5. |
| Obróbka żelaza | Wybierz kolejne badanie, aby dojść do Akademii wojskowej.<br>Rekrutuj jednostki narodowe, aby wystawić elitę Celtów i Germanów (np. Berserker z Atakiem 10). |
| Sztuka wojenna | Zbuduj Akademię wojskową (obok Koszar), aby wzmocnić jednostki o kolejne +20% (razem do +50%). |

---

## 7. Propozycja układu karty odkrycia (tylko opis — wdrożenie to osobny temat po akceptacji)

Docelowa kolejność (TOP 5 **zaraz po Rysie historycznym**, wzorem budynków):

1. Wymagania → 2. Charakterystyka → 3. **Rys historyczny** → 4. **TOP 5 korzyści** (nowa sekcja) → 5. **Co możesz teraz zrobić** (przepisane, CZYNNOŚĆ → KORZYŚĆ, maks. 4 zdania) → 6. Budynki → 7. Jednostki → 8. Ulepszenia terenu (ze źródła prawdy `terrain-improvements.json`) → 9. Cuda (nowa, opcjonalna) → 10. Kolejne technologie → 11. Zmiany ekonomiczne (baza zamiast przyrostu, polskie nazwy, efekty procentowe).

- **Blok TOP 5:** numerowane pozycje (istniejący `layout: 'top3'` + `buildTop3RowEl`, `renderer.ts:225-251`, który numeruje dowolną liczbę pozycji). Pozycja 1 wyróżniona jako „GŁÓWNA KORZYŚĆ”, z liczbą pogrubioną w tytule (np. **×1,5**). Pozycje 2–5 w tym samym formacie, ale bez wyróżnienia. Jeśli realnych efektów jest mniej niż 5, karta pokazuje tylko tyle, ile ich jest (patrz Q2).
- **Technicznie:** wstawienie sekcji `top5` na indeks 2 tablicy `sections` w `technologyAdapter.ts` sprawia, że renderer (`HISTORIA_SECTION_INDEX = 2`, `renderer.ts:461,486`) postawi Rys historyczny tuż przed nią. To daje dokładnie „zaraz po Rysie” bez zmian w rendererze.
- **Źródło treści:** nowe pole `Top5: [{tytul, tekst}]` w `tech.json` (wzorem `top3` w `buildings.json`). Nie generujemy go w locie, bo treść ma być zaakceptowana przez właściciela.

---

## 8. Pięć najgorszych dzisiejszych kart (cytaty tego, co dziś widzi gracz)

| # | Odkrycie | Co dziś widzi gracz (cytat) | Czego brakuje (realna GŁÓWNA KORZYŚĆ) |
|---|---|---|---|
| 1 | **Astronomia** | Tylko „Wymagania” i „Charakterystyka” (koszt 440), bez żadnej sekcji odblokowań (`technologyAdapter.ts:355-361`, `anyContent` = true przez same wymagania, więc nawet „Informacja” się nie pokazuje). | Odkrycie realnie nic nie daje: Obserwatorium = poziom 6 Biblioteki przy `maksPoziom` = 2 (`buildings.json:750,797`). Gracz płaci 440 nauki za nic i nie wie o tym. |
| 2 | **Waluta** | „Zbuduj Mennica, jeśli spełniasz ich wymagania.” · „Przygotuj Kopalnia złota na odpowiednim złożu.” · „Mennica: pieniadz +2” | Mnożnik **×1,5 podatku w każdym mieście** (`econ-params.json:585-591`, `economy.ts:952-955`), czyli największy pojedynczy bonus ekonomiczny w grze. Brak też warunków (stolica, Targowisko, Złoto). |
| 3 | **Wojskowość** | „Zbuduj Koszary, jeśli spełniasz ich wymagania.” · „Przygotuj Fort na odpowiednim złożu.” · „Koszary: praca +1” | Koszary to **jedyna droga do rekrutacji wojska epoki Brązu i Żelaza** (`production.ts:1071-1076`) oraz +20% parametrów jednostek. Fort nie wymaga złoża i daje +100% Obrony oraz strefę 5 pól. |
| 4 | **Wymiana** | „Zbuduj Targowisko (Rynek), jeśli spełniasz ich wymagania.” · „Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.” · „Targowisko (Rynek): pieniadz +3” | **Bez Wymiany nie istnieje żaden handel szlakowy** (`trade-routes.ts:1093`). Targowisko daje +50% dochodu z tras (`econ-params.json:278`). |
| 5 | **Brązownictwo** | „Zbuduj Kuźnia brązu lub Odlewnia brązu, jeśli spełniasz ich wymagania.” · lista 20 jednostek · „Kuźnia brązu: praca +3” · „Odlewnia brązu: praca +3” | **Awans do epoki Brązu** (nowe budynki, +1 wódz), brąz z Odlewni (bez niego brak wojska Brązu), Kopalnia miedzi (niepokazana), +15% Pancerza z Kuźni. Jednostki z listy wymagają jeszcze Koszar (Wojskowość). |

Kolejne w rankingu najgorszych: Żegluga (brak zaokrętowania), Matematyka (karta to wyłącznie „Wybierz dalszy kierunek badań…”), Obróbka żelaza (dwa budynki dziś niedostępne), Filozofia (Teatr niebudowalny).

---

## 9. Pytania ABC do właściciela (wybory produktowe; rekomendacja Operatora)

- **Q1. Format pozycji TOP 5.** A) tytuł z liczbą + jedno zdanie wyjaśnienia (jak `top3` budynków) — **rekomendacja**; B) sam tytuł z liczbą (krótsza karta); C) pełne zdanie bez tytułu.
- **Q2. Odkrycia z mniej niż 5 realnymi efektami (13/32 po Obronie r1; Koło ma teraz 5).** A) pokazać tylko realne pozycje (np. Medycyna: 2) — **rekomendacja**, uczciwe; B) dopełniać „drogami badań” do 5; C) zostawić puste miejsca z „—”.
- **Q3. Wiersz „Nie oznacza” (29 kart).** A) usunąć — **rekomendacja**; B) przenieść do podpowiedzi (tooltip); C) zostawić.
- **Q4. Efekty martwe (Astronomia, Teatr, Lazaret, Wielka odlewnia, Wielka Kuźnia).** A) karta uczciwie pisze „dziś niedostępne” i zakładamy osobny temat danych/balansu — **rekomendacja**; B) ukryć je z kart do czasu naprawy; C) naprawić dane w tym samym temacie wdrożeniowym (np. `maksPoziom` Biblioteki).
- **Q5. Ulepszenia terenu na karcie.** A) czytać z `terrain-improvements.json` (źródło prawdy bramki), co dopisze Kopalnie miedzi, cyny i żelaza oraz Stadninę — **rekomendacja**; B) poprawić `tech.json`, żeby się zgadzał.
- **Q6. Sekcja „Cuda” na karcie odkrycia.** A) tak, z oznaczeniem cudów narodowych i „wyścigowych” (maks. 1 na świecie) — **rekomendacja**; B) nie, cuda tylko w Cywilopedii.
- **Q7. Top1 bez korzyści od ręki — ZAWĘŻONE w Obronie r1.** Zarzut Z3 Evaluatora rozstrzygnięty regułami R-K1 i E1 (§1.3): Łowiectwo → Obóz łowiecki, Mistycyzm → Kamienne kręgi (religia +2%/turę), Religia → Świątynia (+4%/turę), Oblężnictwo → Warsztat oblężniczy (+10% parametrów), Inżynieria → Cytadela (+100% Obrony). Do właściciela zostają dwa odkrycia, w których **żaden** kandydat nie spełnia E1: Matematyka (cuda narodowe Ziggurat/Mundo Perdido albo droga do Budownictwa, Waluty, Astronomii, Oblężnictwa) i Obróbka żelaza (Posąg Peruna dla Słowian, jednostki Celtów i Germanów albo droga do Sztuki wojennej). A) Top1 = jawny opis „Brak korzyści od ręki — odkrycie otwiera drogę do …” — **rekomendacja**, uczciwe dla 13 z 15 cywilizacji; B) Top1 dopasowany do cywilizacji gracza (cud/jednostka narodowa, jeśli gracz ją ma; inaczej wariant A); C) zostawić wynik turnieju.

---

## 10. Plan następnych etapów (osobne tematy, ten sam schemat: TOP 5 po Rysie + CMZ „CZYNNOŚĆ → KORZYŚĆ” + turniej Operator/Evaluator/FC)

| Etap | Zakres (liczba pozycji w danych) | Punkt startowy | Szacunek |
|---|---|---|---|
| 2. Budynki | 43 w `buildings.json` (w tym Teatr `suppressed`, 6 bez technologii: Pałac I–III, Dom Starszyzny, Garnizon) | istniejące `top3` 43/43 → TOP 5; przegląd 47/129 pozycji typu „wymaga/otwiera”; Mennica bez mnożnika | ~43 turnieje × ~6–8 kandydatów |
| 3. Jednostki | 75 w `units.json` (w tym 9 super-jednostek z `Super-jednostka=TAK`) | istniejące `Top3` 75/75 → TOP 5 | ~75 turniejów; grupowanie po linii (`Rola (linia)`) |
| 4. Ulepszenia terenu | 22 w `terrain-improvements.json` | brak pola TOP i sekcji w `improvementAdapter.ts` | ~22 turnieje |
| 5. Cuda | 19 w `wonders.json` | sprawdzić `wonderAdapter.ts` | ~19 turniejów |
| 6. CIVPEDIA | aktualizacja `docs/encyklopedia/*` + `wikiBundle` po akceptacji etapów 1–5 | — | 1 temat dokumentacyjny |
| W1. Wdrożenie kart odkryć | `technologyAdapter.ts` (sekcja `top5` na indeksie 2, przepisane CMZ, baza zamiast przyrostu, ulepszenia z `terrain-improvements.json`) + pole `Top5` w `tech.json` + test | po akceptacji tej tabeli i odpowiedziach Q1–Q7 | 1 temat GAME (web) |

---

## 11. Ograniczenia i założenia

- Wartości dotyczą poziomu normal. Łańcuchy kumulacji (np. Koszary + Akademia wojskowa + Warsztat = +50%, `unit-building-bonuses.ts:23-33`) podaję tak, jak opisuje je kod; nie sprawdzałem ich w żywej grze.
- Fort (ulepszenie, `epoka=3`) i Cegielnia (`epokaWejscia=2` przy technologii z epoki Kamienia) mają pewność SREDNIA albo dopisek w Uwagach.
- `.xlsx` nie powstał (brak `openpyxl`). CSV ma separator `;` i BOM UTF-8, więc Excel otworzy go bezpośrednio.
- Generator: `narzedzia/gen.py` + `narzedzia/techdata.py` (dane turnieju: kandydaci, oceny, dowody). Odtworzenie: `python3 -I narzedzia/gen.py <repo>`; pliki pomocnicze `tables.md`/`stats.json` powstają obok skryptu.
