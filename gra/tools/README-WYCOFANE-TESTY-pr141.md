# Testy wycofane jako dowody historyczne (pr141)

Rejestr pięciu testów `gra/tools/pr141-*test.cjs`, które zostały wycofane decyzją właściciela
(R-WEB-TEST-DEBT-BASELINE-Q4, ABC A, 2026-11-16). Wariant: wycofanie in-place -- plik i historia
zachowane, na początku pliku wczesne `process.exit(0)` z komunikatem `WYCOFANY: dowód historyczny`.
Dane ledgera NIE są regenerowane.

| Plik | Powód wycofania (stan przed wycofaniem) |
|---|---|
| `pr141-current-evidence-ledger-test.cjs` (v1) | asercja „raw value differs from matrix meta_mnoznik_waluta/asyria” (dane ledgera nieaktualne wobec macierzy) |
| `pr141-current-evidence-ledger-v3-test.cjs` | asercja „current per-cell status differs from semantic API prod_szybkosc_jednostki_proc/grecy” |
| `pr141-current-evidence-ledger-v4-test.cjs` | brak pliku `matrix-93x15-current-evidence-ledger-v4.json` (ENOENT) |
| `pr141-evidence-ledger-behavior-test.cjs` | brak `/workspace/pr141-review/current-consumers.json` (ENOENT) |
| `pr141-runtime-ordinary-scope-test.cjs` | brak katalogu `dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019` (ENOENT) |

Pozostałe pliki `pr141-*test.cjs` nie są wycofane i działają bez zmian.
Przywrócenie testu: usunąć blok wczesnego wyjścia z początku pliku.
