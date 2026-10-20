# Notatki czytelnika: reports/ + CSV 154 podzadań (temat R-RUSTPORT-P0-ARCHIWUM-OPENCLAW-AUDYT-Q1, runda 1)

Data: 2026-10-20. Rola: Operator, czytelnik `reports/` (priorytet najwyższy). Zapis wyłącznie w `dyspozycje/rust-port/**`. Bez zmian w `gra/**`, bez commitów i pushy.

Gałęzie porównania (lokalne refy `origin/*`): `main` = edb8fb56; `origin/autobot/real24-staging` = 78d494c7; `origin/hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920` = a317fb7a; `origin/hermes/R-RUSTREAL-20-SAVE-LOAD-Q1-RECOVERY-R2-20260915` = 5dc5fddc. Pojęcie "ZMERGOWANE" w tych notatkach oznacza: kod obecny w commitowanym drzewie co najmniej jednej z 4 gałęzi. Kod obecny tylko w niecommitowanym worktree oznaczam jako "TYLKO-W-ARCHIWUM-NIEZMERGOWANE".

Uwaga o ścieżkach: `reports/` = `/home/user/the-game-transfer-extracted/workspace/reports/`. Ścieżki `rust-port/...` poniżej dotyczą drzewa gałęzi git, nie systemu plików.

## 1. Pokrycie 8 plików `reports/`

| Plik | Przeczytany | Uwagi |
|---|---|---|
| `TG-P0-P11-154-STATUS-20260929-2057.md` | w całości | Aktualny snapshot. Suma F=1, D=30, C=59, B=4, N=60. |
| `TG-P0-P11-154-STATUS-20260929.md` | w całości przez diff z wersją 2057 | Wersja 20:35: D=29, C=60. Jedyna różnica: P0.5 C→D. |
| `TG-REALIZATION-AUDIT-154-BASELINE-20260930.csv` | wszystkie 154 wiersze, zagregowane i wypisane skrótowo | Stan `current_audit_state` dla każdego ID. |
| `TG-REALIZATION-AUDIT-ARTIFACTS-20260930.csv` | wszystkie 48 wierszy | Pliki zmienione w worktree, poza HEAD. |
| `TG-REALIZATION-AUDIT-EVIDENCE-20260930.csv` | 594 wiersze: podział po prefiksach; pełna lista 33 wierszy o nazwanych funkcjach i receptach reviewerów | Nie czytałem treści wszystkich 594 plików, tylko indeks. |
| `TG-WEB-PIN-DELTA-MATRIX-20261001.csv` | wszystkie 85 wierszy | Kolumny `rust_status` i `notes` przeczytane. |
| `PROJECT-CONTRACT-THE-GAME-20260920.rev19-SNAPSHOT-20261001.md` | nagłówki, sekcje Goal/Source hierarchy/Current source, sekcje decyzji | Pominięte: długie historyczne wpisy A/B i routingu, bo nie dotyczą gameplayu. |
| `TG-REALIZATION-AUDIT-20260930.md` | w całości (31 KB) | Dokument bazowy oceny. |

Pominięte, bo są infrastrukturą procesu OpenClaw: wpisy A/B i routingu, Controller, Flow, watchdog, heartbeat.

## 2. Stan 154 podzadań wg snapshotu i audytu bazowego

- Snapshot 20:57: F=1 (P0.12), D=30, C=59, B=4 (P0.11, P1.2, P2.12, P2.13), N=60.
- Audyt bazowy (`current_audit_state`): 60 wierszy N ma `SNAPSHOT_N_NO_EXACT_EVIDENCE_REF`. 46 wierszy C/D/B ma `SNAPSHOT_NO_EXACT_EVIDENCE_REF`. 7 ma `SNAPSHOT_ONLY_PENDING_AUDIT`. Pozostałe mają świeże, zawężone klasyfikacje.
- Brak referencji w 594 indeksowanych plikach oznacza, że nie ma dowodu. Nie dowodzi to nieobecności kodu. Tak to opisuje sam audyt (`TG-REALIZATION-AUDIT-20260930.md`, akapit "Snapshot aggregate").
- Gameplayowe podzadania P3–P7 oznaczone C w snapshocie (P3.1–P7.9) mają w większości brak referencji dowodowej. Oznacza to, że status C nie ma dowodu w indeksie evidence. Nie ma dowodu, że kod jest, i nie ma dowodu, że go nie ma.

