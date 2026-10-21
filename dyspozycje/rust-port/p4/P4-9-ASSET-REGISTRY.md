# P4.9 — Rejestr zasobów renderera i test „N tur nie zwiększa zasobów” (RR-T6)

TEMAT: `R-RUSTPORT-P4-9-ASSET-REGISTRY-Q1` · DOMAIN: GAME · RUNDA: 1/5 · ROLA: Operator (Opus 5.5 medium)
Baza: `origin/rust-port/parity-v2` = `0a496f67` (P4.6 r2). Commit kodu: `d35a800c31c657dd74bde2022fe0c0c6f743f25a`. Data: 2026-10-21.
Źródła: `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` §7 (M1–M7, §7.2, §7.3), §6.2 (`D-RR-7`), §8 (RR-T6); `P4-4-MODEL-CATALOG.md` §1.2 (prymitywy); `P4-6-RENDERER-CRATE-SCAFFOLD.md` §1 (podział modułów). Wszystkie czytane z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` przez `git show`.

**Zakres:** czysty CPU, std-only, bez `wgpu`, bez nowych zależności, `#![forbid(unsafe_code)]` (z `lib.rs`, bez zmian). Rejestr nie mierzy pamięci GPU — liczy zasoby i **deklarowane** bajty.

## 1. Pliki (allowlista)

```text
rust-port/renderer/src/assets.rs          → usunięty, zastąpiony katalogiem (lib.rs bez zmian: `pub mod assets;` trafia w assets/mod.rs)
rust-port/renderer/src/assets/mod.rs        dokumentacja modułu + mapowanie M1/M2/M3/M6 + reeksporty
rust-port/renderer/src/assets/registry.rs   Registry<R>, Handle<K>, RawHandle, kinds::{Buffer,Texture,Pipeline,BindGroup}, AssetError, RegistryStats, Release
rust-port/renderer/src/assets/shared.rs     Assets<R> (Rc<RefCell>), Owned<K,R> (RAII + refcount), Scope<R> (RAII)
rust-port/renderer/src/assets/cache.rs      Cache<Q,K,R>, CachePolicy (LRU: liczba wpisów / bajty), end_of_turn()
rust-port/renderer/src/assets/listeners.rs  Listeners<E>, Subscription (wyrejestrowanie w Drop)
rust-port/renderer/src/assets/budget.rs     Snapshot, Budget, Growth, Metric, Violation, DEFAULT_BASELINE_TURN=10, DEFAULT_CHECK_TURNS=[50,200]
rust-port/renderer/src/assets/fake.rs       FakeGpu / FakeResource — backend-atrapa liczący alokacje (P4.3 §7.3 p. 7)
rust-port/renderer/tests/assets_registry.rs 14 testów API
rust-port/renderer/tests/assets_nturns.rs   6 testów symulacji tur (M1/M2/M3/M6)
```

Zero zmian: `Cargo.toml`, `Cargo.lock`, `src/lib.rs`, `rust-port/engine/**`, `src-tauri/**`, `gra/**`, `.github/**`, inne moduły renderera (dowód: `git diff --stat 0a496f67 HEAD -- …` pusty w logu §6).

## 2. Projekt API

### 2.1 Rejestr (`registry.rs`) — jeden właściciel

- `Registry<R>` jest generyczny po „ładunku” `R`. Warstwa GPU wstawi tu swój enum zasobów `wgpu` (obiekty `wgpu` zwalniają się w `Drop`); testy używają `FakeResource`.
- `insert::<K>(label, bytes, resource) -> Handle<K>` — licznik odwołań 1. `retain` (+1), `release` (−1; przy 0 zasób jest **dropowany** = zwolniony; wynik `Release::Freed{bytes}` / `StillReferenced{refs}`).
- **Uchwyty typowane i generacyjne:** `Handle<kinds::Buffer>` nie da się podać tam, gdzie oczekiwany jest `Handle<kinds::Texture>` (błąd kompilacji; cecha `Kind` zapieczętowana). `RawHandle = (id rejestru, rodzaj, indeks, generacja)`. Zwolnienie podbija generację slotu, więc każda stara kopia uchwytu jest **przeterminowana**: `get/get_mut/retain/release/ref_count/label` zwracają `Err(AssetError::Stale)` — bez paniki, bez podwójnego zwolnienia, bez trafienia w ponownie użyty slot. Uchwyt z innego rejestru → `Err(ForeignRegistry)`. Slot, którego generacja doszłaby do `u32::MAX`, jest wycofywany na zawsze (brak aliasowania po przekręceniu licznika).
- **Liczniki per rodzaj** (`RegistryStats.per_kind[Buffer|Texture|Pipeline|BindGroup]`): `created`, `destroyed`, `live`, `live_bytes`, `peak_live`.
- `replace(old, …, new_resource)` — „podmień model”: najpierw **wstawia nowy**, potem zwalnia **jedno** odwołanie starego (kolejność naprawy M1). Nieprawidłowy `old` → błąd, nic nie wstawione, nowy zasób zdropowany (bez wycieku).
- `live()` — lista żywych wpisów z etykietą, bajtami i licznikiem odwołań (raport przecieku).

