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
