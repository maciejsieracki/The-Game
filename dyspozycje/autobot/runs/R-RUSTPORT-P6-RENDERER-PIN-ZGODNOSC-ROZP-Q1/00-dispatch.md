# DISPATCH R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1 (runda 1) — czy `renderer/src/battle/orders.rs` cytuje właściwy pin

DOMENA: PROCESS / GAME (odczyt). MODEL: HAIKU (Operator, Obrona), SONNET (Evaluator, FC).
TRYB: WYŁĄCZNIE ODCZYT. Bez kodu, bez cargo. Jedyny zapis: `dyspozycje/autobot/runs/R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1/` (jawny `git add`).
BAZA: `origin/rust-port/parity-v2` = `de88d9d55` (zapisz SHA). Pin obowiązujący: `07d2fbd72`.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ.

## CEL
Rozpoznanie K5-AUTO-EXEC (FC `95eb581c1`, uwaga 4) wskazało, że `rust-port/renderer/src/battle/orders.rs` cytuje numery linii webu z commita **edb8fb56**, a nie z pinu **07d2fbd72**. Jeśli numery są z innego commita, każdy port oparty na nich jest niewiarygodny.

## ZAKRES
1. `git grep -n` w `rust-port/renderer/src/battle/orders.rs` po wszystkich odwołaniach do plików webu z numerami linii (`battleScene.ts`, `main.ts`, `combat.ts`, itp.) i commitów (`edb8fb56`, `07d2fbd72`, inne SHA).
2. Dla każdego cytowanego numeru linii sprawdź w `07d2fbd72` (`git show 07d2fbd72:<plik> | sed -n 'N p'`), czy wiersz zawiera opisywaną funkcję/wartość. Zanotuj zgodne i niezgodne. Sprawdź też, czy `edb8fb56` jest w historii (`git cat-file -t edb8fb56`) i czym się różni.
3. Wskaż, które pozostałe pliki `rust-port/` cytują `edb8fb56` (`git grep -l edb8fb56 -- rust-port dyspozycje`).

## KRYTERIA KOŃCA
1. Raport `01-rozpoznanie.md`: tabela cytatów (plik:linia w rust | cytowany commit | wiersz w pinie 07d2fbd72 | zgodne T/N).
2. Lista plików do aktualizacji numerów linii (bez zmiany kodu).
3. Wniosek: czy numery w `orders.rs` są zgodne z pinem, czy wymagają poprawy.
4. Commit tylko w katalogu runu, bez push do parity.
