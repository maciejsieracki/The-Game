STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-REPLACE-MULTITYPE-WALK-ALL-GROUPS-Q2
GOAL: "Zastap" przy zaznaczeniu roznych typow w armii przechodzi po kolei przez wszystkie typy z zamiennikiem; typy bez zamiennika nazwane po nazwie w komunikacie; "Pomin ten typ" idzie dalej; Zakoncz/Esc przerywa caly lancuch i podaje, ile typow zostalo.
ROLA: Obrona Operatora (Haiku), runda 1 zarzutow Evaluatora (20-evaluator-claude.md, wpis 0846e06bb).
BAZA KODU: kandydat 727406a2bde3e9f40b891f00e6af38fa7ad0edcd (rodzic cb077b588, przodek origin/main 0c80544ee).
SHA OBRONY (kod): a3d1bebda778e4bad7cc5a7bb0b4f7d8c35027b8 (na 727406a2b, bez merge).

ZMIANY/COMMIT: a3d1bebda, allowlista: gra/src/main.ts, gra/src/ui/unitReplacePicker.ts, gra/tools/unit-replace-multitype-walk-test.cjs. Brak zmian w units.json, WERSJE.md, manifescie, gra-robocza/, rust-port/. Bez git add -A, bez npm run build/dev.

ODPOWIEDZI NA ZARZUTY:
1. (Kryteria a i d: odtworzenie przed poprawka + zywy Chromium) -- ODRZUCAM w tej rundzie, stan: NIE ZMIERZONO.
   Dowod: w tej rundzie nie zbudowano gry (brak builda vite/dev w gra/, zakaz z dispatchu; build poza repo nie byl zakresem obrony). Chromium istnieje (/usr/bin/chromium), ale zywy przebieg wymaga builda i sterownika klikniec, a orkiestrator w 10-operator-claude.md (UWAGI) zostawil ten pomiar do decyzji FC albo osobnego LIVE-VERIFY. Nie podaje tu wynikow z pamieci. Przyczyna zrodlowa objawu pozostaje niepotwierdzona empirycznie (zgodnie z Evaluatorem: H2 i H3 prawdopodobne, H1 i H4 nie).
2. (Etykieta "Anuluj" zamiast "Zakoncz") -- PRZYJMUJE. Poprawka: gra/src/ui/unitReplacePicker.ts (przycisk naglowka: mapUnitCloseBtnHtml('Zakończ')). Commit a3d1bebda. Test nie asertuje etykiety "Anuluj" (grep po tools/unit-replace*.cjs: brak).
3. (Toast ostatniej zamiany nadpisywany uwaga koncowa) -- PRZYJMUJE. Poprawka: w onPick/onSkip ostatniej grupy uwaga "Bez zamiennika ..." dolaczana do tego samego toastu (unitReplaceHintWithTail, 5200 ms); unitReplaceChainEnd zastapione przez unitReplaceChainStopped, wywolywane TYLKO przy Zakoncz/Esc; przejscie po ostatniej grupie nie wola juz osobnego showHintMessage. Dowod: nowa asercja w unit-replace-multitype-walk-test.cjs, sekcja A: ostatni toast zawiera "Zastąp: Konnica → Rydwan" i "Bez zamiennika". Uwaga uczciwie: asercji NIE uruchomiono na kodzie przed poprawka (dowod z rozumowania nad kodem bazowym, gdzie po onPick szedl showHintMessage(note,5200) po showHintMessage('Zastąp: ...',3800)).
4. (Test stubowy; sekcja F i dwie asercje regex/includes po zrodle; brak jsdom) -- ODRZUCAM. Dowod: (a) test ma byc testem stanu łańcucha; wywoluje realne funkcje wyciete z main.ts (extractFn) i prawdziwe callbacki onPick/onSkip/onCancel przekazane do stubowanego showUnitReplacePicker, co sprawdza sekwencje modali i komunikatow (sekcje A, B, C: 25 OK / 0 FAIL). (b) Sekcja F sprawdza wyłącznie okablowanie przycisku "Pomiń ten typ" w zrodle picker (unitReplacePicker.ts), czego nie da sie zastapic bez DOM; (c) jsdom jest w gra/package.json:20 (devDependencies), ale pelny test DOM modala to nowa infrastruktura testowa i osobny temat, poza tym dispatchem. (d) Dwie asercje w unit-replace-army-multi-select-test.cjs zmienione to zmiana nazw helperow (index+1 -> openUnitReplaceGroupPicker(chain, index + 1); licznik pominietych -> unitReplaceSkipNote) przy zachowanym znaczeniu; test 36/36 zielony.
5. (Konflikt z origin/main 0c80544ee; merge-tree) -- PRZYJMUJE jako informacje i wykonuje sprawdzenie, nie integracje. Dowod: git merge-tree --write-tree a3d1bebda origin/main -> exit 0, bez konfliktow, drzewo fe602d783c78cc54cba006a42a953a30d9804590. Uwaga: to tylko test konfliktu tekstowego; semantyczny merge nie byl testowany (tsc i testy na drzewie zmergowanym nie uruchomione). Integracja i ponowne bramki po merge naleza do orkiestratora.
6. (Etykieta wodza: "Wódz:" vs "★ Wódz:") -- PRZYJMUJE. Poprawka: unitReplaceGroupLabel i etykieta noReplacement w openUnitReplaceForSelection uzywaja "★ Wódz: " jak modal. Commit a3d1bebda. Test: asercja includes('Wódz: Wojownik ×1') nadal przechodzi (podciag).

