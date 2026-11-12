# K5 — przegląd gałęzi po FACING i KONTRAKTEK (R-RUSTPORT-P6-K5-SWEEP-PRZEGLAD-Q1, runda 1)

BAZA: `b0ba891fb` (= `origin/rust-port/parity-v2` po INTEG-B20).
METODA: `git merge-base --is-ancestor <SHA> b0ba891fb` (przodek?), `git merge-tree --write-tree b0ba891fb <SHA>` (konflikt względem bazy), `git rev-list --count` (ahead/behind), `git merge-tree --write-tree` w parach tipów (konflikt parami). Bez cargo, bez zmian w kodzie.
ZAKRES: refy `origin/rust-port-wip/*` zawierające K5 (24 gałęzie) oraz lokalne `rust-port-wip/*K5*` odbiegające od remote. Brak danych = NIE_ZMIERZONO.

## 1. Gałęzie K5 (remote, `origin/rust-port-wip/*`)

| gałąź | SHA | przodek bazy? | konflikt vs baza? | ahead / behind | uwagi |
|---|---|---|---|---|---|
| R-RUSTPORT-P6-K5I2B2-DLUG-Q1 | 19c13bb4e | TAK | NIE | 0 / 75 | zintegrowana (w bazie) |
| R-RUSTPORT-P6-K5I2B2-POKRYCIE-Q1 | 2130224cc | NIE | NIE | 5 / 75 | NIE w bazie; konflikt parami z JS-MAX-SIGN, JS0-REST, JS0-HARDENING, ELIMINACJA-DEALS-Q2 (patrz §3) |
| R-RUSTPORT-P6-K5LOOP-FACING-Q1 | ee0e3970d | TAK | NIE | 0 / 97 | zintegrowana (FACING) |
| R-RUSTPORT-P6-K5LOOP-KONTRATAK-Q1-fc | 039066ae1 | TAK | NIE | 0 / 93 | zintegrowana (KONTRATAK) |
| R-RUSTPORT-P6-K5LOOP-KONTRATAK-Q1-obrona-keep | bd4e4f63e | TAK | NIE | 0 / 94 | zintegrowana, gałąź obrony (keep) |
| R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1 | 0c90e2bf1 | TAK | NIE | 0 / 107 | zintegrowana |
| R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1 | 4d2e1dfcb | TAK | NIE | 0 / 100 | zintegrowana (BODY) |
| R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-Q1 | ec7a0ff78 | TAK | NIE | 0 / 109 | zintegrowana (pętla) |
| SIEGE-TAKTYKA-K5-AUDYT-fc | b2336c005 | TAK | NIE | 0 / 332 | zintegrowana |
| SIEGE-TAKTYKA-K5A-fc | 0804daad0 | TAK | NIE | 0 / 273 | zintegrowana |
| SIEGE-TAKTYKA-K5D-fc | 5dabae57e | TAK | NIE | 0 / 274 | zintegrowana |
| SIEGE-TAKTYKA-K5E-fc | 9bba72be5 | TAK | NIE | 0 / 275 | zintegrowana |
| SIEGE-TAKTYKA-K5F-fc | bcb64cead | TAK | NIE | 0 / 266 | zintegrowana |
| SIEGE-TAKTYKA-K5G-fc | 1a119b78e | TAK | NIE | 0 / 260 | zintegrowana |
| SIEGE-TAKTYKA-K5G0-fc | e40f9c710 | TAK | NIE | 0 / 274 | zintegrowana |
| SIEGE-TAKTYKA-K5H-fc | 86223e037 | TAK | NIE | 0 / 244 | zintegrowana |
| SIEGE-TAKTYKA-K5I-fc | ff8688bf9 | TAK | NIE | 0 / 272 | zintegrowana |
| SIEGE-TAKTYKA-K5I2-r2-fail | a097600e1 | TAK | NIE | 0 / 269 | gałąź FAIL (historyczna), w bazie jako przodek |
| SIEGE-TAKTYKA-K5I2A1-fc | eee18680c | TAK | NIE | 0 / 266 | zintegrowana (INTEG-B14C) |
| SIEGE-TAKTYKA-K5I2A2-fc | 4b6595876 | TAK | NIE | 0 / 267 | zintegrowana |
| SIEGE-TAKTYKA-K5I2A3-fc | fe3264a39 | TAK | NIE | 0 / 266 | zintegrowana |
| SIEGE-TAKTYKA-K5I2A4-fc | a2bcdbdc6 | TAK | NIE | 0 / 259 | zintegrowana |
| SIEGE-TAKTYKA-K5I2B-fc | f42dddfcd | TAK | NIE | 0 / 251 | zintegrowana |
| SIEGE-TAKTYKA-K5J-fc | bbbc17b6b | TAK | NIE | 0 / 268 | zintegrowana |

