# WKLEJKA B — do Cursora (lane UNITS · P1)

Skopiuj blok poniżej (między ```) do czatu Cursor (Composer, lane UNITS).

---

```
═══════════════════════════════════════
The Game · LANE UNITS · Popupy Deploy v5 · P1
Od: Maciej / MASTER · 2026-07-05
═══════════════════════════════════════

REPO: https://github.com/maciejsieracki/The-Game
git pull origin main

Handoff Design:
  docs/ux/claude-design/HANDOFF-Cursor-Popupy-Deploy-v5.md
Dyspozycja MASTER:
  dyspozycje/_handoff/MASTER-do-UNITS_deploy-popups-v5-P1.md

PLIKI (TYLKO):
  gra/src/battle/battleScene.ts
  gra/src/battle/battleHudTheme.ts
NIE RUSZAJ: main.ts · logika formacji/konnicy/doktryn/strategii

TEST (bundel HTML stary — użyj dev):
  cd gra && npm run dev
  → playtest POLE-BITWY → faza deploy → toolbar dolny
  Otwórz: Formacja · Konnica · Linie · Taktyka

───────────────────────────────────────
JUŻ ZROBIONE — NIE DUPLIKUJ (commit afe2220)
───────────────────────────────────────
✅ Konnica popup: SVG flanka + okrążenie + wiersze z podpisem
✅ Linie: „Dystansowe” · domyślnie 3 linie · celownik w nagłówku
✅ Formacja: ikona + tytuł + podpis · F3 „Machiny na skrzydłach”
✅ Taktyka: siatka 2×2 + ikony (tymczasowe DEPLOY_TACTIC_SVG)
✅ paintDeployPopupOption · tło .08 · ramka 2px
✅ Szerokości popup: 220/220/240/300 px · chip D:

───────────────────────────────────────
TWOJE ZADANIA (P1)
───────────────────────────────────────

1) IKONA HEŁMU na przycisku toolbara „Konnica” — ✅ READY
   Handoff GAP-04 · sekcja „Ikona HEŁMU” (linie 55–64)
   git pull → docs/ux/claude-design/HANDOFF-Cursor-Popupy-Deploy-v5.md
   battleHudTheme.ts + _makeDeployToolbarDropdown('Konnica', …)

2) PODMIANA SVG po push Design (watch repo) — ⏳ czeka sekcja „SVG KANON — KOD” + mockup HTML v5
   battleHudTheme.ts:
   · DEPLOY_TACTIC_SVG → kanon z Design
   · FMT_SVG f1/f2/f3 jeśli Design poda nowe wersje

3) PIXEL-PERFECT gdy mockup trafi na GitHub:
   The Game - Popupy deploy v5 2026-07-05 (1E).dc.html
   → padding, gap, hover, typografia wierszy

4) SPÓJNOŚĆ deploy + walka R (manual)
   Popup Taktyka identyczny po SPACJA→RĘCZNY
   (_renderDeployTacticsPopup gdy !deployPhase && started)

───────────────────────────────────────
DoD
───────────────────────────────────────
□ Konnica toolbar: hełm z handoff (GAP-04 · linie 55–64)
□ 4 popupy spójne wizualnie (bez regresji logiki)
□ npx tsc --noEmit w gra/ — OK
□ Meldunek append: dyspozycje/UNITS-DO-MASTERA.md + screenshoty

Po zakończeniu: krótki raport co zrobione / co czeka na Design.
```
