# R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1 — dispatch (2026-11-13)

GOAL (decyzja właściciela 2026-11-13, krok 1 z 4): w czasie wojny obniżane jest wyłącznie ZAUFANIE (do zera). Relacja (zaufanie + respekt) NIE jest już obcinana do 29, a respekt nie jest ruszany z powodu wojny. Ocena pokoju korzysta z prawdziwego (nieobciętego) poziomu relacji. Szczegóły: DODATEK (00-dispatch-DODATEK-claude.md na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0).

BAZA: origin/main 5d0c5f8d1. Operator: HAIKU. Evaluator/FC: SONNET.
ALLOWLISTA: gra/src/game/diplomacy.ts, gra/src/game/diplomacy-proposals.ts, gra/src/game/diplomacy-display.ts, gra/src/game/diplomacy-ai-offer-balance.ts (tylko komentarze), gra/src/ui/diplomacyAudience.ts (tylko tekst notatki o limicie wojennym), istniejące testy w gra/tools/*.cjs wymieniające limit wojenny (tylko asercje dotyczące limitu 29), NOWY gra/tools/diplo-war-trust-only-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1/**.
ZAKAZ: ai.ts, main.ts, power-objective.ts, JSON balansu (diplomacy-war-peace-params.json i inne), progów 30/10/130/90, etykiet nastawienia, WERSJE.md, gra-robocza/, rust-port/, npm run build/dev, git add -A.
