# R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1 — Operator, runda 3 (tego ID = r4 wg FC)

STATUS: BLOCK (częściowy pomiar: AUTO i skip zmierzone na ścieżce mapowej; tryb ręczny z rozkazami ZABLOKOWANY przez bramkę sceny; zamiana stron NIE ZMIERZONO)
DOMAIN: GAME (tylko narzędzie pomiarowe w `gra/tools/`; `gra/src` bez zmian)
TEMAT: R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1
GOAL: pomiar Wojownik vs Wojownik 10 vs 10 ŚCIEŻKĄ MAPOWĄ (`?playtest=mapa&civTest=1` + `__civTest.addUnit(...,'Wojownik')` x10 po obu stronach), bez presetu, bez przepisywania statystyk, z dowodem haka w runtime.
BAZA: c6f28ce7e1524df26352f93afd8709f1e1e0a355 (origin/main, detached worktree). Dispatch i DODATEK 2 czytane z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
DECYZJA ZA ZAŁOŻENIEM: hak z r1 bez zmian (`gra/src/main.ts`, `addUnit` z typeId); `gra/src` nie dotykany.

## Co zrobiono

1. `npm ci --ignore-scripts` w `gra/`, build vite poza repo: `node ./node_modules/vite/bin/vite.js build --outDir /tmp/ad2/dist --emptyOutDir` (19–20 s, EXIT 0). TMPDIR Chromium: `/tmp/ad2/tmp`.
2. Nowy driver `gra/tools/live-verify-wojownik-map-q1.cjs` (ścieżka mapowa): gracz (ME=0) i barbarzyńcy (-1) po 10 x `__civTest.addUnit(owner,q,r,false,'Wojownik')` na sąsiednich heksach; wojna przez `setWar`; klik na heks gracza (zaznaczenie), klik na heks wroga (atak z mapy); okno przed bitwą `.pb-overlay`; scena bitwy startuje od razu (bez paska `#deploy-toolbar-start`).
3. Dwie próby techniczne przed wnioskiem o BLOCK: (a) pierwsze uruchomienie zawieszało się w pętli czekania na pasek wdrożenia — diagnoza: scena startuje w AUTO bez etapu wdrożenia; (b) pętla klatek przy renderowanym mapie trwała ~1,5 s/klatkę — usunięto callbacki renderowania mapy z kolejki na czas bitwy (ten sam zabieg logiki co wyłączenie `renderer.render` w r3); po tym ~7 s na bitwę.
4. Zmierzono 3 ziarna (`1,2,3`) x tryby `auto`, `skip`, `manual` dla strony atakującej (gracz = atakujący).

## Dowód haka w runtime (probe)

Odczyt z rosteru sceny bitwy (nie `typeof`): `atkNames={"Wojownik":10}`, `defNames={"Wojownik":10}`; próbka: `nazwa:"Wojownik"`, `kategoria:"miecznik"`, `hp:22/22` po obu stronach. Hak działa: wstawione jednostki są typu Wojownik z units.json (realne statystyki z mechanizmu gry, bez przepisywania). Pole `typeId` w `bu` nie istnieje w scenie (`null`) — typ identyfikuje `nazwa`.

## Tabela pomiarowa (strona atakująca = gracz; seed 1, 2, 3; wszystkie 10 vs 10)

| Tryb | Zwycięzca | Straty zwycięzcy (wyeliminowani / uciekinierzy / pozostali) | Straty przegranego | Rundy | Ucieczki | Status |
|---|---|---|---|---|---|---|
| AUTO (start sceny, bez rozkazów) | gracz (atakujący) | 5 / 0 / 5 | 10 / 0 / 0 | 18 | 0 | ZMIERZONO |
| skip (metoda `scene.skip()`, patrz uwaga) | gracz (atakujący) | 5 / 0 / 5 | 10 / 0 / 0 | 18 | 0 | ZMIERZONO |
| ręczny z rozkazami (ATAK per jednostka + Spacja) | — | — | — | — | — | BLOCK (patrz niżej) |

Wynik jest IDENTYCZNY dla ziaren 1, 2 i 3 (ten sam przebieg logu: "Wojownik trafia Wojownik [FLANKA -15% obrony] za 3 (HP 5/22)", koniec: "zwyciestwo ATAKUJACEGO"). Ziarno (`Math.random`) nie zmienia wyniku tej bitwy — bitwa jest deterministyczna przy tym samym stanie mapy. Trzy ziarna dają więc JEDEN niezależny wynik (n_efektywne = 1); nie wolno z tego wyciągać rozrzutu.

Uwagi do tabeli:
- "skip": przycisk Pomiń nie został znaleziony po tekście (`skipClick: "fallback-metoda"`), użyto `window.__lastBattleScene.skip()`. To nie jest klik w UI; wynik zgodny z AUTO.
- "AUTO": scena w ścieżce mapowej startuje już w AUTO (`manual:false`, `manualCommanderGate:true`, `playerHasCommander:false`); klawisz R nie był wciskany.
- Ucieczki = jednostki `routed && !dead` po zakończeniu; wyeliminowani = `dead`. W tej bitwie: 0 uciekinierów po obu stronach.

