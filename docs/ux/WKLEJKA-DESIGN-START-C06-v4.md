# Wklejka — START C-06 v4 (mapa bitwy · sync kanon)

**Status:** ⏸ **HOLD** · 2026-07-03 — Maciej: bitwa za dużo się zmieniła · Design **później**  
**Kanon gry:** md5 `153fcda2f71e1e9ab3a538d8b9c10f9e` (pre-bitwa OK · deployment NIE)

---

## WKLEJ DO DESIGNERA (cały blok)

```
START — C06-v4-map-redesign

Kontekst: C-06 Deployment v3 jest NIEAKTUALNY względem kanonu (Master + Maciej domknęli UX walki).
Potrzebny NOWY mockup v4 — sync z grą, nie od zera.

📖 Brief (czytaj w całości):
   docs/ux/DESIGN-BRIEF-C06-v4-map-redesign.md

📎 Handoff:
   dyspozycje/_handoff/UI-do-DESIGN_C06-v4-map-redesign-2026-07-03.md

🎮 Jak wygląda gra DZIŚ (kanon):
   gra-kanon/START.html → nowa gra → klawisz T → pre-bitwa v3 → „Rozegraj ręcznie”
   (albo Gra-podglad-POLE-BITWY.html — Ctrl+F5)

📁 Archiwum (NIE edytuj):
   The Game - C06 Deployment v3 (1E).dc.html

✅ Deliverable:
   NOWY plik: The Game - C06 Deployment v4 (1E).dc.html
   (folder docs/ux/claude-design/)

🔴 OBOWIĄZKOWE w v4 (sync z kodem):
   • Strefa gry ~50% środka mapy + złota obwódka granicy walki
   • Belki morale PEŁNA wysokość: lewa niebieska (TY) · prawa czerwona (WRÓG)
   • Numery grup (1,2,3…) + złote ramki na jednostkach na mapie
   • Dolny dock roster (3 rzędy) + pasek: 1/2/3 · Konnica/Piechota/Łucznicy · Wszystkie
   • Linia podziału: niebieska po lewej / czerwona po prawej (przy granicy)
   • Panel F1–F3 + Reset/Grupuj/Start walki — jak v3, styl 1E, SVG bez emoji
   • Górny HUD + dolny pasek komend SVG — jak v3

Referencje stylu:
   • C01 Pre-bitwa v3 (1E).dc.html
   • C09 Karty jednostek v2 (1E).dc.html
   • Kolory Ty #3a6ad0 · wróg #c84040

🟡 ZMIANY MACIEJA (dopisz poniżej przed wysłaniem, jeśli coś jeszcze):
   [Maciej: tu lista wizualnych poprawek ponad sync — np. layout rosteru, rozmiar minimapy, hint WASD…]

Po gotowości: „C-06 v4 gotowy” + ścieżka do .dc.html
```

---

## Maciej — przed wysłaniem

Uzupełnij sekcję **ZMIANY MACIEJA** w bloku powyżej (konkretne uwagi wizualne).  
Opcjonalnie: 2–3 screenshoty z kanonu → `docs/ux/referencje-c06-kanon/`
