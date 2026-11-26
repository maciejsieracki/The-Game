# Wojny epoki po zmianach FAL 906 i 908 — pomiar CZĘŚCIOWY

STATUS: PARTIAL (NIE ZMIERZONO w zakresie 120 tur, seed 7 tylko do tury ~29)
TEMAT: R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q1
BAZA KODU: origin/main 069de0d41f8fee134579ec286028ede02cb9e002 (kod = FALA 908); bundle zbudowany z kopii gra/ przy commicie b8ab498146c2c74b43fcbd468d1e4392e7bbcef5 (zmiany tylko w dyspozycjach, kod gry bez zmian)
DANE: `dyspozycje/autobot/runs/R-WEB-MEASURE-ERA-WAR-START-AFTER-CHANGE-Q1/dane/` (jsonl.gz + SHA256SUMS)

## 1. Zakres i metoda

- Runner: `gra/tools/war-duration-measure.cjs` (bez zmian), bundle zbudowany poza repo (`vite build`, patche `ai-city-live-measure.cjs --prepare` i `ai-war-weariness-live-audit-hook.cjs` na kopii; `__wwDump` potwierdzony w `src/main.ts`).
- Ziarno 4242: rekordy tur 2–90 (89 wierszy). Pierwszy bieg nieodcinkowy dotarł do tury 100 i padł (Chromium); jego plik wyjściowy został usunięty przy przejściu na bieg segmentowy, więc nie jest częścią danych.
- Ziarno 7: rekordy tur 2–30 (29 wierszy). Bieg padł na turze ~30; brak slotu do wznowienia (slot zapisywany tylko na końcu odcinka `--stop-at`).
- Przerwy: Chromium kończy się błędem `Target page, context or browser has been closed` po kilku–kilkudziesięciu turach. Wznowienie ze slotu `wwm-4242` działało z turą 40 -> 80 (po 2 próbach), potem z tury 90 nie udało się przejść ani jednej tury w 4 próbach. Kilka prób startu kończyło się `ProcessSingleton` (profil zajęty przez proces osierocony po timeoucie) — to usterka harnessu środowiska, nie gry.
- Wznowienia reseedują PRNG (nagłówek runnera), więc odcinki nie są bit-identyczne z biegiem ciągłym.

## 2. Wojny epoki zmierzone (summarize, plik `dane/summarize-4242-7.txt`)

| Para | Typ (pole `forced`) | Start (tura) | Koniec (tura) | Czas (tury) | Powód końca | Zmęczenie przy końcu | Miasta zmienione |
|---|---|---|---|---|---|---|---|
| 0 (gracz) vs 15 | brąz (wymuszona) | 40 | 81 (ostatni rekord 80) | 40 | pokój wymuszony po 40 turach (wniosek z wear=1.0) | 1.0 | 0 |
| 1 vs 8 (AI↔AI) | żelazo (wymuszona) | 59 | 79 | 19 | NIE ZALOGOWANY — wniosek „inne/nieznane” | 0.475 (peak) | 0 |
| 15 vs 29 | żelazo (wymuszona) | 81 | trwa po turze 90 | ≥9 | — | 0.225 (t90) | 0 |

Seed 7: brak wojen w turach 2–29.

Rozkład (seed 4242, zakończone): wymuszone-epoki n=2, mediana 29,5, min 19, maks 40; naturalne n=0.

## 3. Odpowiedzi na pytania z dispatchu

- Tura wejścia w epokę każdej strony (Brąz/Żelazo): NIE ZMIERZONO — rekordy jsonl nie zawierają pola epoki cywilizacji. Opóźnienie start − wejście: NIE ZMIERZONO.
- Gracz (cywilizacja 0) w wojnie epoki: TAK, od tury 40 (brąz, para 0 vs 15), zakończona pokojem wymuszonym po 40 turach. Z domyślną opcją „Wojna epoki z udziałem gracza” — ustawienie ON w biegu (bez zmian w runnerze).
- Kilka wojen epoki naraz u jednej cywilizacji: nie zaobserwowano (civ 15: wojna z 0 do t80, potem z 29 od t81; civ 1 i 8 tylko ze sobą).
- Serie wojen przy wejściu w epokę: nie dało się ocenić (brak tur wejścia).
- Wojny po stronie sojuszników: w rekordach `rel` sojusze 1–15, 1–22, 1–29, 8–29, 15–29 istnieją; wojny epoki nie były wciągane do sojuszników w zmierzonym zakresie. NIE ZMIERZONO w pełnym zakresie.

## 4. Porównanie z regułami FAL 906 i 908

| Reguła | Oczekiwane | Zmierzone | Werdykt |
|---|---|---|---|
| FAL 906: wojna epoki startuje od pierwszej tury wejścia w epokę | start = tura wejścia, opóźnienie 0–kilka tur | start t40 (brąz gracza), t59 i t81 (żelazo); tur wejścia brak w danych | NIE ZMIERZONO (brak danych wejścia) |
| FAL 906: wojna kolejnej epoki po pokoju poprzedniej | następna wojna po pokoju | para 15 vs 29 zaczyna się t81, dzień po końcu pary 0 vs 15 (t80) — zgodne z sekwencją, ale bez potwierdzenia tury wejścia | NIE ZMIERZONO |
| FAL 908: wojna epoki AI↔AI kończy się po 2 miastach lub prośbą o pokój | koniec po utracie 2 miast lub prośbie o pokój | para 1 vs 8: koniec t79, 0 miast utraconych (lostA=lostB=0), brak wpisu w `logs` i brak zmiany w `rel` widocznej w rekordach | KANDYDAT NIEZGODNOŚCI — NIE POTWIERDZONE: powód końca nie jest logowany; może to być pokój zawarty przez AI (wtedy zgodne z 908) |

## 5. Kandydaci BŁĄD-GRY / NIE ZMIERZONO

- KANDYDAT (do weryfikacji, nie potwierdzony): koniec wojny AI↔AI 1 vs 8 w t79 bez utraty miast i bez wpisu w logu. Minimalne odtworzenie: seed 4242, rekordy t58–t80 w `dane/war-kontynenty-4242.jsonl.gz`. Potrzebny przechwyt logu powodu końca wojny w runnerze (log gry z FAL 909 nie jest zbierany przez war-duration-measure.cjs).
- NIE ZMIERZONO: tury wejścia w epokę, opóźnienie start − wejście, pełne 120 tur, seed 7 po turze 30, zmęczenie przy końcu wojn naturalnych (brak naturalnych wojen w danych).
- Usterka środowiska (nie gra): Chromium pada po kilku–kilkudziesięciu turach; wznowienie po turze 90 nieudane (4/4).

## 6. Co dalej (decyzja orkiestratora)

1. Dokończyć seed 4242 do t120 i seed 7 do t120 w czystym środowisku (bez osieroconych procesów Chromium); wymagany stabilny Chromium lub restart z innej maszyny.
2. Dodać do runnera przechwytywanie logu powodu końca wojny (FAL 909) i pola epoki cywilizacji w rekordzie tury — bez tego kryteria z FAL 906 nie są mierzalne.
