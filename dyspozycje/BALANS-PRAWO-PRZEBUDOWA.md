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

### D1. Jednostki wojskowe NIE WCHODZĄ do skali Prawa

Uzasadnienie właściciela: *„wojsko stacjonujące w mieście jest tymczasowe i przeznaczone
do prowadzenia wojen, a nie do pilnowania porządku"* oraz *„to jest ostateczność, ratowanie
sytuacji; to nie jest stałe rozwiązanie. Stałe rozwiązanie to budynki, które dają prawo"*.

`prawo_garnizon_per_jednostka` (+20/jedn., cap 5 jednostek) **zostaje w kodzie bez zmian**
jako doraźny dodatek ponad skalą — ale **NIE jest częścią `prawMax`** i nie wolno go
uwzględniać przy wyliczaniu maksimum epoki. Skala Prawa opiera się **wyłącznie na budynkach**.

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
| Budynki | Dom Starszyzny 28 + **Garnizon 25** | Dwór 33 + Trybunał 17 + **Garnizon 35** | Pretorium 38 + Trybunał 17 + Sąd 19 + **Garnizon 47** |
| Suma z budynków | 53 | 85 | 121 |
| **`prawo_max_epoka` — easy** | **35** | **55** | **75** |
| **`prawo_max_epoka` — normal** | **40** | **65** | **85** |
| **`prawo_max_epoka` — hard** | **45** | **75** | **100** |

**Mianownik zależy od poziomu trudności — decyzja właściciela z 2026-09-05, patrz D3a.**
Wcześniejsza wersja tego dokumentu podawała 40 / 75 / 100 płasko; ta tabela ją zastępuje.

**`prawo_max_epoka` jest CELOWO NIŻSZE niż suma budynków.** Dzięki temu małe miasto
z kompletem administracji przebija 100% (132% / 113% / 121% przy pop 2) i nadwyżka jest
widoczna pod sufitem 170 — znaczy „to miasto jest wzorowo zarządzane". Gdyby `prawMax`
równał się sumie budynków, każde miasto powyżej pop 2 siedziałoby dokładnie na stu.

**Garnizon skaluje się z epoką: 25 / 35 / 47** (decyzja właściciela) — inaczej jego waga
spadałaby 47% → 33% → 25%, czyli ta sama choroba rozwadniania co przy religii.
Zapis: tablica per epoka, wzorem `prawo_max_epoka`, nie stała w kodzie.

### D3a. `prawo_max_epoka` zależy od poziomu trudności (2026-09-05)

**Wyzwalacz (właściciel):** *„Czy maksymalny poziom punktów na epoce dla prawa uzależniśmy
od poziomu trudności, tak jak przy szczęściu?"*

**Powód, dla którego to nie było kosmetyką.** Po decyzji D4 (`prawo_max_pop_wspolczynnik`
= 0,04 płasko) Prawo nie miało już **ani jednego** parametru różnicującego trudność —
mianownik był płaski, współczynnik został spłaszczony. A `PorPct = 0,5 × szPct + 0,5 × prawPct`,
więc **połowa Porządku przestałaby reagować na wybór poziomu**: trudność działałaby wyłącznie
przez Szczęście, czyli z połową siły. To był niezamierzony skutek uboczny D4, nie osobny temat.

Rozwiązanie jest tą samą zasadą, którą przyjęto dla Szczęścia w G13: **trudność wyrażana jest
WYŁĄCZNIE mianownikiem**, wszystkie pozostałe parametry Prawa mają te same wartości na
easy / normal / hard.

**Ilu obywateli epoka umie rządzić na 100%** (komplet budynków, miasto zwykłe z Garnizonem):

| | Epoka 1 | Epoka 2 | Epoka 3 |
|---|---|---|---|
| easy | 12,6 | 13,1 | 14,2 |
| normal | **9,2** | **8,8** | **11,0** |
| hard | 6,2 | 5,2 | 6,9 |

