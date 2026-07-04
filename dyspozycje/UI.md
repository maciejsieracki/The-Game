# UI (Grupa E) — dyspozycja lane

**Trigger:** `start` → czytaj **DO ZROBIENIA TERAZ** → wykonaj → meldunek `UI-DO-MASTERA.md`.

**Własność:** `gra/src/ui/*`, `gra/data/ui-params.json`, mockupy `UI/*`. **NIE** `main.ts`.

---

## [2026-07-02] **W1-hero** — tła PNG menu + intro kreatora ✅

**Zip:** `Ulepszenie infografik5.zip` · `hero-menu.png`, `hero-intro.png`.  
**Kod:** `mainMenu.ts` (2-kolumnowy hero + gradienty) · `newGameFlow.ts` krok 1 (full-bleed, bez akapitu opisu).  
**Assety:** `gra/src/ui/assets/hero/*.png` (import Vite `?url`).  
**Kanon:** MD5 `a1476d02afd8433866b257f025db6bcb` · bundel ~7.6 MB (inline PNG).

---

## [2026-07-02] **infografik5** — hero PNG (Design) · ~~CZEKA decyzja Macieja~~ ✅ W1-hero

**Zip:** `Ulepszenie infografik5.zip` (22:52) · **nie** SVG medalionów.  
**Zawartość:** `hero-intro.png`, `hero-menu.png` + mockupy `.dc.html`.  
**Archiwum:** `docs/ux/claude-design/01-propozycje-z-design/ekrany-hero/`  
**Lane:** **NIE wpięte** (osobny batch — tło menu + intro kreatora, ~+4 MB bundla).  
**Maciej ABC:** A=wpiąć · B=najpierw mockupy · C=zostaw w archiwum.

---

## [2026-07-02] **infografik4 FULL** — cały eksport brand-book → gra ✅

**Problem:** sync tylko 13 SVG · **mapy JSON nie zsynchronizowane** (`setting-icon-map`, `icons-manifest`).  
**Fix:** pełny `robocopy` infografik4 `eksport/` → `gra/.../brand/` (~250 ikon + 6× JSON + CSS).  
**setting-icon-map:** klucze Design (`map-size`) + aliasy gry (`map_size`, `city_states_count`…).  
**Kanon:** patrz meldunek UI-DO-MASTERA (najnowszy MD5).

---

## [2026-07-02] **W1f** — ikony ustawień krok 4 ✅

**Zip:** `Ulepszenie infografik3.zip` → uzupełnione infografik4.  
**Handoff:** `_handoff/UI-do-DESIGN_w1f-kreator-ustawienia-6ikon.md` · **GOTOWE** (Design + Lane).

---

## [2026-07-02] **Design zip2** — `Ulepszenie infografik2.zip` sync + kanon

**Trigger Macieja:** nowe pliki w `docs/ux/claude-design/`.  
**Sync (Lane, bez rysowania):** 16× civ + 3× epoch z zip → `gra/.../brand/` + eksport Design.  
**Zmiany Design:** kamień=topór · brąz=miecz liściasty · Chiny=mianguan · Rzym=standard aquila (bez SPQR) · Sumer bez zmian.  
→ **MASTER:** kanon po build.

---

## Reguła ikon brand (Maciej · 2026-07-02)

**Lane/Cursor NIE przerysowuje SVG** (cyw., epoki, menu brand) gdy coś wizualnie nie gra.

| Krok | Kto |
|------|-----|
| 1 | Maciej: playtest → „nie działa” **albo** od razu poprawka w **Claude Design** |
| 2 | Claude Design: poprawka + zip → `docs/ux/claude-design/` |
| 3 | Maciej: „mam zip / nowy plik” → **Lane tylko sync + kanon** |

**Wyjątek:** Maciej wprost prosi „napraw teraz Lane, bez Design” (hotfix).

---

## DO ZROBIENIA TERAZ

### **POLE-BITWY Design 1E** — **ACTIVE faza 2: Design v4** (2026-07-04)

