# Zdrowie miasta — analiza i projekt

**Sesja:** EKONOMIA  
**Data analizy:** 2026-06-25  
**Autor:** Sonnet-subagent (analiza + projekt; brak edycji kodu)

---

## 1. Stan obecny (z numerami linii)

### 1.1 Parametr w `economy.ts`

**Plik:** `gra/src/game/economy.ts`

| Linia | Fragment |
|-------|----------|
| 26 | Komentarz nagłówkowy: `Health modifier: modifier = max(0, 1 + zdrowie * 0.05) [PT]` |
| 95 | `zdrowieModyfikatorWspolczynnik: number;  // health->growth coeff [PT 0.05]` (pole EconParams) |
| 162 | `zdrowieModyfikatorWspolczynnik: read(em, 'zdrowie_modyfikator_wspolczynnik', 0.05),` (loadEconParams) |
| 211 | `zdrowie: number;` (pole EconomyCity — wejście do wyliczeń) |
| 535 | `const { ludnosc, zdrowie, maSpichlerz, maAkwedukt, magazynZywnosci } = city;` |
| 538–539 | Faktyczne użycie: `const healthModifier = Math.max(0, 1 + zdrowie * params.zdrowieModyfikatorWspolczynnik);` `const effectiveFlow = zywnoscNetto * healthModifier;` |

**Wzór:** `Modyfikator = max(0, 1 + zdrowie × 0.05)`. Wynik mnoży `zywnoscNetto` przed wpływem na `magazynZywnosci`. Zdrowie = 0 → mnożnik = 1.0 (neutralny). Zdrowie = +4 → ×1.20. Zdrowie = −20 → 0 (głód nawet przy nadwyżce jedzenia).

**Wartość domyślna współczynnika:** 0.05 (hardkodowany fallback w `loadEconParams`).

### 1.2 Parametr w `turn-economy.ts` (adapter runtime)

**Plik:** `gra/src/game/turn-economy.ts`

| Linia | Fragment |
|-------|----------|
| 104 | `zdrowieModyfikatorWspolczynnik: num(em, 'zdrowie_modyfikator_wspolczynnik', 0.05),` (buildEconParams) |
| 167 | `zdrowie: 0, // neutral; no health subsystem at runtime yet` (toEconomyCity) |

**Kluczowy punkt:** Funkcja `toEconomyCity()` (linia 163–183) zawsze ustawia `zdrowie: 0` — stały hardkod. Żaden kod runtime nie nadpisuje tej wartości.

### 1.3 Pole `zdrowie` w typie `City` (runtime)

**Plik:** `gra/src/game/cities.ts`

Interfejs `City` (linia 14–24) **nie zawiera pola `zdrowie`**. Runtime City ma: `id, ownerId, q, r, name, population, magazynZywnosci?, maMur?`. Brak miejsca do przechowywania wartości zdrowia między turami.

### 1.4 Pole `zdrowie` w typie `CityState` (types)

**Plik:** `gra/src/types/city.ts` linia 133–137:
```
zdrowie: number;
// Poziom zdrowia miasta (wynik netto czynnikow + i -).
// >0 = szybszy wzrost; 0 = stagnacja; <0 = spadek populacji.
```
Pole istnieje tylko w bogatym typie `CityState` (widok UI/spec), nie w runtime `City`.

### 1.5 Klucz w `econ-params.json`

**Plik:** `gra/data/econ-params.json`

Klucz `zdrowie_modyfikator_wspolczynnik` **nie istnieje** w pliku. Weryfikacja przez Python:
```
python3: list(d.get('ekonomia_miasta',{}).keys())
# → [..., 'zywnosc_zuzytka_populacja', 'korupcja_cap'] — brak zdrowie_*
```
Kod czyta go przez helper `num(..., fallback)` → zawsze wraca do fallbacku 0.05.

### 1.6 Klucze w `society-params.json`

**Plik:** `gra/data/society-params.json`

Sekcja `zdrowie` zawiera **14 kompletnie zaprojektowanych parametrów** (easy/normal/hard):
- Bonusy: `zdrowie_rzeka`, `zdrowie_akwedukt`, `zdrowie_studnia`, `zdrowie_targowisko`, `zdrowie_ceramika`, `zdrowie_male_miasto_bonus`
- Kary: `zdrowie_kara_zagęszczenie`, `zdrowie_kara_bagno`, `zdrowie_kara_dzungla`, `zdrowie_kara_zanieczyszczenie`, `zdrowie_kara_brak_wody`
- Progi: `zdrowie_prog_stagnacja`, `zdrowie_prog_ubytek_populacji`, `zdrowie_tempo_ubytku`
- Modyfikator wzrostu: `zdrowie_modyfikator_wzrostu` (easy 0.06, normal 0.05, hard 0.04)

