STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar na zywo w Chromium, bez zmian w gra/src i gra/data)
TEMAT: R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1
GOAL: runda 3/5 (Operator SONNET, uzasadnienie: 2 nieudane rundy Haiku, FC FAIL r1 i r2 na punkcie 3) - punkt 3 dispatchu: straty zwyciezcy, bitwa reczna Z ROZKAZAMI vs AUTO vs skip, pary 10 vs 10, tryb "pewne" 1 przebieg, "losowe" 3 ziarna. Baza: bf3f65f04 (detached). W18 zamkniety (FALA/FC r4, w main). W24 PASS przy 1024/900/800 px (r1, wynik zachowany).

ZMIANY-COMMIT:
- Ten raport.
- gra/tools/live-verify-w3-manual-orders-r3.cjs (nowy harness, zacommitowany).
- dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1/evidence/w3-manual-orders-10v10-r3.json (24 przebiegi, zacommitowany).
- Brak zmian w gra/src, gra/data, gra-robocza, WERSJE.md (git diff --stat bf3f65f04 -- gra/src gra/data = puste). Brak git add -A. PNG nie powstawaly.
- Build: uzyto istniejacego buildu z r2 (scratchpad dist-r2, vite --outDir poza repo, zbudowany z d5323fadf; src/data bf3f65f04 sa z nim identyczne wg git diff --stat). Nie uruchamiano npm run build/dev.

NAPRAWA Z FC r2 (jak zrobiono):
1. RECZNA = prawdziwie reczna. Driver: w kazdej rundzie dla KAZDEJ zywej jednostki gracza ustawia zaznaczenie (_selectedUnits) i wydaje rozkaz ATAK na najblizszego wroga przez produkcyjna sciezke _issueBattleAttack(targetId, queueOnly=true) (ta sama co Shift+LPM na wrogu), po czym klawisz Spacja (Playwright keyboard.press) wykonuje kolejke. Faza 1 = _battleAwaitingOrders (planowanie), kolejne rundy = wykrycie zmiany roundNo i ponowne rozkazy. Dowod w JSON (pole actions): ordersIssued/orderRounds/spacePresses, np. wrecz-pewne: 34 rundy rozkazow, 74 rozkazy, 34 Spacje; wrecz-losowe-s3: 55 rund, 220 rozkazow. OGRANICZENIE (jawnie): rozkazy wydawane wywolaniem metody sceny, NIE klikiem myszy w plotno (pozycje na plotnie przy zamrozonym rAF/renderze nie sa wiarygodne); Start walki to prawdziwy klik page.click, Spacja i R to prawdziwe klawisze. Jako przyblizenie "klikniecia" uznaje sie Shift+LPM (kolejka), nie sam klik.
2. SIGTRAP w battle-manual-full-roster-pointer-live-test.cjs: NIE diagnozowano (zgodnie z dopuszczeniem w DODATKU uzyto sterownika z pkt 1 zamiast niego). Chromium /usr/bin/chromium z argumentami --no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader startuje poprawnie we wszystkich 24 przebiegach + 5 przebiegach probnych.
3. Pary 10 vs 10 OSIAGNIETE bez zmian w gra/src: w fazie rozstawienia (przed Startem) harness przycina listy scene.atk/scene.def presetu ?playtest=bitwa-duza (28 vs 28) do 10 jednostek wybranego typu na strone (usuniecie z tablic + z grafu sceny; _syncGroupRegistry). Zalozenie: preset NIE zawiera Wojownika (typy: Hastati, Falanga[Phalanx], Lucznik[Archer], Konnica[Horseman]); para "wrecz" = Hastati (atakujacy) vs Falanga (obronca), para "dystans" = Lucznik (atakujacy) vs Falanga (obronca). Falanga jest pancerna/obronna - to wyjasnia wygrane obroncy. Potwierdzone w JSON: trimInfo.atkAfter/defAfter = 10/10 w kazdym przebiegu. NIE ZMIERZONO pary Wojownik vs Wojownik (brak typu w presecie bez zmiany src).

