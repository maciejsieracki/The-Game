# Część IX — Nauka i epoki

> **Poradnik gracza (Pełny)** · drzewko technologii · awans epoki · odblokowania  
> Powiązane: Część III §51 (pula nauki) · Część VIII §52 (siła państwa) · spis §54–56

Nauka to wspólna pula imperium: wszystkie miasta składają punkty badań, a ty wybierasz **jedną** technologię naraz. Epoki otwierają gałęzie drzewka, jednostki, budynki i cuda. Ten rozdział opisuje **ekran Nauka**, przejścia między epokami i mapę zależności — bez wchodzenia w szczegóły ekonomii (Część VIII §49–53).

---

## 54. Drzewko technologii

### 54.1. Hub badań i drzewko — Design v1 (FALA 207)

Panel **Nauka** (przycisk na pasku zasobów) otwiera **hub badań Design v1**:

- **Postęp** — pasek aktualnej technologii, ETA w turach, przyrost nauki/turę.
- **Lista tech** — dostępne technologie epoki z kosztem i podpowiedzią blokady.
- **Plan badań** — kolejka do kilku pozycji; przeciągnij, żeby zmienić kolejność.
- **Drzewko** — przycisk otwiera pełnoekranowy **graf epok** (zoom + pan + minimapa).

Na węzłach drzewka technologii w **planie badań** widzisz **numerki 1…N** (Klatka D) — aktywny cel ma **1**, kolejne pozycje planu mają wyższe numery. Dzięki temu od razu widać, co badasz teraz i co jest w kolejce.

**Wskazówka:** Gdy chip **Wykonaj** na dole mówi „Wybierz technologię", otwórz hub lub drzewko i ustaw cel — inaczej nie zamkniesz tury.

### 54.2. Widoczność — tylko bieżąca epoka

Widzisz technologie **aktualnej epoki** oraz wcześniejsze (już zbadane — pełny kolor). Przyszłe epoki są ukryte lub wyszarzone do momentu awansu. Start w **Brązie** w kreatorze oznacza, że **cały Kamień** masz już zbadany — drzewko pokazuje te węzły jako gotowe (kaskada startowa, Część I §6.1).

### 54.3. Stany węzłów — kolory i karta

| Stan | Znaczenie |
|------|-----------|
| **Zbadane** | Pełny kolor, ikona „gotowe" — efekt trwa |
| **Dostępne** | Możesz kliknąć i ustawić jako cel badania |
| **Wyszarzone** | Brak wymagań — prereq nieukończony lub bramka epoki/tieru (§55.3); klik pokazuje **konkretny powód blokady** |
| **Ukryte** | Epoka jeszcze nie odblokowana |

Klik na węzeł otwiera **kartę technologii**: koszt w punktach nauki **z uwzględnieniem tempa gry i trudności** (dokładny wzór — §54.6), szacowane tury przy obecnym przyroście nauki, lista wymagań **AND** z ✓/✗ per warunek, oraz co odblokowuje (budynki, jednostki, ulepszenia terenu, surowce). **„Pokaż ścieżkę"** (podświetlenie łańcucha prereków do celu) jest **jeszcze niegotowe (TODO)** — nie szukaj tego przycisku.

### 54.4. Jedno kliknięcie = cel badania

Klik na **dostępną** technologię ustawia ją jako **aktywne** badanie. Kolejny klik na inną tech zmienia cel — w v1.0 postęp do poprzedniej zwykle **zostaje** (sprawdź pasek % badań u góry ekranu). Bez wybranego celu pasek badań stoi, a chip Wykonaj może blokować koniec tury.

### 54.5. Layout gałęzi vs logika

