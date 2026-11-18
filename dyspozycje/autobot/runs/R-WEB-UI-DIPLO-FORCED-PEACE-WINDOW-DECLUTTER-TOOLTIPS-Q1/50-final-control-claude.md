STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-DECLUTTER-TOOLTIPS-Q1
GOAL: okno pokoju wymuszonego: na wierzchu tytuł, partner, jedno zdanie "dlaczego", warunki, przycisk; wyliczenia w tooltipach (title), nic nie znika.
ZMIANY/COMMIT: kandydat 4aaeaae177a825753dd13243eabcdf10b1962746 (potomek bazy 56bb088c1 — `git merge-base --is-ancestor` = tak). Diff vs baza: war-weariness-view.ts (pola whyShort/termsShort, bez zmiany liczb), diplomacyAudience.ts (5 linii w showForcedPeaceModal), nowy test diplo-forced-peace-window-declutter-test.cjs, raporty 10/30. Wszystko w allowliście; brak zmian logiki pokoju, main.ts, hudTitleTooltip.ts (zakres .civ-diplo-modal-overlay już w linii 55).
TESTY (surowe wyjście, kandydat): tsc --noEmit exit 0; declutter-test PASS=15 FAIL=0 (mutanty M2-M4 czerwienią); forced-peace-pending PASS=40 FAIL=0; weariness-stages-view 22/0; weariness-forced-peace PASS=14 FAIL=0; peace-vazne-always ZIELONE; wiki-weariness-rate-consistency 18/0; bramki: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, unit-power 6/0 (wszystkie = referencja, brak czerwonych do porównania z bazą). Żywy Chromium (build vite poza repo, scratchpad): diplo-peace-auto-stale-offer-live-test PASS=15 FAIL=0, zero pageerror; S2 potwierdza okno showForcedPeaceModal w DOM i brak zmiany zachowania akceptacji (1 wpis "Pokój zawarty").
WERDYKT PER ZARZUT:
1. Brak zrzutu żywego przed/po + hover: ODDAL (nie blokuje). Tooltip to natywny title, nie trafia do zrzutu headless; DOM/title zweryfikowany przez Obronę, test żywy przeszedł. Wizualny dymek NIE ZMIERZONO.
2. diplo-peace-auto-stale-offer-live-test nieuruchomiony: ODDAL — uruchomiłem samodzielnie, 15/0.
3. Dwa zdania o zmęczeniu (lead + whyShort): ODDAL — lead jest wymagany dokładną treścią przez istniejące testy (stages-view:94, declutter:58) spoza allowlisty; kosmetyka, decyzja redakcyjna orkiestratora.
Żadnego NAPRAW.
BLOKADY: brak (NIE ZMIERZONO: wizualny dymek tooltipu).
RUNDY: FC 1/5
NASTĘPNY KROK: integracja orkiestratora kandydata 4aaeaae17, deploy ROBOCZA po osobnej autoryzacji.
UWAGI-DLA-ORKIESTRATORA: opcjonalnie usunąć duplikat procentu (lead vs whyShort) osobnym tematem razem z poprawką asercji testów.
DEPLOY/PUSH: NIE WYKONANO
