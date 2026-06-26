# Analiza 06 — DANE (JSON + export)

*Audyt: 2026-06-26 | Źródła: `gra/data/*.json`, `loader.ts`, `gra/tools/export-*.py`*

---

## 1. Zakres lane'a

Warstwa danych: Excel → JSON → loader.ts → GameData. Jedyne źródło parametrów liczbowych.

**Własność:** `gra/data/*.json`, `gra/src/data/loader.ts`, skrypty `export-*.py`, Excele w root Civ.

---

## 2. Stan (% ~85%)

### JSON-y załadowane (13+ importów w loader.ts)

| Plik | Źródło Excel | Status |
|------|--------------|--------|
| units.json | Jednostki.xlsx | aktualny |
| buildings.json | Budynki.xlsx | 26 wpisów (+Żelazo) |
| resources.json | Surowce.xlsx | OK |
| tech.json | Technologie-drzewko.xlsx | +Zelazo gated |
| civs.json | Cywilizacje.xlsx | roster 9, bonusy[], mnoznik |
| terrain-yields.json | Plony-terenow.xlsx | OK |
| terrain-combat.json | — | OK |
| terrain-movement.json | — | OK |
| counters.json | Macierz-walki.xlsx | OK |
| diplomacy.json | Dyplomacja | OK |
| econ-params.json | Ekonomia-parametry.xlsx | OK |
| ai-params.json | Civ-AI | OK |
| society-params.json | Społeczeństwo | OK |

### IN PROGRESS
- `terrain-improvements.json` — ulepszenia terenu + posterunki (Excel EKONOMIA)
- Surowce żelazo/stal — pola w resources, gameplay gated

### ZAKAZ
- **NIGDY** `export-data.py` pełny (regeneruje WSZYSTKIE JSON-y → kasuje cudzą pracę)
- **NIGDY** `npm run build` bez `--outDir /tmp` (prebuild kasuje data)
- Zawsze **targeted export** jednego arkusza (np. `export-civs.py`, `export-tech.py`)

---

## 3. loader.ts — architektura

```typescript
// 13 statycznych importów JSON (Vite bundle, synchroniczne)
loadGameData(): GameData {
  units, buildings, resources, tech, civs,
  terrainYields, terrainCombat, terrainMovement,
  counters, diplomacy, econParams, aiParams, societyParams
}
```

**Typy:** `UnitDef`, `BuildingDef`, `TechDef`, `CivDef` — mapowanie kolumn Excel → TypeScript.

---

## 4. Skrypty export (gra/tools/)

| Skrypt | Arkusz | Uwagi |
|--------|--------|-------|
| export-civs.py | Cywilizacje.xlsx | roster, bonusy, mnoznik |
| export-tech.py | Technologie | koszty, tempo |
| export-data.py | WSZYSTKO | **ZAKAZ** bez pilota |

---

## 5. Integralność danych

- Backup rolling: `*.bak-<LANE>` przed każdą zmianą Excela
- Testy loader: logic-test (180) weryfikuje spójność kosztów tech, jednostek
- **koszary-gate-test CZERWONY:** Lazaret=Sredniowiecze — baseline świadomy, nie naprawiać

---

## 6. Następne kroki

| # | Zadanie | Rola | AC |
|---|---------|------|-----|
| D1 | Export terrain-improvements.json | Composer | Po akceptacji U1 Macieja |
| D2 | Pilot export 2 arkuszy przed batch | Composer | PLAYBOOK §6.2 |
| D3 | Schema validation script | Composer | JSON schema per plik |
| D4 | 50 cywilizacji — rozszerzenie civs.json | Composer+GLM | Epic EP6 |

*Rola: Composer (export scripts, loader)*
