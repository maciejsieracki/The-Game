# R-AI-KOLONIZACJA — AI: agresywna kolonizacja mapy

**Status:** 🟡 ZAPISANA · czeka `działaj`  
**Data:** 2026-08-03  
**Grupa:** D (Cywilizacje / AI)

---

## Decyzje Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-AI-KOLONIZACJA-Q1** | **A** | Gdy miasto AI ma ludność **≥ 5**, priorytet założyć kolonię. Miasto-źródło: **5 → 4** (po founding). Mechanizm: **`foundCityAt`**, **bez osadnika**. |
| **R-AI-KOLONIZACJA-Q2** | **A** | **Max 1 miasto / turę / cywilizację** + **surge do 2/turę**, gdy na mapie **brak wolnych niezależnych miast-państw** (MP). |
| **R-AI-KOLONIZACJA-Q3** | **B** | **Agresywna reguła epoki 1–3** (Kamień → Żelazo): pełna presja kolonizacyjna w tym oknie. |
| **R-AI-KOLONIZACJA-DYSTANS** | **4 hex** | Minimalna odległość od innego miasta przy zakładaniu — **4 hex** (dziś `min_dystans_miast` = 5 oraz `ekspansja_min_dystans_miast` = 5). Dotyczy **gracza i AI** (param globalny + AI). |

**Cytat (sens):** *„Kolonizacja aż cała mapa będzie zagospodarowana zasięgiem miast — nie tylko do końca epoki 3. Epoki 1–3 = okno pełnej agresji; potem nadal kolonizacja, jeśli są dobre hexy poza zasięgiem. Nie byle gdzie — hex musi dawać szansę na rozwój (hexCityScore / food+work+river). Nie mega-gęstość — min dystans 4 hex."*

---

## Doprecyzowania Macieja (obowiązkowe)

### 1. Cel: pokrycie mapy zasięgiem miast

Kolonizacja trwa **aż cała mapa będzie zagospodarowana zasięgiem miast** — nie jako twardy stop „do końca epoki 3”.

- **Epoki 1–3** (Kamień → Żelazo) = **okno pełnej agresji** (Q3=B).
- **Po epoce 3:** kolonizacja **nadal aktywna**, jeśli są **dobre hexy poza zasięgiem** istniejących miast (nie wycinać founding po przejściu epoki).

### 2. Jakość lokalizacji — nie byle gdzie

Hex kandydata musi dawać **szansę na rozwój**:

- Użyć / wzmocnić istniejącą heurystykę **`hexCityScore`** (`food` + `work` + `river` + surowce + kara graniczna).
- **Odrzucać słabe lokalizacje** poniżej progu score (ew. nowy parametr w `ai-params.json`, np. `ekspansja_min_score_hex`).

### 3. Gęstość — min dystans 4 hex

- **Nie mega-gęstość:** minimalna odległość od innego miasta = **4 hex**.
- Dziś: `miasto-params.json` → `min_dystans_miast` = **5**; `ai-params.json` → `ekspansja_min_dystans_miast` = **5**.
- **Wdrożenie:** oba → **4** — spójnie dla **gracza i AI** przy zakładaniu miast (`foundCityAt` / `canFoundCity`).

---

## Stan dziś (przed wdrożeniem)

| Element | Plik / funkcja | Dziś |
|---------|----------------|------|
| Founding AI | `ai.ts` → `planCityFounding` | `foundCityAt`, max 1/turę (C-AI-EKSP-Q1=A) |
| Blokada fazy lokalnej | `ai.ts` → `isLocalExpansionPhase` | skauci + wioski + MP w klastrze |
| Wybór hexu | `ai.ts` → `findCityFoundingHex` + `hexCityScore` | brak twardego progu min score |
| Miasto-źródło ludności | `city-founding.ts` → `pickSourceCityForFounding` | `minPop = popCost + 1` (= **2** przy koszcie 1) |
| Dystans globalny | `miasto-params.json` → `min_dystans_miast` | **5** |
| Dystans AI | `ai-params.json` → `ekspansja_min_dystans_miast` | **5** |
| Osadnik | produkcja AI | **nie** (C-AI-EKSP — founding bez jednostki) |

