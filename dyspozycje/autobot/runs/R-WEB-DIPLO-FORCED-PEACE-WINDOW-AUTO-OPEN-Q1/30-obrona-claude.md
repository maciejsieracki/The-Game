STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-FORCED-PEACE-WINDOW-AUTO-OPEN-Q1
GOAL: odpowiedź Operatora (obrona, Haiku) na zarzuty Evaluatora z bed92fdbe (raport 2fbfb2278); naprawa okna pokoju wymuszonego po końcu tury bez zmiany logiki pokoju.
BAZA: 899667a91e23fa3a796412a485b77a3da30221f4 (origin/main), merge-base --is-ancestor: OK. Start obrony: bed92fdbe.

ZMIANY-COMMIT: gra/src/main.ts (+3 linie, tylko odczyt): `__truceTestDebug.pendingForcedPeaceForTest()` zwraca kopię kolejki pendingForcedPeaceTreaties (pairKey, loser, winner), bez efektów. SHA commitu obrony: w polu sha rozkazu wyjściowego.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Hak dodany (gra/src/main.ts, obok runWearinessTickForTest). Dowód: git diff --stat = 1 plik, 3 insertions; git diff --check = bez wyjścia; tsc --noEmit -p gra = exit 0, 0 linii wyjścia. NIE ZMIERZONO: użycie haka w przeglądarce (brak testu żywego w tej rundzie).
2. PRZYJMUJĘ FAKT, NIE NAPRAWIAM W TEJ RUNDZIE. Test diplo-forced-peace-pending-live-paths-test.cjs nie został zmieniony (S4 i S2(a) nadal czerwone wg zarzutu). Zmiana testu (użycie haka, oznaczenie S2(b)/D2 jako NIE ROZSTRZYGNIĘTE) wymaga przebiegu live; nie wykonano. Zielony S4 zależy od decyzji A/B (zarzut 3 i pkt 4 poniżej).
3. CZĘŚCIOWO PRZYJMUJĘ. Potwierdzam, że tickAiAiWarWeariness jest domknięciem w main.ts (linia ~39164) i jest wołany z main.ts (~46733), więc opcja A (ponowny tick po zamknięciu bitwy) jest wykonalna bez zmiany war-weariness.ts. ODRZUCAM natomiast wniosek, że to wystarcza do naprawy bez decyzji: war-weariness.ts:390-391 jest decyzją ABC orkiestratora („pokój wymuszony ODROCZONY na następną turę, zarzut FC 1+2"). Opcja A cofa tę decyzję (pokój pojawia się w tej samej turze, po zamknięciu bitwy). Nie zmieniam tego bez ABC. NIE ZMIERZONO: czy ponowny tick w tej samej turze jest idempotentny (stepPairState/peak, despair, logi); nie sprawdzono na żywo.
4. PRZYJMUJĘ. Założenie dispatchu (D1: błąd pokazywania okna) jest błędne wg obu sond: pending pojawia się dopiero w turze, w której tick nie jest odroczony przez battlePending. Przyczyna to odroczenie przez bitwę (war-weariness.ts:391), nie błąd w main.ts. Pomiar tury 2→3 z sondy Operatora (pending=1, okno=1, pb-overlay=0) NIE jest odtworzony w tej rundzie: NIE ZMIERZONO.

ZMIERZONE:
- tsc --noEmit -p gra (npm ci --ignore-scripts wykonane w worktree): exit 0.
- git diff --check: bez wyjścia.
- git diff --stat: gra/src/main.ts | 3 +++.

NIE ZMIERZONO: test żywy (Chromium), mutacja, 5 bramek referencyjnych, testy diplo-forced-peace-pending-test / weariness / peace-vazne / stale-offer / stages-view, build vite, zrzut okna.

BLOKADY:
- Decyzja właściciela A/B (zarzut 3): A = ponowny tick po zamknięciu bitwy (zmiana momentu pokoju o 0 tur, cofa ABC z war-weariness.ts:390-391, wymaga allowlisty war-weariness.ts lub wywołania z main.ts + nowego testu); B = zostawić odroczenie, S4 przepisać na oczekiwanie okna w turze, w której tick tworzy pending (test-only).
- Bez A/B nie ma uczciwego zielonego S4.

RUNDY: 2/5 (ostatni werdykt Evaluatora: FAIL-DO-OPERATORA; decyzja wymagana).
NASTĘPNY KROK: decyzja właściciela A/B; po niej runda 3 (test S4 + ewentualna zmiana main.ts) i pełne bramki z przebiegiem live.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: worktree zostawiony z node_modules w gra/ (gitignored) do sprzątnięcia po zakończeniu tematu. Nie założono żadnych sesji ani zadań.
