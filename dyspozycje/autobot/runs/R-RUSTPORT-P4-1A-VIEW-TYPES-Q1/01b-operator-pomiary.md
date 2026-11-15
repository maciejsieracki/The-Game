# R-RUSTPORT-P4-1A-VIEW-TYPES-Q1: Operator (pomiary), runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1A-VIEW-TYPES-Q1
GOAL: Typy modelu widoku (DTO) z P4-1-RENDER-DTO-CONTRACT.md §3 jako osobny crate
      rust-port/view-model (serde camelCase, JSON-safe), testy JSON (round-trip, nazwy
      kluczy, niezmiennik ID) i pomiar rozmiaru snapshotu dla map 3000 i 8000 heksów.
ZMIANY/COMMIT: rust-port/view-model/tests/json_strict.rs (NOWY), tests/validate.rs (+2 testy,
      +3 przypadki), ten raport + 01b-pomiary/** (skrypt mutacji, wyniki TSV, przykład pomiaru);
      src/** BEZ ZMIAN. Baza: 86032cd28 (Operator impl). SHA w odpowiedzi Operatora.
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; test --all-targets EXIT 0
      (63 testy: 10+11+13+3+15+11, 0 ignored); git diff --check EXIT 0.
      Mutacje: fala 1 (72 mutanty) przed: 55 zabitych / 17 przeżyło; po: 71/72 (1 równoważny).
      Fala 2 (10 mutantów) na testach 86032cd28: 1/10; po: 10/10.
BLOKADY: brak technicznych. Uwagi w §5.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

## 0. Baza, izolacja, środowisko

- Dispatch: `git show origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/00-dispatch.md`. W pliku nadal nie ma **DODATKU r2** (ostatnia sekcja to „PROCES”). Wykonuję drugie wywołanie rundy 1: Operator (pomiary).
- Worktree ustawiony na `86032cd28` (commit Operatora impl). `git merge-base --is-ancestor 7817ef0c 86032cd28` daje prawdę. Rodzicem jest `525a2ef7b` = `origin/rust-port/parity-v2` w chwili dispatchu.
- Zakres diffu `525a2ef7b..HEAD` obejmuje wyłącznie `rust-port/view-model/**` i `dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/**`. Sprawdziłem to przez `git diff --name-only`. Zero zmian w `gra/**`, `rust-port/engine/**`, `rust-port/renderer/**`, `src-tauri/**`. `Cargo.lock` nie jest commitowany, bo `.gitignore` crate'u go wyklucza.
- Środowisko: `CARGO_TARGET_DIR` w scratchpadzie poza repo, usuwany przed bramkami i po nich. Ustawienia: `CARGO_INCREMENTAL=0`, `CARGO_PROFILE_DEV_DEBUG=0`, `CARGO_PROFILE_TEST_DEBUG=0`, `--offline`. Wersje: cargo/rustc 1.97.0, serde 1.0.229, serde_json 1.0.154.
- Maszyna: 4 vCPU Intel Xeon 2.10 GHz. W czasie pomiaru działały inne agenty (load average ok. 3). Czasy są orientacyjne, a bajty deterministyczne.

## 1. Bramki (kod końcowy tego commitu, czysty target)

```text
cargo fmt --check                           FMT_EXIT=0
cargo clippy --all-targets -- -D warnings   CLIPPY_EXIT=0
cargo test --all-targets                    TEST_EXIT=0
  id_invariant 10, json_keys 11, json_roundtrip 13, json_strict 3, pin_vectors 15, validate 11
  (0 failed, 0 ignored)
git diff --check (drzewo) / git diff --check 525a2ef7b HEAD   bez wyjścia (EXIT 0)
grep -rn '#\[ignore' src tests examples     brak trafień
src/lib.rs:20  #![forbid(unsafe_code)]
```

## 2. Testy mutacyjne

### 2.1 Metoda

Użyłem `01b-pomiary/mutate.py` (uruchomienie: `python3 -I mutate.py <kopia crate'u> <out.tsv> [--only=E]`). Skrypt działa na **kopii** crate'u w scratchpadzie, nie na worktree. Każdy mutant to dokładna podmiana tekstu, a wzorzec musi wystąpić w pliku dokładnie raz (sprawdzane przebiegiem `--dry`). Po podmianie skrypt uruchamia `cargo test --offline --all-targets --no-fail-fast`, potem przywraca źródło i na końcu asercją sprawdza, że jest identyczne z oryginałem. Klasyfikacja: `KILLED` (co najmniej jeden test FAIL), `KILLED-COMPILE` albo `SURVIVED` (wszystko zielone). Żaden mutant nie zabił się samą kompilacją.

Mutanty pokrywają wszystkie moduły `src/`:
- ids: 10 mutantów (granica 2^53−1, `-1`/`-99`, porządek `OwnerRef`, `Display`, `deny_unknown_fields` w `HexCoord`, asymetria serializacji);
- map: 11 (kody mgły symetrycznie i asymetrycznie, `rename_all` enumów, literały, `skip_serializing_if`, `serde(default)`, zmiana nazw kluczy);
- owners: 8;
- units: 4;
- overlays: 6;
- battle: 5;
- validate: 23 (każda stała zakresu, każda długość, wybrane `finite`/kolory, inkluzywność zakresu, `!=` wersji);
- root: 5.

Pełna lista z opisami jest w skrypcie, a wyniki w `01b-pomiary/mutacje-*.tsv`.

### 2.2 Fala 1: testy z `86032cd28` (przed), 72 mutanty

Zabite: **55/72**. Przeżyło 17:

| ID | Mutant | Przyczyna przeżycia |
|---|---|---|
| I8 | `HexCoord` bez `deny_unknown_fields` | `unknown_keys_are_rejected` wstawiał klucz tylko na 8 wybranych poziomach i w 4 tablicach, bez `HexCoord` |
| O7 | `OwnerViewDto` bez `deny_unknown_fields` | jw. (brak `owners[]`) |
| R3 | `RenderLayersDto` bez `deny_unknown_fields` | test działał tylko na pełnym snapshotcie, a warstwy przyjmowały np. klucz `map` |
| P7 | `HexDynDto.zloze`: `None` pomijane | `none_is_null_and_key_present` porównuje `v["zloze"] == Value::Null`, a w `serde_json` **brakujący klucz też daje `Null`**, więc asercja nie sprawdzała obecności klucza |
| O3 | `ringHex`: `None` pomijane | jw. (asercja `v["owners"][0]["ringHex"] == Null` przechodzi przy braku klucza) |
| U3, V5, B4 | `hpMax` / `showYields` / `ammoLeft`: `None` pomijane | jw. (`unlimited_ammo_is_none` ma tę samą słabość) |
| P9, O8, U4, V3 | `roadMask` / `unitCountOnHex` / `goldDeficitRepIds` / `ruin` z `#[serde(default)]` | „brak wymaganego klucza” był sprawdzany tylko dla `units[0].ruchLeft` |
| X12 | wersja `!=` zamieniona na `>` (starsza przechodzi) | test sprawdzał tylko `CONTRACT_VERSION + 1` |
| X14 | `RenderLayersDto::validate` pomija `validate_map` | brak testu złej mapy przy walidacji warstw |
| X19 | brak kontroli `battle.setup.units[].ownerColor` | kolor sprawdzany tylko w `owners[].color` |
| X20 | brak `finite` dla `overlays.okolica.range` | pole nie było w `floats_everywhere` |
| R1 | `CONTRACT_VERSION` 1 zamienione na 2 | **mutant równoważny**: kontrakt §3.1 (wiersz `contractVersion`, `u16`, „stała”) nie podaje wartości, więc żaden test nie może jej przypiąć bez dryfu od kontraktu |

### 2.3 Domknięcie luk (zmiany w testach, `src/` bez zmian)

- **`tests/json_strict.rs` (nowy, 3 testy, generyczne przejście po każdym obiekcie JSON):**
  1. `none_is_explicit_null_everywhere`: dla każdej znormalizowanej ścieżki (`[*]` dla indeksu, pozycja dla krotek `[[hex, yield]]`) zbiór kluczy każdego obiektu jest taki sam we wszystkich próbkach. Próbki: `sample_view`, `sample_view_minimal`, nowa `sample_view_other_nones` i syntetyczna 3000 „późna gra”, każda w wersji pełnej i warstw. Łącznie ponad 10 000 obiektów. Dodatkowo zbiór kluczy widzianych jako `null` musi być **równy** liście 29 pól `Option` (`NULLABLE`), a każde z nich musi mieć też wartość nie-`null`, więc test nie jest pusty.
     - Pomiar przy okazji: w próbkach z `86032cd28` osiem pól `Option` nigdy nie było `None`: `deploy`, `towerMaterial`, `growthPercent`, `prodKind`, `prodId`, `prodItemName`, `prodCategoryLabel`, `showYields`. Komentarz w `tests/common/mod.rs:1-3` („every `Option` as `None`”) jest więc nieścisły. Próbka `sample_view_other_nones` je pokrywa.
  2. `every_object_rejects_an_unknown_key`: wstawia `extraKey` w **każdy** obiekt pełnego snapshotu (powyżej 40) i warstw (powyżej 30). Sprawdza też, że warstwy z dołożonym `map` są odrzucane.
  3. `every_required_key_is_required`: usuwa po kolei **każdy** klucz każdego obiektu (powyżej 200 kluczy wymaganych). Klucz spoza `NULLABLE` daje błąd. Klucz `Option` wczytuje się jak `null`. To jest domyślne zachowanie serde dla `Option` i test je jawnie dokumentuje (§5 pkt 2).
- **`tests/validate.rs`:**
  - `contract_version` sprawdza też `CONTRACT_VERSION - 1` (pełny snapshot i warstwy);
  - nowy test `layers_validate_checks_the_map` (`map.seed = NaN`, `rzekaKrawedzie = 6` przy `RenderLayersDto::validate`);
  - nowy test `every_colour_is_bounded` (`cities[].badge.ownerColor`, `battle.setup.units[].ownerColor`);
  - przypadek `overlays.okolica.range = Infinity` w `floats_everywhere`.

### 2.4 Fala 1 po zmianach i fala 2 (kontrola, że nowe testy nie są dopasowane tylko do fali 1)

- Fala 1 (te same 72 mutanty) na testach z tego commitu: **71/72**. Przeżywa tylko R1 (równoważny, §2.2).
- Fala 2: 10 **nowych** mutantów, na polach, których fala 1 nie dotykała:
  - E1: brak kontroli `badge.ownerColor`;
  - E2: `HexCoord.q` z `default`;
  - E3/E4/E5/E8: `deploy` / `growthPercent` / `towerMaterial` / `zywnosc` z `skip_serializing_if`;
  - E6: `fogActive` z `default`;
  - E7/E10: `BattleGridDto` / `BattleUnitSpawnDto` bez `deny_unknown_fields`;
  - E9: `readyMachines` z `default`.

  Wynik na testach `86032cd28`: **1/10** (zabity tylko E7). Wynik na testach z tego commitu: **10/10**.

| Zestaw testów | Fala 1 (72) | Fala 2 (10) |
|---|---|---|
| `86032cd28` (impl) | 55 zabitych, 17 przeżyło | 1 zabity, 9 przeżyło |
| ten commit | 71 zabitych, 1 równoważny (R1) | 10 zabitych |

## 3. Pomiar rozmiaru (kryterium 4): potwierdzenie i rozbicie

### 3.1 Potwierdzenie pomiaru Operatora impl

Polecenie: `cargo run --release --example snapshot_size`, dwa przebiegi. Bajty są **identyczne** z `01-operator-impl.md` §4 (generator z ziarnem, deterministyczny). Założenia scenariuszy są jak tam: web NIE_ZMIERZONO, 8 właścicieli, 1 miasto na 60 heksów, 1 jednostka na 12 heksów.

| scenariusz | pełny JSON [B] | mapa statyczna [B] | warstwy [B] | B/heks (pełny) | ser. pełny [ms] | deser. pełny [ms] | ser. warstwy [ms] |
|---|---|---|---|---|---|---|---|
| 3000, bez miast/jednostek | 754 285 | 222 170 | 532 108 | 251,4 | 0,75 | 1,13–1,19 | 0,44–0,47 |
| 3000, późna gra (założenie) | 910 987 | 222 170 | 688 810 | 303,7 | 1,17–1,33 | 1,53–1,55 | 0,89–0,91 |
| 8000, bez miast/jednostek | 2 011 660 | 593 927 | 1 417 726 | 251,5 | 1,90–1,93 | 3,33–3,35 | 1,62–1,66 |
| 8000, późna gra (założenie) | 2 427 740 | 593 927 | 1 833 806 | 303,5 | 2,76–2,79 | 3,86–3,88 | 1,83–1,88 |

Czasy to mediana z 15 przebiegów, podana jako zakres dwóch uruchomień. Zależą od maszyny i obciążenia.

### 3.2 Rozbicie i narzut nazw kluczy

Pomiar z `01b-pomiary/measure_extra.rs`. Przykład nie jest częścią crate'u. Uruchamiałem go z kopii crate'u: `cargo run --release --example measure_extra`.

| scenariusz | pełny | map | hexState | fog | cities | units | stacks | territory | klucze w pełnym | klucze % | JSON pozycyjny (pełny) | pozycyjny hexState | B/miasto | B/jednostka |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3000 pusta | 754 285 | 222 170 | 525 598 | 6 011 | 2 | 2 | 97 | 14 | 516 672 | 68,5 | 237 613 | 156 598 | – | – |
| 3000 późna | 910 987 | 222 170 | 525 598 | 6 011 | 26 242 | 66 384 | 47 604 | 14 628 | 621 432 | 68,2 | 289 555 | 156 598 | 525 | 266 |
| 8000 pusta | 2 011 660 | 593 927 | 1 401 216 | 16 011 | 2 | 2 | 97 | 14 | 1 377 022 | 68,5 | 634 638 | 417 216 | – | – |
| 8000 późna | 2 427 740 | 593 927 | 1 401 216 | 16 011 | 70 013 | 177 150 | 127 060 | 40 013 | 1 653 740 | 68,1 | 774 000 | 417 216 | 526 | 266 |

- `hexState` waży **175 B/heks**, z czego około 70% to nazwy kluczy. Mgła to 2 B/heks (`0`/`1`/`2` plus przecinek). Mapa statyczna to 74 B/heks.
- Klucze stanowią **68%** całego JSON. „JSON pozycyjny” to ten sam snapshot z obiektami zamienionymi na tablice wartości. Daje on 0,77 MB zamiast 2,43 MB (8000, późna gra), a `hexState` zajmuje 52 B/heks zamiast 175 B/heks. **To tylko szacunek alternatywy.** Kontrakt §3 ma klucze nazwane i nie zmieniałem kodowania (byłby to dryf od kontraktu, decyzja orkiestratora).
- Gzip (Python `gzip`, poziom 6) zmierzony na zrzutach: 8000 późna gra 2 427 740 B → 76 472 B (3,1%), warstwy 1 833 806 B → 39 753 B (2,2%). **Ostrzeżenie:** generator syntetyczny jest bardzo powtarzalny, więc to dolna granica, nie prognoza dla prawdziwej mapy. IPC Tauri nie kompresuje (NIE_ZMIERZONO w tym temacie).

### 3.3 Wrażliwość na założenia gęstości (8000 heksów, 8 właścicieli)

| heksy/miasto | heksy/jednostkę | miasta | jednostki | pełny [B] | warstwy [B] | B/heks | ser. pełny [ms] | ser. warstwy [ms] | `validate()` [ms] |
|---|---|---|---|---|---|---|---|---|---|
| 120 | 24 | 66 | 333 | 2 220 131 | 1 626 197 | 277,5 | 2,62 | 1,60 | 0,060 |
| 60 | 12 | 133 | 666 | 2 427 740 | 1 833 806 | 303,5 | 2,81 | 1,86 | 0,062 |
| 60 | 6 | 133 | 1 333 | 2 733 720 | 2 139 786 | 341,7 | 3,42 | 2,60 | 0,076 |
| 30 | 6 | 266 | 1 333 | 2 843 929 | 2 249 995 | 355,5 | 3,53 | 2,79 | 0,074 |
| 30 | 3 | 266 | 2 666 | 3 457 615 | 2 863 681 | 432,2 | 4,35 | 3,61 | 0,077 |

Każda jednostka dodaje około 266 B do `units`. Do tego dochodzi część stosu: `stacks` w syntetyku to około 190 B na jednostkę, bo każda jednostka jest reprezentantem stosu, czyli przypadek najgorszy. Nawet przy 2666 jednostkach `hexState` pozostaje największą pozycją warstw (1,40 z 2,86 MB). `validate()` kosztuje poniżej 0,1 ms, czyli pomijalnie wobec serializacji.

### 3.4 Liczby do wpisania w P4-1 §4.1 (poza allowlistą tego tematu)

Dokument `P4-1-RENDER-DTO-CONTRACT.md` leży na `claude/rust-sivvrn`. Proponowany wpis dla orkiestratora:

> **POMIAR (P4-1A, `examples/snapshot_size`, syntetyk z ziarnem; liczby jednostek i miast to założenia, web NIE_ZMIERZONO):**
> - Rozmiar: 3000 heksów 0,75–0,91 MB, 8000 heksów 2,01–2,43 MB pełnego JSON. Średnio 250–300 B/heks (ARYTMETYKA §4.1: 50–100 B/heks, 0,4–0,8 MB, czyli zaniżona 3–4 razy).
> - Mapa statyczna (D-DTO-3 = B, wysyłana raz): 0,22 / 0,59 MB.
> - Warstwy dynamiczne (wysyłane przy każdej zmianie): 0,53–0,69 / 1,42–1,83 MB. Serializacja 0,4–0,9 / 1,6–1,9 ms, deserializacja pełnego snapshotu 1,1–1,6 / 3,3–3,9 ms (4 vCPU 2,1 GHz).
> - Główny koszt to `hexState`: 175 B/heks, z czego 68% to nazwy kluczy. Kodowanie pozycyjne dałoby 52 B/heks (szacunek alternatywy, nie decyzja).

Pozostaje NIE_ZMIERZONO: rozmiar w pamięci (ARYTMETYKA §4.1 „0,1–0,2 MB”), koszt przesyłu IPC Tauri do webview i parsowania w JS, liczba jednostek i miast na prawdziwej późnej mapie webu.

## 4. Kryteria końca z dispatchu (stan po tym wywołaniu)

| # | Kryterium | Stan |
|---|---|---|
| 1 | typy §3, serde camelCase, round-trip każdego typu | bez zmian względem impl (13 testów `json_roundtrip`) |
| 2 | nazwy kluczy bez dryfu | wzmocnione: `json_strict` sprawdza każdy obiekt (nieznany klucz, wymagany klucz, `null` zamiast braku klucza) |
| 3 | niezmiennik ID | bez zmian (10 testów). Mutanty I1–I10 wszystkie zabite |
| 4 | pomiar 3000 / 8000 | potwierdzony bajt w bajt, z rozbiciem i wrażliwością (§3). Wpis do P4-1 §4.1 należy do orkiestratora (poza allowlistą) |
| 5 | brak `#[ignore]`, brak osłabionych asercji, `forbid(unsafe_code)` | spełnione (§1). Nowe testy mają progi minimalne liczby obiektów i kluczy, żeby nie przechodziły bez sprawdzania |
| 6 | twierdzenia o webie z plik:linia | bez nowych twierdzeń o webie. Tabela dowodów w `01-operator-impl.md` §2 |

## 5. Uwagi dla Evaluatora i orkiestratora

1. **Słabość testów impl (naprawiona testami).** W `serde_json` `v["klucz"] == Value::Null` jest prawdą także dla **brakującego** klucza. Asercje „key present” w `json_keys::none_is_null_and_key_present` i `validate::unlimited_ammo_is_none` nie sprawdzały więc obecności klucza (mutanty P7, O3, U3, V5, B4). Testów nie przepisywałem: ich końcowa asercja `keys(minimal) == keys(view)` dotyczy tylko korzenia. Właściwą kontrolę daje teraz `json_strict::none_is_explicit_null_everywhere`.
2. **Pobłażliwość wejścia dla `Option` (zachowanie zmierzone, nie zmienione).** Brak klucza pola `Option` deserializuje się jako `None` (domyślne zachowanie serde). Producent zawsze zapisuje `null`, a `json_strict` to sprawdza. Gdyby kontrakt miał wymagać obecności klucza także na wejściu, trzeba by zmienić `src/` (np. `deserialize_with` na każdym polu `Option`). To decyzja techniczna orkiestratora; ten temat jej nie podejmuje.
3. **R1 jest równoważny.** Kontrakt nie podaje wartości `contractVersion` (§3.1, wiersz `contractVersion` „stała”). Nie przypinałem `1` w teście.
4. **Uwagi 3–7 z raportu impl (§5)** pozostają otwarte dla orkiestratora: `stacks` w korzeniu, luka „wonder” w `buildHighlight`, lustro typów bitwy, `ammo` jako `None` = `Infinity`, newtypy ID odrzucające wartości powyżej 2^53−1.
5. Sprzątanie: `CARGO_TARGET_DIR`, kopie crate'u do mutacji i pomiarów oraz zrzuty JSON w scratchpadzie zostały usunięte po bramkach. Nic nie wypchnięte, nic nie zintegrowane.

## 6. Metoda (komendy)

- `git fetch origin claude/rust-sivvrn rust-port/parity-v2`; `git show …/00-dispatch.md`; `git reset --hard 86032cd28` (gałąź worktree); `git merge-base --is-ancestor 7817ef0c 86032cd28`.
- Bramki: §1. Mutacje: `python3 -I 01b-pomiary/mutate.py <kopia> out.tsv` (fala 1); `… --only=E` (fala 2) na kopii z testami `86032cd28` i na kopii z tego commitu.
- Pomiar: `cargo run --offline --release --example snapshot_size` (dwa razy); `cargo run --offline --release --example measure_extra -- <katalog zrzutów>` (kopia crate'u); `python3 -I -c 'gzip.compress(…, 6)'` na zrzutach.
- Ścieżki pól `null` w próbkach: przejście po `serde_json::Value` (przykład pomocniczy w scratchpadzie, nie commitowany). Wynik jest opisany w §2.3 pkt 1.
