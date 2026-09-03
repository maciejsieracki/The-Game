TEMAT: P-DYPLO-KARTA-DECYZJI-BILANS-SKROT-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/diplomacy-display.ts (formatNegotiationDealPlayerSummary,
formatBasketItemBrief), gra/src/main.ts (negotiationSummary, wywołanie ok. linii 13720)
MODEL+EFFORT: claude-sonnet-5, effort high (zmiana tekstu + możliwy realny brak danych,
wymaga żywej weryfikacji w przeglądarce)

WYZWALACZ (dosłownie od właściciela, zrzut ekranu karty „WYMAGA DECYZJI" w panelu bocznym)
"Przy propozycji wymiany surowców komunikat powinien informować, ile co turę chce
wymienić druga strona i za co, w jakiej ilości w drugą stronę, ale co turę. Czyli powinno
być na przykład: «Oferuję 20 kamieni za turę, [coś tam], przez 10 tur», czyli trzy
liczby. Ja potem umiem obliczyć, ile to jest przez cały okres trwania umowy. W tym
wypadku przy tym komunikacie nie jest to potrzebne, tylko ewentualnie, jak ktoś wejdzie,
otworzy, to widzi dokładnie, co tam jest w szczegółach."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji)
- Zrzut ekranu: karta „WYMAGA DECYZJI" / „Dyplomacja: Kalibangan · Harappa · miasto-
  państwo" pokazuje: „Oferujemy: 20 Kamień na turę (łącznie 200 Kamień przez 10 tur) ·
  Oferują: — · Wymiana co turę przez 10 tur (runda 1/3)".
- Źródło DOKŁADNIE zlokalizowane: `formatBasketItemBrief` (`diplomacy-display.ts:447-494`,
  case `'surowiec_ilosc'` linie 478-490 i analogicznie `'zloto'` linie 451-461) dopisuje
  segment `(łącznie ${szt*turns} ${label} przez ${turns} tur)` ZAWSZE, gdy
  `ctx.perTurn===true` i `ctx.turns>0` — bez możliwości wyłączenia.
- Ta sama funkcja (przez `formatBasketListBrief` → `formatNegotiationDealPlayerSummary`,
  linie 586-603) jest współdzielona przez TRZY różne miejsca w `main.ts`, o RÓŻNYCH
  wymaganiach co do szczegółowości:
  1. `negotiationSummary(n)` jako `subtitle` KOMPAKTOWEJ karty panelu bocznego
     (main.ts:13720, `+ ' (runda X/Y)'`) — DOKŁADNIE ten zrzut właściciela. TU ma zniknąć
     „łącznie X przez Y tur".
  2. Toast po rozstrzygnięciu propozycji (main.ts:15039, „X przyjmuje/odrzuca
     propozycję: <summary>") — również kompaktowy komunikat, tego samego rodzaju co
     punkt 1; potraktuj identycznie (usuń „łącznie"), chyba że recon w Chromium pokaże
     realny powód by zostawić — jeśli tak, opisz w raporcie zamiast zmieniać po cichu.
  3. `dealDetails` na liście wierszy stołu negocjacji / panelu audiencji
     (main.ts:15485, `negotiationSummary(entry)`) — to jest WŁAŚNIE „ewentualnie, jak
     ktoś wejdzie, otworzy" ze zdania właściciela — TU „łącznie X przez Y tur" MA ZOSTAĆ,
     bo to widok po otwarciu szczegółów.
- `formatBasketItemBrief`/`formatBasketListBrief` używane są TAKŻE w
  `diplomacyTradeBasket.ts:1911-1915` (kreator koszyka — edycja własnej oferty) —
  ten widok też jest „szczegółami" (użytkownik aktywnie układa ofertę) — NIE zmieniać.
  `formatNegotiationDealParts` (`diplomacy-display.ts:515-533`) — sprawdź reconem, gdzie
  używane; jeśli to też widok szczegółowy, zostaw bez zmian.
- Wniosek: nie można wyciąć „łącznie" globalnie z `formatBasketItemBrief` (zepsułoby
  punkty 3 i widok koszyka) — potrzebny jest jawny przełącznik (np. nowe pole
  `ctx.omitTotal?: boolean`) używany WYŁĄCZNIE przez wywołania z main.ts:13720 (i
  analogicznie 15039, jeśli recon potwierdzi).
- DRUGI wątek zrzutu: „Oferują: —" (`formatBasketListBrief` linia 500, `'—'` gdy
  `items` puste/undefined). NIE WIADOMO jeszcze, czy to poprawne (jednostronna prośba/dar
  miasta-państwa, bez rewanżu) czy błąd (rewanż istnieje w danych propozycji, ale nie
  trafia do `split.theyOffer`). WYMAGA recon Operatora na żywej propozycji tego typu
  (miasto-państwo, akcja `'14'`/`umowa_wymiany`) PRZED jakąkolwiek zmianą — NIE zgaduj.

GOAL
1. Kompaktowa karta „WYMAGA DECYZJI" w panelu bocznym (main.ts:13720) pokazuje WYŁĄCZNIE
   trzy liczby na pozycję surowca/złota: ilość, częstotliwość (na turę), liczbę tur —
   BEZ segmentu „(łącznie X przez Y tur)". Przykład docelowy: „Oferujemy: 20 Kamień na
   turę · Oferują: <realna wartość lub —> · Wymiana co turę przez 10 tur (runda 1/3)".
2. Toast po przyjęciu/odrzuceniu propozycji (main.ts:15039) — zastosuj tę samą zmianę,
   chyba że recon w Chromium wskaże realny powód, by zostawić szczegół (opisz w
   raporcie).
3. Widok wiersza stołu negocjacji/panelu audiencji (main.ts:15485, `dealDetails`) oraz
   kreator koszyka (`diplomacyTradeBasket.ts`) — BEZ ZMIAN, nadal pokazują „łącznie X
   przez Y tur".
4. Zbadaj (recon, ŻYWY test z propozycją miasta-państwa typu wymiana surowców, jak na
   zrzucie) czy „Oferują: —" jest poprawne (jednostronna prośba bez rewanżu — wtedy
   ZOSTAW bez zmian, opisz w raporcie dlaczego to poprawne) czy jest błędem (rewanż
   istnieje w payloadzie propozycji, ale `split.theyOffer` go gubi — wtedy NAPRAW,
   z dowodem jaki dokładnie krok w `splitNegotiationDealPlayerSides` go gubi).
