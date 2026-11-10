STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-30-IMAGES-Q1
GOAL: RR-T8c w `rust-port/renderer`, czyli obrazy na CPU: JPG, SVG (port `prepareSvgForCanvas` i `resvg`), emoji według D-TXT-3 = C, `drawImage` ze skalą i `clip`. Sceny porównane z Chromium 141, do tego determinizm, mutacje i manifest sha256.
ROLA: Operator (obrona r1) — odpowiedź na raport Evaluatora r1 (`02-evaluator-r1.md`, commit `682e29d6` w worktree Evaluatora)
BAZA: commit Operatora `c92a28e1` (rodzic `453c3c79`)

## Odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź | Dowód / poprawka |
|---|---|---|---|
| 1 | `t14_prod_icon_x1` mean_abs 1,576 > 1,5, wyjątek z limitem 1,6 | **ODRZUCAM jako wadę do poprawy w tej rundzie.** Decyzję o akceptacji podejmuje orkiestrator. | To odchylenie jest zmierzone i jawne. Wartość z logu to 1,5755 (`dowody/07-image-tests-nocapture.log`:67). SSIM 0,992 i px>16 2,95 % mieszczą się w ostrych progach, a ta sama ikona ×2 i ×3 też jest w progach. Różnica wynika tylko z pokrycia AA krawędzi kresek o grubości 1,2 px (tiny-skia wobec Skii). Alternatywne strategie rasteryzacji (supersampling ×2/×4, przesunięcie ±0,05 px, bitmapa + mip) dały gorszy wynik (P4-30 §5.2 i §6.2). Limit 1,6 to zmierzona wartość zaokrąglona w górę, więc regresja nadal przerywa test. D-TXT-4 = A przewiduje ocenę wzrokową (lista w P4-30 §6.3). |
| 2 | Niespójności: tabela §6.1 podaje 1,575, raport 1,576, komentarz w teście odsyła do §5.3 | **PRZYJMUJĘ** | W tabeli §6.1 jest teraz `1.5755`, czyli wartość z logu. Wcześniej `{:.3}` z 1,5755 dawało 1,575, a w prozie zaokrąglano do 1,576. W §6.2 jest teraz „1,5755 (log …:67; w raportach zaokrąglone do 1,576)”. Komentarz `MEAN_ABS_EXCEPTIONS` w `tests/image_scenes.rs` odsyła teraz do §6.2, wartość 1.5755, próby poprawy: §5.2 i §6.2. |
| 3 | Emoji nie działają w `Canvas2dLite::fill_text` (`.notdef`) | **ODRZUCAM** (poza zakresem tematu) | ALLOWLISTA dispatchu (`00-dispatch.md`) obejmuje `raster/image/**`, z `raster/mod.rs` tylko linię `pub mod image;` i minimalne dotknięcia `raster/canvas.rs`. Nie obejmuje `raster/text/**`. Ograniczenie jest jawne (Z-30-4), a dostęp przez `image::emoji::{fill_text, measure_text}` jest przetestowany. Podpięcie to jedna zmiana w `raster/text/mod.rs` w kolejnej paczce, do decyzji orkiestratora. |
| 4 | `resvg` włącza `simd` w `tiny-skia`, a złote hashe RR-T8a/b sprawdzono tylko na x86_64 | **ODRZUCAM jako blokadę** (zostaje jako uwaga) | Cechy `simd` nie da się wyłączyć bez forka `resvg` (Z-30-2). W kontenerze jest zainstalowany tylko target `x86_64-unknown-linux-gnu` (`rustup target list --installed`). Inne architektury mają status NIE_ZMIERZONO, tak samo jak w zaakceptowanych P4-28 i P4-29. W tej obronie złote hashe RR-T8a/b/c ponownie przeszły na 1.97 i 1.87 (`dowody/09-obrona-r1-gates.log`). |
| 5 | `inputs_are_the_pin_bytes` przechodzi po cichu bez `gra/` i porównuje z checkoutem, a nie z pinem | **PRZYJMUJĘ** | Test porównuje teraz **bezwarunkowo** sha256 wejść z hashami blobów pinu zapisanymi w kodzie. Hashe zmierzono przez `git show edb8fb56:gra/src/assets/portrety/<f> \| sha256sum`: grecy-braz `7bb61ea6…65b1ec`, zulusi-zelazo `b2c34366…0df5b41`, egipt-kamien `45c7a6b6…13ca85`. Test nie czyta już `gra/`. Mutacja M-OB1 (dopisany 1 bajt do JPG) daje FAILED „not the pin edb8fb56 bytes”, a po przywróceniu pliku test przechodzi (`dowody/10-obrona-r1-mutacja-pin.log`). Opis Z-30-6 w P4-30 został zaktualizowany. |
| 6 | fmt i clippy na rustc 1.87.0: NIE_ZMIERZONO | **ODRZUCAM** (ograniczenie środowiska, nie wada) | `rustup component list --toolchain 1.87.0 --installed` pokazuje tylko cargo, rust-std i rustc, bez rustfmt i clippy. Tak samo było w P4-28 i P4-29. Dispatch wymaga fmt i clippy, ale nie na 1.87. Testy na 1.87.0 mają EXIT=0 i 272 przeszło. |
| 7 | 3 z 255 szerokości emoji to odchylenia | **ODRZUCAM** | To jawne odchylenia z limitem w teście (P4-30 §4). Dotyczą rozmiaru ułamkowego 20,3 px oraz ciągu 16 ikon R4 przy 48 i 96 px, różnego o 1 ulp f32. Web nie rysuje w tych warunkach: emoji tylko w rozmiarach całkowitych, ikony R4 pojedynczo w 16 px. 252/255 jest bit w bit, linie bazowe 72/72. Dispatch dopuszcza „jawnie opisane odchylenie”. |
| 8 | ⛏ 🏔 🏛 🛡 🛤 są kolorowe, a na zrzucie 🏛 był mono | **ODRZUCAM jako wadę** (zostaje do oceny wzrokowej) | Odtwarzamy regułę przeglądarki (Z-30-3, P4-30 §3:86-90). Te znaki mają prezentację tekstową, ale DejaVu ich nie ma (P4-25 §3.3), więc Chromium z **tymi samymi** fontami też rysuje je w kolorze z Noto. Referencje tego tematu to potwierdzają. Mono 🏛 na zrzucie tooltipa pochodzi z nieustalonego fontu systemowego środowiska agentów. Dotyczy tylko R4 (kotwice DOM, RR-T8e). Pozycja jest na liście oceny wzrokowej (P4-30 §6.3). |

