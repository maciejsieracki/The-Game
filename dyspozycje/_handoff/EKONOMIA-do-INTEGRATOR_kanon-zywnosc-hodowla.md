# EKONOMIA → INTEGRATOR: FOOD-HODOWLA P2 — status batchu

**Data:** 2026-06-26  
**Batch ID:** **F-FOOD-HODOWLA-01** (częściowy — lane EKONOMIA)  
**Status:** **🟢 GOTOWE MAPA+EKONOMIA** — Integrator może domknąć batch F-FOOD-HODOWLA-01  
**Kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`

---

## Co przesyłam

Lane **EKONOMIA** domknął P2 (plony, JSON, unlock hodowli, testy). **Bez** zmian w `main.ts` / kanonie gry.

| Deliverable | Status |
|-------------|--------|
| `terrain-improvements.json` — bydlo/owce/lama, bez pastwisko | ✅ |
| `resources.json` — uwagi hodowli | ✅ |
| `tileYield` suma warstw + API | ✅ |
| `livestock-unlock.ts` + `resource-access` unlock imperium | ✅ |
| `node tools/food-hodowla-test.cjs` | ✅ 21/21 |
| Handoff SILNIK | ✅ `EKONOMIA-do-SILNIK_kanon-zywnosc-hodowla.md` |
| Handoff MAPA | ✅ `EKONOMIA-do-MAPA_kanon-zywnosc-hodowla.md` |

---

## Co INTEGRATOR ma zrobić (kiedy)

**NIE teraz** — czekaj na **obie** flagi:

1. `→ SILNIK: GOTOWE` z **EKONOMIA** ✅  
2. `→ SILNIK: GOTOWE` z **MAPA** ⬜ (M1–M7 + Panel-A)

Potem sekwencja wg `MASTER-do-SILNIK_kanon-zywnosc-hodowla-integracja.md`:

| Krok | Kto | Co |
|------|-----|-----|
| T1 | **SILNIK** | `hex.ulepszenia[]`, wire budowy, save/load, `getResourceAccess` ownerId |
| T2 | **INTEGRATOR** | build `$TEMP\civ-dist` · bramka 17 suitów · `Gra-podglad-ROBOCZA.html` |
| T3 | **Opus** review → Master → finalna `Gra-podglad.html` |

**Warstwa:** 🟡 cross (`main.ts` + typ Hex + panel surowców + tryb budowy)

---

## Co sprawdzić po wpięciu (checklist Integratora)

- [ ] Postaw farma → irygacja na jednym heksie → panel okolicy **+8** delta ulepszeń (przy rzece)
- [ ] Postaw bydło na złożu → panel surowców pokazuje Bydło w kolejnych miastach
- [ ] Inkowie epoka 1: w panelu budowy brak bydło/owce; lama dostępna
- [ ] Stary save z `ulepszenie=pastwisko` — migracja / alias bez crash
- [ ] `food-hodowla-test.cjs` + `map-improvement-qualify-test.cjs` zielone

---

## Pliki poza scope Integratora (lane już zrobiły)

| Lane | Pliki |
|------|--------|
| EKONOMIA | `economy.ts`, `terrain-improvements.ts`, `turn-economy.ts`, `livestock-unlock.ts`, `resource-access.ts`, `gra/data/*.json` |
| MAPA (czeka) | `improvement-build.ts`, `render/improvements.ts`, `buildModeHud.ts`, `gen-panel-a.py` / Panel-A |
| SILNIK | `main.ts`, `types/hex.ts`, `save.ts` |

---

## Flagi

- **EKONOMIA:** `→ SILNIK: GOTOWE` · wpis `EKONOMIA-DO-MASTERA.md` 2026-06-26  
- **MAPA:** **CZEKA** — dyspozycja `MAPA.md` § P2  
- **INTEGRATOR:** **BLOKADA** do MAPA GOTOWE + batch SILNIK
