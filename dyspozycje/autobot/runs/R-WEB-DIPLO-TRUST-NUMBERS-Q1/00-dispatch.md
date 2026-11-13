# R-WEB-DIPLO-TRUST-NUMBERS-Q1 — dispatch (2026-11-13)

GOAL (decyzje właściciela 2026-11-13): cztery liczbowe zmiany zaufania w jednym temacie: (1) po rozejmie zaufanie wraca od razu do 10, po pokoju do 20; (2) kara za sąsiedztwo −3/−4/−5 (zamiast −2/−3/−4); (3) religia przestaje wpływać na zaufanie; (4) kara za sąsiedztwo nie działa w karencji po pokoju lub rozejmie. Szczegóły: DODATEK.

BAZA: origin/main d09df3e0b (zawiera krok 1 — w wojnie zaufanie spada do zera). Operator: HAIKU. Evaluator/FC: SONNET.
ALLOWLISTA: gra/src/game/diplomacy.ts, gra/src/game/diplomacy-factors.ts, gra/src/game/diplomacy-peace-lock.ts, gra/src/main.ts (WYŁĄCZNIE miejsca wskazane w DODATKU), gra/data/diplomacy.json, istniejące testy w gra/tools/*.cjs wymagające aktualizacji liczb, NOWY gra/tools/diplo-trust-numbers-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-TRUST-NUMBERS-Q1/**.
ZAKAZ: ai.ts, diplomacy-proposals.ts, power-objective.ts, progów umów (30/110/130/90/70), etykiet nastawienia, Respektu, wiarygodności, WERSJE.md, gra-robocza/, rust-port/, npm run build/dev, git add -A.
