# R-HANDEL-SZLAKI-PRZEBUDOWA-Q1 — przebudowa mechaniki szlaków handlowych

**Status:** ECHO ZAPISANE (5/5 pytań rozstrzygniętych, 2026-08-21). Gotowe do dispatchu Operatora po zapisaniu T1-T6.

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
