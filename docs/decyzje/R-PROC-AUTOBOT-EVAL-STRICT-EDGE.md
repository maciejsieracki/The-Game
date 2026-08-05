# R-PROC-AUTOBOT-EVAL-STRICT-EDGE — Evaluator: FAIL przy samym happy-path

**Status:** 🟢 **OBOWIĄZUJE** · 2026-08-05  
**Rodzic:** `R-PROC-AUTOBOT-EVAL-STRICT` · **Siostra:** [`R-PROC-AUTOBOT-EVAL-STRICT-PARITY`](R-PROC-AUTOBOT-EVAL-STRICT-PARITY.md) (`rule_108`)  
**Reguła Cursor:** `.cursor/rules/autobot-evaluator-operator.mdc`  
**Playbook:** `dyspozycje/autobot/playbook.json` → `rule_107` (`verify-eval-strict-edge`)

---

## ECHO (Maciej — cytat do zachowania)

> Maciej wybrał opcję **„2 Jeszcze twardszy Evaluator”**: FAIL także gdy testy to **tylko happy-path bez edge / negacji / regresji**. Obecność testu nie wystarczy, jeśli nie łapie edge/buga.

---

## Cel

Rozszerzenie `R-PROC-AUTOBOT-EVAL-STRICT`: **STRICT** już FAIL przy braku testów; **STRICT-EDGE** FAIL gdy test istnieje, ale pokrywa wyłącznie ścieżkę szczęśliwą — bez asercji na edge, negację lub repro zgłoszonego buga.

**Powiązanie:** `R-PROC-AUTOBOT-EVAL-SCOPE` = SCOPE + regresja diffu; **STRICT** = twardość przy braku testów; **STRICT-EDGE** = twardość przy happy-path-only.

---

## FAIL #7 (twarde — OBOWIĄZKOWO, nie NOTES)

Zmiana logiki gry / pure helpera z AC weryfikowalnym automatycznie, a nowe lub zmienione testy tematu pokrywają **wyłącznie happy-path** — brak asercji na:

1. **Edge** — wartości graniczne: `0` / `max` / `clamp` / `undefined` / pusta lista / pusty string / brak klucza.
2. **Negację** — odrzucenie / zabraniająca ścieżka / wartość ujemna gdy dotyczy / `false` gdy warunek nie spełniony.
3. **Regresję zgłoszonego buga** — repro przed→po (asercja, która by padła na starym kodzie i przechodzi na nowym).

**ZAKAZ:** PASS lub PASS-WITH-NOTES „bo jest test, ale tylko happy-path”.

---

## Wyjątki (NOTES lub OK — wąska lista)

| Przypadek | Werdykt |
|-----------|---------|
| GATE=A — AC **wyłącznie wizualny** (brak asercji automatycznej) | OK / PASS-WITH-NOTES z nazwanym punktem wizualnym |
| Czysta docs / proces (zero `gra/src`) | OK |
| Smoke „istnienia eksportu” dla thin UI stringów, gdy **osobny** test pure helpera już ma edge (np. badge ±) | OK |
| Pre-existing baseline poza tematem (dowód `main`) | PASS-WITH-NOTES |

---

## Checklista Evaluator (STRICT-EDGE — dodatek do STRICT)

- [ ] Czy każdy nowy/zmieniony test tematu ma **co najmniej jedną** asercję edge, negacji lub repro buga (nie tylko „działa w normie”)?
- [ ] Czy bug zgłoszony w AC ma asercję, która **padłaby** na kodzie sprzed fixu?
- [ ] Przy samym happy-path → **FAIL #7** (nie NOTES), chyba że wyjątek z tabeli powyżej.
- [ ] Czy `tsc --noEmit` = 0 i testy tematu zielone (STRICT bazowy)?

---

## Szablon do promptów Evaluatora (Grok — punkt 6 STRICT-EDGE)

Dopisz do szablonu SCOPE + STRICT:

```
6. Testy tematu tylko happy-path bez edge/negacji/repro buga → FAIL #7 (nie NOTES).
   Wyjątki: GATE=A wyłącznie wizual; czysta docs/proces; smoke eksportu UI gdy helper ma edge.
```

---

## Powiązania

- `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` — rodzic (FAIL #1–#6)
- `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` — SCOPE + regresja diffu
- `docs/decyzje/R-PROC-POTROJNA-WARSTWA.md` — warstwa 2
- `dyspozycje/autobot/playbook.json` — `rule_106`, `rule_107`
- `.cursor/rules/autobot-evaluator-operator.mdc` — reguła Cursor
- `.cursor/rules/potrojna-warstwa-weryfikacji.mdc` — checklist #5
