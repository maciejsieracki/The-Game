# R-PROC-AUTOBOT-EVAL-SCOPE — Evaluator: SCOPE + brak regresji

**Status:** 🔵 **Operator done** · czeka **Evaluator** (Maciej 2026-08-05)  
**Rodzic:** `R-PROC-AUTOBOT` · **Reguła Cursor:** `.cursor/rules/autobot-evaluator-operator.mdc`  
**Playbook:** `dyspozycje/autobot/playbook.json` → `rule_105` (`verify-eval-scope-no-regression`)

---

## ECHO (Maciej — cytat do zachowania)

> dodałbym jeszcze jedną kwestię, żeby weryfikował czy proponowane zmiany odnoszą się ściśle do problemu, który napotkaliśmy lub błędu i nie spowodują zmian w innym miejscu lub ewentualnie problemu w innym miejscu lub nawet cofnięcia i regresów w innych kwestiach, żeby temat kodu dotyczył głównie tematu, który jest poruszany, a nie zmieniał innych rzeczy, bo to często ma miejsce.

---

## Cel

Twarde kryterium **Evaluatora** (warstwa 2 AutoBot / adwokat diabła):

| ID | Kryterium | Znaczenie |
|----|-----------|-----------|
| **SCOPE** | Diff odnosi się **ściśle** do zgłoszonego problemu / błędu / AC tematu | Każda linia musi wynikać z AC — nie „przy okazji” |
| **NO-SIDE-EFFECT** | Brak niepotrzebnych zmian w innych miejscach | Nie ruszać niezwiązanych plików/funkcji |
| **NO-REGRESSION** | Nie cofać wcześniejszych usprawnień ani nie psuć innych tematów | Szczególnie: wcześniejsze fixy, inne lane’y, UI vs logika |

**Przy naruszeniu:** Evaluator → **FAIL** albo minimum **PASS-WITH-NOTES** z listą blockerów. **ZAKAZ** „przymknąć oko” i dać czyste PASS.

---

## Checklista Evaluator (OBOWIĄZKOWA)

### SCOPE

- [ ] Każda zmiana w diffie wynika wprost z problemu / AC / cytatu błędu?
- [ ] Brak refaktorów „przy okazji”, formatowania, rename bez związku z tematem?
- [ ] Pliki poza lane’em / modułem tematu — uzasadnione kontraktem cross-lane (jeśli tak → PASS-WITH-NOTES z uzasadnieniem)?

### DIFF-MINIMAL

- [ ] Paczka jest najmniejszą sensowną poprawką (nie szerszy refactor)?
- [ ] Brak edycji `main.ts` / cudzych modułów bez handoffu Integratora?

### REGRESSION

- [ ] Czy fix **nie usuwa / nie wyłącza** wcześniejszej poprawki (grep historii / komentarze / testy regresji)?
- [ ] Czy nie psuje sąsiedniego zachowania (gracz vs AI, EOT, zapis, HUD, inny ekran)?
- [ ] Czy testy łapią realny bug, nie tylko happy-path?

### COUPLING

- [ ] Czy zmiana nie wprowadza nowego sprzężenia (wspólny stan, render, save) poza deklarowanym zakresem?
- [ ] Jeśli dotyka współdzielonego kodu → 🟡 cross-layer + lista „co sprawdzić po wpięciu”?

---

## FAIL vs PASS-WITH-NOTES vs PASS

| Werdykt | Kiedy |
|---------|--------|
| **FAIL** | Uboczna zmiana **psuje** inny temat; cofnięcie wcześniejszego fixu; diff **wyraźnie** szerszy niż AC bez uzasadnienia; brak testu tam, gdzie regresja była realna |
| **PASS-WITH-NOTES** | Drobne ryzyko uboczne **z nazwanymi** punktami do weryfikacji Groka; plik cross-lane z uzasadnionym handoffem; brak pewności co do regresji — **blocker** w notes, nie cisza |
| **PASS** | Wszystkie 4 osie (SCOPE / DIFF-MINIMAL / REGRESSION / COUPLING) spełnione; diff czytelnie „tylko temat” |

**ZAKAZ:** PASS przy znanym naruszeniu SCOPE „bo reszta OK”.

---

## Szablon do promptów Evaluatora (Grok wkleja 5–8 linii)

```
### SCOPE + regresja (OBOWIĄZKOWE — Maciej)
1. Czy każda zmiana w diffie wynika wprost z problemu/AC tematu? (nie „przy okazji”)
2. Czy paczka nie rusza niezwiązanych plików/funkcji?
3. Czy nie cofa wcześniejszych usprawnień / nie psuje innych tematów?
4. Przy NIE → FAIL lub PASS-WITH-NOTES z listą ubocznych ryzyk (nie akceptuj cicho).
```

**Grok — prompt Evaluatora (szkielet):**

```
Jesteś Evaluatorem AutoBot (adwokat diabła). Temat: <ID> — <jedno zdanie AC>.
Sprawdź diff Operatora pod kątem SCOPE + regresji (R-PROC-AUTOBOT-EVAL-SCOPE).
Użyj checklisty 4 pytań powyżej. Werdykt: PASS | PASS-WITH-NOTES | FAIL.
Przy PASS-WITH-NOTES/FAIL: wypisz konkretne pliki/linie uboczne lub ryzyka regresji.
Nie zamykaj paczki bez werdyktu SCOPE.
```

---

## Powiązania

- `docs/decyzje/R-PROC-AUTOBOT.md` — mapowanie Evaluator + checklista
- `docs/decyzje/R-PROC-POTROJNA-WARSTWA.md` — warstwa 2 = ten sam adwokat
- `dyspozycje/POTROJNA-WARSTWA-WERYFIKACJI.md` — operacyjnie
- `dyspozycje/autobot/playbook.json` — `rule_105`
