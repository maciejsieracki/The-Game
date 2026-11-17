STATUS: DECISION_REQUIRED (obrona, runda 2 tego ID; odpowiedź na zarzuty Evaluatora r2: 1, 2, 5, 6, 7, 8 PRZYJĘTE z poprawką/dowodem; 3 i 4 PRZYJĘTE w części dotyczącej raportu, a pomiar brakujący NIE ZMIERZONO i wymaga decyzji właściciela lub nowej rundy)
DOMAIN: GAME (pomiar na żywo, bez zmian w gra/src i gra/data)
TEMAT: R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1
GOAL: punkt 3 dispatchu w pełnej formie (straty zwycięzcy: ręczna vs AUTO vs skip, pary 10 vs 10 wręcz i dystans, ≥3 ziarna w trybie „losowe”). Ta obrona NIE zmienia zakresu pomiaru; poprawia uczciwość raportu i dowody.
BAZA: 0619b1a6dd0cfa4eb603395976b5261f18988d7c (kandydat r2 Operatora). Kod gry (gra/src, gra/data) niezmieniony względem d5323fadf.

ODPOWIEDZI NA ZARZUTY EVALUATORA (ffea2c496)

Zarzut 1 (evidence JSON i harness niezacommitowane): PRZYJMUJĘ. Skopiowano z worktree wf_ed85d031-35c-1 (ta sama zawartość, potwierdzona przez odczyt JSON) i zacommitowano w tej obronie:
- dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-OBSERVATIONS-W18-W24-MANUAL-LOSSES-Q1/evidence/w3-manual-auto-skip-r2.json
- gra/tools/live-verify-w18-w24-manual-losses-r2-manual.cjs
Dowód: `git diff --stat` tej obrony (SHA w polu ZMIANY-COMMIT). Pomiar jest odtwarzalny z SHA.

Zarzut 2 (bitwa „ręczna” to Start + jedna Spacja): PRZYJMUJĘ. Etykieta w tabeli zmieniona na „RĘCZNY-START (klik Start + 1 Spacja, bez rozkazów jednostkom)”. Potwierdzone z JSON: actions.spacePresses = 1 i actions.startClick = true w 4 przebiegach manual; zero kliknięć rozkazów. Wynik „ręczny” NIE jest pomiarem sterowania gracza.

Zarzut 3 (brak drugiego podejścia): PRZYJMUJĘ. Wymóg „max 2 podejścia przed NIE ZMIERZONO” był niespełniony w r2 (r2 napisała „brak czasu”, co nie jest dopuszczalnym powodem). W tej obronie wykonano podejście 2: gra/tools/battle-manual-full-roster-pointer-live-test.cjs (pointer, 28 vs 28, klik na płótnie). Wynik: 2 próby, obie FAIL na starcie przeglądarki, przed jakimkolwiek kliknięciem w bitwie:
- próba 1: `browserType.launch: Target page, context or browser has been closed`, Chromium /usr/bin/chromium pid=15317, SIGTRAP (log: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/r2-pointer.log)
- próba 2 (ponowienie tego samego harnessu, TMPDIR w scratchpad): ta sama awaria, pid=15508 (log: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/r2-pointer-retry.log)
Stan do wznowienia: krok 0 (uruchomienie Chromium z harnessu), selektor: brak, błąd: SIGTRAP przy starcie procesu. Ręczne sterowanie jednostkami: NIE ZMIERZONO.

Zarzut 4 (brak par 10 vs 10 i twierdzenie „bez zmiany gra/src się nie da” niezweryfikowane): PRZYJMUJĘ część dotyczącą twierdzenia, pomiar pozostaje NIE ZMIERZONO. Wycofuję zdanie „bez zmiany gra/src nie ma takiego presetu” w wersji absolutnej. Fakty:
- Presety bitwy są stałe 28 vs 28: gra/src/game/playtestWalkaMapy.ts (ROSTER Rzym: 10 Hastati + 10 Łucznik + 8 Konnica; Grecja: 10 Falanga + 10 Łucznik + 8 Konnica).
- Istnieje hak dodawania jednostek: window.__civTest.addUnit(ownerId, q, r, civilian) (gra/src/game/civ-test-hooks.ts, deklaracje ok. linii 52, 154, 219), używany w gra/tools/prebattle-rawids-roster-q1.cjs (ok. linii 127). NIE ZWERYFIKOWANO, czy da się nim zbudować rozstawienie 10 vs 10 dla bitwy ręcznej i AUTO. Pary 10 vs 10 (Wojownik vs Wojownik; Łucznik vs Wojownik) NIE ZMIERZONO.

Zarzut 5 (skip przez bs.skip(), AUTO przez _setSpeedIdx(3), trafienia przez __civSetHitMode): PRZYJMUJĘ jako notę. Metody są jawnie oznaczone w JSON (actions.skipClick = "fallback-metoda"). Wiersze skip NIE dowodzą zachowania przycisku Pomiń w UI. Wiersze AUTO: klawisz R (rToggle) bez klawisza prędkości.

