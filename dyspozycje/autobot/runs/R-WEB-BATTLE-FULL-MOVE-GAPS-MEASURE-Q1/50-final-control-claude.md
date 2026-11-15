# R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko pomiary i narzędzie; kod gry nie zmieniany)
TEMAT: R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1
GOAL: (a) zmarnowany ruch strzelców po zderzeniu (>=5 ziaren, >=3 składy); (b) wyjątki doktryn Obrona/Ostrzał, rozkaz ręczny, uciekinierzy, mur oblężniczy; (c) anomalia determinizmu e20cd0b5 na >=20 przebiegach.
ZMIANY-COMMIT: kandydat e98ce29e1cc12c618f0f056cc35ec3fa0f68618e (potomek bazy 71ca0e588 — `git merge-base --is-ancestor` OK; merge-base z aktualnym origin/main b14ac3c61 = 71ca0e588, więc integracja = zwykły merge/FF-able bez dotykania gra/src). Diff vs 71ca0e588: 7 plików, wyłącznie `gra/tools/battle-full-move-gaps-measure.cjs` + `dyspozycje/autobot/runs/R-WEB-BATTLE-FULL-MOVE-GAPS-MEASURE-Q1/**` — zgodne z allowlistą; gra/src, battleScene.ts, WERSJE.md, manifest nietknięte. Brak plików zz-mut w repo. Ten raport = osobny commit z samym plikiem 50-final-control-claude.md. integration_sha = SHA kandydata e98ce29e1 (raport FC jest opcjonalnym commitem dokumentacyjnym nad nim).

## Rozstrzygnięcie zarzutów

1. (a) liczność/definicja — ODDAL. Obrona dołożyła C3 i C4 (5/5 zderzeń każdy); z evidence: 5 składów x 5 ziaren = 25 przebiegów, 20 z zderzeniem, 4 składy z kontaktem (spełnia >=5 ziaren, >=3 składy). C1 0/5 zderzeń jest jawnie raportowany i wyłączony z sumy. Definicja wąska (bez canStrike) daje te same 895 MP (11,9%), canStrikeOnlyActs = 0 — zarzut zależności od canStrike obalony danymi. Brak ręcznego przeglądu 895 MP to NIE ZMIERZONO z uzasadnieniem; dispatch wymaga pomiaru i kandydata R-WEB, nie przeglądu case-by-case; próg odsetka = decyzja właściciela (narzędzie słusznie go nie ma).
2. (b) rozkaz ręczny i mur oblężniczy NIE ZMIERZONO — ODDAL (z notą). Dispatch dopuszcza NIE_ZMIERZONO z powodem; powód zweryfikowany grepem `moveLeft`: battle-manual-queued-order-lifecycle-live-test.cjs 0, siege-manual-battle-live.cjs 0, open-tile-deterministic 2 trafienia (tylko reset/zrzut stanu, nie pomiar ruchu po ciosie). Obrona/Ostrzał/uciekinierzy zmierzone: ruch po ciosie 0 (def-defensive 10 przebiegów łącznie z ostrzałem, doktryna aktywna: 181 + 1231 aktywacji, uciekinierzy 662 w measure). Luka rozkazu ręcznego jest osobno śledzona jako #431 (R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-Q1) — nie blokuje tego tematu.
3. (c) anomalia niezreprodukowana — ODDAL. Użyto narzędzia wskazanego przez FC RESIDUAL-INFANTRY-Q2 (battle-full-move-strike-test, BFM_PART=det, ziarno 1): 21/21 identycznych (hash 14f9e9bb...), plus 20/20 w gaps-measure: 0/41 odtworzeń. Wynik uczciwie sformułowany „nie odtworzono w N próbach", przyczyna timing/obciążenie NIE ZMIERZONA (jawnie). Różnica definicji skrótu (14f9e9bb vs e20cd0b5) nie podważa tego, że ten sam przebieg jest powtarzalny.
4. Drobne wady narzędzia — ODDAL (naprawione w e98ce29e1): msg puste dla ok:true, stały check (inv) usunięty (niezmiennik w openPage rzuca wyjątek), zdublowany licznik usunięty. Zweryfikowane w kodzie narzędzia (linie checks w trybach measure/doctrine).
5. Dowód mutacyjny — ODDAL. Obrona opisuje mutację na kopii (`!e.doctrineExempt`) -> FAIL, 96/194 aktywacji, exit 1; Evaluator niezależnie ją odtworzył. Mutacja kodu gry nie jest twierdzona (i nie jest wymagana tematem pomiarowym).

