# AutoBot Operator — runda 4: mapa i baseline sąsiednich testów

TEMAT: `R-ARMY-COMMANDER-UNIT-MARKERS-20261028`  
RUNDA OPERATORA: 4/5  
DATA: 2026-10-28  
BAZA: `origin/main` = `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`  
WORKTREE: `/tmp/the-game-commander-markers-20261028`  
BRANCH: `codex/R-ARMY-COMMANDER-UNIT-MARKERS-20261028-integration`  
ZAKRES KODU PRODUKTU W R4: bez zmian względem r3.

## Wynik: gotowa mapa i render jednostki

Najpierw startowałem produkcyjny build Chromium z seedem `20261028`. Start był zablokowany: seed przekracza maksymalną dopuszczalną wartość `999999`, przycisk „ROZPOCZNIJ GRĘ” pozostał disabled, a Playwright zakończył klik timeoutem po 30 s. Generator mapy nie wystartował. Powtórzyłem z poprawnym seedem `202610` i rozmiarem mapy `Mały`.

Dokładny przebieg poprawnej próby (UTC, Chromium `/usr/bin/chromium`, viewport 1440×1000):

- `21:46:55.311` — start automatyzacji.
- `21:47:09.901` — generator: `6/10 · Rzeki — główne`, overlay `Upłynęło: 0:10`.
- `21:47:19.924` — generator: `7/10 · Rzeki — uzupełnianie`, overlay `Upłynęło: 0:20`.
- `21:47:30.253` — overlay zniknął; body pokazało `TURA 1 · 4000 P.N.E.` i akcję `ZAŁÓŻ MIASTO`.
- Całkowity czas od rozpoczęcia próby do ukończenia mapy: **35 945 ms**.
- Widziana odpowiedź HTTP 404: `GET /favicon.ico`; log serwera podglądu potwierdza tę ścieżkę. Brak innych błędów `pageerror`; komunikat konsoli 404 dotyczył faviconu.

Zrzut prawdziwej, wygenerowanej mapy z gry i jej pełnego HUD-u: `09-game-full-map.png`. Rozgrywka jest na ekranie wyboru pola pod pierwsze miasto, więc stan startowy nie ma jeszcze reprezentanta wojskowego ani Wodza; sam ten screenshot nie dowodzi odznaki.

Aby pokazać zatwierdzone zachowanie na mapie, wykonałem drugi render w Chromium/WebGL SwiftShader, w 1440×1000, z kamerą 51,34° (`atan((13−0.5)/10)`, czyli około 52°). Użyłem produkcyjnego `UnitRenderer.sync()` i rzeczywistego modelu `Wojownik`; widoczne heksy i HUD tworzą 7×7 mapową scenę testową. Reprezentant ma `isGeneral=false`; `StackDisplayInfo.vitalsByRepId` podaje mu `hasCommander=true`, `veteranStars=3`, a stos ma licznik ×2. Dzięki temu dowódca jest innym członkiem składu, a renderer tworzy gwiazdę na reprezentancie. Owner resolver dostarcza sygnet grecki; scena nie jest pełnym stanem gameplay ani pełnym `buildScene` z wygenerowanego świata. Jest renderowym harness’em z produkcyjnym modelem, agregowanym stanem stosu, produkcyjną tabliczką/emblematem i produkcyjnymi odznakami.

Zrzut harnessu: `08-unitrenderer-map-scene.png`. Jego źródło i HTML: `07-map-scene-preview.ts`, `07-map-scene-preview.html`. Pozycje pikselowe z obrazu 1440×1000 (komponenty złotego koloru, próg RGB użyty do pomiaru):

- emblem z pierścieniem: bbox `x=618..689`, `y=415..485`; pomiar FC: **71×71 px**;
- wewnętrzny sygnet: bbox `x=633..673`, `y=430..470` → **41×41 px**;
- gwiazda Wodza oddzielona od XP: bbox `x=710..729`, `y=399..416`; pomiar FC: **18×17 px**;
- każda z trzech gwiazdek XP: pomiar FC **11×10 px**, w jednym rzędzie poniżej gwiazdy Wodza.

Rozmiar w kodzie zmienia się z `0.20 * HEX_R` na `0.80 * HEX_R`; stosunek wynosi **4.0×**. Przy tej samej projekcji i kotwicy stary rozmiar odpowiadałby około **18×18 px** dla pierścienia względem obecnych 72×71 px; to wyliczenie geometryczne, nie drugi zrzut starej implementacji.

## Sąsiedni baseline i kandydat

Baseline utworzyłem bez checkoutu: `git archive 85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268` do `/tmp/commander-markers-baseline-85f8c5f`, z dependency symlinkiem do istniejącego `gra/node_modules`. Kandydat to worktree r4. Ten sam zestaw sześciu testów uruchomiono na obu stanach:

| Test | Czysty main | Kandydat | Delta |
|---|---:|---:|---:|
| `army-merge-bounce-test.cjs` | 4/4 | 4/4 | 0 |
| `army-merge-colocated-test.cjs` | 4/4 | 4/4 | 0 |
| `army-merge-stackgroupid-test.cjs` | 11,045/11,045 | 11,045/11,045 | 0 |
| `general-eligible-unit-roster-test.cjs` | 137/137 | 137/137 | 0 |
| `unit-info-card-badges-real-render-test.cjs` | 19/19 | 19/19 | 0 |
| `unit-renderer-overlay-sync-test.cjs` | 17/17 | 17/17 | 0 |
| **Razem** | **11,226 pass, 0 fail** | **11,226 pass, 0 fail** | **0 pass / 0 fail** |

Testy: `node gra/tools/<plik>.cjs`. Test `unit-info-card-badges-real-render-test.cjs` ma zapisany fallback do nieobecnego `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; surowe uruchomienie zakończyło się tym samym błędem środowiskowym po stronie baseline i kandydata. Do pomiaru obu uruchomiłem tymczasową kopię testu w katalogu `gra/tools/`, zmieniając wyłącznie fallback kopii na dostępny `/usr/bin/chromium`; kopia była usuwana w `finally` i nie weszła do diffu. W obu przebiegach 19/19 i brak błędów konsoli/pageerror.

Pierwsza próba zbiorcza także zatrzymała oba warianty na tym samym braku Chromium; pozostałe cztery testy w tej próbie zakończyły się z podanymi wynikami. Po przejściu testu browserowego przez temporary copy uruchomiłem osobno `unit-renderer-overlay-sync-test.cjs` na baseline i kandydacie; oba 17/17. Nie zaliczam pierwotnego błędu wykonania jako test fail produktu.

## Ograniczenia i przekazanie

- Zrzut `09-game-full-map.png` pokazuje wygenerowaną mapę i pełny UI, ale bez wojskowego Wodza.
- Zrzut `08-unitrenderer-map-scene.png` pokazuje komponenty odznaki na mapowej scenie testowej przez produkcyjny `UnitRenderer.sync()`, ale nie pełny gameplay state ani pełny renderer terenu `buildScene`.
- Sygnet w harnessie pochodzi z wstrzykniętego SVG testowego; logika owner resolvera i produkcyjna geometria tabliczki są uruchomione.
- 404 `/favicon.ico` jest brakującym zasobem serwera podglądu; aplikacja wygenerowała i wyświetliła mapę.
- Nie zmieniono kodu produktu w R4. Diff-check i hashy z R3 nie unieważniono.
- Raport nie wydaje werdyktu Evaluatora ani Final Control i nie autoryzuje integracji.
- Commit, push, integracja i deploy: nie wykonano.
