# CLAUDE.md — Civ „The Game"

**Status:** łącznik specyficzny dla Claude Code. Uniwersalny, niezależny od
narzędzia punkt startowy to [`README.md`](README.md) — przeczytaj go najpierw,
w całości. Ten plik istnieje osobno wyłącznie dlatego, że jest jedynym plikiem
w tym repo ładowanym automatycznie do kontekstu Claude Code na starcie każdej
tury — więc niesie dodatkowo jedną komendę wymagającą stałej, automatycznej
obecności (§0c niżej), nieduplikowaną nigdzie poza analogiczną regułą Cursor
(`.cursor/rules/komendy-raport.mdc`).

## Start

1. Przeczytaj [`README.md`](README.md) w całości — pełna kolejność czytania jest tam.
2. Bramki (komendy testowe i punkty odniesienia): [`R-PROC-AUTOBOT.md`](docs/decyzje/R-PROC-AUTOBOT.md) §Bramki.
3. Stan tematu potwierdzaj w rejestrze, ABC/ECHO, runie i faktycznym Git; czat,
   UI, nazwa brancha ani sam status nie są dowodem.

## §0c — kontrola kompletności zgłoszeń (C-031, obowiązkowa na starcie sesji)

Po każdej serii rejestracji w `dyspozycje/PYTANIA-OTWARTE.md`, przed zmianą
wątku — uruchom:

```bash
grep -n 'STATUS: \*\*OTWARTE' dyspozycje/PYTANIA-OTWARTE.md
```

(bez kotwicy `^## ` — gubi nagłówki `### `). Dla każdego trafienia potwierdź:
subagent w locie / pytanie ABC zadane / udokumentowany powód odłożenia. Brak
któregokolwiek → zgłoszenie zgubione. Ta komenda żyje TAKŻE w
`.cursor/rules/komendy-raport.mdc` — dwa niezależne, zawsze ładowane nośniki,
bo `playbook.md` i `README.md` wymagają świadomego `Read` i po kompaktowaniu
długiej sesji potrafią zniknąć z pola widzenia. Historia incydentu: `playbook.md` → C-031.

## Bariery krytyczne

- Każdy temat ma pełne ID, `GOAL`, kryteria końca, allowlistę i izolowany worktree.
- Obowiązuje obieg:
  `Operator GPT-5.6 Luna High → Evaluator GPT-5.6 Luna High → Final Control GPT-5.6 Luna High → integracja orkiestratora GPT-5.6 Luna Medium → READY_FOR_DEPLOY`.
- `FAIL`, techniczny `BLOCK`, `TIMEOUT`, `INFRA` i `ZWIS` wracają do Operatora tylko po sprawdzeniu licznika rund przed dispatchiem i wyłącznie dla rund 1–5. Próba 6 jest zatrzymana statusem `LIMIT-5-EXCEEDED`; wznowienie po limicie wymaga jawnej decyzji orkiestratora/właściciela, zachowuje ID i nie resetuje licznika. ABC pauzuje tylko temat wymagający decyzji właściciela.
- Właściciel komunikuje się wyłącznie w głównym czacie orkiestratora (C-043).
  Subagenci są kanałami technicznymi.
- Operator, Evaluator i Final Control nie integrują, nie deployują i nie pushują.
  Deploy/push wymaga osobnej autoryzacji po `READY_FOR_DEPLOY`.
- Nie zmieniaj `gra/` ani `gra/`-zależnych artefaktów przy paczce dokumentacyjnej.
  Przed zapisem sprawdź allowlistę, `git status`, diff i `git diff --check`.

## Minimalny kontrakt raportu

Każdy etap zapisuje w `dyspozycje/autobot/runs/<ID>/`:

```text
STATUS: PASS | PASS-WITH-NOTES | FAIL | BLOCK | TIMEOUT | INFRA | LIMIT-5-EXCEEDED
TEMAT: <pełne ID>
GOAL: <cel końcowy>
ZMIANY/COMMIT: <allowlista, artefakt, SHA albo brak zmian>
TESTY: <dokładne wyniki albo powód pominięcia>
BLOKADY: <jawna lista albo brak>
NASTĘPNY KROK: <kolejna bramka>
DEPLOY/PUSH: WYKONANO albo NIE WYKONANO
```

`READY_FOR_DEPLOY` może wystawić wyłącznie orkiestrator po Final Control i faktycznej
integracji. Historyczne routingi i snapshoty są tylko w
[`docs/archiwum-procesu/`](docs/archiwum-procesu/).