## BLOCK: tryb ręczny z rozkazami na ścieżce mapowej

Scena bitwy po wejściu z mapy ma `_manualCommanderGate=true`, a gracz nie ma dowódcy armii (`isArmyCommander`; `isGeneral` ustawia się tylko przy zakupie generała, a hak `addUnit` z typeId tworzy `isGeneral:false`). Bramka sceny zatem ustawia `_manualMode=false` i bitwa idzie AUTO (zob. komentarz w `battleScene.ts` ~3662: "bez generała ... bitwa idzie AUTO"). Driver ręczny (r3) wymaga `_battleAwaitingOrders` — w tej ścieżce nigdy nie nastąpi. Logi trzech ziaren: `manual=false, bramka=true, dowodca gracza=false` (zob. `evidence-wojownik-map-r4.json`, pole `error` dla `|manual`).

Dwa podejścia (wymóg DODATKU 2 przed BLOCK):
- Podejście 1: stosy Wojownik na mapie bez dowódcy — AUTO, bramka blokuje ręczny.
- Podejście 2: obejście przez hak — niemożliwe bez zmiany `gra/src` (hak nie tworzy generała Wojownika; `__frozenTestDebug.spawn` klonuje szablon gracza, nie typ Wojownika). Dodanie generała do stosu zmieniłoby też skład 10 vs 10 (11 jednostek). Nie wykonano przepisywania `_manualMode` w scenie — to byłby stan, którego produkt nie osiąga.

Wniosek: manual z rozkazami przy 10 vs 10 wymaga dowódcy po stronie gracza albo zmiany bramki w produkcji — decyzja właściciela/orkiestratora, nie zakres tego tematu.

## NIE ZMIERZONO: kontrola zamiany stron (gracz jako obrońca)

Próba: barbarzyńcy (-1) z 10 Wojownikami obok stosu gracza, `__civTest.endTurn()` i czekanie na atak AI. Wynik: okno przed bitwą pojawiło się, ale w innej bitwie świata (rola "RZYMIANIE · OBROŃCA — TY" vs "GRECY · ATAKUJĄCY"; po stronie obrony Hastati 1, atak Łucznik 1). Zdarzenie AI Grecy–Rzymianie, nie nasze stosy. Atak barbarzyńców na nasz stos nie jest sterowalny z UI/haków. Zapis: `evidence-wojownik-map-r4-def-negatywny.json`. Kontrola zamiany stron NIE ZMIERZONO.

## Zastrzeżenia do narzędzia

- W `gra/tools/live-verify-wojownik-map-q1.cjs` pętla ręczna (`if (false) { ... }`) jest nieosiągalna — zostawiona celowo jako ślad; manual kończy się wcześniej blokadą.
- Brak pomiaru ręcznego i brak kontroli obrony = wynik niekompletny względem celu tematu.

## Bramki

- `tsc --noEmit` w `gra/`: EXIT 0.
- Pięć bramek referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test): NIE URUCHOMIONO — `gra/src` nie zmienione (`git diff --stat -- gra/src` puste), więc wynik bramek jest taki jak na bazie c6f28ce7.
- `git diff --stat -- gra/src`: pusty (zakaz allowlisty spełniony).

## Pliki

- `gra/tools/live-verify-wojownik-map-q1.cjs` (nowy, driver ścieżki mapowej)
- `dyspozycje/autobot/runs/R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1/evidence-wojownik-map-r4.json` (wyniki 3 ziaren x auto/skip/manual, błędy BLOCK)
- `dyspozycje/autobot/runs/R-WEB-TEST-HOOK-ADDUNIT-TYPE-SELECT-Q1/evidence-wojownik-map-r4-def-negatywny.json` (próba obrony, negatywna)

## Ograniczenia pomiaru (jawnie)

- n_efektywne = 1 (ziarna nie zmieniają wyniku); nie ma rozrzutu do raportowania.
- Strona atakująca tylko; obrona nie zmierzona.
- Ręczny nie zmierzony (bramka dowódcy).
- Pomiar w Chromium headless (`/usr/bin/chromium`), swiftshader; renderowanie mapy i sceny bitwy wyłączone na czas pomiaru (jak r3).

RUNDY: 3/5 (ten dispatch: r4 wg FC; poprzednie: r1 FAIL brak tabeli, r2 FAIL pomiar przez przepisanie statystyk)
NASTĘPNY KROK: orkiestrator decyduje: (a) dowódca gracza w stosie pomiarowym (osobny temat, dotyka mechaniki generałów) albo (b) zgoda na zmianę bramki ręcznej dla testu (poza zakresem tego tematu) — oraz (c) ewentualnie pomiar obrony innym sposobem (poza zakresem haka).
DEPLOY/PUSH: NIE WYKONANO
