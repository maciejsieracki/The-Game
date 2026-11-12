# R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3 — obrona Operatora (runda 2, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME-TEST (zmiany wyłącznie w gra/tools/*-test.cjs; zero zmian w gra/src, JSON, WERSJE.md, rust-port)
TEMAT: R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3
GOAL: dług testowy z FAL 651–658. Dla każdego testu: wynik, klasyfikacja (nieaktualny test | realny defekt | timeout środowiska), poprawka tylko przy klasyfikacji „nieaktualny test", bez osłabiania asercji.
BAZA: fc88effc126cd8b83a70c182b33a83d5fa4fb93d (kandydat z dispatchu, detached HEAD w worktree).
ALLOWLISTA (ta runda): gra/tools/praca-jeden-podzial-kontrakt-test.cjs, gra/tools/battle-attack-move-pointer-test.cjs, dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3/30-obrona-claude.md.
ŚRODOWISKO: gra/ npm ci --ignore-scripts (exit 0). Brak npm run build/dev. Dysk „/" 3,9 GB wolne przed startem (poniżej progu 4 GB z CLAUDE.md dla web, uwaga dla orkiestratora). Load average w trakcie 7–16.

## ZMIANY / COMMIT
- SHA kodu rundy 2: patrz pole `sha` w StructuredOutput (commit zawiera dwa pliki testów i ten raport; SHA ustalony po commicie).
- gra/tools/praca-jeden-podzial-kontrakt-test.cjs: kontrola negatywna „przyrost" (blok 7b) zmieniona z `eq(ulepszeniaAuto, 0)` na inwariant mechanizmu: picker NIE przekracza capu w żadnej turze (`przekroczenia === 0`). Dodane pole `maxAutoWTurze` w `przepuscTury`. Uzasadnienie w komentarzu w kodzie (patrz ODPOWIEDŹ NA ZARZUT 2).
- gra/tools/battle-attack-move-pointer-test.cjs: serwer testowy zwracał `index.html` na KAŻDY URL (stąd „Unexpected token '<'"). Zastąpiony statycznym serwerem plików z `out/` z MIME. Zmiana wyłącznie harnessu; asercje bez zmian.
- Brak zmian w gra/src (zweryfikowane `git status`: tylko 2 pliki M).
- Plik tymczasowy mutacji (src/battle/battleScene.ts) cofnięty `git checkout --` (po mutacji `git status` czysty w src).

## ODPOWIEDŹ NA ZARZUTY EVALUATORA

**Zarzut 1 (hint-toast-zindex: zielony status NIE_ZMIERZONO) — PRZYJMUJĘ, dowód.**
Ponowny pomiar z limitem 580 s: `node tools/hint-toast-zindex-empire-panel-test.cjs` → EXIT 0, czas 4 min 43 s, wynik `18 pass · 0 fail` (surowe wyjście: 18 linii `OK`, 0 linii FAIL). Load average w chwili startu 7,65. Poprzednie exit 124 zgadza się z przeciążeniem maszyny (load ~17); nie odtworzone w tym przebiegu. Statyczne sprawdzenia Evaluatora (regex 4, FIXED_ZINDEX_LINE 1x, BROKEN 0x) potwierdzone w pliku: linie 104–105.

**Zarzut 2 (5 testów bez klasyfikacji końcowej) — PRZYJMUJĘ, klasyfikacje poniżej.**
- praca-jeden-podzial-kontrakt-test — **nieaktualny test (przesłanka)**. Dowód: data/terrain-improvements.json zawiera pozycje `koszt_praca` 2,5 (Wycinka), 15, 18, 20; test zakładał „najtańsze kosztuje 30+". Picker honoruje cap: src/game/auto-improvements.ts:904 (`totalBudget`) i :1323 (`imperiumBudgetCap`), więc przy `improvementBudgetCap = przyrost tury` zakupy są możliwe i zero nie jest właściwym kryterium. Po poprawce: `637 OK, 0 FAIL` (surowe wyjście: `--- praca-jeden-podzial-kontrakt-test: 637 OK, 0 FAIL ---`, EXIT 0, 3 s). UWAGA dla FC: forma asercji się zmieniła (z „zero" na „brak przekroczeń capu w każdej turze") — FC ma ocenić, czy to nie jest osłabienie; uzasadnienie: stara asercja sprawdzała założenie o cenach, które już nie obowiązuje, a nowa sprawdza sam mechanizm, który kontrola ma chronić.
- battle-attack-move-pointer-test — **NIE ROZSTRZYGNIĘTE (częściowo naprawiony harness)**. Przed poprawką: `Unexpected token '<'` (serwer zwracał HTML dla modułów). Po poprawce: bitwa się otwiera (`battle:open:complete`, jedyny błąd strony: 404 jednego zasobu), a następnie `locator.click` na `#player-roster-bar [data-unit-id="atk0"]` timeoutuje 30 s; call log: „locator resolved", „element is visible, enabled and stable", „done scrolling", bez „performing click" — czyli główny wątek strony nie odpowiada. Diagnostyka strony też timeoutuje („diagnostic page sample timed out after 3000ms"). Wynik: EXIT 1, czas 2 min 45 s. Nie dowiedziono defektu gry ani przyczyny w teście; klasyfikacja: timeout środowiska / do zbadania.
- battle-natural-chariot-r5-test — **NIE ROZSTRZYGNIĘTE**. Dowód: `waiting for locator('button[data-deploy-main-btn="lines"]')` → resolved → „waiting for element to be visible, enabled and stable" przez 30 s bez stabilizacji (po „attempting click action"). Możliwa przyczyna: ciągła animacja/re-render przycisku pod obciążeniem, ale NIE zbadano. EXIT 2, czas 1 min 25 s. Brak poprawki (nie ma dowodu „nieaktualnego testu").
- battle-ranged-approach-regression-test — **timeout środowiska (nieudowodnione w pełni)**. Dowód: `activation timeout atk/infantry/aggressive/1`. Ten timeout to 12 s zegar przeglądarki (tools/battle-ranged-approach-browser-entry.ts, ~linia 203) czekający na zakończenie aktywacji jednostki; pod load ~14 nie zdąża. Całkowity czas 5 min 33 s, EXIT 1. Brak poprawki.
- sidepanel-hud-deadzone-test — **timeout limitu 110 s za krótki (wynik zielony)**. Dowód: EXIT 0, `43 pass · 0 fail`, czas całkowity 5 min 31 s (331 s), load ~13,5. Dispatch podaje limit 110 s, który jest za krótki na tę maszynę.

Realny defekt gry: NIE wykazany dla żadnego z pięciu testów (żaden nie ma dowodu z zachowaniem gry). Nie otwieram osobnego tematu z dowodem defektu; proponuję dwa tematy diagnostyczne do decyzji orkiestratora (patrz NASTĘPNY KROK).

**Zarzut 3 (brak dowodu mutacyjnego) — CZĘŚCIOWO PRZYJMUJĘ.**
- battle-dead-unit-disappearance-test — WYKONANA mutacja: w `_startRout` dodano `this.occByKey.delete(cellKey(ru.q, ru.r))` (zwolnienie pola uciekiniera). Wynik: `AssertionError [ERR_ASSERTION]: routed unit keeps its tile occupied until it flees`, EXIT 1. Po `git checkout -- src/battle/battleScene.ts` bazowy przebieg: EXIT 0, „PASS — killed unit detached immediately; routed unit still flees visibly".
- grupy-budynkow, mgla-sciezka-inwariant, pre-battle-save — mutacji NIE wykonano w tej rundzie: NIE_ZMIERZONO (czas/zasoby; pre-battle-save wymaga pełnego buildu esbuild z shimami).

**Zarzut 4 (brak SHA w raporcie Operatora; pięć bramek nieuruchomionych) — PRZYJMUJĘ, uzupełnione.**
SHA kandydata: fc88effc126cd8b83a70c182b33a83d5fa4fb93d. Bramki uruchomione przeze mnie na tym kodzie (surowe wyjście):
- `npx tsc --noEmit` → EXIT 0, 0 linii wyjścia.
- logic-test → `LOGIC OK (213/213)`, EXIT 0.
- tech-tree-test → `tech-tree-test: 20 pass, 0 fail`, EXIT 0.
- research-test → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, EXIT 0.
- unit-replace-test → `WSZYSTKIE TESTY ZIELONE (21/21)`, EXIT 0.
- combat-test → `All sanity checks passed.`, EXIT 0.

**Zarzut 5 (shim esbuild w pre-battle-save-test) — ODRZUCAM ryzyko, z dowodem.**
Test nie asertuje portretów: `grep -n "portret|portrait|import.meta.glob" tools/pre-battle-save-test.cjs` zwraca tylko komentarz i sam shim (linie 26, 39). Shim zastępuje `import.meta.glob(` w src/*.ts pustą mapą wyłącznie w buildzie testowym; asercje dotyczą zapisu, a nie ładowania obrazów. Ryzyko „maskowania portretów" nie dotyczy asercji tego testu. Bez zmian w pliku.

**Zarzut 6 (komentarz grupy: nie wskazano, który budynek dał +1) — NIE ROZSTRZYGNIĘTE, bez zmiany.**
Hipoteza Evaluatora (łańcuch fortyfikacji 0bf194d76) NIE jest potwierdzona: `git show 0bf194d76 -- gra/data/buildings.json` nie dodaje żadnej linii z `"id"`/`"nazwa"`/`"grupa"`. Grupa „Wojsko i obrona" w data/buildings.json ma 8 pozycji (palisada, mury_kamienne, mury, koszary, fort, baszta, warsztat_oblezniczy, akademia_wojskowa), ale nie ustaliłem, która jest nowa. Komentarz pozostaje bez zmiany; tożsamość oznaczam jako NIE_ZMIERZONO dla FC.

**Zarzut 7 (mgla: test nie egzekwuje zakresu kopii sim/pos) — ODRZUCAM w tym temacie.**
Zakres R-WEB-TEST-DEBT-Q3 to klasyfikacja i naprawa długu, a nie nowy inwariant. Brak egzekucji zakresu kopii to luka pokrycia, nie czerwień testu i nie został wskazany jako błąd. Zapisuję jako obserwację do osobnego tematu, bez zmian w mgla-test.

## TESTY (rund 2, surowe wyniki)
- praca-jeden-podzial-kontrakt-test: `637 OK, 0 FAIL`, EXIT 0.
- battle-attack-move-pointer-test: EXIT 1 (`locator.click: Timeout 30000ms`, roster card), czas 2 min 45 s.
- battle-natural-chariot-r5-test: EXIT 2 (`R5_FAIL locator.click: Timeout 30000ms`, „not stable"), czas 1 min 25 s.
- battle-ranged-approach-regression-test: EXIT 1 (`activation timeout atk/infantry/aggressive/1`), czas 5 min 33 s.
- sidepanel-hud-deadzone-test: `43 pass · 0 fail`, EXIT 0, czas 5 min 31 s.
- hint-toast-zindex-empire-panel-test: `18 pass · 0 fail`, EXIT 0, czas 4 min 43 s.
- battle-dead-unit-disappearance-test: baza EXIT 0 (PASS); pod mutacją EXIT 1 (AssertionError).
- tsc i 5 bramek referencyjnych: jak w ODPOWIEDZI NA ZARZUT 4 (wszystkie zielone).

## KLASYFIKACJA KOŃCOWA (rozszerzona tabela)

| Test | Baza (fc88effc1) | Po rundzie 2 | Klasyfikacja |
|---|---|---|---|
| praca-jeden-podzial-kontrakt | 635 OK / 2 FAIL | 637 OK / 0 FAIL | nieaktualny test (przesłanka: ceny; uwaga FC o formie asercji) |
| battle-attack-move-pointer | FAIL (Unexpected token '<') | EXIT 1: click roster, page nieresponsywna | harness naprawiony; reszta NIE ROZSTRZYGNIĘTE / timeout środowiska |
| battle-natural-chariot-r5 | FAIL (click, not stable) | EXIT 2, to samo | NIE ROZSTRZYGNIĘTE |
| battle-ranged-approach-regression | FAIL (activation timeout 12 s) | EXIT 1, to samo | timeout środowiska (nieudowodnione w pełni) |
| sidepanel-hud-deadzone | timeout 110 s | exit 0, 43/0, 331 s | timeout limitu (wynik zielony) |
| hint-toast-zindex-empire-panel | exit 124 (570 s) | exit 0, 18/0, 4 min 43 s | timeout środowiska w poprzedniej rundzie; zielony |

## BLOKADY
1. Nierozstrzygnięte bez defektu/dowodu: battle-attack-move-pointer (po naprawie harnessu nadal click nie wykonuje się), battle-natural-chariot-r5 (not stable), battle-ranged-approach-regression (12 s timer pod load).
2. Mutacje NIE wykonane: grupy-budynkow, mgla-sciezka-inwariant, pre-battle-save.
3. Tożsamość +1 budynku w grupie „Wojsko i obrona" — NIE_ZMIERZONO.
4. Dysk przed startem 3,9 GB < 4 GB (próg CLAUDE.md dla web); nie wpłynęło na wynik, odnotowane.
5. Testy bitew (battle-*) uruchamiane pojedynczo, zgodnie z dispatchem; nie dotykałem gra/src/battle.

## ZAŁOŻENIA (luki rozstrzygnięte założeniem)
- Zmiana formy kontroli „przyrost" w praca-jeden: uznana za korektę nieaktualnej przesłanki, nie za osłabienie (FC ma to zweryfikować).
- Przyczyna „Unexpected token '<'" w battle-attack-move-pointer: serwer zwracający index.html dla każdego URL (wzorzec nieobecny w siostrzanych testach, które serwują plik po ścieżce).

## RUNDY
2/5 (runda 1 = Operator; runda 2 = ta obrona, bez poprawek kodu gry).

## NASTĘPNY KROK
- Evaluator/FC: ponowna weryfikacja praca-jeden (forma kontroli) i battle-attack-move-pointer (harness).
- Orkiestrator do decyzji: osobne tematy diagnostyczne (BEZ pushu z tej sesji): (a) zbadać, dlaczego główny wątek strony przestaje odpowiadać przy bitwie pod obciążeniem (battle-attack-move-pointer, battle-ranged-approach); (b) wyjaśnić „not stable" przycisku w battle-natural-chariot-r5; (c) mutacje dla grupy/mgla/pre-battle-save.
- Obserwacja (bez tematu): mgla-test nie egzekwuje zakresu kopii sim/pos.

DEPLOY/PUSH: NIE WYKONANO
