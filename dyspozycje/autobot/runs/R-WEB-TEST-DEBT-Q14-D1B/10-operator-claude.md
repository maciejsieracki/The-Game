# R-WEB-TEST-DEBT-Q14-D1B — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-Q14-D1B
GOAL: Rozstrzygnąć 17 FAIL w `gra/tools/ai4-popyt-obywatele-test.cjs` (STARY-PIN / HARNESS / BŁĄD-GRY / NIE-ZMIERZONO) z dowodem, przepisać asercje do obowiązujących reguł bez ich osłabiania, zachować zielone bramki.
ZMIANY-COMMIT: SHA `f00511cb0` (HEAD; 4 commity: `ecc92962d`, `ff7feec7d`, `f9e2a7063`, `f00511cb0`). Baza: `6d38cbfae` (origin/main). Zmieniony jedyny plik: `gra/tools/ai4-popyt-obywatele-test.cjs` (+59/−46). Raport: `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q14-D1B/10-operator-claude.md`. Bez zmian w `gra/src`, `gra/data`, `WERSJE.md`, manifestach.

## Wynik przed / po
- Przed (baza 6d38cbfae, surowe wyjście): `ai4-popyt-obywatele-test: 38 passed, 17 failed`.
- Po (HEAD f00511cb0, surowe wyjście): `ai4-popyt-obywatele-test: 55 passed, 0 failed` (exit 0).

## Klasyfikacja 17 FAIL (z dowodem)

Dowód reguły: commit `1c19e0aba` („jedna prosta zasada zamiast dwóch przycisków", R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1, decyzja właściciela 2026-11-04) usunął przełączniki `onlyWorked` i `wolnoWycinacLas`. Komentarze w `gra/src/game/cities.ts:211-215` i `gra/src/game/auto-improvements.ts:630-640` (`FOOD_IMPROVEMENT_KEYS`: „bez wyjątków — ani złoże na heksie") potwierdzają obowiązującą regułę. Commit `fb75c1631` wprowadził „żywność tylko na polach obywateli bez wyjątków".

