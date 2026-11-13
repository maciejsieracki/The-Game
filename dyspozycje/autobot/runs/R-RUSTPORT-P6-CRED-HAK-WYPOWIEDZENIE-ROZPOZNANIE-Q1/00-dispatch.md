# DISPATCH R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1 (runda 1) — rozpoznanie (BEZ zmian kodu)

TEMAT: CRED-HAK-WYPOWIEDZENIE (#120): hak P4 dla wypowiedzenia gracza, sojuszu i klastra — rozpoznanie
DOMENA: GAME (rozpoznanie). BAZA: `fc2ed160f` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/main.ts`.

## GOAL
Ustalić, jak pin wywołuje chargeWarDeclarationCredibility przy wypowiedzeniu gracza (main.ts ok. 13168/13205), obowiązku sojuszniczym (ok. 23806) i klastrze (ok. 40441), oraz czy Rust ma odpowiedniki komend/ścieżek gracza. Wskazać, czego brakuje.

## ZAKRES
- Tylko czytanie kodu i raport. Zero zmian w `rust-port/**`, `gra/**`, testach.
- Każde twierdzenie: plik:linia (Rust i pin). Niepewne = NIE_ZMIERZONO.
- Zaproponuj minimalny plan implementacji (pliki, testy, ryzyka) i rozmiar (ile rund).

## ALLOWLISTA
- `dyspozycje/rust-port/p6/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1-ROZPOZNANIE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-ROZPOZNANIE-Q1/**`
ZAKAZ: `src/**`, `tests/**`, `gra/**`, `Cargo.toml`, push do parity.

## KRYTERIA KOŃCA
1. Tabela: każde miejsce wywołania w pinie → odpowiednik w Rust (istnieje / brak / gdzie), z dowodem.
2. Lista brakujących elementów (komendy, stan, hooki) z plik:linia.
3. Propozycja podziału na tematy wykonawcze z zależnościami.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT (tylko dokument)/TESTY (NIE DOTYCZY)/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.
