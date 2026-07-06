# HANDOFF: EKONOMIA -> UNITS -- kontrakt oblezenia / zapasy zywnosci

**Data:** 2026-06-25  **Od:** Grupa B  **Do:** UNITS/SILNIK  Zatwierdzone przez Naster.

## Odpowiedzi na 4 pytania UNITS

### 1. Gdzie trzymany jest zapas zywnosci miasta?

Pole: `city.magazynZywnosci` (typ: `number | undefined`) na interfejsie `City` w `gra/src/game/cities.ts`.

- Jest to **liczba skalarna** (nie obiekt `MagazynZywnosci` z `types/city.ts` -- ten interfejs jest modelem docelowym, nie uzywany przez runtime).
- `undefined` oznacza pusty magazyn (rownowaznie 0).
- Accessor: `getCityFood(city: City): number` w `gra/src/game/turn-economy.ts` -- zwraca `city.magazynZywnosci ?? 0`.

### 2. Czy populacja i magazyn sa juz per-miasto w stanie gry?

**TAK.** Oba pola sa per-miasto na obiekcie `City`:
- `city.population: number` -- liczba mieszkancow
- `city.magazynZywnosci?: number` -- zapas zywnosci (skalar)

### 3. Reguła zuzycja/ture -- potwierdzenie modelu

**Zatwierdzone.** Podczas oblezenia:
```
zuzycie = city.population + city.garnizon   (garnizon: 0 gdy brak)
magazyn = Math.max(0, magazyn - zuzycie)
```
- Kazdy mieszkaniec zjada 1 zywnosc/ture.
- Kazda jednostka garnizonu zjada 1 zywnosc/ture.
- Magazyn nie schodzi ponizej 0 (clamp).

### 4. Jak sygnalizowac blokade obleznicza?

Flaga `city.oblegane === true` powoduje, ze turn-economy:
- **NIE** nalicza dochodu zywnosci z pol (`zywnoscNetto = 0`)
- **TAK** odejmuje zuzycie od magazynu (`magazyn -= population + garnizon`)
- **NIE** zmienia populacji (wzrost/ubytek zawieszony)
- Gdy `city.oblegane === false` lub `undefined` -- zachowanie bez zmian (pelna compat)

---

## Dodane pola na interfejsie City (`gra/src/game/cities.ts`)

```typescript
/** Czy miasto jest aktualnie oblegane (flaga ustawiana przez UNITS/SILNIK). */
oblegane?: boolean;

/** Liczba jednostek garnizonu. Domyslnie 0. */
garnizon?: number;
```

**UNITS ustawia:** `city.oblegane = true` gdy oblezenie sie zaczyna, `city.oblegane = false` lub `delete` gdy koniec.  
**UNITS ustawia:** `city.garnizon = N` (liczba jednostek w miescie).

---

## Nowe eksporty w `gra/src/game/turn-economy.ts`

### `getCityFood(city: City): number`
```typescript
export function getCityFood(city: City): number {
  return city.magazynZywnosci ?? 0;
}
```
Uzywaj zamiast `city.magazynZywnosci ?? 0` wszedziie w UNITS/SILNIK.

### Nowe pola w `CityEconomyTick` (wynik tury per miasto):
```typescript
oblegany:       boolean;   // czy miasto bylo oblegane w tej turze
obleganyGlod:   boolean;   // true gdy magazyn osiagnal 0 (ryzyko kapitulacji)
magazynPoTurze: number;    // stan magazynu po turze (do odczytu przez SILNIK)
```

---

## Logika turn-economy podczas oblezenia (pseudokod)

```
if (city.oblegane === true):
    garnizon = city.garnizon > 0 ? city.garnizon : 0
    zuzycie = city.population + garnizon
    magazyn = Math.max(0, getCityFood(city) - zuzycie)
    city.magazynZywnosci = magazyn
    tick.zywnoscNetto = 0          // brak dochodu z pol
    tick.ludnoscPo = city.population  // populacja nie zmienia sie
    tick.oblegany = true
    tick.obleganyGlod = (magazyn <= 0)
    tick.magazynPoTurze = magazyn
    // (Praca, Pieniadz, Nauka, Luksus, Kultura, Wealth naliczane normalnie)
    continue
else:
    // normalny tick bez zmian (pelna wsteczna kompatybilnosc)
```

---

## Kapitulacja z glodu -- co robi SILNIK (kontrakt do wdrozenia przez UNITS)

Gdy `tick.obleganyGlod === true`:
- Miasto ma `magazyn = 0`.
- Zgodnie z modelem: nastepna tura z `magazyn = 0` -> kapitulacja.
- SILNIK sprawdza `obleganyGlod` i moze wywolac kapitulacje (logika poza EKONOMIA).
- EKONOMIA NIE wywoluje kapitulacji samodzielnie -- to decyzja SILNIK/UNITS.

---

## Testy

Plik: `gra/tools/oblezenie-test.cjs`  
Uruchomic: `node tools/oblezenie-test.cjs` z folderu `gra/`  
Wynik: **27 passed, 0 failed**

Regresja WIRE 1/2/3: `node tools/wire-ekonomia-test.cjs` -> **23 passed, 0 failed**

---

## Backup

- `gra/src/game/turn-economy.ts.bak-EKONOMIA` -- kopia przed zmiana
- `gra/src/game/cities.ts.bak-EKONOMIA` -- kopia przed zmiana

-- Grupa B
