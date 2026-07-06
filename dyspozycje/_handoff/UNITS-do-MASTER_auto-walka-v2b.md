# UNITS → MASTER — Auto-walka M v2b + wspólny ruch mapy (auto = ręczna)

| Pole | Wartość |
|------|---------|
| **Data** | 2026-06-26 |
| **Decydent** | Maciej — temat **ZAMKNIĘTY** (wdrożenie „tu i teraz") |
| **Flaga** | **→ MASTER: GOTOWE-KANON** (wpięte poza kolejką Integratora — retro-meldunek) |
| **Batch** | `AUTO-WALKA-v2b` |
| **Warstwa** | **🟡 cross** — `main.ts` + moduły UNITS + JSON Panel-C + ruch mapy wspólny auto/ręczna |

---

## 1. Co przesyłam (deliverable)

### Moduły lane (UNITS / Grupa C)

| Plik | Rola |
|------|------|
| `gra/src/game/auto-battle-power.ts` | Werdykt M v2b + `applyLossPctToRoster` (wagi linii) |
| `gra/src/game/auto-battle-params.ts` | Load `auto-battle-params.json` · UPSET_R · TIE_EPS |
| `gra/src/game/post-battle-map.ts` | **Wspólne** skutki mapy: straty auto / survivors ręczna + fan-out / cofka / capture centrum |
| `gra/data/auto-battle-params.json` | Parametry strat (Panel-C → eksport) |
| `gra/tools/auto-battle-power-test.cjs` | Testy v2b — **10/10** |
| `gra/tools/auto-battle-power.py` | Symulator offline (Maciej bez buildu) |
| `gra/src/units/setup.ts` | `hp?`, `defLossesThisTurn?`, export `hexNeighborCoords()` |
| `docs/AUTO-WALKA-MOC-ALGORYTM.md` | Kanon algorytmu §14–§15 v2b |
| `panele-sterowania/gen-panel-c.py` | Arkusz **Auto-walka** |
| `panele-sterowania/export-c.py` | Eksport → `auto-battle-params.json` |

### Wpięcie Integratora (`main.ts` — już wykonane w tej sesji)

- Import modułów + `terrain-combat.json`
- `doAutoPowerMapBattle()` — helper auto M v2b + `applyMapBattleOutcome`
- `applyMapBattleOutcome()` → delegacja do `applyPostBattleMap` + capture miasta
- `applyCityCaptureToMap()` → tylko wipe obrońcy na **centrum** miasta
- **Gracz:** preBattle → auto (`resolveAutoBattleByPower`) / ręczna 3D (survivors)
- **Szturm:** auto + ręczna przez `finishSiegeStormBattle` + `atkStart` snapshot
- **AI + barbarzyńcy:** `collectBattleRoster` + `doAutoPowerMapBattle`
- **Kanon:** `Gra-podglad.html` md5 **`5D965EB74068538C18C6C0916D5CBB77`** (ACK Master 2026-06-26)

---

## 2. Decyzja produktowa (Maciej)

- Auto-walka na **sumie M** składów (bez oblężniczych/Zwiadowca/Osadnik na polu)
- Straty v2b: lustro przegranego · `p_atk` / `p_def` · `coef_zwyciezca` / `coef_przegrany`
- **Identyczne reguły ruchu na mapie** dla auto i ręcznej 3D — różni się tylko źródło werdyktu/strat
- Panel: Maciej kręci **Panel-C → Auto-walka** → `eksportuj panel C`

---

## 3. Bramka testów (wykonana)

| Test | Wynik |
|------|-------|
| `auto-battle-power-test.cjs` | **10/10** |
| `combat-test.cjs` | **6/6** |
| `smoke.cjs` | **OK** |
| `oblezenie-test.cjs` | **27/27** (bez regresji oblężenia) |
| `npx vite build --outDir $env:TEMP\civ-dist` | **OK** |

`npx tsc --noEmit` — projekt ma **istniejące** błędy spoza tego batcha; build Vite przechodzi.

---

## 4. Co MASTER ma zrobić

1. **ACK kanon** md5 `A754EC9B39725EDA6CD7B4EDBABEDC16` — zaktualizować `MASTER-WATCH.md` + `INTEGRATOR-kolejka.md` + `INTEGRATOR-STAN.md`
2. **Review** — subagent readonly lub Opus (batch opublikowany przed formalnym handoffem)
3. **Decyzja ABC / priorytet** — 3 luki z audytu flow C (osobny batch Integratora?):
   - **C1-Q3 rewizja:** `deploy: false` w `BattleScene` (dziś `deploy: true` × 3)
   - **UX:** `refreshMapAfterCityCapture` + notice po zdobyciu z **potyczki polowej** (miasto bez muru)
   - **UX:** podwójny hint przy auto-szturmu (`doSiegeAutoResolve` + `finishSiegeStormBattle`)
4. **Docs:** zaktualizować `docs/obieg/C-walka.md` §TERAZ (auto-walka v2b ZAMKNIĘTE)
5. **NIE powtarzać:** reimplementacja M v2b / post-battle-map — **ZAMKNIĘTE**

---

## 5. Co sprawdzić po wpięciu (playtest Maciej)

1. `Gra-podglad.html?playtest=walka` — Hastati vs Falanga → **Auto** i **Ręczna** → ten sam ruch po walce (fan-out / cofka)
2. Zmiana `coef_zwyciezca` w Panel-C → eksport → auto-walka reaguje
3. Szturm na miasto z murem — auto i ręczna — przejęcie bez wipe pierścienia garnizonu

---

## 6. Uwaga proceduralna

Batch wdrożony **lane + Integrator w jednej sesji** (bez wcześniejszego `_handoff` i przed review). Ten plik = **retroaktywny meldunek** do domknięcia obiegu.

**Handoff powiązany:** meldunek append `dyspozycje/SILNIK-DO-MASTERA.md` · `dyspozycje/UNITS-DO-MASTERA.md`
