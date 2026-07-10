# DRZEWKO TECHNOLOGII — ANALIZA PORÓWNAWCZA vs CIVILIZATION VI

Data: 2026-07-10 · Zadanie: **wyłącznie analiza + propozycja**, zero zmian w `gra/data/tech.json` lub kodzie.
Zakres: **pierwsze 3 epoki** naszego drzewka — Kamień / Brąz / Żelazo ≈ Civ VI Ancient / Classical / Medieval.
Źródła: `gra/data/tech.json` (stan po `DRZEWKO-TECH-FIX.md`, 2026-07-10 — 32 technologie, 3 epoki, `awansDoEpoki`: Brązownictwo→2, Obróbka żelaza→3) oraz `dyspozycje/REFERENCJA-CIV6-DRZEWKO-TECH.md` (transkrypcja auto-captions filmu o drzewku Civ VI).

## 0. Metodologia i zastrzeżenia

- Transkrypcja Civ VI to auto-captions — część nazw jest przekłamana fonetycznie (np. „poetry"→Pottery, „our journey"→Archery, „any complement district"→Encampment). Czytam z sensem, tak jak zaznaczono w dyspozycji.
- Tam, gdzie transkrypcja jest niejednoznaczna albo nie obejmuje danej technologii (np. Theology, Philosophy, prawdziwe miejsce Astronomy w drzewku Civ VI), uzupełniam ogólną, dobrze udokumentowaną wiedzą o strukturze drzewka Civ VI — każde takie miejsce jest wyraźnie oznaczone „[wiedza ogólna, poza transkrypcją]", żeby odróżnić od tego, co faktycznie jest w dostarczonym materiale.
- Nie dotykam kosztów (`Koszt nauki`), nazw budynków/jednostek, ani samego pliku `tech.json`. Wszystkie proponowane zmiany to wyłącznie **przełożenie pola „Wymaga (prereq)"** + ew. 1 nowy tech-pomost.
- Zachowuję wszystkie istniejące 32 technologie — to reorganizacja połączeń, nie przebudowa od zera.

---

## 1. Obraz OBECNEGO grafu (stan przed propozycją)

Ważna obserwacja wstępna: pole `Poziom` w `tech.json` jest **numeracją globalną** (1→8) przechodzącą przez całe drzewko, nie resetowaną per epoka — stąd Kamień kończy się na Poziomie 2, a Brąz *zaczyna* też na Poziomie 2 (Żegluga). To samo w sobie nie jest błędem (to oś rysowania grafu), ale dobrze widać na nim, że epoki mają dziś bardzo nierówną głębokość:

| Epoka | Zajęte Poziomy | Realna głębokość łańcucha (hopów od korzenia epoki) |
|---|---|---|
| **Kamień** | 1–2 | **2 tiery** — 10 korzeni (P1) + 2 techy zależne (P2: Koło, Brązownictwo) |
| **Brąz** | 2–5 | **4 tiery**, ale płytko: większość technologii z P3 zależy wprost od korzeni Kamienia (Garncarstwo), nie od niczego z samego Brązu |
| **Żelazo** | 6–8 | **3 tiery**, częściowo już OK, ale z niespójnościami (patrz niżej) |

### 1.1 Kamień — obecny graf

```
T1 (korzenie, prereq "—"):
  Obróbka drewna · Garncarstwo · Murarstwo · Rolnictwo · Łowiectwo
  Łucznictwo · Oswojenie zwierząt · Mistycyzm

T2 (zależne od T1):
  Wymiana          ← Garncarstwo
  Gospodarka wodna ← Garncarstwo
  Koło             ← Oswojenie zwierząt
  Brązownictwo     ← Garncarstwo                         [awansDoEpoki: 2]
```

**Problem:** Łucznictwo jest korzeniem (nie zależy od niczego), mimo że logicznie/historycznie łuk wywodzi się z zestawu narzędzi myśliwskich. Brązownictwo (tech kończący epokę) zależy wprost od jednego korzenia (Garncarstwo) — brak pośredniego ogniwa, więc epoka ma tylko 2 tiery zamiast 3.

### 1.2 Brąz — obecny graf

```
P2: Żegluga        ← Obróbka drewna (Kamień)                [+ wymagane ulepszenie: Tartak]

P3: Pismo          ← Garncarstwo (Kamień)                    [+ budynek: Cegielnia]
    Religia        ← Garncarstwo (Kamień)                    [+ budynek: Cegielnia]
    Jeździectwo    ← Koło + Brązownictwo (oba Kamień)
    Wojskowosc     ← Brązownictwo (Kamień)

P4: Matematyka     ← Pismo
    Handel         ← Pismo
    Prawo (Kodeks) ← Pismo

P5: Budownictwo    ← Matematyka + Murarstwo (Murarstwo = Kamień)
    Waluta         ← Handel + Matematyka
    Astronomia     ← Matematyka + Mistycyzm (Mistycyzm = Kamień)
```

**Problem:** cały P3 (4 technologie) zależy WYŁĄCZNIE od technologii Kamienia, nie od niczego w samym Brązie — czyli to w istocie 4 równoległe „wejścia" do epoki, a nie łańcuch. Realna głębokość wewnątrz Brązu to P3→P4→P5, czyli 3 tiery — ale P3 sam w sobie jest workiem 4 niezależnych technologii bez wzajemnych powiązań ani powiązań historycznych między sobą (np. Religia i Pismo nie mają żadnego związku, mimo że historycznie pismo i systemy religijne mocno się przenikały we wczesnych cywilizacjach — kapłani jako pierwsi skrybowie).

### 1.3 Żelazo — obecny graf

```
P6: Obróbka żelaza ← Brązownictwo (Brąz)                    [+ budynek: Piec hutniczy] [awansDoEpoki: 3]
    Inżynieria     ← Budownictwo (Brąz)
    Oblężnictwo    ← Matematyka + Wojskowosc (Brąz)          [+ budynek: Koszary]

P7: Filozofia      ← Pismo + Religia (oba Brąz)               [+ budynek: Biblioteka]
    Kodeks prawa   ← Prawo (Kodeks) + Pismo (oba Brąz)
    Drogi brukowane← Inżynieria + Budownictwo
    Medycyna       ← Filozofia + Gospodarka wodna (Gospodarka wodna = Kamień)  [+ budynek: Studnia]

P8: Hutnictwo żelaza ← Obróbka żelaza + Inżynieria            [+ budynek: Kuźnia żelaza]
    Sztuka wojenna   ← Oblężnictwo + Obróbka żelaza           [+ budynek: Koszary]
```

**Problemy:**
1. **Filozofia i Kodeks prawa** (oba P7) zależą wyłącznie od technologii z Brązu — zero zależności wewnątrz Żelaza, mimo że są na tierze 2 tej epoki.
2. **Medycyna** zależy od **Filozofii**, ale obie są na tym samym Poziomie (7) — to niespójność: jeśli A wymaga B, A nie powinno być na tym samym tierze co B. Medycyna powinna być o tier niżej (P8/T3).
3. **Hutnictwo żelaza** i **Sztuka wojenna** (P8) zależą wprost od technologii P6 (Obróbka żelaza, Inżynieria, Oblężnictwo) — pomijają cały tier P7, więc realna głębokość łańcucha to tylko 2 hopy (P6→P8), a nie 3.

---

## 2. Mapowanie: nasz tech ↔ Civ VI

| # | Nasz tech | Epoka | Obecny prereq | Odpowiednik Civ VI (i jego zależność) | Uwaga |
|---|---|---|---|---|---|
| 1 | Obróbka drewna | Kamień | — | *brak 1:1* — Civ VI nie ma osobnej techy „obróbka drewna", chopping lasu to efekt uboczny Mining/Bronze Working | nasz unikat, dobra specjalizacja surowcowa |
| 2 | Garncarstwo | Kamień | — | **Pottery** (korzeń; Civ VI: Irrigation←Pottery, Writing←Pottery) | wzorcowy korzeń, idealna analogia |
| 3 | Murarstwo | Kamień | — | **Mining + Masonry** połączone w jedno (Civ VI ma je jako 2 osobne korzenie: Mining=ruda/wzgórza, Masonry=kamień/mury/Piramidy) | świadome uproszczenie 2 tech w 1 |
| 4 | Rolnictwo | Kamień | — | *brak 1:1* — w Civ VI farmy dostępne od startu; najbliżej Irrigation (wzmacnia farmy) | nasz unikat |
| 5 | Łowiectwo | Kamień | — | tech „camp" z transkrypcji (obóz na futra/kość słoniową/trufle) — auto-captions nie podają pewnej nazwy, najpewniej **Trapping** [wiedza ogólna] | niepewność nazwy w źródle, unlock jasny |
| 6 | Łucznictwo | Kamień | — | **Archery** („our journey" w transkrypcji) — jednostka Archer, zasięg 2 | Civ VI: Archery zwykle wymaga Animal Husbandry |
| 7 | Oswojenie zwierząt | Kamień | — | **Animal Husbandry** (Pasture na bydle/owcach/koniach) | zgodność pełna |
| 8 | Mistycyzm | Kamień | — | **Astrology** (Shrine, wiara, Stonehenge) | zgodność pełna |
| 9 | Wymiana | Kamień | Garncarstwo | *brak w erze Ancient Civ VI* — najbliżej późniejsza **Currency** (Classical) | nasz własny wczesny element ekonomii |
| 10 | Gospodarka wodna | Kamień | Garncarstwo | **Irrigation** (osuszanie bagien, wzmacnia farmy/plantacje) | zgodność pełna, prereq identyczny jak w Civ VI (←Pottery) |
| 11 | Koło | Kamień | Oswojenie zwierząt | **The Wheel** — ostatnia tech Ancient w Civ VI, tam odblokowuje Water Mill (nie rydwan!) | nasze powiązanie Koło→Rydwan jest **bardziej logiczne historycznie** niż oryginał Civ VI |
| 12 | Brązownictwo | Kamień | Garncarstwo | **Bronze Working** — odkrywa żelazo na mapie, Koszary/Encampment, wojownicy | pełna zgodność koncepcyjna — u nas też Brązownictwo→Obróbka żelaza, dokładnie jak w Civ VI |
| 13 | Żegluga | Brąz | Obróbka drewna | łączy **Sailing** (Ancient) + **Shipbuilding** + **Celestial Navigation** (oba Classical) w jedną tech | świadoma kompresja 3 tech Civ VI w 1 |
| 14 | Pismo | Brąz | Garncarstwo | **Writing** (Library) — w Civ VI też ←Pottery! | idealna zgodność prereq |
| 15 | Religia | Brąz | Garncarstwo | koncepcyjnie łańcuch **Astrology→Theology** [wiedza ogólna, Theology poza zasięgiem transkrypcji] | patrz Decyzja 4 — brak Mistycyzmu w prereq to rozjazd z Civ VI |
| 16 | Jeździectwo | Brąz | Koło + Brązownictwo | **Horseback Riding** (Stable, Horsemen) | zgodność pełna |
| 17 | Wojskowosc | Brąz | Brązownictwo | wg wskazówki zadania: **Military Tactics** (Medieval, Pikeman); funkcjonalnie (Koszary) bliżej Civ VI **Bronze Working** | Civ VI daje Barracks już z Bronze Working — u nas rozciągnięte na osobną tech, to legalny wybór projektowy (specjalizacja militarna) |
| 18 | Matematyka | Brąz | Pismo | **Mathematics** (ruch jednostek morskich, Petra) | zgodność pełna |
| 19 | Handel | Brąz | Pismo | *brak ścisłego 1:1* — w Civ VI trasy handlowe to bardziej mechanika (Trade Route) niż osobna tech; najbliżej Currency | patrz Decyzja 5 |
| 20 | Prawo (Kodeks) | Brąz | Pismo | **brak w Civ VI** — potwierdzone wskazówką zadania | nasz własny element systemu administracji |
| 21 | Budownictwo | Brąz | Matematyka + Murarstwo | **Construction** (Terracotta Army) + częściowo Masonry (mury) | zgodność dobra |
| 22 | Waluta | Brąz | Handel + Matematyka | **Currency** (Market, Commercial Hub) | zgodność pełna |
| 23 | Astronomia | Brąz | Matematyka + Mistycyzm | **UWAGA:** prawdziwa Civ VI „Astronomy" to tech **RENESANSOWA** (Potala Palace) — patrz transkrypcja, sekcja Renaissance [wiedza z dostarczonego materiału, nie domysł] | u nas dużo wcześniej (Brąz) — świadome uproszczenie modelu 3-epokowego; **warte odnotowania właścicielowi**, patrz §7 |
| 24 | Obróbka żelaza | Żelazo | Brązownictwo | **Iron Working** (Swordsman, wymaga Bronze Working) | pełna zgodność, w tym kierunek zależności |
| 25 | Inżynieria | Żelazo | Budownictwo | **Engineering** (Aqueduct District) | u nas odblokowuje Fort zamiast Akweduktu — Akwedukt już przypisany do Budownictwa, więc brak kolizji, ale to rozjazd nazw/skutków |
| 26 | Oblężnictwo | Żelazo | Matematyka + Wojskowosc | **Machinery** (Crossbowman, Medieval) / **Siege Tactics** (Renaissance) | zgodność tematyczna (oblężenie), inna konkretna jednostka (Katapulta vs Crossbowman) |
| 27 | Filozofia | Żelazo | Pismo + Religia | wg wskazówki zadania: **Education** (University, wymaga Library); nazwą bliżej realnej Civ VI **Philosophy** (Classical) [wiedza ogólna] | dublet nazw w Civ VI (Philosophy vs Education) — u nas scalone sensownie w 1 tech |
| 28 | Kodeks prawa | Żelazo | Prawo (Kodeks) + Pismo | **brak w Civ VI** | kontynuacja naszego własnego systemu prawnego (2. stopień) |
| 29 | Drogi brukowane | Żelazo | Inżynieria + Budownictwo | *brak osobnej techy* — infrastruktura drogowa w Civ VI to efekt uboczny różnych tech | nasz własny most infrastrukturalny |
| 30 | Medycyna | Żelazo | Filozofia + Gospodarka wodna | **brak w bazowej Civ VI** (Civ VI nie ma dedykowanej „Medicine" w tym zakresie epok) | dobrze osadzone historycznie: łaźnie rzymskie / bimaristany islamskiego Złotego Wieku — nasz oryginalny element |
| 31 | Hutnictwo żelaza | Żelazo | Obróbka żelaza + Inżynieria | *brak 1:1* — w Civ VI dopiero „Steel" w erze Industrialnej | sensowny most Żelazo→Stal, wypełnia lukę, której Civ VI nie ma w tym przedziale epok |
| 32 | Sztuka wojenna | Żelazo | Oblężnictwo + Obróbka żelaza | najbliżej **Military Science** (Industrial, Corps/Army) jako kapstone militarny | nazwa sugerowałaby Military Tactics, ale to już zajęte przez Wojskowość — brak kolizji, inny poziom militarny |

---

## 3. Analiza — gdzie płytko / nielogiczne, czego brakuje

**A. Płytkie łańcuchy wewnątrz epoki (główny problem zgłoszony przez właściciela):**
- Kamień: tylko 2 tiery, Brązownictwo (kapstone epoki) wisi na 1 hopie od korzenia — Civ VI ma analogiczny wzorzec (Bronze Working ← Mining, teoretycznie też 1 hop), ALE u Civ VI to jest normalne bo Ancient ma dużo korzeni i płytkie drzewo z założenia. U nas właściciel chce WIĘCEJ głębi niż Civ VI w tym miejscu — to świadome odejście od wzorca Civ VI na rzecz własnych założeń (OK, taki był cel zadania).
- Brąz: 4 z 11 technologii epoki (Pismo, Religia, Jeździectwo, Wojskowość) to „wejścia" zależne wyłącznie od Kamienia — brak wzajemnych powiązań mimo oczywistego historycznego pokrewieństwa (pismo↔religia poprzez kapłanów-skrybów w Sumerze/Egipcie).
- Żelazo: Filozofia i Kodeks prawa (P7) nie mają żadnej zależności od P6 tej samej epoki — a powinny, skoro są deklarowane jako „tier 2" epoki.

**B. Niespójność tier/Poziom:**
- Medycyna (P7) zależy od Filozofii (też P7) — to błąd numeracji: zależność w obrębie tego samego poziomu.
- Hutnictwo żelaza i Sztuka wojenna (P8) czerpią wyłącznie z P6, pomijając P7 — więc mimo że są na „tierze 3", faktyczna głębokość łańcucha to 2, nie 3.

**C. Gdzie Civ VI ma sensowny łańcuch, którego u nas brakuje:**
- **Astrology→Theology** (wiara→religia zorganizowana): u nas Mistycyzm i Religia nie są połączone wprost — Religia zależy tylko od Garncarstwa. To jedyne miejsce, gdzie Civ VI ma wyraźnie lepszą, bardziej logiczną zależność niż my.
- **Bronze Working→Iron Working**: u nas to jest już 1:1 odwzorowane (Brązownictwo→Obróbka żelaza) — dobra wiadomość, nie trzeba nic poprawiać.
- Civ VI: Pottery→Writing (wiedza spisana wymaga nośnika/gliny) — u nas też Pismo←Garncarstwo, identyczne. Dobrze.

**D. Czego brakuje (budynki/jednostki/ulepszenia z Civ VI, które pasują historycznie, a my nie mamy) — poza zakresem „połączeń", ale warte odnotowania:**
- Wonder na Murarstwie/Masonry — Civ VI ma tam Piramidy (darmowy budowniczy); u nas Murarstwo nie ma żadnego cudu.
- Lumber Mill z Machinery (Civ VI) — nasze Oblężnictwo nie daje ekwiwalentu ulepszenia terenu.
- Military Engineer (jednostka wsparcia budująca drogi/forty z Civ VI Military Engineering) — u nas Inżynieria/Drogi brukowane nie mają jednostki-odpowiednika, tylko budynek/ulepszenie.
- To są sugestie **treści**, nie zmiany połączeń — nie ujmuję ich w decyzje ABC (temat kosztów/treści jest świadomie poza zakresem tego zadania), ale zgłaszam do rozważenia w §7.

---

## 4. PROPOZYCJA — drzewko 3-tierowe per epoka

### 4.1 Kamień (T1 → T2 → T3)

```
T1 — fundament (bez zmian, 7 technologii, prereq "—"):
  Obróbka drewna · Garncarstwo · Murarstwo · Rolnictwo
  Łowiectwo · Oswojenie zwierząt · Mistycyzm

T2 — zależne od T1 (5 technologii):
  Łowiectwo               → Łucznictwo                  [ZMIANA — było korzeniem]
  Garncarstwo + Rolnictwo → Wymiana                      [ZMIANA — dodano Rolnictwo]
  Garncarstwo             → Gospodarka wodna              (bez zmian)
  Oswojenie zwierząt      → Koło                          (bez zmian)
  Murarstwo + Obróbka drewna → [NOWY] Wytop rudy          [NOWY tech-pomost]

T3 — kapstone epoki (1 technologia):
  Wytop rudy [NOWY] + Garncarstwo → Brązownictwo          [ZMIANA prereq]  ⟹ awansDoEpoki: 2
```

| Tech | Obecny prereq | Proponowany prereq | Uzasadnienie | Civ VI |
|---|---|---|---|---|
| Łucznictwo | — | **Łowiectwo** | łuk jako rozwinięcie zestawu narzędzi myśliwskich — najbardziej bezpośrednia logiczna droga do broni dystansowej | Archery (Civ VI zwykle ←Animal Husbandry — obie ścieżki „myśliwskie" są zasadne, wybieramy Łowiectwo jako bliższe tematycznie) |
| Wymiana | Garncarstwo | **Garncarstwo + Rolnictwo** | nadwyżka żywności (Rolnictwo) jest historycznym warunkiem powstania wymiany/barteru — bez nadwyżki nie ma czego wymieniać | brak 1:1 w Civ VI, uzasadnienie własne |
| *(nowy)* Wytop rudy | — | **Murarstwo + Obróbka drewna** | wytop rudy metalu wymaga jednocześnie dostępu do rudy (Murarstwo) i paliwa/węgla drzewnego do pieca (Obróbka drewna) — to brakujące ogniwo między „mamy surowce" a „mamy stop" | most-koncepcyjny do Bronze Working (Civ VI ←Mining, ale bez etapu paliwa — u nas dokładniej) |
| Brązownictwo | Garncarstwo | **Wytop rudy + Garncarstwo** | wytop rudy to techniczny warunek stopu brązu; Garncarstwo zostaje jako drugi prereq (piece garncarskie/ceramiczne historycznie wpływały na konstrukcję pieców hutniczych) | Bronze Working (Civ VI ←Mining, 1 hop — u nas świadomie głębiej, zgodnie z życzeniem właściciela) |

### 4.2 Brąz (T1 → T2 → T3)

```
T1 — wejście z Kamienia (5 technologii):
  Obróbka drewna          → Żegluga                       (bez zmian)
  Garncarstwo             → Pismo                          (bez zmian)
  Garncarstwo + Mistycyzm → Religia                        [ZMIANA — dodano Mistycyzm]
  Koło + Brązownictwo     → Jeździectwo                    (bez zmian)
  Brązownictwo            → Wojskowosc                     (bez zmian)

T2 — zależne od T1 Brązu (3 technologie):
  Pismo             → Matematyka                            (bez zmian)
  Pismo + Żegluga    → Handel                               [ZMIANA — dodano Żegluga]
  Pismo + Religia    → Prawo (Kodeks)                       [ZMIANA — dodano Religia]

T3 — kapstone(-y) epoki (3 technologie):
  Matematyka + Murarstwo → Budownictwo                      (bez zmian)
  Handel + Matematyka    → Waluta                           (bez zmian)
  Matematyka + Mistycyzm → Astronomia                       (bez zmian)
```

| Tech | Obecny prereq | Proponowany prereq | Uzasadnienie | Civ VI |
|---|---|---|---|---|
| Religia | Garncarstwo | **Garncarstwo + Mistycyzm** | animizm/mistycyzm (kult przodków, miejsca święte) historycznie poprzedza zorganizowaną religię — to jedyne miejsce, gdzie Civ VI ma wyraźnie lepszy łańcuch niż my (Astrology→Theology) | Theology ←Astrology [wiedza ogólna] |
| Handel | Pismo | **Pismo + Żegluga** | handel dalekosiężny (zwł. morski) wymaga zarówno zapisu kontraktów/rachunków (Pismo) jak i zdolności transportu morskiego (Żegluga) — klasyczny handel śródziemnomorski opierał się na obu | brak 1:1, uzasadnienie historyczne własne |
| Prawo (Kodeks) | Pismo | **Pismo + Religia** | wczesne kodeksy prawne (np. Kodeks Hammurabiego) czerpały autorytet z sankcji religijnej — prawo i religia były spleciona w administracji starożytnej | brak w Civ VI (nasz element), ale historia potwierdza powiązanie |

### 4.3 Żelazo (T1 → T2 → T3) — epoka już miała 3 tiery, tu głównie naprawa spójności i dociążenie wewnętrznych łańcuchów

```
T1 — wejście z Brązu (4 technologie):
  Brązownictwo            → Obróbka żelaza                 (bez zmian)  ⟹ awansDoEpoki: 3
  Budownictwo              → Inżynieria                     (bez zmian)
  Matematyka + Wojskowosc  → Oblężnictwo                    (bez zmian)
  Pismo + Religia          → Filozofia                      (bez zmian)

T2 — zależne od T1 Żelaza (3 technologie):
  Inżynieria + Budownictwo        → Drogi brukowane          (bez zmian)
  Filozofia + Gospodarka wodna    → Medycyna                 (bez zmian, ale teraz poprawnie T2, nie „ten sam poziom co Filozofia")
  Prawo (Kodeks) + Filozofia      → Kodeks prawa             [ZMIANA — było Prawo(Kodeks)+Pismo]

T3 — kapstone-y epoki (2 technologie):
  Obróbka żelaza + Drogi brukowane → Hutnictwo żelaza        [ZMIANA — było +Inżynieria]
  Oblężnictwo + Obróbka żelaza     → Sztuka wojenna          (bez zmian — kończy epokę)
```

| Tech | Obecny prereq | Proponowany prereq | Uzasadnienie | Civ VI |
|---|---|---|---|---|
| Kodeks prawa | Prawo (Kodeks) + Pismo | **Prawo (Kodeks) + Filozofia** | Pismo jest już pokryte tranzytywnie przez Prawo(Kodeks) i Filozofię — zastąpienie Pisma Filozofią wiąże zaawansowane kodyfikacje prawa z myślą filozoficzną (jurysprudencja rzymska/stoicka jako podstawa Kodeksu Justyniana), a dodatkowo realnie dociąża tier: teraz zależy od technologii T1 **tej samej epoki** | brak w Civ VI (nasz element), uzasadnienie historyczne |
| Hutnictwo żelaza | Obróbka żelaza + Inżynieria | **Obróbka żelaza + Drogi brukowane** | zaawansowana metalurgia na skalę przemysłową wymaga sprawnego transportu rudy/węgla do kuźni (drogi) bardziej niż samej wiedzy inżynieryjnej ogólnej — jednocześnie to przesuwa zależność o 1 tier głębiej (T2→T3 realnie, nie T1→T3 z pominięciem T2) | brak 1:1 w Civ VI (tam dopiero „Steel" w erze Industrialnej) |

**Efekt:** Filozofia i Kodeks prawa przestają być „wyspami" zależnymi tylko od Brązu — Kodeks prawa zyskuje realną zależność wewnątrz Żelaza (od Filozofii, T1). Hutnictwo żelaza zyskuje prawdziwą głębokość 3 (Obróbka żelaza T1 → Drogi brukowane T2 → Hutnictwo żelaza T3) zamiast płytkiego skoku T1→T3.

---

## 5. Nowe techy-pomosty (propozycja)

Tylko **jeden** nowy tech jest potrzebny, żeby Kamień osiągnął pełne 3 tiery bez utraty logiki:

**Wytop rudy** *(Ore Smelting — propozycja)*
- Epoka: Kamień, tier T2 (Poziom docelowy: patrz Decyzja 9 ws. renumeracji)
- Prereq: Murarstwo + Obróbka drewna
- Co daje: czysto łącznikowy tech (gate), bez własnych odblokowań budynków/jednostek — jego jedyną rolą jest domknięcie łańcucha przed Brązownictwem. Jeśli właściciel chce, może dodatkowo dać drobny bonus surowcowy (np. dostęp do „rudy" jako osobnego surowca zamiast wspólnego z kamieniem) — to już decyzja treściowa, poza zakresem tego dokumentu.
- Bez tego nowego techu Kamień zostaje na 2 tierach (Decyzja 3b poniżej).

Nie proponuję drugiego mostu w Brązie ani Żelazie — obie epoki osiągają 3 realne tiery wyłącznie przez przełożenie istniejących prereqów (patrz §4.2, §4.3).

---

## 6. Lista zmian połączeń — DECYZJE dla właściciela

### Decyzja 1 — Łucznictwo (Kamień)
a) **[REKOMENDACJA]** Zmienić prereq z „—" na **Łowiectwo** (łuk jako rozwinięcie narzędzi myśliwskich)
b) Zostawić bez zmian (korzeń, jak dziś)
c) Alternatywnie: prereq **Oswojenie zwierząt** (ścięgna zwierzęce na cięciwy) zamiast Łowiectwa

### Decyzja 2 — Wymiana (Kamień)
a) **[REKOMENDACJA]** Dodać drugi prereq: Garncarstwo + **Rolnictwo** (nadwyżka żywności warunkiem barteru)
b) Zostawić bez zmian (tylko Garncarstwo)

### Decyzja 3 — nowy tech „Wytop rudy" + zmiana prereq Brązownictwa (Kamień)
a) **[REKOMENDACJA]** Dodać nowy tech „Wytop rudy" (←Murarstwo+Obróbka drewna) jako tier T2; Brązownictwo ← Wytop rudy + Garncarstwo
b) Nie dodawać nowego techu — Kamień zostaje na 2 tierach (Brązownictwo ← Garncarstwo, bez zmian)
c) Dodać „Wytop rudy" jako opcjonalną, dodatkową technologię obok istniejącego prereqa Brązownictwa (Garncarstwo), bez wymuszania go jako twardego warunku

