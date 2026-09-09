STATUS: FAIL
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-B-Q1
GOAL: Migracja klastra "HUD/panel dyplomacji" (12 z 15 funkcji z recon) na isMe()/ME(), Etap 6d —
runda 2: niezależna weryfikacja naprawy bramki `exec-test.cjs` wg WERDYKTU 2 Final Control rundy 1.

WERDYKTY:

1. (przeniesiony z rundy 1, zamknięty) Niespójność liczbowa "13 funkcji" w tytule commitu
   `5ba21cfa` vs "12 z 15" faktycznych. ODDAL — czysto redakcyjne, zero wpływu na kod/testy.
   Bez zmian od rundy 1, potwierdzone nadal aktualne w historii Git.

2. (z rundy 1) Bramka `exec-test.cjs` nie czerwieniła się na `collectDiploChipCounts`
   (L15031/L15039) i większości `enqueueNegotiationFromAiCmd`. NAPRAWIONE w rundzie 2 —
   zweryfikowane niezależnie niżej. ZAMKNIĘTE.

NOWY ZARZUT (znaleziony niezależnie przeze mnie, żaden wcześniejszy raport — Operator, Evaluator
ani Final Control rundy 1 — go nie zgłosił; dokładnie zgodnie z punktem 4 dyspozycji tej rundy:
"dodaj WŁASNĄ, NOWĄ mutację w miejscu którego nikt jeszcze nie testował"):

