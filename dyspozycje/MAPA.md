# MAPA — dyspozycja bieżąca

**Lane:** Grupa A (MAPA) · **Editor main.ts:** NIE · **Kanon bazowy:** md5 **`0fd96b6f…`** (2026-07-05)

---

## [2026-07-05] P0 — Strefy klimatyczne **A wąski** — **START MAPA**

**Decyzja Macieja:** **A wąski** (~15% pas suchy · dżungla nad/pod · umiarkowany dalej)  
**Handoff:** `dyspozycje/_handoff/MASTER-do-MAPA_strefy-klimat-A-waski-2026-07-05.md`  
**Decyzja zapis:** `docs/decyzje/MAPA-STREFY-KLIMAT-ABC-2026-07-05.md`

### AC skrót

1. `climateZoneAt` w `gen-helpers.ts` · pustynia tylko w pasie arid 15%
2. Render dżungli ze strefy tropical (`mapRenderStyle.ts`)
3. Regresja rzek: `map-gen-regression-test.cjs` PASS
4. Meldunek `→ MASTER: GOTOWE`

**Status:** 🟢 **ACTIVE** — lane MAPA start

---

## [2026-07-04] P0 — Droga brukowana (T-TECH-9 A)

**Decyzja:** Maciej paczka 1 · **JSON:** ✅ `terrain-improvements.json` (`droga_brukowana`, `bonus_ruch: 2`, `upgradeFrom: droga`)

**Handoff:** `dyspozycje/_handoff/MASTER-do-MAPA_droga-brukowana-2026-07-04.md`

### AC

1. `improvement-build.ts` — obsługa klucza `droga_brukowana` (upgrade z `droga`, ta sama sieć dróg).
2. Ruch jednostek: **+2** na hexie z brukiem (czytaj `bonus_ruch` z JSON lub param `ulepszenie_droga_brukowana_ruch`).
3. UI move preview / pathfinding spójne z istniejącą `droga` (UNITS meldował „drogi 3× szybciej" — nie regres).
4. Test: smoke lub dedykowany test MAPA.
5. Meldunek: `MAPA-DO-MASTERA.md` → **`→ MASTER: GOTOWE`**

### Zakaz

- NIE ruszać `main.ts` — jeśli hook w SILNIK potrzebny, handoff `MAPA-do-INTEGRATOR_…`

**Status:** 🟢 **GOTOWE** (MAPA 2026-07-04) → **`→ MASTER: GOTOWE`**
