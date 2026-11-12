# 02a — obrona Operatora (R-RUSTPORT-P6-JS-MAX0-REST-Q1, runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JS-MAX0-REST-Q1
GOAL: obrona na zarzuty Evaluatora (02-evaluator.md, commit 8b2d49364) wobec kodu z commita 1fe2e36c3.
BAZA: 1fe2e36c3 (detached, worktree wf_98100c2a-7e4-3).

## Odpowiedzi na zarzuty

### Zarzut 1 (istotny, NIE_ZMIERZONO) — test nie wykrywa powrotu do f64::max
**PRZYJMUJĘ** (poprawka + dowód + commit).

Dowód, że wartościowy test nie mógł tego wykryć na tej platformie:
- Samodzielny program `rustc 1.97.0`, x86_64, `-O`: `(-0.0).max(0.0)` daje dodatnie zero (`is_sign_negative() == false`). Tak samo `(-0.0).floor().max(0.0)` i `(-0.3).floor().max(0.0)`. Dokumentacja Rust pozwala na dowolny znak zera w `f64::max`, więc test wartościowy nie jest wiarygodnym strażnikiem.
- Mutacja: `js_floor_nonneg` z przywróconym `f.max(0.0)` (z zachowaną gałęzią NaN) — `p6_js_max0_rest_wektory_z_pinu_bit_w_bit` i `p6_js_max0_rest_przypadki_jawne` nadal PASS. Potwierdza zarzut Evaluatora.

Poprawka (commit w sekcji SHA): dodany test strukturalny `p6_js_max0_rest_brak_f64_max_w_sciezce_znaku_zera` w `rust-port/engine/tests/p6_js_max0_rest.rs`:
- `js_floor_nonneg` (ciało funkcji z `okolica.rs`, `include_str!`) musi zawierać `siege_tactics_blow::js_max(0.0, x.floor())` i nie może zawierać `.max(`;
- `turn_economy_loop.rs` musi zawierać `js_floor_nonneg(city.population)` i nie może zawierać `f.max(0.0)`.

Dowód mutacyjny (wykonany, potem przywrócone):
- mutacja `okolica.rs` na `f.max(0.0)` z zachowaną gałęzią NaN: `p6_js_max0_rest_brak_f64_max_w_sciezce_znaku_zera` → FAILED (panicked at tests/p6_js_max0_rest.rs:93), pozostałe 2 testy PASS. Test strukturalny łapie regresję tam, gdzie wartościowy nie może.
- `git checkout -- okolica.rs` po mutacji: plik zgodny z HEAD (`git status` nie pokazuje go jako zmienionego).

Uwaga techniczna: mutacja bez gałęzi NaN (`x.floor().max(0.0)`) wywala też testy wartościowe (NaN → 0), ale to inna regresja, nie ta z dispatchu. Nie jest to przedmiotem zarzutu.

### Zarzut 2 (średni) — sprzeczność dispatchu brake_power*.rs / brak osobnego tematu
**PRZYJMUJĘ** zauważoną sprzeczność; **ODRZUCAM** zmianę tych plików w tej rundzie.

- Dispatch każe ruszać `brake_power*.rs` „jeśli grep znajdzie trafienia”, ale jednocześnie allowlista nie obejmuje tych plików, a ZAKAZ nie dopuszcza ich zmiany poza nią. Operator zastosował allowlistę; wynik poprawnie oznaczony jako NIE_ZMIERZONO.
- Zweryfikowane trafienia w bazie 1fe2e36c3 (`grep 'max(' ... | grep 0.0`): `brake_power.rs:205` (`v.max(0.0)` po guardzie `is_finite`), `brake_power_rest.rs:162` (`m.floor().max(0.0)`).
- Trafienia poza nazwanym zakresem dispatchu (nie `brake_power*`): `okolica/auto.rs:44`, `siege_capital_plunder.rs:132/567/631`, `work_tax.rs:57/61/140/145`, `siege_engine_build.rs:140`.
- `okolica/auto.rs:44` — `pop.floor().max(0.0).min(len) as usize`: znak zera jest nieistotny, bo rzutowanie `as usize` daje 0 dla obu zer. Wynik nieodróżnialny, ale to nadal ten sam wzorzec.
- Zalecenie: osobny temat `JS-MAX0-REST-Q2` z rozszerzoną allowlistą (brake_power.rs, brake_power_rest.rs, okolica/auto.rs, siege_capital_plunder.rs, work_tax.rs, siege_engine_build.rs) i wektorami per moduł. Nie w tej rundzie.