**Krok 1:** ✅ review pack · werdykt Macieja ~20:52  
**Krok 2:** ✅ ZIP na dysku · rozpakowany `docs/ux/claude-design/`  
**Krok 3 (TERAZ):** port skin · `battleScene.ts` / `battleHudTheme.ts` · handoff ACTIVE  
**Maciej:** Hak 1 OK · Hak 2 **A** · paczka 1 = pole+roster · oblężenie później  
**UI lane:** **NIE** portować przed ZIP v4

### **P1 dyplomacja reskin 1E** — **QUEUED** (2026-07-04)

**Start:** po sygnale Macieja **„idź dyplo”** (MASTER checkpoint ✅).  
**Handoff:** `_handoff/MASTER-do-UI_P1-dyplomacja-1E-2026-07-04.md`  
**Kolejka:** `docs/ux/KOLEJKA-UX-OCENY.md` · **#1**  
**Pliki:** `diplomacyPanel.ts`, `diploListHud.ts`, `diplomacyAudience.ts` · **NIE** `main.ts` · **NIE** `diplomacy.ts`  
**Mockup:** `docs/ux/claude-design/.../The Game - Ekran Dyplomacja (1E).dc.html`  
**AC:** zero emoji · `tb-diplomacy` uścisk dłoni · `diplomacy-test` 143/143

### **P1 nauka + drzewko** — **HOLD**

Maciej: dokładny przegląd hub A-28 + B-33/B-34 **przed** dyspozycją implementacji.

---

### ~~**P0 miasto**~~ — **ZAMKNIĘTE** (kanon `42efefff…`)

---

### **Design W3 v3 HUD — HOLD** (2026-07-03)

**Wklejka Design:** `docs/ux/WKLEJKA-DESIGN-START-W3-miasto-v3.md`  
**Brief:** `docs/ux/DESIGN-BRIEF-W3-miasto-v3-HUD.md`  
**Handoff:** `_handoff/UI-do-DESIGN_W3-miasto-v3-delta-2026-07-03.md`

**Lane po deliverable:** tylko CSS polish vs mockup · **bez** logiki · **bez** kanonu bez OK Macieja  
**Bitwa:** `gra/` nowsze — osobny tor C-06 · nie mieszać

---

### **[2026-07-03] C-06 v4 mapa bitwy** · START Design (osobny tor)

Brief: `DESIGN-BRIEF-C06-v4-map-redesign.md` · wklejka: `WKLEJKA-DESIGN-START-C06-v4.md`  
**Nie mieszać** z miastem W3.

---

### **[2026-07-03] W3-W4 + UX Master** · ✅ **W KANONIE** · md5 `153fcda2…`

Maciej: sesja Master = **ostateczne**. Lane W3-W4 zmergowany · reconcile 22:04.  
**Playtest:** `gra-kanon/START.html` · Ctrl+F5

---

### **[2026-07-03] Grupa C batch 2** · ✅ **W KANONIE** (reconcile Master)

C-06 mapa bitwy — **START Design v4** (sync kanon) · reszta Grupy C w kanonie.

**Handoff:** `_handoff/MASTER-do-UI-UNITS_grupa-C-batch2-2026-07-03.md` · meldunek `_handoff/UI-UNITS-do-MASTER_grupa-C-batch2-2026-07-03.md`

Port Design KOMPLET: C-12 end · C-04/C-05 siege HUD · C-06 top · cmd SVG · C-01 preBattle SVG.

**MASTER (tor B):** bramka + `publish-kanon-snapshot.ps1` — **czeka komenda `master` od Macieja w hubie.**

**Tor C (hub):** `The Game - Walka Hub Grupa-C (1E).dc.html` · `_handoff/UI-do-DESIGN_hub-walka-kafelki-2026-07-03.md`

**Tor D (A-08):** `_handoff/UI-do-DESIGN_A08-START-2026-07-03.md` · wklejka istnieje

---

### **[2026-07-03] W-WIKI-1 — Wikipedia HUD polish** · **PRIORYTET** · Maciej OK funkcji

