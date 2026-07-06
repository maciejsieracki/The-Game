# MASTER → WSZYSTKIE LANE: synchronizacja TW balansu (pełna mapa)

**STATUS: GOTOWE (Master, batch 2)** · kanon md5 **`5b9abefc1534acfec886c34730765b25`**

**Reguła:** pass balansu (`health ×1,5`, `missileAttack ÷2`) + formuła TW obowiązuje **w każdym silniku i UI**, nie tylko w `battleScene._singleBlow`.

---

## Mapa plików (gra/src — źródło, potem snapshot → robocza + kanon)

| Warstwa | Plik | Co |
|---------|------|-----|
| **Dane** | `data/units.json` | TW + legacy kolumny Excel (legacy **nie** do walki) |
| **Silnik auto** | `game/combat.ts` | `resolveCombat`, `unitRowStat()` — helper odczytu TW z JSON |
| **Scena T** | `battle/battleScene.ts` | `_singleBlow`, skip, tooltip/panel Atk/Obr, taran/katapulta |
| **Test bitwy** | `battle/testBattle.ts` | HP z `health` |
| **Oblężenie** | `game/siege.ts` | `hitChanceTw`/`damageTw`, `weaponDamage` w `SiegeUnit`, milicja TW |
| **Oblężenie AI** | `game/siegeAi.ts` | siła armii z `weaponDamage` |
| **Oblężenie obrona** | `game/siegeDefenders.ts` | `militiaDefRecord` → TW |
| **Integracja** | `main.ts` | `runtimeUnitToSiegeUnit`, `unitHealth`/`unitAtak`/`unitObrona`, milicja |
| **AI** | `game/ai.ts` | `_unitMaxHealth` → `health` |
| **UI miasto** | `ui/cityPanel.ts` | sekcja Walka = TW |
| **HUD mapy** | `ui/unitPanelHud.ts`, `ui/hexContextTooltip.ts` | już z `unitAtak`/`unitObrona` (TW via main) — **bez zmian** |
| **Pre-bitwa** | `ui/preBattle.ts` | `atak` z `meleeAttack` — **bez zmian** |
| **Galeria dev** | `gallery4/main.ts` | chipy TW |
| **Pole bitwy (deploy)** | root `Gra-podglad-POLE-BITWY.html` | **osobny build** — patrz niżej |

---

## WAŻNE: `Gra-podglad-POLE-BITWY.html` ≠ `Gra-podglad.html`

| Plik | Build | Wejście | Gdzie |
|------|-------|---------|-------|
| `Gra-podglad.html` | `npx vite build --outDir $TEMP\civ-dist` | `gra/src/main.ts` (cała gra) | root, `gra-robocza/`, `gra-kanon/` |
| **`Gra-podglad-POLE-BITWY.html`** | **`npx vite build --config vite.oblezenie-bitwa.config.ts`** | **`gra/src/oblezenie/main.ts`** (tylko pole bitwy) | **root** (+ od 2026-07-03 także `gra-robocza/`, `gra-kanon/`) |

**`publish-robocza-snapshot.ps1` NIE buduje POLE-BITWY** — tylko kopiuje gotowy plik z roota, jeśli istnieje. Po zmianach w `battleScene.ts` / `units.json` trzeba **oba** buildy:

```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-dist
.\tools\publish-robocza-snapshot.ps1
npx vite build --config vite.oblezenie-bitwa.config.ts
# potem publish-kanon-snapshot.ps1 (kopiuje robocza wraz z POLE-BITWY)
```

**POLE-BITWY md5 (TW sync, 2026-07-03 ~23:57):** `0d1b409bfdac58268185a2806f0f5243`

---

## Lane — co macie wiedzieć

### UNITS / Walka
- Handoff szczegółowy: `_handoff/MASTER-do-UNITS_balans-scena-T-2026-07-03.md`
- **Nowe:** `siege.ts` używa tej samej formuły TW co `combat.ts` (wcześniej myliło `Atak` z `weaponDamage`).
- **Milicja:** baseline = Wojownik TW (HP 17, nie 30).
- **30 pocisków** — nadal bez zmian; decyzja ABC osobno.

### UI
- Handoff: `_handoff/MASTER-do-UI_statystyki-TW-jednostki-2026-07-03.md`
- Tooltip bitwy T: Atk/Obr z `meleeAttack`/`meleeDefence`.
- Grep `u.Atak` / `Atak dystansowy` w `ui/` — nie powinno zostać w aktywnym kodzie poza fallback w `unitRowStat`.

### MIASTO / EKONOMIA
- Handoff: `_handoff/MASTER-do-MIASTO_balans-jednostki-info-2026-07-03.md`
- Produkcja/koszty **bez zmian**; tylko wyświetlanie statów jednostek.

### CYWILIZACJE / AI
- `ai.ts`: HP jednostki z `health` (nie `Health`).
- Brak zmian w dyplomacji / tier balance.

### SILNIK (main.ts)
- `runtimeUnitToSiegeUnit` + `weaponDamage` — oblężenie mapy spójne z TW.
- **Lane SILNIK:** tylko czytać; Master wdrożył w ramach batch balansu (Maciej „rób”).

---

## Testy Master (po rebuild)

- `node tools/combat-test.cjs` — 6/6
- `node tools/logic-test.cjs` — sekcja siege (warrior TW)
- `node tools/siege-ai-test.cjs`, `siege-defenders-test.cjs` — uruchomić po pull
- `node tools/smoke.cjs` — OK

---

## Playtest Macieja

1. **Ctrl+F5** · `gra-kanon/START.html`
2. Bitwa T — łucznicy, zwarcie, skip
3. Panel miasta — karta jednostki (TW)
4. Oblężenie / szturm (jeśli dostępne w save)

---

## Następne commity lane

**NIE** przywracać legacy macierz v2 w kodzie walki. Import Panel-C Excel → rebuild kanonu obowiązkowy.
