# R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-ONE-SENTENCE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI tekst)
TEMAT: R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-ONE-SENTENCE-Q1
GOAL: okno pokoju wymuszonego ma na wierzchu jedno zdanie o zmęczeniu (lead), potem warunki i przycisk; pełne „dlaczego” w tooltipie zdania; testy zaktualizowane do nowego układu; mutacja (whyShort z powrotem na wierzch) czerwieni test.
BAZA: c8b0e498bfa2fb5429ce98ab1f90fe9da0c813de (origin/main), checkout --detach.

ZMIANY-COMMIT: allowlista zachowana. Zmienione pliki:
- gra/src/ui/diplomacyAudience.ts (tylko showForcedPeaceModal): lead `<p class="cd-war-lead">` z tooltipem `detailTipAttr([text.why])`; warunki `termsShort` z tooltipem `detailTipAttr([text.terms])`; `whyShort` nie jest już renderowany na wierzchu. Nic nie usunięto z treści: whyShort zostaje w danych; jego informacja („100%, pokój wymuszony”) jest w lead i w why, więc nie dopisywano jej do tooltipa.
- gra/src/game/war-weariness-view.ts: bez zmian (dane bez zmian, why/whyShort/terms/termsShort jak w bazie).
- gra/tools/diplo-forced-peace-window-declutter-test.cjs: S1 wymaga lead i termsShort na wierzchu, why/terms w tooltipach, whyShort NIE na wierzchu; mutanty M1 (wyliczenie inline) i M3 (brak tooltipa) przepięte na nowy markup; nowy M5 (whyShort z powrotem na wierzch) czerwieni S1.
- gra/tools/diplo-weariness-stages-view-test.cjs: dodane mt4 (whyShort nadal zwracany) i mt5 (lead ≠ whyShort).
- Raport: dyspozycje/autobot/runs/R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-ONE-SENTENCE-Q1/10-operator-claude.md.

TESTY (surowe liczby z wyjścia):
- tsc --noEmit: exit 0.
- diplo-forced-peace-window-declutter-test: PASS=16 FAIL=0 (w tym M5 czerwieni S1).
- diplo-weariness-stages-view-test: 24 pass / 0 fail.
- diplo-weariness-forced-peace-test: PASS=14 FAIL=0.
- peace-vazne-always-test: WYNIK ZIELONE, exit 0.
- diplo-wiki-weariness-rate-consistency-test: asercje OK 18, FAIL 0.
- diplo-forced-peace-pending-live-paths-test (live, Chromium, build vite w scratchpadzie poza repo): exit 1, 4 FAIL: (a) okno nie pojawia się samo po końcu tury (2 razy, FPAUTOOPEN, temat #531 w toku), (b) akceptacja pierwszego nie odblokowuje tury / kolejka drugiego pokoju (#532 pending), (c) S4 bramka „Zakończ turę” nie ma okna do przetestowania. Selektory testu (.cd-forced-peace-ok, .cd-war-consent-modal) są bez zmian; mechanizm auto-open i kolejki nie był dotykany tym diffem.
- NIE ZMIERZONO: baseline live (ten sam test na c8b0e498b bez mojego diffu) — nie uruchomiony; wniosek o przyczynie opiera się na treści asercji, nie na porównaniu.
- NIE ZMIERZONO: zrzut okna w Chromium (wizualny układ lead + warunki).
- Pozostałe testy z listy (diplo-weariness-forced-peace, peace-vazne-always, wiki-rate) zielone.

BLOKADY: brak w zakresie tematu. Bramka live diplo-forced-peace-pending nie jest zielona (4 FAIL wyżej); zależy od #531/#532, nie od tej zmiany.

RUNDY: 1/5.

NASTĘPNY KROK: orkiestrator decyduje, czy przyjąć PASS-WITH-NOTES, czy czekać na #531/#532 przed integracją tej zmiany do live-paths.

UWAGI-DLA-ORKIESTRATORA:
- Decyzja ABC właściciela (wariant A, 2026-11-18) zrealizowana bez pytań: whyShort zszedł z wierzchu, informacja została w lead i why. Nie zadawano nowych pytań ABC.
- Środowisko: gra/node_modules zainstalowane (npm ci --ignore-scripts) w worktree; ścieżki poza repo: scratchpad .../scratchpad/fp-build, fp-base (build), fp-evidence, live.log, vite.log. Orkiestrator sprząta.

DEPLOY/PUSH: NIE WYKONANO
