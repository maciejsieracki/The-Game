# 03-final-control — R-RUSTREAL-WEB-1TO1-PORT-HANDOFF-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: HANDOFF / INFRA
TEMAT: R-RUSTREAL-WEB-1TO1-PORT-Q1
ROLE: Final Control
ROUND: 1/5 recovery 1
KANBAN: t_5dcf8610 / run834

## Werdykt

PASS-WITH-NOTES. READY_FOR_HANDOFF_PUSH: TAK.
OBJECTIONS: brak (0 ponumerowanych zarzutów). Evaluator run833 zwrócił pustą
listę zarzutów, więc Obrona nie powstaje.

Pakiet spełnia bramkę kompletności, proweniencji i lokalnej gotowości do
przekazania. Jest planem, manifestem i handoffem dla przyszłej przebudowy 1:1;
nie jest akceptacją parytetu produktu, grywalnego produktu, instalacji ani
deploymentu.

## Łańcuch faz

- `t_7465f4b4/run831`: TIMEOUT/GAVE_UP; historia zachowana.
- `t_b5deca1e/run832`: PASS-WITH-NOTES, bounded recovery, ten sam temat,
  workspace, branch i BASE/HEAD.
- `t_21c15f87/run833`: PASS-WITH-NOTES, niezależny Evaluator, 0 objections.
- `t_5dcf8610/run834`: niniejsza Final Control.

## Dowody pakietu

- Odczytano osiem dokumentów handoffu i trzy pliki Operatora; wszystkie
  wymagane ścieżki istnieją jako zwykłe pliki.
- Przed zapisaniem artefaktów Final Control obecne były wyłącznie 11 żądanych
  plików Operatora oraz jawne pliki fazowe `00-dispatch.md`, `02-dispatch.md`,
  `02-evaluator.md`, `02-evidence.json`, `02-transition-receipt.md` i
  `03-dispatch.md`. Nie potraktowano dispatchów fazowych jako dodatkowych
  wyjść Operatora.
- Manifest: 2045 wpisów łącznie, 2034 tracked; kategorie:
  `reference_read_only` 443, `current_rust_tauri` 69, `data_assets` 356,
  `tests_and_gates` 1160, `build_and_packaging` 6, `handoff_docs` 11.
- Wszystkie 2034 manifestowane SHA-256 tracked zgadzają się z bieżącym
  worktree. `07-CHECKSUMS-SHA256.txt`: 2044/2044 wpisów zweryfikowanych,
  własny checksum celowo wyłączony.
- Dokumenty jednoznacznie oznaczają `gra/**`/oryginalny frontend jako
  `reference_read_only`, a obecny Tauri UI/mapę jako `REPLACE_OR_REWIRE`.
  Wymagają pełnego kontraktu webowego i dziewięciu opcji początkowych oraz
  odrzucają płaską siatkę HTML, trzy hard-coded civ, Unicode/placeholdery,
  fake DOM i wcześniejszy playable-slice/MSI/NSIS jako dowód 1:1.
- Read-only source trace potwierdził ograniczenia harnessu:
  `src-tauri/frontend/main.js:65-84` ma trzy inline civ, a `:665-692`
  renderuje przyciski HTML z markerami Unicode; `index.html:38` opisuje
  compact equivalent, a `:150-159` definiuje grid/tile. Referencyjny web ładuje
  dane w `gra/src/ui/newGameFlow.ts:493-568`, używa brandowego SVG w `:634-646`,
  ma 15 rekordów w `gra/data/civs.json`, a `gra/src/render/scene.ts:31-32,
  335-338` używa Three.js/WebGLRenderer.

## Git i granica efektu

- Worktree: `/home/ubuntu/projects/The-Game-web-1to1-port-handoff-20260920`.
- Branch: `hermes/handoff/R-RUSTREAL-WEB-1TO1-PORT-Q1-20260920`.
- HEAD/BASE: `78d494c7a4c6cdbd4dd4db0a663fca0b5d4e3b1e`.
- Live `git ls-remote`: `origin/autobot/real24-staging` wskazuje ten sam SHA;
  `origin/main` wskazuje `f4c89d0081c622c16b207d338b49c8bacafc4553`.
- Tracked diff, staged paths i `git diff --check`: czyste. Untracked paths
  są wyłącznie oczekiwanymi dokumentami procesu. Brak wygenerowanego
  `rust-port/engine/Cargo.lock`, `target/`, `dist/` lub nieśledzonych logów;
  istniejący `src-tauri/Cargo.lock` jest tracked wejściem repozytorium.
- Nie uruchamiano `cargo`, `npm`, Vite, Tauri, browsera ani package managera.
- `PRODUCT_CHANGE: false`, `COMMIT: false`, `PUSH: false`, `MERGE: false`,
  `DEPLOY: false`.

## Następny krok

Orkiestrator może wykonać osobny, jawny commit/push handoffu po własnym
readbacku. Push jest autoryzowany wyłącznie do dedykowanego brancha handoffu;
nie do `main`. Po pushu trzeba odczytać zdalny exact SHA i pliki. Packaging,
instalacja i twierdzenie o parytecie pozostają zablokowane do czasu faktycznego
dowodu 1:1.
