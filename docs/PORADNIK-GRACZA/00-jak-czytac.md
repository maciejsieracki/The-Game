# Część 0 — Jak czytać ten poradnik

> **Poradnik gracza (Pełny)** · wprowadzenie  
> Powiązane: spis treści `docs/PORADNIK-GRACZA-SPIS-TRESCI.md` · encyklopedia `docs/encyklopedia/`

Ten rozdział wyjaśnia, czym jest gra, jak czytać liczby na ekranie i jak ten poradnik łączy się z krótkimi podpowiedziami w grze. Nie musisz czytać wszystkiego naraz — wracaj tu, gdy zobaczysz symbol, którego nie znasz.

---

## 0.1. Co to za gra

**The Game** to turowa gra strategiczna na mapie heksagonalnej w stylu 4X: eksplorujesz (**eXplore**), rozszerzasz terytorium (**eXpand**), rozwijasz imperium (**eXploit**) i — jeśli chcesz — eliminujesz rywali (**eXterminate**).

**Pętla tury** wygląda tak:

1. **Twoja tura** — poruszaj jednostkami, buduj, rekrutuj, ustaw suwaki w miastach, negocjuj.
2. **Koniec tury** — przycisk w dolnym pasku (lub skrót — Część XVII §101).
3. **Tura przeciwników** — sztuczna inteligencja i barbarzyńcy wykonują ruchy.
4. **Nowa tura** — rozliczenie zasobów, wzrost ludności, badania.

**Cel gry w wersji 1.0:** wygrać **dominacją** (siła państwa > 50% świata w epoce Żelaza) albo **naukowo** (wszystkie technologie + rakieta). Szczegóły — Część XVI.

**Wskazówka:** Pierwsze partie traktuj jako naukę pętli: stolica → pola → armia → drugie miasto (panel **Budowa → Załóż miasto**) → sąsiad. Reszta poradnika rozwija każdy element.


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 0.2. Symbole w grze

| Symbol / ikona | Znaczenie |
|----------------|-----------|
| **¤** | Złoto — skarbiec państwa na rekrutację, utrzymanie, przyspieszenie budowy |
| **Żywność** | Zapasy imperium; karmi wojsko i wpływa na wzrost miast |
| **Praca** | Pula na budowę budynków i ulepszeń pól |
| **Badania** | Tempo nauki technologii |
| **Bogactwo** | Luksus — wpływa na szczęście, nie wydajesz jak złota |
| **Ludność** | Suma mieszkańców wszystkich miast |
| **Kultura** | Presja terytorialna i warstwa na mapie |

**Kolory alertów:** zielony = dodatni przyrost; czerwony = problem (ujemne złoto, głód, bunt); pomarańczowy = ostrzeżenie (np. niski porządek). Chip **blocking** w dolnym pasku oznacza: musisz coś zrobić (wybrać technologię, rozwiązać bunt) zanim zakończysz turę.

Pełny opis paska — Część III (`03-pasek-zasobow.md`).


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 0.3. Co jest w wersji 1.0, a co planowane

**Działa dziś (v1.0):**

- Wolna gra na mapie: kreator, 9 typów cywilizacji, epoki Kamień–Żelazo
- Miasto, ekonomia, walka, oblężenie, dyplomacja uproszczona
- Barbarzyńcy, AI rywali, dwa zwycięstwa (dominacja + nauka)
- Zapisy gry, drzewko technologii, Spichlerz (decyzja B5)

**Planowane (oznaczone 🔮 w spisie treści):**

- Kampania fabularna, multiplayer
- Zwycięstwa kulturowe, religijne, dyplomatyczne
- Rozszerzony roster cywilizacji (Harappa, Hetyci, Babilonia…)
- Buntownicy zamiast części obozów barbarzyńskich (późne epoki)

Przyciski **Kampania** i **Multiplayer** w menu mają etykietę „Wkrótce" — w v1.0 graj **Rozpocznij** (sandbox 4X).


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 0.4. Skąd biorą się liczby

Balans gry nie jest „na oko" — pochodzi z **paneli sterowania** (arkusze Excel) eksportowanych do plików JSON w folderze `gra/data/`. Przykłady:

