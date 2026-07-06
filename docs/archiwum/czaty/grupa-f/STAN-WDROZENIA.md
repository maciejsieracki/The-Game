# Grupa F — stan wdrożenia (skrót operacyjny)

**Data:** 2026-06-27 · **Kod:** `gra/src/main.ts` · **ROBOCZA:** ✅ `Gra-podglad-ROBOCZA.html` (md5 poniżej)

---

## Batchy w main.ts

| Batch | Status | Uwagi |
|-------|--------|--------|
| **F1** save/load + B3 parity | ✅ DONE | `restoreGameFromSave`, Ctrl+L/menu |
| **F2** wealth migrate, AI diff, mury | ✅ DONE | `maMur`, `ensureCitySaveDefaults` |
| **F-A2** `generujSwiat` | ✅ DONE | F-START-FIX: log `newW` naprawiony 2026-06-27 |
| **F-B2** haki panelu (order/health) | ✅ DONE | `cityOrderState`, `configureCityPanel` |
| **F-C1** preBattle TW | ✅ DONE | multi-unit, manual, deploy, Q5 onCancel |
| **F-HUD** cz.1–2 | ✅ DONE | minimapa, wojny, kulturaRate, bunt chip |
| **F-B2-porzadek** | ✅ DONE | `orderMultMap`, migracja buntu |
| **F-HUD-2** (A2-Q4, A1-Q9, A4 budowa) | ✅ **WPIĘTE** | 2026-06-27 handoff D1B-A4-batch |
| **F-C2** bitwa TW pełna | ✅ w kodzie | deploy + survivors |
| **B2-Q5** ikona 🔥 hex | ✅ wpięte | `getRevolt` + sync po turze |
| **A1-Q5** wywiad dyplomatyczny | ✅ wpięte | `getKnownWarsBetweenOthers` |
| **F-D4** audyt bonusów | ❌ TODO | P2 |
| **A4-D4 BLK-04** ulepszenia mapy | ❌ TODO | P2, czeka MAPA+UI |
| **B5 advanceEmpireFood** | ⛔ BLOK | stub throws |

**ROBOCZA md5:** `d11f2479ac20158d38d3ba6e2ac3f253` (2026-06-27, final rebuild)

---

## Blokery procesu

| Bloker | Właściciel |
|--------|------------|
| Opus review | Master (po ROBOCZA) |
| typecheck `tsc` | wiele legacy błędów poza main — vite build OK |
| npm w PATH agenta | użyto Cursor node + junction `gra/dist`→TEMP |

---

## Kolejność F (autonomiczna)

1. ~~F-BRAMKA~~ ✅ ROBOCZA zbudowana
2. Opus review → kanon (Master)
3. F-D4 / persist B2 save (P2)
