# Obrona Operatora — R-RUSTPORT-P6-K5DOC-T7A-FALANGA (runda 3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T7A-FALANGA
BAZA: 64fce9ed2 (raport Operatora r3; kod i wektory z 0964e67a1 / 409477d73 / 1120f110c / c39d97add)
GOAL: Odpowiedź na 7 zarzutów z 02-evaluator.md (ec5e8d5f8). Bez zmian w kodzie — potwierdzenie dowodami.

## Odpowiedzi na zarzuty

1. **Bramki odtworzone (fmt, clippy, lib 126, p6_k5doc_t7a 10) — PRZYJMUJĘ jako potwierdzenie, bez poprawki.**
   Nie jest to zarzut wobec kodu. Pełny `cargo test --all-targets` nie był powtarzany przez Ewaluatora; Operator r3 zgłasza jego EXIT 0 (515 wystąpień `test result: ok`, zero FAILED). Brak luki.

2. **Mutant `d_enemy > d_now` przeżył — ODRZUCAM jako lukę testów (mutant równoważny).**
   Dowód: `siege_tactics_phalanx.rs:238-239` używa `if d_enemy >= d_now { continue }`. Krok N/E/S/W zmienia odległość Manhattan dokładnie o ±1 (`DIRS4`, linia 34), a współrzędne wroga i jednostki są całkowite (siatka `BF_COLS=68`, `BF_ROWS=156`). Zatem `d_enemy ∈ {d_now-1, d_now+1}`; wartość `d_enemy == d_now` jest niemożliwa. Warunki `d_enemy >= d_now` oraz `d_enemy > d_now` odrzucają dokładnie ten sam zbiór kroków, więc mutant nie zmienia zachowania. Żaden wektor nie może go zabić bez zmiany zachowania pina. Operator r3 (mutacje a–e) wykazał FAIL dla pozostałych mutantów.

3. **Zgodność z pinem `07d2fbd72` — PRZYJMUJĘ, zweryfikowane.**
   - `PHALANX_LEAD_TOLERANCE = 2` → `battleScene.ts:1168` (potwierdzone `sed` na pinie).
   - `isPhalanx` → `battleScene.ts:1538-1544` (potwierdzone: `normName(kategoria)==='falanga'`, potem `Jednostka ?? nazwa` z `falang|phalan|hoplit|sarissa`). Rust `is_phalanx` (`siege_tactics_phalanx.rs:47-59`) implementuje tę samą regułę.
   - `BF_COLS = 68` (`siege_tactics_approach.rs:210`), `BF_ROWS = 156` (`:212`) — zgodne z dispatchem.
   - Wektory: `tests/p6_k5doc_t7a_vectors/vectors.json` zawiera `pin` w `generator`/`pin`, sekcje `is_phalanx` (15), `line_front` (8), `action` (30) i `normName_probe` (3) — zgodnie z zarzutem. Brak `#[ignore]`, brak `gra/`, brak `Cargo.lock` w commitach.

4. **Wariant `Schedule` nie istnieje w pinie — PRZYJMUJĘ, bez zmiany kodu.**
   Potwierdzone: `_phalanxStep` (pin `:6588-6636`) nie planuje kroków przez `_schedule`; callback `_doMove` to `() => done()`. Moduł dokumentuje to w nagłówku (`siege_tactics_phalanx.rs:16`), a `PhalanxDecision` (`:101-112`) nie zawiera `Schedule`. Decyzja techniczna do wpisu przez orkiestratora w `dyspozycje/rust-port/REJESTR-RUST.md` (zasada 8 CLAUDE.md, zasada 8 bez pytania ABC).

5. **Brak wołającego (wiring T8/#113) i wymóg `advance_step_decide` (T4b) — PRZYJMUJĘ, poza zakresem.**
   Zgodnie z dispatchem: wiring nie wchodzi w tę rundę. Kod nie rozszerza `siege_tactics_loop.rs` ani `siege_tactics_activate.rs`. Zależność od T4b jest ujawniona w raporcie; wiring nie może się udać bez T4b w gałęzi integracyjnej.

6. **Dług `norm_name` (NFD tylko dla U+00C0..U+017F) — PRZYJMUJĘ jako znany dług, NIE naprawiam.**
   Dispatch r2/r3 wymaga odnotowania bez naprawy. Wpis do rejestru długu po stronie orkiestratora.

7. **Konflikt trailerów (Co-Authored-By z nazwą modelu vs dispatch bez nazwy modelu) — PRZYJMUJĘ jako decyzję orkiestratora (#289), bez zmiany commitów.**
   Commit tej obrony używa trailera zgodnego z dispatchem (bez nazwy modelu), konflikt zgłoszony ponownie w tym raporcie.

## Podsumowanie zmian w tej rundzie

- Kod, wektory i testy: BEZ ZMIAN (zarzuty nie wymagają poprawki kodu).
- Jedyna zmiana: ten plik (`02a-obrona.md`).

## Dowody

- `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '1166,1169p;1536,1545p'` — linie 1168 i 1538-1544 zgodne z kodem.
- `rust-port/engine/src/domain/siege_tactics_phalanx.rs:238-239` — warunek `d_enemy >= d_now`.
- `rust-port/engine/src/domain/siege_tactics_approach.rs:210,212` — `BF_COLS=68`, `BF_ROWS=156`.
- `rust-port/engine/tests/p6_k5doc_t7a_vectors/vectors.json` — sekcje wektorów `is_phalanx`, `line_front`, `action`, `normName_probe`.

## Blokady

Brak blokad technicznych. Nie wykonano push ani integracji.

## RUNDY

3 (obrona r3). Ta runda nie zmienia kodu; bramki nie były powtarzane w tej obronie (zweryfikowane wyniki Operatora r3 w 03-operator-r3.md).

## NASTĘPNY KROK

Ewaluator r3 / Final Control r3 na commicie tej obrony. Orkiestrator: wpisać do REJESTR-RUST.md pkt 4 (brak wariantu Schedule) i pkt 6 (dług NFD).

DEPLOY/PUSH: NIE WYKONANO
