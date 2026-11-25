# R-WEB-DIPLO-WORLD-NEWS-IN-DIPLOMACY-WINDOW-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WORLD-NEWS-IN-DIPLOMACY-WINDOW-Q1
GOAL: Gracz w oknie dyplomacji widzi trwałą listę „Wydarzenia na świecie” (wojny, pokoje, rozejmy i sojusze między innymi cywilizacjami), tylko dla par, które ma odkryte.
BAZA: origin/main 262823dde115b2626610391686d891b5058de0ac (FALA 905). SHA kodu: patrz pole `sha` w wyniku orkiestratora (czubek commita tej rundy).

## Co zostało zrobione
- Okno dyplomacji = lista cywilizacji (`gra/src/ui/diploListHud.ts`, przycisk toolbar tb-diplomacy). Dodana sekcja „Wydarzenia na świecie” pod listą cywilizacji, widoczna w widoku „Dyplomacja” (nie w filtrze „Wojna”), gdy lista niepusta. Wiersz: ikona, tytuł (np. „Wojna: A i B”), podtytuł i „tura N”.
- Trwała lista w `gra/src/main.ts`: `worldDiploNewsList` (max 20, najnowsze na początku). Zasilana z tego samego hooka co dziennik Wydarzeń (`recordAiAiWarPeaceNews`, wołany z `setDiploRelation`). Dziennik Wydarzeń działa jak dotąd (dedup po id, przycinanie do 8).
- Widoczność: warunek „obie cywilizacje odkryte” sprawdzany przy zapisie wpisu ORAZ przy wyświetlaniu (`worldDiploNewsVisibleList` z `getDiplomaticContacts()`). Wpis z nieodkrytą stroną nie trafia na listę.
- Rozejm vs pokój: `setDiploRelation` przyjmuje opcjonalny 4. argument `newsOpts?: { truce?: boolean }`. Gałąź akceptacji rozejmu (`isTruce`) przekazuje `{ truce: true }`, więc wpis brzmi „Rozejm: …” (newsKind `rozejm`). Pozostałe pokoje zostają „Pokój: …”. Pokój wymuszony i zwykły pokój nie dostają flagi rozejmu.
- Zapis/wczytanie: lista w `meta.worldDiploNews` w save. Wczytanie przez `worldDiploNewsSanitize` (brak pola = pusta lista, niepełne pozycje pomijane, przycięcie do 20). Nowa gra czyści listę (oba miejsca resetu `warEventLog.length = 0`).
- Logika czysta w `gra/src/game/diplo-world-news.ts`: `WORLD_DIPLO_NEWS_MAX`, `worldDiploNewsPush`, `worldDiploNewsSanitize`, `worldDiploNewsVisibleList`, pola `a`, `b`, `newsKind` w wpisie.

## Czego NIE zrobiono (jawnie)
- Punkt 3 dispatchu (powód wojny/pokoju w wpisie): POMINIĘTY. Nie dodano parametru powodu ani kontekstu „ostatni powód”, bo wymagałoby to wejścia w kilka ścieżek wojny/pokoju poza zakresem tej rundy. Wpisy nie mają powodu.
- Wersja angielska tekstów: brak (konwencja sąsiednich wpisów: po polsku).
- Zrzut ekranu okna dyplomacji w żywym Chromium: NIE ZMIERZONO (nie uruchamiano przeglądarki w tej rundzie). Brak dowodu wizualnego układu sekcji; wymaga weryfikacji po FC.
- Nie zmieniano logiki wojny, pokoju ani dyplomacji (tylko hak i argument opcjonalny).

## Pliki zmienione (commit tej rundy)
- gra/src/game/diplo-world-news.ts
- gra/src/main.ts (import, deklaracja listy, `setDiploRelation` +newsOpts, `recordAiAiWarPeaceNews`, reset nowej gry, meta save, load, `createDiploListHud` +getWorldNews)
- gra/src/ui/diploListHud.ts (config `getWorldNews`, sekcja w render, CSS `dl-world-news*`)
- gra/tools/diplo-world-news-test.cjs (rozszerzony: CZĘŚĆ A2 + wiring B)
- gra/tools/diplo-truce-impl-test.cjs (1 regex: akceptuje nowy argument `{ truce: true }` w wywołaniu rozejmu; asercja ta sama, tylko dopuszcza nowy argument)
- dyspozycje/autobot/runs/R-WEB-DIPLO-WORLD-NEWS-IN-DIPLOMACY-WINDOW-Q1/10-operator-claude.md

