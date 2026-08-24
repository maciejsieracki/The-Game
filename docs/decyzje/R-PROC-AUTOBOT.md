# R-PROC-AUTOBOT — aktywna norma procesu

**Status:** obowiązujący opis dla człowieka. Mapa źródeł prawdy i lokalizacja artefaktów
znajdują się w [`INDEX-PROCESU.md`](../procesy/INDEX-PROCESU.md); techniczny skrót egzekwuje
[reguła Cursor](../../.cursor/rules/autobot-evaluator-operator.mdc), a instrukcja wykonawcza
jest w [skillu](../../.claude/skills/autobots/SKILL.md).

**Struktura tego dokumentu.** §1–§8 są niezmienioną, obowiązującą normą procesu
(role, pętla, rejestry, ABC, ścieżki dispatchu, bramki, bariery w kodzie, hasła
właściciela) — numeracja jest stabilna, bo odwołują się do niej inne pliki.
§9–§16 to warstwa dodana 2026-08-23 przy przebudowie na nowy szkielet AutoBota:
granice nienaruszalne domeny gry (§9), podział decyzji właściciel/orkiestrator
i test zrozumiałości pytania (§10), zasada czystości raportu (§11), progi
podziału tematu na węzły (§12), dyscyplina źródeł i korekt (§13), dyscyplina
zakresu (§14), cztery obowiązkowe pola promptu (§15) oraz jawne checklisty
Evaluatora i Final Control (§16). Wypełnienie parametrów tego projektu
(modele, liczby, ścieżki, obserwowane tryby samooszukiwania) jest w
[`civ-autobot/SKILL.md`](../../.claude/skills/civ-autobot/SKILL.md); sam,
domenowo-neutralny szkielet — w
[`autobots/SKILL.md`](../../.claude/skills/autobots/SKILL.md).

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

Final Control jest — dokładnie jak Operator i Evaluator — zawsze osobnym subagentem;
nigdy nie jest wykonywany bezpośrednio przez głównego/orkiestrującego agenta.

### 1a. Jawny model dispatchu Codex

Przy użyciu `multi_agent_v1` Operator i Evaluator są uruchamiani jawnie z
`model="gpt-5.6-luna"` oraz `reasoning_effort="high"`. Nie wolno dziedziczyć modelu
po orkiestratorze. Final Control używa Luna High, a integracja orkiestratora Luna
Medium. Żądany model i effort muszą być zapisane w `00-dispatch.md` oraz raporcie etapu.

### 1b. Co NIE jest dowodem zakończenia

Najczęstsze źródło fałszywego „gotowe". Żadna z poniższych rzeczy **sama w sobie**
nie dowodzi, że temat jest zamknięty:

| To nie jest dowód | Dlaczego |
|---|---|
| Raport `PASS` | opisuje pracę, nie jej skutek w `main` |
| Nazwa gałęzi / worktree | nazwa miejsca pracy nie jest stanem |
| Commit | zapis punktu kontrolnego, nie integracja |
| Widoczny status subagenta w UI narzędzia | narzędzie pokazuje przebieg, nie wynik |
| Deklaracja „zrobione" | deklaracja bez artefaktu jest niczym |
| Brak artefaktu | brak dowodu to nie jest dowód |

Dowodem jest **faktyczny stan w `main` plus zielone bramki na tym stanie**,
sprawdzone niezależnie od Operatora. Weryfikację „czy to już wdrożone" rób
wyłącznie komendą `git merge-base --is-ancestor <commit_funkcji> <commit_release>`,
nigdy z pamięci (playbook C-056).

## 2. GOAL, ID i izolacja

Przed dispatchiem każdy temat ma pełne ID, jawny `GOAL`, mierzalne kryteria końca,
allowlistę plików, bazę worktree i plan testów. Zgłoszenie trafia do rejestru; Operator
nie rozszerza zakresu „przy okazji”. Każda zapisana zmiana wymaga niezależnej kontroli.

### 2a. Zapis dispatchu — przed dispatchem, nie po

`dyspozycje/autobot/runs/<ID>/00-dispatch.md` powstaje **zanim** ruszy Operator.
Poza polami, które już niesie (ID, `GOAL`, kryteria końca, allowlista, izolacja,
plan testów, model+effort per rola), zapis musi zawierać **trzy składniki pętli**:

| Składnik | Co odpowiada |
|---|---|
| **Wyzwalacz** | dlaczego ten temat startuje **teraz** i kto tak zdecydował |
| **Zadanie** | co ma być prawdą po zakończeniu (to samo zdanie co `GOAL`) |
| **Kryterium** | binarne `PRAWDA`/`FAŁSZ` plus nazwane bramki i testy tematu |

Dopuszczalne wyzwalacze: decyzja właściciela (podaj ID ECHO), odblokowanie
zależności (podaj co się odblokowało), powrót po `FAIL` (podaj numer rundy),
przegląd okresowy, zdarzenie zewnętrzne (dla Ścieżki C — pole `TRIGGER`).
**„Bo była kolej" nie jest wyzwalaczem** — jeśli nie umiesz go nazwać, temat
prawdopodobnie nie powinien jeszcze startować.

**Dispatch bez tego pliku jest naruszeniem procesu** — bez niego nie da się
później sprawdzić, czy `GOAL` nie przesunął się w trakcie (kanon C-044, C-051).

### 2b. Sekwencjonowanie i izolacja worktree

Jeden temat = jeden worktree = jeden aktywny przebieg Operatora. Baza worktree
jest wskazywana **jawnie**; `isolation:"worktree"` zawsze zakłada worktree od
`main`, nigdy od bieżącej gałęzi sesji — gdy zlecenie wymaga najnowszego stanu
gałęzi sesji, prompt musi to jawnie rozstrzygnąć (playbook C-035).

**Tematy dotykające tych samych plików idą sekwencyjnie, nie równolegle.**
Równoległy dispatch dwóch tematów na ten sam plik kończy się albo skasowaniem
pracy pierwszego, albo statusem `INTEGRATION_PENDING` i ręcznym rozjazdem,
którego nikt nie zaplanował (playbook C-059).

**Sprzątanie worktree przy `INFRA`/braku miejsca na dysku ma własną procedurę** —
`INFRA` nie jest wadą pracy Operatora i nie poprawia się jej ponownym dispatchem
tego samego zlecenia:

```bash
df -h /                                              # 1. zmierz, nie zgaduj
git worktree list                                    # 2. wypisz istniejące
git merge-base --is-ancestor <commit> origin/main    # 3. PRZED usunięciem
```

Usuwaj wyłącznie worktree, którego praca jest już przodkiem `origin/main` albo
został jawnie odrzucony. **Nigdy nie usuwaj worktree oznaczonego jako używany
przez wciąż działający wątek** (playbook C-014, C-032, C-033).

## 3. Pętla domknięcia

Temat zachowuje to samo ID przez wszystkie rundy. Dla jednego pełnego ID obowiązuje
twardy limit **5 rund Operator→Evaluator**. Runda to jedna faktycznie uruchomiona
próba Operatora oraz przypisany do niej Evaluator: runda początkowa i każda kolejna
korekta liczą się osobno. Licznik zwiększa się przed dispatchiem Operatora, więc
techniczny `BLOCK`, `TIMEOUT`, `INFRA` lub `ZWIS` po rozpoczęciu próby także zużywa
jedną rundę; nie wolno obchodzić limitu przez ponawianie techniczne. `ABC-OCZEKUJE`
przed dispatchiem nie zwiększa licznika.

```text
Operator → Evaluator → Final Control → integracja → READY_FOR_DEPLOY
   ↑            │              │
   └────────────┴──────────────┘  FAIL / BLOCK / TIMEOUT / INFRA / ZWIS / niegotowość
```

Po raporcie Operatora Evaluator uruchamia się automatycznie. `PASS` prowadzi do Final
Control, następnie do integracji. Każdy wymieniony wynik negatywny wraca bez czekania do
Operatora, Evaluatora i Final Control z tym samym ID **tylko dopóty, dopóki kolejna
runda ma numer ≤5**. Gdy po piątej rundzie potrzebna byłaby kolejna próba, nie wolno
dispatchować Operatora: zgłoś `LIMIT-5-EXCEEDED`, podaj
liczbę zużytych rund, ostatni faktyczny werdykt, blokadę oraz decyzję wymaganą od
orkiestratora/właściciela. Jest to dodatkowa bramka zatrzymująca automatyczny dispatch,
a nie zamiennik `BLOCK`, `TIMEOUT`, `INFRA` ani `ZWIS` — ostatni z tych statusów nadal
opisuje przyczynę. Wznowienie wymaga jawnej decyzji orkiestratora/właściciela; zachowuje
to samo ID i musi jawnie zezwolić na nowy cykl/wyzerowanie licznika, nie zaś samoczynnie
tworzyć nowe ID. `ZWIS` nie anuluje tematu przed osiągnięciem limitu; watchdog sprawdza
stan, a orkiestrator przejmuje pracę. ABC pauzuje temat i nie zużywa rundy.

### 3a. Konflikt kontraktu, domena raportu, duplikaty i weryfikacja wdrożenia

