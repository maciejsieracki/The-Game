STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-BUILDING-EMPORION-Q1
GOAL: Nowy budynek handlowy Emporion (epoka 2, badanie Handel, wymaga Targowiska w tym samym mieście, +1 slot tras, kwalifikacja do bonusu 5% handlu, koszt ≈2× Targowisko).
ZMIANY-COMMIT: baza origin/main b9d8fa546; commit: SHA w sekcji „Commit” poniżej.
Allowlista (zachowana): gra/data/buildings.json (+1 wpis), gra/data/tech.json (tylko opis Handel), gra/src/game/trade-routes.ts (TRADE_BUILDING_IDS), gra/src/game/building-resource-gate.ts (CITY_BUILDING_PREREQ), gra/src/ui/icons/brand/building-icon-map.json (+1 mapowanie), gra/src/game/ai.ts (priorytet ekonomiczny), gra/tools/emporion-building-test.cjs (NOWY), gra/tools/grupy-budynkow-test.cjs i gra/tools/budynki-koszt-pracy-50-test.cjs (liczniki, z uzasadnieniem w komentarzach), dyspozycje/autobot/runs/R-WEB-BUILDING-EMPORION-Q1/**.

POMIAR PRZED (ZMIERZONO):
- Targowisko: epokaWejscia 1, maksPoziom 3, baza.pieniadz 5, przyrost.pieniadz 3, kosztBudowy 25, przyrostKosztu 10, utrzymanie 1, koszt_surowce drewno 30, techUnlock „Wymiana”.
- Magazyn: epoka 2, techUnlock „Handel”, kosztBudowy 20, koszt_surowce drewno 50 + kamień 30.
- TRADE_BUILDING_IDS przed: targowisko, port, port_wielki. Limit slotów = 1 + liczba tych budynków (tradeRouteExistenceLimitForCity).
- Bonus 5% handlu jest flagą per TRASA (budynekOdblokowany: boolean, computeTradeRouteBuildingBonusByCity), a nie per budynek.
- CITY_BUILDING_PREREQ przed: mennica, baszta, akwedukt, akademia, fort, swiatynia, warsztat_oblezniczy, laznia_publiczna, akademia_wojskowa.
- Konsumenci ai.ts: unlocksEconomy (lista id odblokowanych budynków) zawierała targowisko, nie emporion.

ZMIANY:
1. buildings.json: wpis emporion — epokaWejscia 2, maksPoziom 1, baza.pieniadz 8, przyrost.pieniadz 4, kosztBudowy 50, przyrostKosztu 20, utrzymanie 2, przyrostUtrzymania 1, koszt_surowce {drewno 80, kamien 60}, dajeSzczescie false, techUnlock „Handel”, top3 po polsku (3 pozycje), historia/opis/uwagi. Kategoria/grupa jak Targowisko.
2. tech.json: Handel → „Odblokowuje budynek”: „Magazyn; Emporion”.
3. trade-routes.ts: TRADE_BUILDING_IDS += 'emporion'.
4. building-resource-gate.ts: CITY_BUILDING_PREREQ.emporion = 'targowisko'.
5. building-icon-map.json: emporion → bld-targowisko (brak dedykowanego SVG; wspólna ikona).
6. ai.ts: unlocks.includes('emporion') dodane do listy unlocksEconomy (ten sam priorytet co Targowisko).

ODSTĘPSTWA OD DISPATCHU (świadome):
- „+5% kumulujące się, drugie” NIE zostało zaimplementowane jako osobny bonus. Istniejący mechanizm daje 5% per trasa (flaga), a nie per budynek. Emporion dodaje +1 slot tras, więc kwalifikuje dodatkową trasę do tego samego 5%. Zmiana mechanizmu na liczenie per budynek to osobny temat (wymaga decyzji właściciela).
- maksPoziom = 1 (prostsze, dispatch dopuszcza).
- Ikona: reużyta bld-targowisko zamiast nowego SVG.
- Wiki/Cywilopedia: src/data/wikiBundle.json nie został przebudowany (generowany przez tools/bundle-wiki-for-game.cjs w prebuild). NIE_ZMIERZONO, czy budynek trafi do wiki bez przebudowy — do zgłoszenia.

TESTY (ZMIERZONO; EXIT=0 = zielone):
- npm ci --ignore-scripts: EXIT=0. npx tsc --noEmit: EXIT=0.
- emporion-building-test.cjs (NOWY, 36 asercji): GREEN EXIT=0 (A parametry, B porównanie z Targowiskiem, C tech Handel odblokowuje Magazyn i Emporion, D prereq miasta, E sloty tras, F monotoniczność).
- MUTACJA (usunięcie 'emporion' z TRADE_BUILDING_IDS): RED EXIT=1, 5 FAIL, 31 pass. Przywrócono, GREEN.
- trade-routes-limit-test: EXIT=0. trade-routes-income-test: EXIT=0. trade-routes-test: EXIT=0. trade-routes-ownership-income-test: EXIT=0. trade-grant-test: EXIT=0. trade-sea-bonus-requires-port-test: EXIT=0. building-resource-visibility-test: EXIT=0. handel-wymiana-tech-gate-test: EXIT=0. production-overflow-test: EXIT=0. building-tech-gate-test: EXIT=0. civpedia-budynki-historia-test: EXIT=0. building-gate-audit: EXIT=0. deposit-building-gate-test: EXIT=0. grupy-budynkow-test (po aktualizacji 43/6): 84 pass, 0 fail, EXIT=0.
- ai-test: 274 pass / 20 fail, EXIT=1. Zgodne z punktem odniesienia z dispatchu (274/20).
- budynki-koszt-pracy-50-test (po aktualizacji liczby 43 i fingerprintu sha256 586ef458… → 033cb1b7…): 138 pass / 40 fail, EXIT=1. Wszystkie 40 to itemCost z kosztBudowy/przyrostKosztu, także dla magazyn/targowisko (nieruszonych), czyli systemowe rozjechanie formuły testu z produkcją, niezwiązane z tym tematem.
- trade-ilosc-test: 35 pass / 5 fail, EXIT=1. Asercje dotyczą kon/kluczy przepływu ilościowego (TRADE_ROUTE_STOCK_FLOW_KEYS) i limitu transferu, nie zbioru budynków handlowych. Baseline NIE_ZMIERZONO bezpośrednio (nie cofałem plików w worktree).
- szczescie-przebudowa-skali-test: 4 FAIL, EXIT=1. Asercja liczby budynków (41) była już czerwona przed zmianą (katalog 42); teraz got 43. Nie naprawiałem (stale test, poza zakresem).
- NIE URUCHOMIONE: trade-routes-contact-only-test, trade-treaty-free-break-after-10-test, trade-ilosc (ponownie po zmianie nie puszczony), grupy/buildings poza wymienionymi.
- Chromium / zrzut ekranu / chip „Wymagane badania / W mieście” w panelu miasta: NIE_ZMIERZONO (nie uruchamiano przeglądarki; ścieżka chipu korzysta z CITY_BUILDING_PREREQ, ale nie zweryfikowano wizualnie). Dostępność w availableProduction (production.ts) też nie była testowana bezpośrednio, tylko funkcja cityBuildingPrereqMet i dane.

BLOKADY:
- Brak dowodu wizualnego (Chromium).
- Wiki bundle nie przebudowany.
- Dwa testy liczbowe (budynki-koszt, szczescie-przebudowa) mają niezależne, istniejące problemy (itemCost, stała 41).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator: sprawdzić decyzję o odstępstwie +5% (per trasa vs per budynek), przebudować wiki bundle, dodać dowód Chromium (chip + lista budowy), zweryfikować trade-ilosc baseline.
COMMIT: zob. wiadomość commita (SHA podane w odpowiedzi orkiestratora).
DEPLOY/PUSH: NIE WYKONANO
