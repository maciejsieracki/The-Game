STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-WAR-WEARINESS-LIVE-AUDIT-Q1
GOAL: Wojny AI<->AI koncza sie pokojem, nie eliminacja; przegrywajacy szybko oferuje pokoj (zloto->surowce->miasta); zmeczenie symetryczne; brak snowballa.
ZMIANY/COMMIT: SHA do integracji 92fec64fa (na c46d334fa, baza 80919e2ae). Kod: war-weariness.ts, war-weariness-params.json, main.ts (1 linia w tickAiAiWarWeariness), 4 skrypty tools. Allowlista czysta. Brak zmian gra-robocza/WERSJE.md/rust-port.
TESTY (zweryfikowane samodzielnie na 92fec64fa, npm ci --ignore-scripts): ai-war-weariness-peace-test PASS=90 FAIL=0 (7j: karencja 40 -> 3 wojny, zostaje 3 miasta; karencja 10 -> 6 wojen, eliminacja); tsc --noEmit EXIT=0; diplo-war-peace-sim 22/0; diplomacy-peace-lock 9/0; ai-war-gate 24/0; war-allin-capital-quick EXIT=0, hash aiVsPlayer 0b2afc75febaa727 (zgodny); forced-war-bronze-main-guard 21 PASS/1 FAIL (preistniejacy: bronzeForceWarTargetId wystepuje 3x w main.ts zarowno na bazie, jak i w 92fec64fa; diff main.ts to 1 linia niezwiazana).
WERDYKT ZARZUTOW: Z1 ODDAL/naprawiony (karencja 40/100 przez istniejacy lockTurnsOverride, test 7i/7j + mutacje). Z5 ODDAL/naprawiony (test wielowojenny 7j). Z2, Z3, Z4 ODDAL: ograniczenia pomiaru (tura 1-3 min, swiat ~17 min), uczciwie NIE_ZMIERZONO; teza "T82 zamiast T128" wycofana; brak tezy o poprawie/braku snowballa. Zero NAPRAW.
BLOKADY (decyzje produktowe): karencjaPoPokojuTur 20/40(wdrozone)/60; karencjaChronionegoTur 60/100(wdrozone)/150; pelneTur 200(wdrozone)/150/120; ochronaMaxMiast 3(wdrozone)/2/4. NIE_ZMIERZONO: ziarna 2-3, oferta z miastem na zywo, koncentracja po zmianie karencji. Uwaga: 100-turowa karencja chronionego blokuje tez jego wlasne DOW wobec zwyciezcy.
RUNDY: 2/5 (FC)
NASTEPNY KROK: integracja orkiestratora 92fec64fa; kolejnosc: najpierw origin/main (15c99e09f), potem rust-port/parity-v2 (zmiany tylko web; REPIN dopiero po koncu weba). Zywy dopomiar >=2 ziaren jako osobny przebieg.
DEPLOY/PUSH: NIE WYKONANO
