# R-WEB-LIVE-VERIFY-WAVE-650-664-Q1 — obrona Operatora (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-650-664-Q1
GOAL: odpowiedzieć na zarzuty Evaluatora (`20-evaluator-claude.md`, report_sha d105527665f3358a7e3cc83c48eb8b921bf162db): każdy zarzut PRZYJĘTY (poprawka + dowód + commit) albo ODRZUCONY (dowód). Bez zmian w `gra/src/**`.
BAZA: kandydat 44c47027b (detach). Pomiary rundy 2 wykonane na `origin/main` = b4853c8e6 (zawiera FALĘ 663 i FALĘ 664), patrz zarzut 1.
ZMIANY-COMMIT: nowy skrypt `gra/tools/live-verify-wave-650-664-save-r2.cjs` (allowlista: `gra/tools/live-verify-wave-650-664-*.cjs`), dowody `evidence/save-r2/` i `evidence/save-mutant/` (allowlista: `evidence/`), ten raport. Zero zmian w `gra/src/**`, JSON, WERSJE.md, rust-port. SHA commita: patrz pole SHA w odpowiedzi orkiestratora.

## Stan bazy (zweryfikowane)

- `origin/main` = b4853c8e6 (ROBOCZA 731dcdc1, FALA 664). `git merge-base --is-ancestor 619e1e48e origin/main` → exit 0 (FALA 664 JEST w origin/main).
- Zarzut 1 Evaluatora opierał się na ef27be007 (baza dispatchu). Baza się przesunęła po jego rundzie.
- Kandydat 44c47027b NIE zmienia `gra/src` (zarzut Evaluatora o allowliście pozostaje prawdziwy). Pomiary rundy 2 powstały więc na kodzie b4853c8e6, nie na ef27be007. Trzeba to uwzględnić przy porównywaniu z rundą 1.

## Odpowiedzi na zarzuty

