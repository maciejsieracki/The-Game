# R-WEB-LIVE-VERIFY-WAVE-650-664-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-650-664-Q1
GOAL: dowód w żywej grze (Chromium, bundle z vite build) dla pięciu poprawek FAL 650–664 oznaczonych NIE_ZMIERZONO; bez zmian kodu gry.
BAZA: origin/main = ef27be007 (ROBOCZA b7cf61d0, FALA 663). Worktree detach na tym SHA.
ZMIANY-COMMIT: tylko dowody i raport w `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-650-664-Q1/`. Zero zmian w `gra/src/**`, JSON, WERSJE.md, rust-port. Nowe skrypty live nie były potrzebne (użyto istniejących w `gra/tools/`).

## Bundle i środowisko

- `cd gra && npm ci --ignore-scripts` (OK).
- Build: `npx vite build --outDir <scratchpad>/w36-bundle` poza repo (index.html 14 556 307 B, audio-pack-1/2/3 w tym samym katalogu). Bundle używany przez test administratora.
- Test zapisu (punkt 1) buduje własny bundle z hakiem testowym: `build/save/real/index.html`, sha256 `32113e9d731f7b871285a76f70c770f95ab1ed75c70050206f5d2fba262af551`, 14 557 009 B.
- Chromium: `/usr/bin/chromium` (Playwright), headless.

## Tabela wyników

| # | Punkt | Wynik | Dowód |
|---|---|---|---|
| 1 | Zapis zablokowany w bitwie (W27): Ctrl+S i zapis nie zapisują w bitwie, komunikat; po bitwie zapis działa | PASS (8 PASS / 0 FAIL) | `node tools/battle-save-disabled-live-test.cjs` (exit 0, 389 s); evidence/save/ |
| 2 | Szturm bez machin zablokowany (W18): panel oblężenia i menu ataku bez machin, Szturm wyszarzony + komunikat | PASS w zakresie komponentu (33 PASS / 0 FAIL), NIE pełna gra | `node tools/siege-storm-needs-machines-test.cjs --vite http://127.0.0.1:5199`; evidence/siege/ |
| 3 | Lewy baner / pas banerów mieści się przy 1366/1280/1024 px (W24) | PASS (74 PASS / 0 FAIL na widoku miasta; 119 ok / 0 fail dla paneli pod banerem) | `left-banner-overflow-narrow-test.cjs`; `hud-panels-below-banner-test.cjs` |
| 4 | Komunikat czyszczenia kolejki fortyfikacji po wczytaniu starego zapisu (W32) widoczny raz | NIE_ZMIERZONO — BLOKADA (kod nie jest w origin/main) | patrz niżej |
| 5 | Okno potwierdzenia zatrudnienia administratora (W25) w pełnej grze | PASS (25 PASS / 0 FAIL) | `live-verify-administrator-panel.cjs` z ROBOCZA_HTML = bundle z origin/main; evidence/adm/ |

## Szczegóły

### Punkt 1 — zapis w bitwie (PASS)
- Poza bitwą Ctrl+S zapisuje (writes 1, brak toastu).
- Bitwa 28v28 otwarta i uruchomiona przez UI; Ctrl+S w bitwie: `doQuickSave` zwraca false, zero zapisów (IDB/localStorage/FSA), komunikat „Zapis niedostępny w trakcie bitwy” widoczny (toast display=block, z=10030).
- Klawisz Ctrl+S w bitwie: 0 zapisów, toast widoczny.
- Po zakończeniu bitwy (Powrót na mapę) Ctrl+S ponownie zapisuje (writes 2).
- INFO (NIE_ZMIERZONO): przycisk „Zapisz” w menu pauzy nie został znaleziony w DOM przy Esc (`saveBtnCount: 0`). Ścieżka menu pauzy nie była mierzona na żywo; bramka strukturalna w kodzie.

### Punkt 2 — szturm bez machin (PASS, zakres komponentu)
- Test wykonuje prawdziwe moduły `siegeMapPanel.ts`, `cityAttackChoice.ts`, `siege-engine-build.ts` serwowane przez Vite dev (127.0.0.1:5199), na syntetycznym mieście obwarowanym (maMur, oblegane).
- Wyniki LIVE: start bez technologii = zero machin, Szturm disabled + „Potrzebne machiny oblężnicze — pozostaje oblężenie”, klik nie odpala szturmu; z Obróbką drewna = tylko Taran; z Brązownictwem = 3 machiny; z machiną Szturm aktywny; menu ataku: klik i klawisz 2 nie odpalają przy blokadzie.
- Mutacje (brak filtra techu, brak bramki) dają czerwień zgodnie z oczekiwaniem.
- NIE_ZMIERZONO: pełny przebieg w grze (zbudowanie oblężenia przez grę na prawdziwym mieście). Punkt zaliczony tylko na poziomie komponentu na żywym Vite.

### Punkt 3 — baner w oknie (PASS, z zastrzeżeniem)
- `left-banner-overflow-narrow-test.cjs`: widok miasta w 2000/1366/1280/1024 px; 1366: L 14..639, R 878..1352 (okno 1366); 1280: L 13..589, R 829..1267; 1024: L 12..443, R 683..1012. Brak nakładania, brak poziomego scrolla, panele pod banerem.
- `hud-panels-below-banner-test.cjs` (Chromium, prawdziwy showHud + arkusz paneli): 1920/1366/1024/640 px, zestawy liczb 12 345 + 1 234, 123 456 + 12 345, deficyt; 119 ok / 0 fail.
- Zastrzeżenie: liczby to syntetyczne zestawy w testach, a nie stan realnego miasta z gry. Test `hud-topbar-bigger-numbers-real-render-test.cjs` nie został uruchomiony: wymaga kopii bazy `hud.ts` z commita 4905bac05 (`HUD_BASE`), a tego nie przygotowano w tej rundzie.

