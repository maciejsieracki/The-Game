# EKONOMIA + UI → SILNIK (Grupa F): B2 Porządek — kary + migracja buntu

**Status:** GOTOWE (lane EKONOMIA + UI) · **CZEKA** wpięcie w `main.ts`  
**Data:** 2026-06-27  
**Decyzje Macieja (ZAMKNIĘTE — nie pytaj ponownie):** B2-Q1=A, B2-Q2=B, B2-Q3=A, B2-Q4=C, **B2-Q6=C**, HUD Q3=C per miasto, D3=A Wealth→szczęście

**Supersedes (częściowo):** `UI-do-MASTER_B2-spoleczenstwo.md` — haki UI już w main (~l.727, ~l.2871); ten handoff = **efekty ekonomii + migracja**.

---

## Co przesyłam (pliki gotowe — NIE edytuj poza `main.ts`)

| Plik | Zmiana |
|------|--------|
| `gra/src/game/order.ts` | `pieniadzMult`, `naukaMult`, `kulturaMult` w `OrderEffects`; JSON keys; `ryzykoBuntuT1=0.05`; `orderEffectsToYieldMults()`; `pickRevoltMigrationTarget()` |
| `gra/data/society-params.json` | `porzadek_kara_pieniadz/nauka/kultura_t1`; `porzadek_ryzyko_buntu_t1.normal=0.05` |
| `gra/src/game/turn-economy.ts` | Param `orderMultByCity: ReadonlyMap<string, OrderYieldMults>` — mnożniki na plony **przed** Wealth |
| `gra/src/ui/cityPanel.ts` | Panel B2 (Mieszkańcy, Porządek, Zdrowie; bez Specjalistów) |
| `gra/tools/logic-test.cjs` | Assercje order B2 |

---

## Co SILNIK ma zrobić w `main.ts` (1 batch)

**Backup:** `gra/src/main.ts.bak-SILNIK-20260627-B2-porzadek`

### 1. Importy (obok istniejących order)

```typescript
import {
  evaluateOrder, loadOrderParams,
  orderEffectsToYieldMults, pickRevoltMigrationTarget,
  type OrderYieldMults,
} from './game/order';
```

### 2. Mapy obok `growthMultMap` (~l.342)

```typescript
const orderMultMap = new Map<string, OrderYieldMults>();
const orderValueMap  = new Map<string, number>(); // do migracji + UI porzadek
```

### 3. `advanceCityEconomy` — przekaż `orderMultMap`

```typescript
const econ = advanceCityEconomy(
  cities, map, data, _menuDifficulty, econUnits,
  growthMultMap, cityBuilt, player.era, player.zbadane, ownerCivMap,
  orderMultMap,  // NOWY argument (7. param po ownerCivMap)
);
```

### 4. Pętla Porządek (~l.2048–2072) — ZASTĄP blok buntu

**Usuń:** `city.population = Math.max(1, city.population - 1)` (vanish pop).

**Wstaw:**

```typescript
const ord      = evaluateOrder({ szczescie, prawo: 0 }, op);
const orderEff = ord.effects;
let buntFlag = false;

if (ord.tier !== 'neutral') {
  console.log(`[Porzadek] Tura ${turn} ${city.name}: tier=${ord.tier} order=${ord.order} szc=${szczescie.toFixed(1)}`);
}

if (orderEff.revoltRisk > 0 && rng() < orderEff.revoltRisk) {
  const targetId = pickRevoltMigrationTarget(
    cid, city.ownerId, cities, orderValueMap,
  );
  if (targetId) {
    const target = cities.find(c => c.id === targetId);
    if (target && city.population > 1) {
      city.population -= 1;
      target.population += 1;
      buntFlag = true;
      console.log(`[Bunt] Tura ${turn} ${city.name} → migracja −1 do ${target.name} (risk=${orderEff.revoltRisk.toFixed(2)})`);
    }
  }
}

cityOrderState.set(cid, {
  szczescie: Math.round(szczescie * 10) / 10,
  porzadek: ord.order,   // było 0 — UI progi T1/T2
  progT1: op.progT1,
  progT2: op.progT2,
  bunt: buntFlag || undefined,
});

orderValueMap.set(cid, ord.order);
growthMultMap.set(cid, orderEff.growthMult);
orderMultMap.set(cid, orderEffectsToYieldMults(ord.tier, orderEff));
```

**Kolejność tury (ważne):** `advanceCityEconomy` na **początku** tury używa map z **końca poprzedniej** tury (jak `growthMultMap` dziś). Efekty Porządku liczone **po** ekonomii tej tury → wpływ na **następną** turę. To zamierzone.

### 5. Produkcja — usuń podwójny mnożnik Pracy (~l.2072)

Dziś: `const praca = pracaRaw * orderEff.productionMult;`

Po wpięciu `orderMultMap` w `advanceCityEconomy`, `econTick.praca` / `doBudynkow` już zawierają karę/bonus:

```typescript
const praca = pracaRaw; // bez * orderEff.productionMult
```

(albo `econ.perCity.find(...).doBudynkow` jeśli wolisz jeden strumień)

### 6. Haki UI — weryfikacja (już powinny być)

- `getOrderState` → `cityOrderState.get(cityId)`
- `getCityHealth` → `computeCityHealthBreakdown(...)`

Jeśli brak — patrz `UI-do-MASTER_B2-spoleczenstwo.md` §2.

---

## DoD (kryteria akceptacji)

- [ ] Niepokój: Pieniądz/Nauka/Kultura ×0,85/×0,90/×0,90 (normal) w ticku ekonomii **następnej** tury
- [ ] Ład: bonus handlu na Pieniądz (`tradeMult` → `orderEffectsToYieldMults`)
- [ ] Bunt: migracja −1/+1 w imperium; brak kandydatów = brak utraty pop
- [ ] Panel: `porzadek` ≠ 0, badge „szacunek” znika w Porządku
- [ ] `node tools/logic-test.cjs` — sekcja `order:` zielona
- [ ] `npx tsc --noEmit` OK
- [ ] Bramka → `Gra-podglad-ROBOCZA.html`

---

## NIE w scope

- **B2-Q5** chip buntu na mapie → Grupa A (`UI-do-GRUPA-A_B2-Q5-bunt-chip.md`)
- Prawo / garnizon → `prawo: 0` do czasu osobnego batcha
- Publikacja finalna `Gra-podglad.html` → Master po Opus

---

## Raport po wpięciu

1. `dyspozycje/SILNIK-DO-MASTERA.md` — batch B2-porzadek
2. `docs/czaty/DO-MASTERA.md` § F → `→ MASTER: GOTOWE-ROBOCZA`
3. Maciej: skrót po polsku w czacie F (co wpięto, testy)

**Flaga:** GOTOWE
