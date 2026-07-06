# MASTER → UNITS (Walka): balans TW + scena T — wdrożone 2026-07-03

**STATUS: GOTOWE (Master)** · kanon md5 **`04d21f3087be8f4e85470ddad2335e70`**

---

## Co zrobiono (Maciej: „rób”)

### 1. Dane — `units.json` (już wcześniej, dziś potwierdzone w bundle)

| Zmiana | Zakres |
|--------|--------|
| `health × 1,5` | wszystkie jednostki w `gra/data/units.json` (+ sync robocza/kanon) |
| `missileAttack ÷ 2` (min 1) | jednostki z `missileAttack > 0` |
| **`Ilość pocisków` bez zmian** | np. Łucznik nadal **30** |

Przykład **Łucznik:** `health` 12 · `missileAttack` 3 · pociski 30.

Legacy kolumny (`Atak`, `Atak dystansowy`, `Pancerz`…) **zostają w JSON** (Excel/export) — **nie są już czytane** przez scenę T po tym batchu.

### 2. Kod — scena bitwy T (`battleScene.ts`)

**Bug:** `_singleBlow` czytał `cuA.Atak` / `cuA['Atak dystansowy']` z `CombatUnit`, który ma tylko pola TW → gra w scenie T **ignorowała** pass balansu.

**Fix (zgodny z `combat.ts` / `resolveCombat`):**

- hit: `hitChanceTw(meleeAttack, meleeDefence, chargeBonus?)`
- dystans: `rangeDamage(missileAttack, armor)`
- zwarcie: `baseDamage(weaponDamage, armor, piercing, chargeBonus, isCharge)`

Pliki: `gra/src/battle/battleScene.ts` → zsynchronizowane **gra-robocza/** + **gra-kanon/**.

### 3. Skip bitwy — `computeInstantResult`

- było: `cu.Health` (legacy, nieużywane przez `resolveCombat`)
- jest: `cu.health = a.hp` · po walce: `a.hp = res.attackerHpLeft`

### 4. Test battle — `testBattle.ts`

- `rowHealth`: preferuje `health`, fallback `Health`

### 5. Bundle grywalny

- build → `publish-robocza-snapshot.ps1` → `publish-kanon-snapshot.ps1`
- **Start:** `gra-kanon/START.html` · **robocza:** `gra-robocza/START.html`
- root `Gra-podglad.html` = kanon

---

## Testy Master

| Suite | Wynik |
|-------|-------|
| `combat-test.cjs` | **6/6 PASS** |
| `smoke.cjs` | **OK** |
| `battle-smoke.cjs` | FAIL (pre-existing — zmiana etykiety przycisku preBattle, nie ten batch) |

---

## Co lane UNITS ma wiedzieć / ewentualnie dalej

1. **Scena T = ten sam TW co auto-resolve** — playtest Macieja powinien teraz odzwierciedlać `combat-test`.
2. **30 pocisków** nadal daje długą fazę dystansową w auto-resolve — to **osobna decyzja ABC** (limit salw / ammo), nie wdrożone.
3. **`manualBattle.ts`** — sprawdzić czy nie ma legacy pól (poza scope tego batcha).
4. **Milicja** (`siege.ts` / `makeMilitia`) — poza pass `units.json`; osobny temat jeśli Maciej chce spójność.
5. **Panel-C balans Excel** — nadal może nadpisać JSON; po imporcie **wymagany rebuild kanonu**.

---

## DoD lane (informacyjnie)

- [x] Master melduje w `UNITS-DO-MASTERA.md`
- [ ] UNITS: opcjonalny regression test sceny T (1v1 Łucznik) — jeśli priorytet
- [ ] Maciej playtest: Ctrl+F5 · `gra-kanon/START.html` · bitwa ręczna + skip
