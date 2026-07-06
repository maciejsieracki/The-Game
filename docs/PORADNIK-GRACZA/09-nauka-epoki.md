# Część IX — Nauka i epoki

> **Poradnik gracza (Pełny)** · drzewko technologii · awans epoki · odblokowania  
> Powiązane: Część III §51 (pula nauki) · Część VIII §52 (siła państwa) · spis §54–56

Nauka to wspólna pula imperium: wszystkie miasta składają punkty badań, a ty wybierasz **jedną** technologię naraz. Epoki otwierają gałęzie drzewka, jednostki, budynki i cuda. Ten rozdział opisuje **ekran Nauka**, przejścia między epokami i mapę zależności — bez wchodzenia w szczegóły ekonomii (Część VIII §49–53).

---

## 54. Drzewko technologii

### 54.1. Jak otworzyć ekran Nauka

Kliknij **Badania** na pasku zasobów (góra ekranu) lub ikonę nauki obok puli badań. Otworzy się pełnoekranowe **overlay** z gałęziami technologii połączonymi liniami — możesz przewijać i przybliżać widok. Zamknięcie wraca na mapę; postęp badania **nie** resetuje się.

**Wskazówka:** Gdy chip **Wykonaj** na dole mówi „Wybierz technologię", otwórz drzewko i ustaw cel — inaczej nie zamkniesz tury.

### 54.2. Widoczność — tylko bieżąca epoka

Widzisz technologie **aktualnej epoki** oraz wcześniejsze (już zbadane — pełny kolor). Przyszłe epoki są ukryte lub wyszarzone do momentu awansu. Start w **Brązie** w kreatorze oznacza, że **cały Kamień** masz już zbadany — drzewko pokazuje te węzły jako gotowe (kaskada startowa, Część I §6.1).

### 54.3. Stany węzłów — kolory

| Stan | Znaczenie |
|------|-----------|
| **Zbadane** | Pełny kolor, ikona „gotowe" — efekt trwa |
| **Dostępne** | Możesz kliknąć i ustawić jako cel badania |
| **Wyszarzone** | Brak wymagań: poprzednik tech lub wyższa epoka |
| **Ukryte** | Epoka jeszcze nie odblokowana |

Tooltip na węźle pokazuje koszt w punktach nauki i listę odblokowań (budynki, jednostki, ulepszenia).

### 54.4. Jedno kliknięcie = cel badania

Klik na **dostępną** technologię ustawia ją jako **aktywne** badanie. Kolejny klik na inną tech zmienia cel — w v1.0 postęp do poprzedniej zwykle **zostaje** (sprawdź pasek % badań u góry ekranu). Bez wybranego celu pasek badań stoi, a chip Wykonaj może blokować koniec tury.

### 54.5. Layout gałęzi vs logika

**Wizualnie** drzewko ma gałęzie i rozgałęzienia (SVG). **W logice** wiele tech wymaga **AND** — np. Murarstwo **i** Wojskowość przed murem. Przykład łańcucha: **Murarstwo** → fortyfikacje → **Mury miejskie** w mieście. Pełna mapa zależności — §56 i katalogi budynków [`45-katalog-budynkow.md`](45-katalog-budynkow.md).


### Przykład liczbowy

Scenariusz na **Normalnym**: przyrost **+10**/turę z działalności opisanej w tej sekcji.
Po **5** turach akumulacja **50** jednostek zasobu — wystarcza na **1** kluczową decyzję (budowa, tech lub armia).
Wzory referencyjne: Próg(N) = 10 + N × 8; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 70% złoto · 20% nauka · 10% zamożność.

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

### 55.3. Jak awansować epokę

Zbadaj **kluczowe technologie** progu epoki (widać na pasku zasobów — postęp epoki po prawej, Część III §15). Awans jest **jednorazowy** i odblokowuje kolejną warstwę drzewka. Wyjątki cywilizacji (np. Inkowie: ścieżka Kamień+Żelazo) — Część XIII §83.

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
Wzory referencyjne: Próg(N) = 10 + N × 8; Porządek ≈ 0,5 × Szczęście% + 0,5 × Prawo%; suwaki 70% złoto · 20% nauka · 10% zamożność.

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

### 56.3. Tech a handel dyplomatyczny

W audiencji możesz wymieniać **punkty postępu tech** (PN = koszt badania w punktach nauki). **Całej technologii nie oddajesz** — tylko postęp. W wojnie dostęp do złoża sąsiada rośnie w cenniku (Część XII §78).

### 56.4. Planowanie badań — strategia

1. **Wczesna gra:** rolnictwo, osadnictwo, żywność — bufor wzrostu (Część VI).
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

*Poradnik‑L · Część IX · rev. E · 2026-07-03 · dane: `tech.json`, `buildings.json`, `units.json`*
