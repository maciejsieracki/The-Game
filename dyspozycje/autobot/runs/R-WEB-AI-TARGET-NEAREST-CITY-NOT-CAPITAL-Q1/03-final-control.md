STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-TARGET-NEAREST-CITY-NOT-CAPITAL-Q1
GOAL: AI w wojnie z graczem lub inna AI idzie na najblizsze miasto wroga, nie na stolice; barbarzyncy jako atakujacy bez zmian.
ZMIANY/COMMIT: kod operatora cad7a4e92 (rodzic 54cdf4abd, baza 8dad78b3a; przodek sprawdzony). Pliki: ai-war-target-select.ts, warAllInCapital.ts (komentarz), ai.ts (targets kampanii), main.ts (prepareAiGeneralWarCampaign + komentarz), ai-target-nearest-city-test.cjs, ai-war-nearest-city-peace-2t-test.cjs (A5), run-dir.
ALLOWLISTA: rozszerzenie zatwierdzone (prepareAiGeneralWarCampaign, appendAiGeneralCampaignOrders + typ opts) - konieczne dla zarzutu 1 Evaluatora; zakres tylko wybor celu.
ZARZUTY: Z1 kampania wodza na stolice -> ODDAL (naprawione w cad7a4e92; sciezka uzywa buildWarCityTargets). Z2 brak testu kampanii -> ODDAL (C1-C4 na prawdziwym decideAITurn, stage attacking; C4 bez targets = stolica, wiec C1 dyskryminuje). Z3 brak pomiaru w grze -> ODDAL jako NIE_ZMIERZONO (bez DECISION). Z4 pkt (a) -> ODDAL (tabela w 02-operator-r2.md). Z5 war-allin-capital-test 96/2 -> odtworzone: identyczne 2 FAIL (6b hash flagi OFF) na bazie 8dad78b3a, nie regresja.
TESTY (wlasne, FC, na cad7a4e92): ai-target-nearest-city 18/18; ai-general-war-campaign 51/0; ai-war-nearest-city-peace-2t PASS, mutacje 16/16; ai-war-gate 24/0; ai-war-defend-home 30/0; ai-defend-recapture-attack-priority 55/0; war-allin-keep-barb-defense 8/0; war-allin-general-path-barb-defense 24/0; war-allin-capital-regress niezielone 0; logic-test 213/213; ai-test 289/0; war-allin-capital-test 96/2 (jak baza). tsc: srodowisko bez typow three -> 172 bledow (TS7016/7006/18046), zadnego w zmienionych liniach (main 7458-7600, ai.ts 510/5043-5090); EXIT 0 z pelnym toolchainem NIE_ZMIERZONO. git diff --check czysty.
UWAGI: cele kampanii nie sa filtrowane per miasto pod katem osiagalnosci (jak w warAllInContextFor; filtr dotyczy tylko stolicy przy wyborze wlasciciela) - spojne z war-allin, do obserwacji w grze. Pomiar behawioralny w grze NIE_ZMIERZONO.
BLOKADY: brak
RUNDY: 2/5 (Final Control PASS-WITH-NOTES)
KOLEJNOSC INTEGRACJI: SHA do integracji = cad7a4e92 (kod) -> merge na origin/main 0679666ac (merge-tree czysty, bez konfliktow; main zmienil tylko turn-economy.ts i main.ts w innych miejscach). Zmiana tylko web (gra/); origin/rust-port/parity-v2 (bf9298737) niezalezne - kolejnosc: najpierw main, REPIN Rust (ai-war-target) dopiero po integracji.
NASTEPNY KROK: integracja orkiestratora (merge cad7a4e92 do main, ponowny gate po merge), deploy ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO
