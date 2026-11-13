# 04-integration — R-MANPOWER-HP-MAX-EFFECTIVE-Q1

STATUS: DEPLOY-ROBOCZA
DOMAIN: GAME
TEMAT: R-MANPOWER-HP-MAX-EFFECTIVE-Q1
GOAL: Zachować kanoniczne effective maxHP w Manpower, RuntimeUnit, walce, UI i save/load.

## Bramka źródłowa

- Final Control: `t_c24ebf5d` — `PASS-WITH-NOTES`.
- Integracja: workerless gate `t_d3ab41c4`; zgodnie z kontraktem nie dispatchowano karty.
- Produkt: `c194264b` (`integrate local effective max hp manpower candidate`).
- Baza bieżącej integracji: `origin/main=7cfead757737d1c1a7ddfc187a3241dad5bb0e57`.
- Wspólny commit integracyjny fali: `8c505dae`.

## Zakres

Allowlista produktu:

- `gra/src/game/combat.ts`
- `gra/src/game/manpower.ts`
- `gra/src/game/unit-card-stats.ts`
- `gra/src/game/veteran.ts`
- `gra/src/main.ts`
- `gra/src/units/setup.ts`
- `gra/tools/r-manpower-hp-max-effective-currentbase-q1-test.cjs`
- `gra/tools/r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs`

Nie pobrano zmian z brudnego checkoutu głównego ani z innych tematów.

## Niezależny readback na stanie połączonej fali

- effective maxHP: `15 OK, 0 FAIL`;
- uzupełnianie HP: `17 OK, 0 FAIL`;
- Manpower: `63 OK, 0 FAIL`;
- unit card: `29 pass, 0 fail`;
- veterans: `79 PASS, 0 FAIL`;
- combat: `6/6 pass`;
- TypeScript `tsc --noEmit`: exit `0`;
- syntax focused testów: exit `0`;
- `git diff --check`: exit `0`;
- Vite production build: `892 modules`, exit `0`;
- smoke świeżego bundla przez `CIV_SMOKE_HTML`: `SMOKE OK`, canvas `1`, rAF `1`;
- allowlista readback: `15` ścieżek produktu, zero nieoczekiwanych.

## Stan publikacji

- `READY_FOR_DEPLOY`: TAK — integracja i bramki na aktualnej bazie były zielone przed publikacją.
- Artifact/publish commit: `77b762b3f622b92f50b187ac881732a6268aae7e`.
- Remote `main` readback: `77b762b3f622b92f50b187ac881732a6268aae7e`.
- Bundle: MD5 `d8d7071ee96ad85e249b9d92b7b8e432`, SHA-256 `a21b9b8143bd414eec5ee23f65150f33ba6266e595c028d50a7692695ce13fe4`, `69913695` bytes.
- `verify-robocza-bundle.cjs`: `VERIFY OK`; manifest/hash/bytes readback: `PASS`.

Push/deploy ROBOCZA: WYKONANO po osobnej zgodzie właściciela; branch i `main` mają ten sam publish commit.

BLOKADY: brak techniczny. Promocja do KANON/FINALNA nie była wykonywana.
RUNDY: 1/5
NASTĘPNY KROK: test właściciela w `gra-robocza/START.html` po `Ctrl+F5`.
DEPLOY/PUSH: WYKONANO
