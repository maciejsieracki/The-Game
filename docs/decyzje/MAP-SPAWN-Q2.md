# MAP-SPAWN-Q2 — Start cywilizacji: quota na masę lądu

**Status:** 🟡 **ZAPISANA** · **ZAMKNIĘTE (dyskusja)** — czeka na wdrożenie  
**Data decyzji:** 2026-08-01  
**Decydent:** Maciej  
**Cytat:** „**b**"  
**Grupa:** A (mapa / generator startu)  
**Powiązane:** `MAP-SPAWN-Q1` (kontynenty + lokalny ląd ≥70%) · `CIV-EPOCH-SPAWN-Q1` (pula typów wg epoki startu)

---

## Problem

Po `MAP-SPAWN-Q1` typy cywilizacji lądują na kwalifikujących masach lądu, ale **round-robin „po jednym na kontynent"** nie skaluje się przy wielu typach i wielu masach o różnej wielkości:

- mała wyspa może dostać kilka typów, podczas gdy duży kontynent zostaje pusty;
- brak jawnej **quota** typów względem rozmiaru masy;
- brak twardego **capu** na małe masy;
- wybór hexu startu nie preferuje heksów z **największą przestrzenią rozwoju**.

Źródło audytu: `clusters.ts` → `placeClusterCentersAcrossLandmasses`, bramki masy dla obcych typów.

---

## Opcje (skrót)

| Opcja | Opis | Za (skrót) | Przeciw (skrót) |
|-------|------|------------|-----------------|
| **A** | **Jeden typ na masę** (round-robin po masach, bez quota proporcjonalnej) | Proste, przewidywalne; kontynenty rozdzielone | Przy wielu typach duże kontynenty niedowykorzystane; małe wyspy mogą dostać typ „na siłę" |
| **B** | **Quota proporcjonalna + limit typów na masę** (largest remainder) | Sprawiedliwy podział wg rozmiaru masy; cap chroni małe wyspy; Pangea OK | Więcej logiki w `clusters.ts`; parametry do strojenia testami |
| **C** | **Czysta gęstość / Voronoi** (typ tam, gdzie najwięcej lądu w promieniu, bez quota globalnej) | Lokalnie „najlepszy" hex | Nie rozwiązuje pustych kontynentów vs przeładowanych wysp; trudniejsze do testowania |

**Rekomendacja (Master):** **B** — balansuje liczbę typów z rozmiarem masy i domyka problem „wszyscy na wysepce".

---

## Decyzja Macieja: **B**

Quota proporcjonalna + limit typów na masę:

1. **Ląd kwalifikujący** dzielony między typy cywilizacji **proporcjonalnie do rozmiaru masy** (algorytm **largest remainder** / Hamilton).
2. Na **małą masę** — **max 1 typ** cywilizacji.
3. **Preferencja hexów** z **największą przestrzenią rozwoju** (scoring startu / lokalny potencjał ekspansji).
4. **Nie dokładać wielu civ na małą wyspę**, gdy duże kontynenty są puste (redystrybucja quota na większe masy po capie).
5. **Pangea (1 masa)** — wszystkie typy na tej masie **OK** (brak sztucznego rozdziału na nieistniejące kontynenty).

---

## Parametry robocze (propozycja do wdrożenia)

| Parametr | Wartość robocza | Znaczenie |
|----------|-----------------|-----------|
| `MIN_MASS_HEXES_FOR_SPAWN` | **≈ 60** | Masa poniżej progu nie kwalifikuje się do przydziału typów (wyjątek: jedyna masa / Pangea) |
| `MIN_DEVELOPMENT_HEX_PER_CIV` | **≈ 80–100** | Minimalna „przestrzeń rozwoju" (ląd zamieszkiwalny w zasięgu ekspansji) na jeden typ na masie |
| **Cap małej masy** | **1 typ**, gdy `masa < 2 × MIN_DEVELOPMENT_HEX_PER_CIV` | Chroni wyspy przed wieloma startami |
| **Algorytm quota** | largest remainder na listę mas kwalifikujących | Suma slotów = liczba typów do rozmieszczenia |

Parametry do strojenia w `cluster-start-test.cjs` (mapy wielokontynentalne, Pangea, mała wyspa + duży kontynent).

---

## Plan wdrożenia (kod — **nie w tej sesji**)

### Pliki

| Plik | Zakres zmian |
|------|----------------|
| `gra/src/map/clusters.ts` | `placeClusterCentersAcrossLandmasses` — quota per masa (largest remainder), cap 1 typ na małą masę, redystrybucja na duże kontynenty; integracja z istniejącymi bramkami `MAP-SPAWN-Q1` |
| `gra/src/map/cluster-spawn.ts` | Walidacja / fallback hexów startu obcych po nowej alokacji mas; spójność z `playerStartHex` |
| `gra/src/map/startScoring.ts` | Preferencja hexów z największą przestrzenią rozwoju w scoringu kandydatów |
| `gra/tools/cluster-start-test.cjs` | Regresja: Pangea (N typów na 1 masie), duży kontynent + mała wyspa (max 1 typ na wyspie), brak pustego mega-kontynentu przy pełnym rosterze |

### Bramki (lane A)

- `npx tsc --noEmit` — 0 błędów
- `node tools/cluster-start-test.cjs` — PASS (nowe asercje quota + cap)
- Opcjonalnie: `node tools/map-gen-regression-test.cjs` — determinizm A=B bez regresji

### Warstwa

🟡 **cross** — generator startu gry (`clusters.ts` / `cluster-spawn.ts`); bez `main.ts` jeśli API klastra wystarczy.

---

## Dowód wdrożenia (po `działaj`)

- Funkcja quota w `clusters.ts` + testy `cluster-start-test.cjs` zielone
- Wpis w `REJESTR-DECYZJI.md` → 🔵 W TRAKCIE → 🟠 U INTEGRATORA → 🟢 WDROŻONA
