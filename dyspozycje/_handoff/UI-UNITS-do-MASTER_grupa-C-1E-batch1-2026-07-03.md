# Handoff UI + UNITS → MASTER — Grupa C 1E batch 1

**Status:** **GOTOWE** (implementacja lane) · **CZEKA MASTER** (F + kanon)  
**Data:** 2026-07-03  
**Trigger Macieja:** „Zacznij budować i implementować” + „przenieś do Mastery”  
**Lane:** UI (`preBattle.ts`) + UNITS (`battleScene.ts`) · **`main.ts` NIE RUSZANY**

---

## 1. Co zrobiono (batch 1)

### Nowy moduł — tokeny 1E

| Plik | Rola |
|------|------|
| `gra/src/battle/battleHudTheme.ts` | Kolory Ty `#3a6ad0` / wróg `#c84040`, panel 1E, przyciski primary/outline, SVG formacji deploy, `hpBarGradient()` |

Decyzja UX: `docs/ux/DECYZJA-C-kolory-stron-bitwa.md`

### Port mockupów → kod

| Design (deliverable) | Kod | Zmiana |
|----------------------|-----|--------|
| **Decyzja kolory** | `battleScene.ts` `FACTION_ATK/DEF`, paski morale boków, etykiety deploy | ATK/Ty niebieski · OBR/wróg czerwony |
| **C-06 deployment v2/v3** | `_buildDeployOverlay` | Panel 3-kolumnowy 1E · F1–F3 **SVG** (bez emoji) · Reset/Grupuj/Start walki |
| **C-09 Karty jednostek** | `_buildDeployRosterDock`, `_createDeployRosterCard`, `_buildRosterBar` | Roster TW · zaznaczenie niebieski glow · HP bar niebieski · rzędy konnica/piechota/łucznicy |
| **C-01 Pre-bitwa v2** | `preBattle.ts` | CSS `--pb-atk`/`--pb-def` · tła kolumn · paski HP stron |
| **C-12 Koniec bitwy v2** | `_showEndScreen`, `_showResultBanner`, `_showEndDetails` | Panel 5C · karty strat · przyciski 1E · kolory Ty/wróg |

### Etykiety deploy (zgodne z Design)

- Lewo: **`ATK · Ty`** (niebieski)
- Prawo: **`OBR · wróg`** (czerwony)

---

## 2. Pliki zmienione (git diff)

```
gra/src/battle/battleHudTheme.ts          ← NOWY
gra/src/battle/battleScene.ts             ← theme import, deploy, roster, end screen, kolory
gra/src/ui/preBattle.ts                   ← kolory stron 1E
dyspozycje/UI-STAN.md
dyspozycje/UI-DO-MASTERA.md               ← meldunek lane
docs/ux/DECYZJA-C-kolory-stron-bitwa.md   ← (wcześniej)
dyspozycje/_handoff/DESIGN-do-UNITS_kolory-stron-bitwa.md ← spec (batch1 wdrożył)
```

**NIE dotknięte:** `gra/src/main.ts` · `Gra-podglad.html` (kanon)

---

## 3. Design — paczka odebrana (referencja MASTER/Opus)

| Plik mockupu | Status Design | Port batch 1 |
|--------------|---------------|--------------|
| `claude-design/The Game - C01 Pre-bitwa v2 (1E).dc.html` | ✅ | 🟡 kolory (emoji w przyciskach zostaje) |
| `claude-design/The Game - C06 Deployment v2 (1E).dc.html` | ✅ | ✅ panel deploy |
| `claude-design/The Game - C06 Deployment v3 (1E).dc.html` | ✅ | 🟡 top HUD v3 — **batch 2** |
| `claude-design/The Game - C09 Karty jednostek v2 (1E).dc.html` | ✅ | ✅ roster deploy + manual bar (częściowo) |
| `claude-design/The Game - C12 Koniec bitwy v2 (1E).dc.html` | ✅ | ✅ end screen (uproszczony vs pełny C-12 hero/łupy) |
| `claude-design/The Game - C02 Rozstawienie v2 (1E).dc.html` | ✅ | — (wariant oblężenia?) |

**Design w toku / START wysłany:** C-21 koniec (duplikat C-12?) · A-08 ulepszenia

---

## 4. Testy lane (2026-07-03)

| Test | Wynik |
|------|-------|
| `node tools/combat-test.cjs` | **6/6 PASS** |
| `npx vite build --outDir $env:TEMP\civ-dist` | **OK** (~8.5 MB bundle) |
| `npx tsc --noEmit` | baseline projektu ma stare błędy · **brak nowych** z `BATTLE_PLAYER_BG` (naprawione) |

**MASTER bramka pełna:** logic 203 + smoke + battle-smoke (przed kanonem)

---

## 5. Co MASTER ma zrobić

1. **Review Opus** (Grupa C UI — adversarial, diff `battleScene` + `preBattle` + nowy theme)
2. **Build F:** `cd gra` → `npx vite build --outDir $env:TEMP\civ-dist`
3. **Bramka:** `node tools/combat-test.cjs` · logic · smoke · battle-smoke
4. **Promocja kanon:** skopiuj bundle → `Gra-podglad.html` + `gra-robocza/` · md5 checkpoint w DZIENNIK
5. **Maciej playtest** dopiero po kanonie: `Gra-podglad-BITWA.html` **T** → deploy → Start → POMIN

**Nie wymaga decyzji ABC** — wdrożenie zatwierdzonych mockupów + decyzji kolorów.

---

## 6. Batch 2 (lane po kanonie batch 1 — NIE blokuje F)

| ID | Temat | Plik |
|----|-------|------|
| C-09 cmd | Dolny pasek komend — emoji → SVG | `battleScene.ts` cmdBar |
| C-06 v3 | Górny HUD (tura, log, prędkość, minimapa) | `battleScene.ts` topBar |
| C-01 | Pre-bitwa — SVG przyciski (Wycofaj/Ręczna/Auto) | `preBattle.ts` |
| C-12 full | Ekran końca — hero, łupy, „Powrót do mapy” copy | `_showEndScreen` |
| A-08 | Ikony ulepszeń + `buildModeHud.ts` | czeka Design |

---

## 7. Mapowanie ID Design ↔ rejestr lane

| Design nazwa | Rejestr REJEST-UX |
|--------------|-------------------|
| „C09 Karty jednostek” | **C-15 + C-16** (roster + karta TW) |
| „C09” w rejestrze | dolny **pasek komend** — osobny mockup jeszcze nie wdrożony |

---

## 8. DoD handoff

- [x] Kod w `gra/src` · testy combat OK · build OK
- [x] `main.ts` nietknięty
- [x] DZIENNIK + ten plik + UI-DO-MASTERA + UNITS-DO-MASTERA
- [x] MASTER: F + kanon **`032ad48c…`** (2026-07-03 Batch 5)
- [ ] Maciej: playtest po kanonie

**Flaga:** `→ MASTER: GOTOWE`
