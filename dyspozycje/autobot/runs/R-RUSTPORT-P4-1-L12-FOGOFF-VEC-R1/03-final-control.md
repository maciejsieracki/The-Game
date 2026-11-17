# R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1 — Final Control r1

STATUS: PASS-WITH-NOTES (warunek integracji: pełna bramka renderera, zarzut 1)
DOMAIN: GAME (port Rust, renderer)
TEMAT: R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1
GOAL: wektor `fog_off_no_reveal_awaiting` zgodny z pinem: przy wyłączonej mgle `riverRevealKeys = null`, a test nie jest słabszy.
ZMIANY/COMMIT: FC nie zmieniało kodu. Ocenione SHA: kod `52922b7aa` (generator, zarzut 3 obrony) na `cf6a09552` (Rust, wektor, test), raport obrony `d82aaf5e5`. Ancestry: `326fd5545` (baza z dispatchu) jest przodkiem `d82aaf5e5` (`git merge-base --is-ancestor` → OK). Ten raport jest commitowany na gałęzi `fc/R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1` (rodzic `d82aaf5e5`).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Pin (sprawdzone samodzielnie, `git show 07d2fbd72`)
- `gra/src/main.ts:13485` `const useFogRender = fogOn || revealAllLand;`
- `main.ts:13489-13493`: przy `useFogRender` wołane jest `setFog(vis, exploredForRender, { landReveal: revealAllLand, riverRevealKeys: startRevealKeysForRiverFog() })`.
- `main.ts:13505-13506`: w przeciwnym razie wołane jest `setFog(ALL_KEYS, ALL_KEYS);`, bez opcji.
- `gra/src/render/scene.ts:3531` `lastRiverRevealKeys = opts?.riverRevealKeys ?? null;`
Wniosek: przy wyłączonej mgle wartość ma być `null`/`None`. Wektor i generator są zgodne z pinem.

## Allowlista (sprawdzona samodzielnie)
`git diff --stat 326fd5545 d82aaf5e5` zmienia tylko te pliki: `reveal_l12_gen.mjs`, `reveal_l12_vectors/vectors.json`, `reveal_l12.rs`, `src/view/fog.rs` (tylko komentarz doc, 3 linie) i raporty w katalogu runs. Engine i view-model nie są ruszane. Diff `vectors.json` dotyczy tylko `fog_off_no_reveal_awaiting.reveal.riverRevealKeys` (lista → `null`). `vectors.json` czyta tylko `tests/reveal_l12.rs` (`git grep`). `git diff --check` jest czysty. W commitach nie ma linii `Co-Authored-By`. `Cargo.lock` nie jest commitowany (build go zmienił, przywróciłem przez `git checkout`).

## Bramki (uruchomione samodzielnie na `d82aaf5e5`, CARGO_TARGET_DIR w scratchpadzie, potem usunięty)
| Bramka | Wynik |
|---|---|
| `node reveal_l12_gen.mjs --check` | EXIT 0 (28 scenariuszy) |
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test reveal_l12` | EXIT 0 (7/7, 0 ignored) |
| `cargo test --lib` | EXIT 0 (111 passed) |
| `cargo test --all-targets --no-fail-fast` | NIE URUCHOMIONO: BLOCK INFRA. Wolne 5,7–6,1 GB, próg z dispatchu to 12 GB. W tle działały dwa obce `cargo test` engine (PID 10224 w `wf_414119d0-497-2`, PID 25280 w `wf_1dce648f-896-2`) |

Target renderera zajmował 202 MB, tyle samo, ile zmierzył Evaluator.

## Czułość (mutacje FC, każda przywrócona, `cmp` OK)
- (a) adapter zwraca klucze przy wyłączonej mgle (`fog.rs:204`) → EXIT 101, FAIL `fog_off_drops_the_river_keys`.
- (b) `river_reveal_keys` pominięte przy włączonej mgle (`fog.rs:217`) → EXIT 101, FAIL `reveal_matches_pinned_web_vectors` i `empty_river_keys_stay_distinct_from_none`.
- (c) `reveal_all_land` ignorowane (`fog.rs:207` i `216`) → EXIT 101, FAIL `reveal_matches_pinned_web_vectors` i `reveal_requires_every_non_sea_hex_explored`.
- Stary `vectors.json` (z `326fd5545`) z nowym testem → EXIT 101 na `reveal_l12.rs:122` (nowa asercja None przy `!fogActive`).

## Orzeczenia zarzutów Evaluatora
1. [INFRA] Brak pełnej bramki renderera. **DO DECYZJI CZŁOWIEKA (orkiestratora).** To nie jest wada pracy, więc nie ma czego naprawiać. Dispatch każe przy < 12 GB wpisać BLOCK INFRA, a FC zmierzyło 5,7–6,1 GB. Warunek integracji: przed FF parity orkiestrator uruchamia `cargo test --all-targets --no-fail-fast` (renderer) na `52922b7aa`/`d82aaf5e5` i dostaje EXIT 0. Ryzyko jest niskie: zmiana dotyka tylko `tests/reveal_l12.rs`, jego wektora i komentarza doc w `fog.rs`, a `--lib` i `reveal_l12` są zielone.
2. [UWAGA] Próg 12 GB przy targecie 202 MB. **DO DECYZJI CZŁOWIEKA (orkiestratora, decyzja techniczna).** FC nie zmienia progu z dispatchu.
3. [NISKI] Ręczna gałąź `useFogRender` w generatorze. **ODDAL.** Obrona przyjęła zarzut i poprawiła go w `52922b7aa`: wartość pochodzi teraz z wykonanego `scene.lastRiverRevealKeys`. `gen --check` daje EXIT 0, a `vectors.json` jest bez zmian.
4. [NISKI] Mutację (a) łapie tylko test ręczny. **ODDAL.** Wynika to z pinu, bo przy wyłączonej mgle wektor ma z definicji `null`. Test ręczny łapie mutację (zweryfikowane).
5. [NISKI] Dokumentacja `view-model/src/map.rs:232-252` jest poza allowlistą. **ODDAL** w tym temacie. Kandydat na osobny dług dokumentacyjny (orkiestrator).

Żadnego zarzutu nie orzeczono jako NAPRAW.

BLOKADY: pełna bramka renderera (INFRA, dysk < 12 GB). Jest warunkiem integracji, nie wadą pracy.
NASTĘPNY KROK: orkiestrator uruchamia pełną bramkę renderera na `d82aaf5e5` przy wolnym dysku. Jeśli da EXIT 0: integracja (FF parity-v2), `refs/keep/R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1-fc` i ewentualny dług dokumentacyjny `FogRevealDto::river_reveal_keys`.
