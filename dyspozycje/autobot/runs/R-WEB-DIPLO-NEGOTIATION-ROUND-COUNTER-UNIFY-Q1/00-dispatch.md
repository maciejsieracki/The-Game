# R-WEB-DIPLO-NEGOTIATION-ROUND-COUNTER-UNIFY-Q1 — dispatch (2026-11-13)

GOAL (#307/#320, ABC właściciela: tak): licznik rund negocjacji pokazywany graczowi ma być jeden i spójny z regułą limitu (NEGOTIATION_MAX_ROUNDS). Dziś napis „runda N/M” pochodzi z main.ts (ok. linii 15295: `runda ${n.round}/${NEGOTIATION_MAX_ROUNDS}`) i z diplomacyAudience.ts (ok. linii 1968–1971). Ujednolicić: jeden wzorzec napisu, wartość M z jednego źródła.
BAZA: origin/main (a4b7a54641c0e231fa5fe8493fd3cfffdbe6f305). Operator: HAIKU.
ALLOWLISTA: gra/src/main.ts (tylko napis licznika rund), gra/src/ui/diplomacyAudience.ts (tylko napis licznika), NOWY gra/tools/diplo-negotiation-round-counter-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-NEGOTIATION-ROUND-COUNTER-UNIFY-Q1/**. Zakaz: zmian logiki limitu rund, wartości NEGOTIATION_MAX_ROUNDS, JSON balansu, WERSJE.md, gra-robocza/, rust-port/, git add -A.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno.
KRYTERIA KOŃCA: tsc 0 błędów; 5 bramek (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) z surowym wyjściem; test: oba miejsca dają ten sam napis dla tej samej rundy i tego samego M; mutacja (inny M w jednym miejscu) czerwieni test; brak zmiany wartości limitu; raport 10-operator-claude.md z SHA. Nie integrujesz, nie pushujesz na main.
