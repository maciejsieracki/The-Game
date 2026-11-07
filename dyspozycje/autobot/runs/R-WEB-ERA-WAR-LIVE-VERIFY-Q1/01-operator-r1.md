STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) - weryfikacja na zywo
TEMAT: R-WEB-ERA-WAR-LIVE-VERIFY-Q1
GOAL: Potwierdzic w realnym Chromium, ze wojna epoki (Kamien/Braz/Zelazo) wybucha w prawdziwej grze po FALA 536 (main fcaa10300).
ZMIANY/COMMIT: tylko gra/tools/forced-war-player-target-live-test.cjs (szersze okno odczytu warEventLog: __rebelNotifyTestDebug.getWarEventLog(), fallback getWarEventLogHead; asercja BEZ zmian) + ten raport. SHA: patrz git log tego brancha (commit "R-WEB-ERA-WAR-LIVE-VERIFY-Q1 r1"). gra/src NIE zmieniony.

TESTY (Chromium /opt/pw-browsers/chromium-1194, baza fcaa10300, 1 przegladarka naraz, tlo + petla):
A. Stan BAZOWY (bez zmian): wszystkie 3 testy FAIL.
 - player-target: 9 pass / 3 fail; no-contact: 11/3; iron-player-target: 8/4.
 - We wszystkich: relacja po turze = "neutralni" (wojna NIE wybuchla), konsola: "[Wojna wymuszona] DECISION_REQUIRED: brak niezablokowanej sojuszem pary ... dla ownerow [1]" (main.ts:38718).
B. Diagnoza (eksperyment, cofniety): hooki testowe forceBronzeForcedWarOnPlayer, ...NoContact, forceIronForcedWarOnPlayer (gra/src/main.ts ~26013, ~26115, ~26202) NIE ustawiaja `playerEpochWarEnabled = true`, w przeciwienstwie do forceStoneForcedWarOnPlayer (main.ts:26086). Sandbox ?playtest=mapa nie przechodzi przez doStartGame (domyslnie true), wiec flaga zostaje false i assignForcedWarPairings (main.ts ~38631) wyrzuca gracza z puli -> brak pary. To DLUG HOOKA TESTOWEGO w src/main.ts, NIE blad rozgrywki (w nowej grze opcja domyslnie ON, newGameFlow.ts:2186 / main.ts:42758).
C. Z tymczasowym `playerEpochWarEnabled = true;` w 3 hookach (patch: scratchpad hook-fix.patch, NIE zacommitowany, poza allowlista) + naprawa testu (pkt ZMIANY):
 - forced-war-player-target-live-test (Braz, gracz): 12 pass / 0 fail, EXIT=0
 - forced-war-player-no-contact-live-test (Braz, bez kontaktu): 14 pass / 0 fail, EXIT=0
 - forced-war-iron-player-target-live-test (Zelazo): 12 pass / 0 fail, EXIT=0
D. Fakty z przebiegu: wojna epoki w Brazie i Zelazie wybucha w 1. turze po progu R1: fast-forward do tury 39, jeden realny endTurn -> tura 40 = wojna (relacja "wojna"). Czyli 1 tura od progu / 0 tur zwloki po spelnieniu warunkow. Gracz widzi: wpis w dzienniku wydarzen "Wojna epoki (Braz): Grecy wypowiada wojne" (eot-hint-40-1, kind info) ORAZ dedykowana karte kind:"enemy" (war-40-...). Toast #civ-hint-toast istnieje w DOM, ale hinty fazy AI sa z zalozenia odkladane (shouldDeferEotEvents) - trwalym dowodem jest karta w panelu Wydarzen. Konsola czysta (0 error/pageerror).
 - Przyczyna pierwotnego FAIL asercji "kind enemy" w player-target: getWarEventLogHead() obcina do 3 wpisow, a w turze DOW 3 wpisy eot-hint-* (Glod wojska, Wojna epoki, Wrog atakuje) spychaja karte enemy poza okno. Dług testowy, naprawiony w tescie bez oslabiania asercji.
 - UWAGA: przy naprawionym tescie, ale BEZ poprawki hooka, test nadal FAIL na etapie D (hook). Zatem stan w repo po moim commicie: 3 testy nadal czerwone dopoki nie zostanie poprawiony hook (osobny temat).

BLOKADY: Poprawka hooka (3 linie w gra/src/main.ts) jest poza allowlista - wymaga osobnego tematu (proponowany: R-WEB-TEST-HOOK-PLAYER-EPOCH-WAR-Q1; tresc: dodac `playerEpochWarEnabled = true;` po `const attackerId = attacker.ownerId;` w trzech hookach). Bledu gry nie wykryto.
Sprzatanie: usuniete gra/dist-forced-war-*, gra/node_modules. Dysk wolny 5.4 GB (>2 GB).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (potwierdzic diagnoze i patch hook-fix.patch); osobny temat na poprawke hooka w main.ts + ponowny przebieg 3 testow.
DEPLOY/PUSH: NIE WYKONANO
