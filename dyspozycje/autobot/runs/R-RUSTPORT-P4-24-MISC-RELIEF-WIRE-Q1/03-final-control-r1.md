STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1
GOAL: Final Control r1. Werdykt dla Operatora r1 (`aa657c2b`) i Evaluatora r1 (`64178099`, PASS-WITH-NOTES). Obrona: brak (`null`), bo Evaluator nie postawił zarzutów.
BAZA OCENY: `64178099` (rodzic `aa657c2b`, przodek `f1a1740c`) oraz sonda scalenia z `origin/rust-port/parity-v2` @ `e810d0d3`.

## Weryfikacja własna (dowód, nie deklaracja)

1. **Allowlista.** `git diff --stat f1a1740c 64178099` daje 24 pliki, wszystkie w allowliście dispatchu.
   - `models.rs`: zmienił się tylko komentarz.
   - `Cargo.toml` i `Cargo.lock` bez zmian.
   - Brak `unsafe` w `core/jsnum.rs` i `models/misc/**`.
   - `git diff --check` czysty.
2. **Fixtury.** SHA-256 plików w drzewie zgadza się z dokumentem P4-24 §4:
   - P4.22 bez zmian: `models.json` `cf17ac9d…`, `siege.json` `06383e4d…`, `overlays.json` `d590e026…` (diff względem `f1a1740c` jest pusty).
   - Nowe fixtury: `relief_real.json` `f3cfbdcd…fec8`, `to_fixed.txt` `fd883070…8d45`.
3. **Własna próbka wektorów z uruchomionego weba.** Wektory są nowe i niezależne od fixtur Operatora: inne ziarna, inne heksy, inne liczby.
   - Środowisko: `git archive edb8fb56 gra/src gra/data` do scratcha poza repo, `three@0.169.0`, `esbuild@0.24.0`, node v22.22.0.
   - Bundel buduje się bez pluginu. Zawiera `function reliefSurfaceSampler(` i `function powierzchniaReliefuY(`, a nie zawiera `relief_shim`.
   - `toFixed`:
     - 6770 przypadków, `digits` 0..24;
     - wartości specjalne, m.in. 1.005, 8.345, 999.9995, ±1e21, 9.999999999999999e20, 5e-324, ±0, NaN, ±Inf, 2^52±0.5;
     - remisy binarne obu znaków, wartości dziesiętne i losowe bity.
   - `reliefSurfaceSampler`:
     - ziarna 0, 7, −1, ±3.99, 2^31, 2^32+5, −2^33−0.5, 1e12+0.25, NaN, 42.42;
     - tereny `Gory`, `Wzgorza`, `Rownina`;
     - R ∈ {1, 1.5, 0.75};
     - razem 1584 punkty i 66 samplerów `null`.
   - Porównanie odbywa się w osobnym crate w scratchu (zależność ścieżkowa od `civ-renderer` @ `64178099`). Sprawdzane są `core::jsnum::js_to_fixed`, `overlay::js_to_fixed`, `js_to_fixed3` (dla d = 3) i `GameRelief.sampler`, przez `to_bits`.
   - **Wynik: 0 różnic.**
4. **Przegląd kodu.**
   - Gałąź remisu jest poprawna. Jeśli `|x|·2^(d+1)` jest nieparzystą liczbą całkowitą, to `|x| = k/2^(d+1)` ma dokładnie d+1 cyfr po przecinku i ostatnia z nich to 5. Wydruk `{:.(d+1)}` jest wtedy dokładny, a zaokrąglenie w górę na łańcuchu odpowiada regule ECMA-262 „larger n”.
   - Mnożenie przez potęgę dwójki z bitów wykładnika (≤ 2^101) jest dokładne w całym zakresie |x| < 1e21, łącznie z liczbami subnormalnymi.
   - `GameRelief` ponownie używa `decor::style::ReliefSampler` i `js_to_uint32`, więc nie ma kopii kodu.
   - Wszystkie wywołania `js_to_fixed` w `range.rs` i `territory.rs` idą przez `pub use`, czyli przez jedną implementację.
5. **Bramki.** Uruchomione samodzielnie w czystym `CARGO_TARGET_DIR`, który potem usunąłem. Pełne logi: `fc-r1-*.log`.

| Drzewo | fmt | clippy | clippy gpu | test |
|---|---|---|---|---|
| `64178099` | EXIT=0 | EXIT=0 | EXIT=0 | EXIT=0 (137 zaliczonych / 0 niezaliczonych) |
| sonda scalenia `e810d0d3` + `64178099` (`git merge --no-ff`, bez konfliktów) | EXIT=0 | EXIT=0 | EXIT=0 | EXIT=0 (145 zaliczonych / 0 niezaliczonych) |

## Orzeczenia

| # | Zarzut / uwaga | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| Ev | Zarzuty Evaluatora: brak | — | Lista pusta. Potwierdzam ją własnymi pomiarami z pkt 1–5. |
| U1 | Komentarz `models.rs` po scaleniu z P4.21 (`pub mod cities;`) nie wymienia `cities` | **ODDAL** (z warunkiem integracyjnym) | Na bazie tematu (`f1a1740c`) komentarz jest poprawny i spełnia pkt (3) GOAL. Rozjazd powstaje dopiero przy scaleniu z równoległym tematem, a sonda scalenia przechodzi bez konfliktu i z zielonymi bramkami. **Warunek integracji:** orkiestrator przy scalaniu dopisuje `cities` (MOD-09) do listy w komentarzu `models.rs`. To jedna linia komentarza, kod się nie zmienia. |
| U2 | Domyślny sampler podpięty przez nową `build_range_overlay_group_game` i `GameRelief`, stara sygnatura z jawnym `relief` zostaje (Z1) | **ODDAL** | Dispatch każe zachować ścieżki publiczne. Zmiana sygnatury złamałaby ścieżkę P4.22. Ścieżka gry używa `GameRelief`, a test `misc_web_parity` porównuje ją bitowo z webem bez shimu. |

Agregat: brak NAPRAW, więc **PASS**. Nie ma decyzji dla człowieka.

## Integracja

- Brak commita Obrony (Obrona `null`, nie było zarzutów). Commit do integracji to ten raport FC, położony na `64178099`. Jego łańcuch: `f1a1740c` → `aa657c2b` → `64178099` → FC r1.
- Kolejność: P4.21 (`e810d0d3`) jest już w `origin/rust-port/parity-v2`. Ten łańcuch scala się na nią jako następny (`--no-ff`), bez konfliktów, z poprawką komentarza z U1.
- `dyspozycje/rust-port/p4/P4-24-MISC-RELIEF-WIRE.md` jest w tym łańcuchu. Orkiestrator przenosi go na gałąź dokumentacyjną zgodnie ze swoim zwyczajem.

ZAŁOŻENIE FC-Z1: „odtwórz commit Obrony” przy Obronie `null` oznacza wskazanie commita łańcucha do integracji. Jest nim ten commit raportu FC na `64178099`. Kod nie jest zmieniany.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (scalenie na `origin/rust-port/parity-v2` + U1), potem READY_FOR_DEPLOY
DEPLOY/PUSH: NIE WYKONANO