- Budynki → `buildings.json`
- Jednostki → `units.json`
- Cywilizacje → `civs.json` + macierz `civ-matrix.json`

**Dla gracza:** liczby w poradniku i encyklopedii odzwierciedlają aktualny build. Po aktualizacji balansu mogą się zmienić — wtedy odświeżamy poradnik (rewizja w stopce pliku).

**Wzory matematyczne** (np. wzrost ludności, siła państwa) — Apendyks C w pełnym spisie. W rozdziałach 0–XVII unikamy skrótów technicznych; tam, gdzie trzeba, podajemy efekt w języku gry („+15% Daniny z portów").

Decyzje produktowe Macieja (np. Spichlerz, layout HUD) są zapisane w `docs/decyzje/` — poradnik z nich korzysta, ale nie wymaga ich czytania.


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 0.5. Poradnik vs Civpedia — trzy długości tekstu

Ten sam fakt o grze możesz przeczytać na trzech poziomach szczegółowości:

| Warstwa | Gdzie | Długość | Przykład |
|---------|-------|---------|----------|
| **Skrót** | Tooltip `(?)` przy ikonie, krótka linia w liście Civpedia | 1–3 zdania | „Spichlerz — wspólny magazyn żywności państwa." |
| **Hasło** | Karta w encyklopedii Civpedia, panel pomocy | ~150–300 słów | Hasło `docs/encyklopedia/budynki/spichlerz.md` |
| **Poradnik‑L** | Ten folder `docs/PORADNIK-GRACZA/` | Pełny rozdział z tabelami i wskazówkami | `06-miasto-spoleczenstwo.md` §33 |

**Jeden kanon** — te same fakty, inna długość. Skrót Civpedia nie może zaprzeczać Poradnikowi‑L.

**Jak korzystać:**

- W trakcie gry — **Skrót** / **Hasło** w Civpedia (szybka odpowiedź „co robi ten budynek?").
- Przed pierwszą partią — Część 0 + I + III.
- Gdy utkniesz — indeks `docs/encyklopedia/indeks.md` lub katalogi 28 / 45 / 57.

Enciklopedia cywilizacji: `docs/encyklopedia/cywilizacje/{id}.md` — skrót per nacja; pełny przewodnik — Część XIII.


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 0.6. Słownik gracza vs apendyks techniczny

**Rozdziały 0–XVII** (ten poradnik) piszą językiem gracza:

- „Siła państwa", nie „Power P-A"
- „Suwak Daniny", nie „wealth slider lane B"
- Pełne nazwy ekranów: panel Miasto, ekran przed bitwą, drzewko technologii

**Apendyks A** (w pełnym spisie) — alfabetyczny słownik pojęć z krótką definicją.

**Apendyks C** — wzory z tłumaczeniem symboli dla osób, które chcą „pod spód" mechaniki.

**Apendyks B** — tabele balansu (macierz 9×3 bonusów cywilizacji itd.) — referencja, nie lektura obowiązkowa.


### Przykład liczbowy

Kreator: **Standard** mapa + **6** typów rywali + **2** miasta-państwa w klastrze → ~**8** państw w regionie startowym.
Tempo **Szybka** ×**0,2** — tech **50** badań kosztuje efektywnie **10** punktów w puli.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## Mapa poradnika — gdzie iść dalej

| Chcesz… | Czytaj… |
|---------|---------|
| Pierwszą grę | Część I (menu, kreator) |
| Zrozumieć liczby u góry ekranu | Część III |
| Miasto, ludność, Spichlerz | Część VI |
| Budowa i rekrutacja | Część VII |
| Wybrać nację | Część XIII + encyklopedia cywilizacji |
| AI i barbarzyńcy | Część XIV |
| Wygrać / przegrać | Część XVI |
| Zapisy, skróty | Część XVII |


### Przykład liczbowy

Mapa standard **84×60** = **5040** heksów. Zasięg wzroku **2** → **19** heksów widocznych od jednostki.
Kultura próg **100** pkt → **+1** pierściień pól wokół miasta (~**6** nowych heksów terytorium).

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik gracza rev. G · 2026-08-04 · spis: `PORADNIK-GRACZA-SPIS-TRESCI.md` §0.1–0.6*
