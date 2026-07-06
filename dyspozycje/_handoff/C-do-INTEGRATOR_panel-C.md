# Grupa C → INTEGRATOR — Panel-C komplet (PANEL-AUDYT opcja A)

| Pole | Wartość |
|------|---------|
| **Status** | **→ INTEGRATOR: GOTOWE** |
| **Warstwa** | **🟢 izolowana** |
| **Self-test** | ZIELONY · `grupa-selftest.ps1 -Grupa C` |
| **MD5** | `00b386061d8e7dcbc1cbe37967351d38` · `Gra-podglad-C.html` |

---

## Co przesyłam

| Plik | Rola |
|------|------|
| `panele-sterowania/Panel-C.xlsx` | 7 arkuszy: _INFO, Stale-walki, Oblezenie, Jednostki-staty (49 jedn.), Koszty-jednostek, Countery, Teren-walka |
| `panele-sterowania/export-c.py` | Excel → `units.json`, `combat-params.json`, `counters.json`, `terrain-combat.json` |
| `panele-sterowania/gen-panel-c.py` | Regeneracja xlsx z JSON |
| `panele-sterowania/test-panel-c-roundtrip.py` | Round-trip Excel→JSON |
| `gra/data/combat-params.json` | macierz v2 + SS5l + oblężenie + **siege_ai** |
| `gra/src/game/combat.ts` | Czyta `combat-params.json` |
| `gra/src/game/siege.ts` | Czyta § oblężenie |
| `gra/src/game/siegeAi.ts` | Progi AI z § `siege_ai` (Panel-C) |

**NIE dotykałem:** `main.ts`

---

## Testy (zielone)

- combat 6/6 · battle-smoke OK · siege-ai 17/17 · logic 203/203 · round-trip panel OK

---

## Co sprawdzić po wpięciu (Integrator)

1. Zmiana w Excel (`C-MAT-HIT-BASE` lub stat Hastati) → `export-c.py` → efekt w auto-rozstrzygnięciu
2. Mapa + panel miasta — brak regresji (ISO-4)
3. Scala z batch C4 → ROBOCZA → Opus → kanon

**Maciej:** edytuj kolumnę **Wartość** w `Panel-C.xlsx` → poproś agenta: „eksportuj panel C”
