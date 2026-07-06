# MAPA → MASTER · Start gry: skala + odległości (Maciej 2026-07-04)

**Status:** ZINTEGROWANE kanon md5 `31c6db16…` (MASTER 2026-07-04 ~16:28)  
**Decyzja:** Maciej — gęstsza rozgrywka; reguły **tylko spawn** + founding.

---

## Co przesyłam

### 1. Odległości startu (spawn klastra)

| Kto | Min. od stolicy gracza / między sobą | Stała |
|-----|--------------------------------------|-------|
| **Miasta-państwa** (Sparta, Kapua — ten sam typ) | **3 hexy** | `MIN_DIST_START_CITY_STATE` |
| **Obce typy cywilizacji** (start) | **≥5 hexów od hexu stolicy gracza** | `MIN_DIST_FOREIGN_FROM_PLAYER` |
| W klastrze obcego typu (start) | **3 hexy** między miastami (jak u gracza) | `MIN_DIST_FOREIGN_IN_CLUSTER` (=3, Maciej 2026-07-04) |

Pliki: `gra/src/map/clusters.ts` (dwufazowy spawn: klaster gracza → stolica → obce typy z filtrem 5 hex).

### 2. Po starcie — founding miast

| Reguła | Wartość |
|--------|---------|
| Nowe miasto vs zwykłe miasto | **5 hexów** (`MIN_CITY_DISTANCE` / `miasto-params.json`) |
| Nowe miasto vs **startowe miasto-państwo** | **3 hexy** (`City.startCityState`, ustawiane w `main.ts` dla `simplifiedDiplomacyOwners`) |

Pliki: `gra/src/game/cities.ts`, `gra/src/main.ts` (`applyClusterStartPlan`).

**Uwaga:** Miasta-państwa **nie spawnują się** po starcie — tylko pozycja startowa + wyjątek dystansu przy founding.

### 3. Przesterowana skala (typy + miasta-państwa per mapa)

**→ Zaktualizowano 2026-07-04 wieczór:** `MAPA-do-MASTER_skala-kreator-mp9-2026-07-04.md` (mp max **9**, typy osobno).

Źródło liczb: `gra/data/e-start-params.json` + tabele w `newGameMapDefaults.ts`.

| Mapa | Typy cywilizacji | Miasta-państwa (domyślnie) |
|------|------------------|----------------------------|
| Malenki | 4 | 4 |
| Mały | 5 | 5 |
| Standardowy | 6 | 6 |
| Duży | 7 | 7 |
| Ogromny | 10 | 8 |
| Super Huge | 12 | 8 |

Kreator: menu **3 opcje** (min · zalecane · max) — patrz handoff mp9.

---

## Co MASTER ma zrobić

1. **Review** diff (MAPA lane + dotknięty `main.ts` — flaga `startCityState` przy spawnie).
2. **Build:** `npx vite build --outDir $env:TEMP\civ-dist`
3. **Bramka:** `node tools/cluster-start-test.cjs` (+ pełna bramka przed kanonem).
4. **Opus sign-off** → promocja kanonu.
5. **Opcjonalnie CYWILIZACJE/AI:** komentarze w `ai.ts` o `placement.minDystans` → `minDystansMiastaPanstwa` (heurystyka promienia klastra).

---

## DoD

- [x] `cluster-start-test.cjs` — asercje 3 hex (mp) i 5 hex (obcy od stolicy)
- [x] Panel-E / Panel-A JSON zsynchronizowane
- [x] Kanon opublikowany przez MASTER (2026-07-04 ~16:28, md5 `31c6db16…`)

---

## Pliki dotknięte

- `gra/src/map/clusters.ts`
- `gra/src/map/newGameMapDefaults.ts`
- `gra/src/game/cities.ts`
- `gra/src/main.ts` (tylko `startCityState` przy spawnie)
- `gra/src/clusterpreview/main.ts`
- `gra/data/e-start-params.json`
- `gra/data/map-gen-params.json`
- `gra/tools/cluster-start-test.cjs`
- `gra/tools/ai-test.cjs` (mock placement)