5. Zero zmian w logice samej propozycji/wyceny/akceptacji (`diplomacy-proposals.ts`,
   `diplomacy-pn-engine.ts`) — WYŁĄCZNIE warstwa formatowania tekstu i (jeśli GOAL 4
   potwierdzi błąd) naprawa czytania danych rewanżu do wyświetlenia, nie zmiana samej
   wyceny.

KRYTERIA KOŃCA (binarne)
1. Żywy render w headless Chromium: karta „WYMAGA DECYZJI" panelu bocznego dla propozycji
   wymiany surowców per-turę NIE zawiera tekstu „łącznie” ani przemnożonej wartości —
   pokazuje tylko ilość/turę i liczbę tur.
2. Ten sam test na widoku „Stół negocjacji"/wiersz audiencji PO otwarciu szczegółów —
   „łącznie X przez Y tur" NADAL widoczne, bez regresji.
3. Kreator koszyka (`diplomacyTradeBasket.ts`) — bez zmian wizualnych, potwierdzone
   zrzutem/testem PRZED i PO.
4. Raport jednoznacznie rozstrzyga (z dowodem z żywych danych propozycji), czy „Oferują:
   —" na zrzucie właściciela było poprawne czy błędne — i jeśli błędne, naprawione i
   potwierdzone żywym testem pokazującym realną wartość zamiast myślnika.
5. Zero regresji na istniejących testach dyplomacji (znajdź reconem, np.
   diplomacy-display-*-test.cjs, negotiation-summary-*-test.cjs lub podobne w
   gra/tools/).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/diplomacy-display.ts — WYŁĄCZNIE `formatBasketItemBrief`,
  `formatBasketListBrief` (nowy opcjonalny parametr/pole kontekstu),
  `formatNegotiationDealPlayerSummary`, i (TYLKO jeśli GOAL 4 potwierdzi błąd)
  `splitNegotiationDealPlayerSides`.
- gra/src/main.ts — WYŁĄCZNIE wywołania `negotiationSummary`/
  `formatNegotiationDealPlayerSummary` w miejscach z GOAL 1-2 (linie ok. 13720, 15039) —
  ZERO zmian w linii 15485 i w logice rozstrzygania propozycji.
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json,
`diplomacyTradeBasket.ts`, `diplomacyDealDisplay.ts` (pełny „Stół negocjacji" — osobny,
już bogatszy renderer, poza zakresem), zmiana wyceny/akceptacji propozycji.

IZOLACJA
worktree /home/user/wt-dyplo-karta-decyzji-skrot, gałąź
autobot/P-DYPLO-KARTA-DECYZJI-BILANS-SKROT-Q1, baza jawnie: origin/main (najnowszy commit
na moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-dyplo-karta-skrot --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania GOAL 4 za rozstrzygnięty bez żywego zbadania FAKTYCZNEGO payloadu
propozycji miasta-państwa typu wymiana surowców (nie zgadywanie na podstawie samego
kodu formatującego) — wypisz w raporcie dokładną zawartość `payload.giveItems`/
`receiveItems`/`resourceTradeMode` dla odtworzonego scenariusza. Zakaz zmiany kompaktowej
karty (GOAL 1) bez żywego zrzutu Chromium PRZED i PO pokazującego usunięcie segmentu
„łącznie" — nie tylko czytanie kodu formatującego.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora,
ręką orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
