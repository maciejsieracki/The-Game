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


---

# RUNDA 3 — obrona Operatora (odpowiedzi na zarzuty Evaluatora r2, kandydat 56b808134)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-650-664-Q1 (punkt 4 / W32)
GOAL: domknąć punkt 4 (komunikat czyszczenia kolejki widoczny raz, najwyższy etap zostaje, zrzut obejrzany) i odpowiedzieć na każdy zarzut r2.
ZMIANY-COMMIT: `77827ac03` — `gra/tools/live-verify-wave-650-664-fort-queue-r2.cjs` (poprawka skryptu) + `evidence/fort-queue-r2/` (przebiegi ponowne). Zero zmian w `gra/src/**`, JSON, WERSJE.md, rust-port. Ten raport jest w commicie następnym (git add ścieżki, bez -A).
BAZA: 56b808134 (detach). `gra/node_modules` z `npm ci --ignore-scripts` (ignorowane przez git).

## Odpowiedzi na zarzuty

**Zarzut 1 (zrzut nie pokazuje komunikatu; dowód tylko z DOM) — PRZYJMUJĘ.**
- Przyczyna: `waitForFunction` startował dopiero po zwrocie `loadForTest`, a detekcja nastąpiła ok. 12 s po zboczu (r2: rise 1794491772639, detekcja 1794491784754, hide 1794491785021). Zrzut (`shotAtMs` 1794491786016) wykonał się już po ukryciu toasta. W JSON r2 `shotInfo.toastBox` = [0,0,0,0] — toast był ukryty w chwili zrzutu.
- Poprawka: w kopii bundla czas komunikatu czyszczenia 6000 ms → 60000 ms (`CIV_HOLD_MS`, wyłącznie do zrzutu; plugin rzuca wyjątek, gdy wzorzec `zwrócone\`,\s*6000,` nie pasuje). Wartość produkcyjna 6000 ms w `gra/src/main.ts` nie została zmieniona.
- Dowód: nowy `W1-wczytanie-starego-zapisu-komunikat.png` (186 708 B) OBEJRZANY: u dołu środka ekranu widać „Usunięto 2 zbędne pozycje z kolejki produkcji (niższe etapy fortyfikacji; najwyższy etap zostaje). Koszt i postęp nie zostały zwrócone.” Zrzut 1440×900.

**Zarzut 2 (asercja W1d pusta i niestabilna; 13/1 u Evaluatora) — PRZYJMUJĘ.**
- Poprawka 1: W1d sprawdza teraz nie tylko istnienie PNG, lecz także in-page stan toasta ZARAZ PO zrzucie (`visAfter`: `display:block`, tekst zawiera „Usunięto”, szerokość pudełka > 0). Wynik W1d: `visAfter` = {disp: "block", text: true, box: [440,823,560,53], opacity: "1"}.
- Poprawka 2 (niestabilność): przyczyna opisana w zarzucie 1; okno widoczności w kopii to teraz 60 s, więc opóźnienie Node/swiftshader nie trafia w zbocze.
- Poprawka 3: przed W2 i W3 toast jest zerowany osobnym zadaniem. Bez tego przy oknie 60 s komunikat z W1 wisi i obserwator nie widzi nowego zbocza (W2 dawał rise 0). To była wada mojej poprawki 1, wykryta w pierwszym przebiegu r3 (13/1, FAIL W2 `rise:0`, log: scratchpad `run-hold.log`); po zerowaniu przebieg 14/0.
- Powtarzalność: NIE_ZMIERZONO w pełni. Wykonano 2 przebiegi prawdziwego kodu z poprawką: 1× 13/1 (błąd W2 — harness, naprawiony) i 1× 14/0 (359 s). Nie wykonano serii N≥3, więc stabilność na obciążonej maszynie nie jest dowiedziona.

**Zarzut 3 (raport r2 podaje 14/0 bez wzmianki o niestabilności W1d) — PRZYJMUJĘ.**
- Pełna historia przebiegów prawdziwego kodu (surowe wyniki):
  - r2 operator (kandydat d1a3edc2a + merge; skrypt przed poprawką): `Wynik: 14 PASS / 0 FAIL / czas 153 s`.
  - r2 Evaluator (ten sam kod, inne obciążenie): 13 PASS / 1 FAIL (W1d, `shot: null`) / 331 s — potwierdzone zarzutem, przyczyna jak w zarzucie 1.
  - r3 przebieg 1 (po poprawce, przed naprawą W2): `13 PASS / 1 FAIL` (FAIL W2 `rise:0`) — błąd harnessu, nie kodu.
  - r3 przebieg 2 (po naprawie W2): `Wynik: 14 PASS / 0 FAIL / czas 359 s`, exit 0.
- Wniosek: wynik 14/0 jest prawdziwy dla przebiegu 2, ale powtarzalność jest niedowiedziona (patrz zarzut 2).

**Zarzut 4 (widoczność w pikselach: NIE_ZMIERZONO) — PRZYJMUJĘ z zastrzeżeniem.**
- Widoczność w pikselach dla instancji W1 jest teraz zmierzona: zrzut + in-page po zrzucie + obejrzany PNG (patrz zarzut 1).
- Zastrzeżenie 1: pomiar wykonany w kopii bundla z czasem 60 s zamiast 6 s. Styl, z-index (320 w tym przebiegu) i położenie pochodzą z produkcyjnego kodu; zmienia się tylko czas wyświetlania.
- Zastrzeżenie 2: dotyczy scenariusza „bez menu i bez panelu” (z-index 320). Scenariusze z menu/panelem (z-index 600/9950) NIE były mierzone pikselowo.
- Zastrzeżenie 3: `pointer-events:none` nadal daje `elementFromPoint` = CANVAS, więc ten probe nie dowodzi przysłonięcia; przysłonięcie wykluczono wizualnie na zrzucie.
- Wynik pikselowy dotyczy jednego zdarzenia na mapie w jednym układzie okna (1440×900).

