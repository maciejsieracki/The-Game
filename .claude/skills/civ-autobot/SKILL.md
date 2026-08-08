---
name: civ-autobot
description: >
  Nakładka projektowa Civ „The Game" na uniwersalny skill `lean-loop` — wszystko, co
  w TYM repozytorium działa inaczej niż w dowolnym innym: rytuał startu sesji (pull →
  KANAL-PRACA → STAN-PRACY-HANDOFF → playbook.md), nienegocjowalna reguła „żadnej pracy
  poza pętlą AutoBot" z dwoma wąskimi wyjątkami, pętla Operator → Evaluator →
  final z przydziałem modeli (wykonawca Sonnet 5, Evaluator i deploy Opus 5, każdy
  render w `gra/src/render/**` zawsze Opus 5), procedura NUMER → ABC → COMMIT → DEPLOY
  z rejestrem próśb, obowiązkowy turniej dwóch niezależnych projektów przed każdym
  nowym pytaniem ABC, twarde FAIL Evaluatora dla edge/parytetu gracz-AI/save-load,
  izolacja pracy subagentów w worktree i wpis-blokada w kanale przed serią zmian, progi
  guardrails scaffoldu, postmortemy w `dyspozycje/autobot/logs/`, zakaz `npm run build`
  i `npm run dev` w `gra/` oraz `export-*.py` na żywych danych, runbook deployu do
  ROBOCZA i obowiązkowe logi w `WERSJE.md` + `KANAL-PRACA.md`. Użyj NA STARCIE KAŻDEJ SESJI w tym repo i przy
  każdej pracy nad grą: kod w `gra/src`, dane w `gra/data`, panele Excel, mapa,
  jednostki, modele 3D, bilans, testy, build, deploy, promocja KANON/FINALNA, pytania
  do właściciela. Wyzwalacze: „sprawdź", „sprawdź kanał", „push", „deploy", „deploy do
  robocza", „wdrażaj", „promuj kanon", „turniej ABC", „pytanie ABC", „format", „ABC",
  „bramki", „playtest", „zleć subagentowi", „worktree", a także każde `ID + A|B|C` jako
  odpowiedź właściciela. NIE używaj do zadań spoza tego repozytorium.
---

# Civ „The Game" — nakładka AutoBot

**Najpierw `lean-loop`** (uniwersalny skill: drabina decyzyjna, przyczyna nie objaw,
przegląd zakres+przerost, 5-krokowy protokół błędu, playbook, turniej, bariery).
Ten plik go **nie powtarza** — dokłada wyłącznie to, co specyficzne dla Civ.
Gdyby `lean-loop` był niedostępny, jego rdzeń AutoBota stoi w `AUTOBOT.md` w korzeniu.

## ⛔ Reguła nadrzędna: żadnej pracy poza pętlą AutoBot

**KAŻDA praca w tym repozytorium — kod, fix, docs procesu, audyt, przygotowanie deployu —
idzie przez pętlę Operator → Evaluator → final. Reguła NIENEGOCJOWALNA**
(`CLAUDE.md` §0a · `.cursor/rules/autobot-evaluator-operator.mdc` · `R-PROC-AUTOBOT`),
**bez wyjątku „to tylko drobiazg" / „zrobię sam poza pętlą"**. Obejmuje tak samo pracę
własną orkiestratora (§4) jak pracę subagenta.

**Wyjątki — dwa, oba wąskie:**
1. Czysta rozmowa ABC / zapis decyzji właściciela **bez zmiany `gra/src`** — wtedy Operator
   nie koduje, ale final i tak trzyma reguły playbooka (NUMER→ABC, bramka `deploy`).
2. **Dopisek 1–3 linie czysto tekstowe** (`R-SKILL-LEAN-LOOP-CIVAUTOBOT=B`, Maciej
   2026-08-08) — bez osobnego Operatora TYLKO gdy **wszystkie trzy** warunki naraz: (a)
   wyłącznie plik dokumentacji/notatek, **nigdy `gra/src`**; (b) dopisek do paczki, która
   **już przeszła przez Evaluatora w tej samej sesji** — nie samodzielna, nieoceniona
   zmiana; (c) zawsze zalogowany w `KANAL-PRACA.md` lub treści commita. Brak
   któregokolwiek warunku → pełna pętla, bez zgadywania czy „to tylko drobiazg".

Wszystko ponad te dwa wyjątki → pełna pętla Operator→Evaluator. Kanon wyjątku 2:
`.cursor/rules/autobot-evaluator-operator.mdc:28`.

