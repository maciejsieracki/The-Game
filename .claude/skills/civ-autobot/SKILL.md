---
name: civ-autobot
description: >
  Aktywny proces AutoBot dla Civ: pełne ID, GOAL, izolacja, ABC/ECHO, dowody,
  pętla Operator–Evaluator–Final Control–integracja oraz osobna bramka deploy/push.
---

# Civ — skill AutoBot

**Czym jest ten plik.** To jest **wypełnienie** uniwersalnego szkieletu procesu
([`autobots/SKILL.md`](../autobots/SKILL.md)) wartościami tego konkretnego
projektu: ścieżkami, modelami, liczbami, twardymi barierami i obserwowanymi
trybami samooszukiwania. Szkielet mówi, **jaką funkcję** pełni dane pojęcie;
ten plik mówi, **jaką ma postać w Civ „The Game"**. Pełna norma procesu (role,
pętla, bramki, granice, hasła) jest w `docs/decyzje/R-PROC-AUTOBOT.md` — tu jej
nie dubluję, żeby nie rozjeżdżała się w dwóch miejscach.

Kolejność czytania na starcie sesji jest w §„Kolejność czytania na starcie
sesji" poniżej — zacznij tam. Dla sesji Cursor dodatkowo aktywna jest reguła
[`.cursor/rules/autobot-evaluator-operator.mdc`](../../../.cursor/rules/autobot-evaluator-operator.mdc),
niosąca techniczne, zawsze-egzekwowane bramki.

**Masz dostępny i autoryzowany Workflow?** Jeśli narzędzie orkiestracji
wieloagentowej Workflow jest dostępne w tej sesji ORAZ właściciel dał jawną,
opt-in zgodę na multi-agent orchestration w tej sesji — patrz
[`civ-autobot-workflow/SKILL.md`](../civ-autobot-workflow/SKILL.md) zamiast tego
pliku dla dispatchu Operator/Evaluator/Final Control z jawnym `effort` per rolę.
Bez obu warunków (co jest normą — Cursor/GPT nie mają koncepcji Workflow z
`effort` per agent) zostań w tym pliku: role różnicujesz wyłącznie treścią
promptu, bez parametru effort. Pełne uzasadnienie: playbook C-061.

## Kolejność czytania na starcie sesji

Przed analizą kodu, dispatchiem lub edycją przeczytaj w tej kolejności:

1. [`README.md`](../../../README.md) — uniwersalny punkt startowy, pełna kolejność jest tam opisana krok po kroku;
2. `docs/procesy/INDEX-PROCESU.md` — mapę źródeł prawdy i artefaktów (krok 2 z `README.md`);
3. `docs/decyzje/R-PROC-AUTOBOT.md` — aktywną normę procesu: role, ABC, bramki, bariery, hasła;
4. `playbook.md` **w całości** — zasady, błędy „nigdy więcej", wnioski i sprawy otwarte;
5. `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` — jedyny bieżący stan przejęcia;
6. końcówkę `dyspozycje/_handoff/KANAL-PRACA.md` — ostatnie przekazania;
7. rejestr tematu, aktywne ABC/ECHO, decyzję właściciela i run danego ID;
8. dopiero na końcu faktyczny Git, diff, testy i kod.

Nie zaczynaj od starego handoffu, płaskiego logu, samego czatu ani archiwum.
`docs/archiwum-procesu/` jest historią, nie aktywnym routingiem.

**Zmieniasz reguły samego AutoBota (nie kod gry)?** Najpierw przeczytaj
`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` — mapa wszystkich
warstw mechanizmu.

Po starcie zamelduj krótko: jakie źródła zostały przeczytane, jaki jest
bieżący stan, jakie tematy są aktywne i czy istnieje blokada. Wzór:

