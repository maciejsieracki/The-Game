# GRUPA A → GRUPA C: F-P1-01 spec ataku miasta z mapy

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **GOTOWE** (spec) · **→ C: IMPLEMENT / VERIFY** |
| **Data** | 2026-07-02 |
| **Warstwa** | 🟡 cross (preBattle + BattleScene + map roster) |
| **Blokuje** | Grupa C P1 (MASTER-PILNE) |

---

## Co przekazuję

Pełna spec: **`docs/decyzje/F-P1-01-atak-miasta-z-mapy.md`**

Decyzje już zamknięte — **nie pytaj Macieja** o C1-Q1…Q5 ani C3-Q1…Q10.

---

## Co Grupa C ma zrobić

### 1. Weryfikacja preBattle (szturm z muru)

| AC | Opis |
|----|------|
| AC-C1 | `showPreBattle` przy szturmie: layout TW, Enter=manual, Escape=cancel |
| AC-C2 | `BattleScene({ deploy: false, siege: … })` — mur widoczny w C2 |
| AC-C3 | Auto-resolve szturmu: `resolveAutoBattleByPower` + `finishSiegeStormBattle` |
| AC-C4 | Anuluj preBattle → powrót do `siegeMapPanel` (nie kończy oblężenia) |

**Pliki C:** `gra/src/ui/preBattle.ts` · `gra/src/battle/battleScene.ts` · testy `combat-test.cjs` / `battle-smoke.cjs`

### 2. GAP-A1 / GAP-A2 — miasto **bez muru** (decyzje Maciej 2026-07-02)

| ID | Decyzja |
|----|---------|
| **F-P1-01-Q1=A** | Klik: brak obrońców → zdobycie + **komunikat** (bez ekranu przed bitwą); są obrońcy → ekran przed bitwą |
| **F-P1-01-Q2=A** | Ruch na hex miasta → **ten sam flow** co klik (wspólny handler po animacji) |

C **dostarcza** (jeśli brakuje helperów):

- Kontrakt rosteru dla `tryb === 'zdobycie_z_marszu' | 'bitwa_polowa'` — ten sam co C1-Q4 (dist≤1)
- Testy regresji: pusty garnizon → brak preBattle; obrońca dist≤1 → preBattle

**NIE edytuj `main.ts`** — handoff `C-do-INTEGRATOR_F-P1-01-unwalled-city.md` po AC.

### 3. F-P1-02 (defer)

Pełne mapowanie pozycji jednostek z heksów mapy na siatkę C2 — **osobny batch** po F-P1-01.

---

## Testy oczekiwane (lane C)

```
node gra/tools/combat-test.cjs
node gra/tools/battle-smoke.cjs
node gra/tools/obleczenie-test.cjs   # 27/27 baseline
node gra/tools/map-siege-test.cjs    # 6/6 baseline
```

---

## Meldunek

Append: `CYWILIZACJE-DO-MASTERA.md` lub `UNITS-DO-MASTERA.md` (lane C) → **`przekaż do Mastera`**

---

*Od: Grupa A · spec-only · bez playtestu Macieja (OBOWIĄZ-PT)*
