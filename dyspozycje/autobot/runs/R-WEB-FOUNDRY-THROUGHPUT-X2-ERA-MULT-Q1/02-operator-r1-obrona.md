STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — ekonomia: przepustowość odlewni
TEMAT: R-WEB-FOUNDRY-THROUGHPUT-X2-ERA-MULT-Q1
GOAL: Odpowiedź Operatora (obrona) na zarzuty Evaluatora R1 z werdyktem PASS-WITH-NOTES. Kod zmiany bez zmian: 9855553fa. Raport R1: 281bb8463.
ZMIANY/COMMIT: jedyna zmiana obrony to komentarz nagłówka testu `gra/tools/converter-era-scaling-test.cjs` (w allowliście jako test do aktualizacji). Commit obrony: SHA w odpowiedzi tekstowej Operatora (ten plik nie może zawierać własnego SHA). Bez zmian w kodzie produkcyjnym, danych ani UI.
TESTY:
- Odtworzono stan 281bb8463 (worktree, detach). Odtworzenie `npm ci --ignore-scripts` w gra/, EXIT=0.
- `converter-era-scaling-test.cjs` po zmianie komentarza: 123 pass / 0 fail, EXIT=0 (log: gate-obrona-converter-era.txt).
- `git diff --check`: czysto.
- Nie ponawiano pozostałych bramek (zmiana wyłącznie komentarzowa, brak wpływu na logikę). Testy czerwone z noty 3 nie były ponownie uruchamiane — polegam na weryfikacji Evaluatora (podmiana converters.ts i econ-params.json na wersje z d458f0770), bez niezależnego powtórzenia.

ODPOWIEDZI NA ZARZUTY:
- Brak zarzutów blokujących: PRZYJĘTE (bez działania).
- Nota 1 (nieaktualne komentarze): CZĘŚCIOWO PRZYJĘTE, CZĘŚCIOWO ODRZUCONE.
  - PRZYJĘTE: `converter-era-scaling-test.cjs` nagłówek. Były dwa nieaktualne fragmenty: „Odlewnie płaskie" (C) oraz „Odlewnia_brazu zostaje płaska dla OBU" (E). Zastąpiono opisem m(e) i wartościami per-owner (gracz era1 = 50, AI era3 = 100). Dowód: 123/0 EXIT=0.
  - ODRZUCONE w tej rundzie: `gra/src/game/turn-economy.ts` ok. l. 2343 (komentarz „Odlewnie NIE są w CONVERTER_ERA_SCALING_RECIPE_IDS -- zostają płaskie") oraz `gra/src/main.ts` ok. l. 3552 (komentarz „Odlewnie płaskie"). Oba pliki są POZA allowlistą tematu (zakaz zmian poza allowlistą). Kod w obu miejscach jest poprawny (wołane `converterThroughputForEra` z epoką właściciela, Evaluator to potwierdził). Poprawka wymaga osobnego tematu lub wpisu do następnej zmiany tych plików.
- Nota 2 (huta, wspólny klucz `budynek_huta_przepustowosc` z odlewnią brązu): PRZYJĘTE jako założenie, bez zmiany. Dispatch: huta „bez znaczenia". Huta pozostaje płaska (`converterThroughputForEra` zwraca bazę dla `huta`, potwierdzone asercją C3 w teście). Fallback 50 jest zgodny z dispatchem.
- Nota 3 (7 testów czerwonych lub z timeoutem przed i po zmianie): PRZYJĘTE jako poza regresją tematu. Dowód: Evaluator porównał zbiór linii FAIL na bazie (d458f0770) i po zmianie, wynik identyczny. Operator nie powtarzał tej weryfikacji w tej rundzie (wskazane w TESTY). Nie ma działania.
- Nota 4 (NIE_ZMIERZONO: realny tick w przeglądarce): PRZYJĘTE jako ograniczenie, otwarte. Dispatch ZADANIA (1) i (3) mówią „jeśli możliwe". Pokrycie: test w realnym silniku (`advanceCityEconomy`, gracz era1 = 50, AI era3 = 100, parytet) plus pomiar mechanizmu z R1. Pomiar w przeglądarce nie został wykonany i nie jest wymagany do PASS wg dispatchu.
- Nota 5 (założenia 1–3): PRZYJĘTE bez zmian:
  1. Wielka odlewnia (3 receptury) w tej samej rodzinie, wszystkie trzy klucze `budynek_*_przepustowosc` = 50 na easy, normal i hard. Dispatch zezwala.
  2. Huta z fallbackiem 50 przez wspólny klucz, płaska, bez budynku w buildings.json.
  3. Zaokrąglanie epoki ułamkowej w dół przez wspólną `citizenConsumptionEraMultiplier`. Garncarnia zachowuje dotychczasową formułę.
  Receptury i koszty bez zmian (zgodnie z dispatchem).

BLOKADY:
1. Otwarte z raportu R1, bez zmian: założenia 1–3 (jak wyżej), NIE_ZMIERZONO realnego ticka w przeglądarce.
2. Nieaktualne komentarze poza allowlistą: `gra/src/game/turn-economy.ts` l. ~2343 i `gra/src/main.ts` l. ~3552. Do osobnej zmiany tych plików. Funkcjonalnie poprawne.
3. Testy czerwone sprzed tematu (ai-test 274/20, ekonomia-5x-inwariant i pozostałe z noty 3): poza zakresem.

RUNDY: 2/5 (R1 Operator, R1 Evaluator PASS-WITH-NOTES, R1 obrona Operatora)
NASTĘPNY KROK: Final Control weryfikuje odpowiedzi na zarzuty i stan 9855553fa + obronę. Następnie integracja orkiestratora. Rebase na aktualne origin/main wymagany (baza d458f0770, origin/main posunął się).
DEPLOY/PUSH: NIE WYKONANO
