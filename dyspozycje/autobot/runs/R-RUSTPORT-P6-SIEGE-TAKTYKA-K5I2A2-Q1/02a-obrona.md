# 02a-obrona — R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A2-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A2-Q1
GOAL: odpowiedź na 5 zarzutów Evaluatora do kodu Operatora 3db73fa36 (branch rust-port-wip/SIEGE-TAKTYKA-K5I2A2-r4, baza a097600e1).
ZMIANY/COMMIT: brak zmian kodu w tej obronie. Kod pod obroną: 3db73fa36. Ten plik jest jedyną zmianą (commit obrony poniżej).
RUNDY: 1/5 (dispatch). Obrona Operatora Haiku 5.5, rola obrony.

Metoda: każdy zarzut sprawdzony na commicie 3db73fa36 (git show / git grep) i przez ponowne uruchomienie generatora pinu. Nie uruchamiałem cargo (dysk 6,2 GB < 8 GB z dispatchu). Gdzie nie sprawdzono, oznaczono NIE_ZMIERZONO.

---

## Zarzut 1: stałe BTERRAIN_RIVER=3 / BTERRAIN_FORD=4 zduplikowane (ryzyko konfliktu z K5I2a1)

Werdykt: PRZYJMUJĘ jako uwagę do integracji. Bez zmiany kodu w tym temacie.

Dowód:
- Wartości zgodne z pinem: `gra/src/battle/battle-terrain.ts` (pin 07d2fbd72, linie 37-46): `River = 3`, `Ford = 4`.
- W 3db73fa36 stałe występują tylko w `rust-port/engine/src/domain/siege_tactics_inputs_pos.rs` (linia 160 i sąsiednia). Nie ma duplikatu w innych plikach `rust-port/engine/src`.
- Na gałęzi `origin/rust-port-wip/SIEGE-TAKTYKA-K5I2A1-fc` (fc, stan z tego fetcha) `git grep` nie znajduje tych nazw, więc w tym stanie nie ma konfliktu nazw. Stan K5I2a1 po późniejszych commitach: NIE_ZMIERZONO.
- Dispatch zakazuje dotykania plików K5I2a1, więc unifikacja w tym temacie byłaby naruszeniem allowlisty. Unifikacja należy do integracji.

## Zarzut 2: nowe funkcje bez wołającego w kodzie produkcyjnym

Werdykt: ODRZUCAM.

Dowód:
- Dispatch wymaga: "każda funkcja ma wołającego w teście wektorowym". Spełnione: `rust-port/engine/tests/p6_siege_tactics_inputs_pos.rs` wywołuje wszystkie 7 funkcji (facing_toward, opposite_dir, relative_hit, is_ford_tile, is_shore_adjacent_to_ford, battle_unit_difficulty_combat_mult, flank_rear_defense_penalty).
- Dispatch nie wymaga podpięcia w produkcji. Allowlista `siege_tactics_blow.rs` i `siege_tactics_blow_inputs.rs` dopuszcza tylko usunięcie martwego kodu i adaptację wołających. Podpięcie do `toCombatUnit` / `_singleBlow` zmieniłoby zachowanie produkcji, czego ten temat nie obejmuje.
- Kryterium (3) "brak martwego kodu dla przeniesionych funkcji" jest spełnione dla `flank_rear_defense_penalty`: stara wersja `Option<f64>` w `siege_tactics_blow_inputs.rs` została usunięta (commit stat: `siege_tactics_blow_inputs.rs | 58 +-`), a funkcja została przeniesiona do nowego modułu z wektorami z `combat.ts` 589-606 (generator, linia `flankRear`).
- Funkcje są `pub` w module biblioteki, więc nie wchodzą w `dead_code`. Wynik `clippy -D warnings` podał Operator (EXIT 0). NIE_ZMIERZONO przeze mnie.
- Wiring do `_singleBlow` to zależność dla kolejnego klocka i jest opisany w raporcie, nie jest brakiem w tym temacie.

## Zarzut 3: nazwa raportu 01-operator-r4.md zamiast 01-operator-r1.md, rundy 4/5 vs 1/5

