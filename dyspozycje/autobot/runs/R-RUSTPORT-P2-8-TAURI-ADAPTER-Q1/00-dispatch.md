STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-8-TAURI-ADAPTER-Q1
GOAL: Skatalogować dzisiejszy stan granicy Rust↔Tauri↔frontend w `rust-port/engine`
(`rust-port/parity-v2`, HEAD 9e33fc77) — co dziś robi Rust (`bridge.rs` i pokrewne), co robi JS/
frontend, jakie komendy/eventy istnieją faktycznie (plan mówi „dziś jest 6"). Katalog faktów, NIE
decyzja o docelowym podziale odpowiedzialności.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Piąty temat fazy P2, równoległy do `R-RUSTPORT-P2-9-ASSET-DATA-MAPPING-Q1` (inny plik, bez kolizji).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md`,
`dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` §4 pozycja P2.5/P2.6/P2.8 („dziś jest 6
komend, docelowo dziesiątki").

ZADANIE
1. Zidentyfikuj WSZYSTKIE dzisiejsze komendy Tauri (`#[tauri::command]` albo analogiczny mechanizm)
   w `rust-port/engine` na `parity-v2` — nazwa, plik:linia, sygnatura, co robi.
2. Zidentyfikuj WSZYSTKIE dzisiejsze eventy Rust→frontend (jeśli jakiekolwiek istnieją) — ten sam
   format.
3. Opisz `bridge.rs` — co dokładnie robi dziś (jakie typy przekazuje, w którą stronę).
4. Dla KAŻDEJ z ~dziesiątek docelowych komend wymienionych w planie (rekrutacja, budowa, dyplomacja,
   handel, badania, zarządzanie automatyczne itd. — sprawdź sekcję P2.5 planu i katalog modułów
   P2.1): czy istnieje już dzisiaj JAKIKOLWIEK odpowiednik (nawet częściowy) w Rust, czy zero.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zakładania, że „6 komend" z planu to aktualny stan bez weryfikacji — policz rzeczywiście
istniejące w kodzie na pinie `parity-v2`, może się różnić (plan mógł być napisany wcześniej).

BINARNE KRYTERIUM SUKCESU
Pełna lista dzisiejszych komend/eventów z dowodem (plik:linia), plus status istnienia odpowiednika
dla każdej z docelowych kategorii z planu — w nowym pliku
`dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-8-TAURI-ADAPTER-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero zmian w
`gra/**`, zero nowego kodu Rust.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach P2. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
