# B — Zasięg miasta + widok (mgła) bez jednostek

| Pole | Wartość |
|------|---------|
| **ID** | B-FOG-Q1 / B-zasięg-pop |
| **Decyzja Macieja** | **Spec** (2026-06-27, czat Grupa B) |
| **Status** | **ZAMKNIĘTE** — przekazane Grupa A + Grupa E |
| **Właściciel formuły** | EKONOMIA (`okolica.ts`, `territory.ts`) |
| **Właściciel mgły / minimapy** | Grupa A (MAPA) + wpięcie F (`main.ts`) |

---

## Ustalenie Macieja

1. **Zasięg okolicy miasta** startuje od **5 heksów** i rośnie **1:1 z populacją** (cap **15**).
   - Przykład: pop **9** → zasięg **9**.
   - Pop **1–4** → zasięg **5** (minimum; do potwierdzenia przy implementacji: `max(5, pop)`).

2. **Kultura** dodaje **+0…+3 pierścienie** poza okolicę roboczą (`cityBorderRadius` — jak mockup `MIASTO/Zasieg-miasta-okolica.html`).

3. **Mgła — widok miasta bez jednostek:** heksy **visible** = okolica (pop) **+** pierścienie kultury. Spójne z „gdzie buduję + granica kultury”.

4. **Posterunek** (+5) i **fort** (+10) — osobne źródła widoku (jak terytorium struktury).

5. **Jednostki** — **osobny** stały zasięg widzenia (np. 10 heksów); zwiad widzi dalej niż samo miasto.

6. **Przed pierwszym miastem** (onboarding): tymczasowy krąg **`START_REVEAL_RADIUS = 5`** wokół preferowanego hexu startu (`startScoring.ts`) — **zgodny** z minimum zasięgu miasta.

---

## Formuła (kanon v1.0)

```text
okolicaRadius(pop) = max(5, min(floor(pop), 15))

widokMiasta = okolicaRadius(pop) + cityBorderRadius(kultura)   // 0..3 pierścienie

widokGracza = ∪ widokMiasta(wszystkie miasta) ∪ widokJednostek ∪ posterunki/forty
```

**Explored** (FoW): heksy kiedyś widziane, poza zasięgiem — przyciemnione (3 stany: unknown / explored / visible).

---

## Rozjazd z kodem (2026-06-27)

| Plik | Dziś | Powinno być |
|------|------|-------------|
| `okolica.ts` `cityRangeForPopulation` | `min(pop, 15)` → pop 1 = **r1** | `max(5, min(pop, 15))` |
| `territory.ts` | importuje tę samą funkcję | sync po fix EKONOMIA |
| `main.ts` `currentVisible()` | miasto = `DEFAULT_SIGHT` jak jednostka | per-miasto promień wg formuły |
| `visibility.ts` | `DEFAULT_SIGHT = 3` (jednostki) | osobno `CITY_SIGHT` vs `UNIT_SIGHT` |

---

## Handoffy

| Odbiorca | Plik |
|----------|------|
| **Grupa A (MAPA)** | `dyspozycje/_handoff/EKONOMIA-do-GRUPA-A_zasieg-miasta-fog.md` |
| **Grupa E (start meta)** | `dyspozycje/_handoff/EKONOMIA-do-GRUPA-E_start-zasieg-fog.md` |
| **Silnik F** | po GOTOWE lane A + fix EKONOMIA → batch w `main.ts` |

---

## DoD

- [ ] EKONOMIA: `cityRangeForPopulation` = `max(5, min(pop, 15))` ✅ 2026-06-27
- [ ] Eksport `citySightRadius` ✅
- [ ] MAPA: minimapa + render fog — ten sam widok co silnik
- [ ] F: `computeCityVisible(cities)` zamiast stałego `DEFAULT_SIGHT` dla miast
- [ ] E: kontrakt startu dokumentuje r=5 pre-city i r=5 po założeniu (pop 1)
- [ ] Test: miasto pop 9 bez jednostek → visible radius 9 (+ kultura)
