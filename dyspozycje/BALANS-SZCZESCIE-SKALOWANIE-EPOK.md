# Szczęście — reguły skalowania przy dodawaniu epok

**Cel tego pliku:** gdy dojdzie epoka 4, 5 i dalsze, wszystkie parametry szczęścia mają dać
się wyliczyć **z reguł spisanych niżej**, bez ponownej analizy i bez pytania właściciela
o każdą liczbę osobno. Reguły odtworzono z decyzji właściciela z 2026-09-05.

**Zasada nadrzędna:** balans jest wyłącznie w gestii właściciela. Ten plik pozwala
**zaproponować** liczby zgodne z jego dotychczasowym zamysłem — nie zwalnia z pokazania ich
do zatwierdzenia. Operator AutoBota **nie stroi tych wartości samodzielnie**.

---

## 1. Wielkości wejściowe, które trzeba policzyć dla nowej epoki

| Symbol | Co to | Skąd |
|---|---|---|
| `BUD(e)` | suma szczęścia z budynków szczęściodajnych **stojących** w epoce e | `buildings.json`, po zwinięciu łańcuchów `upgradeFrom` |
| `NSUR(e)` | liczba surowców wymaganych w epoce e | `citizen-resource-upkeep.json → epoki[].surowce` |

**UWAGA na łańcuchy ulepszeń.** Ulepszenie **usuwa** poprzednika z `builtIds`
(`building-resource-gate.ts:357`). Miasto z kompletem ma **11 / 23 / 31** budynków, nie
11 / 26 / 39. Liczenie poprzedników razem z ulepszeniami zawyża `BUD` i psuje całą kalibrację.

Wartości historyczne: `BUD` = **14 / 25 / 42**, `NSUR` = **2 / 4 / 5**.

---

## 2. Które budynki dają szczęście

Kryterium właściciela: **czy mieszkaniec z budynku korzysta, czy tylko państwo albo wojsko.**

- **TAK:** Zdrowie, Religia, Kultura, Żywność, Handel (Targowisko, Porty), oraz z Administracji
  **tylko** Trybunał i Sąd.
- **NIE:** Produkcja, Obrona, Wojsko, oraz Dom Starszyzny, Dwór Zarządcy, Pretorium.

Ryczałt `+1` za budynek **zostaje**, ale wyłącznie dla listy TAK. Nowy budynek w przyszłej
epoce klasyfikuje się tym samym kryterium.

---

## 3. Reguły skalowania parametrów

### 3a. Kultura i religia — rosną z epoką

```
x(e) = 0,3846 × ( BUD(e) + 8 + 2 × NSUR(e) )
```

Kultura = religia = `x(e)`, zaokrąglone do liczby całkowitej.
Odtwarza zatwierdzone **10 / 16 / 23** (epoki 1–3) co do jedności.

Obie liczone **proporcjonalnie do udziału własnej**:
```
szczęście = 2·x × udział_własnej − x        (100% własnej = +x, 100% obcej = −x, zero na 50/50)
```

**Stała `8` w formule jest historyczna** — pochodzi z wartości podatków obowiązującej
w momencie wyprowadzenia. Zostawiona świadomie, żeby formuła odtwarzała zatwierdzone liczby.

**Znany skutek, przyjęty:** udział kultury i religii w puli dodatniej lekko **rośnie**
z epoką (34,5% → 37,7% → 39,0%). Gdyby właściciel chciał udział dokładnie stały,
formuła brzmi `x(e) = 0,2632 × (BUD(e) + 20 + 2 × NSUR(e))` i daje 10 / 14 / 19 —
**nie jest to wersja zatwierdzona.**

### 3b. Pozycje PŁASKIE — nie skalują się z epoką

| Pozycja | Wartość | Uwaga |
|---|---|---|
| Wealth | **+10** max | osiągane przy **capie poziomu epoki**, patrz 3c |
| Podatki | **−10 … +10** | liniowo, 0% Zamożności = −10, 90% = +10 |
| Wojna | **−5** | |
| Bonus osiedla (pop 1–4) | **15 / 12 / 8 / 5** | pop ≥ 5 = 0 |

