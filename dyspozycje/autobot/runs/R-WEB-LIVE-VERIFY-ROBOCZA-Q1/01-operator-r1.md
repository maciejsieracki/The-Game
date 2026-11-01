STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — weryfikacja na żywo, zero zmian w gra/src
TEMAT: R-WEB-LIVE-VERIFY-ROBOCZA-Q1
GOAL: zweryfikować w prawdziwej grze (Chromium + Playwright) bundle `gra-robocza/Gra-ROBOCZA.html` (MD5 `fc1af15093852a9f221f75a44c86296e`, baza `c99ac58cd`) i zamknąć „NIE_ZMIERZONO żywy”.
ZMIANY/COMMIT: tylko nowe narzędzia `gra/tools/live-verify-robocza-*.cjs` (8 plików) i `evidence/` (11 MB). Zero zmian w `gra/src`, `gra-robocza`, `WERSJE.md`, `rust-port`. SHA: patrz końcówka pliku / odpowiedź orkiestratora.

METODA
- Kreator sterowany realnym DOM-em (`.civ-newgame`). Ziarno wymuszone jednorazowym podstawieniem `Math.random` na kroku Start (newGameFlow.ts:2134) i potwierdzone logiem `[NewGame] Mapa: … seed=`.
- Hooki z bundla: `__cityStateStartUnitsTestDebug`, `__pracaPoolSaveLoadTestDebug`, `__buildRequestTestDebug`, `__eraTestDebug`, `__cityForestTestDebug`.
- Teren heksów nie jest dostępny przez hooki. Dlatego mapę odtworzono w node tym samym ziarnem, typem i udziałem lądu (`live-verify-robocza-offline.cjs`). To pomiar POŚREDNI. Zgodność mapy offline z żywą potwierdza identyczność położenia stolic. Zachodzi ona w pełni tylko dla Pangei (3/3). Dla Kontynenty i Wyspy położenia stolic zgadzają się częściowo (2/7–6/7), więc teren tam jest mniej pewny (patrz pkt 3).

