STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-INTEGRACJA-Q1
GOAL: domknięcie fazy UI-3 w porcie Rust: merge UI-3-D (FC `3264b10a7`) na `rust-port/parity-v2` `8bc2efcf8`, manifest C3 RENDER-3 (L1/L2 ZAMKNIĘTE, L3 ODŁOŻONA), mutator ui2c bez EXIT=2, pełne bramki na wyniku merge.

ZMIANY-COMMIT (gałąź lokalna `integ/ui-3-d-q1`, baza `8bc2efcf883deb3a1bb010370102a27fb13a44f1`; push NIE):
- `9b4c95329` merge UI-3-D (`3264b10a7`, pod spodem `fe7c77348`, `825bbf054`, `63731f3af`, `e8757d4c5`). 5 konfliktów rozwiązanych addytywnie: `P5-REPIN-UI-2.md` (numery sekcji unikalne, sprawdzone), `package.json` (skrypty obu stron), `ui2c.json` (bez wpisu `gra/src/ui/hud.ts`, 0×; bez wpisów przeniesionych do manifestu UI-3), `repin-ui2-overlay.mjs`, `repin-ui3-manifest.json` (osobne bloki ui3d). `verify-repin-ui3-copies.mjs` scalony automatycznie; `node --check` OK dla 5 narzędzi.
- `fcd08bc632fdbe305244780dce8060d2921423fd`: `repin-render3-scope.json` (kotwice `id`+`status`: L1 ZAMKNIETA, L2 ZAMKNIETA, L3 ODLOZONA), `verify-repin-render3-scope.mjs` (statusy; `--self-test` 12→20 mutacji), `P5-REPIN-WEB-RENDER-3.md` §6.
- `49fc2ab8c1edb317a46149997f02fc91fcdcdd43`: `selftest-verify-repin-ui3d.mjs`: kopie robocze dostają `GIT_DIR`, bo bramka WEB/DELTA z UI-3-B wymaga historii git. Bez tego test kontrolny po merge kończył się EXIT≠0.
- Ten raport (SHA w commicie raportu).
- Pkt (3) dispatchu był już w scalonej partii (`63731f3af`): H5/H6/H11 w trybie `wycofana` (wzorzec musi wystąpić 0×; komunikat z uzasadnieniem), H4/H12 w trybie `przeniesiona` do ui3d H23/H24. Bramka PORT-D/DISJ/DEPS ma odtwarzalny `--self-test` (`selftest-verify-repin-ui3d.mjs`, 10 naruszeń N1–N10). Nie było potrzeby dalszych zmian.
- `git diff --check 8bc2efcf8 HEAD` jest czysty. Wszystkie zmiany mieszczą się w allowliście. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md`, `gra-robocza/**`.

TESTY (na HEAD `49fc2ab8c`; WEB3 = `git archive 9b019a7d8`; OV = pin `edb8fb56`+nakładka UI-2/UI-3/UI-3-D; WEB86U3 = `86d510c66`+nakładka UI-3, `repin-ui2-overlay` niezgodnych 0):

| Bramka | Wynik |
|---|---|
| `tsc --noEmit` | OK |
| `npm run check` | EXIT 0 (logic-imports 0, pin 426/0, ui2 0, ui3 kopii 12 deps 8 niezgodnych 0) |
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
- N1: L2 1778 przypadków. Raport UI-3-B podawał 1784. Różnic jest 0, a liczba błędów jsdom i console jest taka sama jak w bazie. Rozbieżności liczby przypadków nie zbadałem.
- N2: kilka przebiegów przerwało `timeout` przy obciążeniu (load ok. 21). Dotyczy to `mutate-ui3b` 4–17 i 10–17, `mutate-ui3d` #16 (EXIT=2 tylko od SIGTERM), L2, hud i UI-2-B. Każdy taki przebieg powtórzyłem w krótszych przedziałach. Wyniki w tabeli pochodzą z pełnych, nieprzerwanych przebiegów.
- N3: worktree zawierał niezacommitowaną mutację `minimapHud.ts`, czyli usunięty `shownViewport = data.viewport;`. To ślad przerwanego mutatora z poprzedniej sesji. Przywróciłem plik przez `git checkout --` przed testami.
- N4: pierwsze przebiegi UI-2-D/E na OV skończyły się EXIT=2 przez złe odniesienie (OV zamiast WEB86U3). Na właściwym WEB86U3 obie mają 0 różnic. Pierwszy przebieg `mutate-ui3c` (24 mutacje na OV) powtórzyłem w całości na WEB86U3.
- N5: wspólny scratchpad. Katalog `web3` zniknął w trakcie pracy, usunął go inny proces. Wszystkie testy na WEB3 skończyły się wcześniej. Od tego momentu używałem nazw z prefiksem `int1-*`. Usunąłem wyłącznie własne katalogi (`ov`, `int1-*`, `pin`, `web86`, `web3b`).

BLOKADY: brak.
NIE_ZMIERZONO: `mutate-repin-ui2c` z pełnym harnessem (tylko dry-run; pełny przebieg zrobiła obrona UI-3-D: 40/40), `mutate-repin-ui3a`, `run-newgame` (9 kombinacji), mutatory regresji L0…UI-2. Nie było też GPU/Tauri: zmiany nie dotykają `src-tauri/src`.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator. Po Final Control orkiestrator przenosi `integ/ui-3-d-q1` na `rust-port/parity-v2`.
DEPLOY/PUSH: NIE WYKONANO
