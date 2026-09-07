STATUS: DISPATCH
DOMAIN: GAME
TEMAT: R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1
GOAL: Panel miasta (bloki Szczęście i Prawo, `gra/src/ui/cityPanel.ts`) pokazuje przy
pasku procentowym TAKŻE liczby bezwzględne "ile punktów osiągamy / ile jest maksimum"
(np. "30 / 30 pkt"), nie tylko sam procent. WYŁĄCZNIE zmiana wyświetlania — zero zmiany
w formule Szczęścia/Prawa/Porządku, zero zmiany balansu.

WYZWALACZ (właściciel, żywa rozmowa, zrzut ekranu panelu miasta):
"Wydaje mi się, że powinna być informacja, ile punktów szczęścia jest maksymalne, a ile
obecnie osiągamy, oraz ile punktów prawa jest maksymalne, a ile osiągamy, a nie tylko
same procenty."

KONTEKST TECHNICZNY (już zlokalizowany przez orkiestratora, oszczędza czas Operatorowi):
- `gra/src/game/society-breakdown.ts`: `computeHappinessBreakdown()` zwraca
  `HappinessPctBreakdown { lines, netto, szMax, szPct }` (linia ~701-810);
  `computeLawBreakdown()` zwraca `LawPctBreakdown { lines, netto, prawMax, prawPct }`
  (linia ~816-905). `netto`/`szMax`/`prawMax` JUŻ ISTNIEJĄ w silniku — to jest wyłącznie
  zadanie PRZEPROWADZENIA ich do UI, nie liczenia niczego od nowa.
- `gra/src/ui/orderPanel.ts` linia ~15: `export interface OrderState` — dziś ma
  `szczescie`/`porzadek` (legacy nazwy dla `sz.netto`/`prawo.netto`, mylące, ale NIE
  zmieniać/usuwać — inni konsumenci mogą na nich polegać, sprawdź grepem przed
  dotknięciem), `szPct?`, `prawPct?`, `porPct?`. BRAKUJE `szMax`/`prawMax` — dodać jako
  NOWE opcjonalne pola (`szMax?: number`, `prawMax?: number`), nie zastępować istniejących.
- `gra/src/ui/cityPanel.ts` linia ~3195-3210: miejsce budowy obiektu `state` (funkcja
  zwracająca `{ state: {...} }`) — tu jest `ordPct.sz.szMax` i `ordPct.prawo.prawMax`
  JUŻ DOSTĘPNE (bo `ordPct` to `OrderPctBreakdown` z `sz`/`prawo` obu typu wyżej) —
  wystarczy dopisać `szMax: ordPct.sz.szMax, prawMax: ordPct.prawo.prawMax,` do literału.
- `gra/src/ui/cityPanel.ts` linia ~3294-3311: dwa wywołania `appendW4PctMetricBlock(...)`
  (Szczęście i Prawo) — tu wyświetlić dodatkowo netto/max, np. obok istniejącego
  `${Math.round(pct)}%` w nagłówku bloku (funkcja `appendW4PctMetricBlock`, linia ~4495)
  albo jako osobna mała linijka pod paskiem. Netto do wyświetlenia: `state.szczescie`
  (już istnieje, to jest `sz.netto` zaokrąglone) i analogiczny odpowiednik dla Prawa
  (dziś pole `porzadek` niesie `prawo.netto` — ZWERYFIKUJ że to jest właściwe,  nie ufaj
  samej nazwie, przelicz ręcznie na jednym przykładzie z żywej gry).
- `gra/src/ui/cityPanel.ts` linia ~3375-3410 (`buildPorzadekDetailCard`) — karta
  szczegółów Porządku pokazuje dziś `Math.round(sz)}%` i `Math.round(praw)}%` w gridzie
  (`gridDetailRow`) — dodać tam też netto/max w tym samym wierszu albo osobnym.

FORMAT WYŚWIETLANIA (decyzja Operatora, w duchu istniejącego stylu UI — spójnie z resztą
panelu, np. wzorem istniejących `gridDetailRow`/`civ-w4-subhd-pct`): coś w rodzaju
"64% (30/30 pkt)" albo osobna mała linia "30 / 30 pkt" pod paskiem procentowym. NIE
wymyślać nowej jednostki miary ani nie zmieniać istniejącego zaokrąglenia procentu.

ZAKRES ŚWIADOMIE POZA TEMATEM:
- Blok "Porządek łącznie" (linia ~3313-3372) NIE dostaje analogicznej pary netto/max —
  to jest ważona kombinacja dwóch procentów (`computePorPct`), nie ma naturalnego
  "punktu maksymalnego" w tych samych jednostkach co Sz/Prawo. Zostaje wyłącznie jako %.
- Zero zmiany w `society-breakdown.ts` (silnik) — te liczby już tam są, wyłącznie
  przepływ do UI.
- Zero zmiany w formule/wagach/mianownikach Szczęścia lub Prawa — to jest osobny wątek
  (balans), zgłoszony równolegle właścicielowi, NIE ten temat.

BINARNE KRYTERIUM SUKCESU: w panelu miasta, blok Szczęście pokazuje jednocześnie procent
ORAZ netto/max w punktach (sprawdzalne bezpośrednio wizualnie/w DOM), blok Prawo — to
samo; żaden dotychczasowy test regresji cityPanel nie czerwienieje; `tsc --noEmit` czyste.

ALLOWLISTA:
- `gra/src/ui/orderPanel.ts` (rozszerzenie interfejsu `OrderState` o `szMax?`/`prawMax?`)
- `gra/src/ui/cityPanel.ts` (przekazanie wartości + render w obu blokach + karcie szczegółów)
- `gra/tools/*.cjs` — WOLNO dodać nową bramkę albo rozszerzyć istniejącą bramkę cityPanel
  jeśli taka istnieje (sprawdź `gra/tools/*citypanel*` / `*cityPanel*` / `*porzadek*`
  przed pisaniem od zera)
- `dyspozycje/autobot/runs/R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1/*` (raporty własne)
Zakaz zmiany `gra/src/game/society-breakdown.ts` (silnik — wartości już tam istnieją,
zero potrzeby ich zmieniać). Zakaz `git add -A`.

REGUŁA PRZECIW SAMOOSZUKIWANIU: zakaz uznania zmiany za gotową na podstawie samego
`tsc --noEmit` bez faktycznego, żywego zrzutu z Chromium/Playwright (albo istniejącej
bramki renderującej panel miasta, jeśli taka jest) pokazującego NOWY tekst z liczbami
punktów obok procentu — to jest zmiana UI, wymaga dowodu wizualnego, nie tylko typów.

IZOLACJA: worktree `/home/user/wt-porzadek-panel-punkty`, gałąź
`autobot/R-PORZADEK-PANEL-PUNKTY-ABSOLUTNE-Q1`, baza `origin/main` @ `5fa61be3`.
C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja to
`node ./node_modules/typescript/bin/tsc --noEmit`.

PROCEDURA NAPRAWCZA PRZY FAIL: Evaluator wskazuje jeden konkretny defekt; runda N+1 na
TYM SAMYM ID i TEJ SAMEJ gałęzi. Po 5 rundach: LIMIT-5-EXCEEDED.

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only.
DEPLOY/PUSH: NIE WYKONANO
