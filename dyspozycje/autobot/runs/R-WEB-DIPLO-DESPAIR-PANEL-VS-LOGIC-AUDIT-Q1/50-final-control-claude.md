STATUS: PASS-WITH-NOTES (audyt bez zmian kodu; DECISION_REQUIRED A/B/C zostaje po stronie właściciela)
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-DIPLO-DESPAIR-PANEL-VS-LOGIC-AUDIT-Q1
GOAL: audyt bez zmiany reguł: skąd panel bierze Zmęczenie/Desperację, czy wejścia = logika, czy 0% poprawne, jednoznaczność etykiet.
ZMIANY-COMMIT: kandydat 0126c88a1 (potomek bazy efda558ac: `git merge-base --is-ancestor` = TAK; diff vs baza = 2 pliki raportów, +87 linii, zero kodu gry/testów). Ten raport: osobny commit na kandydacie.

CO SIĘ WYDARZYŁO (zweryfikowane samodzielnie, czytaniem kodu):
- Panel gracz↔AI (tryb 'ai', gra/src/game/war-weariness-view.ts ~112-116) liczy desperację przegrywającego jako `isWarWeary(level) ? loserDespair(...) : 0`. Poziom 28% < progChetnosci 50% => 0%, NIEZALEŻNIE od udziału siły. Wzór bez bramki dałby >0 dla każdego udziału ≤0,45.
- Wejścia nie są rozjechane (turnsAtWar, lostCities obu stron, siła militarna z computeMilitaryStrength, nie „Moc"). To nie błąd wejść.
- Uzasadnienie bramki w kodzie i teście ("jak ai.ts", view:12/:112, asercja E4a) jest NIEPRAWDZIWE: w gra/src/game/ai.ts nie ma ani isWarWeary, ani loserDespair, ani despairStage (grep: 0 trafień; ai.ts:7104-7113 używa wyłącznie wearinessPeaceCashPn(poziom)). Desperacja jest liczona w grze tylko w runWarWearinessTick (AI↔AI, bez bramki). Bramka jest więc wynalazkiem widoku bez oparcia w logice ani w jawnej decyzji (#364 nie wspomina progu 50%). To jest właściwy „błąd": rozjazd panel gracz↔AI vs tick AI↔AI oraz mylący komentarz/tooltip ("wysoka oznacza gotowość oddania miast" — gotowość AI wynika z poziomu zmęczenia/ceny, nie z desperacji).

DECYZJA ZARZUTÓW:
1. Brak pomiaru parytetu — ODDAL: Obrona wykonała probe 24 przypadków (24/24 panel = bramka+wzór); mechanizm potwierdzam czytaniem kodu; test E3/E4 repo przechodzi.
2. Pominięta asercja E4a/#364 — ODDAL: Obrona potwierdziła E4a (view-test:346-356) i dodała wadę opcji A (zmiana E4a). Dodatkowo: E4a opiera się na fałszywej przesłance "jak ai.ts" — wchodzi do ABC.
3. Moc vs siła, pewność „34%" — ODDAL: skorygowane; 0% wynika z bramki, nie z miary; zgodność 11/40=27,5%≈28% przyjęta jako założenie (0 utraconych miast).
4. Etykiety/tooltip bez progu 50% — DO DECYZJI CZŁOWIEKA: treść tooltipu zależy od wyboru A/B/C; plik diplomacy-display.ts jest poza allowlistą tematu (gra/src/game, nie gra/src/ui). Osobny temat tekstowy po ABC (tooltip + komentarze view:5/12/112 + ewent. E4a).
Brak zarzutu NAPRAW => nie FAIL.

TESTY (surowe wyjście, kandydat 0126c88a1, worktree FC):
- npm ci --ignore-scripts w gra/: added 71 packages.
- npx tsc --noEmit: brak wyjścia, exit 0.
- node gra/tools/diplo-weariness-display-test.cjs: PASSED 52 / FAILED 0 / TOTAL 52, ALL PASSED (w tym E3b, E4a, E4b).
- Pozostałe bramki (logic/tech-tree/research/unit-replace/combat, testy dyplomacji): NIE URUCHAMIANO — diff kandydata vs baza to wyłącznie 2 pliki .md, kod identyczny z bazą; wynik = wynik bazy. Mutacja i Chromium: NIE DOTYCZY/NIE ZMIERZONO (brak zmian kodu/UI; brak zrzutu panelu z wierszami Zmęczenie/Desperacja — zrzuty -30/-31 pokazują tabelę PW). Dysk w FC: 2,7 GB wolne.

ABC DLA WŁAŚCICIELA (rekomendacja FC):
 A) Usunąć bramkę w trybie 'ai' (jak tick; w zrzucie ≈34% przy udziale Moc, wartość dla siły NIE ZMIERZONO) + zmiana E4a. Spójne z AI↔AI.
 B) Zostawić bramkę, poprawić komentarze i tooltip („poniżej 50% zmęczenia desperacja = 0"). Bez zmiany wartości, 0% nadal może mylić.
 C) A + jednoznaczne podpisy stron („Ty — wygrywasz/przegrywasz").
 Rekomendacja: A (bramka nie ma oparcia w ai.ts ani w decyzji), z poprawką tooltipu; B tylko jeśli właściciel chce celowo ukrywać niską desperację.

BLOKADY: decyzja A/B/C.
RUNDY: FC r1 (tematu 2/5 po obronie)
NASTĘPNY KROK: pytanie ABC do właściciela; po odpowiedzi temat poprawki (war-weariness-view.ts, diplomacy-display.ts, diplomacyAudience.ts, diplo-weariness-display-test.cjs).
UWAGI-DLA-ORKIESTRATORA: gra/node_modules w worktree FC (gitignored) do sprzątania; /tmp/fc1 do sprzątania.
DEPLOY/PUSH: NIE WYKONANO
