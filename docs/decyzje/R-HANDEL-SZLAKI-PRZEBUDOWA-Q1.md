# R-HANDEL-SZLAKI-PRZEBUDOWA-Q1 — przebudowa mechaniki szlaków handlowych

**Status:** ABC-OCZEKUJE (5 pytań poniżej). Zarejestrowane 2026-08-21.

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
- **Kryterium wyboru lądu vs morza** (`detectBestConnection`) — skoro morze
  ma teraz dawać wyższy dochód (×2), wybór między dostępnymi trasami ma iść
  za KOŃCOWYM dochodem, nie surową odległością jak dziś. To logiczna
  konsekwencja celu (nie osobna decyzja produktowa).

## Punkty WYMAGAJĄCE ABC (patrz pytania zadane właścicielowi w czacie)

1. **Zakres odwrócenia dystansu** — wspólny zakres ląd+morze (jeden wzór,
   jeden max=20) czy osobny per medium (ląd względem swojego max=12, morze
   swojego max=20 — wtedy najdalsza trasa lądowa i najdalsza morska dają
   identyczny szczytowy dochód mimo różnych odległości bezwzględnych).
2. **Bonus morski ×2 vs istniejący `PORT_SEA_TRADE_BONUS_PIENIADZ`** —
   zastępuje go całkowicie, czy się z nim sumuje jako dodatkowy, niezależny
   strumień.
3. **Wariant atrybucji 5% do konkretnej trasy** — (A) proporcjonalnie do
   własnego dochodu dystansowego trasy z globalnej puli miasta; (B) równy
   podział globalnej puli przez liczbę tras; (C) per-trasa stały 5% JEJ
   WŁASNEGO dochodu dystansowego, sumowane globalnie (odwraca dzisiejszy
   kierunek zależności — realny transfer budżetu z Podatku do Handlu, nie
   tylko kosmetyka UI).
4. **Zakres „jedna umowa na cywilizację"** — nowy limit: TOTAL 1 umowa
   szlakowa na cywilizację (gracz/AI, z jednym partnerem na raz, trzeba
   zrywać nadmiarowe istniejące), czy właściciel miał na myśli już istniejące
   ograniczenie (1 umowa per PARA cywilizacji, bez zmian).
5. **Port jako wymóg trasy morskiej** — trasa morska nadal wymaga Portu do
   samego ISTNIENIA (tylko ląd korzysta z nowej reguły „umowa+łączność
   wystarczy"), czy Port staje się tylko warunkiem bonusu 5% (jak budynek na
   lądzie) — statek handlowy może dobić bez portu, czysto geometrycznie.

## Podział na tematy AutoBot (proponowany, po ECHO)

| # | Temat | Zależność |
|---|---|---|
| T1 | Wzór dystansowy: kierunek + stałe ×5 | ABC pkt 1 |
| T2 | Bonus morski ×2 + kryterium wyboru medium | T1, ABC pkt 2 |
| T3 | Rozdzielenie gatingu budynkami od istnienia trasy | ABC pkt 5 |
| T4 | Atrybucja 5% per trasa | T3, ABC pkt 3 |
| T5 | Limit „jedna umowa na cywilizację" | ABC pkt 4 (niezależny od T1-T4) |
| T6 | UI per-trasa pełny rozkład dochodu | T1, T2, T4 |

Kolejność bezpieczna: T1→T2→T3→T4→T5 (równolegle)→T6.