### 2.2 Warstwa RAII (`shared.rs`)

- `Assets<R>` — współdzielony rejestr (`Rc`; wątek renderowania). `with(|reg| …)` daje `&mut Registry`; wywołanie zagnieżdżone → `Err(AssetError::Busy)` (nie panika).
- `Owned<K,R>` — prowadnica posiadająca: `Clone` = +1 odwołanie, `Drop` = −1 (zwolnienie przy ostatnim). `Owned::replace(…)` — nowy przed starym. Klonowanie/zwolnienie prowadnicy **wewnątrz** `with` nie panikuje: operacja trafia do kolejki i jest stosowana w kolejności przy następnym dostępie (test `drop_and_clone_inside_with_are_deferred_not_panicking`).
- `Scope<R>` — zakres (scena bitwy, model miasta, sesja gry): `insert` tworzy zasób należący do zakresu, `adopt` przejmuje prowadnicę, `share` bierze dodatkowe odwołanie do zasobu współdzielonego. **`Drop` zwalnia wszystko, od najnowszego.** Zasoby współdzielone przeżywają, jeśli ktoś inny je trzyma.

### 2.3 Cache z polityką (`cache.rs`)

- `Cache<Q,K,R>`: klucz treści `Q` → współdzielony zasób. `get_or_insert_with(key, make)` zwraca `Owned` (trafienie = klon, brak = utworzenie).
- `CachePolicy { max_entries, max_bytes }` — LRU (kolejność `BTreeMap<tick, klucz>`). Eksmisja zdejmuje **tylko odwołanie cache'u**: zasób nadal trzymany przez scenę żyje do jej zwolnienia (test `cache_lru_by_entries_and_bytes`).
- `end_of_turn()` — usuwa wpisy, do których odwołuje się wyłącznie cache (licznik odwołań = 1). Realizuje P4.3 §7.3 p. 4: „wpis bez żywego odwołania jest zwalniany najpóźniej na końcu tury”.
- `clear()` — „nowa gra”.

### 2.4 Subskrypcje (`listeners.rs`)

- `Listeners<E>::subscribe(callback) -> Subscription`. **Drop tokenu wyrejestrowuje callback i dropuje domknięcie** (z wszystkim, co przechwyciło). Brak metody `detach` — trwałe nasłuchiwanie wymaga trzymania tokenu (albo świadomego `mem::forget`, co test wykrywa).
- Drop tokenu w trakcie `emit` (z callbacku) — kolejka, usunięcie zaraz po `emit`. Rekurencyjny `emit` / `subscribe` w trakcie `emit` tej samej listy → `Err(Busy)`. Token przeżywający listę — drop to no-op.
- `stats()` → `subscribed / unsubscribed / active`.

### 2.5 Budżet i raport (`budget.rs`)

- `Snapshot { turn, resources: RegistryStats, subscriptions }` + `Display` (linia raportu).
- `Budget { live_count: [Growth; 4], live_bytes: Growth, subscriptions: Growth, hard_cap_live: [Option<u64>; 4] }`, `Growth { absolute, percent }`: `dozwolone = baza + absolute + baza·percent/100`.
- **`D-RR-7` nierozstrzygnięte → parametr.** Domyślnie (`Budget::default() == Budget::no_growth()`): każda liczba żywych zasobów per rodzaj, suma bajtów i aktywne subskrypcje po N turach **≤** wartości po turze 10 (`DEFAULT_BASELINE_TURN`), punkty kontrolne `DEFAULT_CHECK_TURNS = [50, 200]`. `hard_cap_live` = jawny limit per rodzaj (P4.3 §7.3 p. 6), domyślnie brak.
- `check(baza, bieżący) -> Result<(), Vec<Violation>>` — lista wszystkich przekroczeń w stałej kolejności.