### Decyzja 4 — Religia (Brąz)
a) **[REKOMENDACJA]** Dodać drugi prereq: Garncarstwo + **Mistycyzm** (mistycyzm/animizm poprzedza religię zorganizowaną — jedyne miejsce z wyraźnie lepszym wzorcem w Civ VI: Astrology→Theology)
b) Zostawić bez zmian (tylko Garncarstwo)

### Decyzja 5 — Handel (Brąz)
a) **[REKOMENDACJA]** Dodać drugi prereq: Pismo + **Żegluga** (handel dalekosiężny wymaga zarówno zapisu, jak i transportu morskiego)
b) Zostawić bez zmian (tylko Pismo)

### Decyzja 6 — Prawo (Kodeks) (Brąz)
a) **[REKOMENDACJA]** Dodać drugi prereq: Pismo + **Religia** (wczesne kodeksy prawne czerpały autorytet z sankcji religijnej)
b) Zostawić bez zmian (tylko Pismo)

### Decyzja 7 — Kodeks prawa (Żelazo)
a) **[REKOMENDACJA]** Zamienić prereq z „Prawo (Kodeks) + Pismo" na **„Prawo (Kodeks) + Filozofia"** (Pismo pokryte tranzytywnie; dowiązanie do filozofii/jurysprudencji + realne dociążenie tieru wewnątrz Żelaza)
b) Zostawić bez zmian (Prawo (Kodeks) + Pismo)
c) Dodać Filozofię jako **trzeci** prereq obok istniejących dwóch (Prawo (Kodeks) + Pismo + Filozofia), zamiast zastępować Pismo