3. **NAPRAW.** Bramka `hotseat-etap6d-podetap-b-exec-test.cjs`, sekcja 3
   (`collectDiploChipCounts`), NIE czerwienieje na regresji literału `0` w guardzie
   `if (isMe(oid)) continue;` — main.ts:15038 — mimo że ta linia jest w TEJ SAMEJ funkcji,
   która była przedmiotem WERDYKTU 2 rundy 1 i której bramka miała zostać w tej rundzie
   wzmocniona do pełnego pokrycia per-call-site.

   DOWÓD (własna mutacja main.ts, przywrócona kopią pliku natychmiast po pomiarze,
   `git diff --quiet` puste przed i po):
   ```
   main.ts:15038 przed:  if (isMe(oid)) continue;
   main.ts:15038 po:     if ((oid === 0)) continue;
   ```
   Wynik `node tools/hotseat-etap6d-podetap-b-exec-test.cjs`: **46 PASS, 0 FAIL** — identyczny
   z czystym stanem, ZERO reddenia. Dla porównania, potwierdzone tą samą metodą, że sąsiednia
   linia w TEJ SAMEJ funkcji (main.ts:15032, `d.strony[0] === ME() ? ... : ...`) PRAWIDŁOWO
   czerwienieje pod identyczną mutacją (44 PASS/2 FAIL) — więc bramka NIE jest ślepa całościowo,
   tylko na tym jednym konkretnym call-site.

   PRZYCZYNA (zweryfikowana czytaniem kodu testu i main.ts, nie zgadywaniem): mechanizm, który
   naprawił WERDYKT 2 rundy 1 dla pozostałych call-site'ów tej funkcji, opiera się na tym, że
   `PLAYER=7` (stała testu) jest CELOWO różne od `0`, więc każde wywołanie PRZECHWYCONE i
   asercjonowane na wartości argumentu (np. `getDiploRelation`) wykryje pozostały literał `0`,
   bo `0 !== 7`. To działa dla wywołań FUNKCJI (argument przekazywany dalej). Nie działa dla
   `isMe(oid) continue` — to jest guard sterujący PRZEPŁYWEM (nie wywołanie przechwytywanej
   funkcji), którego skutek jest widoczny wyłącznie gdy `oid` faktycznie RÓWNA SIĘ wartości
   porównywanej (ME()=7 w wersji poprawnej, `0` w wersji zepsutej). Mock `contacted =
   getDiplomaticContacts() = new Set([AI1=4, AI2=5])` nie zawiera ANI `7` ANI `0` — więc
   `isMe(4)===false` i `(4===0)===false` dają IDENTYCZNY wynik, tak samo dla `5`. Poprawna i
   zepsuta wersja tej jednej linii są więc pod tym mockiem NIEODRÓŻNIALNE — nie kwestia
   przechwycenia argumentu (jak przy pozostałych naprawionych call-site'ach), tylko doboru
   wartości testowych w `contacted`, które nigdy nie trafiają w wartość graniczną tego guardu.

   ROZGRANICZENIE (jak w WERDYKCIE 2 rundy 1): main.ts jest potwierdzony poprawny — czytanie
   main.ts:15038 pokazuje `isMe(oid)`, nie literał. Defekt jest WYŁĄCZNIE w kompletności bramki
   regresyjnej dla tego jednego call-site w `collectDiploChipCounts`, funkcji, która była
   DOKŁADNIE przedmiotem naprawy tej rundy — stąd runda 2 nie może zostać uznana za w pełni
   zamkniętą względem własnego celu (wzmocnienie bramki dla `collectDiploChipCounts` do pełnego
   pokrycia per-call-site), mimo że oba zarzuty z rundy 1 (WERDYKT 2 a/b/c) są faktycznie
   naprawione.

   NAPRAWA (dla rundy 3, ten sam ID/branch, WYŁĄCZNIE plik testowy):
   dodać do mocka sekcji 3 trzeci `oid` w `contacted`, równy `PLAYER` (np. AI3=PLAYER=7,
   symulujący defensywny/błędny wpis własnego ID wśród kontaktów dyplomatycznych) i
   asercjonować wprost w bloku PRAWDZIWY, że ten wpis NIE trafia do żadnego licznika
   (sojusze/pakty/wojny pozostają bez zmian po jego uwzględnieniu, `getDiploRelation` NIE
   zostaje dla niego wywołane — dowód, że `continue` faktycznie zadziałał). Nie wymaga zmian w
   main.ts (kod gry poprawny) ani w allowliście (mieści się w istniejącym wpisie
   `gra/tools/*-test.cjs`).

Poza powyższym, wszystkie pozostałe punkty dyspozycji Final Control tej rundy zweryfikowane
bezpośrednio i potwierdzone:

DOWÓD WŁASNEJ WERYFIKACJI:

(1) `git diff 5ba21cfa -- gra/src/main.ts` = 0 linii (pusty), sprawdzone przed i po wszystkich
    moich mutacjach testowych. `main.ts` absolutnie nietknięty od rundy 1, jak wymagane.

(2) Przeczytany w całości poprawiony `gra/tools/hotseat-etap6d-podetap-b-exec-test.cjs` (468
    linii), ze szczególnym uwzględnieniem sekcji 3 (`collectDiploChipCounts`) i sekcji 4
    (`enqueueNegotiationFromAiCmd`). Potwierdzone: asercje w obu sekcjach są na PRZECHWYCONYCH
    ARGUMENTACH każdego wywołania osobno (np. `realCalls.getDiploRelation[0][0]` i `[1][0]`
    osobno dla dwóch niezależnych wywołań w sekcji 3; wszystkie 12 miejsc `ME()`/`isMe()` w
    `enqueueNegotiationFromAiCmd` mają dedykowane przechwycenie i osobną asercję rozbite na dwa
    warianty `cmd.type`), NIE na zagregowanym wyniku — z jednym wyjątkiem: guard sterujący
    przepływem `isMe(oid)` w sekcji 3 (linia main.ts:15038), który nie jest "wywołaniem" w
    sensie przechwytywalnym, i którego pokrycie zależy wyłącznie od doboru wartości w
    `contacted` — patrz ZARZUT 3 wyżej.

    Krzyżowo zweryfikowane z main.ts: wszystkie cytowane numery linii (15031, 15032, 15038,
    15039 dla `collectDiploChipCounts`; 15968, 15982, 15986, 15992, 15994, 16001, 16030, 16040,
    16049, 16054, 16085, 16090 dla `enqueueNegotiationFromAiCmd`) zgadzają się 1:1 z aktualnym
    main.ts (`grep -n` świeżo w worktree, nie z pamięci raportu).

(3) SAMODZIELNIE, WŁASNORĘCZNIE powtórzone WSZYSTKICH 7 mutacji z raportu Final Control rundy 1,
    każda osobno w main.ts, main.ts przywrócony kopią pliku (`cp /tmp/main.ts.verify.bak
    src/main.ts`, NIE `git checkout`) po każdej próbie, `git diff --quiet gra/src/main.ts`
    potwierdzone puste przed i po:
    a) `collectDiploChipCounts` L15031 `includes(ME())→includes(0)` — **czerwieni**: 44 PASS/2 FAIL.
    b) `collectDiploChipCounts` L15039 `getDiploRelation(ME(),oid)→getDiploRelation(0,oid)` —
       **czerwieni**: 44 PASS/2 FAIL.
    c) `enqueueNegotiationFromAiCmd` L15968 `getDiploRelation(ownerId,ME())→(ownerId,0)` —
       **czerwieni**: 44 PASS/2 FAIL.
    d) `foreignCivsMissingTradeTreatyForCity` L14759 `isMe(city.ownerId)→(city.ownerId===0)` —
       **czerwieni**: exit code 1 (FAIL na pierwszej asercji + wyjątek na niezdefiniowanym
       dostępie, znana usterka metodologiczna braku early-return w skrypcie — wynik i tak
       non-zero, bramka łapie regresję).
    e) `applyBorderMarchPenaltiesEndTurn` L4869 `classifyPlayerBorderMarchNotice(...,ME())→(...,0)`
       — **czerwieni**: 45 PASS/1 FAIL.
    f) `currentVisibleForOwner` L9892 `allianceFormalKindBetween(...,ME(),...)→(...,0,...)` —
       **czerwieni**: 44 PASS/2 FAIL.
    g) `peacefulArchetypeForOwner` L18786 `isMe(ownerId)→(ownerId===0)` — **czerwieni**: 45 PASS/1 FAIL.
    Wszystkie 7/7 niezależnie, samodzielnie reprodukowane — zgodne z raportami Operatora i
    Evaluatora rundy 2 co do liczby PASS/FAIL. Naprawa WERDYKTU 2 rundy 1 potwierdzona SKUTECZNA
    dla wszystkich 7 pierwotnie zgłoszonych punktów.

