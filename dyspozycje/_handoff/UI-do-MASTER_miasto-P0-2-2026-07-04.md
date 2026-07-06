# UI → MASTER: miasto · P0-2 chrome (regres B-27)

**Data:** 2026-07-04  
**Trigger:** Playtest miasto RZYM **FAIL chrome** (Wiki/Menu + exit) · **STOP promocji kanonu** · **STOP Design**  
**Zakres:** regres B-27 góra + dół · **bez bitwy / POLE-BITWY**

---

## Problemy (playtest Maciej)

| ID | Objaw | Przyczyna |
|----|--------|-----------|
| **P0-2 góra** | Wiki + Menu zasłaniają chipy miasta (Praca, Skarbiec…) | Przy `setMapHudChromeSuppressed(true)` cały HUD z-index 404 — `.hud-left`, `.power-center` i `.hud-right` nachodzą na `civ-ux-top` |
| **P0-2 dół** | „Wróć na mapę” blokuje dolne heksy okolicy (👤 produkcja) | `.civ-v-map-actions` na `bottom:18px`, `pointer-events:auto` w centrum ekranu |

**P0-1 stopka:** w tym playteście Maciej nie potwierdził OK/FAIL stopki — **osobny werdykt przy następnym teście**.

---

## Zmiany

### `gra/src/ui/hud.ts` (backup: `hud.ts.bak-UI-2026-07-04-P0-2`)

- Klasa **`is-city-view`** na `.civ-hud` gdy `mapChromeSuppressed`
- Ukrywa `.hud-left` i `.power-center` (chipy imperium + Moc — nie dla widoku miasta)
- `.hud-right` (Wiki + Menu) zostaje **góra-prawo** (`top:10px; right:14px; z-index:5`)

### `gra/src/ui/cityPanel.ts` (backup: `cityPanel.ts.bak-UI-2026-07-04-P0-2-chrome`)

- `.civ-v-resource-bar-w3`: **`padding-right: max(210px, 13vw)`** — chipy miasta nie wchodzą pod Wiki/Menu
- `.civ-v-map-actions`: **`top:92px`** (pod pasek), **`pointer-events:none`** na kontenerze, **`auto`** tylko na przycisku exit
- Toolbar okolica (`civ-v-okolica-center`) **bez zmian**

**Bez zmian:** stopka P0-1b · sekcja Walka/TW · bitwa · `cityUxFrame.ts`

---

## MASTER

1. Playtest: **`gra-robocza/START.html`** → Ctrl+F5 → miasto **RZYM**
2. Bundle robocza md5: **`807966271929fbdf39b3d7e1fd5e6215`**
3. Checklist:
   - [ ] Chipy miasta (Praca, Skarbiec…) **nie** pod Wiki/Menu
   - [ ] Wiki + Menu widoczne góra-prawo
   - [ ] Dolne heksy okolicy **klikalne** (👤 przypisanie)
   - [ ] „Wróć na mapę” + Esc działają
   - [ ] Toolbar okolica OK
   - [ ] Stopka surowców — OK / FAIL (osobno)

**STOP:** `publish-kanon-snapshot` · Design mockupów · mieszanie z POLE-BITWY

**Kanon bundle:** bez zmian (`5b9abefc…` walka) — promocja dopiero po OK Macieja na miasto.

---

## Status

**→ W TOKU lane UI (Maciej bezpośrednio)** · próba MASTER = referencja, nie obowiązek 1:1  
**Orkiestracja:** `_handoff/MASTER-do-UI_miasto-P0-orchestracja-2026-07-04.md`  
**MASTER:** STOP kod · czeka meldunek Macieja
