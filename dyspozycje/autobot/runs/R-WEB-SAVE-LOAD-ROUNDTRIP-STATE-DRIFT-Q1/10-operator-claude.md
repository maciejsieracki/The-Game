STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-ROUNDTRIP-STATE-DRIFT-Q1
GOAL: zapis -> wczytanie (nowa sesja) -> t+1..t+10 daje ten sam skrot stanu co przebieg ciagly na >=2 ziarnach; klasyfikacja round-tripu; test regresji + mutacja; bramki.
BAZA: cb29ce7af57fbeb667b144ff7bbf4f3c1ccae2a7 (origin/main). Operator: SONNET (zgodnie z DODATKIEM 2, runda 3/5).
ZMIANY/COMMIT: czubek pracy = SHA w polu sha StructuredOutput (commit raportu na be62cbd4c). Pliki:
  - gra/src/main.ts (+47 linii): TYLKO sciezka zapis/wczytanie + dwa pola stanu (patrz ZRODLO).
  - gra/tools/ai-economy-measure-run.cjs: normalizacja hasza (stackGroupId + znane roznice normalizacji, lista raportowana w summary jako hashIgnored).
  - gra/tools/save-load-roundtrip-state-drift-test.cjs (NOWY): test regresji (warstwa statyczna + dynamiczna), exit 1 przy bledzie.
  - dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-ROUNDTRIP-STATE-DRIFT-Q1/10-operator-claude.md (ten raport).
  Zero zmian w ai.ts, battleScene.ts, gra/data, gra-robocza, rust-port, WERSJE.md.

== ZRODLO ROZJAZDU (ZMIERZONE, bisect pierwszego ticku t6->t7) ==
Stan wczytany tuz po load == stan ciagly (poza polami normalizacji). Rozjazd powstaje w PIERWSZYM ticku, bo tick czyta
stan z pamieci modulu main.ts liczony w koncowce poprzedniej tury i NIE zapisywany do save:

(1) nnsAiOverrides (main.ts, mapa deklarowana ok. l.7543): rownowazenie NNS (nnsAiPreTickBalance) dla AI zeruje
    poziomRacji/procentRozwoj miast (0/0) tuz przed tickiem i trzyma ORYGINALNE wartosci w nnsAiOverrides; nnsRestoreAiOverrides
    przywraca je na starcie nastepnego rownowazenia. Zapis niesie miasta z 0/0 (zmierzone: cont-t6 city5 poziomRacji=0 procentRozwoj=0),
    oryginaly (6/100) zyly tylko w mapie -> po wczytaniu mapa pusta, racje zostaja 0 (zmierzone w tiku t7: kosztRacji 0 vs 12 w ciaglym,
    zapasy Spichlerza wlasciciela 3: 18 vs 6, poziomRacji miasta po ticku 6 vs 4, procentRozwoj 100 vs 67).
(2) orderMultMap / growthMultMap / orderValueMap (main.ts ok. l.5694-5696): mnozniki Porzadku liczone w pasie Porzadku KONCOWKI poprzedniej tury
    i czytane przez tick NASTEPNEJ tury (applyOrderYieldMults -> pieniadzMult, growthMult -> wzrost, orderValueMap -> cel migracji).
    Po wczytaniu mapy puste -> mnoznik 1.0 zamiast 0.85 (zmierzone DIAGWEALTH t7, miasta 3/13/17: yld.pieniadz 0.85/4.25/4.25 w ciaglym
    vs 1/5/5 po wczytaniu) -> inny Pieniadz/Luksus -> inna wealthState.pula (15 miast), poziom Zamoznosci, surowce, manpower.
    (Wynik Porzadku sam w sobie byl IDENTYCZNY w obu przebiegach -- zmierzone DIAGORDER: tier/porPct/szPct bez rozbieznosci; rozni sie
    wylacznie mapa przenoszona miedzy turami.)