```text
Przeczytałem źródła wejściowe AutoBot: README.md, INDEX-PROCESU.md, R-PROC-AUTOBOT.md,
playbook.md, HANDOFF-AKTUALNY.md, KANAL-PRACA.md. Zidentyfikowałem bieżące tematy,
ich statusy, blokady i następne bramki. Nie zaczynam zmian, dopóki nie potwierdzę
właściwego ID, GOAL, allowlisty i decyzji ABC. Pracuję wyłącznie w bieżącym, czystym
worktree.
```

## Hierarchia i przeznaczenie najważniejszych plików

Pełna, aktualna tabela jest w `docs/procesy/INDEX-PROCESU.md` §3 — nie
powtarzam jej tam ponownie, żeby nie rozjeżdżała się w dwóch miejscach.
Skrót ról:

| Plik / katalog | Rola |
|---|---|
| `README.md` | uniwersalny punkt startowy |
| `docs/procesy/INDEX-PROCESU.md` | mapa źródeł prawdy i miejsc zapisu artefaktów |
| `docs/decyzje/R-PROC-AUTOBOT.md` | pełna norma: role, pętla, ABC, bramki, bariery, hasła |
| `docs/decyzje/R-PROC-AUTOBOT-EVAL-STRICT*.md`, `-SCOPE.md` | trzy twarde FAIL-e Evaluatora (happy-path, parytet gracz/AI, save/load) |
| `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md` | obowiązkowy turniej dwóch niezależnych projektów przed nowym ABC |
| `docs/decyzje/R-RAPORT-10-KATEGORII-ABC-PLAYTESTY-Q1.md` | format odpowiedzi na hasło `raport` |
| `dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md` | mapa warstw przy zmianie samego AutoBota |
| `playbook.md` | kanon pamięci procesu; aktualizuj po pracy |
| `dyspozycje/REJESTR-PROSB-I-ZADAN.md` | wszystkie tematy i status kanoniczny |
| `dyspozycje/PYTANIA-OTWARTE.md` | aktywne ABC, ECHO, odsyłacze decyzji |
| `docs/decyzje/<ID>.md` | literalna decyzja właściciela |
| `dyspozycje/autobot/runs/<ID>/` | `00-dispatch` do `04-integration`, kanoniczny ślad |
| `dyspozycje/_handoff/HANDOFF-AKTUALNY.md` | jedno bieżące źródło stanu |
| `dyspozycje/_handoff/KANAL-PRACA.md` | krótkie przekazania, `CZEKAM-NA:` |
| `dyspozycje/WERSJE.md` | faktycznie opublikowane wersje, aktualizuj dopiero po deployu |
| `dyspozycje/autobot/src/guardrails.ts` | mechaniczne, deny-by-default zakazy w kodzie — ostatnia linia obrony |

## Kiedy ABC jest obowiązkowe

ABC jest obowiązkowe, gdy zmiana dotyka balansu gry, kosztów, mnożników,
progów, walki, ekonomii, zachowania AI lub innej decyzji
produktowej/architektonicznej. Każde NOWE pytanie (bez wcześniejszej
odpowiedzi literą) przechodzi przez obowiązkowy turniej dwóch niezależnych
projektów — `docs/decyzje/R-PROC-AUTOBOT-ABC-TURNIEJ.md`. Pełne wymogi
formy pytania (ID, sytuacja, warianty A/B/C, za/przeciw, rekomendacja) i
zasada ECHO (`dyspozycje/PYTANIA-OTWARTE.md` + `docs/decyzje/<ID>.md`) — patrz
[`.claude/skills/autobots/SKILL.md`](../autobots/SKILL.md) §6 dla samej
metodologii.

## Delegacja wstępnego rozpoznania do subagenta (Maciej, 2026-08-21)

