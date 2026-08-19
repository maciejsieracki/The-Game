# R-PROC-AUTOBOT — AutoBot (Operator–Evaluator–integracja)

**Status:** 🟢 **TWARDA REGUŁA OBOWIĄZUJE** (Maciej 2026-08-05; routing zaktualizowany 2026-08-19) — **KAŻDA praca agenta wyłącznie w AutoBot**
**Źródło:** Maciej — „każda praca którą wykonujesz ma być teraz wykonywana w systemie AutoBot” + Architectural Spec  
**Reguła Cursor (alwaysApply):** `.cursor/rules/autobot-evaluator-operator.mdc`  
**Kod / playbook:** `dyspozycje/autobot/`

---

## Nadrzędny obieg procesu (aktywny od 2026-08-19)

**`Operator → Evaluator → finalna kontrola → integracja → READY_FOR_DEPLOY`**

**Aktywny routing modeli:** Operator (**GPT-5.6 Luna High**) → Evaluator
(**GPT-5.6 Luna High**) → finalna kontrola/integracja przez głównego orkiestratora
(**GPT-5.6 Luna Medium**). Deploy/push jest osobną bramką po `READY_FOR_DEPLOY`.

## C-043 — kanał komunikacji właściciela (Maciej 2026-08-19)

Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora. Subagenci są
kanałami technicznymi: ich raporty, pytania i werdykty wracają do orkiestratora,
który przekazuje właścicielowi wynik w głównym czacie.

To jest obowiązkowa kolejność i jedyny aktualny opis przejścia paczki przez proces:

1. **Operator** wykonuje zadanie w izolacji i składa raport z artefaktem oraz dowodami.
2. **Evaluator** jest uruchamiany automatycznie po raporcie Operatora. Orkiestrator nie
   zatrzymuje procesu i nie czeka na ponowne popychanie właściciela.
3. Po `PASS` **główny orkiestrator wykonuje finalną kontrolę**: sprawdza raporty,
   zakres, bramki i stan repozytorium. Po `FAIL` zwraca Operatorowi konkretną listę
   poprawek; nie ma statusu „gotowe”.
4. Po pozytywnej kontroli orkiestrator:
   - przygotowuje i zadaje ABC z pełnym ID, jeśli wymagana jest decyzja;
   - kieruje zatwierdzony zakres do integracji.
5. **Integracja** przygotowuje zatwierdzoną paczkę dopiero po przejściu bramek.
   **Główny orkiestrator potwierdza integrację i wystawia** `READY_FOR_DEPLOY`. To koniec
   procesu przygotowania, nie wykonany deploy ani push.

Raport Operatora nie jest zgodą na integrację ani publikację. Operator i Evaluator nie
wykonują samowolnego merge, deployu ani pushu.

## Sygnalizacja subagentów i zarządzanie slotami

Każdy subagent przekazuje zakończenie w raporcie terminalnym z polami: `STATUS` (`PASS`,
`PASS-WITH-NOTES`, `FAIL`, `BLOCK`, `TIMEOUT` albo `INFRA`), pełne ID tematu,
zmiany/commity, testy, blokady, następny krok oraz `DEPLOY/PUSH: wykonano albo nie wykonano`.
Sam komunikat „gotowe” lub wskaźnik UI `działa` nie potwierdza zakończenia. `GOTÓW DO TESTU`
jest wyłącznie sygnałem pośrednim i nie zastępuje raportu terminalnego. `PASS-WITH-NOTES`
nie kończy procesu; może przejść dalej wyłącznie z jawnymi, nieblokującymi uwagami
zaakceptowanymi przez finalną kontrolę.
Raport Operatora automatycznie uruchamia Evaluatora. Po zakończeniu roli orkiestrator zamyka
subagenta, ponieważ zakończony, lecz otwarty subagent nadal zajmuje slot. Limit wynosi
6 otwartych subagentów. Brak ruchu w transcriptcie przez 7 minut jest sygnałem `ZWIS`;
orkiestrator weryfikuje transcript i przejmuje temat.
Jeżeli istnieją niezablokowane tematy, wszystkie 6 slotów powinno być stale wykorzystane.
Po terminalnym raporcie zakończonego subagenta należy go zamknąć i natychmiast uruchomić
następny wymagany etap albo kolejny niezależny temat. Wolny slot bez uzasadnionej blokady
jest błędem operacyjnym.

