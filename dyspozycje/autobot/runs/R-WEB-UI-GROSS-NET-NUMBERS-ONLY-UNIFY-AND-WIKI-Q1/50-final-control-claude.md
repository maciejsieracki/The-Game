STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI + dokumentacja gracza; bez logiki gry)
TEMAT: R-WEB-UI-GROSS-NET-NUMBERS-ONLY-UNIFY-AND-WIKI-Q1
GOAL: Nauka/Handel jedna liczba, Żywność "+brutto → +netto", opis i jednostka w title; grossNetSub usunięta; wiki §53.1a + wikiBundle przez generator.
ZMIANY/COMMIT: kandydat 59c02f54fa22aa99c2c12b79d86615716bd1e164 (potomek bd647523b: `git merge-base --is-ancestor` = tak). Diff vs bd647523b: empireDetailPanel.ts, 08-ekonomia-imperium.md, wikiBundle.json (1 linia), nowy gross-net-numbers-only-unify-test.cjs, raporty runs/**. Wszystko w allowliście; brak zmian w gra/src/game, WERSJE.md, gra-robocza. origin/main poszedł do 71ca0e588 (inne tematy, FALA 750); `git merge-tree` kandydat+origin/main: bez konfliktów. Brak wywołań grossNetSub poza komentarzem.
TESTY (zmierzone przeze mnie po npm ci): tsc --noEmit EXIT=0; gross-net-numbers-only-unify-test 35 ok/0 FAIL (calls=4); resource-card-numbers-only 14/0; resource-cards-gross-net 24/0; hud-gross-net-rest 820 ok/0 fail; logic-test 213/213; tech-tree 20/0; research 33/0 ALL GREEN; unit-replace 21/21; combat 6/6. Mutacja własna na prawdziwym pliku (Brutto + "/ turę" w singleNumberSub): 33 ok / 2 FAIL (test czerwony), plik przywrócony.
WERDYKTY ZARZUTÓW: Z1 ODDAL (kryterium (c) z dispatchu dopuszcza NIE_ZMIERZONO z powodem: brak playwright-chromium; zrzut fragmentów z /usr/bin/chromium obejrzany przez obronę; pełny panel w żywej grze NIE_ZMIERZONO). Z2 ODDAL (naprawione w r2: M1/M2 liczą FAIL-e checks() na zmutowanym tekście; potwierdzone moją mutacją). Z3 ODDAL (dispatch (a) dopuszcza test jednostkowy; hero "PN / turę"/"złota / turę" poza zakresem linii brutto/netto). Z4 ODDAL (naprawione w r2: singleNumberSub). Żadne NAPRAW.
BLOKADY: brak. NIE_ZMIERZONO: pełny panel imperium w żywym Chromium przez Vite.
RUNDY: FC po 2/5.
NASTĘPNY KROK: integracja orkiestratora (merge z origin/main 71ca0e588), deploy na ROBOCZĄ osobną autoryzacją.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: wikiBundle.json zmieniony generatorem (1 linia) w kandydacie; po merge z main sprawdź, czy ROBOCZA nie wymaga regeneracji.
