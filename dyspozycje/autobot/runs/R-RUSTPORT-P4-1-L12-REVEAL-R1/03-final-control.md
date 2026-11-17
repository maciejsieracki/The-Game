# R-RUSTPORT-P4-1-L12-REVEAL-R1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (port Rust, warstwa widoku/renderera)
TEMAT: R-RUSTPORT-P4-1-L12-REVEAL-R1
GOAL: `revealAllLand` i `riverRevealKeys` wyprowadzone do DTO mapy, z adapterem w rendererze i wektorami z pinu `07d2fbd72`.
ZMIANY/COMMIT: kod `06f3b6ce1` (Operator), raport `52571418e`, obrona `2916510a7`; ten raport jest commitem na `fc-l12` (rodzic `2916510a7`). Raport Evaluatora `02-evaluator.md` leży osobno w `b900a3764` (rodzic `52571418e`, gałąź `eval-l12`) i trzeba go dołączyć przy integracji.
TESTY: odtworzone samodzielnie, wyniki niżej.
BLOKADY: brak w zakresie tematu. Poza zakresem: producent i wołający produkcyjny (uwaga N1).
RUNDY: 1/5
NASTĘPNY KROK: integracja przez orkiestratora (FF `parity-v2` z `1db08c170` do SHA FC, plus `02-evaluator.md`), wpisy w REJESTR-RUST.md (N1–N3).
DEPLOY/PUSH: NIE WYKONANO

## Ancestry i zakres
- `git merge-base --is-ancestor 1db08c170 2916510a7`: OK. Liniowo: `06f3b6ce1` → `52571418e` → `2916510a7`.
- `git diff --stat 1db08c170 2916510a7`: 8 plików, wszystkie w allowliście:
  `view-model/src/map.rs` (+40, sam typ `FogRevealDto`), `renderer/src/view/fog.rs`, `renderer/src/view/terrain.rs` (tylko komentarze), `renderer/tests/reveal_l12.rs`, `renderer/tests/reveal_l12_gen.mjs`, `renderer/tests/reveal_l12_vectors/vectors.json` (wyjście generatora), katalog runs (01, 02a).
- Brak `Cargo.lock`, brak `gra/`. `git diff --check` czysto.
- Trailery: brak `Co-Authored-By` z nazwą modelu we wszystkich 3 commitach. Jest tylko `Claude-Session`, zgodnie z #289.

## Bramki (FC, na `2916510a7`, CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach)
| Bramka | view-model | renderer |
|---|---|---|
| `cargo fmt --check` | EXIT 0 | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 | EXIT 0 |
| `cargo test --test reveal_l12` | — | EXIT 0, 7/7 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0, 109 passed, 0 failed | EXIT 0, 80 zestawów, 687 passed, 0 failed |
| generator `node reveal_l12_gen.mjs --check` (bez `TYPESCRIPT_JS`) | EXIT 0, 28 scenariuszy | |

## Mutacje (FC, własne uruchomienie na `fog.rs`, plik przywrócony i sprawdzony `cmp`)
- (a) `land_reveal: false` zamiast `dto.reveal_all_land`: FAIL (2/7 testów).
- (b) `river_reveal_keys` zawsze pusty zbiór: FAIL (1/7).
- (c) wyłączona kontrola widoku `revealAllLand` (akceptacja kopii `explored`): FAIL (2/7).

## Weryfikacja pinu (sporny pkt 2 dispatchu)
- `scene.ts:1263-1264` (pin `07d2fbd72`) to JSDoc: „hex.rzeka.krawedzie zostaje dla logiki gry; render idzie po pełnej ścieżce”. Nie jest źródłem kluczy.
- `main.ts:13074-13080` `startRevealKeysForRiverFog()` → `computeVisibleAt(meStart, startRevealRadius)` przy `isAwaitingFirstPlayerCity()`, w przeciwnym razie `undefined`. `main.ts:13493` przekazuje to jako `riverRevealKeys`.
- `main.ts:13506`: gałąź bez mgły `setFog(ALL_KEYS, ALL_KEYS)` bez opcji.
Implementacja jest zgodna z pinem. Dispatch był w tym punkcie błędny. Zasada 11 (najpierw web) rozstrzyga na korzyść pinu.

