# 04 — INTEGRATION

STATUS: INTEGRATED
TEMAT: R-TECHNOLOGIA-KARTY-PODGLAD-KLIK-Q1
MODEL: gpt-5.6-luna, reasoning medium

## Provenance i bramka wejściowa

- Integracja wykonana w `Civ-clean-main-2026-08-20`.
- Baza przed zmianą: detached HEAD `47cdca15757efb89d5e634e9e9ddff370925708d` (`47cdca15`, `origin/main`, `work/clean-main-2026-08-20`).
- Przed zmianą sprawdzono `git status`; drzewo zawierało cudze, niezwiązane modyfikacje. Nie resetowano, nie czyszczono i nie zmieniano tych plików.
- Final Control z `03-final-control.md`: `PASS-WITH-NOTES`, `GOTOWOŚĆ DO INTEGRACJI: TAK`.
- `dyspozycje/WERSJE.md`: niezmienione.

## Allowlista i faktyczny diff

Zintegrowano wyłącznie trzy pliki z allowlisty 00/01/02/03:

- `gra/src/ui/techTreeView.ts`
- `gra/src/ui/scienceHubHud.ts`
- `gra/src/ui/techDiscoveryNotice.ts`

Dokładny zakres względem bazy `47cdca15757efb89d5e634e9e9ddff370925708d`:

```text
 gra/src/ui/scienceHubHud.ts       | 35 ++++++++++++++++++++++++-----------
 gra/src/ui/techDiscoveryNotice.ts | 23 +++++++++++++++++------
 gra/src/ui/techTreeView.ts        | 19 ++++++++++++++-----
 3 files changed, 55 insertions(+), 22 deletions(-)
```

Treść zmian: wspólna karta preview technologii, klik z drzewka i huba dla stanów `lk`, `ip`, `od`, `av`, osobna akcja `Rozpocznij badanie` wyłącznie dla `av`, zachowane zamykanie Esc/click-outside i akcje klawiatury. Nie zmieniono silnika badań, danych gry, testów ani `WERSJE.md`.

## Testy i faktyczny wynik

- `node tools/technology-discovery-card-visual-test.cjs`: **17 PASS / 0 FAIL**, exit 0.
- `node tools/tech-tree-test.cjs`: **nie wykonano skutecznie**, exit 1; clean-main nie ma `esbuild`, a próba z istniejącym `NODE_PATH` kończy się odmową dostępu przy tworzeniu/odczycie tymczasowego entrypointu.
- `node tools/research-test.cjs`: **nie wykonano skutecznie**, exit 1; ten sam problem infrastrukturalny `esbuild`/entrypoint.
- `node tools/science-hub-test.cjs`: **nie wykonano skutecznie**, exit 1; ten sam problem infrastrukturalny `esbuild`/entrypoint.
- `npm run typecheck`: clean-main bez lokalnych zależności — `tsc` nierozpoznany, exit 1.
- Typecheck z istniejącego lokalnego binarium `tsc`: exit 2; błędy są poza allowlistą (m.in. `audio/filePlayer.ts`, brak modułu `three` oraz błędy w renderze/battle). Nie wystąpiła zmiana tych plików.
- `git diff --check` dla trzech plików allowlisty: bez błędów whitespace.

## Wynik integracji

- Integracja faktyczna: **TAK** — trzy pliki allowlisty są w drzewie `Civ-clean-main-2026-08-20`.
- Commit integracji: **NIE UTWORZONO** — Git nie może utworzyć `.git/worktrees/.../index.lock` (`Permission denied`); nie obchodzono tej blokady i nie zmieniano historii.
- Zmiany poboczne: **NIE** — istniejące cudze zmiany pozostawiono bez dotykania.
- Deploy: **NIE WYKONANO**.
- Push: **NIE WYKONANO**.
- `READY_FOR_DEPLOY`: **TAK** — wyłącznie po faktycznej integracji; z notą o ograniczeniach testów środowiskowych opisanych powyżej. Deploy pozostaje osobną bramką wymagającą wyraźnego polecenia.
