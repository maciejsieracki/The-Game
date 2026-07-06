# EKONOMIA + UI + CYW → MASTER · batch UPGRADE (ABC-20…24)

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-05 |
| **Decyzje** | ABC-20…24 · UPG-LOC / UPG-PROD / UPG-BONUS · Maciej `działaj` |
| **Robocza md5** | **`eac24a666f3854290ba4ba241e979d46`** |
| **Stempel** | `ROBOCZA · 703e6212 · 2026-07-05 23:04` (skrót w HUD) |
| **Playtest** | `gra-robocza/START.html` → Ctrl+F5 → miasto → produkcja **↗ Rozbuduj X→Y** |

---

## Deliverable

| Warstwa | Pliki | Test |
|---------|-------|------|
| JSON | `gra/data/buildings.json` — `upgradeFrom`, łańcuchy, sumy bonusów | — |
| Silnik | `gra/src/game/building-upgrades.ts` (nowy) | **28/28** |
| Produkcja | `gra/src/game/production.ts` — kolejka upgrade, merge bonusów | w test |
| UI | `gra/src/ui/cityPanel.ts` — ↗, tooltip łańcucha | playtest |
| Integracja | `gra/src/main.ts` — wiring produkcji upgrade | smoke OK |
| Ikony Design | `gra/src/ui/icons/brand/buildings/` — 35× SVG (`bld-*`) | w bundlu |
| Test | `gra/tools/upgrade-budynki-test.cjs` | **28 pass, 0 fail** |

---

## W bundlu (grep)

- String **`Rozbuduj`** — TAK  
- **`bld-port_wielki`**, **`bld-fort`** — TAK  

---

## GitHub

**Lokalnie:** pliki upgrade **niecommitowane** (building-upgrades.ts, buildings.json, production, cityPanel, test).  
**origin/main:** ikony Design ✅ (`a8bd515`); **logika upgrade ❌** — czeka commit Master po playtest OK.

---

## DoD Master

- [x] Wpisy `EKONOMIA-DO-MASTERA` · `CYWILIZACJE-DO-MASTERA` · `UI-DO-MASTERA`
- [x] `DZIENNIK-MASTERA` · `REJESTR-DECYZJI` — md5 `eac24a66`
- [ ] Maciej playtest → `OK upgrade` / `BUG: …`
- [ ] Po OK: commit batch UPGRADE + push (osobny commit, bez całego repo)
- [ ] Promocja kanon — **HOLD** (Maciej: pracujemy w roboczej)

**Flaga:** `→ MASTER: GOTOWE-ROBOCZA`
