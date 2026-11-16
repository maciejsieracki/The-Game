# R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 — raport Operatora, runda 3/5

STATUS: BLOCK (częściowo; zarzuty FC 1, 2, 3 i 5 zamknięte w kodzie i testach; pomiary Node i Chromium NIE ZMIERZONO; bramka `load-game-blockers-exec-test` czerwona, przyczyna nie zbadana)
DOMAIN: GAME (dyplomacja / zmęczenie wojną)
TEMAT: R-WEB-DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1
GOAL: 40 tur do 100%, 50/80/100% z parametrów, pokój wymuszony przy 100% opłacany miastami przegrywającego, widok etapów i „za ile tur”, testy zielone bez osłabiania asercji.

## Baza i merge
- Start: `e928c02b1d76f46fceb18bc58129833be131d2c1` (kandydat r2), `git checkout --detach`.
- `git merge origin/main` (`fadf21af9`, FALA 782) — konflikty: brak. Merge commit: `91a441381`.
- Sprawdzenie: `git merge-base --is-ancestor fadf21af9 HEAD` → OK (ancestor).
- Uwaga: dispatch wskazuje `dyspozycje/.../00-dispatch.md` na `origin/main`; w `origin/main` pliku nie ma, jest tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Czytany stamtąd.

## ZMIANY/COMMIT
Commit kodu i raportu: patrz sekcja „SHA” w odpowiedzi StructuredOutput (czubek gałęzi). Pliki zmienione w tej rundzie:
- `gra/src/game/war-weariness-view.ts` — nowe czyste funkcje: `warWearinessStagesPl` (etapy 50/80/100% z `progChetnosci`, `progKoncaZmeczenia`, `progWymuszonyPokoj`), `warWearinessTurnsToLevel` (= ceil((cel − poziom) × pelneTur)), `warWearinessNextStagePl` (podpowiedź „Za N tur: X% — …”).
- `gra/src/game/diplomacy-display.ts` — tooltip „Zmęczenie wojną” dopisuje `warWearinessNextStagePl(view.zmeczenie)` (import z `war-weariness-view`).
- `gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs` — zregresja 1 (FC): przeskalowane do 40 tur. h6 (32 tury = 0,80) → słabsza AI oferuje miasto za pokój, bez pokoju bezwarunkowego; h6b (40 tur) → brak bezwarunkowego; h5b (32 tury) → silniejsza AI nic nie oferuje. Stare asercje „bezwarunkowy koniec przy 30 turach” były na skali 20 tur. Wynik 35/0 (było 32/3).
- `gra/tools/diplomacy-city-cession-r3-test.cjs` — regresja 1 (FC): „oddanie 2 miasta przy zmęczeniu” podaje 20 tur (= 0,5 na skali 40; 10 tur = 0,25 poniżej progu). „żądanie: tury 20” przepisane na nowe zachowanie (warunek 20 tur jest żywy na skali 40, bez bezwarunkowego końca) — asercja odwrócona z NIE na ŻĄDA z uzasadnieniem w komentarzu. Wynik 72/0 (było 70/2).
- `gra/tools/diplo-war-peace-profile-unit-test.cjs` — poza listą FC, wykryte w przebiegu: „sygnał e” na skali 20 tur (8 tur = 0,4). Przeskalowane do 16/40 tur; `sygnał e NIE` przy 15/40 sprawdza brak sygnału `e` (nie `wantsPeace`, bo inne sygnały też mogą dawać `wantsPeace`). Wynik 198/0 (było 197/1).
- `gra/tools/diplo-civpedia-values-test.cjs` — asercja `pelneTur === 20` → `40` (stała w wiki/Civpedii już 40; test był stary). 129/129.
- NOWY `gra/tools/diplo-weariness-stages-view-test.cjs` — 13 asercji: etapy 50/80/100 z parametrów, tury do progu (0→100% = 40; 50→80% = 12; 0,99→100% = 1), podpowiedź „Za 12 tur: 50%”, panel etykiety. MUTACJA: `ceil` → `floor` w `warWearinessTurnsToLevel` ⇒ czerwono (tr4 FAIL), przywrócono, zielono.
- NOWY `gra/tools/diplo-weariness-forced-peace-wiring-test.cjs` — test WIRINGU na realnym `runWarWearinessTick` (war-weariness.ts) i realnym `planEscalatedPeacePayment`: (a) 100% → pokój wymuszony, przegrywający gracz oddaje 3 miasta za 300 PW; (b) stolica c0 nigdy, zostaje ≥ minMiastPoOddaniu=3; (c) battlePending → odroczenie, brak pay/finalize; (d) cena 0 → pokój bez miast; (e) 80% (32 tury) → nie pokój wymuszony; (f) gracz wygrywa, AI płaci 3 miasta. Wynik 13/0. MUTACJA: usunięcie bramki `battlePending` ⇒ c1 FAIL (czerwono), przywrócono (cmp `diff -q` identyczny).

Nie zmieniano: `war-weariness.ts`, `war-weariness-params.json`, `ai.ts`, `main.ts`, `diplomacyAudience.ts`, `battleScene.ts`. Waga miasta (+10%) i stolica/min. 3 miasta — bez zmian (CZEKA NA RANO wg dispatchu; ZAŁOŻENIE: zachowane).

## Lista deployu (nowe i zmienione testy)
Zmienione: `diplo-peace-weaker-seeks-city-only-test.cjs`, `diplomacy-city-cession-r3-test.cjs`, `diplo-war-peace-profile-unit-test.cjs`, `diplo-civpedia-values-test.cjs`.
Nowe: `diplo-weariness-stages-view-test.cjs`, `diplo-weariness-forced-peace-wiring-test.cjs`.

