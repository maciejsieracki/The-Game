STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1
GOAL: widok miasta: żetony górnych banerów w jednej linii po obu stronach, boczne panele tuż pod górnym paskiem (odstęp 8-16 px), bez nachodzenia i bez poziomego przewijania; zmiany wyłącznie w układzie, bez logiki gry.
ZMIANY/COMMIT: kod obrony 12fa198fd (poprzedni kandydat 9c85878b2); raport tym commitem. Pliki: gra/src/ui/cityPanel.ts (zoom plakietki miasta), gra/src/ui/cityUxFrame.ts (drugi krok skali: plakietka), gra/tools/city-view-layout-test.cjs (fixture z przyciskami, pomiar skali, test przewijania lewego panelu, zrzuty 4 rozmiarów), dyspozycje/autobot/runs/R-WEB-UI-CITY-VIEW-TOPBAR-ONE-LINE-AND-SIDE-PANELS-UP-Q1/ (4 pary PNG base/after dla 1920x1080, 2000x831, 1366x768, 1280x720; raport). Allowlista zachowana; gra/main.ts nietknięty; WERSJE.md nietknięte.
TESTY:
- node ./node_modules/typescript/bin/tsc --noEmit: exit 0 (kandydat, po poprawce).
- Bramki referencyjne (surowe wyjście): logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail; research-test PASSED 33 / FAILED 0; unit-replace-test WSZYSTKIE TESTY ZIELONE (21/21); combat-test COMBAT TEST 6/6 pass.
- Test układu gra/tools/city-view-layout-test.cjs: kandydat 9c85878b2 z fixture bez przycisków = PASS 112/0 (jak u Evaluatora); kandydat po zarzucie 1, przed poprawką = FAIL 2 (1366x768/big, 1280x720/big: lewy żeton x=-13 px, prawy poza oknem); po poprawce 12fa198fd = PASS=120 FAIL=0; mutant (stan bazy ac3f072dd, --mutant) = PASS=88 FAIL=32 (czerwony na bazie).
- Pomiary (INFO z testu, 12fa198fd): 1920x1080/normal żeton 25,0 px, skala 1, plakietka 1, top paneli 67; 2000x831/normal 25,0 px, skala 1, top 67; 1366x768/normal 16,2 px, skala 0,65, top 62; 1280x720/normal 15,0 px, skala 0,6, top 62; 1920x1080/big 19,0 px, skala 0,76, top 62; 2000x831/big 19,0 px, skala 0,76, top 62; 1366x768/big 11,5 px, skala 0,46, plakietka 0,8, top 53; 1280x720/big 11,0 px, skala 0,44, plakietka 0,7, top 48. Wszystkie tops <= 72 px i <= dół banerów + 16 px.
- Zrzuty: pliki base i after dla 4 rozmiarów mają różne rozmiary i sumy MD5 (2000x831: base c2d807e2..., after 279546a0...). Zrzut after 1366x768 obejrzany: żetony obu banerów w jednej linii, plakietka OLIMPIA z przyciskami w środku, boczne panele zaczynają się tuż pod banerami.
- git diff --check: czysty. git merge-tree --write-tree HEAD origin/main (HEAD 12fa198fd): bez konfliktów (wynik: drzewo 50eaaf4c3, bez listy plików konfliktów). Nie wykonano merge ani rebase.
- Test recruitment-panel-compact-row-test: 32 pass / 7 fail na kandydacie ORAZ na bazie ac3f072dd (zweryfikowane podmianą dwóch plików na wersję bazową i przywróceniem). Dług przedrzędowy, nie regresja tego tematu.
- city-ro-loop-boot-error-test: WYNIK (KOD) PASS=1 FAIL=0. siege-badge-zorder-test: PASS=13 FAIL=0.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
Zarzut 1 (fixture bez przycisków, dwa kryteria czerwone przy 6-7 cyfrach): PRZYJMUJĘ. Fixture dodaje getCapitalCityId (inny id, więc pojawia się „Ustaw jako stolicę”), onSetCapital, isMe, getCityAdministratorState (hired:false, więc „Administrator +”). Reprodukcja: FAIL 1366x768/big i 1280x720/big z x=-13 px (lewy żeton), czyli dokładnie jak u Evaluatora. Poprawka: CSS plakietki miasta dostał zoom:var(--civ-top-city-scale,1); cityUxFrame.ts po wyczerpaniu kroków żetonów (aż do 0,44) zmniejsza plakietkę (1, 0,9, 0,8, 0,7) i ponownie przechodzi kroki żetonów. Po poprawce: 120/0. Dowód: pomiary INFO powyżej.
Zarzut 2 (min skala 0,44 = ~11 px, nieczytelne): PRZYJMUJĘ POMIAR, ODRZUCAM ZMIANĘ PROGU. Zmierzone: normal 15-16 px; big 11-11,5 px (1366 i 1280). Podniesienie minimum bez zmiany układu oznaczałoby łamanie linii lub wyjście poza okno, czyli łamanie GOAL (1). Próg czytelności to decyzja produktowa, więc nie zmieniam jej sam: DECYZJA DLA WŁAŚCICIELA (patrz BLOKADY).
Zarzut 3 (brak Produkcji, kolejki, railu; przewijanie wewnętrzne): CZĘŚCIOWO PRZYJMUJĘ. Dodano kryterium computed overflow-y:auto dla .civ-ux-left (CSS już istniał: cityUxFrame.ts linia 87). Fixture z długą Produkcją NIE dodany: NIE_ZMIERZONO. Prawy panel ma overflow:hidden (cityUxFrame.ts linia 121), a przewijanie jego treści nie było sprawdzone.
Zarzut 4 (twardy próg SIDE_TOP_MAX_PX=72 zależny od jednej linii): ODRZUCAM z dowodem. Test ma teraz fixture z przyciskami, a pomiar daje top paneli 48-67 px i dół plakietki 53,6 px (1366 normal), więc 72 px ma zapas. Przy wyższej plakietce test się zaczerwieni, co jest zamierzonym strażnikiem.
Zarzut 5 (zrzuty base/after identyczne rozmiarem; brak 1920x1080 i 1280x720): PRZYJMUJĘ. Zrzuty generuje sam test (--shots) dla 4 rozmiarów, base z --mutant. Poprzednie pary 2000x831 nie były odtwarzalne testem, teraz są.
Zarzut 6 (cap TOP_STACK_MAX_PX 1480 -> 1880 zmienia też 1920): PRZYJMUJĘ JAKO UWAGĘ. Zmiana jest celowa (wolne miejsce na żetony). Na 1920 wszystkie kryteria PASS, ale ocena wizualna paska przy 1920 jest NIE_ZMIERZONO poza zrzutem 1920x1080 (plik istnieje, nie oceniany ręcznie).
Zarzut 7 (konflikt z nowszym main, origin/main = 3a6b0e405): SPRAWDZONE, BEZ KONFLIKTU. git merge-tree --write-tree HEAD origin/main dla 12fa198fd zwrócił drzewo bez listy konfliktów. Nie scalano (to rola integracji).

