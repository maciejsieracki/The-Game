---
name: civ-autobot
description: >
  Aktywny proces AutoBot dla Civ: pełne ID, GOAL, izolacja, ABC/ECHO, dowody,
  pętla Operator–Evaluator–Final Control–integracja oraz osobna bramka deploy/push.
---

# Civ — skill AutoBot

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
