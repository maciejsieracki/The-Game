# R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1 — Operator-pomiary, runda 1/5 (niezależna weryfikacja kodu 1a55f666)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1
GOAL: Niezależnie odtworzyć bramki partii `handel` i `slider` K08D na commicie kodu `1a55f666` (checkout `fc859934`), świeży `npm ci`, surowe logi z EXIT; mutacje; uzupełnić dossier.
ZMIANY/COMMIT: tylko logi `r2-logi/`, ten raport i §7 dossier `dyspozycje/rust-port/p5/P5-8-K08D.md`. Zero zmian w kodzie, `gra/**`, `.rs`, `WERSJE.md`. Pliki zmienione przez commity operatora (`f5d34b52..fc859934`) mieszczą się w allowliście. `git diff --check` EXIT 0.
TESTY (wszystkie w pierwszym planie; logi w `r2-logi/`):
- `npm ci`: EXIT 0 (`npm-ci.txt`; komunikat audytu bez wpływu na wynik).
- `npm run check`: EXIT 0; self-test 33 pozytywne / 15 negatywnych, błędów 0; `check-no-logic-imports` plików=206 trafień=0; `verify-pin-copies` pin=edb8fb56 plików=435 niezgodnych=0 (`npm-run-check.txt`).
- `npm run typecheck`: EXIT 0 (`npm-run-typecheck.txt`).
- `verify-k08d-copies --batch handel`: EXIT 0, OK (`verify-k08d-copies-handel.txt`).
- `verify-k08d-copies --batch slider`: EXIT 0, OK (`verify-k08d-copies-slider.txt`).
- `run-k08d-handel-pin --pin-dir /tmp/k08d-pin-2I8X`: EXIT 0, 32/32 zgodnych (`run-k08d-handel-pin.txt`). Pin `edb8fb56` rozpakowany przez `git archive` do katalogu tymczasowego poza repo.
- `mutate-k08d-handel --pin-dir /tmp/k08d-pin-2I8X`: EXIT 0, ZABITE 6/6; baseline verify handel=0 slider=0 pin-exec=0 (`mutate-k08d-handel.txt`). Po mutacjach `git status` pokazuje tylko katalog logów operatora.
- `cargo fmt --all -- --check`: EXIT 0 (`cargo-fmt-check.txt`).
- `cargo clippy --all-targets -- -D warnings`: EXIT 101, NIE_ZMIERZONO. Build przerwany na `gdk-sys v0.18.2`: brak `gdk-3.0.pc` w pkg-config (środowisko, nie kod). Brak zmian w `.rs`, więc bramka kodu Rust nie dotyczy tej partii (`cargo-clippy.txt`).
- `cargo test`: NIE_ZMIERZONO z tego samego powodu (zależności GTK).
BLOKADY:
- Zachowanie w przeglądarce, CSS: NIE_ZMIERZONO (brak harnessu przeglądarkowego w tej partii).
- Dług P5.13 (bramki Mennicy/Waluty w kopii UI; wariant DTO `buildHandelDetailCardK`): bez zmian, decyzja dla K09 wg dossier §2 K08D-Z7.
- `renderWealth`, `renderReligia`: NIE_ZROBIONE (runda 2).
- Dryf pinu `edb8fb56` względem bieżącego `gra/`: NIE_ZMIERZONO (nie badano w tej rundzie).
RUNDY: 1/5 (pomiary operatora nie zwiększają numeru rundy kodu)
NASTĘPNY KROK: runda 2 wg `01-operator-r1.md` (partia `wealth`, potem `religia`), z bramkami i mutacjami per partia.
DEPLOY/PUSH: NIE WYKONANO
