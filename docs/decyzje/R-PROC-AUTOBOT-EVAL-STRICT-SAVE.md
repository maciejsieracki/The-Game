# R-PROC-AUTOBOT-EVAL-STRICT-SAVE — Evaluator: FAIL przy lukach save/load

**Status:** 🟢 **OBOWIĄZUJE** · 2026-08-05  
**Rodzic:** `R-PROC-AUTOBOT-EVAL-STRICT` + `R-PROC-AUTOBOT-EVAL-STRICT-EDGE` + `R-PROC-AUTOBOT-EVAL-STRICT-PARITY`  
**Reguła Cursor:** `.cursor/rules/autobot-evaluator-operator.mdc`  
**Playbook:** `dyspozycje/autobot/playbook.json` → `rule_109` (`verify-eval-strict-save`)

---

## ECHO (Maciej — cytat do zachowania)

> Maciej wybrał **„1+2”**: równolegle z torami gry — **oś B Evaluator = save/load** nowych pól. Nowe trwałe pole stanu bez snapshot/restore lub bez bezpiecznych defaultów → FAIL.

---

## Cel

Rozszerzenie `R-PROC-AUTOBOT-EVAL-STRICT` + siostry EDGE/PARITY: **STRICT-SAVE** FAIL gdy paczka dodaje lub zmienia trwały stan gry bez pełnej ścieżki persistence (zapis w snapshot save **i** restore z `?? default`), lub gdy Operator deklaruje „save OK” bez roundtrip / bez wskazania miejsca snapshot/restore.

**Powiązanie:** `R-PROC-AUTOBOT-EVAL-SCOPE` = SCOPE + regresja diffu; **STRICT** = twardość przy braku testów; **STRICT-EDGE** = happy-path-only; **STRICT-PARITY** = asymetria gracz/AI/MP; **STRICT-SAVE** = luki save/load.

---

## FAIL #9 (twarde — OBOWIĄZKOWO, nie NOTES)

1. **Nowe trwałe pole stanu gry** (Map/meta w `main.ts`, pola city/unit, rejestry dyplomacji, meta tur, flagi AI) **bez** zapisu w snapshot save **i/lub** **bez** restore z bezpiecznymi defaultami (`?? default`, `?? []`, `?? 0` itd.).
2. **Restore zakłada obecność pola** bez `?? default` → ryzyko crash / undefined behavior po load starego save lub partial snapshot.
3. **Operator deklaruje „save OK”** bez asercji roundtrip (gdy temat dotyczy persistence) **lub** bez wskazania miejsca snapshot/restore w raporcie (plik + funkcja / test harness).

**ZAKAZ:** PASS lub PASS-WITH-NOTES „bo działa w nowej grze, load później” / „dodaliśmy pole, save w następnej paczce”.

---

## Wyjątki (NOTES lub OK — wąska lista)

| Przypadek | Werdykt |
|-----------|---------|
| Czyste UI bez stanu (string, layout, CSS) — zero nowych pól w `GameState` / snapshot | OK |
| Efemeryczny cache sesji (nie w save, jawny komentarz „nie persistujemy”) | OK |
| Czysta docs / proces (zero `gra/src`) | OK |
| Jawny AC „nie persistujemy” / GATE=A wyłącznie wizualny | OK |
| Pre-existing baseline poza tematem (dowód `main`) | PASS-WITH-NOTES |

---

## Checklista Evaluator (STRICT-SAVE — dodatek do STRICT + EDGE + PARITY)

- [ ] Czy diff dodaje/zmienia pole trwałe w stanie gry? Jeśli tak — czy jest zapis w snapshot save?
- [ ] Czy restore używa `?? default` (lub równoważny guard) dla nowego pola?
- [ ] Czy jest test roundtrip save→load **lub** jawne wskazanie snapshot/restore w raporcie Operatora?
- [ ] Przy luce save/load → **FAIL #9** (nie NOTES), chyba że wyjątek z tabeli powyżej.
- [ ] Czy `tsc --noEmit` = 0 i testy tematu zielone (STRICT bazowy)?

---

## Szablon do promptów Evaluatora (Grok — punkt 8 STRICT-SAVE)

Dopisz do szablonu SCOPE + STRICT + STRICT-EDGE + STRICT-PARITY:

```
8. Nowe trwałe pole stanu bez snapshot save i/lub restore bez ?? default → FAIL #9 (STRICT-SAVE, nie NOTES).
   Operator bez roundtrip / bez wskazania snapshot/restore w raporcie (gdy temat = persistence) → FAIL #9.
   Wyjątki: czyste UI bez stanu; efemeryczny cache sesji; docs/proces; jawny „nie persistujemy” w AC.
```

---

## Powiązania

- `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` — rodzic (FAIL #1–#8)
- `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md` — FAIL #7 happy-path-only
- `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-PARITY.md` — FAIL #8 asymetria gracz/AI/MP
- `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` — SCOPE + regresja diffu
- `docs/decyzje/R-PROC-POTROJNA-WARSTWA.md` — warstwa 2
- `dyspozycje/autobot/playbook.json` — `rule_106`, `rule_107`, `rule_108`, `rule_109`
- `.cursor/rules/autobot-evaluator-operator.mdc` — reguła Cursor
- `.cursor/rules/potrojna-warstwa-weryfikacji.mdc` — checklist save/load
