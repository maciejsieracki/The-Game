# EKONOMIA → INTEGRATOR: Moc (Power P-A) v1 — **GOTOWE DO KANONU**

**Batch ID:** `F-MOC-P-A-v1`  
**Data:** 2026-06-26 (aktualizacja po kalibracji Macieja)  
**Status:** 🟢 **READY — build + Opus + Gra-podglad.html**  
**Decydent:** Maciej — P-A, ludki 5 pkt, wagi wyłączone, P-C3 **Moc**/Power

---

## TL;DR Integratora

| Warstwa | Stan |
|---------|------|
| Model P-A + JSON | ✅ `power-params.json`, `power-objective.ts`, `power-options.ts` |
| Manpower (rekruci → ekw.) | ✅ `manpower.ts`, `Manpower-epoki` w Panel-B |
| Silnik `main.ts` | ✅ cache Mocy, HUD, overlay, Respekt AI, **dominacja na objective Moc** |
| UI PL | ✅ **Moc** (`power-labels.ts`, hud, overlay, kreator) |
| Panel sterowania | ✅ Panel-B: `Potega-P-A`, `Potega-opcje`, `Manpower-epoki` → `export-b.py` |
| Testy | ✅ `power-objective-test` 9/9 · `power-options-test` 5/5 · `manpower-test` 22/22 |
| **Twój krok** | build `/tmp` → bramka testów → **Opus** → skopiuj kanon |

---

## Panel-B — pełna mapa sterowania Mocą

| Arkusz Panel-B | JSON | Co kręcisz |
|----------------|------|------------|
| **Potega-P-A** | `power-params.json` → `skladniki.*.pkt` | 9 współczynników (25/25/5/5/50/0.5/5/20/5) |
| **Potega-opcje** | `power-params.json` → `opcje.*` | osadnik w armii, flat bitwa, etykieta Moc, × epoka (OFF) |
| **Manpower-epoki** | `epoka-ludnosc-manpower.json` | koszt werbu → składnik rekruci (ekw. jednostek) |
| Miasto | `miasto-params.json` | regen rekrutów %/turę (wpływa na pulę, nie bezpośrednio na pkt Mocy) |

**Maciej:** edycja → **`eksportuj panel`** → `python panele-sterowania/export-b.py`

**Kalkulator (symulacja, bez eksportu):** `docs/decyzje/POWER-kalkulator-Maciej.xlsx`

---

## Wzór Mocy (kanon P-A)

```
ekw_rekr = floor(rekruci_bieżący / koszt_werbu[epoka])

Moc = round(
  armia×25 + bitwy×25 + ludki×5 + ekw_rekr×5
  + miasta×50 + heksy×0.5 + budynki×5 + tech×20 + ulepszenia×5
)

Respekt(A,B) = round(100 × Moc_A / (Moc_A + Moc_B))
```

- **Bez** mnożnika epoki (P-B odrzucone)  
- **Bez** wag per-cyw  
- **Dominacja** (10=A*): udział Mocy > 50% w ostatniej epoce — liczy **objective Moc**, nie stary Wpływ 0–100

Kalibracja: 100 ludków, 10 miast, scenariusz Macieja → **Moc ≈ 3020** (`power-objective-test.cjs`)

---

## Pliki deliverable (EKONOMIA — nie duplikować logiki)

| Plik | Rola |
|------|------|
| `gra/data/power-params.json` | Kanon współczynników + opcje |
| `gra/data/epoka-ludnosc-manpower.json` | Skala rekrutów |
| `gra/src/game/power-objective.ts` | `computeObjectivePower()` |
| `gra/src/game/power-options.ts` | `loadPowerOpcje()`, `countUnitsForPowerArmy()` |
| `gra/src/game/manpower.ts` | `rekrutUnitEquivalents`, `empirePoborTotals` |
| `gra/src/ui/power-labels.ts` | Etykieta PL z JSON |
| `gra/tools/power-objective-test.cjs` | |
| `gra/tools/power-options-test.cjs` | |
| `gra/tools/manpower-test.cjs` | |
| `docs/decyzje/P-A-power-kanon.md` | |
| `docs/decyzje/P-C3-moc-power-nazwa.md` | |
| `dyspozycje/_scalone/EKONOMIA/EKONOMIA-POWER-RESPEKT-SPEC.md` | |

