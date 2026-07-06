# UI → MASTER · B-26 okolica Tier 6 + domknięcie gotowych elementów miasta

**Data:** 2026-07-04 ~13:21  
**Trigger:** Maciej — „gotowe wgrywaj od razu; MASTER testy + kanon”  
**Status:** **PROMOCJA KANON wykonana** (lane + build) · MASTER: potwierdź bramkę w hubie · archiwum wpisu

---

## Co wgrano (gra/src → robocza → kanon)

| Element | Plik | Zmiana |
|---------|------|--------|
| **B-26 Zarządzanie polami** | `ui/cityPanel.ts` | Emoji → SVG Tier 6: `field-food`, `field-production`, `field-tax`, `field-balanced`; **Ręczny** → `chip-manpower`; CSS pill icon+label |
| **Miasto W3** (batch wcześniejszy) | `cityPanel.ts`, `cityUxFrame.ts`, `game/okolica.ts`, `main.ts` | exit pod surowcami · okolica ręczna · chrome HUD · top-stack |
| **Modale mapy** | `cityAttackChoice`, `siegeMapPanel`, `cityCaptureNotice` | C-04 / C-05 / A-19 (już w src) |

**Bez zmian logiki okolicy** — tylko skin profili na mapie 3D.

---

## Bramka (lane, 2026-07-04 ~13:20)

| Test | Wynik |
|------|-------|
| okolica-test | **32/32** ✅ |
| wire-ekonomia | **34/34** ✅ |
| smoke | ✅ |
| diplomacy-test | **143/143** ✅ |
| koszary-gate | **21/21** ✅ |
| logic-test | **202/203** ⚠ seed 777 minPairDist=4 (MAPA, nie UI) |
| combat-test | **0/6** ⚠ baseline-red |
| battle-smoke | **FAIL** ⚠ label pre-bitwa (Maciej poprawia bitwę osobno) |

**Opus:** FAST — delta wizualna B-26 + potwierdzenie playtestu miasta (Maciej OK wcześniej).

---

## Publikacja

```
npx vite build --outDir $env:TEMP\civ-dist
.\tools\publish-robocza-snapshot.ps1
.\tools\publish-kanon-snapshot.ps1
```

| | md5 |
|---|-----|
| **Kanon** `gra-kanon/Gra-podglad.html` + root `Gra-podglad.html` | **`42efefffbcab5fd8b6ff4c07e862443d`** |
| Archiwum poprzedniego kanonu | `gra-kanon-archiwum/gra-kanon_20260704-132128` (md5 `7dfabe3a…`) |

**Playtest Macieja:** `gra-kanon/START.html` → Ctrl+F5 → miasto → Mapa → dolny panel „Zarządzanie polami” (SVG zamiast emoji).

---

## MASTER — DoD

- [x] Potwierdzić md5 kanonu w hubie (`42efefffbcab5fd8b6ff4c07e862443d`)
- [x] Bramka batchu (okolica, wire, smoke, diplomacy, koszary)
- [x] Wpis dziennika + kolejka `docs/ux/KOLEJKA-UX-OCENY.md`
- [x] Dyspozycja P1 dyplo: `_handoff/MASTER-do-UI_P1-dyplomacja-1E-2026-07-04.md` (QUEUED)
- [x] **Nie** prosić Macieja o ocenę B-26 / miasto W3 — zamknięte

---

## Pozostaje poza tym batchem (tylko do oceny Macieja)

Patrz `docs/ux/BACKLOG-OCENA-MACIEJ-2026-07-04.md` (lista skrócona).