Werdykt: PRZYJMUJĘ (formalne). Bez zmiany commita Operatora.

Dowód: commit 3db73fa36 zawiera `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A2-Q1/01-operator-r4.md`. Dispatch wskazuje `01-operator-r1.md` i rundę 1/5. Liczba 4/5 w nagłówku nie pasuje do tego ID.

Poprawka do wykonania w następnej rundzie Operatora (lub przy integracji): zmiana nazwy na `01-operator-r1.md` i nagłówka na `RUNDY: 1/5`. Rewrite commita Operatora nie był częścią tej obrony.

## Zarzut 4: funkcja `at()` poza mapą zwraca Plains; test podstawia 0

Werdykt: PRZYJMUJĘ zakres, ODRZUCAM wniosek, że parytet funkcji nie jest dowiedziony.

Dowód:
- W teście wektorowym `at` to `cells.get(...).unwrap_or(&0)`. Wartość 0 to `BTerrain.Plains = 0` z pinu (`battle-terrain.ts` 37-46). Wartość 0 nie jest więc losowym zastępstwem.
- Generator (`p6_siege_tactics_inputs_pos_gen.mjs`, funkcja `tmStub`) zwraca dla brakujących kafli `BTerrain.Plains` z wykonanego tekstu pinu. Wektory obejmują sąsiedztwo poza zapisanymi kaflami, więc są zgodne z pinem także dla takich przypadków.
- PRZYJMUJĘ: samo zachowanie `BattleTerrainMap.at` poza mapą w pinie nie jest dowiedzione w tym temacie. NIE_ZMIERZONO (nie czytałem implementacji `at` w pinie, tylko deklarację interfejsu w linii 55). Ta odpowiedzialność należy do dostawcy mapy (K5I2a1), zgodnie z komentarzem w module.

## Zarzut 5: brak #[ignore] i osłabień, bramki zielone, generatory dają identyczne wektory

Werdykt: PRZYJMUJĘ jako potwierdzenie, z dowodem dla generatora. Bramki cargo NIE_ZMIERZONO.

Dowód (ponowne uruchomienie generatora z commita 3db73fa36):
- Node v22.23.4, skrypt `p6_siege_tactics_inputs_pos_gen.mjs` uruchomiony w katalogu poza `tests/` (repoRoot = worktree).
- Wynik: `wrote 1542 cases`, rozkład: facingToward 230, oppositeDir 160, relativeHit 312, isFordTile 160, isShoreAdjacentToFord 300, battleUnitDifficultyCombatMult 120, flankRearDefensePenalty 260.
- `fragmentSha256 = eca0a8248dd6d47d14834331fb0f13c181736fcfa3750f3d2c2dda1e8c771ada`, zgodny ze strażnikiem w generatorze.
- `cmp` z `vectors.json` z commita 3db73fa36: identyczne bajty.
- Spy `engaged.add`: generator (linie 149-153) liczy wywołania z tekstu pinu. Test blow (linie 222-242) porównuje `engaged_add` z tym szpiegiem. Obie gałęzie (true i false) są asertowane (linia 324).
- Nie sprawdzałem: `#[ignore]` ani osłabionych asercji w całym repo; fmt, clippy, cargo test (NIE_ZMIERZONO).

---

## Podsumowanie

- Kod: bez zmian w tej obronie. Kod pod obroną: 3db73fa36.
- Przyjęte: zarzut 1 (uwaga do integracji), zarzut 3 (formalne, do poprawy w następnej rundzie Operatora), zarzut 4 w zakresie (at poza mapą to K5I2a1), zarzut 5 (potwierdzony dla generatora).
- Odrzucone: zarzut 2 (dispatch nie wymaga wołającego w produkcji; wiring jest poza allowlistą), zarzut 4 w części o parytet funkcji (wektory są zgodne z pinem).
- NIE_ZMIERZONO: cargo fmt / clippy / test, #[ignore], stan K5I2a1 poza fc.

NASTĘPNY KROK: Evaluator r2 (bez nowej rundy kodu), chyba że orkiestrator zdecyduje o poprawce formalnej zarzutu 3 przed integracją.
DEPLOY/PUSH: NIE WYKONANO