---

## Wpięcia w `main.ts` (weryfikuj, nie przepisuj)

| Mechanizm | Funkcja / miejsce |
|-----------|-------------------|
| Snapshot Mocy | `buildObjectivePowerForOwner()` — 9 składników |
| Cache co turę | `refreshObjectivePowerCache()` po ekonomii |
| HUD środek | `buildHudState()` → `objectivePowerForOwner(0)` + `mocLabel()` |
| Overlay ⚜ | `buildPowerOverlayData()` → ranking + składniki pkt |
| Respekt AI/dyplo | `objectiveRespektPctToward`, `computeRespekt(objective…)` |
| Wygrane bitwy | `battleWinsByOwner` / `recordBattleWin()` |
| Zwycięstwo dominacja | `checkVictory` z `objectivePowerForOwner` (nie `computePotegaNacji`) |
| Save/load | `meta.battleWinsByOwner`, `meta.ownerEraByOwner` |

### Deprecated (nie używać w UI)

- `computePotegaNacji` + `computePotegaComponents` — stary Wpływ 0–100 (zostaje w `diplomacy.ts` tylko legacy/tests)
- `power.ts` normalizacja vs max na mapie

---

## Checklist Integratora (DoD kanonu)

### Bramka testów (obowiązkowe)

```powershell
cd gra
node tools/power-objective-test.cjs    # 9/9
node tools/power-options-test.cjs      # 5/5
node tools/manpower-test.cjs           # 22/22
node tools/diplomacy-test.cjs
node tools/victory-test.cjs
node tools/logic-test.cjs
node tools/smoke.cjs
# + pozostałe suity PLAYBOOK (17/17, koszary-gate baseline-red OK)
npx vite build --outDir $env:TEMP\civ-dist
```

### Playtest Macieja (po kanonie)

- [ ] HUD: **⚜ liczba · MOC** (nie Wpływ 0–100)
- [ ] Klik ⚜ → 9 składników w punktach + ranking
- [ ] Werb / bitwa / miasto → Moc rośnie zgodnie z Panel-B
- [ ] Dyplomacja → Respekt % reaguje na Moc
- [ ] Zmiana w Panel-B `ludek` 5→6 → eksport → Moc rośnie na ludkach
- [ ] Save/load zachowuje bitwy wygrane

### Publikacja

- [ ] Backup: `gra/src/main.ts.bak-INTEGRATOR-moc-v1-<data>`
- [ ] Opus Ask — sign-off
- [ ] `Gra-podglad.html` z `$env:TEMP\civ-dist`
- [ ] Wpis `SILNIK-DO-MASTERA.md` + md5 kanonu

---

## Opcje Panel-B → silnik

| Klucz `Potega-opcje` | Działanie w kodzie |
|----------------------|-------------------|
| `liczy_osadnik_w_armii` | ✅ `countUnitsForPowerArmy()` |
| `bitwa_wspolczynnik_flat` | ⏸ rezerwa (flat 25 pkt — domyślnie) |
| `hud_etykieta` | ✅ `mocLabel()` czyta z JSON |
| `mnoznik_epoki_aktywny` | ❌ musi zostać `false` (P-B odrzucone) |

---

## Flagi

- **EKONOMIA:** `→ INTEGRATOR: GOTOWE F-MOC-P-A-v1`
- **INTEGRATOR:** wykonaj checklist → meldunek `→ MASTER: GOTOWE-KANON F-MOC-P-A-v1`

**Poprzedni handoff:** `EKONOMIA-do-INTEGRATOR_power-manpower-v2.md` — **superseded** przez ten plik.
