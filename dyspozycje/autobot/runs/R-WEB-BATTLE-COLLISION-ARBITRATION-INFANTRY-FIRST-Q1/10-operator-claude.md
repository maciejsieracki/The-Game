# R-WEB-BATTLE-COLLISION-ARBITRATION-INFANTRY-FIRST-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-COLLISION-ARBITRATION-INFANTRY-FIRST-Q1
GOAL: przy kolizji o to samo wolne pole w ruchu bitewnym (AUTO/SKIP; gracz i AI) piechota ma pierwszenstwo, lucznik/procarz ustepuje; ten sam typ => mniejsze ID; bez zamiany miejscami i ping-ponga; konnica/rydwany/machiny bez zmian.

## BAZA (uwaga procesowa)
Zlecenie podaje BAZA=4504924647148438ce9dcef4ad59b99dc5334415 jako "origin/main". To NIEPRAWDA: 4504924 to czubek galezi dispatchow (`claude/sprawdzenie-funkcjonalnosci-ek4ra0`) ze starszym kodem gry (`git diff --stat 7ac79dafb 4504924` w `gra/src`: 65 plikow, -4146 linii). Zgodnie z DODATKIEM 1 ("baza kodu = aktualny origin/main po FALI 747") praca idzie na `7ac79dafb` (= origin/main, FALA 747, zawiera regule pelnego ruchu i poprawke strzelcow RESIDUAL-INFANTRY-Q2). Worktree byl juz na 7ac79dafb z niezacommitowana praca poprzedniej (przerwanej) sesji tego tematu; przejeta, zweryfikowana i poprawiona. ZALOZENIE: integrowac na origin/main.

## ZMIANY/COMMIT (allowlista: battle/*, tools/battle-*, runs/<ID>/**)
- `gra/src/battle/autoBatchPhase.ts` — jedyne miejsce rozstrzygania kolizji o pole (`resolveAutoBatchPhase`, wspolne dla AUTO i SKIP). Dodano `compareUnitIds` (naturalne porownanie ID: atk-2 < atk-10), `arbPrecedes` (piechota > dystansowy, w klasie mniejsze ID; klasa `other` poza arbitrazem), pole snapshotu `arbClass`. Mechanizm: kolejnosc przetwarzania BEZ ZMIAN (rosterowa), a po przebiegu: gdy jednostka B zostala zablokowana polem zajetym SCIEZKA jednostki A (nie polem startowym — to twarda bariera jak dotad), a B ma pierwszenstwo przed A, A dostaje limit (cap) = indeks tego pola w jej sciezce i faza liczona jest od nowa; capy tylko maleja => petla konczy sie (limit `2*units+1` iteracji). Ustepujacy zatrzymuje sie pole wczesniej (zachowuje czesc ruchu przed polem spornym). Wynik w kolejnosci rosteru. Przelacznik `ARB_ENABLED` (mutacja BASE).
- `gra/src/battle/battleScene.ts` — `_arbitrationClassOf(ru)` (konnica/rydwany `mounted` i machiny => `other`; `ru.primaryRanged` => `ranged`; reszta => `infantry`), wypelnienie `arbClass` w snapshotach `_beginAutoBatchPhase`. Nie ruszono planera, `_meleeContactLatched`, rezerwacji sciezek ani `cavTrail`.
- `gra/tools/battle-pursuit-pace-browser-entry.ts` — sonda: osobny, ziarnowany strumien losowy walki (`scene._combatRng`; globalne Math.random zuzywane tez przez dzwiek dawalo ten sam seed => dwa rozne przebiegi), log pozycji na start fazy (swap/ping-pong), zdarzenia kontestu (`api.contest`) z klasa zwyciezcy/przegranego.
- `gra/tools/battle-collision-arbitration-test.cjs` — NOWY test (czesc P: czysty arbitraz fali; czesc L: realna bitwa 3D w Chromium, tryb SKIP, 3 ziarna; determinizm x3; mutacja mutRev).
- ten raport.

Regula konnicy/rydwanow/machin (opis obecnej reguly, niezmieniona): bez arbitrazu priorytetowego — o pole wygrywa jednostka wczesniejsza w rosterze; ich scieta kolizja plan jest przeplanowywany w `_beginAutoBatchPhase` (PATH_RESERVE) z polami cudzych sciezek jako zajetymi. Konnica nie ustepuje piechocie ani nie wygrywa z nia z tytulu klasy (`arbPrecedes` zwraca false dla pary z `other`).

