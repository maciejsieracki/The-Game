# 02a-obrona — R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1 (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1
GOAL: zapisać D-DTO-4 i D-DTO-10 zgodnie z webem (pin 07d2fbd72), z dowodem i wpływem na DTO.
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/D-DTO-4-D-DTO-10-DECYZJE.md` (poprawki uzasadnień), ten plik. Baza: 083bc8b24 (Evaluator) ← 903ab3a37 (Operator) ← f7baa3848.
TESTY: dokument bez kodu, cargo nie dotyczy. `git diff --check` czysty; diff f7baa3848..HEAD = wyłącznie allowlista.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora (02-evaluator.md)

### Zarzut 1 — camp_hexes: NIE_ZMIERZONO, choć pin to rozstrzyga — PRZYJMUJĘ
Dowód: `git show 07d2fbd72:gra/src/render/siegeCampSync.ts` linie 14-27, reguła `campHexes[i % campHexes.length]` (`:22`);
`main.ts:17501-17512` buduje `camps` per jednostka (`camps.push`, `:17506`) i przekazuje bez deduplikacji do
`machinesByCampHex(camps, ready)` (`:17512`). Przy 2 maszynach `[A,A,B]` → A:2, B:0; `[A,B]` → A:1, B:1.
Poprawka: w §1 (wiersz `SiegeViewDto.camp_hexes`) NIE_ZMIERZONO zastąpione wymaganiem z dowodem
(producent zachowuje duplikaty i kolejność; P4-1F przenosi `machinesByCampHex` 1:1); dopisek w podsumowaniu §3.

### Zarzut 2 — D-DTO-10 = A to potwierdzenie, nie zmiana — PRZYJMUJĘ
Dowód: `rust-port/view-model/src/map.rs:159-161` (f7baa3848): „Encoding fixed by the contract (D-DTO-10 = A, §3.3)”.
Poprawka: §2.3 „Stan wdrożenia” wskazuje, że kodowanie wdrożono w P4-1A i że wpis orkiestratora
w `REJESTR-RUST.md` ma charakter potwierdzenia. Rejestru nie ruszam (poza allowlistą).

### Zarzut 3 — landReveal tylko przy useFogRender — PRZYJMUJĘ
Dowód: `main.ts:13484` (`useFogRender = fogOn || revealAllLand`), `:13490-13494` (opcje tylko w tej gałęzi),
`:13505-13506` (`setFog(ALL_KEYS, ALL_KEYS)` bez opcji w gałęzi else).
Poprawka: w §2.4 dodany akapit dla P4-1C: przy mgle wyłączonej adapter podaje same `2` i pomija obie opcje.

### Punkt „Sprawdzone” — nie jest zarzutem, bez odpowiedzi merytorycznej.

Rozstrzygnięcia D-DTO-4 = A i D-DTO-10 = A bez zmian.
