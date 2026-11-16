STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS / GAME (odczyt, bez zmian kodu)
TEMAT: R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1
GOAL: ustalić, czy `rust-port/renderer/src/battle/orders.rs` cytuje numery linii webu zgodne z pinem `07d2fbd72`.
ZMIANY/COMMIT: tylko katalog runu (01-rozpoznanie.md `72711a1b1`, 02a-obrona.md `971832633`, 03-final-control.md = SHA końcowy z commita FC). Ancestry: `de88d9d55` (baza) -> `72711a1b1` -> `971832633` -> commit FC; `git merge-base --is-ancestor 72711a1b1 971832633` = tak. `git diff --stat de88d9d55 72711a1b1` = 1 plik (01), `72711a1b1..971832633` = 1 plik (02a). Allowlista zachowana, brak zmian w `gra/` i `rust-port/`.
TESTY: tryb odczytu, bez cargo. Weryfikacja własna na `git show 07d2fbd72:gra/src/battle/battleScene.ts`: `_activateNext` 5979, `_onKeyManual` 17406 (wywołanie Escape 17410), `_issueBattleAttackMove` 18682, `_cancelAttackMoveSelected` 18704 (wywołania 17410 i 19095), filtr kandydatów 5993, konsumpcja kolejki 5994 i 6013. Cytowane w `orders.rs` (baza `de88d9d55`, wiersze 13-15, 122, 142, 176, 198, 252) numery 5847/5861/5853-5866/5881-5883/16850-16856/18076-18096/18098-18106 wskazują w pinie inne wiersze (np. 5847 = `_disposeAutoBatchPlanningRoster`, 18076 = `} else {`). Wynik 0/7 potwierdzony.

## Orzeczenia na zarzuty

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 0 | 0/7 cytatów niezgodnych | ODDAL (potwierdzone, brak defektu raportu) | Własny pomiar zgodny. |
| 1 | Nie ustalono źródła numerów | ODDAL | Cel dispatchu to zgodność z pinem, nie archeologia numerów. Obrona dołożyła `aac34b521` (też niezgodny). Źródło NIE_ZMIERZONO, uczciwie oznaczone. |
| 2 | Brak grep po `dyspozycje` | ODDAL | Uzupełnione w 02a: `dyspozycje` 850, `rust-port` 501 plików z `edb8fb56` (potwierdzone na `de88d9d55`). |
| 3 | Brak docelowych numerów | ODDAL | Tabela docelowa w 02a sekcja 1 (zweryfikowana wyżej). |
| 4 | Drugie wywołanie 19095 | ODDAL | Dopisane w 02a; materiał dla tematu poprawki. |
| 5 | 171 plików battleScene i siege_* niezmierzone | ODDAL | Poza zakresem dispatchu (pkt 1-3 dotyczyły orders.rs); osobny temat. |

Liczba NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

## Wniosek
Numery linii w `orders.rs` NIE są zgodne z pinem `07d2fbd72` i wymagają przepisania wg tabeli docelowej z 02a. Nagłówek deklaruje `origin/main`, nie `edb8fb56`; wynik ten sam. Zalecany osobny temat: poprawka komentarzy w `orders.rs` (bez zmiany logiki) oraz osobne rozpoznanie 171 plików `battleScene`/`siege_*`.

BLOKADY: brak. NIE_ZMIERZONO: źródło błędnych numerów; zgodność numerów w pozostałych plikach.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (dokumentacja); temat poprawki numerów w `orders.rs`.
DEPLOY/PUSH: NIE WYKONANO
