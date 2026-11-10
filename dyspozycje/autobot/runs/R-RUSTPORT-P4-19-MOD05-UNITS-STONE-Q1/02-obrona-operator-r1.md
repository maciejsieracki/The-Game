STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1
GOAL: Paczka MOD-05 (10/10 rekordów Kamienia) w Rust, bitowo 1:1 z webem `edb8fb56`, stuby `NotYetPorted` MOD-05 zastąpione bez zmiany publicznych sygnatur `unit_core`, bez nowego typu drzewa, D-MOD-9=A zachowane.
ROLA: Operator — obrona po ocenie Evaluatora (zarzuty 1–7).
ZMIANY/COMMIT: baza = commit Operatora `79a45683` (rodzic `bf59164b`); poprawki obrony w commicie potomnym (SHA w raporcie zwrotnym, `git log -1`).
RUNDY: 1/5 (obrona w ramach rundy 1)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

| # | Zarzut | Werdykt | Poprawka / dowód |
|---|---|---|---|
| 1 | Zmiana testów P4.13 poza allowlistą | **ODRZUCAM jako wadę wykonania; pozostaje jawne ODCHYLENIE do akceptacji orkiestratora** | Dispatch nakazuje, by routing nie zwracał już `NotYetPorted` dla MOD-05, a `tests/unit_core_web_parity.rs` (baza `bf59164b`) twardo wymagał `pending.len() == 7` i listy 6 stubów MOD-05 w `expected_pending`; `tests/unit_core_model_rule.rs` wymagał `compared_records == 12`. Spełnienie GOAL bez dotknięcia tych asercji jest niemożliwe (sprzeczność dispatchu). Diff `git diff bf59164b 79a45683 -- rust-port/renderer/tests/unit_core_*.rs` zmienia wyłącznie liczniki/listę stubów (−6 linii stubów, 3 asercje), bez osłabienia porównań — przeciwnie: 6 przypadków więcej jest teraz porównywanych bitowo (61→67), 20 rekordów więcej (12→32). |
| 2 | `Prim::Kamien` w `unit_core/model.rs`, zmiana publicznego API, cykl modułów | **ODRZUCAM (z dowodem), zmiana wymuszona** | (a) Dispatch: typ drzewa = `unit_core::model::UnitModel`, nie dodawać nowego. Węzeł mesh przechowuje `Geo` = `Part`/`Horse`/`Prim`; żaden wariant `Prim` nie opisuje `BufferGeometry` taper/Nguni ani `CircleGeometry` (`model.rs:62-155`), więc bez nowego wariantu geometrii tych 56 meshów (32 `BufferGeometry` + 24 `CircleGeometry` w fixturze) nie da się umieścić w drzewie. Jedyną alternatywą byłby nowy typ drzewa — zabroniony. (b) „Publiczne sygnatury”: `git diff bf59164b -- rust-port/renderer/src/models/unit_core \| grep -E '^[-+].*pub (const )?fn'` → pusto po poprawce zarzutu 3 (żadna sygnatura funkcji nie zmieniona ani dodana). Dodanie wariantu jest addytywne; w repo nie ma konsumenta `civ-renderer` poza samym crate (`git grep -ln 'civ-renderer\|civ_renderer' -- '*Cargo.toml' '*.rs' \| grep -v '^rust-port/renderer/'` → pusto), więc nikt nie traci kompilacji. (c) Cykl `unit_core` ↔ `units_kamien` to odwołanie między modułami jednego crate (legalne w Rust, bez cyklu crate'ów); identyczny wzorzec istnieje już dla stubów kierujących z `registry.rs` do kolejnych paczek. Zgłoszone przez Operatora jako ZAŁOŻENIE Z2. |
| 3 | Nowa publiczna `is_ported`, zmiana semantyki `pending()` | **PRZYJMUJĘ (część `is_ported`) / ODRZUCAM (część `pending`)** | `is_ported` zmieniona na prywatną `const fn` (`registry.rs`), nikt poza modułem jej nie używa (`grep -rn is_ported src tests`). `pending()` zachowuje kontrakt „buildery czekające na swoją paczkę” — zmieniła się zawartość, bo MOD-05 przestała czekać; to dokładnie efekt zastąpienia stubów wymagany przez dispatch. |
| 4 | Druga implementacja `asin` (`js_asin` w `units_kamien/kit.rs`) | **ODRZUCAM jako wadę tej paczki; rekomendacja osobnego tematu podtrzymana** | `jsmath` jest poza allowlistą; ani baza `bf59164b`, ani aktualne `origin/rust-port/parity-v2` = `e1d69078` (po P4.18) nie mają `asin` w `jsmath` (`git grep -n 'fn js_asin\|fn asin' origin/rust-port/parity-v2 -- rust-port/renderer/src` → pusto). Nie jest więc duplikatem istniejącej funkcji, tylko jedyną implementacją, w złym module. Przeniesienie = temat orkiestratora (allowlista `src/jsmath*`), test `asin_matches_v8` (5 027 próbek V8) idzie razem z nią. |
| 5 | Brak osobnego pliku sha256 | **PRZYJMUJĘ** | Dodany `rust-port/renderer/tests/fixtures/units_kamien/units_kamien.json.sha256` (`29c9793a2a395b7ca7a4989c14282c76dda339dfa597630a0fa723137f11569a  units_kamien.json`); `sha256sum -c` → OK, EXIT=0 (`logi/obrona-r1/sha256.txt`). |
| 6 | `geo.type` nieporównywany | **PRZYJMUJĘ** | `tests/units_kamien_web_parity.rs`: nowa funkcja `three_type(&Prim)` (wyczerpujący `match`, nowy wariant `Prim` wymusi mapowanie) i porównanie `{tag}.geo.type` dla każdego mesha. Wartości: 153 056 → 156 496 (+3 440 = liczba meshów w fixturze: Box 2864, Cylinder 440, Cone 80, Buffer 32, Circle 24), 0 rozbieżności. Mutant (Circle→"BufferGeometry", `mutate-obrona-r1.sh`) → 24 rozbieżności, EXIT=101 (`logi/obrona-r1/mutate-geo-type.txt`). |
| 7 | Wygląd 1:1 NIE_ZMIERZONO | **ODRZUCAM jako wadę** | Dispatch wprost: „Ocena wizualna 1:1 wymaga GPU — oznacz jako NIE_ZMIERZONO … dołącz listę”; lista jest w `P4-19-MOD05-UNITS-STONE.md` §9. Status pozostaje NIE_ZMIERZONO dla właściciela. |

## Bramki po poprawkach (surowe logi `logi/obrona-r1/`, skrypt `gates-obrona-r1.sh`)

- `cargo fmt --all -- --check` → EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings` → EXIT=0
- `cargo clippy --locked --all-targets --features gpu -- -D warnings` → EXIT=0
- `cargo test --locked --all-targets -- --nocapture` → EXIT=0; `units_kamien parity: 40 cases (fn 20 / unit PL 10 / unit EN 10), 156496 values bit-exact checked, 0 mismatches`
- `sha256sum -c units_kamien.json.sha256` → OK, EXIT=0

## Zakres zmian obrony

`rust-port/renderer/src/models/unit_core/registry.rs` (tylko widoczność `is_ported`), `rust-port/renderer/tests/units_kamien_web_parity.rs`, `rust-port/renderer/tests/fixtures/units_kamien/units_kamien.json.sha256`, `dyspozycje/rust-port/p4/P4-19-MOD05-UNITS-STONE.md` (§11), ten katalog runu. Bez zmian: `gra/**`, `src-tauri/**`, `engine/**`, `src/{geom,pick,assets,camera,terrain}/**`, `jsmath`, `Cargo.*`, logi Operatora r1.

NASTĘPNY KROK: Final Control → integracja orkiestratora (akceptacja odchyleń 1 i 2; osobny temat: `js_asin` → `jsmath`).
