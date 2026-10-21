STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1
GOAL: Decyzje właściciela (LEDGER, 2026-10-21): D-REND-1 = renderer i modele zostają w Three.js/TypeScript w webview Tauri; D-REND-2 = renderer czyta WYŁĄCZNIE model widoku (DTO)
z Rust, bez importów logiki gry; D-REND-3 = picking w webview jak w webie (`input/picker.ts`, wynik = hex wysyłany do Rust jako komenda); D-REND-8 = do P4 wchodzi też Three.js
poza `render/**` (bitwa ręczna, podgląd cudów, miniatury jednostek, sonda). Zaprojektuj KONTRAKT DTO między silnikiem Rust a rendererem: dokładnie jakie pola stanu
renderer musi dostać, w jakich typach (JSON-safe, zgodne z `#[serde(transparent)]` ID z P3.4b/c), jakie komendy/zdarzenia wysyła z powrotem. TEMAT PROJEKTOWY: zero kodu Rust/TS, zero buildu.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model).
  Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Baza do pracy i zapisu: gałąź dokumentacyjna `claude/sprawdzenie-funkcjonalnosci-ek4ra0`: `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git checkout --detach origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`.
Kod Rust do odczytu: `git show origin/rust-port/parity-v2:rust-port/engine/src/...` (HEAD ma domain/*, bridge.rs, newtypy ID). Web: WYŁĄCZNIE `git show edb8fb56:<ścieżka>` / `git grep ... edb8fb56` (zakaz buildu/uruchamiania, zakaz zmian w `gra/**`, `rust-port/**`).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p4/P4-0-RENDERER-ARCHITECTURE.md` (§3: granica danych, 17 plików importujących logikę, tabela pól), `p2/P2-2-GAMESTATE-CONTRACT.md`, `p2/P2-5-COMMANDS.md`,
`p2/P2-6-EVENTS.md`, `p2/P2-8-TAURI-ADAPTER.md`, `p1/P1-9-MAP-HUD-PANELS.md`, oraz `rust-port/engine/src/bridge.rs` i `domain/playable.rs` (istniejące DTO).

ZADANIE (dokument `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md`)
1. Dla KAŻDEGO z 17 plików `render/**` importujących `game/`, `map/`, `units/` (lista w P4-0 §3.3) oraz 8 plików Three.js poza `render/` wypisz: co dokładnie importuje (symbole), po co (dane/typy/funkcje czyste/reguły),
   i jak to zastąpić DTO (pole DTO | funkcja czysta przeniesiona do renderera | wywołanie Rust). Tabela z dowodami (plik:linia).
2. Zaproponuj schemat DTO (nazwy pól camelCase JSON, typy, które pola są ID newtype'ami z `ids.rs`) pokrywający: mapa/kafelki/teren/ulepszenia/rzeki/granice, widoczność/mgła, miasta (w tym okolica/nakładki),
   jednostki (w tym odznaki weteranów, ulepszeń, zdrowie), obozy oblężnicze, zasięgi/nakładki, HUD-owe znaczniki. Porównaj z istniejącymi DTO w `bridge.rs`/`playable.rs` — co już jest, czego brakuje.
3. Kontrakt wsteczny: komendy z webview do Rust (kliknięcie hex, prawy klik, selekcja) z wierszami P2-5; zdarzenia Rust -> webview (P2-6). Prawy klik oznaczony w P4-0 jako NIE_ZMIERZONO — zbadaj `main.ts:26209` i zamknij.
4. Zasady: zero symulacji w JS (PLAN §1 pkt 4, P5.13); DTO niezależne od Three.js; deterministyczne (kolejność kolekcji); rozmiar/wydajność (ile pól na kafelek, czy delta zamiast pełnego stanu — opcje z kosztami, bez rozstrzygania po cichu).
5. Lista punktów wymagających decyzji właściciela `D-DTO-n` (nie rozstrzygaj po cichu) i podział implementacji na tematy-kandydaci (nazwy, allowlisty, zależności) dla P4.2+.

ANTY-HALUCYNACYJNA REGUŁA
Każde twierdzenie o webie i o Rust ma dowód (komenda+wynik albo plik:linia). Niepewne = `NIE_ZMIERZONO`. Zakaz wniosków z samych nazw plików bez otwarcia zawartości. Zakaz zmyślania pól, których renderer nie czyta.

BINARNE KRYTERIUM SUKCESU
Dokument pokrywa wszystkie 17+8 plików w tabeli z dowodami, zawiera schemat DTO, kontrakt komend/zdarzeń, listę `D-DTO-n` i kandydatów-tematów; zero zmian poza allowlistą; `git diff --check` czysty.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1/**`. Zero zmian w `gra/**`, `rust-port/**`, innych dokumentach.
(Równolegle: P3.15, P3.16 na kodzie Rust; P4.2 audyt szkieletu frontendu — dokument; nie dotykaj ich plików.)

IZOLACJA: `isolation: worktree`. Commit w worktree (jawne `git add`), PUSH NIE.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów (dokument może być dłuższy).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
