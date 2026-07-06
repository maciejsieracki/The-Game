# UI — raport do przodu (2026-07-05)

**Reguła:** tylko to, czego **jeszcze nie ma w grze**. Wpięte pomijamy.  
**Źródło:** `UI-INVENTORY-DESIGN-vs-GRA.md` §B + §C

---

## A. Mam materiał od Designera → lane UI **może jeszcze wpiąć**

1. **W4 rekrutacja + wnętrza zakładek** (Zdrowie, Kultura, Religia, Porządek) — mockup `Miasto Zakładki W4 v2 (1E).dc.html` · kod: `cityPanel.ts` (rekrutacja = stary layout).

2. **Karty jednostek C09 v2** — mockup `C09 Karty jednostek v2 (1E).dc.html` · kod: rekrutacja lista tekstowa.

3. **Popupy deploy v5** (Formacja, Konnica, Linie, Taktyka) — mockup + `HANDOFF-Cursor-Popupy-Deploy-v5.md` · kod: ~70% w `battleHudTheme.ts` / `battleScene.ts`.

4. **POLE-BITWY v4.1** — mockupy: Strategia v4, Roster lewy v4, Deployment v4 · handoff `DESIGN-do-UI_POLE-BITWY-poprawki-v4.1.md` · kod: częściowo.

5. **Ikony ulepszeń `imp-*` (10 SVG)** — paczka FINAL w `brand-book/eksport/icons/improvements/` · kod: `buildModeHud.ts` nadal emoji *(layout panelu bez mockupu A-08 — tylko podmiana ikon możliwa)*.

6. **Koniec bitwy C12 v2** — mockup `C12 Koniec bitwy v2 (1E).dc.html` · kod: provizorka `endScreen1E.ts` *(Design chce v3 — v2 da się dopolerować tymczasowo)*.

7. **Jednostki infografiki** — `jednostki-infografiki-1E.html` *(bez formalnego DESIGN-do-UI — ryzyko, ale materiał jest)*.

---

## B. **Nie mam** materiału od Designera → **Design musi zrobić** (lane czeka)

1. **Panel budowy mapy A-08** — pełny mockup 1E + brakujące `imp-*` (~6–8) + `improvement-icon-map.json` · brief: `DESIGN-BRIEF-A08` · START: `WKLEJKA-DESIGN-P0-HEX-A08-MACIEJ-2026-07-05.md`.

2. **Panel heksu HEX-C1** — mockup klatki C1 · brief: `DESIGN-ZLECENIE-HEX-CONTEXT-PANEL-2026-07-05.md` · j.w. wklejka.

3. **Panel Moc imperium + raporty 6C** — zero mockupu · brief: `MASTER-do-UI_panel-moc-i-imperium.md` · wklejka P0 IMP-MOC/C23.

4. **C23 Szczegóły bitwy v1** — zero `.dc.html` · spec: `DESIGN-ZLECENIE-POLE-BITWY-v5-GAP-2026-07-05.md`.

5. **C12 Koniec bitwy v3** — w repo tylko **v2** · Design ma dostarczyć v3 zgodnie z gap v5.

6. **Hub nauki + drzewko** — HOLD Macieja · brak mockupu final.

7. **Panel jednostki A-06, panel armii A-10, modal dyplo A-27, panel Wiki boczny** — brak mockupów final *(jest tylko `ui-wiki.svg`)*.

8. **`menu-button-map.json`** — backlog WYMIANA · Design nie dostarczył.

---

**Master:** sekcja A = kolejne dyspozycje lane UI · sekcja B = START u Design (pliki w `docs/ux/WKLEJKA-DESIGN-*.md`).
