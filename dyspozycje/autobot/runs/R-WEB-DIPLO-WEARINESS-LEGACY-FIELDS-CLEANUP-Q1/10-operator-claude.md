STATUS: PASS-WITH-NOTES
DOMAIN: GAME (sprzątanie komentarzy i nazw asercji; zachowanie gry bez zmian)
TEMAT: R-WEB-DIPLO-WEARINESS-LEGACY-FIELDS-CLEANUP-Q1
GOAL: usunąć martwe pola drugiego zegara zmęczenia i nazwy testów "po 20 turach"; zachowanie gry bez zmian.
BAZA: 3a00b867f (origin/main, merge-base --is-ancestor OK). Worktree detached.

ZMIANY-COMMIT (allowlista):
- gra/src/game/diplomacy-peace-lock.ts: komentarz (E) i doc pola fatigueFraction. Źródło = warWearinessLevel (ai.ts wearyLevel, skala 40 tur). Zegar profilu nie zasila tej bramki (ai.ts:7265 fatigueFraction: wearyLevel).
- gra/data/diplomacy-war-peace-params.json: _wzor (tylko opis; klucze bez zmian).
- gra/tools/diplo-war-peace-profile-unit-test.cjs: 3 nazwy asercji "po 20 turach" zmienione na "legacy zegar profilu". Liczby i asercje bez zmian.

ZMIERZONO (grep wywołań w gra/src, gra/data, gra/tools):
- zmeczenieT: zapisywane w resolverze, czytane tylko przez testy (diplo-war-peace-profile-unit-test: 20/17/<=20). Brak użycia w decyzjach i UI. NIE USUNIĘTO, bo usunięcie wymaga zmiany asercji testów.
- warWearinessShare / warWearinessFraction: wywoływane tylko z testów (profile-unit, truce-impl) i z komentarzy. NIE USUNIĘTO z tego samego powodu.
- bazaTur / maksTur / maksUdzial / wagaAgresja (blok zmeczenie): zasilają zmeczenieT i WAR_WEARINESS_MAX_SHARE. wagaAgresja w pozostałych blokach JSON jest używana w decyzjach i zostaje.
- Wniosek: nie ma całkowicie martwego pola, które dałoby się usunąć bez zmiany asercji testów. Usunięcie to osobny temat (API resolvera + testy).

NIE ZMIENIANO: nazwa pliku tools/diplo-weariness-20-turns-test.cjs. To ID tematu używane w dokumentacji i runach; treść asercji już mówi 40 tur i 2,5%. Pozostałe "20" w diplo-war-peace-main-guard-test.cjs to ID tematu, nie opis zachowania.

TESTY (przed = baza 3a00b867f; po = po zmianach; exit 0 w obu):
| test | przed | po |
| diplo-war-peace-profile-unit-test | 198 pass / 0 fail | 198 pass / 0 fail |
| diplo-weariness-20-turns-test | PASS=31 FAIL=0 | PASS=31 FAIL=0 |
| diplo-war-peace-main-guard-test | 35 pass / 0 fail | 35 pass / 0 fail |
| diplo-war-peace-sim-test | 25 pass / 0 fail | 25 pass / 0 fail |
| diplo-wiki-weariness-rate-consistency-test | asercje OK 18, FAIL 0 | asercje OK 18, FAIL 0 |
| diplo-peace-pw-power-ratio-test | 48 PASS, 0 FAIL | 48 PASS, 0 FAIL |
| diplo-weariness-forced-peace-test | PASS=14 FAIL=0 | PASS=14 FAIL=0 |
| tsc --noEmit | exit 0 | exit 0 |
| logic-test | LOGIC OK (213/213) | LOGIC OK (213/213) |
| tech-tree-test | 20 pass, 0 fail | 20 pass, 0 fail |
| research-test | PASSED 33 / FAILED 0 | PASSED 33 / FAILED 0 |
| unit-replace-test | 21/21 | 21/21 |
| combat-test | 6/6 pass | 6/6 pass |

Mutacja (3b): NIE WYKONANO. Nie usunięto żadnego kodu; zmiany to komentarze i nazwy asercji. JSON parse OK. git diff --check OK.

BLOKADY: brak. Usunięcie zmeczenieT i warWearinessShare/Fraction wymaga osobnej decyzji, bo zmienia asercje testów.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje, czy otworzyć osobny temat na usunięcie zegara profilu (zmeczenieT, warWearinessShare/Fraction, bazaTur, maksUdzial) razem z asercjami testów.
DEPLOY/PUSH: NIE WYKONANO
Worktree: /home/user/The-Game/.claude/worktrees/wf_a7425125-b22-1. gra/node_modules zainstalowane przez npm ci --ignore-scripts; do sprzątnięcia przez orkiestratora.
