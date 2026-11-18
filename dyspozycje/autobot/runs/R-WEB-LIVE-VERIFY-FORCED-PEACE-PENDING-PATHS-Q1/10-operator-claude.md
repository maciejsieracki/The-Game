STATUS: PASS-WITH-NOTES (test żywy dodany; wynik zmierzony: 2 defekty-kandydaty, 2 scenariusze NIE ZMIERZONO)
DOMAIN: GAME (pomiar na żywo; zmiany tylko gra/tools i raport; gra/src nietknięte)
TEMAT: R-WEB-LIVE-VERIFY-FORCED-PEACE-PENDING-PATHS-Q1
GOAL: żywy test ścieżek pokoju wymuszonego z oczekującą akceptacją (scenariusze 1–5 z dispatchu) + raport.
ZMIANY-COMMIT: gra/tools/diplo-forced-peace-pending-live-paths-test.cjs (nowy); dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-FORCED-PEACE-PENDING-PATHS-Q1/10-operator-claude.md; dowody/ (zrzut okna, wyniki JSON realny build i mutacja). Baza 1dd3958be (origin/main), gałąź detached.
TESTY (liczby z surowego wyjścia):
- tsc --noEmit: EXIT 0.
- Build Vite poza repo (scratchpad): OK, 16 s.
- Żywy test, realny build: S4 FAIL (okno nie pojawiło się w 15 s po turze z wojną 40 — asercja „okno widoczne”; reszta S4: Esc/tło nie zamykają OK, klik i Enter na „Zakończ turę” nie kończą tury OK 2→2, akceptacja zdejmuje okno i ustawia status „pokoj” OK, tura kończy się OK). S3: wpis „Pokój zawarty … Pokój bez wymiany miast” w warLog OK; tekst okna bez wierszy „Oddajesz” (brak miast w planie) — asercja okna FAIL. S2: FAIL (po akceptacji pierwszego tura odblokowana, para z drugą cywilizacją nadal „wojna”, okno drugiego nie wraca). Zero pageerror/console.error.
- Mutacja (kopia w scratchpad, usunięty `if (pending) return false` w canPlayerInitiateEndTurn): test CZERWIENIEJE — Enter na „Zakończ turę” przesuwa turę 2→3 (FAIL). Przycisk klikany siłą nie kończy tury nawet w mutacji (osobny guard w UI), więc tylko Enter wykrywa usunięcie bramki.
- 5 bramek referencyjnych (logic/tech-tree/research/unit-replace/combat) i testy FORCEDPEACE: NIE ZMIERZONO (nie uruchamiano; src nie zmieniany, zmiana tylko nowy plik w tools).
BLOKADY: scenariusz 1 (zapis/wczytanie z pending) NIE ZMIERZONO — brak haka odczytu meta.pendingForcedPeaceTreaties i helpera zapis+wczytaj. Scenariusz 5 (AI↔AI) NIE ZMIERZONO — brak haka wieku wojny dla par AI↔AI.
DEFEKTY-KANDYDACI (do zbadania, nie naprawiane):
D1 (src/main.ts ~26038 showNextPendingForcedPeace / ~41504): po turze, w której wojna dobiła do 100%, okno pokoju wymuszonego nie pojawia się automatycznie (0 wystąpień w 45 s obserwacji; „Zakończ turę” zablokowane). Okno pojawiło się dopiero w przebiegu testu po próbach zakończenia tury — do potwierdzenia, czy to zamierzone.
D2 (src/main.ts ~26060 acceptPendingForcedPeace): przy dwóch wojnach w tym samym ticku po akceptacji pierwszego blokada znika, a druga para zostaje w „wojna” bez okna. Możliwe: druga oczekująca pozycja nie powstała albo została usunięta przez prune — wymaga odczytu kolejki.
D3: w realnym buildzie komunikat „Nie można zakończyć tury” nie pojawił się w DOM po zablokowanych próbach (w mutacji się pojawił) — sprawdzić, czy wpis Ważne powstaje (panel zamknięty = niewidoczny).
HAKI-PROPOZYCJA (test-only, NIE w src): __truceTestDebug.pendingForcedPeaceForTest() zwracający listę {pairKey, loser, winner}; __truceTestDebug.endFullTurnSaveLoadForTest() dla S1; __truceTestDebug.setWarAgeForPair(a,b,n) dla S5.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o osobnym temacie R-WEB-* na D1/D2/D3 (naprawa poza tym tematem) i o dodaniu haków test-only.
DEPLOY/PUSH: NIE WYKONANO
