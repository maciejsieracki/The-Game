STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1
GOAL: zgodny z dispatch/Operator/Evaluator/Obrona, bez rozbieżności — zweryfikowany punkt-po-punkcie.

ZMIANY/COMMIT: worktree `/home/user/wt-hotseat-etap4-noop-harness`, HEAD `027b1c1d` (branch
`autobot/R-HOTSEAT-ETAP4-NOOP-HARNESS-Q1`). `git diff --stat a5bb7651..HEAD`: wyłącznie 5 plików —
`gra/tools/hotseat-etap4-noop-test.cjs` (NOWY, 452 linie) + 4 raporty
`dyspozycje/autobot/runs/.../*.md`. ZERO `gra/src/**`. `git status --porcelain` czysty, `git diff
--check` exit 0. Fix obrony (`runOnceWithRetry`+`closeBrowserSafely`) potwierdzony diffem
a44cb440..HEAD: dokładnie 56 wstawień/3 usunięcia w tym samym pliku, jak zadeklarowano.

TESTY: Kod naprawy przeczytany w całości. `runOnceWithRetry` retryuje CAŁY `runOnce` (świeży
`browser.launch()`) wyłącznie po WYJĄTKU transportowym (crash przeglądarki) — nigdy po
niezgodności hashy; porównanie A vs B liczone jest raz, na wyniku końcowym, więc retry nie
maskuje żadnej realnej niedeterministyczności silnika, tylko chroni przed spontaniczną śmiercią
procesu Chromium (potwierdzone pozytywnym ustaleniem Evaluatora: hashe przed crashem zawsze
identyczne). `closeBrowserSafely` strukturalnie gwarantuje powrót w ≤8s (`Promise.race` +
`wait(8000)`) plus `SIGKILL` na wiszący proces OS — poprawnie usuwa źródło zawieszenia
(dead-handle `browser.close()`). Naprawa akceptowalna dla NARZĘDZIA TESTOWEGO: kryterium 30/30
pozostaje nienaruszone.

WŁASNE, NIEZALEŻNE URUCHOMIENIA (2×, pełny proces `node tools/hotseat-etap4-noop-test.cjs`, z
`gra/`): Uruchomienie 1 — EXIT=0, 10m11s, PASS 30/30, jsExcA=0/jsExcB=0, consErrA=consErrB=7,
zero retry. Uruchomienie 2 — EXIT=0, 10m19s, PASS 30/30, zero retry, hashe A i B bajt-w-bajt
identyczne z Uruchomieniem 1 (`diff` exit 0). Przeszedłem na żywo, obserwując log w czasie
rzeczywistym, przez wszystkie 3 historyczne punkty crasha Evaluatora (tura 6, 16, 27) — czysto,
bez wyjątku, bez retry, bez zawieszenia. `tsc --noEmit`: exit 0; `tsc --listFiles` potwierdza, że
`tools/*.cjs` NIE pojawia się na liście (`include:["src"]` w tsconfig.json) — twierdzenie
Operatora/Obrony zweryfikowane samodzielnie, nie skopiowane. 5 bramek referencyjnych uruchomione
teraz przeze mnie: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
unit-replace-test 13/13, combat-test 6/6 — wszystkie EXIT=0, zgodne z tabelą R-PROC-AUTOBOT.md
§12.

BLOKADY: brak.
RUNDY: 1/5

WERDYKTY:
1 (niestabilność Run B) -> ODDAL — naprawione i zweryfikowane niezależnie (2/2 czyste przebiegi,
wszystkie 3 historyczne punkty crasha bez powtórki).
2 (zawieszenie zamiast BLOCK) -> ODDAL — `closeBrowserSafely` strukturalnie poprawny
(race+SIGKILL), zero zawieszenia w 2 moich przebiegach.
3 (brak 5 bramek referencyjnych) -> ODDAL — uruchomione teraz, wszystkie zielone.

Agregat: same ODDAL → PASS.

NASTĘPNY KROK: integracja orkiestratora (allowlist-only) → READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
