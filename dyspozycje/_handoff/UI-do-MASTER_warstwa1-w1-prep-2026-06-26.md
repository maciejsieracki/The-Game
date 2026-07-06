# Handoff — Warstwa 1 Etap W1-PREP (sesja autonomiczna)

> **Od:** Lane UI (Master dispatch) · **Data:** 2026-06-26  
> **Maciej:** offline ~2h · **Design:** czeka pliki w `brand-book-1E/eksport/`

---

## Co zrobiono (bez main.ts)

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/brandTokenVars.ts` | **NOWY** — wspólne tokeny 1B/2C (:root + aliasy scope) |
| `gra/src/ui/icons/iconRegistry.ts` | **NOWY** — rejestr ID Tier 1–2, placeholder SVG + sowa |
| `gra/src/ui/mainMenu.ts` | Tokeny brand · przyciski **4C outline** · font Georgia/Segoe |
| `gra/src/ui/newGameFlow.ts` | Tokeny brand · CTA start **4C outline** |

---

## Czeka na Design (D1)

- `eksport/tokens.css` — podmiana aliasów w `brandTokenVars.ts` (sync script później)
- `eksport/icons/*.svg` — podmiana placeholderów w `iconRegistry.ts`
- E-15b porażka — `main.ts` game over (handoff **Integrator F**)
- Ekrany PO HTML — referencja wizualna do dopracowania CSS

---

## Czeka na Integrator F

| Temat | Plik | Uwagi |
|-------|------|-------|
| Game over wygrana/porażka | `main.ts` `showGameOverOverlay` | kolory `--civ-danger` / złoto |
| Import global CSS (opcjonalnie) | `main.ts` lub index | jeśli HUD też ma tokeny |

---

## DoD W1 (pełny — po Design D1)

- [ ] Menu + kreator = PO z brand-book
- [ ] Zero emoji w E
- [ ] SVG Tier 1 z `eksport/icons/`
- [ ] smoke OK
- [ ] **`przekaż do Mastera`**

---

## Test lane

```bash
cd gra && npx tsc --noEmit
node tools/smoke.cjs
```

Manual: `Gra-podglad.html` → menu → kreator — cieplejsze złoto, outline CTA.

---

*Lane UI · W1-PREP · nie blokuje gameplay lane'ów*
