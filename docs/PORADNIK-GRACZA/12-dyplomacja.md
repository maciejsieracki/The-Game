# Część XII — Dyplomacja

> **Poradnik gracza (Pełny)** · relacje · audiencja · handel PN · wojna  
> Powiązane: Część III §15.5 (panel dyplomacji) · Część VIII §52 (siła państwa) · spis §74–81

Dyplomacja to relacje z **odkrytymi** nacjami: zaufanie, szacunek i wynikowa **relacja** decydują, czy możesz handlować, podpisać pakt czy wypowiedzieć wojnę. Handel używa **punktów wartości (PN)**. Ten rozdział opisuje model relacji, audiencję króla, progi akcji i przemarsz — minimum v1.0 plus roadmap v1.1.

---

## 74. Model relacji

### 74.1. Trzy osie — Zaufanie, Szacunek i Wiarygodność

| Oś | Zakres | Co mierzy |
|----|--------|-----------|
| **Wiarygodność (W)** | −100…+100 | **Globalna reputacja** twojego państwa — historia dotrzymywania traktatów, przemarszów, wojen (nie per-relacja) |
| **Zaufanie** | 0…100 | Historia **z tą nacją**: handel, dary, łamanie traktatów |
| **Szacunek (Respekt)** | 0…100 | Siła państwa — jak bardzo cię „boją/szanują" |
| **Relacja** | 0…200 | **Zaufanie + Respekt** — wynik używany do progów akcji dyplomatycznych |

**Model (FALA 206):** Wiarygodność wpływa na **tempo** wzrostu Zaufania (im wyższa W, tym szybciej budujesz zaufanie u wszystkich). Relacja to suma osi per para — nie mylić z W.

W panelu audiencji widzisz **Wiarygodność** przy twojej karcie oraz **Zaufanie / Szacunek / Relacja** przy rozmówcy. Przy koszyku negocjacji — wiersz **„Wpływ Relacji na deal"** z procentową korektą akceptacji AI (±%).

Pełne hasło: [`wiarygodnosc.md`](../encyklopedia/pojecia/wiarygodnosc.md).

### 74.2. Bramki Wiarygodności (twarde)

Niektóre traktaty wymagają minimalnej **W**, niezależnie od Relacji:

| Akcja | Min. Wiarygodność |
|-------|-------------------|
| **Pakt o nieagresji (NAP)** | **W ≥ −40** |
| **Sojusz wojskowy** | **W ≥ 0** |

Przy zbyt niskiej W przycisk akcji jest wyszarzony z komunikatem „Wiarygodność zbyt niska…".

### 74.3. Dary a limit Zaufania

