# Wojny epoki — pomiar Q2 (MEASQ2, #136), 2026-11-26

Temat: R-WEB-MEASURE-ERA-WAR-Q2-Q1. Baza: origin/main `01790e553` (ROBOCZA 7398bd08, FALA 925).
Dane: `dyspozycje/autobot/runs/R-WEB-MEASURE-ERA-WAR-Q2-Q1/dane/` (jsonl.gz, warend.json.gz, status.json.gz, SHA256SUMS).

## 1. Warunki pomiaru

- Chromium headless (`/opt/pw-browsers/chromium`), realna tura (`endTurn`), bundle z kopii `gra/` poza repo (hak `ai-city-live-measure --prepare`, `ai-war-weariness-live-audit-hook`, pole `ep` = `empireEpochForOwner`).
- Nowa gra: Rzymianie (gracz), Standardowy, typ „Kontynenty”, 15 cywilizacji, 2 państwa-miasta, seed 4242 i 7.
- **Poziom maksymalny „Dyplomacja i wojna” = „Trudna” (kary ×3, bonusy ÷3)** — najwyższy z trzech poziomów w `newGameFlow.ts` (łatwa / normalna / trudna).
- „Wojna epoki z udziałem gracza” (`playerEpochWarEnabled`) = ON.
- Autopilot gracza ON (jak w runnerze dyplomacji). Bramka „Zakończ turę” obchodzona przez runner (dosypka złota/żywności, licznik `gateBypass` w status.json).
- Zapis slotu po każdej turze; po awarii Chromium wznowienie ze slotu z nowym solem PRNG (`MEASURE_RESALT`), wynik nie jest bit-identyczny z przebiegiem ciągłym.

## 2. Zasięg pomiaru

| Seed | Tury zmierzone | Rekordów | Status |
|---|---|---|---|
| 4242 | t2–t120 | 119 | KOMPLETNY do tury 120 |
| 7 | t2–t84 | 83 | PRZERWANY w turze 84 — Chromium „Target page … closed” przy odtwarzaniu świata przed `loadSlot` (4 próby z rzędu na ostatnim odcinku, każda ok. 2–3 min); ostatni zapis slotu t82 |

Przyczyna przerwania: awaria Chromium w fazie startu gry przy wznowieniu (nie błąd gry — gra nie zgłasza wyjątku, runner nie dochodzi do tury). Zmiana soli PRNG nie usunęła awarii. Seed 7 do t120 NIE ZMIERZONO.

## 3. Epoka cywilizacji (pole `ep`)

- Gracz (Rzymianie): **epoka 2 (Brąz) przez cały pomiar** w obu seedach (t2–t120 / t2–t84). Nie wszedł w Żelazo. Przyczyna NIE ZMIERZONO (hipoteza: autopilot gracza nie prowadzi badań — do sprawdzenia).
- Cywilizacje AI (13 w każdym seedzie) wchodzą w epokę 3 (Żelazo):
  - seed 4242: 13 z 13 AI, tury wejścia t69–t107; 12 z 13 przed t100;
  - seed 7: 8 z 13 AI, tury wejścia t71–t82; 5 AI nie weszło do Żelaza do t84.
- Epoka 2 zapisana dla wszystkich od t2 (start w Brązie).

## 4. Wojny

### 4.1 Seed 4242 (t2–t120): 20 par w stanie wojny w migawkach

Wojny epoki wymuszone (etykieta `forced` z hooka):

