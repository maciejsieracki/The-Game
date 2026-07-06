# MASTER → EKONOMIA: F-CITY-HEX — snapshot plonów centrum

**Data:** 2026-06-29  
**Decyzja:** `docs/decyzje/F-city-hex-czysty.md`  
**Status:** CZEKA  
**Flaga:** → EKONOMIA: CZEKA

---

## Co EKONOMIA ma dostarczyć

```typescript
/** Przed założeniem miasta: zapisz plony centrum, wyczyść hex (nakladka/ulepszenie/zloze). */
export function applyCityFoundingToHex(
  city: City,
  map: GameMap,
  q: number,
  r: number,
): void;
```

| AC | Kryterium |
|----|-----------|
| AC-1 | Snapshot `WorkedTile` centrum **przed** czyszczeniem → pole na `City` (np. `centerWorkedTile`) |
| AC-2 | Hex po operacji: `nakladka = Brak`, `ulepszenie = Brak`, usuń `zloze` / `improvementKey` |
| AC-3 | `terenBazowy` **bez zmian** |
| AC-4 | `cityWorkedTilesForEconomy` używa snapshotu dla centrum zamiast `hexToWorkedTile(centreHex)` |
| AC-5 | Test regresji: miasto na hexie z lasem + farma → plony centrum = jak przed founding (snapshot), sąsiednie pola bez zmian |

**Pliki lane:** `cities.ts`, `turn-economy.ts`, ewent. `economy.ts`  
**NIE ruszać:** `main.ts`

Po GOTOWE → flaga `→ SILNIK: GOTOWE` + handoff kontraktu API.