Odrzucone hipotezy (zmierzone): RNG Math.random (r2), _dipUnitSeq/aiGoldIncomeByOwner (r2), aiSliderStateByOwner (zapisany; wejscia
slidera identyczne w obu przebiegach poza zapasami z pkt (1)), split NNS (nnsAiOverrides.split: wejscia DIAGSPLIT identyczne po fixie).

== NAPRAWA (minimalna, gra/src/main.ts) ==
  zapis (buildSaveGameSnapshot -> meta): nnsAiOverrides, orderMultByCity, orderGrowthMultByCity, orderValueByCity -- kazde pole dopisywane
    WARUNKOWO (tylko gdy mapa niepusta => przy pustych mapach bajty zapisu jak baza).
  odczyt (restoreGameFromSave, tuz przed aiTargetMemoryByOwner): clear() + odtworzenie z meta; kazdy odczyt chroniony Array.isArray =>
    stary zapis bez pol = puste mapy = zachowanie dokladnie jak dotad (zgodnosc wsteczna).
Decyzje produktowe NIE ruszone: budowaPriorytetTypow (DO ABC), resourceLedgerHistory (osobne zgloszenie), brak zmiany wartosci/progow gry.

== POMIARY PRZED / PO (raw) ==
Komenda (runner, realny quickSave/loadSlot, NOWA sesja przegladarki, 41 AI, hash realnej migawki bez meta):
  ai-economy-measure-run.cjs --resume-test 1 --seed S --save-at 6 --turns T --every 3 --hash 1 --dist <dist> ...
PRZED (baza cb29ce7af + normalizacja stackGroupId), seed 4242, save-at 6, turns 7: allEqual=false, compared=1 (0/1);
  roznice migawki t7: 204 (w tym 164 = pola normalizacji x41 miast + 5 resourceLedgerHistory + 35 SEMANTYCZNYCH:
  wealthState.pula 15, procentRozwoj 5, poziomRacji 5, wzrostUlamkowy 5, surowce/drewno 1, manpower 1, wealthState.poziom 1,
  cityProd/city3/postep 1, cityProd/city15/rekrutacja 1). (Wczesniejsze rundy: 0/3 na turns 9, 0/10 w 41-50 harnessu.)
  Seed 777 PRZED: NIE ZMIERZONO (rozjazd tej samej przyczyny; brak osobnego pomiaru bazy).
PO FIXIE (be62cbd4c), turns 9: seed 4242 allEqual=true 3/3; seed 777 allEqual=true 3/3.
PO FIXIE (test regresji, save-at 6, turns 16): seed 4242 10/10 skrotow rowne; seed 777 10/10 skrotow rowne
  ("porownano 10/10 tur po wczytaniu", "zapis->wczytanie->t+1..t+10 zgodne ze stanem ciaglym (10/10 skrotow rowne)", log test-long).
Roznice migawki po fixie (seed 4242/777, t7-t9): WYLACZNIE 164 pola normalizacji + 5 resourceLedgerHistory (zero roznic SEMANTYCZNYCH).
MUTACJA: na KOPII drzewa zrodel (poza repo) i kopii main.ts:
  - mutant A (odczyt orderMultByCity wylaczony): test dynamiczny seed 4242 FAIL "0/3 skrotow rowne"; test statyczny na kopii FAIL "odczyt orderMultByCity".
  - mutant B (odczyt nnsAiOverrides wylaczony `if (false)`): test dynamiczny seed 4242 FAIL "0/3 skrotow rowne" (statyczny nie lapie -- warstwa B jest rozstrzygajaca).
  - mutant runnera `--mutant 1` (dosypka 1 zlota po wczytaniu) na naprawionym buildzie: allEqual=false (czerwone) -- WZNOWIENIE {"compared":3,"allEqual":false,"mutant":true}.

