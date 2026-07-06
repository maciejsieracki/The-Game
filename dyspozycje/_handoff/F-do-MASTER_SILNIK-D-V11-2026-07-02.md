# GRUPA F → MASTER: SILNIK-D-V11 (D3 v1.1 silnik gaps)

| Pole | Wartość |
|------|---------|
| **Status** | 🟠 **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-02 |
| **Batch** | `SILNIK-D-V11` |
| **Handoff źródłowy** | `MASTER-do-MASTER_D3-E2-audit-2026-07-02.md` |
| **Poprzedni ROBOCZA** | `2fc963816085f41c65ccf9398ff6ed3a` (KANON-SPRINT) |

---

## Scope (main.ts only)

| # | AC | Zmiana |
|---|-----|--------|
| 1 | `allianceObligationsForWarDeclaration` | `applyAllianceObligationsOnWar` — defensywny sojusznik **ofiary** + pełny sojusznik **agresora** |
| 2 | `treatiesBrokenByRefusal` | Po wojnie: śledzenie `joinedWarOwnerIds`, zryw traktatu gdy sojusznik nie wszedł + hint graczowi |
| 3 | `tributeBreakPairsFromDeals` | `runDiplomacyTurnTick` — `trybut_odmowa` + casus hint przed usunięciem dealów |
| 4 | `hydrateActiveDeals` | Load save: `activeDeals = hydrateActiveDeals(savedDeals)` zamiast `.slice()` |

**Backup:** `gra/src/main.ts.bak-SILNIK-D-V11`

**Warstwa:** 🟡 cross (dyplomacja wspólny stan + endTurn tick + save/load)

---

## Bramka

| Test | Wynik |
|------|-------|
| diplomacy-treaties | **9/9** |
| diplomacy-economy | **6/6** |
| diplomacy-proposal | **31/31** |
| diplomacy | **143/143** |
| smoke | **OK** |
| vite build (`$env:TEMP\civ-dist`) | **OK** |

---

## Publish

| Target | md5 | Status |
|--------|-----|--------|
| **`Gra-podglad.html`** (root) | **`01490681afbc7e67d5182992989597df`** | ✅ |
| **`gra-robocza/`** | **`01490681afbc7e67d5182992989597df`** | ✅ |
| **`gra-kanon/`** | **`01490681afbc7e67d5182992989597df`** | ✅ (sync ręczny — patrz blockery) |
| **`Gra-podglad-ROBOCZA.html`** | ten sam bundle | ✅ |

**Jeden md5** — root = robocza = kanon.

---

## Co sprawdzić po wpięciu (playtest)

1. Gracz atakuje B — **defensywny sojusznik B** wchodzi do wojny z graczem (hint + status `wojna`)
2. Gracz atakuje B — **pełny sojusznik gracza** wchodzi do wojny z B
3. Trybut zerwany (brak ¤ w skarbcu) — relacja `trybut_odmowa`; gdy AI płatnik → hint **casus belli**
4. Load save z legacy `sojusz_wojskowy` — normalizacja do `sojusz_pelny`

---

## Blockery

- **`publish-kanon-snapshot.ps1`** — błąd parsera PowerShell (znaki UTF-8 w throw/Here-String). Kanon zsynchronizowany skryptem pomocniczym `_sync-kanon-dv11.ps1` (usunięty po użyciu). **Rekomendacja Master:** naprawić encoding w `publish-kanon-snapshot.ps1`.
- Brak blokera gameplay / testów.

---

## Pliki zmienione (F)

| Plik | Zmiana |
|------|--------|
| `gra/src/main.ts` | 4 wpięcia D3 v1.1 (patrz Scope) |
| `gra/src/main.ts.bak-SILNIK-D-V11` | backup przed edycją |
| `gra-robocza/` | full snapshot |
| `gra-kanon/` | sync z robocza |
| `Gra-podglad.html` | root bundle |
