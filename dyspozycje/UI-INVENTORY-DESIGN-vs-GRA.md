# UI — inwentarz Design vs gra (JEDYNE ŹRÓDŁO · nie skanuj od zera)

**Ostatnia aktualizacja:** 2026-07-05 ~23:20  
**Kto utrzymuje:** Lane UI — **append-only**, max 1 wiersz/sekcja przy zmianie  
**Reguła:** agent **czyta ten plik**, nie robi grep po całym repo „co Design dostarczył"

---

## Legenda

| Symbol | Znaczenie |
|--------|-----------|
| ✅ | W grze (bundel ROBOCZA `703e6212` lub POLE-BITWY osobno) |
| 🟡 | Częściowo w kodzie / bundlu |
| ❌ | Design dał · **nie w grze** |
| ⏳ | Brief/wklejka · **Design nie dostarczył mockupu** |
| 🔧 | Kod w `gra/src/` gotowy · **Master jeszcze nie zmergował do kanonu** |

**Build mapa:**
- Mapa/miasto: `gra-robocza/Gra-ROBOCZA.html` · stamp `703e6212`
- Kanon mapa: `gra-kanon/Gra-KANON.html` · stamp `a001606c` (**starszy** — bez kart Poziom B)
- Pole bitwy 3D: `gra-robocza/Gra-ROBOCZA-POLE-BITWY.html` · **osobny** build `vite.oblezenie-bitwa.config.ts`
- Hub: `gra-robocza/START.html`

**Kod bitwy:** `gra/src/battle/*` + entry `gra/src/oblezenie/main.ts` — **NIE** mockupy `.dc.html`

---

## A. Design dostarczył → ✅ w grze

| ID | Deliverable | Handoff / plik Design | Kod |
|----|-------------|----------------------|-----|
| BB-FINAL | Brand-book PACZKA FINAL (menu, tokeny, tier1–2 HUD) | `brand-book/eksport/` | `brandAssets.ts`, `mainMenu.ts`, `hud.ts` |
| W1b | 15× `civ-*.svg` + mapa | `civ-icon-map.json` | `icons/brand/civilizations/`, `newGameFlow.ts` |
| BLD-35 | 35× `bld-*.svg` + mapa | `DESIGN-do-UI_BUDYNKI-INFOGRAFIKI.md` | `building-icon-map.json`, miniatury w `cityPanel.ts` |
| W3 | Shell miasta 9 rail + dim | 3× `Ekran Miasto W3*.dc.html` | `cityPanel.ts`, `cityUxFrame.ts` |
| W4-H | Handel (karty SVG, suwaki) | `Miasto Zakładki W4 v2` | `renderHandelSlidersPanel` |
| W4-S | Spichlerz / Zamożność | j.w. | `renderMagazyn` |
| C04-C05-A19 | Oblężenie mapa (3 modale) | `DESIGN-do-UI_C04-C05-A19-v2.md` | `cityAttackChoice.ts`, `siegeMapPanel.ts`, `cityCaptureNotice.ts` |
| DYPLO | Dyplomacja 1E reskin | brand-book | `diplomacyPanel.ts` |
| IMP-10 | 10× `imp-*.svg` (PACZKA FINAL) | `brand-book/eksport/icons/improvements/` | pliki w `gra/src` **SVG tak · panel budowy NIE** → patrz B |

---

## B. Design dostarczył → ❌ / 🟡 nie w grze (kolejka Mastera)

