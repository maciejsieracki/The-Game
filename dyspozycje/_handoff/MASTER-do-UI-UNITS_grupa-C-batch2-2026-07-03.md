# MASTER → UI + UNITS — Grupa C batch 2 (port Design KOMPLET)

**Status:** **START** · 2026-07-03 · Maciej: A+B+C+D  
**Lane:** UI (`preBattle.ts`) + UNITS/battle (`battleScene.ts`, `battleHudTheme.ts`, nowe moduły)  
**NIE ruszać:** `main.ts`

---

## 1. Źródło Design (7 ekranów)

Indeks: `docs/ux/GRUPA-C-DESIGN-KOMPLET-2026-07-03.md`

| Pri | ID | Mockup | Kod docelowy |
|-----|-----|--------|--------------|
| P0 | C-12 | `C12 Koniec bitwy v2` | `endScreen1E.ts` · `_showEndScreen` |
| P0 | C-04 | `C04 Oblezenie v2` | `siegeHud1E.ts` · faza `siege` |
| P0 | C-05 | `C05 Szturm muru v2` | `siegeHud1E.ts` · faza `storm` |
| P1 | C-06 v3 | `C06 Deployment v3` | top bar 1E w `battleScene.ts` |
| P1 | C-09 cmd | rejestr C-09 | dolny cmd bar → SVG |
| P1 | C-01 | `C01 Pre-bitwa v2` | `preBattle.ts` przyciski SVG |

Kolory: `DECYZJA-C-kolory-stron-bitwa.md` · tokeny `battleHudTheme.ts`

---

## 2. AC (Definition of Done lane)

- [ ] Bitwa oblężnicza (`siegeWallCol >= 0`): HUD jak C-04 (góra Ty VS garnizon, lewy % muru, prawy siły, dół Ostrzał/Czekaj/Szturm) — **wizual 1E**, bez emoji
- [ ] Wyłom bramy / faza szturmu: HUD jak C-05 (punkty szturmu, obrona muru, Drabiny/Wieża/Szturm przez wyłom) — przełączenie fazy gdy `gateOpen` lub integralność < próg
- [ ] Koniec bitwy: pełny C-12 (wieniec, ZWYCIĘSTWO Georgia, 3 karty strat/łupy placeholder, Bohater bitwy placeholder, Szczegóły + **Powrót do mapy**)
- [ ] Cmd bar: SVG zamiast emoji (P, S, R, …)
- [ ] Pre-bitwa: przyciski Wycofaj/Ręczna/Auto — SVG outline 4C
- [ ] Top HUD: ramka 5C, etykiety ATK·Ty / OBR·wróg (kolory batch 1)
- [ ] `node tools/combat-test.cjs` — 6/6
- [ ] `npx vite build --outDir $env:TEMP\civ-dist` — OK
- [ ] Meldunek: `UI-DO-MASTERA.md` + handoff `UI-UNITS-do-MASTER_grupa-C-batch2-2026-07-03.md` · flaga **`→ MASTER: GOTOWE`**

---

## 3. MASTER (tor B — po GOTOWE)

1. Opus review (diff batch 2) — opcjonalny skrót jeśli Maciej pilnuje
2. `gra/tools/bramka-test-publish.ps1`
3. `gra/tools/publish-kanon-snapshot.ps1`
4. DZIENNIK md5 · sync `Gra-podglad-BITWA.html` · `Gra-podglad-OBLEZENIE-BITWA.html`
5. Maciej: Ctrl+F5 playtest

---

## 4. Mapowanie Design C-04/C-05 ↔ lane C-19/C-20

`docs/ux/DESIGN-MAPOWANIE-C04-C05-vs-lane.md`

Stary monospace `siegeHudDiv` — **wycofać** po wdrożeniu `siegeHud1E`.
