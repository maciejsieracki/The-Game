# INTEGRATOR → GRUPA D (CYWILIZACJE): Moc jednostki (M) — **WPIĘTE w Power**

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **WPIĘTE** — Power + militaryRatio na M · kanon `2FC4DCA9…` |
| **Data** | 2026-06-30 |
| **Od** | Integrator F |
| **Do** | Grupa D (dyplomacja, AI, Panel-D) |
| **Flaga** | **CZYTAJ + WDROŻ w lane D** |
| **Kanon** | md5 `3DAE1AA5C463CFD9E90F77C5D2DCFC76` |
| **Powiązane** | `UNITS-do-SILNIK_unit-power-moc.md` ✅ · `CYWILIZACJE-do-GRUPA-D_moc-jednostek-power.md` |

---

## TL;DR — co macie w grze **już teraz**

1. **M per jednostka** — `fieldPower` / `siegePower` w `units.json` + runtime `gra/src/game/unit-power.ts`.
2. **Power imperium (P-A)** — składnik **Armia** = **suma M_pole** (nie liczba głów) · Integrator wpiął w `main.ts`.
3. **Respekt dyplomacji** — `computeRespekt(objectivePower_self, objectivePower_partner)` **już widzi M** (Power liczy się z sumą M).
4. **Wasze zadanie:** dopiąć resztę dyplomacji/AI do M + weryfikacja + ewent. progi Panel-D / strojenie współczynnika Panel-B.

**Hasło w czacie D:** `start` → ten handoff + sekcja **DO ZROBIENIA** poniżej.

---

## API — co możecie importować (lane D)

### Moduł `unit-power.ts` (🟢 własność UNITS, czytajcie/importujcie)

```typescript
import {
  armyFieldPower,      // M_pole jednej definicji; oblężnicze → 0
  sumArmyFieldPower,   // suma M × count (tablica definicji)
  fieldPower,          // { attack, defense, total }
  siegePower,          // M_siege (oblężenie — osobny temat)
  isSiegeUnit,
  loadUnitPowerCoeffs,
} from './unit-power';
```

**Cache:** `armyFieldPower(def)` preferuje `def.fieldPower` z JSON (Hastati = **50.0**, Triari = **51.5**).

### Power + Respekt (czytajcie z silnika — **nie duplikujcie wzorów**)

| API | Gdzie | Użycie |
|-----|-------|--------|
| `objectivePowerForOwner(ownerId)` | `main.ts` (runtime) | liczba Power imperium |
| `objectivePowerByOwner` | cache co turę | breakdown 9 składników |
| `computeRespekt(a, b)` | `diplomacy.ts` | Respekt % (ratio Mocy) |

**Breakdown armii po wpięciu:**
```typescript
objectivePowerByOwner.get(ownerId)?.components.find(c => c.key === 'armia')
// rawCount = suma M (np. 10× Hastati ≈ 500)
// points   = rawCount × jednostka_wojskowa.pkt (Panel-B, domyślnie 25)
```

---

## Co Integrator **już zrobił** (nie powtarzajcie)

| Element | Status |
|---------|--------|
| `sumArmyMForOwner(ownerId)` w `main.ts` | ✅ |
| `buildObjectivePowerForOwner` → `jednostki: sumArmyMForOwner(...)` | ✅ |
| Respekt co turę z `objectivePowerByOwner` | ✅ (bez zmian w `diplomacy.ts`) |
| Kanon `Gra-podglad.html` | ✅ md5 `3DAE1AA5…` |
| Testy: unit-power 6/6 · combat 6/6 · smoke · power-objective 9/9 | ✅ |

---

## Co Grupa D **ma wpiąć** (dyplomacja + Power)

### P0 — Weryfikacja (od razu)

- [ ] Uruchomić `node gra/tools/diplomacy-test.cjs` (135/135)
- [ ] Uruchomić `node gra/tools/ai-test.cjs`
- [ ] Spot-check Respekt: imperium z 10× Hastati vs 10× Triari — **Triari wyższy Power armii** (501.5 vs 500 M)
- [ ] Meldunek append: `CYWILIZACJE-DO-MASTERA.md`

### P1 — `militaryRatio` na M — ✅ Integrator (2026-06-30)

- [x] `buildProposalEvalContext` — suma M
- [x] Pętla AI dyplomacji — suma M
- [x] diplomacy-test 140/140 · ai-test 198/198
- [x] Kanon md5 `2FC4DCA9E55E5FF9515A67233372EC3D`

### P2 — Panel-D / balans Respektu

Po wyższym Power armii (M×pkt) progi 60/70/90 mogą „łapać” szybciej:

- [ ] Symulacja 2–3 scenariuszy (Excel / Python `intrinsic-unit-power.py`)
- [ ] Jeśli playtest/Maciej każe — korekta progów w `Panel-D.xlsx` → `export-d.py`
- [ ] **Nie** edytować `units.json` (parametry **ZAMKNIĘTE**)

### P3 — Strojenie skali (Maciej, nie kod D)

Współczynnik `jednostka_wojskowa.pkt` w **Panel-B** (`power-params.json`) — jeśli Power armii za wysoki globalnie. Grupa D może zaproponować wartość w meldunku, decyzja Macieja.

---

## Czego **NIE** robić

| Zakaz | Powód |
|-------|-------|
| Duplikować wzory M w `diplomacy.ts` | jest `unit-power.ts` |
| Liczyć Respekt z legacy `computePotegaNacji` / Wpływ 0–100 | kanon = objective Power P-A |
| Edytować `units.json` / `main.ts` bez handoffu | własność UNITS / Integrator |
| Czytać `respekt_-_czynniki` w `diplomacy.json` | archiwum |

---

## DoD Grupy D

- [ ] Przeczytany ten handoff + zaktualizowany `CYWILIZACJE-do-GRUPA-D_moc-jednostek-power.md`
- [ ] diplomacy-test + ai-test zielone po weryfikacji
- [ ] `militaryRatio` — helper + handoff Integrator (P1) **lub** świadoma decyzja „zostaw headcount” (melduj)
- [ ] Panel-D — ocena progów po M (P2) — w meldunku PASS / wymaga strojenia
- [ ] Append `CYWILIZACJE-DO-MASTERA.md`: **→ MASTER: M→Power dyplomacja OK**

---

## Eskalacja

| Pytanie | Kierunek |
|---------|----------|
| API M / wzory | `unit-power.ts` + `docs/WALKA-TW-v3.md` |
| Wpięcie `main.ts` (militaryRatio) | handoff → Integrator F |
| Skala Power / pkt armii | Maciej → Panel-B |
| Gameplay progi dyplo | Maciej ABC → Panel-D |

---

**Źródło operacyjne:** `docs/obieg/D-cywilizacje.md` · **STAN:** `dyspozycje/CYWILIZACJE-STAN.md`
