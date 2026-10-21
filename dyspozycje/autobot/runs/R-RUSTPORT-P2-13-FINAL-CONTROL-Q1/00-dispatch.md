STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-13-FINAL-CONTROL-Q1
GOAL: Niezależna kontrola CAŁEJ fazy P2 (synteza, analogiczna do `P1-GATE-SYNTHESIS-2.md` dla P1)
przed formalnym otwarciem fazy P3. Zbudować jedną tabelę/syntezę potwierdzającą, że wszystkie 12
podtematy P2.1-P2.12 są rzeczywiście zamknięte PASS, spójne ze sobą (brak sprzecznych rozstrzygnięć
między dokumentami), i że żadna GENUINE decyzja produktowa nie została pominięta/zgubiona po drodze.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Ostatni temat fazy P2 — zamyka bramkę przed P3. Przeczytaj OBOWIĄZKOWO w CAŁOŚCI: `dyspozycje/rust-port/LEDGER.md`
(wszystkie wpisy P2.1-P2.12), oraz KAŻDY z 12 plików: `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md`,
`P2-2-GAMESTATE-CONTRACT.md` (§8), `P2-3-ENTITY-IDS.md` (§9), `P2-4-RNG-DETERMINISM.md`,
`P2-5-COMMANDS.md` (§9), `P2-6-EVENTS.md` (§9), `P2-7-SAVE-SERIALIZATION.md`,
`P2-8-TAURI-ADAPTER.md`, `P2-9-ASSET-DATA-MAPPING.md`, `P2-10-FIXTURES.md` (§16),
`P2-11-SAVE-MIGRATION.md` (§10), `P2-12-COMPLIANCE-MATRIX.md` (§15) — wszystkie rozstrzygnięcia
orkiestratora (oznaczone jako dopisane sekcje na końcu każdego pliku) są WIĄŻĄCE, nie podlegają
ponownemu kwestionowaniu w tym temacie (to nie jest audyt poprawności tamtych decyzji — to audyt
SPÓJNOŚCI I KOMPLETNOŚCI całości).

ZADANIE
1. Zbuduj tabelę: dla każdego z 12 podtematów P2.1-P2.12 — status końcowy (z LEDGER), plik źródłowy,
   jedno zdanie streszczające co dostarcza.
2. Sprawdź SPÓJNOŚĆ MIĘDZY dokumentami: czy jakiekolwiek rozstrzygnięcie w jednym pliku P2-n jest
   SPRZECZNE z rozstrzygnięciem w innym (np. P2.3 mówi X o polu, P2.11 zakłada Y o tym samym polu).
   To NIE jest szukanie nowych luk w pokryciu (to już zrobił P2.12) — to szukanie KONTRADYKCJI między
   już zamkniętymi dokumentami.
3. Wylistuj WSZYSTKIE zobowiązania/długi techniczne jawnie zostawione na przyszłość przez
   dotychczasowe tematy P2 (np. P2.6 §16: pełny przegląd 288 plików heurystyki przed P2.13 — TO JEST
   WŁAŚNIE TEN TEMAT, więc rozlicz się z tego zobowiązania: albo wykonaj przegląd, albo jawnie
   przenieś go do P3 z uzasadnieniem dlaczego nie blokuje P3). Sprawdź inne podobne zobowiązania w
   P2.4 (generator świata), P2.9 (rozjazd kosztów jednostek), P2.10 (D-FIX-n nierozstrzygnięte).
4. Potwierdź: czy którekolwiek z rozstrzygnięć orkiestratora w którymkolwiek z 12 plików powinno było
   być GENUINE decyzją właściciela, a nie zostało tak potraktowane (druga para oczu na te
   rozstrzygnięcia, inna niż ta, która je podjęła) — jeśli coś budzi wątpliwość, zgłoś jako
   DECISION_REQUIRED z konkretnym uzasadnieniem, nie milcz.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz re-litygowania już zamkniętych decyzji technicznych bez nowego dowodu — to zwiększa koszt bez
wartości. Zakaz deklarowania "spójności" bez wskazania KONKRETNYCH par dokumentów faktycznie
porównanych. Zobowiązanie P2.6→P2.13 (przegląd 288 plików) MUSI być jawnie rozliczone, nie pominięte.

BINARNE KRYTERIUM SUKCESU
Tabela 12 wierszy (P2.1-P2.12) ze statusem i streszczeniem; sekcja kontradykcji (lista par
dokumentów faktycznie porównanych, wynik); sekcja zobowiązań technicznych z jawnym rozliczeniem
każdego; werdykt końcowy: czy bramka P2 jest formalnie otwarta dla P3 — w nowym pliku
`dyspozycje/rust-port/p2/P2-13-GATE-SYNTHESIS.md`.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-13-GATE-SYNTHESIS.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P2-13-FINAL-CONTROL-Q1/**`. Odczyt: `dyspozycje/**` read-only,
`gra/**` read-only na pinie edb8fb56, `rust-port/engine`/`parity-v2` read-only. Zero zmian w
`gra/**`, zero nowego kodu Rust, zero zmian w P2.1-P2.12 (ten temat tylko czyta i syntetyzuje).

IZOLACJA
Czysta praca projektowa/odczytowa + nowy plik .md. Ostatni temat fazy P2, brak równoległych.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach P2. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być dłuższy).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