| Para | Typ | Start | Ep stron w starcie | Koniec (log) | Uwagi |
|---|---|---|---|---|---|
| 0-7 (gracz/hetyci) | brąz (gracz) | t40 | 2/2 | zniknęła z migawek w t81 — brak wpisu w logu | pokój po 40 turach |
| 0-10 (gracz/germanie) | bez etykiety | t40 | 2/2 | zniknęła w t81 — brak wpisu | pokój po 40 turach |
| 1-16 (fenicjanie/chińczycy) | żelazo | t71 | 3/3 | t91 pokój (oferta_zmeczenia, tury 20) | |
| 28-37 (zulusi/inkowie) | naturalna t77–t95, potem żelazo t96 | t77 (naturalna), t96 (wojna epoki) | t77: 2/2 (naturalna); t96: 3/3 (wejścia 94 i 86) | t95 pokój (prośba AI, 18 tur), t99 pokój (auto_pokój_dwa_miasta, 3 tury) | wojna z t77 jest naturalna (powód None w logu); wojna epoki od t96, po wejściu obu stron w Żelazo, zgodnie z 16A |
| 22-34 (babilonia/grecy) | żelazo | t79 | 3/3 | t95 pokój (oferta_zmeczenia) | |
| 13-31 (harappa/sumer) | żelazo | t80 | 2/3 | t100 pokój (oferta_zmeczenia) | start t80 po wejściu sumeru (31: t79), harappa wchodzi t81; zgodnie z 16A |
| 7-10 (hetyci/germanie) | żelazo | t89 | 3/2 | t109 pokój (oferta_zmeczenia) | start w turze wejścia hetytów (7: t89), germanie (10) wchodzą t97; zgodnie z 16A |

Pozostałe pary AI–AI (natural, bez etykiety): 4-7, 16-22, 19-31, 13-37, 1-7, 4-31, 13-34, 4-16, 1-22, 31-34, 4-13, 34-37, 16-28 (w sumie 13 par). Łącznie 20 par w migawkach (część par wraca do wojny po pokoju).

Zakończenia zalogowane (`__diploWarEndLog`, bez par z graczem): **20** przejść z wojny w pokój:
- `oferta_zmeczenia`: 14
- `prosba_o_pokoj_ai`: 4
- `auto_pokoj_dwa_miasta`: 2

Czas trwania zalogowanych wojen (pole `turyWojny`): od 3 do 20 tur; większość 10–20 tur. Zmęczenie w chwili końca `oferta_zmeczenia`: 0,275–0,50 (pole `zmeczenie`). Wpis `auto_pokoj_dwa_miasta` z 3 turami (28-37, t99) jest zgodny z logiem: wojna naturalna t77 zakończona prośbą AI o pokój w t95 (18 tur), wojna epoki od t96 (obie strony w Żelazie), pokój t99 (3 tury).

### 4.2 Seed 7 (t2–t84): 12 par

Wojny epoki: 28-34 (żelazo, t74, ep 3/3 — zgodnie), 22-37 (żelazo, t80, ep 3/2, 37 nie weszło do Żelaza do t84).
Zakończenia zalogowane: **6** (oferta_zmeczenia 5, prosba_o_pokoj_ai 1). Gracz: pary 0-1 i 0-7 od t40 do t80 (40 tur), bez wpisu w logu.

### 4.3 Wojny naraz

- Maksimum wojen naraz w świecie: **8** (4242), **6** (seed 7).
- Maksimum wojen naraz u jednej cywilizacji: **2** (4242: gracz, fenicjanie, hetyci, harappa, babilonia, sumer, grecy, inkowie, chińczycy; seed 7: gracz i grecy). Na 4242 gracz miał naraz 2 wojny (0-7, 0-10) przez tury 40–80.
- Rozkład liczby wojen naraz w świecie (4242, tury z wojną): 1:3, 2:3, 3:9, 4:16, 5:28, 6:15, 7:5, 8:2.

### 4.4 Gracz w wojnie epoki

- Gracz był w wojnie z dwoma AI w tym samym czasie (4242: 7 i 10; seed 7: 1 i 7) przez 40 tur (t40–t80), wszystkie w epoce Brązu (ep 2). Oba pary wygasły w turze 81 — **powód końca wojny gracza NIE ZMIERZONO**: hak `__diploWarEndLog` pomija pary z graczem (`skipPair = isMe(a) || isMe(b)` w `gra/src/main.ts` ok. l. 27222). Koniec po dokładnie 40 turach jest zgodny z regułą pokoju wymuszonego po 40 turach z pomiarów #115/#121, ale nie jest tu potwierdzony zapisem powodu.
- Akceptacja pokoju wymuszonego przez runner: 0 (`forcedPeaceAccepted` = 0 w status.json).