TESTY (liczby z surowego wyjscia, plik evidence JSON; "straty zwyciezcy" = zwyciezcy to zawsze OBRONCA, Falanga):
Kolumny: para | tryb trafien | ziarno | tryb bitwy | zwyciezca | straty zwyciezcy (utracone jednostki z 10, HP koncowe) | straty przegranego | rundy bitwy | rozkazy (rundy/lacznie, tylko reczna).

| para | trafienia | ziarno | tryb bitwy | zwyciezca | straty zwyciezcy | straty przegranego | rundy | rozkazy |
|---|---|---|---|---|---|---|---|---|
| dystans Lucznik 10 vs Falanga 10 | losowe | 1 | RECZNA z rozkazami | obronca | 0/10 (HP 400/400) | 5/10 (zostalo 5) | 29 | 30/185 |
| dystans Lucznik 10 vs Falanga 10 | losowe | 1 | AUTO | obronca | 0/10 (HP 396/400) | 10/10 (zostalo 0) | 9 | 0/0 |
| dystans Lucznik 10 vs Falanga 10 | losowe | 1 | skip (Pomin) | obronca | 0/10 (HP 396/400) | 10/10 (zostalo 0) | 33 | 0/0 |
| dystans Lucznik 10 vs Falanga 10 | losowe | 2 | RECZNA z rozkazami | obronca | 0/10 (HP 400/400) | 5/10 (zostalo 5) | 27 | 28/176 |
| dystans Lucznik 10 vs Falanga 10 | losowe | 2 | AUTO | obronca | 0/10 (HP 390/400) | 10/10 (zostalo 0) | 12 | 0/0 |
| dystans Lucznik 10 vs Falanga 10 | losowe | 2 | skip (Pomin) | obronca | 0/10 (HP 394/400) | 10/10 (zostalo 0) | 35 | 0/0 |
| dystans Lucznik 10 vs Falanga 10 | losowe | 3 | RECZNA z rozkazami | obronca | 0/10 (HP 400/400) | 4/10 (zostalo 6) | 28 | 29/197 |
| dystans Lucznik 10 vs Falanga 10 | losowe | 3 | AUTO | obronca | 0/10 (HP 390/400) | 10/10 (zostalo 0) | 35 | 0/0 |
| dystans Lucznik 10 vs Falanga 10 | losowe | 3 | skip (Pomin) | obronca | 0/10 (HP 390/400) | 10/10 (zostalo 0) | 12 | 0/0 |
| dystans Lucznik 10 vs Falanga 10 | pewne | 1 | RECZNA z rozkazami | obronca | 0/10 (HP 398/400) | 5/10 (zostalo 5) | 27 | 28/168 |
| dystans Lucznik 10 vs Falanga 10 | pewne | 1 | AUTO | obronca | 0/10 (HP 382/400) | 10/10 (zostalo 0) | 8 | 0/0 |
| dystans Lucznik 10 vs Falanga 10 | pewne | 1 | skip (Pomin) | obronca | 0/10 (HP 382/400) | 10/10 (zostalo 0) | 8 | 0/0 |
| wrecz Hastati 10 vs Falanga 10 | losowe | 1 | RECZNA z rozkazami | obronca | 0/10 (HP 373/400) | 10/10 (zostalo 0) | 40 | 41/132 |
| wrecz Hastati 10 vs Falanga 10 | losowe | 1 | AUTO | obronca | 1/10 (HP 323/400) | 10/10 (zostalo 0) | 25 | 0/0 |
| wrecz Hastati 10 vs Falanga 10 | losowe | 1 | skip (Pomin) | obronca | 1/10 (HP 323/400) | 10/10 (zostalo 0) | 22 | 0/0 |
| wrecz Hastati 10 vs Falanga 10 | losowe | 2 | RECZNA z rozkazami | obronca | 0/10 (HP 367/400) | 10/10 (zostalo 0) | 54 | 55/205 |
| wrecz Hastati 10 vs Falanga 10 | losowe | 2 | AUTO | obronca | 0/10 (HP 358/400) | 10/10 (zostalo 0) | 26 | 0/0 |
| wrecz Hastati 10 vs Falanga 10 | losowe | 2 | skip (Pomin) | obronca | 0/10 (HP 358/400) | 10/10 (zostalo 0) | 26 | 0/0 |
| wrecz Hastati 10 vs Falanga 10 | losowe | 3 | RECZNA z rozkazami | obronca | 0/10 (HP 355/400) | 10/10 (zostalo 0) | 54 | 55/220 |
| wrecz Hastati 10 vs Falanga 10 | losowe | 3 | AUTO | obronca | 2/10 (HP 285/400) | 10/10 (zostalo 0) | 32 | 0/0 |
| wrecz Hastati 10 vs Falanga 10 | losowe | 3 | skip (Pomin) | obronca | 2/10 (HP 285/400) | 10/10 (zostalo 0) | 32 | 0/0 |
| wrecz Hastati 10 vs Falanga 10 | pewne | 1 | RECZNA z rozkazami | obronca | 0/10 (HP 361/400) | 10/10 (zostalo 0) | 33 | 34/74 |
| wrecz Hastati 10 vs Falanga 10 | pewne | 1 | AUTO | obronca | 0/10 (HP 351/400) | 10/10 (zostalo 0) | 13 | 0/0 |
| wrecz Hastati 10 vs Falanga 10 | pewne | 1 | skip (Pomin) | obronca | 0/10 (HP 351/400) | 10/10 (zostalo 0) | 12 | 0/0 |

