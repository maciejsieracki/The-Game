# 04-integration — R-REKRUTACJA-WIELE-JEDNOSTEK-UI-Q1

STATUS: DEPLOY-ROBOCZA
DOMAIN: GAME
TEMAT: R-REKRUTACJA-WIELE-JEDNOSTEK-UI-Q1
GOAL: Panel rekrutacji wybiera q jednostek, a zakup i anulowanie pozostają atomowe z zachowaniem kosztów, zasobów i save/load.

## Bramka źródłowa

- Final Control: `t_1bbfe729` — `PASS-WITH-NOTES / READY_FOR_INTEGRATION`.
- Integracja: workerless gate `t_4d4b8bf1`; zgodnie z kontraktem nie dispatchowano karty.
- Produkt: `8b40ba23` (`feat: add atomic multi-unit recruitment controls`).
- Zintegrowany kandydat z aktualnej bazy: `d8ef53b5`.
- Baza bieżącej integracji: `origin/main=7cfead757737d1c1a7ddfc187a3241dad5bb0e57`.
- Wspólny commit integracyjny fali: `8c505dae`.

## Zakres

- `gra/src/main.ts`
- `gra/src/ui/cityPanel.ts`
- `gra/src/ui/unitRecruitCard.ts`
- `gra/tools/recruit-card-quantity-real-render-test.cjs`
- `gra/tools/recruitment-batch-contract-test.cjs`

Współdzielony `main.ts` został zintegrowany allowlist-only z poprawką manpower; połączenie przeszło typecheck i regresje.

## Niezależny readback na stanie połączonej fali

- backend contract: `17 passed, 0 failed`;
- real Chromium render: `25 passed, 0 failed`, brak `pageerror/console.error`;
- TypeScript `tsc --noEmit`: exit `0`;
- syntax focused testów: exit `0`;
- `git diff --check`: exit `0`;
- Vite production build: `892 modules`, exit `0`;
- świeży bundle smoke: `SMOKE OK`, canvas `1`, rAF `1`;
- allowlista readback: zakres rekrutacji obejmuje wyłącznie 5 zatwierdzonych ścieżek.

## Stan publikacji

- `READY_FOR_DEPLOY`: TAK — integracja i bramki na aktualnej bazie były zielone przed publikacją.
- Artifact/publish commit: `77b762b3f622b92f50b187ac881732a6268aae7e`.
- Remote `main` readback: `77b762b3f622b92f50b187ac881732a6268aae7e`.
- Bundle: MD5 `d8d7071ee96ad85e249b9d92b7b8e432`, SHA-256 `a21b9b8143bd414eec5ee23f65150f33ba6266e595c028d50a7692695ce13fe4`, `69913695` bytes.
- `verify-robocza-bundle.cjs`: `VERIFY OK`; manifest/hash/bytes readback: `PASS`.

Push/deploy ROBOCZA: WYKONANO po osobnej zgodzie właściciela; branch i `main` mają ten sam publish commit.

BLOKADY: brak techniczny. Promocja do KANON/FINALNA nie była wykonywana.
RUNDY: 1/5 dla bieżącego kandydata; integracja bez nowego dispatchu workerless gate.
NASTĘPNY KROK: test właściciela w `gra-robocza/START.html` po `Ctrl+F5`.
DEPLOY/PUSH: WYKONANO
