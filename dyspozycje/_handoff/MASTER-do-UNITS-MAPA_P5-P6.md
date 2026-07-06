# MASTER → Grupa C (UNITS) + MAPA: P5 skan terytorium + P6 spawn jednostki

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **START** — Maciej `deleguj` 2026-07-01 |
| **Od** | Master Orkiestrator |
| **Do** | Lane C (UNITS) + MAPA (`map/territory.ts`) |
| **Flaga** | **NIE** `main.ts` |

**Decyzje:** D3-BORD zamknięte · jednostka w koszyku = koszt ¤ z `units.json`

---

## P5 — wykrycie par intruz→właściciel

### MAPA (`gra/src/map/territory.ts`)

- `territoryOwnerAt(q, r, nodes: TerritoryNode[]): number | null`  
  `TerritoryNode = CityNode & { ownerId: number }` — najbliższy węzeł w zasięgu wygrywa (lub pierwszy match — udokumentuj)

### UNITS (`gra/src/game/border-march-scan.ts`)

- `collectUnauthorizedBorderPairs(units, allCityNodesByOwner, isMilitaryUnit): BorderMarchPair[]`
- Koniec tury: jednostka na heksie gdzie `ownerAt !== unit.ownerId` i ownerAt != null
- **Dedupe** pary (intruder, owner) — bez mnożenia przez stack

### Testy

`gra/tools/border-march-scan-test.cjs`

---

## P6 — transfer jednostki z koszyka

`gra/src/game/diplomacy-unit-transfer.ts`:

- `spawnTransferredUnit(unitTypeId, toOwnerId, nearHex, ctx)` — 1 jednostka u odbiorcy (hex przy stolicy / stolicy odbiorcy jeśli brak near — udokumentuj)
- Czytaj koszt z `units.json` (już w katalogu PN)

### Testy

`gra/tools/diplomacy-unit-transfer-test.cjs` — minimal mock

---

## DoD

- [ ] Moduły + testy zielone
- [ ] Append `UNITS-DO-MASTERA.md` → **MASTER: GOTOWE**
- [ ] Handoff `UNITS-do-INTEGRATOR_P5-P6.md`
