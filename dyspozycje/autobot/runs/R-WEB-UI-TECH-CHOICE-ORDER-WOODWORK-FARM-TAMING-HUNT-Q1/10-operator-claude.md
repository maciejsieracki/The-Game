# R-WEB-UI-TECH-CHOICE-ORDER-WOODWORK-FARM-TAMING-HUNT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-TECH-CHOICE-ORDER-WOODWORK-FARM-TAMING-HUNT-Q1
GOAL: w sekcji „Możesz wybrać” na starcie nowej gry cztery badania w kolejności: Obróbka drewna, Rolnictwo, Oswojenie zwierząt, Łowiectwo. Zmiana tylko kolejności wyświetlania listy wyboru (bez kosztów, wymagań, efektów, drzewka i AI).
BAZA: cde7cfcbb (origin/main, gałąź detached w worktree wf_3840f4a2-5ce-1)

ZMIANY/COMMIT:
- Diagnoza: kolejność listy „Możesz wybrać” pochodzi z `buildHubTechEntries` w `gra/src/ui/scienceHubSnapshotLogic.ts`. Sortowanie było alfabetyczne (`localeCompare`, 'pl'), stąd Łowiectwo, Obróbka drewna, Oswojenie zwierząt, Rolnictwo. Nie ma pola kolejności w `gra/data/tech.json` ani sortowania po koszcie.
- Wspólna funkcja: `buildHubTechEntries` jest używana tylko przez UI (`scienceHubHud.ts`, `sciencePicker.ts`), a także przez test `science-hub-test.cjs`. AI (`ai.ts` i pokrewne) jej nie wywołuje, więc AI i drzewko nie są dotknięte. Drzewko ma własne układanie (barycenter), a `availableTechs` (silnik) zostaje bez zmian.
- Zmiana: jawna tabela `HUB_START_TECH_ORDER` (cztery nazwy, jedno miejsce) i funkcja `hubStartTechRank`. W komparatorze, tylko dla odblokowanych wpisów, najpierw porządek z tabeli, potem alfabetycznie (pl) reszta. Zablokowane wpisy i ich „Wkrótce · zablokowane” bez zmian. Przyciski „Karta” i „+ PLAN” bez zmian (nie tykano kodu renderu).
- Pliki (allowlista): `gra/src/ui/scienceHubSnapshotLogic.ts` (+25), `gra/tools/tech-choice-order-test.cjs` (nowy), `dyspozycje/autobot/runs/R-WEB-UI-TECH-CHOICE-ORDER-WOODWORK-FARM-TAMING-HUNT-Q1/10-operator-claude.md` (nowy), `.../mozesz-wybrac-po.png` (nowy zrzut). `main.ts` nietknięty. `WERSJE.md`, `gra-robocza/`, `rust-port/` nietknięte.
- Docs/Civpedia/wiki: `grep` po `docs/` i `gra/` na „Możesz wybrać” nie wykazał żadnej opisanej kolejności, więc wikiBundle nie był regenerowany (brak zmian do zsynchronizowania).
- SHA: patrz commit (czubek gałęzi, wpisany w odpowiedzi StructuredOutput).

TESTY (surowe wyniki, uruchomione w `gra/`):
- `node ./node_modules/typescript/bin/tsc --noEmit` → TSC_EXIT=0 (bez błędów), 30 s.
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/science-hub-test.cjs` → `science-hub-test: 7 pass, 0 fail` (regresja huba przechodzi)
- `node tools/tech-choice-order-test.cjs` (nowy) → `9 pass, 0 fail` na zmianie.
- Dowód nietautologiczności (mutacja): z tabelą wyzerowaną i komparatorem wyłączonym (zachowanie bazy) test daje `6 pass, 3 fail`. Pierwsza asercja pokazuje `["Łowiectwo","Obróbka drewna","Oswojenie zwierząt","Rolnictwo"]`, czyli dokładnie kolejność z dostarczonego zrzutu właściciela. Po przywróceniu zmiany: `9 pass, 0 fail`.
- Real render w Chromium (`/usr/bin/chromium`, Playwright): prawdziwe `createScienceHubHud` + `buildHubTechEntries` na prawdziwym `tech.json`, researched = pusty zbiór, era 1. Kolejność z silnika i z DOM (`.sh-item:not(.locked) .sh-name`): `["Obróbka drewna","Rolnictwo","Oswojenie zwierząt","Łowiectwo"]`, `pageErrors: []`. Zrzut: `mozesz-wybrac-po.png` w katalogu runu.
- `git diff --check` → czysty.

BLOKADY:
- NIE_ZMIERZONO: pełnej gry „nowa gra → panel badań” (start przez menu, kreator, ustawienia) nie uruchamiano. Zrzut jest z harnessu montującego ten sam moduł huba na prawdziwych danych, bez całej gry. Kolejność w grze wynika z tej samej funkcji, ale end-to-end nie zmierzono.
- NIE_ZMIERZONO: bramek `tools/*` poza wymienionymi (w tym `ai-*`, `diplomacy-*`) nie uruchamiano; zmiana ich nie dotyka (AI nie korzysta z `buildHubTechEntries`).
- Dług Rust: REPIN nie dotyczy (zmiana tylko w web UI). Nie odnotowano nowego długu.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) weryfikuje allowlistę, mutację i zrzut; po FC PASS orkiestrator integruje i decyduje o deployu ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Tabela `HUB_START_TECH_ORDER` jest w kodzie (nie w danych), zgodnie z dopuszczonym wariantem „tabela w jednym miejscu”. Jeśli właściciel chce to w `tech.json`, to osobny temat.
- Komparator porządkuje tylko odblokowane wpisy. Gdyby którekolwiek z czterech badań pojawiło się zablokowane (np. w innej epoce), zachowuje alfabet, co jest zamierzone.
- Notatka dla procesu: w worktree nie było `gra/node_modules`; zainstalowano `npm ci --ignore-scripts` (71 pakietów), bez `npm run build`/`dev`.