Gdy właściciel przekazuje złożony, wieloznaczny albo obszerny temat (nowe
żądanie przebudowy mechaniki, prośba o recon, audyt rejestru) — orkiestrator
NIE analizuje go najpierw samodzielnie w pełni. Zamiast tego niezwłocznie
dispatchuje osobnego subagenta z pełną, dosłowną treścią żądania właściciela
(zachowując każdy niuans, bez własnej wstępnej interpretacji na skróty) i
zleca mu: recon kodu/rejestru, rozbicie żądania na punkty, oznaczenie co jest
jednoznaczne a co wymaga ABC, ew. warianty pytań A/B/C. Orkiestrator dostaje z
powrotem gotowe podsumowanie i na jego podstawie prowadzi dalszą rozmowę z
właścicielem (rejestruje temat, zadaje ABC, dispatchuje Operatora) — nie
powtarza samodzielnie tej samej analizy. Powód: własne przetwarzanie złożonego
tematu przez orkiestratora zajmuje czas i spowalnia rozmowę; subagent robi to
w tle, równolegle do dalszej pracy orkiestratora.

## Twarde bariery projektu Civ

- Nie używaj `git add -A` przy cudzej lub nieznanej pracy.
- Operator pracuje w izolowanym worktree i nie dotyka plików poza allowlistą.
- Przed kodowaniem wykonaj recon: rejestr, decyzje, handoff, Git i wyszukiwanie po repo.
- Przed integracją przejrzyj diff także pod kątem usunięć, overlapu i regresji.
- Dla kodu wymagaj typechecku, testów tematu, testów sąsiednich i baseline'u; przy
  zmianach trwałego stanu sprawdź save/load i wartość domyślną dla starych zapisów.
- Przy zmianie mapy sprawdź właściwy test deterministyczności; przy UI obejrzyj realny
  render/zrzut ekranu.
- Nie uruchamiaj `npm run build` ani `npm run dev` w Civ. Stosuj komendę builda
  wskazaną przez aktualny playbook/README runtime.
- `playbook.md` jest kanonem, `playbook.json` jest generowany — nie edytuj JSON ręcznie.
- Nie aktualizuj `WERSJE.md` przed faktycznym deployem.
- Bariery powyżej są dodatkowo wymuszane mechanicznie w kodzie
  (`dyspozycje/autobot/src/guardrails.ts`, deny-by-default) — nie zastępuje to ich
  czytania, ale jest ostatnią linią obrony, gdy pętla zawiedzie.

## Obieg

```text
Operator GPT-5.6 Luna High
→ Evaluator GPT-5.6 Luna High
→ Final Control GPT-5.6 Luna High
→ integracja orkiestratora GPT-5.6 Luna Medium
→ READY_FOR_DEPLOY
→ osobna bramka deploy/push
```

W dispatchach Codex (`multi_agent_v1`) Operator i Evaluator MUSZĄ jawnie używać
`model=gpt-5.6-luna` oraz `reasoning_effort=high`; nie wolno polegać na modelu
odziedziczonym po orkiestratorze. Final Control używa tego samego modelu i effortu,
a integracja orkiestratora `gpt-5.6-luna` z `reasoning_effort=medium`.

Przed dispatchiem zapisz pełne ID, `GOAL`, kryteria końca, allowlistę, izolację i plan
testów. Raport Operatora uruchamia Evaluatora, a `PASS` prowadzi do Final Control.
Jedna runda oznacza jeden faktyczny dispatch Operatora wraz z jego Evaluatorem; runda
początkowa i każda korekta liczą się jawnie, a licznik rośnie przed dispatchiem.
`FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA`, `ZWIS` i niegotowość Final Control
wracają do początku obiegu z tym samym ID wyłącznie po guardzie licznika i dla rund 1–5. `ABC-OCZEKUJE`
przed dispatchiem nie zużywa rundy. Po piątej nieudanej/niezamkniętej rundzie
zatrzymaj kolejny dispatch i zgłoś `LIMIT-5-EXCEEDED`
z liczbą rund, ostatnim faktycznym werdyktem, blokadą i decyzją wymaganą od
orkiestratora/właściciela. Limit jest dodatkową bramką, nie zamiennikiem BLOCK,
TIMEOUT, INFRA lub ZWIS. Wznowienie albo nowy cykl wymaga jawnej decyzji i pozostaje
przy tym samym ID; nie wolno samoczynnie zmieniać ID ani resetować licznika.

