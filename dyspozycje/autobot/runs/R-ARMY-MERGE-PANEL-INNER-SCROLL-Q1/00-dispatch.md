# AutoBot dispatch — Army Merge panel inner scroll

TEMAT: `R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1`
RUNDA: 2/5
DATA: 2026-10-28
BAZA: `91dc998a5f1b51ad29e0f4785edfd45655445c53`
WORKTREE: `/workspace/army-merge-scroll`
BRANCH: `codex/army-merge-panel-inner-scroll-q1`

## Cel

W długim rosterze Army Merge pokaż trwały, czytelny scrollbar, przewijaj wyłącznie roster, zachowaj widoczne akcje poza scroll regionem i utrzymaj bezpieczny margines panelu przy 150% skali.

## Kryteria końca

- Prawdziwy Chromium renderuje 59 istniejących jednostek (60 wierszy z przybywającą) przy 900×620 oraz 600×413 CSS px / DPR 1.5.
- Oba CTA mieszczą się w stopce poza rosterem i zachowują kliknięcia/callbacki.
- Widoczny track/thumb ma złote piksele w rzeczywistym zrzucie; thumb przesuwa się ze scrollem i przeciągnięcie osiąga ostatni wiersz.
- Panel zachowuje co najmniej 24 px marginesu; tylko roster przewija się pionowo.
- Skupiony test, typecheck i `git diff --check` przechodzą.

## Granice

Bez zmian mechaniki scalania. Bez commit, push, merge i deploy.
