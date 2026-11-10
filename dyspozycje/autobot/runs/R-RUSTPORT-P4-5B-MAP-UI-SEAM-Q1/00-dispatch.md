STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1
GOAL: Dokument P4-5B (kandydat z `P4-5-UI-SHELL-AUDIT.md` §6): KONTRAKT GRANICY mapa(Rust)↔UI(webview): zdarzenia wejścia (mysz/klawiatura/kółko, kto je zbiera), kursor kontekstowy, kotwice w świecie (5 grup DOM rzutowanych kamerą: etykiety oblężenia, chip budowy, bitwa itd. — wg UI-Q2=A rysuje je Rust), kontrakt pickingu (heks, encja, odznaka weterana, pigułka miasta, prostokąt `R16`), reguły „panel czy mapa” (`isPointOverCityPanelUi`, `blockPointerAt`, `blockWheelAt`), dane dzielone renderer↔UI (WZROST%, D-UI-9), stan kamery dla minimapy, kadrowanie pod panele, zoom UI 85–150% i pełny ekran (D-UI-5), transport rectów paneli do Rust (UI-Q3=B; wymiary wydajności NIE_ZMIERZONO do spike RR-T1). ROZSTRZYGNIĘCIA ORKIESTRATORA (tymczasowe, do rewizji): D-UI-5 = Rust skaluje widok synchronicznie z `--civ-ui-zoom`, pełny ekran przez API okna Tauri; D-UI-6 = natywna powierzchnia zbiera zdarzenia mapy, webview raportuje prostokąty paneli (zgodnie z UI-Q3=B). TEMAT PROJEKTOWO-ODCZYTOWY: zero kodu, zero buildu.
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (decyzja właściciela: grafika/renderer/UI-wizualia => Opus 5.5 medium; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST: pracujesz na gałęzi dokumentacyjnej `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Web: WYŁĄCZNIE `git show edb8fb56:<ścieżka>` / `git grep ... edb8fb56` (zakaz buildu/uruchamiania, zakaz zmian w gra/**, rust-port/**). Przeczytaj OBOWIĄZKOWO `dyspozycje/rust-port/p4/P4-5-UI-SHELL-AUDIT.md` (całość), `P4-3-RUST-RENDERER-ARCH.md`, `P4-10-PICKING-CPU.md`, `P4-11-CAMERA-TERRAIN-CPU.md`, LEDGER.md (decyzje UI-Q1..3). ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie o webie ma komendę/plik:linia; niepewne = NIE_ZMIERZONO. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je; nie generuj pytań ABC; luki rozstrzygaj rozsądnym ZAŁOŻENIEM zapisanym w dokumencie.

ALLOWLISTA: `dyspozycje/rust-port/p4/P4-5B-MAP-UI-SEAM.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-5B-MAP-UI-SEAM-Q1/**`. Zero zmian poza tym.
Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`.
(Równolegle: P3.19 r3 w `rust-port/engine`; inne tematy P4.12–P4.14/P5.0/P4.5B — nie dotykaj ich plików.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
