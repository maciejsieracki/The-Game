# Część XI — Oblężenie miast

> **Poradnik gracza (Pełny)** · mur · głód · machiny · AI · szturm  
> Powiązane: Część X §57–58 (preBattle, atak miasta) · Część VII (mury, garnizon) · spis §66–73

Oblężenie to **osobny tryb** od bitwy polowej. Gdy stoisz obok wrogiego miasta **z murem**, możesz **Oblężać** zamiast szturmować od razu. Panel oblężenia na mapie strategicznej pokazuje stan muru, garnizonu i zapasów. Ten rozdział opisuje start, głodzenie, milicję, machiny i odwrót.

---

## 66. Start oblężenia

### 66.1. Menu — Oblężaj / Szturm / Anuluj

Przy murze wroga (odległość 1 heks):

| Opcja | Efekt |
|-------|-------|
| **Oblężaj** | Rozpoczynasz oblężenie — **bez** preBattle 3D |
| **Szturm** | Natychmiastowa próba zdobycia (preBattle / auto) |
| **Anuluj** | Powrót bez konsekwencji |

### 66.2. Oblężaj nie woła preBattle

Tryb **panelu oblężenia** na mapie. Jednostki w **obozie oblężniczym** wokół miasta. Grasz dalej — oblężenie trwa tury. Szturm później — z panelu (§73).

### 66.3. Warunki startu

- Wojna z właścicielem (lub brak traktatu ochronnego).
- Wystarczająca armia — AI porównuje siłę (§71).
- Miasto musi mieć **mur** — bez muru reguły z Części X §58.3.
- Stoisz na wrogiem/neutralnym heksie przy murze.

### 66.4. Obóz na mapie

Wizualizacja armii wokół miasta; ikony machin i postępu muru. Klik obozu — panel §67.


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 67. Panel oblężenia (gracz)

### 67.1. Informacje

- **Mur** — aktualne HP / maksimum.
- **Garnizon** — liczba i siła obrońców.
- **Machiny** — liczba i postęp.
- **Zapasy** miasta — żywność obrońców.

### 67.2. Layout

Overlay **na mapie strategicznej** (v1.0) — widać miasto i armie. Aktualizacja co turę.

### 67.3. Akcje

| Akcja | Skutek |
|-------|--------|
| **Czekaj** | Atrycja muru + głód miasta (§68) |
| **Szturm** | Gdy mur osłabiony |
| **Dobuduj machiny** | Koszt pracy / złota / tury |
| **Odwrót** | §72 — machiny przepadają |

### 67.4. Koniec tury

Oblężenie zwykle **nie blokuje** końca tury. AI obrońcy reagują w turze wroga.


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 68. Głód i kapitulacja

### 68.1. Magazyn miasta = 0

Gdy zapasy żywności **w mieście** się skończą — **kapitulacja**. Miasto przechodzi na ciebie bez szturmu. Populacja i budynki — wg reguł v1.

### 68.2. Atrycja garnizonu

Obrońcy tracą ok. **8%** siły na turę oblężenia. Milicja + garnizon w jednym pulu (§69). Machiny przyspieszają spadek **muru**, nie zastępują głodu.

### 68.3. Brak auto-upadku od HP miasta

Miasto **nie pada** tylko dlatego, że „HP miasta" = 0. Automatyczny koniec po stronie obrońcy — **głód**. Szturm — droga „siłą" przed głodem.

### 68.4. Strategia oblężnika

| Sytuacja | Taktyka |
|----------|---------|
| Duża armia + machiny | Szybki mur → szturm |
| Mała armia | Głodzenie tygodniami |
| Własny głód wojska | Utrzymuj magazyn państwa (Część VIII §50) |

**Wskazówka:** Spichlerz w oblężonym **własnym** mieście przedłuża opór (§71.3).


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 69. Milicja i obrońcy

### 69.1. Milicja — 20% populacji

Automatyczna przy oblężeniu/szturmie. Siła = **50%** normalnej jednostki (M). Większe miasto — więcej milicji.

### 69.2. Garnizon stacjonujący

