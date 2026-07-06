# F → MASTER: KANON-SPRINT 2026-07-02

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** + kanon promoted |
| **Data** | 2026-07-02 |
| **Batch** | F1 settlement Roblox ghost + full gate + kanon sync |
| **md5** | `2fc963816085f41c65ccf9398ff6ed3a` |

---

## Wpięcie main.ts (F1 ghost)

- `showGhostCity` → `buildSettlementModel(player.era, civ, 1, 0xffd54a, false)` (Roblox via `GAME_MAP_RENDER_STYLE`)
- Usunięto importy `buildBronzeCity` / `buildStoneAgeCity` (ghost only)
- `CityRenderer` już używał `buildSettlementModel` w `cities.ts` (lane MAPA)

---

## Testy (PASS)

| Suite | Wynik |
|-------|-------|
| society-breakdown | 26/26 |
| wire-ekonomia | 34/34 |
| wealth | 28/28 |
| culture-religion | 51/51 |
| power-objective | 12/12 |
| diplomacy | 143/143 |
| diplomacy-proposal | 31/31 |
| smoke | OK |

**tsc:** pre-existing errors (battleScene, preview modules) — vite build OK.

---

## Publish

| Target | md5 | Status |
|--------|-----|--------|
| `Gra-podglad.html` (root) | `2fc963816085f41c65ccf9398ff6ed3a` | ✅ |
| `gra-robocza/` | `2fc963816085f41c65ccf9398ff6ed3a` | ✅ |
| `gra-kanon/` | `2fc963816085f41c65ccf9398ff6ed3a` | ✅ |

**Jeden md5** — root = robocza = kanon.

Poprzedni kanon zarchiwizowany: `gra-kanon-archiwum/gra-kanon_20260701-133848`

---

## Pliki zmienione (F)

| Plik | Zmiana |
|------|--------|
| `gra/src/main.ts` | ghost city → `buildSettlementModel` |
| `gra-robocza/` | full snapshot (publish-robocza-snapshot.ps1) |
| `gra-kanon/` | full copy + KANON-MANIFEST.json |
| `Gra-podglad.html` | root bundle |
| `Gra-podglad-ROBOCZA.html` | legacy robocza |

---

## Co sprawdzić po wpięciu (Master)

- Ghost założenia miasta = ten sam styl Roblox co miasta na mapie (kamień ep.1 / brąz ep.2+)
- Playtest Maciej **STOP** do sygnału (decyzja sprintu)

---

## Blockery

- Brak. `publish-kanon-snapshot.ps1` — błąd kodowania znaków (promocja kanon ręczna).
