# R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1 — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1
GOAL: zasięgi terytorium w adapterze nakładek (`TerritoryRangesDto`), zgodne z webem (pin `07d2fbd72`).
ZMIANY/COMMIT: oceniany commit Operatora `0f683d9cc` (rodzic `82db9b370` = baza z dispatchu, `merge-base --is-ancestor` OK). Ten raport to jedyna zmiana Evaluatora (gałąź `rust-port-wip/p4-1f2-territory-ranges-r1-eval`, bez push).
TESTY: odtworzone samodzielnie, wyniki niżej.
BLOKADY: brak blokujących; zarzuty 1–6 niżej (uwagi dla FC i orkiestratora).
RUNDY: 1/5
NASTĘPNY KROK: Obrona / Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## Bramki odtworzone (CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR w scratchpadzie poza repo, usunięty po bramkach; dysk 16 GB wolne przed bramką pełną, bez równoległych buildów)

| Bramka | Kod wyjścia / wynik |
|---|---|
| `cargo fmt --check` view-model | EXIT 0 |
| `cargo fmt --check` renderer | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` view-model | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` renderer | EXIT 0 |
| `cargo test --lib` view-model | EXIT 0 (0 testów w lib) |
| `cargo test --all-targets --no-fail-fast` view-model | EXIT 0, 0 failed |
| `cargo test --test territory_ranges_f2` renderer | EXIT 0, 8 passed, 0 failed, 0 ignored |
| `cargo test --all-targets --no-fail-fast` renderer | EXIT 0; 79 binarek, 680 passed, 0 failed, 0 ignored |
| `node rust-port/renderer/tests/territory_ranges_f2_gen.mjs --check` | EXIT 0, „vectors.json matches the pin” |

`Cargo.lock` zmieniony przez build lokalnie — przywrócony (`git checkout --`), nie commitowany. Commit Operatora nie zawiera `Cargo.lock`.

## Sprawdzenia

