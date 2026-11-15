# 02a — Obrona Operatora r1: R-RUSTPORT-P4-1H-RJ-REPIN-Q3

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-RJ-REPIN-Q3
GOAL: dryf `RJ` (ruch marszu) do pinu `07d2fbd72` (R1–R4, R6, trimPathToStackRoom) z wektorami z uruchomionego kodu pinu
ZMIANY/COMMIT: kod Operatora r1 `cc7cde088` + raport `576093738` (baza `be49ff3c3` = `origin/rust-port/parity-v2`); poprawki obrony w commicie na gałęzi `rust-port-wip/R-RUSTPORT-P4-1H-RJ-REPIN-Q3-r1-obrona` (rodzic `576093738`). Zmienione pliki obrony: `rust-port/engine/tests/p4_1h_rj_repin_vectors/gen.mjs`, `rust-port/engine/tests/p4_1h_rj_repin_vectors/vectors.json`, `rust-port/engine/tests/p4_1h_rj_repin.rs`, ten raport, `mutate-r1-obrona.py`, `mutate-r1-obrona.txt`. `src/` bez zmian.
TESTY: niżej (§Bramki)
BLOKADY: brak
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora (`02-evaluator.md`, commit `b587ccbc6`)

### Z1. Nowe API nie ma produkcyjnego wołającego — PRZYJMUJĘ (dług wpięcia, bez zmiany kodu)

Zgodne z dispatchem: zakres Q3 to funkcje domeny i wektory; wpięcie należy do P4-1H Q4 MOVE-MODEL
(adapter `PlayableState → RuchMapa/RuchJednostka/MoveOccupancy`) i Q6 MOVE (`move_unit`). Dług do wpisania
przez orkiestratora w `dyspozycje/rust-port/REJESTR-RUST.md` (plik poza allowlistą tego tematu):

| Funkcja (src/domain) | Wołający docelowy | Temat |
|---|---|---|
| `build_move_occupancy`, `compute_path_with_siege` | adapter stanu ruchu | P4-1H Q4 MOVE-MODEL |
| `plan_path_turns_occ`, `should_stop_at_obstacle_occ`, `execute_march_step_occ` | `move_unit` / wykonanie marszu | P4-1H Q6 MOVE |
| `register_march_stop`, `clear_march_stop`, `is_notifiable_march_stop`, `march_paused_label` | powiadomienia marszu; mapowanie `MarchStopReason` → `PlayableMarchStopReason` | P4-1H Q4/Q6 |
| `trim_path_to_stack_room` (`army_follow_auto_merge.rs`) | `move_unit` (limit stosu na końcu ścieżki) | P4-1H Q6 MOVE |

Brak wołającego nie jest błędem portu: testy wektorowe wykonują każdą z tych funkcji na 500 + 40 + 60 + 50 przypadkach pinu.

### Z2. `OWN_UNIT_IN_REACH_DETAIL` jako stała w `pathfinding.rs` — PRZYJMUJĘ (decyzja techniczna do rejestru)

Proponowany wpis do `REJESTR-RUST.md` (orkiestrator; plik poza allowlistą):
„P4-1H-RJ-REPIN-Q3: tekst detalu R3 `własna jednostka na trasie — brak wolnego heksu w zasięgu`
(`planned-march.ts:388-400` @ `07d2fbd72`, w pinie literał w kodzie, nie w danych) trzymany jako stała
`OWN_UNIT_IN_REACH_DETAIL` w `rust-port/engine/src/domain/pathfinding.rs`. Parytet z pinem: w webie to też literał
w kodzie, nie wpis `ruch-jednostek-params.json`. Strażnik: test `vectors_pin_guard_and_constants` porównuje stałą
z `ownUnitInReachDetail` w `vectors.json` (generowane z pinu); dodatkowo 111 przypadków `only_own_hex_in_reach`
porównuje `stopDetail` bajt w bajt.”
Uzasadnienie: przeniesienie do pliku danych byłoby odstępstwem od pinu (w pinie to nie są dane).

### Z3. `ARMY_STACK_LIMIT = 500` wpisany na sztywno w generatorze — PRZYJMUJĘ (poprawka)

Poprawka w `gen.mjs`:
- Strażnik SHA-256 obejmuje teraz cały łańcuch źródła limitu w pinie (24 fragmenty zamiast 21):
  - `gra/src/main.ts#armyStackLimit` (`function armyStackLimit(): number { return BATTLE_MAX_PER_SIDE; }`, l. 4358–4360), sha `bd0fdc45…eae00`;
  - `gra/src/battle/battleScene.ts#MAX_PER_SIDE` (`const MAX_PER_SIDE = 500;`, l. 721), sha `16c5204e…19b6bb`;
  - `gra/src/battle/battleScene.ts#BATTLE_MAX_PER_SIDE` (`export const BATTLE_MAX_PER_SIDE = MAX_PER_SIDE;`, l. 723), sha `eca47889…81cc`.
  Skróty sprawdzone niezależnie przez `sha256sum` na `git show 07d2fbd72:…` (zgodne).
