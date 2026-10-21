STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P1-16D-OPISY-CIVPEDIA-UI-Q1
GOAL: Przeglądnąć pozostałe hasła CivPedii (ze 136, poza już zamkniętymi w P1-16 — Akademia,
Karawanseraj, Targowisko, Lazaret, 13/25 „maksymalnie 10 poziomów") oraz 17 paneli „ściąga" z 27
(`AUDYT-OPISY` §3) bez wcześniejszej recenzji — status z dowodem na pinie edb8fb56.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Jeden z 5 równoległych następców P1.16b pokrywających AUDYT-OPISY. Przeczytaj
`dyspozycje/AUDYT-OPISY-CIVPEDIA-PORADNIK-SCIAGI-2026-08-13.md` §3 (27 paneli — lista „Skatalogowane,
BEZ recenzji") i §5 (CivPedia — 136 haseł w 6 grup kategorii) dla zakresu. Przeczytaj
`dyspozycje/rust-port/p1/P1-16-EDGE-CASES.md` §9.3/§9.5 żeby nie powtarzać już zamkniętych haseł.

ZADANIE
A) CivPedia: dla KAŻDEJ z 6 grup kategorii (§5 audytu) wypisz hasła, sprawdź per hasło czy opis
   (koszt, efekt, wymagania) zgadza się z `buildings.json`/`units.json`/`tech.json`/`wonders.json`
   na pinie. Pomiń hasła już zamknięte (Akademia, Karawanseraj, Targowisko, Lazaret). Status per
   hasło, nie zbiorczy dla całej grupy.
B) UI panele „ściąga": dla KAŻDEGO z 17 nieprzejrzanych paneli (§3 audytu, lista „Skatalogowane") —
   zlokalizuj w kodzie (`cityPanel.ts`/`empireDetailPanel.ts` na pinie, numery linii mogły się
   przesunąć od audytu), sprawdź jasność/aktualność treści wobec bieżącego kodu/danych.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zbiorczego statusu dla grupy/kategorii bez sprawdzenia reprezentatywnej próby haseł w niej —
jeśli nie sprawdzono WSZYSTKICH haseł grupy, napisz wprost ile sprawdzono z ilu.

BINARNE KRYTERIUM SUKCESU
Wszystkie pozostałe hasła CivPedii (lub jawnie: ile z ilu sprawdzono, z listą nieprzeliczonych) oraz
wszystkie 17 paneli mają status z dowodem — w nowym pliku
`dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md`. Jeśli 136 haseł jest zbyt dużo na 5 rund —
jasno powiedz ile faktycznie przeliczono i oznacz resztę jako NIEROZSTRZYGNIĘTY z braku przeliczenia
(nie jako fałszywe NAPRAWIONY).

ALLOWLISTA
Zapis wyłącznie: `dyspozycje/rust-port/p1/P1-16D-OPISY-CIVPEDIA-UI.md` (NOWY plik),
`dyspozycje/autobot/runs/R-RUSTPORT-P1-16D-OPISY-CIVPEDIA-UI-Q1/**`. Odczyt: `dyspozycje/**`
read-only, `gra/**` read-only na pinie edb8fb56. NIE dotykaj innych plików `P1-16*`.

IZOLACJA
Czysta praca odczytowa + nowy plik .md.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich P1.16c. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
