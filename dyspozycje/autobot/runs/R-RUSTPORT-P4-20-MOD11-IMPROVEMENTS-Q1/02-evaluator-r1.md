STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1
GOAL: Przenieść paczkę MOD-11 do Rust 1:1 z webem `edb8fb56`: improvements, robloxImprovements (24 BUILDERS + stosy), p2/p3a/p3b, kopalnie, droga, pastwisko, świnia, styleResources, resources. Koń z `unit_core`, drzewo `unit_core::model::UnitModel`, zgodność bitowa z uruchomionym webem.
ZMIANY/COMMIT: ocena commitów Operatora `acb1915e` (kod) i `4e96a7e8` (dokumentacja), baza `bf59164b`. Evaluator zmienia tylko ten plik.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdziłem (realnie wykonane)

1. **Allowlista i baza.** `git diff --name-only bf59164b 4e96a7e8`: wszystko mieści się w allowliście. `src/models.rs` dostał jedną linię `+pub mod improvements;`. `lib.rs`, `Cargo.toml` i `Cargo.lock` są bez zmian, `git diff --check` jest czysty. `bf59164b` jest przodkiem `origin/rust-port/parity-v2`.
2. **Wektory z uruchomionego weba.** Odtworzyłem je według README w scratchu poza repo: `three@0.169.0`, `esbuild@0.24.0`, node v22.22.0, `git archive edb8fb56 gra/src gra/data`. Wynik: `improvements full=195 sigs=237`, EXIT=0. Pliki `models.json`, `sigs.json` i `data.json` są **bajtowo identyczne** z commitem (`cmp`). Sumy sha256 zgadzają się z dokumentem §6: `4f27e823…7453`, `f45443e9…8494`, `d908702a…b049`. `gen.ts` importuje moduły weba bez zmian.
3. **Pokrycie.** Testowane są wszystkie 24 klucze `BUILDERS`, czterech właścicieli fortu/posterunku i 4 klucze nieznane. Do tego: 8 wartości `Nakladka` (pełny enum `types/hex.ts:30-39`), 13 wartości `zloze` (wszystkie gałęzie `styleResources.ts:473-497` plus `xyz` i `''`), zwierzęta we wszystkich pozach, 64 maski × 2 typy dróg, 44 układy sektorowe i stosy 1..N. Test sprawdza, że przypadki Rust i fixtury odpowiadają sobie 1:1 (`improvements_web_parity.rs:1389`).
4. **Bramki w czystym targecie** (`CARGO_TARGET_DIR` w scratchu, `acb1915e`/`4e96a7e8`): fmt EXIT=0, clippy EXIT=0, clippy `--features gpu` EXIT=0, `cargo test --locked --all-targets` EXIT=0. Wynik `improvements_web_parity`: `models: cases=432: scalars=173070 bit_diff=0 within_1e-12=0 struct_diff=0`, `data: scalars=35 … 0`.
5. **Sonda scalenia z bieżącym `origin/rust-port/parity-v2` (`b338830e`).** `git merge-tree` przechodzi bez konfliktów (sonda `01106d7d`, tylko lokalnie). fmt, clippy ×2 i test przechodzą z EXIT=0: 19 binarek, 0 porażek.
6. **Reużycie i typ drzewa.** Koń pochodzi z `unit_core::horse::{build_horse, build_zloze_konie}` (`p3a.rs:8`, `zasoby.rs:11`). Drzewo to `UnitModel`. `ImprovementModel` jest tylko otoczką z tabelami bocznymi (`model.rs:255`) i nie wprowadza nowego typu węzła. Cykl improvements↔roblox jest rozwiązany jednokierunkowo przez `registry` → `roblox::roblox_builder`, bez duplikacji. `geom/**` i `unit_core/**` są nietknięte.
7. **Mutacje.** Powtórzyłem M3, M12, M13 i M22b Operatora: wszystkie zabite, z liczbami identycznymi jak w §5. Moje własne mutacje też są zabite:
   - E1, kolor krowy: 7 bitów i 14 różnic strukturalnych.
   - E2, `atan2` platformy w drodze: wykrywa `data_tables_match_web`.
   - E3, `SECTOR_R_ELEVATED` 0,861: zabita.
   - E4, pozycja lamy: 21 bitów.
   - E5, zmieniona sygnatura w fixturze: zabita.
   - E6, pozycja w `models.json` +1 ulp: 1 bit.
   - E7, hash geometrii w fixturze: 1 różnica strukturalna.

   Po mutacjach drzewo jest czyste. Skrypt: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/mut.sh`.

## Zarzuty

1. **Z2 jest sprzeczne z decyzją właściciela D-MOD-3 = B, a dokument tego nie odnotowuje.** `LEDGER.md:128` mówi: „D-MOD-3 = B: portować WSZYSTKIE istniejące modele, także nieużywane”. Operator pominął 15 funkcji `rbx*` (`robloxImprovements.ts:82-361`) z uzasadnieniem „nic ich nie wywołuje”, czyli dokładnie tym kryterium, które właściciel odrzucił. To są modele stylu `roblox`, więc D-MOD-1 ich nie wyklucza. Dla klasycznego `civ` precedens jest inny: P4-7 D-NM-17 daje D-MOD-1 pierwszeństwo, ale jawnie, z nazwanym konfliktem. Na korzyść Operatora przemawiają dwie rzeczy:
   - te funkcje nie są eksportowane, więc wektora z niezmienionego weba nie da się wygenerować;
   - komentarze `ulepszenia-modele-p3a.ts:59` i `p3b.ts:65-66` mówią „do wycofania”.

   **Wymagane:** w §1 dokumentu nazwać kolizję Z2 ↔ D-MOD-3 = B. Dalej albo przenieść te funkcje, opisując sposób weryfikacji bez zmiany weba, albo oznaczyć je jako punkt decyzyjny dla orkiestratora, np. „D-NM-17-analog”. Nie wolno ich pominąć po cichu. To samo dotyczy `addCyl` (`:49`), którego używają wyłącznie te martwe funkcje.
2. **Fałszywe twierdzenie, że D-MOD-1 jest otwarte.** Raport mówi „Przeniesienie wymaga decyzji D-MOD-1”, a dokument §1 Z1 „zostawione do decyzji (D-MOD-1)”. Tymczasem D-MOD-1 jest już ROZSTRZYGNIĘTE (tylko `roblox`, D-RR-8 = A, `LEDGER.md:123,127,128`). Wniosek, czyli pominięcie `resources.ts` i gałęzi `civ`/`minecraft`, jest poprawny, ale podstawę trzeba poprawić: przy decyzji `roblox` nic tu nie wymaga zgody właściciela. Konflikt z D-MOD-3 = B dla `resources.ts` należy podać tak jak w D-NM-17.
3. **Z6 można zmierzyć, a zostało jako NIE_ZMIERZONO.** Zmierzyłem to na tym samym bundlu (`buildImprovement(k)` z `improvements.ts`):
   - `__proto__` → wyjątek `fn is not a function`;
   - `hasOwnProperty`, `valueOf`, `__defineGetter__` → wyjątek `Cannot convert undefined or null to object`;
   - `constructor` i `toString` → pusta grupa.

   Rust w każdym z tych przypadków zwraca pustą grupę. Odchylenie jest opisane w dokumencie, ale trzeba zastąpić NIE_ZMIERZONO tym pomiarem i wskazać konkretne klucze, które w webie rzucają wyjątek. Ewentualnie dopisać przypadek do `gen.ts`, zapisując wyjątek jako dane.

## Uwagi bez zarzutu (dla orkiestratora)

- `tests/jsmath_wiring.rs` nie skanuje `src/models/improvements`, a plik jest poza allowlistą. Ręczny grep Operatora potwierdzam: jedyne trafienie to komentarz w `droga.rs:75`. To osobny temat porządkowy.
- Ocena wzrokowa ma status NIE_ZMIERZONO (brak GPU). Lista z §7 jest kompletna.

Kod i parytet bitowy sprawdziłem niezależnie i nie mam do nich zarzutów. Wszystkie 3 zarzuty dotyczą dokumentacji i zakresu: kolizji z decyzją właściciela D-MOD-3 = B oraz błędnego statusu D-MOD-1.

TESTY: jak w punktach 2, 4, 5 i 7. Wszystkie EXIT=0, 0 różnic, 11/11 mutacji zabitych.
BLOKADY: brak technicznych. Zarzut 1 może wymagać decyzji orkiestratora o zakresie, jeśli Obrona nie przeniesie `rbx*`.
NASTĘPNY KROK: Obrona/Operator r2. Poprawić §1 (Z1, Z2, Z6) dokumentu `P4-20-MOD11-IMPROVEMENTS.md` i ewentualnie przenieść `rbx*`. Potem Final Control.
