# P6-REPIN-EKONOMIA-D — dossier tematu (krok 4b, część D)

**Temat:** `R-RUSTPORT-REPIN-EKONOMIA-D-Q1` · **Rola:** Operator-impl
**Numeracja rund (jedna, ujednolicona w R3):** R1 = port work-tax `d0dfe1f89`; R2 = weryfikacja i mutacje `7ddd85a42`; **R3 = ten dokument i commity odpowiedzi na zarzuty Evaluatora R2** (ten sam ID, bez FAIL). Każde przejście Operatora tego ID to kolejna runda; limit 5.
**Baza:** `origin/rust-port/parity-v2` = `d961b14b4` (zawiera `84136f57` i `d961b14b`).
**Pin weba (cel):** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Pin dotychczasowy:** `edb8fb56` (bez zmian w manifestach).
**Status tematu:** OTWARTY. Część D1 (`work-tax.ts`) PORTOWANA. Cel GOAL (cały REPIN krok 4b) NIEOSIĄGNIĘTY: `economy.ts` ma sklasyfikowane hunki, ale niezportowane.

## Odpowiedzi na zarzuty Evaluatora R2

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | `economy.ts` nieanalizowany, temat niezamknięty | **PRZYJMUJĘ** częściowo: klasyfikacja wszystkich 41 hunków `git diff -U0 edb8fb56 91dc998a -- gra/src/game/economy.ts` wykonana (sekcja „Klasyfikacja economy.ts"). Port hunków NIE wykonany w tej rundzie, temat zostaje otwarty z tym samym ID. | sekcja niżej; SHA commitu R3 w raporcie |
| 2 | Numeracja rund niespójna (`1/5` vs R2) | **PRZYJMUJĘ**: ujednolicono do schematu R1/R2/R3 (nagłówek i sekcja bramek). | nagłówek powyżej |
| 3 | Baseline 1272 NIE_ZMIERZONO | **PRZYJMUJĘ**: zmierzono na pełnym drzewie `d961b14b4` (czysty target): **1538 passed / 0 failed**, 212 wyników (w tym doc-tests). Log: `logs/baseline-d961b14b4-test-results.log`. Różnica: 1551 = 1538 + 13 testów `p6_repin_d_work_tax` (wszystkie 13 nowe). Liczba 1272 z dispatchu jest nieaktualna (nie odpowiada `d961b14b4`). | log baseline; 1551 − 13 = 1538 |
| 4 | Brak wektorów brzegowych (`-0`, 1e300, 2^53) w repo | **PRZYJMUJĘ**: dodano zatwierdzony podzbiór brzegowy `web-vectors-edge.json` (484 + 1024 + 22 przypadki) wygenerowany URUCHOMIENIEM weba 91dc998a, generator committed w `logs/gen-vectors-edge.mts`, test bit-w-bit `p6_repin_d_work_tax_edge.rs` (3 testy, porównanie `to_bits`, więc znak zera jest sprawdzany). | `tests/p6_repin_d_work_tax_edge.rs`; wynik testu w raporcie |

Uwaga do zarzutu 4: generator dla głównego `web-vectors.json` (zestaw 1600 + 529 + 90 + 9 + 20 + 96) nadal NIE jest w repo (pozostał w katalogu roboczym poza repo). Zapisane jako luka: zestaw brzegowy w repo zastępuje brakujący dowód na przypadki skrajne, główny zestaw pozostaje zamrożony i zweryfikowany przez `7904`-przypadkowy weryfikator R2. Dołączenie generatora głównego zestawu to zadanie na następną rundę.

## Tabela: zmiana → web → Rust → test → status (work-tax)

| Zmiana (web, pin 91dc998a) | Plik:linia weba | Plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|
| `WorkTaxConversion` (typ wyniku) | `gra/src/game/work-tax.ts:2-6` | `rust-port/engine/src/domain/work_tax.rs` (`struct WorkTaxConversion`) | `parity_convert_work_pool_to_tax`, `parity_execute_manual_work_tax_conversion` | PORTOWANE |
| `taxForWorkAmount` | `work-tax.ts:8-12` | `work_tax.rs` `tax_for_work_amount` | `parity_tax_for_work_amount` (529), `boundary_tax_floor_and_rate_defaults`, `edge_tax_for_work_amount_bitexact` (484) | PORTOWANE |
| `ownerCanConvertWorkToTax` | `work-tax.ts:14-24` | `work_tax.rs` `owner_can_convert_work_to_tax` | `parity_owner_can_convert_work_to_tax` (90), `structural_can_convert_requires_human_and_targowisko` | PORTOWANE |
| `serializePendingWorkTax` | `work-tax.ts:26-28` | `work_tax.rs` `serialize_pending_work_tax` | `parity_serialize_pending_work_tax` (9), `structural_serialize_then_restore_roundtrip`, `edge_serialize_pending_work_tax_bitexact` (22) | PORTOWANE |
| `restorePendingWorkTax` | `work-tax.ts:30-41` | `work_tax.rs` `restore_pending_work_tax` | `parity_restore_pending_work_tax` (20), `structural_restore_rejects_bad_rows_and_overwrites_in_place` | PORTOWANE |
| `convertWorkPoolToTax` | `work-tax.ts:43-58` | `work_tax.rs` `convert_work_pool_to_tax` | `parity_convert_work_pool_to_tax` (1600), `edge_convert_work_pool_to_tax_bitexact` (1024), `structural_*`, `boundary_pool_and_request_are_sanitized` | PORTOWANE |
| `executeManualWorkTaxConversion` | `work-tax.ts:60-77` | `work_tax.rs` `execute_manual_work_tax_conversion` + trait `WorkTaxDeps` | `parity_execute_manual_work_tax_conversion` (96, kolejność wywołań `set`/`tax`) | PORTOWANE |

Nowy plik `work-tax.ts` jest w całości nowy (status A w REPIN-DELTA §3, wiersz 65), więc każda linia jest zmianą behawioralną.

## Klasyfikacja economy.ts (R3, zarzut 1)

Źródło: `git diff -U0 edb8fb56 91dc998a -- gra/src/game/economy.ts` = **41 hunków**, `+116/−213`. Numery linii = strona NOWA (`91dc998a`), odczytane z `grep -n` dla kluczowych wierszy (L871-1018) i z nagłówków hunków dla pozostałych; dla hunków czysto usuniętych podano miejsce usunięcia w pliku nowym (zakres przybliżony ±2 linie). Klasyfikacja: **PORTOWANE** (nie dotyczy), **NIE-DOTYCZY** (komentarze/typy bez zachowania), **NASTĘPNA-PARTIA** (zmiana zachowania, do portu hunk po hunku w kolejnych rundach).

| Grupa hunków (linie weba) | Zmiana | Status | Uzasadnienie / Rust |
|---|---|---|---|
| L45 (import) | import `applyCivMatrixParam` | NIE-DOTYCZY | sam import; zachowanie w wierszach niżej |
| L149-166, L237 (`EconParams`, `loadEconParams`) | usunięty `targowiskoPracaMnoznik` (`targowisko_praca_na_pieniadz_mnoznik`); komentarze `mennicaMnoznikPoWalucie` | NASTĘPNA-PARTIA | usunięcie Efektu 2 (Targowisko+Waluta) — zmiana zachowania |
| L326-341 (`CityYieldResult`) | `pieniadzZPracy` = 0 (pole zdeprecjonowane); komentarze | NASTĘPNA-PARTIA | zerowanie pola to zmiana wyniku |
| L644-660 (`CityYieldContext`, `maMennica`/`walutaOdkryta`) | tylko komentarze, nowa definicja bramki Mint | NIE-DOTYCZY | opis; logika w wierszu „Mint" |
| L668-671 (`dochodTrasHandlowych` usunięty) | usunięte pole dochodu tras | NASTĘPNA-PARTIA | zmiana wejścia `handelBrutto` |
| L674-675 (`additionalTax`) | nowe pole: Praca przeliczona ręcznie na podatek, wchodzi do puli podatku | NASTĘPNA-PARTIA | połączenie z `work_tax.rs` (adapter „integracja w turze"); kluczowe dla Z-WT-5 |
| L683-690 (`walutaMnoznikOverride` usunięty) | usunięty override mnożnika Mennicy | NASTĘPNA-PARTIA | zmiana formuły Mint |
| L703-745 (`mnoznikHandelPieniadzForCiv`, `…ByDifficulty`, `civMatrixMnoznikHandelPieniadzRaw`) | fallback 2→1; civs.json nieczytany; zero z macierzy jest wartością (`Number.isFinite` zamiast `>0`) | NASTĘPNA-PARTIA | zmiana kontraktu funkcji (wektory `economy` potrzebne) |
| L782-806 (`civBonusyForCivKey`, `civEconomyYieldMultipliers`) | mnożniki z bonusów cywilizacji zawsze `{handel:1, nauka:1}` | NASTĘPNA-PARTIA | zmiana zachowania |
| L871-889 (Step 3': `pieniadzPortu`, `eko_pieniadz_port_proc`) | Port: pieniądz z portu × współczynnik cywilizacji, raz, przed mnożnikami | NASTĘPNA-PARTIA (częściowo istnieje) | Rust ma już odczyt tego klucza w `rust-port/engine/src/domain/city_growth.rs:2864-2876`; zgodność z 91dc998a wymaga porównania hunk po hunku |
| L901-902 (`pracaNetto`) | `applyCivMatrixParam(…, 'eko_praca_proc')`, zero neutralne | NASTĘPNA-PARTIA | nowy klucz macierzy, brak w Rust |
| L910-914 (`pieniadzZPracy = 0`, `handelBazowy` bez pracy) | usunięcie D5 (Praca→Handel u źródła) | NASTĘPNA-PARTIA | zmiana bazy Handlu |
| L919 (`civHandelMult`) | dla znanego właściciela macierz jest autorytatywna (także 0), legacy mnożnik tylko dla nieznanego | NASTĘPNA-PARTIA | zmiana zachowania |
| L933-936 (`eko_handel_brutto_proc`, `additionalTax`) | mnożnik brutto Handlu z macierzy; podatek z Pracy dodany PO mnożnikach tras | NASTĘPNA-PARTIA | jw. |
| L940-943 (`eko_korupcja_proc`) | korupcja z macierzy, cap `korupcjaCap` | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L946-947 (Mint) | `walutaMnoznikBase = params.mennicaMnoznikPoWalucie` (bez override) | NASTĘPNA-PARTIA | jw. |
| L964-965 (`eko_luksus_proc`) | luksus z macierzy | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L976-981 (`eko_nauka_proc`) | nauka lokalna z macierzy zamiast `civNaukaMult` | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L986-989 (`eko_pieniadz_proc`) | pieniądz końcowy z macierzy (Step 8) | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L1004-1005 (`eko_zywnosc_proc`) | żywność brutto z macierzy po Garncarni | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L1017-1018 (`eko_kultura_proc`) | kultura budynków z macierzy | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| pozostałe hunki (komentarze Step 3/5/7/8, opisy pól) | tylko tekst | NIE-DOTYCZY | bez zachowania |

Wniosek R3: część `economy.ts` jest zakresem następnych rund (≈14 grup zmian zachowania; 8 nowych kluczy macierzy `eko_*`, z których w Rust istnieje tylko `eko_pieniadz_port_proc`). Klasyfikacja nie jest portem: żaden z tych hunków nie ma jeszcze kodu Rust ani wektora.

## Założenia (luki rozstrzygnięte ZAŁOŻENIEM)

- Z-WT-1: liczby JS → `f64`; `Number.isFinite` → `f64::is_finite`; identyfikatory właściciela → `f64` (zachowuje odrzucanie NaN/Infinity bez zakładania typu w silniku).
- Z-WT-2: `restorePendingWorkTax(unknown)` → `serde_json::Value`; liczba = `Value::Number`, reszta nie-liczba.
- Z-WT-3: `Map<number, number>` → `Vec<(f64, f64)>` w kolejności wstawiania; duplikat klucza nadpisuje wartość na istniejącej pozycji (jak `Map.set`).
- Z-WT-4: `deps` → trait `WorkTaxDeps` (lustro kontraktu zywej gry; adapter gry nie jest częścią tej partii).
- Z-WT-5: w tej partii NIE podpinano funkcji do silnika (brak wywołań w `state`/`session`); integracja z turą to osobna partia po `economy.ts` (`additionalTax`), bo web `work-tax.ts` nie ma wywołań turowych (`No turn automation lives here`).
- Z-WT-6 (R3): wektory brzegowe kodowane jako `{"f": String(x)}` (`-0` jako `"-0"`); Rust `f64::from_str` daje ten sam bit-pattern; wykluczono `serde_json` jako źródło liczb (liczby w edge nie przechodzą przez parser liczb JSON).

## Wektory

- `rust-port/engine/tests/p6_repin_d_work_tax_vectors/web-vectors.json` (≈317 KB, ≤10 MB): zestaw główny, zamrożony.
- `rust-port/engine/tests/p6_repin_d_work_tax_vectors/web-vectors-edge.json` (≈200 KB, R3): przypadki brzegowe `-0`, `±0.5`, `0.999999999`, `1.0000001`, `2.9999999999999996`, `±1e300`, `2^53`, `2^53+2`, `MAX_VALUE`, `MIN_VALUE`, `1.5e-300`, `129419.99999999999`, `0.1+0.2`, `±Infinity`, `NaN`. Kombinacje: tax 22×22=484, convert 8×8×8×2=1024, serialize 22 (mapy z kluczami z brzegów; duplikaty i `-0`/`+0` zgodnie z `Map`).
- Generator główny (1600/529/90/9/20/96 przypadków): URUCHOMIENIE `work-tax.ts` z `91dc998a` pod node 22 — poza repo; luka opisana w odpowiedzi na zarzut 4.
- Generator brzegowy: `logs/gen-vectors-edge.mts` (w repo, dowód odtwarzalności).
- Weryfikator niezależny R2 (7904 przypadki, poza repo): 0 rozbieżności.

## Mutacje

- M1 (R1): `candidate_tax > 0.0` → `>= 0.0` w `convert_work_pool_to_tax`: 3 testy padają. Zabite.
- M2..M7 (R2, na `d0dfe1f89`, jedna naraz, plik przywracany):
  - M2 `pool.min(request)` → `pool.max(request)`: 5 testów.
  - M3 `work_spent > 0.0` → `>= 0.0` w `execute_manual_work_tax_conversion`: 1 test.
  - M4 `amount > 0.0` → `>= 0.0` w `restore_pending_work_tax`: 2 testy.
  - M5 `is_human_owner` → `true` w `owner_can_convert_work_to_tax`: 2 testy.
  - M6 usunięty `.floor()` w `tax_for_work_amount`: 4 testy.
  - M7 `enabled` ignorowane w `convert_work_pool_to_tax`: 3 testy.
- M8 (R3, znak zera): `work.floor().max(0.0)` → `work.floor()` w `tax_for_work_amount`. Wynik: `edge_tax_for_work_amount_bitexact` pada (wejście `-0` daje `-0` zamiast `+0`), a także `boundary_tax_floor_and_rate_defaults` i `parity_tax_for_work_amount` z zestawu głównego. Zabite; `work_tax.rs` przywrócony (`git checkout`, `git diff --quiet` czysty). Log: `logs/mut-M8-negzero-edge.log`.
- M8+ (mutacje `economy.ts`): NIE_ZMIERZONO, bo kodu economy w Rust nie ma.

## Bramki (R3, na commicie z edge)

- `cargo fmt --all -- --check`: EXIT=0 (po `cargo fmt --all` na nowym pliku brzegowym).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (czysty target po czyszczeniu).
- `cargo test --no-fail-fast` (rust-port/engine, czysty target): EXIT=0, **1554 passed / 0 failed**, 214 wyników (212 + 2 nowe pliki testów). Składnik: 1538 (baseline `d961b14b4`) + 13 (`p6_repin_d_work_tax`) + 3 (`p6_repin_d_work_tax_edge`).
- Baseline: `logs/baseline-d961b14b4-test-results.log` (1538/0, EXIT=0, pełne drzewo `d961b14b4` z `git archive`, czysty target).
- `git diff --check`: wykonany przed commitem R3 (wynik w raporcie).
- Log uruchomienia R3: `logs/test-r3-summary.log`.

## Kolejne partie (NASTĘPNA-PARTIA, ten sam ID)

1. `economy.ts` hunk po hunku wg klasyfikacji wyżej, po kolejności: (a) Mint i `walutaMnoznikOverride`, (b) `mnoznikHandelPieniadzForCiv` i `civEconomyYieldMultipliers`, (c) klucze `eko_*` w kolejności przepływu (praca, handel brutto, korupcja, luksus, nauka, pieniądz, żywność, kultura), (d) Step 3' port, (e) `additionalTax` (adapter, Z-WT-5).
2. Wektory `economy` z weba 91dc998a (pliki ≤10 MB) i generator główny work-tax dodany do `logs/`.
3. Mutacje na nowych gałęziach `economy.ts`.
4. Odświeżenie pinu / kopii bajtowych (poza tym tematem, REPIN-DELTA §6).

## Partia D2.1 (R-RUSTPORT-REPIN-EKONOMIA-D-Q1, runda 1 Operatora po R3) — mnozniki Handel→Pieniadz

Port od zera do `rust-port/engine/src/domain/economy_yield.rs` (nowy modul, `pub mod economy_yield;` w `domain/mod.rs`). W silniku NIE istnieje jeszcze odpowiednik `cityYieldPerTurn`, wiec ta partia obejmuje tylko czyste funkcje z `economy.ts@91dc998a`. Zakres: 4 zmiany zachowania z klasyfikacji R3 (pierwsza partia z grupy „mnozniki”).

| Zmiana (web, pin 91dc998a) | Plik:linia weba (`economy.ts`) | Plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|
| `mnoznikHandelPieniadzForCiv`: fallback 2→1, `civs.json` ignorowane | L704-711 | `economy_yield.rs:53` `mnoznik_handel_pieniadz_for_civ` | `parity_mnoznik_for_civ_main` (588), `parity_mnoznik_for_civ_zero_matrix` (588) | PORTOWANE |
| `civMatrixMnoznikHandelPieniadzRaw`: `>0` → `Number.isFinite` (surowe zero macierzy jest wartoscia), pusty klucz = brak | L717-728 | `economy_yield.rs:42` `civ_matrix_mnoznik_handel_pieniadz_raw` | `structural_known_raw_zero_is_authoritative_and_gets_delta`, `structural_empty_or_missing_key_is_unknown`, wektory `zero` | PORTOWANE |
| `MNOZNIK_HANDEL_TRUDNOSC_DELTA` (easy +0.5 / normal 0 / hard −0.5) | L738-742 | `economy_yield.rs:31` `mnoznik_handel_trudnosc_delta` | `boundary_trudnosc_delta_table` | PORTOWANE |
| `mnoznikHandelPieniadzForCivByDifficulty`: bez czytania `civs.json`; brak wiersza → `fallbackScaled` bez drugiej delty | L753-762 | `economy_yield.rs:63` `mnoznik_handel_pieniadz_for_civ_by_difficulty` | `parity_mnoznik_by_difficulty_main` (1029), `parity_mnoznik_by_difficulty_zero_matrix` (1029), `structural_unknown_key_returns_fallback_without_delta` | PORTOWANE |
| `civEconomyYieldMultipliers` → zawsze `{handel:1, nauka:1}` | L781-786 | `economy_yield.rs:84` `civ_economy_yield_multipliers` | `parity_civ_economy_yield_multipliers` (4) | PORTOWANE |

**Pozostale hunki `economy.ts` (z klasyfikacji R3) — NASTEPNA-PARTIA, bez zmian statusu:** `EconParams`/`targowiskoPracaMnoznik` (L149-166, L237); `CityYieldResult.pieniadzZPracy = 0` (L326-341); `dochodTrasHandlowych` (L668-671); `additionalTax` (L674-675); usuniecie `walutaMnoznikOverride` i bramka Mint (L683-690, L946-947; Mint wymaga `cityYieldPerTurn`, ktorego Rust jeszcze nie ma); Step 3' port `eko_pieniadz_port_proc` (L871-889); `pracaNetto` `eko_praca_proc` (L901-902); D5 `pieniadzZPracy` (L910-914); `civHandelMult` (L919); `eko_handel_brutto_proc` (L933-936); `eko_korupcja_proc` (L940-943); `eko_luksus_proc` (L964-965); `eko_nauka_proc` (L976-981); `eko_pieniadz_proc` (L986-989); `eko_zywnosc_proc` (L1004-1005); `eko_kultura_proc` (L1017-1018).

### Wektory i pochodzenie (D2.1)

- `rust-port/engine/tests/p6_repin_d_economy_vectors/mnoznik-main.json` (588 + 1029 + 4 przypadkow) i `mnoznik-zero.json` (ta sama siatka na kopii macierzy, patrz nizej). Generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-D-Q1/logs/gen-vectors-mnoznik.mts`.
- Wykonanie: node 22.22, `--experimental-strip-types` + loader JSON (`logs/loader-hooks.mjs`, `logs/loader-register.mjs`). Kod weba uruchamiany to **doslowny wycinek** `economy.ts@91dc998a` L703-762 i L781-786 (`logs/economy-mnoznik-slice.mts`; zmiana tylko w specyfikatorze importu `./civ-matrix.ts` i aliasach typow), oraz `civ-matrix.ts@91dc998a` i `civ-matrix.json@91dc998a` (identyczny z `rust-port/engine/data/civ-matrix.json`, sprawdzone `cmp`). **Luka:** pelny `cityYieldPerTurn` nie byl uruchamiany (zaleznosci: `production.ts`, `terrain-improvements.ts`, dane terenu) — ZALOZENIE: wycinek funkcji mnoznikowych jest wystarczajacy dla tej partii; reszta w kolejnych partiach.
- Wektor `zero`: kontrolowana kopia macierzy (`logs/make-zero-matrix.mjs`): wiersz 0 (`grecy`) `meta_mnoznik_waluta = 0`, wiersz 1 (`rzymianie`) bez pola (=> domyslna `2`). Kopia poza repo, wejscie kontrolowane, nie zmiana danych gry.
- Porownanie bit-w-bit (`to_bits`), liczby jako `{"f": String(x)}`; NaN/±0/±Infinity pokryte.
- Mutacje (jedna naraz, przywracane, `logs/mut-D2-*.log`): M1 `is_finite`→`>0` (3 testy), M2 delta hard `-0.5`→`+0.5` (4 testy), M3 brak delty w `by_difficulty` (3), M4 delta dodana do fallbacku (3), M5 pominiete sprawdzenie wiersza (6). Zabite 5/5.

### Weryfikacja niezalezna D2.1 (Operator-pomiary R2, ten sam ID)

- Wycinek weba: `logs/verifier-r2-slice.mts` = `economy.ts@91dc998a` L703-762 + L781-786 (roznica wzgledem linii zrodla: tylko importy i aliasy typow).
- Wektory niezalezne: `logs/verifier-r2-gen.mts` (uruchomienie weba 91dc998a, node 22.22), 82 klucze (wszystkie id macierzy, warianty wielkosci liter, spacja, `null`, `undefined`), fallbacki `0, -0, 0.5, 1, 2, 2.5, -1, 1e-300, 3.14159, NaN, ±Infinity, default`. Wynik: `logs/verifier-r2-main.json` (1066 forCiv + 2952 byDiff). Replay w Rust (tymczasowy test poza commitem, usuniety): **4018/4018 bit-w-bit**, log `logs/verifier-r2-run.log`.
- Mutacja V2 (niezalezna): znak delty `easy` `+0.5`→`-0.5`. Zabita: `boundary_trudnosc_delta_table`, `parity_mnoznik_by_difficulty_main`, `parity_mnoznik_by_difficulty_zero_matrix`, `structural_known_raw_zero_is_authoritative_and_gets_delta` (log `logs/mut-V2-easy-sign.log`). Plik przywrocony (`git checkout`).
- Bramki (R2, na 7a7c09bad): `cargo fmt --all -- --check` EXIT=0 (`logs/fmt-r2.log`); `cargo clippy --all-targets -- -D warnings` EXIT=0 (`logs/clippy-r2.log`); `cargo test --no-fail-fast` EXIT=0, 215 binarek, **1566 passed / 0 failed** (`logs/test-r2-full.log`).
- Luka nieweryfikowana: pelny `cityYieldPerTurn` nadal NIE uruchamiany (Z-D2-2); liczba 41 hunkow `economy.ts` NIE_ZMIERZONO w tej rundzie.

## Odpowiedzi na zarzuty Evaluatora R4 (Operator, ten sam ID)

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | Generator głównego zestawu `web-vectors.json` (work-tax) nie jest w repo; `gen-vectors-verifier.mts` to nie dowód | **PRZYJMUJĘ** jako lukę, której NIE da się zamknąć przez odtworzenie generatora: oryginalnego generatora nie odzyskano (przeszukano: repo i `logs/` runów D1/D2, `/tmp` sesji, scratchpad). Zamiast tego dodano weryfikację WYJŚĆ: `logs/rerun-work-tax-frozen.mts` bierze zamrożone wejścia z `web-vectors.json`, uruchamia `gra/src/game/work-tax.ts@91dc998a` (node 22.22, kopia `git archive` poza repo) i porównuje wyjścia (`Object.is`, znak zera). Wynik: 2344/2344, 0 rozbieżności (tax 529, convert 1600, canConvert 90, serialize 9, restore 20, exec 96). Zestaw zamrożony jest więc wyjściem weba 91dc998a. Generator wejść pozostaje ZAŁOŻENIEM Z-WT-7 (wejścia zamrożone, nie regenerowane). | `logs/rerun-work-tax-frozen.log` (EXIT=0) |
| 2 | Zakres rundy (port 41 hunków) vs D2.1; temat niezamknięty | **PRZYJMUJĘ** (bez zmiany kodu): zgodnie ze zleceniem tej rundy zakres to D2.1. Temat pozostaje OTWARTY z tym samym ID; D2.2+ (Mint/override, `eko_*`, `additionalTax`, `dochodTrasHandlowych`, brak `cityYieldPerTurn`) są kolejnymi rundami. | sekcja „Partia D2.1” i „Kolejne partie” |
| 3 | Mutant przeżywający: usunięcie `value.is_finite()` w `civ_matrix_mnoznik_handel_pieniadz_raw` | **PRZYJMUJĘ**: mutant NIE był równoważny w sensie kontraktu funkcji (web L717-728: `Number.isFinite(raw) ? raw : undefined`); wejście nieskończone/NaN w wierszu znanej cywilizacji jest osiągalne w `CivMatrixFile` (pole `Num::Float`), nie tylko przez JSON. Dodano test `structural_non_finite_matrix_value_is_unknown` (NaN, +Inf, -Inf => `None` => fallback dla `forCiv` i `byDifficulty`). Mutant zabity: 1 test padł (`logs/mut-R4-is-finite.log`), kod przywrócony, `git diff` źródła pusty. | `tests/p6_repin_d_economy_mnoznik.rs` (nowy test); `logs/` |

Testy po poprawce (R4): `cargo test --no-fail-fast` 215 binarek, 1567 passed / 0 failed (1566 + 1 nowy test).
Numeracja: ta runda to R4 (zarzuty R3 → poprawka R4). Numeracja wg dispatchu: runda 4/5 (limit 5; po limicie DECISION_REQUIRED).

### Założenie Z-WT-7 (R4)

- Generator wejść głównego zestawu work-tax (1600/529/90/9/20/96) jest nieodzyskany. Zestaw zamrożony traktujemy jako dane wejściowe; dowodem jego zgodności z webem 91dc998a jest ponowne uruchomienie wyjść (`logs/rerun-work-tax-frozen.mts`). Jeśli właściciel wymaga regeneracji wejść, to osobny temat.

### Weryfikacja niezalezna D2.2a (Operator-pomiary R1, ten sam ID `R-RUSTPORT-REPIN-EKONOMIA-D2-Q1`)

- Kod sprawdzony wzrokowo wzgledem `economy.ts@91dc998a` L908-1009: kolejnosc krokow, `Math.max(0, ..)` vs `js_max`, `Math.min` vs `js_min`, warunki `civKey` (truthy), `civNaukaMult` (`!== undefined && !== 1`), `premia > 0`, Mint (`walutaOdkryta && maMennica`), zwroty `handelBrutto`/`zywnoscBrutto` (`Math.floor`). Nie wykryto rozbieznosci.
- Regeneracja wektorow: `logs/verifier-regen-web-91dc998a.log` (EXIT=0, "wrote 2400 cases"); kopia weba = `git archive 91dc998a gra/src gra/data` poza repo. Wynik **identyczny bajt-w-bajt** z `tests/p6_repin_d2_tail_vectors/tail-main.json` (`cmp`).
- Bramki (niezaleznie, na c9af459c3): `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0 (`logs/verifier-clippy-r1.log`); `cargo test --no-fail-fast` EXIT=0, 220 binarek, **1627 passed / 0 failed** (`logs/verifier-test-r1.log`); `tests/p6_repin_d2_tail` 12/12.
- Mutacje niezalezne (jedna naraz, przywracane `git checkout`, logi `logs/mut-verifier-*.log`):
  - M8 brak korupcja cap (`js_min` usuniete): ZABITA (2 testy).
  - M9 poborca przed macierza `eko_pieniadz_proc`: ZABITA (`parity_tail_main_bit_exact`).
  - M7 `eko_luksus_proc` bez koncowego `.floor()`: PRZEZYLA. W `civ-matrix.json` wszystkie 16 wartosci `eko_luksus_proc` = 0, wiec `floor` po mnozeniu nie ma efektu na danych i wektorach. Luka pokrycia, nie blad na danych.
  - M10 `eko_zywnosc_proc` bez `apply_civ_matrix_param`: PRZEZYLA. Wszystkie 16 wartosci `eko_zywnosc_proc` = 0. Analogicznie `eko_kultura_proc` = 0 we wszystkich wierszach (wniosek z danych, mutacja NIE_ZMIERZONO).
  - M11 `premia > 0` zmienione na `>= 0`: PRZEZYLA. Roznica tylko dla `premia == 0` i wejsciowego `-0` w `handelBrutto` (`x + 0 = +0`); wektory nie zawieraja takiego przypadku. Mutant prawie-rownowazny (roznica znaku zera).
- ZALOZENIE dla D2.2b (kod nie zmieniony w tej rundzie): dodac testy strukturalne z NIEZEROWA macierza dla `eko_luksus_proc`, `eko_zywnosc_proc`, `eko_kultura_proc` (wartosc niecalkowita, zeby `floor` mial efekt) oraz przypadek `handelBrutto = -0` z `premia = 0`. Wtedy M7, M10, M11 zostana zabite.
- Poza zakresem: w `rust-port/engine/` pozostaja nieśledzone `Cargo.lock` i `target/` (artefakty builda); NIE dodawane do commita.

## Odpowiedzi na zarzuty Evaluatora D2.2a (Operator R2, ten sam ID `R-RUSTPORT-REPIN-EKONOMIA-D2-Q1`)

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | M7 (`eko_luksus_proc` bez `.floor()`) przeżywa; brak niezerowej macierzy | **PRZYJMUJĘ**: test `synthetic_luksus_matrix_applied_then_floored` (macierz syntetyczna `eko_luksus_proc = 0.37`, wejście 33 => `floor(33*1.37)=45`). Mutant ZABITY. | `tests/p6_repin_d2_tail.rs`; `logs/mut-R2-M7-luksus-nofloor.log` |
| 2 | M10 (`eko_zywnosc_proc` bez macierzy) przeżywa | **PRZYJMUJĘ**: `synthetic_zywnosc_matrix_applied_to_brutto_and_netto` (`0.41`, 33 => brutto 46). ZABITY. | `logs/mut-R2-M10-zywnosc-nomatrix.log` |
| 2b | `eko_kultura_proc` bez pokrycia (zarzut Operatora R1 z dopiskiem NIE_ZMIERZONO) | **PRZYJMUJĘ**: `synthetic_kultura_matrix_applied_and_floored` (`0.23`, 33 => 40). ZABITY. | `logs/mut-R2-M12-kultura-nomatrix.log` |
| 3 | M11 (`premia > 0` => `>= 0`) przeżywa; brak dowodu równoważności | **PRZYJMUJĘ jako dowód równoważności** (mutant NIE jest zabijalny; kod bez zmiany tej gałęzi). Dowód niżej. | `economy_yield.rs` `if premia > 0.0`; `logs/mut-R2-M11-premia-ge0.log` (18/18 zielone) |
| 4 | Nieprzewidziany przez Evaluatora: `js_max(0, -0)` w Rust zwraca `-0`, a web `Math.max(0, -0)` daje `+0` | **PRZYJMUJĘ** (defekt parity odkryty przy pisaniu testu `boundary_additional_tax_negative_zero_is_positive_zero`, który przed poprawką padał: `handel = -0.0`). Poprawka: lokalna `js_math_max_zero` w `economy_yield.rs` (NaN propaguje; `x > 0` => `x`; inaczej `+0`); import `js_max` usunięty. `js_compat::js_max` w `civ_matrix.rs` NIE zmieniany (poza allowlistą). | przed poprawką test padał z `handel = -0.0` (log terminala, nie zapisany); po poprawce 18/18 |
| 5 | Zakres: Step 1-4, Step 3', `eko_praca_proc`, Mint/override, `dochodTrasHandlowych`, `additionalTax` i pełne `cityYieldPerTurn` niezportowane | **PRZYJMUJĘ jako stan zakresu** (nie jest podstawą FAIL wg Evaluatora); bez zmiany w tej rundzie. Kolejna partia: D2.2c (Step 1-4 + Step 3'). Temat pozostaje OTWARTY. | sekcja „Kolejne partie” |
| 6 | Niezależność weryfikatora: weryfikacja D2.2a była autorstwa Operatora | **PRZYJMUJĘ jako uwagę procesową**: rola niezależna nie jest zapewniona. Regeneracja wektorów z weba 91dc998a (`cmp` bajt-w-bajt) jest powtarzalna komendą z logu; Evaluator odtworzył ją samodzielnie. | `logs/verifier-regen-web-91dc998a.log` |
| 7 | `Cargo.lock` nieśledzony | Nie jest zarzutem; bez zmian (poza commitem). | — |

### Dowód równoważności mutanta M11 (`premia >= 0`)

Gałąź różni się wyłącznie dla `premia == ±0` (dla `premia > 0` i NaN zachowanie identyczne). W oryginale `premia == ±0` nie dodaje nic, w mutancie dodaje `±0` do `handel_bazowy * mnoznik_trasy`: `x + (±0) = x` dla każdego `x` poza `x = -0` (gdzie `-0 + +0 = +0`). Ogon zwraca `handelBrutto` jako:
`f(x) + m`, gdzie `f` to mnożnik macierzy `eko_handel_brutto_proc` (`f(±0) ∈ {±0}`, `f(NaN) = NaN`, `0*Inf = NaN`) oraz `m = js_math_max_zero(additional_tax ?? 0) ∈ {+0} ∪ (0,∞) ∪ {NaN}`.
- `m = +0`: `f(±0) + (+0) = +0` w obu wariantach.
- `m > 0`: `f(±0) + m = m` w obu wariantach.
- `m = NaN`: `NaN` w obu wariantach.
Zatem wynik bitowy jest identyczny dla każdego wejścia; `m` jest zawsze nieujemne (po `js_math_max_zero`), co jest warunkiem dowodu. Mutant jest równoważny, a Z-VER-2 (przeżycie M7/M10/M11 jako luka pokrycia) jest ZAMKNIĘTE dla M7/M10/M12 testami, a dla M11 dowodem.

### Wynik bramek (R2)

- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`logs/clippy-r2.log`).
- `cargo test --no-fail-fast`: EXIT=0, 220 binarek, **1633 passed / 0 failed** (`logs/test-r2-full.log`); baseline 1627 + 6 nowych testów.
- `tests/p6_repin_d2_tail`: 18/18 (12 wcześniejszych + 6 nowych); `parity_tail_main_bit_exact` nadal bit-w-bit (2400/2400).
- Mutacje (jedna naraz, przywracane z kopii — nie `git checkout`): M7 ZABITA (1 test), M10 ZABITA (1 test), M12 ZABITA (1 test), M11 równoważny (0 zabitych, dowód wyżej).

### Założenie Z-VER-3 (R2)

- `js_compat::js_max` (`civ_matrix.rs`) zwraca `-0` dla `(0, -0)`, różnie od JS. Poza tym tematem (inne moduły korzystają z niego) — nie zmieniane w tej rundzie; lokalna wersja w `economy_yield.rs`. Propozycja: osobny temat „js_compat zero sign” z przeglądem wszystkich wywołań `js_max` / `js_min`.

## D2.2b (runda 2 operatora, częściowo) — Step 2 + Step 3' + praca netto

Web: `gra/src/game/economy.ts@91dc998a` L849-860 (Step 2 Młyn→Cegielnia), L884-890 (Step 3' bonus portu `eko_pieniadz_port_proc`), L892-903 (`pracaNetto` = `eko_praca_proc`). Port: `city_yield_head` w `economy_yield.rs`; wektory `tests/p6_repin_d2_head_vectors/head-main.json` (1200 przypadków, generowane URUCHOMIENIEM weba 91dc998a; generator `logs/gen-head.mts`, wycinek `logs/economy-head-slice.mts` verbatim); testy `tests/p6_repin_d2_head.rs` (11 testów).

- Pin webu: `origin/main` = `7164f7ca1`; od `91dc998a` zmieniono 84 pliki, ale NIE `economy.ts`, `production.ts`, `terrain-improvements.ts`, `civ-matrix.ts`, `diplomacy-economy.ts`, `turn-economy.ts` ani `gra/data/*` — wektory z 91dc998a pozostają aktualne.
- NIEPORTOWANE w tej partii (NASTĘPNA-PARTIA D2.2c): Step 1 (`tileYield`, `terrainModifier`, ulepszenia i rudy), Step 3 (akumulacja `buildingValue` / `buildingHappinessAtLevel`), Step 4 (`cityPracaInteger`, `splitPraca`), zależności `production.ts` i `terrain-improvements.ts`. Wejścia `pracaTerenu`, `pracaBudynkow`, `pieniadzBudynkow`, `pieniadzPortu` podawane jawnie.
- Założenie Z-D2.2b-1: `pieniadzPortu` = suma `buildingValue(..., 'pieniadz')` budynków o `id === 'port'` (Step 3 web, L871-886), liczona w D2.2c.
- Założenie Z-D2.2b-2: `praca_budynkow` i `praca_terenu` są agregatami z D2.2c; ta partia nie zmienia ich wartości.
- Wynik bramek (R2 operatora): `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` EXIT=0, 225 binarek, **1658 passed / 0 failed** (baza 1647 + 11 nowych); `p6_repin_d2_head` 11/11, `parity_head_main_bit_exact` 1200/1200 bit-w-bit.
- Mutacje (jedna naraz, przywracane z kopii): M1 wyłączony mnożnik Cegielni — ZABITA (4 testy); M2 zdjęty strażnik `portRaw !== 0` — ZABITA (2); M3 dopuszczony pusty klucz cywilizacji — ZABITA (1); M4 zdjęty bonus Młyna — ZABITA (3).

### Weryfikacja niezależna (R2, Operator-pomiary, 2026-10-30)

- Web: `origin/main` = `7164f7ca1`; sprawdzone `git diff 91dc998a origin/main` dla `economy.ts`, `production.ts`, `terrain-improvements.ts`, `civ-matrix.ts`, `diplomacy-economy.ts`, `turn-economy.ts` i `gra/data/*` — brak zmian; pin `91dc998a` aktualny dla D2.2b.
- Bramki ponownie: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --all-targets -- -D warnings` EXIT=0; `cargo test --no-fail-fast` EXIT=0, 225 binarek, 1658 passed / 0 failed (`logs/verifier-test-full-r2.log`).
- Mutacje (jedna naraz, przywracane `git checkout`): M1 ZABITA (4 testy, korekta z „3+”: `logs/mut-r2-M1-cegielnia.log` ma 4× `FAILED`), M2 ZABITA (2), M3 ZABITA (1), M4 ZABITA (3). Logi: `logs/mut-r2-M1..M4*.log`.

## Odpowiedzi na zarzuty Evaluatora D2.2b (Operator-obrona R2, ten sam ID `R-RUSTPORT-REPIN-EKONOMIA-D2-Q1`)

Stan: temat **OTWARTY** (nie zamykać na tej partii). Baza kodu: `8a3baa6ab`; ocenione: `93e5b76c6`; obrona: commit tej rundy (SHA w raporcie `04-operator-obrona-r2.md`).

1. **Zakres r2 niedomknięty; założenie Z-D2.2b-1 nieprzetestowane** — **PRZYJMUJĘ**. Temat zostaje OTWARTY. Kod nie zmieniany. Zamknięcie tematu wymaga partii D2.2c (Step 1, Step 3 akumulacja, Step 4, Mint/`walutaMnoznikOverride`, `dochodTrasHandlowych`, `additionalTax`). Z-D2.2b-1 (`pieniadzPortu` = suma `buildingValue(..., 'pieniadz')` dla `record.id === 'port'`) jest potwierdzona **czytaniem** weba: `gra/src/game/economy.ts@91dc998a` L875-877 (`const buildingMoney = buildingValue(record, level, 'pieniadz')`; `if (record.id === 'port') pieniadzPortu += buildingMoney;`), ale **nie testem**. Test tej definicji wchodzi do D2.2c razem z Step 3.
2. **Niespójność liczby zabójstw M1 („4 testy” vs „3+”)** — **PRZYJMUJĘ**. Poprawna liczba to **4**: logi `logs/mut-r2-M1-cegielnia.log` oraz `logs/mut-d2.2b-M1-cegielnia-off.log` pokazują po 4 linie `FAILED` (`structural_mlyn_then_cegielnia_order`, `structural_cegielnia_alone_scales_terrain_only`, `synthetic_praca_matrix_uses_brutto_after_mlyn`, `parity_head_main_bit_exact`). Ujednolicono w tym dokumencie (linia „M1 ZABITA (4 testy…)” wyżej i sekcja D2.2b, która już podawała 4). Wpis w `02-verifier-r2.md` nie podawał liczby testów dla M1 (tylko „zabite”), więc nie wymagał zmiany.
3. **Wektory 1200/1200 z wycinka, nie z pełnej funkcji** — **PRZYJMUJĘ** jako ograniczenie zakresu, z dowodem zgodności wycinka. Wycinek `logs/economy-head-slice.mts` względem `economy.ts@91dc998a` L849-860, L884-890, L892-903: porównanie mechaniczne (znormalizowane wcięcia, pomijając puste linie) — **31/31 niepustych linii webu obecnych w wycinku**, 0 brakujących. Wycinek zmienia tylko nagłówek funkcji i podaje agregaty `pracaTerenu`, `pracaBudynkow`, `pieniadzBudynkow`, `pieniadzPortu` jawnie. Zobowiązanie na D2.2c: wektory z **pełnej** funkcji `cityYieldPerTurn` (po portie Step 1-4), uruchomionej z weba `91dc998a`, zanim sygnatura zostanie zmieniona. Do tego czasu ochrona wektorów dotyczy wyłącznie `city_yield_head`.

Web pin: `origin/main` = `7164f7ca1`; `git diff 91dc998a origin/main` dla `economy.ts`, `production.ts`, `terrain-improvements.ts`, `civ-matrix.ts`, `diplomacy-economy.ts`, `turn-economy.ts`, `gra/data` — **pusty** (brak zmian). Pin `91dc998a` aktualny.

## D2.2c (runda 3 operatora, ten sam ID `R-RUSTPORT-REPIN-EKONOMIA-D2-Q1`) — pelna `cityYieldPerTurn` jako zlozenie

Web (pin): `gra/src/game/economy.ts@91dc998a` L819-1020 (cala funkcja `cityYieldPerTurn`). Port: `rust-port/engine/src/domain/economy_yield.rs` — `city_praca_integer`, `CityYieldParams`, `CityYieldInput`, `CityYieldOutput`, `city_yield_per_turn` (zlozenie `city_yield_head` + `city_yield_tail`). Test: `rust-port/engine/tests/p6_repin_d2_full.rs` (9 testow), wektory `tests/p6_repin_d2_full_vectors/full-main.json` (1200 przypadkow z URUCHOMIENIA PELNEJ funkcji weba 91dc998a, generator `logs/gen-full.mts`).

Stan klasyfikacji hunkow (pin 91dc998a):

| Hunk pinu | Zachowanie | Status | Dowod |
|---|---|---|---|
| L837-847 Step 1 (`tileYield`, sumy kafelkow) | sumowanie kafelkow przez `tileYield` (improvements, zloza) | NASTEPNA-PARTIA (Z-D2.2c-1) | wejscie `pracaTerenu`/`handelTerenu`/`zywnoscTerenu`; generator liczy przez eksportowane `tileYield` (petla 1:1) |
| L849-860 Step 2 (Mlyn, Cegielnia) | `city_yield_head` | ZROBIONE (D2.2b) | `structural_neutral_praca_is_mlyn_then_cegielnia_then_integer` |
| L865-882 Step 3 (sumy budynkow, `pieniadzPortu`) | sumowanie `buildingValue` po rekordach | NASTEPNA-PARTIA (Z-D2.2c-1); definicja `pieniadzPortu` = `record.id === 'port'` potwierdzona czytaniem L877 | generator mirror + wektory z rekordem `port` |
| L884-890 Step 3' (bonus portu) | `pieniadzBudynkow += pieniadzPortu * portRaw` przy wlascicielu | ZROBIONE (D2.2b, domkniete w kompozycji) | 164 wektorow z wlascicielem i niezerowym bonusem portu; `structural_port_bonus_requires_owner_and_nonzero_param` |
| L892-903 praca netto (`eko_praca_proc`) | `city_yield_head` | ZROBIONE (D2.2b) | wektory 1200/1200 |
| L909-910 `cityPracaInteger`, `pieniadzZPracy = 0` | `city_praca_integer`; `pieniadz_z_pracy` stale 0 | ZROBIONE (D2.2c) | `structural_praca_integer_rounds_and_zeroes_non_positive`, `structural_pieniadz_z_pracy_is_always_zero` |
| L914-936 handel brutto (civHandelMult, premia, `eko_handel_brutto_proc`, `additionalTax`) | `city_yield_tail` Step 4 | ZROBIONE (D2.2a/D2.2c) | `structural_additional_tax_enters_gross_trade_after_matrix` |
| L946-949 Mint (bez `walutaMnoznikOverride`) | `params.mennicaMnoznikPoWalucie` | ZROBIONE (w pinie nie ma override) | `city_yield_tail` |
| `dochodTrasHandlowych`, `walutaMnoznikOverride`, Targowisko (`pieniadzZPracy` > 0) | w pinie 91dc998a NIE istnieja (sprawdzone `grep` na pinie) | NIE-DOTYCZY dla pina | `grep -n dochodTrasHandlowych` na `economy-91dc998a` = pusto |
| L938-1018 Step 5-9 | `city_yield_tail` | ZROBIONE (D2.2a) | parity |

Zobowiazanie z D2.2b (wektory z PELNEJ funkcji przed zmiana sygnatury): SPELNIONE. Wektory `full-main.json` pochodza z uruchomienia `cityYieldPerTurn` (nie wycinka). Agregaty Step 1/3 sa wejsciem Rust, liczone przez eksportowane funkcje weba (`tileYield`, `buildingValue`, `buildingHappinessAtLevel`) petla 1:1 z L837-847 i L873-882.

Wynik: `parity_full_main_bit_exact` 1200/1200 bit-w-bit (12 pol wyniku, znak zera i NaN); mutacje M1 (`raw.round()`→`floor`), M3 (`additionalTax` wylaczone), M4 (kompozycja pomija bonus portu) ZABITE (logi `logs/mut-r3-*.log`).

Pin web: `git diff --stat 91dc998a 7164f7ca1` dla `economy.ts`, `production.ts`, `terrain-improvements.ts`, `civ-matrix.ts` — pusty. Gałąź `rust-port/parity-v2` (`a83ae51d6`) ma `gra/src/game/economy.ts` rozny od pinu (211+/155-): NIE_ZMIERZONO, dlaczego; wektory brane z pinu, nie z working tree.

Zalozenia rundy 3:
- Z-D2.2c-1: Step 1 (`tileYield`, `terrain-improvements.ts`, zloza) i Step 3 (sumowanie `buildingValue`, `buildingEffectAtLevel`) NIE sa portowane w Rust; sa wejsciem agregatow. Nastepna partia: port `tileYield` + `terrain-improvements` (484 LOC web) i `buildingValue` (production.ts), wtedy wektory z `cityYieldPerTurn(city, tiles, buildings)` bez agregatow.
- Z-D2.2c-2: definicja `pieniadzPortu` (`record.id === 'port'`) jest zweryfikowana przez wektory tylko dla rekordow syntetycznych o id `port`; mapowanie id z danych gry nie jest testowane.
- Z-D2.2c-3: parametry (`EconParams`) w wektorach z puli syntetycznej (jak w D2.2a/D2.2b); macierz cywilizacji = realna `civ-matrix.json` (przez web i przez `load_civ_matrix`).
- Z-D2.2c-4: generator wymaga `git archive 91dc998a gra` rozpakowanego do `gra/` oraz loadera TS (`typescript`, transpilacja `.ts`, rozwiazywanie importow bez rozszerzenia); instrukcja w `logs/gen-full.mts`.

Odpowiedzi na zarzuty Evaluatora: brak (runda 3 jest pierwsza po obronie R2, Evaluator nie wystawil jeszcze zarzutow dla D2.2c).