### Decyzja 8 — Hutnictwo żelaza (Żelazo)
a) **[REKOMENDACJA]** Zamienić drugi prereq z „Inżynieria" na **„Drogi brukowane"** (transport rudy/węgla do kuźni jako warunek metalurgii przemysłowej skali; realnie dociąża łańcuch do 3 tierów zamiast 2)
b) Zostawić bez zmian (Obróbka żelaza + Inżynieria)

### Decyzja 9 — renumeracja pola „Poziom" (kwestia implementacyjna, nie treściowa)
Po powyższych zmianach każda epoka ma realnie 3 tiery, ale dziś `Poziom` jest globalną, ciągłą numeracją 1→8 (Kamień 1–2, Brąz 2–5, Żelazo 6–8) — do ustalenia przy wdrożeniu:
a) **[REKOMENDACJA]** Numeracja globalna ciągła, bez nakładania na granicy epok: Kamień 1–3, Brąz 4–6, Żelazo 7–9
b) Zresetować `Poziom` per epoka (każda epoka własne T1–T3) — wymaga sprawdzenia, czy `research.ts` / `sciencePicker.ts` używają `Poziom` globalnie czy per-epokowo do rysowania osi drzewka
c) Zostawić obecną numerację i poprawić tylko prereqy — `Poziom` nadal będzie nieco mylący (Medycyna nie zmieni numeru mimo przesunięcia w faktycznej głębi), ale zero ryzyka regresji w renderze

