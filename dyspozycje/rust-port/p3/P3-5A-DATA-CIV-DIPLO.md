# P3-5A — Dane cywilizacji i dyplomacji: JSON -> struktury Rust (R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1)

STATUS: Operator, runda 1/5 — wykonane, czeka na Evaluatora.
DOMAIN: GAME
BAZA: `origin/rust-port/parity-v2` @ `e72c74f7948938003f3811826ce48951879d1f26` (najnowszy HEAD w chwili pracy; dispatch
podawal `9e33fc77` jako przykladowy HEAD — `9e33fc77` jest przodkiem `e72c74f7`, wiec baza jest zgodna z dispatchem i nowsza).
PIN DANYCH: `gra/data/*.json` odczytane na `edb8fb56` (`git show edb8fb56:gra/data/<plik>`). Skopiowane 1:1; blob hash kopii
równy blob hash z pinu dla wszystkich 7 plików (patrz §3).

## 1. Zakres i allowlista

| Sciezka | Status | Uwagi |
|---|---|---|
| `rust-port/engine/data/civs.json` | NOWY (kopia 1:1) | blob `86fd13944ef63c6e22d390517d67a36dbf07c0ae` = pin |
| `rust-port/engine/data/civ-matrix.json` | NOWY (kopia 1:1) | blob `fc94205d99bb39339dbc2cd59072b00479f9defc` = pin |
| `rust-port/engine/data/civ-params.json` | NOWY (kopia 1:1) | blob `0ac5838b56e71a77191e4c44b2ff1c9eeedcd493` = pin |
| `rust-port/engine/data/civ-ai.json` | NOWY (kopia 1:1) | blob `2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf` = pin |
| `rust-port/engine/data/diplomacy.json` | NOWY (kopia 1:1) | blob `056c0ef91a5ae3a9a6c49d3027301b716a1540b4` = pin |
| `rust-port/engine/data/diplomacy-acceptance-points.json` | NOWY (kopia 1:1) | blob `19a43485fac5a64661a3b5d3645631c6fd0d588b` = pin |
| `rust-port/engine/data/city-names-pools.json` | NOWY (kopia 1:1) | blob `7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7` = pin |
| `rust-port/engine/src/data/civilizations.rs` | NOWY | 77 struktur `#[derive(Deserialize, Serialize)]`, enumy untagged, `include_str!` + `parse_*()` |
| `rust-port/engine/tests/data_civilizations.rs` | NOWY | 7 testow (po jednym na plik): parse + spot-checki + round-trip |
| `dyspozycje/rust-port/p3/P3-5A-DATA-CIV-DIPLO.md` | NOWY | ten dokument |
| `dyspozycje/autobot/runs/R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1/` | NOWY | `01-operator.md`, `gen-civilizations.py` (generator), logi `cargo-test-*.log` (w `.gitignore` jako `*.log`, lezy na dysku worktree) |

Nietkniete: `rust-port/engine/src/lib.rs`, `src/domain/mod.rs`, wszystkie istniejace pliki `.rs`, `gra/**`, `WERSJE.md`.
**`Cargo.toml` NIE zmieniony** — `serde` (feature `derive`) jest zwykla zaleznoscia, `serde_json` dev-dependency wystarcza
dla testow integracyjnych (modul `civilizations.rs` uzywa `serde_json::from_str` tylko w funkcjach `parse_*`, ktore sa wywolywane
wylacznie z testow). `Cargo.lock` wygenerowany przez build zostal usuniety z drzewa roboczego (nie w allowliscie, nie commitowany).

Modul nie jest podpiety do `lib.rs` (zakaz w dispatchu); test laduje go przez `#[path = "../src/data/civilizations.rs"]`.
`include_str!` w module uzywa `../../data/<plik>.json` (wzgledem `src/data/`), tak jak w P3-5D.

