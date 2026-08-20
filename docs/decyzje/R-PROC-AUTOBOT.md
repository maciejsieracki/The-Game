# R-PROC-AUTOBOT — aktywna norma procesu

**Status:** obowiązujący opis dla człowieka. Mapa źródeł prawdy i lokalizacja artefaktów
znajdują się w [`INDEX-PROCESU.md`](../procesy/INDEX-PROCESU.md); techniczny skrót egzekwuje
[reguła Cursor](../../.cursor/rules/autobot-evaluator-operator.mdc), a instrukcja wykonawcza
jest w [skillu](../../.claude/skills/autobots/SKILL.md).

## 1. Role i kolejność

```text
Operator GPT-5.6 Luna High
  → Evaluator GPT-5.6 Luna High
  → Final Control GPT-5.6 Luna High (osobny subagent)
  → integracja głównego orkiestratora GPT-5.6 Luna Medium
  → READY_FOR_DEPLOY
  → osobna bramka deploy/push
```

| Etap | Odpowiedzialność | Zakaz |
|---|---|---|
| Operator | Wykonuje jeden temat w izolacji, zgodnie z GOAL i allowlistą; zapisuje artefakt, testy i raport | Nie ocenia własnej pracy, nie integruje, nie deployuje, nie pushuje |
| Evaluator | Niezależnie sprawdza SCOPE, regresję, testy, dowody i blokady; wydaje werdykt. Dla kodu obowiązują dodatkowo trzy twarde FAIL-e domeny gry (happy-path bez brzegów, asymetria gracz/AI/MP, luka save/load) — pełne kryteria w [`R-PROC-AUTOBOT-EVAL-STRICT.md`](R-PROC-AUTOBOT-EVAL-STRICT.md), [`-EDGE`](R-PROC-AUTOBOT-EVAL-STRICT-EDGE.md), [`-PARITY`](R-PROC-AUTOBOT-EVAL-STRICT-PARITY.md), [`-SAVE`](R-PROC-AUTOBOT-EVAL-STRICT-SAVE.md) i [`-SCOPE`](R-PROC-AUTOBOT-EVAL-SCOPE.md) | Nie zastępuje Operatora i nie publikuje |
| Final Control | Kontroluje kompletność śladu, zgodność z GOAL i gotowość do integracji | Nie integruje i nie wystawia samodzielnie `READY_FOR_DEPLOY` |
| Orkiestrator | Weryfikuje faktyczny Git i integruje wyłącznie zatwierdzoną allowlistę | Nie omija raportów ani bramek |
| Deploy/push | Publikuje po `READY_FOR_DEPLOY` i osobnej autoryzacji | Nie wynika z commita ani raportu |

## 2. GOAL, ID i izolacja

Przed dispatchiem każdy temat ma pełne ID, jawny `GOAL`, mierzalne kryteria końca,
allowlistę plików, bazę worktree i plan testów. Zgłoszenie trafia do rejestru; Operator
nie rozszerza zakresu „przy okazji”. Każda zapisana zmiana wymaga niezależnej kontroli.

## 3. Pętla domknięcia

Temat zachowuje to samo ID przez wszystkie rundy:

```text
Operator → Evaluator → Final Control → integracja → READY_FOR_DEPLOY
   ↑            │              │
   └────────────┴──────────────┘  FAIL / BLOCK / TIMEOUT / INFRA / ZWIS / niegotowość
```

Po raporcie Operatora Evaluator uruchamia się automatycznie. `PASS` prowadzi do Final
Control, następnie do integracji. Każdy wymieniony wynik negatywny wraca bez czekania do
Operatora, Evaluatora i Final Control z tym samym ID. `ZWIS` nie anuluje tematu; watchdog
sprawdza stan, a orkiestrator przejmuje pracę. Jedyną pauzą jest ABC wymagające decyzji
właściciela; niezależne tematy nadal działają.

## 4. Rejestry i artefakty

- `dyspozycje/REJESTR-PROSB-I-ZADAN.md` — jeden aktualny status tematu;
- `dyspozycje/PYTANIA-OTWARTE.md` — wyłącznie aktywne ABC oraz ECHO i odsyłacze zamkniętych decyzji;
- `docs/decyzje/<ID>.md` — decyzja właściciela, wariant, data, kryteria i konsekwencje;
- `dyspozycje/autobot/runs/<ID>/00-dispatch.md … 04-integration.md` — pełny ślad obiegu;
- `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` — jeden bieżący stan przejęcia;
- `dyspozycje/_handoff/KANAL-PRACA.md` — krótkie przekazania między sesjami;
- `dyspozycje/WERSJE.md` — tylko faktycznie opublikowane wersje ROBOCZEJ/KANONU/FINALNEJ;
- `dyspozycje/autobot/logs/` — historyczne/legacy logi, nie nowe źródło routingu.

