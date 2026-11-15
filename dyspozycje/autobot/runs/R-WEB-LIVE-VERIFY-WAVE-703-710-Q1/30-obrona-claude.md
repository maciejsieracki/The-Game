# R-WEB-LIVE-VERIFY-WAVE-703-710-Q1 — raport Obrony (Operator HAIKU), runda 2 odpowiedzi na zarzuty Evaluatora r1

STATUS: PASS-WITH-NOTES (zarzuty 1, 2, 5 przyjęte i zmierzone ponownie na kodzie origin/main; zarzuty 3, 4 przyjęte jako NIE_ZMIERZONO; zarzut 6 przyjęty jako korekta statusu)
DOMAIN: GAME (weryfikacja w żywym Chromium; kod gry bez zmian, `gra/src` i `gra/data` nietknięte)
TEMAT: R-WEB-LIVE-VERIFY-WAVE-703-710-Q1
GOAL: tabela a–g: ZMIERZONE-PASS / ZMIERZONE-FAIL / NIE_ZMIERZONO z dowodem, na kodzie BAZY origin/main
BAZA (kod gry): 800578f29 (origin/main, zawiera FALĘ 710 = 4ff1bc8cd i FALĘ 708/709 = dce6ad2ab/009dbdd0c; sprawdzone `git merge-base --is-ancestor`)
BAZA (zmiany): zmiany tej rundy (2 skrypty + run dir) są commitem na 800578f29; SHA w sekcji ZMIANY-COMMIT
ODPOWIEDŹ NA ZARZUTY: pierwsza runda (kandydat 01a3e677, baza 296ec6873) pozostaje w historii; wyniki r1 NIE są podstawą tej tabeli.

## Odpowiedzi na zarzuty Evaluatora (91ffc588, 20-evaluator-claude.md)

| Zarzut | Decyzja | Dowód / uzasadnienie |
|---|---|---|
| 1 (KRYTYCZNY) baza 296ec6873 bez FAL 708–710 | PRZYJMUJĘ | Przeniesiono skrypty na origin/main 800578f29 i ponownie zmierzono e, d, a. Wiersz e z r1 (ZMIERZONE-FAIL na starej bazie) zastąpiony pomiarem na main. Ponowna weryfikacja ancestry: 4ff1bc8cd, 3ac817678, 009dbdd0c, dce6ad2ab są przodkami origin/main. |
| 2 (d) ZMIERZONE-FAIL bez DOM | PRZYJMUJĘ | Zmierzono DOM Civpedii na main (sekcja d). Poprzedni ZMIERZONE-FAIL WYCOFANY: był oparty na bundle z bazy bez FALI 709. |
| 3 (a) NIE_ZMIERZONO „nie zrobiono” | PRZYJMUJĘ jako lukę | Pomiar karty Wojownika w trzech miejscach NIE został wykonany w tej rundzie (brak ścieżki hooka do karty). Status: NIE_ZMIERZONO. To jest otwarta luka, nie PASS. |
| 4 (f) brak blokującej propozycji, modal nieustalony | PRZYJMUJĘ jako lukę | Nie wywołano blokującej propozycji (brak hooka w tej rundzie). Modal „Audiencja dyplomatyczna” był obecny już przed jakąkolwiek akcją (`baselineModal=true` w result-seed11.json), źródła nie ustalono. Status: NIE_ZMIERZONO. |
| 5 (g) PASS słabo dyskryminujący, pusta kolejka | PRZYJMUJĘ | Kolejki produkcji nie ustawiono (toast „Kolejka pusta”). Brak dowodu mutacyjnego. Status g: ZMIERZONE-PASS z zastrzeżeniem (patrz sekcja g). |
| 6 (c) PASS mimo niewykonanych szerokości kolumn | PRZYJMUJĘ | Szerokości 106/119/186 px NIE zostały zmierzone. Status c zmieniony na PASS-CZĘŚCIOWY (dopasowanie bloku zmierzone; szerokości kolumn NIE_ZMIERZONO). |
| Mniejsze: brak zrzutu kroku potwierdzenia (b) | PRZYJMUJĘ i NAPRAWIAM | Dodano zrzut kroku potwierdzenia do `live-verify-administrator-panel.cjs` i wykonano go na main (`evidence/r2-main/admin/07-*.png`, obejrzany). |
| Mniejsze: nazwa pliku wyniku ręczna | PRZYJMUJĘ (informacyjnie) | Wynik e zapisywany jest jako `result-seed11.json` przez skrypt (bez zmiany nazwy). |
| Mniejsze: 41 właścicieli AI vs „major” | PRZYJMUJĘ i NAPRAWIAM | Skrypt zapisuje teraz `civ`, `cityState` dla każdego właściciela; w wyniku są osobno `negatives` (wszyscy AI) i `negativesMajor` (bez city-states). |

