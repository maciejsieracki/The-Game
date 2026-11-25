# R-WEB-ERA-WAR-PAIRING-ALLIANCE-NO-BLOCK-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-PAIRING-ALLIANCE-NO-BLOCK-Q1
GOAL: sojusz formalny NIE blokuje wojny epoki; parowanie do skutku z preferencją par bez sojuszu; fallback po trzech (istniejący mechanizm) bez zmian; testy i bramki zielone.
BAZA: aa96cfc618de124e48b74408870115854293e6c5 (origin/main, FALA 890), checkout --detach.

## ZMIANY-COMMIT

Allowlista (kod):
- `gra/src/game/war-rules-multiwar.ts` — `isWarTreatyBlocked`: dla `eraWar` zwraca `false` (wcześniej `hasAlliance`). Sojusz nie blokuje wojny epoki.
- `gra/src/game/forced-war-common.ts` — `assignForcedWarPairings`: nowa opcja `isAllied` (wyłącznie PREFERENCJA, nie blokada):
  - dopasowanie 1v1 (DP na bitmasce): waga pary = 1000 + (1 gdy bez sojuszu); maksymalna suma = najpierw maks. liczba par, potem najmniej par sojuszniczych. Deterministyczne (bez zmian tie-breaku).
  - dołączanie trzeciego (krok 4): najpierw pary, w których żadna strona nie jest sojusznikiem leftovera; potem pozostałe (stabilnie, kolejność `pairsSorted`).
  - wolny cel fallbacku i kandydat-partner gracza: rangowanie `(sojusz ? 1 : 0, dystans)`.
  - `isPairBlocked` (NAP/pokój/sojusz przekazany przez main) nadal działa jako twarda blokada — dla wojny epoki main przekazuje już tylko blokadę wynikającą z `isWarTreatyBlocked` (= nic).
- `gra/src/main.ts`:
  - `assignForcedWarPairings` dostaje `isAllied: (a,b) => allianceFormalKindBetween(activeDeals,a,b) !== null`.
  - usunięte guardy `stone-alliance-guard` i `iron-alliance-guard` w bramce `wypowiedz_wojne` (sojusz z celem Kamienia/Żelaza nie odrzuca już komendy).
- `gra/src/game/ai.ts`: usunięte `&& !forcedRel.hasAllianceTreaty` z trzech wczesnych returnów wojny epoki (Brąz, Kamień, Żelazo).
- Nowy test: `gra/tools/era-war-pairing-alliance-test.cjs` (15/15 PASS; mutacja D1 czerwona).
- Re-pin testów wymagających zmiany (decyzja 2026-11-22 znosi wcześniejsze „sojusz blokuje” z R-WEB-ERA-WAR-IGNORE-TREATIES-Q1):
  - `gra/tools/era-war-ignore-treaties-test.cjs` — A2 (sojusz nie blokuje), B7 (zero guardów `hasAllianceTreaty`), C2 (wczesny zwrot zachodzi przy sojuszu).
  - `gra/tools/forced-war-stone-test.cjs` — „sojusz z celem NIE blokuje wojny epoki”.
  - `gra/tools/forced-war-bronze-test.cjs` — T10a: wojna wymuszona dostępna przy sojuszu.
  - `gra/tools/forced-war-trojstronna-test.cjs` — DOW wojny epoki przy sojuszu gracz<->strona nie jest blokowany.
  - `gra/tools/forced-war-iron-main-guard-test.cjs` — regex: brak guardu sojuszu Żelaza w main i ai.ts; regex wywołania `assignForcedWarPairings` toleruje opcję `isAllied`.

Dokument analizy `dyspozycje/analizy/ERAWAR-PAROWANIE-2026-11-25.md` NIE został utworzony (pomiar nie uruchomiony, patrz TESTY).

Uwaga o rozstrzygnięciu „zgodnie z istniejącymi regułami dyplomacji”: wypowiedzenie wojny (także wymuszonej) nadal wywołuje `breakTreatiesOnWar(ownerId, targetId, false)`; `BREAK_ON_WAR` (`diplomacy-treaties.ts`) zawiera `SojuszWojskowy`, `sojusz_defensywny`, `sojusz_pelny`, więc sojusz z celem jest zrywany w chwili wypowiedzenia. Nie zmieniano tego.

## TESTY (surowe wyniki)

- `npx tsc --noEmit` → exit 0
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/era-war-pairing-alliance-test.cjs` → `15 pass, 0 fail` (w tym D1 mutacja: `assignments=0, unresolved=1,2` = czerwony wynik przy przywróconej blokadzie)
- Era-war po zmianie: `era-war-ignore-treaties-test` 22/0; `forced-war-stone-test` 31/0; `forced-war-bronze-test` 48/0; `forced-war-iron-main-guard-test` 36/0; `forced-war-trojstronna-test` 23/0; `forced-war-relation-gate-test` 14/0; `era-war-defer-not-cancel-test` 29/0; `era-war-player-included-test` 10/0; `era-war-all-eras-test` 10/0; `war-epoch-player-first-test` 33/0; `war-rules-multiwar-main-guard-test` 21/0; `era-war-delays-test` 55/0; `war-era-counter-test` 82/0; `forced-war-bronze-main-guard-test` exit 0.
- `wojna-wymuszona-parowanie-test.cjs`: czerwone S2 (2 asercje), S7 (2 asercje) i `TypeError` w S7 (linia 281). IDENTYCZNIE na bazie aa96cfc (sprawdzone na czystym źródle przed re-pinem). Przyczyna: reguła R-WEB-ERA-WAR-DEFER-NOT-CANCEL-Q1 (Brąz/Żelazo nie dołącza do pary Kamienia), a test zakłada dołączenie do pary `stone` z podmiotem `bronze`. NIE naprawiano (poza zakresem; do osobnego tematu).
- Diff whitespace: `git diff --check` czysty.

## NIE ZMIERZONO

- Pomiar kierunkowy (seed 4242, ≥90 tur, Brąz: czy wojna epoki zawiązuje się w oknie zamiast stać 68 tur) NIE został uruchomiony w tej rundzie. Brak dowodu w grze. Do zrobienia w kolejnej rundzie na runnerze dyplomacji.
- Pełny zestaw testów AI (`ai-test` i pokrewne) poza wymienionymi NIE uruchomiono.

## BLOKADY

Brak blokad procesu. Uwaga: pomiar NIE ZMIERZONO (patrz wyżej).

## RUNDY

1/5. Ostatni werdykt: brak (Operator).

## NASTĘPNY KROK

Final Control: przegląd diffu (`git diff aa96cfc..HEAD`), w szczególności: (1) DP wag w `assignForcedWarPairings`, (2) usunięcie guardów sojuszu Kamienia/Żelaza w main.ts/ai.ts (decyzja właściciela), (3) pomiar kierunkowy seed 4242 jako osobny temat.

## UWAGI-DLA-ORKIESTRATORA

- Fallback greedy (`n > 24`, nieosiągalne w grze) nadal używa `pairBlocked` bez preferencji sojuszu — świadomie nietknięty.
- `wojna-wymuszona-parowanie-test.cjs` jest czerwony od bazy (S2, S7, TypeError); do osobnego tematu (reguła DEFER-NOT-CANCEL vs test).
- Dispatch prosił o zacommitowanie tylko raportu, a jednocześnie o „ZACOMMITOWAĆ” kodu i testów; zacommitowano kod, testy i raport w jednym commicie.

DEPLOY/PUSH: NIE WYKONANO