### Punkt 4 — komunikat kolejki fortyfikacji (NIE_ZMIERZONO, BLOKADA)
- Kod W32 (`R-WEB-FORTIFICATIONS-OLD-SAVE-QUEUE-CLEANUP-Q1`, commity 7a1332db1..1aa181709, merge FALA 664 = 619e1e48e) NIE jest przodkiem origin/main (`git merge-base --is-ancestor 619e1e48e origin/main` → NIE). origin/main ma HEAD FALA 663 (ef27be007).
- Na bazie origin/main nie ma żadnego komunikatu czyszczenia kolejki fortyfikacji. Komentarz przy `collapseFortificationChain` w `gra/src/main.ts` (≈47019) mówi „cicho, bez zwrotu” — czyli bez komunikatu.
- Wniosek dla orkiestratora: punkt 4 można zmierzyć dopiero na bazie zawierającej FALĘ 664 (619e1e48e). Na origin/main oczekiwanego komunikatu nie ma z definicji. Nie zmieniałem bazy samodzielnie (dispatch: BAZA = origin/main).

### Punkt 5 — okno potwierdzenia administratora (PASS)
- Na bundle z origin/main (14 556 307 B index.html):
  - bez administratora: kontrolki państwa i „Własne ustawienia” disabled, adnotacja „Wymaga administratora ulepszeń”, wymuszony klik nie zmienia polityki ani override;
  - panel wyboru: koszt 40, utrzymanie 2, bonusy, „Brakuje 30” przy 10 w skarbcu, Zatrudnij nieaktywne;
  - z 500 w skarbcu: Zatrudnij → okno potwierdzenia z kosztem i bonusami; Anuluj nic nie zmienia (skarbiec bez zmian, niezatrudniony); potwierdzenie zatrudnia (skarbiec −40);
  - Zwolnij: odmowa w oknie zostawia administratora; potwierdzenie zwalnia; zapisane ustawienia profilu nie są kasowane;
  - administrator miasta: panel z bonusami %, okno z kosztem i „korupcja”, Anuluj/Zatrudnij zgodne z oczekiwaniem;
  - brak błędów konsoli i pageerror.

## Blokady

1. Punkt 4 (W32) — kod FALA 664 nie jest w origin/main. Wymagana decyzja orkiestratora: czy punkt 4 ma być mierzony po integracji FALA 664 (osobna runda na bazie z 619e1e48e), czy zamknięty jako „nie dotyczy bazy”.
2. Punkty 2 i 3 — zaliczone na poziomie komponentu / syntetycznych zestawów liczb, nie na realnym stanie gry. Pełny przebieg w grze nie był w zakresie tej rundy.
3. Menu pauzy „Zapisz” (punkt 1) — nieobecne w DOM przy Esc, nie zmierzone.

## Pliki dowodowe

- `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-650-664-Q1/evidence/adm/` — 6 zrzutów (panel administratora, bez/z administratorem, miasto).
- `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-650-664-Q1/evidence/save/` — 4 zrzuty z bitwy (`in-battle-ctrl-s-blocked.png`, `in-battle-ctrl-s-toast.png`, `after-pause-attempt.png`, `after-battle-map.png`) i `live-result.json`.
- `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-650-664-Q1/evidence/siege/` — 4 zrzuty (start bez machin, po Obróbce drewna, po Brązownictwie, menu ataku zablokowane).

## Komendy i liczby z surowego wyjścia

- `node tools/battle-save-disabled-live-test.cjs` → `Wynik: 8 PASS / 0 FAIL / czas 389 s`, exit 0.
- `ROBOCZA_HTML=<bundle>/index.html EVID_DIR=<dir> node tools/live-verify-administrator-panel.cjs` → 25 × PASS, `LIVE OK`, exit 0.
- `node tools/siege-storm-needs-machines-test.cjs --vite http://127.0.0.1:5199 --shots <dir>` → `33 PASS / 0 FAIL`, exit 0.
- `node tools/left-banner-overflow-narrow-test.cjs --shots <dir>` → `WYNIK (after): PASS=74 FAIL=0`, exit 0.
- `node tools/hud-panels-below-banner-test.cjs --shots <dir> --prefix po` → `PASS: hud-panels-below-banner-test (119 ok, 0 fail)`, exit 0.
- `node tools/hud-topbar-bigger-numbers-real-render-test.cjs` → nie uruchomiono poprawnie (brak `hud.__base.ts`, wymaga bazy 4905bac05); wynik pominięty.

## RUNDY

1/5

## NASTĘPNY KROK

Orkiestrator decyduje o punkcie 4: rerun na bazie z FALĄ 664 (619e1e48e) albo zamknięcie jako nie dotyczące origin/main. Punkty 1, 2, 3, 5 są zamknięte na bazie ef27be007; pełna gra dla punktu 2 i realny stan miasta dla punktu 3 — opcjonalne dalsze tematy.

## DEPLOY/PUSH

NIE WYKONANO (operator nie integruje, nie deployuje i nie pushuje na main).
