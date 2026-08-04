# REL-MP-SAME-Q1 — Startowe Zaufanie miast-państw (ten sam typ co gracz)

| Pole | Wartość |
|------|---------|
| **ID** | REL-MP-SAME-Q1 |
| **Czat** | Grupa D (dyplomacja) + Integrator (spawn) |
| **Ekran** | Dyplomacja · lista cywilizacji · start nowej gry (klaster) |
| **Status** | 🔵 **WDROŻONE W KODU** — Maciej 2026-08-04 (REL-MP-SAME-Q1) |
| **Decyzja** | Startowe Zaufanie **+20** (nie −20) dla miast-państw własnego typu |
| **Data** | 2026-08-04 |

---

## Cytat Macieja

> Na starcie miasta-państwa **własnego typu** mają mieć Zaufanie/relacje **podwyższone o +20**, **NIE** obniżone o −20 (to państwa z naszej cywilizacji).

---

## Nadpisanie starego kanonu

| Źródło | Stare ustalenie | Status po REL-MP-SAME-Q1 |
|--------|-----------------|--------------------------|
| `docs/decyzje/D-START-klaster-nazwy.md` **§49** (linia reguł dyplomacji) | `rywalizacjaTenSamTyp_zaufanie: -20` **zostaje** globalnie | **Nadpisane** dla **gracz ↔ miasto-państwo** (kopie typu gracza) |
| `gra/data/diplomacy.json` | `rywalizacjaTenSamTyp_zaufanie: -20` | **Bez zmiany globalnej** — osobna ścieżka dla MP gracza |
| `startRelationForPair(true)` | `startZaufanie(20) + (-20) = 0` | **Nie** używać tej formuły dla MP wokół gracza |

**Zakres nadpisania:** wyłącznie relacja **gracz (owner 0) ↔ miasta-państwa** spawnowane jako kopie **tego samego `typ` co gracz** (`simplifiedDiplomacyOwners`, `startCityState`, ścieżka `spawnPendingSameTypeRivals`). **Nie** zmienia relacji AI↔AI ani obcych typów.

---

## Stan audytu (przed wdrożeniem)

| Element | Wartość / miejsce |
|---------|-------------------|
| Globalny parametr | `diplomacy.json` → `rywalizacjaTenSamTyp_zaufanie: -20` |
| Funkcja startu | `diplomacy-layers.ts` → `startRelationForPair(sameType: true)` dodaje −20 |
| Spawn MP gracza | `main.ts` → `spawnPendingSameTypeRivals` → `setDiploRelation(0, ownerId, applyWiarygodnoscD4ToRelation(applyCityStateDifficultyTrust(startRelationForPair(true), …)))` |
| Plan klastra (obce sloty) | `cluster-start.ts` → `startRelations.set(slot.ownerId, startRelationForPair(slot.isSameTypeRival))` — **pozostaje na −20** dla slotów AI w planie (nie MP gracza) |
| Korekta trudności MP | `CITY_STATE_TRUST_DELTA_BY_DIFFICULTY` easy +10 / normal +5 / hard 0 — **nad** bazą; po zmianie bazy trzeba zweryfikować monotonicność |
| Test regresji | `city-state-alliance-test.cjs` §9 — asercja bazy `zaufanie=0` |

**Docelowa baza MP gracza (przed D4 i trudnością):** `startZaufanie(20) + 20 = 40` pkt Zaufania (zamiast 0).

---

## Plan wdrożenia (osobna ścieżka — nie globalnie)

### 1. Nowy parametr w `diplomacy.json` (+ typ w `diplomacy.ts`)

- Dodać np. `miastoPanstwoSameCiv_zaufanie: 20` (lub `sameCivCityState_zaufanie`) — **dodatek** do `startZaufanie`, nie zamiana `rywalizacjaTenSamTyp_zaufanie`.
- **Nie** zmieniać `rywalizacjaTenSamTyp_zaufanie` (−20) — nadal dla AI↔AI ten sam typ w klastrze planu.

### 2. `diplomacy-layers.ts` — dedykowana funkcja startu MP gracza

- Nowa funkcja np. `startRelationForPlayerSameCivCityState(): Relation` — `startZaufanie + miastoPanstwoSameCiv_zaufanie`, **bez** `rywalizacjaTenSamTyp_zaufanie`.
- `startRelationForPair(true)` **bez zmian** (AI↔AI / sloty planu z `isSameTypeRival`).

### 3. `main.ts` — `spawnPendingSameTypeRivals`

- Zastąpić `startRelationForPair(true)` → `startRelationForPlayerSameCivCityState()` (lub równoważnik) w `setDiploRelation` dla każdego nowego MP.
- Zachować łańcuch: `applyCityStateDifficultyTrust` → `applyWiarygodnoscD4ToRelation`.

### 4. `cluster-start.ts` — **bez zmiany** domyślnej linii 89

- Sloty z `isSameTypeRival` w planie mapgen (jeśli nadal istnieją poza deferred MP) trzymają `startRelationForPair(true)` — to **nie** jest gracz ↔ MP.
- Jeśli audyt wykaże, że deferred MP **nigdy** idą przez `plan.startRelations`, jedyna produkcyjna ścieżka MP = `spawnPendingSameTypeRivals` (już tak dziś).

### 5. UI / breakdown dyplomacji

- `diplomacy-factors.ts` — wiersz „Rywalizacja (ten sam typ)” tylko gdy faktycznie zastosowany −20; dla MP gracza opcjonalny wiersz „Ten sam typ (miasto-państwo)” +20.

### 6. Testy

- `city-state-alliance-test.cjs` §9 — baza MP: **40** (nie 0); easy/normal/hard po delcie trudności.
- `cluster-start-test.cjs` — upewnić się, że `plan.startRelations` dla obcych slotów **nadal** −20 gdzie `isSameTypeRival`.
- Smoke: nowa gra → pierwsze MP → Zaufanie w panelu dyplomacji.

### 7. Lane / warstwa

- 🟡 **Cross** — `diplomacy-layers.ts` + `main.ts` (spawn) + JSON; Integrator wpięcie po `działaj`.
- **Nie** deploy bez hasła Macieja.

---

## Powiązane

- `docs/decyzje/D-START-klaster-nazwy.md` §49 (nadpisane dla MP gracza)
- `docs/decyzje/D-START-miasta-kopie-typu.md` — model kopii typu
- `E-START-CS-Q1` — spawn wokół faktycznej stolicy (`spawnPendingSameTypeRivals`)
- `C-WIAR-D4` — Dźwignia 4 na pierwszym kontakcie (nad bazą)
- `city-state-alliance-test.cjs` — kontrakt trudności MP

---

**Zapisałem jako REL-MP-SAME-Q1, status ZAPISANA.** Wdrożenie po `działaj` — lane D + Integrator (spawn).