## Zmiany (allowlista)
- `rust-port/renderer/tests/image_assets.rs`: `inputs_are_the_pin_bytes` porównuje z hashami pinu, poprawiony też opis modułu (zarzut 5).
- `rust-port/renderer/tests/image_scenes.rs`: tylko komentarz przy `MEAN_ABS_EXCEPTIONS` (zarzut 2). Logika i limity bez zmian.
- `dyspozycje/rust-port/p4/P4-30-IMAGES.md`: tabela §6.1, §6.2 i Z-30-6 (zarzuty 2 i 5).
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-30-IMAGES-Q1/03-operator-obrona-r1.md` oraz `dowody/09-obrona-r1-gates.{sh,log}` i `dowody/10-obrona-r1-mutacja-pin.{sh,log}`.
- Nie ruszano: `src/**`, `Cargo.toml`, `Cargo.lock`, fixtur ani `assets/**`. Manifesty są więc bez zmian, a `fixtures_match_manifest_sha256` przechodzi.

## Testy (`dowody/09-obrona-r1-gates.log`)
- Z powodu braku miejsca na dysku kontenera (około 3,5 GB wolne; pierwsza próba skończyła się ENOSPC i Bus error linkera) testy uruchomiono z `CARGO_PROFILE_DEV_DEBUG=0 CARGO_INCREMENTAL=0`. Te ustawienia nie zmieniają semantyki ani hashy RGBA. Target był czyszczony między toolchainami.
- Wyniki: fmt EXIT=0, clippy EXIT=0, clippy `--features gpu` EXIT=0. `cargo test --locked --all-targets` na stable 1.97.0: EXIT=0, 272 przeszło, 0 nie przeszło. Na 1.87.0: EXIT=0, 272 przeszło, 0 nie przeszło.

RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control (Opus 5.5 medium). Orkiestrator rozstrzyga wyjątek z zarzutu 1.
DEPLOY/PUSH: NIE WYKONANO
