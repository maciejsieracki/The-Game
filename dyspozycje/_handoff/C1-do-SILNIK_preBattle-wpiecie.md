# Handoff C1 → SILNIK / Grupa F (preBattle TW)

> **SUPERSEDED 2026-06-27** — użyj: `C1-do-SILNIK_batch-test.md`  
> C1-Q1…Q5 **ZAMKNIĘTE**. Ten plik zostawiony tylko jako historia.

**Data:** 2026-06-26  
**Od:** Grupa C (UI lane)  
**Do:** Master Silnik / Grupa F (`F-C1`)  
**Status:** ~~MODUŁ UI GOTOWY · GAMEPLAY CZEKA ABC~~ → **ARCHIWUM**

---

## Zasada (Maciej 2026-06-26)

**Decyzje gameplay = tylko ABC od Macieja.** Agent **nie zamyka** C1-Q2b…Q5.  
Master zadaje paczkę ABC Maciejowi; dopiero po literach — wpiecie w `main.ts` zgodne z decyzją.

---

## Co UI dostarczyło (gotowe)

| Deliverable | Plik |
|-------------|------|
| Layout TW w grze | `gra/src/ui/preBattle.ts` |
| Mockup (akceptacja Macieja) | `UI/Makieta-preBattle.html` |
| Backup | `preBattle.ts.bak-UI-C1TW-20260626` |
| Handoff pierwotny UI | `C1-do-UI_preBattle-TW-layout.md` |

**API (wstecznie kompatybilne):**
- `showPreBattle(info, cb, opts?)`
- `PreBattleCallbacks.onSave?`
- `PreBattleInfo`: `miejsce`, `lokacja`, `modyfikatory`, `canRetreat`, …
- `PreBattleOptions.defaultAction?` — **placeholder kodu**, nie decyzja

**Domyślne w kodzie (nie ABC):** `docs/decyzje/C1-DECYZJE-PROWIZORYCZNE.md`

---

## Decyzje Macieja — stan

| ID | Status |
|----|--------|
| C1-Q1 | **ZAMKNIĘTE** A + wyjątek oblężenie |
| C1-Q2 | **ZAMKNIĘTE** mockup TW OK |
| C1-Q2b | **OTWARTE** |
| C1-Q3 | **OTWARTE** |
| C1-Q4 | **OTWARTE** |
| C1-Q5 | **OTWARTE** |

---

## Co Grupa F / SILNIK robi PO ABC Macieja

1. **`onSave`** w `showPreBattle` (`saveToLocal`, overlay zostaje)
2. **`deploy: true`** w `BattleScene` — zgodnie z C1-Q3 ABC
3. **Skład bitwy** — zgodnie z C1-Q4 ABC (+ D8 kontrakt UNITS)
4. **`canRetreat` / Wycofaj** — zgodnie z C1-Q5 ABC
5. **Routing C1-Q1** — oblężenie bez szturmu → bez preBattle (`C1-do-MAPA_oblezenie-bez-preBattle.md`)
6. Build `/tmp` → bramka → Opus → kanon

**Flaga:** MODUŁ UI **GOTOWE** · `main.ts` **CZEKA ABC + F-C1**
