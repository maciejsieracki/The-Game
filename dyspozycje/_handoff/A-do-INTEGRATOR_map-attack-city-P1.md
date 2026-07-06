# GRUPA A → INTEGRATOR (F): F-P1-01 map attack city

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **GOTOWE** (spec + audyt) · **→ INTEGRATOR: BATCH** |
| **Data** | 2026-07-02 |
| **Priorytet Master** | P1 PILNE |
| **Warstwa** | 🟡 cross (`main.ts` routing) |

---

## Spec

`docs/decyzje/F-P1-01-atak-miasta-z-mapy.md`

Handoff C: `dyspozycje/_handoff/A-do-C_map-attack-spec-F-P1-01.md`

---

## Co wpiąć (SILNIK / F)

### Batch 1 — już w kanonie ✅

- Klik wrogie miasto + mur + dist=1 → `cityAttackChoice`
- Oblężaj → `startMapSiege` (bez preBattle)
- Szturm → preBattle → `deploy: false` + mur

### Batch 2 — GAP-A1 + GAP-A2 (decyzje Maciej 2026-07-02)

**F-P1-01-Q1=A · F-P1-01-Q2=A**

**Plik:** `gra/src/main.ts` (jedyny editor: MASTER/F)

1. Wspólna funkcja `resolveUnwalledCityAttack(ctx)`:
   - `!hasCityDefenders` → `captureCityWithoutBattle` + `cityCaptureNotice` (**bez** preBattle)
   - else → pipeline preBattle (jak szturm bez muru / bez flagi `siege`)
2. **Klik** wrogie miasto bez muru + dist=1 + zaznaczona jednostka → wywołaj (1) zamiast hintu L5115
3. **Ruch** zakończony na hex wrogiego miasta bez muru → wywołaj (1) w handlerze animacji (GAP-A2)

### ~~Batch 2b~~ — wchłonięte w Q2=A

---

## Co sprawdzić po wpięciu (Master playtest — nie lane A)

1. Hastati obok Aten (mur) → Oblężaj / Szturm / Anuluj
2. Miasto wrogie **bez muru**, bez obrońców → zdobycie bez walki
3. Miasto bez muru + Łucznik dist≤1 → preBattle → bitwa
4. Oblężenie: brak preBattle do momentu Szturm

---

## Testy bramka (przed kanonem)

```
node gra/tools/map-improvement-qualify-test.cjs  # 43/43
node gra/tools/map-siege-test.cjs                  # 6/6
node gra/tools/obleczenie-test.cjs                 # 27/27
node gra/tools/battle-smoke.cjs
```

---

## Zależności

| Od | Co |
|----|-----|
| **C** | AC preBattle + ewent. helper roster unwalled |
| **A** | ✅ spec (ten handoff) |

---

*Grupa A · przekaż do Mastera · bez playtestu Macieja*
