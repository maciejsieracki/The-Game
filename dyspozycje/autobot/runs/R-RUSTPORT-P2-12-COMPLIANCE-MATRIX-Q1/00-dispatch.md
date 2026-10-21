STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-12-COMPLIANCE-MATRIX-Q1
GOAL: Zbudować macierz zgodności: dla KAŻDEGO scenariusza/systemu skatalogowanego w fazie P1
(P1.1-P1.18 i warianty, patrz `P1-GATE-SYNTHESIS-2.md` — 41 wierszy) wskazać, czy kontrakty P2
(P2.1-P2.11, wszystkie już zamknięte PASS) GO POKRYWAJĄ — tzn. czy `GameState` (P2.2), schemat ID
(P2.3), katalog komend (P2.5), katalog eventów (P2.6), reguła migracji zapisów (P2.11) dają
wystarczające miejsce/mechanizm dla tego systemu, czy jest luka. To NIE jest audyt poprawności danych
(to już zrobione w P1) — to audyt KOMPLETNOŚCI KONTRAKTU: czy architektura P2 ma miejsce na każdy
system z P1, czy coś zostało pominięte przy projektowaniu P2.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Przedostatni temat fazy P2 (przed P2.13 — niezależna kontrola całości przed P3). Przeczytaj
OBOWIĄZKOWO: `dyspozycje/rust-port/p1/P1-GATE-SYNTHESIS-2.md` CAŁY (41-wierszowa tabela P1.1-P1.18,
to jest Twoja lista wejściowa do pokrycia), `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md`,
`P2-2-GAMESTATE-CONTRACT.md` (§8), `P2-3-ENTITY-IDS.md` (§9), `P2-4-RNG-DETERMINISM.md`,
`P2-5-COMMANDS.md` (§9), `P2-6-EVENTS.md` (§9), `P2-7-SAVE-SERIALIZATION.md`, `P2-8-TAURI-ADAPTER.md`,
`P2-9-ASSET-DATA-MAPPING.md`, `P2-11-SAVE-MIGRATION.md` (§10) — WSZYSTKIE zamknięte PASS, czytaj je
jako ZAMKNIĘTY kontrakt, nie projektuj niczego od nowa.

ZADANIE
1. Dla każdego z 41 wierszy `P1-GATE-SYNTHESIS-2.md` wskaż: nazwę systemu/scenariusza, czy ma
   odpowiednie miejsce w `GameState` (P2.2, z konkretnym odwołaniem), czy ma komendę w P2.5 (jeśli
   dotyczy akcji gracza), czy ma event w P2.6 (jeśli dotyczy powiadomienia), czy jest pokryty w
   migracji zapisów P2.11 (jeśli dotyczy stanu trwałego). Status: POKRYTY / CZĘŚCIOWO / LUKA.
2. Dla każdego `LUKA` — wskaż KONKRETNIE czego brakuje (nowe pole w GameState? nowa komenda? nowy
   event?) i czy to wymaga dodatkowej decyzji (`D-COMP-n`) czy jest prostym uzupełnieniem zgodnym z
   już przyjętymi wzorcami P2.2/P2.3/P2.5/P2.6.
3. Zwróć szczególną uwagę na systemy już oznaczone jako NIEZGODNE/BRAK w P1 (np. hot-seat, manpower,
   kultura/religia, forced-war — sprawdź czy P2 w ogóle PRZEWIDUJE dla nich miejsce, nawet jeśli
   logika nie jest jeszcze napisana) — różnica między „logika nie istnieje" (OK na tym etapie, to
   P3+) a „kontrakt nie ma miejsca na to pole" (prawdziwa luka P2, wymaga uzupełnienia TERAZ).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz uznania czegoś za POKRYTY bez konkretnego odwołania (plik P2-n, sekcja/linia) wskazującego
miejsce w kontrakcie. Zakaz mylenia braku logiki (zakres P3+, nie problem) z brakiem miejsca w
kontrakcie danych (problem P2, do uzupełnienia).

BINARNE KRYTERIUM SUKCESU
Każdy z 41 wierszy P1-GATE-SYNTHESIS-2 ma wiersz w nowej macierzy: nazwa, status
(POKRYTY/CZĘŚCIOWO/LUKA), odwołanie do konkretnego miejsca w P2.2-P2.11 lub opis luki — w nowym
pliku `dyspozycje/rust-port/p2/P2-12-COMPLIANCE-MATRIX.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-12-COMPLIANCE-MATRIX.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-12-COMPLIANCE-MATRIX-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero zmian
w `gra/**`, zero nowego kodu Rust, zero zmian w plikach P2-1 do P2-11 (to jest AUDYT ich kompletności,
nie poprawka).

IZOLACJA
Czysta praca projektowa/odczytowa + nowy plik .md. Niezależny od P2.10 (w toku, osobny plik).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach P2. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być znacznie dłuższy — pełna macierz 41 wierszy).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
