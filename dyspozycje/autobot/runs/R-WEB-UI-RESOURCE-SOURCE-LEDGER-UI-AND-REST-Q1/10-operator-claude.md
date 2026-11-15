STATUS: PASS-WITH-NOTES (CZĘŚCIOWY: wykonano UI „Skąd zapasy” na karcie surowca + pamięć N tur; partia 3 (łup, zwrot, miasto, dary, zapis historii) NIE wykonana; pomiar czasu tury i zrzut Chromium NIE ZMIERZONO)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1
GOAL: „Skąd zapasy” widoczne w grze — karta surowca pokazuje listę źródeł przyrostu i ubytku z ostatnich N tur (jedna linia na źródło, po polsku, kolory); sól i ceramika otwarte domyślnie. Tura 1/5 tego tematu.
BAZA: origin/main da8e865cc (FALA 733, zawiera partię 2 z r5 FC b9559d6a7). UWAGA: dispatch podaje kandydata c3e56ee083105ef681ee647b89d1be233b714496 (commit „Dispatch: LEDGER-UI-AND-REST”), ale ten commit należy do innej linii historii (rodzic ee4e3f80b, „Rejestr: FALA 732”) i względem da8e865cc usuwa 495 plików / ~220 tys. linii kodu. Startowanie od niego dałoby worktree bez kodu gry. Zastosowano bazę z DODATKU: origin/main da8e865cc.

ZMIANY/COMMIT (allowlista; commit wyłącznie tymi ścieżkami):
- gra/src/game/resource-ledger.ts — pamięć N tur (`commitLedgerHistoryTick`, `resetLedgerHistory`, `ledgerHistoryForOwner`, `ledgerHistoryLength`): przechowuje REFERENCJE do map `resourceLedgerByOwner` kolejnych ticków (późne zapisy tego samego ticku są widoczne); agregacja `ledgerSourceLinesForResource` (jedna linia na kierunek+etykietę, scalanie kluczy o tej samej etykiecie, sort przyrosty/ubytki po |suma|).
- gra/src/main.ts — 4 miejsca, minimalne: (1) import (dopisane 3 nazwy do istniejącego importu z resource-ledger; 1 linia zmieniona); (2) po `ledgerAuditLastTick = econ.resourceLedgerByOwner` wywołanie `commitLedgerHistoryTick(econ.resourceLedgerByOwner, readLedgerHistoryTurns(data.econParams, _menuDifficulty))` — N z econ-params (wartość 10), tylko odczyt/referencja, zero wpływu na stan; (3) i (4) `resetLedgerHistory()` obok dwóch istniejących `resetPendingLedger()` (wczytanie zapisu i nowa gra) — dziennik nie jest w zapisie gry, więc po wczytaniu jest pusty.
- gra/src/ui/resourceSourceLedgerHtml.ts (NOWY) — czysta funkcja markupu `resourceSourceLedgerDetailsHtml` (<details class="civ-emp-res-skad">, linie +/−, klasy gain/loss, escapowanie HTML, bez surowych ID).
- gra/src/ui/empireDetailPanel.ts — import; `resSkadZapasyHtml(resourceKey, ownerId=0)` odczytuje dziennik gracza (owner 0) i zwraca '' gdy brak wpisów; wstawione w `resCardHtml` po `resUsageDetailsHtml(r)`; CSS klas `civ-emp-res-skad*` obok bloku „Zobacz szczegóły zużycia”.
- gra/tools/resource-ledger-skad-ui-test.cjs (NOWY) — 18 asercji (patrz TESTY).
- dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1/10-operator-claude.md (ten raport).
Poza zakresem / nietknięte: WERSJE.md, manifest, rust-port, kod E3c (main.ts ~40337 szlak), resource-ledger-*-test i ich zachowanie, stan gry (żadna mutacja modelu gry w tym commicie).

