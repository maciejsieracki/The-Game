STATUS: DECISION_REQUIRED (bez zmian kodu w tej rundzie; kod = baza kandydata + merge czubka main; zarzuty rozstrzygniete ponizej; brak ABC A1/A2/B/C blokuje dalsza implementacje)
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-WIRING-E2E-Q1
GOAL: dowod w zywej grze (Chromium, realny endTurn): propozycja AI -> okno gracza -> "Przyjmij" AKTYWNE -> umowa -> tick dostaw; (runda 2, ABC wariant A: gorny limit nadplaty AI) -- osiagalne dopiero po decyzji ABC A1 (bramki AI i gracza sa rozlaczne)
ZMIANY/COMMIT: start 32ac76bdf9fc53e6b8be54b1a732176eb11d5c84 + merge origin/main (1a42785d4, FALA 649+) = merge-commit 7fc7b62cb, BEZ konfliktow (zarzut 6). `git diff --stat 32ac76bdf 7fc7b62cb -- gra/src`: 11 plikow, +214/-36 -- wylacznie zmiany z main, zero wlasnych zmian kodu. Allowlista tej obrony: ten raport + evidence/{r2-obrona-siatka-bramek.json, r2-obrona-siatka-bramek.cjs.txt, run-obrona-r2-merged-tip.log, result-obrona-r2.json}. Raport r1 NIE jest nadpisany: ponizej, w sekcji "RAPORT OBRONY R1 (zachowany)" (zarzut 8). SHA koncowy = commit tego raportu (pole sha wyniku). Nie pushowano.

Liczby ponizej pochodza z surowego wyjscia uruchomien w tej sesji na scalonym czubku (7fc7b62cb); NIE_ZMIERZONO tam, gdzie oznaczone.

ODPOWIEDZI NA ZARZUTY EVALUATORA (r2)

ZARZUT 1 (kryterium 1: brak testu live z aktywnym "Przyjmij" bez forceAccept; brak tabeli tura->zasoby po przyjeciu przyciskiem UI) -- ODRZUCAM jako zarzut wobec wykonania, PRZYJMUJE jako stan faktyczny (niespelnione, uzasadnione).
 Dowod niewykonalnosci: patrz zarzut 2/7 (siatka). Dla Relacji 50 i 80 (ta, w ktorej dziala test live: relTotal z diagPayload) nie istnieje zadna oferta spelniajaca jednoczesnie bramke AI i podglad gracza (both=0 dla 6 par). Aktywne "Przyjmij" jest wiec nieosiagalne bez zmiany reguly (A1 albo A2). Dispatch r2 zakazuje zmiany podgladu gracza, a zmiana bramki AI (wspolczynnik relacji = 1 dla AI-proponenta w trzech miejscach main.ts/diplomacy-proposals.ts) to zmiana reguly diplomacji/balansu -- poza mandatem (ABC). Nie implementuje na zapas: probna implementacja z r2 operatora byla juz mierzona i dawala PUSTY stol (selekcja null), wiec bylaby martwa. Dowod tego, co dziala dzis: live test na scalonym czubku 42 pass / 0 fail (evidence/run-obrona-r2-merged-tip.log); akceptacja nadal idzie hakiem forceAccept (jak w r1), tick dostaw i zapis/wczytanie dzialaja.
 Czego NIE dostarczam: tabeli tura->zasoby po przyjeciu przyciskiem UI -- NIE_ZMIERZONO (przycisk zablokowany).

