STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-5-UI-SHELL-AUDIT-Q1
GOAL: Po decyzji właściciela (renderer 3D w Rust, nie w webview) UI gry (HUD, panele, dialogi, intro, wybór epoki/cywilizacji — P5, 1:1 z webem) nadal żyje w webview Tauri. Zbadaj stan faktyczny frontendu Tauri
i zaproponuj szkielet UI, który współistnieje z natywną powierzchnią renderera: co dziś jest w `src-tauri/**`, co web ma w `gra/src/ui/**` (117 plików .ts) i `main.ts`, jak UI komunikuje się z silnikiem (komendy/zdarzenia),
gdzie jest granica UI <-> renderer (np. tooltipy nad mapą, nakładki, kursor, picking), czy twierdzenie P1-17B:12 o „siatce DOM” w Tauri jest prawdziwe. TEMAT PROJEKTOWY/ODCZYTOWY: zero kodu, zero buildu.
RUNDA: 1/5
MODEL+EFFORT: Operator: Opus 5.5 medium. Evaluator: Opus 5.5 medium. Final Control: Opus 5.5 medium (decyzja właściciela 2026-10-21: wszędzie, gdzie wchodzą rendery i grafika — Opus 5.5 medium;
  wyjątek graficzny R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza do pracy i zapisu: gałąź dokumentacyjna `claude/sprawdzenie-funkcjonalnosci-ek4ra0`: `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
Kod Rust/Tauri: `git ls-tree -r origin/rust-port/parity-v2 -- src-tauri rust-port` + `git show origin/rust-port/parity-v2:<ścieżka>`. Web: WYŁĄCZNIE `git show edb8fb56:<ścieżka>` (zakaz buildu, zakaz zmian w `gra/**`, `rust-port/**`, `src-tauri/**`).
Znane fakty (do zweryfikowania, nie przyjmować na wiarę): `src-tauri/tauri.conf.json` ma `frontendDist="frontend"`, `withGlobalTauri: true`, okno `main` 1280x800, brak `devUrl`; istnieją `src-tauri/frontend/index.html` i `main.js` (810 linii).
Przeczytaj: `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` (§3, §6), `p2/P2-8-TAURI-ADAPTER.md`, `p1/P1-17B-UI-CLASSIFICATION.md`, `p1/P1-9-MAP-HUD-PANELS.md`, `p1/P1-10-VIEWPORTS.md`, `p1/P1-2-TOOLCHAIN.md`.

ZADANIE (dokument `dyspozycje/rust-port/p4/P4-5-UI-SHELL-AUDIT.md`)
1. Stan `src-tauri/**` i `src-tauri/frontend/**`: konfiguracja, komendy, okna, co robi `main.js`; czy istnieje „siatka DOM” z P1-17B:12 (znajdź i zacytuj) — zamknij NIE_ZMIERZONO.
2. UI weba: podział `gra/src/ui/**` na kategorie (HUD, panele miasta/jednostek, dialogi, intro/ustawienia, tooltipy, ikony), które elementy ZALEŻĄ od renderera 3D (miniatury jednostek, tooltipy po najechaniu, nakładki nad mapą, podgląd cudów) — tabela z dowodami; jak UI dostaje dane (importy logiki gry — policz) i jakie wywołania wykonuje.
3. Granica UI <-> natywny renderer (przy rendererze w Rust): kto rysuje tooltipy/nakładki zakotwiczone w hexach (HTML nad natywną powierzchnią vs. rysowane przez renderer), kto obsługuje kursor/wejście, jak działa zoom/pan/resize. Opisz opcje z kosztami; bez zmyślania możliwości Tauri (NIE_ZMIERZONO).
4. Szkielet UI: min. 2 opcje (np. kopia `gra/src/ui/**` jako frontend Tauri z bundlerem vs. przepisanie UI), koszt, ryzyko rozjazdu z webem, wpływ na testy 1:1 (zrzuty DOM/ekran), zgodność z P5.13 (zero symulacji w JS).
5. Lista `D-UI-n` do decyzji właściciela (nie rozstrzygaj po cichu) i kandydaci-tematy (nazwy, allowlisty, zależności).

ANTY-HALUCYNACYJNA REGUŁA
Każde twierdzenie ma dowód (plik:linia lub komenda+wynik). Niepewne = `NIE_ZMIERZONO`. Zakaz uruchamiania `npm`/`cargo tauri`/buildu. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu —
to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
Dokument odpowiada na punkty 1–5 z dowodami, zamyka (lub uczciwie zostawia z powodem) twierdzenie o siatce DOM, zawiera opcje szkieletu i `D-UI-n`; zero zmian poza allowlistą; `git diff --check` czysty.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-5-UI-SHELL-AUDIT.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-5-UI-SHELL-AUDIT-Q1/**`. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`, innych dokumentach.
(Równolegle: P4.3 architektura renderera Rust, P4.4 katalog modeli — dokumenty; P3.16 kod Rust — nie dotykaj.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
