STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTO-FORT-CLAIM-Q1
GOAL: Automat ulepszeń (K2 gracz „Zrównoważone", K3 AI) stawia fort/posterunek na cennym terenie na granicy dostępnej budowy, tylko przy wyczerpanym limicie miast, po żywności i surowcach, przed drogami.
ZMIANY/COMMIT: tylko `gra/tools/auto-fort-claim-test.cjs` (sekcje K, L, M, wariant kosztowy) + logi w katalogu runu. Kod produkcyjny BEZ zmian. Baza: 692018b53 (Operator R1).
RUNDA: obrona R1 (Operator R2)

ODPOWIEDZI NA ZARZUTY

1. m7 (usunięcie `!deficitIsPendingNow()`): PRZYJMUJĘ LUKĘ TESTOWĄ, ODRZUCAM PREMISĘ.
   - Premisa fałszywa (zmierzone `getImprovementMeta(k).kosztPraca`, nie skala x4): fort=100, posterunek=60, tartak=25, kamieniolom=22, glinianka=40, kopalnia_miedzi=44, kopalnia_zelaza=88, kopalnia_cyny=44, warzelnia_soli=40, stadnina=56. Stadnina NIE ma 112, tylko 56 (base 28 x 0,5 x 4 wg epoki ulepszenia). Najdroższe ulepszenie niedoboru = 88 < fort 100. Przedział "Praca 100-111, stadnina czeka, fort staje" nie istnieje. Test sekcji K to pinuje (assert `maxDef < FORT_COST`).
   - Mutant jest równoważny także z powodu strukturalnego, niezależnego od kosztów: ścieżka zapasowa (auto-improvements.ts ~l.870, `fallbackIsPending`) ma listę = żywność + ulepszenia niedoboru, więc niedobór czekający na Pracę już ustawia `fallbackIsPending` => `foodAndFallbackDone=false` (l.904). Dwa strażniki dublują się.
   - Dowód (3 mutacje, logi `mutation-m7*-r2-*.txt`): (a) usunięty tylko `!deficitIsPendingNow()` -> 63/0, przeżywa (strażnik nadmiarowy); (b) usunięte OBA strażniki -> nowy test K FAIL ("niedobor konia czeka na Prace -> fort NIE jest stawiany", got ["fort"]); (c) usunięty tylko `!fallbackIsPending` -> 63/0 (drugi strażnik wystarcza). Zachowanie jest więc przypięte testem, a pojedynczy mutant m7 pozostaje równoważny (redundancja, nie błąd).
   - Nowy test K: wariant bundla z kosztem stadniny x10 (plugin esbuild w procesie potomnym, 560 > fort 100): pula 131 mieści fort (+rezerwa 30), nie mieści stadniny; z niedoborem konia -> 0 fortów, bez niedoboru -> fort. Działa niezależnie od przyszłych zmian danych.
   - Nie zmieniałem kodu (zbędna zmiana; ewentualne uproszczenie strażnika = decyzja poza zakresem).

2. GOAL niespełniony w realnej grze (brak wiązania w `main.ts`): ODRZUCAM jako zarzut do kodu Operatora, UZNAJĘ jako BLOKADĘ procesu. `main.ts` poza allowlistą (CLAUDE.md/dispatch). Decyzja orkiestratora: rozszerzyć allowlistę o 2 wiązania (gracz: `cityLimitExhausted: isCityLimitExhausted(...)` przy wywołaniu pickera main.ts:~36226; AI: `cityLimitBase: _menuCityLimitBase` do opcji `decideAITurn`). Dowód skuteczności K3 = pomiar produkcyjnym `decideAITurn` (5x40, uproszczona symulacja: NIE_ZMIERZONO na pełnej grze z wojnami/rywalami) — bez zmian.

3. Głód dróg przy stałym suficie % gracza < koszt fortu: PRZYJMUJĘ jako ocenę + test, ODRZUCAM jako błąd. Zachowanie jest zamierzone i zgodne z wzorcem E1-E5/zapasowa/niedobór (cel czekający na Pracę wstrzymuje niższy priorytet; owner: drogi = najniższy priorytet). Sufit gracza jest sztywny (decyzja właściciela STAGES2), więc nie wolno go obchodzić. Dodany test M: sufit 9% z 1000 (< fort 100) -> ani fort, ani droga; po podniesieniu sufitu -> fort i blokada znika. Ryzyko praktyczne: sufit < 100 Pracy to konfiguracja skrajnie niska; rekomendacja dla orkiestratora: w razie wątpliwości zapytanie ABC o limit czasu oczekiwania — NIE zadaję (luka rozstrzygnięta założeniem).

4. Współistnienie fortu z kopalnią na tym samym heksie (NIE_ZMIERZONO): PRZYJMUJĘ, POMIAR WYKONANY. Test L na silniku (`pickAutoImprovements`, góra ze złożem rudy na granicy): (a) kontrola: niedobór rudy bez fortu -> kopalnia_miedzi@27,22; (b) fort stoi na heksie -> kopalnia nadal wybierana na tym heksie; (c) kopalnia stoi -> fort nadal wybierany na tym heksie. Współistnienie warstw potwierdzone testem.

TESTY
- `node tools/auto-fort-claim-test.cjs`: 63/0 (było 51/0; +12 asercji: K 7, L 3, M 2; log `gate-r2-auto-fort-claim.txt`, EXIT=0).
- tsc --noEmit: EXIT=0 (`gate-r2-tsc.txt`). Kod produkcyjny niezmieniony od 692018b53, więc bramki diplomacy 148, war-era-counter 82, ring 15, autoimprove-stages-q1 302, auto-improvements 46, ai-improvements 56, fort-outpost 80, saveload 13, defeat-last-city 14 nie wymagały powtórki (NIE_POWTÓRZONE; wyniki R1 z gate-post-*.txt).
- `gra/node_modules` usunięte po pracy.

BLOKADY: 1) wiązanie w `main.ts` (decyzja orkiestratora o allowliście; bez tego krok nieaktywny w grze). 2) `isCityLimitExhausted` duplikuje wzór `canFoundCity` (cities.ts poza allowlistą; parytet pinowany testem P).
RUNDY: 2/5 (obrona R1)
NASTĘPNY KROK: Evaluator R2 (ten sam ID); orkiestrator rozstrzyga allowlistę `main.ts`.
DEPLOY/PUSH: NIE WYKONANO
