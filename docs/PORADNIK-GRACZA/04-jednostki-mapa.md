# Część IV — Jednostki na mapie

> **Poradnik gracza (Pełny)** · wojsko na mapie strategicznej · ruch · armia · garnizon  
> Powiązane: [`57-katalog-jednostek.md`](57-katalog-jednostek.md) · Część VII §48 (garnizon w mieście) · Część X (walka) · spis §22–26

Ten rozdział opisuje, co widzisz po zaznaczeniu jednostki, jak planować ruch, łączyć wojsko w armie, bronić miast garnizonem i kiedy do walki dołączają **posiłki** z sąsiednich heksów. Katalog wszystkich 50 jednostek v1.0 — w osobnym pliku; tu — zasady wspólne dla każdego żołnierza na mapie.

---

## 22. Karta jednostki

### 22.1. Pola na karcie

Po kliknięciu jednostki na mapie (lub skrócie **H**, jeśli dostępny w buildzie) widzisz **kartę jednostki** z najważniejszymi liczbami:

| Pole | Co oznacza |
|------|------------|
| **Ruch** | Ile heksów (punktów ruchu) zużyjesz w tej turze |
| **Atak** | Skrócona siła uderzenia w walce — pełna mechanika w Części X |
| **Widok** | Zasięg odkrywania mgły (domyślnie 3; zwiadowca min. 5) |
| **Utrzymanie** | Koszt w **złocie** co turę ze skarbca państwa |
| **Morale** | Wpływ na walkę (jeśli widoczne w v1.0) |

**Utrzymanie** sumuje się z innymi jednostkami i budynkami — ujemny przyrost złota na pasku często wynika właśnie z dużej armii w polu (Część VIII §49).

### 22.2. Typ jednostki i rola bojowa

Karta pokazuje **kategorię**: piechota, kawaleria, dystans, oblężnicza… **Rola** decyduje o bonusach terenu i **contrach** w bitwie (np. włócznia vs konie — Część X §54). Jednostki **unikalne cywilizacji** mają osobne wpisy w [`57-katalog-jednostek.md`](57-katalog-jednostek.md) i Części XIII §85.

**Wskazówka:** Przed pierwszą wojną otwórz katalog i porównaj **M** (moc) oraz rolę — rekrutacja „najtańsza" nie zawsze wygrywa z contrami wroga.


### Przykład liczbowy

Włócznik: ruch **2** heksy/t, M=**8**, koszt **20** pracy + **1** 🍞 utrzymanie.
Armia **4** włóczników = **32** mocy, koszt **4** 🍞/t — przy zapasie **40** starczy na **10** tur.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 23. Ruch, trasa, teren bojowy

### 23.1. Koszty ruchu strategicznego

1. Zaznacz jednostkę.
2. Klik **docelowy heks** — gra rysuje **trasę** i pokazuje koszt w punktach ruchu.
3. **Las, wzgórze, rzeka** — drożej niż łąka; **droga** (ulepszenie) — taniej (Część V §31, Część II §13).

Nie możesz wejść na **obce terytorium** bez zgody dyplomatycznej (**przemarsz**) lub **wojny** (Część XII §80). Wojsko stojące na granicy blokuje ekspansję — planuj posterunki i dyplomację.

| Sytuacja | Efekt |
|----------|-------|
| Za mało punktów ruchu | Trasa się urywa; jednostka staje wcześniej |
| Wróg na heksie docelowym | Wejście = **atak** (Część X) |
| Mgła | Musisz najpierw **odkryć** heks (Część II §8) |

### 23.2. Bonusy terenu przed walką

Pozycja **obrońcy** ma znaczenie jeszcze **przed** walką:

- **Las, wzgórze** na heksie obrońcy — bonus w auto-walce i ekranie przed bitwą (**preBattle**).
- **Rzeka** na polu bitwy — kara dla **atakującego** (Część X §56).

Planuj pozycję **z wyprzedzeniem** — w preBattle cofnięcie jest ograniczone (przycisk **Wycofaj** tam, nie na mapie strategicznej).

**Wskazówka:** Atakuj z łąki na wroga w lesie — odwrócona sytuacja kosztuje cię kilka punktów mocy w pierwszej rundzie.


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 60% skarbiec · 20% nauka · 20% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 24. Armia — łączenie i dzielenie

### 24.1. Proste łączenie v1.0

W wersji 1.0 **nie ma** zaawansowanego panelu armii z przeciąganiem żetonów. Zamiast tego:

1. Dwie (lub więcej) **twoje** jednostki stoją na **sąsiednich** heksach.
2. Gra oferuje okno: **połączyć** w jedną grupę? **Tak / Nie**.
3. Połączona **armia** porusza się **razem** i atakuje **jako całość**.

Rozdzielanie — odwrotna operacja, gdy UI ją udostępnia (sprawdź w buildzie: menu kontekstowe lub osobny przycisk na karcie).

