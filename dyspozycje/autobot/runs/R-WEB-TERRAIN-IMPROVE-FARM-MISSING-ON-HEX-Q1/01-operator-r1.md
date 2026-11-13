STATUS: DECISION_REQUIRED (część kodowa PASS; punkt (a) DODATKU 1 wymaga decyzji właściciela)
DOMAIN: GAME
TEMAT: R-WEB-TERRAIN-IMPROVE-FARM-MISSING-ON-HEX-Q1
GOAL: Ustalić, czy brak Farmy na liście „Możliwe ulepszenia (teren)” to błąd reguł; wskazać reguły blokujące Farmę/Trzodę; wyjaśnić, czemu auto-przydział nie przenosi obywatela na nową Farmę nad rzeką.
ZMIANY/COMMIT: SHA w sekcji „COMMIT” na końcu (commit tej rundy). Pliki: gra/src/ui/hexContextTooltip.ts, gra/tools/hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs (aktualizacja), gra/tools/terrain-improve-farm-availability-test.cjs (nowy), gra/tools/citizen-auto-assign-farm-river-test.cjs (nowy), ten raport. BAZA: main 5de92030d (FALA 568).
TESTY: patrz niżej.
BLOKADY: brak (tylko decyzja produktowa z punktu 3).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator; orkiestrator zadaje właścicielowi pytanie ABC (pkt 3).
DEPLOY/PUSH: NIE WYKONANO

## 1. Diagnoza heksu ze zrzutu (Łąka 113,34; Glina + Rzeka; postawione: Farma + Trzoda)

Funkcja: `listTerrainPossibleImprovements` (gra/src/ui/hexContextTooltip.ts), wywoływana z `buildHexContextTooltipHtml`. Pomija ulepszenia już postawione (`active.has(key)`).

| Ulepszenie | Warunek | Wynik na heksie ze zrzutu |
|---|---|---|
| Farma | już postawiona | nie oferowana — POPRAWNE (brak ponownej oferty) |
| Trzoda (bydlo) | już postawiona | nie oferowana — POPRAWNE |
| Irygacja | Łąka + rzeka (na heksie/sąsiedzie); silnik: stack Farma+Irygacja+Trzoda dozwolony (kanon 2026-09-07) | oferowana |
| Glinianka | złoże Gliny na heksie | oferowana |
| Fort / Droga / Posterunek | ląd | oferowane |
| Stadnina | złoże konia | brak złoża — poprawnie nie oferowana |
| Tartak/Wyrąb/Obóz | wymagają nakładki Las | poprawnie brak |
| Owce/Tarasy | Wzgórza | poprawnie brak |

Wniosek: lista ze zrzutu jest PRAWIDŁOWA — Farma stoi, więc nie jest oferowana drugi raz. Panel „Ulepszenia postawione” pokazuje Farmę i Trzodę razem (test S1); dane to dopuszczają (`canAddFoodLayer`: farma+bydlo, farma+irygacja, farma+irygacja+bydlo).

## 2. Reguły blokujące Farmę (silnik `createQualifier` i tooltip — zgodne, test parytetu)

1. Teren bazowy tylko Łąka lub Równina (`FLAT_FARM`); Wzgórza, Góry, Pustynia, morze, polarny — brak.
2. Nakładka Las blokuje Farmę na KAŻDYM terenie (R-ULEPSZENIA-FARMA-NIE-W-LESIE-Q1, 2026-08-27) — najpierw Wycinka. Wzgórza z lasem: Farma niemożliwa całkowicie.
3. Już postawiona Farma na heksie.
4. Terytorium gracza (silnik; tooltip pomija jako podgląd mapy).
5. Warstwy żywności (`canAddFoodLayer`): solo-ulepszenia (tarasy, owce, lama) wykluczają Farmę; Farma dopuszczalna na heksie pustym lub z jedną warstwą Irygacja/Trzoda.
6. Złoża NIE blokują Farmy (`hasBlockingDepositForFarm` zawsze false, współistnienie 2026-07-09). Rzeka NIE jest wymagana. Tech Rolnictwo — bramka techu w silniku.
Dla Trzody: Łąka/Równina, bez Lasu, terytorium, cywilizacja/epoka (`isLivestockAllowed`); złoża NIE wymagane (ABC-2 właściciela 2026-10-31). Plantacja: w danych `terrain-improvements.json` nie istnieje (brak klucza).