ZARZUT 2 (brak tabeli proporcji ofert w repo; pomiar tylko deklaracja) -- PRZYJMUJE, naprawione.
 Poprawka: pomiar zapisany jako artefakt w repo: evidence/r2-obrona-siatka-bramek.json (surowe wyniki) + evidence/r2-obrona-siatka-bramek.cjs.txt (skrypt; wola funkcje PRODUKCYJNE: resolveProposalPn, handelFairnessGate z mnozikiem 1, previewIncomingPlayerAccept; bundle esbuild z gra/src). Siatka: giveQty 10..300 x recvQty 10..600 (krok 10) = 1800 ofert na pare, 6 par, Relacja 50/80/100/130, difficulty normal, tempo standardowa, per_turn, 10 tur. Surowe wyniki (AI = liczba ofert przechodzacych bramke AI; gracz = przechodzacych podglad gracza; both = przechodzacych OBA):
  Rel 50 : zelazo/cegla AI 930 gracz 435 both 0 | drewno/kamien 65/1665/0 | cegla/zelazo 45/1702/0 | kamien/drewno 690/590/0 | zelazo/kamien 1284/246/0 | drewno/cegla 33/1725/0
  Rel 80 : zelazo/cegla 1260/435/0 | drewno/kamien 110/1665/0 | cegla/zelazo 81/1702/0 | kamien/drewno 1070/590/0 | zelazo/kamien 1488/246/0 | drewno/cegla 60/1725/0
  Rel 100: zelazo/cegla 1380/435/15 | drewno/kamien 145/1665/10 | cegla/zelazo 105/1702/7 | kamien/drewno 1230/590/20 | zelazo/kamien 1557/246/3 | drewno/cegla 81/1725/6
  Rel 130: identycznie jak Rel 100 (wspolczynnik relacji w handelRequiredPn jest ucinany do 100: `Math.min(100, relTotal)`, diplomacy-proposals.ts:1041).
 Przyklady ofert z both>0 (Rel>=100): 10 zelaza za 40 cegly (200 PW = 200 PW); 30 drewna za 10 kamienia (30=30); 30 zelaza za 200 kamienia (600=600). We wszystkich przypadkach both>0 zachodzi TYLKO przy givePn == receivePn (rownosc po kwantyzacji do krokow 10); to potwierdza przeciecie wyprowadzone w r2: givePn >= max(receivePn, receivePn*100/Rel) ORAZ givePn <= receivePn. Wynik zgodny z niezaleznym pomiarem Evaluatora (both=0 przy Rel<100; 3..20 z 1800 przy Rel>=100).
 Zastrzezenie metody: podglad gracza w tym skrypcie dostaje ten sam relTotal co bramka AI (w grze treatyEvalRelationTotal(relation) = relationTotal z klamra wojny); poza wojna to ta sama liczba. Gracz-AI ownerId=1/0 dobrany stalo; stan zapasow/stawek nie wchodzi do wyceny PW, wiec nie wplywa na te liczby.

ZARZUT 3 (kryterium 3: mutacja limitu i kryterium 6: zrzut z aktywnym "Przyjmij" niespelnione; zrzut r1 pokazuje stan zablokowany) -- ODRZUCAM jako zarzut wobec obrony, PRZYJMUJE fakt.
 Mutacja "zdjecie limitu" i zrzut "Przyjmij aktywne" wymagaja istniejacego limitu/dzialajacego stanu, ktory z powodow z zarzutu 1/2/7 nie moze powstac bez decyzji ABC. Stan niespelniony jest ZAMIERZONY, nie przeoczony. Obecne mutacje A (wiring) i B (stary zapis) z r1 pozostaja w naglowku testu; na scalonym czubku test live 42/0 (nie powtarzalem mutacji A/B na nowym czubku: NIE_ZMIERZONO, brak zmian w kodzie wiringu miedzy 0d066d858 a czubkiem poza zmianami z main).
 Zrzut evidence/05-okno-dyplomacji-przyjmij-zablokowane.png z r1 pozostaje jedynym zrzutem okna; to swiadomie stan zablokowany ([DECISION_REQUIRED]).

ZARZUT 4 (kryterium 4: mechanizm "AI placi 70 zelaza, gracz dostaje 10" nie rozstrzygniety nowym pomiarem) -- ODRZUCAM jako nowy pomiar, PRZYJMUJE jako wciaz otwarte "NIE_ZMIERZONO".
 Zmierzone dwukrotnie (r1 obrona, kontrola bez umowy: zapas 70 -> 10 w ZWYKLYM ticku ekonomii; powtorzone w tescie live: result.json controlNoDeal ctlLossGive 60) i potwierdzone ponownie na scalonym czubku (evidence/result-obrona-r2.json, ten sam bieg 42/0 -- asercje rownosci "AI oddaje dokladnie dealGive, gracz dostaje dealGive - kontrolny ubytek" przechodza). Ustalone: dostawa NIE niszczy towaru (transferSurowiecIlosc przenosi calosc; diplomacy-basket-transfer.ts); ubytek 60 jest w zwyklym ticku, niezaleznie od umowy. KTORY mechanizm ekonomii zjada 60 z zapasu 70 (utrzymanie budynkow/jednostek, zuzycie, limit): NIE_ZMIERZONO -- nie izolowalem go; nie jest to cap transferu ani niszczenie przez wymiane, wiec NIE DECISION_REQUIRED z tego tytulu. Kandydat na osobny temat (diagnoza tickow ekonomii u odbiorcy). Nie udaje, ze to rozstrzygniete.

