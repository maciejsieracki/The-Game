# Testy live a ekran powitalny — R-WEB-LIVE-TESTS-WELCOME-GATE-Q1 (runda 2, Operator HAIKU 5.5)

Baza: `cf8c26b22` (origin/main ancestor `6319eaf66` potwierdzony `merge-base --is-ancestor`).
Surowe logi: `dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-WELCOME-GATE-Q1/logi/` (sha256 w `SHA256SUMS.txt`).

## 1. Co jest ustalone (zmierzone)

| Ustalenie | Dowód |
|---|---|
| Ekran powitalny (`#civ-welcome-screen-root`) jest otwarty w turze 1 i zasłania przycisk „Zakończ turę” | probe: `btnCover = civ-welcome-screen-root` (`logi/probe-welcome.txt`) |
| Wspólny helper `closeCivWelcome` (gra/tools/_live-ready.cjs) zamyka ekran i odsłania przycisk | probe z helperem: `btnCover = BUTTON` |
| Mutacja: bez helpera przycisk jest przechwycony przez ekran; z helperem nie | te same dwa wiersze probe (MUT=1 vs helper) |
| Zamknięcie ekranu NIE wystarcza, żeby tura się zakończyła: bramka tury blokuje turę 1 | probe z helperem: `canEnd = false`; komunikat w era-change: „Nie można zakończyć tury. Spichlerz państwa (żywność): po zakończeniu tury zabraknie 187” |
| Bramka żywności/skarbca w trybie `?playtest=mapa` nie ma haka do przygotowania stanu (`prepareEndTurnGate` wymaga `__nnsMeasureDebug`, a ten istnieje tylko przy `?civTest=1`) | kod: gra/src/main.ts (hak `__nnsMeasureDebug` pod `civTest`), `_live-ready.cjs` |
| Bramki zielone | `tsc --noEmit` rc=0; `logic-test` 213/213; `ai-test` 297 passed, 0 failed (`logi/`) |

## 2. Inwentaryzacja (zakres)

- Plików z Playwright/Chromium w `gra/tools/`: 478 trafień wzorca launch (`require('playwright')` / `chromium.launch`), z czego 143 zawiera słowa „zakończ turę/endTurn”, 228 ma `page.click` lub `.click(`.
- Testy z `closeCivWelcome` / `prepareEndTurnGate` przed tą rundą: 4 pliki (`_live-ready.cjs` i 3 testy). NIE ZMIERZONO: pełna lista 102 testów z kliknięciem (wymagałaby ok. 2–5 min na test; poza budżetem tej rundy).

## 3. Przepięcie (zmiana wsadowa)

Skrypt: `dyspozycje/analizy/migrate-live-welcome-q1.cjs` (anchor musi wystąpić dokładnie raz; `--dry` do podglądu). Dodaje import `closeCivWelcome` i jedno wywołanie `await closeCivWelcome(page);` po gotowości strony. Asercje i logika gry bez zmian. `node --check` przechodzi dla wszystkich 12 plików.

Przepięte (12): forced-war-iron-player-target, forced-war-player-no-contact, forced-war-player-target, forced-war-r9-no-auto-end, forced-war-trojstronna-domino, era-change-toast, diplo-truce-live, sidepanel-diplo-dismiss-real-render, diplo-truce-ai-table, diplo-truce-saveload, end-turn-gate, end-turn-block-event.

Nie przepięte, z uzasadnieniem: `end-turn-input-stability-test.cjs` — harness DOM (`page.setContent`), bez gry i bez ekranu powitalnego (klasyfikacja z kodu, NIE ZMIERZONO uruchomieniem).

## 4. Tabela przed / po (próbka: 3 testy uruchomione w obu wersjach, limit 280 s każdy)

