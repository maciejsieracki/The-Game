# Spec-AI — Projekt systemu sztucznej inteligencji przeciwnika

> **Zakres:** wersja pierwsza (prosta). Epoki: Kamień + Brąz. Poziomy trudności: 1 (prosty). Gotowe do implementacji w M4.
> Powiązane dokumenty: `PROJEKT-GRY-master.md`, `Dyplomacja-szablon.md`.
> Ostatnia aktualizacja: 2026-06-21.

---

## SPIS TREŚCI

1. Cel AI
2. Ruch jednostek
3. Ekspansja
4. Produkcja — priorytety
5. Nauka — heurystyka
6. Dyplomacja
7. Poziomy trudności
8. Osobowość — modyfikator archetypu
9. Pętla decyzji AI w turze

---

## 1. Cel AI

AI gra tak samo jak gracz — te same zasady, te same zasoby, bez bonusów (poziom prosty).

**Cel nadrzędny:** przetrwać i rozwinąć się na tyle, by wyeliminować wszystkich rywali **tego samego typu** co AI (klaster startowy ~10 AI własnego typu + gracz jako rywal główny). Eliminacja = zlikwidowanie wszystkich miast rywala (§8d master).

**Trzy filary strategii AI:**

1. **Ekspansja** — przejmowanie wiosek i zakładanie miast; większa baza terytorialna = większa produkcja.
2. **Rozwój ekonomiczny** — budynki zwiększające Pracę, Handel i Żywność; armia, którą stać na utrzymanie.
3. **Eliminacja rywali tego samego typu** — priorytet ataku: najpierw rywale własnego archetypu (tak jak cel gracza). Rywale innego typu są atakowane oportunistycznie (gdy słabi lub blisko) albo ignorowani, gdy AI jest zagrożone.

---

## 2. Ruch jednostek

### 2.1 Cel ruchu (priorytet malejący)

| Priorytet | Cel |
|---|---|
| 1 | Wróg w zasięgu ataku → **atakuj** |
| 2 | Wrogie miasto lub wioska — najbliższe osiągalne → **idź ku niemu** |
| 3 | Neutralna wioska w zasięgu (niezajęta) → **idź ku niej** |
| 4 | Brak celu w pobliżu → **czekaj / patroluj** przy własnym mieście |

**„Najbliższy"** = heks o najmniejszej liczbie kroków (Dijkstra na siatce heksagonalnej, z uwzględnieniem terenów nieprzechodnich: góry).

### 2.2 Atak

- Jednostka atakuje cel, jeśli jest na sąsiednim heksie (melee) lub w zasięgu strzału (dystansowe, §5i master).
- Jeśli do celu można dotrzeć w tej turze — porusz i atakuj.
- **Countery**: AI preferuje jednostkę, która ma bonus vs typ obrońcy (§5k master). Jeśli ma taką wolną — wysyła ją jako pierwszą.
- **Flanki**: AI stara się atakować z boku lub tyłu, gdy ma dwie lub więcej jednostek atakujących ten sam cel (prosta heurystyka: druga jednostka staje na heksie prostopadłym do frontu obrońcy).

### 2.3 Wycofanie rannych jednostek

- Jednostka, której Health < 30% startowego Health → **wycofaj do najbliższego własnego obozu lub miasta**.
- Obóz (§6b master) = 1 tura bez ruchu → pełna regeneracja. AI uwzględnia to przy planowaniu ruchu.
- Wycofana jednostka nie atakuje w tej samej turze.

### 2.4 Jednostki dystansowe

- Dystansowe (łucznicy, procarze, oszczepnicy) stoją za linią melee — AI nie wysuwa ich samodzielnie na front.
- Strzelają do celu w zasięgu, który nie jest osłonięty przez własne jednostki AI (proste sprawdzenie linii strzału: heks celu musi być w zasięgu i niezajęty przez sojusznika).

---

## 3. Ekspansja

### 3.1 Przejmowanie wiosek

- AI wysyła zwiadowcę lub jednostkę w kierunku najbliższej **neutralnej wiosk**i (niezajętej przez nikogo).
- Wioska przejęta automatycznie gdy jednostka AI wejdzie na jej heks lub wioska jest w zasięgu terytorium istniejącego miasta AI.

### 3.2 Zakładanie nowego miasta

AI zakłada nowe miasto, gdy spełnione są **wszystkie** warunki:

1. Na heksie jest **wioska** (teren AI).
2. Odległość od każdego innego miasta AI wynosi **≥ 5 pól** (§8a master).
3. AI posiada wystarczające zasoby (Pracę/Pieniądz) lub osadnika.

