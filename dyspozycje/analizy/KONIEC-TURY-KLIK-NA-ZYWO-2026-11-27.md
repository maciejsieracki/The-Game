# Koniec tury: klik „Zakończ turę” na żywo i konsola PRZED/PO (R-WEB-ENDTURN-CLICK-LIVE-Q1, ENDCLICK)

Baza kandydata (CUR): origin/main 3b23b2d4f (FALA 934 ENDQUIET). Baseline (PRE): 6afdec814 (sprzed ENDQUIET).
Runda 2 obrony Operatora (HAIKU 5.5), odpowiedzi na zarzuty Evaluatora z commita 80efc5a7.
Zmiany w `gra/src`: brak. Zmieniono tylko narzędzie pomiaru `gra/tools/endturn-click-live.cjs`.

## 0. Wynik

- W 4 przebiegach CUR (2 ziarna × 2 tryby) i 4 przebiegach PRE każda tura t2–t8 (lub do porażki gracza w t7) zmieniła się
  po **jednym** kliku, wysłanym dopiero gdy przycisk był aktywny (aria-disabled=false, endTurnInProgress=false,
  trafienie w `[data-end]`).
- Nie stwierdzono przypadku (ii): „klik nie działa mimo aktywnego przycisku”. Nie ma podstaw do poprawki gry.
- Dwa „drugie kliki” z rundy 1 (s4242 t7, s7 t6) były kliknięciami wysłanymi, gdy przycisk był nieaktywny
  (endTurnInProgress=true). Gra je odrzuciła (log `blocked: endTurnInProgress` bez `START`). W rundzie 2 harness nie
  klika w takim stanie, więc te przypadki nie występują. To artefakt protokołu rundy 1, nie błąd gry.
- Przypadki z zasłoniętym przyciskiem (ekran powitalny w turze 5, ekran porażki w turze 7) są stanem gry lub
  blokadą, którą gracz zamyka. Nie są błędem kliku.
- Pełna tabela PRZED/PO (punkt 2 dispatchu) jest **niekompletna**: stan (c) bramki NNS NIE ZMIERZONO (sekcja 4).
- Anomalia ENDPERF (t2→t3 bez zmiany 120–240 s) **NIE ODTWORZONA** w tym protokole, ale NIE zamknięta jako artefakt
  (sekcja 5).

## 1. Ustawienia (maksimum): zmiany w rundzie 2

Źródło: `gra/tools/endturn-click-live.cjs` (MAX_PARAMS); zapis wejścia: `readback-ustawien-maksimum.txt`.
Poziomy wzięte z etykiet w `gra/src/ui/newGameFlow.ts`.

| Ustawienie | Runda 1 | Runda 2 | Uzasadnienie |
|---|---|---|---|
| Koszty budynków (`buildingCostPace`) | Niski (x1) | **Wysoki (x4)** | Opcje: Niski/Normalny/Wysoki; maksimum to Wysoki. Zarzut 6. |
| Zasięg ruchu (`ruchSwiataPace`) | Krótki (x1) | **Długi (x6)** | Opcje: Krótki/Normalny/Długi; hint: „Bazowy = Krótki (×1)”. Zarzut 6. |
| Poziom gry, barbarzyńcy, dyplomacja, kultura i religia | Trudny | bez zmian | zgodne z dispatchem |
| Koszty jednostek, wzrost ludności, jakość mapy/renderu | Wysoki | bez zmian | zgodne z dispatchem, patrz niżej |
| Rozmiar mapy `Maly`, rywale 2, prędkość `Normalna` | j.w. | bez zmian | **NIE zweryfikowano jako maksimum** (sekcja 6) |
| Limit miast (baza) | 10 | bez zmian | **NIEJEDNOZNACZNE**: maksimum może być 20 (sekcja 6) |

Uwaga o wzroście ludności: etykieta gry to „Wysoki (×1 próg)”, czyli najszybszy wzrost. Dispatch opisuje to jako
„Wysoki ×4”. Maksimum „trudności” byłoby wolne (×4 próg). Przyjęto wariant dispatchu (`wysoki`); drugi wariant
NIE ZMIERZONO.

Efekt zmiany ustawień (zaobserwowany, nie wnioskowany): przy maksimum pasywny gracz na ziarnie 4242 **ginie w turze 7**
w obu buildach (ekran `.vsc-overlay.lose`). W rundzie 1 (niskie/krótkie) przeżywał do t8. Na ziarnie 7 przeżywa do t8.

## 2. Protokół pomiaru (runda 2)

- Klik tylko gdy: `aria-disabled="false"` ORAZ `isEndTurnInProgress()===false` ORAZ punkt środka przycisku trafia
  w `button[data-end]` (`hitInfo`). Ponowny klik dopiero po ponownym spełnieniu tych warunków, maks. 3 ponowienia,
  okno 60 s na zmianę tury.
