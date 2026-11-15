# 02 — Evaluator (adwersarialny) · R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1 · runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1
GOAL: pola planow marszu w PlayableState (plannedMarches z attackUnitId, marchAttackTargets,
      marchStopNotified, marchStopDetail) + zapis/odczyt przez SavedPlannedMarch, golden bez zmian.
ZMIANY/COMMIT: oceniany kod 25da353f8 (galaz ...-wip/operator-pomiary; rodzic 2169bd17d -> 78f5db10f -> a01363d5f).
      Ten raport: galaz R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1-wip/evaluator-r1 (od 25da353f8), tylko ten plik.
TESTY: odtworzone samodzielnie (sekcja 2): fmt EXIT 0, clippy -D warnings EXIT 0, cargo test --all-targets
      EXIT 0 (470 zestawow, 3394 passed, 0 failed, 1 ignored = istniejacy e2e::dump_tick1_econ_for_web_generator),
      generator --check OK, golden SHA-256 baza = galaz.
BLOKADY: brak blokujacych; 2 zarzuty do Obrony (Z1 kod, Z2 raport), reszta to uwagi.
RUNDY: 1/5
NASTEPNY KROK: Obrona (Z1, Z2) -> Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres, allowlista

- Dispatch: `origin/claude/rust-sivvrn:.../00-dispatch.md` = nadal runda 1, **DODATKU r2 brak** (potwierdzone).
- `origin/rust-port/parity-v2` = `a01363d5f`; `git merge-base --is-ancestor a01363d5f 25da353f8` = tak.
- `git merge-base --is-ancestor 7817ef0c a01363d5f` = **tak** — `7817ef0c` JEST w `parity-v2` (patrz Z2).
- `git diff --stat a01363d5f 25da353f8`: 10 plikow, wszystkie w allowliscie
  (`playable.rs`, `save_load.rs`, `tests/p4_1j_planned_march_{state,pin_vectors,bounds}.rs`, katalog runu).
  Zero zmian w `gra/**`, `rust-port/renderer/**`, `rust-port/view-model/**`, `src-tauri/**`; `Cargo.lock` nieśledzony.
  Nowe typy `PlayablePlannedMarch` / `PlayableMarchStopReason` w `playable.rs` sa niezbedne dla pol — w zakresie.
- Zadna istniejaca fixtura ani istniejacy test nie zmieniony (diff `tests/` = tylko 3 nowe pliki `p4_1j_*`).
- `#[ignore]`, `should_panic`, `unsafe`, `allow(clippy` w dodanych liniach: 0 trafien. Progi pokrycia w testach
  wektorowych (60/50/25/15, 30/5/5/5) ponizej zmierzonych (66/62/35/22, 33/8/9/6) — nie trywialne.
- Konstrukcje literalu `PlayableState {` poza `playable.rs`: brak w `renderer`/`view-model` (kompilacja innych crate nie
  jest zagrozona); w `engine` wszystko kompiluje sie (clippy all-targets).
- Commity: bez nazwy modelu, ostatnia linia `Claude-Session: ...` (3/3).

## 2. Bramki odtworzone (czysty `CARGO_TARGET_DIR` w scratchpadzie poza repo, `CARGO_INCREMENTAL=0
`CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; target usuniety po bramkach)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` (`rust-port/engine`) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0; 470 zestawow; 3394 passed; 0 failed; 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, istniejacy) |
| `git diff --check a01363d5f 25da353f8` | czysto |
| P4-1J: `p4_1j_planned_march_state` 8/8, `_pin_vectors` 4/4, `_bounds` 1/1 | ok |

Pierwsze uruchomienie pelnego testu przerwal limit czasu zadania w tle (10 min, moj blad parametru), drugie
(`--no-fail-fast`) zakonczone EXIT 0 — liczby wyzej z drugiego, kompletnego przebiegu.

## 3. Wektory z pinu (generator + SHA-256, nie reczne)

- Pliki pinu z `git show 07d2fbd72:gra/src/main.ts` i `:gra/src/game/planned-march.ts`;
  `sha256sum` = `e80f9cb4…5f19` / `12fa88cd…ce0e` = straznik `EXPECTED_SHA256` w generatorze.
- Generator wycina funkcje po nazwie (`extractFn`) i blok odczytu po kotwicy, stripuje typy
  (`stripTypeScriptTypes`) i WYKONUJE je (`new Function`) — wektory nie sa transkrypcja.