Z nadmiaru punktów negocjacji (PN) możesz kupić **max +5 Zaufania na turę** z handlu lub daru — **stały limit dla wszystkich** (bez „Dźwigni 2" zależnej od W; FALA 206). Zła reputacja karana jest innymi mechanizmami (np. odmowa traktatów), nie obniżaniem sufitu dla uczciwych graczy.

### 74.4. Wartości startowe

Nowe spotkanie: **Zaufanie 20**, **Szacunek 30** (neutralnie). **Wiarygodność startowa** zależy od trudności (Łatwy +40 / Normalny +20 / Trudny 0). Barbarzyńcy i miasta-państwa — osobne reguły (§75, Część XIV §90).

### 74.5. Szacunek z siły państwa — nie z cudów

**Siła państwa** (armia, ludność, terytorium, tech — Część VIII §52) wpływa na szacunek. **Cuda** dają bonusy ekonomiczne/dyplomatyczne (Wpływ, zaufanie), ale **nie** dodają bezpośrednio do siły państwa ani szacunku z cudu samego w sobie.

### 74.6. Relacja a AI

Wysoka relacja — handel, pakt, sojusz. Niska — ultimatum, wojna. Profil cywilizacji modyfikuje progi (Część XIV §87).


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 75. Lista dyplomatów

### 75.1. Tylko spotkane nacje

Dopóki nie **odkryjesz** nacji (zwiad, granica, pierwszy kontakt) — nie ma jej na liście. Mgła wojny ukrywa nieznanych.

### 75.2. Miasto-państwo vs typ cywilizacji

**Kapua, Sparta** itd. — osobny wpis na liście. Wojna z jednym miastem-państwem ≠ automatycznie wojna z całym klastrem (reguły v1).

### 75.3. Panel dyplomacji

Otwarcie z paska zasobów lub ikony na mapie. Lista + szczegóły; flagi: pokój, wojna, sojusz, aktywny handel.

### 75.4. Pierwszy kontakt

Powiadomienie „Spotkano nową cywilizację". Opcjonalna audiencja — zwykle nie blocking. Domyślne relacje §74.2.


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Wysyłaj **prezenty** przed prośbą o pakt — relacja **+20** taniej niż wojna o jedno miasto.

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 76. Audiencja (król ↔ król) — panel dwustronny TW (2026-07-23)

### 76.1. Panel audiencji — layout dwustronny

Ekran rozmowy jest dziś **dwustronny**, nie jedna kolumna: **karta gracza** (twój medalion + imię władcy, Moc, potencjał sojuszniczy, Skarbiec, twoje dobra) naprzeciw **karty rozmówcy** (relacje — Zaufanie/Szacunek/Relacja pokazane **tylko po jego stronie** — i nastawienie). Poniżej **baner statusu formalnego**, jeśli obowiązuje traktat (nazwa traktatu + „od X tur" + informacja o karze zerwania), oraz **stół negocjacji w 3 kolumnach**: Możliwe / Aktywne / Żądania-Oferty.

### 76.2. Portrety i imiona władców

Każdy medalion (twój i rozmówcy) pokazuje **portret władcy** dobrany wg **cywilizacji i epoki** (Kamień/Brąz/Żelazo mają osobne portrety u 15 typów; Żelazo i Antyk część cywilizacji jeszcze bez grafiki — fallback żelazo→brąz→kamień→ikona cywilizacji) oraz **imię władcy** pod nazwą cywilizacji (60 imion — 15 typów × 4 epoki, np. Rzym/Kamień = Romulus, Rzym/Żelazo = Scypion Afrykański). Te same portrety/imiona pojawiają się na kartach dowódców w bitwie i w preBattle (Część X §60.1).

### 76.3. Ikonowy pasek akcji + SZYBKA UMOWA

Zamiast listy tekstowej — **pasek ikon 46px** na dole panelu: WOJNA / POKÓJ / SOJUSZ / PAKT / HANDEL / DAR / WASAL, z pigułką nazwy na hover; niedostępne akcje są wyszarzone (`disabled`) z **konkretnym powodem** w tooltipie (np. „zablokowana — wymaga Zaufania 91, masz 64"), nie tylko ogólnym „wymaga relacji X". Osobny przycisk **SZYBKA UMOWA** automatycznie wypełnia koszyk negocjacji **uczciwą ofertą** (algorytm greedy do progu uczciwości `diplomacyFairGivePn`) — punkt startowy do dalszej ręcznej korekty, nie gotowa umowa do ślepego zatwierdzenia.

### 76.4. Zerwij traktat (−15 Zaufania)

Aktywny traktat (pakt, sojusz, granice, NAP) ma teraz ikonę **„Zerwij"** — dobrowolne, świadome zerwanie **z twojej strony** (różne od zerwania WYMUSZONEGO przez wypowiedzenie wojny). Klik otwiera **modal potwierdzenia**; po zatwierdzeniu: **−15 Zaufania jednorazowo** (mniejsza kara niż złamana obietnica w trakcie wojny, −40), a sojusz cofa się do pokoju. Używaj świadomie — to nadal koszt, nie „darmowy reset".

### 76.5. Władcy główni vs miasta-państwa

**Miasta-państwa** — ten sam panel i ten sam zestaw akcji, ale progi **−20 pkt** relacji (trudniejszy handel, łatwiejsze ultimatum wojskowe). Zaufanie startowe, sojusze „sióstr" i siła posiłków **nie zależą** już od głównej trudności gry — patrz osobny suwak §76.5a niżej (od 2026-07-24; Część XIV §88 opisuje zachowanie AI miast-kopii ogólnie, ale poziom trudności bierze dziś z tego suwaka, nie z głównej trudności).

### 76.5a. Suwak „Trudność miast-państw" — niezależny od głównej trudności (2026-07-24, R-TRUDNOSC-1)

W kreatorze nowej gry, w **zaawansowanych opcjach**, jest osobna pozycja **„Trudność miast-państw"** (Łatwy / Normalny / Trudny) — **domyślnie = główna trudność gry**, ale możesz ją ustawić inaczej niż resztę partii.

| Co steruje ten suwak | Nie zmienia |
|------------------------|-------------|
| **Startowe zaufanie** wobec każdego miasta-państwa (`applyCityStateDifficultyTrust`) | Startowe zaufanie wobec pełnoprawnych cywilizacji AI (zależy nadal od głównej trudności) |
| **Próg sojuszu „sióstr"** i **siła posiłków** obronnych między miastami-państwami tego samego klastra (§88.1 w Części XIV) | Ekonomię, koszty, mapę i poziom trudności AI **głównych** cywilizacji |
| **Parametry trudności AI** (bonus produkcji, bonus walki, mnożnik agresji) używane przy decyzjach AI miast-państw (kopii obronnych) | Te same parametry dla zwykłego AI — nadal z głównej trudności |

**Przykład zastosowania:** chcesz łatwą główną rozgrywkę (mniej agresywne wielkie cywilizacje), ale trudniejsze, lepiej bronione miasta-państwa do zdobycia — ustaw główną trudność **Łatwy**, a „Trudność miast-państw" osobno na **Trudny**. Stare zapisy bez tego pola dziedziczą wartość głównej trudności (brak regresji).

### 76.6. Audiencja a Wykonaj

Oczekująca propozycja wroga może być **blocking** (katalog A1-Q9). W wojnie część akcji niedostępna.


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 77. Progi relacji — tabela akcji

### 77.1. Podstawowe progi (zweryfikowane z silnika 2026-07-23)

Od paczki DYPLOMACJA FINAL wszystkie blokady w panelu (§76.3) czytają **wprost te same progi silnika** — tooltip na przycisku wyszarzonym pokazuje dokładną liczbę, którą Ci brakuje.

| Akcja | Próg |
|-------|------|
| **Handel** (¤/Praca/dostęp do złoża) | Relacja ≥ **40** |
| **Pakt o nieagresji (NAP)** | Relacja ≥ **50** **oraz** Zaufanie ≥ **40** |
| **Otwarte granice / prawo przemarszu** | Relacja ≥ **100** **oraz** Zaufanie ≥ **45** |
| **Sojusz** | Relacja ≥ **151** **oraz** Zaufanie ≥ **91** (przeskalowane wg trudności gry) |
| **Umowa Handlowa** (traktat pod szlaki handlowe, Część VIII §53.3) | Osobny traktat, próg AI-propozycji ≈ **40** relacji (decyzja 2026-07-21) — **wymagany**, żeby jakikolwiek szlak handlowy istniał; sam pokój **już nie wystarcza** (zmiana 2026-07-23) |

**Poprzednia wersja tego poradnika podawała Handel ≥100 i NAP ≥110 — to były nieaktualne liczby; realny próg Handlu to 40, a NAP to dual-gate 50/40, nie pojedynczy próg 110.**

### 77.2. Granice, trybut, ultimatum

- **Trybut:** szacunek > 70 **oraz** min. **10 ¤/turę** z twojego skarbca.
- **Ultimatum:** twoja siła ≥ **1,3×** siła wroga + reparacje ≥ **20 ¤**.
- **Wchłonięcie miasta-państwa (v1):** tylko **miasta-państwa** (nie pełne cywilizacje). Wymagania: aktywny **wasal** ≥ **10 tur**, **Respekt ≥ 90**, opłata **złotem** (skaluje się z populacją MP), zgoda po stronie Relacji. Akcja w audiencji: ikona **WCHŁONIĘCIE** (id 15).

### 77.3. Wojna i traktaty

Deklaracja wojny — zawsze możliwa (kary relacji). **Dwa różne sposoby stracić traktat**: (1) **wojna wymuszona** (wypowiedzenie w trakcie obowiązywania paktu) — kara „złamana obietnica" **−40** Zaufania, duża; (2) **Zerwij** — świadomy, dobrowolny przycisk w panelu (§76.4) — **−15** Zaufania, mniejsza kara, bo to nie zaskoczenie w środku wojny. Pokój — negocjacje w audiencji.

### 77.4. Jak podnieść relację

- **Handel** regularny — nadmiar PN → zaufanie (§78.3).
- **Prezent** — szybki boost za złoto.
- **Unikaj** przemarszu bez zgody (−5 zaufanie/turę, §79).
- **Zwycięstwa** — rosnący szacunek.


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Porównuj **koszt pracy ÷ bonus** — tańsze ulepszenie z lepszym 🍞/praca wygrywa wczesną grę.

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 78. Handel i punkty wartości (PN)

### 78.1. Punkt handlowy (PN)

- **1 PN = 1 żywność** (ekwiwalent bazowy).
- **Tech** — koszt w PN = koszt badania w punktach nauki.
- Bilans umowy musi się zgadzać.

### 78.2. Surowce miast w koszyku — pakiety po 10 (2026-07-23)

Koszyk PN handluje dziś też **ilościowymi surowcami miast**, zawsze w **pakietach po 10 sztuk** (nie pojedynczo):

| Surowiec | Cena/szt. w PN | Pakiet (10 szt.) |
|----------|-----------------|-------------------|
| Drewno | 2 | 20 PN |
| Glina | 2 | 20 PN |
| Kamień | 3 | 30 PN |
| Ruda | 4 | 40 PN |
| Cegła | 5 | 50 PN |
| Ceramika | 6 | 60 PN |

Ceny są **placeholderami** (strojenie w panelu Excel). Transfer bierze surowiec **od największych zapasów dawcy** i dostarcza do **stolicy** biorcy; **SZYBKA UMOWA** (§76.3) dopełnia bilans tymi pakietami przed sięgnięciem po złoto.

### 78.3. Czego nadal nie handlujemy

| Nie w handlu | Zamiast tego |
|-----------------|--------------|
| Ulepszenia, budynki, hex terytorium | Własna produkcja |
| Cała technologia | Tylko **punkty postępu** tech |
| Kultura, religia | 🔮 v2 |
| Jednostki, cuda | Nie |

### 78.4. Nadmiar PN → zaufanie

Za każde **100 PN** nadwyżki w korzystnej umowie → **+1 zaufanie**. **Max +5 zaufania/turę** z handlu.

### 78.5. Dostęp do złoża — dwie ścieżki

**(a) Negocjacje punktowe** — kupno prawa dostępu do konkretnego złoża u sąsiada, cennik w PN wprost w audiencji; w **wojnie** wartość rośnie. **(b) Szlak handlowy** — jeśli macie aktywny traktat **Umowa Handlowa** i połączenie miast, dostęp do **brązu, żelaza lub konia** przychodzi automatycznie jako efekt uboczny trasy (Część VIII §53.3) — zerwanie traktatu lub wojna cofa go bez dodatkowych kroków. Bez żadnej z tych dwóch — nie wydobywasz z cudzego złoża (model dostępu, Część VIII §53.1).

### 78.6. Umowa Handlowa jako fundament szlaków

**Szlaki handlowe** (łuki na mapie, dochód/turę, Część VIII §53) wymagają dziś **zawartego traktatu Umowa Handlowa** — sam stan pokoju **już nie wystarcza** (zmiana 2026-07-23, wcześniej trasy powstawały z samego pokoju). AI **proaktywnie proponuje** tę umowę graczowi (skrzynka propozycji przychodzących) i zawiera ją z innym AI (maks. 1 nowa umowa AI↔AI na turę, próg relacji ≈40). Zerwanie Umowy Handlowej (przyciskiem Zerwij albo wojną) **natychmiast kasuje** wszystkie szlaki oparte na niej.


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 79. Wojna i pokój

### 79.1. Deklaracja wojny

Stan **wojny** — banery na mapie. Spadek zaufania u innych (efekt domina — status). Armia może atakować jednostki i miasta wroga.

### 79.2. Kary za zerwanie traktatów

Zerwanie **paktu/sojuszu** przed terminem — duży minus. Nie podpisuj NAP, jeśli planujesz atak za 2 tury.

### 79.3. Pokój

Negocjacje w audiencji — reparacje, granice, trybut. Po pokoju relacja rośnie powoli z handlu.

### 79.4. Wojna a ekonomia

Utrzymanie armii + głód wojska. Handel z wrogiem wstrzymany. Sojusznicy mogą wejść (§80.2, v1.1 roadmap).


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 80. Przemarsz i terytorium

### 80.1. Nieautoryzowany przemarsz

Armia na **cudzym terytorium** bez zgody → **−5 zaufanie na turę** u właściciela heksów.

### 80.2. Prośba o przemarsz

Akcja w audiencji — akceptacja usuwa karę na trasę/okres. Odmowa — omijaj lub ryzykuj wojna.

### 80.3. Terytorium a posterunki

Twój **posterunek** (5 heksów) i **fort** (10 heksów) — własne terytorium. Koniec tury na cudzym hexie bez zgody — liczy się kara.

### 80.4. Barbarzyńcy

Obozy — walka, nie dyplomacja przemarszu. Neutralne lądy poza cudzym terytorium — bez kary.


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 81. Dyplomacja v1.1 — stan wdrożenia (zweryfikowane 2026-07-23)

Ten roadmap był pisany, gdy poniższe funkcje jeszcze nie istniały — **dziś większość już działa w grze**:

### 81.1. T1A — trybut ze skarbca co turę — ✅ WDROŻONE

Automatyczny transfer **¤/turę** ze skarbca płatnika do odbiorcy po zawarciu umowy trybutu; zerwanie trybutu = casus belli.

### 81.2. T2 — dwa typy sojuszu — ✅ WDROŻONE

Sojusz **defensywny** vs **pełny** (wspólna ofensywa) — oba typy realne w silniku (`sojusz_defensywny` / `sojusz_pelny`), różny próg i zakres zobowiązań.

### 81.3. T3A — handel jednorazowy — częściowo (stół negocjacji)

Dedykowanego „eventu" handlu jednorazowego nie ma, ale **stół negocjacji 3-kolumnowy** (§76.1: Możliwe/Aktywne/Żądania-Oferty) + koszyk PN z bilansem jednorazowo-vs-/turę pokrywa ten sam cel: dużą, jednorazową wymianę dóbr/surowców/tech w jednej turze.

### 81.4. Co realnie zostaje w kolejce (2026-07-23)

- **Indeks dóbr handlowych per właściciel** — dziś dobra surowcowe w koszyku są globalne (nie w pełni per-owner), do dociągnięcia.
- **Konfederacja / aneksja / handel mapami** — nie wdrożone, czeka na ABC.
- Poza tym poradnik v1 opisuje **stan faktyczny w grze**, nie życzeniowy roadmap — jeśli coś tu nie działa tak, jak opisano, to build ma inną wersję niż ta weryfikowana 2026-07-23.


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Wysyłaj **prezenty** przed prośbą o pakt — relacja **+20** taniej niż wojna o jedno miasto.

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik‑L · Część XII · rev. G · 2026-08-04 (§74: Wiarygodność, bramki NAP W≥−40 / sojusz W≥0, flat +5 Zauf./turę, wchłonięcie MP v1; Wpływ Relacji na deal) · rev. G 2026-07-24 · rev. F 2026-07-23 · pierwotnie rev. E 2026-07-03 · dane: `diplomacy.json`, `diplomacy-credibility.ts`, `diplomacy-proposals.ts`*