- Przed czekaniem co ~5 s zdejmowane są blokady harnessu: `closeCivWelcome`, `closeModals`, `clearBattles`,
  `rejectAwaitingAiOffers`, `acceptForcedPeace`. Ekran powitalny w turze 5 zasłaniał przycisk (`#civ-welcome-screen-root`,
  `DIV` w `elementFromPoint`); w rundzie 1 był to „DIV.” w t5. Gracz też go zamyka.
- Odczyt stanu w pętli: tylko DOM, flaga `isEndTurnInProgress()` i `__nnsMeasureDebug.snapshot().turn`.
  **`gateInfo()` / `canPlayerInitiateEndTurn()` NIE są wołane w pętli** (zarzut 4). Wywołanie `gateInfo()` jest tylko
  w gałęzi „brak zmiany tury” (nie wystąpiła w żadnym przebiegu rundy 2).
- Próbkowanie co ~500 ms w każdym oknie (aria, endTurnInProgress, trafienie, ekran porażki).
- `canEnd` NIE jest odczytywane w tym pomiarze (nie da się go odczytać bez efektów ubocznych). Kolumny `aria/canEnd`
  z rundy 1 nie są wiarygodne i nie są tu cytowane (zarzut 4).
- „Czas do zmiany” = od rozpoczęcia czekania na aktywny przycisk do zmiany numeru tury. Obejmuje czas, w którym
  przycisk jest nieaktywny (tura AI trwa).

## 3. Kliknięcia t2–t8 (wynik: tura zmieniona = OK; czas w sekundach; liczba kliknięć)

Pliki: `dyspozycje/autobot/runs/R-WEB-ENDTURN-CLICK-LIVE-Q1/dane-ENDCLICK-<build>-s<ziarno>-bez-konsoli.json`
(i wersje `-konsola-30s.json`, z oknami konsoli).

| ziarno | build | t2 | t3 | t4 | t5 | t6 | t7 | t8 |
|---|---|---|---|---|---|---|---|---|
| 4242 | CUR | OK 6.9 s ×1 | OK 6.9 s ×1 | OK 5.6 s ×1 | OK 17.0 s ×1 | OK 9.0 s ×1 | **porażka gracza** | NIE ZMIERZONO |
| 4242 | PRE | OK 8.4 s ×1 | OK 8.6 s ×1 | OK 7.7 s ×1 | OK 20.0 s ×1 | OK 9.9 s ×1 | **porażka gracza** | NIE ZMIERZONO |
| 7 | CUR | OK 11.7 s ×1 | OK 7.9 s ×1 | OK 8.7 s ×1 | OK 11.5 s ×1 | OK 8.3 s ×1 | OK 7.8 s ×1 | OK 8.2 s ×1 |
| 7 | PRE | OK 8.1 s ×1 | OK 8.2 s ×1 | OK 10.5 s ×1 | OK 8.6 s ×1 | OK 7.1 s ×1 | OK 7.1 s ×1 | OK 6.6 s ×1 |

Przebiegi z oknami konsoli (CUR/PRE, ziarna 4242/7) dały to samo: wszystkie tury OK ×1 (poza porażką t7 na 4242).
Brak błędów `pageerror`. Wszystkie 8 przebiegów zakończyło się kodem 0 (bez SIGSEGV w tej rundzie).

Pomiary dla t5 w PRE i CUR są zbliżone, a wartości 17–20 s to czas czekania na koniec tury AI.

## 4. Konsola PRZED/PO (punkt 2 dispatchu) i stan (c)

Liczby z przebiegów `-konsola-30s` (okno 30 s; „warn” = `console.warn`, „blk” = wpisy `[EndTurn] blocked` w oknie).
Każda komórka to jeden przebieg (n=1). Wpisy `[EndTurn] blocked` powtarzają się w przebiegach bez okien
(`blk` w tabeli sekcji 3: PRE 9–17 na turę, CUR 0).

| stan | build | ziarno 4242 | ziarno 7 | rodzaje wpisów |
|---|---|---|---|---|
| (a) start, przed założeniem miasta (≤30 s) | PRE 6afdec814 | warn 50 (blk 49) | warn 43 (blk 43) | `blocked: awaitingFirstPlayerCity` (cykl HUD co ~0,5 s) |
| (a) | CUR 3b23b2d4f | warn 2 (blk 0) | warn 1 (blk 0) | 1 × WebGL „GPU stall due to ReadPixels” (środowisko) |
| (b) po kliku, tura 2 (30 s) | PRE | warn 23 (blk 20) | warn 23 (blk 20) | `blocked: endTurnInProgress` (cykl HUD) + START/DONE |
| (b) tura 2 | CUR | warn 3 (blk 0) | warn 3 (blk 0) | tylko `triggerPlayerEndTurn: START/DONE` (gest gracza) |
| (b) tura 3 (30 s) | PRE | warn 13 (blk 11) | warn 16 (blk 14) | j.w. |
| (b) tura 3 | CUR | warn 2 (blk 0) | warn 2 (blk 0) | START/DONE |
| (b) tura 4 (30 s) | PRE | warn 14 (blk 12) | warn 15 (blk 13) | j.w. |
| (b) tura 4 | CUR | warn 2 (blk 0) | warn 2 (blk 0) | START/DONE |
| (c) bramka NNS (podatek 100%, obrońca w t5, t6–7) | PRE / CUR | **NIE ZMIERZONO** | **NIE ZMIERZONO** | — |