## 3. Konfrontacja z 4 gałęziami Rust (dowody wykonane przez `git grep`, `git show`, `git ls-tree`)

### 3a. Kod obecny w commitowanych gałęziach kandydackich, nieobecny w main (ZMERGOWANE do real24/handoff, NIEZMERGOWANE do main)

`rust-port/engine/src` jest identyczny w `real24` (78d494c7) i `handoff` (a317fb7a). `git diff --stat` między nimi dla `rust-port` jest pusty.

- `domain/ai_turn.rs` (1402 linie). Obecny w real24 i handoff. Nieobecny w main i w RECOVERY-R2.
- `domain/city_growth.rs` (517 linii). Moduł opisuje "canonical three-step population cap: no building = 5, granary = 8, aqueduct = 12" (nagłówek pliku). Ma `city_population_cap` (linia 194) i `HungerPenaltyResult` (linia 183, "V85 one-turn hunger check").
- `domain/diplomacy.rs` (4116 linii).
- `domain/trade.rs` (1956 linii). Zawiera trasy handlowe, `owners_have_shared_land_border` (linia 562).
- `domain/pathfinding.rs` (565 linii), `domain/turn_economy.rs` (382 linie), `domain/replay.rs` (456), `domain/save_load.rs` (209), `domain/events.rs` (530), `domain/playable.rs` (686), `bridge.rs`.
- `tests/parity_suite.rs` z testem `lcg_golden_vector_matches_the_typescript_stream`. Obecny w real24 i handoff, nieobecny w main. Potwierdza, że P2.4 ma kod w gałęzi kandydackiej.

Te moduły NIE SĄ PODPIĘTE do tury gry. Sprawdzenie wywołań:
- `decide_ai_turn`, `resolve_combat`, `advance_city_growth`: wywołania tylko w swoim pliku, w testach i w `benches/`. Jedyny wyjątek to re-eksport w `lib.rs` (`lib.rs:11`, `city_growth`).
- `playable.rs:554` `advance_turn` tylko zdejmuje kolejkę 9 faz, zwiększa turę i wpisuje status. Nie wywołuje ekonomii, AI, walki ani wzrostu miast.
- `bridge.rs` w real24 ma enum `EngineCommand` z 6 wariantami: `CreateSession`, `AddPlayer`, `SelectUnit`, `MoveUnit`, `AdvanceTurn`, `GetState`. To zgadza się z kontraktem: "candidate bridge is a six-command slice" (`PROJECT-CONTRACT...rev19`, sekcja "Current source and A/B reconciliation").
- `src-tauri/frontend/main.js` (810 linii w real24) nie ma żadnego wpisu "recruit", a przycisk `#end-turn` wywołuje `advance_turn`.
- `PlayableUnitKind` ma tylko `Warrior` (`playable.rs:302`, `:433`). Zgodne z audytem.

Klasyfikacja: obecność kodu w gałęziach kandydackich jest potwierdzona. Nie ma integracji do tury gry. Audyt bazowy opisuje to poprawnie ("module present, not connected").

### 3b. Problem: ai_turn.rs i combat.rs NIE są kompilowane do biblioteki (committed)

- `domain/mod.rs` w real24 nie deklaruje `pub mod ai_turn`, `pub mod combat`, `pub mod replay`, `pub mod save_load` ani `pub mod unit_epoch`. Deklaracje są tylko w `domain/mod.rs` dirty worktree (wg audytu, sekcja "Immediate audit conclusions", punkt 4).
- `tests/ai_turn.rs:1-2` i `tests/combat.rs:2-3` dołączają te pliki przez `#[path = "../src/domain/..."]`. Są więc kompilowane tylko w testach integracyjnych.
- Wniosek: w commitowanym kodzie moduły AI i walki są mniej zintegrowane, niż sugeruje narracja "orphan-module" z evidence. Rozwiązanie tego (`TG-B-RUST-PORT-ORPHAN-MODULE-CLEANUP`) istnieje tylko w dirty worktree.

