STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-5-COMMANDS-Q1
GOAL: Zaprojektować pełny docelowy zestaw komend frontend→Rust (dziś jest 6 wariantów w jednej
komendzie `engine_command`, frontend realnie używa tylko 4/6 — patrz P2-8-TAURI-ADAPTER.md).
Zmapować KAŻDĄ interakcję gracza z web UI (`gra/src/**`) na komendę: rekrutacja, budowa, dyplomacja,
handel, badania, zarządzanie automatyczne, save/load, tura, i wszystko inne co web wywołuje z UI do
logiki gry. PROPOZYCJA, nie ostateczna decyzja — każdy punkt bez jednoznacznej odpowiedzi w materiale
źródłowym ma być oznaczony jako wymagający decyzji.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Trzeci temat architektoniczny fazy P2, równoległy do P2.6 (eventy — osobny plik, zero styku).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md` (15 modułów domeny),
`dyspozycje/rust-port/p2/P2-2-GAMESTATE-CONTRACT.md` CAŁY (kontrakt GameState, §8),
`dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` CAŁY (schemat ID, §9 — każda komenda musi używać
kanonicznych ID z tego dokumentu), `dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md` (dzisiejszy stan:
jedna komenda `engine_command` 6 wariantów, moduły domenowe `recruitment.rs`/`diplomacy.rs`/
`trade.rs`/`save_load.rs`/`ai_turn.rs` ISTNIEJĄ w `rust-port/engine` ale NIE są wpięte — NIE
projektuj logiki od zera tam, gdzie moduł już istnieje, tylko zaprojektuj jak go WPIĄĆ jako komendę).

ZADANIE
1. Przeszukaj `gra/src/**` (UI + kontrolery) za KAŻDYM miejscem, gdzie akcja gracza wywołuje zmianę
   stanu gry (kliknięcie przycisku, wybór w menu, skrót klawiszowy) — to jest źródło prawdy o
   wymaganym zestawie komend, nie domysł z nazw modułów Rust.
2. Dla każdej kategorii (rekrutacja, budowa, dyplomacja, handel, badania, auto-zarządzanie,
   save/load, tura, inne) wypisz: nazwę komendy, parametry (z typami ID z P2.3), efekt na GameState
   (z P2.2), czy odpowiadający moduł Rust już istnieje (plik:linia) czy wymaga nowej logiki.
3. Zaproponuj kształt pojedynczej komendy: nadal jedna `engine_command` z wariantami (jak dziś) czy
   osobne komendy Tauri per akcja — z uzasadnieniem (błędy walidacji, serializacja parametrów,
   łatwość testowania).
4. Oznacz jawnie każdą komendę jako: GOTOWA (moduł istnieje, tylko wpięcie), CZĘŚCIOWA (moduł
   istnieje ale niekompletny), BRAK (nowa logika wymagana).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz wnioskowania zestawu komend z nazw plików Rust — źródłem prawdy jest web UI (`gra/src`), nie
domysł co "powinno" istnieć w Rust. Zakaz pomijania rzadko używanych akcji (np. pojedyncze przyciski
w panelach zarządzania) — kompletność ma pierwszeństwo nad zwięzłością.

BINARNE KRYTERIUM SUKCESU
Każda akcja gracza w `gra/src/**` ma wiersz w tabeli: nazwa akcji (dowód plik:linia web), proponowana
komenda Rust, parametry z typami, status (GOTOWA/CZĘŚCIOWA/BRAK) z dowodem po stronie Rust — w nowym
pliku `dyspozycje/rust-port/p2/P2-5-COMMANDS.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-5-COMMANDS.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-5-COMMANDS-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero zmian w
`gra/**`, zero nowego kodu Rust.

IZOLACJA
Czysta praca projektowa/odczytowa + nowy plik .md. Niezależny od P2.6 (osobny plik, zero styku).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w P2.2/P2.3. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być znacznie dłuższy — pełna tabela komend).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
