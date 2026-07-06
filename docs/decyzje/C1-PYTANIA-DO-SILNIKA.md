# C1 — pytania do Master Silnika

Append-only. Pytania techniczne / routing — nie gameplay ABC.

---

## [2026-06-26] C1-S1 — routing preBattle vs oblężenie (Q1 Macieja)

**Lane / pliki:** `gra/src/main.ts` (SILNIK), `gra/src/ui/preBattle.ts`, MAPA render oblężenia  
**Kontekst:** Maciej C1-Q1=A + wyjątek oblężenie bez szturmu → brak preBattle, tylko C3 na mapie.  
**Handoff:** `dyspozycje/_handoff/C1-do-MAPA_oblezenie-bez-preBattle.md`

**Pytanie do Silnika:** Wpiąć gałąź w `main.ts`: atak miasta z murem → akcja „Oblężaj” **nie** woła `showPreBattle`; szturm / potyczka polowa / atak wroga na gracza → **zawsze** `showPreBattle`.

**Co blokuje:** kanon spójny C1+C3; dziś P4 może wołać preBattle zbyt wcześnie przy oblężeniu.

**→ SILNIK: CZEKA NA ODPOWIEDŹ / batch po C3 panel**
