# F → MASTER: MAPA bufor rzek 2 hex od morza

**Data:** 2026-07-04 ~23:30  
**Trigger:** Maciej `działaj` (hub Master)  
**Handoff lane:** DZIENNIK ~23:15 · MAPA lane kod gotowy  
**Status:** **→ MASTER: GOTOWE-ROBOCZA**

---

## Zakres

- Rzeki: min. **2 hex** ciała od morza; ujście ≤2 hex na wybrzeżu
- Generacja **po** finalnym wybrzeżu · A* bez biegu wzdłuż plaży
- Pliki: `gra/src/map/generator.ts` (+ helpers w gen-helpers jeśli dot.)

---

## Bramka

| Test | Wynik |
|------|--------|
| `river-sea-buffer-test.cjs` | **6/6** |
| `smoke.cjs` | OK |
| vite build → `/tmp/civ-dist` | OK |

**ROBOCZA md5:** `11d23be65ee6eaf8c5dabe5013eef2d8`  
**Start:** `gra-robocza/START.html` · Ctrl+F5 · **Nowa gra**

---

## DoD Master

- [ ] Review scope (tylko MAPA generator/rzeki)
- [ ] `publish-kanon-snapshot.ps1` po APPROVE
- [ ] Wpis DZIENNIK + MAPA-STAN sync

**POLE-BITWY:** bez zmian w tym batchu (osobny artifact v4.1 w kanonie)
