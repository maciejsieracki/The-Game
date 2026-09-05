# Prawo — przebudowa skali (analiza + decyzje właściciela)

**Status: DECYZJE CZĘŚCIOWE, temat NIE dispatchowany.** Wszystkie liczby pochodzą od
właściciela; orkiestrator dostarczał wyłącznie pomiary. Balans jest w gestii właściciela.

Analogiczny plik dla szczęścia: `dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md`.

---

## 1. Diagnoza stanu sprzed zmian

### 1a. Prawo nie miało dolnej połowy skali

Najgorszy możliwy scenariusz dawał **91–97%** `prawMax`. Miasto bez jednego żołnierza,
świeżo podbite, z obiema karami naraz, stało praktycznie na suficie.

### 1b. Kary były symboliczne

Cała strona ujemna to **5 punktów** (−2 i −3) wobec bonusów rzędu **229**. Kara za brak
garnizonu stanowiła **1,6%** tego, co dawał garnizon obecny.

### 1c. Garnizon wojskowy dominował i rozwadniał się

Udział garnizonu w puli: **61,3% → 51,3% → 43,7%** (stolica), a w mieście zwykłym epoki 1
aż **78%**. Ta sama choroba co religia — wartość stała przy rosnących budynkach.
**Porządek w mieście zależał głównie od tego, czy akurat nie wysłano wojska na wojnę.**

### 1d. Pałac jest tylko w stolicy

`buildings.json`: pałace mają `lokalizacja: stolica`, urzędy `lokalizacja: region`.
Pierwsza analiza orkiestratora liczyła **wyłącznie stolicę** i przez to zawyżała obraz —
właściciel to wychwycił. Miasto zwykłe ma o **35 / 45 / 55** punktów mniej.

### 1e. Konsekwencja dla buntu — powód, dla którego ten temat w ogóle powstał

`PorPct = min(cap, 0,5 × szPct + 0,5 × prawPct)` (`society-breakdown.ts:800-809`).
Ponieważ `clampPct` obcina szczęście od dołu do zera, a Prawo nie schodziło poniżej 91%,
miasto z **zerowym szczęściem** lądowało na `PorPct` **45,5** — pasmo **Niepokój**, nie bunt.
**Cała przebudowa szczęścia nie zmieniłaby ani jednego buntu bez ruszenia Prawa.**

---

## 2. Łańcuchy ulepszeń — co faktycznie stoi

Ulepszenie **usuwa poprzednika** z `builtIds` (`building-resource-gate.ts:357`).
Dwa łańcuchy w Prawie:
- `palac` → `palac_ii` → `palac_iii` (tylko stolica)
- `dom_starszyzny` → `dwor_zarzadcy` → `pretorium` (każde miasto)

`trybunal` i `sad` **nie są w łańcuchu** — stoją obok siebie.

| Epoka | Miasto zwykłe | Stolica (dodatkowo) |
|---|---|---|
| 1 | Dom Starszyzny 28 | + Pałac 35 |
| 2 | Dwór Zarządcy 33 + Trybunał 17 | + Pałac II 45 |
| 3 | Pretorium 38 + Trybunał 17 + Sąd 19 | + Pałac III 55 |

---

## 3. DECYZJE WŁAŚCICIELA — podjęte

### D1. Garnizon wojskowy WYPADA z Prawa

Uzasadnienie właściciela: *„wojsko stacjonujące w mieście jest tymczasowe i przeznaczone
do prowadzenia wojen, a nie do pilnowania porządku"*.
`prawo_garnizon_per_jednostka` (+20/jedn., cap 5) przestaje wpływać na Prawo.

### D2. Nowy BUDYNEK „Garnizon" — +25 do Prawa

Budynek związany z prawem, **nie z wojskiem**. Wybrany zamiast jednostki, bo jednostka
wciągałaby temat w system walki (57 pól w `units.json`, bitwa 3D, auto-bitwa, symulator,
CivPedia, plus nauczenie AI, żeby nie wysyłała jej na front).

**Przy podboju Garnizon NIE jest kasowany** — zdobywca dziedziczy go jak każdy budynek
(wariant świadomie wybrany spośród trzech; kasowanie było rozważane i odrzucone).

### D3. `prawMax` = komplet budynków epoki w mieście ZWYKŁYM

Słowa właściciela: *„100% powinno być osiągalne po wybudowaniu wszystkich budynków
dostępnych w tej epoce"*. Kalibracja na mieście zwykłym, nie na stolicy — bo większość
miast w grze to miasta zwykłe.

| | Epoka 1 | Epoka 2 | Epoka 3 |
|---|---|---|---|
| Budynki | Dom Starszyzny 28 + **Garnizon 25** | Dwór 33 + Trybunał 17 + **Garnizon 25** | Pretorium 38 + Trybunał 17 + Sąd 19 + **Garnizon 25** |
| **`prawo_max_epoka`** | **53** | **75** | **99** |

### D4. `prawo_max_pop_wspolczynnik` = 0

