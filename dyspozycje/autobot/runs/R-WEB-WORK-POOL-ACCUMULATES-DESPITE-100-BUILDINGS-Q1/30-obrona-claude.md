STATUS: PASS-WITH-NOTES (DECISION_REQUIRED nadal otwarte dla zarzutu 1)
DOMAIN: GAME
TEMAT: R-WEB-WORK-POOL-ACCUMULATES-DESPITE-100-BUILDINGS-Q1
GOAL: przy 100% na budynki panel/baner pokazuje prawdziwy routing Pracy (jedno zrodlo prawdy z ticku); zmiana bilansu pustej kolejki wymaga ABC.
BAZA: 367028258357a585326773d3f738179df037ba19

## Odpowiedzi na zarzuty Evaluatora (report 931bd573)

### Zarzut 1 (GOAL z DODATKU 2 niespelniony: silnik nadal ksieguje cala Prace do puli przy pustej kolejce) — ODRZUCAM jako zmiane w tej rundzie, PRZEKAZUJE do ABC
Zgoda co do faktu: kandydat nie zmienia stanu gry, tylko wyswietlanie; temat NIE jest ogloszony jako "naprawiony" w sensie ekonomii.
Dlaczego nie zmieniam silnika: `pracaImperialPoolGain` (production.ts) jest udokumentowanym wyjatkiem (HUD-PRACA-OVERFLOW, 2026-08-02); zmiana na "pusta kolejka -> Praca przepada/rezerwa" to decyzja produktowa o bilansie (CLAUDE.md zasada 3, dispatch: zmiana progow/bilansu -> DECISION_REQUIRED). Pomiar (tabela w 10-operator-claude.md): przy NIEPUSTEJ kolejce 100% budynki => delta puli 0; pula rosnie wylacznie przy pustej kolejce miasta, a to dokladnie scenariusz ze zrzutu wlasciciela (Ateny).
Zalozenie (luka): zrzut wlasciciela dotyczy miasta z pusta kolejka (potwierdza to zgodnosc "6 do budynkow" w tabeli z "PULA +6").
DECYZJA DLA WLASCICIELA (ABC, bez zmian w kodzie): A) zostaje (cala Praca z pustej kolejki -> pula, UI mowi prawde; rekomendacja, bo inaczej Praca przepada), B) pusta kolejka -> Praca nie trafia do puli (przepada), C) pusta kolejka -> osobna rezerwa budowy miasta (nowy mechanizm). Dodatkowo mozliwa podpowiedz w panelu "Kolejka pusta - Praca idzie do puli".

### Zarzut 2 (rozjazd podgladu z tickiem przy administratorze / auto-budowie) — PRZYJMUJE jako ograniczenie, NIE_ZMIERZONO, bez poprawki
Potwierdzam lektura main.ts ~39975-40002: auto-kolejkowanie (Zarzadca / tryAutoEnqueueBuild, tylko gdy `isCityAutoBuildActive`) dzieje sie PRZED `queueEmpty = frontItem(prod0) === null` w ticku, a panel liczy `queueEmpty` z biezacej kolejki. Przy pustej kolejce + aktywnym administratorze panel pokaze cala Prace do puli, a tick zakolejkuje budynek i skieruje Prace do budynkow. Poprawne wyliczenie wymagaloby symulacji decyzji auto-budowy w podgladzie (osobny, duzy temat; to samo ograniczenie ma juz wczesniejszy podglad `previewPracaPoolBrutto` w main.ts ~22299, czyli NIE jest regresja tego kandydata, a tylko zostalo rozszerzone na tabele/baner). Nie mierzono w Chromium (brak scenariusza administratora w tej rundzie). Zalecenie: osobny temat R-WEB-WORK-ROUTING-PREVIEW-AUTOBUILD-Q1 albo podpowiedz "moze sie zmienic po auto-budowie".

### Zarzut 3 (zrodlo prawdy tylko czesciowe) — PRZYJMUJE czesc (wstrzymana), ODRZUCAM czesc (prodMult, oblegany), brak zrzutu
a) Wstrzymana kolejka — PRZYJETE, naprawione: `effectivePracaRouting(..., paused=true)` zwraca teraz 0/0 (tick: `if (econTick && !prodPaused)` ksieguje pule, `pracaBudynki = 0` dla wstrzymanej — nic nie jest ksiegowane). Dowod: nowy test `gra/tools/praca-routing-effective-unit-test.cjs` (123 asercje, 3 wartosci Pracy x 4 podzialy x pusta/niepusta x wstrzymana, porownanie z `pracaImperialPoolGain` i z logika ticku). Mutacja (`if (false && paused)`): 30 FAIL / 93 pass; po cofnieciu 123/0.
b) prodMult — ODRZUCAM: `difficultyProductionMultForOwner` (main.ts:9570) zwraca 1 dla kazdego owner, ktory nie jest major AI (`qualifiesForMajorAiDifficultyBonus`); panel imperium/miasta dotyczy wylacznie gracza (ME()), wiec mnoznik = 1 i wyswietlany routing jest identyczny z tickiem. Nie ma wiec rozjazdu dla widocznych paneli.
c) Miasta oblegane — ODRZUCAM jako blad tabeli: tick (main.ts ~40004) ksieguje Prace oblegana (turn-economy.ts ~2225-2242 zwraca wiersz z `doBudynkow/doPuli`, bez wyzerowania) — tabela, ktora oblegane miasta UWZGLEDNIA, jest zgodna z ticku; rozjazd to wczesniejsze `|| tk.oblegany` w podgladzie puli (main.ts 22299), istniejace przed ta zmiana i poza zakresem tematu (NIE_ZMIERZONO co do skutku w grze; kandydat do osobnego tematu).
d) Zrzut baneru Chromium — NIE WYKONANO w tej rundzie: zmiana nie dodaje elementow ani layoutu, tylko wartosci liczbowe w istniejacych polach; weryfikacja przez odczyt realnego snapa panelu imperium w Chromium (live-test: panel bud/pula == realny przyrost puli, 78/0). Do rozstrzygniecia przez Final Control, czy to wystarcza wobec zapisu dispatchu.

## ZMIANY/COMMIT
- gra/src/game/production.ts: `effectivePracaRouting` — wstrzymana kolejka => 0/0.
- gra/tools/praca-routing-effective-unit-test.cjs (nowy).
- ten raport.
SHA: patrz commit na gałęzi obrona-wp (zwrocony w polu sha).

## TESTY (surowe wyniki w tej rundzie)
- npx tsc --noEmit: 0 bledow (brak wyjscia).
- praca-routing-effective-unit-test: pass=123 fail=0; mutacja: pass=93 fail=30.
- praca-pula-100-budynki-live-test (Chromium, realny endTurn): pass=78 fail=0.
- logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
- empire-praca-panel-coverage 15/15; praca-auto-ulepszenia-koszt-split 20/0; praca-limit-50 34/0; praca-podzial-staly-50-50 6/0; praca-pula-rate-parity 20/0; ulepszenia-praca-percent 28/0.
- Nie powtarzano: 3 testy czerwone na bazie wg operatora (NIE_ZMIERZONO).

## BLOKADY
DECISION_REQUIRED (ABC) — wariant ekonomiczny pustej kolejki (zarzut 1). Zarzut 2 jako osobny temat. Brak zrzutu baneru.
## RUNDY: obrona r1 (runda 1/5 procesu)
## NASTĘPNY KROK: Evaluator/Final Control; ABC do wlasciciela (A/B/C wyzej).
## DEPLOY/PUSH: NIE WYKONANO
