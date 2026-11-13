# R-WEB-DIPLO-RESIDUAL-RELIGION-EVENT-AND-TEXTS-Q1 — DODATEK orkiestratora (runda 1)

## Co sprawdzić i zrobić (każdy punkt z plik:linia i surowym wynikiem)
1. Zdarzenie wspolna_religia (diplomacy.ts, typ zdarzenia i case; etykieta w diplomacy-factors.ts): grep wszystkich miejsc emitujących je (applyDiploEvent/zdarzenie) w gra/src. Jeśli NIKT go nie wywołuje — martwy kod: usuń definicję, case i osierocone etykiety (testy i dokumenty zaktualizuj). Jeśli ktoś wywołuje — NIE usuwaj; opisz wywołania i wpływ na zaufanie (jednorazowe +1 przy zawarciu czegoś?) i zaproponuj w raporcie (DECYZJA dla orkiestratora: czy to sprzeczne z decyzją „religia nie wpływa na zaufanie”).
2. Kolejność przy pokoju: silnik 'pokoj' (dZ=5) a ustawienie zaufania 20 po pokoju (finalizePeaceTreatyBetween w main.ts — TYLKO CZYTAJ). Wykaż na kodzie, że końcowa wartość po pokoju to 20 (nie 25 i nie 5+20); jeśli zdarzenie 'pokoj' wykonuje się po ustawieniu 20, zgłoś jako BLOKADA (nie naprawiaj w main.ts — poza allowlistą).
3. Opisy „−5 Relacja u adresata” (ok. l.305) i „−5 Relacja u każdego” (ok. l.471): sprawdź w kodzie, co faktycznie robi odpowiednie zdarzenie (ultimatum spełnione dZ=−5 według poprzedniego raportu); popraw tekst na zgodny z kodem. Nie zmieniaj kodu zdarzeń.
4. Rozszerz diplo-json-descriptions-sync-test.cjs o te pozycje (mutacja liczby w opisie czerwieni test).

## Kryteria końca (binarne)
- tsc --noEmit exit 0; logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6; diplomacy-test, diplo-civpedia-values-test, diplo-json-descriptions-sync-test, diplo-relation-tier-trust-test zielone; sekcja params JSON niezmieniona (dowód).
- Raport 10-operator-claude.md z punktami 1–4.

## Środowisko i zakazy
Worktree, w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; tsc --noEmit wolno. Dysk bywa < 8 GB: sprzątaj po sobie. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez git add -A. NIGDY nie wywołuj spawn_task ani innych narzędzi zakładających sesje.