---

## 7. Rozbieżności / braki vs Civ VI warte rozważenia (poza zakresem „połączeń")

1. **Astronomia (nasz Brąz) vs Astronomy (Civ VI Renaissance)** — u nas ta technologia jest ~3 ery wcześniej niż w oryginale. To może być całkowicie świadome uproszczenie (kompresja 8 er Civ VI do naszych 3 epok wymaga gdzieś takich skrótów), ale warto, żeby właściciel to potwierdził jako zamierzone, a nie przeoczone. **[ZAŁOŻENIE — do potwierdzenia]**: traktuję to jako świadomy wybór i nie proponuję zmiany.
2. **Brak wondera na Murarstwie** — Civ VI ma tam Piramidy (darmowy budowniczy + dodatkowe ulepszenie na pustyni). U nas Murarstwo nie ma odpowiednika. Sugestia treściowa na przyszłość, nie zmiana połączeń.
3. **Brak Lumber Mill-podobnego ulepszenia przy Oblężnictwie** — Civ VI: Machinery daje tartak/młyn drzewny (+produkcja z lasu). U nas Oblężnictwo nie daje żadnego ulepszenia terenu.
4. **Brak jednostki wsparcia budującej infrastrukturę** — Civ VI ma Military Engineer (buduje drogi/forty) powiązanego z Military Engineering. U nas Inżynieria/Drogi brukowane dają tylko budynek/ulepszenie, nie jednostkę — mogłoby to wzmocnić rolę tych technologii.
5. **Wojskowość vs Sztuka wojenna — nazwy vs Civ VI** — obie nasze technologie militarne (Wojskowość w Brązie, Sztuka wojenna w Żelazie) odpowiadają fragmentom różnych realnych tech Civ VI (Bronze Working/Military Tactics/Military Science) rozłożonych po różnych erach — to nie jest błąd, tylko efekt tego, że nasz podział na 3 epoki musi pomieścić to, co w Civ VI zajmuje 6+ er. Wystarczy być tego świadomym przy dalszym rozwoju drzewka (Renesans i dalej).
6. **Żegluga jako pojedyncza tech vs 3 w Civ VI (Sailing/Shipbuilding/Celestial Navigation)** — jeśli w przyszłości właściciel zechce więcej głębi w gałęzi morskiej, naturalnym rozszerzeniem byłoby rozbicie Żeglugi na 2 techy (wczesna żegluba przybrzeżna → żegluga oceaniczna), ale to wykracza poza obecne zadanie (zachowanie istniejących technologii).

---

## 8. Co się NIE zmienia

- Żadna z 32 istniejących technologii nie została usunięta ani zmieniona pod względem nazwy, epoki, kosztu, odblokowywanych budynków/surowców/ulepszeń terenu.
- Pola `awansDoEpoki` (Brązownictwo→2, Obróbka żelaza→3) pozostają bez zmian — to wciąż jedyne dwa mechaniczne progi awansu epoki.
- `wymagany budynek` / `wymagane ulepszenie` (bramki Piec hutniczy, Tartak, Cegielnia, Koszary, Biblioteka, Studnia, Kuźnia żelaza) — bez zmian, ten dokument dotyczy wyłącznie pola „Wymaga (prereq)" + jednego nowego techu.
- `tech.json` fizycznie nietknięty — wszystkie zmiany opisane tu jako propozycja do decyzji ABC właściciela i osobnej implementacji.
