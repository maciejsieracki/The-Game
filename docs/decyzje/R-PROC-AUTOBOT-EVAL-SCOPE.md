# R-PROC-AUTOBOT-EVAL-SCOPE — Evaluator: SCOPE + brak regresji

**Status:** 🟢 **OBOWIĄZUJE** (Maciej 2026-08-05)  
**Rodzic:** `R-PROC-AUTOBOT` · **Reguła Cursor:** `.cursor/rules/autobot-evaluator-operator.mdc`  
**Playbook:** `dyspozycje/autobot/playbook.json` → `rule_105` (`verify-eval-scope-no-regression`)  
**Twardość werdyktów:** → [`R-PROC-AUTOBOT-EVAL-STRICT.md`](R-PROC-AUTOBOT-EVAL-STRICT.md) (`rule_106`)

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

> **Twardość werdyktów (od 2026-08-05):** pełna tabela FAIL / PASS-WITH-NOTES / PASS → [`R-PROC-AUTOBOT-EVAL-STRICT.md`](R-PROC-AUTOBOT-EVAL-STRICT.md). Poniżej skrót SCOPE; luki testów i brak asercji AC → **FAIL** (nie NOTES).

| Werdykt | Kiedy (SCOPE + STRICT) |
|---------|------------------------|
| **FAIL** | Uboczna zmiana **psuje** inny temat; cofnięcie wcześniejszego fixu; diff **wyraźnie** szerszy niż AC bez uzasadnienia; **brak celowanego testu/asercji** dla zmienionej logiki; **testy tematu czerwone**; **`tsc≠0`**; SCOPE gameplay bez handoffu — patrz STRICT §FAIL |
| **PASS-WITH-NOTES** | **Tylko wąskie wyjątki STRICT:** pre-existing baseline poza tematem; docs drift; cross-lane z handoffem; GATE=A wizual; drift procesu — **nie** „brakuje testu, ale OK” |
| **PASS** | Wszystkie 4 osie (SCOPE / DIFF-MINIMAL / REGRESSION / COUPLING) + twarde testy tematu zielone + brak luk AC (STRICT) |

**ZAKAZ:** PASS przy znanym naruszeniu SCOPE „bo reszta OK”. **ZAKAZ:** PASS-WITH-NOTES przy luce testów / braku asercji AC („wygląda OK”).

---

## Szablon do promptów Evaluatora (Grok wkleja 5–8 linii)

```
### SCOPE + regresja + STRICT (OBOWIĄZKOWE — Maciej)
1. Czy każda zmiana w diffie wynika wprost z problemu/AC tematu? (nie „przy okazji”)
2. Czy paczka nie rusza niezwiązanych plików/funkcji?
3. Czy nie cofa wcześniejszych usprawnień / nie psuje innych tematów?
4. Przy NIE SCOPE → FAIL lub PASS-WITH-NOTES z listą ubocznych ryzyk (nie akceptuj cicho).
5. Luki testów / brak asercji AC / czerwone testy tematu / tsc≠0 → FAIL (nie NOTES).
   PASS-WITH-NOTES tylko: pre-existing baseline poza tematem, docs drift, GATE=A wizual, handoff OK.
```

**Grok — prompt Evaluatora (szkielet):**

```
Jesteś Evaluatorem AutoBot (adwokat diabła). Temat: <ID> — <jedno zdanie AC>.
Sprawdź diff Operatora pod kątem SCOPE + regresji (R-PROC-AUTOBOT-EVAL-SCOPE)
oraz twardości werdyktów (R-PROC-AUTOBOT-EVAL-STRICT).
Użyj checklisty 5 pytań powyżej. Werdykt: PASS | PASS-WITH-NOTES | FAIL.
Przy PASS-WITH-NOTES/FAIL: wypisz konkretne pliki/linie, luki testów lub ryzyka regresji.
Brak celowanego testu dla zmienionej logiki → FAIL (nie NOTES).
Nie zamykaj paczki bez werdyktu SCOPE + STRICT.
```

---

## Powiązania

- `docs/decyzje/R-PROC-AUTOBOT.md` — mapowanie Evaluator + checklista
- `docs/decyzje/R-PROC-POTROJNA-WARSTWA.md` — warstwa 2 = ten sam adwokat
- `dyspozycje/POTROJNA-WARSTWA-WERYFIKACJI.md` — operacyjnie
- `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` — twardość werdyktów (FAIL vs NOTES)
- `dyspozycje/autobot/playbook.json` — `rule_105`, `rule_106`

---

## Evaluator (adwokat diabła — 2026-08-05)

**Werdykt:** **PASS-WITH-NOTES**

**Tip:** `904caf2` · branch `cursor/autobot-eval-scope-63a1`

### Meta (SCOPE na własnym pakiecie)

| Oś | Wynik |
|----|-------|
| **SCOPE** | ✅ Tylko proces Evaluator SCOPE — 9 plików docs/playbook/reguła; **zero** `gra/src` |
| **NO-SIDE-EFFECT** | ✅ Brak drive-by; KANAL/rejestr/README = uzasadnione powiązania tematu |
| **NO-REGRESSION** | ✅ Nie cofa P0 AutoBot ani potrójnej warstwy — rozszerza checklistę #2 |
| **DIFF-MINIMAL** | ✅ +161/−7 linii; bez refaktorów obok tematu |

### Spot-check

| Plik | PASS? | Uwagi |
|------|-------|-------|
| `R-PROC-AUTOBOT-EVAL-SCOPE.md` | ✅ | ECHO cytat Macieja 1:1; 4 osie; FAIL/PASS-WITH-NOTES/PASS; szablon promptu Grok |
| `autobot-evaluator-operator.mdc` | ✅ | Sekcja „Evaluator — obowiązkowy SCOPE + regresja" czytelna; rule_105 |
| `R-PROC-AUTOBOT.md` | ✅ | Mapowanie Evaluator + checklista rule_105 |
| `playbook.json` rule_105 | ✅ | ACTIVE; sensowny `rule_text`; `verify-eval-scope-no-regression` |
| Potrójna docs | ✅ | `R-PROC-POTROJNA-WARSTWA.md` + `POTROJNA-WARSTWA-WERYFIKACJI.md` zsynchronizowane |
| Rejestr | ✅ | Wiersz `R-PROC-AUTOBOT-EVAL-SCOPE` spójny (→ zaktualizowany poniżej) |

### Notes (nie blocker)

1. `.cursor/rules/potrojna-warstwa-weryfikacji.mdc` (alwaysApply) **nie** dostał odnośnika do `R-PROC-AUTOBOT-EVAL-SCOPE` — drift vs `POTROJNA-WARSTWA-WERYFIKACJI.md`; follow-up przy merge Groka (1 linia w checklist #2).
2. `actionId` `verify-eval-scope-no-regression` **brak** w `guardrails.ts` CATALOG (wzorzec: `verify-triple-layer` jest) — follow-up scaffold, nie blokuje procedury promptowej Evaluatora.

**Gotowe do Grok final** — merge `main` + ewentualne dopięcie notes 1–2 w osobnej mikropaczce.
