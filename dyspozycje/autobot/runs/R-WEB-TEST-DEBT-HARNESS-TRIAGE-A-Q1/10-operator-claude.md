# R-WEB-TEST-DEBT-HARNESS-TRIAGE-A-Q1 — Operator (runda 1/5, Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS (tylko `gra/tools`; `gra/src` i `gra/data` nietknięte — `git diff origin/main -- gra/src gra/data` = 0 linii)
TEMAT: R-WEB-TEST-DEBT-HARNESS-TRIAGE-A-Q1 (pierwsza połowa posortowanej listy 18 testów z kodem 1, bez `budynek-garnizon-test`)
GOAL: dla każdego testu ze swojej części: klasa + dowód + akcja; naprawa (a)/(c) w `gra/tools`; (b)/(e) tylko opisane.
BAZA: `d59bd7a5a` (= origin/main, `git merge-base --is-ancestor` potwierdzone)
DISPATCH: `00-dispatch.md` z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (na `origin/main` go nie ma)

## Lista i zakres

Testy z kodem 1 w skanie HARNREM (`30-obrona-claude.md`, „Lista 131 harnessów”), bez `budynek-garnizon-test`, posortowane — 18 pozycji; moja część = pierwsze 9:

1. building-resource-visibility-ui-test
2. city-defense-terrain-gate-test
3. empire-army-city-recruit-no-inner-scroll-test
4. entity-card-action-buttons-real-render-test
5. entitycard-rozwiniete-scrollbar-real-render-test
6. entitycard-sufit-dwoch-kart-test
7. general-capital-recruitment-order-test
8. idb-menu-continue-boot-refresh-test
9. ids-leak-audit-test

Pozycje 10–18 listy (od `march-resume-next-turn-test` do `tech-discovery-badge-diorama-test`) należą do TRIAGE-B i nie były dotykane.

Środowisko: `npm ci` w `gra/` (71 pakietów); `xvfb-run` dostępny (`/usr/bin/xvfb-run`). Testy Chromium uruchamiane przez `xvfb-run -a`, pozostałe `node`. Logi w `/tmp/op-*.log`.

## Tabela triage

