STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/weryfikacja; zero zmian gra/src i gra/data)
TEMAT: R-WEB-AI-REBEL-VERIFY-LIVE-Q1 (tag AIREBELVER)
GOAL: odpowiedzi na zarzuty Evaluatora (commit 2c140bedb, kandydat 025046346) i domkniecie pozycji 1-5 na MAKSIMUM (Trudny, Kultura i religia trudny, Koszty jednostek wysoki x4, Dyplomacja i wojna trudna).
RUNDY: 2/5 (obrona po FC r1 FAIL i Evaluatorze r2; wszystkie zarzuty 1-9 ponumerowane ponizej)
BAZA: 025046346 (checkout --detach), wyniki w tej rundzie na tym samym gra/src (brak zmian w gra/src).

ZMIANY-COMMIT (allowlista):
- gra/tools/ai-rebel-verify-max-live.cjs (przepisany: startNewGame z maksimum, odczyt settings, wybor zalezny od ziarna, metryka AI z 0 miast liczona po wszystkich wlascicielach z miastem w t1, --target player)
- gra/tools/ai-rebel-verify-news-live.cjs (NOWY: round-trip zapisu/wczytania z lista "Wydarzenia na swiecie" z DOM, zrzut okna, bunt stolicy, faza first/resume)
- dyspozycje/analizy/AI-REBELIA-WERYFIKACJA-2026-11-27.md (przepisany wg wynikow rundy 3)
- dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/30-obrona-claude.md (ten raport)
- dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/10-operator-claude.md (PRZYWROCONY z raportu rundy 1, commit 35f9e68; raport rundy 2 z 025046346 zostaje w historii gita)
- dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/dane/*-r3* (surowe wyjscia biegow tej rundy: .txt, .json, .png)
Commit: patrz pole sha w odpowiedzi (SHA czubka po commicie).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJE. Metryka "AI z 0 miast" byla slepa (wiersze tylko dla miast). Poprawka: aiZ0Miast liczy wszystkich wlascicieli AI, ktorzy w t1 mieli miasto (brak wiersza = 0 miast; w t1 jest ich 29). Verdykt ochrony opiera sie teraz na rebelState i ownerId celu oraz na tej metryce. Mutacja z zarzutu (aiKeepsLastCity=false) NIE zostala powtorzona w tej rundzie: NIE ZWERYFIKOWANO mutacja nowej metryki; dowod mutacji pozostaje z raportu Evaluatora.
2. PRZYJMUJE. Zarzut trafny: __settingsLive.startNewGame(NewGameParams) przyjmuje advanced.kosztJednostekPace i advanced.diplomacyWarLevel (gra/tools/diplomacy-harder-measure-run.cjs, startNewGame z DIPLO_LEVEL). Runner startuje teraz przez __settingsLive.startNewGame z maksimum. Odczyt getSettings po starcie (seed 4242 i 7, wszystkie biegi): difficulty "hard", kulturaReligiaLevel "trudny", kosztJednostekPace "wysoki", diplomacyWarLevel "trudna". Poprzednie dane (dane/max-last-city-s4242-t6.txt, s7-t6.txt) mialy kosztJednostekPace "niski" i sa NIEAKTUALNE; zastapione przez *-r3*.
   Maksimum poziomow: Trudna = najwyzszy wariant w obu wyborach (Dyplomacja i wojna: latwa/normalna/trudna; Kultura i religia: latwy/normalny/trudny); Koszty jednostek: niski/normalny/wysoki (x4 = wysoki). Zob. typy DiplomacyWarLevelOption i KulturaReligiaOption (gra/src/ui/newGameFlow.ts l.229-232).
   Hak __settingsLive nie wymagal zmian w gra/src; DECISION_REQUIRED z poprzedniej rundy NIE jest potrzebny (dla kosztow i dyplomacji).
3. PRZYJMUJE. Kontrola na maksimum wykonana: --target player, ten sam hak (forceRevoltEligible) na jedynym miescie gracza (city0), seed 4242: t1 ownerId 0, rebelState false; od t2 ownerId -99, rebelState true, utrzymane do t7. Verdykt: KONTROLA-ZBUNTOWANA. Dane: dane/max-control-player-s4242-r3.txt.
4. PRZYJMUJE, WYKONANE. Round-trip zapisu z lista "Wydarzenia na swiecie":
   - faza first (seed 4242, maksimum, cel = pierwsze miasto AI z 2 miastami, bunt wymuszony): tury 2-7 rebelState true, miasto Harappa w buncie od t2; lista z DOM (klik przycisku .tb[data-act="diplo"], klasa .dl-world-news) przed zapisem = 1 wpis: "Bunt miasta: Harappa | Miasto Harappa zbuntowalo sie i oglosilo niepodleglosc · tura 2" (rebelia 1). Zapis: __truceTestDebug.saveForTest("airebel-news-s4242") = true.
   - faza resume (NOWY proces Chromium, ten sam profil trwaly; wczytanie: __truceTestDebug.loadForTest): tura po wczytaniu 7 (= zapisana), lista po wczytaniu = ta sama 1 pozycja; roundTrip = TRUE (porownanie JSON list wpisow). Dalej 6 tur (do t13), bunt trwa.
   - Naprawione po drodze: Playwright launch() tworzy pusty profil przy kazdym uruchomieniu, wiec zapis z poprzedniego procesu nie byl widoczny; runner uzywa launchPersistentContext z profilem w scratchpadzie. Chromium: w fazie resume jedno zamkniecie strony przy wczytaniu (blad "Target page closed"), ponowienie 1/3 przeszlo. Logi: dane/news-s4242-r3-first.txt, dane/news-s4242-r3-resume.txt.
   - Hotseat NIE sprawdzany.
5. PRZYJMUJE, WYKONANE (w zakresie 13 tur, seed 4242, 1 bunt wymuszony): liczba wpisow "Bunt miasta" (klasa .dl-wn-rebelia) na liscie widocznej graczowi = 1 (kontakt z wlascicielem ustawiony hakiem __dyploMapaOdkrycieTestDebug.prepareContact; bez kontaktu wpis nie powstaje, zob. recordAiCityRebellionNews). Szum: dwa przebiegi tego samego ziarna (seed 4242, maksimum, ten sam scenariusz miasto-AI, 6 tur) daly IDENTYCZNE wiersze tur 2-7 (ownerId, rebelState, celMiasta, aiZ0Miast): porownanie w dane/max-ai-s4242-r3.txt vs dane/max-ai-s4242-r3-b.txt. Szum w symulacji = 0 w tym zakresie; NIE zmierzono szumu dla seed 7 ani dla 60 tur.
   NIE ZMIERZONO: bieg naturalny 60 tur (bez wymuszenia) z kontaktem ze wszystkimi cywilizacjami. Proba 1 (kontakt z 29 AI): tura 2 nieSettled (endTurn nie zakonczyl sie w 240 s; ekrany powitalne kolejnych cywilizacji). Proba 2 (z diagnostyka i petla zamykania ekranow): przerwana limitem 585 s bez wyniku; log dane/natural-s4242-r3-ostatnia-proba.txt. Liczba wpisow i widocznych cywilizacji w 60 turach NIE ZMIERZONO z tego powodu.
6. PRZYJMUJE. Szum: patrz pkt 5 (dwa przebiegi max-ai s4242 identyczne). Druga para (seed 7) nie wykonana.
7. PRZYJMUJE. Dokument dyspozycje/analizy/AI-REBELIA-WERYFIKACJA-2026-11-27.md przepisany wg wynikow rundy 3 (poz. 1 na maksimum, poz. 2-5 z liczbami albo z konkretnym NIE ZMIERZONO).
8. PRZYJMUJE. Raport rundy 1 zostal nadpisany raportem rundy 2 (diff 61 linii). Przywrocony z commita 35f9e68 (10-operator-claude.md). Raport rundy 2 zostaje w historii (commit 025046346). Ten plik to raport rundy 2/5 po zarzutach.
   Bramki z dispatchu w tej rundzie (wyniki z surowego wyjscia):
   - tsc --noEmit (gra/): exit 0 (dane: dane/ nie dotyczy; log poza repo, scratchpad/runs/tsc.txt).
   - ai-city-rebellion-gate-test.cjs: WYNIK PASS=37 FAIL=0.
   - ai-city-rebellion-news-test.cjs: WYNIK PASS 24/0.
   - ai-test (297/0) i logic-test (213/213): NIE RE-RUN w tej rundzie (gra/src bez zmian od kandydata; ostatnie wyniki w raporcie Evaluatora z 025046346). Zostaje to nieodnowione.
9. PRZYJMUJE. Bez poprawki seed 7 wybieral tego samego wlasciciela 40 co seed 4242. Poprawka: wybor AI z 1 miastem = kandydaci[seed mod liczba] (kandydaci zalezne od ziarna). Wynik: seed 4242 -> owner 8 (city11); seed 7 -> owner 21 (city24). Oba OCHRONA-DZIALA. Liczby kandydatow: 16 (s4242), 16 (s7).

WYNIKI (maksimum, po poprawkach):
- Poz. 1 (ochrona ostatniego miasta AI, bunt wymuszony): OCHRONA-DZIALA. s4242: owner 8, city11, tury 2-7, rebelState false, celMiasta 1, aiZ0Miast 0 (z 29 wlascicieli AI). s7: owner 21, city24, tury 2-7, rebelState false, aiZ0Miast 0. Dane: dane/max-ai-s4242-r3.txt, dane/max-ai-s7-r3.txt.
- Poz. 2 (stolica AI w buncie, >=2 miasta): bunt wymuszony na stolicy wlasciciela 13 (dwa miasta, s4242): stolicaPrzed city16; po buncie capitalOf(13) = city17 (najstarsze pozostale miasto, fallback zgodny z komentarzem capitalCityIdForOwner, gra/src/main.ts l.2478); wlasciciel 13 zostaje z 1 miastem (nie traci wszystkich). Odczyt przez istniejacy hak __cityCessionTestDebug.capitalOf (ten hak ISTNIEJE; zarzut 5 slusznie wskazal, ze wskazowka FC byla do sprawdzenia). Dane: dane/stolica-s4242-r3.txt/.json.
  NIE ZMIERZONO: flaga/efekty stolicy w ekonomii, Mennica i warunki zwyciestwa przy buncie stolicy (brak haka odczytu Mennicy i stanu zwyciestwa; nie sprawdzane w tej rundzie). DECISION_REQUIRED nie jest potrzebny dla odczytu stolicy.
- Poz. 3 (round-trip): ZMIERZONO, lista identyczna przed/po wczytaniu (1 wpis). Dane: dane/news-s4242-r3*.txt/.json.
- Poz. 4 (zrzut okna dyplomacji z wpisem "rebelia"): ZMIERZONO. Plik dane/news-s4242-r3-first.png (Chromium, viewport 1600x1000, deviceScaleFactor 1, okno "Dyplomacja" otwarte przyciskiem paska; w sekcji "WYDARZENIA NA SWIECIE" widoczny wpis "Bunt miasta: Harappa"). Uwaga: wpis lezy przy dolnej krawedzi okna i jest czesciowo przyciety przez wysokosc viewportu (bez przewijania).
- Poz. 5 (bieg zywy): CZESCIOWO. 13 tur, seed 4242, 1 bunt (wymuszony): 1 wpis "rebelia" widoczny graczowi. NIE ZMIERZONO: 60 tur naturalnie, seed 7 z wpisami, liczba widocznych cywilizacji (patrz pkt 5).

BLOKADY:
1. Poz. 5 naturalne 60 tur z kontaktem ze wszystkimi cywilizacjami: endTurn nie konczy tury (ekrany powitalne) i limit 585 s bez wyniku (dowody w dane/natural-s4242-r3-ostatnia-proba.txt; log proby 1 nadpisany).
2. Poz. 2 efekty stolicy/Mennica/zwyciestwo przy buncie stolicy: NIE ZMIERZONO (brak haka Mennicy/zwyciestwa; poza zakresem tej rundy).
3. Poz. 5 seed 7 dla wpisow: NIE ZMIERZONO (czas).
4. Hotseat dla pozycji 3: NIE ZMIERZONO.

RUNDY: 2/5 (obrona). Ostatni werdykt FC r1: FAIL.

UWAGI-DLA-ORKIESTRATORA:
- DECISION_REQUIRED: brak nowych. Hak __settingsLive pozwala na maksimum bez zmian w gra/src (zarzut 2); hak capitalOf istnieje (zarzut 5).
- Dane z rundy 2 (dane/max-last-city-s4242-t6.txt, s7-t6.txt, seed4242-maks.txt, seed7-maks.txt) pochodza z innych biegow: pierwsze dwa maja kosztJednostekPace "niski" (NIEAKTUALNE dla maksimum). Dwa ostatnie (60 tur, summary "unitCostPace": "wysoki") nie byly ponownie zmierzone w tej rundzie i nie licza wpisow rebelii.
- Zrodlo prawdy dla poz. 1 w tej rundzie to pole rebelState/ownerId celu; metryka aiZ0Miast jest pomocnicza.
- Wlasny NIE ZMIERZONE: hotseat, Mennica, zwyciestwo.
- Zainstalowany lacznik gra/node_modules (symlink do innego worktree, tylko odczyt) do uruchomien vite/playwright; usunac przed sprzataniem worktree. Bundle w scratchpadzie (poza repo).
- Nie tworzono spawn_task/create_session/create_trigger/send_later; nie uzywano run_in_background; nie pushowano.

NASTEPNY KROK: orkiestrator decyduje, czy powtorzyc bieg naturalny 60 tur po ustaleniu obslugi ekranow powitalnych dla wielu cywilizacji (osobny temat); pozycje 2 (Mennica/zwyciestwo) wymagaja haka odczytu - decyzja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