- `node gen-p4-1j-planned-march-vectors.mjs <WEB> --check rust-port/engine/tests/p4_1j_planned_march_pin_vectors.rs`
  -> `OK: wektory zgodne (state=67, raw=78, bajtow=157266)`, EXIT 0.

## 4. Golden zapis — niezalezny pomiar baza vs galaz

Zrodlo pomiaru Operatora (`zz_p4_1j_pomiary_golden.rs.txt`) uruchomione przeze mnie dwa razy w moim worktree:
na galezi (25da353f8) i na bazie (`playable.rs`/`save_load.rs` przywrocone z `a01363d5f`, testy `p4_1j_*`
tymczasowo wyjete; potem pelne przywrocenie, `git status` czysty).

| | wynik |
|---|---|
| galaz | `files=392 state=3 state_identical=2 snap=0`, 77 305 B, SHA-256 `bacb82e4fe54f1e6b901e94f93c04259bf85a477f9b245eb853f9e921897c5dd` |
| baza `a01363d5f` | identycznie, ten sam SHA-256; `cmp` = IDENTICAL |

Zgodne z raportem 01b. Fixtur JSON w formacie `SaveSnapshot` w repo brak (`snap=0`); zgodnosc zapisu bez planow
pokrywa `snapshot_without_plans_is_byte_identical` + istniejace testy zapisu (zielone).

## 5. Twierdzenia o webie (pin `07d2fbd72`) — sprawdzone w zrodle

`planned-march.ts:16-23` (`PlannedMarchDest`), `:35` (`MarchStopReason`), `:451-482` (`plannedMarchesFromSave`), `:485-501` (`plannedMarchesToSave`);
`main.ts:31004`, `:31007`, `:31009`, `:31016` (cztery mapy), `:31050-31074` (`clearPlannedMarch`),
`:31124-31130` (`syncMarchAttackTarget`), `:37184`, `:37243-37244` (zapis), `:46272-46287` (odczyt: clear x4,
`plannedMarchesFromSave(..., units, 0)`, petla `set` + `syncMarchAttackTarget`). Zgodne.
Konwencja `q = position.x`, `r = position.y` zgodna z kontraktem P4-1 (`PositionDto(x, y) ≡ HexCoord(q = x, r = y)`)
i z `turn_war_inputs.rs:285`.

## 6. Zarzuty (ponumerowane)

**Z1 (kod, niska waga; do Obrony).** `restore_playable_planned_marches` (`save_load.rs`, petla po `loaded`)
deklaruje w doc-komentarzu: „Wpis powtorzony w liscie ... zachowuje pierwsza pozycje i ostatnia wartosc
(semantyka `Map.set`)”. To nie jest prawda, gdy POZNIEJSZY duplikat jest odfiltrowany przez
`planned_marches_from_save` albo niewyrazalny — wtedy zostaje WCZESNIEJSZA wartosc. Port
`ruch_jednostek::planned_marches_from_save` filtruje kazdy wpis listy osobno (bez deduplikacji), a deduplikacja
`Map.set` dzieje sie dopiero po filtrze. Zmierzone tymczasowym testem (niecommitowanym), jednostka 1 gracza na (0,0):
- A: lista `[("1", 5,0, attack "9"), ("1", 0,0)]` -> stan `[1 -> (5,0) attack 9]`, `marchAttackTargets {1: 9}`,
  raport pusty. Semantyka `Map.set`/`JSON.parse` (ostatnia wartosc = cel na pozycji jednostki) dalaby BRAK planu.
- B: lista `[("1", 5,0, attack "9"), ("1", 2.5, 0)]` -> stan `[1 -> (5,0) attack 9]` I jednoczesnie
  `unrepresentable = ["1"]` — raport twierdzi, ze wpis pominieto, a w stanie zostaje stara wartosc z celem ataku.
