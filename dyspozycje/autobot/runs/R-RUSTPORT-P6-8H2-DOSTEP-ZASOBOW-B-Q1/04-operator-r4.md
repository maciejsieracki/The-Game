STATUS: PASS-WITH-NOTES (zarzuty FC r3 pkt 1–7 odpowiedziane; otwarte: Z7, Z7b jako NASTĘPNA-PARTIA, Z5 źródło poza allowlistą)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1
GOAL: P6.8H2 partia B, runda 4 (po FC r3 FAIL na `0b918c971`): zamknąć zarzuty 1–7; odtworzenie stanu z `2a732ce7b` (kod `0b918c971`).
ZMIANY/COMMIT:
- kod + testy + wektory + mutacje r4: `9b158a55a` (SHA kodu rundy 4).
- dokument tematu `dyspozycje/rust-port/p6/P6-8H2-DOSTEP-ZASOBOW-B.md` (przepisany) i ten raport: commit raportu (gałąź `p6-8h2-dostep-zasobow-b`, lokalnie, bez push).
- nowe pliki kodu: `rust-port/engine/src/domain/resource_access/society_inputs.rs`, `tests/p6_8h2_society_inputs.rs`. Allowlista zachowana; `Cargo.lock` usunięty.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. `isForeignReligionDominant` + `dominantReligion` portowane (`society_inputs.rs`, `9b158a55a`); test `religion_matches_pinned_web_vectors` (560 przypadków z pinu). Dokument: Z6a (pole `share` nieportowane, bo nie czyta go funkcja w zakresie).
2. PRZYJMUJĘ. Z1 zamknięte: `compute_empire_livestock_unlocks` (`livestock-unlock.ts:113`) + domyślna gałąź `resource-access.ts:307` w `collect_active_access`; właściciel przez `ResourceAccessOptions::hex_owners`/`owner_id`. Wektory: 360 przypadków `livestock: UNDEF` z mapą wlascicieli (ownerId null/A/B). Mutanty M33–M36 KILLED.
3. PRZYJMUJĘ (a, b, c). (a) `era_ui_name(1)`: mutant M44 KILLED (wektory era 0, 144 hinty „Kamień”). (b) ogonki: M37–M41 KILLED (5/5); uniwersum 51 etykiet, 2601 par z pinu (pary np. Łoś/Lusia, Ćwiek/Czar, Ęż/Ez, Ńuta/Nuta, Źrebak/Zzyk). (c) tiebreak: M42 KILLED; `pl_collation_cmp` nie używa już tiebreaku bajtowego, remis = `Equal` (web 0; 57 remisów z pinu, ZWSP i miękki myślnik ignorowane, M43 KILLED). Mutanty r3 M08/M21/M22 nadal równoważne (dowody w dokumencie).
4. PRZYJMUJĘ. Test `hex_labels_match_pinned_web_vectors_except_documented_prototype_keys` nie ma już `continue` bez asercji: dla 270 przypadków `constructor`/`__proto__` sprawdza display = null, Rust label/hint = None i że web hint to artefakt JS (`function Object()` / `[object Object]`). `__proto__` dodany do wektorów i do `is_js_prototype_key`. Źródło rozbieżności `mapgen/params.rs:1341` (`zloze_min_era_for`) pozostaje poza allowlistą (zneutralizowane guardem w `resource_access`).
5. PRZYJMUJĘ. Dokument przepisany: runda 4, SHA kodu `9b158a55a`, gałąź wskazuje commit raportu (nie samoodniesienie), sekcja „Nieśledzone” zgodna z `git`, diff-check z logu `gate-diffcheck-r4.txt` (EXIT=0, na drzewie commitu kodu).
6. ODRZUCAM część dotyczącą pustej linii. Dowód: `awk '/^EXIT=/{print prev}'` na `gate-test-full-r3.txt`, `gate-test-p6_8h2-r3.txt`, `gate-test-regression-r3.txt`: linia bezpośrednio przed `EXIT=0` ma długość 93–94 znaków (wynik `test result: …`); pusta linia jest wcześniej, jako separator wyjścia cargo między binarkami. Logi r3 nie zmienione. Logi r4 (`gate-*-r4.txt`) mają jeden `EXIT=` po ostatniej linii wyjścia, bez pustej linii.
7. PRZYJMUJĘ opis z dowodem grep (dokument, sekcja „Grep wywołujących”); Z7 i Z7b pozostają NASTĘPNA-PARTIA (lekcja nr 3). Grep: web `placedImprovementsWithZlotoTradeGrant` — jedno wywołanie `main.ts:4894` w `placedImprovementsWithTradeGrants` (main.ts:4888) z 10 miejscami wywołań (6415, 6448, 7131, 8172, 15136, 24717, 32272, 33401, 34692, 36336; poprzednio podane „9” — korekta). Rust `placed_improvements_with_zloto_trade_grant`: tylko definicja `resource_access.rs:266` i test `p6_8h_access.rs:284`. Duplikat `clear_city_culture_mix`: Rust `resource_access.rs:320` (tylko test `p6_8h_access.rs:425`) vs produkcja `state.rs:546/581`. ZAŁOŻENIE: usunięcie duplikatu i wpięcie hooka nie są robione w tej rundzie (wymagają przepięcia testów i zakresu `state.rs`/`main.ts` poza tematem); decyzja dla FC.

