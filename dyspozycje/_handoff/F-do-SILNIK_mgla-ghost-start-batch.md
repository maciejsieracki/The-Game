# HANDOFF: F → SILNIK — mgła start + ghost miasta + kreator (playtest Maciej)

**Data:** 2026-06-27  
**Od:** Grupa F (playtest ROBOCZA)  
**Do:** SILNIK / MASTER (wpięcie → kanon)  
**Status:** **WPIĘTE** (kod w `main.ts` · ROBOCZA `6aedd5ce…`) · **CZEKA:** Opus → kanon  
**Flaga:** GOTOWE

---

## Kontekst

Maciej: mockupy HUD utracone — praca na **`Gra-podglad-ROBOCZA.html`**.  
**Korekta Maciej 2026-06-27 (wieczór v2):** generator wybiera **preferowany start** (rzeka + pola + góry w okolicy). Oświetlenie **r=5** wokół tego hexu. Reszta mapy czarna. Miasto/jednostka poza tym = możliwe w ciemno. Zasięg jednostki = 3 hex (miasto → decyzja EKONOMIA).

**Nie blokuje:** rzeki przez mgłę → MAPA (`F-do-MAPA_fog-rzeki.md`).

---

## Co jest w repo

| Temat | Plik | Zmiana |
|-------|------|--------|
| **Preferowany start** | `gra/src/map/startScoring.ts` | `findBestPlayerStartHex` — rzeka, pola, góry |
| **Oświetlenie startu** | `main.ts` + `START_REVEAL_RADIUS=5` | krąg 5 hex wokół preferowanego miejsca |
| **Zasięg jednostki** | `visibility.ts` | `DEFAULT_SIGHT = 3` (miasto → EKONOMIA) |
| **Render unknown** | `gra/src/render/scene.ts` | unknown → `FOG_HIDDEN_COLOR` (czarny), nie ×0.14 |
| **Minimapa unknown** | `gra/src/ui/minimapHud.ts` | hidden → `#0b0d12` |
| **Ghost załóż miasto** | `gra/src/main.ts` | `showGhostCity` + chip 🏛 |
| **Kreator (UI)** | `UI/Makieta-flow-nowa-gra.html` | flow → ROBOCZA |

**Build testowy:** `Gra-podglad-ROBOCZA.html`  
**md5:** `563A5C947CC5208A8DA26380F67C0690`  
**Backup:** `main.ts.bak-F-fog-20260627`

---

## Co ma zrobić SILNIK (MASTER)

1. **Weryfikacja diff** — `gra/src/main.ts` (sekcje: `seedStartingFog`, `refreshFog`, ghost build mode, `doStartGame`).
2. **Backup:** `cp gra/src/main.ts gra/src/main.ts.bak-SILNIK-20260627-fog-ghost`
3. **Bramka:**
   ```powershell
   cd gra
   npx vite build --outDir $env:TEMP\civ-dist
   node tools/logic-test.cjs
   node tools/smoke.cjs
   node tools/battle-smoke.cjs
   ```
4. **Playtest ścieżka:** `UI/Gra-podglad-MENU.html` → kreator → ROBOCZA (lub kanon po publikacji).
5. **Opus review** (Ask) — adversarial przed kanonem.
6. **Kanon:** skopiuj build → `Gra-podglad.html` + md5 w `SILNIK-DO-MASTERA.md`.

**Nie wymaga** osobnego merge z lane UI/MAPA — logika jest w F batch w `main.ts`.

---

## DoD (SILNIK)

- [ ] Nowa gra: **cała mapa czarna** dopóki brak jednostki/miasta gracza
- [ ] Po mieście/jednostce: jasny krąg **10 heksów**; poza nim unknown=czarny; dawno widziane=FoW (×0.45)
- [ ] Minimapa: te same stany fog co mapa 3D
- [ ] 🔨 → Załóż miasto: **ghost model + chip** za kursorem
- [ ] Klawisz **F** nadal przełącza mgłę (regresja)
- [ ] 17 suitów logic (baseline koszary-gate OK) + smoke + battle-smoke
- [ ] Opus APPROVE → kanon opublikowany

---

## Otwarte (inne lane — nie blokują tego batchu)

| Temat | Owner |
|-------|--------|
| Rzeki widoczne przez mgłę | MAPA `F-do-MAPA_fog-rzeki.md` |
| Mockup D1B canvas | utracony — OneDrive restore opcjonalnie |

---

**→ SILNIK: GOTOWE** — proszę wpiąć do gry (kanon) po bramce + Opus.
