# Audyt: mockupy Design vs gra ROBOCZA

**Data:** 2026-07-05 · **Lane UI** · bundel `05b74463`  
**Kanał do Design:** `docs/ux/claude-design/WYMIANA-UI-DESIGN.md`  
**Maciej przepycha:** wklejki `docs/ux/WKLEJKA-DESIGN-*.md`

---

## 1. Co JEST w grze (ROBOCZA, kod `gra/src/`)

| Obszar | Mockup referencyjny | W grze | % |
|--------|---------------------|--------|---|
| Menu + kreator | brand-book E-01… | ✅ | ~90 |
| HUD mapy D1B | `HUD Mapy layout (1E)` | ✅ layout, minimapa klik | ~85 |
| Panel imperium slide-in | częściowy | ✅ tabela, bez `/t` nagłówki | ~70 |
| Miasto W3 shell | `Ekran Miasto W3` | ✅ 9 rail, dim, wiki | ~80 |
| Handel | `W4 v2` | ✅ karty SVG + suwaki | ~85 |
| Spichlerz / Zamożność | `W4 v2` | ✅ suwak W4 | ~80 |
| Porządek | `W4 v2` | 🟡 banner W4, reszta stara | ~60 |
| Praca | `W4 v2` | 🟡 pasek+suwak, bez pełnego layoutu | ~65 |
| Buduj / produkcja | W3+W4 | 🟡 ikony SVG, stary layout kart | ~55 |
| Rekrutacja | W3 | 🟡 działa, bez polish W4 | ~50 |
| Zdrowie / Kultura / Religia | W3/W4 | 🟡 chipy SVG, layout stary | ~50 |
| Okolica 3D | B-26 | ✅ W badge, litery terenu | ~75 |
| Dyplomacja | 1E reskin | ✅ kanon | ~90 |
| C-04/C-05/A-19 | v2 mockupy | ✅ kanon | ~85 |
| POLE-BITWY HUD | v4.1 | 🟡 deploy/roster/strategia częściowo | ~65 |
| Popupy deploy | v5 handoff | 🟡 logika OK, SVG v5 nie w 100% | ~70 |
| **Ikony budynków 35×** | `Budynki infografiki 2026-07-05` | ✅ mapa 1:1 w `building-icon-map.json` | **A=100%** |
| **Karty infografiki budynków (Poziom B)** | ten sam mockup | ❌ **NIE** — lista tekstowa | **0%** |
| Panel Moc | brief MASTER | ❌ stary `powerOverlayHud` | ~20 |
| Nauka hub/drzewko | — | ❌ HOLD | 0 |
| A-06 panel jednostki | szkic | 🟡 kod, brak mockupu final | ~40 |

---

## 2. Co DESIGNER już dostarczył (pliki w repo — GOTOWE do wdrożenia)

| Paczka | Pliki | Handoff | Status lane UI |
|--------|-------|---------|----------------|
| **Budynki 35 ikon** | `bld-*.svg` + `building-icon-map.json` + `.dc.html` | `DESIGN-do-UI_BUDYNKI-INFOGRAFIKI.md` | ✅ ikony w grze · ❌ **Poziom B kart** |
| **Popupy deploy v5** | `Popupy deploy v5 2026-07-05.dc.html` | `HANDOFF-Cursor-Popupy-Deploy-v5.md` | 🟡 **częściowo** w `battleScene.ts` |
| **POLE-BITWY v4.1** | C06 Deploy v4, C09 Roster v4, Strategia v4, C12 v2 | `DESIGN-do-UI_POLE-BITWY-poprawki-v4.1.md` | 🟡 w bundlu POLE-BITWY |
| **W3 miasto 9/9** | 3× `.dc.html` W3 | DYSPOZYCJA § W3 | ✅ shell · 🟡 polish W4 |
| **W4 zakładki v2** | `Miasto Zakładki W4 v2 (1E).dc.html` | `MASTER-do-UI_w3-w4-port` | 🟡 ~50% zakładek |
| **HUD szata sync** | HUD Mapy + Panele stany | szata-sync handoff | ✅ |
| **C04/C05/A19 v2** | 3 mockupy | `DESIGN-do-UI_C04-C05-A19-v2.md` | ✅ kanon |
| **Dyplomacja 1E** | brand-book | dyploUiSkin | ✅ kanon |

---

## 3. Co DESIGNER zrobił — a lane UI **NIE wpiął** (wina implementacji, nie Design)