TESTY:
- `cargo fmt --all -- --check`: EXIT=0 (`gate-fmt-r4.txt`).
- `cargo clippy -p civ-engine --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r4.txt`; poprawka `needless_match` przed commitem).
- `p6_8h2_active_access` 11/11; `p6_8h2_capital_labels` 11/11; `p6_8h2_society_inputs` 5/5; `p6_8h_access` 13/13 (`gate-test-p6_8h2-r4.txt`, `gate-test-regression-r4.txt`).
- `cargo test -p civ-engine`: 1967 passed, 0 failed, EXIT=0 (`gate-test-full-r4.txt`; r3: 1962).
- Mutacje (`mutacje-wyniki-r4.txt`): active 44 = 41 KILLED + 3 równoważne (M08, M21, M22); society 11 = 7 KILLED + 4 równoważne (S02, S08, S10, S11, każdy z uzasadnieniem w dokumencie). Mutanty uruchomiono przed uproszczeniem `match` do `cmp` (semantycznie identyczne).
- Wektory: `gen-vectors.sh 91dc998a` (pin `91dc998a`, `gra/` nie budowane); `cases.json` md5 `6d91015f…`, `vectors.json` md5 `0b64624d…`.
- Pozostałe: `git diff --cached --check` czysto (EXIT=0).

BLOKADY:
- Z7 (`placedImprovementsWithZlotoTradeGrant` bez produkcyjnego wywołującego) — NASTĘPNA-PARTIA.
- Z7b (duplikat `clear_city_culture_mix`) — NASTĘPNA-PARTIA, decyzja FC.
- Z5 źródło `mapgen/params.rs:1341` — poza allowlistą, NASTĘPNA-PARTIA.
- Z6a (`share`) i Z6b (porządek kluczy poza BMP) — ZAŁOŻENIA, bez wpływu na wynik w zakresie.
- Z4 (`localeCompare`): ignorowane znaki ICU ograniczone do zbioru z wektorów.

ZAŁOŻENIA:
- Numer rundy: dispatch (RUNDA 3/5 w treści) i zarzuty FC r3 wskazują rundę 4; raport `04-operator-r4.md`, raporty r1/r3 nietknięte.
- Gałąź `p6-8h2-dostep-zasobow-b` lokalnie na commicie raportu (bez push); integracja to krok orkiestratora.

RUNDY: 4/5 (Operator r4)
NASTĘPNY KROK: Evaluator (Sonnet) na commicie kodu `9b158a55a` i commicie raportu; FC decyzja o Z7, Z7b i Z5.
DEPLOY/PUSH: NIE WYKONANO
