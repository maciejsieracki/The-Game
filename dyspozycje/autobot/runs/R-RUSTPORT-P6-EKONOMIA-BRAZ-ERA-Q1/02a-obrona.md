# OBRONA r2 — R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1 (Operator obrony, Haiku)

STATUS: BLOCK (kryterium 3 nadal niespełnione, wymagana decyzja orkiestratora)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-EKONOMIA-BRAZ-ERA-Q1
BAZA: 0ca58770e; kod operatora r2: 53d409a44; obrona: commit po 53d409a44 (komentarz w teście + ten plik)
RUNDY: obrona po BLOCK operatora r2

## Odpowiedzi na zarzuty

1. KRYTYCZNY (7 testów FAILED, kryterium 3) — PRZYJMUJĘ jako fakt; ODRZUCAM możliwość naprawy w tej rundzie.
   Dowód: `rust-port/engine/tests/p6_adv_q5_vectors/q5.json` (resUp gracza 1: `"braz":10`) oraz `p6_adv_q6_vectors/q6.json`, `p6_adv_city_econ_vectors/advance.json`, `p6_empirefood_vectors/empirefood.json` zawierają wartości brązu z pina 4bbef081d (huta*m(e)). Pin 07d2fbd72 daje brąz per epoka (50/75, bez m(e)).
   Naprawa wymaga regeneracji wektorów i generatorów `gen-*.mjs` oraz edycji testów `p6_adv_*` i `p6_empirefood_e2e.rs`. Wszystkie są POZA allowlistą r2 (r2 pkt 1 obejmuje tylko `p6_turn_econ_res_pipeline.rs` i `p6_7b_vectors/**`). Operator nie rozszerza allowlisty sam.
   Wymagana decyzja orkiestratora: (a) rozszerzyć allowlistę o te wektory/generatory i zregenerować z 07d2fbd72, albo (b) przyjąć 7 znanych FAILED jako osobny temat repin. Do czasu decyzji kryterium 3 jest niespełnione.

2. ŚREDNI (brak dowodu zielonego pełnego przebiegu) — PRZYJMUJĘ.
   Status: NIE_ZMIERZONO. Pełny `cargo test --no-fail-fast` nie został ukończony w tej rundzie obrony (poprzedni timeout 580 s). Nie ponawiałem, bo 0 failed jest niemożliwe bez rozstrzygnięcia z pkt 1.

3. ŚREDNI (oczekiwania brązu w `p6_turn_econ_res_pipeline.rs` jako stałe, nie wektor) — PRZYJMUJĘ częściowo; ODRZUCAM zarzut niezgodności z dispatchem.
   Dispatch r2 pkt 1 dopuszcza zmianę oczekiwań brązu zgodnych z pinem z podaniem linii pina. Poprawka obrony: komentarz w teście podaje linie pina: `converters.ts:99,100,102` (throughputEraParamKeys), `gra/data/econ-params.json:369` (epoka2=50) i `:376` (epoka3=75). Zweryfikowane przez `git show 07d2fbd72:gra/data/econ-params.json` i `git show 07d2fbd72:gra/src/game/converters.ts`.
   Wektor z SHA fragmentu pina jest w `p6_ekonomia_braz_era.rs` (FRAGMENT_SHA256 = f0e28920…, test `vectors_are_bound_to_pin_fragment_sha`). NIE_ZMIERZONO: czy test przechodzi. Cargo nie był uruchamiany w tej obronie.

4. NISKI (rozbieżność ścieżek pina :1503 vs :2484) — PRZYJMUJĘ jako notatkę do raportu.
   Rozbieżność jest jawna i pokryta testem `known_divergence` w `p6_ekonomia_braz_era.rs` (r2 pkt 3). Stwierdzenie „nieosiągalne w produkcji” NIE_ZMIERZONO przeze mnie. Bez zmiany kodu.

5. NISKI (zmiany poza czystą allowlistą: econ-params.json, economy_society.rs) — ODRZUCAM jako błąd; zmiany są uzasadnione.
   - `rust-port/engine/data/econ-params.json`: dopuszczone wprost przez r2 pkt 2.
   - `rust-port/engine/src/data/economy_society.rs` (+5 linii): dopuszczone przez allowlistę r1 („`rust-port/engine/src/data/**` tylko jeśli klucze przepustowości są tam czytane — uzasadnić w raporcie”). Pola czytają klucze `budynek_huta_braz_epoka2/3_przepustowosc` z `econ-params.json` (deny_unknown_fields).
   - Potwierdzone: wystąpienia `ignore` w diff 0ca58770e..53d409a44: 0; usuniętych funkcji `#[test]`: 0. Cargo.lock nie jest w commicie; brak push; `gra/` nietknięte.

## Dowody pomocnicze
- `git diff --check`: exit 0
- `rustfmt --check --edition 2021` na zmienionym pliku testu: exit 0
- Zakres zmiany obrony: komentarz w `rust-port/engine/tests/p6_turn_econ_res_pipeline.rs` (bez zmiany asercji) oraz ten plik.

## Wynik
Kryterium 3 nadal NIESPEŁNIONE (7 FAILED, wektory poza allowlistą). Brak READY_FOR_DEPLOY.
NASTĘPNY KROK: decyzja orkiestratora w sprawie 7 wektorów poza allowlistą, potem FC.
DEPLOY/PUSH: NIE WYKONANO (brak push; gałąź wip nietknięta poza tym commitem).
