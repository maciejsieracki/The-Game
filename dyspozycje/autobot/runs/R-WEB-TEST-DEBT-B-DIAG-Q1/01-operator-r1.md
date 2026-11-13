STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-TEST-DEBT-B-DIAG-Q1
GOAL: Domknac 3 czerwone testy klasy B (diplomacy-proposal, mgla-sciezka-inwariant, diplomacy-audience-close-flush): diagnoza z dowodem + naprawa
ZMIANY/COMMIT: tylko gra/tools (3 testy) + ten raport; kod gry (main.ts, diplomacy*.ts) BEZ ZMIAN. SHA: `git log -1 -- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-B-DIAG-Q1/01-operator-r1.md`
TESTY: diplomacy-proposal 190/190 (bylo 186/188); mgla-sciezka-inwariant 42/42 (bylo 40/2); diplomacy-audience-close-flush 57/0 (bylo 49/2). Sasiedzi: dyplo-pokoj-kierunek-runda1 18/0, mgla-odkrycie-wzdluz-sciezki 17/0, mgla-sciezka-rzeka 14/0, mgla-teleport-koniec-tury 16/0, diplomacy-audience-actions 20/0. logic-test 213/213; ai-test 289/0; tsc 0 bledow.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO

## Diagnoza: wszystkie 3 = KLASA A (test nieaktualny wobec decyzji/zmian); klasa B (blad w grze) = 0; klasa C = 0

### 1. diplomacy-proposal-test (2 FAIL, sekcja 19e)
- Przyczyna: diplomacy-proposals.ts ~1448 `if (authorIsPlayer && pokojPwBalance < 0) return accepted:false` (kierunkowa bramka pokoju), commit e27418db (R-DYPLO-POKOJ-KIERUNEK-I-ZADANIE-AI-Q1, ECHO wlasciciela 2026-09-07; REJESTR ok. linii 442: "partner proponuje -> pomijana; gracz proponuje -> wymaga bilansu >= 0"). Test uzywal prop('pokoj', 0, 1), czyli proponent = gracz (owner 0), i oczekiwal accepted:true wg wczesniejszej decyzji rundy 4 -- nieaktualne. Dowod: `git log -S'authorIsPlayer && pokojPwBalance'` -> e27418db; reprodukcja: accepted:false, pwBalance -355, "Brakuje 355 PW...". Naglowek "r5Gate" w starym komentarzu byl mylacy: ctx bez warState nie wchodzi w r5Gate.
- Naprawa: asercje 19e rozbite kierunkowo. AI->gracz (prop('pokoj',1,0)): accepted i pwBalance<0 (obie relacje). Gracz->AI: odrzucony z "Brakuje N PW" i pwBalance<0 (obie relacje). Asercji nie oslabiono (4 zamiast 2).

### 2. mgla-sciezka-inwariant-test (2 FAIL: [1], [1c])
Nowe niesklasyfikowane zapisy pozycji, kazdy sprawdzony w kodzie:
- battleScene.ts:8607-8608 `ru.q = col; ru.r = row;` -- siatka bitwy (_doMove); dawny wpis jednoliniowy rozbity na 2 linie -> POZA-MAPA-SWIATA.
- siege-enter-city.ts:99-100 -- oblegajaca armia (pod murem, heks sasiedni) wchodzi na heks poddanego miasta, bez kosztu ruchu -> KROK-1-HEX.
- main.ts:4279 enforceArmyStackLimit -- relokacja nadwyzki stosu, potem refreshFog() -> TELEPORT-BEZ-SCIEZKI.
- main.ts:26418 -- trzeci hak testowy `playerCity.q = attacker.q` (MIASTO, nie jednostka) -> NIE-JEDNOSTKA (nr 3).
- main.ts:34823-34824 transferCityByTreaty -- garnizon oddajacego na najblizsze wolne heksy (pierscien <=3), refreshFog() po -> TELEPORT-BEZ-SCIEZKI.
- main.ts:28169 `Object.assign(snap.meta as any, patch)` -- hak testowy round-trip meta zapisu, nie pozycje -> DOZWOLONE_OBJECT_ASSIGN.
Zaden wpis nie jest marszem wieloheksowym bez odkrycia, wiec inwariant nadal chroni; zero zmian logiki skanera. Referencja "42/42" w R-PROC-AUTOBOT.md znow prawdziwa.

### 3. diplomacy-audience-close-flush-test (2 FAIL: [A4], [A4f])
5 golych wywolan hideDiplomacyAudience() (test dopuszczal 3); dwa nierozpoznane:
- main.ts:13164 switchActiveHuman() KROK 1 (hot-seat no-leak): zamkniecie audiencji STAREGO fotela. Flush odroczonej bitwy/scalenia pokazalby okno poprzedniego fotela nastepnemu (advanceSeat tez robi launchAttacks:false z tego powodu) -> zamierzone, nie blad. NIE_ZWERYFIKOWANO: zachowanie kolejek deferred* miedzy fotelami w zywej grze hot-seat (nie testowano w przegladarce).
- main.ts:27753 `__truceTestDebug.closeAudience` -- hak testowy, zero wywolan z gra/src, wolany przez zywe bramki *-live-test.cjs (jak hak z 27112).
Naprawa: [A4]/[A4f] 3 -> 5 nazwanych miejsc; nowe asercje [A4g] (hak truce: region, brak wywolan z src, osiagalnosc) i [A4h] (switchActiveHuman: 1 wywolanie, chronione isDiplomacyAudienceOpen, brak flushDeferred* w ciele).
