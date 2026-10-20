STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-TERRAIN-DESERT-TUNDRA-FIX-Q1
GOAL: Naprawić w gałęzi `rust-port/parity-v2` (forkowanej z `autobot/real24-staging`, HEAD 78d494c7)
dwa potwierdzone błędy ruchu po terenie, zidentyfikowane w audycie archiwum OpenClaw
(dyspozycje/rust-port/AUDYT-ARCHIWUM-OPENCLAW-20261020.md pkt 2):
  (1) `ai_turn.rs:101` liczy koszt ruchu po Pustyni jako 1, podczas gdy web
      (`gra/data/terrain-movement.json` na pinie `edb8fb56`) i poprawny `pathfinding.rs` dają 2;
  (2) `barbarians.rs:73-75` i `trade.rs:142-143` traktują Tundrę jako przejezdną, podczas gdy web
      (`"Polarny": 99`) i `pathfinding.rs` traktują ją jako nieprzejezdną.
Archiwum zawiera gotową, wcześniej zaakceptowaną (PASS Evaluator+Final Control w OpenClaw) poprawkę w
patchu `worktree-overlays/TG-RUST-PORT-P2-BRIDGE-SAVELOAD-20260922-001.patch` — potraktuj ją WYŁĄCZNIE
jako inspirację/punkt odniesienia (decyzja właściciela 2026-10-20: patche archiwum = UNKNOWN/REFERENCE,
nie kopiować 1:1) — napisz i zweryfikuj poprawkę samodzielnie na obecnym stanie `rust-port/parity-v2`.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystkie wyłącznie przez agent() w Workflow.

ZADANIE (jedno zdanie)
Po zakończeniu: `ai_turn.rs` liczy koszt Pustyni = 2 (zgodnie z `pathfinding.rs`/web), `barbarians.rs` i
`trade.rs` traktują Tundrę jako nieprzejezdną (zgodnie z `pathfinding.rs`/web), wszystkie trzy miejsca
są ze sobą spójne, istniejące i nowe testy przechodzą (`cargo test` w `rust-port/engine`).

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania tematu za zamknięty bez: (a) pokazania dokładnego diffu zmienionych linii, (b) realnie
uruchomionego `cargo test` PRZED zmianą (pokazującego, że istniejący test na tę wartość — jeśli jest —
czerwienieje/nie istnieje) i PO zmianie (zielony), (c) jawnego porównania nowej wartości z
`gra/data/terrain-movement.json` na pinie `edb8fb56` (nie z pamięci/archiwum).

BINARNE KRYTERIUM SUKCESU
PRAWDA jeśli: `cargo test` w `rust-port/engine` na gałęzi `rust-port/parity-v2` kończy się sukcesem
PO zmianie, z co najmniej dwoma nowymi/zmienionymi testami jawnie sprawdzającymi (1) koszt ruchu po
Pustyni = 2 w `ai_turn.rs`, (2) nieprzejezdność Tundry w `barbarians.rs` i `trade.rs` — oraz log
pokazujący, że PRZED poprawką te same asercje by failowały (czerwony→zielony, nie tylko zielony).

ALLOWLISTA
- rust-port/engine/src/domain/ai_turn.rs
- rust-port/engine/src/domain/barbarians.rs
- rust-port/engine/src/domain/trade.rs
- rust-port/engine/tests/** (nowe/zmienione testy dotyczące tej poprawki)
- dyspozycje/autobot/runs/R-RUSTPORT-P1-TERRAIN-DESERT-TUNDRA-FIX-Q1/**
Zakazane: wszystko w `gra/**`, `docs/decyzje/<ID>.md`, `.git/**` poza normalnym działaniem git,
`dyspozycje/WERSJE.md`, `npm run build`/`npm run dev`, `git add -A`/`git add .`, kopiowanie kodu 1:1
z patcha archiwum (dozwolone: przeczytać go jako inspirację, napisać własną poprawkę).

IZOLACJA
Worktree na gałęzi `rust-port/parity-v2` (origin, HEAD 78d494c7 w momencie forka z
`autobot/real24-staging`). Jeden pisarz na worktree.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje konkretny defekt, Operator poprawia w tej samej rundzie na tej samej gałęzi. Po 5
rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Max ok. 400 słów w raporcie. Diff + wynik testu, nie surowy log. Zakaz edycji poza allowlistą. Zakaz
commitowania/pushowania/integrowania (robi to orkiestrator po PASS).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY/COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
