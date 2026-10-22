STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1
GOAL: Przygotuj spike RR-T1 (osadzenie powierzchni wgpu pod przezroczystym webview w Tauri; `P4-3-RUST-RENDERER-ARCH.md`, D-RR-2=A, oraz `P4-5B-MAP-UI-SEAM.md` §2/§4 mechanizmy M1/M2/M3 wejścia) tak, aby właściciel mógł go URUCHOMIĆ jedną komendą na własnej maszynie z GPU (Windows/macOS/Linux) i odesłać wynik. Środowisko agenta NIE ma GPU/okna: Twoje zadanie to kod spike'a, który się KOMPILUJE (tyle ile da się zbudować tu), plus procedura pomiarowa i szablon raportu wyniku. Spike jest samodzielnym crate'em `rust-port/spike-gpu-embed/` POZA workspace'ami (osobny `Cargo.toml`, `[workspace]` pusty), z zależnościami `tauri` (wersja z `src-tauri/Cargo.lock`), `wgpu =30.0.1` (jak renderer), `pollster`; bez zmian `src-tauri/**`, `rust-port/renderer/**`, `rust-port/engine/**`.
Spike ma mierzyć i raportować (JSON do pliku + log): (1) czy da się narysować klatkę wgpu (kolor + trójkąt) w oknie Tauri pod przezroczystym webview z elementem HTML nad nią; (2) M1: czy kliknięcie w „dziurę” (poza prostokątami UI) trafia do okna natywnego, a w prostokąt UI do webview (przez region wejścia hosta webview: WebView2 / GTK input shape / macOS hitTest — implementuj dla platform, które da się napisać; niedostępne = stub z `cfg` i komunikatem); (3) M2: odwrócone warstwy (okno-dziecko) jeśli M1 się nie uda; (4) opóźnienie IPC webview→Rust dla 1000 zdarzeń `PointerMove` (min/p50/p95/max) oraz Rust→webview; (5) pamięć procesu po 1 min renderowania; (6) fokus klawiatury po kliknięciu w okno natywne; (7) `Window::is_fullscreen` po `set_fullscreen`. Każdy punkt: PASS/FAIL/NIE_ZMIERZONO z dowodem w raporcie.
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (renderer/grafika; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza kodu: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`. Dokumenty czytaj z `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`). Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-3-RUST-RENDERER-ARCH.md` (osadzenie, RR-T1), `P4-5B-MAP-UI-SEAM.md` (M1/M2/M3, §15 NIE_ZMIERZONO 1–3), `P4-6-RENDERER-CRATE-SCAFFOLD.md`, `src-tauri/Cargo.toml`+`Cargo.lock`.
BUDOWANIE: `CARGO_INCREMENTAL=0`, osobny `CARGO_TARGET_DIR` per worktree (usuń po pracy), `--locked` gdy lock jest commitowany (w spike'u Cargo.lock COMMITUJ jako trzeci wyjątek — uzasadnij). Linux: zbuduj ile się da (`cargo check`); jeśli brakuje bibliotek systemowych (GTK/WebKit) — NIE instaluj ich ani nie omijaj; zapisz dokładny błąd i która część kodu jest niezweryfikowana kompilacją (NIE_ZMIERZONO). Możesz wydzielić kod niezależny od GTK (generowanie raportu, statystyki, protokół) do osobnego modułu z testami jednostkowymi, które DZIAŁAJĄ tutaj.
Dysk: usuń target po pracy. Nie dodawaj zależności spoza: tauri, wgpu, pollster, serde, serde_json, raw-window-handle, oraz natywne API platform przez cechy `windows`/`objc2`/`gtk` WYŁĄCZNIE jeśli już są w lockfile tauri.
DOKUMENTY (NOWE): `dyspozycje/rust-port/p4/P4-15-GPU-SPIKE.md` (opis, co spike mierzy i dlaczego, mapowanie na pytania NIE_ZMIERZONO z P4-3/P4-5B, SZABLON RAPORTU WYNIKU dla właściciela, instrukcja uruchomienia krok po kroku PO POLSKU, tabela platform: co zaimplementowano / co stub / co niezweryfikowane) i `dyspozycje/autobot/runs/R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1/**`.
ANTY-HALUCYNACYJNA REGUŁA: zakaz twierdzeń „działa na GPU/okno/WebView” — nie masz ich; wszystko niewykonane = NIE_ZMIERZONO. Pełne surowe logi z EXIT=. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i nie generuj pytań ABC; luki rozstrzygaj ZAŁOŻENIEM zapisanym w dokumencie.

BINARNE KRYTERIUM SUKCESU
Crate `spike-gpu-embed` istnieje, część niezależna od GTK/GPU ma testy zielone, `cargo check` wykonane albo jawnie udokumentowany błąd środowiska; dokument z instrukcją po polsku i szablonem raportu; zero zmian poza allowlistą; `git diff --check` czysty.

ALLOWLISTA
`rust-port/spike-gpu-embed/**` (NOWY), `dyspozycje/rust-port/p4/P4-15-GPU-SPIKE.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-15-GPU-SPIKE-PREP-Q1/**`. Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `rust-port/renderer/**`, `.github/**`.
IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
