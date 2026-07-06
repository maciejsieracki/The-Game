# GRUPA A → INTEGRATOR F: A-R7 rebuild kanon (PILNE)

| Pole | Wartość |
|------|---------|
| **Status** | 🔴 **→ INTEGRATOR: PILNE** |
| **Data** | 2026-07-01 |
| **Decyzja Macieja** | A-R7=B (2026-06-26) · potwierdzenie A-R7-IMP=A (2026-07-01) ×3 |
| **Problem** | Kod `gra/src` ✅ · **`Gra-podglad.html` NIE** (stary bundle) |

---

## Diagnoza (dowód)

| Warstwa | A-R7 gate `isInTerritory` | Dowód |
|---------|---------------------------|-------|
| `gra/src/map/improvement-build.ts` | ✅ L436–438 | test 43/43 |
| `Gra-podglad.html` (kanon) | ❌ | minifikat: `case"lodzie_rybackie":return _===V.Wybrzeze\|\|_===V.Morze` — **bez** `Ra()` |
| `gra-kanon/src/...` | ❌ | niezsynchronizowany snapshot |
| `gra-robocza/src/...` | ❌ | niezsynchronizowany |

**Maciej gra w `Gra-podglad.html`** → decyzja wygląda jak „niewdrożona", choć lane A kodował w `gra/src`.

---

## Co F ma zrobić

1. **Sync** `gra/src/map/improvement-build.ts` → build (nie `gra-kanon` bez merge)
2. **Rebuild** → `Gra-podglad-ROBOCZA.html` + **`Gra-podglad.html`** + PLAYTEST-*
3. **Weryfikacja bundle:** po buildzie w JS musi być gate terytorium przy `lodzie_rybackie` (nie sam `Wybrzeze||Morze`)
4. **Bramka:** `node gra/tools/map-improvement-qualify-test.cjs` → **43/43**

**Warstwa:** 🟡 cross (tylko rebuild — bez zmian main.ts jeśli już `createImprovementBuildApi`)

---

## DoD

- [ ] Maciej w trybie budowy: łodzie **nie** świecą poza kulturą miasta
- [ ] md5 kanon ≠ poprzedni · meldunek `→ MASTER: GOTOWE-KANON`
- [ ] REJESTR: A-R7 → 🟢 WDROŻONA + md5

**Maciej nie wkleja do Mastera** — Master czyta ten handoff + `MAPA-DO-MASTERA.md`.
