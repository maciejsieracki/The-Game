STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-ERA-WAR-COUNTER-Q1
GOAL: Final Control po rundzie 4 (Operator r4 4ce25037f; EV r3 PASS-WITH-NOTES, 4 uwagi nieblokujace).
ZMIANY-COMMIT: oceniany 4ce25037f (nad 01695e1c1; baza webu 7164f7ca1). r4 zmienia tylko gra/tools/war-era-counter-live-test.cjs i war-era-hint-r4.png (allowlista OK, brak zmian WERSJE.md/rust-port/gra-robocza).
ROZSTRZYGNIECIE ZARZUTOW:
1. ODDAL/rozwiazane w r4: petla zamykajaca preBattle + asercja braku .pb-overlay; zrzut r4 obejrzany: karta "Wojna epoki (Kamien) - Grecy wypowiedzialo wojne" w Wydarzeniach czytelna, bez nakladki.
2. ODDAL: hak tylko w window.__eraTestDebug; domyslne wartosci produkcyjne poza diffem.
3. ODDAL: skip Brazu dopuszczony dispatchem (flaga + uzasadnienie w naglowku); przepiecie na Kamien = osobny temat.
4. ODDAL: main-guard 33/1 baseline (newGameFlow.ts bez zmian wzgledem bazy).
Zadnego NAPRAW.
TESTY (wlasne, na 4ce25037f, npm ci): tsc --noEmit exit 0; war-era-counter-test 82/0; war-rules-multiwar 57/0; war-rules-multiwar-main-guard 21/0. war-era-counter-live-test: NIE ODTWORZONY u mnie (dwa przebiegi, zamkniecie/zawieszenie przegladarki w fazie A2 fast-forward do tury 39, timeout 300/400 s przy obciazonym srodowisku); opieram sie na EV r3 (15/0), Operatorze r4 (16/0) i obejrzanym zrzucie r4; diff r4 przejrzany: zmiana wylacznie w zamykaniu modali i asercji, src/ nietkniete od r3. NIE_ZMIERZONO: pozostale bramki (zielone w r3, src bez zmian).
BLOKADY: brak.
RUNDY: FC po r4 (4/5).
NASTEPNY KROK: integracja orkiestratora. SHA do integracji: 4ce25037f66021b4b391b57707aba3891fd2f4dd (+ commit dokumentacyjny z tym plikiem). Wzgledem origin/rust-port/parity-v2 (1dd3c12c6): niezalezne (tylko gra/ i dyspozycje/, merge-base f4c89d008), kolejnosc dowolna.
DEPLOY-PUSH: NIE WYKONANO
