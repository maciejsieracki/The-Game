# Ruch i cios w bitwie

## Metadane

| Pole | Wartość |
|------|---------|
| **id** | `ruch-i-cios-w-bitwie` |
| **tytuł** | Ruch i cios w bitwie |
| **kategoria** | Jednostki i walka |
| **poradnik_ref** | Część X (Walka) §60.5 |
| **decyzja_ref** | `R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1` (decyzje właściciela 2026-11-15) |
| **json_ref** | `battleScene.ts` (`_meleeLatched`, `_strikeOnArrival`, `_continueAfterStrike`) |

---

## Wiki‑S

W bitwie jednostka wykorzystuje **cały swój ruch**. Do **pierwszego zderzenia wręcz** szereg wchodzi równo (równe tempo). Od zderzenia: jednostka dochodzi do wroga, **uderza**, a jeśli zostały jej punkty ruchu, **idzie dalej ku następnemu wrogowi**. W jednej turze jednostka uderza **tylko raz**. Jeśli po ciosie nie ma dokąd się ruszyć, reszta ruchu **przepada**.

---

## Wiki‑M

| Faza | Zasada |
|------|--------|
| Wejście szeregu (do pierwszego zderzenia wręcz) | Równe tempo całej armii; jednostka, która doszła do wroga, **nie** uderza od razu i **nie** rusza się po ciosie. Strzały dystansowe nie kończą tej fazy. |
| Po pierwszym zderzeniu wręcz | Pełny ruch; **cios przy dojściu**; potem ruch ku następnemu wrogowi (reszta puli ruchu). |
| Limit | **Jeden cios na jednostkę na turę** (piechota, konnica, rydwany, strzelcy). Po ciosie jednostka może tylko dojść do kolejnego wroga, nie uderzy go drugi raz. |
| Brak drogi | Okrążona lub zablokowana jednostka traci resztę ruchu bez kompensacji. |

**Wyjątki od reguły pełnego ruchu:** doktryny Obrona i Ostrzał (jednostka po ciosie lub strzale nie maszeruje), ręczne rozkazy gracza w trybie ręcznym, uciekający oraz oblężenie muru. Gdy zaplanowana ścieżka kończy się wcześniej niż pula ruchu albo jej pole zajmie inna jednostka, jednostka po zderzeniu wręcz nie kończy tury: uderza, jeśli wróg jest w zasięgu, a w przeciwnym razie idzie dalej ku najbliższemu wrogowi, nie wracając na pola przebyte w tej turze.

Strzelcy po strzale idą co najwyżej do miejsca, z którego następny cel jest w zasięgu (nie wchodzą w zwarcie). Doktryny Obrona i Ostrzał po ciosie nie maszerują. Reguła dotyczy bitwy w polu; oblężenie z murem i ręczne rozkazy gracza działają jak dotąd.

> Założenia robocze **DO POTWIERDZENIA** przez właściciela: przełączenie jest jedno, globalne dla bitwy (pierwsze zderzenie wręcz którejkolwiek pary); strzelcy po strzale podchodzą tylko na zasięg.

---

### Obrażenia wręcz a pancerz

Cios wręcz zadaje obrażenia broni pomniejszone o pancerz celu, plus przebicie i bonus szarży. Gdy pancerz jest równy obrażeniom broni albo większy, a atakujący nie ma przebicia, cios w rozstrzyganiu walki zadaje 0. W bitwie ręcznej najmniejsze obrażenie z ciosu wręcz wynosi 1.

### Morale i ucieczka

Jednostka ucieka, gdy jej bieżące morale spadnie do progu „Morale ucieczki” z jej danych (domyślnie 25; na wzgórzu lub w lesie o 5 punktów niżej). Uciekająca jednostka przestaje atakować i odchodzi ku swojej krawędzi mapy. Morale spada m.in. od strat zdrowia (każde 10% to −10), od śmierci sojusznika w promieniu 3 pól (−12), od ciosu z flanki (−8) lub z tyłu (−15), od szarży (−15) i raz, gdy otacza jednostkę co najmniej trzech wrogów (−10). Jednostki „walczące do śmierci” nie uciekają.

Ucieczka dotyczy także łuczników i innych jednostek dystansowych, na tych samych zasadach. Gdy strona straci ostatnią jednostkę walczącą wręcz, jej strzelcy jednorazowo tracą połowę morale i od razu sprawdzany jest próg ucieczki (osłona wręcz). Strzelec, do którego podszedł wróg walczący wręcz w odległości do 2 pól, cofa się o krok, by odzyskać odstęp i strzelać dalej; wrogowie dystansowi tego nie wywołują. Ucieczka jednostek dystansowych jest zamierzona i pozostaje bez zmian.