Odstepstwo od tresci dispatchu (zgodne z jego allowlista): dispatch pkt 4 mowi o `#[cfg(test)] mod tests` w tym samym pliku,
a pkt 5 i allowlista wskazuja `rust-port/engine/tests/data_civilizations.rs` jako wlasciwe miejsce testow. Wybrano wariant
z `tests/` (jak P3-5D), zeby nie dotykac `civilizations.rs` poza jego wlasnym kodem; `civilizations.rs` nie zawiera testow.

## 2. Jak powstaly struktury (1:1 z ksztaltem JSON, nie z pamieci)

Struktury NIE sa pisane recznie. Skrypt `gen-civilizations.py` (w katalogu runu) czyta FAKTYCZNY ksztalt kazdego pliku
z pinu (suma kluczy i typow wartosci po wszystkich rekordach danej sciezki) i generuje Rust:

- kazdy obiekt JSON -> `struct` z `#[serde(deny_unknown_fields)]`; kazdy klucz -> pole z `#[serde(rename = "<klucz JSON>")]`
  (rename zawsze, gdy identyfikator Rust rozni sie od klucza: polskie znaki, spacje, `_meta`, `Cywilizacja`, camelCase);
- typy liczb zachowane z JSON: calkowite -> `i64`, dziesietne -> `f64`, a gdy ten sam klucz ma w roznych rekordach obie formy
  -> enum `Num { Int(i64), Float(f64) }` (untagged). Przyklad: `civ-matrix.defaults.meta_mnoznik_waluta` = int `2`,
  ale `cywilizacje[0].params.meta_mnoznik_waluta` = float `2.3` -> `Num::Int(2)` / `Num::Float(2.3)`;
- pole, ktore w JSON bywa `null` -> `Option<T>` bez `skip_serializing_if` (round-trip zachowuje `null`);
- pole, ktore w roznych rekordach ma rozny typ (`bonusy[].wartosc`: liczba albo lista napisow; `zmiany_parametrów[].Zmiana`:
  napis albo liczba) -> enum `untagged` z wariantami per typ;
- slowniki o dynamicznych kluczach (`paramDefs`, `defaults`, `params` per cywilizacja, `pn_per_szt`, `przyklady`, `cena_baza`,
  pule nazw miast) -> `BTreeMap<String, T>`;
- wszystkie pola obecne we wszystkich rekordach danego obiektu (generator nie wykryl brakujacych kluczy ani mieszanki `null`/brak),
  wiec `default`/`skip_serializing_if` nie sa potrzebne.

Liczba typow (77 `pub struct`, 4 `pub enum` untagged: `Num` oraz 3 enumy zmiennych typow) jest wynikiem generatora; `diplomacy.params` ma 132 pola
(zgodnie z `jq`/Python: 132 klucze).

Dlaczego generator, a nie recznie: `params` ma 132 pola, `paramDefs` 93 wpisy, `cywilizacje[].params` 93 pola x 15 cywilizacji.
Recznie to stalo by sie zrodlem literowek; round-trip w testach (§4) dowodzi, ze wygenerowane typy nie gubia zadnego pola.

## 3. Kopie 1:1 — dowod

```text
$ git hash-object rust-port/engine/data/{civs,civ-matrix,civ-params,civ-ai,diplomacy,diplomacy-acceptance-points,city-names-pools}.json
86fd13944ef63c6e22d390517d67a36dbf07c0ae
fc94205d99bb39339dbc2cd59072b00479f9defc
0ac5838b56e71a77191e4c44b2ff1c9eeedcd493
2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf
056c0ef91a5ae3a9a6c49d3027301b716a1540b4
19a43485fac5a64661a3b5d3645631c6fd0d588b
7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7
$ git rev-parse edb8fb56:gra/data/{civs,civ-matrix,civ-params,civ-ai,diplomacy,diplomacy-acceptance-points,city-names-pools}.json
86fd13944ef63c6e22d390517d67a36dbf07c0ae
fc94205d99bb39339dbc2cd59072b00479f9defc
0ac5838b56e71a77191e4c44b2ff1c9eeedcd493
2e9cff80b39fdd38ce4e95ca4f64c5660e0e5adf
056c0ef91a5ae3a9a6c49d3027301b716a1540b4
19a43485fac5a64661a3b5d3645631c6fd0d588b
7ce011d1e6d34bdff73fd36fa475f52bd2a7fdc7
```