**Wizualnie** drzewko ma gałęzie i rozgałęzienia (SVG). **W logice** wiele tech wymaga **AND** — np. Murarstwo **i** Wojskowość przed murem. Przykład łańcucha: **Murarstwo** → fortyfikacje → **Mury miejskie** w mieście. Inny przykład AND: **Łucznictwo** wymaga **Łowiectwa** (nie samego dostępu do drewna) — bez Łowiectwa łucznicy (w tym Łucznik egipski/sumeryjski/akadyjski) zostają wyszarzeni. Pełna mapa zależności — §56 i katalogi budynków [`45-katalog-budynkow.md`](45-katalog-budynkow.md).

### 54.6. Koszt badania — pełny wzór

Koszt widoczny na karcie węzła to **nie** samo pole „Koszt nauki" z danych — silnik dokłada trzy mnożniki po kolei:

```
koszt finalny = koszt bazowy (tech.json) × tempo gry × 2 (korekta globalna) × mnożnik trudności
```

| Czynnik | Wartości |
|---------|----------|
| **Tempo gry** (wybór w kreatorze, stały na całą partię) | Szybka ×1 · Standardowa ×2 · Długa ×4 |
| **Korekta globalna** (2026-07-22, balans) | **×2 flat**, dla wszystkich, niezależnie od tempa i trudności |
| **Mnożnik trudności** — asymetria gracz vs AI | Normalny: ×1 obie strony · Łatwy: gracz ×1, AI ×2 · Trudny: gracz ×2, AI ×1 |

**Przykład:** tech bazowy koszt **12** PN, tempo **Standardowa**, trudność **Trudny** (grasz jako gracz): 12 × 2 × 2 × 2 = **96** PN. Ten sam tech dla AI w tej samej partii: 12 × 2 × 2 × 1 = **48** PN — AI badają taniej na Trudnym (kompensata przewagi gracza).


### Przykład liczbowy

Tech bazowy **12** PN, tempo **Standardowa** (×2), korekta globalna (×2), trudność **Normalny** (×1) → **48** PN finalnie.
Przy **+16** PN/turę (2 miasta + suwak) — ukończenie za **3** tury.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 55. Epoki i przejścia

### 55.1. Epoki v1.0

| Epoka | Co wnosi |
|-------|----------|
| **Kamień** | Podstawowe jednostki, farma, wczesne budynki |
| **Brąz** | Miedź, lepsze bronie, wczesna dyplomacja, port |
| **Żelazo** | Katapulta, silniejsza armia, próg zwycięstwa dominacji |
| **Średniowiecze+** | Nowe cuda, absolut cudów Antyku (Część XV §96) |

### 55.2. Co odblokowuje nowa epoka

