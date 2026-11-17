# R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1 — Final Control r3 (Sonnet)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1
GOAL: stół pokoju pokazuje zmęczenie wojną jako pozycję PW (Z = round(C·x²)) po stronie nieproponującej; tabela = decyzja AI; rabat 60% usunięty; „bezwarunkowy” z tej samej funkcji x.
ZMIANY/COMMIT: kandydat 25cabd622 (kod 00ab099ad + raport 25cabd622; potomek a4d48e275 -> 95f3823f9 -> 12baa4d15; baza kodu c9c161ec3). 572be1b92 (raport FC r1) NIE jest przodkiem kandydata (to commit raportu, nie kodu) — nieistotne dla kodu. origin/main poszedł dalej (8bb750767); git merge-tree: jedyny konflikt gra/src/data/wikiBundle.json (regeneracja narzędziem gra/tools/bundle-wiki-for-game.cjs). integration_sha = 25cabd622.
Allowlista: diff vs c9c161ec3 obejmuje ai.ts (1 komentarz), diplomacy-proposals.ts, war-weariness.ts, main.ts (typ + przekazanie pól), ui/diplomacyAcceptanceBalance.ts, ui/diplomacyAudience.ts (typ), war-weariness-params.json (opisy + usunięty klucz rabatCenyPokojuMax), wikiBundle.json, docs/encyklopedia/pojecia/zmeczenie-wojna.md, testy gra/tools/*, runs/<ID>/**. Poza literalną allowlistą dispatchu: gra/tools/pw-weary-table-browser-* (3 pliki, narzędzie dowodowe) — akceptowane (tylko testy).

## Werdykt per zarzut
1. AI->gracz — ODDAL (zrobione): diplomacy-proposals.ts liczy Z dla autora AI i respondenta gracza (wearinessSide='player'), wiersz w kolumnie gracza; test (f) behawioralny i (u5) UI zielone. Założenie: C bez mnożnika cywilizacji (DO POTWIERDZENIA).
2. Zrzuty z gry — ODDAL dla wczesnej i późnej wojny: evidence/live-wczesna-pn-panel.png (t11, „Zmęczenie wojną (AI) +13 PW”) i live-pozna-pn-panel.png (t15, +330 PW) obejrzane; pochodzą z gry (CSS gry, ?civTest=1, realna ścieżka previewNegotiationEntry). NIE ZMIERZONO w grze: stan silniejszej AI (tylko harness komponentowy; stol-silna.png ma artefakty „undefined”; live-silna-pn-panel.png pokazuje słabszą AI). Notatka, nie FAIL: komunikat silnej AI jest testowany behawioralnie (b3).
3. Silniejsza AI (wariant A) — DO DECYZJI CZŁOWIEKA: realna decyzja produktowa (zmęczenie nie obniża ceny dla silnej AI; wiersz Z nie jest pokazywany, więc tabela nie obiecuje bilansu 0). Zgodne z DODATKIEM.
4. Jedna prawda — ODDAL: wearinessUnconditionalEndDue = wearinessPeaceX(L)>=1; ai.ts i tick AI<->AI wołają tę samą funkcję co wearinessPeaceItemPw.
5. Tabela cen tur 10-20 — ODDAL: pełna tabela C=500/615 w 30-obrona-claude.md zgodna z moją (Z dla 500: 0/14/56/125/222/347/500; dla 615: 0/17/68/154/273/427/615). C zależne od tury (615/500) — DO POTWIERDZENIA przez właściciela.
6. Opisy JSON — ODDAL: grep wearinessPeacePriceFactor / rabatCenyPokojuMax w gra/data = 0; w gra/src zostaje tylko komentarz „bez rabatCenyPokojuMax”; w testach asercje negatywne (nie użycie rabatu).
7. Drobne — ODDAL: etykieta (AI)/(gracz) dodana; tooltip spójny z wejściem Z; wejście lostCities tick vs tabela (lostA+lostB vs lostCitiesResponder) — pre-existing, DO DECYZJI (zmieniłoby liczby Z).
Brak werdyktu NAPRAW.

## TESTY (własne uruchomienie na 25cabd622; node_modules przez symlink do worktree operatora)
- tsc --noEmit: EXIT 0.
- 5 bramek: logic-test LOGIC OK (213/213); tech-tree-test 20 pass 0 fail; research-test PASSED 33 / FAILED 0; unit-replace-test WSZYSTKIE ZIELONE (21/21); combat-test 6/6 pass. Czerwone-na-bazie: brak (zielone na kandydacie; bazy nie uruchamiano).
- Temat: as-pw-peace-item PASS=76 FAIL=0; pw-behavior 87/0; pw-row-ui 10/0; unconditional-end PASS=22 FAIL=0; ai-war-weariness-peace PASS=101 FAIL=0.
- Sąsiednie: peace-balance-accept 32/0; peace-weaker-seeks-city-only 35/0; war-peace-sim 25/0; war-peace-gate 24/0; war-peace-main-guard 35/0; weariness-20-turns PASS=30; weariness-city-only PASS=30; diplomacy-proposal 200/200.
- MUTACJA własna: w diplomacy-proposals.ts `basePn = Math.max(0, cenaPokojuPn - wearyPwItem)` -> `basePn = cenaPokojuPn` => pw-behavior 57 pass / 30 fail (czerwone; test behawioralny nie jest tautologią); plik przywrócony (git checkout).
- git diff --check: NIE ZMIERZONO osobnym poleceniem na kandydacie (operator deklaruje czysty).
- Chromium: zrzuty z gry obejrzane; własnego Vite nie uruchamiałem (dysk 4,6 GB).

## BLOKADY / DECISION_REQUIRED
(1) wariant silnej AI; (2) C dla AI->gracz bez mnożnika cywilizacji; (3) C 615 vs 500 zależne od tury; (4) wejście lostCities tick vs tabela; (5) obserwacja: bilans -72/-231 na zrzutach wynika z istniejącego pwBalance (brak miasta w ofercie, złoto nie jest słodzikiem, relacja −50%), nie zmieniane; panel pokazuje 250 PW złota obok ujemnego bilansu, co może mylić (temat UI osobno).
NIE ZMIERZONO: silna AI w pełnej grze.
Dług Rust: REPIN po wdrożeniu (usunięty rabat, pozycja Z, wiersz AI->gracz).

RUNDY: FC r3 (ten raport); r1 FC FAIL, r2 Evaluator FAIL-ZARZUTY, obrona r2.
NASTĘPNY KROK: orkiestrator: merge 25cabd622 z origin/main (konflikt tylko wikiBundle.json -> regeneracja), bramki po merge, deploy ROBOCZA; pytania ABC (1)-(4) do właściciela.
DEPLOY/PUSH: NIE WYKONANO
