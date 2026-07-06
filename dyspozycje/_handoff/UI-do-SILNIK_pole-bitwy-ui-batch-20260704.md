# UI → SILNIK/MASTER: batch UI pola bitwy (POLE-BITWY)

**Status:** ✅ **ZAMKNIĘTE** — sign-off Macieja 2026-07-04 ~20:35  
**Data:** 2026-07-04  
**Build testowy:** `POLE-BITWY-20260704-manual-polish`  
**Podgląd:** `Gra-podglad-POLE-BITWY.html`  
**Kanon md5:** `b210ebfe8a4ecd178be68693e74bd25b` (source `battleScene.ts` wspólny z kanonem)

**Maciej:** funkcjonalnie OK · walki zbyt długo → **backlog balans** (nie blokuje · osobny ticket UNITS/CYW później)

---

## Co przesyłam

Zmiany wyłącznie w lane UI/battle — **bez** edycji `main.ts`. Maciej zatwierdził UX w podglądzie POLE-BITWY.

### Pliki (source of truth)

| Plik | Zakres |
|------|--------|
| `gra/src/battle/battleScene.ts` | HUD bitwy, deploy toolbar, roster, taktyka/strategia, zoom, pasek mocy |
| `gra/src/battle/battleHudTheme.ts` | Stałe rosteru, metryki siatki 6×5, scrollbar |

### Funkcje (skrót)

1. **Pasek mocy** — miecz/tarcza + nazwy frakcji (Rzymianie/Grecy) na linii mocy; „Ostatnie starcia” pod paskiem.
2. **Dolny toolbar deploy** — grid 3-kolumnowy (chips | Formacja/Konnica/Linie/Taktyka/Strategia | Reset/Start); naprawione kliknięcia.
3. **TAKTYKA** (nowy przycisk) — Obrona / Atak / Szturm / Ostrzał per grupa.
4. **STRATEGIA** — priorytety celów armii (K/P/Ł 1→2→3) + opcjonalne własne priorytety grupy.
5. **Roster lewy panel** — stała szerokość panelu (`ROSTER_PANEL_FIXED_W`, 6 kolumn bazowo); chipy wypełniają obszar; max **6 kolumn × 5 rzędów** bez skali; dopiero potem skala + scroll.
6. **Zoom** — 2× bliższe przybliżenie (`camDistMin × 0.5`).
7. **Deploy test** — auto-grupowanie: Konnica / Piechota / Łucznicy (osobne grupy na starcie deploy).

### Batch 2 — AUTO→RĘCZNY (2026-07-04 popoł.)

8. **Taktyka/Strategia** po przerwaniu AUTO — `_syncBattleToolbarMode`, `_rebindDeployToolbarRefs`.
9. **Filtry Konnica/Piechota/Grupa** — fix co-klatkowy (`_battleQuickSelectSig`, bez rebuild co frame).
10. **Podział grup** — `_detachUnitsFromGroups` + przycisk **◆ Grupuj** w `_updateBattleSelectionBar`.
11. **Szturm konnicy** — `_bestChargeStepKey`, `_cavManeuverStep`, `_carveBattleBox` (równina, bród).
12. **Feedback zaznaczenia** — `_showBattleRosterFeedback` per filtr typu/grupy.

**Bez zmian `main.ts`.**

---

## Co MASTER zrobił (2026-07-04 ~15:15)

1. ✅ Source `battleScene.ts` + `battleHudTheme.ts` w `gra/src/` (wspólne z kanonem).
2. ✅ Build kanonu → `Gra-podglad.html` md5 `d1a61c24…`
3. ✅ POLE-BITWY → root + `gra-kanon/` + `gra-robocza/`
4. ⚠️ `combat-test` 0/6 (HP=0 w harnessie — pre-existing, nie batch UI)
5. ✅ `battle-smoke` boot OK · `map-field-battle-test` OK (sesja lane)
6. ⏳ Opus review opcjonalny przed kolejną promocją walki

---

## DoD (kryteria akceptacji)

- [ ] Deploy: 5 przycisków dolnych działa (Formacja, Konnica, Linie, Taktyka, Strategia).
- [ ] Taktyka ustawia doktrynę grupy; Strategia ustawia priorytety (armia + opcjonalnie grupa).
- [ ] Roster: stała szerokość; 10 jednostek w grupie ≈ 6×2 duże chipy (nie 4×3 małe z pustymi bokami).
- [ ] 50 jednostek w grupie: 6 kolumn, scroll po 5 rzędach, sensowna skala.
- [ ] Pasek mocy: miecz + Rzymianie | Grecy + tarcza; brak nachodzenia z clash log.
- [ ] Zoom kółkiem: 2× bliżej niż wcześniej.
- [ ] Znacznik buildu w rosterze zawiera `POLE-BITWY-20260704-roster-grid6`.

---

## Test plan Macieja (playtest)

1. Otwórz `Gra-podglad-POLE-BITWY.html` — preset `maciej_playtest` (50 vs 25).
2. Deploy: 3 grupy startowe (Konnica, Piechota, Łucznicy) — rozwiń każdą, sprawdź wypełnienie siatki.
3. Taktyka / Strategia — osobno per grupa.
4. Start walki → roster walki ręcznej ten sam layout.

---

## Uwagi

- `_autoGroupDeployByKind()` — tylko deploy; można ograniczyć do presetu playtest (`maciej_playtest`) jeśli w kanonie przeszkadza.
- `BATTLE_UI_BUILD` — string w nagłówku rosteru (debug).
