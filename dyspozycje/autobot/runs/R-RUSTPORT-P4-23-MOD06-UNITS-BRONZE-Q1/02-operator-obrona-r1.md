STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1
GOAL: Obrona Operatora wobec raportu Evaluatora (runda 1) z portu MOD-06 (Brąz) 1:1 z webem `edb8fb56` wraz z przeniesieniem `js_asin` do `jsmath`.
ZMIANY/COMMIT: baza = commit Operatora `e367aac1` (rodzic `dbddb6be`). Zmiany obrony wyłącznie w allowliście: `dyspozycje/autobot/runs/R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1/{mutate.py, logi/mutate-obrona.txt, 02-operator-obrona-r1.md}`, `dyspozycje/rust-port/p4/P4-23-MOD06-UNITS-BRONZE.md` (§0, §4, §6, §8). Kod `rust-port/**` bez zmian. SHA: w raporcie zwrotnym (commit po tym pliku).

## Odpowiedzi na zarzuty

1. **`tests/units_kamien_web_parity.rs` poza allowlistą (O2)** — ODRZUCAM jako błąd, podtrzymuję jawne odchylenie. Dowód: `git diff dbddb6be e367aac1 --stat -- rust-port/renderer/tests/units_kamien_web_parity.rs` = `3 insertions(+)`: dwa komentarze i ramię `Prim::Braz(b) => b.three_type(),`. Bez niego `match` po `Prim` nie kompiluje się po dodaniu dozwolonego (dispatch: „dodaj minimalny analogiczny wariant”) `Prim::Braz`. Alternatywa (`_ =>` w `Prim`) zmieniałaby `model.rs` szerzej niż pozwala allowlista i osłabiałaby wyczerpujący match w teście MOD-05. Opisane w dokumencie §3.4/§8; Evaluator sam je akceptuje.
2. **`mutate.py` nie uruchamia `jsmath_wiring`** — PRZYJMUJĘ. Poprawka: `CMD` zawiera teraz `--test jsmath_wiring`; dodane mutacje M21 (`geo.rs` `js_cos(ang)`→`ang.cos()`), M22 (`geo.rs` `js_sin(ang)`→`ang.sin()`), M23 (`procarz.rs` `js_atan2(d.x, d.z)`→`d.x.atan2(d.z)`). Dowód: `logi/mutate-obrona.txt` — `detected 23/23, build errors 0`, `EXIT=0`; M21–M23 `DETECTED by no_platform_transcendentals_anywhere_in_src`. Każdy plik przywrócony bajtowo (assert w skrypcie), `git status` po przebiegu pokazuje tylko `mutate.py` i nowy log.
3. **Edycja surowego `logi/test-nocapture.txt`** — ODRZUCAM jako wadę. Dowód: zmiana dotyczy wyłącznie końcowych spacji w 3 liniach (`renderer:`/`trig:`/`models: … within_1e-12=0`, obecnie linie 503/506/510), wymaganej przez bramkę `git diff --check` (CLAUDE.md „Przed zapisem sprawdź … `git diff --check`”). Wartości liczbowe niezmienione; edycja jawnie opisana w §6 dokumentu. Ten sam przebieg odtwarzalny przez `gates.sh`.
4. **Nieusunięty `scratchpad/ref` po `npm install`** — PRZYJMUJĘ. Ustalenia: `stat` — katalog powstał 2026-10-22 13:48:16 UTC (przed commitem `e367aac1` 13:54:59, czyli w trakcie pracy tego Operatora), zawartość `package.json` + `node_modules` (`three ^0.169.0`, `esbuild ^0.24.0`), 39 MB; `grep -r "scratchpad/ref"` po skryptach scratchpadu = 0 trafień; żaden proces nie ma go jako cwd ani w linii poleceń. Poprawka: `rm -rf …/scratchpad/ref`; `ls` → `No such file or directory`. Dokument §8 zaktualizowany.
5. **`perTokenGeos` nieporównywane dla 8 builderów `units.ts`** — ODRZUCAM jako brak. Dowód: `src/models/unit_core/avatar.rs:1-5` („the web `perTokenGeos` list only exists for GPU disposal”) — decyzja P4.13; model CPU nie ma uploadu ani zwalniania GPU (dispatch: „bez uploadu na GPU”). Sama geometria (pozycje, indeksy, hash) jest porównywana bitowo dla wszystkich 180 przypadków.
6. **Wygląd 1:1 NIE_ZMIERZONO** — ODRZUCAM jako zarzut (wymóg dispatchu spełniony). Dispatch: „Ocena wizualna 1:1 wymaga GPU — oznacz jako NIE_ZMIERZONO … dołącz listę »co ocenić wzrokiem po RR-T5«” — lista 7 punktów jest w §7 dokumentu.

TESTY: `python3 mutate.py` (CARGO_TARGET_DIR w scratch) → 23/23 DETECTED, EXIT=0. Kod produkcyjny i testy Rust nie zmienione względem `e367aac1`, więc bramki fmt/clippy/clippy-gpu/test z rundy 1 (potwierdzone niezależnie przez Evaluatora: 123 passed, 0 failed) pozostają ważne. `git diff --check` czysty.
BLOKADY: brak.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control, potem integracja orkiestratora (konflikty jednej linii w `src/models.rs`, `jsmath/mod.rs`, `registry.rs`).
DEPLOY/PUSH: NIE WYKONANO
