# 01-operator — R-AUTOBOT-FINALCONTROL-SUBAGENT-RESTORE-Q1

STATUS: PASS
TEMAT: R-AUTOBOT-FINALCONTROL-SUBAGENT-RESTORE-Q1
GOAL: Przywrócić do `docs/decyzje/R-PROC-AUTOBOT.md` §5a jawne stwierdzenie, że dla
sesji Claude Code Final Control używa tego samego modelu/effort co Evaluator
(Sonnet 5, effort High) i jest wykonywany przez OSOBNEGO subagenta, nigdy
bezpośrednio przez głównego orkiestratora — analogicznie do zapisu w §1 dla
GPT-5.6 Luna. Dopisać odpowiadający wpis C-062 w README.md i playbook.md.

ZMIANY/COMMIT:
- `docs/decyzje/R-PROC-AUTOBOT.md` §5a — w akapicie „Dla sesji Claude Code,
  Ścieżka A..." dopisane zdanie o Final Control (ten sam model/effort co
  Evaluator, osobny subagent, nigdy główny orkiestrator) zaraz po zdaniu
  kończącym się „...nie inny, droższy model.", przed „Ta reguła dotyczy
  WYŁĄCZNIE sesji Claude Code...".
- `README.md`, sekcja „Co nowego w regułach AutoBota" — dodany nowy wpis
  **C-062** na górze listy (przed C-061); lista miała już 12 wpisów (C-050…
  C-061), więc zgodnie z instrukcją nagłówka sekcji usunięty najstarszy wpis
  **C-050** — lista nadal ma 12 wpisów. Poprawiona też brakująca pusta linia
  przed nagłówkiem `## Zanim cokolwiek zrobisz` po usunięciu C-050.
- `playbook.md` — dodany wiersz tabeli `C-062` bezpośrednio po `C-061`,
  format skopiowany z sąsiednich wpisów C-060/C-061 (pogrubiony tytuł caps +
  autor/data w nawiasie, opis, kolumna trigger, `0 | 0 | AKTYWNA`).
- Zero zmian poza tymi trzema plikami. `git status --porcelain` przed
  commitem: wyłącznie `README.md`, `docs/decyzje/R-PROC-AUTOBOT.md`,
  `playbook.md` (M) — zgodnie z allowlistą.
- SHA commitu: patrz sekcja na końcu wiadomości do orkiestratora (podane po
  wykonaniu `git commit`).

TESTY: Brak — zmiana wyłącznie dokumentacji procesu (docs-only), nie dotyka
`gra/` ani żadnego kodu wykonywalnego. Weryfikacja ręczna wykonana zamiast
bramek testowych:
1. `git diff --check` — brak konfliktowych markerów/whitespace errors.
2. `git diff --stat` — dokładnie 3 pliki zmienione, zgodnie z allowlistą.
3. `grep -c '^\- \*\*C-0' README.md` → 12 (limit utrzymany po dodaniu C-062
   i usunięciu C-050).
4. Ręczny przegląd pełnego diffa (wklejony w wiadomości do orkiestratora) —
   potwierdzone, że C-050…C-061 poza usuniętym C-050 pozostają nietknięte,
   że nowe zdanie w §5a nie zmienia istniejącego tekstu poza dopisaniem, i
   że wpis C-062 w playbook.md ma tę samą strukturę kolumn co C-061.
5. `git merge-base --is-ancestor a9bb6d8d HEAD` (po `git merge --ff-only`) —
   potwierdzone, że dispatch `a9bb6d8d` jest przodkiem HEAD przed edycją.

BLOKADY: Brak. Worktree startował na starszym punkcie (HEAD 6ce11f7f, przodek
a9bb6d8d) — zgodnie z KROKIEM 0 wykonano `git merge --ff-only a9bb6d8d`
(fast-forward, 66 plików, bez konfliktów) przed edycją plików docelowych.

NASTĘPNY KROK: Evaluator (Sonnet 5, effort High) — adwersaryjna weryfikacja:
(a) czy zdanie w §5a wiernie oddaje treść z GOAL/dispatchu, (b) czy limit 12
wpisów w README.md jest poprawnie utrzymany i kolejność chronologiczna
poprawna, (c) czy format wpisu C-062 w playbook.md faktycznie odpowiada
konwencji C-060/C-061, (d) potwierdzenie zero zmian poza allowlistą.

DEPLOY/PUSH: NIE WYKONANO
