# EKONOMIA — Definicja „rozwoju" (4. kubełek) i ujednolicony model suwaka

**Data:** 2026-06-25  
**Autor:** Sonnet-subagent, sesja Civ-EKONOMIA  
**Status:** PROJEKT (analiza + rekomendacje, bez zmian w kanonicznym kodzie)

---

## 1. Mapa stanu obecnego — 3 suwaki, co który dzieli

### 1.1 Suwak podziału Handlu (`economy.ts` Step 7+8, linie 466–481)

**Wejście:** `handelNetto` (Handel brutto po korupcji)

**Podział (linie 467–469):**
```
pctNauka    = city.podziałHandlu.procentNauka    / 100   // domyślnie 60%
pctPieniadz = city.podziałHandlu.procentPieniadz / 100   // domyślnie 30%
pctLuksus   = city.podziałHandlu.procentLuksus   / 100   // domyślnie 10%
```

**3 strumienie wyjściowe:**
- `naukaZHandlu    = floor(handelNetto * pctNauka)` → sumuje z naukaBudynkow → `naukaLokalna` (linia 480)
- `pieniadzZHandlu = floor(handelNetto * pctPieniadz * ctx.mennicaMnoznik)` → wchodzi do `pieniadzTotal` (linia 483)
- `luksusZHandlu   = floor(handelNetto * pctLuksus)` → pole `luksus` w CityYieldResult (linia 501)

**Domyślne wartości** (z `turn-economy.ts` linie 114–116):
```
suwaakHandelNaukaDefault = 60%
suwaakHandelPieniadz     = 30%
suwaakHandelLuksus       = 10%
```

### 1.2 Suwak podziału Pracy (`production.ts` linie 541–547)

```typescript
export function splitPraca(
  cityPraca: number,
  udzialBudynki: number  // ułamek [0,1]; domyślnie 70% (suwak_praca_budynki_domyslnie)
): { doBudynkow: number; doPuli: number }
```

**Wejście:** `cityPraca` (Praca netto po korupcji)  
**2 strumienie wyjściowe:**
- `doBudynkow = cityPraca * udzialBudynki` → zasila kolejkę produkcji (budynki/jednostki)
- `doPuli     = cityPraca * (1 - udzialBudynki)` → idzie do globalnej puli/skarbca Pracy

**Domyślne wartości** (`turn-economy.ts` linie 117–118):
```
suwaakPracaBudynki = 70%
suwaakPracaTeren   = 30%
```

> **UWAGA:** `splitPraca` jest zdefiniowana w `production.ts`, ale **NIE jest wywołana** w `turn-economy.ts::advanceCityEconomy()`. Obecny tick ekonomii (linia 314) wywołuje tylko `cityYieldPerTurn()` i `populationGrowth()`. `splitPraca` istnieje jako gotowy mechanizm, ale integracja z pętlą turową nie jest jeszcze podłączona.

### 1.3 Suwak „Nauka vs Pieniądz" opisany w `playerState.ts` — NIE istnieje jako oddzielny kod

Komentarz w `playerState.ts` (linie 17–28) opisuje istniejący mechanizm podziału Handlu z `economy.ts` — **nie ma tam trzeciego osobnego suwaka**.

---

## 2. Jak 4 kubełki Macieja mapują się na obecny kod

| Kubełek Macieja | Strumień w kodzie | Źródło | Plik/linia |
|---|---|---|---|
| **Produkcja** | `praca` (wynik `cityYieldPerTurn`) | terrain Praca + mnożniki budynków | `economy.ts` l.497; `splitPraca.doBudynkow` |
| **Pieniądz** | `pieniadz` = `pieniadzTotal` | Handel×pctPieniadz×mennica + budynki + Poborca | `economy.ts` l.483–488 |
| **Nauka** | `nauka` = `naukaLokalna` | Handel×pctNauka + budynki + Biblioteka | `economy.ts` l.480 |
| **Rozwój (???)** | `luksus` = `luksusZHandlu` | Handel×pctLuksus | `economy.ts` l.476 |
| *(uboczny: Praca→pula)* | `splitPraca.doPuli` | (30% Pracy) | `production.ts` l.546 |

Są więc **dwa kandydaci** na „4. kubełek rozwoju":
- **(a)** `splitPraca.doPuli` — Praca odkładana do globalnej puli (skarbiec Pracy)
- **(b)** `luksusZHandlu` → Wealth — Handel oddany społeczeństwu

---

## 3. Dubel w playerState — WERDYKT

### Twarde ustalenie: **NIE MA DUBLA. Jest tylko BANKOWANIE.**

`playerState.ts` (linie 23–25):
```
// economy.ts (cityYieldPerTurn) already splits each city's trade (Handel) by a
// fixed slider into BOTH a science stream (procentNauka, default 60%) and a
// money stream (procentPieniadz, default 30%) EVERY turn...
// turn-economy.ts aggregates those into EconomyTickResult.totalNauka and .totalPieniadz.
// We therefore bank them directly and consistently:
//     nauka    += totalNauka
//     skarbiec += totalPieniadz
```

