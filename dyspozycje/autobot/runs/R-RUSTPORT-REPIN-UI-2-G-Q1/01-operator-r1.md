STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-G-Q1
GOAL: REPIN UI-2-G — #26 `cityPanel.ts`: bloki K01–K09 frontend-v2 przepięte z pinu `edb8fb56` na web `86d510c66` (P5-REPIN-UI-2 §1/§1a/§4), potem K09C/K09D.

ZMIANY/COMMIT (branch `rp-ui2g-q1` od `rust-port/parity-v2` `2198eaf7e`; `origin/main` = `86d510c66`, 0 nowych commitów `gra/src`):
- `84d312c0c` kod: K01A/K01B/K05A/K06A w całości przepięte (186 markerów w 7 plikach), w tym 6/25 bloków z dryfem: `queueItemCumulativeEta` (+`buildingPracaPerTurn`), `recruitManpowerCost` (`getManpowerMultipliers`, 4. arg `costMult` także w delegatorze/DTO K05A), `unitStockCostChipsHtml` („(brak)”), `formatBuildingCatalogLockHint` (`brakZasobow`), `tileYieldLabel` (`ownerEra`), `formatBuildEtaLabel` (komentarz). Narzędzia: `repin-ui2g-kblocks.mjs` (Myers, zgodny z `git diff` 89 hunków), `repin-ui2g-rev.mjs`, weryfikatory k01b/k05a/k06a + `run-k01a` (`--sel-pin-dir`) + `run-k06a-units` na webie, `run-repin-ui2g.mjs` (Chromium) + `mutate-repin-ui2g.mjs`, fixtura `repin_ui2g-web-vectors.json`, `measure-repin-ui2g-k02k04-drift.mjs`, `tools/repin-ui2g-kblocks-manifest.json` + rozszerzenie `verify-repin-ui2-copies.mjs`, `package.json` (2 skrypty na końcu).
- `dbcee5a5e` dokument: `P5-REPIN-UI-2.md` wiersze #26 + nowa §6 (mechanika, bloki, K02–K04, testy, przeliczona wycena).
- Ten raport: commit z SHA w `git log` (następny po `dbcee5a5e`).
- Bez zmian: `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `pin-manifest.json` (bloki K nie są tam wpisane), `repin-ui2-manifest.json`, nakładka.

TESTY (`src-tauri/frontend-v2`, `npm ci`; `node_modules` usunięty po bramkach):
- `tsc --noEmit` 0; `npm run check` EXIT 0 (433/0; UI-2 4/0; kblocks 7 plików, 186 zakresów); `git diff --check` czysty.
- `run-repin-ui2g` (Chromium 141): 9216 wektorów, 0 różnic, HUNK 5/5, DOM 45 węzłów =, PNG 1280×720 i 360×640 bajtowo =, pageerror/console.error 0. `webVectorsSha256=2b575760…781374`, fixtura sha256 `c26dc6c3…40437` identyczna z 2× `git archive`.
- `mutate-repin-ui2g` 16/16 wykrytych (+2 równoważne z uzasadnieniem: M2, M9).
- Partie na webie: verify k01b/k05a/k06a OK; `run-k01a` ZIELONE (10 bramek), `run-k01b` 1689/0, `run-k05a-units` 4936/0, `run-k06a-units` 0; mutacje k01a 9/9, k01b 9/10 (D1 = tsc, jak na bazie), k05a 83/83, k06a 29/29. Na pinie te weryfikatory dają FAIL (kontrola negatywna).
- Regresja: `run-k02…k09b` (34) na pinie EXIT 0; nakładka: L0 3861/0, L1A 3618/0, L2 1784/0 (354/150 jak baza), C4 1649/0, cycles 6401/0, hud 927/0, newgame 1194/0, cityux 164/0.
- K02–K04: 138 nazw, DRIFT 0; odwołania `:A-B` 343, REF_DRIFT 10 (szerokie zakresy; do przeglądu w r2).

BLOKADY: brak technicznych.
NOTY: (1) zakres r1 ≠ cały GOAL: pozostało 19 DRIFT (K05B 5, K06B 8 z kolejką ↑↓✕, K07B, K08B, K08C, K08D 2, K08E) + 142 markery i K09C/K09D — ZAŁOŻENIE G-Z1, plan §6.5. (2) Weryfikatory k06b/k07a/k09a były czerwone już na bazie `2198eaf7e` (K09B r2, K08B) — niezmienione, poza r1; K06A naprawiony `LINE_SUB`. (3) Kontrakt reguły plonów z `wlascicielEra` i `getManpowerMultipliers` po stronie silnika = P6. GPU/natywne okno Tauri: NIE_ZMIERZONO.
Wycena: r1 ≈ 8 h (wzór 5,7 h + infrastruktura); UI-2-G ≈ 27 h / 3,5 rundy — zalecany osobny ID dla K06B+K08B i K09C/K09D.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1; potem Operator r2: K07B, K08C, K08D, K08E, K05B.
DEPLOY/PUSH: NIE WYKONANO
