# HANDOFF: EKONOMIA → UNITS — głód wojska (−8% maxHP/tura)

**Data:** 2026-06-26 · **Od:** EKONOMIA · **Do:** UNITS (+ SILNIK wpiecie) · **Status:** SPEC — czeka implementacja lane · **Decyzja:** Maciej Q1 HUD mapa (hybryda żywności)

**Źródło:** `_handoff/MACIEJ-do-EKONOMIA_zywnosc-hybrid.md` · spec lane: `EKONOMIA-DO-MASTERA.md` §2026-06-26 żywność hybrydowa.

---

## Co przesyłam

Model **zapasów państwa** (`zapasyPanstwa` per `ownerId`) i flagę **głodu armii** po turze ekonomii. UNITS stosuje **atrycję HP** na jednostkach gracza na mapie świata.

| Element | Właściciel lane | Opis |
|---------|-----------------|------|
| Tick zapasów + koszt armii | EKONOMIA | `advanceEmpireFood()` po `advanceCityEconomy` |
| Flaga `glodWojska` | EKONOMIA | `true` gdy `zapasyPanstwa < 0` po odjęciu kosztu wojska |
| Atrycja −8% maxHP | **UNITS** | każda jednostka `ownerId` z głodem, co turę |
| Usunięcie jednostki | **UNITS/SILNIK** | gdy `hp <= 0` po atrycji |

---

## Kiedy głód = true

Po fazie ekonomii tury (kolejność kanoniczna):

```
1. advanceCityEconomy(...)           // miasta: plony, magazyn lokalny, wzrost
2. advanceEmpireFood(...)            // EKONOMIA: split żywności → zapasy państwa; debit armii
3. UNITS: applyArmyStarvation(...)   // jeśli glodWojska[ownerId]
```

**Warunek głodu (v1.0):**

```typescript
glodWojska = zapasyPanstwa[ownerId] < 0
```

- Porównanie **po** naliczeniu wpływu ze splitu **i** po odjęciu `kosztArmii` za tę turę.
- Zapasy **mogą** zejść poniżej zera (brak clampu w dół na v1.0) — ujemna wartość utrzymuje głód co turę, dopóki gracz nie zasili puli.
- **Cap góry zapasów:** brak (v1.0).

---

## Koszt żywności armii (odejmowany od zapasów państwa)

**Reuse** istniejącego API `militaryFoodConsumption()` z `economy-upkeep.ts` — **bez** odejmowania od netto żywności miasta (zmiana względem dzisiejszego `ctx.wojskoZuzycieZywnosci` w `cityYieldPerTurn`).

| Stan jednostki | Parametr `econ-params.json` | normal |
|----------------|------------------------------|--------|
| Marsz / garnizon mapy (`camping === false`) | `ekonomia_miasta.zywnosc_jednostka_ruch` | **1** / turę / jednostkę |
| Obóz (`camping === true`) | `ekonomia_miasta.zywnosc_jednostka_oboz` | **0.5** / turę / jednostkę |

```typescript
kosztArmii(ownerId) = militaryFoodConsumption(
  units.filter(u => u.ownerId === ownerId),
  upkeepParams,
);
```

**Zakres jednostek:** wszystkie jednostki wojskowe właściciela na mapie (w tym garnizon w mieście, jeśli liczone jako osobne `RuntimeUnit` — **nie** podwajać z `city.garnizon` licznikiem; patrz uwaga poniżej).

### Uwaga: garnizon obleżenia vs mapa

- **Obleżenie miasta:** żywność garnizonu nadal schodzi z **magazynu miasta** (`city.oblegane`, WIRE 4) — bez zmian.
- **Zapasy państwa:** koszt armii dotyczy jednostek na mapie wg `EconUnit` / `UnitFoodLike`. SILNIK musi unikać **podwójnego** liczenia tej samej jednostki w `city.garnizon` i w tablicy `units[]`.

---

## Kontrakt API (EKONOMIA → UNITS)

Plik docelowy: `gra/src/game/empire-food.ts` (stub typów już w lane).

```typescript
/** Wynik ticku zapasów państwa per owner. */
export interface EmpireFoodTick {
  ownerId:           number;
  zywnoscBrutto:     number;   // suma brutto żywności ze wszystkich miast ownera
  doRozwoju:         number;   // część splitu → pipeline miasta (informacyjnie)
  doPanstwa:         number;   // wpływ do zapasów państwa w tej turze
  kosztArmii:        number;   // militaryFoodConsumption
  zapasyPrzed:       number;
  zapasyPo:          number;   // po wpływie i koszcie armii
  glodWojska:        boolean;  // zapasyPo < 0
}

/** Odczyt bieżących zapasów (HUD, AI). */
export function getEmpireFoodReserve(ownerId: number): number;

/** Flaga głodu po ostatnim ticku (mapa). */
export function isArmyStarving(ownerId: number): boolean;

/** Pełny wynik ostatniego ticku (log, panel boczny). */
export function getLastEmpireFoodTick(ownerId: number): EmpireFoodTick | undefined;
```

