STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/weryfikacja; zero zmian gra/src i gra/data)
TEMAT: R-WEB-AI-REBEL-VERIFY-LIVE-Q1
GOAL: weryfikacja zywa buntow miast AI (FALE 928-929) na maksimum: ochrona ostatniego miasta, stolica, round-trip zapisu, render wpisu, bieg zywy.
ZMIERZONE-W-FC: kandydat ebf1af04cf7522dcd526a2249a67475bb38457f1; merge-base --is-ancestor 35f9e68679 -> TAK; git diff 35f9e68..ebf1af04: 17 plikow, 0 w gra/src i gra/data, wszystkie w allowliscie (gra/tools/ai-rebel-verify-*.cjs, doc analizy, runs/**).
TESTY (wlasne, na kandydacie, surowe wyjscie): tsc --noEmit rc=0; ai-city-rebellion-gate 37/0; ai-city-rebellion-news 24/0; logic-test 213/213; ai-test 297/0. Zywych biegow NIE powtarzalem (Chromium); ocena na surowych danych w dane/*-r3*.
OCENA DOWODOW:
- Poz.1: s4242 owner 8/city11 i s7 owner 21/city24 (rozni wlasciciele), tury 2-7 rebelState=false; ustawienia w danych: difficulty hard, kulturaReligia trudny, kosztJednostek wysoki, dyplomacja trudna (maksimum). Kontrola na miescie gracza: od t2 owner -99, rebelState true. Hak realnie wymusza bunt, ochrona dziala. Metryka aiZ0Miast jest pomocnicza (zrodlem prawdy rebelState/ownerId) - zarzut 1 zalatwiony; mutacja nowej metryki NIE powtorzona.
- Poz.2: stolica city16 -> city17, wlasciciel zostaje z 1 miastem (stolica-s4242-r3.json). Efekty stolicy/Mennica/zwyciestwo NIE ZMIERZONO.
- Poz.3: round-trip w nowym procesie: lista przed = po (1 wpis), roundTrip true.
- Poz.4: zrzut news-s4242-r3-first.png istnieje, wpis widoczny (czesciowo przyciety).
- Poz.5: 13 tur, 1 wpis rebelia; 2 przebiegi tego samego ziarna identyczne. 60 tur naturalnie NIE ZMIERZONO - powod techniczny udokumentowany (endTurn blokowany przez ekrany powitalne, proba 2 limit 585 s, log natural-s4242-r3-ostatnia-proba.txt).
ZARZUTY: 1-9 oddane/zalatwione. Pozostale luki (uwagi, nie FAIL): seed 7 dla wpisow "czas" (slaby powod, ale poz.1 ma 2 ziarna); hotseat; Mennica/zwyciestwo; liczba widocznych cywilizacji; baza w dokumencie analizy podana jako 025046346 (nieaktualna, kosmetyka).
BLOKADY: brak blokujacych.
RUNDY: 2/5 (final control po obronie)
NASTEPNY KROK: integracja orkiestratora (tylko pliki dokumentacyjne/narzedzia, bez deployu - brak zmian gra/src); osobne tematy: bieg naturalny 60 tur (obsluga ekranow powitalnych), odczyt Mennicy/zwyciestwa po buncie stolicy, hotseat.
UWAGI-DLA-ORKIESTRATORA: dokument analizy wskazuje baze 025046346 zamiast 35f9e68; brak DECISION_REQUIRED.
DEPLOY/PUSH: NIE WYKONANO
