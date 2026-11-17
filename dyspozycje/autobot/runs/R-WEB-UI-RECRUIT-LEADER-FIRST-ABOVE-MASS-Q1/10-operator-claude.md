STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-RECRUIT-LEADER-FIRST-ABOVE-MASS-Q1
GOAL: Panel Rekrutacja (Armia): wódz → „Idź do wodza” → dopiero masowa rekrutacja (erp, liczniki, pula, miasta). Bez zmiany zachowania.

ZMIANY-COMMIT: gałąź autobot/R-WEB-UI-RECRUIT-LEADER-FIRST-ABOVE-MASS-Q1, baza e2852102844cf82e1dca09e2fd79c14cb1554a0b. Pliki: gra/src/ui/empireDetailPanel.ts (kolejność bloków HTML w renderMassRecruitmentSection + komentarze), gra/src/ui/empireRecruitPanel.ts (komentarz), gra/tools/empire-recruit-in-army-panel-test.cjs (L3/L4 do nowej kolejności, L4b), gra/tools/empire-recruit-leader-first-order-test.cjs (nowy, statyczny), ten raport i leader-first-panel.png.

TESTY:
- tsc --noEmit: exit 0 (przed zmianą samego komentarza w empireRecruitPanel.ts).
- leader-first-order-test (nowy): PASS 2/2. Bez miast wódz(10) < Idź(12) < erp(15) < reszta(30); z miastami 10 < 12 < 15 < 31.
- MUTACJA (erp przed wodzem, podmiana pliku): AssertionError „erp > follow” (8 > 13), exit 1; po przywróceniu: zielony.
- Live Chromium (build do scratchpadu): in-army-panel-test 14 passed, 0 failed, zero pageerror.
- Live top (px, 1280×800): nagłówek 569, blok wodza 588, karta wodza 607, Idź do wodza 666, erp 733, liczniki 1673, pula 1710, miasta/Rekrutuj wszystko 1774. Rosnąco. Zrzut zapisany, nie oglądany.
- Zielone: logic 213/213; tech-tree 20/0; research 33/0; combat exit 0; unit-replace 21/21; army-auto-recruit-general-ui 11/0; empire-mass-recruitment 48/0; empire-recruit-all 31/0; affordability 17/0; no-inner-scroll 18/0; real-render 29/0; recruit-rally-default PASS.
- NIE ZMIERZONO: army-auto-recruit-general-live, empire-recruit-live, empire-recruit-all-live (nie uruchomione; bez asercji kolejności w grep).

BLOKADY: brak.

RUNDY: 1/5.

NASTĘPNY KROK: integracja orkiestratora (merge-base + diff --stat na SHA z kodem), potem Evaluator. Weryfikacja kolejności w grze przez właściciela.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch 00-dispatch.md nie istnieje na origin/main; odczytany z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0.
- Testy przepisały zrzuty w innych katalogach runs/; przywrócono do HEAD, nie commitowane.
- gra/tools/.empire-recruit-all-bundle.js (artefakt testu) nie commitowany.
