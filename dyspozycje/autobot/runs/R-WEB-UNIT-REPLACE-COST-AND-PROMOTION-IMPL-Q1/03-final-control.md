STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-REPLACE-COST-AND-PROMOTION-IMPL-Q1
GOAL: "Zastąp" = pełny koszt rekrutacji (Pieniądz + surowiec z puli państwa), gracz i AI przez jedną funkcję kosztu; doświadczenie zachowane; Koszary jedną regułą.
ZMIANY/COMMIT: SHA do integracji = f4e1276fab23796bec8c3a4644d912129681a7b0 (potomek a70768498; baza origin/main 23871b38c = FALA 570). Allowlista czysta: 8 plików (4x gra/src, 2x gra/tools, 2x runs/<ID>). units*.json, WERSJE.md, gra-robocza/ nietknięte. git diff --check czysto.
TESTY (powtórzone samodzielnie na f4e1276fa): unit-replace-full-cost-test 40/0; ai-era-unit-promotion-test 17/0; unit-replace-test 15/15; tsc --noEmit: 3 błędy TS2315 tylko w src/audio/muzyka-antyczna.ts (plik nietknięty w diffie; main.ts spełnia wymagane hooki, brak nowych błędów typów). NIE_ZMIERZONO: UI w przeglądarce, performUnitReplace w żywej grze, ekonomia AI, npm run build.
WERDYKTY ZARZUTÓW (Evaluator 1-7 + Obrona):
1 UI w przeglądarce: ODDAL (NIE_ZMIERZONO, brak Chromium; weryfikacja po deployu na ROBOCZĄ).
2 brak testu performUnitReplace: ODDAL (DOM; dodana asercja kolejności bramek w źródle; behawioralnie NIE_ZMIERZONO).
3 brak LEDGER REPIN: ODDAL orkiestratorowi (treść w 01-operator-r1.md; brak pliku w repo).
4 brak unit-replace-ai-vs-player-test: ODDAL (pliku nie ma na main; symetria pokryta asercją w nowym teście).
5 AI awansuje przez "Zastąp specjalnie": ODDAL (zgodne z D3; 2 wpisy w units.json; informacja dla właściciela).
6 Taran okuty/Wieża/Rydwan: ODDAL (Taran -> Katapulta 16/16 nacji, asercja F0; Wieża NIE_ZMIERZONO).
7 ryzyko ekonomii AI: ODDAL (D2 zabrania limitu; NIE_ZMIERZONO).
8 opcjonalne hooki: NAPRAWIONE w f4e1276fa (hooki wymagane); zweryfikowane diffem.
9 tsc: ODDAL (błędy przedistniejące, poza zakresem).
Brak pozostających pozycji NAPRAW -> PASS-WITH-NOTES.
BLOKADY: brak technicznych. DO DECYZJI CZŁOWIEKA (ABC przez orkiestratora): luki Zwiadowca/Galera/Procarz; tabela awansów międzytypowych; zachowanie AI "Zastąp specjalnie".
RUNDY: FC 3/5.
KOLEJNOŚĆ INTEGRACJI: origin/rust-port/parity-v2 = 43f4064b0 to niezależna linia Rust; zmiana dotyka tylko gra/ (web), brak kolizji plików. Najpierw integracja f4e1276fa do main (web, deploy ROBOCZA), potem REPIN delta Rust z wpisem LEDGER, nie przed merge do main.
NASTĘPNY KROK: integracja orkiestratora (git merge-base --is-ancestor f4e1276fa i git diff --stat), build poza repo, deploy ROBOCZA, weryfikacja UI w przeglądarce, wpis LEDGER, pytania ABC.
DEPLOY/PUSH: NIE WYKONANO
