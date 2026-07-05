# MASTER → UNITS · Popupy Deploy v5 — P2 (chipy ikon)

**Decyzja Maciej:** **B** — chipy 34×34 przed kanonem (2026-07-05)  
**Mockup:** `docs/ux/claude-design/The Game - Popupy deploy v5 2026-07-05 (1E).dc.html` (Formacja + Konnica wiersze)  
**Pliki (TYLKO):** `gra/src/battle/battleHudTheme.ts` · ewent. import w `battleScene.ts` — **NIE** `main.ts`

---

## AC

W `buildDeployPopupRowHtml` (Formacja + Konnica): ikona w chipie **34×34**:
- `border-radius: 8px`
- `background: radial-gradient(circle at 38% 30%, #1a2230, #0a0d14)`
- `border: 1px solid #a08030`
- flex center, kolor ikony `#e8d88a`

**NIE dotykaj:** Taktyka 2×2 (ikony wyśrodkowane bez kafla) · Linie (nagłówki inline + chipy numerów już 34×34)

---

## DoD

- [ ] Formacja 3 wiersze + Konnica 2 wiersze — chip jak mockup
- [ ] `npx tsc --noEmit` — bez nowych błędów w battle/
- [ ] Meldunek append `UNITS-DO-MASTERA.md`

---

*MASTER · 2026-07-05 · po decyzji B*