Płaski mianownik, jak przy szczęściu (tam współczynnik ZOSTAJE na 0,048 — tu na 0).

### D5. Dwie kary USUNIĘTE

- `prawo_kara_brak_garnizonu` (−2)
- `prawo_kara_podboj_bez_garnizonu` (−3)

Obie sprawdzały **jednostki wojskowe na heksie miasta**, a wojsko wypada z Prawa (D1).
Brak Garnizonu jest już ukarany tym, że nie daje swoich 25 punktów — druga kara za to samo
byłaby podwójnym liczeniem, dokładnie jak usunięta kara „obca religia" przy szczęściu.

---

## 4. Zmierzony skutek decyzji D1–D5

Miasto zwykłe, `prawo_pct_cap` = 100:

| Epoka | pop | Komplet | Bez Garnizonu | Zero budynków | Pasmo przy szczęściu 0 |
|---|---|---|---|---|---|
| 1 | 2 | 100% | 91% | 38% | Bunt |
| 1 | 8 | **100%** | **53%** | **0%** | **Bunt skrajny** |
| 2 | 8 | **100%** | **67%** | **0%** | **Bunt skrajny** |
| 3 | 8 | **100%** | **75%** | **0%** | **Bunt skrajny** |

**Bunt stał się osiągalny.** Miasto bez budynków administracyjnych ma 0% Prawa; z zerowym
szczęściem wpada w bunt skrajny. Przed zmianą: 91% i pasmo Niepokój.

---

## 5. OTWARTE — wymagają decyzji właściciela

### O1. Czy Garnizon skaluje się z epoką

Przy stałym +25 jego waga spada: **47% → 33% → 25%** `prawMax`. To ta sama choroba
rozwadniania, którą naprawiono przy religii. Równa waga wymagałaby **25 / 35 / 47**.

### O2. Bonus osiedla dla Prawa

Dziś `prawo_bonus_osiedle_pop` = **28 / 20 / 14 / 8** dla pop 1–4. Przy nowym `prawMax` 53
osada pop 1 dostaje **53%** Prawa z samego faktu bycia małą, bez jednego budynku.
Przy szczęściu bonus przeskalowano w GÓRĘ; tutaj wypadałoby raczej w DÓŁ.

| pop | Bonus dziś | % ep.1 (53) | % ep.2 (75) | % ep.3 (99) |
|---|---|---|---|---|
| 1 | 28 | **53%** | 37% | 28% |
| 2 | 20 | 38% | 27% | 20% |
| 3 | 14 | 26% | 19% | 14% |
| 4 | 8 | 15% | 11% | 8% |

### O3. `prawo_pct_cap` i stolica

Dziś **100**, czyli zero zapasu (przy szczęściu jest 120). Stolica z pałacem wychodzi
**156–166%** i cała nadwyżka (35–55 pkt) przepada — pałac nie robi w Prawie nic poza tym,
że stolica zawsze ma maksimum.

Argument ZA zostawieniem 100: nadmiar szczęścia może ratować miasto bezprawne, ale nadmiar
Prawa nie powinien ratować miasta nieszczęśliwego. *Policja nie zastępuje chleba.*

### O4. W której epoce pojawia się Garnizon

Założono epokę 1 (Prawo jest potrzebne od startu). Do potwierdzenia, wraz z kosztem budowy,
utrzymaniem w złocie i bramką technologiczną.

### O5. Obrona cywilna (Milicja) — OSOBNY, POWIĄZANY TEMAT

**Milicja już istnieje w kodzie:** `makeMilitia` (`siege.ts:478-499`) tworzy syntetyczną
jednostkę z ludności — `floor(populacja × MILITIA_POP_FRACTION)`, statystyki jako ułamek
Wojownika z epoki kamienia, `progDezercji: null`, `unbreakable: true`. `effectiveGarrison`
(`siege.ts:505-513`) wystawia ją automatycznie, gdy prawdziwy garnizon jest pusty.

**LUKA:** `hasCityDefenders` (`siegeDefenders.ts:24-29`) **nie wie o milicji** — komentarz
mówi wprost „Ludność / populacja BEZ garnizonu ≠ obrońcy". Skutek: **miasto bez wojska jest
zdobywane bez żadnej bitwy**, bo decyzja „czy będzie bitwa" zapada przed wystawieniem milicji.

Pomysł właściciela: **budynek Garnizon włącza obronę cywilną** — jedna decyzja gracza,
dwa czytelne skutki (porządek wewnątrz + nie da się wejść bez walki).

Do rozstrzygnięcia:
- czy milicja z Garnizonem ma być silniejsza (liczebność albo statystyki bieżącej epoki
  zamiast kamiennej);
- czy bez Garnizonu miasto ma nadal padać bez bitwy;
- `unbreakable: true` — milicja walczy do ostatniego mieszkańca, co przy dużym mieście
  i przeważającej armii daje długą, jednostronną rzeź. Rozważyć próg ucieczki dla milicji
  **bez** Garnizonu, a `unbreakable` zostawić tam, gdzie Garnizon stoi.
