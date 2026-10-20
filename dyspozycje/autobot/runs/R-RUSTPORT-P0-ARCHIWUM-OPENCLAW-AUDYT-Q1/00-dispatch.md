STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P0-ARCHIWUM-OPENCLAW-AUDYT-Q1
GOAL: Przeanalizować CAŁY dotąd nieprzeczytany materiał przekazany przez poprzedniego agenta
(OpenClaw) w `/home/user/the-game-transfer-extracted/` i w oryginalnym dossier
`/root/.claude/uploads/cbf4a126-dca3-5f50-bfb0-2a747b18a590/8c8144a4-TRANSFER-HANDOFF-THE-GAME-20261019.md`,
i ustalić: czy jakiś moduł/system portu Rust jest w rzeczywistości BARDZIEJ dokończony niż sugeruje
`reports/TG-REALIZATION-AUDIT-20260930.md` (dokument, na którym oparłem dotychczasową ocenę stanu).
Właściciel wprost polecił to zrobić PRZED otwarciem fazy P1.
RUNDA: 1/5
MODEL+EFFORT: Operator (czytelnicy + synteza): Haiku 5.5, effort medium. Evaluator: Haiku 5.5, effort
  medium. Final Control: Sonnet 5.5, effort medium. Wszystkie wyłącznie przez agent() w Workflow.

ZADANIE (jedno zdanie)
Po zakończeniu istnieje jeden destylowany raport w `dyspozycje/rust-port/AUDYT-ARCHIWUM-OPENCLAW-20261020.md`,
który dla KAŻDEGO z poniższych źródeł podaje: co w nim jest, czy wskazuje na pracę bardziej zaawansowaną
niż `TG-REALIZATION-AUDIT-20260930.md` sugeruje, i z dokładnym wskazaniem pliku/ścieżki jako dowodu — nie
ogólnikiem.

ŹRÓDŁA DO PRZEJRZENIA (wszystkie pod `/home/user/the-game-transfer-extracted/` chyba że wskazano inaczej):
1. `workspace/reports/` — WSZYSTKIE 8 plików, w tym `TG-P0-P11-154-STATUS-20260929-2057.md` (najnowszy
   snapshot statusu 154 podzadań), `TG-REALIZATION-AUDIT-154-BASELINE-20260930.csv`,
   `TG-REALIZATION-AUDIT-ARTIFACTS-20260930.csv`, `TG-REALIZATION-AUDIT-EVIDENCE-20260930.csv`,
   `TG-WEB-PIN-DELTA-MATRIX-20261001.csv`, `PROJECT-CONTRACT-THE-GAME-20260920.rev19-SNAPSHOT-20261001.md`.
   NAJWYŻSZY PRIORYTET — to strukturalne dane stanu 154 zadań, najbardziej prawdopodobne źródło znalezisk.
2. `workspace/ledger/TG-PLAN-IMPLEMENTATION-20260920-001.md` (275 KB) — pełna chronologia prac/decyzji.
3. `workspace/evidence/` (594 plików) — POMIŃ pliki `TG-WATCHDOG-TICK-*` (tylko policz je, nie czytaj
   treści, to heartbeat bez treści domenowej). Priorytet: pliki `TG-EVALUATOR-*`, `TG-FINAL-CONTROL-*`,
   `TG-REVIEW-*`, `TG-B-RUST-PORT-*` (dotyczą konkretnych nazwanych funkcji: browser-back,
   hexcoord-terrain-dedup, p2-bridge-replay, p2-bridge-saveload, terrain-groundtruth-bugfix,
   worldgen-perf, asset-id-mapping, orphan-module-cleanup) oraz `TG-A-P1-*`/`TG-B-P1-*` (katalog audytu
   P1 — może oznaczać, że P1 web-audit reference-pack jest już częściowo/w całości wykonany).
4. `worktree-overlays/` — `STATUS.tsv` + WSZYSTKIE 4 katalogi/patche (`TG-P2-12-IMPLEMENT-POPULATION-MATRIX-CONTRACT-A-20260925-001`,
   `TG-RUST-PORT-P2-BRIDGE-SAVELOAD-20260922-001`, `TG-A-P118-HOTSEAT-TURN-BOUNDARY-20260929-001`,
   `TG-P1-01-build-the-complete-file-module-entrypoint-script-and-20260920-001`) — to NIEZMERGOWANY kod,
   skatalogować dokładnie co każdy patch dodaje.
5. `workspace/dispatch/`, `workspace/orchestration/`, `workspace/process/`, `workspace/memory/` — niższy
   priorytet, skan pod kątem czegokolwiek dotyczącego konkretnych systemów gameplayu (nie infrastruktury
   OpenClaw).
6. `workspace/PLAN-RUST-PORT-ORCHESTRACJA-20260920.md` §9 "Warunek ukończenia projektu" (koniec pliku,
   ok. 941 linii) — jedyna sekcja tego pliku nigdy nieprzeczytana.
7. `/root/.claude/uploads/cbf4a126-dca3-5f50-bfb0-2a747b18a590/8c8144a4-TRANSFER-HANDOFF-THE-GAME-20261019.md`
   (109 234 linii, 14 MB) — przeczytane tylko linie 1-77. Reszta to inwentarz plików — zamiast pełnego
   odczytu, przeszukaj grepem pod kątem nazw systemów gameplayu (combat, diplomacy, trade, culture,
   religion, wonder, tech, barbarian, city-state, hotseat, forced-war, save, load) i odnotuj trafienia.

ANTY-HALUCYNACYJNA REGUŁA
Każde twierdzenie "system X jest bardziej dokończony" MUSI mieć dokładną ścieżkę pliku-dowodu i cytat
(nie parafrazę z pamięci). Status "zatwierdzony przez Evaluator/Final Control w evidence" NIE oznacza
automatycznie "zmergowany do żywej gałęzi" — każde takie znalezisko musi być skonfrontowane z czterema
gałęziami Rust zweryfikowanymi w P0 (main edb8fb56, autobot/real24-staging 78d494c7, hermes/handoff
a317fb7a, hermes/RECOVERY-R2 5dc5fddc) — sprawdź czy kod z danego evidence/patcha faktycznie tam jest
(np. `git show <gałąź>:<ścieżka>` albo grep w świeżym checkoucie), czy istnieje TYLKO w
worktree-overlays/evidence i nigdy nie trafił do żadnej z 4 gałęzi.

BINARNE KRYTERIUM SUKCESU
PRAWDA jeśli: (a) wszystkie 7 źródeł powyżej mają jawny wpis w raporcie końcowym (co najmniej:
przejrzane/nie w pełni przejrzane + dlaczego), (b) każde znalezisko "bardziej dokończone niż audyt"
ma ścieżkę dowodu i status zmergowania sprawdzony względem 4 gałęzi z P0, (c) policzona liczba plików
TG-WATCHDOG-TICK-* pominiętych jest podana jawnie (nie cicho zignorowana).

ALLOWLISTA
Zapis wyłącznie w:
- dyspozycje/rust-port/AUDYT-ARCHIWUM-OPENCLAW-20261020.md (raport końcowy)
- dyspozycje/autobot/runs/R-RUSTPORT-P0-ARCHIWUM-OPENCLAW-AUDYT-Q1/**
Odczyt: cały `/home/user/the-game-transfer-extracted/`, cały `/root/.claude/uploads/cbf4a126-dca3-5f50-bfb0-2a747b18a590/`,
cały bieżący checkout repo (do porównania z gałęziami). Zero zapisu w gra/**, zero `git add -A`,
zero commitów/pushy (robi to wyłącznie orkiestrator po PASS).

IZOLACJA
Czysta praca odczytowa na już wypakowanym materiale — nie wymaga nowego worktree. Jeśli trzeba
porównać z gałęzią Rust, użyj świeżego `git show <gałąź>:<ścieżka>` albo osobnego scratch-clone, nie
modyfikuj bieżącego checkoutu repo.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w pozostałych tematach — Evaluator wskazuje konkretny brak pokrycia źródła, Operator uzupełnia w
tej samej rundzie. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport końcowy max ok. 1500 słów (to jest synteza researchu, nie zwykły raport 400-słowny — większy
budżet uzasadniony objętością źródeł). Destylat: lista znalezisk z dowodami, nie surowe cytaty całych
plików. Zero edycji poza allowlistą. Decyzja produktowa → DECISION_REQUIRED.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
