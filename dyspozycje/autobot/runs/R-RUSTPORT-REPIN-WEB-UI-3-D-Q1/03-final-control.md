STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-D-Q1 — Final Control
GOAL: przepiąć do `src-tauri/frontend-v2/src/ui/` zmiany weba `86d510c66 → 9b019a7d8` w `minimapHud.ts` (ramka widoku podąża za kamerą, `updateViewport`) i `hud.ts` (baner 3+3 brutto/netto, niedobory, „Rekrutacja”, k/M, jedna migawka `getState()`).

ZMIANY/COMMIT (sprawdzone):
- Gałąź `rp-ui3d-op-r1-obrona`, HEAD `e8757d4c5` (kod `fe7c77348`, narzędzia obrony `63731f3af`), baza `dde5e9034` (przodek `origin/rust-port/parity-v2` `8bc2efcf8`).
- `git diff --name-only dde5e9034..e8757d4c5`: 2 pliki `src/ui` (hud, minimapHud), `tools/**`, `package.json`, `P5-REPIN-UI-2.md`, `runs/R-RUSTPORT-REPIN-WEB-UI-3-D-Q1/**` (w tym 18 PNG). Wszystko w allowliście. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `viewmodel/types.ts`. `git diff --check` czysty.
- Obrona (`825bbf054..e8757d4c5`) nie zmienia `src/**` — tylko narzędzia ui2c/ui3d, fixtura, selftest, dokumentacja.
- Ten commit FC: tylko ten plik.

ORZECZENIE ZARZUTÓW:
- Z1 (mutator ui2c nie przechodził: H5/H6/H11) — ODDAL (naprawione w obronie). `mutate-repin-ui2c.mjs --dry-run` na kodzie końcowym: EXIT=0, aktywnych 40, wycofanych/przeniesionych 5. H5/H6/H11 `wycofana` (wzorzec 0×, powrót kodu = EXIT 2), H4/H12 `przeniesiona` do ui3d H23/H24 — obie WYKRYTE u mnie.
- Z2 (brak odtwarzalnego dowodu 8/8) — ODDAL (naprawione). `node tools/selftest-verify-repin-ui3d.mjs --web-dir <WEB3>`: kontrola EXIT=0, N1–N10 wykryte 10/10, każde właściwą regułą; worktree czysty po przebiegu.
- Z3 (konflikty integracji) — ODDAL jako zarzut wobec gałęzi; informacja dla orkiestratora. `git merge-tree origin/rust-port/parity-v2(8bc2efcf8) e8757d4c5`: konflikty treści w 5 plikach wspólnych (`P5-REPIN-UI-2.md`, `package.json`, `ui2c.json`, `repin-ui2-overlay.mjs`, `repin-ui3-manifest.json`); `verify-repin-ui3-copies.mjs` scala się automatycznie. `hud.ts`, `minimapHud.ts`, `mutate-repin-ui2c.mjs` nie zmienione na parity-v2 od `dde5e9034` (rozłączność potwierdzona).
- NAPRAW: brak. DO DECYZJI CZŁOWIEKA: brak.

TESTY (moje, worktree `wf_4c768c78-7fe-4`, HEAD `e8757d4c5`, `npm ci`):
- `tsc --noEmit` EXIT=0; `npm run check` EXIT=0 (ui3d portów=2 źródło_sprawdzone=2 bloków=1 deps=1; UI-3 kopii=12, niezgodnych=0).
- `run-repin-ui3d` (własny `git archive 9b019a7d8 gra/src gra/data`, Chromium 141): EXIT=0, scen=10×2, kroków=282, zrzutów=18, PIX_różnych=0, pokrycie 40/40, błędów strony 0, różnic 0. Fixtura z `--out` bajtowo = commitowana (sha256 `554c2aa1625f4478…`). 18 PNG = `runs/…/png` (`diff -rq` czysty).
- `mutate-repin-ui3d` 0–33: 34/34 WYKRYTE. M6, H3, H4, H9 i H23 dały najpierw EXIT=2 — przyczyna zmierzona: `Target page, context or browser has been closed` (INFRA); w tym samym oknie 2/2 przebiegi BAZOWE bez mutacji też dały EXIT=2 z tym samym błędem. Po ponowieniu pojedynczo każda: EXIT=1 (WYKRYTA).
- Selftest bramki 10/10; ui2c `--dry-run` EXIT=0.
- NIE_ZMIERZONO: pełny przebieg `mutate-repin-ui2c` z harnessem (tylko dry-run), L0/L1A/L2/C4/hud/cityux/UI-2-A…G/UI-3-A — `src/` niezmieniony od r1, wyniki Evaluatora r1 (L0 3861/0, hud 909/0, ui2c 752/0, UI-3-A 0 różnic) i Operatora przyjęte; GPU/natywne okno Tauri; podpięcie `updateMinimapViewport` w kontrolerze v2 (P6).

NOTY:
1. INFRA: Chromium bywa zamykany w trakcie przebiegu także bez mutacji; mutatory liczą EXIT=2 jako „przeżyła”. Przy powtórkach bramek po merge ponawiać pojedynczo każde EXIT=2 i sprawdzać stderr.

BLOKADY: brak.
RUNDY: 1/5 (FC po obronie r1)
NASTĘPNY KROK: integracja orkiestratora: merge `rp-ui3d-fc` (SHA FC) na `origin/rust-port/parity-v2` `8bc2efcf8` (po UI-3-A/E/C/B), rozwiązać 5 konfliktów addytywnie (ui3d jako osobne bloki/sekcje; w `ui2c.json` wpis `hud.ts` pozostaje usunięty), potem na wyniku merge: `tsc --noEmit`, `npm run check`, `run-repin-ui3d`, `mutate-repin-ui2c --dry-run`, `run-repin-ui2c`, `run-hud-empire`; dopiero wtedy READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
