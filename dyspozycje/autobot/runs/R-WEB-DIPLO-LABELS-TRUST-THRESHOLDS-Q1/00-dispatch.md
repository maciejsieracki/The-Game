# R-WEB-DIPLO-LABELS-TRUST-THRESHOLDS-Q1 — dispatch (2026-11-13)

GOAL (decyzja właściciela ABC „C”, 2026-11-13): etykiety nastawienia w dyplomacji zależą od ZAUFANIA przy niskich wartościach: zaufanie poniżej 10 = „Wrogi”, zaufanie 10–29 = „Nieufny”, od zaufania 30 wzwyż etykieta wg relacji (zaufanie + respekt) jak dotąd. Szczegóły: DODATEK.

BAZA: kandydat 84032f962 (potomek origin/main 478cefaed, zawiera Civpedię dyplomacji). Operator: HAIKU. Evaluator/FC: SONNET.
ALLOWLISTA: gra/src/game/diplomacy-display.ts (nastawienieLabelFromScore, nastawienieHintPl, warRelationCapApplies — tylko to), gra/src/ui/diplomacyAudience.ts (wyłącznie wywołania i dopisek o limicie wojennym), istniejące testy w gra/tools/*.cjs tylko w asercjach o etykietach/progu 30, NOWY gra/tools/diplo-labels-trust-thresholds-test.cjs, docs/encyklopedia/pojecia/relacja.md oraz inne hasła i poradnik tylko w miejscach opisujących etykiety, gra/src/data/wikiBundle.json (WYŁĄCZNIE regeneracja skryptem node gra/tools/bundle-wiki-for-game.cjs), gra/tools/diplo-civpedia-values-test.cjs (tylko wartości etykiet), dyspozycje/autobot/runs/R-WEB-DIPLO-LABELS-TRUST-THRESHOLDS-Q1/**.
ZAKAZ: diplomacy.ts, ai.ts, main.ts, JSON balansu, progów umów (30/110/130/90/70), WERSJE.md, gra-robocza/, rust-port/, npm run build/dev, git add -A.
