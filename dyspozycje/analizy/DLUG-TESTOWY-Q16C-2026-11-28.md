# DLUG-TESTOWY-Q16C — stan na 2026-11-28 (temat R-WEB-TEST-DEBT-Q16C, obrona Operatora r2)

## Stan wiążący

- Baza: `dbcc12f71afe14b578c2936858ba4e58dc7aee7c` (origin/main). Zero zmian w `gra/src/**` i `gra/data/**`.
- Zmieniono tylko piny/harness testów:
  - `gra/tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs`: ZIELONY po poprawkach (22 PASS / 0 FAIL, dwa kolejne przebiegi na tym samym kodzie: pierwszy 21/1, po poprawce F 22/0).
  - `gra/tools/hotseat-drugi-fotel-tura-test.cjs`: poprawione selektory kreatora (NIE ZAMKNIĘTE: przebieg kończy się przerwą Chromium w podscenariuszu, patrz niżej).
- `hotseat-etap4-noop-test.cjs`: NIE ZMIERZONO w tej rundzie (patrz sekcja C).
- Test ai-wojny: NIE ZMIERZONO w mutacji „w harnessie” (czerwony->zielony na pełnym harnessie). Mutację wykonano na poziomie wyrażenia regularnego (patrz A2).

## Klasyfikacja

### 1. ai-wojny-zwykle-cap-dwa-miasta-test.cjs — klasa A (artefakt testu), NAPRAWIONY

Dwa niezależne piny w teście, oba nieaktualne względem gry:

- **A1: fast-forward bez obsługi bramki „Zakończ turę”.** Od tury 17 (okno łaski 15 tur, FALA 935/936) pasywny gracz trafia w bramkę spichlerz/skarbiec. Test wywoływał `endTurn()` bez przygotowania stanu, więc `canPlayerInitiateEndTurn()` odrzucał je po cichu. Dowód na bazie: `tura 17: endTurn() nie osiągnął settled -- DIAG {"inProg":false,"turn":17}` (plik `runs/R-WEB-TEST-DEBT-Q16C/32-ai-wojny-czerwony-baza.txt`). Naprawa: `?civTest=1` w URL i `prepareEndTurnGate(page)` z `_live-ready.cjs` przed każdym `endTurn()`. Ten sam helper, którego używa `era-change-toast-live-test.cjs` i LIVEGATE2. Gra nadal liczy `canEnd` i prognozę. Helper podnosi tylko skarbiec i spichlerz do progów pomiarowych.
- **A2: stary pin asercji F.** Asercja szukała `if (isPeaceLockedBetween(ownerId, targetId)) continue;`. Po refaktorze wypowiedzenia wojny ta bramka jest w `isWarTreatyBlocked({eraWar, hasNap, peaceLocked, hasAlliance})` (`gra/src/game/war-rules-multiwar.ts:455`, `return input.hasNap || input.peaceLocked` dla `eraWar=false`). Logika gry jest zachowana, regex był nieaktualny. Nowy regex: `isWarTreatyBlocked({ eraWar: gateForcedTagAny !== null, ... peaceLocked: isPeaceLockedBetween(ownerId, targetId), ... }) { emRej(`.
  - Dowód na realnym `main.ts`: nowy regex trafia (`match: true`).
  - Mutacja na kopii w pamięci: zamiana `peaceLocked: isPeaceLockedBetween(ownerId, targetId)` na `peaceLocked: false` daje brak trafienia (`mutant match: false`). Asercja jest więc czerwona przy usunięciu bramki.

Wynik: przed poprawkami 2 PASS / 2 FAIL (plik 32), po A1 21 PASS / 1 FAIL (plik 31 przed poprawką F), po A2 22 PASS / 0 FAIL (plik 31-ai-wojny-zielony-po-poprawce.txt, tylko jeden przebieg po ostatniej zmianie; patrz uwagi).

Źródło błędu w grze: BRAK. Blokada od t17 to zamierzona reguła NNS/okna łaski (FALA 935/936), nie błąd.

### 2. hotseat-drugi-fotel-tura-test.cjs — klasa A (stale selektory kreatora), NIE ZAMKNIĘTY

- Dowód bazy (plik 34): `BLOCK: scenariusz nie zadziałał headless: locator.click ... waiting for locator('.civ-newgame .start')`, 3/3 próby.
- Przyczyna: kreator nowej gry został przebudowany. Nawigacja to `.civ-newgame .nav .next` (jak w `ai-plus10-wizard-ui-test.cjs`), nie `.nb.next`. Klasa `.start` nie istnieje w `newGameFlow.ts`. Przycisk startu to `el('button', 'nb next', 'Rozpocznij grę')` (`newGameFlow.ts:2542`).
- Poprawka (wykonana): zamiana selektorów `.civ-newgame .nb.next` i `.civ-newgame .start` na `.civ-newgame .nav .next` w całym pliku.
- Wynik po poprawce (plik 33, przerwany przez mnie): główny scenariusz przeszedł kreator i weszły kolejne podscenariusze; w `r-hotseat-reczny-ruch-gracz2-q1` Chromium zamyka stronę (`Target page, context or browser has been closed`, 3 próby = klasa C). Przebiegu do końca nie zamknięto w tej rundzie. Ponieważ sed zmienił też selektory w późniejszych scenariuszach, ich poprawność NIE jest zweryfikowana.
- Status: NIE ZAMKNIĘTE. Do domknięcia potrzebny pełny przebieg bez przerwania i przegląd, czy kroki późniejszych scenariuszy (np. wybór drugiego fotela) odpowiadają nowemu kreatorowi.

### 3. hotseat-etap4-noop-test.cjs — klasa C (infrastruktura Chromium), NIE ZMIERZONO w tej rundzie

- Historia z raportów (Q16B/Evaluator): live Chromium, 580 s bez wyniku.
- W tej rundzie NIE uruchomiono ponownie. Powód: czas i brak sensownego wyniku bez naprawy harnessu Chromium (SIGSEGV/Target closed widoczne także w 34 i 33).
- Klasyfikacja C wynika z zachowania przeglądarki, nie z asercji. Nie stwierdzono błędu gry ani niepoprawnego pinu.

## Nie ZMIERZONO (jawnie)

- Pełna mutacja w harnessie dla ai-wojny (zmiana kodu testu, nie regexu) — nie wykonano.
- Ponowny pełny przebieg hotseat-drugi-fotel do końca i kolejne ziarna.
- hotseat-etap4-noop w tej rundzie.
- Zgodność selektorów późniejszych scenariuszy hotseat z nowym kreatorem.

## Uwagi dla orkiestratora

- Zakaz utrzymany: brak spawn_task/create_session/create_trigger/send_later, brak run_in_background, brak nohup/&, brak --no-gpg-sign, brak zmian konfiguracji podpisu.
- Usunięto katalogi `gra/dist-ai-wojny-zwykle-cap-dwa-miasta-test` i tymczasowe `/tmp/civ-hotseat-drugi-fotel-tura-*` tej rundy.
- `gra/node_modules` zainstalowano przez `npm ci --ignore-scripts` (bez `npm run build/dev`). Katalog jest ignorowany przez git i zostanie usunięty po zapisie raportu.
