STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CAPITAL-REBEL-SAVE-Q2 (CAPREBEL2), Final Control po rundzie 2 (obrona)
GOAL: pomiar skutków buntu stolicy AI (zapis/wczytanie, odbicie, Mennica/Pałac, skarbiec >=3 ziarna x 10 tur, bieg >=20 tur), poziom maksymalny, zero zmian gra/src.
ZMIANY/COMMIT: kandydat d684ab63d7bde99507619dd698ed1b57966c7f14, baza b7830f1dea2e51dcadc70f22b86a31a6e2bd32fe. `git merge-base b7830f1dea d684ab63d7` = b7830f1dea2e (baza jest przodkiem kandydata). `git diff --stat` baza..kandydat: 17 plików, +385, wyłącznie: gra/tools/caprebel2-live.cjs (nowy), dyspozycje/analizy/AI-BUNT-STOLICY-ZAPIS-ODBICIE-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-AI-CAPITAL-REBEL-SAVE-Q2/** (10-operator, 30-obrona, 13 plików dane/*.txt). gra/src i gra/data bez zmian (brak trafień w diffie). Allowlista zachowana.
TESTY (własne, na d684ab63d, surowe wyjście):
- tsc --noEmit: rc=0, wyjście puste.
- logic-test: LOGIC OK (213/213).
- tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6.
- ai-test: 297 passed, 0 failed.
- ai-city-rebellion-gate-test: PASS=37 FAIL=0.
- ai-city-rebellion-news-test: PASS 24/0.
- Kontrola danych: liczby skarbca w tabeli dokumentu zgadzają się z dane/capital-bunt-s4242-10t.txt (16,17,18,19,22,9,2,8,15,22); wiersze sl/odb/men/long zawierają deklarowane pola (capitalNow, mennicaAnyCities, digest, errors). Pomiarów live NIE powtarzałem (poziom maksymalny jak w rundzie 1; ziarno 4242).
OCENA ZARZUTÓW (po treści):
1 (zapis/wczytanie): obrona usunęła. Próba wykonana (tryb sl), wyniki liczbowe; stolica, liczba miast, skarbiec zgodne przed/po. Digest nietożsamy (31837 vs 38767 znaków) zostaje jako otwarte pytanie techniczne, nie potwierdzony błąd. Zarzut ODDALONY po naprawie.
2 (odbicie): obrona usunęła w zakresie wymaganym kryterium binarnym: próba (cession, false, ostrzeżenie "Stolicy nie można oddać w pokoju", dane/caprebel2-odb-s4242.txt) plus opis z kodu (capitalCityIdForOwner). Podbój bez haka = NIE ZMIERZONO z próbą. Zarzut ODDALONY; pozycja pozostaje NIE ZMIERZONO (nota).
3 (Mennica/Pałac): obrona usunęła. adminSetup użyty, wynik zmierzony (budynki zostają w zbuntowanym city16, nowa stolica bez budynków w t2-4). Nieścisły opis z rundy 1 skorygowany. ODDALONY.
4 (bieg >=20 tur): obrona usunęła, 21 tur w 4 wywołaniach, 0 pageerror, 0 nieSettled, 0 gameOver. Ograniczenie: ciągłość między wywołaniami przez restore (zob. digest). ODDALONY.
5 (korupcja): NIE ZMIERZONO z udokumentowaną próbą (brak haka odczytu w gra/src; zmiana zakazana). Spełnia kryterium binarne. ODDALONY.
6 (bramki): niekompletność raportu operatora; w tej rundzie wszystkie bramki zmierzone przeze mnie zielone (patrz TESTY). Skutek zerowy. ODDALONY.
7 (kryterium binarne): pozycje 1-5 mają wynik liczbowy albo NIE ZMIERZONO z próbą (komenda, wynik). Spełnione.
Nikt nie uzasadnił FAIL: brak zmian gra/src, brak osłabionych asercji, bramki zielone, dane zgodne z dokumentem.
BLOKADY: brak blokujących. NIE ZMIERZONO (z próbą): powrót stolicy po odbiciu przez podbój (brak haka podboju); korupcja AI (brak haka); kontrola bez buntu dla 21 tur.
RUNDY: 3/5 (FC po rundach 1 i 2; werdykt końcowy)
NASTĘPNY KROK: integracja orkiestratora (tylko dokumenty i narzędzie gra/tools, bez deployu, bo gra/src bez zmian).
UWAGI-DLA-ORKIESTRATORA:
(a) Kandydat do osobnej diagnozy: digest po restoreJson różni się od digestu sprzed zapisu (ziarno 4242, ~7 tys. znaków, także bez podzialPracy); nie potwierdzony błąd, możliwa różnica reprezentacji; wcześniejszy wpis w rejestrze mówił o round-trip tożsamym dla fortów, więc warto sprawdzić, które pola nie wracają.
(b) Po jednym console.error ERR_FILE_NOT_FOUND na wywołanie (najpewniej brak main.css w bundlu testowym; nie zidentyfikowano).
(c) Odbicie przez podbój: stary jawny wpis stolicy mógłby ożyć (capitalCityIdForOwner ~main.ts 40158); do zmierzenia po dodaniu haka podboju; kandydat BŁĄD-GRY dopiero po odtworzeniu.
(d) Jednoziarnowość pozycji 1-3 i 5 (ziarno 4242); skarbiec 3 ziarna, różnice bunt-kontrola zmieniają znak, bez wniosków o balansie.
(e) Środowisko: worktree nie miał node_modules; użyto dowiązania do node_modules z innego worktree (tylko do odczytu, niezacommitowane).
DEPLOY/PUSH: NIE WYKONANO
