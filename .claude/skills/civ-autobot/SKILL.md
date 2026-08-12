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

**Zmieniasz reguły samego AutoBota (nie kod gry)?** Najpierw przeczytaj
`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` — mapa WSZYSTKICH plików
mechanizmu (5 warstw) i checklista, która w praktyce (`R-PROFIL-TURNIEJ-PUNKTACJA-Q1`)
złapała 3 kolejne rundy realnych braków, zanim zmiana była naprawdę kompletna.

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
   **Jeśli sytuacja/rekomendacja koliduje z już podjętą decyzją** (ID + litera + data w rejestrze) — **nazwij to wprost** w pytaniu: która decyzja, jakie ID, kiedy. Maciej (2026-08-09): „powinno być wyraźnie zapisane, że jeżeli pytanie ABC podważa wcześniejsze moje decyzje, to powinno być to wyraźnie wskazane... żebym miał świadomość, że mogę cofnąć pewne inne swoje ustalenia." Kanon w `CLAUDE.md` §1a.
3. **ECHO** — po odpowiedzi w formie `ID + litera` potwierdź treść decyzji, zapisz do plików (rejestr + `dyspozycje/PYTANIA-OTWARTE.md` + ewentualny `docs/decyzje/`), dopiero potem kod i commit.
4. **DEPLOY** — wyłącznie na hasło `deploy`. Commit po `ID+A|B|C` **nie** publikuje ROBOCZA.

**Rozwidlenie NUMER → co dalej (`C-027`, Maciej 2026-08-08):** krok „ABC" dotyczy WYŁĄCZNIE
zgłoszeń wymagających realnego wyboru z kompromisem (balans/gameplay/UX z alternatywami).
Gdy zgłoszenie jest błędem do naprawienia albo prośbą z jednoznacznie opisanym oczekiwanym
zachowaniem (brak realnej alternatywy do wyboru) — **NUMER → od razu subagent Sonnet 5**
w pętli Operator → Evaluator, **w tej samej turze**, bez czekania na cokolwiek. „Rejestr to
punkt startowy pracy, nie miejsce składowania" — jego słowa po serii skarg: *„a myślisz, że
po co Ci zgłaszam te problemy? Żeby sobie siedziały w rejestrze?"*, *„tak właśnie gubią się
tematy, które ci zgłaszam... zgłaszam coś, a wy nie robicie z tym nic."*

**Kontrola kompletności (`C-030`/`C-031`):** po KAŻDEJ serii rejestracji w `PYTANIA-OTWARTE.md`,
przed zmianą wątku — uruchom `grep -n 'STATUS: \*\*OTWARTE' dyspozycje/PYTANIA-OTWARTE.md` (BEZ
kotwicy `^## ` — gubi nagłówki `### `) i potwierdź dla każdego trafienia: subagent w locie /
pytanie ABC / udokumentowany powód odłożenia. Ta sama komenda żyje TAKŻE w `CLAUDE.md` §0c (plik
zawsze ładowany do kontekstu w Claude Code — w przeciwieństwie do tego skilla i playbooka, które
wymagają świadomego odczytu i mogą zniknąć z pola widzenia po kompaktowaniu długiej sesji; nawet
`CLAUDE.md` to migawka z początku sesji, nie odczyt co turę). **[2026-08-08]** Druga warstwa
NIE jest już stałym godzinowym Routine (usunięty — kosztował 20+ wywołań/dobę niezależnie od
realnej pracy) tylko jednorazowym, samo-uzbrajającym się `run_once_at` triggerem: uzbrajanym
TYLKO gdy nowe zgłoszenie nie da się domknąć w tej samej turze, re-uzbrajanym co ~1h dopóki coś
czeka, milknącym bez re-uzbrojenia gdy wszystko domknięte. Pełny opis: `CLAUDE.md` §0c.

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

Kanon: `R-PROC-AUTOBOT-ABC-TURNIEJ.md` · `playbook.md` → `C-018` ·
`R-PROFIL-TURNIEJ-PUNKTACJA-Q1` (punktacja wg profilu, Maciej 2026-08-08).