`prawPct` miasta 12-osobowego z kompletem budynków: easy 102 / 104 / 109%,
normal 90 / 88 / 96%, hard 80 / 77 / 82%. Miasta 20-osobowego (epoka 3):
easy 80%, normal 70%, hard 60%.

Rozstęp easy↔hard to 13–27 punktów `prawPct`, czyli 7–14 punktów Porządku — mniej więcej
tyle samo, ile daje różnicowanie Szczęścia. **Nikt nie ląduje blisko Buntu** (próg
`PorPct` 12, czyli `prawPct` poniżej ok. 24% przy zerowym Szczęściu): na hard duże miasto
ma presję, nie egzekucję. Ratunkiem ponad skalą zostaje garnizon wojskowy (+20/jednostkę,
D1) — na hard duże miasto realnie będzie musiało trzymać wojsko w murach.

### D3b. Epoka 2 obniżona z 75 na 65, epoka 3 z 100 na 85 (2026-09-05)

Przy okazji D3a wyszła wada rozkładu, której wcześniej nie widziałem, bo liczyłem tylko
poziom normalny w oderwaniu od krzywej: **epoki nie tworzyły rosnącego ciągu.**

Stan przed poprawką (normal, `prawMax` 40 / 75 / 100): epoka 1 rządziła **9,2** obywatelami,
epoka 2 tylko **5,2**, epoka 3 **6,9**. Siodło w środku gry i epoka 3 słabsza od epoki 1 —
odwrotność tego, co epoki mają robić. Pretorium, Trybunał i Sąd to poważna administracja;
epoka 3 powinna umieć rządzić WIĘKSZYM miastem niż Dom Starszyzny z epoki 1.

Przyczyna była czysto arytmetyczna: budynki rosną 53 → 85 → 121 (×1,60 i ×1,42), a mianownik
rósł 40 → 75 → 100 (×1,88 i ×1,33). W epoce 2 mianownik uciekał budowlom o połowę.

**Poprawka: epoka 2 → 65, epoka 3 → 85** (normal; easy i hard proporcjonalnie).
Krzywa robi się rosnąca: **9,2 → 8,8 → 11,0**.

