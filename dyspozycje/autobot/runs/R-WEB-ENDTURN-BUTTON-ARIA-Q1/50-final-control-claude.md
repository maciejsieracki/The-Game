STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-BUTTON-ARIA-Q1
GOAL: przycisk Zakończ turę ma aria-disabled/is-disabled zgodny z canEnd; błąd odtworzony, poprawka z testem czerwony→zielony, bramki zielone.
ZMIANY/COMMIT: kandydat 00216ef8c0a5e1b47fc1cd28dfe84f4a7d1ac2b2 (baza 32b3f17181c704ca4305bd651c84af9fee7417c3 jest jego przodkiem: merge-base --is-ancestor = tak). Diff: 8 plików, +564/-0: gra/src/ui/bottomBarHud.ts (+24), gra/tools/endturn-aria-probe.cjs (nowy), gra/tools/endturn-aria-sync-test.cjs (nowy), dyspozycje/analizy/KONIEC-TURY-PRZYCISK-ARIA-2026-11-27.md, runs/.../{10-operator,30-obrona}-claude.md, endaria-s4242-run3.jsonl, endaria-s7-postfix-run1.jsonl. Wszystko w allowliście; brak gra/data, WERSJE.md, gra-robocza, rust-port.
TESTY (własne, na kandydacie, po npm ci --ignore-scripts, surowe wyjście):
- tsc --noEmit: exit 0
- endturn-aria-sync-test: 5 PASS / 0 FAIL; ten sam test z bottomBarHud.ts z bazy 32b3f1718: 3 PASS / 2 FAIL (FAIL [2] aria-disabled, FAIL [3] is-disabled) = mutacja czerwona potwierdzona niezależnie
- logic-test 213/213; tech-tree 20/0; research 33/0; ai-unit-replace-same-rules 45/0; combat 6/6; society-breakdown 56/0; ai-test 297/0; ai-city-order-need-wiring 267/0
- poll z endaria-s7-postfix-run1.jsonl (8 tur): w każdej turze cA... (pipeline, canEnd=false, aria=true) -> w najgorszym przypadku jedna próbka CA (tury 3,5,6) -> Ca; zgodne z opóźnieniem <=500 ms; klik skuteczny 8/8.
- Zmiana gra/src: tylko synchronizacja atrybutów; klikalność (data-end), advanceSeat i logika bramek nietknięte; cykl zatrzymany w destroy(). Przeglądałem diff linia po linii: render() jest wołany tylko przy zmianie klucza hidden/off/on, pomijany gdy trwa wciśnięcie (activeEndTurnPointers).
OCENA ZARZUTÓW:
1 (brak poprawki): ODDAL — nieaktualny, poprawka i test są w kandydacie (diff zawiera gra/src).
2 (tabela dokumentu vs jsonl): ODDAL — dokument przepisany; sprawdziłem, że tabela §1 odpowiada wierszom endaria-s4242-run3.jsonl (8 tur) i nie powołuje się na biegi 1–2.
3 (przyczyna bez eksperymentu): ODDAL z notą — mechanizm potwierdzony pośrednio: test czerwony na starym kodzie, zielony po poprawce, pomiar live przed (s4242: aria=true przy canEnd=true t2–8) i po (s7: aria podąża za canEnd). Stuck activeEndTurnPointers nie wykluczony, ale poprawka nie zależy od niego i skutek live na dwóch ziarnach jest zgodny.
4 (pełna tabela 2 ziarna przed poprawką): ODDAL z notą — brak pre-biegu seed 7 w repo (NIE ZMIERZONO, opisane w §5). Nie blokuje: błąd jest dowiedziony na seed 4242 i odtworzony testem.
5 (nagłówek probe/hak setupu): ODDAL — nagłówek poprawiony, ograniczenie haków SETUP opisane w §4 dokumentu.
BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA:
- Koszt: interwał 500 ms woła canEndTurn() (w tym healStaleEndTurnBlockers i potencjalnie console.warn przy blokadzie) poza updateHud; wydajność/liczba ostrzeżeń NIE ZMIERZONO.
- NIE ZMIERZONO: live po poprawce na seed 4242 i przy ręcznym zamykaniu modali; odwrotny przypadek (aria=false przy canEnd=false).
- Integracja: kod gra/src zmieniony -> deploy na ROBOCZĄ jako FALA po integracji; ocena wizualna w przeglądarce po stronie właściciela.
RUNDY: FC 1/1 (tematu: 2/5 do FC)
NASTĘPNY KROK: integracja orkiestratora kandydata 00216ef8c (merge-base z origin/main sprawdzony), potem deploy na ROBOCZĄ.
DEPLOY/PUSH: NIE WYKONANO
