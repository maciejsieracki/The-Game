# SPEC-Respekt — Model Respektu (Hard Power) w dyplomacji

**Dział:** CYWILIZACJE  
**Status:** ZATWIERDZONE przez Macieja (2026-06-25) — komponenty + wagi + formuła ratio-share. Wagi sterowalne w panelu (punkt startowy).  
**Data:** 2026-06-25  
**Plik implementacji:** `gra/src/game/diplomacy.ts`  
**Panel wag:** `gra/data/diplomacy.json` → `respekt_-_czynniki`

---

## A. Co to Respekt

Respekt = **relatywna potęga** nacji w oczach konkretnego partnera dyplomatycznego.

| Właściwość | Wartość |
|---|---|
| Skala | 0 … 100 |
| Znaczenie 50 | Parytet sił — żadna ze stron wyraźnie nie dominuje |
| Znaczenie > 50 | Jestem silniejszy — partner mnie powiada/boi się |
| Znaczenie < 50 | Jestem słabszy — partner ma przewagę siłową |
| Wartość startowa | 30 (lekko poniżej parytetu, bo historia bojowa = 0) |

Respekt jest **czysto relatywny** — ta sama absolutna siła nacji daje wyższy Respekt wobec słabego sąsiada i niższy wobec superpotęgi. Dzięki temu AI słabszej nacji zachowuje się inaczej niż AI równorzędnej — co jest sednem mechaniki.

Respekt to komponent `Relacji ogólnej` (Relacja = Zaufanie + Respekt, skala 0–200). Zaufanie = soft power (traktaty, gesty), Respekt = hard power (armia, historia, terytorium).

---

## B. Moc nacji (POTEGA) — komponenty

Przed wyliczeniem Respektu względem partnera każda nacja ma wewnętrzną wartość **Potęgi** (0–100). Jest to ważona suma 6 komponentów dostarczanych przez SILNIK (znormalizowane do zakresu [0,1]).

| Komponent | Klucz interfejsu | Waga startowa (%) | Uzasadnienie |
|---|---|---|---|
| Wielkość armii (absolutna liczba jednostek bojowych) | `wielkoscArmii` | **28** | Główny sygnał hard power — widoczna siła militarna; dominuje, bo Respekt = strach |
| Wygrane bitwy (historia bojowa, skumulowana) | `wygraneBitwy` | **20** | Trudno podrobić; sygnalizuje doświadczenie i agresywność |
| Ludność (mieszkańcy/jednostki w miastach) | `ludnosc` | **18** | Potencjał mobilizacyjny; więcej ludności = więcej rekrutów |
| Liczba miast (terytorium/imperium) | `miasta` | **14** | Większe imperium = więcej zasobów i zdolności produkcyjnych |
| Gospodarka (skarbiec/dochód) | `gospodarka` | **12** | Bogata nacja finansuje wojnę i łapówki dyplomatyczne |
| Epoka (postęp technologiczny) | `epoka` | **8** | Wyższa epoka = lepsza technologia wojskowa |
| **SUMA** | — | **100** | — |

**Uwaga:** Militaria łącznie (armia + bitwy) = **48%** wagi, bo Respekt = strach/powaga = hard power. To celowy sygnał projektowy: wygrywanie bitew i utrzymywanie dużej armii ma największy wpływ na to, jak traktują cię inni.

Komponenty dostarczane przez moduły SILNIKA:
- `UNITS` → `wielkoscArmii`, `wygraneBitwy`
- `MIASTO` → `ludnosc`, `miasta`
- `EKONOMIA` → `gospodarka`
- `CYWILIZACJE` / SILNIK globalny → `epoka`

---

## C. Algorytm — dwie warstwy

### Warstwa 1: potegaNacji (0–100)

Ważona suma znormalizowanych komponentów:

```
potegaNacji = clamp(round(
    wielkoscArmii * w_wielkoscArmii +
    wygraneBitwy  * w_wygraneBitwy  +
    ludnosc       * w_ludnosc       +
    miasta        * w_miasta        +
    gospodarka    * w_gospodarka    +
    epoka         * w_epoka
), 0, 100)
```

Gdzie każdy komponent ∈ [0,1] (0 = absolutna słabość, 1 = pełna dominacja w danym aspekcie), a wagi sumują się do 100.

Wynik: `potegaNacji` ∈ [0, 100].

### Warstwa 2: Respekt (ratio-share)

Respekt nacji A w oczach partnera B (= jak A postrzega siebie wobec B):

```
Respekt(A, B) = round( 100 * potega_A / (potega_A + potega_B) )

Guard: jeśli potega_A + potega_B == 0  →  Respekt = 50  (parytet, brak danych)
Clamp: wynik ∈ [0, 100]
```

Własności:
- 50 = parytet (obie nacje równie silne)
- > 50 = A silniejszy niż B
- < 50 = A słabszy niż B
- Odporne na skalę: podwojenie sił obu stron nie zmienia Respektu
- Asymetryczne: `Respekt(A,B) + Respekt(B,A) = 100` (jeśli A dominuje, B ulega)

---

## D. Turniej formuły relatywizacji — warstwa 2

Porównanie trzech wariantów relatywizacji potęgi do skali Respektu (0–100).

Rubryki (0–3):
- **Intuicyjność / 50=parytet** — czy 50 oznacza naturalny parytet?
- **Zachowanie przy dużej przewadze** — czy słaby wyraźnie widzi, że powinien ulec?
- **Koszt** — prostota implementacji
- **Stabilność** — odporność na ekstremalne wartości wejściowe

