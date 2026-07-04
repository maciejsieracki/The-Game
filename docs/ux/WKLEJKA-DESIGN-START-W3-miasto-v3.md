# Wklejka — START W3 miasto v3 · HUD (sync kanon)

**Status:** 🟢 **START Design** · 2026-07-03  
**Kanon gry:** md5 `153fcda2f71e1e9ab3a538d8b9c10f9e`

---

## WKLEJ DO DESIGNERA (cały blok)

```
START — W3-miasto-v3-delta

Kontekst: Kod miasta w kanonie = ŹRÓDŁO PRAWDY. Stare mockupy (9 rail, brak Mapa/Esc, okolica tylko w panelu) są NIEAKTUALNE.
Potrzebny NOWY pełny ekran W3 v3 — HUD miasta jak w grze DZIŚ + polish 1E.

📖 Brief (czytaj w całości):
   docs/ux/DESIGN-BRIEF-W3-miasto-v3-HUD.md

📎 Handoff:
   dyspozycje/_handoff/UI-do-DESIGN_W3-miasto-v3-delta-2026-07-03.md

📎 Delta techniczna:
   dyspozycje/_handoff/MASTER-do-UI-DESIGN_miasto-baseline-2026-07-03.md

🎮 Playtest OBOWIĄZKOWY przed rysowaniem:
   gra-kanon/START.html → Ctrl+F5 → nowa gra → klik MIASTO
   Przejdź: Budowa · Spichlerz · Mapa · Wróć na mapę · toolbar okolica · Esc

📁 Screenshoty (opcjonalnie — jeśli są):
   docs/ux/referencje-miasto-kanon-2026-07-03/
   (pusty folder = OK, playtest wystarczy)

📁 Referencja polish paneli (NIE edytuj jako deliverable):
   The Game - Miasto Zakładki W4 v2 (1E).dc.html

📁 Archiwum (NIE edytuj):
   The Game - Ekran Miasto W3 (1E).dc.html  ← 9 rail, NIEAKTUALNY
   brand-book/START-W3-miasto-1E.md

✅ Deliverable:
   NOWY: The Game - Ekran Miasto W3 v3 (1E).dc.html
   (folder docs/ux/claude-design/)
   Min. 4 klatki 1920×1080 w jednym pliku:
   K1 panel Budowa · K2 Spichlerz · K3 mapa chrome (Wróć + okolica) · K4 po Esc

🔴 OBOWIĄZKOWE w v3:
   • Layout 2 rail LEWO (Budowa, Rekrutacja) + 7 rail PRAWO (Spichlerz…Religia)
   • Mapa 3D WIDOCZNA (winieta, nie pełna czarna zasłona)
   • Stopka panelu: przycisk MAPA + hint Esc
   • Na mapie: WRÓĆ NA MAPĘ (środek-dół) + tabliczka miasta
   • Toolbar okolica centrum-dół na mapie 3D
   • Panel Spichlerz/Handel: chipy W4 bez /t · ikony Bydło/Glina/Koń/Sól (SVG brand)
   • Zero emoji · styl 1E · ikony z brand-book

🟡 POPRAWKI MACIEJA (dopisz przed wysłaniem, jeśli coś wizualnie):
   [Maciej: np. większy przycisk Wróć · kolor winiety · odstępy rail 46px…]

Po gotowości: „W3 v3 gotowy” + ścieżka .dc.html + DESIGN-do-UI_miasto-w3-v3.md
```

---

## Maciej — przed wysłaniem

1. **Opcjonalnie (5 min):** Ctrl+F5 `gra-kanon/START.html` → miasto → 2–3 screenshoty do `referencje-miasto-kanon-2026-07-03/` (lista w README) — **nie blokuje** Designera
2. Uzupełnij sekcję **POPRAWKI MACIEJA** jeśli masz konkretne uwagi wizualne ponad sync
3. **Nie mieszaj** z C-06 (bitwa) — osobna wklejka jeśli Designer robi mapę bitwy

---

## Po deliverable Designera

| Kto | Co |
|-----|-----|
| **Maciej** | Playtest mockup vs kanon · OK / poprawki ABC |
| **Lane UI** | Ewentualny CSS polish · **bez** logiki · meldunek `UI-DO-MASTERA.md` |
| **MASTER** | Kanon miasta — tylko po Twoim OK + Opus (bitwa osobno) |
