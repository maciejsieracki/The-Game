STATUS: DECISION_REQUIRED (test poprawiony i przemierzony na main 6ade0f0ec; defekty gry R5 i B4b oraz brak serializacji bitwy nadal wymagaja decyzji orkiestratora/wlasciciela)
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-AUTO-BREACH-REPLAY-E2E-Q1
GOAL: dowody w zywej grze dla 5 sciezek oblezenia (parytet AUTO/SKIP, wylom, replay/zapis, bitwa reczna, _skipInstantFallback)
ZMIANY/COMMIT: gra/tools/siege-auto-breach-replay-e2e-live-test.cjs (3 male zmiany, nizej), evidence/obrona-*, ten raport. Merge origin/main (6ade0f0ec) do galezi obrony, bez konfliktow. Zero zmian w gra/src. SHA koncowy w polu sha wyniku workflow.
BAZA: 01483c316 + merge origin/main 6ade0f0ec (zarzut 9: test na aktualnym main jest teraz ZMIERZONY).

Zasada tego raportu: kazda liczba pochodzi z uruchomienia w tej sesji; surowe logi w evidence/obrona-*.txt i *.jsonl. Czego nie uruchomilem, oznaczam NIE_ZMIERZONO.

== ODPOWIEDZI NA ZARZUTY ==
1 (B4 oslabione) -- ODRZUCAM zarzut oslabienia, PRZYJMUJE zarzut istotnosci. Oryginalne wymaganie szkicu (atakujacy ZA murem) nie zostalo usuniete: jest asercja B4b i zwraca exit 3 (DEFEKT). B4 sprawdza tylko poprawna czesc (zywy atakujacy stoi NA zburzonym kaflu). Przemierzone na main: AUTO inside=0, wallCol=40, maxAtkQ=40 (obrona-p1x1-b.txt); tryb reczny: M3 PASS, czyli atakujacy za murem (obrona-frm.txt). Rozjazd AUTO vs reczny to kandydat na DEFEKT AUTO; zgodnie z dispatchem NIE naprawiam, wymaga tematu/decyzji. Poprawka w tescie: naglowek punktu B opisywal B4 jako "wchodza za mur" -- teraz zgodnie z asercjami (B4 vs B4b).
2 (test nie jest zielony) -- ODRZUCAM. Zamierzone: dispatch kaze przy defekcie gry STOP z reprodukcja, bez naprawy i bez wyciszania. exit 3 to odrebny kod "tylko znaleziska defektow". Potwierdzam jawnie: test nie nadaje sie do automatycznej bramy, dopoki nie powstanie temat naprawczy R5 i decyzja B4b.
3 (zapis/wczytanie bitwy) -- PRZYJMUJE jako fakt; w tescie nic nie da sie poprawic. grep -ciE 'battle|wallEverBreached|wallTileHp' gra/src/game/save.ts = 0 (zmierzone ponownie). Czesc (3) dispatchu NIE jest wykonana. Decyzja: akceptacja "bitwa nie jest serializowana, kryterium nie dotyczy" albo osobny temat zmiany kodu gry.
4 (slaby parytet 1x) -- PRZYJMUJE. P1 1x (24 tury, zero strat) dowodzi zgodnosci wylomu i HP kafli, nie strat; mutacja ff-tick jest tam niewykryta (evidence/mut-ff-tick-p1x1-NIEWYKRYTA.txt). Mocny dowod to p1fast (pelny roster, straty 23/10, mutacja czerwona -- ponowiona nizej). Pelne 1x do 400 tur: NIE_ZMIERZONO. Remis z sufitu to skrot czasowy jawnie opisany w tescie, nie naturalne rozstrzygniecie.
5 (margines czasu p1fast) -- PRZYJMUJE i POPRAWIAM. Domyslny sufit p1fast zmniejszony z 240 do 180 tur (env SABR_FAST_CAP). Pomiar: AUTO 128x 82,4 s (poprzednio 103,7-109 s), SKIP 1,7 s, wynik AUTO==SKIP (atk lost 23, def lost 10, HP 2822 vs 777), P1d-P1f 3/3 PASS, exit 0 (obrona-p1fast180.txt). Mutacja ff-tick na nowym suficie: CZERWONA -- P1e FAIL (SKIP: atk lost 23, def lost 11, HP 2823 vs 767, 30 zdarzen wylomu; AUTO: def lost 10, 27 zdarzen), exit 1, AUTO 89,2 s (obrona-mut-fftick180.txt). Margines do limitu 120 s: ok. 31-37 s zamiast ok. 11-16 s.
6 (scenariusz M) -- CZESCIOWO PRZYJMUJE. Martwy licznik turnsStarted usuniety (grep turnsStarted w pliku: 0 trafien). Sufit 150 tur w M to nadal jawny skrot czasowy. space=1 oznacza, ze po pierwszym starcie gra sama prowadzi tury w trybie recznym; nie badalem tego i nie twierdze, ze test dowodzi wielokrotnej petli plan-wykonanie. Mutacje dla M i R: NIE_ZMIERZONO (nie dopisane).
7 (F: stan wymuszony; rozjazd fallback vs AUTO) -- PRZYJMUJE. F dowodzi pokrycia kodu sciezki awaryjnej na stanie wymuszonym z testu, nie zachowania gracza. Rozjazd (fallback = ATAKUJACY, przewiniecie 400 tur = OBRONCA wg raportu operatora) nie zbadany; zglaszam orkiestratorowi jako potencjalny rozjazd Skip/AUTO klasy FALI 618 do wpisu w rejestrze (rejestrow nie edytuje). F przemierzone na main: F0-F5 6/6 PASS.
8 (proweniencja) -- PRZYJMUJE jako ryzyko procesowe, nierozstrzygalne. git log --all dla pliku: jedyny commit to 01483c316; autorstwo szkicu nieustalone. Brak 00-dispatch.md w origin/main -- opieram sie na DODATKU i tresci zadania. Pelnego audytu linia po linii nie powtarzalem (NIE_ZMIERZONO); polegam na przegladzie evaluatora.
9 (evidence) -- CZESCIOWO PRZYJMUJE. (a) Test na aktualnym main 6ade0f0ec: wykonany po merge (f/r/m, p1x1, b, p1fast). (b) res-all-runs.jsonl miesza przebiegi sprzed i po edycjach: historii nie zmieniam; wiarygodne sa wylacznie evidence/obrona-*. z tej rundy. (c) Zrzuty ekranu nadal pokazuja ekran wyniku przy stubowanym rendererze, nie klatke walki: NIEPOPRAWIONE, to zaniechanie.

