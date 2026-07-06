# Handoff — Brand Book W1 (Grupa E · Warstwa 1)

> **Od:** Lane UI (Grupa E) · **Data:** 2026-06-26  
> **Trigger Macieja:** `ok. Brand-book wdrażaj. potem przekaż do mastera.`  
> **Decyzje stylu (ZAMKNIĘTE):** 1B, 2C, 3C, 4C, 5C, 6C, 7A, 8A  
> **Design źródło:** `docs/ux/claude-design/01-propozycje-z-design/brand-book/` (Maciej: 34 pliki · ocena „mega”)

---

## Co przesyłam

Wdrożenie **Etap W1** brand book w lane UI — **bez edycji `main.ts`**.

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/brandTokenVars.ts` | Tokeny FROZEN z `icons/brand/tokens.css` (sync PACZKA FINAL) |
| `gra/src/ui/icons/brandAssets.ts` | **NOWY** — manifest SVG, budynki, jednostki, menu CSS |
| `gra/src/ui/icons/brand/` | **NOWY** — ~200 plików (tier1–7, buildings, units, JSON, CSS) |
| `gra/src/ui/mainMenu.ts` | Emblem Design, `motion.css`, tło `menu-background.css` |
| `gra/src/ui/icons/iconRegistry.ts` | Tier 1–2 z manifestu (`brandIconSvg`) |
| `gra/src/ui/cityPanel.ts` | Budynki/jednostki: emoji → SVG (`buildingIconSvg` / `unitIconSvg`) |

---

## Co MASTER ma z tym zrobić

1. **Review + kanon** — po Opus Ask: `npx vite build --outDir $env:TEMP\civ-dist` → bramka testów → `Gra-podglad.html`.
2. **Wpięcie już jest** — `main.ts` importuje `showVictoryScreen` (linia ~7714). Po rebuild kanon odświeży bundle.
3. **Opcjonalnie F** — gdy `brand-book/eksport/tokens.css` + `icons/*.svg` są lokalnie (OneDrive sync): sync do `brandTokenVars.ts` / `iconRegistry.ts` (lane UI batch 2).
4. **HUD W2** — `iconRegistry` nie jest jeszcze podpięty pod `hud.ts` (kolejny batch lane po PO grupy E).

---

## DoD W1 (lane)

- [x] Menu + kreator = tokeny brand + outline 4C
- [x] Zero emoji w kreatorze (E)
- [x] Ekran końca gry = brand tokeny + outline
- [x] `victory-screen-test` 11/11 · `smoke` OK
- [x] SVG Tier 1–2 z `icons/brand/` + manifest PACZKA FINAL
- [x] Menu emblem + motion + tło Design
- [x] cityPanel budynki/jednostki SVG (stela/stolarnia = CSS legacy)
- [x] **`przekaż do Mastera`**

---

## Test lane (wykonane)

```powershell
cd gra
node tools/victory-screen-test.cjs   # 11 passed
node tools/smoke.cjs                 # SMOKE OK
```

Manual po kanonie: menu → kreator → (opcjonalnie) game over — cieplejsze złoto, outline CTA, monogramy zamiast emoji.

---

## Blokery / uwagi

| Temat | Status |
|-------|--------|
| Pliki `brand-book/` w repo | ✅ PACZKA FINAL scalona · assety skopiowane do `gra/src/ui/icons/brand/` |
| Mockupy `01-wejscie/grupa-E/` | Nadal 0/6 PNG — osobny tor Grupy E |
| Tier 3–5 ikony | Defer W2+ |

---

## Pliki obiegu

- Meldunek: `dyspozycje/UI-DO-MASTERA.md`
- Pipeline: `docs/obieg/UI-pipeline-ux.md`
- Slack outbox: `docs/obieg/SLACK-OUTBOX-GRUPA-E-brand-book-w1-2026-06-26.md`

**Flaga:** GOTOWE · **Odbiorca:** MASTER → kanon + kolejka F