Klasyfikacja: NIEZMERGOWANE (dla zmiany deklaracji modułów).

### 3c. Wyniki PASS w evidence, których kod nie jest w żadnej z 4 gałęzi (TYLKO-W-ARCHIWUM-NIEZMERGOWANE)

| Temat | Dowód (evidence) | Status w evidence | Sprawdzenie w gałęziach | Klasyfikacja |
|---|---|---|---|---|
| HexCoord/TerrainType dedup | `evidence/TG-B-RUST-PORT-HEXCOORD-TERRAIN-DEDUP-OPERATOR-20260923-001.md`, `TG-EVALUATOR-HEXCOORD-TERRAIN-DEDUP-20260923-001.md`, `TG-FINAL-CONTROL-HEXCOORD-TERRAIN-DEDUP-20260923-001.md` | Operator: "merged: `hex`, `ai_turn`, `pathfinding`, `map_generator`". Evaluator i FC: PASS | real24 ma 6 definicji `struct HexCoord` (ai_turn.rs:28, barbarians.rs:17, hex.rs:9, map_generator.rs:102, pathfinding.rs:17, trade.rs:65). Main ma 3. Według evidence pliki Operatora zapisano w worktree na detached `78d494c7`, bez commita ("HEAD unchanged at `78d494c7` (detached)" w jednym z plików Operatora) | TYLKO-W-ARCHIWUM-NIEZMERGOWANE |
| Terrain ground-truth bugfix "+ resulting merge" | `evidence/TG-B-RUST-PORT-TERRAIN-GROUNDTRUTH-BUGFIX-OPERATOR-20260923-001.md` (PASS, ready for independent review) | Tytuł mówi o "resulting merge" | `domain/terrain.rs` identyczny w main i real24 (`git diff --stat` pusty). Nie znaleziono śladu w innych plikach | NIEZMERGOWANE lub NIEZWERYFIKOWANE; do oceny syntezy |
| P2 bridge replay | `evidence/TG-B-RUST-PORT-P2-BRIDGE-REPLAY-OPERATOR-20260923-001.md`, `TG-EVALUATOR-P2-BRIDGE-REPLAY-20260923-001.md` (PASS), `TG-FINAL-CONTROL-P2-BRIDGE-REPLAY-20260923-001.md` | Evaluator PASS, FC "consistent, no drift" | `bridge.rs` w real24 nie ma wariantu replay; `EngineCommand` ma 6 wariantów bez replay | TYLKO-W-ARCHIWUM-NIEZMERGOWANE |
| P2 bridge save/load | `evidence/TG-B-RUST-PORT-P2-BRIDGE-SAVELOAD-OPERATOR-20260922-001.md` | Sam plik mówi: "still `PARTIAL / NOT_ACCEPTED`, not closed". FC z 2026-09-22 podaje "consistent, no gaps" | Brak wariantów save/load w `EngineCommand` | TYLKO-W-ARCHIWUM-NIEZMERGOWANE; sprzeczność między plikami evidence |
| Orphan module cleanup | `evidence/TG-B-RUST-PORT-ORPHAN-MODULE-CLEANUP-OPERATOR-20260923-001.md`, `TG-REVIEW-ORPHAN-MODULE-CLEANUP-20260923-001.md` (PASS) | PASS for 2 files | patrz 3b | NIEZMERGOWANE |
| Browser Back guard | `evidence/TG-B-RUST-PORT-BROWSER-BACK-OPERATOR-20260923-001.md`, `TG-FINAL-CONTROL-BROWSER-BACK-20260923-001.md` ("PASS — bounded fix funkcjonalnie potwierdzony") | PASS | Brak `popstate`, `history.back`, `pushState` w `rust-port/`, `src-tauri/` we wszystkich 3 gałęziach ani w `gra/src` przy web pin 69ccb145 | NIE ZNALEZIONO; miejsce poprawki nieustalone; do oceny syntezy |
| World-gen perf | `evidence/TG-EVALUATOR-WORLDGEN-PERF-20260923-001.md` (INCONCLUSIVE), `TG-FINAL-CONTROL-WORLDGEN-PERF-20260923-001.md` (INCONCLUSIVE / INFRA / DECISION_REQUIRED) | Nie PASS | nie dotyczy PASS | brak awansu statusu |

