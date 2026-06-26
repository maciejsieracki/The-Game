# EKONOMIA -> MASTER: growthMult (7.4) + Compound (7.5)
**Data:** 2026-06-25
**Lane:** EKONOMIA (subagent EKONOMIA-EKONOMIA sesja Civ)

---

## Co zmienione

### 1. `gra/src/game/turn-economy.ts` -- growthMult hook (7.4)

**Problem z poprzednim stanem:** growthMult byl aplikowany do `nowyMagazynZywnosci` PO
`populationGrowth()` -- to nie wplywalo na crossing progu wzrostu w biezacej turze.

**Poprawka:** growthMult jest teraz aplikowany do `yld.zywnosc` PRZED wywolaniem
`populationGrowth()`. Efekt: pod unrestem (growthMult < 1) akumulacja jedzenia
jest wolniejsza, wiec prog wzrostu jest osiagany pozniej. Przy growthMult > 1 wzrost
przyspiesza.

```ts
// Nowy kod (turn-economy.ts ~linia 501-509):
const growthMult = growthMultByCity.get(city.id) ?? 1;
const zywnoscDlaWzrostu = growthMult !== 1
  ? yld.zywnosc * growthMult
  : yld.zywnosc;
const grow = populationGrowth(econCity, zywnoscDlaWzrostu, params);
```

Sygnatura `advanceCityEconomy` bez zmian -- growthMultByCity juz jest parametrem
(dodanym przez poprzedniego agenta).

### 2. `gra/src/game/economy-upkeep.ts` -- compound buildingUpkeep (7.5)

**Problem:** `buildingUpkeep()` uzywal liniowej formuly `base + (lvl-1)*grow`.

**Poprawka:** Importuje `buildingEffectAtLevel` z `production.ts` i uzywa
`Math.floor(buildingEffectAtLevel(utrzymanie, level))`, tj. `floor(baza * 1.10^(level-1))`.

- Sygnatura `buildingUpkeep(building, level, flatOverride?)` bez zmian.
- Pole `przyrostUtrzymania` nie jest juz uzywane do skalowania (legacy, zostaje
  w danych dla ewentualnej przyszlosci).
- Flat override (v0.1 "niezroznicowany") nadal priorytet.

### 3. `gra/src/game/economy.ts` -- compound buildingValue (7.5)

**Juz zrobione przez poprzedniego agenta** -- `buildingValue()` uzywalo juz
`buildingEffectAtLevel`. Brak zmian w tej sesji.

---

## Testy

| Test | Wynik |
|------|-------|
| `tools/growthmult-compound-test.cjs` (NOWY) | 20/20 PASS |
| `tools/upkeep-test.cjs` (zaktualizowany) | 53/53 PASS |
| `tools/wire-ekonomia-test.cjs` | 23/23 PASS |
| `tools/wealth-test.cjs` | 25/25 PASS |
| `tools/split-output-test.cjs` | 46/46 PASS |
| `tools/converters-test.cjs` | 30/30 PASS |
| `tools/logic-test.cjs` | 163/163 PASS |
| `npx vite build --outDir /tmp/civ-distD` | OK (980 kB) |

---

## main.ts -- czy wymaga zmian?

`advanceCityEconomy` sygnatura bez zmian -- `growthMultByCity` byl juz parametrem
(opcjonalny, default = new Map()). main.ts musi przekazac mape z `evaluateOrder`
per miasto jesli chce uruchomic efekty Porzadku na wzrost.

**Wpięcie dla mastera:**
```ts
// W petli tury: przed advanceCityEconomy
const growthMultByCity = new Map<string, number>();
for (const city of cities) {
  const inputs = { szczescie: getHappiness(city), prawo: 0 };
  const { effects } = evaluateOrder(inputs, orderParams);
  if (effects.growthMult !== 1) growthMultByCity.set(city.id, effects.growthMult);
}
advanceCityEconomy(cities, map, data, difficulty, econUnits, growthMultByCity, ...);
```

Bez przekazania mapy -- zachowanie bezwzglednie backward-compat (mult=1, brak efektu).

---

## Lista plikow do migracji compound przez inne lane (NIE EKONOMIA)

| Plik | Funkcja | Akcja |
|------|---------|-------|
| `gra/src/game/siege.ts` | prawdopodobnie `buildingValue` or similar | sprawdz czy uzywał liniowej formuly |
| `gra/src/game/player-economy.ts` (orphan) | `buildingUpkeep` (liniowy duplikat) | kiedy nie orphan -- owner: SILNIK/master; zastapic importem z economy-upkeep |

Pliki EKONOMIA:
- `economy.ts` buildingValue: juz compound (poprzedni agent)
- `economy-upkeep.ts` buildingUpkeep: compound (ta sesja)

---

## DoD (Definition of Done)

- [x] growthMult skaluje jedzenie PRZED populationGrowth (wplywa na threshold crossing)
- [x] buildingUpkeep compound = floor(baza * 1.10^(level-1))
- [x] buildingValue compound (poprzedni agent)
- [x] Testy zielone (7 suit, 360+ asercji)
- [x] Vite build ok
- [x] Backupy .bak-EKONOMIA przed kazdym edytowanym plikiem
- [x] Sygnatura advanceCityEconomy bez zmian
- [ ] main.ts wpiecie growthMultByCity -> MASTER
