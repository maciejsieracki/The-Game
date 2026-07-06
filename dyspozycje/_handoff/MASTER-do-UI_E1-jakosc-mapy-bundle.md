# MASTER → UI (Grupa E): E1 — jeden suwak „Jakość mapy”

**Data:** 2026-06-29  
**Decyzja:** `docs/decyzje/E1-jakosc-mapy-bundle.md`  
**Spec:** `docs/grupa-e/SPEC-jakosc-render-i-mapa.md` §13  
**Status:** **→ INTEGRATOR: GOTOWE** (2026-06-29 · lane UI)  
**Flaga:** **→ INTEGRATOR: GOTOWE**

---

## Co przesyłam

Maciej zamknął E1: **jeden preset** Niska/Średnia/Wysoka — gracz nie kombinuje GPU vs dekoracje osobno.

Kontrakt bundla (już w repo):

```typescript
import { bundledMapQualityFromLabel } from '../map/newGameMapDefaults';
const bundle = bundledMapQualityFromLabel(mapQualityLabel);
// bundle.renderQuality + bundle.mapDetailQuality — oba = ten sam tier
```

---

## Co UI ma zrobić

| AC | Kryterium |
|----|-----------|
| AC-1 | Krok 4: **tylko** karta `map_quality` (Niska/Średnia/Wysoka) — bez sekcji „Wygląd świata” z dwoma suwakami |
| AC-2 | **Usunąć** `render_quality` z modala zaawansowanych (seed, barbarzyńcy, bitwy, mgła, zwycięstwo — zostają) |
| AC-3 | `buildParams()`: `renderQuality` i `mapDetailQuality` z `bundledMapQualityFromLabel(mapQualityLabel)` — **nie** osobne pola |
| AC-4 | Stopka kroku 4: tekst typu *„Jakość mapy ustawia wygląd i wydajność. Las i surowce na mapie są takie same przy każdej jakości.”* — **bez** „wkrótce / czeka silnik” |
| AC-5 | Podsumowanie krok 5: jedna linia „Jakość mapy: Średnia” |
| AC-6 | `ui-params.json`: usunąć lub ukryć `render_quality` i `map_detail` z `nowa_gra.ustawienia` (gracz ich nie widzi) |
| AC-7 | Podpowiedź przy Duży/Ogromny + Wysoka: żółty hint FPS (zostaje) |

---

## Pliki (lane UI only)

- `gra/src/ui/newGameFlow.ts`
- `gra/data/ui-params.json`
- opcjonalnie `UI/Makieta-flow-nowa-gra.html` (sync stopki)

**NIE ruszać:** `main.ts`, `scene.ts`, `generator.ts`

---

## DoD

- [x] AC-1–AC-7
- [x] Meldunek append `UI-DO-MASTERA.md`
- [x] Handoff → SILNIK: `UI-do-SILNIK_E1-jakosc-bundle-params.md`

**Po GOTOWE:** INTEGRATOR czeka na MAPA (fix lasu) + SILNIK (wpięcie bundle).