### 2.6 Backend-atrapa (`fake.rs`)

`FakeGpu::alloc(kind, bytes) -> FakeResource`; `Drop` zasobu = „zwolnienie”. Liczniki `FakeGpu` są **niezależne** od księgowości rejestru — testy w każdym punkcie kontrolnym sprawdzają `stats.live == gpu.live` per rodzaj i `live_bytes`, czyli że zwolnienie w rejestrze faktycznie dotarło do destruktora zasobu. Opcjonalny dziennik zdarzeń `Alloc/Free` w kolejności (test „nowy przed starym”).

## 3. Mapowanie M1/M2/M3/M6 → mechanizm (jak ma tego użyć warstwa GPU i modele)

| Web (P4.3 §7.1) | Mechanizm | Użycie przez warstwę GPU / modele (RR-T2/T5/T7/T8/T9) |
|---|---|---|
| **M1** model miasta przebudowywany przy zmianie `visualKey` bez zwolnienia geometrii/materiałów | `Cache<(prymityw, parametry), Buffer>` + `Owned::replace` / `Registry::replace` | Builder prymitywów (RR-T4) zwraca siatkę z cache'u po kluczu parametrów; model = lista instancji tych samych siatek (P4.3 §7.3 p. 2–3). Bufor instancji o stałej pojemności — przebudowa = zapis danych (`get_mut`), nie nowy bufor. Zasoby per obiekt (uniform materiału, bind group) — wyłącznie `Owned::replace` (nowy, potem stary). Żadnych „gołych” `wgpu::Buffer` poza rejestrem. |
| **M2** cache tekstur plakietek rośnie z turą | `Cache<BadgeKey, Texture>` z `CachePolicy::max_entries(…)` + `end_of_turn()` | Renderer tekstu (RR-T8) trzyma plakietki w `Cache`; po każdej turze `end_of_turn()`. Atlas o stałym rozmiarze (P4.3 §7.3 p. 4) może później zastąpić osobne tekstury — rejestr policzy wtedy jedną teksturę atlasu. |
| **M3** nasłuchiwacze bitwy nigdy nie zdejmowane; domknięcia trzymają scenę | `Listeners<E>` + `Subscription` (Drop) + `Scope` sceny | Scena bitwy trzyma swoje tokeny i swój `Scope`; wyjście z bitwy = `drop(scena)` → tokeny wyrejestrowane → domknięcia zdropowane → `Scope` zwalnia zasoby. Wejście z webview przez jeden kanał zdarzeń (P4.3 §7.3 p. 5) = jedna `Listeners<E>` per źródło. |
| **M6** 24 z 32 `dispose*` bez wywołania; singletony modułów nie zwalniane przy nowej grze | Brak wolnostojących funkcji `dispose`: `Scope` sesji gry + cache'e jako pola renderera; `Cache::clear()` | Wszystkie „singletony” (geometrie typów jednostek, cache sprite'ów) są polami obiektu sesji renderera i należą do jego `Scope`/cache'ów; nowa gra = drop sesji. Test `new_game_frees_everything_and_restarts_identically`: po dropie 0 żywych zasobów w rejestrze i w `FakeGpu`. |
| M4/M5 (nakładki surowców, `collapseToMergedMesh`) | te same mechanizmy (`Scope` nakładki; scalona siatka jako `Owned`) | poza zakresem testów tego tematu (nie zależą od tury w sposób odtworzony tu) — NIE_ZMIERZONO |

**Reguła dla warstwy GPU (wymóg z P4.3 §7.3 p. 1):** każdy zasób `wgpu` wchodzi do `Registry` przez `insert`; obiekty sceny trzymają `Owned`/`Handle` albo należą do `Scope`. Telemetria debug = `Assets::stats()` + `Listeners::stats()` (odpowiednik `renderer.info.memory`, P4.3 §7.3 p. 6).

## 4. Testy

### 4.1 API (`tests/assets_registry.rs`, 14)