Wynik: w bazie są 23 z 24 gałęzi remote. Jedyna spoza bazy to `R-RUSTPORT-P6-K5I2B2-POKRYCIE-Q1` (5 commitów, bez konfliktu z bazą).

## 2. Lokalne `rust-port-wip/*K5*` odbiegające od remote (niewypchnięte / inny SHA)

| gałąź lokalna | SHA | przodek bazy? | konflikt vs baza? | ahead / behind | uwagi |
|---|---|---|---|---|---|
| rust-port-wip/R-RUSTPORT-P6-K5I2B2-POKRYCIE-Q1 | a0071c780 | NIE | NIE | 2 / 75 | inny SHA niż remote `2130224cc` (remote ma 5 commitów); lokalny jest ich podzbiorem lub rozgałęzieniem — NIE_ZMIERZONO który jest właściwy |
| rust-port-wip/R-RUSTPORT-P6-K5LOOP-KONTRATAK-Q1 | 6f9f6a762 | NIE | **TAK** | 2 / 97 | NIE odpowiada remote `-fc` (039066ae1, w bazie). Konflikt z bazą: nie integrować bez decyzji orkiestratora |
| rust-port-wip/R-RUSTPORT-P6-K5LOOP-KONTRATAK-Q1-op2 | b323b3d7d | NIE | NIE | 1 / 96 | wariant operatora, niezmapowany na remote |
| rust-port-wip/SIEGE-TAKTYKA-K5I2-r2-fc | f117da4e2 | NIE | NIE | 3 / 269 | lokalny FC r2, nie w remote; baza ma remote `a097600e1` (FAIL) |
| rust-port-wip/SIEGE-TAKTYKA-K5I2-r2-obrona | 62504a605 | NIE | NIE | 2 / 269 | lokalna obrona r2 |
| rust-port-wip/SIEGE-TAKTYKA-K5J-Q1 | d6dc5fe6b | NIE | NIE | 1 / 269 | lokalny operator K5J; remote-fc `bbbc17b6b` jest w bazie |
| rust-port-wip/SIEGE-TAKTYKA-K5J-Q1-evaluator-r1 | 4407fcd9c | NIE | NIE | 2 / 269 | lokalny evaluator K5J |

Pozostałe lokalne K5 (K5LOOP-FACING-Q1, K5LOOP-KONTRATAK-Q1-obrona, K5LOOP-BODY-Q1 i -r2, K5-AUDYT-Q1, K5A-Q1 i -obrona, K5D-Q1-op, K5E-Q1 i -obrona, K5F-Q1, K5G0-Q1, K5I2-obrona-r2, K5I2-op, K5I2A2-r4, K5I2A3-op, K5I2A4-obrona, K5I2B-Q1) są przodkami bazy i bez konfliktu. Lokalne gałęzie są stare (behind 250+), więc nie są kandydatami do integracji.

## 3. Konflikty parami (tipy gałęzi, `merge-tree`)

Pary zbadane dla kandydatów INTEG-B22 oraz POKRYCIE:

- Bez konfliktu: RANGED-CLEANUP x JS-MAX-SIGN, RANGED-CLEANUP x JS0-REST, RANGED-CLEANUP x JS0-HARDENING, RANGED-CLEANUP x ELIMINACJA-DEALS-Q2, RANGED-CLEANUP x POKRYCIE, JS0-REST x JS-MAX-SIGN, JS0-REST x JS0-HARDENING, JS-MAX-SIGN x JS0-HARDENING, JS0-REST x ELIMINACJA-DEALS-Q2, JS-MAX-SIGN x ELIMINACJA-DEALS-Q2, JS0-HARDENING x ELIMINACJA-DEALS-Q2, POKRYCIE x DLUG.
- **Konflikt (TAK)**: POKRYCIE x JS-MAX-SIGN, POKRYCIE x JS0-REST, POKRYCIE x JS0-HARDENING, POKRYCIE x ELIMINACJA-DEALS-Q2, ELIMINACJA-DEALS-Q2 x DLUG (DLUG jest przodkiem bazy; patrz caveat).
- Caveat: pary z gałęzią będącą przodkiem bazy (DLUG, RANGED-DAMAGE-NAN-Q1) mierzą różnicę między starym tipem a nowym tipem; konflikty z nimi NIE są sygnałem integracyjnym. Względem bieżącej bazy obie są bez konfliktu i są już zintegrowane.

## 4. Duplikaty definicji K5 w `rust-port/engine/src/domain`