**Handoff:** `_handoff/MASTER-do-UI_wikipedia-polish.md` (czytaj w całości)  
**Design (osobno):** `_handoff/UI-do-DESIGN_wikipedia-hud-mockup.md` — mockup mapy + miasta

| Co | Plik | Akcja Lane |
|----|------|------------|
| Przycisk Wiki góra-prawo | `hud.ts` | dopasuj do `.b-menu`, stan `.on`, bez emoji |
| Panel Poradnik/Encyklopedia | `wikiHubHud.ts` | styl jak science/diplo hub, PL gracza w meta |
| Markdown | `markdownLite.ts` | tylko jeśli brakuje formatowania |
| Treść | `wikiBundle.json` | regen: `node gra/tools/bundle-wiki-for-game.cjs` |

**Nie przywracać** Wiki na toolbarze lewym ani przy minimapie. **NIE** `main.ts`.

**DoD:** smoke OK · meldunek `UI-DO-MASTERA.md` → `→ MASTER: master`

---

## DO ZROBIENIA PÓŹNIEJ (backlog)

**START — paczka UI (Maciej · 2026-07-03)** — menu hero, intro, HUD mapy, ikony medalionów.

| # | Element | Mockup / asset | Stan Lane | Uwagi |
|---|---------|----------------|-----------|-------|
| 1 | Menu główne | `Ekran Menu Hero (1E).dc.html` + `hero-menu.png` | ✅ W1-hero | `mainMenu.ts` · lewa kolumna + hero prawo |
| 2 | Intro NOWA GRA | `Ekran Intro Hero (1E).dc.html` + `hero-intro.png` | ✅ W1-hero | `newGameFlow.ts` krok 1 · bez akapitu |
| 3 | HUD mapy layout | `HUD Mapy layout (1E).dc.html` | ✅ **W2 batch 2** | floating chip + MOC pendant + dół-prawo · banery liderów = backlog |
| 4 | Ikony medalionów | menu-emblem, epoch-*, civ-*, sett-* | ✅ sync | hash = brand-book · ramki/glow bez zmian |
| — | Panel miasta W3 | cp-* zakładki | ✅ W3 lite | **Design CZEKA:** `START — W3-miasto-1E` → handoff `_handoff/UI-do-DESIGN_w3-miasto-1E-dane.md` |

**Kanon bieżący:** MD5 **`153fcda2f71e1e9ab3a538d8b9c10f9e`** · `gra-kanon/START.html` (reconcile Master 2026-07-03 22:04)

**Inbox Design:** `docs/ux/claude-design/_staging/inbox/` — **pusty** (brak nowego zip). Ikony już w `brand-book/eksport/` = zsynchronizowane z `gra/src/ui/icons/brand/`.

**Assety PNG:** `gra/src/ui/assets/hero/` (~4 MB) · brand-book jeszcze bez `assets/` — opcjonalnie skopiować przy kolejnym zip Design.

| Batch | Co | Stan |
|-------|-----|------|
| **Playtest Macieja** | paczka UI 1–4 + W3 miasto + HUD layout | **CZEKA** |
| **W2 HUD batch 2** | layout `HUD Mapy layout (1E)` | ✅ **2026-07-03** |
| **W3 batch 2** | vertical rail B-01 | BACKLOG |
| **W1-menu** | `menu-button-map.json` | **CZEKA Design** |

**Zamknięte dziś (Lane):** W1f · infografik4 (13 SVG) · layout kreator kroki 2–4 · Sumer ✅ (Maciej).

**Po lane:** meldunek `UI-DO-MASTERA.md` → `→ MASTER: master`.

---

## Archiwum bieżące (W1 zamknięte)

**[2026-06-26] W1 PACZKA FINAL** — tokeny, emblem menu, cityPanel SVG budynki/jednostki · kanon `ca118880…` · HUD W2 = osobny batch.

---

## Archiwum (P4 — zamknięte w kanonie)

**[2026-06-28] E2 kreator** → `ORCHESTRATOR-DISPATCH-E2-2026-06-28.md` · wróci po P4

---

## Archiwum

Starsze dyspozycje: `docs/archiwum/dyspozycje/UI.md`