## 3. Błąd znaleziony i naprawiony (tooltip kontra silnik)

Tooltip wymagał nakładki złoża dla Trzody/Owiec/Lamy (`nakladka !== ZlozeBydla/ZlozeOwiec/ZlozeLamy`), choć silnik od decyzji 2026-10-31 buduje je bez złoża. Skutek: na golej Łące lista nie oferowała Trzody (a na Wzgórzach Owiec), mimo że budowa była możliwa — tooltip obiecywał MNIEJ niż silnik. Poprawka (tylko dostępność, bez zmian plonów): usunięte trzy bramki złoża, dla owiec użyte `isOwceBaseTerrain` (Wzgórza bez Lasu — jak silnik). Aktualizacja asercji źródłowych w `hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs`.

## 4. DODATEK 1 — auto-przydział obywateli

(a) Auto-przydział w trybie `auto` DZIAŁA: `resolveWorkedTiles` i silnik tury `workedHexCoordsForCity` (epoki 1-3, profile żywność/zrównoważone) wybierają Łąkę+rzekę+Farmę (żywność 9 vs 3 na gołej) nawet z dystansu 3 zamiast bliższych gołych pól; po wybudowaniu Farmy kolejne wywołanie przenosi obywatela. Wykluczenia (sibling, centrum miasta, terytorium) nie dotyczą tego scenariusza.
PRZYCZYNA WIDOCZNEGO ZACHOWANIA: tryb `reczny`. Każde kliknięcie obywatela na heksie (main.ts `applyOkolicaTileAdjust`, ok. l. 6540) trwale przełącza miasto w `okolicaTryb = 'reczny'` (a także `onOkolicaEnterManual`). W trybie ręcznym `resolveWorkedTiles` zwraca zapisane `okolicaReczne`, a `rebalanceWorkersAfterPopulationChange` tylko dosadza/zdejmuje przy zmianie populacji — NOWA Farma nie przyciąga obywateli. Zrzut (obywatele obok pustych Farm) pasuje do miasta w trybie ręcznym. NIE_ZMIERZONO na zapisie właściciela (brak zapisu); to wniosek z kodu i testów.
(b) Wspólnej przyczyny z brakiem oferty Farmy NIE ma: oferta Farmy nie zależy od przydziału obywateli. Osobne przyczyny: tooltip (naprawiony, Trzoda/Owce) vs tryb ręczny (zamierzony).
(c) Test: `citizen-auto-assign-farm-river-test.cjs` (11 PASS) — Farma wolna nad rzeką wygrywa z gołymi polami w auto, w silniku tury (era 1-3) i po budowie; w trybie ręcznym obywatele zostają (udokumentowane).

DECYZJA DLA WŁAŚCICIELA (ABC, nie zmieniałem kodu):
- A: bez zmian (ręczny = pełna kontrola gracza). Wada: gracz zapomina, że jest w ręcznym.
- B (REKOMENDACJA): w trybie ręcznym po zbudowaniu/ukończeniu ulepszenia dającego wyższy plon na heksie bez obywatela — podpowiedź/powiadomienie „Przydziel obywatela?” (bez automatycznego ruchu) + wyraźny znacznik „Tryb ręczny” w karcie miasta.
- C: przycisk/opcja „Wróć do auto” po zbudowaniu nowej Farmy lub auto-powrót do `auto` przy każdej nowej Farmie. Wada: nadpisuje świadome ustawienia gracza.

## TESTY (w gra/, node, esbuild; node_modules zainstalowane lokalnie, nie w commicie)
- terrain-improve-farm-availability-test.cjs: 27 PASS / 0 FAIL (przed poprawką: 22/5 — Trzoda, Owce).
- citizen-auto-assign-farm-river-test.cjs: 11 PASS / 0 FAIL.
- hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs: 65 PASS / 0 FAIL (po aktualizacji asercji).
- Regresja: hex-tooltip-stadnina-kopalnia-cyny 29/0, farma-nie-w-lesie 138/0, hex-tooltip-improvement-production-text 19/0, hex-tooltip-resources-line-dedup 28/0, heks-plony-zloze-parytet-ui 19/0, auto-improvements 46/0, ai-improvements 56/0, ai-citizen-hex-sibling-exclusion 19/0, autoimprove-irrigation-after-farms 42/0.
- NIE_URUCHOMIONO: build/dev (zakaz), weryfikacja wizualna w przeglądarce (zmiana tekstowa listy, brak zmian wyglądu).
