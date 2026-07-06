# MASTER → Grupa D (CYWILIZACJE): P5 przemarsz + P6 transfer koszyka

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **START** — Maciej `deleguj` 2026-07-01 |
| **Od** | Master Orkiestrator |
| **Do** | Lane CYWILIZACJE |
| **Flaga** | **NIE** `main.ts` |

**Decyzje:** zamknięte — `D3-przemarsz-kara-ABC.md` · `D3-dyplomacja.md` (W5-A, katalog PN)

---

## P5 — kara przemarszu

Handoff: `CYWILIZACJE-do-UNITS_przemarsz-kara-zaufanie.md`

### Dostarcz (nowy moduł + testy)

`gra/src/game/diplomacy-border-march.ts`:

- `export interface BorderMarchPair { intruderOwnerId: number; territoryOwnerId: number }`
- `hasAuthorizedBorderCrossing(intruder, owner, ctx)` — wojna → skip; sojusz; `OtwartGranice` / `PrawoWojskowePrzemarszu` z `ActiveDeal[]`; wojsko vs cywil (kontrakt w handoff)
- `applyUnauthorizedBorderPenalties(pairs, relations, params)` — −`karaPrzemarszNieautoryzowany_zaufanie_perTura` (5) na **Zaufanie** u właściciela; **dedupe** pary w jednej turze
- Czytaj param z `diplomacy.json` params

### Testy

`gra/tools/diplomacy-border-march-test.cjs` — min 4: −5 jedna para; 3 jednostki = −5; sojusz = 0; otwarte granice = 0

---

## P6 — transfer tech + surowiec boolean

### Dostarcz

`gra/src/game/diplomacy-basket-transfer.ts`:

- `grantTechToOwner(techId, toOwnerId, ctx)` — dopisać do `zbadane` (API z `research.ts`; **nie** edytuj `tech.json`)
- `grantSurowiecBooleanAccess(rawKey, fromOwner, toOwner, state)` — flaga dostępu (kontrakt dla F)
- Eksport typów `BasketTransferContext` dla Integratora

**NIE** jednostka — robi UNITS (`diplomacy-unit-transfer.ts`).

### Testy

`gra/tools/diplomacy-basket-transfer-test.cjs` — tech grant; surowiec flag

---

## DoD

- [ ] Moduły pure + testy zielone
- [ ] Append `CYWILIZACJE-DO-MASTERA.md` → **MASTER: GOTOWE**
- [ ] Handoff `CYWILIZACJE-do-INTEGRATOR_P5-P6-dyplomacja.md` (API + przykład wywołania)