Awans epoki otwiera **gałąź drzewka**, nowe typy jednostek w koszarach (po tech, nie „starter-pack"), wyższe budynki, ulepszenia terenu (kopalnie, irygacja) oraz **cuda wyścigowe (R)** w odpowiedniej epoce Kamienia, Brązu i Żelaza.

### 55.3. Jak awansować epokę — twarda bramka

Awans napędzają dwie konkretne technologie-kamienie milowe: **Brązownictwo** kończy Kamień i wprowadza Epokę Brązu; **Hutnictwo żelaza** kończy Brąz i wprowadza Epokę Żelaza. Nie da się ich zbadać przedwcześnie, bo drzewko ma **twardy gating** (dodatkowy do zwykłych prereków AND):

1. **Nie ruszysz epoki N+1**, dopóki **cała** epoka N nie jest zbadana (wszystkie technologie tej epoki, nie tylko kamień milowy).
2. **Nie ruszysz wyższego poziomu (tieru)** w obrębie epoki, dopóki niższe poziomy tej epoki nie są odkryte.
3. Awans na najwyższy tier epoki (gdzie siedzi Brązownictwo / Hutnictwo żelaza) jest więc naturalną konsekwencją zasad 1–2 — to **ostatnia** dostępna technologia epoki, nie skrót.

Awans jest **jednorazowy** i odblokowuje kolejną warstwę drzewka. **Bez wyjątków per cywilizacja** — każdy typ wchodzi do gry w swojej epoce debiutu i jest dostępny w niej oraz we wszystkich późniejszych, kaskadowo w górę (kanon 2026-07-03); pełna tabela epok debiutu 15 typów — Część XIII §83.2.

### 55.4. Epoka startowa w kreatorze

| Start | Efekt |
|-------|-------|
| **Kamień** | Badasz wszystko od zera |
| **Brąz** | Kamień w pełni zbadany |
| **Żelazo** | Kamień + Brąz zbadane |

Jednostek **nie dostajesz** w pakiecie — tylko przez odblokowane tech. **Tempo gry** (Szybka/Standard/Długa) mnoży koszty tech, nie samą epokę (§51.2).


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

## 56. Tech odblokowuje — mapa zależności

### 56.1. Cztery kategorie

| Kategoria | Przykład |
|-----------|----------|
| **Budynki** | Koszary ← Wojskowość |
| **Ulepszenia terenu** | Farma, tartak, fort — [`28-katalog-ulepszen.md`](28-katalog-ulepszen.md) |
| **Surowce / złoża** | Miedź (Brąz), żelazo (Góry, epoka Żelaza) |
| **Jednostki** | Każdy typ ma wymaganą tech — [`57-katalog-jednostek.md`](57-katalog-jednostek.md) |

### 56.2. Przykładowe łańcuchy

- **Murarstwo** → mury miejskie → wyższa obrona w oblężeniu (Część XI).
- **Pisanie / Matematyka** → biblioteka, ziggurat → więcej nauki.
- **Żegluga** → port, galera, cud morski (Kolos, Ha'amonga).
- **Inżynieria + Wojskowość** → Brama wszystkich narodów (cud R, epoka Żelaza).
- **Łowiectwo → Łucznictwo** (decyzja D1, 2026-07-23) — łucznicy (w tym warianty kulturowe: egipski, sumeryjski, akadyjski) wymagają **obu**: Łucznictwa **i** jego prereka Łowiectwa. Zbadaj Łowiectwo pierwsze, inaczej Łucznictwo zostaje wyszarzone mimo dostępnego drewna.
- **Brązownictwo → Hutnictwo żelaza** — oba to kamienie milowe awansu epoki (§55.3), a nie zwykłe odblokowania budynku/jednostki — traktuj je jako **checkpoint**, nie „tech do pominięcia".

### 56.3. Tech a handel dyplomatyczny

W audiencji możesz wymieniać **punkty postępu tech** (PN = koszt badania w punktach nauki). **Całej technologii nie oddajesz** — tylko postęp. W wojnie dostęp do złoża sąsiada rośnie w cenniku (Część XII §78).

### 56.4. Planowanie badań — strategia

1. **Wczesna gra:** rolnictwo, żywność, osadnictwo (panel **Załóż miasto**) — bufor wzrostu (Część VI).
2. **Przed wojną:** Wojskowość, mury, jednostki wręcz/dystans.
3. **Środek gry (Żelazo):** Inżynieria, katapulta, oblężenie.
4. **Długa gra:** ścieżka do rakiety (zwycięstwo naukowe, Część XVI §98).

**Wskazówka:** Jedno badanie naraz — planuj **kolejność** w głowie: tech odblokowująca Spichlerz przed wieloma miastami; Murarstwo przed planowanym cudem na pustyni (Piramidy, Petra).


### Przykład liczbowy

Mapa standard **84×60** = **5040** heksów. Zasięg wzroku **2** → **19** heksów widocznych od jednostki.
Kultura próg **100** pkt → **+1** pierściień pól wokół miasta (~**6** nowych heksów terytorium).

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik‑L · Część IX · rev. G · 2026-08-04 (§54.1: hub badań Design v1, numery planu na węzłach drzewka — FALA 207) · rev. F 2026-07-23 · pierwotnie rev. E 2026-07-03 · dane: `tech.json`, `scienceHubHud.ts`, `sciencePicker.ts`, `research.ts`*
