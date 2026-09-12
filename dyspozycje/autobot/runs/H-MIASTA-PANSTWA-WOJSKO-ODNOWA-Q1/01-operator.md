STATUS: PASS
DOMAIN: GAME
TEMAT: H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1
GOAL: Zastosować nowe reguły liczby jednostek startowych zależnie od trudności oraz potwierdzić i naprawić, jeśli trzeba, przydzielanie i co-turę uzupełnianie wojska/HP bez naruszenia ustawień państw-miast gracza z kreatora.
ZMIANY/COMMIT: 10cffd50 feat: split starting army difficulty rules; raport w tym pliku
TESTY/DOWODY:
- ai-difficulty-bonus-test.cjs: 79 PASS, 0 FAIL; tabela gracz easy/normal/hard = 1/2/3, obce państwa-miasta = 2/1/0, ustawienie państw-miast gracza osobne.
- city-state-start-units-test.cjs: 16 PASS, 0 FAIL; realna egzekucja spawnera, oba call-site'y, izolacja major AI i mutacja pętli/resolvera.
- city-state-start-units-live-test.cjs: 22 PASS, 0 FAIL; 3 pełne generacje świata w Chromium, oba strukturalne punkty spawnu, gracz 1/2/3, obce państwa-miasta 2/1/0, PM gracza=1 przy głównej easy/normal/hard, 0 błędów konsoli/JS.
- manpower-test.cjs: 63 OK, 0 FAIL; potwierdzone 2% max Manpower/turę, HP easy=40%/normal=30%/hard=20%, cap, brak puli, oblężenie, scout exclusion i callback zapisu do żywego obiektu.
- node ./node_modules/typescript/bin/tsc --noEmit: PASS (TypeScript z manifestu 5.9.3).
- git diff --check: PASS.
BLOKADY: Brak. Playwright użył istniejącego Chromium z ~/.cache/ms-playwright; domyślny browser cache i historyczny fallback /opt/pw-browsers nie były dostępne.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator — sprawdzenie diffa, raportu i bramek; Operator nie integruje, nie pushuje i nie deployuje.
DEPLOY/PUSH: NIE WYKONANO

USTALENIA TECHNICZNE:
- Dodano playerStartUnitCount() = easy 1, normal 2, hard 3.
- Dodano foreignCityStateStartUnitCount() = easy 2, normal 1, hard 0.
- Rywale tego samego typu co gracz nadal korzystają wyłącznie z cityStateStartUnitCount(_menuCityStateDifficulty), niezależnie od _menuDifficulty.
- Obce państwa-miasta korzystają z foreignCityStateStartUnitCount(_menuDifficulty).
- Gracz otrzymuje jednostki wojskowe po skutecznym założeniu pierwszego miasta przez właściwy aktywny fotel; hot-seat nie zmienia właściciela.
- Mechaniki Manpower/HP nie zmieniano: audyt istniejącego resolvera i callbacku przeszedł.
