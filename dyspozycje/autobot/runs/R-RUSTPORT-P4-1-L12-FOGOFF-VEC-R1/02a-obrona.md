# R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1 — Obrona Operatora (r1)

STATUS: BLOCK (INFRA, tylko pełna bramka renderera). Zarzut 3 przyjęty i poprawiony. Pozostałe zarzuty odrzucone z dowodem albo przekazane orkiestratorowi.
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1
GOAL: wektor `fog_off_no_reveal_awaiting` zgodny z pinem: `riverRevealKeys = null` przy wyłączonej mgle (main.ts:13506, scene.ts:3531).
ZMIANY/COMMIT: `52922b7aa` na gałęzi `obrona/R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1` (rodzic `ce9d33e6f`, czyli kod `cf6a09552` + raporty). Zmieniony tylko `rust-port/renderer/tests/reveal_l12_gen.mjs` (+6/−2) oraz ten raport. `vectors.json` bez zmian.
TESTY: zob. niżej.
BLOKADY: INFRA. Wolne 4,8–4,9 GB < 12 GB. W tle trwają dwa obce `cargo test --all-targets` engine (PID 10224, cwd `wf_414119d0-497-2/rust-port/engine`; PID 25280, cwd `wf_1dce648f-896-2/rust-port/engine`).
RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Final Control, potem pełna bramka `cargo test --all-targets --no-fail-fast` na rendererze przy ≥ 12 GB (albo przy progu obniżonym przez orkiestratora, zarzut 2).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. [BLOKUJĄCY, INFRA] Pełna bramka renderera nieuruchomiona — ODRZUCAM jako wadę pracy, blokada INFRA pozostaje
Bramki nie da się uruchomić zgodnie z dispatchem: `df -h /` → 4,9 GB wolnego (próg dispatchu: ≥ 12 GB). Dispatch zakazuje też równoległych buildów, a dwa obce `cargo test` engine nadal trwają (PID 10224, 25280; cwd i CARGO_TARGET_DIR sprawdzone przez `/proc`). Nie uruchamiam bramki poniżej progu i nie zatrzymuję cudzych procesów. Zgodnie z dispatchem zapisuję BLOCK INFRA z liczbą GB. Bramkę trzeba ponowić na `52922b7aa` (albo `cf6a09552`, bo Rust i `vectors.json` są identyczne) po zwolnieniu dysku.

### 2. [UWAGA dla orkiestratora] Próg 12 GB nadmiarowy (target 202 MB) — ODRZUCAM jako zarzut do Operatora
Próg pochodzi z dispatchu i stałej reguły orkiestratora („bramka renderera przy < 12 GB … czeka”). Operator nie może go zmienić. Przekazuję orkiestratorowi pomiar Evaluatora (202 MB bez feature `gpu`) do decyzji technicznej w `REJESTR-RUST.md`.

### 3. [NISKI] Ręcznie zakodowana gałąź `useFogRender` w generatorze — PRZYJMUJĘ
Poprawka (`52922b7aa`): `dto.reveal.riverRevealKeys` pochodzi teraz z wykonanej ścieżki pinu, a nie z ręcznego warunku. Wynik `runSetFog` to wykonany tekst `scene.ts:3531` (`lastRiverRevealKeys = opts?.riverRevealKeys ?? null`). Wejściem jest wywołanie `setFog` przechwycone z wykonanego `refreshFog` (main.ts:13475-13519). Gałąź `if (useFogRender)` z main.ts:13489-13494 i 13505-13506 rozstrzyga więc pin, nie generator:
```js
riverRevealKeys: scene.lastRiverRevealKeys === null
  ? null
  : sortKeys(scene.lastRiverRevealKeys).map(([q, rr]) => ({ q, r: rr })),
```
Dowody:
- `node reveal_l12_gen.mjs --check` (TYPESCRIPT_JS=/opt/node-tools/node_modules/typescript/lib/typescript.js) → EXIT 0, „reveal_l12 vectors OK (28 scenarios)”. `vectors.json` jest więc bajt w bajt taki sam jak w `cf6a09552`.
- Czułość: podmieniłem wykonywany tekst pinu w `refreshFog` (`setFog(ALL_KEYS, ALL_KEYS);` → wywołanie z `{ riverRevealKeys: startRevealKeysForRiverFog() }`). Wynik: `--check` → EXIT 1 („vectors differ from the pin”). Plik przywrócony, `cmp OK`.
- Uczciwie: ta sama mutacja na starym generatorze (`ce9d33e6f`) też daje EXIT 1, bo sekcja `web` (nargs, `scene.lastRiverRevealKeys`) już ją łapała. Poprawka nie załatała więc ślepej plamy. Usuwa duplikat logiki pinu z pola DTO, tak jak oczekiwał zarzut.

### 4. [NISKI] Mutację (a) łapie tylko ręczny test — ODRZUCAM jako wadę
Ograniczenie wynika z pinu, co przyznaje sam Evaluator. Przy wyłączonej mgle pin podaje `riverRevealKeys = null` (main.ts:13506 + scene.ts:3531), więc żaden wektor pinu nie może nieść kluczy przy `!fogActive`. Mutację (a) musi łapać test ręczny `fog_off_drops_the_river_keys`, który ją łapie (EXIT 101 u Operatora i u Evaluatora).

### 5. [NISKI, poza allowlistą] Komentarz `view-model/src/map.rs:232-252` — ODRZUCAM w tym temacie
Plik jest poza allowlistą dispatchu („Engine i view-model: NIE”). Zachowanie jest zgodne: producent `engine/src/domain/dto_bridge.rs:175-180` zwraca None (wg Evaluatora). Proponuję orkiestratorowi osobny dług dokumentacyjny: komentarz `FogRevealDto::river_reveal_keys` ma mówić, że przy wyłączonej mgle pole ma wartość None (main.ts:13506).

### 6–7. Punkty „sprawdzone, zielone” — bez odpowiedzi (nie są zarzutami).

## Testy tej rundy obrony
| Polecenie | Wynik |
|---|---|
| `node reveal_l12_gen.mjs --check` po poprawce | EXIT 0 (28 scenariuszy) |
| mutacja tekstu pinu w `refreshFog` (nowy generator) | EXIT 1, przywrócone, cmp OK |
| ta sama mutacja na generatorze `ce9d33e6f` | EXIT 1 (plik tymczasowy usunięty) |
| `git diff --check` | czysty |
| cargo (fmt/clippy/test) | NIE URUCHOMIONO w obronie: brak zmian w plikach Rust i `vectors.json`, więc wyniki Evaluatora na `cf6a09552` nadal obowiązują. Dysk 4,9 GB. |
| `cargo test --all-targets --no-fail-fast` | NIE URUCHOMIONO (BLOCK INFRA, 4,9 GB < 12 GB) |

Cargo.lock niecommitowany. Bez push. Bez linii Co-Authored-By.