TESTY (surowe wyniki z tej rundy, po poprawkach, na a3d1bebda):
- gra/node_modules/.bin/tsc --noEmit: rc=0, 0 linii bledow (npm ci --ignore-scripts w worktree, katalog usuniety po testach).
- unit-replace-multitype-walk-test.cjs: rc=0, 25 OK / 0 FAIL (poprzednio 24/0 przed dopisaniem asercji regresji).
- unit-replace-army-multi-select-test.cjs: rc=0, 36/36.
- unit-replace-test.cjs: rc=0, 21/21.
- unit-replace-promotion-table-test, army-type-chips-test, logic-test, tech-tree-test, research-test, combat-test: rc=0.
- unit-replace-full-cost-test.cjs: rc=1, 1 linia [FAIL] (performUnitReplace: pobiera PELNY Pieniadz + surowiec); identycznie jak Evaluator odnotowal na bazie cb077b588 (dlug bazowy, nie regresja tej rundy; nie ponowiono pomiaru na bazie w tej rundzie).
- army-panel-general-label-multiselect-test.cjs: rc=1, "Build failed with 1 error" (esbuild); identycznie jak na bazie wg Evaluatora (dlug bazowy).
- git diff --check: czysto. git status po commicie: czysto.

BLOKADY: brak technicznych w obronie. NIE ZMIERZONO: zywy Chromium i odtworzenie objawu (zarzut 1). Dwa testy czerwone sa dlugiem bazowym.

RUNDY: 1/5 obrony tego tematu (kontrakt: runda Operatora 1, Evaluator 1, obrona 1; wynik Final Control do ustalenia).

UWAGI-DLA-ORKIESTRATORA (poza zarzutami, nie zmieniane w tej rundzie):
- (a) Gdy wszystkie zaznaczone typy sa BEZ zamiennika (eligible.length === 0), openUnitReplaceForSelection wola openUnitReplacePicker(targets[0]) i pokazuje tylko przyczyne dla pierwszej jednostki. Nazwy pozostalych typow bez zamiennika nie trafiaja do komunikatu, co jest sprzeczne z GOAL ("typy bez zamiennika nazwane po nazwie"). Zarzutu Evaluator nie zglosil. Proponuje osobny maly temat albo rozstrzygniecie w FC; nie robiono tu, bo wykracza poza zarzuty.
- (b) Dlug testowy do przypisania: test sekcji F bez DOM (jsdom dostepny w devDependencies).
- (c) Dwa testy czerwone bazowe: unit-replace-full-cost-test (1 FAIL), army-panel-general-label-multiselect-test (blad builda).
- (d) Zywy pomiar w Chromium (zarzut 1): do FC albo osobnego LIVE-VERIFY; przeglad przed deployem.

NASTĘPNY KROK: Final Control na a3d1bebda (zarzut 1 jako NIE ZMIERZONO do decyzji orkiestratora), potem merge-tree/integracja z origin/main 0c80544ee (test konfliktu tekstowego czysty), potem bramki na zmergowanym drzewie.
DEPLOY/PUSH: NIE WYKONANO
