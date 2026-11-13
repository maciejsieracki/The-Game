STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), testy i dowody; zero zmian w gra/src
TEMAT: R-WEB-TEST-DEBT-CAMPAIGN-Q4
GOAL: splata dlugu testowego kampanii/wodza bez zmiany zachowania gry
ZMIANY/COMMIT: SHA do integracji = 538fe3ec5 (9a01fff4f testy, d2f590d50 raport R1, 538fe3ec5 obrona R2). Baza 45ea4b67a.
Allowlista: git diff 45ea4b67a..538fe3ec5 = 7 plikow gra/tools/ + run dir; gra/src diff pusty.
Nakladanie: origin/main (037e6be36) od bazy zmienil z gra/tools tylko mill-river-only-gate-test.cjs (brak kolizji); piny testow nadal obecne w origin/main (git grep: quick-follow, followGeneral gate, kotwica planWith(nav), isCityUnderSiege).

WERDYKT ZARZUTOW:
1. Puste logi gate: ODDAL (obrona dodala evidence-r2-po-output-tails.txt; zgodne z dispatchem).
2. Sprzecznosc PRZED live EXIT=0 vs 1: ODDAL (naprawione w R2: log = EXIT=1 + evidence-r2-przed-live-anchor.txt).
3. Brak mutacji dla testu live: ODDAL (zmiana to kotwica sondy vite, nie asercja; NIE_ZMIERZONO).
4. Substring-pin quick-follow: ODDAL (dlug, poza zakresem).
5. 6 czerwonych vs ~26: ODDAL (NIE_ZMIERZONO; ~26 nie odtwarza sie, 13 plikow ma logi PRZED).
NAPRAW: 0. DO DECYZJI CZLOWIEKA: 0.

TESTY: FC nie powtarzal uruchomien testow; opiera sie na niezaleznej weryfikacji Evaluatora (army-leadership, army-panel, army-to-nearest-leader 43, general-capital, quick-follow 20/20, generals-purchase 13; mutacje M1, formationRules, M3, M4 = FAIL) i tailach R2 (campaign 51, live 68/0, tsc EXIT=0). Nie zmierzono po nalozeniu na aktualny origin/main.
BLOKADY: brak. Klasa B (blad gry): 0.
RUNDY: 3/5 (Operator R1, Obrona R2, FC)
NASTEPNY KROK: integracja orkiestratora: merge 538fe3ec5 do main (po 037e6be36), potem standardowa synchronizacja do rust-port/parity-v2 (b520768b0) jesli testy webowe sa tam utrzymywane. Po integracji rerun army-leadership + general-capital na main.
DEPLOY/PUSH: NIE WYKONANO