**Warunek poza zasięgiem:** jeśli dobry heks leży poza zasięgiem istniejących miast AI — AI produkuje **osadnika** i wysyła go do celu.

### 3.3 Wybór pola pod miasto (heurystyka)

AI ocenia kandydujące heksy prostym wynikiem punktowym. Wybiera heks z najwyższym wynikiem:

| Kryterium | Punkty |
|---|---|
| Żywność pola ≥ 3 (łąka, wybrzeże, rzeka) | +3 |
| Praca pola ≥ 2 (wzgórza, wybrzeże) | +2 |
| Handel pola ≥ 1 (równina, pustynia, morze) | +1 |
| Sąsiedztwo rzeki (modyfikator +3 żywn) | +2 |
| Dostęp do surowca (ruda, glina, kamień) | +2 |
| Odległość od granicy wroga < 5 pól | −3 |
| Odległość od własnego miasta < 5 pól | Wykluczone (nie można) |

---

## 4. Produkcja — priorytety

AI zarządza kolejką produkcji każdego miasta osobno. Priorytety dobiera wg **fazy gry** (oznaczanej liczbą posiadanych miast i dostępnych technologii).

### 4.1 Faza wczesna (1–2 miasta, Epoka Kamienia)

Kolejność priorytetów:

1. **Spichlerz** — jeśli jeszcze nie zbudowany (warunek wzrostu populacji i zapasu żywności).
2. **Osadnik** lub ekspansja — jeśli jest dobry heks ≥ 5 pól od obecnych miast i AI ma < 3 miast.
3. **Jednostka defensywna** (Wojownik lub Łucznik) — jeśli miasto nieosłonięte (0 jednostek w mieście lub w pobliżu).
4. **Robotnik** — do budowy ulepszeń terenu (Farm, Drogi) gdy podstawowa obrona zapewniona.

### 4.2 Faza środkowa (3+ miast, Epoka Brązu)

1. **Koszary** — jeśli jeszcze nie zbudowane i AI zamierza rekrutować jednostki wojskowe.
2. **Jednostki wojskowe** (wg archetypu — patrz §8) — atakujące lub obronne zależnie od sytuacji.
3. **Budynki ekonomiczne** (Tartak, Cegielnia, Huta, Magazyn, Targowisko) — jeśli produkcja Pracy/Handlu poniżej potrzeb.
4. **Dalsze miasto** / ekspansja.

### 4.3 Przy zagrożeniu (wróg w odległości ≤ 5 pól od miasta)

1. **Mury** — jeśli technologia dostępna i miasto ich nie ma.
2. **Jednostka defensywna** natychmiast (Wojownik, Włócznik lub odpowiednik cywilizacyjny).
3. **Budynki ekonomiczne** — wstrzymane do czasu stabilizacji.

### 4.4 Zasady ogólne

- AI nie buduje dwóch takich samych budynków w tym samym mieście.
- Produkcja jest zakolejkowana: AI nie przerywa trwającej produkcji na rzecz niższego priorytetu.
- Surowce niedostępne → budynek/jednostka pomijana, AI przechodzi do następnego priorytetu.

---

## 5. Nauka — heurystyka

AI wybiera technologię do badania na podstawie **aktualnego priorytetu strategicznego**.

### 5.1 Logika wyboru

```
JEŚLI brak Spichlerza/Magazynu → badaj technologie odblokowujące te budynki (Garncarstwo, Budownictwo)
W PRZECIWNYM RAZIE:
  JEŚLI faza wczesna (< 3 miast) → badaj technologie odblokowujące ekspansję i podstawowe jednostki
  JEŚLI faza środkowa → badaj technologie wojskowe (Kowalstwo Brązu, Jeździectwo) LUB ekonomiczne
  JEŚLI zagrożenie wojną → badaj technologie wojskowe w pierwszej kolejności
```

### 5.2 Kolejność technologii dla fazy wczesnej (Kamień → Brąz)

Przykładowa ścieżka AI (do weryfikacji z drzewkiem technologii):

1. Garncarstwo → Spichlerz + Garncarnia
2. Rolnictwo / Uprawa ziemi → Farmy
3. Kowalstwo Kamienia → podstawowe jednostki melee
4. Budownictwo → Akwedukt, Mury
5. Pasterstwo → Pastwisko, wzrost populacji
6. Metalurgia / Kowalstwo Brązu → jednostki brązowe, Huta

### 5.3 Zasady

