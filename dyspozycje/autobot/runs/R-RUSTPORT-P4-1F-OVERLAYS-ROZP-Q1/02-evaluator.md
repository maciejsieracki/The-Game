STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1
GOAL: rozpoznanie producenta OverlaysViewDto (#215): tabela nakładka → pin → wejścia → Rust, pola DTO, podział na wdrożenia, NIE_ZMIERZONO; zero zmian kodu.
ZMIANY/COMMIT: ocena commitu Operatora 8108971d7 (rodzic c3e3617b2 = origin/rust-port/parity-v2 przy ocenie). Ten raport: tylko 02-evaluator.md (commit lokalny, bez push).
TESTY: patrz §1.
BLOKADY: brak.
RUNDY: 1/5 (Evaluator r1).
NASTĘPNY KROK: Final Control; poprawki z §3 można wnieść w r2 albo jako notatki do tematów 1F-2..1F-6.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki (odtworzone samodzielnie)

- `git diff --name-only c3e3617b2 8108971d7` → 2 pliki, oba z allowlisty:
  `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1/01-operator-r1.md`,
  `dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md`. Zero `.rs`, zero `gra/`, brak `Cargo.lock`.
- `git diff --check c3e3617b2 8108971d7` → kod 0.
- Baza: rodzic 8108971d7 = c3e3617b2 = `origin/rust-port/parity-v2` (zgodne z dispatchem).
- `cargo fmt -- --check`: `engine` kod 0, `view-model` kod 0 (repo nie ma workspace w `rust-port/`, więc per crate).
- `view-model`: `cargo clippy --all-targets -- -D warnings` kod 0; `cargo test --lib` kod 0 (0 testów lib — testy crate są w `tests/`).
- `engine` clippy / `cargo test --lib` NIE uruchomione: temat nie zmienia żadnego pliku Rust, wynik byłby wynikiem bazy, nie Operatora (dysk 7,4 GB wolnego). `#[ignore]`/osłabione asercje/wołający — nie dotyczy (brak kodu i testów).
- Wektory pinu: nie dotyczy (rozpoznanie); propozycje wektorów w §4 dokumentu oceniono jako wyprowadzone z pinu, nie ręczne.

## 2. Weryfikacja wyrywkowa odniesień (pin 07d2fbd72, baza c3e3617b2)

Zgodne: `main.ts:15582-15616` (terytorium, filtr mgły `isMe ∨ !fogOn ∨ visible ∨ explored`), `:15626-15650` (zasięgi, literał `0`),
`:15379-15397` (szlaki, `ownerId !== 0 && toOwnerId !== 0`), `:15432-15448` (pola robotników, `eraForOwner`),
`:14578-14585` (`occupiedForMove` + `passThrough.delete`), `:14706-14731` (`reachableWithMergeTargets`, `armyStackLimit`),
`:17492-17530` + `siegeCampSync.ts:7-47` (obozy z powtórzeniami, round-robin, właściciel = pierwsza jednostka ≠ właściciel miasta),
`siegeMarker.ts` bez `fog`/`visible` (0 trafień), `:4199-4210` (`ruin = era > absolut`, nieznany cud → false),
`wonders-data.ts:164-168` (fallback `_meta.absolut`), `units.ts:6524` (`setHighlight` czyści poprzednią warstwę), `:6608-6680` (`turnStops`),
`range-hexes.ts:28/79/101`, `okolica.ts:811-834`. Rust: `territory.rs:469-490` (`BTreeMap/BTreeSet`), komentarze `:53`/`:75` nieaktualne,
`overlays.rs:138-145` (3 warianty `BuildHighlightKind`), `:172`, `:188` (`path_route` bez `turnStops`), `diplomacy_siege_war_gate.rs:140`,
`turn_economy_inputs_wonders.rs:41-44` (bez `q,r`), `:62` (`era <= absolut`), `sasiedztwo.rs:129-151` (jeden `yield_of`, `BTreeMap`),
`engine/Cargo.toml:11`; `git grep -i "pass_through|build_move_occupancy|can_found_player_city_at|is_in_start_reveal" engine/src` → 0 (potwierdzone).

## 3. Zarzuty

1. **Fałszywe NIE_ZMIERZONO: religia państwowa właściciela** (§1 wiersz R, §2 `religionRange`, §3 pkt 6, §6 pkt 1). Źródło jest w Rust udokumentowane
   tuż nad polem, które Operator cytuje (`playable.rs:596`): `playable.rs:578-583` — „religia państwowa właściciela to religia jego cywilizacji
   (web `ownerReligionForOwnerId`, main.ts:5535), liczona z `players`”; producent istnieje: `turn_war_inputs.rs:404` (`religion_of(owner_id)`),
   użyty w `:424`, `:438`. Należy przepisać na JEST (z odnośnikiem) i usunąć z listy stanu brakującego.
2. **Niepotrzebne NIE_ZMIERZONO: `armyStackLimit`** (§1 wiersz RE, §6 pkt 6, „nie szukano nazwy odpowiednika”). Jedno `git grep -i army_stack_limit`
   daje `save_migrations.rs:219-221` (`ARMY_STACK_LIMIT: i64 = 500`, komentarz cytuje web `armyStackLimit()`). Do wpisania jako JEST.
3. **Błędna interpretacja `main.ts:17810` (zaznaczenie „miasta”)** (§1 wiersz S, §2 `selection`, §6 pkt 5). Kontekst `:17808-17809`: pierścień
   ustawiany jest tylko gdy `selectedId` należy do `surrenderEntered` (jednostki wprowadzone do miasta przez `enterCityAfterSurrender`) —
   to nadal zaznaczona **jednostka**, stojąca już na heksie miasta, z `ownerId = newOwner`. Nie ma przypadku „heks spoza `units[]`”;
   pozycja NIE_ZMIERZONO jest do zamknięcia (selection = heks/właściciel zaznaczonej jednostki po wejściu).
4. **Niepełna lista nieaktualnych numerów linii w komentarzach Rust.** Dokument odnotowuje `range-hexes.ts:53`/`:75`, ale pomija
   `sasiedztwo.rs` (komentarz `collect_worked_hex_owner_map` cytuje `okolica.ts:690`, w pinie `:811`). Poprawkę warto dopisać do allowlisty/zakresu 1F-4.
5. **Wejście widza w polach robotników pominięte w §2.** Web przekazuje `ME()` do `syncWorkerFieldOverlay` (`main.ts:15441`), a `WorkerFieldDto`
   (`overlays.rs:127-132`) ma tylko `hex` + `owner_id`; renderer musi dostać widza z korzenia DTO. Tabela §2 (`workerFields`, kolumna wejść) powinna
   to wymienić, żeby 1F-4/1F-G nie zgubiły rozróżnienia „własne vs cudze” pola.

Zarzuty 1–5 są korektami dokładności; nie podważają struktury tabeli, listy pól ani podziału 1F-1..1F-6. Ustalenia §5 (właściciel obozu bez mgły,
literał `0` vs `viewer`, kolejność `BTree*`, `ruin` jako `era > absolut` zamiast `!wonder_bonus_active`) zweryfikowane jako zgodne z pinem.
