STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1
GOAL: Panel dyplomacji pokazuje prawdziwą efektywną wartość Zaufania/Respektu AI (np. 67, nie obcięte 29). Limit wojenny (clampRelationForWar, 29) zostaje tylko dla etykiety „Wrogi” + dopisek „(limit wojenny 29)” (ABC „B”). Mechanika silnika bez zmian.
ZMIANY/COMMIT: allowlista: gra/src/game/diplomacy-display.ts (effectiveNastawienieScores: bez obcinania, sygnatura bez atWar; nowa warRelationCapApplies), gra/src/ui/diplomacyAudience.ts (2 wywołania effectiveNastawienieScores; dopisek warCapNoteHtml przy badge nastawienia, w wierszu Relacja i w stopce „Stan bieżący”), gra/tools/diplomacy-display-test.cjs (asercje 98–99 odwrócone na wartość prawdziwą + 4 nowe asercje). Odstępstwo od allowlisty: zmieniony istniejący test diplomacy-display-test.cjs, bo jego asercje kodowały stare obcinanie (bez tego nie przejdzie). Commit: SHA w sekcji COMMIT poniżej.
OPEN-QUESTION (rozstrzygnięte założeniem): „Relacja” — wybrano ADNOTACJĘ (dopisek „(limit wojenny 29)” przy sumie Zaufanie+Respekt), bez klamrowania i bez zmiany mechaniki; suma i tak pokazuje wartość prawdziwą.
TESTY:
- node gra/tools/diplomacy-display-test.cjs → 39 OK, 0 FAIL (nowe asercje: wojna 74/54 → Z=74 R=54; warRelationCapApplies true przy wojnie score 128>29, false przy pokoju, false przy wojnie score 20≤29; etykieta wojenna nadal Wrogi)
- npx tsc --noEmit (gra) → exit 0
- regresja, wszystkie exit 0: diplo-quick-actions-labels-test, diplomacy-proposal-test, diplomacy-infografiki-tooltipy-test, diplomacy-tech-chip-filter-and-multi-deal-test, diplo-panel-recruits-level-test, diplomacy-audience-deals-active-first-real-render-test, diplomacy-audience-zoom-cutoff-real-render-test, diplo-active-treaties-resource-deals-test, budmode-ulepszenia-sort-locked-real-render-test
- git diff --check: czysto
- NIE_ZMIERZONO: wizualna weryfikacja dopisku w przeglądarce (poza zakresem Operatora) — wymagana przed PASS końcowym
BLOKADY: brak. Testy real-render zapisały zrzuty PNG w dyspozycje/autobot/runs/P-*/dowody — cofnięte (git checkout), nie są częścią tematu.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — allowlista i odstępstwo od testu; potem Final Control; wizualna kontrola dopisku w przeglądarce.
DEPLOY/PUSH: NIE WYKONANO
