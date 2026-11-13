# R-BITWA-ATAK-MARSZEM-HEX-Q1 — niezależna ewaluacja

**Werdykt: PASS-WITH-NOTES.** Zakres „atakuj-marszem” jest zaimplementowany spójnie z odrębnymi rozkazami zwykłego ruchu i ataku wroga. Nie znalazłem blokującego błędu w sprawdzonych ścieżkach. Przed Final Control pozostaje ograniczenie: test pointerem używa po jednej jednostce na stronę, a nie pełnej dużej armii.

## Niezależnie sprawdzony zakres

- Przejrzałem `gra/src/battle/battleScene.ts` względem bazy `747ade419e9771f5a94eb1f82f174ceda100eaa1` oraz testy i raport operatora.
- „Atakuj-marszem” wydaje rozkaz do pustego heksu. Kliknięcie wroga nadal wskazuje dokładny cel, a zwykły klik pustego pola bez uzbrojonego trybu pozostaje zwykłym ruchem.
- Marsz rozpoznaje wrogów na trasie, atakuje przy legalnym zasięgu albo podchodzi do pola ataku, po czym zachowuje waypoint. Właściwy ruch nie przechodzi przez zajęte pola. Rozkazy grupy są kolejkowane szeregowo, z ponownym sprawdzeniem zajętości.
- Anulowanie przez Escape i przycisk „Anuluj marsz”, wymianę rozkazu, cele routed/dead oraz zachowanie dla łuczników bez amunicji obejmują testy produkcyjnych metod sceny.

## Weryfikacja

- `node tools/battle-attack-move-order-test.cjs` — PASS; obejmuje śmierć zagrożenia i wznowienie marszu do waypointu, legalny strzał, podejście bez amunicji, cele routed, przeszkody nieprzechodnie i sojusznicze, grupę, kolejkę, anulowanie/wymianę rozkazu oraz rozdzielenie Move/Attack.
- `node tools/battle-manual-orders-routing-test.cjs` — PASS; w tym 42 jednostki, blokady/teren, exact target, amunicja, konnica i kliknięcia pola/wroga.
- `node tools/battle-manual-choice-contract-test.cjs` — 9/9 PASS.
- `node tools/battle-ranged-mounted-doctrine-test.cjs` — 9/9 PASS.
- `npm run typecheck` — PASS.
- `git diff --check 747ade419e9771f5a94eb1f82f174ceda100eaa1` — PASS.
- Niezależny test Chromium `TMPDIR=/workspace/tmp-eval-attack-move node tools/battle-attack-move-pointer-test.cjs` — PASS: wybór jednostki przez UI, kliknięcie przycisku i pustego waypointu, zwykły Move, exact-target Attack i zero błędów strony/konsoli. Bundlowanie zakończyło się poprawnie (917 modułów; 70,032,946 B). Pierwsza próba z domyślnym `/tmp` nie mogła zapisać bundla (`ENOSPC`); powtórzyłem ją w przestrzeni roboczej i zaliczyła się.

## Uwagi do Final Control

1. Chromium test ogranicza preset do jednej jednostki na stronę dla responsywności; nie potwierdza jeszcze prawdziwej obsługi rozkazu w dużej armii klikanej przez gracza. Testy metod produkcyjnych obejmują grupę 42 jednostek.
2. Rozkaz jest stanem bieżącej sceny taktycznej i nie dodaje zapisu/odtworzenia marszu przez save/load. To ograniczenie jest jawnie opisane przez operatora.
3. W pierwszym przebiegu testu Chromium `/tmp` zabrakło miejsca. Ponowny przebieg z `TMPDIR` w `/workspace` zakończył się PASS; nie traktuję błędu środowiskowego jako błędu produktu.

Nie edytowałem kodu produktu. Nie wykonano Defense, Final Control, merge, deploymentu ani pushu.
