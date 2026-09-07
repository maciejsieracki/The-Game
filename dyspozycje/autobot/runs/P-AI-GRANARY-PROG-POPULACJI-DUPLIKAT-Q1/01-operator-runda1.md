# P-AI-GRANARY-PROG-POPULACJI-DUPLIKAT-Q1 — Operator, runda 1

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-AI-GRANARY-PROG-POPULACJI-DUPLIKAT-Q1
GOAL: dodać bramkę test-only pilnującą zgodności `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY` /
`AI_POP_CAP_WITH_GRANARY_I` (`gra/src/game/ai.ts`) z realnym `cityPopulationCap()` /
`econ-params.json` dla easy/normal/hard — bez zmiany `ai.ts` (świadomy kompromis
architektoniczny, patrz GENEZA dispatchu).

## Odczyt GENEZY

Potwierdzono własnym czytaniem `gra/src/game/ai.ts` ok. linii 1428-1479: komentarz przy
`granaryPriorityBonus()` mówi wprost, że `ai.ts` NIE importuje `economy.ts`, żeby nie ciągnąć
całego modułu ekonomii do testów jednostkowych AI — duplikacja stałych `AI_POP_CAP_*` jest
świadoma. Nie zaimportowano `cityPopulationCap` do `ai.ts` — zero zmian w `gra/src/**`.

## Recon istniejących bramek

`grep -rln "AI_POP_CAP" gra/tools/*.cjs` → 0 trafień. Potwierdzone: brak jakiejkolwiek
istniejącej bramki pilnującej tej zgodności.

## ZMIANY/COMMIT

Nowy plik: `gra/tools/ai-granary-prog-populacji-spojnosc-test.cjs`.

Metoda (bez eksportu prywatnych stałych ai.ts, bez zmiany ai.ts): czyta `ai.ts` jako tekst,
regexem wycina literały `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY`/`AI_POP_CAP_WITH_GRANARY_I`
(liczby z realnego pliku, nie przepisane ręcznie); bundluje esbuildem realny
`cityPopulationCap`+`loadEconParams` z `economy.ts`; ładuje realny `gra/data/econ-params.json`;
dla easy/normal/hard liczy `cityPopulationCap(false, false, params)` i
`cityPopulationCap(false, true, params)` i porównuje z wyciągniętymi stałymi. Wzorzec identyczny
z istniejącym `spichlerz-cap-citypanel-wiring-test.cjs` (source-jako-tekst + regex + realne
funkcje).

## TESTY

- `node gra/tools/ai-granary-prog-populacji-spojnosc-test.cjs` → 12 pass, 0 fail (zielona).
- Dowód mutacyjny #1: `hard: 4` → `hard: 999` w `AI_POP_CAP_NO_GRANARY_BY_DIFFICULTY` →
  1 FAIL (`999 == 4` fałsz) → cofnięte → `git diff` czysty → 12 pass, 0 fail.
- Dowód mutacyjny #2: `AI_POP_CAP_WITH_GRANARY_I = 8` → `= 7` → 3 FAIL (easy/normal/hard) →
  cofnięte → `git diff` czysty → 12 pass, 0 fail.
- `npx tsc --noEmit` (gra/) → czysto, brak błędów.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
- `git status --porcelain` → wyłącznie nowy plik bramki, zero zmian w `gra/src/**`.

## BLOKADY

Brak.

## RUNDY

1/5.

## NASTĘPNY KROK

Evaluator (Sonnet 5, effort high).

DEPLOY/PUSH: NIE WYKONANO
