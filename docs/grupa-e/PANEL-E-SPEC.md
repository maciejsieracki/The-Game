# Panel-E — spec (Grupa E)

> **Plik Excel:** `panele-sterowania/Panel-E.xlsx`  
> **Eksport:** `python panele-sterowania/export-e.py` (agent — Maciej pisze „eksportuj panel”)  
> **Standard kolumn:** `docs/obieg/PANEL-STEROWANIA-SPEC.md` §2

## Co sterujesz

| Arkusz | Parametry | JSON docelowy |
|--------|-----------|---------------|
| **Defaulty-startu** | Cyw gracza, epoka, jakość mapy | `e-start-params.json` → `defaulty` |
| **Nowa-gra** | Domyślne indeksy kreatora (trudność, mapa, typ świata, prędkość, gęstości…) | `ui-params.json` → `nowa_gra` |
| **Menu** | Wersja gry, audio, grafika, skala UI, mgła domyślna | `ui-params.json` → `menu` |
| **Skala-mapy** | Rywale, miasta-państwa, typy cyw, wymiary hex per rozmiar | `e-start-params.json` → `skala_mapy` |
| **Generator-E2** | Mnożniki surowców, rzek, las/pustynia (decyzje E2-Q2…Q4) | `e-start-params.json` → `generator_e2` |
| **Tempo-gry** | Szybka / Standard / Długa × koszt badań | `e-start-params.json` → `tempo_gry` |
| **Zwyciestwo** | Próg Power 50%, ostatnia epoka (E2-Q10=A*) | `e-start-params.json` → `zwyciestwo` |
| **Kreator-zaaw** | Seed, barbarzyńcy, bitwy, mgła debug, warunki zwycięstwa | `e-start-params.json` → `kreator_zaawansowane` |
| **Decyzje-kanon** | Flagi E1/E2 (reset, tech kaskada, złoża, barbarzyńcy…) | `e-start-params.json` → `decyzje_kanon` |

## Czego NIE ma w Panel-E

- **Panel miasta** (rush, okolica px) → `Panel-B` / `ui-params.panel_miasta` (lane B)
- **Barbarzyńcy liczby** (spawn, obozy) → `Panel-D` / `ai-params.json`
- **Ulepszenia/plony FOOD** → `Panel-A` + `Panel-B` (FOOD-HODOWLA)

**Decyzja Maciej 2026-06-29:** Panel-E **nie koliduje** z FOOD-HODOWLA (`PANEL-E-FOOD`).

## Wpięcie w grę

| JSON | Czytane dziś | Uwagi |
|------|--------------|-------|
| `ui-params.json` | ✅ `uiParams.ts` → kreator, menu | Round-trip działa |
| `e-start-params.json` | ⬜ docelowo TS | Stałe dziś w `newGameMapDefaults.ts`, `victory.ts`, `tech-tempo.ts` — handoff Integrator |

## Regeneracja Excel z JSON

```text
python panele-sterowania/gen-panel-e.py
```

## Źródła decyzji

- `docs/grupa-e/decyzje/E1-nowa-gra.md` (ABC 1–12)
- `docs/decyzje/E2-gestosc-swiat-kreator.md` (E2-Q2…Q5)
- `docs/grupa-e/decyzje/E2-ai-zwyciestwo.md` (Q10, Q11)
- `gra/src/map/newGameMapDefaults.ts`, `gra/src/game/victory.ts`, `gra/src/game/tech-tempo.ts`