| Zarzut | Decyzja | Dowód / co zrobiono |
|---|---|---|
| 1. Punkt 4 (W32) niezmierzony, FALA 664 nie w bazie | **PRZYJĘTY częściowo** | FALA 664 jest w origin/main (patrz wyżej). Logika W32 na b4853c8e6: `node tools/fortifications-queue-cleanup-test.cjs` → `WYNIK: 10 OK, 0 FAIL`, exit 0 (Q1–Q8 logika, Q9 wpięcie w restoreGameFromSave, Q10 treść komunikatu). **Live komunikat po wczytaniu starego zapisu NIE zmierzony** (wymaga fixtury zapisu ze stanem kolejki `[palisada, mury_kamienne, mury]`). Pozostaje NIE_ZMIERZONO, patrz BLOKADY. |
| 2. Ctrl+S i szybki zapis tylko; menu pauzy i autozapis niezmierzone | **PRZYJĘTY** (zmierzone w rundzie 2) | Nowy skrypt `live-verify-wave-650-664-save-r2.cjs`, ostatni czysty przebieg: **11 PASS / 0 FAIL, exit 0, 206 s** (`evidence/save-r2/live-result-r2.json`). B2a: menu pauzy „Zapisz grę” w bitwie → zero zapisów (`writes 0`). B2b: komunikat widoczny (display block, rect 608,841 223×35, opacity 1, visibility visible, z 10030, w viewport). B3a: autozapis rotacyjny w bitwie → zero zapisów. B3b: konsola `[Autosave] pomijam -- bitwa na ekranie, tura=1`. **Uwaga:** Esc w bitwie tylko ZAMYKA menu pauzy (`main.ts` obsługa Escape, `isGamePauseMenuOpen → hideGamePauseMenu`); otwarcie idzie przez przycisk paska (`onOpenMenu → toggleGamePauseMenu`, `main.ts:26881`). Skrypt otwiera menu hakiem testowym `openPauseMenuForTest` (wywołuje ten sam `toggleGamePauseMenu`), a NIE kliknięciem przycisku paska. Autozapis wywołany hakiem `rotatingAutosaveForTest` (`doRotatingAutosave`), a nie przez koniec tury. |
| 3. Trzy pageerror „Unexpected token '<'” w live-result.json, nieodnotowane | **PRZYJĘTY (przyczyna i naprawa)** | Przyczyna: stary harness (`battle-save-disabled-live-test.cjs`) serwował `index.html` na KAŻDY adres (`fs.createReadStream(indexPath)` dla każdego żądania). Pakiety dźwięku `audio-pack-1/2/3.js` są ładowane przez `<script src>` (`vite.config.ts:122`). Przeglądarka wykonuje HTML jako klasyczny skrypt → `SyntaxError: Unexpected token '<'`. Liczba zgadza się z liczbą pakietów (3). Mechanizm to wnioskowanie z kodu, NIE odtworzone na starym harnessie w tej rundzie. Naprawa: nowy serwer statyczny (poprawne MIME, 404 dla brakujących, zero fallbacku na index.html). Wynik: **C1 PASS (0 pageerror, 0 console.error), C2 PASS (0 anomalii 404/HTML)**. Zrzut ekranu konsoli nie był potrzebny. Jedyne 404 w pierwszym przebiegu to `/favicon.ico`; serwer odpowiada na nie 204 i jest to opisane w skrypcie. |
| 4. Check 3b ma ok:true przy display none (asercja słaba) | **PRZYJĘTY** | Stara 3b sprawdzała „komunikat był pokazany kiedyś” (wpis w `__toastLog`), a `toastDiag` brano 3 s później, gdy toast był już ukryty (display none). Nowa asercja: **B1b** = pokazanie po Ctrl+S z obserwatora DOM (`__toastLog`, display:block + tekst), znaczniki czasu 2802 / 2898 / 4328 / 5860 / 7275 ms; **B1c** = PASS w tym samym przebiegu: `firstVisible` tMs 1413, display block, rect [608,841,223,35], opacity 1, visibility visible, z 10030, inViewport true; zrzut `evidence/save-r2/B1-ctrl-s-w-bitwie-toast-widoczny.png`. Próbkowanie widoczności jest wolne pod swiftshader (czasem tylko 2 próbki), więc B1c bywa INFO, nie PASS (w czystym przebiegu PASS). Zrzut B1 pochodzi z tego samego skryptu. |
| 5. Punkt 2 (szturm, W18) zaliczony tylko komponentowo, nie pełna gra | **PRZYJĘTY (zakres nie domknięty)** | Nie zrobiono pełnej gry (zbudowanie oblężenia przez rozgrywkę na prawdziwym mieście). Stan: nadal wyłącznie `siege-storm-needs-machines-test.cjs` 33 PASS (runda 1). Patrz BLOKADY. |
| 6. Punkt 3 (W24) syntetyczne zestawy liczb, brak zrzutów punktu 3 | **PRZYJĘTY częściowo** | Uruchomiony prawdziwy test renderu HUD: `hud-topbar-bigger-numbers-real-render-test.cjs` z `HUD_BASE` = `git show 4905bac05:gra/src/ui/hud.ts` (plik tymczasowy `gra/src/ui/hud.__base.ts`, usunięty po teście): **`PASS: hud-topbar-bigger-numbers-real-render-test (62 ok, 0 fail)`, exit 0**. Dodatkowa NOTATKA z testu (nie FAIL): przy 1024 px „cel dispatchu puste boki <= 12 px: NIEOSIAGNIETY (max 12: 28 px, max 2,3M: 11 px)”; przy 640 px OSIAGNIETY (11 / 6 px). Asercja progu 30 px przechodzi (28,3 px). Stan miasta w grze nadal syntetyczny (lewy baner: 74 PASS na widoku miasta w rundzie 1). Zrzutów pikselowo nie oglądano. |
| 7. Brak dowodu mutacyjnego dla live punktów 1 i 5 | **PRZYJĘTY częściowo** | Mutacja dla punktu 1 (bramka zapisu w bitwie): `battle-save-disabled-live-test.cjs --mutant` → **exit 1**; FAIL 3a (`ret true`, `writes 3`, klucze `idb.put:kv:thegame.save.autosave`), FAIL 3c (`writes 3`), FAIL 3b (`toastInBattle false`); PASS 1, 2, 5, 5b, 6. Test wykrywa wyłączenie bramki. Mutacji dla punktów 2, 3, 5 NIE wykonano → NIE_ZMIERZONO. |
| 8. Brak nowych skryptów live `gra/tools/live-verify-wave-650-664-*.cjs` | **PRZYJĘTY częściowo** | Dodano `gra/tools/live-verify-wave-650-664-save-r2.cjs` (punkty 1 i autozapis / menu pauzy). Punktów 2, 3 (pełna gra, realne miasto) i 5 nadal brak nowego skryptu live. |

