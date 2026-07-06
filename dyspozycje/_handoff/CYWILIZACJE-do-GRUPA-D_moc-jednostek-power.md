# CYWILIZACJE → GRUPA D: Moc jednostki (M) → składnik Armia w Power

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **WPIĘTE w Power** (Integrator 2026-06-30) · **Grupa D: wpięcie dyplomacji** → `INTEGRATOR-do-CYWILIZACJE_unit-power-m-wpięte.md` |
| **Data** | 2026-06-30 |
| **Od** | MASTER / Maciej / Integrator |
| **Flaga** | **WDROŻ w lane D** — Respekt OK · `militaryRatio` + Panel-D = wasze |
| **Powiązane** | `EKONOMIA-do-GRUPA-D_moc-respekt-GOTOWE.md` · `UNITS-do-SILNIK_unit-power-moc.md` ✅ |

---

## TL;DR dla Grupy D

1. **Respekt już na M** — Power armii = suma `fieldPower` (Integrator wpiął w `main.ts`). `computeRespekt` bez zmian kodu.
2. **M w JSON/TS:** `fieldPower` / `siegePower` · `gra/src/game/unit-power.ts` · test **6/6**.
3. **Wasze teraz:** weryfikacja testów dyplo · **`militaryRatio` na M** (helper + handoff Integrator) · progi Panel-D.
4. **Handoff operacyjny:** `INTEGRATOR-do-CYWILIZACJE_unit-power-m-wpięte.md`

---

## Stan na dziś (2026-06-30) — co jest, czego nie ma

| Element | Status | Gdzie |
|---------|--------|--------|
| **M per jednostka w JSON** (`fieldPower`, `siegePower`) | ✅ | `units.json` · auto `gen-panel-c.py` / `export-c.py` |
| Wzory M (algorytm) | ✅ Python + TS | `unit_power.py` · `gra/src/game/unit-power.ts` |
| Ranking M (podgląd) | ✅ | `intrinsic-unit-power.py` · Panel-C **Moc-jednostek** |
| **M w grze (runtime Power)** | ✅ **WPIĘTE** | `sumArmyMForOwner` → `buildObjectivePowerForOwner` · kanon `3DAE1AA5…` |
| Panel-C staty walki | ✅ | `Jednostki-staty` + wallAttack |
| Panel-C arkusz **Moc-jednostek** | ✅ | formuły Excel · read-only |
| Panel-C **Stale-moc** | ✅ | → `combat-params.json` → `unit_power` |
| Integrator — kanon balansu | ✅ handoff | `UNITS-do-INTEGRATOR_balans-tw-v3-2026-06-30.md` |
| Handoff SILNIK (M → Power) | ✅ | `UNITS-do-SILNIK_unit-power-moc.md` |
| Test M | ✅ 6/6 | `gra/tools/unit-power-test.cjs` (Hastati=50, Triari=51.5) |

**Następny krok:** Grupa D — weryfikacja dyplo/AI · `militaryRatio` na M · Panel-D. Handoff: `INTEGRATOR-do-CYWILIZACJE_unit-power-m-wpięte.md`

---

## Wzory M (kanon Maciej — decyzja 2A)

### Walka pole (armia na mapie)

```
A      = AP + Obraż + Przeb + Szarża/2 + AD/2
O      = OBR + Panc + HP/2
M_pole = A + O
```

- AP = `meleeAttack`, OBR = `meleeDefence`, Obraż = `weaponDamage`, AD = `missileAttack`
- Jednostki **Oblężnicza** (Katapulta, Taran, Wieża) **nie wchodzą** do sumy armii na polu

### Oblężenie (osobno — auto-walka / AI oblężenia, później)

```
A_siege  = wallAttack + AD
O_siege  = OBR + Panc + HP/10
M_siege  = A_siege + O_siege
```

Implementacja Python: `gra/tools/unit_power.py` · dokumentacja: `docs/WALKA-TW-v3.md` · algorytm auto-walki: `docs/AUTO-WALKA-MOC-ALGORYTM.md`

**Podgląd rankingu:**
```powershell
python gra/tools/intrinsic-unit-power.py
python gra/tools/intrinsic-unit-power.py --field    # bez oblężniczych
python gra/tools/intrinsic-unit-power.py --siege   # tylko 3 oblężnicze
```

---

## Dwa poziomy „mocy” — nie mylić