Wniosek (punkt 2): w CUR wpisy `[EndTurn] blocked` nie występują ani w (a), ani w (b). Pozostałe wpisy w CUR to
START/DONE (gest gracza) i jednorazowe ostrzeżenia WebGL. W PRE cykl HUD produkuje 1,4–1,7 wpisu/s w (a) (43 i 50 wpisów w 30 s) i 0,4–0,7 wpisu/s w (b) (blk 11–20 w oknie 30 s).

**(c) NIE ZMIERZONO.** Stan wymaga fizycznego przesunięcia suwaka podatku na 100% Pieniądze, zakupu najtańszego
obrońcy klikiem w turze 5 (ścieżka panelu miasta jak w `tools/realdef-max-gaps.cjs`, policy p3/p4) i obserwacji
blokady w t6–7. Ta ścieżka nie została dodana do `endturn-click-live.cjs` w tej rundzie. Proponowany osobny temat:
R-WEB-ENDTURN-NNS-CONSOLE (kandydat do decyzji orkiestratora).

## 5. Anomalia ENDPERF (t2→t3 bez zmiany 120–240 s przy aria=false, canEnd=true)

- W rundzie 2 nie odtworzono: w 4 przebiegach CUR/PRE (2 ziarna) każda tura zmieniała się w 4–20 s po czekaniu na aktywny
  przycisk. Najdłuższe 20,0 s (PRE s4242 t5) i 17,0 s (CUR s4242 t5) to czas zasłonięty przez ekran powitalny.
- Nie zamykam tego jako artefakt harnessu. Anomalia ENDPERF wystąpiła w protokole, który wołał `gateInfo()` co 500 ms
  (`canPlayerInitiateEndTurn` z `console.warn` i `healStaleEndTurnBlockers`). Hipoteza „to odpytywanie wywołało
  opóźnienie” NIE została przetestowana (brak A/B). Status: **NIE ODTWORZONO (n=2 na ziarno), przyczyna NIE ZMIERZONO**.
- Runda 2 nie wywołuje `gateInfo()` w pętli, więc w tym protokole hipoteza nie jest sprawdzana.

## 6. Ograniczenia i to, czego nie zmierzono (NIE ZMIERZONO)

- n=2 na komórkę dla kliknięć (dwa tryby: bez okien i z oknami konsoli). Okna konsoli: n=1 na komórkę.
- `canEnd` (bramka) nie mierzony bez efektów ubocznych; zarzut 4 przyjęty.
- Stan (c) bramki NNS: NIE ZMIERZONO (sekcja 4).
- Maksimum dla rozmiaru mapy (`Maly` → najwyższa opcja), liczby rywali (`2`), prędkości (`Normalna`) i limitu miast
  (10 → 20?): NIE zweryfikowano. Nie zmieniano ich w rundzie 2. Najwyższa mapa zmienia koszt generacji i ryzyko Chromium.
  Decyzja dla orkiestratora.
- Wzrost ludności: wariant „maksimum trudności” (wolny) NIE ZMIERZONO.
- t8 na ziarnie 4242: NIE ZMIERZONO (porażka gracza w t7 w obu buildach przy maksimum).
- Odczyt ustawień z interfejsu gry: NIE ZMIERZONO (readback jest wejściem skryptu).
- Blokady harnessu (zamykanie ekranu powitalnego, modali, bitew, ofert AI, pokoju wymuszonego) są stałymi
  elementami protokołu, nie odczytem gry.

## 7. Dane i pliki

- `gra/tools/endturn-click-live.cjs`: narzędzie pomiaru, runda 2 (protokół z sekcji 2).
- `dyspozycje/autobot/runs/R-WEB-ENDTURN-CLICK-LIVE-Q1/dane-ENDCLICK-{cur,pre}-s{4242,7}-{bez-konsoli,konsola-30s}.json`:
  surowe wiersze (po turze: wynik, próbki aria/endTurnInProgress, log kliknięć, okna konsoli).
- `dyspozycje/autobot/runs/R-WEB-ENDTURN-CLICK-LIVE-Q1/readback-ustawien-maksimum.txt`: wejście ustawień rundy 2.
- Dane rundy 1 (`dane-KLIK-*.json`) zostały w katalogu jako historia. Nie są podstawą wniosków rundy 2 (protokół różni się
  i ustawienia były niższe niż maksimum).
- PRE bundle (6afdec814) zbudowany do katalogu roboczego poza repo; po pracy usunięty.