---

## Plan wdrożenia (kod — po `działaj`)

### P0 — parametry dystansu (gracz + AI)

| Plik | Zmiana |
|------|--------|
| `gra/data/miasto-params.json` | `min_dystans_miast.wartosc`: **5 → 4** |
| `gra/data/ai-params.json` | `ekspansja_min_dystans_miast.wartosc`: **5 → 4** |

Efekt: `cities.ts` → `MIN_CITY_DISTANCE`; `ai.ts` → `getAiParam(..., 'ekspansja_min_dystans_miast', …)`.

### P1 — próg ludności źródła (Q1=A)

| Plik | Zmiana |
|------|--------|
| `gra/src/game/city-founding.ts` | Dla **AI** (`ownerId > 0`): `pickSourceCityForFounding` wymaga **pop ≥ 5**; po founding źródło **5 → 4**. Gracz bez zmian (≥ 2) — albo wspólny param w `miasto-params.json` (`zaloz_miasto_min_pop_zrodla_ai`). |
| `gra/src/game/ai.ts` → `planCityFounding` | Priorytetyzacja: jeśli którekolwiek miasto AI ma **pop ≥ 5** i są dobre hexy — **founding przed** produkcją wojska / budynków (wg istniejącej kolejności `decideAITurn`). |

### P2 — limit tur + surge (Q2=A)

| Plik | Zmiana |
|------|--------|
| `gra/src/game/ai.ts` → `planCityFounding` / `decideAITurn` | Domyślnie **max 1** `foundCityAt`/turę/cyw. **Surge = 2**, gdy na mapie **0 wolnych niezależnych MP** (`ownerId` CS + brak wasala). Licznik per turę per `playerId`. |

### P3 — agresja epok 1–3 + pokrycie mapy (Q3=B + doprecyz. 1)

| Plik | Zmiana |
|------|--------|
| `gra/src/game/ai.ts` → `isLocalExpansionPhase` | W **epokach 1–3**: skrócić / ograniczyć blokady lokalne (np. niższy `AI_LOCAL_PHASE_MAX_TURN`, łagodniejsze wymogi skautów) — **pełna agresja**. |
| `gra/src/game/ai.ts` → `planCityFounding` | Po epoce 3: founding **nadal**, gdy `findCityFoundingHex` znajduje hex **poza zasięgiem** istniejących terytoriów (heks nieobjęty żadnym miastem w promieniu zasięgu). |
| `gra/src/game/ai.ts` → `findCityFoundingHex` | Opcjonalnie: bonus score dla hexów **poza** obecnym zasięgiem (wypełnianie mapy). |

### P4 — próg jakości hexu (doprecyz. 2)

| Plik | Zmiana |
|------|--------|
| `gra/data/ai-params.json` | Nowy param: np. `ekspansja_min_score_hex` (wartość do strojenia). |
| `gra/src/game/ai.ts` → `findCityFoundingHex` | Odrzucić kandydatów z `hexCityScore(...) < próg`; zwrócić `null` jeśli najlepszy < próg. |

### Testy (self-check lane D)

- `gra/tools/ai-test.cjs` — T6* founding, dystans 4, próg pop AI ≥ 5.
- `gra/tools/ai-war-gate-test.cjs` — W4* max 1/turę + surge 2 przy braku MP.
- `npx tsc --noEmit` — 0 błędów.

**Warstwa:** 🟡 cross (AI + `city-founding` + JSON parametry) → Integrator po handoff.

---

## Powiązane decyzje

- **C-AI-EKSP-Q1=A** — founding przez `foundCityAt`, bez osadnika (już wdrożone).
- **R-AI-MP-WASAL-WCHLONIECIE** §4 — ekspansja AI wspomagająca „mapa pełna” (parametry `ai_local_phase_max_turn` itd.) — **zsynchronizować** z tą paczką.

---

*Koniec · ECHO 2026-08-03 · czeka `działaj`.*
