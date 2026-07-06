# Handoff MASTER → INTEGRATOR (Grupa F) — EKO-TECH Paczka 3

**Data:** 2026-07-04 · **Status:** GOTOWE  
**Decyzje:** `docs/decyzje/PACZKA-3-EKO-TECH-ABC-2026-07-04.md`

## Co przesyłam

| Plik | Zmiana |
|------|--------|
| `gra/data/buildings.json` | `odlewnia_brazu` → nazwa **Piec hutniczy** |
| `gra/src/game/braz-access.ts` | **NOWY** — AND Popalnia + Piec |
| `gra/src/game/production.ts` | bramka Piec (wymaga Popalni) + jednostki `Surowiec: braz` |

## Wpięcie main.ts (F)

W wywołaniach `availableProduction` / `availableBuildings` / `availableUnits` przekaż:

```typescript
placedImprovements: placedImprovementsMap, // stan mapy gracza
```

Bez tego bramka Popalni nie zadziała w UI (logika jest w production.ts).

## DoD

- [ ] `node tools/eko-tech-paczka3-test.cjs` — **10/10**
- [ ] W grze: Piec hutniczy niewidoczny bez Popalni na mapie
- [ ] Jednostki brązowe po pełnym łańcuchu
- [ ] Rebuild ROBOCZA → meldunek md5

**ABC-15** (handel ≥2): zapis w decyzji — implementacja przy v2 handlu surowców.
