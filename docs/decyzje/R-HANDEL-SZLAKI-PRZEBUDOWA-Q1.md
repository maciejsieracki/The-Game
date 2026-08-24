# R-HANDEL-SZLAKI-PRZEBUDOWA-Q1 — przebudowa mechaniki szlaków handlowych

**Status:** W TRAKCIE (2026-08-23) — T1+T2+T2b+T3+T4 ZINTEGROWANE do `main` (T4 commit
`fee7f455`). Ryzyko sekwencjonowania z T3 (miasto bez budynku dostające stary bonus 5%)
ZAMKNIĘTE. T6 dispatchowane natychmiast (ostatni temat tej serii). Zbiorczy deploy ROBOCZA
nastąpi po zintegrowaniu T6.

## Zlecenie właściciela (werbatim, dyktowane — literówki oryginalne)

> OK, musimy to przebudować. Zasada powinna być odwrotna, czyli czym dalej,
> tym większe środki dostajemy. Więc dla 20 HeX powinno być to samo co dla
> zera i na odwrót. Dodatkowo. Połączenie morskie, jeśli jest możliwe,
> między dwoma miastami różnych cywilizacji powinno dawać dwa razy większe
> przychody. Po trzecie, te stawki są zbyt małe. To są za małe pieniądze
> z handlu, trzeba je pomnożyć pięciokrotnie. Dodatkowe 5% od handlu
> zalicza się też do przychodu z danej drogi handlowej. Każdą cywilizację
> możemy zawrzeć tylko jedną umowę handlu. Mógł też pamiętać, że teraz
> handel został zmieniony na nazewnictwo podatki, a potem zmienia się na
> pieniądz. I najważniejsza rzecz, chcę zmienić zasady, mianowicie, jeżeli
> Obecne ustawienia są możliwe dopiero po wybudowaniu pewnych budynków,
> a wtedy dopiero handel się uruchamia. Podzieliłbym to na dwa etapy.
> Umowa handlowa od początku, którą zawrzemy, daje nam pomimo braku
> wybudowanych budynków już środki samej odległości, bez wybudowania
> budynków, czyli handel dostępny jest od początku. Natomiast w momencie,
> gdy budynki staną wybudowane, to dochodzi dodatkowo tych 5% handlu
> z każdą cywilizacją. Bardzo ważne jest, aby z każdej drogi w widoku
> handlu od razu pojawiały się kwoty, które z tego handlu nam przychodzą
> do przychodu.

## Stan obecny (zweryfikowany kodem, dwa niezależne recony 2026-08-21)

- Wzór dystansowy: `max(1, floor(8 − 0.4×dystans))`, `trade-routes.ts:774-780`,
  stałe `DEFAULT_TRADE_ROUTE_INCOME_PARAMS` linia 767-771 (override w
  `econ-params.json` blok `handel_szlaki` — dziś identyczny z domyślnymi,
  brak realnego overrida).
- +5% Handlu za każdą aktywną trasę: globalny mnożnik **per miasto**,
  `economy.ts:954-957`, miesza się z Targowiskiem/mnożnikiem
  cywilizacyjnym/korupcją/Walutą w jednym strumieniu Podatku — **nie**
  jest przypisany do żadnej konkretnej trasy.
- +1 Pieniądza/turę za trasę morską ponad pierwszą:
  `PORT_SEA_TRADE_BONUS_PIENIADZ=1`, `trade-routes.ts:901,903-913`, osobny
  mechanizm.
- Limit slotów tras = liczba budynków handlowych (Targowisko/Port/Port
  wielki) w mieście — miasto bez żadnego ma limit 0, `trade-routes.ts:464-478`,
  zastosowanie w `refreshTradeRoutes` (linia 668-745). **Bez budynku trasa
  w ogóle nie powstaje** (ani dochód dystansowy, ani +5%).
- Dla morza Port jest DODATKOWO wymogiem samej fizycznej łączności
  (`findCityConnection`, linia 349-351) — bez Portu w obu miastach
  `connected=false` niezależnie od slotów.
- Aktywacja trasy wymaga: brak wojny + aktywny traktat `RodzajTraktatu.UmowaSzlakow`
  (`UmowaHandlowa` to legacy, migrowane przy save/load —
  `diplomacy-treaties.ts:148-152`) + geometryczna łączność (ląd ≤12 heksów /
  morze ≤20 heksów) + wolny slot po obu stronach.
