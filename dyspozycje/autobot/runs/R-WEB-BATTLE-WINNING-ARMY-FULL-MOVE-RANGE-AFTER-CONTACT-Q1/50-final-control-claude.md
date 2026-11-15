# R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 — Final Control (runda 2/5)

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1
GOAL: zwycięska armia w AUTO/SKIP ściga rozbitego wroga pełnym zasięgiem ruchu własnej jednostki (konnica >= 80% puli przy wolnej drodze, tury 9-16).
ZMIANY/COMMIT: kandydat 571e07fb5b9c415fdc71678b0f44e224ca531f87 (potomek bazy 3ddd5d2c7, zawiera 3a6b0e405 przez merge 3cfda16ac). Wkład r2 (275f047d3 + 571e07fb5): tylko narzędzia pomiaru (gra/tools/battle-pursuit-pace-*), raporty i evidence; gra/src bez zmian. `git merge-tree 571e07fb5 origin/main` (3d1670626) = czysty. Integracja: BRAK (FAIL). Ten raport zacommitowany osobno.
TESTY: przeliczono SAMODZIELNIE evidence/r2-konnica-zatrzymania.json (utracone MP = pula - wykonane, wg powodu zatrzymania):
 - skip s1: wykonane 76/175; utracone can=true 71, can=false 10, none 18 (can=true = 72% strat)
 - watch s1: 75/175; can=true 58, can=false 18, none 24 (58%)
 - skip s2: 72/182; can=true 32, can=false 45, none 33 (29%)
 - skip s3: 61/168; can=true 26, can=false 50, none 31 (24%)
 Liczby Evaluatora potwierdzone. tsc / bramki referencyjne: NIE URUCHOMIONO (gra/src bez zmian względem bazy; wolne 3,5 GB < 6 GB; brak zmiany kodu, więc bramki nie rozstrzygają oceny).
BLOKADY: brak naprawy ruchu; brak pomiaru przyczyny dla większości strat na s2/s3; brak testu behawioralnego.
RUNDY: 2/5
NASTĘPNY KROK: runda 3 tego samego ID (Operator), patrz niżej.
DEPLOY/PUSH: NIE WYKONANO

## Werdykty zarzutów
1. NAPRAW. Skarga nadal występuje (konnica 61-76 / 168-182 puli). DECISION_REQUIRED dopuszczalne tylko dla przyczyny zmierzonej, a ta obejmuje mniejszość strat poza s1.
2. NAPRAW. Przyczynę „zatrzymanie przy rozbitym wrogu” (can=true) zmierzono dla s1 (72%) i uogólniono; na s2/s3 to 29%/24%. Reszta (plan_end can=false 45-50 MP, stop=none 31-33 MP) bez wyjaśnienia - może to być zwykły błąd planera/ścieżki, nie decyzja produktowa.
3. NAPRAW. Hipoteza kolizji obalona tylko dla kroków wykonanych (occupied=0); wiersze stop=none z planned>executed (np. s3 r9 atk14: plan 6, wykonano 1) niewyjaśnione; surowych moves/planWhy brak w evidence.
4. ODDAL (w części). Kandydat 571e07fb5 zawiera już 3a6b0e405 (zarzut dotyczył 275f047d3); merge z obecnym origin/main czysty. Pomiar na bazie sprzed zmian battleScene.ts/mapFieldBattle.ts w main: powtórzyć w r3 po merge.
5. NAPRAW. Brak testu behawioralnego na realnej ścieżce _resolveAutoBatchMovement/_advanceStep (czerwony przy „dziobaniu”, mutacja). Pkt 4 DODATKU 2 niespełniony.
6. NAPRAW. Brak pomiaru piechoty (tury 9-16) i scenariusza 2 (przed/po); cel 80% puli NIE_ZMIERZONY. Pkt 3 DODATKU 2 niespełniony.
7. DO DECYZJI CZŁOWIEKA (część can=true): wariant A (cios od razu przy pozostałym MP) zmienia regułę walki -> pytanie ABC. Pytanie ma zawierać liczby dla wszystkich ziaren (s1 72%, s2 29%, s3 24%), wpływ na łuczników (_canAttackFrom używa ru.range) i zgodność AUTO=SKIP; Operator dostarcza w r3.
8. ODDAL. Dług Rust REPIN zapisać po decyzji; brak zmiany reguły w r2 akceptowalny.

## Zadanie dla rundy 3 (ten sam ID)
a) Merge origin/main; powtórz pomiar na s1-s3, skip+watch, konnica ORAZ piechota, tury 9-16.
b) Zinstrumentuj gałąź planera dla wierszy plan_end can=false i stop=none (powód braku kroku: _advanceStep / BFS / _compactAttackAllowsStep / limit ścieżki); surowe moves/planWhy do evidence. Jeśli to błąd (nie reguła) - NAPRAW z testem behawioralnym i mutacją czerwoną.
c) Dla części can=true: pytanie ABC (A/B/C) z liczbami z s1-s3 i wpływem na łuczników/AUTO=SKIP; nie zmieniać predykatu wzwarcia bez zgody.
d) Test behawioralny ruchu (>= 80% puli konnicy przy wolnej drodze) na realnej ścieżce; tsc 0, 5 bramek, battle-skip-equals-auto-resolve 42/0, git diff --check, dysk >= 6 GB.

## UWAGI-DLA-ORKIESTRATORA
- Dysk 3,5 GB wolnego przy starcie FC (< 6 GB z dispatchu); posprzątać przed r3.
- Pytanie ABC (A/B/C) można zadać właścicielowi równolegle, ale z liczbami z pkt 7, nie tylko s1.