Rozmiary (bajty): civs 63037, civ-matrix 70801, civ-params 3547, civ-ai 5009, diplomacy 35194,
diplomacy-acceptance-points 3105, city-names-pools 30514 (razem 211207).

## 4. Spot-checki (liczone niezaleznie w Pythonie na pinie `edb8fb56`, wpisane jako stale w tescie)

| Plik | Pole | Wartosc z pliku (Python, pin) | Wartosc w tescie Rust |
|---|---|---|---|
| civs.json | liczba `cywilizacje` / `start_gry` | 15 / 11 | 15 / 11 |
| civs.json | `bonusy` lacznie / rekordy z lista w `wartosc` | 48 / 15 | 48 / 15 |
| civs.json | `cywilizacje[0].nazwyMiast` | 110 | 110 |
| civs.json | `cywilizacje[0].mnoznikHandelPieniadz` | 2.3 | 2.3 |
| civ-matrix.json | `paramDefs` / `defaults` / `cywilizacje` | 93 / 93 / 15 | 93 / 93 / 15 |
| civ-matrix.json | `cywilizacje[12]` (Babilonia) `tier` | 2 | 2 |
| civ-matrix.json | `defaults.meta_mnoznik_waluta` (int) / `cywilizacje[0].params.meta_mnoznik_waluta` (float) | 2 / 2.3 | `Int(2)` / `Float(2.3)` |
| civ-params.json | `cywilizacje[0].modWzrostu` / `modEkonomii` | 1 (int) / 1.02 (float) | `Int(1)` / `Float(1.02)` |
| civ-ai.json | `cywilizacje[0].agresywnosc` / `profilMapy` | 4 / kopia_typu_obronna | 4 / kopia_typu_obronna |
| diplomacy.json | `params.progSojuszRelacja` / `akcje_dyplomatyczne` / `perNacja` / `zmiany_parametrów` | 151 / 15 / 15 / 24 | 151 / 15 / 15 / 24 |
| diplomacy.json | `handel_zloze.cena_baza` (liczba kluczy) / `miedz` | 6 / 120 | 6 / 120 |
| diplomacy-acceptance-points.json | `traktaty.pokoj.punkty` | 500 | 500 |
| diplomacy-acceptance-points.json | `koszyk_pn.surowiec_ilosc.pn_per_szt` (kluczy) / `drewno` | 14 / 1 | 14 / 1 |
| city-names-pools.json | liczba pul / wpisow w kazdej / `grecy[0]` | 15 / 110 / Ateny | 15 / 110 / Ateny |

Test round-trip (`serde_json::to_value(&typed) == serde_json::from_str::<Value>(raw)`) dla kazdego z 7 plikow: OK.

## 5. Surowe logi `cargo test`

Srodowisko: `rustc 1.97.0`, `cargo 1.97.0` (jak w P3-1-2). Build z `CARGO_TARGET_DIR` w scratchpadzie poza worktree,
`CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_INCREMENTAL=0` (dysk `/`: 3.5 GB wolne).

### 5.1 Test celowany `cargo test --test data_civilizations -- --nocapture`, exit 0

Pelny log: `dyspozycje/autobot/runs/R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1/cargo-test-data-civilizations.log`.

