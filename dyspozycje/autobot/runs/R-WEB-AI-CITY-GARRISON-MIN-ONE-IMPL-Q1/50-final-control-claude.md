STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: każde miasto AI trzyma min. 1 jednostkę bojową także w pokoju; garnizon nie dołącza do armii.
ZMIANY/COMMIT: kandydat 5e3c284a45606a5c24a1214f2c6dcc2128d444e6 (baza b6302fcc2; merge-base --is-ancestor = PRAWDA). Diff r4 względem merge'a main (ae1cdbe99): 17 plików, wszystkie w allowliście (ai.ts, ai-war-home-defense.ts, ai-city-garrison.ts, main.ts, ai-params.json, testy/narzędzia tools, runs/**). Brak gra-robocza/WERSJE/rust-port w diffie r4 (diff względem samego b6302fcc2 zawiera gra-robocza i FALE 846-851 z merge'a origin/main - to nie praca tematu).
TESTY (własny bieg na 5e3c284a4, surowe): tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0; min-one 38/0; ai-war-city-garrison 21/0; ai-war-defend-home 30/0; ai-home-defense-civilian-filter 8/0; ai-war-army-seeks-army 22/0; siege-ai 17/0; siege-last-stand-sortie 71/0; ai-siege-relief 23/0; ai-home-defense-vs-barbarians 50 pass / 2 FAIL (T2(b), T4(b) ORYGINAŁ); army-concentration 56 pass / 2 FAIL (sc.4 "<10" i ORYGINAL "<=6"). Na ae1cdbe99 (przed r4): 46/0 i 57/0 (setup z garnizonem).
MUTACJA (własna): getCityGarrisonUnitIds bez zapisu wpisu -> min-one 30/8 (czerwień), ai-war-city-garrison 19/2 (czerwień); źródło przywrócone, cmp OK. army-concentration przy mutacji 57/1 (garnizon nie wykluczony -> scalanie, asercja "<10" przechodzi) - spójne z diagnozą kolizji.
OCENA ZARZUTÓW:
1. 4 oryginalne asercje czerwone - ODDAL (uwaga), nie FAIL: dispatch DODATEK 3 pkt 4 wprost dopuszcza DECISION_REQUIRED, gdy oryginał koliduje z regułą właściciela; kolizja potwierdzona (jedyna jednostka miasta = stały garnizon, więc nie maszeruje; 5 garnizonów + 5 obrońców domu = >=10 klastrów). Oryginały zachowane obok nowych scenariuszy. Skutek: zestaw testów w main będzie czerwony do decyzji ABC - integracja musi to jawnie nieść.
2. t30 puste 36/96 (37,5%) - ODDAL: dispatch ma próg tylko dla t60; przyczyna częściowa (nnsHold, brak środków, ekonomia poza allowlistą).
3. Niestabilność pomiaru - ODDAL (uwaga): czysty bieg 28bace9bb dał t60 16/188 (8,5%), zgodny z biegiem diag 16/188; wcześniejszy czysty 14/192 (7,3%) był sprzed poprawki cs. Oba < 10%. Jedno ziarno 4242, wariancji nie zmierzono (NIE ZMIERZONO).
4. Koszt utrzymania - ODDAL: PRZED/PO w dowody-r4/pomiar-koszt-PRZED-PO-r4.txt: t60 2760 -> 3148 (+14%), t30 228 -> 436; skarbiec t60 50237 -> 52604. Pole "garnizon" plik sam oznacza jako NIE ZWERYFIKOWANE.
5. garnizon poza pulą planHomeWar - ODDAL jako decyzja produktowa (ta sama co 1): wynika z reguły (f) właściciela; homeDefenderPool w ai.ts nietknięty zgodnie z dispatchem pkt 6; diff ai-war-home-defense.ts to opcjonalne pole garrisonUnitIds (undefined = dawne zachowanie).
6. odczyt parametru bez testu - NAPRAWIONE: garrisonReserveMaxCitiesFromParams + H11a-f (min-one 38/0 w moim biegu).
7. resztka pustych miast t60 przy dużych skarbcach - ODDAL: zmierzona częściowo (wł. 1: 4 puste przy skarbcu 11963; wł. 13: 6); kryterium pkt 2 dopuszcza udokumentowaną resztkę, a próg 10% jest spełniony.
KRYTERIUM DISPATCHU r4: t60 pokój+wojna puste 167/193 (86,5%, PRZED 04f870acd) -> 16/188 (8,5%) = SPEŁNIONE (<=10%). Nie powtórzyłem pomiaru w żywej grze (NIE ZMIERZONO przeze mnie; opieram się na dowodach w runs/dowody-r4).
NIEZWERYFIKOWANE: limit "odejścia garnizonu w pokoju <=20 / 60 tur" - dowody dają histogram odejść jedynej jednostki bez podziału pokój/wojna (ok. 49, dominuje ai:4649), więc kryterium NIE ZMIERZONO w rozbiciu.
BLOKADY: brak technicznych; DECISION_REQUIRED właściciela: (A) zastąpić oryginały T2(b)/T4(b)/sc.4 nowymi scenariuszami (rekomendacja) albo (B) dopuścić marsz jedynej jednostki (sprzeczne z regułą f); sufit rezerwy = 3 (założenie robocze, ABC "CZEKA NA RANO").
RUNDY: 4/5 (Final Control r4)
NASTĘPNY KROK: integracja orkiestratora ze świadomym wpisem, że 4 oryginalne asercje są czerwone do decyzji ABC (albo po decyzji A: zastąpić je); pomiar PO powtórzyć na integracji (inne ziarna).
DEPLOY/PUSH: NIE WYKONANO
