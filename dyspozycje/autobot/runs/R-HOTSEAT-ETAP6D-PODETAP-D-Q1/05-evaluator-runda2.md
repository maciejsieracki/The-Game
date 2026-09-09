STATUS: FAIL
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-D-Q1
RUNDA: 2/5

ZARZUTY:

1. [KRYTYCZNY] `gra/tools/hotseat-etap6d-podetap-d-exec-test.cjs:51-55` — funkcja `ok()` czyni
asercje w SEKCJACH MUTACYJNYCH STRUKTURALNIE NIEZDOLNYMI DO FAILA, niezależnie od tego, czy
mutacja faktycznie coś zmieniła. Logika: `if(cond){pass++} else if(mutationExpected){pass++}
else {fail++}`. Gdy `mutationExpected=true` (linie 213,225,323,335,363,367,378,382), KAŻDA
wartość `cond` (prawda lub fałsz) prowadzi do `pass++` — jedyna droga do faila wymaga
`mutationExpected===false`. Dowód eksperymentalny (mój, niezależny): podmieniłem w kopii
pliku `BROKEN_ME`→`REAL_ME` w obu wywołaniach mutacyjnych (symulacja mutacji BEZ efektu —
dokładnie scenariusz, który ta bramka ma wykrywać), uruchomiłem — wynik: **41 PASS, 0 FAIL,
exit 0**, identyczny jak oryginał, mimo że printy jawnie pokazują `otrzymano ["7"]` przy
komunikacie „POWINIEN być 0". To oznacza, że automatyczny werdykt PASS/FAIL tej bramki jest
fikcyjny właśnie dla asercji mających dowodzić nietautologiczności migracji — dokładnie ten
sam poziom ryzyka co Podetap E (fałszywa weryfikacja) i Podetap B (zaślepiona bramka), tylko
inny mechanizm: nie regex, nie agregacja, lecz odwracalny/niemożliwy-do-obalenia predykat.
Gdyby w przyszłości ekstraktor, mock albo sama migracja uległy cichej regresji, ta bramka
nadal zgłosiłaby zielono. Wymaga naprawy `ok()` (np. osobna funkcja `okMutation(cond,...)`
sprawdzająca WPROST `cond===false` jako sukces, bez furtki na `cond===true`).

2. [DROBNY] Docstring pliku (linie 29-31) twierdzi, że mutacja (a) to „string-replace `ME()`
-> `0` w skompilowanym źródle bloku" — nieprawda: kod (linie 220,328) nie robi żadnego
string-replace na skompilowanym źródle, tylko podmienia mock funkcji wolnej zmiennej `ME`
(`BROKEN_ME` zamiast `REAL_ME`) i uruchamia TEN SAM skompilowany kod. Metoda jest merytorycznie
sensowna (nawet trafniej testuje, że blok faktycznie woła `ME()`), ale opis w komentarzu jest
nieścisły — dokładnie klasa błędu, na który C-031 i historia tego podetapu (fałszywy docstring
rundy 1) każą zwracać uwagę.

DOWÓD WŁASNEJ WERYFIKACJI: (a) eksperyment podważający `ok()` opisany wyżej (kopia pliku,
node, 41/0 mimo zerowego efektu mutacji); (b) własna, niezależna mutacja NA DYSKU w dwóch
miejscach INNYCH niż użyte przez exec-test.cjs (main.ts:31278 `setDiploRelation(csOwnerId,
ME(),newRel)` dla Bloku A, main.ts:31870 `setDiploRelation(ME(),ownerId,relWithRespekt)` dla
Bloku B), przez ten sam ekstraktor kotwica+brace-matching, własny prosty harness bez `ok()` —
potwierdzone realnie RÓŻNE wyjścia (7→0 dla obu), main.ts przywrócony bajt w bajt (git diff
puste); (c) zweryfikowałem punkty 1,2,3,6,7 zadania (kotwice unikalne ×1, granice linii
zgodne, esbuild+new Function nie regex, main.ts niezmieniony w rundzie, 5 bramek referencyjnych
zielone: 213/19/33/13/6, tsc czysty).

NASTĘPNY KROK: Zarzuty wracają do Operatora (ten sam wykonawca) — napraw `ok()`/mechanizm
mutacyjny tak, by realnie mógł zgłosić FAIL przy braku efektu mutacji, i skoryguj opis metody
(a) w docstringu; dopiero potem ponowny Evaluator/Final Control.
