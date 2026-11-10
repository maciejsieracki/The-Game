STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1
GOAL: Panel „Rekrutacja” (web), wariant A: wiersz ≈ 32 px (test ≤ 36 px), pula rekrutów raz nad listą, na wierszu „potrzebne” i czerwone „brak N”, pełny tekst w podpowiedzi, działa przy 340/307/280 px.

ZMIANY/COMMIT: oceniony `54b47e3e` (Obrona) ← `72e876d6` (Operator) ← `c11f5087` = origin/main (sprawdzone `git fetch` 2026-10-23, bez ruchu). 20 plików, wszystkie z allowlisty; `git diff --check c11f5087 54b47e3e` czysto. Mój zapis: tylko ten raport.

ZAŁOŻENIE FC1: bramki Rust z polecenia (fmt, clippy, wektory) nie dotyczą tematu webowego TS; `rust-port/**`/`src-tauri/**` poza allowlistą i niezmienione. Integracja względem `origin/main`, nie `rust-port/parity-v2`.

ORZECZENIA (zarzuty Evaluatora r1):
1. Pusta kontrola mutanta — NAPRAWIONE w `54b47e3e`, ODDAL. Zmierzyłem: clean.large `layoutPass=true` (asercja dodatnia PASS), mutant.large `layoutPass=false` (`fullHeight=false`), small nadal `exactlyOneActiveScrollbar=true`.
2. Koszt w drugiej linii (Z1) — ODDAL, Z1 AKCEPTUJĘ. Dowód Obrony (`r2-eksperyment-koszt-w-linii-nazwy.log`): koszt w linii nazwy → 9/13 uciętych przy 340 px, sprzeczne z binarnym K3 (≤ 2/13). Z1: jeden wiersz 34,3 px ≤ 36, 13/13 widocznych, 1/13 uciętych; zrzut `po-rekrutacja-340px.png` czytelny. Uwaga dla orkiestratora: odstępstwo od makiety pokazać właścicielowi przy zgodzie na wydanie ROBOCZEJ.
3. K3 zaniżone — NAPRAWIONE (pomiar subpikselowy), ODDAL.
4. K3 przy braku rekrutów — NAPRAWIONE (asercja 340/brak 1/13), ODDAL.
5. Utrzymanie znika w wierszu przy 280–340 px — ODDAL: zgodne z zatwierdzoną makietą A (< 400 px), dane w karcie szczegółów; opis sprostowany w `03-obrona-r1.md`.
6. Długość raportu — ODDAL (formalne).
7. `hud-tooltip-body` — ODDAL: u mnie 16/0; test nie dotyka zmienionych plików bezpośrednio, niestabilność hover poza tematem.

TESTY (samodzielnie, worktree wf_0f6b5d81-ecb-4, `npm ci --ignore-scripts`, Chromium /opt/pw-browsers):
- compact-row 39/0 (340: 34,3 px, 13/13, ucięte 1/13; 307: 3/13; 280: 5/13; hScroll 0; brak: 1/4/6)
- compact-row `--baseline c11f5087`: 20/19, K1/K2/K3 czerwone (odróżnia)
- height 13/0; recruit-card-manpower 20/0, `--mutate` 10/10
- quantity 25/0, stock-chip 15/0, resource-strip 18/0, unit-recruit-nazwa 17/0, entity-card-contract 75/0, city-panel-growth 29/0, hud-tooltip-body 16/0
- `tsc --noEmit` 0; bezpośredni `vite build` do katalogu tymczasowego OK (usunięty); `node_modules` usunięte
- NIE_ZMIERZONO: side-list-hud, citypanel-konwerter/uwagi/spichlerz (zielone u Operatora i Evaluatora na `72e876d6`; `54b47e3e` zmienia tylko testy)

KOLEJNOŚĆ INTEGRACJI (na origin/main `c11f5087`, fast-forward): `72e876d6` → `54b47e3e` → commit tego raportu (rodzic `54b47e3e`) → cherry-pick `762e79bb` (tylko `02-evaluator-r1.md`, bez konfliktu).

BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora → READY_FOR_DEPLOY; wydanie ROBOCZEJ wyłącznie po osobnej zgodzie właściciela.
DEPLOY/PUSH: NIE WYKONANO
