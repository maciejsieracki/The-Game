STATUS: DECISION_REQUIRED (testy dowodowe gotowe i zmierzone; 1 DEFEKT gry znaleziony w replayu, NIE naprawiany w tym temacie)
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-AUTO-BREACH-REPLAY-E2E-Q1
GOAL: dowody w zywej grze (Chromium przez HTTP, prawdziwa BattleScene, ?playtest=oblezenie-duze, deterministyczne ziarno) dla 5 sciezek oblezenia, ktore mialy NIE_ZMIERZONO.
ZMIANY/COMMIT: jeden nowy plik testowy gra/tools/siege-auto-breach-replay-e2e-live-test.cjs, ten raport i evidence/. Zero zmian w kodzie gry (gra/src), zero zmian w civ-test-hooks.ts. SHA w polu sha wyniku workflow.
BAZA: origin/main = c90eb3e18 (dodatek orkiestratora wspomina 4ee2aba61; faktyczny czubek origin/main w chwili startu to c90eb3e18).

== UCZCIWA UWAGA O POCHODZENIU PLIKU ==
Plik gra/tools/siege-auto-breach-replay-e2e-live-test.cjs (404 linie, mtime 19:53) ISTNIAL juz w worktree jako nieśledzony, zanim zaczalem prace w tej sesji; nie napisalem go ja. Nie wiem, kto go stworzyl (najpewniej wczesniejsza, przerwana proba tego samego tematu). Potraktowalem go jako niezweryfikowany szkic: przeczytalem w calosci, uruchomilem kazdy scenariusz, poprawilem (lista nizej) i zmierzylem. Nic z wynikow ponizej nie pochodzi z tamtego szkicu bez ponownego uruchomienia.
Brak pliku 00-dispatch.md w origin/main (git show zwrocil blad); korzystalem tylko z DODATKU z galezi claude/sprawdzenie-funkcjonalnosci-ek4ra0.

== CO JA ZMIENILEM W SZKICU ==
1. P1 128x: pelny roster nie konczyl 400 tur w 120 s (zmierzone: tura 275 po 120,3 s, NIE_ZMIERZONO). Dodalem sufit 240 tur (instancyjne nadpisanie _roundCapVerdict, ta sama funkcja steruje AUTO i przewijaniem) -> AUTO 109 s. Jawne skrocenie scenariusza; asercje nie oslabione.
2. Kod wyjscia: NIE_ZMIERZONO zwracalo 0. Dodalem licznik i exit 4.
3. B4: szkic twierdzil "szturm = atakujacy stoi ZA murem (q > kolumny muru)" i to nie przechodzilo (patrz nizej). Zamiast usunac asercje, rozdzielilem: B4 = zywy atakujacy stoi NA zburzonym kaflu/otwartej bramie (przechodzi), B4b = obserwacja "nikt nie wchodzi za mur" zapisana jako DEFEKT/obserwacja (nie wymaganie z dispatchu).
4. M (bitwa reczna): szkic nie dowodzil, ze tryb byl reczny (wydawal rozkazy raz i pompowal klatki). Dodalem asercje M0 i instrumentacje: tryb reczny wlaczony od startu, nigdy nie przelaczony na AUTO, start tury przez prawdziwe zdarzenie klawiatury SPACJA (_onKeyExecuteTurn), rozkazy gracza przez playerOrder.
Rozmiar tego, co jest moje vs szkic: nie rozdzielalem linia po linii; patrz git diff nie jest mozliwy (plik nowy). Wszystkie liczby ponizej pochodza z uruchomien w tej sesji.

== WYNIKI (surowe, z uruchomien w tej sesji; logi w evidence/) ==
Build: vite build --outDir poza repo, 25 s. Chromium /usr/bin/chromium i /opt/pw-browsers (test wybiera pierwszy istniejacy).

(5) _skipInstantFallback [scenariusz f]: F0-F5 6/6 PASS (16,5 s). skip() przed startem -> 1 wywolanie fallbacku, bez przewijania, wynik "ATAKUJACY wygrywa", 6 ocalalych, wylom zalozony z machiny (breached=true).
  ZASTRZEZENIE: stan jest WYMUSZONY (started=false, deployPhase=false ustawione z testu), bo _startBattle zawsze ustawia started=true; w grze sciezka jest praktycznie nieosiagalna (siatka bezpieczenstwa).
  OBSERWACJA: ten sam scenariusz przewijany do 400 tur daje zwyciezce OBRONCE, a fallback daje ATAKUJACEGO. Gdyby fallback byl kiedykolwiek osiagalny, to rozjazd wyniku Skip vs AUTO (tego typu, co naprawiano w FALI 618). Nie badalem dalej.

