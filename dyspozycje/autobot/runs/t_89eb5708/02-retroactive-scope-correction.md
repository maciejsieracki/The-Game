STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-CYWILIZACJE-MACIERZ-14-POZOSTALE-Q1
RECOVERY_TASK: t_a84ae3da
RECORD: RETROACTIVE_SCOPE_CORRECTION
CORRECTION_TIME_UTC: 2026-09-20T22:11:30+00:00

## Cel i granica

Ten addendum zapisuje korektę zakresu po niezależnym Evaluatorze `t_327aa8e7`.
Nie zmienia żadnego workbooka, TSV, JSON-a audytowego, decyzji ani kodu gry.
Korekta nie twierdzi, że pierwotna allowlista została spełniona; zachowuje
historyczny `FAIL` Evaluatora (zarzuty `O-1` i `O-2`) jako obowiązujące dowody.

## Powiązanie dispatchu i runu

- Pierwotny dispatch: karta `t_4218e5fb`, temat
  `R-CYWILIZACJE-MACIERZ-14-POZOSTALE-Q1`, baza
  `origin/main=f4c89d0081c622c16b207d338b49c8bacafc4553`.
- Recovery dispatch/operator: karta `t_89eb5708`, Operator run `856`, ten sam
  current-base worktree `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-14-currentbase-20260920`,
  branch `hermes/R-CYWILIZACJE-MACIERZ-14-CURRENTBASE-20260920`.
- Korekta wykonana w recovery task `t_a84ae3da`; ten plik jest addendumem pod
  `dyspozycje/autobot/runs/t_89eb5708/`.
- Powód techniczny: `build_artifacts.py` ustawia `TASK="t_89eb5708"`,
  `OUT=ROOT/panele-sterowania/cyw-macierz`, `RUN=ROOT/dyspozycje/autobot/runs/TASK`
  oraz zapisuje decyzję do `docs/decyzje/D-cyw-macierz-14-pozostale.md`.
  Faktyczny generator i run 856 użyły tych ścieżek, ale pierwotny dispatch
  zachował starsze nazwy/katalogi. To jest rozjazd ścieżek dispatchu z faktycznym
  miejscem zapisu, nie dowód utraty ani zmiany treści artefaktów.

## Tabela korekty zakresu: deklarowane vs faktyczne

| Pierwotnie deklarowane | Faktyczna ścieżka kanonicznego artefaktu | Powód rozjazdu | Stan korekty teraz |
|---|---|---|---|
| `dyspozycje/audyty/R-CYWILIZACJE-MACIERZ-14-POZOSTALE-20260920.xlsx` | `panele-sterowania/cyw-macierz/Civ-macierz-14-pozostale.xlsx` | Generator zapisuje do `OUT`; nazwa pliku jest addytywna i jawnie różna od nazwy z dispatchu. | Zapisano korektę retroaktywną; oryginalna pozycja nadal NIE jest spełniona. |
| `dyspozycje/audyty/R-CYWILIZACJE-MACIERZ-14-POZOSTALE-20260920.audit.json` | `panele-sterowania/cyw-macierz/civ-matrix-14-audit.json` | Generator zapisuje JSON obok workbooka w `OUT`. | Zapisano korektę retroaktywną; oryginalna pozycja nadal NIE jest spełniona. |
| `dyspozycje/audyty/R-CYWILIZACJE-MACIERZ-14-POZOSTALE-20260920.coverage.tsv` | `panele-sterowania/cyw-macierz/civ-matrix-14-coverage.tsv` | Generator zapisuje TSV obok workbooka w `OUT`. | Zapisano korektę retroaktywną; oryginalna pozycja nadal NIE jest spełniona. |
| `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-14-POZOSTALE-Q1/**` | `dyspozycje/autobot/runs/t_89eb5708/00-dispatch.md`; `01-operator.md`; `build_artifacts.py` | Generator wiąże katalog runu z technicznym `TASK=t_89eb5708`; karta recovery i run 856 są dowodem tej lokalizacji. | Actual run evidence jawnie wskazane; oryginalny glob nadal NIE jest spełniony. |
| `docs/decyzje/R-CYWILIZACJE-MACIERZ-14-POZOSTALE-Q1.md` | `docs/decyzje/D-cyw-macierz-14-pozostale.md` | Generator ma tę docelową ścieżkę wpisaną jawnie. | Zapisano korektę retroaktywną; oryginalna pozycja nadal NIE jest spełniona. |
| `gra/tools/**` tylko jeśli konieczne | brak pliku utworzonego lub zmienionego | Nie był potrzebny focused audit script w finalnym pakiecie. | Brak zmiany. |

Faktyczny pierwotny pakiet (bez tego addendumu) obejmuje dokładnie siedem
ścieżek: trzy artefakty w `panele-sterowania/cyw-macierz/`, decyzję oraz trzy
pliki pod `runs/t_89eb5708/`. Nie przenoszono ich i nie generowano kopii pod
pierwotnymi, niespełnionymi nazwami.

## Status i inwentarz przed/po

### Pre-correction readback — 2026-09-20T22:11:01+00:00 UTC

- HEAD i `origin/main`: `f4c89d0081c622c16b207d338b49c8bacafc4553`;
  branch: `hermes/R-CYWILIZACJE-MACIERZ-14-CURRENTBASE-20260920`.
- Tracked diff: pusty; `git diff --check`: pusty wynik.
- `git status --short --untracked-files=all` zawierało dokładnie 7 pozycji:

  `?? docs/decyzje/D-cyw-macierz-14-pozostale.md`

  `?? dyspozycje/autobot/runs/t_89eb5708/00-dispatch.md`

  `?? dyspozycje/autobot/runs/t_89eb5708/01-operator.md`

  `?? dyspozycje/autobot/runs/t_89eb5708/build_artifacts.py`

  `?? panele-sterowania/cyw-macierz/Civ-macierz-14-pozostale.xlsx`

  `?? panele-sterowania/cyw-macierz/civ-matrix-14-audit.json`

  `?? panele-sterowania/cyw-macierz/civ-matrix-14-coverage.tsv`

- Poza widocznym statusem istniał dokładnie nazwany, ignorowany efekt uboczny:
  `dyspozycje/autobot/runs/t_89eb5708/__pycache__/build_artifacts.cpython-314.pyc`,
  47,379 B, SHA-256
  `e6efb01a1de5f445d006efcdcaa757b2795281d1abb419108146c04f4d91b919`.

### Post-correction readback — 2026-09-20T22:13:06+00:00 UTC

- HEAD i `origin/main`: `f4c89d0081c622c16b207d338b49c8bacafc4553`;
  branch: `hermes/R-CYWILIZACJE-MACIERZ-14-CURRENTBASE-20260920`.
- Tracked diff: pusty; `git diff --check`: PASS; audyt dokumentacji
  `process-docs-audit.cjs`: PASS (`14 plików, 5 szablonów, 13 statusów`).
- `git status --short --untracked-files=all` zawiera dokładnie 8 pozycji:

  `?? docs/decyzje/D-cyw-macierz-14-pozostale.md`

  `?? dyspozycje/autobot/runs/t_89eb5708/00-dispatch.md`

  `?? dyspozycje/autobot/runs/t_89eb5708/01-operator.md`

  `?? dyspozycje/autobot/runs/t_89eb5708/02-retroactive-scope-correction.md`

  `?? dyspozycje/autobot/runs/t_89eb5708/build_artifacts.py`

  `?? panele-sterowania/cyw-macierz/Civ-macierz-14-pozostale.xlsx`

  `?? panele-sterowania/cyw-macierz/civ-matrix-14-audit.json`

  `?? panele-sterowania/cyw-macierz/civ-matrix-14-coverage.tsv`

