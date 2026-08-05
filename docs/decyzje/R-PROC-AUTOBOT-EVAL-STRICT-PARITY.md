# R-PROC-AUTOBOT-EVAL-STRICT-PARITY — Evaluator: FAIL przy asymetrii gracz / AI / MP

**Status:** 🟢 **OBOWIĄZUJE** · 2026-08-05  
**Rodzic:** `R-PROC-AUTOBOT-EVAL-STRICT` + `R-PROC-AUTOBOT-EVAL-STRICT-EDGE`  
**Reguła Cursor:** `.cursor/rules/autobot-evaluator-operator.mdc`  
**Playbook:** `dyspozycje/autobot/playbook.json` → `rule_108` (`verify-eval-strict-parity`)

---

## ECHO (Maciej — cytat do zachowania)

> Maciej wybrał z propozycji osi Evaluatora opcję **„2 = Tylko A (parytet)”**: Evaluator ma twarde FAIL przy asymetrii **gracz vs major AI vs MP** / `ownerId === 0` bez decyzji ABC i bez testu obu stron.

---

## Cel

Rozszerzenie `R-PROC-AUTOBOT-EVAL-STRICT` + `STRICT-EDGE`: **STRICT** FAIL przy braku testów; **STRICT-EDGE** FAIL przy happy-path-only; **STRICT-PARITY** FAIL gdy logika wspólna rozgałęzia się na `ownerId` / `isPlayer` bez jawnej decyzji lub bez testu parytetu (ta sama asercja dla owner 0 i owner N / major).

**Powiązanie:** `R-PROC-AUTOBOT-EVAL-SCOPE` = SCOPE + regresja diffu; **STRICT** = twardość przy braku testów; **STRICT-EDGE** = happy-path-only; **STRICT-PARITY** = asymetria gracz/AI/MP.

---

## FAIL #8 (twarde — OBOWIĄZKOWO, nie NOTES)

1. **Nowa/zmieniona logika gameplay** (ekonomia, produkcja, walka, dyplo, Wiarygodność, growth, upkeep, research, AI `choose*`) zawiera gałąź `ownerId === 0` / `!== 0` / `isPlayer` **bez** jawnej decyzji ABC / cytatu Macieja w handoffie **lub** bez testu parytetu (ta sama asercja dla owner 0 i owner N / major).
2. **Fix „dla gracza”** w module owner-agnostic, a AI/MP nie dostaje tej samej ścieżki (lub odwrotnie) — bez uzasadnienia w decyzji / komentarzu diffu.
3. **Test tematu pokrywa tylko `ownerId=0`** przy zmianie logiki wspólnej — brak asercji dla owner N (major AI) lub MP.

**ZAKAZ:** PASS lub PASS-WITH-NOTES „bo gracz działa, AI później” / „tylko player test”.

---

## Wyjątki (NOTES lub OK — wąska lista)

| Przypadek | Werdykt |
|-----------|---------|
| UI-only HUD gracza (panel miasta gracza, input klawiatury) bez zmiany silnika shared | OK |
| Jawny ECHO „tylko gracz” / „tylko AI” w decyzji ABC z cytatem Macieja | OK |
| MP celowo inne (army cap, difficulty itd.) **z** ID decyzji w diffie/komentarzu | OK |
| Czysta docs / proces (zero `gra/src`) | OK |
| Pre-existing baseline poza tematem (dowód `main`) | PASS-WITH-NOTES |

---

## Checklista Evaluator (STRICT-PARITY — dodatek do STRICT + EDGE)

- [ ] Czy diff w logice wspólnej zawiera gałąź `ownerId` / `isPlayer`? Jeśli tak — czy jest decyzja ABC lub test parytetu?
- [ ] Czy fix dotyczy gracza i AI/MP jednakowo (lub ma jawne uzasadnienie asymetrii)?
- [ ] Czy test tematu asertuje **obie** strony (owner 0 **i** owner N / major), nie tylko gracza?
- [ ] Przy asymetrii bez decyzji → **FAIL #8** (nie NOTES), chyba że wyjątek z tabeli powyżej.
- [ ] Czy `tsc --noEmit` = 0 i testy tematu zielone (STRICT bazowy)?

---

## Szablon do promptów Evaluatora (Grok — punkt 7 STRICT-PARITY)

Dopisz do szablonu SCOPE + STRICT + STRICT-EDGE:

```
7. Asymetria gracz/AI/MP (ownerId === 0 / isPlayer) bez decyzji ABC lub bez testu parytetu → FAIL #8 (nie NOTES).
   Wyjątki: UI-only HUD gracza; jawny ECHO „tylko gracz/AI”; MP celowo inne z ID decyzji; czysta docs/proces.
```

---

## Powiązania

- `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT.md` — rodzic (FAIL #1–#6)
- `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md` — FAIL #7 happy-path-only
- `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md` — SCOPE + regresja diffu
- `docs/decyzje/R-PROC-POTROJNA-WARSTWA.md` — warstwa 2
- `dyspozycje/autobot/playbook.json` — `rule_106`, `rule_107`, `rule_108`
- `.cursor/rules/autobot-evaluator-operator.mdc` — reguła Cursor
- `.cursor/rules/potrojna-warstwa-weryfikacji.mdc` — checklist parytet AI/MP