(4) WŁASNA, NOWA mutacja poza już przetestowanymi 7 punktami (main.ts:15038, `isMe(oid)` w
    `collectDiploChipCounts`) — patrz ZARZUT 3. Dodatkowo, dla kontrastu/kontroli, potwierdzona
    mutacja main.ts:15032 (`d.strony[0] === ME()`, ta sama funkcja) — **czerwieni się poprawnie**
    (44 PASS/2 FAIL) — więc gap jest punktowy (jeden konkretny guard), nie systemowy dla całej
    funkcji.

(5) `exec-test.cjs` na czystym main.ts (po przywróceniu z kopii): **46 PASS, 0 FAIL**, exit 0 —
    potwierdzone identyczne z deklaracją Operatora/Evaluatora rundy 2.

(6) `live-test.cjs` uruchomiony w pełni (Chromium/Playwright, nie tylko przeczytany, timeout
    >120s — dokończony w tle, wynik odczytany z pliku wyjściowego): build PO i ZEPSUTY (`ME()`
    na sztywno 99) w unikalnych katalogach tymczasowych, realny `?playtest=mapa`, realne kliknięcia
    (`[data-act="diplo"]`, `.dl-item`, `[data-act="dps-audience"]`, `[data-act="miasta"]`).
    WYNIK: **12 PASS, 0 FAIL**. Mutacja poprawnie czerwieni dwa niezależne miejsca (panel
    Miasta "Brak miast" mimo realnych miast gracza — `buildEmpireDetailSnap`; zmieniona linia
    `.dl-meta` listy dyplomacji — `buildPlayerDiploRelations`), E0 (zero błędów konsoli na PO).

(7) `npx tsc --noEmit` w worktree (`gra/`, z `node_modules`): **exit 0**, zero błędów.

(8) 5 bramek referencyjnych, uruchomione świeżo w worktree:
    - `node tools/logic-test.cjs`: **213/213**
    - `node tools/tech-tree-test.cjs`: **19/19**
    - `node tools/research-test.cjs`: **33/33**
    - `node tools/unit-replace-test.cjs`: **13/13**
    - `node tools/combat-test.cjs`: **6/6**
    Wszystkie identyczne z wynikiem referencyjnym R-PROC-AUTOBOT.md §6.

