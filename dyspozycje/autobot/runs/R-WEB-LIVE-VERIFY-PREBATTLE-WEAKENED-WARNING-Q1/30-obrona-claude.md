STATUS: PASS-WITH-NOTES (obrona rundy 1; wszystkie 5 zarzutow przyjete z poprawka i dowodem; nie wydaje werdyktu FC)
DOMAIN: GAME (weryfikacja live; zero zmian w gra/src, gra/data, balansie, wikiBundle, WERSJE.md)
TEMAT: R-WEB-LIVE-VERIFY-PREBATTLE-WEAKENED-WARNING-Q1
GOAL: zmierzyc w zywej grze okno przed bitwa dla kar: glod wojska, deficyt zlota, brak kary, strona barbarzyncow, wymiary 1280x800 i 1024x640, zrzuty bez nakladki konca gry.
BAZA: ce6efd986 (kandydat Operatora; sprawdzone: HEAD worktree = ce6efd986 przed zmiana). Dodatkowo worktree zalozony na origin/main 807ecebdd jak w dodatku orkiestratora.
ZMIANY-COMMIT: gra/tools/live-verify-prebattle-weakened-q1.cjs (przepisany: asercje, kod wyjscia, hak suppressVictory, pomiar karty .pb-weak, scenariusz hunger-stack); dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-PREBATTLE-WEAKENED-WARNING-Q1/30-obrona-claude.md; evidence/pb-run4.json; shots-run4/*.png (8 PNG). SHA: patrz pole sha w odpowiedzi (commit z tym raportem). Poprzednie shots-run3/ i evidence/pb-run3.json ZOSTAJA bez zmian jako historia; shots-run3 maja nakladke ZWYCIESTWO i sa uznane za nieaktualne.
TESTY:
- tsc --noEmit (gra/, po npm ci w gra/): exit 0, bez wyjscia bledow.
- live-verify-prebattle-weakened-q1.cjs, bundle vite z origin/main 807ecebdd + ten sam kod gry (build poza repo w scratchpad, 37 s): 8 przebiegow (4 scenariusze x 2 wymiary), SUMMARY {"total":92,"failed":0}, pageErrors puste we wszystkich 8, kod wyjscia 0 (wynik "failed 0" z surowego wyjscia; exitCode ustawiany na 1 przy kazdej nieudanej asercji).
- Odczyt liczb z evidence/pb-run4.json (surowe): glod 1280x800 i 1024x640: .pb-weak = "▼ Osłabieni: głód wojska −25% (poza pancerzem)", pb-you; gold 1280x800 i 1024x640: "▼ Osłabieni: deficyt złota −25% (poza pancerzem)", pb-you; none 1280x800 i 1024x640: weakCount 0; hunger-stack 1280x800 i 1024x640: 8 widocznych jednostek, "+4 więcej…", .pb-weak pb-you.
- Mnozniki z gra/data/econ-params.json (ekonomia_miasta.glod_wojska_stat_mult = 0,75, zloto_deficyt_stat_mult = 0,75 dla easy/normal/hard): oczekiwane 25%, zgodne.
- Wszystkie 8 przebiegow: turnAfterEnd = 2, victoryOverlayRemoved = [] (nakladka zwyciestwa nie pojawila sie), selectedByClick = frozen_47_10_0_4, selectionMethod = "klik", docScroll bez przewijania, offscreenOverlayElements = 0.
- prebattle-weakened-warning-test.cjs (22 OK z r1) NIE powtorzony w tej rundzie (kod gry nie zmieniony; log z r1 pozostaje w evidence/).
- Pozostale bramki referencyjne (logic, tech-tree, research, unit-replace, combat): NIE_URUCHOMIONO w tej rundzie - zmiana dotyczy wylacznie gra/tools/ i nie dotyka kodu gry. Liczby z zarzutu Evaluatora (213/213, 20/20, 33/33, 21/21, 6/6) przyjmuje jako jego pomiar, nie moj.
- git diff --check: czysty.

ODPOWIEDZI NA ZARZUTY EVALUATORA:

Zarzut 1 (f: zrzuty z nakladka ZWYCIESTWO) — PRZYJMUJE.
  Poprawka: (a) hak HAK suppressVictoryForTest (__truceTestDebug, main.ts:30329 i sprawdzenie w sprawdzPrzegranaPoUtracieMiasta, main.ts:36250 / zwyciestwo w pierwszym EOT mapy testowej) wywolany po starcie gry; (b) tuz przed zrzutem usuwane sa #__victory_screen__ i #__gameover_overlay__ (lista w polu victoryOverlayRemoved). Dowod: w 8 przebiegach victoryOverlayRemoved = [] - nakladka nie wystapila. Wizualnie: shots-run4/hunger-stack-1024x640.png pokazuje okno "Rozstawienie bitwy" z ostrzezeniem "▼ Osłabieni: głód wojska −25%" na karcie dowodcy, bez ekranu ZWYCIESTWO. Turn po endTurn = 2 we wszystkich przebiegach (poprzednio 1 w hunger|1280x800).

Zarzut 2 (e: pomiar zlego elementu) — PRZYJMUJE.
  Poprzednio mierzono najwyzsze dziecko .pb-overlay (roster wroga, pb-foe). Teraz: karta .pb-cmd zawierajaca .pb-weak (weakCardBox: 1280x800 top 14 bottom 153, 1024x640 top 14 bottom 166; side = player; maxHeight none; overflowY visible), wszystkie .pb-roster (wroga i wlasny) oraz liczba elementow poza viewport (offscreenOverlayElements = 0 we wszystkich 8). Dodany scenariusz hunger-stack: 12 jednostek gracza -> 8 pokazanych i "+4 więcej…" (rosters[pb-you].shown = 8, more = "+4 więcej…"), dolna krawedz rostra 454 px w 1024x640 i 614 px w 1280x800 (w viewport). Asercje: "lista wojsk gracza pokazuje 8 i +N więcej" oraz "miesci sie w viewport" - PASS.
  Zastrzezenie NIE_ZMIERZONO: nie zbudowano przypadku, w ktorym karta przekracza wysokosc viewportu (max-wysokosc/przewijanie nie zostaly wymuszone); 640 px jest najmniejszym wymiarem z dispatchu. Na zrzucie hunger-stack-1024x640 dolna czesc rostra gracza (do y 454) jest czesciowo zakryta przez istniejacy panel "Rozstawienie bitwy" - to uklad okna przygotowania, nie ostrzezenie o osłabieniu; poza zakresem tego tematu (zgloszone w UWAGI).

Zarzut 3 (d: strona barbarzyncow nie zmierzona na zywo) — PRZYJMUJE.
  Dowod: w kazdym przebiegu z kara dokladnie jeden .pb-weak (weakCount = 1) i jest w karcie pb-you (weakSide = player); asercja "strona barbarzyncow (pb-foe) bez ostrzezenia" (foeHasWeak = false) - PASS w 6 przebiegach z kara. W przebiegu none brak .pb-weak w obu kartach. Granica: mierzona jest strona barbarzyncow BEZ kary (jedyny stan osiagalny w tym tescie, barbarzyncy nie maja flag glodu/deficytu w tej sciezce). Scenariusz "barbarzyncy z kara" nie byl testowany live.

Zarzut 4 (brak asercji i kodu wyjscia) — PRZYJMUJE.
  Dodane: lista asercji w out.assertions (92 pozycje), out.summary.failed, process.exitCode = 1 przy kazdej nieudanej asercji. Oczekiwane procenty wyliczane z gra/data/econ-params.json (nie wpisane recznie): round((1-0,75)*100) = 25 dla obu kar. Porownanie tekstu: dokladnie "głód wojska −25%" / "deficyt złota −25%" i brak drugiego wpisu w tym samym oknie.

Zarzut 5 (zaznaczenie kliknieciem, flagi, BLOCK 2 nieaktualny, turnAfterEnd=1) — PRZYJMUJE CZESCIOWO.
  (i) Klik zaznaczenia: w run4 klik zaznaczyl jednostke we wszystkich 8 przebiegach (selectionMethod = "klik", selectedByClick = frozen_47_10_0_4). Przyczyna braku zaznaczenia w run3 NIE ZOSTALA USTALONA; fallback __frozenTestDebug.select pozostaje w kodzie i jest zapisywany jako selectionMethod = hak-select, gdy klik zawiedzie.
  (ii) BLOCK 2 z mojego raportu r1 jest NIEAKTUALNY dla run3: pb-run3.json, scenariusz gold, ma wylacznie "▼ Osłabieni: deficyt złota −25%" (w 1280x800 i 1024x640); mieszanie obu wpisow pochodzilo z pierwszego, wycofanego przebiegu (run1), ktorego nie ma w dowodach. Wpis BLOCK 2 nalezy uznac za zamkniety.
  (iii) turnAfterEnd = 1 w hunger|1280x800 (run3): harness czekal tylko 800 ms po endTurn. W run4 tura jest czekana jawnie (waitForFunction turn === 2, do 30 s) i wszystkie 8 przebiegow daje 2. Przyczyna pierwotnego 1 NIE jest dowiedziona (najbardziej prawdopodobne: stale oczekiwanie, nie blokada "Zakończ turę" - tego nie sprawdzono).
  (iv) NIE_ZMIERZONO: zrodlo flagi. Kod (main.ts:35527 preBattleWeakenedForRoster) bierze hungry z isArmyHungry(ownerId) i goldDeficit z isGoldDeficit(ownerId), ale zaden hak nie wystawia tych flag, wiec w zywej grze zmierzony jest tekst w DOM, a NIE wartosc flagi przed atakiem. Stan spichlerza/skarbca ustawiany hakiem i wynik w DOM sa zgodne, lecz lancuch "hak -> isArmyHungry -> DOM" jest dowiedziony tylko czesciowo.

BLOKADY:
1. Przyczyna pierwotnego turnAfterEnd=1 i brak zaznaczenia klikiem w run3 nie zostala ustalona (zob. Zarzut 5 i/lub, iii).
2. Flagi isArmyHungry/isGoldDeficit nie sa czytane w zywej grze (brak haka odczytu); lancuch stan -> flaga -> DOM tylko w czesci zmierzony.
3. Przypadek przepelnienia karty (wysokosc viewportu przekroczona) nie zbudowany; przewijanie NIE_ZMIERZONO.
4. Scenariusz z kara u strony barbarzyncow nie testowany live.
5. Zaleznosc srodowiskowa: gra/node_modules zainstalowane lokalnie (npm ci, ignorowane przez git) i usuwane po pracy.

RUNDY: 1/5 (obrona = Haiku). Operator/obrona nie zmienia kodu gry.
NASTEPNY KROK: FC (Sonnet) ma potwierdzic: (a) asercje i kod wyjscia 0 (92/0) w surowym JSON; (b) zrzuty bez ZWYCIESTWO w shots-run4/; (c) ze pomiar karty .pb-weak i scenariusz hunger-stack sa wiarygodne; (d) ze blokady 1-5 sa zapisane uczciwie. Ewentualna runda 2 tylko na blokady 2 i 3 (osobny hak odczytu flag i przypadek przepelnienia), bez zmian gra/src.

UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez tworzenia sesji):
- Uklad okna "Rozstawienie bitwy" na 1024x640 zaslania dolna czesc listy wojsk gracza przy 12 jednostkach (shots-run4/hunger-stack-1024x640.png). To nie jest defekt ostrzezenia o osłabieniu; warto osobny temat R-WEB-* jesli ma byc poprawiony.
- W runach Operatora (run3, bez haka suppressVictoryForTest) nakladka ZWYCIESTWO pojawiala sie w turze 2 (zob. zarzut 1; w run4 z hakiem nie wystapila). Warto sprawdzic, czy warunek dominacji w mapie testowej jest zamierzony.

DEPLOY/PUSH: NIE WYKONANO