(1) Parytet AUTO == SKIP:
  - 1x (speedIdx 0), SKROCONY roster (6 piechurow + cala obleznicza vs 6 obroncow, kafle muru HP 6, sufit 24 tur, przez realna sciezke _replayBattle): AUTO 54,6 s wall, SKIP 0,6 s; wynik identyczny (remis, tura 24, atk 0 strat/17/3413 HP, def 0/6/231, 7 zdarzen wylomu, wszystkie jednostki). P1a-P1c 3/3 PASS.
    SLABOSC: w tym skroconym scenariuszu nie ma zadnych strat po zadnej stronie, wiec dowodzi on glownie zgodnosci wylomu/HP kafli; NIE wykrywa mutacji petli ticka (patrz MUT nizej).
  - 128x (speedIdx 7), PELNY roster 39 vs 28, sufit 240 tur: AUTO 109,1 s, SKIP 1,9 s; identyczne: remis, tura 240, atk 24 straty/15 zywych/2756 HP, def 10/18/777, 37 zdarzen wylomu, pelna lista jednostek. P1d-P1f 3/3 PASS. Bez sufitu 240: AUTO nie zmiescil sie w 120 s (NIE_ZMIERZONO dla pelnych 400 tur; osobno zmierzone 8x idx3: 308 s, wynik 26/11 strat, HP 2667/760 vs SKIP 1x 2668/749 - bez parytetu, ale tam SKIP byl na innej predkosci).
  - AUTO 1x PELNY roster 400 tur: NIE_ZMIERZONO (rzad 24 min wall wg wczesniejszych raportow; nie mierzylem, bo przekracza limit 120 s i zakaz tla).

(2) Wylom [scenariusz b, AUTO idx5, MINI, sufit 150]: B0-B5 PASS (poza B4b). Kafle muru ubyly 154->36, zdarzenia wylomu przed koncem bitwy (pierwsze: tura 22), wallEverBreached=true, 1 zywy atakujacy stoi na zburzonym kaflu.
  W pelnym rosterze 128x brama padla w turze 46, pierwszy kafel muru w turze 62-64.
  B4b (OBSERWACJA/DEFEKT-kandydat): w KAZDYM zmierzonym przebiegu AUTO (MINI 150 tur, pelny 240 tur, SKIP 400 tur) maksymalna kolumna zywego atakujacego <= kolumna muru (39-40 przy murze w kol. 40): atakujacy nigdy nie wchodza ZA mur nawet przy otwartej bramie i dziesiatkach zburzonych kafli. Nie wiem, czy to zamierzone (np. kamera/limit doktryny) czy blad; wymaga decyzji wlasciciela.

(3) Replay/zapis wyłomu:
  - Replay ("Rozegraj ponownie", klikniety prawdziwy przycisk z ekranu wyniku): R0-R4, R6 PASS: stan logiczny wraca (wallEverBreached=false, brama zamknieta, HP bramy 400, wiezy 0, 154 kafle w mapie HP, roster 17 vs 6, faza rozstawiania, tura 0).
  - DEFEKT R5 (zmierzony 2x, powtarzalny): po replayu TEREN nie wraca: 7 kafli muru zburzonych w bitwie zostaje Plains (tileDiff 7 przed i po replayu), mimo ze wallTileHp jest pelne, a wallEverBreached=false. Przyczyna z lektury kodu (nie poprawiana): _resetSiegeForReplay (battleScene.ts ok. 10525) resetuje tylko liczniki/mape HP, nie przywraca terrainMap.tiles (Wall/Gate) ani widocznosci mesh-y muru/bramy. Skutek: w powtorzonej bitwie mur ma dziury od startu, a regula "bez wylomu miasto nie padnie" jest obchodzona. To DEFEKT KODU GRY -> zgodnie z dispatchem STOP, osobny temat, nie naprawialem. Test zwraca exit 3 przez to znalezisko.
  - "Zapis i wczytanie w trakcie oblezenia z wylomem": NIE DOTYCZY / NIE_ZMIERZONO. grep: stan wylomu (wallEverBreached, wallTileHp) wystepuje wylacznie w gra/src/battle/battleScene.ts, a save.ts nie ma zadnego odwolania do stanu bitwy (0 trafien). Bitwa taktyczna nie jest serializowana, wiec nie ma czego zapisac/wczytac w trakcie. Tego scenariusza z dispatchu nie da sie wykonac bez zmiany kodu gry.

(4) Bitwa reczna oblezenicza BEZ Skip [scenariusz m]: M0-M4 5/5 PASS (30-33 s). Instrumentacja: tryb reczny od startu (modeAtStart=true, manualFalseSeen=false), strona gracza = atk, 1 start tury SPACJA, 17 rozkazow playerOrder. Bitwa skonczyla sie (tura 150, remis, wylom, 2-3 atakujacych za murem).
  ZASTRZEZENIA: (a) koniec wyznaczyl sufit 150 tur nadpisany z testu (jak w innych scenariuszach MINI), nie naturalne rozstrzygniecie; (b) zmierzone space=1 - po pierwszym starcie tury gra sama kontynuowala tury w trybie recznym (nie czekala na kolejne SPACJE w moim petli); nie badalem czy to zamierzone; (c) roster skrocony jak w MINI.