Żaden zarzut nie wymaga NAPRAW; żaden nie jest realną decyzją produktową poza progiem odsetka (decyzja właściciela, już zgłoszona jako ABC).

## Weryfikacja własna (FC, checkout e98ce29e1, npm ci w gra/)
- logic-test: LOGIC OK (213/213), exit 0
- tech-tree-test: 20 pass, 0 fail, exit 0
- research-test: PASSED 33 / FAILED 0, ALL GREEN, exit 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), exit 0
- combat-test: COMBAT TEST 6/6 pass, exit 0
- npx tsc --noEmit: exit 0
- git diff --check 71ca0e588..e98ce29e1: czysto
- Reprodukcja na żywo (Chromium, vite w pamięci): `BFG_PART=measure BFG_COMP=3 BFG_SEEDS=1` -> shooterActs 62, pool 186, left 103, unexplained 32, hash d9921aba7debb292f3e09e80643938b1, exit 0 — identycznie jak wiersz comp 3 seed 1 w evidence/measure-measure.json (w tym hash).
- Spójność evidence: sumy z runs[] w measure-measure.json = shooterActs 2514, pool 7542, left 3578, unexplained 895, blocked 2683, exemptActs 662, exemptMoveAfterHit 0, doubleStrike 0 — równe totals i raportowi Obrony. measure-det.json: 20 przebiegów, 1 hash. measure-doctrine.json: 10 przebiegów, wszystkie checks ok.
- Porządek: gra/node_modules usunięte po testach; brak zmian w drzewie poza tym raportem.

## UWAGI (nie blokują)
- Proweniencja: evidence/measure-measure.json zawiera `totals.compsWithContact/seedsPerComp/canStrikeOnlyActs` i check „(a) >=3 sklady z kontaktem i >=15 przebiegow z kontaktem", których NIE generuje zacommitowana wersja narzędzia (scalenie 25 przebiegów wykonane poza repo). Liczby są odtwarzalne (sprawdzone wyżej), ale kryterium pokrycia ziaren/składów nie jest egzekwowane kodem wyjścia narzędzia. Rekomendacja: przy najbliższej okazji dopisać agregację/scalanie i ten check do narzędzia (drobny temat dokumentacyjno-narzędziowy).
- W przebiegach measure exemptDoctrine = 0 (doktryny nie wypadają naturalnie); aktywność doktryn dowodzi tryb doctrine z wymuszeniem w sondzie.

## UWAGI-DLA-ORKIESTRATORA
1. Kandydat R-WEB (nienaprawiany, wymaga decyzji progu ABC): 895 MP niewyjaśnionego ruchu strzelców = 11,9% puli (C3 16,1%, C0 13,0%, C4 10,9%, C2 8,4%); całkowicie niewykorzystane 47,4%. Brak przeglądu przypadków — przy starcie tematu zacząć od unexplainedList w evidence.
2. ABC: czy C1 (łucznicy bez kontaktu w 31–34 rundach) jest zamierzonym zachowaniem.
3. Luka pomiarowa (b): driver ruchu po ciosie dla rozkazu ręcznego i muru oblężniczego — pokrywa częściowo #431; mur oblężniczy bez własnego tematu.
4. Anomalia e20cd0b5: do odtworzenia potrzebna trójka (ziarno + skład + narzędzie) z pierwszego przebiegu FC RESIDUAL-INFANTRY-Q2.
5. main ma już b14ac3c61 (FALA 753); kandydat jest oparty na 71ca0e588 — przed integracją sprawdzić `git merge-base --is-ancestor` i brak konfliktu (zmiany kandydata nie dotykają gra/src ani WERSJE.md).

BLOKADY: brak (poza wymienionymi NIE ZMIERZONO: manual/mur oblężniczy, przegląd 895 MP, przyczyna anomalii)
RUNDY: FC 1/5; poprzednie werdykty: Evaluator FAIL (bd56eb196) -> obrona PASS-WITH-NOTES (e98ce29e1)
NASTĘPNY KROK: integracja orkiestratora (merge kandydata e98ce29e1, bramki), potem READY_FOR_DEPLOY wg rejestru; decyzje ABC z UWAG 1–2.
DEPLOY/PUSH: NIE WYKONANO
