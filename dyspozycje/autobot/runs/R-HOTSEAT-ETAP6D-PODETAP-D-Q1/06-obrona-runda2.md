STATUS: PASS
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-D-Q1
RUNDA: 2/5

OBRONA:

1. → PRZYJMUJĘ. Zarzut trafny, potwierdzony bezpośrednio z kodu przed poprawką: `ok()` miał
gałąź `else if (mutationExpected) { pass++; ... }` — gdy `mutationExpected=true`, KAŻDA
wartość `cond` (true lub false) prowadziła do `pass++`, więc sekcje mutacyjne były
strukturalnie niezdolne do FAILA. Odtworzyłem eksperyment Evaluatora niezależnie: uruchomiłem
kopię z wywołaniami mutacyjnymi zamienionymi na `REAL_ME` (symulacja "mutacja bez efektu") na
oryginalnym kodzie — wynik 41 PASS, 0 FAIL (identyczny jak z realną mutacją), co potwierdza
tautologię. Naprawa: nowa funkcja `okMutation(cond, msg)` wymaga WPROST `cond === false` —
`cond === true` (mutacja bez efektu) jest zawsze FAIL, bez furtki w żadnym kierunku; `ok()`
wrócił do zwykłej asercji. Dowód po naprawie: ten sam eksperyment "mutacja bez efektu" na
POPRAWIONYM pliku daje teraz **36 PASS, 5 FAIL** (dokładnie 5 asercji mutacyjnych, wszystkie
oznaczone `FAIL (mutacja NIE zmieniła wyniku -- test byłby tautologiczny)`), a niezmieniony
plik z realną mutacją nadal daje **41 PASS, 0 FAIL**. Mechanizm realnie potrafi się
zaczerwienić.

2. → PRZYJMUJĘ. Zarzut trafny: kod (linie z `runBlockA(mainSrc, BROKEN_ME, ...)` /
`runBlockB(mainSrc, BROKEN_ME, ...)`) nie robi żadnego string-replace `ME()`→`0` w
skompilowanym źródle — podmienia tylko mock wolnej zmiennej `ME` (`BROKEN_ME` zamiast
`REAL_ME`) nad TYM SAMYM skompilowanym kodem. Docstring (linie ok. 26-40) przepisany: opisuje
metodę (a) poprawnie jako podmianę mocka, jawnie zaprzecza wcześniejszemu błędnemu opisowi
("To NIE jest string-replace... żadna taka podmiana tekstu nie zachodzi"), i dodaje odniesienie
do naprawy `okMutation` z ZARZUTU 1.

ZMIANY: `gra/tools/hotseat-etap6d-podetap-d-exec-test.cjs` — dodano `okMutation()`, usunięto
zmienną `mutationExpected` i wszystkie jej przełączenia, wszystkie 8 wywołań `ok()` w sekcjach
mutacyjnych (Blok A ×2, Blok B ×3, mutacja na dysku Blok A ×1, Blok B ×1) zmienione na
`okMutation()`, sprostowany docstring (linie ~26-40). `main.ts` NIETKNIĘTY (potwierdzone
`git diff 70db5adf HEAD -- gra/src/main.ts` — puste). Commit w worktree: `a5cbc524` (gałąź
`autobot/R-HOTSEAT-ETAP6D-PODETAP-D-Q1`), 1 plik zmieniony, allowlista rundy zachowana.

TESTY: świeży wynik `node tools/hotseat-etap6d-podetap-d-exec-test.cjs` z katalogu `gra/`:
**41 PASS, 0 FAIL, exit 0**, main.ts przywrócony bajt w bajt (asercje "PRZYWRÓCONY bajt w
bajt" PASS). Dodatkowo: eksperyment potwierdzający realną wykrywalność (kopia z
zneutralizowanymi mutacjami) → **36 PASS, 5 FAIL** — mechanizm mutacyjny faktycznie się
czerwieni, gdy mutacja nie ma efektu.

BLOKADY: brak.

NASTĘPNY KROK: ponowny Evaluator/Final Control dla R-HOTSEAT-ETAP6D-PODETAP-D-Q1, runda 2/5.

DEPLOY/PUSH: NIE WYKONANO.
