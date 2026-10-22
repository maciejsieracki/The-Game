STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-25-TEXT-RASTER-AUDIT-Q1
GOAL: Audyt i specyfikacja tekstu i rasteryzacji w rendererze Rust (D-RR-4 = A, UI-Q2 = A). Odblokowuje MOD-08, MOD-10 i D-MOD-6.
ZMIANY/COMMIT: baza: commit Operatora `212f9e38`, na nim commit obrony (SHA w odpowiedzi). Zmienione pliki: `dyspozycje/rust-port/p4/P4-25-TEXT-RASTER-AUDIT.md`, `dowody/08-spike-repro.txt` (NOWY), `dowody/09-charset-all-sources.txt` (NOWY), `dowody/10-crates-r2.txt` (NOWY). Usunięte: `dowody/spike-text/**` i `dowody/spike-svg/**` (6 plików). Ten raport.

## Odpowiedzi na zarzuty Evaluatora (runda 1)

| # | Werdykt | Poprawka i dowód |
|---|---|---|
| E-1 etykiety muru | **PRZYJMUJĘ** | W §2.3 doszedł wiersz R15b: `battleScene.ts:7477-7493`, wywołania `:7225` i `:7311`, `bold 13px sans-serif`, `textShadow`. Opisany jest wspólny mechanizm `floatLabels` (`:7488`, `:9111`) → `_tickFloatLabels` (`:8624-8642`) → `worldToScreen` (`:8635`). `grep -nE "floatLabels\|worldToScreen"` nie pokazuje innych miejsc. Uzupełnione też: §0 pkt 1, §3.2 i RR-T8e w §6. |
| E-2 kod spike'ów w repo | **PRZYJMUJĘ** | `git rm` 6 plików (`main.rs` ×2, `Cargo.toml` ×2, `Cargo.lock`, `out.png`). W repo zostały tylko logi i hashe (`dowody/08`). ZAŁOŻENIE Z-8 (§8) opisuje, jak rozumiem „zero buildu”: build w scratchpadzie jest pomiarem crate'ów, nie artefaktem. Jeśli orkiestrator uzna inaczej, Z-8 wskazuje, które tezy trzeba zmienić na NIE_ZMIERZONO. |
| E-3 ciche rozstrzygnięcie fontów | **PRZYJMUJĘ** | W §0 pkt 3, §3.2 i Z-3 teza ma teraz formę warunkową. Nowe ZAŁOŻENIE Z-6 nosi oznaczenie `[zewn., niezweryfikowane]`. D-TXT-1 ma nową opcję **D: licencja komercyjna oryginałów** (koszt i warunki NIE_ZMIERZONO). Uzupełniona lista NIE_ZMIERZONO w §9. |
| E-4 `fillStyle` i emoji | **PRZYJMUJĘ** | W §3.4 przy tezie o kolorach bitmapy jest teraz `[zewn., niezweryfikowane]`. Dopisany punkt o alfie: `workerFieldOverlay.ts:101` (0,92), `cityOkolicaOverlay.ts:141` (0,92) i `:169` (0,95). Zachowanie Chromium oznaczone NIE_ZMIERZONO. Nowe ZAŁOŻENIE Z-7 i pytanie dopisane do D-TXT-3. |
| E-5 odtwarzalność | **PRZYJMUJĘ** | `dowody/08` zawiera: treść `.cargo/config.toml` (`[resolver] incompatible-rust-versions = "fallback"`), deklaracje zależności, wersje i checksumy obu locków (23 i 37 pakietów), sha256 7 plików oraz ścieżki blobów w `212f9e38`. `spike-svg` przebudowany w r2 z `--locked --offline` na 1.87.0 daje 1056 px, czyli tyle co w r1. |
| E-6 `wasmi` | **PRZYJMUJĘ** | crates.io API: `wasmi ^0.37.0` jest opcjonalny i włącza go tylko cecha `wasm-shaper`, nieobecna w `default = ["std"]`. Poprawione w §5.1, dowód w `dowody/10`. |
| E-7 `zune-jpeg` | **PRZYJMUJĘ** | W §5.1 jest teraz 0.5.15: MSRV 1.75.0, 88 879 B, sha256 `.crate` `27bc9d5b…7296`, 9 737 linii, 85 linii z `unsafe`, `forbid` pod cfg (`lib.rs:163`). Dowód w `dowody/10`. |
| E-8 pakiet Liberation | **PRZYJMUJĘ** | `dpkg -S` → `fonts-liberation` 1:2.1.5-3; `fonts-liberation2` to „transitional dummy package”; licencja z `/usr/share/doc/fonts-liberation/copyright:9`. Poprawione w §3.5, dowód w `dowody/10`. |
| E-9 zestaw znaków | **PRZYJMUJĘ, z korektą wniosku Evaluatora** | `dowody/09` obejmuje T14 hover (`front?.nazwa` z `buildings.json`, „Rozbuduj A → B”, `units.json`, literały), R4, R5 (`city.name` bez upper), R15a i R15b. Poza nazwami miast wychodzi 46 znaków. Teza o diakrytykach się utrzymuje (0 znaków łączących, wszystkie litery są w Liberation). Wniosek Evaluatora „dochodzi tylko `—`” jest jednak **niepełny**. Dochodzą jeszcze `→` U+2192 (`building-upgrades.ts:61`) oraz **17 emoji ikon R4** (`main.ts:12863-12867`, `:13049`, `:13070`), z czego 16 nowych. Liczba glifów z fallbacku rośnie z 8 do 24. Zmiany w §0 pkt 4, §3.3, §3.5, D-TXT-3 i RR-T8e. |
| E-10 stos T10 | **PRZYJMUJĘ** | W §2.1 T10 ma teraz pełny stos `bold 58px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif` (`unitOwnerEmblem.ts:260`). |

Uwaga Evaluatora (Canvas 2D w `ui/**` i `wonderpreview/**`): dopisana w §2.1 jako sprawa poza zakresem, bez inwentarza.

TESTY: temat dokumentacyjny, więc bramki gry nie dotyczą. `git diff --cached --check` czysty. Allowlista: zmiany tylko w `dyspozycje/rust-port/p4/P4-25-TEXT-RASTER-AUDIT.md` i `dyspozycje/autobot/runs/R-RUSTPORT-P4-25-TEXT-RASTER-AUDIT-Q1/**`, zero zmian w `gra/**`, `rust-port/**` i `src-tauri/**`. Weryfikacja sha256: pliki usunięte z repo są identyczne z plikami w scratchpadzie.
BLOKADY: brak technicznych. Uwaga dla orkiestratora: Z-8 (czy build w scratchpadzie mieści się w „zero buildu”) wymaga jego akceptacji.
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO
