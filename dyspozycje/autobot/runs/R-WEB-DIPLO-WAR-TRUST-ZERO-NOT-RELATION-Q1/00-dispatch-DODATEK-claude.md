# R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1 — DODATEK orkiestratora (runda 1)

## Decyzja właściciela (własnymi słowami, 2026-11-13)
- „W trakcie wojny nie relacja ma być obniżana, a zaufanie.”
- Relacja (zaufanie + respekt z Power) NIE znika. Respekt nie jest zmieniany z powodu wojny.
- „W trakcie wojny zaufanie powinno osiągnąć zero.”
- Na zawarcie pokoju nadal mają wpływ: Power obu stron i zaufanie obniżone wojną. Wojna nie może zaburzać poziomu Power.

## Stan obecny (sprawdzony w kodzie na bazie 5d0c5f8d1)
- `clampRelationForWar` (`gra/src/game/diplomacy.ts:1141-1153`): w wojnie, gdy `zaufanie + respekt > 29` (`WAR_RELATION_SCORE_CAP = progMinimalnyRelacja − 1`, `diplomacy.ts:1105`), najpierw zdejmuje nadmiar z zaufania, potem z respektu.
- Wywołania zapisujące stan: `diplomacy.ts:1094` (po zdarzeniu dyplomatycznym) i `diplomacy.ts:1860` (tick relacji).
- Wywołania tylko w obliczeniach: `diplomacy-proposals.ts:713` (`treatyEvalRelationTotal`), a także miejsca w `diplomacy-proposals.ts:1415, 1439, 1475` i `diplomacy-ai-offer-balance.ts:539` (komentarze/obliczenia pokoju).
- UI: `diplomacy-display.ts:360` (`warRelationCapApplies`) i `diplomacyAudience.ts:1286-1290` (dopisek „limit wojenny 29”).

## Wymagane zachowanie po zmianie
1. W wojnie zaufanie jest sprowadzane do 0 (w każdym ticku relacji w wojnie oraz po zdarzeniu dyplomatycznym), a respekt pozostaje bez zmian. Wartość docelowa 0 jest ustalona (decyzja właściciela); sposób dojścia: ustaw 0 od razu.
2. Relacja w wojnie = 0 + respekt (nieobcinana do 29).
3. Poza wojną funkcja zachowuje się jak dotąd (bez zmian).
4. Ocena pokoju (`treatyEvalRelationTotal` i ścieżki w `diplomacy-proposals.ts`) używa realnej relacji bez limitu 29. Nie zmieniaj progów ani cen PN — tylko usuń obcinanie.
5. UI: jeśli dopisek „limit wojenny 29” przestaje być prawdziwy, zmień tekst na zgodny z nową regułą („w wojnie zaufanie spada do zera”). Nie zmieniaj etykiet nastawienia ani ich progów — to następny krok.

## Nie rób (kolejne kroki, osobne zlecenia)
- Progów 30 → zaufanie, progu wrogości poniżej 10, automatycznej wojny przy zerze zaufania, zmian sojuszu 130/90.
- Zmian stosunku siły wojska/gospodarki w decyzjach wojny i pokoju.

## Kryteria końca (binarne)
- tsc --noEmit exit 0.
- Nowy test `gra/tools/diplo-war-trust-only-test.cjs`: (a) tick w wojnie przy zaufaniu 40 i respekcie 50 daje zaufanie 0, respekt 50; (b) poza wojną ten sam wejściowy stan jest nietknięty; (c) zdarzenie z wygraną bitwy w wojnie nie obniża respektu; (d) `treatyEvalRelationTotal` w wojnie zwraca sumę nieobciętą; (e) mutacja (przywrócenie starego obcinania) czerwieni test.
- Istniejące testy z listy w allowlist zaktualizowane tylko w asercjach o limicie 29; żaden test nie osłabiony poza tym.
- Pięć bramek referencyjnych: logic-test 213/213, tech-tree-test 20/0, research-test 33/0, unit-replace-test 21/21, combat-test 6/6. Jeśli któraś czerwona na kandydacie, sprawdź ten sam test na bazie i odróżnij regresję od długu.
- Raport w `10-operator-claude.md` z listą zmian, wynikami (surowe liczby) i opisem wpływu na etykietę nastawienia w wojnie (może przestać być „Wrogi”, bo relacja nie jest już obcinana — opisz, nie naprawiaj).

## Środowisko i zakazy
Worktree, w gra/ `npm ci --ignore-scripts`; ZAKAZ `npm run build/dev`; `tsc --noEmit` wolno. Nie integrujesz, nie deployujesz, nie pushujesz na main. Bez `git add -A`.
