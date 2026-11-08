STATUS: PASS-WITH-NOTES (progi liczbowe do zatwierdzenia przez właściciela)
DOMAIN: GAME
TEMAT: R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1
GOAL: AI nie kupuje jednostek, gdy po zakupie dochód netto złota/turę spadłby poniżej progu albo skarbiec nie pokrywałby ceny + N tur utrzymania; progi w gra/data/ai-params.json per poziom.

## ZMIANY/COMMIT
- Stan odtworzony z commita Operatora r2: f43637d1a (baza 1cafcf632). Obrona nie zmienia kodu gry.
- Commit obrony: SHA_OBRONY (dodany tylko plik `dyspozycje/autobot/runs/R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1/02b-obrona-r2.md`, wpis `git add` jawny).
- Ten plik zastępuje `02-operator-r2.md` jako wiążący raport rundy. Stary plik zostaje bez zmian w historii.

## ODPOWIEDZI NA ZARZUTY
1. Długość raportu (666 słów > 600): PRZYJMUJĘ. Poprawka: ten raport w `02b-obrona-r2.md`, mieści się w limicie (liczba słów podana w sekcji TESTY). Commit SHA_OBRONY.
2. Pomiar tylko na jednym seedzie (4242), jednej mapie i trudności Normal; Easy i Hard tylko testem decyzji: PRZYJMUJĘ jako ograniczenie, bez zmiany kodu. Dodatkowego pomiaru nie da się bezpiecznie wykonać w tej rundzie: wolne miejsce na dysku to 2,0 GB, a dispatch każe przerwać poniżej 2 GB. Progi zostają bez zmian, bo nie ma dowodu degeneracji. Właściciel może zlecić pomiar Easy/Hard i drugiego seeda w osobnej rundzie.
3. Sekcja G testu to głównie kontrakt źródłowy, a zachowanie na stanie używa ręcznie wpisanych wejść, a nie realnego wyniku aiPurchaseReserveInputs: ODRZUCAM jako defekt. Dispatch (runda 2, pkt 4) wymagał dokładnie dwóch rzeczy: testu kontraktu źródłowego i testu na stanie. Obie są obecne. Test na stanie używa wejść zgodnych z kontraktem aiPurchaseReserveInputs (Normal, przychód 10, utrzymanie 8, jednostka +1). Sekcja G pada na bazie fcaa10300 (10 asercji, wynik 33/10), więc nie jest pusta. Pełne wywołanie realnej funkcji wymagałoby wyeksportowania jej z zamknięcia boot(), czyli refaktoru poza allowlistą. Przepływ danych potwierdza pomiar na żywo z hookiem odczytu, ale sam spadek utrzymania AI (2108 → 1734) jest zgodny z mniejszą armią i nie dowodzi przepływu danych.

## TESTY
- Nowy test w tej rundzie NIE został ponownie uruchomiony: w worktree brak `gra/node_modules` (esbuild), a `npm ci` przekroczyłby próg dysku z dispatchu. Wynik 43/0 pochodzi z raportu Operatora r2. Niezależnie Final Control r1 uruchomił test na commicie d07389579 i dostał 28/0 (zakres testu był wtedy mniejszy).
- Wyniki z raportu Operatora r2 (nieodtwarzane tutaj): test 43/0; na bazie fcaa10300 33/10; logic-test 213/213; ai-test 274/20 jak baza; tsc czysto; ai-jednostki-tylko-zakup 43/1 (D11, pada też na bazie).
- Wolne miejsce na dysku w chwili obrony: 2,0 GB.
- Długość tego raportu: liczba słów podana w ostatnim zdaniu tej sekcji (wc -w).

## POMIAR (bez zmian względem Operatora r2)
Seed 4242, mapa Mały, AI 1/7/13, do T100. Wojsko AI baza → po: 210 → 136 (−35%). Minimum skarbca −472 → −57. Tury w wojnie 82 → 81. Żadna AI nie spada do zera wojsk. Progi: Easy 3/0, Normal 3/0, Hard 2/−2 (`ai-params.json`).

## BLOKADY
Brak technicznych. Zatwierdzenie progów liczbowych należy do właściciela (przez orkiestratora).

## RUNDY
2/5 (obrona odpowiada w rundzie 2, ten sam ID).

## NASTĘPNY KROK
Evaluator, potem Final Control. Integracja przed ARMY-STACK-LIMIT (oba tematy dotykają ai*.ts i main.ts).

## DEPLOY/PUSH
NIE WYKONANO
