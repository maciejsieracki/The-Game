STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI tekst)
TEMAT: R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-ONE-SENTENCE-Q1
GOAL: okno pokoju wymuszonego ma na wierzchu jedno zdanie o zmęczeniu (lead), potem warunki i przycisk; pełny opis w tooltipie.
ZMIANY/COMMIT: kandydat fe7d24dca, potomek bazy c8b0e498b (merge-base --is-ancestor: tak). Diff vs baza: gra/src/ui/diplomacyAudience.ts (tylko showForcedPeaceModal: lead z tooltipem detailTipAttr([text.why]) zamiast lead + whyShort), gra/tools/diplo-forced-peace-window-declutter-test.cjs, gra/tools/diplo-weariness-stages-view-test.cjs, runs/<ID>/10-operator-claude.md. Wszystko w allowliście. whyShort nadal zwracany przez war-weariness-view.ts (bez zmian); jego treść (X% zmęczenia, pokój wymuszony) zawiera się w lead i w why (tooltip), więc nic nie ginie.
ZARZUTY: brak (zarzuty=[], obrona=null) - nie ma czego oceniać NAPRAW/ODDAL.
TESTY (surowe wyjście, worktree na fe7d24dca, node_modules skopiowane z sąsiedniego worktree):
- tsc --noEmit: exit 0
- diplo-forced-peace-window-declutter 16/0 (w tym M5: mutant whyShort na wierzchu -> czerwony), diplo-forced-peace-pending 40/0, diplo-weariness-stages-view 24/0, diplo-weariness-forced-peace 14/0, peace-vazne-always ZIELONE, diplo-wiki-weariness-rate-consistency 18/0
- bramki: logic-test 213/213, tech-tree 20/0, research 33/33, unit-replace 21/21, combat 6/6 (exit 0 wszędzie; brak czerwonych, więc porównanie z bazą zbędne)
- mutacja: wykonana w pamięci przez test (M1, M3, M5 czerwienią kontrolę), nie na kopii pliku.
BLOKADY: brak.
NIE ZMIERZONO: Chromium/zrzut okna (dispatch: opcjonalne); układ zweryfikowany kontrolą źródła i testami.
RUNDY: FC po rundzie 1/5.
UWAGI-DLA-ORKIESTRATORA: klasa .cd-war-lead jest teraz na zdaniu z tooltipem; zakres dymka hudTitleTooltip obejmuje .civ-diplo-modal-overlay (test S3). Do integracji: kod = fe7d24dca.
NASTĘPNY KROK: integracja orkiestratora (merge fe7d24dca), bramki po merge, deploy po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