- AI nie bada technologii, której efekt (budynek / jednostka) jest już niepotrzebny (np. nie bada Kowalstwa Brązu, jeśli brakuje rudy i nie ma perspektyw jej zdobycia w tej turze).
- Technologia wymagająca budynku (§5b master) — AI najpierw buduje wymagany budynek, potem bada.

---

## 6. Dyplomacja

Dyplomacja AI opiera się na dwóch parametrach z `Dyplomacja-szablon.md`: **Relacja ogólna** (= Zaufanie + Respekt/Strach) i **Respekt/Strach**.

### 6.1 Reakcja AI na sytuację

| Warunek | Działanie AI |
|---|---|
| Respekt/Strach gracza wobec AI ≥ 60 | AI proponuje **NAP** lub **ofertę trybutu** — chce uniknąć ataku |
| Respekt/Strach AI wobec gracza ≥ 60 | AI może żądać trybutu (§1.8 Dyplomacja) lub wydać ultimatum |
| Relacja ogólna > 30 i brak aktywnej wojny | AI może zaproponować **prosty handel** (jednorazowy) |
| Rywal tego samego typu, Relacja ≤ −20 | AI preferuje **wojnę** nad dyplomacją (cel: eliminacja rywali własnego typu) |
| Aktywna wojna, Health armii AI < 40% | AI wysyła **propozycję pokoju** |

### 6.2 Uproszczona logika pobocznych (cywilizacje początkowe)

Cywilizacje poboczne wg `Dyplomacja-szablon.md` §5.2:

```
JEŚLI Strach > 60 → akceptują trybut / NAP / wchłonięcie
JEŚLI Relacja > 30 → akceptują prosty handel
JEŚLI Relacja < −40 LUB atak → mogą wypowiedzieć wojnę
```

AI zarządzana przez ten spec działa jako **Główny rywal** (5–7 typów), nie jako poboczna.

### 6.3 Priorytety dyplomacji AI (Główny rywal)

1. **Rywale własnego typu** — zawsze wroga nastawienie na starcie (Relacja −20, §3.3 Dyplomacja). AI szuka pretekstu do wojny lub atakuje bezpośrednio przy przewadze.
2. **Inne typy** — neutralne nastawienie; AI może zaproponować NAP lub handel, jeśli jest zagrożona z dwóch stron.
3. **Nigdy** nie zawiera sojuszu z rywalem tego samego typu (wbudowana wrogość).

---

## 7. Poziomy trudności

### 7.1 Aktualnie zaimplementowany: poziom 1 — Prosty

- AI działa **dokładnie tak samo jak gracz**: te same zasoby startowe, te same koszty technologii i produkcji, te same wartości statystyk jednostek.
- Brak bonusów AI do produkcji, nauki, Pracy ani Pieniądza.
- Brak widoczności mapy gracza (AI widzi tylko swój zasięg).
- Pętla decyzji AI wykonywana raz na turę (§9).

### 7.2 Plan: 3 poziomy (zarys — do dopracowania później)

| Poziom | Nazwa | Różnica vs. prosty |
|---|---|---|
| 1 | **Prosty** | Bez bonusów. Te same zasady co gracz. |
| 2 | **Normalny** | AI startuje z +1 jednostką; produkcja Pracy +10%; szybsza nauka (+1 Nauka/tura). |
| 3 | **Trudny** | AI startuje z +1 miastem; produkcja +25%; jednostki AI mają +5% do statystyk walki; AI reaguje na ruchy gracza szybciej (widzi jednostki gracza w pobliżu miast AI bez mgły). |

> Szczegóły poziomów 2 i 3 — do zaprojektowania oddzielnie przed implementacją M5+.

---

## 8. Osobowość — modyfikator archetypu

Każda cywilizacja AI ma **drobny modyfikator priorytetów** wynikający z archetypu (§8c master, §4 Dyplomacja). Nie zmienia logiki decyzji — przesuwa wagi.

### 8.1 Modyfikatory per typ