### Zarzut 3 (drobny) — turn_economy_loop.rs:839/872 i civ_matrix::js_compat::js_max
**PRZYJMUJĘ** jako poza zakresem; potwierdzone.

- `rust-port/engine/src/domain/civ_matrix.rs:45-50`: `js_max` dla wartości bez NaN zwraca `a.max(b)` — brak obsługi znaku zera.
- `turn_economy_loop.rs:834` (`js_max(0.0, r - 1.0)`) i `:867` (`js_max(0.0, przed - zuzycie)`) używają tej funkcji. Nie są w GOAL dispatchu (GOAL nazywa tylko `:399` i `okolica.rs:158`), a `civ_matrix.rs` jest poza allowlistą.
- Zalecenie: włączyć do tematu JS-MAX0-REST-Q2 lub do JS-MAX-SIGN (#110 w listach kolejek).
- `okolica.rs` prywatny `js_max` (wołany tylko z 1.0): przyjmuję ocenę Evaluatora, że nieosiągalny dla -0; bez zmiany.

### Zarzut 4 (drobny) — zmiana inercyjna downstream
**PRZYJMUJĘ** jako notę, bez zmiany kodu. Zgodne z analizą Evaluatora: `pop` jest porównywane (`<= 0.0`) i rzutowane; znak zera nie zmienia wyniku. Wartości skończone bez zmian (`p6_8g_okolica` 19 PASS, `turn_economy` 7 PASS w raporcie Operatora).

## Bramki po poprawce (EXIT, worktree wf_98100c2a-7e4-3, CARGO_TARGET_DIR poza repo)
- `rustc --version`: 1.97.0 (2d8144b78 2026-07-07)
- `cargo fmt --check`: EXIT 0 (po poprawce formatu testu)
- `cargo clippy --test p6_js_max0_rest -- -D warnings`: czysto
- `cargo test --test p6_js_max0_rest`: 3 passed (w tym nowy test strukturalny)
- `cargo test --test p6_js_max0 --test p6_js_max_sign`: 2 + 2 passed
- Mutacja f64::max (z gałęzią NaN): nowy test FAILED, przywrócone, PASS.

NIE_ZMIERZONO: `cargo test --lib` (99), `p6_8g_okolica`, `turn_economy` i pozostałe moduły po tej poprawce nie były ponownie uruchamiane — zmiana dotyczy wyłącznie pliku testowego `p6_js_max0_rest.rs`, kod produkcyjny jest bajt-w-bajt z 1fe2e36c3.

## Pliki
- zmieniony: `rust-port/engine/tests/p6_js_max0_rest.rs`
- nowy: `dyspozycje/autobot/runs/R-RUSTPORT-P6-JS-MAX0-REST-Q1/02a-obrona.md`
- nie commitowano: `rust-port/engine/Cargo.lock` (wygenerowany lokalnie, untracked)

NASTĘPNY KROK: Evaluator r2 weryfikuje nowy test strukturalny i mutację; FC po PASS. Osobny temat JS-MAX0-REST-Q2 dla brake_power*/okolica-auto/siege_capital/work_tax/siege_engine_build i civ_matrix::js_max w turn_economy_loop.
DEPLOY/PUSH: NIE WYKONANO