TESTY (surowe wyniki z tego worktree, uruchomione przez agenta):
- `npx tsc --noEmit` (gra/): exit 0, 0 błędów. UWAGA środowiskowa: pierwsze uruchomienie w sandboxie dawało 179 błędów (brak paczek `three`, `@types/three`, `vite` i nowszego TypeScript w środowisku agenta). Doinstalowano je poza repo w scratchpadzie (three 0.169.0, @types/three 0.169.0, vite 5.4.10, typescript 5.9.3) i podlinkowano jako gra/node_modules (katalog ignorowany przez gra/.gitignore). Błędy w plikach dotkniętych tym commitem: 0.
- resource-ledger-skad-ui-test (NOWY): 18 passed, 0 failed (przycięcie do N=10 po 25 tickach; reset; późny zapis do ticku widoczny; brak rekordu = pusta tura; sól: „+30 Umowa wymiany z Asyria”, „+20 Warzelnia (Rzym)” (dwa klucze scalone), „−20 Obywatele”; drewno; mutacja pominięcia ticku zmienia sumę; markup: znaki, klasy, open dla soli, escapowanie, brak „|” w HTML; N z econ-params = 10).
- resource-ledger-test: 1030 passed, 0 failed.
- resource-ledger-consume-test: 30 passed, 0 failed.
- resource-ledger-trade-test: 27 passed, 0 failed.
- resource-ledger-engine-test: 20 passed, 0 failed.
- Bramki referencyjne: logic-test LOGIC OK (213/213); tech-tree-test 20 pass / 0 fail; research-test PASSED 33 / FAILED 0 (ALL GREEN; wymagało paczki three w scratchpadzie); unit-replace-test 21/21; combat-test 6/6; unit-power-test 6 pass / 0 fail.
- Pokrewne testy karty surowca: resource-cards-gross-net-test 22/0; empire-panel-drobiazgi-runda2-test 33/0; kolor-surowce-spojnosc-test 34/34; warehouse-state-cap-20pct-test 56/0.
- NIE ZWERYFIKOWANE jako regresja tego commitu (fail widoczny, nie badany na bazie): surow-civ-storage-test 64 passed / 4 failed — wszystkie 4 to asercje tekstowe o pętli wycinki lasu w main.ts (creditOwnerResourceStock/drewnoCap), a ten commit nie zmienia tych linii (diff main.ts: 7 dodanych, 1 zmieniona = import). resource-usage-breakdown-test: błąd esbuild („No loader for .svg?raw”) przy bundlu łańcucha UI — poza moim dotknięciem. resource-amount-chip-icons-real-render-test i hud-gross-net-rest-test: brak Playwright/Chromium w sandboxie.
- NIE ZMIERZONO: pomiar czasu tury (≥3 powtórzeń, tick 100) — brak Chromium/Playwright (narzędzie resource-ledger-live-measure.cjs go wymaga). Ostatni pomiar: FC r5 na b9559d6a7, seed 2024 +9,5% (pojedynczy, szum nieustalony). Ten commit dodaje na tickach tylko zapis referencji do Map i przycięcie tablicy — koszt O(N) na tick, ale NIE wykonano pomiaru.
- NIE ZMIERZONO: zrzut Chromium okna/karty „Skąd zapasy” dla soli i ceramiki (dwa rozmiary) — brak Chromium; test renderu realnego DOM nie został napisany (test HTML działa na czystej funkcji, nie na DOM panelu).
- NIE ZMIERZONO: test zgodności księgi z magazynem w realnej grze (≥3 ziarna × 30 tur) na tym commicie — ostatnio FC r5 (seedy 7, 2024; maxAbsDiff 0). Commit nie zmienia zapisów do księgi ani stanu gry.

RUNDY: 1/5 tego tematu (UI-AND-REST-Q1); ten sam ID zachowany.

BLOKADY:
1. Partia 3 nie wykonana: łup z bitwy, zwrot przy anulowaniu rekrutacji/budowy, zdobycie/oddanie miasta, prezenty/dary nadal nie są księgowane (lista z r5 bez zmian).
2. Zapis historii w zapisie gry NIE zaimplementowany: dziennik jest pusty po wczytaniu (zgodne z „brak pola = pusty dziennik”), ale kryterium „zapis→wczytanie zachowuje dziennik” NIE jest spełnione — wymaga decyzji, czy dziennik ma trafiać do zapisu (zmiana formatu save).
3. Środowisko: brak Chromium/Playwright w sandboxie (punkt e i pomiar czasu tury).
4. Decyzja ABC E3c (szlak handlowy przesuwa zapasy poza księgą, main.ts ~40337) — nadal otwarta; nie ruszane.

NASTĘPNY KROK: (a) orkiestrator decyduje o integracji 10-operator-claude (commit na gałęzi roboczej, bez deployu); (b) partia 3 (łup/zwrot/miasto/dary) jako kolejna runda tego samego ID, z osobnym dispatchem; (c) decyzja ABC: zapis dziennika w zapisie gry (tak/nie); (d) Playwright+Chromium w środowisku agenta, aby zamknąć pomiar czasu tury (≥3×) i zrzuty soli/ceramiki (dwa rozmiary); (e) test 7h w resource-ledger-trade-test (zaostrzenie na wycinkaGot) z r5 — nieruszany.

UWAGI-DLA-ORKIESTRATORA:
- Kandydat z dispatchu (c3e56ee08) nie jest na linii origin/main; patrz BAZA.
- Dług z r5 „identyczne etykiety Warzelni w UI” — zamknięty w UI przez scalanie po etykiecie (ledgerSourceLinesForResource), nie w danych.
- Sekcja „Skąd zapasy” pokazuje sumy z okna N tur, nie stan bieżący; nagłówek podaje liczbę tur w oknie.
- Brak zmian w allowliście poza wymienionymi plikami; docs/encyklopedia i wikiBundle nie były aktualizowane (wymagane przed deployem wg dispatchu — do zrobienia w partii 4b).

DEPLOY/PUSH: NIE WYKONANO
