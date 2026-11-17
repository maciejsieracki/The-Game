# R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1 — Final Control (runda 5/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko pomiar; w `gra/src` jedynie hak `ledgerStats` za `?civTest=1` z rundy 3)
TEMAT: R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1
GOAL: pomiar ON/OFF księgi „Skąd zapasy” w konfiguracji domyślnej; po 5 rundach wynik z 1 ziarna (4242), próg 10% NIE ROZSTRZYGNIĘTY (rozstęp same-variant ON 17,5%).
ZMIANY/COMMIT: kandydat e90ff055ffcc4e355f209a4ab396da036471c500 jest potomkiem bazy 23f28558e (`git merge-base --is-ancestor` = tak). Diff vs baza: wyłącznie `10-operator-claude.md` i `30-obrona-claude.md` w runs/R-WEB-LEDGER-PERF-DEFAULT-CONFIG-MEASURE-Q1 (2 pliki, +43/-54). Allowlista zachowana, `gra/src` bez zmian względem bazy. Do integracji: e90ff055ffcc4e355f209a4ab396da036471c500 (+ ten raport).

ZARZUTY (rozstrzygnięcie):
1. Niezweryfikowane zdania o ziarnie 777 w raporcie Operatora: ODDAL (naprawione w kandydacie; sekcja ZIARNA mówi „NIE ZMIERZONO”, KOREKTY pkt 8; evidence zawiera tylko s4242/ i dist-md5.txt, zgodnie z raportem).
2. Nagłówki rundy 4 przy rundzie 5/5: ODDAL (STATUS/GOAL/BAZA/RUNDY w raporcie mówią o rundzie 5/5, sekcja testów oznaczona jako zmierzona w rundzie 4; kod bez zmian).
Brak zarzutów NAPRAW; brak decyzji produktowych.

TESTY (zmierzone samodzielnie na e90ff055f, po `npm ci` w gra/, 71 pakietów):
- tsc --noEmit: exit 0, bez wyjścia.
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST 6/6 pass
- Wszystkie 5 bramek zielone, więc porównanie baza vs kandydat nie było potrzebne (kod identyczny z bazą).
- Hook-test ai-economy-measure (19/19 z mutantem): NIE URUCHOMIONY przez FC (wymaga builda i Chromium, ok. 6 min); liczba przejęta z raportu rundy 4 i z potwierdzenia FC r4; kod haka niezmieniony od bazy.
- Spójność raportu: `grep t60|t70` w 10-operator-claude.md nie zawiera twierdzenia o wznowieniu ze slotu t60/t70 (linia 32 zaprzecza, KOREKTY 7 wycofuje); odwołania do evidence/s4242/*DISCARDED* odpowiadają istniejącym plikom.
- Testy live/Chromium: NIE dotyczy (brak zmian wizualnych; w tej rundzie brak pomiarów).
- git diff --check: czysto (diff dokumentów, wykonane przez Obronę; FC nie wykrył problemów przy przeglądzie).

BLOKADY (zostają jako NOTY):
- Próg 10% NIE ROZSTRZYGNIĘTY: 1 ziarno z 3, rozstęp same-variant ON 17,5%; pomiar naruszał load ≤ 3,0 w części tur ON2/OFF2.
- Wpływ filtra isHuman przy zapisie slotu na Δ% NIE OSZACOWANO; stronniczość selekcji ON2 po loadzie NIE OSZACOWANO.
- Okno pomiaru t51–t80, nie 100 tur.

RUNDY: 5/5 (limit wyczerpany; werdykt PASS-WITH-NOTES, więc brak LIMIT-5-EXCEEDED).
NASTĘPNY KROK: integracja orkiestratora (FF dokumentacji do main); dalszy pomiar jako NOWY temat (≥2 ziarna, load ≤ 1,5, kontrola filtra isHuman, bez selekcji po loadzie).

UWAGI-DLA-ORKIESTRATORA: opis commita 9ae009803 zawiera nieprawdziwe zdanie o evidence seed 777 (historia nieprzepisywana; raport to prostuje). Hak `ledgerStats` w main.ts jest za `?civTest=1`, bez wpływu na grę.

DEPLOY/PUSH: NIE WYKONANO
