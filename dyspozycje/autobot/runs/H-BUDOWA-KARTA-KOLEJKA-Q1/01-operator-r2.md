# Operator runda 2 — H-BUDOWA-KARTA-KOLEJKA-Q1

STATUS: BLOCK
DOMAIN: INFRA
TEMAT: H-BUDOWA-KARTA-KOLEJKA-Q1
GOAL: Usunąć cudzy artefakt z historii gałęzi i zastąpić test tekstowy testem runtime/renderu kart budynku z kontrolą niezmienności kolejki.
ZMIANY/COMMIT: odbudowano `hermes/H-BUDOWA-KARTA-KOLEJKA-Q1` od `origin/main`, zachowując własne commity (odtworzone jako `5b0c8782`, `a53edcf5`, `f100cba8`); dodano/zmieniono `gra/tools/building-queue-detail-card-test.cjs`; backup poprzedniego stanu: `backup/H-BUDOWA-KARTA-KOLEJKA-Q1-before-r2`.
TESTY: `node --check tools/building-queue-detail-card-test.cjs` PASS; bundlowanie testu esbuild przechodzi, ale pełny `node tools/building-queue-detail-card-test.cjs` BLOCK — środowisko nie ma Chromium, a `npx playwright install chromium`/`chromium-headless-shell` przekroczyło timeout (pobrany cache jest niekompletny). `npx tsc --noEmit` PASS. `node tools/logic-test.cjs` PASS (`LOGIC OK (213/213)`). `node tools/city-state-prod-audit-test.cjs` PASS (`17 passed, 0 failed`). `git diff --check` PASS.
BLOKADY: Brak wykonywalnego Chromium/Playwright w środowisku Operatora; nie deklaruję PASS testu runtime bez jego uruchomienia. Instalacja przeglądarki z sieci zawisła/przekroczyła limit czasu.
RUNDY: 2/5
NASTĘPNY KROK: Uruchomić `node tools/building-queue-detail-card-test.cjs` w środowisku z Chromium; następnie bramka Evaluatora.
DEPLOY/PUSH: NIE WYKONANO

## Zakres naprawy

- Historia gałęzi została bezpiecznie przepisana względem `origin/main`; cudzy plik `dyspozycje/autobot/runs/H-BUDYNKI-KOSZT-PRACY-50-Q1/01-operator.md` nie występuje już w diffie.
- Test nie czyta `cityPanel.ts` jako kontraktu funkcjonalnego. Esbuild dołącza produkcyjny `cityPanel.ts` 1:1 (z eksportami testowymi przez plugin), a Playwright uruchamia go w prawdziwym Chromium DOM.
- Scenariusz renderuje dostępny wiersz, oczekującą pozycję kolejki oraz aktywny front budynku; używa realnych anchorów i eventów hover/click, a renderer karty pochodzi z produkcji.
- Snapshot `prod.kolejka` jest porównywany przed/po podglądzie; callback zapisu kolejki jest zliczany i musi pozostać na zero. Mutant produkcyjnego `attachInteractiveDetail(queueIcon, ...)` → `attachHoverDetail(queueIcon, ...)` jest bundlowany osobno i oczekiwane jest rzeczywiste nieotwarcie karty po kliknięciu.
