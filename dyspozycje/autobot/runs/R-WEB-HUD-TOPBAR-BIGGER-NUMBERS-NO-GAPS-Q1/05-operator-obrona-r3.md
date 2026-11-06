STATUS: PASS-WITH-NOTES
TEMAT: R-WEB-HUD-TOPBAR-BIGGER-NUMBERS-NO-GAPS-Q1 (obrona R3)
Baza: 7ab78aaf2. Zmiana: tylko gra/tools/hud-topbar-bigger-numbers-real-render-test.cjs (+ logi gate-r4-*).
Z1 ODRZUCAM jako błąd Operatora: puste boki 12 px dla krótkich liczb wymagają max-width banera (łamie N6) - decyzja orkiestratora. Pomiar (max px/stronę, 12 | 2,3M): 1920 93|79, 1366 47|32, 1024 27|12, 640 13|10. Test drukuje teraz jawnie "cel NIEOSIAGNIETY".
Z2 PRZYJMUJĘ: B4 puste boki liczone na MAKSIMUM po żetonach (nie Math.min), dla zestawu 12 i 2,3M; sufity per okno (zapas ~10% nad pomiarem) jako strażnik regresji, nie dowód celu 12 px. Mutacja padding 30px: B4 pada przy 640.
Z3 CZĘŚCIOWO: wada nie do usunięcia bez luki (min-width liczby zostawia lukę po lewej przy krótkich liczbach, sprzeczne z celem 2). PRZYJMUJĘ pomiar: test raportuje dryf medalionu i liczby 12->2,3M (1920/1366: 12-32 px, 1024: 12-21, 640: 0-5; żeton stoi).
Z4 ODRZUCAM: dług sprzed zmiany, ten sam zbiór co baza 4905bac05 (gate-r3-grid-dist-PO vs gate-grid-dist-BAZA); flake deadzone zgodny z notą R2.