## Artefakty

Nowe runy zapisuj w `dyspozycje/autobot/runs/<ID>/`:
`00-dispatch.md`, `01-operator.md`, `02-evaluator.md`, `03-final-control.md`,
`04-integration.md`. Rejestruj temat w `dyspozycje/REJESTR-PROSB-I-ZADAN.md`,
otwarte ABC w `dyspozycje/PYTANIA-OTWARTE.md`, ECHO i decyzję w
`docs/decyzje/<ID>.md`, bieżący stan w `dyspozycje/_handoff/HANDOFF-AKTUALNY.md`,
a przekazania w `KANAL-PRACA.md`. `WERSJE.md` aktualizuj dopiero po faktycznym
deployu.

Raport etapu zawiera `STATUS`, `DOMAIN` (`GAME`/`PROCESS`/`INFRA`/`INFORMATIONAL` —
błąd provenance/worktree/ledgeru NIE jest automatycznie błędem gry), `TEMAT`, `GOAL`,
`ZMIANY/COMMIT`, `TESTY`, `BLOKADY`, `NASTĘPNY KROK` i `DEPLOY/PUSH`. Operator, Evaluator
i Final Control nie integrują, nie deployują i nie pushują. Historyczne routingi są
wyłącznie w [`docs/archiwum-procesu/`](../../../docs/archiwum-procesu/).

## Konflikt kontraktu i integracja allowlist-only

Gdy dispatch/kod/testy wymagają sprzecznego zachowania dla tego samego ID — Operator STOP,
nie koduje dalej, nie liczy to jako rundy, zapisuje `dyspozycje/autobot/runs/<ID>/decision-abc.md`
(opis konfliktu, bez proponowanego rozwiązania) i ustawia razem `DECISION_REQUIRED` (ledger)
oraz `ABC-OCZEKUJE` (rejestr tematu). Konflikt czysto inżynierski bez wpływu na gameplay/UX
idzie lekką ścieżką (jedna propozycja); konflikt z wpływem na gameplay/balans/UX wymaga
pełnego turnieju C-018 — `decision-abc.md` jest tylko wyzwalaczem, nigdy substytutem.