Kanon procesu: `docs/decyzje/R-PROC-AUTOBOT.md` · `R-PROC-AUTOBOT-EVAL-SCOPE.md` ·
`R-PROC-AUTOBOT-EVAL-STRICT*.md` · `R-PROC-AUTOBOT-ABC-TURNIEJ.md` ·
`.cursor/rules/autobot-evaluator-operator.mdc`. Zasady krytyczne: `CLAUDE.md`.

## 0. Rytuał startu sesji (zanim cokolwiek zrobisz)

1. `git pull --ff-only origin main` — nad repo pracuje kilka sesji, które **nie widzą się nawzajem**; jedynym łącznikiem jest repozytorium, właściciel nie jest listonoszem.
2. `dyspozycje/_handoff/KANAL-PRACA.md` — ostatnie wpisy, zwłaszcza otwarte `CZEKAM-NA:`.
3. `STAN-PRACY-HANDOFF.md` — punkt wejścia: co zrobione, co w toku, decyzje już podjęte (§9 — o nie **nie pytaj drugi raz**), znane problemy (§7).
4. `playbook.md` **w całości** — zasady AKTYWNE / W OBSERWACJI / CHRONIONE stosujesz od pierwszej minuty, rejestr błędów to lista pomyłek zakazanych do powtórzenia, sprawy otwarte przejrzyj i domknij te, których dane już spłynęły. Ten plik jest kanonem; `dyspozycje/autobot/playbook.json` jest z niego **generowany** (`dyspozycje/autobot/tools/playbook-md-to-json.cjs`) — **nigdy nie edytuj JSON-a ręcznie**, nowa zasada zawsze startuje 0/0, liczników nie wpisujesz z pamięci.
5. Potwierdź jednym zdaniem: ile zasad aktywnych, ile wpisów w rejestrze błędów, data ostatniego wpisu, otwarte `CZEKAM-NA:`.

**Hasła właściciela:** „sprawdź" / „sprawdź kanał" = kroki 1–3 + relacja, **bez działania
na dysku**. „push" (sesja lokalna) = pull → odczyt ostatniego wpisu kanału → synchronizacja
dysku właściciela → meldunek „gotowe, testuj `<md5>`". „deploy" = dopiero wtedy publikacja
do ROBOCZA. „format" / „ABC" = przepisz pytanie w pełnej formie.

## 1. Przydział modeli (Claude Code; nie dotyczy Cursora)

| Rola | Model |
|------|-------|
| Sesja główna (orkiestrator) | Sonnet 5 |
| Każdy subagent-wykonawca (Operator) | Sonnet 5 |
| **Evaluator** (adwokat diabła, werdykt) | **Opus 5** |
| **Deploy** (build + weryfikacja + publikacja) | **Opus 5** |
| **Modele 3D jednostek i cała praca w `gra/src/render/**`** | **Opus 5, bez wyjątku** |

Wyjątek renderowy obowiązuje **równolegle** do reguły „subagenci na Sonnet 5" i nie
jest przez nią zniesiony: Sonnet dobiera detale historyczne poprawnie, ale nie ocenia
proporcji i czytelności bryły z kąta kamery gry. **Fable 5 zablokowany** —
`R-FABLE-RETENCJA-NASTER = B`: wymaga 30-dniowej retencji, wymagania NASTER nieustalone;
zgoda na model ≠ potwierdzenie retencji, potrzebne oba.

## 2. NUMER → ABC → COMMIT → DEPLOY

Kanon: `dyspozycje/PROCEDURA-NUMER-ABC-COMMIT-DEPLOY.md`.