`stale_handle_is_an_error_not_a_panic` (użycie po zwolnieniu: 6 operacji → `Err(Stale)`, ponowne użycie slotu z nową generacją), `handle_from_another_registry_is_rejected`, `reference_counting_frees_on_last_release`, `registry_replace_creates_new_before_freeing_old` (dziennik `FakeGpu`: dokładnie `[Alloc{nowy}, Free{stary}]`; replace przez przeterminowany uchwyt nie zmienia statystyk), `owned_replace_creates_new_before_freeing_old_and_keeps_shared_old`, `owned_guards_count_references`, `scope_releases_everything_it_created_on_drop`, `drop_and_clone_inside_with_are_deferred_not_panicking`, `cache_lru_by_entries_and_bytes`, `cache_end_of_turn_trims_only_unreferenced_entries`, `subscriptions_unregister_on_drop` (po dropie tokenu `Rc::strong_count` przechwyconego stanu wraca do 1), `subscription_dropped_inside_callback_is_removed_after_emit`, `budget_thresholds_are_configurable`, `live_report_lists_labels`.

### 4.2 Symulacja tur (`tests/assets_nturns.rs`, 6)

Deterministyczna (LCG 64-bit, stałe MMIX Knutha, ziarno `0x5EED_0006`; bez `rand`, bez silnika gry). Dwa rozmiary mapy: **small 40×25, 6 miast** i **large 96×60, 24 miasta**. Na start: bufor terenu na każdy blok 8×8 heksów (20 / 96), atlas terenu, 3 pipeline'y (Lambert/Standard/Basic, P4.4 §1.2) + 3 bind groupy, 1 stały nasłuchiwacz mapy. Co turę, dla każdego miasta: populacja ±1 z prawd. 1/6 każda (1–10), produkcja i wzrost % losowe (zmienia się klucz plakietki), era co 60 tur, mury co 37 tur → przebudowa modelu przy zmianie `visualKey = (pop, era, mury)`; plakietka per `(miasto, pop, produkcja, wzrost %, era)`. Bitwa w turach `t % 5 == 2` (40 bitew w 200 turach): `Scope` z 16 buforami jednostek, teksturą pola, bind groupą i współdzieloną siatką; 2 nasłuchiwacze (click/resize), których domknięcia przechwytują `Rc` stanu sceny (odpowiednik `this`).

Warianty: `Fixed` (mechanizmy rejestru) oraz po jednym wariancie „błędnym” na wzorzec, odtwarzającym web **bez zwalniania**: `LeakM1` (świeże 4 bufory prymitywów + materiał + bind group + instancje przy każdej przebudowie, stary model `mem::forget` = brak `dispose`), `LeakM2` (`HashMap` plakietek bez eksmisji), `LeakM3` (tokeny `mem::forget` = brak `removeEventListener`; domknięcia trzymają scenę i jej `Scope`).

Testy: `fixed_registry_stays_within_budget_after_10_50_200_turns` (oba rozmiary; dodatkowo liczby żywych zasobów per rodzaj **identyczne** w turach 10/50/200), `each_leak_pattern_breaks_the_budget` (każdy wariant × rozmiar: przekroczenie w turach 50 i 200, z oczekiwaną metryką: M1→`live buffer`, M2→`live texture`, M3→`subscriptions`; oraz wzrost 200 > 50 > 10), `leak_m3_also_retains_battle_scene_resources` (subskrypcje = 1 + 2·40 = 81), `simulation_is_deterministic`, `rebuild_in_place_1000_cycles_returns_to_initial_state` (P4.3 §7.3: 1000 cykli pop 1→10→1 + zmiana produkcji + wejście/wyjście z bitwy → liczniki żywych zasobów **dokładnie** jak na starcie; utworzono 55 055, zwolniono 55 000), `new_game_frees_everything_and_restarts_identically` (M6).

### 4.3 Zmierzone wartości (z logu §6, `cargo test --locked --all-targets`)