TABELA
| # | Punkt | Status | Liczby / dowód |
|---|---|---|---|
| 1a | Kreator: domyślny udział lądu | ZGODNE | żywy DOM: Kontynenty 30%, Pangea 60%, Wyspy 50%, Ziemia bez wiersza. Powrót do typu i ręczna zmiana lądu a potem zmiana typu dają reset do domyślnego dla typu. Zapisane prefs („Bitwa automatyczna”) po przeładowaniu nie są nadpisane. 14/14 PASS. `punkt1-kreator-live.json`, `gate-wizard.txt`, `live-kreator-*.png` |
| 1b | Realny % lądu wygenerowanej mapy (Standardowy 168x120) | ZGODNE z uwagą | Kontynenty 30,0%, Wyspy 50,0%, Pangea 56,0–56,2% (cel 60%, −4 pp, konsekwentnie na 3 ziarnach). Pomiar pośredni (odtworzenie mapy). `analiza-offline-z-zywych-stanow.json` |
| 2 | Farma przed trzodą (Rodos/Korynt) | ZGODNE (E1); E2/E3 NIE_ZMIERZONO | Miasto 47,24 (seed 778899, Mały, 1 obywatel) leży na rzece; wokół 19 heksów lasu na/przy rzece. Profile „Zrównoważone” i „Żywność”, 25 tur: farma wchodzi w t1 (47,24 i 49,24, oba heksy łąki na rzece), trzoda w t2. Drugi wzorzec: farma t12, trzoda t13 na 49,25. Farma zawsze przed trzodą na każdym heksie. Kolejność jest identyczna dla obu profili. „Wolno wycinać las” OFF: zero wycinki (0 zdarzeń wyrębu). Wycinka+farma (E2/E3) nie zaszła ani razu, bo zawsze istniał heks łąki na rzece, więc wycinka nie była potrzebna. Fixture (las na całym R≤4, zob. niżej) też jej nie wywołał: farma na heksie miasta w t2 (po 2 gliniankach w t1), trzoda t3. Mierzalność E2/E3 wymaga miasta bez farmowalnego heksu poza lasem. `farma-*.json`, `punkt2-analiza-farma.json`, `gate-farma-*.txt` |
| 3 | AI na biegunach | ZGODNE z zastrzeżeniem | 10 map Standardowy: 0 stolic AI i 0 miast AI/MP na heksie polarnym, 0 startów gracza na polarnym. Mapy z polarem: Pangea 138–169 heksów, Wyspy 376–567, Kontynenty 0 (nie testują). 3 ziarna z parity (4242/7777/1001) pokryte dla każdego typu. Zastrzeżenie: teren z odtworzenia mapy; dla Wysp 4/7 i 3/7 stolic zgodnych z planem. `live-gen-*.json`, `analiza-offline-*.json` |
| 4 | Forty z automatu (R-WEB-AUTO-FORT-CLAIM-Q1) | NIE_ZMIERZONO | Zbudowano żywy scenariusz: 10 miast gracza założonych realnym `tryFoundPlayerCityAt` (limit baza 10 nie zablokował także 15 miast, `forty-live-k2.json`), polityka K2, `endTurn`. Po 2 turach 0 fortów i koniec tury zablokowany (`Wykonaj 1`, nowe miasta bez rozstrzygniętych zadań; hook `endTurn` tego nie omija). 40 tur nie zebrano. Diagnoza: potrzebny hook wyczerpania limitu (kreator oferuje 10/15/20) i omijający bramkę końca tury; dalej `fortNodes` jest w `snapshot.meta.fortNodes`. `forty-live-k2-stall.png`, `gate-forty.txt` |
| 5 | Rozproszenie stolic, stan PRZED poprawką | NIEZGODNE (narzędzie ≠ żywa gra przy domyślnej konfiguracji) | Żywa gra, 10 map: najbliższa para stolic 15–18 hex (15,15,15,15,16,17,17,17,17,18; mediana 16; 10/10 poniżej 25 i 30). `capital-spacing-measure` w domyślnej konfiguracji (gracz grecy, 5 typów) daje 15–43 (np. kontynenty2024 43, kontynenty1001 32). Konfiguracja żywej gry to rzymianie i 7 typów, więc wynik narzędzia nie jest porównywalny. Po dopasowaniu konfiguracji (mój skrypt offline) zgadza się capMin na 8/10 map (różnice: kontynenty2024 live 18 vs 17, kontynenty31337 live 17 vs 15); pełna zgodność położeń 7/7 stolic tylko na 3 mapach Pangea (pozostałe 2/7–6/7). Przyczyna rozbieżności położeń nieustalona (hipotezy: wejścia `cityNamesPools`/`preferredCivIds`, dodatkowe opcje generateMap w doStartGame: difficulty, civTypesCount, cityStatesCount; po ich dodaniu bez zmian). Wniosek: narzędzie jest wiarygodne co do rzędu wielkości (~15–18) tylko przy zgodnej konfiguracji; do pomiaru przed/po poprawką `R-WEB-CAPITAL-SPACING-FIX-Q1` użyć konfiguracji żywej (7 typów, rzymianie). Pomiar bazowy żywy to wiążąca wartość „przed”. |

DECYZJA_WYMAGANA / NOWE TEMATY (bez ABC z mojej strony)
1. Pangea: realny ląd 56% przy zadeklarowanych 60% (−4 pp na 3 ziarnach). Diagnoza wymaga `generateMap` przy landFraction 0.60; nie poprawiano (>20 linii/niejednoznaczne).
2. E2/E3 i forty wymagają hooków testowych (limit miast, bramka końca tury). Propozycja: temat na dopisanie hooków w `main.ts` plus wymagany build.
3. Rozbieżność położeń stolic narzędzie vs żywa gra (pkt 5) — osobna diagnoza.

POPRAWKI W gra/src: BRAK (żadna nie była potrzebna ani uzasadniona).

TESTY
- `gate-wizard.txt` EXIT=0 (14 pass, 0 fail). `gate-offline.txt` EXIT=0. `gate-spacing-tool.txt` EXIT=0.
- `gate-farma-*.txt`, `gate-forty.txt` — każdy z linią EXIT=.
- Generacja żywa: 10 map Standardowy, 49 miast każda, 0 błędów strony.
- Brak `npm run build/dev`; `node_modules` nie instalowano (esbuild skopiowany do scratchpad). Brak pushu.

BLOKADY
- Punkt 4 niezmierzony (powyżej).
- Pomiar terenu pośredni (odtworzenie mapy).
- `/tmp/claude-0/base` (źródło esbuild) zniknął w trakcie pracy; użyto kopii.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja tabeli i dowodów w `evidence/`).
DEPLOY/PUSH: NIE WYKONANO