- `ARMY_STACK_LIMIT` jest teraz CZYTANY z tekstu fragmentu `MAX_PER_SIDE` (regex `^const MAX_PER_SIDE = (\d+);$`),
  z jawną kontrolą, że `BATTLE_MAX_PER_SIDE = MAX_PER_SIDE` i `armyStackLimit()` zwraca `BATTLE_MAX_PER_SIDE`.
  Zmiana liczby w pinie → najpierw EXIT 2 strażnika, a po aktualizacji skrótu → inna wartość w `vectors.json`
  i FAIL asercji `armyStackLimit == ARMY_STACK_LIMIT` (Rust, `save_migrations`).
- Test Rust `vectors_pin_guard_and_constants` wymaga obecności trzech nowych fragmentów w `excerpts`, wymaga,
  żeby generator czytał `MAX_PER_SIDE` z pinu, i odrzuca literał `const ARMY_STACK_LIMIT = 500;` w generatorze.

### Z4. Brak przypadku, w którym predykat oblężenia zależy od jednostki i zwraca false — PRZYJMUJĘ (poprawka + mutacja)

- Nowa sekcja generatora (na końcu, po powiadomieniach, żeby nie przesunąć ziarna): 25 × `siege_own_dest`
  + 25 × `siege_own_mid`, `siegeOwner = 0` = właściciel ruszającej się jednostki. Predykat pinu
  (`siegeSet.has(k) && u.ownerId !== siegeOwner`) zwraca false na heksach oblężenia.
- Nowe kategorie (liczone z wyników pinu): `siege_predicate_false_for_mover` = 50,
  `siege_predicate_changes_path` = 49 (w 49 z 50 przypadków ten sam zestaw heksów z obcym właścicielem daje
  w pinie inną trasę `computePath`, więc predykat realnie decyduje o wyniku).
- Minimalne progi w `march_vectors_cover_dispatch_categories`: oba ≥ 40.
- Stare dane są bajt w bajt takie same: pierwsze 450 przypadków `march`, `occupancy`, `trimSegment`, `stack`,
  `notify`, `maps` i pierwsze 21 `excerpts` identyczne z wersją `576093738` (sprawdzone porównaniem JSON).
  Łącznie marsz: 500 przypadków.
- Mutacja M6 (`mutate-r1-obrona.py`): predykat wołany z inną jednostką (`owner_id + 1`) zamiast ruszającej się.
  Wynik: `EXIT 101 FAIL(oczekiwany)`, `march_vectors_match_pin_07d2fbd72 ... FAILED` (`mutate-r1-obrona.txt`).
  Na samych starych wektorach (siegeOwner = 3, mover = 0) ta mutacja byłaby niewidoczna (1 ≠ 3 nadal blokuje):
  wniosek z kodu predykatu, osobnym przebiegiem NIE_ZMIERZONO.

### Z5. R5 (`computeReachable@07`) NIE_ZMIERZONE, Rust `compute_reachable` różni się od pinu — PRZYJMUJĘ (osobny temat, bez kodu)

Dispatch: „R5: NIE implementować. Tylko zbadać”. Wynik badania był w `01-operator-r1.md` (lista różnic z diffu,
wektorami NIE_ZMIERZONO). Zgłaszam jako osobny temat do kolejki orkiestratora:

`R-RUSTPORT-P4-1H-RJ-REPIN-R5-REACHABLE` — GOAL: `compute_reachable` (Rust) = `computeReachable` @ `07d2fbd72`
z wektorami z uruchomionego pinu. Zakres z odczytu diffu:
1. `passThrough` (`MoveOccupancy`) jest rozwijany w Dijkstrze, ale heks pass-through nie trafia do zbioru zasięgu;
2. `siegeBlocksEntry(unit, q, r)` pomija heksy oblężenia w Dijkstrze (predykat jawny, jak `compute_path_with_siege`);
3. reguła „ruch o 1 heks przy budżecie ≥ 1” wyklucza heksy pass-through i oblężenia.
Zależność: wołający w P4-1F5 REACH-PATH-VIEW i P4-1H Q5 PREVIEW. Stan R5 w tym temacie: NIE_ZMIERZONO (nie zmieniono).

## Bramki (obrona, `rust-port/engine`, CARGO_TARGET_DIR w scratchpadzie poza repo, usunięty po bramkach)

- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `node tests/p4_1h_rj_repin_vectors/gen.mjs --check` → EXIT 0 („vectors.json zgodny z pinem”, strażnik 24 fragmentów zielony)
- `cargo test --no-fail-fast --lib --test p4_1h_rj_repin --test p6_4_core --test p6_4_embark --test p6_4_march --test p6_4_rally --test p6_4_scout --test p6_4_tables` → EXIT 0
  (lib 121, p4_1h_rj_repin 7, p6_4_core 10, p6_4_embark 4, p6_4_march 6, p6_4_rally 3, p6_4_scout 5, p6_4_tables 4; 0 failed)
- Mutacja M6 → EXIT 101 (FAIL oczekiwany).
- Pełnego `cargo test --all-targets` w obronie NIE powtórzono (dysk ~5,8 GB wolnego); `src/` bez zmian względem
  `cc7cde088`, więc zmiana dotyczy wyłącznie jednego binarnego testu `p4_1h_rj_repin` (zielony) i danych generatora.
- `p6_4_*` bez zmian; `Cargo.lock` nie w commicie; brak `#[ignore]`/`todo!`.
