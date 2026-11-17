STATUS: PASS-WITH-NOTES (Evaluator nie wydaje werdyktu końcowego; poniżej zarzuty)
DOMAIN: GAME (dane tekstowe)
TEMAT: R-WEB-DATA-CIV-INTRO-TEXTS-Q1
GOAL: Teksty ekranu powitalnego nowej cywilizacji (15 cywilizacji: rys + 3 powitania przyjazne + 3 nieprzyjazne), bez zmian kodu.
ZMIANY-COMMIT: kandydat 17363f2c4827bbc66b5dab04af48f723c3aadd5a (potomek bazy ac35200a1; `git diff --name-only` baza..kandydat = dokładnie 4 pliki: gra/data/civ-intro-texts.json, gra/tools/civ-intro-texts-test.cjs, dyspozycje/.../TEKSTY-DO-AKCEPTACJI.md, dyspozycje/.../10-operator-claude.md; wszystko w allowliście). `git diff --check` czysty. Ten raport: jedyny plik dodany przez Evaluatora.

TESTY (własne uruchomienie na checkoutcie kandydata, node_modules z symlinku do innego worktree, ten sam package-lock):
- `node gra/tools/civ-intro-texts-test.cjs` -> "OK (15 cywilizacji, 90 powitan)", exit 0.
- `tsc --noEmit` exit 0; logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6. Wszystkie exit 0, brak potrzeby porównania z bazą (JSON nie jest nigdzie importowany).
- Mutacje na KOPIACH w scratchpadzie (6/6 czerwone, exit 1): brak klucza egipt; puste powitanie sumer; zduplikowane powitanie grecy; imię władcy (Perykles) w powitaniu; apostrof w rysie; liczba "1500" w powitaniu. Oryginał po mutacjach: exit 0.
- Spójność TEKSTY-DO-AKCEPTACJI.md z JSON: wszystkie 15 rysów i 90 powitań występuje w pliku .md dosłownie (0 brakujących).
- Długości rysów 410-488 znaków, 4 zdania każdy; zgodne z GOAL (350-600) i testem (300-700).
- Zgodność z civs.json (styl/religia/jednostka): brak sprzeczności; Harappa "handel wewnętrzny" zgodny z civs.json.

KRYTERIA BINARNE (1-5 z dispatchu): spełnione formalnie (klucze = ikonaId, pola, typy, brak apostrofów/podwójnych spacji/liczb/imion władców, po 3 unikalne powitania, kod gry bez zmian, TEKSTY-DO-AKCEPTACJI.md istnieje, nic nie jest importowane).

ZARZUTY (numerowane; żaden nie blokuje formalnych kryteriów binarnych):
1. Błąd językowy (kryterium 3, poprawna polszczyzna): Babilonia, rys: "na kamiennej stelii" — poprawnie "na kamiennej steli". Dowód: `grep stelii` = 1 trafienie w civ-intro-texts.json (i w .md).
2. Powitania nieprzyjazne zawierają wprost lub aluzyjnie groźbę militarną, mimo reguły "bez gróźb wojny z góry" (kryterium 1): Rzymianie ("ciężar naszych legionów za plecami"), Egipt ("Rydwany moich wojsk stoją gotowe na granicy"), Celtowie ("gotowi do szarży ... zanim przekroczysz granicę"), Hetyci ("rydwany gotowe do wymarszu"), Chińczycy ("nasze szeregi są czujne", "groźne chmury"), Grecy ("hoplici trzymają włócznie w pogotowiu"). Test tego nie wykrywa (brak asercji tonu). Zalecenie: złagodzić albo zostawić do decyzji właściciela przy akceptacji.
3. Niespójność gramatyczna: Grecy, przyjazne 1: "nad twoją drogą i nad waszym przyjazdem" (mieszanie 2 os. l. poj. i l. mn.). Zulusi, przyjazne 1: "Niech twoje kroki będą pewne, a przodkowie czuwają" (po "niech" powinno być "niech przodkowie czuwają"/"a przodkowie niech czuwają").
4. Powtórzony zwrot otwierający w różnych cywilizacjach: "Mądrość przodków uczy, że ..." występuje w Chinczycy (przyjazne 3) i Egipt (przyjazne 3) — nie są identyczne (test unikalności przechodzi), ale obniża "charakterystyczność dla kultury" (kryterium 1).
5. Dokładność historyczna (nie złamanie kryterium, uwaga): Harappa "Mieszkańcy handlowali wewnątrz swojego obszaru" — zgodne z civs.json, lecz historycznie pomija handel z Mezopotamią; "mury chroniły przed kaprysami rzek" jest uproszczeniem. Hetyci/Egipt/Asyria: fakty ogólne, bez wykrytych błędów. Nie zweryfikowano źródłowo (brak dostępu do źródeł; ocena z wiedzy własnej) — NIE_ZMIERZONO.
6. Luka w teście (nie osłabienie): test nie sprawdza angielskich słów, surowych ID ani tonu; kryterium 3 dispatchu ("bez angielskich słów, bez surowych ID") nie ma asercji — spełnione tylko według ręcznego przeglądu (wyrażenie regularne na typowe angielskie końcówki: brak trafień).
7. Test wywołuje `require(civs.json)` względem ścieżki katalogu — działa; brak zarzutu. (Pozycja informacyjna: test akceptuje argument ścieżki do mutacji — zgodnie z dispatchem.)

BRAK osłabionych testów (test jest nowy; żadnego istniejącego nie zmieniono). Brak zmian poza allowlistą.

BLOKADY: brak. NIE_ZMIERZONO: poprawność historyczna względem źródeł; wygląd w UI (UI nie istnieje, nie jest wymagane).
RUNDY: Evaluator, runda 1/5.
NASTĘPNY KROK: Obrona (zarzuty 1-4, 6) -> Final Control; akceptacja tekstów przez właściciela przed tematem UI.
UWAGI-DLA-ORKIESTRATORA: zarzut 1 jest jednoznacznym błędem i trywialnym do poprawki; zarzuty 2-4 to decyzje redakcyjne (kandydaci do przeglądu właściciela razem z TEKSTY-DO-AKCEPTACJI.md).
DEPLOY/PUSH: NIE WYKONANO
