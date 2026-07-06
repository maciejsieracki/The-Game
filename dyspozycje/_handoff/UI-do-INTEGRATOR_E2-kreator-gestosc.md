# UI → INTEGRATOR: E2 — kreator gęstości świata

**Data:** 2026-06-29  
**Warstwa:** 🟡 cross (`NewGameParams` → generator — wpięcie SILNIK + MAPA)  
**Decyzja:** `docs/decyzje/E2-gestosc-swiat-kreator.md`

---

## Co UI dostarczyło

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/newGameFlow.ts` | Krok 4: `civ_types_count`; zaawansowane: jakość mapy + 4 gęstości; `buildParams()` |
| `gra/data/ui-params.json` | Klucze kreatora |
| `gra/src/map/newGameMapDefaults.ts` | Kontrakt menu: `WorldGenerationPreset`, `civTypesMenuForMapLabel`, mnożniki (MAPA użyje w generatorze) |

## `NewGameParams` (nowe pola)

- `civTypesCount: number`
- `worldDensity: { resources, rivers, desert, forest }`
- `worldDensityLabels: { resources, rivers, desert, forest }` (PL)
- `mapQuality*` — czytane z zaawansowanych (E1 bundle)

---

## Czeka na

| Lane | Handoff |
|------|---------|
| **MAPA** | `MASTER-do-MAPA_E2-gestosc-generator.md` → `MAPA-do-SILNIK_E2-world-opts.md` |
| **SILNIK** | `MASTER-do-SILNIK_E2-gestosc-wpiecie.md` |

**Efekt w grze:** parametry zapisane w kreatorze; generator **ignoruje** je dopóki SILNIK+MAPA nie wpina.

---

## Self-test

- `npx tsc --noEmit` — UI lane
- `grupa-selftest.ps1 -Grupa E` — gdy skrypt dostępny w repo

**Flaga:** `→ INTEGRATOR: GOTOWE` ✅ (2026-06-26) · MAPA+SILNIK wpięte w `main.ts` · test `world-density-test.cjs`

---

## W kreatorze (Maciej — co zobaczysz)

| Gdzie | Co |
|-------|-----|
| **Krok 4 — główna siatka** | Miasta-państwa · Typy cywilizacji (skala z mapą) |
| **Zaawansowane** | 4 suwaki gęstości (surowce, rzeki, pustynie, las) — **bez** suwaka jakości mapy |
| **Jakość grafiki** | Domyślna Średnia (E1 bundle) — poza kreatorem |
