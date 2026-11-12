STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-AUTO-BREACH-ATTACKERS-ENTER-BEHIND-WALL-Q1
GOAL: Naprawić B4b (w AUTO po wyłomie atakujący wchodzą ZA mur), bez zmiany balansu, statów i progów.
BAZA: origin/main = b0b0e3f86 (FALA 658). Worktree: detach origin/main, bez zmian w kodzie gry (patrz ZMIANY/COMMIT).

ZMIANY/COMMIT: brak zmian w kodzie gry. Diagnostyka tymczasowa (instrumentacja _advanceStep w src/battle/battleScene.ts oraz kopia testu tools/zz-dbg-sabr-test.cjs) została cofnięta i usunięta przed raportem; git status czysty poza tym raportem.

ZASADA: liczby poniżej z surowego wyjścia testu live (SABR_ONLY=b, AUTO, Chromium headless, seed 1, MINI: k=6, wallHp=6, cap=150, speedIdx=5).

TESTY (surowe wyniki, bez SABR_SKIP_KNOWN):
- siege-auto-breach-replay-e2e-live-test.cjs SABR_ONLY=b: BUILD ok 20 s; wynik: 6 ok, 1 fail, 0 defekt, 0 NIE_ZMIERZONO, 0 znany (B4b), exit 1.
  - FAIL: B4 SZTURM po wylomie: onBreachTile=0, wallCol=40, maxAtkQ=57.
  - PASS: B4b (insideAtk>0 w tym przebiegu), B0, B1, B2, B3, B5.
  - RUN: auto, winner remis, round 150 (sufit testu), breached true, ev 222, inside 2, onBreachTile 0.
- Pozostałe bramki (battle-skip-equals-auto-resolve-test, battle-skip-siege-parity, siege-parity, mutacja, tsc, 5 bramek referencyjnych): NIE_ZMIERZONO (nie uruchamiano, bo nie ma zmiany kodu do weryfikacji; patrz wniosek).

USTALENIA (przyczyna, dowód z instrumentacji):
1. Wylom działa dla piechoty. Po wylomie (pierwsze breached=true w turze 23) atakujący piechurzy przechodzą przez wyłom i wchodzą za mur: zapisy 'enter' z q=40 (kolumna muru) i b=1 w turach 25-26 (np. atk0 (40,75), atk4 (40,80), atk3 (40,79)), potem q=41+ (atk1 (41,73), atk2 od tury 27 dalej, q rosnie w glab muru). Zachowanie zgodne z B4b.
2. Przed wyłomem piechota czeka przy murze zgodnie z regułą (_meleeBlockedByWall; 'noStepKey' przy target def3 na kolumnie 40, tura 11-22). To oczekiwane, nie błąd.
3. Końcowy stan (tura 150, sufit testu): żywi atakujący to 1 piechur (atk2, q=57) i 11 machin Siege (atkS0-S10, hp 250 lub 147). 10 z nich stoi przy q 37-39, r 23-31 i r 127-132, czyli dokładnie to, co raportował Operator w rundzie 1. Machiny to katapulty (pętla w _advanceStep dla isCata: stop-and-fire w najbliższy żywy kafel muru, _attackWallTile w zasięgu, inaczej _advanceToward do (wallCol-1, wiersz)). Nie są to jednostki szturmujące; zatrzymanie w zasięgu jest zamierzone (komentarz FIX 2 w kodzie). Kafle muru w rzędach 18-137 są już wyburzone (wallTileHp), więc stojące machiny nie są przy nienaruszonym murze - są przy wyłomach, które strzelają do pozostałych kafli 0-17 i 138-155.
4. Wniosek dla B4: asercja B4 sprawdza STAN KOŃCOWY (tura 150) i liczy WSZYSTKIE żywe jednostki atakujące, w tym machiny. Piechota, która przeszła przez wyłom, w tym momencie już nie stoi na kaflu wyłomu (zginęła lub poszła dalej). Odrzut B4 nie jest więc defektem gry na piechocie; to wada definicji pomiaru (koniec-stanu + machiny). Zmierzone: w przebiegach 25-26 piechota stała na kaflach wyłomu (c=40, b=1).
5. Wniosek dla B4b: premisa dispatchu ("atakujący zatrzymują się przy murze zamiast wejść ZA mur") NIE jest potwierdzona dla piechoty w tym scenariuszu: piechota wchodzi za mur (q>40). Asercja B4b (insideAtk>0) już PASS w tym przebiegu; obecny exit 1 pochodzi z B4, nie z B4b. Liczba insideAtk=2 w RUN obejmuje też machinę atkS10 (q 42), więc B4b nie mierzy tylko piechoty.

BLOKADY:
- Brak zmiany kodu gry, którą można uzasadnić jako naprawę B4b: przyczyna nie leży w logice wejścia za mur (piechota wchodzi), a zatrzymanie katapult w zasięgu jest zamierzonym zachowaniem.
- Naprawa B4 wymaga zmiany definicji pomiaru w tools/siege-auto-breach-replay-e2e-live-test.cjs (np. pomiar historyczny: "w dowolnej turze żywy PIECHUR stał na kaflu wyłomu" zamiast stanu końcowego, z pominięciem machin). Taka zmiana zmienia znaczenie asercji, a dispatch zabrania ją osłabiać; to decyzja, a nie Operatora.
- Zaostrzenie B4b (próg do ustalenia pomiarem) wymaga ustalenia, co liczymy: piechota vs wszystkie jednostki. Bez tej decyzji próg byłby arbitralny.
- Ewentualny kolejny temat: czy katapulty po wyburzeniu kafli w środku muru mają dalej strzelać do odległych kafli zamiast podejść do wyłomu (zachowanie gry, do oceny przez właściciela, nie naprawiane tutaj).

DECYZJA_WYMAGANA (do właściciela, ABC):
A) Zmienić B4 na pomiar historyczny piechoty (żywy piechur na kaflu wyłomu w dowolnej turze po wyłomie) i zaostrzyć B4b do progu liczby piechurów za murem w turach po wyłomie (próg z pomiaru: obecnie >=1 piechur w tej samej rundzie). Kod gry bez zmian. [rekomendacja Operatora]
B) Traktować katapulty jako część szturmu i wymagać, by podchodziły do wyłomu (zmiana zachowania gry; wpływ na balans i czas bitwy - wymaga decyzji właściciela i pomiaru).
C) Zostawić B4 jak jest i zaakceptować exit 1 jako znany wynik (tylko po decyzji właściciela; nie jest to zgodne z bramką "zielone bez SABR_SKIP_KNOWN").

RUNDY: 2/5 (runda 1 = BLOCK z powodu braku pliku DODATEK, błąd orkiestratora; runda 2 = ten raport)
NASTĘPNY KROK: decyzja właściciela A/B/C. Po decyzji Operator w rundzie 3 wykonuje wybraną opcję (dla A: zmiana tylko tools/siege-auto-breach-replay-e2e-live-test.cjs + pomiar progu).
DEPLOY/PUSH: NIE WYKONANO

EVIDENCJA: surowe wyjścia z tego worktree (nie zapisywane w repo, bo instrumentacja była tymczasowa). Liczby i tury z powyższego zestawienia pochodzą z dbg-auto.json (1026 wpisów, zdarzenia enter/target/step/noStepKey/capStop/compactStop dla atakujących piechurów) i z końcowego zrzutu jednostek (atk 17 wpisów: 5 martwych, 1 piechur, 11 machin; def 4 żywych).