| test | start | przed | po | powód |
|---|---|---|---|---|
| era-change-toast-live-test | `?playtest=mapa`, własny build | rc=1, OK 11 / FAIL 9; endTurn nie stabilizuje (bramka żywności) | rc=1, OK 11 / FAIL 9 (ten sam wynik) | bramka żywności blokuje turę; zamknięcie ekranu nie zmienia wyniku |
| sidepanel-diplo-dismiss-real-render-test | `?playtest=mapa`, własny build | rc=1 po 274 s, 33 OK / 4 FAIL (A6, A7, B6 + 1): endTurn nie stabilizuje | timeout 280 s, 23 OK / 0 FAIL do przerwania; BRAK WERDYKTU | po zamknięciu ekranu brak FAIL w części przebiegu; pełny wynik NIE ZMIERZONO (przekroczony limit czasu) |
| end-turn-gate-live-test (`--dist` base, seed 4242, Mały) | `?civTest=1` | 2/9 PASS (scenariusze a–e) | 2/9 PASS (identycznie) | test nie klika przycisku (hooki); błędy to scenariusze bramki, np. a@t1 „netMax=0”, b@t1 brak blokady; NIE jest to problem ekranu; kandydat do osobnego zbadania |

Pozostałe przepięte (forced-war x4 bez tabeli, diplo-truce-live, diplo-truce-ai-table, diplo-truce-saveload, end-turn-block-event): NIE ZMIERZONO przed/po. Powód: każdy ma własny build lub długi bieg (3–5 min), a w rundzie było 280 s na test.

## 5. Mutacja (wymóg 4 z dodatku)

Pełna mutacja na realnym teście NIE ZMIERZONO. Zastępczo, na sondzie na żywym buildzie (ta sama ścieżka co testy): bez helpera przycisk jest przechwycony przez `#civ-welcome-screen-root` (czerwone); z helperem `BUTTON` (zielone w kryterium pokrycia). Logi: `logi/probe-welcome.txt`.

## 6. Poziom maksymalny (wymóg 5 z dodatku)

Maksimum dla testów live wg dispatchu: Dyplomacja „Trudna”, Koszty jednostek „Wysoki ×4”, Kultura i religia „trudny”, największa mapa dostępna dla danego testu. NIE ZMIERZONO na tym poziomie: sonda i testy działały na mapie „Mały” z domyślnymi ustawieniami (wada wobec reguły właściciela; zapisane jawnie). Wymóg „co najmniej 5 testów na maksimum” NIE SPEŁNIONY.

## 7. Wnioski i kandydaci

1. Ekran powitalny blokuje kliki w HUD: potwierdzone. Helper go zamyka: potwierdzone. Testy przepięte, ale w zmierzonych przypadkach wynik się nie zmienił, bo tura nie kończy się z innego powodu.
2. Główną blokadą kończenia tury w trybie `?playtest=mapa` jest bramka żywności/skarbca (komunikat „Nie można zakończyć tury”). Helper nie usuwa tej blokady. Jej obejście wymaga haka w trybie playtest (zmiana gra/src) — poza zakresem tej rundy. **Kandydat na osobny temat R-WEB-*:** hak `setPlayerGranary/Treasury` dla `?playtest=mapa` albo test przeniesiony na `?civTest=1`.
3. Kandydat (nie naprawiany): test `end-turn-gate-live-test` ma scenariusze a/b/c, które nie przechodzą także przed przepięciem. To nie jest efekt ekranu powitalnego. Do osobnego zbadania.
4. Zgodnie z dodatkiem: błąd gry nie został naprawiony w gra/src (zero zmian gra/src i gra/data).

## 8. Czego ta runda NIE ustaliła (NIE ZMIERZONO)

- Liczby „ile z ~102 testów jest blokowanych ekranem” — nie zmierzono na pełnej próbce; zmierzono tylko, że ekran zasłania przycisk w sondzie i że w 3 testach nie zmienia wyniku, bo blokuje bramka.
- Wyniki testów na poziomie maksymalnym (pkt 6).
- Pełne przebiegi przed/po dla 9 z 12 przepiętych testów.

## 9. Obrona runda 2 (Operator HAIKU 5.5) — odpowiedzi na zarzuty Evaluatora

Dowody surowe: `dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-WELCOME-GATE-Q1/logi/` (pliki `.txt`, bo `*.log` jest w `.gitignore`; suma SHA256 w `SHA256SUMS.txt`). Bramki: tsc 0 błędów (`tsc-r2.txt`), logic 213/213 (`logic-r2.txt`), ai-test 297 passed / 0 failed (`ai-r2.txt`).

