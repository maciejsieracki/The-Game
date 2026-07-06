# EKONOMIA → MASTER — POWER obiektywny v2

**Status:** FAZA 2 WPIĘTA (2026-06-26) · **→ INTEGRATOR:** `EKONOMIA-do-INTEGRATOR_power-manpower-v2.md`

## Co dostarczono

1. **Spec:** `dyspozycje/_scalone/EKONOMIA/EKONOMIA-POWER-RESPEKT-SPEC.md`
2. **Współczynniki:** `gra/data/power-params.json`
3. **Kod:** `gra/src/game/power-objective.ts` — `computeObjectivePower()`
4. **SILNIK (`main.ts`):**
   - `battleWinsByOwner` — inkrement przy każdej wygranej bitwie (`applyMapBattleOutcome`, AI auto-bitwa)
   - `ownerEraByOwner` — epoka AI z zbadanych tech (`syncOwnerEraFromResearch`)
   - `refreshObjectivePowerCache()` — jednostki, bitwy, ludność, rekruci, miasta, heksy, **budynki**
   - **Respekt w dyplomacji** liczony z obiektywnego Power (nie normalizacja vs lider)
   - Zapis/odczyt w `meta` save
5. **Panel miasta (`cityPanel.ts`):** pasek ⚔ rekruci + karta szczegółów (pula, max, regen/t, koszt jednostki)
6. **Test:** `power-objective-test.cjs` 6/6 · `manpower-test.cjs` 22/22

## SILNIK — DoD pozostałe (faza 3)

- [ ] HUD: **Power** (abs.) zamiast Wpływ 0–100
- [ ] Overlay: breakdown punktów obiektywnych
- [ ] Dyplomacja UI: etykieta **Respekt %** (logika już na objective Power)
- [ ] Wycofać stary `computePotegaNacji` z HUD (ranking opcjonalnie z sort Power)

## Decyzje ABC (Maciej)

- A/B/C w spec § „Decyzje ABC” — współczynniki, mnożnik epoki, nazwa HUD
