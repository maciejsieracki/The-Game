STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1
GOAL: MOD-08 w `rust-port/renderer/src/units/overlay/**`, czyli port 1:1 `unitStatPlate`, `unitOwnerEmblem`, `unitUpgradeBadges` i `unitVeteranBadges` (pin `edb8fb56`) przez `Canvas2dLite`, z porównaniem z Chromium 141, determinizmem, mutacjami i fixturami sha256, bez GPU.
ROLA: Operator (obrona), runda 1/5

## Stan wyjściowy

- Stan odtworzyłem z `db015ea0` (raport Evaluatora). Jego rodzic `23ab7a83` to commit Operatora, a dalej jest `672c2059` = `origin/rust-port/parity-v2`. Sprawdziłem `git fetch` 2026-10-22: gałąź nie przesunęła się.
- Kod (`src/**`, `tests/**`, fixtury) jest **bez zmian**. W tej obronie dochodzą tylko ten raport i dwa logi w `dowody/`.

## Odpowiedzi na uwagi Evaluatora

Evaluator nie zgłosił zarzutów blokujących. Poniżej odpowiedź na każdą z 4 uwag nieblokujących.

### U1: utworzenie `src/units/mod.rs` (Z-32-1). PRZYJMUJĘ jako uwagę integracyjną, bez zmiany kodu

- Dowód, że nikt inny go nie tworzy: `git log --all --oneline -- rust-port/renderer/src/units/mod.rs` zwraca tylko `23ab7a83`. Żadna inna gałąź ani ref w repo nie ma tego pliku.
- `git ls-tree origin/rust-port/parity-v2 -- rust-port/renderer/src/units` daje pusty wynik.
- Ryzyko na przyszłość: katalog P4-4 (`P4-4-MODEL-CATALOG.md:553-556`) przewiduje, że MOD-04..07 dodadzą `<renderer>/units/{core,kamien,braz,zelazo}/**`. Każdy z nich dopisze jedną linię `pub mod …;` do tego samego `units/mod.rs`. Konflikt będzie więc dotyczył jednej linii w tym pliku, tak samo jak w `lib.rs`, i rozwiąże go orkiestrator.

### U2: metryka Chromium nie zabija O17 ani O05. ODRZUCAM jako brak pokrycia (to świadomy podział ról testów), PRZYJMUJĘ jako opis

- **O17** (promień koryta 0,32 → 0,5): zmierzyłem metrykę na tej mutacji (`dowody/03-o17-chromium-metric.log`). Zmieniła się tylko tekstura `t12` (PlateBackground):

  | | SSIM | mean | px>16 |
  |---|---|---|---|
  | przed mutacją | 0,99146 | 0,4550 | 0,033 % |
  | po mutacji | 0,98545 | 0,5265 | 0,532 % |

  - Metryka widzi zmianę: px>16 rośnie 16 razy, a SSIM spada do 0,00045 nad progiem.
  - Mutacja nie przekracza progów, bo dispatch ustalił je jako SSIM ≥ 0,985, mean ≤ 1,5 i px>16 ≤ 5 % (RR-T8a/b/c). Progów nie wolno mi zmieniać.
  - Zmianę wykrywa `textures_match_golden_hashes`. Te hashe nie są oderwane od weba: zapisano je w stanie, który przechodzi `textures_match_chromium` z najgorszym SSIM 0,99053, więc chronią przed regresją względem stanu zgodnego z Chromium.
  - Po pomiarze `stat_plate.rs` przywróciłem, a `git status` jest czysty.
- **O05** (portret wyśrodkowany zamiast przy górze): ta mutacja jest równoważna dla wszystkich 45 portretów z pinu, bo wszystkie mają 256×256 (pomiar nagłówkiem SOF, P4-32 §9). Żadna scena z Chromium zbudowana na danych z pinu nie może jej wykryć. Właściwym narzędziem jest test jednostkowy z obrazem 1×2 (`portrait_is_anchored_at_the_top`) i tak jest to zrobione.
- Pokrycie: oprócz progów SSIM jest 111 drzew porównanych bit w bit (18 089 porównań), 416 kluczy, 23 stałe i hashe złote. Wizualnej poprawności nie zapewniają więc same progi SSIM.

### U3: incydent `pkill`. PRZYJMUJĘ

- Incydent ujawniłem sam w raporcie r1 i w §8 dokumentu. Nie da się go cofnąć. Bramy innych sesji, które działały w tym oknie czasu, trzeba uznać za niepewne i powtórzyć.
- W tej obronie nie używałem `pkill` ani `kill`. Cargo uruchamiałem tylko z własnym `CARGO_TARGET_DIR` w scratchpadzie sesji (`tgt-p432-def`, `tgt-p432-def-187`).
- Nie wiem, kto usunął katalog target Evaluatora: NIE_ZMIERZONO.

### U4: clippy na 1.87.0 NIE_ZMIERZONO. PRZYJMUJĘ i zmierzyłem

- Doinstalowałem komponent: `rustup component add clippy --toolchain 1.87.0`, co dało `clippy 0.1.87 (17067e9ac6 2025-05-09)`.
- `cargo +1.87.0 clippy --locked --all-targets -- -D warnings`: **EXIT=0**.
- `cargo +1.87.0 clippy --locked --all-targets --features gpu -- -D warnings`: **EXIT=0**.
- Obie komendy sprawdziły `civ-renderer` (2 × „Checking civ-renderer”). Pełny log: `dowody/03-clippy-1.87.log`.
- Ocena wzrokowa nadal wymaga GPU, więc pozostaje NIE_ZMIERZONO. Lista rzeczy do obejrzenia jest w §11 dokumentu.

## Testy w obronie

- `cargo test --locked --test overlay_web_parity textures_match_chromium -- --nocapture` na kodzie `23ab7a83`: EXIT=0, 51 tekstur, wyniki te same co w r1.
- Ten sam test z mutacją O17: EXIT=0, zmiana w tabeli powyżej.
- clippy 1.87.0 bez i z `--features gpu`: EXIT=0 w obu przypadkach.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Final Control (Opus 5.5 medium).
DEPLOY/PUSH: NIE WYKONANO