## Ciągła pętla domknięcia

AutoBot nie jest jednorazową delegacją. Ten sam temat pozostaje aktywny pod tym samym ID
i przechodzi kolejne rundy aż do osiągnięcia celu:

```text
Operator PASS → Evaluator
Evaluator FAIL/BLOCK techniczny → Operator z listą poprawek → Evaluator
Evaluator PASS → finalna kontrola
finalna kontrola FAIL → Operator → Evaluator → finalna kontrola
finalna kontrola PASS → integracja → READY_FOR_DEPLOY → koniec procesu
```

`BLOCK` wymagający decyzji właściciela zatrzymuje tylko ten temat i uruchamia pełne ABC;
nie zatrzymuje niezależnych tematów. `FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA` i `ZWIS`
uruchamiają bez czekania `Operator → Evaluator` z tym samym ID; przy ZWIS orkiestrator
przejmuje wykonanie. Po `FAIL` orkiestrator nie czeka na kolejne
polecenie właściciela i nie tworzy nowego ID dla tej samej usterki. Temat można zatrzymać
tylko z powodu oczekiwania na ABC albo wyraźnego anulowania przez właściciela. `PASS`
Evaluatora sam w sobie nie oznacza końca; koniec procesu następuje po pozytywnej finalnej
kontroli i integracji, gdy istnieje izolowana wersja `READY_FOR_DEPLOY`
z prawidłową allowlistą, bez niezwiązanych zmian, z przejściem wszystkich bramek i gotowa do
oddania na ROBOCZĄ. Dopiero to jest koniec danego procesu przygotowania. Jeżeli poprawka nie została
prawidłowo przygotowana do deployu, temat nie jest zakończony i biegnie dalej w cyklu.
Sam deploy pozostaje osobną bramką
na hasło `deploy` i nie jest wykonywany automatycznie.

## Komenda właściciela: `sprawdź`

`sprawdź` oznacza pełny audyt: cała bieżąca pula + historyczne `not_found` do reconciliacji.
terminalny, ostatni ruch, lektura raportu, klasyfikacja wyniku (`PASS`, `PASS-WITH-NOTES`, `FAIL`,
`BLOCK`, `TIMEOUT`, `INFRA`, `READY_FOR_DEPLOY` albo niepewne), zamknięcie zakończonych oraz
uruchomienie następnego etapu dla każdego tematu. `not_found` bez raportu wymaga odtworzenia
statusu z transcriptu/logu albo zgłoszenia braku dowodu.

## Cel

Self-improving agent framework w patternie **Evaluator–Operator**:
- **Operator** wykonuje zadanie według `playbook.json`
- **Evaluator** mierzy twarde metryki, liczy deltę, robi postmortem i aktualizuje playbook

**U nas:** **nie wolno** wykonywać pracy „obok” systemu. Każda paczka przechodzi
`Operator → Evaluator → finalna kontrola → integracja → READY_FOR_DEPLOY`.

---

## Mapowanie na nasze role

| AutoBot | U nas |
|---------|--------|
| **OperatorAgent** | **GPT-5.6 Luna High** — czyta playbook + dyspozycję, wykonuje kod/testy/docs; zapisuje liczbę rund i poprawek |
| **EvaluatorAgent** | **GPT-5.6 Luna High** — niezależny adwokat diabła, metryki, **SCOPE + regresja** (`R-PROC-AUTOBOT-EVAL-SCOPE`) |
| **Finalna kontrola / integracja** | **GPT-5.6 Luna Medium** — kontrola, status/ABC, skierowanie do integracji |
| **playbook.json** | `dyspozycje/autobot/playbook.json` — reguły z win/loss / win_rate |
| **Guardrails** | Zakaz merge→main / deploy bez hasła `deploy` / krytyczne = bramka Macieja |
| **Feature pruning** | Nie pakować do kontekstu Operatora atrybutów bez mocy predykcyjnej (śmieciowy kontekst) |

**Potrójna warstwa** (`R-PROC-POTROJNA-WARSTWA`) = część obiegu Operator → Evaluator →
finalna kontrola. Integracja i deploy/push są kolejnymi, odrębnymi bramkami; AutoBot =
szersza pętla uczenia się z playbooka.

`READY_FOR_DEPLOY` jest statusem orkiestratora po finalnej kontroli i integracji, a nie
werdyktem Operatora ani Evaluatora. Operator raportuje wynik wykonania, Evaluator raportuje
niezależną ocenę, a orkiestrator sprawdza artefakt i dopiero wtedy kieruje go do integracji.

---

## Twarde guardrails (NIENEGOCJOWALNE)

1. Operator **NIE** merge do `main`, **NIE** deploy ROBOCZA/KANON/FINALNA bez hasła Macieja.
2. Krytyczne akcje (promocja kanonu, finalna, force-push, kasowanie danych gry) → **mandatory human approval**.
3. „Zwycięzca testu” / zmiana progu w playbooku dopiero po **istotności statystycznej** lub **opóźnieniu czasowym** (nie po 1 runie).
4. Reguły z `win_rate < 30%` (min. N runów) → **deprecate** (nie kasuj historii — status `deprecated`).

---

## Scaffold (ten PR)

```
dyspozycje/autobot/
  playbook.json
  src/types.ts
  src/playbook-manager.ts
  src/operator-agent.ts
  src/evaluator-agent.ts
  src/feature-pruning.ts
  src/guardrails.ts
  src/logging.ts
  logs/
  README.md
```

Następne iteracje (osobne zadania): podpięcie metryk z `WERSJE.md` / testów / playtest rejestru → UI dashboard postmortems.

---

## Spec v1 — 5 modułów (2026-08-05)

Pełna implementacja w `dyspozycje/autobot/`:

| Moduł | Plik(i) | Kluczowe API |
|-------|---------|--------------|
| **1. Hard Metric Evaluator** | `src/hard-metrics.ts`, `src/evaluator-agent.ts` | `computePerformanceScore(metrics, complexityPenalty)` · `DevProfileScorer` / `SalesProfileScorer` / `TradingProfileScorer` · `EvaluationResult.performanceScore`, `metricBefore`/`metricAfter` |
| **2. Self-Pruning** | `src/feature-pruning.ts` | `pruneFeatureWeights()` — Pearson corr vs success; \|corr\| < 0.05 → usuń z kontekstu; `action_taken: "Removed feature X"` |
| **3. Playbook** | `playbook.json`, `src/playbook-manager.ts` | `rules[].rule_text`, `win_count`/`fail_count`, status `ACTIVE`\|`RETIRED`\|`QUARANTINE`, `min_confidence_threshold`, `quarantine_rules`, `getOperatorSystemRules()` |
| **4. Guardrails** | `src/guardrails.ts` | `assertProdIsolation` · HITL (no merge/mass-mail/real-money) · `canDeclareWinner` / `assertEvaluationDelay` (N≥1000 **LUB** ≥48h) |
| **5. Dashboard Logger** | `src/logging.ts` | JSONL: `run_id`, `timestamp`, `metric_before`, `metric_after`, `delta_percentage`, `postmortem_reasoning`, `action_taken` |

**Bramki jakości:** `node gra/node_modules/typescript/bin/tsc -p dyspozycje/autobot/tsconfig.json` · `node dyspozycje/autobot/tools/autobot-smoke.cjs`

**Reguły Civ w playbook:** triple-layer (rule_101), numer-abc-deploy (rule_102), no-npm-run-build (rule_103), lane-no-main-ts (rule_104), **eval-scope-no-regression** (rule_105).

---

## Checklista Evaluator — SCOPE (rule_105)

**Kanon:** `docs/decyzje/R-PROC-AUTOBOT-EVAL-SCOPE.md`

| Oś | Pytanie |
|----|---------|
| **SCOPE** | Czy każda linia diffu wynika z problemu/AC tematu? |
| **DIFF-MINIMAL** | Czy brak refaktoru „przy okazji” i cudzych plików bez handoffu? |
| **REGRESSION** | Czy nie cofa wcześniejszych fixów / nie psuje innego zachowania? |
| **COUPLING** | Czy nie wprowadza sprzężeń poza zakresem tematu? |

**Werdykt:** naruszenie → **FAIL**; **PASS-WITH-NOTES** dopuszczalne wyłącznie z jawnymi,
nieblokującymi uwagami i bez uwag wymagających blokady.

---

## v2 — Protokół AutoBot (Maciej 2026-08-07)

**Źródło:** trzy dokumenty dostarczone przez Macieja (protokół generyczny, wypracowany poza tym repo, teraz zintegrowany tutaj) — kopie kanoniczne: `dyspozycje/autobot/protokol-v1.2/AUTOBOT-PROMPT-v1.2.md` · `AUTOBOT-opis-i-wdrozenie-v1.2.md` · `playbook-zrodlowy-przykladowy.md` (przykładowy playbook z innego wdrożenia, referencyjny wzór formatu — NIE dane tego projektu).

Zasada nadrzędna v2, cytat: *„Każdy może popełnić błąd. Nie wolno popełnić tego samego błędu drugi raz."*

### Nowe pola `playbook.json` (typy: `src/types.ts`)

| Pole | Rola |
|------|------|
| `errorLog: ErrorLogEntry[]` | **Rejestr błędów** — chronologiczny zapis KONKRETNYCH pomyłek (co się stało / przyczyna źródłowa / ID reguły zapobiegawczej / czy to recydywa). Odrębne od `rules[]` (liczniki win/fail) — to czytelna dla człowieka lista „NIGDY WIĘCEJ". |
| `conclusionsJournal: ConclusionJournalEntry[]` | **Dziennik wniosków** — „co zrobiono → skutek (miara zewnętrzna) → wniosek", najnowsze na górze. Ważniejszy niż same reguły — pokazuje DLACZEGO reguły wyglądają tak, a nie inaczej. |
| `openMatters: OpenMatter[]` | **Sprawy otwarte** — zadania bez jeszcze zmierzonego wyniku; przegląd obowiązkowy na starcie sesji AutoBot. |

### Status `PROTECTED` (alias PL: CHRONIONA)

Dodany do `RuleStatusCanonical`. Bariery bezpieczeństwa i reguły zatwierdzone WPROST przez Macieja — nie podlegają licznikom win/fail (`recordRuleOutcome` wymaga `status===ACTIVE`) ani automatycznemu `RETIRED` (`retireWeakRules` pomija wszystko poza `ACTIVE`). **Status PROTECTED nadaje wyłącznie człowiek** — agent może go tylko zaproponować.

### Protokół błędu — R-PROC-AUTOBOT-BLAD (5 kroków, natychmiast po każdym błędzie)

Błędem jest: Maciej poprawił lub odrzucił efekt; liczba nie przeszła weryfikacji; zadanie zrozumiane inaczej niż zamierzone; coś trzeba było przerabiać; agent sam zauważył pomyłkę.

