# B-PALAC-TIER — Pałac: 3 tiery + bramki surowców + bonus ×1,5

**Data:** 2026-07-24  
**Status:** 🟢 WDROŻONA  
**Grupa:** B (Ekonomia/Miasto)

---

## Cytat Macieja

> Trzeba ustawić, że pierwszy pałac robimy tylko z drewna i wymagane jest tylko drewno, drugi drewno i kamień, a trzeci drewno, kamień i cegły.

> Za każdy upgrade pięćdziesiąt procent wyższe bonusy.

---

## Decyzja

### Tiery (łańcuch upgrade, wzorzec Spichlerz/Mury)

| Tier | ID | Epoka | Bramka dostępu (B-SUROW-BUD) | koszt_surowce |
|------|-----|-------|------------------------------|---------------|
| I Kamień | `palac` | 1 | Drewno | drewno 8 |
| II Brąz | `palac_ii` | 2 | Drewno + Kamień | drewno 8 + kamień 8 |
| III Żelazo | `palac_iii` | 3 | Drewno + Kamień + Cegła | drewno 8 + kamień 8 + cegła 6 |

Upgrade: `palac` → `palac_ii` → `palac_iii` (`upgradeFrom`, jak Mury→Cytadela).

### Bonusy (+50% względem poprzedniego tieru = ×1,5 na krok)

Baza tier I (×1):

| Stat | baza | przyrost/poz |
|------|------|--------------|
| kultura | 5 | 3 |
| zadowolenie | 2 | 1 |
| mnoznik | 5 | 0 |

Tier II (×1,5):

| Stat | baza | przyrost/poz |
|------|------|--------------|
| kultura | 8 | 5 |
| zadowolenie | 3 | 2 |
| mnoznik | 8 | 0 |

Tier III (×2,25 = 1,5²):

| Stat | baza | przyrost/poz |
|------|------|--------------|
| kultura | 11 | 7 |
| zadowolenie | 5 | 2 |
| mnoznik | 11 | 0 |

W silniku: tylko aktywny tier w `builtIds` (upgrade zastępuje poprzednika). Kultura/Prawo/konwersja: `cityHasPalacLine()` = dowolny tier.

### UI

Produkcja: „Rozbuduj Pałac → Pałac II" (UPG-PROD A). Ikona: ten sam `bld-palac` dla wszystkich tierów.

---

## Pliki

- `gra/data/buildings.json` — `palac`, `palac_ii`, `palac_iii`
- `gra/src/game/building-upgrades.ts` — `cityHasPalacLine()`
- `gra/src/game/conquest-stability.ts`, `cityPanel.ts`, `main.ts` — hasPalac przez helper
- `gra/src/ui/icons/brand/building-icon-map.json`
