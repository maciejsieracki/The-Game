# EKONOMIA → UI: kontrakt max zapasów armii (B5-SP-LIMIT)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ GOTOWE |
| **Batch** | `B5-SP-LIMIT` |
| **Decyzja** | SP6=C · SP6-overflow=A |

---

## Co przesyłam

| API | Plik | Opis |
|-----|------|------|
| `getEmpireFoodMaxCap(ownerId)` | `gra/src/game/empire-food.ts` | Max zapasów = `100 × liczba Spichlerzy` w imperium; `0` gdy brak Spichlerza |
| `getEmpireFoodReserve(ownerId)` | j.w. | Bieżące zapasy (może być ujemne = głód) |
| `HudState.zywnoscMax` | `gra/src/ui/hud.ts` | Pole na HUD mapy — format `{zapasy} / {max}` |

Parametr: `spichlerz_pojemnosc_zapasow_panstwa` w `gra/data/econ-params.json` (normal=100).

---

## Co UI ma z tym zrobić

1. HUD mapy: `zywnoscLabel` + `zywnoscMax` → wyświetl `142 / 200` (zrobione w `hud.ts`).
2. Panel miasta: **nie** pokazuj zapasów armii — tylko netto miasta (SP4=C).
3. Wire `zywnoscMax` w `buildHudState` → **Integrator F** (już w `main.ts` linia ~3573).

---

## DoD

- [x] Cap 100×Spichlerze w `advanceEmpireFood`
- [x] Overflow przepada (clamp na końcu tury)
- [x] Testy `empire-food-b5-test.cjs` (cap scenariusze)

**Flaga:** → INTEGRATOR: NIE wymagane (logika lane B; wire HUD już w silniku).
