# R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1

STATUS: DYSPOZYCJA
DOMAIN: GAME
TEMAT: R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1
MODEL+EFFORT: Operator — Sonnet 5, effort medium; Evaluator — Sonnet 5, effort high;
Final Control — Sonnet 5, effort high (`R-PROC-AUTOBOT.md` §5a, temat balansowy, nie wizualny).

## GENEZA (mandat z audytu szczęścia/Prawa, węzeł C, „ECHO właściciela po Final Control
węzła A": „Integruj węzeł A, węzeł C wygładzi urwisko później")

Mandat zmierzony, nie ogólny: **wygładzić zanik bonusu Osiedla przy pop 5 tak, żeby łączny
spadek Porządku (`PorPct`) przy przyroście o JEDNEGO mieszkańca nie przekraczał progu
odczuwalności.** Węzeł A (Szczęście) już naprawił swoją połowę: `szczescie_bonus_osiedle_pop`
przeskalowany na `[15,12,8,5]→0` (było `[4,3,2,1]→0`), z **świadomie zaakceptowanym przez
właściciela** resztkowym skokiem 6 pkt (12,5% `szMax`) przy pop 4→5 — jedyne urwisko w nowej
skali Szczęścia.

**Świeży pomiar (recon wykonany PO integracji `R-PRAWO-PRZEBUDOWA-SKALI-Q1`, metodologia:
esbuild + realny `evaluateOrderFromBreakdown`/`computeOrderPctBreakdown`/`computePorPct` z
`society-breakdown.ts`, 336 960 pomiarów: 3 trudności × 3 epoki × pop 1-14 × warianty miasta/
administracji/garnizonu/wojny/handlu/religii) pokazuje: **węzeł C NIE jest faktycznie
zamknięty.** Najgorszy zmierzony spadek `PorPct` na +1 mieszkańca to **27,8 p.p.**
(111,4%→83,6%, region/easy/epoka1/tylko Dom Starszyzny bez Trybunału/garnizon jednostek=0/
budynek Garnizon=nie/pop 4→5) — **~4,6× większy** niż resztkowe 6 p.p. zaakceptowane po
stronie Szczęścia.

**Rozbicie:** SzPct niesie 26,0 p.p. surowego spadku (wkład ważony 13,0 p.p.), PrawPct niesie
29,9 p.p. surowego spadku (wkład ważony 14,95 p.p.) — **Prawo dziś dokłada NIECO WIĘCEJ niż
Szczęście**, nie mniej. Wzór ln-populacyjny (`2+ln(budynki/prawMax)/ln(1,04)`) jest sam w
sobie gładki (potwierdzone: dla pop≥5 spadek stabilizuje się na 4,0-5,2 p.p., oczekiwany
„koszt wzrostu" ze współczynnika 0,04, D4a, nie do ruszania). **Cała nadwyżka urwiska (dwucyfrowe
p.p.) pochodzi z JEDNEGO mechanizmu, identycznego po obu stronach:** `pickOsiedlePopBonus`
(`gra/src/game/society-breakdown.ts` ok. linii 312-330) z twardym progiem `if (p<1||p>4) return 0`.

- Po stronie Szczęścia ten mechanizm już naprawiony (G10, `szczescie_bonus_osiedle_pop`).
- Po stronie Prawa — **NIETKNIĘTY**. `prawo_bonus_osiedle_pop` (`gra/data/society-params.json`
  ok. linii 851-869) nadal ma dokładnie ten sam wzorzec architektoniczny, jaki miało Szczęście
  PRZED naprawą węzła A: `[32,24,16,10]→0` (easy), `[28,20,14,8]→0` (normal),
  `[22,16,10,6]→0` (hard). `R-PRAWO-PRZEBUDOWA-SKALI-Q1` (już zintegrowany) ruszał wyłącznie
  `prawo_max_epoka`, współczynnik populacji, cap i dwie kary — **nie ten klucz**.

**Dodatkowe znalezisko:** nawet WEWNĄTRZ pasma pop 1-4 (nie tylko na progu 4→5) same kroki
tabeli Prawa dają dwucyfrowe spadki przy małym mianowniku wczesnej epoki — np. `hard` ma
globalne maksimum nie na 4→5, lecz na **2→3** (16,6/12,0/10,0 p.p. dla epok 1/2/3).

## GOAL

Zastosuj do `prawo_bonus_osiedle_pop` **DOKŁADNIE TĘ SAMĄ technikę wygładzania**, która została
już zatwierdzona i zintegrowana dla `szczescie_bonus_osiedle_pop` w węźle A (G10) — malejąca
tablica pop 1→4 zamiast płaskiej, z łagodniejszym zejściem do zera przy pop 5, zachowując
proporcje między trudnościami (easy > normal > hard, jak dziś). **NIE kopiuj wartości
Szczęścia** — Prawo ma inną skalę (`prawMax` różny od `szMax`), przelicz proporcjonalnie do
istniejącego stosunku wielkości.

**Po zmianie zmierz PONOWNIE, tą samą metodologią (opisz w raporcie dokładnie jak — najlepiej
rozszerz/wykorzystaj harness z reconu, opisany wyżej), najgorszy łączny spadek `PorPct` na
+1 mieszkańca w całej siatce parametrów (nie tylko w oczywistym punkcie pop 4→5).**

