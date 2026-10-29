STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K09B-Q1
GOAL: Niezależna weryfikacja commitu Operatora-impl `5079378c` (detached, baza fb55afe2): bramki, mutacje, regresja, weryfikacja defektu D6.
ZMIANY/COMMIT: allowlista: `dyspozycje/rust-port/p5/P5-8-K09B.md` (dopisek §9), `dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K09B-Q1/02-operator-pomiary-r1.md` (nowy), `r1-logi/pomiar-*.txt` i `npm-ci-pomiar.txt`. Kod produkcyjny NIE zmieniony.
TESTY:
- `npm ci` EXIT 0 (`r1-logi/npm-ci-pomiar.txt`).
- `npm run typecheck` EXIT 0 (`r1-logi/pomiar-typecheck.txt`).
- `npm run check` EXIT 0 (`r1-logi/pomiar-check.txt`).
- `run-k09b-wiring.mjs` EXIT 0, 28/28 zgodnych.
- `mutate-k09b.mjs` EXIT 0, 20/20 zabitych; 17 asercjami, 3 wyjątkiem harnessu (M2, M7, M8).
- Regresja: `run-k09a-wiring` EXIT 0 (10/10); `run-k08d-wiring` EXIT 0 (35/35).
- fmt/clippy/cargo test: N/A, commit nie zmienia `.rs`, `gra/**`, `WERSJE.md`, `package.json`.
BLOKADY: brak technicznych.
DEFEKT D6 (zweryfikowany w kodzie): `pinnedGarrisonCityId` jest string (`src/ui/cityPanel/k06a-fundament.ts:156`), `city.id` jest number. `k06b-garnizon.ts:68` (`===`) jest zawsze fałszywe; `k09a-paint.ts:46` (`!==`) zawsze prawdziwe przy ustawionym pinie, więc garnizon jest czyszczony przy każdym malowaniu. Pin porównuje stringi (`gra/src/ui/cityPanel.ts:9397`, `:11763` w `edb8fb56`). Harness nie ma testu przypiętego garnizonu. Wagę ocenia Final Control.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator i Final Control: ocena D6 (wymaga poprawki w `ui/cityPanel/**` poza tym tematem albo osobnego tematu), potwierdzenie K09B-Z1/D3 i Z2 (zgodność z pinem NIE_ZMIERZONO). Pomiary zachowania w przeglądarce i pin-exec NIE_ZMIERZONO.
DEPLOY/PUSH: NIE WYKONANO