| # | Test | Pierwszy czerwony komunikat (przed) | Klasa | Dowód | Akcja | Wynik po |
|---|---|---|---|---|---|---|
| 1 | building-resource-visibility-ui-test | `FAIL: P4: pozycja bez blokady nadal wybieralna -- []` | (a) przestarzały fixture | `git log -S'moneyCost'` → `a70768498` (2026-11-09): bramka `affordable = opts.skarb >= o.moneyCost`; fixture podawał tylko `surcharge`, więc `100 >= undefined` = false, pozycja wyszarzona, klik ignorowany | dodano `moneyCost: 0` do fixture dwóch pozycji modala | 8 pass / 0 fail (było 7/1) |
| 2 | city-defense-terrain-gate-test | `[FAIL] KONTROLA (b): hitChanceTw(atak, Obrona*(1+Razem/100)) (35%) == resolveCombat z override (36%)` | (a) przestarzała asercja | `17be3f180` (2026-11-10, R-WEB-BATTLE-RANGED-DAMAGE-MULT): `rangedShotAccuracy = max(wręcz, dystansowy)` w ścieżce `Dyst-ATK` (combat.ts:1038); test liczył z `meleeAttack` Łucznika | kontrolę liczy z `Math.max(meleeAttack, missileAttack)` (ta sama reguła co silnik) | 34 pass / 0 fail (było 33/1) |
| 3 | empire-army-city-recruit-no-inner-scroll-test | `FAIL: [900px] precondition: więcej pozycji niż limit wewnętrznego suwaka (>8) -- 6` (i 360px) | (c) fixture | fixture nie ustawia `getCivKey` → `civUnitNacja` = undefined → jednostki narodowe odrzucone (`unitAllowedForCivNation`), zostaje 6 generycznych; probe: `rzymianie`=8, `chinczycy`=7, `grecy`/`inkowie`/`zulusi`=8, `egipt`/`sumer`=9 | dodano `getCivKey: () => 'egipt'` (9 wierszy > 8; asercja bez zmian) | 16 pass / 0 fail (było 14/2) |
| 4 | entity-card-action-buttons-real-render-test | `FAIL: (D) elementFromPoint na środku przycisku w żywym popupie trafia w SAM PRZYCISK — {"calls":1,"hitTag":null,…}` | (a) przestarzały pomiar | probe: `rect.top=1685`, viewport 950; `.entity-card` ma `overflow:auto` (świadome, komentarz `techDiscoveryNotice.ts` ~l.694–700: treść przewija się WEWNĄTRZ karty); przycisk poza viewportem → `elementFromPoint` = null | przed hit-testem `live.scrollIntoView({block:'center'})`; klik i mutacja (E) bez zmian | 31 pass / 0 fail (było 30/1) |
| 5 | entitycard-rozwiniete-scrollbar-real-render-test | exit 1: `Failed to connect to the bus … /run/dbus/system_bus_socket` (bez wyświetlacza) | (d) ŚRODOWISKO | z `xvfb-run -a`: exit 0, `29 pass, 0 fail`; bez xvfb: exit 1 wyłącznie przez dbus | brak zmian w kodzie testu | 29 pass / 0 fail pod xvfb |
| 6 | entitycard-sufit-dwoch-kart-test | `FAIL: (K1) ROZMIAR karty wierzchniej NIETKNIETY … szerokosc 660 (+0..2px)` (rA.width=670) + 8× K4 | (a) przestarzała geometria | `fb10a248a` (2026-09-07, „trwały pasek przewijania”): `.entity-card-dialog{scrollbar-gutter:stable}` poszerza prostokąt dialogu o gutter; ostatnia edycja testu 2026-09-05 (`ec8b2e8e0`); karta `.entity-card` ma `border-box`, width 660 (probe) | szerokość 660 mierzona na `.entity-card` (`cardWidth`); równość A==B i wysokość 720 nadal na dialogu | 67 pass / 0 fail (było 58/9) |
| 7 | general-capital-recruitment-order-test | `unexpected error: ReferenceError: hexHasRoomFor is not defined` (po wcześniejszym PASS) | (c) fixture — **CZĘŚCIOWO** | `purchaseRecruitmentUnit` (main.ts) wola `hexHasRoomFor`, `armyStackLimit`, `superUnitLimitViolation`, `reservedUnitTypeNamesForOwner`, `SUPER_UNIT_LIMIT_BLOCK_PL` (B41876183, 421010fa1, 2026-11-07); lista `names` testu ich nie miała | dopięto je wzorem `recruitment-batch-contract-test.cjs` (prawdziwe `hexHasRoomFor` z `army-stack-limit.ts`, `superUnitLimitViolation` z `production.ts`, stuby `() => 120`, `() => new Set()`) | **nadal 1 błąd**: `ReferenceError: effectiveGameDifficultyForOwner is not defined`; kolejne zależności (`productionAvailabilityCtxForCity`, `unlockedTechsForOwner`, `validateRecruitGeneral`, `recruitGeneralLabel`) — FAIL |
| 8 | idb-menu-continue-boot-refresh-test | `FAIL: hasAnySaveSlot(): \`void refreshHasAnySaveSlotCache();\` gołe … ` | (a) przestarzała kotwica ekstrakcji | `8b522e8f6` (2026-10-24) usunęło `cachedHasAnySaveSlot`; `hasAnySaveSlot()` ma teraz `return savePresence.get();`; `indexOf('return cachedHasAnySaveSlot;')` = -1 → wycinek pusty; sama intencja (bez `.then`) w kodzie jest spełniona | kotwica zmieniona na `return savePresence.get();` (l.158) | 32 pass / 0 fail (było 31/1) |
| 9 | ids-leak-audit-test | `FAIL encyklopedia pojecia/skad-zapasy.wikiM: snake_case w backtickach`; `FAIL encyklopedia pojecia/zaufanie.wikiM: snake_case w backtickach` | (b)/(e) BŁĄD TREŚCI — poza allowlistą | treść wiki pokazuje gołe klucze konfiguracji: `ksiega_zasobow_tury` (`pojecia/skad-zapasy`, commit `6168bc2c6`, 2026-11-15; „parametr `ksiega_zasobow_tury` w `econ-params.json`”), `dobra_wola_tur` (`pojecia/zaufanie`, commit `119251ae4`, 2026-11-13). Test słusznie traktuje to jako wyciek surowego id do tekstu gracza | **nie zmieniano**: poprawka wymaga edycji źródła wiki i regeneracji `gra/src/data/wikiBundle.json` (`src/**` zakazane w tym temacie); osłabienie reguły testu bez decyzji = zakazane | 1723 ok / 2 FAIL (bez zmian) |

Pomiary: przed zmianami każdy z testów 1–8 był czerwony na pierwszym cytowanym komunikacie (surowe wyjścia w `/tmp/op-r1-*.log`); po zmianach zielony (`/tmp/op-post-*.log`).

## Dowody naprawionych testów (a)/(c)

