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

---

# RUNDA 2/5 — punkt 4 (W32): komunikat czyszczenia kolejki fortyfikacji

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-650-664-Q1 (runda 2, tylko punkt 4 z DODATKU)
GOAL: w żywej grze (Chromium, bundle Vite poza repo) wczytanie starego zapisu z kolejką Palisada + Mury kamienne + Mury ceglane pokazuje komunikat czyszczenia dokładnie raz; w kolejce zostaje najwyższy etap; zrzut obejrzany.
BAZA: kandydat d1a3edc2a (detach) + merge origin/main b4853c8e6 (zawiera FALĘ 664, kod W32) → HEAD = merge commit (SHA w polu sha wyniku). Zero zmian w `gra/src/**`, JSON, WERSJE.md, rust-port.
ZMIANY-COMMIT: nowy skrypt `gra/tools/live-verify-wave-650-664-fort-queue-r2.cjs` i dowody `evidence/fort-queue-r2/` (wszystko w allowliście DODATKU).

## Metoda

- Bundle: vite build poza repo (`CIV_R2_OUT` w scratchpad), plugin Vite TYLKO w kopii bundla dodaje hooki do `__eraTestDebug` (fixture kolejki, odczyt kolejki/cityBuilt, zapis i wczytanie przez ŚCIEŻKI GRY: `persistSaveToSlot` i `loadGameFromSlot` → `restoreGameFromSave` → `collapseFortificationQueuesInCities`). `src/` nietknięte.
- Fixture „starego zapisu”: kolejka miasta gracza `city0` ustawiona na [palisada, mury_kamienne, mury], zapisana przez zwykły zapis gry (F3: zapis NIE sanityzuje kolejki, w pamięci nadal 3 etapy), po czym kolejka w pamięci wyzerowana i zapis wczytany.
- Liczenie komunikatu: obserwator DOM `#civ-hint-toast` (zbocza display:block z tekstem „Usunięto”), liczone od początku sesji.
- Stan miasta przed wczytaniem: cityBuilt = [koszary, spichlerz] (bez fortyfikacji, więc reguła „wyższy etap w mieście” nie zadziałała; sprawdzona jest reguła kolejki).

## Wyniki (surowe, `node tools/live-verify-wave-650-664-fort-queue-r2.cjs`, ostatni przebieg PRAWDZIWEGO kodu)

```
PASS F0 miasto gracza istnieje -- city0
PASS F1 fixture: kolejka w pamieci = [palisada, mury_kamienne, mury]
PASS F2 zapis starego stanu ok
PASS F3 zapis nie sanityzuje kolejki (w pamieci nadal 3 etapy przed wczytaniem)
PASS W1a komunikat czyszczenia pojawil sie DOKLADNIE raz po wczytaniu starego zapisu -- rise 1
PASS W1b tresc: "Usunięto 2 zbędne pozycje z kolejki produkcji (niższe etapy fortyfikacji; najwyższy etap zostaje). Koszt i postęp nie zostały zwrócone."
PASS W1c w kolejce zostaje najwyzszy etap (mury), dwa nizsze usuniete -- ["mury"]
PASS W2 ponowne wczytanie tego samego starego zapisu: dokladnie jedno pojawienie -- rise 1, ["mury"]
PASS W3a zapis po wczytaniu zapisany
PASS W3b wczytanie nowego zapisu: zero komunikatu (kolejka czysta) -- rise 0
PASS W3c kolejka po wczytaniu nowego zapisu = ["mury"]
PASS C1 brak pageerror i console.error -- 0
PASS C2 brak 404 i odpowiedzi HTML -- 0
Wynik: 14 PASS / 0 FAIL / czas 153 s
```

## Mutacja (kopia bundla, repo nietknięte) — test czerwony

- `CIV_MUT=notice` (komunikat wyłączony, collapse działa): `Wynik (MUT=notice): 10 PASS / 4 FAIL` — FAIL W1a (rise 0), W1b (notice null), W1d, W2 (rise 0). Kolejka [mury] nadal PASS (poprawnie: test rozróżnia komunikat od czyszczenia).
- `CIV_MUT=wire` (wpięcie wyłączone, collapse nie wywołany): `Wynik (MUT=wire): 8 PASS / 6 FAIL` — FAIL W1a, W1b, W1c (kolejka 3 etapy), W1d, W2, W3c.
- Dowody: `evidence/fort-queue-r2/fort-queue-r2-result-mut-notice.json`, `...-mut-wire.json`.

## Ocena punktu 4

- Logika (1 komunikat na wczytanie, treść, najwyższy etap zostaje, brak komunikatu po zapisie czystej kolejki, mutacje czerwone): PASS z dowodem.
- Widoczność na ekranie: NIE_ZWERYFIKOWANO w pikselach. Pomiar w przeglądarce (in-page, Date.now):
  - w chwili pokazania komunikatu (rising edge, probe synchroniczny): rect [440, 823, 560, 53], w viewport, `display:block`, `visibility:visible`, `opacity:1`, `z-index:320`, `position:fixed`, tło rgba(8,12,20,0.92), tekst jasny; `pointer-events:none`, więc elementFromPoint zwraca CANVAS i NIE jest to dowód przysłonięcia;
  - komunikat w DOM widoczny ok. 12,4 s (show 1794491772639 → hide 1794491785021 ms); pomiar Node jest tak wolny (swiftshader), że zrzut i odczyt wykonywały się po ~1–12 s.
- Zrzut `evidence/fort-queue-r2/W1-wczytanie-starego-zapisu-komunikat.png` OBEJRZANY: NIE pokazuje komunikatu (ani „Wczytano”), mimo że w DOM komunikat był widoczny. Nie traktuję go jako dowodu widoczności. Przyczyna nieustalona (prawdopodobnie zrzut z nieodświeżonej klatki pod obciążeniem headless; ten sam md5 w kilku przebiegach). Plik zostawiam z tą adnotacją.

## BLOKADY / NOTATKI (do Evaluatora)

1. Widoczność pikselowa komunikatu W32 (i toastów ogólnie na mapie) niezweryfikowana: potrzebny przebieg z trwałym, wolnym od opóźnień zrzutem (np. zrzut wymuszony w przeglądarce po wydłużeniu czasu wyświetlania w KOPII bundla, bez zmiany src) albo inny sposób (CDP screenshot z pauzą timerów). Nie robiłem tego: dispatch zakazuje zmian src, a to wymagałoby nowego, osobnego tematu.
2. Dowód DOM (zbocza) i mutacje są wiarygodne; zrzut nie jest dowodem.
3. Punkty 1, 2, 3, 5 nie powtarzane (PASS w r1).

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja skryptu i mutacji; decyzja orkiestratora, czy punkt 4 zamknąć jako PASS (logika) z notatką o widoczności, czy wymagać osobnego dowodu pikselowego.
RUNDY: 2/5
DEPLOY/PUSH: NIE WYKONANO