| Typ | Tendencja bojowa | Tendencja rozwojowa | Modyfikator priorytetu produkcji | Modyfikator dyplomacji |
|---|---|---|---|---|
| **Grecy** | Średnia | Wysoka | Koszary i Biblioteka równorzędne | Chętniej proponuje NAP; unika ekspansji w stronę gracza jeśli Relacja > 0 |
| **Rzym** | Wysoka | Średnia | Koszary i jednostki wojskowe +1 priorytet | Agresja przy Respekcie > 40; chętnie żąda trybutu |
| **Chiny** | Niska | Wysoka | Budynki ekonomiczne +1 priorytet; Nauka +1 priorytet | Preferuje handel; unika ataku jeśli Relacja > 20 |
| **Zulusi** | Bardzo wysoka | Niska | Jednostki wojskowe priorytet #1 zawsze | Dyplomacja tylko przy Strachu > 60; szybko wypowiada wojnę |
| **Inkowie** | Średnia | Średnia | Mury i obrona +1 priorytet przy zagrożeniu | Izolacjonistyczna; słabo reaguje na propozycje handlowe |
| **Egipt** | Średnia | Wysoka | Budynki ekonomiczne i Kultura +1 priorytet | Neutralna; chętnie handluje |
| **Sumerowie** | Niska | Bardzo wysoka | Nauka priorytet #1; jednostki wojskowe dopiero po Koszarach | Chętnie wymienia technologie; długa pamięć urazów |

### 8.2 Implementacja modyfikatora

W pętli decyzji AI (§9) priorytet danej kategorii jest przesuwany o +1 (wyżej) lub −1 (niżej) względem tabeli bazowej z §4. Modyfikator to **stała per cywilizacja**, nie zmienia się w trakcie gry.

---

## 9. Pętla decyzji AI w turze

Wykonywana **raz na turę**, **dla każdej cywilizacji AI osobno**, w podanej kolejności:

```
START TURY AI
│
├─ 1. OCENA ZAGROŻEŃ
│     Czy wróg jest w zasięgu ≤ 5 pól od któregoś z miast AI?
│     → TAK: ustaw flagę ZAGROŻENIE (wpływa na priorytety produkcji i dyplomacji)
│     → NIE: flaga SPOKÓJ
│
├─ 2. PRODUKCJA
│     Dla każdego miasta AI:
│     a. Sprawdź flagę ZAGROŻENIE → dobierz priorytety wg §4.3 lub §4.1/4.2
│     b. Sprawdź aktualną kolejkę produkcji
│     c. Jeśli kolejka pusta → wybierz kolejny priorytet wg §4 + modyfikator archetypu §8
│     d. Dodaj do kolejki (nie przerywaj trwającej produkcji)
│
├─ 3. NAUKA
│     a. Jeśli brak aktywnej technologii w badaniu → wybierz wg §5
│     b. Jeśli trwa badanie → nic nie rób
│
├─ 4. RUCH I ATAK
│     Dla każdej jednostki AI:
│     a. Czy Health < 30%? → wycofaj do obozu/miasta (§2.3)
│     b. Czy wróg w zasięgu ataku? → atakuj (§2.2), preferuj jednostkę z counterem
│     c. Czy jest cel (wrogie miasto / wioska)? → rusz w jego kierunku (§2.1)
│     d. Czy jest neutralna wioska bliżej niż wrogie miasto? → ekspansja (§3.1)
│     e. Brak celu → czekaj / patroluj przy najbliższym mieście AI
│
├─ 5. EKSPANSJA
│     a. Czy warunki zakładania miasta spełnione? (§3.2) → uruchom akcję założenia
│     b. Czy potrzebny osadnik poza zasięgiem? → dodaj do kolejki produkcji miasta
│
└─ 6. DYPLOMACJA
      a. Sprawdź parametry Relacja / Respekt wobec każdego gracza/AI w kontakcie
      b. Zastosuj logikę §6.1 → wyślij propozycję (NAP / trybut / pokój / wojnę)
      c. Rywale własnego typu ze stanem wrogi → pomiń propozycje pokojowe (cel: eliminacja)

KONIEC TURY AI
```

### 9.1 Uwagi implementacyjne

- Krok 4 (ruch) iteruje jednostki w kolejności od najcenniejszej (super-jednostka → jednostki brązowe → kamienne → cywilne).
- Krok 6 (dyplomacja) wysyła maksymalnie **1 propozycję dyplomatyczną na turę** do każdego gracza/AI — bez zasypywania graczy wieloma komunikatami jednocześnie.
- Pętla nie korzysta z losowości — decyzje są deterministyczne na poziomie 1 (prosta wersja). Losowość pojawia się wyłącznie w **samej mechanice walki** (§5l master).
- Cały stan AI (flagi, priorytety, kolejki) przechowywany per cywilizacja w obiekcie `AIState[civId]`.

---

*Spec-AI.md — wersja 1.0, do implementacji w M4. Kolejne wersje: rozszerzenie o poziomy trudności 2 i 3 oraz bardziej rozbudowaną dyplomację aktywną (AI inicjuje akcje, a nie tylko reaguje).*
