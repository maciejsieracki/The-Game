# CYWILIZACJE → MASTER / Grupa F: testy lane D w bramce

**Status:** GOTOWE — czeka wykonanie Master Silnik  
**Data:** 2026-06-27  
**Decyzja Macieja:** **7B** — testy lokalnie u Macieja pominięte; **Master uruchamia w bramce ROBOCZA**

---

## Co przesyłam

Po paczce ABC Grupa D (1A–7B) lane CYWILIZACJE prosi o **jawną bramkę testów** przed / w ramach `bramka-test-publish.ps1`:

```powershell
cd gra
node tools/civ-bonusy-test.cjs    # bonusy RDY-01 (ekonomia + walka + budynki)
node tools/diplomacy-test.cjs     # dyplomacja v0.1 (119+ asercji)
node tools/ai-test.cjs            # AI decideAITurn + trudność
node tools/research-test.cjs      # chooseAIResearch (opcjonalnie)
```

**Kontekst:** RDY-01 bonusów częściowo wpięte (`civ-bonuses.ts`, `combat.ts`, `economy.ts`, `production.ts`, `main.ts`). Religie 9/9 uzupełnione w `society-params.json` (Celtowie + Germanie).

---

## Co Odbiorca ma zrobić

1. **Grupa F / Master:** dodać powyższe 3–4 suite'y do bramki (lub uruchomić ręcznie przed ROBOCZA).
2. Przy **FAIL** — meldunek w `SILNIK-DO-MASTERA.md` + eskalacja do lane CYWILIZACJE / UNITS / UI.
3. Przy **PASS** — wpis w `DO-MASTERA.md` § Grupa D: `TESTY-GR-D: ZIELONE`.

**NIE** publikować kanonu `Gra-podglad.html` bez tych testów po batchu bonusów/dyplomacji.

---

## DoD

- [ ] `civ-bonusy-test.cjs` — 0 FAIL
- [ ] `diplomacy-test.cjs` — 0 FAIL
- [ ] `ai-test.cjs` — 0 FAIL
- [ ] Wynik zapisany w dzienniku / DO-MASTERA

---

*Od: Grupa D / CYWILIZACJE · Maciej: 7B*
