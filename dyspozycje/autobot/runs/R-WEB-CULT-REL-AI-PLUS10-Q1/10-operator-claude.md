STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-AI-PLUS10-Q1 (tag AIPLUS10), runda 1/5, Operator HAIKU 5.5
GOAL: w ustawieniu „Kultura i religia” PLUS dla linii Kultury i Religii (Szczęście i Prawo) dla CYWILIZACJI AI jest zawsze G = +10 (epoka 1) na każdym poziomie, rosnące z epoką (+10/+16/+23); minusy D bez zmian; gracz i hotseat bez zmian (G +10/+5/0).
BAZA: origin/main 44649038c (kandydat z args). Gałąź: detached HEAD w worktree wf_846a20eb-6b0-1. Zmiany commitowane w tym samym commicie co raport (SHA w odpowiedzi operatora).

ZMIANY/COMMIT:
- gra/src/game/culture-religion-level.ts: `CulturaReligiaBounds.GAi` (domyślnie 10), `culturaReligiaBoundsForOwner(bounds, ownerIsHuman)`, `cultureReligionLineValue(..., ownerIsHuman = true)`.
- gra/data/society-params.json: `kultura_religia_poziomy.{latwy,normalny,trudny}.G_ai = 10`; D i G bez zmian.
- gra/src/game/society-breakdown.ts: pole `ownerIsHuman` (domyślnie gracz) w HappinessBreakdownInput i LawBreakdownInput; `kultReligLinePoints` z typem właściciela; `evaluateOrderFromBreakdown` przekazuje typ do Prawa; parser `G_ai`.
- gra/src/main.ts: WYŁĄCZNIE jedna linia w literale `evaluateOrderFromBreakdown` (miasto): `ownerIsHuman: isHuman(city.ownerId)`. Nie dotknięto bloku rebelii (AIREBEL).
- gra/src/ui/newGameFlow.ts: w `hint` ustawienia „Kultura i religia” jedno zdanie o plusie +10 dla komputera (bez nowych kontrolek, pole poziomu bez zmian).
- gra/tools/ai-plus10-culture-test.cjs (nowy): 69 asercji.
- dyspozycje/analizy/AI-PLUS10-KULTURA-RELIGIA-2026-11-27.md (nowy): reguła, implementacja, testy, pomiar PRZED/PO.
- dyspozycje/autobot/runs/R-WEB-CULT-REL-AI-PLUS10-Q1/10-operator-claude.md (ten raport).

TESTY:
- tsc --noEmit: bez błędów.
- culture-religion-level-test 59/0; culture-religion-test 65/0; society-breakdown-test 56/0 (OK, 0 FAIL); ai-city-order-need-test 35/0; ai-city-order-need-wiring-test 231/0 — bez zmiany oczekiwanych wartości (wejście domyślne = gracz).
- Nowy ai-plus10-culture-test: 69 pass / 0 fail (granice AI, +10/+16/+23 na łatwym/normalnym/trudnym w epokach 1–3, gracz 0/+5/+10 bez zmian, D bez zmian, zgodność null bez zmian, hotseat, linie Prawa AI, propagacja przez evaluateOrderFromBreakdown, garnizon AI ≤ gracz).
- Bramki: logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; ai-test 297 passed / 0 failed.
- Mutacje czerwone (cofnięte, po cofnięciu 69/0; cmp potwierdza przywrócenie):
  - M1 G_ai trudny = 0 → 13 FAIL;
  - M2 typ właściciela zignorowany → 15 FAIL;
  - M3 skala epok ignorowana (k=1) → 9 FAIL.

POMIAR PO (poziom MAKSYMALNY: gra Trudny, Kultura i religia Trudny, Porządek hard, Koszty jednostek `wysoki` ×4, `--unit-flow 1 --city-state 1`, 60 tur, runner gra/tools/ai-cult-rel-measure-run.cjs, headless Chromium, żywy bundle vite zbudowany poza repo):
- seed 4242, tura 60: miasta AI 186 (PRZED 153); jednostki AI 227 (PRZED 159; zgodność 221); puste miasta 49/186 = 26% (PRZED 56 = 37%); Porządek śr. 56,1 (PRZED 21,2); miasta poniżej 14%: 1 (PRZED 60); Porządek śr. t10 64,0 (PRZED 19,3).
- seed 7, tura 60: miasta AI 185 (PRZED 149); jednostki AI 249 (PRZED 138; zgodność 230); puste miasta 41/185 = 22% (PRZED 59 = 40%); Porządek śr. 51,7 (PRZED 19,1); miasta poniżej 14%: 0 (PRZED 75); Porządek śr. t10 63,3 (PRZED 20,8).
- Źródło PRZED: dyspozycje/analizy/AI-KULTURA-RELIGIA-DIAG-2026-11-26.md (baza 5748b924f). NIE ZMIERZONO: bazowy bieg na obecnym HEAD 44649038c bez tej zmiany (inne zmiany weszły między bazami).
- Pełne zestawienie i zastrzeżenia: dyspozycje/analizy/AI-PLUS10-KULTURA-RELIGIA-2026-11-27.md.

BLOKADY:
- NIE ZMIERZONO: bazowy bieg PRZED na obecnym HEAD (różnica może zawierać wpływ innych zmian).
- NIE ZMIERZONO: osobny bieg gracza/hotseat (wartości gracza potwierdzone testem, nie pomiarem gry).
- Chromium przy wznowieniu slotu seed 4242 padł raz (SIGSEGV przy load zapisu, znany problem harnessu); ponowienie przeszło, bez zmian w grze.
- Panel miasta (cityPanel.ts), growth-happiness.ts, turn-economy.ts, conquest-stability.ts nie dostały typu właściciela (poza allowlistą lub nie wpływają na Porządek tur). Dla miast AI te widoki nadal pokazują wartości gracza. Do osobnego tematu, jeśli ma to być widoczne.
- Nie używano run_in_background, spawn_task, create_session ani --no-gpg-sign.

RUNDY: 1/5 (bez FAIL/BLOCK, bez rundy poprawkowej).

NASTĘPNY KROK: Evaluator (SONNET) na commicie z tym raportem; zwrócić uwagę na: (a) zasięg widoków poza turą (cityPanel/growth/turn-economy) — decyzja, czy podpiąć w tym temacie czy osobno; (b) bazowy bieg PRZED na HEAD 44649038c, jeśli ma być czysty udział zmiany; (c) bieg gracza/hotseat jako kontrola braku zmian.

UWAGI-DLA-ORKIESTRATORA:
- Zgodnie z dispatchem gałąź `claude/sprawdzenie-funkcjonalnosci-ek4ra0` zawiera 00-dispatch.md i 00-dispatch-DODATEK-claude.md; nie kopiowano ich do tej gałęzi roboczej.
- Dla testów wymagany był `npm ci --ignore-scripts` w gra/ (worktree nie miał node_modules); node_modules usunięte po pracy zgodnie z zasadą sprzątania.
- Sugestia do kolejnej rundy/tematu: AI na poziomie normalnym i trudnym dostaje teraz więcej jednostek i Porządku — warto sprawdzić, czy AI nie przestaje tracić miast przy skrajnym zysku skarbca (s7 t60 skarbiec AI 14 698 vs 4 374 PRZED); ocena balansu należy do właściciela.

DEPLOY/PUSH: NIE WYKONANO
