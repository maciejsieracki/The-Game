# MASTER → INTEGRATOR · B0.9 — przywrócenie plonów na mapie 3D + tryby auto okolica

**Data:** 2026-07-05  
**Trigger:** Playtest Macieja — brak 🔨/🍞/💰 na heksach; tryby Żyw./Prod. bez efektu; test na **`Gra-podglad.html`** (kanon) zamiast roboczej.  
**Status:** **DONE publish** — czeka playtest Macieja (`OK B0.9` → kanon)

> **Proces (Maciej 2026-07-05):** MASTER w tym czacie = diagnoza + handoff. **Integrator = jedyny** edytor `main.ts` + publish bundle. MASTER w sesji B0.9 naruszył proces (wpiął src + publish) — integrator **oficjalnie** przejmuje, weryfikuje diff, publikuje roboczą.

---

## Przyczyna 1 — brak plonów na mapie 3D

`syncOkolicaOverlay()` w `main.ts` przekazywało `showYields: false` — regres od **2026-07-04**. Moduł `cityOkolicaOverlay.ts` OK.

## Przyczyna 2 — tryby auto „nie działają”

W trybie **Ręczny** klik Żyw./Prod./Podat./Zrówn. tylko zmieniał `okolicaFocus` + hint — bez przejścia w auto. Fix: profil **zawsze** włącza auto + czyści `okolicaReczne`.

## Playtest Macieja — właściwy plik

| Plik | Fix B0.9? |
|------|-----------|
| `Gra-podglad.html` (kanon) | ❌ nie testować |
| **`Gra-podglad-ROBOCZA.html`** | ✅ po publish integratora |
| `gra-robocza/START.html` | ✅ |

---

## Zadanie integratora (JEDYNY wykonawca)

### Fix A — `syncOkolicaOverlay` (~L1524)

```typescript
showYields: true,  // było: false
```

### Fix B — `onOkolicaFocusChange` w `extraCityPanelConfig()`

Po ustawieniu `city.okolicaFocus = focus` **zawsze**:

```typescript
city.okolicaTryb = 'auto';
delete city.okolicaReczne;
// … hint „auto · priorytet … — pola przypisane automatycznie”
// updateHud(); refreshCityPanelIfOpen(); syncOkolicaOverlay();
```

**Nie ruszać:** `cityOkolicaOverlay.ts`, `okolica.ts`, `cityPanel.ts` (przyciski są podpięte — to nie „pusta szata”).

**Backup:** `main.ts.bak-SILNIK-B0.9-showYields-2026-07-05`

---

## DoD integratora

1. **Build roboczy** (NIE `dist/` w OneDrive):
   ```powershell
   cd gra-robocza
   npx tsc --noEmit
   npx vite build --outDir $env:TEMP\civ-dist
   ```
2. **Publish robocza:** skopiuj bundle → `Gra-podglad-ROBOCZA.html` / `gra-robocza/Gra-podglad.html` (wg `publish-robocza-snapshot.ps1`).
3. **Playtest Macieja:** Ctrl+F5 → miasto → mapa 3D → każde pole w zasięgu ma 🍞/🔨/💰; pole z 👤 ma złote cyfry.
4. **Bramka:** smoke OK · okolica-test 32/32 (bez regresji).
5. **Kanon:** dopiero po werdykcie Macieja (`OK B0.9`) — `publish-kanon-snapshot.ps1` + wpis md5 w dzienniku.

**Po publish roboczej:** Maciej testuje **`Gra-podglad-ROBOCZA.html`** (Ctrl+F5), nie `Gra-podglad.html`.

---

## Fix 2 — tryby auto (spec powyżej Fix B)

Przycisk **Ręczny** nadal osobno; **↩** przywraca auto bez zmiany profilu.

---

## Powiązane

- `dyspozycje/BLAD-B0.9-PLONY-MIASTA-2026-07-05.md`
- Diagnoza: czat MASTER 2026-07-05 (showYields regres 2026-07-04)