Parametry są **w pełni wypełnione i sensownie dobrane** — nie jest to szkielet, lecz gotowa specyfikacja. Jednak **żaden kod runtime ich nie czyta**.

### 1.7 Budynek kategorii „Zdrowie" w `buildings.json`

**Plik:** `gra/data/buildings.json` linia 350–383:
- Budynek `studnia` (Studnia/Łaźnie), kategoria `"Zdrowie"`, epoka 1
- Efekt: `zadowolenie: +1` (baza i przyrost)
- **Uwagi (linia 382):** `"Zadowolenie jako proxy Zdrowia do czasu dodania kolumny Zdrowie"`

Budynek jest świadomie tymczasowy — autorzy sami opisali go jako proxy. Brak pola `zdrowie` w strukturze `BuildingYields` (linia 57–66), więc nawet gdyby Studnia miała wynikać ze zdrowia, nie ma gdzie tego zapisać.

### 1.8 `CityYieldContext` — brak pola zdrowia

Interfejs `CityYieldContext` (economy.ts linia 350–372) zawiera: `wojskoZuzycieZywnosci, strataFraction, maMlyn, maCegielnia, maTargowisko, maBiblioteka, maMennica, mennicaMnoznik`. **Brak pola `zdrowie`.** Zdrowie jest pobierane bezpośrednio z `EconomyCity.zdrowie`, nie przez kontekst.

---

## 2. Czy parametr jest martwy?

**TAK — parametr jest martwy.**

Dowód formalny (łańcuch przyczynowy):

```
1. Runtime City (cities.ts:14-24)    — brak pola zdrowie
2. toEconomyCity() (turn-economy.ts:167) — zdrowie hardkodowane = 0
3. healthModifier (economy.ts:538)   — zawsze 1 + 0 * 0.05 = 1.0
4. effectiveFlow (economy.ts:539)    — zawsze = zywnoscNetto * 1.0 = zywnoscNetto
```

Modyfikator zdrowia jest obliczany (linia 538 economy.ts), ale jego wejście (`zdrowie = 0`) jest stałą. Wynik jest zawsze `max(0, 1 + 0 * 0.05) = 1.0`. Mnożenie przez 1.0 nie zmienia `zywnoscNetto`. Parametr `zdrowieModyfikatorWspolczynnik` (0.05) mnoży zero.

**Efekt:** Żadna rozgrywka w v0.1 nie odczuje różnicy niezależnie od wartości `zdrowieModyfikatorWspolczynnik` w econ-params.json (który zresztą też nie istnieje w JSON). Funkcja `populationGrowth()` działa identycznie jakby linii 538–539 nie było.

---

## 3. Rekomendacja: WIRE (opcja B)

**Uzasadnienie:** Infrastruktura projektowa zdrowia jest kompletna i niesprzeczna — `society-params.json` ma gotowe 14 parametrów, budynek `studnia` ma komentarz „proxy do czasu dodania Zdrowia", typ `CityState` ma pole `zdrowie`, formuła w `economy.ts` jest prawidłowa — brakuje tylko **kabla łączącego** te elementy. CUT wymagałby usunięcia przemyślanej specyfikacji i regresu do stanu sprzed projektu; WIRE to ~30 linii kodu podłączającego gotowe elementy.

Argument za CUT byłby uzasadniony gdyby specyfikacja zdrowia była sprzeczna z innymi lanami — tymczasem jest spójna (Akwedukt odblokowuje wzrost >6 pop w economy.ts linia 541 i jest bonusem zdrowia w society-params.json).

---

## 4. Plan implementacji WIRE (bez zmian w kanonicznym kodzie)

### 4.1 Nowy helper: obliczanie zdrowia miasta

**Nowy plik:** `gra/src/game/city-health.ts` (lub sekcja w `turn-economy.ts`)