NIE_ZMIERZONO:
- Czytelność na żywo przy realnych wartościach 6-7 cyfr w grze (tylko fixture).
- Przewijanie prawego panelu „BUDYNKI W MIEŚCIE” przy długiej treści.
- Panel Produkcja, kolejka budowy i rekrutacji w teście (fixture ich nie ma; tylko CSS).
- Wizualna ocena zrzutu 1920x1080 i 1280x720 poza zrzutem 1366x768 (pliki są, nie oceniane).

BLOKADY:
- DECYZJA DLA WŁAŚCICIELA (pytanie ABC, nie rozstrzygam sam): minimalna czytelność żetonów. Przy 6-7-cyfrowych wartościach w oknach 1280-1366 px żetony spadają do 11-11,5 px i plakietka miasta do 0,7-0,8. Opcje: A) obecnie (żetony do 0,44, plakietka do 0,7); B) próg minimalny np. 13 px z większą plakietką poza oknem — wymaga akceptacji układu; C) przy skrajnych wartościach skracanie liczb (np. 1,2 mln) — zmiana tekstu, poza zakresem tego tematu.
- Brak. Kod gotowy do FC; ponowne uruchomienie testu wymagane po ewentualnej decyzji A/B/C.

RUNDY: 1/5 obrony (runda operatora 1; obrona bez powrotu do Operatora).
NASTĘPNY KROK: Evaluator (ponowna weryfikacja 12fa198fd, w tym zarzut 2 jako decyzja) -> Final Control SONNET -> integracja orkiestratora po FC PASS. Przed merge: sprawdzić git merge-base --is-ancestor 12fa198fd <SHA integracji>.
UWAGI-DLA-ORKIESTRATORA:
- gra/node_modules jest dowiązaniem symbolicznym do ../wf_bb92b715-45c-1/gra/node_modules (gitignored). Nie kopiowano (dysk wolny ok. 2,1 GB). Nie usuwać tego dowiązania przy sprzątaniu tej worktree — tylko sam symlink.
- Test robi zrzuty do katalogu runs; w pliku 00-dispatch nazwa shots-after-*.png, faktyczne nazwy to city-view-after-*.png i city-view-base-*.png (zgodne z testem).
- W gra/tools/city-view-layout-test.cjs użyto os.tmpdir() (jak wcześniej) — bez zmian.
- Nowe CSS zoom na plakietce miasta: wspierany w Chromium i Firefox (nowsze wersje); trzeba wziąć pod uwagę przy ocenie innych przeglądarek.
DEPLOY/PUSH: NIE WYKONANO
