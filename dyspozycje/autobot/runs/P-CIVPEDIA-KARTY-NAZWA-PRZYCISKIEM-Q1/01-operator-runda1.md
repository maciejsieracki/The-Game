# P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 — raport Operatora, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1
MODEL+EFFORT: Opus 5, effort high
ROLA: Operator
DEPLOY/PUSH: NIE WYKONANO

## Weryfikacja reconu — dwa fakty z dispatchu SIĘ NIE POTWIERDZIŁY

- **Recon F jest nieprawdziwy.** `'Szczegóły →'` nie występuje „we wszystkich adapterach".
  Występował w **3 miejscach** `technologyAdapter.ts` (`buildingsRows`, `unitsRows`,
  `nextTechsRows`) i **1** w `techDiscoveryNotice.ts:575`. `buildingAdapter.ts` nie ustawia
  `linkTo` **nigdzie** — karta budynku nie ma dziś ani jednego linku krzyżowego, więc nie ma
  na niej czego zamieniać na przycisk (potwierdzone zrzutem `karta-2-budynek.png`).
- **Wiersze z `linkTo` mają DWA kształty, nie jeden.** Poza sekcjami karty technologii
  (nazwa w `label`) istnieją wiersze, gdzie `label` jest nazwą POLA, a nazwą encji jest
  `value`: „Technologia: Brązownictwo", „Zastępuje: Wojownik", „Ulepszenie bazowe: droga"
  (`unitAdapter`, `improvementAdapter`, `wonderAdapter`). Tam nazwa **już była** przyciskiem.
  Ślepe przeniesienie przycisku na `label` zrobiłoby przycisk ze słowa „Technologia".

## Zmiany

`types.ts` — dodane `EntityCardRow.linkAnchor?: 'label' | 'value'` (domyślnie `'value'` =
dzisiejsze zachowanie). **Uzasadnienie zmiany kontraktu:** renderer nie ma jak wywnioskować,
który tekst nazywa encję. Heurystyka „puste `value` → przycisk na `label`" jest błędna dla
sekcji „Zmiany ekonomiczne", gdzie `value` to efekt („+2 nauki") — pudełko wylądowałoby na
efekcie, nie na nazwie. Pole jawne zamiast zgadywania.

`renderer.ts` — `buildGridRowEl` stawia `data-entity-*` na **dokładnie jednym** elemencie
wiersza (nigdy na obu naraz, inaczej asercja pudełko==klik traci sens). CSS: `button.entity-card-row-key`
dołączony do czterech wspólnych grup (reset / pudełko / hover / focus-visible) + własna reguła
`opacity:1; flex:0 1 auto; margin-right:auto` postawiona **za** wspólnym pudełkiem.

`technologyAdapter.ts` (6 miejsc), `techDiscoveryNotice.ts` (1) — `'Szczegóły →'` usunięte,
`linkAnchor:'label'` tam, gdzie `label` jest nazwą encji. `trailing` („Wymaga też: …") i
fallback `entity-card-row--linked` **nietknięte** (granice dispatchu).

Dwa defekty własnej zmiany złapane pomiarem na żywo, nie rozumowaniem: (1) backticki w
komentarzu CSS zamknęły literał szablonowy i złamały parsowanie pliku; (2) wspólny reset
`margin:0` kasował `margin-right:auto` etykiety, przez co przyciski nazw lądowały na ŚRODKU
wiersza — widoczne dopiero na zrzucie, `tsc` i asercje pudełka były zielone.

## Testy

| Bramka | Baza `c8483a64` | Po zmianie |
|---|---|---|
| `tsc --noEmit` | 0 błędów | **0 błędów** |
| `improvement-card-callsites` | 34/2 | **36/0** |
| `civpedia-karty-nazwa-przyciskiem` (NOWA) | — | **27/0**, 6 klas asercji z listy (24/0 przed OBRONĄ) |
| `civpedia-caly-wiersz-przyciskiem` | 44/63, 19 fail | **66/85**, 19 fail — **zbiór faili identyczny co do wiersza** (44/63 przed OBRONĄ) |
| `wydarzenia-zbadano-karta-tech` (spoza allowlisty) | 144/1 | **137/4** ← jedyna regresja |
| `civpedia-ulepszenia-historia-batch` / `-historia-infra` | 116/0 · 18/0 | 116/0 · 18/0 |
| pozostałe `civpedia-*` (8 bramek) | zielone | zielone |
| `unit-info-card-viewport-height` · `tech-discovery-card-real-click` | 35/0 · 12/0 | 35/0 · 12/0 |
| `entity-card-cross-links-nested-overlay` · `-button-style` · `-action-buttons` | 14/10 · 33/1 · 30/1 | bez zmian |
| `entity-card-single-dialog` | 21/5 | **21/5** — bez zmian (KOREKTA: pierwotny wpis „22/4" był błędny, patrz `02-obrona-runda1.md` zarzut 4) |
| `entity-card-contract` | `ReferenceError: requestAnimationFrame` | identycznie — nie pogorszone |
| logic · tech-tree · research · unit-replace · combat | 213/213 · 19/19 · GREEN · 13/13 · OK | bez zmian |

## GOAL 3 — H1 czy H2

**H2 (przestarzały test).** Pomiar na żywo: karta `scrollHeight` 914 vs `clientHeight` 720
(realnie przewijalna); wiersz przed przewinięciem `top` 813,6 wobec dolnej krawędzi karty
811,0 — 2,6 px poniżej cięcia, więc `elementFromPoint` trafiał w `.tdn-back`. Po przewinięciu
**kółkiem myszy** `scrollTop` 194, wiersz `top` 619,6, hit = `BUTTON`, realny klik otwiera
kartę `tartak`. Linia `scrollIntoView` dopisana do testu **dopiero po** tym pomiarze i po
obejrzeniu zrzutów, zgodnie z zakazem z dispatchu. Pomiar powtórzony PO GOAL 1 — bez zmian.

## Blokada

Jedyna regresja siedzi w bramce **spoza allowlisty**
(`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs`) i ma jedną przyczynę:
strażnik `clickRowLabel()` przerywa scenariusz `(B6)` **bez kliknięcia**, gdy punkt etykiety
należy do `button[data-entity-kind]` — warunek napisany, gdy etykieta nie była przyciskiem.
Kopia scratch tej bramki ze zdjętym jednym warunkiem daje **144/1**, czyli dokładnie baza
(`(B7)` jest pre-istniejące, identyczne co do wartości). Produkt jest sprawny; plik repo
pozostał nietknięty. Szczegóły i pomiary: `decision-abc.md`.