## Orzeczenia zarzutów
| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | Brak producenta w engine i wołającego produkcyjnego | ODDAL (uwaga N1 dla orkiestratora) | engine, `root.rs`, fikstury i `lib.rs` są poza allowlistą dispatchu. Operator zgłosił to jawnie. Wpięcie to osobny temat (proponowane `R-RUSTPORT-P4-1-L12-REVEAL-WIRE` w ramach #364 DTO-BRIDGE). |
| 2 | Osobny `FogRevealDto` zamiast pól w `MapViewDto`/`FogViewDto` | ODDAL (uwaga N2) | Dispatch mówi „pola do DTO mapy (view-model)” i allowlista daje `map.rs`. Typ w `map.rs` to spełnia. `MapViewDto` jest statyczny (D-DTO-3), a dodanie pola do `FogViewDto` złamałoby 9 konstruktorów poza allowlistą. To decyzja techniczna, którą orkiestrator wpisuje do REJESTR-RUST.md. |
| 3 | Pkt 2 dispatchu (`rzeka_krawedzie`) sprzeczny z pinem | ODDAL jako wada Operatora (uwaga N3) | Sprawdzone w pinie, patrz wyżej. Korekta dispatchu/rejestru należy do orkiestratora. |
| 4 | Mutacja (c) sprawdzana tylko na adapterze | ODDAL | Skutek N1, bo producenta nie ma w zakresie. Sprawdzenie na producencie (`fogCodes`) przechodzi do tematu WIRE. |
| 5 | Doc-komentarz „whatever the DTO carries” | ODDAL (naprawione w obronie) | `2916510a7`: komentarz mówi teraz o `false`/`None` i odrzuceniu `reveal_all_land` (pin `main.ts:13506`). Kod bez zmian. |
| 6 | `vectors.json` i `terrain.rs` a allowlista | ODDAL | `vectors.json` to wyjście generatora z allowlisty. `terrain.rs` to adapter w `renderer/src/view/` i ma tylko zmiany komentarzy. |
| 7 | Twarda ścieżka `/opt/node22` TypeScriptu | ODDAL (naprawione w obronie) | Kolejność: `TYPESCRIPT_JS`, potem `require.resolve`, potem `npm root -g`. FC uruchomił `--check` bez zmiennej i dostał EXIT 0. |

Liczba NAPRAW: 0. Liczba DO DECYZJI CZŁOWIEKA: 0. To decyzje techniczne orkiestratora wg zasady 8/9, bez kwestii gameplay.

## Uwagi dla orkiestratora (nie blokują)
- N1: nadać ID wpięcia (producent `FogRevealDto` w engine z `startRevealKeysForRiverFog` przez `compute_visible_at` przy `isAwaitingFirstPlayerCity` dla `ME()`, pole w `RenderLayersDto`, wywołanie `FogReveal::from_dto` w kodzie produkcyjnym, mutacja (c) na `fogCodes` producenta). Do tego czasu w rejestrze: „typ + adapter, wołany tylko w testach”, nie ZINTEGROWANE produkcyjnie.
- N2: wpis Z-L12-1 (osobny `FogRevealDto`) w REJESTR-RUST.md. Gotowy tekst jest w `02a-obrona.md`.
- N3: korekta w dispatchu/rejestrze: źródłem `riverRevealKeys` jest `startRevealKeysForRiverFog()` (`main.ts:13074-13080`), nie `rzeka_krawedzie`.
- Przy integracji dołączyć `02-evaluator.md` z `b900a3764` (cherry-pick albo merge, bo leży na równoległej gałęzi od `52571418e`).
