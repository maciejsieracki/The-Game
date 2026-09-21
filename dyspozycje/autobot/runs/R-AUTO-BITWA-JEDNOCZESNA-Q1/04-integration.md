# 04-integration — R-AUTO-BITWA-JEDNOCZESNA-Q1

STATUS: READY_FOR_DEPLOY
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

`READY_FOR_DEPLOY`: TAK — integracja i bramki na aktualnej bazie są zielone.

Push/deploy ROBOCZA: NIE WYKONANO w chwili utworzenia tego receipt; wymaga osobnej bramki publikacji właściciela.

BLOKADY: brak techniczny; pozostaje wyłącznie osobna bramka publikacji.
RUNDY: bounded remedy + Final Control; integracja bez nowego dispatchu workerless gate.
NASTĘPNY KROK: build artefaktu, stempel, manifest, verify, wpis WERSJE/KANAL, commit i push z readbackiem.
DEPLOY/PUSH: NIE WYKONANO