1. **NAPRAW** — najpierw poprawka, bez usprawiedliwień.
2. **PRZYCZYNA, NIE WINNY** — „co zrobić inaczej następnym razem", nie „kto zawinił". Odpowiedź „będę uważniejszy” jest ZAKAZANA — wniosek musi zmieniać procedurę.
3. **SPRAWDŹ WSTECZ** — czy ta sama pomyłka siedzi w innych miejscach bieżącej i wcześniejszej pracy? Wskaż i popraw wszystkie wystąpienia.
4. **ZAPISZ DO `errorLog`** — data, co się stało, przyczyna, ID reguły zapobiegawczej.
5. **PRZEKUJ W REGUŁĘ** — nowa reguła w `rules[]`, status `ACTIVE`, licznik **0/0** (nie backfilluj liczników — start zawsze od zera, zgodnie z protokołem). O dalszym losie zdecydują liczniki po min. `thresholds.minRunsForSignificance` (**10**, podniesione z 5) zastosowaniach.

**Recydywa** (powtórka błędu już obecnego w `errorLog`) = incydent krytyczny — zgłoś Maciejowi wprost, zaznacz `isRecidivism: true`, zaproponuj mocniejsze zabezpieczenie. Realny przykład z tej sesji: dwukrotne usunięcie worktree z niescaloną pracą Operatora (`err_20260806_01`) → `rule_114`.

### Progi statusu reguły (v2, ujednolicone z `thresholds`)

Skuteczność = `win_count / (win_count + fail_count)`, liczona od min. **10** zastosowań (`minRunsForSignificance`):

- **< 30%** → `RETIRED` (znika z promptu Operatora, zostaje w pliku; przywrócić może wyłącznie Maciej, przywrócenie zeruje liczniki),
- **30–60%** → `QUARANTINE`/„W OBSERWACJI” — **nadal stosowana** (reguła odstawiona na zawsze nigdy nie zbierze danych na swoją obronę),
- **> 60%** → `ACTIVE`,
- **`PROTECTED`** — poza tym cyklem, patrz wyżej.

### Seed 2026-08-07

`rules[]` rozszerzone o `rule_110`–`rule_114` (test-vs-silnik, ABC-balans, escaping skryptów Workflow, worktree base-drift, worktree retention przed usunięciem) — każda 0/0, wyprowadzona z realnego incydentu w `errorLog` tej sesji. `rule_111` (ABC dla balansu) ustawiona od razu jako `PROTECTED`, bo Maciej zatwierdził ją wprost (patrz `PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md` §3b, `R-PROC-ABC-BALANS`).

---

## Pytanie ABC jako turniej (R-PROC-AUTOBOT-ABC-TURNIEJ · 2026-08-08)

Kanon: [`R-PROC-AUTOBOT-ABC-TURNIEJ.md`](R-PROC-AUTOBOT-ABC-TURNIEJ.md) · playbook `C-018`/`rule_126`.

Każde NOWE pytanie ABC (temat bez literowej odpowiedzi właściciela jeszcze) dostaje dwóch niezależnych
Proponentów (drugi bez podglądu pierwszego) + Sędziego (rola Evaluatora), który wybiera zwycięzcę albo
syntetyzuje finalną wersję — dopiero ta wersja trafia do właściciela. Nie dotyczy tematów już
rozstrzygniętych literą (ECHO + zapis wystarczy) ani czysto inżynierskich decyzji bez wpływu na
gameplay/UX/dane gracza.

## P0 fix (R-PROC-AUTOBOT-P0 · 2026-08-05)

Po FAIL adwokata diabła (`bc-43dbc71b`):

1. **Dev scorer** — `typecheckOk`/`buildPassed`/`linterPassed` wymagają jawnego `=== true`; test signal wymaga `testsPassed` lub `testsFailed`; pusty metrics → score 0.
2. **Run history** — `logs/run-history.jsonl` via `appendRunHistory`/`readRunHistory`; `pruneFeatureWeights` na historii (≥ `minRunsForSignificance`).
3. **Evaluation delay** — `retireWeakRules` + prune pomijane gdy delay niespełniony; `recordRuleOutcome` zawsze; `allowPlaybookMutation` tylko smoke/test.
4. **Guardrails deny-by-default** — nieznany `actionId` → `forbidden`; semantika merge/deploy-force blokowana.
5. **RETIRED** — `retireWeakRules` ustawia `status=RETIRED` (kwarantanna bez nadpisywania na QUARANTINE).

