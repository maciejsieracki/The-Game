STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-2-FRONTEND-SCAFFOLD-AUDIT-Q1
GOAL: Decyzja właściciela D-REND-1: renderer Three.js (TypeScript) zostaje w webview Tauri. P4-0 zostawił otwarte: gdzie dziś leży frontend Tauri, jak jest ładowany, czy mapa w Tauri to „siatka DOM”
(twierdzenie P1-17B:12 NIE_ZMIERZONO) oraz jak ma wyglądać szkielet frontendu, który hostuje przeniesiony `gra/src/render/**` + `ui/**`. Wykonaj audyt stanu `src-tauri/**`, `rust-port/**` i
dokumentu P2-8, i zaproponuj szkielet (struktura katalogów, bundler, sposób wołania komend Tauri, gdzie trafia kopia kodu weba) z kosztami i punktami decyzji. TEMAT PROJEKTOWY/ODCZYTOWY: zero kodu, zero buildu.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model).
  Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza do pracy i zapisu: gałąź dokumentacyjna `claude/sprawdzenie-funkcjonalnosci-ek4ra0`: `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
Kod Rust/Tauri do odczytu: `git ls-tree -r origin/rust-port/parity-v2 -- src-tauri rust-port` i `git show origin/rust-port/parity-v2:<ścieżka>`. Web: WYŁĄCZNIE `git show edb8fb56:<ścieżka>` (zakaz buildu/uruchamiania weba, zakaz zmian w `gra/**`, `rust-port/**`, `src-tauri/**`).
Przeczytaj: `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` (§3.4, §7 — pozycje NIE_ZMIERZONO), `p2/P2-8-TAURI-ADAPTER.md`, `p1/P1-17B-UI-CLASSIFICATION.md`, `p1/P1-2-TOOLCHAIN.md`, `p1/P1-10-VIEWPORTS.md`,
oraz sam `src-tauri/` (Cargo.toml, tauri.conf.json, lib.rs, ewentualny frontend) na `rust-port/parity-v2`.

ZADANIE (dokument `dyspozycje/rust-port/p4/P4-2-FRONTEND-SCAFFOLD-AUDIT.md`)
1. Stan faktyczny: co jest w `src-tauri/**` (konfiguracja, `frontendDist`/`devUrl`, komendy, okna), skąd Tauri ładuje frontend, czy istnieje jakikolwiek frontend w `rust-port/**`; czy „mapa-siatka DOM” z P1-17B:12 istnieje (znajdź plik i dowód) — zamknij to NIE_ZMIERZONO.
2. Jak web jest dziś budowany (tylko odczyt `gra/package.json`, `vite`/`tsconfig`, struktura `gra/src/**`, punkty wejścia, zależności) — co z tego trzeba odtworzyć w frontendzie Tauri (bez uruchamiania buildu).
3. Wymagania platform: WebGL2 w WebView2 (Windows) / WebKitGTK / WKWebView (P4-0 D-REND-5) — co dokumentacja Tauri/repo mówi, co `NIE_ZMIERZONO`; propozycja pomiaru (bez wykonywania).
4. Propozycje szkieletu (min. 2 opcje, np. kopia `gra/src/**` do nowego katalogu frontendu w `rust-port/` z bundlerem Vite vs inny układ), z kosztem, ryzykiem rozjazdu z webem, wpływem na testy 1:1 (P4.14) i na zakaz „drugiej gry”.
   Jak wołać komendy Tauri z TS (`invoke`) zgodnie z P2-8 i kontraktem DTO (temat P4.1 robi schemat DTO — nie powtarzaj).
5. Lista `D-FE-n` do decyzji właściciela (nie rozstrzygaj po cichu) i kandydaci-tematy implementacyjne (nazwy, allowlisty, zależności).

ANTY-HALUCYNACYJNA REGUŁA
Każde twierdzenie ma dowód (komenda+wynik albo plik:linia). Niepewne = `NIE_ZMIERZONO`. Zakaz wniosków z samych nazw plików. Zakaz uruchamiania `npm`/`cargo tauri`/buildu.

BINARNE KRYTERIUM SUKCESU
Dokument odpowiada na punkty 1–5 z dowodami, zamyka (lub uczciwie zostawia z powodem) twierdzenie o siatce DOM, zawiera opcje szkieletu i `D-FE-n`; zero zmian poza allowlistą; `git diff --check` czysty.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-2-FRONTEND-SCAFFOLD-AUDIT.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-2-FRONTEND-SCAFFOLD-AUDIT-Q1/**`. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`, innych dokumentach.
(Równolegle: P4.1 kontrakt DTO — dokument; P3.15/P3.16 kod Rust; nie dotykaj ich plików.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