## Tabela wyników (baza origin/main 800578f29, seed 11, mapa Maly)

| Pkt | Fala | Wynik | Dowód | Co dokładnie zmierzono |
|---|---|---|---|---|
| a | 708 | NIE_ZMIERZONO | brak | Karta Wojownika w 3 miejscach nie zmierzona w tej rundzie (brak hooka). Luka otwarta. |
| b | 703 | ZMIERZONE-PASS | `live-verify-administrator-panel.cjs` na main: `LIVE OK`; zrzut `evidence/r2-main/admin/07-potwierdzenie-zwolnienia-zwolnij-anuluj.png` (obejrzany) | Zwolnij → okno „Zwolnić administratora…? Koszt zatrudnienia nie podlega zwrotowi” z przyciskami Zwolnij / Anuluj (zrzut). Anuluj wraca, Esc zamyka bez zwolnienia, Zwolnij zwalnia (asercje DOM). Uwaga redakcyjna: nagłówek panelu „Administrator państwa”, a tekst okna mówi „administratora ulepszeń w mieście Rzym” (niespójność tekstu, do UWAG). |
| c | 707 | PASS-CZĘŚCIOWY | `siege-panel-machines-block-fit-test.cjs <main-dist>` exit 0, `verdict: PASS` (6 konfiguracji 1280×800 i 1366×768 × 1/2/4 typy); zrzuty `evidence/r2-main/siege/` (obejrzany 1280×800 types4) | Blok machin mieści się w panelu, bez przewijania wewnętrznego; Oblegaj / Szturm / Odwrót widoczne nad banerem. Szerokości kolumn 106/119/186 px: NIE_ZMIERZONO. |
| d | 709 | ZMIERZONE-PASS | `live-verify-wave-703-710-civpedia.cjs` (main), `evidence/r2-main/result-civpedia-seed11.json`, zrzut `civpedia-wypowiedzenie-wojny.png` | Civpedia → Encyklopedia → „wojny” → „Wypowiadanie wojny” (DOM). Brak tekstu „jeszcze niewdrożone / NIE opisuje obecnego stanu” w tym haśle. Obecny tekst: „od 3 do 7 tur”, „Przy Zaufaniu 0 przez N tur (3–7 wg profilu) silniejsza strona wypowiada wojnę. Gracz nigdy automatycznie.” i wartość bazowa 6. |
| e | 710 | ZMIERZONE-FAIL | `evidence/r2-main/result-seed11.json` (10 realnych tur, bez grantów, pageerror pusty) | Ujemny skarbiec AI w T2 (po turze 1): 6 właścicieli (`negatives` w JSON), skarbiec −1 u wszystkich; 2 MAJOR: hetyci (oid 1, spichlerz 0) i chińczycy (oid 22, spichlerz 0); 4 city-states: asyria (oid 8, spichlerz 3), celtowie (oid 15, spichlerz 3), sumer (oid 18, spichlerz 2), chińczycy-miasto-państwo (oid 23, spichlerz 3). T3–T10: brak ujemnych. Kod (main): `gra/src/game/no-negative-stocks.ts:350` `NNS_AI_BALANCE_TURN_MIN = 1`; bankowanie `gra/src/main.ts:40593` `aiSkarbiecByOwner.set(oid, aiSkarb)`. |
| f | 705 | NIE_ZMIERZONO | DOM z `result-seed11.json` (`diploCounterDom`: Dyplomacja 0 / Ważne 0 / Inne 0 przy T11) | Nie wywołano blokującej propozycji. Licznik zakładek odczytany (0/0/0), lista i mirror karty nie testowane. Modal „Audiencja dyplomatyczna” obecny przed akcjami (`baselineModal=true`). |
| g | 706 | ZMIERZONE-PASS z zastrzeżeniem | `result-seed11.json` (`gate`, `turnAfterClick`), `gate-zakoncz-ture-deficyt.png`, `gate-po-kliknieciu.png` | Bramka zablokowana po 2 krokach (spawn + disband gracza). DOM: „Nie można zakończyć tury: Spichlerz państwa (żywność): po turze zabraknie 3. Pomogą: podatek złota…”. Brak „kolejki produkcji” w komunikacie, w `title` przycisku (pusty) i w hoverze (pusty). Klik nie kończy tury (11→11). ZASTRZEŻENIE: kolejka produkcji była pusta; brak dowodu mutacyjnego (NIE_ZMIERZONO). |

