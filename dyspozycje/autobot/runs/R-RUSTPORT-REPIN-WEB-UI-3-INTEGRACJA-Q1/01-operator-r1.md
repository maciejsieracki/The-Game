STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-INTEGRACJA-Q1
GOAL: domknięcie fazy UI-3 w porcie Rust: merge UI-3-D (FC `3264b10a7`) na `rust-port/parity-v2` `8bc2efcf8`, manifest C3 RENDER-3 (L1/L2 ZAMKNIĘTE, L3 ODŁOŻONA), mutator ui2c bez EXIT=2, pełne bramki na wyniku merge.

ZMIANY-COMMIT (gałąź lokalna `integ/ui-3-d-q1`, baza `8bc2efcf883deb3a1bb010370102a27fb13a44f1`; push NIE):
- `9b4c95329515b91c891118b73b5a42fd56d5b6f7` merge UI-3-D (`3264b10a7`). 5 konfliktów addytywnie: `P5-REPIN-UI-2.md` (sekcje unikalne), `package.json` (skrypty obu stron), `ui2c.json` (bez `hud.ts`, 0×), `repin-ui2-overlay.mjs`, `repin-ui3-manifest.json` (osobne bloki ui3d). `node --check` OK.
- `fcd08bc632fdbe305244780dce8060d2921423fd`: `repin-render3-scope.json` (L1/L2 ZAMKNIETA, L3 ODLOZONA), `verify-repin-render3-scope.mjs` (statusy; `--self-test` 12→20 mutacji), `P5-REPIN-WEB-RENDER-3.md` §6.
- `49fc2ab8c1edb317a46149997f02fc91fcdcdd43`: `selftest-verify-repin-ui3d.mjs`: `GIT_DIR` dla kopii (WEB/DELTA z UI-3-B wymaga historii git; bez tego kontrola EXIT≠0).
- Pkt (3) dispatchu był już w scalonej partii (`63731f3af`): H5/H6/H11 `wycofana` z uzasadnieniem, H4/H12 `przeniesiona` (ui3d H23/H24); PORT-D/DISJ/DEPS ma self-test 10 naruszeń.
- `git diff --check` czysty; allowlista OK; zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `gra-robocza/**`.

TESTY (na HEAD `49fc2ab8c`; WEB3 = `git archive 9b019a7d8`; OV = pin `edb8fb56`+nakładka UI-2/UI-3/UI-3-D; WEB86U3 = `86d510c66`+nakładka UI-3, `repin-ui2-overlay` niezgodnych 0):

| Bramka | Wynik |
|---|---|
| `tsc --noEmit` | OK |
| `npm run check` | EXIT 0 (ui3 kopii 12, niezgodnych 0) |
| `verify:repin-render3` / `--self-test` | OK (9 plików webu, 3 kotwice) / 20/20 |
| `selftest-verify-repin-ui3d` | 10/10 wykrytych |
| `verify-repin-ui3-copies --web-dir WEB3` | niezgodnych 0 |
| `run-repin-ui3a` | 360 kroków, PIX 0, 56/56, różnic 0 |
| `run-repin-ui3b` | 1049 kroków, PIX 0, 55/55, różnic 0 |
| `run-repin-ui3c` (WEB3 oraz WEB86U3) | 696 przypadków, PIX 0, 14/14, różnic 0 |
| `run-repin-ui3d` | 282 kroki, PIX 0, 40/40, różnic 0 |
| `run-repin-ui3e` + `verify-repin-ui3e-fixture` (drugi archive) | 507 wektorów, różnic 0 / niezgodności 0 |
| `mutate-repin-ui3b` (przedziały) | 27/27 |
| `mutate-repin-ui3c` (WEB86U3) | 39/39 |
| `mutate-repin-ui3d` (przedziały) | 34/34 |
| `mutate-repin-ui3e` | 17/17 |
| `mutate-repin-ui2c --dry-run` | EXIT 0 (aktywnych 40, wycofanych/przeniesionych 5) |
| L0 / L1A / L2 / C4 / hud / cityux (OV) | 3861/0, 3618/0, 1778/0 (jsdom 354, console 150), 1649/0 (75), 909/0, 164/0 |
| `run-cycles` (OV) | 6442/**1623** = znane E-Z3: diplomacyTradeBasket 1592 + diplomacyAudience 31; pozostałe moduły 0 |
| UI-2-A/B/C/D/E/F/G, E-cycles (WEB86U3) | 2292/0, 1356/0, 752/0, 797/0, 183/0, 35 scen/0, 9216/0, 9335/0 |

Uwagi do pomiarów (nie maskuję):
- N1: L2 1778 przypadków (UI-3-B podawał 1784); różnic 0, jsdom/console jak w bazie.
- N2: przy load ok. 21 `timeout` przerwał `mutate-ui3b` 4–17, `mutate-ui3d` #16, L2, hud, UI-2-B; powtórzone w krótszych przedziałach, w tabeli tylko pełne przebiegi.
- N3: worktree miał niezacommitowaną mutację `minimapHud.ts` (przerwany mutator); przywrócona `git checkout --` przed testami.
- N4: UI-2-D/E na OV dały EXIT=2 (złe odniesienie); na WEB86U3 0 różnic; `mutate-ui3c` powtórzony na WEB86U3.
- N5: wspólny scratchpad; `web3` zniknął w trakcie (testy WEB3 były już skończone). Usunąłem `ov`, `int1-*`, `web3b` oraz `pin` i `web86`, których pochodzenia NIE jestem pewien (naruszenie ostrożności, zob. 03-operator-obrona-r1.md Z1).

BLOKADY: brak.
NIE_ZMIERZONO: `mutate-repin-ui2c` z pełnym harnessem (tylko dry-run), `mutate-repin-ui3a`, `run-newgame` (9 kombinacji), mutatory regresji L0…UI-2, GPU/Tauri.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator. Po Final Control orkiestrator przenosi `integ/ui-3-d-q1` na `rust-port/parity-v2`.
DEPLOY/PUSH: NIE WYKONANO
