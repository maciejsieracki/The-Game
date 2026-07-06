# → MASTER: GOTOWE-KANON — AUTO-WALKA-v2b (temat ZAMKNIĘTY)

| Pole | Wartość |
|------|---------|
| **Data meldunku** | 2026-06-26 |
| **Decydent** | Maciej — „wdrożyć tu i teraz, flow C identyczny auto/ręczna" |
| **Flaga** | **→ MASTER: GOTOWE-KANON** · **ACK operacyjny** · lane **ZAMKNIĘTY** |
| **Handoff szczegóły** | `UNITS-do-MASTER_auto-walka-v2b.md` |
| **Meldunki append** | `SILNIK-DO-MASTERA.md` · `UNITS-DO-MASTERA.md` |

---

## Kanon (źródło prawdy)

| Plik | md5 |
|------|-----|
| **`Gra-podglad.html`** | **`5D965EB74068538C18C6C0916D5CBB77`** |

**Batch:** AUTO-WALKA-v2b + FLOW-C-fix (deploy:false, notice potyczki, hint szturmu)

**Backup:** `gra/src/main.ts.bak-INTEGRATOR-FLOW-C-2026-06-26`

---

## Co jest w grze

1. **Auto-walka M v2b** — werdykt ze składu M (teren × mur), straty z `auto-battle-params.json`
2. **Wspólny ruch mapy** — `post-battle-map.ts` dla auto, ręcznej 3D, szturmu, AI, barbarzyńców
3. **Przejęcie miasta** — wipe tylko obrońca na centrum; pierścień garnizonu zostaje
4. **Panel Macieja** — `Panel-C.xlsx` → arkusz **Auto-walka** → `eksportuj panel C`
5. **C1-Q3** — `deploy: false` na mapie (atak gracza + szturm)

---

## Bramka (zielona)

| Test | Wynik |
|------|-------|
| `auto-battle-power-test.cjs` | 10/10 |
| `combat-test.cjs` | 6/6 |
| `smoke.cjs` | OK |
| `oblezenie-test.cjs` | 27/27 |
| `vite build` | OK |

---

## Co MASTER robi teraz

| # | Akcja | Status |
|---|--------|--------|
| 1 | ACK md5 w `MASTER-WATCH` + `INTEGRATOR-kolejka` | ✅ wykonane 2026-06-26 |
| 2 | Review retro (subagent readonly) | ⏸ opcjonalnie — kanon już opublikowany |
| 3 | **Nie delegować** ponownie M v2b / post-battle-map | lane UNITS **ZAMKNIĘTY** |
| 4 | Przekazać Maciejowi playtest | `Gra-podglad.html?playtest=walka` |

---

## Czeka Maciej (decydent gameplay)

- Playtest: Auto vs Ręczna — ten sam ruch po walce
- Panel-C: kręcenie `coef_*` / `p_atk` / `p_def` bez rozmowy z AI
- **Balance check** bitew — zaplanowany, nie P0 (decyzja 2026-06-29)
- UX bitwy 3D (C2) — odłożone

---

## Następne tematy C (osobne batchy — NIE teraz)

- UX bitwy 3D (zaznaczanie, atak) — defer Maciej 2026-06-29
- Balance check po playteście + Panel-C
- C-M1 Panel-Merge audyt Jednostki.xlsx

---

**Kolejka Integratora:** **PUSTA** · `INTEGRATOR-STAN.md`