**Przepływ danych jest jednokierunkowy:**
1. `economy.ts::cityYieldPerTurn()` → liczy `nauka` i `pieniadz` **raz** per miasto
2. `turn-economy.ts::advanceCityEconomy()` (linie 369–371) → agreguje do `totalNauka`, `totalPieniadz`
3. `playerState.ts::researchStep()` → **tylko bankuje** gotowe sumy (`state.nauka += totalNauka`)

`playerState.ts` nie ma własnej formuły przeliczenia — nie ma tam ani `procentNauka`, ani żadnego mnożnika. Jedyny mnożnik w `playerState.ts` to `pieniadzMnoznik` (wartość 10 po zbadaniu technologii Waluta), **ale komentarz na linii 26 explicite mówi, że NIE skaluje wstecznie obliczeń economy.ts** — jedynie ustawia flagę dla HUD.

### Jak skonsolidować do jednego źródła (już tak jest — to wystarczy udokumentować):
- Podział Nauka/Pieniądz żyje **wyłącznie** w `economy.ts::cityYieldPerTurn()`, Step 7+8 (linie 466–488).
- `turn-economy.ts` jest czystym agregatorem — nie dodaje żadnych procentów.
- `playerState.ts` jest czystym bankiem — nie przekształca danych.

**Konsolidacja konieczna jest tylko w UI** — jeden panel ustawia `city.podziałHandlu.procentNauka/Pieniadz/Luksus`, a wyniki trafiają przez komplet klas bez żadnych zduplikowanych obliczeń.

---

## 4. Definicja „rozwoju" — REKOMENDACJA

### Rekomendacja: **(b) Luksus → Wealth**

**Uzasadnienie:**

1. `wealth.ts` JUŻ ISTNIEJE i konsumuje `spoleczMoney` (= udziałLuksus × pieniądzMiasta lub wprost `luksusZHandlu`) jako wejście do puli Wealth (linia 153: parametr `spoleczMoney`).

2. `wealth.ts` ma kompletny model wzrostu/utrzymania (linie 162–208): pula → poziomy → mnożnik podatku na `skarbiec` → `zadowolenie`. To dokładnie zachowanie „inwestujesz w społeczeństwo → długofalowo więcej pieniędzy + szczęście".

3. Semantycznie: **Luksus = %, który miasto _zostawia obywatelom_**. To naturalne znaczenie „rozwoju społecznego/zamożności".

4. Hipoteza (a) `splitPraca.doPuli` to Praca-na-ulepszenia-terenu (hex improvements), co jest mechanicznie bliżej „budowania infrastruktury" niż „zamożności/rozwoju". Budowanie drogi/kopalni nie jest „rozwojem" w sensie Wealth.

5. Implementacyjnie hipoteza (b) nie wymaga nowego strumienia — `luksus` jest już obliczany jako `CityYieldResult.luksus` (linia 501) i przepływa przez `EconomyTickResult.totalLuksus` (linia 372). Wystarczy podłączyć `advanceWealth()` w pętli turowej.

### Jednozdaniowe uzasadnienie:
**Luksus → Wealth** bo `wealth.ts` już jest napisany, już konsumuje ten strumień, i semantycznie „procent Handlu zostawiany obywatelom" = zamożność / rozwój społeczny.

---

## 5. Ujednolicony model 4 kubełków

### Odpowiedź: DWA suwaki w UI, pokazane jako 4 kubełki

Nie ma sensu robić jednego globalnego suwaka nad wszystkim — Handel i Praca to różne surowce z różnymi odbiorcami.

```
OUTPUT MIASTA
│
├── PRACA (z terrainu + budynków, po korupcji)
│   └── Suwak Pracy (% budynki vs % pula)
│       ├── [Kubełek 1: PRODUKCJA] doBudynkow → kolejka budynków/jednostek
│       └── doPuli → globalna pula Pracy (ulepszenia terenu, Strażnica itp.)
│
└── HANDEL (z terrainu, po korupcji)
    └── Suwak Handlu (% Nauka / % Pieniądz / % Luksus)
        ├── [Kubełek 2: NAUKA]     naukaZHandlu → pool nauki → badania
        ├── [Kubełek 3: PIENIĄDZ]  pieniadzZHandlu → skarbiec
        └── [Kubełek 4: ROZWÓJ]    luksusZHandlu → advanceWealth() → poziom Wealth
                                                   → mnożnikWealth × skarbiec (delayed)
                                                   → wkład do zadowolenia
```

**Ważna semantyka kubełków:**
- „Produkcja" to nie surowe plony terenu — to **część Pracy skierowana do budowania** (kolejka). Plony terenu (Praca+Handel brutto) to poziom wcześniejszy.
- Suwak Pracy określa, ile Pracy idzie na budowanie vs. pula. W UI można pokazać oba kubełki (Produkcja i Praca→pula), ale pula Pracy to nie jeden z 4 głównych kubełków Macieja — jest to wewnętrzny surowiec.
- 4 kubełki = 4 **przeznaczenia Handlu+Pracy po podziale**, nie 4 niezależne surowce.

