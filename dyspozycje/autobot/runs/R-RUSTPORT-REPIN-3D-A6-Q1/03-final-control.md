STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A6-Q1
GOAL: Partia A6 REPIN-3D. Sprawdzić regenerację części 1–2 (`siege_wall.json`, `field.json`) na aktualnym `origin/main`, zaktualizować pochodzenie w README fixtur bez zmiany wartości i wpisać kolejkę dryfu weba od `86d510c66` jako nową §14.

ROLA: Final Control, runda 1. Obrona: brak (null), bo Evaluator nie zgłosił zarzutów.

## Ocena

Branch `repin3d-a6-q1`: `df4e4ede8` (praca) i `2a3d7da09` (raport Operatora). Merge-base z `origin/rust-port/parity-v2` = `2962d0a7b` (= aktualny tip, zmierzony `git fetch` 2026-11-04). `origin/main` = `86d510c66`.

Zarzuty Evaluatora: brak (PASS-WITH-NOTES). Uwagi rozstrzygam tak:

| # | uwaga | orzeczenie | dowód |
|---|---|---|---|
| a | README i §14.1 nazywają różnicę bundla `gen.mjs` „additive”, choć jedna linia jest zmieniona | ODDAL | `diff` bundli: 92 linie, jedyna linia `<` to `gateWidthTiles: opts.gateWidthTiles ?? 2` (dochodzi tylko przecinek i nowe pole `kind`). Semantyka ścieżki `'mur'` się nie zmienia, a JSON jest bajt w bajt ten sam. Sformułowanie jest dokładne co do sensu. Nie wpływa na wartości ani na testy. |
| b | Z-RP-A6-1: commitowany `gen.mjs` pozostaje bundlem pinu | ODDAL | Założenie udokumentowane w README i §14.2. Bundel `86d510c66` jest opisany przez SHA i rozmiar, tak jak wcześniej `gen_field.mjs`. `MANIFEST.sha256` sprawdza tylko commitowane pliki. Decyzja produktowa nie jest potrzebna. |

Wynik: 0 × NAPRAW, 2 × ODDAL, 0 × DO DECYZJI CZŁOWIEKA, więc PASS.

## Weryfikacja własna

- Allowlista: `git diff --name-only 2962d0a7b 2a3d7da09` zwraca 10 plików, wszystkie w allowliście: `fixtures/battle3d/{README.md,MANIFEST.sha256}`, `P4-REPIN-3D.md` i `runs/R-RUSTPORT-REPIN-3D-A6-Q1/**`. Pliki spoza listy: 0. W `P4-REPIN-3D.md` nie usunięto żadnej linii, czyli dopisana jest tylko §14. Pliki JSON, generatory, `.rs`, `gra/**`, `engine/**`, `src-tauri/**`, `Cargo.*` i `WERSJE.md` pozostały bez zmian.
- Regeneracja: zrobiłem ją niezależnie w osobnym `mktemp -d` w scratchpadzie, z własnym `npm install three@0.169.0 esbuild@0.24.0` i na node v22.22.0. Użyłem `git archive 86d510c66 gra/src gra/data` oraz niezmienionych generatorów z brancha.
  - `siege_wall.json`: `cases=95 meshes=11877`, SHA `bce895d8…0c2fdbf7`. `cmp` z repo: identyczny.
  - `field.json`: `ctor=16 synthetic=9 nodes=281792`, SHA `39df4eb7…3b369929`. `cmp` z repo: identyczny.
  - Bundle: `gen.mjs` = `71e60111…` (441 930 B), `gen_field.mjs` = `5415e0c0…` (2 818 393 B). Oba zgodne z README.
- Dryf: `git log 86d510c66..origin/main -- gra/src/battle gra/src/render gra/data` zwraca 0 commitów. `git diff --numstat edb8fb56 86d510c66` daje `213 0` dla `siegeWall.ts`. `bronzeCity.ts` jest bez zmian. Zgadza się z §14.3, więc kolejka A7 jest pusta.
- `sha256sum -c MANIFEST.sha256`: 24/24 OK.
- `git diff --check 2962d0a7b...2a3d7da09`: czysty.
- Bramki (CARGO_INCREMENTAL=0, DEBUG=0):
  - `cargo fmt --all -- --check`: EXIT=0.
  - `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0.
  - `cargo test --locked --no-fail-fast`: passed=463, failed=0, 62 binaria, EXIT=0. Zgodne z bazą.
  - `cargo +1.87.0 test --locked --test battle3d_siege_wall --test battle3d_field`: 5 + 3 passed, EXIT=0.
- Mutacje: NIE-DOTYCZY, bo nie ma nowego kodu. GPU: NIE_ZMIERZONO (brak GPU), nie blokuje.
- Sprzątanie: katalog scratch i `rust-port/renderer/target` usunięte jawnymi ścieżkami.

## Integracja

SHA końcowy do integracji to commit tego raportu na branchu `repin3d-a6-q1-fc`, który jest liniowym potomkiem `2a3d7da09`. Kolejność: fast-forward `origin/rust-port/parity-v2` (`2962d0a7b`) → `df4e4ede8` → `2a3d7da09` → commit FC. Nie ma konfliktów ani rebase, bo merge-base jest równy tipowi.

ZMIANY-COMMIT: tylko ten plik (`03-final-control.md`), dodany jawnym `git add`.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (ff `rust-port/parity-v2`), a potem READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