- Allowlista: `view-model/src/{lib.rs,territory_ranges_view.rs}`, `renderer/src/view/overlays.rs`, `renderer/tests/territory_ranges_f2.rs`, generator `.mjs`, katalog runs — zgodne. Poza literą allowlisty: `renderer/tests/territory_ranges_f2_vectors/vectors.json` (zarzut 4).
- Brak `#[ignore]`, brak osłabionych asercji (porównania `assert_eq!` całych wektorów, krawędź po krawędzi, klucze `toFixed(5)`).
- Wektory z pinu, nie ręczne: generator transpiluje (TypeScript `transpileModule`) całe pliki `territory.ts`, `range-hexes.ts`, `territory-border.ts`, `hexutil.ts` oraz wycinki `okolica.ts:37-50` i `main.ts:15593-15601` wprost z `git show 07d2fbd72:…`, z SHA-256 w `sources`; `--check` przeszedł. Ścieżka indeksu `territoryOwnerLookup` (≥ 12 węzłów) jest wykonana na pinie.
- Port vs pin przeczytany linia w linię: `territoryOwnerAt` (`territory.ts:122-160`; rozstrzyganie fortów `bestFortOwner !== null && o && bestFortOrder`, miasta przed fortami), `cityRangeForPopulation` (`okolica.ts:46-50`, `Number.isFinite`/`Math.floor`/`pop <= 0`), filtr `isMe(ownerId)` → `!fogOn` → `visible ∪ explored` (`main.ts:15596-15600`, `isMe` = `ownerId === ME()` `:13748-13750`), kolejność wstawiania `Map` właścicieli, `collectTerritoryBoundaryEdges` (`territory-border.ts:76-111`, rogi `(i+1)%6`,`(i+2)%6`). Zgodne.
- Mutacje dispatchu powtórzone niezależnie: (b) brak filtru mgły (`if !self.fog_on` → `if true`) → FAIL 2 testów; (b') `isMe` wyłączone → FAIL 3 testów. (a) pokryta przez test negatywny adaptera i `borders_match_pin` (krawędź wewnętrzna/brakująca → błąd).
- Mutacje dodatkowe Evaluatora (skrypt w scratchpadzie, plik przywrócony i porównany `cmp`):

| Mutacja | Wynik |
|---|---|
| remis miast `dist < d` → `<=` (wygrywa ostatni) | FAIL (2) |
| gałąź `order` fortów wyłączona | FAIL (2) |
| `o.turn < b.turn` → `>` | FAIL (2) |
| fort odległość `<` → `<=` | FAIL (2) |
| fort przed miastem | FAIL (2) |
| `pop <= 0` → `pop < 0` | FAIL (2) |
| **`o.seq < b.seq` → `<=`** | **PRZEŻYWA (8 passed)** |
| **`population.floor()` → `.round()`** | **PRZEŻYWA (8 passed)** |

## Zarzuty (ponumerowane)

1. **Luka wektorów — `Math.floor` populacji.** Jedyna niecałkowita populacja w wektorach to 2.9 (→ 5 przy floor i przy round). Mutant `round` przeżywa. Brak przypadku `pop ∈ (0,1)` (floor → 0 → promień 0, round → 1 → promień 5) i niecałkowitej populacji powyżej `CITY_RANGE_MIN` (np. 7.6 → 7 vs 8). Do dodania scenariusz w generatorze (nie wymaga zmiany kodu produkcyjnego).
2. **Luka wektorów — remis `seq` przy równym `turn`.** Mutant `o.seq <= b.seq` przeżywa: brak dwóch fortów/posterunków o tym samym `turn` i `seq` w sporze o heks (pin: wygrywa pierwszy w tablicy). Przypadek rzadki w grze, ale gałąź jest jawnie portowana.
3. **Zakres GOAL p.1 „z `PlayableState`” niespełniony; brak wołającego produkcyjnego.** Producent przyjmuje jawne wejścia (D-F2-1), `territory_ranges_dto` woła tylko test. Uzasadnienie techniczne poprawne (view-model zależy tylko od `serde`; producenci z `PlayableState` żyją w `engine/src/domain/*_view.rs`, poza allowlistą) i ujawnione przez Operatora; dispatch był wewnętrznie sprzeczny (wskazał `overlays_view.rs`, który jest w `engine/`). Wymaga jawnej zależności do tematu DTO-BRIDGE/FOG-WIRE w rejestrze.
4. **Katalog wektorów poza literą allowlisty** (`renderer/tests/territory_ranges_f2_vectors/vectors.json`). Konieczny artefakt generatora (precedens G5), zgłoszony jawnie — do zatwierdzenia przez orkiestratora.
5. **Trzecia kopia `territoryOwnerAt`/`cityRangeForPopulation`/`collectTerritoryHexKeysByOwner`.** Silnik ma już porty: `engine/src/domain/territory.rs:229` (`territory_owner_at`, `order` jako `i64`), `:469` (`collect_territory_hex_keys_by_owner`, `BTreeMap`/`BTreeSet` — kolejność sortowana, nie kolejność wstawiania jak w webie), `engine/src/domain/terrain.rs:251/273`, oraz `trade.rs:589`. Nowa kopia w view-model (`order` jako `f64`, kolejność wstawiania — tu zgodna z webem lepiej niż silnik) grozi dryfem reguły. Przy wpięciu (zarzut 3) jedna z kopii powinna zostać źródłem prawdy, a druga sprawdzona testem równoważności. Decyzja techniczna do REJESTR-RUST.
6. **Trailer commitu z nazwą modelu** (`Co-Authored-By: Claude Opus 5.5`) wbrew kryterium końca dispatchu (#289). Operator ujawnił konflikt z regułą atrybucji sesji; do rozstrzygnięcia przez orkiestratora przy integracji (kod niezależny).

Drobne (bez wpływu na werdykt): przypadek pustego `by_owner` (web `byOwner.size === 0` → brak grupy) nie ma scenariusza w F2 — obsługuje go istniejący `territory_border_group` (`if by_owner.is_empty() { return Ok(None) }`); view-model nie ma własnych testów jednostkowych modułu (pokrycie w crate renderer).

## Werdykt

PASS-WITH-NOTES: bramki EXIT 0 odtworzone, port zgodny z pinem, wektory wykonywane z pinu, mutacje dispatchu (a)/(b) dają FAIL. Zarzuty 1–2 to luki pokrycia (dwa przeżywające mutanty) — zalecane uzupełnienie wektorów w rundzie poprawkowej lub jako dług; 3–6 wymagają decyzji/wpisu orkiestratora.
