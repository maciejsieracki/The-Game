# EKONOMIA → INTEGRATOR: Manpower + POWER obiektywny v2

**Data:** 2026-06-26  
**Batch ID:** **F-POWER-MANPOWER-01**  
**Status:** **🟡 SUPERSEDED** → użyj **`EKONOMIA-do-INTEGRATOR_moc-v1-GOTOWE.md`** (batch `F-MOC-P-A-v1`)  
**Decydent:** Maciej (kanon manpower 10%, POWER absolutny, Respekt relatywny)

---

## TL;DR dla Integratora

| Warstwa | Stan |
|---------|------|
| Model + pure fn | ✅ `manpower.ts`, `power-objective.ts`, `power-params.json` |
| Silnik (`main.ts`) | ✅ częściowo wpięte (battleWins, epoka AI, cache Power, Respekt AI) |
| HUD mapy | ⬜ nadal **Wpływ 0–100** — zamienić na **Power** (abs.) |
| Overlay ⚜ | ⬜ breakdown punktów obiektywnych |
| Dyplomacja UI | ⬜ pokazać **Respekt %** (logika już na objective Power) |
| Panel miasta | ✅ rekruci na pasku + karta szczegółów |
| Kanon HTML | ⬜ build + Opus + `Gra-podglad.html` |

---

## Co przesyłam (deliverable EKONOMIA)

### A. Manpower / rekruci (KANON)

| Plik | Rola |
|------|------|
| `gra/data/epoka-ludnosc-manpower.json` | Tabela 10 epok (ludność abs., max rekruci, koszt jednostki) |
| `gra/data/miasto-params.json` | `manpower_regen_proc_max_tura` = 10 |
| `gra/data/civs.json` | `bonus_pobor_regen`: Grecy −15%, Rzymianie +35% |
| `gra/src/game/manpower.ts` | API: snapshot, regen, werb, `empirePoborTotals`, `civManpowerRegenMult` |
| `gra/src/game/turn-economy.ts` | Regen co turę × bonus cyw |
| `gra/src/game/production.ts` | `manpowerCostOf`, bramka werbu |
| `gra/tools/manpower-test.cjs` | **22/22 OK** |

**Zachowanie w grze:** werb −1 ludek + −MP; brak MP → kolejka; regen +10% max/t (× cyw); oblężenie blokuje regen.

### B. POWER obiektywny v2

| Plik | Rola |
|------|------|
| `dyspozycje/_scalone/EKONOMIA/EKONOMIA-POWER-RESPEKT-SPEC.md` | **Spec kanonu** (Power vs Respekt) |
| `gra/data/power-params.json` | Współczynniki pkt (10/jednostka, 25/bitwa, …) |
| `gra/src/game/power-objective.ts` | `computeObjectivePower()` — pure |
| `gra/tools/power-objective-test.cjs` | **6/6 OK** |

**Wzór Power (obiektywny, bez dzielenia przez lidera mapy):**

```
powerBase = jednostki×10 + bitwy×25 + ludność/1000×1 + rekruci/100×1
          + miasta×50 + heksy×2 + budynki×8
Power = round(powerBase × epoka)    // ep.1 ×1 … ep.10 ×10
Respekt(A,B) = round(100 × Power_A / (Power_A + Power_B))
```

### C. Wpięcia już w `main.ts` (SILNIK — nie duplikować)

Integrator **weryfikuje**, nie przepisuje od zera:

| Mechanizm | Gdzie |
|-----------|--------|
| `battleWinsByOwner` | `recordBattleWin()` w `applyMapBattleOutcome` + AI auto-bitwa |
| `ownerEraByOwner` | `syncOwnerEraFromResearch()` po zbadaniu tech AI |
| `refreshObjectivePowerCache()` | Po `advanceCityEconomy` co turę |
| Respekt AI | Pętla dyplomacji: `computeRespekt(potAI, potPlr)` z cache |
| Save/load | `meta.battleWinsByOwner`, `meta.ownerEraByOwner` |
| `getManpowerSnapshot` | Hook `configureCityPanel` → `cityManpowerSnapshot` |
| HUD rekruci | `hud.ts` — pod ⚜ Wpływ: `X rekruci` |

