STATUS: PASS
DOMAIN: GAME (UI/powiadomienia, dyplomacja)
TEMAT: R-WEB-UI-DIPLO-PEACE-CONCLUDED-VAZNE-ALWAYS-Q1
GOAL: kazdy pokoj z udzialem gracza dodaje dokladnie jeden wpis w „Wazne" (nazwa cywilizacji, tura, powod); pokoj AI<->AI bez gracza bez wpisu; bez duplikatow.
BAZA: origin/main 98c988d7cf0ae3dfdc0bb39b6b95f9e1c658a9fc (worktree detached, runda 2/5).

ZMIANY-COMMIT:
- gra/src/main.ts (+10 linii): P2 resolvePendingDiplomacy, zaproponuj_pokoj (oferta AI / koniec rozejmu przyjęta przez gracza) -> logPeaceVazne(ME(), p.ownerId, ...); znacznik „koniec rozejmu" czytany przed finalize. P5 respondToHumanProposal, zaproponuj_pokoj -> logPeaceVazne(p.fromOwnerId, p.toOwnerId, ...).
- gra/tools/peace-vazne-always-test.cjs (nowy): test zachowania logPeaceVazne (realna funkcja z main.ts, przetranspilowana, uruchomiona na atrapach), statyczny wiring sciezek P1-P5 oraz 3 mutacje (usuniecie wpisu P2, P5, P3) — wszystkie wykryte.
- Sciezki bez zmian (juz mialy wpis): P1 oferta gracza przyjeta przez AI (applyProposalOutcome, logPeaceVazne), P3 pokoj wymuszony 100% (forced-peace-<tura>-<para>), P4 koniec rozejmu w finalizePeace (truce-peace-<tura>-<para>). Pokoje AI<->AI (R-AI-PEACE-2T, regular-war cap) nie maja wpisu: logPeaceVazne ignoruje pary bez gracza.
- Commit: kod + test + ten raport (git add po sciezkach, bez -A).

TESTY:
- tsc --noEmit: exit 0, brak wyjscia (po npm ci w gra/).
- Gates: logic-test 213/213; tech-tree-test exit 0; research-test 33/0; unit-replace-test exit 0; combat-test exit 0.
- Diplomacja (21 testow diplo-truce/peace/war-peace, bez live): 21/21 exit 0.
- peace-vazne-always-test.cjs: ZIELONE (5 asercji zachowania, wiring realnego main.ts OK, 3/3 mutantow wykryte).
- Build poza repo: vite build --outDir /tmp/cw-build-peacevazne -> exit 0.
- Chromium / zywa gra: NIE ZMIERZONO (tylko testy node i build).

BLOKADY: brak. Uwaga: w dispatchu „PEACEAUTO" wskazuje na logPeaceVazne; w kodzie automatyczny pokoj przy 100% zmeczenia ma wpis forced-peace-*, a logPeaceVazne nie jest tam uzywany. Zalozenie: nie zmieniam tej sciezki (juz ma dokladnie jeden wpis).

RUNDY: 2/5 (runda 1: DECISION_REQUIRED bez kodu; runda 2: kod + test + raport).
NASTEPNY KROK: Evaluator (test P1-P5 + mutacje, diff: git diff 98c988d7c..HEAD), potem Final Control.
DEPLOY-PUSH: NIE WYKONANO
