STATUS: DECISION_REQUIRED
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-DIPLO-DESPAIR-PANEL-VS-LOGIC-AUDIT-Q1
GOAL: audyt bez zmiany reguł: skąd panel bierze Zmęczenie i Desperację, czy to te same wejścia co logika, czy 0% jest poprawne.
BAZA: efda558acc574a32a7d2e1092f673c577fac7889 (origin/main)

ZMIANY/COMMIT: tylko raport (ten plik). Kod gry bez zmian. Poprawka wymaga decyzji właściciela (A/B/C niżej).

ŹRÓDŁA WARTOŚCI (plik:linia, stan efda558):
- Panel gracz↔AI: gra/src/main.ts:26838 → diploWarWearinessPairView(ME(), ownerId, 'ai') (main.ts:12232) → warWearinessPairView (gra/src/game/war-weariness-view.ts, ~linie 90-125).
- Wejścia: sila = computeMilitaryStrength (gra/src/game/diplomacy-military-strength.ts:67; armia + rekruci + wygrane bitwy, x trybut). NIE jest to „Moc militarna" z panelu (main.ts:20181 playerPower = Power; powerOverlayHud: Moc = Armia + Rekruci). Dwie różne miary o podobnej nazwie.
- Zmęczenie: level = warWearinessLevel(turnsAtWar, lostCities obu stron) (gra/src/game/war-weariness.ts, ~linia 85). Tryb 'ai' = poziom bieżący.
- Desperacja w trybie 'ai' (war-weariness-view.ts:112-116): 0, gdy !isWarWeary(level) (level < progChetnosci = 0,5); inaczej loserDespair (war-weariness.ts:112).
- AI (ai.ts:7104-7113) NIE liczy desperacji: cena pokoju = wearinessPeaceCashPn(wearyLevel). Jedyne użycie loserDespair/despairStage w grze to runWarWearinessTick (war-weariness.ts ~301-302, para AI↔AI). Komentarz „ai.ts: ... desperacja tylko przy isWarWeary” w war-weariness-view.ts:12 i :112 jest NIEAKTUALNY. Bramka isWarWeary dla desperacji istnieje tylko w widoku.

RĘCZNE OBLICZENIE (wzór loserDespair; wagi z gra/data/war-weariness-params.json: wagaZmeczenia 0,5, wagaSily 0,5, wagaStrat 0,3, udzialWyraznie 0,45, stratyNasycenie 3):
- Zrzut właściciela (Moc 6969 vs 2611): udział 2611/9580 = 0,272; weak = (0,45 - 0,272)/0,45 = 0,395; zmęczenie 0,28; utraty przegrywającego: nieznane z zrzutu (przyjęto 0).
  - wzór: 0,5·0,28 + 0,5·0,395 + 0 = 0,34 (34%), zgodnie z dispatchem.
  - panel: 0%, bo level 0,28 < 0,5 → bramka isWarWeary.
  - Uwaga: udział liczony z „Moc” nie jest tym samym co udział z sila. Wynik z sila może być inny (NIE ZMIERZONO: brak wartości sila w zrzucie).
- Tabela (level, share, losses) → wzór / panel:
  - (0,28; 0,27; 0) → 34% / 0%
  - (0,28; 0,45; 0) → 14% / 0%
  - (0,28; 0,60; 0) → 0% / 0%
  - (0,60; 0,27; 0) → 50% / 50%
  - (1,00; 0,27; 3) → 100% / 100%

WNIOSKI:
1. Rozjazd panel↔wzór jest realny, ale to nie „błąd wejść”: panel dla gracz↔AI stosuje bramkę isWarWeary (0,5), której wzór nie ma. Żywa logika AI nie pokazuje desperacji wcale. 0% przy 28% zmęczenia jest zgodne z kodem widoku, ale nie z wzorem z dokumentacji (wzór daje 34%).
2. Etykiety: wiersze w sekcji „Relacje z Tobą" są podpisane „Ty" i nazwą rozmówcy (warWearinessRowsHtml, gra/src/ui/diplomacyAudience.ts:1620). Strona wygrywająca dostaje „Zmęczenie wojną", przegrywająca „Desperacja". Kod nie myli stron, ale gracz widzi różne etykiety po obu stronach, co może być odczytane jako pomyłka. Stąd prośba o jednoznaczność (pkt C).
3. Dwie miary siły: panel „Moc militarna" (Power) różni się od siły militarnej używanej do zmęczenia/desperacji (sila, decyzja #337). Ta sama nazwa „militarna” w obu miejscach utrudnia odczyt.
4. Zrzuty właściciela (zrzut-wlasciciela-30.png, -31.png) pokazują tabelę PW „Stan: POKÓJ” i „Oni oferują”, a NIE panel audiencji z wierszami Zmęczenie/Desperacja. Liczby 28%/0% z dispatchu NIE zostały potwierdzone zrzutem. NIE ZMIERZONO na żywo.

DECYZJA WYMAGANA (właściciel), opcje:
A) Usunąć bramkę isWarWeary w widoku gracz↔AI; desperacja = wzór (34% w zrzucie). Zaleta: panel = formuła z dokumentacji. Wada: pokazuje „desperację” poniżej progu 50%, której żadna logika gry nie używa.
B) Zostawić bramkę, poprawić komentarze (war-weariness-view.ts:12 i :112) i dopisać w tooltipie „poniżej 50% zmęczenia desperacja = 0”. Zaleta: bez zmiany wartości. Wada: 0% nadal mylące przy słabszym przeciwniku.
C) Ujednolicić z trybem 'tick' (bez bramki) i podpisać wiersze jednoznacznie (np. „Ty — wygrywasz/przegrywasz”). Zaleta: spójność z AI↔AI. Wada: zmiana UI w dwóch miejscach.
REKOMENDACJA: B jako szybka korekta komentarzy i tooltipa (bez zmiany wartości), potem A albo C po pomiarze na żywo.

TESTY: NIE ZMIERZONO. Brak zmian kodu, więc tsc, logic-test i testy dyplomacji nie były uruchamiane; nie wykonywano npm ci ani build (runda audytowa bez zmian kodu).

BLOKADY: decyzja A/B/C (właściciel); brak zrzutu panelu audiencji z wierszami Zmęczenie/Desperacja.
RUNDY: 1/5
NASTĘPNY KROK: pytanie ABC do właściciela (wyżej); po decyzji osobny temat poprawki w gra/src/game/war-weariness-view.ts i gra/src/ui/diplomacyAudience.ts + test parytetu w gra/tools.
UWAGI-DLA-ORKIESTRATORA: war-weariness-view.ts:12 i :112 opisują użycie desperacji w ai.ts, którego w ai.ts nie ma (ai.ts:7112 ma komentarz o usuniętym mnożniku). Warto sprawdzić, czy ten komentarz nie wprowadza w błąd w innych tematach DIPLO.
DEPLOY/PUSH: NIE WYKONANO
