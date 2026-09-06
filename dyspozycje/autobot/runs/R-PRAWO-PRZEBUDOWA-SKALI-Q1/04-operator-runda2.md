STATUS: PASS
DOMAIN: GAME
TEMAT: R-PRAWO-PRZEBUDOWA-SKALI-Q1
GOAL: main.ts (budowa LawBreakdownInput) dostaje `hasGarnizonBudynek: builtIds.includes('garnizon')`,
analogicznie do juz istniejacej linii cityPanel.ts:3150, plus dowod REALNYM URUCHOMIENIEM parytetu
panel<->silnik dla tego pola (z budynkiem i bez).
ZMIANY/COMMIT: gra/src/main.ts (dokladnie 1 linia dodana, linia 29211 po `hasSad`, przed
`palacTier`) — zgodnie z ratyfikacja orkiestratora rozszerzajaca allowlist o main.ts wylacznie
ta jedna linia. gra/tools/prawo-przebudowa-skali-test.cjs — nowa sekcja 3k (56 linii): ekstrakcja
wyrazenia `hasGarnizonBudynek: ...` z realnych zrodel main.ts i cityPanel.ts przez regex, kompilacja
do `new Function` i WYWOLANIE dla dwoch scenariuszy (miasto z budynkiem Garnizon / bez), porownanie
wynikow main.ts vs cityPanel.ts, plus dociagniecie realnego `computeLawBreakdown` weryfikujace
spojnosc obecnosci linii 'garnizon_budynek' z wyliczonym hasGarnizonBudynek. Commit: [do wykonania
po tym raporcie, sciezki jawne].
TESTY: `cd gra && node tools/prawo-przebudowa-skali-test.cjs` -> 151 OK, 0 FAIL (wzrost z 143 OK
sprzed sekcji 3k). Kontrola negatywna wykonana i cofnieta: tymczasowe wyciecie nowej linii z main.ts
(zastapienie komentarzem) dalo 143 OK, 1 FAIL dokladnie na nowej asercji "3k: linia hasGarnizonBudynek
znaleziona w main.ts" — dowodzi, ze test realnie wykrywa brak zmiany, nie jest tautologia. main.ts
przywrocone do stanu z jedna dodana linia (diff potwierdzony ponownie: `git diff --stat` = 1 insercja,
`git diff gra/src/main.ts` pokazuje wylacznie `+ hasGarnizonBudynek: builtIds.includes('garnizon'),`).
Guard izolacji SS2b: HEAD startowy a5a5530c, drzewo czyste — potwierdzone przed startem pracy.
BLOKADY: brak.
RUNDY: 2/5.
NASTEPNY KROK: commit zmian (main.ts + test.cjs + ten raport) po jawnych sciezkach, nastepnie
Evaluator.
DEPLOY/PUSH: NIE WYKONANO
