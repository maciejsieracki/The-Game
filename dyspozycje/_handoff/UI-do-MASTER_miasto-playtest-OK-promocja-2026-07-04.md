# UI → MASTER: miasto W3 · playtest OK Macieja · **PROMOCJA KANON**

**Data:** 2026-07-04  
**Trigger:** Maciej — „dajmy na stałe do gry, reszta później; wyślij do Mastera pod integratora / kanon”  
**Werdykt produktowy:** panel miasto **OK** (surowce miasta u góry, exit pod spodem, okolica ręczna, 7 zakładek, chrome HUD mapy w mieście)  
**Poza zakresem tej promocji:** bitwa / pole 3D · redesign HUD imperium · W3.2 Design delta · Wiki (mapa bez zmian)

---

## 1. Co wpisano na stałe (`gra/src/` = źródło kanonu)

| Plik | Zmiana (skrót) |
|------|----------------|
| `gra/src/ui/cityPanel.ts` | W3 top: badge + **surowce miasta** → **„Wróć na mapę” wyśrodkowany pod spodem**; usunięty float exit z mapy (`civ-v-map-exit-float`); toolbar okolica: **👤 Ręczny**, profile auto bez `.on` w trybie ręcznym; `appendOkolicaToolbarProfiles` |
| `gra/src/ui/cityUxFrame.ts` | `TOP_H=132`, panele od `148px`; hit-test całego `.civ-ux-top` |
| `gra/src/game/okolica.ts` | Tryb ręczny: **pusta pula = pusta** (bez cichego fallbacku do auto) |
| `gra/src/main.ts` | `onOkolicaEnterManual` + `onOkolicaFocusChange` **nie** resetuje do auto gdy `tryb==='reczny'`; import `seedReczneFromAuto` |

**Backupy przed batch:** `*.bak-UI-2026-07-04-promocja` obok plików powyżej.

**Już w `gra/src` (bez diff w tym batchu — wcześniejszy lane):**
- `hud.ts` — `.is-city-view` chowa pasek imperium w panelu miasta (P0-2)
- `cityAttackChoice.ts`, `siegeMapPanel.ts`, `cityCaptureNotice.ts` — modale mapy C-04/C-05/A-19 v2

**Sync robocza:** te same 4 pliki skopiowane do `gra-robocza/src/` (OneDrive wymaga zapisu lokalnego).

---

## 2. Bundle playtest (robocza)

| | |
|--|--|
| Build | `cd gra && npx vite build --outDir $env:TEMP\civ-dist` |
| Skopiowano | `gra-robocza/Gra-podglad.html` |
| **md5** | **`0993be1929abc8e23c76b01e6f1ab7dd`** |
| Start Macieja | `gra-robocza/START.html` Ctrl+F5 |

---

## 3. DoD dla MASTER (integrator → kanon)

1. **Potwierdź** diff w `gra/src/` vs backup `.bak-UI-2026-07-04-promocja`
2. **Bramka:** `npx tsc --noEmit` · 17 suitów testów (baseline `koszary-gate-test` red OK) · smoke
3. **Build:** `npx vite build --outDir $env:TEMP\civ-dist` → skopiuj do root `Gra-podglad.html`
4. **Opus** wizualny sign-off (miasto: exit pod surowcami, ręczna okolica) — lub **FAST** po werdykcie Macieja w tym czacie
5. **Publikacja:** `gra/tools/publish-kanon-snapshot.ps1` **albo** ręcznie: bundle + `gra-kanon/` + wpis md5 w `DZIENNIK-MASTERA.md`

**UWAGA:** **NIE** uruchamiać `publish-robocza-snapshot.ps1` **przed** promocją — nadpisuje roboczę ze `gra/` (OK **po** merge, żeby utrzymać sync).

---

## 4. Playtest regresji (5 min)

1. Mapa — pasek imperium **bez zmian** (Skarbiec, Praca…)
2. Wejście w miasto — u góry **tylko surowce miasta** + exit **pod** nimi (nie z lewej)
3. Okolica — **Ręczny** → odklik 👤 → pole zostaje puste; **↩** wraca auto
4. Esc / „Wróć na mapę” → mapa
5. Oblężenie mapy (opcjonalnie) — C-04/C-05/A-19 bez regresji

---

## 5. Świadomie **STOP** (kolejne sprinty)

- Pole bitwy / pre-bitwa / deployment (Maciej poprawia sam)
- HUD mapy D2 / menu E / dyplomacja polish
- Design `W3-miasto-v3.2-delta`
- Usunięcie Wiki z HUD mapy (osobna decyzja)

---

**→ MASTER: GOTOWE** · promocja kanonu po bramce + Opus (lub FAST Maciej)
