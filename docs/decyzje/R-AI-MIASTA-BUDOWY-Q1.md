# R-AI-MIASTA-BUDOWY-Q1 — państwa-miasta prawie nie budują

**Status:** 🟡 ECHO **A** (2026-08-05) — **audyt zamknięty**, czekam na sygnał fix  
**Źródło:** Maciej 2026-07-29 ~02:04 · paczka 2/2

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **R-AI-MIASTA-BUDOWY-Q1** | **A** | Najpierw **audyt** (diag + raport) → dopiero potem jedna mała dźwignia (osobna fala / zgoda) |

## AC (faza audytu)

1. Raport w tym pliku (lub dopisek §Audyt): dlaczego kolejka budynków MP jest pusta / rzadka.
2. Sprawdź: gate kosztów, priorytet produkcji, cap wojska vs budynki, `isProductionAllowed` / difficulty, osobne ścieżki city-state w `ai.ts`.
3. **ZAKAZ** zmiany liczb balansu w tej fazie — tylko diagnoza + rekomendowana jedna dźwignia.
4. Po audycie: krótka rekomendacja A/B dla fixu (nie wdrażaj fixu bez osobnego sygnału, chyba że Grok zatwierdzi jednoznaczny bug-gate).

## Audyt

**Data:** 2026-08-05 · **Operator:** AutoBot (Composer) · **Branch:** `cursor/feat-diplo-szare-katalog-mp-audit-63a1`

### Ścieżka produkcji MP (miasta-państwa)

| Etap | Plik | Co się dzieje |
|------|------|----------------|
| Klasyfikacja ownera | `main.ts` ~21276 | `defensiveCopy: typCityCopyOwners.has(ownerId)` — państwa-miasta tego samego typu co gracz + satelici klastra (nie stolice obcych typów). |
| Tura AI | `ai.ts` ~1861–1862 | `decideAITurn` → `decideDefensiveCopyTurn` (bez founding, bez ekspansji). |
| Wybór kolejki | `ai.ts` ~2280–2286 | `chooseCityProduction(...)` → `{ type: 'build', buildingId }`. |
| Bramka tech/epoka/surowiec | `main.ts` ~21348–21379 | `isProductionAllowed` → `availableProduction` (ten sam kontrakt co panel gracza). |
| Enqueue | `main.ts` ~22102–22156 | Ponowna bramka `availableProduction`; odrzucenie loguje `Build blocked (epoka/tech)`. |
| Koszt magazynu | `main.ts` ~22205–22215 | `canAffordBuildingStock(ownerSurowcePoolFor)` — pula państwa, nie lokalne miasto. |
| Postęp Pracy | `main.ts` ~20819–20846 | `doBudynkow` z ekonomii miasta (suwak domyślnie 70% budynki); MP **nie** ma auto-zarządcy (`AI-MANAGE-Q1`). |
| Cap wojska | `city-state-difficulty.ts` ~12–20 + `ai.ts` ~1377–1387 | Cap liczony od **trudności gry gracza** (`menuDifficulty`), nie suwaka MP: Easy brak limitu · Normal max 1 · Hard max 0. |

### Root cause (top 3, z dowodem)

**1. Rozjazd priorytetu infra vs bramka PROD-GATE (główny)**  
`chooseCityProduction` w bloku `defensiveCopy` + `infraBootstrap` (`ai.ts` ~1244–1264) nadaje **studnia / garncarnia / stolarnia / spichlerz / targowisko** score ~450–390 **zanim** wie, czy item przejdzie bramkę. Filtrowanie `isProductionAllowed` jest **dopiero na końcu** (`ai.ts` ~1395–1397), wołane z `main.ts` ~21348.

Na starcie epoki Kamienia (tech z `grantTechEpokWczesniejszych`, `main.ts` ~1481) typowe kandydaty infra są **niedostępne**:

| Budynek | `buildings.json` techUnlock | Dodatkowa bramka |
|---------|----------------------------|------------------|
| studnia | Gospodarka wodna (prereq: Rolnictwo) | drewno w magazynie |
| garncarnia | Garncarstwo | DEPOSIT_LINKED: Glina (`building-resource-gate.ts` ~59–60) |
| stolarnia | Obróbka drewna | Drewno w magazynie państwa |
| spichlerz | Garncarstwo | Ceramika (Garncarnia lub zapas) |
| targowisko | Wymiana | prereq łańcuch Garncarstwo+Rolnictwo+Oswojenie |

