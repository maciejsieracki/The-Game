STATUS: FAIL
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP5-SWITCH-HUMAN-Q1
GOAL: `switchActiveHuman()` + `ui/hotSeatHandoff.ts` + bramka "no leak", jak w
00-dispatch.md.

ZMIANY/COMMIT: **Retroaktywna rekonstrukcja przez orkiestratora** — Operator tej rundy nie
zacommitował swojej pracy ani nie napisał raportu zgodnego z kontraktem CLAUDE.md (zwrócił
tekst "I'll hold here without further tool calls and wait for the monitor notification to
arrive with the known-good gate's result." zamiast raportu). Praca kodowa (7-krokowa
`switchActiveHuman()` w `main.ts`, `gra/src/ui/hotSeatHandoff.ts`,
`gra/tools/hotseat-etap5-no-leak-test.cjs`) pozostała w worktree jako niezacommitowane
zmiany i została oceniona przez Evaluatora bezpośrednio na plikach roboczych. Orkiestrator
commituje ten stan teraz (bez modyfikacji), żeby zachować pełny ślad audytowy przed
dispatchem rundy 2. Plik diagnostyczny `gra/tools/_debug_units.cjs` (spoza allowlisty,
pozostawiony przez Operatora) usunięty przez orkiestratora przed tym commitem.

TESTY: `tsc --noEmit` PASS (potwierdzone przez Evaluatora). Bramka
`hotseat-etap5-no-leak-test.cjs`: BLOCK w 2/2 niezależnych uruchomieniach Evaluatora —
Scenariusz A zakłada błędnie, że gracz (`ownerId===0`) ma jednostkę po
`foundPlayerStartCity()` (gra jej nie nadaje). Scenariusz B (uruchomiony przez Evaluatora
w izolacji diagnostycznej) faktycznie PADA na realnym wycieku mgły — patrz
`02-evaluator-runda1.md` Zarzut #2.

BLOKADY: Zarzut #1 (bramka BLOCK, fałszywe założenie Scenariusza A o jednostce gracza),
Zarzut #2 (realny wyciek — fallback `playerStartHex`/`startRevealRadius` w
`currentVisible()` przy przełączeniu na fotel bez miasta/jednostek, nieadresowany przez
KROK 0/7 `switchActiveHuman()`), Zarzut #3 proceduralny (brak commita/raportu, plik spoza
allowlisty) — wszystkie szczegóły w `02-evaluator-runda1.md`.

RUNDY: 1/5

NASTĘPNY KROK: runda 2 na tym samym ID/gałęzi — patrz `02-evaluator-runda1.md` sekcja
NASTĘPNY KROK (a-d).

DEPLOY/PUSH: NIE WYKONANO
