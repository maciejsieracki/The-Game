# 01-operator — R-AUTOBOT-LIMIT-5-RUND-Q1

STATUS: BLOCK
TEMAT: R-AUTOBOT-LIMIT-5-RUND-Q1
GOAL: Ustanowić twardy limit maksymalnie 5 rund Operator→Evaluator dla jednego pełnego ID i zatrzymać automatyczny dispatch przed szóstą próbą.
ZMIANY-COMMIT: Brak commitu. Zmieniono wyłącznie allowlistę: `docs/decyzje/R-PROC-AUTOBOT.md`, `.claude/skills/civ-autobot/SKILL.md`, `.cursor/rules/autobot-evaluator-operator.mdc`, `playbook.md`, wygenerowane `dyspozycje/autobot/playbook.json` oraz ten artefakt runu.

## Ustalenia

- Runda = jeden faktyczny dispatch Operatora wraz z przypisanym Evaluatorem; runda początkowa i każda korekta są liczone osobno.
- Licznik rośnie przed dispatchiem. Próby 1–5 są dozwolone; `ABC-OCZEKUJE` przed dispatchiem nie zużywa rundy.
- `BLOCK`, `TIMEOUT`, `INFRA` i `ZWIS` po rozpoczęciu próby zużywają rundę i pozostają przyczyną techniczną; limit jest dodatkową bramką.
- Po piątej nieudanej/niezamkniętej rundzie kolejny automatyczny dispatch jest zatrzymany i wymagany jest status kanoniczny `LIMIT-5-EXCEEDED` z liczbą rund, ostatnim werdyktem, blokadą i decyzją właściciela/orkiestratora.
- Wznowienie lub nowy cykl wymaga jawnej decyzji, zachowuje to samo ID i nie resetuje licznika bez wyraźnej zgody.

## TESTY

- Generator `playbook.md → playbook.json`: zapis przez generator zakończony; kolejny `--dry-run` wykazał `OK: 50`, `ADD: 0`, `UPDATE: 0`, `ORPHANED: 0`, brak różnic.
- `autobot-smoke.cjs`: `11/11 PASS`.
- Scaffold granic: `4 => ALLOW`, `5 => ALLOW`, `6 => BLOCK LIMIT-5-EXCEEDED` — PASS; C-050 w JSON ma `protected=true` i liczniki `0/0`.
- Audyt treści wszystkich 5 warstw: obecne definicje rund, próg 1–5, blokada szóstej próby, status limitu, ABC oraz rozróżnienie BLOCK/TIMEOUT/INFRA/ZWIS.
- Nie uruchamiano `npm run build` ani `npm run dev`; nie zmieniano kodu gry ani `WERSJE.md`.

BLOKADY: Brak merytorycznych. OneDrive Files-on-Demand wymagał jednorazowego rozszerzonego dostępu do zapisu wygenerowanego JSON i smoke; testowe wpisy smoke w `postmortems.jsonl` zostały usunięte, a cudze zmiany pozostawiono nietknięte.
NASTĘPNY KROK: Evaluator
DEPLOY-PUSH: NIE WYKONANO.

## RAPORT UZUPEŁNIAJĄCY — PRÓBA 4

STATUS: BLOCK
RUNDY: 4/5 według bieżącego przebiegu; ostatni faktyczny werdykt Operatora: BLOCK.

ZMIANY/PLIKI: `playbook.md` (source of truth C-050), wygenerowane `dyspozycje/autobot/playbook.json`, `CLAUDE.md`, `docs/procesy/INDEX-PROCESU.md`, `.claude/skills/autobots/SKILL.md` oraz ten raport. Brak commitu, integracji, deployu i pushu. Nie modyfikowano obcych zmian w `gra/` ani innych plikach poza zakresem naprawy.

WYKONANE NAPRAWY:

- Usunięto końcowy tag `[C-050]` z treści wiersza C-050 w `playbook.md`, ponieważ generator dokleja tag mapowania automatycznie.
- Uruchomiono generator `--write` przez oficjalny source of truth; wynik: `UPDATE C-050`, liczniki `0/0` zachowane, `version -> 44`.
- Generator `--dry-run`: `OK 50`, `UPDATE 0`, `ADD 0`, `ORPHANED 0`; JSON jest zgodny z Markdownem.
- Zweryfikowano `playbook.json`: dokładnie jedna reguła zawiera C-050 i dokładnie jeden końcowy tag `[C-050]`.
- Ujednolicono wszystkie trzy wskazane szablony `STATUS` o canonical `LIMIT-5-EXCEEDED`.

