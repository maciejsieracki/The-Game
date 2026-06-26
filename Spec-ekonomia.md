# Specyfikacja Ekonomii — „The Game" (Epoki: Kamień + Brąz)

> **Jedyne źródło prawdy dla wzorów ekonomicznych.** Zakres: Epoka Kamienia i Epoka Brązu (v0.1–v0.2).
> Spójna z: `PROJEKT-GRY-master.md` (§2, §2a, §2b, §8), `Schemat-dzialania-miasta.md`, `Plony-terenow.xlsx`, `Budynki.xlsx`.
> Ostatnia aktualizacja: 2026-06-21.
>
> Wartości oznaczone **[PT]** = *placeholder do strojenia* — liczba jest domyślna, wymaga playtestów przed finalizacją.

---

## Spis sekcji

1. [Ekonomia / turę](#1-ekonomia--turę)
2. [Podział Handlu — suwak](#2-podział-handlu--suwak)
3. [Podział Pracy — suwak](#3-podział-pracy--suwak)
4. [Wzrost miast](#4-wzrost-miast)
5. [Korupcja i marnotrawstwo](#5-korupcja-i-marnotrawstwo)
6. [Utrzymanie jednostek i budynków](#6-utrzymanie-jednostek-i-budynków)
7. [Magazyny — pojemność](#7-magazyny--pojemność)
8. [Skarbiec centralny](#8-skarbiec-centralny)

---

## 1. Ekonomia / turę

Wszystkie wartości obliczane są co turę, osobno dla każdego miasta. Źródłem danych są **pola okolicy aktualnie obrabiane przez przypisanych pracowników** (nie wszystkie pola w zasięgu — tylko te z przypisaną ludnością).

### 1.1 Plony bazowe terenów (na obrabiane pole / turę)

Źródło: `Plony-terenow.xlsx`, arkusz „Tereny".

| Teren | Żywność | Praca | Handel | Drewno | Kamień |
|---|---|---|---|---|---|
| Łąka | 4 | 1 | 1 | 1 | 0 |
| Równina | 2 | 1 | 1 | 2 | 1 |
| Wzgórza | 1 | 2 | 0 | 2 | 2 |
| Góry | 0 | 0 | 0 | 2 | 5 |
| Wybrzeże | 3 | 2 | 2 | 0 | 0 |
| Morze | 2 | 0 | 2 | 0 | 0 |
| Pustynia | 0 | 0 | 1 | 0 | 0 |

**Modyfikatory (nakładki, dodawane do pola bazowego):**

| Nakładka | Żywność | Praca | Handel | Drewno | Kamień |
|---|---|---|---|---|---|
| Rzeka | +3 | +2 | +2 | 0 | 0 |
| Las | −1 | 0 | −1 | +3 | 0 |

> Przykład: Łąka + Rzeka = żywność 7, Praca 3, Handel 3, Drewno 1.
> Łąka + Las = żywność 3, Praca 1, Handel 0, Drewno 4.
> Kamień i Ruda na Wzgórzach/Górach dostępne dopiero po wybudowaniu Kopalni.

### 1.2 Praca brutto / turę

```
Praca_brutto = Σ Plony_Pracy(obrabianych_pól) + Σ Bonusy_Pracy(budynków)
```

**Bonusy budynków do Pracy:**

| Budynek | Efekt na Pracę |
|---|---|
| Młyn | +2 Pracy lokalnie ORAZ ×2 do całej Pracy bazowej [PT: wartość ×2 do weryfikacji] |
| Cegielnia | +25% Pracy lokalnie [PT] |

**Wzór Pracy brutto z Młynem:**

```
Praca_brutto = (Σ Plony_Pracy(pól) × 2) + 2   [gdy Młyn wybudowany]
Praca_brutto = Σ Plony_Pracy(pól)               [bez Młyna]
```

> **Przykład liczbowy:** miasto obrabia 4 pola Łąki (po 1 Praca/pole) + 2 pola Wzgórz (po 2 Praca/pole) = brutto 8. Z Młynem: (8 × 2) + 2 = 18 Pracy brutto. [PT: mnożnik Młyna]

### 1.3 Handel brutto / turę

```
Handel_brutto = Σ Plony_Handlu(obrabianych_pól) × Mnożnik_Targowiska + Bonus_Specjalistów
```

**Bonusy budynków do Handlu:**

| Budynek | Efekt |
|---|---|
| Targowisko | +50% Handlu lokalnie [PT] |

```
Handel_brutto = Σ Plony_Handlu(pól) × 1,5   [gdy Targowisko]
Handel_brutto = Σ Plony_Handlu(pól)          [bez Targowiska]
```

Specjalista Poborca: +2 Pieniądza/turę (bezpośrednio do Pieniądza, nie do Handlu).

> **Przykład liczbowy:** miasto obrabia 3 pola Łąki (po 1 Handel) + 2 pola Wybrzeża (po 2 Handel) = brutto 7. Z Targowiskiem: 7 × 1,5 = 10,5 → zaokrąglamy w dół = 10 Handlu brutto. [PT: zaokrąglanie]

### 1.4 Żywność netto / turę

```
Żywność_netto = Σ Plony_Żywności(obrabianych_pól) − Zużycie_Żywności
```

```
Zużycie_Żywności = Liczba_Ludności × 1 + Liczba_Jednostek_Wojskowych × 1
```

> Jednostki wojskowe w mieście i w polu: 1 żywność/turę/jednostkę.
> Armia obozująca: 0,5 żywności/turę/jednostkę (patrz §6).

```
Żywność_netto > 0  → nadwyżka trafia do Spichlerza (jeśli wybudowany)
Żywność_netto = 0  → brak wzrostu, brak ubytku
Żywność_netto < 0  → głód; populacja może spaść [PT: próg i tempo ubytku]
```

> **Przykład liczbowy:** miasto z 5 ludnością i 3 jednostkami wojskowymi. Obrabia 4 Łąki (po 4 żywności) = 16 żywności brutto. Zużycie = 5 + 3 = 8. Netto = +8 żywności/turę, trafia do Spichlerza.

### 1.5 Materiały z pól / budynków

Drewno, Kamień, Ruda — zbierane bezpośrednio z obrabianych pól i trafiają do Magazynu Surowców (patrz §7). Budynki przetwórcze przeliczają surowce wejściowe na wyjściowe w proporcji 1:1, do swojej przepustowości/turę:

| Budynek | Wejście/turę | Wyjście/turę | Przepustowość |
|---|---|---|---|
| Tartak | 1 drewno | 1 deska | maks 2/t [PT] |
| Mielerz | 1 drewno | 1 paliwo | maks 2/t [PT] |
| Cegielnia | 1 glina + 1 paliwo | 1 cegła | maks 2/t [PT] |
| Huta | 1 ruda + 1 paliwo | 1 brąz | maks 1/t [PT] |
| Garncarnia | 1 glina + 1 paliwo | 1 ceramika | maks 1/t [PT] |

Produkcja jest automatyczna; wstrzymuje się przy braku surowca wejściowego lub pełnym magazynie.

---

## 2. Podział Handlu — suwak

Gracz ustawia **suwak procentowy** dzielący Handel netto (po korupcji, patrz §5) na trzy strumienie.

### 2.1 Wzór

```
Handel_netto = Handel_brutto × (1 − Korupcja%)

Nauka    = Handel_netto × Nauka%
Pieniądz = Handel_netto × Pieniądz%
Luksus   = Handel_netto × Luksus%

gdzie: Nauka% + Pieniądz% + Luksus% = 100%
```

### 2.2 Efekty strumieni

| Strumień | Efekt |
|---|---|
| **Nauka** | Punkty badań / turę; napędza drzewko technologii |
| **Pieniądz** | Trafia do centralnego Skarbca (patrz §8); kupno/utrzymanie jednostek i budynków |
| **Luksus** | +Zadowolenie mieszkańców; redukuje niezadowolenie [PT: przelicznik Luksus → Zadowolenie, np. 5 Luksusu = +1 zadowolony mieszkaniec] |

### 2.3 Kurs Handlu na Pieniądz

- **Przed technologią Waluta** (Epoka Kamienia): Handel pełni funkcję substytutu Pieniądza; kurs 1:1 (1 Handel = 1 Pieniądz).
- **Po Walucie + Mennicy**: Mennica zamienia Handel na Pieniądz ze wzmocnieniem — mnożnik Mennicy [PT: domyślnie ×1,0, docelowo ×1,5–×2,0 po upgradzie].

### 2.4 Domyślne ustawienie suwaka

```
Domyślnie: 60% Nauka / 30% Pieniądz / 10% Luksus   [PT: do weryfikacji]
```

Gracz może zmieniać suwak dowolnie co turę.

> **Przykład liczbowy:** Handel netto = 10. Korupcja 10% → Handel netto po korupcji = 9. Przy suwaku 60/30/10: Nauka = 5,4 → 5 [PT: zaokrąglanie]; Pieniądz = 2,7 → 2; Luksus = 0,9 → 0. Łącznie 7 (reszta odpada przez zaokrąglenie [PT: mechanizm reszty]).

---

## 3. Podział Pracy — suwak

Gracz ustawia **suwak procentowy** dzielący Pracę netto (po marnotrawstwie, patrz §5) na dwa strumienie.

### 3.1 Wzór

```
Praca_netto = Praca_brutto × (1 − Marnotrawstwo%)

Praca_BUDYNKI      = Praca_netto × PracaBudynki%
Praca_TEREN        = Praca_netto × PracaTeren%

gdzie: PracaBudynki% + PracaTeren% = 100%
```

### 3.2 Efekty strumieni

| Strumień | Efekt |
|---|---|
| **Praca → BUDYNKI** | Zasila kolejkę produkcji miasta; gdy zebrana Praca ≥ koszt budynku → budynek gotowy |
| **Praca → TEREN** | Zasila budowę ulepszeń heksów przez Robotnika (Farma, Irygacja, Droga, Kopalnia, Pastwisko itp.) |

### 3.3 Domyślne ustawienie suwaka

```
Domyślnie: 70% Budynki / 30% Teren   [PT: do weryfikacji]
```

Gracz może zmieniać suwak co turę. Wstrzymanie kolejki produkcji nie przenosi automatycznie Pracy na Teren — gracz musi przestawić suwak.

### 3.4 Wykup budynku za Pieniądz

```
Koszt_wykupu = Pozostała_Praca_do_ukończenia × 1   [kurs 1 Pieniądz = 1 Praca]
```

> **Przykład liczbowy:** Praca netto = 12. Marnotrawstwo 0% (stolica). PracaBudynki% = 70%, PracaTeren% = 30%.
> Do kolejki budynków trafia: 12 × 0,70 = 8,4 → 8 Pracy/turę.
> Na ulepszenia terenu: 12 × 0,30 = 3,6 → 3 Pracy/turę.
> Budynek o koszcie 20 Pracy ukończy się w ⌈20 / 8⌉ = 3 turach.

---

## 4. Wzrost miast

### 4.1 Spichlerz i kumulacja żywności

- **Bez Spichlerza:** nadwyżka żywności przepada co turę; wzrost z zapasów jest **niemożliwy**.
- **Ze Spichlerzem:** nadwyżka żywności kumuluje się w Magazynie Żywności; po przekroczeniu Progu Wzrostu miasto zyskuje +1 Ludności.

```
Magazyn_Żywności += Żywność_netto   [tylko przy wybudowanym Spichlerzu]
```

### 4.2 Próg wzrostu populacji

```
Próg_Wzrostu(N) = 10 + N × 8   [PT: współczynnik 8 do strojenia]
```

gdzie N = aktualna liczba Ludności.

| Ludność (N) | Próg wzrostu |
|---|---|
| 1 | 18 żywności |
| 2 | 26 żywności |
| 3 | 34 żywności |
| 5 | 50 żywności |
| 7 | 66 żywności |
| 10 | 90 żywności |

> **Przykład liczbowy:** miasto ma 3 ludność, Próg = 10 + 3×8 = 34. Żywność netto = +5/turę. Spichlerz wybudowany. Po 7 turach (7×5 = 35 ≥ 34) → +1 Ludność; miasto rośnie do 4. Przy wzroście Spichlerz zachowuje 50% zapasów: 35 × 0,50 = 17,5 → 17 (zaokrąglenie w dół). Nowy Próg dla N=4: 10 + 4×8 = 42.

### 4.3 Zachowanie Spichlerza po wzroście

```
Magazyn_Żywności_po_wzroście = Magazyn_Żywności × 0,50   [przy Spichlerzu]
Magazyn_Żywności_po_wzroście = 0                          [bez Spichlerza]
```

### 4.4 Modyfikator Zdrowia na wzrost

```
Tempo_Wzrostu = Żywność_netto × Modyfikator_Zdrowia
```

| Stan Zdrowia | Modyfikator wzrostu |
|---|---|
| Zdrowie > 0 | ×1,0 (normalny; tempo = żywność netto) [PT: może być ×1,0 + Zdrowie×0,05] |
| Zdrowie = 0 | ×0,0 — stagnacja (miasto nie rośnie mimo nadwyżki) |
| Zdrowie < 0 | Wzrost zablokowany; możliwy ubytek populacji [PT: −1 populacja co N tur przy Zdrowiu < 0] |

```
Modyfikator_Zdrowia = max(0, 1 + Zdrowie × 0,05)   [PT: współczynnik 0,05]
```

> **Przykład liczbowy:** Zdrowie = −2. Modyfikator = max(0, 1 + (−2)×0,05) = max(0, 0,90) = 0,90. Żywność netto = +4. Tempo efektywne = 4 × 0,90 = 3,6 → do Spichlerza trafia 3 zamiast 4. Przy Zdrowiu = −5: modyfikator = 0,75. Przy Zdrowiu ≤ −20: modyfikator = 0 → stagnacja. [PT: progi i wartości]

**Akwedukt:** odblokowuje wzrost powyżej 6 Ludności (bez niego populacja zatrzymuje się na max 6). [PT: próg odblokowania]

---

## 5. Korupcja i marnotrawstwo

### 5.1 Wzór

Korupcja i marnotrawstwo działają identycznym wzorem i redukują odpowiednio Handel i Pracę.

```
Strata% = min(50, Dystans_od_Stolicy × 2 + Liczba_Miast × 1)   [PT: współczynniki]
```

gdzie:
- `Dystans_od_Stolicy` = odległość centrum danego miasta od stolicy (w polach heksagonalnych)
- `Liczba_Miast` = łączna liczba miast gracza (włącznie ze stolicą)
- Wynik zawsze w przedziale **[0, 50%]** — maksymalne straty to 50%

```
Praca_netto  = Praca_brutto  × (1 − Strata%)
Handel_netto = Handel_brutto × (1 − Strata%)
Pieniądz ze skarbca (per miasto): Strata% potrąca też Pieniądz przed przekazem do skarbca
```

### 5.2 Wyjątek — stolica

Stolica ma zawsze `Dystans_od_Stolicy = 0`, więc:

```
Strata%(stolica) = min(50, 0 × 2 + Liczba_Miast × 1) = Liczba_Miast%
```

> Przy 5 miastach: stolica traci 5% z tytułu rozmiaru państwa.

### 5.3 Przykłady liczbowe

| Miasto | Dystans od stolicy | Liczba miast gracza | Strata% |
|---|---|---|---|
| Stolica | 0 | 1 | 1% |
| Stolica | 0 | 5 | 5% |
| Miasto 2 | 8 pól | 5 | min(50, 16+5) = 21% |
| Miasto 3 | 15 pól | 5 | min(50, 30+5) = 35% |
| Miasto 4 | 25 pól | 5 | min(50, 50+5) = 50% (cap) |

> **Pełny przykład:** Miasto 2 ma Pracę brutto = 10, Handel brutto = 8. Strata = 21%.
> Praca netto = 10 × (1 − 0,21) = 7,9 → 7 [zaokrąglenie]. Handel netto = 8 × 0,79 = 6,32 → 6.

---

## 6. Utrzymanie jednostek i budynków

### 6.1 Budynki — utrzymanie

Każdy budynek kosztuje **1 Pieniądz/turę** (potrącany ze Skarbca centralnego).

```
Utrzymanie_Budynki = Liczba_Budynków × 1 Pieniądz/turę
```

> Źródło: `Budynki.xlsx`, kolumna „Utrzymanie" — każdy budynek: 1 Pieniądz/t. [PT: wartość bazowa 1 dla wszystkich budynków; może być zróżnicowana per budynek w późniejszym balansie]

### 6.2 Jednostki wojskowe — utrzymanie

```
Utrzymanie_Jednostki = Liczba_Jednostek × Koszt_Utrzymania_Jednostki Pieniądz/turę
```

Koszt utrzymania per jednostkę: **1 Pieniądz/turę** (domyślny). [PT: konkretne wartości per typ jednostki w `Jednostki.xlsx`; planowane zróżnicowanie: milicja 0, standard 1, super-jednostka 2–3]

### 6.3 Żywność — jednostki wojskowe

```
Zużycie_Żywności_Jednostki = 1 żywność/turę/jednostkę   [jednostka w ruchu lub w garnizonie]
Zużycie_Żywności_Jednostki = 0,5 żywności/turę/jednostkę [jednostka obozująca]
```

> **Przykład liczbowy:** armia 4 jednostek w polu (nie obozuje) = 4 żywności/turę potrącane z magazynu żywności miasta macierzystego lub regionu. Ta sama armia obozująca = 2 żywności/turę. [PT: mechanizm przypisania żywności do armii w polu — czy z jednego miasta czy ogólna pula]

### 6.4 Bilans utrzymania (łączny / turę)

```
Utrzymanie_łączne = Utrzymanie_Budynki_wszystkich_miast + Utrzymanie_Jednostek
Saldo_Pieniądza = Pieniądz_ze_Skarbca − Utrzymanie_łączne
```

Przy `Saldo_Pieniądza < 0` → ostrzeżenie ⚠; po przekroczeniu rezerwy jednostki mogą się rozwiązywać lub budynki zamykać [PT: mechanizm bankructwa].

---

## 7. Magazyny — pojemność

### 7.1 Magazyn żywności (Spichlerz)

```
Pojemność_Żywności = Bazowa_Pojemność_Żywności                        [bez Spichlerza]
Pojemność_Żywności = Bazowa_Pojemność_Żywności × 5                    [ze Spichlerzem]
```

```
Bazowa_Pojemność_Żywności = 20   [PT: wartość bazowa]
Pojemność_ze_Spichlerzem  = 20 × 5 = 100
```

Nadwyżka żywności ponad pojemność **przepada** w tej samej turze.
Bez Spichlerza cała nadwyżka przepada co turę (efektywna pojemność = 0 dla kumulacji).

### 7.2 Magazyn surowców

```
Pojemność_Surowców = Bazowa_Pojemność_Surowców                        [bez Magazynu]
Pojemność_Surowców = Bazowa_Pojemność_Surowców × 5                    [z Magazynem]
```

```
Bazowa_Pojemność_Surowców = 10 na typ surowca   [PT: wartość bazowa per typ]
Pojemność_z_Magazynem     = 10 × 5 = 50 na typ surowca
```

Nadwyżka surowca ponad pojemność **przepada**.

### 7.3 Pojemność globalna państwa

```
Pojemność_Globalna = Σ Pojemność_Surowców(wszystkich miast)
```

Surowce można przenosić między magazynami (gdy jeden pełny, drugi ma miejsce).
Utrata miasta → surowce w jego magazynie przepadają.
Podbój miasta → zwycięzca przejmuje magazyn i jego zawartość.

> **Przykład liczbowy:** 3 miasta z Magazynem: łączna pojemność surowca X = 3 × 50 = 150. 1 miasto bez Magazynu: pojemność bazowa = 10. Razem: 160 jednostek surowca X w całym państwie. [PT: wartości bazowe]

---

## 8. Skarbiec centralny

### 8.1 Zasada lokalizacji

Pieniądz jest **globalny i centralny** — jeden Skarbiec, zawsze w stolicy.

```
Skarbiec += Σ Pieniądz_z_Handlu(wszystkich miast) × (1 − Strata%(każdego miasta))
Skarbiec += Σ Pieniądz_Specjalistów(Poborca)
Skarbiec += Pieniądz_z_Podatków   [PT: mechanika podatków do sprecyzowania]
Skarbiec −= Utrzymanie_łączne/turę
```

### 8.2 Przepływ Pieniądza

```
Pieniądz_lokalny_netto(miasto) = Handel_netto × Pieniądz% / 100

Skarbiec(tura_t+1) = Skarbiec(tura_t) 
                     + Σ Pieniądz_lokalny_netto(wszystkich miast)
                     − Utrzymanie_Budynki_wszystkich_miast
                     − Utrzymanie_Jednostek
```

### 8.3 Specjalne zdarzenia skarbcowe

| Zdarzenie | Efekt na Skarbiec |
|---|---|
| Utrata stolicy | Skarbiec zeruje się do 0 |
| Nowa stolica | Nowy pusty Skarbiec powstaje w nowej stolicy |
| Podbój obcej stolicy | Skarbiec wroga przechodzi do gracza (cały Pieniądz wrogiego Skarbca) |

### 8.4 Kurs bazowy

```
1 Pieniądz = 1 Praca   [kurs bazowy wymiany]
```

> **Przykład liczbowy:** 4 miasta z Handlem netto odpowiednio: 10, 8, 6, 4 po korupcji. Pieniądz% suwaka = 30%.
> Wpływy do Skarbca: (10+8+6+4) × 0,30 = 28 × 0,30 = 8,4 → 8 Pieniędzy/turę.
> Utrzymanie: 12 budynków × 1 + 5 jednostek × 1 = 17 Pieniędzy/turę.
> Saldo Skarbca: 8 − 17 = −9 Pieniędzy/turę → deficyt ⚠. [PT: mechanizm ujemnego salda]

---

## Podsumowanie placeholderów do strojenia [PT]

| Sekcja | Parametr | Wartość domyślna | Status |
|---|---|---|---|
| §1.2 | Mnożnik Młyna na Pracę | ×2 (+2) | [PT] |
| §1.2 | Bonus Cegielni do Pracy | +25% | [PT] |
| §1.3 | Bonus Targowiska do Handlu | +50% | [PT] |
| §2.2 | Przelicznik Luksus → Zadowolenie | 5 Luksusu = +1 | [PT] |
| §2.3 | Mnożnik Mennicy (Handel→Pieniądz) | ×1,0 (docelowo ×1,5–×2,0) | [PT] |
| §2.4 | Domyślny podział suwaka Handlu | 60% / 30% / 10% | [PT] |
| §3.3 | Domyślny podział suwaka Pracy | 70% / 30% | [PT] |
| §4.2 | Współczynnik Progu Wzrostu | N×8 | [PT] |
| §4.4 | Modyfikator Zdrowia na wzrost | ×0,05 per punkt Zdrowia | [PT] |
| §4.4 | Próg odblokowania wzrostu (Akwedukt) | 6 Ludności | [PT] |
| §5.1 | Strata% — współczynnik dystansu | ×2 per pole | [PT] |
| §5.1 | Strata% — współczynnik liczby miast | ×1 per miasto | [PT] |
| §5.1 | Cap korupcji | 50% | [PT] |
| §6.1 | Utrzymanie budynku | 1 Pieniądz/turę | [PT] |
| §6.2 | Utrzymanie jednostki (standard) | 1 Pieniądz/turę | [PT] |
| §7.1 | Bazowa pojemność żywności | 20 | [PT] |
| §7.2 | Bazowa pojemność surowca per typ | 10 | [PT] |

---

*Specyfikacja gotowa do implementacji. Wszystkie [PT] należy zweryfikować w playtestach przed v1.0.*