```typescript
// Wejście: dane z runtime City + society-params.json + tiles
interface HealthInput {
  maRzeke:        boolean;  // czy hex centrum sąsiaduje z rzeką
  maStudnie:      boolean;  // budynek studnia (poziom >= 1)
  maTargowisko:   boolean;  // budynek targowisko (poziom >= 1)
  maAkwedukt:     boolean;  // budynek akwedukt (poziom >= 1)
  maCeramike:     boolean;  // budynek ceramika (poziom >= 1)
  maBagno:        boolean;  // Bagno w zasięgu r5
  maDzungle:      boolean;  // Dzungla w zasięgu r5
  ludnosc:        number;
}

// Parametry z society-params.json["zdrowie"]
interface HealthParams {
  zdrowie_rzeka:              number;  // normal: 2
  zdrowie_akwedukt:           number;  // normal: 4
  zdrowie_studnia:            number;  // normal: 2
  zdrowie_targowisko:         number;  // normal: 2
  zdrowie_ceramika:           number;  // normal: 1
  zdrowie_male_miasto_bonus:  number;  // normal: 1
  zdrowie_kara_zagszczenie:   number;  // normal: -1 (per 1 pop > progu)
  zdrowie_prog_zagszczenia:   number;  // normal: 4
  zdrowie_kara_bagno:         number;  // normal: -1
  zdrowie_kara_dzungla:       number;  // normal: -1
  zdrowie_kara_brak_wody:     number;  // normal: -2
}

function obliczZdrowieMiasta(input: HealthInput, params: HealthParams): number {
  let z = 0;
  if (input.maRzeke)     z += params.zdrowie_rzeka;
  if (input.maAkwedukt)  z += params.zdrowie_akwedukt;
  if (input.maStudnie)   z += params.zdrowie_studnia;
  if (input.maTargowisko) z += params.zdrowie_targowisko;
  if (input.maCeramike)  z += params.zdrowie_ceramika;
  // mala miejscowosc bonus
  if (input.ludnosc <= params.zdrowie_prog_zagszczenia)
    z += params.zdrowie_male_miasto_bonus;
  // kary
  if (input.maBagno)    z += params.zdrowie_kara_bagno;   // ujemne
  if (input.maDzungle)  z += params.zdrowie_kara_dzungla;
  // kara zagęszczenia
  if (input.ludnosc > params.zdrowie_prog_zagszczenia)
    z += params.zdrowie_kara_zagszczenie * (input.ludnosc - params.zdrowie_prog_zagszczenia);
  // kara brak wody (brak rzeki i brak studni i brak akweduktu)
  if (!input.maRzeke && !input.maStudnie && !input.maAkwedukt)
    z += params.zdrowie_kara_brak_wody;
  return z;
}
```

### 4.2 Zmiany w `turn-economy.ts`

**Plik:** `gra/src/game/turn-economy.ts`

1. Importować `loadSocietyHealthParams()` z loadera (lub bezpośrednio z `data.societyParams`).
2. Funkcja `toEconomyCity()` (linia 163–183): zastąpić `zdrowie: 0` wywołaniem `obliczZdrowieMiasta(...)`. Wymaga wiedzy o terenie i budynkach — można przekazać jako dodatkowy argument lub obliczyć na miejscu w `advanceCityEconomy()` przed `toEconomyCity()`.
3. Alternatywnie: obliczyć `zdrowie` w pętli `for (const city of cities)` (linia 292) przed `toEconomyCity()`, dodać parametr do `toEconomyCity(city, params, isCapital, zdrowie)`.

**Przykład minimalnej zmiany w pętli (linia 292–296 turn-economy.ts):**
```typescript
// PRZED (linia 296):
const econCity = toEconomyCity(city, params, isCapital);

// PO:
const healthInput = buildHealthInput(city, map, cityBuildings);
const zdrowie = obliczZdrowieMiasta(healthInput, healthParams);
const econCity = toEconomyCity(city, params, isCapital, zdrowie);
```

### 4.3 Zmiana w `toEconomyCity()`

**Plik:** `gra/src/game/turn-economy.ts`, linia 163:
```typescript
// Sygnatura z nowym parametrem:
export function toEconomyCity(
  city: City,
  params: EconParams,
  isCapital: boolean,
  zdrowie: number = 0,   // domyślnie 0 = backward-compat
): EconomyCity {
  return {
    ...
    zdrowie,   // linia 167: zamiast hardkodu = 0
    ...
  };
}
```

### 4.4 Loada parametrów zdrowia

**Plik:** `gra/src/data/loader.ts`

Loader już ładuje `societyParams` (linia 233: `Parametry społeczeństwa (zdrowie, szczęście, kultura, religia)`). Parametry zdrowia są już w `society-params.json["zdrowie"]`. Potrzebna tylko typowanie i helper `loadSocietyHealthParams(raw, difficulty)` analogiczny do `buildEconParams`.

### 4.5 Obsługa terenu: bagno/dżungla w zasięgu

W `workedTilesForCity()` (turn-economy.ts linia 143) leci już iteracja po heksach. Wystarczy dodać flagę podczas iteracji: `maBagno = tiles.some(t => t.terenBazowy === TerenBazowy.Bagno)`.

### 4.6 Budynki: flagi zdrowia

Budynek `studnia` ma `kategoria: "Zdrowie"`. Potrzeba mapowania: `"studnia" → maStudnie`, `"ceramika" → maCeramike` (gdy ceramika zostanie dodana). Minimalnie: sprawdzenie `city.buildings.some(b => b.record.id === 'studnia' && b.level >= 1)`.

### 4.7 Klucz w `econ-params.json` (przenieść z society-params.json)