TESTY:

- `node dyspozycje/autobot/tools/round-limit-guard-test.cjs` — **14/14 PASS**; guard i `lastVerdict` zachowane.
- `node dyspozycje/autobot/tools/autobot-smoke.cjs` — **11/11 PASS** po uruchomieniu z rozszerzonym dostępem. Pierwsza próba zakończyła się środowiskowym `TS5033/EPERM` przy zapisie `dyspozycje/autobot/dist-smoke`.
- `node gra/node_modules/typescript/bin/tsc -p dyspozycje/autobot/tsconfig.json --pretty false` — **PASS**, exit 0.
- `node dyspozycje/autobot/tools/process-docs-audit.cjs` — **FAIL/BLOCK**: audyt wykrywa zastane, niezwiązane zmiany w 16 plikach `gra/src/...` i `gra/tools/...` poza dokumentacyjną allowlistą. Bezpieczne rozdzielenie przez reset/checkout/clean lub przypisanie autorstwa nie jest dozwolone, więc nie naruszam tych plików.

BLOKADY: Procesowa blokada izolacji obcych zmian w `gra/` pozostaje aktywna; dowód: wynik `process-docs-audit.cjs` z listą 16 plików. Smoke był chwilowo ograniczony EPERM, ale po rozszerzonym dostępie przeszedł.
NASTĘPNY KROK: Nie dispatchować automatycznie. Wymagana decyzja orkiestratora/właściciela, jak odseparować lub zamknąć zastane zmiany `gra/`; po usunięciu blokady uruchomić Final Control.
DEPLOY-PUSH: NIE WYKONANO.


OSTATNI WERDYKT: PASS-WITH-NOTES (Operator, próba 3)
POWÓD: Podłączono wspólny `authorizeDispatch` do wszystkich znalezionych aktywnych dokumentacyjnych dispatcher/retry paths, usunięto bezwarunkowe retry, dodano `LIMIT-5-EXCEEDED` do C-044, a manual resume zachowuje `lastVerdict`. Testy tematu i generator są zielone.

## RAPORT KOŃCOWY — PRÓBA 3

ZMIANY/PLIKI: `dyspozycje/autobot/tools/round-limit-guard.cjs`; `dyspozycje/autobot/tools/round-limit-guard-test.cjs`; `.claude/skills/autobots/SKILL.md`; `.cursor/rules/potrojna-warstwa-weryfikacji.mdc`; `dyspozycje/autobot/README.md`; `dyspozycje/autobot/PROMPT-AUTOBOT-DLA-AGENTOW.md`; `playbook.md`; wygenerowane `dyspozycje/autobot/playbook.json`; ten raport. Brak commitu.

- Guard przyjmuje i zwraca `lastVerdict`; próba 6 automatycznie zwraca dokładnie `LIMIT-5-EXCEEDED`; manual resume wymaga jawnej decyzji, zachowuje ID/licznik/werdykt.
- C-044 i powiązane aktywne dokumenty zawierają canonical status oraz obowiązek guarda przed każdym automatycznym retry.
- `round-limit-guard-test.cjs`: **14/14 PASS**.
- `autobot-smoke.cjs`: **11/11 PASS**.
- Generator `--write`, następnie `--dry-run`: **OK 50, UPDATE 0, ADD 0, ORPHANED 0; brak różnic**.
- Typecheck AutoBot: **PASS**. `git diff --check`: **PASS**.
- `process-docs-audit.cjs`: FAIL wyłącznie z powodu zastanych zmian w `gra/`, poza allowlistą i nietkniętych przeze mnie.

BLOKADY: Brak blokady dla zakresu dyspozycji. Czerwony audyt worktree jest niezależny i nie może być naprawiony bez naruszenia cudzych zmian; nie oznaczam zadania jako BLOCK.
NASTĘPNY KROK: Evaluator dla tego samego ID; nie dispatchować kolejnej rundy bez guarda.
DEPLOY/PUSH: NIE WYKONANO
