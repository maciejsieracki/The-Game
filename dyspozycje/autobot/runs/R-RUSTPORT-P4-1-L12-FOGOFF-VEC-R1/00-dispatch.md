# R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1 — korekta wektora L1/L2: riverRevealKeys przy mgle wyłączonej (dług DTO-BRIDGE, zarzut 4)

STATUS: dispatch orkiestratora. Opus (3D). Operator/Obrona/Evaluator/FC Opus. Temat renderera: bramka renderera ≥ 12 GB, bez równoległych buildów renderera.
ZALEŻNOŚĆ: brak (L1/L2 REVEAL zintegrowany w `e385625`; DTO-BRIDGE r1 w `326fd5545`).
BAZA: `origin/rust-port/parity-v2` = `326fd5545` (DODATEK r1, 2026-11-17). Przed startem: `git fetch origin && git checkout -B <gałąź> 326fd5545`.

## GOAL
Wektor `fog_off_no_reveal_awaiting` w `rust-port/renderer/tests/reveal_l12_vectors/vectors.json` (generator `reveal_l12_gen.mjs`) podaje `riverRevealKeys` przy WYŁĄCZONEJ mgle, a pin woła `setFog(ALL_KEYS, ALL_KEYS)` bez opcji (`main.ts:13506`), więc przy mgle wyłączonej klucze rzek powinny być puste/None. Adapter renderera (`view/fog.rs`) i tak je ignoruje przy mgle wyłączonej. Ustalić z pinu, co jest prawdą, i poprawić wektor oraz — jeśli trzeba — asercję testu, bez osłabiania testu.

## PIN (pin = `07d2fbd72`)
- `gra/src/main.ts:13506` (`setFog(ALL_KEYS, ALL_KEYS)` bez opcji), `main.ts:13074-13080` (`startRevealKeysForRiverFog`), `main.ts:13475-13513` (`refreshFog`).
- Generator: `rust-port/renderer/tests/reveal_l12_gen.mjs` (linia ~252 podaje klucze rzek także przy mgle wyłączonej — sprawdź, czy to odpowiada pinowi).

## ZAKRES
1. Ustal z pinu, czy przy mgle wyłączonej `riverRevealKeys` ma być puste (None), czy pełne. Zacytuj linie.
2. Popraw generator i wynik `reveal_l12_vectors/vectors.json` dla przypadku `fog_off_no_reveal_awaiting`. Wygeneruj wynik generatorem, nie ręcznie.
3. Jeśli zmienia się oczekiwanie testu `rust-port/renderer/tests/reveal_l12.rs` — dostosuj asercję do pinu i wyjaśnij w raporcie. Nie usuwaj przypadków.
4. Mutacje FAIL (przywróć kod): (a) adapter zwraca klucze przy mgle wyłączonej; (b) riverRevealKeys pominięte przy mgle włączonej; (c) reveal_all_land ignorowane.

## ALLOWLISTA
`rust-port/renderer/tests/reveal_l12_gen.mjs`, `rust-port/renderer/tests/reveal_l12_vectors/vectors.json`, `rust-port/renderer/tests/reveal_l12.rs`, `rust-port/renderer/src/view/fog.rs` (tylko komentarz/dokumentacja, bez zmiany zachowania), katalog runs. Engine i view-model: NIE.

## BRAMKI (EXIT 0)
Renderer: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test reveal_l12`, `cargo test --all-targets --no-fail-fast` (renderer; w tle z zapisem EXIT do logu). Generator: `node reveal_l12_gen.mjs --check` EXIT 0 (wymaga TYPESCRIPT_JS lub pakietu typescript).
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie orkiestratora (poza repo), usunąć po bramkach. Przed bramką pełną sprawdź dysk ≥ 12 GB; jeśli mniej — zapisz BLOCK INFRA z liczbą GB. Nie commitować `Cargo.lock`.

## KRYTERIA KOŃCA
Zielone bramki, mutacje (a)(b)(c) dają FAIL, generator zgodny z pinem. Commit jawnym `git add` z allowlisty. Bez linii `Co-Authored-By` z nazwą modelu (#289). Raport `01-operator-r1.md`: STATUS, DOMAIN, TEMAT, GOAL, ZMIANY/COMMIT, TESTY, BLOKADY, RUNDY, NASTĘPNY KROK, DEPLOY/PUSH: NIE WYKONANO. Nie pushować do parity, nie integrować.