(9) `git diff --stat` względem `git merge-base HEAD origin/main` = `770d0078` (po `git fetch`
    origin/main faktycznie dalej, ale merge-base niezmieniony — main poszedł tylko o commity
    dokumentacyjne raportów tego samego tematu, nie o zmiany w `main.ts`):
    ```
    gra/src/main.ts                                  |  86 ++---
    gra/tools/hotseat-etap6d-podetap-b-exec-test.cjs | 467 +++++++++++++++++++++++
    gra/tools/hotseat-etap6d-podetap-b-live-test.cjs | 267 +++++++++++++
    3 files changed, 777 insertions(+), 43 deletions(-)
    ```
    Dokładnie zgodne z allowlistą, zero plików spoza niej. `git diff --check` czysty (zero
    whitespace errors). Pełny `diff` linia-po-linii `main.ts` względem bazy `770d0078` (34
    hunki) zmapowany ręcznie — WSZYSTKIE hunki mieszczą się w brace-matched granicach
    dokładnie 12 zmigrowanych funkcji (`applyBorderMarchPenaltiesEndTurn`,
    `playerFormalRelationLabel`, `buildPlayerDiploRelations`, `buildDiploPairSummaryData`,
    `currentVisibleForOwner`, `foreignCivsMissingTradeTreatyForCity`, `collectDiploChipCounts`,
    `buildEmpireDetailSnap`, `enqueueNegotiationFromAiCmd`, `buildPendingNegotiationRows`,
    `peacefulArchetypeForOwner`, `buildAudienceActions`) — ZERO zmian poza nimi, w
    szczególności ZERO w `handleNegotiationReject` (main.ts:16402-16433, identyczne linie w
    bazie i HEAD) i `applyProposalOutcome` (main.ts:19461-19636, identyczne linie w bazie i HEAD).

(10) Worktree czysty po zakończeniu wszystkich prób weryfikacyjnych (`git status --short` —
     wyłącznie nieśledzony `04-final-control-runda1.md`, część allowlisty raportów tematu;
     `gra/src/main.ts` bez różnic względem HEAD).

ZMIANY/COMMIT: worktree `/home/user/wt-6d-PODETAP-B`, gałąź
`autobot/R-HOTSEAT-ETAP6D-PODETAP-B-Q1`, commit `6cda638a` (na bazie `5ba21cfa`, merge-base
`770d0078`). Zero zapisu do main.ts tą rundą Final Control — wszystkie mutacje testowe
przywrócone kopią pliku natychmiast po pomiarze.

TESTY: exec-test 46/46 PASS na czystym main.ts (potwierdzone niezależnie); 7/7 mutacji rundy 1
niezależnie reprodukowanych, wszystkie poprawnie czerwienią; 1 NOWA własna mutacja
(main.ts:15038, `collectDiploChipCounts`) NIE czerwienieje — patrz ZARZUT 3; live-test Chromium
12/12 PASS (uruchomiony w pełni); tsc --noEmit 0 błędów; 5 bramek referencyjnych zielone
(213/213, 19/19, 33/33, 13/13, 6/6).

BLOKADY: ZARZUT 3 (NAPRAW) — bramka `exec-test.cjs`, sekcja `collectDiploChipCounts`, wciąż
niewystarczająco czuła na regresję literału `0` w guardzie `isMe(oid)` (main.ts:15038), mimo że
ta funkcja była właśnie przedmiotem naprawy tej rundy. Kod main.ts sam jest potwierdzony
poprawny (main.ts nietknięty, diff=0 wzgl. 5ba21cfa) — blokada dotyczy WYŁĄCZNIE kompletności
bramki regresyjnej dla jednego dodatkowego call-site w tej samej funkcji, nie funkcjonalności tej
rundy. Zgodnie z dyscypliną tego repo (P-BRAMKA-*, ta sama klasa błędu już DWUKROTNIE w tym
temacie — Podetap E runda 1, Podetap B runda 1) nie może wejść do main jako "zaakceptowana
cicho" — dokładnie ten sam standard, jaki Final Control rundy 1 zastosował do WERDYKTU 2.

RUNDY: 2/5 zakończona tym werdyktem Final Control (zgodnie z §3b-bis, Final Control jest częścią
skryptu tej rundy, nie osobną rundą Operator/Evaluator). NAPRAW w ZARZUCIE 3 otwiera rundę 3 na
TYM SAMYM ID i branchu.

NASTĘPNY KROK: Operator, runda 3, WYŁĄCZNIE poprawka `gra/tools/hotseat-etap6d-podetap-b-exec-
test.cjs` sekcja 3 (`collectDiploChipCounts`) — dodać trzeci kontakt `oid=PLAYER` do mocka
`contacted`, asercjonować w bloku PRAWDZIWY, że nie trafia do żadnego licznika i że
`getDiploRelation` nie zostaje dla niego wywołane (dowód działania guardu `isMe(oid) continue`
na wartości granicznej, nie tylko na wartościach nietrafiających w żaden literał). Bez zmian w
`gra/src/main.ts`, który pozostaje zweryfikowany poprawny. Po poprawce: ponowne uruchomienie
exec-test + powtórzenie mojej sekwencji 7 mutacji (a-g, nadal powinny czerwienieć) + nowej
mutacji L15038 (powinna teraz czerwienieć) → Evaluator → Final Control.

DEPLOY/PUSH: NIE WYKONANO
