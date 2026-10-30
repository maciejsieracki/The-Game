# Final Control — ręczne sterowanie dużą armią po wydaniu lifecycle kolejki

**STATUS: PASS-WITH-NOTES dla zakresu potwierdzonego testami; temat nie jest jeszcze gotowy do zamknięcia.**
**DOMAIN: GAME**
**TEMAT:** `R-BITWA-MANUAL-CONTROL-LARGE-ARMY-Q1`
**ETAP:** 8/11 — Final Control przejrzał Operatora, obronę i niezależne ewaluacje; brakuje pełnego dowodu wykonania kolejnych ręcznych rozkazów w żywej, dużej bitwie.

## Odczyt artefaktów

- Operator `10-operator.md` dokumentuje poprawki target-specific BFS dla ataków ręcznych oraz legalny zasięg strzału, plus testy produkcyjnych metod przeciw blokadom.
- Operator pointerowy `30-operator-full-roster-pointer.md` i niezależny Evaluator `31-evaluator-full-roster.md` (worktree `/workspace/autobot-battle-large`) potwierdzili rzeczywiste kliknięcia Playwright na mieszanej bitwie 28v28: zaznaczenie 28 jednostek, Shift-click dokładnego wroga daje 28 rozkazów Attack z jego ID, a klik pustego heksu zastępuje je 28 rozkazami Move. Evaluator nie potwierdził wykonania całej drugiej partii.
- Obrona `32-operator-defense.md` oraz `41-evaluator-round2.md` w `/workspace/autobot-queued-order-stale` odtworzyły routing myszy i pierwszą kolejkę 28/28. Ich finding o pozostających 28 ID kolejki został rozdzielony do `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1`; fix tej kolejki osiągnął 11/11 i jest w Roboczej.
- Zintegrowane raporty kolejki `41–43` oraz receipt `80-deploy-and-push.md` potwierdzają fix na obecnym `main` i w Roboczej: Chromium 15/15, kolejka 28/28→0, drugi pointerowy rozkaz `atk27` wykonał jeden natychmiastowy ruch, martwe ID są pomijane i usuwane. Release commit `87aa8678`; remote `main` obecnie `6abc4ed3` (rejestr po readbacku).
- `battle-manual-orders-routing-test.cjs` PASS dla walki wręcz, dystansowej, konnicy, 42-osobowej grupy, exact target i pustego heksu. `battle-manual-choice-contract-test.cjs`: 12/12; potwierdza, że początkowy wybór Auto/Ręczna nie zależy od wodza, a sterowanie ręczne jest bramkowane. `battle-ranged-mounted-doctrine-test.cjs`: 10/10. TypeScript PASS.
- Robocza bundle manifest zwraca main SHA-256 `2c6e0e446af65e6d76d6e09f378801fe69f3614391489f4d418bac90bad336b7` (70,045,250 B), battle bundle SHA-256 `ecf1e42a8ec6eeaddca66a86596c34614199f101b253c73c98e266ca16fde4ec` (57,380,299 B). Main Robocza smoke i manifest verifier PASS.

## Decyzja Final Control

Potwierdzone jest, że produkcyjny interfejs przypisuje wybranym jednostkom rozkaz do wskazanego wroga lub pustego heksu, a pełna pierwsza kolejka działa. Potwierdzone jest też czyszczenie starego ID, więc wcześniejszy problem blokowania kolejnych immediate rozkazów został wydzielony i zamknięty w osobnym zgłoszeniu.

Nie ma jeszcze dowodu, że w prawdziwej bitwie wszystkie albo reprezentatywne grupy wykonują kolejne ręczne rozkazy aż do osiągnięcia celu: live test obserwuje pierwszą kolejkę (8/28 jednostek zmieniło pozycję), a drugi pointerowy rozkaz potwierdza natychmiastowy ruch jednej jednostki. Testy ścieżek i attack-move są headless/adapter-based. Nie twierdzę więc, że pełne ręczne sterowanie zachowuje się już jak Total War.

**Nie ma potwierdzonego nowego defektu produktu w tym Final Control.** Jest luka pokrycia e2e, która wymaga operatora testowego przed zamknięciem tematu. Następny test powinien na produkcyjnym Chromium w 28v28 wydać: (1) Move na pusty heks i wykazać, że oddziały idą dalej po kilku aktywacjach; (2) Attack do konkretnego wroga i wykazać ruch do legalnego zasięgu/zwarcia oraz rzeczywisty atak; (3) ponowny rozkaz podgrupie po pierwszym cyklu; (4) atak-marszem do heksu z wrogiem po drodze, po czym kontynuację do celu. Zapisać komendy, cele, pozycje, zużycie ruchu, HP/amunicję i konsolę. Dopiero gdy ten test przejdzie, można zakończyć Final Control i domknąć temat przez odpowiednią rejestrację etapu 9–11.

## Zakres i ograniczenia

- Scenariusz pointerowy to 28v28, nie limit 120/stronę. Macierz headless 42-osobowa nie dowodzi ruchu rendererowego ani pełnej bitwy.
- PASS obecnych asercji nie znaczy, że każda jednostka w jednym kliknięciu ma wykonać ruch lub atak; rozkazy mogą być ograniczone ruchem, blockerami, zasięgiem i aktywacją.
- Hipoteza overlapu natychmiastowego ruchu z późniejszą aktywacją nie została potwierdzona podczas 60-sekundowej obserwacji; nie należy jej rejestrować jako błędu ustalonego bez reprodukcji.

**INTEGRACJA / DEPLOY:** poprawki routingu i lifecycle kolejki są już w aktualnym `main`/Roboczej. **PUSH:** release i receipt są zdalnie potwierdzone. **ZAMKNIĘCIE tego szerokiego zgłoszenia:** NIE — oczekuje na pełny wielocykliczny browser e2e Operatora.