Cztery dopełnienia pętli, pełny opis w `playbook.md`: **C-054** (`DECISION_REQUIRED` dla
konfliktu dispatch/kod/testy — nie substytut turnieju C-018 przy wpływie na gameplay/UX),
**C-055** (pole `DOMAIN` w raporcie, błąd procesowy/provenance ≠ błąd gry), **C-056**
(weryfikacja „już wdrożone" wyłącznie przez `git merge-base --is-ancestor`, nigdy z pamięci)
i **C-057** (rejestr duplikatów tematów tagiem `duplicate_of`/`related_to`/`supersedes` w
`REJESTR-PROSB-I-ZADAN.md`, sprawdzany przed otwarciem nowego ID).

**Limit rund (Maciej, 2026-08-20):** pętla domknięcia dla jednego ID ma TWARDY limit 5 rund
(Operator→Evaluator→Final Control, ten sam temat). Po 5. nieudanej rundzie (bez czystego
PASS/PASS-WITH-NOTES) orkiestrator ZATRZYMUJE dalsze automatyczne rundy tego tematu i
zgłasza przekroczenie limitu wprost właścicielowi, opisując dotychczasowe FAIL-e/BLOCK-i,
zamiast kontynuować dispatch bez końca. Nie dotyczy to niezależnych tematów ani watchdogu
ZWIS (§1/§3 wyżej) — tylko powtarzających się rund tego samego ID.

**Cichy reset licznika jest naruszeniem procesu.** Licznik ma boleć — to jest jego
funkcja. Przenumerowanie tematu, nadanie mu nowego ID albo założenie nowej gałęzi
„od zera" w celu wyzerowania licznika jest tym samym naruszeniem co reset wprost.
Runda 2 przy konkretnym, naprawialnym `FAIL` idzie **na tym samym ID i na tej samej
gałęzi** — Operator dostaje precyzyjną poprawkę, nie zlecenie od nowa. Nowa gałąź
uzasadniona jest wyłącznie wtedy, gdy poprzednia praca jest w całości do odrzucenia,
i wymaga jawnej decyzji orkiestratora zapisanej w runie.

### 3b. `PASS-WITH-NOTES` nie zawsze kończy proces

`PASS-WITH-NOTES` **nie kończy procesu**, jeśli uwagi dotyczą któregokolwiek z:
kryterium `GOAL`, dowodu wykonania (bramki, testy tematu), zakresu, granic
nienaruszalnych (§9) albo gotowości do integracji. Wtedy temat wraca do Operatora
dokładnie jak przy `FAIL` i zużywa rundę.

Kończy proces wyłącznie wtedy, gdy uwagi są kosmetyczne **i zostały zapisane jako
osobny temat w rejestrze** — nie zostawione w raporcie jako wolna uwaga, której
nikt później nie znajdzie. Final Control ma to sprawdzić jawnie (§16).

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
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA | LIMIT-5-EXCEEDED | DECISION_REQUIRED | INTEGRATION_PENDING
DOMAIN: GAME | PROCESS | INFRA | INFORMATIONAL
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <dokładny wynik albo powód pominięcia>
BLOKADY: <lista albo brak>
RUNDY: <nr tej rundy>/<5; po limicie także liczba zużytych rund, ostatni werdykt i decyzja wymagana>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: WYKONANO albo NIE WYKONANO
```

`DECISION_REQUIRED` sygnalizuje konflikt dispatch/kod/testy dla tego samego ID — patrz
playbook C-054. Nie zwiększa licznika rund, wstrzymuje Evaluatora i Final Control do decyzji
właściciela (i turnieju C-018, jeśli dotyczy gameplay/UX). `INTEGRATION_PENDING` sygnalizuje
kod gotowy, którego nie da się jeszcze bezpiecznie zintegrować (współdzielony plik) — patrz
playbook C-059; nie jest to `BLOCK`.

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

**Integracja z drzewa współdzielonego z inną, niepowiązaną pracą jest allowlist-only, per
plik i per hunk** (playbook C-059) — zakaz `git add -A`/`git add .`; współdzielony plik
niemożliwy do bezpiecznego rozdzielenia dostaje status `INTEGRATION_PENDING`, nie `BLOCK`.
Watchdog liczy się jako zajęty slot puli 6, jeśli dzieli z nią limit wątków (playbook C-060).

## 5a. Narzędzie orkiestracji wieloagentowej — dwie ścieżki dispatchu

Jeśli narzędzie wykonawcze, którym pracujesz, ma zdolność agentic workflow
(przypisanie modelu i poziomu wysiłku/effort per rola, uruchamianie wielu
subagentów w jednym skrypcie, `pipeline()`/`parallel()`) **i** właściciel dał
jawną, opt-in zgodę na multi-agent orchestration w tej sesji — **używaj go
zawsze do dispatchu Operatora i Evaluatora**, nie pojedynczych, ręcznych
wywołań agenta. To jedyny sposób ustawić `effort` per rola; pojedynczy
dispatch agenta bez takiego narzędzia nie ma tego parametru w ogóle.

**Konkretny, zweryfikowany gap (2026-08-21):** narzędzie `Agent` — podstawowy
dispatch subagentów w Claude Code — ma w swoim schemacie parametr `model`, ale
**nie ma** parametru `effort`/`reasoning_effort` (sprawdzone bezpośrednio w
schemacie, nie z pamięci). Różnicowanie Operator/Evaluator przez effort jest
więc dziś fizycznie niemożliwe przez `Agent`, wyłącznie przez narzędzie
Workflow z `opts.effort` per agent — a Workflow wymaga jawnej, opt-in zgody
właściciela na multi-agent orchestration w danej sesji, więc nie zawsze jest
dostępne nawet w Claude Code. Ten gap i incydent, który go ujawnił
(orkiestrator dispatchował dwa tematy przez `Agent` z niewłaściwym modelem i
bez różnicowania effort, złapane przez właściciela, nie przez samoocenę), są
opisane w `playbook.md` C-061.

**C-062 (2026-08-24, Ścieżka A, Workflow) — `model` w `meta.phases` jest wyłącznie
kosmetyczny.** Skrypt Workflow dla `R-ZELAZO-MODELE-BRAKUJACE-Q1-T1` ustawił
`model: 'claude-opus-5'` TYLKO w deklaracji `meta.phases` (pole używane wyłącznie do
etykiety w widoku postępu `/workflows`), nie w `opts.model` samego wywołania
`agent(prompt, opts)`. Efekt: Operator i Evaluator wykonali się na domyślnym modelu
sesji (Sonnet 5) mimo poprawnie wyglądającej deklaracji na górze skryptu — złapane
dopiero przez Final Control (§9 poz. 6b), nie przez orkiestratora. W odróżnieniu od
C-061 (parametr `effort` fizycznie nieobecny w narzędziu `Agent`), tu parametr
`model` był W PEŁNI dostępny — błąd był w MIEJSCU jego ustawienia, nie w jego braku.
**Reguła:** przy pisaniu skryptu Workflow, `opts.model`/`opts.effort` MUSZĄ być
przekazane w każdym wywołaniu `agent()` z osobna (Operator, Evaluator, Final
Control) — `meta.phases[].model` wolno dodać dodatkowo dla czytelności widoku
postępu, ale nigdy zamiast `opts.model` na wywołaniu.

**Dlatego kanon rozdziela dwie ścieżki, każda jako osobny skill, nie jeden plik
z warunkiem w środku:**

- **Ścieżka A — Workflow dostępny w sesji ORAZ właściciel dał jawną, opt-in
  zgodę na multi-agent orchestration w tej sesji:** dispatch Operator/Evaluator/
  Final Control przez gotowy, wcześniej przygotowany skrypt Workflow —
  [`.claude/skills/civ-autobot-workflow/SKILL.md`](../../.claude/skills/civ-autobot-workflow/SKILL.md)
  — z jawnym `model`/`effort` per rolę zgodnie z kanonem niżej. Zgoda na
  Workflow nie jest automatyczna i nie przenosi się między sesjami.
- **Ścieżka B — wszystko inne** (Workflow niedostępny, brak zgody na niego, albo
  inne narzędzie wykonawcze bez koncepcji `effort` per agent — Cursor, GPT i
  inne): różnicowanie ról WYŁĄCZNIE przez treść promptu (jawna instrukcja
  „jesteś Evaluatorem, szukaj adwersaryjnie powodów do FAIL"), bez parametru
  effort — to robią dziś `.claude/skills/civ-autobot/SKILL.md` i
  `.claude/skills/autobots/SKILL.md`, pojedynczy dispatch pozostaje w pełni
  poprawny.

**Dla sesji Claude Code, Ścieżka A (potwierdzone przez właściciela, 2026-08-20):**
Operator → **Sonnet 5, effort Medium**; Evaluator → **Sonnet 5, effort High**.
Oba na tym samym modelu, różni je wyłącznie wysiłek — Evaluator dostaje więcej
przestrzeni na adwersaryjne rozumowanie, nie inny, droższy model. Final
Control → ten sam model i effort co Evaluator (Sonnet 5, effort High),
wykonywany przez OSOBNEGO subagenta, nigdy bezpośrednio przez głównego
orkiestratora — analogicznie do zapisu w §1 dla GPT-5.6 Luna. Ta reguła
dotyczy WYŁĄCZNIE sesji Claude Code — nazwy modeli w §1 wyżej („GPT-5.6 Luna
High/Medium") odnoszą się do innego narzędzia wykonawczego pracującego nad
tym samym repozytorium i nie są tu nadpisywane. Pełny opis integracji z
narzędziem orkiestracji: `AUTOBOT-UNIVERSAL.md` §11.

**Wyjątek graficzny/wizualny (Maciej, 2026-08-22).** Dla tematów, których
istotą jest wygląd/UX (CSS, layout, ikony, pozycjonowanie tooltipów, zgodność
z makietą designera — nie logika/dane/ekonomia): **Operator I Evaluator →
Opus 5** (effort jak wyżej — Medium/High odpowiednio), Final Control zostaje
przy Sonnet 5/effort High jak w regule bazowej (trzecia, niezależna
weryfikacja nie wymaga tego samego modelu co wykonawca/oceniający). Powód
(Maciej): „Sonet 5 sobie z tym tematem zwyczajnie nie poradził" — po
potwierdzonym w tej sesji (2026-08-22) regresie T10 migracji CivPedia (brak
CSS dla `.entity-card-row-key`/`.entity-card-row-value`, niezłapany przez
żadną z rund T1-T10 mimo Operator→Evaluator→Final Control na każdym etapie).
Evaluator na Opus 5 ma DODATKOWO obowiązek zweryfikować poprawkę realnym
zrzutem ekranu z żywej przeglądarki (Playwright/Chromium), nie tylko
testem kontraktowym/jsdom — właśnie taka luka (jsdom nie renderuje
faktycznego wyglądu) pozwoliła defektowi przejść niezauważonym wcześniej.
Ten wyjątek jest WĘŻSZY niż wcześniejsza, historyczna reguła „Opus 5 dla
`gra/src/render/**`" (modele 3D, `docs/archiwum-procesu/`) — TA jest osobna,
dotyczy 2D UI/CSS, nie nadpisuje ani nie zastępuje tamtej (obie mogą
obowiązywać jednocześnie, dla różnych zakresów kodu). Orkiestrator klasyfikuje
każdy temat jawnie w dyspozycji (graficzny → Opus 5 obie role; logika/dane →
Sonnet 5 baza) i zapisuje tę klasyfikację w raporcie/rejestrze, tak jak inne
decyzje model+effort per rola.

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
| `co nowego` (warianty: „sprawdź co nowego w Autobots", „co nowego w Autobots") | pokaż wyłącznie sekcję „Co nowego w regułach AutoBota" z `README.md` — bez pełnego audytu jak przy haśle `sprawdź` |

**Zmieniasz reguły samego AutoBota (nie kod gry)?** Najpierw przeczytaj
[`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`](../../dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md) —
mapa wszystkich warstw mechanizmu.

Final Control raportuje „gotowość do integracji: TAK/NIE”. Orkiestrator przed integracją
sprawdza raporty, GOAL, allowlistę, diff, commit, testy, blokady i faktyczny worktree.
Po faktycznej integracji może wystawić `READY_FOR_DEPLOY`. Deploy/push jest późniejszą,
osobną bramką i nie jest wykonywany automatycznie.

## 9. Granice nienaruszalne domeny gry

**Naruszenie którejkolwiek z poniższych pozycji oznacza natychmiastowy `FAIL`,
niezależnie od tego, jak dobra jest reszta pracy.** Nie są to „dobre praktyki" —
są to warunki, po których przekroczeniu wynik nie wchodzi do `main` nawet
z zielonymi bramkami. Lista pochodzi z faktycznych incydentów tego repozytorium,
nie z teorii; każda pozycja ma źródło.

| # | Granica | Skąd |
|---|---|---|
| 1 | **Nigdy `npm run build` ani `npm run dev` w `gra/`** — `export-data` nadpisuje pliki JSON danych gry i niszczy dane. Brzmienie wiążące jest dosłownym cytatem z `playbook.md` C-001 (bariera CHRONIONA): „Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda: node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir". Zakaz obejmuje **rodzinę komend build/compile**, nie wszystkie komendy w `gra/`: jedynym dozwolonym buildem jest wywołanie `vite` bezpośrednio przez binarkę z `node_modules` (nigdy przez skrypt `npm`), a jedyną dozwoloną kompilacją `node ./node_modules/typescript/bin/tsc --noEmit`. Bramki referencyjne z §6 (`node tools/*-test.cjs`) nie należą do tej rodziny i nie są tym zakazem objęte. **Wiążący jest zakaz `npm run build`/`npm run dev` — to jest istota tej bariery.** Wartość `--outDir` w cytacie jest **parametrem katalogu docelowego, nie treścią zakazu**: w praktyce tego repo musi wskazywać katalog **poza drzewem repo** (scratch/tmp, np. `--outDir /tmp/civ-dist --emptyOutDir`), bo „OneDrive blokuje `unlink` w `gra/dist/` (`EPERM`), więc `vite` nie może wyczyścić katalogu wyjściowego. Budujemy do `/tmp` (dysk lokalny piaskownicy) i kopiujemy gotowy plik do kanonu" (`SILNIK/SILNIK-ARCHITEKTURA-DEWELOPER.md:265`); dosłowne `--outDir dist` fizycznie nie działa na maszynie właściciela. Tak też robi istniejąca bramka `gra/tools/sidepanel-event-header-wydarzenie-real-render-test.cjs` (build do `os.tmpdir()`, komentarz: „kanon C-001 buduje dokładnie tak"). Zmiana samego zakazu — dopuszczenie `npm run build`/`npm run dev`, choćby warunkowe — jest osłabieniem bariery CHRONIONEJ i wymaga ECHO; **podanie innego katalogu w `--outDir` nie jest zmianą bariery i ECHO nie wymaga** | C-001, bariera CHRONIONA; wymuszane też przez `guardrails.ts` (`npm-run-build-gra`, `npm-run-dev-gra`) |
| 2 | **Nigdy `git add -A` ani `git add .`** — integracja wyłącznie allowlist-only, per plik i per hunk. Współdzielony plik niemożliwy do bezpiecznego rozdzielenia dostaje `INTEGRATION_PENDING`, nie `BLOCK` | C-008, C-034, C-059 |
| 3 | **Żadnych wartości sekretów, kluczy API ani poświadczeń w repozytorium** — także w przykładach, komentarzach, plikach testowych i artefaktach runów. Sekret w diffie = `FAIL` i rotacja klucza | granica ogólna; egzekwuje Evaluator (§16, pkt 5) |
| 4 | **Zmiana samego procesu nigdy nie jedzie w allowliście tematu produktowego** — nawet jednolinijkowa. To osobny temat w domenie `PROCESS`, z własnym ID i własnym dispatchem | §2a; `JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` |
| 5 | **`WERSJE.md` i `gra-robocza/ROBOCZA-MANIFEST.json` nigdy nie są aktualizowane przed faktycznym deployem** — md5 wpisuje się dopiero po publishu, przeliczone z opublikowanego bundla, nigdy przepisane z pamięci ani z innego pliku. `WERSJE.md` jest jedynym rejestrem md5; inne pliki linkują, nie kopiują | `dyspozycje/WERSJE.md` (zasada nagłówkowa: „stary system miał 4 sprzeczne aktualne md5") |
| 6 | **(a) Dowód — bezwarunkowo, na KAŻDEJ ścieżce dispatchu.** Temat wizualny/UX bez realnej weryfikacji w przeglądarce jest `FAIL`: zrzut z żywego Chromium przez Playwright, nigdy sam jsdom ani test kontraktowy, plus dowód nietautologiczności — zmutuj źródło i pokaż, że test faktycznie czerwienieje. Ta część dotyczy **dowodu, nie modelu**, więc obowiązuje tak samo Ścieżkę A (Workflow), Ścieżkę B (prompt) i Ścieżkę C (Cursor Automations). **(b) Przypisanie modelu — wyłącznie sesje Claude Code.** Wymóg „Operator i Evaluator → Opus 5" dla tematów wizualnych obowiązuje **tylko w sesjach Claude Code**, zgodnie z jawnym zapisem §5a („Ta reguła dotyczy WYŁĄCZNIE sesji Claude Code"). Ścieżki nieznające modelu Opus 5 jako pojęcia — m.in. `civ-autobot-cursor-automations` — nie są nim związane i jego niezastosowanie **nie** jest naruszeniem tej granicy; wymóg (a) obowiązuje je nadal, bez wyjątku | §5a, regres T10 migracji CivPedia (2026-08-22) |
| 7 | **`playbook.json` jest generowany z `playbook.md`, nigdy edytowany ręcznie** — ręczna edycja rozjeżdża liczniki i gubi zasady | C-013, incydent 2026-08-07 (zgubione `C-002` i fragment `C-001`) |
| 8 | **Deploy/push wyłącznie po `READY_FOR_DEPLOY` i osobnej, jawnej autoryzacji właściciela, wyłącznie tam, gdzie wskazał.** Operator, Evaluator i Final Control nie wykonują tego kroku nigdy | §1, §8; `guardrails.ts` (`deploy-robocza`/`-kanon`/`-finalna` wymagają `humanApproved` + `deployPasswordGiven`) |
| 9 | **Nigdy nie ufaj naiwnemu `git diff origin/main..<branch>`** przy integracji. `main` przesuwa się między dispatchem a mergem przy tematach równoległych — ustal najpierw `git merge-base origin/main origin/<branch>`, czytaj diff od tego punktu, scalaj `git merge --no-ff` | C-034, C-056, C-059 |
| 10 | **Nie usuwaj worktree bez sprawdzenia, czy jego praca jest już przodkiem `origin/main`**, i nigdy takiego, który jest oznaczony jako używany przez wciąż działający wątek | C-014, C-032, C-033; §2b |

**Osłabienie, usunięcie albo dodanie wyjątku do którejkolwiek z tych pozycji wymaga
ECHO właściciela** — nie jest zmianą, którą Operator albo Evaluator może wprowadzić
w biegu, nawet z dobrym uzasadnieniem technicznym.

## 10. Kto rozstrzyga — właściciel czy orkiestrator

**Nie każda otwarta kwestia jest pytaniem do właściciela.** Ta sekcja istnieje,
bo w tym repo udokumentowany jest przypadek zestawu pytań ABC zadanych językiem
zbyt technicznym, żeby właściciel mógł w ogóle odpowiedzieć — kontrola formy
sprawdzała kompletność wariantów, nie sprawdzała, czy adresat je rozumie.

| Rodzaj sprawy | Kto rozstrzyga | Przykłady z tego projektu |
|---|---|---|
| Zakres gry, balans, ekonomia, mechanika, wygląd, koszt, ryzyko, kolejność prac | **Właściciel** — pełne pytanie ABC z turniejem C-018 | mnożniki walki, progi wzrostu miasta, co widzi gracz na panelu, czy dana funkcja w ogóle wchodzi |
| Technika bez konsekwencji dla powyższych | **Orkiestrator decyduje i informuje**, nie pyta | nazwa worktree, format artefaktu runu, gdzie leży plik scratch, kolejność uruchamiania bramek, sposób rozbicia tematu na węzły |

Pytanie techniczne postawione właścicielowi **nie jest ostrożnością — jest
przerzuceniem na niego decyzji, do której nie ma podstaw.** Kosztuje jego czas
i opóźnia pracę. Gdy technika ma konsekwencję dla rozgrywki, kosztu albo ryzyka —
pytaj o **konsekwencję dla gry**, nie o mechanizm.

### 10a. Test zrozumiałości — przed wysłaniem pytania ABC

Pytanie idzie do właściciela dopiero, gdy przechodzi **wszystkie trzy** warunki:

1. Czy da się je przeczytać na głos osobie spoza projektu i dostać sensowną
   odpowiedź?
2. Czy w treści pytania **nie ma** numeru paragrafu, ścieżki pliku, nazwy
   narzędzia ani identyfikatora wewnętrznego? Te idą do odnośnika pod pytaniem,
   nie do zdania.
3. Czy warianty różnią się **skutkiem dla gry i dla gracza**, a nie sposobem
   wykonania?

Sprawdzian: **usuń z pytania wszystkie nazwy własne plików, funkcji i narzędzi.
Jeśli zdanie przestaje cokolwiek znaczyć — było napisane o mechanizmie, nie
o skutku, i nie jest gotowe do wysłania.**

Ten test jest **dodatkiem** do turnieju C-018 i do wymogów formy z §5, nie ich
zamiennikiem. Pytanie może przejść turniej, mieć komplet wariantów i argumentów,
i mimo to nie nadawać się do wysłania.

## 11. Zasada czystości raportu

Raport terminalny niesie **destylat, nie surowe dane**:

| Zamiast | Wpisz |
|---|---|
| wklejonego diffu | listę ścieżek z allowlisty + SHA commita |
| pełnego logu bramki | wynik w postaci `X/Y` plus nazwę bramki |
| całego stack trace'u | jedno zdanie o przyczynie + ścieżka:linia |
| streszczenia całego pliku | jedno zdanie cytatu |

Surowe materiały zostają w worktree Operatora i w `dyspozycje/autobot/runs/<ID>/` —
orkiestrator sięga po nie sam, gdy musi zweryfikować, ale domyślnie pracuje na
destylacie z pól `ZMIANY/COMMIT` i `TESTY`.

**Limit orientacyjny: ok. 400 słów na raport etapu** (dla węzła przy dekompozycji —
mniej). Zasada bez liczby jest apelem, nie regułą. Przekroczenie to
`PASS-WITH-NOTES`, nie `FAIL` — ale wraca do skrócenia, bo raport, którego nikt
nie przeczyta w całości, nie pełni swojej funkcji, a surowe dane zatruwają
kontekst orkiestratora.

## 12. Kiedy dzielić temat na węzły

Przed dispatchem odpowiedz na dwa pytania:

| Pytanie | Próg dla tego projektu |
|---|---|
| Czy temat ma co najmniej dwa niezależne obszary allowlisty, więcej niż 3 nazwane bramki/testy **specyficzne dla tego tematu** w kryteriach końca, albo więcej niż 6 plików w allowliście? | dowolny z trzech |
| Czy przetworzenie w jednym ciągu grozi przepełnieniem kontekstu jednego Operatora (audyt wielu plików, migracja przekrojowa, przegląd rejestru)? | tak/nie |

**Choć jedno „tak" i kroki nie są sekwencyjnie zależne** → podziel na węzły.
Kroki zależne (krok 2 potrzebuje wyniku kroku 1) **nie dzielą się**, niezależnie
od progów. Obie odpowiedzi „nie" → jeden Operator, bez podziału.

**Co się NIE liczy do progu — stała część wspólna.** `tsc --noEmit` i pięć bramek
referencyjnych z §6 (`logic-test`, `tech-tree-test`, `research-test`,
`unit-replace-test`, `combat-test`) są wymagane w **każdym** dispatchu tego repo
z definicji, więc same z siebie dają już ≥6 pozycji, zanim temat wniesie
cokolwiek własnego. Wliczanie ich do progu odpalałoby podział na praktycznie
każdym temacie i przeczyłoby zdaniu „dziel, gdy progi są przekroczone, nie
dlatego, że się da" oraz sekcji „Koszt" w `civ-autobot/SKILL.md` („grubsze paczki
zamiast cienkich agentów"). **Do progu liczą się wyłącznie nazwane sprawdzenia
specyficzne dla tematu** — nowe testy, nowe scenariusze, weryfikacja wizualna
konkretnego ekranu — a nie stała część wspólna.

**Doprecyzowanie: „nowe kryteria tematu" liczą się, „istniejące bramki
uruchamiane defensywnie" nie liczą się.** Wyłączenie z progu nie ogranicza się
do stałej piątki referencyjnej z §6. Do progu liczą się **wyłącznie (a)
faktycznie NOWE sprawdzenia/scenariusze wprowadzone przez TEN temat** — nowe
asercje w nowym albo rozszerzonym pliku testu, nowy scenariusz weryfikacji
wizualnej. **Nie liczą się (b) istniejące bramki regresyjne i sąsiednie
uruchamiane wyłącznie jako zabezpieczenie przed regresją**, nawet gdy są
imiennie nazwane w kryteriach końca i nawet gdy **nie** należą do stałej piątki
z §6. Kryterium rozróżnienia: czy to sprawdzenie **istniałoby bez tego tematu**?
Jeśli tak (uruchamiamy je tylko po to, żeby potwierdzić, że nic nie zepsuliśmy) —
nie liczy się do progu. Jeśli nie (powstaje razem z tematem i opisuje, co ma być
prawdą po zmianie) — liczy się.

Kontrola na faktycznym przykładzie z tego repo
(`dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/00-dispatch.md`,
temat historycznie zamknięty **jednym Operatorem w jednej rundzie, bez
dekompozycji**): kryteria końca wymieniają `eot-event-defer-test.cjs` z nowymi
asercjami (a–e) — to **1 nowe sprawdzenie**; cztery bramki sąsiednie
(`era-change-toast-defer-test.cjs`, `dyplo-karta-duplikat-komunikat-test.cjs`,
`eot-diplomacy-header-test.cjs`, `sidepanel-events-toolbar-test.cjs`) są
uruchamiane wyłącznie defensywnie, a `tsc` jest stałą częścią wspólną — razem
**0** pozycji liczonych do progu. Wynik: 1 ≤ 3, **próg się nie odpala**, zgodnie
z faktyczną historią tematu.

**Co NIE jest „dwoma niezależnymi obszarami allowlisty" i co nie liczy się do
progu liczby plików.** Artefakty runu (`dyspozycje/autobot/runs/<ID>/**`) nie są
obszarem allowlisty w tym sensie — towarzyszą każdemu tematowi. Tak samo
`gra/src/**` i `gra/tools/*-test.cjs` tworzące jedną zmianę (kod plus jego
testy) to **jeden** obszar, nie dwa: prawie każdy temat kodowy dotyka obu, więc
liczenie ich osobno odpalałoby ten próg automatycznie. Obszary są niezależne,
gdy mogą wejść do `main` osobno, w dowolnej kolejności, bez wzajemnego czekania.

**Artefakty runu nie liczą się również do progu „więcej niż 6 plików w
allowliście"** — nie tylko do progu „niezależne obszary". Powód jest ten sam:
`00-dispatch.md`, `01-operator.md`, `02-evaluator.md`, `03-final-control.md`
powstają w każdym temacie z definicji procesu, więc ich wliczanie podnosiłoby
licznik o stałą wartość niezależną od faktycznego rozmiaru tematu. Liczy się
wyłącznie liczba **merytorycznych** plików allowlisty (kod, testy, dokumentacja
przedmiotu tematu). W przykładzie wyżej: allowlista ma 3 pozycje, z czego
`dyspozycje/autobot/runs/P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1/` odpada →
2 pliki ≤ 6, próg się nie odpala.

**Podział kosztuje.** Każdy węzeł powtarza wstęp i kontekst, wymaga własnej
koordynacji i własnego przekazania wyniku — więcej węzłów nie skraca pracy
proporcjonalnie do ich liczby. Dziel, gdy progi są przekroczone, nie dlatego,
że się da. Szerokość fali dobierz do faktycznego limitu równoległości
(`civ-autobot-workflow/SKILL.md` §5), nie do liczby węzłów.

**ID węzła:** pełne ID rodzica z sufiksem litery — `-a`, `-b`, `-c`. Węzeł nie
dostaje osobnego wpisu w `REJESTR-PROSB-I-ZADAN.md`. **Licznik 5 rund liczy się
dla całego tematu**, nie osobno dla każdego węzła.

**Jedna fala węzłów (dispatch wszystkich węzłów tego samego tematu naraz) = jedna
runda w liczniku, niezależnie od liczby węzłów w tej fali.** Rozstrzyga to styk
z §3: podział na węzły nie zużywa i nie mnoży rund — ponowny dispatch po `FAIL`
choć jednego węzła jest kolejną, pojedynczą rundą tego samego pełnego ID.

Przy `FAIL` choć jednego węzła Evaluator wskazuje **dokładnie jeden** wadliwy
węzeł i precyzyjną poprawkę wyłącznie dla niego — węzły z `PASS` nie wracają
razem z nim. Final Control przy zamknięciu ustala, **który węzeł był najsłabszy**
(dostał `FAIL` choć raz albo wymagał najwięcej rund), a orkiestrator zapisuje to
jednym zdaniem w rejestrze. Żaden węzeł bez `FAIL` → „brak, wszystkie węzły
`PASS` za pierwszym razem".

Wzorzec podziału dla tematu kodowego — **testy pisze inny węzeł niż kod**, z
kryteriów końca, bez wglądu w implementację; inaczej testy sprawdzają to, co kod
robi, zamiast tego, czego wymaga kryterium, wszystko świeci na zielono i nikt
tego nie łapie:

| Węzeł | Zakres | Reguła przeciw samooszukiwaniu |
|---|---|---|
| `-a` Logika | `gra/src/**` | zakaz wyciszania błędu bez ponownego rzucenia lub zalogowania; zakaz `TODO` w kodzie idącym do integracji |
| `-b` Testy | `gra/tools/*-test.cjs`, pisane z kryteriów końca | zakaz asercji „coś się zwróciło" jako jedynej; przy zmianie trwałego stanu obowiązkowy test save/load ze starym zapisem |
| `-c` Ryzyko/parytet | granice §9, parytet gracz/AI/MP, zgodność wsteczna | zakaz twierdzenia „sprawdzone" bez wskazania linii wykonującej sprawdzenie |

## 13. Dyscyplina źródeł i korekt

### 13a. Hierarchia źródeł

**Zanim fakt o narzędziu, API albo bibliotece trafi do dokumentu decyzyjnego,
sprawdź go w źródle wyższego rzędu, nie we własnym skojarzeniu.**

| Rząd | Źródło | Status |
|---|---|---|
| 1 | faktyczny schemat narzędzia / oficjalna dokumentacja | **rozstrzygające** |
| 2 | kod źródłowy w repo, zgłoszenia błędów | rozstrzygające dla stanu faktycznego |
| 3 | notatka o wydaniu, wpis producenta | wiarygodne, ale marketing |
| 4 | artykuł, podsumowanie, wyszukiwarka | poszlaka — sprawdź w rzędzie 1 |
| 5 | własna pamięć o narzędziu, materiał promocyjny | **nigdy jako podstawa decyzji** |

Precedens w tym repo: gap `effort` w narzędziu `Agent` został ustalony przez
odczyt **schematu narzędzia** (rząd 1), nie z pamięci — i dopiero to pozwoliło
rozdzielić Ścieżkę A od B (§5a, playbook C-061). Odwrotny kierunek — dispatch
dwóch tematów z niewłaściwym modelem „bo tak było" — był rzędem 5 i został
złapany przez właściciela, nie przez samoocenę.

Fakt z rzędu 4 lub 5 zapisuj **jawnie jako niepotwierdzony**. To dotyczy także
liczb: wynik bramki podany z pamięci jest rzędem 5, wklejony wynik uruchomienia
jest rzędem 1.

### 13b. Jak korygować własny błąd

1. **Popraw tam, gdzie mieszka ustalenie** — w `playbook.md`, rejestrze albo
   dokumencie decyzji, nie tylko w czacie. Dokument z nieprawdą przeżyje rozmowę.
2. **Zostaw ślad korekty**, nie ciche nadpisanie. Czytelnik musi wiedzieć, że
   wcześniejsza wersja mówiła inaczej.
3. **Nazwij skutek dla decyzji.** „To był błąd" bez „a to zmienia rekomendację
   o tyle" jest bezużyteczne.
4. **Nie rozwodź się.** Jedno zdanie o pomyłce, reszta o konsekwencji.

## 14. Dyscyplina zakresu

**Nie gonimy parytetu.** Budujemy pod listę wymagań właściciela, nie pod to, co
robi inna gra 4X w tej samej przestrzeni. Gonienie parytetu funkcja po funkcji
zamienia projekt krótki w projekt wielokrotnie dłuższy. Funkcja nierealizująca
żadnego zgłoszenia właściciela ani kryterium **nie wchodzi** — idzie do rejestru
jako rozważona i odrzucona.

**Rozjazd w trakcie tematu.** Gdy w trakcie pracy pojawi się pomysł spoza `GOAL` —
**zapisz go jako nowy temat w `REJESTR-PROSB-I-ZADAN.md` i wróć do swojego.**
Nie poszerzaj allowlisty w biegu. To jest ta sama zasada co C-025 („zakres =
tylko ten błąd, zakaz »przy okazji«"), widziana od strony orkiestratora zamiast
od strony Operatora.

**Lista rzeczy, których projekt świadomie nie robi**, jest w skillu projektowym
(`civ-autobot/SKILL.md` §„Czego ten projekt świadomie nie robi"). Temat naruszający
którykolwiek jej punkt wymaga pytania ABC, nie decyzji Operatora.

## 15. Wzorzec promptu dla subagenta

Cztery pola, wszystkie obowiązkowe, niezależnie od ścieżki dispatchu:

| Pole | Co to jest |
|---|---|
| **Zadanie** | wąski zakres, jedno zdanie |
| **Reguła przeciw samooszukiwaniu** | konkretny sposób oszukania siebie, którego **zakazujemy** |
| **Binarne kryterium** | sprawdzalne `PRAWDA`/`FAŁSZ` |
| **Procedura naprawcza** | co dokładnie robi Evaluator przy `FAIL` — zapisane z góry, nie improwizowane |

Drugie pole jest tym, którego brakuje najczęściej. **Kryterium sukcesu sprawdza,
czy wynik jest kompletny. Reguła przeciw samooszukiwaniu zakazuje sposobu, w jaki
wykonawca uzna niedokończoną albo błędną pracę za gotową.** To dwie różne rzeczy.

Reguły przeciw samooszukiwaniu **pochodzą z faktycznie zaobserwowanych błędów
tego projektu** (`playbook.md`), nie z teorii. Pełny szablon promptu i tabela
„czego w prompcie nie może zabraknąć" — `civ-autobot-workflow/SKILL.md` §6.

## 16. Checklisty ról — co dokładnie sprawdza Evaluator i Final Control

### 16a. Evaluator

1. Czy diff mieści się w allowliście — co do pliku;
2. Czy nie narusza żadnej granicy z §9;
3. Czy bramki i testy tematu **faktycznie** przechodzą — nie czy raport tak
   twierdzi; wynik uruchomiony niezależnie, wklejony, nie streszczony;
4. Czy temat dotyka trwałego stanu (save/load), parytetu gracz/AI/MP albo ścieżek
   brzegowych — trzy twarde FAIL-e domeny gry, pełne kryteria w
   [`R-PROC-AUTOBOT-EVAL-STRICT.md`](R-PROC-AUTOBOT-EVAL-STRICT.md) i plikach
   `-EDGE`/`-PARITY`/`-SAVE`/`-SCOPE`;
5. Czy w diffie nie ma wartości sekretów, także w przykładach i artefaktach;
6. Czy nie ma usunięć, których `GOAL` nie wymagał;
7. Czy nie nakłada się z drugim aktywnym tematem (§2b);
8. Czy przy temacie wizualnym istnieje zrzut z żywej przeglądarki **i** dowód
   nietautologiczności testu (mutacja źródła czerwieni test);
9. **Czy `GOAL` w raporcie zgadza się z `GOAL` z `00-dispatch.md`** i czy nazwane
   kryteria końca w raporcie odpowiadają tym z dispatchu. **Rozbieżność jest
   sygnałem utraty kontekstu przez Operatora** i wymaga zgłoszenia niezależnie
   od tego, czy wynik jest `PASS` czy `FAIL` — nawet gdy wykonana praca jest
   dobra, bo oznacza, że Operator pracował nad innym zadaniem niż zamówione;
10. Przy temacie dzielonym na węzły z choć jednym `FAIL` — wskazanie **dokładnie
    jednego** wadliwego węzła i precyzyjnej poprawki wyłącznie dla niego (§12).

### 16b. Final Control

1. Czy istnieje `00-dispatch.md` i czy `GOAL` nie zmienił się po drodze;
2. Czy ID jest to samo we wszystkich rundach;
3. Czy werdykt Evaluatora opiera się na artefaktach, nie na deklaracjach;
4. Czy `PASS-WITH-NOTES` nie ukrywa uwagi dotyczącej GOAL, dowodu, zakresu,
   granic §9 ani gotowości do integracji (§3b) — a jeśli uwagi są kosmetyczne,
   czy zostały **zapisane jako osobny temat**, nie zostawione w raporcie;
5. Czy licznik rund się zgadza i **nie został po cichu zresetowany** (§3a);
6. Czy `REJESTR-PROSB-I-ZADAN.md` odzwierciedla stan faktyczny;
7. Przy temacie dzielonym na węzły — który węzeł był najsłabszy (§12);
8. Werdykt: „gotowość do integracji: TAK/NIE".

Final Control pracuje **na wytworze w worktree, sprawdzonym bezpośrednio** — nie
na samych raportach Operatora i Evaluatora, które są deklaracją, nie dowodem.

Historyczne routingi, dawne modele i snapshoty zachowano w
[`docs/archiwum-procesu/`](../archiwum-procesu/); nie są aktywną instrukcją.