- Mutacja cofnięcia poprawki = przywrócenie oryginalnej linii testu; dla testów 1, 2, 3, 6, 8 oryginalny stan jest czerwony (zmierzone powyżej), więc test po naprawie jest czuły na tę samą regresję. Mutacji w `gra/src` NIE wykonywano (zakaz).
- Test 4 zachowuje własną mutację (E) — po zmianie: `31 pass`, w tym (E) „mutacja: primary WRACA do natywnego wyglądu”.
- Asercje nie zostały osłabione: test 2 nadal porównuje dokładną równość trafienia (`===`); test 3 ma nadal `>8`; test 6 nadal wymaga równości A==B co do piksela i wysokości 720; test 8 nadal ma strażnika regresji `.then`.

## Bramki referencyjne (surowe wyniki, po wszystkich zmianach)

- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0, 0 linii wyjścia
- `logic-test` → exit 0, `LOGIC OK (213/213)`
- `tech-tree-test` → exit 0, `tech-tree-test: 20 pass, 0 fail`
- `research-test` → exit 0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `unit-replace-test` → exit 0, `WSZYSTKIE TESTY ZIELONE (21/21)`
- `combat-test` → exit 0, `All sanity checks passed.`
- `git diff origin/main -- gra/src gra/data` → 0 linii; `git diff --check` → czysto

## ZMIANY/COMMIT

Zmienione (tylko `gra/tools`): `building-resource-visibility-ui-test.cjs`, `city-defense-terrain-gate-test.cjs`, `empire-army-city-recruit-no-inner-scroll-test.cjs`, `entity-card-action-buttons-real-render-test.cjs`, `entitycard-sufit-dwoch-kart-test.cjs`, `general-capital-recruitment-order-test.cjs` (częściowo), `idb-menu-continue-boot-refresh-test.cjs`; raport `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-HARNESS-TRIAGE-A-Q1/10-operator-claude.md`. SHA: patrz pole `sha` w odpowiedzi (czubek brancha po commicie).

## TESTY

Zielone po zmianie: 1 (8/0), 2 (34/0), 3 (16/0), 4 (31/0), 6 (67/0), 8 (32/0); 5 zielony pod `xvfb-run` (29/0). Czerwone: 7 (ReferenceError, częściowo naprawiony), 9 (decyzja, bez zmian).

## BLOKADY

- Test 7 (`general-capital-recruitment-order-test`): loader wycinający `purchaseRecruitmentUnit` z main.ts wymaga kolejnych helperów (`effectiveGameDifficultyForOwner` i co najmniej kilku kolejnych). Naprawa kompletna wymaga osobnego tematu (lepiej: dedykowany harness z prawdziwym modułem zamiast wycinanego ciała), NIE zrobiona tutaj, żeby nie zgadywać semantyki stubów.
- Test 9 (`ids-leak-audit-test`): naprawa treści wymaga zmiany `gra/src/data/wikiBundle.json` / źródła wiki (poza allowlistą). Decyzja (do orkiestratora/właściciela): (A) zamienić klucze na opis słowny w źródle wiki i zregenerować bundle — rekomendowane; (B) dopuścić klucze konfiguracyjne w backtickach — osłabienie reguły testu, wymaga zgody.
- Test 5 wymaga wyświetlacza: w harnessie zbiorczym trzeba uruchamiać przez `xvfb-run`, inaczej będzie fałszywie czerwony.

## RUNDY

1/5 (Operator, Haiku). Zarzuty Evaluatora: nie było.

## NASTĘPNY KROK

Evaluator (Sonnet): sprawdzić diff 7 plików `gra/tools` (zwłaszcza test 7 — częściowy loader, i test 4 — `scrollIntoView` przed hit-testem), potwierdzić klasy z tabeli, rozstrzygnąć decyzję (A/B) dla testu 9. Orkiestrator: osobny temat dla testu 7 (kompletny loader/harness) i decyzja o treści wiki dla testu 9.

## UWAGI-DLA-ORKIESTRATORA

1. `gra/src/data/wikiBundle.json` zawiera gołe klucze konfiguracyjne w backtickach (`ksiega_zasobow_tury`, `dobra_wola_tur`) — realny wyciek id do tekstu gracza w Civpedii; to nie jest wyłącznie problem testu.
2. Wzorzec „wycinanie ciała `purchaseRecruitmentUnit` z main.ts” jest kruchy: co kilka tematów dochodzą nowe zależności (test 7 i `recruitment-batch-contract-test` wymagały już ręcznego dopinania). Kandydat na osobny temat „harness na prawdziwym module zamiast ekstrakcji z main.ts”.
3. `entitycard-rozwiniete-scrollbar-real-render-test` w harnessie zbiorczym powinien mieć `xvfb-run` (dotyczy też innych testów Chromium z pól „Target closed/dbus”).
4. Poza zakresem nie zmieniano niczego w TRIAGE-B (druga połowa listy).

## DEPLOY/PUSH: NIE WYKONANO