Integracja z drzewa współdzielonego z inną, niepowiązaną pracą jest **allowlist-only, per
plik i per hunk** — zakaz `git add -A`/`git add .`. Współdzielony plik niemożliwy do
bezpiecznego rozdzielenia dostaje status `INTEGRATION_PENDING` (nie `BLOCK`); orkiestrator
adresuje go przy najbliższym wolnym slocie, nie zostawia biernie czekającego. Weryfikację
„czy funkcja już jest wdrożona" rób wyłącznie przez `git merge-base --is-ancestor
<commit_funkcji> <commit_release>`, nigdy z pamięci. Pełny opis: playbook C-054–C-060.

## Ledger i watchdog dispatchu

Każdy dispatch zapisuje jeden i tylko jeden rekord z allowlistą pól:
`agent_id`, `temat`, `rola`, `runda`, `start`, `oczekiwany_artefakt`, `ostatni_status`,
`timestamp_zakonczenia`, `routing_nastepnego_kroku`. Watchdog sprawdza rekordy co minutę
i wymaga terminalnego raportu albo jawnej klasyfikacji: `completed`, `interrupted`,
`timeout`, `not_found`, `BLOCK` lub `CLOSED`; brak notyfikacji nie jest stanem oczekiwania.
`not_found` bez artefaktu daje `BLOCK`, cisza daje `ZWIS`, a timeout daje `TIMEOUT`.
`FAIL`/`BLOCK` wraca do tego samego ID i Operatora po guardzie rundy. Nieznany status
blokuje duplikat i kolejny dispatch do czasu rozstrzygnięcia. Monitoring kończy się po
`READY_FOR_DEPLOY`, jawnym `BLOCK` albo `ABC-OCZEKUJE`; Operator nie deployuje i nie pushuje.

Konkretne progi tego projektu: brak ruchu przez ok. 7 minut = `ZWIS` (kanon także w
`.cursor/rules/subagent-watchdog.mdc`) — sprawdź transcript, Git i artefakty zamiast
anulować lub bezmyślnie restartować. Limit aktywnej puli projektu wynosi 6 subagentów
(playbook C-060; zarządzanie pulą i ocena dostępnej pojemności przed nową partią
dispatchy) — gdy istnieje niezablokowana praca, obsadzaj dostępne sloty. Hasło `sprawdź`
oznacza audyt całej puli: aktywnych przebiegów, raportów, historycznych `not_found`,
statusów runów, Git i artefaktów; po audycie zamknij zakończone sloty i uruchom wymagane
następne etapy.

## Bramki i hasła właściciela

Konkretne komendy testowe i punkty odniesienia są w `docs/decyzje/R-PROC-AUTOBOT.md`
§6 Bramki — nie kopiuj ich tutaj, sprawdzaj tam (liczby się zmieniają z każdą falą).
Tabela haseł właściciela (`sprawdź`, `push`, `deploy`, `format`/`ABC`, `raport`,
`co nowego` — pokazuje wyłącznie sekcję „Co nowego w regułach AutoBota" z `README.md`,
bez pełnego audytu) jest w `docs/decyzje/R-PROC-AUTOBOT.md` §8.

**Pięć bramek referencyjnych** uruchamianych po KAŻDYM merge'u do `main`, obok
`tsc --noEmit` i testów samego tematu — pełne komendy i wyniki referencyjne
w `R-PROC-AUTOBOT.md` §6:

```text
gra/tools/logic-test.cjs        gra/tools/tech-tree-test.cjs
gra/tools/research-test.cjs     gra/tools/unit-replace-test.cjs
gra/tools/combat-test.cjs
```

---

# Wypełnienie szkieletu dla tego projektu

Odpowiednik dodatku „wypełnienie dla projektu" z uniwersalnego szkieletu.
Wymieniane jest wyłącznie to; sam szkielet (`autobots/SKILL.md`) zostaje bez
zmian, bo jest niezależny od projektu.

## Odwzorowanie pojęć procesu w tej dziedzinie

| Pojęcie szkieletu | Postać w Civ „The Game" |
|---|---|
| Wytwór | Zmiana w `gra/`, dokumentacji albo rejestrze spełniająca `GOAL`, **faktycznie scalona do `main`** — nie diff, nie raport, nie deklaracja Operatora (`R-PROC-AUTOBOT.md` §1b) |
| Dowód wykonania | `tsc --noEmit` = 0 błędów + testy tematu + **5 bramek referencyjnych** zielone na aktualnym stanie, uruchomione niezależnie od Operatora; przy temacie wizualnym dodatkowo zrzut z żywego Chromium (Playwright) z dowodem nietautologiczności |
| Miejsce pracy w toku | worktree + gałąź `autobot/<ID>`, oddzielone od `main` |
| Izolacja | osobny worktree na jeden temat, zakładany przez sparse-checkout bez `gra-robocza/`, `gra-kanon/` i `dist/` (C-015) |
| Wersja obowiązująca | `origin/main`; publikacja ROBOCZA/KANON/FINALNA to **osobne, późniejsze bramki** |
| Zapis punktu kontrolnego | commit git — zapis, **nie** integracja |
| Rejestr scenariuszy / kryteriów | testy w `gra/tools/*-test.cjs` + kryteria końca w `00-dispatch.md` |
| Źródło rozstrzygające faktu | faktyczny schemat narzędzia / kod w repo / wynik uruchomionej komendy — nigdy pamięć (`R-PROC-AUTOBOT.md` §13a) |

## Parametry i ich wartości

| Parametr szkieletu | Wartość w tym projekcie | Źródło |
|---|---|---|
| {prefiks-identyfikatora-tematu} | brak jednego prefiksu — ID opisowe z sufiksem `-Q<n>` (np. `R-PROC-AUTOBOT-PRZEBUDOWA-SZKIELET-Q1`), niezmienne przez wszystkie rundy | praktyka repo, `REJESTR-PROSB-I-ZADAN.md` |
| {nazwy-domen-raportu} | `GAME` · `PROCESS` · `INFRA` · `INFORMATIONAL` | C-055, `R-PROC-AUTOBOT.md` §4 |
| {zestaw-statusow-raportu} | `PASS` · `PASS-WITH-NOTES` · `FAIL` · `BLOCK` · `TIMEOUT` · `INFRA` · `LIMIT-5-EXCEEDED` · `DECISION_REQUIRED` · `INTEGRATION_PENDING` | `R-PROC-AUTOBOT.md` §4 |
| {model-wykonawcy} / {model-sprawdzajacego} / {model-kontroli-koncowej} — Claude Code, Ścieżka A | Sonnet 5 Medium / Sonnet 5 High / Sonnet 5 High (osobny subagent) | `R-PROC-AUTOBOT.md` §5a; C-062 |
| — wyjątek graficzny/wizualny | Operator **i** Evaluator → Opus 5 (effort Medium/High); Final Control zostaje Sonnet 5 High | `R-PROC-AUTOBOT.md` §5a, decyzja właściciela 2026-08-22 |
| — Codex `multi_agent_v1` | Operator/Evaluator/Final Control → `gpt-5.6-luna`, `reasoning_effort=high`; integracja orkiestratora → `gpt-5.6-luna`, `medium` | `R-PROC-AUTOBOT.md` §1, §1a; C-052 |
| {liczba-podejsc-przed-eskalacja} | **5 rund** na jedno pełne ID, potem `LIMIT-5-EXCEEDED`; cichy reset = naruszenie | C-050, C-053, `R-PROC-AUTOBOT.md` §3, §3a |
| {liczba-tematow-rownoleglych} | pula 6 subagentów. **Jeśli watchdog dzieli z nią limit wątków/procesów — efektywna pojemność to 5 tematów**, szósty slot rezerwowany dla watchdoga. **Jeśli działa poza tą pulą — zapisz to jawnie, nie zakładaj domyślnie** | C-060, `R-PROC-AUTOBOT.md` §5 |
| {czas-do-uznania-zawieszenia} | ok. **7 minut** ciszy = `ZWIS` | `.cursor/rules/subagent-watchdog.mdc`; §„Ledger i watchdog" wyżej |
| {limit-rownoleglosci-wywolan} | `min(16, nproc − 2)` — **przeliczaj komendą, nie z pamięci** | `civ-autobot-workflow/SKILL.md` §5 |
| {progi-podzialu-tematu-na-wezly} | 2 niezależne obszary allowlisty / >3 nazwane bramki **specyficzne dla tematu** / >6 plików w allowliście. **Stała część wspólna nie liczy się do progu**: `tsc --noEmit` i 5 bramek referencyjnych są w każdym dispatchu z definicji; `gra/src/**` + `gra/tools/*-test.cjs` jednej zmiany to jeden obszar, nie dwa | `R-PROC-AUTOBOT.md` §12 |
| {konwencja-numeracji-wezlow} | sufiks litery: `-a`, `-b`, `-c`; licznik rund liczony dla całego tematu — **jedna fala węzłów = jedna runda**, niezależnie od liczby węzłów | `R-PROC-AUTOBOT.md` §12 |
| {limit-objetosci-raportu} | ok. 400 słów na raport etapu (destylat, nie surowe logi) | `R-PROC-AUTOBOT.md` §11 |
| {miejsce-i-szablon-zapisu-zlecenia} | `dyspozycje/autobot/runs/<ID>/00-dispatch.md` … `04-integration.md` | C-044, C-051 |
| {kolejnosc-plikow-startowych} | `README.md` → `INDEX-PROCESU.md` → `R-PROC-AUTOBOT.md` → `playbook.md` → `HANDOFF-AKTUALNY.md` → `KANAL-PRACA.md` → rejestr/ABC/run → Git | §„Kolejność czytania" wyżej |
| {zestaw-plikow-trwalej-prawdy} | `playbook.md`, `REJESTR-PROSB-I-ZADAN.md`, `PYTANIA-OTWARTE.md`, `docs/decyzje/<ID>.md`, `WERSJE.md` | §„Hierarchia plików" wyżej |
| {lista-twardych-barier} | 10 granic nienaruszalnych domeny gry | `R-PROC-AUTOBOT.md` §9 |
| {jezyk-dokumentacji-i-procesu} | polski wszędzie; nazwy techniczne, ścieżki i identyfikatory po angielsku, bez znaków diakrytycznych | praktyka repo |
| {miejsce-i-warunek-wlaczenia-do-wersji-obowiazujacej} | `origin/main`, merge `--no-ff` po pozytywnym Final Control, allowlist-only per plik/hunk | C-034, C-059 |

Wartości nietypowe — limit 5 rund zamiast domyślnych 3 w szkielecie, pula 6 zamiast
2, wyjątek graficzny — **pochodzą z decyzji właściciela**, nie z ustawień domyślnych
szkieletu. Zmiana którejkolwiek wymaga ECHO, nie jest korektą redakcyjną.

Limit `{limit-rownoleglosci-wywolan}` jako jedyny **nie pochodzi z rozmowy
z właścicielem** — wynika z liczby rdzeni maszyny orkiestratora i przelicza się
komendą `nproc`, bez pytania.

## Format wersji

`dyspozycje/WERSJE.md` jest **jedynym** rejestrem md5 bundli. Inne pliki linkują,
nigdy nie kopiują — stary system miał cztery sprzeczne „aktualne" md5. Format
nagłówka wpisu:

```text
## ROBOCZA <md5-skrócone> - <RRRR-MM-DD HH:MM UTC> - FALA <N>: <opis jednym zdaniem>
```

Wpis powstaje **dopiero po faktycznym publishu**, z md5 przeliczonym z opublikowanego
bundla. `gra-robocza/ROBOCZA-MANIFEST.json` nigdy nie jest nadpisywany bez
przeliczenia md5 (granica §9 pkt 5).

## Czego ten projekt świadomie nie robi

Lista granic zakresu — chroni przed powolnym rozrostem („skoro już przy tym
jesteśmy"). **Temat naruszający którykolwiek punkt wymaga pytania ABC, nie
decyzji Operatora.** Lista rośnie wyłącznie o rzeczy **faktycznie rozważone
i odrzucone** — nigdy jako spis z góry wszystkiego, czego teoretycznie projekt
mógłby nie robić.

Punkty potwierdzone dotychczasową praktyką repozytorium:

- **Nie gonimy parytetu funkcji z komercyjnymi grami 4X.** Budujemy pod
  zgłoszenia właściciela i istniejące kryteria, nie pod cudzą listę funkcji
  (`R-PROC-AUTOBOT.md` §14).
- **Nie naprawiamy „przy okazji".** Zadanie naprawiające zgłoszony błąd ma
  zakres = tylko ten błąd; refaktory i ulepszenia sąsiednie to osobne tematy
  (C-025).
- **Nie naprawiamy bramek czerwonych pre-istniejąco**, gdy nie są przedmiotem
  tematu — np. `unit-power-test.cjs` (4/2) jest znanym, świadomie niezamykanym
  stanem, nie regresją (`R-PROC-AUTOBOT.md` §6).
- **Nie mieszamy zmiany procesu ze zmianą produktową** w jednym dispatchu
  (granica §9 pkt 4).

**Listy zakresu produktowego — co ta gra świadomie robi, a czego świadomie nie
robi, choć mogłaby — nie wolno wymyślić.** Dziś stoi tu **jeden** taki punkt
(parytet funkcji z grami 4X, z `R-PROC-AUTOBOT.md` §14); pozostałe trzy punkty
powyżej dotyczą sposobu pracy, nie samej gry. Granice zakresu gry są decyzją
właściciela, nie ustaleniem technicznym; dopisanie tu listy bez pokrycia w jego
odpowiedzi byłoby fałszywą strukturą, gorszą niż jej brak. Orkiestrator dopisuje
kolejne punkty dopiero po jednoznacznej odpowiedzi, zapisanej jako ECHO — zgodnie
z regułą wzrostu na początku tej sekcji („wyłącznie o rzeczy faktycznie rozważone
i odrzucone"). Sama ta reguła nie została dotąd potwierdzona przez właściciela
wprost — to przedmiot pytania `R-PROC-AUTOBOT-PRZEBUDOWA-SZKIELET-Q1-Q2`.

## Nasze tryby samooszukiwania — obserwowane, nie hipotetyczne

Reguły przeciw samooszukiwaniu w promptach Operatora/Evaluatora **pochodzą
stąd**, nie z teorii. Nie kopiuj cudzych przykładów — błąd popełniony w innym
projekcie rzadko trafia w to, co faktycznie zawodzi tutaj.

| Tryb | Przypadek z tego repozytorium | Reguła zakazująca |
|---|---|---|
| Test tautologiczny | test kontraktowy/jsdom przechodził mimo brakującego CSS — regres T10 migracji CivPedia przeszedł przez pełne Operator→Evaluator→Final Control na każdym z 10 etapów | zakaz uznania tematu wizualnego za zamknięty bez zrzutu z żywego Chromium **i** bez pokazania, że test czerwienieje po mutacji źródła (§9 pkt 6) |
| Wynik bramki z pamięci | porównanie „czy funkcja jest już wdrożona" zrobione z pamięci zamiast komendą — fałszywy alarm „temat zniknął w kolejnej Fali" | zakaz twierdzenia „już wdrożone"/„zniknęło" bez wklejonego wyniku `git merge-base --is-ancestor` (C-056) |
| Deklaracja zamiast artefaktu | wpis w rejestrze twierdzący, że runda Evaluatora „się odbyła", bez istniejącego raportu | zakaz raportowania czynności bez ID runu albo SHA (C-038) |
| Samoocena liczników | orkiestrator wpisał liczniki skuteczności zasad z pamięci zamiast z realnych przebiegów; przy tym samym scaleniu zgubiono całą regułę i fragment innej | liczniki wyłącznie z mechanizmu, nowe zasady startują 0/0; `playbook.json` generowany, nigdy edytowany ręcznie (C-013) |
| Praca na nieaktualnej bazie | Operator w świeżym worktree od `main` nie znalazł pracy scalonej do gałęzi sesji i zaczął ją odtwarzać ręcznie | wykrycie przez `git merge-base --is-ancestor` na starcie; gdy zlecenie wymaga stanu gałęzi sesji, prompt musi to rozstrzygnąć wprost (C-035) |
| Cichy dispatch bez różnicowania | dwa tematy dispatchowane z niewłaściwym modelem i bez różnicowania effort — złapane przez właściciela, nie przez samoocenę | jawny `model` i `effort` per rola zapisane w `00-dispatch.md` i w raporcie etapu (C-052, C-061) |

Żaden z powyższych nie został złapany przez regułę procesu w chwili wystąpienia,
bo takiej reguły jeszcze nie było. Każdy kolejny obserwowany tryb dopisuj tutaj
**i** do `playbook.md` — jedno bez drugiego znika po kompaktowaniu sesji.

## Koszt

Głównym składnikiem kosztu w tym projekcie jest rachunek za modele językowe —
przewyższa on koszt czegokolwiek innego o rząd wielkości. Stąd optymalizujemy
**dobór modelu per rola i objętość kontekstu**, nie infrastrukturę: raport niesie
destylat, nie surowe logi (`R-PROC-AUTOBOT.md` §11), a przy fan-oucie łączymy
zadania w grubsze paczki zamiast mnożyć cienkich agentów, bo każdy węzeł powtarza
wstęp do promptu (`civ-autobot-workflow/SKILL.md` §5).
