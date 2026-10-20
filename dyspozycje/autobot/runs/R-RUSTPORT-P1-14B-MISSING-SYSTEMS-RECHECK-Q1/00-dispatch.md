STATUS: DISPATCHED
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-14B-MISSING-SYSTEMS-RECHECK-Q1
GOAL: Re-weryfikacja na AKTUALNYM pinie Rust (`rust-port/parity-v2`, HEAD po poprawce terenu
`9e33fc77`) twierdzeń "zero trafień" z audytu archiwum
(`dyspozycje/rust-port/AUDYT-ARCHIWUM-OPENCLAW-20261020.md` §5) dla: forced-war, culture/religion,
cuda świata (wonders), państwa-miasta, batch recruitment, auto_manage. Audyt archiwum sprawdzał to na
starszych gałęziach (`autobot/real24-staging` itp.) — potwierdzić czy wniosek "NIE-PORTOWANE" nadal
trafny na `rust-port/parity-v2` PO poprawce terenu (temat P1-TERRAIN-DESERT-TUNDRA-FIX), nie zakładać
że nic się nie zmieniło.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

ZADANIE
W świeżym checkoucie `rust-port/parity-v2` (najnowszy HEAD origin): dla każdego z 6 systemów
(forced-war, culture, religion, wonders/cuda, państwa-miasta, batch recruitment/auto_manage) uruchomić
`git grep` po polskich i angielskich nazwach/słowach kluczowych (np. "forced_war", "wymuszona",
"culture", "religion", "religia", "wonder", "cud", "city_state", "panstwo_miasto", "batch",
"auto_manage") w `rust-port/engine/src/**`. Dla KAŻDEGO: jeśli 0 trafień — potwierdzić NIE-PORTOWANE
(zgodne z audytem). Jeśli JEST trafienie — to jest ZNALEZISKO sprzeczne z audytem archiwum, opisać
dokładnie co i gdzie (ścieżka+linia+cytat), nie pomijać. Zapisać wynik w
`dyspozycje/rust-port/p1/P1-14B-MISSING-SYSTEMS-RECHECK.md`.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz przyjęcia wniosku audytu archiwum bez realnego `git grep` w TEJ rundzie na `rust-port/parity-v2`
(nie na starych gałęziach z audytu).

BINARNE KRYTERIUM SUKCESU
Plik istnieje, dla każdego z 6 systemów podana dokładna komenda grep i jej wynik (liczba trafień,
0 albo więcej z cytatem), jawny werdykt zgodny/niezgodny z audytem archiwum.

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-14B-MISSING-SYSTEMS-RECHECK.md`,
`dyspozycje/autobot/runs/R-RUSTPORT-P1-14B-MISSING-SYSTEMS-RECHECK-Q1/**`. Odczyt:
`rust-port/engine/**` read-only (świeży checkout `rust-port/parity-v2`). Zero zapisu w
`rust-port/engine/**` ani `gra/**`.

IZOLACJA
Świeży checkout/clone `rust-port/parity-v2` (najnowszy HEAD origin), praca wyłącznie odczytowa.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w innych tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 300 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