**KRYTYCZNA GRANICA DECYZYJNA (nie zgaduj, nie akceptuj sam):** jeśli po naprawie najgorszy
zmierzony spadek nadal przekracza w przybliżeniu to samo rzędu wielkości co zaakceptowane
6 p.p. po stronie Szczęścia (tzn. jeśli redukcja jest częściowa, nie sprowadza łącznego
urwiska do jednocyfrowego/niskiego dwucyfrowego poziomu porównywalnego z precedensem) —
zatrzymaj się i zgłoś **DECISION_REQUIRED** z dokładną zmierzoną liczbą, zamiast uznawać
temat za zamknięty. To jest decyzja magnitude/balansu, którą podejmuje właściciel, nie
Operator/Evaluator/Final Control.

## BINARNE KRYTERIUM SUKCESU

- Nowa bramka (lub rozszerzenie istniejącej — sprawdź czy `prawo-przebudowa-skali-test.cjs`
  lub `szczescie-przebudowa-skali-test.cjs` już mają odpowiednią infrastrukturę do
  rozszerzenia, zamiast pisać od zera) mierzy najgorszy spadek `PorPct` na +1 mieszkańca w
  reprezentatywnej siatce parametrów (trudność × epoka × pop 1-14 × warianty administracji/
  garnizonu/wojny co najmniej) PRZED i PO zmianie, dowodząc redukcji.
- Raport podaje dokładną, zmierzoną wartość najgorszego przypadku po naprawie (nie tylko
  "lepiej niż było") — jeśli redukcja nie sprowadza urwiska do rzędu wielkości porównywalnego
  z precedensem Szczęścia (6 p.p.), DECISION_REQUIRED zamiast PASS.
- Zero regresji na wzorze ln-populacyjnym (pop≥5 nadal stabilne 4-5 p.p., D4a nietknięty).
- Dodatkowo zielone: `tsc --noEmit`, 5 bramek referencyjnych (logic-test, tech-tree-test,
  research-test, unit-replace-test, combat-test), cała rodzina bramek Prawo/Porządek/Szczęście
  (grep `tools/*prawo*`/`*szczescie*`/`*porzadek*`/`*order*`/`*society*`).

## ALLOWLISTA

- `gra/data/society-params.json` (WYŁĄCZNIE klucz `prawo_bonus_osiedle_pop`)
- Bramka: rozszerzenie istniejącej (`prawo-przebudowa-skali-test.cjs` lub podobnej) LUB nowa
  `gra/tools/szczescie-audyt-c-prawo-osiedla-test.cjs` — uzasadnij wybór w raporcie
- `dyspozycje/autobot/runs/R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1/**`

Zakazane bezwzględnie: pliki z sekretami, `docs/decyzje/**`, `.git/**`, `dyspozycje/WERSJE.md`,
`gra-robocza/**`, `ROBOCZA-MANIFEST.json`, `playbook.json`, `gra/src/game/society-breakdown.ts`
(sam mechanizm `pickOsiedlePopBonus` NIETKNIĘTY — to jest zmiana WYŁĄCZNIE danych, nie kodu;
jeśli okaże się że kod TEŻ wymaga zmiany, zatrzymaj się i zgłoś DECISION_REQUIRED zamiast
rozszerzać allowlistę samodzielnie), `gra/src/game/order.ts`, wszystkie inne klucze
`society-params.json` poza wskazanym.
Zakaz `git add -A` i `git add .`.

## IZOLACJA

Worktree `/home/user/wt-szczescie-c`, gałąź `autobot/R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1`,
baza jawnie `origin/main` (commit `8031bf5f`, PO zamknięciu całej kolejki main.ts) — potwierdź
`git log -1` PRZED pracą (SS2b: jeden pisarz na worktree).

C-001: zakaz `npm run build`/`dev` w `gra/`; jedyna dozwolona kompilacja `tsc --noEmit`;
bramki `node tools/*-test.cjs` nie są objęte zakazem.

To NIE jest temat kolejki `main.ts` — nie dotyka `main.ts` wcale, może być dispatchowany
niezależnie od innych aktywnych tematów (o ile żaden inny nie dotyka `society-params.json`
lub `society-breakdown.ts` jednocześnie — sprawdź `git worktree list` przed startem).

**Kolejność:** ten temat (węzeł C) musi zamknąć się PRZED dispatchem węzła D (progi/pasma
Porządku i bunt) — węzeł D kalibruje się na rozkładzie wartości WEJŚCIOWYCH, które ten temat
zmienia.

## PROCEDURA NAPRAWCZA PRZY FAIL

Evaluator wskazuje konkretny defekt i poprawkę; runda N+1 na TYM SAMYM ID i TEJ SAMEJ gałęzi.
Po 5 rundach: `LIMIT-5-EXCEEDED`.

## GRANICE

- Zero zmian mechaniki, WYŁĄCZNIE dane (`prawo_bonus_osiedle_pop`).
- Nie integrujesz, nie deployujesz, nie pushujesz.
- Magnitude finalnej redukcji jest potencjalnym DECISION_REQUIRED — patrz GOAL.

## OBIEG

Operator → Evaluator (ponumerowane zarzuty) → Obrona (gdy lista niepusta) → koniec skryptu.
Final Control osobno (Workflow, Sonnet 5 effort high), integracja allowlist-only ręką
orkiestratora.
