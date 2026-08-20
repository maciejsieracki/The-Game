# AutoBot — schemat działania (referencyjny)

**Status:** REFERENCYJNY — aktywny routing i hierarchia są w
[`docs/procesy/INDEX-PROCESU.md`](../docs/procesy/INDEX-PROCESU.md).

Ten plik zachowuje odsyłacz dla starszych wejść. Nie powiela pełnego procesu i nie
rozstrzyga konfliktów. Czytaj:

- [INDEX-PROCESU.md](../docs/procesy/INDEX-PROCESU.md) — routing, GOAL, pętla, dowody,
  integracja i deploy/push;
- [R-PROC-AUTOBOT.md](../docs/decyzje/R-PROC-AUTOBOT.md) — pełny opis dla człowieka;
- [`.claude/skills/civ-autobot/SKILL.md`](../.claude/skills/civ-autobot/SKILL.md) — instrukcja skill;
- [`.cursor/rules/autobot-evaluator-operator.mdc`](../.cursor/rules/autobot-evaluator-operator.mdc) —
  aktywna reguła techniczna.

Skrót routingu: **Operator High → Evaluator High → Final Control High → integracja
orkiestratora Medium → `READY_FOR_DEPLOY` → osobna bramka deploy/push**.

C-043, ABC, izolacja, allowlista i ciągła pętla obowiązują według indeksu. Historyczny
snapshot tego schematu zachowano w
[`docs/archiwum-procesu/PAKIET-2-HISTORIA-AKTYWNYCH-DOKUMENTOW.md`](../docs/archiwum-procesu/PAKIET-2-HISTORIA-AKTYWNYCH-DOKUMENTOW.md).
