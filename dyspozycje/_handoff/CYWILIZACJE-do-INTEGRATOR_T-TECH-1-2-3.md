# CYWILIZACJE + UI + MAPA → INTEGRATOR: T-TECH-1/2/3 (Maciej 2026-06-26)

**Status:** GOTOWE  
**Decyzje Macieja:** T-TECH-1 **B** · T-TECH-2 **A** · T-TECH-3 **C**

---

## Co zrobiono

### T-TECH-1 B — sync `tech.json`
- Kolumny **Odblokowuje budynek**, **Odblokowuje ulepszenie terenu**, **Odblokowuje surowiec.** wygenerowane z `buildings.json`, `terrain-improvements.json`, `units.json`.
- Jednostki w linii budynków jako `Jednostki: …` gdy brak budynku.
- Posterunek przypisany do **Obróbka drewna** i **Murarstwo** (wymaga obu w grze).

### T-TECH-2 A — drzewko nauki
- `sciencePicker.ts`: sekcja tooltip **„Odblokowuje na mapie”** + skrót 🌾 w hub summary.
- Źródło etykiet: `terrainUnlockLabelsForTech()` (kod) z fallbackiem z tech.json.

### T-TECH-3 C — posterunek bez nowej tech
- `improvement-tech.ts`: `IMPROVEMENT_MULTI_TECH_REQ.posterunek = ['Obróbka drewna', 'Murarstwo']`.
- `isImprovementTechUnlocked` / `getImprovementLockHint` — bramka AND.
- `terrain-improvements.json`: komentarz `tech_uwaga`.

---

## Pliki

| Plik | Lane |
|------|------|
| `gra/data/tech.json` | CYWILIZACJE |
| `gra/src/game/improvement-tech.ts` | EKONOMIA/MAPA |
| `gra/src/ui/sciencePicker.ts` | UI |
| `gra/data/terrain-improvements.json` | MAPA (meta) |
| `gra/tools/grupa-b-lane-test.cjs` | test posterunek |

---

## DoD

- [x] tech.json odblokowania = faktyczne id/nazwy z gry
- [x] Tooltip drzewka pokazuje ulepszenia mapy
- [x] Posterunek zablokowany bez obu tech Kamienia
- [ ] `node tools/grupa-b-lane-test.cjs` ZIELONY
- [ ] Playtest Macieja: drzewko + 🔨 posterunek

---

## Odłożone (bez ABC)

T-TECH-4…9 — patrz `docs/AUDYT-DRZEWKO-TECH-2026-06-26.md`