Zarzut 6 (niezgłoszona rozbieżność AUTO vs skip przy tym samym ziarnie, także w „pewne”): PRZYJMUJĘ jako obserwację (poniżej, OBSERWACJA 5). Nie interpretuję przyczyny; r1 w bazie (evidence/w3-straty-zwyciezcy-seeds123.json) pokazuje te same wartości dla AUTO i skip.

Zarzut 7 (wyniki 5 bramek referencyjnych nieraportowane): PRZYJMUJĘ. Bramki uruchomione w tej obronie na 0619b1a6 (liczby z surowego wyjścia, sekcja TESTY).

Zarzut 8 (status PASS-WITH-NOTES przy niepełnym punkcie 3): PRZYJMUJĘ. STATUS zmieniony na DECISION_REQUIRED: punkt 3 w pełnej formie nie zmierzony, ręczny tryb nie jest ręczny, decyzja o zakresie kolejnego pomiaru należy do właściciela.

TESTY (liczby z surowego wyjścia, uruchomione w tej obronie na 0619b1a6dd0cfa4eb603395976b5261f18988d7c, gra/node_modules dowiązane z worktree wf_ed85d031-35c-1):
- `npx tsc --noEmit` → TSC_EXIT=0 (bez wyjścia błędów)
- `node tools/logic-test.cjs` → "LOGIC OK (213/213)", exit 0
- `node tools/tech-tree-test.cjs` → "tech-tree-test: 20 pass, 0 fail", exit 0
- `node tools/research-test.cjs` → "PASSED: 33 / FAILED: 0 / TOTAL: 33", "ALL GREEN", exit 0
- `node tools/unit-replace-test.cjs` → "[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)", exit 0
- `node tools/combat-test.cjs` → "COMBAT TEST: 6/6 pass", exit 0
- Podejście 2 (pointer): patrz ZARZUT 3 (2 próby, FAIL na starcie Chromium, zero pomiarów).
- Pomiar r2 (12 przebiegów) NIE powtórzony w tej obronie; liczby poniżej sprawdzone ponownie z JSON (node, odczyt evidence/w3-manual-auto-skip-r2.json, errors=0 we wszystkich 12 wpisach).

WYNIKI POMIARU r2 (dane z JSON; atakujący = Rzym 28, obrońca = Grecja 28; para 1:1 mieszana 28 vs 28, preset testBattle bitwa-duza; brak par 10 vs 10):

| para | tryb trafień | ziarno | tryb bitwy (metoda) | zwycięzca | straty zwycięzcy | straty przegranego | rundy |
|---|---|---|---|---|---|---|---|
| 1:1 mieszana 28 vs 28 | pewne | 1 | RĘCZNY-START (klik Start + 1 Spacja; bez rozkazów) | obrońca | 16/28 | 28/28 | 15 |
| 1:1 mieszana 28 vs 28 | pewne | 1 | AUTO (klawisz R; prędkość 8× metodą _setSpeedIdx) | atakujący | 11/28 | 28/28 | 19 |
| 1:1 mieszana 28 vs 28 | pewne | 1 | skip (metoda bs.skip(), nie klik) | atakujący | 10/28 | 28/28 | 19 |
| 1:1 mieszana 28 vs 28 | losowe | 1 | RĘCZNY-START | obrońca | 18/28 | 28/28 | 17 |
| 1:1 mieszana 28 vs 28 | losowe | 1 | AUTO | atakujący | 10/28 | 28/28 | 29 |
| 1:1 mieszana 28 vs 28 | losowe | 1 | skip (metoda) | atakujący | 13/28 | 28/28 | 30 |
| 1:1 mieszana 28 vs 28 | losowe | 2 | RĘCZNY-START | atakujący | 10/28 | 28/28 | 30 |
| 1:1 mieszana 28 vs 28 | losowe | 2 | AUTO | obrońca | 11/28 | 28/28 | 16 |
| 1:1 mieszana 28 vs 28 | losowe | 2 | skip (metoda) | obrońca | 12/28 | 28/28 | 18 |
| 1:1 mieszana 28 vs 28 | losowe | 3 | RĘCZNY-START | obrońca | 14/28 | 28/28 | 20 |
| 1:1 mieszana 28 vs 28 | losowe | 3 | AUTO | atakujący | 4/28 | 28/28 | 26 |
| 1:1 mieszana 28 vs 28 | losowe | 3 | skip (metoda) | atakujący | 3/28 | 28/28 | 27 |

Pary wymagane przez dispatch, a NIE zmierzone: wręcz Wojownik vs Wojownik 10 vs 10; dystans Łucznik vs Wojownik 10 vs 10. Ręczne sterowanie (klik po kliku): NIE ZMIERZONO.

