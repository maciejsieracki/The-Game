# R-MAPGEN-KOLEJNOSC-Q3 — Wieloetapowy floor reliefu (`ensureReliefGridCoverage`)

**Status:** 🔵 **KOD GOTOWY** — ⏸ deploy czeka **FALA 37**  
**Grupa:** A (mapa świata / generator)  
**Ekran:** [TEMAT: Generator mapy — czas generacji i pokrycie reliefu]

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | 🔧 **Czat ABC** — kod gotowy w `gra/src`; **nie** publishuj `gra-robocza/` |
| **Kod `gra/src`** | ✅ **GOTOWY** — floor relief bez skracania · `map-gen-regression-test` |
| **Deploy `gra-robocza`** | ⏸ **czeka FALA 37** — poza FALA 36 |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

## Sytuacja

Funkcja `ensureReliefGridCoverage` uruchamia się wielokrotnie w pipeline generacji: **2×** na standardowej mapie, **3×** na mapie Ziemi. Zapewnia to pokrycie reliefu (test relief-grid 6/6), ale wydłuża czas generacji — pomiar **~6 s** vs dawniej próg **5 s** w teście wydajności. Uproszczenie pipeline (mniej przebiegów) skróciłoby generację, ale może złamać pokrycie siatki reliefu.

## Cel pytania

Zostawić wieloetapowy floor reliefu bez zmian, czy uprościć pipeline (mniej wywołań `ensureReliefGridCoverage`).

## Dlaczego teraz

Wpływa na zamknięcie paczki R-MAPGEN i na czas generacji przy starcie nowej gry. Decyzja Q1/Q2 bez Q3 zostawiała otwarty temat wydajności.

## Opcja A — Wszystkie przebiegi bez zmian

Opis: Zachować 2× (mapa) / 3× (Ziemia) wywołań `ensureReliefGridCoverage`; zaakceptować czas ~6 s lub poluzować próg testu wydajności.

**Za:** Testy relief-grid zielone bez ryzyka · pewne pokrycie reliefu na każdym etapie pipeline · zero refaktoru mapgen · najmniejszy diff.

**Przeciw:** Wolniejsza generacja mapy (~6 s vs cel 5 s) · wielokrotne przejścia po tej samej siatce — potencjalna redundancja · każdy nowy etap mapgen dokłada koszt.

## Opcja B — Jeden floor po finalnej geografii

Opis: Jedno wywołanie `ensureReliefGridCoverage` na końcu pipeline, po ustaleniu rzek, lasu i złóż.

**Za:** Prostszy pipeline — łatwiejszy do zrozumienia i debugowania · krótszy czas generacji (szacunkowo −30–40% kosztu relief-grid) · jeden kanoniczny moment „wyrównania" reliefu.

**Przeciw:** Ryzyko failów relief-grid — relief przed rzekami/lasem mógł być celowy · wymaga pełnego audytu kolejności etapów · możliwa regresja na mapie Ziemi (3× → 1× to duża zmiana).

## Opcja C — Dwa przebiegi (przed rzekami + finalny)

Opis: Kompromis — jeden floor przed rzekami (szkielet reliefu) i jeden po finalnej geografii; usunąć trzeci przebieg na Ziemi lub pośredni na mapie standardowej.

**Za:** Kompromis czas vs jakość · zachowuje wczesny szkielet przed rzekami · skraca generację vs opcja A · mniejsze ryzyko niż pojedynczy floor (B).

**Przeciw:** Wymaga audytu redundancji — który przebieg jest zbędny · nadal dwa miejsca do utrzymania · wynik musi przejść relief-grid po zmianie (iteracja strojenia).

## Rekomendacja

**Litera:** A — testy są zielone; ~1 s ponad próg to akceptowalny koszt stabilności reliefu do czasu osobnej optymalizacji wydajności.

## Odpowiedź Macieja

> **A** — wszystkie przebiegi floor reliefu bez zmian. Czas generacji jest akceptowalny; **ważniejszy jest finalny efekt zgodny z wytycznymi** (pokrycie reliefu, fair-play, kolejność pipeline).

## Wdrożenie (2026-07-27)

**Pipeline:** bez zmian — `ensureReliefGridCoverage` pozostaje **2×** (mapa standardowa) i **3×** (Ziemia), jak w `generator.ts` (przebiegi 3g, 3h-relief-final, Ziemia — ostatnia szansa).

**Test wydajności:** próg mapy standardowej w `map-gen-regression-test.cjs` podniesiony z **5 s → 7 s** (`STANDARD_GEN_MS_LIMIT`), bo priorytetem jest jakość geografii, nie skracanie kosztem relief-grid.

**Testy:** relief-grid **6/6** · fair-play **8/8** · map-gen-regression **PASS** · tsc **0**

**Warstwa:** 🟢 (brak zmiany logiki generatora — tylko dokumentacja + próg testu)