ZARZUT 5 (kryterium 5: bramki referencyjne i ai-trade-* na kandydacie; testy na scalonym czubku nie wykonane) -- PRZYJMUJE, wykonane.
 Na scalonym czubku 7fc7b62cb (kod = 32ac76bdf + origin/main 1a42785d4), `npm ci --ignore-scripts` w gra/:
  tsc --noEmit: exit 0
  logic-test: LOGIC OK (213/213), exit 0
  tech-tree-test: 20 pass, 0 fail, exit 0
  research-test: PASSED 33 / FAILED 0, exit 0
  unit-replace-test: 21/21, exit 0
  combat-test: 6/6 pass, exit 0
  ai-trade-proposal-branch-test: 10 passed, 0 failed, exit 0
  ai-trade-proposal-to-player-test: 25 assertions passed, exit 0
  ai-trade-wiring-e2e-live-test (Chromium headless, bundle vite poza repo, file://): 42 pass, 0 fail, exit 0 (evidence/run-obrona-r2-merged-tip.log, result-obrona-r2.json)
 Uwaga (zgodna z Evaluatorem): wartosci tech-tree 19 / unit-replace 13 w tabeli R-PROC-AUTOBOT §Bramki sa nieaktualne wzgledem 20/21 -- nie regresja; aktualizacja tabeli to osobny temat procesowy (nie w allowliscie).
 NIE URUCHAMIANE: reszta bramek R-PROC-AUTOBOT poza wymienionymi (NIE_ZMIERZONO).

ZARZUT 6 (kandydat zbazowany na 6ade0f0ec, nie na czubku origin/main) -- PRZYJMUJE, naprawione.
 Zrobiony merge origin/main (1a42785d4) do kandydata 32ac76bdf: merge-commit 7fc7b62cb, bez konfliktow, ancestry: `git merge-base --is-ancestor 32ac76bdf 7fc7b62cb` i `... 1a42785d4 7fc7b62cb` -> oba prawdziwe (merge dwurodzicowy). Wszystkie bramki z zarzutu 5 wykonane na tym drzewie.

ZARZUT 7 (pomiar tylko Relacja 50; przy Rel>=100 oferty przechodzace obie bramki istnieja; opcja B nie zbadana; A1 niezweryfikowana; diff probny nie w repo) -- PRZYJMUJE w calosci, doprecyzowanie opcji dla ABC.
 Pomiar rozszerzony na Rel 50/80/100/130 (zarzut 2). Wniosek skorygowany wzgledem raportu r2 operatora:
  - Opcja B (zostawic bramki) NIE jest "martwa funkcja": przy Relacji >= 100 istnieja oferty z rownoscia PW (3..20 z 1800 na pare, ~0,2-1,1%), wiec AI MOZE zlozyc oferte, ktora gracz przyjmie przyciskiem -- ale tylko przy rownosci co do PW i tylko przy dobrych stosunkach; przy Relacji < 100 (typowy start/pokoj, w tescie 50) AI nie zlozy zadnej przyjmowalnej oferty. Obecna selekcja (bez gornego limitu) i tak wybiera oferty z nadplata (28:1), wiec w realnej grze dzis gracz widzi oferty zablokowane. Ocena "praktycznie martwa" dla B zostaje dla Rel<100, ODRZUCONA dla Rel>=100.
  - Opcja A1 (wspolczynnik relacji = 1 dla AI-proponenta w bramce AI) wedlug siatki: przy Rel<100 zbior ofert przechodzacych obie bramki staje sie rowny zbiorowi z Rel>=100, czyli 3..20 ofert z 1800 na pare, WSZYSTKIE z givePn == receivePn (dokladna rownosc). Selekcja musialaby szukac takiej rownosci na siatce krokow 10 (diplomacyHandelSurowiecKrok) -- dla niektorych par/zapasow oferta moze nie istniec (clamp per_turn/stawki). A1 jest wiec wykonalna, ale daje waska, "rowne za rowne" klase ofert; niezweryfikowana w zywej grze (NIE_ZMIERZONO).
  - A2 (tolerancja netPw >= -X w podgladzie gracza) wprost zakazana dispatchem r2.
 Diff probny: NIE dostarczam -- byl cofniety i jest w scratchpadzie poza repo; nie da sie go zweryfikowac, wiec go nie opieram o niego. Rekomendacja nie zalezy od niego: dowod niewykonalnosci "bez zmiany reguly" daje siatka z evidence/.
 DECYZJA ABC pozostaje do podjecia przez wlasciciela (po polsku przez orkiestratora): A1 (rownosc PW, Rel-wspolczynnik 1 dla AI-proponenta), A2, B (zostawic), C (zostawic stan r1).

ZARZUT 8 (raport r2 nadpisal 10-operator-claude.md z r1 w drzewie) -- PRZYJMUJE co do faktu, NIE zmieniam cudzego pliku.
 10-operator-claude.md to raport roli Operatora, a nie moj plik (allowlista obrony); jego nadpisanie przez r2 jest widoczne w historii git (32ac76bdf vs ae3b823f4). Nie przywracam go, bo nie nalezy do mojej allowlisty i zmienialby stan kandydata poza zakresem obrony. W swoim pliku (30-obrona-claude.md) unikam tego samego bledu: raport r1 obrony zachowany ponizej w calosci, r2 dopisany na gorze.

TESTY (podsumowanie): tsc exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; ai-trade-proposal-branch 10/0; ai-trade-proposal-to-player 25/25; live Chromium 42/0; siatka bramek 6 par x 4 Relacje (artefakt w repo). Nie powtorzone: mutacje A/B na nowym czubku (NIE_ZMIERZONO). Host obciazony (load average ~15-16); mimo to live test zakonczyl sie sukcesem w jednym przebiegu.
BLOKADY: DECISION_REQUIRED (ABC A1/A2/B/C -- bramki uczciwosci AI i gracza sa rozlaczne dla Rel<100; zmiana reguly poza mandatem). Brak blokad technicznych.
RUNDY: obrona 2/5 (te same ID; Operator r2 -> Evaluator r2 -> obrona r2).
NASTEPNY KROK: orkiestrator zadaje wlascicielowi ABC (A1/A2/B/C) z doprecyzowaniem z zarzutu 7 (przy Rel>=100 oferty "rowne za rowne" istnieja, 0,2-1,1% siatki). Po A1: runda 3 -- zmiana bramki AI dla AI-proponenta w trzech miejscach + selekcja po bilansie PW ~0, test live z aktywnym "Przyjmij" bez forceAccept, tabela tura->zasoby, mutacja zdjecia limitu, zrzut okna, bramki na scalonym czubku. Osobny temat (opcjonalnie): mechanizm ubytku 60 zelaza w ticku odbiorcy; aktualizacja tabeli bramek R-PROC-AUTOBOT (tech-tree 20, unit-replace 21).
DEPLOY/PUSH: NIE WYKONANO

======================================================================
RAPORT OBRONY R1 (zachowany bez zmian z 32ac76bdf)
======================================================================

STATUS: DECISION_REQUIRED (zarzuty 2-5 rozstrzygniete i poprawione w tej rundzie; zarzut 1 wymaga decyzji ABC wlasciciela przed integracja)
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-WIRING-E2E-Q1
GOAL: dowod w zywej grze (Chromium, realny endTurn): propozycja AI -> okno gracza -> akceptacja -> realny tick dostaw -> odrzucenie/cooldown -> zapis/wczytanie -> stary zapis; defekty wiringu naprawic minimalnie z testem, zmiany zachowania/balansu -> DECISION_REQUIRED
ZMIANY/COMMIT: baza 8ebfe0980be4b38d75e5bcf74f2617461507088a (kandydat Operatora). Rzeczy dodane w tej rundzie: 0d066d858 (kod: gra/src/main.ts, gra/tools/ai-trade-wiring-e2e-live-test.cjs), 6e16c618f (evidence/), ten raport (commit osobny, SHA w polu sha wyniku). Allowlista: gra/src/main.ts, gra/tools/ai-trade-wiring-e2e-live-test.cjs, dyspozycje/autobot/runs/R-WEB-AI-TRADE-WIRING-E2E-Q1/{30-obrona-claude.md, evidence/*}. Brak `git add -A`. Nie pushowano.

Wszystkie liczby ponizej pochodza z surowego wyjscia uruchomien w tej sesji (logi w scratchpadzie sesji; evidence/run-obrona-r1.log w repo). Czego nie zmierzylem, jest oznaczone NIE_ZMIERZONO.

ODPOWIEDZI NA ZARZUTY

ZARZUT 1 (przycisk „Przyjmij” nie dziala na realnej sciezce; DECISION_REQUIRED) — ODRZUCAM jako zarzut wobec kodu operatora, PRZYJMUJE jako otwarty problem produktowy. Zadnej zmiany zachowania nie wprowadzam.
 Dowod z zywej gry (nowy krok testu 1b + zrzut evidence/05-okno-dyplomacji-przyjmij-zablokowane.png): po klikniecie karty HUD „Dyplomacja” otwiera sie Audiencja dyplomatyczna; przycisk `data-negot-act="accept-package"` „Przyjmij” ma `disabled=true`, „Odrzuc” jest aktywny, w oknie jest napis „Przewaga u Ciebie — oferta nieuczciwa dla partnera (1350 PW)”.
 DOPRECYZOWANIE PRZYCZYNY (Evaluator opisal to jako „sprzeczne bramki”; pomiar pokazuje cos prostszego): wycena tej samej oferty z funkcji wiringu (hak diagPayload) = givePn 1400 (AI oddaje 70 zelaza), receivePn 50 (AI dostaje 10 cegly); fairBlock=null (bramka AI przepuszcza), playerOk=false. Czyli AI proponuje graczowi wymiane, w ktorej oddaje 28 razy wiecej PW niz dostaje. Selekcja (pickAiPlayerCyclicBarter -> selectAiTradeBarter, main.ts ~23484) uzywa handelFairnessGate(givePn, receivePn, ...) tylko jako dolnego progu „AI oddaje co najmniej tyle, ile wymaga bramka” i nie ma gornego ograniczenia nadplaty; ilosci wychodza z clampu per_turn (stawka produkcji 75 zelaza/ture vs 10 cegly). Bramka podgladu gracza (net PW >= 0 po stronie partnera) slusznie odrzuca taka oferte jako darowizne kosztem AI. Stan faktyczny w grze: gracz widzi oferty AI, ktorych nie moze przyjac przyciskiem.
 Zalezy od setupu testu (zelazo 20 PW/szt. vs cegla 5 PW/szt., AI z nadwyzka 400): NIE_ZMIERZONO, jak szeroko ten rozjazd wystepuje w normalnej rozgrywce (inne pary surowcow, inne stany).
 DECYZJA DO WLASCICIELA (ABC, po polsku w glownym czacie przez orkiestratora; ja nie mam kanalu do wlasciciela i nie wybieram progow):
  A (rekomendacja) — ograniczyc ilosc oddawana przez AI w selekcji, tak aby bilans PW oferty mieszczal sie w oknie [0, X] PW nad progiem bramki AI (X = prog do ustalenia przez wlasciciela); wtedy „Przyjmij” dziala bez zmiany bramki gracza.
  B — poluzowac podglad gracza dla ofert zainicjowanych przez AI (gracz moze przyjac darowizne). Zmienia znaczenie ochrony „nieuczciwa dla partnera”.
  C — zostawic: wiring naprawiony (propozycje docieraja do okna), przyjecie ofert niemozliwe do czasu osobnego tematu; ryzyko UX: oferty-pulapki.
 Do czasu decyzji integracja samego fixu wiringu pogarsza UX (gracz zacznie widziec oferty, ktorych nie przyjmie) — rekomenduje sie A w tym samym albo kolejnym temacie PRZED deployem.

ZARZUT 2 (okno dyplomacji NIE_ZMIERZONO) — PRZYJMUJE, naprawione.
 Poprawka: gra/tools/ai-trade-wiring-e2e-live-test.cjs, helpery openAudienceFromHud/closeAudience + krok 1b: test klika karte HUD (jak gracz), czeka na przycisk decyzji, odczytuje przyciski i tekst okna. Asercje (wszystkie zielone): okno otwarte i widoczny przycisk pakietu; w oknie widoczne Zelazo/Cegla i „Ich propozycja”; [DECISION_REQUIRED] „Przyjmij” disabled + „Przewaga u Ciebie” + „Odrzuc” aktywny; wycena givePn>2*receivePn. Dodatkowo faza 4 (odrzucenie) idzie teraz REALNYM przyciskiem „Odrzuc” w oknie (stol czysty, cooldown odrzucenia zapisany — asercje z poprzedniej wersji nadal przechodza).
 Zrzut: evidence/05-okno-dyplomacji-przyjmij-zablokowane.png (obejrzalem go: okno „Audiencja dyplomatyczna”, kolumna „Oni oferuja: 75 Zelazo na ture”, „My oferujemy: 10 Cegla na ture”, panel PW: MY ODDAJEMY 50 PW / ONI ODDAJA 1400 PW / BILANS -1350, przycisk „Przyjmij” wyszarzony).
 Obserwacja uboczna (bez zmiany): okno pokazuje 75 zelaza/ture, a umowa po akceptacji ma 70 (normalizacja do kroku 10, istniejacy kod); gracz widzi inna liczbe niz dostanie. Nie jest to zakres tematu; do rozwazenia w ABC zarzutu 1.
 Nadal NIE_ZMIERZONO: wyglad okna po akceptacji dzialajacej przyciskiem (przycisk zablokowany, wiec sciezka niemozliwa do uruchomienia z UI); akceptacja nadal idzie hakiem forceAccept.

ZARZUT 3 (ubytek towaru w ticku dostaw, slaba asercja) — PRZYJMUJE, przyczyna zmierzona, asercja zaostrzona.
 Pomiar kontrolny BEZ umowy (jednorazowy diagnostyczny skrypt, usuniety): ustawiam graczowi 70 zelaza i AI 10 cegly jako zwykly zapas, jeden endTurn -> gracz 70 -> 10 (-60 zelaza), AI cegla 10 -> 7 (-3); powtorzone 2 razy, wynik identyczny. Gracz bez zelaza w tych samych turach nie ma zadnego dryfu zelaza (400/0/0 stabilne), wiec ubytek zalezy od posiadanego zapasu. Wniosek: 60 zelaza i 3 cegly znikaja w ZWYKLYM ticku ekonomii u odbiorcy, niezaleznie od umowy; dostawa nie niszczy towaru (transferSurowiecIlosc przenosi calosc, potwierdzone czytaniem kodu diplomacy-basket-transfer.ts:233-290 i pomiarem). Cap magazynu panstwa (ownerResourceCap) NIE jest przyczyna (przy kilkuset sztukach limit jest w tysiacach, nie mierzylem jego wartosci w tej grze). KTORY dokladnie mechanizm zuzywa te 60 i 3 (np. utrzymanie budynkow/jednostek): NIE_ZMIERZONO, poza zakresem tematu; kandydat na osobny temat, jesli wlasciciel uzna to za niepozadane.
 Poprawka w tescie: nowa faza kontrolna w tescie live (stan odbiorcy bez umowy, jeden endTurn, potem ponowne wczytanie slotu) + asercje rownosci zamiast `dG > 0 && dG <= dealGive`: AI oddaje dokladnie dealGive (70) = floor(oferta/10)*10, gracz dostaje dokladnie dealGive - ctlLossGive (10 = 70 - 60), AI dostaje dokladnie 10 - 3 = 7. Wartosci z evidence/result.json: controlNoDeal {ctlLossGive:60, ctlLossRecv:3}, stocksBefore {aiGive:400,aiRecv:0,plGive:0,plRecv:399}, stocksAfterTick1 {aiGive:330,aiRecv:7,plGive:10,plRecv:391}.
 Zastrzezenie: asercja rownosci zaklada, ze zuzycie jest deterministyczne dla tego samego stanu; w dwoch pomiarach kontrolnych i w tescie wyszlo identycznie, ale to NIE jest dowod determinizmu w ogolnosci (cegla gracza dryfuje -3/+2 miedzy turami, dlatego tej wielkosci nie asertuje).

ZARZUT 4 (rozjazd z dispatchem/dokumentacja testu) — PRZYJMUJE, naprawione w naglowku testu; w czesci o Vite HTTP ODRZUCAM.
 Naglowek testu opisuje teraz dokladnie obie mutacje (A: warunek galezi zmieniony na nieistniejacy typ; B: usuniecie `aiResourceBarterLastProposalTurn.clear();`) oraz zrodlo srodowiska.
 Vite po HTTP: ODRZUCAM jako wade — dispatch (ŚRODOWISKO) zabrania `npm run dev`/`build` w gra/ i dopuszcza wylacznie `vite build --outDir` poza repo; serwer deweloperski byl by naruszeniem bariery §9 pkt 1. Test laduje zbudowany bundle z file://; kod gry i hak ?civTest=1 sa te same. Opisane w naglowku. Rozjazd z literalnym sformulowaniem GOAL („Vite HTTP”) pozostaje i jest swiadomy; do potwierdzenia przez FC/orkiestratora.
 Mutacje zmierzone przeze mnie na kodzie z 0d066d858 (bundle poza repo, main.ts przywrocony `git checkout` po kazdej; po przywroceniu `git diff -- gra/` pusty):
  A: exit 1, FAIL „REALNY endTurn: AI skladala graczowi propozycje” (stol pusty, pending=[]).
  B: exit 1, 41 pass / 1 fail, FAIL „stary zapis: ... cooldown barteru pusty” (barterCooldown [[1,2]] odziedziczony).

ZARZUT 5 (higiena/zakres, baza, brak dispatchu) — czesciowo PRZYJMUJE.
 (a) aiBarterAcceptableForPlayer poza straznikiem civTest: PRZYJMUJE, naprawione — funkcja przeniesiona do bloku `if (... civTest=1)` obok haka (gra/src/main.ts, `git diff 8ebfe0980..0d066d858 -- gra/src/main.ts`: przeniesienie 14 linii, zero zmian logiki). Bez ?civTest=1 funkcja juz nie istnieje. tsc --noEmit: exit 0 po zmianie.
 (b) ~165 linii haka __aiTradeWiringTestDebug: ODRZUCAM — dispatch dopuszcza „minimalne haki” pod ?civTest=1 (DODATEK, KRYTERIA); hak jest jedyna droga do stanu (stoly negocjacji, cooldowny, sloty zapisu). Nie zmniejszalem go. Do oceny FC, czy rozmiar jest akceptowalny.
 (c) Bramki na scalonym czubku main: ZMIERZONE. Tymczasowa galaz = 6e16c618f + merge origin/main (6ade0f0ec; merge BEZ konfliktow, merge-commit 0386aa402, galaz usunieta po pomiarach; NIE jest czescia dostarczanego SHA). Wyniki: tsc exit 0; test live 42 pass / 0 fail; logic-test 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; ai-trade-proposal-branch-test 10/0; ai-trade-proposal-to-player-test 25/25.
 (d) Brak 00-dispatch.md na origin/main: potwierdzam (sprawdzone `git show origin/main:.../00-dispatch.md` -> nie istnieje); kryteria z DODATKU. Nie tworze go (poza moja allowlista i rola).

TESTY (kandydat = kod na 0d066d858, po obronie):
- tsc --noEmit: exit 0 (17 s)
- test live ai-trade-wiring-e2e-live-test.cjs: 42 pass / 0 fail, exit 0 (poprzednio 36/0; baseline operatora odtworzony przeze mnie przed zmianami: 36/0)
- logic-test 213/213, tech-tree 20/0, research 33/33, unit-replace 21/21, combat 6/6, ai-trade-proposal-branch-test 10/0, ai-trade-proposal-to-player-test 25/25 (wszystkie exit 0, zarowno na kandydacie, jak i na scalonym czubku)
- mutacje A i B: obie czerwone (wyzej)
- NIE URUCHAMIANE: unit-power, mgla-inwariant, map-gen-regression i reszta bramek z R-PROC-AUTOBOT §6 poza wymienionymi (NIE_ZMIERZONO).

BLOKADY: DECISION_REQUIRED (zarzut 1: ABC A/B/C powyzej). Brak blokad technicznych.
RUNDY: obrona 1/5 (te same ID; Operator -> Evaluator -> obrona). Po decyzji ABC ew. dopisek rundy 2 w 00-dispatch.md z BAZA = SHA z pola sha.
NASTEPNY KROK: orkiestrator zadaje wlascicielowi pytanie ABC (zarzut 1) po polsku; Final Control rozstrzyga zarzuty 2-5 na podstawie tego raportu; integracja dopiero po decyzji (rekomendacja: A najpierw). Do osobnego tematu (jesli wlasciciel zechce): ustalenie mechanizmu zuzycia 60 zelaza/3 cegly w ticku (zarzut 3).
DEPLOY/PUSH: NIE WYKONANO
