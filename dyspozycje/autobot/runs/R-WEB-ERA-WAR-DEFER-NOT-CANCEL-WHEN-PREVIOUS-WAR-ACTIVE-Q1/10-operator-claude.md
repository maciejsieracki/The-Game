STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-DEFER-NOT-CANCEL-WHEN-PREVIOUS-WAR-ACTIVE-Q1
GOAL: Wojna epoki Brązu/Żelaza, gdy trwa wojna poprzedniej epoki, ma być PRZESUNIĘTA (pending pamiętany), nie anulowana.
ZMIANY/COMMIT: brak zmian kodu. Commit tylko tego raportu. Baza: 2ab6e3a05ffc37bf4efb3d1f90ad0f6b8782739a.
TESTY: NIE WYKONANO (nie odtworzono mechanizmu utraty; era-war-defer-not-cancel-test.cjs nie powstał; bieg dymny 120 tur NIE ZMIERZONO).
BLOKADY: (1) statyczna diagnoza nie wskazała miejsca, gdzie pending Brązu jest kasowany przy odroczeniu. (2) Wolne miejsce na / = 5.7 GB (poniżej progu 8 GB dla Rust; web wymaga 4 GB).
DIAGNOZA (kod, 2ab6e3a05):
- Ustawienie pending: gra/src/main.ts:2672 (awans Kamień->Brąz, jednorazowo).
- Kasowanie pending: tylko przy faktycznym wypowiedzeniu (main.ts:47026, :30494-30495) lub eliminacji (:39882) oraz w hakach dev (:30278, :30358). Odroczenie NIE kasuje pending.
- Odroczenie: main.ts:45405-45420 shouldSearch = isEligibleForBronzeForcedWar(... isAlreadyAtWarAnyRole = countActiveWarsForOwnerExcludingBarbarians > 0). Gdy owner jest w dowolnej wojnie, subject nie wchodzi do puli, pending zostaje.
- Pula: forced-war-common.ts ok. 300 assignForcedWarPairings (warless = totalActiveForcedWarsByOwner === 0 i !exhausted); main.ts:45530-45533 (totalActiveForcedWarsForPairing), :45637 (isEraWarExhausted = isOwnerInActiveEraWar || !canCivJoinEraForcedWar).
- Ponowna próba: main.ts:46690-46700 (komentarz B4): wasPending nie jest kasowany przy próbie.
WNIOSEK: w statycznym przeglądzie pending przeżywa odroczenie. Utrata wojny w grze musi więc wynikać z warunku, który na żywo gubi subject przed przydziałem, albo z przydziału, który nie kończy się wypowiedzeniem. Nie udało się tego odtworzyć bez biegu. Kandydaci do sprawdzenia w rundzie 2: (a) isAlreadyAtWarAnyRole liczy też wojny naturalne AI (main.ts:45394), więc odroczenie trwa na czas dowolnej wojny, nie tylko epoki; (b) ścieżka warLimitAllowsDeclaration / gateForcedTagAny w ownerLoop (main.ts ok. 46960-46985) zwraca continue bez logu; (c) blokada pary forcedEraPeaceLock (forced-war-common.ts ok. 155-180) po pokoju Kamienia.
ZALOŻENIE: pending przeżywa odroczenie (zgodnie z R1/R4); luka leży w (a)-(c), do potwierdzenia testem odtwarzającym.
NASTĘPNY KROK: runda 2 Operatora: test odtwarzający Kamień trwający w chwili startu Brązu (forced-war-common.ts + main.ts ścieżki ok. 45405 i 46960), potem poprawka R1-R5 i bieg dymny seed 4242 do 120 tur (bundle poza repo, CHROME_PATH=/usr/bin/google-chrome).
UWAGI-DLA-ORKIESTRATORA: brak zgłoszeń poza zakresem. Zakaz nowych sesji przestrzegany (nie wywołano spawn_task, create_session, create_trigger).
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5
