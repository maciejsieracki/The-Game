STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-6-EVENTS-Q1
GOAL: Zaprojektować pełny docelowy zestaw eventów Rust→frontend (dziś jest jeden event — patrz
P2-8-TAURI-ADAPTER.md). Zmapować KAŻDE miejsce, gdzie web UI nasłuchuje/reaguje na zmianę stanu gry
pochodzącą z logiki (nie z bezpośredniej akcji gracza) — powiadomienia, aktualizacje paneli, komunikaty
systemowe, event log gry. PROPOZYCJA, nie ostateczna decyzja — każdy punkt bez jednoznacznej
odpowiedzi w materiale źródłowym ma być oznaczony jako wymagający decyzji.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Czwarty temat architektoniczny fazy P2, równoległy do P2.5 (komendy — osobny plik, zero styku).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md` (15 modułów domeny),
`dyspozycje/rust-port/p2/P2-2-GAMESTATE-CONTRACT.md` CAŁY (kontrakt GameState, §8 — eventy opisują
ZMIANY tego stanu), `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` CAŁY (schemat ID, §9 — każdy event
musi referować encje kanonicznymi ID), `dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md` (event
log gry jest częścią zapisu — `meta` klucze), `dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md`
(dzisiejszy stan: jeden event Tauri; `ai_turn.rs` 1402 linie generuje decyzje AI które frontend
musi móc zobaczyć — NIE projektuj od zera, sprawdź co już emituje komunikaty).

ZADANIE
1. Przeszukaj `gra/src/**` za KAŻDYM miejscem, gdzie UI reaguje na event/powiadomienie pochodzące z
   logiki gry (nie z bezpośredniej akcji gracza): komunikaty systemowe, event log/kronika, zmiana
   stanu miasta/jednostki niewywołana przez gracza (bunt, atak AI, zakończenie budowy, wynik walki),
   aktualizacja panelu po turze AI.
2. Dla każdej kategorii wypisz: nazwę eventu, payload (z typami ID z P2.3, polami z P2.2), który
   moduł Rust go dziś generuje (plik:linia) czy wymaga nowej logiki, czy jest częścią trwałego event
   logu zapisu (P2.7 `meta`) czy efemeryczny (tylko UI, nie zapisywany).
3. Zaproponuj mechanizm transportu: jeden kanał event z tagiem wariantu (jak dziś) czy osobne
   kanały Tauri per kategoria — z uzasadnieniem (kolejność dostarczenia, batching eventów z jednej
   tury AI, obciążenie frontend).
4. Oznacz jawnie każdy event jako: GOTOWY (logika generuje coś równoważnego, tylko wpięcie),
   CZĘŚCIOWY, BRAK (nowa logika wymagana).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz wnioskowania zestawu eventów z nazw plików Rust — źródłem prawdy jest web UI (`gra/src`), nie
domysł co "powinno" istnieć. Zakaz pomijania rzadkich eventów (np. jednorazowe komunikaty epoki,
ostrzeżenia buntu) — kompletność ma pierwszeństwo nad zwięzłością. Zakaz mylenia eventu (logika→UI)
z komendą (UI→logika, to jest zakres P2.5, osobny temat równoległy) — jeśli trafisz na coś
dwukierunkowego, zaznacz to jawnie, nie klasyfikuj na siłę w jedną stronę.

BINARNE KRYTERIUM SUKCESU
Każdy event w `gra/src/**` ma wiersz w tabeli: nazwa (dowód plik:linia web), proponowany event Rust,
payload z typami, trwały/efemeryczny, status (GOTOWY/CZĘŚCIOWY/BRAK) z dowodem po stronie Rust — w
nowym pliku `dyspozycje/rust-port/p2/P2-6-EVENTS.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-6-EVENTS.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-6-EVENTS-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero zmian w
`gra/**`, zero nowego kodu Rust.

IZOLACJA
Czysta praca projektowa/odczytowa + nowy plik .md. Niezależny od P2.5 (osobny plik, zero styku).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w P2.2/P2.3. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być znacznie dłuższy — pełna tabela eventów).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