| # | Asercja | Klasyfikacja | Dowód i działanie |
|---|---|---|---|
| 1 | Z1h/infrastruktura | HARNESS | Profil `infrastruktura` (posterunek/droga/fort) daje 0 pickow przy JEDNYM mieście (`bez=''`, stąd „1 pickow" w komunikacie). Ze drugim miastem: `droga@5,7 droga_brukowana@5,7 droga@10,7 ...` — droga łączy miasta. Naprawa: fikstura z drugim miastem (c1 na 13,7). Z1h/zrownowazone i Z1i nadal zielone. |
| 2 | Z2d | STARY-PIN | Test żądał „WYJĄTEK ZŁOŻOWY" dla warzelni soli bez obywateli; obowiązująca reguła go nie ma (`FOOD_IMPROVEMENT_KEYS`). Przepisane na BRAK wyjątku. |
| 3 | Z2e | STARY-PIN | `DEFAULT_ULEPSZENIA_ONLY_WORKED` usunięta z `cities.ts`. Przepisane na asercję o usunięciu stałej. |
| 4 | Z2f | STARY-PIN | Świeża polityka nie ma pola `onlyWorked`. Przepisane na brak pola. |
| 5 | Z2g | STARY-PIN | Override miasta nie niesie `onlyWorked`. Przepisane na brak pola. |
| 6 | Z2h | STARY-PIN | Jawne `false` w starym zapisie jest ignorowane (pole usunięte). Przepisane. |
| 7 | Q2a | STARY-PIN | `DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS` usunięta (commit `1c19e0aba`). Przepisane na `=== undefined`. |
| 8 | Q2b | STARY-PIN | Polityka państwa bez `wolnoWycinacLas`. |
| 9 | Q2c | STARY-PIN | Ustawienia miasta bez `wolnoWycinacLas`. |
| 10 | Q2d | STARY-PIN | Pole polityki państwa `wolnoWycinacLas` IGNOROWANE (jedna reguła). |
| 11 | Q2e | STARY-PIN | Override miasta nie niesie przełącznika. |
| 12 | Q2f | STARY-PIN | Override bez pola nie czyta przełącznika państwa. |
| 13 | Q2g | STARY-PIN | `ensureCitySaveDefaults` nie dopisuje `ulepszeniaWolnoWycinacLas`. |
| 14 | Q2i | STARY-PIN | `main.ts` nie zawiera już `wolnoWycinacLas` (grep: 0 trafień w `gra/src`). Asercja: brak identyfikatora. |
| 15 | Q2k | STARY-PIN | Wycinka jest zawsze dozwolona (`commit f4ef94523`, `1c19e0aba`). Test wywoływał picker z `skipWyrab: true` i `getSkipWyrab` (nieistniejący przełącznik). Teraz `skipWyrab: false` jak w `main.ts`: `cA` wycina 4. |
| 16 | Q2m | STARY-PIN | To samo źródło (stare `skipWyrab: true`). Po zmianie wywołania: `farm w miescie cA: 4`. |
| 17 | Q2n | STARY-PIN | `main.ts` (AI GRACZA) nie podaje `getSkipWyrab` ani `skipWyrab: true` (`main.ts:45285-45305`). Asercja: brak obu. |

Q2l (wcześniej „miasto z wyłączonym przełącznikiem nie wycina") przepisane na „miasto cB wycina tak samo" (zachowanie zgodne z regułą; wcześniej przechodziło tylko dlatego, że stare `skipWyrab: true` blokowało wycinkę w obu miastach).

Żadna pozycja nie zakwalifikowana jako BŁĄD-GRY ani NIE-ZMIERZONO. Asercje nie zostały osłabione: każda nowa asercja sprawdza obowiązującą regułę (brak wyjątku, brak przełącznika, wycinka zawsze dozwolona), a Z2c jest zaostrzona (warzelnia soli też objęta regułą obywateli).

## Mutacje czerwone (kopia źródeł poza repo, `AI4_SRC_DIR`)
- Mutacja A: `'warzelnia_soli'` wyjęte z `FOOD_IMPROVEMENT_KEYS` → `Z2c` i `Z2d` CZERWONE (`52 passed, 2 failed`, potem Z2c: `warzelnia_soli@12,7`).
- Mutacja B: `skipWyrab: true` w bloku pickera AI GRACZA w `main.ts` → `Q2n` CZERWONE (`52 passed, 3 failed`). Uwaga: mutacja B zastosowana na tej samej kopii, która już zawierała mutację A, więc Z2c/Z2d w tym wyniku pochodzą z A; czerwony Q2n wynika wyłącznie z B.

## TESTY (surowe wyniki, HEAD f00511cb0)
- `tsc --noEmit`: exit 0, brak błędów.
- `ai4-popyt-obywatele-test.cjs`: `55 passed, 0 failed` (exit 0).
- `logic-test.cjs`: `LOGIC OK (213/213)`.
- `tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`.
- `research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33` (ALL GREEN).
- `ai-unit-replace-same-rules-test.cjs`: `45 passed, 0 failed` (dispatch podawał 21 — różnica liczby zmierzona, NIE-ZMIERZONO, w bramce liczy się exit 0).
- `unit-replace-archer-slinger-test.cjs`: `51 OK, 0 FAIL`.
- `combat-test.cjs`: `COMBAT TEST: 6/6 pass`; `All sanity checks passed.`
- `ai-test.cjs`: `ai-test: 297 passed, 0 failed`.
- `era-war-pairing-alliance-test.cjs`: `19 pass, 0 fail`.
- `ai-ai-alliance-surcharge-test.cjs`: `RESULT: ALL GREEN (live + mutants detected)`.

Uwaga: uruchomienia bramek w pierwszym planie (bez `run_in_background`); testy nie modyfikowały `gra/src`.

## BLOKADY
Brak.

## UWAGI-DLA-ORKIESTRATORA
- Zależności dispatchu: `node_modules` w `gra/` nie było w worktree — zainstalowane przez `npm ci` (71 pakietów, bez `npm run build/dev`). Usunięte po bramkach (patrz niżej).
- Pliki `gra/tools/.ai4t-*` (bundle testu) są artefaktami uruchomienia; nie wchodzą do commita.
- Dispatch podawał `unit-replace 21`, zmierzone `45` (ai-unit-replace-same-rules) i `51` (archer-slinger) — liczby z dispatchu nie odpowiadają bieżącemu plikowi testu, gate zielony (exit 0).

## RUNDY
1/5 (jedna runda, bez FAIL).

## NASTĘPNY KROK
Evaluator (Sonnet) i Final Control: zweryfikować klasyfikację 17 pozycji z tabeli, mutacje A/B i wynik `55/0` na `f00511cb0`. Integracja po Final Control przez orkiestratora.

## DEPLOY/PUSH: NIE WYKONANO
