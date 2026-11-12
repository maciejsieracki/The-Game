STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1
GOAL: armia mieszana (piechota, strzelcy, machiny, konnica) idzie tempem najwolniejszej jednostki rangi do pierwszego wzwarcia wręcz; po wzwarciu konnica poza regułą tempa, strzelcy trzymają dystans.
ZMIANY/COMMIT: obrona od bazy kandydata 8fa68d5cc (baza 81e357dee).
- Poprawka (zarzut 4, PRZYJĘTY): 2d352358d — gra/src/battle/battleScene.ts, warunek pierwszego wzwarcia (meleeContact) obejmuje także konnicę; usunięty warunek `!u.mounted` w filtrze roster.some. Konnica sama dalej poza regułą tempa (warunek w _lineAdvanceCap bez zmian).
- Raport: ten plik (commit podany w polu sha).
- Allowlista: zgodna (gra/src/battle/battleScene.ts, dyspozycje/autobot/runs/R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1/**). Nie zmieniano WERSJE.md, JSON balansu ani rust-port.
- Uwaga procesowa: testy battle-large-mixed-doctrine-matrix zmieniły plik dyspozycje/autobot/runs/R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json; przywrócony git checkout przed commitem, nie jest w diffie.

ODPOWIEDZI NA ZARZUTY EVALUATORA (f836918 / report_sha f83691853):

1. Kryterium (3): strzelcy po wzwarciu nie utrzymują dystansu >= 2. — PRZYJMUJĘ W CZĘŚCI, ODRZUCAM W CZĘŚCI.
   - Odrzucam twierdzenie, że mechanizm nie istnieje: pre-existing RANGED KITE w battleScene.ts (blok "STRICT DETERMINISTIC RANGED PRIORITY", ok. linii 6683-6712; stała MELEE_SAFE_GAP, Manhattan <= 2) cofa strzelca o jedno pole, gdy wróg wręcz jest w odległości <= 2, a rangedKite !== false (domyślnie true). Ta reguła działa po wzwarciu, bo poprawka zdejmuje sufit tylko z fazy podejścia.
   - Przyjmuję brak dowodu: nie dopisałem testu kryterium (3) dla armii mieszanej i nie zmierzyłem dystansu po wzwarciu. Status tego kryterium: NIE_ZMIERZONO (test wymagany w osobnym temacie lub kolejnej rundzie).

2. Dowód mutacyjny i pomiar obejmują tylko machiny; strzelcy mają spread 0 także na bazie. — PRZYJMUJĘ.
   - Potwierdzam: test strzelców nie odróżnia bazy od poprawki (spread 0 w obu). Test machin odróżnia (baza: machiny spread 2 w krokach 4..12; poprawka: 0-1). Test pozostaje słabszy dla strzelców niż opisano w raporcie operatora. Nie dopisuję nowego scenariusza w tej rundzie (wymagałby projektu scenariusza z opóźnionymi strzelcami); to zostaje jako NOTE.

3. Progi TOL=2 i TOL_RANK1=1 bez zapytania ABC; TOL_RANK1=1 równe wynikowi machin. — PRZYJMUJĘ, ZGŁASZAM DECISION_REQUIRED.
   - Progi zostały wyznaczone pomiarem bez akceptacji właściciela. Nie zatwierdzam ich w imieniu właściciela. Wpisuję jako DECISION_REQUIRED (patrz BLOKADY). Zero zapasu dla machin (1 <= 1) jest zmierzonym faktem, nie gwarancją.

4. Interpretacja "pierwszego wzwarcia": meleeContact liczony bez konnicy i bez grup bez piechoty. — PRZYJMUJĘ (poprawka 2d352358d).
   - GOAL dispatchu mówi o "pierwszym wzwarciu jednostek walki wręcz". Konnica jest jednostką walki wręcz, więc jej kontakt musi zdejmować sufit strzelcom i machinom. Usunięto wykluczenie konnicy z filtra meleeContact.
   - Przypadek "grupa bez żadnej jednostki wręcz (tylko strzelcy i machiny)": nie obsłużony osobnym warunkiem. Sufit w takiej grupie zdejmuje dopiero mechanizm stall z W19 (LINE_ADVANCE_STALL_ROUNDS). Nie testowane w tej rundzie: NIE_ZMIERZONO. Założenie: taka grupa nie ma kontaktu wręcz z definicji, więc sufit obowiązuje do stall.

5. Parytet AUTO=SKIP (battle-skip-equals-auto-resolve) TIMEOUT. — PRZYJMUJĘ, NIE_ZMIERZONO w tym środowisku.
   - Ponowiłem test po poprawce 2d352358d: wyjście z exit 124 po 9m36s (timeout 575 s). Części A (formatowanie), C (kontrakt skip), D (skip w trybie ręcznym, brak duplikatu aktywacji) przeszły: 10 PASS z A/C i 4 z D (D0-D3 wszystkie PASS w wyjściu). Część B (AUTO vs SKIP, seedy, B1/B5) nie zakończyła się w limicie. Brak dowodu parytetu i brak dowodu regresji.
   - Test jest przeglądarkowy (Chromium, WSKIP_CHROMIUM=/usr/bin/chromium); nie da się go puścić w tle zgodnie z zasadą procesu.

POMIAR (surowe, bez zmiany wyniku po poprawce):
- tsc --noEmit: exit 0
- battle-mixed-army-advance-pace-test.cjs (po poprawce 2d352358d): PASS approach: melee rank spread 0 <= 2; PASS archers spread 0 <= 1; PASS machines spread 1 <= 1; PASS archers advance (min q 25 > start 2). Wyjście: exit 0.
- Mutacja na bazie 81e357dee: NIE_ZMIERZONO ponownie w tej rundzie (próba zapisania pliku bazowego zablokowana przez ograniczenie git w worktree). Wynik Evaluatora (exit 1 dla machin) nie został tu powtórzony.
- battle-line-advance-uniform-test.cjs (W19): exit 0
- battle-cavalry-flank-default-test.cjs: exit 0 (15 s)
- battle-large-mixed-doctrine-matrix-test.cjs: exit 0 (37 s)
- battle-ranged-mounted-doctrine-test.cjs: exit 0 (10 PASS, 0 FAIL)
- battle-formation-rules-test.cjs: exit 0
- battle-standoff-two-warriors-test.cjs: exit 0 (9 PASS, 0 FAIL)
- battle-skip-equals-auto-resolve-test.cjs: exit 124 (timeout 575 s), części A/C/D PASS, część B nie zakończona (NIE_ZMIERZONO)

TESTY:
- Wyżej. Bramki referencyjne (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) nie były ponownie uruchamiane po poprawce 2d352358d: NIE_ZMIERZONO w tej rundzie. Zmiana dotyczy wyłącznie sufitu tempa w bitwie (battleScene), więc wpływ na te moduły jest mało prawdopodobny, ale to nie jest dowód.
- Część bitew headless uruchomiona po poprawce: patrz lista powyżej.

BLOKADY:
- DECISION_REQUIRED (ABC właściciela): progi TOL=2 (piechota) i TOL_RANK1=1 (strzelcy/machiny). Wartości wyznaczone pomiarem, zero zapasu dla machin. Pytanie: czy akceptować, czy poluzować do 2 i czego wymaga właściciel.
- NIE_ZMIERZONO: kryterium (3), dystans strzelców >= 2 po wzwarciu (test nie istnieje; mechanizm kite istnieje w kodzie).
- NIE_ZMIERZONO: część B testu battle-skip-equals-auto-resolve (timeout w tym środowisku).
- NIE_ZMIERZONO: przypadek grupy bez jednostek wręcz (sufit do stall).
- NIE_ZMIERZONO: zrzut przed/po z Chromium; bramki referencyjne po poprawce.
- Słaby test strzelców (spread 0 także na bazie): NOTE, do poprawy osobnym scenariuszem.

RUNDY: 2/5 (Operator r1 + obrona r2 po zarzutach Evaluatora f836918)
NASTĘPNY KROK: Evaluator (Sonnet) ma ponownie ocenić diff 2d352358d (jedna linia warunku mounted w meleeContact + komentarz). Przed FC: decyzja ABC o progach TOL/TOL_RANK1 oraz decyzja, czy kryterium (3) dostaje osobny test (dystans strzelca po wzwarciu) w tym temacie, czy w osobnym. Część B parytetu AUTO=SKIP wymaga uruchomienia poza limitem 590 s albo w środowisku z dłuższym czasem.
DEPLOY/PUSH: NIE WYKONANO