| Pojęcie | Skala | Kto liczy | Gdzie w Excelu |
|---------|-------|-----------|----------------|
| **M jednostki** (M_pole) | ~20–55 pkt per typ | UNITS (`unit-power.ts`) + Python | Panel-C Moc-jednostek (plan) |
| **Power imperium** (Moc cywilizacji) | ~3000 duże imperium | EKONOMIA + SILNIK | Panel-B `Potega-P-A` |
| **Respekt dyplomacji** | 0–100 relatywny | CYWILIZACJE (`computeRespekt`) | Panel-D `Dyplomacja` |

**Respekt:**
```
Respekt(A→B) = round(100 × Power_A / (Power_A + Power_B))
```
Parytet = 50 · Asymetria: Respekt(A→B) + Respekt(B→A) = 100.

Spec gotowy Power + Respekt: `dyspozycje/_handoff/EKONOMIA-do-GRUPA-D_moc-respekt-GOTOWE.md`

---

## Gdzie Grupa D **czyta** (już działa)

| API | Plik | Użycie |
|-----|------|--------|
| `objectivePowerForOwner(ownerId)` | `gra/src/main.ts` | liczba Power imperium |
| `objectivePowerByOwner` | `gra/src/main.ts` | cache + breakdown składników |
| `computeRespekt(powerSelf, powerPartner)` | `gra/src/game/diplomacy.ts` | Respekt % |
| `computeObjectivePower(input)` | `gra/src/game/power-objective.ts` | pure — składniki Power |
| `aiDiplomacyStance(...)` | `gra/src/game/diplomacy.ts` | AI + `AIDiplomacyContext` |
| `buildProposalEvalContext(...)` | `gra/src/main.ts` | propozycje dyplo |

**Składnik Armia dziś (PRZED wpięciem M):**
```typescript
// power-objective.ts
row('armia', 'Armia', input.jednostki, coeff.jednostkaWojskowa)
// input.jednostki = LICZBA sztuk na mapie (countUnitsForPowerArmy)
// współczynnik Panel-B: jednostka_wojskowa.pkt = 25 (domyślnie)
```

**Po wpięciu M (docelowo):**
```typescript
// input.jednostki → suma M_pole wszystkich jednostek (bez oblężniczych)
// pkt_armia = suma_M × współczynnik_Panel-B
```

Breakdown po wpięciu:
```typescript
objectivePowerByOwner.get(oid)?.components.find(c => c.key === 'armia')
// rawCount = suma M (nie liczba głów)
```

---

## Gdzie Grupa D **NIE wpięcie** (cudze lane'y)

| Zmiana | Właściciel | Plik |
|--------|------------|------|
| Suma M armii → Power | **SILNIK** | `gra/src/main.ts` → `buildObjectivePowerForOwner()` |
| Moduł `fieldPower(unitDef)` | **UNITS** | `gra/src/game/unit-power.ts` (jeszcze nie istnieje) |
| Wzory / testy M | **UNITS** | `unit_power.py` → mirror TS + test |
| Współczynnik pkt Armia | **Maciej / Panel-B** | `power-params.json` → `skladniki.jednostka_wojskowa` |
| Staty jednostek | **zamknięte** | `units.json` — nie edytować |

**Grupa D nie dotyka:** `main.ts`, `power-objective.ts`, `units.json`, `combat.ts`, `unit-power.ts`.

---

## Co Grupa D **może robić teraz**

### 1. Symulacje (Excel / Python)

- M per typ: `intrinsic-unit-power.py` lub PROPOZYCJA.xlsx
- Power armii: `suma(M_pole jednostek na mapie) × 25` + pozostałe składniki z `power-objective.ts`
- Respekt: `100 × Moc1 / (Moc1 + Moc2)`
- Kalkulator: `docs/decyzje/POWER-kalkulator-Maciej.xlsx` (jeśli jest)

### 2. Panel-D (Wasz balans)

| Arkusz | JSON | Przykłady |
|--------|------|-----------|
| Dyplomacja | `diplomacy.json` → `params` | progi wasalizacji, delty bitwa/trybut |
| Dyplomacja-per-nacja | per cyw | skłonność wojna/sojusz |
| AI-zachowanie | `ai-params.json` | ekspansja, dyplomacja AI |

Eksport: **`eksportuj panel D`** → `python panele-sterowania/export-d.py`

