# 04-integration — R-AUTO-BITWA-JEDNOCZESNA-Q1

STATUS: DEPLOY-ROBOCZA
DOMAIN: GAME
TEMAT: R-AUTO-BITWA-JEDNOCZESNA-Q1
GOAL: AUTO prowadzi jednoczesne, deterministyczne fazy atakujących i obrońców z zamrożonym zamiarem fazy.

## Bramka źródłowa

- Final Control: `t_08ea70f2` — `PASS-WITH-NOTES / READY_FOR_INTEGRATION` po bounded remedy.
- Integracja: workerless gate `t_58f78ccd`; zgodnie z kontraktem nie dispatchowano karty.
- Zintegrowany kandydat: `d627465b` (`integrate local simultaneous auto-battle candidate`).
- Baza bieżącej integracji: `origin/main=7cfead757737d1c1a7ddfc187a3241dad5bb0e57`.
- Wspólny commit integracyjny fali: `8c505dae`.

## Zakres

- `gra/src/battle/autoBatchPhase.ts`
- `gra/src/battle/battleScene.ts`
- `gra/tools/auto-battle-simultaneous-test.cjs`

Nie pobrano broad harnessu oznaczonego wcześniej jako INFRA/TIMEOUT i nie zmieniono jego klasyfikacji.

## Niezależny readback na stanie połączonej fali

- `auto-battle-simultaneous-test.cjs`: `29 pass, 0 fail`;
- combat regression: `6/6 pass`;
- TypeScript `tsc --noEmit`: exit `0`;
- syntax focused testu: exit `0`;
- `git diff --check`: exit `0`;
- Vite production build: `892 modules`, exit `0`;
- świeży bundle smoke: `SMOKE OK`, canvas `1`, rAF `1`;
- allowlista readback: zakres auto obejmuje wyłącznie 3 zatwierdzone ścieżki.

## Stan publikacji

- `READY_FOR_DEPLOY`: TAK — integracja i bramki na aktualnej bazie były zielone przed publikacją.
- Artifact/publish commit: `77b762b3f622b92f50b187ac881732a6268aae7e`.
- Remote `main` readback: `77b762b3f622b92f50b187ac881732a6268aae7e`.
- Bundle: MD5 `d8d7071ee96ad85e249b9d92b7b8e432`, SHA-256 `a21b9b8143bd414eec5ee23f65150f33ba6266e595c028d50a7692695ce13fe4`, `69913695` bytes.
- `verify-robocza-bundle.cjs`: `VERIFY OK`; manifest/hash/bytes readback: `PASS`.

Push/deploy ROBOCZA: WYKONANO po osobnej zgodzie właściciela; branch i `main` mają ten sam publish commit.

BLOKADY: brak techniczny. Broad harness INFRA/TIMEOUT pozostał poza zakresem i nie został relabelowany.
RUNDY: bounded remedy + Final Control; integracja bez nowego dispatchu workerless gate.
NASTĘPNY KROK: test właściciela w `gra-robocza/START.html` po `Ctrl+F5`.
DEPLOY/PUSH: WYKONANO
