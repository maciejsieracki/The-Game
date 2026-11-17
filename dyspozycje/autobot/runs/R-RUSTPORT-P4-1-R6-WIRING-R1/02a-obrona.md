# R-RUSTPORT-P4-1-R6-WIRING-R1 — obrona Operatora, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME=nie (renderer, wpięcie adaptera miast; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1-R6-WIRING-R1
GOAL: `RevoltRenderer::sync` wołany przez adapter miast po `CityRenderer::sync` z tym samym `cities[]` (pin `render/cities.ts:541,551,586,597-599`).
ZMIANY/COMMIT: kod obrony `139ad0b87d8036a7ec69710d15cc1ff87eca6270` (rodzic `ec8d76bf3` = raport Operatora r1, kod r1 `d5a495640`, baza `26e3666bd`).
Gałąź lokalna `rust-port-wip/R-RUSTPORT-P4-1-R6-WIRING-R1-obr1` (bez push). Diff obrony: `src/view/cities.rs` (+12/-6), `tests/revolt_wiring_r6.rs` (+51/-1); tylko allowlista, bez `Cargo.lock`.

## Odpowiedzi na zarzuty Evaluatora (02-evaluator.md, 7226b6556)

### Zarzut 1 — brak wołającego poza crate'em; rejestr ma mówić „wpięte w adapter”, nie „wołane w grze” — PRZYJMUJĘ
- Dowód braku wołającego: `grep -rn "sync_revolt\|CityInputs" rust-port --include=*.rs` poza `renderer/src/view/cities.rs`,
  `renderer/tests/` i reeksportem `renderer/src/view.rs:32` daje zero trafień w aplikacji/bridge. `CityInputs::sync` też nie ma wołającego w aplikacji.
- Poprawka: w doc-komentarzu `CityInputs::sync_revolt` dopisano jawnie: „Wired at the adapter level only: no app / bridge caller yet, it depends on the engine -> renderer DTO path (audit L6)”.
- Zapis do rejestru (dla orkiestratora): R6 = **wpięte w adapter (`CityInputs::sync_revolt` / `sync_with_revolt`), NIE wołane w grze**;
  zależność od tematu drogi DTO engine → renderer (audyt L6, zadanie #308). Raport Operatora r1 nie mówił, że R6 jest wołane w grze; teraz to jest napisane wprost.

### Zarzut 2 — kolejność sync → sync_revolt tylko udokumentowana — PRZYJMUJĘ
- Poprawka: nowa metoda `CityInputs::sync_with_revolt(&self, cities: &mut CityRenderer, revolt: &mut RevoltRenderer)`,
  która woła `self.sync(cities)` i potem `self.sync_revolt(revolt, cities)`. Odpowiada to jednemu wywołaniu `cityRenderer.sync(...)` w webie,
  w którym `_syncRevolt` działa wewnątrz `sync`, więc kolejności nie da się odwrócić. `sync_revolt` zostaje, bo dispatch go wymaga (pkt 1)
  i jest używany w teście kolejności. Jego dokumentacja mówi teraz, że wywołany przed `sync` nie daje sprite'a w tej klatce i że trzeba użyć `sync_with_revolt`.
- Dowód: test `sync_with_revolt_matches_two_step_order` sprawdza, że `RevoltRenderer` po `sync_with_revolt` jest równy (`PartialEq`)
  wynikowi `sync` + `sync_revolt`, ma jeden sprite i ten sam `visual_key` grupy. Test `sync_revolt_before_sync_makes_no_sprite` (r1) nadal przechodzi.

### Zarzut 3 — publiczny getter `revolt_inputs()` poza zakresem dispatchu — PRZYJMUJĘ
- Poprawka: usunięto `CityInputs::revolt_inputs()`. Test `sync_revolt_matches_direct_revolt_sync` sprawdza równoważność samym porównaniem
  `wired == direct` (`RevoltRenderer` z adaptera i z bezpośredniego `RevoltRenderer::sync(&RevoltInputs::from_dto(&dtos), ..)`). Usunięta asercja tylko powtarzała to, co sprawdza ta równość.
  Dowód: `grep -n revolt_inputs rust-port/renderer -r` daje 0 trafień.

### Zarzut 4 — wektory ręczne; przebudowa grupy (cities.ts:551, zmiana visualKey) niećwiczona przez adapter — częściowo ODRZUCAM, w części o przebudowie PRZYJMUJĘ
- ODRZUCAM w części „wektory ręczne, nie z pinu”: Evaluator sam uznaje to za akceptowalne. Ten test sprawdza wpięcie (adapter == bezpośredni `RevoltRenderer::sync`).
  Logikę `_syncRevolt` z pinu pokrywa `tests/cities_revolt_r6.rs`. Dispatch (pkt 2) zamawia sekwencję z dwoma miastami, a nie wektory pinu.
- PRZYJMUJĘ w części o przebudowie: dodano test `sprite_reattached_when_group_rebuilt`. Najpierw `sync_with_revolt` z miastem w buncie (mury `none`),
  potem to samo miasto z `wall_kind = Stone`, więc `visualKey` się zmienia. Asercje: `visual_key` grupy jest inny niż poprzednio (przebudowa wg `:551`);
  sprite istnieje i ma `parent_visual_key == nowy visual_key` (`:586`); `serial` jest większy od starego, czyli to nowy sprite, a nie przeniesiony;
  jest dokładnie jeden sprite.

## TESTY (odtworzone po poprawkach, katalog `rust-port/renderer`)
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo (usunięty po bramkach).
1. `cargo fmt --check` — EXIT 0
2. `cargo clippy --all-targets -- -D warnings` — EXIT 0
3. `cargo test --test revolt_wiring_r6` — 7 passed, 0 failed (r1: 5; +`sync_with_revolt_matches_two_step_order`, +`sprite_reattached_when_group_rebuilt`)
4. `cargo test --all-targets --no-fail-fast` — EXIT 0; 77 × `test result: ok`; 666 passed, 0 failed, 0 ignored (r1: 664, +2); 0 linii `FAILED`/`panicked`.
Dysk przed bramką 4: 13 GB wolnego (≥ 12 GB). `git diff --check` czysty. `Cargo.lock` przywrócony, niecommitowany.

BLOKADY: brak. Uwaga dla rejestru: R6 jest wpięte w adapter, a nie wołane w grze (zarzut 1, L6).
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Final Control na `139ad0b87`; potem integracja orkiestratora na parity-v2.
DEPLOY/PUSH: NIE WYKONANO