Jednostki **na heksie miasta** — pełna M. Wojsko w mieście podnosi też **prawo** (Część VI §36).

### 69.3. Obrona

Pełny mur + milicja + garnizon = wysokie straty szturmu. AI dokłada posiłki jeśli może (§71).

### 69.4. Po zdobyciu

Milicja **znika**. Nowy garnizon rekrutujesz sam.


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 70. Machiny oblężnicze — tempo

### 70.1. Skala z armią

Większa armia — **szybsze** niszczenie muru. Mała grupa — wolny postęp, ryzyko kontrataku.

### 70.2. Typy

| Maszyna | Epoka / rola |
|---------|----------------|
| **Katapulta** | Żelazo — ostrzał z dystansu |
| **Taran** | Uderzenie w bramę |
| **Wieża** | Szturm po wysokości muru |

### 70.3. Kiedy budować

Mur wysoki — szturm bez machin bardzo kosztowny. Porównaj **czas machin vs głód**.

### 70.4. Machiny a 3D

Szturm z machinami — bonus vs mur w preBattle/3D. W polu katapulta słaba (Część X §64).


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 71. AI oblężenia

### 71.1. Silna armia AI → szturm od razu

Duża przewaga M — AI wybiera **Szturm** z menu startu.

### 71.2. Średnia armia → oblężenie + machiny

**Oblężaj**, budowa machin, potem szturm lub głód.

### 71.3. Słaba armia → głodzenie

Blokada do kapitulacji. Gracz: sortie, posiłki, Spichlerz.

### 71.4. Odwrót AI

AI też może odwrócić się bez kary ruchu — machiny przepadają. Profil agresji nacji (Część XIV §87).


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 72. Odwrót z oblężenia

### 72.1. Wolny odwrót

Przycisk **Odwrót** — armia wraca, może ruszyć jeśli został ruch. Miasto u wroga.

### 72.2. Machiny przepadają

Strategiczny koszt przedwczesnego odwrotu.

### 72.3. Kiedy się wycofać

Kontratak posiłków, własny głód wojska, lepszy cel gdzie indziej, pokój w negocjacjach (Część XII).


### Przykład liczbowy

Miasto **pop 8**, zapas żywności oblężenia **24** 🍞, koszt **2**/turę → **12** tur do głodu.
Katapulta **+3** obrażeń/mur/t — mur **30** HP → **10** tur do wyłomu bez szturmu.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

## 73. Szturm i obrona — reguły

### 73.1. Szanse szturmu

preBattle daje **ogólną ocenę** przed 3D — dokładne % w UI v1 mogą być uproszczone.

### 73.2. Bonusy only — walka

Liczą się: M, countery, teren, mur, milicja, machiny. **Cuda i dyplomacja** nie wpływają bezpośrednio na szturm.

### 73.3. Fan-out po szturmie

Zwycięzca rozkłada jednostki na pierścieniu wokół miasta (jak po bitwie polowej, Część X §65.3). Zdobycie **głodem** — jednostka wchodzi na heks miasta.

### 73.4. Checklist obrony

- Mury + garnizon + wojsko w mieście.
- Zapasy żywności (miasto + państwo).
- Posiłki w promieniu 1 heks.
- Sojusznik może zaatakować oblężnika (Część XII §77).


### Przykład liczbowy

Relacja **+15** (neutralna). Prezent **+8** PN → **+23** — odblokowuje handel (próg **+20**).
Wspólna religia **+10** relacji — sąsiad z twoją wiarą szybciej zgadza się na pakt.

### Strategia gracza

Czytaj **rozpiskę plusów i minusów** w panelu — naprawiaj największy minus pierwszy (wojna, obca religia, głód).

### Typowe błędy

- Patrzenie tylko na **sumę** zasobu zamiast **przyrostu**/turę.
- Odkładanie reakcji na **pomarańczowe** alerty — za turę mogą być **czerwone**.

---

*Poradnik‑L · Część XI · rev. E · 2026-07-03 · powiązane: `siege.ts`, Część X walka*
