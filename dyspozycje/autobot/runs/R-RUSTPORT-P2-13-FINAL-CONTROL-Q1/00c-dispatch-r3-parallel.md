STATUS: DISPATCHED (runda 3, przeprojektowana architektura — fan-out równoległy zamiast sekwencyjnego)
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-13-FINAL-CONTROL-Q1 (runda 3 — poprzednie dwie rundy [1-5, 1-5] wyczerpały
limit, bo zadanie "przeczytaj 8 dużych plików + zbuduj 66-parową macierz" nie mieści się w jednym
sekwencyjnym kroku Operatora pod limitem raportu). Ta runda dzieli pracę na równoległych czytelników
+ jeden agent syntezy, zamiast jednego Operatora robiącego wszystko.
GOAL: Dokończyć i ZAMKNĄĆ syntezę bramki P2 w `dyspozycje/rust-port/p2/P2-13-GATE-SYNTHESIS.md`.
RUNDA: 1/5 (nowy licznik tej architektury)

KONTEKST KRYTYCZNY (orkiestrator, przeczytaj PRZED pracą)
Dołączony plik `dyspozycje/autobot/runs/R-RUSTPORT-P2-13-FINAL-CONTROL-Q1/p2-digest.md` zawiera
SKRÓCONY, zweryfikowany przez orkiestratora digest wszystkich 12 tematów P2 oraz DWIE pozycje, które
POPRZEDNIE rundy błędnie uznały za sprzeczności (K-1: D-ID-5 vs P2-11 — NIE jest sprzecznością, obie
strony się zgadzają; D-CMD-14: 330 vs 357 — to udokumentowany przyrost zakresu w obrębie JEDNEGO
pliku P2-5 między rundami r4→r5, nie błąd) — NIE renegocjuj tych dwóch punktów, potraktuj jako
rozstrzygnięte przez orkiestratora. Digest zawiera też META-REGUŁĘ: w każdym pliku P2-n, sekcja
"## N. Rozstrzygnięcia (orkiestrator, ...)" na końcu pliku jest NADRZĘDNA wobec wcześniejszej treści
tego samego pliku — wcześniejsza treść to ślad debaty, nie żywa decyzja tam, gdzie rozstrzygnięcie
jej dotyczy.

ZADANIE — DWIE FAZY

**FAZA 1 (równoległa, 8 czytelników):** każdy czyta W CAŁOŚCI jeden z 8 plików jeszcze nieprzeczytanych
w pełni w poprzednich rundach: `P2-2-GAMESTATE-CONTRACT.md`, `P2-3-ENTITY-IDS.md` (CAŁY, nie tylko
§9), `P2-5-COMMANDS.md`, `P2-6-EVENTS.md`, `P2-9-ASSET-DATA-MAPPING.md`, `P2-10-FIXTURES.md`,
`P2-11-SAVE-MIGRATION.md`, `P2-12-COMPLIANCE-MATRIX.md` (wszystkie w `dyspozycje/rust-port/p2/`).
Każdy czytelnik ma digest jako kontekst i ma sprawdzić SWÓJ plik pod kątem sprzeczności z
POZOSTAŁYMI 11 tematami (na podstawie digestu + ewentualnie realnego odczytu cytowanych miejsc w
innych plikach, jeśli coś budzi wątpliwość). Zwraca: (a) potwierdzenie przeczytania (cytat pierwszej
i ostatniej sensownej linii treści), (b) streszczenie 2-3 zdania co plik dostarcza, (c) listę
znalezionych sprzeczności z innymi tematami (jeśli są, z dowodem: plik:linia obu stron), (d) status
końcowy pliku (z sekcji rozstrzygnięć, nie z przedawnionej treści).
Tematy P2.1, P2.4, P2.7, P2.8 były już przeczytane w całości w rundzie 1 (Final Control to
potwierdził, werdykty ODDAL) — NIE czytaj ich ponownie, użyj streszczeń z digestu.

**FAZA 2 (synteza, jeden agent, PO zakończeniu Fazy 1):** na podstawie 8 raportów czytelników +
digestu (dla P2.1/4/7/8 i jako kontekst dla reszty) NAPISZ OD NOWA (pełne nadpisanie, nie łatanie
starych sekcji §0a-§0n z poprzednich rund — ten plik ma historię skonfliktowanych patchy, czas na
czysty dokument końcowy) plik `dyspozycje/rust-port/p2/P2-13-GATE-SYNTHESIS.md` zawierający:
1. Tabela 12 wierszy (P2.1-P2.12): status, plik, 1 zdanie streszczenia.
2. Macierz spójności 66 par: dla każdej pary jeden wiersz — ZGODNE / BRAK PUNKTU STYKU / SPRZECZNOŚĆ
   (z dowodem, jeśli sprzeczność). Większość par nie ma punktu styku — to legalny, szybki wynik dla
   pary, nie trzeba głębokiej analizy każdej.
3. Rozliczenie zobowiązania Z-1 (288 plików z P2.6) — wklej DOSŁOWNIE tekst z digestu (sekcja
   "Rozstrzygnięcie Z-1"), tylko podstaw poprawny numer sekcji (§9, nie §16).
4. Ocena pojedyncza (nie zbiorcza) D-ID-1,2,3,4,6,7,11 i D-CMD-14: czy to była genuine decyzja
   właściciela, czy słusznie rozstrzygnięte administracyjnie — jedno zdanie każda, z uwzględnieniem
   że K-1 i D-CMD-14 są już rozstrzygnięte przez orkiestratora jako NIE-sprzeczności (digest).
5. Werdykt końcowy: czy bramka P2 jest formalnie otwarta dla P3.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz deklarowania przeczytania pliku bez cytatu potwierdzającego. Zakaz deklarowania poprawki bez
faktycznej edycji — Final Control poprzednich 2 rund złapał dokładnie to dwukrotnie.

BINARNE KRYTERIUM SUKCESU
12/12 plików P2-n potwierdzone jako przeczytane (z cytatami); 66/66 par macierzy obecne (każda z
wynikiem, nawet "brak punktu styku"); Z-1 rozliczone tekstem z digestu; 8 punktów D-ID/D-CMD
ocenionych pojedynczo; jeden spójny, jawny werdykt końcowy bramki.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-13-GATE-SYNTHESIS.md` (pełne nadpisanie dozwolone),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-13-FINAL-CONTROL-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only, `rust-port/engine`/`parity-v2` read-only. Zero zmian w `gra/**`, zero nowego
kodu Rust, zero zmian w P2.1-P2.12.

PROCEDURA NAPRAWCZA PRZY FAIL
Standardowa. Po 5 rundach: LIMIT-5-EXCEEDED — trzecia porażka tego zakresu wymagałaby już
bezpośredniej interwencji orkiestratora, nie kolejnej rundy.

FORMAT ODPOWIEDZI (synteza)
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
