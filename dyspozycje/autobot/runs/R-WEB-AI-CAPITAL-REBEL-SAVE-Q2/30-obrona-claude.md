STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CAPITAL-REBEL-SAVE-Q2 (tag CAPREBEL2), obrona rundy 1
GOAL: pomiar skutków buntu stolicy AI przy ≥2 miastach: zapis/wczytanie, odbicie miasta, Mennica/Pałac, skarbiec ≥3 ziarna × 10 tur (bunt vs kontrola), bieg ≥20 tur po buncie. Poziom maksymalny nowej gry. Zero zmian gra/src.
ZMIANY/COMMIT: gra/tools/caprebel2-live.cjs (nowy, tryby sl/odb/men/long), dyspozycje/analizy/AI-BUNT-STOLICY-ZAPIS-ODBICIE-2026-11-27.md (uzupełniony), dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-SAVE-Q2/30-obrona-claude.md (nowy), dane/caprebel2-*.txt (nowe surowe wyjścia runnera). gra/src bez zmian. SHA: patrz pole sha w StructuredOutput.

ODPOWIEDZI NA ZARZUTY:
1. Pozycja 1 (zapis/wczytanie): PRZYJMUJĘ. Wykonano próbę: tryb `sl` (`caprebel2-live.cjs --mode sl --seed 4242`), `__detHarness.snapshotJson/restoreJson`, zapis przed i po buncie, ponowny bunt po wczytaniu. Wynik: stolica, liczba miast i skarbiec zgodne (city16 przed, city17 po; skarbiec 16 po buncie i po ponownym buncie). Digest NIE tożsamy (pre 31837 vs wczytany 38767 znaków); kandydat do diagnozy, nie potwierdzony błąd. Szczegóły: dane/caprebel2-sl-s4242.txt.
2. Pozycja 2 (odbicie, stary wpis stolicy): PRZYJMUJĘ. Próba: `__ledgerRealPathDebug.cession(city16, rebel, AI)` (tryb `odb`) zwrócił false; w konsoli: „Stolicy nie można oddać w pokoju”. Odbicie przez podbój nie ma haka. Opis z kodu dodany do analizy (capitalCityIdForOwner ~40158; wpis jawny ważny tylko przy ownerId === właściciel). Wynik: NIE ZMIERZONO z próbą. Dane: dane/caprebel2-odb-s4242.txt.
3. Pozycja 3 (Mennica/Pałac): PRZYJMUJĘ. Próba: `window.__civTest.adminSetup` (nie `__cityForestTestDebug.adminSetup`, moja pierwsza wersja nazwy była błędna i padła; poprawione i powtórzone) postawił Mennicę i Pałac w city16. Po buncie: Mennica i Pałac w city16 (ownerId −99), nowa stolica city17 bez budynków w turach 2–4. Obserwacja z rundy 1 „palac w nowej stolicy od tury 10” nie była w tej rundzie sprawdzona i opis w analizie został zmieniony na zakres 2–4. Kontrole s4242/s778899 z tury 11 nie były ponownie analizowane (zarzut dotyczy opisu; uznaję za przyjęty).
4. Pozycja 5 (≥20 tur): PRZYJMUJĘ. Próba: bieg podzielony na 4 wywołania (tryb `long`, zapis `snapshotJson` do pliku poza repo, `restoreJson` w kolejnym wywołaniu). Wynik: 21 tur po buncie (tury 2–22), nieSettled 0, pageerror 0, gameOver false. Dane: dane/caprebel2-long-s4242-c1..c4.txt. Ograniczenie: ciągłość między wywołaniami tylko przez restore (patrz zarzut 1).
5. Pozycja 4 częściowa (korupcja): PRZYJMUJĘ jako NIE ZMIERZONO z udokumentowaną próbą. Próba: przeszukanie `gra/src/main.ts` (`grep -i "corrupt\|korupc"`): 3 trafienia, żadne nie jest funkcją ani hakiem testowym; odczyt wymagałby nowego haka w gra/src (zakazane). Skarbiec 3 ziarna × 10 tur bez zmian z rundy 1 (liczby z plików surowych).
6. Bramki logic/ai-test/rebellion-gate/rebellion-news: PRZYJMUJĘ w części. Zmierzone w tej rundzie: tsc --noEmit rc=0; ai-city-rebellion-gate-test.cjs PASS=37 FAIL=0; ai-city-rebellion-news-test.cjs PASS 24/0. logic 213 i ai-test 297/0: NIE ZMIERZONO w tej rundzie (brak skryptu npm w gra/package.json; nie zidentyfikowałem polecenia runnera przed upływem budżetu tej rundy).
7. Kryterium binarne: PRZYJMUJĘ. Każda pozycja 1–5 ma wynik albo NIE ZMIERZONO z próbą (komenda, wynik, ostatnie linie logu/ostrzeżenie gry). Pozycje 1, 2, 3, 5 mają teraz próby i wyniki liczbowe; pozycja 4 zostaje częściowa (korupcja NIE ZMIERZONO, z dowodem braku haka).

