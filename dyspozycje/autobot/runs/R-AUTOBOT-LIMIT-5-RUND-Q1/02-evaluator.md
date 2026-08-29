# 02-evaluator — R-AUTOBOT-LIMIT-5-RUND-Q1

STATUS: BLOCK
TEMAT: R-AUTOBOT-LIMIT-5-RUND-Q1
GOAL: Zweryfikować maksymalnie 5 rund Operator→Evaluator, blokadę próby 6 statusem `LIMIT-5-EXCEEDED`, zachowanie `lastVerdict` oraz spójność kanonu AutoBot z generowanym playbookiem.
RUNDY: 4/5 według bieżącego raportu Operatora; ostatni faktyczny werdykt Operatora: BLOCK.
ZMIANY/COMMIT: Zapisano wyłącznie ten raport Evaluatora. Nie modyfikowano kodu gry ani zastanych zmian w `gra/`; brak commitu, integracji, deployu i pushu.

## WERDYKT

BLOCK — kryteria merytoryczne tematu i wszystkie wymagane bramki są zielone, ale proces nie może przejść do Final Control w tym checkoutcie. `process-docs-audit.cjs` wykrywa 16 zastanych zmian w `gra/`, poza dokumentacyjną allowlistą. Jest to niezależna blokada izolacji/worktree, a nie przypisanie winy tematowi R-AUTOBOT-LIMIT-5-RUND-Q1.

## USTALENIA

- `playbook.md` jest source of truth; generator `playbook-md-to-json.cjs --dry-run` potwierdza zgodność: 50 OK, 0 UPDATE, 0 ADD, 0 ORPHANED.
- `playbook.json` zawiera dokładnie jedną regułę z C-050 i dokładnie jedno literalne wystąpienie `C-050`; reguła ma `protected: true`, liczniki `0/0`, a końcowy tag `[C-050]` występuje raz.
- Kanoniczne listy statusów w aktywnych szablonach i routingu obejmują `PASS`, `PASS-WITH-NOTES`, `FAIL`, `BLOCK`, `TIMEOUT`, `INFRA` oraz `LIMIT-5-EXCEEDED`. Nie znaleziono już rozjazdu z wymaganym statusem limitu.
- Guard zachowuje limit 5 rund, blokuje próbę 6 dokładnie statusem `LIMIT-5-EXCEEDED`, propaguje `lastVerdict`, a manual resume wymaga jawnych flag i nie resetuje ID/licznika.
- Nie oceniam 16 zmian `gra/` jako winy tego tematu. Audyt jedynie wykazuje, że wspólny checkout nie jest czysty dla procesu dokumentacyjnego. `git status` pokazuje ponadto 3 nieśledzone pliki testowe w `gra/tools/`; również pozostawiono je nietknięte.

## TESTY

- `node dyspozycje/autobot/tools/round-limit-guard-test.cjs` — **PASS, 14/14**.
- `node dyspozycje/autobot/tools/autobot-smoke.cjs` — **PASS, 11/11**; rerun poza sandboxem, po wcześniejszym środowiskowym `TS5033/EPERM` przy zapisie `dist-smoke`.
- `node dyspozycje/autobot/tools/playbook-md-to-json.cjs --dry-run` — **PASS**, 50 OK, 0 UPDATE, 0 ADD, 0 ORPHANED; brak rozjazdu `playbook.md` ↔ `playbook.json`.
- `node gra/node_modules/typescript/bin/tsc -p dyspozycje/autobot/tsconfig.json --pretty false` — **PASS**, exit 0.
- `git diff --check` — **PASS**.
- `node dyspozycje/autobot/tools/process-docs-audit.cjs` — **BLOCK/FAIL procesu**, wyłącznie przez 16 zastanych plików `gra/` poza allowlistą; nie jest to dowód regresji tego tematu.

## MACIERZ KRYTERIÓW

| Kryterium | Wynik | Dowód |
|---|---|---|
| Limit rund i blokada próby 6 | PASS | guard 14/14; status dokładnie `LIMIT-5-EXCEEDED` |
| `lastVerdict` i manual resume | PASS | test guarda oraz kontrakt helpera |
| `playbook.md → playbook.json` | PASS | generator dry-run bez różnic |
| Dokładnie jeden C-050 | PASS | 1 reguła i 1 literalne wystąpienie w JSON |
| Spójne statusy | PASS | aktywne szablony zawierają `LIMIT-5-EXCEEDED` |
| Smoke | PASS | 11/11 po rerunie z zapisywalnym środowiskiem |
| TypeScript | PASS | AutoBot tsc exit 0 |
| Whitespace | PASS | `git diff --check` |
| Izolacja procesu | BLOCK | audyt wykrywa 16 zastanych zmian `gra/`; niezależne od tematu |

## BLOKADA I ROUTING RUNDY 5

1. Nie uruchamiać automatycznie kolejnej rundy. Najpierw orkiestrator musi uzyskać jawne rozdzielenie checkoutu/worktree od 16 zastanych zmian `gra/` albo formalną decyzję właściciela/orkiestratora, że te zmiany są osobnym zakresem i nie blokują audytu. Nie wolno ich resetować, checkoutować, czyścić ani integrować w tym runie.
2. Po `authorizeDispatch` dla rundy 5 Operator ma potwierdzić stan izolacji i nie zmieniać żadnego pliku `gra/`. Jeśli blokada pozostaje, raport Operatora ma pozostać `BLOCK` z listą tych samych obcych plików.
3. Gdy izolacja zostanie faktycznie usunięta lub formalnie rozstrzygnięta, ponowić audyt procesu i pełną macierzę testów: guard 14/14, smoke 11/11, generator dry-run, tsc i `git diff --check`.
4. Dopiero po zielonym audycie przekazać temat do Final Control. Nie wystawiać `READY_FOR_DEPLOY`, nie integrować i nie wykonywać deployu/pushu.
5. Jeżeli runda 5 zakończy się niepowodzeniem i potrzebna będzie kolejna automatyczna próba, zastosować dokładnie `LIMIT-5-EXCEEDED` i zatrzymać retry do jawnej decyzji właściciela/orkiestratora.

BLOKADY: procesowa blokada izolacji przez 16 zastanych zmian `gra/`; smoke, generator, guard, tsc i diff-check zielone.
NASTĘPNY KROK: BLOCK → orkiestrator rozdziela/rozstrzyga obce zmiany; następnie, wyłącznie po `authorizeDispatch`, runda 5 i ponowny audyt; po PASS audytu — Final Control.
DEPLOY/PUSH: NIE WYKONANO
