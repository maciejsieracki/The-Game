STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1
GOAL: Paczka MOD-03 (dekoracje terenu) w Rust 1:1 z webem `edb8fb56`, porownanie bitowe; Final Control r3 po zarzutach Evaluatora r3 i Obronie r3.
ROLA: Final Control r3

## Przedmiot oceny i ancestry

- Kod Obrony r3: `0dadaac3b`, raport Obrony: `518064098` (gałąź `p417-obrona-r3`, bez push).
- Baza: `origin/rust-port/parity-v2` = `95930b446`. `95930b446` jest rodzicem `0dadaac3b`, więc integracja jest fast-forwardem (`git log 518064098`: `518064098 → 0dadaac3b → 95930b446`).
- `b338830eb` (kod r2) jest już przodkiem `origin/rust-port/parity-v2` (`git merge-base --is-ancestor` = prawda).
- Raport FC: osobny commit nad `518064098` na gałęzi `p417-fc-r3`. Ten commit zawiera tylko ten plik i logi `logs/fc-r3-*.txt`.

## Allowlista (zweryfikowana samodzielnie)

`git diff --name-only 95930b446 518064098` daje 19 plików, wszystkie w allowliście:
- `rust-port/renderer/src/decor/js.rs`;
- `rust-port/renderer/tests/decor_web_parity.rs`;
- `rust-port/renderer/tests/fixtures/decor/{.gitattributes, README.md, SHA256SUMS, box_sign.json, box_sign.mjs}`;
- `dyspozycje/rust-port/p4/P4-17-MOD03-TERRAIN-DECOR.md`;
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1/**`.

Pozostałe sprawdzenia:
- Zero zmian w `gra/**`, `rust-port/engine/**`, `src-tauri/**`, `Cargo.lock` i `Cargo.toml` (`git diff --name-only … -- <ścieżki>` = 0 wierszy).
- `git diff --check`: czysto.
- Usunięte publiczne `decor::js::Box3::{empty, expand, is_empty}` nie mają wołającego w repo. `grep` po `*.rs` nie znajduje `decor::js::Box3`. `Box3::empty()` w `models/improvements/model.rs` to osobny, lokalny typ.

## Bramki (FC, samodzielnie, drzewo `518064098`, czysty `CARGO_TARGET_DIR` poza repo, potem usunięty)

Surowe logi: `logs/fc-r3-*.txt`, w nagłówku `HEAD=5180640982b8…`.

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT=0 |
| `cargo clippy --locked --all-targets -- -D warnings` | EXIT=0 |
| `cargo clippy --locked --all-targets --features gpu -- -D warnings` | EXIT=0 |
| `cargo test --locked --all-targets` | EXIT=0, 62 × `test result: ok`, 0 FAILED |
| `cargo test --locked --test decor_web_parity -- --nocapture` | EXIT=0, 12/12 |

- Inne testy w tym przebiegu: `jsmath_v8_parity` 14/14, `jsmath_wiring` 6/6.
- Parytet bitowy decor: box_sign 36 + hashes 98 543 + coast 27 027 + riverlod 830 + relief 29 468 + geometries 90 917 + builders 324 838 = **571 659 skalarów, `bit_diff=0`** we wszystkich sekcjach. Zgadza się z deklaracją Obrony.
- `sha256sum -c SHA256SUMS` w `tests/fixtures/decor/`: 11 × OK.
- Niezależna mutacja FC (odpowiednik E02/M37): w `src/scene/graph.rs:581-583` zamieniłem `js_min` na `f64::min`. `bounding_box_keeps_web_sign_of_zero` FAILED (`box_sign: scalars=36 bit_diff=3`). Mutant zabity, plik przywrócony przez `git checkout` (`git status` czysty).

## Orzeczenia

1. **Logi i dokument opisują inne drzewo niż commit (baza `bf59164b` zamiast `e1d69078d`): ODDAL (naprawione).**
   - Nagłówek P4-17 opisuje teraz obie bazy, a §0–§10 są oznaczone jako stan r2.
   - Logi r3 i logi FC mają w nagłówku SHA drzewa.
   - FC zmierzył bramki sam na `518064098`, więc dowód nie zależy już od logów Operatora.
2. **Kod na `parity-v2` przed E/FC, przedwczesny wpis `f23326304` („P4.17 PASS: dokumenty”): ODDAL jako zarzut wobec kodu tematu. Uwaga procesowa dla orkiestratora.**
   - Fakt potwierdzony: `b338830eb` jest w `parity-v2`, a `f23326304` (2026-10-22 12:52) wystawił PASS bez Evaluatora i FC.
   - Luka pomiarowa jest zamknięta: decor na `95930b446` + r3 jest zielony bitowo (pomiar FC wyżej).
   - Korekta: orkiestrator powinien w rejestrze oznaczyć `f23326304` jako przedwczesny, a jako właściwe domknięcie P4.17 wskazać ten FC. To czynność orkiestratora, nie decyzja produktowa.
3. **SHA-256 poza katalogiem fixtur i niesprawdzane testem: ODDAL (naprawione).**
   - Plik `SHA256SUMS` (11 plików) leży w katalogu fixtur.
   - Test `fixtures_match_sha256sums` pada przy zmienionym, brakującym albo niewymienionym pliku.
   - Własną SHA-256 sprawdzają wektory FIPS 180 (w tym 1 000 000 × `a`).
   - `.gitattributes eol=lf` chroni bajty plików.
   - FC potwierdził sumy niezależnie przez `sha256sum -c`.
4. **Brak asercji liczby rekordów: ODDAL (naprawione).**
   - `assert_count` liczy rekordy faktycznie porównane w każdej sekcji: 939, 500, 301, 127, 15 × 54 × 121, 7, 112, 24 + 500 i 6 sekcji riverlod (w tym 60 przypadków).
   - Mutanty M39 i M41–M43 są zabite komunikatem `records compared`.
5. **Luka mutacyjna w `decor::js::Box3` (E02, E09): ODDAL (naprawione).**
   - Martwe metody bez wołającego usunięto, więc E09 nie ma już czego mutować.
   - Żywą pętlę (`Scene::mesh_bounding_box`) przypina test znaku zera z wektorami z uruchomionego three r169 (`box_sign.mjs`/`.json`).
   - FC sam potwierdził, że mutant `f64::min` ginie.
   - NaN w bbox: NIE_ZMIERZONO. To kontrakt `pick::three::js_min/js_max` (poza allowlistą), a geometrie decor nie zawierają NaN. Nie blokuje.
6. **Strażnik `decor_uses_jsmath_not_platform_libm` tylko tekstowy: ODDAL (naprawione).**
   - Skaner działa na tokenach i pomija komentarze `//` oraz literały.
   - Łapie metodę, ścieżkę po dowolnym typie lub aliasie, wskaźnik funkcji, `use` i goły import dla 26 funkcji, a `mul_add`, `libm` i `intrinsics` w każdej postaci.
   - Sam skaner ma test na 21 przykładach pozytywnych i 13 negatywnych. Mutanty M46–M49 są zabite (`mutacje/final-r3.txt`).
   - Znane ograniczenie: komentarze `/* */` nie są wycinane. Grozi to tylko fałszywym alarmem, a nie przepuszczeniem błędu.

Zarzutów NAPRAW: 0. Zarzutów DO DECYZJI CZŁOWIEKA: 0.

## Uwagi (NOTES), nieblokujące

- Ocena wzrokowa 1:1: NIE_ZMIERZONO (brak GPU). Lista do sprawdzenia po RR-T5 jest w P4-17 §7.
- Przeżyły mutanty M05, M12 i M18. Są równoważne, uzasadnienie w P4-17 §5 (bez zarzutu Evaluatora).
- M13 = NOCHANGE: mutowany kod zastąpił P4.27. Kolejność macierzy nadal pokrywają porównania `matrixWorld`.
- Proces: zob. orzeczenie 2 (korekta wpisu `f23326304` w rejestrze).

ZMIANY/COMMIT: ten raport i `logs/fc-r3-{fmt,clippy,clippy_gpu,test,decor}.txt`. Commit FC nad `518064098`, gałąź `p417-fc-r3`, bez push. Kod do integracji: `0dadaac3b` (+ raporty `518064098` i commit FC).
TESTY: jak w tabeli: wszystkie EXIT=0, 571 659 skalarów, 0 różnic bitowych, mutant FC zabity.
BLOKADY: brak.
RUNDY: 3/5
NASTĘPNY KROK: orkiestrator: fast-forward `rust-port/parity-v2` z `95930b446` na commit FC, `refs/keep/R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1-fc`, korekta wpisu `f23326304` w rejestrze.
DEPLOY/PUSH: NIE WYKONANO