WYNIKI (poziom maksymalny; ziarno 4242 dla pozycji 1, 2, 3, 5):
- Pozycja 1: stolica city16 przed / city17 po buncie; wczytanie zapisu przed buncie daje city16; wczytanie zapisu po buncie daje city17; ponowny bunt po wczytaniu = city17, skarbiec 16 (jak pierwszy bieg). Digest nietożsamy (kandydat diagnostyczny).
- Pozycja 2: odbicie przez cession zablokowane regułą gry; powrót stolicy NIE ZMIERZONO.
- Pozycja 3: Mennica i Pałac zostają w zbuntowanym mieście; nowa stolica bez budynków w turach 2–4.
- Pozycja 4: skarbiec z rundy 1 (bez zmian); korupcja NIE ZMIERZONO.
- Pozycja 5: 21 tur po buncie, 0 nieSettled, 0 pageerror, 0 gameOver.

TESTY:
- tsc --noEmit (gra/): rc=0 (surowe wyjście puste).
- ai-city-rebellion-gate-test.cjs: WYNIK: PASS=37 FAIL=0.
- ai-city-rebellion-news-test.cjs: WYNIK: PASS 24/0.
- logic 213, ai-test 297/0: NIE ZMIERZONO w tej rundzie.
- Live: 4 tryby runnera (sl, odb, men, long), wszystkie na ziarnie 4242, maksymalne ustawienia. Surowe pliki w dane/.
- Błędy konsoli: po jednym `console.error: Failed to load resource: net::ERR_FILE_NOT_FOUND` na każde wywołanie (najprawdopodobniej brak main.css w bundlu testowym, nie zidentyfikowano); pageerror 0.

BLOKADY:
- Korupcja AI: brak haka odczytu w gra/src (nie wolno dopisywać).
- Odbicie przez podbój: brak haka; cession zablokowane regułą.
- Digest po wczytaniu nietożsamy: przyczyna nie zbadana.
- logic 213 i ai-test 297/0 w tej rundzie NIE ZMIERZONO.

RUNDY: 2/5 (runda 1: PASS-WITH-NOTES z zarzutami; obrona = runda 2).
NASTĘPNY KROK: orkiestrator decyduje o rundzie 3 lub zamknięciu z NIE ZMIERZONO dla odbicia (podbój) i korupcji. Kandydat do osobnej diagnozy: różnica digestu po wczytaniu (przed/po zapisie) na ziarnie 4242.
UWAGI-DLA-ORKIESTRATORA: (a) capitalCityIdForOwner (gra/src/main.ts ~40158) wraca do najstarszego miasta, gdy jawny wpis wskazuje miasto nienależące do właściciela; przy odbiciu przez podbój stary wpis mógłby ożyć. Do zweryfikowania, gdy powstanie ścieżka podboju w haku; kandydat BŁĄD-GRY tylko po odtworzeniu. (b) Kontrola bez buntu 21 tur nie była wykonana, więc spadki skarbca po t10 nie są przypisane do buntu. (c) Narzędzie gra/tools/caprebel2-live.cjs wymaga bundla Gra-LIVE.html (esbuild, node_modules z gra/).
DEPLOY/PUSH: NIE WYKONANO
