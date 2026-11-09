STATUS: DECISION_REQUIRED (część cykliczna wdrożona i przetestowana; część „wymiana jednorazowa" wymaga decyzji produktowej)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ACTIVE-TREATIES-RESOURCE-DEALS-Q1
GOAL: Umowy wymiany surowców widoczne w „Aktywne traktaty" z partnerem, towarem, częstotliwością i statusem ostatniej dostawy; odpowiedź „gdzie sprawdzić".
BAZA: c68fc8d50 (web-wip/QABAR), detached worktree.

## DIAGNOZA (odczyt kodu, nie zgadywanie)

| Typ umowy | Trwałość | Miejsce stanu | Wpływ na ekonomię/turę | Pokazana w UI (przed) |
|---|---|---|---|---|
| Wymiana surowca „Jednorazowo" (domyślny tryb `resourceTradeMode='once'`, kosz akcji '14') | BRAK — natychmiastowy transfer (`oneShotTrade` → `executePnDealTransfer`), nie tworzy `ActiveDeal` | brak (po transferze nic nie zostaje; nie ma też listy historii) | jednorazowy przelew | NIE — „Brak aktywnych traktatów" (to najpewniej przypadek ze zrzutu: domyślny tryb to „jednorazowo") |
| Wymiana surowca „Co turę" (`per_turn`) | TRWAŁA, N tur lub bezterminowo | `ActiveDeal.rodzaj=UmowaWymiany`, `handelSurowiecCykliczny[]` w `activeDeals`, zapisywane w save (spread `hydrateActiveDeals`) | `tickCyclicResourceTradeDeals` co turę: atomowo (sprzedawca ma zapas + kupujący stać na zapłatę) transfer surowca i zapłaty; inaczej ZERO transferu, deal żyje dalej, liczniki N6 → kara Wiarygodności po progu tur z rzędu | Tak, ale tylko jako goła etykieta „Umowa wymiany" + „od N tur" — BEZ towaru, ilości, częstotliwości i statusu dostawy; porażka dostawy nigdzie niewidoczna |
| Wymiana dostępu (`handelPayload`, UmowaHandlowa/Wymiany) | trwała | `ActiveDeal.handelPayload` | dostęp do surowca/złoża | goła etykieta (poza zakresem; bez zmian) |
| AI↔AI wymiana | trwała cykliczna | j.w. | j.w. | nie dotyczy gracza |

Brak surowca u dostawcy: dostawa POMIJANA (bez częściowych), umowa NIE jest zrywana; po `wiarygodnoscN6ProgTurZRzedu` tur z rzędu kara Wiarygodności winnej strony; `handelCyklicznyKiedykolwiekNiedostarczono=true` odbiera bonus P3 przy dotrwaniu. Kupujący bez środków: też pominięta (atomowość). Zasad/liczb NIE zmieniano.

## ZMIANY (tylko wyświetlanie + 1 pole statusu, bez zmiany zasad)
- `gra/src/game/diplomacy-treaties.ts`: pole `HandelSurowiecCyklicznyItem.ostatniaDostawa {tura, ok, powod?}` (dozwolone allowlistą: „dodanie pola statusu ostatniej dostawy").
- `gra/src/game/diplomacy-cyclic-display.ts` (NOWY, czyste funkcje): `cyclicDeliveryRecord`, `describeCyclicExchangeItem`, `cyclicExchangeFrequencyLabel`, `cyclicExchangeLinesForDeal`.
- `gra/src/main.ts`: `applyCyclicDeliveryOutcome` zapisuje `ostatniaDostawa` oraz — gdy gracz jest stroną i dostawa nie doszła — dopisuje wpis `kind:'diplo'` (negatywny, zakładka „Dyplomacja") do istniejącego logu per-turowego (`borderMarchEventLog`, brak nowego systemu; wygasa po turze wg R-WEB-EVENTS-ONE-TURN-LIFETIME); `activeTreatiesForPair` dokłada `exchanges` i `frequencyLabel`; importy.
- `gra/src/ui/diplomacyAudience.ts`: kolumna „Aktywne traktaty" renderuje: „Dostarczasz/Otrzymujesz: N Surowiec na turę → partner za X ¤ na turę", „co turę, pozostało N tur / bezterminowo", „✓ dostarczono w t.T" / „✗ nie dostarczono w t.T — brak surowca u Ciebie / u partnera / brak środków…" (fail wyróżniony). Przycisk „Zerwij" istniał (`onBreakTreaty`/`breakTreatyVoluntarily`) i działa na tych umowach — niezmieniony. Pasek szybkich decyzji (QABAR) nietknięty.
- `gra/tools/diplo-active-treaties-resource-deals-test.cjs` (NOWY, 12 asercji).

## GDZIE SPRAWDZIĆ (odpowiedź dla właściciela)
Kolumna „Aktywne traktaty" w audiencji z daną cywilizacją (stan ostatniej dostawy per pozycja) + powiadomienie w zakładce „Dyplomacja" w turze nieudanej dostawy. Panel imperium (`empireDetailPanel.ts`) NIE ma żadnej listy umów/traktatów (przeszukane) — bez nowych ekranów nic tam nie dodano.

## DECISION_REQUIRED (pkt 4 dispatchu)
Wymiana „Jednorazowo" to czysty transfer bez stanu i bez listy historii (nie ma też takiej listy w UI). Gracz, który zawarł wymianę w domyślnym trybie, NIGDY jej nie zobaczy w „Aktywne traktaty" — i tak ma być, bo to nie jest trwała umowa. Opcje (decyzja produktowa, nie dobudowywałem):
- A: zostawić; dodać w formularzu wyraźny podpis „Jednorazowo — nie pojawi się w aktywnych traktatach" (+: zero ryzyka, minimum pracy; −: brak śladu wykonanej wymiany).
- B: dodać krótką listę „Ostatnie transakcje" (np. 10 ostatnich, per para) w audiencji (+: gracz widzi, co wymieniono; −: nowy stan w save + nowy fragment UI).
- C: domyślnie ustawić tryb „Co turę" (+: umowy trwałe widoczne; −: zmienia domyślne zachowanie i może zaskoczyć graczy kupujących jednorazowo).
Rekomendacja: A (+ B w kolejnym temacie, jeśli właściciel chce historię).

## TESTY
- tsc --noEmit (TS 5.9.3 wg lockfile): 0 błędów.
- logic-test: LOGIC OK 213/213.
- nowy diplo-active-treaties-resource-deals-test: 12 OK / 0 FAIL (umowa widoczna, towar/ilość/partner/zapłata, częstotliwość, pending→ok→fail, brak surowca u mnie/u partnera, brak środków, bezterminowo, pusta lista).
- diplomacy-audience-actions-test 20/0; diplomacy-infografiki-tooltipy-test 12/0; diplo-quick-actions-labels-test 38/0; diplomacy-resource-cyclic-trade-test 53/0; diplomacy-audience-close-flush-test 57/0.
- Symulacja tury z brakiem surowca: `tickCyclicResourceTradeDeals` jest zamknięty w main.ts (niewywoływalny w Node); jego wynik trafia do `cyclicDeliveryRecord` (wspólna funkcja, przetestowana: brak surowca → ok:false, powod:sprzedawca → „✗ nie dostarczono"). Pełny tick w żywej grze: NIE_ZMIERZONO.
- Chromium / zrzut ekranu: NIE_ZMIERZONO (nie uruchamiano; test renderuje prawdziwe `treatiesColumnHtml` jako HTML-string).
- Środowisko: node_modules doinstalowane lokalnie w worktree (`--no-save`, bez zmian package*.json); do usunięcia przy sprzątaniu.

## BLOKADY
Brak techniczych. Decyzja ABC (wyżej) dla wymiany jednorazowej.

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator: weryfikacja diffu i allowlisty; orkiestrator: pytanie ABC (A/B/C) do właściciela; ewentualna weryfikacja wizualna w Chromium po deployu na ROBOCZĄ.

DEPLOY/PUSH: NIE WYKONANO