- Traktaty są przechowywane **per para** cywilizacji — dziś **nie ma**
  żadnego globalnego licznika „ile umów szlakowych ma dana cywilizacja
  total". Jedna cywilizacja może dziś mieć N jednoczesnych umów z N
  różnymi partnerami.
- UI (`empireDetailPanel.ts:3021-3048`) **już pokazuje tabelę per-trasa**
  (TWOJE MIASTO / PARTNER / MEDIUM·DYSTANS / DOCHÓD/TURĘ) — `r.income`
  tam to `base × (1+bonusCudów)`, ale **nie zawiera** +5%/trasa (ten
  mnożnik żyje wyłącznie w `economy.ts` jako civ/city-wide, nigdy nie
  trafia do `t.routes[].income`).
- Wzór forward (`base`, `bonus`, `floor(base*(1+bonus))`) jest **zduplikowany**
  w `main.ts` w dwóch miejscach (panel Handlu i chip HUD „Handel") —
  patrz `P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1`, do naprawienia przy okazji T1/T2.

## Nazewnictwo — sprostowanie (bez ABC, potwierdzone reconem)

Właściciel pomylił dwa różne mechanizmy. Strumień dochodu miasta z
pól/budynków/pracy (`handelBrutto` w `economy.ts`) **rzeczywiście** przeszedł
Handel → Danina → **Podatek** (decyzja 2026-07-27, `danina-nazwa.ts`,
`daninaLabel()` zwraca dziś zawsze `'Podatek'`). **To nie jest ten sam
mechanizm co szlaki handlowe.** Dochód ze szlaków (ten temat) cały czas
poprawnie nazywa się „Handel"/„Handel ze szlaków" (`hud.ts:785`,
`empireDetailPanel.ts` sekcja „Trasy"/„Umowy handlowe") i **zostaje tak
nazwany** w dalszej pracy, chyba że właściciel jawnie zdecyduje inaczej po
przeczytaniu tego sprostowania. „Pieniądz" nigdy nie było nazwą mechanizmu —
to jednostka waluty skarbca, w której liczy się wszystko od zawsze.

## Punkty ROZSTRZYGNIĘTE bez ABC

- **(3) Stawki ×5** — dotyczy wyłącznie trzech stałych formuły dystansowej:
  `dochodBazowy 8→40`, `dochodNaDystans 0.4→2`, `dochodPodloga 1→5`. Nie
  dotyczy 5% (osobne zdanie właściciela) ani bonusu morskiego +1 (inny,
  niewspomniany mechanizm).
- **(7) UI per-trasa** — nie wymaga nowego layoutu, tylko rozszerzenia
  istniejącej tabeli o rozbicie dochodu (dystans + 5%, z jawnym
  wskazaniem gdy 5% czeka na budynek) — techniczna konsekwencja rozstrzygnięć
  punktów 1/2/4/6, nie osobna decyzja.
## ECHO właściciela (2026-08-21) — 5/5 pytań rozstrzygnięte

**Q1 — Zakres odwrócenia dystansu = OSOBNY per medium.** Ląd liczony
względem własnego max=12 heksów, morze względem własnego max=20 heksów —
w rezultacie najdalsza możliwa trasa lądowa (12 heks.) i najdalsza możliwa
trasa morska (20 heks.) dają IDENTYCZNY szczytowy dochód, mimo różnych
odległości bezwzględnych. Formuła musi więc przyjmować osobny `maxDist`
per medium przy wyliczaniu odwróconego wzoru.

**Q2 — Bonus morski ×2 = SUMUJE SIĘ** z istniejącym `PORT_SEA_TRADE_BONUS_PIENIADZ`
(+1 Pieniądza/turę za trasę morską ponad pierwszą). Oba mechanizmy działają
równolegle i niezależnie — ×2 dokłada się do (nowej, odwróconej) formuły
dystansowej trasy morskiej, stary +1/trasę-ponad-pierwszą zostaje bez
żadnych zmian.

**Q3 — Atrybucja 5% = Wariant C, stały 5% WŁASNEGO dochodu trasy.** Każda
trasa dostaje własny bonus = `0.05 × (jej dochód dystansowy, po odwróceniu
i ×5)`, sumowane globalnie do civ/city-wide wpływu. To **realny transfer
budżetu z Podatku do Handlu** (mechanizm ekonomicznie inny niż dzisiejszy
`economy.ts:954-957`, nie tylko sposób wyświetlania) — stary globalny
mnożnik na `handelBrutto` **zostaje zastąpiony** sumą per-trasowych bonusów
5%, nie utrzymywany równolegle (inaczej podwójne liczenie tego samego 5%).

**Q4 — Limit „jedna umowa" = BEZ ZMIAN.** Właściciel miał na myśli już
istniejące, poprawnie działające ograniczenie (jedna `UmowaSzlakow` per
PARA cywilizacji — nie da się zawrzeć dwóch identycznych traktatów między
tą samą parą). Żaden nowy limit total-na-cywilizację nie jest wymagany;
temat T5 (limit) **wypada z zakresu tej przebudowy**.

**Q5 — Port jako wymóg trasy morskiej = ZOSTAJE, plus nowa zasada priorytetu
lądu I nowy gate na poziomie PROPOZYCJI TRAKTATU (doprecyzowane przez
właściciela trzykrotnie, finalna wersja poniżej).**

**Finalna zasada (dosłownie z ostatniej wiadomości właściciela):**
Możliwość zawarcia `UmowaSzlakow` między dwiema cywilizacjami w panelu
dyplomacji wymaga JEDNEGO z:
1. **Dostępność lądowa** między cywilizacjami — jeśli istnieje, umowę można
   zawrzeć bez żadnych dodatkowych warunków (port nie jest wymagany).
2. **Brak dostępności lądowej** (inny kontynent/wyspa) — umowę można zawrzeć
   WYŁĄCZNIE gdy OBIE strony mają port (jedna i druga cywilizacja).

**Jeśli żaden z powyższych warunków nie jest spełniony** (brak lądu I
co najmniej jedna strona bez portu) — **opcja zawarcia umowy handlowej NIE
JEST W OGÓLE DOSTĘPNA w panelu dyplomacji/opcjach handlowych.** To jest
warunek konieczny sprawdzany PRZY PROPOZYCJI TRAKTATU, nie tylko przy
późniejszym powstawaniu trasy — inaczej niż dziś, gdzie `hasSzlakowTreaty`
i `findCityConnection`/Port są sprawdzane dopiero w `refreshTradeRoutes`
PO already zawartej umowie (dziś można dziś podpisać `UmowaSzlakow` z
cywilizacją, z którą fizycznie nigdy nie powstanie żadna trasa — to ma
się zmienić, taka opcja ma być wyszarzona/niedostępna od razu w panelu
propozycji).

Dodatkowo (z priorytetu lądu): gdy dostępność lądowa istnieje, trasa MA BYĆ
lądowa — morze nie jest brane pod uwagę jako alternatywa nawet jeśli
dawałoby wyższy dochód (×2). Morze jest wyłącznie dla par bez żadnej
dostępności lądowej. To **anuluje wcześniejsze założenie „wybór po
końcowym dochodzie"** (patrz niżej, było błędnie zaklasyfikowane jako
rozstrzygnięte bez ABC) — `detectBestConnection` NIE ma wybierać między
lądem i morzem po dochodzie; ma próbować ląd jako pierwszy, i sprawdzać
morze DOPIERO gdy ląd zwraca
`connected=false`.

