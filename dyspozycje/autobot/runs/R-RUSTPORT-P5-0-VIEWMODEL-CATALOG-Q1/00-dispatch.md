STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1
GOAL: Dokument P5-0 (kandydat z `P4-5-UI-SHELL-AUDIT.md` §6): katalog MODELU WIDOKU — dla 49 modułów UI weba (`gra/src/ui/**`), które importują logikę gry (142 linie z `game/**`), wypisz DOKŁADNIE, jakie dane i reguły UI czyta/liczy lokalnie (np. `cityPanel` liczy reguły; `cityGrowthLive`), i zaproponuj docelowe DTO z Rust (nazwa, pola, typy, który moduł UI konsumuje, które reguły muszą przenieść się do silnika wg P5.13). Decyzje wiążące: UI-Q1=A (kopia paneli weba + Vite), UI-Q2=A (wszystko Rust rysuje etykiety zakotwiczone na mapie), UI-Q3=B (natywna powierzchnia Rust zbiera zdarzenia mapy), D-UI-9: jedno pole DTO dla liczb dzielonych przez renderer i UI. TEMAT PROJEKTOWO-ODCZYTOWY: zero kodu, zero buildu, zakaz zmian w `gra/**` i `rust-port/**`.
RUNDA: 1/5
MODEL+EFFORT: Operator/Evaluator/Final Control: Opus 5.5 medium (decyzja właściciela: grafika/renderer/UI-wizualia => Opus 5.5 medium; R-PROC-AUTOBOT.md §5a, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST: pracujesz na gałęzi dokumentacyjnej `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Web: WYŁĄCZNIE `git show edb8fb56:<ścieżka>` / `git grep ... edb8fb56` (zakaz buildu/uruchamiania, zakaz zmian w gra/**, rust-port/**). Przeczytaj OBOWIĄZKOWO `dyspozycje/rust-port/p4/P4-5-UI-SHELL-AUDIT.md` (całość), `P4-3-RUST-RENDERER-ARCH.md`, `P4-10-PICKING-CPU.md`, `P4-11-CAMERA-TERRAIN-CPU.md`, LEDGER.md (decyzje UI-Q1..3). ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie o webie ma komendę/plik:linia; niepewne = NIE_ZMIERZONO. W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je; nie generuj pytań ABC; luki rozstrzygaj rozsądnym ZAŁOŻENIEM zapisanym w dokumencie.

ALLOWLISTA: `dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1/**`. Zero zmian poza tym.
Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`.
(Równolegle: P3.19 r3 w `rust-port/engine`; inne tematy P4.12–P4.14/P5.0/P4.5B — nie dotykaj ich plików.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