UWAGA DO ALLOWLISTY: `gra/src/ui/diploListHud.ts` nie pasuje do wzorca `gra/src/ui/*dyplomac*` z dispatchu, ale to jest właśnie okno listy dyplomacji (wskazane w ZADANIU pkt 1 jako „wskaż pliki”). `gra/tools/diplo-truce-impl-test.cjs` nie jest na allowliście; zmiana jest minimalna i wynika z nowego argumentu w wywołaniu rozejmu (bez tej zmiany test czerwony na nietkniętej asercji). Orkiestrator decyduje, czy to akceptować.

## TESTY (liczby z surowego wyjścia)
- `npx tsc --noEmit -p gra` → exit 0 (po poprawce typu, pierwsza próba: błąd `truceUntilTurn` nieobecny w typie Relation; usunięte, rozejm idzie argumentem).
- `node gra/tools/diplo-world-news-test.cjs` → `WYNIK: PASS 66/0`.
- Mutacje (kopia, przywrócone): (1) `worldDiploNewsVisible` na `||` → `WYNIK: 62/4` (czerwony); (2) push bez przycięcia → `WYNIK: 65/1` (czerwony). Po przywróceniu `PASS 66/0`.
- `gra/tools/logic-test.cjs` → PASS [213].
- `gra/tools/tech-tree-test.cjs` → `20 pass, 0 fail`.
- `gra/tools/research-test.cjs` → `PASSED: 33 / FAILED: 0`.
- `gra/tools/unit-replace-test.cjs` → exit 0.
- `gra/tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`.
- `gra/tools/ai-test.cjs` → `ai-test: 297 passed, 0 failed`.
- `gra/tools/war-rules-multiwar-main-guard-test.cjs` → exit 0 (liczby nie odczytano z wyjścia; wynik tylko kodem wyjścia).
- `gra/tools/hud-me-literal-zero-test.cjs` → `150 PASS / 0 FAIL`.
- `gra/tools/hotseat-etap6d-podetap-e-source-test.cjs` → `77 PASS, 0 FAIL`; `…-b-exec` → `48 PASS, 0 FAIL`; `…-d-exec` → `46 PASS, 0 FAIL`; `…-e-exec` → `24 PASS, 0 FAIL`.
- `gra/tools/bramki-tmpdir-unikalnosc-test.cjs` → `PASS=18 FAIL=0`.
- Wszystkie niebieskie testy `gra/tools/diplo*test.cjs` bez `live` (163 skryptów): 162 exit 0. JEDEN czerwony: `diplo-forced-peace-pending-test.cjs` (`FAIL r2-3: okno wraca na początku tury po turn++`). Ten sam wynik na bazie 262823dde (sprawdzone regexem na `git show` bazy) — NIE JEST skutkiem tej zmiany, do zgłoszenia jako dług.
- `diplo-truce-impl-test.cjs`: najpierw 1 FAIL (asercja C finalize, regex na stałe wywołanie `setDiploRelation(...,{...cur,status:'pokoj'})`), po dopuszczeniu argumentu `{ truce: true }` → `91 PASS, 0 FAIL`.
- Testy `diplo*live*` (24 skrypty): NIE ZMIERZONO (wymagają Chromium).

## Testy nowe/rozszerzone (kryteria z dispatchu)
- wpis trafia do listy dla pary odkrytych AI: TAK (CZĘŚĆ A2, push + widok).
- brak wpisu dla nieodkrytej: TAK (`worldDiploNewsEntry` null, `worldDiploNewsVisibleList` pusty).
- nie dubluje par z graczem: TAK (`skip` = isMe/isBarbarian, wiring test).
- lista przycinana do 20: TAK.
- zapis/wczytanie: round-trip JSON 1:1 + migracja pustego pola: TAK (sanitize; NIE ZMIERZONO w prawdziwym save/load gry).
- czerwony po cofnięciu: TAK dla logiki (mutacje) i dla wiringu (asercje źródłowe na hak, reset, meta, load, HUD).

## BLOKADY
- Brak zrzutu ekranu w Chromium (NIE ZMIERZONO).
- Pre-existing czerwony `diplo-forced-peace-pending-test` r2-3 (na bazie też czerwony).

## RUNDY
1/5 — pierwsza runda, bez FAIL.

## NASTĘPNY KROK
Evaluator: sprawdzić zakres allowlisty (diploListHud.ts, diplo-truce-impl-test.cjs), weryfikacja wizualna sekcji w Chromium, decyzja o pominięciu pkt 3 (powód) i o pre-existing r2-3.

## DEPLOY/PUSH: NIE WYKONANO
