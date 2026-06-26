# EKONOMIA -> MASTER : Religia etap 2 -- spreadReligion + tradeMult

Data: 2026-06-25 | Od: **EKONOMIA (subagent Sonnet)** | Status: **GOTOWE / TEST ZIELONY**

---

## Co zrobione

### 1. `spreadReligion` (weryfikacja -- byl juz zaimplementowany)
Funkcja `spreadReligion` w `gra/src/game/culture-religion.ts` istniala juz w pelnosci
(linie ~719-775). Subagent zweryfikowal implementacje vs spec i uznaje ja za kompletna:
- sprawdza dominacje zrodla (brak dominacji -> brak szerzenia),
- filtruje sasiadow wg `szerzenieMaxDystans` (hex distance),
- liczba slotow = `szybkoscSzerzeniaBazowa` + (Swiatynia ? `swiatyniaBonusSzerzenia` : 0),
- priorytet: najblizsi sasiedzi najpierw; remisy deterministycznie przez id + seeded RNG (mulberry32),
- pressure capped populacja sasiada,
- NIE mutuje wejscia (nowe `counts` per event).

### 2. `cityTradeMultiplier` (NOWE)
Dodano do `culture-religion.ts`:
- interfejs `TradeMultResult`,
- stala `FALLBACK_TRADE_MULT = 1`,
- funkcja `cityTradeMultiplier(cityReligion, ownerCivName, civs, religionParams?, gated?)`.

**Mechanika:**
- Czyta `mnoznikHandelPieniadz` z `civs.json` (pole `RawCivRow.mnoznikHandelPieniadz`),
- Czyta religie wlasciciela z `civs.json` (pole `RawCivRow.Religia`),
- Sprawdza dominant religion miasta (`dominantReligion()`),
- Zwraca mnoznik = `mnoznikHandelPieniadz` TYLKO gdy:
    (a) `gated = true` (Waluta + Mennica odblokowane -- sprawdzane przez wywolujacego),
    (b) dominujaca religia miasta == religia cywilizacji wlasciciela.
- W kazdym innym przypadku: `multiplier = 1` (neutralne, bez efektu).
- Graceful fallback: brak civa/pola -> `civBaseMultiplier = null`, `multiplier = 1`.

**Rozszerzony interfejs `RawCivRow`** (juz w pliku):
```ts
interface RawCivRow {
  Cywilizacja?: string;
  Religia?: string;               // np. "Politeizm olimpijski"
  mnoznikHandelPieniadz?: number; // np. 2.3 (Grecy)
  [key: string]: unknown;
}
```

### 3. Test
`gra/tools/culture-religion-test.cjs` -- 43 asercje, wynik: **43 passed, 0 failed**.
Pokrywa:
- sekcja A (10 testow): `spreadReligion` -- dominacja, sloty, zasieg, populacja cap, immutability, determinizm,
- sekcja B (10 testow): `cityTradeMultiplier` -- gate open/closed, match/mismatch, null/missing data,
- sekcja C (2 testy): `makeRng` -- deterministycznosc, seed=0,
- sekcja D (1 test): event state independence.

---

## API -- kontrakt wpiecia w ture

### spreadReligion
```ts
import { spreadReligion, ReligionNeighbor, ReligionParams } from './culture-religion';

// W petli tury, per miasto:
const result = spreadReligion(
  city.religionState,          // ReligionState -- stan religii zrodla
  neighborCities.map(n => ({   // ReligionNeighbor[] -- sasiednie miasta
    id: n.id,
    distance: hexDistance(city.q, city.r, n.q, n.r),
    state: n.religionState,
    population: n.population,
  })),
  religionParams,              // zaladowane z society-params.json
  {
    hasSwiatynia: city.buildings.includes('swiatynia'),
    pressure: 1,               // adherenci dodawani per sasiad (domyslnie 1)
    seed: turn * 1000 + cityIndex, // deterministyczny seed per tura+miasto
  }
);
// result.events[i] = { id, religion, added, state } -- nowe stany sasiadow
// Aplikuj: result.events.forEach(e => { getCity(e.id).religionState = e.state; });
```

**Kto wywoluje:** turn-economy.ts (lub nowy modul tury) raz na ture, per miasto z dominujaca religia.
**Kiedy:** po obliczeniu kultur/produkcji; przed obliczeniem zadowolenia (bo zadowolenie zalezne od religii).
**Kolejnosc miast:** dowolna (deterministyczna gdy seed zalezy od tury).

### cityTradeMultiplier
```ts
import { cityTradeMultiplier } from './culture-religion';
import civs from '../../data/civs.json';

// W obliczeniu dochodu miasta:
const tradeResult = cityTradeMultiplier(
  city.religionState,          // ReligionState
  city.ownerCiv,               // string -- np. "Grecy"
  civs,                        // CivsDataLike -- dane z civs.json
  religionParams,              // ReligionParams
  hasWalutaAndMennica,         // boolean -- gate: tech Waluta + budynek Mennica
);
const effectiveMoney = baseMoney * tradeResult.multiplier;
```

**Kto wywoluje:** economy.ts / turn-economy.ts (obliczenie pieniadza per miasto).
**Kiedy:** przy wyliczaniu `cityMoney` / `moneyPerTurn` -- po obliczeniu base money, przed agregacja.
**Gate:** sprawdzany przez wywolujacego; `cityTradeMultiplier` sam nie sprawdza buildngow/tech.

---

## DoD (Definition of Done)

- [x] `spreadReligion` -- zweryfikowana, testy zielone
- [x] `cityTradeMultiplier` -- zaimplementowana, testy zielone
- [x] Test `tools/culture-religion-test.cjs` -- 43/43 PASS
- [x] Backup: `culture-religion.ts.bak-EKONOMIA` (poprzednia wersja)
- [ ] Wpiecie w petle tury -- MASTER (turn-economy.ts lub nowy tick)
- [ ] Gate `hasWalutaAndMennica` -- sprawdzac w wywolujacym (economy.ts), nie w module

---

## Czego brakowalo w society-params.json

Brak klucza `religia_mnoznik_handel_*` -- mnozniki per cywilizacja sa w `civs.json`
(pole `mnoznikHandelPieniadz`, wartosci 1.7-2.4). To jest PRAWIDLOWE (wartosc zalezy od
narodu, nie od trudnosci), ale warto odnotowac ze `society-params.json` nie ma tej sekcji.
Opcjonalnie: dodac globalny modyfikator (np. `religia_mnoznik_handel_bazowy`) jako skalar
do strojenia calosciowego -- teraz fallback = 1.0, wiec efekt = 0 gdy gate zamkniety.

Dodatkowo w `society-params.json` istnieja klucze ktore sa WCZYTYWANE ale BRAKUJE ich
w `RawReligiaBlock` (nie blokuja, bo uzywa sie fallbackow):
- `religia_jednosc_bonus_produkcja` -- bonus produkcji przy jednosci religijnej (>80% miast)
- `religia_swiatynia_zadowolenie`  -- bonus zadowolenia ze Swiatyni (nie z religii dominujacej)
- `religia_bonus_dyplomacja_*` / `religia_kara_dyplomacja_*` -- dyplomacja (zakres DYPLOMACJA)
Te pola sa poza zakresem culture-religion.ts (dyplomacja/swiatynia-budynek); wzmianka dla porządku.
