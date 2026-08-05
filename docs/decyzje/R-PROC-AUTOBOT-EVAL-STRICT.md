# R-PROC-AUTOBOT-EVAL-STRICT — Evaluator: twardsze werdykty (FAIL zamiast NOTES)

**Status:** 🟢 **OBOWIĄZUJE** · 2026-08-05  
**Rodzic:** `R-PROC-AUTOBOT-EVAL-SCOPE` · **Reguła Cursor:** `.cursor/rules/autobot-evaluator-operator.mdc`  
**Playbook:** `dyspozycje/autobot/playbook.json` → `rule_106` (`verify-eval-strict-tests`)

---

## ECHO (Maciej — cytat do zachowania)

> Maciej wybrał opcję **„2”**: twardszy Evaluator — **więcej FAIL zamiast PASS-WITH-NOTES** przy lukach w testach. Evaluator częściej zatrzymuje paczkę (FAIL), gdy brakuje realnych testów / luk w pokryciu AC, a nie „puszcza z NOTES”.

---

## Cel

Uściślić werdykty warstwy 2 (Evaluator AutoBot): **luki testów i brak asercji AC → FAIL**, nie PASS-WITH-NOTES „bo wygląda OK”. PASS-WITH-NOTES zostaje tylko dla wąskiej listy wyjątków procesowych.

**Powiązanie:** `R-PROC-AUTOBOT-EVAL-SCOPE` = SCOPE + regresja diffu; **STRICT** = twardość werdyktów przy testach i pokryciu AC.

---

## FAIL (twarde) vs PASS-WITH-NOTES (wąskie) vs PASS

| Werdykt | Kiedy |
|---------|--------|
| **FAIL** | Patrz lista poniżej — **OBOWIĄZKOWO**, nie NOTES |
| **PASS-WITH-NOTES** | Tylko wąskie wyjątki procesowe (patrz lista poniżej) |
| **PASS** | Wszystkie osie SCOPE + twarde testy tematu zielone + brak luk AC |

### FAIL (OBOWIĄZKOWO — nie NOTES)

1. **Brak celowanego testu / asercji** dla nowej lub zmienionej logiki gry (AC weryfikowalny automatycznie). „Przetestujemy playtestem” **nie** zastępuje — chyba że Maciej jawnie GATE=A **i** AC jest wyłącznie wizualny.
2. **Testy tematu czerwone** (FAIL harnessu zlecenia) — nie mylić z pre-existing unrelated.
3. **`tsc --noEmit` ≠ 0**.
4. **Diff rusza logikę gry** bez nowej/rozszerzonej asercji na krytyczny AC (tylko happy-path gdy bug był regresją / edge).
5. **Naruszenie SCOPE:** niezwiązany plik/funkcja gameplay **bez** uzasadnionego handoffu → FAIL (nie NOTES).
6. **Cofnięcie wcześniejszego fixu** / regresja w sąsiednim zachowaniu z dowodem.

### PASS-WITH-NOTES (tylko te wąskie przypadki)

- Pre-existing faili w dużym suite **poza** tematem, z dowodem baseline (`main` miał to samo) — **nie** ukrywać nowych faili.
- Stale docs / drift dokumentacji nieblokujący kodu.
- Cross-lane z **uzasadnionym** handoffem Integratora (plik poza lane, ale kontrakt OK).
- Ryzyko wizualne / playtest (GATE=A) — nazwany punkt, bez blokady kodu.
- Drobny drift procesu (np. brak 1 linii w alwaysApply) — follow-up, nie kod gry.

### PASS

Wszystkie osie SCOPE (z `R-PROC-AUTOBOT-EVAL-SCOPE`) + twarde testy tematu zielone + brak luk AC.

**ZAKAZ:** Evaluator **nie** daje PASS-WITH-NOTES „bo brakuje testu, ale wygląda OK”.

---

## Checklista Evaluator (STRICT — dodatek do SCOPE)

- [ ] Czy każdy krytyczny AC ma **celowaną** asercję lub test tematu (nie tylko „playtest później”)?
- [ ] Czy testy **tematu** są zielone (nie tylko unrelated suite)?
- [ ] Czy `tsc --noEmit` = 0?
- [ ] Czy zmiana logiki gry ma rozszerzoną asercję (nie tylko happy-path bez edge)?
- [ ] Przy luce testów → **FAIL** (nie NOTES), chyba że GATE=A wyłącznie wizualny.

---

## Szablon do promptów Evaluatora (Grok — punkt 5 STRICT)

Dopisz do szablonu SCOPE (`R-PROC-AUTOBOT-EVAL-SCOPE.md`):

```
5. Luki testów / brak asercji AC / czerwone testy tematu / tsc≠0 → FAIL (nie NOTES).
   PASS-WITH-NOTES tylko: pre-existing baseline poza tematem, docs drift, GATE=A wizual, handoff OK.
```

---

## Powiązania

- `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` — SCOPE + regresja diffu
- `docs/decyzje/R-PROC-AUTOBOT.md` — mapowanie Evaluator
- `docs/decyzje/R-PROC-POTROJNA-WARSTWA.md` — warstwa 2
- `dyspozycje/autobot/playbook.json` — `rule_105`, `rule_106`

---

## Evaluator (re-run po NOTES — 2026-08-05)

Pierwszy przebieg: **PASS-WITH-NOTES** (smoke `pb.version===3` vs playbook v4; brak STRICT w `potrojna-warstwa-weryfikacji.mdc`).

**Dociągnięte przed merge:**
- `autobot-smoke.cjs` → `version === 4` · **10/10 PASS**
- `.cursor/rules/potrojna-warstwa-weryfikacji.mdc` → odnośnik STRICT + rule_106 + FAIL przy lukach testów

**Werdykt Grok final:** PASS · merge na `main` · **bez** deploy ROBOCZA.