== KLASYFIKACJA ROZNIC ROUND-TRIPU ==
| pole | klasa | zrodlo | dzialanie |
|---|---|---|---|
| nnsAiOverrides (rations/split) -> cities[].poziomRacji, procentRozwoj, wzrostUlamkowy, zapasy Spichlerza (empireFoodStates po ticku) | SEMANTYCZNA | mapa w main.ts nie byla w meta (zapis niosl 0/0, oryginaly tylko w mapie) | NAPRAWIONE (zapis+odczyt) |
| orderMultMap -> yld.pieniadz/produkcja/nauka/kultura w ticku | SEMANTYCZNA | mnozniki Porzadku poprzedniej tury nie w meta; po load 1.0 | NAPRAWIONE |
| growthMultMap -> wzrost ludnosci w ticku | SEMANTYCZNA | j.w. | NAPRAWIONE |
| orderValueMap -> pickRevoltMigrationTarget | SEMANTYCZNA (rzadka sciezka) | j.w. | NAPRAWIONE |
| cities[].wealthState.pula/poziom, surowce/drewno, manpower, cityProd/*/postep, cityProd/city15/rekrutacja, procentRozwoj, poziomRacji, wzrostUlamkowy | SEMANTYCZNA (skutek wyzej) | pochodne (1)/(2) | znikaja po naprawie (zmierzone) |
| cities[].budowaLista ([]), magazynZywnosci (0), postepBudynkowUsuniete ({}) | NORMALIZACJA (pole nieobecne w ciaglym vs domyslna wartosc po load; po naprawie zero wplywu na kolejne tury -- zmierzone: 10/10 przy tych polach roznych) | cities.ts:776 (ensureCitySaveDefaults) | bez zmian w grze; w haszu runnera pomijane gdy rowne domyslnej |
| cities[].budowaPriorytetTypow | NORMALIZACJA w skutku / DO ABC wlasciciela (A: wczytanie nie dopisuje listy; B: zywa gra dopisuje przy zalozeniu miasta) | cities.ts/empire-city-defaults (domyslna lista przy braku pola) | NIE ZMIENIONE (decyzja produktowa); w haszu runnera pomijane i JAWNIE zapisane w hashIgnored |
| units[].stackGroupId | ARTEFAKT POMIARU (Date.now) | generator id grupy | normalizacja w haszu runnera (zgoda orkiestratora) |
| resourceLedgerHistory (5 -> 0 wpisow) | ODRZUT / zgloszenie #432: w ciaglym 5 wpisow, po load 0; restore wywolywany (main.ts:~49089 restoreLedgerHistoryFromSave z tym samym N co zapis; ledgerHistoryToSave(isHuman) filtruje AI) -- dla zapisu gdzie gracz nie ma miast wpisy sa puste `{}`; przyczyna 5->0 NIEZWERYFIKOWANA | resource-ledger.ts | NIE NAPRAWIANE (nietrywialne; zero wplywu na tick: 10/10 przy tej roznicy); w haszu pomijane (hashIgnored) |
Test zgodnosci wstecznej: odczyt kazdego z 4 pol chroniony Array.isArray (test statyczny tego pilnuje); load-game-regression-test 34/34 PASS, map-snapshot-load nie zakonczyl sie w 100 s (timeout, NIE ZMIERZONO). Dedykowany pomiar "stary zapis bez pol" w przegladarce: NIE WYKONANO (tylko analiza kodu + testy ogolne).

== BRAMKI (surowe wyniki) ==
tsc --noEmit (gra/): exit 0, brak bledow.
logic-test: "LOGIC OK (213/213)" exit 0.  tech-tree-test: "20 pass, 0 fail" exit 0.  research-test: "PASSED: 33 / FAILED: 0 / TOTAL: 33 ALL GREEN".
unit-replace-test: "WSZYSTKIE TESTY ZIELONE (21/21)".  combat-test: "COMBAT TEST: 6/6 pass".
git diff --check cb29ce7af..be62cbd4c: czysto (pusty wynik).
save-load-roundtrip-state-drift-test --static-only: 10/10 OK (exit 0); pelny (seeds 4242,777, turns 9): 8 asercji OK + 10 statycznych, "SAVE-LOAD ROUNDTRIP OK"; turns 16: 10/10 na obu ziarnach.
ai-economy-measure-hook-test --dist <naprawiony bundle>: "PODSUMOWANIE 16/16 zielone" (w tym kontrola negatywna, mutacja ksztaltu).
Testy zapisu/migracji (wynik z ogona): resource-ledger-save-history-test 15/0; load-game-regression-test 34/0; determinism-save-load-resume-test PASS; praca-jeden-podzial-kontrakt-test 634 OK/0; civ-ai-allocation-saveload-order-test 5/5; counter-migration-test OK; alliance-war-call-saveload-test 7/0; diplo-truce-n6-saveload-test 8/0; forced-war-iron-era-enter-turn-save-load-test 20/0; fort-nodes-save-load-test 18/0; battle-mode-save-reload-contract-test PASS.
  okolica-load-reconcile-test: FAIL 21/23 -- ZMIERZONE jako PRE-EXISTING: identyczny wynik (21/23) na bazie cb29ce7af (main.ts z bazy), nie jest regresja tej zmiany (test wzorcowy tekstu main.ts: sprawdza kolejnosc reconcileAllWorkedTiles vs playerEverOwnedCity; nowe pola nie dotykaja tego obszaru).
  map-snapshot-load-test: timeout 100 s (NIE ZMIERZONO).

BLOKADY: brak blokujacych. Znane otwarte (poza zakresem, opisane wyzej): #432 resourceLedgerHistory 5->0; DO ABC budowaPriorytetTypow; #433 playerEverOwnedCityByOwner (nie ruszane).
RUNDY: 3/5. Poprzednie: r1 BLOCK, r2 BLOCK (brak kodu). Ta runda: zrodlo zlokalizowane, naprawa + test + mutacje + bramki.
NASTEPNY KROK: Evaluator (SONNET) -> Obrona -> Final Control; po FC integracja i deploy wylacznie wg bramek orkiestratora.

== UWAGI-DLA-ORKIESTRATORA ==
1. Zgloszenie do rejestru (#432): resourceLedgerHistory po wczytaniu 5 -> 0 w scenariuszu harnessu (gracz bez miast; ledgerHistoryToSave(isHuman) zapisuje puste mapy per tura). Przyczyna niezweryfikowana, zero wplywu na determinizm ticku (10/10 mimo roznicy).
2. Mozliwe pokrewne ryzyka tej samej klasy (stan pamieci modulu poza meta, NIE zmierzone czy wplywaja na tick): citizenUpkeepByOwner, buildingResourceUpkeepByOwner, converterProducedLastTurnByOwner, unitResourceUpkeepByOwner, cityOrderState (czytany m.in. przez UI/render, bunt). 10/10 na 2 ziarnach w 10 turach sugeruje brak wplywu w tym scenariuszu; dluzszy pomiar (np. 40-50 tur, wojny, bitwy) NIE WYKONANO -- zalecany jako osobny pomiar (np. harness --resume-test z --save-at 40 --turns 50, ~40-50 min).
3. Test regresji ma warstwe dynamiczna ~5 min / ziarno (2 ziarna rownolegle), wymaga zbudowanego bundla poza repo (vite build --outDir <abs>) i Chromium (/usr/bin/chromium).
4. Pomiary posrednie byly robione na buildach z tymczasowymi console.error (DIAGSLIDER/DIAGFOOD/DIAGSPLIT/DIAGWEALTH/DIAGORDER); WSZYSTKIE usuniete przed commitem (git diff zawiera wylacznie zmiany wymienione wyzej).
5. Sprzatanie: gra/node_modules i buildy w scratchpadzie usuniete po pracy.
DEPLOY/PUSH: NIE WYKONANO