| Deliverable | Co brakuje w kodzie | Plik docelowy | Priorytet |
|-------------|---------------------|---------------|-----------|
| Poziom B kart budynków (~280px, bonusy, epoka) | Katalog = lista tekstowa | `cityPanel.ts` appendBudowa | **P0** |
| W4 pełne 7 zakładek | Rekrutacja, Zdrowie, Kultura, Religia, Buduj layout | `cityPanel.ts` CSS/HTML | **P0** |
| Popupy v5 SVG (Konnica Z boku/Z tyłu, Linie „Dystansowe”) | Stare ikony w popupach | `battleScene.ts` FMT_SVG | **P1** |
| Chipy górne 6C + raporty per miasto (Skarbiec/Praca…) | Klik → stary flow / brak tabel | `empireDetailPanel.ts`, `hud.ts` | **P0** (czeka mockup Moc) |

**Lane UI bierze winę:** paczki leżą w `docs/ux/claude-design/` — kod nie nadążył, nie brak plików od Design.

---

## 4. Czego **POTRZEBUJEMY OD DESIGNERA** (Maciej — przepchnij START)

Kolejność = blokery playtestu Macieja.

### P0 — bez tego nie zamykamy toru

| ID | START Design | Plik deliverable | Dlaczego |
|----|--------------|------------------|----------|
| **IMP-01** | Panel Moc + raporty zasobów 6C | `The Game - Panel Moc imperium v1 (1E).dc.html` | Brief: `MASTER-do-UI_panel-moc-i-imperium.md` · D16 ABC |
| **PB-v5-01** | C-23 Szczegóły bitwy | `C23 Szczegoly bitwy v1 2026-07-05 (1E).dc.html` | Maciej odrzucił provizorkę Cursor |
| **PB-v5-02** | C-12 Koniec bitwy v3 | `C12 Koniec bitwy v3 (1E).dc.html` | v2 za stary vs reszta v5 |
| **BUD-B** | Karty Poziom B (3 przykłady w mockupie) | już w `Budynki infografiki kanon v1` — **potwierdź final** | Lane portuje layout do `cityPanel.ts` |

Spec pełna POLE-BITWY gap: `DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md`

### P1 — kolejka po P0

| ID | START | Deliverable |
|----|-------|-------------|
| **W1b** | `START — W1b` | 15× `civ-*.svg` + `civ-icon-map.json` (DYSPOZYCJA backlog) |
| **A-06** | Panel jednostki final 1E | mockup po werdykcie Macieja (PNG review istnieje) |
| **A-27** | Modal dyplomacji blocking | brak mockupu |
| **A-10** | Panel armii | brak mockupu |
| **NAU-01** | Hub nauki + drzewko | **HOLD** do review Macieja |

### P2 — opcjonalnie

| PB-v5-03…10 | Osobne popupy Formacja/Konnica/Linie/Taktyka v1 | v5 zbiorczy jest — **wystarczy jeśli SVG w HANDOFF = final** |
| **A-08** | Build menu SVG | `UI-do-DESIGN_A08-START-2026-07-03.md` |

---

## 5. Wklejka dla Macieja → Design (najpilniejsze)

```
START — IMP-01 + PB-v5-01/02 (P0)

Czytam: docs/ux/UI-AUDIT-MOCKUP-vs-GRA-2026-07-05.md §4
Spec Moc: dyspozycje/_handoff/MASTER-do-UI_panel-moc-i-imperium.md
Spec POLE-BITWY: docs/ux/DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md

Deliverables:
1. The Game - Panel Moc imperium v1 2026-07-05 (1E).dc.html
2. The Game - C23 Szczegoly bitwy v1 2026-07-05 (1E).dc.html
3. The Game - C12 Koniec bitwy v3 2026-07-05 (1E).dc.html
+ DESIGN-do-UI_*.md + push docs/ux/claude-design/

Lane UI portuje w ciągu 24h po zipie.
```

---

## 6. Co lane UI robi **natychmiast** (bez czekania na Design)

1. **Poziom B kart budynków** z istniejącego mockupu `Budynki infografiki kanon v1`
2. **Reszta W4** z `Miasto Zakładki W4 v2` (Rekrutacja, Zdrowie, Kultura, Religia, Buduj)
3. **Popupy v5 SVG** z `HANDOFF-Cursor-Popupy-Deploy-v5.md` → `battleScene.ts`
4. Publish ROBOCZA + meldunek `UI-DO-MASTERA.md`

---

**→ MASTER:** audyt gotowy · lane UI implementuje §6 · Design P0 §4 via Maciej
