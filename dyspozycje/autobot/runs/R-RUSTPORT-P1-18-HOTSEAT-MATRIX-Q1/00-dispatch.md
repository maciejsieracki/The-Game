STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-18-HOTSEAT-MATRIX-Q1
GOAL: P1.18 z PLAN-PORT-RUST-TAURI-20261020.md §4 — macierz "zachowanie web → moduł Rust docelowy →
scenariusz akceptacyjny" dla hot-seat (dwóch graczy ludzkich na jednym urządzeniu), na obecnym pinie
main=edb8fb56 i obecnym HEAD `rust-port/parity-v2`. Archiwum OpenClaw tego NIE pokrywa rzetelnie
(materiał dotyczy starej gałęzi 78d494c7 sprzed poprawki terenu — patrz
`dyspozycje/rust-port/AUDYT-ARCHIWUM-OPENCLAW-20261020.md` i `notatki-evidence-p1.md`) — zrób to od
nowa, nie kopiuj z archiwum.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym checkoucie `main` (edb8fb56) znajdź i opisz WSZYSTKIE miejsca realizujące hot-seat: wybór
dwóch graczy ludzkich, przełączanie aktywnego gracza/fotela między turami, dostęp do danych per-fotel
(nie per-globalny gracz), ekrany/UI specyficzne dla trybu hot-seat. Dla każdego zachowania zapisz w
`dyspozycje/rust-port/p1/P1-18-HOTSEAT-MATRIX.md`: opis zachowania web (ścieżka+linia), czy odpowiedni
moduł Rust istnieje na `rust-port/parity-v2` (świeży checkout, HEAD po poprawce terenu) i w jakim
stanie, scenariusz akceptacyjny (jak sprawdzić, że port to robi poprawnie — konkretny, testowalny krok).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz cytowania archiwalnych ustaleń o hot-seat (np. z `worktree-overlays/TG-A-P118-...`) jako dowodu
obecnego stanu — tylko jako kontekst historyczny, jawnie oznaczony. Każde zachowanie Rust musi być
zweryfikowane na żywo na `rust-port/parity-v2`, nie na starej gałęzi `real24-staging` sprzed forka.

BINARNE KRYTERIUM SUKCESU
Plik istnieje, pokrywa wybór graczy, przełączanie tur/fotela, dane per-fotel, UI — każdy wiersz ma
ścieżkę+linię web, stan Rust (ISTNIEJE/BRAK/CZĘŚCIOWO z dowodem) i konkretny scenariusz akceptacyjny.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-18-HOTSEAT-MATRIX.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-18-HOTSEAT-MATRIX-Q1/**`. Odczyt: `gra/src/**` (main edb8fb56)
i `rust-port/engine/**` (świeży checkout `rust-port/parity-v2`), oba read-only. Zero zapisu w `gra/**`
ani `rust-port/engine/**`.

IZOLACJA
Dwa świeże, osobne checkouty read-only: `main` (edb8fb56) i `rust-port/parity-v2` (najnowszy HEAD).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
