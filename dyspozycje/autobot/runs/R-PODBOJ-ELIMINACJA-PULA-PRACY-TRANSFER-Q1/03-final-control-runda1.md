STATUS: PASS
DOMAIN: GAME
TEMAT: R-PODBOJ-ELIMINACJA-PULA-PRACY-TRANSFER-Q1
GOAL: Przy ELIMINACJI cywilizacji pula pracy CAŁEJ ofiary (`ownerPracaPool`) trafia
(dodaje się) do puli zdobywcy zamiast być zerowana; przy zdobyciu stolicy BEZ eliminacji
— bez zmian (pula ofiary nadal się zeruje bez transferu, kanon 2026-08-09 niezmieniony
dla TEGO podprzypadku).

WERYFIKACJA WYKONANA NIEZALEŻNIE (Final Control, w
`/home/user/wt-podboj-eliminacja-pula-pracy`, HEAD = `7737e76c`, po commitach Operatora
`8ada06e7` i Evaluatora `7737e76c`):

(a) Transfer puli pracy przy ELIMINACJI jest DODAWANY, nie zastępowany — potwierdzone
    osobistą lekturą `gra/src/game/capital-capture.ts` (`applyCapitalCapturePlunder`):
    blok `if (eliminacja) { pracaPoolPrzejeta = access.getPracaPool(oldOwner); if
    (pracaPoolPrzejeta > 0) { access.setPracaPool(newOwner, access.getPracaPool(newOwner)
    + pracaPoolPrzejeta); } }` wykonuje się PRZED bezwarunkowym
    `access.setPracaPool(oldOwner, 0)` — wzorzec identyczny z transferem skarbca w tej
    samej funkcji. `barbarianCaptorResourceAccess` rozszerzony o no-op `setPracaPool` DO
    `newOwner`, symetrycznie ze skarbcem/nauką/technologiami (barbarzyńcy nie dziedziczą
    puli pracy ofiary, tak jak nie dziedziczą reszty łupu).

(b) Przy zdobyciu stolicy BEZ eliminacji — ZERO zmiany kodu potwierdzone: transfer
    znajduje się WYŁĄCZNIE wewnątrz `if (eliminacja)`; poza tym blokiem kod jest
    dosłownie identyczny jak przed zmianą — `access.setPracaPool(oldOwner, 0)`
    bezwarunkowe, bez transferu do `newOwner`. `git diff` pokazuje, że gałąź
    `eliminacja===false` nie została w ogóle dotknięta.

(c) Część B (budynek w budowie w zwykłym mieście zachowuje postęp) zweryfikowana BEZ
    zmiany kodu — potwierdzone: `git diff 3f7c68e3..HEAD -- gra/src/game/post-battle-map.ts`
    jest PUSTY (plik nietknięty w ogóle). Osobiście przeczytałem
    `applyCityCaptureAfterBattle` (post-battle-map.ts:411-498) w całości: funkcja zmienia
    wyłącznie `city.ownerId`, `city.oblegane`, `city.rebelState`, garnizon/pozycje
    jednostek, Prawo-po-podboju i kulturę — nigdzie nie odwołuje się do `cityProd`/kolejki
    produkcji. `sanitizeBuildQueue` (production.ts:1272) i `sanitizeProductionQueue`
    (main.ts:3879) forfeitują wyłącznie: (1) legacy jednostki (`kind==='jednostka'`) w
    kolejce → zwrot Pracy do puli WŁAŚCICIELA miasta w danym momencie wywołania, (2) cuda
    zablokowane bramką (`wonderGateOk`) → zwrot do puli. Zwykły budynek
    (`kind==='budynek'`, nie cud) przechodzi przez `filterQueue(prod, item =>
    item.kind==='budynek')` nietknięty — jego `postep` nie jest w żaden sposób modyfikowany.
    Sanityzacja nie dotyka postępu zwykłych budynków — potwierdzone lekturą kodu, nie
    tylko ufnością w test.

(d) `git diff --stat 3f7c68e3..HEAD` (baza = aktualny `origin/main` w momencie tej
    weryfikacji) — WYŁĄCZNIE pliki z allowlisty:
    - `gra/src/game/capital-capture.ts` (40 wstawień, 3 usunięcia)
    - `gra/src/main.ts` (53 wstawienia, 3 usunięcia) — zweryfikowane osobiście: zmiana
      ograniczona do interfejsu `CityCaptureReportInput` (nowe pole
      `pracaPoolPrzejeta`), ciała `buildCityCaptureReportRows()` i DOKŁADNIE czterech
      wywołań tej funkcji (kapitulacja głodowa ~L13575, stolica ~L26700, eliminacja
      ~L26744/26763, podbój bojowy zwykłego miasta ~L27180) — żadnej innej zmiany w
      pliku.
    - `gra/tools/capital-capture-test.cjs`, `gra/tools/eliminacja-lup-kwoty-test.cjs`,
      `gra/tools/miasto-zdobycie-raport-test.cjs`,
      `gra/tools/podboj-kolejka-budynek-niemozliwy-test.cjs`
    - Raporty własne (`00-dispatch.md`, `01-operator-runda1.md`,
      `02-evaluator-runda1.md`)
    Zero plików spoza allowlisty (żadnego `gra/dist`, żadnego niepowiązanego pliku).
    `git diff --check 3f7c68e3..HEAD` — czysto, exit 0 (brak konfliktów/whitespace).
    Baza potwierdzona: `HEAD~2` (przed dispatch) = `3f7c68e3`.