---

## Integracja z Ultracode/Workflow (Maciej 2026-08-12)

Polecenie: *„przeczytaj jeszcze raz całe zasady autobots i dostosuj je do pracy ultracode
tak żeby się uzupełniały i razem usprawniały pracę oraz generowało jak najmniej błędów."*
Pełny szczegół (KROK 0, tabela modeli, adversarialna weryfikacja, co zostaje ręczne) żyje w
`.cursor/rules/autobot-evaluator-operator.mdc` §„Integracja z Ultracode/Workflow" — tu
streszczenie kanoniczne.

**Workflow ≠ AutoBot.** Workflow (Ultracode) jest **narzędziem wykonawczym** (skrypt JS z
`agent()`/`pipeline()`/`parallel()`/`phase()`, wbudowana współbieżność i izolacja
worktree per agent). AutoBot pozostaje **regułą procesu** z tego dokumentu — Workflow ma
JĄ automatyzować, nie zastępować. Guardrails z sekcji „Twarde guardrails" wyżej (bez
merge→`main`, bez deploy bez hasła, mandatory human approval na akcje krytyczne) obowiązują
identycznie, czy praca idzie przez Workflow, czy przez ręczny dispatch.

**Mapowanie ról (aktywny routing):**

| Rola AutoBot | Workflow | Model |
|---|---|---|
| Operator | `phase('Operator')` | GPT-5.6 Luna High |
| Evaluator | `phase('Evaluator')` | GPT-5.6 Luna High |

Obie fazy mogą być uruchomione w jednym przebiegu Workflow albo sekwencyjnie po raporcie
Operatora, ale **Evaluator zawsze startuje automatycznie** i nie wymaga ponownego sygnału
właściciela. To
strukturalne zabezpieczenie przed powtórką incydentu tej sesji, w którym ~11 zmian
Operatora zostało scalonych i skomitowanych bez pośredniego Evaluatora. `pipeline()`
zastępuje ręczne sekwencjonowanie „poczekaj → scal → dopiero Evaluator": temat A może być
u Evaluatora, gdy temat B jeszcze pracuje u Operatora.

**KROK 0 (weryfikacja bazy worktree)** obowiązkowy jako pierwszy akapit każdego promptu
`agent()` z `isolation:'worktree'` — dokładny szablon w `.mdc` wyżej; adresuje recydywę
„worktree na złej bazie" (subagent widzi kod sprzed jakiejś funkcji i błędnie raportuje
brak).

**Adversarialna weryfikacja:** domyślnie 1 Evaluator; **3 niezależni, głosujący większością**
dla zmian dotykających silnika bitwy, save/load, lub migracji danych kanonicznych
(`gra/data/**`).

**Zawsze poza Workflow, zawsze ręką orkiestratora:** finalna kontrola, integracja,
`git commit`/`push`, wpisy do `PYTANIA-OTWARTE.md`/`WERSJE.md`/`REJESTR-PROSB-I-ZADAN.md`/
`KANAL-PRACA.md` oraz cały deploy. Workflow kończy na przygotowanej paczce
`READY_FOR_DEPLOY`, a deploy wymaga dalszych bramek i autoryzacji właściciela.

Reguła 0b (orkiestrator nie ocenia sam siebie) obowiązuje **także** przy ręcznym scalaniu
konfliktów (`git apply -3` z konfliktem) — to też jest zmiana zapisana do repozytorium i
idzie do kolejki Evaluatora, „to tylko scalanie" nie zwalnia.