**Zarzut 5 (fixture syntetyczna, nie historyczny zapis) — ODRZUCAM jako przeszkodę werdyktu.**
- DODATEK r2 wprost dopuszcza „zbuduj fixturę starego zapisu w teście/JSON”; fixture jest zbudowana hakiem TYLKO w kopii bundla i zapisywana przez prawdziwe `persistSaveToSlot`, a wczytywana przez `loadGameFromSlot → restoreGameFromSave → collapseFortificationQueuesInCities` (F2, F3 PASS: zapis nie sanityzuje kolejki w pamięci).
- Ograniczenie zostaje opisane: to nie jest historyczny plik zapisu sprzed FALI 664 (w zapisie brak pola wersji; w tej rundzie nie zweryfikowano, czy taki artefakt istnieje — NIE_ZMIERZONO).

**Zarzut 6 (kruchość skryptu: dosłowne markery w main.ts) — ODRZUCAM (poza zakresem werdyktu).**
- Skrypt nie testuje po cichu: brak markera rzuca wyjątek (`Nie znaleziono markera __eraTestDebug` / `wpięcia W32`), a test kończy się FAIL, nie PASS. Zmiana kodu wymagałaby aktualizacji skryptu; nie zmieniano tego w tej rundzie.

## Mutacje (ponownie, na nowym skrypcie, `CIV_HOLD_MS=60000`)

- `CIV_MUT=notice` (komunikat wyłączony, collapse działa): `Wynik (MUT=notice): 10 PASS / 4 FAIL / 294 s` — FAIL W1a (rise 0), W1b (notice null), W1d (shot null), W2 (rise 0); PASS W1c (kolejka [mury]). Czerwone zgodnie z oczekiwaniem.
- `CIV_MUT=wire` (wpięcie wyłączone): `Wynik (MUT=wire): 8 PASS / 6 FAIL / 310 s` — FAIL W1a, W1b, W1c (kolejka 3 etapy), W1d, W2, W3c. Czerwone.
- Stare pliki mutacji z r2 zostały nadpisane nowymi przebiegami (brak stale evidence).

## Surowe liczby (ostatni przebieg PRAWDZIWEGO kodu, `CIV_HOLD_MS=60000`)

```
PASS F0 miasto gracza (ownerId 0) istnieje -- city0
PASS F1 fixture: kolejka w pamieci = [palisada, mury_kamienne, mury]
PASS F2 zapis starego stanu (persistSaveToSlot) ok
PASS F3 zapis nie sanityzuje kolejki (3 etapy przed wczytaniem)
PASS W1a komunikat DOKLADNIE raz -- rise 1
PASS W1b tresc: "Usunięto 2 zbędne pozycje z kolejki produkcji (niższe etapy fortyfikacji; najwyższy etap zostaje). Koszt i postęp nie zostały zwrócone."
PASS W1c kolejka = ["mury"]
PASS W1d zrzut wykonany i komunikat widoczny w chwili zrzutu (visAfter disp=block, text=true, box w=560)
PASS W2 ponowne wczytanie: dokladnie jedno pojawienie -- rise 1, ["mury"]
PASS W3a zapis po wczytaniu zapisany
PASS W3b wczytanie nowego zapisu: zero komunikatu -- rise 0
PASS W3c kolejka = ["mury"]
PASS C1 brak pageerror i console.error -- 0
PASS C2 brak 404 i odpowiedzi HTML -- 0
Wynik: 14 PASS / 0 FAIL / czas 359 s
```

## Ocena punktu 4 (W32) po rundzie 3

- Logika (1 komunikat na wczytanie, treść, najwyższy etap zostaje, zero komunikatu po zapisie czystej kolejki, mutacje czerwone): PASS (1 przebieg po poprawce + 2 przebiegi mutacji na nowym skrypcie; r2 14/0 i Evaluator 13/1 jako historia).
- Widoczność na ekranie (W1, 1440×900, bez menu): PASS dla zdarzenia W1 — zrzut obejrzany, komunikat widoczny.
- Zakres NIE objęty: powtarzalność N≥3, widoczność przy menu/panelu (z-index 600/9950), historyczny plik zapisu, czas 6 s w kopii produkcyjnej (zmieniony na 60 s tylko do zrzutu).

## Blokady

1. Powtarzalność skryptu: NIE_ZMIERZONO N≥3 (wykonano 2 przebiegi kodu z poprawką).
2. Historyczny zapis z kolejką sprzed FALI 664: NIE_ZMIERZONO, czy istnieje artefakt.
3. Widoczność przy menu/panelu: NIE_ZMIERZONO.

## RUNDY

3/5 (r3 = odpowiedzi na zarzuty r2).

## NASTĘPNY KROK

Evaluator (SONNET) — weryfikacja: poprawki zarzutów 1–4 (`77827ac03`), wynik 14/0 po poprawce, mutacje 10/4 i 8/6. Decyzja orkiestratora: PASS punktu 4 z zastrzeżeniami z tej sekcji, albo osobna runda na powtarzalność (N≥3) i scenariusz z menu.

## DEPLOY/PUSH

NIE WYKONANO (operator nie integruje, nie deployuje i nie pushuje na main).
