STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-DEFER-NOT-CANCEL-WHEN-PREVIOUS-WAR-ACTIVE-Q1
GOAL: Wojna epoki Brązu/Żelaza, gdy trwa wojna poprzedniej epoki, ma być PRZESUNIĘTA (pending pamiętany), nie anulowana.
ZMIANY/COMMIT: brak zmian kodu gry. Dodany test gra/tools/era-war-defer-not-cancel-test.cjs (allowlista) i ten raport. Baza: 5d905da97 (kandydat).
TESTY: era-war-defer-not-cancel-test.cjs: 16 passed, 0 failed (czysta logika: forced-war-bronze, forced-war-common, war-rules-multiwar). tsc, logic-test, forced-war-bronze/iron/multi-turn, era-war-delays, era-war-ignore-treaties: NIE WYKONANO w tej rundzie (brak zmian gra/src). Bieg dymny 120 tur seed 4242: NIE ZMIERZONO (nie uruchomiono runnera). Mutacja w main.ts: NIE ZMIERZONO.
BLOKADY: (1) nie odtworzono utraty wojny Brązu w silniku; (2) bieg dymny nie wykonany.
RUNDY: 2/5 (r1 BLOCK diagnoza statyczna; r2 ta runda)

ODPOWIEDŹ NA ZARZUTY:
1. PRZYJMUJĘ, bez zmiany kodu gry: audyt R1–R5 na 5d905da97 wskazuje, że pending już przeżywa odroczenie. Pending Brązu kasują w produkcji tylko eliminacja (main.ts:39882) i faktyczne wypowiedzenie (main.ts:47026). Odroczenie (main.ts:45405-45413, `isEligibleForBronzeForcedWar` z `isAlreadyAtWarAnyRole`) nie kasuje pending. Poprawka bez odtworzenia byłaby zgadywaniem, więc jej nie wprowadzono.
2. PRZYJMUJĘ: dodano gra/tools/era-war-defer-not-cancel-test.cjs (T1–T6, 16/0). Obejmuje przypadki a–e na poziomie czystych funkcji. Nie obejmuje ownerLoop w main.ts.
3. PRZYJMUJĘ, diagnoza częściowa: mechanizm utraty NIE ZOSTAŁ odtworzony. Kandydat do sprawdzenia w biegu: `isAlreadyAtWarAnyRole` liczy też wojny naturalne (main.ts:45394). Owner z naturalną wojną nie dostaje pending do puli, dopóki wszystkie wojny nie skończą się. Ta reguła pochodzi z decyzji Maciej 2026-08-09 i nie została zmieniona. Zmiana wymaga decyzji właściciela, nie cichej poprawki.
4. PRZYJMUJĘ: bieg dymny NIE ZMIERZONO (nie uruchomiono runnera).
5. NIE DOTYCZY ODRZUCAM: w chwili pierwszego odczytu dysk miał 2.5 GB (df -h /), a w chwili pisania raportu 4.8 GB. Blokada była prawdziwa wtedy, ale na obecnym stanie nie blokuje biegu dymnego.
6. PRZYJMUJĘ: zacommitowany test i raport (commit poniżej).

NASTĘPNY KROK: runda 3 z jednym celem: bieg dymny seed 4242 do 120 tur z logowaniem `[Dyplomacja] R-EPOKA-BRAZU-WYMUSZONA-WOJNA` i `[war-limit]`, aby sprawdzić, czy wojny naturalne lub odmowa limitu (main.ts:25974-25979) wstrzymują pending. Decyzja właściciela, czy wojna naturalna ma wstrzymywać wojnę epoki, jeśli wynik to potwierdzi.
UWAGI-DLA-ORKIESTRATORA: nie wywołano spawn_task, create_session, create_trigger. Usunięto własny symlink gra/node_modules i wygenerowane pliki `.era-war-defer-*` (gitignored) bez innych rm.
DEPLOY/PUSH: NIE WYKONANO
