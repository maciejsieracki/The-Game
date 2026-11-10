STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-LOOT-TEST-DEBT-Q1
GOAL: Rozstrzygnąć cztery pre-existing failures `battle-loot-test` na podstawie aktualnego kodu i zatwierdzonych zasad kosztu jednostek; poprawić wyłącznie nieaktualne asercje, jeśli źródła jednoznacznie potwierdzą oczekiwane wartości.
MODEL / EFFORT: GPT-6 Luna / High (Operator)
BAZA: `main`, `b477ecb70196f18d28857e112e25860e710600a6` (`git rev-parse HEAD` przed zmianami)
ID: Brak istniejącego runu ani wpisu o tym pełnym ID w dostępnych runach/rejestrze; utworzono katalog dla nowego tematu.
ZAKRES / ALLOWLISTA: `gra/tools/battle-loot-test.cjs`; ten katalog runu. Bez zmian w `gra/src/**`, `gra/data/**`, rejestrach globalnych, buildzie, deployu i pushu.
KRYTERIA KOŃCA OPERATORA: odtworzyć błędy; powiązać oczekiwania z bieżącymi danymi i wdrożonymi regułami; zmienić asercje wyłącznie przy jednoznacznym dowodzie; uruchomić test z poprawnego katalogu i zapisać dokładne polecenie, wynik oraz bazę.
TEST WSTĘPNY: `node tools/battle-loot-test.cjs` z repo-root nie działa, ponieważ test leży pod `gra/tools/`; poprawny katalog roboczy i polecenie są jawnie zapisane w `10-operator.md`.
DEPLOY/PUSH: NIE WYKONANO (Operator).