---

## 6. Plan konsolidacji + implementacji

> Wszystkie poniższe punkty to **plan na przyszłe zadanie** — brak zmian w kanonicznym kodzie w tym zadaniu.

### 6.1 Podłączyć `splitPraca` do pętli turowej

**Plik:** `gra/src/game/turn-economy.ts`  
**Gdzie:** w `advanceCityEconomy()`, po linii 314 (`const yld = cityYieldPerTurn(...)`)  
**Co:** wywołać `splitPraca(yld.praca, udzialBudynki)` i przekazać `doBudynkow` do `productionProgress()`.

```typescript
// PLAN (nie patch):
import { splitPraca } from './production';
// ...w pętli per-miasto:
const udzialBudynki = econCity.podziałPracy.procentBudynki / 100; // z params
const { doBudynkow, doPuli } = splitPraca(yld.praca, udzialBudynki);
// doBudynkow -> productionProgress() dla pierwszego elementu kolejki
// doPuli -> EconomyTickResult.totalPracaPula (nowe pole)
```

**Brakujące pole w `EconomyTickResult`:** dodać `totalPracaPula: number` (agregat `doPuli` ze wszystkich miast).

### 6.2 Podłączyć `advanceWealth()` do pętli turowej

**Plik:** `gra/src/game/turn-economy.ts`  
**Import:** `import { advanceWealth, loadWealthParams } from './wealth'` (wealth.ts istnieje)  
**Gdzie:** w `advanceCityEconomy()`, po obliczeniu `yld.luksus`  
**Co:** wywołać `advanceWealth(city.wealthState, yld.luksus, yld.pieniadz, epoka, wealthParams)`

```typescript
// PLAN (nie patch):
// wealth.ts::advanceWealth(state, spoleczMoney, miastoMoney, epoka, p)
//   spoleczMoney = yld.luksus  (to jest strumień „zostawiony obywatelom")
//   miastoMoney  = yld.pieniadz (do obliczenia kosztu utrzymania Wealth)
const wealthResult = advanceWealth(
  city.wealthState ?? freshWealthState(),
  yld.luksus,
  yld.pieniadz,
  playerEra,        // era gracza (z PlayerState)
  wealthParams,
);
city.wealthState = { poziom: wealthResult.poziom, pula: wealthResult.pula };
```

**Wymagane nowe pole na City:** `wealthState: WealthState` (lub inicjalizacja lazy).

### 6.3 Wpiąć `wealthMnoznik` do strumienia skarbca

**Plik:** `gra/src/game/playerState.ts` lub `turn-economy.ts`  
**Co:** przy bankowaniu `skarbiec += totalPieniadz`, zastosować mnożnik Wealth dla każdego miasta:
```
effectivePieniadz = pieniadzMiasta × wealthMnoznik(city.wealthState.poziom, wealthParams)
```
lub za skrótem: agregować `totalPieniadz` już po mnożniku w pętli per-miasto.

**Uwaga konflikt:** `playerState.ts` komentarz (linia 26) mówi, że zmiana `economy.ts` jest poza zakresem. Mnożnik Wealth NIE musi zmieniać `economy.ts` — można go nałożyć na `totalPieniadz` przy bankowaniu w `playerState.ts::researchStep()` lub w nowej funkcji `bankEconomy()`.

### 6.4 UI — 4 kubełki jako widok na 2 suwaki

**Plik:** frontend (poza zakresem tego planu — brak analizy UI)  
**Koncepcja:** panel miasta pokazuje dwa suwaki:
- Suwak Pracy (budynki % ↔ pula %)
- Suwak Handlu (Nauka % / Pieniądz % / Luksus/Rozwój %)

Suma suwaka Handlu musi wynosić 100 (constraint w UI).  
4 kubełki w nagłówku HUD = etykiety mapowane na te suwaki.

### 6.5 Zapis stanu suwaków na City

**Plik:** `gra/src/types/city.ts`  
**Stan obecny:** `PodziałPracy` (linia 84) i `PodziałHandlu` (linia 96) już są zdefiniowane poprawnie.  
**Brakuje:** `wealthState: WealthState` — dodać import i pole w interfejsie `City` (linia ~194).

---

## Podsumowanie decyzji

| Pytanie | Odpowiedź |
|---|---|
| Czy playerState dubluje obliczenia economy.ts? | **NIE** — tylko bankuje gotowe sumy z turn-economy.ts |
| Czym jest „rozwój" (4. kubełek)? | **Luksus → Wealth** (hipoteza b) |
| Jeden czy dwa suwaki? | **Dwa suwaki** (Praca + Handel) prezentowane jako 4 kubełki w UI |
| Czy wealth.ts jest gotowe? | **TAK** — `advanceWealth()` jest kompletna, czeka na podłączenie |
| Co blokuje podłączenie splitPraca? | Brak wywołania w `advanceCityEconomy()` i `productionProgress()` per-tick |
| Co blokuje podłączenie wealth? | Brak `city.wealthState` i wywołania `advanceWealth()` w pętli turowej |
