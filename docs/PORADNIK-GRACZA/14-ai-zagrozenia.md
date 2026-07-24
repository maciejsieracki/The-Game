# Część XIV — AI i zagrożenia

> **Poradnik gracza (Pełny)** · przeciwnicy komputerowi i barbarzyńcy  
> Powiązane: Część XII (dyplomacja) · Część XIII (klaster) · `gra/data/ai-params.json`  
> Źródła: `gra/src/game/ai.ts` · `gra/src/game/barbarians.ts`

Na mapie nie jesteś sam: **rywale AI** (cywilizacje i miasta-państwa w klastrze), **barbarzyńcy** z obozów oraz — w zależności od trudności — **bonusy produkcyjne** przeciwnika. Ten rozdział opisuje, czego się spodziewać i jak czytać sygnały na mapie.

---

## 87. Profile AI per nacja

### 87.1. Cztery osie zachowania

Sztuczna inteligencja ocenia każdą turę w czterech wymiarach:

| Oś | Co oznacza dla gracza |
|----|------------------------|
| **Agresja** | Jak szybko wypowiada wojny i naciera na granicę |
| **Ekspansja** | Zakładanie miast, podbój miast-państw, przejmowanie pól |
| **Dyplomacja** | Handel, pakt, sojusz vs izolacja |
| **Obrona** | Garnizony, mury, kontrataki po stratach |

Parametry per typ są w macierzy cywilizacji (`civ-matrix.json`: `ai_agresywnosc`, `ai_priorytet_militarny`, `dip_prog_wojny` itd.).

### 87.2. Profile per typ — skrót

| Typ | Agresja AI (0–9) | Charakter |
|-----|------------------|-----------|
| **Zulusi** | 9 | Wczesny rush, wojna z sąsiadem |
| **Rzymianie** | 8 | Ekspansja + oblężenia, wysokie ryzyko |
| **Celtowie / Germanie** | 6 | Wojskowy nacisk, las i zasadzki |
| **Grecy, Inkowie, Egipt** | 4 | Zbalansowane; Grecy defensywni |
| **Chińczycy** | 2 | Nauka i ekonomia, rzadka wojna |
| **Sumerowie** | 3 | Priorytet nauki (8/9), umiarkowana agresja |

**Chińczycy** — stereotyp „muru i badań": AI rzadziej rozpoczyna wojny (`dip_prog_wojny` niski). **Zulusi** — przeciwnie: wysoki próg wojny i niska skłonność do sojuszy.

Miasta-państwa w **klastrze** mają **osobny**, bardziej defensywny profil (§88).

### 87.3. AI a trudność gry

Trudność zmienia **liczby**, nie reguły counterów ani dyplomacji.

| Poziom | Bonus produkcji AI | Bonus nauki AI | Inne |
|--------|-------------------|----------------|------|
| **Łatwy** | 0% | 0 | Brak dodatkowych jednostek |
| **Normalny** | +10% pracy w miastach | +1 nauka/turę | +1 jednostka startowa |
| **Trudny** | +25% pracy | 0 (w danych v1) | +1 miasto startowe, +5% walki |

Na **Normalnym** AI ma niewielką przewagę ekonomiczną — kompensuj ją Spichlerzem, suwakami i wczesnym podbojem słabszego miasta-państwa.

AI **nie powinno** widzieć jednostek w mgle poza zasięgiem zwiadu (docelowy standard uczciwej gry).

### 87.4. Co obserwować na mapie

1. **Stosy jednostek przy granicy** — przygotowanie do wojny lub oblężenia.
2. **Nowe miasta AI** — ekspansja na wolne złoża; konkuruj osadnikiem.
3. **Sojusze AI przeciwko tobie** — reakcja dyplomatyczna po twoich wojnach (Część XII).
4. **Obozy barbarzyńskie** — zawsze neutralne zagrożenie (§90).

**Wskazówka:** Zwiadek co kilka tur na granicę klastra — ujawnia ruchy wcześniej niż pierwszy atak.


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 88. AI miast-kopii (klaster)

### 88.1. Aktywny rozwój, ale bez ekspansji ani bonusów

**Miasta-państwa** w twoim klastrze (np. Sparta, Kapua, Teby) — od 2026-07-21 to **aktywni gracze ekonomiczni**, nie bierny łup:

- **Nie zakładają** nowych miast — brak ekspansji osadniczej (jedyne wyłączenie).
- W pełni **rozwijają się**: budują budynki gospodarcze, jednostki i **ulepszenia terenu** (w tym wyrąb lasu — §88.5) jak każde AI.
- **Zero bonusów, zero darmowych jednostek** — dokładnie te same zasady kosztów co gracz.
- Mogą otrzymać **posiłki** od „sióstr" (miast tego samego klastra), ale **tylko w sojuszu** — siła posiłków skaluje się z **osobnym suwakiem „Trudność miast-państw"** z kreatora (domyślnie = główna trudność, ale niezależny od niej — Część XII §76.5a), nie wprost z głównej trudności gry.
- Są **celem podboju** — dla ciebie i dla głównego AI tego typu.

### 88.2. Rywale tego samego typu

- Ten sam **bonus cywilizacji** co twój wybór w kreatorze.
- **Inna nazwa** na liście dyplomatów (Sparta vs twoja stolica).
- Wojna z **jednym** miastem-państwem nie oznacza automatycznej wojny ze wszystkimi w klastrze — sprawdź status każdego kontaktu.

### 88.3. Kiedy AI atakuje miasto-państwo

Profil ekspansyjny (Rzym, Zulusi) + przewaga armii → AI może zdobyć sąsiada w klastrze przed tobą. **Podbite miasto-państwo** staje się normalnym miastem wroga — produkcja, garnizon, ryzyko buntu jak u każdego wroga.

