STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-ERA-WAR-COUNTER-Q1
GOAL: Runda 3 wg dispatchu: (1) live test Kamienia zielony z dowodem Chromium PO wypowiedzeniu (powód widoczny w panelu Wydarzeń); (2) dwa live testy Brązu jawnie wyłączone flagą epok. Logika licznika NIETKNIĘTA.
ZMIANY/COMMIT: baza d2b6fa1b6 (kod r2 9ad6baa7e). Allowlista: gra/src/main.ts (1 blok: hak forceStoneForcedWarOnPlayer, +5 linii), gra/tools/war-era-counter-live-test.cjs, gra/tools/forced-war-player-target-live-test.cjs, gra/tools/forced-war-player-no-contact-live-test.cjs, gra/tools/war-rules-multiwar-main-guard-test.cjs, dyspozycje/autobot/runs/R-WEB-ERA-WAR-COUNTER-Q1/ (raport + zrzut). Brak zmian w gra-robocza/, WERSJE.md, rust-port/, src-tauri/, Cargo.toml. SHA: patrz commit poniżej. PUSH NIE.
TESTY:
- Przyczyna czerwieni live testu (ustalona zrzutem z tymczasowego logu, usuniętego): w turze 40 pula parowania zawierała tylko AI 1; gracz wypadał, bo `playerEpochWarEnabled` = false (sandbox ?playtest=mapa nie idzie przez doStartGame, który ustawia `?? true`). Naprawa w haku (tempo testu): `playerEpochWarEnabled = true`. Blokady NAP/pokój/sojusz były już wykluczone przy wyborze napastnika (pb=false w logu), więc nie trzeba ich dodatkowo kasować.
- tsc --noEmit: exit 0.
- war-era-counter-live-test (Chromium): 15 pass / 0 fail. Relacja po turze = wojna; karta "Wojna epoki (Kamień) — Grecy wypowiedziało wojnę" w DOM; zrzut dyspozycje/autobot/runs/R-WEB-ERA-WAR-COUNTER-Q1/war-era-hint-r3.png pokazuje kartę w panelu Wydarzeń (toast ukryty, bo EOT jest odraczany). Konsola czysta.
- forced-war-player-target-live-test / forced-war-player-no-contact-live-test: SKIP jawny (exit 0, komunikat, gdy "bronze" nie jest w enabledForcedWarEras). ZAŁOŻENIE: wybrano wariant „wyłączone flagą” zamiast przepięcia na Kamień (przepięcie = osobny temat).
- war-era-counter-test 82/0; war-rules-multiwar-test 57/0; war-rules-multiwar-main-guard 21/0 (baza 21/0; na r2 było 19/2); war-epoch-player-first-test 33/0; war-epoch-player-first-main-guard 33/1 = BAZA (slot newGameFlow); forced-war-stone 38/0, main-guard 19/0; forced-war-bronze 56/0, main-guard 28/0; forced-war-iron 58/0, main-guard 37/0; forced-war-trojstronna 23/0, main-guard 14/0; endturn-battle-deadlock 38/0; load-game-regression 34/0; load-game-blockers-exec 15/0; diplo-tick-war-brake 51/0 + unit 69/0; forced-war-reguly 50/0; forced-war-player-pre-contact-gate 45/0.
- Czerwone = baza (sprawdzone na drzewie 7164f7ca1 przez git archive): forced-war-waves 16/1 (ta sama asercja); forced-war-bronze-new-game-reset: ReferenceError forcedEraPeaceUntilNextEraByPairKey (identyczny błąd).
- ZMIANA ASERCJI (kryterium 7, jawnie): war-rules-multiwar-main-guard-test sprawdzał `canDeclareEraForcedWar` (globalny limit R3, już zniesiony przez `maxEraForcedWarsPerEra: null`). Zmieniono 2 asercje na `evaluateEraForcedWarGate` z `counts: eraWarCountByCivKey` (licznik per cywilizacja). Ogólne asercje nie osłabione.
- Live test: asercje kart rozluźniono do title lub subtitle (karta bywa `enemy` albo `info` z subtitle „⚔ Wojna epoki (Kamień)” zależnie od ścieżki odroczenia EOT; obserwowane w dwóch przebiegach).
BLOKADY: brak.
RUNDY: nr 3/5 wg dispatchu. Uwaga: nagłówek zadania mówił „Runda 1/5” i raport 01-operator-r1.md; dispatch (treść i stan) dotyczy rundy 3, a plik r1 zachowano bez zmian (zapisano 01-operator-r3.md).
NASTĘPNY KROK: Evaluator (Sonnet 5.5) odtwarza live test i bramki z tabeli, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