## Korekta punktu błędnie sklasyfikowanego jako „bez ABC"

~~Kryterium wyboru lądu vs morza ma iść za końcowym dochodem~~ — **NIEAKTUALNE
po Q5**. Prawidłowa zasada: ląd ma bezwarunkowe pierwszeństwo, gdy fizycznie
istnieje (niezależnie od tego, że morze mogłoby dziś dawać wyższy dochód
po ×2); morze jest sprawdzane wyłącznie gdy `findCityConnection` nie
znajduje żadnej ścieżki lądowej. `detectBestConnection` (`trade-routes.ts:498-515`)
wymaga zmiany kolejności prób (ląd najpierw, twardy fallback do morza), nie
porównania dochodu obu wariantów.

## Podział na tematy AutoBot (finalny, po ECHO)

| # | Temat | Zależność | Zakres |
|---|---|---|---|
| T1 | Wzór dystansowy: kierunek osobny per medium + stałe ×5 | ECHO Q1 | `trade-routes.ts` (formuła + stałe), `econ-params.json` |
| T2 | Bonus morski ×2 (sumuje się) + priorytet lądu nad morzem w `detectBestConnection` (ląd zawsze wygrywa gdy istnieje, morze tylko fallback) | T1, ECHO Q2+Q5 | `trade-routes.ts`, `main.ts` (oba miejsca wzoru — łączy się z `P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1`) |
| T2b | **NOWY (ECHO Q5, doprecyzowane 2×).** Gate na poziomie PROPOZYCJI traktatu w panelu dyplomacji: opcja zawarcia `UmowaSzlakow` dostępna WYŁĄCZNIE gdy (a) istnieje dostępność lądowa między cywilizacjami, LUB (b) brak dostępności lądowej ALE obie strony mają port. W przeciwnym razie opcja ma być niedostępna/wyszarzona w panelu — nie tylko "umowa zawarta, ale trasa nigdy nie powstanie" jak dziś. Wymaga reconu dokładnego miejsca walidacji propozycji traktatów (prawdopodobnie `diplomacy-proposals.ts`/panel dyplomacji UI) — dziś `hasSzlakowTreaty`/Port sprawdzane dopiero w `refreshTradeRoutes`, PO zawarciu umowy. | T1, T2, ECHO Q5 | `diplomacy-proposals.ts` (lub odpowiednik — recon), UI panelu dyplomacji, `trade-routes.ts` (reużycie logiki łączności lądowej/portowej) |
| T3 | Rozdzielenie gatingu budynkami od istnienia trasy (umowa+łączność=dochód od razu; budynek=odblokuj 5%). Port zostaje wymogiem istnienia morza (bez zmian) | ECHO — dwuetapowa aktywacja (nie było osobnym pytaniem, jednoznaczne z cytatu) | `trade-routes.ts::refreshTradeRoutes` |
| T4 | Atrybucja 5% per trasa (Wariant C) — zastępuje stary globalny mnożnik w `economy.ts` | T3, ECHO Q3 | `trade-routes.ts`, `economy.ts` |
| ~~T5~~ | ~~Limit „jedna umowa"~~ | **WYPADA** — ECHO Q4 = bez zmian, temat zamknięty bez implementacji | — |
| T6 | UI per-trasa pełny rozkład dochodu (dystans + 5%, wskazanie gdy 5% czeka na budynek) | T1, T2, T4 | `empireDetailPanel.ts`, `main.ts::buildEmpireTradeSnap()` |

