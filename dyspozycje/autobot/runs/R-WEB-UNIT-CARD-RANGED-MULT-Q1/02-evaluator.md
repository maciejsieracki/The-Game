# R-WEB-UNIT-CARD-RANGED-MULT-Q1 — Evaluator, runda 1/5

STATUS: PASS
DOMAIN: GAME — oceniono wyłącznie kartę jednostki, tooltip hex, hunk tożsamości w `unitCardCombatFor`, 8 wartości `fieldPower` w `units.json` oraz testy z allowlisty.
WERDYKT: Kryteria UI i zgodności mocy spełnione. OBRONA POMINIĘTA — brak zarzutów.

## Weryfikacja

Uruchomiłem ponownie sekwencyjnie, wyłącznie testy Node (bez uruchamiania Chromium):

- `node tools/unit-card-ranged-mult-test.cjs` — PASS; 8 wpisów: 2 Procarzy ×3 i 6 pieszych Łuczników ×2; wartość Mocy karty liczona z efektywnych statystyk jest równa `armyFieldPower` i cache `units.json`.
- `node tools/ranged-damage-mult-test.cjs` — PASS, w tym kontrola negatywna: Oszczepnik i jazda łucznicza pozostają ×1, a ich cache nie zmienia się.
- `node tools/unit-power-test.cjs` — 6/6 PASS.
- `node tools/unit-context-card-test.cjs` — 29/29 PASS.
- `node tools/unit-power-sort-test.cjs` — 13/13 PASS; sortowanie rosteru i round-trip zapisu/odczytu rosteru bez regresji.

`unit-card-ranged-mult-test.cjs` sprawdza wszystkie osiem rekordów z bieżącego `units.json`, właściwą klasyfikację, liczbową moc karty oraz równość z runtime. W tooltipie `unitCardCombatFor` przenosi `Typ` i `Jednostka` z definicji jednostki; `buildUnitForcesHtml` przekazuje tę samą tożsamość do kanonicznego `fieldPower()`. Rozwinięta karta zachowuje bazową wartość „Atak dystansowy” i dopisuje jawne `×N obrażeń pocisku` dla jednostek z mnożnikiem. To czytelnie rozdziela statystykę ataku od mnożnika obrażeń.

Diff `units.json` obejmuje dokładnie osiem zmian liczbowych w polu `fieldPower`; brak zmian w pozostałych polach tych rekordów. Test potwierdza wartości cache w runtime. To istniejące pole pochodne, więc zmiana nie narusza formatu zapisu stanu gry. Brak zmian w kodzie walki i źródle `unit-power.ts`; mnożnik pozostaje wykorzystany przez istniejącą implementację `fieldPower` / `armyFieldPower`. Kontrola Oszczepnika potwierdza wymagany negatywny przypadek.

## Uwaga walidacyjna

Test kontekstowej karty (29 asercji) jest regresją ogólnego tooltipu i używa ręcznych fixture’ów; sam nie asertuje nowego tekstu mnożnika w wyrenderowanym HTML. Nowy test asertuje expose mnożnika przez dane karty oraz zgodność Mocy. Kod renderujący dopisek sprawdziłem statycznie. Nie traktuję braku asercji HTML jako blokady, a równoległy test Chromium nie był uruchamiany zgodnie z ograniczeniem sesji.

STATUS KOŃCOWY: PASS. Brak zarzutów do przekazania Operatorowi; OBRONA POMINIĘTA.