Dla pozostałych 3 wyników na poziomie evidence (P1.18 218/218, P2.12 117/117, P2.9 subset) nie mam świeżego uruchomienia testów. Audyt bazowy też ich nie uruchamiał. Liczby testów w gałęziach: main 95, real24 i handoff 215 (`cargo`, P0). Liczba atrybutów `#[test]` w real24 to 219. Różnica nie była badana.

### 3d. Obszary bez śladu w żadnej z 4 gałęzi (NIE-ISTNIEJE w kodzie)

Każdy z poniższych wyników grep dał 0 trafień w `rust-port/` dla wszystkich 4 gałęzi:
- `forced_war|ForcedWar` (forced-war-waves, T10/T11, F14, M08/M09). Zgodne z audytem bazowym: web main ma `gra/src/game/forced-war-waves.ts` (sekcja "GitHub web-game recency check").
- `veteran|battles_survived|manpower|effective_max_hp` (F15, F20, T13).
- `civ_bonus|realizuje|civs.json|bonusy` (F02, F09, M04, T12). Jedyny trafień `units.json` to komentarz w `domain/recruitment.rs:204`: "Canonical recruitment rows mirrored from `gra/data/units.json`". To nie jest loader.
- `auto_manage|auto-manage|autoManage` (F08, T05).
- `active_human_seat|per_seat|active_owner` (T07, M07). `playable.rs` ma jeden `HUMAN_PLAYER_ID`.
- `mnoznik|currency_mult` (T15, F12 waluta).
- Batch recruitment (T03, M02): brak wariantu w `EngineCommand`, zero trafień "recruit" w `main.js`.

Klasyfikacja: NIE ISTNIEJE w żadnej z 4 gałęzi. Audyt bazowy traktuje te obszary jako C albo N. To jest zgodne.

### 3e. Sprzeczności w `TG-WEB-PIN-DELTA-MATRIX-20261001.csv` (do oceny syntezy)

Kolumna `rust_counterpart` używa etykiety "R" (np. F12, F13, F16, F06, F07, T02), ale nie definiuje jej w pliku. Konfrontacja z gałęziami pokazuje niespójność:
- F12 (economy): "R: ABSENT for both". Real24 ma `domain/turn_economy.rs` (382) i `domain/trade.rs` (1956). Nie są podpięte, więc "ABSENT" w sensie "nie działa w turze" może być poprawne, ale w sensie "nie ma kodu" nie jest.
- F16/T16: "R city_growth.rs flat -1 hunger". Real24 `city_growth.rs` ma `HungerPenaltyResult` (linia 183) i `health_growth_modifier` (linia 25, 47). Model nie jest "flat -1". Kolumna R nie wskazuje jednoznacznie na gałąź. Jeśli R = main, to city_growth nie istnieje w main. Jeśli R = real24, to opis jest nieaktualny.
- F12 i T09: matrix mówi, że "T3 city_growth.rs clamp(4,14)". Real24 `city_growth.rs` ma inne limity (5/8/12). Wersja T3 jest dirty i nie została porównana z wersją commitowaną.
- F13: "R pathfinding.rs/terrain.rs lack civ movement multiplier". Pathfinding istnieje w real24, a matrix go nie wymienia.

Wniosek: kolumna "R" wymaga jednoznacznej definicji (commit lub worktree) przed użyciem w syntezie. Do oceny syntezy.

## 4. Odpowiedź na pytanie kluczowe tematu

Czy któryś system jest bardziej dokończony niż sugeruje `TG-REALIZATION-AUDIT-20260930.md`?

