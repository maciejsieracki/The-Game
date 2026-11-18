# R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 — raport Operatora (runda 1/5)

STATUS: BLOCK (częściowe: moduł i testy gotowe; okablowanie GOAL 2–3 i docs GOAL 5 NIE wykonane)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1
GOAL: płatność ostatniego stopnia ceny pokoju: miasta → złoto → brąz → żelazo → rudy; nigdy ostatnie miasto; brak zapasów = niedobór.
ZMIANY-COMMIT: baza c8b0e498b (origin/main). Pliki: gra/data/war-weariness-params.json (blok ogonPokoju.kolejnosc), gra/src/game/peace-tail-payment.ts (nowy, funkcja settlePeaceDue), gra/tools/diplo-peace-last-stage-payment-test.cjs (nowy), raport. Commit: patrz SHA w polu sha.
TESTY (liczby z surowego wyjścia):
- tsc --noEmit: exit 0
- diplo-peace-last-stage-payment-test: LIVE 10/10; mutanty M1 (odwrócona kolejność), M2 (ignorowanie forbidden), M3 (brak limitu zapasami) wykryte; OK
- diplo-peace-pw-power-ratio: 48 PASS / 0 FAIL
- diplo-peace-price-wiring: PASS=14 FAIL=0
- diplo-peace-price-decay: PASS=13 FAIL=0
- diplo-peace-balance-accept: 32 pass / 0 fail
- diplo-winner-proposal-table: PASS=77 FAIL=0
- diplomacy-sensible-deals: 63 passed, 0 failed
- diplo-weariness-city-only: PASS=26 FAIL=0 (asercja (b) „bez złota” nadal obowiązuje, bo okablowania nie zmieniano)
- diplo-war-peace-sim: 25 pass / 0 fail
- diplo-wiki-weariness-rate-consistency: FAIL 0
- logic-test: exit 0 (ostatnia linia [213]); tech-tree-test 20/0; research-test 33/33; unit-replace-test exit 0; combat-test exit 0
ZMIERZONO: powyższe. NIE ZMIERZONO: Chromium/UI, ścieżki AI i gracza w grze (brak okablowania).
BLOKADY:
1. Brak okablowania do ai.ts (aiPeaceCityDuePn / plan miast AI) i diplomacy-proposals.ts — settlePeaceDue nie jest jeszcze wywoływany; zachowanie w grze bez zmian.
2. Brak wyceny PN za sztukę w okablowaniu (plan: diplomacy-value-catalog, diplomacyPnSurowiecIlosc(key, krok)/krok) i zapasów płatnika (Spichlerz/Skarbiec, main.ts) — wymaga przeglądu kodu zapasów.
3. Brak tooltipa „Dopłata: X złota, Y rudy żelaza” w diplomacyAcceptanceBalance.ts (GOAL 3).
4. Brak wpisu w rozejm-pokoj.md i generowania wikiBundle (GOAL 5).
ZAŁOŻENIA (do potwierdzenia):
- w ogonie NIE ma technologii, pracy ani ¤ — tylko złoto i metale/rudy;
- kolejność rud przyjęta: ruda miedzi (ruda) → ruda cyny (ruda_cyny) → ruda żelaza (ruda_zelaza);
- stal (Stal) w resources.json istnieje, ale nie jest na liście właściciela — pominięta.
- test „zmęczenie (b): bez złota” zostaje zielony, bo logika miast nie zmieniona; po okablowaniu asercja (b) może wymagać dopasowania (klasa A, uzasadnić w raporcie).
RUNDY: 1/5
NASTĘPNY KROK: runda 2 — okablowanie settlePeaceDue w ścieżce AI (aiPeaceCityDuePn) i gracza (stół), wycena + zapasy płatnika, tooltip, docs rozejm-pokoj.md + wikiBundle.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA (ABC do właściciela):
A. Potwierdzić, że ogon = wyłącznie złoto/brąz/żelazo/rudy (bez technologii, pracy, ¤)?
B. Kolejność rud: miedzi → cyny → żelaza — OK?
C. Czy stal ma wejść do ogona (dziś pominięta)?
D. Czy wycena per sztuka ma być z diplomacy-value-catalog (cena za blok / krok), czy inna?
E. Dane w war-weariness-params.json: „1.0” zapisane jako „1” (przy przepisaniu JSON) — bez wpływu na wartość.
