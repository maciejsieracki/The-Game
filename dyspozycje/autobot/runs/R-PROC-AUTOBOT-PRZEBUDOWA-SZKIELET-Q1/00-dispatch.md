# 00 — DISPATCH

> **Zapis retroaktywny.** Katalog runu nie powstał w momencie dispatchu — temat
> ruszył z czatu orkiestratora bez założenia `dyspozycje/autobot/runs/<ID>/`.
> Brak wykrył Final Control rundy 2 (defekt D-5). Ten plik odtwarza faktyczny
> dispatch z jawnego polecenia właściciela i z zakresu prac rund 1–3; nie jest
> dokumentem powstałym przed rundą 1.

STATUS: PASS
DOMAIN: PROCESS
TEMAT: `R-PROC-AUTOBOT-PRZEBUDOWA-SZKIELET-Q1`
GOAL: Przebudować dokumentację procesu AutoBot tego repo na nowy, uniwersalny
szkielet ról i bramek, bez zmian w `gra/` — tak, żeby od następnego dispatchu
obowiązywał jeden spójny opis obiegu Operator → Evaluator → Final Control →
integracja → `READY_FOR_DEPLOY` → osobna bramka deploy/push.

## Wyzwalacz

Jawne polecenie właściciela w głównym czacie orkiestratora (C-043):

> „Uzupelnij sobie zasady autobota o nowe, calkowicie przebudowane i zastosuj je
> u siebie. Zrob to poprzez workflow Autobot, ktory masz obecnie."

## Izolacja

Gałąź `autobot/PROC-SZKIELET-Q1` (nie `main`), osobny worktree per runda:
`/home/user/wt-proc-szkielet-q1` (runda 1), `…-r2` (runda 2), `…-r3` (runda 3).
Bez push na `main` i bez deployu na żadnym etapie; push wyłącznie na gałąź tematu.

## Allowlista

- `docs/decyzje/R-PROC-AUTOBOT.md`
- `.claude/skills/autobots/SKILL.md`
- `.claude/skills/civ-autobot/SKILL.md`
- `.claude/skills/civ-autobot-workflow/SKILL.md`
- `.claude/skills/civ-autobot-cursor-automations/SKILL.md`
- `CLAUDE.md`
- `docs/procesy/INDEX-PROCESU.md` (dopisane w rundzie 3, defekt D-3)
- `dyspozycje/autobot/runs/R-PROC-AUTOBOT-PRZEBUDOWA-SZKIELET-Q1/` (dopisane w
  rundzie 3, defekt D-5)

Poza zakresem bezwzględnie: `gra/**` i wszystko od `gra/` zależne, `playbook.json`,
`dyspozycje/WERSJE.md`, `gra-robocza/ROBOCZA-MANIFEST.json`, `.git/**`, deploy, push
na `main`.

## Kryteria sukcesu

1. Dokument procesu jest spójny wewnętrznie — żaden dwóch miejsc nie opisuje tej
   samej reguły w sprzeczny sposób.
2. Zero wartości przeniesionych z obcego projektu przykładowego, z którego
   pochodzi wzorzec uniwersalnego szkieletu — żadnych jego nazw, ról, progów ani
   ścieżek. Kontrola: `grep -rn` po nazwie tamtego projektu musi dawać **zero**
   trafień w repo (nazwy celowo nie zapisujemy tutaj, żeby sama kontrola jej nie
   wprowadziła).
3. Wszystkie ustalone wcześniej zasady The-Game zachowane — bariery CHRONIONE,
   ABC/ECHO, limit 5 rund, allowlist-only, granice §9.
4. Trzy nośniki kontraktu raportu (`CLAUDE.md`, `R-PROC-AUTOBOT.md` §4,
   `docs/procesy/INDEX-PROCESU.md` §6) mają identyczny zestaw pól.
5. Dokument jest gotowy do użycia od następnego dispatchu — bez dalszych korekt
   procesu jako warunku wejścia.
6. Zero zmian w `gra/` (kontrola `git status` + `git diff --check`).

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, na TEJ SAMEJ
gałęzi i TYM SAMYM ID. Limit 5 rund (`R-AUTOBOT-LIMIT-5-RUND-Q1`).
Model/effort: Operator, Evaluator i Final Control — GPT-5.6 Luna High;
integracja — orkiestrator GPT-5.6 Luna Medium (kanon `R-PROC-AUTOBOT.md` §5a).

## Raport terminalny dispatchu

ZMIANY/COMMIT: docs-only, allowlista wyżej; brak zmian w `gra/`.
TESTY: kryteria sukcesu 1–6; brak bramek `gra/` (paczka dokumentacyjna).
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
