STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FLEE-SPEED-HARAPPA-FASTER-Q1
GOAL: Obrona po Evaluatorze (cbef49b22): odpowiedz na 3 zarzuty, dowod w tescie, bez zmiany reguly gry.
ZMIANY-COMMIT: baza 12b5cbbae (detach). Zmiany tylko w tescie: gra/tools/battle-flee-move-half-browser-entry.ts (hook ?inject=midwave), gra/tools/battle-flee-speed-parity-test.cjs (4. przypadek). Kod gry (battleScene.ts) bez zmian (mutacja przywrocona, git status czysty poza tymi plikami). Commit: patrz pole sha.
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJE. Dodany przypadek "Wojownik zlamany w trakcie fali (normalPlan)": jednostka oznaczona jako zlamana w zamrozonej fali (galaz normalPlan, battleScene.ts:6232-6236). Mutacja capa w tej galezi (ru.moveLeft = ru.moveLeft): 1 FAIL ("Warrior atk#1 max krokow/tura 4, limit 2"), przed mutacja 0 FAIL. Po przywroceniu: 52 PASS, 0 FAIL.
2. ODRZUCAM z dowodem: data/civ-matrix.json, blok Harappy (linie 1578-1678): walka_ruch_bitwa_proc = 0 (l.1609), walka_ruch_piechota_teren_plytkie_morze = 0 (l.1623), walka_ruch_rydwany = 0 (l.1624). Brak bonusu ruchu Harappy, wiec pusta lista cywilizacji w harnessie nie zmienia pomiaru Harappy. Bonusy graczy przyspieszylyby tylko ich jednostki. Tabela mnoznikow Harappy: cywilizacja 1.00, droga/rzeka NIE ZMIERZONO, epoka i dowodca NIE ZMIERZONO (kod ruchu w bitwie nie czyta epoki).
3. PRZYJMUJE jako ograniczenie: tryb reczny, odwrot po bitwie (post-battle-map tryTwoHexRetreat) NIE ZMIERZONO. Wniosek "brak regresu" dotyczy tylko autobitwy/skip.
DANE (units.json): Garnizon Harappy "Ruch w bitwie (heksy)" = 3 (rekord Typ Spearman, Jednostka Garnizon Harappy); Strażnik bram Harappy = 3; Wojownik = 4; Rydwan = 6 (Ruch 5). Ucieczka wg reguly = floor(0.5 x 3) = 1 heks/ture. Obserwacja wlasciciela (~5-6 heksow) NIE zostala odtworzona w autobitwie: maxPerRound = 1 dla wszystkich 9 uciekinierow Strażnika (przypadek "Strazhnik bram Harappy atk vs Hastati def" i "...def vs Hastati atk").
TESTY:
- tsc --noEmit: exit 0 (sprawdzone po zmianach testu).
- battle-flee-speed-parity-test.cjs (Chromium, /usr/bin/google-chrome): 53 PASS, 0 FAIL (z mutacja: 50 PASS, 1 FAIL); po przywroceniu 52 PASS, 0 FAIL (liczby z surowego wyjscia). Dwa przebiegi bez mutacji daly 53 i 52 PASS (liczba asercji zalezy od liczby uciekinierow); przyczyny roznicy nie zbadano, 0 FAIL w obu.
- battle-flee-move-half-test.cjs (istniejacy): NIE ZAKONCZONY w ~15 min w tym srodowisku, proces przerwany (exit 143). NIE ZMIERZONO w tej rundzie; Operator w rundzie 1 podal 34 PASS.
BLOKADY: brak blokad kodu. Otwarte pytanie do wlasciciela: reczny tryb bitwy lub zapis z konkretna jednostka i cywilizacja (potrzebne do pomiaru pozycja/przed/po i wizualnego tempa).
ODCHYLENIE OD ALLOWLISTY (jawnie): zmieniono entry .ts (plik *flee*, wspolny dla testow ucieczki), bo hook musi byc zalozony przed zamrozona fala, a .cjs tego nie zrobi.
RUNDY: 2/5 (runda 2: zarzuty Evaluatora 1-3)
NASTEPNY KROK: Evaluator (Sonnet) weryfikuje nowy przypadek i mutacje; orkiestrator decyduje o pomiarze trybu recznego.
UWAGI-DLA-ORKIESTRATORA: wlasciciel zglasza "jak chariot" - w autobitwie tego nie widac. Mozliwe przyczyny poza zakresem tej rundy: tryb reczny, tempo wizualne (tween), odwrot po bitwie. Nie zmieniano danych ani reguly.
DEPLOY/PUSH: NIE WYKONANO
