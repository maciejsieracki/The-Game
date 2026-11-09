STATUS: PASS-WITH-NOTES (odpowiedź na zarzuty Evaluatora r1; wymiana jednorazowa nadal DECISION_REQUIRED — ABC po stronie orkiestratora)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ACTIVE-TREATIES-RESOURCE-DEALS-Q1
GOAL: Odpowiedź na zarzuty r1 (baza: b9707f447, odtworzona w worktree wf_0f531e18-1e0-3, detached) — każdy zarzut PRZYJĘTY (poprawka + dowód) albo ODRZUCONY (dowód).
ZMIANY/COMMIT: SHA r2 — patrz sekcja „Commit" niżej. Allowlista r2: gra/src/main.ts (tylko wyrażenie widza w buildzie wierszy audiencji), gra/tools/diplo-active-treaties-resource-deals-test.cjs (sekcja 7: test wiązania z main.ts), dyspozycje/autobot/runs/R-WEB-DIPLO-ACTIVE-TREATIES-RESOURCE-DEALS-Q1/02-operator-r2.md. Brak zmian w silniku (zasady/liczby), WERSJE.md, gra-robocza/, package*.json.

## Odpowiedzi na zarzuty

### Zarzut 1 — brak testu podpięcia w main.ts (zapis ostatniaDostawa, wpis borderMarchEventLog)
PRZYJMUJĘ (częściowo).
- Poprawka: dodano sekcję 7 w `gra/tools/diplo-active-treaties-resource-deals-test.cjs`. Test źródłowy czyta `gra/src/main.ts` i sprawdza w ciele `applyCyclicDeliveryOutcome`: (a) przypisanie `item.ostatniaDostawa = cyclicDeliveryRecord(turn, delivered, sellerAtFault, buyerAtFault)`, (b) wpis `cyclic-trade-fail-…` z `kind: 'diplo'` w `borderMarchEventLog`, (c) mapowanie widza na gracza (patrz zarzut 2).
- Granica: NIE jest to wykonanie ticka. `tickCyclicResourceTradeDeals` siedzi w `boot()` w main.ts i nie jest importowalny w Node. Pełna weryfikacja żywego ticka i zrzut Chromium pozostają NIE_ZMIERZONO do weryfikacji po deployu na ROBOCZĄ.

### Zarzut 2 — zagmatwane mapowanie perspektywy widza
PRZYJMUJĘ (uproszczenie). Stara forma `cyclicExchangeLinesForDeal(d, a === partnerId ? b : a, …)` była poprawna, ale nieczytelna. Nowa forma w main.ts:
```
const viewerId = a === ME() ? a : b;
const partnerId = viewerId === a ? b : a;
… cyclicExchangeLinesForDeal(d, viewerId, ownerDiploLabel(partnerId))
```
Semantyka identyczna: dla a===ME widz=a, partner=b; w przeciwnym razie widz=b, partner=a (sprawdzone ręcznie na obu gałęziach). Pokrycie testem: sekcja 7 sprawdza tekst tego wyrażenia w main.ts (test źródłowy, patrz zarzut 1). Pokrycie behawioralne funkcją ODRZUCAM jako niewykonalne bez wyciągnięcia logiki z boot() — poza allowlistą i poza zakresem tematu.

### Zarzut 3 — borderMarchEventLog obcięty do 8, ryzyko wyparcia zdarzeń
ODRZUCAM jako regresję. Dowód: cap `if (borderMarchEventLog.length > 8) borderMarchEventLog.length = 8;` istnieje już w main.ts (linia ~5870, w niezmienionym kodzie) i w tym samym bloku dla innych zdarzeń. Nowy wpis używa tego samego mechanizmu i tego samego kanału `kind: 'diplo'`, więc nie zmienia limitu ani kolejności innych zdarzeń. Ryzyko (kilka nieudanych dostaw w jednej turze wypycha starsze wpisy) zapisuję jako obserwację do potwierdzenia w grze. Zmiana limitu byłaby zmianą zachowania spoza zakresu.

