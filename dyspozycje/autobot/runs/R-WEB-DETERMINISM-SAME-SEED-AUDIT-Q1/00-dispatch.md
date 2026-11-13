# R-WEB-DETERMINISM-SAME-SEED-AUDIT-Q1 — dispatch (2026-11-13)

GOAL: audyt (BEZ zmian kodu gry) — znaleźć źródła niedeterminizmu: to samo ziarno gry daje różne przebiegi (rozbieżność od ok. tury 24, także tryb przyspieszony vs przyspieszony; przykład: oferta handlowa AI w t25 vs t26 dla ziarna 2222). Wynik: lista kandydatów na źródło z dowodem i propozycja minimalnej naprawy do osobnego tematu. Szczegóły: DODATEK.

BAZA: kandydat 2b6f6576f (W35 r4: hak ?civTest=1 i narzędzia pomiarowe) — zawiera runner pomiarowy gra/tools/measure-ai-trade-offer-frequency*.cjs i dane w dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/. Operator: HAIKU. Evaluator/FC: SONNET.
ALLOWLISTA: tylko dyspozycje/autobot/runs/R-WEB-DETERMINISM-SAME-SEED-AUDIT-Q1/** oraz nowe narzędzie gra/tools/determinism-probe.cjs (jeśli potrzebne do pomiaru).
ZAKAZ: wszelkie zmiany w gra/src/**, JSON balansu, WERSJE.md, gra-robocza/, rust-port/, npm run build/dev, git add -A.
