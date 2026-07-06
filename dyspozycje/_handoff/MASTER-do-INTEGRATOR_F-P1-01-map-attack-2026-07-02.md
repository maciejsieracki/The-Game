# MASTER → INTEGRATOR F: F-P1-01 map attack (open city)

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **START** |
| **Data** | 2026-07-02 |
| **Trigger** | Maciej: handoff u Mastera → review APPROVE → F start |
| **Kanon bazowy** | md5 **`188437eb1b81b165aee6decafa216e0b`** (VICTORY-E-P0-06 już w bundle) |

---

## Review Master (2026-07-02)

| Handoff | Werdykt |
|---------|---------|
| `EKONOMIA-do-MASTER_B1-Q3-panel-B-2026-07-02.md` | **APPROVE** — 🟢 w kanonie · **bez main.ts** |
| `F-do-MASTER_VICTORY-E-P0-06-2026-07-02.md` | **APPROVE** — już w kanonie `188437eb…` |
| `C-do-INTEGRATOR_map-attack-F-P1-01-2026-07-02.md` | **START** — ten batch |

---

## Zakres (main.ts)

**Handoff:** `C-do-INTEGRATOR_map-attack-F-P1-01-2026-07-02.md`  
**Spec:** `A-do-C_map-attack-city-F-P1-01.md`

1. Import `resolveEnemyCityClick`, `launchFieldBattleFromMap`
2. Router kliku miasta wroga (~5111) — switch `action.kind`
3. Obiekt `mapFieldBattleDeps` — wstrzyknij helpery z main.ts
4. **Backup:** `gra/src/main.ts.bak-F-P1-01`

**NIE w scope:** sciencePicker layout (B1-Q3) · regresja szturmu/mur

---

## Bramka

```
node tools/map-attack-city-test.cjs
node tools/map-field-battle-test.cjs
node tools/combat-test.cjs
node tools/victory-test.cjs
node tools/victory-screen-test.cjs
node tools/smoke.cjs
npx vite build --outDir $env:TEMP/civ-dist
```

---

## Meldunek

`F-do-MASTER_F-P1-01-map-attack-2026-07-02.md` → **GOTOWE-ROBOCZA**

**NIE** proś Macieja o playtest — kończ na meldunku (OBOWIĄZ-PT).

---

## Weryfikacja B1-Q3 (w tej samej bramce)

```
node tools/tech-tree-test.cjs
```

Oczekiwane: **19/19** (już w bundle — brak zmian main).