Efekt w grze: AI **chce** studnię (najwyższy score), `isProductionAllowed` odcina budynki → zostaje **Pałac** (tech `-`, `lokalizacja: stolica`, jedyny sensowny early) albo **Wojownik** / **null** (gdy cap wojska lub `canAfford` odrzuci resztę). To tłumaczy „mają zasoby (drewno w puli), a kolejka prawie pusta lub tylko garnizon” — zasoby ≠ odblokowany tech.

Test dokumentujący: `gra/tools/city-state-prod-audit-test.cjs` (sekcje A–B).

**2. Cap wojska Normal/Hard + infraBootstrap wymaga garnizonu**  
`cityStateMilitaryProductionCap` (`city-state-difficulty.ts` ~12–20): Normal **1**, Hard **0**. Filtr `militaryOwned >= milCap` (`ai.ts` ~1381–1385) usuwa Wojownika/Łucznika z puli. Na **Hard** przy `milCap === 0` warunek `0 >= 0` jest **zawsze true** → **żadna** jednostka bojowa nie przechodzi. Dodatkowo `infraBootstrap` (`ai.ts` ~1248–1249) wymaga `cityGuardCount >= 1` — bez garnizonu **nie** wchodzi lista studnia/palac, a Wojownik jest zablokowany cap-em → `chooseCityProduction` zwraca **null** (potwierdzone testem `city-state-prod-audit-test.cjs` D2). Na **Normal** po jednym Wojowniku wojsko znika z puli — produkcja zależy od budynków z bramki (pkt 1).

**3. Po wyjściu z infraBootstrap wojsko znów wygrywa score**  
Gdy `built.length >= 6` (`ai.ts` ~1248), supresja Wojownika `-250` (`ai.ts` ~1275–1279) **nie działa**. Gałąź mid-phase (`ai.ts` ~1213–1219) dodaje Wojownika ~270 pkt vs budynki gospodarcze ~240 — regresja opisana w komentarzu ~1237–1241 może wrócić po zbudowaniu podstawowej „szóstki” (np. sam Pałac + mury + spichlerz), mimo zasobów na dalszą gospodarkę.

### Czego audyt **nie** wskazuje

- Brak osobnej ścieżki „MP nie dostaje `doBudynkow`” — ekonomia i pula Pracy AI są wspólne (`main.ts` ~20819–20846).
- `canAfford` w `main.ts` ~21331–21344 sprawdza **koszt_surowce** z puli państwa (zgodnie z obserwacją Macieja „mają zasoby”).
- Istniejący fix infra bootstrap (~1237–1287) **działa w testach bez bramki** (`tools/ai-test.cjs` T7D-h); problem ujawnia się **z** `isProductionAllowed` (T7D-j/k).

### Rekomendowana jedna dźwignia (faza fix — **nie wdrożone**)

**Opcja A (rekomendowana):** W `chooseCityProduction`, blok `infraOrder` dla `defensiveCopy` — dopisywać kandydatów **tylko** gdy `opts.isProductionAllowed?.(cityId, bid) !== false` (gdy callback jest podany; bez callbacka zachowanie jak dziś). Dzięki temu score nie idzie w studnię/garncarnię zablokowaną tech, a pierwszy realnie budowalny item (np. Pałac → potem Garncarstwo → łańcuch) wygrywa deterministycznie.

**Opcja B (alternatywa):** W `runAiResearchForOwner` dla `typCityCopyOwners` — jednorazowy boost wyboru **Garncarstwo / Gospodarka wodna / Obróbka drewna** w `chooseAIResearch` (zmiana priorytetów, nie liczb ekonomii).

### Test diagnostyczny

`node tools/city-state-prod-audit-test.cjs` — read-only, bez zmiany gameplay; potwierdza rozjazd studnia (bez bramki) vs palac (z bramką Kamień).

### Status

Audyt zamknięty — **czekam na sygnał fix** (osobna fala; bez zmian `ai-params.json` / balansu w tej paczce).
