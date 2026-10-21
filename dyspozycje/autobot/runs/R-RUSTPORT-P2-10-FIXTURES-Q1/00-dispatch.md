STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-10-FIXTURES-Q1
GOAL: Zaprojektować zestaw fixtures testowych i mechanizm replay dla weryfikacji parytetu web↔Rust —
jak zdobyć i przechowywać deterministyczne scenariusze (seed + sekwencja komend gracza/AI), które
pozwolą automatycznie porównać end-state web i Rust po N turach tej samej rozgrywki. PROPOZYCJA, nie
ostateczna decyzja — każdy punkt bez jednoznacznej odpowiedzi w materiale źródłowym ma być oznaczony
jako wymagający decyzji.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Szósty temat architektoniczny fazy P2, niezależny od P2.11 (w toku, osobny plik, zero styku).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-4-RNG-DETERMINISM.md` (co już wiadomo o
zgodności RNG web↔Rust — prymitywy zgodne, generator świata NIEZGODNY, nie jest to regresja tylko
zakres przyszłej pracy), `dyspozycje/rust-port/p2/P2-5-COMMANDS.md` (katalog komend — fixture to
sekwencja komend z tego katalogu), `dyspozycje/rust-port/p2/P2-6-EVENTS.md` (katalog eventów —
oczekiwane eventy po każdej komendzie), `dyspozycje/rust-port/p2/P2-7-SAVE-SERIALIZATION.md` (format
zapisu — fixture to w istocie zapis + log komend). NIE projektuj kontraktu stanu ani komend od zera —
to jest już ZROBIONE, Twoim zadaniem jest WARSTWA TESTOWA na tym kontrakcie.

ZADANIE
1. Zaproponuj format fixture: (seed startowy, parametry nowej gry `newGameParams`) + (lista komend
   gracza/AI w kolejności z znacznikiem tury) → (oczekiwany `GameState` po N turach, zserializowany).
   Określ: czy fixture przechowuje PEŁNY end-state (cały `GameState`) czy tylko wybrane niezmienniki
   (HP jednostek, liczba miast, skarbiec) — kompromis między czułością testu a kruchością przy
   zamierzonych zmianach.
2. Zaprojektuj mechanizm NAGRYWANIA fixture z web: czy istnieje już w `gra/src` log komend gracza
   wystarczający do odtworzenia (sprawdź `replay`/`recording`/`telemetry` w `gra/src` na pinie
   `edb8fb56`) czy trzeba dopisać instrumentację do web, żeby nagrać referencyjne przebiegi.
3. Zaprojektuj harness uruchamiający ten sam fixture (seed + komendy) przez silnik Rust i porównujący
   wynik z oczekiwanym end-state — z uwzględnieniem P2.4's finding: generator świata jest dziś
   NIEZGODNY (Rust nie generuje gór/rzek/lasów), więc fixture'y dla wczesnej fazy portu muszą albo
   pomijać porównanie mapy, albo używać uproszczonej/pustej mapy jako wspólnego punktu startowego.
4. Zaproponuj zestaw scenariuszy pokrywających kluczowe systemy z P1 (odwołaj się do macierzy hot-seat
   `P1-18-HOTSEAT-MATRIX.md` i scenariuszy z `P1-GATE-SYNTHESIS-2.md`) — minimalny zestaw startowy,
   nie setki wariantów.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zakładania, że mechanizm nagrywania/replay już istnieje w web bez sprawdzenia FAKTYCZNEGO kodu
(`git grep` na pinie `edb8fb56`). Zakaz projektowania fixture'ów ignorujących już ustaloną niezgodność
generatora świata z P2.4 — każdy scenariusz musi jawnie wskazać, czy zależy od generowania mapy.

BINARNE KRYTERIUM SUKCESU
Format fixture z przykładem (jeden konkretny scenariusz w pełni rozpisany: seed, parametry, sekwencja
komend, oczekiwany end-state), opis mechanizmu nagrywania z dowodem co istnieje/nie istnieje w web,
opis harnessu porównującego, lista proponowanych scenariuszy startowych — w nowym pliku
`dyspozycje/rust-port/p2/P2-10-FIXTURES.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-10-FIXTURES.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-10-FIXTURES-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero zmian w
`gra/**`, zero nowego kodu Rust.

IZOLACJA
Czysta praca projektowa/odczytowa + nowy plik .md. Niezależny od P2.11 (osobny plik, zero styku).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w P2.2/P2.3/P2.5/P2.6. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być znacznie dłuższy).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
