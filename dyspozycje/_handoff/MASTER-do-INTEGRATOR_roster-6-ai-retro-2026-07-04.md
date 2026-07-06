# MASTER → INTEGRATOR F: roster-6 AI — dyspozycja retro (proces)

> **Status:** **INFORMACYJNY** — kod już w kanonie md5 `dafa21f48…` (Master pominął F ~22:03).  
> **Od następnego batchu:** ten sam zakres **idzie przez F** przed kanonem.

---

## Co F robi normalnie (szablon na kolejne batche)

1. Odbierz handoff lane (`CYWILIZACJE-do-MASTER_roster-6-archetypy-ai_2026-07-04.md`).
2. Sync `gra/` → bramka: `node tools/ai-test.cjs` (T3e–T3h) · `npx vite build --outDir $env:TEMP\civ-dist`.
3. `.\tools\publish-robocza-snapshot.ps1`
4. Meldunek: `→ MASTER: GOTOWE-ROBOCZA` + md5 z `ROBOCZA-MANIFEST.json`.

**Master:** weryfikacja meldunku → review → `publish-kanon-snapshot.ps1`.

---

## Kolejka — następne batche (Master dyspozycjonuje F)

| Batch | Handoff lane | Priorytet |
|-------|--------------|-----------|
| EKO-TECH P1 | `MASTER-do-EKONOMIA_eko-tech-paczka1…` + CYW/MAPA/UI | po lane GOTOWE |
| CUDA G1 refaktor | `MASTER-do-SILNIK_cuda-zamkniecie…` | po lane SILNIK |
| POLE-BITWY v4 | UI → MASTER → **F** (build robocza) | po port UI |

**ZAKAZ Master:** sam build/publish roboczej.
