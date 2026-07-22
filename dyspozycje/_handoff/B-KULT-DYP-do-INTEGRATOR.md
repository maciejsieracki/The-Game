# B → INTEGRATOR — Dyplomacja kultura+wiara (KULT-DYP-01)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-07-23 |
| **Decyzja** | `docs/decyzje/B-KULT-REL-2026-07-22.md` § KULT-DYP-01 |
| **Warstwa** | 🟡 cross (`main.ts` tickCtx + istniejący `tickDiplomacy`) |
| **Status handoffu** | 🟡 ZAPISANE — **nie wdrażać** bez `działaj` od Macieja |

## Decyzja Macieja (skrót)

| Element | Kanon |
|---------|-------|
| Bonus Zaufanie | **+0,5/t** (`wspolnaReligia_zaufanie_perTura`) **tylko** gdy **oba**: ta sama religia państwowa **+** ten sam okręg kulturowy |
| Kara obca wiara | **WYŁĄCZONA** — `odmiennaReligia` **zawsze false** w ticku |
| Kara obca kultura | **brak** — nie dodawać nowej flagi kary |

**Cytat:** „…tylko bonus na plus, jeżeli wspólna wiara i wspólna kultura. Czyli z państwem i miastami naszej kultury będzie łatwiej się dogadać."

## Stan dziś (bug)

`main.ts` ~12584:

```ts
wspolnaReligia: false,
odmiennaReligia: false,
```

— obie flagi na sztywno; dyplomacja religijna **martwa** (audyt §4).

## Wpięcie (F only — `main.ts`)

```ts
import { sameCultureCircle } from './game/diplomacy-display';
import { civReligionForKey } from './game/culture-religion'; // lub istniejący helper

const playerKey = civKeyForOwner(0);
const otherKey = civKeyForOwner(ownerId);
const sameCulture = sameCultureCircle(playerKey, otherKey);
const playerRel = civReligionForKey(playerKey);
const otherRel = civReligionForKey(otherKey);
const sameReligion =
  Boolean(playerRel && otherRel && playerRel === otherRel);

const tickCtx: TickCtx = {
  // …pozostałe flagi bez zmian…
  wspolnaReligia: sameCulture && sameReligion,
  odmiennaReligia: false, // KULT-DYP-01: ZAKAZ kary
};
```

### Semantyka

| Para | `wspolnaReligia` | `odmiennaReligia` | ΔZ/t |
|------|------------------|-------------------|------|
| Grecy + Grecy, ta sama wiara | true | false | +0,5 |
| Grecy + Hetyci (obca kultura) | false | false | 0 |
| Ten okręg, różna wiara | false | false | 0 |
| Obca wiara (stary model kara) | false | **false** | **0** (nie −0,5) |

**Uwaga:** nazwa flagi `wspolnaReligia` w JSON/engine = „bonus wyznaniowo-kulturowy" (AND), nie sama wiara.

## Pliki

| Plik | Zmiana |
|------|--------|
| `gra/src/main.ts` | obliczenie flag tickCtx (pętla dyplomacji end-turn) |
| `gra/tools/diplomacy-test.cjs` | test: AND bonus · brak odmiennaReligia |
| `gra/data/diplomacy.json` | **bez zmiany liczb** (+0,5 zostaje) |

## Testy (DoD)

| # | Scenariusz |
|---|------------|
| D1 | Grecy↔Grecy, ta sama `Religia` w civs → `wspolnaReligia=true` → +0,5 Z/t |
| D2 | Grecy↔Hetyci → `wspolnaReligia=false`, `odmiennaReligia=false` → 0 |
| D3 | Ten okręg, różne religie → bonus false, kara false |
| D4 | `tickDiplomacy` nigdy nie dodaje `odmiennaReligia_zaufanie_perTura` (−0,5) |

**Bramki:** `npx tsc --noEmit` · `node tools/diplomacy-test.cjs`

## Powiązane (osobny batch)

| ID | Temat | Handoff |
|----|-------|---------|
| **KULT-04** | Kultura+religia → Power | `power-objective.ts` — nie ten plik |
| **KULT-PRESJA** | Presja mapowa | `B-KULT-PRESJA-do-INTEGRATOR.md` |

## Flaga

**CZEKA** — dokumentacja; implementacja po **`działaj`** Macieja.
