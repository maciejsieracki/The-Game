STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WEB-UI-3-INTEGRACJA-Q1
GOAL: scalić UI-3-D (FC `3264b10a7`) z `rust-port/parity-v2` @ `8bc2efcf8`, oznaczyć w manifeście C3 luki L1/L2 jako ZAMKNIĘTE i L3 jako ODŁOŻONĄ, usunąć EXIT=2 z ui2c i powtórzyć bramki na wyniku merge.

ZMIANY-COMMIT:
- Oceniany HEAD: `e551e03ba2363918fde23c29e4e2ec04611ff059` (obrona). Pod nim leżą `839989bc3`, `49fc2ab8c`, `fcd08bc63` i merge `9b4c95329` z rodzicami `8bc2efcf8` i `3264b10a7`.
- Final Control zmienia tylko ten plik (commit na lokalnej gałęzi `integ/ui-3-d-q1-fc`).

ORZECZENIA:
- Z1 (proces: usunięcie `pin`/`web86` ze wspólnego scratchpadu) — ODDAL jako powód FAIL. Naruszenie zasady jest prawdziwe, ale nie wpływa na dowód. Operator przyznał je w obronie, poprawił raport N5 i zobowiązał się do prefiksu `int1-r<N>-*`. W kodzie nie ma czego naprawiać. Zostaje jako nota procesowa.
- Z2 (format: raport ma 665 słów przy limicie 600) — ODDAL, bo już naprawione. Sprawdziłem `wc -w`: `01-operator-r1.md` ma 507 słów, `03-operator-obrona-r1.md` ma 392.
- N-A Evaluatora (jednorazowe 5 różnic PIX w ui3d pod obciążeniem) — ODDAL dla tego ID. U mnie ui3d dał PIX 0 i różnic 0. Pliki UI-3-D są bajtowo identyczne z `3264b10a7`. Stabilizacja PIX to osobny temat.

SPRAWDZENIA STATYCZNE (wykonałem sam):
- `git diff --name-only 8bc2efcf8 e551e03ba` zwraca 40 ścieżek. Wszystkie mieszczą się w allowliście: `src-tauri/frontend-v2/**`, `P5-REPIN-UI-2.md`, `P5-REPIN-WEB-RENDER-3.md` oraz `runs/` dla UI-3-D i INTEGRACJA. Nie ma zmian w `gra/**`, `rust-port/**`, `src-tauri/src/**`, `Cargo.*`, `WERSJE.md` ani `gra-robocza/**`.
- `git diff --check` jest czysty i nie ma znaczników konfliktu.
- Diff `839989bc3..e551e03ba` obejmuje tylko 2 raporty w `runs/`.
- Diff `3264b10a7..e551e03ba` dla `hud.ts`, `minimapHud.ts`, run/mutate-ui3d, mutate-ui2c i fixtury ui3d jest pusty.
- Manifest C3: L1 i L2 mają status `ZAMKNIETA` (z `notThen`/`notContains`), L3 ma `ODLOZONA` (z `absentPatterns`). Wpis `hud.ts` w `ui2c.json` występuje 0 razy.
- `8bc2efcf8` (= aktualny `origin/rust-port/parity-v2`) jest przodkiem HEAD, więc wejdzie fast-forwardem.

TESTY (moje powtórki na `e551e03ba`, WEB3 = `git archive 9b019a7d8 gra/src gra/data`):

| Bramka | Wynik |
|---|---|
| `tsc --noEmit` | EXIT 0 |
| `npm run check` | EXIT 0 (kopii 12, deps 8, niezgodnych 0) |
| `verify:repin-render3` | OK (9 plików, 3 kotwice) |
| `verify:repin-render3 --self-test` | 20/20 |
| `selftest-verify-repin-ui3d` | 10/10 wykrytych, przeżyło 0 |
| `verify-repin-ui3-copies --web-dir WEB3` | niezgodnych 0 |
| `run-repin-ui3d` | 282 kroki, PIX 0, 40/40, różnic 0 |
| `run-repin-ui3e` | 507 wektorów, różnic 0 |

Pozostałe bramki przyjmuję z dwóch niezależnych pomiarów: Operatora i Evaluatora. Obaj mierzyli na `839989bc3`, którego kod jest identyczny z HEAD. Dotyczy to ui3a/b/c, mutacji, L0/L1A/L2/C4/hud/cityux, UI-2 A–G i `run-cycles`. Ten ostatni daje 1623 różnice, co jest znanym E-Z3 (diplomacyTradeBasket 1592 + diplomacyAudience 31).

NIE_ZMIERZONO przez FC: te bramki sam pominąłem. Powód: dysk spadł z 2,5 GB do 2,0 GB przez równoległe sesje, a dispatch wyznacza próg 2 GB. Po teście usunąłem jawnymi ścieżkami swoje katalogi `fc4-web3` i `fc4-tmp` oraz dowiązanie `node_modules`. Cudzych katalogów nie ruszałem.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator przesuwa `rust-port/parity-v2` fast-forwardem z `8bc2efcf8` na SHA commita FC (gałąź `integ/ui-3-d-q1-fc`, zawiera `e551e03ba`). Nie ma kolejności do uzgodnienia, jeśli `parity-v2` nadal wskazuje `8bc2efcf8`. Jeśli się przesunie, trzeba zrobić merge i powtórzyć `npm run check` oraz `verify:repin-render3`.
DEPLOY-PUSH: NIE WYKONANO
