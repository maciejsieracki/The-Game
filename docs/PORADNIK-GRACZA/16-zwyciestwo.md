# Część XVI — Zwycięstwo i koniec gry

> **Poradnik gracza (Pełny)** · jak wygrać i jak przegrać  
> Powiązane: Część III §20 (siła państwa) · Część IX (nauka) · `gra/src/game/victory.ts`  
> Decyzja Macieja 10=A* (2026-06-27)

W wersji 1.0 są **dwa sposoby wygranej** i **jeden warunek porażki**. Nie ma zwycięstwa kulturowego, religijnego ani punktacji po limicie tur — te tryby są planowane na później (🔮).

---

## 97. Warunki zwycięstwa v1.0

### 97.1. Zwycięstwo dominacji — siła > 50% świata

**Dominacja** oznacza: twoja **siła państwa** przekracza **50%** sumy siły **wszystkich** graczy i AI na mapie.

Warunki szczegółowe:

| Wymaganie | Wyjaśnienie |
|-----------|-------------|
| **Próg 50%** | Twój udział w łącznej sile musi być **większy** niż połowa (nie wystarczy remis 50:50) |
| **Ostatnia epoka** | Liczy się dopiero w **epoce Żelaza** (epoka 3 w menu v1.0) |
| **Bez eliminacji wszystkich** | Nie musisz zniszczyć każdego rywala — wystarczy dominacja siłą |

**Siła państwa** (wielka liczba na pasku — Część III §20) składa się m.in. z miast, armii, technologii i terytorium. Obserwuj **trend** udziału procentowego w tooltipie.

**Strategia dominacji:**

1. Rozwijaj **drugie i trzecie miasto** wcześnie — siła rośnie z ludnością i budynkami.
2. Nie ignoruj **nauki** — epoka Żelaza wymaga badań.
3. Podbijaj **miasta-państwa** w klastrze — szybki skok siły bez długiej wojny totalnej.
4. Pilnuj, czy **AI nie wyprzedza** cię w sile — rywal z >50% w epoce Żelaza też może wygrać.

### 97.2. Zwycięstwo naukowe — rakieta

**Nauka** wymaga **obu** kroków:

1. **Wszystkie technologie** w zakresie gry v1.0 (epoki Kamień + Brąz + Żelazo w drzewku) muszą być **zbadane**.
2. **Rakieta z robotami** — projekt końcowy: odpowiednia technologia **oraz** produkcja / wystrzelenie (flaga w silniku gry).

**Nie musisz** dominować militarnie — możesz wygrać nauką przy mniejszej armii, jeśli masz spokojnych sąsiadów i silną produkcję badań (Biblioteka, Akademia, suwak nauki w Daninie).

**Strategia naukowa:**

- Wybierz typ z bonusem nauki (**Inkowie**, **Chińczycy**) lub graj spokojnie na **Normalnym**.
- Ustaw **tempo gry** na dłuższe, jeśli chcesz pełne drzewko przed końcem ery.
- Po zbadaniu ostatniej tech zaplanuj **projekt rakietowy** w kolejce produkcji stolicy.

### 97.3. Czego nie ma w v1.0

| Typ zwycięstwa | Status |
|----------------|--------|
| Kulturowe | 🔮 plan v2 |
| Religijne | 🔮 plan v2 |
| Dyplomatyczne (ONZ / głosowanie) | 🔮 plan v2 |
| Punktacja po N turach | brak |
| Kampania fabularna | menu „Wkrótce" |

### 97.4. Jak śledzić postęp

- **Dominacja:** siła państwa + tooltip z udziałem % (Część III §20).
- **Nauka:** pasek badań, drzewko technologii — % ukończenia globalnego; po ostatniej tech — kolejka projektu rakietowego.
- **Ekran zwycięstwa** (§99) — po spełnieniu warunku; status UI: w trakcie wdrożenia w v1.0.
- **AI też wygrywa** — jeśli rival osiągnie próg dominacji lub rakietę, ty **przegrywasz** (brak współdzielonego zwycięstwa).


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 98. Porażka

### 98.1. Warunek porażki

Przegrywasz, gdy:

- masz **zero miast**, **oraz**
- masz **zero osadników** (jednostka zakładająca nowe miasto), **oraz**
- **kiedyś** miałeś miasto (pierwsza tura przed założeniem stolicy nie liczy się jako porażka).

Nie ma reguły „tylko stolica" — **każde** miasto się liczy. Stracić ostatnie miasto bez rezerwowego osadnika = koniec gry.

### 98.2. Czy można wrócić z porażki

W v1.0 **nie ma** mechaniki „wstań z kolan" po eliminacji. Jedyna opcja to **wczytanie zapisu** (Część XVII §100). Barbarzyńcy **nie wygrywają** — tylko cywilizacje gracza i AI.

### 98.3. Porażka a sojusznicy

Sojusz **nie uratuje** cię, jeśli straciłeś wszystkie miasta — nie grasz dalej jako państwo satelita. Garnizon w **wrogiem** mieście nie wystarczy — miasto musi **należeć** do ciebie.

### 98.4. Unikanie porażki — praktyka

1. Trzymaj **drugie miasto** lub osadnika w bezpiecznym tyle mapy.
2. **Spichlerz** i zapasy żywności — utrzymaj armię na kontratak.
3. **Pokój za trybut** lepszy niż wojna totalna przy jednej stolicy (Część XII §77).
4. **Zapis przed ryzykowną wojna** — §100.1.


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 99. Ekran zwycięstwa (skrót)

Po spełnieniu warunku gry powinna pokazać ekran końcowy z typem zwycięstwa (**Dominacja** lub **Nauka**), numerem tury i podsumowaniem (docelowo: miasta, siła, tech). Przyciski: powrót do **menu głównego**; opcjonalnie kontynuacja sandbox — verify w aktualnym buildzie.

Gdy **AI wygra**, zobaczysz komunikat porażki — nie ignoruj tempa badań rywali w późnej grze.


### Przykład liczbowy

Trudny: AI **+15%** produkcji — miasto AI z **10** pracy/t daje **11,5** efektywnych.
Barbarzyńca **3** jednostki M=**6** → patrol **2** włóczników M=**8** wygrywa auto-walkę.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Porównanie ścieżek wygranej

| | Dominacja | Nauka |
|---|-----------|-------|
| **Główny nacisk** | Miasta, armia, podboje | Biblioteki, spokojna gra |
| **Epoka kluczowa** | Żelazo (próg siły) | Żelazo (pełne drzewko) |
| **Ryzyko** | Wojny na dwa fronty | Przegrany wyścig rakietowy z AI |
| **Typy przyjazne** | Rzym, Zulusi, Celtowie | Inkowie, Chińczycy, Sumer |

Możesz **mieszać** — silna armia chroni cię, gdy AI goni w naukę.


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

*Poradnik gracza rev. E · 2026-07-03 · źródło: `victory.ts`*