**Nie używajcie** legacy sekcji `respekt_-_czynniki` / Potęga 0–100 w `diplomacy.json` — silnik używa objective Power od v1 Mocy.

### 3. Przygotowanie pod `militaryRatio` (decyzja ABC — Maciej)

Dziś `militaryRatio` = **liczba jednostek / liczba jednostek** (`main.ts` ~3358, ~6443) — **nie** suma M.

| Opcja | Opis |
|-------|------|
| **A** | `militaryRatio = sumaM_self / sumaM_partner` (spójne z realną siłą) |
| **B** | zostawić headcount (prostsze, mniej spójne z Power) |

Po decyzji Macieja — zmiana w **SILNIK** (`main.ts`), Grupa D tylko dostosowuje progi AI w Panel-D jeśli trzeba.

---

## Kolejność batchy (kiedy implementować)

```
1. UNITS     → unit-power.ts + testy + handoff UNITS-do-SILNIK
2. SILNIK    → buildObjectivePowerForOwner: suma M zamiast countUnitsForPowerArmy
3. INTEGRATOR→ rebuild kanon (bez zmian main poza batch SILNIK)
4. GRUPA D   → weryfikacja Respekt/AI · ewent. rekalibracja progów Panel-D
5. Maciej    → playtest · ewent. skala jednostka_wojskowa w Panel-B
6. Jutro     → auto-walka (osobny temat)
```

---

## Pliki — mapa własności Grupy D

**Możecie edytować:**
- `gra/src/game/diplomacy.ts`, `diplomacy-proposals.ts`, `diplomacy-display.ts`, `ai.ts`
- `gra/data/diplomacy.json`, `ai-params.json`, `civs.json`
- `panele-sterowania/Panel-D.xlsx` → `export-d.py`
- `gra/tools/diplomacy-test.cjs`, `ai-test.cjs`

**Czytajcie tylko:**
- `gra/tools/unit_power.py`, `intrinsic-unit-power.py`
- `gra/src/game/power-objective.ts`, `power-options.ts`
- `gra/data/power-params.json`, `units.json`

---

## Przykłady M (po balansie TW v3)

| M_pole | Jednostka |
|-------:|-----------|
| 55.5 | Medżaj |
| 51.5 | Triari |
| **50.0** | **Hastati** |
| 45.0 | Falanga |
| ~42 | Konnica (AP=8) |
| słabe | dystans na polu — **zamierzone** |

Oblężenie (M_siege): Katapulta wallAttack=16, Taran=14, Wieża=6.

---

## DoD Grupy D (faza ODCZYT)

- [x] Przeczytany ten handoff + `EKONOMIA-do-GRUPA-D_moc-respekt-GOTOWE.md`
- [x] Zrozumiane: M w JSON (`fieldPower`) + TS · Respekt z Power · wpięcie = SILNIK
- [ ] Opcjonalnie: symulacja 2–3 scenariuszy Respekt z sumą M (Excel/Python)
- [x] **Nie** commitować zmian w `main.ts` / `units.json` pod pretekstem M (lane UNITS/SILNIK)

## DoD Grupy D (faza PO wpięciu SILNIK) — **AKTYWNE**

- [ ] Przeczytany `INTEGRATOR-do-CYWILIZACJE_unit-power-m-wpięte.md`
- [ ] `diplomacy-test.cjs` / `ai-test.cjs` zielone
- [ ] Respekt sensowny vs playtest (Triari > Hastati w Power armii)
- [ ] `militaryRatio` — helper + handoff Integrator **lub** świadomy backlog
- [ ] Progi Panel-D skorygowane jeśli Maciej każe
- [ ] Meldunek: `CYWILIZACJE-DO-MASTERA.md` append

---

## Eskalacja

| Problem | Działanie |
|---------|-----------|
| Brak `unit-power.ts` | Czekaj na UNITS — nie duplikuj wzorów w `diplomacy.ts` |
| Respekt skacze po wpięciu | Normalne — rekalibracja Panel-B (współczynnik) + Panel-D (progi) |
| Pytanie gameplay | Maciej ABC |
| Integrator pyta o M | Odsyłaj tutaj — M **poza** batchem TW-v3-BALANS |

---

**Źródło operacyjne:** `dyspozycje/CYWILIZACJE-DO-MASTERA.md`  
**Integrator (osobno):** `dyspozycje/_handoff/UNITS-do-INTEGRATOR_balans-tw-v3-2026-06-30.md`
