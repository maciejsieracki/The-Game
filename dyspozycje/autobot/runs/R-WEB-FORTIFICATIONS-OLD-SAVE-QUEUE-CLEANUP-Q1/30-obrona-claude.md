STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FORTIFICATIONS-OLD-SAVE-QUEUE-CLEANUP-Q1
GOAL: przy wczytaniu starego zapisu czyścić z KOLEJKI produkcji niższe etapy łańcucha fortyfikacji (Palisada -> Mury kamienne -> Mury ceglane), gdy w kolejce lub w mieście jest wyższy etap (zostaje najwyższy); jednorazowy komunikat o usunięciu. Bez zwrotu kosztów (decyzja właściciela z W20). Koszty, bonusy i reguły łańcucha bez zmian.
ZMIANY-COMMIT: baza origin/main = 44af89169; kandydat Operatora 7a1332db1; poprawki Obrony (runda 2) = 11fae9488 (kod + testy); raport = commit, którego SHA jest HEAD gałęzi detached po tym pliku.
  Allowlista (bez zmian względem rundy 1): gra/src/game/production.ts, gra/src/main.ts, gra/tools/fortifications-queue-cleanup-test.cjs, dyspozycje/.../R-WEB-FORTIFICATIONS-OLD-SAVE-QUEUE-CLEANUP-Q1/**. Poza allowlistą: nic (usunięto untracked gra/tools/_fort-chain-shots/ — artefakt zrzutów z uruchomienia fortifications-upgrade-chain-ui-test, nie commitowany).
  Zmiany rundy 2:
  - production.ts: nowa funkcja `collapseFortificationQueuesInCities(cityProd, cityBuilt, buildings): number` — pętla po miastach przeniesiona z main.ts; podmienia wpisy cityProd tylko gdy coś usunięto, zwraca łączną liczbę usuniętych pozycji.
  - main.ts: import zmieniony na collapseFortificationQueuesInCities; w restoreGameFromSave jedno przypisanie `fortQueueCleanupNotice = collapseFortificationQueuesInCities(cityProd, cityBuilt, data.buildings);`; deklaracja `let fortQueueCleanupNotice = 0;` przeniesiona z tuż przed loadGameFromSlot do boot() obok `const cityProd` (ok. linii 3471).
  - Tekst komunikatu: „... Koszt i postęp nie zostały zwrócone." (było: „Koszt nie został zwrócony.").
  - tools/fortifications-queue-cleanup-test.cjs: Q6-Q8 testują zachowanie pętli po miastach (licznik 3, podmiana wpisów, brak usunięć = ta sama referencja); Q9-Q10 statyczne wpięcie (jedna linia przypisania, tekst komunikatu).
TESTY:
  Bramki techniczne (gra/, surowe wyjście):
  - `npx tsc --noEmit`: exit 0, bez wyjścia.
  - `node tools/fortifications-queue-cleanup-test.cjs`: WYNIK: 10 OK, 0 FAIL (exit 0). Wcześniej 7 OK (runda 1).
  - Mutacja 1 (zmiana nazwy zmiennej w main.ts na fortQueueCleanupNoticeX, przypisanie w restoreGameFromSave): WYNIK: 9 OK, 1 FAIL — Q9 czerwone. Plik przywrócony z kopii, test ponownie 10/0.
  - Mutacja 2 (usunięcie `cityProd.set(cid, cleaned.prod)` w helperze): WYNIK: 9 OK, 1 FAIL — czerwone. Przywrócone, test ponownie 10/0.
  - `node tools/fortifications-stack-repro-test.cjs`: WYNIK: 49 OK, 0 FAIL.
  - `node tools/fortifications-upgrade-chain-ai-test.cjs`: WYNIK: 13 OK, 0 FAIL.
  - `node tools/fortifications-upgrade-chain-ui-test.cjs`: 15 passed, 0 failed.
  - Bramki referencyjne (R-PROC-AUTOBOT §6, wartości rzeczywiste; tabela w dokumencie jest nieaktualna):
    - logic-test: LOGIC OK (213/213), exit 0 (tabela: 213/213).
    - tech-tree-test: `tech-tree-test: 20 pass, 0 fail` (tabela: 19/19 — dług dokumentacyjny, nie regresja; dokumentu nie zmieniam w tym temacie).
    - research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33 (tabela: 33/33).
    - unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, 21 linii [OK], 0 [FAIL] (tabela: 13/13 — dług dokumentacyjny).
    - combat-test: `COMBAT TEST: 6/6 pass`, exit 0 (tabela: 6/6).
  - `git diff --check`: czysto.
  Dowód behawioralny wpięcia: pętla po miastach (cały kod, który był dotąd tylko regexem) jest teraz testowana przez wywołanie funkcji na mapach cityProd/cityBuilt (Q6-Q8). Wpięcie w main.ts pozostaje sprawdzane regexem (Q9), ale mutacja nazwy zmiennej już je czerwieni.
  NIE_ZMIERZONO: test w Chromium (Vite HTTP, wczytanie zapisu z kolejką Palisada+Mur kamienny+Mur ceglany, widoczność komunikatu raz). Nie uruchamiano w tej rundzie; kontrakt „komunikat widoczny raz" opiera się na kodzie i testach jednostkowych/statycznych.
BLOKADY: brak blokad technicznych. Decyzje dla orkiestratora/FC (nie rozstrzygane tu): patrz „Odpowiedzi na zarzuty".
RUNDY: 2/5 (runda Obrony po werdykcie Evaluatora PASS-WITH-NOTES; runda Operatora 1/5).
NASTĘPNY KROK: Final Control (Sonnet) — weryfikacja kodu 11fae9488 + raportu; ewentualny live test w Chromium (NIE_ZMIERZONO) zależnie od decyzji orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora

Zarzut 1 (testy wpięcia tylko regexem; mutacja nazwy zmiennej nie czerwieni): PRZYJMUJĘ.
  Poprawka: petla po miastach wydzielona do funkcji pure `collapseFortificationQueuesInCities` (production.ts), testy Q6-Q8 sprawdzają zachowanie. main.ts ma jedno przypisanie, które regex Q9 sprawdza. Dowód: mutacja nazwy zmiennej -> 9 OK / 1 FAIL; mutacja zapisu w helperze -> 9 OK / 1 FAIL (oba przywrócone, test 10/0). Live Chromium nadal NIE_ZMIERZONO (zarzut w tej części zostaje otwarty jako dług weryfikacji).

Zarzut 2 (strata zbankowanego postępu bez zwrotu do puli Pracy): CZĘŚCIOWO PRZYJMUJĘ, CZĘŚCIOWO ODRZUCAM.
  PRZYJMUJĘ tekst: komunikat mówi teraz „Koszt i postęp nie zostały zwrócone", więc gracz wie o obu stratach.
  ODRZUCAM dodanie zwrotu do puli Pracy: dowód production.ts:1640 — w zwykłej grze `filterQueue().forfeitedPostep` trafia do `refundedPraca` TYLKO gdy front jest jednostką legacy (`frontIsLegacyUnit`); dla budynków postęp frontu przepada także w normalnej grze (production.ts:1847: `forfeitedPostep = prod.postep` przy usunięciu frontu). Czyszczenie przy wczytaniu zachowuje to samo zachowanie; zmiana byłaby zmianą reguły poza zakresem tematu. Do rozstrzygnięcia przez FC/właściciela, czy to ma być osobny temat (ASSUMPTION: brak zmiany w tym temacie).

Zarzut 3 (TDZ: `fortQueueCleanupNotice` deklarowane w boot() późno, używane w restoreGameFromSave i hookach testowych): PRZYJMUJĘ jako wzmocnienie.
  Deklaracja przeniesiona do boot() obok `const cityProd` (ok. main.ts:3471), czyli przed wszystkimi funkcjami restore/load i hookami (hooki w ok. 27883+ są definiowane po tej linii). Ryzyko TDZ zostaje wyeliminowane dla każdej ścieżki wywołania po deklaracji.

Zarzut 4 (drugie wczytanie tego samego starego pliku pokaże komunikat ponownie): ODRZUCAM jako zmianę; to zamierzone założenie z rundy 1.
  Dowód: zapis na dysku nie jest modyfikowany (kontrakt: format zapisu poza zakresem, tylko migracja przy wczytaniu), a po zapisie gry kolejka jest już czysta, więc kolejne wczytania NOWEGO zapisu nie pokazują komunikatu. Trwały znacznik „już pokazano" wymagałby zmiany formatu zapisu albo localStorage — zakazane allowlistą i niezgodne z zasadą stanu trwałego. ASSUMPTION: „jednorazowy" = raz na każde wczytanie starego pliku; do potwierdzenia przez właściciela.

Zarzut 5 (wartości referencyjne w dokumencie bramek rozjechane: tech-tree 19 vs 20, unit-replace 13 vs 21): PRZYJMUJĘ jako dług dokumentacyjny.
  Wartości rzeczywiste (surowe wyjście, runda 2) są podane w sekcji TESTY. Samego dokumentu R-PROC-AUTOBOT §6 nie zmieniam (poza allowlistą tego tematu); wskazuję do aktualizacji orkiestratorowi.
