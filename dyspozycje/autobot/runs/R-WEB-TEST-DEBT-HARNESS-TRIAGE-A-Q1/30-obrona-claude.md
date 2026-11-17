# R-WEB-TEST-DEBT-HARNESS-TRIAGE-A-Q1 — Obrona Operatora (runda 1/5, Haiku)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS (tylko `gra/tools` i raport; `gra/src` i `gra/data` nietknięte)
TEMAT: R-WEB-TEST-DEBT-HARNESS-TRIAGE-A-Q1 (pierwsza połowa posortowanej listy 18 testów z kodem 1, bez `budynek-garnizon-test`)
GOAL: dla każdego testu z części A: klasa + dowód + akcja; naprawa (a)/(c) tylko gdy kompletna; (b)/(e) opisane, bez zmian w src.
BAZA: `d59bd7a5a5e988f3c315d5a4f865dccb9d80a4c4` (origin/main); kandydat Operatora `e172421b9ddaebda038ec498903f7f2b3fc7b054`
SHA PO OBRONIE: patrz pole `sha` w odpowiedzi (czubek brancha po commicie obrony)

## Odpowiedzi na zarzuty Evaluatora (`20-evaluator-claude.md`, report_sha 501c66ec2)

| Nr | Zarzut | Decyzja | Dowód / działanie |
|---|---|---|---|
| 1 | `general-capital-recruitment-order-test` nadal exit 1; częściowy loader ze stubami | **PRZYJMUJĘ** — wycofanie częściowego kodu | `git checkout d59bd7a5a -- gra/tools/general-capital-recruitment-order-test.cjs` (commit obrony). Stuby `() => 120` i `() => new Set()` usunięte, bo to nieuzasadnione założenia semantyczne. Po wycofaniu: `node tools/general-capital-recruitment-order-test.cjs` → exit 1, `unexpected error: page.evaluate: ReferenceError: hexHasRoomFor is not defined` (log `/tmp/ob-t7-base-restored.log`). Klasa: **(c) fixture, NIE ROZSTRZYGNIĘTO** (ta runda nie dokańcza loadera). Zależności wskazane przez Operatora i potwierdzone w `purchaseRecruitmentUnit` (main.ts): `hexHasRoomFor`, `armyStackLimit`, `superUnitLimitViolation`, `reservedUnitTypeNamesForOwner`, `SUPER_UNIT_LIMIT_BLOCK_PL`, następnie `effectiveGameDifficultyForOwner`, `productionAvailabilityCtxForCity`, `unlockedTechsForOwner`, `validateRecruitGeneral`, `recruitGeneralLabel`. Rekomendacja: osobny temat z harnessem na prawdziwym module (patrz UWAGI). |
| 2 | `ids-leak-audit-test` (2 FAIL) to klasa (b)/(e) z decyzją, nie PASS-WITH-NOTES | **PRZYJMUJĘ** — zmiana klasyfikacji | Status części 9 w tej rundzie: **DECISION_REQUIRED**. Wyciek potwierdzony: `ksiega_zasobow_tury` w `docs/encyklopedia/pojecia/skad-zapasy.md` i `dobra_wola_tur` w `pojecia/zaufanie.md`, oba w `gra/src/data/wikiBundle.json`. Test nie zmieniony (osłabienie reguły bez decyzji = zakaz). Opcje dla orkiestratora: (A) rekomendowane — opis słowny w źródle wiki + regeneracja `wikiBundle.json` w osobnym temacie; (B) dopuścić klucze w backtickach — osłabienie testu, wymaga zgody właściciela. Wynik po obronie: `ids-leak-audit-test` → `WYNIK: 1723 ok, 2 FAIL` (bez zmian). |
| 3 | Formalnie: mutacja nie była ponownie uruchomiona na bazie | **PRZYJMUJĘ** — uruchomiono na bazie | Sekcja „Mutacja: wyniki na bazie” poniżej. Wszystkie testy z poprawką dają na `d59bd7a5a` exit 1 na pierwszym cytowanym komunikacie. |
| 4 | `city-defense-terrain-gate-test`: kontrola duplikuje regułę silnika (tautologia częściowa) | **ODRZUCAM** (bez zmiany kodu) | Dowód: `gra/src/game/combat.ts:477` `export function rangedShotAccuracy(meleeAttack, missileAttack) { return Math.max(meleeAttack, missileAttack); }` — ta sama reguła, której używa silnik w `combat.ts:1039` (ścieżka Dyst-ATK) i `:1059`. Test porównuje `expectedHit` (z kopii reguły) z `tacticalResult.atkHitPct` zwróconym przez `resolveCombat`. Test NIE jest tautologią względem silnika: gdyby silnik zmienił regułę (np. na samo `meleeAttack`), `atkHitPct` i `expectedHit` rozjechałyby się i test by wykrył. Dowód czułości: na bazie ta sama asercja daje `[FAIL] KONTROLA (b) ... (35%) == ... (36%)` (`/tmp/ob-base-city-defense-terrain-gate-test.log`). Ryzyko pozostające: reguła jest zdefiniowana w teście i w silniku niezależnie (duplikacja), a nie importowana; import z `.ts` wymagałby loadera esbuild i nie był zrobiony, bo nie jest wymagany dla klasy (a). NIE_ZMIERZONO: czy import z `combat.ts` przechodzi bez dodatkowych zależności. |

