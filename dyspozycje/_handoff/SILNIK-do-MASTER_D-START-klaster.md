# HANDOFF: D-START klaster + nazwy → SILNIK (main.ts)

**Data:** 2026-06-27 · **Status:** **WPIĘTE** w `main.ts` (batch SILNIK)  
**Decyzje:** `docs/decyzje/D-START-klaster-nazwy.md`

---

## Co dostarczyły lane'y

| Lane | Plik | Rola |
|------|------|------|
| CYWILIZACJE | `gra/src/game/civ-names.ts` | `nazwyKlastra[0..9]`, N-1A/N-3A/N-5B |
| MAPA | `gra/src/map/cluster-spawn.ts` | `buildClusterSpawnPlan()` → `ClusterSpawnSlot[]` |
| SILNIK prep | `gra/src/game/cluster-start.ts` | `buildClusterStartPlan()` — plan dla `doStartGame` |
| SILNIK prep | `gra/src/game/diplomacy-layers.ts` | uproszczona vs pełna dyplomacja |
| UI | `gra/src/ui/diplomacyPanel.ts` | badge „Klaster”, lista akcji warstwy |
| **SILNIK** | `gra/src/main.ts` | `applyClusterStartPlan()`, N-4C prompt, filtr AI dyplomacji |

---

## Kontrakt `buildClusterStartPlan(input)`

```typescript
interface ClusterStartPlan {
  playerStartHex: { q, r };
  playerStartCityName: string;       // N-1A
  aiStartHexes: { q, r, ownerId }[];
  spawnCities: { q, r, ownerId, name }[];
  aiOwnerCivMap: Map<number, string>;
  ownerDisplayName: Map<number, string>;  // N-2A: miasto rywala
  simplifiedDiplomacyOwners: Set<number>; // D-START-2B
  startRelations: Map<number, Relation>;
  placement: ClusterPlacement;
}
```

**Wywołanie w `doStartGame`:** po `generujSwiat` + reset `cities[]` → `applyClusterStartPlan(_menuCivId, seed, _menuRivals)`.

---

## Reguły gameplay (kanon)

1. **Pierwsze miasto gracza:** nazwa = `playerStartCityName` (bez promptu).  
2. **Kolejne miasta gracza (N-4C):** `window.prompt` — anulowanie = brak założenia.  
3. **Rywale klastra:** miasta AI spawnują się od razu; etykieta dyplomacji = nazwa miasta.  
4. **Obce typy:** stolica klastra + pełna dyplomacja; etykieta = `Cywilizacja` z JSON.  
5. **AI dyplomacja:** `filterDiplomacyCommandsForLayer()` — klaster bez sojuszu/trybutu.

---

## Testy (bramka)

```bash
cd gra
node tools/civ-names-test.cjs
node tools/cluster-start-test.cjs
node tools/logic-test.cjs
```

---

## N-5B — ostrzeżenie

**Nie** uruchamiać pełnego `export-data.py` na `civs.json`. Dozwolony: `export-civs.py` (targeted) lub ręczna edycja.

---

## DoD (zamknięte)

- [x] `nazwyKlastra` walidowane (9×10)
- [x] Klaster + N rywali tego samego typu
- [x] Obcy typy na mapie (osobne klastry)
- [x] UI dyplomacji warstwowy
- [x] Wpięcie `main.ts` + backup `main.ts.bak-SILNIK-2026-06-27`

**Review:** Opus przed kanonem · playtest Maciej (start + dyplomacja + kolonia N-4C)