- Tak, w sensie obecności kodu. Real24 i handoff (commitowane) zawierają ok. 10 000+ linii modułów domenowych niepodpiętych do tury, których nie ma w main (ai_turn, city_growth, diplomacy, trade, pathfinding, turn_economy, replay, save_load, playable, bridge). Audyt je opisuje częściowo (ai_turn, combat). Nie opisuje diplomacy, trade ani pathfinding jako istniejących w gałęzi.
- Nie, w sensie gameplayu. Żadna z tych podstaw nie jest podpięta do `advance_turn`, `EngineCommand` ani UI. Wszystkie PASS z evidence dla dedup, orphan cleanup, replay i save/load istnieją tylko w niecommitowanych worktree.
- Wniosek dla wyboru bazy (P0.4/P1): real24/handoff jest jedyną gałęzią z bridge, playable i Tauri shell. Main tego nie ma. Dla bazy trzeba porównać real24 z dirty worktree, bo tam są wyniki PASS, których nie ma w real24.

## 5. Pominięte pliki i liczby (wymóg kryterium (c))

- Pliki `TG-WATCHDOG-TICK-*` w `evidence/`: 230 wierszy indeksu z 594 (zliczone po nazwach w `TG-REALIZATION-AUDIT-EVIDENCE-20260930.csv`). Treści nie czytałem.
- Pozostałe 364 pliki evidence: przeczytane jako wiersze indeksu, bez pełnej treści. Pełne treści czytałem tylko dla 33 wierszy wymienionych w sekcji 3c i dla `TG-B-RUST-PORT-P2-BRIDGE-REPLAY`, `TG-B-RUST-PORT-HEXCOORD` i `TG-B-RUST-PORT-SAVELOAD` (wycinki).
- Worktree: `TG-REALIZATION-AUDIT-ARTIFACTS-20260930.csv` ma 48 wierszy. Najwięcej: `TG-RUST-PORT-P2-BRIDGE-SAVELOAD` (26 plików, 78d494c7), `TG-P2-12-...-POPULATION-MATRIX` (10 plików, 54fc0af8, plus 1 415 plików `target/`, 414 MiB), `TG-P1-01` (6 plików, f4c89d00), `TG-A-P118-HOTSEAT` (5 zmian, 78d494c7). Wszystkie wiersze mają `NOT_IN_CURRENT_HEAD`.
- Extra worktree `/tmp/the-game-real24-readback` (78d494c7, poza listą właściciela). Nie zmieniany.

## 6. Różnice między snapshotami

- 20:35 → 20:57: P0.5 zmienione z C na D (manifest 6165/6165 PASS). Wzmocnione dowodem `evidence/TG-A-P0-5-WEB-SOURCE-MANIFEST-READBACK-20260929-001.md`. Według audytu nie został przeliczony w tej tranzie.
- Ledger `dyspozycje/rust-port/LEDGER.md` zmienił się na dysku w trakcie czytania (dodane wpisy o dispatchu). To nie jest objęte zadaniem. Nie cofałem.

## 7. Do oceny syntezy (nie pominięte po cichu)

1. Kolumna "R" w `TG-WEB-PIN-DELTA-MATRIX-20261001.csv`: brak definicji (sekcja 3e).
2. Miejsce poprawki browser-back: nie znalezione w żadnej gałęzi ani w web pin (sekcja 3c).
3. Commit/worktree źródłowy "terrain ground-truth bugfix + resulting merge" (sekcja 3c).
4. Sprzeczność między `TG-B-RUST-PORT-P2-BRIDGE-SAVELOAD-OPERATOR-20260922-001.md` (PARTIAL / NOT_ACCEPTED) a `TG-FINAL-CONTROL-P2-BRIDGE-SAVELOAD-20260922-001.md` (consistent, no gaps) (sekcja 3c).
5. Czy `diplomacy.rs` (4116 linii) i `trade.rs` (1956 linii) są zakresem portu. W snapshocie 154 nie ma ich osobnego podzadania. Mogą wchodzić w P6.7, P6.10 lub P8.7. Nie wiem, czy są w zakresie web pin 69ccb145.
6. Dwie wersje `city_growth.rs`: commitowana (5/8/12) i dirty T3 (clamp 4–14). Matrix nie wskazuje, która jest docelowa.
7. Trzy PASS dla dedup, replay i save/load wymagają ponownej kwalifikacji po zcommitowaniu. Obecnie nie mają śladu w gałęziach.
