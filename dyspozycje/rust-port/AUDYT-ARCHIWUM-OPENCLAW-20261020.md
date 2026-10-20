# Audyt archiwum OpenClaw — czy coś jest bardziej dokończone niż sugerował TG-REALIZATION-AUDIT-20260930

**Temat:** `R-RUSTPORT-P0-ARCHIWUM-OPENCLAW-AUDYT-Q1`. **Wynik Workflow:** `DECISION_REQUIRED` (runda 3/5).
**Model+effort:** 6 czytelników + synteza = Haiku 5.5 medium; Evaluator = Haiku 5.5 medium; Final
Control = Sonnet 5.5 medium. Wszystko przez `agent()` w Workflow (run `wf_b1d13754-137`).
**Źródła czytelników:** `notatki-reports-csv-status.md`, `notatki-ledger.md`,
`notatki-evidence-features.md`, `notatki-evidence-p1.md`, `notatki-worktree-overlays.md`,
`notatki-reszta-dossier.md` (wszystkie w `dyspozycje/rust-port/`).

## Streszczenie dla właściciela

**Tak, część portu jest dalej niż sugerował dotychczasowy audyt — ale w wąskim, konkretnym sensie:
istnieje więcej NAPISANEGO I SKOMPILOWANEGO kodu domenowego niż sądziliśmy, oraz kilka DODATKOWYCH,
nigdy niezmergowanych poprawek/funkcji czekających w archiwum. Nic z tego nie jest podłączone do pętli
tury ani zmergowane do żywej gałęzi, więc ocena funkcjonalna sprzed tego audytu ("prawie żaden moduł
domenowy nie jest podłączony do tury") pozostaje prawdziwa.**

## 1. Główne znalezisko: realny zakres kodu w `real24-staging`/`hermes-handoff`

`autobot/real24-staging` (78d494c7) i `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920` (a317fb7a)
mają **identyczny** `rust-port/` (28 plików domain, 24 pliki testów — vs. main: 18/12) i zawierają
moduły **całkowicie nieobecne na main**: `city_growth.rs` (517 l.), `diplomacy.rs` (4116 l.),
`trade.rs` (1956 l.), `pathfinding.rs` (565 l.), `turn_economy.rs` (382 l.), `events`, `playable.rs`
(686 l.), `ai_turn.rs` (1402 l.), `replay.rs`, `save_load.rs`. Bez `TODO`/`todo!`/`unimplemented!`.

**Status: ZMERGOWANE do real24/handoff, NIEZMERGOWANE do main.** `real24-staging` NIE jest przodkiem
main — to osobna linia historii (main jest 13 commitów przed jej rozgałęzieniem w widocznym zakresie).
`hermes/RECOVERY-R2` (5dc5fddc) tych modułów nie ma.

**Te moduły są NIEPODPIĘTE do tury.** Poza własnym plikiem wołają je tylko testy i `lib.rs`.
`playable.rs:554` `advance_turn` tylko przesuwa kolejkę faz. `EngineCommand` ma wciąż tylko 6 wariantów
(CreateSession, AddPlayer, SelectUnit, MoveUnit, AdvanceTurn, GetState) — **zero
rekrutacji/dyplomacji/handlu/badań jako realnych komend silnika**, zgodnie z wcześniejszym ustaleniem.

**Znaczenie dla P0.4/P0.5 (baza startowa):** to potwierdza rekomendację poprzedniego agenta — jeśli
portujemy selektywnie, `real24-staging` (albo `hermes/handoff`, identyczny) jest zdecydowanie lepszym
punktem startowym niż main-owy `rust-port/engine` (więcej gotowego, przetestowanego kodu domenowego
do klasyfikacji REUSE/ADAPT, mimo że nic z niego nie jest jeszcze podłączone do rozgrywki).

## 2. Potwierdzony, żywy bug w `real24-staging`/`handoff` — nie naprawiony

**Teren: koszt Pustyni i przejezdność Tundry są błędne w kodzie, który REALNIE się kompiluje i działa
(nie w nieużywanym module).**
- `ai_turn.rs:101`: Desert = koszt ruchu 1. Web (`gra/data/terrain-movement.json` na main): `"Pustynia": 2`.
  Pathfinder (`pathfinding.rs`, poprawny) liczy 2 — czyli **AI liczy koszt inaczej niż pathfinder i niż
  web**, prawdopodobny błąd gameplayu.
- `barbarians.rs:73-75`, `trade.rs:142-143`: Tundra traktowana jako przejezdna. Web: `"Polarny": 99`
  (nieprzejezdna).
- Poprawka tych dwóch błędów **istnieje w archiwum** (`worktree-overlays/.../TG-RUST-PORT-P2-BRIDGE-SAVELOAD-...patch`,
  przeszła PASS Evaluator+Final Control w OpenClaw), ale **nigdy nie została zmergowana** — błąd nadal
  żyje w `78d494c7`/`a317fb7a` dziś.

**Rekomendacja:** jeśli P0.4 wybierze `real24-staging` jako bazę forka, ta poprawka terenu powinna
trafić do P1/P1.17 jako pierwszy, już zidentyfikowany defekt do naprawy — nie trzeba go odkrywać od
nowa.

## 3. Niezmergowane patche w `worktree-overlays/` — gotowy kod, ale wzajemnie sprzeczny

4 kandydaty, wszystkie **NIEZMERGOWANE** do żadnej z 4 żywych gałęzi:

| Patch | Co dodaje | Konflikt |
|---|---|---|
| BRIDGE (`TG-RUST-PORT-P2-BRIDGE-SAVELOAD-20260922-001`) | `SaveGame`/`LoadGame`/`GetReplayLog` w bridge, `web_save.rs` (193 l.), `assets.rs` (AssetKey, 125 l.), poprawka terenu (pkt 2) | dotyka `gra/src/map/gen-helpers.ts` i `gra/src/ui/newGameFlow.ts`, dodaje `gra/src/ui/newGameHistory.ts` — **łamie zasadę "zero zmian w `gra/**`"** |
| P118 hot-seat (`TG-A-P118-HOTSEAT-TURN-BOUNDARY-20260929-001`) | drugi fotel ludzki w `playable.rs`/`playable_slice.rs`, test `hotseat_turn_boundary.rs` | **ten sam base `playable.rs` co BRIDGE** — nie da się zastosować obu naraz bez ręcznego scalenia; brakuje `#[serde(default)]`/podbicia wersji snapshotu (złamie stare zapisy) |
| P2-12 population matrix | głód ułamkowy (`HungerDebt`), 8 testów | baza to **INNA, piąta gałąź** (`hermes/integration/...-20260922`, nie jedna z 4 z P0!); koliduje z `city_growth.rs` z real24 (inna sygnatura `apply_hunger_penalty`) i z plikami BRIDGE (`web_save.rs`, `bridge.rs`, `save_load.rs`) |
| P1-01 entrypoint script | model 3×3 niezależny od `gra/`/Rust | nie dotyczy gameplayu |

**Żaden z tych patchy nie da się po prostu zaaplikować** — trzy z czterech kolidują ze sobą na tych
samych plikach, a BRIDGE dodatkowo narusza zasadę zero-zmian-w-`gra/**`.

## 4. Audyt P1 w archiwum — częściowo gotowy, ale na starym pinie

Katalog `evidence/TG-A-P1-*`/`TG-B-P1-*` pokrywa P1.2–P1.16, P1.18 (nie P1.1, P1.17 w pełni). Wszystkie
archiwalne piny webowe (`54fc0af8`, `93f5ed43`, `69ccb145`, `a8c9cf6c`) **SĄ przodkami obecnego main**
`edb8fb56` — więc formalnie "zmergowane", ale część danych jest już nieaktualna (np. `civ-matrix.json`
`paramDefs` 113→93, `gra/src/main.ts` zmieniony). P1.3–P1.7, P1.10, P1.11, P1.13 nadają się do
odtworzenia bez ponownego zbierania, tylko z przeliczeniem hashy/linii. **P1.17 (klasyfikacja Rust
REUSE/ADAPT/REPLACE) i P1.18 (hot-seat) trzeba zrobić praktycznie od zera** na obecnym pinie — archiwum
ich nie pokrywa rzetelnie.

## 5. Czego NIE ma nigdzie (potwierdzone, zgodne z dotychczasowym audytem)

`forced-war` (web ma `forced-war-*.ts`, Rust: 0), `culture`/`religion` (tylko wzmianka
`CommonReligion`), cuda świata (tylko `wonder_trade_bonus_for_owner`), państwa-miasta, batch
recruitment, `auto_manage` — zero w kodzie Rust wszystkich 4 gałęzi. `combat.rs`/`barbarians.rs` są
identyczne w main/real24/hermes — nie są bardziej dokończone nigdzie.

## 6. Zastrzeżenie co do rzetelności tego audytu

Final Control tej rundy (3/5) sam przyznał w swoim werdykcie: wykonał tylko jeden spot-check (na 9
zarzutów Evaluatora z poprzednich rund) i przyjął resztę na podstawie deklaracji Obrony, bez
niezależnej re-weryfikacji — słabszy rygor niż w temacie P0 (gdzie Final Control sam ponownie uruchomił
komendy). Żaden czytelnik ani Final Control nie uruchomił `cargo test`/`tsc` w tej rundzie — liczby
plików/testów pochodzą z `grep`/`git ls-tree`, nie z realnego builda. Traktować powyższe jako mapę
materiału i wiarygodne wskazania "co gdzie jest", nie jako w pełni zweryfikowany stan kompilacji.

## Rekomendacja (REUSE/ADAPT/REPLACE/UNKNOWN na tym etapie)

- **ADAPT, wysoki priorytet:** poprawka terenu (Desert/Tundra) z patcha BRIDGE — mały, izolowany,
  dobrze udokumentowany fix.
- **UNKNOWN, wymaga decyzji właściciela:** reszta patcha BRIDGE (save/load, replay, assets) — przydatna
  specyfikacja/inspiracja, ale dotyka `gra/**` i koliduje z P118/P2-12.
- **UNKNOWN, wymaga decyzji właściciela:** P118 hot-seat i P2-12 population matrix — konkretne,
  przetestowane rozwiązania konkretnych systemów, ale wzajemnie sprzeczne i na różnych bazach.
- **REPLACE/do zrobienia od zera:** P1.17 (klasyfikacja Rust), P1.18 (hot-seat behavior matrix na
  obecnym pinie).