- Dokładny plik `dyspozycje/autobot/runs/t_89eb5708/__pycache__/build_artifacts.cpython-314.pyc`
  nie istnieje i nie pojawia się w statusie ignored. Usunięto wyłącznie tę
  wskazaną ścieżkę; nie wykonano `git clean`, `git reset`, `git stash`,
  szerokiego kasowania ani przenoszenia artefaktów.
- Readback OOXML: PASS — 10 arkuszy; `Pozostale_14` = 1583 wiersze × 26
  kolumn. Readback TSV: PASS — 1582 wiersze danych × 26 kolumn.
- Exact scope audit: 8 faktycznych ścieżek evidence istnieje; 4 nazwane
  pierwotne pliki oraz pierwotny katalog runu nie istnieją; `gra/**` ma pusty
  status i pusty diff.

## Zachowanie hashy i treści

Hash/rozmiar siedmiu pierwotnych artefaktów przed korektą:

| Ścieżka | Bajty | SHA-256 |
|---|---:|---|
| `panele-sterowania/cyw-macierz/Civ-macierz-14-pozostale.xlsx` | 260582 | `433dc4f3decd72416238206e7d43fbede7d5a6077106a17f05e4596b071a1c6c` |
| `panele-sterowania/cyw-macierz/civ-matrix-14-coverage.tsv` | 882655 | `1aee1db92d8156b94bb10278bf8cfd1f8277064c0a499a4d0b997ab2fd0ec269` |
| `panele-sterowania/cyw-macierz/civ-matrix-14-audit.json` | 97047 | `94048eccb48a2ca419ecd95e947ee33962a02aaa20b542ba033e945869f30db0` |
| `docs/decyzje/D-cyw-macierz-14-pozostale.md` | 3894 | `e43ecf02c5c736548e0200144b97fa38774145ade87c59d32702dca50dfa1969` |
| `dyspozycje/autobot/runs/t_89eb5708/00-dispatch.md` | 527 | `7afa2912397f23f180084e2691581e4bdcde5180a5a081b20f780854fba7c817` |
| `dyspozycje/autobot/runs/t_89eb5708/01-operator.md` | 942 | `b4ad80446182ae2794e99b4295b680f32d5452af450a487a5a70ba858576566a` |
| `dyspozycje/autobot/runs/t_89eb5708/build_artifacts.py` | 32785 | `e7b88c7c4d5cf5fb54f68a3c7e6b486df866689c781bd6edf964cb537e30c000` |

The audit JSON's source manifest contains 32 entries. Post-readback at
`2026-09-20T22:13:06+00:00 UTC` confirmed `32/32` paths equal by path, byte
count and SHA-256; this covers the full manifest, not only the matrix source.
Key source anchor:
`gra/data/civ-matrix.json`, 83,010 B, SHA-256
`ad67e771608c2ebad8fed5e84e3d8ecd6e2a2b496fbfe42025ddb39ef27a2ea7`.
The seven preserved artifacts also remained byte/hash-identical to the pre-
correction inventory above. The Greece workbook remains outside this package;
`git hash-object panele-sterowania/Cyw-macierz-REVIEW.xlsx` equals its HEAD blob
`3af889fd457644a28887c5e5f8438f0b24694208` (PASS).

## Explicit boundary and next gate

- `ORIGINAL_ALLOWLIST_SATISFIED: NO` — this remains the Evaluator `FAIL`, not a
  retroactive PASS.
- `EVALUATOR_FAIL_PRESERVED: YES` — `t_327aa8e7`, objections `O-1` (path drift)
  and `O-2` (ignored generated `.pyc`) remain historical evidence.
- `PRODUCT_CODE_CHANGES: NONE`; `gra/**` is read-only in this recovery.
- `PUSH/MERGE/DEPLOY: NIE WYKONANO`.
- Legal next gate: a new independent Evaluator must read the same seven
  preserved artifacts plus this correction record and verify the post-status,
  hashes, exact allowlist audit and cleanup. Operator does not integrate or
  publish in this recovery.
