# R-WEB-DIPLO-TRUCE-UNTIL-TURN-DISPLAY-Q1 — dispatch (2026-11-13)

GOAL (#306/#319, ABC właściciela: tak): w relacji dyplomacji, gdy rozejm jest aktywny, pokazać „Rozejm do tury N” (N = tura końca rozejmu z danych stanu, nie stała). Bez rozejmu — bez tego napisu.
BAZA: origin/main (34584b4da266b93c9a30585d2001c563057ccc29). Operator: HAIKU (zwykły temat UI + test).
ALLOWLISTA: gra/src/game/diplomacy-display.ts, gra/src/ui/diplomacyAudience.ts, gra/src/ui/diploUiSkin.ts (tylko jeśli potrzebny styl tekstu), NOWY gra/tools/diplo-truce-until-turn-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-TRUCE-UNTIL-TURN-DISPLAY-Q1/**. Zakaz: zmian reguł rozejmu (diplomacy.ts logika), JSON balansu, WERSJE.md, gra-robocza/, rust-port/, git add -A.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno.
KRYTERIA KOŃCA: tsc 0 błędów; 5 bramek (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) z surowym wyjściem; test diplo-truce-until-turn-test.cjs: aktywny rozejm → napis z właściwym N; brak rozejmu → brak napisu; mutacja (stałe N) czerwieni test; raport 10-operator-claude.md z SHA. Nie integrujesz, nie pushujesz na main.

## DODATEK
Z GOAL i ALLOWLISTĄ jak wyżej. Znajdź w kodzie, gdzie przechowywany jest koniec rozejmu i gdzie relacja pokazuje status; napis dodaj tam, bez zmiany logiki. Zgodnie z regułą: jeden operator, bez równoległej pracy na main.ts.
