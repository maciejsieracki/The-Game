STATUS: PASS
DOMAIN: GAME (WEB) - weryfikacja na zywo
TEMAT: R-WEB-ERA-WAR-LIVE-VERIFY-Q1
GOAL: Potwierdzic w realnym Chromium, ze wojna epoki (Brąz/Żelazo) wybucha w prawdziwej grze po FALA 536.
ZMIANY/COMMIT: (runda 2, baza c99486c59; SHA: git log tego brancha, commit "R-WEB-ERA-WAR-LIVE-VERIFY-Q1 r2")
 - gra/src/main.ts (rozszerzona allowlista, dlug testowy): (a) hooki forceBronzeForcedWarOnPlayer / ...NoContact / forceIronForcedWarOnPlayer dostaja `playerEpochWarEnabled = true;` (jak forceStoneForcedWarOnPlayer); (b) forceIronForcedWarOnPlayer dodatkowo inscenizuje WYLACZNIE Zelazo: kasuje pending/cykl Brazu i Kamienia napastnika i ustawia ownerStartEra=ownerEra=3; (c) wczytanie zapisu: brak pola playerEpochWarEnabled = true (domyslna nowej gry), jawny boolean zachowany.
 - gra/tools/forced-war-player-target-live-test.cjs (pelny log zamiast Head, z r1), forced-war-iron-player-target-live-test.cjs i forced-war-player-no-contact-live-test.cjs (getWarEventLog() z fallbackiem; asercje nieoslabione); iron + NOWA asercja tagu epoki "Żelazo".
 - gra/tools/war-epoch-player-first-main-guard-test.cjs: bramka "stary zapis" zaktualizowana do nowej reguly (wykonuje realna linie: meta {}/undefined -> true, jawny false -> false, jawny true -> true) + 2 mutacje.
 - usuniety hook-fix-proposal.patch (zastosowany).
TESTY (Chromium /opt/pw-browsers/chromium-1194, jedna przegladarka naraz, tlo + petla):
 - forced-war-player-target-live-test: 12 pass / 0 fail, EXIT=0
 - forced-war-player-no-contact-live-test: 14 pass / 0 fail, EXIT=0
 - forced-war-iron-player-target-live-test: 13 pass / 0 fail, EXIT=0 (w tym nowa asercja: wszystkie wpisy "Wojna epoki (X)" maja X="Żelazo"). Bez poprawki hooka zelaznego: 12/1, log "Wojna epoki (Brąz)" (zarzut 2 FC potwierdzony i wyjasniony nizej).
 - war-epoch-player-first-main-guard 35/0; iron/bronze/stone/trojstronna main-guard: 35/0, 22/0, 15/0, 14/0; tsc --noEmit czysto.
 - Uwaga: po ostatniej zmianie (tylko forceIronForcedWarOnPlayer) player-target i no-contact nie byly powtarzane; ich wyniki pochodza z buildu z poprawkami playerEpochWarEnabled.
FAKTY: Brąz i Żelazo: fast-forward do tury 39, jeden realny endTurn -> tura 40 = relacja "wojna" (1 tura po progu R1=40). Gracz widzi: wpis w dzienniku zdarzen "Wojna epoki (Brąz|Żelazo): Grecy wypowiada wojne" (kind info) ORAZ dedykowana karte kind:"enemy" ("Wojna epoki (Żelazo) — ... wypowiedziało wojnę"). Toast z zalozenia odkladany w fazie AI (shouldDeferEotEvents); trwalym dowodem jest karta w panelu Wydarzen. Konsola czysta.
PRZYCZYNA "Brąz zamiast Żelaza": inscenizacja hooka, nie blad rozgrywki. Pule parowania (main.ts ~38624) maja kolejnosc bronze, stone, iron; hook dodawal tylko pending Zelaza, a napastnik byl realnie w epoce 1/2 - w trakcie tury syncOwnerEraFromResearch (prev 1 -> next 2, main.ts ~2355) ponownie dodawal pending Brazu, ktory wygrywal. W realnej grze pending Zelaza powstaje po wejsciu w epoke >=3, wiec konflikt nie zachodzi. Samo skasowanie pending Brazu nie wystarczylo (nadal Brąz); dopiero ustawienie epoki 3 dalo "Żelazo".
STARE ZAPISY: potwierdzone - main.ts (~44944) mapowal brak pola na false (=== true), wiec zapis bez pola wypadal z puli wojen epoki. Naprawione (brak pola = true, jawny false = false); test: bramka war-epoch-player-first-main-guard. Zmiana wzgledem decyzji K2 "stary zapis = WYLACZONA" - na polecenie orkiestratora.
BLOKADY: brak. Bledu gry nie wykryto. Sprzatanie: usunieto gra/node_modules i gra/dist-forced-war-*; wolne ok. 2.6 GB.
RUNDY: 2/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
