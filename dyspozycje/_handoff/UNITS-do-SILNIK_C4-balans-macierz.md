# UNITS → SILNIK — C4-Q1=A balans macierzy v2.0

| Pole | Wartość |
|------|---------|
| **Status** | **WPIĘTE** (2026-06-29) — build + bramka OK · ROBOCZA md5 `0adf96de…` |
| **Decyzja** | Maciej **C4-Q1=A** (2026-06-29) |
| **Nie ruszaj** | C1 preBattle · C2 bitwa UX · C3 oblężenie |

---

## Co przesyłam

| Plik | Zmiana |
|------|--------|
| `gra/data/units.json` | 9 jednostek Brąz/Żelazo — staty skali 0–100 + pole **`Obrażenia`** (macierz v2.0) |
| `gra/src/game/combat.ts` | Formuła macierz v2 (`hitChanceMatrix`, `matrixDamage`, `usesMatrixCombat`) gdy obie strony mają `Obrazenia` |
| `gra/src/battle/manualBattle.ts` | `toCombatUnit` — mapuje `Obrażenia` |
| `gra/src/battle/battleScene.ts` | `toCombatUnit` — mapuje `Obrażenia` |
| `gra/tools/apply-matrix-v2-stats.cjs` | Skrypt re-apply (targeted, nie export-data.py) |
| `gra/tools/combat-test.cjs` | Adapter `Obrazenia` |

**Źródło statów:** `Civ-UNITS/Macierz-walki-analiza.md` v2.0 · Legionista → **Hastati**

**Jednostki zaktualizowane:** Wojownik, Zwiadowca, Łucznik, Wojownik z mieczem i tarczą, Włócznik, Rydwan (woły), Konnica, Falanga, Hastati

**Backup:** `gra/data/units.json.bak-UNITS-C4-2026-06-29`

---

## Co SILNIK ma zrobić

1. **`main.ts` — wpięcie `Obrażenia`** w `battleUnitToCombatUnit` oraz inline `CombatUnit` (~linie 3136, 3149, 3684, 3697, 3828, 3841, 5046, 5059):
   ```typescript
   Obrazenia: typeof s['Obrażenia'] === 'number' ? s['Obrażenia'] : undefined,
   ```
   (wzór: `manualBattle.ts` / `battleScene.ts` `toCombatUnit`)

2. **Build + bramka:**
   ```powershell
   cd gra
   npx vite build --outDir $env:TEMP\civ-dist
   node tools/combat-test.cjs      # 6/6
   node tools/battle-smoke.cjs     # OK
   ```

3. **ROBOCZA** → `Gra-podglad-ROBOCZA.html` (Opus przed kanonem)

4. Meldunek `SILNIK-DO-MASTERA.md`

---

## DoD

- [ ] Walka z mapy + auto-rozstrzygnięcie używa macierz v2 dla par z `Obrażenia`
- [ ] combat 6/6 + battle-smoke OK
- [ ] ROBOCZA opublikowana
- [ ] **NIE** zmieniać logiki C1/C2/C3

**Uwaga:** Super-jednostki bez `Obrażenia` = SS5l legacy (zgodnie z `usesMatrixCombat`).