Tryb "pewne": 1 przebieg na kombinacje (deterministyczne - ziarna daja ten sam wynik, oczekiwane). Tryb "losowe": ziarna 1, 2, 3 (rozne wyniki AUTO: np. wrecz 1/0/2 utraconych Falang).

Bramki referencyjne: brak zmian kodu - tsc --noEmit i 5 bramek NIE uruchamiane w tej rundzie (NIE ZMIERZONO; r1 raportowal tsc exit 0 na tym samym kodzie).

OBSERWACJE (dane, bez wyroku "blad/OK"):
1. W KAZDEJ z 8 konfiguracji Falanga (obronca) wygrywa w KAZDYM trybie. Wrecz (Hastati 10 vs Falanga 10): zwyciezca traci 0 jednostek w trybie recznym (wszystkie 4 konfiguracje), a w AUTO/skip 0-2 jednostek (losowe s1: 1, s3: 2) - czyli RECZNA z rozkazami wypada dla obroncy LEPIEJ (HP koncowe obroncy 355-373 vs AUTO 285-358; "pewne": 361 vs 351) i trwa ok. 1,5-2x wiecej rund (33-54 vs 13-32).
2. Dystans (Lucznik 10 vs Falanga 10): AUTO/skip = Lucznicy gina 10/10, obronca traci 0 jednostek (HP 382-396/400). RECZNA z rozkazami = Lucznicy traca 4-5/10, a 5-6 Lucznikow zostaje z pelnym HP 20 i amunicja 11-12 - bitwa konczy sie "zwyciestwem OBRONCY" (log: "Archer uciekl z pola bitwy"), czyli oddzial atakujacy tracil morale/uciekl, nie zostal wybity. Przyczyny NIE diagnozowano (hipoteza: zalamanie morale armii atakujacej przy rozkazach "atakuj najblizszego" prowadzacych lucznikow w zwarcie z Falanga zamiast kitowania; do potwierdzenia osobnym pomiarem). Dane w evidence (diag_survivors_rerun).
3. AUTO vs skip (DODATEK pkt 4, obserwacja bez wyroku): w "pewne" AUTO i skip daja IDENTYCZNY wynik (wrecz 0 strat/HP 351/r13 vs r12; dystans HP 382/r8 - strat zwyciezcy 0 w obu). Roznica rund o 1 przy identycznych stratach (wrecz pewne r13 vs r12). W "losowe" straty zwyciezcy (liczba jednostek) sa IDENTYCZNE AUTO vs skip we wszystkich 6 konfiguracjach wrecz+dystans (np. wrecz s1 1/1, s3 2/2), natomiast liczba rund rozni sie mocno przy dystansie: s1 AUTO 9 vs skip 33; s2 12 vs 35; s3 35 vs 12 (odwrocenie kierunku) i HP obroncy rozni sie lekko (s2: 390 vs 394). W r2 (mieszane 28 vs 28) zmierzono dodatkowo P1 AUTO 11 vs skip 10 strat zwyciezcy i P2 10 vs 13 - tu przy parach 10 vs 10 liczby jednostek sa identyczne, wiec rozjazd r2 dotyczyl mieszanych armii z konnica/lucznikami. Hipoteza (NIE potwierdzona): skip i AUTO roznia sie kolejnoscia/zuzyciem strumienia losowego przy animacjach i pocisku dystansowych (liczba rund nie jest zgodna), a przy parze wrecz strumien jest zgodny.
4. Powtarzalnosc: 4 konfiguracje x 3 tryby z r2 (28 vs 28) potwierdzily bit-w-bit r1 (zapisane w r2); r3 nie powtarzal par 28 vs 28.

