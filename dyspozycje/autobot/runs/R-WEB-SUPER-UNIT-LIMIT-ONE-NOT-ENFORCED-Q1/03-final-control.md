STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SUPER-UNIT-LIMIT-ONE-NOT-ENFORCED-Q1
GOAL: Limit 1 Super-jednostki liczy caly stan cywilizacji (zywe + kolejki rekrutacji wszystkich miast), wymuszany przy zakupie i zamianie, gracz i AI.
ZMIANY/COMMIT: kod 84844fc73 (obrona r2, rodzic bec653461 operator r1, baza 264aebdf7); raport obrony 705261dfa. is-ancestor OK (bec653461 -> 84844fc73 -> 705261dfa). git diff --stat 264aebdf7..705261dfa: 7 plikow (production.ts, main.ts, empire-recruit-plan.ts, cityPanel.ts, nowy super-unit-limit-one-test.cjs, raporty 01/02) = allowlista. Brak WERSJE.md, gra-robocza/. git diff --check czysty.
TESTY (odtworzone samodzielnie na 705261dfa, esbuild przez symlink node_modules, usuniety): super-unit-limit-one 40 OK/0 FAIL; unit-replace 15/15; unit-replace-full-cost 40/0; empire-recruit-plan 17/0; recruit-list-visibility 9/0. NIE_ZMIERZONO: pelne tsc, Chromium/playwright, recruitment-batch-contract-test (dlug poza allowlista).
WERDYKTY ZARZUTOW:
1. Egzekucja w main.ts nie testowana zachowaniem: ODDAL. Logika wyciagnieta do czystych funkcji (reservedUnitTypeNamesOfOwner, superUnitLimitViolation, generalSyncTargets) testowanych zachowaniem; przeglad diffu potwierdza guardy w purchaseRecruitmentUnit, purchaseRecruitmentUnits, performUnitReplace i we wszystkich kontekstach dostepnosci (w tym AI) przez jedno zrodlo prawdy. Chromium NIE_ZMIERZONO.
2. diplomacy-unit-transfer.ts: ODDAL. spawnTransferredUnit nie ma wywolan w src/, galaz 'jednostka' deali jest pusta. Przy przyszlym podpieciu dodac guard.
3. syncGeneralFormsForOwner: byl realnym bledem, NAPRAWIONY w obronie r2 (generalSyncTargets, test sekcja 10); zweryfikowano w diffie i tescie. ODDAL (juz naprawione).
4. Stare zapisy / brak zwrotu kosztu oplaconych sztuk: DO DECYZJI CZLOWIEKA (produktowa: zwrot kosztu tak/nie). Nie blokuje; nowe sztuki blokowane, zadna jednostka nie jest usuwana (zgodnie z dispatchem).
5. Brak pliku LEDGER REPIN: ODDAL orkiestratorowi (wpis w 01-operator-r1.md, linia 27, do przeniesienia).
Zero NAPRAW -> PASS-WITH-NOTES.
BLOKADY: brak. Otwarta decyzja: pkt 4.
RUNDY: FC 1/5
SHA DO INTEGRACJI: kod 84844fc73; dokumentacja 705261dfa (+ commit tego raportu na galezi super-limit-fc-r1). Kolejnosc wzgledem origin/rust-port/parity-v2: niezalezne (temat webowy gra/, parity-v2 to port Rust); merge do main nie koliduje; wpis LEDGER REPIN dopiero po integracji.
NASTEPNY KROK: integracja orkiestratora (merge-base --is-ancestor + diff --stat), deploy ROBOCZA, decyzja ABC pkt 4.
DEPLOY/PUSH: NIE WYKONANO