Liczby żywych zasobów (bufory / tekstury / pipeline'y / bind groupy), deklarowane bajty, aktywne subskrypcje:

| Wariant, mapa | tura 10 | tura 50 | tura 200 | Budżet (≤ tura 10) |
|---|---|---|---|---|
| Fixed small | 36/7/3/9, 4 560 128 B, 1 | 36/7/3/9, 4 560 128 B, 1 | 36/7/3/9, 4 560 128 B, 1 | OK |
| Fixed large | 148/25/3/27, 5 805 056 B, 1 | 148/25/3/27, 5 805 056 B, 1 | 148/25/3/27, 5 805 056 B, 1 | OK |
| LeakM1 small | 164/7/3/27, 4 953 088 B | 590/7/3/98, 6 179 968 B | 2414/7/3/402, 11 433 088 B | PRZEKROCZONY |
| LeakM1 large | 714/25/3/106, 7 547 008 B | 2502/25/3/404, 12 696 448 B | 9552/25/3/1579, 33 000 448 B | PRZEKROCZONY |
| LeakM2 small | 36/67/3/9, 5 543 168 B | 36/306/3/9, 9 458 944 B | 36/1206/3/9, 24 204 544 B | PRZEKROCZONY |
| LeakM2 large | 148/265/3/27, 9 737 216 B | 148/1224/3/27, 25 449 472 B | 148/4815/3/27, 84 284 416 B | PRZEKROCZONY |
| LeakM3 small | 68/9/3/11, 6 722 816 B, 5 | 196/17/3/19, 15 373 568 B, 21 | 676/47/3/49, 47 813 888 B, 81 | PRZEKROCZONY |
| LeakM3 large | 180/27/3/29, 7 967 744 B, 5 | 308/35/3/37, 16 618 496 B, 21 | 788/65/3/67, 49 058 816 B, 81 | PRZEKROCZONY |

Kontrola rachunku `Fixed small`: bufory = 20 bloków terenu + 4 współdzielone siatki prymitywów + 6 miast × (instancje + materiał) = 36; tekstury = atlas + 6 plakietek = 7; bind groupy = 3 globalne + 6 miast = 9. `Fixed large`: 96 + 4 + 48 = 148; 1 + 24 = 25; 3 + 24 = 27. Zasoby nadal „krążą” (small: utworzono 2 760, zwolniono 2 705 do tury 200), ale stan żywy jest stały.

Bajty to **deklarowane** rozmiary syntetyczne z symulacji (np. plakietka 128×32×4), a nie pomiar.

## 5. Ograniczenia i `NIE_ZMIERZONO`

1. **Realna pamięć GPU — NIE_ZMIERZONO.** Brak GPU w środowisku; rejestr liczy zasoby i deklarowane bajty. Licznik pamięci adaptera `wgpu` (P4.3 §7.3 p. 7, wariant GPU) — nie dotyczy tego tematu.
2. Symulacja **nie** jest silnikiem gry ani AI (P4.3 §7.3 mówi o „symulacji z AI na stałym seedzie”): to deterministyczny model wzorców M1/M2/M3 z liczbą miast stałą w czasie. Normalizacja „na liczbę obiektów” przy rosnącej liczbie miast/jednostek — nie zaimplementowana (budżet jest parametrem; przy podłączeniu silnika trzeba ustalić baseline lub progi `Growth` — decyzja `D-RR-7`).
3. Porównanie z webem (`?perfDebug=1`, `main.ts:35864-35872`) — NIE_ZMIERZONO (zakaz uruchamiania `gra/`).
4. Rozmiary wycieków M1–M5 w bajtach w webie — NIE_ZMIERZONO (P4.3 §9 p. 10); liczby z §4.3 dotyczą wyłącznie symulacji.
5. Budżet „per kategoria” (teren/modele/tekst/cienie, P4.3 §7.3 p. 6) — dziś per **rodzaj** zasobu (bufor/tekstura/pipeline/bind group); kategorie można dodać jako etykietę wpisu w temacie warstwy GPU.
6. Jednowątkowość: `Assets`/`Listeners` używają `Rc`/`RefCell` (wątek renderowania). Jeśli RR-T1 wymusi wielowątkowość, trzeba wariantu `Arc`/`Mutex` — NIE_ZMIERZONO.
7. `Owned::clone` panikuje wyłącznie przy przepełnieniu licznika odwołań `u32` (jak `Rc`); operacje na uchwytach nigdy nie panikują.
8. `--features gpu`: sprawdzony tylko `cargo clippy` (kompilacja z `wgpu`, EXIT=0); `cargo test --features gpu` nie był uruchamiany w tym temacie (moduł nie używa `wgpu`; sonda GPU z P4.6 bez zmian).

## 6. Surowe wyjścia bramek (PEŁNE)

Uruchomione na **zacommitowanym** drzewie (`git rev-parse HEAD` = commit kodu, `git status --short` pusty), skryptem poniżej (każda komenda: `echo "$ cmd"; cmd 2>&1; echo "EXIT=$?"`), po `cargo clean`. `grep -rn unsafe …` → `EXIT=1` oznacza **brak trafień** (żadnego `unsafe` w nowym kodzie i testach). Kolejność linii raportowych testów jest przeplatana, bo libtest uruchamia testy równolegle; każda linia ma etykietę wariantu i mapy.

```bash
#!/usr/bin/env bash
# Gate run for R-RUSTPORT-P4-9 on the COMMITTED tree (raw outputs, each command followed by EXIT).
cd /home/user/The-Game/.claude/worktrees/wf_d19f2ede-7f8-1/rust-port/renderer || exit 1
export CARGO_INCREMENTAL=0
export CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_d19f2ede-7f8-1
export CARGO_PROFILE_DEV_DEBUG=0
export CARGO_TERM_COLOR=never
run() { echo "\$ $*"; "$@" 2>&1; echo "EXIT=$?"; echo; }
run rustc --version
run cargo --version
run git rev-parse HEAD
run git status --short
run git diff --stat 0a496f67 HEAD -- Cargo.toml Cargo.lock src/lib.rs ../engine ../../src-tauri ../../gra ../../.github
run git diff --name-status 0a496f67 HEAD
run grep -rn "unsafe" src/assets tests/assets_registry.rs tests/assets_nturns.rs
run cargo clean
run cargo fmt --all -- --check
run cargo clippy --locked --all-targets -- -D warnings
run cargo test --locked --all-targets
run cargo clippy --locked --all-targets --features gpu -- -D warnings
run cargo +1.87.0 test --locked --all-targets
```

Log (bez skrótów):

```text
$ rustc --version
rustc 1.97.0 (2d8144b78 2026-07-07)
EXIT=0

$ cargo --version
cargo 1.97.0 (c980f4866 2026-06-30)
EXIT=0

$ git rev-parse HEAD
d35a800c31c657dd74bde2022fe0c0c6f743f25a
EXIT=0

$ git status --short
EXIT=0

$ git diff --stat 0a496f67 HEAD -- Cargo.toml Cargo.lock src/lib.rs ../engine ../../src-tauri ../../gra ../../.github
EXIT=0

$ git diff --name-status 0a496f67 HEAD
D	rust-port/renderer/src/assets.rs
A	rust-port/renderer/src/assets/budget.rs
A	rust-port/renderer/src/assets/cache.rs
A	rust-port/renderer/src/assets/fake.rs
A	rust-port/renderer/src/assets/listeners.rs
A	rust-port/renderer/src/assets/mod.rs
A	rust-port/renderer/src/assets/registry.rs
A	rust-port/renderer/src/assets/shared.rs
A	rust-port/renderer/tests/assets_nturns.rs
A	rust-port/renderer/tests/assets_registry.rs
EXIT=0

$ grep -rn unsafe src/assets tests/assets_registry.rs tests/assets_nturns.rs
EXIT=1

$ cargo clean
     Removed 91 files, 7.7MiB total
EXIT=0

$ cargo fmt --all -- --check
EXIT=0

$ cargo clippy --locked --all-targets -- -D warnings
    Checking pollster v0.4.0
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_d19f2ede-7f8-1/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 0.76s
EXIT=0

$ cargo test --locked --all-targets
   Compiling pollster v0.4.0
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_d19f2ede-7f8-1/rust-port/renderer)
    Finished `test` profile [unoptimized] target(s) in 1.19s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/civ_renderer-d95024f3ec20cfd9)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/assets_nturns-7ff94d6b0438d2d1)

running 6 tests
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s

     Running tests/assets_registry.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/assets_registry-ee54812c049c2745)

running 14 tests
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test budget_thresholds_are_configurable ... ok
test cache_lru_by_entries_and_bytes ... ok
test handle_from_another_registry_is_rejected ... ok
test live_report_lists_labels ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test owned_guards_count_references ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test scope_releases_everything_it_created_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/cpu_sanity-7ee07d9f2002230a)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/gpu_probe-08e2d2a6c2a7bdae)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0

$ cargo clippy --locked --all-targets --features gpu -- -D warnings
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
    Checking cfg-if v1.0.5
   Compiling cfg_aliases v0.2.2
    Checking foldhash v0.2.0
   Compiling thiserror v2.0.21
   Compiling libm v0.2.16
    Checking equivalent v1.0.3
   Compiling autocfg v1.5.1
    Checking hashbrown v0.17.1
   Compiling num-traits v0.2.19
    Checking libloading v0.8.9
   Compiling syn v3.0.9
   Compiling syn v2.0.119
   Compiling zerocopy v0.8.63
    Checking log v0.4.34
   Compiling libc v0.2.191
    Checking indexmap v2.14.2
    Checking bitflags v2.13.2
    Checking rustc-hash v1.1.0
   Compiling naga v30.0.1
    Checking bit-vec v0.9.1
   Compiling pkg-config v0.3.34
    Checking unicode-width v0.2.2
   Compiling parking_lot_core v0.9.12
    Checking once_cell v1.21.4
   Compiling ash v0.38.0+1.3.281
   Compiling wayland-sys v0.31.11
    Checking codespan-reporting v0.13.1
    Checking bit-set v0.10.0
    Checking spirv v0.4.0+sdk-1.4.341.0
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
    Checking raw-window-handle v0.6.2
    Checking allocator-api2 v0.2.21
    Checking bytemuck v1.25.2
    Checking naga-types v30.0.1
   Compiling zerocopy-derive v0.8.63
    Checking static_assertions v1.1.0
    Checking smallvec v1.16.3
    Checking arrayvec v0.7.8
    Checking scopeguard v1.2.0
   Compiling khronos-egl v6.0.0
    Checking lock_api v0.4.14
    Checking wgpu-types v30.0.1
    Checking hashbrown v0.16.1
    Checking dlib v0.5.3
   Compiling wgpu-hal v30.0.1
    Checking presser v0.3.1
    Checking parking_lot v0.12.5
    Checking ordered-float v5.4.0
    Checking renderdoc-sys v1.1.0
    Checking glow v0.17.0
    Checking profiling v1.0.18
   Compiling wgpu-core v30.0.1
   Compiling litrs v1.0.1
   Compiling wgpu v30.0.1
   Compiling document-features v0.2.12
    Checking half v2.7.1
    Checking gpu-allocator v0.28.0
    Checking wgpu-naga-bridge v30.0.1
    Checking wgpu-core-deps-windows-linux-android v30.0.1
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_d19f2ede-7f8-1/rust-port/renderer)
    Finished `dev` profile [unoptimized] target(s) in 30.82s
EXIT=0

$ cargo +1.87.0 test --locked --all-targets
   Compiling pollster v0.4.0
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_d19f2ede-7f8-1/rust-port/renderer)
    Finished `test` profile [unoptimized] target(s) in 1.20s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/civ_renderer-6766c6fad30270d6)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/assets_nturns-7f123dcd6ef69328)

running 6 tests
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/assets_registry.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/assets_registry-8a3216c4cef36c3e)

running 14 tests
test budget_thresholds_are_configurable ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test cache_lru_by_entries_and_bytes ... ok
test handle_from_another_registry_is_rejected ... ok
test reference_counting_frees_on_last_release ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test owned_guards_count_references ... ok
test live_report_lists_labels ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/cpu_sanity.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/cpu_sanity-24f9f0f2595580a0)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/gpu_probe.rs (/home/user/cargo-target-shared/wf_d19f2ede-7f8-1/debug/deps/gpu_probe-11e4bc82af348129)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0

```

## 7. Granice

- Bez zmian w `Cargo.toml`/`Cargo.lock`/`src/lib.rs`/`rust-port/engine/**`/`src-tauri/**`/`gra/**`/`.github/**` i w modułach innych tematów (`geom`, `pick`, …).
- Bez `npm`, bez uruchamiania weba, bez pobierania bibliotek zewnętrznych (wartości referencyjne tematu pochodzą z symulacji opisanej w §4.2, kod w `tests/assets_nturns.rs`).
- Katalog targetu `/home/user/cargo-target-shared/wf_d19f2ede-7f8-1` usunięty po bramkach.
- Commit w worktree (jawne `git add`), bez push. DEPLOY/PUSH: NIE WYKONANO.
