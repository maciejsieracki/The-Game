# R-WEB-TEST-DEBT-AMBUSH-LIVE-B3-B5-B6-Q1 (AMBLIVE)

DOMAIN: GAME/PROCESS (dług testowy zasadzek; błąd w testach — stała zgoda właściciela z 2026-11-01) · Operator HAIKU · Evaluator SONNET · Obrona HAIKU · FC SONNET · max 5 rund.

## Tło
`gra/tools/ambush-live-test.cjs` ma 3 scenariusze czerwone na bazie i na kandydatach (23 PASS / 3 FAIL: **B3, B5, B6**) — stwierdzone w AMBGEN (FALA 795) jako dług sprzed tematu: scenariusz „AI wpada w zasadzkę gracza” nie ma zielonego dowodu na żywo. Zasadzki: AMBUSH-CORE (FALA 786), AMBUSH-DEPLOY (FALA 788), AMBGEN (FALA 795; zasadzka tylko z generałem).

## GOAL
Ustalić przyczynę czerwieni B3, B5, B6 (przestarzała asercja/fixture po AMBUSH-DEPLOY i AMBGEN, flake czasowy, czy realny błąd kodu) i doprowadzić do zielonego (23/23 lub 26/26 wg liczby scenariuszy) — przez naprawę testu/fixture, a jeśli to realny defekt kodu gry: minimalna naprawa w `gra/src` z testem czerwieniejącym przed poprawką (opisz w raporcie jako defekt z dowodem).

## Zakres
- `gra/tools/ambush-live-test.cjs`, `ambush-live-vite.config.ts` i powiązane (`ambush-*-test.cjs`). Zacznij od uruchomienia B3/B5/B6 (`--only B`, xvfb, vite `--outDir` poza repo wg C-001) i zapisu surowych komunikatów FAIL; odczytaj, co asercje oczekują, i porównaj z aktualnym zachowaniem (rozstawienie na polu wroga, szyk ≤3, wymóg generała).
- Dla każdego scenariusza: przyczyna (jedno zdanie + cytat) i naprawa. Nie osłabiaj asercji bez uzasadnienia z aktualnych decyzji właściciela (zasadzka tylko z generałem — gracz i AI; rozstawienie na polu wroga, szyk ≤3).

## Kryteria binarne
- B3, B5, B6 zielone; pozostałe scenariusze bez nowej czerwieni; ambush-core 48/0, save-roundtrip 7/0, ui-reason 10/0, wiring 28/0, realstep 16/0 bez zmian.
- Dla każdej zmiany testu: dowód mutacyjny (kopia pliku, NIE `git checkout`) że nowa/zmieniona asercja czerwienieje na odwrotnym zachowaniu.
- tsc bez nowych błędów; 5 bramek referencyjnych; brak zmian w `gra/data`, `gra-robocza`, `WERSJE.md`.

## Zakazy
`npm run build/dev` w `gra/`, `git add -A`, `rm/rmdir/unlink` w komendach, logi do /tmp, PNG nie do repo; nie zmieniaj reguł zasadzek ani balansu — decyzje produktowe → `DECISION_REQUIRED`. Model Operatora HAIKU.