BLOKADY (jawnie):
1. Rozkazy nie sa klikami w plotno (patrz wyzej); wzorzec pointer z battle-manual-control-multicycle-live-test.cjs nie zostal uzyty (wymaga widocznego renderu i pozycji na plotnie; przy zamrozonym rAF niewiarygodne). Zastapienie: _issueBattleAttack(queueOnly=true) + Spacja (klawisz), po jednym podejsciu - wystarczylo do 24 zakonczonych bitew.
2. Strategia rozkazu = "atakuj najblizszego wroga" dla wszystkich jednostek, kazda runde. To nie jest optymalna gra czlowieka (np. brak kitowania lucznikow) - wynik recznej jest pomiarem TEGO sterownika, nie "gracza w ogole".
3. Wojownik nie wystepuje w presecie - para wrecz = Hastati vs Falanga (nie "ten sam typ").
4. Przyciecie rosteru jest operacja na stanie sceny w fazie rozstawienia (w page.evaluate), nie wyborem w UI.
5. Hak trybu trafien __civSetHitMode ustawiany przed startem (jak w r1/r2).

RUNDY: 3/5 (r1 DECISION_REQUIRED/FAIL, r2 FAIL, r3 ta).

NASTEPNY KROK: Final Control. Decyzja wlasciciela (poza zakresem): czy ocenic balans Falanga vs Hastati / Lucznik (pomiar pokazuje wygrana Falangi we wszystkich 8 konfiguracjach, w tym 0 strat w recznej), oraz zachowanie lucznikow w recznej z "atakuj najblizszego" (5-6 uciekajacych z pelnym HP) - czy to zamierzone.

UWAGI-DLA-ORKIESTRATORA:
- Harness wymaga Playwright; w worktree brak node_modules, uzyto NODE_PATH=/opt/node-tools/node_modules (stala sciezka narzedziowa) i builda dist-r2 w scratchpadzie (sprzatanie po stronie orkiestratora).
- Przyklad komendy: cd gra; NODE_PATH=/opt/node-tools/node_modules node tools/live-verify-w3-manual-orders-r3.cjs <dist> <out.json> [limit_s]; filtry env W3_ONLY=<id,..>, W3_MODES=manual,auto,skip.

DEPLOY/PUSH: NIE WYKONANO