| Kryterium (0–3) | V1 ratio-share | V2 log-ratio | V3 linear-clamp |
|---|---|---|---|
| Intuicyjność / 50=parytet | **3** | 2 | 2 |
| Zachowanie przy dużej przewadze | **3** | 3 | 2 |
| Koszt implementacji | **3** | 2 | 3 |
| Stabilność (guard 0+0) | **3** | 2 | 2 |
| **Łącznie** | **12/12** | **9/12** | **9/12** |

**Wzory:**

- V1 ratio-share: `100 * self / (self + partner)` — zwycięzca
- V2 log-ratio: `50 + 50 * tanh(ln(self/partner) / 2)` — logarytmiczne wygładzenie, trudny guard przy partner=0
- V3 linear-clamp: `clamp(50 + (self - partner), 0, 100)` — intuicyjny ale niestabilny przy dużych wartościach bezwzględnych

**Zwycięzca: V1 ratio-share.**

Uzasadnienie: formuła ratio-share daje naturalny 50 przy parytecie, silny sygnał przy dużej przewadze (np. potega 80 vs 20 → Respekt = 80), nie wymaga specjalnego obsłużenia logarytmów, jest odporna na skalę i ma prosty guard dla przypadku 0+0. Słaby gracz (np. potega 10 vs 70) dostaje Respekt = 12 — wyraźny sygnał, że powinien ulec zamiast atakować.

---

## E. Relatywna moc → dyplomacja AI (sedno Macieja)

Respekt jest wspólnym "kursem wymiany siły" między nacjami: słabszy ULEGA wpływowi silniejszego zamiast go atakować — to jest cel całej mechaniki.

### Konkretne progi w ai.ts / decideAIReaction

| Respekt wzgledny | Zachowanie AI |
|---|---|
| ≤ 0.25 | `oferuj_trybut_za_pokoj` — bardzo słaby, płaci trybut by uniknąć konfliktu |
| ≤ 0.40 | `zaproponuj_pokoj` — słaby, nie atakuje, szuka pokoju |
| 0.40–0.70 | neutralne negocjacje, normalne zachowanie dyplomatyczne |
| ≥ 0.70 | `zadaj_trybut` — silny, żąda trybutu od słabszych |

### Konkretne progi w decideAIReaction (ruch jednostek)

| Respekt | Reakcja |
|---|---|
| < 0.40 | `odwrot` — AI cofa jednostki, nie atakuje silniejszego |
| ≥ 0.40 | Normalny ruch/atak |

### Mechanizm wpływu

`computeRespekt` → `potegaNacji` (per nacja, raz/turę) → `Respekt(self, partner)` = ratio-share → `respektWzgledny` (0..1 = Respekt/100) → progi AI.

SILNIK wywołuje `computePotegaNacji` raz na turę per nacja, potem `computeRespekt(potega_A, potega_B)` per para, wynik zapisuje do `RelacjaDyplomatyczna.respekt`.

---

## F. Kto co liczy

| Moduł | Odpowiedzialność |
|---|---|
| **UNITS** | Dostarcza `wielkoscArmii` (liczba jednostek bojowych, norm. [0,1]) + `wygraneBitwy` (skumulowane, norm.) |
| **MIASTO** | Dostarcza `ludnosc` (sumaryczna ludność, norm.) + `miasta` (liczba miast, norm.) |
| **EKONOMIA** | Dostarcza `gospodarka` (skarbiec/dochód, norm.) |
| **SILNIK (globalny)** | Dostarcza `epoka` (indeks epoki, norm.: Kamień=0, Brąz=0.5, Żelazo=1.0 itp.) |
| **CYWILIZACJE** | Implementuje `computePotegaNacji(komponenty, wagi)` + `computeRespekt(potega_self, potega_partner)` + wagi w panelu `diplomacy.json` |
| **Maciej (panel)** | Stroi wagi w `gra/data/diplomacy.json` → `respekt_-_czynniki` |

Normalizacja komponentów leży po stronie SILNIKA — CYWILIZACJE dostaje już znormalizowane wartości [0,1] i stosuje wyłącznie wzory matematyczne (czyste funkcje, bez odczytu modułów zewnętrznych).

---

## G. Do akceptacji Macieja

Proszę o potwierdzenie (TAK / zmień / pytanie) czterech punktów:

1. **Zestaw 6 komponentów OK?**  
   `wielkoscArmii, wygraneBitwy, ludnosc, miasta, gospodarka, epoka`  
   Czy wszystkie 6 są właściwe? Czy czegoś brakuje lub co usunąć?

2. **Wagi startowe OK? (panel-tunable)**  
   `28 / 20 / 18 / 14 / 12 / 8` (suma 100). Militaria (armia+bitwy) = 48%.  
   Czy proporcje oddają intencję "strach/hard power"?

3. **Formuła relatywizacji = ratio-share OK?**  
   `Respekt = round(100 * potega_self / (potega_self + potega_partner))`  
   50 = parytet, >50 = jesteś silniejszy. Guard: 0+0 → 50.

4. **Czy dodać / usunąć komponent?**  
   Np. `reputacja` (ile razy dotrzymałeś słowa), `zasięg terytorialny`, `sojusznicy`?  
   Domyślna odpowiedź = nie (wagi = 0 dezaktywują komponent bez zmiany kodu).

---

*Implementacja: `gra/src/game/diplomacy.ts` — funkcje `computePotegaNacji` + nowa sygnatura `computeRespekt(potegaSelf, potegaPartner)`.*  
*Wagi: `gra/data/diplomacy.json` → sekcja `respekt_-_czynniki` (6 wpisów).*