Zasieg: tylko forma listowa (`visit_seq`) zapisu Rust; forma obiektowa (web) deduplikuje w `visit_map` przed filtrem,
a zapis Rust (`playable_planned_marches_to_save`) nigdy nie emituje duplikatow — wiec w zapisach weba i w zapisach
wlasnych nieosiagalne; dotyczy zapisu recznie zmienionego/uszkodzonego. Test
`restore_keeps_one_entry_per_unit_and_uses_owner_parameter` pokrywa tylko duplikat, ktorego obie wartosci przechodza filtr.
Naprawa (w allowliscie): zdeduplikowac `entries` (pierwsza pozycja, ostatnia wartosc) PRZED
`planned_marches_from_save`, albo zawezic doc-komentarz i usunac wpis z poprzedniej wartosci, gdy ostatnia jest
odfiltrowana/niewyrazalna; dodac przypadki A i B do testu.

**Z2 (raport, fakt; do Obrony / orkiestratora).** `01-operator-impl.md` §0 i raport pomiarow (01b §0, blokada 1)
twierdza, ze `7817ef0c` „nie jest w parity-v2” (`git merge-base --is-ancestor a01363d5f 7817ef0c` -> nie).
Argumenty sa odwrocone: `git merge-base --is-ancestor 7817ef0c a01363d5f` = **tak**, czyli `parity-v2 = a01363d5f`
ZAWIERA `7817ef0c` (to stary commit P4.36 Q2 Evaluator r1). Rozbieznosc „baza bez 7817ef0c” nie istnieje; praca na
`a01363d5f` jest zgodna z poleceniem. Nie wplywa na kod; raport wymaga sprostowania.

## 7. Uwagi (bez wymaganej akcji w tym temacie)

- U1. Kryterium 4 `forbid(unsafe_code) zachowany`: w `civ-engine` atrybutu nie ma ani na bazie, ani na galezi
  (jest w `view-model`, `renderer`) — kryterium puste; nic nie usunieto, nowy kod bez `unsafe`.
- U2. Funkcje zapisu/odczytu nie maja produkcyjnego wolajacego (wolaja je tylko testy) — zgodnie z deklaracja
  Operatora; wpiecie przy P4-1H / sciezce zapisu `PlayableState`.
- U3. `marchStopNotified`/`marchStopDetail`/`marchAttackTargets` sa w JSON DTO `PlayableState`; web ich nie zapisuje
  i czysci przy wczytaniu. Gdyby JSON `PlayableState` kiedys sluzyl za zapis gry (fixtury testowe tak go uzywaja,
  np. `save_pre_stores.json`), przetrwalyby wczytanie — odchylenie od weba. Do pilnowania przy wpinaniu zapisu.
- U4. `generalTargetId` pominiety (poza §8, zgodnie z dispatchem), raportowany w `general_target_dropped`;
  NIE_ZMIERZONO zachowanie marszu za generalem po wczytaniu. Zadanie orkiestratora #221 juz istnieje.
- U5. Decyzja techniczna r1 (typy `UnitId`/`i32`, raport `unrepresentable` zamiast cichej straty) — do wpisu w
  `REJESTR-RUST.md` przez orkiestratora (plik poza allowlista). Ocena: decyzja rozsadna i jawna; odchylenie od weba
  dotyczy tylko zapisow niewyrazalnych, ktorych Rust sam nie tworzy.
- U6. Mutanty Operatora (M1–M6, N1–N19) przejrzane w skrypcie `mut-p4-1j-pomiary.py`: zamiany sensowne, celuja w
  realne galezie; nie powtarzalem ich (koszt), Z1 jest luka, ktorej zaden z nich nie dotyka.
- U7. Proces (incydent wlasny): scratchpad sesji jest wspoldzielony przez agentow; nadpisalem w nim pliki
  `main.ts` i `pm.ts` zawartoscia pinu `07d2fbd72` (`gra/src/main.ts`, `gra/src/game/planned-march.ts`). Jesli inny
  agent trzymal tam inna wersje, powinien ja odtworzyc. Dalsza praca w podkatalogu `scratchpad/ev-p41j/`.

## 8. Werdykt

**PASS-WITH-NOTES.** Kryteria konca 1–3 i 5 spelnione i potwierdzone niezaleznie (bramki, generator z pinu,
golden SHA baza = galaz); kryterium 4 spelnione w granicach U1. Z1 to drobny blad semantyki na sciezce
nieosiagalnej dla zapisow weba i wlasnych zapisow Rust — do poprawienia w Obronie (tania zmiana w allowliscie),
nie blokuje. Z2 to blad faktu w raportach. Dysk po sprzataniu: patrz odpowiedz Evaluatora.
