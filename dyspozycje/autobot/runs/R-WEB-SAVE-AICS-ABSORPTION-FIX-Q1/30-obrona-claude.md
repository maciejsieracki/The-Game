STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-AICS-ABSORPTION-FIX-Q1 (tag AICSFIX), obrona po raporcie Evaluatora (f0de71dadcfbc2a98dc8d336a4dee8c4d8e8c891), runda 2, Operator HAIKU 5.5
GOAL: odpowiedzieć na trzy zarzuty Evaluatora dowodem; doprowadzić kryterium (b) bunt/7/t7 do 6/6 tur B==A na kodzie kandydata; wzmocnić test statyczny o mutacje semantyczne; uzupełnić dokument.
ZMIANY/COMMIT: kod gry gra/src/main.ts NIETKNIĘTY (identyczny z 6d623cea0). Zmienione: gra/tools/save-load-ai-cs-absorption-state-test.cjs (T1/T2 wzmocnione, +6 mutacji na mapę), dyspozycje/analizy/ZAPIS-AICS-ABSORPCJA-POPRAWKA-2026-11-28.md (wyniki rundy 2), dyspozycje/autobot/runs/R-WEB-SAVE-AICS-ABSORPTION-FIX-Q1/ (aics-bunt7-r2-A/B .json i .txt, ten raport). Commit: SHA w polu sha wyniku. Baza: 6d623cea0.

ODPOWIEDZI NA ZARZUTY
Zarzut 1 (dowód 6/6 nieobecny w commicie): PRZYJĘTY, naprawiony w tej rundzie.
  Dowód: uruchomiony na żywo ponownie na gra/src = 6d623cea0 (dist zbudowany poza repo w scratchpad, vite build, bez npm run build). Komenda A: `node tools/save-load-continuity-live.cjs --mode A --dist <scratch>/dist-aicsfix-r2 --cfg bunt --seed 7 --saves 7 --k 6` (zakończona w jednym wywołaniu, EXIT=0, 10:50:15–10:59:22). Komenda B: ta sama z `--mode B` (EXIT=0, 11:03:43–11:04:56).
  Wynik B (z aics-bunt7-r2-B.json): cfgUsed barbariansLevel trudny, difficulty Trudny, rivals 9, civTypesCount 14; aiCs przy zapisie t7 fail 0 / trybut 106 / wasal 106; po wczytaniu fail 0 / trybut 106 / wasal 106; rebuild false; tury 8,9,10,11,12,13 equal=true, diffs=0 (6/6); anyDiff false; pageErrors 0; VERDICT PASS.
  Zrzuty w repo: dyspozycje/autobot/runs/R-WEB-SAVE-AICS-ABSORPTION-FIX-Q1/aics-bunt7-r2-A.txt, aics-bunt7-r2-A.json, aics-bunt7-r2-B.txt, aics-bunt7-r2-B.json.
  Różnica wobec rundy 1: poprzedni bieg A był przerwany limitem wywołania po t11; tym razem cały bieg A mieścił się w jednym wywołaniu (tury 1–7 po 42–49 s, zapis + 6 tur po 17–23 s). Runner nie został zmieniony.
  Zarzut Evaluatora był zgodny z faktami w rundzie 1: 4/4 tur (8–11), brak artefaktu 6/6. Teraz artefakt 6/6 istnieje w commicie.

Zarzut 2 (12/0 z dispatchu vs 21 sprawdzeń): PRZYJĘTY jako rozbieżność opisowa (nie wymagało zmiany kodu).
  Dispatch podawał 12/0, bo to stan testu PRZED rozszerzeniem (9 baz + 3 mutacje). Rozszerzenie r1 dało 21/0 (9 + 12). Po wzmocnieniu z zarzutu 3 jest 27/0 (9 + 18). Potwierdzenie: `cd gra && node tools/save-load-ai-cs-absorption-state-test.cjs` → WYNIK: 27 PASS / 0 FAIL, EXIT=0.

Zarzut 3 (test statyczny przepuszcza mutację semantyczną M2 i nie sprawdza kolejności clear->restore): PRZYJĘTY, naprawiony w tej rundzie.
  Zmiany w gra/tools/save-load-ai-cs-absorption-state-test.cjs:
  - T1 wymaga teraz dokładnie `<pole>: Array.from(<pole>.entries()),` (kotwica na przecinku). Wzorzec z `.slice(0,0)` nie przechodzi.
  - T2 sprawdza indeksami kolejność: drugie `.clear()` < odczyt `saved.meta?.<pole>` < `.set(` w odległości <400 znaków.
  - Nowe mutacje na każdą z 3 map: "zapis obcięty slice(0,0)" (= M2 z recenzji) i "czyszczenie po odtworzeniu" (kolejność clear->restore).
  Dowód (wynik surowy): mutacja M2 dla aiCsFailCount, aiCsTrybutSince, aiCsWasalSince → każda czerwieni T1 (`PASS T4 zapis obciety slice(0,0) <pole> -> test czerwienieje (T1 zapis <pole>)`). Mutacja kolejności → czerwieni T2.

TABELA MUTACJI (surowe wyjście node tools/save-load-ai-cs-absorption-state-test.cjs, runda 2):
  wyciety zapis: T1 (×3 mapy) czerwone
  zapis obciety slice(0,0): T1 (×3) czerwone
  wyciete odtworzenie: T2 (×3) czerwone
  wyciete czyszczenie przy resecie: T2 + T3 (×3) czerwone
  wyciete czyszczenie przy wczytaniu: T2 + T3 (×3) czerwone
  czyszczenie po odtworzeniu: T2 (×3) czerwone
  WYNIK: 27 PASS / 0 FAIL.

TESTY (runda 2):
- Test statyczny: 27/0 (zob. wyżej), EXIT 0.
- Test żywy: patrz zarzut 1 (bunt/7/t7 6/6 PASS; cfgUsed max).
- Kontrole t3 (max/4242, bunt/7, aionly/4242 z rundy 1): NIE POWTARZANE w tej rundzie. Kod gry nieruszony, więc wyniki rundy 1 pozostają obowiązujące (B==A 6/6 każda).
- Bramki (tsc, logic, tech-tree, research, unit-replace, combat, ai-test, early-grace-15, society-breakdown, ai-city-order-need-wiring): NIE ZMIERZONO W TEJ RUNDZIE. Powód: gra/src nieruszony względem 6d623cea0, a zmieniony plik (test statyczny) nie wchodzi do tych bramek. Liczby z rundy 1 (surowe wyjście Operatora r1): tsc exit 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297/0; early-grace-15 33/0; society-breakdown 56/0; ai-city-order-need-wiring 267/0.

BLOKADY: brak dla kryteriów (a)–(e) dispatchu. Otwarte (poza zakresem): pełna macierz SAVEMAT (A==A', klik UI, aionly/bunt t10, render 3D) i audyt kandydatów z dokumentu sekcja 2 — zgodnie z dispatchem, osobne tematy.
  Uwaga procesowa: zmieniony plik test (T1/T2) jest sprawdzany przez mutacje; nie zmienia on semantyki kodu gry.

RUNDY: 2/5. Ostatni werdykt: Evaluator r1 (f0de71da) — zarzuty 1–3, wszystkie przyjęte. Decyzja wymagana: brak (ABC nie dotyczy).
NASTĘPNY KROK: Evaluator (weryfikacja nowych mutacji i dowodu 6/6), potem Final Control. Orkiestrator decyduje o FC na podstawie SHA w polu sha.
DEPLOY/PUSH: NIE WYKONANO
