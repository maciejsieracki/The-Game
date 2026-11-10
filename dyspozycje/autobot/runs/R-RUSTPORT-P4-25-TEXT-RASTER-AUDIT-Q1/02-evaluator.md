STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-25-TEXT-RASTER-AUDIT-Q1
GOAL: Audyt i specyfikacja tekstu / rasteryzacji w rendererze Rust (D-RR-4 = A, UI-Q2 = A); odblokowanie MOD-08, MOD-10, D-MOD-6.
ZMIANY/COMMIT: oceniany `212f9e38` (baza `a576c63d`). Evaluator dodaje tylko ten plik (commit na `212f9e38`, bez push).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Sprawdzone realnie (zgodne)

- `git grep` wzorca z §1 na `edb8fb56` (render/**, battle/**): 149 linii, plik `dowody/01` identyczny bajt w bajt (`diff` rc=0); rozkład per plik zgodny.
- Szersze przeszukanie (`getContext(` wszystkie, `createElement('canvas')`, `CanvasRenderingContext2D`, `new Texture`/`DataTexture`/`OffscreenCanvas`/`toDataURL`, każde `Sprite`/`SpriteMaterial`/`CanvasTexture`): brak producenta tekstury 2D poza T1–T15 + H1 (`zoomLod.ts:127` to komentarz). `unitVeteranBadges` bez Canvas — potwierdzone.
- `ctx.*`: 34 członki, liczby wystąpień zgodne co do jednego; `addColorStop` 5; wszystkie 20 `arc` to pełne koła; `measureText` 9× wyłącznie `.width`; `textAlign` center 13/left 4, `textBaseline` middle 16/top 1.
- Fonty: wszystkie stringi `ctx.font` zgodne z kodem; 0 plików fontów; T7 512×168, T8 256×213, T9 72×126 (118 px), T13 h ∈ [46,72]/[68,98] (przeliczone z `YIELD_FONT_SCALE = 1.22`); stałe T14 zgodne z `cityMapStatChip.ts:94-173`.
- Crate'y (API crates.io): wersje, licencje, MSRV, rozmiary `.crate` w §5.1 zgodne; liczby `unsafe`/`forbid` zgodne dla 9 sprawdzonych paczek; teza o `kern` potwierdzona w `owned_ttf_parser-0.25.1/src/preparse.rs:107-114`.
- Spike `spike-text`: `cargo +1.87.0 build --release --locked` w czystym `CARGO_TARGET_DIR` (scratchpad) OK, 23 pakiety; wyjście `rgba_fnv64=95001f28a03f7ebc`, PNG sha256 `b8fa5178…68a51` — identyczne. `spike-svg` na 1.87.0: OK, 37 pakietów.
- Nazwy miast: 1 665 wartości, 22 znaki spoza ASCII, brak znaków łączących — zgodne.
- Allowlista: 15 plików, wszystkie w `P4-25-TEXT-RASTER-AUDIT.md` lub `runs/<ID>/**`; `git diff --check a576c63d 212f9e38` czysty.

## Zarzuty

1. **Inwentarz tekstu niekompletny (battle/**).** Pominięte zakotwiczone etykiety DOM murów: `battleScene.ts:7477-7493` `_spawnWallLabel` (`bold 13px sans-serif`, `textShadow: 0 0 6px #000, 1px 1px 2px #000`, kolor z parametru), wywołania `:7225` (`'-' + dmg + ' (mur)'`, `#ff8800`) i `:7311` (`'MUR WYBURZONY!'`, `#ff4400`). Pozycjonowane tym samym `floatLabels` → `worldToScreen` (`:8635`) co R15a. §2.3 wymienia tylko `:9091-9115`. Kryterium binarne „bez pominięć” niespełnione.
2. **Zakres: „zero kodu Rust/TS, zero buildu” (GOAL dispatchu).** Operator zbudował spike'i i zacommitował kod Rust (`spike-text/src/main.rs` 199 linii, `spike-svg/src/main.rs`), `Cargo.toml`, `Cargo.lock` i `out.png` do repo. Ścieżki są w allowliście, ale treść narusza GOAL. Naprawa: usunąć kod/manifesty/PNG z commita (zostawić log, hashe, wersje), albo uzyskać jawną akceptację orkiestratora i zapisać ją w dokumencie.
3. **Ciche rozstrzygnięcie co do fontów własnościowych.** §0 pkt 3 i Z-3 przedstawiają jako fakt („nie wolno ich dołączyć”, „1:1 co do glifu jest niemożliwy”) tezę opartą na przesłance oznaczonej `[zewn., niezweryfikowane]` (§3.2). D-TXT-1 nie ma opcji licencjonowania fontów komercyjnych (Arial/Georgia/Segoe UI) dla wyglądu 1:1. Fakt należy przepisać jako warunkowy/NIE_ZMIERZONO, a opcję dodać do D-TXT-1.
4. **Nieoznaczone twierdzenie zewnętrzne i luka w specyfikacji kolorowych glifów.** §3.4: „bitmapa ignoruje `fillStyle`” bez oznaczenia `[zewn.]`/NIE_ZMIERZONO. Pominięty wpływ alfy `fillStyle` na emoji: T12 `rgba(255,255,255,0.92)` (`workerFieldOverlay.ts`), T13 `rgba(255,255,255,0.95)` (`cityOkolicaOverlay.ts:169`) oraz 👤 `:141`. Rust musi wiedzieć, czy alfa jest stosowana — do D-TXT-3 / NIE_ZMIERZONO.
5. **Reprodukowalność spike'a niepełna.** §5.2 twierdzi `incompatible-rust-versions = "fallback"` dla `spike-text`, ale w dowodach nie ma `.cargo/config.toml` (jest tylko w `rust-port/renderer/.cargo/config.toml:6` na `e810d0d3`). `spike-svg` nie ma `Cargo.lock`, więc „37 pakietów” nie jest odtwarzalne co do wersji.
6. **NIE_ZMIERZONO tam, gdzie pomiar był trywialny.** §5.1 `rustybuzz`: „`wasmi` … opcjonalne? NIE_ZMIERZONO” — `crates.io/api/v1/crates/rustybuzz/0.20.1/dependencies` daje `wasmi ^0.37.0 normal optional`.
7. **`zune-jpeg`: podana wersja RC zamiast stabilnej.** Tabela podaje `0.5.16-rc3` (MSRV 1.77.1, 144 678 B). crates.io `max_stable_version` = `0.5.15` (MSRV 1.75.0, 88 879 B, ta sama licencja). Kandydat powinien mieć dane stabilnej wersji.
8. **Źródło licencji Liberation.** Cytowane `fonts-liberation2/copyright`, a pliki `LiberationSans-Bold.ttf`/`LiberationSerif-Bold.ttf` należą do pakietu `fonts-liberation` 1:2.1.5-3 (`dpkg -S`); `fonts-liberation2` to pakiet przejściowy. Licencja (SIL OFL 1.1) jest poprawna, ale wskazanie dowodu trzeba poprawić.
9. **Repertuar znaków zmierzony tylko dla nazw miast.** Wniosek §3.3 („bez kształtowania złożonego”) nie obejmuje wiersza hover T14 (`prodItemName` = `front?.nazwa`, `cities.ts:836`; `prodCategoryLabel`) ani tekstów R4. Mój pomiar pól `nazwa`/`name` w `gra/data/**/*.json` dał jedynie dodatkowo `—` (U+2014), więc wniosek się utrzymuje, ale dokument musi mieć ten pomiar.
10. **Drobna niezgodność stosu fontu.** Wiersz T10 (§2.1) podaje `bold 58px "Segoe UI Symbol","Segoe UI",Arial`; kod `unitOwnerEmblem.ts:260` ma na końcu `, sans-serif` (§3.2 ma to poprawnie).

Uwaga poza zakresem dispatchu (nie zarzut): Canvas 2D występuje też w `ui/minimapHud.ts:223`, `ui/hud.ts:1452`, `ui/unitMiniPreview.ts:106`, `wonderpreview/main.ts:126-135` (UI/podgląd dev; przy UI-Q1 = A zostają w webview). Warto wspomnieć jednym zdaniem.

TESTY: bramki dokumentacyjne powtórzone (`git diff --check` czysty, allowlista OK); spike'i przebudowane na 1.87.0 w czystym targecie, z hashem zgodnym z wynikiem Operatora; bramki gry nie dotyczą (temat dokumentacyjny).
BLOKADY: brak technicznych. Wymagana poprawka zarzutów 1–10 przez Operatora.
NASTĘPNY KROK: powrót do Operatora (runda 2/5, ten sam ID) → Evaluator → Obrona → Final Control.