## Tabela triage (część A, stan po obronie)

| # | Test | Pierwszy czerwony komunikat (baza `d59bd7a5a`) | Klasa | Dowód | Akcja | Wynik po obronie (kandydat + obrona) |
|---|---|---|---|---|---|---|
| 1 | building-resource-visibility-ui-test | `FAIL: P4: pozycja bez blokady nadal wybieralna -- []` | (a) przestarzały fixture | `git log -S'moneyCost'` → `a70768498`: bramka `opts.skarb >= o.moneyCost`; fixture nie podawał `moneyCost` | dodano `moneyCost: 0` do fixture | zielony: `8 passed, 0 failed` (baza: `7 passed, 1 failed`) |
| 2 | city-defense-terrain-gate-test | `[FAIL] KONTROLA (b): ... (35%) == ... (36%)` | (a) przestarzała asercja | `17be3f180`: `rangedShotAccuracy = max(wręcz, dystansowy)`, `combat.ts:477` | kontrola liczy `Math.max(meleeAttack, missileAttack)` | zielony: `34 pass, 0 fail` (baza: `33 pass, 1 fail`). Patrz zarzut 4 (ODRZUCONY) |
| 3 | empire-army-city-recruit-no-inner-scroll-test | `FAIL: [900px] precondition: ... (>8) -- 6` (i 360px) | (c) fixture | brak `getCivKey` → jednostki narodowe odrzucone | dodano `getCivKey: () => 'egipt'` | zielony: `SUMMARY: 16 PASS / 0 FAIL` (baza: 14/2 wg Operatora) |
| 4 | entity-card-action-buttons-real-render-test | `FAIL: (D) elementFromPoint ... {"calls":1,"hitTag":null}` | (a) przestarzały pomiar | przycisk poza viewportem; `.entity-card` ma `overflow:auto` (świadome) | `scrollIntoView({block:'center'})` przed hit-testem | zielony: `31 pass, 0 fail` (baza: `30 pass, 1 fail`) |
| 5 | entitycard-rozwiniete-scrollbar-real-render-test | exit 1: `Failed to connect to the bus` (bez wyświetlacza) | (d) ŚRODOWISKO | `xvfb-run -a` dostępny (`/usr/bin/xvfb-run`) | brak zmian w kodzie testu | zielony pod `xvfb-run -a`: `29 pass, 0 fail` |
| 6 | entitycard-sufit-dwoch-kart-test | `FAIL: (K1) ROZMIAR karty wierzchniej NIETKNIETY ... szerokosc 660` (rA.width=670) + K4 | (a) przestarzała geometria | `fb10a248a` (`scrollbar-gutter:stable` poszerza dialog o gutter) | szerokość mierzona na `.entity-card` | zielony: `67 pass, 0 fail`. Baza: exit 1, FAIL K1 i K4 (sumy liczby FAIL nie zapisałem: NIE_ZMIERZONO) |
| 7 | general-capital-recruitment-order-test | `ReferenceError: hexHasRoomFor is not defined` | (c) fixture — **NIE ROZSTRZYGNIĘTO** | patrz zarzut 1 | **wycofano** częściowy kod z kandydata (przywrócona wersja z bazy) | czerwony: exit 1, `hexHasRoomFor is not defined` (identyczny z bazą) |
| 8 | idb-menu-continue-boot-refresh-test | `FAIL: hasAnySaveSlot(): \`void refreshHasAnySaveSlotCache();\`` | (a) przestarzała kotwica | `8b522e8f6` usunęło `cachedHasAnySaveSlot` | kotwica → `return savePresence.get();` | zielony: `32 pass, 0 fail` (baza: `31 pass, 1 fail`) |
| 9 | ids-leak-audit-test | `FAIL encyklopedia pojecia/skad-zapasy.wikiM: snake_case w backtickach` (+ zaufanie) | (b)/(e) BŁĄD TREŚCI — **DECISION_REQUIRED** | patrz zarzut 2 | nie zmieniano | `WYNIK: 1723 ok, 2 FAIL` |

Test 5 nie był zmieniany; w harnessie zbiorczym wymaga `xvfb-run`.

## Mutacja: wyniki na bazie (`d59bd7a5a`, uruchomione w tej rundzie)

Pliki testów z bazy przywrócone tymczasowo (`git checkout d59bd7a5a -- <plik>`), uruchomione, potem przywrócone do wersji kandydata (`git checkout e172421b9 -- <plik>`).

| Test | Wynik na bazie (exit / linia) |
|---|---|
| building-resource-visibility-ui-test | exit 1; `FAIL: P4 ... -- []`; `7 passed, 1 failed` |
| city-defense-terrain-gate-test | exit 1; `[FAIL] KONTROLA (b) ... (35%) == ... (36%)`; `33 pass, 1 fail` |
| empire-army-city-recruit-no-inner-scroll-test | exit 1; `FAIL: [900px] ... -- 6`; `FAIL: [360px] ... -- 6` (liczby sumaryczne NIE_ZMIERZONO) |
| entity-card-action-buttons-real-render-test | exit 1; `FAIL: (D) ... hitTag":null`; `30 pass, 1 fail` |
| entitycard-sufit-dwoch-kart-test | exit 1; `FAIL: (K1) ...`; `FAIL: (K4 1920x1080) ...` (liczby sumaryczne NIE_ZMIERZONO) |
| idb-menu-continue-boot-refresh-test | exit 1; `FAIL: hasAnySaveSlot() ...`; `31 pass, 1 fail` |

Kandydat (`e172421b9` + wycofanie testu 7): wszystkie powyższe zielone (tabela wyżej). Mutacja w `gra/src` NIE była wykonywana (zakaz). Asercje nie zostały osłabione: test 2 nadal `===`; test 3 nadal `>8`; test 6 nadal równość A==B co do piksela i wysokość 720; test 8 nadal strażnik `.then`.

## Bramki referencyjne (surowe wyniki, na stanie po obronie)

- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0, 0 linii wyjścia
- `node tools/logic-test.cjs` → exit 0, `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → exit 0, `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → exit 0, `ALL GREEN`
- `node tools/unit-replace-test.cjs` → exit 0, `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → exit 0, `All sanity checks passed.`
- `git diff d59bd7a5a -- gra/src gra/data | wc -l` → `0`

## ZMIANY/COMMIT

Commit obrony (tylko ta ścieżka, `git add <jawne ścieżki>`):
- `gra/tools/general-capital-recruitment-order-test.cjs` — przywrócona wersja z `d59bd7a5a` (wycofanie częściowego loadera; klasa NIE ROZSTRZYGNIĘTO).
- `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-HARNESS-TRIAGE-A-Q1/30-obrona-claude.md` — ten raport.

Pozostałe zmiany testów 1, 2, 3, 4, 6, 8 z kandydata `e172421b9` pozostają bez zmian (sprawdzone: `git status` czysty poza powyższym).

## TESTY

Zielone na stanie po obronie: 1 (8/0), 2 (34/0), 3 (16/0), 4 (31/0), 5 (29/0 pod xvfb), 6 (67/0), 8 (32/0). Czerwone: 7 (`hexHasRoomFor is not defined`, klasa NIE ROZSTRZYGNIĘTO), 9 (`1723 ok, 2 FAIL`, DECISION_REQUIRED).

## BLOKADY

- Test 7: kompletny loader wymaga osobnego tematu (harness na prawdziwym module zamiast wycinania ciała `purchaseRecruitmentUnit`). Nie zgadywano semantyki stubów.
- Test 9: naprawa treści wymaga zmiany `docs/encyklopedia` i `gra/src/data/wikiBundle.json` (poza allowlistą); decyzja A/B właściciela.

## RUNDY

1/5 (Operator Haiku, runda obrony). Zarzuty Evaluatora: 4; przyjęte: 1, 2, 3; odrzucony: 4.

## NASTĘPNY KROK

Evaluator (Sonnet) — ponowna weryfikacja: (a) `git diff e172421b9 -- gra/tools` ma tylko wycofanie testu 7; (b) test 7 czerwony z identycznym komunikatem jak baza (klasa NIE ROZSTRZYGNIĘTO); (c) test 9 w klasie DECISION_REQUIRED. Orkiestrator: decyzja A/B dla wikiBundle (test 9) i osobny temat dla testu 7.

## UWAGI-DLA-ORKIESTRATORA

1. Wzorzec „wycinanie ciała funkcji z main.ts” jest kruchy: test 7 i `recruitment-batch-contract-test` wymagały ręcznego dopinania kolejnych zależności. Kandydat: temat „harness na prawdziwym module”.
2. `gra/src/data/wikiBundle.json` zawiera gołe klucze konfiguracyjne (`ksiega_zasobow_tury`, `dobra_wola_tur`) — realny wyciek w Civpedii, nie tylko problem testu.
3. Uruchamianie harnessów Chromium w zbiorczym skanie wymaga `xvfb-run -a`.
4. Poza zakresem: nic nie zmieniano w części B (TRIAGE-B).
5. Środowisko: `npm ci` w `gra/` wykonane w worktree (71 pakietów); `node_modules` zostaje do sprzątania przez orkiestratora (nie usuwałem: zakaz `rm`).

## DEPLOY/PUSH: NIE WYKONANO