### 4.5 Sojusze i wciąganie sojuszników

- W logu końców (`warend.json`) 26 zdarzeń `sojusz` przypada na turę 1 (ustawienie startowe); od tury 2 w migawkach `rel` nie ma sojuszy AI (pary są `neutralni`) aż do tury 112; w seed 4242 pojawiają się sojusze w turach 112–120 (9 tur); w seed 7 brak.
- Wciąganie sojuszników do wojny: **NIE ZMIERZONO** w sensie przyczynowym (sojusze prawie nie występują w tym biegu, nie ma dowodu wciągnięcia).

## 5. Porównanie z regułami FALA 906 / 908

| Reguła | Werdykt | Dowód |
|---|---|---|
| FALA 906: wojna epoki (żelazo) startuje po wejściu w epokę strony, która ją zaczyna (reguła 16A, task #161: AI po własnym wejściu w epokę) | **ZGODNE** (7 z 7 wojen epoki żelaznej) | Seed 4242: 1-16 (t71; wejścia 1: t69, 16: t71), 22-34 (t79; 22: t79, 34: t74), 28-37 (t96, obie strony w Żelazie: 94 i 86), 13-31 (t80; 31: t79), 7-10 (t89; 7: t89). Seed 7: 28-34 (t74; 28: t74), 22-37 (t80; 22: t78). Kto wypowiedział wojnę, nie ma w rekordzie; wnioskowane: strona wcześniej w epoce. Wojna naturalna 28-37 (t77) nie jest wojną epoki. |
| FALA 906: wojna brązowa gracza od tury 40 (zapisy legacy +40 tur) | ZGODNE (start t40 w obu seedach) | 0-7 i 0-10 (4242), 0-1 i 0-7 (seed 7) |
| FALA 908: wojny epoki AI–AI kończą się jak klasyczne | ZGODNE co do powodów | Zalogowane zakończenia to wyłącznie `oferta_zmeczenia`, `prosba_o_pokoj_ai`, `auto_pokoj_dwa_miasta`; brak wymuszonego pokoju dla par AI. Zgodność progów zmęczenia NIE ZMIERZONO. |
| Gracz: koniec wojny epoki | NIE ZMIERZONO | brak wpisu powodu dla par z graczem (patrz 4.4) |

## 6. Znaleziska do zgłoszenia (kandydaci BŁĄD-GRY — do weryfikacji, bez poprawek)

1. Kandydat „wojny żelazne przed wejściem stron w Żelazo” ODRZUCONY w obronie (runda 2): wszystkie 7 wojen epoki zgodne z regułą 16A (§5). Wojna 28-37 z t77 to wojna naturalna (powód None), nie wojna epoki.
2. **Brak logu powodu końca wojny z graczem** (`skipPair`): wojny gracza kończą się bez wpisu. Decyzja inżynierska: rozszerzyć dziennik o pary z graczem (tylko tryb civTest).
3. **Gracz nie wchodzi w Żelazo w 120 turach** (obie serie). Przyczyna NIE ZMIERZONO: czy autopilot prowadzi badania.

## 7. Dane i ograniczenia

- Zasięg: seed 4242 do t120, seed 7 do t84 (patrz 2).
- Wznowienia: seed 4242 — 17 wpisów błędu w `run.log` (awarie Chromium „Target page … closed”), większość w fazie odtwarzania świata przed `loadSlot`; seed 7 — 34 wpisy błędu, z ostatnią serią bez postępu po t84.
- Pomiar statystyczny, jeden bieg na seed. Nie wnioskować o rozkładzie długości wojen na podstawie dwóch seedów.
- Dziennik końca wojny nie obejmuje par z graczem (patrz 4.4 i 6.2), więc przyczyny końca wojen gracza nie ma w danych.
- Wnioski o czasie końca wojen i sojuszach po turze 84 opierają się wyłącznie na seedzie 4242; seed 7 nie ma danych po t84 (przerwanie Chromium, nie błąd gry).
