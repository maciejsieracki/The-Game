# R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 — obrona Operatora (runda 2)

STATUS: BLOCK (częściowe: zarzuty 4 i 6 przyjęte i zrobione, zarzuty 1, 2, 3, 5 przyjęte, NIE ZROBIONE w tej rundzie)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1
GOAL: DODATEK 2 (ogon pokoju po miastach: ścieżka gracza, AI, AI↔AI, tooltip, Civpedia). Start a4737ee6e.
ZMIANY-COMMIT: 1552e8d67 (main.ts: payerStock.zloto = ownerTreasury(proposerId); rozejm-pokoj.md; wikiBundle.json regenerowany generatorem). Raport: ten plik.
TESTY (liczby z surowego wyjścia, ZMIERZONO):
- tsc --noEmit: exit 0, 0 błędów.
- logic-test: 213 PASS, 0 FAIL. tech-tree-test: 20 pass / 0 fail. research-test: 33/33. combat-test: exit 0. unit-replace-test: exit 0 (matryca bez wycieków).
- diplo-peace-tail-proposal-test: 6 pass / 0 fail. diplo-peace-weaker-seeks-city-only-test: 35 pass / 0 fail.
- diplo-peace-pw-power-ratio: 48 PASS / 0 FAIL. diplo-weariness-city-only: PASS=26 FAIL=0. diplo-peace-balance-accept: 32/0. diplo-peace-price-wiring: PASS=14 FAIL=0. diplo-wiki-weariness-rate-consistency: PASS.
- NIE ZMIERZONO: diplo-war-peace-sim (pomiar ≥3×150 tur), Chromium, test okablowania main.ts.

ODPOWIEDZI NA ZARZUTY:
1. Ścieżka AI niepodłączona — PRZYJMUJĘ, NIE ZROBIONE. Zgadzam się z dowodem (settlePeaceDue nie jest wywoływane poza importem). Nie wykonane w tej rundzie: ai.ts (aiPeaceCityDuePn, ok. 6677 i 7150–7191) wymaga przepięcia na settlePeaceDue z ogonem; wymaga osobnego przeglądu i testów.
2. AI↔AI niezrobione — PRZYJMUJĘ, NIE ZROBIONE. war-weariness.ts (peaceAiAiPaymentPn) i runAiAiPeaceTick nie zmienione.
3. Tooltip „Dopłata” — PRZYJMUJĘ, NIE ZROBIONE. diplomacyAcceptanceBalance.ts bez zmian.
4. Civpedia — PRZYJMUJĘ, ZROBIONE (1552e8d67). Zdania o „jedynym słodziku”/„złoto nie kupuje pokoju” (linie 18 i 40) zastąpione regułą ogona; rozejm nadal bez złota i surowców; wiersz „2,5% na turę” nietknięty. wikiBundle wygenerowany `node tools/bundle-wiki-for-game.cjs`. UWAGA: hasło opisuje regułę docelową; ścieżka AI jeszcze jej nie realizuje (zarzut 1).
5. Ścieżka gracza bez składania ogona z reszty — PRZYJMUJĘ, NIE ZROBIONE. Nie dodano funkcji składającej ogon z pozostałej D (settlePeaceDue nie jest w diplomacy-proposals.ts). Obecnie ogon liczy się wyłącznie z pozycji podanych w ofercie.
6. Zapasy płatnika — PRZYJMUJĘ, CZĘŚCIOWO ZROBIONE. Błąd potwierdzony: ownerResourceStock sumuje c.surowce miast, a złota tam nie ma (złoto jest w player.skarbiec / aiSkarbiecByOwner). Poprawka: zloto = ownerTreasury(proposerId). ZOSTAŁO: (a) brąz/żelazo/rudy = suma zapasów miast; NIE ZMIERZONO, że to Spichlerz państwa; (b) płatnikiem zawsze proposer — nie zmieniono (AI proponujące graczowi, płacący gracz nadal źle wycenione); (c) brak testu okablowania main.ts (tylko tsc).

ZAŁOŻENIE / UWAGA: steel („Stal”) istnieje w danych (resources.json, diplomacy-acceptance-points.json koszyk: "stal": 25). Pominięty w ogonie zgodnie z kolejnością właściciela (złoto → brąz → żelazo → rudy); nie dodawano.

BLOKADY: zarzuty 1, 2, 3, 5 i część 6 wymagają kolejnej rundy. Dla PASS potrzebne: przepięcie ai.ts i war-weariness.ts na settlePeaceDue, składanie ogona w stole gracza, tooltip, test sim AI↔AI.
RUNDY: 2/5 (obrona nr 2; licznik porażek Haiku NIE ZMIERZONO — orkiestrator ustala).
NASTĘPNY KROK: runda 3 Operatora na zarzutach 1, 2, 3, 5 i reszcie 6, potem Evaluator.
DEPLOY/PUSH: NIE WYKONANO
