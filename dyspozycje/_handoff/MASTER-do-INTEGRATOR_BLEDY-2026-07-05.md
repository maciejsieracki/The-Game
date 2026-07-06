# MASTER → INTEGRATOR F: BLEDY audyt 2026-07-05 (MAPA P0 + tsc P1)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **GOTOWE-ROBOCZA** (P0 + P1) |
| **Data** | 2026-07-05 |
| **Trigger** | Maciej: potwierdzenie audytu Opus 5 · raport w repo |
| **Kanon bazowy** | md5 **`89a870fbecbc015cb96a2e90cba04511`** (sign-off Macieja ~08:34) |
| **Robocza start** | sync z kanonem · edycja **`gra/src/**`** → publish F → `gra-robocza/` |
| ~~**Robocza start**~~ | ~~edycja `gra-robocza/src/**`~~ — **WYCOfane 2026-07-05** ([`OBOWIAZ-SCIEZKA-KODU.md`](../../docs/obieg/OBOWIAZ-SCIEZKA-KODU.md)) |
| **Źródło prawdy bugów** | [`dyspozycje/BLEDY-DO-NAPRAWY-2026-07-05.md`](../BLEDY-DO-NAPRAWY-2026-07-05.md) |

---

## Kontekst (Maciej — potwierdzone testem generatora)

| # | Problem | Potwierdzenie |
|---|---------|---------------|
| **B0.1** | ~28% głównych rzek na typie „ziemia" kończy na łące | purge po `generateRivers()` kasuje ujście |
| **B0.2** | Standard ~26 s generacji | 47% CPU = `oceanConnectedWaterKeys` w pętli |
| **B0.3** | Woda wgryzająca się w pustynię | literówka `TerenBazowy.Morse` → gałąź odbudowy martwa |

---

## Faza A — P0 GENERATOR MAPY (najpierw)

**Pliki:** `gra-robocza/src/map/generator.ts`, `gra-robocza/src/map/gen-helpers.ts` (+ render tylko jeśli B0.5)

### A1 · B0.1 Rzeki bez ujścia

**Przyczyna:** `generator.ts` ~362-365 — po `generateRivers()` wołane:
`purgeInlandWaterForMultiLandTyp` + `purgeDesertEnclaveWater` zamieniają wodę→ląd pod ujściem rzeki.

**Fix (preferowany):** przenieść oba purge **PRZED** `clearRiverMarks` / `generateRivers` (są już wołane wcześniej w pipeline).  
**Alternatywa:** po purge walidacja `pathEndsAtSea()` per rzeka `main` → retrace/usuń uszkodzone.

**AC:** 0 głównych rzek bez ujścia · 5 seedów (42/123/777/7/2026) × 4 typy (kontynenty/pangea/wyspy/ziemia) · ostatni hex `main` sąsiaduje z wodą połączoną z krawędzią mapy.

### A2 · B0.2 Wydajność

**Fix minimalny (wymagany):** `pathEndsAtSea` — opcjonalny param `oceanConnected: Set<string>`; przekazywać wyliczony raz zestaw z `traceRiver` / `tryPlaceGridRiver` / `ensureMassRiverGridCoverage` zamiast pełnego flood-fill przy każdej próbie. **Cel: ~−50% czasu.**

**Fix rozszerzony (jeśli AC czasu nadal fail):**
- `sanitizeCoastHexes` — BFS z kolejką zamiast `while(propagated)` + pełny skan mapy
- pipeline: wczesne wyjście gdy licznik zmian = 0; redukcja powtórzeń `finalizeCoastAndInlandWater` / `purgeInlandWaterForMultiLandTyp` / `enforceMapBorderOcean`

**AC:** mapa standardowa **< 5 s**, duża **< 15 s** · ten sam seed → identyczny hash heksów (determinizm).

**Pomiar:** skrypt/profil w `gra-robocza/` lub `node` one-off — zapisz czasy w meldunku F.

### A3 · B0.3 Literówka Morse → Morze

**Plik:** `gen-helpers.ts:1865` (`isCoastalMorseHex`)

```ts
// BYŁO: TerenBazowy.Morse  →  MA BYĆ: TerenBazowy.Morze
```

**AC:** po fixie — `rebalanceLandSeaRatio` potrafi dosypać ląd; szum wybrzeża dwustronny.

### A4 · B0.4 / B0.5 — tylko weryfikacja po A1–A3

- **B0.4:** `applyDoubleCoastRing` na pustyni — **NIE zmieniaj bez ABC**; w meldunku: czy enklawy wody na pustyni zniknęły po A1+A3
- **B0.5:** dopływy → główny nurt — wizualnie w `Gra-podglad-PLAYTEST-MAPA.html`; fix render tylko jeśli po A1 nadal „urwane"

**Backup przed MAPA:** `generator.ts.bak-BLEDY-2026-07-05`, `gen-helpers.ts.bak-BLEDY-2026-07-05`

---

## Faza B — P1 TSC + twarde crashe (po P0 green)

**Bramka:** `cd gra-robocza && npx tsc --noEmit` → **0 błędów** (start: **158** w 31 plikach).

**Kolejność napraw (realne crashe / zepsute UI):**

| Priorytet | Plik | Fix |
|-----------|------|-----|
| 1 | `main.ts:3469` | import `getEmpireFoodSplit` z `./game/empire-food` |
| 2 | `main.ts:5451` | `unit.typeId` → `u.typeId` |
| 3 | `gen-helpers.ts:1865` | (już w A3) |
| 4 | `ai.ts:720` | `def.health` → `def.Health` |
| 5 | `cityPanel.ts:3838+` | wielkość liter pól vs `UnitDef` |
| 6 | `hexContextTooltip.ts:79+` | `ulepszenia` → `ulepszenie` |
| 7 | `main.ts:9665`, `playtestMiastoEkonomia.ts:163` | `kulturaSkumulowana` — dopasować do typu `City` |
| 8 | `robloxImprovements.ts:376` | builder `stadnina` |
| 9+ | reszta listy w raporcie | popalnia_brazu, battleScene GroupMeta, remis, minimap FOW, MapSizeLabel `super`, converters, upkeep… |

**main.ts:** backup `main.ts.bak-BLEDY-2026-07-05` przed edycją.

**AC P1:** `tsc --noEmit` = 0 · smoke test bitwy z remisem nie crashuje.

---

## Faza C — P2 LOGIKA — **ZAKAZ ZMIAN bez ABC**

Te punkty tylko **raportuj w meldunku** jako „wymaga decyzji Macieja" — **nie naprawiaj**:

1. Podwójna szarża `combat.ts` ~776-790
2. Wasalizacja `diplomacy-proposals.ts` ~455-470
3. `makeDealId` duplikaty w tej samej turze
4. `barbarians.ts` limit obozów po load save
5. Ujemne zapasy państwa `empire-food.ts`
6. Seed 0/undefined + zapis do save

Master eskaluje do Macieja osobną paczką ABC (max 3/paczka).

---

## Definition of Done (cały batch)

Pełna lista w [`BLEDY-DO-NAPRAWY-2026-07-05.md`](../BLEDY-DO-NAPRAWY-2026-07-05.md) § WERYFIKACJA.

1. `npx tsc --noEmit` → **0**
2. Test generatora: 5 seedów × 4 typy · 0 rzek bez ujścia · 0 wody w 100% lądzie · czas standard < 5 s, duża < 15 s · determinizm
3. Wizualnie PLAYTEST-MAPA: pustynia + dopływy (notatka w meldunku)
4. Smoke remis polowy OK

---

## Bramka build + testy

```powershell
cd gra-robocza
npx tsc --noEmit
node tools/smoke.cjs
node tools/combat-test.cjs
# istniejące suite'y — wszystkie zielone oprócz baseline-red (koszary-gate)
npx vite build --outDir $env:TEMP/civ-dist
# publish-robocza-snapshot.ps1 → gra-robocza/
```

Opcjonalnie: dodać `tools/map-gen-regression-test.cjs` (AC generatora) — jeśli brak, opisz manualny protokół w meldunku.

---

## Meldunek

Plik: `dyspozycje/_handoff/F-do-MASTER_BLEDY-2026-07-05.md`

Zawartość:
- Status **GOTOWE-ROBOCZA** lub **BLOK** (z powodem)
- md5 ROBOCZA po rebuild
- Czasy generacji (mała/standard/duża) przed/po
- Wynik testu rzek (N/N głównych OK)
- `tsc` 0/158
- P2 lista „czeka ABC" — bez zmian kodu
- **ZERO playtestu w czacie Macieja** — tylko wpis REJESTR-PLAYTESTOW §2

---

## Scope OUT

- Promocja kanonu (Master po review)
- Zmiany P2 bez ABC
- `applyDoubleCoastRing` redesign pustyni (ABC osobno)
- Lane CYW / Grupa C jednostki (osobna kolejka)