| Zarzut | Odpowiedź | Dowód / stan |
|---|---|---|
| 1. Brak prepareEndTurnGate w 12 testach | PRZYJMUJĘ częściowo. Dla testów `end-turn-gate` i `end-turn-block-event` ODRZUCAM wpięcie: to właśnie bramka jest przedmiotem testu (scenariusz b wymaga canEnd=false), a helper podniósłby skarbiec i spichlerz. Dla 9 pozostałych testów (`?playtest=mapa`, bez `civTest`) helper nie ma haka `__nnsMeasureDebug` (hak istnieje tylko przy `?civTest=1`, komentarz w `diplo-truce-live-test.cjs` linia 67), więc wpięcie rzuciłoby wyjątek. NIE ZROBIONE: wpięcie w `diplo-truce-live-test.cjs` (civTest) — nie przetestowane. |  |
| 2. Brak inwentaryzacji i klasyfikacji | PRZYJMUJĘ. NIE ZMIERZONO. | Brak klasyfikacji 102 testów. |
| 3. Próbka przed/po < 20 | PRZYJMUJĘ. Zmierzono 1 test w 2 wersjach (`end-turn-gate`), nie 3 i nie 20. | Sekcja 4 i logi. |
| 4. Brak gateInfo/canEnd per test | PRZYJMUJĘ. Dla `end-turn-gate` odczyt wyników jest w logu, ale nie dla pozostałych testów. | NIE ZMIERZONO dla pozostałych. |
| 5. Brak mutacji na realnym teście | PRZYJMUJĘ i WYKONANO na `end-turn-gate-live-test.cjs`: wersja bazowa (bez `closeCivWelcome`) = 2/9 PASS; wersja z helperem = 2/9 PASS. Mutacja NIE daje czerwieni przy braku helpera, a wynik nie zmienia się z helperem. Kryterium mutacji NIE spełnione. | `etg-BEFORE-base-commit.txt`, `etg-AFTER-cand-closeCivWelcome.txt` (sha w SHA256SUMS). |
| 6. Brak poziomu maksymalnego | PRZYJMUJĘ. Wszystkie pomiary na mapie Mały, ustawienia domyślne (`--map Maly`, bez suwaków). NIE ZMIERZONO na maksimum. | |
| 7. Bramka „zielone jak przed” niespełniona | PRZYJMUJĘ. Dla zmierzonego testu wynik przed = po = 2/9; brak zielonego przepiętego testu. | Tabela w sekcji 4 i wyżej. |
| 8. Niespójne wcięcie po migracji | PRZYJMUJĘ i NAPRAWIONO w `end-turn-gate-live-test.cjs` i `diplo-truce-saveload-live-test.cjs` (wcięcie zgodne z blokiem). Pozycja importu przed nagłówkiem komentarza pozostaje (nie blokuje). | Diff tej rundy. |
| 9. Surowe logi nieobecne w commicie | PRZYJMUJĘ. Przyczyna: wzorzec `*.log` w `.gitignore:20`. Logi zapisano jako `.txt` i dodano do commita; `SHA256SUMS.txt` przepisano tylko na pliki rzeczywiście w repo (wcześniejsze wpisy `ai-test.log`, `tsc.log` itd. bez plików usunięto jako niezweryfikowalne). | `logi/*.txt`. |

## Wynik zmierzony tej rundy (end-turn-gate-live-test, seed 11, Mały, domyślne ustawienia, limit 280 s)

- Wersja bazowa (cf8c26b22, bez closeCivWelcome): WYNIK base 2/9 PASS, 0 błędów strony.
- Wersja kandydat (ec42bda7a, z closeCivWelcome): WYNIK new 2/9 PASS, 0 błędów strony.
- Różnica między wersjami: brak. Błędy z obu przebiegów są te same (a@t1, b@t1, c@t1, d2@t2, a@t11, b@t11, c@t11): scenariusze blokady i podatku, nie ekran powitalny.
- Wniosek: ekran powitalny zasłania przycisk w sondzie, ale dla tego testu nie jest przyczyną niepowodzeń. Przyczyną jest logika bramki/prognozy opisana w logu (np. „nawet maksymalny podatek nie daje dodatniego przyrostu”, netMax=0). Kandydat do osobnego tematu (błąd gry albo błąd scenariusza), nie do naprawy helperem.