Kolejność bezpieczna: T1 → T2 → T2b → T3 → T4 → T6. Bez osobnego T5 (zamknięte ECHO=bez zmian).

## Postęp implementacji

- **T1 — ZINTEGROWANE (2026-08-22).** Dispatch przez Workflow (Operator→Evaluator→Final
  Control, wszystkie PASS, run `wf_e9da30e1-0e2`, branch `autobot/HANDEL-SZLAKI-T1`).
  `tradeRouteDistanceIncome()` przebudowany: `dochodPodloga=5`, `dochodSzczyt=40`,
  osobna stawka wzrostu per medium (ląd `(40-5)/12≈2.9167`, morze `(40-5)/20=1.75`),
  clamp `[5,40]`. Zaktualizowano też `econ-params.json` (usunięto stare
  `dochod_bazowy`/`dochod_na_dystans`, żeby nie nadpisywały cicho nowej formuły).
  Niezależnie zweryfikowane przez orkiestratora po zmergowaniu do `main`
  (fast-forward, commit `65315319`): `tsc --noEmit` czyste, `vite build` OK,
  wszystkie testy handel/econ zgodne z raportami trzech agentów (te same
  pre-istniejące, niezwiązane FAIL w `trade-routes-income-test.cjs`/H2 i
  `trade-ilosc-test.cjs`), 5 bramek referencyjnych zielone. Wypchnięte do
  `origin/main`. Zakres T2/T2b/T3/T4/T6 nietknięty.
