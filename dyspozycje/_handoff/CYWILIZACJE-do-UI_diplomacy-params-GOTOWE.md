# CYWILIZACJE → UI: audiencja BBBB — params gotowe, czeka render

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 Lane D done · **UI implement** |
| **Data** | 2026-06-30 |
| **Bloker Power/M:** | **ZDJĘTY** |

---

## Zależność

Integrator dostarczy w `getState()` (po Twoim renderze lub równolegle):

| Pole | Źródło |
|------|--------|
| `respekt` | `formatPowerRelationLine(...).respekt` |
| `powerRatioLabel` | np. `"2:1"` |
| `playerPower`, `otherPower` | objective Power P-A |
| `personalityTags` | `diplomacyPersonalityTags(civKey)` |
| `relacjaTotal` | zaufanie + respekt (0–200) |

Moduł danych: `gra/src/game/diplomacy-display.ts`  
Pełna spec: `CYWILIZACJE-do-UI_dyplomacy-relation-display-v2.md`

---

## DoD UI

- [ ] Rozszerzyć `DiplomacyAudienceState`
- [ ] Linia relacji: Status · Zaufanie · Respekt · **Moc X:Y**
- [ ] Tagi osobowości (max 3) przy portrecie AI
- [ ] Tooltip paska Respekt (`title=` + `respektTooltipPl()`)

**NIE** importować `game/*` poza typami — dane z callbacków SILNIK.

**Flaga:** CZEKA UI