## TESTY
Bramki referencyjne (surowe wyjście, uruchomione w worktree po merge):
- `node tools/logic-test.cjs` → exit 0 (`PASS [213] cityfix: pop1 territory radius is 5`)
- `node tools/tech-tree-test.cjs` → `20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → exit 0 (`cross-type melee matrix passes for all 15 civilizations`)
- `node tools/combat-test.cjs` → exit 0 (`All sanity checks passed.`)
- `npx tsc --noEmit` (gra/) → exit 0, 0 linii wyjścia

Zmęczenie wojną / pokój (Node):
- diplo-peace-weaker-seeks-city-only-test → 35 pass / 0 fail
- diplomacy-city-cession-r3-test → 72 pass / 0 fail
- diplo-war-peace-profile-unit-test → 198 pass / 0 fail
- diplo-civpedia-values-test → 129 sprawdzeń, exit 0
- diplo-weariness-stages-view-test (nowy) → 13 / 0
- diplo-weariness-forced-peace-wiring-test (nowy) → 13 / 0
- diplo-weariness-display-test → ALL PASSED (52/0)
- diplo-weariness-pw-behavior-test → 147 / 0
- diplo-peace-balance-accept-test → 32 / 0
- diplo-war-peace-main-guard-test → 35 / 0
- diplo-war-peace-sim-test → 25 / 0
- json-descriptions-sync-test → 19 / 0
- diplo-truce-impl-test → exit 0
- diplo-weariness-forced-peace-test, diplo-weariness-20-turns-test, diplo-peace-ai-ai-nonnegative-test, ai-losing-war-asks-peace-vs-player-test, diplo-weariness-as-pw-peace-item-test, diplo-weariness-c615-both-cities-test, diplo-weariness-city-only-test, ai-war-weariness-peace-test → exit 0
- diplo-weariness-migration-peak-test → exit 0. MUTACJA: usunięcie `if (st.peak > level) st.peak = level` ⇒ 4 FAIL (czerwono); przywrócono, zielono.
- diplo-weariness-unconditional-end-test — NIE ISTNIEJE w drzewie (zastąpiony przez `diplo-weariness-forced-peace-test`, zielony; zgodnie z zarzutem 3 FC).

Determinizm / load:
- determinism-same-seed-test → WYNIK: PASS
- determinism-save-load-resume-test → WYNIK: PASS
- determinism-digest-stackgroup-test → PASS
- load-game-blockers-exec-test → CZERWONY: `ReferenceError: resetEmpireRecruitPanelSession is not defined`. Symbol jest zdefiniowany w `gra/src/ui/empireRecruitPanel.ts:416` i importowany w `main.ts:748`. Ta runda nie zmienia ani `main.ts`, ani `empireRecruitPanel.ts` (zmienione pliki: patrz wyżej). NIE ZBADANO, czy test jest czerwony już na `fadf21af9`/`e928c02b1` — do weryfikacji przez FC na bazie.

Nie wykonano (NIE ZMIERZONO):
- Pomiar symulacji ≥3 ziarna × ≥150 tur (AI↔AI: wojny, pokoje wymuszone, miasta, eliminacje, snowball). Powód: brak czasu w tej rundzie; harness `civTest` / `ai-economy-measure-run` nie uruchamiany. Do zrobienia w następnej rundzie albo jako osobny pomiar.
- Chromium 1280×720 (okno gracza, panel etapów). NIE ZMIERZONO. Okno `showForcedPeaceModal` i wpis „Ważne” nie są pokryte w Node (DOM).
- `war-weariness-view.ts` — test panelu (`diplo-weariness-stages-view-test`) sprawdza czyste funkcje i tekst tooltipa, nie rendering DOM.

## BLOKADY
1. Czerwona bramka `load-game-blockers-exec-test` (ReferenceError) — przyczyna nieustalona, poza zakresem zmienionych plików. Wymaga decyzji FC: czy czerwona już na bazie.
2. Pomiary Node ≥3×150 i Chromium — NIE ZMIERZONO (patrz wyżej).
3. Waga miasta 10% przy 40 turach ≈ 4 tury przyspieszenia na miasto zamiast ≈2 — zgłoszone, nie zmieniane (dispatch: CZEKA NA RANO).

## ZAŁOŻENIA (do potwierdzenia)
- Test zmian dyplomacji przy 80%: wynik to istniejąca eskalacja oferty (`offer_accepted` z miastem wg planu), nie pokój wymuszony. Asercja: brak `forced_peace` i brak stolicy w planie.
- Pokój wymuszony przy battlePending jest odroczony na następną turę (zatwierdzone w DODATKU 2); w tym tesie nie zmieniano tej logiki.

## RUNDY
3/5 (po FC FAIL r2). Poprzednie: r1 (FC FAIL: 11 testów czerwonych), r2 (FC FAIL: 2 regresje testów, brak widoku, brak testu wiringu, brak pomiarów).

## UWAGI-DLA-ORKIESTRATORA
- Dispatch r3 nie wskazuje znaleziska poza zakresem; zauważone: `load-game-blockers-exec-test` (patrz BLOKADY 1).
- Katalog `gra/node_modules` zainstalowany przez `npm ci` w worktree (nieśledzony, ignorowany). Do sprzątania po temacie.
- Nie wykonano `npm run build` ani `dev` (zakaz z R-PROC-AUTOBOT §9).

## NASTĘPNY KROK
FC r3: weryfikacja zmian (diff: 6 plików zmienionych + 2 nowe), decyzja o `load-game-blockers-exec-test` (baza vs gałąź), zlecenie pomiarów Node (≥3 ziarna × ≥150 tur) i Chromium jako osobnego kroku przed READY_FOR_DEPLOY.

DEPLOY/PUSH: NIE WYKONANO
