STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-30-IMAGES-Q1
GOAL: RR-T8c w `rust-port/renderer`: JPG (zune-jpeg), SVG (port `prepareSvgForCanvas` + resvg/usvg), emoji wg D-TXT-3 = C, `drawImage` ze skalą i `clip`; sceny vs Chromium 141, determinizm, mutacje, manifest sha256.

ZMIANY/COMMIT: oceniono `c92a28e1` (Operator) + `5ac3f144` (Obrona), baza `453c3c79`. Ten raport: commit na `5ac3f144`.
- Allowlista: wszystkie pliki z `git diff --name-only 453c3c79 5ac3f144` mieszczą się w allowliście dispatchu (`canvas.rs`: dozwolone minimalne dotknięcie, uzasadnione w P4-30 §10). `src/lib.rs`, `gra/**` nietknięte. `git diff --check 453c3c79 5ac3f144`: czysto.
- Integracja: `origin/rust-port/parity-v2` = `7fe46f7f` (przesunięty od `453c3c79`; zmiany upstream nie dotykają `rust-port/renderer`). `git merge-tree --write-tree origin/rust-port/parity-v2 5ac3f144` → drzewo `6a420a6e`, bez konfliktów. Kolejność: `c92a28e1` → `5ac3f144` → ten raport, na `7fe46f7f`.

TESTY (samodzielnie, czyste targety, `CARGO_PROFILE_DEV_DEBUG=0 CARGO_INCREMENTAL=0` z powodu ~4,6 GB wolnego dysku):
- stable: fmt EXIT=0, clippy `-D warnings` EXIT=0, clippy `--features gpu` EXIT=0, test `--locked --all-targets` EXIT=0 — 272 passed / 0 failed.
- rustc 1.87.0: test `--locked --all-targets` EXIT=0 — 272 passed / 0 failed.
- `t14_prod_icon_x1`: 24x24, mean_abs 1.5755, px>16 2.951 %, SSIM 0.99212 (log `--nocapture`), zgodnie z obroną.
- Pin: `git show edb8fb56:gra/src/assets/portrety/<f> | sha256sum` = hashe w teście i sha256 fixtur (3/3).
- Mutacja pinu (dopisany 1 bajt do `portrait-grecy-braz.jpg`): `inputs_are_the_pin_bytes` FAILED i `fixtures_match_manifest_sha256` FAILED; po przywróceniu czysto.
- Próbka wektorów vs funkcja weba: `prepareSvgForCanvas` przepisana dosłownie z `edb8fb56:gra/src/render/unitOwnerEmblem.ts:224-229`, uruchomiona w node 22 na wejściach `input/*.svg` i `edge-svgs.tsv` → 270/270 identycznych z `prepare.tsv`.

ORZECZENIA:
1. wyjątek t14 (1.5755 > 1.5, limit 1.6) — ODDAL jako wada: zmierzone, jawne, SSIM i px>16 ostre, ×2/×3 w progach, alternatywy udokumentowane jako gorsze; limit dalej łapie regresję. Akceptacja odchylenia do wiadomości orkiestratora (D-TXT-4 = A).
2. niespójność 1.575/1.576/§5.3 — ODDAL (naprawione w `5ac3f144`; zweryfikowane grepem).
3. emoji poza `Canvas2dLite::fill_text` — ODDAL: `raster/text/**` poza allowlistą; Z-30-4; osobna paczka.
4. `simd` w tiny-skia, tylko x86_64 — ODDAL: złote hashe RR-T8a/b zielone na x86_64; inne arch NIE_ZMIERZONO jak w P4-28/29.
5. `inputs_are_the_pin_bytes` cichy pass — ODDAL (naprawione w `5ac3f144`, mutacja wykryta).
6. fmt/clippy na 1.87 — ODDAL: dispatch tego nie wymaga; komponenty niezainstalowane.
7. 3/255 szerokości nie bit w bit — ODDAL: jawne odchylenia z limitem, warunki nieużywane przez web.
8. kolorowe ⛏ 🏔 🏛 🛡 🛤 — ODDAL jako wada: reguła przeglądarki; ocena wzrokowa NIE_ZMIERZONO (P4-30 §6.3).

BLOKADY: brak. Notatki: ocena wzrokowa emoji; podpięcie emoji do `Canvas2dLite::fill_text` w kolejnej paczce.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (cherry-pick w podanej kolejności na `origin/rust-port/parity-v2`, ponowne bramki).
DEPLOY/PUSH: NIE WYKONANO
