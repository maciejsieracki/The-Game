STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1
GOAL: Ulepszenia żywnościowe i wycinka tylko na heksach z obywatelami (gracz: Żywność i Zrównoważone; AI), bez wyjątków.

ZMIANY/COMMIT: Final Control rundy 2. Weryfikowany stan: `024de405e` (baza kodu `fb75c1631` na `86d510c66`). Allowlista czysta: `git diff --name-only 86d510c66 024de405e` = `gra/src/game/auto-improvements.ts`, nowy `gra/tools/ai-food-only-worked-hexes-test.cjs`, 3 zaktualizowane testy, `dyspozycje/autobot/runs/R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1/**`. Brak zmian w `ai.ts`, `main.ts`, `gra-robocza`, `WERSJE.md`, `rust-port`. `git diff --check` czysty. `auto-improvements.ts` / `ai.ts` nie zmieniły się w origin/main (9fcb663ed) od bazy, więc brak konfliktu. SHA do integracji: SHA commitu tego raportu (kkod = `024de405e`).

TESTY (powtórzone samodzielnie):
- Nowy test: 81 OK / 0 FAIL. Na bazie `86d510c66`: 52 OK / 29 FAIL (RED potwierdzony).
- tsc --noEmit: EXIT 0.
- Własne mutacje (usunięcie klucza z `FOOD_IMPROVEMENT_KEYS`, linia 604): tarasy, lama, oboz_lowiecki, lodzie_rybackie, owce, wyrab, farma, irygacja = 1 FAIL każda; bydlo 3 FAIL; warzelnia_soli 9 FAIL. Luka z zarzutu 1 zamknięta.
- Regresje: auto-improve-q3 48/0, autoclear-river-forest-priority 18/0, wyrab-rzeka-d1 3/0, ai-improvements 56/0, auto-improvements 46/0, autoimprove-stages-q1 302/0, autoclear-priority-q1 60/0, auto-improve-no-item-cap 15/0, food-hodowla 24/0, hodowla-las 113/0, farma-nie-w-lesie 138/0, farma-lesie-usun-istniejace 143/0, oboz-lowiecki-wymaga-tartaku 16/0.
- `oboz-lowiecki-las-test` 72/19: czerwony także przed zmianą wg Operatora; nie odtwarzałem na bazie (poza zakresem tematu, nie regresja z diffu).

ROZSTRZYGNIĘCIE ZARZUTÓW:
1. Luka testowa kluczy: ODDAL (naprawione w r2, sekcja F + mutacje, zweryfikowane).
2. Pomiar 5 ziaren x 100 tur, AI i gracz: ODDAL (wykonany; AI 1120/1761 -> 0/645, Żywność 1272/1932 -> 0/737, Zrównoważone 1128/1761 -> 0/645; mój niezależny pomiar r1 AI też 0).
3. Plon: ODDAL z uwagą. Zmierzono nominalnie -17..-19% (efektywna żywność z ulepszeń na polach obywateli), skutek wprost reguły właściciela ("tak ma być i koniec"). Realny plon z silnika tury NIE_ZMIERZONO; to nie jest blokada, bo reguła jest nadrzędna.
4. Miernik zbioru pól: ODDAL (gracz ściśle po cityId; AI luźniej, oznaczone `perCityStrict`; sekcja G dla osieroconych farm).
5. Format EXIT=: ODDAL (naprawione).
6. Zmiana scenariusza (e): ODDAL (uzasadnione decyzją właściciela, OFF nadal pokryte).
7. Testy czerwone poza zakresem: ODDAL (poza tematem, identyczne przed/po wg Operatora, bez regresji).
Brak NAPRAW. Brak DO DECYZJI CZŁOWIEKA.

Uwaga: `getWorkedHexKeys` nieprzekazane = filtr wyłączony (fail-open); oba wywołania go przekazują. NIE_ZMIERZONO: Chromium/live, zapis ROBOCZEJ.

BLOKADY: brak.
RUNDY: 2/5 (Final Control)
NASTĘPNY KROK: integracja orkiestratora na origin/main (kod gra/ tylko w auto-improvements.ts i testach; brak kolizji z main 9fcb663ed). `origin/rust-port/parity-v2` to oddzielna, rozbieżna linia; zmiana webowa idzie na main, bez wpływu na parity-v2 (kolejność dowolna, bez zależności). Potem READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