**SILNIK** woła po `advanceCityEconomy`:

```typescript
const empireFood = advanceEmpireFood(
  econResult,          // EconomyTickResult — sumy per owner
  econUnits,           // EconUnit[] { ownerId, typeId, camping }
  empireFoodState,     // mutowane zapasy + suwak per owner
  upkeepParams,
  splitParams,         // procentPanstwo z suwaka / econ-params default
);
// potem:
applyArmyStarvation(units, empireFood.perOwner);
```

---

## Co UNITS ma zaimplementować

### 1. HP jednostki na mapie świata

`RuntimeUnit` (`units/setup.ts`) **dziś nie ma** `hp` / `maxHp`. Do atrycji głodu wymagane:

```typescript
// Propozycja rozszerzenia RuntimeUnit (UNITS lane):
hp?:     number;   // bieżące; brak = pełne maxHp przy spawnie
maxHp?:  number;   // z units.json Health; cache przy utworzeniu
```

Inicjalizacja: przy `placeStartingUnits` / rekrutacji ustawić `hp = maxHp = Health z definicji`.

### 2. Atrycja co turę (identyczna stawka jak decyzja oblężenia — 8% maxHP)

Parametr: `ekonomia_miasta.glod_wojska_hp_frac` (normal **0.08**).

```typescript
export function applyArmyStarvationAttrition(
  units: RuntimeUnit[],
  unitDefs: Map<string, { Health: number }>,
  starvingOwners: ReadonlySet<number>,
  hpFrac: number = 0.08,
): { destroyed: string[]; damaged: number };

// Per jednostka u głodnego ownera:
const maxHp = unit.maxHp ?? lookupHealth(unit.typeId);
const loss  = Math.max(1, Math.floor(maxHp * hpFrac));  // min 1 HP/turę gdy maxHp > 0
unit.hp = Math.max(0, (unit.hp ?? maxHp) - loss);
if (unit.hp <= 0) → mark destroy / splice from units[]
```

**Decyzja Macieja:** −8% **max HP** (nie −8% bieżącego HP). Wzór jak wyżej — spójne z komentarzem oblężenia w `main.ts` (intencja 8% maxHP; dziś garnizon modelowany count-based — **UNITS ma użyć HP per jednostka**).

### 3. Kolejność w pętli tury (SILNIK)

```
advanceCityEconomy
advanceEmpireFood
applyArmyStarvationAttrition   // UNITS
[siege attrition miasta]       // istniejące N3 — osobny tor (magazyn miasta)
```

Głód państwa **nie** zastępuje głodu oblężenia miasta — to dwa niezależne mechanizmy.

### 4. AI

AI czyta `getEmpireFoodReserve(oid)` i `isArmyStarving(oid)` — lane CYWILIZACJE (osobny handoff później).

---

## DoD (UNITS)

- [ ] `RuntimeUnit` + init `hp`/`maxHp` przy spawnie.
- [ ] `applyArmyStarvationAttrition()` — czysta funkcja, testowalna (`tools/food-army-test.cjs` scenariusz współdzielony z EKONOMIA).
- [ ] Usunięcie jednostki z `units[]` + sync render (SILNIK).
- [ ] Brak atrycji gdy `!isArmyStarving(ownerId)`.
- [ ] Brak kolizji z oblężeniem (`city.oblegane` / `city.garnizon`).

---

## Test akceptacyjny (wspólny z EKONOMIA)

Scenariusz `tools/food-army-test.cjs`:

1. Owner 0: `zapasyPanstwa = 0`, 3 jednostki × koszt 1 → po turze `zapasy = −3`, `glodWojska = true`.
2. Jednostka `maxHp = 100`, `hp = 100` → po 1 atrycji `hp = 92`.
3. Po 13 turach głodu (8%/turę) jednostka zniszczona (`hp <= 0`).

---

## Flaga handoff

**CZEKA** na implementację EKONOMIA `advanceEmpireFood` + wpicie SILNIK. UNITS może **równolegle** budować atrycję na mocku `isArmyStarving`.

**GOTOWE (spec):** ten plik + typy w `empire-food.ts`.
