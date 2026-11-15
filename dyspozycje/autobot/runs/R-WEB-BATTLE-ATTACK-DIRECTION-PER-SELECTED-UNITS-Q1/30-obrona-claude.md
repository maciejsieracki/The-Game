# R-WEB-BATTLE-ATTACK-DIRECTION-PER-SELECTED-UNITS-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-ATTACK-DIRECTION-PER-SELECTED-UNITS-Q1
GOAL: Kierunek natarcia, Formacja i Konnica działają na DOKŁADNIE zaznaczone jednostki (także mieszane typy i różne grupy); brak zaznaczenia = cała armia; meta grupy ustawiana tylko przy zaznaczeniu wszystkich żywych jednostek grupy.
BAZA: ac3352c25 (origin/main). Kandydat r1: dc176f533 (kod 0fe506c53). Kandydat r2 (kod): c73c35ecd.
ZMIANY-COMMIT: c73c35ecd (gra/src/battle/battleScene.ts, gra/tools/battle-attack-dir-per-selection-test.cjs, docs/PORADNIK-GRACZA/10-walka.md, gra/src/data/wikiBundle.json) + commit tego raportu.

## Odpowiedź na zarzuty Evaluatora (3a84b8dc0)

1. ETAP 1 nie zmierzony w żywej grze (Chromium, ?civTest=1, zrzuty chipu) — PRZYJMUJĘ zarzut, NIE WYKONANO. Chromium jest w /usr/bin/chromium, ale w tej rundzie nie zbudowano poza repo wariantu gry z hookami bitewnymi i nie przeprowadzono scenariuszy (a)-(d) ani krótkiej bitwy AUTO. Kryterium binarne "tabela ZMIERZONO" NIESPEŁNIONE. Wymagany osobny temat pomiarowy albo decyzja FC/orkiestratora (zob. BLOKADY).
2. Testy (e)/(f) nie sprawdzały przestawienia zaznaczonych — PRZYJMUJĘ. Dodano (e2): zaznaczona konnica + Tył fizycznie zmienia pozycje konnicy; (f0): Formacja F1 przestawia tylko zaznaczoną piechotę (inf0/inf1). Mutacja M1 (no-op rozkazu konnicy) daje FAIL na (e2).
3. Brakujące testy — PRZYJMUJĘ CZĘŚCIOWO:
   - scenariusz 2 grup: DODANE (g: pełna G2 + 1 piechurz z G1 -> meta tylko G2; g2: cała grupa -> etykieta "cała grupa (5)").
   - chip "Natarcie: różne": DODANY test stanu (h, h2), flaga _deployAttackDirMixed. Sam tekst chipu (literał w kodzie) nie jest asertowany headlessly, bo generator chipu wymaga DOM — NIE ZMIERZONO w przeglądarce.
   - test (e) AUTO/SKIP deterministyczny: NIE ZROBIONO. Harness headless nie uruchamia auto-odgrywania; konsument kierunku (desiredHitForDirection, ok. l.6405/8364/8582/17897) nie ma tu testu. ODRZUCAM jako wykonane; pokrycie tylko pośrednie (istniejące testy C-FLANK zielone).
4. Dokumentacja i komentarze — PRZYJMUJĘ. Poradnik docs/PORADNIK-GRACZA/10-walka.md: nowy akapit o zakresie rozkazów (zgodny z kodem, bez obietnicy dziedziczenia przez grupę, zob. niżej). wikiBundle.json regenerowany (`node gra/tools/bundle-wiki-for-game.cjs`: 22 rozdz. + 181 haseł). Komentarze C-BITWA-FORMACJA i docstring _applyDeployAttackDirection zaktualizowane. NIE ZROBIONO: osobnego hasła w docs/encyklopedia.
5. Komunikat zakresu — CZĘŚCIOWO PRZYJMUJĘ: dodano "cała grupa (N)" (gdy zaznaczone WSZYSTKIE żywe jednostki jednej grupy, zob. test g2). ODRZUCAM część "zaznaczenie wszystkich żywych raportowane jak brak zaznaczenia": etykieta "cała armia" przy targets.length >= live.length jest PRAWDZIWA (zakres = cała armia, identyczny z brakiem zaznaczenia), więc zmiana nie jest potrzebna.
6. Przypadki brzegowe chipu — PRZYJMUJĘ obie (zweryfikowane w kodzie i testem):
   - _restoreDeployAttackDirSnapshot kończył bez flagi mixed, więc po powtórce bitwy chip pokazywał kierunek pierwszej jednostki. Poprawka: gdy kierunki żywych jednostek są różne -> _setDeployAttackDirection('front', true). Test (i). Mutacja M2 daje FAIL.
   - _syncDeployToolbarFromSelection bez zaznaczenia i bez aktywnej grupy nie aktualizował chipu. Poprawka: zakres = cała armia (dirScope). Test (h2).
