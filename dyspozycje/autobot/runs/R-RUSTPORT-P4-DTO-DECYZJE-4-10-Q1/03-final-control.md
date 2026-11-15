# 03 — Final Control: R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1 (runda 1)

STATUS: PASS
DOMAIN: GAME (renderer DTO, dokument bez kodu)
TEMAT: R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1
GOAL: zapisać decyzje D-DTO-4 i D-DTO-10 według webu (pin `07d2fbd72`), z dowodem plik:linia i wpływem na typy w `rust-port/view-model`.
ZMIANY/COMMIT: baza `f7baa3848` (= `origin/rust-port/parity-v2`), łańcuch `903ab3a37` (Operator) → `083bc8b24` (Evaluator) → `e11b77e0a` (Obrona) → commit tego raportu (Final Control). Pliki względem bazy:
- `dyspozycje/rust-port/p4/D-DTO-4-D-DTO-10-DECYZJE.md` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1/{00-dispatch,01-operator-r1,02-evaluator,02a-obrona,03-final-control}.md`
TESTY: cargo nie uruchamiano, bo temat jest dokumentem i diff nie dotyka `rust-port/**`. `git diff --check f7baa3848..e11b77e0a` daje exit 0. `git diff --name-only f7baa3848..e11b77e0a` daje wyłącznie ścieżki z allowlisty. Brak zmian w `gra/**`, `rust-port/**`, `REJESTR-RUST.md` i `Cargo.lock`.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora. Wpis w `REJESTR-RUST.md`: D-DTO-4 = A i D-DTO-10 = A. D-DTO-10 wpisać jako potwierdzenie stanu, który już jest w kodzie od P4-1A. Wymagania przekazać do P4-1B, P4-1C i P4-1F.
DEPLOY/PUSH: NIE WYKONANO

## Samodzielna weryfikacja

- Dispatch na `origin/claude/rust-sivvrn` mówi: „BAZA (jedyna obowiązująca): `f7baa3848`”. `git rev-parse origin/rust-port/parity-v2` = `f7baa3848…`, więc się zgadza. Baza `f7baa3848` jest przodkiem `e11b77e0a`, przez `903ab3a37` i `083bc8b24`.
- Allowlista: `git diff --name-only f7baa3848..e11b77e0a` daje 5 plików, wszystkie z allowlisty.
- Sprawdzone przez `git show` w pinie `07d2fbd72`:
  - `render/siegeCampSync.ts:14-27`: maszyny są rozdzielane regułą `campHexes[i % campHexes.length]` w linii `:22`.
  - `main.ts:17506`: `camps.push` jest wołane dla każdej jednostki, bez deduplikacji. W `:17512` wynik trafia do `machinesByCampHex(camps, ready)`.
  - `main.ts:13484`: `useFogRender = fogOn || revealAllLand`.
  - `main.ts:13490-13494`: `setFog` z opcjami `landReveal` i `riverRevealKeys`.
  - `main.ts:13505-13506`: `setFog(ALL_KEYS, ALL_KEYS)` bez opcji.
  - `types/hex.ts:60-64`: enum `Widocznosc`.
- W Rust przy bazie `f7baa3848`: `view-model/src/map.rs:159-161` zawiera komentarz „Encoding fixed by the contract (D-DTO-10 = A, §3.3)”.

## Orzeczenia zarzutów Evaluatora (po Obronie)

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | Przy `camp_hexes` było NIE_ZMIERZONO, choć pin rozstrzyga sprawę | **ODDAL** (naprawione przez Obronę w `e11b77e0a`) | Wiersz `SiegeViewDto.camp_hexes` i §3 podają teraz wymaganie z dowodem: `:22`, rozdział `[A,A,B]` → A:2, B:0 oraz przykład `[A,B]`. Sprawdziłem w pinie, że to się zgadza. Drobna uwaga: dokument cytuje `main.ts:17510-17512`, a `camps.push` jest w `:17506`. Wniosek jest jednak poprawny, więc to nie blokuje. |
| 2 | D-DTO-10 potwierdza stan, który już jest w kodzie | **ODDAL** (naprawione w §2.3) | Dokument wskazuje `map.rs:159-161` z P4-1A i opisuje wpis w rejestrze jako potwierdzenie. Rejestru nie ruszano, zgodnie z allowlistą. |
| 3 | `landReveal` działa tylko przy `useFogRender` | **ODDAL** (naprawione w §2.4) | Dodany akapit zgadza się z `main.ts:13484`, `:13490-13494` i `:13505-13506`. |

NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0. Werdykt: **PASS**.

## Ocena merytoryczna

- D-DTO-4 = A: web liczy maskę dróg, trasy rzek, tarasy, ulepszenia kryjące i obozy oblężnicze poza `render/`. Zgodnie z zasadą 11 te pola liczy więc silnik. Decyzja jest techniczna i nie wymaga pytania ABC.
- D-DTO-10 = A: wartości 0, 1 i 2 odpowiadają pozycjom w `Widocznosc`. Web zakłada pierwszeństwo: widoczny przed odkrytym. Decyzja jest techniczna i nie wymaga pytania ABC.
- Pytania ABC do właściciela: brak, bo web rozstrzyga obie decyzje.