## Testy bramek (kod origin/main 800578f29, surowe wyjście)

- `node ./node_modules/typescript/bin/tsc --noEmit` — exit 0 (TSC_EXIT=0).
- `node tools/logic-test.cjs` — exit 0, `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs` — exit 0, `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs` — exit 0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs` — exit 0, 21 linii `[OK]`.
- `node tools/combat-test.cjs` — exit 0, `COMBAT TEST: 6/6 pass`.
- Build: `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/lv-dist-main --emptyOutDir` — OK (17,2 s), poza repo; `npm ci --ignore-scripts` w gra/.
- `git diff --check` — czysty.

## Zmiany (allowlista)

1. `gra/tools/live-verify-administrator-panel.cjs` — dodany zrzut kroku potwierdzenia (`07-potwierdzenie-zwolnienia-zwolnij-anuluj.png`).
2. `gra/tools/live-verify-wave-703-710-Q1.cjs` — zapis `civ` / `cityState`; `negativesMajor`; `aiMajorCount`.
3. `gra/tools/live-verify-wave-703-710-civpedia.cjs` — nowy skrypt pomiaru (d) w DOM Civpedii.
4. `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-703-710-Q1/30-obrona-claude.md` (ten raport) i `evidence/r2-main/**` (PNG ≤600 KB, JSON).

Brak zmian w `gra/src`, `gra/data`, `WERSJE.md`, `gra-robocza/`, `rust-port/`. Brak `git add -A`.

## BLOKADY / DECYZJE DLA ORKIESTRATORA

- (e) to realny ZMIERZONE-FAIL na main: ujemny skarbiec u 2 major AI w T2 (hetyci, chińczycy). Rozstrzygnięcie: decyzja #375 (2026-11-14) mówi „AI od tury 1 tak” — ujemny stan w T2 wygląda na defekt, nie na zamierzony deficyt. Proponowany temat R-WEB-* (orkiestrator decyduje; nie naprawiano w tej rundzie).
- (a), (f) — NIE_ZMIERZONO (luki otwarte; potrzebna osobna runda z hakami).
- (g) — mutacja pomiarowa wymaga ustawienia niepustej kolejki produkcji (osobna ścieżka UI lub hak).
- (c) — szerokości kolumn 106/119/186 px do zmierzenia osobno.

## UWAGI-DLA-ORKIESTRATORA

- Tekst okna potwierdzenia zwolnienia: „administratora ulepszeń” przy nagłówku „Administrator państwa” (zrzut 07) — niespójność tekstu.
- W bundle Civpedii (`gra/src/data/wikiBundle.json`) w haśle „Model relacji” nadal występuje nagłówek „jeszcze niewdrożone — nie obecny stan gry” (pierwsze trafienie: wpis zasad Zaufania, opisany jako wdrożony). Nie dotyczy hasła „Wypowiadanie wojny”, ale warto sprawdzić przy regeneracji.
- W zrzucie T1 (civpedia run) DOM pokazuje „1 WYMAGA DECYZJI / BLOKUJĄ ZAKOŃCZENIE TURY — 1 karta wymaga decyzji” przy „Kolejka pusta”; to karta produkcji, nie dyplomacja. Nie mylić z punktem f.
- Dispatch `00-dispatch.md` istnieje tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie w origin/main (zgodnie z uwagą Evaluatora).
- Nie wykonano spawn_task / create_session / create_trigger / send_later / run_in_background.
- Pomiary (e) i (d) są ponowione na main; runda 1 (01a3e677) pozostaje w historii i nie jest źródłem wyników.

RUNDY: 2/5 (odpowiedź Obrony na zarzuty r1)
NASTĘPNY KROK: Evaluator r2 (SONNET) weryfikuje powtórzone pomiary (e, d, b, c) na 800578f29 i uczciwość statusów a, f, g; Final Control (SONNET) po PASS; brak integracji w tym kroku.
DEPLOY/PUSH: NIE WYKONANO