| ID | Co Design dał | Gdzie leży | Gap | Priorytet |
|----|---------------|------------|-----|-----------|
| BLD-B | Karty budynków Poziom B | mockup w `Budynki infografiki kanon v1` | 🔧 `buildBuildingInfocard()` w `cityPanel.ts` · ✅ ROBOCZA · ❌ KANON | P0 |
| W4-REST | W4 v2 wnętrze 7 zakładek | `Miasto Zakładki W4 v2 (1E).dc.html` | Ramka W4 na 6 zakładkach · **Rekrutacja** stary layout · wnętrza Zdrowie/Kultura/Religia/Porządek ≠ mockup | P0 |
| C09-UNIT | Karty jednostek v2 | `C09 Karty jednostek v2 (1E).dc.html` | Rekrutacja = lista tekstowa | P1 |
| IMP-UI | imp-* w panelu budowy mapy | SVG gotowe (10 szt.) | `buildModeHud.ts` = **emoji** · brak `improvement-icon-map.json` · brak mockupu panelu A-08 | P0 |
| PB-v5-POP | Popupy deploy v5 | `Popupy deploy v5` + `HANDOFF-Cursor-Popupy-Deploy-v5.md` | 🟡 `battleHudTheme.ts` / `battleScene.ts` ~70% | P1 |
| PB-v4.1-STR | Popup Strategia v4 | `C06 Popup Strategia v4` | 🟡 skin ≠ mockup (dropdown, scroll, medaliony) | P1 |
| PB-v4.1-ROS | Roster lewy v4 | `C09 Roster lewy panel v4` | 🟡 „Grupa 1·20", puste sloty | P1 |
| PB-v4.1-DEP | Deployment top-bar v4 | `C06 Deployment v4` | 🟡 gap/separatory VS | P2 |
| C12-v2 | Koniec bitwy v2 mockup | `C12 Koniec bitwy v2` | 🟡 `endScreen1E.ts` provizorka lane · Design chce **v3** | P1 |
| C23 | — | **brak mockupu** | 🟡 `endDetails1E.ts` provizorka | ⏳ czeka Design |
| MENU-MAP | menu-button-map.json | backlog WYMIANA | nie dostarczone przez Design | P2 |
| JED-INF | jednostki-infografiki | `jednostki-infografiki-1E.html` (bez handoff) | nieportowane | P2 |

---

## C. ⏳ Brief tylko — Design NIE dostarczył

| ID | Temat | Brief / wklejka | Status Design |
|----|-------|-----------------|---------------|
| A-08 | Panel budowy mapy + brakujące imp (~6–8) | `DESIGN-BRIEF-A08`, `WKLEJKA-START-A08` | ⏳ zero `.dc.html` |
| HEX-C1 | Panel heksu kontekst | `DESIGN-ZLECENIE-HEX-CONTEXT-PANEL` | ⏳ zero `.dc.html` |
| IMP-MOC | Panel Moc imperium 6C | `MASTER-do-UI_panel-moc-i-imperium.md` | ⏳ zero mockupu |
| C23-v1 | Szczegóły bitwy | `WKLEJKA-P0-IMP-MOC-C23` | ⏳ zero mockupu |
| C12-v3 | Koniec bitwy v3 | wklejka v5 gap | ⏳ w repo tylko v2 |
| NAU-01 | Hub nauki + drzewko | HOLD Macieja | ⏳ |
| A-06 | Panel jednostki final | PNG review | ⏳ |
| A-10 | Panel armii | — | ⏳ |
| A-27 | Modal dyplomacji blocking | — | ⏳ |
| WIKI-P | Panel Wiki boczny | `ui-wiki.svg` jest · panel nie | ⏳ |

**START u Design (2026-07-05):** `WKLEJKA-DESIGN-P0-HEX-A08-MACIEJ-2026-07-05.md` · wpis w `WYMIANA-UI-DESIGN.md` queue

---

## D. Gdzie testować (nie pytaj ponownie)

| Co testujesz | Plik | NIE używaj |
|--------------|------|------------|
| Mapa + miasto + HUD | `gra-robocza/Gra-ROBOCZA.html` Ctrl+F5 | `.dc.html` Design |
| Pole bitwy 3D / deploy / Strategia | `gra-robocza/Gra-ROBOCZA-POLE-BITWY.html` Ctrl+F5 | `Gra-ROBOCZA.html` (to mapa) |
| Atak z mapy (pełna gra) | `Gra-ROBOCZA-PLAYTEST-WALKA.html` | ≠ standalone POLE-BITWY |
| Wireframe przed Design v4 | `docs/ux/export/C-POLE-BITWY-review-*.html` | to nie gra |

**Marker bitwy:** `title` nagłówka rosteru = `BATTLE_UI_BUILD` z `battleScene.ts`

---

## E. Log zmian (append-only)

| Data | Zmiana |
|------|--------|
| 2026-07-05 | A1 lane: W4 rekrutacja (karta + chipy + kolejka) + wnętrza Porządek/Zdrowie/Kultura/Religia → `cityPanel.ts` |
| 2026-07-05 | Utworzenie pliku · zamknięcie audytu po 3× skanowaniu — **od teraz czytaj §A–C zamiast grep** |
| 2026-07-05 | Handoff publish ROBOCZA → `UI-do-MASTER_publish-robocza-2026-07-05.md` |

---

**→ MASTER:** port z §B · **→ Design:** §C · **→ Lane UI:** aktualizuj ten plik 1 linijką po każdym deliverable/portcie
