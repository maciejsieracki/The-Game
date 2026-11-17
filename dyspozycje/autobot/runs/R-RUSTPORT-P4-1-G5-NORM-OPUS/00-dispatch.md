# DISPATCH R-RUSTPORT-P4-1-G5-NORM-OPUS (runda 1) — R4 luka G5: normalizacja kluczy ulepszeń (LEGACY_KEY_ALIASES) i fallback do `hex.ulepszenie` (#332)

DOMENA: renderer Rust, grafika (ulepszenia per heks). MODEL: OPUS (wszystkie etapy — tylko tematy grafiki Rust, zgodnie z zasadami). BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `f85622878`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/**`. Dowód pinu: `git show 07d2fbd72:gra/src/game/terrain-improvements.ts | sed -n '20,60p'` (LEGACY_KEY_ALIASES, normalizeImprovementKey ~linia 117–118: pusty klucz i `'brak'` → undefined). Wołający w pinie: `braz-access.ts:16`, `cyna-access.ts:30`, `livestock-unlock.ts:55` — ZWERYFIKUJ numery grepem przed wektorami.
RUST: `rust-port/renderer/src/improvements/sync/build.rs` ~79–84 (komentarz „gap G5” — normalizacja i fallback NIE są zrobione), `rust-port/renderer/src/improvements/sync/input.rs` ~29–35 (`ulepszenie` i `improvement_key` przenoszone, nieczytane). Dane: `rust-port/engine/data/derived/ulepszenia-reguly.json` (`zrodlo_web` wskazuje terrain-improvements.ts:32–34).
WZÓR: moduły grafiki T4a/T4b NIE dotyczą; wzoruj się na istniejących testach `rust-port/renderer/tests/improvements_sync_r4*.rs` (12/12 zielone w R4) i generatorze `rust-port/engine/tests/p4_1b_map_view_vectors/gen.mjs` (wykonuje tekst pina przez TypeScript; TYPESCRIPT_JS=/opt/node22/lib/node_modules/typescript/lib/typescript.js).

## DECYZJA (podjęta przez orkiestratora)
- Producent DTO: jeśli w `rust-port/view-model/src` lub `rust-port/engine/src` NIE ma producenta `improvement_key` (`git grep improvement_key` na bazie pokazuje tylko struktury), normalizacja i fallback idą do KONSUMENTA `sync/build.rs` (funkcja normalizacji kluczy + fallback), a w raporcie zapisz to jako odstępstwo od „producenta DTO” z dowodem grepa.
- `LEGACY_KEY_ALIASES` przenieś 1:1 z pinu (tabela stała w Rust, jedno źródło). Nie zgaduj wpisów — wyciągnij z pina.
- Nieznane klucze: zgodnie z pinem (`normalizeImprovementKey` zwraca undefined dla pustego i `'brak'`; nieznane zachowaj jak w pinie — zweryfikuj w pinie, nie zakładaj).
- Fallback do `hex.ulepszenie` tylko gdy `improvement_key` jest pusty — kolejność jak w pinie.
- Animacje/sceny/`main.ts` POZA zakresem.

## ZAKRES
1. `rust-port/renderer/src/improvements/sync/build.rs` — normalizacja kluczy (tabela aliasów z pina), fallback do `ulepszenie`, usunięcie komentarza „gap G5” po wdrożeniu.
2. `rust-port/renderer/src/improvements/sync/input.rs` — TYLKO jeśli trzeba (np. odczyt `improvement_key` przy fallbacku).
3. Wektory: `rust-port/renderer/tests/improvements_sync_g5_gen.mjs` (NOWY) → `improvements_sync_g5_vectors/vectors.json`; testy `rust-port/renderer/tests/improvements_sync_g5.rs` (NOWY) porównują bajt-w-bajt.

## ALLOWLISTA
- `rust-port/renderer/src/improvements/sync/build.rs`
- `rust-port/renderer/src/improvements/sync/input.rs` (tylko jeśli konieczne)
- `rust-port/renderer/tests/improvements_sync_g5*.rs`, `improvements_sync_g5_gen.mjs`, `improvements_sync_g5_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-G5-NORM-OPUS/**`

## NIE ROBIĆ
- Nie zmieniaj `view-model/**` (chyba że producent istnieje — wtedy jego zakres osobno w raporcie), `engine/**`, `gra/`, `renderer` poza allowlistą, `Cargo.lock`.
- Nie dodawaj nazwy modelu do trailerów commitów.

## WEKTORY / TESTY
- Tabela aliasów: każdy wpis z pina; wektor dla każdego aliasu.
- Pusty klucz i `'brak'` → brak warstwy; duplikat zachowuje pierwszą pozycję (jak w R4).
- Fallback: `improvement_key` pusty → `ulepszenie`; `improvement_key` obecny → klucz z aliasem zamieniony.
- Każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL): (a) usunięcie jednego wpisu aliasu, (b) pominięcie skipu `'brak'`, (c) odwrócenie kolejności fallbacku.

## BRAMKI (renderer)
- `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test improvements_sync_g5`, `cargo test --all-targets --no-fail-fast` (crate renderer). Kody wyjścia w raporcie.
- **Bramka renderera wymaga ≥ 12 GB wolnego i braku równoległych buildów.** Przed bramką `df -h /`. Przy < 12 GB: BLOCK z liczbą GB (nie uruchamiaj na pół); kod i wektory zostają zacommitowane.

## KRYTERIA KOŃCA
1. Punkty zakresu zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie) — albo BLOCK infra z GB.
2. Commit jawnym `git add`, BEZ `Cargo.lock`, bez push do parity. Raport `01-operator-r1.md`.

## DODATEK r2 (orkiestrator, po FAIL Evaluatora i BLOCK obrony r1)
- BAZA r2: `origin/rust-port/parity-v2` = `f85622878` (bez zmian). Kod r1 (`0671e292d`, gałąź `rust-port-wip/p4-1-g5-norm-opus-op-r1`) jest punktem wyjścia: przenieś go, nie pisz od zera.
- DECYZJA 1 (fallback): fallback do `ulepszenie` działa TYLKO gdy `ulepszenia` jest puste, a NIE gdy `improvement_key` jest pusty. Powód: pin `gra/src/game/terrain-improvements.ts:365-377` nie czyta `improvementKey` na ścieżce renderu (testy `improvement_key_is_not_read`, `fallback_only_without_ulepszenia`). Odchylenie od r1 dispatchu, wpisane do REJESTR-RUST.
- DECYZJA 2 (`''` i `'brak'`): zostają jako warstwy, jeśli są w `ulepszenia` (pin `main.ts:3132-3135` dokłada warstwy bez filtrowania). Wektor `brak_and_empty_skipped` ma dawać `[farma, droga, '', brak]` zgodnie z pinem.
- MUTACJE r2: (a) usunięcie wpisu aliasu → FAIL; (b′) pominięcie filtru `''`/`'brak'` przy dokładaniu warstw postawionych w `build.rs:230-232` → FAIL na wektorach `ulepszenia_brak_no_fallback`, `ulepszenia_empty_key_no_fallback`, `brak_and_empty_skipped`; (c) odwrócenie kolejności fallbacku → FAIL. Mutacja (b) z r1 jest równoważna i NIE jest wymagana.
- BRAMKA: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test improvements_sync_g5`, `cargo test --all-targets --no-fail-fast` (crate renderer). Wymaga ≥12 GB wolnego i braku równoległych buildów. Przed bramką `df -h /`. Przy <12 GB: BLOCK INFRA z liczbą GB, kod i wektory zacommitowane.
- ZAKRES r2: dodatkowo komentarz `rust-port/renderer/src/improvements/sync/mod.rs:39,46` (opis G5 jako luki) jest POZA allowlistą r1 — NIE zmieniaj go w tej rundzie; odnotuj jako dług.
- Commit jawnym `git add`, bez `Cargo.lock`, bez push do parity, bez nazwy modelu w trailerach. Raport `02-operator-r2.md`.

## DODATEK r3 (orkiestrator, po czterech BLOCK INFRA: r1, r2 z bramkami nieuruchomionymi)
- BAZA r3: `02b07a83e` (FC r2; zawiera kod r1 `0671e292d`, Operatora r2 `d43c203a4`, Obronę r2 `72ededb4c`, raport FC r2). Nie zaczynaj od zera.
- URUCHOMIENIE: ten temat startuje WYŁĄCZNIE w oknie bez równoległych buildów cargo (orkiestrator sprawdza `ps` przed startem: brak `cargo`/`rustc` z innych worktrees). Dysk `df -h /` musi być ≥ 12 GB przed bramką.
- Jeśli w trakcie bramki pojawi się cudzy build albo dysk spadnie < 12 GB: BLOCK INFRA z liczbą GB i momentem, nie uruchamiaj na pół.
- BRAMKI (wszystkie, z kodami wyjścia w raporcie): `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test improvements_sync_g5` (11 testów), `cargo test --all-targets --no-fail-fast`, crate `renderer`. `CARGO_TARGET_DIR` poza repo.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) usunięcie wpisu aliasu z `LEGACY_KEY_ALIASES`; (b′) pominięcie filtru `''`/`'brak'` przy dokładaniu warstw postawionych w `build.rs:230-232`; (c) odwrócenie kolejności fallbacku. Każdą przywróć z kopii, potwierdź zerowy diff.
- DECYZJE OBOWIĄZUJĄCE (z DODATKU r2, wpisane do REJESTR-RUST): D1 — fallback do `ulepszenie` tylko przy pustym `ulepszenia`; D2 — `''` i `'brak'` zostają w warstwach postawionych; mutacja (b) zastąpiona przez (b′).
- Komentarz `rust-port/renderer/src/improvements/sync/mod.rs:39,46` (opis G5 jako luki) jest POZA allowlistą — nie zmieniaj, zostaje jako dług.
- Trailery commitów: BEZ nazwy modelu (decyzja #289 dla workerów).
- Commit jawnym `git add`, bez `Cargo.lock`, bez push do parity. Raport `03-operator-r3.md`.
