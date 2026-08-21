# 00-dispatch — R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1

STATUS: DISPATCHED
TEMAT: R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1
GOAL: Jedna istniejąca karta technologii jest otwierana kliknięciem z techTreeView i scienceHubHud dla stanów zbadana/aktywna/dostępna/zablokowana; preview nie uruchamia badania, a UI sygnalizuje możliwość podglądu.
KRYTERIA KOŃCA: faktyczny diff w allowliście; testy karty 17/0, tech tree 19/0, research 33/0; tsc; test rozdzielenia preview od start research; kontrola ESC/click outside/focus; Evaluator; Final Control; integracja; READY_FOR_DEPLOY.
ALLOWLISTA: gra/src/ui/techTreeView.ts; gra/src/ui/scienceHubHud.ts; gra/src/ui/techDiscoveryNotice.ts; ewentualnie jeden celowany test gra/tools/; artefakty runu.
IZOLACJA: Civ-clean-main-2026-08-20, baza HEAD 47cdca15, Fala 300; nie pracować w starym katalogu Civ.
PLAN TESTÓW: test karty, tech tree, research, science hub próg 4; tsc; live DOM/Chromium jeśli środowisko pozwoli.
ABC: brak — właściciel podał zachowanie UI literalnie.
DEPLOY/PUSH: NIE WYKONANO
