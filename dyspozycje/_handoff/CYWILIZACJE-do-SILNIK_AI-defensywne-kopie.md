# HANDOFF CYWILIZACJE → SILNIK (Grupa F): AI defensywne — miasta-kopie typu

**Data:** 2026-06-27  
**Od:** CYWILIZACJE (Grupa D)  
**Do:** SILNIK (Grupa F)  
**Zadanie:** CYW-P1-01 (D-START)  
**Flaga:** **→ SILNIK: GOTOWE** (gałąź AI — wpięcie w `main.ts` już obecne; weryfikacja bramki)  
**Kanon:** `docs/decyzje/D-START-miasta-kopie-typu.md`

---

## Co przesyłam

| Moduł | Plik | Zmiana |
|-------|------|--------|
| AI defensywne | `gra/src/game/ai.ts` | `AITurnOpts.defensiveCopy` + `decideDefensiveCopyTurn()` |
| Plan startu | `gra/src/game/cluster-start.ts` | `typCityCopyOwners: Set<number>` (wszystkie sloty AI klastra) |
| Silnik | `gra/src/main.ts` | **już wpięte:** `defensiveCopy: typCityCopyOwners.has(ownerId)` — **F nie edytuje** bez nowego handoffu |

**Test regresji:** `node tools/ai-test.cjs` → sekcja **T7D-a–T7D-f** (defensiveCopy)

---

## Kontrakt API (SILNIK / engine)

### 1. Identyfikacja ownera — miasto-kopia typu

```typescript
// cluster-start.ts — plan startu gry
interface ClusterStartPlan {
  /** Wszystkie ownerId AI z klastra (rywale tego samego typu + obce typy). */
  typCityCopyOwners: Set<number>;
  aiOwnerCivMap: Map<number, string>;  // ownerId → ikonaId / TypCywilizacji
  // ...
}
```

**Reguła:** każdy slot AI z `buildClusterSpawnPlan` trafia do `typCityCopyOwners` (gracz wyłączony).

### 2. Wywołanie AI — flaga `defensiveCopy`

```typescript
// ai.ts — AITurnOpts (fragment)
interface AITurnOpts {
  /** D-START: true = profil kopia_typu_obronna (brak ekspansji, brak foundCity). */
  defensiveCopy?: boolean;
  civType?: string;
  // ... pozostałe opts bez zmian
}
```

**Mapowanie silnika (main.ts — już jest):**

```typescript
const opts: AITurnOpts = {
  civType: aiOwnerCivMap.get(ownerId),
  defensiveCopy: typCityCopyOwners.has(ownerId),
  // ...
};
commands = decideAITurn(ownerId, units, cities, map, data, opts);
```

**Alias konceptualny:** `isTypCityCopy` z spec = `typCityCopyOwners.has(ownerId)` → przekazane jako `defensiveCopy: true`.

### 3. Zachowanie AI gdy `defensiveCopy === true`

| Akcja | Dozwolone |
|-------|-----------|
| `foundCity` | **NIE** |
| `build` (produkcja) | **NIE** (v1.0 — miasto stoi) |
| Marsz ekspansyjny / na odległe miasto wroga | **NIE** |
| `attack` na sąsiedniego wroga | **TAK** (riposta) |
| `move` w stronę zagrożenia przy własnym mieście | **TAK** |
| `move` w stronę własnego miasta (garnizon) | **TAK** |
| Osadnik | **ignorowany** (brak ruchu) |

---

## Co Odbiorca (F) ma zrobić

1. **Bramka:** `node tools/ai-test.cjs` — T7D-a–T7D-f **PASS** (w suite przed ROBOCZA).
2. **Smoke:** start Standard → AI z `typCityCopyOwners` nie rośnie terytorialnie przez kilka tur (obserwacja w grze / log `foundCity`).
3. **NIE** zmieniać logiki `decideDefensiveCopyTurn` bez handoffu CYWILIZACJE.
4. **CZEKA na MAPA:** pełny klaster obcych typów przy spawnie (`buildClusterSpawnPlan`) — osobny handoff MAPA→SILNIK.

---

## DoD (CYW-P1-01)

- [x] `decideAITurn` gałąź `defensiveCopy` — skip ekspansja, skip foundCity
- [x] `decideDefensiveCopyTurn` — obrona garnizonu + riposta
- [x] `cluster-start.typCityCopyOwners` — zestaw ownerów
- [x] Test T7D: 20 tur bez `foundCity` dla kopii typu
- [x] `main.ts` mapuje flagę (wpięcie istniejące — F tylko weryfikuje)
- [ ] Pełny klaster obcych typów na starcie — **MAPA** (poza P1-01)

---

## Powiązane pliki (read-only dla F)

- `docs/decyzje/D-START-miasta-kopie-typu.md`
- `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_miasta-kopie-typu.md`
- `gra/tools/cluster-start-test.cjs` — `typCityCopyOwners.size === spawnCities.length`

*— CYWILIZACJE, CYW-P1-01, 2026-06-27*