(e) Uruchomione SAMODZIELNIE (nie skopiowane z raportu):
    - `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`) — 0 błędów, exit 0.
    - `node tools/capital-capture-test.cjs` — CAPITAL-CAPTURE-TEST OK (107/107). Zgadza
      się z raportem Operatora/Evaluatora.
    - `node tools/miasto-zdobycie-raport-test.cjs` — 95 passed, 0 failed. Zgadza się.
    - `node tools/eliminacja-lup-kwoty-test.cjs` — 38 passed, 0 failed. Zgadza się.
      Wypisany żywy dowód z mojego własnego uruchomienia: PRZED
      ownerPracaPool(zdobywca=0)=0, ownerPracaPool(ofiara=3)=90 → PO
      ownerPracaPool(0)=90, ownerPracaPool(3)=0; wygenerowany tekst: "Pula pracy: +90 —
      przejęta od wyeliminowanej cywilizacji".
    - `node tools/podboj-kolejka-budynek-niemozliwy-test.cjs` — 79 passed, 0 failed.
      Zgadza się.

    RĘCZNE PRZELICZENIE liczb z sekcji 16 `capital-capture-test.cjs` (przeczytane
    bezpośrednio ze źródła testu, linie 576-606, NIE tylko z faktu że test przeszedł):
    - Scenariusz A (ELIMINACJA, oldOwner=3 traci jedyne miasto na rzecz newOwner=7):
      ziarno `{ praca: { 3: 120, 7: 30 } }`. Asercja `eq(access.getPracaPool(7), 150,
      ...)` po zdarzeniu. Ręcznie: 30 (zdobywca PRZED) + 120 (cała pula ofiary
      PRZED) = 150 (zdobywca PO) — zgadza się z asercją i z liczbami podanymi w
      dispatchu ("zdobywca 30->150"). Ofiara: 120 (PRZED) → 0 (PO, `eq(access.
      getPracaPool(3), 0, ...)`) — zgadza się ("ofiara 120->0"). `res.
      pracaPoolPrzejeta === 120` — dokładnie kwota ofiary sprzed zdarzenia, nie
      jakaś inna wartość.
    - Scenariusz B (BEZ ELIMINACJI, oldOwner=4 traci stolicę, ma jeszcze
      `cityDrugie` — cywilizacja przeżywa; newOwner=8): ziarno `{ praca: { 4: 90, 8:
      15 } }`. Asercja `eq(accessNonElim.getPracaPool(8), 15, ...)` PO zdarzeniu —
      15 (PRZED) pozostaje 15 (PO), NIETKNIĘTE, nie 15+90=105 — zgadza się z
      dispatchem ("zdobywca 15->15 niezmieniony"). Ofiara: `eq(accessNonElim.
      getPracaPool(4), 0, ...)` — 90 (PRZED) → 0 (PO), zeruje się BEZ transferu —
      zgadza się ("ofiara 90->0"). `resNonElim.pracaPoolPrzejeta === 0` — zero
      transferu, jak wymaga kryterium binarne dispatchu.
    Wszystkie cztery liczby z sekcji 16 dispatchu (30->150, 120->0, 15->15, 90->0)
    potwierdzone ręcznym przeliczeniem WPROST ze źródła testu, zgodne z uruchomieniem
    (107/107 PASS, bez asercji FAIL w tej sekcji).

    Regresja sąsiednia uruchomiona i sprawdzona (nie tylko odczytana z raportu):
    `post-capture-law-test.cjs` 25/0, `ai-city-capture-integration-test.cjs` OK (14),
    `barb-city-capture-cluster-test.cjs` 96/0, `capital-sep-pangea-test.cjs` 3/0,
    `capital-sep-unit-test.cjs` 36/0, `ai-zdobycie-miasta-adiacencja-test.cjs` OK
    (96/96) — wszystkie liczby identyczne z raportami Operatora i Evaluatora.

ZARZUTY: brak.

RUNDY: 1/5
NASTĘPNY KROK: Final Control PASS → orkiestrator dispatchuje integrację allowlist-only
(orkiestrator GPT-5.6 Luna Medium) → READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