### Zarzut 4 — panel magazynu imperium (empireDiploResourceFlowPerTurn) pokazuje przepływy bez uwzględnienia porażki
ODRZUCAM w tym temacie (poza allowlistą i zakresem). Dowód: `gra/src/game/empire-diplo-resource-flow.ts` sumuje `pakietyPerTura` z umów (plan per turę), a nie wynik rozliczenia; nie czyta `ostatniaDostawa`. Plik nie jest na allowliście dispatchu. Panel pokazuje zadeklarowany przepływ umów, co jest zgodne z jego opisem „przepływy z umów”. Kandydat na osobny temat: „przepływ rzeczywisty vs deklarowany w panelu magazynu” (do decyzji orkiestratora). Dispatch pkt 3 wskazuje tylko listę umów i powiadomienie, które są zrobione.

### Zarzut 5 — wymiana „Jednorazowo” nie pojawia się w żadnej liście
ZGODNIE Z DISPATCHEM, bez zmiany kodu. Operator nie dobudowuje stanu dla transferu jednorazowego (dispatch GOAL pkt 4). Zarzut nie wymaga poprawki. Decyzja A/B/C pozostaje po stronie orkiestratora (pytanie ABC do właściciela). Opcje są w raporcie r1, sekcja BLOKADY.

## Weryfikacja (r2, dowody na b9707f447 + poprawki r2)
- `npx tsc --noEmit` w gra/: exit 0, bez błędów.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/diplo-active-treaties-resource-deals-test.cjs`: 15 OK, 0 FAIL (poprzednio 12; dodano 3 asercje wiązania main.ts).
- `node tools/diplomacy-audience-actions-test.cjs`: 20 passed, 0 failed.
- `node tools/diplomacy-infografiki-tooltipy-test.cjs`: 12 OK, 0 FAIL.
- `node tools/diplo-quick-actions-labels-test.cjs`: 38 OK, 0 FAIL.
- `node tools/diplomacy-resource-cyclic-trade-test.cjs`: 53 pass, 0 fail.
- `node tools/diplomacy-audience-close-flush-test.cjs`: 57 pass, 0 fail.
- Zależności: `npm ci` w gra/ (lockfile, 71 pakietów). Nie uruchamiano `npm run build`/`dev`. `node_modules` nieśledzony, do usunięcia przy sprzątaniu.
- NIE_ZMIERZONO: żywy tick w grze, Chromium, zrzut ekranu. Dysk po instalacji: ok. wolne ~4,1 GB (poniżej progu 8 GB dla Rust, na granicy 4 GB dla web).

## Odpowiedź na pytanie właściciela „gdzie sprawdzić” (stan po r2)
- Umowa cykliczna („Co turę”): kolumna „Aktywne traktaty” w panelu audiencji z daną cywilizacją pokazuje co/ile/za ile, częstotliwość i status ostatniej dostawy (✓ / ✗ z powodem). Nieudana dostawa dodatkowo generuje wpis w zakładce „Dyplomacja” (powiadomienia).
- Wymiana „Jednorazowo”: nie tworzy trwałego stanu i nie pojawia się w „Aktywnych traktatach” (decyzja ABC).

## Commit
SHA: patrz pole `ZMIANY/COMMIT` w raporcie zwrotnym orkiestratora (commit r2 utworzony na detached HEAD worktree wf_0f531e18-1e0-3, baza b9707f447).

BLOKADY: decyzja ABC dla wymiany jednorazowej (A/B/C, DECISION_REQUIRED); weryfikacja żywa po deployu na ROBOCZĄ.
TESTY: patrz sekcja „Weryfikacja (r2)".
RUNDY: 2/5 (r1 Operator Sonnet; r2 obrona Haiku)
NASTĘPNY KROK: Evaluator r2 sprawdza diff r2 (allowlista: main.ts wyrażenie widza, test sekcja 7, raport 02). Orkiestrator zadaje pytanie ABC o wymianę jednorazową.
DEPLOY/PUSH: NIE WYKONANO