Raport etapu zawiera:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <dokładny wynik albo powód pominięcia>
BLOKADY: <lista albo brak>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: WYKONANO albo NIE WYKONANO
```

## 5. ABC, integracja i deploy

Pełne ABC zawiera ID, sytuację, cel, powód, A/B/C, za/przeciw i rekomendację. Właściciel
odpowiada w głównym czacie; orkiestrator zapisuje ECHO i decyzję plikowo. Subagenci nie
prowadzą równoległego kanału decyzji.

**Nie zamieniaj odpowiedzi „chyba", luźnej rozmowy ani rekomendacji agenta w formalną
decyzję ABC.** ECHO zapisuje się wyłącznie po jednoznacznej odpowiedzi właściciela w
formie pełne ID + litera. Ta sama bariera jest zduplikowana w
[`.cursor/rules/decyzje-echo.mdc`](../../.cursor/rules/decyzje-echo.mdc) (`alwaysApply: true`).

Każde NOWE pytanie ABC (temat bez odpowiedzi literą) przechodzi przez obowiązkowy turniej
dwóch niezależnych projektów przed pokazaniem właścicielowi. Pełna procedura:
[`R-PROC-AUTOBOT-ABC-TURNIEJ.md`](R-PROC-AUTOBOT-ABC-TURNIEJ.md) i `playbook.md` → C-018.

## 5a. Narzędzie orkiestracji wieloagentowej — używaj, gdy dostępne

Jeśli narzędzie wykonawcze, którym pracujesz, ma zdolność agentic workflow
(przypisanie modelu i poziomu wysiłku/effort per rola, uruchamianie wielu
subagentów w jednym skrypcie, `pipeline()`/`parallel()`) — **używaj go zawsze
do dispatchu Operatora i Evaluatora**, nie pojedynczych, ręcznych wywołań
agenta. To jedyny sposób ustawić `effort` per rola; pojedynczy dispatch agenta
bez takiego narzędzia nie ma tego parametru w ogóle. Wyjątek: narzędzie
niedostępne w danej sesji — wtedy pojedynczy dispatch pozostaje w pełni
poprawny.

**Dla sesji Claude Code (potwierdzone przez właściciela, 2026-08-20):**
Operator → **Sonnet 5, effort Medium**; Evaluator → **Sonnet 5, effort High**.
Oba na tym samym modelu, różni je wyłącznie wysiłek — Evaluator dostaje więcej
przestrzeni na adwersaryjne rozumowanie, nie inny, droższy model. Ta reguła
dotyczy WYŁĄCZNIE sesji Claude Code — nazwy modeli w §1 wyżej („GPT-5.6 Luna
High/Medium") odnoszą się do innego narzędzia wykonawczego pracującego nad
tym samym repozytorium i nie są tu nadpisywane. Pełny opis integracji z
narzędziem orkiestracji: `AUTOBOT-UNIVERSAL.md` §11.

## 6. Bramki

Uruchamiaj z katalogu `gra/`. Zweryfikowane świeżo 2026-08-20 na czystym checkoucie
`main` — to jest punkt odniesienia na dziś, nie stała wartość; jeśli wynik odbiega,
porównaj z aktualnym `main` przed uznaniem czegoś za regresję, nie ufaj tej liczbie
z pamięci przy kolejnym użyciu:

| Bramka | Komenda | Wynik referencyjny |
|---|---|---|
| TypeScript | `npx tsc --noEmit` (wymaga `node_modules`; wersja projektu 5.9.3 — bez tego wynik jest niewiarygodny, patrz playbook C-029) | 0 błędów |
| Logika | `node tools/logic-test.cjs` | 213/213 |
| Drzewo technologii | `node tools/tech-tree-test.cjs` | 19/19 |
| Badania | `node tools/research-test.cjs` | 33/33 |
| Wymiana jednostek | `node tools/unit-replace-test.cjs` | 13/13 |
| Walka | `node tools/combat-test.cjs` | 6/6 |
| Moc jednostek | `node tools/unit-power-test.cjs` | **czerwony pre-istniejąco: 4 pass / 2 fail** — nie regresja, nie naprawiaj przy okazji |
| Generator mapy | `node tools/map-gen-regression-test.cjs` | determinizm A=B + 0 rzek bez ujścia; progi czasowe to pomiar wydajności, nie regresja — wolny (rzędu minut), uruchom osobno |

Zawsze czytaj kod wyjścia testu, nie procesu opakowującego. Worktree bez
`gra/node_modules` daje mylący wynik `tsc` w obie strony — patrz playbook C-029.

## 7. Bariery w kodzie, nie tylko w prompcie

`dyspozycje/autobot/src/guardrails.ts` wymusza zakazy mechanicznie, deny-by-default:
akcja spoza katalogu jest odrzucana (`assertActionAllowed`). Siedem z dziesięciu
pozycji `FORBIDDEN_ACTION_IDS` jest zablokowanych twardo, bez furtki: `git-merge-main`,
`git-push-main-force`, `npm-run-build-gra`, `npm-run-dev-gra`, `delete-gra-data`,
`mass-mail`, `real-money-transfer`. Pozostałe trzy (`deploy-robocza`/`-kanon`/`-finalna`)
wymagają jednocześnie `humanApproved` i `deployPasswordGiven`. `assertProdIsolation`
blokuje wszystko z tej listy przy `env=production`. To jest ostatnia linia obrony, gdy
pętla Operator→Evaluator zawiedzie — nie zastępuje jej czytania.

**Rozstrzygnięte (2026-08-20, decyzja właściciela — poprzedni rozjazd spec vs. żywy
plik zamknięty):** `minRunsForSignificance = 10` jest teraz kanoniczne wszędzie —
specyfikacja (`R-PROC-AUTOBOT` §v2, `dyspozycje/autobot/README.md`), domyślna wartość
w kodzie (`playbook-manager.ts`, zawsze była `10`) i żywy `dyspozycje/autobot/playbook.json`
(poprawiony z `5` na `10`) są zgodne. Nie ma już potrzeby odczytywać wartości z pliku
zamiast z dokumentu.

**Mechanizm wycofywania słabych reguł zmieniony (2026-08-20, decyzja właściciela):**
`retireWeakRules` (`dyspozycje/autobot/src/playbook-manager.ts`) już NIE wycofuje
cicho zasady poniżej `deprecateBelowWinRate` po osiągnięciu progu istotności.
Zamiast automatycznego `status='RETIRED'` + przeniesienia do `quarantine_rules`
(co czyniło regułę niewidoczną dla każdego przyszłego Operatora bez żadnego
powiadomienia człowieka), zasada dostaje status `REVIEW` i **zostaje** w `rules[]`
— nic nie znika z pliku ani z historii. `getOperatorSystemRules` nadal filtruje po
`status === 'ACTIVE'`, więc REVIEW przestaje być sugerowana Operatorowi (efekt
zamierzony — nie ciągniemy dalej reguły o niskiej skuteczności), ale fakt trafia
jawnie do `dyspozycje/PYTANIA-OTWARTE.md` (dopisywane przez
`evaluator-agent.ts` przy wywołaniu `retireWeakRules` w `evaluate()`, tekst wpisu
budowany przez `formatReviewFlagForOpenQuestions` w `playbook-manager.ts`).
Decyzję — zostawić, poprawić warunek stosowania, czy świadomie wycofać
(status `RETIRED`) — podejmuje wyłącznie właściciel. Status `RETIRED` istnieje
nadal jako oznaczenie świadomego, ręcznego wycofania.

## 8. Hasła właściciela

| Hasło | Znaczenie |
|---|---|
| `sprawdź` | pełny audyt bieżącej puli i historycznych `not_found`: status terminalny, każdy raport, klasyfikacja, zamknięcie zakończonych, uruchomienie następnej fazy |
| `push`, `deploy` | osobne polecenia publikacyjne, wyłącznie po `READY_FOR_DEPLOY` |
| `format`, `ABC` | przepisz pytanie w pełnej formie A/B/C |
| `raport` | zestawienie statusu w formacie dziesięciu kategorii — pełny kanon: [`R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md`](R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md) |

**Zmieniasz reguły samego AutoBota (nie kod gry)?** Najpierw przeczytaj
[`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`](../../dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md) —
mapa wszystkich warstw mechanizmu.

Final Control raportuje „gotowość do integracji: TAK/NIE”. Orkiestrator przed integracją
sprawdza raporty, GOAL, allowlistę, diff, commit, testy, blokady i faktyczny worktree.
Po faktycznej integracji może wystawić `READY_FOR_DEPLOY`. Deploy/push jest późniejszą,
osobną bramką i nie jest wykonywany automatycznie.

Historyczne routingi, dawne modele i snapshoty zachowano w
[`docs/archiwum-procesu/`](../archiwum-procesu/); nie są aktywną instrukcją.
