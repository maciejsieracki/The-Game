# 04-integration — R-PROC-AUTOBOT-DOPISKI-PETLA-FINALCONTROL-Q1

STATUS: READY_FOR_DEPLOY
TEMAT: R-PROC-AUTOBOT-DOPISKI-PETLA-FINALCONTROL-Q1
GOAL: dopisać Dopisek A (§3) i Dopisek B (§1) do `docs/decyzje/R-PROC-AUTOBOT.md`.
ZMIANY/COMMIT: `docs/decyzje/R-PROC-AUTOBOT.md` (2 wstawki), `dyspozycje/REJESTR-PROSB-I-ZADAN.md` (rejestracja tematu), `dyspozycje/autobot/runs/R-PROC-AUTOBOT-DOPISKI-PETLA-FINALCONTROL-Q1/*` (00–04). Commit na branchu `Work3` (izolowany worktree, baza `origin/main` `47cdca15`).
TESTY: `process-docs-audit.cjs` PASS (Operator + niezależnie Final Control). `git diff --check` bez błędów.
BLOKADY: brak. Do zanotowania na przyszłość: przy scalaniu z `origin/main` po tym, jak druga sesja scommituje swoją wersję §3 (rundy/LIMIT-5-EXCEEDED), będzie trzeba ręcznie pogodzić oba rozszerzenia tego samego paragrafu.
NASTĘPNY KROK: push `Work3` → `origin/Work3` (autoryzacja właściciela już udzielona w rozmowie głównej dla tej konkretnej gałęzi/zadania).
DEPLOY/PUSH: WYKONANO po tym wpisie (push gałęzi Work3, nie deploy do ROBOCZEJ — to zmiana docs-only procesu, nie kod gry).
