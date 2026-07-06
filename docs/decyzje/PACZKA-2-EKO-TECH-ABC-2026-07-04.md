# Paczka 2/3 — EKO-TECH (ABC-10, ABC-11, ABC-14)

> **Data:** 2026-07-04 · **Status:** 🟡 **ZAPISANA**  
> **Potwierdzenie Macieja:** `działaj` (2026-07-04, czat MASTER) — wdrożenie rekomendacji A/A/A z paczki 2/3 wysłanej wcześniej w sesji.

## Odpowiedzi Macieja

| ID | Decyzja | Skutek wdrożenia |
|----|---------|------------------|
| **ABC-10** | **A** | Budynek miejski **Cytadela** (`id: fort`) · ulepszenie mapy **Fort** (`terrain-improvements.fort`) |
| **ABC-11** | **A** | Bufor żywności Spichlerza po wzroście populacji **70%** (`spichlerz_zachowanie_po_wzroscie`, normal) |
| **ABC-14** | **A** | **Popalnia brązu** tylko na heksie ze złożem rudy (Wzgórza/Góry + `zloze` / `ZlozeRudy`) |

## Dowód (plan)

- `gra/data/buildings.json` — nazwa Cytadela
- `gra/data/terrain-improvements.json` — nazwa Fort (mapa)
- `gra/data/econ-params.json` — bufor 70%
- `gra/src/map/improvement-build.ts` — kwalifikacja `popalnia_brazu`
- `gra/tools/eko-tech-paczka2-test.cjs`

## Powiązane

- Paczka 1: `docs/decyzje/PACZKA-1-EKO-TECH-ABC-2026-07-04.md`
- Odłożone ABC-20…24: `docs/decyzje/ODLOZONE-UPGRADE-BUDYNKOW-2026-07-04.md`