1. **NUMER** — każdy case/bug/poprawka/innowacja dostaje ID w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`.
2. **ABC** — **nie koduj od razu**; przedstaw rozwiązanie w pełnej formie: nagłówek `[TEMAT: …]` · **ID** · Sytuacja · Cel pytania · Dlaczego teraz · **A / B / C** (każdy wariant ≥2 Za i ≥2 Przeciw) · Rekomendacja. **Maks. 3 pytania na turę.**
3. **ECHO** — po odpowiedzi w formie `ID + litera` potwierdź treść decyzji, zapisz do plików (rejestr + `dyspozycje/PYTANIA-OTWARTE.md` + ewentualny `docs/decyzje/`), dopiero potem kod i commit.
4. **DEPLOY** — wyłącznie na hasło `deploy`. Commit po `ID+A|B|C` **nie** publikuje ROBOCZA.

**⛔ Zakaz otwierania nowych wątków pytaniami.** Wolno wyłącznie pytania doprecyzowujące
do wątku aktualnie prowadzonego. Problemy znalezione przy okazji → **cicho** do
`dyspozycje/PYTANIA-OTWARTE.md`, bez wspominania w czacie. Każde pytanie/bug właściciela
trafia do tego pliku, zanim zmienisz temat.

**Każda liczba ma nazwany parametr, jednostkę i kontekst** — czego dotyczy (Kultura /
Praca / Prawo / Pieniądz / Zadowolenie / Obrona), w czym (pkt na turę, %, pkt Prawa),
w jakich warunkach (poziom, epoka, trudność). Nagłówek kolumny „Baza" jest zakazany.

**Po każdej paczce pracy — dwa osobne bloki, zawsze:** `### Playtesty` (wyłącznie
weryfikacja w grze) **oraz** `### Następny krok` (wyłącznie kolejne zmiany kod/dane/docs,
**pełna lista**, bez limitu 3). Zakaz mieszania playtestu z kodem w jednym menu.

## 3. Turniej ABC — tutaj TWARDA reguła, nie opcja

Kanon: `R-PROC-AUTOBOT-ABC-TURNIEJ.md` · `playbook.md` → `C-018`.

**Każde NOWE pytanie ABC** (temat, na który właściciel jeszcze nie odpowiedział literą)
przechodzi przed pokazaniem właścicielowi przez trzy role: **Proponent 1** (orkiestrator
lub Operator, który natrafił na temat) · **Proponent 2** — niezależny agent Sonnet 5
**bez podglądu** projektu 1, dostaje wyłącznie surowe fakty i dane źródłowe · **Sędzia**
(rola Evaluatora, Opus 5) — wybiera zwycięzcę albo syntetyzuje finalną wersję. Do
właściciela idzie tylko wersja zwycięska/zsyntetyzowana.

**Nie dotyczy:** tematów już rozstrzygniętych literą (wtedy samo ECHO + zapis) ani
czysto inżynierskich decyzji bez wpływu na gameplay/UX/dane gracza.

## 4. Evaluator — nakładka projektowa na przegląd z `lean-loop`

Uniwersalne osie (SCOPE / DIFF-MINIMAL / NO-REGRESSION / COUPLING + przerost) są
w `lean-loop`. Tutaj dochodzą **trzy twarde FAIL-e wynikające z domeny gry** — nigdy
PASS-WITH-NOTES:

- **FAIL #7 — sam happy-path** (`R-PROC-AUTOBOT-EVAL-STRICT-EDGE`): test bez asercji na wartość brzegową (`0`/`max`/`clamp`/`undefined`/pusta lista), bez negacji, bez repro zgłoszonego buga (asercja, która padłaby na starym kodzie).
- **FAIL #8 — asymetria gracz / AI / MP** (`…-PARITY`): gałąź `ownerId === 0` / `isPlayer` w logice wspólnej (ekonomia, produkcja, walka, dyplomacja, growth, upkeep, research, AI `choose*`) bez jawnej decyzji ABC lub bez testu parytetu dla owner 0 **i** owner N. Zasada nadrzędna projektu: **PARYTET AI** — każdy mechanizm działa identycznie dla gracza i AI.
- **FAIL #9 — luka save/load** (`…-SAVE`): nowe trwałe pole stanu bez zapisu w snapshot i/lub restore bez `?? default`; „save OK" bez roundtripu albo bez wskazania miejsca snapshot/restore w raporcie.

Do tego bazowe FAIL-e STRICT: brak celowanej asercji dla zmienionej logiki gry,
czerwone testy tematu, `tsc --noEmit ≠ 0`, SCOPE gameplay bez handoffu, cofnięcie
wcześniejszego fixu. **PASS-WITH-NOTES** tylko: pre-existing baseline poza tematem
z dowodem z `main`, docs drift, cross-lane z handoffem, GATE=A wyłącznie wizualny,
drobny drift procesu.