`zdrowie_modyfikator_wspolczynnik` jest **już w `society-params.json["zdrowie"]["zdrowie_modyfikator_wzrostu"]`**. Aby `economy.ts:loadEconParams()` go czytał, dodać klucz do `econ-params.json["ekonomia_miasta"]`:

```json
"zdrowie_modyfikator_wspolczynnik": {
  "easy":   0.06,
  "normal": 0.05,
  "hard":   0.04,
  "jednostka": "per pkt Zdrowia",
  "opis": "Modyfikator wzrostu populacji per punkt Zdrowia. max(0, 1 + z * wsp) [PT]"
}
```

Alternatywnie: `buildEconParams()` (turn-economy.ts) może czytać `society_params["zdrowie"]["zdrowie_modyfikator_wzrostu"]` zamiast `econ_params`.

---

## 5. Parametry zdrowia do plików danych (już istniejące)

Wszystkie parametry **są już w `society-params.json`** sekcja `"zdrowie"`. Poniżej tabela z wartościami `normal`:

| Klucz | easy | normal | hard | Rola |
|-------|------|--------|------|------|
| `zdrowie_rzeka` | 3 | 2 | 1 | bonus: miasto przy rzece |
| `zdrowie_akwedukt` | 5 | 4 | 3 | bonus: wybudowany Akwedukt |
| `zdrowie_studnia` | 3 | 2 | 1 | bonus: Studnia/Łaźnia |
| `zdrowie_targowisko` | 3 | 2 | 1 | bonus: Targowisko |
| `zdrowie_ceramika` | 2 | 1 | 0 | bonus: Ceramika |
| `zdrowie_male_miasto_bonus` | 2 | 1 | 0 | bonus: pop ≤ próg zagęszczenia |
| `zdrowie_kara_zagęszczenie` | −0.75 | −1 | −1.25 | kara/1 pop > próg |
| `zdrowie_prog_zagęszczenia` | 5 | 4 | 3 | próg zagęszczenia |
| `zdrowie_kara_bagno` | −0.75 | −1 | −1.25 | kara: bagno/dżungla w okolicy |
| `zdrowie_kara_dzungla` | −0.75 | −1 | −1.25 | kara: dżungla w okolicy |
| `zdrowie_kara_zanieczyszczenie` | −0.75 | −1 | −1.25 | kara: budynki przemysłowe (późne epoki) |
| `zdrowie_kara_brak_wody` | −1 | −2 | −3 | kara: brak rzeki+studni+akweduktu |
| `zdrowie_modyfikator_wzrostu` | 0.06 | 0.05 | 0.04 | wsp. przeliczenia Zdrowia na wzrost |
| `zdrowie_prog_stagnacja` | 0 | 0 | 0 | zdrowie ≤ progu → wzrost = 0 |
| `zdrowie_prog_ubytek_populacji` | −6 | −5 | −4 | gdy zdrowie < progu → utrata pop |
| `zdrowie_tempo_ubytku` | 4 | 3 | 2 | co ile tur utrata 1 pop gdy < progu |

**Uwaga:** `zdrowie_kara_zanieczyszczenie` dotyczy późnych epok (huty itp.) — w v0.1 (Kamień/Brąz) nie ma budynków przemysłowych, więc ta kara może być bezpiecznie nieobsługiwana na razie.

---

## 6. Podsumowanie planu

| Krok | Plik do edycji | Zmiana | Złożoność |
|------|----------------|--------|-----------|
| 1 | `turn-economy.ts` | `toEconomyCity` przyjmuje `zdrowie: number = 0` | mała |
| 2 | `turn-economy.ts` | Nowy helper `buildHealthInput()` zbierający flagi (rzeka, budynki, teren) | średnia |
| 3 | `turn-economy.ts` | Nowy helper `loadSocietyHealthParams()` lub inline reader z `data.societyParams` | mała |
| 4 | `turn-economy.ts` | Wywołanie `obliczZdrowieMiasta()` w pętli per-city | mała |
| 5 | `econ-params.json` | Dodanie klucza `zdrowie_modyfikator_wspolczynnik` (lub odczyt z society-params) | mała |
| 6 | `cities.ts` (opcjonalne) | Dodanie `zdrowie?: number` do runtime `City` jeśli chcemy persistować między turami | mała |

Krok 6 jest opcjonalny w v0.1 — zdrowie można przeliczać każdą turę od zera (deterministyczne, nie wymaga zapisu do stanu). Persistowanie `zdrowie` na `City` jest potrzebne tylko jeśli planujemy efekty tymczasowe (np. zaraza trwa N tur).

---

*Dokument analityczny — brak edycji kanonicznego kodu. Do decyzji Macieja (CUT vs WIRE).*
