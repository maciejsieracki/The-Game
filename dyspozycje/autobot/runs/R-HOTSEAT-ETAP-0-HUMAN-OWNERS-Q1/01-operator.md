STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP-0-HUMAN-OWNERS-Q1
GOAL: Etap 0 planu hot-seat — nowy moduł human-owners.ts (kontrakt §B1) + flaga
hotSeatEnabled() martwa w main.ts, zero podmian istniejącego kodu.
ZMIANY/COMMIT: af295d0eb8eb03d89be8eef0ee39aa78371e4bee (gałąź
autobot/R-HOTSEAT-ETAP-0-HUMAN-OWNERS-Q1) — dodane: gra/src/game/human-owners.ts
(nowy, 71 linii), gra/tools/hotseat-human-owners-test.cjs (nowy, 140 linii);
zmienione: gra/src/main.ts WYŁĄCZNIE +18 linii (hotSeatEnabled()), 0 delecji —
`git diff --stat gra/src/main.ts`: "18 insertions(+)", `git diff --check`: czysto.
Sentinele potwierdzone grepem: BARBARIAN_OWNER_ID=-1 (barbarians.ts),
REBEL_FACTION_OWNER_ID=-99 (society-breakdown.ts) — zaimportowane, nie zgadywane.
TESTY: tsc --noEmit = 0 błędów. Nowa bramka: 29/29 PASS (pokrywa każdą z 5 funkcji
+ stałą: single-human, hot-seat [0,3], cykliczność nextHumanSeat w obie strony,
isAiOwner wyklucza barbarzyńcę/rebelianta, isHotSeat true/false). 5 bramek
referencyjnych zielone: logic-test 213/213, tech-tree-test 19/19,
research-test 33/33, unit-replace-test 13/13, combat-test 6/6. Dowód
zero-regresji: PEŁNY przebieg wszystkich 90 plików ai-*-test.cjs +
diplomacy-*-test.cjs uruchomiony DWA razy — raz na `git stash` (kod bez zmian,
baseline), raz po `git stash pop` (z moją zmianą) — `diff` posortowanych wyników
obu przebiegów jest PUSTY (0 linii różnicy), identyczne 6 pre-istniejących
czerwonych/timeout wyników w obu (ai-balans-step3, ai-praca-split-parity,
ai-slider, ai-test, diplomacy-negotiation-table, ai-buduje-budynki-test —
ten ostatni to bramka realnego renderu Playwright, >300s nawet standalone,
niezwiązana z tym tematem).
BLOKADY: Infra — worktree /home/user/wt-hotseat-etap0 był w trakcie mojej pracy
współdzielony z INNYM, aktywnym tematem (P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1;
dowód: nowy plik dowody/render.png z mtime w trakcie mojej sesji) — spowodowało
to jednorazową kolizję/duplikaty w pierwszym przebiegu porównawczym (odrzucony,
nie liczony jako dowód); drugi, czysty przebieg (poniżej procesów zerowych
przed startem) dał wynik jak wyżej. Nie dotknąłem pliku render.png (poza
allowlistą).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator → Final Control → integracja allowlist-only do main
(orkiestrator) → Etap 1 (31× ownerId>0 → isAiOwner).
DEPLOY/PUSH: NIE WYKONANO
