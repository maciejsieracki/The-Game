# MASTER → SILNIK: E2 — wpięcie gęstości świata

**Status:** **CZEKA** (blok: MAPA `→ SILNIK: GOTOWE` + UI kreator)  
**Warstwa:** 🟡 cross (generator + spawn + NewGameParams)

---

## Wejście

`NewGameParams` (UI lane) — pola do odczytu:

| Pole | Źródło |
|------|--------|
| `civTypesCount` | kreator krok 4 |
| `worldDensity` | zaawansowane (resources/rivers/desert/forest) |
| `mapQuality*` | E1 bundle (już wpięte) |

---

## SILNIK — zadania

1. W `doStartGame` / generacji mapy: przekaż `WorldGenerationPreset` + `civTypesCount` do `generujSwiat(...)` (API z handoffu MAPA).
2. Spawn klastrów: użyj `civTypesCount` zamiast sztywnego `aktywneTypyFromMapLabel(mapSize)` gdy param obecny.
3. Zapis gry: opcjonalnie `meta.worldDensity` (v1.0 nice-to-have).
4. Build + bramka 17 suitów przed ROBOCZA.

---

## DoD

- [ ] Playtest: Mało surowców vs Dużo — widoczna różnica na tej samej mapie (inny seed OK)
- [ ] Typy cywilizacji: zmiana suwaka zmienia liczbę obcych klastrów
- [ ] Meldunek `SILNIK-DO-MASTERA.md`

**Flaga:** `→ INTEGRATOR: GOTOWE` 🟡

**Czytaj:** `MAPA-do-SILNIK_E2-world-opts.md` (gdy MAPA dostarczy)