### 3c. Wealth — max stały, próg rosnący

```
szczęście = floor( poziom_W × 10 / cap_epoki ),    cap_epoki = epoka × 10
```
Maksimum **+10 w każdej epoce**, ale poziom potrzebny rośnie: 10 → 20 → 30 → 40…
**To zmiana kodu, nie parametru** — `wealthZadowolenie` (`wealth.ts:112`) musi dostać epokę,
której dziś nie ma w sygnaturze.

### 3d. Zaopatrzenie obywateli

`+2` za każdy dostarczony surowiec epoki, `−1` za brakujący. Skaluje się samo przez `NSUR(e)`.
**Asymetria +2 / −1 jest świadoma** — właściciel zmienił tylko stronę dodatnią.

### 3e. Mianownik `szczescie_max_epoka`

Wartość = **scenariusz optymistyczny przy pop 8**, czyli:
```
szMax(e) ≈ BUD(e) + 2·x(e) + 10 (Wealth) + 10 (podatki) + 2·NSUR(e)
```
…po czym właściciel **koryguje ją w dół według uznania**, żeby ustawić poprzeczkę.
Historycznie: wyliczone 58 / 85 / 118 → zatwierdzone **30 / 50 / 70** (normalny).

Per poziom trudności:

| | Epoka 1 | Epoka 2 | Epoka 3 |
|---|---|---|---|
| easy | 20 | 40 | 60 |
| **normal** | **30** | **50** | **70** |
| hard | 35 | 55 | 80 |

**Trudność wyrażana jest WYŁĄCZNIE przez `szczescie_max_epoka`.** Wszystkie pozostałe
parametry mają te same wartości na easy / normal / hard. To świadome uproszczenie wobec
stanu sprzed zmiany, gdzie prawie każdy parametr miał osobną trójkę i strojenie było
nieprzewidywalne.

### 3f. Wielkość miasta — JEDEN mechanizm

`szczescie_max_pop_wspolczynnik` = **0,048**, `szczescie_max_pop_odniesienia` = **2**.
Wielkość działa **wyłącznie przez mianownik**.

**Usunięte:** stare zagęszczenie (`szczescie_kara_wielkosc_miasta` −0,75 powyżej pop 5)
**oraz** rozważana kara −1 za każdego obywatela. Trzymanie ich razem ze współczynnikiem
było potrójnym liczeniem tej samej rzeczy.

Powód wyboru współczynnika zamiast kary addytywnej: **wynik nie zależy od epoki**.
Metropolia pop 20 daje ok. 70% w każdej epoce, zamiast robić się z czasem coraz łatwiejsza.

### 3g. Sufit

`szczescie_pct_cap` = **120**, bez zmian.

**Cap NIE jest kosmetyką.** `szPct` wchodzi do `computePorPct`
(`society-breakdown.ts:800-809`): `PorPct = min(cap, 0,5 × szPct + 0,5 × prawPct)`,
a `PorPct` steruje mnożnikami produkcji, pieniądza, nauki, kultury, wzrostu i `revoltRisk`.
Podniesienie capu pozwoliłoby zastąpić Prawo nadmiarem szczęścia.

---

## 4. Usunięte pozycje — NIE przywracać przy nowych epokach

Cztery wiersze liczyły to samo drugi raz i **wprowadzały gracza w błąd**:

| Wiersz | Dlaczego zniknął |
|---|---|
| `szczescie_swiatynia` +1 | Świątynia jest już liczona jako budynek (+3) |
| `szczescie_amfiteatr` +1 | Teatr (+4) i Akademia (+4) są już liczone jako budynki |
| `Ceramika (dostęp)` +1 | ceramika liczy się jako zwykły surowiec zaopatrzenia |
| `Spichlerz działający` +1 | Spichlerz jest liczony jako budynek (+5) |

