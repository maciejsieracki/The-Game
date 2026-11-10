STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P2-1-DOMAIN-MODULES-Q1
GOAL: Pierwszy temat fazy P2. Skatalogować moduły domeny Rust potrzebne do portu — listę z planu
(world/teren/rzeki/granice, cywilizacje, miasta, jednostki, ekonomia, tury, AI, walka, dyplomacja,
kultura/religia, handel, cuda/tech, państwa-miasta, barbarzyńcy, persystencja) — każdy moduł z: (a)
odpowiadającymi plikami web (`gra/src/game/*.ts`) na pinie edb8fb56, (b) odpowiadającym kodem w
`rust-port/engine` (jeśli istnieje — biblioteka referencyjna, nie baza kontynuacji, patrz GOAL §0
poz. 1), (c) klasyfikacją REUSE/ADAPT/REPLACE/UNKNOWN z P1.17c jako punkt startowy.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
To jest PIERWSZY temat fazy P2 (katalogowanie, nie decyzje architektoniczne — te przyjdą w
kolejnych falach P2.2+ po tym katalogu). Przeczytaj OBOWIĄZKOWO:
`dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` §4 (cała sekcja P2, i §5 „Najwyższe ryzyko"),
`dyspozycje/rust-port/p1/P1-17C-MERGED-CLASSIFICATION.md` (klasyfikacja REUSE/ADAPT/REPLACE/UNKNOWN
300 plików — REUSE=0, ADAPT=14, REPLACE=10, UNKNOWN=276 — to jest punkt wyjścia, nie licz od zera).
Bramka P1 jest formalnie otwarta (`P1-GATE-SYNTHESIS-2.md`, `04-orchestrator-disposition.md`).

ZADANIE
Dla KAŻDEGO z 15 modułów domeny z listy planu P2.1: wypisz (a) które pliki web (`gra/src/game/*.ts`
i pokrewne) realizują tę logikę na pinie edb8fb56 — z liczbą linii, (b) czy istnieje odpowiednik w
`rust-port/engine` (jeśli tak — ścieżka, rozmiar), (c) klasyfikacja startowa (czerp z P1-17C, nie
zgaduj od nowa, ale WERYFIKUJ że przypisanie faktycznie pasuje do tego modułu domeny — P1-17C
klasyfikowało PLIKI, nie MODUŁY, więc mapowanie plik→moduł jest Twoją pracą).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zakładania istnienia modułu w `rust-port/engine` bez wprost sprawdzenia (`git ls-tree`/`grep`
na tej gałęzi/bibliotece). Zakaz mylenia „biblioteka referencyjna" (wolno czerpać wzorce) z „baza
kontynuacji" (NIE kontynuować z niej wprost — GOAL §0 poz. 1).

BINARNE KRYTERIUM SUKCESU
Każdy z 15 modułów ma wiersz z (a), (b), (c) i dowodem (plik:linia / ścieżka / liczba plików).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md` (NOWY plik i katalog — pierwszy
artefakt fazy P2), `dyspozycje/autobot/runs/R-RUSTPORT-P2-1-DOMAIN-MODULES-Q1/**`. Odczyt:
`dyspozycje/**` read-only, `gra/**` read-only na pinie edb8fb56, `rust-port/engine` (gałąź/katalog
referencyjny, jeśli dostępny w tym checkout) read-only. Zero zmian w `gra/**` i zero nowego kodu
Rust w tym temacie — to jest czysty katalog.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w tematach P1. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może być dłuższy).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