| Zalety armii | Wady |
|--------------|------|
| Jeden ruch, jeden atak — prostsze dowodzenie | Wszystkie jednostki dzielą ten sam teren i contrę |
| Silniejszy cios w jednym miejscu | Straty dotykają całej grupy naraz |

### 24.2. Panel armii (post-v1)

Pełny panel z listą jednostek i **drag-and-drop** — planowany po v1.0. Do tego czasu operuj prostym łączeniem; nie oczekuj układu „tylna linia / front" na mapie strategicznej.


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 60% skarbiec · 20% nauka · 20% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 25. Garnizon i stacjonowanie

### 25.1. Jednostka na heksie miasta

Wojsko **stojące na polu miasta** (tym samym heksie co centrum) wchodzi do **obrony** przy ataku na miasto. W panelu miasta może być widoczny **licznik garnizonu** (Część VII §48).

Jednostka w polu miasta:
- **Nie** zbiera plonów z okolicy.
- **Zużywa** utrzymanie i żywność wojska jak każda inna jednostka w polu.
- Podnosi **prawo** w mieście → mniejsze ryzyko buntu (Część VI §36).

**Wskazówka:** Zostaw co najmniej jedną jednostkę w stolicy, zanim wyślesz całą armię na wyprawę — pusty garnizon zaprasza barbarzyńców i AI.

### 25.2. Kto broni murów

Przy ataku liczy się **garnizon** + ewentualna **milicja** z ludności przy **oblężeniu** (Część XI §62).

| Miasto | Typ obrony |
|--------|------------|
| **Z murem** | Oblężenie lub szturm — dłuższa operacja |
| **Bez muru** | Bitwa polowa — szybsze zdobycie |

Silny garnizon nie zastępuje murów, ale zwiększa koszt ataku dla wroga.


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 60% skarbiec · 20% nauka · 20% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 26. Posiłki

### 26.1. Promień 1 heks od starcia

Gdy na mapie dochodzi do **starcia** (auto-walka lub wejście w preBattle), **posiłki** to twoje jednostki w **odległości 1 heksa** od miejsca walki.

| Reguła | Szczegół |
|--------|----------|
| Zasięg | **1 heks** — nie wojsko z drugiego końca mapy |
| Właściciel | Tylko **twoje** jednostki |
| Decyzja | W **preBattle** widzisz podgląd, kto wchodzi |

### 26.2. Kto wchodzi automatycznie

Jednostki w promieniu 1 **domyślnie dołączają** do walki (auto-walka i ręczna mapa bitwy). Wyjątki:

- **Oblężnicze** — mogą mieć osobne reguły; nie zawsze stoją w pierwszej linii (Część X §55.2).
- **Posiłki wroga** — ta sama zasada 1 heksa dla AI.

Po bitwie ocalałe jednostki wracają na mapę — **fan-out** w pierścieniu wokół pola walki (Część X §58.2), żeby nie stały wszystkie na jednym heksie.

**Wskazówka:** Przed atakiem **zgrupuj** wojsko w sąsiedztwie celu — inaczej część armii zostanie poza promieniem posiłków i nie wejdzie do walki.


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 60% skarbiec · 20% nauka · 20% zamożność.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Od mapy do bitwy — skrót ścieżki

```text
Zaznacz jednostkę → zaplanuj trasę → wejdź na wroga
       ↓
  preBattle (wybór auto / ręczna, podgląd posiłków)
       ↓
  Bitwa → wynik → powrót na mapę (fan-out)
```

Szczegóły auto-walki, contr i oblężenia — Część X i XI. Rekrutacja nowych jednostek — Część VII §47.


### Przykład liczbowy

Autosave co **1** turę — przy **30** min/turze partia **100** tur = **~50** h bez ręcznego zapisu.
Skrót **Spacja** = Wykonaj — oszczędza **~2** kliknięcia × **200** tur = **400** akcji mniej.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Powiązane katalogi i decyzje

| Materiał | Ścieżka |
|----------|---------|
| Wszystkie jednostki v1.0 | [`57-katalog-jednostek.md`](57-katalog-jednostek.md) · `units.json` |
| Karty Wiki | `docs/encyklopedia/jednostki/` |
| Żywność wojska, głód | Część VIII §50 · decyzja [`B5-spichlerz-wzrost-ludnosci.md`](../decyzje/B5-spichlerz-wzrost-ludnosci.md) |
| Siła państwa (M) | Część VIII §52 |


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 20 + N × 16; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 60% skarbiec · 20% nauka · 20% zamożność.

### Strategia gracza

Porównuj **koszt pracy ÷ bonus** — tańsze ulepszenie z lepszym 🍞/praca wygrywa wczesną grę.

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik‑L · Część IV · rev. E · 2026-07-03 · dane: `units.json` · spis §22–26*
