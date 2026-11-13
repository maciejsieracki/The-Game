STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-DEFEND-RECAPTURE-ATTACK-PRIORITY-Q1
GOAL: S1 obrona -> S2 odzyskanie -> S3 utrzymanie -> atak; odwolanie armii; kontakt wymagany.
ZMIANY/COMMIT: kod 7f9eca8d5 (potomek 335e26a13, potomek bazy 92d54adc8). Allowlista zachowana (ai.ts, ai-war-home-defense.ts, cities.ts, main.ts, 3 testy, nowy test, run). Brak gra-robocza/WERSJE.md/rust-port. git diff --check czysty.
TESTY (odtworzone przez FC): ai-defend-recapture-attack-priority 55/0, ai-war-defend-home 30/0, ai-home-war-sees-own-land 4/4, ai-fog 9/9, ai-test 289/0, logic-test 213/213, ai-home-defense-vs-barbarians 46/0, civilian-filter 8/0, tsc --noEmit 0 bledow.
ZARZUTY: 1 KONTAKT ODDAL (hasContactWith ai.ts/main.ts, T10, T11); 2 S1/S2/S3 ODDAL (ownTerritoryClassOf cities.ts, runP2(true)->P1->runP2(false), T8/T9); 3 mgla ODDAL (cityTerritoryRadius, po areEnemyOwners); 4 test A/B/C ODDAL (T12); 5 brzeg B->C ODDAL (T8); 6 testy stanow ODDAL; 7 raport/pomiar ODDAL (cloud-gather NIE_ZMIERZONO); 8 threatOwners bez kontaktu ODDAL (naprawione); 9 migracja zapisow ODDAL (udokumentowane ograniczenie, skala NIE_ZMIERZONO).
BLOKADY: brak.
UWAGI: S2 wait-gather pobiera cala pule, S3 moze nie dostac jednostek do konca wait (zgodne z kolejnoscia wlasciciela). Brak 02-operator-r2.md w runie.
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora; zero zmian rust-port, wiec kolejnosc wzgledem origin/rust-port/parity-v2 dowolna.
DEPLOY/PUSH: NIE WYKONANO
