# MAPA → INTEGRATOR: `map-gen-params.json` (Panel-A export)

**Status:** ✅ GOTOWE (Integrator 2026-06-26) · **Flaga:** `→ INTEGRATOR: GOTOWE`  
**Data:** 2026-06-29  
**Lane:** A (MAPA) · **Nie dotyka `main.ts` w lane A**

---

## Co przesyłam

Plik `gra/data/map-gen-params.json` — eksport z `panele-sterowania/Panel-A.xlsx` (`export-a.py`).

Zawiera (balans do kręcenia w Excelu):

| Sekcja | Zastosowanie w kodzie (docelowo) |
|--------|----------------------------------|
| `gestosc.*` | E2: placeDeposits, rzeki, las/pustynia (`generator.ts`, `newGameMapDefaults.ts`) |
| `mapa_skala.*` | typy cywilizacji / rywale per rozmiar mapy |
| `mgla.default_sight_jednostki` | `visibility.ts` DEFAULT_SIGHT |
| `generator.*` | `DEFAULT_WIDTH/HEIGHT`, `ROZMIAR_DIMS` |
| `deposit_rules.*.rarity` | `DEPOSIT_RULES` rarity w `gen-helpers.ts` |
| `metal_deposit_min_era` | `METAL_DEPOSIT_MIN_ERA` w `deposit-era.ts` |

**Dziś:** wartości są w `.ts` (hardcoded). JSON jest **zapisany i aktualny** po eksporcie panelu, ale gra **nie czyta** pliku.

---

## Co Integrator ma zrobić

1. Batch **P3-E2** lub osobny batch **F-MAP-GEN-PARAMS**: podmienić stałe w `generator.ts` / `gen-helpers.ts` / `deposit-era.ts` / `visibility.ts` na odczyt z `map-gen-params.json` (z fallbackiem na obecne liczby).
2. Po wpięciu: build + bramka testów (logic + map-deposits jeśli dotyczy).
3. **Nie** mieszać z `e-start-params.json` (Grupa E) — tam kreator UI; balans generatora = **Panel-A**.

---

## Round-trip aktywny (już działa)

| Excel → JSON | Gra czyta dziś |
|--------------|----------------|
| `terrain-improvements.json` | ✅ tak |
| `terrain-yields.json` | ✅ tak |
| `terrain-movement.json` | ✅ tak |
| `map-gen-params.json` | ❌ czeka Integrator |

Test: `python panele-sterowania/test-panel-a-roundtrip.py`

---

## DoD

- [ ] Kod czyta `map-gen-params.json` z sensownym fallbackiem
- [ ] Zmiana w Panel-A + `eksportuj panel` → widać efekt w grze (E2/mgła/rozmiary/złoża)
- [ ] Opus review przed kanonem (jeśli batch dotyka ROBOCZA)