### D. UI panel miasta (GOTOWE)

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/cityPanel.ts` | Pasek ⚔ rekruci + `buildTopBarRekruciDetailCard` (pula, max, regen/t, koszt) |

---

## Co INTEGRATOR ma zrobić (faza 3 — batch kanonu)

### Krok 1 — HUD mapy (SILNIK / MASTER)

- [ ] Środek paska: **Power** (liczba z `objectivePowerByOwner.get(0)?.power`) zamiast `computePotegaNacji` → „Wpływ 0–100”
- [ ] Opcjonalnie zostawić **rekruci** pod Power (już jest)
- [ ] `buildPowerOverlayData()` → breakdown z `ObjectivePowerResult.components` (pkt surowe, nie % vs inni)

### Krok 2 — Dyplomacja UI

- [ ] Panel dyplomacji: etykieta **Respekt NN%** (relacja już liczona z objective Power)
- [ ] Nie mylić z Power — Power = siła absolutna; Respekt = stosunek dwóch Power

### Krok 3 — Wycofanie starego modelu (po weryfikacji)

- [ ] HUD / overlay: nie używać `computePotegaNacji` + normalizacji `my/max` do wyświetlania głównej liczby
- [ ] `diplomacy-test.cjs` + `power-objective-test.cjs` + `manpower-test.cjs` — zielone przed kanonem
- [ ] Ranking imperiów (opcjonalnie): sort po `objectivePowerByOwner` — informacyjnie

### Krok 4 — Kanon (standardowy pipeline)

```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-dist
node tools/manpower-test.cjs
node tools/power-objective-test.cjs
node tools/diplomacy-test.cjs
# + pozostałe suity PLAYBOOK (17/17 minus baseline-red koszary-gate)
```

- [ ] Opus review (Ask) — sign-off przed publikacją
- [ ] Skopiować `$env:TEMP\civ-dist\Gra-podglad.html` → root `Gra-podglad.html`
- [ ] Backup: `gra/src/main.ts.bak-SILNIK-power-v2-<data>`

---

## Checklist playtest (Maciej / Integrator)

- [ ] Werb jednostki → spadek rekrutów; brak MP → blokada kolejki
- [ ] Koniec tury → regen rekrutów (+10%, Rzym szybciej niż Grecy)
- [ ] Panel miasta → ⚔ rekruci, karta: regen/t zgodny z bonusem cyw
- [ ] Wygrana bitwa → `battleWinsByOwner` rośnie → Power rośnie (+25 pkt/bitwa × epoka)
- [ ] Dyplomacja → Respekt % zmienia się po wzroście Power (nie tylko zdarzenia dyplo)
- [ ] Save/load → battleWins i epoka AI zachowane

---

## Decyzje ABC (Maciej — przed finalną kalibracją)

| ID | Temat | Propozycja A |
|----|-------|--------------|
| A | Współczynniki pkt | Jak w `power-params.json` |
| D1 | Armia | Wszystkie jednostki (w tym osadnik) |
| D3 | Nazwa HUD | **Power** / Siła / Potęga — do wyboru |

Bez ABC Integrator może domknąć technicznie z domyślnymi współczynnikami.

---

## Pliki poza scope Integratora (nie ruszać bez dyspozycji)

| Lane | Pliki |
|------|--------|
| EKONOMIA | `manpower.ts`, `power-objective.ts`, `power-params.json`, `turn-economy.ts`, `production.ts`, `civs.json` |
| UI (gotowe) | `cityPanel.ts` (rekruci), `hud.ts` (rekruci pod Wpływ) |
| Stary model (deprecated po f3) | `power.ts` normalizacja, `computePotegaNacji` w HUD |

---

## Dokumentacja

- `dyspozycje/_scalone/EKONOMIA/EKONOMIA-manpower-pobor.md`
- `dyspozycje/_scalone/EKONOMIA/EKONOMIA-POWER-RESPEKT-SPEC.md`
- `dyspozycje/_handoff/EKONOMIA-do-MASTER_power-objective-v2.md` (mirror techniczny)

---

## Flagi

- **EKONOMIA:** `→ INTEGRATOR: GOTOWE` · ten plik · wpis `EKONOMIA-DO-MASTERA.md`
- **INTEGRATOR:** **READY** — faza 3 HUD + kanon (ABC opcjonalne przed strojeniem)
