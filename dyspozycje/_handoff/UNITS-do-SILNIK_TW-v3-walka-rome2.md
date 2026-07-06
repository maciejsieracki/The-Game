# UNITS → SILNIK (INTEGRATOR) — TW v3 walka Rome 2

| Pole | Wartość |
|------|---------|
| **Status** | **DANE GOTOWE** · F1 silnik ✅ · F3 częściowo · super-y ✅ 2026-06-30 |
| **Decyzja Maciej** | Walka wręcz = **Total War Rome 2** · staty = **hard input** z JSON (bez ÷10 w silniku) |
| **Dane** | **ZAMKNIĘTE** (2026-06-30) — `units.json` + super-y + audyt melee/dystans |
| **Silnik** | **TW v3** w `combat.ts` — Faza 1 ✅ · `main.ts` częściowo EN |
| **Eksport super** | `dyspozycje/_handoff/UNITS-do-SILNIK_EKSPORT-TW-v3-super-2026-06-30.md` |

---

## Stan dziś

| Warstwa | Plik | Stan |
|---------|------|------|
| Dane | `gra/data/units.json` | EN: `meleeAttack`, `meleeDefence`, `weaponDamage`, `armor`, `piercing`, `chargeBonus`, `health`, `missileAttack`, `wallAttack` (Katapulta) |
| Stałe | `gra/data/combat-params.json` → `tw_v3` | hit 40 / min 15 / max 75 — **nieużywane** |
| Silnik | `gra/src/game/combat.ts` | **TW v3 Rome 2** (`hitChanceTw`, `damageTw`) — **Faza 1 GOTOWA** · gra (`main.ts`) **CZEKA Faza 3** |
| Gra | `main.ts`, `manualBattle.ts`, `battleScene.ts` | czytają **`Atak`, `Obrona`, `Obrażenia`…** — **brak mapowania EN** |
| Kanon | `docs/WALKA-TW-v3.md` | wzory + reguły migracji |

**Wyjątki balansu w danych:** Hastati `meleeAttack=8`, `weaponDamage=8` · Konnica `meleeAttack=30`.

---

## Wzory (kanon)

```
hit% = clamp(tw_v3.hit_base + meleeAttack − meleeDefence_wroga + bonusy, hit_min, hit_max)
dmg  = max(0, weaponDamage − armor_wroga) + piercing + chargeBonus (r1, tylko atakujący)
```

**Pilum (faza 0):** ten sam hit% · `dmg = max(1, missileAttack − armor)` · bez ÷10 · `Ilość pocisków` razy.

**Katapulta:** `missileAttack` vs jednostki · `wallAttack` vs mur — **osobny temat oblężenia** (poza batch 1).

**Kolejność tury:** atakujący → kontratak · postawa Falanga/Włócznik = szarża OFF r1.

**Usunąć z walki wręcz:** `hitChanceMatrix`, `matrixDamage`, `usesMatrixCombat`, `dmg_scale`, `pancerz_divisor`.

---

## Rekomendacja INTEGRATORA — najłatwiej = 3 fazy (nie wszystko naraz)

### Faza 1 — UNITS (bez `main.ts`) — **GOTOWE 2026-06-30**

1. `combat.ts`: `hitChanceTw`, `damageTw`, `rangeDamageTw`, `resolveCombat` na polach EN
2. `CombatUnit` interface: pola EN (meleeAttack, health, missileAttack…)
3. `combat-test.cjs`: adapter EN + assert wzorów TW (Hastati vs Falanga hit=38%)
4. **DoD:** `node tools/combat-test.cjs` **6/6 ZIELONE** · **zero** zmian w `main.ts`

### Faza 2 — loader (CYWILIZACJE lub UNITS) — CZEKA

### Faza 2 — loader (CYWILIZACJE lub UNITS)

1. `gra/src/data/loader.ts`: przy wczytywaniu `units.json` mapować EN → runtime (albo zostawić EN jako kanon w defs).
2. **DoD:** `units.json` round-trip · defs mają EN.

### Faza 3 — SILNIK (MASTER, jeden batch)

1. `battleUnitToCombatUnit` + wszystkie inline `CombatUnit` w `main.ts` (~5534+).
2. `manualBattle.ts` / `battleScene.ts` → `toCombatUnit` na EN.
3. Build `/tmp/civ-dist` + bramka 17 suitów + battle-smoke.
4. **Opus review** → kanon.

**Poza batch 1 (łatwiej odłożyć):** pre-bitwa hit%, `siege.ts` + `wallAttack`, taktyczna `battleScene` — osobne handoffy.

---

## Dlaczego tak jest łatwiej

| Podejście | Ocena |
|-----------|--------|
| **Wszystko naraz** (combat + main + bitwa 3D + oblężenie) | trudne, dużo regresji |
| **Adapter „stary CombatUnit + mapowanie w combat.ts”** | szybsze short-term, ale dwa kontrakty — **nie polecane** |
| **Faza 1 testy → Faza 3 wpięcie** | **najłatwiejsze bezpieczne** — silnik gotowy zanim dotykamy 2800-linijkowego `main.ts` |

---

## Pliki (własność)

| Lane | Pliki |
|------|-------|
| **UNITS** | `combat.ts`, `combat-test.cjs`, ewent. `manualBattle.ts`/`battleScene.ts` `toCombatUnit` |
| **SILNIK** | `main.ts`, publikacja kanonu |
| **CYWILIZACJE** | `loader.ts` (jeśli Faza 2 osobno) |

---

## DoD całości (Maciej sign-off walki)

- [ ] Auto-walka mapy używa TW Rome 2 na statach z JSON (hard input, bez ÷10)
- [ ] Pilum: `missileAttack` + liczba pocisków z JSON
- [ ] combat-test + smoke/battle-smoke zielone
- [ ] Playtest: Hastati vs Falanga ~ sensowna długość (HP 19/25)
- [ ] Opus APPROVE przed kanonem

---

## Referencje

- `docs/WALKA-TW-v3.md`
- `gra/tools/TW-v3-audyt-jednostek.md`
- `gra/tools/audit-units-tw-v3.py`
- `panele-sterowania/TW-dystans-edycja.xlsx` (dystans — zamknięte)

**Flaga handoff:** GOTOWE