7. Dług Rust REPIN nie zapisany w pliku — PRZYJMUJĘ. Zapisany w sekcji DŁUG RUST niżej (ten raport; allowlista runs/<ID>/**).

## Dodatkowe ustalenia (weryfikacja dispatchu)
- Meta grupy `attackDirection` jest ZAPISYWANA (_ensureGroupMeta(...).attackDirection), ale NIGDZIE NIE ODCZYTYWANA: grep po battleScene.ts nie pokazuje odczytu meta.attackDirection; konsumowane jest wyłącznie pole jednostki `ru.attackDirection`. Oznacza to, że "dziedziczenie z grupy" dla nowych jednostek NIE istnieje. Nie zmieniano tego (poza zakresem; do decyzji orkiestratora). Dispatch pytał o _effectiveMetaForUnit: ta funkcja nie zwraca attackDirection.
- Chip: poprawka dotyczy stanu/flagi; wygląd chipu NIE ZMIERZONY.

## TESTY (surowe wyniki, ta runda)
- npm ci w gra/ (71 pakietów): OK (node_modules tylko lokalnie, nie w commicie).
- tsc --noEmit (gra/): bez błędów (exit 0, pusty wynik).
- battle-attack-dir-per-selection-test.cjs: OK checks=32 (r1: 15).
- Mutacje (każda przywrócona do wersji poprawnej, po przywróceniu zielone):
  - M1 (no-op _applyDeployCavalryMode): FAIL (e2) selected cavalry physically repositioned by rear order.
  - M2 (wyłączona flaga mixed w restore): FAIL `false !== true` (asercje h/i).
  - M3 (rozszerzenie zaznaczenia na grupę): FAIL `'tyl' !== 'front'`.
- logic-test.cjs: LOGIC OK (213/213)
- tech-tree-test.cjs: 20 pass, 0 fail
- research-test.cjs: PASSED: 33 / FAILED: 0 / TOTAL: 33
- unit-replace-test.cjs: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test.cjs: COMBAT TEST: 6/6 pass
- battle-cavalry-flank-default-test.cjs: PASS 960 checks, PASS 536 checks. Pozostałe dwa C-FLANK (163, 994) NIE ZMIERZONE w tej rundzie.
- battle-deploy-cavalry-flanks-test.cjs: uruchomiony, ostatnie linie zgodne z powyższym; pełny wynik nie wpisany osobno.
- git diff --check: czysty.

## BLOKADY
- ETAP 1 w żywej grze (Chromium, zrzuty, krótka bitwa AUTO): NIE ZMIERZONO. Kryterium binarne niespełnione. Potrzebny osobny temat pomiarowy (build poza repo + hooki ?civTest=1).
- Test (e) AUTO/SKIP deterministyczny: NIE ZROBIONO (brak headless harness dla auto-odgrywania).
- Tekst chipu "Natarcie: różne" w DOM: NIE ZMIERZONO.
- Encyklopedia: brak wpisu zakresu (jest poradnik).

## DŁUG RUST REPIN (zapisany tutaj, bo kandydat nie ma rejestru)
1. Resolver `_resolveDeployFormationTargets` i reguły Formacji/Konnicy/Kierunku natarcia per zaznaczenie: port Rust musi mieć ten sam zakres (zaznaczenie dokładne; brak zaznaczenia = armia; meta grupy tylko przy pełnym pokryciu).
2. Chip "Natarcie: różne" (flaga mixed) i restore snapshotu z flagą mixed.
3. Meta grupy `attackDirection`: zapis bez odczytu w web. Decyzja: usunąć albo wdrożyć dziedziczenie, przed portem.
4. Komunikat zakresu: "zaznaczenie (N)" / "cała grupa (N)" / "cała armia".

## UWAGI-DLA-ORKIESTRATORA
- Pytanie do właściciela (nie rozstrzygałem): meta grupy `attackDirection` ma być odczytywana (dziedziczona) czy usunięta. Formacja i Konnica per zaznaczenie zostały wdrożone zgodnie z DODATKIEM 1.
- Kod c73c35ecd jest w lokalnym worktree, nie pushowano.

NASTĘPNY KROK: Evaluator r2 — weryfikacja zarzutów 1 i (e) AUTO (wymagają pomiaru w grze albo decyzji FC).
RUNDY: 2/5 (r1 dc176f533, r2 ten raport)
DEPLOY/PUSH: NIE WYKONANO