Zapis pierwotnej decyzji właściciela („40 / 75 / 100") jest tym samym **uchylony** —
uchyla go sam właściciel, po przedstawieniu powyższej arytmetyki. Kalibracja D3 (100%
osiągalne po komplecie budynków epoki, mianownik celowo niższy od sumy budynków)
**nie zmienia się** — zmieniają się wyłącznie wartości mianownika.

### D4. `prawo_max_pop_wspolczynnik` = 0,04

**Zmiana wobec pierwotnej decyzji o płaskim mianowniku.** Właściciel dołożył karę za wielkość
miasta: *„większe miasto wymaga większych nakładów i organizacji, żeby utrzymać prawo
na odpowiednim poziomie"*.

Wybrany mechanizm to **współczynnik w mianowniku**, nie kara addytywna — bo kara addytywna
rozwadnia się z epoką (przy `−2`/obywatela metropolia pop 20 dawałaby 25% w epoce 1, ale 67%
w epoce 3), czyli powtarzałaby defekt odrzucony przy szczęściu jako wariant W2.
Współczynnik daje **wynik niezależny od epoki**.

### D4a. ZASADA PROJEKTOWA — „większe miasto, większe problemy"

Słowa właściciela: *„Po prostu większe miasta trzeba będzie budować w kolejnych epokach.
Tam będą nowe budynki, które pozwolą zmniejszyć te kary za ludność i poprawić wielkość
prawa."*

**To jest wiążąca zasada na przyszłe epoki, nie obserwacja.** Rozrost miasta ma boleć,
a lekarstwem mają być NOWE BUDYNKI kolejnych epok — nie łagodzenie współczynnika.

Ile obywateli każda epoka realnie potrafi rządzić (populacja, przy której miasto zwykłe
z kompletem budynków ma dokładnie 100%):

| Epoka | Budynki | `prawMax` | Zapas | **pop przy 100%** |
|---|---|---|---|---|
| 1 | 53 | 40 | 1,325 | **9,2** |
| 2 | 85 | 75 | 1,133 | **5,2** |
| 3 | 121 | 100 | 1,210 | **6,9** |

**Epoka 2 jest najciaśniejsza** — udźwignie tylko miasto pięcioosobowe. To wyjaśnia dołek
90% przy pop 8 w tej epoce. Świadomie nie wyrównane; gdyby właściciel chciał krzywą płaską,
epoka 2 powinna mieć `prawMax` ok. **64** zamiast 75.

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

### D6. Bonus osiedla dla Prawa ZOSTAJE bez zmian

`prawo_bonus_osiedle_pop` = **28 / 20 / 14 / 8** dla pop 1–4. Przy `prawMax` 53 daje osadzie
pop 1 aż 53% Prawa bez jednego budynku — właściciel przyjął to świadomie, bo wczesna gra ma
być łagodna, a osada i tak nie zdąży nic zbudować.

### D7. `prawo_pct_cap` = 170

Podniesiony ze 100. Powód: pałac (**+35 / +45 / +55**, tylko stolica) przy sufitie 100 był
całkowicie niewidoczny — stolica zawsze miała maksimum i nadwyżka przepadała. Przy 170
stolica pokazuje **166% / 153% / 145%** i wkład pałacu jest widoczny.

### D8. Budynek Garnizon włącza obronę cywilną (Milicję)

Warunek w `hasCityDefenders` (`siegeDefenders.ts:24-29`) rozszerzony o obecność budynku.
**Bez Garnizonu miasto bez wojska nadal pada bez bitwy** — to jest kara za brak budynku.
Milicja zachowuje `unbreakable: true`, bo Garnizon oznacza, że ci ludzie mają dowódców
i się nie rozbiegną.

Jeden budynek, dwa czytelne skutki: porządek wewnątrz i niemożność wejścia bez walki.

---

## 5. OTWARTE — wymagają decyzji właściciela

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


---

## 6. REGUŁA SKALOWANIA PRAWA PRZY DODAWANIU EPOK

Analogiczna do `dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md`.

### 6a. Wzór podstawowy

```
wymagane_budynki(P) = prawMax_epoki × 1,04 ^ (P − 2)
```

gdzie `P` to populacja, którą epoka ma umieć rządzić na poziomie 100%.

| pop docelowy | `prawMax` 120 | `prawMax` 140 | `prawMax` 160 |
|---|---|---|---|
| 8 | 152 | 177 | 202 |
| 10 | 164 | 192 | 219 |
| 12 | 178 | 207 | 237 |
| 15 | 200 | 233 | 266 |
| 20 | 243 | 284 | 324 |
| 25 | 296 | 345 | 394 |

Odczyt: żeby w epoce 4 (`prawMax` 120) miasto 12-osobowe miało 100%, komplet budynków Prawa
musi dawać **178 pkt** — czyli o 57 więcej niż 121 z epoki 3.

### 6b. Ile muszą rosnąć budynki

| Z pop | Na pop | Mnożnik budynków |
|---|---|---|
| 8 | 10 | 1,08× |
| 10 | 12 | 1,08× |
| 12 | 16 | 1,17× |
| 16 | 20 | 1,17× |
| 20 | 25 | 1,22× |

**Każde +4 obywateli wymaga ok. +17% Prawa z budynków. Podwojenie miasta z 10 na 20 wymaga
+48%.** To jest budżet, w którym muszą się zmieścić nowe budynki kolejnej epoki.

### 6c. Kolejność postępowania przy nowej epoce

1. Ustal, jak duże miasto ta epoka ma umieć rządzić (`P`).
2. Policz `wymagane_budynki(P)` wzorem z §6a.
3. Odejmij to, co niosą budynki poprzedniej epoki po zwinięciu łańcuchów ulepszeń —
   różnica to budżet Prawa dla nowych budynków epoki.
4. Rozdziel budżet między nowe budynki, pamiętając, że **Garnizon też powinien awansować**
   (25 → 35 → 47 → …), żeby jego udział nie spadał.
5. `prawo_max_epoka` **policz wzorem**, nie na oko (patrz §6e) — a wynik i tak musi
   wyjść **poniżej** sumy budynków, żeby małe miasto przebijało 100%.
6. Zweryfikuj scenariusze dla pop 2 / 8 / 12 / 20: komplet, bez Garnizonu, zero budynków —
   **przed** wpisaniem czegokolwiek do `society-params.json`.

### 6e. Jak wyliczyć `prawo_max_epoka` nowej epoki — wzór, nie wyczucie

Pierwotne 40 / 75 / 100 dobrałem „na oko, żeby zostawał zapas nad sumą budynków" i wyszło
z tego siodło: epoka 2 rządziła 5,2 obywatelami przy 9,2 w epoce 1 (D3b). Wzór poniżej
usuwa tę klasę pomyłki, bo bierze za punkt wyjścia to, co naprawdę projektujemy —
**jak duże miasto epoka ma umieć rządzić** — a nie zapas nad liczbą, która sama się zmienia.

```
prawo_max_epoka[normal] = suma_budynków_epoki / 1,04 ^ (P − 2)
prawo_max_epoka[easy]   = normal × 0,87      ← zaokrąglić do pełnych 5
prawo_max_epoka[hard]   = normal × 1,15      ← zaokrąglić do pełnych 5
```

`P` to populacja, którą epoka ma umieć rządzić na 100% na poziomie normalnym.
**`P` musi rosnąć z epoki na epokę** — to jest sens postępu administracyjnego i dokładnie
to, czego zabrakło w pierwszym podejściu.

Kontrola wsteczna (te trzy ratyfikowane wiersze wychodzą z wzoru co do cyfry):

| Epoka | budynki | `P` | normal | easy (×0,87) | hard (×1,15) |
|---|---|---|---|---|---|
| 1 | 53 | 9,2 | **40** | 34,8 → **35** | 46,0 → **45** |
| 2 | 85 | 8,8 | **65** | 56,6 → **55** | 74,8 → **75** |
| 3 | 121 | 11,0 | **85** | 74,0 → **75** | 97,8 → **100** |

Sugerowane `P` dla kolejnych epok: **13 / 15 / 17** — ciąg ma rosnąć wolniej niż budynki,
inaczej Prawo przestanie być ograniczeniem.

**Sprawdzian, który trzeba wykonać ZANIM cokolwiek trafi do `society-params.json`:**
policz „ilu obywateli epoka umie rządzić" (`P = 2 + ln(budynki / prawMax) / ln 1,04`) dla
wszystkich epok i wszystkich trzech trudności naraz i **spójrz na ciąg**. Jeśli gdziekolwiek
maleje — masz siodło, niezależnie od tego, jak sensownie wygląda pojedynczy wiersz.

### 6d. Czego NIE zmieniać przy nowej epoce

- **`prawo_max_pop_wspolczynnik` = 0,04** — kara za wielkość ma zostać stała. Lekarstwem
  na duże miasta są nowe budynki, nie łagodzenie współczynnika (zasada D4a).
- **Różnicowanie trudności WYŁĄCZNIE mianownikiem** (D3a) — nie dokładaj drugiego
  parametru per poziom. Współczynnik populacyjny, bonus osiedla, wagi budynków i garnizonu
  są płaskie z założenia.
- **`prawo_pct_cap` = 170** — zapas nad setką jest potrzebny, żeby pałac i nadwyżka małych
  miast były widoczne.
- **Jednostki wojskowe nie wchodzą do `prawMax`** (D1) — są doraźnym ratunkiem ponad skalą.
- **Bonus osiedla 28 / 20 / 14 / 8** — bez zmian (D6).