- **T2 — ZINTEGROWANE (2026-08-22).** Dispatch przez Workflow (Operator→Evaluator→Final
  Control; Operator/Evaluator PASS, Final Control PASS-WITH-NOTES — uwaga niewiążąca,
  patrz niżej; run `wf_5973ab38-00f`, branch `autobot/HANDEL-SZLAKI-T2`). Nowa
  eksportowana funkcja `tradeRouteTotalDistanceIncome(dystans, medium, params)`
  opakowuje niezmienioną `tradeRouteDistanceIncome()` i mnoży wynik ×2 wyłącznie dla
  `medium='morze'` (ECHO Q2 — sumuje się z istniejącym, osobnym
  `PORT_SEA_TRADE_BONUS_PIENIADZ`, który zostaje nietknięty). Użyta we wszystkich
  miejscach liczących finalny dochód trasy: `computeTradeRouteIncomeByCity`
  (rzeczywisty wpis do skarbca) oraz 3 miejsca w `main.ts` (event log, panel Handlu,
  chip HUD) — koniec z duplikacją formuły (`P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1`
  rozwiązane przy okazji). `detectBestConnection` przebudowane: ląd sprawdzany i
  zwracany bezwarunkowo pierwszy gdy połączony, morze liczone/wybierane WYŁĄCZNIE gdy
  ląd niepołączony (fallback). Niezależnie zweryfikowane przez orkiestratora po
  zmergowaniu do `main` (fast-forward, commit `a3276dda`): `tsc --noEmit` czyste,
  `vite build` OK, wszystkie testy handel/econ zgodne z raportami trzech agentów (te
  same pre-istniejące FAIL H2/`trade-ilosc-test.cjs`), 5 bramek referencyjnych
  zielone. Wypchnięte do `origin/main`.

  **Uwaga Final Control (niewiążąca, do wiadomości dla przyszłych agentów):**
  `findCityConnection` zwraca `distance` jako czysty `hexDistance` między centrami
  miast, NIEZALEŻNY od medium — więc dla tej samej pary miast `land.distance` i
  `sea.distance` są zawsze identyczne. Stara reguła sprzed T2
  (`land.distance <= sea.distance`) była więc arytmetycznie ZAWSZE prawdziwa (remis
  na korzyść lądu) — stary kod i tak ZAWSZE wybierał ląd, gdy oba media były
  połączone, niezależnie od dochodu. Scenariusz „morze mogło wygrać z lądem dzięki
  wyższemu dochodowi po ×2", który motywował ECHO Q5/Zmianę B, nie mógł się zdarzyć
  nawet przed T2 — potwierdzone empirycznie (bit-identyczne wyjście starej i nowej
  wersji `detectBestConnection` na tych samych fixture'ach). Zmiana B jest więc
  bezpieczna i poprawna, ale jej realna wartość to (a) pominięcie zbędnego liczenia
  połączenia morskiego/Portu/BFS wody gdy ląd już połączony (optymalizacja
  wydajności) i (b) doprecyzowanie kodu/komentarza tak, by explicite odzwierciedlał
  zamierzoną semantykę zamiast polegać na przypadkowej własności geometrii. Nie
  wpływa na wynik gry ani na żadną decyzję ECHO — czysto informacyjne.

- **T2b — ZINTEGROWANE (2026-08-22).** Dispatch przez Workflow (Operator→Evaluator→Final
  Control, wszystkie PASS, run `wf_39d8ddec-8ff`, branch `autobot/HANDEL-SZLAKI-T2b`).
  Recon wcześniejszy (subagent, przed dispatchem) znalazł gotową funkcję
  `citiesHaveTradeConnection` (`trade-routes.ts`, komentarz „E6") już implementującą
  dokładnie regułę ląd-LUB-dwa-porty z ECHO Q5 — zero nowej logiki połączeniowej.
  Nowe pole `hasTradeConnection: boolean` na `DiplomacyActionLockContext`
  (`diplomacy-locks.ts`), liczone w `main.ts::buildDiplomacyLockContextBase` przez
  wywołanie tej funkcji dla miast gracza vs partnera. Gate wpięty w
  `resolveDiplomacyActionLock` case `'5'` (traktat `UmowaSzlakow`) z kolejnością
  `atWar > hasHandel(już aktywny, nigdy nie blokowany wstecznie) > hasTradeConnection
  > relacjaGate`. UI (`diplomacyAudience.ts`) nie wymagał zmian — mechanizm
  `locked`/`note`→disabled+tooltip już generyczny. Niezależnie zweryfikowane przez
  orkiestratora po zmergowaniu do `main` (fast-forward, commit `f303760a`): `tsc
  --noEmit` czyste, `vite build` OK, `diplomacy-locks-test.cjs` (78/0) i
  `diplomacy-audience-actions-test.cjs` (20/0) nowe/zaktualizowane testy zielone,
  wszystkie testy handel/econ zgodne z raportami (te same pre-istniejące FAIL
  H2/`trade-ilosc-test.cjs`), 5 bramek referencyjnych zielone. Wypchnięte do
  `origin/main`.

- **T3 — ZINTEGROWANE (2026-08-23).** Dispatch przez Workflow (Operator→Evaluator→Final
  Control, Sonnet 5, wg nowego szkieletu procesu `R-PROC-AUTOBOT.md`, zapis dispatchu
  `dyspozycje/autobot/runs/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T3/00-dispatch.md`), wszystkie
  role PASS/PASS-WITH-NOTES. Gating budynkami handlowymi (`tradeRouteLimitForCity`)
  przestał ograniczać ISTNIENIE trasy — trasa (umowa + łączność + brak wojny, Port
  fizyczny nadal wymagany dla morza, bez zmian) daje dochód dystansowy od razu. Nowe
  pole `TradeRoute.budynekOdblokowany: boolean` niesie, czy dana trasa ma dziś pokrycie
  budynkowe (ten sam mechanizm priorytetu co dawniej gatingował istnienie: istniejące
  trasy pierwszeństwo, nowe wg rosnącego dystansu) — gotowe do konsumpcji w T4. Efekt
  uboczny (poza kodem, tylko test zaktualizowany): granty surowcowe brąz/żelazo/koń
  zawsze zależały wyłącznie od `route.status`, nigdy od budynku — teraz naturalnie
  przetrwają brak budynku, zgodnie z cytatem właściciela „handel dostępny jest od
  początku". Zweryfikowane niezależnie przez orkiestratora (tsc/build/6 testów tematu
  (65/91[1 pre-existing]/62/35[5 pre-existing]/49/54)/5 bramek referencyjnych zielone),
  zmergowane do `main` (merge non-ff, commit `f552f8e3`), wypchnięte.
  **⚠️ RYZYKO SEKWENCJONOWANIA ZNALEZIONE PRZEZ FINAL CONTROL (nie defekt T3 samego w
  sobie, dispatch jawnie wykluczał `economy.ts`): `computeTradeRouteCountByCity()` liczy
  WSZYSTKIE połączone trasy bez względu na `budynekOdblokowany`, a ta liczba wciąż zasila
  stary, globalny mnożnik +5% Handlu w `economy.ts:954-957` — czyli między zmergowaniem
  T3 a T4 miasto z trasą ale BEZ budynku dostawałoby stary bonus +5%, dokładnie odwrotnie
  niż wymaga zlecenie właściciela. T3 NIE MOŻE trafić do zbiorczego deployu ROBOCZA
  samodzielnie — deploy obejmujący T3 wymaga, żeby T4 był już zintegrowany.**
- **T4 — ZINTEGROWANE (2026-08-23, 2 rundy).** Runda 1: `BLOCK` (konflikt kontraktu, nie
  `FAIL` — nie zużył licznika) — Operator znalazł, że mechanizm wymaga danych na poziomie
  trasy podłączonych przez `turn-economy.ts`/`main.ts` (istniejące punkty wpięcia
  `liczbaAktywnychTrasHandlowych`)/`cityPanel.ts` (jedna zduplikowana linia wyświetlania),
  żadnego z tych plików pierwotna allowlista nie obejmowała. Orkiestrator rozszerzył
  allowlistę o te trzy pliki jako czysto techniczną korektę zakresu (`R-PROC-AUTOBOT.md`
  §10 — decyzja bez konsekwencji dla kosztu/ryzyka/zakresu gry, nie wymaga pytania
  właściciela), Operator wznowiony na tym samym ID/gałęzi. Runda 2: PASS/PASS/PASS. Stary
  globalny mnożnik `handelBrutto *= (1+0.05×liczbaTrasHandlowych)` zastąpiony addytywną
  sumą per-trasowych bonusów `0.05 × własny dochód dystansowy` (nowa funkcja
  `computeTradeRouteBuildingBonusByCity()`), naliczaną WYŁĄCZNIE dla tras z
  `budynekOdblokowany===true` — dokładnie zamyka ryzyko sekwencjonowania z T3. Wszystkie
  10 istniejących punktów wpięcia w `main.ts` zaktualizowane, martwy stary mechanizm
  usunięty (potwierdzone grepem), `cityPanel.ts` przestał pokazywać fałszywe „+X%" i liczy
  premię na żywo. Zweryfikowane niezależnie przez orkiestratora (tsc/build/8 testów
  handlu-ekonomii-dyplomacji + 5 bramek referencyjnych zielone, pre-istniejące FAIL w
  `trade-routes-income-test.cjs`/H2 rozwiązane przez przepisanie testu, 5 pre-istniejących
  FAIL w `trade-ilosc-test.cjs` potwierdzone niezmienione), zmergowane do `main` (merge
  non-ff, commit `fee7f455`), wypchnięte.
- **T6 — dispatchowane natychmiast po T4** (ostatni temat tej serii, `empireDetailPanel.ts`
  + `main.ts::buildEmpireTradeSnap()` — dane per-trasowe z T4 już gotowe do wyświetlenia).
  Zbiorczy deploy ROBOCZA nastąpi po zintegrowaniu T6.