---

## 5. Prognoza dla przyszłych epok

Przy `x = 0,3846 × (BUD + 8 + 2·NSUR)`:

| `BUD` | `NSUR` | kultura = religia | `szMax` wyliczony (opt. netto) |
|---:|---:|---:|---:|
| 42 | 5 | 23 | 118 |
| 55 | 6 | 29 | 145 |
| 70 | 6 | 35 | 172 |
| 85 | 7 | 41 | 201 |
| 100 | 8 | 48 | 232 |

Kolumna `szMax` to **wartość wyjściowa do rozmowy**, nie gotowa liczba — właściciel
historycznie obniżał ją o ok. 40–50% (118 → 70 w epoce 3).

---

## 6. Pozycje NIEROZSTRZYGNIĘTE — wymagają decyzji przy najbliższej okazji

- **Kara za brakujący surowiec** `−1` wobec `+2` za dostarczony. Symetria wymagałaby `−2`.
- **Kara „obca religia" `−4`** jako osobny wiersz (`society-breakdown.ts:590`) — po przejściu
  religii na skalę proporcjonalną miasto z obcą religią dostanie `−x` z linii religii
  **plus** `−4` z tego wiersza, a za obcą kulturę tylko `−x`. Kandydat do usunięcia.
- **Podbój: obca kultura i religia naraz** `−2` — czy skalować z epoką.
- **Trzy martwe parametry** bez ani jednego użycia w `gra/src`:
  `szczescie_kara_obca_kultura` (−2), `szczescie_bonus_produkcja_wartosc` (0,1),
  `szczescie_bonus_wzrost_wartosc` (0,1).
- **Rzeka** daje dziś `+2 Zdrowia` (`zdrowie_rzeka`), a **nie szczęścia** — do rozstrzygnięcia,
  czy ma dawać także szczęście.

---

## 7. Cuda świata — decyzja właściciela 2026-09-05

Wszystkie sześć cudów dających szczęście podniesione do **+10 każdy**:
`koloseum`, `roquepertuse`, `stupa_sanchi`, `mundo_perdido`, `palac_weiyang`, `posag_peruna`
(było: 6 / 3 / 3 / 3 / 3 / 3).

**Bonus działa na KAŻDE miasto właściciela** (`main.ts:3393`, `wonderCityYieldBonusForOwner`).
Zmierzona waga przy `szMax` normalnym, miasto pop 8:

| Ile cudów | Punkty | % epoka 1 | % epoka 2 | % epoka 3 |
|---:|---:|---:|---:|---:|
| 1 | 10 | 25% | 15% | 11% |
| 3 | 30 | 76% | 45% | 32% |
| 6 | 60 | **151%** | **91%** | **65%** |

Cała pula dodatnia bez cudów to 58 / 85 / 118 punktów, więc **sześć cudów daje więcej niż
cała reszta razem w epoce 1**. Właściciel został o tym poinformowany; wartość +10 jest jego
świadomym wyborem.

---

## 8. Kolejność wprowadzania przy nowej epoce

1. Policz `BUD(e)` **po zwinięciu łańcuchów ulepszeń** i `NSUR(e)`.
2. Sklasyfikuj nowe budynki wg kryterium z §2.
3. Policz `x(e)` wzorem z §3a → kultura i religia.
4. Wealth, podatki, wojna, bonus osiedla — **bez zmian**, wartości płaskie z §3b.
5. Zaopatrzenie skaluje się samo przez `NSUR(e)`.
6. Policz `szMax(e)` wzorem z §3e, **przedstaw właścicielowi do korekty w dół**.
7. Poziomy trudności: easy ≈ −33%, hard ≈ +15% wobec normalnego (proporcje historyczne).
8. Zweryfikuj trzy scenariusze (optymistyczny, realistyczny, minimalny) dla pop 2/5/8/12/20
   **przed** wpisaniem czegokolwiek do `society-params.json`.
