# DODATEK 3 orkiestratora — RUNDA 4/5 (R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1, 2026-11-12)
KANDYDAT STARTOWY: 3f729c9c4 (obrona r3). Ten sam ID i gałąź robocza; NIE nowy temat. Operator: SONNET (uzasadnione: dwie porażki Haiku; zostaje bez zmiany).
Werdykt FC r3 = FAIL. Zarzuty do zamknięcia (każdy: dowód w danych, nie w deklaracji):
Z1 NAPRAW — pin relacji nadpisany tickiem przed decyzją AI: po endTurn pin80 i pin140 = 29, więc 3 poziomy relacji nie są rozdzielone. Napraw tak, aby AI w CHWILI DECYZJI widział przypiętą wartość; dowód: relTotalAi czytane w momencie decyzji AI dla pinów 20/80/140 różni się.
Z2 NAPRAW — ramię naturalne: pasywny gracz z 1 miastem, 0 ofert handlowych; 3 z 6 ziaren kończy się ok. tury 100 przez utratę miasta (tier=unrest, budowa warsztat_oblezniczy przez AI w t96). Zbadaj mechanizm utraty miasta (log tur) i ustaw ramię pomiarowe tak, by gracz nie tracił miasta przed turą 150 — ALBO udokumentuj, że ramię naturalne tego nie osiąga, i oznacz wynik jako NIE_ZMIERZONO dla tych ziaren. Nie zmieniaj reguł gry.
Z3 NAPRAW — ramię prepared: wymagane ≥3 ziarna, każda komórka do 150 tur, bez NIEDOKONCZONE:limit czasu (dziś: 1 ziarno, 2 komórki na 149 turach).
Z6 NAPRAW CZĘŚCIOWO — liczniki bitew po wznowieniu rozjechane (autoBattles 16 vs 10, battleActs flush 3). Napraw albo zapisz jako ograniczenie w summary.md; porównanie fast/normal wykonaj dla przebiegu Z ofertami handlowymi, nie tylko bez ofert.
Z4 i Z5 — ODDAŁ Evaluator z notą; nie wymagają działania poza ewentualną aktualizacją opisów.
ZAKRES: gra/tools/measure-ai-trade-offer-frequency*.cjs, hooki w gra/src/game/civ-test-hooks.ts i gra/src/main.ts TYLKO za ?civTest=1, dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/**. Zakaz zmian reguł gry, WERSJE.md, JSON balansu, push, deploy.
PRÓG BRAMKI: bramka bez flagi wymaga czekania ≥400 s (zmierzone w r3); ustaw MEAS_GATE_WAIT_SEC odpowiednio, nie skracaj.
ŚRODOWISKO: worktree, npm ci --ignore-scripts, zakaz npm run build/dev, tsc --noEmit, pomiar Chromium w tle z logiem. Nie integrujesz, nie pushujesz.