== TESTY (ta runda; galaz = 01483c316 + merge main 6ade0f0ec) ==
tsc --noEmit: exit 0.
logic 213/213; tech-tree 20 pass 0 fail; research 33/33; unit-replace 21/21; combat 6/6 (wszystkie exit 0).
live f,r,m: 17 ok, 0 fail, 1 defekt (R5: tileDiffPoReplayu 7), exit 3, real 2m14s.
live p1x1,b: 9 ok, 0 fail, 1 defekt (B4b: inside 0, wallCol 40, maxAtkQ 40), exit 3; p1x1 AUTO 53,3 s, SKIP 0,5 s, wynik identyczny.
live p1fast (sufit 180): 3 ok, exit 0, AUTO 82,4 s. Z mutacja ff-tick: exit 1, P1e FAIL.
NIE uruchamialem w tej rundzie: 21 istniejacych testow siege-/oblezenie-/battle-* ani battle-skip-equals-auto-resolve-test (na main po merge NIE_ZMIERZONO); mutacji breach-off i fallback-breach na main (czerwone wg evaluatora na kandydacie).
BLOKADY: (1) DEFEKT R5: replay nie przywraca terenu muru -- osobny temat naprawczy. (2) B4b: w AUTO atakujacy nie wchodza za mur, w trybie recznym wchodza -- decyzja/temat. (3) Brak serializacji bitwy -- kryterium (3) niewykonalne bez zmiany gry. (4) Potencjalny rozjazd _skipInstantFallback vs AUTO -- do rejestru.
RUNDY: obrona po rundzie 1/5
NASTEPNY KROK: Final Control/orkiestrator -- decyzja, czy exit 3 (znane defekty) jest przyjmowany jako wynik tematu; zalozenie tematow R5 i B4b; decyzja co do kryterium (3).
DEPLOY/PUSH: NIE WYKONANO
