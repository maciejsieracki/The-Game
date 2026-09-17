# Deploy ROBOCZA receipt — 2026-09-17

STATUS: DEPLOY-ROBOCZA / remote push and readback pending at receipt creation
DOMAIN: GAME

## Source

- board: `the-game-real24`
- project: `p_9ae9ac64`
- integration branch: `integration/robocza-20260917`
- base: `578051aea1a0bf1ae174efb446bd99f6997ef9ab`
- source/integration commit: `622a9995b6bf39f1bce90d10df095ec4a47e081a`
- artifact commit: `da301683fb70dbbd73fb031d74afc6e959dfdc7b`

## Artifact

- file: `gra-robocza/Gra-ROBOCZA.html`
- bytes: `69875101`
- md5: `4e72d43560d91aec6724f52401ada95a`
- sha256: `a3baaab0e8b4fa700a95765d93cc4b235dd34c5201facb2caf91b1d45f7a7a5e`
- verifier: `VERIFY OK`
- manifest match: `OK`
- smoke: `PASS`
- Vite: `889` modules

## Scope

New product wave:

- `R-GARNIZON-PANEL-DOCELNY-Q1`
- `R-ARMIA-AI-SCALANIE-REKRUTACJA-Q1`
- `R-ARMIA-MERGE-PANEL-SCROLL-Q1`
- `R-HANDEL-DOCHOD-HALF-CEIL-Q1`
- `R-REKRUTACJA-PANEL-WYSOKOSC-5-KART-Q1`
- `R-KOSZTY-EPOKOWE-ULEPSZENIA-Q1`
- `R-REKRUTACJA-MASOWA-TABELA-MIASTA-Q1`

Revalidated as already present in the verified base, with no new product diff:

- `R-MIASTA-KOLONIA-NAZWA-POOL-Q1`
- `R-REKRUTACJA-KOSZTY-POLOWA-ALL-Q1`
- `R-CYWILIZACJE-GRECJA-ALOKACJE-Q1`
- `R-AI-PRACA-BUDYNKI-ULEPSZENIA-Q1`
- `R-CYWILIZACJE-GRECJA-AKTYWNE-PARAMETRY-Q1`

Audit/test-only:

- `R-AI-BUDZET-SKARB-NAUKA-ZAMOZNOSC-Q1` — no production change in `gra/src` or `gra/data`.

No promotion to `gra-kanon` or `FINALNA`.

PUSH/REMOTE READBACK: pending.
