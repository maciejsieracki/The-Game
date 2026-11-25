STATUS: BLOCK
DOMAIN: GAME (pomiar)
TEMAT: R-WEB-MEASURE-WAR-DURATION-END-REASON-Q1
GOAL: zmierzyć w pełnej grze (realny bundle, headless Chromium, seed 4242 i 7, do t120), ile trwają wojny, czym się kończą i ile dobiega do pokoju wymuszonego (100%).
ZMIANY/COMMIT: nowy gra/tools/war-duration-measure.cjs (runner = kopia ai-war-weariness-live-audit-measure.cjs + dosypka NNS gracza przed endTurn). Zero zmian w gra/src i gra/data. Patch instrumentacji (__wwDump) zastosowany tylko w kopii poza repo (nie commitowany).
TESTY:
- tsc --noEmit: exit 0.
- logic 213 i ai-test 297/0: NIE ZMIERZONO (nie uruchamiano w tej rundzie; repo gry bez zmian w gra/src).
- Smoke runner: seed 4242, 5 tur, DONE, gateBypass=1 (bramka NNS w turze 1 odblokowana dosypką 300 zł / 300 żywności), errors=[]; start świata ok. ~90 s; czas tury ok. 34,5 s (lastMs); 0 wojen w tych 5 turach.
- Pomiar 120 tur × seed 4242 i seed 7: NIE ZMIERZONO (patrz BLOKADY).
BLOKADY:
1. Czas: ok. 35 s na turę + ok. 90 s start = ok. 75 min na jedno 120-turowe ziarno, czyli ok. 2,5 h na dwa ziarna. Runner nie jest wznawialny (brak slotu/--stop-at jak w diplomacy-harder-measure-run.cjs), a polecenie Bash ma limit 590 s i nie wolno używać run_in_background. Bez wznawiania pomiar nie domknie się w jednej rundzie.
2. Wymagana decyzja orkiestratora: osobny temat na runner wznawialny (wzór z diplomacy-harder-measure-run.cjs, --stop-at) albo akceptacja krótszego zakresu.
3. Bramka NNS w turze 1 blokuje „Zakończ turę” bez dosypki (pozycja #99 w KOLEJKA-WEB); runner obchodzi ją tylko w kopii pomiarowej, nie w grze.
RUNDY: 1/5 (wynik BLOCK z powodu czasu pomiaru, nie z powodu błędu gry).
NASTĘPNY KROK: osobny temat R-WEB-MEASURE-WAR-DURATION-RESUMABLE-Q1 (runner wznawialny, 120 tur × 2 ziarna, analiza w tym samym dokumencie); albo decyzja właściciela o zakresie.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedź na pytanie właściciela („Przegrane przeciwnika, zajęte miasta, czy to też ma wpływ?”) — z odczytu kodu, NIE z pomiaru w grze

Źródła (kod, origin/main b610e71a6):
- gra/src/game/war-weariness.ts:88 — poziom = clamp(turyWojny/40 + 0,1 × lostCitiesTotal, 0, 1). Jedyne wejścia licznika: tury wojny i liczba miast, które zmieniły właściciela. Straty bitewne NIE wchodzą do licznika.
- gra/src/game/war-weariness.ts:234 — desperacja przegrywającego: wagaZmeczenia×poziom + wagaSily×słabość + wagaStrat×min(1, lostCities/stratyNasycenie). Składnik „straty” to lostCities (miasta utracone), NIE straty bitewne. Rozbieżność z opisem dispatchu („straty/3”) — patrz DECISION_REQUIRED.
- gra/src/game/ai.ts:7342 i 7393 — lostCitiesTotal = lostCitiesInWar + zdobyteMiastaPartnera (miasta zabrane w obie strony liczą się do licznika).
- gra/src/game/diplomacy-proposals.ts:901, 1845, 1880 — do desperacji/oferty podawane jest lostCitiesResponder.

Wniosek:
1. Zajęte miasta: TAK. Każde miasto, które zmieniło właściciela (w obu kierunkach), dodaje 10 pkt proc. zmęczenia = 4 tury wojny. Przy N zmienionych miastach pokój wymuszony (100%) następuje około tury 40 − 4N (N=2 → ok. t32, N=5 → ok. t20, N≥10 → od razu). Miasta utracone przez przegrywającego podnoszą też jego desperację (0,3 × min(1, utracone/3)) i wpływają na progi ochrony (≤3 miasta, ≥3 utraty).
2. Pokonani przeciwnicy (straty bitewne, zabite jednostki): NIE wchodzą do licznika zmęczenia i (wg linii 234) NIE wchodzą do desperacji. Wojna z dużymi stratami bez utraty miast trwa do 40 tur (100% po czasie).
3. Zgodnie ze zgłoszeniem „wojna kończy się szybciej niż 40 tur”: skracają ją miasta, nie bitwy.

Zastrzeżenie: powyższe to odczyt kodu, NIE ZMIERZONO w grze.

## DECISION_REQUIRED (jedno zdanie na wariant)
- Wariant A (obecny kod): straty bitewne nie wpływają na zmęczenie ani na desperację; liczą się tylko miasta.
- Wariant B (opis dispatchu): straty bitewne mają wchodzić do desperacji (wagaStrat × straty/3) — wymaga decyzji właściciela, nie kodowane.
- Wariant C: czy miasta zmienione w OBU kierunkach mają przyspieszać pokój wymuszony (obecnie tak), czy tylko miasta utracone przez stronę przegrywającą.

## Dane / SHA256
Brak danych jsonl z pełnego biegu (blokada 1). Smoke-run 5 tur nie jest archiwizowany w repo.
