# C → MASTER — Auto-walka M v2b + ruch mapy (auto = ręczna)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-06-26 |
| **Obieg** | 2026-06-30 · Maciej: **przekaż do Mastera** |
| **Flaga** | **→ MASTER: GOTOWE** |
| **Warstwa** | **🟡 cross** (moduły lane + wpięcie mapy — kontrakt dla F) |
| **Decydent** | Maciej — temat gameplay **ZAMKNIĘTY** |

---

## 1. Co przesyłam (lane C / UNITS)

| Plik | Rola |
|------|------|
| `gra/src/game/auto-battle-power.ts` | Werdykt M v2b + straty (wagi linii) |
| `gra/src/game/auto-battle-params.ts` | Load JSON · upset · tie |
| `gra/src/game/post-battle-map.ts` | Wspólny ruch mapy auto + ręczna 3D |
| `gra/data/auto-battle-params.json` | Parametry Panel-C |
| `gra/tools/auto-battle-power-test.cjs` | **10/10** |
| `gra/tools/auto-battle-power.py` | Symulator offline |
| `gra/src/units/setup.ts` | `hp?`, `defLossesThisTurn?`, `hexNeighborCoords()` |
| `panele-sterowania/gen-panel-c.py` + `export-c.py` | Arkusz **Auto-walka** |
| `docs/AUTO-WALKA-MOC-ALGORYTM.md` | Kanon §14–§15 v2b |

**Spec:** werdykt ze składu M (teren × mur) · straty v2b lustro · identyczny ruch po walce auto/ręczna · wipe centrum miasta.

---

## 2. Co MASTER ma zrobić

1. **Przyjąć** meldunek · lane C **ZAMKNIĘTY** (nie delegować ponownie M v2b)
2. **Zweryfikować** stan F: kanon md5 `5D965EB74068538C18C6C0916D5CBB77` (wpięcie retro w tej samej sesji)
3. **ACK** w `MASTER-WATCH.md` · review subagent (retro)
4. **Maciej:** playtest `?playtest=walka` · Panel-C Auto-walka

---

## 3. Bramka lane (self-check)

| Test | Wynik |
|------|-------|
| `auto-battle-power-test.cjs` | 10/10 |
| `combat-test.cjs` | 6/6 |
| `unit-power-test.cjs` | 6/6 |

Lane **nie** budował kanonu w tym handoffie (obieg 2026-06-30). Kanon opublikowany przez F retro — Master weryfikuje.

---

## 4. Co sprawdzić po wpięciu (playtest)

1. Auto vs Ręczna — ten sam fan-out / cofka / wejście ATK
2. Panel-C → eksport → straty auto reagują
3. Szturm — bez podwójnego hintu · `deploy: false`

---

**Plik obiegu:** `docs/obieg/C-walka.md` · status **🟠 U MASTERA**