## Wyniki rundy 2 (surowe, z przebiegów)

1. `live-verify-wave-650-664-save-r2.cjs` (b4853c8e6, czysty przebieg, `evidence/save-r2/live-result-r2.json`): `Wynik: 11 PASS / 0 FAIL / czas 206 s`, exit 0. Linie PASS: A baseline (writes 2), bitwa otwarta, B1a (writes 0), B1b (showsMs 2802, 2898, 4328, 5860, 7275), B1c (visible, inViewport), B2a (writes 0), B2b (visibleCount 1), B3a (writes 0), B3b (autoWarn pomijam), C1 (count 0), C2 (count 0). INFO: B2 stan menu pauzy (pauseOpen true, pauseButtonsFound 1).
2. `battle-save-disabled-live-test.cjs --mutant` (b4853c8e6, bundle mutant sha256 5e5a04927fa8b5b5d55a21b4cd23318eeea9254a424e29de886da3a7e13aa6f1): exit 1; FAIL 3a, 3b, 3c; PASS 1, 2, 5, 5b, 6. Wynik z konsoli zapisany w tym raporcie (plik JSON nie został wygenerowany przy zmiennej `CIV_SAVE_TEST_EVIDENCE` na scratchpad).
3. `hud-topbar-bigger-numbers-real-render-test.cjs` z HUD_BASE (4905bac05): `PASS (62 ok, 0 fail)`, exit 0.
4. `fortifications-queue-cleanup-test.cjs` (b4853c8e6): `WYNIK: 10 OK, 0 FAIL`, exit 0.

Ślad diagnostyczny (nie jest dowodem PASS): w przebiegach przejściowych obserwator DOM nie był dołączony w skrypcie pomiarowym (błąd własny skryptu, poprawiony przed przebiegiem czystym). Rejestr „Zapis niedostępny” w tych przebiegach był pusty z tego powodu, a nie dlatego, że komunikat nie wystąpił.

## Obserwacje do decyzji orkiestratora (NOTE, nie FAIL)

- Komunikat zapisu w bitwie pokazuje się więcej niż raz po jednym Ctrl+S (5 zdarzeń pokazania w czystym przebiegu). Nie wpływa na zapis (writes 0). Zgłaszam jako obserwację kosmetyczną.
- HUD baner przy 1024 px: sub-cel „puste boki <= 12 px” nieosiągnięty (28 px dla 12). Decyzja właściciela, czy to wada.

## BLOKADY

1. Punkt 4 (W32) live: brak fixtury starego zapisu w tej rundzie. Logika zielona (10/10). NIE_ZMIERZONO na żywo. Następny krok: osobny temat z fixturą zapisu (kolejka `[palisada, mury_kamienne, mury]`), na bazie b4853c8e6 lub nowszej.
2. Punkt 2 (W18) w pełnej grze: NIE zrobione (wymaga zbudowania oblężenia przez rozgrywkę na realnym mieście). NIE_ZMIERZONO na poziomie pełnej gry.
3. Punkt 3 (W24) na realnym stanie miasta z dużymi liczbami i zrzuty obejrzane pikselowo: NIE zrobione. Test HUD na historycznym kodzie zielony, ale stan syntetyczny.
4. Punkt 5 (W25, okno potwierdzenia administratora) — bez zmian w tej rundzie (25 PASS z rundy 1). Brak mutacji i brak pełnej gry w rundzie 2.
5. Mutacje dla punktów 2, 3, 5: NIE wykonano.

## RUNDY

2/5 (runda 1: PASS-WITH-NOTES; runda 2: obrona na zarzuty Evaluatora)

## NASTĘPNY KROK

Orkiestrator: (a) przyjąć rundę 2 do ponownej oceny Evaluatora (zarzuty 1–8 mają odpowiedź: przyjęte/odrzucone z dowodem), (b) zdecydować o zakresie punktów 2, 3, 5 (nowy temat z pełną grą) i punktu 4 (fixtura starego zapisu na bazie z FALĄ 664).

## DEPLOY/PUSH

NIE WYKONANO (operator nie integruje, nie deployuje i nie pushuje na main).