OBSERWACJE (dane, bez oceny balansu):
1. Dla każdego z 4 ziaren zwycięska strona w trybie RĘCZNY-START różni się od AUTO/skip (P1 pewne: obrona vs atak; P2 losowe s1: obrona vs atak; P3 losowe s2: atak vs obrona; P4 losowe s3: obrona vs atak). Przyczyna prawdopodobnie w driverze: po pierwszej Spacji walka idzie dalej bez rozkazów (JSON: _battleAwaitingOrders = false wg r2 OBSERWACJA 2). Nieweryfikowane w tej obronie.
2. Wynik RĘCZNY-START nie jest pomiarem sterowania gracza (nie wydano żadnych rozkazów). Nie interpretować jako wynik gracza ani błąd balansu.
3. Tryb „pewne” dla ziarna 1 daje ten sam wynik AUTO/skip co w r1 (zgodne z dispatchem: „pewne” deterministyczne; nie badano innych ziaren w tym trybie).
4. Ziarna 1, 2, 3 w trybie „losowe” dają różne wyniki (AUTO: 10/11/4 strat zwycięzcy; skip: 13/12/3).
5. AUTO vs skip przy tym samym ziarnie dają różne straty zwycięzcy także w trybie „pewne” (P1 pewne s1: AUTO 11/28, r19 vs skip 10/28, r19; ta sama strona wygrywa). Rozbieżności w pozostałych parach: losowe s1 AUTO 10/28 r29 vs skip 13/28 r30; losowe s2 AUTO 11/28 r16 vs skip 12/28 r18; losowe s3 AUTO 4/28 r26 vs skip 3/28 r27. Różnica istnieje w r1 (ten sam wynik na tych samych ziarnach dla AUTO i skip), nie została zbadana; zgłaszam jako dane do decyzji, nie jako wniosek o defekcie.

BLOKADY (jawnie):
1. NIE ZMIERZONO — ręczne sterowanie jednostkami (klik po kliku, rozkazy na płótnie). Podejście 1 (klik Start + Spacja): wykonane, bez rozkazów. Podejście 2 (battle-manual-full-roster-pointer-live-test.cjs): 2 próby, FAIL na starcie Chromium (SIGTRAP), zero kliknięć w bitwie. Stop: krok browser-launch.
2. NIE ZMIERZONO — pary 10 vs 10 (wręcz i dystans). Presety stałe 28 vs 28; możliwa droga przez __civTest.addUnit NIE zweryfikowana.
3. Metody nie-klikowe (skip, AUTO prędkość, trafienia) — jawnie w JSON, opisane w ZARZUCIE 5.
4. Infrastruktura r2 (bez wpływu na wyniki wpisane do tabeli): powtórzone przebiegi P3/P4 (timeout pętli klatek; zamknięcie przeglądarki) — wyniki tabeli pochodzą wyłącznie z przebiegów bez błędu.
5. Punkt 1 (W18) i punkt 2 (W24) nie mierzone w tej obronie (W24 wynik r1 zachowany, evidence/w24-lewy-baner-w1024-900-800.json).

ZMIANY-COMMIT: ten raport (30-obrona-claude.md), evidence/w3-manual-auto-skip-r2.json, gra/tools/live-verify-w18-w24-manual-losses-r2-manual.cjs. Brak zmian w gra/src, gra/data, gra-robocza, WERSJE.md. Brak git add -A. Nie zmieniano 10-operator-claude.md.

RUNDY: 2/5 w tym ID (r2 Operatora i obrona r2; ta obrona = runda 2 obrony po zarzutach Evaluatora r2).

NASTĘPNY KROK (decyzja orkiestratora/właściciela):
(a) Decyzja, czy punkt 3 w pełnej formie (10 vs 10, pary wręcz/dystans, klik po kliku) ma być osobnym tematem z zakresem pomiaru i ewentualnym dostępem do __civTest.addUnit; to nowa runda pomiarowa, nie obrona.
(b) Wyjaśnienie rozbieżności AUTO vs skip (OBSERWACJA 5) — osobny temat diagnostyczny, jeśli właściciel uzna za istotne.
(c) Naprawa uruchamiania Chromium dla harnessu pointer (SIGTRAP przy starcie) — infrastruktura, osobny niski priorytet.

UWAGI-DLA-ORKIESTRATORA:
1. Pliki pomocnicze poza commitem: symlink gra/node_modules → worktree wf_ed85d031-35c-1/gra/node_modules (utworzony tylko do bramek; nie usunięty, bo zakaz rm w tym temacie); katalog r2tmp i logi r2 w scratchpad (/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/).
2. Worktree wf_ed85d031-35c-1 (detached 0619b1a6) nadal zawiera te same pliki jako nieśledzone — po integracji do sprzątania.

DEPLOY/PUSH: NIE WYKONANO
