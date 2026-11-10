STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-29-TEXT-FONTS-Q1
GOAL: RR-T8b — font + tekst na `raster::Canvas2dLite` (fonty D-TXT-1 = A dołączone, parser `font`, fallback per glif, ab_glyph + rustybuzz, textAlign/textBaseline, fillText/strokeText jako kontury, measureText().width, truncateName UTF-16, toUpperCase), weryfikacja vs Chromium 141.
ZMIANY/COMMIT: allowlista — `rust-port/renderer/src/raster/text/{mod,font,fonts}.rs` (nowe), `src/raster/mod.rs` (+`pub mod text;`), `src/raster/canvas.rs` (wyłącznie `pub(crate)` hooki + pole `text` w `State`, uzasadnienie P4-29 §3.6), `assets/fonts/**` (6 TTF + 2 licencje + SOURCES + MANIFEST, 3 069 998 B), `Cargo.toml`/`Cargo.lock` (`ab_glyph =0.2.32`, `rustybuzz =0.20.1`), `tests/text_{api_closed,fonts,metrics,scenes,upper}.rs`, `tests/fixtures/text/**` (3 858 973 B), `dyspozycje/rust-port/p4/P4-29-TEXT-FONTS.md`, ten katalog. SHA: commit w worktree (patrz odpowiedź Operatora); `src/lib.rs` nietknięty.
TESTY: fmt/clippy/clippy gpu EXIT=0; test stable 253/0 EXIT=0; test rustc 1.87.0 253/0 EXIT=0 (`dowody/01-gates.log`). measureText 5 105/5 105 bit w bit; przycięcia 12 620/12 620; baseline 216/216; parser 39/39; toUpperCase 1 665 nazw + 0 różnic w tablicy V8; 36 scen w progach RR-T8a (SSIM min 0,9933, mean max 1,34, px>16 max 4,35 %); złote hashe identyczne 8× (1.87/1.97 × debug/release × 2); referencje Chromium odtworzone — MANIFEST identyczny; mutacje 23/23.
BLOKADY: brak. NIE_ZMIERZONO: wygląd na Windows/DirectWrite i GPU, korekcja gamma masek glifów Skii, determinizm poza x86_64, clippy na 1.87.0 (niezainstalowany).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (R-RUSTPORT-P4-29-TEXT-FONTS-Q1).
DEPLOY/PUSH: NIE WYKONANO
