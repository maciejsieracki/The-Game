STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A6-Q1
GOAL: REPIN-3D partia A6 — kontrola regeneracji cz. 1–2 (`siege_wall.json`, `field.json`) na aktualnym
`origin/main`; aktualizacja pochodzenia fixtur bez zmiany wartości; kolejka dryfu weba od `86d510c66` (§14).

ZMIANY-COMMIT:
- Branch worktree `repin3d-a6-q1` od `origin/rust-port/parity-v2` @ `2962d0a7b`; commit pracy
  `df4e4ede86760d4318e555c1fe3caf4d6c0b84eb` (+ commit tego raportu).
- `rust-port/renderer/tests/fixtures/battle3d/README.md` — cz. 1 i cz. 2: „Provenance (re-pin A6)”
  (`edb8fb56` → `origin/main` @ `86d510c66`), przepis `git archive 86d510c66`, SHA bundli obu rewizji.
- `rust-port/renderer/tests/fixtures/battle3d/MANIFEST.sha256` — tylko wiersz `README.md`
  (`903ea0b4…` → `72073354…`); JSON-y i generatory bez zmian.
- `dyspozycje/rust-port/p4/P4-REPIN-3D.md` — nowa §14 (istniejące § nietknięte).
- `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-3D-A6-Q1/dowody/*` (surowe logi).
- Zero zmian w `src/**`, `gra/**`, `engine/**`, `src-tauri/**`, `Cargo.*`, `WERSJE.md`.

POMIAR (`dowody/regen-cz1-2-r1.txt`):
- `origin/main` = `86d510c667268880414d693532ca012c9310589e` (`git ls-remote origin main`).
- Niezmienione generatory pinu, 2 katalogi `mktemp -d` (osobne `npm install` three@0.169.0
  esbuild@0.24.0, node v22.22.0):
  `siege_wall.json` 95 przypadków / 11 877 meshy → `bce895d837a3…80c2fdbf7` = repo = oba katalogi;
  `field.json` ctor 16 + synthetic 9 / 281 792 węzłów → `39df4eb712ed…143b369929` = repo = oba katalogi.
  **0 różnic** — port `src/battle/{siege_wall,field}*.rs` nie wymaga zmian.
- `git diff --numstat edb8fb56 86d510c66 -- gra/src/battle/siegeWall.ts` = `213 0` (addytywny, §2.2);
  `render/bronzeCity.ts` bez zmian. Bundel `gen.mjs` na `86d510c66` = `71e60111…` (różnica vs pin:
  3 hunki addytywne palisady = kod A2); `gen_field.mjs` = `5415e0c0…`.
- Dryf: `git log --oneline 86d510c66..origin/main -- gra/src/battle gra/src/render gra/data` → 0;
  `git diff --stat` → pusty. Kolejka A7 / REPIN-3D-C pusta (§14.3).

ZAŁOŻENIE Z-RP-A6-1: commitowany `gen.mjs` pozostaje bundlem pinu `edb8fb56` (artefakt
odtwarzalności); bundel `86d510c66` udokumentowany SHA w README, nie commitowany (jak `gen_field.mjs`).

TESTY (rustc 1.97.0; CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0):
- `cargo fmt --all -- --check` EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings` EXIT=0
- `cargo test --locked --no-fail-fast` passed=463 failed=0 binaries=62 EXIT=0 (baza 463/0)
- `cargo +1.87.0 test --locked --test battle3d_siege_wall --test battle3d_field` 3 + 5 passed EXIT=0
- `sha256sum -c tests/fixtures/battle3d/MANIFEST.sha256` 24 OK EXIT=0
- `git diff --check` czysty
- Mutacje: NIE-DOTYCZY (brak nowego kodu). GPU: NIE_ZMIERZONO.
- Sprzątanie: `rm -rf` obu katalogów scratch i `rust-port/renderer/target` (jawne ścieżki).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R-RUSTPORT-REPIN-3D-A6-Q1, runda 1).
DEPLOY/PUSH: NIE WYKONANO