### 88.4. Strategia gracza w klastrze

1. **Wczesny podbój** słabszego sąsiada (np. Kapua), zanim zrobi to Rzym AI.
2. **Dyplomacja selektywna** — pakt z jednym, wojna z drugim w tym samym klastrze.
3. **Unikaj dwóch frontów** w jednym regionie — najpierw zjednocz klaster.

### 88.5. AI buduje ulepszenia terenu — w tym wyrąb lasu (2026-07-23)

**Wszystkie** AI (główne cywilizacje i miasta-państwa) stawiają ulepszenia terenu automatycznie — throttlowane do 1 ulepszenia/miasto/turę, priorytet żywności najpierw, deterministyczne. Od 2026-07-23 doszedł **wyrąb lasu** jako **ostatni priorytet** kolejki AI (po innych, „ważniejszych" ulepszeniach) — AI wycina drzewo tylko gdy w promieniu miasta zostaje **min. 3 lasy**, żeby nie ogołocić całej okolicy z jednego zamachu. Efekt dla gracza: AI konkuruje o dobre pola tak samo jak Ty — nie licz, że lasy przy granicy AI zostaną nietknięte na zawsze.
4. Traktuj klaster jako **strefę treningową** przed spotkaniem **innego typu** cywilizacji.


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 89. Trudność a bonusy AI

### 89.1. Normal — baseline v1.0

- **+10% produkcji** (praca w miastach AI).
- **+1 nauka** na turę imperium AI.
- **+1 jednostka startowa** (gdy zdefiniowane w parametrach).

To punkt odniesienia dla balansu — większość opisów mechanik zakłada **Normalny**.

### 89.2. Łatwy

- Brak bonusów produkcji i nauki z tabeli trudności.
- AI wolniej rośnie — więcej czasu na naukę interfejsu i Spichlerz.
- Dobry wybór pierwszej partii (razem z epoką Kamienia).

### 89.3. Trudny

- **+25% produkcji**, **+1 miasto startowe**, **+5% statystyk walki** jednostek AI.
- Wymaga wczesnej optymalizacji suwaków i zapasów żywności.
- AI agresywniejsze w oblężeniach (Część XI).

### 89.4. Trudność nie zmienia reguł

Te same progi dyplomacji, te same countery jednostek, te same warunki zwycięstwa. Wyboru trudności **nie zmienisz** w trakcie gry — planuj przed startem (Część I §5).


### Przykład liczbowy

Rzymianie: bonus **−5%** kary korupcji przy stracie **20%** → efektywnie **19%** zamiast **20%**.
Przy dochodzie **100** ¤ brutto tracisz **19** ¤ zamiast **20** ¤ na korupcję.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 90. Barbarzyńcy

### 90.1. Obozy — spawn i limit

**Barbarzyńcy** to neutralna frakcja wroga — **nie mają miast**, tylko **obozy** na mapie.

- Obozy powstają przy generowaniu świata (gęstość zależy od ustawień kreatora).
- Co **X tur** obóz może wypuścić jednostkę — do **limitu** jednostek przypisanych do obozu.
- **Zniszczenie obozu** (zajęcie heksu armią) kończy spawn z tego punktu.

Jednostki barbarzyńskie mają właściciela technicznego oddzielnego od graczy i AI cywilizacji — zawsze wrogie.

### 90.2. Agresja, regeneracja, odwrót

- **Agresja** — atakują, gdy twoja jednostka lub miasto jest w zasięgu.
- **Regeneracja** — osłabione jednostki mogą wracać do obozu (status mechaniki).
- **Odwrót** — przy bardzo niskim HP uciekają zamiast ginąć na miejscu.
- **Brak handlu i dyplomacji** — tylko walka.

### 90.3. Barbarzyńcy vs gracz — praktyka

| Faza gry | Zagrożenie | Co robić |
|----------|------------|----------|
| Wczesna | Osadnik, zwiadek bez eskorty | Jednostka wojskowa obok osadnika |
| Środkowa | Obóz przy granicy miasta | Wyczyść obóz przed drugim miastem |
| Późna | Mniejsze — armia elitarna | Posterunek / fort na szlaku (Część V) |

Nagroda za pokonanie — doświadczenie armii; ewentualny łup zależy od wersji balansu.

### 90.4. Fazy — barbarzyńcy a plan v2

W **v1.0** na mapie są wyłącznie **barbarzyńcy**. W planowanych późnych epokach część obozów ma zastąpić frakcja **buntowników** (inne reguły spawnu — 🔮 roadmap). Poradnik v1 opisuje tylko barbarzyńców.


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Podsumowanie — hierarchia zagrożeń

1. **Rywal tego samego typu w klastrze** — bezpośredni cel wczesnej gry.
2. **Główne AI ekspansyjne** (Zulusi, Rzym) — wojna graniczna po konsolidacji.
3. **Barbarzyńcy** — stałe tło; nie ignoruj obozu obok stolicy.
4. **Inne typy cywilizacji** — po opanowaniu klastra, mid–late game.


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

*Poradnik gracza rev. G · 2026-07-24 (§88.1: siła posiłków „sióstr" idzie dziś z osobnego suwaka „Trudność miast-państw", nie wprost z głównej trudności — patrz Część XII §76.5a) · rev. F 2026-07-23 (miasta-państwa aktywne od 2026-07-21, AI buduje ulepszenia terenu w tym wyrąb z ochroną lasu) · pierwotnie rev. E 2026-07-03 · źródło: `ai-params.json`, `ai.ts`, `barbarians.ts`, `main.ts`*
