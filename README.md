# Civ „The Game" — punkt startowy dla każdego agenta

Ten plik jest **jedynym uniwersalnym punktem wejścia** do procesu AutoBot w tym
repozytorium — niezależnie od narzędzia. Claude Code ma dodatkowo `CLAUDE.md`
(ładowany automatycznie do kontekstu), Cursor ma `.cursor/rules/*.mdc`
(`alwaysApply: true`) — oba są **cienkimi łącznikami do tego pliku**, nie
osobnym źródłem prawdy. Jeśli pracujesz innym narzędziem (Codex, ChatGPT,
dowolny agent, człowiek) — zacznij tutaj, ten plik wystarczy.

## Co nowego w regułach AutoBota

Aktualizuj tę listę przy każdej nowej regule C-0XX w `playbook.md` — dopisz na
górze, usuń najstarszą jeśli lista przekracza 12 wpisów.

- **C-061** (2026-08-21) — dwie ścieżki dispatchu Operator/Evaluator: różnicowanie `effort` per rola tylko przez narzędzie Workflow (gdy dostępne i autoryzowane), inaczej wyłącznie przez treść promptu.
- **C-060** (2026-08-20) — watchdog dispatchu liczy się jako zajęty slot, jeśli dzieli limit wątków z Operatorami/Evaluatorami — efektywna pojemność na tematy to 5, nie 6.
- **C-059** (2026-08-20/21) — integracja jest allowlist-only per plik i per hunk; gdy nie da się bezpiecznie rozdzielić brudnego drzewa, status pośredni `INTEGRATION_PENDING` zamiast `BLOCK`.
- **C-058** — nie odtwarzaj sztucznie brakujących historycznych liczników/wyników; lukę w danych zapisz jako notę z datą, decyzję opieraj na aktualnym, reprodukowalnym teście.
- **C-057** (2026-08-20) — rejestr duplikatów tematów: tag `[duplicate_of]`/`[related_to]`/`[supersedes]` w `REJESTR-PROSB-I-ZADAN.md` przed otwarciem nowego tematu.
- **C-056** (2026-08-20/21) — czy funkcja jest już wdrożona sprawdzaj komendą `git merge-base --is-ancestor`, nigdy z pamięci „co jest w najnowszej Fali".
- **C-055** (2026-08-20) — każdy raport etapu dostaje pole `DOMAIN:` (`GAME`/`PROCESS`/`INFRA`/`INFORMATIONAL`) zaraz po `STATUS:`.
- **C-054** (2026-08-20) — `DECISION_REQUIRED` to nie `BLOCK` i nie zastępuje turnieju ABC (C-018); konflikt z wpływem na gameplay/UX wymaga pełnego turnieju, nie skróconej ścieżki.
- **C-053** (2026-08-20) — po `LIMIT-5-EXCEEDED` ręczny nowy cykl tego samego ID wymaga jawnej decyzji właściciela i raportu porównawczego, nie jest automatyczną rundą 6.
- **C-052** (2026-08-20) — w dispatchach Codex `multi_agent_v1` Operator i Evaluator muszą dostać jawnie `model=gpt-5.6-luna` i `reasoning_effort=high`, bez dziedziczenia po orkiestratorze.
- **C-051** (2026-08-20) — ledger + watchdog dispatchu: jeden rekord na dispatch (9 pól), watchdog sprawdza co minutę, brak raportu zawsze dostaje klasyfikację (nigdy pusty przebieg).
- **C-050** (2026-08-20) — limit 5 rund Operator→Evaluator na jeden pełny ID; po piątej nieudanej rundzie zgłoś `LIMIT-5-EXCEEDED` zamiast automatycznej szóstej próby.

## Zanim cokolwiek zrobisz

Każdy temat w tym repozytorium — kod, fix, dokumentacja procesu, audyt,
przygotowanie deployu — idzie przez jeden obowiązkowy obieg:

```text
Operator → Evaluator → Final Control → integracja orkiestratora → READY_FOR_DEPLOY
                                                                  → osobna bramka deploy/push
```

Reguła jest nienegocjowalna, bez wyjątku „to tylko drobiazg". Pełny opis ról,
pętli domknięcia i dwóch wąskich wyjątków: [`docs/decyzje/R-PROC-AUTOBOT.md`](docs/decyzje/R-PROC-AUTOBOT.md).

## Kolejność czytania na starcie sesji

1. Ten plik (`README.md`) — masz go już przed sobą.
2. [`docs/procesy/INDEX-PROCESU.md`](docs/procesy/INDEX-PROCESU.md) — mapa: co gdzie jest, gdzie zapisywać artefakty.
3. [`docs/decyzje/R-PROC-AUTOBOT.md`](docs/decyzje/R-PROC-AUTOBOT.md) — pełna norma: role, ABC/ECHO, bramki, bariery.
4. [`playbook.md`](playbook.md) **w całości** — zasady aktywne, rejestr błędów „nigdy więcej", sprawy otwarte.
5. [`dyspozycje/_handoff/HANDOFF-AKTUALNY.md`](dyspozycje/_handoff/HANDOFF-AKTUALNY.md) — jedyny bieżący stan przejęcia.
6. Końcówka [`dyspozycje/_handoff/KANAL-PRACA.md`](dyspozycje/_handoff/KANAL-PRACA.md) — ostatnie przekazania między sesjami.
7. Rejestr tematu, aktywne ABC/ECHO i decyzję właściciela: [`dyspozycje/REJESTR-PROSB-I-ZADAN.md`](dyspozycje/REJESTR-PROSB-I-ZADAN.md), [`dyspozycje/PYTANIA-OTWARTE.md`](dyspozycje/PYTANIA-OTWARTE.md).
8. Dopiero na końcu: faktyczny Git, diff, testy, kod.

Nie zaczynaj od starego handoffu, płaskiego logu, samego czatu ani
`docs/archiwum-procesu/` — to historia, nie aktywny routing.

**Zmieniasz reguły samego AutoBota (nie kod gry)?** Najpierw przeczytaj
[`dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md`](dyspozycje/autobot/JAK-BEZPIECZNIE-EDYTOWAC-AUTOBOT.md) —
mapa wszystkich warstw mechanizmu.

## Jeśli dokumenty się różnią

Nie wybieraj po cichu starszego tekstu. Zatrzymaj interpretację, porównaj
najnowszy handoff, ECHO i faktyczny stan Git, a rozjazd zgłoś w głównym czacie
z właścicielem.

## Narzędzia specyficzne dla agenta

- **Claude Code** — `CLAUDE.md` jest ładowany automatycznie do kontekstu i
  odsyła tutaj; niesie dodatkowo jedną komendę wymagającą stałej, automatycznej
  obecności (kontrola kompletności zgłoszeń), nieduplikowaną nigdzie indziej
  poza swoim odpowiednikiem w regule Cursor.
- **Cursor** — `.cursor/rules/*.mdc` z `alwaysApply: true` odsyłają tutaj i do
  `R-PROC-AUTOBOT.md`; niosą techniczne, zawsze-egzekwowane bramki.
- **Skill dla agentów wspierających mechanizm Skills** (Claude Code i pochodne):
  [`.claude/skills/autobots/SKILL.md`](.claude/skills/autobots/SKILL.md) — ten sam
  routing w formie zoptymalizowanej pod wywołanie skillowe.
- **Dowolny inny agent** — ten plik + kolejność czytania wyżej wystarczy.

Po starcie zamelduj krótko: jakie źródła przeczytałeś, jaki jest bieżący stan,
jakie tematy są aktywne i czy istnieje blokada.
