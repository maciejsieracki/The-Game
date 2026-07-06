# UI → INTEGRATOR: E1-EPOKA-PRZED-CYW (kreator)

**Status:** ✅ ZAMKNIĘTE · kanon opublikowany 2026-06-29

---

## Co przesyłam

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/newGameFlow.ts` | Kolejność: **Epoka → Cywilizacja**; filtr `civsForEpoch()`; badge „X cyw.” |
| `gra/data/civs.json` | `epokiStartowe`: Celtowie/Germanie = `braz`, `zelazo` only |

**Decyzja:** `docs/decyzje/E1-epoka-przed-cyw.md`  
**Playtest Maciej:** ✅ OK (2026-06-29)

---

## Co Integrator ma zrobić

1. Bramka testów (logic, combat, smoke, battle-smoke)
2. Build → `Gra-podglad-ROBOCZA.html` + **`Gra-podglad.html`** + PLAYTEST-*
3. Meldunek `→ MASTER: GOTOWE-ROBOCZA` + md5
4. Aktualizacja `INTEGRATOR-kolejka.md` + `DZIENNIK-MASTERA.md`

---

## DoD (AC)

- [x] Pasek kroków: `Intro · Epoka · Cywilizacja · Ustawienia · Start`
- [x] Kamień → 7 cyw., brak Celtów/Germanów
- [x] Brąz → 9 cyw., z Celtami/Germanami
- [x] Start gry: `epochId` + tech kaskada bez regresji (E1-Q2)
- [x] Kanon = ROBOCZA (md5 `95BBCD3FAB26D4C4F0C35BF0C5A42EA7`) *(stary — aktualny kanon: `4602e752…`)*

---

## Co NIE dotykamy

- `main.ts` — już przekazuje `params.epochId` / `params.civId` (bez zmian)
- AI rywale w tej samej epoce — backlog na później