```text
    Finished `test` profile [unoptimized] target(s) in 0.02s
     Running tests/data_civilizations.rs (.../scratchpad/p3-5a/target/debug/deps/data_civilizations-df3ee07bf38290c2)

running 7 tests
SPOT city-names pools=15 grecy.first=Ateny each=110
ROUNDTRIP city-names-pools.json: OK (bytes=30514)
test city_names_pools_json_parses_and_spot_checks ... ok
SPOT civ-params cywilizacje=15 grecy.mod_wzrostu=Int(1) grecy.mod_ekonomii=Float(1.02)
SPOT civ-ai cywilizacje=15 grecy.agresywnosc=4 grecy.profil_mapy=kopia_typu_obronna
ROUNDTRIP civ-params.json: OK (bytes=3547)
SPOT civ-matrix paramDefs=93 defaults=93 cywilizacje=15 babilonia.tier=2 grecy.meta=Float(2.3) default.meta=Int(2)
SPOT civs cywilizacje=15 start_gry=11 bonusy=48 grecy.mnoznik=2.3 listy_wartosc=15
ROUNDTRIP civs.json: OK (bytes=63037)
ROUNDTRIP civ-ai.json: OK (bytes=5009)
test civ_params_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
SPOT acceptance pokoj.punkty=500 pn_per_szt.len=14 drewno=1
ROUNDTRIP diplomacy-acceptance-points.json: OK (bytes=3105)
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
ROUNDTRIP civ-matrix.json: OK (bytes=70801)
test civ_matrix_json_parses_and_spot_checks ... ok
SPOT diplomacy params.prog_sojusz_relacja=151 akcje=15 per_nacja=15 zmiany=24 cena_baza.len=6
ROUNDTRIP diplomacy.json: OK (bytes=35194)
test diplomacy_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s
```

(Kolejnosc linii testow jest niedeterministyczna — rownolegly runner; wynik wszystkich 7: `ok`.)

### 5.2 Pelny `cargo test --no-fail-fast` w `rust-port/engine/` (wszystkie cele), exit 0

Pelny log: `dyspozycje/autobot/runs/R-RUSTPORT-P3-5A-DATA-CIV-DIPLO-Q1/cargo-test-full.log`.
Wynik: `EXIT=0`; 0 wierszy `test result` z `failed` > 0; 0 ostrzezen kompilacji (`grep -ci warning` = 0).
Suma wierzszy `passed` = **238**, w tym 7 nowych z `data_civilizations` (238 - 7 = 231 bez tego pliku testow).
Wiersz `0 passed` to doctest/lib bez testow.

```text
EXIT=0
```

## 6. Ograniczenia i uwagi

- Modul nie jest w `lib.rs`: dane sa parsowane i testowane, ale nie sa czescia API crate'a. Podpiecie = osobny temat konsolidacyjny (zgodnie z dispatchem).
- `loader/walidator` w runtime = P3.9 (poza zakresem). `parse_*()` sluzy tylko testom.
- Wartosci danych NIE sa korygowane (zakaz). Rozjazdy zaobserwowane przy okazji, do rozstrzygniecia przez wlasciciela danych, nie Operatora:
  - `civ-matrix.defaults.meta_mnoznik_waluta` = 2 (int) przy wartosci per-cywilizacja 2.3 — to celowe nadpisanie, nie blad parsowania; zachowane jako `Num`.
  - `civs.json` `Uwagi` jest `null` dla 3 cywilizacji (Rzymianie, Inkowie, Zulusi) — zachowane jako `Option<String>`.
- `Cargo.lock` nie jest w repo i nie jest commitowany (poza allowlista).
- Generator `gen-civilizations.py` zapisany w katalogu runu; uruchomienie: `python3 -I gen-civilizations.py <sciezka_wyjscia.rs>` (wymaga kopii pinu w katalogu `scratchpad/p3-5a/`, odtwarzalne przez `git show edb8fb56:gra/data/<plik>`).
- PUSH: NIE WYKONANO. Zero zmian w `gra/**`.

DEPLOY/PUSH: NIE WYKONANO