- **`js_max` / `js_min` (Math.max/min z JS)** — zdefiniowane w ~23 plikach. Dla K5:
  - `siege_tactics_blow.rs:180` `js_max` / `:189` `js_min` (pub) — NaN propaguje, **znak zera NIE**: `a.max(b)` (f64).
  - `siege_tactics_clock.rs:61` `js_max` / `:77` `js_min` (pub) — NaN propaguje, **znak zera obsłużony** (+0 wygrywa z -0 w max).
  - `siege_tactics_approach.rs:91` `js_min` (prywatna) — zakres K5 (podejście).
  - `siege_tactics_inputs_pos.rs:27` `js_max_sign` (pub) — znak zera obsłużony; w bazie, dublet semantyczny dla `js_max` z `clock.rs`.
  - Rozjazd semantyki: `siege_tactics_blow::js_max` i `siege_tactics_clock::js_max` dają różny wynik dla (-0, +0). Jest to ryzyko parytetu (wymaga jednej definicji — zadanie JS-MAX-SIGN).
  - Poza K5 te same nazwy są w ~20 innych plikach (`society_breakdown`, `territory`, `civ_matrix`, `recruitment`, `diplomacy_multiwar`, `mapgen/*`, `turn_economy`, `auto_improvements`, ...). Część z nich to zakres JS0-REST.
- **`ranged_shot_damage` (i64)** — `unit_power.rs:96`. Komentarz w kodzie: NIE UŻYWAĆ w produkcji (`resolve_ranged_phase` woła `ranged_shot_damage_f64`); tylko testy. Duplikat roli `ranged_shot_damage_f64`. Zakres: RANGED-CLEANUP-Q1 (usunięcie wariantu i64).

## 5. Lista do decyzji orkiestratora (INTEG-B22 vs osobny temat)

Warunek: każda pozycja bez konfliktu względem `b0ba891fb`. Konflikty parami podano w §3.

**Kandydaci do INTEG-B22 (bez konfliktu vs baza; wzajemnie bez konfliktu poza §3):**
1. RANGED: `R-RUSTPORT-P6-RANGED-CLEANUP-Q1` `182d298ef` (ahead 3, przodek: NIE, konflikt: NIE). `RANGED-DAMAGE-NAN-Q1` `e9b505939` jest już w bazie — nie wchodzi.
2. JS0-REST: `R-RUSTPORT-P6-JS-MAX0-REST-Q1` `621e7338f` (ahead 9, konflikt NIE).
3. JS-MAX-SIGN: `R-RUSTPORT-P6-JS-MAX-SIGN-Q1` `9a9112a3d` (ahead 3, konflikt NIE). Uwaga: baza już ma `js_max_sign` w `siege_tactics_inputs_pos.rs:27`; przed integracją sprawdzić, czy gałąź nie tworzy trzeciej definicji (NIE_ZMIERZONO w tym przeglądzie — tylko odczyt definicji w bazie).
4. JS0-HARDENING: `R-RUSTPORT-P6-JS-MAX0-HARDENING-Q1` `8000d1d3d` (ahead 6, konflikt NIE).
5. ELIMINACJA-DEALS: `R-RUSTPORT-P6-ELIMINACJA-DEALS-Q2` `5db1f2845` (ahead 12, konflikt NIE).

**Osobny temat (nie wchodzi do INTEG-B22 w tej samej partii):**
- `R-RUSTPORT-P6-K5I2B2-POKRYCIE-Q1` `2130224cc` (ahead 5, konflikt z bazą NIE, ale konflikt parami z JS-MAX-SIGN, JS0-REST, JS0-HARDENING i ELIMINACJA-DEALS-Q2). Zgodnie z zadaniem #111 (łucznik 14→2, wektory pokrycia) — integrować osobno, po wejściu jednej z gałęzi JS0/ELIMINACJA, z rebase/merge i ponowną bramką.
- Lokalna `rust-port-wip/R-RUSTPORT-P6-K5LOOP-KONTRATAK-Q1` `6f9f6a762` — konflikt z bazą; NIE integrować; nie mylić z remote `-fc` (w bazie). Wymaga decyzji właściciela/orkiestratora, czy porzucić.
- Lokalne warianty K5I2-r2-fc / r2-obrona / K5J-Q1 / K5J-Q1-evaluator-r1 / KONTRATAK-Q1-op2 — NIE_ZMIERZONO, czy są wymagane; remote-FC odpowiedniki są w bazie.

## 6. Ograniczenia

- Konflikty mierzone `merge-tree` na tipach; nie sprawdzono konfliktów semantycznych (np. dwa różne `js_max` bez konfliktu tekstowego).
- Brak cargo (temat dokumentacyjny).
- Nie zmieniano `gra/`, `origin/main`, `rust-port/parity-v2`.
