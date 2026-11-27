STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EARLY-GRACE-15-IMPL-Q1
GOAL: obrona kandydata 8bdb4ce05 (okno łaski 15 tur: barbarzyńcy nie grają, utrzymanie gracza 0, Wojownik na Trudnym) wobec zarzutów Evaluatora (c127c9171). Poprawki w tej rundzie; pomiar na żywo NIE WYKONANY.
ZMIANY/COMMIT: 13c4b573c (podpisany) — gra/src/game/barbarians.ts, gra/src/main.ts, gra/tools/early-grace-15-test.cjs, dyspozycje/analizy/OKNO-LASKI-15-TUR-2026-11-27.md. Ten raport: osobny commit.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ, POPRAWIONE. Bramka w main.ts (faza barbarzyńców po turn++) widziała N+1. Dodano `barbariansGraceBlocksTurnEnd(turnAfterIncrement, graceTurns)` = `barbariansGraceActive(turnAfterIncrement - 1, graceTurns)` (barbarians.ts); main.ts używa jej zamiast `barbariansGraceActive(turn, ...)`. Domknięcie tury 15 (turn=16) jest blokowane, domknięcie 16 (turn=17) nie. Zgodne z utrzymaniem (aiUpkeepTickTurnOverride = N). Mutacja `- 1` usunięta: 5 czerwonych.

2. PRZYJMUJĘ, NIE WYKONANO. Pomiar na żywo na maksimum (Trudny, Wysoki x4, ziarna 4242 i 778899, pasywny gracz, t1–20, zero ataków barbarzyńców t1–15, ruch od t16) NIE został wykonany. Chrome jest dostępny (/usr/bin/google-chrome). Binarne kryterium dispatchu pozostaje niespełnione.

3. PRZYJMUJĘ, CZĘŚCIOWO POPRAWIONE. Dodano testy behawioralne funkcji bramki (domknięcie 16 blokowane, 17 nie; spójność z utrzymaniem dla tur 1..20; osobno easy/normal/hard). Samo wywołanie w bloku main.ts nadal pinowane tekstowo, bo blok jest inline w pętli tury. Bramka blokuje też spawn i tick obozów, więc pierwszy obóz może powstać dopiero przy domknięciu tury 16. Dispatch mówił „mogą powstawać (spawn)” — odstępstwo opisane jako ZAŁOŻENIE w dokumencie, do decyzji orkiestratora. Kodu w tej sprawie nie zmieniano.

4. PRZYJMUJĘ, POPRAWIONE. Test „dane: klucze okna w ai-params.json = 15” czyta wartość pod kluczami z eksportowanych stałych (BARBARIAN_GRACE_TURNS_KEY, PLAYER_UPKEEP_GRACE_TURNS_KEY). Mutacja wartosc 15→5 w ai-params.json: czerwone loadBarbGraceTurns oraz okno barbarzyńców easy/normal/hard (plik przywrócony; git diff ai-params.json pusty).

5. PRZYJMUJĘ, POPRAWIONE. Dodano pętle easy/normal/hard dla utrzymania (złoto, żywność, surowce: t1 i t15 = 0, t16 > 0) i dla okna barbarzyńców. Asercja surowców t16 zmieniona z `>= 0` na `> 0` (przechodzi).

6. PRZYJMUJĘ, UZUPEŁNIONE W DOKUMENCIE. Dokument: korekta bramki z uzasadnieniem, założenie o spawnie, tsc poprawiony (typescript 5.9.3 z gra/package-lock.json: 0 błędów; wcześniejsze 177 dotyczyło sandboxowego TS 6.0.2 i zostaje odwołane), NIE ZMIERZONO dla prognozy t1 „Zakończ turę”, wpływu na AI i pomiaru na żywo. Teksty wiki/tooltip „Barbarzyńcy”: NIE SPRAWDZONO (poza zakresem tej rundy).

7. PRZYJMUJĘ, Z DOWODEM ŹRÓDŁA. Pin unit-upkeep-cost-pace-test: 80 ok / 1 FAIL („wszystkie wywołania silnika utrzymania w 27 miejscach niosą tempo”). Ta runda nie zmienia żadnej linii main.ts z `kosztJednostekPace` (`git diff HEAD -- gra/src/main.ts | grep -c kosztJednostekPace` = 0), więc porażka jest sprzed tematu, zgodnie z oceną Evaluatora (baza 6afdec814: 80/1). Nie naprawiano — nie wynika z tej decyzji. Podgląd jednostek (main.ts ~34590–34595) używa paceUtrzymaniaWlasciciela, pokrytego testami tempa gracza w t1/t15/t16; bezpośredniego testu wyświetlanej wartości nie dodano.

## Testy (surowe wyniki)
- node tools/early-grace-15-test.cjs: 33 passed, 0 failed (przed rundą: 24/0)
- mutacja `- 1` w barbariansGraceBlocksTurnEnd: 28 passed, 5 failed (plik przywrócony)
- mutacja ai-params.json wartosc 15→5: czerwone loadBarbGraceTurns + okno Easy/Normal/Hard (przywrócone)
- tsc --noEmit (typescript 5.9.3): exit 0, brak wyjścia
- tools/ai-home-defense-vs-barbarians-test.cjs: 64 passed, 0 failed
- tools/barbarian-cooperation-grace-maints-wiring-test.cjs: 29 passed, 0 failed
- tools/barbarian-cooperation-grace-test.cjs: 30 passed, 0 failed
- tools/barbarians-test.cjs: 213 passed, 0 failed
- tools/diplomacy-barbarian-cooperation-test.cjs: 10 passed, 0 failed
- tools/ai-difficulty-bonus-test.cjs: 97 passed, 0 failed
- tools/unit-upkeep-cost-pace-test.cjs: 80 ok / 1 FAIL (sprzed tematu, zarzut 7)
- Pomiar na żywo: NIE WYKONANO

## BLOKADY
- Pomiar na żywo na maksimum (binarne kryterium dispatchu) nie wykonany. To luka, nie dowód.
- Blokada spawnu obozów do domknięcia tury 16 (założenie, zarzut 3).

## RUNDY
2/5 (obrona po zarzutach Evaluatora c127c9171). Ostatni werdykt: FAIL/zarzuty Evaluatora.
DECYZJA WYMAGANA: brak po stronie Operatora. Do decyzji orkiestratora: (a) bieg na żywo na maksimum przed FC, (b) akceptacja blokady spawnu obozów w t1–15.

## NASTĘPNY KROK
Evaluator, potem Final Control. Orkiestrator decyduje o (a) i (b).

## UWAGI-DLA-ORKIESTRATORA
- Środowisko: worktree nie miał gra/node_modules. Zainstalowano lokalnie esbuild i typescript 5.9.3 (--no-save, bez zmian w package.json i lock). Katalog gra/node_modules usunięto po testach.
- Commit 13c4b573c jest podpisany (ssh). Komunikat ostrzegawczy gpg.ssh.allowedSignersFile pojawił się przy `git log --format=%G?`, nie przy commicie.
- Chrome dostępny (/usr/bin/google-chrome): pomiar na żywo możliwy, nie wykonano w tej rundzie.

DEPLOY/PUSH: NIE WYKONANO
