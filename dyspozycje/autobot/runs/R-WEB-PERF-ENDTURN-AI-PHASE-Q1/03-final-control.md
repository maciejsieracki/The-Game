STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-PERF-ENDTURN-AI-PHASE-Q1
GOAL: JS konca tury >= 2x nizszy (mediana n>=7), bez zmiany wynikow i determinizmu AI. NIE osiagniety, NIE zmierzony (Operator i Obrona to przyznaja; szacunek ok. -12..-20%).
ZMIANY/COMMIT: oceniany SHA 0c159269a (obrona; kod = 39f96124c39b032ad24b55970e7a981b822239ee na bazie ca289d8ce = origin/main). Diff do allowlisty: gra/src/main.ts (+30/-1), 2 nowe testy w gra/tools, raport/logi runa. Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle, gra/data. git diff --check czysty. FC nie dodaje zmian kodu.
TESTY: tsc EXIT=0 (gate-tsc.txt), perf-endturn-ai-phase-equiv-test (statyczny) 1/1 EXIT=0. Regresje 274/20, 13/13 nie dotykaja main.ts - nie sa dowodem determinizmu.
ROZSTRZYGNIECIE ZARZUTOW:
1 GOAL niespelniony - NAPRAW (runda 2).
2 Status zawyzony - NAPRAW (poprawny status: DECISION_REQUIRED/BLOCK; korekta przyjeta).
3 Brak tabeli n>=7 + load avg - NAPRAW (runda 2, stabilny host).
4 Brak rownowaznosci dynamicznej >=200 stanow i mutacji - NAPRAW (runda 2).
5 Testy regresji nie dotykaja zmiany - ODDAL (uwaga do pkt 4, nie osobny powod).
6 Brak logow gate - NAPRAW czesciowo: gate-tsc/equiv sa; brak logic/ai-test/war-allin hash i profili CDP top-15 (runda 2).
7 Dominujace koszty poza allowlista - DO DECYZJI CZLOWIEKA (poszerzenie allowlisty: resource-access.ts, units/setup.ts computePathImpl, auto-improvements.ts, render/; korekta Obrony: marchPathFor w ai.ts jest w allowliscie).
8 tyAll wspolny Map w oknie - ODDAL (konsument tylko czyta; domknac testem w rundzie 2).
9 Allowlista zachowana - ODDAL (pozytyw).
Wynik: >=1 NAPRAW -> FAIL.
BLOKADY: decyzja orkiestratora o allowliscie (pkt 7), stabilny host n>=7, sciezka headless/CDP dla rownowaznosci.
RUNDY: FC 1/5
NASTEPNY KROK: orkiestrator rozstrzyga allowliste -> Operator runda 2 z tym samym ID.
INTEGRACJA: NIE integrowac teraz. Gdyby po rundzie 2 integrowano: najpierw do main (baza ca289d8ce), dopiero potem relacja do origin/rust-port/parity-v2 (b520768b0, merge-base z main f4c89d008). Zmiana dotyka tylko gra/ (web), parity-v2 dotyczy rust-port, konflikt plikow nieoczekiwany.
DEPLOY/PUSH: NIE WYKONANO
