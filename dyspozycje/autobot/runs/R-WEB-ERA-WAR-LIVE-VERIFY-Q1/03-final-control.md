STATUS: FAIL
DOMAIN: GAME (WEB), weryfikacja na zywo
TEMAT: R-WEB-ERA-WAR-LIVE-VERIFY-Q1
GOAL: Potwierdzic w prawdziwej grze, ze wojna epoki w Brazie i Zelazie wybucha po FALA 536.
ZMIANY/COMMIT: oceniany 2235c7b1a (tylko forced-war-player-target-live-test.cjs + katalog runu; allowlista zachowana, gra/src bez zmian - sprawdzone git diff --name-only fcaa10300 2235c7b1a). Final Control dodaje wylacznie ten plik.
TESTY: samodzielnie zweryfikowane statycznie: forced-war-iron-player-target-live-test.cjs:247 i forced-war-player-no-contact-live-test.cjs:284 nadal czytaja getWarEventLogHead() (slice 0..3, main.ts:25986); getWarEventLog() istnieje (main.ts:26995). Pelnego przebiegu live FC nie powtarzal (wolne 2.8 GB, ryzyko progu 2 GB przy npm ci + vite); opieram sie na przebiegu Evaluatora (niezalezny, zgodny z diagnoza kodu): baza player-target 8/4, z patchem hookow 12/0; iron 11/1; no-contact NIE_ZMIERZONO.

ZARZUTY - rozstrzygniecie:
1. Iron test nie naprawiony, raport 12/0 niezgodny z commitem - NAPRAW (iron i no-contact: ta sama zmiana zrodla odczytu logu co w player-target, asercji nie oslabiac; zmierzyc no-contact).
2. Cel Zelaza nieudowodniony (log: "Wojna epoki (Braz)", brak asercji na tag epoki / ironForceWarActiveByPairKey) - NAPRAW: albo asercja na etykiete "(Zelazo)"/pare w ironForceWarActiveByPairKey w tescie iron, albo raport zmienia twierdzenie na NIE_ZMIERZONO dla Zelaza. Zdanie "w Brazie i w Zelazie wojna wybucha w pierwszej turze" usunac/skorygowac.
3. Status PASS-WITH-NOTES nieuzasadniony: zielone wyniki tylko z niecommitowanym eksperymentem poza allowlista - NAPRAW status raportu: BLOCK (potrzebny osobny temat na hooki) z jawna propozycja R-WEB-TEST-HOOK-PLAYER-EPOCH-WAR-Q1 (3 linie playerEpochWarEnabled = true w hookach, main.ts ~26013/26115/26202). Propozycja tematu to DECISION dla orkiestratora/wlasciciela, nie dla Operatora.
4. Liczby bazowe player-target (9/3 vs 8/4) - NAPRAW w raporcie (poprawic na 8/4 po zmierzeniu; powod: pusty log).
Uwaga poboczna (ODDAL do osobnego tematu, nie blokuje): main.ts:44944 wczytuje playerEpochWarEnabled z zapisu jako === true - stary zapis bez pola da false; do zbadania osobno jako potencjalny problem rozgrywki.

BLOKADY: poprawka hookow w gra/src/main.ts poza allowlista tematu - wymaga osobnego tematu; do tego czasu 3 testy live czerwone na etapie D.
RUNDY: 1/5 (FC); wraca do Operatora R2 z tym samym ID, potem Evaluator, FC.
NASTEPNY KROK: Operator R2: naprawic odczyt logu w iron i no-contact, dodac dowod tagu epoki Zelaza (albo NIE_ZMIERZONO), uruchomic 3 testy (z hookami tylko jako niecommitowany eksperyment), skorygowac raport i status. Integracja: brak - nic do wlaczenia; SHA 2235c7b1a NIE jest gotowy do integracji. Kolejnosc wzgledem origin/rust-port/parity-v2: temat dotyczy galezi main/gra (merge-base z parity-v2 = f4c89d008), brak zaleznosci; integrowac niezaleznie, przed lub po parity-v2, dopiero po PASS R2.
DEPLOY/PUSH: NIE WYKONANO