## TESTY (liczby z surowego wyjscia, ZMIERZONO)
- `tsc --noEmit` w `gra/`: 0 bledow (exit 0), po ostatniej zmianie kodu.
- `git diff --check`: czysty. Dysk: 7,7 GB wolne po sprzataniu.
- `battle-collision-arbitration-test.cjs` (pelny, po ostatniej zmianie): **30 ok, 0 FAIL**.
  - (a)/(b) czesc P (czysty arbitraz): A lucznik(roster 1.) vs piechota => wchodzi piechota; B piechota(roster 1.) vs lucznik => piechota; C ten sam typ piechota atk-2 < atk-10 => atk-2; D lucznik atk-3 < atk-7 => atk-3; E konnica(roster 1.) vs piechota => regula konnicy bez zmian (konnica wchodzi); F zamiana miejscami A<->B odrzucona (obie zablokowane); G determinizm x3; H trzech chetnych (lucznik atk-1, piechota atk-2, atk-3) => wchodzi atk-2. 14 ok/0 FAIL.
  - czesc L (realna bitwa, Chromium, tryb Pomin, atk Lucznik:8+Hastati:6 vs def Hastati:6+Lucznik:6): ziarno 1: 8 kolizji lucznik->piechota, 65 tego samego typu, naruszen priorytetu 0, swapow 0; ziarno 2: 4 / 103, 0, 0; ziarno 3: 5 / 33, 0, 0. Lacznie 17 realnych kolizji lucznik->piechota, ZERO przypadkow gdzie piechota ustapila lucznikowi, ZERO naruszen "mniejsze ID".
  - (c) brak swapow w 30 rundach: 0 na 3 ziarnach. Ping-pong A->B->A: kryterium wzgledne do bazy (ta sama bitwa z `ARB_ENABLED=false`): ziarno 1: z arbitrazem 0/3 vs baza 0/3; ziarno 2: 0/2 vs baza 4/7 (poprawa); ziarno 3: 2/10 vs baza 2/10 (identycznie, zjawisko jostle linii styku istnieje na bazie, digest identyczny z baza). Zalozenie: "brak ping-ponga" rozumiane jako "arbitraz go nie zwieksza" — pelne wyeliminowanie jostle'a linii styku na bazie jest poza zakresem tematu.
  - (d) mutacja odwrocenia priorytetu (marker `ARB_PRIORITY`): czesc P 3 naruszenia (czerwono), live: 11 przypadkow gdzie piechota ustapila lucznikowi (>0, czerwono).
  - (e) determinizm: to samo ziarno x3 => identyczny skrot zdarzen `361a1e0c1b68ec4c1b172dd286e518bb` (3/3).
- (f) regresje, wszystkie na tym samym kodzie koncowym: `battle-full-move-strike-test` exit 0; `battle-pursuit-move-behavior-test` exit 0 (T1-T5 i mutacje A-D/RANGED_BFS_FALLBACK zielone); `battle-pace-latch-test` exit 0; `battle-line-advance-uniform-test` exit 0; `battle-pace-equal-line-live-test` exit 0. Pliki `battle-winning-army-*` nie istnieja w tym drzewie (FALA 731 jest pokryta pursuit-move-behavior + pace-latch).
- Przebieg diagnostyczny w trakcie pracy (waznie dla oceny): pierwsza wersja (zmiana kolejnosci przetwarzania `arbitrationOrder`) powodowala regresje `pursuit-move-behavior` T2/T4 i `line-advance-uniform` (4 FAIL; baza i wariant bez arbitrazu: 0 FAIL). Zamieniono na model "kolejnosc rosterowa + korekta capem"; ponadto klasyfikacja dystansowych przez `isPrimaryRanged(ru.bu)` zastapiona polem `ru.primaryRanged` (fixture testu line-advance nie ma statystyk). Po tym wszystko zielone.

## (g) Chromium, zywa bitwa
Czesc L testu uruchamia prawdziwa `BattleScene` (three.js, swiftshader) w headless Chromium przez sonde, w trybie Pomin (ta sama petla ticka co AUTO, `_beginAutoBatchPhase`) — zdarzenia kontestu sa zapisane w logu testu (`seed N {...}`, `info seed N: kolizje lucznik->piechota ZMIERZONO ...`). NIE ZMIERZONO: zrzut ekranu z trybu AUTO 1x w oknie UI (sonda jest bezgraficzna, pixelRatio 0,1); NIE ZMIERZONO: reczny rozkaz gracza (arbitraz dziala w `resolveAutoBatchPhase`, wiec dotyczy fali AUTO/SKIP; reczne ruchy nie przechodza przez ten rozjemca).

## BLOKADY
Brak. Nie uruchomiono (NIE ZMIERZONO): `battle-doctrine-live-r4`, `large-mixed-doctrine-matrix` (porownanie z baza) — czas/limit rundy; do Evaluatora. Znane na bazie: doctrine-live r3 i line-advance-browser padaja (sidecary zwracaja HTML) — nie ruszane.

## RUNDY
1/5

## UWAGI-DLA-ORKIESTRATORA
1. Naglowek zlecenia (BAZA=4504924) wskazuje galaz dispatchow, nie origin/main; integracja musi isc na 7ac79dafb/aktualny origin/main (`git merge-base --is-ancestor`).
2. Dlug Rust: REPIN logiki bitewnej (`resolveAutoBatchPhase` z arbitrazem; `arbClass` w snapshocie).
3. Regula dziala tylko w fali AUTO/SKIP; ewentualny arbitraz recznego rozkazu gracza (kolizja z wlasna piechota) to osobna decyzja.
4. Docs (encyklopedia/poradnik) nie zmieniane — brak wpisu opisujacego kolejnosc pierwszenstwa; do ewentualnej rundy dokumentacyjnej.

## NASTĘPNY KROK
Evaluator (Sonnet): powtorzyc `battle-collision-arbitration-test.cjs` i 5 testow regresji, porownac doctrine-live r4 / large-mixed-doctrine-matrix z baza, ocenic zalozenie o ping-pongu.

DEPLOY/PUSH: NIE WYKONANO