**Orkiestrator nie jest zwolniony z pętli** (`CLAUDE.md` §0b, `playbook.md` → `C-017`):
każda zmiana zapisana do repozytorium i każda liczba podana właścicielowi jako fakt
przechodzi przez osobnego Evaluatora na Opus 5; orkiestrator jest wtedy Operatorem
własnej zmiany i **nie ocenia sam siebie**. Czynności czysto odczytowe są wyłączone.
Furtka z `lean-loop` („gdy nie ma niezależnego recenzenta, przejdź listę sam i oznacz werdykt
jako samoocenę") **w tym repozytorium nie obowiązuje**: subagent-Evaluator jest zawsze
dostępny, więc „nie było kogo zapytać" nigdy nie jest tu usprawiedliwieniem.

**Self-check przed „gotowe":** był Operator? był Evaluator? był final? playbook
i guardrails uszanowane? Choć jedno „nie" → nie zamykaj paczki.

**Twarde progi liczbowe guardrails** (`R-PROC-AUTOBOT` §Spec v1 · `dyspozycje/autobot/src/guardrails.ts`,
`src/feature-pruning.ts`):

- **„Zwycięzca testu"** (zmiana progu / uznanie wariantu za lepszy) — `canDeclareWinner` / `assertEvaluationDelay` wymagają **N ≥ 1000 zastosowań LUB ≥ 48 h**. Nigdy po jednym runie.
- **Feature pruning** — atrybut o **|korelacji Pearsona| < 0,05** względem sukcesu wypada z kontekstu Operatora (`action_taken: "Removed feature X"`); śmieciowego kontekstu nie pakujesz.
- **Wycofywanie zasad jest zautomatyzowane** (`retireWeakRules`, `dyspozycje/autobot/src/playbook-manager.ts`): `win_rate < deprecateBelowWinRate` (0,3) po co najmniej `minRunsForSignificance` zastosowaniach → `RETIRED` + przeniesienie do `quarantine_rules`. Zasada **CHRONIONA** (`protected: true`) jest z tego automatu **wyłączona bez względu na liczniki** — status nadaje wyłącznie właściciel.
  **Rozbieżność do rozstrzygnięcia przez właściciela:** kanon v2 i wartość domyślna w kodzie to **10** zastosowań (`R-PROC-AUTOBOT` §v2 · `dyspozycje/autobot/README.md`: „podniesiony z 5 do 10"), ale żywy `dyspozycje/autobot/playbook.json` ma dziś **`minRunsForSignificance: 5`** — a generator `playbook-md-to-json.cjs` przepisuje `thresholds` bez zmian, więc 5 obowiązuje aż do ręcznej poprawki. Odczytaj wartość z pliku, nie z pamięci.
- **`promoteMinWinRate = 0,6` nie jest progiem powrotu zasady do AKTYWNEJ** — takiej ścieżki w kodzie nie ma, wycofaną przywraca wyłącznie człowiek. To domyślna wartość `min_confidence_threshold`: progu, od którego zasada ACTIVE w ogóle trafia do promptu Operatora (`getOperatorSystemRules`; zasada z 0 runów i zasada CHRONIONA przechodzą zawsze).
- **`R-PROC-POTROJNA-WARSTWA` jest WBUDOWANA w kroki 1–3** pętli Operator → Evaluator → final — nie jest osobnym, opcjonalnym rytuałem, którego można „nie odpalić przy drobiazgu".

**Bariery są w KODZIE, nie tylko w prompcie** (`dyspozycje/autobot/src/guardrails.ts`) — prompt
agent zawsze może sobie zreinterpretować, uprawnienia nie. `assertActionAllowed` działa
**deny-by-default**: akcja spoza `CATALOG` jest odrzucana. `FORBIDDEN_ACTION_IDS` ma 10 pozycji,
z czego siedem jest zablokowanych twardo, bez żadnej furtki: `git-merge-main` ·
`git-push-main-force` · `npm-run-build-gra` · `npm-run-dev-gra` · `delete-gra-data` ·
`mass-mail` · `real-money-transfer`. Pozostałe trzy to `deploy-robocza` / `-kanon` / `-finalna`
— jedyne z bramką ratunkową: przechodzą wyłącznie z `humanApproved` **i** `deployPasswordGiven`.
`assertProdIsolation` blokuje wszystko z tej listy i każde `deploy-*` przy `env=production`. To jest
mechaniczne wymuszenie zakazów z §6 — nie zastępuje ich czytania, ale to ono jest ostatnią
linią, gdy pętla zawiedzie.

## 5. Izolacja pracy subagentów

Każde zlecenie dotykające kodu uruchamiaj z osobnym `git worktree` (`isolation:
"worktree"`), zakładanym przez **sparse-checkout** bez `gra-robocza/`, `gra-kanon/`
i katalogów `dist/` (~370 MB zamiast ~810 MB; wyjątek: subagent robiący build/deploy
dobiera `gra-robocza` jawnie). Przeniesienie wyniku: `cd $WT && git diff > patch`,
potem `git apply -3 patch` w drzewie głównym; **nowe pliki dołóż osobno** — `git diff`
ich nie obejmuje. Kolejność: praca w izolacji → `git pull --ff-only origin main` →
scalenie → zgoda właściciela przy kolizji z cudzą pracą → bramki → build → deploy.

- **Po KAŻDYM powrocie Operatora z worktree** sprawdź `git status --porcelain` na drzewie głównym — stały krok zamknięcia, nie reakcja na alarm (`C-019`, recydywa).
- Worktree usuwaj **jako ostatni** krok, po scaleniu albo odrzuceniu; niescommitowany stan wcześniej na gałąź `zapas/<nazwa>` i na origin (`C-014`).
- **Przed KAŻDĄ dłuższą serią zmian** (pracą dłuższą niż jedna operacja, gdy inna sesja może w tym czasie commitować) — **wpis-blokada w `KANAL-PRACA.md` przed startem, a po zakończeniu wpis `ODBLOKOWANE`** (`C-007`). Obowiązuje **niezależnie od izolacji** — worktree chroni przed konfliktem plików, nie przed tym, że druga sesja robi równolegle to samo zadanie. Gdy izolacja jest niemożliwa, blokada wymienia dodatkowo REZERWOWANE PLIKI, a commitujesz **wyłącznie pliki zamkniętego zlecenia**.
- **Nigdy `git add -A`** (`C-008`, recydywa czterokrotna) · commituj każdą ukończoną grupę natychmiast (`C-003`) · nie raportuj wyniku subagenta bez własnej weryfikacji na dysku (`C-006`) · status pracy w tle oceniaj po znacznikach czasu plików, nie po etykiecie systemu (`C-005`).

## 6. Twarde zakazy (złamanie = utrata pracy)

- ⛔ **`npm run build` i `npm run dev` w `gra/`** — `prebuild`/`predev` uruchamia `tools/export-data.py`, który **nadpisuje ręcznie edytowane JSON-y** w `gra/data/`. Jedyna dozwolona komenda, z katalogu `gra`:
  `node ./node_modules/vite/bin/vite.js build --outDir dist --emptyOutDir`
- ⛔ **`export-*.py` na żywym `gra/data`** — kierunek jest jednostronny **JSON → Excel** (`gen-panel-*.py`); round-trip wyłącznie na kopii (`--data-dir <tmp>`).
- ⛔ **`publish-robocza-bundle.ps1`** — nie używaj; obowiązuje runbook §6 handoffu.
- ⛔ Force-push na `main`. Gdy `main` odjechał — **rebase**, cudza praca ma przetrwać.
- ⛔ Promocja FINALNEJ „przy okazji" promocji kanonu — wyłącznie na wyraźne polecenie właściciela, osobnym skryptem.

## 7. Bramki (uruchamiaj z `gra/`)

`npx tsc --noEmit` (0 błędów) · `node tools/tech-tree-test.cjs` · `node tools/research-test.cjs` ·
`node tools/unit-replace-test.cjs` · `node tools/map-gen-regression-test.cjs` (determinizm A=B
+ 0 rzek bez ujścia; progi czasowe „AC <5s/<15s" to pomiar wydajności, nie regresja).

Punkty odniesienia i znane **pre-istniejące** porażki (NIE regresja, nie „naprawiaj przy
okazji") — aktualna lista jest w `CLAUDE.md` sekcja BRAMKI i w handoffie §7. Odczytaj ją
tam, nie z pamięci: `logic-test.cjs` = 213/213, `combat-test.cjs` zielony 6/6,
`unit-power-test.cjs` czerwony pre-istniejąco (4 pass / 2 fail). Zawsze czytaj kod wyjścia
**testu**, nie procesu opakowującego.

## 8. Deploy i trzy poziomy bundli

Trzy poziomy promowane **niezależnie**: **ROBOCZA** (`gra-robocza/`, częste deploye,
runbook handoff §6) → **KANON** (`gra-kanon/`, po teście Master, `gra/tools/publish-kanon-snapshot.ps1`,
wyłącznie ROBOCZA→KANON) → **FINALNA** (`Gra-FINALNA.html` w korzeniu, promowana
**z KANONU**, `gra/tools/publish-finalna-snapshot.ps1`, rzadko i na wyraźne polecenie).
Skrypty promocji to PowerShell — uruchamia je **sesja lokalna**; sesja chmurowa robi
rozwój i deploye do ROBOCZA.

Deploy jest **jednym nierozdzielnym ciągiem** (`C-004`): bramki → build → kopia do
`gra-robocza/Gra-ROBOCZA.html` → stempel md5 → `gra-robocza/tools/sync-playtest-bundles.cjs`
→ `gra-robocza/tools/generate-start-hub.cjs` → `gra/tools/verify-robocza-bundle.cjs`
(**musi wypisać `VERIFY OK`**) →
**log** → commit → sprawdzenie, czy `main` nie odjechał → push.

**Log natychmiast, w dwóch miejscach:** (a) `dyspozycje/WERSJE.md` — md5 + stempel + co
weszło + status (poprzednią pozycję oznacz `ZASTĄPIONA`); (b) `dyspozycje/_handoff/KANAL-PRACA.md`
— `## [HH:MM PL, RRRR-MM-DD] KTO → DO KOGO — temat`, ≤10 linii, na końcu `CZEKAM-NA:`,
z jednoznacznym poleceniem „sesja lokalna: pull na dysk właściciela". **Narracja w czacie
nie jest meldunkiem** — czego nie zapiszesz w kanale, tego dla drugiej sesji nie było.

## 9. Rozmowa z właścicielem

Maciej, product owner w NASTER S.A. — **rozmawiaj po polsku**. Podejmuje decyzje
produktowe i gameplayowe; od agenta oczekuje architektury, analizy i wykonania. Woli
ustrukturyzowany wywód (tabele, numerowane sekcje) niż ściany tekstu. Przy
niejednoznaczności lub sprzecznych danych — **pytaj, nie zgaduj**. Ale też **nie twórz
problemów, których nie ma**: najprostsze rozwiązanie spełniające wymaganie wygrywa.
„Nie zmieniamy tego, co już działa — tylko dostosuj".

## 10. Zamknięcie

Po każdej większej paczce zaktualizuj `playbook.md` (dziennik wniosków: zrobiono →
skutek zmierzony → wniosek; liczniki zasad, które **rzeczywiście miały zastosowanie**;
nowe zasady i wpisy do rejestru błędów; sprawy otwarte) i `STAN-PRACY-HANDOFF.md`.
Błąd → protokół 5-krokowy z `lean-loop`, wpis do rejestru w `playbook.md` §3, nowa
zasada 0/0. Recydywa z tego rejestru = incydent krytyczny, zgłoś właścicielowi wprost.

**Nośnik postmortemów w tym projekcie:** `dyspozycje/autobot/logs/postmortems.jsonl` —
append-only JSONL, jeden rekord na run, pola `run_id` · `timestamp` · `metric_before` ·
`metric_after` · `delta_percentage` · `postmortem_reasoning` · `action_taken` (moduł
„Dashboard Logger", `dyspozycje/autobot/src/logging.ts`). Sam mechanizm opisuje `lean-loop`
— tutaj tylko miejsce zapisu. Gdy scaffold na to nie pozwala, **minimum: raport Evaluatora
w czacie + wpis w `KANAL-PRACA.md`**.

## 11. Dwie świadome różnice względem oryginalnego Ponytaila

`lean-loop` wyrósł z rodziny skilli `ponytail-*` i w dwóch miejscach celowo od niej odchodzi
— odnotowane, żeby nie zaskoczyły kogoś, kto zna oryginał:

1. **Zakres przeglądu.** Oryginalny `ponytail-review` jawnie wyłączał ze swojego zakresu poprawność, bezpieczeństwo i wydajność („Correctness bugs, security holes, and performance are explicitly out of scope") — patrzył wyłącznie na przerost kodu. `lean-loop` **łączy oba wymiary w jednym przebiegu** (zakres + przerost), a w tym projekcie dochodzą jeszcze twarde FAIL-e §4 (edge, parytet gracz/AI, save/load). U nas jeden przegląd Evaluatora odpowiada więc za całość — nie ma „drugiego, normalnego review" do którego cokolwiek się odsyła.
2. **Tryb domyślny intensywności.** Oryginał trzymał go w przełączniku (`PONYTAIL_DEFAULT_MODE`, `~/.config/ponytail/config.json`); `lean-loop` oddaje tę decyzję plikowi pamięci projektu. **Ten projekt nie ustawia dziś osobnego przełącznika** — ani w `CLAUDE.md`, ani w `playbook.md`. Obowiązuje domyślny tryb **`full`, wymuszony**, spójnie z regułą nadrzędną na początku tego pliku; tryb `lite` wymaga wyraźnego polecenia właściciela w rozmowie.