**Każde NOWE pytanie ABC** (temat, na który właściciel jeszcze nie odpowiedział literą)
przechodzi przed pokazaniem właścicielowi przez trzy role: **Proponent 1** (orkiestrator
lub Operator, który natrafił na temat) · **Proponent 2** — niezależny agent Sonnet 5
**bez podglądu** projektu 1, dostaje wyłącznie surowe fakty i dane źródłowe. **Obaj
Proponenci wskazują własny „typ"** — którą literę uważają za najlepszą, z uzasadnieniem
odwołującym się wprost do `dyspozycje/PROFIL-DECYZYJNY-MACIEJ.md` (który wzorzec pasuje
do kategorii tematu).

**Sędzia** (rola Evaluatora, Opus 5) ocenia dwuwarstwowo: **Warstwa 1 (dominująca)** —
trafność rozpoznania kategorii i jakość uzasadnienia „typu" względem profilu, nie czy
zgadł literę właściciela; **Warstwa 2 (niuanse, tiebreaker)** — zgodność ze źródłami,
kompletność wariantów, trafność Za/Przeciw. Wybiera zwycięzcę albo syntetyzuje finalną
wersję. Do właściciela idzie zwycięska/zsyntetyzowana wersja **z jawną adnotacją przy
Rekomendacji** („wg profilu: typowana X, bo …") — zawsze obok pełnego A/B/C z Za/Przeciw,
nigdy jako zamiennik wyboru. Wybór litery pozostaje w 100% właściciela.

**Nie dotyczy:** tematów już rozstrzygniętych literą (wtedy samo ECHO + zapis), czysto
inżynierskich decyzji bez wpływu na gameplay/UX/dane gracza, ani bezpośrednich ustaleń
wypracowanych żywą rozmową z właścicielem (właściciel sam kształtuje projekt w dialogu —
turniej broni przed ślepym kątem jednego autora, tu autorów jest już dwóch).

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

**Zakres naprawy = tylko błąd, impact-analiza dla kodu współdzielonego** (`C-025`,
`C-026` — Maciej 2026-08-08, po serii regresji: kolejka budowy, traktat-koszyk,
rzeki-medium-fow, 4-rundowa naprawa handel-bramka-priorytet — „70% mojego czasu to
poprawki tego, co już było naprawione"):

- **C-025** — prompt zlecenia dla Operatora naprawiającego zgłoszony błąd MUSI
  wypisać granicę zakresu (konkretne pliki/funkcje) i wprost zakazać zmian poza nią.
  Zero „przy okazji"/„skoro już tu jestem" — refaktorów, sprzątania stylu, przenoszenia
  kodu, nawet gdy wyglądają jak ulepszenie. Evaluator odrzuca (FAIL) diff, który robi
  więcej niż to, co przyczyna błędu wymagała, niezależnie od tego, czy dodatkowa zmiana
  sama w sobie wygląda słusznie.
- **C-026** — gdy naprawa MUSI dotknąć funkcji/komponentu współdzielonego (bo to jedyny
  poprawny zakres, nie wybór Operatora), Operator PRZED zmianą wypisuje wszystkie
  miejsca użycia (grep/referencje) i PO zmianie weryfikuje każde z osobna — „to powinno
  nadal działać" bez sprawdzenia jest zakazane. Evaluator sprawdza, czy ta lista w ogóle
  powstała i czy jest wiarygodna (przelicza grepem sam, nie ufa samoocenie Operatora),
  nie tylko czy diff „wygląda" bezpiecznie — to nakładka na COUPLING z `lean-loop`,
  z twardym wymogiem enumeracji, nie tylko oceny „na oko".
- **Operator wykracza poza literalny scenariusz zgłoszenia własnym dowodem, nie tylko
  odtwarza raport** (wzmocnienie `lean-loop` §„Lean code without its check" — boundary/
  negative/repro to MINIMUM, nie sufit). Zanim Operator zgłosi gotowość, buduje min. 2
  własne przypadki brzegowe tego samego niezmiennika (np. `excess=0` z nielegalnymi
  wpisami obecnymi, wszystkie wpisy nielegalne naraz, remis w kryterium wyboru) — nie
  tylko literalny przykład z tickieta. Realny powód (2026-08-09, `P-HEKS-ISWORKABLE…`):
  dwie kolejne rundy przeszły własny dowód mutacyjny Operatora na scenariuszu z raportu i
  mimo to wprowadziły nową regresję, którą złapał dopiero Evaluator budując SWOJE
  scenariusze. Evaluator sprawdza czy te własne przypadki w ogóle istnieją w raporcie
  Operatora, nie tylko czy dowód mutacyjny na scenariuszu z tickieta przechodzi.

**Orkiestrator nie jest zwolniony z pętli** (`CLAUDE.md` §0b, `playbook.md` → `C-017`):
każda zmiana zapisana do repozytorium i każda liczba podana właścicielowi jako fakt
przechodzi przez osobnego Evaluatora na Opus 5; orkiestrator jest wtedy Operatorem
własnej zmiany i **nie ocenia sam siebie**. Czynności czysto odczytowe są wyłączone.
Furtka z `lean-loop` („gdy nie ma niezależnego recenzenta, przejdź listę sam i oznacz werdykt
jako samoocenę") **w tym repozytorium nie obowiązuje**: subagent-Evaluator jest zawsze
dostępny, więc „nie było kogo zapytać" nigdy nie jest tu usprawiedliwieniem.

**Self-check przed „gotowe":** był Operator? był Evaluator? był final? playbook
i guardrails uszanowane? Choć jedno „nie" → nie zamykaj paczki.

**Wzorzec domykania tautologii testowej: extract-to-pure-function.** Powtarzający się
wzorzec ucieczki mutacyjnej (2026-08-12, ≥4 niezależne przypadki: `shouldAllowBarbCityCapture`,
`canBarbarianWalkIntoEmptyCity`, `splitCampMoveCost`, `appendBreakdownLines`) — logika
żyje INLINE w dużej, niewyeksportowanej funkcji (typowo `main.ts`), a test odtwarza tę samą
formułę jako WŁASNĄ KOPIĘ zamiast importować prawdziwy kod. Mutacja psująca produkcyjną
logikę przechodzi bramkę, bo test i tak sprawdza tylko swoją kopię. Naprawa, która za
każdym razem faktycznie zamyka lukę: wyciągnąć sporny fragment do eksportowanej, CZYSTEJ
funkcji w module domenowym, zaimportować JĄ SAMĄ i w miejscu użycia (`main.ts`), i w teście
— zero duplikacji formuły. Evaluator sprawdzający naprawę tego typu: potwierdź że test
faktycznie importuje tę samą jednostkę modułu co produkcja (nie odtwarza formuły), inaczej
naprawa tylko przenosi problem.

**Audyt „nigdy-nie-ewaluowanych" commitów jako cykliczna higiena, nie jednorazowa akcja.**
Systematyczny przegląd historii gałęzi (`git log --oneline <punkt-odniesienia>..HEAD`,
odfiltrowane wpisy czysto dokumentacyjne, dla KAŻDEGO pozostałego commita grep w rejestrze
czy PADA słowo „Evaluator" gdziekolwiek w jego kontekście — nie tylko czy ma własny
nagłówek „SCALONE") wielokrotnie znajdował realne, wysyłalne błędy w kodzie już
zmergowanym i grywalnym (2026-08-12: 12/12 nigdy-nie-ewaluowanych commitów dostało
recenzję, większość miała ≥1 realne znalezisko, w tym błąd gubienia danych i błąd
bramki trudności niechroniony testem). Wniosek: „SCALONE" bez wzmianki o Evaluatorze
w rejestrze nie jest dowodem jakości — jest dowodem, że nikt jeszcze nie sprawdził.
Powtarzaj ten audyt cyklicznie (np. przy każdym większym domknięciu tury), nie tylko po
znalezieniu pierwszej luki.

**Kontrola spójności MIĘDZY tematami tej samej sesji, nie tylko poprawności wewnętrznej.**
Evaluator sprawdzający temat X powinien sprawdzić, czy decyzja podjęta w INNYM, niedawnym
temacie tej samej sesji nie została naruszona. Realny przypadek (2026-08-12): naprawa
etykiety „zapotrzebowanie" vs „zużycie" w panelu Surowców (`a79bae29`→`9c0cd04d`) nie
została propagowana do analogicznej kolumny w Tabeli Miast (`89c16ec1`), która nadal
mówiła „utrzymanie" dla tej samej, niezaklamrowanej wielkości — dwa panele tej samej gry
przeczyły sobie, jeden ekran od siebie. Złapane dopiero, bo Evaluator drugiego tematu
świadomie sprawdził zgodność z wcześniejszą decyzją, nie tylko wewnętrzną poprawność.

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
- **`git diff <A> <B>` do scalenia patcha jest bezpieczny WYŁĄCZNIE gdy `<A>` jest faktycznym
  przodkiem `<B>`** (`git merge-base --is-ancestor <A> <B>`). Jeśli worktree Operatora odgałęził
  się WCZEŚNIEJ niż `<A>` (np. `<A>` = obecny `main`, a worktree startował przed jakąś
  późniejszą, już scaloną paczką), diff cicho zawiera „cofnięcie" zmian z `<A>`, których tip
  worktree po prostu nigdy nie miał — merge wygląda czysto (`git apply --check` przechodzi),
  ale wymazuje wcześniejszą, już scaloną naprawę. Bezpieczne: `git diff $(git merge-base <baza
  worktree> <tip>) <tip>` (diff własnej pracy worktree, nie różnica względem obcego stanu), albo
  `git cherry-pick`/`git merge`. Realny przypadek 2026-08-09: `git diff 92341250 cdb29d92`
  (gdzie `cdb29d92` odgałęził się przed `92341250`) po cichu cofnął naprawę
  `P-HEKS-PANEL-TOOLTIP-WARSTWA-OSTATNIA` przy scalaniu niezwiązanej naprawy
  `P-ETYKIETA-KARTA-4750-MIESZANE-SEPARATORY` — złapane dopiero przez bramkę na etapie deployu,
  nie przez Evaluatora commita scalającego. Drugi, niezależny mechanizm cichej utraty pracy w
  tym repo obok już opisanego incydentu `b9867b3`.
- **`isolation: "worktree"` NIE dziedziczy z bieżącej gałęzi sesji — startuje od `main`.**
  Odkryte 2026-08-09 przy próbie „odtworzenia na aktualnym HEAD" naprawy `R-DYP-STOL-A-KOREKTA`:
  polecenie w prompcie Operatora „pracuj na aktualnym HEAD swojej gałęzi" **nie ma efektu** — nowy
  worktree i tak wystartował z tego samego, przestarzałego `main` (`b137332a`) co pierwsza,
  odrzucona próba (zweryfikowane: 0 wystąpień `techDirection`/`techPaymentMode` w pliku
  worktree, 29 w aktualnym HEAD sesji). To systemowa właściwość narzędzia, nie błąd
  pojedynczego agenta — trzeci przypadek cichej utraty pracy w tym repo, obok `b9867b3` i
  `92341250`/`cdb29d92` wyżej. **Konsekwencja: zawsze sprawdzaj `git merge-base --is-ancestor
  <baza worktree> HEAD`, nawet po „odtworzeniu na świeżo".** Gdy baza nie jest przodkiem: dla
  plików niezmienionych między bazą a HEAD — bezpieczny `git apply` po weryfikacji identyczności
  kotwic tekstowych; dla plików rozjechanych — ręczne, chirurgiczne odtworzenie zmiany przez
  orkiestratora z weryfikacją że edytowany fragment nie pokrywa się z rozjechanym obszarem, albo
  nowe zlecenie z prośbą o wynik jako czysty tekst do transkrypcji.
- **Kontynuacja rundy po FAIL Evaluatora** — wznawiaj `SendMessage` do agenta/worktree z
  poprzedniej rundy (zachowuje kontekst, historię commitów, świeżość względem `main`), NIE
  nowy `Agent` z izolacją od zera, chyba że worktree jest uszkodzony/usunięty. Sprawdzone
  wielokrotnie 2026-08-09 (4 rundy `P-HEKS-ISWORKABLE…`, 3 rundy `P-HANDEL-TECH-…`) — szybsze
  i taniej niż odtwarzanie stanu od podstaw, agent od razu widzi pełną listę Evaluatora.
- **Po podejrzeniu przerwania środowiska** (restart, cisza wyraźnie dłuższa niż oczekiwana,
  brak spodziewanej notyfikacji) — sprawdź stan BEZPOŚREDNIO (`git log`/`git status` w
  worktree agenta), zanim uznasz zadanie za wiszące lub zgubione; nie polegaj wyłącznie na
  ciszy jako sygnale. Realny przypadek 2026-08-09: restart kontenera ubił kilku subagentów
  w trakcie pracy (w tym w trakcie długiego `map-gen-regression-test.cjs`) BEZ żadnej
  notyfikacji o przerwaniu — jedynym sygnałem był brak wpisu na `ListAgents` przy braku
  wcześniejszej notyfikacji `completed`.
- **Przed KAŻDĄ dłuższą serią zmian** (pracą dłuższą niż jedna operacja, gdy inna sesja może w tym czasie commitować) — **wpis-blokada w `KANAL-PRACA.md` przed startem, a po zakończeniu wpis `ODBLOKOWANE`** (`C-007`). Obowiązuje **niezależnie od izolacji** — worktree chroni przed konfliktem plików, nie przed tym, że druga sesja robi równolegle to samo zadanie. Gdy izolacja jest niemożliwa, blokada wymienia dodatkowo REZERWOWANE PLIKI, a commitujesz **wyłącznie pliki zamkniętego zlecenia**.
- **Nigdy `git add -A`** (`C-008`, recydywa czterokrotna) · commituj każdą ukończoną grupę natychmiast (`C-003`) · nie raportuj wyniku subagenta bez własnej weryfikacji na dysku (`C-006`) · status pracy w tle oceniaj po znacznikach czasu plików, nie po etykiecie systemu (`C-005`).
- **Katalog `scratchpad` współdzielony między RÓWNOLEGŁYMI subagentami koliduje na
  generycznych nazwach plików** (potwierdzone ≥6× niezależnie 2026-08-12/13, m.in.
  `eval-harness.cjs` nadpisany między Evaluatorami dwóch różnych tematów w tej samej
  turze). To osobny, SZERSZY mechanizm niż znana kolizja worktree (`KROK 0` wyżej) —
  dotyczy nawet agentów pracujących w poprawnych, odrębnych worktree. Zweryfikowany
  skutek dotychczas nieszkodliwy (nadpisania łapane przez agentów, powtarzali pomiar
  pod unikalną nazwą), ale przyczyna nieustalona. Mitygacja przy zlecaniu: każ
  subagentowi nazywać pliki robocze w scratchpadzie z prefiksem ID tematu/commita
  (np. `scratchpad/<ID-tematu>/harness.cjs`), nie generyczną nazwą.
- **`git add`+`git commit` dla DWÓCH niepowiązanych zmian jako dwa równoległe wywołania
  narzędzia w tej samej turze = race condition.** Zweryfikowany realny przypadek
  2026-08-12: dwa niezależne scalenia (`git add <pliki A>` + `git commit`, `git add
  <pliki B>` + `git commit`) wysłane jako dwa równoległe tool-calle w jednej wiadomości
  — oba zestawy plików wylądowały w JEDNYM commicie (ten, którego `git commit` wykonał
  się jako drugi, po tym jak oba `git add` już się zakończyły), z komunikatem opisującym
  tylko jedną z dwóch zmian. Zawartość była kompletna i poprawna (zero utraty pracy),
  ale historia commitów wprowadzała w błąd. Zasada: `git add`+`git commit` dla
  niepowiązanych zmian ZAWSZE sekwencyjnie, nigdy jako równoległe wywołania w jednej
  turze — nawet gdy oba zestawy plików są rozłączne.

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

**⛔ `tsc` w worktree jest bezwartościowy bez weryfikacji kompilatora (`C-029`, recydywa
≥5× w jednej sesji 2026-08-08).** Worktree bez `gra/node_modules` sprawia, że `npx tsc`
po cichu uruchamia globalny, niepinowany TypeScript zamiast wersji projektu (5.9.3) —
mylący wynik w obie strony (fałszywe „0 błędów" maskujące realne, albo fałszywy błąd
kompilacji niebędący błędem projektu). Przed zaufaniem KAŻDEMU wynikowi `tsc` w
worktree: `ln -s <drzewo główne>/gra/node_modules gra/node_modules`, potem
`npx tsc --version` MUSI pokazać `5.9.3` — dopiero wtedy wynik `tsc --noEmit` jest
wiarygodny. Symlink nigdy nie trafia do commita, usuwaj po zakończeniu pracy.

**`git add` z wieloma ścieżkami i plikiem usuniętym w liście (`C-028`).** Gdy jedna ze
ścieżek nie istnieje (typowo: plik usunięty przez `git apply`, jeszcze nie w indeksie),
`git add` zgłasza `fatal: ... did not match any files` i pozostałe ścieżki z TEGO SAMEGO
wywołania mogą zostać po cichu pominięte. `git status --short` PRZED każdym commitem po
`git add` obejmującym więcej niż jedną ścieżkę; usunięte pliki dodawaj osobnym
wywołaniem, nie w jednej liście z nowymi/zmienionymi.

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
