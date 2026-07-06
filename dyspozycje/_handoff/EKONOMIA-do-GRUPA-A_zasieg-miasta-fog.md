# EKONOMIA → Grupa A (MAPA świata) — zasięg miasta + mgła

| Pole | Wartość |
|------|---------|
| **Status** | **→ Grupa A: GOTOWE** → SILNIK |
| **Decyzja Macieja** | Spec 2026-06-27 — `docs/decyzje/B-zasieg-miasta-fog.md` |
| **Nie blokuje** | A-START-01…05, B2-Q5 hex 🔥, D1B batch |

---

## Co przekazujemy

Maciej ustalił: **miasto bez jednostek** i tak **odświeża mgłę** — zasięg = **okolica robocza (pop, min 5, cap 15) + pierścienie kultury (+0…+3)**.

| Populacja | Zasięg okolicy |
|-----------|----------------|
| 1–4 | **5** |
| 9 | **9** |
| 15+ | **15** (cap) |

**Kultura:** addytywnie +0…+3 pierścienie (nie zastępuje pop — jak `MIASTO/Zasieg-miasta-okolica.html`).

**Jednostki:** osobny stały zasięg (propozycja **10** heksów) — nie mylić z miastem.

**Posterunek / fort:** widok jak terytorium struktury (+5 / +10).

---

## Wasze pliki (MAPA lane)

| Temat | Plik | Akcja |
|-------|------|--------|
| Formuła terytorium | `gra/src/map/territory.ts` | Po fix EKONOMIA — `cityRangeForPopulation` import z `okolica.ts` |
| Render fog 3D | `gra/src/render/scene.ts` | 3 stany: unknown / explored / visible (Maciej 27.06) |
| Minimapa fog | `gra/src/ui/minimapHud.ts` | **Ten sam** widok co mapa 3D (A-START-04) |
| Start hex | `gra/src/map/startScoring.ts` | `START_REVEAL_RADIUS = 5` — **OK**, nie zmieniać |
| Kontrakt minimapy | `_handoff/MAPA-do-UI_minimap-data.md` | Dopisz: `visible` z silnika uwzględnia per-city radius |

---

## API dla Silnika (propozycja — MAPA + EKONOMIA)

```typescript
// visibility.ts lub territory.ts (eksport lane MAPA/EKONOMIA)
import { cityRangeForPopulation } from '../game/okolica';
import { cityBorderRadius } from '../game/culture-religion';

export function citySightRadius(pop: number, kulturaSkumulowana: number): number {
  return cityRangeForPopulation(pop) + cityBorderRadius(kulturaSkumulowana);
}
```

**F w `main.ts`** (`currentVisible`): dla każdego miasta gracza `computeVisibleAt(q, r, map, citySightRadius(...))` zamiast stałego `DEFAULT_SIGHT`.

---

## Fix EKONOMIA (osobny micro-batch — przed wpięciem F)

```typescript
// okolica.ts — WDROŻONE 2026-06-27
return Math.min(Math.max(CITY_RANGE_MIN, pop), cap);  // min 5, cap 15
```

Grupa A **nie** edytuje `okolica.ts` — import z lane EKONOMIA (gotowe).

---

## DoD Grupa A

- [x] Minimapa: visible = union per-city sight (kontrakt + test logic)
- [x] `computePlayerVisibility` w `visibility.ts`
- [x] Dokumentacja w `MAPA-DO-MASTERA.md`: **→ SILNIK: GOTOWE**
- [x] **Nie** ruszać `main.ts` — handoff do F (`MAPA-do-SILNIK_mgla-miasto-minimapa.md`)
- [ ] Playtest Maciej A-START-03/04 po build ROBOCZA