== MUTACJE (kazda budowana ze zmodyfikowanego zrodla sceny; logi w evidence/) ==
  - breach-off (usuniecie wallEverBreached=true w _breachWallTile/_breachGate): scenariusz b CZERWONY (exit 1, B2 FAIL).
  - fallback-breach (usuniecie zalozonego wylomu w _skipInstantFallback): scenariusz f CZERWONY (exit 1, F3 FAIL).
  - ff-tick (podwojony krok ticka w _runFastForward = "podmiana petli ticków"): na P1 1x MINI ZIELONY (mutacja NIEWYKRYTA, log mut-ff-tick-p1x1-NIEWYKRYTA.txt); na P1 128x pelny roster CZERWONY (P1e FAIL: atk 24 vs 23 strat, def 10 vs 11, HP 2756 vs 2786). Czyli wykrywa ja tylko scenariusz pelnego rosteru.

== BRAMKI ==
  tsc --noEmit: exit 0, 0 linii bledow (17 s).
  logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6 (wartosci w docs R-PROC-AUTOBOT §6 dla tech-tree 19 i unit-replace 13 sa nieaktualne wzgledem zmierzonych 20 i 21; nie ruszalem).
  Istniejace testy (node, exit 0): battle-defeat-survivor-retreat-two-hex 44/0, battle-skip-siege-parity 17/0, battle-undeployed-units 37/0, map-field-battle 24/0, oblezenie-remis-endsiege 271/0, oblezenie-siege-lifted-po-bitwie 16/0, oblezenie-test 27/0, post-battle-map 32/0, siege-ai 17/0, siege-badge-zorder 13/0, siege-blockade-no-recruit-reinforce 57/0, siege-defenders 12/0, siege-engines-built-during-siege 28/0, siege-last-stand-sortie 71/0, siege-manual-battle-behavior 40/0, siege-nearby-lock-join 23/0, siege-starvation-duration 27/0, siege-starvation 54/0, siege-surrender-enter-city 32/0, siege-surrender-forecast 57/0, siege-tower-breach-everywhere 47/0.
  battle-skip-equals-auto-resolve-test (zywy): pierwszy bieg przerwany moim timeoutem 120 s (nie wynik); drugi bieg z timeoutem 560 s: 38 ok, 0 fail, exit 0 (3 min 44 s).
  Nie uruchamialem: pozostalych testow *live*/*browser* z listy siege-* (battle-skip-siege-parity-live-test uruchamialem tylko jako pomiar: SKIP seed 1 i AUTO 8x seed 1, patrz wyzej).
  Uwaga: kazdy scenariusz testu uruchamialem OSOBNO (limit narzedzia i 120 s na przebieg); jedno pelne wywolanie wszystkich scenariuszy naraz nie bylo wykonane. Scenariusze f/r/m uruchomione razem na koncowym kodzie (17 ok, 0 fail, 1 defekt); p1x1, p1fast, b na kodzie sprzed ostatnich edycji B4/manual (p1x1 i p1fast nie byly od tego czasu zmieniane poza polem wyjscia brief; b po edycji B4 uruchomiony osobno: 6 ok, 1 defekt).

== EVIDENCE (dyspozycje/autobot/runs/R-WEB-SIEGE-AUTO-BREACH-REPLAY-E2E-Q1/evidence/) ==
  p1x1-auto.jpg, p1fast-auto.jpg, b-auto.jpg, m-manual.jpg: prawdziwe zrzuty ekranu wyniku bitwy (b-auto.jpg obejrzany: ekran "Remis", Tura 150, przycisk "Rozegraj ponownie"). Silnik renderu jest stubowany w trakcie symulacji (bs.renderer.render), wiec zrzuty pokazuja ekran konca, nie klatke walki.
  mut-*.txt, final-f-r-m.txt, res-all-runs.jsonl (surowe wyniki wszystkich przebiegow, w tym wczesne przed edycjami).

BLOKADY: (1) DEFEKT R5 replay nie przywraca terenu muru/bramy -> osobny temat naprawczy (np. R-WEB-SIEGE-REPLAY-RESTORE-WALL-TERRAIN-Q1). (2) B4b: atakujacy nie wchodza za mur - do decyzji wlasciciela. (3) Zapis/wczytanie bitwy z wylomem: brak mechanizmu w grze. (4) NIE_ZMIERZONO: AUTO 1x pelny roster do 400 tur; dowod mutacji ff-tick tylko na scenariuszu 128x.
ZALOZENIA (luki rozstrzygniete bez pytania): uzylem sceny ?playtest=oblezenie-duze zamiast sceny z hakiem ?civTest=1 (hak civTest nie obejmuje BattleScene); sufity tur nadpisane z testu to wylacznie skrocenia czasu, opisane jawnie w kazdym scenariuszu.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) - zweryfikowac, ze asercje nie sa tautologiczne (zwlaszcza M0 i sameOutcome), ponowic przebiegi niezaleznie; orkiestrator - zalozyc osobny temat naprawczy dla R5 i pytanie ABC dla B4b.
DEPLOY/PUSH: NIE WYKONANO
